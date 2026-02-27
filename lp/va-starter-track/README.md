# VA Starter Track Install

## Product Overview

**VA Starter Track — Monthly**
$1.99 USD / month

Payment Link:
[https://billing.taxmonitor.pro/b/fZu6oGcImaZk3k48z0aR206](https://billing.taxmonitor.pro/b/fZu6oGcImaZk3k48z0aR206)

Product ID:
`prod_U3fRQzFg676SLl`

Product Tax Code:
General – Services
`txcd_20030000`

Metadata:

* install: va_starter_track
* interval: monthly

---

## Product Description

The VA Starter Track Install gives you a professional landing page, an embedded booking calendar, and a clean setup workflow so clients can book you without DMs or chaos.

You’ll get:

* Branded page setup
* Booking integration
* Structured onboarding checklist
* Ongoing template improvements

As a bonus, your page can be listed in a public VA directory so you’re easier to find online.

---

## Marketing Feature List

Alphabetical:

* Booking calendar embed
* Directory listing
* Landing page install
* Support (basic)
* Updates included
* Workflow starter checklist

---

# Public Demo

Demo Booking URL:
[https://cal.com/tax-monitor-pro/va-starter-track-demo](https://cal.com/tax-monitor-pro/va-starter-track-demo)

Inline Embed Used:

```
https://app.cal.com/embed/embed.js
```

Purpose of demo:

> A quick demo of how a SEO landing page, booking embed, directory listing, and support system can help you get hired.

---

# Landing Page Behavior

## What Was Removed

* All SuiteDash JS embeds
* All SuiteDash iframe height CSS

  * `.vlp-signup-embed`
  * `#invite` iframe min-height rules
  * `#checkout` iframe min-height rules

## What Replaced It

Alphabetical:

* Book a demo → Cal.com embed
* Buy now → Stripe Payment Link ($1.99/month)

The page now sells a single install product instead of invite + activation flows.

---

# Coming Soon Installs

Landing page includes placeholder cards for:

* Tax Monitor Setup (Coming soon)
* VA Agency Setup (Coming soon)
* VA Starter Track Install (Available now)

---

# Cal Affiliate Placement

Affiliate link:
[https://refer.cal.com/tax-monitor-pro-wltn](https://refer.cal.com/tax-monitor-pro-wltn)

Placement rule:

* Do NOT show on public landing page.
* Show inside post-payment onboarding page under:

> “Create a free Cal.com account”

Copy:

> Need a free Cal.com account? Create one here.

---

# VA Directory Architecture

Goal:

* Easy to find online
* Immediate listing updates via Worker
* SEO indexable

## R2 Data Model

* `va/pages/{slug}.json`

  * name
  * title
  * tags
  * city
  * skills
  * calUrl
  * updatedAt
  * published (boolean)

* `va/directory/index.json`

  * list of published slugs
  * basic metadata for sorting

* `va/receipts/forms/{eventId}.json`

  * append-only submission ledger

---

## Worker Endpoints

Alphabetical:

### GET /directory

Returns rendered directory page or JSON list.

### GET /va/{slug}

Renders VA landing page from canonical JSON.

### POST /forms/va/publish

Flow:

1. Validate payload
2. Append receipt
3. Upsert canonical profile
4. Update directory index

---

## SEO Requirements

Alphabetical:

* Directory page links internally to every `/va/{slug}`
* Each VA page includes canonical URL + schema (Person / Service)
* `robots.txt` allows crawl
* `sitemap.xml` includes:

  * `/directory`
  * `/va/{slug}` entries

---

## Instant Update Flow

When VA edits or publishes:

1. Worker updates canonical JSON
2. Directory reads from `index.json`
3. Sitemap regenerates dynamically or via scheduled rebuild

No database required.

---

# Required UI Pages

To fully deliver this install, the following UI pages are required:

* Landing page (public SEO page)
* Profile template (public `/va/{slug}` page)
* Login page (`/app/login`)
* Dashboard page (`/app/dashboard`)
* Dashboard → View Analytics page
* Dashboard → Update My Profile page

---

# ClickUp Project Reference

Folder:
VA Starter Track
[https://app.clickup.com/8402511/v/f/90177070460/90170896661](https://app.clickup.com/8402511/v/f/90177070460/90170896661)

List:
Accounts
[https://app.clickup.com/8402511/v/li/901711473499](https://app.clickup.com/8402511/v/li/901711473499)

Project:
VA Starter Track Install — SaaS Landing + Directory + Booking Integration

---

# Final Architecture Model

Public Page
→ Demo embed
→ Stripe subscription

Post-Payment
→ Login
→ Dashboard
→ Connect Cal
→ Publish profile

Worker
→ Canonical R2 write
→ Directory update
→ SEO visibility

---

This README locks the scope, removes ambiguity, and keeps the install lean at $1.99/month.

If you want next, we can define:

* The dashboard wireframe
* The R2 canonical schema JSON example
* The ClickUp task breakdown for build execution
