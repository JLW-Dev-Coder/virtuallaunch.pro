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
* [Payloads (Stripe, Cal)](#payloads-stripe-cal)
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

### Task Names

Account list:

* `Client Full Name | VA Starter Track`

Support list:

* `Client Full Name | Support Type | Support Priority`

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

## Reference (ClickUp API Dumps)

<details>
<summary><strong>Accounts list (ClickUp list object)</strong></summary>

```json
{
  "id": "901711473499",
  "name": "Accounts",
  "deleted": false,
  "orderindex": 0,
  "priority": null,
  "assignee": null,
  "task_count": 1,
  "due_date": null,
  "start_date": null,
  "folder": {
    "id": "90177070460",
    "name": "VA Starter Track",
    "hidden": false,
    "access": true
  },
  "space": {
    "id": "90170896661",
    "name": "Admin",
    "access": true
  },
  "inbound_address": "a.t.901711473499.u-10505295.52a1190a-b1ef-4327-ad0d-4575859c3166@tasks.clickup.com",
  "archived": false,
  "override_statuses": true,
  "statuses": [
    {
      "id": "sc901711473499_ql3JDGwp",
      "status": "lead",
      "orderindex": 0,
      "color": "#87909e",
      "type": "open",
      "status_group": "subcat_901711473499"
    },
    {
      "id": "sc901711473499_YGi7USAJ",
      "status": "active prospect",
      "orderindex": 1,
      "color": "#5f55ee",
      "type": "custom",
      "status_group": "subcat_901711473499"
    },
    {
      "id": "sc901711473499_paQXZWfu",
      "status": "active client",
      "orderindex": 2,
      "color": "#30a46c",
      "type": "custom",
      "status_group": "subcat_901711473499"
    },
    {
      "id": "sc901711473499_PtMresA8",
      "status": "inactive prospect",
      "orderindex": 3,
      "color": "#f76808",
      "type": "done",
      "status_group": "subcat_901711473499"
    },
    {
      "id": "sc901711473499_P199BDW5",
      "status": "inactive client",
      "orderindex": 4,
      "color": "#e5484d",
      "type": "done",
      "status_group": "subcat_901711473499"
    },
    {
      "id": "sc901711473499_2rFUlBQ6",
      "status": "case closed",
      "orderindex": 5,
      "color": "#008844",
      "type": "closed",
      "status_group": "subcat_901711473499"
    }
  ],
  "permission_level": "create"
}
```

</details>

<details>
<summary><strong>Accounts list fields (ClickUp custom fields)</strong></summary>

```json
{
  "fields": [
    {
      "id": "059a571b-aa5d-41b4-ae12-3681b451b474",
      "name": "Account Company Name",
      "type": "short_text",
      "type_config": {},
      "date_created": "1772037874392",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "1b9a762e-cf3e-47d7-8ae7-98efe9e11eab",
      "name": "Stripe Payment Status",
      "type": "short_text",
      "type_config": {},
      "date_created": "1770919480157",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "33ea9fbb-0743-483a-91e4-450ce3bfb0a7",
      "name": "Account Event ID",
      "type": "short_text",
      "type_config": {},
      "date_created": "1772040729038",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "57e6c42b-a471-4316-92dc-23ce0f59d8b4",
      "name": "Stripe Session ID",
      "type": "short_text",
      "type_config": {},
      "date_created": "1770919466454",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "6fc65cba-9060-4d70-ab36-02b239dd4718",
      "name": "Stripe Payment Intent ID",
      "type": "short_text",
      "type_config": {},
      "date_created": "1772042380577",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "9e14a458-96fd-4109-a276-034d8270e15b",
      "name": "Account Support Task Link",
      "type": "tasks",
      "type_config": {
        "fields": []
      },
      "date_created": "1770919329551",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "a105f99e-b33d-4d12-bb24-f7c827ec761a",
      "name": "Account Primary Email",
      "type": "email",
      "type_config": {},
      "date_created": "1770919006808",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "b65231cc-4a10-4a38-9d90-1f1c167a4060",
      "name": "Account Full Name",
      "type": "short_text",
      "type_config": {},
      "date_created": "1772037556900",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "bbdf5418-8be0-452d-8bd0-b9f46643375e",
      "name": "Account Support Status",
      "type": "drop_down",
      "type_config": {
        "sorting": "manual",
        "new_drop_down": true,
        "options": [
          {
            "id": "32b2e245-fd5c-4a03-bc17-4ebdd8eae089",
            "name": "New / Open",
            "color": "#f900ea",
            "orderindex": 0
          },
          {
            "id": "c05a8aa5-f7f9-4b00-bd8d-079295791afc",
            "name": "Blocked",
            "color": "#E65100",
            "orderindex": 1
          },
          {
            "id": "4fa76dee-a591-4fff-ad19-d71774341d3b",
            "name": "In Progress",
            "color": "#e50000",
            "orderindex": 2
          },
          {
            "id": "1305897c-c718-497d-8120-348e10e6ed30",
            "name": "Needs Review",
            "color": "#0231E8",
            "orderindex": 3
          },
          {
            "id": "228c6ef0-4895-4cdb-8cae-4d1e1bb49fde",
            "name": "Waiting on Client",
            "color": "#FF4081",
            "orderindex": 4
          },
          {
            "id": "741f1d07-8409-4c1b-ad5f-4243793b5710",
            "name": "Complete",
            "color": "#EA80FC",
            "orderindex": 5
          },
          {
            "id": "3c97368c-56b7-472b-98d0-4bd5d1825f3d",
            "name": "Closed",
            "color": "#02BCD4",
            "orderindex": 6
          }
        ]
      },
      "date_created": "1770919308725",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "e5f176ba-82c8-47d8-b3b1-0716d075f43f",
      "name": "Account ID",
      "type": "short_text",
      "type_config": {},
      "date_created": "1770918977961",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "f8cb77f1-26b3-4788-83ed-2914bb608c11",
      "name": "Stripe Receipt URL",
      "type": "url",
      "type_config": {},
      "date_created": "1772042441485",
      "hide_from_guests": false,
      "required": false
    }
  ]
}
```

</details>

<details>
<summary><strong>Support list (ClickUp list object)</strong></summary>

```json
{
  "id": "901711478590",
  "name": "Support",
  "deleted": false,
  "orderindex": 1,
  "content": "",
  "priority": null,
  "assignee": null,
  "task_count": 0,
  "due_date": null,
  "start_date": null,
  "folder": {
    "id": "90177070460",
    "name": "VA Starter Track",
    "hidden": false,
    "access": true
  },
  "space": {
    "id": "90170896661",
    "name": "Admin",
    "access": true
  },
  "inbound_address": "a.t.901711478590.u-10505295.0efe4f13-5134-457f-8106-3bb6cacfe01a@tasks.clickup.com",
  "archived": false,
  "override_statuses": true,
  "statuses": [
    {
      "id": "sc901711478590_dn2dRFVb",
      "status": "open / new",
      "orderindex": 0,
      "color": "#87909e",
      "type": "open",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_OKMm7y2k",
      "status": "in progress",
      "orderindex": 1,
      "color": "#5f55ee",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_gpKVHSl7",
      "status": "waiting on client",
      "orderindex": 2,
      "color": "#4466ff",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_HlAcH0UR",
      "status": "blocked",
      "orderindex": 3,
      "color": "#1090e0",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_fdQqQDwm",
      "status": "in review",
      "orderindex": 4,
      "color": "#b660e0",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_cExcoTWL",
      "status": "resolved",
      "orderindex": 5,
      "color": "#f8ae00",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_B9XfYTKa",
      "status": "client feedback",
      "orderindex": 6,
      "color": "#aa8d80",
      "type": "custom",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_eLZNX2kO",
      "status": "complete",
      "orderindex": 7,
      "color": "#656f7d",
      "type": "done",
      "status_group": "subcat_901711478590"
    },
    {
      "id": "sc901711478590_jEEaBdaL",
      "status": "Closed",
      "orderindex": 8,
      "color": "#008844",
      "type": "closed",
      "status_group": "subcat_901711478590"
    }
  ],
  "permission_level": "create"
}
```

</details>

<details>
<summary><strong>Support list fields (ClickUp custom fields)</strong></summary>

```json
{
  "fields": [
    {
      "id": "03ebc8ba-714e-4f7c-9748-eb1b62e657f7",
      "name": "Support Latest Update",
      "type": "text",
      "type_config": {},
      "date_created": "1772135243246",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "7f547901-690d-4f39-8851-d19e19f87bf8",
      "name": "Support Email",
      "type": "email",
      "type_config": {},
      "date_created": "1770919584021",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "8e8b453e-01f3-40fe-8156-2e9d9633ebd6",
      "name": "Support Event ID",
      "type": "short_text",
      "type_config": {},
      "date_created": "1771382872871",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "aac0816d-0e05-4c57-8196-6098929f35ac",
      "name": "Support Action Required",
      "type": "drop_down",
      "type_config": {
        "sorting": "manual",
        "new_drop_down": true,
        "options": [
          {
            "id": "165c6aac-bb5a-420c-a64b-bca47b769e21",
            "name": "Acknowledge",
            "color": "#E65100",
            "orderindex": 0
          },
          {
            "id": "a233b302-7779-4136-bb37-eff6cd5e41cc",
            "name": "Triage",
            "color": "#1bbc9c",
            "orderindex": 1
          },
          {
            "id": "8c45bf38-2cc7-45bc-9c48-9dae275938a3",
            "name": "Resolve",
            "color": "#b5bcc2",
            "orderindex": 2
          },
          {
            "id": "dc9e42fb-a1ef-4b3e-a037-cc5b41d33209",
            "name": "Close",
            "color": "#EA80FC",
            "orderindex": 3
          }
        ]
      },
      "date_created": "1770919566506",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "b96403c7-028a-48eb-b6b1-349f295244b5",
      "name": "Support Priority",
      "type": "drop_down",
      "type_config": {
        "sorting": "manual",
        "new_drop_down": true,
        "options": [
          {
            "id": "fe8469b4-0ee1-4fa0-993d-bc9458f1ab6d",
            "name": "🟦 Low — As Scheduled",
            "color": "#0091ff",
            "orderindex": 0
          },
          {
            "id": "ea5fda7f-7c60-4e72-9034-0434836950a2",
            "name": "🟨 Normal — 3–5 Days",
            "color": "#ffc53d",
            "orderindex": 1
          },
          {
            "id": "8f155d97-8512-489f-88c6-77973e76e3c8",
            "name": "🟧 High — 48 Hours",
            "color": "#f76808",
            "orderindex": 2
          },
          {
            "id": "c8862a36-00cd-41b2-94be-22120bfe2f0b",
            "name": "🟥 Critical — Today",
            "color": "#e5484d",
            "orderindex": 3
          }
        ]
      },
      "date_created": "1770919693498",
      "hide_from_guests": false,
      "required": false
    },
    {
      "id": "e09d9f53-4f03-49fe-8c5f-abe3b160b167",
      "name": "Support Type",
      "type": "drop_down",
      "type_config": {
        "sorting": "manual",
        "new_drop_down": true,
        "options": [
          {
            "id": "5f847513-d4dd-4e45-af47-b229dbfbbb8f",
            "name": "Appt - Demo",
            "color": "#b5bcc2",
            "orderindex": 0
          },
          {
            "id": "a8d9484d-df52-42fa-a2c8-e4df801e398e",
            "name": "Appt - Exit / Offboarding",
            "color": "#04A9F4",
            "orderindex": 1
          },
          {
            "id": "75f47f09-fa16-40d4-9be3-583102361799",
            "name": "Appt - Intro",
            "color": "#3397dd",
            "orderindex": 2
          },
          {
            "id": "6ac3e8dc-ca14-4c84-b4da-a8fbefa6ad13",
            "name": "Appt - Onboarding",
            "color": "#3397dd",
            "orderindex": 3
          },
          {
            "id": "27d991dd-a5ee-4713-a844-ddc53650756b",
            "name": "Appt - Support",
            "color": "#3082B7",
            "orderindex": 4
          },
          {
            "id": "b3ae14e7-981d-4756-a14f-7d9a901392d0",
            "name": "Ticket - Intake",
            "color": "#e50000",
            "orderindex": 5
          },
          {
            "id": "fcd840f5-2a38-43db-92c9-611403fa90f6",
            "name": "Ticket - Offer",
            "color": "#bf55ec",
            "orderindex": 6
          },
          {
            "id": "f5e26bdf-adb1-4ad4-a9f7-97f63a6d2977",
            "name": "Ticket - Agreement",
            "color": "#800000",
            "orderindex": 7
          },
          {
            "id": "27f0a9ac-ba0f-4d04-bb02-0a90acdadfac",
            "name": "Ticket - Payment",
            "color": "#667684",
            "orderindex": 8
          },
          {
            "id": "349565f0-90d8-4c35-be41-62cd33ef3398",
            "name": "Ticket - Welcome",
            "color": "#FF4081",
            "orderindex": 9
          },
          {
            "id": "75ec9e09-bb75-4f4a-bc24-35c7da294c26",
            "name": "Ticket - Filing Status",
            "color": "#bf55ec",
            "orderindex": 10
          },
          {
            "id": "360e0d08-ae19-4a08-a7bf-08ac4579f7e2",
            "name": "Ticket - Address Update",
            "color": "#b5bcc2",
            "orderindex": 11
          },
          {
            "id": "ee2d7f9f-e102-4d91-9afa-431361d6bdcf",
            "name": "Ticket - Esign 2848",
            "color": "#b5bcc2",
            "orderindex": 12
          },
          {
            "id": "6aa21211-7691-42fc-9feb-b624f634f8a3",
            "name": "Ticket - Wet Sign 2848",
            "color": "#7C4DFF",
            "orderindex": 13
          },
          {
            "id": "789e2a6b-0c5c-4b3c-8b65-851d4eb4d798",
            "name": "Ticket - Compliance Report",
            "color": "#b5bcc2",
            "orderindex": 14
          },
          {
            "id": "231f2d26-3bad-4c35-b8e4-a8b126415751",
            "name": "Ticket - Client Exit Survey",
            "color": "#02BCD4",
            "orderindex": 15
          },
          {
            "id": "84c7bb75-1f12-48b2-82d5-6b4f76db62a7",
            "name": "Ticket - VA Landing Page Setup",
            "color": "#b6b6ff",
            "orderindex": 16
          }
        ]
      },
      "date_created": "1770919632977",
      "hide_from_guests": false,
      "required": false
    }
  ]
}
```

</details>

## Projection Rules

* Worker never reads ClickUp to decide canonical state.
* Worker always writes: receipt → canonical R2 → ClickUp projection.

---

# Contracts (Mutation Ingress Only)

All mutations must:

* Append receipt before canonical mutation
* Normalize booleans and arrays
* Reject unknown fields
* Validate strict JSON schema

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
* `support/*` stores support threads + status.
* `va/directory/index.json` is the public directory read model input.
* `va/pages/*` holds each VA public profile source of truth.

---

# Domains & Routing

## API Domain

```
https://api.virtuallaunch.pro
```

Worker route:

```
api.virtuallaunch.pro/*
```

## UI Domain

```
https://virtuallaunch.pro
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

Notes:

* Form → VA publish + support message
* Payment → Stripe webhook (subscription active)
* Only mutation sources append receipts

---

# Idempotency & Safety

* eventId is idempotency key
* Receipt must exist before mutation
* Duplicate eventId → safe exit
* sessionToken must validate before mutation (authenticated forms)

---

# Operational Checklist

* All forms POST absolute Worker URLs
* Directory index updated on publish
* Emails (if any) sent only after canonical update
* eventId included in every mutation
* Receipt written before state change
* sessionToken validated (authenticated mutations)

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

**Cal webhook write order (required):** signature → receipt → canonical → projection.

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
GET /va/dashboard/analytics
GET /va/dashboard/profile
```

---

# Repository Structure (Exact Tree)

```
.
├─ wrangler.toml
├─ workers/
│  └─ src/index.js
├─ lp/va-starter-track/
│  ├─ index.html
│  └─ README.md
└─ va/
   ├─ dashboard/
   │  ├─ analytics.html
   │  ├─ index.html
   │  ├─ setup.html
   │  └─ support.html
   ├─ directory/
   │  └─ index.html
   └─ profile/
      └─ template.html
```

---

# Security & Legal Controls

* Deny-by-default endpoints
* No secrets in client payload
* R2 is authority
* Strict JSON validation (reject unknown fields)
* Webhook signature validation (Cal, Stripe)

---

# Session Model & Tokens

Stripe does NOT provide an authenticated session token for your app.

Stripe redirect URLs are UI redirects only. They are not authentication.

Correct model:

1. Stripe webhook marks subscription active in R2
2. System issues a session token or session cookie (Worker-signed)
3. Dashboard uses the Worker-issued session for authenticated POST/GET

Session tokens must:

* Be short-lived
* Be verifiable (HMAC or JWT)
* Map to a canonical account/profile

## Dashboard Authentication (Cookie-Based Session Contract)

### Canonical Authentication Mechanism (v1)

Authenticated dashboard routes use a **Worker-validated session cookie**.

The dashboard UI sends authenticated requests using:

```
fetch(..., { credentials: "include" })
```

This instructs the browser to include cookies for:

```
https://api.virtuallaunch.pro
```

Therefore, authentication for dashboard POST and GET routes is:

* Cookie-based
* Worker-validated
* Not derived from client payload
* Not derived from Stripe redirect
* Not derived from hidden form inputs

### Required Cookie Properties

The session cookie MUST:

* Be cryptographically signed (HMAC or JWT)
* Be invalidated on logout
* Be issued only by the Worker
* Be sent with `HttpOnly`
* Be sent with `SameSite=Lax` or `SameSite=Strict`
* Be sent with `Secure`
* Be short-lived
* Map to a canonical `accountId`

The UI must never store:

* accountId in hidden inputs
* accountId in localStorage
* accountId in querystring
* sessionToken in localStorage

### Worker Validation Rules

For any authenticated POST route (including `/forms/va/publish`):

1. Read cookie
2. Verify signature
3. Resolve `accountId` from session
4. Reject request if invalid
5. Append receipt
6. Mutate canonical state

The Worker MUST ignore any `accountId` submitted by the client.

### Identity Resolution Rule

Canonical identity is always derived server-side:

```
accountId ← session cookie
```

Never:

```
accountId ← form field
accountId ← Stripe redirect
accountId ← localStorage
```

### Security Invariant

UI pages never define identity. UI pages never define canonical truth.

R2 is authority. Worker is gatekeeper.

---

# Stripe Payments (Subscription + Webhooks)

VA Starter Track uses **Stripe Subscription Payment Links**.

## Product

* Product ID: `prod_U3fRQzFg676SLl`
* Product Name: VA Starter Track — Monthly
* Price: $1.99 USD / month
* Tax Code: `txcd_20030000` (General - Services)

## Payment Link

Authoritative billing URL:

```
https://billing.taxmonitor.pro/b/fZu6oGcImaZk3k48z0aR206
```

Rules:

* Subscription activation occurs only via Stripe webhook
* UI never grants access
* UI redirect is cosmetic only

## Webhook Source of Truth

Stripe webhook must:

1. Validate Stripe signature
2. Append receipt → `receipts/stripe/{eventId}.json`
3. Upsert canonical subscription state
4. Enable dashboard access

Redirect pages must never mutate canonical state.

## Stripe Canonical Mapping (v1)

### Account identity

```
accountId = acct_stripe_{customerId}
```

### Idempotency

* Receipt dedupe key: `eventId`
* Payment dedupe key: `stripeSessionId` (for `checkout.session.completed`)

### R2 receipt ledger

```
receipts/stripe/{eventId}.json
```

### Canonical account object

```
accounts/{accountId}.json
```

Top-level keys (alphabetical):

* accountId
* createdAt
* primaryEmail
* stripe
* subscription

stripe keys (alphabetical):

* customerId
* eventId
* paymentIntentId
* paymentLink
* paymentStatus
* receiptUrl
* sessionId

subscription keys (alphabetical):

* activatedAt
* active

### Stripe event field mapping

`checkout.session.completed` (store):

* customerId = `data.object.customer`
* eventId = `id`
* fullName = `data.object.customer_details.name`
* paymentIntentId = `data.object.payment_intent`
* paymentLink = `data.object.payment_link`
* paymentStatus = `data.object.status`
* primaryEmail = `data.object.customer_details.email`
* stripeSessionId = `data.object.id`

`payment_intent.succeeded` (store):

* eventId = `id`
* paymentIntentId = `data.object.id`
* paymentStatus = `data.object.status`

`charge.succeeded` (store):

* paymentIntentId = `data.object.payment_intent`
* paymentStatus = `data.object.status`
* receiptUrl = `data.object.receipt_url`

## Stripe Correlation Index (paymentIntentId → accountId) (v1)

Purpose: enable `charge.succeeded` and `payment_intent.succeeded` to resolve `accountId` using `paymentIntentId`, since those events may not include `customerId`.

R2 key:

```
stripe/payment-intents/{paymentIntentId}.json
```

Created during:

* `checkout.session.completed`

Used during:

* `charge.succeeded`
* `payment_intent.succeeded`

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

# Payloads (Stripe, Cal)

This section documents the inbound payload shapes the Worker must accept.

## Payload Groups (By Source)

### Cal

* BOOKING_CANCELLED
* BOOKING_CREATED
* BOOKING_RESCHEDULED

### Stripe

* charge.succeeded
* checkout.session.completed
* payment_intent.succeeded

## Cal (Webhook)

Endpoint:

```
POST /cal/webhook
```

Required:

* Signature validation (CAL_WEBHOOK_SECRET)
* Write order: signature → receipt → canonical → projection

## Stripe (checkout.session.completed)

Event source: Stripe webhook.

Purpose: stores the user purchase and links to canonical account.

Minimum fields used:

* `id` (event id) → receipt + Account Event ID CF
* `data.object.id` → Stripe Session ID CF (dedupe key)
* `data.object.customer_details.email` → Account Primary Email CF
* `data.object.customer_details.name` → Account Full Name CF
* `data.object.payment_intent` → Stripe Payment Intent ID CF
* `data.object.payment_link` → Stripe Payment URL CF
* `data.object.status` → Stripe Payment Status CF

Canonical effects:

* Create account (if new)

## Stripe (payment_intent.succeeded)

Event source: Stripe webhook.

Purpose: confirms payment intent succeeded and links by `payment_intent` id.

Minimum fields used:

* `id` (event id) → Account Event ID CF
* `data.object.id` → Stripe Payment Intent ID CF
* `data.object.status` → Stripe Payment Status CF

## Stripe (charge.succeeded)

Event source: Stripe webhook.

Purpose: supplies receipt URL for the order.

Minimum fields used:

* `object.payment_intent` → Stripe Payment Intent ID CF
* `object.receipt_url` → Stripe Receipt URL CF
* `object.status` → Stripe Payment Status CF

---

# System Architecture

## Logic Layer

Cloudflare Worker (`api.virtuallaunch.pro`):

* Enforces idempotency
* Serves read-only GET endpoints
* Upserts canonical state
* Validates inbound events
* Writes append-only receipts

## Presentation Layer

Cloudflare Pages serves:

* `/lp/va-starter-track/*` (marketing)
* `/va/dashboard` (authenticated UI root)
* `/va/dashboard/analytics` (authenticated UI)
* `/va/dashboard/setup` (authenticated UI)
* `/va/dashboard/support.html` (authenticated UI)
* `/va/directory` (public listing)
* `/va/{slug}` (public profile)

UI never mutates canonical state directly. All mutations go through Worker endpoints.

## Storage Layer

Cloudflare R2:

* Append-only receipt ledger (immutable)
* Canonical objects (mutable state)

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
* Support page → `/va/dashboard/support.html`

## Endpoint Ownership (UI vs Worker)

Pages (static UI) routes and Worker (API) routes are separate concerns.

Example:

* `/pages/calendar` can exist as a **UI-only** route (Cloudflare Pages). The Worker does **not** need `GET /pages/calendar`.
* The Worker only needs calendar-related **API** routes:

  * `GET /cal/oauth/start`
  * `GET /cal/oauth/status`
  * `POST /cal/webhook`

As long as the UI page is deployed at its UI path and its JavaScript calls the Worker endpoints, the path is valid.

## Map UI Pages to Worker Endpoints (Alphabetical)

### Dashboard analytics → `/va/dashboard/analytics`

* `GET /auth/session`

### Dashboard root → `/va/dashboard`

* `GET /auth/session`
* `GET /cal/oauth/status`

### Dashboard setup → `/va/dashboard/setup`

* `GET /auth/session`
* `GET /cal/oauth/start`
* `GET /cal/oauth/status`

### Directory → `/va/directory`

* `GET /directory`

### Landing → `lp/va-starter-track/index.html`

* `POST /stripe/webhook` (indirect, Stripe calls this not the page)

### Login → `/va/login`

* `GET /auth/confirm` (user clicks magic link)
* `POST /auth/login`

### Payment success → `lp/va-starter-track/payment-success.html`

* none required (unless you add a read model later)

### Profile → `/va/{slug}`

* `GET /r2/object` (public object fetch by allowlisted prefix)

### Support → `/va/dashboard/support.html`

* `GET /auth/session`
* `GET /support/status` (optional, if you show ticket status)
* `POST /forms/support/message`

## Public `GET /r2/object` Warning

`GET /r2/object` is public by design. Anything under your allowlisted prefixes is retrievable.

Do not store secrets (tokens, OAuth creds, etc.) under public prefixes unless you want to practice incident response for fun.

---

# Worker Environment Variables

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* CLICKUP_PROJECTION_ENABLED
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

# Worker POST Contract (VA Publish v1)

(TODO: document the exact POST shape and canonical effects for VA publish, including required fields, optional fields, receipt key, and which canonical keys are mutated.)

---

# Support Status Read Model

(TODO: document the support status read model endpoint(s) and response shape used by the UI.)

---

# Support Status Webhook Ingestion

(TODO: document ClickUp webhook ingestion (if enabled) that mirrors Support status into `support/{supportId}.json`.)

---

# Support Webhook Health Watchdog

(TODO: document meta key, thresholds, and alert task behavior.)

---

# Wrangler Cron Configuration

Cloudflare cron runs in UTC.

```toml
[triggers]
crons = ["0 16 * * *"]
```

Move hour if operationally preferred.
