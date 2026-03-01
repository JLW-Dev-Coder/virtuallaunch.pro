import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { google } from "googleapis";

function mustGetEnv(k) {
  const v = String(process.env[k] || "").trim();
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}

function readFileOrThrow(p) {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return { abs, stream: fs.createReadStream(abs) };
}

async function findFileIdByName({ drive, folderId, name }) {
  const q = [
    `'${folderId}' in parents`,
    `name='${name.replace(/'/g, "\\'")}'`,
    "trashed=false",
  ]
    .sort()
    .join(" and ");

  const res = await drive.files.list({
    fields: "files(id,name)",
    pageSize: 10,
    q,
  });

  const files = Array.isArray(res.data.files) ? res.data.files : [];
  return files.length ? files[0].id : null;
}

async function createOrUpdate({ drive, folderId, mimeType, name, stream }) {
  const existingId = await findFileIdByName({ drive, folderId, name });

  if (existingId) {
    await drive.files.update({
      fileId: existingId,
      media: { mimeType, body: stream },
    });
    return { action: "updated", id: existingId, name };
  }

  const created = await drive.files.create({
    fields: "id,name",
    requestBody: {
      mimeType,
      name,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
  });

  return { action: "created", id: created.data.id, name };
}

async function main() {
  const folderId = mustGetEnv("DRIVE_FOLDER_ID");

  const saJson = mustGetEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  const creds = JSON.parse(saJson);

  const readmePath = mustGetEnv("README_PATH");
  const workerPath = mustGetEnv("WORKER_PATH");

  const readmeDriveName = mustGetEnv("README_DRIVE_NAME");
  const workerDriveName = mustGetEnv("WORKER_DRIVE_NAME");

  const { stream: readmeStream } = readFileOrThrow(readmePath);
  const { stream: workerStream } = readFileOrThrow(workerPath);

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ auth, version: "v3" });

  const results = [];
  results.push(
    await createOrUpdate({
      drive,
      folderId,
      mimeType: "text/markdown",
      name: readmeDriveName,
      stream: readmeStream,
    }),
  );
  results.push(
    await createOrUpdate({
      drive,
      folderId,
      mimeType: "text/javascript",
      name: workerDriveName,
      stream: workerStream,
    }),
  );

  results
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .forEach((r) => console.log(`${r.action}: ${r.name} (${r.id})`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
