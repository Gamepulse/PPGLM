# Guide de Publication sur le Microsoft Store

## 📦 Package MSIX Prêt

**Package créé :** `Zentik.PascalGameManager_0.4.1.0_x64.msix`
**Localisation :** `C:\Coding\Pascal\Zentik.PascalGameManager_0.4.1.0_x64.msix`

---

## 🚀 Étapes pour Publier sur le Microsoft Store

### Étape 1 : Compte Développeur Microsoft (Requis)

1. Allez sur : https://developer.microsoft.com/en-us/microsoft-store
2. Cliquez sur **"Sign up"** pour créer un compte
3. Payez les **$19 USD** (frais d'inscription unique)
4. Complétez la vérification de l'identité

### Étape 2 : Se Connecter au Partner Center

1. Allez sur : https://partner.microsoft.com/dashboard
2. Connectez-vous avec votre compte Microsoft
3. Acceptez les termes du développeur

### Étape 3 : Créer une Nouvelle Application

1. Dans le Partner Center, cliquez sur **"Créer une application"**
2. Sélectionnez **"Application Windows"** (pas jeu)
3. Choisissez **"Créer une nouvelle application par nom"**

### Étape 4 : Réserver le Nom de l'Application

1. Entrez **"Pascal"** ou **"Pascal Game Manager"**
2. Si le nom est disponible, cliquez sur **"Réserver le nom du produit"**
3. Si déjà pris, essayez des variantes comme :
   - "Pascal Game Library"
   - "Pascal Personal Game Manager"
   - "Zentik Pascal"

### Étape 5 : Configurer les Informations de l'Application

**Section "Informations de l'application" :**

- **Nom d'affichage :** Pascal
- **Description :** Personal Game Library Manager - Track, rate, and launch your games
- **Description courte :** Track and manage your game collection
- **Mots-clés :** games, library, manager, steam, igdb, collection

**Section "Systèmes et fonctionnalités" :**

- **Systèmes d'exploitation :** Windows 10/11
- **Architecture :** x64

### Étape 6 : Télécharger le Package MSIX

1. Allez dans l'onglet **"Packages"**
2. Cliquez sur **"Parcourir vos fichiers"**
3. Sélectionnez : `C:\Coding\Pascal\Zentik.PascalGameManager_0.4.1.0_x64.msix`
4. Attendez la validation du package
5. Cliquez sur **"Enregistrer"**

### Étape 7 : Ajouter les Captures d'Écran et Icônes

**Requis par Microsoft :**

1. **Icône Store :** 300x300 PNG (fourni dans Assets/StoreLogo.png)
2. **Captures d'écran :** Minimum 1 capture, recommandé 3-5
   - Résolution : 1366x768 ou 1920x1080
   - Format : PNG ou JPG
   - Montrez l'interface principale, la bibliothèque, les détails d'un jeu
3. **Caractéristiques :** 1366x768 (optionnel mais recommandé)

### Étape 8 : Configurer la Tarification et la Disponibilité

- **Tarification :** Gratuit (ou prix au choix)
- **Disponibilité :** Tous les marchés ou sélectionnez spécifiques
- **Date de publication :** Dès que possible (ou date spécifique)

### Étape 9 : Certificat de Confiance Microsoft

**Avantage clé :** Microsoft signera votre application avec leur propre certificat trusted !

1. Allez dans **"Gestion des produits"** > **"Identité de l'application"**
2. Notez le **Package Family Name (PFN)** généré par Microsoft
3. Mettez à jour le `appxmanifest.xml` avec ce PFN si nécessaire
4. Recréez le package MSIX avec `winapp pack .\dist`

### Étape 10 : Soumettre pour Certification

1. Vérifiez que toutes les sections sont complètes (indicateurs verts)
2. Cliquez sur **"Soumettre au Store"**
3. Sélectionnez **"Publier dès que la certification réussit"**
4. Cliquez sur **"Soumettre"**

---

## ⏱️ Timeline Attendue

- **Certification Microsoft :** 24-72 heures
- **Publication :** Immédiate après certification (ou à la date choisie)

---

## ✅ Avantages du Microsoft Store

1. **Aucun Warning Windows :** L'app est signée par Microsoft, 100% trusted
2. **Auto-Updates :** Les utilisateurs reçoivent automatiquement les mises à jour
3. **Désinstallation Propre :** L'app s'installe et se désinstalle proprement
4. **Sandboxing :** L'app s'exécute dans un environnement sécurisé
5. **Visibilité :** Disponible pour tous les utilisateurs Windows

---

## 🔄 Commandes pour Recréer le Package (si besoin)

```powershell
cd C:\Coding\Pascal

# Mettre à jour le manifeste si nécessaire
# Modifier appxmanifest.xml

# Recréer le package
winapp pack .\dist

# Le nouveau package sera : Zentik.PascalGameManager_0.4.1.0_x64.msix
```

---

## 📞 Support

Si vous avez des questions pendant le processus de soumission :
- **Documentation Microsoft :** https://docs.microsoft.com/en-us/windows/uwp/publish/
- **Support Partenaire :** https://partner.microsoft.com/dashboard/support

---

**Fichier prêt à soumettre :** `C:\Coding\Pascal\Zentik.PascalGameManager_0.4.1.0_x64.msix`

Bonne publication ! 🚀