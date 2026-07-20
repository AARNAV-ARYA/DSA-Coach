# DSA Coach — Product Specification

## Mission

Help interview candidates remember every DSA problem they solve through active recall, spaced repetition, intelligent capture, AI coaching, and actionable analytics.

DSA Coach is a **memory system**, not a generic LeetCode tracker. Its product promise is that the user does not need to maintain a separate spreadsheet or remember what to revisit: the system does that work with their permission.

## Target users

Students and competitive programmers preparing for demanding technical interviews, including candidates targeting Google, Meta, Amazon, Microsoft, Apple, OpenAI, Jane Street, Uber, and Palantir.

## Product principles

1. **Capture with consent.** Detect context only on sites the user enabled; require clear user confirmation for meaningful additions.
2. **Recall before reveal.** Start each revision with a prompt, not an answer or solution.
3. **Minimal by default.** Show the single next action; advanced analytics remain one level deeper.
4. **Explain the system.** Recommendations must say why a problem is due or considered weak.
5. **Private by default.** Personal notes, activity, and AI inputs belong to the user.
6. **Premium through restraint.** Calm typography, generous spacing, responsive feedback, and subtle motion—not visual noise.

## Core user journeys

### Capture a solved problem

1. On an enabled site, DSA Coach recognizes a supported problem context.
2. The side panel presents the problem title and relevant metadata, without interrupting the solve.
3. The user confirms they solved it, selects confidence, and optionally adds a short reflection.
4. DSA Coach creates the appropriate recall cards and tells the user when it will reappear.

### Complete daily recall

1. The popup or reminder presents a calm “N due today” entry point.
2. The user sees one prompt (for example, “What pattern makes Two Sum work?”) and recalls before revealing.
3. They self-grade accuracy and confidence.
4. The next due date is calculated immediately and shown with a short explanation.

### Understand a weakness

1. The dashboard shows concept-level trends, not only a solved count.
2. The learner opens a weak area to see the evidence: lapses, low-confidence recalls, or slow recognition.
3. The system recommends an achievable next action: review, re-solve, or learn a prerequisite.

### Ask the AI coach (post-MVP)

1. The user asks for help and selects what context may be shared.
2. The coach guides reflection, pattern recognition, or an interview-style explanation.
3. It states uncertainty, does not auto-submit code, and never replaces active recall.

## MVP scope

- Account and cross-device sync.
- One or more explicitly enabled problem-site adapters.
- Confirmed problem capture with difficulty/tags where available.
- Active-recall cards, deterministic spaced repetition, and daily queue.
- Private notes, confidence, and lightweight solve history.
- Side panel, popup, and full-page dashboard.
- Basic topic analytics and optional notifications.

## Explicitly not MVP

- Automatic scraping of all browsing activity.
- Full code editor, code runner, or code submission.
- Public leaderboards/social network.
- AI chat that stores page content by default.
- Native mobile application.

## UX quality bar

The UI should use a small design-token system, system-aware light/dark themes, a restrained typographic scale, accessible contrast and focus states, keyboard-first review controls, and motion only to clarify a state change. Aim for immediate perceived response: optimistic local state, skeletons only where needed, and no blocking spinners for routine review actions.

## Success signals

- Activation: first confirmed capture and first recall session in the initial week.
- Habit: weekly recall completion and return rate.
- Learning: recall accuracy and latency improve for previously solved patterns.
- Trust: low permission-denial regret, low capture undo rate, and low support volume for unexpected data.

## Non-goals and guardrails

Do not optimize vanity counts over durable memory. Do not make AI advice appear more certain than it is. Do not request broader permissions or send more personal data merely for convenience.
