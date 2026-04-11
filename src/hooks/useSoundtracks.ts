// Music/Soundtrack module - Disabled for future build
// This module provides soundtrack-related functionality including:
// - VGMdb soundtrack search and storage
// - MusicBrainz integration
// - Spotify linking
// 
// To re-enable: Uncomment all code and ensure backend commands are registered

export function useSoundtracks() {
  // Placeholder implementation - music module disabled
  return {
    soundtracks: [],
    loading: false,
    error: null,
    musicbrainzResults: [],
    searchingMB: false,
    pendingSoundtracks: null,
    fetchSoundtracks: async () => {},
    deleteSoundtrack: async () => {},
    updateSpotifyLink: async () => {},
    searchMusicBrainz: async () => [],
    addMusicBrainzSoundtrack: async () => null,
    setMusicbrainzResults: () => {},
    triggerBackgroundFetch: async () => {},
    autoFetchAndSave: async () => 0,
    clearPendingSoundtracks: () => {},
  };
}

/* 
Original implementation - commented out for future build

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { GameSoundtrack, MusicBrainzRelease } from '../types';

export function useSoundtracks() {
  const [soundtracks, setSoundtracks] = useState<GameSoundtrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicbrainzResults, setMusicbrainzResults] = useState<MusicBrainzRelease[]>([]);
  const [searchingMB, setSearchingMB] = useState(false);
  const [pendingSoundtracks, setPendingSoundtracks] = useState<{gameId: number, gameName: string, count: number} | null>(null);

  // Listen for background soundtrack fetch events
  useEffect(() => {
    const unlisten = listen('soundtracks-found', (event: any) => {
      const payload = event.payload as { game_id: number; game_name: string; count: number };
      setPendingSoundtracks({
        gameId: payload.game_id,
        gameName: payload.game_name,
        count: payload.count,
      });
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const fetchSoundtracks = useCallback(async (gameId: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await invoke<GameSoundtrack[]>('get_game_soundtracks', { gameId });
      setSoundtracks(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch soundtracks');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSoundtrack = useCallback(async (soundtrackId: number, gameId: number) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('delete_game_soundtrack', { soundtrackId });
      await fetchSoundtracks(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete soundtrack');
    } finally {
      setLoading(false);
    }
  }, [fetchSoundtracks]);

  const updateSpotifyLink = useCallback(async (
    soundtrackId: number,
    spotifyUri: string | null,
    spotifyUrl: string | null,
    gameId: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('update_soundtrack_spotify_link', {
        soundtrackId,
        spotifyUri,
        spotifyUrl,
      });
      await fetchSoundtracks(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Spotify link');
    } finally {
      setLoading(false);
    }
  }, [fetchSoundtracks]);

  // MusicBrainz functions
  const searchMusicBrainz = useCallback(async (gameName: string) => {
    setSearchingMB(true);
    setError(null);
    try {
      const results = await invoke<MusicBrainzRelease[]>('search_musicbrainz_soundtracks', { gameName });
      setMusicbrainzResults(results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
      return [];
    } finally {
      setSearchingMB(false);
    }
  }, []);

  const addMusicBrainzSoundtrack = useCallback(async (
    gameId: number,
    release: MusicBrainzRelease
  ): Promise<GameSoundtrack | null> => {
    setLoading(true);
    setError(null);
    try {
      const id = await invoke<number>('save_musicbrainz_soundtrack', {
        gameId,
        mbReleaseId: release.id,
        title: release.title,
        artist: release.artist_credit.map(a => a.name).join(', ') || null,
        date: release.date || null,
        coverUrl: release.cover_url || null,
        trackCount: release.track_count || null,
      });

      await fetchSoundtracks(gameId);
      
      const newSoundtrack = soundtracks.find(s => s.id === id);
      return newSoundtrack || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add MusicBrainz soundtrack');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSoundtracks, soundtracks]);

  // Auto-fetch soundtracks in background
  const triggerBackgroundFetch = useCallback(async (gameId: number, gameName: string) => {
    // Fire and forget - don't wait for result
    invoke('background_fetch_soundtracks', {
      gameId,
      gameName,
    }).catch(err => {
      console.error('Background fetch failed:', err);
    });
  }, []);

  // Auto-fetch and save soundtracks immediately
  const autoFetchAndSave = useCallback(async (gameId: number, gameName: string) => {
    setLoading(true);
    setError(null);
    try {
      const count = await invoke<number>('auto_fetch_and_save_soundtracks', {
        gameId,
        gameName,
      });
      await fetchSoundtracks(gameId);
      setPendingSoundtracks(null);
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-fetch soundtracks');
      return 0;
    } finally {
      setLoading(false);
    }
  }, [fetchSoundtracks]);

  // Clear pending notification
  const clearPendingSoundtracks = useCallback(() => {
    setPendingSoundtracks(null);
  }, []);

  return {
    soundtracks,
    loading,
    error,
    musicbrainzResults,
    searchingMB,
    pendingSoundtracks,
    fetchSoundtracks,
    deleteSoundtrack,
    updateSpotifyLink,
    searchMusicBrainz,
    addMusicBrainzSoundtrack,
    setMusicbrainzResults,
    triggerBackgroundFetch,
    autoFetchAndSave,
    clearPendingSoundtracks,
  };
}
*/
