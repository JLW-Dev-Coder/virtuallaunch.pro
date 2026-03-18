# BLOG.md — Virtual Launch Pro

Defines the structure, rules, and publishing workflow for all Virtual Launch Pro blog articles.

The goal is consistency across:

* article layout
* SEO structure
* ecosystem messaging
* build integration
* manifest generation
* platform alignment

This document reflects the **canonical article standard aligned with the current VLP architecture and build system**.

---

# Table of Contents

1. Build and Architecture Alignment
2. Purpose of the Blog
3. Audience
4. Core Market Problems
5. Canonical Article Structure
6. Required HTML Template
7. Article Writing Structure
8. Tone and Voice
9. Ecosystem Integration
10. Sources and Citation Rules
11. SEO and Filename Rules
12. Manifest Integration
13. Build Integration
14. QA Checklist
15. Canonical Initial Article Set

---

# 1. Build and Architecture Alignment

The blog is part of the **VLP static build system** and must follow the same architectural rules defined in the canonical README. 

Non-negotiable rules:

* articles are **static HTML files**
* articles are **content-only documents**
* layout is injected via **partials**
* build system performs **fragment injection**
* filenames are **machine-validated**
* blog metadata is **parsed programmatically**

Canonical principle:

```txt
Content files must not contain system logic.
```

The blog participates in:

* `build.mjs`
* `scripts/blog-manifest.mjs`
* partial injection system

---

# 2. Purpose of the Blog

The VLP blog exists to:

* educate tax professionals about structural problems in modern tax practices
* demonstrate how the **VLP ecosystem** solves those problems
* attract professionals researching:

  * tax practice growth
  * recurring revenue models
  * IRS monitoring services
  * transcript diagnostics
  * modern virtual tax practices

Core narrative:

```txt
Expertise does not create infrastructure.
Infrastructure creates scalable revenue.
```

Virtual Launch Pro provides that infrastructure.

---

# 3. Audience

Primary:

* Certified Public Accountants (CPAs)
* Enrolled Agents (EAs)
* Tax attorneys

Secondary:

* Bookkeepers expanding into tax
* Fractional finance professionals
* Solo accounting firms
* Virtual tax practices

Audience characteristics:

* analytically strong
* operationally constrained
* referral dependent
* system-light

The blog speaks to **experienced professionals**, not beginners.

---

# 4. Core Market Problems

Articles must anchor to structural issues.

Alphabetical examples:

* fragmented marketing systems
* manual onboarding workflows
* reactive tax resolution work
* referral-only acquisition
* seasonal revenue dependence
* weak service packaging

Each article must explain:

1. why the problem exists
2. why common solutions fail
3. how the ecosystem resolves it

---

# 5. Canonical Article Structure

The **HTML template is the source of truth**.

Articles must:

* include only **content**
* rely on **partials for layout**
* avoid duplicating system UI

---

## Layout responsibility

| Component      | Source                      |
| -------------- | --------------------------- |
| Article footer | `blogArticleFooter` partial |
| Article header | `blogArticleHeader` partial |
| Article body   | article HTML                |
| Header         | `siteHeader` partial        |
| Site footer    | `siteFooter` partial        |

---

# 6. Required HTML Template

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

# 7. Article Writing Structure

Articles follow a teaching model:

1. introduction
2. problem explanation
3. market insight
4. solution explanation
5. ecosystem explanation
6. strategic takeaway

Guidelines:

* paragraphs carry meaning
* clarity over cleverness
* no filler sections

Avoid:

* excessive bullet lists
* hype language
* vague abstractions

---

# 8. Tone and Voice

Voice:

```txt
A practitioner explaining systems, not a marketer selling features.
```

Characteristics:

* analytical
* calm
* credible
* structured

Avoid:

* exaggerated claims
* startup tone
* aggressive persuasion

---

# 9. Ecosystem Integration

Articles must reinforce the **four-platform system**.

Alphabetical platform roles:

| Platform           | Role                              |
| ------------------ | --------------------------------- |
| Tax Monitor        | monitoring services and discovery |
| Tax Tools Arcade   | education and traffic generation  |
| Transcripts        | diagnostics and analysis          |
| Virtual Launch Pro | infrastructure and operations     |

System loop:

```txt
Tax Tools Arcade
→ Transcripts
→ Tax Monitor
→ Virtual Launch Pro
```

Critical rule:

```txt
Do not pitch tools.
Explain system behavior.
```

---

# 10. Sources and Citation Rules

Each article must include **2–3 credible sources**.

Preferred sources:

* AICPA
* GAO
* IRS
* Journal of Accountancy
* NAEA
* Thomson Reuters Institute

---

## Citation format

Inline:

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

---

# 11. SEO and Filename Rules

Pattern:

```
YYYY-MM-DD_###_slug.html
```

Example:

```
2026-03-09_002_why-tax-professionals-need-more-than-referrals-to-grow.html
```

---

## Slug rules

* descriptive
* hyphen-separated
* lowercase

---

# 12. Manifest Integration

`scripts/blog-manifest.mjs` must:

* parse filename
* validate structure
* validate metadata
* generate URLs

Regex:

```
^(\d{4}-\d{2}-\d{2})_(\d{3})_([a-z0-9-]+)\.html$
```

Sorting:

1. date descending
2. sequence descending
3. slug alphabetical

---

# 13. Build Integration

`build.mjs` performs:

* fragment injection
* manifest generation
* partial injection
* static output

Generated fragments:

```
blog/.generated/featured.html
blog/.generated/list.html
blog/.generated/recent3.html
```

Placeholders:

```
<!-- BLOG:featured -->
<!-- BLOG:list -->
<!-- BLOG:recent3 -->
```

Usage:

| Page       | Fragment      |
| ---------- | ------------- |
| blog index | BLOG:featured |
| blog index | BLOG:list     |
| homepage   | BLOG:recent3  |

Articles **never render cards directly**.

---

# 14. QA Checklist

Before publishing:

* article aligns with real ecosystem behavior
* ecosystem explanation exists
* filename matches pattern
* filename date matches metadata
* metadata block is valid JSON
* citations present
* partials render correctly
* no inline CSS
* no layout duplication

---

# 15. Canonical Initial Article Set

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

These establish the **narrative foundation and publishing pattern**.