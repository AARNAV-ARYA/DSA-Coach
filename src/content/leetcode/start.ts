import { extractLeetCodeProblemContext } from '@/content/leetcode/adapter';
import type { LeetCodeProblemContext } from '@/content/leetcode/types';
import { LeetCodeProblemWidget } from '@/content/leetcode/widget';

const widgetId = 'dsa-coach-leetcode-widget';
const integrationMarker = '__dsaCoachLeetCodeIntegrationStarted__';

type IntegrationWindow = Window & { [integrationMarker]?: boolean };

export function startLeetCodeProblemIntegration(): void {
  const integrationWindow = window as IntegrationWindow;
  if (integrationWindow[integrationMarker] === true) return;
  integrationWindow[integrationMarker] = true;

  let widget: LeetCodeProblemWidget | null = null;
  let lastLocation = globalThis.location.href;
  let extractionTimer: number | undefined;

  const refresh = (): void => {
    const context = extractLeetCodeProblemContext(document, globalThis.location);
    if (context === null) {
      widget?.unmount();
      widget = null;
      return;
    }

    widget?.unmount();
    widget = new LeetCodeProblemWidget(context);
    widget.mount();
    reportDetectedContext(context);
  };

  const scheduleRefresh = (): void => {
    if (extractionTimer !== undefined) globalThis.clearTimeout(extractionTimer);
    extractionTimer = globalThis.setTimeout(() => {
      extractionTimer = undefined;
      if (document.getElementById(widgetId) === null || globalThis.location.href !== lastLocation) {
        lastLocation = globalThis.location.href;
        refresh();
      }
    }, 120);
  };

  refresh();
  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  globalThis.addEventListener('popstate', scheduleRefresh);
}

function reportDetectedContext(context: LeetCodeProblemContext): void {
  if (typeof chrome === 'undefined' || typeof chrome.runtime?.sendMessage !== 'function') return;

  void chrome.runtime
    .sendMessage({ version: 1, type: 'problem.context.detected', context })
    .catch(() => undefined);
}
