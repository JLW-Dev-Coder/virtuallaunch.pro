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

  * [Cal.com Scheduling Integration](#calcom-scheduling-integration)
  * [Stripe Integration](#stripe-integration)
  * [Support Ticket System](#support-ticket-system)
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

The ecosystem guides users from:

```
tax education
→ diagnostics
→ professional discovery
→ professional infrastructure
```

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

Canonical storage:

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_accounts/{account_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

---

## Tax Tools Arcade (TTTMP)

Tax Tools Arcade provides **interactive tax education tools**.

Responsibilities:

* discovery traffic generation
* educational tax calculators
* token-based tool execution

Canonical storage:

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

---

## Transcript Tax Monitor (TTMP)

Transcript Tax Monitor provides **transcript diagnostics and analysis services**.

Responsibilities:

* transcript diagnostics
* transcript analysis automation
* transcript dashboards
* transcript token processing

Canonical storage:

```
/r2/transcript_jobs/{job_id}.json
/r2/transcript_results/{result_id}.json
```

---

## Virtual Launch Pro (VLP)

Virtual Launch Pro is the **professional infrastructure platform**.

Responsibilities:

* professional dashboards
* professional profiles
* booking infrastructure
* membership management
* token balances
* support systems

Canonical storage:

```
/r2/bookings/{booking_id}.json
/r2/memberships/{membership_id}.json
/r2/professionals/{professional_id}.json
/r2/profiles/{professional_id}.json
/r2/support_tickets/{ticket_id}.json
/r2/tokens/{account_id}.json
```

---

# Dashboards

The ecosystem contains three authenticated dashboards.

---

## Professional Dashboard (VLP)

Used by tax professionals.

Capabilities include:

* booking analytics
* professional profile management
* scheduling integration
* support tickets
* token balances
* tool access

Example profile field:

```
cal_booking_url
```

---

## Taxpayer Dashboard (TMP)

Used by taxpayers.

Capabilities include:

* inquiry history
* taxpayer memberships
* transcript job tracking
* tool usage history
* token balances

---

## Transcript Dashboard (TTMP)

Shared diagnostic dashboard.

Capabilities include:

* transcript upload
* transcript analysis
* transcript job tracking
* transcript token usage
* issue detection summaries

---

# Cross-Platform Data Flow

The ecosystem operates as a discovery loop.

```
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

# Data Storage Architecture

## R2 (Canonical Storage)

```
tm-canonical
ttm-canonical
tttm-canonical
vlp-canonical
```

R2 is the **source of truth**.

---

## D1 (Query Layer)

D1 supports:

* analytics
* directory queries
* dashboard queries
* search filtering
* membership lookup

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
* R2 bindings
* D1 bindings

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

Workers must document inbound routes and invariants clearly.

---

# Integrations

Every repository in the ecosystem must implement three operational integrations.

These integrations are considered **core infrastructure responsibilities**.

---

## Cal.com Scheduling Integration

Used for professional booking infrastructure.

Responsibilities:

* schedule consultation sessions
* generate booking links
* attach scheduling URLs to professional profiles
* store booking events in canonical records

Example profile field:

```
cal_booking_url
```

Example record:

```
{
  "professional_id": "pro_48321",
  "cal_booking_url": "https://cal.com/janesmith/tax-consult"
}
```

---

## Stripe Integration

Stripe powers **membership billing and payments**.

Capabilities include:

* subscription management
* checkout sessions
* webhook processing
* token purchases
* membership upgrades

Typical worker routes:

```
POST /v1/checkout/sessions
GET  /v1/checkout/status
POST /v1/webhooks/stripe
```

All billing events must update **canonical R2 records before projection**.

---

## Support Ticket System

Each platform must support **support ticket creation and tracking**.

Responsibilities:

* ticket submission
* ticket retrieval
* ticket status updates
* support dashboard visibility

Canonical storage:

```
/r2/support_tickets/{ticket_id}.json
```

Typical routes:

```
GET  /v1/support/tickets/{ticket_id}
GET  /v1/support/tickets/by-account/{account_id}
PATCH /v1/support/tickets/{ticket_id}
POST /v1/support/tickets
```

Support tickets allow users to request help across the ecosystem.

---

# Security and Secrets

Secrets are managed using **Wrangler secret management**.

Examples include:

* OAuth credentials
* Stripe webhook secrets
* API tokens
* email service credentials

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

All pull requests must respect:

* contract schemas
* worker route documentation
* canonical storage rules

---

# License

This repository is proprietary software owned and maintained by **Virtual Launch Pro**.

Unauthorized redistribution or modification is prohibited.

---
