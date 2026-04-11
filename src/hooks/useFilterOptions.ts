import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tag, Genre, GameMode, PlayerPerspective, Theme } from "../types";

export interface PlatformInfo {
  id: number;
  name: string;
}

export interface FilterOptions {
  genres: Genre[];
  game_modes: GameMode[];
  player_perspectives: PlayerPerspective[];
  themes: Theme[];
  platforms: PlatformInfo[];
  tags: Tag[];
}

export function useFilterOptions() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    genres: [],
    game_modes: [],
    player_perspectives: [],
    themes: [],
    platforms: [],
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilterOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<FilterOptions>("get_all_filter_options");
      setFilterOptions(result);
    } catch (e) {
      console.error("[useFilterOptions.fetchFilterOptions] ERROR:", e);
      setError(String(e));
      // Fallback: try to fetch individually
      try {
        const [genres, modes, perspectives, themes, platforms, tags] = await Promise.all([
          invoke<Genre[]>("get_genres").catch(() => []),
          invoke<GameMode[]>("get_game_modes").catch(() => []),
          invoke<PlayerPerspective[]>("get_player_perspectives").catch(() => []),
          invoke<Theme[]>("get_themes").catch(() => []),
          invoke<PlatformInfo[]>("get_platforms").catch(() => []),
          invoke<Tag[]>("get_tags").catch(() => []),
        ]);
        setFilterOptions({
          genres,
          game_modes: modes,
          player_perspectives: perspectives,
          themes,
          platforms,
          tags,
        });
      } catch (fallbackError) {
        console.error("[useFilterOptions] Fallback fetch failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    filterOptions,
    loading,
    error,
    refresh: fetchFilterOptions,
  };
}
