import { ThemeProvider } from '@/features/theme/ui/theme-provider';

export function AppRoot({ children }: React.PropsWithChildren): React.ReactNode {
  return <ThemeProvider>{children}</ThemeProvider>;
}
