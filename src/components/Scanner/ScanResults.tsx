import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import type { ScanResult, MatchCandidate } from "../../types";
import { ResultCard } from "./ResultCard";
import { ResultActions } from "./ResultActions";
import { useI18n } from "../../i18n";

interface ScanResultsProps {
  results: ScanResult[];
  onSave: (results: ScanResult[]) => void;
  onResultsChange?: (results: ScanResult[]) => void;
  onCreateExclusion?: (folderName: string) => void;
}

export function ScanResults({ results, onSave, onResultsChange, onCreateExclusion }: ScanResultsProps) {
  const { t } = useI18n();
  const [editableResults, setEditableResults] = useState<ScanResult[]>(results);
  const [showNonMatches, setShowNonMatches] = useState(false);
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const prevResultsRef = useRef<ScanResult[]>(results);

  useEffect(() => {
    if (results !== prevResultsRef.current) {
      setEditableResults(results);
      prevResultsRef.current = results;
    }
  }, [results]);

  useEffect(() => {
    if (onResultsChange && editableResults !== prevResultsRef.current) {
      onResultsChange(editableResults);
      prevResultsRef.current = editableResults;
    }
  }, [editableResults, onResultsChange]);

  const matches = editableResults.filter((r) => r.match_confidence === "Exact" || r.match_confidence === "Fuzzy");
  const nonMatches = editableResults.filter((r) => r.match_confidence === "None");

  const handleUpdateDisplayName = useCallback((folderPath: string, newName: string) => {
    setEditableResults((prev) => prev.map((r) => r.folder_path === folderPath ? { ...r, display_name: newName } : r));
  }, []);

  const handleSelectCandidate = useCallback((folderPath: string, candidate: MatchCandidate) => {
    setEditableResults((prev) => prev.map((r) => r.folder_path === folderPath ? {
      ...r, igdb_id: candidate.id, display_name: candidate.name,
      match_confidence: candidate.distance === 0 ? "Exact" : "Fuzzy",
      match_source: candidate.distance === 0 ? "igdb_exact" : "igdb_fuzzy",
    } : r));
    setEditingResult(null);
  }, []);

  const handleConfirmNonMatch = useCallback((folderPath: string) => {
    setEditableResults((prev) => prev.map((r) => r.folder_path === folderPath
      ? { ...r, match_confidence: "Fuzzy", match_source: "manual_confirm" } : r));
  }, []);

  const handleDeleteResult = useCallback((folderPath: string) => {
    setEditableResults((prev) => prev.filter((r) => r.folder_path !== folderPath));
  }, []);

  const handleCreateExclusion = useCallback(async (folderName: string) => {
    try {
      await invoke("add_folder_exclusion", { pattern: folderName.toLowerCase(), isRegex: false });
      setEditableResults((prev) => prev.filter((r) => r.folder_name.toLowerCase() !== folderName.toLowerCase()));
      onCreateExclusion?.(folderName);
    } catch (e) { alert("Failed to create exclusion: " + e); }
  }, [onCreateExclusion]);

  const handleOpenIgdb = useCallback(async (igdbId: number) => {
    const url = `https://www.igdb.com/games/${igdbId}`;
    try { await open(url); } catch { window.open(url, "_blank"); }
  }, []);

  const handleSave = useCallback(() => {
    onSave(editableResults.filter((r) => r.match_confidence === "Exact" || r.match_confidence === "Fuzzy"));
  }, [editableResults, onSave]);

  if (editableResults.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <span className="text-green-400">{t('exact')}: {matches.filter(r => r.match_confidence === "Exact").length}</span>
        <span className="text-blue-400">{t('fuzzy')}: {matches.filter(r => r.match_confidence === "Fuzzy").length}</span>
        <span className="theme-text-muted">{t('noMatch')}: {nonMatches.length}</span>
      </div>

      <div>
        <h3 className="text-sm font-medium theme-text-secondary mb-2">{t('matches')} ({matches.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matches.map((r) => (
            <ResultCard key={r.folder_path} result={r} isNonMatch={false}
              isEditing={editingResult === r.folder_path}
              onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
              onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
              onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
              onOpenIgdb={handleOpenIgdb} />
          ))}
        </div>
      </div>

      {nonMatches.length > 0 && (
        <div>
          <button onClick={() => setShowNonMatches(!showNonMatches)}
            className="text-sm theme-text-muted hover:text-white flex items-center gap-1">
            {showNonMatches ? "▼" : "▶"} {t('nonMatches')} ({nonMatches.length}) - {t('hiddenByDefault')}
          </button>
          {showNonMatches && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {nonMatches.map((r) => (
                <ResultCard key={r.folder_path} result={r} isNonMatch={true}
                  isEditing={editingResult === r.folder_path}
                  onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
                  onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
                  onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
                  onOpenIgdb={handleOpenIgdb} />
              ))}
            </div>
          )}
        </div>
      )}

      <ResultActions matches={matches} onSave={handleSave} />
    </div>
  );
}
