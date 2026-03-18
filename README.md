# Virtual Launch Pro (VLP)

## Table of Contents

* [Overview](#overview)
* [Current Build State](#current-build-state)
* [Key Features](#key-features)
* [Membership and Plans](#membership-and-plans)
* [Architecture Overview](#architecture-overview)
* [Ecosystem Overview](#ecosystem-overview)
* [Platform Responsibilities](#platform-responsibilities)
  * [Tax Monitor Pro (TMP)](#tax-monitor-pro-tmp)
  * [Tax Tools Arcade (TTTMP)](#tax-tools-arcade-tttmp)
  * [Transcript Tax Monitor (TTMP)](#transcript-tax-monitor-ttmp)
  * [Virtual Launch Pro (VLP)](#virtual-launch-pro-vlp)
* [Dashboards](#dashboards)
  * [Virtual Launch Pro Dashboard (VLP)](#virtual-launch-pro-dashboard-vlp)
  * [Tax Tools Dashboard (TTTMP)](#tax-tools-dashboard-tttmp)
  * [Taxpayer Dashboard (TMP)](#taxpayer-dashboard-tmp)
  * [Transcript Dashboard (TTMP)](#transcript-dashboard-ttmp)
* [Cross-Platform Data Flow & IDs](#cross-platform-data-flow--ids)
* [Data Storage Architecture](#data-storage-architecture)
* [Repository Structure](#repository-structure)
* [Environment Setup](#environment-setup)
* [Deployment](#deployment)
* [CloudFlare Integration](#cloudflare-integration)
* [Contracts or Data Model](#contracts-or-data-model)
* [Development Standards](#development-standards)
* [Integrations](#integrations)
  * [Account Integrations](#account-integrations)
  * [Cal.com Scheduling Integration](#calcom-scheduling-integration)
  * [Login Integrations](#login-integrations)
    * [Continue with Google](#continue-with-google)
    * [Magic Link](#magic-link)
    * [SSO (SAML / OIDC)](#sso-saml--oidc)
  * [Stripe Integration](#stripe-integration)
* [Notification Preferences](#notification-preferences)
  * [In-App Notifications](#in-app-notifications)
  * [Twilio SMS Integration (Coming Soon)](#twilio-sms-integration-coming-soon)
* [2FA Integration](#2fa-integration)
* [Support Ticket System](#support-ticket-system)
* [Security and Secrets](#security-and-secrets)
* [Contribution Guidelines](#contribution-guidelines)
* [License](#license)

---

## Current Build State

Last updated: Phase 15 complete

### Completed Phases
- Phase 1: Next.js scaffold in /web (layouts, Tailwind, App Router)
- Phase 2: React components from HTML partials
- Phase 3: Cloudflare Worker — 64-route scaffold (deny-by-default)
- Phase 4: Dashboard pages (account, calendar, receipts, support, token-usage)
- Phase 5: Worker auth routes (Google OAuth, magic link, SSO, 2FA)
- Phase 6: Worker Stripe billing (hosted + embedded checkout, webhooks)
- Phase 7: Worker Cal.com (OAuth, bookings, profiles, webhook)
- Phase 8: D1 migrations (11 tables applied to remote)
- Phase 9: Frontend wired to live Worker (HttpOnly cookie session)
- Phase 10: Deployed — virtuallaunch.pro live on Cloudflare Pages
- Phase 11: All 64 Worker routes implemented (zero stubs)
- Phase 12: Sign-in page (magic link + Google OAuth + verify flow)
- Phase 13: Auth guard on dashboard routes
- Phase 14: Marketing pages (about, pricing, features, how-it-works, contact)
- Phase 15: Next.js security patch (CVE-2025-66478 — upgrade Next.js version)

### Live URLs
- Frontend: https://virtuallaunch.pro
- Worker API: https://api.virtuallaunch.pro
- D1 database: virtuallaunch-pro (id: 079dfd69-dbf4-4070-bc91-51f837021795)
- R2 bucket: virtuallaunch-pro
- Pages project: virtuallaunch-pro-web (GitHub auto-deploy on push)

### Stack
- Frontend: Next.js 15 + Tailwind + @cloudflare/next-on-pages
- Backend: Cloudflare Worker (workers/src/index.js)
- Database: Cloudflare D1 (binding: DB)
- Storage: Cloudflare R2 (binding: R2_VIRTUAL_LAUNCH)
- Auth: HttpOnly cookie (vlp_session), Google OAuth, Magic Link, SSO
- Billing: Stripe (hosted + embedded checkout)
- Booking: Cal.com OAuth + webhook
- Deployment: Cloudflare Pages (frontend) + wrangler deploy (Worker)

### Key Files
- /web/lib/api/client.ts — API client (mock + real)
- /web/lib/auth/session.ts — getSession() + getSessionToken()
- /workers/src/index.js — full Worker (64 routes)
- /workers/migrations/ — 11 D1 migration files
- /contracts/ — 64 canonical contracts (do not modify)
- /wrangler.toml — Worker config, bindings, env vars

### Architecture Rules (never violate)
- Contracts are authoritative — never modify without instruction
- Write pipeline: receipt R2 → canonical R2 → D1
- VLP owns all shared operational records
- Worker CORS locked to https://virtuallaunch.pro
- Session via vlp_session HttpOnly cookie only
- All billing writes go through VLP Worker routes

---

# Overview

Virtual Launch Pro (VLP) is the **professional infrastructure platform** powering a multi-site ecosystem of tax tools, transcript diagnostics, discovery systems, and professional services.

The ecosystem separates responsibilities across specialized platforms to keep systems modular and maintainable.

The system serves two primary user groups:

**Tax Professionals**

* CPAs
* Enrolled Agents
* Tax attorneys
* Virtual tax practices

**Taxpayers**

* individuals seeking tax diagnostics
* individuals seeking tax professionals
* individuals using tax tools

Professionals interact primarily with **Virtual Launch Pro**, while taxpayers interact through **Tax Monitor Pro and tool platforms**.

---

# Key Features

Major capabilities include:

* authentication and session management
* contract-driven APIs
* lead generation infrastructure
* membership billing
* professional profile publishing
* R2 canonical data storage
* token-based tool systems
* transcript diagnostics

---

# Memberships and Plans

| Feature / Capability | VLP Free | VLP Starter | VLP Scale | VLP Advanced | TMP Free | TMP Essential | TMP Plus | TMP Premier | TTMP (10-pk) | TTMP (25-pk) | TTMP (100-pk) | TTTMP (30-pk) | TTTMP (80-pk) | TTTMP (200-pk) |
|---------------------|----------|-------------|-----------|--------------|----------|---------------|----------|-------------|---------------|---------------|----------------|----------------|----------------|-----------------|
| Account / Membership Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Booking Analytics | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — |
| Calendar / Scheduling Integration | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Directory Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Game Analytics | — | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ |
| Monthly / Package Cost | $0 | $79 | $199 | $399 | $0 | $9 | $19 | $39 | $19 | $29 | $129 | $9 | $19 | $39 |
| Profile Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Profile Visibility | Directory | Directory | Featured | Top-Tier | — | — | — | — | — | — | — | — | — | — |
| Support Tickets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tax Tool Game Tokens | 0 | 30 | 120 | 300 | 0 | 5 | 15 | 40 | 0 | 0 | 0 | 0 | 0 | 0 |
| Tax-Pro ↔ Taxpayer Messaging / Inquiry | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Token Balances | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tool Usage History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transcript Parser Tool | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| Transcript Report History | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| Transcript Tokens | 0 | 30 | 100 | 250 | 0 | 2 | 5 | 10 | 10 | 25 | 100 | 30 | 80 | 200 |

**Notes**

- Booking Analytics = Created / Cancelled / Pending / Rescheduled / Profile Clicks / Profile Views  
- Game Analytics = Wins / Loss / Score  
- Top-Tier = TTMP or TTTMP Sponsored Ads
  
---

# Architecture Overview

The system runs on **CloudFlare edge infrastructure**.

Core principles:

* canonical storage in R2
* contract-driven validation
* deny-by-default routing
* stateless workers

Major components:

* CloudFlare Workers
* D1 query database
* R2 canonical storage
* static frontend applications
* webhook pipelines

Write pipeline:

```txt
1 request received
2 contract validation
3 receipt stored in R2
4 canonical record updated
5 D1 index updated
6 response returned
````

---

# Ecosystem Overview

The system consists of four coordinated platforms.

Each platform performs a specific role.

---

# Platform Responsibilities

## Ownership rule

VLP owns all **shared operational records** across the ecosystem.

That includes:

* account records
* bookings
* memberships
* tax pro dashboard
* profiles
* support tickets
* token balances

Other platforms may **read** these records, reference them, and project them into platform-specific UX, but they should not be the canonical writer unless the governing contract explicitly says otherwise. Because apparently letting four platforms fight over the same record was never going to age well.

---

## Tax Monitor Pro (TMP)

Tax Monitor Pro is the **taxpayer discovery and membership experience platform**.

Responsibilities:

* intake experience for taxpayers
* tax pro directory discovery
* taxpayer dashboard
* taxpayer inquiry capture and routing
* taxpayer discount/entitlements

TMP should handle canonical records such as:

```txt
/r2/tmp_activity/{event_id}.json
/r2/tmp_entitlements/{account_id}.json
/r2/tmp_inquiries/{inquiry_id}.json
/r2/tmp_intake_sessions/{session_id}.json
/r2/tmp_preferences/{account_id}.json
```

---

## Tax Tools Arcade (TTTMP)

Tax Tools Arcade provides **interactive tax education and tool execution**.

Responsibilities:

* dashboard for users
* discovery traffic generation (for tax pros)
* educational tax games
* tool execution state
* tool package consumption history
* tool-specific usage telemetry

TTTMP should handle canonical records such as:

```txt
/r2/tttmp_activity/{event_id}.json
/r2/tttmp_preferences/{account_id}.json
/r2/tttmp_tool_sessions/{session_id}.json
/r2/tttmp_tool_usage/{event_id}.json
```

---

## Transcript Tax Monitor (TTMP)

Transcript Tax Monitor provides **transcript diagnostics and analysis services**.

Responsibilities:

* dashboard for users
* discovery traffic generation (for tax pros)
* tool execution state
* tool package consumption history
* tool-specific usage telemetry
* transcript analysis automation

TTMP should handle canonical records such as:

```txt
/r2/ttmp_activity/{event_id}.json
/r2/ttmp_preferences/{account_id}.json
/r2/ttmp_tool_usage/{event_id}.json
/r2/ttmp_transcript_jobs/{job_id}.json
/r2/ttmp_transcript_results/{result_id}.json
```

---

## Virtual Launch Pro (VLP)

Virtual Launch Pro is the **professional infrastructure platform** and the **canonical owner of shared operational records**.

Responsibilities:

* account management
* billing configuration retrieval
* booking infrastructure
* checkout session orchestration
* customer portal session orchestration
* membership management
* professional dashboard
* professional profiles
* saved payment method coordination
* stripe customer lifecycle coordination
* stripe subscription lifecycle coordination
* support tickets
* token balances
* token purchase orchestration
* custom embedded billing orchestration
* hosted Stripe checkout orchestration
* webhook-driven billing state reconciliation

Billing responsibility rule:

VLP is the governing platform for ecosystem billing behavior tied to shared operational records. That includes memberships, token balances, subscription status, paid plan transitions, failed payment handling, and Stripe-backed customer state. Other platforms may display pricing, launch platform-specific purchase UX, or read membership status, but shared billing writes must flow through **VLP contracts and VLP API routes**.

Billing model:

VLP supports two Stripe billing patterns under the same contract-driven worker architecture:

* **hosted checkout** using Stripe Checkout Sessions
* **custom embedded checkout** using Stripe customer orchestration, saved payment methods, SetupIntents, PaymentIntents, and subscription creation/update flows

This allows frontends to keep a branded UI while preserving canonical billing ownership in VLP.

Canonical storage:

```txt
/r2/accounts_tmp/{account_tmp_id}.json
/r2/accounts_ttmp/{account_ttmp_id}.json
/r2/accounts_tttmp/{account_tttmp_id}.json
/r2/accounts_vlp/{account_vlp_id}.json
/r2/billing_customers/{account_id}.json
/r2/billing_invoices/{invoice_id}.json
/r2/billing_payment_intents/{event_id}.json
/r2/billing_payment_methods/{account_id}.json
/r2/billing_setup_intents/{event_id}.json
/r2/billing_subscriptions/{membership_id}.json
/r2/bookings/{booking_id}.json
/r2/memberships/{membership_id}.json
/r2/professionals/{professional_id}.json
/r2/profiles/{professional_id}.json
/r2/support_tickets/{ticket_id}.json
/r2/tokens/{account_id}.json
/r2/vlp_preferences/{account_id}.json
```

Canonical VLP billing routes:

```txt
GET    /v1/billing/config
GET    /v1/billing/payment-methods/{account_id}
GET    /v1/checkout/status
GET    /v1/pricing
PATCH  /v1/billing/subscriptions/{membership_id}
POST   /v1/billing/customers
POST   /v1/billing/payment-intents
POST   /v1/billing/payment-methods/attach
POST   /v1/billing/portal/sessions
POST   /v1/billing/setup-intents
POST   /v1/billing/subscriptions
POST   /v1/billing/subscriptions/{membership_id}/cancel
POST   /v1/billing/tokens/purchase
POST   /v1/checkout/sessions
POST   /v1/webhooks/stripe
```

Canonical VLP billing contracts:

```txt
/contracts/billing.config.get.v1.json
/contracts/billing.customer.create.v1.json
/contracts/billing.payment-intent.create.v1.json
/contracts/billing.payment-method.attach.v1.json
/contracts/billing.payment-method.list.v1.json
/contracts/billing.portal-session.create.v1.json
/contracts/billing.setup-intent.create.v1.json
/contracts/billing.subscription.cancel.v1.json
/contracts/billing.subscription.create.v1.json
/contracts/billing.subscription.update.v1.json
/contracts/billing.tokens.purchase.v1.json
/contracts/checkout.session.create.v1.json
/contracts/checkout.status.get.v1.json
/contracts/stripe.webhook.v1.json
```

Billing operational rules:

* all billing writes are contract-validated
* receipt is written first
* canonical R2 object is updated second
* D1 projection is updated last
* frontend pages must submit exactly the contract payload
* hosted checkout and embedded checkout must resolve back to the same canonical membership and token records
* webhook reconciliation must never bypass canonical R2 writes

---

# Dashboards

The ecosystem contains three authenticated dashboards.

---

## Virtual Launch Pro Dashboard (VLP)

Used by tax professionals.

Capabilities include:

* account / membership management
* booking analytics
* Cal.com calendar / scheduling integration
* tax-pro-to-taxpayer inquiry messaging / history
* profile management
* support tickets
* token balances
* tool usage history

---

## Taxpayer Dashboard (TMP)

Used by taxpayers.

Capabilities include:

* account / membership management
* Cal.com calendar integration
* taxpayer-to-tax-pro inquiry messaging / history
* profile management (intake form)
* support tickets
* token balances
* tool usage history

---

## Tax Tools Dashboard (TTTMP)

Shared game analytics dashboard.

Capabilities include:

* account / membership management
* Cal.com calendar integration
* game analytics (wins / loss / score)
* support tickets
* token balances
* token usage history

---

## Transcript Dashboard (TTMP)

Shared diagnostic dashboard.

Capabilities include:

* account / membership management
* Cal.com calendar integration
* support tickets
* token balances
* transcript parser tool
* transcript report history
* transcript token usage history

---

# Cross-Platform Data Flow & IDs

The ecosystem operates as a discovery loop.

```txt
Tax Tools Arcade
→ discovery traffic

Transcript Tax Monitor
→ diagnostics

Tax Monitor Pro
→ professional discovery

Virtual Launch Pro
→ professional infrastructure
```

---

## Canonical ID Reference

All storage keys and worker routes reference canonical identifiers. These IDs must remain stable across APIs, storage paths, and projections.

```txt
account_id        = ACCT_UUID
account_tmp_id    = TMP_ACCT_{account_id}
account_ttmp_id   = TTMP_ACCT_{account_id}
account_tttmp_id  = TTTMP_ACCT_{account_id}
account_vlp_id    = VLP_ACCT_{account_id}
booking_id        = BOOK_YYYYMMDD_RANDOM

event_id          = EVT_UUID
inquiry_id        = INQ_UUID
invoice_id        = INV_UUID
job_id            = JOB_UUID
membership_id     = MEM_UUID
message_id        = MSG_UUID
professional_id   = PRO_UUID
result_id         = RES_UUID
session_id        = SES_UUID
ticket_id         = TKT_UUID
```

### Purpose

These identifiers are used across:

* contract payloads
* D1 projection indexes
* event receipts
* R2 canonical storage paths
* Worker route parameters

ID values should be globally unique and immutable once assigned.

---

# Data Storage Architecture

## R2 (Canonical Storage)

```txt
tm-canonical
ttm-canonical
tttm-canonical
vlp-canonical
```

R2 is the **source of truth**.

---

## D1 (Query Layer)

General repository structure used across all ecosystem repositories that supports:

* analytics
* dashboard queries
* directory queries
* membership lookup
* search filtering

---

## Contract Data Reference

See `other.json` — canonical reference in the **Repository Structure** section.

```json
{
  "auth": {},
  "contract": {},
  "delivery": {},
  "effects": {},
  "payload": {},
  "response": {},
  "schema": {}
}
```

### Operational rules

* R2 is authoritative
* canonical object second
* contract writes receipt first
* D1 projection last

### Contract ownership

Contracts must be **repo-local**.

* TMP contracts live in TMP repo
* TTMP contracts live in TTMP repo
* TTTMP contracts live in TTTMP repo
* VLP contracts live in VLP repo

### Shared operational contract rule

Shared operational records are governed by **VLP contracts and VLP API routes**, not duplicated contract files across every repository.

The shared VLP-governed record set is:

```txt
/r2/accounts_tmp/{account_tmp_id}.json
/r2/accounts_ttmp/{account_ttmp_id}.json
/r2/accounts_tttmp/{account_tttmp_id}.json
/r2/accounts_vlp/{account_vlp_id}.json
/r2/billing_customers/{account_id}.json
/r2/billing_invoices/{invoice_id}.json
/r2/billing_payment_intents/{event_id}.json
/r2/billing_payment_methods/{account_id}.json
/r2/billing_setup_intents/{event_id}.json
/r2/billing_subscriptions/{membership_id}.json
/r2/bookings/{booking_id}.json
/r2/memberships/{membership_id}.json
/r2/professionals/{professional_id}.json
/r2/profiles/{professional_id}.json
/r2/support_tickets/{ticket_id}.json
/r2/tokens/{account_id}.json
/r2/vlp_preferences/{account_id}.json
```

TMP, TTMP, and TTTMP may read these records, reference them, and project them into platform-specific UX, but they should use **VLP API routes** for shared operational writes.

### Cross-platform contract rules

Cross-platform systems do not duplicate ownership.

* naming is shared across routes, payloads, and storage
* ownership stays with the platform that governs the record
* platform-local contracts remain local to each repo
* shared operational writes go through VLP for VLP-governed records
* structure is shared through VLP-governed API behavior

### Contract versioning

Every contract must be versioned.

Examples:

```txt
/contracts/account.create.v1.json
/contracts/membership.update.v1.json
```

### Frontend contract rule

Frontend code must not invent payloads.

* no optional fields unless the contract explicitly declares them
* page JS should submit exactly what the contract expects

---

# Repository Structure

General repository structure used across all ecosystem repositories.

```txt
app/
  account.html
  calendar.html
  dashboard.html
  other.html          (e.g. reports.html - TMP, TTMP, and TTTMP)
  receipts.html
  support.html        (call / appointments / support tickets)
  token-usage.html

contracts/
  account-contract.json
  other.json*

assets/
  favicon.ico
  logo.svg
  payment-success.html

legal/
  privacy.html
  refund.html
  terms.html

resources/
  case-studies.html
  other.html

site/
  about.html
  contact.html        (call / appointments / support tickets)
  features.html       or #features
  how-it-works.html   or #how-it-works
  index.html          (home)
  pricing.html
  sign-in.html

scripts/
  blog-manifest.mjs
  other.js
  site.js

workers/
  src/
    index.js*

wrangler.toml*

MARKET.md
README.md*
build.mjs
sitemap.xml
```

### build.mjs (repo root)

Purpose: build `dist/` for CloudFlare Pages by:

```txt
1 copying static folders into dist/
2 copying /partials into dist/ so runtime fetch("/partials/*.html") works
3 injecting <!-- PARTIAL:name --> markers into HTML files in dist/
```

`*` indicates **canonical standard files used across repositories.**

---

# Environment Setup

Required software:

* Git
* Node.js
* Wrangler CLI

Setup steps:

```txt
1 clone repository
2 configure environment variables
3 install dependencies
4 run local worker environment
```

---

# Deployment

Deployment occurs through **CloudFlare Workers**.

```bash
wrangler deploy
```

The `wrangler.toml` file defines:

* compatibility date
* D1 bindings
* environment variables
* R2 bindings

---

# CloudFlare Integration

General CloudFlare build settings used across all ecosystem repositories.

## API

```txt
Build command: npx wrangler deploy
Deploy command: npx wrangler deploy
Root directory: workers
Version command: npx wrangler deploy
```

## Pages

```txt
Build command: node build.mjs
Build comments: Enabled
Build output: dist
Root directory: /
```

---

# Contracts or Data Model

All APIs use **contract-driven validation**.

Contracts define relationships between:

* D1 index tables
* R2 canonical storage
* UI pages
* Worker routes

Every request must pass validation before modifying canonical records.

---

# Development Standards

Standards include:

* alphabetical route documentation
* canonical Worker headers
* contract-first APIs
* deny-by-default routing

Workers must document inbound routes and invariants clearly.

### Shared Worker Route Surface

The ecosystem maintains a **shared integration route surface** across all platform Workers.

Integration routes defined in this document (authentication, accounts, memberships, notifications, billing, support, etc.) are expected to exist in every platform Worker so the ecosystem behaves consistently.

Key rule:

```txt
Shared route surface
Platform-owned storage
```

This means multiple repositories may expose the **same route paths**, but the platform that governs the canonical record performs the write.

Example:

```txt
POST /v1/memberships
```

TMP Worker writes:

```txt
/r2/memberships/{membership_id}.json
```

VLP Worker writes:

```txt
/r2/memberships/{membership_id}.json
```

The route surface remains consistent across TMP, TTMP, TTTMP, and VLP, while canonical storage ownership remains platform-specific.

This architecture allows frontends to interact with a **unified API design across the ecosystem** while preserving clear data ownership boundaries.

---

# Integrations

Every repository in the ecosystem must implement three operational integrations.

These integrations are considered **core infrastructure responsibilities**.

---

## Account Integrations

Each repository must support canonical **account and membership management** across the ecosystem.

Responsibilities include:

* account archival
* account creation
* account linking across platforms
* account retrieval
* membership lifecycle management
* plan upgrades and downgrades

### Canonical events

```txt
ACCOUNT_ARCHIVED
ACCOUNT_CREATED
ACCOUNT_UPDATED
MEMBERSHIP_ARCHIVED
MEMBERSHIP_CANCELLED
MEMBERSHIP_CREATED
MEMBERSHIP_UPDATED
```

### Canonical worker routes

```txt
DELETE /v1/accounts/{account_id}
GET    /v1/accounts/{account_id}
GET    /v1/accounts/by-email/{email}
GET    /v1/memberships/by-account/{account_id}
GET    /v1/memberships/{membership_id}
PATCH  /v1/accounts/{account_id}
PATCH  /v1/memberships/{membership_id}
POST   /v1/accounts
POST   /v1/memberships
```

### Canonical storage

```txt
/r2/accounts_tmp/{account_tmp_id}.json
/r2/accounts_ttmp/{account_ttmp_id}.json
/r2/accounts_tttmp/{account_tttmp_id}.json
/r2/accounts_vlp/{account_vlp_id}.json
/r2/memberships/{membership_id}.json
```

Accounts are created per-platform but may reference a shared identity through authentication providers.

Membership state must always be written to **R2 canonical storage first**, then projected into D1 indexes used for dashboards and analytics.

---

## Cal.com Scheduling Integration

Used for professional booking infrastructure.

Responsibilities:

* attach scheduling URLs to professional profiles
* generate booking links
* OAuth to allow tax pros to create or connect Cal.com to their profile
* OAuth to allow users to book, cancel, and reschedule in-app TTTMP, TMP, and VLP
* schedule intro and support event types
* store booking events in canonical records

### Canonical webhook endpoint

VLP owns the canonical Cal.com webhook.
VLP governs bookings, profiles, tax pro dashboard behavior,
and booking analytics. All Cal.com webhook events route to:
https://api.virtuallaunch.pro/v1/webhooks/cal

Client-facing booking management uses Cal.com email-link
behavior, not VLP dashboard controls.

```txt
https://api.virtuallaunch.pro/v1/webhooks/cal
```

### Supported events

```txt
BOOKING_CANCELLED
BOOKING_CREATED
BOOKING_NO_SHOW_UPDATED
BOOKING_PAID
BOOKING_PAYMENT_INITIATED
BOOKING_REJECTED
BOOKING_REQUEST_RESCHEDULE
BOOKING_REQUESTED
BOOKING_RESCHEDULED
MEETING_ENDED
MEETING_STARTED
OUT_OF_OFFICE_CREATED
```

### Canonical worker routes

```txt
GET   /v1/bookings/by-account/{account_id}
GET   /v1/bookings/by-professional/{professional_id}
GET   /v1/bookings/{booking_id}
GET   /v1/profiles/{professional_id}
PATCH /v1/bookings/{booking_id}
PATCH /v1/profiles/{professional_id}
POST  /v1/bookings
POST  /v1/profiles
```

---

## Stripe Integration

Stripe powers **membership billing and payments**.

Capabilities include:

* checkout sessions
* membership upgrades
* pricing config retrieval
* subscription management
* token purchases
* webhook processing

### Canonical events

```txt
CHECKOUT_SESSION_COMPLETED
CUSTOMER_SUBSCRIPTION_CREATED
CUSTOMER_SUBSCRIPTION_DELETED
CUSTOMER_SUBSCRIPTION_UPDATED
INVOICE_PAID
INVOICE_PAYMENT_FAILED
PAYMENT_INTENT_PAYMENT_FAILED
PAYMENT_INTENT_SUCCEEDED
```

### Canonical webhook endpoint

```txt
POST /v1/webhooks/stripe
```

### Canonical worker routes

```txt
GET  /v1/checkout/status
GET  /v1/pricing
POST /v1/checkout/sessions
POST /v1/webhooks/stripe
```

### Canonical Stripe price metadata sample

```json
{
  "app": "tax-monitor-pro",
  "membership_type": "taxpayer",
  "plan": "free",
  "plan_slug": "free",
  "tax_tool_tokens_monthly": "0",
  "transcript_tokens_monthly": "0"
}
```

All billing events must update **canonical R2 records before projection**. The pricing route returns the **public pricing configuration** for TMP memberships, resolved from canonical Worker environment variables defined in `wrangler.toml`.

This route is **read-only** and exists for frontend pricing display only.

Worker should create paid memberships via Stripe Subscriptions API directly, and Free should create TMP membership state without any Stripe Elements render.

---

## Login Integrations

Each repository must support canonical login and session flows for:

* Continue with Google
* Magic Link
* SSO (SAML / OIDC)

---

### Continue with Google

Used for direct OAuth sign-in and account linking.

#### Canonical events

```txt
AUTH_LOGIN_COMPLETED
GOOGLE_OAUTH_CALLBACK_COMPLETED
GOOGLE_OAUTH_STARTED
SESSION_CREATED
```

#### Canonical endpoints

```txt
GET /v1/auth/google/callback
GET /v1/auth/google/start
```

#### Canonical worker routes

```txt
GET  /v1/auth/google/callback
GET  /v1/auth/google/start
GET  /v1/auth/session
POST /v1/auth/logout
```

---

### Magic Link

Used for passwordless email sign-in.

#### Canonical events

```txt
AUTH_LOGIN_COMPLETED
MAGIC_LINK_REQUESTED
MAGIC_LINK_VERIFIED
SESSION_CREATED
```

#### Canonical endpoints

```txt
GET  /v1/auth/magic-link/verify
POST /v1/auth/magic-link/request
```

#### Canonical worker routes

```txt
GET  /v1/auth/magic-link/verify
GET  /v1/auth/session
POST /v1/auth/logout
POST /v1/auth/magic-link/request
```

---

### SSO (SAML / OIDC)

Used for organizational sign-in and identity federation.

#### Canonical events

```txt
AUTH_LOGIN_COMPLETED
SESSION_CREATED
SSO_OIDC_CALLBACK_COMPLETED
SSO_OIDC_STARTED
SSO_SAML_ASSERTION_CONSUMED
SSO_SAML_STARTED
```

#### Canonical endpoints

```txt
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/saml/start
POST /v1/auth/sso/saml/acs
```

#### Canonical worker routes

```txt
GET  /v1/auth/session
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/saml/start
POST /v1/auth/logout
POST /v1/auth/sso/saml/acs
```

---

## Notification Preferences

Each repository must allow users to manage notification delivery preferences, including the ability to turn off in-app notifications and SMS notifications.

### In-App Notifications

Used for native product alerts inside TMP, TTMP, and VLP dashboards.

#### Canonical events

```txt
IN_APP_NOTIFICATION_CREATED
IN_APP_NOTIFICATION_DELIVERED
IN_APP_NOTIFICATION_DISMISSED
NOTIFICATION_PREFERENCES_UPDATED
```

#### Canonical webhook endpoint

```txt
None. In-app notifications are internal system events.
```

#### Canonical worker routes

```txt
GET   /v1/notifications/in-app
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/in-app
```

---

### Twilio SMS Integration (Coming Soon)

Used for SMS notification delivery and future account messaging workflows.

#### Canonical events

```txt
NOTIFICATION_PREFERENCES_UPDATED
SMS_DELIVERY_FAILED
SMS_NOTIFICATION_QUEUED
SMS_NOTIFICATION_SENT
TWILIO_STATUS_CALLBACK_RECEIVED
```

#### Canonical webhook endpoint

```txt
POST /v1/webhooks/twilio
```

#### Canonical worker routes

```txt
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/sms/send
POST  /v1/webhooks/twilio
```

---

## 2FA Integration

Used to allow users to enroll in, verify, and disable two-factor authentication.

### Canonical events

```txt
TWO_FA_DISABLED
TWO_FA_ENROLLMENT_STARTED
TWO_FA_ENROLLMENT_VERIFIED
TWO_FA_VERIFICATION_FAILED
TWO_FA_VERIFICATION_SUCCEEDED
```

### Canonical webhook endpoint

```txt
None. 2FA is handled through canonical worker routes.
```

### Canonical worker routes

```txt
GET   /v1/auth/2fa/status/{account_id}
POST  /v1/auth/2fa/challenge/verify
POST  /v1/auth/2fa/disable
POST  /v1/auth/2fa/enroll/init
POST  /v1/auth/2fa/enroll/verify
```

---

## Support Ticket System

Each repo must support **support ticket creation and tracking**.

Responsibilities:

* support dashboard visibility
* ticket retrieval
* ticket status updates
* ticket submission

Canonical storage:

```txt
/r2/support_tickets/{ticket_id}.json
```

### Canonical events

```txt
SUPPORT_TICKET_CLOSED
SUPPORT_TICKET_CREATED
SUPPORT_TICKET_MESSAGE_ADDED
SUPPORT_TICKET_REOPENED
SUPPORT_TICKET_STATUS_UPDATED
```

### Canonical webhook endpoint

```txt
None. Support tickets are internal system events.
```

### Canonical worker routes

```txt
GET   /v1/support/tickets/by-account/{account_id}
GET   /v1/support/tickets/{ticket_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets
```

Support tickets allow users to request help across the ecosystem.

---

# Security and Secrets

Secrets are managed using **Wrangler secret management**.

Examples include:

* API tokens
* email service credentials
* OAuth credentials
* Stripe webhook secrets

Secrets must never be committed to the repository.

---

# Contribution Guidelines

Recommended workflow:

```txt
1 create branch
2 implement changes
3 test locally
4 submit pull request
```

All pull requests must respect:

* canonical storage rules
* contract schemas
* worker route documentation

---

# License

This repository is proprietary software owned and maintained by **Virtual Launch Pro**.

Unauthorized redistribution or modification is prohibited.
