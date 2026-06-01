const { App } = require('@slack/bolt');
const fetch = require('node-fetch');

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  YDC_API_KEY,
  PORT = 3001,
} = process.env;

for (const [key, val] of Object.entries({ SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, YDC_API_KEY })) {
  if (!val) { console.error(`ERROR: ${key} is required`); process.exit(1); }
}

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

// ── You.com Search ────────────────────────────────────────────────────────────

async function youSearch(query, n = 5) {
  const url = `https://api.ydc-index.io/search?query=${encodeURIComponent(query)}&num_web_results=${n}`;
  const res = await fetch(url, { headers: { 'X-API-Key': YDC_API_KEY } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`You.com API ${res.status}: ${body || res.statusText}`);
  }
  const data = await res.json();
  // API returns { hits: [...] } or { results: { news: [...], web: [...] } }
  const hits = data.hits
    || data.results?.news
    || data.results?.web
    || [];
  return Array.isArray(hits) ? hits : [];
}

function hostname(urlStr) {
  try { return new URL(urlStr).hostname.replace('www.', ''); } catch { return urlStr; }
}

// ── Block Kit builders ────────────────────────────────────────────────────────

function buildSearchBlocks(query, hits) {
  if (hits.length === 0) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `:mag: *No results found for:* "${query}"\n\nTry a different search term.` },
      },
    ];
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Search: ${query}`, emoji: true },
    },
    { type: 'divider' },
  ];

  hits.slice(0, 5).forEach((hit, i) => {
    const title = hit.title || 'Untitled';
    const url = hit.url || hit.link || '';
    const snippet = hit.description || hit.snippet || '';
    const source = hostname(url);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${i + 1}. <${url}|${title}>*\n${snippet}`,
      },
    });

    if (source) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `:link: ${source}` }],
      });
    }

    if (i < hits.length - 1) blocks.push({ type: 'divider' });
  });

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: ':mag: Powered by *You.com*' }],
  });

  return blocks;
}

function buildBriefBlocks(topic, hits) {
  if (hits.length === 0) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `:memo: *No results found for:* "${topic}"\n\nTry a different topic.` },
      },
    ];
  }

  const bullets = hits.slice(0, 3).map(hit => {
    const title = hit.title || 'Untitled';
    const snippet = hit.description || hit.snippet || '';
    const url = hit.url || hit.link || '';
    const source = hostname(url);
    const text = snippet || title;
    return `• *<${url}|${title}>* — ${text}${source ? `  _(${source})_` : ''}`;
  });

  const sources = hits.slice(0, 3)
    .map(h => `<${h.url || h.link || ''}|${hostname(h.url || h.link || '')}>`)
    .filter(Boolean)
    .join('  ·  ');

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Briefing: ${topic}`, emoji: true },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: bullets.join('\n\n') },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `:newspaper: Sources: ${sources}` },
        { type: 'mrkdwn', text: ':mag: Powered by *You.com*' },
      ],
    },
  ];
}

// ── Commands ──────────────────────────────────────────────────────────────────

app.command('/yousearch', async ({ command, ack, respond }) => {
  await ack();
  const query = command.text.trim();

  if (!query) {
    await respond({ text: 'Usage: `/yousearch [query]` — e.g. `/yousearch AI funding 2026`' });
    return;
  }

  await respond({ text: `Searching for *${query}*…`, response_type: 'in_channel' });

  try {
    const hits = await youSearch(query, 5);
    const blocks = buildSearchBlocks(query, hits);
    await respond({ blocks, text: `Search results for: ${query}`, replace_original: true });
  } catch (err) {
    console.error('/yousearch error:', err);
    await respond({
      replace_original: true,
      text: `:warning: Search failed: ${err.message}`,
    });
  }
});

app.command('/youbrief', async ({ command, ack, respond }) => {
  await ack();
  const topic = command.text.trim();

  if (!topic) {
    await respond({ text: 'Usage: `/youbrief [topic]` — e.g. `/youbrief generative AI market`' });
    return;
  }

  await respond({ text: `Generating briefing on *${topic}*…`, response_type: 'in_channel' });

  try {
    const hits = await youSearch(`${topic} latest news 2026`, 3);
    const blocks = buildBriefBlocks(topic, hits);
    await respond({ blocks, text: `Briefing on: ${topic}`, replace_original: true });
  } catch (err) {
    console.error('/youbrief error:', err);
    await respond({
      replace_original: true,
      text: `:warning: Brief failed: ${err.message}`,
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

(async () => {
  await app.start(PORT);
  console.log(`You.com Slack bot running on port ${PORT}`);
})();
