export interface Game {
  id: number;
  folder_name: string;
  folder_path: string;
  display_name: string;
  igdb_id: number | null;
  personal_rating: number | null;
  igdb_rating: number | null;
  notes: string | null;
  cover_url: string | null;
  synopsis: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  genres: Genre[];
  game_modes: GameMode[];
  player_perspectives: PlayerPerspective[];
  themes: Theme[];
}

export interface Tag {
  id: number;
  name: string;
  category: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface GameMode {
  id: number;
  name: string;
}

export interface PlayerPerspective {
  id: number;
  name: string;
}

export interface Theme {
  id: number;
  name: string;
}

export interface ScannedFolder {
  id: number;
  path: string;
  last_scanned: string | null;
}

export interface ScanResult {
  folder_name: string;
  folder_path: string;
  display_name: string;
  igdb_id: number | null;
  match_source: string;
  match_confidence: "Exact" | "Fuzzy" | "None";
  candidates: MatchCandidate[];
  cover_url: string | null;
  synopsis: string | null;
  release_date: string | null;
  // Additional IGDB fields
  igdb_rating?: number | null;
  genres?: Genre[];
  game_modes?: GameMode[];
  player_perspectives?: PlayerPerspective[];
  themes?: Theme[];
}

export interface MatchCandidate {
  id: number;
  name: string;
  distance: number;
  cover_url: string | null;
}

export interface IgdbCredentials {
  client_id: string;
  client_secret: string;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  first_release_date?: number;
  rating?: number;
  cover?: {
    id: number;
    url: string;
  };
  genres?: Array<{ id: number; name: string }>;
}

export interface GameFilters {
  tag_ids?: number[];
  min_rating?: number;
  max_rating?: number;
  search_query?: string;
  sort_by?: string;
  sort_order?: string;
}

/** Consolidated from FolderPicker.tsx and useScanner.ts */
export interface ConsoleLog {
  timestamp: string;
  level: string;
  message: string;
}

/** Consolidated from FolderPicker.tsx (ScanProgressData) and useScanner.ts (ScanProgress) */
export interface ScanProgress {
  folders_scanned: number;
  games_found: number;
  current_path: string;
  operation: string;
}

/** Consolidated from FolderPicker.tsx and useScanner.ts */
export interface ScanResultEvent {
  result: ScanResult;
  total_found: number;
}

export type ViewType = "library" | "scanner" | "settings" | "game-detail";

export type TagCategory = "genre" | "developer" | "publisher" | "custom";

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  genre: "Genre",
  developer: "Développeur",
  publisher: "Éditeur",
  custom: "Personnalisé",
};
