import React, { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import GameCard from "./GameCard";
import { QuickAddModal } from "./QuickAddModal";
import { useGames } from "../../hooks/useGames";
import { useI18n } from "../../i18n";
import { DEFAULT_SORT, DEFAULT_ORDER } from "../../utils/constants";
import type { Game, GameFilters } from "../../types";

export interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface GameListProps {
  onSelectGame: (id: number) => void;
  searchQuery?: string;
  activeFilters?: ActiveFilter[];
  onFiltersChange?: (filters: ActiveFilter[]) => void;
}

export function GameList({ onSelectGame, searchQuery, activeFilters: externalFilters, onFiltersChange }: GameListProps) {
  const { games, loading, fetchGames } = useGames();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [sortOrder, setSortOrder] = useState(DEFAULT_ORDER);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [csvExportStatus, setCsvExportStatus] = useState<string | null>(null);
  const [internalFilters, setInternalFilters] = useState<ActiveFilter[]>([]);
  
  // Use external filters if provided, otherwise use internal state
  const activeFilters = externalFilters ?? internalFilters;
  
  // Ref to access current filters without triggering re-renders
  const activeFiltersRef = React.useRef(activeFilters);
  activeFiltersRef.current = activeFilters;
  
  // Helper to update filters (works with both external and internal control)
  const updateFilters = useCallback((newFilters: ActiveFilter[]) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  }, [onFiltersChange]);
  
  // Parse searchQuery for filter prefixes and add to activeFilters
  useEffect(() => {
    if (!searchQuery) return;
    
    const filterPrefixes = ['tag:', 'genre:', 'mode:', 'perspective:', 'theme:', 'status:', 'platform:'];
    const prefix = filterPrefixes.find(p => searchQuery.startsWith(p));
    
    if (prefix) {
      const type = prefix.slice(0, -1); // Remove colon
      const value = searchQuery.slice(prefix.length);
      
      const currentFilters = activeFiltersRef.current;
      const exists = currentFilters.some(f => f.type === type && f.value === value);
      if (!exists) {
        updateFilters([...currentFilters, { type, value, label: value }]);
      }
    }
  }, [searchQuery, updateFilters]);

  // Client-side filtering for multiple filters of same type
  const filterGamesClientSide = useCallback((games: Game[]) => {
    return games.filter(game => {
      // Check if game matches ALL active filters (AND logic)
      return activeFilters.every(filter => {
        switch (filter.type) {
          case 'tag':
            return game.tags.some(t => t.name === filter.value);
          case 'genre':
            return game.genres?.some(g => g.name === filter.value);
          case 'mode':
            return game.game_modes?.some(m => m.name === filter.value);
          case 'perspective':
            return game.player_perspectives?.some(p => p.name === filter.value);
          case 'theme':
            return game.themes?.some(t => t.name === filter.value);
          case 'status':
            return game.completion_status === filter.value;
          case 'platform':
            return game.platform === filter.value;
          case 'igdb_match':
            if (filter.value === 'igdb') {
              return game.igdb_id !== null && game.igdb_id !== undefined;
            } else if (filter.value === 'manual') {
              return game.igdb_id === null || game.igdb_id === undefined;
            }
            return true;
          default:
            return true;
        }
      });
    });
  }, [activeFilters]);

  // Fetch games when filters change
  useEffect(() => {
    const filters: GameFilters = {
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    // Add search query if present (and not a filter prefix query)
    if (searchQuery?.trim() && !searchQuery.match(/^(tag|genre|mode|perspective|theme|status|platform):/)) {
      filters.search_query = searchQuery.trim();
    }

    // Add only the first filter of each type for backend query
    const filterTypesAdded = new Set<string>();
    activeFilters.forEach(filter => {
      if (filterTypesAdded.has(filter.type)) return;
      
      switch (filter.type) {
        case 'tag':
          filters.tag = filter.value;
          filterTypesAdded.add('tag');
          break;
        case 'genre':
          filters.genre = filter.value;
          filterTypesAdded.add('genre');
          break;
        case 'mode':
          filters.mode = filter.value;
          filterTypesAdded.add('mode');
          break;
        case 'perspective':
          filters.perspective = filter.value;
          filterTypesAdded.add('perspective');
          break;
        case 'theme':
          filters.theme = filter.value;
          filterTypesAdded.add('theme');
          break;
        case 'status':
          filters.completion_status = filter.value;
          filterTypesAdded.add('status');
          break;
      }
    });

    fetchGames(filters);
  }, [fetchGames, activeFilters, sortBy, sortOrder, searchQuery]);
  
  // Apply client-side filtering
  const filteredGames = filterGamesClientSide(games);

  // Add a filter
  const addFilter = useCallback((type: string, value: string, label: string) => {
    console.log('[GameList] addFilter called:', { type, value, label });
    // Check if filter already exists
    const exists = activeFilters.some(f => f.type === type && f.value === value);
    if (exists) {
      console.log('[GameList] Filter already exists, skipping');
      return;
    }
    const newFilters = [...activeFilters, { type, value, label }];
    console.log('[GameList] New filters:', newFilters);
    updateFilters(newFilters);
  }, [activeFilters, updateFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    updateFilters([]);
  }, [updateFilters]);

  const handleExport = async () => {
    setExportStatus(null);
    try {
      const filePath = await save({
        title: t('export'),
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "pascal-collection.json",
      });
      if (!filePath) return;
      const savedTo = await invoke<string>("export_collection", { exportPath: filePath });
      setExportStatus(`${t('export')} → ${savedTo}`);
    } catch (e) {
      setExportStatus(`${t('error')}: ${e}`);
    }
  };

  const handleImport = async () => {
    setImportStatus(null);
    try {
      const filePath = await open({
        title: t('import'),
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!filePath || typeof filePath !== "string") return;
      const count = await invoke<number>("import_collection", { importPath: filePath });
      setImportStatus(`${t('import')}: ${count} ${t('games')}`);
      fetchGames({
        sort_by: sortBy,
        sort_order: sortOrder,
      });
    } catch (e) {
      setImportStatus(`${t('error')}: ${e}`);
    }
  };

  const handleExportCSV = async () => {
    setCsvExportStatus(null);
    try {
      const filePath = await save({
        title: t('exportCSV'),
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "pascal-collection.csv",
      });
      if (!filePath) return;
      const savedTo = await invoke<string>("export_collection_csv", { exportPath: filePath });
      setCsvExportStatus(`${t('exportCSV')} → ${savedTo}`);
    } catch (e) {
      setCsvExportStatus(`${t('error')}: ${e}`);
    }
  };

  return (
    <div className="theme-bg-secondary min-h-screen">
      {/* Toolbar */}
      <div className="theme-bg-tertiary border-b theme-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg theme-bg-tertiary border theme-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
              title="Grid view"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
              title="List view"
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded ${viewMode === "compact" ? 'theme-accent text-white' : 'theme-text-secondary hover:theme-text-primary'}`}
              title="Compact view"
            >
              ▪
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="theme-bg-tertiary theme-text-primary px-3 py-2 rounded-lg border theme-border"
          >
            <option value="display_name">{t('name')}</option>
            <option value="personal_rating">{t('rating')}</option>
            <option value="igdb_rating">{t('communityRating')}</option>
            <option value="created_at">{t('dateAdded')}</option>
            <option value="release_date">{t('releaseDate')}</option>
            <option value="play_time">{t('playTime')}</option>
            <option value="completion_status">{t('completionStatus')}</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="theme-bg-tertiary theme-text-primary px-3 py-2 rounded-lg border theme-border hover:theme-bg-secondary"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <button
            onClick={() => {
              fetchGames({ sort_by: sortBy, sort_order: sortOrder });
            }}
            className="px-3 py-2 text-sm theme-accent text-white rounded-lg hover:theme-accent-hover transition-colors"
          >
            {t('refresh')} ({games.length} {t('games')})
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-1"
            >
              <span>+</span> {t('addGame') || 'Add Game'}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('export')}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('exportCSV')}
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-2 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('import')}
            </button>
          </div>
        </div>
        {(exportStatus || importStatus || csvExportStatus) && (
          <div className="mt-2 text-sm theme-text-secondary">
            {exportStatus && <span className="mr-4">{exportStatus}</span>}
            {csvExportStatus && <span className="mr-4">{csvExportStatus}</span>}
            {importStatus && <span>{importStatus}</span>}
          </div>
        )}
        
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="theme-card rounded-lg overflow-hidden animate-pulse">
              <div className="h-48 theme-bg-tertiary" />
              <div className="p-4">
                <div className="h-4 theme-bg-tertiary rounded w-3/4 mb-2" />
                <div className="h-4 theme-bg-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="theme-text-primary text-xl font-semibold mb-2">{t('noGamesYet')}</h3>
          <p className="theme-text-secondary mb-2">{t('scanFoldersToStart')}</p>
          <button
            onClick={() => fetchGames({ sort_by: sortBy, sort_order: sortOrder })}
            className="mt-4 px-4 py-2 theme-accent text-white rounded-lg hover:theme-accent-hover"
          >
            {t('refresh')}
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="theme-text-primary text-xl font-semibold mb-2">{t('noGamesFound') || 'No games found'}</h3>
          <p className="theme-text-secondary mb-2">{t('tryAdjustingFilters') || 'Try adjusting your filters'}</p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 theme-accent text-white rounded-lg hover:theme-accent-hover"
          >
            {t('clearAll')}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onClick={onSelectGame} viewMode="grid" onFilter={(type, value) => addFilter(type, value, value)} />
            ))}
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="p-4 space-y-4">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onClick={onSelectGame} viewMode="list" onFilter={(type, value) => addFilter(type, value, value)} />
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onClick={onSelectGame} viewMode="compact" onFilter={(type, value) => addFilter(type, value, value)} />
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <QuickAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onGameAdded={() => {
            fetchGames({ sort_by: sortBy, sort_order: sortOrder });
          }}
        />
      )}
    </div>
  );
}
