import { useState } from "react";
import type { NoMatchFolderEvent } from "../../types";
import { useI18n } from "../../i18n";

interface NoMatchFoldersSectionProps {
  noMatchFolders: NoMatchFolderEvent[];
  compact?: boolean;
}

export function NoMatchFoldersSection({ noMatchFolders, compact = false }: NoMatchFoldersSectionProps) {
  const { t } = useI18n();
  const [showNoMatch, setShowNoMatch] = useState(false);

  return (
    <div className={`theme-border border-t border-orange-600/30 ${compact ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}>
      <button
        onClick={() => setShowNoMatch(!showNoMatch)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-orange-500">❓</span>
          <h3 className={`font-semibold theme-text-primary ${compact ? 'text-base' : 'text-lg'}`}>
            {t('noMatchFolders') || "Folders Without Match"} 
            <span className="text-sm font-normal theme-text-muted ml-2">
              ({noMatchFolders.length} {noMatchFolders.length === 1 ? 'folder' : 'folders'})
            </span>
          </h3>
        </div>
        <span className="theme-text-muted">{showNoMatch ? '▼' : '▶'}</span>
      </button>
      
      {showNoMatch && (
        <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-64'} overflow-y-auto`}>
          {noMatchFolders.map((folder, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 p-2 bg-orange-900/20 rounded-lg border border-orange-700/30"
            >
              <span className="text-orange-500 text-sm">❓</span>
              <div className="flex-1 min-w-0">
                <p className="theme-text-primary text-sm font-medium truncate">{folder.folder_name}</p>
                <p className="theme-text-muted text-xs truncate">{folder.folder_path}</p>
                <p className="text-orange-600 text-xs">
                  {t('searchedAs') || "Searched as"}: {folder.display_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs theme-text-muted">
        {t('noMatchFoldersHelp') || "These folders were scanned but no game match was found in IGDB. You can retry with a different name or adjust the match threshold in Settings."}
      </p>
    </div>
  );
}
