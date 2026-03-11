Your existing spec drifted away from the **actual article template** you’re using (the canvas file). It still required newsletter blocks, CTAs, and related reading that now live in **partials**. Humans invent duplication faster than they remove it.

Below is a **clean, non-redundant full replacement for `BLOG.md`** aligned with:

* your **canvas article template**
* your **build system**
* your **manifest generator**
* your **partials architecture**

Nothing in here asks authors to create content that the build system already injects.

---

# BLOG.md — Virtual Launch Pro

Defines the structure, rules, and publishing workflow for all Virtual Launch Pro blog articles.

The goal is consistency across:

* article layout
* SEO structure
* ecosystem messaging
* build integration
* manifest generation

This document reflects the **current canonical article template** used by the site build system.

---

# Table of Contents

1. Purpose of the Blog
2. Audience
3. Core Market Problems
4. Canonical Article Structure
5. Required HTML Template
6. Article Writing Structure
7. Tone and Voice
8. Ecosystem Integration
9. Sources and Citation Rules
10. SEO and Filename Rules
11. Manifest Integration
12. Build Integration
13. QA Checklist
14. Canonical Initial Article Set

---

# 1. Purpose of the Blog

The VLP blog exists to:

* educate tax professionals about structural problems in modern tax practices
* demonstrate how the **VLP ecosystem** solves those problems
* attract professionals researching

  * tax practice growth
  * recurring revenue models
  * IRS monitoring services
  * transcript diagnostics
  * modern virtual tax practices

The blog should gradually lead readers to understand:

**Expertise alone does not create growth infrastructure.**

Virtual Launch Pro provides that infrastructure.

---

# 2. Audience

Articles assume readers are professionals.

Primary:

* Certified Public Accountants (CPAs)
* Enrolled Agents (EAs)
* Tax attorneys

Secondary:

* Bookkeepers expanding into tax
* Fractional finance professionals
* Solo accounting firms
* Virtual tax practices

Typical characteristics:

* technically strong
* infrastructure weak
* referral dependent
* small firm operators

The blog speaks to **professionals, not beginners**.

---

# 3. Core Market Problems

Articles should connect to one or more structural issues.

Examples:

* fragmented marketing systems
* manual onboarding workflows
* reactive tax resolution work
* referral-only client acquisition
* seasonal revenue dependence
* weak service packaging

Articles should explain:

1. why the problem exists
2. why common solutions fail
3. how the ecosystem solves it

---

# 4. Canonical Article Structure

The **HTML article template is the source of truth**.

Every article must match the structure used by the canvas article page.

Articles must **not embed layout components** that are provided by site partials.

---

## Layout responsibility

| Component      | Source                      |
| -------------- | --------------------------- |
| Header         | `siteHeader` partial        |
| Article intro  | `blogArticleHeader` partial |
| Article body   | article HTML                |
| Article footer | `blogArticleFooter` partial |
| Site footer    | `siteFooter` partial        |

Articles should contain **content only**.

---

# 5. Required HTML Template

All articles must follow this structure.

```html
<!doctype html>
<html lang="en">

<head>

<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<link rel="icon" href="/assets/favicon.svg" sizes="any">

<title>[Article Title] | Virtual Launch Pro</title>

<meta name="description" content="[Article description]">

<meta property="og:title" content="[Article Title] | Virtual Launch Pro">
<meta property="og:description" content="[Open Graph description]">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">

<script type="application/json" id="blog-meta">
{
"title": "...",
"description": "...",
"category": "...",
"date": "YYYY-MM-DD",
"readTime": "X min read",
"author": "JLW",
"authorRole": "EA turned agency builder"
}
</script>

<link rel="stylesheet" href="/assets/blog/css/blog-article.css">

<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>

</head>

<body>

<div id="app">

<!-- PARTIAL:siteHeader -->

<main id="top">

<article>

<div class="reveal">
<!-- PARTIAL:blogArticleHeader -->
</div>

[article body]

[Sources section]

</article>

<div class="reveal">
<!-- PARTIAL:blogArticleFooter -->
</div>

</main>

<!-- PARTIAL:siteFooter -->

</div>

</body>
</html>
```

---

# 6. Article Writing Structure

The body should follow a clear teaching format.

Typical flow:

1. introduction
2. problem explanation
3. market insight
4. solution explanation
5. ecosystem explanation
6. strategic takeaway

Paragraphs should do most of the work.

Avoid:

* excessive bullet lists
* marketing language
* hype tone

---

# 7. Tone and Voice

Tone should feel like:

**a tax professional explaining industry mechanics.**

Characteristics:

* analytical
* calm
* credible
* practical

Avoid:

* aggressive marketing
* exaggerated claims
* startup hype language

Readers should feel they are reading **industry insight**, not marketing copy.

---

# 8. Ecosystem Integration

Articles should reinforce the **four-platform ecosystem**.

Alphabetical platform roles:

| Platform           | Role                                           |
| ------------------ | ---------------------------------------------- |
| Tax Monitor        | monitoring services and professional discovery |
| Tax Tools Arcade   | taxpayer education and discovery traffic       |
| Transcripts        | transcript diagnostics                         |
| Virtual Launch Pro | professional infrastructure                    |

The system works as a loop:

```
Tax Tools Arcade
→ Transcripts
→ Tax Monitor
→ Virtual Launch Pro
```

Articles should help readers understand this **gradually through examples**.

---

# 9. Sources and Citation Rules

Each article must include **2–3 credible sources**.

Preferred sources:

* AICPA
* GAO
* IRS
* Journal of Accountancy
* NAEA
* Thomson Reuters Institute

Sources must support:

* industry trends
* firm operations
* technology adoption
* practitioner behavior

---

## Citation format

Inline citation:

```
sentence text<sup><a href="#ref1">1</a></sup>
```

Sources section:

```
<h2>Sources</h2>

<p id="ref1"><sup>1</sup> Source text.</p>
<p id="ref2"><sup>2</sup> Source text.</p>
<p id="ref3"><sup>3</sup> Source text.</p>
```

Sources must include:

* organization
* publication
* year when available

---

# 10. SEO and Filename Rules

Source files must follow the canonical filename pattern.

```
YYYY-MM-DD_###_slug.html
```

Example:

```
2026-03-09_002_why-tax-professionals-need-more-than-referrals-to-grow.html
```

---

## Filename components

| Segment    | Meaning          |
| ---------- | ---------------- |
| YYYY-MM-DD | publication date |
| ###        | sequence number  |
| slug       | article slug     |

---

## Slug rules

Slugs must be:

* lowercase
* hyphen separated
* descriptive

Example:

```
why-tax-professionals-rely-on-referrals
```

---

# 11. Manifest Integration

`scripts/blog-manifest.mjs` must:

* parse date from filename
* parse sequence from filename
* parse slug from filename
* validate filename pattern
* validate `blog-meta.date`
* generate `post.url`

Parser regex:

```
^(\d{4}-\d{2}-\d{2})_(\d{3})_([a-z0-9-]+)\.html$
```

Manifest object example:

```
{
"title": "...",
"description": "...",
"category": "...",
"date": "2026-03-18",
"sequence": 11,
"slug": "why-tax-professionals-struggle-with-marketing-infrastructure",
"file": "2026-03-18_011_why-tax-professionals-struggle-with-marketing-infrastructure.html",
"url": "/blog/why-tax-professionals-struggle-with-marketing-infrastructure.html"
}
```

Sorting order:

1. date descending
2. sequence descending
3. slug alphabetical

---

# 12. Build Integration

`build.mjs` performs:

* blog manifest generation
* blog fragment injection
* partial injection
* HTML build output

Generated blog fragments:

```
blog/.generated/featured.html
blog/.generated/list.html
blog/.generated/recent3.html
```

Fragment placeholders:

```
<!-- BLOG:featured -->
<!-- BLOG:list -->
<!-- BLOG:recent3 -->
```

Used by:

| Page       | Fragment      |
| ---------- | ------------- |
| homepage   | BLOG:recent3  |
| blog index | BLOG:featured |
| blog index | BLOG:list     |

Article pages themselves **do not render cards**.

---

# 13. QA Checklist

Before publishing verify:

* article solves a real industry problem
* ecosystem explanation exists
* citations present
* `blog-meta` block valid
* filename matches pattern
* filename date matches metadata date
* article renders correctly with partials
* no inline CSS blocks exist

---

# 14. Canonical Initial Article Set

```
2026-03-08_001_why-tax-professionals-stay-stuck-in-referral-only-growth.html
2026-03-09_002_why-tax-professionals-need-more-than-referrals-to-grow.html
2026-03-10_003_how-structured-onboarding-changes-the-client-experience.html
2026-03-11_004_why-recurring-monitoring-is-a-better-fit-than-seasonal-dependence.html
2026-03-12_005_why-service-packaging-matters-in-tax-practices.html
2026-03-13_006_why-tax-monitoring-is-becoming-a-core-tax-service.html
2026-03-14_007_monitoring-clients-before-tax-resolution.html
2026-03-15_008_how-transcript-analysis-creates-consulting-revenue.html
2026-03-16_009_how-tax-tools-arcade-attracts-taxpayers-before-they-hire-a-professional.html
2026-03-17_010_how-the-vlp-ecosystem-turns-expertise-into-recurring-tax-practice-revenue.html
2026-03-18_011_why-tax-professionals-struggle-with-marketing-infrastructure.html
```

These establish the initial **VLP narrative arc** and publishing pattern.

---

If you want, I can also produce a **10-line “new article starter template”** writers can paste into a new file so nobody accidentally breaks your build system again.
