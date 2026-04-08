export const MATCH_CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  Exact: { label: "Match exact", color: "bg-green-500" },
  Cleaned: { label: "Match nettoyé", color: "bg-blue-500" },
  Fuzzy: { label: "Match approximatif", color: "bg-yellow-500" },
  None: { label: "Non trouvé", color: "bg-red-500" },
};

export const TAG_CATEGORIES: Record<string, string> = {
  genre: "Genre",
  developer: "Développeur",
  publisher: "Éditeur",
  platform: "Plateforme",
  theme: "Thème",
  gamemode: "Mode de jeu",
  custom: "Personnalisé",
};

export const DEFAULT_SORT = "display_name";
export const DEFAULT_ORDER = "asc";
