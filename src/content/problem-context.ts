import { extractLeetCodeSolutionCode } from '@/content/leetcode/code-extractor';
import { startLeetCodeProblemIntegration } from '@/content/leetcode/start';
import { isExtensionMessage } from '@/shared/lib/messaging/contracts';

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isExtensionMessage(message) || message.type !== 'content.solution-code.request') return;
  sendResponse({ code: extractLeetCodeSolutionCode() });
});

startLeetCodeProblemIntegration();
