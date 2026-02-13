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
Create a file called `public/display.html` — a full-screen dark-themed fuel station operations dashboard. Single self-contained HTML file, all CSS and JS inline.

**CDN (load in a script tag in head):**
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>

**WebSocket protocol:**
Connect with: `new WebSocket('ws://' + location.host)` — use `ws://` not `wss://`, use `location.host` not `localhost`.
On open, send: `{ "type": "join", "role": "display" }`

The server pushes messages of type "dashboard" with this exact shape (data updates arrive every ~3 seconds automatically):
{
  "type": "dashboard",
  "stations": [
    { "id": "s1", "name": "Downtown Hub", "status": "online", "totalPumps": 6, "activePumps": 5, "todayTransactions": 142, "todayRevenue": 8500, "fuelPrices": { "Regular": 3.12, "Premium": 3.45, "Diesel": 3.28, "EV Charge": 0.38 }, "utilizationPct": 83 }
  ],
  "hourlyRevenue": [{ "hour": 0, "label": "00:00", "revenue": 2100 }, ...],  // 24 entries
  "alerts": [{ "id": 1, "type": "warning", "text": "Station #4 — Pump 3 offline", "time": 1707600000000 }],
  "kpis": { "transactions": 1200, "revenue": 65000, "activePumps": 32, "pumpUtilization": 68, "avgPrice": 3.25 },
  "features": [{ "id": "f1", "text": "Dark / Light mode toggle", "votes": 12 }],
  "stats": { "connectedUsers": 5, "totalFeatureVotes": 42 }
}

Parse with JSON.parse(event.data), check msg.type === 'dashboard', then call your render functions. Auto-reconnect with 2s setInterval on close.

**Layout** — Use CSS Grid for the whole page. `height: 100vh; overflow: hidden;` Dark background #0a0e17.

Grid structure:
- grid-template-rows: auto 1fr auto
- grid-template-columns: 1fr 1fr

1. **Top bar** (spans full width):
   - Left: Logo (⛽ emoji in a small gradient-blue rounded square) + "Station Command" text (font-size 20px, font-weight 700)
   - Right: LIVE badge (green pulsing dot + "LIVE" text in green-tinted pill), audience count ("[N] audience connected"), clock (HH:MM:SS, update every second with setInterval)

2. **KPI row** (4 cards, spans full width, grid-template-columns: repeat(4, 1fr)):
   - Card 1: "Transactions Today" — blue accent (#3b82f6)
   - Card 2: "Total Revenue" — green accent (#22c55e), format as "$XX,XXX"
   - Card 3: "Active Pumps" — cyan accent (#06b6d4), subtitle shows "XX% utilization"
   - Card 4: "Avg Fuel Price" — orange accent (#f97316), format as "$X.XX"
   - Each card: background #111827, border 1px solid #1e293b, border-radius 12px, 3px colored top border (use ::before pseudo-element)
   - **Animated counters**: When values change, step from old to new in 20 frames using requestAnimationFrame. Store current displayed value in element.dataset.currentVal.

3. **Revenue chart** (left column, row 2): Panel with header "📈 Hourly Revenue"
   - Chart.js LINE chart using canvas
   - Initialize chart ONCE on page load, then update data on each message using `chart.data.labels = ...; chart.data.datasets[0].data = ...; chart.update('none');`
   - Config: type 'line', tension 0.4, borderColor '#3b82f6', backgroundColor 'rgba(59,130,246,0.08)', fill true, pointRadius 0, pointHoverRadius 5
   - Scales: x and y grid color 'rgba(30,41,59,0.5)', tick color '#64748b', y-axis callback: `v => '$' + (v/1000).toFixed(0) + 'k'`
   - responsive: true, maintainAspectRatio: false, legend display: false

4. **Station grid** (right column, row 2): Panel with header "🏢 Station Status"
   - Scrollable body, 2-column grid of 8 station tiles
   - Each tile: background #1a2236, border 1px solid #1e293b, border-radius 8px, padding 12px
   - Header row: station name (13px bold) + status dot (10px circle)
   - Status dot colors: online=#22c55e, warning=#eab308, offline=#ef4444. Add box-shadow glow matching color.
   - Stats: 2-column mini grid showing Pumps (active/total), Transactions (number), Revenue ($Xk)
   - Pump utilization bar: 4px tall, background #1e293b, fill width = utilizationPct%, fill color matches status
   - Hover effect: border-color #3b82f6 + subtle box-shadow

**Design system**: Surfaces #111827, borders #1e293b, text #e2e8f0, dim text #64748b. Inter font-family. font-variant-numeric: tabular-nums for ALL numbers.

**IMPORTANT**: Initialize the Chart.js chart in a function called on page load. Store it in a variable. On each WebSocket message, update chart data and call chart.update('none') — do NOT create a new chart each time.
```

### Prompt 2 — Alerts + Feature Vote Leaderboard + QR Code

```
Update display.html to add:

**Add QRCode.js CDN** in the <head>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

**1. Alert feed panel** (left column, row 3 of the main grid):
- Panel with header "🔔 Live Alerts"
- Shows the `alerts` array (already sorted newest-first from server, max 5)
- Each alert is a row with: colored 3px left border (warning=#eab308, success=#22c55e, info=#3b82f6), icon emoji (⚠️/✅/ℹ️), text, and time ago (calculate from alert.time using Date.now() - alert.time)
- Each alert slides in with CSS animation: `@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`

**2. Feature vote leaderboard** (right column, row 3):
- Panel with header "🗳️ Audience Feature Votes" (also show "Press Q to show QR" on the right side of the header in dim text)
- Shows `features` array sorted by votes descending
- Each row: rank number (#1 in blue, rest in dim), feature text, a progress bar (width = votes/maxVotes * 100%, gradient fill #3b82f6 → #6366f1), vote count in blue bold
- maxVotes = Math.max(1, ...features.map(f => f.votes))

**3. QR code overlay** (toggle with Q key):
- Full-screen overlay, z-index 100, background rgba(0,0,0,0.85) + backdrop-filter: blur(12px)
- On open, fetch `GET /api/info` → returns `{ ip, port, url, localUrl, tunnelUrl }`. The `url` field is the best URL to use.
- Build mobile URL: `info.url + '/mobile.html'`
- Create QR: `new QRCode(containerElement, { text: mobileUrl, width: 220, height: 220, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M })`
- Display in centered card: title "Vote on Features", subtitle "Scan with your phone", QR image in white padded box, URL text below, green tunnel badge if tunnelUrl exists
- **Poll /api/info every 5 seconds** with setInterval. If URL changes, clear container.innerHTML and regenerate QR.
- Close on: Q again, Escape, or clicking the backdrop

**Keyboard shortcuts**: Q = toggle QR, F = toggle fullscreen, R = send `{type:"reset"}` to WebSocket, Escape = close QR
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
Create `public/display.html` — a full-screen, real-time fuel station operations dashboard. Single self-contained HTML file, all CSS and JS inline.

**CDN scripts (load in <head> via script tags):**
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

**WebSocket protocol:**
Connect with: `new WebSocket('ws://' + location.host)` — use `ws://` not `wss://`, use `location.host` not `localhost`.
On open, send: `{ "type": "join", "role": "display" }`

Server pushes messages with this exact shape (every ~3 seconds):
{
  "type": "dashboard",
  "stations": [
    { "id": "s1", "name": "Downtown Hub", "status": "online", "totalPumps": 6, "activePumps": 5, "todayTransactions": 142, "todayRevenue": 8500, "fuelPrices": { "Regular": 3.12, "Premium": 3.45, "Diesel": 3.28, "EV Charge": 0.38 }, "utilizationPct": 83 }
  ],
  "hourlyRevenue": [{ "hour": 0, "label": "00:00", "revenue": 2100 }, ...],  // 24 entries
  "alerts": [{ "id": 1, "type": "warning", "text": "Station #4 — Pump 3 offline", "time": 1707600000000 }],
  "kpis": { "transactions": 1200, "revenue": 65000, "activePumps": 32, "pumpUtilization": 68, "avgPrice": 3.25 },
  "features": [{ "id": "f1", "text": "Dark / Light mode toggle", "votes": 12 }],
  "stats": { "connectedUsers": 5, "totalFeatureVotes": 42 }
}

Parse with JSON.parse(event.data), check `msg.type === 'dashboard'`, then call render functions.
Auto-reconnect with 2s setInterval on close.

**FULL LAYOUT** — CSS Grid, `height: 100vh; overflow: hidden;` Dark background #0a0e17.
Main grid: grid-template-rows: auto 1fr auto; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 24px.

1. **Top bar** (spans full width, flex row):
   - Left: Logo (⛽ emoji in a gradient-blue rounded square, 36x36px) + "Station Command" (20px, 700 weight)
   - Right: LIVE badge (pulsing green dot via @keyframes, "LIVE" text in green-tinted pill with border), "[N] audience connected" (read from stats.connectedUsers), clock HH:MM:SS (update with setInterval every 1000ms)

2. **KPI row** (grid-column: 1 / -1, 4 cards in grid-template-columns: repeat(4, 1fr)):
   - Card 1: "Transactions Today" — blue accent #3b82f6, value = kpis.transactions
   - Card 2: "Total Revenue" — green accent #22c55e, value = "$" + kpis.revenue.toLocaleString()
   - Card 3: "Active Pumps" — cyan accent #06b6d4, value = kpis.activePumps, subtitle: kpis.pumpUtilization + "% utilization"
   - Card 4: "Avg Fuel Price" — orange accent #f97316, value = "$" + kpis.avgPrice.toFixed(2)
   - Each card: bg #111827, border 1px solid #1e293b, border-radius 12px, colored 3px top border (::before pseudo-element)
   - **Animated counters**: step from old→new in 20 requestAnimationFrame frames. Store current value in el.dataset.currentVal.

3. **Revenue chart** (left column, row 2): Panel (bg #111827, border, radius 12px) with header "📈 Hourly Revenue"
   - **IMPORTANT**: Create Chart.js instance ONCE at page load. Store in a variable. On each WebSocket message, update data arrays and call `chart.update('none')` — do NOT destroy and recreate.
   - Config: type 'line', responsive true, maintainAspectRatio false
   - Dataset: borderColor '#3b82f6', backgroundColor 'rgba(59,130,246,0.08)', fill true, tension 0.4, borderWidth 2, pointRadius 0
   - Scales: grid color 'rgba(30,41,59,0.5)', tick color '#64748b', y callback: `v => '$' + (v/1000).toFixed(0) + 'k'`
   - Plugins: legend display false, tooltip bg '#1a2236'

4. **Station grid** (right column, row 2): Panel with header "🏢 Station Status"
   - Scrollable body (overflow-y: auto), 2-column grid, gap 10px
   - Each tile: bg #1a2236, border 1px solid #1e293b, radius 8px, padding 12px
   - Tile header: station name (13px bold) + status dot (10px circle, bg + box-shadow glow matching status color: online=#22c55e, warning=#eab308, offline=#ef4444)
   - Stats mini-grid (2 cols): Pumps (active/total), Transactions, Revenue ($Xk)
   - Pump bar: 4px tall, bg #1e293b, fill width=utilizationPct%, fill color matches status
   - Hover: border-color #3b82f6 + box-shadow
   - **Reuse existing DOM elements** — check if tiles exist, only rebuild innerHTML on first render. On updates, just change text content, classes, and widths for smooth transitions.

5. **Alert feed** (left column, row 3): Panel with header "🔔 Live Alerts"
   - Show alerts array (max 5, newest first)
   - Each: 3px colored left border (warning=#eab308, success=#22c55e, info=#3b82f6), icon (⚠️/✅/ℹ️), text, time ago
   - slideIn animation: `@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } }`

6. **Feature vote leaderboard** (right column, row 3): Panel with header "🗳️ Audience Feature Votes" + "Press Q to show QR" in dim text
   - features array sorted by votes descending
   - Each row: rank # (blue if #1), text, progress bar (width = votes/maxVotes * 100%, gradient #3b82f6→#6366f1), vote count (bold blue)

7. **QR overlay** (toggle with Q key, z-index 100):
   - Background rgba(0,0,0,0.85) + backdrop-filter: blur(12px)
   - Fetch `GET /api/info` → `{ ip, port, url, localUrl, tunnelUrl }`. Use `info.url + '/mobile.html'` for QR.
   - Create QR: `new QRCode(container, { text: mobileUrl, width: 220, height: 220, colorDark:'#000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M })`
   - Card: title "Vote on Features", subtitle, QR in white padded box, URL text, green tunnel badge if tunnelUrl
   - **Poll /api/info every 5s.** If URL changes, clear container.innerHTML and regenerate QR.
   - Close: Q, Escape, click backdrop

**Design system**: bg #0a0e17, surfaces #111827, borders #1e293b, text #e2e8f0, dim #64748b, accent #3b82f6. Radius 12px/8px. Inter font. font-variant-numeric: tabular-nums.
**Keyboard**: Q=QR, F=fullscreen, R=reset (send {type:"reset"}), Escape=close.
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
