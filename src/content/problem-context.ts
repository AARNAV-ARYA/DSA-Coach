import { extractLeetCodeSolutionCode } from '@/content/leetcode/code-extractor';
import { startLeetCodeProblemIntegration } from '@/content/leetcode/start';

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isSolutionCodeRequest(message)) return;
  sendResponse({ code: extractLeetCodeSolutionCode() });
});

startLeetCodeProblemIntegration();

/**
 * Keep this guard local to the manifest content-script entry.
 * Chrome loads manifest content scripts as classic scripts, so sharing a runtime
 * helper with the extension UI can make Vite emit an unsupported ES-module import.
 */
function isSolutionCodeRequest(
  value: unknown,
): value is { version: 1; type: 'content.solution-code.request' } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { version?: unknown; type?: unknown };
  return candidate.version === 1 && candidate.type === 'content.solution-code.request';
}
