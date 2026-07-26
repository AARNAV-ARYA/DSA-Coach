export const repositoryUrl = 'https://github.com/AARNAV-ARYA/DSA-Coach';
export const linkedInUrl = 'https://in.linkedin.com/in/aarnav-arya-72153b1b8';
export const emailAddress = 'aarnavarya9@gmail.com';

export const capabilities = [
  {
    number: '01',
    title: 'Capture in context',
    description:
      'Detects the active LeetCode problem and opens a quiet capture surface beside the solve.',
    detail: 'Allowlisted metadata only',
  },
  {
    number: '02',
    title: 'Remember deliberately',
    description:
      'Records confidence, private notes, and review intent without turning practice into admin work.',
    detail: 'Local-first revision library',
  },
  {
    number: '03',
    title: 'See what needs work',
    description:
      'A calm dashboard makes due reviews, progress, difficulty, and upcoming practice visible.',
    detail: 'Actionable learning signals',
  },
  {
    number: '04',
    title: 'Compare approaches',
    description:
      'Opt-in AI analysis organizes brute-force, improved, and optimal solutions with complexity.',
    detail: 'Editable and consent-gated',
  },
] as const;

export const engineeringDecisions = [
  {
    eyebrow: 'Privacy boundary',
    title: 'Page data never becomes ambient collection.',
    description:
      'A site-specific adapter extracts only the problem context. Editor code is read once, only after explicit AI consent.',
  },
  {
    eyebrow: 'Runtime resilience',
    title: 'Built for a worker that can stop at any time.',
    description:
      'The Manifest V3 service worker owns no durable in-memory truth. Typed messages and browser storage keep every surface reload-safe.',
  },
  {
    eyebrow: 'Learning model',
    title: 'Scheduling stays deterministic and explainable.',
    description:
      'A versioned adaptive engine models difficulty, success, latency, hints, failures, and memory strength without giving AI authority over review dates.',
  },
  {
    eyebrow: 'Provider portability',
    title: 'AI is behind a contract, not inside the product core.',
    description:
      'Strict schemas, consent scopes, curated related problems, and an AiProvider boundary prevent lock-in and malformed output.',
  },
] as const;

export const roadmap = [
  {
    status: 'Available',
    title: 'Local memory loop',
    description:
      'LeetCode capture, notes, review queue, reminders, dashboard, and focused analysis.',
  },
  {
    status: 'Next',
    title: 'Adaptive review migration',
    description:
      'Connect the tested adaptive scheduler to persisted review events and replace legacy fixed-day actions.',
  },
  {
    status: 'Later',
    title: 'Authenticated continuity',
    description:
      'Production identity, HTTPS AI orchestration, cross-device sync, and server-owned learning history.',
  },
] as const;

export const technologies = [
  'React 19',
  'TypeScript 5.9',
  'Vite 8',
  'Tailwind CSS 4',
  'Chrome MV3',
  'Zustand',
  'Zod',
  'Fastify',
  'Vitest',
  'Groq',
] as const;
