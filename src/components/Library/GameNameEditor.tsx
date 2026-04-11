import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Game } from "../../types";

interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  cover?: {
    url: string;
  };
  summary?: string;
  rating?: number;
  genres?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  game_modes?: Array<{ id: number; name: string }>;
  player_perspectives?: Array<{ id: number; name: string }>;
  platforms?: Array<{ id: number; name: string }>;
}

interface GameNameEditorProps {
  game: Game;
  onGameUpdated: (updatedGame: Game) => void;
}

export function GameNameEditor({ game, onGameUpdated }: GameNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(game.display_name);
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<IgdbGame[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Start editing
  const handleStartEdit = () => {
    setEditValue(game.display_name);
    setIsEditing(true);
    setShowCandidates(false);
    setCandidates([]);
    setHasChanges(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(game.display_name);
    setShowCandidates(false);
    setCandidates([]);
    setHasChanges(false);
  };

  // Save new name
  const handleSave = async () => {
    if (editValue.trim() === game.display_name) {
      setIsEditing(false);
      return;
    }

    try {
      await invoke("update_game_display_name", {
        id: game.id,
        displayName: editValue.trim(),
      });

      // Update local game object
      const updatedGame = { ...game, display_name: editValue.trim() };
      onGameUpdated(updatedGame);
      setIsEditing(false);
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to update display name:", e);
      alert("Failed to update name: " + String(e));
    }
  };

  // Search IGDB
  const handleSearchIgdb = async () => {
    if (!editValue.trim()) return;

    setIsSearching(true);
    setShowCandidates(true);

    try {
      const results = await invoke<IgdbGame[]>("search_igdb_games_full", {
        query: editValue.trim(),
      });
      setCandidates(results.slice(0, 10));
    } catch (e) {
      console.error("IGDB search failed:", e);
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a candidate and refresh game
  const handleSelectCandidate = async (candidate: IgdbGame) => {
    try {
      // Update game with all candidate data including metadata
      await invoke("update_game_from_igdb_candidate", {
        id: game.id,
        displayName: candidate.name,
        igdbId: candidate.id,
        igdbSlug: candidate.slug || null,
        coverUrl: candidate.cover?.url ? `https:${candidate.cover.url.replace("t_thumb", "t_cover_big")}` : null,
        synopsis: candidate.summary || null,
        igdbRating: candidate.rating || null,
        genres: candidate.genres || [],
        gameModes: candidate.game_modes || [],
        playerPerspectives: candidate.player_perspectives || [],
        themes: candidate.themes || [],
        platforms: candidate.platforms || [],
      });

      // Reload game data
      const updatedGame = await invoke<Game>("get_game_by_id", { id: game.id });
      onGameUpdated(updatedGame);

      // Reset state
      setIsEditing(false);
      setShowCandidates(false);
      setCandidates([]);
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to update game from candidate:", e);
      alert("Failed to update: " + String(e));
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (hasChanges && editValue.trim()) {
        // Search IGDB if name changed
        handleSearchIgdb();
      } else {
        handleSave();
      }
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    setHasChanges(true);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h1
          className="text-3xl font-bold theme-text-primary cursor-pointer hover:text-blue-400 transition-colors"
          onClick={handleStartEdit}
          title="Click to edit name"
        >
          {game.display_name}
        </h1>
        <button
          onClick={handleStartEdit}
          className="text-gray-500 hover:text-blue-400 p-1 transition-colors"
          title="Edit name"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 text-2xl font-bold px-3 py-2 bg-gray-700 theme-text-primary rounded-lg theme-border border focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Game name"
          autoFocus
        />
        {/* Re-Scan button - show when name changed */}
        {hasChanges && (
          <button
            onClick={handleSearchIgdb}
            disabled={isSearching || !editValue.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            title={isSearching ? 'Re-scanning...' : 'Re-Scan IGDB'}
          >
            {isSearching ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <span>🔄</span>
            )}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!editValue.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          title="Save"
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          title="Cancel"
        >
          ✕
        </button>
      </div>

      {/* Candidates list */}
      {showCandidates && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {isSearching
              ? "Searching IGDB..."
              : candidates.length > 0
                ? "Select a match:"
                : "No matches found"}
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => handleSelectCandidate(candidate)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors text-left"
              >
                {candidate.cover?.url ? (
                  <img
                    src={`https:${candidate.cover.url.replace("t_thumb", "t_cover_small")}`}
                    alt=""
                    className="w-10 h-14 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎮</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium theme-text-primary truncate">
                    {candidate.name}
                  </p>
                  <p className="text-xs text-gray-500">IGDB ID: {candidate.id}</p>
                </div>
                <span className="text-blue-400 text-sm">→</span>
              </button>
            ))}
          </div>

          {!isSearching && candidates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Try a different name
            </p>
          )}
        </div>
      )}
    </div>
  );
}
