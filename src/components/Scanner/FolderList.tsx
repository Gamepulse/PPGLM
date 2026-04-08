import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../i18n";

interface FolderEntry {
  path: string;
}

interface FolderListProps {
  folders: FolderEntry[];
  onAddFolder: () => void;
  onRemoveFolder: (path: string) => void;
  onGamesDeleted?: () => void;
}

export function FolderList({ folders, onAddFolder, onRemoveFolder, onGamesDeleted }: FolderListProps) {
  const { t } = useI18n();

  // Confirmation modal state
  const [confirmPath, setConfirmPath] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const handleDeleteClick = (path: string) => {
    setConfirmPath(path);
    setDeleteMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmPath) return;
    setDeleting(true);
    setDeleteMessage(null);
    try {
      const count = await invoke<number>("delete_games_by_scan_path", { scanPath: confirmPath });
      setDeleteMessage(t('gamesDeleted').replace('{{count}}', String(count)));
      onGamesDeleted?.();
    } catch (e) {
      setDeleteMessage(`${t('error')}: ${e}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseModal = () => {
    if (!deleting) {
      setConfirmPath(null);
      setDeleteMessage(null);
    }
  };

  // Extract folder name for display
  const getFolderName = (path: string) => {
    const parts = path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || path;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold theme-text-primary">{t('scanFolders')}</h2>
        <button
          onClick={onAddFolder}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          + {t('addFolder')}
        </button>
      </div>

      <div className="space-y-2">
        {folders.map((folder) => (
          <div
            key={folder.path}
            className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg hover:bg-gray-700 transition-colors group"
          >
            <span className="theme-text-secondary truncate flex-1 text-sm font-mono">{folder.path}</span>
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={() => handleDeleteClick(folder.path)}
                title={t('deleteGamesFromPath')}
                className="theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                🗑
              </button>
              <button
                onClick={() => onRemoveFolder(folder.path)}
                title={t('remove')}
                className="theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {folders.length === 0 && (
          <p className="theme-text-muted text-center py-8">
            {t('noFoldersConfigured')}
          </p>
        )}
      </div>

      {/* Delete Games Confirmation Modal */}
      {confirmPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-red-600/60 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🗑</span>
                </div>
                <h2 className="text-lg font-bold text-white">{t('deleteGames')}</h2>
              </div>
              <p className="text-gray-400 text-sm">
                {t('confirmDeleteGamesFromPath').replace('{{path}}', getFolderName(confirmPath))}
              </p>
            </div>

            {/* Message */}
            {deleteMessage && (
              <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${
                deleteMessage.startsWith(t('error'))
                  ? 'bg-red-900/50 border border-red-700 text-red-200'
                  : 'bg-green-900/50 border border-green-700 text-green-200'
              }`}>
                {deleteMessage}
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={handleCloseModal}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('cancel')}
              </button>
              {!deleteMessage ? (
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('loading')}
                    </span>
                  ) : (
                    t('deleteGames')
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
