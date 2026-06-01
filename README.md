# Competitive Intelligence Dashboard

A lightweight web app that pulls recent news for up to 5 competitors at once using the You.com Search API, displayed in a dark-themed card grid.

## What it does

- Enter up to 5 competitor names and click **Search**
- Fetches the top 3 recent news results per competitor (product launches, funding, announcements)
- Displays results in a card grid with title, snippet, source, and link
- Server-side cache with a 15-minute TTL — repeated searches return instantly
- **Refresh All** clears the cache and re-fetches live results
- Per-column error state if any individual API call fails

## Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS, no build step
- **Search API:** [You.com Search API](https://ydc-index.io)

## Requirements

- Node.js 18+
- A You.com API key (`YDC_API_KEY`)

## Setup

```bash
# Install dependencies
npm install

# Start the server
YDC_API_KEY=your_api_key_here node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `YDC_API_KEY` | Your You.com Search API key (required) |

## Project structure

```
├── server.js        # Express server + API proxy + in-memory cache
├── public/
│   └── index.html   # Single-page frontend
├── package.json
└── .gitignore
```
