---
read_when:
    - Ajout de l’automatisation du navigateur contrôlée par l’agent
    - Débogage des raisons pour lesquelles openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres et du cycle de vie du navigateur dans l’app macOS
summary: Service de contrôle du navigateur intégré + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-10T06:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd3424f62178bbf25923b8bc8e4d9f70e330f35428d01fe153574e5fa45d7604
    source_path: tools/browser.md
    workflow: 15
---

# Navigateur (géré par openclaw)

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle. Il est isolé de votre navigateur personnel et est géré via un petit service de contrôle local à l’intérieur de la Gateway (loopback uniquement).

Vue débutant :

- Voyez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un espace sûr.
- Le profil `user` intégré se rattache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur séparé nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Des actions d’agent (cliquer/saisir/faire glisser/sélectionner), des instantanés, des captures d’écran, des PDF.
- Une prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur principal au quotidien. C’est une surface sûre et isolée pour l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez la Gateway.

Si `openclaw browser` a entièrement disparu, ou si l’agent indique que l’outil de navigateur est indisponible, passez à [Commande ou outil de navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle des plugins

L’outil `browser` par défaut est maintenant un plugin groupé livré activé par défaut. Cela signifie que vous pouvez le désactiver ou le remplacer sans supprimer le reste du système de plugins d’OpenClaw :

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

Désactivez le plugin groupé avant d’installer un autre plugin qui fournit le même nom d’outil `browser`. L’expérience de navigateur par défaut nécessite les deux :

- `plugins.entries.browser.enabled` non désactivé
- `browser.enabled=true`

Si vous désactivez uniquement le plugin, la CLI de navigateur groupée (`openclaw browser`), la méthode Gateway (`browser.request`), l’outil d’agent et le service de contrôle du navigateur par défaut disparaissent tous ensemble. Votre configuration `browser.*` reste intacte afin qu’un plugin de remplacement puisse la réutiliser.

Le plugin de navigateur groupé possède désormais aussi l’implémentation d’exécution du navigateur. Le noyau ne conserve que les assistants partagés du Plugin SDK ainsi que des réexportations de compatibilité pour les anciens chemins d’importation internes. En pratique, supprimer ou remplacer le package du plugin de navigateur supprime l’ensemble des fonctionnalités du navigateur au lieu de laisser derrière lui un second runtime appartenant au noyau.

Les changements de configuration du navigateur nécessitent toujours un redémarrage de la Gateway afin que le plugin groupé puisse réenregistrer son service de navigateur avec les nouveaux paramètres.

## Commande ou outil de navigateur manquant

Si `openclaw browser` devient soudainement une commande inconnue après une mise à niveau, ou si l’agent signale que l’outil de navigateur est manquant, la cause la plus fréquente est une liste `plugins.allow` restrictive qui n’inclut pas `browser`.

Exemple de configuration défectueuse :

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrigez cela en ajoutant `browser` à la liste d’autorisation des plugins :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Remarques importantes :

- `browser.enabled=true` ne suffit pas à lui seul lorsque `plugins.allow` est défini.
- `plugins.entries.browser.enabled=true` ne suffit pas non plus à lui seul lorsque `plugins.allow` est défini.
- `tools.alsoAllow: ["browser"]` ne charge **pas** le plugin de navigateur groupé. Il ajuste uniquement la politique des outils une fois le plugin déjà chargé.
- Si vous n’avez pas besoin d’une liste d’autorisation de plugins restrictive, supprimer `plugins.allow` rétablit également le comportement par défaut du navigateur groupé.

Symptômes typiques :

- `openclaw browser` est une commande inconnue.
- `browser.request` est manquant.
- L’agent indique que l’outil de navigateur est indisponible ou manquant.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil de rattachement Chrome MCP intégré pour votre **vraie session Chrome connectée**.

Pour les appels d’outil de navigateur de l’agent :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque des sessions déjà connectées sont importantes et que l’utilisateur est devant l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est la surcharge explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // défaut : true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // mode réseau de confiance par défaut
      // allowPrivateNetwork: true, // alias hérité
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // surcharge héritée pour profil unique
    remoteCdpTimeoutMs: 1500, // délai d’expiration HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’expiration de la négociation WebSocket CDP distante (ms)
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

Remarques :

- Le service de contrôle du navigateur se lie à loopback sur un port dérivé de `gateway.port` (par défaut : `18791`, soit gateway + 2).
- Si vous redéfinissez le port de la Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`), les ports dérivés du navigateur se décalent pour rester dans la même « famille ».
- `cdpUrl` prend par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité CDP distantes (hors loopback).
- `remoteCdpHandshakeTimeoutMs` s’applique aux vérifications d’accessibilité de négociation WebSocket CDP distantes.
- La navigation/ouverture d’onglets du navigateur est protégée contre la SSRF avant la navigation et revérifiée au mieux sur l’URL finale `http(s)` après navigation.
- En mode SSRF strict, la découverte/les sondes de point de terminaison CDP distant (`cdpUrl`, y compris les recherches `/json/version`) sont également vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vaut `true` par défaut (modèle réseau de confiance). Définissez-le sur `false` pour une navigation stricte réservée au réseau public.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité pour compatibilité.
- `attachOnly: true` signifie « ne jamais lancer un navigateur local ; uniquement s’y rattacher s’il est déjà en cours d’exécution ».
- `color` + `color` par profil teintent l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (navigateur autonome géré par OpenClaw). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` — ne définissez ces valeurs que pour le CDP distant.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce pilote.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session doit se rattacher à un profil utilisateur Chromium non par défaut, tel que Brave ou Edge.

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc.), OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour surcharger l’auto-détection :

Exemple CLI :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Contrôle local ou distant

- **Contrôle local (par défaut) :** la Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte de nœud) :** exécutez un hôte de nœud sur la machine qui possède le navigateur ; la Gateway lui transmet les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement à l’arrêt diffère selon le mode de profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus de navigateur lancé par OpenClaw
- profils en mode rattachement uniquement et profils CDP distants : `openclaw browser stop` ferme la session de contrôle active et libère les surcharges d’émulation Playwright/CDP (viewport, schéma de couleurs, paramètres régionaux, fuseau horaire, mode hors ligne et état similaire), même si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex. `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les jetons au lieu de les valider dans des fichiers de configuration.

## Proxy de navigateur de nœud (valeur par défaut sans configuration)

Si vous exécutez un **hôte de nœud** sur la machine qui possède votre navigateur, OpenClaw peut acheminer automatiquement les appels d’outil du navigateur vers ce nœud sans configuration de navigateur supplémentaire. Il s’agit du chemin par défaut pour les gateways distantes.

Remarques :

- L’hôte de nœud expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du nœud (identique au mode local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une limite de moindre privilège : seuls les profils autorisés peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface du proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le nœud : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais pour un profil de navigateur distant, l’option la plus simple est l’URL WebSocket directe provenant de la documentation de connexion de Browserless.

Exemple :

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

Remarques :

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai jeton Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw prend en charge les deux :

- **Points de terminaison HTTP(S)** — OpenClaw appelle `/json/version` pour découvrir l’URL WebSocket du débogueur, puis s’y connecte.
- **Points de terminaison WebSocket** (`ws://` / `wss://`) — OpenClaw se connecte directement, en ignorant `/json/version`. Utilisez cela pour des services comme [Browserless](https://browserless.io), [Browserbase](https://www.browserbase.com), ou tout fournisseur qui vous donne une URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud permettant d’exécuter des navigateurs headless avec résolution de CAPTCHA intégrée, mode furtif et proxys résidentiels.

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

Remarques :

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé API** depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc aucune étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois. Consultez les [tarifs](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API complète, les guides SDK et des exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité à loopback ; l’accès passe par l’authentification de la Gateway ou l’appairage de nœud.
- L’API HTTP autonome du navigateur sur loopback utilise **uniquement une authentification par secret partagé** : authentification Bearer par jeton Gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le mot de passe Gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` **n’authentifient pas** cette API autonome du navigateur sur loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw génère automatiquement `gateway.auth.token` au démarrage et le conserve dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` est déjà `password`, `none` ou `trusted-proxy`.
- Conservez la Gateway et tous les hôtes de nœud sur un réseau privé (Tailscale) ; évitez l’exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez les variables d’environnement ou un gestionnaire de secrets.

Conseils pour le CDP distant :

- Préférez des points de terminaison chiffrés (HTTPS ou WSS) et des jetons de courte durée lorsque c’est possible.
- Évitez d’intégrer directement des jetons de longue durée dans les fichiers de configuration.

## Profils (multi-navigateur)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance de navigateur dédiée basée sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via l’auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour le rattachement existing-session de Chrome MCP.
- Les profils existing-session sont activés sur opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués par défaut dans la plage **18800–18899**.
- Supprimer un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Existing-session via Chrome DevTools MCP

OpenClaw peut aussi se rattacher à un profil de navigateur basé sur Chromium en cours d’exécution via le serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous voulez un nom, une couleur ou un répertoire de données de navigateur différent.

Comportement par défaut :

- Le profil `user` intégré utilise l’auto-connexion Chrome MCP, qui cible le profil local Google Chrome par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium, ou un profil Chrome non par défaut :

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

Ensuite, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Laissez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsque OpenClaw s’y rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test de fumée de rattachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble une réussite :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste vos onglets de navigateur déjà ouverts
- `snapshot` renvoie des refs depuis l’onglet actif sélectionné

Que vérifier si le rattachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement au rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration de navigateur basée sur une extension et vérifie que Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, indiquez ce nom de profil explicitement.
- Choisissez ce mode uniquement lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite de rattachement.
- la Gateway ou l’hôte de nœud peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw`, car il peut agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce pilote ; il se rattache uniquement à une session existante.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si `userDataDir` est défini, OpenClaw le transmet pour cibler explicitement ce répertoire de données utilisateur Chromium.
- Les captures d’écran existing-session prennent en charge les captures de page et les captures d’élément `--ref` à partir des instantanés, mais pas les sélecteurs CSS `--element`.
- Les captures d’écran de page existing-session fonctionnent sans Playwright via Chrome MCP. Les captures d’élément basées sur des refs (`--ref`) y fonctionnent également, mais `--full-page` ne peut pas être combiné avec `--ref` ou `--element`.
- Les actions existing-session restent plus limitées que le chemin du navigateur géré :
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des refs d’instantané au lieu de sélecteurs CSS
  - `click` est limité au bouton gauche (pas de surcharge de bouton ni de modificateurs)
  - `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`
  - `press` ne prend pas en charge `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge les surcharges de délai d’expiration par appel
  - `select` ne prend actuellement en charge qu’une seule valeur
- `wait --url` en existing-session prend en charge les motifs exacts, de sous-chaîne et glob, comme les autres pilotes de navigateur. `wait --load networkidle` n’est pas encore pris en charge.
- Les hooks d’envoi de fichiers existing-session nécessitent `ref` ou `inputRef`, prennent en charge un seul fichier à la fois, et ne prennent pas en charge le ciblage CSS `element`.
- Les hooks de boîte de dialogue existing-session ne prennent pas en charge les surcharges de délai d’expiration.
- Certaines fonctionnalités nécessitent encore le chemin du navigateur géré, notamment les actions par lots, l’export PDF, l’interception des téléchargements et `responsebody`.
- Existing-session est local à l’hôte. Si Chrome se trouve sur une autre machine ou dans un autre espace de noms réseau, utilisez plutôt le CDP distant ou un hôte de nœud.

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` afin d’empêcher les collisions avec les flux de développement.
- **Contrôle déterministe des onglets** : cible les onglets par `targetId`, pas par « dernier onglet ».

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez surcharger cela avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les intégrations locales uniquement, la Gateway expose une petite API HTTP loopback :

- Statut/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantané/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les points de terminaison acceptent `?profile=<name>`.

Si une authentification Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent également une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API autonome du navigateur sur loopback ne consomme **pas** les en-têtes d’identité trusted-proxy ni Tailscale Serve.
- Si `gateway.auth.mode` est `none` ou `trusted-proxy`, ces routes de navigateur sur loopback n’héritent pas de ces modes porteurs d’identité ; gardez-les limitées à loopback.

### Contrat d’erreur `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau de la route et les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs `code` actuelles :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est manquant ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile d’action a échoué lors de la normalisation ou de la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : `targetId` de niveau supérieur ou en lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils existing-session.

D’autres échecs d’exécution peuvent encore renvoyer `{ "error": "<message>" }` sans champ `code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/AI snapshot/role snapshot, captures d’écran d’élément, PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- instantanés ARIA
- captures d’écran de page pour le navigateur géré `openclaw` lorsqu’un WebSocket CDP par onglet est disponible
- captures d’écran de page pour les profils `existing-session` / Chrome MCP
- captures d’écran existing-session basées sur `--ref` à partir de la sortie d’instantané

Ce qui nécessite encore Playwright :

- `navigate`
- `act`
- instantanés AI / instantanés de rôle
- captures d’écran d’élément avec sélecteur CSS (`--element`)
- export PDF complet du navigateur

Les captures d’écran d’élément rejettent également `--full-page` ; la route renvoie `fullPage is not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, installez le package Playwright complet (pas `playwright-core`) et redémarrez la gateway, ou réinstallez OpenClaw avec la prise en charge du navigateur.

#### Installation de Playwright dans Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits avec les surcharges npm). Utilisez plutôt la CLI groupée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements de navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple, `/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est conservé via `OPENCLAW_HOME_VOLUME` ou un bind mount. Consultez [Docker](/fr/install/docker).

## Comment cela fonctionne (interne)

Flux de haut niveau :

- Un petit **serveur de contrôle** accepte des requêtes HTTP.
- Il se connecte à des navigateurs basés sur Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Pour les actions avancées (clic/saisie/instantané/PDF), il utilise **Playwright** au-dessus de CDP.
- Lorsque Playwright est absent, seules les opérations sans Playwright sont disponibles.

Cette conception maintient l’agent sur une interface stable et déterministe tout en vous permettant de changer de navigateur local/distant et de profils.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique.
Toutes les commandes acceptent aussi `--json` pour une sortie lisible par machine (charges utiles stables).

Bases :

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspection :

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Remarque sur le cycle de vie :

- Pour les profils en mode rattachement uniquement et CDP distants, `openclaw browser stop` reste la bonne commande de nettoyage après les tests. Elle ferme la session de contrôle active et efface les surcharges d’émulation temporaires au lieu de tuer le navigateur sous-jacent.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Actions :

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

État :

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Remarques :

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la touche qui déclenche le sélecteur de fichier/la boîte de dialogue.
- Les chemins de sortie pour les téléchargements et les traces sont limités aux racines temporaires d’OpenClaw :
  - traces : `/tmp/openclaw` (repli : `${os.tmpdir()}/openclaw`)
  - téléchargements : `/tmp/openclaw/downloads` (repli : `${os.tmpdir()}/openclaw/downloads`)
- Les chemins d’envoi sont limités à une racine temporaire d’uploads OpenClaw :
  - uploads : `/tmp/openclaw/uploads` (repli : `${os.tmpdir()}/openclaw/uploads`)
- `upload` peut aussi définir directement des entrées de fichier via `--input-ref` ou `--element`.
- `snapshot` :
  - `--format ai` (par défaut lorsque Playwright est installé) : renvoie un instantané AI avec des refs numériques (`aria-ref="<n>"`).
  - `--format aria` : renvoie l’arbre d’accessibilité (sans refs ; inspection uniquement).
  - `--efficient` (ou `--mode efficient`) : préréglage d’instantané de rôle compact (interactive + compact + depth + maxChars plus faible).
  - Valeur par défaut de configuration (outil/CLI uniquement) : définissez `browser.snapshotDefaults.mode: "efficient"` pour utiliser des instantanés efficaces lorsque l’appelant ne passe pas de mode (voir [Configuration de la Gateway](/fr/gateway/configuration-reference#browser)).
  - Les options d’instantané de rôle (`--interactive`, `--compact`, `--depth`, `--selector`) forcent un instantané basé sur les rôles avec des refs comme `ref=e12`.
  - `--frame "<iframe selector>"` limite les instantanés de rôle à une iframe (s’associe à des refs de rôle comme `e12`).
  - `--interactive` produit une liste plate et facile à sélectionner des éléments interactifs (idéal pour piloter des actions).
  - `--labels` ajoute une capture d’écran de la zone d’affichage avec les libellés de refs superposés (affiche `MEDIA:<path>`).
- `click`/`type`/etc nécessitent une `ref` issue de `snapshot` (soit numérique `12`, soit ref de rôle `e12`).
  Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions.

## Instantanés et refs

OpenClaw prend en charge deux styles d’« instantané » :

- **Instantané AI (refs numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un instantané texte qui inclut des refs numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la ref est résolue via `aria-ref` de Playwright.

- **Instantané de rôle (refs de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/un arbre basé sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la ref est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran de la zone d’affichage avec les libellés `e12` superposés.

Comportement des refs :

- Les refs ne sont **pas stables d’une navigation à l’autre** ; si quelque chose échoue, relancez `snapshot` et utilisez une ref fraîche.
- Si l’instantané de rôle a été pris avec `--frame`, les refs de rôle sont limitées à cette iframe jusqu’au prochain instantané de rôle.

## Super-pouvoirs de `wait`

Vous pouvez attendre plus que du temps/du texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces options peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flux de débogage

Lorsqu’une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les refs de rôle en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` sert au scripting et aux outils structurés.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les instantanés de rôle en JSON incluent `refs` ainsi qu’un petit bloc `stats` (lignes/caractères/refs/interactive) pour permettre aux outils d’évaluer la taille et la densité de la charge utile.

## Paramètres d’état et d’environnement

Ils sont utiles pour les workflows « faire en sorte que le site se comporte comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP Basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / paramètres régionaux : `set timezone ...`, `set locale ...`
- Appareil / zone d’affichage :
  - `set device "iPhone 14"` (préréglages d’appareil Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn` exécutent du JavaScript arbitraire dans le contexte de la page. L’injection de prompt peut influencer cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les notes anti-bot (X/Twitter, etc.), consultez [Connexion navigateur + publication sur X/Twitter](/fr/tools/browser-login).
- Gardez la Gateway/l’hôte de nœud privés (loopback ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple de mode strict (bloquer par défaut les destinations privées/internes) :

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // autorisation exacte facultative
    },
  },
}
```

## Dépannage

Pour les problèmes spécifiques à Linux (en particulier Chromium snap), consultez [Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations partagées entre Gateway WSL2 + Chrome Windows sur des hôtes distincts, consultez [Dépannage WSL2 + Windows + Chrome CDP distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Outils d’agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les IDs `ref` de l’instantané pour cliquer/saisir/faire glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un nœud capable de gérer un navigateur est connecté, l’outil peut s’y acheminer automatiquement sauf si vous fixez `target="host"` ou `target="node"`.

Cela garde l’agent déterministe et évite les sélecteurs fragiles.

## Liens associés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans des environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques du contrôle du navigateur et mesures de durcissement
