import { useState } from "react";
import type { ScannedParentFolderEvent } from "../../types";
import { useI18n } from "../../i18n";

interface ScannedParentFoldersSectionProps {
  parentFolders: ScannedParentFolderEvent[];
  compact?: boolean;
}

export function ScannedParentFoldersSection({ parentFolders, compact = false }: ScannedParentFoldersSectionProps) {
  const { t } = useI18n();
  const [showParents, setShowParents] = useState(false);

  return (
    <div className={`theme-border border-t border-gray-600/30 ${compact ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}>
      <button
        onClick={() => setShowParents(!showParents)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">📁</span>
          <h3 className={`font-semibold theme-text-primary ${compact ? 'text-base' : 'text-lg'}`}>
            {t('parentFolders') || "Parent Folders Scanned"} 
            <span className="text-sm font-normal theme-text-muted ml-2">
              ({parentFolders.length} {parentFolders.length === 1 ? 'folder' : 'folders'})
            </span>
          </h3>
        </div>
        <span className="theme-text-muted">{showParents ? '▼' : '▶'}</span>
      </button>
      
      {showParents && (
        <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-64'} overflow-y-auto`}>
          {parentFolders.map((folder, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30"
            >
              <span className="text-gray-500 text-sm">📁</span>
              <div className="flex-1 min-w-0">
                <p className="theme-text-primary text-sm font-medium truncate">{folder.folder_name}</p>
                <p className="theme-text-muted text-xs truncate">{folder.folder_path}</p>
                <p className="text-gray-500 text-xs">
                  {t('depth') || "Depth"}: {folder.depth} - {t('noMatchContinueScanning') || "No match, continued scanning deeper"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs theme-text-muted">
        {t('parentFoldersHelp') || "These folders were scanned but had no match. The scanner continued searching in their subdirectories and found games deeper."}
      </p>
    </div>
  );
}
