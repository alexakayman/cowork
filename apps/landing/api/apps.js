/**
 * GET: return list of recognized apps (from Vercel Blob or seed).
 * POST: append { appName, category } to list (approved by default), return updated list.
 * Requires BLOB_READ_WRITE_TOKEN for persistence; falls back to seed if missing.
 */
import { put, get } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const BLOB_KEY = 'cowork-apps.json';
const CATEGORIES = [
  'coding', 'browsing', 'writing', 'email', 'designing',
  'communicating', 'spreadsheet', 'meeting', 'terminal', 'media',
];

function getSeedPath() {
  const d = dirname(fileURLToPath(import.meta.url));
  return join(d, '..', 'data', 'apps.json');
}

function loadSeed() {
  const p = getSeedPath();
  if (!existsSync(p)) return [];
  try {
    const raw = readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getStoredList() {
  try {
    const blob = await get(BLOB_KEY);
    if (!blob || !blob.url) return null;
    const res = await fetch(blob.url);
    const text = await res.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function saveList(list) {
  await put(BLOB_KEY, JSON.stringify(list, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    let list = await getStoredList();
    if (!list || list.length === 0) {
      list = loadSeed();
      if (list.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          await saveList(list);
        } catch (_) {}
      }
    }
    return res.status(200).json(list);
  }

  // POST
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const appName = typeof body.appName === 'string' ? body.appName.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : '';
  if (!appName) {
    return res.status(400).json({ error: 'appName is required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  let list = await getStoredList();
  if (!list || list.length === 0) list = loadSeed();
  const existing = list.find(
    (a) => a.appName.toLowerCase() === appName.toLowerCase()
  );
  if (existing) {
    existing.category = category;
  } else {
    list.push({ appName, category });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await saveList(list);
    } catch (e) {
      console.error('Blob save failed:', e);
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(200).json(list);
}
