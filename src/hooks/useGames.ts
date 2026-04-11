import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Game, GameFilters, Tag } from "../types";

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async (filters?: GameFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Game[]>("get_games", {
        filters: filters ?? {},
      });
      setGames(result);
    } catch (e) {
      console.error("[useGames.fetchGames] ERROR:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const getGame = useCallback(async (id: number): Promise<Game | null> => {
    try {
      return await invoke<Game>("get_game_by_id", { id });
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  const updateRating = useCallback(async (gameId: number, rating: number | null) => {
    try {
      await invoke("update_game_rating", { id: gameId, rating });
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  const updateNotes = useCallback(async (gameId: number, notes: string) => {
    try {
      await invoke("update_game_notes", { id: gameId, notes });
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  const updateTags = useCallback(async (gameId: number, tagIds: number[]) => {
    try {
      await invoke("update_game_tags", { id: gameId, tagIds });
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  const getTags = useCallback(async (): Promise<Tag[]> => {
    try {
      return await invoke<Tag[]>("get_tags");
    } catch (e) {
      setError(String(e));
      return [];
    }
  }, []);

  const createTag = useCallback(async (name: string, category: string): Promise<Tag | null> => {
    try {
      return await invoke<Tag>("create_tag", { name, category });
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (id: number): Promise<boolean> => {
    try {
      return await invoke<boolean>("delete_tag", { id });
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const searchGames = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Game[]>("search_games", { query });
      setGames(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGame = useCallback(async (id: number): Promise<boolean> => {
    try {
      await invoke<boolean>("delete_game", { id });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const deleteGamesByScanPath = useCallback(async (scanPath: string): Promise<number> => {
    try {
      const count = await invoke<number>("delete_games_by_scan_path", { scanPath });
      return count;
    } catch (e) {
      setError(String(e));
      return 0;
    }
  }, []);

  const deleteAllGames = useCallback(async (): Promise<boolean> => {
    try {
      await invoke<boolean>("delete_all_games");
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateGameDisplayName = useCallback(async (id: number, displayName: string): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_display_name", { id, displayName });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateGameCoverUrl = useCallback(async (id: number, coverUrl: string): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_cover_url", { id, coverUrl });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const refreshGameFromIgdb = useCallback(async (gameId: number): Promise<boolean> => {
    try {
      await invoke<boolean>("refresh_game_from_igdb", { gameId });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  // New commands for features 1-5
  const updatePlayTime = useCallback(async (gameId: number, hours: number): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_play_time", { id: gameId, hours });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateCompletionStatus = useCallback(async (gameId: number, status: string): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_completion_status", { id: gameId, status });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateFavorite = useCallback(async (gameId: number, isFavorite: boolean): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_favorite", { id: gameId, isFavorite });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateExecutablePath = useCallback(async (gameId: number, path: string | null): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_executable_path", { id: gameId, path });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updateStoreLinks = useCallback(async (gameId: number, links: string | null): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_store_links", { id: gameId, links });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const updatePlatform = useCallback(async (gameId: number, platform: string | null): Promise<boolean> => {
    try {
      await invoke<boolean>("update_game_platform", { id: gameId, platform });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const recordGamePlayed = useCallback(async (gameId: number): Promise<boolean> => {
    try {
      await invoke<boolean>("record_game_played", { id: gameId });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const launchGame = useCallback(async (gameId: number): Promise<boolean> => {
    try {
      await invoke<boolean>("launch_game", { gameId });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const discoverExecutablePath = useCallback(async (folderPath: string): Promise<string | null> => {
    try {
      return await invoke<string | null>("discover_executable_path", { folderPath });
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  const autoDiscoverAndSaveExecutable = useCallback(async (gameId: number, folderPath: string): Promise<string | null> => {
    try {
      return await invoke<string | null>("auto_discover_and_save_executable", { gameId, folderPath });
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  return {
    games,
    loading,
    error,
    fetchGames,
    getGame,
    updateRating,
    updateNotes,
    updateTags,
    getTags,
    createTag,
    deleteTag,
    searchGames,
    deleteGamesByScanPath,
    deleteGame,
    deleteAllGames,
    updateGameDisplayName,
    updateGameCoverUrl,
    refreshGameFromIgdb,
    // New methods
    updatePlayTime,
    updateCompletionStatus,
    updateFavorite,
    updateExecutablePath,
    updateStoreLinks,
    updatePlatform,
    recordGamePlayed,
    launchGame,
    discoverExecutablePath,
    autoDiscoverAndSaveExecutable,
  };
}
