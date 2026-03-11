// scripts/blog-manifest.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "blog");
const GENERATED_DIR = path.join(BLOG_DIR, ".generated");
const FOOTERS_DIR = path.join(GENERATED_DIR, "footers");
const POSTS_JSON = path.join(BLOG_DIR, "posts.json");
const ARTICLE_FILE_RE = /^(?:(\d{4}-\d{2}-\d{2})_(\d{3})_)?([a-z0-9-]+)\.html$/;

const REQUIRED_FIELDS = [
  "author",
  "authorRole",
  "category",
  "date",
  "description",
  "readTime",
  "title",
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p) {
  return await fs.readFile(p, "utf8");
}

async function writeText(p, content) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseArticleFilename(file, meta = null) {
  const match = file.match(ARTICLE_FILE_RE);

  if (!match) {
    throw new Error(
      `Invalid blog filename "${file}". Expected slug.html or YYYY-MM-DD_###_slug.html`
    );
  }

  const [, filenameDate, filenameSequence, slug] = match;
  const resolvedDate = filenameDate || meta?.date || null;

  if (!resolvedDate || !parseIsoDate(resolvedDate)) {
    throw new Error(
      `Missing valid date for "${file}". Provide blog-meta.date in YYYY-MM-DD format.`
    );
  }

  return {
    date: resolvedDate,
    file,
    sequence: filenameSequence ? Number(filenameSequence) : 0,
    slug,
    url: `/blog/${slug}.html`,
  };
}

function validateMeta(meta, file) {
  for (const field of REQUIRED_FIELDS) {
    if (!meta[field] || typeof meta[field] !== "string") {
      throw new Error(`Missing or invalid "${field}" in ${file}`);
    }
  }

  if (!parseIsoDate(meta.date)) {
    throw new Error(`Invalid "date" in ${file}. Expected YYYY-MM-DD`);
  }

  if (!/^\d+\s+min\s+read$/i.test(meta.readTime.trim())) {
    throw new Error(`Invalid "readTime" in ${file}. Expected like "8 min read"`);
  }
}

function extractBlogMeta(html, file) {
  const match = html.match(
    /<script\s+type="application\/json"\s+id="blog-meta">\s*([\s\S]*?)\s*<\/script>/i
  );

  if (!match) {
    throw new Error(`Missing <script type="application/json" id="blog-meta"> in ${file}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`Invalid blog-meta JSON in ${file}: ${err.message}`);
  }

  validateMeta(parsed, file);
  return parsed;
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/i);
  return match ? match[1].trim() : "";
}

function formatDisplayDate(isoDate) {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return isoDate;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsed);
}

function getAuthorInitials(author) {
  return String(author)
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getAuthorAvatarClasses() {
  return "bg-gradient-to-br from-brand-500 to-brand-600";
}

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

function getCategoryBadgeClasses(category, { active = false } = {}) {
  const key = normalizeCategory(category);
  const base = "category-badge inline-flex items-center gap-2";
  const activeClass = active ? " category-badge--active" : "";

  if (key === "distribution") {
    return `${base}${activeClass} border-amber-400/25 bg-amber-500/10 text-amber-200`;
  }

  if (key === "market") {
    return `${base}${activeClass} border-orange-400/25 bg-orange-500/10 text-orange-200`;
  }

  if (key === "monitoring") {
    return `${base}${activeClass} border-cyan-400/25 bg-cyan-500/10 text-cyan-200`;
  }

  if (key === "operations") {
    return `${base}${activeClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-200`;
  }

  if (key === "systems") {
    return `${base}${activeClass} border-violet-400/25 bg-violet-500/10 text-violet-200`;
  }

  return `${base}${activeClass}`;
}

function renderFeaturedArticleSvg() {
  return `<span aria-hidden="true" class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand-400">
    <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.84 7.2 17.76l.92-5.34-3.88-3.78 5.36-.78L12 3z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>`;
}

function renderCategorySvg(category) {
  const key = normalizeCategory(category);

  if (key === "market") {
    return `<span aria-hidden="true" class="inline-flex h-4 w-4 items-center justify-center text-brand-400">
      <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16l4-4 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 8h4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>`;
  }

  if (key === "systems") {
    return `<span aria-hidden="true" class="inline-flex h-4 w-4 items-center justify-center text-brand-400">
      <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
        <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
        <rect x="9" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
        <path d="M10 7h4M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </span>`;
  }

  return `<span aria-hidden="true" class="inline-flex h-4 w-4 items-center justify-center text-brand-400">
    <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>`;
}

function buildCard(post) {
  const avatarClasses = getAuthorAvatarClasses();
  const badgeClasses = getCategoryBadgeClasses(post.category);
  const authorInitials = getAuthorInitials(post.author);
  const readTimeShort = post.readTime.replace(/\s+read$/i, "");

  return `<article class="blog-card group flex flex-col overflow-hidden">
  <a href="${escapeHtml(post.url)}" class="flex h-full flex-col p-6" aria-label="Read ${escapeHtml(post.title)}">
    <div class="mb-4"><span class="${badgeClasses}">${escapeHtml(post.category)}</span></div>
    <h3 class="mb-3 flex-grow text-lg font-extrabold transition group-hover:text-brand-300">${escapeHtml(post.title)}</h3>
    <p class="mb-4 text-sm text-white/70">${escapeHtml(post.description)}</p>
    <div class="flex items-center justify-between border-t border-white/10 pt-4">
      <div class="flex min-w-0 items-center gap-2">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarClasses} text-[10px] font-bold">${escapeHtml(authorInitials)}</div>
        <div class="min-w-0">
          <div class="truncate text-xs font-semibold">${escapeHtml(post.author)}</div>
          <div class="text-xs text-white/50">${escapeHtml(readTimeShort)}</div>
        </div>
      </div>
      <span class="shrink-0 text-brand-400 transition group-hover:text-brand-300" aria-hidden="true">
        <i data-lucide="arrow-right" class="h-4 w-4 text-white/40 transition group-hover:text-brand-300"></i>
      </span>
    </div>
  </a>
</article>`;
}

function buildFeatured(post) {
  return `<article class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft md:p-10">
  <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
    <div class="min-w-0 flex-1">
      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
          <span>Featured article</span>
        </span>
        <span class="${getCategoryBadgeClasses(post.category, { active: true })}">${renderCategorySvg(post.category)}<span>${escapeHtml(post.category)}</span></span>
        <span class="text-xs text-white/60">•</span>
        <span class="text-xs text-white/60">${escapeHtml(post.readTime)}</span>
        <span class="text-xs text-white/60">•</span>
        <span class="text-xs text-white/60">${escapeHtml(formatDisplayDate(post.date))}</span>
      </div>
      <h2 class="text-3xl md:text-4xl font-extrabold max-w-4xl">${escapeHtml(post.title)}</h2>
      <p class="mt-5 max-w-3xl text-base text-white/70 md:text-lg">${escapeHtml(post.description)}</p>

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
        <a class="rounded-xl bg-brand-500 px-6 py-3 text-sm font-extrabold text-ink-900 hover:bg-brand-400" href="${escapeHtml(post.url)}">Read article</a>
        <div class="text-sm text-white/70">
          <div class="font-semibold text-white">${escapeHtml(post.author)}</div>
          <div class="text-white/55">${escapeHtml(post.authorRole)}</div>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 justify-start lg:justify-end lg:pt-2">
      <div class="inline-flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] text-brand-400 shadow-soft md:h-28 md:w-28">
        ${renderFeaturedArticleSvg()
          .replace(
            'class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand-400"',
            'class="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/10 text-brand-400"'
          )
          .replace('class="h-4 w-4"', 'class="h-8 w-8"')}
      </div>
    </div>
  </div>
</article>`;
}

function buildRelatedPosts(currentPost, posts) {
  const currentCategory = normalizeCategory(currentPost.category);

  return posts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      sameCategory: normalizeCategory(post.category) === currentCategory ? 1 : 0,
    }))
    .sort((a, b) => {
      if (a.sameCategory !== b.sameCategory) return b.sameCategory - a.sameCategory;
      if (a.post.date !== b.post.date) return a.post.date < b.post.date ? 1 : -1;
      if (a.post.sequence !== b.post.sequence) return a.post.sequence < b.post.sequence ? 1 : -1;
      return a.post.slug.localeCompare(b.post.slug);
    })
    .slice(0, 3)
    .map((entry) => entry.post);
}

function buildArticleFooter(post, posts) {
  const relatedPosts = buildRelatedPosts(post, posts);
  const relatedCards = relatedPosts.map(buildCard).join("\n    ");

  return `<section class="mx-auto max-w-6-5xl px-4 py-16 md:py-20 border-t border-white/10">
  <div class="mb-8 flex flex-col gap-6 md:mb-10 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400/90">Related articles</p>
      <h2 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Keep reading</h2>
      <p class="mt-3 max-w-2xl text-sm text-white/65 md:text-base">More writing on structured offers, recurring revenue, onboarding systems, and modern tax practice growth.</p>
    </div>
    <a href="/blog/index.html" class="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-brand-400/40 hover:text-white">Browse all articles</a>
  </div>

  <div class="grid gap-6 md:grid-cols-3">
    ${relatedCards}
  </div>
</section>

<section id="newsletter" class="mx-auto max-w-6-5xl px-4 py-16 md:py-20 border-t border-white/10">
  <div class="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-soft md:p-10">
    <div class="max-w-3xl">
      <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400/90">Newsletter</p>
      <h2 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Get insights like this delivered</h2>
      <p class="mt-4 text-base leading-8 text-white/70 md:text-lg">New articles on recurring monitoring, tax practice growth, structured onboarding, and professional discovery sent monthly.</p>
    </div>

    <form class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" action="#" method="post">
      <label class="sr-only" for="blog-newsletter-email-${escapeHtml(post.slug)}">Email address</label>
      <input id="blog-newsletter-email-${escapeHtml(post.slug)}" name="email" type="email" inputmode="email" autocomplete="email" placeholder="your@email.com" class="newsletter-input w-full sm:max-w-md" />
      <button type="submit" class="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-extrabold text-ink-900 transition hover:bg-brand-400">Subscribe</button>
    </form>

    <p class="mt-3 text-sm text-white/45">We respect your inbox. Unsubscribe anytime.</p>
  </div>
</section>

<section class="border-t border-white/10">
  <div class="mx-auto max-w-6-5xl px-4 py-16 md:py-20">
    <div class="mx-auto max-w-3xl text-center">
      <h2 class="mb-6 text-3xl font-extrabold md:text-5xl">Enjoy <span class="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">modern tax practice</span> growth ideas?</h2>
      <p class="mx-auto max-w-xl text-base text-white/70 md:text-lg">Subscribe to receive new articles on recurring monitoring, structured onboarding, and practice growth. Or explore how the ecosystem works to gain you more clients.</p>

      <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a href="#newsletter" class="inline-block rounded-xl bg-brand-500 px-10 py-5 text-xl font-extrabold text-ink-900 shadow-xl shadow-brand-500/30 transition-all duration-200 hover:scale-105 hover:bg-brand-400">Subscribe for more</a>
        <a href="/how-it-works.html" class="inline-block rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-white/10">See how it works</a>
      </div>

      <p class="text-white/60 text-sm mt-8">Become a member • Deliver calmly • Repeat</p>
    </div>
  </div>
</section>`;
}

export async function generateBlogManifest() {
  if (!(await exists(BLOG_DIR))) {
    throw new Error(`Blog directory not found: ${BLOG_DIR}`);
  }

  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });
  const htmlFiles = entries
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name)
    .filter((name) => name.endsWith(".html"))
    .filter((name) => name.toLowerCase() !== "index.html")
    .sort();

  const posts = [];

  for (const file of htmlFiles) {
    const fullPath = path.join(BLOG_DIR, file);
    const html = await readText(fullPath);
    const meta = extractBlogMeta(html, file);
    const fileMeta = parseArticleFilename(file, meta);

    const headTitle = extractTitle(html);
    const headDescription = extractDescription(html);

    if (headTitle && !headTitle.toLowerCase().includes(meta.title.toLowerCase())) {
      throw new Error(`Title mismatch in ${file}. <title> does not appear to match blog-meta title.`);
    }

    if (headDescription && headDescription !== meta.description) {
      throw new Error(`Description mismatch in ${file}. meta description must match blog-meta description exactly.`);
    }

    const normalizedMeta = {
      ...meta,
      date: fileMeta.date,
    };

    posts.push({
      ...fileMeta,
      ...normalizedMeta,
    });
  }

  const seenFiles = new Set();
  const seenSlugs = new Set();

  for (const post of posts) {
    if (seenFiles.has(post.file)) {
      throw new Error(`Duplicate file detected: ${post.file}`);
    }
    seenFiles.add(post.file);

    if (seenSlugs.has(post.slug)) {
      throw new Error(`Duplicate slug detected: ${post.slug}`);
    }
    seenSlugs.add(post.slug);
  }

  posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.sequence !== b.sequence) return a.sequence < b.sequence ? 1 : -1;
    return a.slug.localeCompare(b.slug);
  });

  await writeText(POSTS_JSON, JSON.stringify(posts, null, 2));
  await ensureDir(GENERATED_DIR);
  await ensureDir(FOOTERS_DIR);

  const featured = posts[0] ? buildFeatured(posts[0]) : "";
  const list = posts.map(buildCard).join("\n");
  const recent3 = posts.slice(0, 3).map(buildCard).join("\n");

  await writeText(path.join(GENERATED_DIR, "featured.html"), featured);
  await writeText(path.join(GENERATED_DIR, "list.html"), list);
  await writeText(path.join(GENERATED_DIR, "recent3.html"), recent3);

  for (const post of posts) {
    const footerHtml = buildArticleFooter(post, posts);
    await writeText(path.join(FOOTERS_DIR, `${post.slug}.html`), footerHtml);
  }

  return {
    count: posts.length,
    latestSlug: posts[0]?.slug || "",
    posts,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateBlogManifest()
    .then((result) => {
      console.log("blog_manifest_ok", {
        count: result.count,
        latestSlug: result.latestSlug,
      });
    })
    .catch((err) => {
      console.error("blog_manifest_failed", err);
      process.exit(1);
    });
}
