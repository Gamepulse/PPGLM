import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_MATCH_THRESHOLD = 15;
const DEFAULT_SCAN_DEPTH = 3;
const DEFAULT_FONT_SIZE = 100;
const DEFAULT_SCREENSHOT_BG_COUNT = 0;

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

interface SettingsContextType {
  scanFiles: boolean;
  setScanFiles: (value: boolean) => Promise<boolean>;
  matchThreshold: number;
  setMatchThreshold: (value: number) => Promise<boolean>;
  scanDepth: number;
  setScanDepth: (value: number) => Promise<boolean>;
  continueScanAfterMatch: boolean;
  setContinueScanAfterMatch: (value: boolean) => Promise<boolean>;
  activeConsoles: string[];
  setActiveConsoles: (consoles: string[]) => Promise<boolean>;
  toggleConsole: (consoleId: string) => Promise<boolean>;
  availableConsoles: typeof AVAILABLE_CONSOLES;
  fontSize: number;
  setFontSize: (value: number) => Promise<boolean>;
  screenshotBgCount: number;
  setScreenshotBgCount: (value: number) => Promise<boolean>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [scanFiles, setScanFilesState] = useState<boolean>(false);
  const [matchThreshold, setMatchThresholdState] = useState<number>(DEFAULT_MATCH_THRESHOLD);
  const [scanDepth, setScanDepthState] = useState<number>(DEFAULT_SCAN_DEPTH);
  const [activeConsoles, setActiveConsolesState] = useState<string[]>(DEFAULT_ACTIVE_CONSOLES);
  const [continueScanAfterMatch, setContinueScanAfterMatchState] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<number>(() => {
    // Initialize from localStorage immediately
    try {
      const cached = localStorage.getItem('font_size_cache');
      if (cached) {
        const cachedValue = parseInt(cached, 10);
        if (!isNaN(cachedValue) && cachedValue >= 80 && cachedValue <= 150) {
          document.documentElement.style.zoom = `${cachedValue / 100}`;
          return cachedValue;
        }
      }
    } catch (e) {
      console.error("Failed to load cached font size:", e);
    }
    document.documentElement.style.zoom = `${DEFAULT_FONT_SIZE / 100}`;
    return DEFAULT_FONT_SIZE;
  });
  const [screenshotBgCount, setScreenshotBgCountState] = useState<number>(DEFAULT_SCREENSHOT_BG_COUNT);
  const [loading, setLoading] = useState(false);

  // Define all callbacks first
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
          localStorage.setItem('font_size_cache', String(numValue));
        }
      }
    } catch (e) {
      console.error("Failed to load font_size setting:", e);
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

  // Then use them in useEffect
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        await Promise.all([
          loadFontSizeSetting(),
          loadScanFilesSetting(),
          loadMatchThresholdSetting(),
          loadScanDepthSetting(),
          loadActiveConsolesSetting(),
          loadContinueScanAfterMatchSetting(),
          loadScreenshotBgCountSetting(),
        ]);
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    
    loadAllSettings();
  }, [
    loadFontSizeSetting,
    loadScanFilesSetting,
    loadMatchThresholdSetting,
    loadScanDepthSetting,
    loadActiveConsolesSetting,
    loadContinueScanAfterMatchSetting,
    loadScreenshotBgCountSetting,
  ]);

  // Apply font size as root font size (scales all rem/em text)
  useEffect(() => {
    // Default base font size is 16px (browser default)
    // Scale it proportionally to the fontSize setting (80-150%)
    const baseSize = 16;
    const scaledSize = (fontSize / 100) * baseSize;
    document.documentElement.style.fontSize = `${scaledSize}px`;
  }, [fontSize]);

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
    setLoading(true);
    try {
      await invoke("set_setting", { 
        key: "font_size", 
        value: value.toString() 
      });
      setFontSizeState(value);
      localStorage.setItem('font_size_cache', String(value));
      return true;
    } catch (e) {
      console.error("Failed to save font_size setting:", e);
      return false;
    } finally {
      setLoading(false);
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

  const value = {
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

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
