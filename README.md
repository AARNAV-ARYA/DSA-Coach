# DSA Coach

DSA Coach is a premium Chrome extension that helps interview candidates remember every DSA problem they solve. It uses active recall, spaced repetition, private reflections, analytics, and—later—an opt-in AI coach.

It is deliberately not another solved-problem tracker. Its job is to turn solving history into durable memory.

## Current status

Phase 1 project foundation is complete. The first scoped Phase 2 browser integration is also available: after Chrome grants the extension’s narrowly scoped LeetCode access at installation, DSA Coach detects supported problem pages and shows a small in-page detail control. It reads only the problem ID, title, difficulty, and canonical URL; it does not save data or implement reviews yet.

## Local development

```bash
npm install
npm run dev
```

Use `npm run check` for Prettier, ESLint, and strict TypeScript validation. Use `npm run build` to produce the unpacked Chrome extension in `dist/`; load that directory through Chrome's **Load unpacked** control on the Extensions page.

## Source-of-truth documents

- [Product specification](PROJECT_SPEC.md) — users, scope, workflows, and UX bar.
- [Technical architecture](ARCHITECTURE.md) — extension design, backend, communication, storage, schema, APIs, privacy, and scale plan.
- [Roadmap](ROADMAP.md) — approval gates and implementation sequence.
- [Contributing](CONTRIBUTING.md) — change and documentation standards.

## Design commitments

- Chrome Manifest V3, with a minimal-permission and site-specific consent model.
- Local-first interactions with server-authoritative account and learning data.
- Active recall before answers, explainable scheduling, and private-by-default data handling.
- A deliberately calm, fast, accessible experience rather than a feature-dense tracker.
