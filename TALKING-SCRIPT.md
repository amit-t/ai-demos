> Hey everyone — thanks for joining in. 

### 
I don't really know if I should say good morning, evening, or afternoon. So I wish you a good part of whatever the day you're having.
###

### 
I am Amit, Director Of Engineering, ICS, and today I want to spend the next few minutes *showing* you what it looks like when AI and a human work together to build something real. No slides. No pre-recorded videos. I'm going to build a working application from scratch, right here, while you watch. 
###

So let's dive right into it. What I am doing today has a term I am sure all of you have heard already, it's called "vibe coding."
You describe what you want in plain English, and an AI generates the code. You guide it, you shape it — but the AI does the heavy lifting.

So what we're building is called TownTalk — a live Q&A app. You submit questions from your phone, they appear on screen as floating physics-based bubbles. The more you upvote, the bigger the bubble gets. And all of **you're going to be part of it**.

Let me share my screen here.
You should see a QR code on screen right now. Pull out your phones, scan it, and submit a question and they'll show up on screen as I build the UI of TownTalk.

**→ QR code is already showing on the waiting room page. Give people ~20 seconds to connect.**

> Great — Everyone's with me, let's go.


> Alright, so I've got my Windsurf AI Agent open. I'm going to describe what I want, and it's going to write the entire front-end.

> I have this massive prompt pre-prepared, because I am still human, let me paste it here.
>
> What you're seeing is a very specific set of instructions I am giving AI — the layout, the physics engine, the WebSocket connections. No magic here.

> While my agent writes, let me quickly take you through the windsurf interface.

> This panel on the right is called **Cascade** — it's essentially the brain of Windsurf's AI agent. There are three modes you can work in:
>
> **Code** is the default — you describe what you want, like I just did, and the agent writes code, edits files, runs commands, all in one flow. It has full context of your project, so it's not just auto-complete — it understands the whole codebase.
>
> **Ask** mode is for when you just want answers — "explain this function," "why is this failing," "what does this dependency do?" — without the agent making any changes to your code.
>
> And then there's **Plan** mode, which is great for bigger features. You describe a goal, and the agent breaks it down into steps before writing anything. You review the plan, tweak it, and then let it execute. Think of it as pair-programming or a relentless tireless partner where the AI drafts the blueprint first.
>
> You'll also notice the model selector up here — you can pick which AI model powers Cascade. Different models have different strengths — speed, reasoning depth, code quality. For today I'm using one that balances speed and accuracy, because, well, we're live and I don't want to tempt the demo gods.

And here it is my display.html fully written by Windsurf AI Agent. Let's go and refresh our screen and see it in action.

Floating bubbles — each one is a question someone in this audience submitted. Look at the sizes — the ones with more upvotes are already bigger. This is a real physics simulation with live WebSocket connections to all of your phones.

> Go ahead — upvote something. Watch the bubble grow.

> If I click a bubble, I get a spotlight view with the live vote count updating in real-time. And if you missed the QR code earlier — press Q — there it is again.

---

## Closing (Minute 3.5–5)

> So let's step back. In about 3 minutes, we went from a blank page to a working, real-time, interactive application that several of you from across the world are using right now.
>
> This isn't about replacing engineers. What you saw me do was *engineering* — deciding what to build, structuring the instructions, knowing what to ask for. The AI wrote the code, but the thinking was human.
>
> What changes is the speed. A feature that might take a sprint to prototype — you can have it running in minutes. A concept your product team wants you to validate? Build it live in the meeting.
>
Let me see if I still have some time left, if I do we can nerd out a little buit more here 
Let's imagine product, because it's always them, wants me to change the color of the bubble. Here's what I'm going to do

Change the color of the bubbles to a neo brutalist palette, with high contrast.

And there it is, done in minutes not in sprints.
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
