# You.com Slack Bot

A Slack bot powered by the [You.com Search API](https://api.ydc-index.io) with two slash commands:

- `/yousearch [query]` — top 5 web results, formatted as a Slack Block Kit message
- `/youbrief [topic]` — 3-bullet briefing summarizing the latest on any topic

---

## Prerequisites

- Node.js 18+
- A [You.com API key](https://api.ydc-index.io)
- A Slack workspace where you can create apps
- A public HTTPS URL for your bot (see [Exposing locally](#exposing-locally) if running on your machine)

---

## 1. Create the Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it (e.g. `YouBot`) and pick your workspace → **Create App**

---

## 2. Set permissions (OAuth scopes)

In the left sidebar: **OAuth & Permissions** → scroll to **Bot Token Scopes** → **Add an OAuth Scope**:

| Scope | Why |
|---|---|
| `commands` | Required to receive slash command payloads |
| `chat:write` | Required to post messages back |

Then scroll up and click **Install to Workspace** → **Allow**.

Copy the **Bot User OAuth Token** (`xoxb-...`) — this is your `SLACK_BOT_TOKEN`.

---

## 3. Get your Signing Secret

**Basic Information** → **App Credentials** → copy **Signing Secret**.  
This is your `SLACK_SIGNING_SECRET`.

---

## 4. Expose your bot publicly

Slack requires a public HTTPS URL to deliver slash command payloads.

**Option A — ngrok (local dev, easiest):**
```bash
ngrok http 3001
# Grab the https://xxxx.ngrok-free.app URL
```

**Option B — Deploy** to Railway, Render, Fly.io, etc. and use the service URL.

Your request URL pattern will be:
```
https://your-domain.com/slack/events
```

---

## 5. Register the slash commands

In the left sidebar: **Slash Commands** → **Create New Command** (repeat for each):

### `/yousearch`

| Field | Value |
|---|---|
| Command | `/yousearch` |
| Request URL | `https://your-domain.com/slack/events` |
| Short Description | Search the web via You.com |
| Usage Hint | `[query]` |

### `/youbrief`

| Field | Value |
|---|---|
| Command | `/youbrief` |
| Request URL | `https://your-domain.com/slack/events` |
| Short Description | 3-bullet briefing on any topic |
| Usage Hint | `[topic]` |

Click **Save** after each.

---

## 6. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
YDC_API_KEY=...
PORT=3001
```

---

## 7. Install and run

```bash
npm install
node bot.js
```

Or with auto-reload during development:
```bash
npm run dev
```

---

## Usage

In any channel where the bot is present:

```
/yousearch Claude AI latest models
/youbrief generative AI funding 2026
```

Both commands post the result visibly in the channel.

---

## Troubleshooting

**`dispatch_failed` / 404 from Slack**  
Check that your Request URL is reachable and ends in `/slack/events`.

**`invalid_auth`**  
Verify `SLACK_BOT_TOKEN` starts with `xoxb-` and was copied after installing the app to your workspace.

**`invalid_signature`**  
`SLACK_SIGNING_SECRET` doesn't match. Re-copy from **Basic Information → App Credentials**.

**No results returned**  
The query may be too narrow. Try a broader term, or check your `YDC_API_KEY`.
