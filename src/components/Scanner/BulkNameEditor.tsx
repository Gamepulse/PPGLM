import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ScanResult } from "../../types";
import { useI18n } from "../../i18n";

interface BulkNameEditorProps {
  results: ScanResult[];
  onUpdateResults: (updatedResults: ScanResult[]) => void;
  isRetrying: boolean;
  setIsRetrying: (value: boolean) => void;
}

export function BulkNameEditor({ results, onUpdateResults, isRetrying, setIsRetrying }: BulkNameEditorProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState("");
  const [progress, setProgress] = useState<string>("");

  // Generate initial text from results
  const generateNamesText = () => {
    return results.map(r => `${r.folder_name}|${r.display_name}`).join("\n");
  };

  const handleOpen = () => {
    setBulkNames(generateNamesText());
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsRetrying(true);
    setProgress(t('searchingIgdb') || "Searching IGDB...");

    try {
      // Parse the bulk names
      const lines = bulkNames.split("\n").filter(line => line.trim());
      const foldersToRetry: { folderPath: string; folderName: string; newName: string }[] = [];

      for (const line of lines) {
        const parts = line.split("|");
        if (parts.length >= 2) {
          const folderName = parts[0].trim();
          const newDisplayName = parts[1].trim();
          
          // Find the corresponding result
          const result = results.find(r => r.folder_name === folderName);
          if (result && newDisplayName && newDisplayName !== result.display_name) {
            foldersToRetry.push({
              folderPath: result.folder_path,
              folderName: result.folder_name,
              newName: newDisplayName
            });
          }
        }
      }

      if (foldersToRetry.length === 0) {
        setProgress(t('noChangesToApply') || "No changes to apply");
        setTimeout(() => {
          setIsRetrying(false);
          setProgress("");
        }, 2000);
        return;
      }

      // Call bulk retry
      const retryResults = await invoke<[string, ScanResult | null][]>("bulk_retry_igdb_search", {
        folders: foldersToRetry.map(f => [f.folderName, f.folderPath, f.newName])
      });

      // Update results
      const updatedResults = [...results];
      let matchCount = 0;

      for (const [folderPath, newResult] of retryResults) {
        if (newResult) {
          const index = updatedResults.findIndex(r => r.folder_path === folderPath);
          if (index !== -1) {
            updatedResults[index] = {
              ...updatedResults[index],
              ...newResult,
              folder_path: folderPath,
            };
            matchCount++;
          }
        }
      }

      onUpdateResults(updatedResults);
      setProgress(t('matchesFound').replace('{{count}}', String(matchCount)) || `Found ${matchCount} matches`);
      
      setTimeout(() => {
        setIsOpen(false);
        setIsRetrying(false);
        setProgress("");
      }, 2000);

    } catch (e) {
      console.error("Bulk retry failed:", e);
      setProgress(t('searchFailed') || "Search failed");
      setTimeout(() => {
        setIsRetrying(false);
        setProgress("");
      }, 2000);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        disabled={isRetrying || results.length === 0}
        className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        title={t('bulkEditNames') || "Edit all names and retry search"}
      >
        {t('editAllNames') || "✏️ Edit All Names"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="theme-bg-primary rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b theme-border flex justify-between items-center">
          <h3 className="font-semibold theme-text-primary">
            {t('bulkEditNames') || "Bulk Edit Names & Retry Search"}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isRetrying}
            className="theme-text-muted hover:theme-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <p className="text-sm theme-text-muted mb-2">
            {t('bulkEditInstructions') || "Format: folder_name|new_display_name (one per line). Modify names and click Search to retry IGDB matching."}
          </p>
          
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            disabled={isRetrying}
            className="flex-1 min-h-[300px] font-mono text-sm theme-bg-secondary theme-text-primary p-3 rounded-lg border theme-border focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Folder Name|New Display Name&#10;Game Folder|Better Game Name"
          />

          {progress && (
            <div className="mt-2 text-sm text-blue-400 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              {progress}
            </div>
          )}
        </div>

        <div className="p-4 border-t theme-border flex justify-between items-center">
          <div className="text-sm theme-text-muted">
            {results.length} {results.length === 1 ? t('game') : t('games')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isRetrying}
              className="px-4 py-2 text-sm theme-bg-secondary theme-text-primary hover:theme-bg-tertiary rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isRetrying}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isRetrying ? t('searching') : t('searchIgdb')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
