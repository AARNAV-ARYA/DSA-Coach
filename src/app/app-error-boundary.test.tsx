/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from '@/app/app-error-boundary';

function BrokenView(): React.ReactNode {
  throw new Error('Expected test failure');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppErrorBoundary', () => {
  it('replaces a crashed surface with an accessible recovery action', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppErrorBoundary>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert').textContent).toContain('Something did not load correctly.');
    expect(screen.getByRole('button', { name: 'Reload DSA Coach' })).toBeTruthy();
  });
});
