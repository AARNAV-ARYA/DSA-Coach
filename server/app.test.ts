import { afterEach, describe, expect, it } from 'vitest';
import type { AiInsights } from '../src/features/ai/model/ai-contracts.js';
import type { AiProvider } from './ai/ai-provider.js';
import { createServer } from './app.js';

const insights: AiInsights = {
  conciseNotes: ['Use a complement lookup.'],
  algorithm: { name: 'Hash map', explanation: 'Store previously seen values.' },
  pattern: { name: 'Complement lookup', recognitionSignals: ['Find a pair for a target.'] },
  relatedProblems: [],
  stuckPrediction: {
    hypothesis: 'There is not enough shared evidence to infer a specific blocker.',
    confidence: 'low',
    evidence: [],
  },
  oneLineIntuition: 'Let each number ask whether its missing partner has appeared.',
  optimalSolution: {
    summary: 'Scan the array once and store each value after checking for its complement.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  metadata: {
    model: 'test-model',
    promptVersion: 'problem-insights-v1',
    generatedAt: '2026-07-21T00:00:00.000Z',
  },
};

const provider: AiProvider = {
  generateProblemInsights: () => Promise.resolve(insights),
};

const servers: Awaited<ReturnType<typeof createServer>>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('AI API', () => {
  it('returns structured insights for a consented request', async () => {
    const server = await createServer({ aiProvider: provider });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/problem-insights',
      payload: {
        problem: {
          title: 'Two Sum',
          url: 'https://leetcode.com/problems/two-sum/',
          difficulty: 'Easy',
        },
        consentScopes: ['problem_metadata'],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ insights });
  });

  it('rejects context supplied without consent', async () => {
    const server = await createServer({ aiProvider: provider });
    servers.push(server);

    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/problem-insights',
      payload: {
        problem: {
          title: 'Two Sum',
          url: 'https://leetcode.com/problems/two-sum/',
          difficulty: 'Easy',
        },
        consentScopes: ['problem_metadata'],
        code: 'console.log("not consented")',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'invalid_request', retryable: false });
  });

  it('allows loopback development origins without allowing arbitrary websites', async () => {
    const server = await createServer({ aiProvider: provider });
    servers.push(server);

    const loopback = await server.inject({
      method: 'OPTIONS',
      url: '/v1/ai/problem-insights',
      headers: {
        origin: 'http://127.0.0.1:5176',
        'access-control-request-method': 'POST',
      },
    });
    const arbitrary = await server.inject({
      method: 'OPTIONS',
      url: '/v1/ai/problem-insights',
      headers: {
        origin: 'https://example.com',
        'access-control-request-method': 'POST',
      },
    });

    expect(loopback.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5176');
    expect(arbitrary.headers['access-control-allow-origin']).toBeUndefined();
  });
});
