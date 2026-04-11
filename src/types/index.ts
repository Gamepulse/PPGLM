export interface Game {
  id: number;
  folder_name: string;
  folder_path: string;
  display_name: string;
  igdb_id: number | null;
  igdb_slug: string | null;
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
  // New fields for features 1-5
  play_time?: number | null;
  completion_status?: string | null;
  is_favorite?: boolean | null;
  last_played?: string | null;
  executable_path?: string | null;
  store_links?: string | null;
  platform?: string | null;
  igdb_platforms?: PlatformInfo[];
}

export interface PlatformInfo {
  id: number;
  name: string;
}

export type Platform = 'pc' | 'playstation' | 'xbox' | 'nintendo' | 'mobile' | 'other';

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: 'PC',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  nintendo: 'Nintendo',
  mobile: 'Mobile',
  other: 'Other',
};

export const PLATFORM_OPTIONS: { value: Platform; label: string; emoji: string }[] = [
  { value: 'pc', label: 'PC', emoji: '💻' },
  { value: 'playstation', label: 'PlayStation', emoji: '🎮' },
  { value: 'xbox', label: 'Xbox', emoji: '🎯' },
  { value: 'nintendo', label: 'Nintendo', emoji: '🕹️' },
  { value: 'mobile', label: 'Mobile', emoji: '📱' },
  { value: 'other', label: 'Other', emoji: '📟' },
];

export type CompletionStatus = 'not_started' | 'playing' | 'completed' | 'dropped' | 'wishlist';

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, string> = {
  not_started: 'Not Started',
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
  wishlist: 'Wishlist',
};

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  id: number;
  game_id: number;
  file_path: string;
  caption: string | null;
  is_cover: boolean;
  created_at: string;
}

export interface StoreLink {
  store: string;
  url: string;
}

export interface SearchHistoryEntry {
  id: number;
  query: string;
  filters: string | null;
  searched_at: string;
}

export interface GameStatistics {
  total_games: number;
  total_play_time: number;
  average_rating: number;
  games_by_status: StatusCount[];
  games_by_genre: GenreCount[];
  recently_added: Game[];
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface GenreCount {
  genre: string;
  count: number;
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
  igdb_slug?: string | null;
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
  // Platform selection (optional, user can set before saving)
  platform?: string | null;
  // Whether this folder matches exclusion patterns
  is_excluded?: boolean;
  // Whether this match was rejected (distance too high) but can be accepted by user
  is_rejected?: boolean;
  // Whether this is a parent folder scanned but not matched (intermediate folder)
  is_parent?: boolean;
}

export interface MatchCandidate {
  id: number;
  name: string;
  distance: number;
  cover_url: string | null;
  slug?: string | null;
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
  // New filter fields
  completion_status?: string;
  is_favorite?: boolean;
  collection_id?: number;
  min_play_time?: number;
  max_play_time?: number;
  genre?: string;
  mode?: string;
  perspective?: string;
  theme?: string;
  tag?: string;
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

/** Event emitted when a folder is excluded during scanning */
export interface ExcludedFolderEvent {
  folder_name: string;
  folder_path: string;
  reason: string;
}

/** Event emitted when a folder has no IGDB match */
export interface NoMatchFolderEvent {
  folder_name: string;
  folder_path: string;
  display_name: string;
}

/** Event emitted when a match is rejected (distance too high) */
export interface RejectedMatchEvent {
  folder_name: string;
  folder_path: string;
  display_name: string;
  best_candidate_name: string;
  best_distance: number;
  threshold: number;
  candidates: MatchCandidate[];
}

/** Event emitted when a parent folder is scanned but has no match (not at max depth) */
export interface ScannedParentFolderEvent {
  folder_name: string;
  folder_path: string;
  display_name: string;
  depth: number;
}

export type ViewType = "library" | "scanner" | "settings" | "game-detail";

export type TagCategory = "genre" | "developer" | "publisher" | "custom";

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  genre: "Genre",
  developer: "Développeur",
  publisher: "Éditeur",
  custom: "Personnalisé",
};

// Soundtrack types
export interface GameSoundtrack {
  id: number;
  game_id: number;
  vgmdb_album_id?: number | null;
  vgmdb_url?: string | null;
  album_title?: string | null;
  album_artist?: string | null;
  release_date?: string | null;
  cover_url?: string | null;
  spotify_uri?: string | null;
  spotify_url?: string | null;
  youtube_url?: string | null;
  track_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VgmdbAlbum {
  id: number;
  title: string;
  url: string;
  cover_url?: string | null;
  artists: string[];
  release_date?: string | null;
  track_count?: number | null;
  catalog_number?: string | null;
}

// Soundtrack types (for music module - currently disabled)
export interface GameSoundtrack {
  id: number;
  game_id: number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
  release_date?: string | null;
  track_count?: number | null;
  source: 'vgmdb' | 'musicbrainz' | 'manual';
  source_id?: string | null;
  spotify_uri?: string | null;
  spotify_url?: string | null;
  youtube_url?: string | null;
  created_at: string;
  updated_at: string;
}

// MusicBrainz types
export interface MusicBrainzArtist {
  id: string;
  name: string;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  artist_credit: MusicBrainzArtist[];
  date?: string | null;
  country?: string | null;
  track_count?: number | null;
  cover_url?: string | null;
  disambiguation?: string | null;
}

// YouTube types
export interface YouTubeVideoInfo {
  video_id: string;
  title: string;
  thumbnail_url: string;
  embed_url: string;
  watch_url: string;
}

// ListenBrainz types
export interface ListenBrainzMetadata {
  recording_mbid?: string | null;
  recording_name?: string | null;
  artist_credit_name?: string | null;
  artist_mbids?: string[] | null;
  release_mbid?: string | null;
  release_name?: string | null;
  additional_info?: {
    youtube?: string | null;
    origin_url?: string | null;
    spotify_id?: string | null;
  } | null;
}
