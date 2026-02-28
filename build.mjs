// build.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

// Public directories to copy as-is
const COPY_DIRS = ["_sdk", "assets", "blog", "legal", "lp", "magnets", "scripts", "styles", "va", "workers"];

// Where partial sources live
const PARTIALS_ROOT = path.join(ROOT, "partials");
const PARTIALS_DASHBOARD = path.join(ROOT, "va", "dashboard", "partials");

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
  if (await exists(dir)) await fs.rm(dir, { recursive: true, force: true });
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

async function copyDir(srcDir, destDir) {
  if (!(await exists(srcDir))) return;

  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const ent of entries) {
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);

    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await copyDir(src, dest);
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

function injectAll(html, partials) {
  let next = html;

  for (const [key, value] of Object.entries(partials)) {
    const re = new RegExp(`<!--\\s*PARTIAL:${key}\\s*-->`, "g");
    next = next.replace(re, value);
  }

  return next;
}

async function loadPartialOrEmpty(p) {
  return (await exists(p)) ? await readText(p) : "";
}

async function main() {
  await rmDir(DIST);
  await ensureDir(DIST);

  // Load partials (missing files become empty strings)
  const partials = {
    footer: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "footer.html")),
    header: await loadPartialOrEmpty(path.join(PARTIALS_ROOT, "header.html")),
    sidebar: await loadPartialOrEmpty(path.join(PARTIALS_DASHBOARD, "sidebar.html")),
    topbar: await loadPartialOrEmpty(path.join(PARTIALS_DASHBOARD, "topbar.html")),
  };

  // 1) Copy root-level HTML files (index.html, pricing.html, etc.) with injection
  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    if (!ent.name.endsWith(".html")) continue;

    const src = path.join(ROOT, ent.name);
    const dest = path.join(DIST, ent.name);

    const html = await readText(src);
    const next = injectAll(html, partials);
    await writeText(dest, next);
  }

  // 2) Copy public dirs
  for (const dir of COPY_DIRS.sort()) {
    await copyDir(path.join(ROOT, dir), path.join(DIST, dir));
  }

  // 3) Copy _redirects if present
  const redirects = path.join(ROOT, "_redirects");
  if (await exists(redirects)) await copyFile(redirects, path.join(DIST, "_redirects"));

  // 4) Inject partials into any HTML inside dist (includes /va/** pages)
  const distFiles = await walk(DIST);
  let injectedCount = 0;

  for (const f of distFiles) {
    if (!f.endsWith(".html")) continue;
    const html = await readText(f);
    const next = injectAll(html, partials);
    if (next !== html) {
      await writeText(f, next);
      injectedCount++;
    }
  }

  const present = Object.entries(partials)
    .map(([k, v]) => `${k}:${v ? "yes" : "no"}`)
    .sort()
    .join(" ");

  console.log("build_ok", {
    dist: "dist",
    injectedHtmlFiles: injectedCount,
    partials: present,
    copiedDirs: COPY_DIRS.slice().sort(),
  });
}

main().catch((err) => {
  console.error("build_failed", err);
  process.exit(1);
});
