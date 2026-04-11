import { useState, useRef, useEffect, useCallback } from "react";
import { Logo } from "./Logo";
import { useTags } from "../../hooks/useTags";
import { getCategoryColor } from "../../utils/colors";
import { useI18n } from "../../i18n";

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
  availableFilters = {},
  onAddFilter
}: HeaderProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'tags' | 'metadata' | 'status'>('tags');
  const { tags } = useTags();
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

  const handleTagClick = (tagName: string) => {
    if (onFilterByTag) {
      onFilterByTag(tagName);
    } else {
      // Fallback: search with tag prefix
      onSearch(`tag:${tagName}`);
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
    };
    return icons[type] || '🔖';
  };

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  return (
    <header className="h-auto bg-gray-900 border-b border-gray-800 flex flex-col px-6 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <Logo onClick={handleLogoClick} />
        
        <div className="flex items-center gap-2" ref={filterMenuRef}>
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
              <div className="absolute top-full right-0 mt-1 w-72 max-h-[70vh] overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {/* Tags Section */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-2">
                  <p className="text-xs text-gray-400 font-medium">{t('filterByTag')}</p>
                </div>
                
                {Object.entries(tagsByCategory).length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">{t('noTagsAvailable')}</p>
                ) : (
                  <div className="p-2 space-y-2">
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
                                onClick={() => !isActive && handleTagClick(tag.name)}
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
