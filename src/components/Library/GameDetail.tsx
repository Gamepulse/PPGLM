import { useState, useEffect } from "react";
import type { Game } from "../../types";
import { useGames } from "../../hooks/useGames";
import { GameDetailHeader } from "./GameDetailHeader";
import { GameDetailBackground } from "./GameDetailBackground";
import { GameScreenshotsCarousel } from "./GameScreenshotsCarousel";
// import { GameSoundtrackSection } from "./GameSoundtrackSection"; // Music module - disabled for future build
import { formatDate } from "../../utils/formatters";
import { useI18n } from "../../i18n";
import { open } from "@tauri-apps/plugin-dialog";

interface GameDetailProps {
  gameId: number;
  onBack: () => void;
  onFilter?: (type: string, value: string) => void;
}

export function GameDetail({ gameId, onBack, onFilter }: GameDetailProps) {
  const { t } = useI18n();
  const { 
    getGame, 
    updateRating, 
    updateNotes, 
    deleteGame, 
    updatePlayTime,
    updateCompletionStatus,
    updateFavorite,
    launchGame,
    updateExecutablePath,
    updatePlatform,
  } = useGames();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => { loadGame(); }, [gameId]);

  async function loadGame() {
    setLoading(true);
    const g = await getGame(gameId);
    if (g) { setGame(g); setNotesValue(g.notes || ""); }
    setLoading(false);
  }

  const handleGameUpdated = (updatedGame: Game) => {
    setGame(updatedGame);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="theme-text-muted text-lg">{t('loading')}</div></div>;
  if (!game) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="theme-text-muted text-lg mb-4">{t('gameNotFound')}</div>
      <button type="button" onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('backToLibrary')}</button>
    </div>
  );

  const handleRatingChange = async (rating: number | null) => {
    await updateRating(game.id, rating);
    setGame({ ...game, personal_rating: rating });
  };

  const handleSaveNotes = async () => {
    await updateNotes(game.id, notesValue);
    setGame({ ...game, notes: notesValue });
  };

  const handleDelete = async () => {
    if (window.confirm(t('confirmDelete'))) {
      if (await deleteGame(game.id)) onBack();
    }
  };

  const handlePlayTimeChange = async (hours: number) => {
    if (await updatePlayTime(game.id, hours)) {
      setGame({ ...game, play_time: hours });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (await updateCompletionStatus(game.id, status)) {
      setGame({ ...game, completion_status: status });
    }
  };

  const handleFavoriteToggle = async () => {
    const newValue = !game.is_favorite;
    if (await updateFavorite(game.id, newValue)) {
      setGame({ ...game, is_favorite: newValue });
    }
  };

  const handleLaunch = async () => {
    await launchGame(game.id);
  };

  const handleBrowseExecutable = async () => {
    const selected = await open({
      directory: false,
      multiple: false,
      filters: [
        { name: "Executables", extensions: ["exe", "sh", "app", "bat", "cmd"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (selected && typeof selected === "string") {
      await updateExecutablePath(game.id, selected);
      setGame({ ...game, executable_path: selected });
    }
  };

  const handleClearExecutable = async () => {
    await updateExecutablePath(game.id, null);
    setGame({ ...game, executable_path: null });
  };

  const handlePlatformChange = async (platform: string) => {
    const value = platform || null;
    if (await updatePlatform(game!.id, value)) {
      setGame({ ...game!, platform: value });
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto p-6 min-h-screen">
      {/* Background Screenshots */}
      <GameDetailBackground gameId={gameId} />
      
      <button type="button" onClick={onBack} className="relative z-10 text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-2">
        ← {t('backToLibrary')}
      </button>

      <div className="relative z-10">
        <GameDetailHeader 
          game={game} 
          onGameUpdated={handleGameUpdated} 
          onPlatformChange={handlePlatformChange}
          onFilter={onFilter}
          onFavoriteToggle={handleFavoriteToggle}
          onRatingChange={handleRatingChange}
          onTagsChanged={loadGame}
        />
        {/* Tags and Info now displayed in Header - removed redundant sections */}
      </div>

      {/* Synopsis - Full Width above carousel */}
      {game.synopsis && (
        <div className="mt-6 relative z-10">
          <label className="block text-base font-semibold theme-text-primary mb-2">{t('synopsis')}</label>
          <p className="theme-text-secondary text-sm leading-relaxed theme-bg-tertiary/70 p-4 rounded-lg border theme-border">
            {game.synopsis}
          </p>
        </div>
      )}

      {/* <GameSoundtrackSection game={game} /> // Music module - disabled for future build */}

      {/* Screenshots Carousel */}
      <div className="mt-6 max-w-2xl mx-auto">
        <GameScreenshotsCarousel gameId={gameId} />
      </div>

      <div className="pt-4 theme-border border-t mt-6 space-y-4">
        {/* Launch Path / Executable */}
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('executablePath')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={game.executable_path || ''}
              readOnly
              placeholder={t('browse')}
              className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              type="button"
              onClick={handleBrowseExecutable}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              {t('browse')}
            </button>
            {game.executable_path && (
              <button
                type="button"
                onClick={handleClearExecutable}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                title="Clear executable path"
                aria-label="Clear executable path"
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
          {game.executable_path && (
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full mt-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              ▶ {t('launchGame')}
            </button>
          )}
        </div>

        {/* Completion Status */}
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('completionStatus')}</label>
          <select
            value={game.completion_status || 'playing'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
          >
            <option value="playing">{t('playing')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="dropped">{t('dropped')}</option>
            <option value="wishlist">{t('wishlist')}</option>
          </select>
        </div>

        {/* Play Time */}
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('playTime')} ({t('hours')})</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={game.play_time || 0}
            onChange={(e) => handlePlayTimeChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('notes')}</label>
          <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)}
            onBlur={handleSaveNotes} rows={4}
            className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={t('addNotes')} />
        </div>
        <div className="text-xs theme-text-muted pt-4">
          {t('added')}: {formatDate(game.created_at)} · {t('updated')}: {formatDate(game.updated_at)}
        </div>
        <div className="pt-4">
          <button type="button" onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            {t('deleteGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
