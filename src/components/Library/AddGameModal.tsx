import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Game, IgdbGame } from "../../types";

interface AddGameModalProps {
  onClose: () => void;
  onSaved: (game: Game) => void;
}

export function AddGameModal({ onClose, onSaved }: AddGameModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [igdbId, setIgdbId] = useState<number | null>(null);
  const [igdbName, setIgdbName] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IGDB search state
  const [igdbQuery, setIgdbQuery] = useState("");
  const [igdbResults, setIgdbResults] = useState<IgdbGame[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearchIgdb = useCallback(async () => {
    if (!igdbQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await invoke<IgdbGame[]>("search_igdb_games_full", {
        query: igdbQuery.trim(),
      });
      setIgdbResults(results);
    } catch (e) {
      setError(`IGDB search failed: ${e}`);
    } finally {
      setSearching(false);
    }
  }, [igdbQuery]);

  const handleSelectIgdb = useCallback((game: IgdbGame) => {
    setIgdbId(game.id);
    setIgdbName(game.name);
    if (!displayName) setDisplayName(game.name);
    if (game.cover) {
      const url = game.cover.url.startsWith("//")
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : game.cover.url;
      setCoverUrl(url);
    }
    setIgdbResults([]);
    setIgdbQuery("");
  }, [displayName]);

  const handleClearIgdb = useCallback(() => {
    setIgdbId(null);
    setIgdbName("");
    setCoverUrl(null);
  }, []);

  const handleBrowseFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        setFolderPath(selected);
      }
    } catch (e) {
      console.error("Failed to browse folder:", e);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Game name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const folderName = folderPath
        ? folderPath.split(/[\\/]/).filter(Boolean).pop() || ""
        : displayName;
      const game: Game = {
        id: 0,
        folder_name: folderName,
        folder_path: folderPath || `manual://${displayName}`,
        display_name: displayName.trim(),
        igdb_id: igdbId,
        personal_rating: null,
        igdb_rating: null,
        notes: notes.trim() || null,
        cover_url: coverUrl,
        synopsis: null,
        release_date: null,
        created_at: "",
        updated_at: "",
        tags: [],
        genres: [],
        game_modes: [],
        player_perspectives: [],
        themes: [],
      };
      const saved = await invoke<Game>("save_game", { game });
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(`Failed to save: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Add Game Manually</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Game Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Game Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. The Witcher 3"
              className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Folder Path */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Folder Path (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="D:\Games\Witcher3"
                className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm font-mono"
              />
              <button
                onClick={handleBrowseFolder}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white text-sm whitespace-nowrap"
              >
                Browse
              </button>
            </div>
          </div>

          {/* IGDB Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">IGDB Link (optional)</label>
            {igdbId ? (
              <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg border border-green-700">
                <span className="text-green-400 text-sm flex-1 truncate">
                  ✓ {igdbName} (ID: {igdbId})
                </span>
                <button onClick={handleClearIgdb} className="text-gray-400 hover:text-red-400 text-sm">
                  Clear
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={igdbQuery}
                    onChange={(e) => setIgdbQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchIgdb()}
                    placeholder="Search IGDB..."
                    className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <button
                    onClick={handleSearchIgdb}
                    disabled={searching || !igdbQuery.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {searching ? "..." : "Search"}
                  </button>
                </div>
                {igdbResults.length > 0 && (
                  <div className="bg-gray-900 border border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                    {igdbResults.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleSelectIgdb(g)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                      >
                        {g.cover ? (
                          <img
                            src={`https:${g.cover.url.replace("t_thumb", "t_cover_small")}`}
                            alt=""
                            className="w-8 h-10 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-10 bg-gray-700 rounded flex items-center justify-center text-xs flex-shrink-0">🎮</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{g.name}</p>
                          <p className="text-gray-500 text-xs">ID: {g.id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cover Preview */}
          {coverUrl && (
            <div className="flex items-center gap-3">
              <img src={coverUrl} alt="Cover" className="w-16 h-20 object-cover rounded shadow-md" />
              <span className="text-gray-400 text-sm">Cover from IGDB</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes about this game..."
              rows={2}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Add Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
