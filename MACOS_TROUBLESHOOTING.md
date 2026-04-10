# Guide macOS - Résolution des problèmes d'ouverture

## Problème
L'application Pascal ne s'ouvre pas sur macOS avec ce message :
> "Pascal" ne peut pas être ouvert car le développeur ne peut pas être vérifié.

## Cause
macOS Gatekeeper bloque les applications non signées téléchargées depuis Internet pour des raisons de sécurité.

## Solution 1 : Ouvrir avec le clic droit (Recommandée)
1. Ne **double-cliquez pas** sur l'application
2. Faites un **clic droit** (ou Ctrl+clic) sur l'icône Pascal
3. Sélectionnez **"Ouvrir"** dans le menu contextuel
4. Cliquez sur **"Ouvrir"** dans la boîte de dialogue de sécurité

## Solution 2 : Préférences Système
Si la Solution 1 ne fonctionne pas :
1. Allez dans **Préférences Système** > **Sécurité et confidentialité**
2. En bas de la fenêtre, vous verrez un message disant que Pascal a été bloqué
3. Cliquez sur **"Ouvrir quand même"**

## Solution 3 : Terminal (Avancé)
Si les solutions ci-dessus ne fonctionnent pas :
```bash
# Supprimer l'attribut de quarantaine
xattr -cr /Applications/Pascal.app

# Ou pour un .dmg monté
xattr -cr /Volumes/Pascal/Pascal.app
```

## Solution permanente : Désactiver Gatekeeper (Non recommandée)
⚠️ **Attention** : Cela réduit la sécurité de votre Mac
```bash
sudo spctl --master-disable
```

Pour réactiver :
```bash
sudo spctl --master-enable
```

## Solution complète : Signature de code
Pour une expérience utilisateur parfaite, l'application doit être signée avec un certificat Apple Developer payant (99$/an). 

### Pour les développeurs :
1. Obtenez un compte Apple Developer
2. Créez un certificat de distribution macOS
3. Configurez les secrets GitHub :
   - `APPLE_CERTIFICATE`
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_SIGNING_IDENTITY`
   - `APPLE_ID`
   - `APPLE_PASSWORD`
   - `APPLE_TEAM_ID`

## Notes
- macOS Catalina (10.15) et versions ultérieures sont plus strictes
- Les Mac avec puce Apple Silicon (M1/M2/M3) nécessitent des applications signées pour certaines fonctionnalités

## Support
Si vous continuez à avoir des problèmes :
1. Vérifiez que vous utilisez macOS 10.13 ou plus récent
2. Assurez-vous d'avoir suffisamment d'espace disque
3. Essayez de redémarrer votre Mac
4. Ouvrez une issue sur GitHub : https://github.com/Gamepulse/PPGLM/issues
