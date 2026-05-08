import type { Game } from "../../types";
import { open } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../i18n";
import { GameNameEditor } from "./GameNameEditor";
import { TagEditor } from "./TagEditor";
import { useSettings, AVAILABLE_CONSOLES } from "../../context/SettingsContext";
import { getMappedPlatformsFromIgdb } from "../../utils/platformMapping";
import { formatDate } from "../../utils/formatters";

interface GameDetailHeaderProps {
  game: Game;
  onGameUpdated?: (updatedGame: Game) => void;
  onPlatformChange?: (platform: string) => void;
  onFilter?: (type: string, value: string) => void;
  onFavoriteToggle?: () => void;
  onRatingChange?: (rating: number | null) => void;
  onTagsChanged?: () => void;
}

// Regroupement des plateformes par catégorie pour l'affichage
const PLATFORM_GROUPS = [
  { id: 'pc', category: '💻 PC' },
  { id: 'ps5', category: '🎮 PlayStation' },
  { id: 'ps4', category: '🎮 PlayStation' },
  { id: 'ps3', category: '🎮 PlayStation' },
  { id: 'ps2', category: '🎮 PlayStation' },
  { id: 'ps1', category: '🎮 PlayStation' },
  { id: 'xbox_series', category: '🎯 Xbox' },
  { id: 'xbox_one', category: '🎯 Xbox' },
  { id: 'xbox_360', category: '🎯 Xbox' },
  { id: 'nintendo_switch', category: '🕹️ Nintendo' },
  { id: 'nintendo_wiiu', category: '🕹️ Nintendo' },
  { id: 'nintendo_wii', category: '🕹️ Nintendo' },
  { id: 'nintendo_3ds', category: '🕹️ Nintendo' },
  { id: 'nintendo_ds', category: '🕹️ Nintendo' },
  { id: 'mobile', category: '📱 Mobile' },
  { id: 'other', category: '📟 Other' },
];

export function GameDetailHeader({ game, onGameUpdated, onPlatformChange, onFilter, onFavoriteToggle, onRatingChange, onTagsChanged }: GameDetailHeaderProps) {
  const { t } = useI18n();
  const { activeConsoles } = useSettings();

  const handleGameUpdated = (updatedGame: Game) => {
    if (onGameUpdated) {
      onGameUpdated(updatedGame);
    }
  };

  const handlePlatformSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onPlatformChange) {
      onPlatformChange(e.target.value);
    }
  };

  const handleOpenIgdb = async () => {
    const slug = game.igdb_slug || String(game.igdb_id);
    const url = `https://www.igdb.com/games/${slug}`;
    try { await open(url); } catch { window.open(url, "_blank"); }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: game.folder_path });
    } catch (e) {
      console.error("Failed to open folder:", e);
      try {
        const path = game.folder_path;
        const isWindows = navigator.platform.indexOf('Win') > -1;
        if (isWindows) {
          await open(`file://${path}`);
        } else {
          await open(path);
        }
      } catch (e2) {
        console.error("Fallback also failed:", e2);
      }
    }
  };

  // Obtenir les plateformes disponibles pour ce jeu depuis IGDB
  const getGamePlatforms = (): Array<{ id: string; name: string; disabled: boolean }> => {
    // Si le jeu a des plateformes IGDB, utiliser celles-ci
    if (game.igdb_platforms && game.igdb_platforms.length > 0) {
      const mappedPlatformIds = getMappedPlatformsFromIgdb(game.igdb_platforms);
      
      return mappedPlatformIds.map(platformId => {
        const consoleInfo = AVAILABLE_CONSOLES.find(c => c.id === platformId);
        const isOwned = activeConsoles.includes(platformId);
        return {
          id: platformId,
          name: consoleInfo?.name || platformId,
          disabled: !isOwned
        };
      });
    }
    
    // Sinon, afficher toutes les plateformes de l'utilisateur
    return activeConsoles.map(platformId => {
      const consoleInfo = AVAILABLE_CONSOLES.find(c => c.id === platformId);
      return {
        id: platformId,
        name: consoleInfo?.name || platformId,
        disabled: false
      };
    });
  };

  const gamePlatforms = getGamePlatforms();
  
  // Grouper les plateformes par catégorie
  const groupedPlatforms = PLATFORM_GROUPS.reduce((acc, platformDef) => {
    const platform = gamePlatforms.find(p => p.id === platformDef.id);
    if (platform) {
      if (!acc[platformDef.category]) {
        acc[platformDef.category] = [];
      }
      acc[platformDef.category].push(platform);
    }
    return acc;
  }, {} as Record<string, Array<{ id: string; name: string; disabled: boolean }>>);

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0 space-y-3">
        <div className="relative">
          {game.cover_url ? (
            <div className="relative overflow-hidden rounded-lg svg-text-mask-container">
              <img 
                src={game.cover_url} 
                alt={game.display_name} 
                className="w-full rounded-lg" 
              />
              <div className="svg-text-mask" aria-hidden="true">
                <span className="text-4xl font-black text-white drop-shadow-lg" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>PPGM</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-5xl" role="img" aria-hidden="true">🎮</span>
            </div>
          )}
          {/* Favorite Star - top right corner */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
              className="absolute -top-2 -right-2 w-10 h-10 flex items-center justify-center text-3xl transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-full"
              title={game.is_favorite ? t('removeFromFavorites') : t('addToFavorites')}
              aria-label={game.is_favorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
              {game.is_favorite ? (
                <span className="text-yellow-400 drop-shadow-lg" role="img" aria-hidden="true">★</span>
              ) : (
                <span className="text-gray-400 hover:text-yellow-300" role="img" aria-hidden="true">☆</span>
              )}
            </button>
          )}
        </div>
        
        {/* Platform Selector */}
        {onPlatformChange && (
          <div>
            <label htmlFor={`platform-select-${game.id}`} className="block text-xs font-medium theme-text-secondary mb-1">
              {t('platforms') || 'Plateformes'}
            </label>
            <select
              id={`platform-select-${game.id}`}
              value={game.platform || ''}
              onChange={handlePlatformSelect}
              className="w-full px-2 py-1.5 text-sm theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('selectPlatform') || 'Select platform...'}</option>
              {Object.entries(groupedPlatforms).map(([category, platforms]) => (
                <optgroup key={category} label={category}>
                  {platforms.map(platform => (
                    <option 
                      key={platform.id} 
                      value={platform.id}
                      disabled={platform.disabled}
                      className={platform.disabled ? "text-gray-500" : ""}
                    >
                      {platform.name}{platform.disabled ? " (non possédé)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
              {/* Option "Other" si pas de plateformes mappées */}
              {gamePlatforms.length === 0 && (
                <>
                  <optgroup label="💻 PC">
                    <option value="pc">PC</option>
                  </optgroup>
                  <optgroup label="🎮 PlayStation">
                    <option value="ps5">PlayStation 5</option>
                    <option value="ps4">PlayStation 4</option>
                    <option value="ps3">PlayStation 3</option>
                    <option value="ps2">PlayStation 2</option>
                    <option value="ps1">PlayStation</option>
                  </optgroup>
                  <optgroup label="🎯 Xbox">
                    <option value="xbox_series">Xbox Series X|S</option>
                    <option value="xbox_one">Xbox One</option>
                    <option value="xbox_360">Xbox 360</option>
                  </optgroup>
                  <optgroup label="🕹️ Nintendo">
                    <option value="nintendo_switch">Nintendo Switch</option>
                    <option value="nintendo_wiiu">Nintendo Wii U</option>
                    <option value="nintendo_wii">Nintendo Wii</option>
                    <option value="nintendo_3ds">Nintendo 3DS</option>
                    <option value="nintendo_ds">Nintendo DS</option>
                  </optgroup>
                  <optgroup label="📱 Mobile">
                    <option value="mobile">Mobile</option>
                  </optgroup>
                  <optgroup label="📟 Other">
                    <option value="other">Other</option>
                  </optgroup>
                </>
              )}
            </select>
            {game.igdb_platforms && game.igdb_platforms.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                IGDB: {game.igdb_platforms.map(p => p.name).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <GameNameEditor game={game} onGameUpdated={handleGameUpdated} />
        
        {/* IGDB Page button prominently displayed */}
        {game.igdb_id && (
          <button type="button" onClick={handleOpenIgdb}
            className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1.5 bg-blue-900/40 rounded-lg hover:bg-blue-900/60 transition-colors inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`${t('igdbPage')} (opens in browser)`}
          >
            <span role="img" aria-hidden="true">🌐</span> {t('igdbPage')} ↗
          </button>
        )}

        {/* Folder path */}
        <button
          type="button"
          className="w-full text-left theme-text-muted text-sm font-mono cursor-pointer hover:text-blue-400 hover:underline transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
          onClick={handleOpenFolder}
          title={t('openFolder') || "Click to open folder"}
          aria-label={`${t('openFolder') || "Open folder"}: ${game.folder_path}`}
        >
          <span role="img" aria-hidden="true">📁</span>
          <span className="truncate">{game.folder_path}</span>
          <span className="text-xs opacity-50" aria-hidden="true">↗</span>
        </button>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {game.completion_status && game.completion_status !== 'not_started' && (
            <span className={`px-2 py-1 text-xs rounded-full text-white ${
              game.completion_status === 'completed' ? 'bg-green-600' :
              game.completion_status === 'playing' ? 'bg-blue-600' :
              game.completion_status === 'dropped' ? 'bg-red-600' :
              game.completion_status === 'wishlist' ? 'bg-purple-600' :
              'bg-gray-600'
            }`}
            aria-label={`${t('completionStatus')}: ${t(game.completion_status as any)}`}
            >
              {t(game.completion_status as 'notStarted' | 'playing' | 'completed' | 'dropped' | 'wishlist')}
            </span>
          )}
          {game.completion_status !== 'not_started' && game.play_time && game.play_time > 0 && (
            <span className="px-2 py-1 text-xs rounded-full bg-indigo-600 text-white">
              {game.play_time.toFixed(1)} {t('hours')}
            </span>
          )}
        </div>

        {/* Genres */}
        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-text-muted text-sm">{t('genres')}:</span>
            {game.genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => onFilter?.('genre', genre.name)}
                className="px-2 py-0.5 text-xs rounded-full text-white bg-blue-600 hover:bg-blue-500 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`${t('genres')}: ${genre.name}`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}

        {/* Game Modes */}
        {game.game_modes && game.game_modes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-text-muted text-sm">{t('gameModes')}:</span>
            {game.game_modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onFilter?.('mode', mode.name)}
                className="px-2 py-0.5 text-xs rounded-full text-white bg-purple-600 hover:bg-purple-500 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`${t('gameModes')}: ${mode.name}`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        )}

        {/* Perspectives */}
        {game.player_perspectives && game.player_perspectives.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-text-muted text-sm">{t('perspective')}:</span>
            {game.player_perspectives.map((persp) => (
              <button
                key={persp.id}
                type="button"
                onClick={() => onFilter?.('perspective', persp.name)}
                className="px-2 py-0.5 text-xs rounded-full text-white bg-green-600 hover:bg-green-500 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`${t('perspective')}: ${persp.name}`}
              >
                {persp.name}
              </button>
            ))}
          </div>
        )}

        {/* Themes */}
        {game.themes && game.themes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-text-muted text-sm">{t('themes')}:</span>
            {game.themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onFilter?.('theme', theme.name)}
                className="px-2 py-0.5 text-xs rounded-full text-white bg-orange-600 hover:bg-orange-500 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`${t('themes')}: ${theme.name}`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-start gap-2">
          <span className="theme-text-muted text-sm pt-1">{t('tags')}:</span>
          <div className="flex-1 max-h-16 overflow-y-auto">
            <TagEditor 
              gameId={game.id} 
              tags={game.tags || []} 
              onTagsChanged={onTagsChanged || (() => {})}
            />
          </div>
        </div>

        {/* Release Date */}
        {game.release_date && (
          <div className="flex items-center gap-2">
            <span className="theme-text-muted text-sm">{t('releaseDate')}:</span>
            <span className="theme-text-primary text-sm">{formatDate(game.release_date)}</span>
          </div>
        )}

        {/* Community Rating */}
        {game.igdb_rating && (
          <div className="flex items-center gap-2">
            <span className="theme-text-muted text-sm">{t('communityRating')}:</span>
            <span className="text-yellow-400 text-sm font-semibold">{game.igdb_rating.toFixed(1)}/100</span>
          </div>
        )}

        {/* Personal Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`rating-input-${game.id}`} className="theme-text-muted text-sm">
              {t('personalRating')} (0-100): <span className="text-purple-500 font-semibold">{game.personal_rating !== null && game.personal_rating !== undefined ? `${game.personal_rating}/100` : '-'}</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs theme-text-muted" aria-hidden="true">0</span>
            <input
              id={`rating-input-${game.id}`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={game.personal_rating || 0}
              onChange={(e) => onRatingChange?.(parseInt(e.target.value) || 0)}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:bg-indigo-500 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:hover:bg-indigo-400
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:bg-indigo-500 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0"
            />
            <span className="text-xs theme-text-muted">100</span>
          </div>
        </div>

      </div>
    </div>
  );
}
