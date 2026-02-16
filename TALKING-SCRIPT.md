# Townhall Demo — Talking Script

> **Speaker**: Amit, Director of Engineering
> **Format**: Virtual townhall (~1000 attendees, all geographies)
> **Duration**: ~5 minutes
> **Tone**: Light opener, then sincere and grounded throughout
> **Demo**: TownTalk (Q&A bubbles) — single prompt, built live

---

## Before You Go Live

- Server running (`./start.sh` — confirm tunnel URL appears)
- Browser open to `localhost` (waiting room with QR code shows automatically)
- Windsurf AI Agent ready with Mega Prompt copied to clipboard
- Phone nearby with mobile page loaded (to show audience what they'll see)
- Backup `display.html` saved somewhere safe, just in case
- QR code tested — scan it yourself, confirm voting works

---

## Opening + QR Code (Minute 0–1.5)

> Hey everyone — thanks for joining in. I don't really know if I should say good morning, evening, or afternoon. So I wish you a good part of whatever the day you're having.
> I am Amit, Director - Engineering and today I want to spend the next few minutes *showing* you what it looks like when AI and a human work together to build something real. No slides. No pre-recorded videos. I'm going to build a working application from scratch, right here, while you watch. 

So let's dive right into it. What I am doing today has a term I am sure all of you have heard aklready, it's called "vibe coding."
You describe what you want in plain English, and an AI generates the code. You guide it, you shape it — but the AI does the heavy lifting.

So what we're building is called TownTalk — a live Q&A app. You submit questions from your phone, they appear on screen as floating physics-based bubbles. The more you upvote, the bigger the bubble gets. And **you're going to be part of it**.

You should see a QR code on screen right now. Pull out your phones, scan it, and submit a question — anything you want. They'll show up on screen as I build it.

**→ QR code is already showing on the waiting room page. Give people ~20 seconds to connect.**

> Great — I can see some of you getting connected. Let's go and build the application's UI.

---

## Live Coding (Minute 1.5–3.5)

> Alright, here's the moment. I've got my Windsurf AI Agent open. I'm going to describe what I want, and it's going to write the entire front-end.

**→ Paste the Mega Prompt into Windsurf.**

> I have this prompt prepared, because I am still human, let me paste it here.
>
> What you're seeing is me giving the AI a detailed description — the layout, the physics engine, the WebSocket connections, the visual design. It's not magic — it's a very specific set of instructions.

> While my agent writes, let me quickly take you through the windsurf's agent window called cascade.

**→ Code appears. Save the file. Browser auto-refreshes from the waiting room.**

And here it is my display.html fully written by Windsurf AI Agent. Let's go and refresh our screen and see it in action.

Floating bubbles — each one is a question someone in this audience submitted. Look at the sizes — the ones with more upvotes are already bigger. This is a real physics simulation with live WebSocket connections to all of your phones.

> Go ahead — upvote something. Watch the bubble grow.

**→ Let audience interact for 10-15 seconds. Click a popular bubble to show spotlight mode.**

> If I click a bubble, I get a spotlight view with the live vote count updating in real-time. And if you missed the QR code earlier — press Q — there it is again.

---

## Closing (Minute 3.5–5)

> So let's step back. In about 3 minutes, we went from a blank page to a working, real-time, interactive application that hundreds of people across the world are using right now.
>
> This isn't about replacing engineers. What you saw me do was *engineering* — deciding what to build, structuring the instructions, knowing what to ask for. The AI wrote the code, but the thinking was human.
>
> What changes is the speed. A feature that might take a sprint to prototype — you can have it running in minutes. A concept your product team wants you to validate? Build it live in the meeting.
>
> If time permits - Now for example product wants me to change the color of the bubble. I can just change the color in the prompt and it will be done in minutes.
>
> Thanks, everyone. And for those of you who submitted questions — thank you for being part of this. 

---

## Emergency Recovery Lines

If something breaks, stay calm:

- **Code won't generate**: *"The AI is thinking — let me nudge it."* → Re-paste or try a shorter prompt.
- **Page looks broken**: *"Great example of why human oversight matters."* → Check console, or swap in backup display.html.
- **WebSocket drops**: *"It'll auto-reconnect in a sec."* → If not, refresh.
- **Audience can't connect**: *"Let me paste the URL in chat."* → Share mobile URL directly.
- **Nothing works**: *"The demo gods aren't with us — let me show one I built earlier."* → Open backup display.html.
