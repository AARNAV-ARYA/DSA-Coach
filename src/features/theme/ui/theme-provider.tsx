import { useEffect } from 'react';
import { resolveTheme, useThemeStore } from '@/features/theme/model/theme-store';

export function ThemeProvider({ children }: React.PropsWithChildren): React.ReactNode {
  const hydrate = useThemeStore((state) => state.hydrate);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const root = globalThis.document.documentElement;
    root.dataset.theme = resolveTheme(theme);
  }, [theme]);

  return children;
}
