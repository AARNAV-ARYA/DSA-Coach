import { create } from 'zustand';
import { extensionStorage } from '@/shared/lib/storage/extension-storage';
import {
  revisionOutcomes,
  type RevisionProblem,
  type RevisionProblemDraft,
  type RevisionProblemSource,
} from '@/features/revision/model/revision-types';

export const revisionStorageKey = 'dsa-coach.revision-problems.v1';
const problemAnalysisStorageKey = 'dsa-coach.problem-analyses.v1';

interface RevisionState {
  problems: RevisionProblem[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addProblem: (draft: RevisionProblemDraft) => Promise<RevisionProblem | null>;
  updateProblem: (id: string, draft: RevisionProblemDraft) => Promise<void>;
  reviewProblemToday: (id: string) => Promise<void>;
  snoozeProblem: (id: string) => Promise<void>;
  completeProblem: (id: string) => Promise<void>;
  skipProblem: (id: string) => Promise<void>;
  removeProblem: (id: string) => Promise<void>;
}

export const useRevisionStore = create<RevisionState>((set, get) => ({
  problems: [],
  isHydrated: false,
  hydrate: async () => {
    const persistedProblems = await extensionStorage.get<unknown>(revisionStorageKey);
    set({
      problems: isRevisionProblemList(persistedProblems) ? sortByReviewDate(persistedProblems) : [],
      isHydrated: true,
    });
  },
  addProblem: async (draft) => {
    const title = draft.title.trim();
    if (title === '') return null;

    if (
      draft.source !== undefined &&
      findProblemBySource(get().problems, draft.source) !== undefined
    ) {
      return null;
    }

    const problem: RevisionProblem = {
      id: createId(),
      title,
      outcome: draft.outcome,
      reviewDate: draft.reviewDate,
      createdAt: new Date().toISOString(),
      ...(draft.note?.trim() === '' || draft.note === undefined ? {} : { note: draft.note.trim() }),
      ...(draft.source === undefined ? {} : { source: draft.source }),
    };
    const problems = sortByReviewDate([...get().problems, problem]);
    await extensionStorage.set(revisionStorageKey, problems);
    set({ problems });
    return problem;
  },
  updateProblem: async (id, draft) => {
    const problems = sortByReviewDate(
      get().problems.map((problem) => {
        if (problem.id !== id) return problem;

        const updated: RevisionProblem = {
          ...problem,
          title: draft.title.trim(),
          outcome: draft.outcome,
          reviewDate: draft.reviewDate,
        };
        if (draft.note?.trim() === '' || draft.note === undefined) {
          delete updated.note;
        } else {
          updated.note = draft.note.trim();
        }
        return updated;
      }),
    );
    await extensionStorage.set(revisionStorageKey, problems);
    set({ problems });
  },
  reviewProblemToday: async (id) => {
    const problems = sortByReviewDate(
      get().problems.map((problem) =>
        problem.id === id ? { ...problem, reviewDate: today() } : problem,
      ),
    );
    await extensionStorage.set(revisionStorageKey, problems);
    set({ problems });
  },
  snoozeProblem: async (id) => {
    await rescheduleProblem(id, 1, set, get);
  },
  completeProblem: async (id) => {
    const problems = sortByReviewDate(
      get().problems.map((problem) =>
        problem.id === id
          ? { ...problem, outcome: 'mastered' as const, reviewDate: reviewDateFromToday(30) }
          : problem,
      ),
    );
    await extensionStorage.set(revisionStorageKey, problems);
    set({ problems });
  },
  skipProblem: async (id) => {
    await rescheduleProblem(id, 7, set, get);
  },
  removeProblem: async (id) => {
    const problems = get().problems.filter((problem) => problem.id !== id);
    await Promise.all([
      extensionStorage.set(revisionStorageKey, problems),
      removeStoredProblemAnalysis(id),
    ]);
    set({ problems });
  },
}));

async function removeStoredProblemAnalysis(problemId: string): Promise<void> {
  const stored = await extensionStorage.get<unknown>(problemAnalysisStorageKey);
  if (!Array.isArray(stored)) return;
  const remaining = stored.filter((record) => {
    if (typeof record !== 'object' || record === null) return false;
    return (record as { problemId?: unknown }).problemId !== problemId;
  });
  await extensionStorage.set(problemAnalysisStorageKey, remaining);
}

async function rescheduleProblem(
  id: string,
  days: number,
  set: (partial: Partial<RevisionState>) => void,
  get: () => RevisionState,
): Promise<void> {
  const problems = sortByReviewDate(
    get().problems.map((problem) =>
      problem.id === id ? { ...problem, reviewDate: reviewDateFromToday(days) } : problem,
    ),
  );
  await extensionStorage.set(revisionStorageKey, problems);
  set({ problems });
}

export function reviewDateFromToday(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function today(): string {
  return reviewDateFromToday(0);
}

function isRevisionProblemList(value: unknown): value is RevisionProblem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== 'object' || item === null) return false;

      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.title === 'string' &&
        revisionOutcomes.some((outcome) => outcome === candidate.outcome) &&
        isDateInputValue(candidate.reviewDate) &&
        typeof candidate.createdAt === 'string' &&
        (candidate.note === undefined || typeof candidate.note === 'string') &&
        (candidate.source === undefined || isRevisionProblemSource(candidate.source))
      );
    })
  );
}

export function findProblemBySource(
  problems: RevisionProblem[],
  source: RevisionProblemSource,
): RevisionProblem | undefined {
  return problems.find(
    (problem) =>
      problem.source?.provider === source.provider && problem.source.problemId === source.problemId,
  );
}

function sortByReviewDate(problems: RevisionProblem[]): RevisionProblem[] {
  return [...problems].sort((first, second) => first.reviewDate.localeCompare(second.reviewDate));
}

function isDateInputValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isRevisionProblemSource(value: unknown): value is RevisionProblemSource {
  if (typeof value !== 'object' || value === null) return false;

  const source = value as Record<string, unknown>;
  return (
    source.provider === 'leetcode' &&
    typeof source.problemId === 'string' &&
    typeof source.title === 'string' &&
    (source.difficulty === 'Easy' ||
      source.difficulty === 'Medium' ||
      source.difficulty === 'Hard') &&
    typeof source.url === 'string'
  );
}

function toDateInputValue(date: Date): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
