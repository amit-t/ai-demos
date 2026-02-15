# TownTalk — Copy-Paste Prompts

> These are the prompts you paste into your AI coding tool during the live demo.
> Each prompt is self-contained. Copy everything between the ── START and ── END lines.

---

## Prompt 1 — Foundation (Bubbles + WebSocket + Starfield)

Paste this first. Takes ~60-90 seconds to generate.

────────────────── START PROMPT 1 ──────────────────

Create a file `public/display.html` — a full-screen, dark-themed real-time visualization for a live Q&A app called "TownTalk". This MUST be a single self-contained HTML file with all CSS and JS inline — no external files except the CDN script below.

**CDN (load in a script tag in head):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
```

**WebSocket protocol:**
A WebSocket server is already running on the same host. Connect with: `new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)` — this auto-detects the protocol so it works both on `localhost` (ws) and through an HTTPS tunnel like ngrok (wss). Always use `location.host` not a hardcoded hostname.
On connect, send: `{ "type": "join", "role": "display", "clientId": "display-main" }`
The server sends JSON messages with this exact shape:
```json
{
  "type": "state",
  "questions": [
    { "id": "q1", "text": "What's our biggest opportunity?", "votes": 12, "timestamp": 1707600000000 }
  ],
  "stats": { "totalQuestions": 7, "totalVotes": 42, "connectedUsers": 3 }
}
```
State messages arrive whenever questions are added or votes change. Parse with `JSON.parse(event.data)` and check `msg.type === 'state'`, then call your render function with `msg.questions` and `msg.stats`. Auto-reconnect every 2 seconds on close.

**HTML structure (layer order matters!):**
```html
<canvas id="starfield"></canvas>  <!-- z-index: 0, position: fixed, inset: 0 -->
<svg id="viz"></svg>               <!-- z-index: 1, position: fixed, inset: 0 -->
<div id="stats-bar">...</div>     <!-- z-index: 10, position: fixed, top: 0 -->
```

**CRITICAL — SVG setup:**
The `<svg id="viz">` element MUST have `position: fixed; inset: 0;` in CSS AND you must set its width and height attributes to `window.innerWidth` and `window.innerHeight` in JS on load and on resize:
```js
const svg = d3.select('#viz');
svg.attr('width', window.innerWidth).attr('height', window.innerHeight);
```
Without this, D3 renders bubbles but they're invisible because the SVG has zero dimensions.

Inside the `<svg>`, include a `<defs>` block with 5 SVG glow filters (one per color tier). Each filter uses feGaussianBlur → feFlood → feComposite → feMerge to create a colored glow behind the bubble. Example for tier 0:
```html
<filter id="glow-0" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
  <feFlood flood-color="#6366f1" flood-opacity="0.35" result="color"/>
  <feComposite in="color" in2="blur" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```
Create glow-0 through glow-4 with increasing stdDeviation (6,8,10,12,14) and opacity (0.35→0.55).

Also append a `<g>` group inside the SVG: `const g = svg.append('g');` — all bubbles go inside this group.

**D3 Force Simulation (critical — follow this pattern exactly):**
```js
let nodes = [];  // mutable array — D3 mutates this with x, y, vx, vy

const simulation = d3.forceSimulation(nodes)
  .force('center', d3.forceCenter(W / 2, H / 2))
  .force('charge', d3.forceManyBody().strength(-80))
  .force('collision', d3.forceCollide(d => getRadius(d.votes) + 6).strength(0.9))
  .force('x', d3.forceX(W / 2).strength(d => 0.02 + Math.min(0.06, d.votes * 0.002)))
  .force('y', d3.forceY(H / 2).strength(d => 0.02 + Math.min(0.06, d.votes * 0.002)))
  .alphaDecay(0.015)
  .velocityDecay(0.35)
  .on('tick', () => {
    g.selectAll('.bubble').attr('transform', d => `translate(${d.x},${d.y})`);
  });
```

**Bubble radius:** `function getRadius(votes) { return Math.min(130, 36 + Math.sqrt(votes) * 14); }`

**Color tiers:**
- 0–4 votes: #6366f1 (indigo), filter glow-0
- 5–14: #818cf8 (light indigo), glow-1
- 15–29: #f59e0b (amber), glow-2
- 30–49: #fbbf24 (gold), glow-3
- 50+: #f472b6 (pink), glow-4

**Rendering bubbles (D3 data join — follow this pattern):**
When a new state message arrives, update your `nodes` array (add new questions, update votes on existing, remove deleted), then do a D3 data join:
```js
const bubbles = g.selectAll('.bubble').data(nodes, d => d.id);

// EXIT — fade out removed bubbles
bubbles.exit().transition().duration(400).style('opacity', 0).remove();

// ENTER — create new bubble groups
const enter = bubbles.enter().append('g').attr('class', 'bubble')
  .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`)
  .style('opacity', 0);

// Add to each entering group: circle, foreignObject with text div, vote badge circle + text
enter.append('circle').attr('r', d => getRadius(d.votes))
  .attr('fill', d => getTierColor(d.votes)).attr('fill-opacity', 0.18)
  .attr('stroke', d => getTierColor(d.votes)).attr('stroke-width', 1.5)
  .attr('filter', d => getTierGlow(d.votes));

enter.append('foreignObject')
  .attr('x', d => -getRadius(d.votes) * 0.7)
  .attr('y', d => -getRadius(d.votes) * 0.7)
  .attr('width', d => getRadius(d.votes) * 1.4)
  .attr('height', d => getRadius(d.votes) * 1.4)
  .append('xhtml:div')  // MUST use xhtml: namespace for foreignObject
  .attr('class', 'bubble-text')
  .text(d => d.text);

// Animate entrance with elastic spring
enter.transition().duration(800)
  .ease(d3.easeElasticOut.amplitude(1).period(0.4))
  .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`)
  .style('opacity', 1);

// MERGE — update existing bubbles (radius, colors, text)
const merged = enter.merge(bubbles);
// ... update circle r, fill, stroke, filter; update foreignObject size; update badge text

// Restart simulation
simulation.nodes(nodes);
simulation.force('collision', d3.forceCollide(d => getRadius(d.votes) + 6).strength(0.9));
simulation.alpha(0.4).restart();
```

**IMPORTANT: preserve existing node positions.** When updating nodes from server state, keep `x`, `y`, `vx`, `vy` from the existing node objects. Only update `votes` and `text`. New nodes get `x = W/2 + random jitter, y = H/2 + random jitter`.

**Background starfield:** A `<canvas>` with `position: fixed; inset: 0; z-index: 0`. Create ~120 stars with random positions. On each `requestAnimationFrame`, draw each star with alpha = `0.25 + 0.55 * (0.5 + 0.5 * sin(t * speed + phase))` for a gentle twinkling effect. Resize canvas on window resize.

**Stats bar:** Fixed at top with `background: linear-gradient(180deg, rgba(7,7,15,0.92) 0%, transparent 100%)`. Left: "TownTalk" logo with gradient purple icon (💬). Right: three stat counters (Questions, Votes, Connected) — animate number changes using requestAnimationFrame stepping. Plus a "Join" button that opens `/mobile.html`.

**CSS:** `.bubble-text` class: `color: #fff; font-size: 13px; font-weight: 500; text-align: center; display: flex; align-items: center; justify-content: center; word-break: break-word; text-shadow: 0 1px 3px rgba(0,0,0,0.5);`

Body: `background: #07070f; overflow: hidden; width: 100vw; height: 100vh;`

────────────────── END PROMPT 1 ──────────────────

---

## Prompt 2 — Spotlight + QR Code

Paste this second. Adds interactivity.

────────────────── START PROMPT 2 ──────────────────

Add two features to `public/display.html`. Add the QRCode.js CDN in the `<head>`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

**1. Spotlight mode:**
- Make each `.bubble` group clickable. On click, open a full-screen spotlight overlay.
- Add the click handler on the merged selection (after enter.merge): `merged.style('cursor', 'pointer').on('click', (event, d) => openSpotlight(d));`
- The overlay is a `<div>` with `position: fixed; inset: 0; z-index: 50; background: rgba(7,7,15,0.85); backdrop-filter: blur(20px);`
- Centered card (max-width 800px, rounded 24px corners, background #111827, border: 1px solid rgba(255,255,255,0.1)):
  - Question text at 36–40px font size, font-weight 600
  - Vote count in large text (64px) with gradient color (indigo → purple via background-clip: text)
  - "votes" label below in #64748b
  - Close ✕ button top-right
- Entry: overlay opacity 0→1, card `transform: scale(0.9) → scale(1)` with `cubic-bezier(0.34, 1.56, 0.64, 1)` over 300ms
- Close on: Escape key, click outside card, or ✕ button
- Store the spotlighted question ID. In your WebSocket state handler, if spotlight is open, update the displayed vote count from the latest data.

**2. QR code overlay:**
- Press Q to toggle a full-screen QR overlay (z-index: 100, above spotlight).
- On open, fetch `GET /api/info` — this returns:
  ```json
  { "ip": "192.168.1.5", "port": 3000, "url": "https://abc.ngrok-free.app", "localUrl": "http://192.168.1.5:3000", "tunnelUrl": "https://abc.ngrok-free.app" }
  ```
  The `url` field is the best URL (tunnel if available, else local IP).
- Build QR URL: `info.url + '/mobile.html'`
- Create QR code using: `new QRCode(containerElement, { text: mobileUrl, width: 220, height: 220, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M })`
- Display centered on dark blurred backdrop: white-background card with QR image, "Join TownTalk" title, scan instruction subtitle, and the URL in monospace below.
- Below URL: if `info.tunnelUrl` exists, show green badge "🌐 Public URL"; else amber badge "📡 Local network only"
- **Poll `/api/info` every 5 seconds** using `setInterval`. If the URL changes, clear the QR container innerHTML and regenerate. This handles the tunnel starting after the page loads.
- Close on: press Q again, press Escape, or click the backdrop.

**3. Hint bar:** At the very bottom of the screen, a small pill-shaped `<div>` with `position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); opacity: 0.4; font-size: 12px;` saying "Click any bubble to spotlight · Press Q for QR code · Press S to simulate"

**Keyboard shortcuts:** Q = toggle QR, Escape = close QR or spotlight, F = toggle fullscreen, R = send `{ "type": "reset" }` to WebSocket.

────────────────── END PROMPT 2 ──────────────────

---

## Prompt 3 — Simulation Mode

Paste this third. Makes the screen come alive.

────────────────── START PROMPT 3 ──────────────────

Add a simulation mode to `public/display.html`:

- Add a boolean `let simulating = false;` and a timer variable `let simTimer = null;`
- Pressing **S** toggles simulation on/off:
  - On: set `simulating = true`, start a `setInterval` every 400ms, show an orange banner
  - Off: set `simulating = false`, `clearInterval(simTimer)`, hide the banner
- The orange banner is a `<div>` positioned fixed below the stats bar: `top: 64px; left: 50%; transform: translateX(-50%); background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4); color: #f97316; padding: 6px 16px; border-radius: 20px; font-size: 12px; z-index: 10;` Text: "⚡ Simulation Mode"

- Every 400ms interval tick, send a WebSocket message. Use `Math.random() < 0.3` to decide:
  - **30% chance — submit a new question:** Send `{ "type": "submit", "text": "<random from list>", "clientId": "sim-" + Math.random().toString(36).slice(2,8) }`. Use these questions:
    "What's the biggest challenge we face this year?", "How can we improve onboarding?", "Should we invest more in developer tooling?", "What's one process you'd eliminate?", "How do you feel about hybrid work?", "What would you build with a free week?", "How can we improve cross-team communication?", "What training would help you grow?", "Should we host more social events?", "How can leadership be more transparent?"
  - **70% chance — upvote a random question:** Pick a random question from the current `nodes` array (you can weight toward popular ones by using `Math.random() * Math.random()` as index). Send `{ "type": "upvote", "questionId": node.id, "clientId": "sim-" + Math.random().toString(36).slice(2,8) }`. The unique clientId ensures the server doesn't block it as a duplicate vote.

- Make sure the S key handler checks that `ws.readyState === WebSocket.OPEN` before starting simulation.

────────────────── END PROMPT 3 ──────────────────

---

## Mega Prompt (Nuclear Option — single shot)

Use this ONLY if staged prompts aren't working or you're short on time. It builds everything in one go.

────────────────── START MEGA PROMPT ──────────────────

Create `public/display.html` — a full-screen, dark-themed real-time Q&A visualization called "TownTalk". Single self-contained HTML file, all CSS and JS inline, for a 1920x1080 projector.

**CDN scripts (load in head):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

**WebSocket protocol:**
Connect with: `new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)` — auto-detects protocol for localhost (ws) and HTTPS tunnels like ngrok (wss). Always use `location.host` not a hardcoded hostname.
On open send: `{ "type": "join", "role": "display", "clientId": "display-main" }`
Server pushes state updates as:
```json
{
  "type": "state",
  "questions": [{ "id": "q1", "text": "Question text", "votes": 5, "timestamp": 1707600000 }],
  "stats": { "totalQuestions": 7, "totalVotes": 42, "connectedUsers": 3 }
}
```
To submit: `{ "type": "submit", "text": "...", "clientId": "..." }`
To upvote: `{ "type": "upvote", "questionId": "q1", "clientId": "unique-id" }`
To reset: `{ "type": "reset" }`
Auto-reconnect with 2s `setInterval` on close.

**HTML structure (layer order is critical):**
```html
<canvas id="starfield"></canvas>  <!-- z-index: 0, position: fixed, inset: 0 -->
<svg id="viz">
  <defs><!-- 5 glow filters: glow-0 through glow-4 --></defs>
</svg>                             <!-- z-index: 1, position: fixed, inset: 0 -->
<div id="stats-bar">...</div>     <!-- z-index: 10 -->
<!-- spotlight overlay z-index: 50, QR overlay z-index: 100 -->
```

**CRITICAL SVG SETUP:**
The `<svg id="viz">` MUST have `position: fixed; inset: 0;` in CSS, AND you MUST set width/height attributes in JS:
```js
const svg = d3.select('#viz');
svg.attr('width', window.innerWidth).attr('height', window.innerHeight);
// Update on window resize too!
```
Without this, bubbles render but are invisible (SVG has zero dimensions). Append a `<g>` group: `const g = svg.append('g');` — all bubbles live here.

**SVG Glow Filters (in `<defs>`):**
5 filters (glow-0 through glow-4), each: feGaussianBlur → feFlood → feComposite(in) → feMerge. Increasing stdDeviation (6,8,10,12,14) and flood-opacity (0.35→0.55). Colors match tiers below.

**D3 Force Simulation:**
```js
let nodes = [];
const simulation = d3.forceSimulation(nodes)
  .force('center', d3.forceCenter(W / 2, H / 2))
  .force('charge', d3.forceManyBody().strength(-80))
  .force('collision', d3.forceCollide(d => getRadius(d.votes) + 6).strength(0.9))
  .force('x', d3.forceX(W / 2).strength(d => 0.02 + Math.min(0.06, d.votes * 0.002)))
  .force('y', d3.forceY(H / 2).strength(d => 0.02 + Math.min(0.06, d.votes * 0.002)))
  .alphaDecay(0.015).velocityDecay(0.35)
  .on('tick', () => { g.selectAll('.bubble').attr('transform', d => `translate(${d.x},${d.y})`); });
```

**Bubble radius:** `Math.min(130, 36 + Math.sqrt(votes) * 14)`
**Color tiers:** 0–4: #6366f1/glow-0, 5–14: #818cf8/glow-1, 15–29: #f59e0b/glow-2, 30–49: #fbbf24/glow-3, 50+: #f472b6/glow-4

**Rendering (D3 data join):**
On each state message, update `nodes` (preserve existing x/y/vx/vy, only change votes/text), then:
- `g.selectAll('.bubble').data(nodes, d => d.id)` — key by id
- EXIT: `.exit().transition(400).style('opacity',0).remove()`
- ENTER: `.enter().append('g').attr('class','bubble')` starting at `scale(0), opacity 0`
  - Each group gets: `<circle>` (fill-opacity 0.18, stroke, glow filter), `<foreignObject>` with `<xhtml:div class="bubble-text">` for wrapped text, and a vote badge (small circle + text) at top-right
  - Animate in: `.transition(800).ease(d3.easeElasticOut.amplitude(1).period(0.4)).attr('transform', d => translate+scale(1)).style('opacity',1)`
- MERGE: update radius, colors, filters, text, badge for existing bubbles
- Restart: `simulation.nodes(nodes); simulation.alpha(0.4).restart();`

**Background starfield:** Canvas behind SVG, ~120 twinkling stars using `requestAnimationFrame` + sin-wave alpha. Resize on window resize.

**Stats bar (fixed top):** Gradient fade background. Left: "TownTalk" + purple gradient icon. Right: animated stat counters (Questions, Votes, Connected) + "Join" button → `/mobile.html`.

**Spotlight mode:** Click bubble → full-screen overlay (z-index 50), blurred backdrop, centered glass card with question text (40px), vote count (64px, gradient text), close button. Spring animation. Escape/click-outside closes. Vote count updates live from state messages.

**QR overlay:** Press Q → overlay (z-index 100). Fetch `GET /api/info` → `{ url, tunnelUrl, localUrl }`. Generate QR for `info.url + '/mobile.html'` using `new QRCode(container, { text, width:220, height:220 })`. Show title "Join TownTalk", URL, tunnel badge (green if tunnelUrl, amber otherwise). Poll `/api/info` every 5s, regenerate QR if URL changes.

**Simulation:** Press S toggles. Every 400ms: 30% submit fake question (`{ type:'submit', text:'...', clientId:'sim-'+random }`), 70% upvote random existing (`{ type:'upvote', questionId:node.id, clientId:'sim-'+random }`). Orange banner visible when active. 10 sample workplace questions hardcoded.

**Keyboard:** Q=QR, S=simulate, F=fullscreen, R=reset, Escape=close overlays.
**Hint bar:** Fixed bottom center, faint text listing shortcuts.

**CSS key points:** body `background:#07070f; overflow:hidden; 100vw×100vh`. `.bubble-text`: white, 13px, centered, word-break, text-shadow. All numbers: `font-variant-numeric: tabular-nums`.

────────────────── END MEGA PROMPT ──────────────────
