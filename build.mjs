import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const COPY_DIRS = ["_sdk", "assets", "legal", "magnets", "scripts", "styles"];
const PARTIALS_DIR = path.join(ROOT, "partials");

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function rmDir(dir) {
  if (await exists(dir)) await fs.rm(dir, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  if (!(await exists(src))) return;
  await ensureDir(dest);

  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

function inject(html, header, footer) {
  return html
    .replace(/<!--\s*PARTIAL:header\s*-->/g, header)
    .replace(/<!--\s*PARTIAL:footer\s*-->/g, footer);
}

async function main() {
  await rmDir(DIST);
  await ensureDir(DIST);

  const header = await exists(path.join(PARTIALS_DIR, "header.html"))
    ? await fs.readFile(path.join(PARTIALS_DIR, "header.html"), "utf8")
    : "";

  const footer = await exists(path.join(PARTIALS_DIR, "footer.html"))
    ? await fs.readFile(path.join(PARTIALS_DIR, "footer.html"), "utf8")
    : "";

  const files = await fs.readdir(ROOT, { withFileTypes: true });

  for (const f of files) {
    if (!f.isFile() || !f.name.endsWith(".html")) continue;

    const src = path.join(ROOT, f.name);
    const dest = path.join(DIST, f.name);

    let html = await fs.readFile(src, "utf8");
    html = inject(html, header, footer);

    await fs.writeFile(dest, html);
  }

  for (const dir of COPY_DIRS) {
    await copyDir(path.join(ROOT, dir), path.join(DIST, dir));
  }

  console.log("build_ok");
}

main().catch(err => {
  console.error("build_failed", err);
  process.exit(1);
});