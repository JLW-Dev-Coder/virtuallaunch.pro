import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const WRANGLER_TOML = path.join(ROOT, "wrangler.toml");

// Public directories to copy as-is
const COPY_DIRS = ["_sdk", "assets", "blog", "features", "legal", "lp", "magnets", "scripts", "styles", "va", "workers"];

// Where partial sources live
const PARTIALS_ROOT = path.join(ROOT, "partials");
const PARTIALS_APP_SIDEBAR = path.join(ROOT, "partials", "appSidebar.html");
const PARTIALS_APP_TOPBAR = path.join(ROOT, "partials", "appTopbar.html");
const PARTIALS_TAXPRO_SIDEBAR = path.join(ROOT, "partials", "taxProSidebar.html");
const PARTIALS_TAXPRO_TOPBAR = path.join(ROOT, "partials", "taxProTopbar.html");

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

async function writeHtmlWithRouteVariants(dest, content) {
  await writeText(dest, content);

  const parsed = path.parse(dest);
  if (parsed.base.toLowerCase() !== "index.html") {
    const cleanRouteDest = path.join(parsed.dir, parsed.name, "index.html");
    await writeText(cleanRouteDest, content);
  }
}

async function copyDir(srcDir, destDir, options = {}) {
  if (!(await exists(srcDir))) return;

  const {
    partials = null,
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
      const next = transformHtml(html, partials ?? {}, wranglerVars);
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

function transformHtml(html, partials, wranglerVars) {
  let next = html;
  next = injectPartials(next, partials);
  next = replaceBuildPlaceholders(next, wranglerVars);
  return next;
}

async function main() {
  await rmDir(DIST);
  await ensureDir(DIST);

  const wranglerVars = await loadWranglerVars();

  const partials = {
    // Current tokens
    appSidebar: await loadPartialOrEmpty(PARTIALS_APP_SIDEBAR),
    appTopbar: await loadPartialOrEmpty(PARTIALS_APP_TOPBAR),
    siteFooter: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "footer.html")),
    siteHeader: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "header.html")),
    taxProSidebar: await loadPartialOrEmpty(PARTIALS_TAXPRO_SIDEBAR),
    taxProTopbar: await loadPartialOrEmpty(PARTIALS_TAXPRO_TOPBAR),

    // Legacy tokens kept for compatibility because apparently pages love drifting.
    footer: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "footer.html")),
    header: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "header.html")),
    sidebar: await loadPartialOrEmpty(PARTIALS_APP_SIDEBAR),
    topbar: await loadPartialOrEmpty(PARTIALS_APP_TOPBAR),
  };

  // 1) Copy root-level HTML files with partial injection + build-time placeholder replacement
  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    if (!ent.name.endsWith(".html")) continue;

    const src = path.join(ROOT, ent.name);
    const dest = path.join(DIST, ent.name);

    const html = await readText(src);
    const next = transformHtml(html, partials, wranglerVars);
    await writeHtmlWithRouteVariants(dest, next);
  }

  // 2) Copy public dirs, transforming HTML as we go so route files like blog/index.html survive build output cleanly.
  for (const dir of COPY_DIRS.slice().sort()) {
    await copyDir(path.join(ROOT, dir), path.join(DIST, dir), {
      partials,
      transformHtmlFiles: true,
      wranglerVars,
    });
  }

  // 3) Copy _redirects if present
  const redirects = path.join(ROOT, "_redirects");
  if (await exists(redirects)) {
    await copyFile(redirects, path.join(DIST, "_redirects"));
  }

  // 4) Inject partials and replace placeholders into any HTML inside dist
  const distFiles = await walk(DIST);
  let transformedHtmlFiles = 0;

  for (const f of distFiles) {
    if (!f.endsWith(".html")) continue;

    const html = await readText(f);
    const next = transformHtml(html, partials, wranglerVars);

    if (next !== html) {
      await writeHtmlWithRouteVariants(f, next);
      transformedHtmlFiles++;
    }
  }

  // 5) Ensure every copied HTML file also has a clean-route index.html variant
  const finalDistFiles = await walk(DIST);
  for (const f of finalDistFiles) {
    if (!f.endsWith(".html")) continue;

    const parsed = path.parse(f);
    if (parsed.base.toLowerCase() === "index.html") continue;

    const html = await readText(f);
    const cleanRouteDest = path.join(parsed.dir, parsed.name, "index.html");
    await writeText(cleanRouteDest, html);
  }

  const presentPartials = Object.entries(partials)
    .map(([k, v]) => `${k}:${v ? "yes" : "no"}`)
    .sort()
    .join(" ");

  const usedBuildVars = Object.keys(wranglerVars)
    .filter((key) => key.startsWith("VLP_") || key.startsWith("STRIPE_") || key.startsWith("BILLING_"))
    .sort();

  console.log("build_ok", {
    copiedDirs: COPY_DIRS.slice().sort(),
    dist: "dist",
    partials: presentPartials,
    transformedHtmlFiles,
    wranglerVarCount: Object.keys(wranglerVars).length,
    wranglerVarsSample: usedBuildVars.slice(0, 20),
  });
}

main().catch((err) => {
  console.error("build_failed", err);
  process.exit(1);
});
