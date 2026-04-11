import { useState, useCallback } from 'react';
import type { ScanResult } from '../types';

export interface ExcludedFolder {
  folder_name: string;
  folder_path: string;
  reason: string;
}

export interface NoMatchFolder {
  folder_name: string;
  folder_path: string;
  display_name: string;
}

export interface RejectedMatch {
  folder_name: string;
  folder_path: string;
  display_name: string;
  best_candidate_name: string;
  best_distance: number;
  threshold: number;
  candidates: { id: number; name: string; distance: number; cover_url: string | null; slug?: string | null }[];
}

export interface ScannedParentFolder {
  folder_name: string;
  folder_path: string;
  display_name: string;
  depth: number;
}

// Module-level state to persist across component unmounts
let persistedResults: ScanResult[] = [];
let persistedExcluded: ExcludedFolder[] = [];
let persistedNoMatch: NoMatchFolder[] = [];
let persistedRejected: RejectedMatch[] = [];
let persistedParentFolders: ScannedParentFolder[] = [];
let persistedScanning = false;
let persistedProgress: { folders_scanned: number; games_found: number; current_path: string; operation: string } | null = null;

export function useScanResults() {
  const [results, setResultsState] = useState<ScanResult[]>(persistedResults);
  const [excludedFolders, setExcludedFoldersState] = useState<ExcludedFolder[]>(persistedExcluded);
  const [noMatchFolders, setNoMatchFoldersState] = useState<NoMatchFolder[]>(persistedNoMatch);
  const [rejectedMatches, setRejectedMatchesState] = useState<RejectedMatch[]>(persistedRejected);
  const [parentFolders, setParentFoldersState] = useState<ScannedParentFolder[]>(persistedParentFolders);
  const [scanning, setScanningState] = useState(persistedScanning);
  const [progress, setProgressState] = useState(persistedProgress);

  // Sync with persisted state
  const setResults = useCallback((newResults: ScanResult[] | ((prev: ScanResult[]) => ScanResult[])) => {
    if (typeof newResults === 'function') {
      setResultsState((prev) => {
        const next = newResults(prev);
        persistedResults = next;
        return next;
      });
    } else {
      persistedResults = newResults;
      setResultsState(newResults);
    }
  }, []);

  const setExcludedFolders = useCallback((newExcluded: ExcludedFolder[] | ((prev: ExcludedFolder[]) => ExcludedFolder[])) => {
    if (typeof newExcluded === 'function') {
      setExcludedFoldersState((prev) => {
        const next = newExcluded(prev);
        persistedExcluded = next;
        return next;
      });
    } else {
      persistedExcluded = newExcluded;
      setExcludedFoldersState(newExcluded);
    }
  }, []);

  const addExcludedFolder = useCallback((folder: ExcludedFolder) => {
    setExcludedFolders((prev) => {
      // Avoid duplicates
      if (prev.some((f) => f.folder_path === folder.folder_path)) {
        return prev;
      }
      return [...prev, folder];
    });
  }, [setExcludedFolders]);

  const setNoMatchFolders = useCallback((newNoMatch: NoMatchFolder[] | ((prev: NoMatchFolder[]) => NoMatchFolder[])) => {
    if (typeof newNoMatch === 'function') {
      setNoMatchFoldersState((prev) => {
        const next = newNoMatch(prev);
        persistedNoMatch = next;
        return next;
      });
    } else {
      persistedNoMatch = newNoMatch;
      setNoMatchFoldersState(newNoMatch);
    }
  }, []);

  const addNoMatchFolder = useCallback((folder: NoMatchFolder) => {
    setNoMatchFolders((prev) => {
      // Avoid duplicates
      if (prev.some((f) => f.folder_path === folder.folder_path)) {
        return prev;
      }
      return [...prev, folder];
    });
  }, [setNoMatchFolders]);

  const setRejectedMatches = useCallback((newRejected: RejectedMatch[] | ((prev: RejectedMatch[]) => RejectedMatch[])) => {
    if (typeof newRejected === 'function') {
      setRejectedMatchesState((prev) => {
        const next = newRejected(prev);
        persistedRejected = next;
        return next;
      });
    } else {
      persistedRejected = newRejected;
      setRejectedMatchesState(newRejected);
    }
  }, []);

  const addRejectedMatch = useCallback((match: RejectedMatch) => {
    setRejectedMatches((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.folder_path === match.folder_path)) {
        return prev;
      }
      return [...prev, match];
    });
  }, [setRejectedMatches]);

  const setParentFolders = useCallback((newParents: ScannedParentFolder[] | ((prev: ScannedParentFolder[]) => ScannedParentFolder[])) => {
    if (typeof newParents === 'function') {
      setParentFoldersState((prev) => {
        const next = newParents(prev);
        persistedParentFolders = next;
        return next;
      });
    } else {
      persistedParentFolders = newParents;
      setParentFoldersState(newParents);
    }
  }, []);

  const addParentFolder = useCallback((folder: ScannedParentFolder) => {
    setParentFolders((prev) => {
      // Avoid duplicates
      if (prev.some((f) => f.folder_path === folder.folder_path)) {
        return prev;
      }
      return [...prev, folder];
    });
  }, [setParentFolders]);

  const setScanning = useCallback((value: boolean) => {
    persistedScanning = value;
    setScanningState(value);
  }, []);

  const setProgress = useCallback((value: typeof persistedProgress) => {
    persistedProgress = value;
    setProgressState(value);
  }, []);

  const clearResults = useCallback(() => {
    persistedResults = [];
    persistedExcluded = [];
    persistedNoMatch = [];
    persistedRejected = [];
    persistedParentFolders = [];
    persistedScanning = false;
    persistedProgress = null;
    setResultsState([]);
    setExcludedFoldersState([]);
    setNoMatchFoldersState([]);
    setRejectedMatchesState([]);
    setParentFoldersState([]);
    setScanningState(false);
    setProgressState(null);
  }, []);

  const hasResults = results.length > 0;
  const excludedCount = excludedFolders.length;

  return {
    results,
    setResults,
    excludedFolders,
    setExcludedFolders,
    addExcludedFolder,
    noMatchFolders,
    setNoMatchFolders,
    addNoMatchFolder,
    rejectedMatches,
    setRejectedMatches,
    addRejectedMatch,
    parentFolders,
    setParentFolders,
    addParentFolder,
    scanning,
    setScanning,
    progress,
    setProgress,
    clearResults,
    hasResults,
    excludedCount,
    noMatchCount: noMatchFolders.length,
    rejectedCount: rejectedMatches.length,
    parentCount: parentFolders.length,
  };
}
