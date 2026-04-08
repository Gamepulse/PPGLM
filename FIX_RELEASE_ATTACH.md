# 🔧 SOLUTION: Attacher le MSI à la Release GitHub

## Le problème
Le fichier MSI est **commité dans le repo git**, mais GitHub releases nécessitent un **upload séparé** des binaires.

## Solution rapide (2 minutes)

### Étape 1: Va sur la release
https://github.com/Gamepulse/PPGLM/releases/edit/v0.3.0

### Étape 2: Édite la release
Clique sur le crayon ✏️ (Edit)

### Étape 3: Attache le fichier
Descends jusqu'à la section **"Attach binaries"**

1. **Option A - Glisser-déposer:**
   - Glisse le fichier `Pascal_0.3.0_x64_signed.msi` depuis ton PC
   - Attends l'upload (barre de progression)

2. **Option B - Sélectionner:**
   - Clique "Attach binaries by dropping them here"
   - Sélectionne `Pascal_0.3.0_x64_signed.msi`

### Étape 4: Sauvegarde
Clique **"Update release"**

---

## ⚠️ Important

**Ne supprime PAS le fichier du repo!** Il doit être:
1. ✅ Dans le repo git (déjà fait)
2. ✅ Attaché à la release (à faire maintenant)

Les 2 sont nécessaires:
- Le repo conserve l'historique
- La release permet le téléchargement direct

---

## Alternative: Ligne de commande (si tu as gh CLI)

```powershell
# Upload direct
gh release upload v0.3.0 "Pascal_0.3.0_x64_signed.msi" --clobber
```

Mais comme gh CLI n'est pas installé, utilise l'interface web ci-dessus.

---

## ✅ Une fois fait

Sur https://github.com/Gamepulse/PPGLM/releases/tag/v0.3.0
tu verras:

```
Assets (1)
📦 Pascal_0.3.0_x64_signed.msi    5.6 MB
```

Et un bouton vert "Download" 💚