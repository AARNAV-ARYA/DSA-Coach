# DSA Coach

DSA Coach is a premium Chrome extension that helps interview candidates remember every DSA problem they solve. It uses active recall, spaced repetition, private reflections, analytics, and an opt-in AI coach.

It is deliberately not another solved-problem tracker. Its job is to turn solving history into durable memory.

## Current status

Phase 1 project foundation and the local revision experience are available. DSA Coach detects a LeetCode problem’s number, title, difficulty, and canonical URL, then opens a focused capture panel. Users can keep private notes, manage reviews, and receive reminders. The codebase includes a tested, versioned adaptive scheduling engine; migrating the legacy fixed-day review actions and saved records to that engine remains an explicit integration step. The dashboard also includes an opt-in AI study workspace as a local development vertical slice; its API remains loopback-only until account identity and authenticated cloud deployment exist.

When adding a detected LeetCode question, the learner may explicitly opt in to a one-time read of the active code editor. The question is saved immediately even if AI is unavailable. Analysis records are stored locally per question and appear latest-first in the dashboard’s **Analysis** view. The focused view contains only the editable topic, brute-force, improved, and optimal methods, time/space complexity, and verified related problems.

## Local development

```bash
npm install
npm run dev
```

For the AI workspace, copy `.env.example` to the ignored `.env`, set a server-side `GROQ_API_KEY`, and start the loopback API in a second terminal:

```bash
npm run dev:api
```

The Groq key must never be added to extension storage, frontend environment variables, source code, or Git. The dashboard requests optional access to `http://127.0.0.1:8787` only when the user generates insights.

Use `npm run check` for Prettier, ESLint, strict TypeScript validation, and tests. Use `npm run build` to produce the unpacked Chrome extension in `dist/` and the API in `dist-server/`; load `dist/` through Chrome's **Load unpacked** control on the Extensions page.

Production commands:

```bash
npm run test:production  # build and validate the Chrome package
npm run package:chrome   # create release/dsa-coach-<version>-chrome.zip
npm run build:firefox    # create and validate dist-firefox/
```

The extension core is offline-ready because its code, UI assets, revision data, notes, and generated analyses are packaged or stored locally. New AI generation requires the separately running API. The loopback API is a development-only boundary and must be replaced with an authenticated HTTPS deployment before advertising AI in a public store release.

## Source-of-truth documents

- [Product specification](PROJECT_SPEC.md) — users, scope, workflows, and UX bar.
- [Technical architecture](ARCHITECTURE.md) — extension design, backend, communication, storage, schema, APIs, privacy, and scale plan.
- [Roadmap](ROADMAP.md) — approval gates and implementation sequence.
- [Contributing](CONTRIBUTING.md) — change and documentation standards.
- [Privacy policy](PRIVACY.md) — current data handling and deletion behavior.
- [Publication checklist](docs/RELEASE_CHECKLIST.md) — package and Web Store gates.

## Design commitments

- Chrome Manifest V3, with a minimal-permission and site-specific consent model.
- Local-first interactions with server-authoritative account and learning data.
- Active recall before answers, explainable scheduling, and private-by-default data handling.
- A deliberately calm, fast, accessible experience rather than a feature-dense tracker.
