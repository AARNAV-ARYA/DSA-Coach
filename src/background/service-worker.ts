import { isExtensionMessage } from '@/shared/lib/messaging/contracts';

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

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isExtensionMessage(message)) return;

  // Problem metadata is validated by the shared message contract. Persisting or syncing it
  // belongs to a later Phase 2 capability; this integration intentionally only detects context.
});
