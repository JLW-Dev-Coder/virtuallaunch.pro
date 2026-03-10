# BLOG.md - Virtual Launch Pro

This document defines the structure, tone, targeting, and technical rules for every article published on the Virtual Launch Pro blog.

This version replaces the earlier agency‑themed spec and aligns blog production with the **VLP market thesis and Tax Monitor ecosystem**.

---

# Table of Contents

* [1. Purpose of the Blog](#1-purpose-of-the-blog)
* [2. Primary Audience](#2-primary-audience)
* [3. Core Market Problems (Content Anchors)](#3-core-market-problems-content-anchors)
* [4. Article Structure](#4-article-structure)
* [5. Tone & Voice](#5-tone--voice)
* [6. Content Themes](#6-content-themes)
* [7. Ecosystem Integration Rules](#7-ecosystem-integration-rules)
* [7.1 Ecosystem Problem → Solution Demonstration](#71-ecosystem-problem--solution-demonstration)
* [8. Teaser Card Specification](#8-teaser-card-specification)
* [9. SEO Guidelines](#9-seo-guidelines)
* [10. Sources and References](#10-sources-and-references)
* [11. QA Checklist](#11-qa-checklist)
* [12. Initial Canonical Article Set](#12-initial-canonical-article-set)

---

# 1. Purpose of the Blog

The VLP blog exists to:

* Educate **tax professionals** about structural problems in modern tax practices
* Demonstrate how **Virtual Launch Pro + Tax Monitor ecosystem** solves those problems
* Attract professionals researching:

  * tax practice growth
  * recurring revenue models
  * IRS monitoring services
  * transcript analysis
  * modern virtual tax practices

Articles should move readers toward understanding that:

**expertise alone does not create growth infrastructure.**

Virtual Launch Pro provides that infrastructure.

---

# 2. Primary Audience

Every article must assume the reader is one of the following:

Primary professionals:

* Certified Public Accountants (CPAs)
* Enrolled Agents (EAs)
* Tax attorneys

Secondary professionals:

* Bookkeepers expanding into tax services
* Fractional finance professionals
* Solo accounting practice owners
* Modern virtual accounting firms

These readers typically:

* understand tax law
* struggle with marketing infrastructure
* rely heavily on referrals
* operate small or solo practices

The blog should speak **to professionals, not beginners**.

---

# 3. Core Market Problems (Content Anchors)

Most articles should connect to one or more of the following structural problems:

* Client acquisition dependent on referrals
* Fragmented marketing systems
* Manual onboarding workflows
* Weak service packaging
* Seasonal tax preparation revenue
* Tax resolution becoming the default offer

Articles should explain:

1. Why the problem exists
2. Why most solutions fail
3. How VLP + TM ecosystem solves it

---

# 4. Article Structure

Articles must follow the **canonical VLP article file structure**. The canonical HTML article is the source of truth for layout, metadata, references, related reading, newsletter, CTA, and partial usage.

Every article must include a machine-readable **`blog-meta`** script inside the `<head>` so `blog-manifest.mjs` can parse the article automatically.

Articles should follow a clean teaching structure.

```
Title
Subtitle
Intro
Problem explanation
Market insight
Solution explanation
Ecosystem explanation
Conclusion
CTA
```

### HTML Structure

```html
<!doctype html>
<html lang="en">
 <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>[Article Title] | Virtual Launch Pro</title>
  <meta name="description" content="[Article description]">
  <meta property="og:title" content="[Article Title] | Virtual Launch Pro">
  <meta property="og:description" content="[Open Graph description]">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/json" id="blog-meta">
    {
      "title": "[Article title]",
      "description": "[Article description]",
      "category": "[Market | Distribution | Operations | Monitoring | Ecosystem]",
      "date": "YYYY-MM-DD",
      "readTime": "X min read",
      "author": "JLW",
      "authorRole": "EA turned agency builder"
    }
  </script>
 </head>
 <body>
  <!-- PARTIAL:siteHeader -->
  <main id="top" class="flex-1">
    <article>
      [Article header]
      [Article body]
      [Sources]
      [Author footer]
    </article>
    [Related reading]
    [Newsletter]
    [CTA]
  </main>
  <!-- PARTIAL:siteFooter -->
 </body>
</html>
```

Rules:

* Every article must include a valid `<script type="application/json" id="blog-meta">` block in the `<head>`
* `blog-meta` is required for manifest generation and blog indexing
* Use **paragraph based teaching**
* Avoid long bullet lists
* Maintain clear section headers
* Include a **Sources** section at the bottom of the article body
* Include **Related reading**, **Newsletter**, and **CTA** sections after the main article
* Use `<!-- PARTIAL:siteHeader -->` and `<!-- PARTIAL:siteFooter -->` in every article file

---

# 5. Tone & Voice

Voice should reflect:

**Experienced tax professional building modern infrastructure.**

Tone characteristics:

* calm
* credible
* analytical
* practical

Avoid:

* hype language
* aggressive marketing tone
* exaggerated promises

Readers should feel they are reading **strategic insight from someone who understands the tax industry**.

---

# 6. Content Themes

Blog topics should fall into these categories:

## Market

Industry analysis and structural problems.

Examples:

* why tax professionals rely on referrals
* why seasonal revenue limits growth

## Distribution

How professionals get discovered by clients.

Examples:

* professional directories
* ecosystem discovery

## Operations

Workflow, onboarding, and delivery systems.

Examples:

* structured onboarding
* packaging services

## Monitoring

Recurring services built around IRS monitoring.

Examples:

* proactive monitoring
* transcript diagnostics

## Ecosystem

How the three platforms work together:

* Virtual Launch Pro
* Tax Monitor
* Transcripts
* Tax Tools

---

# 7. Ecosystem Integration Rules

Articles should reinforce how the **four components of the ecosystem work together** to solve the structural problems facing tax professionals.

Alphabetical platform roles:

* Tax Monitor → monitoring services and professional discovery
* Tax Tools Arcade → taxpayer education and discovery traffic
* Transcripts → transcript diagnostics and reports
* Virtual Launch Pro → professional infrastructure and service delivery

These components should be explained as a **single system**, not as isolated tools.

---

# 7.1 Ecosystem Problem → Solution Demonstration

Articles should demonstrate the full ecosystem flow whenever possible.

Typical market problem:

* Professionals rely on referrals
* Clients arrive late with IRS problems
* Services are reactive instead of proactive
* Revenue is seasonal

The ecosystem solves this through a structured path.

### Discovery Layer

Tax Tools Arcade attracts taxpayers researching IRS issues and tax questions.

Examples:

* transcript curiosity
* tax problem research
* interactive tax tools

These tools generate **organic discovery traffic** from taxpayers looking for answers.

---

### Diagnosis Layer

The Transcripts platform converts curiosity into **diagnostic insight**.

Professionals can:

* analyze IRS transcripts
* generate client reports
* identify compliance issues earlier

This creates a natural service entry point such as:

* transcript review consultation
* diagnostic report
* compliance discussion

---

### Service Layer

Tax Monitor enables **recurring monitoring relationships**.

Instead of waiting for a tax crisis, professionals can offer:

* ongoing IRS monitoring
* compliance tracking
* proactive tax oversight

This transforms one‑time engagements into **recurring service revenue**.

---

### Infrastructure Layer

Virtual Launch Pro provides the operational infrastructure for the professional.

VLP enables firms to:

* package services
* onboard clients cleanly
* present professional profiles
* manage service delivery

This layer converts discovery and diagnostics into **structured client relationships**.

---

### Ecosystem Loop

The ecosystem works as a continuous loop:

Tax Tools Arcade → taxpayer discovery
Transcripts → diagnosis and insight
Tax Monitor → monitoring services
Virtual Launch Pro → professional infrastructure

This structure turns **software engagement into professional client acquisition**.

Articles should help readers understand this system gradually through examples and explanations.

---

# 8. Teaser Card Specification

Each article should have a blog card version containing:

* title
* short summary
* category
* read time

Guidelines:

* keep summaries under 200 characters
* avoid clickbait
* emphasize professional insight

---

# 9. SEO Guidelines

## Canonical Filename System

The **filename is the source of truth** for:

* **date** → `YYYY-MM-DD`
* **order / index** → `###`
* **slug** → everything after the second underscore and before `.html`

Required filename pattern:

```txt
YYYY-MM-DD_###_slug.html
```

Example:

```txt
2026-03-08_001_why-tax-professionals-stay-stuck-in-referral-only-growth.html
```

This means the manifest script must parse the filename into:

* `dateFromFilename`
* `sequence`
* `slug`
* `file`
* `url`

The manifest must **not** treat the entire filename stem as the slug.

Incorrect:

```js
slug: path.parse(file).name
```

That would incorrectly produce a slug like:

```txt
2026-03-08_001_why-tax-professionals-stay-stuck-in-referral-only-growth
```

Instead, the manifest must extract:

* `date` from the first segment
* `sequence` from the second segment
* `slug` from the third segment onward

Recommended parser:

```js
const ARTICLE_FILE_RE = /^(\d{4}-\d{2}-\d{2})_(\d{3})_([a-z0-9-]+)\.html$/;
```

Recommended helper:

```js
function parseArticleFilename(file) {
  const match = file.match(ARTICLE_FILE_RE);

  if (!match) {
    throw new Error(
      `Invalid blog filename "${file}". Expected YYYY-MM-DD_###_slug.html`
    );
  }

  const [, date, sequence, slug] = match;

  return {
    date,
    file,
    sequence: Number(sequence),
    slug,
    url: `/blog/${slug}.html`,
  };
}
```

## Filename Validation Rules

The build system should validate:

* filename must match `YYYY-MM-DD_###_slug.html`
* filename date must match `blog-meta.date`
* slug must come from filename, not from `path.parse(file).name`
* slugs should remain unique across all published articles unless there is a deliberate reason to reuse one

## Manifest Data Model

The generated post object should look like:

```json
{
  "author": "JLW",
  "authorRole": "EA turned agency builder",
  "category": "Market",
  "date": "2026-03-18",
  "description": "...",
  "file": "2026-03-18_011_why-tax-professionals-struggle-with-marketing-infrastructure.html",
  "readTime": "8 min read",
  "sequence": 11,
  "slug": "why-tax-professionals-struggle-with-marketing-infrastructure",
  "title": "Why Tax Professionals Struggle With Marketing Infrastructure",
  "url": "/blog/why-tax-professionals-struggle-with-marketing-infrastructure.html"
}
```

## Linking Rules

Generated links in:

* blog cards
* featured article cards
* homepage recent articles
* blog index articles
* related reading blocks

should use:

```js
post.url
```

Public URLs remain slug-based, while the repo source files remain date-sequenced and canonical.

## Sorting Rules

Canonical sorting should be:

1. `date` descending
2. `sequence` descending
3. `slug` as tie-breaker

Recommended sort logic:

```js
posts.sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.sequence !== b.sequence) return a.sequence < b.sequence ? 1 : -1;
  return a.slug.localeCompare(b.slug);
});
```

## Build Integration Rules

### scripts/blog-manifest.mjs

This file must:

* parse `date`, `sequence`, and `slug` from filename
* validate the canonical filename pattern
* validate that filename date matches `blog-meta.date`
* generate `file` and `url`
* build links with `post.url`
* sort by `date`, then `sequence`

### build.mjs

This file should remain the single build entrypoint.

It currently:

* imports `generateBlogManifest()` from `./scripts/blog-manifest.mjs`
* runs `generateBlogManifest()` before the rest of the build
* loads generated blog fragments from:

  * `blog/.generated/featured.html`
  * `blog/.generated/list.html`
  * `blog/.generated/recent3.html`
* injects blog fragments using `<!-- BLOG:featured -->`, `<!-- BLOG:list -->`, and `<!-- BLOG:recent3 -->`
* injects site partials using `<!-- PARTIAL:... -->`
* copies and transforms HTML across the build
* emits public slug-based blog article aliases during build output while preserving canonical source filenames in the repo

Build rules:

* source filenames stay canonical and date-sequenced
* generated article links should use `post.url`
* public article URLs should stay slug-based for cleaner routing
* use `post.file` for source-file operations where needed
* use `post.url` for rendered link generation

### index.html and blog/index.html

These pages should consume generated blog fragments and should not hardcode blog article URLs.

If they already consume generated markup, no manual card maintenance should be required.

### Current blog fragment placeholders

Use these exact placeholders:

```html
<!-- BLOG:featured -->
<!-- BLOG:list -->
<!-- BLOG:recent3 -->
```

`blog/index.html` should consume:

* `<!-- BLOG:featured -->`
* `<!-- BLOG:list -->`

The main homepage should consume:

* `<!-- BLOG:recent3 -->`

Every article should include:

* clear keyword topic
* structured headings
* clean slug

Example slug:

```
why-tax-professionals-rely-on-referrals
```

Example title:

```
Why Tax Professionals Stay Stuck in Referral‑Only Growth
```

---

# 10. Sources and References

Every article must include **at least 2 to 3 credible references** that support the claims made in the article.

Preferred sources for this blog include:

* AICPA & CIMA, 2022 CPA Firm Top Issues Survey results and analysis
* AICPA & CIMA, Tackling change in an uncertain environment, 2024 PCPS commentary
* GAO, Tax Gap: IRS Should Take Steps to Ensure Continued Improvement in Estimates, 2024
* Intuit QuickBooks, 2024 Accountant Technology Survey
* Intuit, Failure to Keep Pace with Technology Seen as Biggest Risk to Accounting Professionals, 2024
* IRS, Office of Professional Responsibility and Circular 230
* IRS, Transcript Delivery System (TDS)
* Journal of Accountancy, CAS practices see 20% growth
* Journal of Accountancy, Tips for providing the CAS services clients want
* Journal of Accountancy, Building a better CPA firm: Stepping up service offerings
* NAEA, How Enrolled Agents Can Thrive in an Uncertain 2026 Economy
* NAEA EA Journal, The Evolving Tax Profession: Technology, Artificial Intelligence, and the Future of Enrolled Agents
* Thomson Reuters Institute, 2024 State of Tax Professionals Report

### Citation Rules

Articles should reference sources using **superscript reference markers** placed directly after the relevant sentence.

Example:

```
Many independent tax professionals rely heavily on referrals for new business<sup><a href="#ref1">1</a></sup>.
```

The reference markers must link to a **Sources section at the bottom of the article**.

Example reference block:

```
<h2>Sources</h2>
<p id="ref1"><sup>1</sup> AICPA & CIMA, 2022 CPA Firm Top Issues Survey results and analysis.</p>
<p id="ref2"><sup>2</sup> Thomson Reuters Institute, 2024 State of Tax Professionals Report.</p>
<p id="ref3"><sup>3</sup> IRS, Transcript Delivery System (TDS).</p>
```

Rules:

* Minimum **2 sources**, preferred **3 sources** per article
* References must be **clickable** and jump to the bottom reference section
* Sources should support **industry structure, practitioner statistics, operations, technology adoption, or market behavior**
* Use sources from the approved list above whenever possible
* Avoid weak or generic sources such as random blogs, opinion posts, or unverified commentary
* Every source entry should identify the **organization/publication name**, the **report or article title**, and preferably the **year**

---

# 11. QA Checklist

Before publishing confirm:

* article addresses a real market problem
* VLP ecosystem explanation exists
* tone is professional
* sections are clearly structured
* title aligns with tax professional audience

---

# 12. Initial Canonical Article Set

The first articles should use the **date + sequence + slug** file naming system:

```txt
YYYY-MM-DD_###_slug.html
```

Initial article files:

* 2026-03-08_001_why-tax-professionals-stay-stuck-in-referral-only-growth.html
* 2026-03-09_002_why-tax-professionals-need-more-than-referrals-to-grow.html
* 2026-03-10_003_how-structured-onboarding-changes-the-client-experience.html
* 2026-03-11_004_why-recurring-monitoring-is-a-better-fit-than-seasonal-dependence.html
* 2026-03-12_005_why-service-packaging-matters-in-tax-practices.html
* 2026-03-13_006_why-tax-monitoring-is-becoming-a-core-tax-service.html
* 2026-03-14_007_monitoring-clients-before-tax-resolution.html
* 2026-03-15_008_how-transcript-analysis-creates-consulting-revenue.html
* 2026-03-16_009_how-tax-tools-arcade-attracts-taxpayers-before-they-hire-a-professional.html
* 2026-03-17_010_how-the-vlp-ecosystem-turns-expertise-into-recurring-tax-practice-revenue.html
* 2026-03-18_011_why-tax-professionals-struggle-with-marketing-infrastructure.html

These articles establish the **core VLP narrative** and the canonical publishing pattern for future posts.
