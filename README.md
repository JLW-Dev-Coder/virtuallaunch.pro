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

Virtual Launch Pro (VLP) is the membership and infrastructure platform that powers the Tax Monitor ecosystem. It manages professional memberships, dashboards, token systems, and profile publishing used across the network of tax‑focused tools and directories.

The platform acts as the operational core for the ecosystem, while public discovery and tools operate on separate sites.

Core responsibilities of VLP include:

* membership management
* professional profile publishing
* token allocation and balance tracking
* authenticated professional dashboards
* infrastructure for cross‑site data access

The system is built using a contract‑driven architecture running on Cloudflare Workers with R2 storage as the canonical data layer.

---

# 1. Overview

Virtual Launch Pro provides the operational backbone for a network of tax professional tools and discovery platforms.

The platform enables professionals to:

* publish structured public profiles
* receive taxpayer leads
* access specialized tools
* manage token usage
* manage memberships

Rather than operating as a case‑management system, the ecosystem focuses on **discovery, tooling, and infrastructure** for tax professionals.

The platform separates responsibilities across several sites to keep complexity manageable while allowing shared data access.

---

# 2. Key Features

Major capabilities of the platform include:

* authentication and session management
* contract‑driven API architecture
* lead generation infrastructure
* professional network listings
* tax tool token system
* transcript token system
* membership billing
* R2‑based canonical data storage

The system enables professionals to participate in the ecosystem while maintaining clear separation between tools, directories, and membership infrastructure.

---

# 3. Architecture Overview

Virtual Launch Pro is built around a worker‑centric architecture where API logic runs at the edge using Cloudflare Workers.

Core architectural principles include:

* canonical storage in R2
* deny‑by‑default API routing
* contract‑driven request validation
* stateless workers
* cross‑site data consumption through APIs

Primary components include:

* Cloudflare Workers for API execution
* D1 database for filtering and search indexes
* R2 for canonical records
* static front‑end applications
* webhook ingestion pipelines

All write operations are validated through contracts before canonical storage is updated.

---

# 4. Ecosystem Overview

Virtual Launch Pro operates as the infrastructure layer for several connected products.

### Virtual Launch Pro (VLP)

Responsibilities:

* canonical professional records
* membership management
* operator dashboard
* professional dashboards
* profile builder
* token balances

### TaxMonitor.pro (TM)

Responsibilities:

* tax professional directory
* public profile display
* taxpayer discovery
* intake and lead generation

### Tax Tools Arcade (TTTM)

Responsibilities:

* interactive tax tools
* token consumption for tools

### Transcript Tax Monitor (TTM)

Responsibilities:

* transcript analysis tools
* transcript token usage

Data flows between these sites through Worker APIs while canonical records remain stored in R2. D1 is used as a query and indexing layer to support fast filtering, searching, and dashboard queries across canonical records.

---

# 5. Repository Structure

The repository follows a modular layout that separates application interfaces, static assets, and worker logic.

Example directory structure:

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Directory descriptions:

* /app – authenticated application interfaces
* /assets – shared visual and static resources
* /contracts – JSON data contracts and schemas
* /pages – onboarding and workflow page templates
* /partials – reusable UI components
* /site – marketing and public pages
* /workers – Cloudflare Worker APIs

---

# 6. Environment Setup

Local development requires several tools and dependencies.

Required software:

* Git
* Node.js
* Wrangler CLI

Basic setup process:

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Start the worker development environment

Wrangler is used to run the worker locally and deploy updates.

---

# 7. Deployment

Deployment is handled through Cloudflare Workers using Wrangler.

Key deployment components include:

* Cloudflare account configuration
* R2 storage bindings
* Wrangler configuration file

The worker configuration is defined in `wrangler.toml` and includes:

* compatibility date
* environment variables
* R2 bucket bindings

Deployment command:

```
wrangler deploy
```

---

# 8. Contracts or Data Model

Virtual Launch Pro uses a contract‑driven architecture.

Contracts define the agreement between:

* page UI
* Worker API
* canonical storage (R2)
* query and search layer (D1)

Contracts specify:

* endpoint and HTTP method
* required payload fields
* validation rules
* canonical storage path
* response structure

Canonical records are written to **R2**, which serves as the authoritative data store for the ecosystem.

After canonical writes occur, Workers update **D1 query indexes** used for:

* directory filtering
* search queries
* dashboard summaries
* analytics and aggregation

Typical write pipeline:

1. request received
2. contract validation
3. receipt stored in R2
4. canonical record updated in R2
5. D1 query index updated
6. response returned to client

This separation ensures:

* R2 remains the **source of truth**
* D1 provides **fast filtering and search**
* Workers enforce **contract integrity**

This approach keeps data consistent across all connected sites while allowing fast queries without scanning large JSON records.

---

# 9. Development Standards

To maintain consistency across the repository, several development standards are enforced.

Key standards include:

* canonical Worker comment headers
* contract‑first API design
* deny‑by‑default routing
* alphabetical route documentation

Worker files should include standardized headers describing:

* domain
* supported routes
* environment requirements

---

# 10. Integrations

Virtual Launch Pro integrates with external systems required for authentication, scheduling, and billing.

Primary integrations include:

* Cal.com OAuth scheduling
* Cloudflare infrastructure
* Google OAuth login
* magic link authentication
* Stripe subscription billing

These services enable scheduling, payments, authentication, and infrastructure hosting across the ecosystem.

---

# 11. Security and Secrets

Sensitive configuration is handled through environment variables and Cloudflare secret storage.

Examples include:

* API tokens
* OAuth client secrets
* webhook signing secrets

Secrets are stored using Wrangler secret management and must never be committed to the repository.

---

# 12. Contribution Guidelines

Development within the repository should follow structured version control practices.

Recommended workflow:

1. create a branch
2. implement changes
3. test locally
4. submit pull request

Changes should preserve architectural contracts and repository structure.

---

# 13. License

This repository is proprietary software owned and maintained by Virtual Launch Pro.

Unauthorized redistribution or modification is not permitted.

---

# Summary

Virtual Launch Pro serves as the infrastructure and membership platform for a network of tax professional tools and discovery services. By combining contract‑driven APIs, Cloudflare edge infrastructure, and canonical R2 storage, the platform provides a scalable foundation for professional discovery, lead generation, and specialized tax tooling.
