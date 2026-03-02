import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const GITHUB_BEFORE = process.env.GITHUB_BEFORE || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_SHA = process.env.GITHUB_SHA || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL; // channel ID like C0123ABCDEF
const SYNC_MODE = String(process.env.SYNC_MODE || "changed").toLowerCase(); // "missing" | "changed" | "all"
const STOP_ON_ERROR = String(process.env.STOP_ON_ERROR || "false").toLowerCase() === "true";

if (!SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN");
if (!SLACK_CHANNEL) throw new Error("Missing SLACK_CHANNEL");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function escapeTripleBackticks(s) {
  return String(s || "").replace(/```/g, "`\u200b``");
}

// Slack message text limit is large, but don’t push your luck.
function chunkString(str, max = 6500) {
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

function safeGit(fn) {
  try {
    return fn();
  } catch {
    return "";
  }
}

async function slackFetchJson(url, options, { label }) {
  // Basic retry for rate limits + occasional Slack flakiness.
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, options);

    // Rate limit
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") || "2");
      console.log(`[slack] 429 rate limited (${label}) retry-after=${retryAfter}s`);
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    const data = await res.json().catch(() => null);

    // Slack API error (ok:false) or HTTP error
    if (!res.ok || !data?.ok) {
      const err = new Error(
        `Slack API failed (${label}) status=${res.status} body=${JSON.stringify(data)}`
      );

      // Retry a couple times for transient server errors
      if (res.status >= 500 && attempt < maxAttempts) {
        console.log(`[slack] ${res.status} transient (${label}) attempt=${attempt} retrying…`);
        await sleep(1500 * attempt);
        continue;
      }

      throw err;
    }

    return { res, data };
  }

  throw new Error(`Slack API failed after retries (${label})`);
}

async function slackPost({ channel, text, thread_ts }) {
  const body = { channel, text };
  if (thread_ts) body.thread_ts = thread_ts;

  const { data } = await slackFetchJson(
    "https://slack.com/api/chat.postMessage",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    },
    { label: "chat.postMessage" }
  );

  return data; // includes ts
}

/**
 * Modern file upload flow:
 * - files.getUploadURLExternal
 * - POST bytes to upload_url
 * - files.completeUploadExternal
 */
async function slackUploadFile({ absPath, displayName, thread_ts }) {
  const buf = fs.readFileSync(absPath);
  const filename = displayName || path.basename(absPath);

  const form = new URLSearchParams();
  form.set("filename", filename);
  form.set("length", String(buf.length));

  const { data: urlData } = await slackFetchJson(
    "https://slack.com/api/files.getUploadURLExternal",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: form.toString(),
    },
    { label: "files.getUploadURLExternal" }
  );

  // Upload raw bytes to Slack-provided URL (NOT Slack API domain)
  const upRes = await fetch(urlData.upload_url, { method: "POST", body: buf });
  if (upRes.status === 429) {
    // Extremely rare, but handle it anyway.
    await sleep(3000);
    const retryRes = await fetch(urlData.upload_url, { method: "POST", body: buf });
    if (!retryRes.ok) throw new Error(`Slack upload POST failed: ${retryRes.status}`);
  } else if (!upRes.ok) {
    throw new Error(`Slack upload POST failed: ${upRes.status}`);
  }

  await slackFetchJson(
    "https://slack.com/api/files.completeUploadExternal",
    {
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
    },
    { label: "files.completeUploadExternal" }
  );
}

function getAllRepoFiles() {
  const files = sh("git ls-files").split("\n").filter(Boolean);
  return files.sort((a, b) => a.localeCompare(b));
}

function getChangedFiles() {
  let before = GITHUB_BEFORE;
  if (!before || before === "0000000000000000000000000000000000000000") before = "";

  const range = before ? `${before}..${GITHUB_SHA}` : "HEAD~1..HEAD";
  const lines = safeGit(() => sh(`git diff --name-status ${range}`))
    .split("\n")
    .filter(Boolean);

  const entries = [];
  for (const line of lines) {
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

// Alphabetical list of previously identified "missing" files (assets excluded).
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
  // We intentionally only post files that exist in the checkout.
  // If your CI checkout is shallow or missing directories, you’ll see "(missing in checkout)" in Slack.
  const out = [];
  for (const p of MISSING_FILES) out.push({ status: "A", path: p });
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

async function postFileThread({ relPath, status, summaryThreadTs }) {
  const headerBits = [];
  headerBits.push(`*${relPath}*`);
  headerBits.push(`Status: \`${status}\``);
  if (summaryThreadTs) headerBits.push(`Snapshot thread: \`${summaryThreadTs}\``);

  const root = await slackPost({ channel: SLACK_CHANNEL, text: headerBits.join(" • ") });
  await sleep(900);

  if (status === "D") {
    await slackPost({ channel: SLACK_CHANNEL, thread_ts: root.ts, text: "`(deleted)`" });
    await sleep(900);
    return;
  }

  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    await slackPost({ channel: SLACK_CHANNEL, thread_ts: root.ts, text: "`(missing in checkout)`" });
    await sleep(900);
    return;
  }

  if (isBinaryByExt(relPath)) {
    await slackPost({ channel: SLACK_CHANNEL, thread_ts: root.ts, text: "`(binary upload)`" });
    await sleep(900);
    await slackUploadFile({ absPath, displayName: relPath, thread_ts: root.ts });
    await sleep(900);
    return;
  }

  const content = fs.readFileSync(absPath, "utf8");
  const chunks = chunkString(content, 6500);

  for (let i = 0; i < chunks.length; i++) {
    const label = chunks.length > 1 ? `_${relPath} (${i + 1}/${chunks.length})_\n` : "";
    const block = `\`\`\`\n${escapeTripleBackticks(chunks[i])}\n\`\`\``;
    await slackPost({ channel: SLACK_CHANNEL, thread_ts: root.ts, text: `${label}${block}` });
    await sleep(900);
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

async function main() {
  // Guardrails so this doesn’t “run” and do nothing while you wonder why.
  if (!["all", "changed", "missing"].includes(SYNC_MODE)) {
    throw new Error(`Invalid SYNC_MODE: ${SYNC_MODE}. Use "missing", "changed", or "all".`);
  }

  let targets = [];
  let modeLabel = "";
  let diffStat = "";

  if (SYNC_MODE === "all") {
    modeLabel = "FULL REPO";
    diffStat = safeGit(() => sh("git show --stat --oneline --no-color -1")) || "(full repo sync)";
    targets = getAllRepoFiles().map((p) => ({ status: "A", path: p }));
  }

  if (SYNC_MODE === "missing") {
    modeLabel = "MISSING FILES (BACKFILL)";
    diffStat = "(missing files backfill)";
    targets = getMissingTargetsFromRepo();
  }

  if (SYNC_MODE === "changed") {
    modeLabel = "CHANGED FILES";
    diffStat = safeGit(() => sh("git show --stat --oneline --no-color -1")) || "(changed files sync)";
    targets = getChangedFiles();
  }

  targets = targets.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`[sync] mode=${SYNC_MODE} targets=${targets.length}`);
  for (const t of targets) console.log(`[sync] ${t.status}\t${t.path}`);

  const summaryPost = await slackPost({
    channel: SLACK_CHANNEL,
    text: buildSummaryText({ diffStat, modeLabel }),
  });

  if (targets.length === 0) {
    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: summaryPost.ts,
      text: "No file changes detected.",
    });
    return;
  }

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

  const failures = [];

  for (const t of targets) {
    try {
      await postFileThread({
        relPath: t.path,
        status: t.status,
        summaryThreadTs: summaryPost.ts,
      });
    } catch (e) {
      failures.push({ path: t.path, error: String(e?.message || e) });
      console.error(`[sync] FAILED ${t.path}:`, e);

      if (STOP_ON_ERROR) throw e;

      // Keep going, because humans like progress.
      await sleep(1200);
    }
  }

  if (failures.length > 0) {
    const lines = [];
    lines.push(`*Failures:* ${failures.length}`);
    lines.push("```");
    for (const f of failures) lines.push(`${f.path}\n  ${f.error}`);
    lines.push("```");

    await slackPost({
      channel: SLACK_CHANNEL,
      thread_ts: summaryPost.ts,
      text: lines.join("\n"),
    });
  }

  console.log("Posted repo sync (summary + per-file threads).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
