import { useState, useRef, useEffect, useCallback } from "react";
import { Logo } from "./Logo";
import { useFilterOptions } from "../../hooks/useFilterOptions";
import { getCategoryColor } from "../../utils/colors";
import { useI18n } from "../../i18n";
import type { CompletionStatus } from "../../types";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate?: (view: string) => void;
  onFilterByTag?: (tagName: string) => void;
  activeFilters?: Array<{ type: string; value: string; label?: string }>;
  onRemoveFilter?: (type: string, value: string) => void;
  onClearAllFilters?: () => void;
  availableFilters?: {
    genres?: string[];
    modes?: string[];
    perspectives?: string[];
    themes?: string[];
    statuses?: string[];
    platforms?: string[];
  };
  onAddFilter?: (type: string, value: string, label?: string) => void;
}

// Debounce hook for search
function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export function Header({ 
  onSearch, 
  onNavigate, 
  onFilterByTag, 
  activeFilters = [], 
  onRemoveFilter,
  onClearAllFilters,
  onAddFilter
}: HeaderProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'tags' | 'genres' | 'modes' | 'perspectives' | 'themes' | 'status' | 'platform' | 'favorites' | 'igdb'>('tags');
  const { filterOptions } = useFilterOptions();
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Debounced search function (300ms delay)
  const debouncedSearch = useDebounce((searchQuery: string) => {
    onSearch(searchQuery.trim());
  }, 300);

  // Close filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate("library");
    }
  };

  const handleFilterClick = (type: string, value: string, label?: string) => {
    if (onAddFilter) {
      onAddFilter(type, value, label || value);
    } else if (onFilterByTag && type === 'tag') {
      onFilterByTag(value);
    } else {
      // Fallback: search with prefix
      onSearch(`${type}:${value}`);
    }
    setShowFilterMenu(false);
    setQuery("");
  };

  const handleRemoveFilterClick = (type: string, value: string) => {
    if (onRemoveFilter) {
      onRemoveFilter(type, value);
    }
  };

  const getFilterIcon = (type: string): string => {
    const icons: Record<string, string> = {
      tag: '🏷️',
      genre: '🎮',
      mode: '🎯',
      perspective: '👁️',
      theme: '🎨',
      status: '📊',
      platform: '💻',
      favorite: '⭐',
      igdb_match: '🔍',
    };
    return icons[type] || '🔖';
  };

  // Group tags by category
  const tagsByCategory = filterOptions.tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, typeof filterOptions.tags>);

  // Completion status options
  const statusOptions: { value: CompletionStatus; label: string; color: string }[] = [
    { value: 'playing', label: t('playing') || 'Playing', color: 'bg-blue-600' },
    { value: 'completed', label: t('completed') || 'Completed', color: 'bg-green-600' },
    { value: 'dropped', label: t('dropped') || 'Dropped', color: 'bg-red-600' },
    { value: 'wishlist', label: t('wishlist') || 'Wishlist', color: 'bg-purple-600' },
  ];

  // IGDB match options
  const igdbMatchOptions = [
    { value: 'igdb', label: 'IGDB ✓', color: 'bg-green-600' },
    { value: 'manual', label: t('manual') || 'Manual', color: 'bg-gray-600' },
  ];

  return (
    <header className="h-auto bg-gray-900 border-b border-gray-800 flex flex-col px-6 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <Logo onClick={handleLogoClick} />
        
        <div className="flex items-center gap-2" ref={filterMenuRef}>
          {/* Clear All Filters Button - left of Filters */}
          {activeFilters.length > 0 && (
            <button
              onClick={onClearAllFilters}
              className="flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              title={t('clearAll')}
            >
              <span>↺</span>
              <span className="hidden sm:inline">{t('clearAll')}</span>
            </button>
          )}
          
          {/* Unified Filter Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                activeFilters.length > 0 
                  ? "bg-indigo-600 text-white border-indigo-500" 
                  : "bg-gray-800 text-gray-300 hover:text-white border-gray-700 hover:border-gray-600"
              }`}
              title={t('filters') || "Filters"}
            >
              <span>🔍</span>
              <span className="hidden sm:inline">{t('filters') || "Filters"}</span>
              {activeFilters.length > 0 && (
                <span className="ml-1 text-xs bg-white text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {activeFilters.length}
                </span>
              )}
              <span className="text-xs">{showFilterMenu ? "▲" : "▼"}</span>
            </button>

            {/* Unified Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute top-full right-0 mt-1 w-80 max-h-[70vh] overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {/* Filter Tabs */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-2">
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'tags', label: t('tags') || 'Tags', icon: '🏷️' },
                      { id: 'genres', label: t('genres') || 'Genres', icon: '🎮' },
                      { id: 'modes', label: t('gameModes') || 'Modes', icon: '🎯' },
                      { id: 'perspectives', label: t('perspective') || 'Perspectives', icon: '👁️' },
                      { id: 'themes', label: t('themes') || 'Themes', icon: '🎨' },
                      { id: 'status', label: t('completionStatus') || 'Status', icon: '📊' },
                      { id: 'platform', label: t('platform') || 'Platform', icon: '💻' },
                      { id: 'favorites', label: t('favorites') || 'Favoris', icon: '⭐' },
                      { id: 'igdb', label: 'IGDB', icon: '🔍' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFilterTab(tab.id as typeof activeFilterTab)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          activeFilterTab === tab.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <span className="mr-1">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Section */}
                {activeFilterTab === 'tags' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('filterByTag')}</p>
                    {Object.entries(tagsByCategory).length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">{t('noTagsAvailable')}</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                          <div key={category}>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1 px-1">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {categoryTags.map((tag) => {
                                const isActive = activeFilters.some(f => f.type === 'tag' && f.value === tag.name);
                                return (
                                  <button
                                    key={tag.id}
                                    onClick={() => !isActive && handleFilterClick('tag', tag.name)}
                                    className={`px-2 py-1 text-xs rounded-full text-white transition-opacity ${
                                      isActive 
                                        ? "opacity-50 cursor-not-allowed" 
                                        : "hover:opacity-80"
                                    } ${getCategoryColor(tag.category)}`}
                                    disabled={isActive}
                                  >
                                    {tag.name} {isActive && "✓"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Genres Section */}
                {activeFilterTab === 'genres' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('genres')}</p>
                    {filterOptions.genres.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No genres available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.genres.map((genre) => {
                          const isActive = activeFilters.some(f => f.type === 'genre' && f.value === genre.name);
                          return (
                            <button
                              key={genre.id}
                              onClick={() => !isActive && handleFilterClick('genre', genre.name)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                isActive 
                                  ? "bg-indigo-600/50 text-white cursor-not-allowed" 
                                  : "bg-purple-600/80 text-white hover:bg-purple-500"
                              }`}
                              disabled={isActive}
                            >
                              {genre.name} {isActive && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Game Modes Section */}
                {activeFilterTab === 'modes' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('gameModes')}</p>
                    {filterOptions.game_modes.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No game modes available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.game_modes.map((mode) => {
                          const isActive = activeFilters.some(f => f.type === 'mode' && f.value === mode.name);
                          return (
                            <button
                              key={mode.id}
                              onClick={() => !isActive && handleFilterClick('mode', mode.name)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                isActive 
                                  ? "bg-indigo-600/50 text-white cursor-not-allowed" 
                                  : "bg-blue-600/80 text-white hover:bg-blue-500"
                              }`}
                              disabled={isActive}
                            >
                              {mode.name} {isActive && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Player Perspectives Section */}
                {activeFilterTab === 'perspectives' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('playerPerspective')}</p>
                    {filterOptions.player_perspectives.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No perspectives available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.player_perspectives.map((perspective) => {
                          const isActive = activeFilters.some(f => f.type === 'perspective' && f.value === perspective.name);
                          return (
                            <button
                              key={perspective.id}
                              onClick={() => !isActive && handleFilterClick('perspective', perspective.name)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                isActive 
                                  ? "bg-indigo-600/50 text-white cursor-not-allowed" 
                                  : "bg-teal-600/80 text-white hover:bg-teal-500"
                              }`}
                              disabled={isActive}
                            >
                              {perspective.name} {isActive && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Themes Section */}
                {activeFilterTab === 'themes' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('themes')}</p>
                    {filterOptions.themes.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No themes available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.themes.map((theme) => {
                          const isActive = activeFilters.some(f => f.type === 'theme' && f.value === theme.name);
                          return (
                            <button
                              key={theme.id}
                              onClick={() => !isActive && handleFilterClick('theme', theme.name)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                isActive 
                                  ? "bg-indigo-600/50 text-white cursor-not-allowed" 
                                  : "bg-pink-600/80 text-white hover:bg-pink-500"
                              }`}
                              disabled={isActive}
                            >
                              {theme.name} {isActive && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Completion Status Section */}
                {activeFilterTab === 'status' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('completionStatus')}</p>
                    <div className="flex flex-wrap gap-1">
                      {statusOptions.map((status) => {
                        const isActive = activeFilters.some(f => f.type === 'status' && f.value === status.value);
                        return (
                          <button
                            key={status.value}
                            onClick={() => !isActive && handleFilterClick('status', status.value, status.label)}
                            className={`px-2 py-1 text-xs rounded-full text-white transition-colors ${
                              isActive 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:opacity-80"
                            } ${status.color}`}
                            disabled={isActive}
                          >
                            {status.label} {isActive && "✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Platform Section */}
                {activeFilterTab === 'platform' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('platform')}</p>
                    {filterOptions.platforms.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No platforms available</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.platforms.map((platform) => {
                          const isActive = activeFilters.some(f => f.type === 'platform' && f.value === platform.name);
                          return (
                            <button
                              key={platform.id}
                              onClick={() => !isActive && handleFilterClick('platform', platform.name)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                isActive 
                                  ? "bg-indigo-600/50 text-white cursor-not-allowed" 
                                  : "bg-cyan-600/80 text-white hover:bg-cyan-500"
                              }`}
                              disabled={isActive}
                            >
                              {platform.name} {isActive && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Favorites Section */}
                {activeFilterTab === 'favorites' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t('filterByFavorite') || 'Filtrer par favoris'}</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: 'true', label: t('favoritesOnly') || '⭐ Favoris uniquement', color: 'bg-yellow-600' },
                        { value: 'false', label: t('nonFavoritesOnly') || 'Non-favoris', color: 'bg-gray-600' },
                      ].map((option) => {
                        const isActive = activeFilters.some(f => f.type === 'favorite' && f.value === option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => !isActive && handleFilterClick('favorite', option.value, option.label)}
                            className={`px-2 py-1 text-xs rounded-full text-white transition-colors ${
                              isActive 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:opacity-80"
                            } ${option.color}`}
                            disabled={isActive}
                          >
                            {option.label} {isActive && "✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* IGDB Match Section */}
                {activeFilterTab === 'igdb' && (
                  <div className="p-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">IGDB {t('match') || 'Match'}</p>
                    <div className="flex flex-wrap gap-1">
                      {igdbMatchOptions.map((option) => {
                        const isActive = activeFilters.some(f => f.type === 'igdb_match' && f.value === option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => !isActive && handleFilterClick('igdb_match', option.value, option.label)}
                            className={`px-2 py-1 text-xs rounded-full text-white transition-colors ${
                              isActive 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:opacity-80"
                            } ${option.color}`}
                            disabled={isActive}
                          >
                            {option.label} {isActive && "✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              id="game-search"
              name="game-search"
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t('searchGames') || "Search games..."}
              className="bg-gray-800 text-white text-sm px-4 py-2 pr-8 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none w-48 sm:w-64 placeholder-gray-500"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-800">
          <span className="text-xs text-gray-400">{t('activeFilters')}:</span>
          {activeFilters.map((filter, index) => (
            <span
              key={`${filter.type}-${filter.value}-${index}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-indigo-600 text-white"
            >
              <span>{getFilterIcon(filter.type)}</span>
              <span className="capitalize">{filter.type}</span>: {filter.label || filter.value}
              {onRemoveFilter && (
                <button
                  onClick={() => handleRemoveFilterClick(filter.type, filter.value)}
                  className="hover:bg-indigo-700 rounded-full w-4 h-4 flex items-center justify-center ml-1"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
