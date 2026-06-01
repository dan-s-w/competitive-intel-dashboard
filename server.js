const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;
const CACHE_TTL_MS = 15 * 60 * 1000;

const API_KEY = process.env.YDC_API_KEY || process.env.YOU_API_KEY;
if (!API_KEY) {
  console.error('ERROR: YDC_API_KEY or YOU_API_KEY environment variable is required');
  process.exit(1);
}

const cache = new Map();

function getCacheKey(competitor) {
  return competitor.trim().toLowerCase();
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

async function fetchCompetitorData(competitor) {
  const key = getCacheKey(competitor);
  if (isCacheValid(cache.get(key))) {
    return { ...cache.get(key), fromCache: true };
  }

  const query = `${competitor} latest news product launch funding 2026`;
  const url = `https://ydc-index.io/v1/search?query=${encodeURIComponent(query)}&num_web_results=3`;

  const response = await fetch(url, {
    headers: { 'X-API-Key': API_KEY }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${body || response.statusText}`);
  }

  const data = await response.json();

  // API returns { results: { news: [...], web: [...], ... } }
  const raw = data.results?.news || data.results?.web || data.hits || [];
  const hits = (Array.isArray(raw) ? raw : []).slice(0, 3).map(r => ({
    title: r.title || r.name || 'Untitled',
    snippet: r.description || r.snippet || r.body || '',
    url: r.url || r.link || '#',
    source: (() => {
      try { return new URL(r.url || r.link || '').hostname.replace('www.', ''); } catch { return ''; }
    })()
  }));

  const entry = { competitor, hits, timestamp: Date.now(), fromCache: false };
  cache.set(key, entry);
  return entry;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/search', async (req, res) => {
  const { competitors } = req.body;
  if (!Array.isArray(competitors) || competitors.length === 0) {
    return res.status(400).json({ error: 'competitors array required' });
  }

  const results = await Promise.allSettled(
    competitors.slice(0, 5).map(name => fetchCompetitorData(name))
  );

  const response = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return { status: 'ok', ...result.value };
    } else {
      return { status: 'error', competitor: competitors[i], error: result.reason?.message || 'Unknown error' };
    }
  });

  res.json(response);
});

app.post('/api/refresh', (req, res) => {
  cache.clear();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Competitive Intel Dashboard running at http://localhost:${PORT}`);
});
