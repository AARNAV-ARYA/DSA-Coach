import { ThemeToggle } from '@/features/theme/ui/theme-toggle';
import { Brand } from '@/shared/ui/brand';

type Surface = 'dashboard' | 'popup' | 'sidepanel';

const surfaceCopy: Record<Surface, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: 'Your preparation space',
    title: 'A calmer way to remember.',
    description:
      'The product foundation is ready. Learning experiences will arrive in deliberate layers.',
  },
  popup: {
    eyebrow: 'DSA Coach',
    title: 'Your memory system.',
    description: 'Open the panel to begin when the learning loop is available.',
  },
  sidepanel: {
    eyebrow: 'DSA Coach',
    title: 'Stay with the problem.',
    description: 'This space will hold quiet, in-context support without interrupting your flow.',
  },
};

export function AppShell({ surface }: { surface: Surface }): React.ReactNode {
  const copy = surfaceCopy[surface];
  const isPopup = surface === 'popup';

  return (
    <main className={isPopup ? 'min-w-[360px] p-4' : 'mx-auto max-w-5xl p-6 sm:p-10'}>
      <header className="flex items-center justify-between">
        <Brand compact={isPopup} />
        <ThemeToggle />
      </header>
      <section className={isPopup ? 'pt-12' : 'max-w-2xl pt-24'}>
        <p className="text-sm font-medium text-accent">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          {copy.description}
        </p>
      </section>
      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        Foundation build · v0.1.0
      </footer>
    </main>
  );
}
