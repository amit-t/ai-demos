# Townhall Vibe-Coding Demo — Optimized Prompt

> **What changed and why:** A before/after comparison follows the optimized prompt at the bottom of this document.

---

## The Optimized Prompt

```
<context>
I'm a developer preparing a live "vibe coding" demo for my company's upcoming townhall.
The demo will be presented to my VP and CTO, plus a mixed audience of ~[INSERT NUMBER]
people — mostly non-technical (product, design, ops, leadership) with some engineers.

Tool I'll be using for the live demo: Claude Cowork (Claude's desktop app with computer use)
My comfort level: I can explain code at a high level but the audience shouldn't need to read code
Company domain: [INSERT YOUR COMPANY'S DOMAIN, e.g., fintech / healthcare / e-commerce]
</context>

<task>
Suggest 3–5 app ideas I can vibe-code live in under 15 minutes that will wow a non-technical audience.

For each idea, provide:
1. **App name** — a catchy, one-line title
2. **One-sentence pitch** — what it does and why it's impressive
3. **Wow moment** — the single visual or interactive moment that will make the audience react
4. **Live-coding scope** (5–8 min) — exactly what I build on stage, step by step
5. **Pre-built pieces** — what I should prepare ahead of time so the demo stays under 15 min
6. **Audience interaction** — how attendees can participate live (e.g., vote, submit input, scan a QR code)
7. **Risk level** — Low / Medium / High — likelihood something breaks live, and a recovery plan if it does
</task>

<hard_constraints>
NEVER suggest:
- Terminal-only or CLI apps with no visual output
- Apps requiring API keys, paid services, or accounts to be set up live
- Anything that takes more than 8 minutes of live coding (the remaining time is for intro + audience interaction)
- Ideas that require the audience to install software

ALWAYS ensure:
- Every idea has a single, visually striking "wow moment" within the first 3 minutes of coding
- The app runs entirely in a browser or as a local file (HTML/React/Python with visual output)
- Audience interaction requires nothing more than a phone browser
- Pre-built pieces are clearly separated from the live-coded parts
</hard_constraints>

<output_format>
Return ideas ranked by "wow-factor-to-risk" ratio (highest wow, lowest risk first).

For each idea use this exact structure:

### [NUMBER]. [APP NAME]
**Pitch:** [one sentence]
**Wow moment:** [specific visual/interactive moment]
**Live-coding scope (~X min):**
- Step 1: ...
- Step 2: ...
- Step 3: ...
**Pre-built pieces:**
- ...
**Audience interaction:**
- ...
**Risk level:** [Low/Medium/High] — [one-line recovery plan]

After all ideas, add a section:
### Recommended Pick
[Which idea to go with and why, given the audience and time constraint]
</output_format>

<examples>
Good idea example (for calibration):
- "Live Poll Dashboard" — attendees scan a QR code to vote on a fun question, results animate on screen in real time. Pre-built: the server and QR code. Live-coded: the animated chart and theme styling. Wow moment: votes appear on screen within 2 seconds of submission.

Bad idea example (too complex):
- "AI-powered Slack bot that summarizes channels" — requires Slack API setup, OAuth, and has no visual wow moment for a live audience.
</examples>
```

---

## What Changed and Why

| # | Weakness in Original | Fix Applied | Why It Matters |
|---|---------------------|-------------|----------------|
| 1 | **No role or context** — Claude doesn't know who you are, your audience size, or your tool | Added `<context>` block with speaker profile, audience composition, tool, and company domain | Claude tailors complexity and domain relevance to your actual situation |
| 2 | **Vague success criteria** — "simple," "wow factor," "visual UI" are subjective | Defined "wow moment" as a specific deliverable per idea + hard time constraint (3 min to first wow) | Forces concrete, testable suggestions instead of hand-wavy ideas |
| 3 | **No output format** — response could be a paragraph or a bulleted list | Added exact output structure with 7 fields per idea + a final recommendation | You get a scannable, decision-ready comparison table instead of a wall of text |
| 4 | **No hard constraints** — nothing preventing Claude from suggesting complex, risky ideas | Added `<hard_constraints>` block with 4 NEVER + 4 ALWAYS rules | Eliminates CLI-only apps, API-dependent setups, and install-required ideas upfront |
| 5 | **"Prepare pieces ahead of time" is vague** — Claude doesn't know what that means | Made "Pre-built pieces" a required field separated from "Live-coding scope" | You get a clear prep checklist vs. live-coding script |
| 6 | **No risk assessment** — live demos break; no mention of failure planning | Added "Risk level" field with mandatory recovery plan | You pick ideas knowing what could go wrong and how to recover |
| 7 | **No audience interaction specifics** — "interacted with" could mean anything | Added "Audience interaction" field + constraint that it must work on a phone browser | Ensures every idea has a concrete participation mechanism |
| 8 | **No ranking criteria** — if Claude gives 5 ideas, how do you pick? | Added "wow-factor-to-risk ratio" ranking + "Recommended Pick" section | Claude does the decision-making work for you |
| 9 | **"Use any relevant skill" is noise** — adds tokens without guiding behavior | Removed entirely | Claude already knows its capabilities; this just wastes context window |
| 10 | **No calibration examples** — Claude guesses what "good" and "bad" look like | Added good/bad examples in `<examples>` block | Anchors Claude's quality bar with concrete reference points |

---

## How to Use This Prompt

1. **Fill in the `[INSERT ...]` placeholders** — audience size and company domain
2. **Paste the entire prompt** (everything inside the code block) into Claude Cowork
3. **Pick your favorite idea** from the ranked output
4. **Ask Claude to build the "pre-built pieces"** first, then practice the live-coding steps
5. **Do one dry run** with the prompt: *"Now walk me through coding [CHOSEN APP] step by step as if we're doing the live demo"*
