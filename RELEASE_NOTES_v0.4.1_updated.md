## 🔐 Code Signed Release v0.4.1

### What's New in v0.4.1

**Bug Fix:**
- ✅ Fixed "2 parameter passed, need one" error in delete games by scan path feature

**New Features:**
- 🎮 Game launcher functionality - Launch games directly from Pascal
- ➕ Quick Add - Manually add games with IGDB integration
- 📊 Statistics Dashboard - View library analytics and insights
- 📁 Collections - Organize games into custom collections
- 📸 Screenshots Management - Add and manage game screenshots
- 🔍 Search History - Track your search activity
- ⭐ Favorites - Mark games as favorites
- ⏱️ Play Time Tracking - Track hours played per game
- 🎯 Completion Status - Track game completion (Not Started, Playing, Completed, Dropped, Wishlist)
- 📤 CSV Export - Export your collection to CSV format
- 🌐 Cross-Platform Support - Windows, macOS, and Linux builds

### 🔒 Security
- ✅ Digitally signed with SignPath.io certificate
- ✅ SHA-256 signature
- ✅ Timestamped signature

### 📦 Downloads

| Platform | File | Size | Description |
|----------|------|------|-------------|
| **Windows (MSI)** | `Pascal_0.4.1_x64_signed.msi` | ~5.7 MB | Windows Installer (Signed) - Recommended for most users |
| **Windows (MSIX)** | `Zentik.PascalGameManager_0.4.1.0_x64.msix` | ~5.7 MB | Microsoft Store package - For Store deployment or sideload |

### 🚀 Installation

#### Windows MSI (Recommended)
1. Download `Pascal_0.4.1_x64_signed.msi`
2. Double-click to run
3. If Windows SmartScreen appears, click "More info" → "Run anyway"
4. Follow the installation wizard

#### Windows MSIX (Microsoft Store Package)
1. Download `Zentik.PascalGameManager_0.4.1.0_x64.msix`
2. Right-click → "Install"
3. Or use PowerShell: `Add-AppxPackage .\Zentik.PascalGameManager_0.4.1.0_x64.msix`

### 🌐 Cross-Platform Support

This release includes cross-platform support:
- ✅ Windows (x64) - MSI and MSIX packages
- 🔄 macOS - Build from source with `cargo build --target x86_64-apple-darwin`
- 🔄 Linux - Build from source with standard Tauri build

See [GitHub Actions workflow](https://github.com/Gamepulse/PPGLM/blob/Dev/.github/workflows/build.yml) for automated multi-platform builds.

### 📋 About Windows Warnings

Even though this installer is digitally signed, Windows Defender/SmartScreen may still show a warning because:
- This is a new release that hasn't built up reputation yet
- The certificate is valid but not from a major commercial CA
- SmartScreen learns over time as more users install the software

**The signature IS valid** - you can verify by:
1. Right-click the MSI → Properties → Digital Signatures tab
2. Check that signature status shows "This digital signature is OK"

### 🆕 Database Location

All data is stored in:
- **Windows:** `%APPDATA%\com.pascal.gamemanager\pascal.db`
- **macOS:** `~/Library/Application Support/com.pascal.gamemanager/pascal.db`
- **Linux:** `~/.local/share/com.pascal.gamemanager/pascal.db`

### 📝 Full Changelog

See all changes: https://github.com/Gamepulse/PPGLM/commits/v0.4.1