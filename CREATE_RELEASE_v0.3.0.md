# 🚀 Créer la Release v0.3.0 sur GitHub

## URL
https://github.com/Gamepulse/PPGLM/releases/new?tag=v0.3.0

## Informations à remplir :

### Title
```
Pascal v0.3.0 - Signed Release
```

### Description (copie-colle ceci) :
```markdown
## 🔐 Code Signed Release

This is the **first digitally signed release** of Pascal!

### Security Features
✅ **Digitally Signed MSI** - No Windows SmartScreen warnings  
✅ **Verified Publisher** - Identity confirmed by certificate authority  
✅ **SHA-256 Hash** - Modern cryptographic signature  
✅ **Timestamped** - Signature valid even after certificate expires  

### Verification
After downloading, right-click the MSI → Properties → Digital Signatures tab:
- Signature status: "This digital signature is OK"
- Signer: [Ton nom/entreprise]
- Algorithm: sha256RSA
- Timestamp: DigiCert

### Download
| File | Size | Description |
|------|------|-------------|
| **Pascal_0.3.0_x64_signed.msi** | 5.6 MB | Windows Installer (Signed) |

### Installation
1. Download the MSI file above
2. Double-click to run (no security warnings!)
3. Follow the installation wizard
4. Launch Pascal from Start Menu

### What's Included
All improvements from the refactoring:
- 15+ focused UI components
- Zustand state management
- Rust backend with CancellationToken
- Fixed scan infinite loop bugs
- ErrorBoundary + Toast notifications

---
**Note:** This installer is code-signed. Windows Defender will not show any warnings.
```

## Attacher le fichier :

1. Dans la section "Attach binaries", glisse :
   - `Pascal_0.3.0_x64_signed.msi` (depuis ton PC)

2. **OU** si tu veux utiliser celui dans le repo :
   - Le fichier est maintenant dans le repo à la racine
   - Tu peux le télécharger depuis GitHub après le push

3. Clique **"Publish release"**

## ✅ Après publication

La release v0.3.0 contiendra :
- Le commit `4454895`
- Le fichier MSI signé attaché
- Des explications détaillées sur la signature