// BUILD.MJS
import { generateBlogManifest } from "./scripts/blog-manifest.mjs";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const WRANGLER_TOML = path.join(ROOT, "wrangler.toml");
const BLOG_GENERATED_DIR = path.join(ROOT, "blog", ".generated");
const BLOG_FOOTERS_DIR = path.join(BLOG_GENERATED_DIR, "footers");
const BLOG_FEATURED_HTML = path.join(BLOG_GENERATED_DIR, "featured.html");
const BLOG_LIST_HTML = path.join(BLOG_GENERATED_DIR, "list.html");
const BLOG_RECENT3_HTML = path.join(BLOG_GENERATED_DIR, "recent3.html");
const BLOG_ARTICLE_FILE_RE = /^(\d{4}-\d{2}-\d{2})_(\d{3})_([a-z0-9-]+)\.html$/;

// Public directories to copy as-is
const COPY_DIRS = ["assets", "blog", "features", "legal", "scripts", "site", "workers"];

// Public root files to copy as-is
const COPY_FILES = ["BLOG.md", "MARKET.md", "README.md", "styles.css"];

// Where partial sources live
const PARTIALS_ROOT = path.join(ROOT, "partials");

// Avoid walking into these (source tree)
const SKIP_DIRS = new Set([".git", "dist", "node_modules"]);

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

async function rmDir(dir) {
  if (await exists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function readText(p) {
  return await fs.readFile(p, "utf8");
}

async function writeText(p, content) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf8");
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

function getPublicBlogArticleName(filename) {
  const match = filename.match(BLOG_ARTICLE_FILE_RE);
  return match ? `${match[3]}.html` : null;
}

function getBlogArticleSlug(filename) {
  const datedMatch = filename.match(BLOG_ARTICLE_FILE_RE);
  if (datedMatch) return datedMatch[3];

  const simpleMatch = filename.match(/^([a-z0-9-]+)\.html$/);
  if (!simpleMatch) return null;
  if (simpleMatch[1].toLowerCase() === "index") return null;
  return simpleMatch[1];
}

function isBlogArticleFile(srcPath) {
  const parentDir = path.basename(path.dirname(srcPath));
  if (parentDir !== "blog") return false;
  return getBlogArticleSlug(path.basename(srcPath)) !== null;
}

async function writeHtmlWithRouteVariants(dest, content) {
  await writeText(dest, content);

  const parsed = path.parse(dest);
  if (parsed.base.toLowerCase() !== "index.html") {
    const cleanRouteDest = path.join(parsed.dir, parsed.name, "index.html");
    await writeText(cleanRouteDest, content);
  }

  if (path.basename(parsed.dir) === "blog") {
    const publicBlogArticleName = getPublicBlogArticleName(parsed.base);

    if (publicBlogArticleName) {
      const publicBlogArticleDest = path.join(parsed.dir, publicBlogArticleName);
      const publicBlogArticleParsed = path.parse(publicBlogArticleDest);

      if (publicBlogArticleDest !== dest) {
        await writeText(publicBlogArticleDest, content);
      }

      const publicCleanRouteDest = path.join(
        publicBlogArticleParsed.dir,
        publicBlogArticleParsed.name,
        "index.html"
      );
      await writeText(publicCleanRouteDest, content);
    }
  }
}

async function copyDir(srcDir, destDir, options = {}) {
  if (!(await exists(srcDir))) return;

  const {
    blogFragments = {},
    partials = {},
    transformHtmlFiles = false,
    wranglerVars = {},
  } = options;

  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const ent of entries) {
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);

    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await copyDir(src, dest, options);
      continue;
    }

    if (transformHtmlFiles && ent.name.toLowerCase().endsWith(".html")) {
      const html = await readText(src);
      const articleSlug = isBlogArticleFile(src) ? getBlogArticleSlug(ent.name) : null;
      const next = transformHtml(html, partials, wranglerVars, blogFragments, articleSlug);
      await writeHtmlWithRouteVariants(dest, next);
      continue;
    }

    await copyFile(src, dest);
  }
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const ent of entries) {
    const full = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      out.push(...(await walk(full)));
      continue;
    }

    out.push(full);
  }

  return out;
}

async function loadPartialOrEmpty(p) {
  return (await exists(p)) ? await readText(p) : "";
}

function injectPartials(html, partials) {
  let next = html;

  for (const [key, value] of Object.entries(partials)) {
    const re = new RegExp(`<!--\\s*PARTIAL:${escapeRegExp(key)}\\s*-->`, "g");
    next = next.replace(re, value);
  }

  return next;
}

function injectBlogFragments(html, blogFragments, articleSlug = null) {
  let next = html;

  for (const [key, value] of Object.entries(blogFragments.global ?? {})) {
    const re = new RegExp(`<!--\\s*BLOG:${escapeRegExp(key)}\\s*-->`, "g");
    next = next.replace(re, value);
  }

  const articleFooter = articleSlug
    ? (blogFragments.footers?.[articleSlug] ?? "")
    : "";

  next = next.replace(/<!--\s*BLOG:articleFooter\s*-->/g, articleFooter);

  return next;
}

function replaceBuildPlaceholders(html, vars) {
  return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (fullMatch, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key]);
    }
    return fullMatch;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseWranglerVarsToml(tomlText) {
  const vars = {};
  const lines = tomlText.split(/\r?\n/);
  let inVarsSection = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    if (/^\[[^\]]+\]$/.test(trimmed)) {
      inVarsSection = trimmed === "[vars]";
      continue;
    }

    if (!inVarsSection) continue;

    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*"([\s\S]*)"$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    vars[key] = rawValue
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
  }

  return vars;
}

async function loadWranglerVars() {
  if (!(await exists(WRANGLER_TOML))) {
    return {};
  }

  const toml = await readText(WRANGLER_TOML);
  return parseWranglerVarsToml(toml);
}

function transformHtml(html, partials, wranglerVars, blogFragments = {}, articleSlug = null) {
  let next = html;
  next = injectPartials(next, partials);
  next = injectBlogFragments(next, blogFragments, articleSlug);
  next = replaceBuildPlaceholders(next, wranglerVars);
  return next;
}

async function loadBlogFragments() {
  const global = {
    featured: await loadPartialOrEmpty(BLOG_FEATURED_HTML),
    list: await loadPartialOrEmpty(BLOG_LIST_HTML),
    recent3: await loadPartialOrEmpty(BLOG_RECENT3_HTML),
  };

  const footers = {};

  if (await exists(BLOG_FOOTERS_DIR)) {
    const footerEntries = await fs.readdir(BLOG_FOOTERS_DIR, { withFileTypes: true });

    for (const ent of footerEntries) {
      if (!ent.isFile() || !ent.name.toLowerCase().endsWith(".html")) continue;
      const slug = ent.name.replace(/\.html$/i, "");
      footers[slug] = await readText(path.join(BLOG_FOOTERS_DIR, ent.name));
    }
  }

  return { footers, global };
}

async function loadPartials() {
  const partialFiles = await walk(PARTIALS_ROOT).catch(() => []);
  const partials = {};

  for (const file of partialFiles) {
    if (!file.toLowerCase().endsWith(".html")) continue;
    const key = path.basename(file, ".html");
    partials[key] = await readText(file);
  }

  partials.footer = await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "footer.html"));
  partials.header = await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "header.html"));

  return partials;
}

async function copyRootFiles() {
  for (const file of COPY_FILES) {
    const src = path.join(ROOT, file);
    const dest = path.join(DIST, file);

    if (!(await exists(src))) continue;
    await copyFile(src, dest);
  }
}

async function main() {
  await generateBlogManifest();

  await rmDir(DIST);
  await ensureDir(DIST);

  const blogFragments = await loadBlogFragments();
  const partials = await loadPartials();
  const wranglerVars = await loadWranglerVars();

  for (const dir of COPY_DIRS) {
    const srcDir = path.join(ROOT, dir);
    const destDir = path.join(DIST, dir);
    await copyDir(srcDir, destDir, {
      blogFragments,
      partials,
      transformHtmlFiles: true,
      wranglerVars,
    });
  }

  await copyRootFiles();

  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });

  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    if (!ent.name.toLowerCase().endsWith(".html")) continue;

    const src = path.join(ROOT, ent.name);
    const dest = path.join(DIST, ent.name);
    const html = await readText(src);
    const next = transformHtml(html, partials, wranglerVars, blogFragments, null);
    await writeHtmlWithRouteVariants(dest, next);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
