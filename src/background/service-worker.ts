import {
  isExtensionMessage,
  type ActiveProblemContextResponse,
  type ProblemContext,
} from '@/shared/lib/messaging/contracts';

const activeContextsStorageKey = 'dsa-coach.active-problem-contexts';

type ContextByTab = Record<string, ProblemContext>;

async function configureActionBehavior(): Promise<void> {
  // This was enabled by the previous build. Explicitly clear it so the manifest's
  // default popup remains the toolbar action while browser integration is configured.
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
}

chrome.runtime.onInstalled.addListener(() => {
  void configureActionBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  void configureActionBehavior();
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;

  if (message.type === 'shell.open-dashboard') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    return;
  }

  if (message.type === 'shell.open-side-panel') {
    if (sender.tab?.id !== undefined) void chrome.sidePanel.open({ tabId: sender.tab.id });
    return;
  }

  if (message.type === 'problem.context.detected') {
    if (sender.tab?.id !== undefined) void persistContext(sender.tab.id, message.context);
    return;
  }

  if (message.type === 'capture.active-context.request') {
    void getActiveContext().then((context) =>
      sendResponse({ context } satisfies ActiveProblemContextResponse),
    );
    return true;
  }
});

async function persistContext(tabId: number, context: ProblemContext): Promise<void> {
  const stored = await chrome.storage.session.get(activeContextsStorageKey);
  const contexts = (stored[activeContextsStorageKey] as ContextByTab | undefined) ?? {};
  await chrome.storage.session.set({
    [activeContextsStorageKey]: { ...contexts, [String(tabId)]: context },
  });
}

async function getActiveContext(): Promise<ProblemContext | null> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id === undefined) return null;

  const stored = await chrome.storage.session.get(activeContextsStorageKey);
  const contexts = stored[activeContextsStorageKey] as ContextByTab | undefined;
  return contexts?.[String(activeTab.id)] ?? null;
}
