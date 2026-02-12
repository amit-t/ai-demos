# Townhall AI Demo — Vibe Coding Ideas

**Context:** ~1,000 person townhall, mixed audience (mostly non-technical), 15 min total, Claude Cowork live demo.
**Goal:** Maximum interaction + wow factor. Domain-agnostic.

---

## The Big Idea

The strongest demos share one principle: **the audience IS the content.** Every person in the room sees their individual action contribute to something collective and unexpected on the main screen. That's the magic.

All 5 ideas below need a WebSocket server for real-time audience input. **Pre-build this once** and reuse it across whichever ideas you pick (see Pre-Built Infrastructure section at the bottom).

---

## 1. Crowd Pulse — Emoji Reaction Storm

**Pitch:** Every attendee taps emojis on their phone and watches hundreds of them cascade across the main screen with physics — turning a 1,000-person room into a single living, breathing visualization.

**Wow moment:** The presenter says "go" and within 5 seconds the dark screen ERUPTS with floating, drifting, colliding emoji reactions. A live counter rockets past 100… 200… 500. When it crosses a threshold (say 500 total), the emojis get sucked into the center of the screen and explode outward in a supernova burst, then reform into a giant mosaic of the most-sent emoji. The room loses it.

**Why it works for this audience:** Zero cognitive load. Tap emoji, see emoji. Every single person can participate in under 3 seconds. The emergent beauty of 1000 people creating something together is visceral.

**Live-coding scope (~5 min):**

- **Min 0–1:** Prompt Claude — "Create a full-screen dark canvas. Emoji reactions enter from the bottom with a pop animation, float upward with random sizes (20px–80px), gentle horizontal drift, slow rotation, and fade out near the top. Use requestAnimationFrame for smooth 60fps. Add a live counter in the top-right corner."
- **Min 1–3:** Claude generates the animated HTML/Canvas component. First emojis appear on screen. *This is your first wow moment — audience sees it working.*
- **Min 3–4:** Prompt Claude — "Add a burst mode: when more than 10 emojis arrive in a 1-second window, trigger a shockwave ripple effect from the center and briefly speed up all particles. Also add a 'top 3 emojis' leaderboard in the bottom-left showing the most-sent emojis with animated counters."
- **Min 4–5:** Connect to the pre-built WebSocket endpoint. Test with 2–3 manual sends. Then open it to the audience.

**Pre-built pieces:**
- WebSocket server (shared infrastructure — see bottom)
- Mobile emoji picker page (6–8 large tap-friendly emoji buttons, nothing else)
- QR code on your opening slide + a large-print QR poster if the venue allows
- The "supernova threshold" animation as a separate pre-built module you can trigger manually if the organic threshold isn't hit

**Audience interaction:**
- Scan QR → tap emoji → see it on screen within 1 second
- Prompt the room: "Show me your reaction to building apps with AI — go!"
- Call out milestones live: "We just hit 500!"

**Risk level:** Medium
- **Main risk:** Venue WiFi handling 500+ concurrent WebSocket connections.
- **Recovery:** Pre-build a "simulate" button that floods the screen with fake emoji (audience won't know). Also build an HTTP polling fallback that batches and refreshes every 2 seconds instead of real-time.

---

## 2. Crowd Canvas — 1,000 Painters, One Masterpiece

**Pitch:** Every person's phone becomes a brush. Together, 1,000 people paint a massive collaborative artwork on the main screen in real time — and a generative art algorithm makes it beautiful no matter what.

**Wow moment:** The canvas starts empty. Individual brushstrokes appear — dots, smears, splashes of color. Within 30 seconds, the screen is a living Jackson Pollock. Then you toggle the "harmonize" filter and the generative algorithm transforms the raw input into something genuinely stunning — smoothing colors, adding symmetry, creating flowing particle trails from each stroke. 1,000 messy taps become a gallery-worthy piece.

**Why it works for this audience:** Everyone's a kid with a paintbrush. No skill needed. The "harmonize" toggle is the technical mic-drop — it shows AI making something messy into something beautiful (which is a perfect metaphor for what AI tools do for development).

**Live-coding scope (~7 min):**

- **Min 0–1:** Prompt Claude — "Create a full-screen HTML canvas with a dark background. When receiving coordinate data (x, y, color), draw a glowing circle at that position with a soft radial gradient. Add a slow particle trail that follows each new point. Use HSL colors."
- **Min 1–3:** Claude generates the canvas renderer. Connect to WebSocket. Test with a few manual inputs — glowing dots appear. *First wow: "I'm painting from my phone."*
- **Min 3–5:** Prompt Claude — "Add a 'harmonize' mode toggle. When active: mirror all strokes across the vertical axis (bilateral symmetry), smooth the particle trails with bezier curves, and add a subtle aurora borealis color-shift effect that blends nearby colors."
- **Min 5–7:** Prompt Claude — "Add a 'timelapse' replay button that replays the entire painting process at 10x speed from first stroke to current state. Also add a download button that saves the canvas as a PNG."

**Pre-built pieces:**
- WebSocket server (shared)
- Mobile color picker + touch-to-paint page (simple: color wheel at top, white canvas area where tapping sends coordinates)
- QR code
- 3 preset "style" modes ready to toggle: Raw, Symmetry, Particle Flow

**Audience interaction:**
- Scan QR → pick a color → tap/drag on phone screen → see your strokes appear on the main screen
- "Everyone paint something — you have 60 seconds!"
- Toggle harmonize mode live for the transformation moment
- End by screenshotting the final artwork: "1,000 of you made this in 60 seconds"

**Risk level:** Medium
- **Main risk:** High-frequency coordinate data over WebSocket could bottleneck. Phone touch events fire rapidly.
- **Recovery:** Throttle to 5 events/second per client. Pre-build a "gallery mode" with 3 pre-rendered crowd canvases you can show if real-time fails. The canvas itself is client-side only, so even if the WebSocket drops, you can demonstrate the rendering with simulated data.

---

## 3. Herd — The Crowd Consensus Game

**Pitch:** A live multiplayer game where 1,000 people try to think like the crowd. "Name a color." Everyone answers. You score points for matching the most popular answer. The visualization shows answers clustering in real time — and the winning answer EXPLODES out of the chaos.

**Wow moment:** The prompt says "Name a fruit." A thousand bubbles pour onto the screen, each showing an answer. Identical answers magnetically attract each other, forming clusters that grow and pulse. "Apple" absorbs more and more bubbles, swelling to 3x the size of "Banana." The countdown hits zero. The winning cluster DETONATES — confetti, screen shake, the word "APPLE" fills the screen in giant letters. Everyone who said "apple" sees a gold star on their phone. The leaderboard reshuffles with names sliding up and down. The energy is pure game show.

**Why it works for this audience:** It's a game, it's competitive, it's social, and it requires zero knowledge. People will literally shout when they see their answer winning. The clustering visualization is the technical showstopper — it looks like a living organism.

**Live-coding scope (~7 min):**

- **Min 0–1:** Prompt Claude — "Create a game screen with a dark background. Show a prompt question at the top ('Name a color'). Below it, a countdown timer (15 seconds). Below that, a large area where answer bubbles will appear. Each bubble is a circle with text inside."
- **Min 1–3:** Claude generates the game UI with timer. *Wow moment 1: the game UI appears, it already looks like a real game show.*
- **Min 3–5:** Prompt Claude — "Add physics: bubbles with identical text should attract each other using a force-directed simulation (d3-force). Different answers repel slightly. As clusters grow, their combined bubble gets larger. Add a gentle floating idle animation."
- **Min 5–7:** Prompt Claude — "When the timer hits zero: freeze all bubbles, highlight the largest cluster with a golden glow, explode it with a confetti particle effect, and display the winning answer in giant text with a score count. Add a leaderboard sidebar showing top 10 player names."

**Pre-built pieces:**
- WebSocket server (shared) with game state management (round tracking, answer collection, scoring)
- Mobile answer page (text input + submit, shows "waiting for results…" after submit)
- QR code
- 5 pre-written prompts of escalating fun:
  1. "Name a color" (easy warm-up)
  2. "Name a fruit" (classic)
  3. "One word to describe this company" (crowd-pleaser)
  4. "Name a country you want to visit" (interesting reveal)
  5. "What's the best pizza topping?" (will cause chaos, perfect closer)
- Scoring logic: 100 points if you match the #1 answer, 50 for #2, 25 for #3

**Audience interaction:**
- Scan QR → type one-word answer → submit → watch the clustering → cheer if you matched
- 3–5 rounds, cumulative scoring
- Winner gets called out on stage
- The "one word for this company" round is a sneaky way to get genuine crowd sentiment — leadership will love seeing it

**Risk level:** Medium
- **Main risk:** Free-text input means messy data (typos, multiple words, trolls). Clustering "Banana" vs "banana" vs "bananas" is a real problem.
- **Recovery:** Pre-build server-side normalization (lowercase, trim, depluralize, spell-check common words). For live demo, if clustering looks messy, manually trigger a "clean up" that shows the top 5 answers as a simple bar chart instead. Have a "demo mode" that simulates 500 clean answers.

---

## 4. TownTalk — Live Q&A Wall with Crowd Voting

**Pitch:** Attendees submit anonymous questions from their phones. Questions appear as glowing, floating bubbles on the main screen. Upvoting makes them physically grow larger and drift to the center. The crowd literally pushes its most important questions to the spotlight — and leadership can't look away.

**Wow moment:** A question about remote work policy gets 50 upvotes in 10 seconds. Its bubble swells from a small orb to a pulsing, golden planet at the center of the screen, physically pushing smaller questions aside. The presenter taps it — it expands into a full-screen spotlight card. The audience just forced leadership to address the elephant in the room, and they did it by voting with their thumbs.

**Why it works for this audience:** It's genuinely useful — not just a demo, but a tool the company might actually want. The "crowd forces the question" dynamic creates real energy. And the physics-based visualization (bubbles growing, colliding, competing for space) is way more visually engaging than a boring list.

**Live-coding scope (~8 min):**

- **Min 0–1:** Prompt Claude — "Create a Q&A board with a dark space-themed background. Questions appear as glowing circular bubbles floating with soft physics (drift, slight bounce off edges). Each bubble shows the question text wrapped inside and a vote count. Use d3-force for layout."
- **Min 1–3.5:** Claude generates the bubble layout with force simulation. Questions float and jostle. *Wow moment 1: the organic, alive feeling of the bubbles is immediately impressive.*
- **Min 3.5–5.5:** Prompt Claude — "Bubble size should scale with vote count (more votes = larger radius). When a bubble crosses 25 votes, give it a golden glow and pulse animation. The force simulation should push high-vote bubbles toward the center. Add a gentle particle trail behind moving bubbles."
- **Min 5.5–7.5:** Prompt Claude — "Add spotlight mode: clicking a bubble expands it to a full-screen card with the question text large and readable, vote count, and a 'dismiss' button that returns to the bubbles view. Add a smooth zoom transition."
- **Min 7.5–8:** Connect to WebSocket, load seed questions, open to audience.

**Pre-built pieces:**
- WebSocket server (shared) with question submission + upvoting
- Mobile page: text input for new questions, scrollable list of existing questions with upvote buttons
- QR code
- 5–8 seed questions pre-loaded to avoid the "empty room" problem (mix of fun + real: "What's our biggest opportunity in 2026?", "Should we have more dogs in the office?")
- A simple keyword blocklist in the server for content moderation (profanity filter)

**Audience interaction:**
- Scan QR → submit a question or browse/upvote existing ones → watch the bubbles compete on screen
- Leadership uses spotlight mode to address top questions live
- Creates a genuinely useful townhall Q&A format (not just a demo)

**Risk level:** Medium
- **Main risk:** Someone submits something inappropriate. Also, d3-force can get janky with 100+ nodes.
- **Recovery:** Pre-build a "hide" button that removes any bubble from the main screen (silent moderation). Cap visible bubbles at 30 (show top 30 by votes, archive the rest). Have a "simple view" fallback that displays questions as a sorted list with animated bars instead of physics bubbles.

---

## 5. Hive Mind — Crowd-Controlled Maze Runner

**Pitch:** A character is trapped in a maze on the main screen. Every 3 seconds, the entire audience votes UP/DOWN/LEFT/RIGHT from their phone. The majority rules. Can 1,000 people coordinate to escape the maze?

**Wow moment:** The vote bars swing wildly — 400 say LEFT, 350 say RIGHT. The timer counts down: 3… 2… 1… LEFT wins. The character slides left — and hits a wall. The room GROANS in unison. Next round: they course-correct. When the character finally reaches the exit? Standing ovation energy.

**Why it works for this audience:** It's Twitch Plays Pokémon for a corporate townhall. Everyone understands a maze. The tension of the countdown, the groans, the cheers — it creates genuine emotional moments. And the "can 1000 people solve a simple problem together?" question is a subtle, brilliant metaphor for any large organization.

**Live-coding scope (~7 min):**

- **Min 0–1:** Prompt Claude — "Create a maze game with a 10x10 grid. Walls are dark gray, paths are black, the player is a bright green circle. Generate a solvable maze using a recursive backtracking algorithm. The goal is a golden star in the bottom-right."
- **Min 1–3:** Claude generates the maze with the character rendered. *Wow moment 1: a good-looking maze with a character appears from a single prompt.*
- **Min 3–5:** Prompt Claude — "Add a voting interface overlay. Show 4 direction arrows (UP/DOWN/LEFT/RIGHT) with live vote bars that fill in real-time. Add a 5-second countdown timer. When the timer hits zero, move the character in the winning direction with a smooth sliding animation. If the move hits a wall, flash red and shake the character."
- **Min 5–7:** Prompt Claude — "Add a move counter, a trail that shows where the character has been (fading breadcrumbs), and a victory animation (confetti + 'ESCAPED!' text) when the character reaches the goal. Also add camera shake when hitting walls."

**Pre-built pieces:**
- WebSocket server (shared) with voting logic (collect votes for 5 seconds, compute winner, broadcast result, reset)
- Mobile voting page (4 large directional arrow buttons, tap to vote, shows countdown + current vote distribution)
- QR code
- 3 pre-designed mazes of increasing difficulty (7x7, 10x10, 12x12) in case you want multiple rounds
- Victory celebration animation as a separate reusable module

**Audience interaction:**
- Scan QR → see 4 direction arrows → tap a direction → watch the vote bars and countdown on their phone → see the character move on the main screen
- Natural crowd dynamics emerge: people yell "GO RIGHT! GO RIGHT!"
- Optionally: add an "optimal path" overlay after escaping that shows the shortest route vs. the crowd's chaotic path (guaranteed laugh)

**Risk level:** Medium
- **Main risk:** The maze might be too hard and take too long (audience loses interest). Voting ties are awkward.
- **Recovery:** Pre-test the maze and ensure it's solvable in 10–15 moves. For ties, add a "random tiebreaker with funny animation" (coin flip). Have a "hint" button that briefly highlights the correct direction. Build a kill-switch maze that's 5x5 and obviously easy.

---

## Recommended Demo Flow

### The Combo: Crowd Pulse (opener) → Pick ONE main demo

**Total runtime: ~15 minutes**

| Segment | Time | What happens |
|---------|------|-------------|
| Intro | 0:00–1:30 | "I'm going to build two apps from scratch using AI, and all of you are going to help me test them. Take out your phones." Show QR code. |
| Crowd Pulse | 1:30–6:00 | Live-code the emoji wall (~4 min). Open to audience. Let it run for 60 sec. Supernova moment. |
| Transition | 6:00–6:30 | "That was the warm-up. Now let's build something real." |
| Main Demo | 6:30–13:30 | Live-code your main pick (~7 min). Open to audience. |
| Close | 13:30–15:00 | Recap what you built. Show the final product. "Two apps, built from English, in 15 minutes." |

### Which main demo to pick?

| If you want... | Pick this |
|----------------|-----------|
| Maximum fun + energy | **Herd** (the consensus game) — the clustering reveal is electric and 5 rounds keep energy high |
| Maximum "useful product" impression | **TownTalk** (Q&A wall) — leadership sees a real tool, you can use it for actual Q&A |
| Maximum "holy shit" visual | **Crowd Canvas** (collaborative art) — the harmonize toggle is a genuine jaw-dropper |
| Maximum hilarity + team bonding | **Hive Mind** (maze runner) — the groans and cheers create unforgettable moments |

**My recommendation for YOUR audience (VP, CTO, 1000 mixed):**

**Crowd Pulse → Herd → TownTalk (if time allows)**

- Open with Crowd Pulse to get phones out and energy up (3 min)
- Herd is the main event: 2–3 rounds of the consensus game (7 min). It's pure entertainment and the clustering visualization is the best showcase of "look what AI built in 5 minutes"
- If you have 3 minutes left, say "One more thing" and switch to TownTalk with pre-seeded questions, letting the audience submit real questions for leadership. This transitions the demo into genuine utility and gives leadership a chance to close with audience Q&A

---

## Pre-Built Infrastructure (Shared Across All Demos)

Build this ONCE ahead of time. Every idea above plugs into it.

### 1. WebSocket Server (~50 lines Node.js)
```
What it does:
- Accepts connections from audience phones
- Routes messages to the main screen by "room" (emoji, canvas, game, qa, maze)
- Broadcasts state updates to all connected clients
- Handles basic rate limiting (max 5 messages/sec per client)

Tech: Node.js + ws library
Run on: Your demo laptop
```

### 2. Mobile Entry Page
```
What it does:
- Single page with tabs/buttons for whichever demo is active
- Auto-detects which demo is running and shows the right UI
- Works on any mobile browser, no install

Tech: Vanilla HTML/JS, served by the same Node.js server
```

### 3. QR Code + URL
```
Setup:
- Use ngrok or a local WiFi network to expose the server
- Generate QR code pointing to http://[your-ip]:3000
- Print QR code on a slide, and a backup on a physical poster
- TEST ON VENUE WIFI THE DAY BEFORE
```

### 4. Fallback Kit
```
For every demo, pre-build:
- A "simulate" button that generates fake audience data
- A "gallery" mode showing a pre-recorded version of the demo working
- A "simple view" fallback that degrades gracefully (list instead of physics, etc.)
```

---

## Rehearsal Checklist

### 1 Week Before
- [ ] WebSocket server built and tested locally
- [ ] All mobile pages working on iPhone + Android Chrome
- [ ] QR code generated and tested
- [ ] Seed data prepared (emoji presets, Q&A seed questions, game prompts, maze designs)
- [ ] Fallback "simulate" buttons built for every demo
- [ ] Run through the full 15-min demo 3 times with a friend on a second phone

### Day Before
- [ ] Test on venue WiFi — if unreliable, switch plan to ngrok over cellular
- [ ] Test QR code from the back of the room (is it readable at distance?)
- [ ] Test the main screen resolution — adjust font sizes and element sizes if needed
- [ ] Do a full dry run in the actual room with 5–10 people
- [ ] Confirm your laptop doesn't sleep/lock during the demo

### Day Of
- [ ] Start the WebSocket server 30 min before
- [ ] Load the QR code on the opening slide
- [ ] Have the "simulate" buttons ready in a hidden browser tab
- [ ] Have all 5 pre-built fallback files in a folder you can open quickly
- [ ] Mute Slack/email notifications on your laptop
- [ ] Deep breath. You've got this.

---

## Quick Comparison Table

| Idea | Wow Factor | Interaction | Build Difficulty | Risk | Best For |
|------|-----------|-------------|-----------------|------|----------|
| Crowd Pulse | ★★★★☆ | ★★★★★ | Easy | Medium | Opener, energy |
| Crowd Canvas | ★★★★★ | ★★★★☆ | Medium | Medium | Visual spectacle |
| Herd | ★★★★★ | ★★★★★ | Medium | Medium | Fun + competition |
| TownTalk | ★★★★☆ | ★★★★★ | Medium | Medium | Utility + Q&A |
| Hive Mind | ★★★★☆ | ★★★★★ | Medium | Medium | Team bonding + laughs |
