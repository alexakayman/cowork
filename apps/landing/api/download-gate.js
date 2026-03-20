/**
 * POST /api/download-gate
 * Unlocks the landing page download button after a user submits an email.
 *
 * We store ONLY a SHA-256 hash of the normalized email in Vercel Blob.
 * The raw email is never stored.
 */
import { put, get } from "@vercel/blob";
import { createHash } from "crypto";

const BLOB_KEY = "cowork-download-gate-hashes.json";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  // Simple, pragmatic validation for a signup gate.
  // (Not security-critical; backend still treats input as untrusted.)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function loadHashStore() {
  const blob = await get(BLOB_KEY);
  if (!blob || !blob.url) return {};

  const res = await fetch(blob.url);
  if (!res.ok) return {};

  const text = await res.text();
  const data = JSON.parse(text);
  return data && typeof data === "object" ? data : {};
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Misconfiguration: without this token we can't persist unlocks.
    return res.status(503).json({ error: "Server not configured for storage" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const emailRaw = body?.email;
  const email = normalizeEmail(emailRaw);
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const hash = createHash("sha256").update(email).digest("hex");

  try {
    const store = await loadHashStore();
    const now = Date.now();

    if (!store[hash]) {
      store[hash] = { createdAt: now };
    }

    await put(BLOB_KEY, JSON.stringify(store, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("download-gate: failed:", e);
    return res.status(500).json({ error: "Failed to save unlock" });
  }
}

