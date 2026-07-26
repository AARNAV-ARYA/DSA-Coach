import { useEffect, useState } from 'react';
import { AppRoot } from '@/app/app-root';
import { RevisionSystem } from '@/features/revision/ui/revision-system';
import { ThemeToggle } from '@/features/theme/ui/theme-toggle';
import { WebCaptureDialog } from './components/WebCaptureDialog';

export function App(): React.ReactNode {
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsCaptureOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <AppRoot>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="web-app">
        <header className="web-runtime-bar">
          <div>
            <span className="web-runtime-dot" aria-hidden="true" />
            <strong>Web workspace</strong>
            <span>Saved only in this browser</span>
          </div>
          <div className="web-runtime-actions">
            <span className="web-extension-note">
              Use the extension for automatic LeetCode detection
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main
          className="dashboard-shell mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"
          id="main-content"
          tabIndex={-1}
        >
          <RevisionSystem />
        </main>

        <button
          aria-haspopup="dialog"
          className="web-add-question"
          onClick={() => setIsCaptureOpen(true)}
          type="button"
        >
          <span aria-hidden="true">＋</span>
          Add question
        </button>

        {isCaptureOpen && <WebCaptureDialog onClose={() => setIsCaptureOpen(false)} />}
      </div>
    </AppRoot>
  );
}
