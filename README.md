# Virtual Launch Pro (VLP)

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Architecture Overview](#architecture-overview)
* [Ecosystem Overview](#ecosystem-overview)
* [Platform Responsibilities](#platform-responsibilities)

  * [Tax Monitor Pro (TMP)](#tax-monitor-pro-tmp)
  * [Tax Tools Arcade (TTTMP)](#tax-tools-arcade-tttmp)
  * [Transcript Tax Monitor (TTMP)](#transcript-tax-monitor-ttmp)
  * [Virtual Launch Pro (VLP)](#virtual-launch-pro-vlp)
* [Dashboards](#dashboards)

  * [Professional Dashboard (VLP)](#professional-dashboard-vlp)
  * [Taxpayer Dashboard (TMP)](#taxpayer-dashboard-tmp)
  * [Transcript Dashboard (TTMP)](#transcript-dashboard-ttmp)
* [Cross-Platform Data Flow](#cross-platform-data-flow)
* [Data Storage Architecture](#data-storage-architecture)
* [Repository Structure](#repository-structure)
* [Environment Setup](#environment-setup)
* [Deployment](#deployment)
* [Contracts or Data Model](#contracts-or-data-model)
* [Development Standards](#development-standards)
* [Integrations](#integrations)
* [Security and Secrets](#security-and-secrets)
* [Contribution Guidelines](#contribution-guidelines)
* [License](#license)

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

The ecosystem is designed to guide users from **tax education → diagnostics → professional engagement**.

---

# Architecture Overview

The system runs on **Cloudflare edge infrastructure**.

Core principles:

* canonical storage in R2
* contract-driven validation
* deny-by-default routing
* stateless workers

Major components:

* Cloudflare Workers
* D1 query database
* R2 canonical storage
* static frontend applications
* webhook pipelines

Write pipeline:

```
1 request received
2 contract validation
3 receipt stored in R2
4 canonical record updated
5 D1 index updated
6 response returned
```

---

# Ecosystem Overview

The system consists of four coordinated platforms.

Each platform performs a specific role.

---

# Platform Responsibilities

## Tax Monitor Pro (TMP)

Tax Monitor Pro is the **taxpayer discovery and membership platform**.

Responsibilities:

* professional directory
* taxpayer discovery
* taxpayer memberships
* inquiry routing
* taxpayer dashboards

Professional profiles displayed in the directory originate from **VLP canonical records**.

---

### Canonical Storage

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_accounts/{account_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

---

### Worker Routes

Directory

```
GET /v1/directory/profiles
GET /v1/directory/profiles/{professional_id}
```

Inquiries

```
GET  /v1/inquiries/{inquiry_id}
GET  /v1/inquiries/by-professional/{professional_id}
POST /v1/inquiries
```

Taxpayer Accounts

```
GET   /v1/taxpayers/{account_id}
PATCH /v1/taxpayers/{account_id}
POST  /v1/taxpayers
```

Taxpayer Membership

```
GET /v1/taxpayer-memberships/{membership_id}
GET /v1/taxpayer-memberships/by-account/{account_id}
```

---

## Tax Tools Arcade (TTTMP)

Tax Tools Arcade provides **interactive tax education tools**.

Responsibilities:

* discovery traffic generation
* educational tax calculators
* token-based tool execution

---

### Canonical Storage

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

---

### Worker Routes

Tool execution

```
POST /v1/tools/{tool_slug}/run
```

Tool sessions

```
GET  /v1/tool-sessions/{session_id}
POST /v1/tool-sessions
```

Token verification

```
GET /vlp/v1/tokens/{account_id}/tools
```

---

## Transcript Tax Monitor (TTMP)

Transcript Tax Monitor provides **transcript diagnostics and analysis services**.

These tools allow both taxpayers and professionals to analyze IRS transcripts to identify potential issues.

---

### Responsibilities

* transcript diagnostics
* transcript analysis automation
* transcript dashboards
* token-based transcript processing

---

### Canonical Storage

```
/r2/transcript_jobs/{job_id}.json
/r2/transcript_results/{result_id}.json
```

---

### Worker Routes

Transcript jobs

```
GET  /v1/transcripts/jobs/{job_id}
POST /v1/transcripts/analyze
```

Transcript results

```
GET /v1/transcripts/results/{result_id}
```

Token verification

```
GET /vlp/v1/tokens/{account_id}/transcripts
```

---

## Virtual Launch Pro (VLP)

Virtual Launch Pro is the **professional infrastructure platform**.

Responsibilities:

* booking infrastructure
* membership management
* professional dashboards
* professional profiles
* support systems
* token balances

---

### Canonical Storage

```
/r2/bookings/{booking_id}.json
/r2/memberships/{membership_id}.json
/r2/professionals/{professional_id}.json
/r2/profiles/{professional_id}.json
/r2/support_tickets/{ticket_id}.json
/r2/tokens/{account_id}.json
```

---

### Worker Routes

Accounts

```
GET   /v1/accounts/{account_id}
PATCH /v1/accounts/{account_id}
POST  /v1/accounts
```

Bookings

```
GET   /v1/bookings/{booking_id}
GET   /v1/bookings/by-account/{account_id}
GET   /v1/bookings/by-professional/{professional_id}
PATCH /v1/bookings/{booking_id}
POST  /v1/bookings
```

Profiles

```
GET   /v1/profiles/{professional_id}
PATCH /v1/profiles/{professional_id}
POST  /v1/profiles
```

Support

```
GET   /v1/support/tickets/{ticket_id}
GET   /v1/support/tickets/by-account/{account_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets
```

Tokens

```
GET /v1/tokens/{account_id}
GET /v1/tokens/{account_id}/tools
GET /v1/tokens/{account_id}/transcripts
POST /v1/tokens/tools/credit
POST /v1/tokens/tools/debit
POST /v1/tokens/transcripts/credit
POST /v1/tokens/transcripts/debit
```

---

# Dashboards

The ecosystem includes **three authenticated dashboards**.

---

# Professional Dashboard (VLP)

Tax professionals access their infrastructure through **Virtual Launch Pro**.

Capabilities include:

* booking analytics
* Cal.com scheduling integration
* professional profile management
* support tickets
* token balances
* tool access

Example canonical profile field:

```
cal_booking_url
```

Example record:

```
{
  "professional_id": "pro_48321",
  "name": "Jane Smith EA",
  "cal_booking_url": "https://cal.com/janesmith/tax-consult"
}
```

---

# Taxpayer Dashboard (TMP)

Taxpayers access their dashboard through **Tax Monitor Pro**.

Capabilities include:

* inquiry history
* taxpayer membership management
* token balances
* transcript job tracking
* tool usage history

Example supporting records:

```
/r2/taxpayer_accounts/{account_id}.json
/r2/taxpayer_memberships/{membership_id}.json
/r2/tool_sessions/{session_id}.json
```

---

# Transcript Dashboard (TTMP)

Transcript Tax Monitor includes a **shared diagnostic dashboard** used by both taxpayers and professionals.

Capabilities include:

* transcript upload and analysis
* transcript job history
* transcript result viewing
* transcript token usage
* transcript issue detection summaries

Example canonical records:

```
/r2/transcript_jobs/{job_id}.json
/r2/transcript_results/{result_id}.json
```

The dashboard allows users to monitor the status and results of transcript analysis operations.

---

# Cross-Platform Data Flow

The ecosystem functions as a discovery loop.

```
Tax Tools Arcade
→ generates discovery traffic

Transcript Tax Monitor
→ provides diagnostics

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

R2 serves as the **source of truth**.

---

## D1 (Query Layer)

D1 supports:

* analytics aggregation
* dashboard queries
* directory filtering
* membership lookups
* search queries

---

# Repository Structure

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Descriptions:

* `/app` authenticated dashboards
* `/assets` shared resources
* `/contracts` API schemas
* `/pages` workflow pages
* `/partials` reusable UI components
* `/site` marketing pages
* `/workers` Cloudflare Worker APIs

---

# Environment Setup

Required software:

* Git
* Node.js
* Wrangler CLI

Setup steps:

```
1 clone repository
2 configure environment variables
3 install dependencies
4 run local worker environment
```

---

# Deployment

Deployment occurs through **Cloudflare Workers**.

```
wrangler deploy
```

The `wrangler.toml` file defines:

* compatibility date
* environment variables
* R2 bucket bindings

---

# Contracts or Data Model

All APIs use **contract-driven validation**.

Contracts define relationships between:

* UI pages
* Worker routes
* R2 canonical storage
* D1 index tables

Every request must pass validation before modifying canonical records.

---

# Development Standards

Standards include:

* alphabetical route documentation
* canonical Worker headers
* contract-first APIs
* deny-by-default routing

---

# Integrations

External integrations include:

* Cal.com scheduling
* Cloudflare infrastructure
* Google OAuth
* magic-link authentication
* Stripe subscriptions

---

# Security and Secrets

Secrets are managed using **Wrangler secret management**.

Examples include:

* OAuth secrets
* webhook signing secrets
* API tokens

Secrets must never be committed to the repository.

---

# Contribution Guidelines

Recommended workflow:

```
1 create branch
2 implement changes
3 test locally
4 submit pull request
```

---

# License

This repository is proprietary software owned and maintained by **Virtual Launch Pro**.

Unauthorized redistribution or modification is prohibited.
