import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useSettings() {
  const [scanFiles, setScanFilesState] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Load scan_files setting on mount
  useEffect(() => {
    loadScanFilesSetting();
  }, []);

  const loadScanFilesSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "scan_files" });
      setScanFilesState(value === "true");
    } catch (e) {
      console.error("Failed to load scan_files setting:", e);
    }
  }, []);

  const setScanFiles = useCallback(async (value: boolean) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "scan_files", 
        value: value ? "true" : "false" 
      });
      setScanFilesState(value);
      return true;
    } catch (e) {
      console.error("Failed to save scan_files setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scanFiles,
    setScanFiles,
    loading,
  };
}
