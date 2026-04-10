import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { ScanResult, IgdbCredentials, Game, ConsoleLog, ScanProgress, ScanResultEvent } from "../../types";
import { ScanResults } from "./ScanResults";
import { FolderList } from "./FolderList";
import { ScanControls } from "./ScanControls";
import { IgdbNotConfigured } from "./IgdbNotConfigured";
import { useI18n } from "../../i18n";
import { useConsole } from "../Layout/ConsolePanel";

interface FolderPickerProps {
  onNavigate?: (view: string) => void;
  onGamesSaved?: () => void;
}

export function FolderPicker({ onNavigate, onGamesSaved }: FolderPickerProps) {
  const { t } = useI18n();
  const { log: consoleLog, clear: clearConsole } = useConsole();
  const [folders, setFolders] = useState<{ path: string }[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [igdbConfigured, setIgdbConfigured] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
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
    try { await invoke("stop_scan"); } catch { setIsStopping(false); }
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
      unlistenersRef.current.push(await listen<ConsoleLog>("console:log", (e) => {
        const p = e.payload;
        consoleLog(p.level === "ERROR" ? "error" : p.level === "WARN" ? "warn" : "info", `[Scanner] ${p.message}`);
      }));
      unlistenersRef.current.push(await listen("scan:complete", () => {
        setScanning(false);
        setShowResults(true);
        setFoldersCollapsed(true); // Auto-collapse folders when results arrive
      }));
      unlistenersRef.current.push(await listen("scan:cancelled", () => {
        setScanning(false);
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
      setSaved(true); setResults([]); setShowResults(false); onGamesSaved?.();
    } catch (e) { alert("Failed to save games: " + e); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Collapsible Folder List */}
      <div className={`theme-bg-secondary rounded-lg transition-all duration-300 ${foldersCollapsed ? 'p-3' : 'p-4'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className={`font-bold theme-text-primary ${foldersCollapsed ? 'text-lg' : 'text-2xl'}`}>
              {t('scanner')}
            </h2>
            {foldersCollapsed && (
              <span className="text-sm theme-text-muted">
                ({folders.length} {folders.length === 1 ? 'folder' : 'folders'})
              </span>
            )}
          </div>
          <button
            onClick={() => setFoldersCollapsed(!foldersCollapsed)}
            className="p-2 rounded-lg theme-bg-tertiary theme-text-secondary hover:theme-text-primary transition-colors"
            title={foldersCollapsed ? t('expand') : t('collapse')}
          >
            {foldersCollapsed ? '▼' : '▲'}
          </button>
        </div>
        
        {!foldersCollapsed && (
          <div className="mt-3">
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
        resultCount={results.length} progress={progress} onScan={handleScanAll} onStop={handleStopScan} />
      {(showResults || results.length > 0) && !scanning && (
        <div className="space-y-4 theme-border border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold theme-text-primary">{t('scanResults')} ({results.length} {t('games')})</h3>
            {saving && <span className="text-blue-400 text-sm">{t('saving')}</span>}
            {saved && <span className="text-green-400 text-sm">✓ {t('saved')}</span>}
          </div>
          {results.length === 0 ? (
            <p className="theme-text-muted">{t('noGamesFound')}</p>
          ) : (
            <ScanResults results={results} onSave={handleSave} onResultsChange={setResults} onCreateExclusion={() => {}} />
          )}
        </div>
      )}
    </div>
  );
}
