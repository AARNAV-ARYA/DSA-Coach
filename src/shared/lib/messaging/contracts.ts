export const MESSAGE_VERSION = 1 as const;

export type ExtensionMessage =
  | {
      version: typeof MESSAGE_VERSION;
      type: 'shell.open-side-panel';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'shell.open-dashboard';
    };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<ExtensionMessage>;
  return (
    candidate.version === MESSAGE_VERSION &&
    (candidate.type === 'shell.open-side-panel' || candidate.type === 'shell.open-dashboard')
  );
}
