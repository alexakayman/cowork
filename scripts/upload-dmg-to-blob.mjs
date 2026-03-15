#!/usr/bin/env node
/**
 * Upload Cowork-macos.dmg to Vercel Blob (public).
 * Usage: node scripts/upload-dmg-to-blob.mjs [path-to.dmg]
 * Or set DMG_PATH. Requires BLOB_READ_WRITE_TOKEN.
 * Outputs the public URL to stdout (and logs) for use as DOWNLOAD_URL on the landing.
 */
import { put } from "@vercel/blob";
import { readFileSync } from "fs";

const path = process.argv[2] || process.env.DMG_PATH;
if (!path) {
  console.error("Usage: node scripts/upload-dmg-to-blob.mjs <path-to.dmg>");
  process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("BLOB_READ_WRITE_TOKEN is required. Create a Blob store in Vercel and add the token.");
  process.exit(1);
}

const pathname = "Cowork-macos.dmg";
const body = readFileSync(path);

const blob = await put(pathname, body, {
  access: "public",
  allowOverwrite: true,
  token,
  contentType: "application/octet-stream",
});

console.error("Uploaded to Vercel Blob:", blob.url);
console.log(blob.url);
