import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import type { ScanResult, MatchCandidate } from "../../types";
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

  // Sync with parent results when they change (from external source, not from our callback)
  useEffect(() => {
    // Only update if results actually changed from parent
    if (results !== prevResultsRef.current) {
      setEditableResults(results);
      prevResultsRef.current = results;
    }
  }, [results]);

  // Notify parent when results change locally (user actions like delete, edit)
  // We compare editableResults with prevResultsRef to detect local changes
  useEffect(() => {
    if (onResultsChange && editableResults !== prevResultsRef.current) {
      onResultsChange(editableResults);
      prevResultsRef.current = editableResults;
    }
  }, [editableResults, onResultsChange]);

  // Separate matches from non-matches
  const matches = editableResults.filter(
    (r) => r.match_confidence === "Exact" || r.match_confidence === "Fuzzy"
  );
  const nonMatches = editableResults.filter(
    (r) => r.match_confidence === "None"
  );

  const badgeColor = (confidence: string) => {
    switch (confidence) {
      case "Exact":
        return "bg-green-600";
      case "Fuzzy":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const handleUpdateDisplayName = useCallback((folderPath: string, newName: string) => {
    setEditableResults((prev) =>
      prev.map((r) =>
        r.folder_path === folderPath ? { ...r, display_name: newName } : r
      )
    );
  }, []);

  const handleSelectCandidate = useCallback((folderPath: string, candidate: MatchCandidate) => {
    setEditableResults((prev) =>
      prev.map((r) =>
        r.folder_path === folderPath
          ? {
              ...r,
              igdb_id: candidate.id,
              display_name: candidate.name,
              match_confidence: candidate.distance === 0 ? "Exact" : "Fuzzy",
              match_source: candidate.distance === 0 ? "igdb_exact" : "igdb_fuzzy",
            }
          : r
      )
    );
    setEditingResult(null);
  }, []);

  const handleConfirmNonMatch = useCallback((folderPath: string) => {
    setEditableResults((prev) =>
      prev.map((r) =>
        r.folder_path === folderPath
          ? { ...r, match_confidence: "Fuzzy", match_source: "manual_confirm" }
          : r
      )
    );
  }, []);

  const handleDeleteResult = useCallback((folderPath: string) => {
    setEditableResults((prev) => prev.filter((r) => r.folder_path !== folderPath));
  }, []);

  const handleCreateExclusionFromResult = useCallback(async (folderName: string) => {
    try {
      await invoke("add_folder_exclusion", { pattern: folderName.toLowerCase(), isRegex: false });
      // Remove all results with this folder name
      setEditableResults((prev) => prev.filter((r) => r.folder_name.toLowerCase() !== folderName.toLowerCase()));
      // Notify parent
      onCreateExclusion?.(folderName);
    } catch (e) {
      console.error("Failed to create exclusion:", e);
      alert("Failed to create exclusion: " + e);
    }
  }, [onCreateExclusion]);

  const handleOpenIgdbPage = useCallback(async (igdbId: number) => {
    const url = `https://www.igdb.com/games/${igdbId}`;
    try {
      await open(url);
    } catch (e) {
      console.error("Failed to open IGDB page:", e);
      // Fallback to window.open if shell fails
      window.open(url, "_blank");
    }
  }, []);

  const handleSave = useCallback(() => {
    // Only save matches (Exact or Fuzzy), not non-matches
    const matchesToSave = editableResults.filter(
      (r) => r.match_confidence === "Exact" || r.match_confidence === "Fuzzy"
    );
    onSave(matchesToSave);
  }, [editableResults, onSave]);

  const renderResultCard = (result: ScanResult, isNonMatch: boolean) => (
    <div
      key={result.folder_path}
      className={`p-3 rounded-lg theme-border border ${
        isNonMatch ? "theme-bg-secondary border-gray-700" : "theme-bg-tertiary border-gray-600"
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {result.cover_url ? (
            <img
              src={result.cover_url}
              alt={result.display_name}
              className="w-16 h-20 object-cover rounded shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-16 h-20 bg-gray-700 rounded flex items-center justify-center theme-text-muted text-xl ${
              result.cover_url ? "hidden" : ""
            }`}
          >
            🎮
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {editingResult === result.folder_path ? (
                <input
                  type="text"
                  value={result.display_name}
                  onChange={(e) => handleUpdateDisplayName(result.folder_path, e.target.value)}
                  onBlur={() => setEditingResult(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingResult(null);
                  }}
                  className="w-full px-2 py-1 bg-gray-700 theme-text-primary rounded theme-border border focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="theme-text-primary font-medium cursor-pointer hover:text-blue-400"
                    onClick={() => setEditingResult(result.folder_path)}
                    title={t('clickToEdit')}
                  >
                    {result.display_name}
                  </p>
                  <span className="theme-text-muted text-xs">({result.folder_name})</span>
                </div>
              )}
              <p className="theme-text-muted text-xs truncate">{result.folder_path}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {/* IGDB Link Button for matches */}
              {result.igdb_id && (
                <button
                  onClick={() => handleOpenIgdbPage(result.igdb_id!)}
                  title={t('viewOnIgdb')}
                  className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50 transition-colors"
                >
                  IGDB ↗
                </button>
              )}
              <span
                className={`px-2 py-1 text-xs rounded-full ${badgeColor(
                  result.match_confidence
                )} text-white whitespace-nowrap`}
              >
                {result.match_confidence === "None" ? t('noMatch') : result.match_confidence}
              </span>
              {/* Exclude Button - add folder name to exclusion patterns */}
              <button
                onClick={() => {
                  if (confirm(t('confirmExclusion').replace('{{name}}', result.folder_name))) {
                    handleCreateExclusionFromResult(result.folder_name);
                  }
                }}
                title={t('addToExclusionPatterns')}
                className="text-yellow-500 hover:text-yellow-400 p-1 transition-colors"
              >
                🚫
              </button>
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteResult(result.folder_path)}
                title={t('removeFromResults')}
                className="theme-text-muted hover:text-red-400 p-1 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Candidates for fuzzy matches */}
          {result.candidates.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs theme-text-muted">
                {result.match_confidence === "None" ? t('possibleMatches') : t('otherCandidates')}
              </p>
              {result.candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(result.folder_path, candidate)}
                  className={`flex items-center gap-2 text-xs pl-2 py-1 rounded w-full text-left transition-colors ${
                    candidate.id === result.igdb_id
                      ? "bg-green-900 text-green-200"
                      : "theme-text-secondary hover:bg-gray-700"
                  }`}
                >
                  {candidate.cover_url ? (
                    <img
                      src={candidate.cover_url}
                      alt=""
                      className="w-6 h-8 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="w-6 h-8 bg-gray-700 rounded flex items-center justify-center text-[10px] flex-shrink-0">
                      🎮
                    </span>
                  )}
                  <span className="truncate">
                    {candidate.name} ({t('distance')}: {candidate.distance})
                    {candidate.id === result.igdb_id && " ✓"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Show IGDB info for matches */}
          {(result.match_confidence === "Exact" || result.match_confidence === "Fuzzy") && result.igdb_id && (
            <div className="mt-2 text-xs text-green-400">
              ✓ {t('matchedWithIgdb')} {result.igdb_id}
            </div>
          )}

          {/* Manual confirm button for non-matches */}
          {result.match_confidence === "None" && (
            <button
              onClick={() => handleConfirmNonMatch(result.folder_path)}
              className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              {t('confirmAsMatch')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (editableResults.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Stats Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-400">{t('exact')}: {editableResults.filter(r => r.match_confidence === "Exact").length}</span>
        <span className="text-blue-400">{t('fuzzy')}: {editableResults.filter(r => r.match_confidence === "Fuzzy").length}</span>
        <span className="theme-text-muted">{t('noMatch')}: {editableResults.filter(r => r.match_confidence === "None").length}</span>
      </div>

      {/* Matches Section */}
      <div>
        <h3 className="text-sm font-medium theme-text-secondary mb-2">
          {t('matches')} ({matches.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matches.map((r) => renderResultCard(r, false))}
        </div>
      </div>

      {/* Non-Matches Section */}
      {nonMatches.length > 0 && (
        <div>
          <button
            onClick={() => setShowNonMatches(!showNonMatches)}
            className="text-sm theme-text-muted hover:text-white flex items-center gap-1"
          >
            {showNonMatches ? "▼" : "▶"} {t('nonMatches')} ({nonMatches.length}) - {t('hiddenByDefault')}
          </button>
          {showNonMatches && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {nonMatches.map((r) => renderResultCard(r, true))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2 theme-border border-t">
        <p className="text-xs theme-text-muted mb-2">
          {t('onlyMatchedSaved').replace('{{count}}', String(matches.length))}
        </p>
        <button
          onClick={handleSave}
          disabled={matches.length === 0}
          className={`w-full py-2 rounded-lg transition-colors ${
            matches.length === 0
              ? "bg-gray-600 theme-text-muted cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {t('addMatchedGames').replace('{{count}}', String(matches.length))}
        </button>
      </div>
    </div>
  );
}
