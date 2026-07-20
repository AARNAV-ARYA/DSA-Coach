import { isExtensionMessage } from '@/shared/lib/messaging/contracts';

async function configureActionBehavior(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

chrome.runtime.onInstalled.addListener(() => {
  void configureActionBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  void configureActionBehavior();
});

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isExtensionMessage(message)) return;

  // Message routing is intentionally foundational only. Product commands are added with their own contract.
});
