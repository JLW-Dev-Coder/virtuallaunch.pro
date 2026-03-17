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
// Route table
// Each entry: { method, pattern, handler }
// method: HTTP verb string, or '*' to match any (used for webhooks)
// ---------------------------------------------------------------------------

const ROUTES = [

  // -------------------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------------------

  { method: 'GET',  pattern: '/v1/auth/session',               handler: stub },
  { method: 'POST', pattern: '/v1/auth/logout',                handler: stub },

  { method: 'GET',  pattern: '/v1/auth/google/start',          handler: stub },
  { method: 'GET',  pattern: '/v1/auth/google/callback',       handler: stub },

  { method: 'POST', pattern: '/v1/auth/magic-link/request',    handler: stub },
  { method: 'GET',  pattern: '/v1/auth/magic-link/verify',     handler: stub },

  { method: 'GET',  pattern: '/v1/auth/sso/oidc/start',        handler: stub },
  { method: 'GET',  pattern: '/v1/auth/sso/oidc/callback',     handler: stub },
  { method: 'GET',  pattern: '/v1/auth/sso/saml/start',        handler: stub },
  { method: 'POST', pattern: '/v1/auth/sso/saml/acs',          handler: stub },

  { method: 'GET',  pattern: '/v1/auth/2fa/status/:account_id',   handler: stub },
  { method: 'POST', pattern: '/v1/auth/2fa/enroll/init',           handler: stub },
  { method: 'POST', pattern: '/v1/auth/2fa/enroll/verify',         handler: stub },
  { method: 'POST', pattern: '/v1/auth/2fa/challenge/verify',      handler: stub },
  { method: 'POST', pattern: '/v1/auth/2fa/disable',               handler: stub },

  // -------------------------------------------------------------------------
  // CONTACT
  // -------------------------------------------------------------------------

  { method: 'POST', pattern: '/v1/contact/submit', handler: stub },

  // -------------------------------------------------------------------------
  // ACCOUNTS
  // -------------------------------------------------------------------------

  { method: 'POST',   pattern: '/v1/accounts',                   handler: stub },
  { method: 'GET',    pattern: '/v1/accounts/by-email/:email',   handler: stub },
  { method: 'GET',    pattern: '/v1/accounts/:account_id',       handler: stub },
  { method: 'PATCH',  pattern: '/v1/accounts/:account_id',       handler: stub },
  { method: 'DELETE', pattern: '/v1/accounts/:account_id',       handler: stub },

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

  { method: 'POST', pattern: '/v1/webhooks/stripe',  handler: () => json({ ok: true, received: true }) },
  { method: 'POST', pattern: '/v1/webhooks/twilio',  handler: () => json({ ok: true, received: true }) },

  // -------------------------------------------------------------------------
  // BOOKINGS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/bookings',                               handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/by-account/:account_id',        handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/by-professional/:professional_id', handler: stub },
  { method: 'GET',   pattern: '/v1/bookings/:booking_id',                   handler: stub },
  { method: 'PATCH', pattern: '/v1/bookings/:booking_id',                   handler: stub },

  // -------------------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/profiles',                           handler: stub },
  { method: 'GET',   pattern: '/v1/profiles/public/:professional_id', handler: stub },
  { method: 'GET',   pattern: '/v1/profiles/:professional_id',        handler: stub },
  { method: 'PATCH', pattern: '/v1/profiles/:professional_id',        handler: stub },

  // -------------------------------------------------------------------------
  // SUPPORT TICKETS
  // -------------------------------------------------------------------------

  { method: 'POST',  pattern: '/v1/support/tickets',                      handler: stub },
  { method: 'GET',   pattern: '/v1/support/tickets/by-account/:account_id', handler: stub },
  { method: 'GET',   pattern: '/v1/support/tickets/:ticket_id',            handler: stub },
  { method: 'PATCH', pattern: '/v1/support/tickets/:ticket_id',            handler: stub },

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
