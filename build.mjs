import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const SKIP_DIRS = new Set([".git", "dist", "node_modules", "partials"]);
const PARTIALS_DIR = path.join(ROOT, "partials");

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
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

function inject(html, header, footer) {
  return html
    .replace(/<!--\s*PARTIAL:header\s*-->/g, header)
    .replace(/<!--\s*PARTIAL:footer\s*-->/g, footer);
}

async function main() {
  await rmDir(DIST);
  await ensureDir(DIST);

  const headerPath = path.join(PARTIALS_DIR, "header.html");
  const footerPath = path.join(PARTIALS_DIR, "footer.html");

  const header = (await exists(headerPath)) ? await readText(headerPath) : "";
  const footer = (await exists(footerPath)) ? await readText(footerPath) : "";

  // Copy root files (everything), injecting partials into html
  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (ent.isDirectory()) continue;
    if (ent.name === "build.mjs") continue;

    const src = path.join(ROOT, ent.name);
    const dest = path.join(DIST, ent.name);

    if (ent.name.endsWith(".html")) {
      const html = inject(await readText(src), header, footer);
      await writeText(dest, html);
    } else {
      await copyFile(src, dest);
    }
  }

  // Copy all non-skipped top-level directories
  for (const ent of rootEntries) {
    if (!ent.isDirectory()) continue;
    if (SKIP_DIRS.has(ent.name)) continue;

    await copyDir(path.join(ROOT, ent.name), path.join(DIST, ent.name));
  }

  // Inject partials into any HTML anywhere in dist
  const files = await walk(DIST);
  for (const f of files) {
    if (!f.endsWith(".html")) continue;
    const html = await readText(f);
    const next = inject(html, header, footer);
    if (next !== html) await writeText(f, next);
  }

  console.log("build_ok");
}

main().catch((err) => {
  console.error("build_failed", err);
  process.exit(1);
});
