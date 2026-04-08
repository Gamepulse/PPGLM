import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import GameCard from "./GameCard";
import { AddGameModal } from "./AddGameModal";
import { useGames } from "../../hooks/useGames";
import { useI18n } from "../../i18n";
import { DEFAULT_SORT, DEFAULT_ORDER } from "../../utils/constants";

interface GameListProps {
  onSelectGame: (id: number) => void;
  searchQuery?: string;
}

export function GameList({ onSelectGame, searchQuery }: GameListProps) {
  const { games, loading, fetchGames } = useGames();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [sortOrder, setSortOrder] = useState(DEFAULT_ORDER);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    console.log("[GameList] Fetching games...", { sortBy, sortOrder, searchQuery });
    const query = searchQuery?.trim() || undefined;
    fetchGames({
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(query ? { search_query: query } : {}),
    }).then(() => {
      console.log("[GameList] Fetch complete, games count:", games.length);
    });
  }, [fetchGames, sortBy, sortOrder, searchQuery]);

  const filtered = searchQuery?.trim()
    ? games.filter((g) => g.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : games;

  const handleExport = async () => {
    setExportStatus(null);
    try {
      const filePath = await save({
        title: t('export'),
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "pascal-collection.json",
      });
      if (!filePath) return;
      const savedTo = await invoke<string>("export_collection", { exportPath: filePath });
      setExportStatus(`${t('export')} → ${savedTo}`);
    } catch (e) {
      setExportStatus(`${t('error')}: ${e}`);
    }
  };

  const handleImport = async () => {
    setImportStatus(null);
    try {
      const filePath = await open({
        title: t('import'),
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!filePath || typeof filePath !== "string") return;
      const count = await invoke<number>("import_collection", { importPath: filePath });
      setImportStatus(`${t('import')}: ${count} ${t('games')}`);
      fetchGames({
        sort_by: sortBy,
        sort_order: sortOrder,
      });
    } catch (e) {
      setImportStatus(`${t('error')}: ${e}`);
    }
  };

  return (
    <div className="theme-bg-secondary min-h-screen">
      {/* Toolbar */}
      <div className="theme-bg-tertiary border-b theme-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg theme-bg-tertiary theme-text-secondary hover:theme-text-primary theme-border border"
          >
            {viewMode === "grid" ? "☰" : "▦"}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="theme-bg-tertiary theme-text-primary px-3 py-2 rounded-lg border theme-border"
          >
            <option value="display_name">{t('name')}</option>
            <option value="personal_rating">{t('rating')}</option>
            <option value="created_at">{t('dateAdded')}</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="theme-bg-tertiary theme-text-primary px-3 py-2 rounded-lg border theme-border hover:theme-bg-secondary"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <button
            onClick={() => {
              console.log("[GameList] Manual refresh clicked");
              fetchGames({ sort_by: sortBy, sort_order: sortOrder });
            }}
            className="px-3 py-2 text-sm theme-accent text-white rounded-lg hover:theme-accent-hover transition-colors"
          >
            {t('refresh')} ({games.length} {t('games')})
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              + {t('addToLibrary')}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('export')}
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-2 text-sm theme-bg-tertiary theme-text-secondary rounded-lg hover:theme-bg-secondary hover:theme-text-primary transition-colors"
            >
              {t('import')}
            </button>
          </div>
        </div>
        {(exportStatus || importStatus) && (
          <div className="mt-2 text-sm theme-text-secondary">
            {exportStatus && <span className="mr-4">{exportStatus}</span>}
            {importStatus && <span>{importStatus}</span>}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="theme-card rounded-lg overflow-hidden animate-pulse">
              <div className="h-48 theme-bg-tertiary" />
              <div className="p-4">
                <div className="h-4 theme-bg-tertiary rounded w-3/4 mb-2" />
                <div className="h-4 theme-bg-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="theme-text-primary text-xl font-semibold mb-2">{t('noGamesYet')}</h3>
          <p className="theme-text-secondary mb-2">{t('scanFoldersToStart')}</p>
          <p className="theme-text-muted text-sm">({t('games')}: {games.length}, {t('filtered')}: {filtered.length})</p>
          <button
            onClick={() => fetchGames({ sort_by: sortBy, sort_order: sortOrder })}
            className="mt-4 px-4 py-2 theme-accent text-white rounded-lg hover:theme-accent-hover"
          >
            {t('refresh')}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} onClick={onSelectGame} viewMode="grid" />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} onClick={onSelectGame} viewMode="list" />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddGameModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            fetchGames({ sort_by: sortBy, sort_order: sortOrder });
          }}
        />
      )}
    </div>
  );
}
