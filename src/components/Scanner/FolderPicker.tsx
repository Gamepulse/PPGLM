import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { ScanResult, IgdbCredentials, Game } from "../../types";
import { ScanResults } from "./ScanResults";
import { useI18n } from "../../i18n";

interface FolderPickerProps {
  onNavigate?: (view: string) => void;
  onGamesSaved?: () => void;
}

interface ConsoleLog {
  timestamp: string;
  level: string;
  message: string;
}

interface ScanProgressData {
  folders_scanned: number;
  games_found: number;
  current_path: string;
  operation: string;
}

interface ScanResultEvent {
  result: ScanResult;
  total_found: number;
}

export function FolderPicker({ onNavigate, onGamesSaved }: FolderPickerProps) {
  const { t } = useI18n();
  const [folders, setFolders] = useState<{ path: string }[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [igdbConfigured, setIgdbConfigured] = useState(false);
  const [progress, setProgress] = useState<ScanProgressData | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [consoleMinimized, setConsoleMinimized] = useState(false);
  
  // Use ref to accumulate results during scan
  const accumulatedResultsRef = useRef<ScanResult[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-minimize console when scan completes
  useEffect(() => {
    if (!scanning && consoleLogs.length > 0) {
      setConsoleMinimized(true);
    }
  }, [scanning, consoleLogs.length]);

  useEffect(() => {
    loadScannedFolders();
    checkIgdbConfig();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  async function loadScannedFolders() {
    try {
      const folders = await invoke<{ path: string }[]>("get_scanned_folders");
      setFolders(folders);
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  }

  async function checkIgdbConfig() {
    try {
      const creds = await invoke<IgdbCredentials | null>("get_igdb_credentials");
      setIgdbConfigured(creds !== null);
    } catch (error) {
      console.error("Failed to check IGDB config:", error);
      setIgdbConfigured(false);
    }
  }

  if (!igdbConfigured) {
    return (
      <div className="p-6 theme-bg-secondary rounded-lg">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-semibold theme-text-primary">{t('igdbNotConfigured')}</h3>
            <p className="theme-text-muted text-sm mt-1">
              {t('igdbNotConfiguredDesc')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate?.("settings")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {t('openSettings')}
        </button>
      </div>
    );
  }

  const handleAddFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        await invoke("add_scanned_folder", { path: selected });
        setFolders((prev) => [...prev, { path: selected }]);
      }
    } catch (e) {
      console.error("Failed to select folder:", e);
    }
  };

  const handleRemoveFolder = async (path: string) => {
    try {
      await invoke("remove_scanned_folder", { path });
      setFolders((prev) => prev.filter((f) => f.path !== path));
    } catch (e) {
      console.error("Failed to remove folder:", e);
    }
  };

  const handleStopScan = async () => {
    if (!scanning || isStopping) return;
    
    setIsStopping(true);
    console.log("Stopping scan...");
    
    try {
      await invoke("stop_scan");
      console.log("Stop scan command sent");
    } catch (e) {
      console.error("Failed to stop scan:", e);
      setIsStopping(false);
    }
  };

  const handleScanAll = async () => {
    if (folders.length === 0) return;
    
    // Reset states
    setSaved(false);
    setScanning(true);
    setIsStopping(false);
    setShowResults(false);
    setResults([]);
    accumulatedResultsRef.current = [];
    setConsoleLogs([]);
    setProgress(null);

    const unlisteners: UnlistenFn[] = [];

    try {
      // Listen for progress events
      const unlistenProgress = await listen<ScanProgressData>("scan:progress", (event) => {
        setProgress(event.payload);
      });
      unlisteners.push(unlistenProgress);

      // Listen for scan results - accumulate in ref
      const unlistenResult = await listen<ScanResultEvent>("scan:result", (event) => {
        const newResult = event.payload.result;
        accumulatedResultsRef.current.push(newResult);
        // Also update UI
        setResults((prev) => [...prev, newResult]);
      });
      unlisteners.push(unlistenResult);

      // Listen for console logs
      const unlistenConsole = await listen<ConsoleLog>("console:log", (event) => {
        setConsoleLogs((prev) => [...prev.slice(-50), event.payload]);
      });
      unlisteners.push(unlistenConsole);

      // Wait for scan completion or cancellation
      await new Promise<void>((resolve, reject) => {
        const unlistenComplete = listen("scan:complete", () => {
          resolve();
        });
        unlisteners.push(() => unlistenComplete.then((fn) => fn()));
        
        const unlistenCancelled = listen("scan:cancelled", () => {
          console.log("Scan was cancelled by user");
          resolve(); // Resolve gracefully on cancellation
        });
        unlisteners.push(() => unlistenCancelled.then((fn) => fn()));

        // Start the smart scan (scan + match combined with early exit)
        const paths = folders.map((f) => f.path);
        invoke("scan_folders_smart", { paths }).catch((e) => {
          reject(e);
        });
      });

      // Scan completed or was cancelled - results already matched!
      setScanning(false);
      
      const scannedResults = accumulatedResultsRef.current;
      console.log("Smart scan finished, found", scannedResults.length, "games");

      if (scannedResults.length > 0) {
        setShowResults(true);
      } else {
        console.log("No games found during scan");
        setShowResults(true);
      }
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
      setIsStopping(false);
      // Cleanup all listeners
      unlisteners.forEach((unlisten) => {
        try {
          unlisten();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    }
  };

  const handleSave = async (matchedResults: ScanResult[]) => {
    console.log("[handleSave] Called with", matchedResults.length, "results");
    console.log("[handleSave] First result:", matchedResults[0]);
    
    if (matchedResults.length === 0) {
      console.error("[handleSave] ERROR: No results to save!");
      return;
    }
    
    setSaving(true);
    try {
      console.log("[handleSave] Calling save_scan_results...");
      const savedGames = await invoke<Game[]>("save_scan_results", { results: matchedResults });
      console.log("[handleSave] SUCCESS: Saved", savedGames.length, "games");
      console.log("[handleSave] Saved games:", savedGames);
      setSaved(true);
      setResults([]);
      setShowResults(false);
      // Notify parent that games were saved
      console.log("[handleSave] Calling onGamesSaved callback...");
      onGamesSaved?.();
    } catch (e) {
      console.error("[handleSave] FAILED:", e);
      alert("Failed to save games: " + e);
    } finally {
      setSaving(false);
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "SUCCESS": return "text-green-400";
      case "ERROR": return "text-red-400";
      case "WARN": return "text-yellow-400";
      case "DEBUG": return "theme-text-muted";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Folder management */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold theme-text-primary">{t('scanFolders')}</h2>
        <button
          onClick={handleAddFolder}
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
              onClick={() => handleRemoveFolder(folder.path)}
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

      {/* Scan / Stop Button */}
      <div className="flex gap-2">
        <button
          onClick={handleScanAll}
          disabled={folders.length === 0 || scanning}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold relative overflow-hidden"
        >
          {scanning && !isStopping && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {scanning ? (
              isStopping ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('stopping')}
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('scanningSmart')} {progress && `(${progress.folders_scanned} ${t('foldersChecked')}, ${results.length} ${t('gamesFound')})`}
                </>
              )
            ) : (
              t('scanAllFolders')
            )}
          </span>
        </button>
        
        {scanning && (
          <button
            onClick={handleStopScan}
            disabled={isStopping}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isStopping ? t('stopping') : t('stop')}
          </button>
        )}
      </div>

      {/* Animation Under Button */}
      {scanning && (
        <div className="space-y-2">
          <div className="relative h-2 theme-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-shimmer"
              style={{ 
                width: scanning ? "60%" : "100%",
                animation: "shimmer 2s infinite linear"
              }}
            />
          </div>
          
          {progress?.current_path && (
            <p className="text-xs theme-text-muted font-mono truncate animate-pulse">
              → {progress.current_path}
            </p>
          )}
        </div>
      )}

      {/* Real-time Results Counter During Scan */}
      {scanning && results.length > 0 && (
        <div className="text-sm theme-text-muted">
          {t('gamesFound')} <span className="theme-text-primary font-semibold">{results.length}</span> {t('potentialGamesFound')}
        </div>
      )}

      {/* Console Output - Minimized by default when scan completes */}
      {consoleLogs.length > 0 && (
        <div className={`bg-gray-950 rounded-lg theme-border overflow-hidden transition-all duration-200 ${consoleMinimized ? 'h-auto' : ''}`}>
          <div 
            className="flex items-center justify-between px-3 py-2 theme-bg-secondary theme-border border-b cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => setConsoleMinimized(!consoleMinimized)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs theme-text-muted">{consoleMinimized ? '▶' : '▼'}</span>
              <span className="text-xs font-medium theme-text-muted">{t('consoleOutput')}</span>
            </div>
            <span className="text-xs theme-text-muted">{consoleLogs.length} {t('messages')}</span>
          </div>
          {!consoleMinimized && (
            <div className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1">
              {consoleLogs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="theme-text-muted">[{log.timestamp}]</span>
                  <span className={getLogColor(log.level)}>[{log.level}]</span>
                  <span className="theme-text-secondary">{log.message}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Results - Show when scanning is done or when we have results */}
      {(showResults || results.length > 0) && !scanning && (
        <div className="space-y-4 theme-border border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold theme-text-primary">
              {t('scanResults')} ({results.length} {t('games')})
            </h3>
            {saving && <span className="text-blue-400 text-sm">{t('saving')}</span>}
            {saved && <span className="text-green-400 text-sm">✓ {t('saved')}</span>}
          </div>
          
          {results.length === 0 ? (
            <p className="theme-text-muted">{t('noGamesFound')}</p>
          ) : (
            <ScanResults 
              results={results} 
              onSave={handleSave}
              onResultsChange={setResults}
              onCreateExclusion={(folderName) => {
                console.log(`[FolderPicker] Added "${folderName}" to exclusions`);
                // Refresh the exclusions list if needed
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
