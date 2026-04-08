import type { Game } from "../../types";
import { formatDate } from "../../utils/formatters";
import { useI18n } from "../../i18n";

interface GameDetailInfoProps {
  game: Game;
}

export function GameDetailInfo({ game }: GameDetailInfoProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-3 mt-4">
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

      {game.synopsis && (
        <div className="mt-4">
          <label className="block text-sm font-medium theme-text-secondary mb-2">{t('synopsis')}</label>
          <p className="theme-text-secondary text-sm leading-relaxed theme-bg-tertiary/50 p-4 rounded-lg">
            {game.synopsis}
          </p>
        </div>
      )}
    </div>
  );
}
