---
read_when:
    - Vous avez besoin de la sémantique exacte des champs de configuration ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration de Gateway pour les clés, valeurs par défaut et liens vers les références dédiées des sous-systèmes du cœur d’OpenClaw
title: Référence de configuration
x-i18n:
    generated_at: "2026-04-25T18:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7e904455845a9559a0a8ed67b217597819f4a8abc38e6c8ecb69b6481528e8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Référence de configuration du cœur pour `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâches, voir [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d’OpenClaw et renvoie ailleurs lorsqu’un sous-système possède sa propre référence plus détaillée. Les catalogues de commandes propres aux canaux et aux plugins, ainsi que les réglages détaillés de la mémoire/QMD, se trouvent sur leurs propres pages plutôt que sur celle-ci.

Source de vérité du code :

- `openclaw config schema` affiche le schéma JSON actif utilisé pour la validation et l’UI de contrôle, avec les métadonnées groupées/plugin/canal fusionnées lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma limité à un chemin pour les outils d’exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hash de base des documents de configuration par rapport à la surface de schéma actuelle

Références détaillées dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de Dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel de commandes intégrées + groupées
- pages du canal/plugin propriétaire pour les surfaces de commande spécifiques au canal

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs — OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée — voir
[Configuration — canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et d’autres
canaux groupés (authentification, contrôle d’accès, multi-comptes, filtrage des mentions).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée — voir
[Configuration — agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, réflexion, Heartbeat, mémoire, médias, Skills, sandbox)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie de la session, Compaction, élagage)
- `messages.*` (remise des messages, TTS, rendu Markdown)
- `talk.*` (mode Talk)
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)

## Outils et fournisseurs personnalisés

La stratégie des outils, les bascules expérimentales, la configuration d’outils adossés à un fournisseur et la configuration des fournisseurs personnalisés / d’URL de base ont été déplacées vers une page dédiée — voir
[Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## MCP

Les définitions de serveur MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
consommées par Pi intégré et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au
serveur cible pendant les modifications de configuration.

```json5
{
  mcp: {
    // Facultatif. Par défaut : 600000 ms (10 minutes). Définissez 0 pour désactiver l’éviction à l’inactivité.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les environnements d’exécution qui
  exposent les outils MCP configurés.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les environnements d’exécution MCP groupés à portée de session.
  Les exécutions intégrées à usage unique demandent un nettoyage à la fin de l’exécution ; ce TTL constitue la sécurité de repli pour les
  sessions de longue durée et les futurs appelants.
- Les modifications sous `mcp.*` s’appliquent à chaud en éliminant les environnements d’exécution MCP de session mis en cache.
  La prochaine découverte/utilisation d’outil les recrée à partir de la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont nettoyées immédiatement au lieu d’attendre le TTL d’inactivité.

Voir [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement d’exécution.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d’autorisation facultative pour les Skills groupées uniquement (les Skills gérées/de l’espace de travail ne sont pas affectées).
- `load.extraDirs` : racines supplémentaires de Skills partagées (priorité la plus basse).
- `install.preferBrew` : lorsque `true`, préfère les installateurs Homebrew lorsque `brew` est
  disponible avant de revenir à d’autres types d’installateurs.
- `install.nodeManager` : préférence d’installateur Node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` désactive une Skill même si elle est groupée/installée.
- `entries.<skillKey>.apiKey` : raccourci pour les Skills déclarant une variable d’environnement principale (chaîne en clair ou objet SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Chargés depuis `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- La découverte accepte les plugins OpenClaw natifs ainsi que les bundles Codex compatibles et les bundles Claude, y compris les bundles Claude sans manifeste en disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage de Gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins listés sont chargés). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ de commodité de clé API au niveau du plugin (lorsqu’il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : mappage de variables d’environnement limité au plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs modifiant l’invite provenant de l’ancien `before_agent_start`, tout en conservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugin natifs et aux répertoires de hooks fournis par bundle pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les plugins de confiance non groupés peuvent lire le contenu brut de conversation depuis des hooks typés tels que `llm_input`, `llm_output` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : faire explicitement confiance à ce plugin pour demander des remplacements `provider` et `model` par exécution pour les exécutions de sous-agent en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative des cibles canoniques `provider/model` pour les remplacements de sous-agent de confiance. Utilisez `"*"` uniquement lorsque vous souhaitez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma du plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte/d’exécution des plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du plugin propriétaire, et non par un registre central d’options OpenClaw.
- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération web Firecrawl.
  - `apiKey` : clé API Firecrawl (accepte SecretRef). Revient à `plugins.entries.firecrawl.config.webSearch.apiKey`, à l’ancien `tools.web.fetch.firecrawl.apiKey` ou à la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev`).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche web Grok).
  - `enabled` : active le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de Dreaming de la mémoire. Voir [Dreaming](/fr/concepts/dreaming) pour les phases et les seuils.
  - `enabled` : interrupteur principal de Dreaming (par défaut `false`).
  - `frequency` : cadence Cron pour chaque balayage complet de Dreaming (`"0 3 * * *"` par défaut).
  - la stratégie de phase et les seuils sont des détails d’implémentation (pas des clés de configuration destinées à l’utilisateur).
- La configuration mémoire complète se trouve dans [Référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les plugins de bundle Claude activés peuvent également contribuer des valeurs par défaut Pi intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent nettoyés, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisit l’identifiant du plugin mémoire actif, ou `"none"` pour désactiver les plugins mémoire.
- `plugins.slots.contextEngine` : choisit l’identifiant du plugin de moteur de contexte actif ; par défaut `"legacy"` sauf si vous installez et sélectionnez un autre moteur.
- `plugins.installs` : métadonnées d’installation gérées par la CLI et utilisées par `openclaw plugins update`.
  - Inclut `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traitez `plugins.installs.*` comme un état géré ; préférez les commandes CLI aux modifications manuelles.

Voir [Plugins](/fr/tools/plugin).

---

## Navigateur

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` désactive `act:evaluate` et `wait --fn`.
- `tabCleanup` récupère les onglets suivis de l’agent principal après une période d’inactivité ou lorsqu’une
  session dépasse son plafond. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuels.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, de sorte que la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur réseau privé.
- En mode strict, les points de terminaison de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage de réseau privé lors des vérifications de joignabilité/découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour des exceptions explicites.
- Les profils distants sont en attachement uniquement (démarrage/arrêt/réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent à la joignabilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglet. Les profils loopback gérés
  conservent les valeurs par défaut CDP locales.
- Si un service CDP géré en externe est joignable via loopback, définissez
  `attachOnly: true` pour ce profil ; sinon OpenClaw traite le port loopback comme un
  profil de navigateur local géré et peut signaler des erreurs locales de propriété de port.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent s’attacher sur
  l’hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil de navigateur
  basé sur Chromium spécifique tel que Brave ou Edge.
- Les profils `existing-session` conservent les limites actuelles de routage Chrome MCP :
  actions pilotées par instantané/réf au lieu d’un ciblage par sélecteur CSS, hooks de téléversement d’un seul fichier,
  aucun remplacement de délai d’expiration de boîte de dialogue, aucun `wait --load networkidle`, et pas de
  `responsebody`, export PDF, interception de téléchargement ni actions par lot.
- Les profils `openclaw` gérés localement attribuent automatiquement `cdpPort` et `cdpUrl` ; ne
  définissez `cdpUrl` explicitement que pour un CDP distant.
- Les profils gérés localement peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez ceci pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils gérés localement utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP Chrome CDP locale
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour l’état prêt du websocket CDP
  après lancement. Augmentez-les sur les hôtes plus lents où Chrome démarre correctement mais où les vérifications d’état prêt devancent le démarrage.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` accepte `~` pour le répertoire personnel de votre OS.
- Service de contrôle : loopback uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des drapeaux de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, dimensionnement de fenêtre ou drapeaux de débogage).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor` : couleur d’accent pour le chrome UI de l’application native (teinte de bulle du mode Talk, etc.).
- `assistant` : remplacement d’identité de l’UI de contrôle. Revient à l’identité de l’agent actif.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Détails des champs Gateway">

- `mode` : `local` (exécuter Gateway) ou `remote` (se connecter à un Gateway distant). Gateway refuse de démarrer sauf en mode `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement) ou `custom`.
- **Alias de bind hérités** : utilisez les valeurs de mode bind dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), et non les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Note Docker** : le bind `loopback` par défaut écoute sur `127.0.0.1` dans le conteneur. Avec le réseau bridge Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc Gateway est inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Auth** : requise par défaut. Les binds non loopback nécessitent l’authentification Gateway. En pratique, cela signifie un token/mot de passe partagé ou un proxy inverse conscient de l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’onboarding génère un token par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRef), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode sans authentification explicite. À utiliser uniquement pour des configurations loopback locales de confiance ; ce mode n’est intentionnellement pas proposé par les invites d’onboarding.
- `gateway.auth.mode: "trusted-proxy"` : déléguer l’authentification à un proxy inverse conscient de l’identité et faire confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)). Ce mode attend une source proxy **non loopback** ; les proxies inverses loopback sur le même hôte ne satisfont pas l’authentification par proxy de confiance.
- `gateway.auth.allowTailscale` : lorsque `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de l’UI de contrôle/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison HTTP API n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d’authentification HTTP normal du Gateway. Ce flux sans token suppose que l’hôte Gateway est de confiance. La valeur par défaut est `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d’authentification. S’applique par IP cliente et par portée d’authentification (secret partagé et token d’appareil sont suivis séparément). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone Tailscale Serve de l’UI de contrôle, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives erronées concurrentes provenant du même client peuvent donc déclencher le limiteur lors de la deuxième requête au lieu que les deux passent en concurrence comme de simples non-correspondances.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous voulez intentionnellement que le trafic localhost soit lui aussi limité (pour des configurations de test ou des déploiements proxy stricts).
- Les tentatives d’authentification WS d’origine navigateur sont toujours limitées avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost basée sur le navigateur).
- En loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin` normalisée, afin que des échecs répétés d’une origine localhost n’entraînent pas automatiquement le verrouillage d’une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, bind loopback) ou `funnel` (public, nécessite une authentification).
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines navigateur pour les connexions WebSocket du Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active le repli d’origine basé sur l’en-tête Host pour les déploiements qui s’appuient intentionnellement sur cette politique d’origine.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : remplacement coupe-circuit côté environnement de processus client qui autorise `ws://` en clair vers des IP de réseau privé de confiance ; par défaut, le texte en clair reste limité au loopback. Il n’existe pas d’équivalent dans `openclaw.json`, et la configuration réseau privé du navigateur telle que `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` n’affecte pas les clients WebSocket Gateway.
- `gateway.remote.token` / `.password` sont des champs d’identifiants du client distant. Ils ne configurent pas à eux seuls l’authentification du Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé par les builds iOS officiels/TestFlight après avoir publié au Gateway des enregistrements adossés au relais. Cette URL doit correspondre à l’URL du relais compilée dans le build iOS.
- `gateway.push.apns.relay.timeoutMs` : délai d’expiration d’envoi du Gateway vers le relais en millisecondes. Par défaut : `10000`.
- Les enregistrements adossés au relais sont délégués à une identité Gateway spécifique. L’app iOS appairée récupère `gateway.identity.get`, inclut cette identité dans l’enregistrement du relais et transmet au Gateway une autorisation d’envoi limitée à cet enregistrement. Un autre Gateway ne peut pas réutiliser cet enregistrement stocké.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : remplacements temporaires par variable d’environnement pour la configuration de relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP en loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur de santé des canaux en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé. Par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète en minutes. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur de santé par canal/compte sur une heure glissante. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation facultative par canal des redémarrages du moniteur de santé tout en gardant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement par compte pour les canaux multi-comptes. Lorsqu’il est défini, il a priorité sur le remplacement au niveau du canal.
- Les chemins d’appel Gateway locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fail-closed (pas de masquage par repli distant).
- `trustedProxies` : IP de proxies inverses qui terminent TLS ou injectent des en-têtes de client transféré. Ne listez que les proxies que vous contrôlez. Les entrées loopback restent valides pour des configurations de détection proxy sur le même hôte/locales (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback éligibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Par défaut `false` pour un comportement fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation facultative CIDR/IP pour approuver automatiquement l’appairage initial d’un appareil Node sans portées demandées. Il est désactivé lorsqu’il n’est pas défini. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/UI de contrôle/WebChat, ni les mises à niveau de rôle, de portée, de métadonnées ou de clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : façonnage global allow/deny pour les commandes Node déclarées après l’appairage et l’évaluation de la liste d’autorisation.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour HTTP `POST /tools/invoke` (étend la liste deny par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste deny HTTP par défaut.

</Accordion>

### Points de terminaison compatibles OpenAI

- Chat Completions : désactivé par défaut. Activez-le avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses : `gateway.http.endpoints.responses.enabled`.
- Renforcement des entrées URL de Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération par URL.
- En-tête facultatif de renforcement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instances

Exécutez plusieurs Gateway sur un seul hôte avec des ports et des répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicateurs pratiques : `--dev` (utilise `~/.openclaw-dev` + le port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

Voir [Multiple Gateways](/fr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled` : active la terminaison TLS sur l’écouteur Gateway (HTTPS/WSS) (par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire cert/key auto-signée locale lorsque des fichiers explicites ne sont pas configurés ; pour un usage local/dev uniquement.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez des permissions restrictives.
- `caPath` : chemin facultatif vers un bundle CA pour la vérification des clients ou des chaînes de confiance personnalisées.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode` : contrôle la manière dont les modifications de configuration sont appliquées à l’exécution.
  - `"off"` : ignorer les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : toujours redémarrer le processus Gateway lors d’un changement de configuration.
  - `"hot"` : appliquer les changements dans le processus sans redémarrer.
  - `"hybrid"` (par défaut) : essayer d’abord le rechargement à chaud ; revenir au redémarrage si nécessaire.
- `debounceMs` : fenêtre d’anti-rebond en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs` : temps maximal facultatif en ms pour attendre la fin des opérations en cours avant de forcer un redémarrage. Omettez-le ou définissez `0` pour attendre indéfiniment et journaliser périodiquement des avertissements indiquant ce qui reste en attente.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth : `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Les tokens de hook dans la chaîne de requête sont rejetés.

Notes sur la validation et la sécurité :

- `hooks.enabled=true` requiert un `hooks.token` non vide.
- `hooks.token` doit être **distinct** de `gateway.auth.token` ; la réutilisation du token Gateway est rejetée.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié tel que `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mapping ou un preset utilise un `sessionKey` à modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés statiques de mapping n’exigent pas cette activation.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` provenant de la charge utile de la requête est accepté uniquement lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` rendues par modèle dans le mapping sont traitées comme fournies de l’extérieur et exigent également `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mapping">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de hook.
  - `transform.module` doit être un chemin relatif et reste dans `hooks.transformsDir` (les chemins absolus et la traversée sont rejetés).
- `agentId` route vers un agent spécifique ; les ID inconnus reviennent à la valeur par défaut.
- `allowedAgentIds` : limite le routage explicite (`*` ou omis = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d’agent hook sans `sessionKey` explicite.
- `allowRequestSessionKey` : autoriser les appelants de `/hooks/agent` et les clés de session de mapping pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d’autorisation facultative de préfixes pour les valeurs `sessionKey` explicites (requête + mapping), par ex. `["hook:"]`. Elle devient requise lorsqu’un mapping ou preset utilise un `sessionKey` à modèle.
- `deliver: true` envoie la réponse finale vers un canal ; `channel` vaut `last` par défaut.
- `model` remplace le LLM pour cette exécution de hook (doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le preset Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` pour qu’ils correspondent à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le preset par un `sessionKey` statique au lieu de la valeur par défaut à modèle.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway démarre automatiquement `gog gmail watch serve` au démarrage lorsqu’il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N’exécutez pas un `gog gmail watch serve` séparé en parallèle du Gateway.

---

## Hôte Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sert du HTML/CSS/JS modifiable par agent et A2UI via HTTP sous le port Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : gardez `gateway.bind: "loopback"` (par défaut).
- Binds non loopback : les routes canvas exigent l’authentification Gateway (token/password/trusted-proxy), comme les autres surfaces HTTP Gateway.
- Les WebViews Node n’envoient généralement pas d’en-têtes d’authentification ; après appairage et connexion d’un node, le Gateway annonce des URL de capacité limitées au node pour l’accès à canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du node et expirent rapidement. Le repli basé sur l’IP n’est pas utilisé.
- Injecte un client de rechargement à chaud dans le HTML servi.
- Crée automatiquement un `index.html` de démarrage lorsqu’il est vide.
- Sert également A2UI à `/__openclaw__/a2ui/`.
- Les changements nécessitent un redémarrage du Gateway.
- Désactivez le rechargement à chaud pour les grands répertoires ou les erreurs `EMFILE`.

---

## Découverte

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (par défaut) : omet `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclut `cliPath` + `sshPort`.
- Le nom d’hôte vaut `openclaw` par défaut. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour une découverte inter-réseaux, associez-la à un serveur DNS (CoreDNS recommandé) + DNS partagé Tailscale.

Configuration : `openclaw dns setup --apply`.

---

## Environnement

### `env` (variables d’environnement en ligne)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Les variables d’environnement en ligne ne sont appliquées que si l’environnement du processus ne contient pas déjà la clé.
- Fichiers `.env` : `.env` du répertoire de travail + `~/.openclaw/.env` (aucun des deux ne remplace des variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil shell de connexion.
- Voir [Environnement](/fr/help/environment) pour la priorité complète.

### Substitution de variable d’environnement

Référencez des variables d’environnement dans n’importe quelle chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`.
- Les variables manquantes/vides déclenchent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour obtenir un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secret sont additives : les valeurs en clair continuent de fonctionner.

### `SecretRef`

Utilisez une seule forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- motif de `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- motif d’ID pour `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- motif d’ID pour `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- les ID `source: "exec"` ne doivent pas contenir de segments de chemin `/./` ou `/../` séparés par des slashs (par exemple `a/../b` est rejeté)

### Surface d’identifiants prise en charge

- Matrice canonique : [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins d’identifiants `openclaw.json` pris en charge.
- Les références `auth-profiles.json` sont incluses dans la résolution à l’exécution et la couverture d’audit.

### Configuration des fournisseurs de secrets

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Remarques :

- Le fournisseur `file` prend en charge `mode: "json"` et `mode: "singleValue"` (`id` doit être `"value"` en mode singleValue).
- Les chemins des fournisseurs file et exec échouent en mode fail-closed lorsque la vérification ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour des chemins de confiance qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` exige un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande symlink sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins symlink tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification des répertoires de confiance s’applique au chemin cible résolu.
- L’environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secret sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage de surface active s’applique pendant l’activation : les références non résolues sur des surfaces activées font échouer le démarrage/rechargement, tandis que les surfaces inactives sont ignorées avec diagnostic.

---

## Stockage de l’authentification

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Les profils par agent sont stockés dans `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` prend en charge les références au niveau de la valeur (`keyRef` pour `api_key`, `tokenRef` pour `token`) pour les modes d’identifiants statiques.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification adossés à SecretRef.
- Les identifiants statiques d’exécution proviennent d’instantanés résolus en mémoire ; les anciennes entrées statiques `auth.json` sont nettoyées lorsqu’elles sont découvertes.
- Importations OAuth héritées depuis `~/.openclaw/credentials/oauth.json`.
- Voir [OAuth](/fr/concepts/oauth).
- Comportement d’exécution des secrets et outillage `audit/configure/apply` : [Gestion des secrets](/fr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours` : backoff de base en heures lorsqu’un profil échoue en raison de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Un texte explicite de facturation peut toujours aboutir ici même sur des réponses `401`/`403`, mais les correspondances textuelles spécifiques au fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Les messages réessayables HTTP `402` liés à une fenêtre d’usage ou à une limite de dépense d’organisation/espace de travail restent sur le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur pour les heures de backoff de facturation.
- `billingMaxHours` : plafond en heures de la croissance exponentielle du backoff de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : backoff de base en minutes pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes de la croissance du backoff `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de backoff (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profil d’authentification sur le même fournisseur pour les erreurs de surcharge avant de basculer vers le repli de modèle (par défaut : `1`). Les formes de fournisseur occupé telles que `ModelNotReadyException` aboutissent ici.
- `overloadedBackoffMs` : délai fixe avant de retenter une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profil d’authentification sur le même fournisseur pour les erreurs de limite de débit avant de basculer vers le repli de modèle (par défaut : `1`). Ce compartiment de limite de débit inclut du texte propre au fournisseur tel que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

---

## Journalisation

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Fichier journal par défaut : `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Définissez `logging.file` pour un chemin stable.
- `consoleLevel` passe à `debug` avec `--verbose`.
- `maxFileBytes` : taille maximale du fichier journal en octets avant suppression des écritures (entier positif ; par défaut : `524288000` = 500 MB). Utilisez une rotation de logs externe pour les déploiements de production.

---

## Diagnostic

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled` : interrupteur principal pour la sortie d’instrumentation (par défaut : `true`).
- `flags` : tableau de chaînes d’indicateur activant une sortie de journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’ancienneté en ms pour émettre des avertissements de session bloquée tant qu’une session reste en état de traitement.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (par défaut : `false`).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom du service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : activent l’export de traces, de métriques ou de logs.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`–`1`.
- `otel.flushIntervalMs` : intervalle périodique de vidage de la télémétrie en ms.
- `otel.captureContent` : capture explicite du contenu brut pour les attributs de span OTEL. Désactivée par défaut. La valeur booléenne `true` capture le contenu des messages/outils non système ; la forme objet vous permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` et `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1` : indicateur d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK possédé par le plugin tout en gardant les écouteurs de diagnostic actifs.
- `cacheTrace.enabled` : journaliser des instantanés de trace de cache pour les exécutions intégrées (par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie pour le JSONL de trace de cache (par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôlent ce qui est inclus dans la sortie de trace de cache (tous à `true` par défaut).

---

## Mise à jour

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel` : canal de publication pour les installations npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart` : vérifier les mises à jour npm au démarrage du Gateway (par défaut : `true`).
- `auto.enabled` : activer la mise à jour automatique en arrière-plan pour les installations de package (par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant application automatique sur le canal stable (par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre de répartition supplémentaire du déploiement du canal stable en heures (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence d’exécution des vérifications du canal bêta en heures (par défaut : `1` ; max : `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled` : porte de fonctionnalité ACP globale (par défaut : `false`).
- `dispatch.enabled` : porte indépendante pour la répartition des tours de session ACP (par défaut : `true`). Définissez `false` pour conserver les commandes ACP disponibles tout en bloquant l’exécution.
- `backend` : identifiant backend d’exécution ACP par défaut (doit correspondre à un plugin d’exécution ACP enregistré).
- `defaultAgent` : identifiant d’agent cible ACP de repli lorsque les lancements ne spécifient pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agent autorisés pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage à l’inactivité en ms pour le texte diffusé.
- `stream.maxChunkChars` : taille maximale d’un bloc avant division de la projection de bloc diffusé.
- `stream.repeatSuppression` : supprime les lignes d’état/d’outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse de manière incrémentale ; `"final_only"` met en tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après des événements d’outil cachés (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes projetées d’état/mise à jour ACP.
- `stream.tagVisibility` : enregistrement des noms de balise vers des remplacements booléens de visibilité pour les événements diffusés.
- `runtime.ttlMinutes` : TTL d’inactivité en minutes pour les workers de session ACP avant nettoyage possible.
- `runtime.installCommand` : commande d’installation facultative à exécuter lors de l’amorçage d’un environnement d’exécution ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` contrôle le style du slogan de la bannière :
  - `"random"` (par défaut) : slogans tournants amusants/saisonniers.
  - `"default"` : slogan neutre fixe (`Tous vos chats, un seul OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre/la version de la bannière restent affichés).
- Pour masquer toute la bannière (pas seulement les slogans), définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Assistant

Métadonnées écrites par les flux de configuration guidée de la CLI (`onboard`, `configure`, `doctor`) :

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identité

Voir les champs d’identité de `agents.list` sous [Valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Bridge (hérité, supprimé)

Les builds actuels n’incluent plus le bridge TCP. Les Nodes se connectent via le WebSocket Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu’elles ne sont pas supprimées ; `openclaw doctor --fix` peut supprimer les clés inconnues).

<Accordion title="Configuration bridge héritée (référence historique)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention` : durée de conservation des sessions d’exécution Cron isolées terminées avant élagage depuis `sessions.json`. Contrôle également le nettoyage des transcriptions Cron supprimées archivées. Par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : taille maximale par fichier journal d’exécution (`cron/runs/<jobId>.jsonl`) avant élagage. Par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes conservées lorsque l’élagage du journal d’exécution est déclenché. Par défaut : `2000`.
- `webhookToken` : token bearer utilisé pour la remise POST au Webhook Cron (`delivery.mode = "webhook"`) ; si omis, aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL Webhook de repli héritée obsolète (http/https) utilisée uniquement pour les tâches stockées qui ont encore `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches ponctuelles sur erreurs transitoires (par défaut : `3` ; plage : `0`–`10`).
- `backoffMs` : tableau de délais de backoff en ms pour chaque nouvelle tentative (par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d’erreur qui déclenchent des nouvelles tentatives — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

S’applique uniquement aux tâches Cron ponctuelles. Les tâches récurrentes utilisent une gestion des échecs distincte.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled` : activer les alertes d’échec pour les tâches Cron (par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant déclenchement d’une alerte (entier positif, min : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre alertes répétées pour la même tâche (entier non négatif).
- `mode` : mode de remise — `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : identifiant facultatif de compte ou de canal pour limiter la remise de l’alerte.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destination par défaut pour les notifications d’échec Cron sur toutes les tâches.
- `mode` : `"announce"` ou `"webhook"` ; vaut `"announce"` par défaut lorsqu’il existe suffisamment de données cibles.
- `channel` : remplacement de canal pour la remise announce. `"last"` réutilise le dernier canal de remise connu.
- `to` : cible announce explicite ou URL Webhook. Requis pour le mode webhook.
- `accountId` : remplacement de compte facultatif pour la remise.
- `delivery.failureDestination` par tâche remplace cette valeur par défaut globale.
- Lorsqu’aucune destination d’échec globale ni par tâche n’est définie, les tâches qui remettent déjà via `announce` reviennent à cette cible announce principale en cas d’échec.
- `delivery.failureDestination` n’est pris en charge que pour les tâches `sessionTarget="isolated"` sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions Cron isolées sont suivies comme [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle média

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans historique/enveloppes d’expéditeur) |
| `{{BodyStripped}}` | Corps avec les mentions de groupe supprimées      |
| `{{From}}`         | Identifiant de l’expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | ID du message de canal                            |
| `{{SessionId}}`    | UUID de la session actuelle                       |
| `{{IsNewSession}}` | `"true"` lorsqu’une nouvelle session est créée    |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite média résolue pour les entrées CLI         |
| `{{MaxChars}}`     | Nombre maximal de caractères résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (best effort)                     |
| `{{GroupMembers}}` | Aperçu des membres du groupe (best effort)        |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (best effort)     |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (best effort) |
| `{{Provider}}`     | Indice de fournisseur (whatsapp, telegram, discord, etc.) |

---

## Includes de configuration (`$include`)

Découpez la configuration en plusieurs fichiers :

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportement de fusion :**

- Fichier unique : remplace l’objet conteneur.
- Tableau de fichiers : fusion profonde dans l’ordre (les suivants remplacent les précédents).
- Clés sœurs : fusionnées après les includes (remplacent les valeurs incluses).
- Includes imbriqués : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus par rapport au fichier incluant, mais doivent rester à l’intérieur du répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues/`../` sont autorisées uniquement si elles se résolvent toujours à l’intérieur de cette limite.
- Les écritures gérées par OpenClaw qui modifient une seule section de niveau supérieur adossée à un include à fichier unique sont propagées dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les includes racine, les tableaux d’include et les includes avec remplacements de clés sœurs sont en lecture seule pour les écritures gérées par OpenClaw ; ces écritures échouent en mode fail-closed au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse et les includes circulaires.

---

_Associé : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Associé

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
