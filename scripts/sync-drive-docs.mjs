// scripts/sync-slack-missing-and-changes.mjs
//
// Purpose:
// - One-time: post ONLY the repo files you previously identified as "missing" from Slack.
// - Ongoing: post ANY subsequent changes (git diff) for ANY file, using the same format:
//   summary message (parent) + per-file top-level message + file contents as thread replies.
//
// Env:
// - SLACK_BOT_TOKEN (required)
// - SLACK_CHANNEL (required)  // channel ID like C0123ABCDEF
// - SYNC_MODE (optional)      // "missing" | "changed" | "all"  (default: "changed")
// - GITHUB_BEFORE (optional)  // GitHub Actions
// - GITHUB_REPO (optional)    // owner/repo
// - GITHUB_SHA (optional)     // commit sha
//
// Notes:
// - Slack requires proper scopes: chat:write (and files:write for binary uploads).
// - This script avoids uploading binaries by default (see isBinaryByExt). If you want binaries uploaded, keep as-is.
// - Threading format:
//   - Summary post: top-level message
//   - Each file: its own top-level message
//   - File content: replies in that file's thread
//
import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const GITHUB_BEFORE = process.env.GITHUB_BEFORE || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_SHA = process.env.GITHUB_SHA || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL; // channel ID like C0123ABCDEF
const SYNC_MODE = String(process.env.SYNC_MODE || "changed").toLowerCase(); // "missing" | "changed" | "all"

if (!SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN");
if (!SLACK_CHANNEL) throw new Error("Missing SLACK_CHANNEL");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function escapeTripleBackticks(s) {
  return String(s || "").replace(/```/g, "`\u200b``");
}

function chunkString(str, max = 8000) {
  const out = [];
  const s = String(str || "");
  for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
  return out;
}

function isBinaryByExt(relPath) {
  const ext = path.extname(relPath).toLowerCase();

  // Keep alphabetical.
  const binaryExt = [
    ".gif",
    ".ico",
    ".jpeg",
    ".jpg",
    ".mp3",
    ".mp4",
    ".pdf",
    ".png",
    ".svg",
    ".wav",
    ".webm",
    ".webp",
  ];

  return binaryExt.includes(ext);
}

async function slackPost({ channel, text, thread_ts }) {
  const body = { channel, text };
  if (thread_ts) body.thread_ts = thread_ts;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(`Slack post failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data; // includes ts
}

/**
 * Modern file upload flow:
 * - files.getUploadURLExternal (x-www-form-urlencoded: filename, length)
 * - POST bytes to upload_url
 * - files.completeUploadExternal (JSON)
 */
async function slackUploadFile({ absPath, displayName, thread_ts }) {
  const buf = fs.readFileSync(absPath);
  const filename = displayName || path.basename(absPath);

  const form = new URLSearchParams();
  form.set("filename", filename);
  form.set("length", String(buf.length));

  const urlRes = await fetch("https://slack.com/api/files.getUploadURLExternal", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: form.toString(),
  });

  const urlData = await urlRes.json().catch(() => null);
  if (!urlRes.ok || !urlData?.ok) {
    throw new Error(`Slack getUploadURLExternal failed: ${urlRes.status} ${JSON.stringify(urlData)}`);
  }

  const upRes = await fetch(urlData.upload_url, {
    method: "POST",
    body: buf,
  });

  if (!upRes.ok) {
    throw new Error(`Slack upload POST failed: ${upRes.status}`);
  }

  const completeRes = await fetch("https://slack.com/api/files.completeUploadExternal", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: SLACK_CHANNEL,
      files: [{ id: urlData.file_id, title: filename }],
      thread_ts,
    }),
  });

  const completeData = await completeRes.json().catch(() => null);
  if (!completeRes.ok || !completeData?.ok) {
    throw new Error(
      `Slack completeUploadExternal failed: ${completeRes.status} ${JSON.stringify(completeData)}`
    );
  }
}

function getAllRepoFiles() {
  const files = sh("git ls-files").split("\n").filter(Boolean);
  return files.sort((a, b) => a.localeCompare(b));
}

function getChangedFiles() {
  let before = GITHUB_BEFORE;
  if (!before || before === "0000000000000000000000000000000000000000") before = "";

  const range = before ? `${before}..${GITHUB_SHA}` : "HEAD~1..HEAD";
  const lines = sh(`git diff --name-status ${range}`).split("\n").filter(Boolean);

  const entries = [];
  for (const line of lines) {
    // A path
    // M path
    // D path
    // R100 old new
    const parts = line.split(/\s+/);
    const status = parts[0] || "";

    if (status.startsWith("R")) {
      const oldPath = parts[1];
      const newPath = parts[2];
      if (oldPath) entries.push({ status: "D", path: oldPath });
      if (newPath) entries.push({ status: "A", path: newPath });
      continue;
    }

    const p = parts[1];
    if (p) entries.push({ status, path: p });
  }

  const map = new Map();
  for (const e of entries) {
    const prev = map.get(e.path);
    if (!prev) map.set(e.path, e);
    else if (prev.status === "D" && e.status !== "D") map.set(e.path, e);
  }

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

// Alphabetical list of previously identified "missing" files.
// (Assets intentionally excluded.)
const MISSING_FILES = [
  ".github/workflows/sync-docs-to-drive.yml",
  "about.html",
  "blog/blog.css",
  "blog/index.html",
  "blog/the-5-client-journey-categories-model-a/index.html",
  "blog/welcome-aboard-agency-builders-tide-report/index.html",
  "book.html",
  "build.mjs",
  "index.html",
  "installs.html",
  "lp/tax-monitor/details/index.html",
  "lp/tax-monitor/index.html",
  "lp/va-agency-setup/index.html",
  "lp/va-starter-track/MARKET.md",
  "lp/va-starter-track/README.md",
  "lp/va-starter-track/index.html",
  "lp/va-starter-track/payment-success.html",
  "partials/blog/footer.html",
  "partials/cookie-consent.html",
  "partials/dashboard-preview.html",
  "partials/footer-lp.html",
  "partials/footer.html",
  "partials/header.html",
  "partials/lenbot.html",
  "pricing.html",
  "privacy.html",
  "scripts/sync-drive-docs.mjs",
  "signup.html",
  "site.js",
  "styles.css",
  "terms.html",
  "test.html",
  "va/damian-reyes/index.html",
  "va/dashboard/analytics.html",
  "va/dashboard/index.html",
  "va/dashboard/partials/sidebar.html",
  "va/dashboard/partials/topbar.html",
  "va/dashboard/setup.html",
  "va/dashboard/support.html",
  "va/directory.html",
  "va/login.html",
  "wrangler.toml",
].sort((a, b) => a.localeCompare(b));

function getMissingTargetsFromRepo() {
  const repoSet = new Set(getAllRepoFiles());
  const out = [];
  for (const p of MISSING_FILES) {
    if (repoSet.has(p)) out.push({ status: "A", path: p });
    else out.push({ status: "A", path: p, note: "(not tracked by git ls-files)" });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

async function postFileThread({ relPath, status, summaryThreadTs }) {
  // Create a NEW top-level message per file (keeps each file in its own thread)
  const headerBits = [];
  headerBits.push(`*${relPath}*`);
  headerBits.push(`Status: \`${status}\``);
  if (summaryThreadTs) headerBits.push(`Snapshot thread: \`${summaryThreadTs}\``);

  const root = await slackPost({
    channel: SLACK_CHANNEL,
    text: headerBits.join(" • "),
  });

  // Gentle pacing to avoid suppression.
  await sleep(1100);

  if (status === "D") {
    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: root.ts,
      text: "`(deleted)`",
    });
    await sleep(1100);
    return;
  }

  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: root.ts,
      text: "`(missing in checkout)`",
    });
    await sleep(1100);
    return;
  }

  if (isBinaryByExt(relPath)) {
    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: root.ts,
      text: "`(binary upload)`",
    });
    await sleep(1100);

    await slackUploadFile({
      absPath,
      displayName: relPath,
      thread_ts: root.ts,
    });
    await sleep(1100);
    return;
  }

  const content = fs.readFileSync(absPath, "utf8");
  const chunks = chunkString(content, 8000);

  for (let i = 0; i < chunks.length; i++) {
    const label = chunks.length > 1 ? `_${relPath} (${i + 1}/${chunks.length})_\n` : "";
    const block = `\`\`\`\n${escapeTripleBackticks(chunks[i])}\n\`\`\``;

    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: root.ts,
      text: `${label}${block}`,
    });

    await sleep(1100);
  }
}

function buildSummaryText({ diffStat, modeLabel }) {
  const shortSha = GITHUB_SHA ? GITHUB_SHA.slice(0, 12) : "";
  const repoLabel = GITHUB_REPO || "repo";
  const marker = `LATEST SNAPSHOT: ${repoLabel}${shortSha ? ` @ ${shortSha}` : ""}`;

  const commitUrl =
    GITHUB_REPO && GITHUB_SHA ? `https://github.com/${GITHUB_REPO}/commit/${GITHUB_SHA}` : "";
  const commitMsg = safeGit(() => sh("git log -1 --pretty=%B"));

  const summaryLines = [];
  summaryLines.push(marker);
  summaryLines.push("");
  summaryLines.push(`*Mode:* ${modeLabel} (THREAD PER FILE)`);
  if (commitUrl) summaryLines.push(`Commit: ${commitUrl}`);
  if (commitMsg) summaryLines.push(`Message: ${commitMsg}`);
  summaryLines.push("");
  summaryLines.push("```");
  summaryLines.push(escapeTripleBackticks(diffStat || ""));
  summaryLines.push("```");

  return summaryLines.join("\n");
}

function safeGit(fn) {
  try {
    return fn();
  } catch {
    return "";
  }
}

async function main() {
  const mode = SYNC_MODE;

  // Determine targets
  let targets = [];
  let modeLabel = "";
  let diffStat = "";

  if (mode === "all") {
    modeLabel = "FULL REPO";
    diffStat = safeGit(() => sh("git show --stat --oneline --no-color -1")) || "(full repo sync)";
    targets = getAllRepoFiles().map((p) => ({ status: "A", path: p }));
  } else if (mode === "missing") {
    modeLabel = "MISSING FILES (INITIAL BACKFILL)";
    diffStat = "(missing files backfill)";
    targets = getMissingTargetsFromRepo();
  } else if (mode === "changed") {
    modeLabel = "CHANGED FILES";
    diffStat = safeGit(() => sh("git show --stat --oneline --no-color -1")) || "(changed files sync)";
    targets = getChangedFiles();
  } else {
    throw new Error(`Invalid SYNC_MODE: ${SYNC_MODE}. Use "missing", "changed", or "all".`);
  }

  // Summary message (single parent)
  const summaryText = buildSummaryText({ diffStat, modeLabel });

  const summaryPost = await slackPost({
    channel: SLACK_CHANNEL,
    text: summaryText,
  });

  // Keep the file list alphabetical.
  targets = targets.sort((a, b) => a.path.localeCompare(b.path));

  if (targets.length === 0) {
    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: summaryPost.ts,
      text: "No file changes detected.",
    });
    return;
  }

  // Post a manifest in the summary thread
  const manifestLines = [];
  manifestLines.push("*Manifest (Alphabetical)*");
  manifestLines.push("```");
  for (const t of targets) manifestLines.push(`${t.status}\t${t.path}`);
  manifestLines.push("```");

  await slackPost({
    channel: SLACK_CHANNEL,
    thread_ts: summaryPost.ts,
    text: manifestLines.join("\n"),
  });

  // Now one top-level thread per file
  for (const t of targets) {
    await postFileThread({
      relPath: t.path,
      status: t.status,
      summaryThreadTs: summaryPost.ts,
    });
  }

  console.log("Posted repo sync (summary + per-file threads).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
