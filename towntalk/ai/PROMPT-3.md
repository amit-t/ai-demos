# Prompt 3 — Simulation Mode

## What to Say (before pasting)

> "Now before I open this up to all of you, let me show you what it looks like with lots of activity."

## The Prompt

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

---

## What to Say (after it generates)

*Press S to start simulation, let it run for ~30 seconds, then:*

> "Okay, that's simulated data. Let's do it for real. Take out your phones."

*Then press S to stop, R to reset, Q to show QR code.*
