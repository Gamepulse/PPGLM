import { useEffect } from "react";
import { useStatistics } from "../../hooks/useStatistics";
import { useI18n } from "../../i18n";

// Simple SVG Pie Chart component
function PieChart({ data, size = 200 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const cx = radius;
  const cy = radius;
  const strokeWidth = size * 0.15;
  const innerRadius = radius - strokeWidth / 2;

  let currentAngle = -90; // Start from top
  const paths = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + innerRadius * Math.cos(startRad);
    const y1 = cy + innerRadius * Math.sin(startRad);
    const x2 = cx + innerRadius * Math.cos(endRad);
    const y2 = cy + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, d, percentage };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-0">
        {paths.map((path, i) => (
          <path
            key={i}
            d={path.d}
            fill={path.color}
            stroke="transparent"
            strokeWidth={strokeWidth}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{path.label}: {path.value} ({path.percentage.toFixed(1)}%)</title>
          </path>
        ))}
        {/* Inner circle for donut effect */}
        <circle cx={cx} cy={cy} r={innerRadius - strokeWidth / 2 - 2} fill="transparent" />
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-xs theme-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
          <div className="flex gap-4">
            <div>
              <div className="text-3xl font-bold theme-text-primary">{statistics.average_rating.toFixed(1)}</div>
              <div className="text-sm theme-text-secondary">{t('averageRating')}</div>
            </div>
            <div className="border-l theme-border pl-4">
              <div className="text-3xl font-bold text-yellow-400">{(statistics.average_igdb_rating || 0).toFixed(1)}</div>
              <div className="text-sm theme-text-secondary">{t('averageCommunityRating')}</div>
            </div>
          </div>
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
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Genre list */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
                {statistics.games_by_genre.map((genre) => (
                  <button
                    key={genre.genre}
                    onClick={() => onFilterByGenre?.(genre.genre)}
                    className="flex items-center justify-between p-2 theme-bg-tertiary rounded hover:bg-indigo-600/20 transition-colors text-left whitespace-nowrap overflow-hidden"
                  >
                    <span className="theme-text-secondary text-sm truncate">{genre.genre}</span>
                    <span className="theme-text-primary font-medium ml-2 flex-shrink-0">{genre.count}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Pie Chart */}
            <div className="flex-shrink-0 flex justify-center">
              <PieChart 
                data={statistics.games_by_genre.map((genre, i) => ({
                  label: genre.genre,
                  value: genre.count,
                  color: `hsl(${(i * 360) / statistics.games_by_genre.length}, 70%, 50%)`,
                }))}
                size={160}
              />
            </div>
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
