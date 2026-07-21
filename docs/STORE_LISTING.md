# Chrome Web Store listing draft

## Name

DSA Coach

## Short description

A private memory system for DSA interview preparation with capture, revision, reminders, and opt-in AI analysis.

## Detailed description

DSA Coach turns solved LeetCode questions into a calm, local-first revision system.

- Add a detected problem from an unobtrusive LeetCode button.
- Record understanding and a private note.
- Keep a focused review queue and reminders.
- Compare brute-force, improved, and optimal solutions with complexity.
- Generate analysis only after explicit consent to share the active solution code.

Your revision library stays on your device in this release. DSA Coach does not sell data, inject ads, submit code, or collect unrelated browsing activity.

## Single purpose

Help learners retain DSA problem-solving knowledge through deliberate capture and revision.

## Permission justifications

- `storage`: saves the learner's revision library, notes, preferences, and opted-in analysis locally.
- `alarms`: performs lightweight due-review checks even when extension pages are closed.
- `notifications`: delivers review reminders and capture confirmation.
- `sidePanel`: keeps capture beside the active LeetCode problem without replacing the page.
- `activeTab`: opens capture for the tab involved in a direct user command.
- `https://leetcode.com/*`: detects only problem number, title, difficulty, canonical URL, and—after separate affirmative consent—the active editor code.
- optional `http://127.0.0.1:8787/*`: development-only AI API access requested only when the user enables AI generation. This permission must be removed or replaced by the production HTTPS endpoint before public AI launch.

## Category and language

- Category: Productivity
- Primary language: English

## Required listing images

- 128 × 128 extension icon: `public/icons/icon-128.png`
- At least one 1280 × 800 screenshot showing the real extension experience.
- One 440 × 280 small promotional image.

Use actual product UI only. Do not advertise cloud sync, adaptive scheduling integration, or public AI availability until those production paths are complete.
