# Prompt 1 — The Foundation

## What to Say (before pasting)

> "First, let me describe what I want the visualization to look like."

## The Prompt

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

---

## What to Say (after it generates)

> "And just like that, we have a real-time visualization. Those are seed questions I preloaded. Let me make it more interactive."
