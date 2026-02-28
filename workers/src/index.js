/**
 * ============================================================
 * Worker: virtuallaunch-pro-api
 * Domain: https://api.virtuallaunch.pro
 * Purpose: VA Starter Track API (Stripe webhook ingestion + directory read model)
 *
 * Architecture Contract:
 * - Storage authority: R2_VIRTUAL_LAUNCH
 * - Write order (webhooks): signature → receipt → canonical → projection (optional)
 * - Deny-by-default routing
 *
 * Supported Routes (Alphabetical):
 * - GET /directory
 * - GET /health
 * - POST /stripe/webhook
 *
 * Compatibility Date: set in wrangler.toml (required)
 * ============================================================
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /**
     * ------------------------------------------------------------
     * Guard: deny-by-default methods
     * ------------------------------------------------------------
     * Why it exists:
     *   Shrinks attack surface and prevents accidental mutation paths.
     *
     * What it prevents:
     *   Random PUT/PATCH/DELETE requests from ever reaching business logic.
     *
     * When it can be removed:
     *   Never. Expand per-route, not globally.
     * ------------------------------------------------------------
     */
    if (!["GET", "POST"].includes(request.method)) {
      return json({ error: "Method not allowed", method: request.method }, 405);
    }

    /**
     * ------------------------------------------------------------
     * GET /directory
     * ------------------------------------------------------------
     * Purpose:
     *   Read VA directory index from R2.
     *
     * Storage keys:
     *   va/directory/index.json
     *
     * Side effects:
     *   None (read-only).
     * ------------------------------------------------------------
     */
    if (request.method === "GET" && url.pathname === "/directory") {
      // R2 key: va/directory/index.json
      // Binding: R2_VIRTUAL_LAUNCH
      const key = "va/directory/index.json";
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);

      if (!obj) return json({ directory: [] }, 200);

      // Return exactly what’s stored (no “helpful” rewrites).
      return new Response(await obj.text(), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    /**
     * ------------------------------------------------------------
     * GET /health
     * ------------------------------------------------------------
     * Purpose:
     *   Validate deploy + routing.
     *
     * Side effects:
     *   None (read-only).
     * ------------------------------------------------------------
     */
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, route: "health" }, 200);
    }

    /**
     * ------------------------------------------------------------
     * POST /stripe/webhook
     * ------------------------------------------------------------
     * Purpose:
     *   Stripe webhook ingestion for VA Starter Track.
     *
     * Write Order (Canonical Rule):
     * 1) Validate Stripe signature
     * 2) Append receipt → receipts/stripe/{eventId}.json
     * 3) Upsert canonical account → accounts/{accountId}.json
     * 4) Write correlation index → stripe/payment-intents/{paymentIntentId}.json
     *
     * Supported event types (Alphabetical):
     * - charge.succeeded
     * - checkout.session.completed
     * - payment_intent.succeeded
     * ------------------------------------------------------------
     */
    if (request.method === "POST" && url.pathname === "/stripe/webhook") {
      const signature = request.headers.get("stripe-signature");
      if (!signature) return json({ error: "Missing stripe-signature header" }, 400);
      if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

      // Read raw body ONCE (required for signature validation + receipt storage)
      const rawBody = await request.arrayBuffer();

      // 1) Validate signature
      const verified = await verifyStripeSignature({
        rawBody,
        secret: env.STRIPE_WEBHOOK_SECRET,
        signatureHeader: signature,
        toleranceSeconds: 300,
      });

      if (!verified.ok) {
        return json({ error: "Invalid Stripe signature", reason: verified.reason }, 400);
      }

      // Parse JSON (only after signature validation)
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

      // Idempotency: receipt dedupe by eventId
      // R2 key: receipts/stripe/{eventId}.json
      // Binding: R2_VIRTUAL_LAUNCH
      const receiptKey = `receipts/stripe/${eventId}.json`;
      const existingReceipt = await env.R2_VIRTUAL_LAUNCH.get(receiptKey);
      if (existingReceipt) {
        return json({ ok: true, deduped: true, eventId, eventType }, 200);
      }

      // 2) Append receipt (raw verified payload)
      await env.R2_VIRTUAL_LAUNCH.put(receiptKey, rawBody, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      // Only handle known event types. Unknown types are stored as receipts and ignored.
      const allowedTypes = new Set([
        "charge.succeeded",
        "checkout.session.completed",
        "payment_intent.succeeded",
      ]);

      if (!allowedTypes.has(eventType)) {
        return json({ ok: true, storedReceipt: true, ignoredType: eventType, eventId }, 200);
      }

      // Dispatch
      if (eventType === "checkout.session.completed") {
        return await handleCheckoutSessionCompleted({ env, evt });
      }

      if (eventType === "payment_intent.succeeded") {
        return await handlePaymentIntentSucceeded({ env, evt, eventId });
      }

      if (eventType === "charge.succeeded") {
        return await handleChargeSucceeded({ env, evt, eventId });
      }

      // Should never hit due to allowedTypes gate.
      return json({ ok: true, eventId, eventType, storedReceipt: true }, 200);
    }

    // Deny-by-default route
    return json({ error: "Not found", path: url.pathname }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * ------------------------------------------------------------
 * Stripe Handler: checkout.session.completed
 * ------------------------------------------------------------
 * Purpose:
 *   Activate subscription + create/upsert canonical account.
 *
 * Writes:
 * - accounts/{accountId}.json
 * - stripe/payment-intents/{paymentIntentId}.json (correlation index)
 * ------------------------------------------------------------
 */
async function handleCheckoutSessionCompleted({ env, evt }) {
  const o = evt?.data?.object;

  // Contract-mapped fields
  const customerId = o?.customer;
  const sessionId = o?.id;
  const paymentIntentId = o?.payment_intent;
  const paymentLink = o?.payment_link;
  const paymentStatus = o?.status;
  const primaryEmail = o?.customer_details?.email;

  if (!customerId || typeof customerId !== "string") {
    return json({ error: "Missing customerId (data.object.customer) on checkout.session.completed" }, 400);
  }
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return json({ error: "Missing paymentIntentId (data.object.payment_intent) on checkout.session.completed" }, 400);
  }

  const accountId = `acct_stripe_${customerId}`;
  const accountKey = `accounts/${accountId}.json`;
  const now = new Date().toISOString();

  // Load existing (if present)
  const existing = await env.R2_VIRTUAL_LAUNCH.get(accountKey);
  let account = null;
  if (existing) {
    try {
      account = JSON.parse(await existing.text());
    } catch {
      account = null;
    }
  }

  const createdAt =
    account?.createdAt && typeof account.createdAt === "string" ? account.createdAt : now;

  // Canonical account object (v1)
  const nextAccount = {
    accountId,
    createdAt,
    primaryEmail: primaryEmail || account?.primaryEmail || null,
    stripe: {
      customerId,
      eventId: evt.id,
      paymentIntentId: paymentIntentId || account?.stripe?.paymentIntentId || null,
      paymentLink: paymentLink || account?.stripe?.paymentLink || null,
      paymentStatus: paymentStatus || account?.stripe?.paymentStatus || null,
      receiptUrl: account?.stripe?.receiptUrl || null,
      sessionId: sessionId || account?.stripe?.sessionId || null,
    },
    subscription: {
      active: true,
      activatedAt: account?.subscription?.activatedAt || now,
    },
  };

  // Write canonical account
  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  // Write correlation index (paymentIntentId → accountId)
  // R2 key: stripe/payment-intents/{paymentIntentId}.json
  // Binding: R2_VIRTUAL_LAUNCH
  const indexKey = `stripe/payment-intents/${paymentIntentId}.json`;

  const indexObj = {
    accountId,
    createdAt: now,
    customerId,
    eventId: evt.id,
    sessionId: sessionId || null,
  };

  await env.R2_VIRTUAL_LAUNCH.put(indexKey, JSON.stringify(indexObj, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  return json(
    {
      ok: true,
      accountId,
      eventId: evt.id,
      eventType: evt.type,
      subscription: { active: true },
    },
    200
  );
}

/**
 * ------------------------------------------------------------
 * Stripe Handler: payment_intent.succeeded
 * ------------------------------------------------------------
 * Purpose:
 *   Update canonical account paymentStatus using paymentIntentId correlation index.
 *
 * Reads:
 * - stripe/payment-intents/{paymentIntentId}.json
 *
 * Writes:
 * - accounts/{accountId}.json
 * ------------------------------------------------------------
 */
async function handlePaymentIntentSucceeded({ env, evt, eventId }) {
  const o = evt?.data?.object;

  const paymentIntentId = o?.id;
  const paymentStatus = o?.status;

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing paymentIntentId" }, 200);
  }

  const indexKey = `stripe/payment-intents/${paymentIntentId}.json`;
  const idx = await env.R2_VIRTUAL_LAUNCH.get(indexKey);
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

  // If account somehow doesn’t exist, do not create it from this event.
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

/**
 * ------------------------------------------------------------
 * Stripe Handler: charge.succeeded
 * ------------------------------------------------------------
 * Purpose:
 *   Update canonical account receiptUrl + paymentStatus using paymentIntentId correlation index.
 *
 * Reads:
 * - stripe/payment-intents/{paymentIntentId}.json
 *
 * Writes:
 * - accounts/{accountId}.json
 * ------------------------------------------------------------
 */
async function handleChargeSucceeded({ env, evt, eventId }) {
  // Stripe charge event shape usually places the charge object at evt.data.object
  const o = evt?.data?.object || evt?.object || evt?.data || evt;

  const paymentIntentId = o?.payment_intent;
  const receiptUrl = o?.receipt_url;
  const paymentStatus = o?.status;

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return json({ ok: true, storedReceipt: true, eventId, eventType: evt.type, note: "Missing paymentIntentId" }, 200);
  }

  const indexKey = `stripe/payment-intents/${paymentIntentId}.json`;
  const idx = await env.R2_VIRTUAL_LAUNCH.get(indexKey);
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

/**
 * Stripe signature verification (v1):
 * - Reads stripe-signature: "t=timestamp,v1=signature,..."
 * - Computes HMAC_SHA256(secret, `${t}.${rawBodyString}`)
 * - Compares against v1 signatures
 */
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
    if (timingSafeEqualHex(expected, candidate)) return { ok: true };
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

function bufToHex(buf) {
  let s = "";
  for (const b of buf) s += b.toString(16).padStart(2, "0");
  return s;
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
