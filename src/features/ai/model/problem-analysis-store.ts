import { create } from 'zustand';
import { AiClientError, generateAiInsights } from '@/features/ai/lib/ai-client';
import { aiInsightsSchema, type AiInsights } from '@/features/ai/model/ai-contracts';
import type { RevisionProblem } from '@/features/revision/model/revision-types';
import { extensionStorage } from '@/shared/lib/storage/extension-storage';
import { z } from 'zod';

export const problemAnalysisStorageKey = 'dsa-coach.problem-analyses.v1';

const problemAnalysisRecordSchema = z.object({
  problemId: z.string().min(1),
  title: z.string().min(1).max(160),
  url: z.string().url().max(500),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  problemCreatedAt: z.string().datetime(),
  status: z.enum(['generating', 'ready', 'needs-code', 'failed']),
  sourceCode: z.string().max(20_000).optional(),
  insights: aiInsightsSchema.optional(),
  error: z.string().max(500).optional(),
  updatedAt: z.string().datetime(),
});

export type ProblemAnalysisRecord = z.infer<typeof problemAnalysisRecordSchema>;

interface ProblemAnalysisState {
  records: ProblemAnalysisRecord[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  analyzeProblem: (problem: RevisionProblem, sourceCode: string | null) => Promise<void>;
  updateSourceCode: (problemId: string, sourceCode: string) => Promise<void>;
  updateInsights: (
    problemId: string,
    updater: (current: AiInsights) => AiInsights,
  ) => Promise<void>;
}

export const useProblemAnalysisStore = create<ProblemAnalysisState>((set, get) => ({
  records: [],
  isHydrated: false,
  hydrate: async () => {
    const stored = await extensionStorage.get<unknown>(problemAnalysisStorageKey);
    const parsed = z.array(problemAnalysisRecordSchema).safeParse(stored);
    set({ records: parsed.success ? sortNewestFirst(parsed.data) : [], isHydrated: true });
  },
  analyzeProblem: async (problem, sourceCode) => {
    if (problem.source === undefined) return;

    const existing = get().records.find((record) => record.problemId === problem.id);
    const trimmedCode = sourceCode?.trim() ?? '';
    const base = {
      problemId: problem.id,
      title: problem.title,
      url: problem.source.url,
      difficulty: problem.source.difficulty,
      problemCreatedAt: problem.createdAt,
      updatedAt: new Date().toISOString(),
    } as const;

    if (trimmedCode === '') {
      await upsertRecord(
        {
          ...base,
          status: 'needs-code',
          error: 'LeetCode did not expose editor code. Paste your solution here, then retry.',
          ...(existing?.insights === undefined ? {} : { insights: existing.insights }),
        },
        set,
        get,
      );
      return;
    }

    await upsertRecord(
      {
        ...base,
        status: 'generating',
        sourceCode: trimmedCode,
        ...(existing?.insights === undefined ? {} : { insights: existing.insights }),
      },
      set,
      get,
    );

    try {
      const insights = await generateAiInsights({
        problem: {
          title: problem.title,
          url: problem.source.url,
          difficulty: problem.source.difficulty,
        },
        consentScopes: ['problem_metadata', 'code'],
        code: trimmedCode.slice(0, 12_000),
      });
      await upsertRecord({ ...base, status: 'ready', sourceCode: trimmedCode, insights }, set, get);
    } catch (caught) {
      const error =
        caught instanceof AiClientError
          ? caught.message
          : 'The analysis could not be generated. Your question and code remain saved locally.';
      await upsertRecord(
        {
          ...base,
          status: 'failed',
          sourceCode: trimmedCode,
          error,
          ...(existing?.insights === undefined ? {} : { insights: existing.insights }),
        },
        set,
        get,
      );
    }
  },
  updateSourceCode: async (problemId, sourceCode) => {
    const record = get().records.find((candidate) => candidate.problemId === problemId);
    if (record === undefined) return;
    await upsertRecord({ ...record, sourceCode, updatedAt: new Date().toISOString() }, set, get);
  },
  updateInsights: async (problemId, updater) => {
    const record = get().records.find((candidate) => candidate.problemId === problemId);
    if (record?.insights === undefined) return;
    const insights = aiInsightsSchema.parse(updater(record.insights));
    await upsertRecord(
      { ...record, insights, status: 'ready', updatedAt: new Date().toISOString() },
      set,
      get,
    );
  },
}));

async function upsertRecord(
  record: ProblemAnalysisRecord,
  set: (partial: Partial<ProblemAnalysisState>) => void,
  get: () => ProblemAnalysisState,
): Promise<void> {
  const parsed = problemAnalysisRecordSchema.parse(record);
  const records = sortNewestFirst([
    parsed,
    ...get().records.filter((candidate) => candidate.problemId !== parsed.problemId),
  ]);
  await extensionStorage.set(problemAnalysisStorageKey, records);
  set({ records });
}

function sortNewestFirst(records: ProblemAnalysisRecord[]): ProblemAnalysisRecord[] {
  return [...records].sort((first, second) =>
    second.problemCreatedAt.localeCompare(first.problemCreatedAt),
  );
}
