import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { GameStatistics, SearchHistoryEntry, Game } from "../types";

export function useStatistics() {
  const [statistics, setStatistics] = useState<GameStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<GameStatistics>("get_game_statistics");
      setStatistics(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<SearchHistoryEntry[]>("get_search_history");
      setHistory(result);
    } catch (e) {
      console.error("Failed to load search history:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToHistory = useCallback(async (query: string, filters?: Record<string, unknown>) => {
    try {
      await invoke<boolean>("add_search_history", { 
        query, 
        filters: filters ? JSON.stringify(filters) : null 
      });
    } catch (e) {
      console.error("Failed to add search history:", e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await invoke<boolean>("clear_search_history");
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear search history:", e);
    }
  }, []);

  return {
    history,
    loading,
    fetchHistory,
    addToHistory,
    clearHistory,
  };
}

export function useBulkOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkUpdate = useCallback(async (
    gameIds: number[],
    updates: {
      completionStatus?: string;
      addTags?: number[];
      removeTags?: number[];
    }
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await invoke<boolean>("bulk_update_games", {
        gameIds,
        completionStatus: updates.completionStatus,
        addTags: updates.addTags,
        removeTags: updates.removeTags,
      });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    bulkUpdate,
  };
}

export function useDuplicates() {
  const [duplicates, setDuplicates] = useState<Game[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findDuplicates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Game[][]>("find_duplicate_games");
      setDuplicates(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    duplicates,
    loading,
    error,
    findDuplicates,
  };
}

export function useScreenshots() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addScreenshot = useCallback(async (gameId: number, filePath: string, caption?: string) => {
    setLoading(true);
    try {
      await invoke("add_screenshot", { gameId, filePath, caption });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getScreenshots = useCallback(async (gameId: number) => {
    try {
      return await invoke("get_screenshots", { gameId });
    } catch (e) {
      setError(String(e));
      return [];
    }
  }, []);

  const deleteScreenshot = useCallback(async (id: number) => {
    try {
      await invoke("delete_screenshot", { id });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  return {
    loading,
    error,
    addScreenshot,
    getScreenshots,
    deleteScreenshot,
  };
}
