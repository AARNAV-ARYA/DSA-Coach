import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductGallery } from './ProductGallery';

afterEach(cleanup);

describe('ProductGallery', () => {
  it('switches product previews with pointer input', () => {
    render(<ProductGallery />);

    fireEvent.click(screen.getByRole('tab', { name: 'Analysis' }));

    expect(screen.getByRole('tab', { name: 'Analysis' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByText('Hash map complement lookup')).toBeDefined();
  });

  it('supports arrow-key navigation between tabs', () => {
    render(<ProductGallery />);

    const dashboardTab = screen.getByRole('tab', { name: 'Dashboard' });
    dashboardTab.focus();
    fireEvent.keyDown(dashboardTab, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: 'Capture' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Capture' })).toBe(document.activeElement);
  });
});
