/**
 * Virtual Launch Pro — Cloudflare Worker (professional infrastructure API)
 *
 * Reference sources used for this implementation:
 * - README-VLP.txt
 * - wrangler.toml / TOML.txt
 * - repo contracts under /contracts/*
 *
 * Principles:
 * - R2 is canonical authority.
 * - Mutations write receipt first, then canonical record.
 * - Session-backed auth unless the contract says otherwise.
 * - Provider calls use real upstream APIs when the contract and secrets support them.
 * - SAML start and ACS routes are wired with XML-DSig verification for standard RSA-SHA256 or RSA-SHA1 signed SAML responses.
 * - SAML ACS rejects unsigned, expired, issuer-mismatched, audience-mismatched, or certificate-mismatched assertions.
 */

const COOKIE_NAME = "vlp_session";
const DEFAULT_APP_URL = "https://virtuallaunch.pro";
const DEFAULT_API_URL = "https://api.virtuallaunch.pro";
const DEFAULT_ORIGIN = "https://virtuallaunch.pro";
const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};
const CAL_API_BASE = "https://api.cal.com/v2";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GOOGLE_OAUTH_SCOPE = "openid email profile";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const STRIPE_API_BASE = "https://api.stripe.com/v1";
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

const PRICING_ENV_KEYS = [
  "VLP_ADVANCED_MONTHLY",
  "VLP_ADVANCED_YEARLY",
  "VLP_FREE",
  "VLP_PRO_MONTHLY",
  "VLP_PRO_YEARLY",
  "VLP_STARTER_MONTHLY",
  "VLP_STARTER_YEARLY"
];

const ROUTES = [
  { auth: false, key: null, method: "GET", mode: "by_email", name: "account_get_by_email", pattern: "/v1/accounts/by-email/{email}" },
  { auth: true, key: "accounts_vlp/VLP_ACCT_{accountId}.json", method: "GET", mode: "single", name: "account_get", pattern: "/v1/accounts/{accountId}" },
  { auth: false, key: "accounts_vlp/VLP_ACCT_{accountId}.json", method: "POST", mode: "upsert", name: "account_create", pattern: "/v1/accounts" },
  { auth: true, key: "accounts_vlp/VLP_ACCT_{accountId}.json", method: "PATCH", mode: "upsert", name: "account_update", pattern: "/v1/accounts/{accountId}" },
  { auth: true, key: null, method: "POST", mode: "2fa_verify_challenge", name: "auth_2fa_verify_challenge", pattern: "/v1/auth/2fa/challenge/verify" },
  { auth: true, key: null, method: "POST", mode: "2fa_disable", name: "auth_2fa_disable", pattern: "/v1/auth/2fa/disable" },
  { auth: true, key: null, method: "POST", mode: "2fa_enroll_init", name: "auth_2fa_enroll_init", pattern: "/v1/auth/2fa/enroll/init" },
  { auth: true, key: null, method: "POST", mode: "2fa_enroll_verify", name: "auth_2fa_enroll_verify", pattern: "/v1/auth/2fa/enroll/verify" },
  { auth: true, key: null, method: "GET", mode: "2fa_status", name: "auth_2fa_status", pattern: "/v1/auth/2fa/status/{accountId}" },
  { auth: false, key: null, method: "GET", mode: "auth_google_start", name: "auth_google_start", pattern: "/v1/auth/google/start" },
  { auth: false, key: null, method: "GET", mode: "auth_google_callback", name: "auth_google_callback", pattern: "/v1/auth/google/callback" },
  { auth: true, key: null, method: "POST", mode: "logout", name: "auth_logout", pattern: "/v1/auth/logout" },
  { auth: false, key: "auth/magic-links/{tokenId}.json", method: "POST", mode: "magic_link_request", name: "auth_magic_link_request", pattern: "/v1/auth/magic-link/request" },
  { auth: false, key: null, method: "GET", mode: "magic_link_verify", name: "auth_magic_link_verify", pattern: "/v1/auth/magic-link/verify" },
  { auth: false, key: null, method: "GET", mode: "session_get", name: "auth_session_get", pattern: "/v1/auth/session" },
  { auth: false, key: null, method: "GET", mode: "auth_oidc_start", name: "auth_sso_oidc_start", pattern: "/v1/auth/sso/oidc/start" },
  { auth: false, key: null, method: "GET", mode: "auth_oidc_callback", name: "auth_sso_oidc_callback", pattern: "/v1/auth/sso/oidc/callback" },
  { auth: false, key: null, method: "GET", mode: "auth_saml_start", name: "auth_sso_saml_start", pattern: "/v1/auth/sso/saml/start" },
  { auth: false, key: null, method: "POST", mode: "auth_saml_acs", name: "auth_sso_saml_acs", pattern: "/v1/auth/sso/saml/acs" },
  { auth: false, key: null, method: "GET", mode: "billing_config", name: "billing_config_get", pattern: "/v1/billing/config" },
  { auth: true, key: "billing_customers/{accountId}.json", method: "POST", mode: "billing_customer_create", name: "billing_customer_create", pattern: "/v1/billing/customers" },
  { auth: true, key: "billing_payment_intents/{eventId}.json", method: "POST", mode: "billing_payment_intent_create", name: "billing_payment_intent_create", pattern: "/v1/billing/payment-intents" },
  { auth: true, key: "billing_payment_methods/{accountId}.json", method: "POST", mode: "billing_payment_method_attach", name: "billing_payment_method_attach", pattern: "/v1/billing/payment-methods/attach" },
  { auth: true, key: null, method: "GET", mode: "billing_payment_method_list", name: "billing_payment_method_list", pattern: "/v1/billing/payment-methods/{accountId}" },
  { auth: true, key: null, method: "GET", mode: "billing_receipts_list", name: "billing_receipts_list", pattern: "/v1/billing/receipts/{accountId}" },
  { auth: true, key: "billing_portal_sessions/{eventId}.json", method: "POST", mode: "billing_portal_session_create", name: "billing_portal_session_create", pattern: "/v1/billing/portal/sessions" },
  { auth: true, key: "billing_setup_intents/{eventId}.json", method: "POST", mode: "billing_setup_intent_create", name: "billing_setup_intent_create", pattern: "/v1/billing/setup-intents" },
  { auth: true, key: "billing_subscriptions/{membershipId}.json", method: "POST", mode: "billing_subscription_upsert", name: "billing_subscription_create", pattern: "/v1/billing/subscriptions" },
  { auth: true, key: "billing_subscriptions/{membershipId}.json", method: "PATCH", mode: "billing_subscription_update", name: "billing_subscription_update", pattern: "/v1/billing/subscriptions/{membershipId}" },
  { auth: true, key: "billing_subscriptions/{membershipId}.json", method: "POST", mode: "billing_subscription_cancel", name: "billing_subscription_cancel", pattern: "/v1/billing/subscriptions/{membershipId}/cancel" },
  { auth: true, key: "tokens/{accountId}.json", method: "POST", mode: "token_purchase", name: "billing_tokens_purchase", pattern: "/v1/billing/tokens/purchase" },
  { auth: true, key: "tokens/{accountId}.json", method: "GET", mode: "token_balance_get", name: "tokens_balance_get", pattern: "/v1/tokens/balance/{accountId}" },
  { auth: true, key: null, method: "GET", mode: "token_usage_list", name: "tokens_usage_list", pattern: "/v1/tokens/usage/{accountId}" },
  { auth: true, key: "bookings/{bookingId}.json", method: "GET", mode: "single", name: "booking_get", pattern: "/v1/bookings/{bookingId}" },
  { auth: true, key: null, method: "GET", mode: "list_by_account", name: "booking_get_by_account", pattern: "/v1/bookings/by-account/{accountId}" },
  { auth: true, key: null, method: "GET", mode: "list_by_professional", name: "booking_get_by_professional", pattern: "/v1/bookings/by-professional/{professionalId}" },
  { auth: true, key: null, method: "GET", mode: "cal_oauth_start", name: "cal_app_oauth_start", pattern: "/v1/cal/app/oauth/start" },
  { auth: false, key: null, method: "GET", mode: "cal_oauth_callback", name: "cal_app_oauth_callback", pattern: "/v1/cal/app/oauth/callback" },
  { auth: true, key: null, method: "GET", mode: "cal_oauth_start", name: "cal_pro_oauth_start", pattern: "/v1/cal/pro/oauth/start" },
  { auth: false, key: null, method: "GET", mode: "cal_oauth_callback", name: "cal_pro_oauth_callback", pattern: "/v1/cal/pro/oauth/callback" },
  { auth: true, key: "bookings/{bookingId}.json", method: "POST", mode: "upsert", name: "booking_create", pattern: "/v1/bookings" },
  { auth: true, key: "bookings/{bookingId}.json", method: "PATCH", mode: "upsert", name: "booking_update", pattern: "/v1/bookings/{bookingId}" },
  { auth: true, key: "checkout_sessions/{accountId}.json", method: "POST", mode: "checkout_create_session", name: "checkout_create_session", pattern: "/v1/checkout/sessions" },
  { auth: true, key: null, method: "GET", mode: "checkout_get_status", name: "checkout_get_status", pattern: "/v1/checkout/status" },
  { auth: true, key: "memberships/{membershipId}.json", method: "GET", mode: "single", name: "membership_get", pattern: "/v1/memberships/{membershipId}" },
  { auth: true, key: null, method: "GET", mode: "membership_by_account", name: "membership_get_by_account", pattern: "/v1/memberships/by-account/{accountId}" },
  { auth: true, key: "memberships/{membershipId}.json", method: "POST", mode: "upsert", name: "membership_create", pattern: "/v1/memberships" },
  { auth: true, key: "memberships/{membershipId}.json", method: "PATCH", mode: "upsert", name: "membership_update", pattern: "/v1/memberships/{membershipId}" },
  { auth: true, key: null, method: "GET", mode: "notifications_list", name: "notifications_in_app_list", pattern: "/v1/notifications/in-app" },
  { auth: true, key: "notifications/in-app/{notificationId}.json", method: "POST", mode: "upsert", name: "notifications_in_app_create", pattern: "/v1/notifications/in-app" },
  { auth: true, key: "vlp_preferences/{accountId}.json", method: "GET", mode: "preferences_get", name: "notifications_preferences_get", pattern: "/v1/notifications/preferences/{accountId}" },
  { auth: true, key: "vlp_preferences/{accountId}.json", method: "PATCH", mode: "upsert", name: "notifications_preferences_update", pattern: "/v1/notifications/preferences/{accountId}" },
  { auth: true, key: null, method: "POST", mode: "sms_send", name: "notifications_sms_send", pattern: "/v1/notifications/sms/send" },
  { auth: false, key: null, method: "GET", mode: "pricing", name: "pricing_get", pattern: "/v1/pricing" },
  { auth: true, key: "profiles/{professionalId}.json", method: "GET", mode: "single", name: "profile_get", pattern: "/v1/profiles/{professionalId}" },
  { auth: true, key: "profiles/{professionalId}.json", method: "POST", mode: "upsert", name: "profile_create", pattern: "/v1/profiles" },
  { auth: true, key: "profiles/{professionalId}.json", method: "PATCH", mode: "upsert", name: "profile_update", pattern: "/v1/profiles/{professionalId}" },
  { auth: true, key: "support_tickets/{ticketId}.json", method: "GET", mode: "single", name: "support_ticket_get", pattern: "/v1/support/tickets/{ticketId}" },
  { auth: true, key: null, method: "GET", mode: "tickets_by_account", name: "support_ticket_get_by_account", pattern: "/v1/support/tickets/by-account/{accountId}" },
  { auth: true, key: "support_tickets/{ticketId}.json", method: "POST", mode: "upsert", name: "support_ticket_create", pattern: "/v1/support/tickets" },
  { auth: true, key: "support_tickets/{ticketId}.json", method: "PATCH", mode: "upsert", name: "support_ticket_update", pattern: "/v1/support/tickets/{ticketId}" },
  { auth: true, key: "vlp_preferences/{accountId}.json", method: "GET", mode: "preferences_get", name: "vlp_preferences_get", pattern: "/v1/vlp/preferences/{accountId}" },
  { auth: true, key: "vlp_preferences/{accountId}.json", method: "PATCH", mode: "upsert", name: "vlp_preferences_update", pattern: "/v1/vlp/preferences/{accountId}" },
  { auth: false, key: null, method: "POST", mode: "webhooks_stripe_receive", name: "webhooks_stripe_receive", pattern: "/v1/webhooks/stripe" },
  { auth: false, key: null, method: "POST", mode: "webhooks_twilio_receive", name: "webhooks_twilio_receive", pattern: "/v1/webhooks/twilio" }
];

const SCHEMAS = {
  account_create: required("accountId", "email", "firstName", "lastName", "platform", "role", "source"),
  account_update: required("accountId"),
  auth_2fa_disable: required("accountId", "challengeToken"),
  auth_2fa_enroll_init: required("accountId"),
  auth_2fa_enroll_verify: required("accountId", "otpCode"),
  auth_2fa_status: required("accountId"),
  auth_2fa_verify_challenge: required("accountId", "challengeToken"),
  auth_google_callback: required("code", "state"),
  auth_google_start: required("redirectUri"),
  cal_app_oauth_callback: required("code", "state"),
  cal_app_oauth_start: required("accountId", "redirectUri"),
  cal_pro_oauth_callback: required("code", "state"),
  cal_pro_oauth_start: required("accountId", "redirectUri"),
  auth_magic_link_request: required("email"),
  auth_sso_oidc_callback: required("code", "state"),
  auth_sso_oidc_start: required("redirectUri"),
  auth_sso_saml_acs: required("RelayState", "SAMLResponse"),
  auth_sso_saml_start: required("redirectUri"),
  billing_customer_create: required("accountId", "email", "eventId", "fullName"),
  billing_payment_intent_create: required("accountId", "amount", "currency", "customerId", "eventId"),
  billing_payment_method_attach: required("accountId", "customerId", "eventId", "paymentMethodId", "setDefault"),
  billing_payment_method_list: required("accountId"),
  billing_receipts_list: required("accountId"),
  billing_portal_session_create: required("accountId", "customerId", "eventId", "returnUrl"),
  billing_setup_intent_create: required("accountId", "customerId", "eventId", "usage"),
  billing_subscription_cancel: required("membershipId"),
  billing_subscription_create: required("accountId", "billingInterval", "customerId", "eventId", "membershipId", "planKey", "priceId", "productId"),
  billing_subscription_update: required("billingInterval", "eventId", "membershipId", "planKey", "priceId"),
  billing_tokens_purchase: required("accountId", "amount", "currency", "eventId", "quantity", "tokenType"),
  tokens_balance_get: required("accountId"),
  tokens_usage_list: required("accountId"),
  booking_create: required("accountId", "bookingId"),
  booking_get: required("bookingId"),
  booking_get_by_account: required("accountId"),
  booking_get_by_professional: required("professionalId"),
  booking_update: required("bookingId"),
  checkout_create_session: required("accountId", "billingInterval", "cancelUrl", "planKey", "successUrl"),
  checkout_get_status: required("sessionId"),
  membership_create: required("accountId", "membershipId"),
  membership_get: required("membershipId"),
  membership_get_by_account: required("accountId"),
  membership_update: required("membershipId"),
  notifications_in_app_create: required("accountId", "message", "notificationId", "title"),
  notifications_in_app_list: required("accountId"),
  notifications_preferences_get: required("accountId"),
  notifications_preferences_update: required("accountId"),
  notifications_sms_send: required("accountId", "message", "phone"),
  profile_create: required("bio", "displayName", "professionalId", "specialties"),
  profile_get: required("professionalId"),
  profile_update: required("professionalId"),
  support_ticket_create: required("accountId", "message", "priority", "subject", "ticketId"),
  support_ticket_get: required("ticketId"),
  support_ticket_get_by_account: required("accountId"),
  support_ticket_update: required("ticketId"),
  vlp_preferences_get: required("accountId"),
  vlp_preferences_update: required("accountId")
};

export default {
  async fetch(request, env) {
    try {
      if (!env?.R2_VIRTUAL_LAUNCH) {
        return json(request, 500, { error: "missing_r2_binding", ok: false });
      }
      if (request.method === "OPTIONS") {
        return withCors(request, new Response(null, { status: 204 }));
      }
      if (!isAllowedMethod(request.method)) {
        return json(request, 405, { error: "method_not_allowed", ok: false });
      }

      const url = new URL(request.url);
      const route = matchRoute(request.method, url.pathname);
      if (!route) {
        return json(request, 404, { error: "route_not_found", ok: false });
      }

      const session = await getSession(request, env);
      if (route.auth && !session.authenticated) {
        return json(request, 401, { error: "unauthorized", ok: false });
      }

      const payloadResult = await buildPayload(request, route, url);
      if (!payloadResult.ok) {
        return json(request, payloadResult.status, payloadResult.body);
      }

      const payload = payloadResult.payload;
      const errors = validatePayload(route.name, payload);
      if (errors.length) {
        return json(request, 400, { error: "validation_failed", errors, ok: false, route: route.name });
      }

      const result = await dispatchRoute({ env, payload, request, route, session, url });
      return finalize(request, result);
    } catch (error) {
      return json(request, 500, {
        error: "worker_failure",
        message: error instanceof Error ? error.message : "Unknown error",
        ok: false
      });
    }
  }
};

function required(...fields) {
  return { required: fields };
}

function applyTemplate(template, payload) {
  if (!template) return null;
  return template.replace(/\{([^}]+)\}/g, (_, key) => String(payload?.[key] ?? ""));
}

async function appendReceipt(env, route, payload, extra = {}, overrideKey = null) {
  const eventId = String(
    payload.eventId ||
    payload.state ||
    payload.accountId ||
    payload.bookingId ||
    payload.membershipId ||
    payload.notificationId ||
    payload.professionalId ||
    payload.relayState ||
    payload.sessionId ||
    payload.ticketId ||
    crypto.randomUUID()
  );
  const key = overrideKey || ["receipts", "vlp", route.name, `${eventId}.json`].join("/");
  const receipt = {
    eventId,
    payload,
    recordedAt: new Date().toISOString(),
    route: route.name,
    ...extra
  };
  await putJson(env, key, receipt);
  return { eventId, key, receipt };
}

async function buildPayload(request, route, url) {
  const fromQuery = Object.fromEntries(url.searchParams.entries());
  let fromBody = {};

  if (request.method === "PATCH" || request.method === "POST") {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      try {
        fromBody = await request.json();
      } catch {
        return { body: { error: "invalid_json", ok: false }, ok: false, status: 400 };
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      fromBody = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    }
  }

  return {
    ok: true,
    payload: normalizeObject({ ...fromQuery, ...route.params, ...fromBody })
  };
}

function buildPricing(env) {
  return PRICING_ENV_KEYS.map((key) => ({
    cost: Number(env[`${key}_COST`] || 0),
    planKey: String(env[`${key}_PLAN_KEY`] || key.toLowerCase()),
    platformFeePercent: Number(env[`${key}_PLATFORM_FEE_PERCENT`] || env.VLP_PLATFORM_FEE_PERCENT || 0),
    taxGameTokens: Number(env[`${key}_TAX_GAME_TOKENS`] || 0),
    transcriptTokens: Number(env[`${key}_TRANSCRIPT_TOKENS`] || 0)
  })).sort((left, right) => String(left.planKey).localeCompare(String(right.planKey)));
}

function cookieHeader(token, env, expiresAt) {
  const domain = env.COOKIE_DOMAIN ? `; Domain=${env.COOKIE_DOMAIN}` : "";
  const expires = expiresAt ? `; Expires=${new Date(expiresAt).toUTCString()}` : "";
  return `${COOKIE_NAME}=${token}${domain}${expires}; HttpOnly; Path=/; SameSite=Lax; Secure`;
}

async function createSignedToken(value, secret) {
  const payload = toBase64Url(JSON.stringify(value));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

async function dispatchRoute(context) {
  switch (context.route.mode) {
    case "2fa_disable":
      return handleTwoFactorDisable(context);
    case "2fa_enroll_init":
      return handleTwoFactorEnrollInit(context);
    case "2fa_enroll_verify":
      return handleTwoFactorEnrollVerify(context);
    case "2fa_status":
      return handleTwoFactorStatus(context);
    case "2fa_verify_challenge":
      return handleTwoFactorVerifyChallenge(context);
    case "auth_google_callback":
      return handleGoogleCallback(context);
    case "auth_google_start":
      return handleGoogleStart(context);
    case "auth_oidc_callback":
      return handleOidcCallback(context);
    case "auth_oidc_start":
      return handleOidcStart(context);
    case "auth_saml_acs":
      return handleSamlAcs(context);
    case "auth_saml_start":
      return handleSamlStart(context);
    case "billing_config":
      return handleBillingConfig(context);
    case "cal_oauth_callback":
      return handleCalOAuthCallback(context);
    case "cal_oauth_start":
      return handleCalOAuthStart(context);
    case "billing_customer_create":
      return handleBillingCustomerCreate(context);
    case "billing_payment_intent_create":
      return handleBillingPaymentIntentCreate(context);
    case "billing_payment_method_attach":
      return handleBillingPaymentMethodAttach(context);
    case "billing_payment_method_list":
      return handleBillingPaymentMethodList(context);
    case "billing_receipts_list":
      return handleBillingReceiptsList(context);
    case "billing_portal_session_create":
      return handleBillingPortalSessionCreate(context);
    case "billing_setup_intent_create":
      return handleBillingSetupIntentCreate(context);
    case "billing_subscription_cancel":
      return handleBillingSubscriptionCancel(context);
    case "billing_subscription_update":
      return handleBillingSubscriptionUpdate(context);
    case "billing_subscription_upsert":
      return handleBillingSubscriptionCreate(context);
    case "by_email":
      return handleAccountByEmail(context);
    case "checkout_create_session":
      return handleCheckoutCreateSession(context);
    case "checkout_get_status":
      return handleCheckoutGetStatus(context);
    case "list_by_account":
      return handleListByField(context, "bookings/", "accountId", "bookings");
    case "list_by_professional":
      return handleListByField(context, "bookings/", "professionalId", "bookings");
    case "logout":
      return handleLogout(context);
    case "magic_link_request":
      return handleMagicLinkRequest(context);
    case "magic_link_verify":
      return handleMagicLinkVerify(context);
    case "membership_by_account":
      return handleListByField(context, "memberships/", "accountId", "membership", true);
    case "notifications_list":
      return handleNotificationsList(context);
    case "preferences_get":
      return handleSingle(context, true);
    case "pricing":
      return { body: { ok: true, pricing: buildPricing(context.env) }, status: 200 };
    case "session_get":
      return handleSessionGet(context);
    case "single":
      return handleSingle(context, false);
    case "sms_send":
      return handleSmsSend(context);
    case "tickets_by_account":
      return handleListByField(context, "support_tickets/", "accountId", "tickets");
    case "token_purchase":
      return handleTokenPurchase(context);
    case "token_balance_get":
      return handleTokenBalanceGet(context);
    case "token_usage_list":
      return handleTokenUsageList(context);
    case "upsert":
      return handleUpsert(context);
    case "webhooks_stripe_receive":
      return handleStripeWebhook(context);
    case "webhooks_twilio_receive":
      return handleTwilioWebhook(context);
    default:
      return notImplemented(context.route.name);
  }
}

async function finalize(request, result) {
  const headers = new Headers(result.headers || {});
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  headers.set("cache-control", "no-store");
  return withCors(request, new Response(JSON.stringify(result.body ?? {}, null, 2), {
    headers,
    status: result.status || 200
  }));
}

async function findAccountByEmail(env, email) {
  const records = await listJson(env, "accounts_vlp/");
  return records.find((record) => String(record?.email || "").toLowerCase() === String(email || "").toLowerCase()) || null;
}

function fromBase64Url(input) {
  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

async function getJson(env, key) {
  const object = await env.R2_VIRTUAL_LAUNCH.get(key);
  if (!object) return null;
  try {
    return JSON.parse(await object.text());
  } catch {
    return null;
  }
}

async function getSession(request, env) {
  const token = parseCookie(request.headers.get("cookie") || "", COOKIE_NAME);
  if (!token) return { authenticated: false };
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return { authenticated: false };

  const secret = String(env.SESSION_SECRET || env.JWT_SECRET || "");
  if (!secret) return { authenticated: false };

  const expected = await sign(payload, secret);
  if (expected !== signature) return { authenticated: false };

  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (session?.expiresAt && Date.now() > new Date(session.expiresAt).getTime()) {
      return { authenticated: false };
    }
    return { ...session, authenticated: true };
  } catch {
    return { authenticated: false };
  }
}

function getProviderRedirectBase(env) {
  return String(env.APP_BASE_URL || DEFAULT_API_URL);
}

function getAppDashboardUrl(env, redirectUri) {
  if (redirectUri) return String(redirectUri);
  return `${String(DEFAULT_APP_URL)}/site/sign-in.html`;
}

function getPlanFromEnv(env, planKey) {
  const upper = String(planKey || "").toUpperCase();
  const normalized = upper.replace(/^VLP_/, "VLP_");
  return {
    cost: Number(env[`${normalized}_COST`] || 0),
    planKey: String(env[`${normalized}_PLAN_KEY`] || planKey),
    platformFeePercent: Number(env[`${normalized}_PLATFORM_FEE_PERCENT`] || env.VLP_PLATFORM_FEE_PERCENT || 0),
    priceId: String(env[`STRIPE_PRICE_${normalized}`] || ""),
    productId: String(env[`STRIPE_PRODUCT_${normalized}`] || ""),
    taxGameTokens: Number(env[`${normalized}_TAX_GAME_TOKENS`] || 0),
    transcriptTokens: Number(env[`${normalized}_TRANSCRIPT_TOKENS`] || 0)
  };
}

async function handleAccountByEmail(context) {
  const account = await findAccountByEmail(context.env, context.payload.email);
  return {
    body: { account, ok: true, status: account ? "found" : "not_found" },
    status: account ? 200 : 404
  };
}

function handleBillingConfig(context) {
  return {
    body: {
      config: {
        billingLinkVaStarterTrack: context.env.BILLING_LINK_VA_STARTER_TRACK || null,
        calBookingDemoIntro: context.env.CAL_BOOKING_DEMO_INTRO || null,
        calBookingSupport: context.env.CAL_BOOKING_SUPPORT || null,
        publishableKey: context.env.STRIPE_PUBLISHABLE_KEY || null
      },
      ok: true,
      source: "wrangler.toml",
      status: "retrieved"
    },
    status: 200
  };
}

async function handleBillingCustomerCreate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const dedupeKey = `billing_customers/${context.payload.accountId}.json`;
  const existing = await getJson(context.env, dedupeKey);
  if (existing?.stripeCustomerId) {
    return {
      body: {
        customerId: existing.stripeCustomerId,
        deduped: true,
        eventId: context.payload.eventId,
        ok: true
      },
      status: 200
    };
  }

  const response = await stripeRequest(context.env, "/customers", {
    description: `VLP account ${context.payload.accountId}`,
    email: context.payload.email,
    name: context.payload.fullName,
    "metadata[accountId]": context.payload.accountId,
    "metadata[source]": "vlp"
  });

  const canonical = {
    accountId: context.payload.accountId,
    createdAt: new Date().toISOString(),
    email: context.payload.email,
    eventId: context.payload.eventId,
    fullName: context.payload.fullName,
    stripeCustomerId: response.id,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { stripeCustomerId: response.id }, `receipts/vlp/billing/customers/${context.payload.eventId}.json`);
  await putJson(context.env, dedupeKey, canonical);

  return {
    body: {
      customerId: response.id,
      eventId: context.payload.eventId,
      ok: true,
      status: "created"
    },
    status: 200
  };
}

async function handleBillingPaymentIntentCreate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_payment_intents/${context.payload.eventId}.json`);
  if (existing?.paymentIntentId) {
    return {
      body: {
        clientSecret: existing.clientSecret,
        deduped: true,
        eventId: context.payload.eventId,
        ok: true,
        paymentIntentId: existing.paymentIntentId
      },
      status: 200
    };
  }

  const response = await stripeRequest(context.env, "/payment_intents", {
    amount: String(context.payload.amount),
    currency: String(context.payload.currency).toLowerCase(),
    customer: context.payload.customerId,
    automatic_payment_methods: "[enabled]=true",
    "metadata[accountId]": context.payload.accountId,
    "metadata[eventId]": context.payload.eventId,
    ...toStripeMetadataMap(context.payload.metadata)
  });

  const canonical = {
    accountId: context.payload.accountId,
    amount: context.payload.amount,
    clientSecret: response.client_secret,
    createdAt: new Date().toISOString(),
    currency: context.payload.currency,
    customerId: context.payload.customerId,
    eventId: context.payload.eventId,
    metadata: context.payload.metadata || {},
    paymentIntentId: response.id,
    status: response.status,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { paymentIntentId: response.id }, `receipts/vlp/billing/payment-intents/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_payment_intents/${context.payload.eventId}.json`, canonical);

  return {
    body: {
      clientSecret: response.client_secret,
      eventId: context.payload.eventId,
      ok: true,
      paymentIntentId: response.id,
      status: "created"
    },
    status: 200
  };
}

async function handleBillingPaymentMethodAttach(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_payment_methods/${context.payload.accountId}.json`);
  if (existing?.lastEventId === context.payload.eventId) {
    return {
      body: {
        deduped: true,
        eventId: context.payload.eventId,
        ok: true,
        paymentMethodId: context.payload.paymentMethodId
      },
      status: 200
    };
  }

  await stripeRequest(context.env, `/payment_methods/${encodeURIComponent(context.payload.paymentMethodId)}/attach`, {
    customer: context.payload.customerId
  });

  if (context.payload.setDefault) {
    await stripeRequest(context.env, `/customers/${encodeURIComponent(context.payload.customerId)}`, {
      "invoice_settings[default_payment_method]": context.payload.paymentMethodId
    }, "POST");
  }

  const methods = await stripeRequest(context.env, "/payment_methods", {
    customer: context.payload.customerId,
    type: "card"
  }, "GET");

  const canonical = {
    accountId: context.payload.accountId,
    customerId: context.payload.customerId,
    lastEventId: context.payload.eventId,
    methods: methods.data.map(sanitizeStripePaymentMethod),
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { attached: true }, `receipts/vlp/billing/payment-methods/attach/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_payment_methods/${context.payload.accountId}.json`, canonical);

  return {
    body: {
      eventId: context.payload.eventId,
      ok: true,
      paymentMethodId: context.payload.paymentMethodId,
      status: "attached"
    },
    status: 200
  };
}

async function handleBillingPaymentMethodList(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const customerRecord = await getJson(context.env, `billing_customers/${context.payload.accountId}.json`);
  if (!customerRecord?.stripeCustomerId) {
    return { body: { methods: [], ok: true, status: "retrieved" }, status: 200 };
  }

  const methods = await stripeRequest(context.env, "/payment_methods", {
    customer: customerRecord.stripeCustomerId,
    type: "card"
  }, "GET");

  const output = methods.data.map(sanitizeStripePaymentMethod);
  await putJson(context.env, `billing_payment_methods/${context.payload.accountId}.json`, {
    accountId: context.payload.accountId,
    customerId: customerRecord.stripeCustomerId,
    methods: output,
    updatedAt: new Date().toISOString()
  });

  return {
    body: { methods: output, ok: true, status: "retrieved" },
    status: 200
  };
}

async function handleBillingReceiptsList(context) {
  const limit = Number(context.payload.limit || 50);
  const prefixes = [
    "receipts/vlp/billing/",
    "receipts/vlp/billing_customers/",
    "receipts/vlp/billing_payment_intents/",
    "receipts/vlp/billing_payment_methods/",
    "receipts/vlp/billing_portal_sessions/",
    "receipts/vlp/billing_setup_intents/",
    "receipts/vlp/billing_subscriptions/",
    "receipts/vlp/checkout/sessions/"
  ];

  const receipts = [];
  for (const prefix of prefixes) {
    const records = await listJson(context.env, prefix);
    for (const record of records) {
      const payloadAccountId = String(record?.payload?.accountId || record?.accountId || "");
      if (payloadAccountId === String(context.payload.accountId || "")) {
        receipts.push({
          eventId: record?.eventId || null,
          key: inferReceiptKey(prefix, record),
          payload: record?.payload || {},
          receiptSource: record?.route || null,
          recordedAt: record?.recordedAt || record?.updatedAt || null
        });
      }
    }
  }

  receipts.sort((left, right) => String(right.recordedAt || "").localeCompare(String(left.recordedAt || "")));

  return {
    body: {
      ok: true,
      receipts: receipts.slice(0, limit),
      status: "retrieved"
    },
    status: 200
  };
}

async function handleBillingPortalSessionCreate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_portal_sessions/${context.payload.eventId}.json`);
  if (existing?.url) {
    return {
      body: {
        deduped: true,
        eventId: context.payload.eventId,
        ok: true,
        url: existing.url
      },
      status: 200
    };
  }

  const response = await stripeRequest(context.env, "/billing_portal/sessions", {
    customer: context.payload.customerId,
    return_url: context.payload.returnUrl
  });

  const canonical = {
    accountId: context.payload.accountId,
    customerId: context.payload.customerId,
    eventId: context.payload.eventId,
    portalSessionId: response.id,
    returnUrl: context.payload.returnUrl,
    url: response.url,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { portalSessionId: response.id }, `receipts/vlp/billing/portal-sessions/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_portal_sessions/${context.payload.eventId}.json`, canonical);

  return {
    body: {
      eventId: context.payload.eventId,
      ok: true,
      status: "created",
      url: response.url
    },
    status: 200
  };
}

async function handleBillingSetupIntentCreate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_setup_intents/${context.payload.eventId}.json`);
  if (existing?.setupIntentId) {
    return {
      body: {
        clientSecret: existing.clientSecret,
        deduped: true,
        eventId: context.payload.eventId,
        ok: true,
        setupIntentId: existing.setupIntentId
      },
      status: 200
    };
  }

  const response = await stripeRequest(context.env, "/setup_intents", {
    customer: context.payload.customerId,
    usage: context.payload.usage,
    automatic_payment_methods: "[enabled]=true",
    "metadata[accountId]": context.payload.accountId,
    "metadata[eventId]": context.payload.eventId
  });

  const canonical = {
    accountId: context.payload.accountId,
    clientSecret: response.client_secret,
    customerId: context.payload.customerId,
    eventId: context.payload.eventId,
    setupIntentId: response.id,
    status: response.status,
    updatedAt: new Date().toISOString(),
    usage: context.payload.usage
  };

  await appendReceipt(context.env, context.route, context.payload, { setupIntentId: response.id }, `receipts/vlp/billing/setup-intents/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_setup_intents/${context.payload.eventId}.json`, canonical);

  return {
    body: {
      clientSecret: response.client_secret,
      eventId: context.payload.eventId,
      ok: true,
      setupIntentId: response.id,
      status: "created"
    },
    status: 200
  };
}

async function handleBillingSubscriptionCreate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`);
  if (existing?.eventId === context.payload.eventId && existing?.subscriptionId) {
    return {
      body: {
        deduped: true,
        eventId: context.payload.eventId,
        membershipId: context.payload.membershipId,
        ok: true,
        subscriptionId: existing.subscriptionId
      },
      status: 200
    };
  }

  const response = await stripeRequest(context.env, "/subscriptions", {
    customer: context.payload.customerId,
    items: `[0][price]=${encodeURIComponent(context.payload.priceId)}`,
    payment_behavior: "default_incomplete",
    collection_method: "charge_automatically",
    expand: "[0]=latest_invoice.payment_intent",
    "metadata[accountId]": context.payload.accountId,
    "metadata[eventId]": context.payload.eventId,
    "metadata[membershipId]": context.payload.membershipId,
    "metadata[planKey]": context.payload.planKey,
    "metadata[productId]": context.payload.productId
  }, "POST", true);

  const plan = getPlanFromEnv(context.env, context.payload.planKey);
  const canonical = {
    accountId: context.payload.accountId,
    billingInterval: context.payload.billingInterval,
    createdAt: new Date().toISOString(),
    customerId: context.payload.customerId,
    eventId: context.payload.eventId,
    membershipId: context.payload.membershipId,
    plan,
    priceId: context.payload.priceId,
    productId: context.payload.productId,
    status: response.status,
    subscriptionId: response.id,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { subscriptionId: response.id }, `receipts/vlp/billing/subscriptions/create/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`, canonical);
  await putJson(context.env, `memberships/${context.payload.membershipId}.json`, {
    accountId: context.payload.accountId,
    billingInterval: context.payload.billingInterval,
    membershipId: context.payload.membershipId,
    plan,
    status: response.status,
    stripeCustomerId: context.payload.customerId,
    subscriptionId: response.id,
    updatedAt: new Date().toISOString()
  });
  await creditPlanTokens(context.env, context.payload.accountId, plan);

  return {
    body: {
      eventId: context.payload.eventId,
      membershipId: context.payload.membershipId,
      ok: true,
      status: "created",
      subscriptionId: response.id
    },
    status: 200
  };
}

async function handleBillingSubscriptionUpdate(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`);
  if (!existing?.subscriptionId) {
    return { body: { error: "billing_subscription_update_failed", message: "subscription_not_found", ok: false }, status: 404 };
  }
  if (existing?.lastUpdateEventId === context.payload.eventId) {
    return {
      body: {
        deduped: true,
        eventId: context.payload.eventId,
        membershipId: context.payload.membershipId,
        ok: true
      },
      status: 200
    };
  }

  const subscription = await stripeRequest(context.env, `/subscriptions/${encodeURIComponent(existing.subscriptionId)}`, {}, "GET");
  const itemId = subscription.items?.data?.[0]?.id;
  if (!itemId) {
    return { body: { error: "billing_subscription_update_failed", message: "subscription_item_not_found", ok: false }, status: 500 };
  }

  const response = await stripeRequest(context.env, `/subscriptions/${encodeURIComponent(existing.subscriptionId)}`, {
    items: `[0][id]=${encodeURIComponent(itemId)}&items[0][price]=${encodeURIComponent(context.payload.priceId)}`,
    proration_behavior: "create_prorations",
    "metadata[billingInterval]": context.payload.billingInterval,
    "metadata[eventId]": context.payload.eventId,
    "metadata[planKey]": context.payload.planKey
  }, "POST", true);

  const plan = getPlanFromEnv(context.env, context.payload.planKey);
  const canonical = {
    ...existing,
    billingInterval: context.payload.billingInterval,
    lastUpdateEventId: context.payload.eventId,
    plan,
    priceId: context.payload.priceId,
    status: response.status,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { subscriptionId: existing.subscriptionId }, `receipts/vlp/billing/subscriptions/update/${context.payload.eventId}.json`);
  await putJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`, canonical);
  await putJson(context.env, `memberships/${context.payload.membershipId}.json`, {
    ...(await getJson(context.env, `memberships/${context.payload.membershipId}.json`) || {}),
    billingInterval: context.payload.billingInterval,
    membershipId: context.payload.membershipId,
    plan,
    status: response.status,
    subscriptionId: existing.subscriptionId,
    updatedAt: new Date().toISOString()
  });

  return {
    body: {
      eventId: context.payload.eventId,
      membershipId: context.payload.membershipId,
      ok: true,
      status: "updated"
    },
    status: 200
  };
}

async function handleBillingSubscriptionCancel(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const current = await getJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`);
  if (!current?.subscriptionId) {
    return { body: { error: "subscription_not_found", ok: false }, status: 404 };
  }

  await stripeRequest(context.env, `/subscriptions/${encodeURIComponent(current.subscriptionId)}`, {
    cancel_at_period_end: "true"
  });

  const next = {
    ...current,
    canceledAt: new Date().toISOString(),
    status: "cancel_at_period_end",
    updatedAt: new Date().toISOString()
  };
  await appendReceipt(context.env, context.route, context.payload, { status: next.status }, `receipts/vlp/billing/subscriptions/cancel/${context.payload.membershipId}.json`);
  await putJson(context.env, `billing_subscriptions/${context.payload.membershipId}.json`, next);
  await putJson(context.env, `memberships/${context.payload.membershipId}.json`, {
    ...(await getJson(context.env, `memberships/${context.payload.membershipId}.json`) || {}),
    canceledAt: next.canceledAt,
    membershipId: context.payload.membershipId,
    status: next.status,
    updatedAt: next.updatedAt
  });

  return { body: { membershipId: context.payload.membershipId, ok: true, status: "canceled" }, status: 200 };
}

async function handleCheckoutCreateSession(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const existing = await getJson(context.env, `checkout_sessions/${context.payload.accountId}.json`);
  if (existing?.planKey === context.payload.planKey && existing?.status === "open" && existing?.checkoutSessionId) {
    return {
      body: {
        checkoutSessionId: existing.checkoutSessionId,
        deduped: true,
        ok: true,
        url: existing.url || null
      },
      status: 200
    };
  }

  const plan = getPlanFromEnv(context.env, context.payload.planKey);
  if (!plan.priceId) {
    return { body: { error: "validation_failed", message: "plan_price_missing", ok: false }, status: 400 };
  }

  const account = await getJson(context.env, `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`);
  const customer = await getJson(context.env, `billing_customers/${context.payload.accountId}.json`);
  const response = await stripeRequest(context.env, "/checkout/sessions", {
    mode: "subscription",
    success_url: context.payload.successUrl,
    cancel_url: context.payload.cancelUrl,
    customer: customer?.stripeCustomerId || "",
    customer_email: customer?.stripeCustomerId ? "" : String(account?.email || ""),
    "line_items[0][price]": plan.priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[metadata][accountId]": context.payload.accountId,
    "subscription_data[metadata][billingInterval]": context.payload.billingInterval,
    "subscription_data[metadata][planKey]": context.payload.planKey
  });

  await appendReceipt(context.env, context.route, context.payload, { checkoutSessionId: response.id }, `receipts/vlp/checkout/sessions/${context.payload.accountId}.json`);
  await putJson(context.env, `checkout_sessions/${context.payload.accountId}.json`, {
    accountId: context.payload.accountId,
    billingInterval: context.payload.billingInterval,
    checkoutSessionId: response.id,
    planKey: context.payload.planKey,
    status: response.status,
    url: response.url,
    updatedAt: new Date().toISOString()
  });

  return {
    body: {
      checkoutSessionId: response.id,
      ok: true,
      status: "created",
      url: response.url
    },
    status: 200
  };
}

async function handleCheckoutGetStatus(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY"]);
  const response = await stripeRequest(context.env, `/checkout/sessions/${encodeURIComponent(context.payload.sessionId)}`, {}, "GET");
  return {
    body: {
      ok: true,
      paymentStatus: response.payment_status,
      sessionId: response.id,
      status: response.status,
      subscriptionId: response.subscription || null
    },
    status: 200
  };
}

async function handleCalOAuthStart(context) {
  const provider = context.route.name.startsWith("cal_app_") ? "app" : "pro";
  const clientIdKey = provider === "app" ? "CAL_APP_OAUTH_CLIENT_ID" : "CAL_PRO_OAUTH_CLIENT_ID";
  const redirectUriKey = provider === "app" ? "CAL_APP_OAUTH_REDIRECT_URI" : "CAL_PRO_OAUTH_REDIRECT_URI";
  const authorizeUrl = String(
    context.env[provider === "app" ? "CAL_APP_OAUTH_AUTHORIZE_URL" : "CAL_PRO_OAUTH_AUTHORIZE_URL"] ||
    "https://app.cal.com/auth/oauth2/authorize"
  );

  requireEnv(context.env, [clientIdKey, redirectUriKey]);

  const state = crypto.randomUUID();
  await putJson(context.env, "auth/oauth-state/cal/" + state + ".json", {
    accountId: String(context.payload.accountId || context.session?.accountId || ""),
    createdAt: new Date().toISOString(),
    provider,
    redirectUri: context.payload.redirectUri,
    state
  });

  const authUrl = new URL(authorizeUrl);
  authUrl.searchParams.set("client_id", String(context.env[clientIdKey]));
  authUrl.searchParams.set("redirect_uri", String(context.env[redirectUriKey]));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  return {
    body: {
      authorizationUrl: authUrl.toString(),
      ok: true,
      provider: "cal_" + provider,
      status: "redirect_required"
    },
    status: 200
  };
}

async function handleCalOAuthCallback(context) {
  const stateRecord = await getJson(context.env, "auth/oauth-state/cal/" + String(context.payload.state) + ".json");
  if (!stateRecord) {
    return { body: { error: "validation_failed", message: "invalid_state", ok: false }, status: 400 };
  }

  const provider = String(stateRecord.provider || "pro");
  const clientIdKey = provider === "app" ? "CAL_APP_OAUTH_CLIENT_ID" : "CAL_PRO_OAUTH_CLIENT_ID";
  const clientSecretKey = provider === "app" ? "CAL_APP_OAUTH_CLIENT_SECRET" : "CAL_PRO_OAUTH_CLIENT_SECRET";
  const redirectUriKey = provider === "app" ? "CAL_APP_OAUTH_REDIRECT_URI" : "CAL_PRO_OAUTH_REDIRECT_URI";
  const tokenUrl = String(
    context.env[provider === "app" ? "CAL_APP_OAUTH_TOKEN_URL" : "CAL_PRO_OAUTH_TOKEN_URL"] ||
    (CAL_API_BASE + "/auth/oauth2/token")
  );

  requireEnv(context.env, [clientIdKey, clientSecretKey, redirectUriKey]);

  const tokenResponse = await fetch(tokenUrl, {
    body: new URLSearchParams({
      client_id: String(context.env[clientIdKey]),
      client_secret: String(context.env[clientSecretKey]),
      code: String(context.payload.code),
      grant_type: "authorization_code",
      redirect_uri: String(context.env[redirectUriKey])
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const tokenJson = await parseJsonResponse(tokenResponse, "cal_oauth_token_exchange_failed");

  const accountId = String(stateRecord.accountId || "");
  const profileKey = accountId ? ("profiles/" + accountId + ".json") : null;
  const existingProfile = profileKey ? ((await getJson(context.env, profileKey)) || {}) : {};
  const linkedAt = new Date().toISOString();
  const calConnection = {
    accessToken: tokenJson.access_token || null,
    expiresAt: tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null,
    linkedAt,
    provider,
    refreshToken: tokenJson.refresh_token || null,
    scope: tokenJson.scope || null,
    tokenType: tokenJson.token_type || null
  };

  if (profileKey) {
    await putJson(context.env, profileKey, {
      ...existingProfile,
      cal: {
        ...(existingProfile.cal || {}),
        [provider]: calConnection
      },
      professionalId: existingProfile.professionalId || accountId,
      updatedAt: linkedAt
    });
  }

  await appendReceipt(
    context.env,
    context.route,
    {
      accountId,
      provider,
      state: context.payload.state
    },
    { linked: true },
    "receipts/vlp/cal/" + provider + "/oauth/" + String(context.payload.state) + ".json"
  );
  await context.env.R2_VIRTUAL_LAUNCH.delete("auth/oauth-state/cal/" + String(context.payload.state) + ".json");

  return {
    body: {
      accountId: accountId || null,
      ok: true,
      provider: "cal_" + provider,
      redirectTo: getAppDashboardUrl(context.env, stateRecord.redirectUri),
      status: "callback_completed"
    },
    status: 200
  };
}

async function handleGoogleStart(context) {
  requireEnv(context.env, ["GOOGLE_CLIENT_ID", "GOOGLE_REDIRECT_URI"]);
  const state = crypto.randomUUID();
  const record = {
    createdAt: new Date().toISOString(),
    provider: "google",
    redirectUri: context.payload.redirectUri,
    state
  };
  await putJson(context.env, `auth/oauth-state/google/${state}.json`, record);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", String(context.env.GOOGLE_CLIENT_ID));
  authUrl.searchParams.set("redirect_uri", String(context.env.GOOGLE_REDIRECT_URI));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent select_account");
  authUrl.searchParams.set("state", state);

  return {
    body: {
      authorizationUrl: authUrl.toString(),
      ok: true,
      status: "redirect_required"
    },
    status: 200
  };
}

async function handleGoogleCallback(context) {
  requireEnv(context.env, ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "SESSION_SECRET"]);
  const stateRecord = await getJson(context.env, `auth/oauth-state/google/${context.payload.state}.json`);
  if (!stateRecord) {
    return { body: { error: "validation_failed", message: "invalid_state", ok: false }, status: 400 };
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: String(context.env.GOOGLE_CLIENT_ID),
      client_secret: String(context.env.GOOGLE_CLIENT_SECRET),
      code: String(context.payload.code),
      grant_type: "authorization_code",
      redirect_uri: String(context.env.GOOGLE_REDIRECT_URI)
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const tokenJson = await parseJsonResponse(tokenResponse, "google_token_exchange_failed");

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenJson.access_token}` }
  });
  const userInfo = await parseJsonResponse(userInfoResponse, "google_userinfo_failed");

  const account = await upsertOAuthAccount(context.env, {
    email: userInfo.email,
    firstName: userInfo.given_name || userInfo.name || "",
    lastName: userInfo.family_name || "",
    picture: userInfo.picture || null,
    provider: "google",
    sub: userInfo.sub
  });

  await appendReceipt(context.env, context.route, context.payload, { accountId: account.accountId, email: account.email }, `receipts/vlp/auth/google/callback/${context.payload.state}.json`);
  await context.env.R2_VIRTUAL_LAUNCH.delete(`auth/oauth-state/google/${context.payload.state}.json`);

  const session = await issueSession(context.env, account);
  return {
    body: {
      ok: true,
      redirectTo: getAppDashboardUrl(context.env, stateRecord.redirectUri),
      status: "callback_completed"
    },
    headers: { "set-cookie": session.cookie },
    status: 200
  };
}

async function handleOidcStart(context) {
  requireEnv(context.env, ["SSO_OIDC_CLIENT_ID", "SSO_OIDC_ISSUER", "SSO_OIDC_REDIRECT_URI"]);
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  await putJson(context.env, `auth/oauth-state/oidc/${state}.json`, {
    createdAt: new Date().toISOString(),
    nonce,
    provider: "oidc",
    redirectUri: context.payload.redirectUri,
    state
  });

  const issuer = String(context.env.SSO_OIDC_ISSUER).replace(/\/$/, "");
  const authUrl = new URL(`${issuer}/o/oauth2/v2/auth`);
  authUrl.searchParams.set("client_id", String(context.env.SSO_OIDC_CLIENT_ID));
  authUrl.searchParams.set("redirect_uri", String(context.env.SSO_OIDC_REDIRECT_URI));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  return {
    body: {
      authorizationUrl: authUrl.toString(),
      ok: true,
      status: "redirect_required"
    },
    status: 200
  };
}

async function handleOidcCallback(context) {
  requireEnv(context.env, ["SESSION_SECRET", "SSO_OIDC_CLIENT_ID", "SSO_OIDC_CLIENT_SECRET", "SSO_OIDC_REDIRECT_URI"]);
  const stateRecord = await getJson(context.env, `auth/oauth-state/oidc/${context.payload.state}.json`);
  if (!stateRecord) {
    return { body: { error: "validation_failed", message: "invalid_state", ok: false }, status: 400 };
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: String(context.env.SSO_OIDC_CLIENT_ID),
      client_secret: String(context.env.SSO_OIDC_CLIENT_SECRET),
      code: String(context.payload.code),
      grant_type: "authorization_code",
      redirect_uri: String(context.env.SSO_OIDC_REDIRECT_URI)
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const tokenJson = await parseJsonResponse(tokenResponse, "oidc_token_exchange_failed");

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenJson.access_token}` }
  });
  const userInfo = await parseJsonResponse(userInfoResponse, "oidc_userinfo_failed");

  const account = await upsertOAuthAccount(context.env, {
    email: userInfo.email,
    firstName: userInfo.given_name || userInfo.name || "",
    lastName: userInfo.family_name || "",
    picture: userInfo.picture || null,
    provider: "oidc",
    sub: userInfo.sub
  });

  await appendReceipt(context.env, context.route, context.payload, { accountId: account.accountId, email: account.email }, `receipts/vlp/auth/sso/oidc/callback/${context.payload.state}.json`);
  await context.env.R2_VIRTUAL_LAUNCH.delete(`auth/oauth-state/oidc/${context.payload.state}.json`);

  const session = await issueSession(context.env, account);
  return {
    body: {
      ok: true,
      status: "callback_completed"
    },
    headers: { "set-cookie": session.cookie },
    status: 200
  };
}

async function handleSamlStart(context) {
  requireEnv(context.env, ["SSO_SAML_ACS_URL", "SSO_SAML_ENTITY_ID", "SSO_SAML_IDP_SSO_URL"]);
  const acsUrl = String(context.env.SSO_SAML_ACS_URL || `${getProviderRedirectBase(context.env)}/v1/auth/sso/saml/acs`);
  const destination = String(context.env.SSO_SAML_IDP_SSO_URL);
  const entityId = String(context.env.SSO_SAML_ENTITY_ID || `${getProviderRedirectBase(context.env)}/v1/auth/sso/saml`);
  const redirectUri = String(context.payload.redirectUri || DEFAULT_APP_URL);
  const relayState = crypto.randomUUID();
  const requestId = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();

  await putJson(context.env, `auth/oauth-state/saml/${relayState}.json`, {
    acsUrl,
    createdAt: new Date().toISOString(),
    destination,
    entityId,
    provider: "saml",
    redirectUri,
    relayState,
    requestId
  });

  const authnRequestXml = buildSamlAuthnRequest({
    acsUrl,
    destination,
    entityId,
    issueInstant,
    requestId
  });
  const samlRequest = await deflateRawToBase64(authnRequestXml);
  const authorizationUrl = new URL(destination);
  authorizationUrl.searchParams.set("RelayState", relayState);
  authorizationUrl.searchParams.set("SAMLRequest", samlRequest);

  return {
    body: {
      authorizationUrl: authorizationUrl.toString(),
      ok: true,
      relayState,
      requestId,
      samlRequest,
      status: "redirect_required"
    },
    status: 200
  };
}

async function handleSamlAcs(context) {
  requireEnv(context.env, [
    "SESSION_SECRET",
    "SSO_SAML_ACS_URL",
    "SSO_SAML_ENTITY_ID",
    "SSO_SAML_IDP_CERT",
    "SSO_SAML_IDP_ENTITY_ID"
  ]);

  const relayState = String(context.payload.RelayState || "");
  const stateRecord = await getJson(context.env, `auth/oauth-state/saml/${relayState}.json`);
  if (!stateRecord) {
    return { body: { error: "validation_failed", message: "invalid_relay_state", ok: false }, status: 400 };
  }

  const samlXml = decodeBase64Utf8(String(context.payload.SAMLResponse || ""));
  const parsed = parseSamlResponseDocument(samlXml);
  const now = Date.now();

  if (!parsed.statusCode.endsWith(":Success")) {
    return { body: { error: "validation_failed", message: "saml_status_not_success", ok: false }, status: 400 };
  }
  if (parsed.destination && parsed.destination !== String(context.env.SSO_SAML_ACS_URL)) {
    return { body: { error: "validation_failed", message: "destination_mismatch", ok: false }, status: 400 };
  }
  if (parsed.inResponseTo && parsed.inResponseTo !== stateRecord.requestId) {
    return { body: { error: "validation_failed", message: "in_response_to_mismatch", ok: false }, status: 400 };
  }
  if (parsed.issuer !== String(context.env.SSO_SAML_IDP_ENTITY_ID)) {
    return { body: { error: "validation_failed", message: "issuer_mismatch", ok: false }, status: 400 };
  }
  if (parsed.audience !== String(context.env.SSO_SAML_ENTITY_ID)) {
    return { body: { error: "validation_failed", message: "audience_mismatch", ok: false }, status: 400 };
  }
  if (parsed.notBefore && now + 30000 < Date.parse(parsed.notBefore)) {
    return { body: { error: "validation_failed", message: "assertion_not_yet_valid", ok: false }, status: 400 };
  }
  if (parsed.notOnOrAfter && now - 30000 >= Date.parse(parsed.notOnOrAfter)) {
    return { body: { error: "validation_failed", message: "assertion_expired", ok: false }, status: 400 };
  }

  const validation = await verifySamlSignatures(context.env.SSO_SAML_IDP_CERT, samlXml, parsed);
  if (!validation.valid) {
    return { body: { error: "validation_failed", message: validation.reason, ok: false }, status: 401 };
  }

  const email = parsed.email || parsed.nameId;
  if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
    return { body: { error: "validation_failed", message: "email_not_found", ok: false }, status: 400 };
  }

  const account = await upsertOAuthAccount(context.env, {
    email,
    firstName: parsed.firstName || "",
    lastName: parsed.lastName || "",
    picture: null,
    provider: "saml",
    sub: parsed.nameId || email
  });

  await appendReceipt(
    context.env,
    context.route,
    {
      accountId: account.accountId,
      email,
      relayState,
      samlIssuer: parsed.issuer
    },
    { validated: true },
    `receipts/vlp/auth/sso/saml/acs/${relayState}.json`
  );
  await context.env.R2_VIRTUAL_LAUNCH.delete(`auth/oauth-state/saml/${relayState}.json`);

  const session = await issueSession(context.env, account);
  return {
    body: {
      ok: true,
      redirectTo: getAppDashboardUrl(context.env, stateRecord.redirectUri),
      status: "callback_completed"
    },
    headers: { "set-cookie": session.cookie },
    status: 200
  };
}

async function handleListByField(context, prefix, field, responseKey, single = false) {
  const targetValue = context.payload.accountId || context.payload.professionalId;
  const records = await listJson(context.env, prefix);
  const filtered = records.filter((record) => String(record?.[field] || "") === String(targetValue || ""));
  return {
    body: { ok: true, [responseKey]: single ? (filtered[0] || null) : filtered },
    status: 200
  };
}

async function handleLogout(context) {
  return {
    body: { ok: true, status: "logged_out" },
    headers: { "set-cookie": cookieHeader("", context.env, "1970-01-01T00:00:00.000Z") },
    status: 200
  };
}

async function handleMagicLinkRequest(context) {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + Number(context.env.MAGIC_LINK_EXPIRATION_MINUTES || 15) * 60 * 1000).toISOString();
  const record = {
    accountId: context.payload.accountId || null,
    email: context.payload.email,
    expiresAt,
    tokenId
  };
  await putJson(context.env, "auth/magic-links/" + tokenId + ".json", record);

  const verifyUrl = new URL("/v1/auth/magic-link/verify", context.request.url);
  verifyUrl.searchParams.set("token", tokenId);

  const delivery = await sendMagicLinkEmail(context.env, {
    expiresAt,
    magicLinkUrl: verifyUrl.toString(),
    to: context.payload.email
  });

  await appendReceipt(context.env, context.route, context.payload, {
    deliveryStatus: delivery.status,
    emailSent: delivery.sent,
    tokenId
  });

  return {
    body: {
      delivery,
      magicLinkUrl: verifyUrl.toString(),
      ok: true,
      status: "issued",
      tokenId
    },
    status: 200
  };
}

async function handleMagicLinkVerify(context) {
  const tokenId = String(context.payload.token || "");
  if (!tokenId) {
    return { body: { error: "missing_token", ok: false }, status: 400 };
  }

  const record = await getJson(context.env, `auth/magic-links/${tokenId}.json`);
  if (!record) {
    return { body: { error: "invalid_token", ok: false }, status: 404 };
  }

  if (record.expiresAt && Date.now() > new Date(record.expiresAt).getTime()) {
    await context.env.R2_VIRTUAL_LAUNCH.delete(`auth/magic-links/${tokenId}.json`);
    return { body: { error: "expired_token", ok: false }, status: 410 };
  }

  const account = record.accountId
    ? await getJson(context.env, `accounts_vlp/VLP_ACCT_${record.accountId}.json`)
    : await findAccountByEmail(context.env, record.email);

  if (!account?.accountId) {
    return { body: { error: "account_not_found", ok: false }, status: 404 };
  }

  const session = await issueSession(context.env, account);
  await context.env.R2_VIRTUAL_LAUNCH.delete(`auth/magic-links/${tokenId}.json`);

  return {
    body: { accountId: account.accountId, ok: true, status: "verified" },
    headers: { "set-cookie": session.cookie },
    status: 200
  };
}

async function handleNotificationsList(context) {
  const records = await listJson(context.env, "notifications/in-app/");
  const accountId = String(context.payload.accountId || "");
  const limit = Number(context.payload.limit || 25);
  const notifications = records.filter((record) => String(record?.accountId || "") === accountId).slice(0, limit);
  return { body: { notifications, ok: true }, status: 200 };
}

function handleSessionGet(context) {
  if (!context.session.authenticated) {
    return { body: { authenticated: false, ok: true }, status: 200 };
  }
  return {
    body: {
      accountId: context.session.accountId,
      authenticated: true,
      email: context.session.email || null,
      ok: true,
      role: context.session.role || null
    },
    status: 200
  };
}

async function handleSingle(context, emptyObjectFallback) {
  const key = applyTemplate(context.route.key, context.payload);
  const record = await getJson(context.env, key);
  const bodyKey = inferBodyKey(context.route.name);
  return {
    body: { [bodyKey]: record || (emptyObjectFallback ? {} : null), ok: true },
    status: record || emptyObjectFallback ? 200 : 404
  };
}

async function handleSmsSend(context) {
  requireEnv(context.env, ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]);
  const eventId = String(context.payload.accountId);
  const existing = await getJson(context.env, `sms_messages/${eventId}.json`);
  if (existing?.messageSid && existing?.message === context.payload.message && existing?.phone === context.payload.phone) {
    return {
      body: { accountId: context.payload.accountId, deduped: true, ok: true, status: existing.status || "queued" },
      status: 200
    };
  }

  const response = await twilioRequest(context.env, `/Accounts/${context.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    Body: context.payload.message,
    From: context.env.TWILIO_PHONE_NUMBER,
    To: context.payload.phone,
    StatusCallback: `${getProviderRedirectBase(context.env)}/v1/webhooks/twilio`
  });

  const canonical = {
    accountId: context.payload.accountId,
    createdAt: new Date().toISOString(),
    message: context.payload.message,
    messageSid: response.sid,
    phone: context.payload.phone,
    status: response.status,
    updatedAt: new Date().toISOString()
  };

  await appendReceipt(context.env, context.route, context.payload, { messageSid: response.sid }, `receipts/vlp/notifications/sms/${context.payload.accountId}.json`);
  await putJson(context.env, `sms_messages/${context.payload.accountId}.json`, canonical);

  const preferences = (await getJson(context.env, `vlp_preferences/${context.payload.accountId}.json`)) || { accountId: context.payload.accountId };
  preferences.lastSmsAt = new Date().toISOString();
  preferences.lastSmsMessageSid = response.sid;
  preferences.updatedAt = new Date().toISOString();
  await putJson(context.env, `vlp_preferences/${context.payload.accountId}.json`, preferences);

  return {
    body: { accountId: context.payload.accountId, ok: true, status: "queued" },
    status: 200
  };
}

async function handleStripeWebhook(context) {
  requireEnv(context.env, ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  const rawBody = await context.request.text();
  const signature = context.request.headers.get("Stripe-Signature") || "";
  const event = await verifyStripeWebhook(context.env, rawBody, signature);

  const eventId = String(event.id || "");
  const eventType = String(event.type || "");
  const stripeObjectId = String(event.data?.object?.id || "");
  if (!eventId || !eventType || !stripeObjectId) {
    return { body: { error: "validation_failed", ok: false }, status: 400 };
  }

  const existing = await getJson(context.env, `webhooks/stripe/${eventId}.json`);
  if (existing) {
    return { body: { deduped: true, eventId, ok: true }, status: 200 };
  }

  await appendReceipt(context.env, context.route, { eventId, eventType, stripeObjectId }, { stripeEvent: event }, `receipts/vlp/webhooks/stripe/${eventId}.json`);
  await putJson(context.env, `webhooks/stripe/${eventId}.json`, {
    eventId,
    eventType,
    receivedAt: new Date().toISOString(),
    stripeObjectId
  });

  await reconcileStripeWebhook(context.env, event);

  return {
    body: { eventId, ok: true, status: "received" },
    status: 200
  };
}

async function handleTwilioWebhook(context) {
  requireEnv(context.env, ["TWILIO_AUTH_TOKEN"]);
  const form = await context.request.clone().formData();
  const payload = Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
  const signature = context.request.headers.get("X-Twilio-Signature") || "";
  const url = context.request.url;
  const valid = await verifyTwilioSignature(context.env.TWILIO_AUTH_TOKEN, url, payload, signature);
  if (!valid) {
    return { body: { error: "invalid_signature", ok: false }, status: 401 };
  }

  const messageSid = String(payload.MessageSid || payload.SmsSid || "");
  const messageStatus = String(payload.MessageStatus || "");
  const eventId = messageSid;
  if (!eventId || !messageStatus) {
    return { body: { error: "validation_failed", ok: false }, status: 400 };
  }

  const existing = await getJson(context.env, `webhooks/twilio/${eventId}.json`);
  if (existing) {
    return { body: { deduped: true, eventId, ok: true }, status: 200 };
  }

  await appendReceipt(context.env, context.route, { eventId, messageSid, messageStatus }, { payload }, `receipts/vlp/webhooks/twilio/${eventId}.json`);
  await putJson(context.env, `webhooks/twilio/${eventId}.json`, {
    eventId,
    messageSid,
    messageStatus,
    receivedAt: new Date().toISOString()
  });

  return {
    body: { eventId, ok: true, status: "received" },
    status: 200
  };
}

async function handleTokenPurchase(context) {
  const key = applyTemplate(context.route.key, context.payload);
  const current = (await getJson(context.env, key)) || { accountId: context.payload.accountId, tax_game: 0, transcript: 0 };
  const field = context.payload.tokenType === "tax_game" ? "tax_game" : "transcript";
  current[field] = Number(current[field] || 0) + Number(context.payload.quantity || 0);
  current.updatedAt = new Date().toISOString();
  await appendReceipt(context.env, context.route, context.payload, { tokenField: field });
  await putJson(context.env, key, current);
  return {
    body: { accountId: context.payload.accountId, eventId: context.payload.eventId, ok: true, status: "purchased" },
    status: 200
  };
}

async function handleTokenBalanceGet(context) {
  const record = (await getJson(context.env, `tokens/${context.payload.accountId}.json`)) || {
    accountId: context.payload.accountId,
    tax_game: 0,
    transcript: 0,
    updatedAt: null
  };

  return {
    body: {
      balance: {
        accountId: context.payload.accountId,
        taxGameTokens: Number(record.tax_game || 0),
        transcriptTokens: Number(record.transcript || 0),
        updatedAt: record.updatedAt || null
      },
      ok: true,
      status: "retrieved"
    },
    status: 200
  };
}

async function handleTokenUsageList(context) {
  const limit = Number(context.payload.limit || 50);
  const prefixes = [
    "receipts/vlp/tokens/debits/",
    "receipts/vlp/tokens/usage/",
    "receipts/vlp/tokens/consumption/"
  ];

  const usage = [];
  for (const prefix of prefixes) {
    const records = await listJson(context.env, prefix);
    for (const record of records) {
      const payloadAccountId = String(record?.payload?.accountId || record?.accountId || "");
      if (payloadAccountId === String(context.payload.accountId || "")) {
        usage.push({
          accountId: payloadAccountId,
          amount: Number(record?.payload?.amount || 0),
          eventId: record?.eventId || null,
          feature: record?.feature || record?.payload?.feature || null,
          quantity: Number(record?.quantity || record?.payload?.quantity || 0),
          recordedAt: record?.recordedAt || null,
          referenceId: record?.referenceId || record?.payload?.referenceId || null,
          tokenField: record?.tokenField || normalizeTokenField(record?.payload?.tokenType || record?.payload?.tokenField || null),
          tokenType: record?.tokenType || record?.payload?.tokenType || null,
          type: record?.type || "debit"
        });
      }
    }
  }

  usage.sort((left, right) => String(right.recordedAt || "").localeCompare(String(left.recordedAt || "")));

  return {
    body: {
      ok: true,
      status: "retrieved",
      usage: usage.slice(0, limit)
    },
    status: 200
  };
}

async function handleTwoFactorDisable(context) {
  const key = `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`;
  const current = await getJson(context.env, key);
  if (!current) {
    return { body: { error: "account_not_found", ok: false }, status: 404 };
  }
  if (String(current?.auth?.challengeToken || "") !== String(context.payload.challengeToken || "")) {
    return { body: { error: "challenge_invalid", ok: false }, status: 400 };
  }
  current.auth = { ...(current.auth || {}), challengeToken: null, pendingTwoFactorCode: null, twoFactorEnabled: false };
  current.updatedAt = new Date().toISOString();
  await putJson(context.env, key, current);
  return { body: { accountId: context.payload.accountId, ok: true, status: "disabled" }, status: 200 };
}

async function handleTwoFactorEnrollInit(context) {
  const key = `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`;
  const current = await getJson(context.env, key);
  if (!current) {
    return { body: { error: "account_not_found", ok: false }, status: 404 };
  }
  const challenge = String(Math.floor(100000 + Math.random() * 900000));
  current.auth = { ...(current.auth || {}), pendingTwoFactorCode: challenge };
  current.updatedAt = new Date().toISOString();
  await putJson(context.env, key, current);
  return { body: { accountId: context.payload.accountId, challenge, ok: true, status: "enrollment_started" }, status: 200 };
}

async function handleTwoFactorEnrollVerify(context) {
  const key = `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`;
  const current = await getJson(context.env, key);
  if (!current) {
    return { body: { error: "account_not_found", ok: false }, status: 404 };
  }
  if (String(current?.auth?.pendingTwoFactorCode || "") !== String(context.payload.otpCode || "")) {
    return { body: { error: "otp_invalid", ok: false }, status: 400 };
  }
  current.auth = {
    ...(current.auth || {}),
    challengeToken: crypto.randomUUID(),
    pendingTwoFactorCode: null,
    twoFactorEnabled: true
  };
  current.updatedAt = new Date().toISOString();
  await putJson(context.env, key, current);
  return { body: { accountId: context.payload.accountId, ok: true, status: "enrollment_verified" }, status: 200 };
}

async function handleTwoFactorStatus(context) {
  const current = await getJson(context.env, `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`);
  return {
    body: { accountId: context.payload.accountId, enabled: Boolean(current?.auth?.twoFactorEnabled), ok: true },
    status: 200
  };
}

async function handleTwoFactorVerifyChallenge(context) {
  const current = await getJson(context.env, `accounts_vlp/VLP_ACCT_${context.payload.accountId}.json`);
  if (!current) {
    return { body: { error: "account_not_found", ok: false }, status: 404 };
  }
  if (String(current?.auth?.challengeToken || "") !== String(context.payload.challengeToken || "")) {
    return { body: { error: "challenge_invalid", ok: false }, status: 400 };
  }
  return { body: { accountId: context.payload.accountId, ok: true, status: "verified" }, status: 200 };
}

async function handleUpsert(context) {
  const key = applyTemplate(context.route.key, context.payload);
  const existing = key ? await getJson(context.env, key) : null;
  const timestamp = new Date().toISOString();
  const next = {
    ...(existing || {}),
    ...context.payload,
    createdAt: existing?.createdAt || timestamp,
    source: context.route.name,
    updatedAt: timestamp
  };
  await appendReceipt(context.env, context.route, context.payload);
  await putJson(context.env, key, next);
  const eventId = String(context.payload.eventId || context.payload.accountId || context.payload.bookingId || context.payload.membershipId || crypto.randomUUID());
  return {
    body: buildUpsertResponse(context.route.name, context.payload, eventId),
    status: 200
  };
}

function buildSamlAuthnRequest({ acsUrl, destination, entityId, issueInstant, requestId }) {
  return `<?xml version="1.0" encoding="UTF-8"?><samlp:AuthnRequest xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" AssertionConsumerServiceURL="${escapeXml(acsUrl)}" Destination="${escapeXml(destination)}" ID="${escapeXml(requestId)}" IssueInstant="${escapeXml(issueInstant)}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Version="2.0"><saml:Issuer>${escapeXml(entityId)}</saml:Issuer><samlp:NameIDPolicy AllowCreate="true" Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/></samlp:AuthnRequest>`;
}

function decodeBase64Utf8(value) {
  const normalized = String(value || "").replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function deflateRawToBase64(value) {
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([new TextEncoder().encode(String(value))]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const compressed = await new Response(stream).arrayBuffer();
    return toStandardBase64(compressed);
  }
  return toStandardBase64(value);
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function extractSamlValue(xml, pattern, fallback = "") {
  const match = String(xml || "").match(pattern);
  return match ? decodeXmlEntities(match[1]) : fallback;
}

function extractXmlBlock(xml, localName) {
  const pattern = String.raw`<([A-Za-z0-9_:-]+:)?${localName}\b[\s\S]*?<\/([A-Za-z0-9_:-]+:)?${localName}>`;
  const match = String(xml || "").match(new RegExp(pattern, "i"));
  return match ? match[0] : "";
}

function getAttributeValue(xml, attributeName) {
  const pattern = new RegExp(`${attributeName}="([^"]*)"`, "i");
  const match = String(xml || "").match(pattern);
  return match ? decodeXmlEntities(match[1]) : "";
}

function parseSamlAttributes(assertionXml) {
  const attributes = {};
  const pattern = /<(?:[A-Za-z0-9_:-]+:)?Attribute\b[^>]*Name="([^"]+)"[^>]*>[\s\S]*?<(?:[A-Za-z0-9_:-]+:)?AttributeValue\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?AttributeValue>[\s\S]*?<\/(?:[A-Za-z0-9_:-]+:)?Attribute>/gi;
  let match;
  while ((match = pattern.exec(assertionXml))) {
    attributes[decodeXmlEntities(match[1])] = decodeXmlEntities(match[2].replace(/<[^>]+>/g, "").trim());
  }
  return attributes;
}

function parseSamlResponseDocument(samlXml) {
  const responseXml = extractXmlBlock(samlXml, "Response");
  const assertionXml = extractXmlBlock(samlXml, "Assertion");
  const attributes = parseSamlAttributes(assertionXml);
  const issuer = extractSamlValue(assertionXml, /<(?:[A-Za-z0-9_:-]+:)?Issuer\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?Issuer>/i) || extractSamlValue(responseXml, /<(?:[A-Za-z0-9_:-]+:)?Issuer\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?Issuer>/i);

  return {
    audience: extractSamlValue(assertionXml, /<(?:[A-Za-z0-9_:-]+:)?Audience\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?Audience>/i),
    destination: getAttributeValue(responseXml, "Destination"),
    email: attributes.email || attributes.mail || attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "",
    firstName: attributes.firstName || attributes.given_name || attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] || "",
    inResponseTo: getAttributeValue(responseXml, "InResponseTo") || getAttributeValue(assertionXml, "InResponseTo"),
    issuer,
    lastName: attributes.lastName || attributes.family_name || attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] || "",
    nameId: extractSamlValue(assertionXml, /<(?:[A-Za-z0-9_:-]+:)?NameID\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?NameID>/i),
    notBefore: getAttributeValue(assertionXml, "NotBefore"),
    notOnOrAfter: getAttributeValue(assertionXml, "NotOnOrAfter"),
    responseXml,
    statusCode: extractSamlValue(responseXml, /<(?:[A-Za-z0-9_:-]+:)?StatusCode\b[^>]*Value="([^"]*)"[^>]*\/?>(?:<\/(?:[A-Za-z0-9_:-]+:)?StatusCode>)?/i),
    trustedEmbeddedCert: extractSamlValue(samlXml, /<(?:[A-Za-z0-9_:-]+:)?X509Certificate\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_:-]+:)?X509Certificate>/i).replace(/\s+/g, "")
  };
}

async function verifySamlSignatures(trustedCertBase64, samlXml, parsed) {
  const trustedNormalized = normalizeBase64Block(trustedCertBase64);
  if (!parsed.trustedEmbeddedCert) {
    return { reason: "signature_missing", valid: false };
  }
  if (parsed.trustedEmbeddedCert !== trustedNormalized) {
    return { reason: "certificate_mismatch", valid: false };
  }

  if (typeof DOMParser === "undefined") {
    return { reason: "xml_parser_unavailable", valid: false };
  }

  const document = new DOMParser().parseFromString(String(samlXml || ""), "text/xml");
  if (document.getElementsByTagName("parsererror").length) {
    return { reason: "xml_parse_failed", valid: false };
  }

  const signedRoot = findSignedRoot(document);
  if (!signedRoot) {
    return { reason: "signature_missing", valid: false };
  }

  const signature = getFirstDescendantByLocalName(signedRoot, "Signature");
  const signedInfo = getDirectChildByLocalName(signature, "SignedInfo");
  const signatureValueNode = getDirectChildByLocalName(signature, "SignatureValue");
  if (!signedInfo || !signatureValueNode) {
    return { reason: "signature_structure_invalid", valid: false };
  }

  const canonicalizationMethodNode = getFirstDescendantByLocalName(signedInfo, "CanonicalizationMethod");
  const canonicalizationAlgorithmUri = readAttribute(canonicalizationMethodNode, "Algorithm");
  if (!isSupportedCanonicalizationAlgorithm(canonicalizationAlgorithmUri)) {
    return { reason: "unsupported_canonicalization_algorithm", valid: false };
  }

  const signatureMethodNode = getFirstDescendantByLocalName(signedInfo, "SignatureMethod");
  const signatureAlgorithmUri = readAttribute(signatureMethodNode, "Algorithm");
  const signatureHash = mapSignatureHash(signatureAlgorithmUri);
  if (!signatureHash) {
    return { reason: "unsupported_signature_algorithm", valid: false };
  }

  const referenceNode = getDirectChildByLocalName(signedInfo, "Reference");
  const referenceUri = readAttribute(referenceNode, "URI");
  const signedElement = findSignedElementByReference(document, referenceUri, signedRoot);
  if (!referenceNode || !signedElement) {
    return { reason: "reference_not_found", valid: false };
  }

  const transforms = getTransforms(referenceNode);
  if (!areSupportedTransforms(transforms)) {
    return { reason: "unsupported_reference_transform", valid: false };
  }

  const digestMethodNode = getFirstDescendantByLocalName(referenceNode, "DigestMethod");
  const digestAlgorithmUri = readAttribute(digestMethodNode, "Algorithm");
  const digestHash = mapDigestHash(digestAlgorithmUri);
  if (!digestHash) {
    return { reason: "unsupported_digest_algorithm", valid: false };
  }

  const digestValueNode = getFirstDescendantByLocalName(referenceNode, "DigestValue");
  const expectedDigest = normalizeBase64Block(digestValueNode ? digestValueNode.textContent : "");
  if (!expectedDigest) {
    return { reason: "digest_missing", valid: false };
  }

  const signedClone = signedElement.cloneNode(true);
  applyInheritedNamespaces(signedElement, signedClone);
  if (transforms.includes("http://www.w3.org/2000/09/xmldsig#enveloped-signature")) {
    removeDescendantsByLocalName(signedClone, "Signature");
  }
  const canonicalSignedElement = canonicalizeElement(signedClone);
  const actualDigest = await digestBase64(canonicalSignedElement, digestHash);
  if (actualDigest !== expectedDigest) {
    return { reason: "digest_mismatch", valid: false };
  }

  const signedInfoClone = signedInfo.cloneNode(true);
  applyInheritedNamespaces(signedInfo, signedInfoClone);
  const canonicalSignedInfo = canonicalizeElement(signedInfoClone);
  const publicKey = await importCertificatePublicKey(trustedNormalized, signatureHash);
  const signatureBytes = base64ToUint8Array(normalizeBase64Block(signatureValueNode.textContent || ""));
  const verified = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signatureBytes,
    new TextEncoder().encode(canonicalSignedInfo)
  );

  if (!verified) {
    return { reason: "signature_verification_failed", valid: false };
  }

  return { reason: "verified", valid: true };
}

function applyInheritedNamespaces(sourceNode, cloneNode) {
  const namespaces = new Map();
  let current = sourceNode;
  while (current && current.nodeType === 1) {
    for (const attribute of Array.from(current.attributes || [])) {
      if (!attribute.name || !attribute.name.startsWith("xmlns")) continue;
      if (!namespaces.has(attribute.name)) {
        namespaces.set(attribute.name, attribute.value || "");
      }
    }
    current = current.parentNode;
  }
  const ordered = Array.from(namespaces.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  for (const [name, value] of ordered) {
    if (!cloneNode.hasAttribute(name)) {
      cloneNode.setAttribute(name, value);
    }
  }
}

function base64ToUint8Array(value) {
  const binary = atob(String(value || ""));
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

function canonicalizeAttributes(node) {
  return Array.from(node.attributes || [])
    .map((attribute) => ({
      name: attribute.name,
      namespaceURI: attribute.namespaceURI || "",
      value: attribute.value || ""
    }))
    .sort(compareCanonicalAttributeOrder)
    .map((attribute) => ` ${attribute.name}="${escapeXmlAttributeValue(attribute.value)}"`)
    .join("");
}

function canonicalizeElement(node) {
  if (!node) return "";
  if (node.nodeType === 3 || node.nodeType === 4) {
    return escapeXmlTextValue(node.nodeValue || "");
  }
  if (node.nodeType !== 1) {
    return "";
  }

  const open = `<${node.tagName}${canonicalizeAttributes(node)}>`;
  const children = Array.from(node.childNodes || []).map((child) => canonicalizeElement(child)).join("");
  const close = `</${node.tagName}>`;
  return `${open}${children}${close}`;
}

async function digestBase64(value, hashName) {
  const buffer = await crypto.subtle.digest(hashName, new TextEncoder().encode(String(value || "")));
  return toStandardBase64(buffer);
}

function escapeXmlAttributeValue(value) {
  return String(value || "")
    .split("&").join("&amp;")
    .split("\"").join("&quot;")
    .split("<").join("&lt;")
    .split(">").join("&gt;");
}

function escapeXmlTextValue(value) {
  return String(value || "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;");
}

function findSignedElementByReference(document, referenceUri, fallbackNode) {
  const id = String(referenceUri || "").startsWith("#") ? String(referenceUri).slice(1) : "";
  if (!id) return fallbackNode || null;
  const elements = Array.from(document.getElementsByTagName("*"));
  for (const element of elements) {
    const elementId = element.getAttribute("ID") || element.getAttribute("Id") || element.getAttribute("id");
    if (elementId === id) {
      return element;
    }
  }
  return null;
}

function findSignedRoot(document) {
  const assertion = getFirstDescendantByLocalName(document, "Assertion");
  if (assertion && getFirstDescendantByLocalName(assertion, "Signature")) {
    return assertion;
  }
  const response = getFirstDescendantByLocalName(document, "Response");
  if (response && getFirstDescendantByLocalName(response, "Signature")) {
    return response;
  }
  return null;
}

function getDirectChildByLocalName(node, localName) {
  if (!node) return null;
  for (const child of Array.from(node.childNodes || [])) {
    if (child.nodeType === 1 && child.localName === localName) {
      return child;
    }
  }
  return null;
}

function getFirstDescendantByLocalName(node, localName) {
  if (!node || !node.getElementsByTagName) return null;
  const elements = Array.from(node.getElementsByTagName("*"));
  return elements.find((element) => element.localName === localName) || null;
}

function getSequenceChildren(bytes, element) {
  const children = [];
  let offset = element.valueStart;
  while (offset < element.valueEnd) {
    const child = parseDerElement(bytes, offset);
    children.push(child);
    offset = child.end;
  }
  return children;
}

async function importCertificatePublicKey(certBase64, hashName) {
  const spki = extractSpkiFromCertificate(base64ToUint8Array(certBase64));
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSASSA-PKCS1-v1_5", hash: { name: hashName } },
    false,
    ["verify"]
  );
}

function extractSpkiFromCertificate(certBytes) {
  const certificate = parseDerElement(certBytes, 0);
  const certificateChildren = getSequenceChildren(certBytes, certificate);
  const tbsCertificate = certificateChildren[0];
  const tbsChildren = getSequenceChildren(certBytes, tbsCertificate);
  const offset = tbsChildren[0] && tbsChildren[0].tag === 160 ? 1 : 0;
  const spki = tbsChildren[offset + 5];
  return certBytes.slice(spki.start, spki.end).buffer;
}

function mapDigestHash(algorithmUri) {
  if (algorithmUri === "http://www.w3.org/2000/09/xmldsig#sha1") return "SHA-1";
  if (algorithmUri === "http://www.w3.org/2001/04/xmlenc#sha256") return "SHA-256";
  if (algorithmUri === "http://www.w3.org/2001/04/xmlenc#sha512") return "SHA-512";
  return null;
}

function mapSignatureHash(algorithmUri) {
  if (algorithmUri === "http://www.w3.org/2000/09/xmldsig#rsa-sha1") return "SHA-1";
  if (algorithmUri === "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256") return "SHA-256";
  if (algorithmUri === "http://www.w3.org/2001/04/xmldsig-more#rsa-sha384") return "SHA-384";
  if (algorithmUri === "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512") return "SHA-512";
  return null;
}

function normalizeBase64Block(value) {
  return String(value || "")
    .split("\n").join("")
    .split("\r").join("")
    .split("\t").join("")
    .split(" ").join("");
}

function compareCanonicalAttributeOrder(left, right) {
  const leftNamespace = left.name === "xmlns" ? "" : (left.name.startsWith("xmlns:") ? "http://www.w3.org/2000/xmlns/" : left.namespaceURI);
  const rightNamespace = right.name === "xmlns" ? "" : (right.name.startsWith("xmlns:") ? "http://www.w3.org/2000/xmlns/" : right.namespaceURI);
  if (leftNamespace !== rightNamespace) {
    return leftNamespace.localeCompare(rightNamespace);
  }
  const leftLocal = left.name.includes(":") ? left.name.split(":").slice(1).join(":") : left.name;
  const rightLocal = right.name.includes(":") ? right.name.split(":").slice(1).join(":") : right.name;
  return leftLocal.localeCompare(rightLocal);
}

function getTransforms(referenceNode) {
  const transformsNode = getFirstDescendantByLocalName(referenceNode, "Transforms");
  if (!transformsNode) return [];
  return Array.from(transformsNode.childNodes || [])
    .filter((child) => child.nodeType === 1 && child.localName === "Transform")
    .map((child) => readAttribute(child, "Algorithm"))
    .filter(Boolean);
}

function isSupportedCanonicalizationAlgorithm(algorithmUri) {
  return [
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments",
    "http://www.w3.org/2001/10/xml-exc-c14n#",
    "http://www.w3.org/2001/10/xml-exc-c14n#WithComments"
  ].includes(String(algorithmUri || ""));
}

function areSupportedTransforms(transforms) {
  const allowed = new Set([
    "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments",
    "http://www.w3.org/2001/10/xml-exc-c14n#",
    "http://www.w3.org/2001/10/xml-exc-c14n#WithComments"
  ]);
  return transforms.every((transform) => allowed.has(String(transform || "")));
}

function parseDerElement(bytes, start) {
  const tag = bytes[start];
  const lengthByte = bytes[start + 1];
  let length = 0;
  let headerLength = 2;

  if ((lengthByte & 128) === 0) {
    length = lengthByte;
  } else {
    const lengthOfLength = lengthByte & 127;
    headerLength = 2 + lengthOfLength;
    for (let index = 0; index < lengthOfLength; index += 1) {
      length = (length << 8) | bytes[start + 2 + index];
    }
  }

  return {
    end: start + headerLength + length,
    headerLength,
    length,
    start,
    tag,
    valueEnd: start + headerLength + length,
    valueStart: start + headerLength
  };
}

function readAttribute(node, name) {
  return node && node.getAttribute ? node.getAttribute(name) || "" : "";
}

function removeDescendantsByLocalName(node, localName) {
  if (!node) return;
  const matches = [];
  for (const element of Array.from(node.getElementsByTagName("*"))) {
    if (element.localName === localName) {
      matches.push(element);
    }
  }
  for (const match of matches) {
    if (match.parentNode) {
      match.parentNode.removeChild(match);
    }
  }
}

function toStandardBase64(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new TextEncoder().encode(String(input));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function creditPlanTokens(env, accountId, plan) {
  const key = `tokens/${accountId}.json`;
  const current = (await getJson(env, key)) || { accountId, tax_game: 0, transcript: 0 };
  current.tax_game = Number(current.tax_game || 0) + Number(plan.taxGameTokens || 0);
  current.transcript = Number(current.transcript || 0) + Number(plan.transcriptTokens || 0);
  current.updatedAt = new Date().toISOString();
  await putJson(env, key, current);
}

async function debitTokenBalance(env, input) {
  const accountId = String(input?.accountId || "");
  const quantity = Number(input?.quantity || 0);
  const tokenField = normalizeTokenField(input?.tokenType || input?.tokenField);

  if (!accountId) {
    throw new Error("token_debit_account_id_required");
  }
  if (!tokenField) {
    throw new Error("token_debit_type_required");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("token_debit_quantity_invalid");
  }

  const key = `tokens/${accountId}.json`;
  const current = (await getJson(env, key)) || { accountId, tax_game: 0, transcript: 0 };
  const available = Number(current[tokenField] || 0);
  if (available < quantity) {
    throw new Error("insufficient_tokens");
  }

  current[tokenField] = available - quantity;
  current.updatedAt = new Date().toISOString();

  const eventId = String(input?.eventId || crypto.randomUUID());
  const receiptPayload = {
    accountId,
    amount: Number(input?.amount || 0),
    feature: input?.feature || null,
    quantity,
    referenceId: input?.referenceId || null,
    tokenField,
    tokenType: input?.tokenType || tokenField
  };

  await putJson(env, key, current);
  await putJson(env, `receipts/vlp/tokens/debits/${eventId}.json`, {
    accountId,
    eventId,
    feature: receiptPayload.feature,
    payload: receiptPayload,
    quantity,
    recordedAt: new Date().toISOString(),
    referenceId: receiptPayload.referenceId,
    route: "token_debit",
    tokenField,
    tokenType: receiptPayload.tokenType,
    type: "debit"
  });

  return {
    accountId,
    balance: Number(current[tokenField] || 0),
    eventId,
    ok: true,
    quantity,
    status: "debited",
    tokenField
  };
}

function normalizeTokenField(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "tax_game" || normalized === "taxgame" || normalized === "tax-game") return "tax_game";
  if (normalized === "transcript" || normalized === "transcripts") return "transcript";
  return "";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function inferReceiptKey(prefix, record) {
  return `${prefix}${String(record?.eventId || "unknown")}.json`;
}

function inferBodyKey(routeName) {
  if (routeName.startsWith("account_")) return "account";
  if (routeName.startsWith("membership_")) return "membership";
  if (routeName.startsWith("profile_")) return "profile";
  if (routeName.startsWith("support_ticket_")) return "ticket";
  if (routeName.includes("preferences")) return "preferences";
  return "record";
}

async function issueSession(env, account) {
  const expiresAt = new Date(Date.now() + Number(env.SESSION_TTL_SECONDS || 86400) * 1000).toISOString();
  const token = await createSignedToken({
    accountId: account.accountId,
    email: account.email,
    expiresAt,
    role: account.role || "professional"
  }, String(env.SESSION_SECRET || env.JWT_SECRET));
  return { cookie: cookieHeader(token, env, expiresAt), expiresAt, token };
}

function isAllowedMethod(method) {
  return ["DELETE", "GET", "OPTIONS", "PATCH", "POST"].includes(method);
}

function json(request, status, body) {
  return withCors(request, new Response(JSON.stringify(body, null, 2), {
    headers: JSON_HEADERS,
    status
  }));
}

async function listJson(env, prefix) {
  const out = [];
  let cursor;
  do {
    const listing = await env.R2_VIRTUAL_LAUNCH.list({ cursor, prefix });
    for (const object of listing.objects) {
      const value = await getJson(env, object.key);
      if (value) out.push(value);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
  return out;
}

function matchRoute(method, pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const params = matchSegments(route.pattern, normalizedPath);
    if (params) {
      return { ...route, params };
    }
  }
  return null;
}

function matchSegments(pattern, pathname) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const left = patternParts[index];
    const right = pathParts[index];
    if (left.startsWith("{") && left.endsWith("}")) {
      params[left.slice(1, -1)] = decodeURIComponent(right);
      continue;
    }
    if (left !== right) return null;
  }
  return params;
}

function normalizeObject(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeObject);
  }
  if (!value || typeof value !== "object") {
    return normalizeScalar(value);
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeObject(entry)]));
}

function normalizeScalar(value) {
  if (typeof value !== "string") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

function notImplemented(route) {
  return {
    body: {
      error: "not_implemented",
      message: "This route is intentionally deny-by-default until the provider contract is safe to enforce.",
      ok: false,
      route
    },
    status: 501
  };
}

async function parseJsonResponse(response, fallbackError) {
  const text = await response.text();
  let jsonBody = {};
  try {
    jsonBody = text ? JSON.parse(text) : {};
  } catch {
    jsonBody = { raw: text };
  }
  if (!response.ok) {
    throw new Error(jsonBody?.error?.message || jsonBody?.error_description || jsonBody?.message || fallbackError);
  }
  return jsonBody;
}

function parseCookie(header, name) {
  const needle = `${name}=`;
  const match = String(header || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(needle));
  return match ? match.slice(needle.length) : null;
}

async function putJson(env, key, value) {
  await env.R2_VIRTUAL_LAUNCH.put(key, JSON.stringify(value, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" }
  });
}

function requireEnv(env, keys) {
  for (const key of keys) {
    if (!env?.[key]) {
      throw new Error(`missing_env_${key}`);
    }
  }
}

function sanitizeStripePaymentMethod(method) {
  return {
    brand: method.card?.brand || null,
    expMonth: method.card?.exp_month || null,
    expYear: method.card?.exp_year || null,
    funding: method.card?.funding || null,
    id: method.id,
    last4: method.card?.last4 || null,
    type: method.type
  };
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(signature);
}

async function stripeRequest(env, path, params = {}, method = "POST", preEncoded = false) {
  const url = new URL(`${STRIPE_API_BASE}${path}`);
  let body;
  if (method === "GET") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
  } else if (preEncoded) {
    body = typeof params === "string" ? params : String(params);
  } else {
    body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      body.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    body: method === "GET" ? undefined : body,
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    method
  });
  return parseJsonResponse(response, "stripe_request_failed");
}

function toBase64Url(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new TextEncoder().encode(String(input));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toStripeMetadataMap(metadata) {
  const out = {};
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return out;
  Object.entries(metadata).forEach(([key, value]) => {
    out[`metadata[${key}]`] = String(value);
  });
  return out;
}

async function twilioRequest(env, path, params) {
  const response = await fetch(`${TWILIO_API_BASE}${path}`, {
    body: new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])),
    headers: {
      authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });
  return parseJsonResponse(response, "twilio_request_failed");
}

async function upsertOAuthAccount(env, identity) {
  const existing = await findAccountByEmail(env, identity.email);
  const accountId = existing?.accountId || crypto.randomUUID();
  const key = `accounts_vlp/VLP_ACCT_${accountId}.json`;
  const current = existing || {};
  const next = {
    ...current,
    accountId,
    authProvider: identity.provider,
    email: identity.email,
    firstName: identity.firstName || current.firstName || "",
    lastName: identity.lastName || current.lastName || "",
    oauth: {
      ...(current.oauth || {}),
      [identity.provider]: {
        linkedAt: new Date().toISOString(),
        picture: identity.picture || null,
        sub: identity.sub || null
      }
    },
    picture: identity.picture || current.picture || null,
    platform: current.platform || "vlp",
    role: current.role || "professional",
    source: current.source || identity.provider,
    updatedAt: new Date().toISOString()
  };
  next.createdAt = current.createdAt || next.updatedAt;
  await putJson(env, key, next);
  return next;
}

function validatePayload(routeName, payload) {
  const schema = SCHEMAS[routeName];
  if (!schema) return [];
  const errors = [];
  for (const field of schema.required) {
    const value = payload[field];
    if (value === undefined || value === null || value === "") {
      errors.push({ field, message: "required" });
    }
  }
  if ((routeName === "account_create" || routeName === "auth_magic_link_request" || routeName === "billing_customer_create") && payload.email && !/^\S+@\S+\.\S+$/.test(String(payload.email))) {
    errors.push({ field: "email", message: "invalid_email" });
  }
  if (routeName === "profile_create" && !Array.isArray(payload.specialties)) {
    errors.push({ field: "specialties", message: "must_be_array" });
  }
  if (routeName === "billing_payment_intent_create" && String(payload.currency || "").toLowerCase() !== "usd") {
    errors.push({ field: "currency", message: "unsupported_currency" });
  }
  if (routeName === "checkout_create_session" && !String(payload.successUrl || "").startsWith("http")) {
    errors.push({ field: "successUrl", message: "invalid_url" });
  }
  if (routeName === "checkout_create_session" && !String(payload.cancelUrl || "").startsWith("http")) {
    errors.push({ field: "cancelUrl", message: "invalid_url" });
  }
  return errors.sort((left, right) => String(left.field).localeCompare(String(right.field)));
}

async function verifyStripeWebhook(env, rawBody, signatureHeader) {
  const pairs = String(signatureHeader || "").split(",").map((part) => part.trim());
  const timestamp = pairs.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = pairs.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) {
    throw new Error("invalid_stripe_signature_header");
  }
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await hexHmacSha256(String(env.STRIPE_WEBHOOK_SECRET), signedPayload);
  if (!signatures.includes(expected)) {
    throw new Error("invalid_stripe_signature");
  }
  return JSON.parse(rawBody);
}

async function verifyTwilioSignature(authToken, url, payload, signature) {
  const ordered = Object.keys(payload).sort((left, right) => left.localeCompare(right));
  let data = url;
  for (const key of ordered) {
    data += `${key}${payload[key]}`;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authToken),
    { hash: "SHA-1", name: "HMAC" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const computed = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return computed === signature;
}

async function hexHmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reconcileStripeWebhook(env, event) {
  const object = event.data?.object || {};
  const metadata = object.metadata || {};
  const membershipId = metadata.membershipId || findMembershipIdFromWebhookObject(object);
  if (!membershipId) return;

  const currentMembership = (await getJson(env, `memberships/${membershipId}.json`)) || { membershipId };
  const currentSubscription = (await getJson(env, `billing_subscriptions/${membershipId}.json`)) || { membershipId };

  const status = deriveStripeWebhookStatus(event.type, object);
  const patch = {
    accountId: metadata.accountId || currentMembership.accountId || null,
    billingInterval: metadata.billingInterval || currentMembership.billingInterval || null,
    lastWebhookEventId: event.id,
    lastWebhookType: event.type,
    membershipId,
    planKey: metadata.planKey || currentMembership.plan?.planKey || currentSubscription.plan?.planKey || null,
    status,
    stripeCustomerId: object.customer || currentMembership.stripeCustomerId || null,
    subscriptionId: object.subscription || object.id || currentMembership.subscriptionId || currentSubscription.subscriptionId || null,
    updatedAt: new Date().toISOString()
  };

  await putJson(env, `memberships/${membershipId}.json`, { ...currentMembership, ...patch });
  await putJson(env, `billing_subscriptions/${membershipId}.json`, { ...currentSubscription, ...patch });
}

function findMembershipIdFromWebhookObject(object) {
  return object.metadata?.membershipId || object.parent?.subscription_details?.metadata?.membershipId || null;
}

function deriveStripeWebhookStatus(eventType, object) {
  if (eventType === "invoice.payment_failed" || eventType === "payment_intent.payment_failed") return "past_due";
  if (eventType === "customer.subscription.deleted") return "canceled";
  if (eventType === "invoice.paid" || eventType === "payment_intent.succeeded" || eventType === "checkout.session.completed") return "active";
  return object.status || "updated";
}

function buildUpsertResponse(routeName, payload, eventId) {
  switch (routeName) {
    case "account_create":
      return { accountId: payload.accountId, eventId, ok: true, status: "created" };
    case "account_update":
      return { accountId: payload.accountId, eventId, ok: true, status: "updated" };
    case "booking_create":
      return { bookingId: payload.bookingId, eventId, ok: true, status: "created" };
    case "booking_update":
      return { bookingId: payload.bookingId, eventId, ok: true, status: "updated" };
    case "membership_create":
      return { membershipId: payload.membershipId, eventId, ok: true, status: "created" };
    case "membership_update":
      return { membershipId: payload.membershipId, eventId, ok: true, status: "updated" };
    case "notifications_in_app_create":
      return { notificationId: payload.notificationId, eventId, ok: true, status: "created" };
    case "notifications_preferences_update":
      return { accountId: payload.accountId, eventId, ok: true, status: "updated" };
    case "profile_create":
      return { ok: true, professionalId: payload.professionalId, status: "created" };
    case "profile_update":
      return { ok: true, professionalId: payload.professionalId, status: "updated" };
    case "support_ticket_create":
      return { ok: true, status: "created", ticketId: payload.ticketId };
    case "support_ticket_update":
      return { ok: true, status: "updated", ticketId: payload.ticketId };
    case "vlp_preferences_update":
      return { accountId: payload.accountId, eventId, ok: true, status: "updated" };
    default:
      return { eventId, ok: true, status: "ok" };
  }
}

async function sendMagicLinkEmail(env, input) {
  const fromEmail = String(env.GOOGLE_WORKSPACE_USER_NO_REPLY || env.GOOGLE_WORKSPACE_USER_INFO || "");
  const subject = "Your Virtual Launch Pro magic link";
  const html = buildMagicLinkEmailHtml(input.magicLinkUrl, input.expiresAt);
  const text = buildMagicLinkEmailText(input.magicLinkUrl, input.expiresAt);

  if (!input.to || !fromEmail) {
    return { reason: "missing_email_configuration", sent: false, status: "not_sent" };
  }
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_TOKEN_URI) {
    return { reason: "google_workspace_not_configured", sent: false, status: "not_sent" };
  }

  const accessToken = await getGoogleServiceAccessToken(env, GMAIL_SEND_SCOPE, fromEmail);
  const raw = createMimeMessage({ from: fromEmail, html, subject, text, to: input.to });
  const response = await fetch(GMAIL_API_BASE + "/users/" + encodeURIComponent(fromEmail) + "/messages/send", {
    body: JSON.stringify({ raw }),
    headers: {
      authorization: "Bearer " + accessToken,
      "content-type": "application/json"
    },
    method: "POST"
  });
  const result = await parseJsonResponse(response, "gmail_send_failed");

  return {
    id: result.id || null,
    sent: true,
    status: "sent",
    threadId: result.threadId || null
  };
}

function buildMagicLinkEmailHtml(magicLinkUrl, expiresAt) {
  return "<!doctype html><html><body style=\"background:#0b1020;color:#e5e7eb;font-family:Arial,sans-serif;padding:24px;\"><div style=\"margin:0 auto;max-width:560px;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;\"><h1 style=\"font-size:24px;line-height:1.2;margin:0 0 16px;\">Sign in to Virtual Launch Pro</h1><p style=\"font-size:16px;line-height:1.6;margin:0 0 20px;\">Use the secure magic link below to sign in.</p><p style=\"margin:0 0 24px;\"><a href=\"" + escapeHtml(magicLinkUrl) + "\" style=\"display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;\">Sign in securely</a></p><p style=\"font-size:14px;line-height:1.6;margin:0 0 12px;word-break:break-all;\">" + escapeHtml(magicLinkUrl) + "</p><p style=\"font-size:13px;line-height:1.6;margin:0;color:#9ca3af;\">This link expires at " + escapeHtml(expiresAt) + ".</p></div></body></html>";
}

function buildMagicLinkEmailText(magicLinkUrl, expiresAt) {
  return [
    "Sign in to Virtual Launch Pro.",
    "",
    "Open this secure magic link:",
    magicLinkUrl,
    "",
    "This link expires at " + expiresAt + "."
  ].join("
");
}

function createMimeMessage(input) {
  const boundary = "vlp-" + crypto.randomUUID();
  const lines = [
    "From: Virtual Launch Pro <" + input.from + ">",
    "To: " + input.to,
    "Subject: " + input.subject,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
    "",
    "--" + boundary,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    input.text,
    "",
    "--" + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    "",
    input.html,
    "",
    "--" + boundary + "--"
  ];
  return toBase64Url(lines.join("
"));
}

function createServiceJwt(assertion) {
  const header = { alg: "RS256", typ: "JWT" };
  return toBase64Url(JSON.stringify(header)) + "." + toBase64Url(JSON.stringify(assertion));
}

function escapeHtml(value) {
  return String(value || "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

async function getGoogleServiceAccessToken(env, scope, subject) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const assertion = {
    aud: String(env.GOOGLE_TOKEN_URI),
    exp: issuedAt + 3600,
    iat: issuedAt,
    iss: String(env.GOOGLE_CLIENT_EMAIL),
    scope: String(scope),
    sub: String(subject)
  };

  const unsignedJwt = createServiceJwt(assertion);
  const signature = await signServiceJwt(unsignedJwt, String(env.GOOGLE_PRIVATE_KEY));

  const response = await fetch(String(env.GOOGLE_TOKEN_URI), {
    body: new URLSearchParams({
      assertion: unsignedJwt + "." + signature,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer"
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });

  const tokenJson = await parseJsonResponse(response, "google_service_token_failed");
  return tokenJson.access_token;
}

async function signServiceJwt(unsignedJwt, privateKeyPem) {
  const privateKey = await importGoogleServicePrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    new TextEncoder().encode(unsignedJwt)
  );
  return toBase64Url(signature);
}

async function importGoogleServicePrivateKey(privateKeyPem) {
  const normalized = String(privateKeyPem || "").split("\n").join("
");
  const base64 = normalized
    .split("-----BEGIN PRIVATE KEY-----").join("")
    .split("-----END PRIVATE KEY-----").join("")
    .split("
").join("")
    .split("
").join("")
    .split("	").join("")
    .split(" ").join("");

  const keyBytes = base64ToUint8Array(base64);

  return crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function withCors(request, response) {
  const origin = request.headers.get("origin") || DEFAULT_ORIGIN;
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-credentials", "true");
  headers.set("access-control-allow-headers", "content-type, stripe-signature, x-twilio-signature");
  headers.set("access-control-allow-methods", "DELETE, GET, OPTIONS, PATCH, POST");
  headers.set("access-control-allow-origin", origin);
  headers.set("vary", "origin");
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
}
