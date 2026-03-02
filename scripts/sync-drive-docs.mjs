import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const FULL_SYNC = String(process.env.FULL_SYNC || "false").toLowerCase() === "true";
const GITHUB_BEFORE = process.env.GITHUB_BEFORE || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_SHA = process.env.GITHUB_SHA || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL; // channel ID like C0123ABCDEF

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

async function slackPost({ text, thread_ts }) {
  const body = { channel: SLACK_CHANNEL, text };
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
 * - files.getUploadURLExternal
 * - PUT bytes to upload_url
 * - files.completeUploadExternal
 */
async function slackUploadFile({ absPath, displayName, thread_ts }) {
  const buf = fs.readFileSync(absPath);
  const filename = displayName || path.basename(absPath);

  const urlRes = await fetch("https://slack.com/api/files.getUploadURLExternal", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      filename,
      length: buf.length,
    }),
  });

  const urlData = await urlRes.json().catch(() => null);
  if (!urlRes.ok || !urlData?.ok) {
    throw new Error(`Slack getUploadURLExternal failed: ${urlRes.status} ${JSON.stringify(urlData)}`);
  }

  const putRes = await fetch(urlData.upload_url, {
    method: "PUT",
    body: buf,
  });
  if (!putRes.ok) {
    throw new Error(`Slack upload PUT failed: ${putRes.status}`);
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
  // Use name-status so we can detect deletes.
  // Prefer GITHUB_BEFORE from push event; fall back to last commit.
  let before = GITHUB_BEFORE;
  if (!before || before === "0000000000000000000000000000000000000000") {
    // Likely first push or unknown "before"; just treat it as a full sync-ish delta from HEAD~1.
    before = "";
  }

  const range = before ? `${before}..${GITHUB_SHA}` : "HEAD~1..HEAD";
  const lines = sh(`git diff --name-status ${range}`).split("\n").filter(Boolean);

  const entries = [];
  for (const line of lines) {
    // Examples:
    // A  path
    // M  path
    // D  path
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

  // De-dupe by path, prefer non-delete if both appear.
  const map = new Map();
  for (const e of entries) {
    const prev = map.get(e.path);
    if (!prev) map.set(e.path, e);
    else if (prev.status === "D" && e.status !== "D") map.set(e.path, e);
  }

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

async function postTextFile({ relPath, absPath, thread_ts }) {
  const content = fs.readFileSync(absPath, "utf8");
  const chunks = chunkString(content, 8000);

  await slackPost({ text: `*${relPath}*`, thread_ts });
  await sleep(1100);

  for (let i = 0; i < chunks.length; i++) {
    const label = chunks.length > 1 ? `\n_${relPath} (${i + 1}/${chunks.length})_\n` : "";
    const block = `\`\`\`\n${escapeTripleBackticks(chunks[i])}\n\`\`\``;
    await slackPost({ text: `${label}${block}`, thread_ts });
    await sleep(1100);
  }
}

async function postBinaryFile({ relPath, absPath, thread_ts }) {
  await slackPost({ text: `*${relPath}* (binary upload)`, thread_ts });
  await sleep(1100);
  await slackUploadFile({ absPath, displayName: relPath, thread_ts });
  await sleep(1100);
}

async function main() {
  const shortSha = GITHUB_SHA ? GITHUB_SHA.slice(0, 12) : "";
  const repoLabel = GITHUB_REPO || "repo";
  const marker = `LATEST SNAPSHOT: ${repoLabel}${shortSha ? ` @ ${shortSha}` : ""}`;

  const commitUrl =
    GITHUB_REPO && GITHUB_SHA ? `https://github.com/${GITHUB_REPO}/commit/${GITHUB_SHA}` : "";
  const commitMsg = sh("git log -1 --pretty=%B");
  const diffStat = sh("git show --stat --oneline --no-color -1");

  // Parent summary
  const summaryLines = [];
  summaryLines.push(marker);
  summaryLines.push("");
  summaryLines.push(FULL_SYNC ? "*Mode:* FULL REPO POST" : "*Mode:* CHANGED FILES ONLY");
  if (commitUrl) summaryLines.push(`Commit: ${commitUrl}`);
  if (commitMsg) summaryLines.push(`Message: ${commitMsg}`);
  summaryLines.push("");
  summaryLines.push("```");
  summaryLines.push(escapeTripleBackticks(diffStat));
  summaryLines.push("```");

  const summaryPost = await slackPost({ text: summaryLines.join("\n") });

  const thread_ts = summaryPost.ts;

  const targets = FULL_SYNC ? getAllRepoFiles().map((p) => ({ status: "A", path: p })) : getChangedFiles();

  if (targets.length === 0) {
    await slackPost({ text: "No file changes detected.", thread_ts });
    return;
  }

  for (const t of targets) {
    const relPath = t.path;
    const absPath = path.join(process.cwd(), relPath);

    if (t.status === "D") {
      await slackPost({ text: `*${relPath}* (deleted)`, thread_ts });
      await sleep(1100);
      continue;
    }

    if (!fs.existsSync(absPath)) {
      await slackPost({ text: `*${relPath}* (missing in checkout)`, thread_ts });
      await sleep(1100);
      continue;
    }

    if (isBinaryByExt(relPath)) {
      await postBinaryFile({ relPath, absPath, thread_ts });
    } else {
      await postTextFile({ relPath, absPath, thread_ts });
    }
  }

  console.log("Posted repo sync to Slack.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
