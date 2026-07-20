import type { KeyValueStorage } from '@/shared/lib/storage/key-value-storage';

const hasChromeStorage = (): boolean =>
  typeof chrome !== 'undefined' && typeof chrome.storage?.local !== 'undefined';

class ExtensionStorage implements KeyValueStorage {
  async get<T>(key: string): Promise<T | null> {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(key);
      return (result[key] as T | undefined) ?? null;
    }

    const serialized = globalThis.localStorage.getItem(key);
    return serialized === null ? null : (JSON.parse(serialized) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }

    globalThis.localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (hasChromeStorage()) {
      await chrome.storage.local.remove(key);
      return;
    }

    globalThis.localStorage.removeItem(key);
  }
}

export const extensionStorage: KeyValueStorage = new ExtensionStorage();
