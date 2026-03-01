import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_SHA = process.env.GITHUB_SHA || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL; // Use channel ID like C0123ABCDEF

if (!SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN");
if (!SLACK_CHANNEL) throw new Error("Missing SLACK_CHANNEL");

function clamp(s, max) {
  const t = String(s || "");
  return t.length > max ? `${t.slice(0, max)}\n…(truncated)` : t;
}

function escapeTripleBackticks(s) {
  return String(s || "").replace(/```/g, "`\u200b``");
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeRead(relPath) {
  const abs = path.join(process.cwd(), relPath);
  if (!fs.existsSync(abs)) return { ok: false, relPath, content: "" };
  return { ok: true, relPath, content: fs.readFileSync(abs, "utf8") };
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

// Keep the file list alphabetical.
const FILES = [
  "lp/va-starter-track/README.md",
  "workers/src/index.js",
  "wrangler.toml",
].sort((a, b) => a.localeCompare(b));

const shortSha = GITHUB_SHA ? GITHUB_SHA.slice(0, 12) : "";
const commitUrl =
  GITHUB_REPO && GITHUB_SHA ? `https://github.com/${GITHUB_REPO}/commit/${GITHUB_SHA}` : "";

const commitMsg = clamp(sh("git log -1 --pretty=%B"), 300);
const diffStat = clamp(sh("git show --stat --oneline --no-color -1"), 1800);
const repoLabel = GITHUB_REPO || "repo";
const marker = `LATEST SNAPSHOT: ${repoLabel}${shortSha ? ` @ ${shortSha}` : ""}`;

// Message 1: summary (parent message)
const summaryLines = [];
summaryLines.push(marker);
summaryLines.push("");
summaryLines.push("*Repo sync update*");
if (commitUrl) summaryLines.push(`Commit: ${commitUrl}`);
if (!commitUrl && shortSha) summaryLines.push(`Commit: ${shortSha}`);
if (commitMsg) summaryLines.push(`Message: ${commitMsg}`);
summaryLines.push("");
summaryLines.push("```");
summaryLines.push(escapeTripleBackticks(diffStat));
summaryLines.push("```");

const summaryPost = await slackPost({
  channel: SLACK_CHANNEL,
  text: summaryLines.join("\n"),
});

// Message 2: canonical sources (thread reply)
const sourcesLines = [];
sourcesLines.push(marker);
sourcesLines.push("");
sourcesLines.push("*Canonical sources (latest)*");
if (commitUrl) sourcesLines.push(`Commit: ${commitUrl}`);
sourcesLines.push("");

for (const relPath of FILES) {
  const r = safeRead(relPath);
  sourcesLines.push(`*${relPath}*`);

  if (!r.ok) {
    sourcesLines.push("`(missing)`");
    sourcesLines.push("");
    continue;
  }

  // Slack message size limits are annoying. Keep each file snippet reasonable.
  const snippet = clamp(r.content, 3500);

  sourcesLines.push("```");
  sourcesLines.push(escapeTripleBackticks(snippet));
  sourcesLines.push("```");
  sourcesLines.push("");
}

await slackPost({
  channel: SLACK_CHANNEL,
  text: sourcesLines.join("\n"),
  thread_ts: summaryPost.ts,
});

console.log("Posted repo sync (summary + canonical sources).");
