import type { Game } from "../../types";
import { open } from "@tauri-apps/plugin-shell";
import { useI18n } from "../../i18n";

interface GameDetailHeaderProps {
  game: Game;
  refreshing: boolean;
  onRefresh: () => void;
}

export function GameDetailHeader({ game, refreshing, onRefresh }: GameDetailHeaderProps) {
  const { t } = useI18n();

  const handleOpenIgdb = async () => {
    const slug = game.igdb_slug || String(game.igdb_id);
    const url = `https://www.igdb.com/games/${slug}`;
    try { await open(url); } catch { window.open(url, "_blank"); }
  };

  return (
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

        <div className="flex items-center gap-2 flex-wrap">
          {game.igdb_id && (
            <>
              <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">{t('igdbMatched')}</span>
              <button type="button" onClick={handleOpenIgdb}
                className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50 transition-colors">
                {t('igdbPage')} ↗
              </button>
              <button type="button" onClick={onRefresh} disabled={refreshing}
                className="px-2 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {refreshing ? t('refreshingFromIgdb') : t('refreshFromIgdb')}
              </button>
            </>
          )}
          {game.is_favorite && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 text-white">★ {t('isFavorite')}</span>
          )}
          {game.completion_status && (
            <span className={`px-2 py-1 text-xs rounded-full text-white ${
              game.completion_status === 'completed' ? 'bg-green-600' :
              game.completion_status === 'playing' ? 'bg-blue-600' :
              game.completion_status === 'dropped' ? 'bg-red-600' :
              game.completion_status === 'wishlist' ? 'bg-purple-600' :
              'bg-gray-600'
            }`}>
              {t(game.completion_status as 'notStarted' | 'playing' | 'completed' | 'dropped' | 'wishlist')}
            </span>
          )}
          {game.play_time && game.play_time > 0 && (
            <span className="px-2 py-1 text-xs rounded-full bg-indigo-600 text-white">
              {game.play_time.toFixed(1)} {t('hours')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
