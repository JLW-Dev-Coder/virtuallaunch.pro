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

    return json({ error: "Not found", path: url.pathname }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleCheckoutSessionCompleted({ env, evt }) {
  const o = evt?.data?.object;

  const customerId = o?.customer;
  const sessionId = o?.id;
  const paymentIntentId = o?.payment_intent;
  const paymentLink = o?.payment_link;
  const paymentStatus = o?.status;
  const primaryEmail = o?.customer_details?.email;
  const fullName = o?.customer_details?.name;

  // Contract (README): payment_intent is the canonical correlation key across all Stripe events.
  // Canonical accountId rule: acct_pi_{paymentIntentId}
  // We do NOT use data.object.customer.

  const normalizedPaymentIntentId =
    typeof paymentIntentId === "string"
      ? paymentIntentId
      : typeof paymentIntentId?.id === "string"
      ? paymentIntentId.id
      : null;

  if (!normalizedPaymentIntentId) {
    // Receipt already stored upstream. Do not 400 here.
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

  const accountId = `acct_pi_${normalizedPaymentIntentId}`;
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

  const createdAt =
    account?.createdAt && typeof account.createdAt === "string" ? account.createdAt : now;

  const nextAccount = {
    accountId,
    createdAt,
    fullName: fullName || account?.fullName || null,
    primaryEmail: primaryEmail || account?.primaryEmail || null,
    stripe: {
      customerId: normalizedCustomerId,
      eventId: evt.id,
      paymentIntentId: normalizedPaymentIntentId || account?.stripe?.paymentIntentId || null,
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

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(nextAccount, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  const indexKey = `stripe/payment-intents/${normalizedPaymentIntentId}.json`;

  const indexObj = {
    accountId,
    createdAt: now,
    eventId: evt.id,
    sessionId: sessionId || null,
  };

  await env.R2_VIRTUAL_LAUNCH.put(indexKey, JSON.stringify(indexObj, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });

  // Optional projection (after canonical update only)
  if (env.CLICKUP_PROJECTION_ENABLED === "true") {
    try {
      await projectAccountToClickUp({ env, accountKey, account: nextAccount });
    } catch (err) {
      // Never fail the webhook after canonical write.
      // Stripe expects 2xx; projection is optional.
      return json(
        {
          ok: true,
          accountId,
          eventId: evt.id,
          eventType: evt.type,
          projection: { attempted: true, ok: false, error: String(err?.message || err) },
          subscription: { active: true },
        },
        200
      );
    }
  }

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

async function projectAccountToClickUp({ env, account, accountKey }) {
  // Projection is optional and gated.
  if (env.CLICKUP_PROJECTION_ENABLED !== "true") return;

  // Hard dependencies (skip quietly if unset to avoid breaking webhooks).
  if (!env.CLICKUP_ACCOUNTS_LIST_ID) return;
  if (!env.CLICKUP_API_KEY) return;

  const taskName = `${account.fullName || account.primaryEmail || account.accountId} | VA Starter Track`;
  const description = JSON.stringify(account, null, 2);

  // Option A: store clickup taskId in canonical after first create.
  const existingTaskId = account?.clickup?.taskId;

  if (existingTaskId) {
    await clickupFetch(env, `/task/${existingTaskId}`, {
      method: "PUT",
      body: JSON.stringify({
        description,
        name: taskName,
      }),
    });

    return;
  }

  const created = await clickupFetch(env, `/list/${env.CLICKUP_ACCOUNTS_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify({
      description,
      name: taskName,
    }),
  });

  const taskId = created?.id;
  if (!taskId) return;

  const updatedCanonical = {
    ...account,
    clickup: {
      taskId,
    },
  };

  await env.R2_VIRTUAL_LAUNCH.put(accountKey, JSON.stringify(updatedCanonical, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}

async function clickupFetch(env, path, options = {}) {
  const res = await fetch(`https://api.clickup.com/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: env.CLICKUP_API_KEY,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp API error ${res.status}: ${text}`);
  }

  return res.json();
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
