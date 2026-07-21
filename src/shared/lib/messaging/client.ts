import {
  isProblemContext,
  MESSAGE_VERSION,
  type ActiveProblemContextResponse,
  type ExtensionMessage,
  type ProblemContext,
} from '@/shared/lib/messaging/contracts';

const isExtensionRuntimeAvailable = (): boolean =>
  typeof chrome !== 'undefined' && typeof chrome.runtime?.sendMessage === 'function';

export async function sendExtensionMessage(
  message: Omit<ExtensionMessage, 'version'>,
): Promise<void> {
  if (!isExtensionRuntimeAvailable()) return;

  await chrome.runtime.sendMessage({ ...message, version: MESSAGE_VERSION });
}

export async function getActiveProblemContext(): Promise<ProblemContext | null> {
  if (!isExtensionRuntimeAvailable()) return null;

  const response: ActiveProblemContextResponse = await chrome.runtime.sendMessage({
    version: MESSAGE_VERSION,
    type: 'capture.active-context.request',
  });

  return isProblemContext(response?.context) ? response.context : null;
}
