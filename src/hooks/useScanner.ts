import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { ScanResult, ScannedFolder, ConsoleLog, ScanProgress, ScanResultEvent } from "../types";

export function useScanner() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  
  const unlistenersRef = useRef<UnlistenFn[]>([]);

  const clearLogs = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  const scan = useCallback(async (paths: string[]) => {
    setScanning(true);
    setError(null);
    setResults([]);
    clearLogs();

    // Setup event listeners
    const unlistenProgress = await listen<ScanProgress>("scan:progress", (event) => {
      setProgress(event.payload);
    });
    
    const unlistenResult = await listen<ScanResultEvent>("scan:result", (event) => {
      setResults((prev) => [...prev, event.payload.result]);
    });
    
    const unlistenConsole = await listen<ConsoleLog>("console:log", (event) => {
      setConsoleLogs((prev) => [...prev.slice(-100), event.payload]); // Keep last 100 logs
    });
    
    const unlistenComplete = await listen<number>("scan:complete", () => {
      setScanning(false);
    });

    unlistenersRef.current = [unlistenProgress, unlistenResult, unlistenConsole, unlistenComplete];

    try {
      await invoke("scan_folders_streaming", { paths });
    } catch (e) {
      setError(String(e));
      setScanning(false);
    }
  }, [clearLogs]);

  const stopListening = useCallback(() => {
    unlistenersRef.current.forEach((unlisten) => unlisten());
    unlistenersRef.current = [];
  }, []);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unlistenersRef.current.forEach((unlisten) => unlisten());
      unlistenersRef.current = [];
    };
  }, []);

  const match = useCallback(async (scanResults: ScanResult[]) => {
    setMatching(true);
    setError(null);
    try {
      const matchedResults = await invoke<ScanResult[]>("match_folder_names", {
        results: scanResults,
      });
      setResults(matchedResults);
      return matchedResults;
    } catch (e) {
      setError(String(e));
      return scanResults;
    } finally {
      setMatching(false);
    }
  }, []);

  const saveResults = useCallback(async (scanResults: ScanResult[]) => {
    try {
      await invoke("save_scan_results", { results: scanResults });
    } catch (e) {
      setError(String(e));
    }
  }, []);

  return { 
    results, 
    scanning, 
    matching, 
    error, 
    progress,
    consoleLogs,
    scan, 
    match, 
    saveResults, 
    setResults,
    clearLogs,
    stopListening,
  };
}

export function useScannedFolders() {
  const [folders, setFolders] = useState<ScannedFolder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<ScannedFolder[]>("get_scanned_folders");
      setFolders(result);
    } catch {
      // DB might not have any folders yet
    } finally {
      setLoading(false);
    }
  }, []);

  const addFolder = useCallback(async (path: string) => {
    try {
      await invoke("add_scanned_folder", { path });
      await fetchFolders();
    } catch (e) {
      console.error("Failed to add folder:", e);
    }
  }, [fetchFolders]);

  const removeFolder = useCallback(async (path: string) => {
    try {
      await invoke("remove_scanned_folder", { path });
      await fetchFolders();
    } catch (e) {
      console.error("Failed to remove folder:", e);
    }
  }, [fetchFolders]);

  return { folders, loading, fetchFolders, addFolder, removeFolder };
}
