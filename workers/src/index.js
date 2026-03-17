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
const D1_INDEX_TABLES = [
  "accounts_index",
  "bookings_index",
  "memberships_index",
  "notifications_index",
  "support_tickets_index",
  "token_usage_index"
];
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
  { auth: true, key: null, method: "GET", mode: "cal_availability_get", name: "cal_availability_get", pattern: "/v1/cal/availability/{professionalId}" },
  { auth: true, key: null, method: "PATCH", mode: "cal_availability_update", name: "cal_availability_update", pattern: "/v1/cal/availability/{professionalId}" },
  { auth: true, key: null, method: "GET", mode: "cal_calendar_metadata_get", name: "cal_calendar_metadata_get", pattern: "/v1/cal/calendars/{professionalId}" },
  { auth: true, key: null, method: "GET", mode: "cal_events_list", name: "cal_events_list", pattern: "/v1/cal/events/{professionalId}" },
  { auth: true, key: null, method: "POST", mode: "cal_events_sync", name: "cal_events_sync", pattern: "/v1/cal/events/{professionalId}/sync" },
  { auth: true, key: null, method: "GET", mode: "cal_booking_links_list", name: "cal_booking_links_list", pattern: "/v1/cal/booking-links/{professionalId}" },
  { auth: true, key: null, method: "POST", mode: "cal_booking_links_create", name: "cal_booking_links_create", pattern: "/v1/cal/booking-links/{professionalId}" },
  { auth: true, key: null, method: "GET", mode: "cal_booking_link_get", name: "cal_booking_link_get", pattern: "/v1/cal/booking-links/{professionalId}/{linkId}" },
  { auth: true, key: null, method: "PATCH", mode: "cal_booking_link_update", name: "cal_booking_link_update", pattern: "/v1/cal/booking-links/{professionalId}/{linkId}" },
  { auth: true, key: null, method: "DELETE", mode: "cal_booking_link_delete", name: "cal_booking_link_delete", pattern: "/v1/cal/booking-links/{professionalId}/{linkId}" },
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
  cal_availability_get: required("professionalId"),
  cal_availability_update: required("professionalId"),
  cal_booking_link_delete: required("linkId", "professionalId"),
  cal_booking_link_get: required("linkId", "professionalId"),
  cal_booking_link_update: required("linkId", "professionalId"),
  cal_booking_links_create: required("professionalId"),
  cal_booking_links_list: required("professionalId"),
  cal_calendar_metadata_get: required("professionalId"),
  cal_events_list: required("professionalId"),
  cal_events_sync: required("professionalId"),
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
    case "cal_availability_get":
      return handleCalAvailabilityGet(context);
    case "cal_availability_update":
      return handleCalAvailabilityUpdate(context);
    case "cal_booking_link_delete":
      return handleCalBookingLinkDelete(context);
    case "cal_booking_link_get":
      return handleCalBookingLinkGet(context);
    case "cal_booking_link_update":
      return handleCalBookingLinkUpdate(context);
    case "cal_booking_links_create":
      return handleCalBookingLinksCreate(context);
    case "cal_booking_links_list":
      return handleCalBookingLinksList(context);
    case "cal_calendar_metadata_get":
      return handleCalCalendarMetadataGet(context);
    case "cal_events_list":
      return handleCalEventsList(context);
    case "cal_events_sync":
      return handleCalEventsSync(context);
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
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  if (hasD1(env)) {
    const indexed = await d1First(
      env,
      `SELECT r2_key
       FROM accounts_index
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );
    if (indexed?.r2_key) {
      const record = await getJson(env, indexed.r2_key);
      if (record) return record;
    }
  }

  const records = await listJson(env, "accounts_vlp/");
  return records.find((record) => String(record?.email || "").toLowerCase() === normalizedEmail) || null;
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

async function d1All(env, sql, bindings = []) {
  if (!hasD1(env)) return [];
  const statement = env.DB.prepare(sql).bind(...bindings);
  const result = await statement.all();
  return Array.isArray(result?.results) ? result.results : [];
}

async function d1Exec(env, sql, bindings = []) {
  if (!hasD1(env)) return null;
  return env.DB.prepare(sql).bind(...bindings).run();
}

async function d1First(env, sql, bindings = []) {
  const rows = await d1All(env, sql, bindings);
  return rows[0] || null;
}

function hasD1(env) {
  return Boolean(env?.DB && typeof env.DB.prepare === "function");
}

async function indexAccountRecord(env, record) {
  if (!hasD1(env) || !record?.accountId) return;
  const r2Key = `accounts_vlp/VLP_ACCT_${record.accountId}.json`;
  await d1Exec(
    env,
    `INSERT INTO accounts_index (
       account_id,
       email,
       first_name,
       last_name,
       platform,
       role,
       source,
       r2_key,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       email = excluded.email,
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       platform = excluded.platform,
       role = excluded.role,
       source = excluded.source,
       r2_key = excluded.r2_key,
       updated_at = excluded.updated_at`,
    [
      String(record.accountId),
      String(record.email || "").trim().toLowerCase(),
      String(record.firstName || ""),
      String(record.lastName || ""),
      String(record.platform || ""),
      String(record.role || ""),
      String(record.source || ""),
      r2Key,
      String(record.updatedAt || new Date().toISOString())
    ]
  );
}

async function indexBookingRecord(env, record) {
  if (!hasD1(env) || !record?.bookingId) return;
  const r2Key = `bookings/${record.bookingId}.json`;
  await d1Exec(
    env,
    `INSERT INTO bookings_index (
       booking_id,
       account_id,
       professional_id,
       status,
       starts_at,
       r2_key,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(booking_id) DO UPDATE SET
       account_id = excluded.account_id,
       professional_id = excluded.professional_id,
       status = excluded.status,
       starts_at = excluded.starts_at,
       r2_key = excluded.r2_key,
       updated_at = excluded.updated_at`,
    [
      String(record.bookingId),
      String(record.accountId || ""),
      String(record.professionalId || ""),
      String(record.status || ""),
      String(record.startsAt || record.startTime || ""),
      r2Key,
      String(record.updatedAt || new Date().toISOString())
    ]
  );
}

async function indexMembershipRecord(env, record) {
  if (!hasD1(env) || !record?.membershipId) return;
  const r2Key = `memberships/${record.membershipId}.json`;
  await d1Exec(
    env,
    `INSERT INTO memberships_index (
       membership_id,
       account_id,
       plan_key,
       status,
       billing_interval,
       r2_key,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(membership_id) DO UPDATE SET
       account_id = excluded.account_id,
       plan_key = excluded.plan_key,
       status = excluded.status,
       billing_interval = excluded.billing_interval,
       r2_key = excluded.r2_key,
       updated_at = excluded.updated_at`,
    [
      String(record.membershipId),
      String(record.accountId || ""),
      String(record.planKey || ""),
      String(record.status || ""),
      String(record.billingInterval || ""),
      r2Key,
      String(record.updatedAt || new Date().toISOString())
    ]
  );
}

async function indexNotificationRecord(env, record) {
  if (!hasD1(env) || !record?.notificationId) return;
  const r2Key = `notifications/in-app/${record.notificationId}.json`;
  await d1Exec(
    env,
    `INSERT INTO notifications_index (
       notification_id,
       account_id,
       title,
       read_at,
       created_at,
       r2_key,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(notification_id) DO UPDATE SET
       account_id = excluded.account_id,
       title = excluded.title,
       read_at = excluded.read_at,
       created_at = excluded.created_at,
       r2_key = excluded.r2_key,
       updated_at = excluded.updated_at`,
    [
      String(record.notificationId),
      String(record.accountId || ""),
      String(record.title || ""),
      String(record.readAt || ""),
      String(record.createdAt || new Date().toISOString()),
      r2Key,
      String(record.updatedAt || new Date().toISOString())
    ]
  );
}

async function indexSupportTicketRecord(env, record) {
  if (!hasD1(env) || !record?.ticketId) return;
  const r2Key = `support_tickets/${record.ticketId}.json`;
  await d1Exec(
    env,
    `INSERT INTO support_tickets_index (
       ticket_id,
       account_id,
       subject,
       priority,
       status,
       created_at,
       r2_key,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ticket_id) DO UPDATE SET
       account_id = excluded.account_id,
       subject = excluded.subject,
       priority = excluded.priority,
       status = excluded.status,
       created_at = excluded.created_at,
       r2_key = excluded.r2_key,
       updated_at = excluded.updated_at`,
    [
      String(record.ticketId),
      String(record.accountId || ""),
      String(record.subject || ""),
      String(record.priority || ""),
      String(record.status || "open"),
      String(record.createdAt || new Date().toISOString()),
      r2Key,
      String(record.updatedAt || new Date().toISOString())
    ]
  );
}

async function indexTokenUsageRecord(env, record) {
  if (!hasD1(env) || !record?.usageId) return;
  const r2Key = `token_usage/${record.usageId}.json`;
  await d1Exec(
    env,
    `INSERT INTO token_usage_index (
       usage_id,
       account_id,
       token_type,
       quantity,
       created_at,
       r2_key
     ) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(usage_id) DO UPDATE SET
       account_id = excluded.account_id,
       token_type = excluded.token_type,
       quantity = excluded.quantity,
       created_at = excluded.created_at,
       r2_key = excluded.r2_key`,
    [
      String(record.usageId),
      String(record.accountId || ""),
      String(record.tokenType || ""),
      Number(record.quantity || 0),
      String(record.createdAt || new Date().toISOString()),
      r2Key
    ]
  );
}

async function syncD1Index(env, routeName, record) {
  switch (routeName) {
    case "account_create":
    case "account_update":
      return indexAccountRecord(env, record);
    case "booking_create":
    case "booking_update":
      return indexBookingRecord(env, record);
    case "membership_create":
    case "membership_update":
    case "billing_subscription_create":
    case "billing_subscription_update":
      return indexMembershipRecord(env, record);
    case "notifications_in_app_create":
      return indexNotificationRecord(env, record);
    case "support_ticket_create":
    case "support_ticket_update":
      return indexSupportTicketRecord(env, record);
    case "billing_tokens_purchase":
      return indexTokenUsageRecord(env, record);
    default:
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
    amount: String(context.payload.amount)
