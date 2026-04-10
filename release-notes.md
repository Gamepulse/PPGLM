# Pascal's Personal Game Manager v0.5.0

## What's New

### ✨ Features
- **Updated App Identity**: Changed from "Pascal Game Manager" to "Pascal's Personal Game Manager" across all UI elements
- **Persistent Filters**: Filters now persist when navigating between pages (library, game detail, statistics)
- **Backend Metadata Loading**: Games now load complete metadata (tags, genres, modes, perspectives, themes) for proper client-side filtering

### 🐛 Bug Fixes
- **Fixed Scan Duplication**: Scan results no longer duplicate when expanding/collapsing the folder menu during a scan
- **Fixed Thumbnail Backgrounds**: Thumbnails now have proper dark backgrounds (gray-800) for better visibility in light themes
- **Fixed Filter Updates**: Filters now properly trigger game list updates when added
- **Fixed Duplicate Titles**: Changed duplicate "Dossiers de scan" headers - now shows "Scanner" for the section header

### 🔧 Technical Changes
- Lifted filter state from `GameList` component to `App` level for persistence
- Added proper event listener cleanup in `FolderPicker` to prevent memory leaks and duplicate events
- Fixed stale closure issue in `useEffect` that was preventing filter updates
- Added metadata loading in Rust backend `get_games` function

## Installation

Download the appropriate installer for your platform:
- **Windows**: `Pascal_0.5.0_x64-setup.exe`
- **macOS**: `Pascal_0.5.0_x64.dmg`
- **Linux**: `pascal_0.5.0_amd64.deb` or `pascal_0.5.0_amd64.AppImage`

## Contributors

Developed with ❤️ by the Pascal team
