## 🔐 Code Signed Release v0.4.1

### What's New in v0.4.1

**Bug Fix:**
- ✅ Fixed "2 parameter passed, need one" error in delete games by scan path feature

**New Features:**
- 🎮 Game launcher functionality
- ➕ Quick add games manually with IGDB integration
- 📊 Statistics dashboard for library analytics
- 📁 Collections support
- 📸 Screenshots management
- 🔍 Search history tracking
- 🏷️ Enhanced tagging system
- ⭐ Favorites, play time tracking, completion status
- 📤 CSV export for collections

### 🔒 Security
- ✅ Digitally signed with SignPath.io certificate
- ✅ SHA-256 signature
- ✅ Timestamped signature

### Downloads
| File | Size | Description |
|------|------|-------------|
| **Pascal_0.4.1_x64_signed.msi** | ~5.7 MB | Windows Installer (Signed) |

### Installation
1. Download the MSI file above
2. Double-click to run
3. If Windows SmartScreen appears, click "More info" → "Run anyway"
4. Follow the installation wizard

### Note on Windows Warnings
Even though this installer is digitally signed, Windows Defender/SmartScreen may still show a warning because:
- This is a new release that hasn't built up reputation yet
- The certificate is valid but not from a major commercial CA
- SmartScreen learns over time as more users install the software

The signature IS valid - you can verify by:
1. Right-click the MSI → Properties → Digital Signatures tab
2. Check that signature status shows "This digital signature is OK"

---
**Full Changelog:** https://github.com/Gamepulse/PPGLM/commits/v0.4.1