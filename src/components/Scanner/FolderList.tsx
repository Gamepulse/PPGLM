import { useI18n } from "../../i18n";

interface FolderEntry {
  path: string;
}

interface FolderListProps {
  folders: FolderEntry[];
  onAddFolder: () => void;
  onRemoveFolder: (path: string) => void;
}

export function FolderList({ folders, onAddFolder, onRemoveFolder }: FolderListProps) {
  const { t } = useI18n();

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
            <button
              onClick={() => onRemoveFolder(folder.path)}
              className="ml-4 theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              ✕
            </button>
          </div>
        ))}
        {folders.length === 0 && (
          <p className="theme-text-muted text-center py-8">
            {t('noFoldersConfigured')}
          </p>
        )}
      </div>
    </div>
  );
}
