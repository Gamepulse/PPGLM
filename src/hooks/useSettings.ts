import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_MATCH_THRESHOLD = 15;
const DEFAULT_SCAN_DEPTH = 3;
const DEFAULT_FONT_SIZE = 100; // 100% = default size
const DEFAULT_SCREENSHOT_BG_COUNT = 0; // 0 = disabled, max 5

// All available consoles/platforms
export const AVAILABLE_CONSOLES = [
  { id: "pc", icon: "💻", name: "PC" },
  { id: "ps5", icon: "🎮", name: "PlayStation 5" },
  { id: "ps4", icon: "🎮", name: "PlayStation 4" },
  { id: "ps3", icon: "🎮", name: "PlayStation 3" },
  { id: "ps2", icon: "🎮", name: "PlayStation 2" },
  { id: "ps1", icon: "🎮", name: "PlayStation" },
  { id: "xbox_series", icon: "🎯", name: "Xbox Series X|S" },
  { id: "xbox_one", icon: "🎯", name: "Xbox One" },
  { id: "xbox_360", icon: "🎯", name: "Xbox 360" },
  { id: "nintendo_switch", icon: "🕹️", name: "Nintendo Switch" },
  { id: "nintendo_wiiu", icon: "🕹️", name: "Nintendo Wii U" },
  { id: "nintendo_wii", icon: "🕹️", name: "Nintendo Wii" },
  { id: "nintendo_3ds", icon: "🕹️", name: "Nintendo 3DS" },
  { id: "nintendo_ds", icon: "🕹️", name: "Nintendo DS" },
  { id: "mobile", icon: "📱", name: "Mobile" },
  { id: "other", icon: "📟", name: "Other" },
];

const DEFAULT_ACTIVE_CONSOLES = AVAILABLE_CONSOLES.map(c => c.id);

export function useSettings() {
  const [scanFiles, setScanFilesState] = useState<boolean>(false);
  const [matchThreshold, setMatchThresholdState] = useState<number>(DEFAULT_MATCH_THRESHOLD);
  const [scanDepth, setScanDepthState] = useState<number>(DEFAULT_SCAN_DEPTH);
  const [activeConsoles, setActiveConsolesState] = useState<string[]>(DEFAULT_ACTIVE_CONSOLES);
  const [continueScanAfterMatch, setContinueScanAfterMatchState] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<number>(DEFAULT_FONT_SIZE);
  const [screenshotBgCount, setScreenshotBgCountState] = useState<number>(DEFAULT_SCREENSHOT_BG_COUNT);
  const [loading, setLoading] = useState(false);

  // Load settings on mount - font size first to avoid visual flash
  // Note: Font size is already set in index.html from localStorage cache
  useEffect(() => {
    // Load font size first to prevent flash of wrong size
    loadFontSizeSetting();
    // Then load other settings
    loadScanFilesSetting();
    loadMatchThresholdSetting();
    loadScanDepthSetting();
    loadActiveConsolesSetting();
    loadContinueScanAfterMatchSetting();
    loadScreenshotBgCountSetting();
  }, []);

  // Apply font size to document when it changes
  useEffect(() => {
    console.log('[useSettings] Applying font size:', fontSize);
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  const loadScanFilesSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "scan_files" });
      setScanFilesState(value === "true");
    } catch (e) {
      console.error("Failed to load scan_files setting:", e);
    }
  }, []);

  const loadMatchThresholdSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "match_threshold" });
      if (value) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 5 && numValue <= 50) {
          setMatchThresholdState(numValue);
        }
      }
    } catch (e) {
      console.error("Failed to load match_threshold setting:", e);
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

  const setMatchThreshold = useCallback(async (value: number) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "match_threshold", 
        value: value.toString() 
      });
      setMatchThresholdState(value);
      return true;
    } catch (e) {
      console.error("Failed to save match_threshold setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScanDepthSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "scan_depth" });
      if (value) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
          setScanDepthState(numValue);
        }
      }
    } catch (e) {
      console.error("Failed to load scan_depth setting:", e);
    }
  }, []);

  const loadContinueScanAfterMatchSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "continue_scan_after_match" });
      setContinueScanAfterMatchState(value === "true");
    } catch (e) {
      console.error("Failed to load continue_scan_after_match setting:", e);
    }
  }, []);

  const loadFontSizeSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "font_size" });
      if (value) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 80 && numValue <= 150) {
          setFontSizeState(numValue);
          // Apply immediately to avoid flash of wrong size
          document.documentElement.style.fontSize = `${numValue}%`;
          // Also cache in localStorage for instant load on next startup
          localStorage.setItem('font_size_cache', String(numValue));
        }
      } else {
        // No saved value, ensure default is applied
        document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE}%`;
        localStorage.setItem('font_size_cache', String(DEFAULT_FONT_SIZE));
      }
    } catch (e) {
      console.error("Failed to load font_size setting:", e);
      // On error, try to use cached value or apply default
      const cached = localStorage.getItem('font_size_cache');
      if (cached) {
        const cachedValue = parseInt(cached, 10);
        if (!isNaN(cachedValue)) {
          document.documentElement.style.fontSize = `${cachedValue}%`;
          setFontSizeState(cachedValue);
        }
      } else {
        document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE}%`;
      }
    }
  }, []);

  const setScanDepth = useCallback(async (value: number) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "scan_depth", 
        value: value.toString() 
      });
      setScanDepthState(value);
      return true;
    } catch (e) {
      console.error("Failed to save scan_depth setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setContinueScanAfterMatch = useCallback(async (value: boolean) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "continue_scan_after_match", 
        value: value ? "true" : "false" 
      });
      setContinueScanAfterMatchState(value);
      return true;
    } catch (e) {
      console.error("Failed to save continue_scan_after_match setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setFontSize = useCallback(async (value: number) => {
    console.log('[useSettings] setFontSize called with:', value);
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "font_size", 
        value: value.toString() 
      });
      console.log('[useSettings] Setting saved, updating state to:', value);
      setFontSizeState(value);
      // Apply immediately
      document.documentElement.style.fontSize = `${value}%`;
      // Cache in localStorage for instant load on next startup
      localStorage.setItem('font_size_cache', String(value));
      return true;
    } catch (e) {
      console.error("Failed to save font_size setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScreenshotBgCountSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "screenshot_bg_count" });
      if (value) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
          setScreenshotBgCountState(numValue);
        }
      }
    } catch (e) {
      console.error("Failed to load screenshot_bg_count setting:", e);
    }
  }, []);

  const setScreenshotBgCount = useCallback(async (value: number) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "screenshot_bg_count", 
        value: value.toString() 
      });
      setScreenshotBgCountState(value);
      return true;
    } catch (e) {
      console.error("Failed to save screenshot_bg_count setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveConsolesSetting = useCallback(async () => {
    try {
      const value = await invoke<string | null>("get_setting", { key: "active_consoles" });
      if (value) {
        const consoles = value.split(",").filter(id => AVAILABLE_CONSOLES.some(c => c.id === id));
        if (consoles.length > 0) {
          setActiveConsolesState(consoles);
        }
      }
    } catch (e) {
      console.error("Failed to load active_consoles setting:", e);
    }
  }, []);

  const setActiveConsoles = useCallback(async (consoles: string[]) => {
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "active_consoles", 
        value: consoles.join(",") 
      });
      setActiveConsolesState(consoles);
      return true;
    } catch (e) {
      console.error("Failed to save active_consoles setting:", e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleConsole = useCallback(async (consoleId: string) => {
    const newConsoles = activeConsoles.includes(consoleId)
      ? activeConsoles.filter(id => id !== consoleId)
      : [...activeConsoles, consoleId];
    return setActiveConsoles(newConsoles);
  }, [activeConsoles, setActiveConsoles]);

  return {
    scanFiles,
    setScanFiles,
    matchThreshold,
    setMatchThreshold,
    scanDepth,
    setScanDepth,
    continueScanAfterMatch,
    setContinueScanAfterMatch,
    activeConsoles,
    setActiveConsoles,
    toggleConsole,
    availableConsoles: AVAILABLE_CONSOLES,
    fontSize,
    setFontSize,
    screenshotBgCount,
    setScreenshotBgCount,
    loading,
  };
}
