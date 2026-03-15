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
  * [Login Integrations](#login-integrations)
  * [Continue with Google](#continue-with-google)
  * [Magic Link](#magic-link)
  * [SSO (SAML / OIDC)](#sso-saml--oidc)
* [Notification Preferences](#notification-preferences)
  * [In-App Notifications](#in-app-notifications)
  * [Twilio SMS Integration (Coming Soon)](#twilio-sms-integration-coming-soon)
* [2FA Integration](#2fa-integration)
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

* professional directory on TMP
* taxpayer discovery through intake form and app
* taxpayer memberships (free, essential, plus, premier)
* service inquiry routing to tax professionals
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
* educational tax games
* token-based tool execution (10, 25, 100 packages)

Canonical storage:

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

---

## Transcript Tax Monitor (TTMP)

Transcript Tax Monitor provides **transcript diagnostics and analysis services**.

Responsibilities:

* transcript analysis automation tool
* transcript dashboards
* transcript diagnostics
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

* booking infrastructure
* professional dashboards
* professional profiles
* membership management
* support tickets
* token balances

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
* Cal.com calendar/scheduling integration
* membership management
* profile management
* support tickets
* token balances
* tool usage history
* transcript report history

---

## Taxpayer Dashboard (TMP)

Used by taxpayers.

Capabilities include:

* Cal.com calendar integration
* inquiry history
* membership management
* profile management (intake form)
* support tickets
* token balances
* tool usage history
* transcript report history

---

## Transcript Dashboard (TTMP)

Shared diagnostic dashboard.

Capabilities include:

* Cal.com calendar integration
* membership management
* support tickets
* token balances
* transcript parser tool
* transcript report history
* transcript token usage history

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

* schedule intro and support event types
* generate booking links
* attach scheduling URLs to professional profiles
* store booking events in canonical records
* OAuth to allow users to book, and cancel, reschedule in-app TTTMP, TMP, and VLP
* OAuth to allow tax pros to create or connect Cal.com to their profile

Canonical events:
BOOKING_*CREATED, BOOKING_CANCELLED, BOOKING*_RESCHEDULED

Canonical webhook endpoint:

```
https://transcript.taxmonitor.pro/transcript/stripe/webhook
```

Canonical worker routes:

```
GET   /v1/bookings/{booking_id}
GET   /v1/bookings/by-account/{account_id}
GET   /v1/bookings/by-professional/{professional_id}
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

* subscription management
* checkout sessions
* webhook processing
* token purchases
* membership upgrades

### Canonical events

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

### Canonical webhook endpoint

```
POST /v1/webhooks/stripe
```

### Canonical worker routes

```
GET  /v1/checkout/status
POST /v1/checkout/sessions
POST /v1/webhooks/stripe
```

All billing events must update **canonical R2 records before projection**.

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

```
AUTH_LOGIN_COMPLETED
GOOGLE_OAUTH_CALLBACK_COMPLETED
GOOGLE_OAUTH_STARTED
SESSION_CREATED
```

#### Canonical endpoints

```
GET /v1/auth/google/start
GET /v1/auth/google/callback
```

#### Canonical worker routes

```
GET  /v1/auth/session
GET  /v1/auth/google/callback
GET  /v1/auth/google/start
POST /v1/auth/logout
```

---

### Magic Link

Used for passwordless email sign-in.

#### Canonical events

```
AUTH_LOGIN_COMPLETED
MAGIC_LINK_REQUESTED
MAGIC_LINK_VERIFIED
SESSION_CREATED
```

#### Canonical endpoints

```
POST /v1/auth/magic-link/request
GET  /v1/auth/magic-link/verify
```

#### Canonical worker routes

```
GET  /v1/auth/magic-link/verify
GET  /v1/auth/session
POST /v1/auth/logout
POST /v1/auth/magic-link/request
```

---

### SSO (SAML / OIDC)

Used for organizational sign-in and identity federation.

#### Canonical events

```
AUTH_LOGIN_COMPLETED
SESSION_CREATED
SSO_OIDC_CALLBACK_COMPLETED
SSO_OIDC_STARTED
SSO_SAML_ASSERTION_CONSUMED
SSO_SAML_STARTED
```

#### Canonical endpoints

```
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/saml/start
POST /v1/auth/sso/saml/acs
```

#### Canonical worker routes

```
GET  /v1/auth/session
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/saml/start
POST /v1/auth/logout
POST /v1/auth/sso/saml/acs
```

---

## Google Email Integration

Used for sending and receiving email through Google Workspace / Gmail accounts.

### Canonical events

```
EMAIL_DELIVERY_FAILED
EMAIL_RECEIVED
EMAIL_SENT
GMAIL_PUSH_NOTIFICATION_RECEIVED
MAILBOX_SYNC_COMPLETED
```

### Canonical webhook endpoint

```
POST /v1/webhooks/google-email
```

### Canonical worker routes

```
GET  /v1/email/messages/{message_id}
GET  /v1/email/messages/by-account/{account_id}
POST /v1/email/send
POST /v1/webhooks/google-email
```

---

## Notification Preferences

Each repository must allow users to manage notification delivery preferences, including the ability to turn off in-app notifications and SMS notifications.

### In-App Notifications

Used for native product alerts inside TMP, TTMP, and VLP dashboards.

#### Canonical events

```
IN_APP_NOTIFICATION_CREATED
IN_APP_NOTIFICATION_DELIVERED
IN_APP_NOTIFICATION_DISMISSED
NOTIFICATION_PREFERENCES_UPDATED
```

#### Canonical webhook endpoint

```
None. In-app notifications are internal system events.
```

#### Canonical worker routes

```
GET   /v1/notifications/in-app
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/in-app
```

---

### Twilio SMS Integration (Coming Soon)

Used for SMS notification delivery and future account messaging workflows.

#### Canonical events

```
NOTIFICATION_PREFERENCES_UPDATED
SMS_DELIVERY_FAILED
SMS_NOTIFICATION_QUEUED
SMS_NOTIFICATION_SENT
TWILIO_STATUS_CALLBACK_RECEIVED
```

#### Canonical webhook endpoint

```
POST /v1/webhooks/twilio
```

#### Canonical worker routes

```
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/sms/send
POST  /v1/webhooks/twilio
```

---

## 2FA Integration

Used to allow users to enroll in, verify, and disable two-factor authentication.

### Canonical events

```
TWO_FA_DISABLED
TWO_FA_ENROLLMENT_STARTED
TWO_FA_ENROLLMENT_VERIFIED
TWO_FA_VERIFICATION_FAILED
TWO_FA_VERIFICATION_SUCCEEDED
```

### Canonical webhook endpoint

```
None. 2FA is handled through canonical worker routes.
```

### Canonical worker routes

```
GET   /v1/auth/2fa/status/{account_id}
POST  /v1/auth/2fa/enroll/init
POST  /v1/auth/2fa/enroll/verify
POST  /v1/auth/2fa/disable
POST  /v1/auth/2fa/challenge/verify
```

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

### Canonical events

```
SUPPORT_TICKET_CLOSED
SUPPORT_TICKET_CREATED
SUPPORT_TICKET_MESSAGE_ADDED
SUPPORT_TICKET_REOPENED
SUPPORT_TICKET_STATUS_UPDATED
```

### Canonical webhook endpoint

```
None. Support tickets are internal system events.
```

### Canonical worker routes

```
GET   /v1/support/tickets/{ticket_id}
GET   /v1/support/tickets/by-account/{account_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets
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
