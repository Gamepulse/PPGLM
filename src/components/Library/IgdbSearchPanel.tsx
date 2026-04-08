import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { IgdbGame } from "../../types";

interface IgdbSearchPanelProps {
  onSelected: (game: IgdbGame) => void;
}

export function IgdbSearchPanel({ onSelected }: IgdbSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbGame[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await invoke<IgdbGame[]>("search_igdb_games_full", { query: query.trim() }));
    } catch {} finally { setSearching(false); }
  }, [query]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-1">IGDB Link (optional)</label>
      <div className="flex gap-2">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search IGDB..."
          className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm" />
        <button onClick={handleSearch} disabled={searching || !query.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-sm whitespace-nowrap">
          {searching ? "..." : "Search"}
        </button>
      </div>
      {results.length > 0 && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg max-h-48 overflow-y-auto">
          {results.map((g) => (
            <button key={g.id} onClick={() => { onSelected(g); setResults([]); setQuery(""); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors">
              {g.cover ? (
                <img src={`https:${g.cover.url.replace("t_thumb", "t_cover_small")}`} alt=""
                  className="w-8 h-10 object-cover rounded flex-shrink-0" />
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
  );
}
