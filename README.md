# Virtual Launch Pro

## Table of Contents

* [Overview](#1-overview)
* [Key Features](#2-key-features)
* [Architecture Overview](#3-architecture-overview)
* [Ecosystem Overview](#4-ecosystem-overview)
* [Repository Structure](#5-repository-structure)
* [Environment Setup](#6-environment-setup)
* [Deployment](#7-deployment)
* [Contracts or Data Model](#8-contracts-or-data-model)
* [Development Standards](#9-development-standards)
* [Integrations](#10-integrations)
* [Security and Secrets](#11-security-and-secrets)
* [Contribution Guidelines](#12-contribution-guidelines)
* [License](#13-license)

---

# Virtual Launch Pro

Virtual Launch Pro (VLP) is the **professional membership and infrastructure platform** that powers the Tax Monitor ecosystem.

It manages professional accounts, memberships, token systems, profile publishing, and shared infrastructure services used across the network of tax-focused tools and directories.

The platform acts as the **operational core** for the ecosystem, while public discovery and consumer tools operate on separate sites.

Core responsibilities of VLP include:

* infrastructure for cross-site data access
* membership management for tax professionals
* professional profile publishing
* token allocation and balance tracking
* authenticated professional dashboards

The system is built using a **contract-driven architecture** running on Cloudflare Workers with **R2 storage as the canonical data layer**.

---

# 1. Overview

Virtual Launch Pro provides the operational backbone for a network of tax professional tools and discovery platforms.

The platform enables professionals to:

* access specialized tools
* manage memberships
* manage token usage
* publish structured public profiles
* receive taxpayer leads

Rather than operating as a case-management system, the ecosystem focuses on **discovery, tooling, and infrastructure** for tax professionals.

The platform separates responsibilities across several sites to keep complexity manageable while allowing shared data access.

---

# 2. Key Features

Major capabilities of the platform include:

* authentication and session management
* contract-driven API architecture
* lead generation infrastructure
* professional network listings
* tax tool token system
* transcript token system
* membership billing
* R2-based canonical data storage

The system enables professionals to participate in the ecosystem while maintaining clear separation between tools, directories, and membership infrastructure.

---

# 3. Architecture Overview

Virtual Launch Pro is built around a **worker-centric architecture** where API logic runs at the edge using Cloudflare Workers.

Core architectural principles include:

* canonical storage in R2
* contract-driven request validation
* cross-site data consumption through APIs
* deny-by-default API routing
* stateless workers

Primary components include:

* Cloudflare Workers for API execution
* D1 database for filtering and search indexes
* R2 for canonical records
* static front-end applications
* webhook ingestion pipelines

All write operations are validated through contracts before canonical storage is updated.

---

# 4. Ecosystem Overview

Virtual Launch Pro operates as the **infrastructure layer** for several connected products that together provide professional infrastructure, taxpayer discovery, monitoring services, and diagnostic tools.

Each platform performs a specific role in the ecosystem while interacting through **Cloudflare Worker APIs**.

Canonical records are stored in **R2**, while **D1** is used as a query and indexing layer to support fast filtering, searching, and dashboard queries.

The ecosystem consists of four primary platforms.

---

# Virtual Launch Pro (VLP)

Virtual Launch Pro is the **tax professional membership and infrastructure platform**.

It manages professional accounts, memberships, profiles, tokens, support systems, and booking infrastructure used by the rest of the ecosystem.

Memberships for professionals may include:

* directory listing access
* transcript analysis tokens
* Tax Tools Arcade tokens
* lead generation through TMP inquiries
* promotional placement across ecosystem platforms

---

# Responsibilities

* booking infrastructure
* canonical professional records
* membership management
* operator dashboard
* professional dashboards
* professional verification workflows
* profile builder
* scheduling integration
* support infrastructure
* token balances

---

# Professional Dashboard

Tax professionals access an authenticated dashboard used to manage their participation in the ecosystem.

The professional dashboard allows professionals to:

* connect their Cal.com scheduling account
* manage their professional profile
* update directory listing information
* view token balances
* access purchased tools
* manage support requests
* view booking activity and scheduling events

Scheduling analytics visible to professionals include:

* bookings
* cancellations
* reschedules
* booking link clicks

These events originate from **Cal.com integrations** and are surfaced inside the professional dashboard.

---

# Scheduling Integration (Cal.com)

Professionals can connect their **Cal.com account** to their Virtual Launch Pro profile.

The scheduling link is configured through the **profile builder** and stored as part of the professional profile record.

This integration allows the professional’s booking link to appear on their public directory profile while allowing scheduling activity to be surfaced in the professional dashboard.

Tracked events include:

* booking created
* booking cancelled
* booking rescheduled
* booking link accessed

These events are sourced from **Cal.com APIs and webhooks** and may be stored for reference within the platform.

Example profile record field:

```
cal_booking_url
```

Example canonical record snippet:

```
{
  "professional_id": "pro_48321",
  "name": "Jane Smith EA",
  "cal_booking_url": "https://cal.com/janesmith/tax-consult"
}
```

---

# Canonical Storage

Examples of canonical records stored in VLP R2:

```
/r2/bookings/{booking_id}.json
/r2/memberships/{membership_id}.json
/r2/professionals/{professional_id}.json
/r2/profiles/{professional_id}.json
/r2/support_tickets/{ticket_id}.json
/r2/tokens/{account_id}.json
```

---

# VLP Worker Routes

## Account Routes

```
GET   /v1/accounts/{account_id}
PATCH /v1/accounts/{account_id}
POST  /v1/accounts
```

### Purpose

* create professional accounts
* retrieve account details
* update account status

---

## Membership Routes

```
GET /v1/memberships/{membership_id}
GET /v1/memberships/by-account/{account_id}
```

### Purpose

* determine professional membership tier
* expose subscription level
* verify service access

---

## Profile Routes

```
GET   /v1/profiles/{professional_id}
PATCH /v1/profiles/{professional_id}
POST  /v1/profiles
```

### Purpose

* create professional profile
* update profile information
* expose profile data for directory display

---

## Token Routes

Two token systems exist in the ecosystem.

| Token Type        | Purpose                   |
| ----------------- | ------------------------- |
| transcript tokens | transcript analysis tools |
| tool tokens       | tax tools arcade          |

```
GET /v1/tokens/{account_id}

GET /v1/tokens/{account_id}/tools
GET /v1/tokens/{account_id}/transcripts

POST /v1/tokens/tools/credit
POST /v1/tokens/tools/debit

POST /v1/tokens/transcripts/credit
POST /v1/tokens/transcripts/debit
```

### Purpose

* credit tokens after purchases
* deduct tokens for tool usage
* verify token balances

---

## Support Routes

```
GET   /v1/support/tickets/{ticket_id}
GET   /v1/support/tickets/by-account/{account_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets
```

### Purpose

* create support tickets
* retrieve ticket history
* update ticket status

---

## Booking Routes

```
GET   /v1/bookings/{booking_id}
GET   /v1/bookings/by-account/{account_id}
GET   /v1/bookings/by-professional/{professional_id}
PATCH /v1/bookings/{booking_id}
POST  /v1/bookings
```

### Purpose

* create booking records originating from **Cal.com integrations**
* retrieve booking history
* expose scheduling events for professional dashboard activity
* update booking status when scheduling events occur

---

# TaxMonitor.pro (TMP)

Tax Monitor Pro is the **taxpayer discovery and membership platform**.

It connects taxpayers with tax professionals and provides consumer memberships offering:

* transcript tokens
* Tax Tools Arcade tokens
* access to professionals offering member discounts

TMP provides the public professional directory through an interactive lead form that matches taxpayers to professionals based on filtering selections and routes the inquiry to the appropriate professional profile.

---

## Responsibilities

* lead generation
* public profile display
* tax professional directory
* taxpayer discovery
* taxpayer memberships

Professional profiles displayed in the directory originate from **VLP canonical records**.

---

## Canonical Storage

Examples of TMP records stored in R2:

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

---

# TMP Worker Routes

## Directory Routes

```
GET /v1/directory/profiles
GET /v1/directory/profiles/{professional_id}
```

### Purpose

* retrieve professional listings
* support directory filtering and search

---

## Inquiry Routes

```
GET  /v1/inquiries/{inquiry_id}
GET  /v1/inquiries/by-professional/{professional_id}
POST /v1/inquiries
```

### Purpose

* create client inquiries
* retrieve inquiry records
* route taxpayer lead information to the selected professional profile
* provide inquiry data for professional dashboard analytics and reporting

---

## Membership Routes

```
GET  /v1/memberships/{account_id}
POST /v1/memberships
```

### Purpose

* create taxpayer memberships
* determine token entitlements
* verify membership status for discounts

---

# Tax Tools Arcade (TTTM)

Tax Tools Arcade provides **interactive tax tools** designed to educate taxpayers and generate discovery traffic.

## Responsibilities

* interactive tax tools
* token consumption for tools

---

## Canonical Storage

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

---

## Worker Routes

### Tool Execution

```
POST /v1/tools/{tool_slug}/run
```

---

### Tool Sessions

```
GET  /v1/tool-sessions/{session_id}
POST /v1/tool-sessions
```

---

### Token Verification

Before executing tools:

```
GET /vlp/v1/tokens/{account_id}/tools
```

---

# Transcript Tax Monitor (TTM)

Transcript Tax Monitor provides **transcript analysis and diagnostic tools**.

---

## Responsibilities

* transcript analysis tools
* transcript token usage

---

## Canonical Storage

```
/r2/transcript_jobs/{job_id}.json
/r2/transcript_results/{result_id}.json
```

---

## Worker Routes

### Transcript Jobs

```
GET  /v1/transcripts/jobs/{job_id}
POST /v1/transcripts/analyze
```

---

### Transcript Results

```
GET /v1/transcripts/results/{result_id}
```

---

### Token Verification

Before running transcript analysis:

```
GET /vlp/v1/tokens/{account_id}/transcripts
```

---

# Cross-Platform Data Flow

```
Tax Tools Arcade
→ generates discovery traffic

Transcript Tax Monitor
→ provides transcript diagnostics

Tax Monitor Pro
→ connects taxpayers with professionals

Virtual Launch Pro
→ manages professional infrastructure
```

---

# Data Storage Architecture

## R2 (Canonical Storage)

```
tm-canonical
ttm-canonical
tttm-canonical
vlp-canonical
```

R2 serves as the **source of truth** for the ecosystem.

---

## D1 (Query and Index Layer)

Used for fast queries and filtering.

Example uses:

* analytics aggregation
* dashboard summaries
* directory filtering
* membership lookups
* search queries

---

# Worker API Architecture

Workers serve as the integration layer between platforms.

Worker responsibilities include:

* canonical record writes
* contract enforcement
* cross-platform API access
* query index updates
* request validation

This architecture ensures:

* clear data ownership
* consistent contract enforcement
* scalable cross-platform integration

---

# 5. Repository Structure

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Descriptions

* `/app` authenticated application interfaces
* `/assets` shared visual resources
* `/contracts` JSON API contracts
* `/pages` onboarding and workflow pages
* `/partials` reusable UI components
* `/site` public marketing pages
* `/workers` Cloudflare Worker APIs

---

# 6. Environment Setup

Required software

* Git
* Node.js
* Wrangler CLI

Setup steps

1. clone repository
2. configure environment variables
3. install dependencies
4. run local worker environment

---

# 7. Deployment

Deployment occurs through **Cloudflare Workers** using Wrangler.

```
wrangler deploy
```

The `wrangler.toml` configuration includes:

* compatibility date
* environment variables
* R2 bucket bindings

---

# 8. Contracts or Data Model

Virtual Launch Pro uses **contract-driven APIs**.

Contracts define the relationship between:

* UI pages
* Worker routes
* R2 canonical storage
* D1 query indexes

Typical write pipeline

1 request received
2 contract validation
3 receipt stored in R2
4 canonical record updated in R2
5 D1 query index updated
6 response returned

---

# 9. Development Standards

Standards include

* alphabetical route documentation
* canonical Worker comment headers
* contract-first API design
* deny-by-default routing

---

# 10. Integrations

* Cal.com OAuth scheduling
* Cloudflare infrastructure
* Google OAuth login
* magic link authentication
* Stripe subscription billing

---

# 11. Security and Secrets

Secrets stored using Wrangler secret management.

Examples

* API tokens
* OAuth secrets
* webhook signing secrets

---

# 12. Contribution Guidelines

Recommended workflow

1 create branch
2 implement changes
3 test locally
4 submit pull request

---

# 13. License

This repository is proprietary software owned and maintained by Virtual Launch Pro.

Unauthorized redistribution or modification is not permitted.
That alone puts you ahead of about 90% of production systems. Which is mildly annoying because it means you’re actually designing the platform correctly.
