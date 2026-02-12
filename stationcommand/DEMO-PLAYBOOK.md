# Station Command — Demo Playbook

> **What you're building live**: A real-time fuel station operations dashboard that updates every 3 seconds with simulated station data, while 1000 audience members vote on their phones for which feature you build next.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRE-BUILT (ready to go)                   │
├──────────────────────────────────────────────────────────────────┤
│  server.js        Zero-dependency Node WebSocket server          │
│                   • 8 simulated fuel stations with live data     │
│                   • KPI aggregation (transactions, revenue, etc) │
│                   • Hourly revenue with bell-curve distribution   │
│                   • Feature voting + suggestion system            │
│                   • Alert generation engine                       │
│                   • Tunnel URL support (/api/tunnel)              │
│                                                                  │
│  mobile.html      Audience phone interface                       │
│                   • Live dashboard stats (mini KPI cards)         │
│                   • Feature vote buttons (toggle upvote)          │
│                   • "Suggest a feature" text input                │
│                   • Latest alert feed                             │
│                   • Auto-reconnecting WebSocket                   │
│                                                                  │
│  start.sh         Server + tunnel launcher (ngrok/cloudflared)   │
├──────────────────────────────────────────────────────────────────┤
│                     LIVE-CODED ON STAGE  ←  this is the demo     │
├──────────────────────────────────────────────────────────────────┤
│  display.html     Full-screen operations dashboard               │
│                   • 4 KPI cards with animated counters            │
│                   • Chart.js hourly revenue line chart            │
│                   • 8-station grid with status dots + pump bars   │
│                   • Scrolling alert feed with type indicators     │
│                   • Audience feature vote leaderboard             │
│                   • QR code overlay (press Q)                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Pre-Demo Checklist

- [ ] Run `./start.sh` — confirm server starts and tunnel URL appears
- [ ] Open `http://localhost:3000` in browser — verify display loads
- [ ] Open `<tunnel-url>/mobile.html` on your phone — verify voting works
- [ ] Press **Q** on display — confirm QR code shows the public URL
- [ ] Press **R** to reset data — fresh state for demo
- [ ] Have a backup copy of the finished `display.html` ready in case of emergency
- [ ] Test internet connectivity (tunnel needs it)
- [ ] Close unnecessary browser tabs (performance)

---

## Tunnel Setup

| Tool | Install | Speed | Notes |
|------|---------|-------|-------|
| **ngrok** (recommended) | `brew install ngrok` | Fast, reliable | Needs free account + `ngrok config add-authtoken` |
| **cloudflared** | `brew install cloudflared` | Fast, no signup | Random subdomain each time |
| **localtunnel** | `npx localtunnel` (auto) | Slower | Shows "click to continue" page on first visit |

`start.sh` auto-detects whichever is installed. Tunnel URL is automatically injected into the server and appears in the QR code.

---

## Demo Script (15 minutes)

### Minute 0–1: Setup & Hook

**Say**: _"Let's build something our industry actually uses — a real-time operations dashboard for fuel stations. I've got a server simulating 8 stations with live data. I'm going to build the entire display from scratch using AI."_

- Server should already be running
- Browser open to a blank or placeholder page
- Show QR code: **"Scan this QR code with your phone — you'll be able to vote on what feature I build next."**

### Minute 1–2: Show the Mobile Page

- Show your phone on screen (screen share or point camera)
- **Say**: _"This is what everyone's seeing on their phones — live stats and a list of features to vote on. Your votes show up in real-time on the dashboard."_

### Minute 2–8: Live-Code the Dashboard (Prompt 1 → Prompt 2)

- Paste **Prompt 1** (Foundation) into Claude Code / Windsurf / Cascade
- Watch the KPI cards, chart, and station grid appear
- **Say**: _"Look at that — 4 KPI cards, a revenue chart, and 8 station tiles with real-time status, all updating every 3 seconds."_

- Paste **Prompt 2** (Alerts + Feature Votes)
- **Say**: _"Now we're adding the alert feed and — here's the cool part — the live leaderboard of YOUR votes. Check your phones — the top-voted feature is..."_

### Minute 8–11: Audience-Driven Build (Prompt 3)

- Look at the leaderboard: **"The audience has spoken! The #1 feature is ___. Let's build it right now."**
- Paste **Prompt 3** with the winning feature
- This is the "wow" moment — the audience directly shaped what got built

### Minute 11–13: Polish & QR Reminder

- Press **Q** to show QR code again
- **"If you haven't voted yet, scan now — we might squeeze in one more feature!"**
- Press **F** for fullscreen — show the complete dashboard

### Minute 13–15: Wrap Up

- **Say**: _"In 15 minutes, we went from nothing to a live operations dashboard — built by AI, directed by you. This is what vibe coding looks like. The entire display was generated live."_

---

## Staged Prompts

### Prompt 1 — Foundation (KPI Cards + Chart + Station Grid)

```
Create a file called `display.html` — a full-screen dark-themed fuel station operations dashboard.

**Tech**: Single HTML file, inline CSS + JS. Use Chart.js from CDN:
https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js

**WebSocket**: Connect to ws://localhost:3000. On open, send:
{ "type": "join", "role": "display" }

The server sends messages of type "dashboard" with this shape:
{
  "type": "dashboard",
  "stations": [{ "id", "name", "status" (online|warning|offline), "totalPumps", "activePumps", "todayTransactions", "todayRevenue", "fuelPrices": { "Regular", "Premium", "Diesel", "EV Charge" }, "utilizationPct" }],
  "hourlyRevenue": [{ "hour", "label", "revenue" }],  // 24 entries
  "alerts": [{ "id", "type" (warning|success|info), "text", "time" }],
  "kpis": { "transactions", "revenue", "activePumps", "pumpUtilization", "avgPrice" },
  "features": [{ "id", "text", "votes" }],
  "stats": { "connectedUsers", "totalFeatureVotes" }
}

**Layout** (CSS Grid, dark background #0a0e17):
1. **Top bar**: Logo "⛽ Station Command", LIVE badge with pulsing green dot, audience count, clock
2. **KPI row** (4 cards): Transactions Today, Total Revenue ($), Active Pumps, Avg Fuel Price
   - Each card has a colored top accent bar (blue, green, cyan, orange)
   - Animated counting effect when values change
3. **Revenue chart** (left half): Chart.js line chart with hourly revenue data, dark theme, gradient fill
4. **Station grid** (right half): 2×4 grid of station tiles, each with:
   - Station name + status dot (green/yellow/red with glow)
   - Stats: pumps (active/total), transactions, revenue
   - Utilization bar (colored by status)

**Design**: Dark theme (#0a0e17 bg, #111827 surfaces, #1e293b borders), Inter font, tabular-nums for numbers. Auto-reconnect WebSocket on disconnect. Data refreshes every 3s from server.
```

### Prompt 2 — Alerts + Feature Vote Leaderboard

```
Update display.html to add two new panels below the chart and station grid:

**Left panel — Live Alerts**:
- Shows the 5 most recent alerts from the `alerts` array
- Each alert has: colored left border (yellow=warning, green=success, blue=info), icon, text, time ago
- Slide-in animation for new alerts

**Right panel — Audience Feature Votes**:
- Shows the `features` array sorted by votes (highest first)
- Each feature shows: rank number (#1 highlighted in blue), feature text, progress bar, vote count
- Progress bar width = (votes / maxVotes) × 100%
- Header shows "Press Q to show QR"

Also add a **QR code overlay** (toggle with Q key):
- Uses QRCode.js from CDN: https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
- Fetches the URL from GET /api/info → uses `url` field + "/mobile.html"
- Dark overlay with centered white QR card, title "Vote on Features", subtitle
- Shows tunnel badge if tunnelUrl is present
- Polls /api/info every 5 seconds to detect URL changes

**Keyboard shortcuts**: Q = QR, F = fullscreen, R = reset, Escape = close overlay
```

### Prompt 3 — Build the Winning Feature (template)

Use whichever feature wins the audience vote. Here are pre-written prompts for the most likely winners:

**If "Dark / Light mode toggle" wins:**
```
Add a dark/light mode toggle to the Station Command dashboard. Place a toggle button in the top bar. Light mode: white background (#f8fafc), light surfaces (#ffffff), dark text (#0f172a). Smoothly transition all colors with CSS transitions (0.3s). Save preference. Toggle with keyboard shortcut 'T'.
```

**If "Animated alert banner" wins:**
```
Add a scrolling alert banner at the very top of the dashboard (above the top bar). It shows the latest critical alert in an amber/red horizontal banner that slides in from the right, stays 5 seconds, then slides out left. Auto-cycles through recent alerts. Include a close button. Use CSS @keyframes for the slide animation.
```

**If "Revenue sparkline chart" wins:**
```
Add mini sparkline charts inside each of the 4 KPI cards. For the revenue card, show a small 60px-tall line chart of the last 6 hours of revenue. For transactions, show a bar sparkline. For pumps, show a gauge arc (active/total). For price, show a small up/down arrow with the trend. Use Canvas API for the sparklines (no extra libraries).
```

**If "Station drill-down detail panel" wins:**
```
Make station tiles clickable. When clicked, show a full-screen overlay panel for that station with: large station name + status, all 4 fuel prices in a grid, pump-by-pump status (individual colored dots), a mini revenue chart for just that station, and a close button. Slide in from the right with CSS transform. Close with Escape key.
```

**If "Real-time pump utilisation bars" wins:**
```
Replace the simple pump bar in each station tile with an animated multi-segment bar showing individual pump states. Each pump is a small colored segment (green=active, yellow=in-use, red=offline). Add a subtle pulse animation to active pumps. Show "X/Y pumps active" below. Make the bars update smoothly with CSS transitions.
```

**If "Fuel price comparison widget" wins:**
```
Add a new panel at the bottom of the dashboard showing a horizontal grouped bar chart comparing fuel prices across all 8 stations. Group by fuel type (Regular, Premium, Diesel). Color-code by fuel type. Highlight the cheapest station for each fuel type with a star icon. Update live as prices change. Use Chart.js horizontal bar chart type.
```

---

## Nuclear Mega-Prompt (single-shot fallback)

If staged prompts aren't working or you're short on time, paste this single prompt:

```
Create `display.html` — a full-screen, real-time fuel station operations dashboard. Single HTML file with inline CSS and JS.

**CDN libraries** (load via script tags):
- Chart.js: https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js
- QRCode.js: https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js

**WebSocket protocol**: Connect to ws://localhost:3000. Send on open: { "type": "join", "role": "display" }

Server pushes messages like:
{
  "type": "dashboard",
  "stations": [{ "id", "name", "status" ("online"|"warning"|"offline"), "totalPumps", "activePumps", "todayTransactions", "todayRevenue", "fuelPrices": { "Regular", "Premium", "Diesel", "EV Charge" }, "utilizationPct" }],
  "hourlyRevenue": [{ "hour", "label" ("HH:00"), "revenue" }],
  "alerts": [{ "id", "type" ("warning"|"success"|"info"), "text", "time" }],
  "kpis": { "transactions", "revenue", "activePumps", "pumpUtilization", "avgPrice" },
  "features": [{ "id", "text", "votes" }],
  "stats": { "connectedUsers", "totalFeatureVotes" }
}

**FULL LAYOUT** (CSS Grid, 100vh, no scroll):

1. **Top bar**: Logo (⛽ emoji in gradient square), "Station Command" title, LIVE badge (green pulsing dot), "[N] audience connected", HH:MM:SS clock.

2. **KPI row** (4 cards spanning full width):
   - Transactions Today (blue accent) | Total Revenue $ (green) | Active Pumps (cyan) | Avg Fuel Price (orange)
   - Each: colored 3px top border, large animated counter, dim subtitle
   - Counters animate smoothly between values (step through in 20 frames via requestAnimationFrame)

3. **Revenue chart** (left, row 2): Chart.js line chart with 24-hour data, gradient fill (rgba blue), no legend, dark grid, $ axis labels. tension: 0.4, pointRadius: 0.

4. **Station grid** (right, row 2): 2-column grid of 8 station tiles:
   - Station name + status dot (green/yellow/red with CSS box-shadow glow)
   - Mini stats grid: Pumps (active/total), Transactions, Revenue ($Xk)
   - Utilization bar (4px, colored by status, width = utilizationPct%)
   - Hover: blue border + shadow

5. **Alert feed** (left, row 3): Latest 5 alerts with:
   - Colored left border (yellow=warning, green=success, blue=info)
   - Icon + text + "Xs ago" / "Xm ago"
   - slideIn animation (translateX)

6. **Feature vote leaderboard** (right, row 3): Features sorted by votes:
   - Rank # (blue if #1), feature text, progress bar (gradient fill, width proportional), vote count
   - Header includes "Press Q to show QR"

7. **QR overlay** (toggle with Q):
   - Fetch GET /api/info → generate QR for `info.url + "/mobile.html"`
   - Dark backdrop-filter: blur(12px), centered white card with QR, URL text, tunnel badge
   - Poll /api/info every 5s to update URL
   - Click overlay background to close

**Design system**: Background #0a0e17, surfaces #111827, borders #1e293b, text #e2e8f0, dim #64748b, accent #3b82f6. Border-radius: 12px cards, 8px small. Inter font family. font-variant-numeric: tabular-nums for all numbers.

**Keyboard**: Q=QR, F=fullscreen, R=reset (send {type:"reset"}), Escape=close overlay.
Auto-reconnect WebSocket with 2s delay on close.
```

---

## Recovery Plans

| Problem | Fix |
|---------|-----|
| **Server won't start** | `lsof -i :3000` → kill old process → restart |
| **Tunnel fails** | Skip tunnel. Use local IP: `http://<your-ip>:3000/mobile.html`. Works on same WiFi. |
| **Chart.js CDN blocked** | Copy Chart.js file locally to `public/chart.min.js`, update script src |
| **No audience votes showing** | Check WebSocket connection. Refresh display page. Press R to reset. |
| **Dashboard looks broken** | Use the backup `display.html` you saved before demo |
| **Display page blank** | Check browser console (F12). Usually a JS error from CDN. Fallback to mega-prompt. |
| **WebSocket disconnects** | Built-in auto-reconnect (2s). If persistent, restart server. |
| **Mobile page won't load** | Check tunnel URL. Try local network IP instead. |
| **Data not updating** | Server ticks every 3s automatically. Check server terminal for errors. |
| **Total emergency** | Open pre-built `display.html` directly: `cp backup/display.html public/` → refresh browser |

---

## WebSocket Message Reference

### Client → Server

| Message | When | Shape |
|---------|------|-------|
| `join` | On connect | `{ "type": "join", "role": "display" \| "mobile", "clientId": "..." }` |
| `vote_feature` | Mobile taps vote | `{ "type": "vote_feature", "featureId": "f1", "clientId": "..." }` |
| `unvote_feature` | Mobile un-taps vote | `{ "type": "unvote_feature", "featureId": "f1", "clientId": "..." }` |
| `suggest_feature` | Mobile submits idea | `{ "type": "suggest_feature", "text": "...", "clientId": "..." }` |
| `reset` | Press R on display | `{ "type": "reset" }` |

### Server → Client

| Message | Shape |
|---------|-------|
| `dashboard` | `{ "type": "dashboard", "stations": [...], "hourlyRevenue": [...], "alerts": [...], "kpis": {...}, "features": [...], "stats": {...} }` |

### REST API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/info` | GET | Returns `{ ip, port, url, localUrl, tunnelUrl }` |
| `/api/tunnel` | POST | Set tunnel URL: `{ "url": "https://..." }` |
| `/api/tunnel` | GET | Returns `{ tunnelUrl }` |

---

## Tips

1. **The audience-driven moment is everything**: When you look at the leaderboard and say "The audience chose X — let's build it NOW", that's the peak of the demo
2. **Don't rush the QR code moment**: Give people 30+ seconds to scan and vote before moving on
3. **Data updates automatically**: The dashboard is ALWAYS moving (3s ticks). This keeps it visually alive even while you're talking
4. **Feature voting is sticky**: People can only vote once per feature (deduplicated server-side). Suggest features are auto-upvoted by the suggestor.
5. **Keep the terminal visible**: Show the server logs in a split-screen — people love seeing WebSocket connections come in
6. **Back up your display.html**: Before the demo, save a working copy. If live-coding fails, swap it in. Nobody will know.
