# Townhall Demo — Talking Script

> **Speaker**: Amit, Director of Engineering
> **Format**: Virtual townhall (~1000 attendees, all geographies)
> **Duration**: ~15 minutes
> **Tone**: Light opener, then sincere and grounded throughout
> **Demo**: Choose either TownTalk (Q&A bubbles) or Station Command (fuel station dashboard)

---

## Before You Go Live

- Server running (`./start.sh` — confirm tunnel URL appears)
- Browser open to `localhost` (blank or placeholder page)
- AI coding tool ready (Claude Code / Windsurf / Cursor)
- Phone nearby with mobile page loaded (to show audience what they'll see)
- Backup `display.html` saved somewhere safe, just in case
- QR code tested — scan it yourself, confirm voting works

---

## Opening (Minute 0–2)

> Hey everyone — thanks for joining in. I don't really I should say good morning, evening, or afternoon. So I wish you a good part of the day you're having.

> Let's dive, as I open up my AI setup quick side note, My wife saw me rehearsing this demo last night and asked what I was doing. I said, "I'm going to write code live in front hundreds of people." She looked at me and said, "I thought you were a *director*. I didn't know directors code. "
>
> She's mostly right, though besides being a director I am now a Human Intelligence Agent in Hani's team. 

But joke's apart today I'm going to show you something that's changing that — and honestly, it's changing how our entire industry thinks about building software.
>
> I want to spend the next 5 minutes showing you — not telling you, *showing* you — what it looks like when AI and a human work together to build something real. No slides. No pre-recorded videos. I'm going to build a working application from scratch, right here, while you watch.


> Before I start, a bit of context.
>
> There's a term floating around in the engineering world right now — "vibe coding." The idea is simple: instead of writing every line of code by hand, you describe what you want in plain English, and an AI generates the code for you. You guide it, you shape it, you course-correct — but the AI does the heavy lifting.
>
> Now, I know that might sound a bit hand-wavy, so let me just show you what it actually looks like in practice.


## IF USING TOWNTALK (Q&A Bubbles)

### Hook & QR Code (Minute 3–4)

> What we're building is called TownTalk. It's a live Q&A app. You submit questions from your phone, and they appear on screen as floating bubbles. The more people upvote a question, the bigger and brighter the bubble gets. Physics-based, real-time, the whole thing.
>
> But here's the thing — I'm not just going to demo a finished product. I'm going to build it live, and **you're going to be part of it**.
>
> So first — I need everyone to scan this QR code.

**→ Press Q to show the QR overlay.**

> You'll see it on screen now. Pull out your phones, scan it, and you'll get a page where you can submit questions and upvote others. Go ahead — submit anything you want. Serious questions, fun ones, doesn't matter. They'll show up on screen as I build it.
>

> Great — While a few of you're getting connected. Let's go and build the application's UI

### Live Coding — Prompt 1 (Minute 4–7)

> Alright, here's the moment. I've got my Windsurf AI Agent open. I'm going to describe what I want, and it's going to write the entire front-end.

I have this prompt prepared, because I am still human, let me paste it here.

> While this generates — what you're seeing is me giving the AI a detailed description of the layout, the physics engine, the WebSocket connection, the visual design. It's not magic — it's a very specific set of instructions. 

While my agent writes, it's boring to sit idle, so I will pass it over to Sushant who will also parelelly build an app using Claude Code. We have a kind of a bet going on right now which of the tool is better.

**→ Code appears. Save the file. Refresh the browser.**

> And there it is. We have floating bubbles. Each one is a question someone in the audience submitted. Look at the sizes — the ones with more upvotes are already bigger. This is a real D3.js physics simulation with WebSocket connections to all of your phones, running live.
>
> Go ahead — upvote something. Watch the bubble grow.

**→ Pause and let the audience interact for 15–20 seconds.**

### Live Coding — Prompt 2 (Minute 7–9)

> Now let's make it more interactive.

**→ Paste Prompt 2.**

> I'm asking the AI to add two things: a spotlight mode — so I can click any bubble and zoom into it — and a QR code overlay so latecomers can still join.

**→ Code generates. Save. Refresh.**

> Now if I click this bubble here...

**→ Click a popular bubble to demo spotlight.**

> ...there's the full question, with a live vote count. And that count is updating in real-time as people vote. Pretty cool.

### Live Coding — Prompt 3 (Minute 9–11)

> For the last piece — I want to show you how fast iteration works. I'm going to add a simulation mode so the screen stays visually alive even after we move on.

**→ Paste Prompt 3. Save. Refresh. Press S to start simulation.**

> Now we've got simulated questions flowing in alongside your real ones. The AI wrote a simulation engine that submits random questions and upvotes — all in about 20 seconds of generation time.

---

## IF USING STATION COMMAND (Fuel Station Dashboard)

### Hook & QR Code (Minute 3–4)

> What we're building is something close to home for us — a real-time operations dashboard for fuel stations. Eight stations, live data, transactions ticking, pumps going online and offline, revenue flowing in. The kind of thing our customers actually need.
>
> But here's the fun part — I'm not just going to build it. I'm going to let **you** decide what features go into it.
>
> Scan this QR code with your phone.

**→ Press Q to show QR code overlay.**

> You'll see a list of features on your phone — things like a dark mode toggle, sparkline charts, station drill-down panels. Vote for the one you want me to build. Whichever gets the most votes, I'll build it live, right here.
>
> Take about 30 seconds to get connected and cast your vote.

**→ Wait 30 seconds. Dismiss QR.**

> Alright — [N] people connected, votes are coming in. Let's build.

### Live Coding — Prompt 1 (Minute 4–7)

> So I've got my AI coding tool open. I'm going to describe the dashboard I want — the layout, the KPI cards, the revenue chart, the station grid — and the AI is going to write the whole thing.

**→ Paste Prompt 1 into your AI tool.**

> While this generates, let me explain what's happening. The server behind this is simulating 8 fuel stations with realistic data — transactions, pump utilization, revenue curves that follow real-world patterns. The front-end I'm building right now just needs to connect to it and display the data.

**→ Code appears. Save. Refresh browser.**

> And there it is. Four KPI cards across the top — transactions, revenue, active pumps, average fuel price — all updating every 3 seconds. A revenue chart tracking hourly trends. And eight station tiles with live status indicators.
>
> Watch the numbers — they're changing in real-time. That little animated counter effect? The AI just... did that. I asked for it in one sentence.

### Live Coding — Prompt 2 (Minute 7–9)

> Let's add the rest.

**→ Paste Prompt 2.**

> Now I'm asking for a live alert feed — so we can see when stations have issues — and the feature vote leaderboard, so we can see what you all are voting for.

**→ Code generates. Save. Refresh.**

> There we go. Alerts sliding in on the left — you can see a pump just went offline at Station 4. And on the right — the leaderboard. I can see the votes coming in live. Looks like the current leader is...

**→ Read the top-voted feature from the leaderboard.**

### Audience-Driven Build — Prompt 3 (Minute 9–11)

> Alright, the audience has spoken. The number one feature is **[read the winner]**. So let's build it. Right now.

**→ Paste the matching Prompt 3 template.**

> This is my favorite part of the demo — because you chose this. This isn't a script. I didn't know which feature would win. The AI is generating the code based on what a thousand people just voted for.

**→ Code generates. Save. Refresh.**

> And there it is. **[Describe what appeared — e.g., "You can now click any station and get a full detail panel" or "Look at the sparklines inside each KPI card."]**

---

## Closing (Minute 11–15) — Same for Both Demos

> So let's step back and think about what just happened.
>
> In about 10 minutes, we went from a blank page to a working, real-time, interactive application — one that a thousand people across the world were using simultaneously while I built it.
>
> I want to be clear about something. This isn't about replacing engineers. If anything, it's the opposite. What you saw me do today was *engineering* — making design decisions, structuring the prompts, knowing what to ask for, debugging when things didn't look right. The AI wrote the code, but the thinking was human.
>
> What changes is the speed. The barrier between having an idea and seeing it come to life just got dramatically lower. A feature that might take a sprint to build? You can prototype it in 10 minutes. A concept you want to validate with stakeholders? Build it live in the meeting.
>
> For us as an engineering organization, this means a few things:
>
> First — the ability to experiment goes way up. When building a prototype costs minutes instead of weeks, we can try more ideas and fail faster on the ones that don't work.
>
> Second — the bar for communication changes. Being able to describe what you want clearly and precisely becomes just as important as knowing how to code it. Prompt engineering isn't a buzzword — it's a skill, and it's one we'll all be developing.
>
> Third — and this is the one I care about most — this lets us focus more time on the problems that actually matter. The hard problems. The architectural decisions, the customer experience, the things that need human judgment. The AI handles the scaffolding so we can spend our energy on what makes our products great.
>
> I'm genuinely excited about where this takes us. Not because the technology is cool — though it is — but because it lets us do more of the work that matters.
>
> Thanks, everyone. And for those of you who submitted questions or voted — thank you for being part of this. That was the whole point.

---

## Q&A Transition

> I'm happy to take a few questions if we have time. And if you still have the app open on your phone — feel free to submit questions there too.

**→ If using TownTalk: click the biggest bubble to spotlight the top question. If using Station Command: glance at the vote leaderboard for conversation starters.**

---

## Emergency Recovery Lines

If something breaks during the demo, stay calm. Here are natural things to say:

- **If code doesn't generate**: *"The AI is taking a moment — just like any of us would with a complex problem. Let me nudge it."* (Re-paste the prompt or try the mega prompt.)

- **If the page looks broken**: *"This is actually a great example of why human oversight matters. Let me see what happened."* (Check browser console, fix, or swap in backup display.html.)

- **If WebSocket disconnects**: *"Looks like we lost the connection for a second — it'll auto-reconnect."* (It should reconnect within 2 seconds. If not, refresh.)

- **If tunnel goes down**: *"The tunnel dropped — this happens with live demos. The app still works locally, let me switch to that."* (Use localhost URL instead.)

- **If audience can't connect**: *"If the QR isn't working, try this URL directly — I'll paste it in the chat."* (Share the mobile URL in the meeting chat.)

- **If nothing works at all**: *"Well, the live demo gods are not with us today. Let me show you one I built earlier."* (Open the backup display.html. No one will judge you.)
