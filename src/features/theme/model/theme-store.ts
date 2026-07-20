import { create } from 'zustand';
import { extensionStorage } from '@/shared/lib/storage/extension-storage';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const themeStorageKey = 'dsa-coach.theme';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  isHydrated: false,
  hydrate: async () => {
    const persistedTheme = await extensionStorage.get<Theme>(themeStorageKey);
    set({ theme: persistedTheme ?? 'system', isHydrated: true });
  },
  setTheme: async (theme) => {
    await extensionStorage.set(themeStorageKey, theme);
    set({ theme });
  },
}));

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;

  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
