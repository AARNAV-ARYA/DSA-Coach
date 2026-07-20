import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { AppRoot } from '@/app/app-root';

export function mount(element: React.ReactNode): void {
  const container = document.getElementById('root');
  if (container === null) throw new Error('Unable to find the application root.');

  createRoot(container).render(
    <StrictMode>
      <AppRoot>{element}</AppRoot>
    </StrictMode>,
  );
}
