import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import type { ScanResult, MatchCandidate } from "../../types";
import { ResultCard } from "./ResultCard";
import { ResultActions } from "./ResultActions";
import { PlatformSelector } from "./PlatformSelector";
import { BulkNameEditor } from "./BulkNameEditor";
import { useI18n } from "../../i18n";

interface ScanResultsProps {
  results: ScanResult[];
  onSave: (results: ScanResult[]) => void;
  onResultsChange?: (results: ScanResult[]) => void;
  onCreateExclusion?: (folderName: string) => void;
  excludedCount?: number;
  rejectedCount?: number;
  parentCount?: number;
}

export function ScanResults({ results, onSave, onResultsChange, onCreateExclusion, excludedCount = 0, rejectedCount = 0, parentCount = 0 }: ScanResultsProps) {
  const { t } = useI18n();
  const [editableResults, setEditableResults] = useState<ScanResult[]>(results);
  const [showNonMatches, setShowNonMatches] = useState(false);
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [bulkPlatform, setBulkPlatform] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);
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
  
  // Separate included and excluded matches
  const includedMatches = matches.filter((r) => !r.is_excluded);
  const excludedMatches = matches.filter((r) => r.is_excluded);
  
  // Separate non-matches by type
  const rejectedMatches = nonMatches.filter((r) => r.is_rejected);
  const parentFolders = nonMatches.filter((r) => r.is_parent);
  const regularNonMatches = nonMatches.filter((r) => !r.is_rejected && !r.is_parent);

  const handleUpdateDisplayName = useCallback((folderPath: string, newName: string) => {
    setEditableResults((prev) => prev.map((r) => r.folder_path === folderPath ? { ...r, display_name: newName } : r));
  }, []);

  const handleSelectCandidate = useCallback((folderPath: string, candidate: MatchCandidate) => {
    setEditableResults((prev) => prev.map((r) => r.folder_path === folderPath ? {
      ...r, igdb_id: candidate.id, igdb_slug: candidate.slug || null, display_name: candidate.name,
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

  const handleUpdatePlatform = useCallback((folderPath: string, platform: string | null) => {
    setEditableResults((prev) => prev.map((r) => 
      r.folder_path === folderPath ? { ...r, platform } : r
    ));
  }, []);

  const handleApplyPlatformToAll = useCallback(() => {
    if (!bulkPlatform) return;
    
    // Apply platform to all included matched results (Exact or Fuzzy, not excluded)
    setEditableResults((prev) => prev.map((r) => {
      if ((r.match_confidence === "Exact" || r.match_confidence === "Fuzzy") && !r.is_excluded) {
        return { ...r, platform: bulkPlatform };
      }
      return r;
    }));
  }, [bulkPlatform]);

  const handleCreateExclusion = useCallback(async (folderName: string) => {
    try {
      await invoke("add_folder_exclusion", { pattern: folderName.toLowerCase(), isRegex: false });
      setEditableResults((prev) => prev.filter((r) => r.folder_name.toLowerCase() !== folderName.toLowerCase()));
      onCreateExclusion?.(folderName);
    } catch (e) { alert("Failed to create exclusion: " + e); }
  }, [onCreateExclusion]);

  const handleOpenIgdb = useCallback(async (igdbId: number, igdbSlug?: string | null) => {
    const slug = igdbSlug || String(igdbId);
    const url = `https://www.igdb.com/games/${slug}`;
    try { await open(url); } catch { window.open(url, "_blank"); }
  }, []);

  const handleRetrySearch = useCallback(async (folderPath: string, folderName: string, modifiedName: string) => {
    setRetryingId(folderPath);
    try {
      const result = await invoke<ScanResult | null>("retry_igdb_search", {
        folderName: folderName,
        modifiedName: modifiedName,
      });
      
      if (result) {
        // Update the result with new match data
        setEditableResults(prev => prev.map(r => 
          r.folder_path === folderPath 
            ? { ...r, ...result, folder_path: folderPath, folder_name: folderName }
            : r
        ));
      } else {
        alert(t('noMatchFound'));
      }
    } catch (e) {
      alert(t('searchFailed') + ": " + e);
    } finally {
      setRetryingId(null);
    }
  }, [editableResults, t]);

  const handleToggleExclusion = useCallback((folderPath: string) => {
    setEditableResults((prev) => prev.map((r) => 
      r.folder_path === folderPath ? { ...r, is_excluded: !r.is_excluded } : r
    ));
  }, []);

  const handlePromoteResult = useCallback((folderPath: string) => {
    // Promote a rejected or parent result to a Fuzzy match
    setEditableResults((prev) => prev.map((r) => {
      if (r.folder_path === folderPath) {
        // If it has candidates, use the first one as the match
        const bestCandidate = r.candidates[0];
        return {
          ...r,
          match_confidence: "Fuzzy",
          match_source: bestCandidate ? "promoted_from_rejected" : "manual_confirm",
          igdb_id: bestCandidate?.id || r.igdb_id,
          igdb_slug: bestCandidate?.slug || r.igdb_slug,
          display_name: bestCandidate?.name || r.display_name,
          cover_url: bestCandidate?.cover_url || r.cover_url,
          is_rejected: false,
          is_parent: false,
        };
      }
      return r;
    }));
  }, []);

  const handleSave = useCallback(() => {
    // Only save matches that are not excluded
    onSave(editableResults.filter((r) => 
      (r.match_confidence === "Exact" || r.match_confidence === "Fuzzy") && !r.is_excluded
    ));
  }, [editableResults, onSave]);

  if (editableResults.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm items-center flex-wrap">
        <span className="text-green-400">{t('exact')}: {matches.filter(r => r.match_confidence === "Exact").length}</span>
        <span className="text-blue-400">{t('fuzzy')}: {matches.filter(r => r.match_confidence === "Fuzzy").length}</span>
        <span className="theme-text-muted" title={`${t('noMatchFolders')}: ${nonMatches.length}, ${t('excludedFolders')}: ${excludedCount}, ${t('rejectedMatches')}: ${rejectedCount}, ${t('parentFolders')}: ${parentCount}`}>
          {t('noMatch')}: {nonMatches.length + excludedCount + rejectedCount + parentCount}
          {(excludedCount > 0 || rejectedCount > 0 || parentCount > 0) && (
            <span className="text-xs ml-1 opacity-75">({nonMatches.length} + {excludedCount + rejectedCount + parentCount})</span>
          )}
        </span>
        
        {/* Bulk Name Editor Button */}
        <div className="ml-auto">
          <BulkNameEditor 
            results={editableResults}
            onUpdateResults={setEditableResults}
            isRetrying={isBulkRetrying}
            setIsRetrying={setIsBulkRetrying}
          />
        </div>
      </div>

      {/* Bulk Platform Assignment */}
      {includedMatches.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400">{t('setPlatformForAll') || "Set platform for all matched games:"}</span>
          <PlatformSelector
            currentPlatform={bulkPlatform}
            onSelect={setBulkPlatform}
            size="sm"
          />
          <button
            onClick={handleApplyPlatformToAll}
            disabled={!bulkPlatform}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
          >
            {t('applyToAll') || "Apply to all"} 
            <span className="ml-1 text-xs opacity-75">({includedMatches.length})</span>
          </button>
        </div>
      )}

      {/* Included Matches */}
      <div>
        <h3 className="text-sm font-medium theme-text-secondary mb-2">
          {t('matches')} ({includedMatches.length})
          {excludedMatches.length > 0 && (
            <span className="text-xs text-gray-500 ml-2">({excludedMatches.length} {t('excluded').toLowerCase()})</span>
          )}
        </h3>
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {includedMatches.map((r) => (
            <ResultCard key={r.folder_path} result={r} isNonMatch={false}
              isEditing={editingResult === r.folder_path}
              isRetrying={retryingId === r.folder_path}
              onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
              onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
              onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
              onOpenIgdb={handleOpenIgdb} onUpdatePlatform={handleUpdatePlatform}
              onRetrySearch={handleRetrySearch}
              onToggleExclusion={handleToggleExclusion} />
          ))}
        </div>
      </div>

      {/* Excluded Matches Section */}
      {excludedMatches.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            ⚠️ {t('excludedMatches') || "Excluded Matches"} ({excludedMatches.length})
            <span className="text-xs text-gray-600 ml-2">({t('excludedHint') || "Click checkmark to include"})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto opacity-75">
            {excludedMatches.map((r) => (
              <ResultCard key={r.folder_path} result={r} isNonMatch={false}
                isEditing={editingResult === r.folder_path}
                isRetrying={retryingId === r.folder_path}
                onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
                onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
                onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
                onOpenIgdb={handleOpenIgdb} onUpdatePlatform={handleUpdatePlatform}
                onRetrySearch={handleRetrySearch}
                onToggleExclusion={handleToggleExclusion}
                isExcluded={true} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Matches Section - Promotable to Fuzzy */}
      {rejectedMatches.length > 0 && (
        <div className="border-t border-orange-700/50 pt-3">
          <h3 className="text-sm font-medium text-orange-400 mb-2">
            ⚠️ {t('rejectedMatches') || "Rejected Matches"} ({rejectedMatches.length})
            <span className="text-xs text-orange-300/70 ml-2">({t('rejectedHint') || "Distance too high - click ✓ to accept"})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rejectedMatches.map((r) => (
              <ResultCard key={r.folder_path} result={r} isNonMatch={true}
                isEditing={editingResult === r.folder_path}
                isRetrying={retryingId === r.folder_path}
                isRejected={true}
                onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
                onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
                onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
                onOpenIgdb={handleOpenIgdb} onUpdatePlatform={handleUpdatePlatform}
                onRetrySearch={handleRetrySearch}
                onPromote={handlePromoteResult} />
            ))}
          </div>
        </div>
      )}

      {/* Parent Folders Section - Promotable to Fuzzy */}
      {parentFolders.length > 0 && (
        <div className="border-t border-purple-700/50 pt-3">
          <h3 className="text-sm font-medium text-purple-400 mb-2">
            📁 {t('parentFolders') || "Parent Folders"} ({parentFolders.length})
            <span className="text-xs text-purple-300/70 ml-2">({t('parentHint') || "Intermediate folders - click ✓ if they are games"})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {parentFolders.map((r) => (
              <ResultCard key={r.folder_path} result={r} isNonMatch={true}
                isEditing={editingResult === r.folder_path}
                isRetrying={retryingId === r.folder_path}
                isParent={true}
                onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
                onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
                onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
                onOpenIgdb={handleOpenIgdb} onUpdatePlatform={handleUpdatePlatform}
                onRetrySearch={handleRetrySearch}
                onPromote={handlePromoteResult} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Non-Matches (no IGDB match at all) */}
      {regularNonMatches.length > 0 && (
        <div>
          <button onClick={() => setShowNonMatches(!showNonMatches)}
            className="text-sm theme-text-muted hover:text-white flex items-center gap-1">
            {showNonMatches ? "▼" : "▶"} {t('nonMatches')} ({regularNonMatches.length}) - {t('hiddenByDefault')}
          </button>
          {showNonMatches && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {regularNonMatches.map((r) => (
                <ResultCard key={r.folder_path} result={r} isNonMatch={true}
                  isEditing={editingResult === r.folder_path}
                  isRetrying={retryingId === r.folder_path}
                  onUpdateDisplayName={handleUpdateDisplayName} onSelectCandidate={handleSelectCandidate}
                  onConfirmNonMatch={handleConfirmNonMatch} onDelete={handleDeleteResult}
                  onCreateExclusion={handleCreateExclusion} onSetEditing={setEditingResult}
                  onOpenIgdb={handleOpenIgdb} onUpdatePlatform={handleUpdatePlatform}
                  onRetrySearch={handleRetrySearch} />
              ))}
            </div>
          )}
        </div>
      )}

      <ResultActions matches={includedMatches} excludedCount={excludedMatches.length} onSave={handleSave} />
    </div>
  );
}
