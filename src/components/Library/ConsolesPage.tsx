import { useState, useEffect, useCallback } from "react";
import { useGames } from "../../hooks/useGames";
import { useI18n } from "../../i18n";
import { useSettings } from "../../hooks/useSettings";
import GameCard from "./GameCard";

interface ConsolesPageProps {
  onSelectGame: (id: number) => void;
}

const PLATFORM_ORDER = [
  'pc', 
  'ps5', 'ps4', 'ps3', 'ps2', 'ps1', 'playstation',
  'xbox_series', 'xbox_one', 'xbox_360', 'xbox',
  'nintendo_switch', 'nintendo_wiiu', 'nintendo_wii', 'nintendo_3ds', 'nintendo_ds', 'nintendo',
  'mobile', 'other'
];

const PLATFORM_ICONS: Record<string, string> = {
  pc: '💻',
  // PlayStation
  ps5: '🎮',
  ps4: '🎮',
  ps3: '🎮',
  ps2: '🎮',
  ps1: '🎮',
  playstation: '🎮',
  // Xbox
  xbox_series: '🎯',
  xbox_one: '🎯',
  xbox_360: '🎯',
  xbox: '🎯',
  // Nintendo
  nintendo_switch: '🕹️',
  nintendo_wiiu: '🕹️',
  nintendo_wii: '🕹️',
  nintendo_3ds: '🕹️',
  nintendo_ds: '🕹️',
  nintendo: '🕹️',
  // Mobile & Other
  mobile: '📱',
  other: '📟',
};

const PLATFORM_NAMES: Record<string, string> = {
  pc: 'PC',
  // PlayStation
  ps5: 'PlayStation 5',
  ps4: 'PlayStation 4',
  ps3: 'PlayStation 3',
  ps2: 'PlayStation 2',
  ps1: 'PlayStation',
  playstation: 'PlayStation (Générique)',
  // Xbox
  xbox_series: 'Xbox Series X|S',
  xbox_one: 'Xbox One',
  xbox_360: 'Xbox 360',
  xbox: 'Xbox (Générique)',
  // Nintendo
  nintendo_switch: 'Nintendo Switch',
  nintendo_wiiu: 'Nintendo Wii U',
  nintendo_wii: 'Nintendo Wii',
  nintendo_3ds: 'Nintendo 3DS',
  nintendo_ds: 'Nintendo DS',
  nintendo: 'Nintendo (Générique)',
  // Mobile & Other
  mobile: 'Mobile',
  other: 'Other',
};

interface QuickAssignMenuProps {
  gameId: number;
  currentPlatform: string | null;
  onAssign: (gameId: number, platform: string | null) => void;
  onClose: () => void;
  activeConsoles: string[];
}

function QuickAssignMenu({ gameId, currentPlatform, onAssign, onClose, activeConsoles }: QuickAssignMenuProps) {
  const allPlatformGroups = [
    { label: '💻 PC', options: [{ value: 'pc', label: 'PC' }] },
    { label: '🎮 PlayStation', options: [
      { value: 'ps5', label: 'PlayStation 5' },
      { value: 'ps4', label: 'PlayStation 4' },
      { value: 'ps3', label: 'PlayStation 3' },
      { value: 'ps2', label: 'PlayStation 2' },
      { value: 'ps1', label: 'PlayStation' },
    ]},
    { label: '🎯 Xbox', options: [
      { value: 'xbox_series', label: 'Xbox Series X|S' },
      { value: 'xbox_one', label: 'Xbox One' },
      { value: 'xbox_360', label: 'Xbox 360' },
    ]},
    { label: '🕹️ Nintendo', options: [
      { value: 'nintendo_switch', label: 'Nintendo Switch' },
      { value: 'nintendo_wiiu', label: 'Nintendo Wii U' },
      { value: 'nintendo_wii', label: 'Nintendo Wii' },
      { value: 'nintendo_3ds', label: 'Nintendo 3DS' },
      { value: 'nintendo_ds', label: 'Nintendo DS' },
    ]},
    { label: '📱 Mobile', options: [{ value: 'mobile', label: 'Mobile' }] },
    { label: '📟 Other', options: [{ value: 'other', label: 'Other' }] },
  ];

  // Filter groups to only show active consoles
  const platformGroups = allPlatformGroups
    .map(group => ({
      ...group,
      options: group.options.filter(opt => activeConsoles.includes(opt.value))
    }))
    .filter(group => group.options.length > 0);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div 
        className="relative bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[220px] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 text-sm text-gray-400 border-b border-gray-700 sticky top-0 bg-gray-800">
          {currentPlatform 
            ? `${PLATFORM_ICONS[currentPlatform] || '📟'} ${PLATFORM_NAMES[currentPlatform] || currentPlatform}` 
            : '❓ Unassigned'}
        </div>
        
        <button
          onClick={() => onAssign(gameId, null)}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 ${!currentPlatform ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
        >
          ❓ None (Unassigned)
        </button>
        
        {platformGroups.map(group => (
          <div key={group.label}>
            <div className="px-3 py-1 text-xs text-gray-500 mt-2">{group.label}</div>
            {group.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => onAssign(gameId, opt.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 ${currentPlatform === opt.value ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
              >
                {PLATFORM_ICONS[opt.value] || '📟'} {opt.label}
                {currentPlatform === opt.value && <span className="ml-auto text-indigo-400">✓</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsolesPage({ onSelectGame }: ConsolesPageProps) {
  const { t } = useI18n();
  const { games, loading, fetchGames, updatePlatform } = useGames();
  const { activeConsoles } = useSettings();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [expandedConsoles, setExpandedConsoles] = useState<Set<string>>(new Set());
  const [quickAssignGame, setQuickAssignGame] = useState<{id: number, platform: string | null} | null>(null);

  useEffect(() => {
    fetchGames({});
  }, [fetchGames]);

  // Group games by platform
  const gamesByPlatform = games.reduce((acc, game) => {
    const platform = game.platform || 'unassigned';
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(game);
    return acc;
  }, {} as Record<string, typeof games>);

  // Sort platforms by predefined order
  const sortedPlatforms = [...PLATFORM_ORDER, 'unassigned'].filter(p => {
    // Show if there are games AND (it's unassigned OR the platform is in active consoles)
    const hasGames = gamesByPlatform[p]?.length > 0;
    const isActive = p === 'unassigned' || activeConsoles.includes(p);
    return hasGames && isActive;
  });

  const toggleConsole = (platform: string) => {
    setExpandedConsoles(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedConsoles(new Set(sortedPlatforms));
  };

  const collapseAll = () => {
    setExpandedConsoles(new Set());
  };

  const handleQuickAssign = useCallback(async (gameId: number, platform: string | null) => {
    await updatePlatform(gameId, platform);
    setQuickAssignGame(null);
    await fetchGames({});
  }, [updatePlatform, fetchGames]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg theme-text-muted">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="theme-bg-secondary min-h-screen">
      {/* Quick Assign Menu Overlay */}
      {quickAssignGame && (
        <QuickAssignMenu
          gameId={quickAssignGame.id}
          currentPlatform={quickAssignGame.platform}
          onAssign={handleQuickAssign}
          onClose={() => setQuickAssignGame(null)}
          activeConsoles={activeConsoles}
        />
      )}

      {/* Toolbar */}
      <div className="theme-bg-tertiary border-b theme-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 rounded-lg theme-bg-tertiary border theme-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
                title={t('grid') || "Grid view"}
                aria-label={t('grid') || "Grid view"}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
                title={t('list') || "List view"}
                aria-label={t('list') || "List view"}
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-1.5 rounded ${viewMode === "compact" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
                title={t('compact') || "Compact view"}
                aria-label={t('compact') || "Compact view"}
              >
                ▪
              </button>
            </div>
            <span className="text-sm theme-text-muted">
              {games.length} {t('games')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('expandAll') || 'Expand all'}
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('collapseAll') || 'Collapse all'}
            </button>
          </div>
        </div>
      </div>

      {/* Console List */}
      <div className="p-4 space-y-4">
        {sortedPlatforms.map(platform => {
          const platformGames = gamesByPlatform[platform];
          const isExpanded = expandedConsoles.has(platform);
          const isUnassigned = platform === 'unassigned';
          const icon = isUnassigned ? '❓' : (PLATFORM_ICONS[platform] || '📟');
          const name = isUnassigned ? (t('unassignedPlatform') || 'Unassigned') : (PLATFORM_NAMES[platform] || platform);

          return (
            <div key={platform} className="theme-card rounded-lg overflow-hidden">
              {/* Console Header */}
              <button
                onClick={() => toggleConsole(platform)}
                className="w-full flex items-center justify-between p-4 theme-bg-tertiary hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold theme-text-primary">{name}</h3>
                    <span className="text-sm theme-text-muted">
                      {platformGames.length} {t('games')}
                    </span>
                  </div>
                </div>
                <span className={`text-xl theme-text-muted transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Games Grid/List */}
              {isExpanded && (
                <div className="p-4">
                  {viewMode === "grid" && (
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                      {platformGames.map(game => (
                        <div key={game.id} className="relative group">
                          <GameCard 
                            key={game.id} 
                            game={game} 
                            onClick={onSelectGame} 
                            viewMode="grid"
                            showQuickAssign
                            onQuickAssign={() => setQuickAssignGame({ id: game.id, platform: game.platform ?? null })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "list" && (
                    <div className="space-y-3">
                      {platformGames.map(game => (
                        <div key={game.id} className="relative group flex items-center gap-3">
                          <div className="flex-1">
                            <GameCard 
                              game={game} 
                              onClick={onSelectGame} 
                              viewMode="list"
                              showQuickAssign
                              onQuickAssign={() => setQuickAssignGame({ id: game.id, platform: game.platform ?? null })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === "compact" && (
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
                      {platformGames.map(game => (
                        <div key={game.id} className="relative group">
                          <GameCard 
                            key={game.id} 
                            game={game} 
                            onClick={onSelectGame} 
                            viewMode="compact"
                            showQuickAssign
                            onQuickAssign={() => setQuickAssignGame({ id: game.id, platform: game.platform ?? null })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}