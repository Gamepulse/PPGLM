// Mapping des plateformes IGDB vers les IDs de plateformes de l'app
// Basé sur les noms de plateformes IGDB (case-insensitive, partial match)
export const IGDB_PLATFORM_MAPPING: Record<string, string[]> = {
  // PC
  'PC (Microsoft Windows)': ['pc'],
  'PC': ['pc'],
  'Windows': ['pc'],
  'Linux': ['pc'],
  'Mac': ['pc'],
  
  // PlayStation
  'PlayStation 5': ['ps5'],
  'PS5': ['ps5'],
  'PlayStation 4': ['ps4'],
  'PS4': ['ps4'],
  'PlayStation 3': ['ps3'],
  'PS3': ['ps3'],
  'PlayStation 2': ['ps2'],
  'PS2': ['ps2'],
  'PlayStation': ['ps1'],
  'PSX': ['ps1'],
  'PSOne': ['ps1'],
  'PlayStation Portable': ['other'],
  'PSP': ['other'],
  'PlayStation Vita': ['other'],
  'PS Vita': ['other'],
  
  // Xbox
  'Xbox Series X|S': ['xbox_series'],
  'Xbox Series X': ['xbox_series'],
  'Xbox Series S': ['xbox_series'],
  'Xbox One': ['xbox_one'],
  'Xbox 360': ['xbox_360'],
  'Xbox': ['xbox_360'],
  
  // Nintendo
  'Nintendo Switch': ['nintendo_switch'],
  'Switch': ['nintendo_switch'],
  'Nintendo Switch 2': ['nintendo_switch'],
  'Wii U': ['nintendo_wiiu'],
  'Nintendo Wii U': ['nintendo_wiiu'],
  'Wii': ['nintendo_wii'],
  'Nintendo Wii': ['nintendo_wii'],
  'Nintendo 3DS': ['nintendo_3ds'],
  '3DS': ['nintendo_3ds'],
  'Nintendo DS': ['nintendo_ds'],
  'DS': ['nintendo_ds'],
  'Nintendo GameCube': ['other'],
  'GameCube': ['other'],
  'Nintendo 64': ['other'],
  'N64': ['other'],
  'Super Nintendo Entertainment System': ['other'],
  'SNES': ['other'],
  'Super Nintendo': ['other'],
  'Nintendo Entertainment System': ['other'],
  'NES': ['other'],
  'Game Boy': ['other'],
  'Game Boy Advance': ['other'],
  'GBA': ['other'],
  'Game Boy Color': ['other'],
  
  // Mobile
  'iOS': ['mobile'],
  'Android': ['mobile'],
  'Mobile': ['mobile'],
};

// Fonction pour mapper un nom de plateforme IGDB vers les IDs de l'app
export function mapIgdbPlatformToApp(igdbPlatformName: string): string | null {
  // Recherche exacte d'abord
  if (IGDB_PLATFORM_MAPPING[igdbPlatformName]) {
    return IGDB_PLATFORM_MAPPING[igdbPlatformName][0];
  }
  
  // Recherche case-insensitive
  const normalizedName = igdbPlatformName.toLowerCase();
  for (const [igdbName, appIds] of Object.entries(IGDB_PLATFORM_MAPPING)) {
    if (igdbName.toLowerCase() === normalizedName) {
      return appIds[0];
    }
  }
  
  // Recherche partielle
  for (const [igdbName, appIds] of Object.entries(IGDB_PLATFORM_MAPPING)) {
    if (normalizedName.includes(igdbName.toLowerCase()) || 
        igdbName.toLowerCase().includes(normalizedName)) {
      return appIds[0];
    }
  }
  
  return null;
}

// Fonction pour obtenir toutes les plateformes uniques d'un jeu IGDB
export function getMappedPlatformsFromIgdb(igdbPlatforms: Array<{ id: number; name: string }>): string[] {
  const mapped = new Set<string>();
  
  igdbPlatforms.forEach(platform => {
    const appId = mapIgdbPlatformToApp(platform.name);
    if (appId) {
      mapped.add(appId);
    }
  });
  
  return Array.from(mapped);
}
