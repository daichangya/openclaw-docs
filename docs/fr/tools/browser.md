---
read_when:
    - Ajouter une automatisation du navigateur contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémenter les paramètres et le cycle de vie du navigateur dans l’application macOS
summary: Service intégré de contrôle du navigateur + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-25T18:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle.
Il est isolé de votre navigateur personnel et géré via un petit service de
contrôle local à l’intérieur de la Gateway (loopback local uniquement).

Vue débutant :

- Considérez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir** dans une voie sûre.
- Le profil intégré `user` se rattache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions d’agent (cliquer/saisir/glisser/sélectionner), instantanés, captures d’écran, PDF.
- Une Skill intégrée `browser-automation` qui apprend aux agents la boucle de récupération avec instantanés,
  onglets stables, références obsolètes et blocages manuels lorsque le plugin
  navigateur est activé.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur quotidien. C’est une surface sûre et isolée pour
l’automatisation et la vérification par agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez la
Gateway.

Si `openclaw browser` manque complètement, ou si l’agent indique que l’outil navigateur
n’est pas disponible, passez à [Commande ou outil navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du plugin

L’outil `browser` par défaut est un plugin intégré. Désactivez-le pour le remplacer par un autre plugin qui enregistre le même nom d’outil `browser` :

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le plugin supprime en un seul bloc le CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil d’agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les changements de configuration du navigateur nécessitent un redémarrage de la Gateway afin que le plugin puisse réenregistrer son service.

## Conseils pour les agents

Remarque sur le profil d’outils : `tools.profile: "coding"` inclut `web_search` et
`web_fetch`, mais n’inclut pas l’outil complet `browser`. Si l’agent ou un
sous-agent lancé doit utiliser l’automatisation du navigateur, ajoutez browser au niveau
du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Pour un seul agent, utilisez `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` seul ne suffit pas, car la politique des sous-agents
est appliquée après le filtrage du profil.

Le plugin navigateur fournit deux niveaux de guidage pour les agents :

- La description de l’outil `browser` porte le contrat compact toujours actif : choisir
  le bon profil, conserver les références sur le même onglet, utiliser `tabId`/les libellés pour cibler les onglets et charger la Skill navigateur pour les travaux en plusieurs étapes.
- La Skill intégrée `browser-automation` porte la boucle opérationnelle plus longue :
  vérifier d’abord l’état/les onglets, étiqueter les onglets de tâche, prendre un instantané avant d’agir, reprendre un instantané
  après les changements d’interface, récupérer une fois les références obsolètes, et signaler les blocages de connexion/2FA/captcha ou
  caméra/microphone comme action manuelle au lieu de deviner.

Les Skills fournies par le plugin sont listées dans les Skills disponibles de l’agent lorsque le
plugin est activé. Les instructions complètes de la Skill sont chargées à la demande, de sorte que les tours routiniers ne paient pas le coût complet en tokens.

## Commande ou outil navigateur manquant

Si `openclaw browser` est inconnu après une mise à niveau, que `browser.request` est absent ou que l’agent signale que l’outil navigateur n’est pas disponible, la cause habituelle est une liste `plugins.allow` qui omet `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` et `tools.alsoAllow: ["browser"]` ne remplacent pas l’appartenance à la liste d’autorisation — la liste d’autorisation contrôle le chargement du plugin, et la politique d’outils ne s’exécute qu’après le chargement. Supprimer complètement `plugins.allow` rétablit également la valeur par défaut.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de rattachement Chrome MCP pour votre **vraie session Chrome connectée**.

Pour les appels d’outil navigateur de l’agent :

- Par défaut : utiliser le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions connectées existantes comptent et que l’utilisateur
  est devant l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est le remplacement explicite lorsque vous voulez un mode de navigateur spécifique.

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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

- Le service de contrôle se lie au loopback sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils locaux `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` ; ne les définissez que pour le CDP distant. `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications de joignabilité HTTP CDP à distance et `attachOnly`
  ainsi qu’aux requêtes HTTP d’ouverture d’onglet ; `remoteCdpHandshakeTimeoutMs` s’applique à
  leurs handshakes WebSocket CDP.
- `localLaunchTimeoutMs` est le budget accordé à un processus Chrome géré lancé localement
  pour exposer son point de terminaison HTTP CDP. `localCdpReadyTimeoutMs` est le
  budget de suivi pour la disponibilité du websocket CDP après la découverte du processus.
  Augmentez ces valeurs sur Raspberry Pi, VPS d’entrée de gamme ou matériel plus ancien où Chromium
  démarre lentement. Les valeurs sont plafonnées à 120000 ms.
- `actionTimeoutMs` est le budget par défaut pour les requêtes navigateur `act` lorsque l’appelant ne transmet pas `timeoutMs`. Le transport client ajoute une petite marge afin que les longues attentes puissent se terminer au lieu d’expirer à la frontière HTTP.
- `tabCleanup` est un nettoyage au mieux des efforts pour les onglets ouverts par les sessions navigateur de l’agent principal. Le nettoyage du cycle de vie des sous-agents, Cron et ACP ferme toujours leurs onglets explicitement suivis à la fin de la session ; les sessions principales conservent les onglets actifs réutilisables, puis ferment en arrière-plan les onglets suivis inactifs ou excédentaires.

</Accordion>

<Accordion title="Politique SSRF">

- La navigation du navigateur et l’ouverture d’onglets sont protégées contre SSRF avant la navigation et revérifiées au mieux sur l’URL finale `http(s)` ensuite.
- En mode SSRF strict, la découverte du point de terminaison CDP distant et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- Les variables d’environnement `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et `NO_PROXY` de Gateway/fournisseur ne mettent pas automatiquement en proxy le navigateur géré par OpenClaw. Le Chrome géré est lancé en direct par défaut afin que les paramètres proxy du fournisseur n’affaiblissent pas les vérifications SSRF du navigateur.
- Pour mettre en proxy le navigateur géré lui-même, transmettez des drapeaux proxy Chrome explicites via `browser.extraArgs`, tels que `--proxy-server=...` ou `--proxy-pac-url=...`. Le mode SSRF strict bloque le routage proxy explicite du navigateur sauf si l’accès au navigateur sur réseau privé est intentionnellement activé.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès du navigateur à un réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme ancien alias.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie ne jamais lancer un navigateur local ; seulement s’y attacher s’il est déjà en cours d’exécution.
- `headless` peut être défini globalement ou par profil géré local. Les valeurs par profil remplacent `browser.headless`, de sorte qu’un profil lancé localement peut rester sans interface tandis qu’un autre reste visible.
- `POST /start?headless=true` et `openclaw browser start --headless` demandent un
  lancement ponctuel sans interface pour les profils gérés localement sans réécrire
  `browser.headless` ni la configuration du profil. Les profils de session existante, `attachOnly` et
  CDP distant rejettent ce remplacement car OpenClaw ne lance pas ces
  processus de navigateur.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils gérés localement
  passent automatiquement en mode headless par défaut lorsque ni l’environnement ni la configuration
  du profil/global n’imposent explicitement le mode avec interface. `openclaw browser status --json`
  signale `headlessSource` comme `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` force les lancements gérés localement en mode headless pour le
  processus courant. `OPENCLAW_BROWSER_HEADLESS=0` force le mode avec interface pour les
  démarrages ordinaires et renvoie une erreur exploitable sur les hôtes Linux sans serveur d’affichage ;
  une requête explicite `start --headless` garde tout de même la priorité pour ce lancement.
- `executablePath` peut être défini globalement ou par profil géré local. Les valeurs par profil remplacent `browser.executablePath`, de sorte que différents profils gérés peuvent lancer différents navigateurs basés sur Chromium.
- `color` (niveau supérieur et par profil) teinte l’interface du navigateur pour que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (géré autonome). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil de session existante doit s’attacher à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
l’auto-détection. `~` est développé vers le répertoire personnel de votre OS :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou définissez-le dans la configuration, par plateforme :

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

`executablePath` par profil n’affecte que les profils gérés localement qu’OpenClaw
lance. Les profils `existing-session` se rattachent à un navigateur déjà en cours d’exécution,
et les profils CDP distants utilisent le navigateur derrière `cdpUrl`.

## Contrôle local ou distant

- **Contrôle local (par défaut) :** la Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; la Gateway y relaie les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.
- Pour les services CDP gérés en externe sur le loopback (par exemple Browserless dans
  Docker publié sur `127.0.0.1`), définissez aussi `attachOnly: true`. Un CDP loopback
  sans `attachOnly` est traité comme un profil de navigateur géré localement par OpenClaw.
- `headless` n’affecte que les profils gérés localement qu’OpenClaw lance. Il ne redémarre ni ne modifie les navigateurs `existing-session` ou CDP distants.
- `executablePath` suit la même règle de profil géré local. Le modifier sur un
  profil géré local déjà en cours d’exécution marque ce profil pour redémarrage/réconciliation afin que le
  prochain lancement utilise le nouveau binaire.

Le comportement à l’arrêt diffère selon le mode de profil :

- profils gérés localement : `openclaw browser stop` arrête le processus navigateur
  lancé par OpenClaw
- profils `attach-only` et CDP distants : `openclaw browser stop` ferme la
  session de contrôle active et libère les remplacements d’émulation Playwright/CDP (viewport,
  schéma de couleurs, paramètres régionaux, fuseau horaire, mode hors ligne et état similaire), même
  si aucun processus navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Tokens de requête (par ex. `https://provider.example?token=<token>`)
- Auth HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
tokens plutôt que de les valider dans les fichiers de configuration.

## Proxy navigateur node (valeur par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
router automatiquement les appels d’outil navigateur vers ce node sans configuration navigateur supplémentaire.
C’est le chemin par défaut pour les gateways distantes.

Remarques :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la configuration `browser.profiles` propre au node (comme en local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une limite de moindre privilège : seuls les profils de la liste d’autorisation peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface du proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser les deux formes, mais
pour un profil navigateur distant, l’option la plus simple est l’URL WebSocket directe
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

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai token Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous donne une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

### Browserless Docker sur le même hôte

Lorsque Browserless est auto-hébergé dans Docker et qu’OpenClaw s’exécute sur l’hôte, traitez
Browserless comme un service CDP géré en externe :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

L’adresse dans `browser.profiles.browserless.cdpUrl` doit être joignable depuis le
processus OpenClaw. Browserless doit aussi annoncer un point de terminaison correspondant et joignable ;
définissez `EXTERNAL` de Browserless sur cette même base WebSocket publique vers OpenClaw, telle que
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou une adresse Docker privée stable
sur le réseau. Si `/json/version` renvoie `webSocketDebuggerUrl` pointant vers
une adresse qu’OpenClaw ne peut pas joindre, l’HTTP CDP peut sembler sain tandis que le rattachement WebSocket
échoue quand même.

Ne laissez pas `attachOnly` non défini pour un profil Browserless en loopback. Sans
`attachOnly`, OpenClaw traite le port loopback comme un profil de navigateur géré localement
et peut signaler que le port est utilisé mais n’est pas possédé par OpenClaw.

## Fournisseurs CDP WebSocket directs

Certains services navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois formes
d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  se connecte. Pas de repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via un handshake WebSocket et ignore
  entièrement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw essaie d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  se replie sur un handshake WebSocket direct à la racine nue. Si le point de terminaison WebSocket
  annoncé rejette le handshake CDP mais que la racine nue configurée
  l’accepte, OpenClaw se replie aussi sur cette racine. Cela permet à un `ws://` nu
  pointé vers un Chrome local de se connecter quand même, puisque Chrome n’accepte les
  upgrades WebSocket que sur le chemin spécifique par cible depuis `/json/version`, tandis que les
  fournisseurs hébergés peuvent toujours utiliser leur point de terminaison WebSocket racine lorsque leur point de découverte
  annonce une URL éphémère qui ne convient pas à Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter
des navigateurs headless avec résolution CAPTCHA intégrée, mode furtif et proxies
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
- Browserbase crée automatiquement une session navigateur à la connexion WebSocket, donc aucune
  étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois.
  Voir la [tarification](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API
  complète, les guides SDK et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité au loopback ; l’accès passe par l’authentification de la Gateway ou l’appairage node.
- L’API HTTP de navigateur loopback autonome utilise **uniquement une authentification par secret partagé** :
  auth bearer par token de gateway, `x-openclaw-password` ou authentification HTTP Basic avec le
  mot de passe gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome de navigateur loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce token lorsque `gateway.auth.mode` est
  déjà `password`, `none` ou `trusted-proxy`.
- Conservez la Gateway et tout hôte node sur un réseau privé (Tailscale) ; évitez l’exposition publique.
- Traitez les URL/tokens CDP distants comme des secrets ; préférez des variables d’environnement ou un gestionnaire de secrets.

Conseils pour le CDP distant :

- Préférez des points de terminaison chiffrés (HTTPS ou WSS) et des tokens de courte durée lorsque c’est possible.
- Évitez d’intégrer directement des tokens longue durée dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par OpenClaw** : une instance dédiée de navigateur basé sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il est absent.
- Le profil `user` est intégré pour le rattachement `existing-session` via Chrome MCP.
- Les profils `existing-session` sont opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués par défaut dans la plage **18800–18899**.
- Supprimer un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; le CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut aussi se rattacher à un profil de navigateur basé sur Chromium en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

En option : créez votre propre profil `existing-session` personnalisé si vous souhaitez un
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

Puis, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Laissez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsqu’OpenClaw s’y rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test smoke de rattachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble une réussite :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets de navigateur déjà ouverts
- `snapshot` renvoie des références depuis l’onglet actif sélectionné

Que vérifier si le rattachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement de rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration navigateur basée sur une extension et vérifie que
  Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas
  activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil `existing-session` personnalisé, transmettez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  de rattachement.
- la Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw` car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il s’y rattache uniquement.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, il est transmis afin de cibler ce répertoire de données utilisateur.
- `existing-session` peut se rattacher sur l’hôte sélectionné ou via un
  nœud navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun nœud navigateur n’est connecté, utilisez
  plutôt le CDP distant ou un hôte node.

### Lancement Chrome MCP personnalisé

Remplacez le serveur Chrome DevTools MCP lancé par profil lorsque le flux par défaut
`npx chrome-devtools-mcp@latest` ne vous convient pas (hôtes hors ligne,
versions épinglées, binaires fournis avec le projet) :

| Champ        | Ce qu’il fait                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Exécutable à lancer à la place de `npx`. Résolu tel quel ; les chemins absolus sont respectés.                           |
| `mcpArgs`    | Tableau d’arguments transmis tel quel à `mcpCommand`. Remplace les arguments par défaut `chrome-devtools-mcp@latest --autoConnect`. |

Lorsque `cdpUrl` est défini sur un profil `existing-session`, OpenClaw ignore
`--autoConnect` et transmet automatiquement le point de terminaison à Chrome MCP :

- `http(s)://...` → `--browserUrl <url>` (point de terminaison de découverte HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direct).

Les drapeaux de point de terminaison et `userDataDir` ne peuvent pas être combinés : lorsque `cdpUrl` est défini,
`userDataDir` est ignoré pour le lancement Chrome MCP, puisque Chrome MCP se rattache au
navigateur en cours d’exécution derrière le point de terminaison au lieu d’ouvrir un répertoire
de profil.

<Accordion title="Limites des fonctionnalités existing-session">

Par rapport au profil géré `openclaw`, les drivers `existing-session` sont plus limités :

- **Captures d’écran** — les captures de page et les captures d’élément avec `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas requis pour les captures d’écran de page ou d’élément basées sur des références.
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des références d’instantané (pas de sélecteurs CSS). `click-coords` clique sur des coordonnées visibles dans la fenêtre et ne nécessite pas de référence d’instantané. `click` ne prend en charge que le bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge les délais d’attente par appel. `select` accepte une seule valeur.
- **Attente / téléversement / boîte de dialogue** — `wait --url` prend en charge les motifs exacts, par sous-chaîne et glob ; `wait --load networkidle` n’est pas pris en charge. Les hooks de téléversement nécessitent `ref` ou `inputRef`, un fichier à la fois, sans `element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les remplacements de délai d’attente.
- **Fonctionnalités réservées au mode géré** — les actions par lot, l’export PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les flux de travail de développement.
- **Contrôle déterministe des onglets** : `tabs` renvoie d’abord `suggestedTargetId`, puis
  des identifiants `tabId` stables tels que `t1`, des libellés facultatifs et le `targetId` brut.
  Les agents doivent réutiliser `suggestedTargetId` ; les identifiants bruts restent disponibles pour
  le débogage et la compatibilité.

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez le remplacer avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : vérifie les emplacements courants de Chrome/Brave/Edge/Chromium sous `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` et
  `/usr/lib/chromium-browser`.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les scripts et le débogage, la Gateway expose une petite **API HTTP de contrôle
limitée au loopback** ainsi qu’un CLI `openclaw browser` correspondant (instantanés, références, options avancées de wait,
sortie JSON, flux de débogage). Voir
[API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes spécifiques à Linux (en particulier snap Chromium), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations hôte partagé WSL2 Gateway + Chrome Windows, voir
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Ce sont deux classes d’échec différentes et elles pointent vers des chemins de code différents.

- **Échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` lorsqu’un
    service CDP externe en loopback est configuré sans `attachOnly: true`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, `snapshot` ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau alors que `start` et `tabs` fonctionnent toujours

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment interpréter les résultats :

- Si `start` échoue avec `not reachable after start`, dépannez d’abord la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours défaillant. Traitez cela comme un problème de joignabilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur fonctionne et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants du comportement :

- La configuration du navigateur utilise par défaut un objet de politique SSRF fermé par défaut même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local `openclaw` en loopback, les vérifications de santé CDP ignorent volontairement l’application de la joignabilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat positif de `start` ou `tabs` ne signifie pas qu’une cible `open` ou `navigate` ultérieure est autorisée.

Conseils de sécurité :

- N’assouplissez **pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites comme `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement approuvés où l’accès du navigateur au réseau privé est requis et révisé.

## Outils d’agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du navigateur :

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les identifiants `ref` de l’instantané pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière, élément ou références étiquetées).
- `browser doctor` vérifie la Gateway, le plugin, le profil, le navigateur et l’état de préparation des onglets.
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un nœud capable de navigateur est connecté, l’outil peut y être routé automatiquement sauf si vous fixez `target="host"` ou `target="node"`.

Cela maintient le comportement de l’agent déterministe et évite les sélecteurs fragiles.

## Voir aussi

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans des environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques et durcissement du contrôle du navigateur
