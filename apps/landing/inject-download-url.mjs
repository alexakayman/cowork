#!/usr/bin/env node
/**
 * Injects DOWNLOAD_URL env into index.html (replaces __DOWNLOAD_URL__).
 * Run at build time on Vercel; set DOWNLOAD_URL in project env to your Vercel Blob public URL.
 * Run from repo root or from apps/landing (Vercel Root Directory).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = existsSync("index.html") ? "index.html" : join(__dirname, "index.html");
const url = process.env.DOWNLOAD_URL || "#";
let html = readFileSync(htmlPath, "utf8");
html = html.replace(/__DOWNLOAD_URL__/g, url);
writeFileSync(htmlPath, html);
