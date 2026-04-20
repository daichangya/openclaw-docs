---
read_when:
    - Ajout de l’automatisation du navigateur contrôlée par l’agent
    - Débogage pour comprendre pourquoi openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres et du cycle de vie du navigateur dans l’app macOS
summary: Service de contrôle intégré du navigateur + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-20T07:06:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Navigateur (géré par openclaw)

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle.
Il est isolé de votre navigateur personnel et géré via un petit service local de
contrôle à l’intérieur de Gateway (loopback uniquement).

Vue débutant :

- Considérez-le comme un **navigateur distinct, réservé à l’agent**.
- Le profil `openclaw` ne **touche pas** au profil de votre navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans une voie sûre.
- Le profil intégré `user` se rattache à votre véritable session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions de l’agent (cliquer/saisir/glisser/sélectionner), instantanés, captures d’écran, PDF.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur **n’est pas** votre navigateur principal au quotidien. C’est une surface sûre et isolée pour
l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) puis redémarrez
Gateway.

Si `openclaw browser` est totalement absent, ou si l’agent indique que l’outil de navigateur
n’est pas disponible, passez à [Commande ou outil navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est maintenant un Plugin groupé livré activé par
défaut. Cela signifie que vous pouvez le désactiver ou le remplacer sans retirer le reste du
système de Plugin d’OpenClaw :

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

Désactivez le Plugin groupé avant d’installer un autre Plugin qui fournit le
même nom d’outil `browser`. L’expérience de navigateur par défaut nécessite les deux éléments suivants :

- `plugins.entries.browser.enabled` non désactivé
- `browser.enabled=true`

Si vous désactivez uniquement le Plugin, la CLI de navigateur groupée (`openclaw browser`),
la méthode Gateway (`browser.request`), l’outil de l’agent et le service de contrôle
du navigateur par défaut disparaissent tous ensemble. Votre configuration `browser.*` reste intacte pour
qu’un Plugin de remplacement puisse la réutiliser.

Le Plugin de navigateur groupé est aussi désormais propriétaire de l’implémentation d’exécution du navigateur.
Le cœur ne conserve que les helpers partagés du Plugin SDK ainsi que des réexportations de compatibilité pour
les anciens chemins d’import internes. En pratique, retirer ou remplacer le package du Plugin de navigateur
supprime l’ensemble des fonctionnalités navigateur au lieu de laisser derrière lui une seconde exécution
gérée par le cœur.

Les changements de configuration du navigateur nécessitent toujours un redémarrage de Gateway afin que le Plugin groupé
puisse réenregistrer son service de navigateur avec les nouveaux paramètres.

## Commande ou outil navigateur manquant

Si `openclaw browser` devient soudainement une commande inconnue après une mise à niveau, ou
si l’agent signale que l’outil navigateur est manquant, la cause la plus fréquente est une liste
`plugins.allow` restrictive qui n’inclut pas `browser`.

Exemple de configuration cassée :

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrigez-la en ajoutant `browser` à la liste d’autorisation des plugins :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Notes importantes :

- `browser.enabled=true` ne suffit pas à lui seul lorsque `plugins.allow` est défini.
- `plugins.entries.browser.enabled=true` ne suffit pas non plus à lui seul lorsque `plugins.allow` est défini.
- `tools.alsoAllow: ["browser"]` ne charge **pas** le Plugin de navigateur groupé. Cela ajuste seulement la politique des outils une fois le Plugin déjà chargé.
- Si vous n’avez pas besoin d’une liste d’autorisation de plugins restrictive, supprimer `plugins.allow` rétablit aussi le comportement groupé par défaut du navigateur.

Symptômes typiques :

- `openclaw browser` est une commande inconnue.
- `browser.request` est absent.
- L’agent signale que l’outil navigateur est indisponible ou manquant.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de rattachement Chrome MCP pour votre **véritable session Chrome connectée**.

Pour les appels à l’outil navigateur de l’agent :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions déjà connectées sont importantes et que l’utilisateur
  est à l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est la dérogation explicite lorsque vous souhaitez un mode de navigateur précis.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

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

Notes :

- Le service de contrôle du navigateur se lie à loopback sur un port dérivé de `gateway.port`
  (par défaut : `18791`, soit gateway + 2).
- Si vous redéfinissez le port Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  les ports de navigateur dérivés se décalent pour rester dans la même « famille ».
- `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications de joignabilité CDP distantes (hors loopback).
- `remoteCdpHandshakeTimeoutMs` s’applique aux vérifications de joignabilité de handshake WebSocket CDP distantes.
- La navigation du navigateur et l’ouverture d’onglet sont protégées contre la SSRF avant la navigation et revérifiées au mieux sur l’URL finale `http(s)` après navigation.
- En mode SSRF strict, la découverte et les sondes des points de terminaison CDP distants (`cdpUrl`, y compris les recherches `/json/version`) sont aussi vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut. Définissez-le sur `true` uniquement lorsque vous faites délibérément confiance à l’accès navigateur sur réseau privé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité pour compatibilité.
- `attachOnly: true` signifie « ne jamais lancer un navigateur local ; s’y rattacher uniquement s’il est déjà en cours d’exécution ».
- `color` + la `color` par profil teintent l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (navigateur autonome géré par OpenClaw). Utilisez `defaultProfile: "user"` pour choisir le navigateur connecté de l’utilisateur.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` — définissez-les uniquement pour CDP distant.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu de CDP brut. Ne
  définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session
  doit se rattacher à un profil utilisateur Chromium non par défaut, comme Brave ou Edge.

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **système par défaut** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour redéfinir
l’auto-détection :

Exemple CLI :

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

## Contrôle local vs distant

- **Contrôle local (par défaut) :** Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; Gateway y relaie les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement d’arrêt diffère selon le mode du profil :

- profils gérés locaux : `openclaw browser stop` arrête le processus de navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distants : `openclaw browser stop` ferme la session de
  contrôle active et libère les dérogations d’émulation Playwright/CDP (viewport,
  schéma de couleurs, locale, fuseau horaire, mode hors ligne et états similaires), même
  si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex. `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
jetons au lieu de les versionner dans les fichiers de configuration.

## Proxy de navigateur node (valeur par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
rediriger automatiquement les appels à l’outil navigateur vers ce node sans configuration de navigateur supplémentaire.
C’est le chemin par défaut pour les Gateway distants.

Notes :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du node (comme en local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profils.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils autorisés peuvent être ciblés, et les routes persistantes de création/suppression de profils sont bloquées sur la surface du proxy.
- Désactivez-le si vous ne le voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose des
URL de connexion CDP en HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais
pour un profil de navigateur distant, l’option la plus simple est l’URL WebSocket directe
figurant dans la documentation de connexion de Browserless.

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

Notes :

- Remplacez `<BROWSERLESS_API_KEY>` par votre véritable jeton Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois formes
d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL WebSocket du débogueur, puis
  se connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via un handshake WebSocket et ignore
  entièrement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw tente d’abord une découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  se replie sur un handshake WebSocket direct à la racine nue. Cela couvre
  à la fois les ports de débogage distant de type Chrome et les fournisseurs uniquement WebSocket.

Le format simple `ws://host:port` / `wss://host:port` sans chemin `/devtools/...`
pointant vers une instance locale de Chrome est pris en charge via le repli
avec découverte d’abord — Chrome n’accepte les upgrades WebSocket que sur le chemin spécifique
par navigateur ou par cible renvoyé par `/json/version`, donc un simple handshake à la racine
échouerait.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud permettant d’exécuter des
navigateurs headless avec résolution CAPTCHA intégrée, mode furtif et proxys
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

Notes :

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé API**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre véritable clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc
  aucune étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session concurrente et une heure de navigateur par mois.
  Consultez les [tarifs](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API
  complète, les guides SDK et des exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité au loopback ; l’accès passe par l’authentification Gateway ou l’appairage node.
- L’API HTTP autonome du navigateur en loopback utilise **uniquement une authentification par secret partagé** :
  authentification bearer par jeton Gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le
  mot de passe Gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome du navigateur en loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` est
  déjà `password`, `none` ou `trusted-proxy`.
- Conservez Gateway et tout hôte node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez les variables d’environnement ou un gestionnaire de secrets.

Conseils pour CDP distant :

- Préférez des points de terminaison chiffrés (HTTPS ou WSS) et des jetons de courte durée quand c’est possible.
- Évitez d’intégrer directement des jetons de longue durée dans les fichiers de configuration.

## Profils (multi-navigateur)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance de navigateur dédiée basée sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distant** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via l’auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour le rattachement à une session existante via Chrome MCP.
- Les profils de session existante sont facultatifs au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués par défaut dans la plage **18800–18899**.
- La suppression d’un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut aussi se rattacher à un profil de navigateur déjà en cours d’exécution basé sur Chromium via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles pour le contexte et l’installation :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil de session existante si vous souhaitez un
nom, une couleur ou un répertoire de données du navigateur différents.

Comportement par défaut :

- Le profil intégré `user` utilise l’auto-connexion Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium ou un profil Chrome non par défaut :

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

Ensuite, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage distant.
2. Activez le débogage distant.
3. Gardez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsque OpenClaw s’y rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Smoke test d’attachement live :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble un rattachement réussi :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets déjà ouverts dans votre navigateur
- `snapshot` renvoie des références depuis l’onglet live sélectionné

Points à vérifier si le rattachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage distant est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement au rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration de navigateur basée sur une extension et vérifie que
  Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas
  activer pour vous le débogage distant côté navigateur

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état connecté du navigateur de l’utilisateur.
- Si vous utilisez un profil de session existante personnalisé, transmettez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est à l’ordinateur pour approuver l’invite
  de rattachement.
- Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Notes :

- Ce chemin est plus risqué que le profil isolé `openclaw` car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il se rattache uniquement à une
  session existante.
- OpenClaw utilise ici le flux officiel `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` est défini, OpenClaw le transmet pour cibler explicitement ce
  répertoire de données utilisateur Chromium.
- Les captures d’écran en session existante prennent en charge les captures de page et les captures d’élément `--ref`
  depuis les instantanés, mais pas les sélecteurs CSS `--element`.
- Les captures d’écran de page en session existante fonctionnent sans Playwright via Chrome MCP.
  Les captures d’élément basées sur une référence (`--ref`) y fonctionnent aussi, mais `--full-page`
  ne peut pas être combiné avec `--ref` ou `--element`.
- Les actions en session existante restent plus limitées que dans le
  chemin du navigateur géré :
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` exigent
    des références d’instantané au lieu de sélecteurs CSS
  - `click` fonctionne uniquement avec le bouton gauche (pas de redéfinition de bouton ni de modificateurs)
  - `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`
  - `press` ne prend pas en charge `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne
    prennent pas en charge les redéfinitions de délai d’attente par appel
  - `select` ne prend actuellement en charge qu’une seule valeur
- `wait --url` en session existante prend en charge les motifs exacts, sous-chaîne et glob
  comme les autres drivers de navigateur. `wait --load networkidle` n’est pas encore pris en charge.
- Les hooks d’upload en session existante exigent `ref` ou `inputRef`, prennent en charge un seul fichier
  à la fois et ne prennent pas en charge le ciblage CSS `element`.
- Les hooks de boîte de dialogue en session existante ne prennent pas en charge les redéfinitions de délai d’attente.
- Certaines fonctionnalités exigent encore le chemin du navigateur géré, notamment les actions par lot,
  l’export PDF, l’interception des téléchargements et `responsebody`.
- La session existante peut se rattacher sur l’hôte sélectionné ou via un node
  de navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun node de navigateur n’est connecté, utilisez
  plutôt CDP distant ou un hôte node.

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais au profil de votre navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les flux de développement.
- **Contrôle déterministe des onglets** : cible les onglets par `targetId`, et non par « dernier onglet ».

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez redéfinir ce comportement avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les intégrations locales uniquement, Gateway expose une petite API HTTP loopback :

- Statut/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantané/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les points de terminaison acceptent `?profile=<name>`.

Si une authentification Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Notes :

- Cette API autonome du navigateur en loopback ne consomme **pas** les en-têtes d’identité trusted-proxy ou
  Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes navigateur en loopback
  n’héritent pas de ces modes porteurs d’identité ; gardez-les limitées au loopback.

### Contrat d’erreur `/act`

`POST /act` utilise une réponse d’erreur structurée pour les échecs de validation au niveau de la route et
de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est manquant ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : le `targetId` de niveau supérieur ou en lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils de session existante.

D’autres erreurs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans
champ `code`.

### Exigence Playwright

Certaines fonctionnalités (`navigate`/`act`/instantané AI/instantané de rôle, captures d’écran d’élément,
PDF) exigent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- instantanés ARIA
- captures d’écran de page pour le navigateur géré `openclaw` lorsqu’un WebSocket CDP
  par onglet est disponible
- captures d’écran de page pour les profils `existing-session` / Chrome MCP
- captures d’écran basées sur une référence `existing-session` (`--ref`) à partir de la sortie d’instantané

Ce qui exige encore Playwright :

- `navigate`
- `act`
- instantanés AI / instantanés de rôle
- captures d’écran d’élément par sélecteur CSS (`--element`)
- export PDF complet du navigateur

Les captures d’écran d’élément rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, installez le package complet
Playwright (pas `playwright-core`) et redémarrez la gateway, ou réinstallez
OpenClaw avec la prise en charge du navigateur.

#### Installation de Playwright dans Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits d’override npm).
Utilisez plutôt la CLI groupée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour rendre persistants les téléchargements du navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est persistant via
`OPENCLAW_HOME_VOLUME` ou un montage bind. Voir [Docker](/fr/install/docker).

## Fonctionnement (interne)

Flux de haut niveau :

- Un petit **serveur de contrôle** accepte les requêtes HTTP.
- Il se connecte aux navigateurs basés sur Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Pour les actions avancées (clic/saisie/instantané/PDF), il utilise **Playwright** par-dessus
  CDP.
- Lorsque Playwright est absent, seules les opérations sans Playwright sont disponibles.

Cette conception maintient une interface stable et déterministe pour l’agent tout en vous permettant
de permuter les navigateurs et profils locaux/distants.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil précis.
Toutes les commandes acceptent aussi `--json` pour une sortie lisible par machine (charges utiles stables).

Bases :

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

Inspection :

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

Note sur le cycle de vie :

- Pour les profils attach-only et CDP distants, `openclaw browser stop` reste la
  bonne commande de nettoyage après les tests. Elle ferme la session de contrôle active et
  efface les redéfinitions temporaires d’émulation au lieu de tuer le navigateur
  sous-jacent.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Actions :

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

État :

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

Notes :

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la pression
  qui déclenche le sélecteur/la boîte de dialogue.
- Les chemins de sortie de téléchargement et de trace sont limités aux racines temporaires OpenClaw :
  - traces : `/tmp/openclaw` (repli : `${os.tmpdir()}/openclaw`)
  - téléchargements : `/tmp/openclaw/downloads` (repli : `${os.tmpdir()}/openclaw/downloads`)
- Les chemins d’upload sont limités à une racine temporaire d’uploads OpenClaw :
  - uploads : `/tmp/openclaw/uploads` (repli : `${os.tmpdir()}/openclaw/uploads`)
- `upload` peut aussi définir directement des entrées de fichier via `--input-ref` ou `--element`.
- `snapshot` :
  - `--format ai` (par défaut quand Playwright est installé) : renvoie un instantané AI avec des références numériques (`aria-ref="<n>"`).
  - `--format aria` : renvoie l’arbre d’accessibilité (sans références ; inspection uniquement).
  - `--efficient` (ou `--mode efficient`) : préréglage compact d’instantané de rôle (interactive + compact + depth + maxChars plus faible).
  - Valeur par défaut de configuration (outil/CLI uniquement) : définissez `browser.snapshotDefaults.mode: "efficient"` pour utiliser des instantanés efficaces lorsque l’appelant ne passe pas de mode (voir [Configuration Gateway](/fr/gateway/configuration-reference#browser)).
  - Les options d’instantané de rôle (`--interactive`, `--compact`, `--depth`, `--selector`) forcent un instantané basé sur les rôles avec des références comme `ref=e12`.
  - `--frame "<iframe selector>"` limite les instantanés de rôle à une iframe (s’associe à des références de rôle comme `e12`).
  - `--interactive` produit une liste plate et facile à sélectionner des éléments interactifs (idéal pour piloter des actions).
  - `--labels` ajoute une capture d’écran du viewport uniquement avec des étiquettes de référence superposées (affiche `MEDIA:<path>`).
- `click`/`type`/etc exigent une `ref` issue de `snapshot` (soit une référence numérique `12`, soit une référence de rôle `e12`).
  Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions.

## Instantanés et références

OpenClaw prend en charge deux styles d’« instantané » :

- **Instantané AI (références numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un instantané texte qui inclut des références numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la référence est résolue via le `aria-ref` de Playwright.

- **Instantané de rôle (références de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la référence est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran du viewport avec des étiquettes `e12` superposées.

Comportement des références :

- Les références ne sont **pas stables entre les navigations** ; si quelque chose échoue, réexécutez `snapshot` et utilisez une nouvelle référence.
- Si l’instantané de rôle a été pris avec `--frame`, les références de rôle sont limitées à cette iframe jusqu’au prochain instantané de rôle.

## Améliorations de `wait`

Vous pouvez attendre plus que le simple temps/texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces options peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flux de débogage

Lorsqu’une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les références de rôle en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné au scripting et aux outils structurés.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les instantanés de rôle en JSON incluent `refs` plus un petit bloc `stats` (lignes/caractères/références/éléments interactifs) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Réglages d’état et d’environnement

Ils sont utiles pour les flux « faire se comporter le site comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP Basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / langue : `set timezone ...`, `set locale ...`
- Appareil / viewport :
  - `set device "iPhone 14"` (préréglages d’appareils Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. L’injection de prompt peut orienter
  cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les notes anti-bot (X/Twitter, etc.), voir [Connexion navigateur + publication X/Twitter](/fr/tools/browser-login).
- Conservez la Gateway/l’hôte node privés (loopback ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple de mode strict (bloquer par défaut les destinations privées/internes) :

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

Pour les problèmes spécifiques à Linux (en particulier Chromium snap), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations hôte scindé WSL2 Gateway + Chrome Windows, voir
[Dépannage WSL2 + Windows + Chrome distant CDP](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Il s’agit de deux classes d’échec différentes, et elles renvoient à des chemins de code différents.

- **Échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, `snapshot` ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau alors que `start` et `tabs` fonctionnent encore

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment interpréter les résultats :

- Si `start` échoue avec `not reachable after start`, commencez par dépanner la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours malsain. Traitez cela comme un problème de joignabilité CDP, et non comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur fonctionne et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants sur le comportement :

- La configuration du navigateur utilise par défaut un objet de politique SSRF en échec fermé même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local loopback `openclaw`, les vérifications d’état CDP ignorent volontairement l’application de la politique de joignabilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat réussi de `start` ou `tabs` ne signifie pas qu’une cible ultérieure de `open` ou `navigate` est autorisée.

Consignes de sécurité :

- **N’assouplissez pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites comme `hostnameAllowlist` ou `allowedHostnames` à un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements explicitement approuvés où l’accès navigateur au réseau privé est nécessaire et a été examiné.

Exemple : navigation bloquée, plan de contrôle sain

- `start` réussit
- `tabs` réussit
- `open http://internal.example` échoue

Cela signifie généralement que le démarrage du navigateur fonctionne correctement et que la cible de navigation nécessite un examen de politique.

Exemple : démarrage bloqué avant que la navigation ne soit pertinente

- `start` échoue avec `not reachable after start`
- `tabs` échoue également ou ne peut pas s’exécuter

Cela indique un problème de lancement du navigateur ou de joignabilité CDP, et non un problème de liste d’autorisation d’URL de page.

## Outils de l’agent + fonctionnement du contrôle

L’agent reçoit **un outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les ID `ref` de l’instantané pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions sandboxées, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un node capable de gérer le navigateur est connecté, l’outil peut automatiquement s’y router sauf si vous fixez `target="host"` ou `target="node"`.

Cela permet de garder l’agent déterministe et d’éviter les sélecteurs fragiles.

## Liens associés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans les environnements sandboxés
- [Security](/fr/gateway/security) — risques et durcissement du contrôle du navigateur
