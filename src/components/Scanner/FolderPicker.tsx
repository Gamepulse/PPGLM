import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { ScanResult, IgdbCredentials, Game, ConsoleLog, ScanProgress, ScanResultEvent, ExcludedFolderEvent, NoMatchFolderEvent, RejectedMatchEvent, ScannedParentFolderEvent } from "../../types";
import { ScanResults } from "./ScanResults";
import { FolderList } from "./FolderList";
import { ScanControls } from "./ScanControls";
import { IgdbNotConfigured } from "./IgdbNotConfigured";
import { ExcludedFoldersSection } from "./ExcludedFoldersSection";
import { NoMatchFoldersSection } from "./NoMatchFoldersSection";
import { RejectedMatchesSection } from "./RejectedMatchesSection";
import { ScannedParentFoldersSection } from "./ScannedParentFoldersSection";
import { useI18n } from "../../i18n";
import { useConsole } from "../Layout/ConsolePanel";
import { useScanResults } from "../../hooks/useScanResults";

interface FolderPickerProps {
  onNavigate?: (view: string) => void;
  onGamesSaved?: () => void;
}

export function FolderPicker({ onNavigate, onGamesSaved }: FolderPickerProps) {
  const { t } = useI18n();
  const { log: consoleLog, clear: clearConsole } = useConsole();
  const { results, setResults, excludedFolders, addExcludedFolder, noMatchFolders, addNoMatchFolder, rejectedMatches, addRejectedMatch, parentFolders, addParentFolder, scanning, setScanning, progress, setProgress, clearResults } = useScanResults();
  const [folders, setFolders] = useState<{ path: string }[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExcludedSections, setShowExcludedSections] = useState(false);
  const [igdbConfigured, setIgdbConfigured] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const accumulatedResultsRef = useRef<ScanResult[]>([]);
  const unlistenersRef = useRef<UnlistenFn[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => { 
    // Prevent duplicate loading in StrictMode
    if (loadedRef.current) return;
    loadedRef.current = true;
    
    loadScannedFolders(); 
    checkIgdbConfig(); 
    
    // Cleanup listeners when component unmounts
    return () => {
      unlistenersRef.current.forEach((u) => { try { u(); } catch {} });
      unlistenersRef.current = [];
    };
  }, []);

  async function loadScannedFolders() {
    try { 
      const result = await invoke<{ path: string }[]>("get_scanned_folders");
      // Deduplicate folders by path
      const uniqueFolders = result.filter((folder, index, self) => 
        index === self.findIndex((f) => f.path === folder.path)
      );
      setFolders(uniqueFolders); 
    } catch {}
  }

  async function checkIgdbConfig() {
    try {
      setIgdbConfigured((await invoke<IgdbCredentials | null>("get_igdb_credentials")) !== null);
    } catch { setIgdbConfigured(false); }
  }

  if (!igdbConfigured) return <IgdbNotConfigured onNavigate={onNavigate} />;

  const handleAddFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        // Check if folder already exists
        const exists = folders.some(f => f.path === selected);
        if (exists) {
          console.log(`[FolderPicker] Folder already exists: ${selected}`);
          return;
        }
        await invoke("add_scanned_folder", { path: selected });
        setFolders((prev) => [...prev, { path: selected }]);
      }
    } catch {}
  };

  const handleRemoveFolder = async (path: string) => {
    try { await invoke("remove_scanned_folder", { path }); setFolders((prev) => prev.filter((f) => f.path !== path)); } catch {}
  };

  const handleStopScan = async () => {
    if (!scanning || isStopping) return;
    setIsStopping(true);
    try { 
      await invoke("stop_scan"); 
    } catch { 
      setIsStopping(false); 
    } finally {
      // Collapse folders panel when scan is stopped and enable compact mode
      setFoldersCollapsed(true);
      setCompactMode(true);
    }
  };

  const handleScanAll = async () => {
    if (folders.length === 0) return;
    setSaved(false); setScanning(true); setIsStopping(false); setShowResults(false);
    setResults([]); accumulatedResultsRef.current = []; clearConsole(); setProgress(null);
    // Clean up any existing listeners first
    unlistenersRef.current.forEach((u) => { try { u(); } catch {} });
    unlistenersRef.current = [];
    try {
      unlistenersRef.current.push(await listen<ScanProgress>("scan:progress", (e) => setProgress(e.payload)));
      unlistenersRef.current.push(await listen<ScanResultEvent>("scan:result", (e) => {
        accumulatedResultsRef.current.push(e.payload.result);
        setResults((prev) => [...prev, e.payload.result]);
      }));
      unlistenersRef.current.push(await listen<ExcludedFolderEvent>("scan:excluded", (e) => {
        addExcludedFolder(e.payload);
      }));
      unlistenersRef.current.push(await listen<NoMatchFolderEvent>("scan:no_match", (e) => {
        addNoMatchFolder(e.payload);
      }));
      unlistenersRef.current.push(await listen<RejectedMatchEvent>("scan:rejected_match", (e) => {
        addRejectedMatch(e.payload);
      }));
      unlistenersRef.current.push(await listen<ScannedParentFolderEvent>("scan:parent_folder", (e) => {
        addParentFolder(e.payload);
      }));
      unlistenersRef.current.push(await listen<ConsoleLog>("console:log", (e) => {
        const p = e.payload;
        consoleLog(p.level === "ERROR" ? "error" : p.level === "WARN" ? "warn" : "info", `[Scanner] ${p.message}`);
      }));
      unlistenersRef.current.push(await listen("scan:complete", () => {
        setScanning(false);
        setIsStopping(false); // Reset stopping state
        setShowResults(true);
        setShowExcludedSections(results.length === 0); // Show excluded immediately if no games found
        setFoldersCollapsed(true); // Auto-collapse folders when results arrive
        setCompactMode(true); // Enable compact mode to hide depth and shrink button
      }));
      unlistenersRef.current.push(await listen("scan:cancelled", () => {
        setScanning(false);
        setIsStopping(false); // Reset stopping state
        setFoldersCollapsed(true); // Auto-collapse folders when scan is cancelled
        setCompactMode(true); // Enable compact mode
      }));
      await invoke("scan_folders_smart", { paths: folders.map((f) => f.path) });
    } catch {} finally {
      setScanning(false); setIsStopping(false);
      unlistenersRef.current.forEach((u) => { try { u(); } catch {} });
      unlistenersRef.current = [];
    }
  };

  const handleSave = async (matchedResults: ScanResult[]) => {
    if (matchedResults.length === 0) return;
    setSaving(true);
    try {
      await invoke<Game[]>("save_scan_results", { results: matchedResults });
      setSaved(true); 
      setShowExcludedSections(true); // Show excluded sections after saving
      clearResults(); 
      setShowResults(false); 
      onGamesSaved?.();
    } catch (e) { alert("Failed to save games: " + e); } finally { setSaving(false); }
  };

  return (
    <div className={`${compactMode ? 'p-2 space-y-2' : 'p-6 space-y-6'}`}>
      {/* Collapsible Folder List */}
      <div className={`theme-bg-secondary rounded-lg transition-all duration-300 ${compactMode ? 'p-2' : foldersCollapsed ? 'p-3' : 'p-4'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className={`font-bold theme-text-primary ${compactMode ? 'text-base' : foldersCollapsed ? 'text-lg' : 'text-2xl'}`}>
              {t('scanner')}
            </h2>
            {foldersCollapsed && (
              <span className={`theme-text-muted ${compactMode ? 'text-xs' : 'text-sm'}`}>
                ({folders.length} {folders.length === 1 ? 'folder' : 'folders'})
              </span>
            )}
          </div>
          <button
            onClick={() => {
              const newCollapsed = !foldersCollapsed;
              setFoldersCollapsed(newCollapsed);
              // Enable compact mode when collapsing, disable when expanding
              setCompactMode(newCollapsed);
            }}
            className={`rounded-lg theme-bg-tertiary theme-text-secondary hover:theme-text-primary transition-colors ${compactMode ? 'p-1 text-xs' : 'p-2'}`}
            title={foldersCollapsed ? t('expand') : t('collapse')}
          >
            {foldersCollapsed ? '▼' : '▲'}
          </button>
        </div>
        
        {!foldersCollapsed && (
          <div className={compactMode ? 'mt-1' : 'mt-3'}>
            <FolderList 
              folders={folders} 
              onAddFolder={handleAddFolder} 
              onRemoveFolder={handleRemoveFolder} 
              onGamesDeleted={onGamesSaved} 
            />
          </div>
        )}
      </div>
      <ScanControls scanning={scanning} isStopping={isStopping} hasFolders={folders.length > 0}
        resultCount={results.length} progress={progress} onScan={handleScanAll} onStop={handleStopScan} 
        compact={compactMode} />
      {(showResults || results.length > 0) && !scanning && (
        <div className={`theme-border border-t ${compactMode ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold theme-text-primary ${compactMode ? 'text-base' : 'text-lg'}`}>{t('scanResults')} ({results.length} {t('games')})</h3>
            <div className="flex items-center gap-3">
              {saving && <span className="text-blue-400 text-sm">{t('saving')}</span>}
              {saved && <span className="text-green-400 text-sm">✓ {t('saved')}</span>}
              <button
                onClick={() => { if (confirm(t('clearScanResultsConfirm') || 'Clear all scan results?')) { clearResults(); setShowResults(false); } }}
                className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
              >
                {t('clearResults') || 'Clear Results'}
              </button>
            </div>
          </div>
          {results.length === 0 ? (
            <p className="theme-text-muted">{t('noGamesFound')}</p>
          ) : (
            <ScanResults 
              results={results} 
              onSave={handleSave} 
              onResultsChange={setResults} 
              onCreateExclusion={() => {}}
              excludedCount={excludedFolders.length}
              rejectedCount={rejectedMatches.length}
              parentCount={parentFolders.length}
            />
          )}
        </div>
      )}
      
      {/* Show excluded sections button (when games found but not yet saved) */}
      {!scanning && results.length > 0 && !saved && !showExcludedSections && (
        (excludedFolders.length > 0 || noMatchFolders.length > 0 || rejectedMatches.length > 0 || parentFolders.length > 0) && (
          <button
            onClick={() => setShowExcludedSections(true)}
            className="w-full py-2 text-sm text-gray-400 hover:text-white theme-bg-secondary rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {t('showExcludedFolders') || `Show excluded folders (${excludedFolders.length + noMatchFolders.length + rejectedMatches.length + parentFolders.length})`}
          </button>
        )
      )}

      {/* Excluded Folders Section */}
      {excludedFolders.length > 0 && !scanning && (showExcludedSections || results.length === 0) && (
        <ExcludedFoldersSection 
          excludedFolders={excludedFolders} 
          compact={compactMode}
          onAddToResults={(newResult) => {
            // Add the found result to the main results list
            setResults(prev => [...prev, newResult]);
            // Optionally remove from excluded list
            // setExcludedFolders(prev => prev.filter(f => f.folder_path !== newResult.folder_path));
          }}
        />
      )}
      
      {/* No Match Folders Section */}
      {noMatchFolders.length > 0 && !scanning && (showExcludedSections || results.length === 0) && (
        <NoMatchFoldersSection 
          noMatchFolders={noMatchFolders} 
          compact={compactMode}
        />
      )}
      
      {/* Rejected Matches Section */}
      {rejectedMatches.length > 0 && !scanning && (showExcludedSections || results.length === 0) && (
        <RejectedMatchesSection 
          rejectedMatches={rejectedMatches} 
          compact={compactMode}
        />
      )}
      
      {/* Parent Folders Section */}
      {parentFolders.length > 0 && !scanning && (showExcludedSections || results.length === 0) && (
        <ScannedParentFoldersSection 
          parentFolders={parentFolders} 
          compact={compactMode}
        />
      )}
    </div>
  );
}
