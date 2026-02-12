# TownTalk — Live Demo Playbook

The complete script for vibe-coding TownTalk at your townhall.
Works with **Claude Code**, **Windsurf/Cascade**, **Cursor**, or any AI coding tool.

---

## Architecture (What You're Building Live)

```
┌──────────────────────────────────────────────────────┐
│                  PRE-BUILT (before demo)              │
│                                                      │
│  server.js ─── WebSocket server (Node.js, zero deps) │
│  mobile.html ── Phone submission/voting page          │
├──────────────────────────────────────────────────────┤
│               LIVE-CODED (on stage)                   │
│                                                      │
│  display.html ─ D3.js bubble visualization            │
│    Prompt 1: Bubbles + dark theme + WebSocket         │
│    Prompt 2: Spotlight mode + QR code overlay         │
│    Prompt 3: Simulation mode + polish                 │
└──────────────────────────────────────────────────────┘
```

The audience watches you build only the **display page** — the visually impressive part.
The server and mobile page are pre-built and running before you start.

---

## Pre-Demo Checklist (Do This the Day Before)

### Files to have ready

1. **`towntalk/server.js`** — Already built (see your project folder)
2. **`towntalk/public/mobile.html`** — Already built (see your project folder)
3. **`towntalk/public/display.html`** — Delete this file or rename it to `display-backup.html`. This is what you'll build live. Keep it as a backup in case things go wrong.

### Environment setup

- [ ] Node.js installed (`node --version` should work)
- [ ] A tunnel tool installed (see below)
- [ ] Project folder open in your IDE with AI tool active
- [ ] Terminal visible to the audience (or use IDE's built-in terminal)
- [ ] Browser open on a second monitor/tab pointed at `http://localhost:3000`

### Install a tunnel tool (pick one)

The tunnel exposes your `localhost:3000` as a public URL so every phone in the room can reach it — no WiFi hassle, no network config, works on cellular too.

| Tool | Install | WebSocket | Free | Notes |
|------|---------|-----------|------|-------|
| **ngrok** (recommended) | `brew install ngrok` or [ngrok.com/download](https://ngrok.com/download) | Yes | Free tier (1 tunnel) | Most reliable. Requires free account + `ngrok config add-authtoken YOUR_TOKEN`. Stable URLs with paid plan. |
| **cloudflared** | `brew install cloudflared` or [developers.cloudflare.com](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | Yes | Fully free | No account needed for quick tunnels. Random URL each time. |
| **localtunnel** | `npm install -g localtunnel` (or runs via npx) | Yes | Free | No install if you have npx. Shows a "Click to Continue" splash page on first visit. |

**Recommendation:** Use **ngrok** for the demo. It's the most reliable, has the cleanest URLs, and doesn't show interstitial pages. Set up your free account and authtoken the day before.

### 5 minutes before demo

```bash
cd towntalk

# Option A: Auto-detect tunnel (tries ngrok → cloudflared → localtunnel)
./start.sh

# Option B: Start manually with a specific tunnel URL
ngrok http 3000                    # ← in one terminal
TUNNEL_URL=https://abc123.ngrok.io node server.js  # ← in another

# Option C: No tunnel (local network only — riskier at large events)
node server.js
```

The `start.sh` script handles everything: starts the server, starts the tunnel, detects the public URL, and pushes it to the server so the QR code is correct.

Verify you see the server banner with a **Public** URL. Open `http://localhost:3000` — it will 404 for display.html (because you deleted it). That's correct — you're about to build it live.

---

## Demo Script (What to Say + When to Prompt)

### Intro (0:00 – 1:30)

> "I'm going to build something live right now using AI. We're going to create a real-time Q&A app — where all of you can submit questions from your phones, vote on them, and we'll see them appear on this screen as floating, physics-based bubbles. The most popular questions will literally grow bigger and push their way to the center.
>
> I've already set up a small WebSocket server — think of it as the plumbing. Now I'm going to build the visual part, from scratch, using natural language prompts. Let's go."

### PROMPT 1: The Foundation (1:30 – 4:30)

Say to audience: *"First, let me describe what I want the visualization to look like."*

**Copy-paste this into your AI tool:**

---

### — PROMPT 1 — Copy below this line —

Create a file `public/display.html` — a full-screen, dark-themed real-time visualization for a live Q&A app called "TownTalk".

**How it works:**
A WebSocket server is already running on the same host. When the page connects, the server sends JSON messages with this shape:
```json
{ "type": "state", "questions": [{ "id": "q1", "text": "What's our biggest opportunity?", "votes": 12, "timestamp": 1707600000000 }], "stats": { "totalQuestions": 7, "totalVotes": 42, "connectedUsers": 3 } }
```
On connect, send: `{ "type": "join", "role": "display", "clientId": "display-main" }`
State messages arrive whenever questions are added or votes change.

**The visualization:**
- Use D3.js v7 from cdnjs CDN for a force-directed bubble layout
- Each question is a floating bubble (SVG circle + foreignObject for wrapped text)
- Bubble radius scales with votes: `radius = min(130, 36 + sqrt(votes) * 14)`
- D3 forces: center gravity, collision detection, charge repulsion. Popular questions (more votes) get pulled more strongly toward center
- Color tiers based on vote count:
  - 0–4 votes: indigo (#6366f1)
  - 5–14: light indigo (#818cf8)
  - 15–29: amber (#f59e0b)
  - 30–49: gold (#fbbf24)
  - 50+: pink (#f472b6)
- SVG glow filters for each color tier (feGaussianBlur + feFlood + feMerge), more intense glow for higher tiers
- Vote count shown as a small badge circle on each bubble's top-right
- New bubbles enter with an elastic scale-up animation (start at r=0, spring to full size)
- Bubbles that get removed fade out and shrink

**Background:** Deep dark theme (#07070f). Add a subtle animated starfield using a canvas layer behind the SVG — ~120 tiny dots that slowly twinkle using sin waves.

**Stats bar:** Fixed at top, fading gradient background. Left: "TownTalk" logo text with a small purple-gradient icon. Right: three stat counters (Questions, Votes, Connected) with animated count-up when values change, plus a "Join" button.

**The page must:**
- Connect to WebSocket at `ws://` + `location.host`
- Auto-reconnect every 2 seconds if disconnected
- Update the D3 simulation whenever new state arrives (preserve existing bubble positions)
- Be a single self-contained HTML file with all CSS and JS inline
- Work in fullscreen on a 1920x1080 projector

### — END PROMPT 1 —

---

**What happens:** The AI generates the full display.html (~500+ lines). It appears in the editor. Refresh the browser — **bubbles appear from the seed data the server already has.** This is the first wow moment.

Say to audience: *"And just like that, we have a real-time visualization. Those are seed questions I preloaded. Let me make it more interactive."*

### PROMPT 2: Spotlight + QR Code (4:30 – 7:00)

Say to audience: *"I want to be able to click a question to zoom in on it. And I need a way for you all to join."*

**Copy-paste this into your AI tool:**

---

### — PROMPT 2 — Copy below this line —

Add two features to `public/display.html`:

**1. Spotlight mode:**
- Clicking any bubble opens a full-screen spotlight overlay
- The overlay has a blurred dark backdrop (rgba(7,7,15,0.85) + backdrop-filter: blur(20px))
- A centered card (max-width 800px, rounded corners, subtle glass border) shows:
  - The question text at ~40px font size
  - The vote count in large gradient text (indigo to purple)
  - A "votes" label below
  - An ✕ close button in the top-right
- Entry animation: overlay fades in, card scales from 0.9 to 1.0 with a spring cubic-bezier
- Pressing Escape or clicking outside the card closes it
- While spotlight is open, the vote count should update in real-time if more votes come in

**2. QR code overlay:**
- Add a keyboard shortcut: pressing Q toggles a full-screen QR code overlay
- The overlay fetches the server URL from `/api/info` which returns `{ "url": "https://abc123.ngrok.io", "tunnelUrl": "https://abc123.ngrok.io", "localUrl": "http://192.168.1.5:3000" }`. The `url` field is the best URL to use — it will be the public tunnel URL if one is active, or the local IP otherwise.
- Generate a QR code pointing to `{url}/mobile.html` using the qrcodejs library from cdnjs CDN
- Display the QR code centered on screen with "Join TownTalk" title, subtitle "Scan with your phone camera to ask questions and vote", and the URL in monospace text below
- Below the URL, show a small status badge: if `tunnelUrl` is set, show "🌐 Public URL — works from any network" in green; otherwise show "📡 Local network only" in amber
- Poll `/api/info` every 5 seconds and auto-regenerate the QR code if the URL changes (tunnel may start after the page loads)
- Spring scale-in animation on open

Also add a hint bar at the bottom of the screen: a small pill-shaped element with low-opacity text saying "Click any bubble to spotlight · Press Q for QR code"

### — END PROMPT 2 —

---

**What happens:** The AI adds spotlight and QR code to the existing file. Click a bubble — it zooms to full screen. Press Q — a QR code appears. The audience starts reaching for their phones.

Say to audience: *"Now before I open this up to all of you, let me show you what it looks like with lots of activity."*

### PROMPT 3: Simulation Mode (7:00 – 9:00)

**Copy-paste this into your AI tool:**

---

### — PROMPT 3 — Copy below this line —

Add a simulation mode to `public/display.html`:

- Pressing S toggles simulation mode on/off
- When active, show a small orange banner below the stats bar: "⚡ Simulation Mode — generating fake activity"
- Every 400ms, randomly either:
  - Submit a new fake question (30% chance) by sending `{ "type": "submit", "text": "...", "clientId": "sim-xxx" }` over the WebSocket. Use these sample questions: "What's the biggest challenge we face this year?", "How can we improve onboarding?", "Should we invest more in developer tooling?", "What's one process you'd eliminate?", "How do you feel about hybrid work?", "What would you build with a free week?", "How can we improve cross-team communication?", "What training would help you grow?", "Should we host more social events?", "How can leadership be more transparent?"
  - Upvote a random existing question (70% chance), weighted toward already-popular questions, by sending `{ "type": "upvote", "questionId": "...", "clientId": "sim-[random]" }`. Use a unique random clientId each time so votes aren't blocked by the server's duplicate-vote check.

Also add these keyboard shortcuts:
- F: toggle fullscreen
- R: send `{ "type": "reset" }` to reset all questions back to seeds (only works when QR overlay and spotlight are both closed)

### — END PROMPT 3 —

---

**What happens:** Press S. Fake questions and votes start flowing in. Bubbles appear, grow, change color, jostle for position. **This is the peak visual moment** — the whole screen is alive.

Say to audience: *"Okay, that's simulated data. Let's do it for real. Take out your phones."*

### Audience Participation (9:00 – 13:00)

1. Press **S** to stop simulation
2. Press **R** to reset to seed questions
3. Press **Q** to show the QR code
4. Say: *"Scan this QR code. Ask any question you want — it's anonymous. And upvote the ones you want leadership to answer."*
5. Wait 30–60 seconds for questions to flow in
6. Press **Q** to close QR code — the audience sees their questions appearing as bubbles
7. Click the biggest bubble to spotlight it
8. Optionally: invite the VP/CTO to address the top question

### Close (13:00 – 15:00)

> "Everything you just saw — the bubble physics, the glow effects, the spotlight mode, the QR code — I built all of that from three English prompts in about 7 minutes. The server and mobile page were pre-built, but the entire visual experience was vibe-coded live. That's the power of AI-assisted development."

---

## Recovery Plans

### "The AI generated broken code"

**Fix it live.** Say: *"Let's debug this with AI."* Then prompt:

```
The display page has an error. Check the browser console — [paste the error]. Fix it.
```

This itself is a demo moment — watching AI debug in real time.

### "The AI is taking too long to generate"

Have `display-backup.html` ready. If generation takes more than 90 seconds:

1. Say: *"While that's generating, let me show you what the finished version looks like."*
2. Copy `display-backup.html` to `display.html`
3. Refresh the browser
4. Continue with the demo

### "WebSocket won't connect"

The most likely issue is the browser URL. Check that:
- Server is running (`node server.js` in terminal)
- Browser is at `http://localhost:3000` (not `file://`)
- No other process is using port 3000

### "QR code doesn't work for audience"

- **Best fix:** Use a tunnel (ngrok/cloudflared). Run `./start.sh` before the demo. The QR code will use the public URL, which works on any network including cellular.
- If no tunnel: verify audience is on the same WiFi network
- Have the URL on a slide as backup
- Pre-test with 2-3 colleagues before the demo

### "Nobody's questions are appearing"

Press **S** to toggle simulation mode. Say: *"Let me add some starter questions while more people join."* The simulated activity makes the demo look alive even if WiFi is slow.

---

## NUCLEAR OPTION: Single Mega-Prompt

If you only get one shot (or want the fastest possible demo), use this single prompt that builds everything at once. It's riskier (more code, more chance of bugs) but takes only one prompt:

---

### — MEGA PROMPT — Copy below this line —

Create `public/display.html` — a full-screen, dark-themed real-time Q&A visualization called "TownTalk". This is a single self-contained HTML file for projector display at a live event.

**Server Protocol:**
A WebSocket server runs on the same host. Connect to `ws://` + `location.host`. On connect, send `{ "type": "join", "role": "display", "clientId": "display-main" }`. The server sends state updates as:
```json
{ "type": "state", "questions": [{"id":"q1","text":"Question text","votes":5,"timestamp":1707600000}], "stats": {"totalQuestions":7,"totalVotes":42,"connectedUsers":3} }
```
To submit: `{ "type": "submit", "text": "...", "clientId": "..." }`
To upvote: `{ "type": "upvote", "questionId": "q1", "clientId": "unique-id" }`
To reset: `{ "type": "reset" }`

**Visual Design:**
- Deep dark background (#07070f) with a subtle starfield (canvas layer, ~120 twinkling dots using sin-wave alpha animation)
- Use D3.js v7 from cdnjs CDN for force-directed bubble layout
- Each question = floating SVG circle + foreignObject for wrapped white text + a small vote-count badge circle at top-right
- Bubble radius = `min(130, 36 + sqrt(votes) * 14)`. D3 forces: center gravity, collision, charge repulsion. Higher-vote bubbles pulled more toward center.
- Color tiers by votes: 0-4 indigo (#6366f1), 5-14 light indigo (#818cf8), 15-29 amber (#f59e0b), 30-49 gold (#fbbf24), 50+ pink (#f472b6)
- SVG glow filters per tier (feGaussianBlur + feFlood + feMerge). Stronger glow for higher tiers.
- New bubbles animate in with elastic scale (r: 0 → full). Removed bubbles fade+shrink out.
- Popular bubbles (25+ votes) have a pulsing stroke-opacity animation.

**Stats Bar (fixed top):**
- Left: "TownTalk" logo with a gradient purple icon
- Right: animated counters for Questions, Votes, Connected users + a "Join" button
- Semi-transparent gradient background fading to transparent

**Spotlight Mode:**
- Click any bubble → full-screen overlay with blurred dark backdrop
- Centered glass-morphism card: question text at 40px, vote count in large gradient text, close button
- Spring-in animation. Escape or click-outside to close. Vote count updates live.

**QR Code Overlay:**
- Press Q to toggle. Fetches server URL from `/api/info` endpoint (returns `{ "url": "https://abc.ngrok.io", "tunnelUrl": "https://abc.ngrok.io", "localUrl": "http://192.168.1.5:3000" }`). Use the `url` field — it's the public tunnel URL if active, otherwise the local IP.
- Generate QR code using qrcodejs from cdnjs pointing to `{url}/mobile.html`
- Shows "Join TownTalk" title, scan instruction, URL in monospace
- Below URL: show "🌐 Public URL — works from any network" (green) if `tunnelUrl` exists, else "📡 Local network only" (amber)
- Poll `/api/info` every 5 seconds; auto-regenerate QR if URL changes (tunnel may start after page loads)

**Simulation Mode:**
- Press S to toggle. Shows orange "Simulation Mode" banner.
- Every 400ms: 30% chance to submit a new fake question (from a list of 10 workplace-themed questions), 70% chance to upvote a random existing question (weighted toward popular ones). Each upvote uses a unique random clientId.

**Keyboard Shortcuts:**
- Q: toggle QR overlay
- S: toggle simulation
- F: toggle fullscreen
- R: reset questions (when overlays are closed)
- Escape: close spotlight or QR

**Hint bar** at the bottom: small pill with faint text listing shortcuts.

Auto-reconnect WebSocket every 2 seconds. Preserve existing bubble positions on state update. All CSS and JS inline. Target 1920x1080 projector.

### — END MEGA PROMPT —

---

## WebSocket Server Reference

Your pre-built `server.js` handles these message types:

| Direction | Type | Payload | Behavior |
|-----------|------|---------|----------|
| Client → Server | `join` | `{ role, clientId }` | Registers client, broadcasts stats |
| Client → Server | `submit` | `{ text, clientId }` | Adds question (max 280 chars) |
| Client → Server | `upvote` | `{ questionId, clientId }` | +1 vote (blocked if same clientId already voted) |
| Client → Server | `downvote` | `{ questionId, clientId }` | -1 vote (only if previously upvoted) |
| Client → Server | `remove` | `{ questionId }` | Deletes question (moderation) |
| Client → Server | `reset` | `{}` | Clears all, reloads 7 seed questions |
| Server → Client | `state` | `{ questions[], stats }` | Full state broadcast on every change |

The server runs on port 3000, has zero npm dependencies (hand-rolled WebSocket), and starts with 7 pre-seeded questions with random vote counts.

---

## Timing Cheat Sheet

| Clock | Action | What audience sees |
|-------|--------|-------------------|
| 0:00 | Start talking | You introducing the demo |
| 1:30 | Paste Prompt 1 | AI writing code in the editor |
| ~3:00 | Refresh browser | **WOW: Bubbles appear** |
| 3:30 | Paste Prompt 2 | AI adding features |
| ~5:00 | Click a bubble | **WOW: Spotlight zooms in** |
| 5:15 | Press Q | **WOW: QR code appears** |
| 5:30 | Paste Prompt 3 | AI adding simulation |
| ~7:00 | Press S | **WOW: Screen comes alive with activity** |
| 8:00 | Press S (off), R (reset) | Clean slate |
| 8:30 | Press Q, invite audience | Phones come out |
| 9:30 | Press Q (close) | **WOW: Real questions flood in** |
| 11:00 | Click top question | Spotlight the crowd's voice |
| 13:00 | Wrap up | Recap what you built |

---

## Tips from Experience

1. **Practice the prompts 3 times before the event.** AI outputs vary — you need to know what good vs. broken output looks like instantly.

2. **Keep the backup file.** If any prompt produces broken code, copy `display-backup.html` over and move on. Nobody will know.

3. **Talk while the AI generates.** Don't stare at the screen in silence. Explain what you asked for, what the AI is doing, why this matters.

4. **The simulation mode IS your safety net.** If WiFi fails and nobody can connect, simulation mode makes the demo look perfect anyway.

5. **Have a colleague pre-connected on the mobile page.** Before you reveal the QR code, have 1-2 seed questions ready from "real users" so the screen isn't empty when you switch from simulation to real.

6. **Fullscreen before the audience part.** Press F before showing the QR code. The fullscreen dark display with floating bubbles on a big projector is the visual that makes people remember this demo.
