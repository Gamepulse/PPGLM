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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(true);
    if (await deleteGame(game.id)) {
      onBack();
    } else {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
              >
                ✕
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
          <button type="button" onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            {t('deleteGame')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-red-600/60 max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <span className="text-lg" aria-hidden="true">🗑</span>
                </div>
                <h2 className="text-lg font-bold text-white">{t('deleteGame')}</h2>
              </div>
              <p className="theme-text-secondary text-sm">
                {t('confirmDelete')}
              </p>
              <p className="mt-2 text-indigo-400 font-semibold">{game.display_name}</p>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loading')}
                  </span>
                ) : (
                  t('deleteGame')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
