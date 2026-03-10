import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "blog");
const POSTS_JSON = path.join(BLOG_DIR, "posts.json");
const GENERATED_DIR = path.join(BLOG_DIR, ".generated");

const REQUIRED_FIELDS = [
  "author",
  "authorRole",
  "category",
  "date",
  "description",
  "readTime",
  "title",
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
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

function buildCard(post) {
  return `<article class="blog-card p-6 flex flex-col">
  <div class="mb-4"><span class="category-badge">${escapeHtml(post.category)}</span></div>
  <h3 class="mt-0 text-lg font-extrabold mb-3 flex-grow">
    <a class="hover:text-brand-300 transition" href="/blog/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a>
  </h3>
  <p class="text-white/70 text-sm mb-4">${escapeHtml(post.description)}</p>
  <div class="flex items-center justify-between pt-4 border-t border-white/10">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-[10px] font-bold">${escapeHtml(post.author)}</div>
      <div>
        <div class="text-xs font-semibold">${escapeHtml(post.author)}</div>
        <div class="text-xs text-white/50">${escapeHtml(post.readTime.replace(/\s+read$/i, ""))}</div>
      </div>
    </div>
    <a class="text-brand-400 hover:text-brand-300" href="/blog/${escapeHtml(post.slug)}.html">Read article →</a>
  </div>
</article>`;
}

function buildFeatured(post) {
  return `<article class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft md:p-10">
  <div class="mb-4 flex items-center gap-3 flex-wrap">
    <span class="category-badge category-badge--active">${escapeHtml(post.category)}</span>
    <span class="text-xs text-white/60">•</span>
    <span class="text-xs text-white/60">${escapeHtml(post.readTime)}</span>
    <span class="text-xs text-white/60">•</span>
    <span class="text-xs text-white/60">${escapeHtml(post.date)}</span>
  </div>
  <h2 class="text-3xl md:text-4xl font-extrabold">${escapeHtml(post.title)}</h2>
  <p class="mt-5 max-w-3xl text-base text-white/70 md:text-lg">${escapeHtml(post.description)}</p>
  <div class="mt-8 flex flex-col items-start gap-3 sm:flex-row">
    <a class="rounded-xl bg-brand-500 px-6 py-3 text-sm font-extrabold text-ink-900 hover:bg-brand-400" href="/blog/${escapeHtml(post.slug)}.html">Read article</a>
    <span class="text-sm text-white/60">${escapeHtml(post.author)} · ${escapeHtml(post.authorRole)}</span>
  </div>
</article>`;
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

    const headTitle = extractTitle(html);
    const headDescription = extractDescription(html);

    if (headTitle && !headTitle.toLowerCase().includes(meta.title.toLowerCase())) {
      throw new Error(`Title mismatch in ${file}. <title> does not appear to match blog-meta title.`);
    }

    if (headDescription && headDescription !== meta.description) {
      throw new Error(`Description mismatch in ${file}. meta description must match blog-meta description exactly.`);
    }

    posts.push({
      slug: path.parse(file).name,
      ...meta,
    });
  }

  const seen = new Set();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`Duplicate slug detected: ${post.slug}`);
    }
    seen.add(post.slug);
  }

  posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.slug.localeCompare(b.slug);
  });

  await writeText(POSTS_JSON, JSON.stringify(posts, null, 2));
  await ensureDir(GENERATED_DIR);

  const featured = posts[0] ? buildFeatured(posts[0]) : "";
  const list = posts.map(buildCard).join("\n");
  const recent3 = posts.slice(0, 3).map(buildCard).join("\n");

  await writeText(path.join(GENERATED_DIR, "featured.html"), featured);
  await writeText(path.join(GENERATED_DIR, "list.html"), list);
  await writeText(path.join(GENERATED_DIR, "recent3.html"), recent3);

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
