import { describe, expect, it } from 'vitest';
import { aiGenerationRequestSchema } from '@/features/ai/model/ai-contracts';

describe('AI generation request consent', () => {
  it('accepts only the explicitly consented optional context', () => {
    const parsed = aiGenerationRequestSchema.parse({
      problem: {
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
      },
      consentScopes: ['problem_metadata', 'reflection'],
      reflection: 'I missed the complement lookup.',
    });

    expect(parsed.reflection).toBe('I missed the complement lookup.');
    expect(parsed.code).toBeUndefined();
  });

  it('rejects non-LeetCode URLs and unconsented fields', () => {
    const result = aiGenerationRequestSchema.safeParse({
      problem: {
        title: 'Unknown',
        url: 'https://example.com/problem',
        difficulty: 'Medium',
      },
      consentScopes: ['problem_metadata'],
      approach: 'This was not approved for sharing.',
    });

    expect(result.success).toBe(false);
  });
});
