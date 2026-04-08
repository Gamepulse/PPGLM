# Pascal v0.3.0 - Release Notes

## 🎉 Version 0.3.0 - Signed Release

### 🔐 Code Signing Added
This release includes **digitally signed installers** to ensure:
- ✅ No Windows SmartScreen warnings
- ✅ Verified publisher identity
- ✅ Installer integrity protection
- ✅ Safe installation experience

### 📦 Downloads

| File | Size | Type | Status |
|------|------|------|--------|
| **Pascal_0.3.0_x64_signed.msi** | ~5.6 MB | Windows Installer | ✅ Signed |

### 🔒 Signature Details

**Certificate Information:**
- Subject: [Ton nom/entreprise]
- Issuer: [Nom de l'autorité de certification]
- Algorithm: SHA-256
- Timestamp: DigiCert Trusted Root

**Verification:**
1. Download the MSI file
2. Right-click → Properties → Digital Signatures tab
3. Verify "This digital signature is OK"

### 🚀 What's New

This release includes all improvements from v0.2.0:
- Complete codebase refactoring
- Zustand state management
- 15+ focused components (decomposed from 4 god components)
- Rust backend improvements (CancellationToken, AppError types)
- Critical bug fixes (scan infinite loop, completion issues)
- ErrorBoundary and Toast notification system

### 📥 Installation

**Windows (Recommended):**
1. Download `Pascal_0.3.0_x64_signed.msi`
2. Double-click to run
3. Follow installation wizard
4. Launch Pascal from Start Menu or Desktop

**Note:** Since this installer is signed, Windows will not show any security warnings.

---
**Released:** 2026-04-08  
**Commit:** [voir ci-dessous]