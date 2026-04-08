import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Game, IgdbGame } from "../../types";
import { IgdbSearchPanel } from "./IgdbSearchPanel";
import { CoverPreview } from "./CoverPreview";

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
  }, [displayName]);

  const handleClearIgdb = useCallback(() => {
    setIgdbId(null); setIgdbName(""); setCoverUrl(null);
  }, []);

  const handleBrowseFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") setFolderPath(selected);
    } catch {}
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError("Game name is required."); return; }
    setSaving(true); setError(null);
    try {
      const folderName = folderPath ? folderPath.split(/[\\/]/).filter(Boolean).pop() || "" : displayName;
      const game: Game = {
        id: 0, folder_name: folderName, folder_path: folderPath || `manual://${displayName}`,
        display_name: displayName.trim(), igdb_id: igdbId, igdb_slug: null, personal_rating: null, igdb_rating: null,
        notes: notes.trim() || null, cover_url: coverUrl, synopsis: null, release_date: null,
        created_at: "", updated_at: "", tags: [], genres: [], game_modes: [],
        player_perspectives: [], themes: [],
      };
      onSaved(await invoke<Game>("save_game", { game }));
      onClose();
    } catch (e) { setError(`Failed to save: ${e}`); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Add Game Manually</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Game Name *</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. The Witcher 3"
              className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              autoFocus />
          </div>

          {igdbId ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">IGDB Link</label>
              <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg border border-green-700">
                <span className="text-green-400 text-sm flex-1 truncate">✓ {igdbName} (ID: {igdbId})</span>
                <button onClick={handleClearIgdb} className="text-gray-400 hover:text-red-400 text-sm">Clear</button>
              </div>
            </div>
          ) : (
            <IgdbSearchPanel onSelected={handleSelectIgdb} />
          )}

          <CoverPreview coverUrl={coverUrl} />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Folder Path (optional)</label>
            <div className="flex gap-2">
              <input type="text" value={folderPath} onChange={(e) => setFolderPath(e.target.value)}
                placeholder="D:\Games\Witcher3"
                className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm font-mono" />
              <button onClick={handleBrowseFolder}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white text-sm whitespace-nowrap">
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes about this game..." rows={2}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving || !displayName.trim()}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Add Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
