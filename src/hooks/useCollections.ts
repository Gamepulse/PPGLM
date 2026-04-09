import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Collection } from "../types";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Collection[]>("get_collections");
      setCollections(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollection = useCallback(async (name: string, description?: string, color?: string): Promise<Collection | null> => {
    setLoading(true);
    try {
      const result = await invoke<Collection>("create_collection", { name, description, color });
      await fetchCollections();
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCollections]);

  const addGameToCollection = useCallback(async (gameId: number, collectionId: number): Promise<boolean> => {
    try {
      await invoke<boolean>("add_game_to_collection", { gameId, collectionId });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const removeGameFromCollection = useCallback(async (gameId: number, collectionId: number): Promise<boolean> => {
    try {
      await invoke<boolean>("remove_game_from_collection", { gameId, collectionId });
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const getGameCollections = useCallback(async (gameId: number): Promise<Collection[]> => {
    try {
      return await invoke<Collection[]>("get_game_collections", { gameId });
    } catch (e) {
      setError(String(e));
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    fetchCollections,
    createCollection,
    addGameToCollection,
    removeGameFromCollection,
    getGameCollections,
  };
}
