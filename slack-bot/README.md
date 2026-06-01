# You.com Slack Bot

A Slack bot powered by the [You.com Search API](https://api.ydc-index.io) with two slash commands:

- `/yousearch [query]` — top 5 web results as a Slack Block Kit message
- `/youbrief [topic]` — 3-bullet briefing summarizing the latest on any topic

Runs locally via **Socket Mode** — no public URL or ngrok required.

---

## Prerequisites

- Node.js 18+
- A [You.com API key](https://api.ydc-index.io)
- A Slack workspace where you can create apps

---

## 1. Create the Slack App from manifest

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**
2. Pick your workspace → **Next**
3. Select the **YAML** tab and paste the contents of `manifest.yaml` → **Next** → **Create**
4. Click **Install to Workspace** → **Allow**

---

## 2. Collect your credentials

### Bot Token
**OAuth & Permissions** → copy **Bot User OAuth Token** (`xoxb-...`) → `SLACK_BOT_TOKEN`

### Signing Secret
**Basic Information** → **App Credentials** → copy **Signing Secret** → `SLACK_SIGNING_SECRET`

### App-Level Token (Socket Mode)
**Basic Information** → scroll to **App-Level Tokens** → **Generate Token and Scopes**
- Name it anything (e.g. `socket`)
- Add scope: `connections:write`
- **Generate** → copy the token (`xapp-...`) → `SLACK_APP_TOKEN`

---

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
YDC_API_KEY=...
```

---

## 4. Install and run

```bash
npm install
node bot.js
```

You should see:
```
You.com Slack bot connected via Socket Mode
```

---

## Usage

In any channel in your workspace:

```
/yousearch Claude AI latest models
/youbrief generative AI funding 2026
```

Both commands post results visibly in the channel.

---

## Troubleshooting

**`invalid_auth`** — verify `SLACK_BOT_TOKEN` starts with `xoxb-` and was copied after installing to your workspace.

**`no token provided` / app token error** — verify `SLACK_APP_TOKEN` starts with `xapp-` and has the `connections:write` scope.

**Commands not appearing in Slack** — make sure you installed the app to your workspace after creating it (Step 1, last bullet).

**No results returned** — try a broader query, or check your `YDC_API_KEY`.
