---
read_when:
    - Exécution d’OpenClaw Gateway dans WSL2 pendant que Chrome s’exécute sur Windows
    - Observation d’erreurs qui se chevauchent entre navigateur et interface de contrôle sur WSL2 et Windows
    - Choix entre Chrome MCP local à l’hôte et CDP distant brut dans des configurations à hôtes séparés
summary: Dépanner par couches Gateway WSL2 + CDP Chrome distant sous Windows
title: Dépannage WSL2 + Windows + CDP Chrome distant
x-i18n:
    generated_at: "2026-04-05T12:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Dépannage WSL2 + Windows + CDP Chrome distant

Ce guide couvre la configuration à hôtes séparés la plus courante où :

- OpenClaw Gateway s’exécute dans WSL2
- Chrome s’exécute sur Windows
- le contrôle du navigateur doit traverser la frontière WSL2/Windows

Il couvre également le schéma de panne par couches de [l’issue #39369](https://github.com/openclaw/openclaw/issues/39369) : plusieurs problèmes indépendants peuvent apparaître en même temps, ce qui peut donner l’impression que la mauvaise couche est cassée en premier.

## Choisissez d’abord le bon mode de navigateur

Vous avez deux approches valides :

### Option 1 : CDP distant brut de WSL2 vers Windows

Utilisez un profil de navigateur distant qui pointe depuis WSL2 vers un point de terminaison CDP Chrome sur Windows.

Choisissez cette option quand :

- la Gateway reste dans WSL2
- Chrome s’exécute sur Windows
- vous avez besoin que le contrôle du navigateur traverse la frontière WSL2/Windows

### Option 2 : Chrome MCP local à l’hôte

Utilisez `existing-session` / `user` uniquement lorsque la Gateway elle-même s’exécute sur le même hôte que Chrome.

Choisissez cette option quand :

- OpenClaw et Chrome s’exécutent sur la même machine
- vous voulez l’état local du navigateur déjà connecté
- vous n’avez pas besoin d’un transport de navigateur inter-hôte
- vous n’avez pas besoin de routes avancées gérées ou réservées au CDP brut comme `responsebody`, l’export PDF, l’interception de téléchargements ou les actions par lot

Pour une Gateway WSL2 + Chrome sous Windows, préférez le CDP distant brut. Chrome MCP est local à l’hôte, pas un pont de WSL2 vers Windows.

## Architecture fonctionnelle

Structure de référence :

- WSL2 exécute la Gateway sur `127.0.0.1:18789`
- Windows ouvre l’interface de contrôle dans un navigateur normal sur `http://127.0.0.1:18789/`
- Chrome sous Windows expose un point de terminaison CDP sur le port `9222`
- WSL2 peut atteindre ce point de terminaison CDP Windows
- OpenClaw pointe un profil de navigateur vers l’adresse joignable depuis WSL2

## Pourquoi cette configuration prête à confusion

Plusieurs pannes peuvent se chevaucher :

- WSL2 ne peut pas atteindre le point de terminaison CDP Windows
- l’interface de contrôle est ouverte depuis une origine non sécurisée
- `gateway.controlUi.allowedOrigins` ne correspond pas à l’origine de la page
- le token ou l’appairage manque
- le profil de navigateur pointe vers la mauvaise adresse

À cause de cela, corriger une couche peut quand même laisser une autre erreur visible.

## Règle critique pour l’interface de contrôle

Quand l’interface est ouverte depuis Windows, utilisez localhost Windows sauf si vous avez une configuration HTTPS délibérée.

Utilisez :

`http://127.0.0.1:18789/`

N’utilisez pas par défaut une IP LAN pour l’interface de contrôle. Le HTTP simple sur une adresse LAN ou tailnet peut déclencher un comportement d’origine non sécurisée / d’authentification d’appareil sans rapport avec le CDP lui-même. Voir [Interface de contrôle](/web/control-ui).

## Validez par couches

Travaillez de haut en bas. Ne sautez pas d’étapes.

### Couche 1 : Vérifier que Chrome sert bien le CDP sur Windows

Démarrez Chrome sur Windows avec le débogage à distance activé :

```powershell
chrome.exe --remote-debugging-port=9222
```

Depuis Windows, vérifiez d’abord Chrome lui-même :

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Si cela échoue sur Windows, OpenClaw n’est pas encore en cause.

### Couche 2 : Vérifier que WSL2 peut atteindre ce point de terminaison Windows

Depuis WSL2, testez l’adresse exacte que vous prévoyez d’utiliser dans `cdpUrl` :

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bon résultat :

- `/json/version` renvoie du JSON avec les métadonnées Browser / Protocol-Version
- `/json/list` renvoie du JSON (un tableau vide convient s’il n’y a aucune page ouverte)

Si cela échoue :

- Windows n’expose pas encore le port à WSL2
- l’adresse est incorrecte du point de vue de WSL2
- le pare-feu / la redirection de port / le proxy local manque encore

Corrigez cela avant de toucher à la configuration OpenClaw.

### Couche 3 : Configurer le bon profil de navigateur

Pour le CDP distant brut, faites pointer OpenClaw vers l’adresse joignable depuis WSL2 :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Remarques :

- utilisez l’adresse joignable depuis WSL2, pas celle qui fonctionne uniquement sous Windows
- conservez `attachOnly: true` pour les navigateurs gérés de manière externe
- `cdpUrl` peut être `http://`, `https://`, `ws://` ou `wss://`
- utilisez HTTP(S) quand vous voulez qu’OpenClaw découvre `/json/version`
- utilisez WS(S) uniquement quand le fournisseur du navigateur vous donne une URL de socket DevTools directe
- testez la même URL avec `curl` avant de vous attendre à ce qu’OpenClaw fonctionne

### Couche 4 : Vérifier séparément la couche de l’interface de contrôle

Ouvrez l’interface depuis Windows :

`http://127.0.0.1:18789/`

Puis vérifiez :

- que l’origine de la page correspond à ce qu’attend `gateway.controlUi.allowedOrigins`
- que l’authentification par token ou l’appairage est correctement configuré
- que vous n’êtes pas en train de déboguer un problème d’authentification de l’interface de contrôle comme s’il s’agissait d’un problème de navigateur

Page utile :

- [Interface de contrôle](/web/control-ui)

### Couche 5 : Vérifier le contrôle de navigateur de bout en bout

Depuis WSL2 :

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Bon résultat :

- l’onglet s’ouvre dans Chrome sous Windows
- `openclaw browser tabs` renvoie la cible
- les actions suivantes (`snapshot`, `screenshot`, `navigate`) fonctionnent depuis le même profil

## Erreurs trompeuses fréquentes

Traitez chaque message comme un indice propre à une couche :

- `control-ui-insecure-auth`
  - problème d’origine d’interface / de contexte sécurisé, pas un problème de transport CDP
- `token_missing`
  - problème de configuration de l’authentification
- `pairing required`
  - problème d’approbation de l’appareil
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 ne peut pas atteindre le `cdpUrl` configuré
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - le point de terminaison HTTP a répondu, mais le WebSocket DevTools n’a toujours pas pu être ouvert
- remplacements persistants de viewport / mode sombre / paramètres régionaux / mode hors ligne après une session distante
  - exécutez `openclaw browser stop --browser-profile remote`
  - cela ferme la session de contrôle active et libère l’état d’émulation Playwright/CDP sans redémarrer la Gateway ni le navigateur externe
- `gateway timeout after 1500ms`
  - il s’agit souvent encore d’un problème de joignabilité CDP ou d’un point de terminaison distant lent ou inaccessible
- `No Chrome tabs found for profile="user"`
  - profil Chrome MCP local à l’hôte sélectionné alors qu’aucun onglet local à cet hôte n’est disponible

## Checklist de triage rapide

1. Windows : est-ce que `curl http://127.0.0.1:9222/json/version` fonctionne ?
2. WSL2 : est-ce que `curl http://WINDOWS_HOST_OR_IP:9222/json/version` fonctionne ?
3. Configuration OpenClaw : est-ce que `browser.profiles.<name>.cdpUrl` utilise exactement cette adresse joignable depuis WSL2 ?
4. Interface de contrôle : ouvrez-vous `http://127.0.0.1:18789/` au lieu d’une IP LAN ?
5. Essayez-vous d’utiliser `existing-session` entre WSL2 et Windows au lieu du CDP distant brut ?

## Conclusion pratique

Cette configuration est généralement viable. La difficulté vient du fait que le transport du navigateur, la sécurité d’origine de l’interface de contrôle et le token / l’appairage peuvent chacun échouer indépendamment tout en se ressemblant du point de vue de l’utilisateur.

En cas de doute :

- vérifiez d’abord localement le point de terminaison Chrome Windows
- vérifiez ensuite ce même point de terminaison depuis WSL2
- ne déboguez la configuration OpenClaw ou l’authentification de l’interface de contrôle qu’après cela
