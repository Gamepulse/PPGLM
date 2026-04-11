import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ExcludedFolderEvent, ScanResult } from "../../types";
import { useI18n } from "../../i18n";

interface ExcludedFoldersSectionProps {
  excludedFolders: ExcludedFolderEvent[];
  compact?: boolean;
  onAddToResults?: (result: ScanResult) => void;
}

export function ExcludedFoldersSection({ excludedFolders, compact = false, onAddToResults }: ExcludedFoldersSectionProps) {
  const { t } = useI18n();
  const [showExcluded, setShowExcluded] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [retryingFolders, setRetryingFolders] = useState<Set<string>>(new Set());

  return (
    <div className={`theme-border border-t border-yellow-600/30 ${compact ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}>
      <button
        onClick={() => setShowExcluded(!showExcluded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⚠</span>
          <h3 className={`font-semibold theme-text-primary ${compact ? 'text-base' : 'text-lg'}`}>
            {t('excludedFolders') || "Excluded Folders"} 
            <span className="text-sm font-normal theme-text-muted ml-2">
              ({excludedFolders.length} {excludedFolders.length === 1 ? 'folder' : 'folders'})
            </span>
          </h3>
        </div>
        <span className="theme-text-muted">{showExcluded ? '▼' : '▶'}</span>
      </button>
      
      {showExcluded && (
        <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-64'} overflow-y-auto`}>
          {excludedFolders.map((folder, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 p-2 bg-yellow-900/20 rounded-lg border border-yellow-700/30"
            >
              <span className="text-yellow-500 text-sm">🚫</span>
              <div className="flex-1 min-w-0">
                {editingFolder === folder.folder_path ? (
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={editedNames[folder.folder_path] || folder.folder_name}
                      onChange={(e) => setEditedNames(prev => ({ ...prev, [folder.folder_path]: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-gray-700 theme-text-primary rounded border border-yellow-600/50 focus:border-yellow-500 focus:outline-none"
                      placeholder={t('enterNewName') || "Enter new name..."}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          const newName = editedNames[folder.folder_path];
                          if (!newName || newName === folder.folder_name) {
                            setEditingFolder(null);
                            return;
                          }
                          setRetryingFolders(prev => new Set(prev).add(folder.folder_path));
                          try {
                            const result = await invoke<ScanResult | null>("retry_igdb_search", {
                              folderName: folder.folder_name,
                              modifiedName: newName,
                            });
                            if (result && onAddToResults) {
                              onAddToResults({
                                ...result,
                                folder_path: folder.folder_path,
                                folder_name: folder.folder_name,
                              });
                            } else {
                              alert(t('noMatchFound') || "No match found with the new name");
                            }
                          } catch (e) {
                            console.error("Retry failed:", e);
                          } finally {
                            setRetryingFolders(prev => {
                              const next = new Set(prev);
                              next.delete(folder.folder_path);
                              return next;
                            });
                            setEditingFolder(null);
                          }
                        }}
                        disabled={retryingFolders.has(folder.folder_path)}
                        className="flex-1 text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded transition-colors"
                      >
                        {retryingFolders.has(folder.folder_path) 
                          ? (t('searching') || "Searching...") 
                          : (t('searchIgdb') || "🔍 Search")}
                      </button>
                      <button
                        onClick={() => setEditingFolder(null)}
                        className="px-2 py-1 text-xs theme-bg-tertiary theme-text-secondary rounded hover:theme-bg-secondary"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="theme-text-primary text-sm font-medium truncate">{folder.folder_name}</p>
                    <p className="theme-text-muted text-xs truncate">{folder.folder_path}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-yellow-600 text-xs flex-1">{folder.reason}</p>
                      <button
                        onClick={() => {
                          setEditingFolder(folder.folder_path);
                          setEditedNames(prev => ({ ...prev, [folder.folder_path]: folder.folder_name }));
                        }}
                        className="text-xs px-2 py-0.5 bg-yellow-700/50 hover:bg-yellow-600 text-white rounded transition-colors"
                      >
                        ✏️ {t('editAndSearch') || "Edit & Search"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs theme-text-muted">
        {t('excludedFoldersHelp') || "These folders were excluded based on your exclusion patterns. Go to Settings > Folder Exclusions to modify."}
      </p>
    </div>
  );
}
