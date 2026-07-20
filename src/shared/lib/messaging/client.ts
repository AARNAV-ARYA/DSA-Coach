import { MESSAGE_VERSION, type ExtensionMessage } from '@/shared/lib/messaging/contracts';

const isExtensionRuntimeAvailable = (): boolean =>
  typeof chrome !== 'undefined' && typeof chrome.runtime?.sendMessage === 'function';

export async function sendExtensionMessage(
  message: Omit<ExtensionMessage, 'version'>,
): Promise<void> {
  if (!isExtensionRuntimeAvailable()) return;

  await chrome.runtime.sendMessage({ ...message, version: MESSAGE_VERSION });
}
