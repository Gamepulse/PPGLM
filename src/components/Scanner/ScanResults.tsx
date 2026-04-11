import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import type { ScanResult, MatchCandidate } from "../../types";
import { ResultCard } from "./ResultCard";
import { ResultActions } from "./ResultActions";
import { PlatformSelector } from "./PlatformSelector";
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
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [bulkPlatform, setBulkPlatform] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'excluded' | 'parents'>('matches');
  const [collapsedSections, setCollapsedSections] = useState({
    matches: false,
    excluded: false,
    rejected: false,
    parents: false,
    nonMatches: false,
  });
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

  const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSave = useCallback(() => {
    // Only save matches that are not excluded
    const savedResults = editableResults.filter((r) => 
      (r.match_confidence === "Exact" || r.match_confidence === "Fuzzy") && !r.is_excluded
    );
    
    // Remove saved results from editableResults
    const savedPaths = new Set(savedResults.map(r => r.folder_path));
    setEditableResults(prev => prev.filter(r => !savedPaths.has(r.folder_path)));
    
    // Call parent's onSave
    onSave(savedResults);
    
    // After saving, automatically switch to the next tab with remaining items
    // Calculate based on what will remain after filtering
    const remainingExcluded = excludedMatches.filter(r => !savedPaths.has(r.folder_path));
    const remainingRejected = rejectedMatches.filter(r => !savedPaths.has(r.folder_path));
    const remainingParents = parentFolders.filter(r => !savedPaths.has(r.folder_path));
    const remainingNonMatches = regularNonMatches.filter(r => !savedPaths.has(r.folder_path));
    
    const hasExcludedRemaining = remainingExcluded.length > 0 || remainingRejected.length > 0;
    const hasParentsRemaining = remainingParents.length > 0 || remainingNonMatches.length > 0;
    
    if (hasExcludedRemaining) {
      setActiveTab('excluded');
      // Auto-expand the sections in the excluded tab
      setCollapsedSections(prev => ({ ...prev, excluded: false, rejected: false }));
    } else if (hasParentsRemaining) {
      setActiveTab('parents');
      // Auto-expand the sections in the parents tab
      setCollapsedSections(prev => ({ ...prev, parents: false, nonMatches: false }));
    }
    // If no more items in any tab, stay on current tab (will show empty state)
  }, [editableResults, onSave, excludedMatches, rejectedMatches, parentFolders, regularNonMatches]);

  if (editableResults.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="flex gap-4 text-sm items-center flex-wrap">
        <span className="text-green-400">{t('exact')}: {matches.filter(r => r.match_confidence === "Exact").length}</span>
        <span className="text-blue-400">{t('fuzzy')}: {matches.filter(r => r.match_confidence === "Fuzzy").length}</span>
        <span className="theme-text-muted" title={`${t('noMatchFolders')}: ${nonMatches.length}, ${t('excludedFolders')}: ${excludedCount}, ${t('rejectedMatches')}: ${rejectedCount}, ${t('parentFolders')}: ${parentCount}`}>
          {t('noMatch')}: {nonMatches.length + excludedCount + rejectedCount + parentCount}
          {(excludedCount > 0 || rejectedCount > 0 || parentCount > 0) && (
            <span className="text-xs ml-1 opacity-75">({nonMatches.length} + {excludedCount + rejectedCount + parentCount})</span>
          )}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg">
        {[
          { id: 'matches', label: t('matches') || 'Correspondances', count: includedMatches.length, color: 'bg-green-600' },
          { id: 'excluded', label: t('excluded') || 'Exclus', count: excludedMatches.length + rejectedMatches.length, color: 'bg-gray-600' },
          { id: 'parents', label: t('parentFolders') || 'Dossiers parents', count: parentFolders.length + regularNonMatches.length, color: 'bg-purple-600' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
            <span>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Platform Assignment - Only show in Matches tab */}
      {activeTab === 'matches' && includedMatches.length > 0 && (
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

      {/* TAB: Matches */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {/* Included Matches - Collapsible */}
          {includedMatches.length > 0 && (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('matches')}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-between transition-colors"
              >
                <h3 className="text-sm font-medium theme-text-secondary flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('matches')} ({includedMatches.length})
                </h3>
                <span className="text-gray-400">{collapsedSections.matches ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections.matches && (
                <div className="p-3 space-y-2 max-h-[32rem] overflow-y-auto">
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
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Excluded */}
      {activeTab === 'excluded' && (
        <div className="space-y-3">
          {/* Excluded Matches Section - Collapsible */}
          {excludedMatches.length > 0 && (
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('excluded')}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-between transition-colors"
              >
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <span>⚠️</span>
                  {t('excludedMatches') || "Correspondances exclues"} ({excludedMatches.length})
                  <span className="text-xs text-gray-500">({t('excludedHint') || "Cliquez ✓ pour inclure"})</span>
                </h3>
                <span className="text-gray-400">{collapsedSections.excluded ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections.excluded && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto opacity-75">
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
              )}
            </div>
          )}

          {/* Rejected Matches Section - Collapsible */}
          {rejectedMatches.length > 0 && (
            <div className="border border-orange-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('rejected')}
                className="w-full px-4 py-3 bg-orange-900/20 hover:bg-orange-900/30 flex items-center justify-between transition-colors"
              >
                <h3 className="text-sm font-medium text-orange-400 flex items-center gap-2">
                  <span>⚠️</span>
                  {t('rejectedMatches') || "Correspondances rejetées"} ({rejectedMatches.length})
                  <span className="text-xs text-orange-300/70">({t('rejectedHint') || "Distance trop élevée - cliquez ✓ pour accepter"})</span>
                </h3>
                <span className="text-orange-400">{collapsedSections.rejected ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections.rejected && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
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
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Parents */}
      {activeTab === 'parents' && (
        <div className="space-y-3">
          {/* Parent Folders Section - Collapsible */}
          {parentFolders.length > 0 && (
            <div className="border border-purple-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('parents')}
                className="w-full px-4 py-3 bg-purple-900/20 hover:bg-purple-900/30 flex items-center justify-between transition-colors"
              >
                <h3 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                  <span>📁</span>
                  {t('parentFolders') || "Dossiers parents"} ({parentFolders.length})
                  <span className="text-xs text-purple-300/70">({t('parentHint') || "Dossiers intermédiaires - cliquez ✓ si ce sont des jeux"})</span>
                </h3>
                <span className="text-purple-400">{collapsedSections.parents ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections.parents && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
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
              )}
            </div>
          )}

          {/* Regular Non-Matches - Collapsible */}
          {regularNonMatches.length > 0 && (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('nonMatches')}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-between transition-colors"
              >
                <h3 className="text-sm font-medium theme-text-muted flex items-center gap-2">
                  <span>❓</span>
                  {t('nonMatches') || "Sans correspondance"} ({regularNonMatches.length})
                  <span className="text-xs text-gray-500">({t('hiddenByDefault') || "Aucune correspondance IGDB"})</span>
                </h3>
                <span className="text-gray-400">{collapsedSections.nonMatches ? '▶' : '▼'}</span>
              </button>
              {!collapsedSections.nonMatches && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
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
        </div>
      )}

      <ResultActions matches={includedMatches} excludedCount={excludedMatches.length} onSave={handleSave} />
    </div>
  );
}
