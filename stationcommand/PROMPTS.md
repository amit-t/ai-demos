# Station Command — Copy-Paste Prompts

> These are the prompts you paste into your AI coding tool during the live demo.
> Each prompt is self-contained. Copy everything between the ── START and ── END lines.

---

## Prompt 1 — Foundation (KPI Cards + Chart + Station Grid)

Paste this first. Takes ~60-90 seconds to generate.

────────────────── START PROMPT 1 ──────────────────

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

────────────────── END PROMPT 1 ──────────────────

---

## Prompt 2 — Alerts + Feature Vote Leaderboard + QR Code

Paste this second. Adds the live alert feed, vote leaderboard, and QR code.

────────────────── START PROMPT 2 ──────────────────

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

────────────────── END PROMPT 2 ──────────────────

---

## Prompt 3 — Build the Winning Feature (templates)

Paste whichever one matches the top-voted feature. These are your "audience chose it" moment.

### If "Dark / Light mode toggle" wins:

────────────────── START PROMPT 3 (DARK/LIGHT) ──────────────────

Add a dark/light mode toggle to the Station Command dashboard. Place a toggle button in the top bar. Light mode: white background (#f8fafc), light surfaces (#ffffff), dark text (#0f172a). Smoothly transition all colors with CSS transitions (0.3s). Save preference. Toggle with keyboard shortcut 'T'.

────────────────── END PROMPT 3 ──────────────────

### If "Animated alert banner" wins:

────────────────── START PROMPT 3 (ALERT BANNER) ──────────────────

Add a scrolling alert banner at the very top of the dashboard (above the top bar). It shows the latest critical alert in an amber/red horizontal banner that slides in from the right, stays 5 seconds, then slides out left. Auto-cycles through recent alerts. Include a close button. Use CSS @keyframes for the slide animation.

────────────────── END PROMPT 3 ──────────────────

### If "Revenue sparkline chart" wins:

────────────────── START PROMPT 3 (SPARKLINES) ──────────────────

Add mini sparkline charts inside each of the 4 KPI cards. For the revenue card, show a small 60px-tall line chart of the last 6 hours of revenue. For transactions, show a bar sparkline. For pumps, show a gauge arc (active/total). For price, show a small up/down arrow with the trend. Use Canvas API for the sparklines (no extra libraries).

────────────────── END PROMPT 3 ──────────────────

### If "Station drill-down detail panel" wins:

────────────────── START PROMPT 3 (DRILL-DOWN) ──────────────────

Make station tiles clickable. When clicked, show a full-screen overlay panel for that station with: large station name + status, all 4 fuel prices in a grid, pump-by-pump status (individual colored dots), a mini revenue chart for just that station, and a close button. Slide in from the right with CSS transform. Close with Escape key.

────────────────── END PROMPT 3 ──────────────────

### If "Real-time pump utilisation bars" wins:

────────────────── START PROMPT 3 (PUMP BARS) ──────────────────

Replace the simple pump bar in each station tile with an animated multi-segment bar showing individual pump states. Each pump is a small colored segment (green=active, yellow=in-use, red=offline). Add a subtle pulse animation to active pumps. Show "X/Y pumps active" below. Make the bars update smoothly with CSS transitions.

────────────────── END PROMPT 3 ──────────────────

### If "Fuel price comparison widget" wins:

────────────────── START PROMPT 3 (PRICE COMPARE) ──────────────────

Add a new panel at the bottom of the dashboard showing a horizontal grouped bar chart comparing fuel prices across all 8 stations. Group by fuel type (Regular, Premium, Diesel). Color-code by fuel type. Highlight the cheapest station for each fuel type with a star icon. Update live as prices change. Use Chart.js horizontal bar chart type.

────────────────── END PROMPT 3 ──────────────────

---

## Mega Prompt (Nuclear Option — single shot)

Use this ONLY if staged prompts aren't working or you're short on time. Builds everything at once.

────────────────── START MEGA PROMPT ──────────────────

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

────────────────── END MEGA PROMPT ──────────────────
