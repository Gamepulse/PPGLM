import type { Game } from "../../types";
import { useI18n } from "../../i18n";

interface GameDetailHeaderProps {
  game: Game;
  refreshing: boolean;
  onRefresh: () => void;
}

export function GameDetailHeader({ game, refreshing, onRefresh }: GameDetailHeaderProps) {
  const { t } = useI18n();

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

        {game.igdb_id && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">{t('igdbMatched')}</span>
            <span className="theme-text-muted text-xs">ID: {game.igdb_id}</span>
            <button type="button" onClick={onRefresh} disabled={refreshing}
              className="px-2 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {refreshing ? t('refreshingFromIgdb') : t('refreshFromIgdb')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
