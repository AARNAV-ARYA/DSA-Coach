# Roadmap

No production code begins until the architecture and product specification are approved.

## Phase 0 — Architecture approval

- Agree on product boundaries, permissions, data ownership, and AI policy.
- Choose concrete vendors and record ADRs.
- Confirm the first supported site and the capture consent experience.

## Phase 1 — Foundation

- Create the TypeScript monorepo, MV3 shell, CI, test strategy, deployment foundations, and observability.
- Implement identity, API contracts, migrations, local cache/outbox, and a non-production mock adapter.
- Establish the premium design system and accessibility baselines.

## Phase 2 — Private beta memory loop

- Build confirmed capture, cards, daily recall, deterministic scheduling, notes, and sync.
- Release popup, side panel, and dashboard with one supported site.
- Validate permissions, offline behavior, telemetry, and data deletion/export.

## Phase 3 — Analytics and reliability

- Add concept metrics, weakness explanations, reminders, performance hardening, and support tooling.
- Scale workers, queues, and projections based on observed demand.

## Phase 4 — AI coach

- Introduce explicit-consent AI reflection and interview-practice features behind limits and evaluation.
- Measure learning benefit, safety, cost, and trust before broad rollout.
