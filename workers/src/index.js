/**
 * ============================================================
 * Worker: virtuallaunch-pro-api
 * Domain: https://api.virtuallaunch.pro
 * Purpose: VA Starter Track API (read models + Stripe subscription activation)
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
 * Notes:
 * - Stripe webhook is the source of truth for subscription activation. :contentReference[oaicite:2]{index=2}
 * - Stripe listens to (Alphabetical): charge.succeeded, checkout.session.completed, payment_intent.succeeded. :contentReference[oaicite:3]{index=3}
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
     *   Reduces attack surface and prevents accidental mutation paths.
     *
     * What it prevents:
     *   Random POST/PUT/etc hitting read-only endpoints.
     *
     * When it can be removed:
     *   Never. You can expand allowed methods per-route, not globally.
     * ------------------------------------------------------------
     */
    if (!["GET", "POST"].includes(request.method)) {
      return json(
        { error: "Method not allowed", method: request.method },
        405
      );
    }

    /**
     * ------------------------------------------------------------
     * GET /health
     * ------------------------------------------------------------
     * Purpose:
     *   Simple health check for routing + Worker deploy validation.
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
      const key = "va/directory/index.json"; // R2 key: va/directory/index.json
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);

      if (!obj) return json({ directory: [] }, 200);

      // Return exactly what's stored
      return new Response(await obj.text(), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
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
     * 2) Append receipt → receipts/stripe/{eventId}.json :contentReference[oaicite:4]{index=4}
     * 3) Upsert canonical subscription state (accounts/{accountId}.json) :contentReference[oaicite:5]{index=5}
     * 4) Enable dashboard access (subscription.active = true) :contentReference[oaicite:6]{index=6}
     *
     * Supported event types (Alphabetical):
     * - charge.succeeded
     * - checkout.session.completed
     * - payment_intent.succeeded :contentReference[oaicite:7]{index=7}
     * ------------------------------------------------------------
     */
    if (request.method === "POST" && url.pathname === "/stripe/webhook") {
      const signature = request.headers.get("stripe-signature");
      if (!signature) return json({ error: "Missing Stripe-Signature header" }, 400);

      // Read raw body ONCE (needed for signature validation + receipt storage)
      const rawBody = await request.arrayBuffer();

      // 1) Validate signature (required) :contentReference[oaicite:8]{index=8}
      const verified = await verifyStripeSignature({
        rawBody,
        secret: env.STRIPE_WEBHOOK_SECRET,
        signatureHeader: signature,
        toleranceSeconds: 300,
      });

      if (!verified.ok) {
        return json({ error: "Invalid Stripe signature", reason: verified.reason }, 400);
      }

      // Parse event JSON (we only do this AFTER signature validation)
      let evt;
      try {
        evt = JSON.parse(new TextDecoder().decode(rawBody));
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const eventId = evt?.id;
      const eventType = evt?.type;

      if (!eventId || typeof eventId !== "string") {
        return json({ error: "Missing event id" }, 400);
      }

      // Idempotency: receipt dedupe key = eventId :contentReference[oaicite:9]{index=9}
      const receiptKey = `receipts/stripe/${eventId}.json`;
      const existingReceipt = await env.R2_VIRTUAL_LAUNCH.get(receiptKey);
      if (existingReceipt) {
        // Already processed (or at least already recorded). Safe exit.
        return json({ ok: true, deduped: true, eventId, eventType }, 200);
      }

      // Only 3 Stripe event types are expected by this system. :contentReference[oaicite:10]{index=10}
      const allowedTypes = new Set([
        "charge.succeeded",
        "checkout.session.completed",
        "payment_intent.succeeded",
      ]);

      // 2) Append receipt (store raw verified payload; no invented receipt fields)
      await env.R2_VIRTUAL_LAUNCH.put(receiptKey, rawBody, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });

      // If some other event shows up anyway, we do NOT mutate canonical state.
      // We still record the receipt so debugging doesn’t become interpretive art.
      if (!allowedTypes.has(eventType)) {
        return json({ ok: true, storedReceipt: true, ignoredType: eventType, eventId }, 200);
      }

      // 3) Upsert canonical account + 4) subscription active
      // Canonical mapping v1 requires:
      // accountId = acct_stripe_{customerId} :contentReference[oaicite:11]{index=11}
      // Only checkout.session.completed guarantees customerId in your mapping. :contentReference[oaicite:12]{index=12}
      if (eventType === "checkout.session.completed") {
        const o = evt?.data?.object;

        const customerId = o?.customer; // customerId = data.object.customer :contentReference[oaicite:13]{index=13}
        const sessionId = o?.id;        // stripeSessionId/sessionId = data.object.id :contentReference[oaicite:14]{index=14}
        const primaryEmail = o?.customer_details?.email; // primaryEmail mapping :contentReference[oaicite:15]{index=15}
        const paymentIntentId = o?.payment_intent; // paymentIntentId mapping :contentReference[oaicite:16]{index=16}
        const paymentLink = o?.payment_link;       // paymentLink mapping :contentReference[oaicite:17]{index=17}
        const paymentStatus = o?.status;           // paymentStatus mapping :contentReference[oaicite:18]{index=18}

        if (!customerId || typeof customerId !== "string") {
          return json({ error: "Missing customerId on checkout.session.completed" }, 400);
        }

        const accountId = `acct_stripe_${customerId}`; // identity rule :contentReference[oaicite:19]{index=19}
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

        const createdAt = account?.createdAt && typeof account.createdAt === "string"
          ? account.createdAt
          : now;

        // Canonical account object keys (alphabetical) :contentReference[oaicite:20]{index=20}
        // stripe keys (alphabetical) :contentReference[oaicite:21]{index=21}
        // subscription keys (alphabetical) :contentReference[oaicite:22]{index=22}
        const nextAccount = {
          accountId,
          createdAt,
          primaryEmail: primaryEmail || account?.primaryEmail || null,
          stripe: {
            customerId,
            eventId, // eventId = id :contentReference[oaicite:23]{index=23}
            paymentIntentId: paymentIntentId || account?.stripe?.paymentIntentId || null,
            paymentLink: paymentLink || account?.stripe?.paymentLink || null,
            paymentStatus: paymentStatus || account?.stripe?.paymentStatus || null,
            receiptUrl: account?.stripe?.receiptUrl || null, // can be filled later by charge.succeeded when you can correlate
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

        return json(
          {
            ok: true,
            accountId,
            eventId,
            eventType,
            subscription: { active: true },
          },
          200
        );
      }

      // payment_intent.succeeded + charge.succeeded:
      // Your locked mapping does not provide customerId/accountId correlation for these events. :contentReference[oaicite:24]{index=24}
      // So: receipt is appended (idempotent), but canonical account mutation is not possible without adding a contract-safe index.
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
 * Stripe signature verification (v1):
 * - Reads Stripe-Signature: "t=timestamp,v1=signature,..."
 * - Computes HMAC_SHA256(secret, `${t}.${rawBody}`)
 * - Compares against v1 signatures
 */
async function verifyStripeSignature({
  rawBody,
  secret,
  signatureHeader,
  toleranceSeconds,
}) {
  if (!secret) return { ok: false, reason: "Missing STRIPE_WEBHOOK_SECRET" };

  const parts = parseStripeSignatureHeader(signatureHeader);
  if (!parts.timestamp) return { ok: false, reason: "Missing timestamp" };
  if (parts.v1.length === 0) return { ok: false, reason: "Missing v1 signature" };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const age = Math.abs(nowSeconds - parts.timestamp);
  if (age > toleranceSeconds) return { ok: false, reason: "Timestamp outside tolerance" };

  const payload = new Uint8Array(rawBody);
  const signedPayload = new TextEncoder().encode(`${parts.timestamp}.${new TextDecoder().decode(payload)}`);

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

  for (const item of header.split(",")) {
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
