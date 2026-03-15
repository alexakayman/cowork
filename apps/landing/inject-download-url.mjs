#!/usr/bin/env node
/**
 * Injects download URL into index.html (replaces __DOWNLOAD_URL__).
 * Default: GitHub Releases latest asset (https://github.com/OWNER/REPO/releases/latest/download/ASSET).
 * Override: set DOWNLOAD_URL in env (e.g. Vercel Blob) to use a custom URL.
 * Run from repo root or from apps/landing (Vercel Root Directory).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = existsSync("index.html") ? "index.html" : join(__dirname, "index.html");
if (!existsSync(htmlPath)) {
  console.error("inject-download-url: index.html not found at", htmlPath);
  process.exit(1);
}

const GITHUB_LATEST_DMG =
  "https://github.com/alexakayman/cowork/releases/latest/download/Cowork-macos.dmg";
const url = process.env.DOWNLOAD_URL || GITHUB_LATEST_DMG;
let html = readFileSync(htmlPath, "utf8");
html = html.replace(/__DOWNLOAD_URL__/g, url);
writeFileSync(htmlPath, html);
