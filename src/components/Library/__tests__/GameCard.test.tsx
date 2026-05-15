import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameCard from '../GameCard';
import { I18nProvider } from '../../../i18n';
import type { Game } from '../../../types';

const mockGame: Game = {
  id: 1,
  folder_name: 'Witcher 3',
  folder_path: '/games/Witcher 3',
  display_name: 'The Witcher 3',
  igdb_id: 123,
  igdb_slug: 'witcher-3',
  personal_rating: 95,
  igdb_rating: 92,
  notes: 'Masterpiece',
  cover_url: 'https://example.com/cover.jpg',
  synopsis: 'Great game',
  release_date: '2015-05-19',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  tags: [{ id: 1, name: 'RPG', category: 'genre' }],
  genres: [],
  game_modes: [],
  player_perspectives: [],
  themes: [],
  completion_status: 'completed'
};

describe('GameCard Keyboard Accessibility', () => {
  it('triggers onClick when Enter is pressed on the card', () => {
    const onClick = vi.fn();
    render(
      <I18nProvider>
        <GameCard game={mockGame} onClick={onClick} viewMode="grid" />
      </I18nProvider>
    );

    const card = screen.getByRole('button', { name: /The Witcher 3/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(mockGame.id);
  });

  it('triggers onFilter when Enter is pressed on a tag', () => {
    const onFilter = vi.fn();
    render(
      <I18nProvider>
        <GameCard game={mockGame} onClick={() => {}} viewMode="grid" onFilter={onFilter} />
      </I18nProvider>
    );

    const tag = screen.getByRole('button', { name: /RPG/i });
    fireEvent.keyDown(tag, { key: 'Enter' });
    expect(onFilter).toHaveBeenCalledWith('tag', 'RPG');
  });

  it('triggers onFilter when Enter is pressed on status badge', () => {
    const onFilter = vi.fn();
    render(
      <I18nProvider>
        <GameCard game={mockGame} onClick={() => {}} viewMode="grid" onFilter={onFilter} />
      </I18nProvider>
    );

    const statusBadge = screen.getByLabelText(/Status: Completed/i);
    fireEvent.keyDown(statusBadge, { key: 'Enter' });
    expect(onFilter).toHaveBeenCalledWith('status', 'completed');
  });
});
