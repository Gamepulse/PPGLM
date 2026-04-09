# Pascal's Personal Game Library Manager (PPGLM)

A modern desktop application for managing your game library. Scans your folders, automatically fetches game metadata from IGDB, and organizes your collection with tags, ratings, and notes.

![Pascal](https://img.shields.io/badge/version-0.4.1-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **📁 Smart Folder Scanning** - Scan game directories with automatic detection and matching
- **🎮 IGDB Integration** - Automatically fetches game metadata (synopsis, ratings, genres, game modes, themes)
- **⭐ Personal Ratings** - Rate your games and add personal notes
- **🏷️ Tag System** - Organize games with custom tags and categories
- **🌐 Multi-language** - English and French support
- **🌓 Themes** - Dark and light mode
- **💾 Local Database** - All data stored locally in SQLite
- **📤 Export/Import** - Backup and restore your collection
- **🚀 Game Launcher** - Launch games directly from the app
- **➕ Quick Add** - Manually add games with IGDB integration
- **📊 Statistics** - View library analytics and insights
- **📁 Collections** - Organize games into custom collections
- **📸 Screenshots** - Add and manage game screenshots
- **🔍 Search History** - Track your search activity
- **⭐ Favorites** - Mark games as favorites
- **⏱️ Play Time** - Track hours played per game
- **🎯 Completion Status** - Track game completion (Not Started, Playing, Completed, Dropped, Wishlist)
- **💿 Cross-Platform** - Windows, macOS, and Linux support

## Screenshots

*Coming soon*

## Installation

### From Release

Download the latest installer for your platform from the [Releases page](https://github.com/Gamepulse/PPGLM/releases):

| Platform | File | Instructions |
|----------|------|--------------|
| Windows | `.msi` | Run the installer |
| Windows | `.msix` | Microsoft Store package (install via Store or sideload) |
| macOS | `.dmg` | Open the DMG, drag to Applications |
| Linux | `.AppImage` or `.deb` | `chmod +x` then run, or install with `dpkg` |

### Microsoft Store (Recommended for Windows)

Get the official release from the Microsoft Store for automatic updates and trusted installation:
- No Windows SmartScreen warnings
- Automatic updates
- Clean installation/uninstallation
- [Pascal on Microsoft Store](https://apps.microsoft.com/) *(coming soon)*

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.70+
- [Git](https://git-scm.com/)

**Platform-specific requirements:**

| Platform | Additional Requirements |
|----------|------------------------|
| Linux | `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` |
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Windows | Microsoft Visual Studio C++ Build Tools |

#### Steps

```bash
# Clone the repository
git clone https://github.com/Gamepulse/PPGLM.git
cd PPGLM

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Or build for production
npm run tauri build
```

The built installer will be in `src-tauri/target/release/bundle/` (subfolder varies by platform)

## Usage

### Getting Started

1. **Configure IGDB API** (optional but recommended)
   - Go to [IGDB API](https://www.igdb.com/api) and get credentials
   - Open Pascal → Settings → IGDB Credentials
   - Enter your Client ID and Client Secret

2. **Add Game Folders**
   - Go to Scanner → Add Folder
   - Select your game directories (e.g., `~/Games`, `/mnt/games`, `D:\SteamLibrary`)

3. **Scan**
   - Click "Scan All Folders" to discover games
   - Pascal will automatically match folders with IGDB database

### Game Details

Click on any game to see its details:
- **Synopsis** - Game description from IGDB
- **Community Rating** - IGDB user rating
- **Genres** - Game categories
- **Game Modes** - Single player, multiplayer, etc.
- **Perspectives** - First person, third person, etc.
- **Personal Rating** - Your own 1-100 rating
- **Notes** - Your personal comments
- **Tags** - Custom organization
- **Completion Status** - Track your progress
- **Play Time** - Hours played
- **Favorites** - Mark games you love
- **Screenshots** - View and add screenshots
- **Launch** - Start the game directly

### Refresh from IGDB

If game data is missing or outdated, click "Refresh from IGDB" on the game detail page to fetch the latest information.

### Collections & Statistics

- **Collections** - Group games into custom collections (e.g., "Favorites", "To Play", "Completed")
- **Statistics** - View insights about your library: total games, play time, ratings distribution, completion status

## Configuration

### Settings

| Setting | Description |
|---------|-------------|
| Language | English / Français |
| Theme | Dark / Light |
| IGDB Credentials | API access for game metadata |
| Scan Files | Also scan individual game files |
| Folder Exclusions | Patterns to exclude from scanning |
| Quick Add | Manually add games to your library |
| CSV Export | Export your collection to CSV format |

### Database Location

All data is stored in:
- Windows: `%APPDATA%\com.pascal.gamemanager\pascal.db`
- macOS: `~/Library/Application Support/com.pascal.gamemanager/pascal.db`
- Linux: `~/.local/share/com.pascal.gamemanager/pascal.db`

## Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Backend**: Rust, Tauri 2.0
- **Database**: SQLite
- **API**: IGDB (Internet Game Database)

## Project Structure

```
pascal/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # React hooks
│   ├── i18n/              # Translations
│   ├── theme/             # Theme configuration
│   └── types/             # TypeScript types
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri commands
│   │   ├── db/            # Database & migrations
│   │   └── models/        # Data models
│   └── Cargo.toml
├── docs/                  # Documentation
└── package.json
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [IGDB](https://www.igdb.com/) for providing the game database API
- [Tauri](https://tauri.app/) for the desktop framework
