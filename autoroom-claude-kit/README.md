# AutoRoom Claude Kit / AutoRoom-ի Claude հավաքածու

A Claude Code starter kit that turns the AutoRoom website spec into **agents**,
**a skill**, and **tasks** so Claude Code can build the site into the (currently
empty) repo `github.com/DGalstyan/AutoRoom`. Target stack: **Next.js (App Router)
+ React + TypeScript + Tailwind CSS**.

Այս հավաքածուն AutoRoom-ի կայքի պահանջները վերածում է Claude-ի գործակալների
(agents), հմտության (skill) և առաջադրանքների (tasks)՝ Next.js + React + Tailwind
կայքը կառուցելու համար։

## What's inside / Ինչ կա ներսում

```
autoroom-claude-kit/
├─ .claude/
│  └─ agents/                     # Subagents / Ենթագործակալներ
│     ├─ design-system.md         # Tailwind theme, tokens, primitives, motion
│     ├─ frontend-builder.md      # Pages & components (default feature agent)
│     ├─ forms-and-leads.md       # Universal/Quiz/booking popups & CRM wiring
│     ├─ content-armenian.md      # Armenian copy guardian + i18n
│     └─ qa-reviewer.md           # Independent QA gate
├─ skills/
│  └─ autoroom-website/           # The skill (source form)
│     ├─ SKILL.md                 # Design system + logic + how-to-use
│     └─ references/
│        ├─ design-tokens.md      # Colors, type, spacing, motion, tailwind config
│        ├─ components.md         # Contracts for every shared component
│        ├─ pages.md              # Section-by-section spec, all 8 pages
│        ├─ faq.md                # Exact FAQ strings (Homepage aggregates)
│        └─ branches.md           # 3 branch records (single source of truth)
├─ autoroom-website.skill         # The skill, zipped (installable form)
└─ TASKS.md                       # Bilingual phased build plan (Phase 0–7)
```

## How to use / Ինչպես օգտագործել

1. **Drop the agents into the repo.** Copy `.claude/agents/*.md` to the repo root
   `.claude/agents/`. Claude Code will pick them up automatically; invoke by name
   (e.g. "use frontend-builder to implement the China car detail").
2. **Install the skill.** The skill lives in two forms:
   - `skills/autoroom-website/` — editable source (SKILL.md + references).
   - `autoroom-website.skill` — the same folder zipped, ready to save as a skill
     in your Claude account (if your org allows saving skills). Once available,
     the agents reference it automatically.
   You can also just keep the `skills/autoroom-website/` folder in the repo; the
   agents are written to read `SKILL.md` and its `references/` by path.
3. **Work the plan.** Follow `TASKS.md` phase by phase. Start with Phase 0
   (scaffold + design system), then Phase 1 (shared components — highest reuse),
   then the pages. Each task names the agent that should own it.

## The two rules that matter most / Երկու ամենակարևոր կանոնը

- **Lead widget:** the **Quiz Popup** is used only on the global sticky CTA and
  the Homepage final CTA (Section 10). Everywhere else, "Ստանալ առաջարկ" opens the
  **Universal Popup**. Car-detail "Ստանալ անհատական առաջարկ" opens the per-car
  prefilled Universal Popup.
- **Armenian copy is fixed.** All UI text comes from `references/` verbatim and
  lives in `messages/hy.json`. Never machine-translate approved strings.

## Assets & decisions to line up early / Վաղ պատրաստելիք

Order from the client before Phase 2–4: AI exploded-view hero video (Car Anatomy),
60–90s AI import-flow video (USA scrollytelling), founder video, customer-story
videos, branch/team photos, bank & auction logos. Open decisions: 2nd Armavir
branch data, USA FAQ answers, CompareTool matching logic, partner-portal auth
provider, CRM endpoint + calendar sync. (Also tracked at the bottom of `TASKS.md`.)
