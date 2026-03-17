/**
 * Virtual Launch Pro — Cloudflare Worker
 * API surface: api.virtuallaunch.pro
 *
 * Architecture:
 * - Deny-by-default routing
 * - Contract-validated writes (to be implemented per route)
 * - R2 canonical storage (binding: R2_VIRTUAL_LAUNCH)
 * - D1 query layer (binding: DB)
 * - All routes return JSON
 *
 * Write pipeline (per VLP spec):
 * 1. Request received
 * 2. Contract validation
 * 3. Receipt stored in R2
 * 4. Canonical record updated
 * 5. D1 index updated
 * 6. Response returned
 */

/*
 * D1 Tables required (see workers/migrations/ for schema):
 *
 * accounts
 *   account_id TEXT PRIMARY KEY
 *   email TEXT UNIQUE NOT NULL
 *   first_name TEXT
 *   last_name TEXT
 *   phone TEXT
 *   timezone TEXT
 *   platform TEXT NOT NULL
 *   role TEXT NOT NULL DEFAULT 'member'
 *   status TEXT NOT NULL DEFAULT 'active'
 *   two_factor_enabled INTEGER NOT NULL DEFAULT 0
 *   totp_secret TEXT
 *   totp_pending_secret TEXT
 *   created_at TEXT NOT NULL
 *   updated_at TEXT
 *
 * sessions
 *   session_id TEXT PRIMARY KEY
 *   account_id TEXT NOT NULL
 *   email TEXT NOT NULL
 *   platform TEXT NOT NULL
 *   membership TEXT NOT NULL DEFAULT 'free'
 *   two_fa_verified INTEGER NOT NULL DEFAULT 0
 *   created_at TEXT NOT NULL
 *   expires_at TEXT NOT NULL
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function stub(method, path) {
  return json({ ok: true, stub: true, route: `${method} ${path}` });
}

function notFound(path) {
  return json({ ok: false, error: 'NOT_FOUND', path }, 404);
}

function methodNotAllowed(method, path) {
  return json({ ok: false, error: 'METHOD_NOT_ALLOWED', route: `${method} ${path}` }, 405);
}

/**
 * Match a URL pathname against a pattern that may contain :param segments.
 * Returns an object of extracted params on match, or null on no match.
 */
function matchPath(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ---------------------------------------------------------------------------
// Additional helpers
// ---------------------------------------------------------------------------

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function r2Put(bucket, key, data) {
  await bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' },
  });
  return true;
}

async function d1Run(db, sql, params) {
  return db.prepare(sql).bind(...params).run();
}

async function getSessionFromRequest(request, env) {
  let sessionId = null;

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.slice(7).trim();
  }

  if (!sessionId) {
    const cookieHeader = request.headers.get('Cookie') ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)vlp_session=([^;]+)/);
    if (match) sessionId = match[1];
  }

  if (!sessionId) return null;

  try {
    const now = new Date().toISOString();
    const session = await env.DB.prepare(
      'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?'
    ).bind(sessionId, now).first();
    return session ?? null;
  } catch {
    return null;
  }
}

async function requireSession(request, env) {
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return { error: json({ ok: false, error: 'UNAUTHORIZED' }, 401) };
  }
  return { session };
}

// ---------------------------------------------------------------------------
// JWT helpers (HMAC-SHA256)
// ---------------------------------------------------------------------------

function base64urlEncode(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  return `${signingInput}.${base64urlEncode(sig)}`;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      base64urlDecode(sigB64),
      enc.encode(signingInput)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Replace with Resend/SendGrid when email provider is confirmed
async function sendEmail(to, subject, htmlBody, _env) {
  console.log(`[sendEmail] to=${to} subject=${subject}`);
  console.log(`[sendEmail] body=${htmlBody}`);
  return true;
}

// ---------------------------------------------------------------------------
// TOTP helpers (RFC 6238, HMAC-SHA1, 30-second step, 6-digit code)
// ---------------------------------------------------------------------------

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(str) {
  str = str.toUpperCase().replace(/=+$/, '');
  const bytes = [];
  let bits = 0, value = 0;
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function totpCode(secret, counter) {
  const key = await crypto.subtle.importKey(
    'raw', base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false, ['sign']
  );
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // Write counter as big-endian 64-bit (high word 0 for normal timestamps)
  view.setUint32(4, counter >>> 0, false);
  const sig = await crypto.subtle.sign('HMAC', key, buf);
  const arr = new Uint8Array(sig);
  const offset = arr[arr.length - 1] & 0x0f;
  const code = (
    ((arr[offset] & 0x7f) << 24) |
    ((arr[offset + 1] & 0xff) << 16) |
    ((arr[offset + 2] & 0xff) << 8) |
    (arr[offset + 3] & 0xff)
  ) % 1_000_000;
  return code.toString().padStart(6, '0');
}

async function verifyTotp(secret, otp) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    if ((await totpCode(secret, counter + delta)) === otp) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Shared account + session helpers (used across auth flows)
// ---------------------------------------------------------------------------

async function upsertAccount(email, firstName, lastName, env) {
  const now = new Date().toISOString();
  const newAccountId = `ACCT_${crypto.randomUUID()}`;

  await d1Run(env.DB,
    `INSERT INTO accounts (account_id, email, first_name, last_name, platform, role, status, created_at)
     VALUES (?, ?, ?, ?, 'vlp', 'member', 'active', ?)
     ON CONFLICT(email) DO UPDATE SET
       first_name = excluded.first_name,
       last_name  = excluded.last_name,
       updated_at = ?`,
    [newAccountId, email, firstName, lastName, now, now]
  );

  // Fetch the canonical account_id (may differ from newAccountId if row existed)
  const row = await env.DB.prepare(
    'SELECT account_id FROM accounts WHERE email = ?'
  ).bind(email).first();
  const accountId = row.account_id;

  await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${accountId}.json`, {
    accountId, email, firstName, lastName,
    platform: 'vlp', role: 'member', status: 'active', updatedAt: now,
  });

  return { accountId, now };
}

async function createSession(accountId, email, env) {
  const sessionId = `SES_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const ttl = parseInt(env.SESSION_TTL_SECONDS ?? '86400', 10);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await d1Run(env.DB,
    `INSERT INTO sessions (session_id, account_id, email, platform, membership, created_at, expires_at)
     VALUES (?, ?, ?, 'vlp', 'free', ?, ?)`,
    [sessionId, accountId, email, now, expiresAt]
  );

  return { sessionId, expiresAt };
}

// ---------------------------------------------------------------------------
// Route table
// Each entry: { method, pattern, handler }
// method: HTTP verb string, or '*' to match any (used for webhooks)
// ---------------------------------------------------------------------------

const ROUTES = [

  // -------------------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------------------

  {
    method: 'GET', pattern: '/v1/auth/session',
    handler: async (_method, _pattern, _params, request, env) => {
      const { session, error } = await requireSession(request, env);
      if (error) return error;
      return json({
        ok: true,
        session: {
          account_id: session.account_id,
          email: session.email,
          membership: session.membership,
          platform: session.platform,
          expires_at: session.expires_at,
        },
      });
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/logout',
    handler: async (_method, _pattern, _params, request, env) => {
      const { session, error } = await requireSession(request, env);
      if (error) return error;
      try {
        await d1Run(env.DB, 'DELETE FROM sessions WHERE session_id = ?', [session.session_id]);
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Failed to delete session' }, 500);
      }
      return json({ ok: true, status: 'logged_out' });
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/google/start',
    handler: async (_method, _pattern, _params, _request, env) => {
      const state = crypto.randomUUID();
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
      url.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      return json({ ok: true, status: 'redirect_required', authorizationUrl: url.toString() });
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/google/callback',
    handler: async (_method, _pattern, _params, request, env) => {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'code and state required' }, 400);
      }

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });
        if (!tokenRes.ok) {
          return json({ ok: false, error: 'OAUTH_ERROR', message: 'Token exchange failed' }, 502);
        }
        const { access_token } = await tokenRes.json();

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!userRes.ok) {
          return json({ ok: false, error: 'OAUTH_ERROR', message: 'Failed to fetch user info' }, 502);
        }
        const user = await userRes.json();

        const { accountId } = await upsertAccount(user.email, user.given_name ?? '', user.family_name ?? '', env);
        const { sessionId } = await createSession(accountId, user.email, env);

        return json({
          ok: true,
          status: 'callback_completed',
          redirectTo: `${env.APP_BASE_URL}/app/dashboard`,
          session_id: sessionId,
        });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Google callback failed' }, 500);
      }
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/magic-link/request',
    handler: async (_method, _pattern, _params, request, env) => {
      const body = await parseBody(request);
      if (!body?.email || !body?.redirectUri) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'email and redirectUri required' }, 400);
      }
      const { email, redirectUri } = body;

      try {
        const expMinutes = parseInt(env.MAGIC_LINK_EXPIRATION_MINUTES ?? '15', 10);
        const exp = Math.floor(Date.now() / 1000) + expMinutes * 60;
        const token = await signJwt({ email, redirect_uri: redirectUri, exp }, env.JWT_SECRET);

        const link = `${env.APP_BASE_URL}/v1/auth/magic-link/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        await sendEmail(email, 'Your sign-in link', `<p>Click to sign in: <a href="${link}">${link}</a></p>`, env);

        const eventId = `EVT_${crypto.randomUUID()}`;
        await r2Put(env.R2_VIRTUAL_LAUNCH, `receipts/auth/${eventId}.json`, {
          email,
          requested_at: new Date().toISOString(),
          event: 'MAGIC_LINK_REQUESTED',
        });

        return json({ ok: true, status: 'requested', email });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Magic link request failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/magic-link/verify',
    handler: async (_method, _pattern, _params, request, env) => {
      const url = new URL(request.url);
      const token = url.searchParams.get('token');
      const email = url.searchParams.get('email');
      if (!token || !email) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'token and email required' }, 400);
      }

      try {
        const payload = await verifyJwt(token, env.JWT_SECRET);
        if (!payload) {
          return json({ ok: false, error: 'INVALID_TOKEN' }, 401);
        }
        if (payload.email !== email) {
          return json({ ok: false, error: 'INVALID_TOKEN' }, 401);
        }

        const { accountId } = await upsertAccount(email, '', '', env);
        const { sessionId } = await createSession(accountId, email, env);

        return json({
          ok: true,
          status: 'verified',
          redirectTo: `${env.APP_BASE_URL}/app/dashboard`,
          session_id: sessionId,
        });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Magic link verification failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/sso/oidc/start',
    handler: async (_method, _pattern, _params, _request, env) => {
      const state = crypto.randomUUID();
      const url = new URL(`${env.SSO_OIDC_ISSUER}/o/oauth2/v2/auth`);
      url.searchParams.set('client_id', env.SSO_OIDC_CLIENT_ID);
      url.searchParams.set('redirect_uri', env.SSO_OIDC_REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      return json({ ok: true, status: 'redirect_required', authorizationUrl: url.toString() });
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/sso/oidc/callback',
    handler: async (_method, _pattern, _params, request, env) => {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'code and state required' }, 400);
      }

      try {
        const tokenRes = await fetch(`${env.SSO_OIDC_ISSUER}/o/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: env.SSO_OIDC_CLIENT_ID,
            client_secret: env.SSO_OIDC_CLIENT_SECRET,
            redirect_uri: env.SSO_OIDC_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });
        if (!tokenRes.ok) {
          return json({ ok: false, error: 'OAUTH_ERROR', message: 'Token exchange failed' }, 502);
        }
        const { access_token } = await tokenRes.json();

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!userRes.ok) {
          return json({ ok: false, error: 'OAUTH_ERROR', message: 'Failed to fetch user info' }, 502);
        }
        const user = await userRes.json();

        const { accountId } = await upsertAccount(user.email, user.given_name ?? '', user.family_name ?? '', env);
        const { sessionId } = await createSession(accountId, user.email, env);

        return json({
          ok: true,
          status: 'callback_completed',
          redirectTo: `${env.APP_BASE_URL}/app/dashboard`,
          session_id: sessionId,
        });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'OIDC callback failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/sso/saml/start',
    handler: async (_method, _pattern, _params, _request, env) => {
      return json({ ok: true, status: 'redirect_required', authorizationUrl: env.SSO_SAML_IDP_SSO_URL });
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/sso/saml/acs',
    handler: async (_method, _pattern, _params, request, env) => {
      const body = await parseBody(request);
      if (!body?.samlResponse || !body?.relayState) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'samlResponse and relayState required' }, 400);
      }

      try {
        const decoded = atob(body.samlResponse);

        // Extract email from NameID or email attribute in XML
        let email = null;
        const nameIdMatch = decoded.match(/<(?:[^:>]+:)?NameID[^>]*>([^<]+)<\/(?:[^:>]+:)?NameID>/);
        if (nameIdMatch) email = nameIdMatch[1].trim();
        if (!email) {
          const attrMatch = decoded.match(/email[^>]*>([^<]+@[^<]+)</i);
          if (attrMatch) email = attrMatch[1].trim();
        }
        if (!email) {
          return json({ ok: false, error: 'BAD_REQUEST', message: 'Could not extract email from SAML response' }, 400);
        }

        const { accountId } = await upsertAccount(email, '', '', env);
        const { sessionId } = await createSession(accountId, email, env);

        return json({
          ok: true,
          status: 'assertion_consumed',
          redirectTo: `${env.APP_BASE_URL}/app/dashboard`,
          session_id: sessionId,
        });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'SAML ACS failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/auth/2fa/status/:account_id',
    handler: async (_method, _pattern, params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;
      try {
        const row = await env.DB.prepare(
          'SELECT two_factor_enabled FROM accounts WHERE account_id = ?'
        ).bind(params.account_id).first();
        if (!row) return json({ ok: false, error: 'NOT_FOUND' }, 404);
        return json({ ok: true, accountId: params.account_id, enabled: row.two_factor_enabled === 1 });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: '2FA status lookup failed' }, 500);
      }
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/2fa/enroll/init',
    handler: async (_method, _pattern, _params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      const body = await parseBody(request);
      if (!body?.accountId) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'accountId required' }, 400);
      }
      const { accountId } = body;

      try {
        // Generate TOTP secret: 32 random bytes, base32 encoded
        const secretBytes = crypto.getRandomValues(new Uint8Array(32));
        const secret = base32Encode(secretBytes);

        const row = await env.DB.prepare(
          'SELECT email FROM accounts WHERE account_id = ?'
        ).bind(accountId).first();
        if (!row) return json({ ok: false, error: 'NOT_FOUND' }, 404);

        await d1Run(env.DB,
          'UPDATE accounts SET totp_pending_secret = ? WHERE account_id = ?',
          [secret, accountId]
        );

        const issuer = env.TWOFA_TOTP_ISSUER ?? 'VirtualLaunchPro';
        const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(row.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return json({
          ok: true,
          status: 'enrollment_started',
          accountId,
          challenge: { otpauthUri, secret },
        });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: '2FA enrollment init failed' }, 500);
      }
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/2fa/enroll/verify',
    handler: async (_method, _pattern, _params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      const body = await parseBody(request);
      if (!body?.accountId || !body?.otpCode) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'accountId and otpCode required' }, 400);
      }
      const { accountId, otpCode } = body;

      if (String(otpCode).length !== 6) {
        return json({ ok: false, error: 'INVALID_OTP' }, 401);
      }

      try {
        const row = await env.DB.prepare(
          'SELECT totp_pending_secret, email FROM accounts WHERE account_id = ?'
        ).bind(accountId).first();
        if (!row?.totp_pending_secret) {
          return json({ ok: false, error: 'BAD_REQUEST', message: 'No pending enrollment found' }, 400);
        }

        const valid = await verifyTotp(row.totp_pending_secret, String(otpCode));
        if (!valid) return json({ ok: false, error: 'INVALID_OTP' }, 401);

        await d1Run(env.DB,
          `UPDATE accounts SET totp_secret = totp_pending_secret,
           totp_pending_secret = NULL, two_factor_enabled = 1 WHERE account_id = ?`,
          [accountId]
        );

        const now = new Date().toISOString();
        const existing2faEnroll = await env.R2_VIRTUAL_LAUNCH.get(`accounts_vlp/VLP_ACCT_${accountId}.json`);
        const record2faEnroll = existing2faEnroll ? await existing2faEnroll.json() : {};
        record2faEnroll.twoFactorEnabled = true;
        record2faEnroll.updatedAt = now;
        await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${accountId}.json`, record2faEnroll);

        return json({ ok: true, status: 'enrollment_verified', accountId });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: '2FA enrollment verify failed' }, 500);
      }
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/2fa/challenge/verify',
    handler: async (_method, _pattern, _params, request, env) => {
      const body = await parseBody(request);
      if (!body?.accountId || !body?.otpCode || !body?.sessionToken) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'accountId, otpCode, and sessionToken required' }, 400);
      }
      const { accountId, otpCode, sessionToken } = body;

      try {
        const row = await env.DB.prepare(
          'SELECT totp_secret FROM accounts WHERE account_id = ?'
        ).bind(accountId).first();
        if (!row?.totp_secret) {
          return json({ ok: false, error: 'BAD_REQUEST', message: '2FA not enrolled' }, 400);
        }

        const valid = await verifyTotp(row.totp_secret, String(otpCode));
        if (!valid) return json({ ok: false, error: 'INVALID_OTP' }, 401);

        await d1Run(env.DB,
          'UPDATE sessions SET two_fa_verified = 1 WHERE session_id = ?',
          [sessionToken]
        );

        return json({ ok: true, status: 'verified', accountId });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: '2FA challenge verify failed' }, 500);
      }
    },
  },

  {
    method: 'POST', pattern: '/v1/auth/2fa/disable',
    handler: async (_method, _pattern, _params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      const body = await parseBody(request);
      if (!body?.accountId || !body?.challengeToken) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'accountId and challengeToken required' }, 400);
      }
      const { accountId, challengeToken } = body;

      try {
        const row = await env.DB.prepare(
          'SELECT totp_secret, email FROM accounts WHERE account_id = ?'
        ).bind(accountId).first();
        if (!row?.totp_secret) {
          return json({ ok: false, error: 'BAD_REQUEST', message: '2FA not enrolled' }, 400);
        }

        const valid = await verifyTotp(row.totp_secret, String(challengeToken));
        if (!valid) return json({ ok: false, error: 'INVALID_OTP' }, 401);

        await d1Run(env.DB,
          'UPDATE accounts SET totp_secret = NULL, two_factor_enabled = 0 WHERE account_id = ?',
          [accountId]
        );

        const now = new Date().toISOString();
        const existing2faDisable = await env.R2_VIRTUAL_LAUNCH.get(`accounts_vlp/VLP_ACCT_${accountId}.json`);
        const record2faDisable = existing2faDisable ? await existing2faDisable.json() : {};
        record2faDisable.twoFactorEnabled = false;
        record2faDisable.updatedAt = now;
        await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${accountId}.json`, record2faDisable);

        return json({ ok: true, status: 'disabled', accountId });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: '2FA disable failed' }, 500);
      }
    },
  },

  // -------------------------------------------------------------------------
  // CONTACT
  // -------------------------------------------------------------------------

  { method: 'POST', pattern: '/v1/contact/submit', handler: stub },

  // -------------------------------------------------------------------------
  // ACCOUNTS
  // -------------------------------------------------------------------------

  {
    method: 'POST', pattern: '/v1/accounts',
    handler: async (_method, _pattern, _params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      const body = await parseBody(request);
      const { accountId, email, firstName, lastName, platform, role, source } = body ?? {};
      if (!accountId || !email || !firstName || !lastName || !platform || !role || !source) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'accountId, email, firstName, lastName, platform, role, source required' }, 400);
      }

      try {
        const eventId = `EVT_${crypto.randomUUID()}`;
        const now = new Date().toISOString();

        await r2Put(env.R2_VIRTUAL_LAUNCH, `receipts/accounts/${eventId}.json`, {
          accountId, email, event: 'ACCOUNT_CREATED', created_at: now, source,
        });

        await d1Run(env.DB,
          `INSERT OR IGNORE INTO accounts (account_id, email, first_name, last_name, platform, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
          [accountId, email, firstName, lastName, platform, role, now]
        );

        await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${accountId}.json`, {
          accountId, email, firstName, lastName, platform, role, status: 'active', createdAt: now,
        });

        return json({ ok: true, accountId, status: 'created' });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Account creation failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/accounts/by-email/:email',
    handler: async (_method, _pattern, params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      try {
        const row = await env.DB.prepare(
          'SELECT * FROM accounts WHERE email = ?'
        ).bind(decodeURIComponent(params.email)).first();
        if (!row) return json({ ok: false, error: 'NOT_FOUND' }, 404);
        return json({ ok: true, account: row });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Account lookup failed' }, 500);
      }
    },
  },

  {
    method: 'GET', pattern: '/v1/accounts/:account_id',
    handler: async (_method, _pattern, params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      try {
        const row = await env.DB.prepare(
          'SELECT * FROM accounts WHERE account_id = ?'
        ).bind(params.account_id).first();
        if (!row) return json({ ok: false, error: 'NOT_FOUND' }, 404);
        return json({ ok: true, account: row });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Account lookup failed' }, 500);
      }
    },
  },

  {
    method: 'PATCH', pattern: '/v1/accounts/:account_id',
    handler: async (_method, _pattern, params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      const body = await parseBody(request);
      if (!body) return json({ ok: false, error: 'BAD_REQUEST', message: 'Request body required' }, 400);

      const allowed = ['email', 'firstName', 'lastName', 'phone', 'status', 'timezone'];
      const dbCols = { email: 'email', firstName: 'first_name', lastName: 'last_name', phone: 'phone', status: 'status', timezone: 'timezone' };
      const sets = [];
      const vals = [];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          sets.push(`${dbCols[key]} = ?`);
          vals.push(body[key]);
        }
      }

      if (sets.length === 0) {
        return json({ ok: false, error: 'BAD_REQUEST', message: 'No updatable fields provided' }, 400);
      }

      const now = new Date().toISOString();
      sets.push('updated_at = ?');
      vals.push(now);
      vals.push(params.account_id);

      try {
        await d1Run(env.DB,
          `UPDATE accounts SET ${sets.join(', ')} WHERE account_id = ?`,
          vals
        );

        const existing = await env.R2_VIRTUAL_LAUNCH.get(`accounts_vlp/VLP_ACCT_${params.account_id}.json`);
        let record = existing ? await existing.json() : {};
        for (const key of allowed) {
          if (body[key] !== undefined) record[key] = body[key];
        }
        record.updatedAt = now;
        await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${params.account_id}.json`, record);

        return json({ ok: true, accountId: params.account_id, status: 'updated' });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Account update failed' }, 500);
      }
    },
  },

  {
    method: 'DELETE', pattern: '/v1/accounts/:account_id',
    handler: async (_method, _pattern, params, request, env) => {
      const { error } = await requireSession(request, env);
      if (error) return error;

      try {
        const now = new Date().toISOString();
        await d1Run(env.DB,
          'UPDATE accounts SET status = ?, updated_at = ? WHERE account_id = ?',
          ['archived', now, params.account_id]
        );

        const existing = await env.R2_VIRTUAL_LAUNCH.get(`accounts_vlp/VLP_ACCT_${params.account_id}.json`);
        let record = existing ? await existing.json() : {};
        record.status = 'archived';
        record.updatedAt = now;
        await r2Put(env.R2_VIRTUAL_LAUNCH, `accounts_vlp/VLP_ACCT_${params.account_id}.json`, record);

        return json({ ok: true, accountId: params.account_id, status: 'archived' });
      } catch (e) {
        return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Account archive failed' }, 500);
      }
    },
  },

  // -------------------------------------------------------------------------
  // MEMBERSHIPS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/memberships',                        handler: stub },
  { method: 'GET',   pattern: '/v1/memberships/by-account/:account_id', handler: stub },
  { method: 'GET',   pattern: '/v1/memberships/:membership_id',         handler: stub },
  { method: 'PATCH', pattern: '/v1/memberships/:membership_id',         handler: stub },

  // -------------------------------------------------------------------------
  // BILLING
  // -------------------------------------------------------------------------

  { method: 'GET',   pattern: '/v1/billing/config',                              handler: stub },
  { method: 'GET',   pattern: '/v1/pricing',                                     handler: stub },
  { method: 'POST',  pattern: '/v1/billing/customers',                           handler: stub },
  { method: 'GET',   pattern: '/v1/billing/payment-methods/:account_id',         handler: stub },
  { method: 'POST',  pattern: '/v1/billing/payment-methods/attach',              handler: stub },
  { method: 'POST',  pattern: '/v1/billing/setup-intents',                       handler: stub },
  { method: 'POST',  pattern: '/v1/billing/payment-intents',                     handler: stub },
  { method: 'POST',  pattern: '/v1/billing/subscriptions',                       handler: stub },
  { method: 'PATCH', pattern: '/v1/billing/subscriptions/:membership_id',        handler: stub },
  { method: 'POST',  pattern: '/v1/billing/subscriptions/:membership_id/cancel', handler: stub },
  { method: 'POST',  pattern: '/v1/billing/portal/sessions',                     handler: stub },
  { method: 'POST',  pattern: '/v1/billing/tokens/purchase',                     handler: stub },
  { method: 'GET',   pattern: '/v1/billing/receipts/:account_id',                handler: stub },

  // -------------------------------------------------------------------------
  // CHECKOUT
  // -------------------------------------------------------------------------

  { method: 'POST', pattern: '/v1/checkout/sessions', handler: stub },
  { method: 'GET',  pattern: '/v1/checkout/status',   handler: stub },

  // -------------------------------------------------------------------------
  // WEBHOOKS
  // Stripe and Twilio retry on non-200 — always return 200 immediately.
  // -------------------------------------------------------------------------

  { method: 'POST', pattern: '/v1/webhooks/stripe', handler: () => json({ ok: true, received: true }) },
  { method: 'POST', pattern: '/v1/webhooks/twilio', handler: () => json({ ok: true, received: true }) },

  // -------------------------------------------------------------------------
  // BOOKINGS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/bookings',                                    handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/by-account/:account_id',             handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/by-professional/:professional_id',   handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/:booking_id',                        handler: stub },
  { method: 'PATCH', pattern: '/v1/bookings/:booking_id',                        handler: stub },

  // -------------------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/profiles',                           handler: stub },
  { method: 'GET',   pattern: '/v1/profiles/public/:professional_id',   handler: stub },
  { method: 'GET',   pattern: '/v1/profiles/:professional_id',          handler: stub },
  { method: 'PATCH', pattern: '/v1/profiles/:professional_id',          handler: stub },

  // -------------------------------------------------------------------------
  // SUPPORT TICKETS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/support/tickets',                        handler: stub },
  { method: 'GET',   pattern: '/v1/support/tickets/by-account/:account_id', handler: stub },
  { method: 'GET',   pattern: '/v1/support/tickets/:ticket_id',             handler: stub },
  { method: 'PATCH', pattern: '/v1/support/tickets/:ticket_id',             handler: stub },

  // -------------------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/notifications/in-app',                      handler: stub },
  { method: 'GET',   pattern: '/v1/notifications/in-app',                      handler: stub },
  { method: 'GET',   pattern: '/v1/notifications/preferences/:account_id',     handler: stub },
  { method: 'PATCH', pattern: '/v1/notifications/preferences/:account_id',     handler: stub },
  { method: 'POST',  pattern: '/v1/notifications/sms/send',                    handler: stub },

  // -------------------------------------------------------------------------
  // TOKENS
  // -------------------------------------------------------------------------

  { method: 'GET', pattern: '/v1/tokens/balance/:account_id', handler: stub },
  { method: 'GET', pattern: '/v1/tokens/usage/:account_id',   handler: stub },

  // -------------------------------------------------------------------------
  // VLP PREFERENCES
  // -------------------------------------------------------------------------

  { method: 'GET',   pattern: '/v1/vlp/preferences/:account_id', handler: stub },
  { method: 'PATCH', pattern: '/v1/vlp/preferences/:account_id', handler: stub },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function route(method, pathname) {
  // Collect all routes that match the pathname (any method).
  const pathMatches = [];

  for (const entry of ROUTES) {
    const params = matchPath(entry.pattern, pathname);
    if (params === null) continue;

    if (entry.method === method) {
      return { matched: true, handler: entry.handler, pattern: entry.pattern, params };
    }
    pathMatches.push(entry);
  }

  if (pathMatches.length > 0) {
    // Path matched but not the method.
    return { matched: false, reason: 'METHOD_NOT_ALLOWED' };
  }

  return { matched: false, reason: 'NOT_FOUND' };
}

// ---------------------------------------------------------------------------
// Fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Handle CORS preflight.
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const result = route(method, pathname);

    if (!result.matched) {
      if (result.reason === 'METHOD_NOT_ALLOWED') {
        return methodNotAllowed(method, pathname);
      }
      return notFound(pathname);
    }

    return result.handler(method, result.pattern, result.params, request, env, ctx);
  },
};
