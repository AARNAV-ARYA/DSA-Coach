import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InteractiveDemo } from './InteractiveDemo';

afterEach(cleanup);

describe('InteractiveDemo', () => {
  it('moves through the capture and review states', () => {
    render(<InteractiveDemo />);

    fireEvent.click(screen.getByRole('button', { name: 'Add problem' }));
    expect(screen.getByText('Added to your library')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Prepare review' }));
    expect(screen.getByText('Review prepared')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Run demo again' }));
    expect(screen.getByText('Problem detected')).toBeDefined();
  });

  it('exposes the selected learning outcome', () => {
    render(<InteractiveDemo />);

    const hintOutcome = screen.getByRole('button', { name: 'Needed hint' });
    fireEvent.click(hintOutcome);

    expect(hintOutcome.getAttribute('aria-pressed')).toBe('true');
  });
});
