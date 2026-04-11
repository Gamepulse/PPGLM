/// System folders to skip during scanning (platform-specific)
#[cfg(target_os = "windows")]
pub const SYSTEM_FOLDERS: &[&str] = &[
    "Windows",
    "Program Files",
    "Program Files (x86)",
    "ProgramData",
    "$Recycle.Bin",
    "System Volume Information",
    "Recovery",
    "PerfLogs",
];

#[cfg(target_os = "macos")]
pub const SYSTEM_FOLDERS: &[&str] = &[
    "Library",
    "System",
    "Applications",
    ".Trashes",
    ".vol",
    "Volumes",
    "private",
    "Network",
];

#[cfg(target_os = "linux")]
pub const SYSTEM_FOLDERS: &[&str] = &[
    "proc",
    "sys",
    "dev",
    "run",
    "snap",
    "flatpak",
    "boot",
    "lib64",
    "sbin",
    "bin",
    "usr",
    "etc",
    "var",
];

/// Folders to ignore when scanning (common non-game subdirectories)
pub const SKIP_FOLDER_PATTERNS: &[&str] = &[
    "update",
    "patch",
    "dlc",
    "redist",
    "directx",
    "vcredist",
    "installer",
    "setup",
    "uninstall",
    "temp",
    "tmp",
    "cache",
    "logs",
    "saves",
    "save",
    "screenshots",
    "config",
    "settings",
    "docs",
    "manual",
    "readme",
];

/// Check if folder name should be skipped
pub fn should_skip_folder(folder_name: &str, custom_exclusions: &[String]) -> bool {
    let lower = folder_name.to_lowercase();

    // Skip system folders
    if SYSTEM_FOLDERS.iter().any(|sf| sf.eq_ignore_ascii_case(folder_name))
        || folder_name.starts_with('.')
    {
        return true;
    }

    // Skip common non-game patterns
    for pattern in SKIP_FOLDER_PATTERNS {
        if lower.contains(pattern) {
            return true;
        }
    }

    // Skip custom exclusions from database
    for pattern in custom_exclusions {
        if lower.contains(&pattern.to_lowercase()) {
            return true;
        }
    }

    // Skip folders with version numbers only (like "1.0.0", "v2.1")
    if regex::Regex::new(r"^v?\d+(\.\d+)*$")
        .unwrap()
        .is_match(folder_name)
    {
        return true;
    }

    // Skip very short names (less than 2 chars)
    if folder_name.len() < 2 {
        return true;
    }

    false
}

/// Calculate Levenshtein distance between two strings
pub fn levenshtein(a: &str, b: &str) -> usize {
    let a_len = a.chars().count();
    let b_len = b.chars().count();

    if a_len == 0 {
        return b_len;
    }
    if b_len == 0 {
        return a_len;
    }

    let mut matrix = vec![vec![0; b_len + 1]; a_len + 1];

    for (i, row) in matrix.iter_mut().enumerate() {
        row[0] = i;
    }

    for j in 1..=b_len {
        matrix[0][j] = j;
    }

    for (i, ca) in a.chars().enumerate() {
        for (j, cb) in b.chars().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            matrix[i + 1][j + 1] = std::cmp::min(
                std::cmp::min(matrix[i][j + 1] + 1, matrix[i + 1][j] + 1),
                matrix[i][j] + cost,
            );
        }
    }

    matrix[a_len][b_len]
}

/// Format IGDB cover URL to full size
pub fn format_cover_url(url: &str) -> String {
    if url.starts_with("//") {
        format!(
            "https:{}",
            url.replace("t_thumb", "t_cover_big")
        )
    } else if url.starts_with("http://") {
        url.replace("http://", "https://")
            .replace("t_thumb", "t_cover_big")
    } else if url.starts_with("https://") {
        url.replace("t_thumb", "t_cover_big")
    } else {
        format!(
            "https://{}",
            url.replace("t_thumb", "t_cover_big")
        )
    }
}

/// Clean a folder name by removing scene tags, version numbers, platform info, etc.
pub fn clean_folder_name(name: &str) -> String {
    let re_scene = regex::Regex::new(
        r"(?i)\s*[\[\(].*?(fitgirl|codex|skidrow|reloaded|plaza|cpy|elmomomo|darck|gog|steam|epic|dodi|r\s*g\s*mechanics|kaoskrew|empress|hoodlum|elamigos|insaneramzes|razor1911|tenoke|runne|blackbox|corepack|repack|rip).*?[\]\)]",
    )
    .unwrap();
    // Handle trailing repack names without brackets (e.g., "Game - FitGirl Repack", "Game v1.0 - DODI Repack")
    let re_trailing_repack = regex::Regex::new(
        r"(?i)\s*[-–—]\s*(fitgirl|dodi|r\s*g\s*mechanics|kaoskrew|empress|hoodlum|elamigos|insaneramzes|razor1911|tenoke|runne|blackbox|corepack|repacks?)\s*(repack|rip)?$",
    )
    .unwrap();
    let re_version = regex::Regex::new(r"(?i)\s*v?\d+\.\d+(\.\d+)*(\s+build\s+\d+)?").unwrap();
    // Handle build dates and version info in brackets (e.g., "[Build 2024.03.05]", "[v1.2.3]")
    // Match [Build ...] or [version ...] patterns with any content inside
    let re_build_info = regex::Regex::new(
        r"(?i)\s*[\[\(]\s*(build|version|v)\s+[^\]]+[\]\)]",
    )
    .unwrap();
    let re_platform =
        regex::Regex::new(r"(?i)\s*[\[(](windows|linux|mac|multi\d*).*?[\])]").unwrap();
    let re_lang = regex::Regex::new(
        r"(?i)\s*[\[(](fr|en|de|es|it|ru|multi|multilang).*?[\])]",
    )
    .unwrap();
    let re_fill = regex::Regex::new(r"[._]{2,}").unwrap();
    // Normalize separators: replace hyphens, underscores and dots with spaces for better matching
    let re_separators = regex::Regex::new(r"[-_.]").unwrap();
    // Handle apostrophes variations (smart quotes, straight quotes)
    let re_apostrophe = regex::Regex::new(r"[''′']").unwrap();

    let cleaned = re_scene.replace_all(name, "");
    let cleaned = re_trailing_repack.replace_all(&cleaned, "");
    let cleaned = re_build_info.replace_all(&cleaned, "");
    let cleaned = re_version.replace_all(&cleaned, "");
    let cleaned = re_platform.replace_all(&cleaned, "");
    let cleaned = re_lang.replace_all(&cleaned, "");
    // Normalize apostrophes to standard single quote
    let cleaned = re_apostrophe.replace_all(&cleaned, "'");
    // Replace multiple separators with single space
    let cleaned = re_fill.replace_all(&cleaned, " ");
    // Replace single hyphens/underscores with spaces
    let cleaned = re_separators.replace_all(&cleaned, " ");
    let cleaned = cleaned.trim().to_string();

    if cleaned.is_empty() {
        name.trim().to_string()
    } else {
        cleaned
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_levenshtein() {
        assert_eq!(levenshtein("", ""), 0);
        assert_eq!(levenshtein("abc", "abc"), 0);
        assert_eq!(levenshtein("abc", "abd"), 1);
        assert_eq!(levenshtein("kitten", "sitting"), 3);
    }

    #[test]
    fn test_format_cover_url() {
        assert_eq!(
            format_cover_url("//images.igdb.com/igdb/image/upload/t_thumb/co1.jpg"),
            "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg"
        );
        assert_eq!(
            format_cover_url("http://images.igdb.com/t_thumb/co1.jpg"),
            "https://images.igdb.com/t_cover_big/co1.jpg"
        );
        assert_eq!(
            format_cover_url("https://images.igdb.com/t_thumb/co1.jpg"),
            "https://images.igdb.com/t_cover_big/co1.jpg"
        );
    }

    #[test]
    fn test_clean_folder_name() {
        assert_eq!(clean_folder_name("Game Name"), "Game Name");
        assert_eq!(
            clean_folder_name("Game Name [FitGirl Repack]"),
            "Game Name"
        );
        assert_eq!(
            clean_folder_name("Game Name v1.0.0"),
            "Game Name"
        );
        assert_eq!(
            clean_folder_name("Game Name [Windows]"),
            "Game Name"
        );
        // New repack patterns
        assert_eq!(
            clean_folder_name("Final Fantasy XVI - R G Mechanics"),
            "Final Fantasy XVI"
        );
        assert_eq!(
            clean_folder_name("Elden Ring v1.10 - DODI Repack"),
            "Elden Ring"
        );
        assert_eq!(
            clean_folder_name("Cyberpunk 2077 - FitGirl Repack"),
            "Cyberpunk 2077"
        );
        assert_eq!(
            clean_folder_name("Hogwarts Legacy [Build 2024.03.05] - KaOsKrew"),
            "Hogwarts Legacy"
        );
        assert_eq!(
            clean_folder_name("Grand Theft Auto V v1.0.3095-EMPRESS"),
            "Grand Theft Auto V"
        );
        assert_eq!(
            clean_folder_name("Resident Evil 4 Remake - [HOODLUM]"),
            "Resident Evil 4 Remake"
        );
        assert_eq!(
            clean_folder_name("God.of.War.Ragnarok.PC-InsaneRamZes"),
            "God of War Ragnarok PC"
        );
        assert_eq!(
            clean_folder_name("The.Witcher.3.Wild.Hunt.Complete.Edition-ElAmigos"),
            "The Witcher 3 Wild Hunt Complete Edition"
        );
    }

    #[test]
    fn test_should_skip_folder() {
        assert!(should_skip_folder("Windows", &[]));
        assert!(should_skip_folder(".git", &[]));
        assert!(should_skip_folder("update", &[]));
        assert!(should_skip_folder("v1.0.0", &[]));
        assert!(!should_skip_folder("Elden Ring", &[]));
        assert!(should_skip_folder("game", &["game".to_string()]));
    }
}
