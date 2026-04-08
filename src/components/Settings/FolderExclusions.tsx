import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface FolderExclusion {
  id: number;
  pattern: string;
  is_regex: boolean;
}

export function FolderExclusions() {
  const [exclusions, setExclusions] = useState<FolderExclusion[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExclusions = useCallback(async () => {
    try {
      const result = await invoke<FolderExclusion[]>("get_folder_exclusions");
      setExclusions(result);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    loadExclusions();
  }, [loadExclusions]);

  const handleAdd = async () => {
    if (!newPattern.trim()) return;
    
    // Split by comma and process multiple patterns
    const patterns = newPattern
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => p.length > 0);
    
    if (patterns.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      // Add each pattern separately
      for (const pattern of patterns) {
        await invoke("add_folder_exclusion", {
          pattern,
          isRegex: false,
        });
      }
      setNewPattern("");
      await loadExclusions();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await invoke("remove_folder_exclusion", { id });
      await loadExclusions();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Excluded Folder Names</h3>
          <p className="text-gray-400 text-sm">
            Folders containing these terms will be ignored during scanning.
            Enter multiple patterns separated by commas (e.g. "content, update, redist").
            Useful for excluding common non-game directories like "content", "update", etc.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
          Error: {error}
        </div>
      )}

      {/* Add new exclusion */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. content, update, redist..."
          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newPattern.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Exclusions list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {exclusions.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No exclusions configured.</p>
        ) : (
          exclusions.map((exclusion) => (
            <div
              key={exclusion.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono">✕</span>
                <span className="text-white font-medium">{exclusion.pattern}</span>
                {exclusion.is_regex && (
                  <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                    regex
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(exclusion.id)}
                disabled={loading}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove exclusion"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        <p>Default exclusions include: content, bin, obj, lib, include, src, source, assets, resources, data, media, common, shared, engine, core, plugins, mods, workshop, download, downloads, backup, backups, old, archive, archives</p>
      </div>
    </div>
  );
}
