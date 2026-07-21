import { ThemeProvider } from '@/features/theme/ui/theme-provider';
import { AppErrorBoundary } from '@/app/app-error-boundary';

export function AppRoot({ children }: React.PropsWithChildren): React.ReactNode {
  return (
    <AppErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </AppErrorBoundary>
  );
}
