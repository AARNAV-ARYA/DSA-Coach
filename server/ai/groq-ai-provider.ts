import { z } from 'zod';
import {
  AI_PROMPT_VERSION,
  aiInsightsSchema,
  codeReviewSchema,
  realLifeAnalogySchema,
  solutionStageSchema,
  visualFlowSchema,
  workedExampleSchema,
  type AiGenerationRequest,
  type AiInsights,
} from '../../src/features/ai/model/ai-contracts.js';
import { AiProviderError, type AiProvider } from './ai-provider.js';
import { buildLeetCodeUrl, leetCodeCatalog, resolveCatalogProblems } from './leetcode-catalog.js';
import { AI_SYSTEM_PROMPT, buildAiUserPrompt } from './prompt.js';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 25_000;

const generatedInsightsSchema = z.object({
  conciseNotes: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  algorithm: z.object({
    name: z.string().trim().min(1).max(100),
    explanation: z.string().trim().min(1).max(400),
  }),
  pattern: z.object({
    name: z.string().trim().min(1).max(100),
    recognitionSignals: z.array(z.string().trim().min(1).max(180)).min(1).max(4),
  }),
  relatedProblemSlugs: z.array(z.string()).max(3),
  relatedProblemReasons: z.array(z.string().trim().min(1).max(240)).max(3),
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
  codeReview: codeReviewSchema,
  solutionProgression: z.array(solutionStageSchema).min(2).max(3),
  realLifeAnalogy: realLifeAnalogySchema,
  workedExample: workedExampleSchema,
  visualFlow: visualFlowSchema,
});

const groqResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable() }),
      }),
    )
    .min(1),
});

type Fetch = typeof globalThis.fetch;

export interface GroqAiProviderOptions {
  apiKey: string;
  model?: string;
  fetch?: Fetch;
}

export class GroqAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetch: Fetch;

  constructor(options: GroqAiProviderOptions) {
    if (options.apiKey.trim().length === 0) {
      throw new AiProviderError('GROQ_API_KEY is required.', 'configuration_error', false);
    }

    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_GROQ_MODEL;
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async generateProblemInsights(request: AiGenerationRequest): Promise<AiInsights> {
    let response: Response;
    try {
      response = await this.fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: buildAiUserPrompt(request) },
          ],
          temperature: 0.2,
          response_format: buildResponseFormat(),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error.';
      throw new AiProviderError(`Groq request failed: ${message}`, 'provider_error', true);
    }

    if (!response.ok) {
      throw new AiProviderError(
        `Groq returned HTTP ${String(response.status)}.`,
        'provider_error',
        response.status === 429 || response.status >= 500,
      );
    }

    const envelope = groqResponseSchema.safeParse(await response.json());
    const content = envelope.success ? envelope.data.choices[0]?.message.content : null;
    if (content === null || content === undefined) {
      throw new AiProviderError(
        'Groq returned an invalid response envelope.',
        'invalid_provider_response',
        false,
      );
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new AiProviderError(
        'Groq returned malformed structured output.',
        'invalid_provider_response',
        false,
      );
    }

    const generated = generatedInsightsSchema.safeParse(parsedContent);
    if (!generated.success) {
      throw new AiProviderError(
        'Groq output did not match the insight contract.',
        'invalid_provider_response',
        false,
      );
    }

    const relatedProblems = resolveCatalogProblems(generated.data.relatedProblemSlugs).map(
      (problem, index) => ({
        title: problem.title,
        url: buildLeetCodeUrl(problem.slug),
        reason:
          generated.data.relatedProblemReasons[index] ??
          `Practises the ${problem.patterns.join(' and ')} pattern.`,
      }),
    );
    return aiInsightsSchema.parse({
      conciseNotes: generated.data.conciseNotes,
      algorithm: generated.data.algorithm,
      pattern: generated.data.pattern,
      relatedProblems,
      stuckPrediction: generated.data.stuckPrediction,
      oneLineIntuition: generated.data.oneLineIntuition,
      optimalSolution: generated.data.optimalSolution,
      codeReview: generated.data.codeReview,
      solutionProgression: generated.data.solutionProgression,
      realLifeAnalogy: generated.data.realLifeAnalogy,
      workedExample: generated.data.workedExample,
      visualFlow: generated.data.visualFlow,
      metadata: {
        model: this.model,
        promptVersion: AI_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
      },
    });
  }
}

function buildResponseFormat(): Record<string, unknown> {
  const catalogSlugs = leetCodeCatalog.map((problem) => problem.slug);

  return {
    type: 'json_schema',
    json_schema: {
      name: 'dsa_problem_insights',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: [
          'conciseNotes',
          'algorithm',
          'pattern',
          'relatedProblemSlugs',
          'relatedProblemReasons',
          'stuckPrediction',
          'oneLineIntuition',
          'optimalSolution',
          'codeReview',
          'solutionProgression',
          'realLifeAnalogy',
          'workedExample',
          'visualFlow',
        ],
        properties: {
          conciseNotes: {
            type: 'array',
            items: { type: 'string' },
          },
          algorithm: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'explanation'],
            properties: {
              name: { type: 'string' },
              explanation: { type: 'string' },
            },
          },
          pattern: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'recognitionSignals'],
            properties: {
              name: { type: 'string' },
              recognitionSignals: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          relatedProblemSlugs: {
            type: 'array',
            items: { type: 'string', enum: catalogSlugs },
          },
          relatedProblemReasons: {
            type: 'array',
            items: { type: 'string' },
          },
          stuckPrediction: {
            type: 'object',
            additionalProperties: false,
            required: ['hypothesis', 'confidence', 'evidence'],
            properties: {
              hypothesis: { type: 'string' },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              evidence: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          oneLineIntuition: { type: 'string' },
          optimalSolution: {
            type: 'object',
            additionalProperties: false,
            required: ['summary', 'timeComplexity', 'spaceComplexity'],
            properties: {
              summary: { type: 'string' },
              timeComplexity: { type: 'string' },
              spaceComplexity: { type: 'string' },
            },
          },
          codeReview: {
            type: 'object',
            additionalProperties: false,
            required: [
              'provided',
              'language',
              'summary',
              'strengths',
              'improvements',
              'correctnessRisk',
            ],
            properties: {
              provided: { type: 'boolean' },
              language: { type: 'string' },
              summary: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
              correctnessRisk: { type: 'string' },
            },
          },
          solutionProgression: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'kind',
                'title',
                'idea',
                'intuition',
                'code',
                'timeComplexity',
                'spaceComplexity',
                'tradeoff',
              ],
              properties: {
                kind: {
                  type: 'string',
                  enum: ['brute-force', 'improved', 'optimal'],
                },
                title: { type: 'string' },
                idea: { type: 'string' },
                intuition: { type: 'string' },
                code: { type: 'string' },
                timeComplexity: { type: 'string' },
                spaceComplexity: { type: 'string' },
                tradeoff: { type: 'string' },
              },
            },
          },
          realLifeAnalogy: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'explanation'],
            properties: {
              title: { type: 'string' },
              explanation: { type: 'string' },
            },
          },
          workedExample: {
            type: 'object',
            additionalProperties: false,
            required: ['input', 'steps', 'output'],
            properties: {
              input: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              output: { type: 'string' },
            },
          },
          visualFlow: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'steps'],
            properties: {
              title: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['label', 'detail'],
                  properties: {
                    label: { type: 'string' },
                    detail: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
