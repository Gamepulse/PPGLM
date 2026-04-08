import { useState, useEffect } from "react";
import type { Game } from "../../types";
import { useGames } from "../../hooks/useGames";
import { RatingInput } from "../common/RatingInput";
import { TagEditor } from "./TagEditor";
import { formatDate } from "../../utils/formatters";
import { useI18n } from "../../i18n";

interface GameDetailProps {
  gameId: number;
  onBack: () => void;
}

export function GameDetail({ gameId, onBack }: GameDetailProps) {
  const { t } = useI18n();
  const { getGame, updateRating, updateNotes, deleteGame, refreshGameFromIgdb } = useGames();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesValue, setNotesValue] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  async function loadGame() {
    setLoading(true);
    const g = await getGame(gameId);
    if (g) {
      setGame(g);
      setNotesValue(g.notes || "");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="theme-text-muted text-lg">{t('loading')}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="theme-text-muted text-lg mb-4">{t('gameNotFound')}</div>
        <button type="button" onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          {t('backToLibrary')}
        </button>
      </div>
    );
  }

  const handleRatingChange = async (rating: number | null) => {
    await updateRating(game.id, rating);
    setGame({ ...game, personal_rating: rating });
  };

  const handleSaveNotes = async () => {
    await updateNotes(game.id, notesValue);
    setGame({ ...game, notes: notesValue });
  };

  const handleDelete = async () => {
    const ok = await deleteGame(game.id);
    if (ok) onBack();
  };

  const handleRefreshFromIgdb = async () => {
    if (!game?.igdb_id) return;
    setRefreshing(true);
    try {
      const success = await refreshGameFromIgdb(game.id);
      if (success) {
        // Reload game data
        await loadGame();
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button type="button" onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-2">
        ← {t('backToLibrary')}
      </button>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          {game.cover_url ? (
            <img src={game.cover_url} alt={game.display_name} className="w-full rounded-lg" />
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-5xl">🎮</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold theme-text-primary">{game.display_name}</h1>
          <p className="theme-text-muted text-sm font-mono">{game.folder_path}</p>

          {game.igdb_id && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">
                {t('igdbMatched')}
              </span>
              <span className="theme-text-muted text-xs">ID: {game.igdb_id}</span>
              <button
                type="button"
                onClick={handleRefreshFromIgdb}
                disabled={refreshing}
                className="px-2 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {refreshing ? t('refreshingFromIgdb') : t('refreshFromIgdb')}
              </button>
            </div>
          )}

          {game.release_date && (
            <div className="flex items-center gap-2">
              <span className="theme-text-muted text-sm">{t('releaseDate')}:</span>
              <span className="theme-text-primary text-sm">{formatDate(game.release_date)}</span>
            </div>
          )}

          {game.igdb_rating && (
            <div className="flex items-center gap-2">
              <span className="theme-text-muted text-sm">{t('communityRating')}:</span>
              <span className="text-yellow-400 text-sm font-semibold">{game.igdb_rating.toFixed(1)}/100</span>
            </div>
          )}

          {game.genres && game.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="theme-text-muted text-sm">{t('genres')}:</span>
              {game.genres.map((genre) => (
                <span key={genre.id} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white">
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {game.game_modes && game.game_modes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="theme-text-muted text-sm">{t('gameModes')}:</span>
              {game.game_modes.map((mode) => (
                <span key={mode.id} className="px-2 py-1 text-xs rounded-full bg-purple-600 text-white">
                  {mode.name}
                </span>
              ))}
            </div>
          )}

          {game.player_perspectives && game.player_perspectives.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="theme-text-muted text-sm">{t('perspective')}:</span>
              {game.player_perspectives.map((pp) => (
                <span key={pp.id} className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">
                  {pp.name}
                </span>
              ))}
            </div>
          )}

          {game.themes && game.themes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="theme-text-muted text-sm">{t('themes')}:</span>
              {game.themes.map((theme) => (
                <span key={theme.id} className="px-2 py-1 text-xs rounded-full bg-orange-600 text-white">
                  {theme.name}
                </span>
              ))}
            </div>
          )}

          {game.synopsis && (
            <div className="mt-4">
              <label className="block text-sm font-medium theme-text-secondary mb-2">{t('synopsis')}</label>
              <p className="theme-text-secondary text-sm leading-relaxed theme-bg-tertiary/50 p-4 rounded-lg">
                {game.synopsis}
              </p>
            </div>
          )}

          <div className="pt-4 theme-border border-t">
            <label className="block text-sm font-medium theme-text-secondary mb-1">{t('personalRating')}</label>
            <RatingInput value={game.personal_rating} onChange={handleRatingChange} />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-secondary mb-1">{t('notes')}</label>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleSaveNotes}
              rows={4}
              className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('addNotes')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-secondary mb-1">{t('tags')}</label>
            <TagEditor gameId={game.id} tags={game.tags} onTagsChanged={loadGame} />
          </div>

          <div className="text-xs theme-text-muted pt-4">
            {t('added')}: {formatDate(game.created_at)} · {t('updated')}: {formatDate(game.updated_at)}
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('deleteGame')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
