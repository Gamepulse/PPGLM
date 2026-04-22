
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';
import { I18nProvider } from '../../../i18n/I18nContext';

describe('Sidebar Accessibility', () => {
  it('has title and aria-label on navigation items', () => {
    render(
      <I18nProvider>
        <Sidebar currentView="library" onNavigate={() => {}} />
      </I18nProvider>
    );

    const buttons = screen.getAllByRole('button');

    // Check navigation buttons (first 5)
    const navButtons = buttons.filter(b => b.textContent !== '◀' && b.textContent !== '▶');

    navButtons.forEach(button => {
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('title')).toBe(button.getAttribute('aria-label'));
    });
  });
});
