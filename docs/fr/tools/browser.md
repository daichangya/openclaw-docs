---
read_when:
    - Ajout d’une automatisation de navigateur contrôlée par l’agent
    - Débogage des raisons pour lesquelles openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres + du cycle de vie du navigateur dans l’application macOS
summary: Service intégré de contrôle du navigateur + commandes d’action
title: Browser (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-24T07:35:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** contrôlé par l’agent.
Il est isolé de votre navigateur personnel et géré via un petit service de
contrôle local à l’intérieur du Gateway (loopback uniquement).

Vue pour débutant :

- Voyez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir** dans une voie sûre.
- Le profil intégré `user` s’attache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur séparé nommé **openclaw** (accent orange par défaut).
- Contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions d’agent (cliquer/saisir/glisser/sélectionner), instantanés, captures d’écran, PDF.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur quotidien. C’est une surface sûre et isolée pour
l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez le
Gateway.

Si `openclaw browser` est totalement absent, ou si l’agent dit que l’outil browser
est indisponible, allez à [Commande ou outil browser manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est un Plugin intégré. Désactivez-le pour le remplacer par un autre Plugin qui enregistre le même nom d’outil `browser` :

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le Plugin supprime d’un seul bloc le CLI `openclaw browser`, la méthode gateway `browser.request`, l’outil d’agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les changements de configuration browser nécessitent un redémarrage du Gateway afin que le Plugin puisse réenregistrer son service.

## Commande ou outil browser manquant

Si `openclaw browser` est inconnu après une mise à niveau, que `browser.request` est manquant, ou que l’agent signale que l’outil browser est indisponible, la cause habituelle est une liste `plugins.allow` qui omet `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, et `tools.alsoAllow: ["browser"]` ne remplacent pas l’appartenance à la liste d’autorisation — la liste d’autorisation filtre le chargement du Plugin, et la politique d’outils ne s’exécute qu’après le chargement. Supprimer complètement `plugins.allow` restaure également le comportement par défaut.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré, isolé (aucune extension requise).
- `user` : profil intégré d’attachement Chrome MCP pour votre **vraie session Chrome connectée**.

Pour les appels d’outils browser par l’agent :

- Par défaut : utiliser le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions connectées existantes comptent et que l’utilisateur
  est à l’ordinateur pour cliquer/approuver toute invite d’attachement.
- `profile` est la surcharge explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres browser se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Ports et accessibilité">

- Le service de contrôle se lie à loopback sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils locaux `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` ; ne définissez ceux-ci que pour le CDP distant. `cdpUrl` prend par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité HTTP CDP distantes (non loopback) ; `remoteCdpHandshakeTimeoutMs` s’applique aux poignées de main WebSocket CDP distantes.

</Accordion>

<Accordion title="Politique SSRF">

- La navigation browser et l’ouverture d’onglet sont protégées contre SSRF avant la navigation et revérifiées au mieux sur l’URL finale `http(s)` ensuite.
- En mode SSRF strict, la découverte du point de terminaison CDP distant et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès browser au réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie ne jamais lancer de navigateur local ; seulement s’y attacher s’il s’exécute déjà.
- `color` (niveau supérieur et par profil) teinte l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (standalone géré). Utilisez `defaultProfile: "user"` pour opter pour le navigateur utilisateur connecté.
- Ordre de détection automatique : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session doit s’attacher à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre **navigateur système par défaut** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
la détection automatique :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Ou définissez-le dans la configuration, selon la plateforme :

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Contrôle local vs distant

- **Contrôle local (par défaut) :** le Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; le Gateway y relaie les actions browser.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous attacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement à l’arrêt diffère selon le mode de profil :

- profils gérés locaux : `openclaw browser stop` arrête le processus navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distant : `openclaw browser stop` ferme la session de contrôle active
  et libère les surcharges d’émulation Playwright/CDP (viewport,
  schéma de couleurs, locale, fuseau horaire, mode hors ligne et état similaire), même
  si aucun processus navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex., `https://provider.example?token=<token>`)
- Auth Basic HTTP (par ex., `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lorsqu’il appelle les points de terminaison `/json/*` et lorsqu’il se connecte
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour
les jetons plutôt que de les committer dans les fichiers de configuration.

## Proxy browser Node (par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
router automatiquement les appels d’outils browser vers ce node sans configuration browser supplémentaire.
C’est le chemin par défaut pour les gateways distants.

Remarques :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du node (comme en local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils autorisés peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur le gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais
pour un profil de navigateur distant, l’option la plus simple est l’URL WebSocket directe
issue de la documentation de connexion Browserless.

Exemple :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Remarques :

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai jeton Browserless.
- Choisissez le point de terminaison de région correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Providers CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** au lieu de
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois formes d’URL
CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  s’y connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via une poignée de main WebSocket et ignore complètement
  `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw essaie d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  revient à une poignée de main WebSocket directe à la racine nue. Cela permet à une
  URL `ws://` nue pointant vers un Chrome local de tout de même se connecter, puisque Chrome n’accepte
  les upgrades WebSocket que sur le chemin spécifique par cible fourni par
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter des
navigateurs headless avec résolution intégrée des CAPTCHA, mode furtif, et proxies
résidentiels.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Remarques :

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **API Key**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc
  aucune étape de création manuelle de session n’est nécessaire.
- L’offre gratuite autorise une session concurrente et une heure de navigateur par mois.
  Voir [pricing](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API
  complète, les guides SDK et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité à loopback ; l’accès passe par l’authentification du Gateway ou l’appairage de node.
- L’API HTTP browser autonome sur loopback utilise **uniquement l’authentification par secret partagé** :
  authentification bearer par jeton gateway, `x-openclaw-password`, ou authentification Basic HTTP avec le mot de passe gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient **pas** cette API browser autonome sur loopback.
- Si le contrôle browser est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` vaut déjà
  `password`, `none`, ou `trusted-proxy`.
- Gardez le Gateway et tous les hôtes node sur un réseau privé (Tailscale) ; évitez l’exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez les variables d’environnement ou un gestionnaire de secrets.

Conseils CDP distant :

- Préférez des points de terminaison chiffrés (HTTPS ou WSS) et des jetons de courte durée lorsque c’est possible.
- Évitez d’intégrer directement des jetons longue durée dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance dédiée de navigateur basé sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via connexion automatique Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour l’attachement existing-session via Chrome MCP.
- Les profils existing-session sont opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués dans la plage **18800–18899** par défaut.
- Supprimer un profil déplace son répertoire de données local vers la Corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; le CLI utilise `--browser-profile`.

## Existing-session via Chrome DevTools MCP

OpenClaw peut aussi s’attacher à un profil de navigateur basé sur Chromium en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles sur le contexte et la configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous voulez un
nom, une couleur ou un répertoire de données de navigateur différent.

Comportement par défaut :

- Le profil intégré `user` utilise la connexion automatique Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium, ou un profil Chrome non par défaut :

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Puis, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Gardez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsqu’OpenClaw s’y attache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test smoke d’attachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble le succès :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets de navigateur déjà ouverts
- `snapshot` renvoie des refs depuis l’onglet actif sélectionné

Ce qu’il faut vérifier si l’attachement ne fonctionne pas :

- le navigateur basé sur Chromium ciblé est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement d’attachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration browser basée sur extension et vérifie que
  Chrome est installé localement pour les profils de connexion automatique par défaut, mais il ne peut pas
  activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, passez ce nom de profil explicite.
- Ne choisissez ce mode que lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  d’attachement.
- le Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw` parce qu’il peut
  agir à l’intérieur de votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il ne fait que s’y attacher.
- OpenClaw utilise ici le flux officiel `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` est défini, il est transmis afin de cibler ce répertoire de données utilisateur.
- Existing-session peut s’attacher sur l’hôte sélectionné ou via un
  node browser connecté. Si Chrome vit ailleurs et qu’aucun node browser n’est connecté, utilisez
  plutôt un CDP distant ou un hôte node.

<Accordion title="Limites fonctionnelles d’existing-session">

Comparés au profil géré `openclaw`, les drivers existing-session sont plus contraints :

- **Captures d’écran** — les captures de page et les captures d’élément `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas requis pour les captures de page ou d’élément basées sur des refs.
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, et `select` nécessitent des refs d’instantané (pas de sélecteurs CSS). `click` est limité au bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `hover`, `scrollIntoView`, `drag`, `select`, `fill`, et `evaluate` ne prennent pas en charge de délais d’attente par appel. `select` accepte une seule valeur.
- **Wait / upload / dialog** — `wait --url` prend en charge les motifs exacts, par sous-chaîne, et glob ; `wait --load networkidle` n’est pas pris en charge. Les hooks d’upload nécessitent `ref` ou `inputRef`, un fichier à la fois, sans CSS `element`. Les hooks de dialogue ne prennent pas en charge de surcharges de délai d’attente.
- **Fonctionnalités réservées au mode géré** — actions par lot, export PDF, interception des téléchargements, et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les workflows de développement.
- **Contrôle déterministe des onglets** : cible les onglets par `targetId`, pas par « dernier onglet ».

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez remplacer cela avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour le scripting et le débogage, le Gateway expose une petite **API HTTP de contrôle loopback-only**
ainsi qu’un CLI `openclaw browser` correspondant (instantanés, refs, wait
power-ups, sortie JSON, workflows de débogage). Voir
[API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes spécifiques à Linux (notamment snap Chromium), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations partagées WSL2 Gateway + Windows Chrome sur hôtes séparés, voir
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Ce sont deux classes d’échec différentes et elles pointent vers des chemins de code différents.

- **Échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, snapshot, ou d’ouverture d’onglet échouent avec une erreur de politique browser/réseau alors que `start` et `tabs` fonctionnent encore

Utilisez cette séquence minimale pour séparer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment lire les résultats :

- Si `start` échoue avec `not reachable after start`, commencez par dépanner la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours malsain. Traitez cela comme un problème d’accessibilité CDP, et non comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est opérationnel et l’échec se situe dans la politique de navigation ou dans la page cible.
- Si `start`, `tabs`, et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants de comportement :

- La configuration browser utilise par défaut un objet de politique SSRF en fermeture stricte même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local `openclaw` sur loopback, les vérifications de santé CDP ignorent volontairement l’application de l’accessibilité SSRF du navigateur pour le plan de contrôle local propre à OpenClaw.
- La protection de navigation est distincte. Un résultat réussi de `start` ou `tabs` ne signifie pas qu’une cible ultérieure de `open` ou `navigate` est autorisée.

Consignes de sécurité :

- Ne relâchez **pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites telles que `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement approuvés où l’accès browser au réseau privé est requis et revu.

## Outils d’agent + fonctionnement du contrôle

L’agent reçoit **un outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les identifiants `ref` de l’instantané pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture des pixels (page entière ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome, ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner où vit le navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent `sandbox` par défaut, les sessions non sandboxées utilisent `host` par défaut.
  - Si un node compatible browser est connecté, l’outil peut automatiquement s’y router sauf si vous épinglez `target="host"` ou `target="node"`.

Cela permet à l’agent de rester déterministe et d’éviter les sélecteurs fragiles.

## Liens associés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans les environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques du contrôle du navigateur et durcissement
