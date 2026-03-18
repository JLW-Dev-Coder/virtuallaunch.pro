# VLP Ecosystem — ChatGPT Working Context
### For: Restructuring TMP, TTMP, TTTMP to Next.js Standard
### Version: Phase 15+ (post-CVE patch)

---

## HOW TO USE THIS DOCUMENT (READ FIRST)

This document is your complete source of truth for the VLP ecosystem.
Do not invent routes, payloads, storage paths, or IDs that are not defined here.
Do not modify contracts. Do not duplicate ownership.

**Session discipline rules (critical — ChatGPT context window degrades over long sessions):**
- Each file or route you generate = one focused prompt. Do not batch multiple files.
- If output truncates or context feels stale, paste the relevant section of this doc again as a "context reset" before continuing.
- Use ChatGPT Projects: upload this file once to a Project, then start each file-generation chat inside that Project. Context persists across chats.
- Canvas output caps at ~500–800 lines reliably. For files longer than that, explicitly say: "Output in chunks. Start with lines 1–100 only. I will say CONTINUE for each next chunk."
- After each Canvas output, copy it locally before requesting the next chunk. Canvas does not have version persistence across sessions.

---

## PART 1 — ECOSYSTEM ORIENTATION

### What the ecosystem is

A multi-platform tax infrastructure system running on Cloudflare edge.

Four platforms. Each has its own repo, worker, D1 database, R2 storage, and frontend.

```
Virtual Launch Pro (VLP)     — professional infrastructure, canonical owner of shared records
Tax Monitor Pro (TMP)        — taxpayer discovery and membership
Transcript Tax Monitor (TTMP)— transcript diagnostics
Tax Tools Arcade (TTTMP)     — interactive tax education games
```

### Who uses what

```
Tax Professionals → VLP dashboard (CPAs, EAs, tax attorneys)
Taxpayers         → TMP dashboard + TTMP + TTTMP tools
```

### The one rule that overrides everything else

**VLP owns all shared operational records.**

TMP, TTMP, and TTTMP may READ shared records and project them into their own UX.
They must NOT write to shared records directly.
Shared writes go through VLP API routes.

---

## PART 2 — NEXTJS MIGRATION STANDARD (VLP REFERENCE)

VLP is already on Next.js 15. TMP, TTMP, and TTTMP must be restructured to match it exactly.

### VLP Stack (the target)

```
Frontend:   Next.js 15 + Tailwind + @cloudflare/next-on-pages
Backend:    Cloudflare Worker (workers/src/index.js)
Database:   Cloudflare D1 (binding: DB)
Storage:    Cloudflare R2 (binding: R2_VIRTUAL_LAUNCH)
Auth:       HttpOnly cookie session, Google OAuth, Magic Link, SSO
Billing:    Stripe (hosted + embedded checkout)
Booking:    Cal.com OAuth + webhook
Deploy:     Cloudflare Pages (frontend) + wrangler deploy (Worker)
```

### Key VLP source files to replicate pattern from

```
/web/lib/api/client.ts         — API client (mock + real modes)
/web/lib/auth/session.ts       — getSession() + getSessionToken()
/workers/src/index.js          — full Worker (64 routes, deny-by-default)
/workers/migrations/           — 15 D1 migration files (NOTE: VLP has duplicate 0002_ prefix and no 0014_*.sql — use clean sequential numbering in TMP/TTMP/TTTMP repos)
/contracts/                    — 64 canonical contracts (never modify)
/wrangler.toml                 — Worker config, bindings, env vars
```

### Architecture rules that must never be violated

```
1. Contracts are authoritative — never modify without explicit instruction
2. Write pipeline: receipt R2 → canonical R2 → D1 (always in this order)
3. VLP owns all shared operational records
4. Worker CORS locked to the platform's own domain
5. Session via HttpOnly cookie only (vlp_session / tmp_session / etc.)
6. All billing writes go through VLP Worker routes
7. Frontend pages must submit exactly what the contract expects — no invented fields
```

### Target repo structure for each platform

Every platform repo must conform to this layout:

```
app/
  account.html
  calendar.html
  dashboard.html
  receipts.html
  support.html
  token-usage.html
  [platform-specific].html     (e.g. reports.html for TTMP, games.html for TTTMP)

contracts/
  [platform-specific contracts only — see Part 4]

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

site/
  about.html
  contact.html
  features.html
  how-it-works.html
  index.html
  pricing.html
  sign-in.html

scripts/
  site.js

workers/
  src/
    index.js

web/
  lib/
    api/
      client.ts
    auth/
      session.ts

wrangler.toml
build.mjs
sitemap.xml
README.md
MARKET.md
```

### build.mjs purpose (replicate in all repos)

```
1. Copy static folders into dist/
2. Copy /partials into dist/ so runtime fetch("/partials/*.html") works
3. Inject <!-- PARTIAL:name --> markers into HTML files in dist/
```

### Cloudflare Pages build settings (same for all repos)

```
Build command:   node build.mjs
Build output:    dist
Root directory:  /
```

### Cloudflare Worker deploy settings

```
Build command:   npx wrangler deploy
Root directory:  workers
```

---

## PART 3 — PLATFORM-SPECIFIC RESPONSIBILITIES

### VLP (Virtual Launch Pro)

VLP plan tiers: Free | Starter ($79) | Scale ($199) | Advanced ($399)

Token grants per plan:
```r
Free:     0 game tokens,   0 transcript tokens
Starter:  30 game tokens,  30 transcript tokens
Scale:    120 game tokens, 100 transcript tokens
Advanced: 300 game tokens, 250 transcript tokens
```r

---

### TMP (Tax Monitor Pro)

TMP is the taxpayer-facing platform. It does NOT own professional records.

Canonical records TMP writes:
```
/r2/tmp_activity/{event_id}.json
/r2/tmp_entitlements/{account_id}.json
/r2/tmp_inquiries/{inquiry_id}.json
/r2/tmp_intake_sessions/{session_id}.json
/r2/tmp_preferences/{account_id}.json
```

TMP dashboard pages:
```
account / membership management
Cal.com calendar integration
taxpayer-to-tax-pro messaging / history
profile management (intake form)
support tickets
token balances
tool usage history
```

TMP plan tiers: Free | Essential ($9) | Plus ($19) | Premier ($39)

Token grants per plan:
```
Free:      0 game tokens, 0 transcript tokens
Essential: 5 game tokens, 2 transcript tokens
Plus:      15 game tokens, 5 transcript tokens
Premier:   40 game tokens, 10 transcript tokens
```

---

### TTMP (Transcript Tax Monitor)

TTMP handles transcript diagnostics. It does NOT own professional records.

Canonical records TTMP writes:
```
/r2/ttmp_activity/{event_id}.json
/r2/ttmp_preferences/{account_id}.json
/r2/ttmp_transcript_jobs/{job_id}.json
/r2/ttmp_transcript_results/{result_id}.json
```

TTMP dashboard pages:
```
account / membership management
Cal.com calendar integration
support tickets
token balances
transcript parser tool
transcript report history
transcript token usage history
```

TTMP plan tiers (token packs — not subscriptions):
```
10-pack  ($19)  — 10 transcript tokens
25-pack  ($29)  — 25 transcript tokens
100-pack ($129) — 100 transcript tokens
```

---

### TTTMP (Tax Tools Arcade)

TTTMP handles tax education games. It does NOT own professional records.

Canonical records TTTMP writes:
```
/r2/tttmp_activity/{event_id}.json
/r2/tttmp_preferences/{account_id}.json
/r2/tttmp_tool_sessions/{session_id}.json
```

TTTMP dashboard pages:
```
account / membership management
Cal.com calendar integration
game analytics (wins / loss / score)
support tickets
token balances
token usage history
```

TTTMP plan tiers (token packs — not subscriptions):
```
30-pack  ($9)  — 30 game tokens
80-pack  ($19) — 80 game tokens
200-pack ($39) — 200 game tokens
```

---

## PART 4 — CONTRACT RULES

### The cardinal rule

Contracts are **repo-local**. Never copy a VLP contract into TMP, TTMP, or TTTMP.

```
TMP contracts   → live in TMP repo
TTMP contracts  → live in TTMP repo
TTTMP contracts → live in TTTMP repo
VLP contracts   → govern ALL shared operational records
```

### Contract file naming

Always versioned:
```
/contracts/account.create.v1.json
/contracts/membership.update.v1.json
/contracts/intake.session.create.v1.json
```

### Contract structure (every contract must have all 7 keys)

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

### What each platform MUST NOT have contracts for

TMP, TTMP, and TTTMP must NOT have contracts for:
```
billing_customers
billing_invoices
billing_payment_intents
billing_payment_methods
billing_setup_intents
billing_subscriptions
bookings
memberships (shared operational writes)
professionals
profiles
support_tickets (shared writes)
tokens (balance writes)
```

Those are governed by VLP contracts. Platform repos call VLP API routes instead.

---

## PART 5 — CANONICAL IDs (use exactly as defined)

```
account_id        = ACCT_{UUID}
account_tmp_id    = TMP_ACCT_{account_id}
account_ttmp_id   = TTMP_ACCT_{account_id}
account_tttmp_id  = TTTMP_ACCT_{account_id}
account_vlp_id    = VLP_ACCT_{account_id}
booking_id        = BOOK_YYYYMMDD_{RANDOM}
event_id          = EVT_{UUID}
inquiry_id        = INQ_{UUID}
invoice_id        = INV_{UUID}
job_id            = JOB_{UUID}
membership_id     = MEM_{UUID}
message_id        = MSG_{UUID}
professional_id   = PRO_{UUID}
result_id         = RES_{UUID}
session_id        = SES_{UUID}
ticket_id         = TKT_{UUID}
```

IDs are globally unique and immutable once assigned.

---

## PART 6 — SHARED ROUTE SURFACE

All four platform Workers expose the same route paths for integration consistency.
The platform that owns the canonical record performs the write.
Other platforms that expose the same route proxy to or call VLP for shared operational records.

### Auth routes (all platforms must implement)

```
GET  /v1/auth/google/callback
GET  /v1/auth/google/start
GET  /v1/auth/magic-link/verify
GET  /v1/auth/session
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/saml/start
GET  /v1/auth/2fa/status/{account_id}
POST /v1/auth/logout
POST /v1/auth/magic-link/request
POST /v1/auth/sso/saml/acs
POST /v1/auth/2fa/challenge/verify
POST /v1/auth/2fa/disable
POST /v1/auth/2fa/enroll/init
POST /v1/auth/2fa/enroll/verify
```

### Account routes (all platforms must implement)

```
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

### Notification routes (all platforms must implement)

```
GET   /v1/notifications/in-app
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/in-app
POST  /v1/notifications/sms/send        (coming soon — Twilio)
POST  /v1/webhooks/twilio               (coming soon — Twilio)
```

### Support routes (all platforms must implement)

```
GET   /v1/support/tickets/by-account/{account_id}
GET   /v1/support/tickets/{ticket_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets

### Token routes (all platforms must implement)

```r
GET /v1/tokens/balance/{account_id}
GET /v1/tokens/usage/{account_id}
```r

### Preferences routes (all platforms must implement)

```r
GET   /v1/vlp/preferences/{account_id}
PATCH /v1/vlp/preferences/{account_id}
```r
```

### Booking routes (all platforms must implement — VLP is canonical writer)

```
GET   /v1/bookings/by-account/{account_id}
GET   /v1/bookings/by-professional/{professional_id}
GET   /v1/bookings/{booking_id}
GET   /v1/profiles/{professional_id}
PATCH /v1/bookings/{booking_id}
PATCH /v1/profiles/{professional_id}
POST  /v1/bookings
POST  /v1/profiles
```

### Billing routes (VLP ONLY — other platforms call VLP, do not implement locally)

```
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
GET    /v1/billing/receipts/{account_id}
POST   /v1/checkout/sessions
POST   /v1/webhooks/stripe
```

### Cal.com webhook (VLP ONLY)

```
POST /v1/webhooks/cal   → https://api.virtuallaunch.pro/v1/webhooks/cal
```

All Cal.com booking events route here. TMP, TTMP, TTTMP do not implement a /webhooks/cal route.

---

## PART 7 — R2 CANONICAL STORAGE MAP

### VLP-owned (shared operational records)

```
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

### TMP-owned

```
/r2/tmp_activity/{event_id}.json
/r2/tmp_entitlements/{account_id}.json
/r2/tmp_inquiries/{inquiry_id}.json
/r2/tmp_intake_sessions/{session_id}.json
/r2/tmp_preferences/{account_id}.json
```

### TTMP-owned

```
/r2/ttmp_activity/{event_id}.json
/r2/ttmp_preferences/{account_id}.json
/r2/ttmp_transcript_jobs/{job_id}.json
/r2/ttmp_transcript_results/{result_id}.json
```

### TTTMP-owned

```
/r2/tttmp_activity/{event_id}.json
/r2/tttmp_preferences/{account_id}.json
/r2/tttmp_tool_sessions/{session_id}.json
```

---

## PART 8 — CANONICAL EVENTS REFERENCE

### Auth events

```
AUTH_LOGIN_COMPLETED
GOOGLE_OAUTH_CALLBACK_COMPLETED
GOOGLE_OAUTH_STARTED
MAGIC_LINK_REQUESTED
MAGIC_LINK_VERIFIED
SESSION_CREATED
SSO_OIDC_CALLBACK_COMPLETED
SSO_OIDC_STARTED
SSO_SAML_ASSERTION_CONSUMED
SSO_SAML_STARTED
TWO_FA_DISABLED
TWO_FA_ENROLLMENT_STARTED
TWO_FA_ENROLLMENT_VERIFIED
TWO_FA_VERIFICATION_FAILED
TWO_FA_VERIFICATION_SUCCEEDED
```

### Account events

```
ACCOUNT_ARCHIVED
ACCOUNT_CREATED
ACCOUNT_UPDATED
MEMBERSHIP_ARCHIVED
MEMBERSHIP_CANCELLED
MEMBERSHIP_CREATED
MEMBERSHIP_UPDATED
```

### Billing events

```
CHECKOUT_SESSION_COMPLETED
CUSTOMER_SUBSCRIPTION_CREATED
CUSTOMER_SUBSCRIPTION_DELETED
CUSTOMER_SUBSCRIPTION_UPDATED
INVOICE_PAID
INVOICE_PAYMENT_FAILED
PAYMENT_INTENT_PAYMENT_FAILED
PAYMENT_INTENT_SUCCEEDED
```

### Booking events (Cal.com)

```
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

### Notification events

```
IN_APP_NOTIFICATION_CREATED
IN_APP_NOTIFICATION_DELIVERED
IN_APP_NOTIFICATION_DISMISSED
NOTIFICATION_PREFERENCES_UPDATED
SMS_DELIVERY_FAILED
SMS_NOTIFICATION_QUEUED
SMS_NOTIFICATION_SENT
TWILIO_STATUS_CALLBACK_RECEIVED
```

### Support events

```
SUPPORT_TICKET_CLOSED
SUPPORT_TICKET_CREATED
SUPPORT_TICKET_MESSAGE_ADDED
SUPPORT_TICKET_REOPENED
SUPPORT_TICKET_STATUS_UPDATED
```

---

## PART 9 — WRITE PIPELINE (never deviate)

Every mutation follows this exact order:

```
1. Request received
2. Contract validation (reject if invalid — deny-by-default)
3. Receipt written to R2 (immutable event record)
4. Canonical R2 object updated
5. D1 index updated (projection only — never source of truth)
6. Response returned
```

R2 is always authoritative. D1 is always a projection.

---

## PART 10 — STRIPE PRICE METADATA FORMAT

All Stripe prices must include this metadata structure:

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

Adjust `app`, `plan`, `plan_slug`, and token values per platform and tier.

---

## PART 11 — CHATGPT WORKING INSTRUCTIONS

### How to approach the migration task

The goal is to take TMP, TTMP, and TTTMP from their current state and restructure them to match the VLP Next.js 15 standard. That means:

1. Scaffold `/web` with App Router, Tailwind, and `@cloudflare/next-on-pages`
2. Port HTML partials into React components
3. Implement the shared Worker route surface in `workers/src/index.js`
4. Wire frontend to Worker via HttpOnly cookie session
5. Apply D1 migrations for platform-specific tables
6. Confirm R2 canonical paths match this document exactly
7. Write platform-local contracts only (no VLP contract duplication)

### Recommended task order

```
Phase A: Scaffold Next.js structure in /web
Phase B: Port marketing pages (site/)
Phase C: Port dashboard pages (app/) as React components
Phase D: Implement Worker auth routes
Phase E: Implement Worker account + membership routes
Phase F: Implement Worker notification + support routes
Phase G: Wire billing to VLP API routes (do not implement locally)
Phase H: Implement Cal.com booking routes (read/display only for non-VLP)
Phase I: Write D1 migration files
Phase J: Write platform-local contracts
Phase K: Deploy via wrangler + Cloudflare Pages
```

### Canvas output strategy (critical)

Canvas reliably handles ~500–800 lines. Some sessions cap at ~48 lines due to model limits.

Workaround — use this exact prompt pattern for any file over 200 lines:

```
"Generate [filename]. Output lines 1–150 only. Stop there.
I will say CONTINUE for each next chunk. Do not summarize — output raw code."
```

Then paste each chunk locally as you go.

For full Worker files (which will be 600–1500+ lines), break by route group:
```
Chunk 1: boilerplate + auth routes
Chunk 2: account + membership routes
Chunk 3: notification + support routes
Chunk 4: booking routes
Chunk 5: platform-specific routes
Chunk 6: error handlers + exports
```

### Context reset prompt (use when session degrades)

If ChatGPT starts inventing routes or forgetting rules, paste this:

```
CONTEXT RESET — rules for this session:
- Platform: [TMP / TTMP / TTTMP]
- Task: [specific file or route group]
- VLP owns shared operational records. [Platform] does NOT write to those paths.
- Write pipeline: receipt R2 → canonical R2 → D1
- Contracts are repo-local. Never duplicate VLP contracts.
- Deny-by-default routing. Every unmatched route returns 404.
- Session via HttpOnly cookie only.
- Do not invent fields not in the contract.
Refer to the uploaded CHATGPT_CONTEXT.md for all routes, paths, and IDs.
```

### ChatGPT Projects setup (recommended)

1. Create a Project named "VLP Ecosystem Migration"
2. Upload this file (`CHATGPT_CONTEXT.md`) to the Project files
3. Add custom instructions: "You are a senior Cloudflare + Next.js engineer working on the VLP ecosystem. Always consult CHATGPT_CONTEXT.md before generating any file. Never invent routes, IDs, or contracts not defined there."
4. Start one chat per file or per route group — do not mix multiple files in one chat

---

## PART 13 — LIVE ENVIRONMENT REFERENCE

```
VLP Frontend:   https://virtuallaunch.pro
VLP Worker API: https://api.virtuallaunch.pro
VLP D1:         virtuallaunch-pro (id: 079dfd69-dbf4-4070-bc91-51f837021795)
VLP R2:         virtuallaunch-pro
VLP Pages:      virtuallaunch-pro-web (GitHub auto-deploy on push)
CAL_APPT_DEMO:    https://cal.com/tax-monitor-pro/virtual-launch-pro-demo-intro
CAL_APPT_SUPPORT: https://cal.com/tax-monitor-pro/virtual-launch-pro-support
```

When TMP, TTMP, and TTTMP call VLP API routes, they must target `https://api.virtuallaunch.pro`.

CORS is locked on VLP Worker to `https://virtuallaunch.pro`. Platform frontends that call VLP routes must do so server-side (from their own Worker), not from the browser, to avoid CORS rejection.

---

## END OF CONTEXT DOCUMENT

Last updated: Phase 15 complete (post-CVE-2025-66478 Next.js patch)
This document is authoritative. When in doubt, stop generating and re-read the relevant section.
```



