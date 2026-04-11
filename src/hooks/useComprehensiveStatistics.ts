import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ComprehensiveGameStats {
  total_games: number;
  games_with_igdb: number;
  games_without_igdb: number;
  avg_personal_rating: number;
  avg_igdb_rating: number;
  rated_games: number;
  completion_stats: [string, number][];
  total_play_time: number;
  avg_play_time: number;
  games_with_play_time: number;
  favorite_games: number;
  platform_stats: [string, number][];
  release_years: [string, number][];
  recently_added: number;
  games_with_covers: number;
  games_with_executable: number;
  total_tags: number;
  top_tags: [string, number][];
  genre_stats: [string, number][];
  total_collections: number;
  collection_stats: [string, number][];
  total_scanned_folders: number;
  total_exclusions: number;
  total_searches: number;
  unique_searches: number;
  total_screenshots: number;
}

export function useComprehensiveStatistics() {
  const [stats, setStats] = useState<ComprehensiveGameStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<ComprehensiveGameStats>("get_comprehensive_game_statistics");
      setStats(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStatistics };
}
