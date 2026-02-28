# VA Starter Track Install

**Serverless · Contract-Driven · Idempotent · Event-Driven · R2-Authoritative**

---

## Table of Contents (Alphabetical)

* [About VA Starter Track Install](#about-va-starter-track-install)
* [Authentication Model](#authentication-model)
* [ClickUp Projection Layer](#clickup-projection-layer)
* [Contracts (Mutation Ingress Only)](#contracts-mutation-ingress-only)
* [Core Stack](#core-stack)
* [Data Model (R2 Canonical Authority)](#data-model-r2-canonical-authority)
* [Domains & Routing](#domains--routing)
* [Event Trigger System](#event-trigger-system)
* [Idempotency & Safety](#idempotency--safety)
* [Operational Checklist](#operational-checklist)
* [Payloads (Stripe, Transcript Report, Cal Support)](#payloads-stripe-transcript-report-cal-support)
* [Processing Contract (Write Order)](#processing-contract-write-order)
* [Read Models (Worker GET Endpoints)](#read-models-worker-get-endpoints)
* [Repository Structure (Exact Tree)](#repository-structure-exact-tree)
* [Security & Legal Controls](#security--legal-controls)
* [Session Model & Tokens](#session-model--tokens)
* [Stripe Payments (Subscription + Webhooks)](#stripe-payments-subscription--webhooks)
* [Support Message Contract (v1)](#support-message-contract-v1)
* [Support Status Read Model](#support-status-read-model)
* [Support Status Webhook Ingestion](#support-status-webhook-ingestion)
* [Support Webhook Health Watchdog](#support-webhook-health-watchdog)
* [System Architecture](#system-architecture)
* [UI Pages Required](#ui-pages-required)
* [Worker Environment Variables](#worker-environment-variables)
* [Worker POST Contract (VA Publish v1)](#worker-post-contract-va-publish-v1)
* [Wrangler Cron Configuration](#wrangler-cron-configuration)

---

# About VA Starter Track Install

VA Starter Track Install is a **serverless landing page + booking + directory publishing system for virtual assistants**.

It is:

* Contract-driven
* Event-driven
* Idempotent
* R2-authoritative
* Worker-orchestrated

HTML never defines valid data. JSON contracts define valid data.

---

# Authentication Model

Authentication is Worker-issued and token-based.

* Stripe does not authenticate users.
* Webhooks activate subscription state.
* Worker issues signed sessionToken.
* sessionToken required for all authenticated POST routes.

---

# ClickUp Projection Layer

ClickUp is projection only. R2 is the only authority.

## Lists

* Accounts — `901711473499`
* Support — `901711478590`

## Task Model

All tasks link to the account via the **Account ID** custom field.

Endpoint:

```
https://api.clickup.com/api/v2/task/{task_id}/link/{links_to}
```

Canonical → projection mapping:

* `accounts/{accountId}.json` → upsert one task per `accountId` in **Account** list
* `support/{supportId}.json` → upsert one task per `supportId` in **Support** list

## Custom Fields (Authoritative Set)

### Account fields (Alphabetical)

* Account Company Name — `059a571b-aa5d-41b4-ae12-3681b451b474`
* Account Event ID — `33ea9fbb-0743-483a-91e4-450ce3bfb0a7`
* Account Full Name — `b65231cc-4a10-4a38-9d90-1f1c167a4060`
* Account ID — `e5f176ba-82c8-47d8-b3b1-0716d075f43f`
* Account Primary Email — `a105f99e-b33d-4d12-bb24-f7c827ec761a`
* Account Support Status — `bbdf5418-8be0-452d-8bd0-b9f46643375e`
* Account Support Task Link — `9e14a458-96fd-4109-a276-034d8270e15b`
* Stripe Payment Intent ID — `6fc65cba-9060-4d70-ab36-02b239dd4718`
* Stripe Payment Status — `1b9a762e-cf3e-47d7-8ae7-98efe9e11eab`
* Stripe Receipt URL — `f8cb77f1-26b3-4788-83ed-2914bb608c11`
* Stripe Session ID — `57e6c42b-a471-4316-92dc-23ce0f59d8b4`

### Support fields (Alphabetical)

* Support Action Required — `aac0816d-0e05-4c57-8196-6098929f35ac`
* Support Email — `7f547901-690d-4f39-8851-d19e19f87bf8`
* Support Event ID — `8e8b453e-01f3-40fe-8156-2e9d9633ebd6`
* Support Latest Update — `03ebc8ba-714e-4f7c-9748-eb1b62e657f7`
* Support Priority — `b96403c7-028a-48eb-b6b1-349f295244b5`
* Support Type — `e09d9f53-4f03-49fe-8c5f-abe3b160b167`

## Projection Rules

* Worker never reads ClickUp to decide canonical state.
* Worker always writes: receipt → canonical R2 → ClickUp projection.

---

# Contracts (Mutation Ingress Only)

All mutations must:

* Validate strict JSON schema
* Reject unknown fields
* Normalize booleans and arrays
* Append receipt before canonical mutation

---

# Core Stack

Alphabetical:

* Cal.com (booking embed + webhooks)
* ClickUp (optional projection)
* Cloudflare Pages
* Cloudflare R2
* Cloudflare Worker
* Stripe (subscription billing)

---

# Data Model (R2 Canonical Authority)

Canonical objects:

```
receipts/{source}/{eventId}.json
support/{supportId}.json
va/directory/index.json
va/pages/{slug}.json
```

Notes:

* `receipts/*` is the immutable ledger.
* `va/pages/*` holds each VA public profile source of truth.
* `va/directory/index.json` is the public directory read model input.
* `support/*` stores support threads + status.

---

# Domains & Routing

## UI Domain

```
https://virtuallaunch.pro
```

## API Domain

```
https://api.virtuallaunch.pro
```

Worker route:

```
api.virtuallaunch.pro/*
```

Rules:

* All forms POST absolute Worker URLs
* No relative form actions
* No UI → R2 direct writes
* No UI → Stripe mutation logic

---

# Event Trigger System

Final Trigger Set (Alphabetical):

* Form
* Payment

Form → VA publish + support message
Payment → Stripe webhook (subscription active)

Only mutation sources append receipts.

---

# Idempotency & Safety

* eventId is idempotency key
* Receipt must exist before mutation
* Duplicate eventId → safe exit
* sessionToken must validate before mutation (authenticated forms)

---

# Operational Checklist

* All forms POST absolute Worker URLs
* eventId included in every mutation
* Receipt written before state change
* sessionToken validated (authenticated mutations)
* Directory index updated on publish
* Emails (if any) sent only after canonical update

---

# Processing Contract (Write Order)

For every inbound mutation event:

1. Validate signature (if webhook)
2. Validate payload against JSON contract
3. Append receipt (immutable)
4. Upsert canonical object
5. Project (optional) after canonical update

If receipt exists → exit safely.

Receipt append always precedes canonical mutation.

---

# Read Models (Worker GET Endpoints)

Read models:

* Do not append receipts
* Do not mutate canonical R2
* Do not project

Examples:

```
GET /directory
GET /va/{slug}
GET /va/dashboard/profile
GET /va/dashboard/analytics
```

---

# Repository Structure (Exact Tree)

```
.
├─ README.md
├─ wrangler.toml
├─ workers/
│  └─ src/index.js
├─ lp/va-starter-track/
│  ├─ index.html
│  └─ README.md
├─ support.html
└─ va/
   ├─ dashboard/
   │  ├─ index.html
   │  ├─ analytics.html
   │  └─ setup.html
   ├─ directory/
   │  └─ index.html
   └─ profile/
      └─ template.html
```

---

# Security & Legal Controls

* Deny-by-default endpoints
* Webhook signature validation (Stripe, Cal)
* No secrets in client payload
* Strict JSON validation (reject unknown fields)
* R2 is authority

---

# Session Model & Tokens

Stripe does NOT provide an authenticated session token for your app.

Stripe redirect URLs are UI redirects only.
They are not authentication.

Correct model:

1. Stripe webhook marks subscription active in R2
2. System issues a sessionToken (signed, short-lived)
3. Dashboard uses sessionToken for authenticated POST/GET

Session tokens must:

* Be verifiable (HMAC or JWT)
* Be short-lived
* Map to a canonical account/profile

---

# Stripe Payments (Subscription + Webhooks)

VA Starter Track uses **Stripe Subscription Payment Links**.

## Product

* Product Name: VA Starter Track — Monthly
* Price: $1.99 USD / month
* Product ID: `prod_U3fRQzFg676SLl`
* Tax Code: `txcd_20030000` (General - Services)

## Payment Link

Authoritative billing URL:

```
https://billing.taxmonitor.pro/b/fZu6oGcImaZk3k48z0aR206
```

Rules:

* UI never grants access
* UI redirect is cosmetic only
* Subscription activation occurs only via Stripe webhook

## Webhook Source of Truth

Stripe webhook must:

1. Validate Stripe signature
2. Append receipt → `receipts/stripe/{eventId}.json`
3. Upsert canonical subscription state
4. Enable dashboard access

Redirect pages must never mutate canonical state.

---

# Support Message Contract (v1)

## Endpoint

```
POST https://api.virtuallaunch.pro/forms/support/message
```

## Required Fields (Alphabetical)

* email
* eventId
* message
* name
* subject

## Optional Fields (Alphabetical)

* sessionToken
* utm_*

## Processing Order

1. Append receipt → `receipts/forms/{eventId}.json`
2. Upsert `support/{supportId}.json`
3. Project to ClickUp (optional)
4. Send email (only after canonical update, if enabled)

Rules:

* `eventId` is the idempotency key.
* Receipt must be written before canonical mutation.

## Response

```json
{
  "supportId": "SUP-YYYY-0001"
}
```

---

# System Architecture

## Presentation Layer

Cloudflare Pages serves:

* `/lp/va-starter-track/*` (marketing)
* `/va/dashboard` (authenticated UI root)
* `/va/dashboard/setup` (edit landing-page form, authenticated UI)
* `/va/dashboard/analytics` (booking + page views, authenticated UI)
* `/va/damian-reyes/{slug}` (public profile render pattern example)
* `/support.html` (public support page)
* `/va/directory` (public listing)

UI never mutates canonical state directly. All mutations go through Worker endpoints.

---

## Logic Layer

Cloudflare Worker (`api.virtuallaunch.pro`):

* Validates inbound events
* Writes append-only receipts
* Upserts canonical state
* Enforces idempotency
* Serves read-only GET endpoints

---

## Storage Layer

Cloudflare R2:

* Canonical objects (mutable state)
* Append-only receipt ledger (immutable)

R2 is authority.

---

# UI Pages Required

Alphabetical:

* Dashboard analytics page → `/va/dashboard/analytics`
* Dashboard root page → `/va/dashboard`
* Dashboard setup page → `/va/dashboard/setup`
* Directory page → `/va/directory`
* Landing page → `lp/va-starter-track/index.html`
* Login page → `/va/login`
* Payment success page → `lp/va-starter-track/payment-success.html`
* Profile page → `/va/{slug}`
* Support page → `/support.html`

---

---

# Worker Environment Variables

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

## Plaintext

* BILLING_LINK_VA_STARTER_TRACK
* CLICKUP_ACCOUNTS_LIST_ID
* CLICKUP_SUPPORT_LIST_ID
* GOOGLE_CLIENT_EMAIL
* GOOGLE_WORKSPACE_USER_SUPPORT
* MY_ORGANIZATION_ADDRESS
* MY_ORGANIZATION_BUSINESS_LOGO
* MY_ORGANIZATION_CITY
* MY_ORGANIZATION_NAME
* MY_ORGANIZATION_STATE_PROVINCE
* MY_ORGANIZATION_ZIP
* PRICE_1.99
* PRICE_LINK_VA_Starter_Track_Monthly

---

# Payloads (Stripe, Transcript Report, Cal Support)

This section documents the inbound payload shapes the Worker must accept.

## Payload Groups (By Source)

### Stripe

* charge.succeeded
* checkout.session.completed
* payment_intent.succeeded

### Cal.com

* BOOKING_CANCELLED
* BOOKING_CREATED
* BOOKING_RESCHEDULED

---

## Stripe (checkout.session.completed)

Event source: Stripe webhook.

Purpose:

Stores the user purchases and links to the Support task for Admin reference.

Minimum fields used:

* `id` (event id) → receipt + Account Event ID CF
* `data.object.id` → Stripe Session ID CF (dedupe key)
* `data.object.customer_details.name` → Account Full Name CF
* `data.object.customer_details.email` → Account Primary Email CF
* `data.object.status` → Stripe Payment Status CF
* `data.object.payment_link` → Stripe Payment URL CF
* `data.object.payment_intent` → Stripe Payment Intent ID CF

Example (trimmed):

```json
{
  "id": "evt_1SzncbCMpIgwe61ZklDYVjgV",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_a15vr7buckd0jG38Vzsuf7QObOwGanLb20JXqw7CZLeDve32AatnSY7TaY",
      "status": "complete",
      "payment_status": "paid",
      "payment_intent": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
      "payment_link": "plink_1SznXhCMpIgwe61ZUclAKXCj",
      "customer_details": {
        "name": "Jamie L Williams",
        "email": "jamie.williams@virtuallaunch.pro",
        "business_name": null
      }
    }
  }
}
```

Canonical effects:

* Create account (if new)

## Stripe (payment_intent.succeeded)

Event source: Stripe webhook.

Purpose:

Confirms payment intent succeeded
Links to Checkout Session + Charge by `payment_intent` id

Minimum fields used:

* `id` (event id) → Account Event ID CF
* `data.object.id` → Stripe Payment Intent ID CF
* `data.object.status` → Stripe Payment Status CF

Example (trimmed):

```json
{
  "id": "evt_3SzncZCMpIgwe61Z0XeE9DfJ",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
      "status": "succeeded",
      "latest_charge": "ch_3SzncZCMpIgwe61Z0faf2v3f"
    }
  }
}
```

## Stripe (charge.succeeded)

Event source: Stripe webhook.

Purpose:

Supplies receipt URL for the order

Minimum fields used:

* `object.payment_intent` → Stripe Payment Intent ID CF
* `object.receipt_url` → Stripe Receipt URL CF
* `object.status` → Stripe Payment Status CF

Example (trimmed):

```json
{
  "object": {
    "id": "ch_3SzncZCMpIgwe61Z0faf2v3f",
    "object": "charge",
    "status": "succeeded",
    "payment_intent": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
    "receipt_url": "https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFSTmdtWENNcElnd2U2MVoo-bi0zAYyBnyGtbiKBjosFlkRUNJF8liaNSNl-GMQaxhh_fccQx5an3FCrTmIN6kgO6QtPRoXRJr3ZR8"
  }
}
```

---

## Stripe Webhook Destination (Production)

Destination details

Destination ID
`we_1T5csCCMpIgwe61ZVclziEhq`

Name
`virtuallaunch-pro-stripe-webhook`

Endpoint URL
`https://api.virtuallaunch.pro/stripe/webhook`

Description
Receives Stripe events for Virtual Launch Pro checkouts and subscription lifecycle updates. Used to confirm successful payments and keep service access in sync with renewals, cancellations, and failed invoices.

API version
`2025-04-30.basil`

Listening to
3 events

Events (Alphabetical):

* charge.succeeded
* checkout.session.completed
* payment_intent.succeeded

---json
{
"object": {
"id": "ch_3SzncZCMpIgwe61Z0faf2v3f",
"object": "charge",
"status": "succeeded",
"payment_intent": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
"receipt_url": "[https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFSTmdtWENNcElnd2U2MVoo-bi0zAYyBnyGtbiKBjosFlkRUNJF8liaNSNl-GMQaxhh_fccQx5an3FCrTmIN6kgO6QtPRoXRJr3ZR8](https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFSTmdtWENNcElnd2U2MVoo-bi0zAYyBnyGtbiKBjosFlkRUNJF8liaNSNl-GMQaxhh_fccQx5an3FCrTmIN6kgO6QtPRoXRJr3ZR8)"
}
}

````

## Cal.com (BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED)

Event source: Cal webhook.

Purpose:

Supplies task for support to conduct the booking.

Minimum fields used:

* `payload.title` -> Task Name
* `payload.eventTypeId` (must match transcript support event type) ->Support Event ID CF

Canonical effects:

* Upsert `support/{supportId}.json`
* Project latest Support Event ID CF
* Project start / due dates and times

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "title": "[Cal Video] Tax Monitor Service Support between Jamie Williams and Jamie Williams",
    "startTime": "2026-02-11T00:45:00Z",
    "endTime": "2026-02-11T01:00:00Z",
    "eventTypeId": 4715669
  }
}
````

---

# Wrangler Cron Configuration

Cloudflare cron runs in UTC.

```toml
[triggers]
crons = ["0 16 * * *"]
```

Move hour if operationally preferred.

---

Architecture locked.
