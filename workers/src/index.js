/**
 * ============================================================
 * Worker: virtuallaunch-pro-api
 * Domain: https://api.virtuallaunch.pro
 * Purpose: VA Starter Track API (Auth + Stripe webhook ingestion + VA publishing + directory read model)
 *
 * Architecture Contract:
 * - Storage authority: R2_VIRTUAL_LAUNCH
 * - Write order (mutations): (signature/cookie) → receipt → canonical → projection (optional)
 * - Deny-by-default routing
 * - Client-submitted identity is never trusted
 *
 * Supported Routes (Alphabetical):
 * - GET /auth/confirm
 * - GET /auth/session
 * - GET /directory
 * - GET /health
 * - GET /support/status
 * - POST /auth/login
 * - POST /auth/logout
 * - POST /forms/support/message
 * - POST /forms/va/publish
 * - POST /stripe/webhook
 *
 * Required env:
 * - R2 binding: R2_VIRTUAL_LAUNCH
 * - Secret: AUTH_SIGNING_KEY
 *
 * Compatibility Date: set in wrangler.toml (required)
 * ============================================================
 */

const ALLOWED_ORIGINS = new Set([
  "https://virtuallaunch.pro",
]);

const COOKIE_NAME = "vlp_session";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ------------------------------------------------------------
    // Guard: deny-by-default methods (expand per-route only)
    // ------------------------------------------------------------
    if (!env?.R2_VIRTUAL_LAUNCH) return json({ error: "Missing R2_VIRTUAL_LAUNCH binding" }, 500);
    if (!env?.AUTH_SIGNING_KEY) return json({ error: "Missing AUTH_SIGNING_KEY" }, 500);

    if (!allowedMethod(request.method)) {
      return withCors(request, json({ error: "Method not allowed", method: request.method }, 405));
    }

    // ------------------------------------------------------------
    // CORS preflight
    // ------------------------------------------------------------
    if (request.method === "OPTIONS") {
      return withCors(request, new Response(null, { status: 204 }));
    }

    // ------------------------------------------------------------
    // GET /health
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/health") {
      return withCors(request, json({ ok: true, route: "health" }, 200));
    }

    // ------------------------------------------------------------
    // GET /support/status (read model)
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/support/status") {
      const supportId = safeString(url.searchParams.get("supportId"));
      if (!supportId) return withCors(request, json({ error: "Missing supportId" }, 400));

      const key = `support/${supportId}.json`;
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
      if (!obj) return withCors(request, json({ error: "Not found", supportId }, 404));

      let s;
      try {
        s = JSON.parse(await obj.text());
      } catch {
        return withCors(request, json({ error: "Invalid support object", supportId }, 500));
      }

      return withCors(
        request,
        json(
          {
            latestUpdate: s?.latestUpdate || "",
            status: s?.status || "",
            supportId,
            updatedAt: s?.updatedAt || "",
          },
          200
        )
      );
    }

    // ------------------------------------------------------------
    // GET /directory
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/directory") {
      const key = "va/directory/index.json";
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
      if (!obj) return withCors(request, json({ directory: [] }, 200));

      return withCors(
        request,
        new Response(await obj.text(), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        })
      );
    }

    // ------------------------------------------------------------
    // POST /auth/login
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/auth/login") {
      const body = await safeJson(request);
      if (!body.ok) return withCors(request, json({ error: "Invalid JSON" }, 400));

      const keys = Object.keys(body.data || {}).sort();
      if (keys.length !== 1 || keys[0] !== "email") {
        return withCors(request, json({ error: "Invalid payload", required: ["email"] }, 400));
      }

      const email = normalizeEmail(body.data.email);
      if (!email) return withCors(request, json({ error: "Invalid email" }, 400));

      // Resolve canonical accountId server-side.
      const accountId = await resolveAccountIdByEmailBestEffort({ env, email });

      // Create a single-use login token.
      const token = base64url(randomBytes(32));
      const tokenHash = await sha256Hex(token);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      const tokenObj = {
        accountId: accountId || null,
        createdAt: now.toISOString(),
        email,
        expiresAt,
        tokenHash,
      };

      await env.R2_VIRTUAL_LAUNCH.put(`auth/login-tokens/${tokenHash}.json`, JSON.stringify(tokenObj, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      // In production you would email the link. For now we log it.
      console.log("MAGIC_LINK", {
        email,
        confirmUrl: `${url.origin}/auth/confirm?token=${token}`,
      });

      return withCors(request, json({ ok: true }, 200));
    }

    // ------------------------------------------------------------
    // GET /auth/confirm
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/auth/confirm") {
      const token = url.searchParams.get("token");
      if (!token) return redirect("https://virtuallaunch.pro/va/login?error=invalid_or_expired", 302);

      const tokenHash = await sha256Hex(token);
      const tokenKey = `auth/login-tokens/${tokenHash}.json`;
      const tokenObjRaw = await env.R2_VIRTUAL_LAUNCH.get(tokenKey);
      if (!tokenObjRaw) return redirect("https://virtuallaunch.pro/va/login?error=invalid_or_expired", 302);

      let tokenObj;
      try {
        tokenObj = JSON.parse(await tokenObjRaw.text());
      } catch {
        return redirect("https://virtuallaunch.pro/va/login?error=invalid_or_expired", 302);
      }

      const nowIso = new Date().toISOString();
      if (tokenObj?.usedAt) return redirect("https://virtuallaunch.pro/va/login?error=invalid_or_expired", 302);
      if (!tokenObj?.expiresAt || nowIso > tokenObj.expiresAt) return redirect("https://virtuallaunch.pro/va/login?error=invalid_or_expired", 302);

      const accountId = typeof tokenObj?.accountId === "string" ? tokenObj.accountId : null;

      const usedTokenObj = { ...tokenObj, usedAt: nowIso };
      await env.R2_VIRTUAL_LAUNCH.put(tokenKey, JSON.stringify(usedTokenObj, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      const sessionId = base64url(randomBytes(24));
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const sessionObj = {
        accountId,
        createdAt: nowIso,
        expiresAt: sessionExpiresAt,
        sessionId,
      };

      await env.R2_VIRTUAL_LAUNCH.put(`auth/sessions/${sessionId}.json`, JSON.stringify(sessionObj, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      const cookieValue = await signSessionCookie({ env, sessionId, expiresAt: sessionExpiresAt });
      const res = redirect("https://virtuallaunch.pro/va/dashboard", 302);
      res.headers.append(
        "Set-Cookie",
        serializeCookie(COOKIE_NAME, cookieValue, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
          sameSite: "Lax",
          secure: true,
        })
      );

      return res;
    }

    // ------------------------------------------------------------
    // GET /auth/session
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/auth/session") {
      const session = await requireSession({ request, env, allowAnonymous: true });
      if (!session.authenticated) return withCors(request, json({ authenticated: false }, 200));

      return withCors(
        request,
        json(
          {
            accountId: session.accountId,
            authenticated: true,
            expiresAt: session.expiresAt,
          },
          200
        )
      );
    }

    // ------------------------------------------------------------
    // POST /auth/logout
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/auth/logout") {
      const session = await requireSession({ request, env, allowAnonymous: true });

      if (session?.sessionId) {
        const key = `auth/sessions/${session.sessionId}.json`;
        const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
        if (obj) {
          try {
            const s = JSON.parse(await obj.text());
            const next = { ...s, revokedAt: new Date().toISOString() };
            await env.R2_VIRTUAL_LAUNCH.put(key, JSON.stringify(next, null, 2), {
              httpMetadata: { contentType: "application/json; charset=utf-8" },
            });
          } catch {
            // ignore
          }
        }
      }

      const res = withCors(request, json({ ok: true }, 200));
      res.headers.append(
        "Set-Cookie",
        serializeCookie(COOKIE_NAME, "", {
          httpOnly: true,
          maxAge: 0,
          path: "/",
          sameSite: "Lax",
          secure: true,
        })
      );
      return res;
    }

    // ------------------------------------------------------------
    // POST /forms/support/message
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/forms/support/message") {
      const session = await requireSession({ request, env, allowAnonymous: false });
      if (!session.authenticated) return withCors(request, json({ error: "Unauthorized" }, 401));

      const contentType = String(request.headers.get("content-type") || "");
      if (!contentType.includes("application/json")) {
        return withCors(request, json({ error: "Unsupported content-type" }, 415));
      }

      const body = await safeJson(request);
      if (!body.ok) return withCors(request, json({ error: "Invalid JSON" }, 400));

      const validated = validateSupportMessagePayload(body.data);
      if (!validated.ok) return withCors(request, json({ error: "Invalid payload", detail: validated.error }, 400));

      const eventId = validated.payload.eventId;
      const receiptKey = `receipts/forms/${eventId}.json`;
      const existingReceipt = await env.R2_VIRTUAL_LAUNCH.get(receiptKey);
      if (existingReceipt) {
        const supportId = await supportIdFromEventId(eventId);
        return withCors(request, json({ ok: true, deduped: true, eventId, supportId }, 200));
      }

      await env.R2_VIRTUAL_LAUNCH.put(receiptKey, JSON.stringify(validated.payload, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      const now = new Date().toISOString();
      const supportId = await supportIdFromEventId(eventId);
      const supportKey = `support/${supportId}.json`;

      const existing = await env.R2_VIRTUAL_LAUNCH.get(supportKey);
      let support = null;
      if (existing) {
        try {
          support = JSON.parse(await existing.text());
        } catch {
          support = null;
        }
      }

      const messageEntry = {
        createdAt: now,
        message: validated.payload.message,
        subject: validated.payload.subject,
      };

      const createdAt = support?.createdAt && typeof support.createdAt === "string" ? support.createdAt : now;
      const messages = Array.isArray(support?.messages) ? support.messages.slice(0) : [];
      messages.push(messageEntry);

      const nextSupport = {
        accountId: session.accountId,
        category: validated.payload.category,
        createdAt,
        email: validated.payload.email,
        eventId,
        issueType: validated.payload.issueType,
        latestUpdate: validated.payload.message,
        messages,
        name: validated.payload.name,
        priority: validated.payload.priority,
        relatedOrderId: validated.payload.relatedOrderId || null,
        status: support?.status || "open / new",
        subject: validated.payload.subject,
        supportId,
        tokenId: validated.payload.tokenId || null,
        updatedAt: now,
        urgency: validated.payload.urgency,
        utm: validated.payload.utm || null,
        clickup: support?.clickup || null,
      };

      await env.R2_VIRTUAL_LAUNCH.put(supportKey, JSON.stringify(nextSupport, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      const projectionEnabled = env.CLICKUP_PROJECTION_ENABLED === "true";
      let projection = { enabled: projectionEnabled, attempted: false, ok: false, taskId: null, error: null };

      if (projectionEnabled) {
        projection.attempted = true;
        try {
          const r = await projectSupportToClickUp({ env, supportKey, support: nextSupport });
          projection.ok = true;
          projection.taskId = r?.taskId || null;
        } catch (err) {
          projection.ok = false;
          projection.error = String(err?.message || err);

          const failedSupport = {
            ...nextSupport,
            clickup: {
              ...(nextSupport?.clickup || {}),
              error: projection.error,
              updatedAt: new Date().toISOString(),
            },
          };

          await env.R2_VIRTUAL_LAUNCH.put(supportKey, JSON.stringify(failedSupport, null, 2), {
            httpMetadata: { contentType: "application/json; charset=utf-8" },
          });
        }
      }

      return withCors(request, json({ ok: true, projection, supportId }, 200));
    }

    // ------------------------------------------------------------
    // POST /forms/va/publish
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/forms/va/publish") {
      const session = await requireSession({ request, env, allowAnonymous: false });
      if (!session.authenticated) return withCors(request, json({ error: "Unauthorized" }, 401));

      const contentType = String(request.headers.get("content-type") || "");
      if (!contentType.includes("application/x-www-form-urlencoded")) {
        return withCors(request, json({ error: "Unsupported content-type" }, 415));
      }

      const raw = await request.text();
      const params = new URLSearchParams(raw);

      const eventId = safeString(params.get("eventId"));
      const slug = safeString(params.get("slug"));

      if (!eventId) return withCors(request, json({ error: "Missing eventId" }, 400));
      if (!slug) return withCors(request, json({ error: "Missing slug" }, 400));

      const receiptKey = `receipts/forms/${eventId}.json`;
      const existingReceipt = await env.R2_VIRTUAL_LAUNCH.get(receiptKey);
      if (existingReceipt) {
        return withCors(request, json({ ok: true, deduped: true, eventId, slug }, 200));
      }

      await env.R2_VIRTUAL_LAUNCH.put(receiptKey, raw, {
        httpMetadata: { contentType: "application/x-www-form-urlencoded; charset=utf-8" },
      });

      const now = new Date().toISOString();
      const accountId = session.accountId;

      const profile = {
        accountId,
        createdAt: now,
        eventId,
        slug,
        updatedAt: now,
        form: Object.fromEntries([...params.entries()].sort(([a], [b]) => a.localeCompare(b))),
      };

      await env.R2_VIRTUAL_LAUNCH.put(`va/pages/${slug}.json`, JSON.stringify(profile, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      await upsertDirectoryIndex({ env, accountId, slug, updatedAt: now });

      return withCors(request, json({ ok: true, slug }, 200));
    }

    // ------------------------------------------------------------
    // POST /stripe/webhook
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/stripe/webhook") {
      const signature = request.headers.get("stripe-signature");
      if (!signature) return json({ error: "Missing stripe-signature header" }, 400);
      if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

      const rawBody = await request.arrayBuffer();

      const verified = await verifyStripeSignature({
        rawBody,
        secret: env.STRIPE_WEBHOOK_SECRET,
        signatureHeader: signature,
        toleranceSeconds: 300,
      });

      if (!verified.ok) {
        return json({ error: "Invalid Stripe signature", reason: verified.reason }, 400);
      }

      let evt;
      try {
        evt = JSON.parse(new TextDecoder().decode(new Uint8Array(rawBody)));
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const eventId = evt?.id;
      const eventType = evt?.type;

      if (!eventId || typeof eventId !== "string") return json({ error: "Missing event id" }, 400);
      if (!eventType || typeof eventType !== "string") return json({ error: "Missing event type" }, 400);

      const receiptKey = `receipts/stripe/${eventId}.json`;
      const existingReceipt = await env.R2_VIRTUAL_LAUNCH.get(receiptKey);
      if (existingReceipt) {
        return json({ ok: true, deduped: true, eventId, eventType }, 200);
      }

      await env.R2_VIRTUAL_LAUNCH.put(receiptKey, rawBody, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      const allowedTypes = new Set([
        "charge.succeeded",
        "checkout.session.completed",
        "payment_intent.succeeded",
      ]);

      if (!allowedTypes.has(eventType)) {
        return json({ ok: true, storedReceipt: true, ignoredType: eventType, eventId }, 200);
      }

      if (eventType === "checkout.session.completed") {
        return await handleCheckoutSessionCompleted({ env, evt });
      }

      if (eventType === "payment_intent.succeeded") {
        return await handlePaymentIntentSucceeded({ env, evt, eventId });
      }

      if (eventType === "charge.succeeded") {
        return await handleChargeSucceeded({ env, evt, eventId });
      }

      return json({ ok: true, eventId, eventType, storedReceipt: true }, 200);
    }

    return withCors(request, json({ error: "Not found", path: url.pathname }, 404));
  },
};

// ============================================================
// Helpers (Alphabetical)
// ============================================================

function clampString(v, maxLen) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

async function supportIdFromEventId(eventId) {
  const h = await sha256Hex(String(eventId || ""));
  return `SUP-${String(h).slice(0, 8).toUpperCase()}`;
}

function validateSupportMessagePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Payload must be an object" };

  const allowed = new Set([
    "category",
    "email",
    "eventId",
    "issueType",
    "message",
    "name",
    "priority",
    "relatedOrderId",
    "sessionToken",
    "subject",
    "tokenId",
    "urgency",
  ]);

  const keys = Object.keys(input).sort();
  for (const k of keys) {
    if (k.startsWith("utm_")) continue;
    if (!allowed.has(k)) return { ok: false, error: `Unknown field: ${k}` };
  }

  const payload = {
    category: clampString(input.category, 80),
    email: normalizeEmail(input.email),
    eventId: clampString(input.eventId, 120),
    issueType: clampString(input.issueType, 80),
    message: clampString(input.message, 5000),
    name: clampString(input.name, 120),
    priority: clampString(input.priority, 40),
    subject: clampString(input.subject, 160),
    urgency: clampString(input.urgency, 60),
  };

  // Required (Alphabetical)
  if (!payload.category) return { ok: false, error: "Missing category" };
  if (!payload.email) return { ok: false, error: "Missing email" };
  if (!payload.eventId) return { ok: false, error: "Missing eventId" };
  if (!payload.issueType) return { ok: false, error: "Missing issueType" };
  if (!payload.message) return { ok: false, error: "Missing message" };
  if (!payload.name) return { ok: false, error: "Missing name" };
  if (!payload.priority) return { ok: false, error: "Missing priority" };
  if (!payload.subject) return { ok: false, error: "Missing subject" };
  if (!payload.urgency) return { ok: false, error: "Missing urgency" };

  // Optional (Alphabetical)
  const relatedOrderId = clampString(input.relatedOrderId, 160);
  const sessionToken = clampString(input.sessionToken, 240);
  const tokenId = clampString(input.tokenId, 160);

  if (relatedOrderId) payload.relatedOrderId = relatedOrderId;
  if (sessionToken) payload.sessionToken = sessionToken;
  if (tokenId) payload.tokenId = tokenId;

  const utm = {};
  for (const k of keys) {
    if (!k.startsWith("utm_")) continue;
    const v = clampString(input[k], 200);
    if (v) utm[k] = v;
  }
  if (Object.keys(utm).length) payload.utm = Object.fromEntries(Object.entries(utm).sort(([a], [b]) => a.localeCompare(b)));

  return { ok: true, payload };
}


function allowedMethod(method) {
  return ["GET", "OPTIONS", "POST"].includes(String(method || ""));
}

function base64url(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlToBytes(s) {
  const padded = String(s || "").replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s || "").length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bufToHex(buf) {
  let s = "";
  for (const b of buf) s += b.toString(16).padStart(2, "0");
  return s;
}

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

async function hmacSha256B64({ secret, message }) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64url(new Uint8Array(sigBuf));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function normalizeEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s.includes("@")) return "";
  if (s.length > 254) return "";
  return s;
}

function parseCookies(header) {
  const out = {};
  const h = String(header || "");
  if (!h) return out;
  for (const part of h.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

function redirect(location, status = 302) {
  return new Response(null, {
    status,
    headers: { Location: location },
  });
}

function safeString(v) {
  const s = String(v || "").trim();
  return s ? s : "";
}

async function safeJson(request) {
  try {
    const text = await request.text();
    if (!text) return { ok: false };
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false };
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(new Uint8Array(digest));
}

function serializeCookie(name, value, opts) {
  const parts = [`${name}=${value}`];
  if (opts?.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts?.path) parts.push(`Path=${opts.path}`);
  if (opts?.httpOnly) parts.push("HttpOnly");
  if (opts?.secure) parts.push("Secure");
  if (opts?.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function withCors(request, response) {
  const origin = getAllowedOrigin(request);
  if (!origin) return response;

  const h = new Headers(response.headers);
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "content-type");
  h.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}

// ============================================================
// Auth (Alphabetical)
// ============================================================

async function requireSession({ request, env, allowAnonymous }) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const raw = cookies[COOKIE_NAME];
  if (!raw) return { authenticated: false };

  const verified = await verifySessionCookie({ env, cookieValue: raw });
  if (!verified.ok) return { authenticated: false };

  const sessionId = verified.sessionId;
  const key = `auth/sessions/${sessionId}.json`;
  const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
  if (!obj) return { authenticated: false };

  let session;
  try {
    session = JSON.parse(await obj.text());
  } catch {
    return { authenticated: false };
  }

  const nowIso = new Date().toISOString();
  if (session?.revokedAt) return { authenticated: false };
  if (!session?.expiresAt || nowIso > session.expiresAt) return { authenticated: false };

  const accountId = typeof session?.accountId === "string" ? session.accountId : null;
  if (!accountId) return allowAnonymous ? { authenticated: false } : { authenticated: false };

  return {
    accountId,
    authenticated: true,
    expiresAt: session.expiresAt,
    sessionId,
  };
}

async function resolveAccountIdByEmailBestEffort({ env, email }) {
  const key = `auth/email-index/${email}.json`;
  const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
  if (!obj) return null;
  try {
    const j = JSON.parse(await obj.text());
    return typeof j?.accountId === "string" ? j.accountId : null;
  } catch {
    return null;
  }
}

async function signSessionCookie({ env, sessionId, expiresAt }) {
  const payload = { expiresAt, sessionId };
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSha256B64({ secret: env.AUTH_SIGNING_KEY, message: payloadB64 });
  return `${payloadB64}.${sig}`;
}

async function verifySessionCookie({ env, cookieValue }) {
  const parts = String(cookieValue || "").split(".");
  if (parts.length !== 2) return { ok: false };
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return { ok: false };

  const expected = await hmacSha256B64({ secret: env.AUTH_SIGNING_KEY, message: payloadB64 });
  if (!timingSafeEqual(expected, sig)) return { ok: false };

  let payload;
  try {
    const jsonText = new TextDecoder().decode(base64urlToBytes(payloadB64));
    payload = JSON.parse(jsonText);
  } catch {
    return { ok: false };
  }

  const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : null;
  const expiresAt = typeof payload?.expiresAt === "string" ? payload.expiresAt : null;
  if (!sessionId || !expiresAt) return { ok: false };

  if (new Date().toISOString() > expiresAt) return { ok: false };

  return { ok: true, expiresAt, sessionId };
}

// ============================================================
// Directory (Alphabetical)
// ============================================================

async function upsertDirectoryIndex({ env, accountId, slug, updatedAt }) {
  const key = "va/directory/index.json";
  const obj = await env.R2_VIRTUAL_LAUNCH.get(key);

  let directory = [];
  if (obj) {
    try {
      const parsed = JSON.parse(await obj.text());
      directory = Array.isArray(parsed?.directory) ? parsed.directory : Array.isArray(parsed) ? parsed : [];
    } catch {
      directory = [];
    }
  }

  const next = directory.filter((x) => x && x.slug !== slug);
  next.push({ accountId, slug, updatedAt });
  next.sort((a, b) => String(a.slug || "").localeCompare(String(b.slug || "")));

  await env.R2_VIRTUAL_LAUNCH.put(key, JSON.stringify({ directory: next }, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}

// ============================================================
// ClickUp (Support)
// ============================================================

async function projectSupportToClickUp({ env, supportKey, support }) {
  if (!env.CLICKUP_API_KEY) throw new Error("Missing CLICKUP_API_KEY");
  if (!env.CLICKUP_SUPPORT_LIST_ID) throw new Error("Missing CLICKUP_SUPPORT_LIST_ID");

  const CF = {
    supportActionRequired: "aac0816d-0e05-4c57-8196-6098929f35ac",
    supportEmail: "7f547901-690d-4f39-8851-d19e19f87bf8",
    supportEventId: "8e8b453e-01f3-40fe-8156-2e9d9633ebd6",
    supportLatestUpdate: "03ebc8ba-714e-4f7c-9748-eb1b62e657f7",
    supportPriority: "b96403c7-028a-48eb-b6b1-349f295244b5",
    supportType: "e09d9f53-4f03-49fe-8c5f-abe3b160b167",
  };

  const actionRequiredOptionId = {
    Acknowledge: "165c6aac-bb5a-420c-a64b-bca47b769e21",
    Close: "dc9e42fb-a1ef-4b3e-a037-cc5b41d33209",
    Resolve: "8c45bf38-2cc7-45bc-9c48-9dae275938a3",
    Triage: "a233b302-7779-4136-bb37-eff6cd5e41cc",
  };

  const priorityOptionId = {
    Critical: "c8862a36-00cd-41b2-94be-22120bfe2f0b",
    High: "8f155d97-8512-489f-88c6-77973e76e3c8",
    Low: "fe8469b4-0ee1-4fa0-993d-bc9458f1ab6d",
    Normal: "ea5fda7f-7c60-4e72-9034-0434836950a2",
  };

  // Map our issueType to the closest Support Type dropdown option.
  // (We prefer exact match; fall back to Ticket - Intake.)
  const typeOptionId = {
    "Appt - Demo": "5f847513-d4dd-4e45-af47-b229dbfbbb8f",
    "Appt - Exit / Offboarding": "a8d9484d-df52-42fa-a2c8-e4df801e398e",
    "Appt - Intro": "75f47f09-fa16-40d4-9be3-583102361799",
    "Appt - Onboarding": "6ac3e8dc-ca14-4c84-b4da-a8fbefa6ad13",
    "Appt - Support": "27d991dd-a5ee-4713-a844-ddc53650756b",
    "Ticket - Agreement": "f5e26bdf-adb1-4ad4-a9f7-97f63a6d2977",
    "Ticket - Intake": "b3ae14e7-981d-4756-a14f-7d9a901392d0",
    "Ticket - Offer": "fcd840f5-2a38-43db-92c9-611403fa90f6",
    "Ticket - Payment": "27f0a9ac-ba0f-4d04-bb02-0a90acdadfac",
    "Ticket - VA Landing Page Setup": "84c7bb75-1f12-48b2-82d5-6b4f76db62a7",
    "Ticket - Welcome": "349565f0-90d8-4c35-be41-62cd33ef3398",
  };

  const supportTypeGuess = support?.issueType ? `Ticket - ${String(support.issueType).trim()}` : "Ticket - Intake";
  const supportTypeOption = typeOptionId[supportTypeGuess] || typeOptionId["Ticket - Intake"];

  const actionRequiredOption = actionRequiredOptionId.Acknowledge;
  const priorityOption = priorityOptionId[String(support?.priority || "Normal").trim()] || priorityOptionId.Normal;

  const taskName = `${(support?.name || "Unknown Client").trim()} | ${String(support?.issueType || "Support").trim()} | ${String(
    support?.priority || "Normal"
  ).trim()}`;

  const custom_fields = [];
  custom_fields.push({ id: CF.supportActionRequired, value: actionRequiredOption });
  custom_fields.push({ id: CF.supportEmail, value: support?.email || "" });
  custom_fields.push({ id: CF.supportLatestUpdate, value: support?.latestUpdate || "" });
  custom_fields.push({ id: CF.supportPriority, value: priorityOption });
  custom_fields.push({ id: CF.supportType, value: supportTypeOption });

  // We don't have Cal eventTypeId on this form; leave Support Event ID empty.

  const clickupPayload = {
    custom_fields,
    description: JSON.stringify(support, null, 2),
    name: taskName,
    status: "open / new",
  };

  const existingTaskId = support?.clickup?.taskId;
  let taskId = null;

  if (existingTaskId && typeof existingTaskId === "string") {
    await clickupFetch({ body: clickupPayload, env, method: "PUT", path: `/task/${existingTaskId}` });
    taskId = existingTaskId;
  } else {
    const created = await clickupFetch({ body: clickupPayload, env, method: "POST", path: `/list/${env.CLICKUP_SUPPORT_LIST_ID}/task` });
    taskId = created?.id || null;
    if (!taskId) throw new Error("ClickUp create support task did not return id");
  }

  const nextSupport = {
    ...support,
    clickup: {
      ...(support?.clickup || {}),
      taskId,
      updatedAt: new Date().toISOString(),
    },
  };

  await env.R2_VIRTUAL_LAUNCH.put(supportKey, JSON.stringify(nextSupport, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  return { ok: true, taskId };
}

// ============================================================
// Stripe + ClickUp (Existing)
// ============================================================

async function handleCheckoutSessionCompleted({ env, evt }) {
  const o = evt?.data?.object;

  const sessionId = o?.id;
  const paymentIntentId = o?.payment_intent;
  const paymentLink = o?.payment_link;
  const paymentStatus = o?.status;
  const fullName = o?.customer_details?.name;
  const primaryEmail = o?.customer_details?.email;
  const customerId = o?.customer;

  const normalizedPaymentIntentId =
    typeof paymentIntentId === "string"
      ? paymentIntentId
      : typeof paymentIntentId?.id === "string"
      ? paymentIntentId.id
      : null;

  if (!normalizedPaymentIntentId) {
    return json(
      {
        ok: true,
        eventId: evt.id,
        eventType: evt.type,
        storedReceipt: true,
        note: "checkout.session.completed missing payment_intent; canonical upsert skipped",
      },
      200
    );
  }

  const accountId = normalizedPaymentIntentId;
  const accountKey = `accounts/${accountId}.json`;
  const now = new Date().toISOString();

  const existing = await env.R2_VIRTUAL_LAUNCH.get(accountKey);
  let account = null;
  if (existing) {
    try {
      account = JSON.parse(await existing.text());
    } catch {
      account = null;
    }
  }

  const createdAt = account?.createdAt && typeof account.createdAt === "string" ? account.createdAt : now;

  const nextAccount = {
    accountId,
    createdAt,
    fullName: fullName || account?.fullName || null,
    primaryEmail: primaryEmail || account?.primaryEmail || null,
    stripe: {
      customerId: customerId || account?.stripe?.customerId || null,
      eventId: evt.id,
      paymentIntentId: normalizedPaymentIntentId,
      paymentLink: paymentLink || account?.stripe?.paymentLink || null,
      paymentStatus: paymentStatus || account?.stripe?.paymentStatus || null,
      receiptUrl: account?.stripe?.receiptUrl || null,
      sessionId: sessionId || account?.stripe?.sessionId || null,
    },
    subscription: {
      active: true,
      activatedAt: account?.subscription?.activatedAt || now,
    },
    clickup: account?.clickup || null,
  };

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  await env.R2_VIRTUAL_LAUNCH.put(
    `stripe/payment-intents/${normalizedPaymentIntentId}.json`,
    JSON.stringify({ accountId, createdAt: now, eventId: evt.id, sessionId: sessionId || null }, null, 2),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } }
  );

  if (primaryEmail) {
    await env.R2_VIRTUAL_LAUNCH.put(
      `auth/email-index/${String(primaryEmail).trim().toLowerCase()}.json`,
      JSON.stringify({ accountId, createdAt: now, email: String(primaryEmail).trim().toLowerCase() }, null, 2),
      { httpMetadata: { contentType: "application/json; charset=utf-8" } }
    );
  }

  const projectionEnabled = env.CLICKUP_PROJECTION_ENABLED === "true";
  let projection = { enabled: projectionEnabled, attempted: false, ok: false, taskId: null, error: null };

  if (projectionEnabled) {
    projection.attempted = true;
    try {
      const r = await projectAccountToClickUp({ env, accountKey, account: nextAccount });
      projection.ok = true;
      projection.taskId = r?.taskId || null;
    } catch (err) {
      projection.ok = false;
      projection.error = String(err?.message || err);

      const failedAccount = {
        ...nextAccount,
        clickup: {
          ...(nextAccount?.clickup || {}),
          error: projection.error,
          updatedAt: new Date().toISOString(),
        },
      };

      await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(failedAccount, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });
    }
  }

  return json({ ok: true, accountId, eventId: evt.id, eventType: evt.type, projection, subscription: { active: true } }, 200);
}

async function handlePaymentIntentSucceeded({ env, evt, eventId }) {
  const o = evt?.data?.object;

  const paymentIntentId = o?.id;
  const paymentStatus = o?.status;

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing paymentIntentId" }, 200);
  }

  const idx = await env.R2_VIRTUAL_LAUNCH.get(`stripe/payment-intents/${paymentIntentId}.json`);
  if (!idx) {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing correlation index" }, 200);
  }

  let indexObj;
  try {
    indexObj = JSON.parse(await idx.text());
  } catch {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Invalid correlation index JSON" }, 200);
  }

  const accountId = indexObj?.accountId;
  if (!accountId || typeof accountId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Correlation index missing accountId" }, 200);
  }

  const accountKey = `accounts/${accountId}.json`;
  const existing = await env.R2_VIRTUAL_LAUNCH.get(accountKey);

  if (!existing) {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Account not found for correlated accountId" }, 200);
  }

  let account;
  try {
    account = JSON.parse(await existing.text());
  } catch {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Invalid account JSON" }, 200);
  }

  const nextAccount = {
    ...account,
    stripe: {
      ...account.stripe,
      eventId: evt.id,
      paymentIntentId: paymentIntentId || account?.stripe?.paymentIntentId || null,
      paymentStatus: paymentStatus || account?.stripe?.paymentStatus || null,
    },
  };

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  return json({ ok: true, accountId, eventId: evt.id, eventType: evt.type }, 200);
}

async function handleChargeSucceeded({ env, evt, eventId }) {
  const o = evt?.data?.object || evt?.object || evt?.data || evt;

  const paymentIntentId = o?.payment_intent;
  const receiptUrl = o?.receipt_url;
  const paymentStatus = o?.status;

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing paymentIntentId" }, 200);
  }

  const idx = await env.R2_VIRTUAL_LAUNCH.get(`stripe/payment-intents/${paymentIntentId}.json`);
  if (!idx) {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing correlation index" }, 200);
  }

  let indexObj;
  try {
    indexObj = JSON.parse(await idx.text());
  } catch {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Invalid correlation index JSON" }, 200);
  }

  const accountId = indexObj?.accountId;
  if (!accountId || typeof accountId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Correlation index missing accountId" }, 200);
  }

  const accountKey = `accounts/${accountId}.json`;
  const existing = await env.R2_VIRTUAL_LAUNCH.get(accountKey);
  if (!existing) {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Account not found for correlated accountId" }, 200);
  }

  let account;
  try {
    account = JSON.parse(await existing.text());
  } catch {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Invalid account JSON" }, 200);
  }

  const nextAccount = {
    ...account,
    stripe: {
      ...account.stripe,
      eventId: evt.id,
      paymentIntentId: paymentIntentId || account?.stripe?.paymentIntentId || null,
      paymentStatus: paymentStatus || account?.stripe?.paymentStatus || null,
      receiptUrl: receiptUrl || account?.stripe?.receiptUrl || null,
    },
  };

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  return json({ ok: true, accountId, eventId: evt.id, eventType: evt.type }, 200);
}

async function projectAccountToClickUp({ env, accountKey, account }) {
  if (!env.CLICKUP_API_KEY) throw new Error("Missing CLICKUP_API_KEY");
  if (!env.CLICKUP_ACCOUNTS_LIST_ID) throw new Error("Missing CLICKUP_ACCOUNTS_LIST_ID");

  const taskName = `${(account?.fullName || "Unknown Client").trim()} | VA Starter Track`;

  const CF = {
    accountCompanyName: "059a571b-aa5d-41b4-ae12-3681b451b474",
    accountEventId: "33ea9fbb-0743-483a-91e4-450ce3bfb0a7",
    accountFullName: "b65231cc-4a10-4a38-9d90-1f1c167a4060",
    accountId: "e5f176ba-82c8-47d8-b3b1-0716d075f43f",
    accountPrimaryEmail: "a105f99e-b33d-4d12-bb24-f7c827ec761a",
    accountSupportStatus: "bbdf5418-8be0-452d-8bd0-b9f46643375e",
    accountSupportTaskLink: "9e14a458-96fd-4109-a276-034d8270e15b",
    stripePaymentIntentId: "6fc65cba-9060-4d70-ab36-02b239dd4718",
    stripePaymentStatus: "1b9a762e-cf3e-47d7-8ae7-98efe9e11eab",
    stripeReceiptUrl: "f8cb77f1-26b3-4788-83ed-2914bb608c11",
    stripeSessionId: "57e6c42b-a471-4316-92dc-23ce0f59d8b4",
  };

  const custom_fields = [];
  custom_fields.push({ id: CF.accountFullName, value: account?.fullName || "" });
  custom_fields.push({ id: CF.accountId, value: account?.accountId || "" });

  if (account?.primaryEmail) custom_fields.push({ id: CF.accountPrimaryEmail, value: account.primaryEmail });
  if (account?.companyName) custom_fields.push({ id: CF.accountCompanyName, value: account.companyName });

  if (account?.stripe?.eventId) custom_fields.push({ id: CF.accountEventId, value: account.stripe.eventId });
  if (account?.stripe?.sessionId) custom_fields.push({ id: CF.stripeSessionId, value: account.stripe.sessionId });
  if (account?.stripe?.paymentIntentId) custom_fields.push({ id: CF.stripePaymentIntentId, value: account.stripe.paymentIntentId });
  if (account?.stripe?.paymentStatus) custom_fields.push({ id: CF.stripePaymentStatus, value: account.stripe.paymentStatus });
  if (account?.stripe?.receiptUrl) custom_fields.push({ id: CF.stripeReceiptUrl, value: account.stripe.receiptUrl });

  const clickupPayload = {
    custom_fields,
    description: JSON.stringify(account, null, 2),
    name: taskName,
    status: "active client",
  };

  const existingTaskId = account?.clickup?.taskId;

  let taskId = null;
  if (existingTaskId && typeof existingTaskId === "string") {
    await clickupFetch({ body: clickupPayload, env, method: "PUT", path: `/task/${existingTaskId}` });
    taskId = existingTaskId;
  } else {
    const created = await clickupFetch({ body: clickupPayload, env, method: "POST", path: `/list/${env.CLICKUP_ACCOUNTS_LIST_ID}/task` });
    taskId = created?.id || null;
    if (!taskId) throw new Error("ClickUp create task did not return id");
  }

  const nextAccount = {
    ...account,
    clickup: {
      ...(account?.clickup || {}),
      taskId,
      updatedAt: new Date().toISOString(),
    },
  };

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  return { ok: true, taskId };
}

async function clickupFetch({ env, method, path, body }) {
  const res = await fetch(`https://api.clickup.com/api/v2${path}`, {
    method,
    headers: {
      Authorization: env.CLICKUP_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let jsonBody = null;
  try {
    jsonBody = text ? JSON.parse(text) : null;
  } catch {
    jsonBody = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`ClickUp ${method} ${path} failed: ${res.status} ${JSON.stringify(jsonBody)}`);
  }

  return jsonBody;
}

async function verifyStripeSignature({ rawBody, secret, signatureHeader, toleranceSeconds }) {
  const parts = parseStripeSignatureHeader(signatureHeader);
  if (!parts.timestamp) return { ok: false, reason: "Missing timestamp" };
  if (parts.v1.length === 0) return { ok: false, reason: "Missing v1 signature" };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const age = Math.abs(nowSeconds - parts.timestamp);
  if (age > toleranceSeconds) return { ok: false, reason: "Timestamp outside tolerance" };

  const rawText = new TextDecoder().decode(new Uint8Array(rawBody));
  const signedPayload = new TextEncoder().encode(`${parts.timestamp}.${rawText}`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, signedPayload);
  const expected = bufToHex(new Uint8Array(sigBuf));

  for (const candidate of parts.v1) {
    if (timingSafeEqual(expected, candidate)) return { ok: true };
  }

  return { ok: false, reason: "Signature mismatch" };
}

function parseStripeSignatureHeader(header) {
  const out = { timestamp: null, v1: [] };

  for (const item of String(header || "").split(",")) {
    const [k, v] = item.split("=");
    if (!k || !v) continue;

    const key = k.trim();
    const val = v.trim();

    if (key === "t") out.timestamp = Number(val);
    if (key === "v1") out.v1.push(val);
  }

  return out;
}
