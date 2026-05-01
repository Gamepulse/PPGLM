import React from "react";
import type { Game } from "../../types";
import { COMPLETION_STATUS_LABELS } from "../../types";
import { formatDate } from "../../utils/formatters";
import { getCategoryColor } from "../../utils/colors";
import { useI18n } from "../../i18n";

interface GameCardProps {
  game: Game;
  onClick: (id: number) => void;
  viewMode: "grid" | "list" | "compact";
  onFilter?: (type: string, value: string) => void;
  showQuickAssign?: boolean;
  onQuickAssign?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick, viewMode, onFilter, showQuickAssign, onQuickAssign }) => {
  const { t } = useI18n();
  const { display_name, cover_url, personal_rating, igdb_rating, tags, release_date, completion_status, play_time, is_favorite, genres, game_modes, player_perspectives, themes, platform } = game;
  
  const platformIcon = platform ? (platform.startsWith('ps') ? '🎮' : platform.startsWith('xbox') ? '🎯' : platform.startsWith('nintendo') ? '🕹️' : platform === 'pc' ? '💻' : platform === 'mobile' ? '📱' : '📟') : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(game.id);
    }
  };
  
  const renderTags = () => {
    if (tags.length === 0) return null;
    
    const displayedTags = tags.slice(0, 3);
    const remainingCount = tags.length - 3;
    
    console.log('[GameCard] Rendering tags:', displayedTags.map(t => t.name), 'onFilter exists:', !!onFilter);
    
    return (
      <div className="flex flex-wrap gap-1 mt-2 pointer-events-auto">
        {displayedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={(e) => {
              console.log('[GameCard] Click handler fired for tag:', tag.name);
              e.stopPropagation();
              e.preventDefault();
              console.log('[GameCard] Calling onFilter with:', 'tag', tag.name);
              if (onFilter) {
                onFilter('tag', tag.name);
              } else {
                console.warn('[GameCard] onFilter is undefined!');
              }
            }}
            className={`relative z-20 px-2 py-0.5 text-xs rounded-full text-white ${getCategoryColor(tag.category)} hover:opacity-80 hover:scale-110 hover:shadow-md transition-all cursor-pointer select-none border border-transparent hover:border-white/30 pointer-events-auto text-left`}
          >
            {tag.name}
          </button>
        ))}
        
        {remainingCount > 0 && (
          <span className="px-2 py-0.5 text-xs theme-text-muted bg-gray-700 rounded-full">
            +{remainingCount} {t('more')}
          </span>
        )}
      </div>
    );
  };
  
  const renderMetadataTags = () => {
    const allMetadata = [
      ...(genres || []).map(g => ({ ...g, type: 'genre' })),
      ...(game_modes || []).map(m => ({ ...m, type: 'mode' })),
      ...(player_perspectives || []).map(p => ({ ...p, type: 'perspective' })),
      ...(themes || []).map(t => ({ ...t, type: 'theme' })),
    ].slice(0, 4);
    
    if (allMetadata.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {allMetadata.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('[GameCard] Metadata tag clicked:', item.type, item.name);
              onFilter?.(item.type, item.name);
            }}
            className="px-1.5 py-0.5 text-xs rounded bg-gray-700/50 theme-text-muted hover:bg-indigo-600/30 transition-colors cursor-pointer select-none text-left"
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  };

  const renderCover = () => {
    if (cover_url) {
      return (
        <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden group flex items-center justify-center">
          <img
            key={cover_url}
            src={cover_url}
            alt={display_name}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.cover-placeholder')?.classList.remove('hidden');
            }}
          />
          <div className="cover-placeholder hidden absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
            <span className="text-4xl">🎮</span>
          </div>
        </div>
      );
    }
    
    // Placeholder gradient for games without cover
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
        <span className="text-4xl">🎮</span>
      </div>
    );
  };

  const renderStatusBadge = () => {
    if (!completion_status || completion_status === 'not_started') return null;
    const statusColors: Record<string, string> = {
      completed: 'bg-green-600',
      playing: 'bg-blue-600',
      dropped: 'bg-red-600',
      wishlist: 'bg-purple-600',
      not_started: 'bg-gray-600',
    };
    const label = COMPLETION_STATUS_LABELS[completion_status as keyof typeof COMPLETION_STATUS_LABELS] || completion_status;
    
    return (
      <button
        key={`status-${game.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('[GameCard] Status badge clicked:', completion_status);
          onFilter?.('status', completion_status);
        }}
        className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs text-white z-20 ${statusColors[completion_status] || 'bg-gray-600'} hover:opacity-80 transition-opacity cursor-pointer select-none text-left`}
      >
        {label}
      </button>
    );
  };

  const renderPlayTime = () => {
    if (!play_time || play_time <= 0) return null;
    return (
      <span className="text-xs theme-text-muted">
        {play_time.toFixed(1)} {t('hours')}
      </span>
    );
  };

  const renderFavorite = () => {
    if (!is_favorite) return null;
    return (
      <span className="text-yellow-400 text-lg">★</span>
    );
  };

  if (viewMode === "grid") {
    return (
      <div
        className="theme-card theme-border border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-gray-600 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        onClick={(e) => {
          // Don't navigate if clicking on an interactive element
          const target = e.target as HTMLElement;
          if (target.closest('[role="button"]') || target.closest('button') || target.closest('a')) {
            console.log('[GameCard] Grid click blocked - interactive element');
            return;
          }
          console.log('[GameCard] Grid click - navigating to game:', game.id);
          onClick(game.id);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-labelledby={`game-title-grid-${game.id}`}
      >
        <div className="relative">
          {renderCover()}
          {renderStatusBadge()}
        </div>
        
        <div className="p-4">
          <h3
            id={`game-title-grid-${game.id}`}
            className="theme-text-primary font-semibold text-lg mb-2 truncate flex items-center gap-2"
          >
            {display_name}
            {renderFavorite()}
            {platformIcon && <span className="text-sm">{platformIcon}</span>}
            {showQuickAssign && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onQuickAssign?.();
                }}
                className="ml-auto text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                title="Quick assign platform"
                aria-label="Quick assign platform"
              >
                🎮
              </button>
            )}
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {personal_rating != null && (
                <span className="text-xs text-yellow-400 bg-yellow-900/40 px-2 py-0.5 rounded-full">
                  ★ {personal_rating}
                </span>
              )}
              {igdb_rating != null && (
                <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded-full">
                  ★ {igdb_rating.toFixed(0)}
                </span>
              )}
              {renderPlayTime()}
            </div>
            {release_date && (
              <span className="theme-text-muted text-sm">
                {formatDate(release_date)}
              </span>
            )}
          </div>
          
          {renderTags()}
          {renderMetadataTags()}
        </div>
      </div>
    );
  }

  // Compact view mode
  if (viewMode === "compact") {
    return (
      <div
        className="theme-card theme-border border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-gray-600 relative focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[role="button"]') || target.closest('button') || target.closest('a')) {
            return;
          }
          onClick(game.id);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-labelledby={`game-title-compact-${game.id}`}
      >
        <div className="relative h-24 bg-gray-800">
          {cover_url ? (
            <img
              key={cover_url}
              src={cover_url}
              alt={display_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.compact-placeholder')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div key={`placeholder-${game.id}`} className={`compact-placeholder ${cover_url ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center`}>
            <span className="text-2xl">🎮</span>
          </div>
          
          {/* Status badge - small */}
          {completion_status && completion_status !== 'not_started' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFilter?.('status', completion_status);
              }}
              className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] text-white z-10 ${
                completion_status === 'completed' ? 'bg-green-600' :
                completion_status === 'playing' ? 'bg-blue-600' :
                completion_status === 'dropped' ? 'bg-red-600' :
                completion_status === 'wishlist' ? 'bg-purple-600' : 'bg-gray-600'
              } hover:opacity-80 transition-opacity cursor-pointer`}
            >
              {completion_status === 'not_started' ? 'Not Started' :
               completion_status === 'playing' ? 'Playing' :
               completion_status === 'completed' ? 'Completed' :
               completion_status === 'dropped' ? 'Dropped' :
               completion_status === 'wishlist' ? 'Wishlist' : completion_status}
            </button>
          )}
          
          {/* Favorite star */}
          {is_favorite && (
            <span className="absolute top-1 right-1 text-yellow-400 text-sm z-10">★</span>
          )}
          
          {/* Quick assign button - bottom left, above platform icon */}
          {showQuickAssign && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAssign?.();
              }}
              className="absolute bottom-1 left-1 w-5 h-5 flex items-center justify-center text-[10px] bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors z-10"
              title="Quick assign platform"
              aria-label="Quick assign platform"
            >
              🎮
            </button>
          )}
          
          {/* Platform icon - bottom right, separate from quick assign */}
          {platformIcon && (
            <span className="absolute bottom-1 right-1 text-sm z-10">{platformIcon}</span>
          )}
        </div>
        
        <div className="p-2">
          <h3
            id={`game-title-compact-${game.id}`}
            className="theme-text-primary font-medium text-xs truncate"
            title={display_name}
          >
            {display_name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              {personal_rating != null && (
                <span className="text-[10px] text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded-full">
                  ★{personal_rating}
                </span>
              )}
              {igdb_rating != null && (
                <span className="text-[10px] text-gray-400 bg-gray-700/60 px-1.5 py-0.5 rounded-full">
                  ★{igdb_rating.toFixed(0)}
                </span>
              )}
            </div>
            {play_time && play_time > 0 && (
              <span className="text-[10px] theme-text-muted">
                {play_time.toFixed(0)}h
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view mode
  return (
    <div
      className="theme-card theme-border border rounded-lg p-4 flex gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-gray-600 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[role="button"]') || target.closest('button') || target.closest('a')) {
          return;
        }
        onClick(game.id);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-labelledby={`game-title-list-${game.id}`}
    >
      <div className="w-32 h-32 flex-shrink-0 relative bg-gray-800 rounded-lg overflow-hidden">
        {cover_url ? (
          <img
            key={cover_url}
            src={cover_url}
            alt={display_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.list-placeholder')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`list-placeholder ${cover_url ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center`}>
          <span className="text-4xl">🎮</span>
        </div>
      </div>
      
        <div className="flex-1">
        <div className="flex items-start justify-between">
          <h3
            id={`game-title-list-${game.id}`}
            className="theme-text-primary font-semibold text-lg mb-2 flex items-center gap-2"
          >
            {display_name}
            {renderFavorite()}
            {platformIcon && <span className="text-lg">{platformIcon}</span>}
            {showQuickAssign && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAssign?.();
                }}
                className="ml-2 text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                title="Quick assign platform"
                aria-label="Quick assign platform"
              >
                🎮
              </button>
            )}
          </h3>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          {personal_rating != null && (
            <span className="text-xs text-yellow-400 bg-yellow-900/40 px-2 py-0.5 rounded-full">
              ★ {personal_rating}
            </span>
          )}
          {igdb_rating != null && (
            <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded-full">
              ★ {igdb_rating.toFixed(0)}
            </span>
          )}
          {renderPlayTime()}
          {release_date && (
            <span className="theme-text-muted text-sm">
              {formatDate(release_date)}
            </span>
          )}
        </div>
        
        {renderTags()}
        {renderMetadataTags()}
      </div>
    </div>
  );
};

export default GameCard;
