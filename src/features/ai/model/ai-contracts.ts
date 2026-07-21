import { z } from 'zod';

export const AI_PROMPT_VERSION = 'problem-insights-v1' as const;

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
  metadata: z.object({
    model: z.string().trim().min(1).max(120),
    promptVersion: z.literal(AI_PROMPT_VERSION),
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
