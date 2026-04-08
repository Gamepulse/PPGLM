# Procédure Signature + Upload Release v0.2.0

## 1. Signer le MSI

**Prérequis:** Certificat .pfx + Windows SDK (signtool.exe)

```powershell
signtool.exe sign `
  /f "C:\chemin\vers\certificat.pfx" `
  /p "TON_MOT_DE_PASSE" `
  /tr http://timestamp.digicert.com `
  /td sha256 `
  /fd sha256 `
  "C:\Coding\Pascal\src-tauri\target\release\bundle\msi\Pascal_0.2.0_x64_en-US.msi"
```

**Vérification:** Clic droit → Propriétés → Signatures numériques

## 2. Renommer
```powershell
Copy-Item `
  "src-tauri\target\release\bundle\msi\Pascal_0.2.0_x64_en-US.msi" `
  "src-tauri\target\release\bundle\msi\Pascal_0.2.0_x64_en-US_signed.msi"
```

## 3. Upload sur GitHub Release

**URL:** https://github.com/Gamepulse/PPGLM/releases/tag/v0.2.0

**Actions:**
1. Clique "Edit" (✏️)
2. Supprime les 2 anciens fichiers (🗑️):
   - ❌ Pascal_0.2.0_x64_en-US.msi
   - ❌ Pascal_0.2.0_x64-setup.exe
3. Upload le nouveau:
   - ✅ Pascal_0.2.0_x64_en-US_signed.msi
4. "Update release"

## Résultat attendu

Release v0.2.0 contient UN SEUL fichier:
- ✅ Pascal_0.2.0_x64_en-US_signed.msi (5.6 MB)

---
**Note:** Je ne peux pas signer à ta place car cela nécessite ton certificat privé (.pfx).