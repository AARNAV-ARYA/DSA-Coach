import { describe, expect, it } from 'vitest';
import { extractLeetCodeSolutionCode } from '@/content/leetcode/code-extractor';

describe('extractLeetCodeSolutionCode', () => {
  it('uses the accessible LeetCode code editor value', () => {
    const root = {
      querySelector: (selector: string) =>
        selector === 'textarea[aria-label="Code editor"]'
          ? { value: '  function twoSum() { return []; }  ' }
          : null,
    };

    expect(extractLeetCodeSolutionCode(root)).toBe('function twoSum() { return []; }');
  });

  it('falls back to the Monaco input area and ignores empty editors', () => {
    const root = {
      querySelector: (selector: string) =>
        selector === '.monaco-editor textarea.inputarea' ? { value: 'class Solution {};' } : null,
    };

    expect(extractLeetCodeSolutionCode(root)).toBe('class Solution {};');
  });

  it('returns null when no learner code is available', () => {
    expect(extractLeetCodeSolutionCode({ querySelector: () => null })).toBeNull();
  });
});
