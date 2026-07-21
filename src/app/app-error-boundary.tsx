import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/ui/button';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error('DSA Coach render failure', error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error" role="alert">
        <div>
          <p className="dashboard-kicker">DSA Coach recovered safely</p>
          <h1>Something did not load correctly.</h1>
          <p>Your saved questions remain on this device. Reload the extension surface to retry.</p>
          <Button onClick={() => globalThis.location.reload()}>Reload DSA Coach</Button>
        </div>
      </main>
    );
  }
}
