import { useEffect } from "react";
import { useStatistics } from "../../hooks/useStatistics";
import { useI18n } from "../../i18n";

// Status display labels
const STATUS_LABELS: Record<string, string> = {
  'not_started': 'Not Started',
  'not_start': 'Not Started',
  'playing': 'Playing',
  'completed': 'Completed',
  'dropped': 'Dropped',
  'wishlist': 'Wishlist',
};

interface StatisticsDashboardProps {
  onSelectGame?: (id: number) => void;
  onFilterByGenre?: (genre: string) => void;
}

export function StatisticsDashboard({ onSelectGame, onFilterByGenre }: StatisticsDashboardProps) {
  const { t } = useI18n();
  const { statistics, loading, fetchStatistics } = useStatistics();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="theme-text-muted">{t('loading')}</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="theme-text-muted">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold theme-text-primary">{t('statistics')}</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-bg-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold theme-text-primary">{statistics.total_games}</div>
          <div className="text-sm theme-text-secondary">{t('totalGames')}</div>
        </div>
        <div className="theme-bg-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold theme-text-primary">{statistics.total_play_time.toFixed(1)}</div>
          <div className="text-sm theme-text-secondary">{t('totalPlayTime')} ({t('hours')})</div>
        </div>
        <div className="theme-bg-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold theme-text-primary">{statistics.average_rating.toFixed(1)}</div>
          <div className="text-sm theme-text-secondary">{t('averageRating')}</div>
        </div>
      </div>

      {/* Games by Status */}
      <div className="theme-bg-secondary p-4 rounded-lg">
        <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('gamesByStatus')}</h3>
        <div className="space-y-2">
          {statistics.games_by_status.map((status) => (
            <div key={status.status} className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  status.status === 'completed' ? 'bg-green-600' :
                  status.status === 'playing' ? 'bg-blue-600' :
                  status.status === 'dropped' ? 'bg-red-600' :
                  status.status === 'wishlist' ? 'bg-purple-600' :
                  'bg-gray-600'
                }`} 
              />
              <span className="theme-text-secondary w-24">
                {STATUS_LABELS[status.status] || status.status}
              </span>
              <div className="flex-1 theme-bg-tertiary rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full ${
                    status.status === 'completed' ? 'bg-green-600' :
                    status.status === 'playing' ? 'bg-blue-600' :
                    status.status === 'dropped' ? 'bg-red-600' :
                    status.status === 'wishlist' ? 'bg-purple-600' :
                    'bg-gray-600'
                  }`}
                  style={{ 
                    width: `${(status.count / statistics.total_games) * 100}%` 
                  }}
                />
              </div>
              <span className="theme-text-primary font-medium w-8 text-right">{status.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Games by Genre */}
      {statistics.games_by_genre.length > 0 && (
        <div className="theme-bg-secondary p-4 rounded-lg">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('gamesByGenre')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {statistics.games_by_genre.map((genre) => (
              <button
                key={genre.genre}
                onClick={() => onFilterByGenre?.(genre.genre)}
                className="flex items-center justify-between p-2 theme-bg-tertiary rounded hover:bg-indigo-600/20 transition-colors text-left"
              >
                <span className="theme-text-secondary text-sm">{genre.genre}</span>
                <span className="theme-text-primary font-medium">{genre.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {statistics.recently_added.length > 0 && (
        <div className="theme-bg-secondary p-4 rounded-lg">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('recentlyAdded')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statistics.recently_added.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame?.(game.id)}
                className="space-y-2 text-left hover:opacity-80 transition-opacity"
              >
                {game.cover_url ? (
                  <img 
                    src={game.cover_url} 
                    alt={game.display_name} 
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎮</span>
                  </div>
                )}
                <div className="text-sm theme-text-primary truncate">{game.display_name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
