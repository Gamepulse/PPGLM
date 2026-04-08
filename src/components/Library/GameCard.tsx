import React from "react";
import type { Game } from "../../types";
import { formatRating, formatDate } from "../../utils/formatters";
import { getCategoryColor } from "../../utils/colors";
import { useI18n } from "../../i18n";

interface GameCardProps {
  game: Game;
  onClick: (id: number) => void;
  viewMode: "grid" | "list";
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick, viewMode }) => {
  const { t } = useI18n();
  const { display_name, cover_url, igdb_id, personal_rating, igdb_rating, tags, release_date } = game;
  
  const renderTags = () => {
    if (tags.length === 0) return null;
    
    const displayedTags = tags.slice(0, 3);
    const remainingCount = tags.length - 3;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {displayedTags.map((tag) => (
          <span
            key={tag.id}
            className={`px-2 py-0.5 text-xs rounded-full text-white ${getCategoryColor(tag.category)}`}
          >
            {tag.name}
          </span>
        ))}
        
        {remainingCount > 0 && (
          <span className="px-2 py-0.5 text-xs theme-text-muted bg-gray-700 rounded-full">
            +{remainingCount} {t('more')}
          </span>
        )}
      </div>
    );
  };

  const renderCover = () => {
    if (cover_url) {
      return (
        <div className="relative w-full h-48 theme-bg-tertiary rounded-lg overflow-hidden group flex items-center justify-center">
          <img
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

  const renderIGDBBadge = () => {
    if (igdb_id) {
      return (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span>IGDB</span>
        </div>
      );
    }
    return (
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-600 theme-text-secondary px-2 py-1 rounded-full text-xs">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>{t('manual')}</span>
      </div>
    );
  };

  if (viewMode === "grid") {
    return (
      <div
        className="theme-card theme-border border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-gray-600"
        onClick={() => onClick(game.id)}
      >
        <div className="relative">
          {renderCover()}
          {renderIGDBBadge()}
        </div>
        
        <div className="p-4">
          <h3 className="theme-text-primary font-semibold text-lg mb-2 truncate">{display_name}</h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-medium">
                {formatRating(personal_rating)}
              </span>
              {igdb_rating != null && (
                <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded-full">
                  ★ {igdb_rating.toFixed(0)}
                </span>
              )}
            </div>
            {release_date && (
              <span className="theme-text-muted text-sm">
                {formatDate(release_date)}
              </span>
            )}
          </div>
          
          {renderTags()}
        </div>
      </div>
    );
  }

  // List view mode
  return (
    <div
      className="theme-card theme-border border rounded-lg p-4 flex gap-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-gray-600"
      onClick={() => onClick(game.id)}
    >
      <div className="w-24 h-24 flex-shrink-0">
        {renderCover()}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h3 className="theme-text-primary font-semibold text-lg mb-2">{display_name}</h3>
          {renderIGDBBadge()}
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <span className="text-yellow-400 font-medium">
            {formatRating(personal_rating)}
          </span>
          {igdb_rating != null && (
            <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded-full">
              ★ {igdb_rating.toFixed(0)}
            </span>
          )}
          {release_date && (
            <span className="theme-text-muted text-sm">
              {formatDate(release_date)}
            </span>
          )}
        </div>
        
        {renderTags()}
      </div>
    </div>
  );
};

export default GameCard;
