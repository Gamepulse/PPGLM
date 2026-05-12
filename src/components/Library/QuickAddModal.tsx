import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Game } from "../../types";
import { useI18n } from "../../i18n";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: (game: Game) => void;
}

export function QuickAddModal({ isOpen, onClose, onGameAdded }: QuickAddModalProps) {
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [executablePath, setExecutablePath] = useState("");
  const [igdbId, setIgdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      setFolderPath(selected);
    }
  };

  const handleBrowseExecutable = async () => {
    const selected = await open({
      directory: false,
      multiple: false,
      filters: [
        { name: "Executables", extensions: ["exe", "sh", "app", "bat"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (selected && typeof selected === "string") {
      setExecutablePath(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const game = await invoke<Game>("quick_add_game", {
        displayName: displayName.trim(),
        folderPath: folderPath || null,
        executablePath: executablePath || null,
        igdbId: igdbId ? parseInt(igdbId, 10) : null,
      });
      onGameAdded(game);
      onClose();
      // Reset form
      setDisplayName("");
      setFolderPath("");
      setExecutablePath("");
      setIgdbId("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="theme-bg-primary rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-xl font-bold theme-text-primary mb-4">{t('addGame')}</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="game-name" className="block text-sm font-medium theme-text-secondary mb-1">
              {t('name')} *
            </label>
            <input
              id="game-name"
              name="game-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
              placeholder="Game name"
              required
            />
          </div>

          <div>
            <label htmlFor="folder-path" className="block text-sm font-medium theme-text-secondary mb-1">
              Folder Path
            </label>
            <div className="flex gap-2">
              <input
                id="folder-path"
                name="folder-path"
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional - game folder location"
                readOnly
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
              >
                {t('browse')}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="executable-path" className="block text-sm font-medium theme-text-secondary mb-1">
              {t('executablePath')}
            </label>
            <div className="flex gap-2">
              <input
                id="executable-path"
                name="executable-path"
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional - for launching the game"
                readOnly
              />
              <button
                type="button"
                onClick={handleBrowseExecutable}
                className="px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
              >
                {t('browse')}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="igdb-id" className="block text-sm font-medium theme-text-secondary mb-1">
              IGDB ID
            </label>
            <input
              id="igdb-id"
              name="igdb-id"
              type="number"
              value={igdbId}
              onChange={(e) => setIgdbId(e.target.value)}
              className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional - for auto-fetching metadata"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('saving') : t('addToLibrary')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
