
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import GameCard from '../GameCard';
import { I18nProvider } from '../../../i18n/I18nContext';
import type { Game } from '../../../types';

// Mock common modules
vi.mock('../../utils/formatters', () => ({
  formatDate: vi.fn((date) => date),
}));

vi.mock('../../utils/colors', () => ({
  getCategoryColor: vi.fn(() => 'bg-blue-500'),
}));

const mockGame: Game = {
  id: 1,
  display_name: 'Test Game',
  folder_name: 'test-game',
  folder_path: '/path/to/test-game',
  igdb_id: 123,
  igdb_slug: 'test-game',
  personal_rating: 85,
  igdb_rating: 90,
  notes: 'Some notes',
  cover_url: 'https://example.com/cover.jpg',
  synopsis: 'A test game synopsis',
  release_date: '2023-01-01',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  tags: [{ id: 1, name: 'Tag1', category: 'custom' }],
  genres: [{ id: 1, name: 'Action' }],
  game_modes: [],
  player_perspectives: [],
  themes: [],
  completion_status: 'playing',
  play_time: 10,
  is_favorite: true,
};

describe('GameCard Accessibility', () => {
  it('has interactive elements with proper accessibility attributes', () => {
    render(
      <I18nProvider>
        <GameCard game={mockGame} onClick={() => {}} viewMode="grid" onFilter={() => {}} />
      </I18nProvider>
    );

    // Check tags
    const tag = screen.getByRole('button', { name: /Tag1/ });
    expect(tag).toHaveAttribute('tabIndex', '0');
    expect(tag).toHaveAttribute('aria-label', expect.stringContaining('Tag1'));

    // Check metadata tags (genres)
    const genre = screen.getByRole('button', { name: /Action/ });
    expect(genre).toHaveAttribute('tabIndex', '0');
    expect(genre).toHaveAttribute('aria-label', expect.stringContaining('Action'));

    // Check status badge
    const status = screen.getByRole('button', { name: /Playing/i });
    expect(status).toHaveAttribute('tabIndex', '0');
    expect(status).toHaveAttribute('aria-label', expect.stringContaining('status'));
  });
});
