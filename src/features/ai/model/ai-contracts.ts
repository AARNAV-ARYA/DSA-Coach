import { z } from 'zod';

export const AI_PROMPT_VERSION = 'problem-analysis-v2' as const;
const aiPromptVersionSchema = z.enum(['problem-insights-v1', AI_PROMPT_VERSION]);

export const aiConsentScopeSchema = z.enum([
  'problem_metadata',
  'approach',
  'reflection',
  'code',
  'performance',
]);

export type AiConsentScope = z.infer<typeof aiConsentScopeSchema>;

const optionalBoundedText = (maximum: number) => z.string().trim().min(1).max(maximum).optional();

export const aiGenerationRequestSchema = z
  .object({
    problem: z.object({
      title: z.string().trim().min(1).max(160),
      url: z
        .string()
        .url()
        .max(500)
        .refine((value) => new URL(value).hostname === 'leetcode.com', {
          message: 'Only canonical LeetCode URLs are supported.',
        }),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    }),
    consentScopes: z.array(aiConsentScopeSchema).min(1).max(5),
    approach: optionalBoundedText(6_000),
    reflection: optionalBoundedText(3_000),
    code: optionalBoundedText(12_000),
    performance: z
      .object({
        timeTakenMinutes: z.number().finite().min(0).max(1_440),
        hintsUsed: z.number().int().min(0).max(100),
        failures: z.number().int().min(0).max(100),
      })
      .optional(),
  })
  .superRefine((value, context) => {
    const scopes = new Set(value.consentScopes);
    if (!scopes.has('problem_metadata')) {
      context.addIssue({
        code: 'custom',
        message: 'Problem metadata consent is required.',
        path: ['consentScopes'],
      });
    }

    const scopedFields = [
      ['approach', value.approach],
      ['reflection', value.reflection],
      ['code', value.code],
      ['performance', value.performance],
    ] as const;

    for (const [scope, field] of scopedFields) {
      if (field !== undefined && !scopes.has(scope)) {
        context.addIssue({
          code: 'custom',
          message: `${scope} was supplied without consent.`,
          path: [scope],
        });
      }
    }
  });

export type AiGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;

export const codeReviewSchema = z.object({
  provided: z.boolean(),
  language: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(800),
  strengths: z.array(z.string().trim().min(1).max(240)).max(5),
  improvements: z.array(z.string().trim().min(1).max(300)).max(6),
  correctnessRisk: z.string().trim().min(1).max(500),
});

export const solutionStageSchema = z.object({
  kind: z.enum(['brute-force', 'improved', 'optimal']),
  title: z.string().trim().min(1).max(100),
  idea: z.string().trim().min(1).max(800),
  intuition: z.string().trim().min(1).max(500),
  code: z.string().trim().min(1).max(8_000),
  timeComplexity: z.string().trim().min(1).max(80),
  spaceComplexity: z.string().trim().min(1).max(80),
  tradeoff: z.string().trim().min(1).max(400),
});

export const realLifeAnalogySchema = z.object({
  title: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(1).max(900),
});

export const workedExampleSchema = z.object({
  input: z.string().trim().min(1).max(500),
  steps: z.array(z.string().trim().min(1).max(400)).min(1).max(8),
  output: z.string().trim().min(1).max(500),
});

export const visualFlowSchema = z.object({
  title: z.string().trim().min(1).max(140),
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        detail: z.string().trim().min(1).max(300),
      }),
    )
    .min(2)
    .max(8),
});

export const aiInsightsSchema = z.object({
  conciseNotes: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  algorithm: z.object({
    name: z.string().trim().min(1).max(100),
    explanation: z.string().trim().min(1).max(400),
  }),
  pattern: z.object({
    name: z.string().trim().min(1).max(100),
    recognitionSignals: z.array(z.string().trim().min(1).max(180)).min(1).max(4),
  }),
  relatedProblems: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        url: z.string().url().max(500),
        reason: z.string().trim().min(1).max(240),
      }),
    )
    .max(3),
  stuckPrediction: z.object({
    hypothesis: z.string().trim().min(1).max(400),
    confidence: z.enum(['low', 'medium', 'high']),
    evidence: z.array(z.string().trim().min(1).max(180)).max(4),
  }),
  oneLineIntuition: z.string().trim().min(1).max(240),
  optimalSolution: z.object({
    summary: z.string().trim().min(1).max(1_200),
    timeComplexity: z.string().trim().min(1).max(80),
    spaceComplexity: z.string().trim().min(1).max(80),
  }),
  codeReview: codeReviewSchema.optional(),
  solutionProgression: z.array(solutionStageSchema).min(2).max(3).optional(),
  realLifeAnalogy: realLifeAnalogySchema.optional(),
  workedExample: workedExampleSchema.optional(),
  visualFlow: visualFlowSchema.optional(),
  metadata: z.object({
    model: z.string().trim().min(1).max(120),
    promptVersion: aiPromptVersionSchema,
    generatedAt: z.string().datetime(),
  }),
});

export type AiInsights = z.infer<typeof aiInsightsSchema>;

export const aiGenerationResponseSchema = z.object({
  insights: aiInsightsSchema,
});

export type AiGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;

export const savedAiDraftSchema = z.object({
  request: aiGenerationRequestSchema,
  insights: aiInsightsSchema,
  savedAt: z.string().datetime(),
});

export type SavedAiDraft = z.infer<typeof savedAiDraftSchema>;
