import type { LeetCodeProblemContext } from '@/content/leetcode/types';

const problemPath = /^\/problems\/([^/]+)\/?/;
const difficultyValues = ['Easy', 'Medium', 'Hard'] as const;

export function isLeetCodeProblemPage(location: Location): boolean {
  return location.hostname === 'leetcode.com' && problemPath.test(location.pathname);
}

export function extractLeetCodeProblemContext(
  document: Document,
  location: Location,
): LeetCodeProblemContext | null {
  if (!isLeetCodeProblemPage(location)) return null;

  const heading = findQuestionHeading(document, location);
  if (heading === null) return null;

  const headingMatch = heading.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
  if (headingMatch === null) return null;

  const [, problemId, title] = headingMatch;
  const difficulty = findDifficulty(document);
  if (problemId === undefined || title === undefined || difficulty === null) return null;

  return {
    provider: 'leetcode',
    problemId,
    title,
    difficulty,
    url: canonicalProblemUrl(location),
  };
}

function findQuestionHeading(document: Document, location: Location): string | null {
  const selectors = [
    '[data-cy="question-title"]',
    '[data-testid="question-title"]',
    'a[href^="/problems/"][href$="/description/"]',
  ];

  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (isProblemHeading(text)) return text;
  }

  // LeetCode has changed its header markup several times. Fall back to semantic
  // headings, then an anchor pointing to the current problem—not arbitrary page text.
  const headingElements = document.querySelectorAll('h1, h2, h3, [role="heading"]');
  for (const element of headingElements) {
    const text = element.textContent?.trim();
    if (isProblemHeading(text)) return text;
  }

  const currentSlug = location.pathname.match(problemPath)?.[1];
  if (currentSlug === undefined) return null;

  const matchingProblemLinks = document.querySelectorAll<HTMLAnchorElement>(
    `a[href*="/problems/${CSS.escape(currentSlug)}/"]`,
  );
  for (const link of matchingProblemLinks) {
    const text = link.textContent?.trim();
    if (isProblemHeading(text)) return text;
  }

  return null;
}

function findDifficulty(document: Document): LeetCodeProblemContext['difficulty'] | null {
  const selectors = [
    '[data-difficulty]',
    '[class*="text-difficulty"]',
    '[class*="text-difficulty-easy"]',
    '[class*="text-difficulty-medium"]',
    '[class*="text-difficulty-hard"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const candidate = element?.getAttribute('data-difficulty') ?? element?.textContent?.trim();
    if (candidate !== undefined && isDifficulty(candidate)) return candidate;
  }

  // This keeps the fallback deliberately narrow: it only accepts a standalone
  // difficulty label, never free-form problem text, code, or a solution.
  const labels = document.querySelectorAll<HTMLElement>('button, div, span');
  for (const label of labels) {
    const candidate = label.textContent?.trim();
    if (candidate !== undefined && isDifficulty(candidate)) return candidate;
  }

  return null;
}

function canonicalProblemUrl(location: Location): string {
  const match = location.pathname.match(problemPath);
  const slug = match?.[1];
  return slug === undefined ? location.href : `https://leetcode.com/problems/${slug}/`;
}

function isDifficulty(value: string): value is LeetCodeProblemContext['difficulty'] {
  return difficultyValues.some((difficulty) => difficulty === value);
}

function isProblemHeading(value: string | undefined): value is string {
  return value !== undefined && /^\d+\.\s+.+/.test(value);
}
