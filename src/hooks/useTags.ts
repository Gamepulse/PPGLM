import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "../types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Tag[]>("get_tags");
      setTags(result);
    } catch (e) {
      console.error("[useTags.fetchTags] ERROR:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    refresh: fetchTags,
  };
}
