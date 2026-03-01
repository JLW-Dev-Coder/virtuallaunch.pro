import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_SHA = process.env.GITHUB_SHA || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

if (!SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN");
if (!SLACK_CHANNEL) throw new Error("Missing SLACK_CHANNEL");

function clamp(s, max) {
  const t = String(s || "");
  return t.length > max ? `${t.slice(0, max)}\n…(truncated)` : t;
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeRead(relPath) {
  const abs = path.join(process.cwd(), relPath);
  if (!fs.existsSync(abs)) return { ok: false, relPath, content: "" };
  return { ok: true, relPath, content: fs.readFileSync(abs, "utf8") };
}

async function slackPost({ channel, text }) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(`Slack post failed: ${res.status} ${JSON.stringify(data)}`);
}

function escapeTripleBackticks(s) {
  return String(s || "").replace(/```/g, "`\u200b``");
}

// Keep the file list alphabetical.
const FILES = [
  "README.md",
  "workers/api/src/index.js",
  "workers/api/wrangler.toml",
].sort((a, b) => a.localeCompare(b));

const shortSha = GITHUB_SHA ? GITHUB_SHA.slice(0, 7) : "";
const commitUrl = GITHUB_REPO && GITHUB_SHA ? `https://github.com/${GITHUB_REPO}/commit/${GITHUB_SHA}` : "";

const commitMsg = clamp(sh("git log -1 --pretty=%B"), 300);
const diffStat = clamp(sh("git show --stat --oneline --no-color -1"), 1800);

// Message 1: summary
{
  const lines = [];
  lines.push("*Repo sync update*");
  if (commitUrl) lines.push(`Commit: ${commitUrl}`);
  if (!commitUrl && shortSha) lines.push(`Commit: ${shortSha}`);
  if (commitMsg) lines.push(`Message: ${commitMsg}`);
  lines.push("");
  lines.push("```");
  lines.push(escapeTripleBackticks(diffStat));
  lines.push("```");

  await slackPost({ channel: SLACK_CHANNEL, text: lines.join("\n") });
}

// Message 2: canonical source bundle (snippets to avoid Slack limits)
{
  const lines = [];
  lines.push("*Canonical sources (latest)*");
  if (commitUrl) lines.push(`Commit: ${commitUrl}`);
  lines.push("");

  for (const relPath of FILES) {
    const r = safeRead(relPath);
    lines.push(`*${relPath}*`);
    if (!r.ok) {
      lines.push("`(missing)`");
      lines.push("");
      continue;
    }

    // Slack hard-limits message size; keep per-file chunks reasonable.
    const snippet = clamp(r.content, 3500);
    lines.push("```");
    lines.push(escapeTripleBackticks(snippet));
    lines.push("```");
    lines.push("");
  }

  await slackPost({ channel: SLACK_CHANNEL, text: lines.join("\n") });
}

console.log("Posted repo sync (summary + canonical sources).");
