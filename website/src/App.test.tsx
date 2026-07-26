import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('web application shell', () => {
  it('opens and closes the add-question workflow', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    expect(screen.getByRole('dialog', { name: 'Add a question' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Close add question' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the extension dashboard navigation', () => {
    render(<App />);

    expect(screen.getByRole('complementary', { name: 'Dashboard navigation' })).toBeDefined();
    expect(screen.getByRole('button', { name: /Analysis/ })).toBeDefined();
  });

  it('adds a question to the browser-local workspace', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Question title' }), {
      target: { value: 'Two Sum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to reviews' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(window.localStorage.getItem('dsa-coach.revision-problems.v1')).toContain('Two Sum');
  });
});
