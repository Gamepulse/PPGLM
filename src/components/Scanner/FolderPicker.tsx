import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { ScanResult, IgdbCredentials, Game, ConsoleLog, ScanProgress, ScanResultEvent } from "../../types";
import { ScanResults } from "./ScanResults";
import { FolderList } from "./FolderList";
import { ScanControls } from "./ScanControls";
import { ScanConsole } from "./ScanConsole";
import { IgdbNotConfigured } from "./IgdbNotConfigured";
import { useI18n } from "../../i18n";
import { useConsole } from "../Layout/ConsolePanel";

interface FolderPickerProps {
  onNavigate?: (view: string) => void;
  onGamesSaved?: () => void;
}

export function FolderPicker({ onNavigate, onGamesSaved }: FolderPickerProps) {
  const { t } = useI18n();
  const { logs: consoleLogs, log: consoleLog, clear: clearConsole } = useConsole();
  const [folders, setFolders] = useState<{ path: string }[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [igdbConfigured, setIgdbConfigured] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [consoleMinimized, setConsoleMinimized] = useState(false);
  const accumulatedResultsRef = useRef<ScanResult[]>([]);

  useEffect(() => { if (!scanning && consoleLogs.length > 0) setConsoleMinimized(true); }, [scanning, consoleLogs.length]);
  useEffect(() => { loadScannedFolders(); checkIgdbConfig(); }, []);

  async function loadScannedFolders() {
    try { setFolders(await invoke<{ path: string }[]>("get_scanned_folders")); } catch {}
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
    const unlisteners: UnlistenFn[] = [];
    try {
      unlisteners.push(await listen<ScanProgress>("scan:progress", (e) => setProgress(e.payload)));
      unlisteners.push(await listen<ScanResultEvent>("scan:result", (e) => {
        accumulatedResultsRef.current.push(e.payload.result);
        setResults((prev) => [...prev, e.payload.result]);
      }));
      unlisteners.push(await listen<ConsoleLog>("console:log", (e) => {
        const p = e.payload;
        consoleLog(p.level === "ERROR" ? "error" : p.level === "WARN" ? "warn" : "info", `[Scanner] ${p.message}`);
      }));
      unlisteners.push(await listen("scan:complete", () => {
        setScanning(false);
        setShowResults(true);
      }));
      unlisteners.push(await listen("scan:cancelled", () => {
        setScanning(false);
      }));
      await invoke("scan_folders_smart", { paths: folders.map((f) => f.path) });
    } catch {} finally {
      setScanning(false); setIsStopping(false);
      unlisteners.forEach((u) => { try { u(); } catch {} });
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
      <FolderList folders={folders} onAddFolder={handleAddFolder} onRemoveFolder={handleRemoveFolder} />
      <ScanControls scanning={scanning} isStopping={isStopping} hasFolders={folders.length > 0}
        resultCount={results.length} progress={progress} onScan={handleScanAll} onStop={handleStopScan} />
      <ScanConsole minimized={consoleMinimized} onToggleMinimize={() => setConsoleMinimized(!consoleMinimized)} />
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
