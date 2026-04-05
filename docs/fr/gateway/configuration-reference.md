---
read_when:
    - Vous avez besoin de la sémantique exacte des champs de configuration ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de gateway ou d’outil
summary: Référence complète de chaque clé de configuration OpenClaw, des valeurs par défaut et des paramètres de canal
title: Référence de configuration
x-i18n:
    generated_at: "2026-04-05T12:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb4c6de7955aa0c6afa2d20f12a0e3782b16ab2c1b6bf3ed0a8910be2f0a47d1
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Référence de configuration

Chaque champ disponible dans `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâches, consultez [Configuration](/gateway/configuration).

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs — OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Chaque canal démarre automatiquement lorsque sa section de configuration existe (sauf si `enabled: false`).

### Accès DM et groupe

Tous les canaux prennent en charge les politiques DM et les politiques de groupe :

| Politique DM        | Comportement                                                    |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (par défaut) | Les expéditeurs inconnus reçoivent un code de pairing à usage unique ; le propriétaire doit l’approuver |
| `allowlist`         | Uniquement les expéditeurs dans `allowFrom` (ou le magasin d’autorisations pairées) |
| `open`              | Autoriser tous les DM entrants (nécessite `allowFrom: ["*"]`)   |
| `disabled`          | Ignorer tous les DM entrants                                    |

| Politique de groupe   | Comportement                                           |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (par défaut) | Uniquement les groupes correspondant à la liste d’autorisation configurée |
| `open`                | Ignore les listes d’autorisation de groupes (le filtrage par mention s’applique toujours) |
| `disabled`            | Bloque tous les messages de groupe/salon               |

<Note>
`channels.defaults.groupPolicy` définit la valeur par défaut lorsqu’un `groupPolicy` de provider n’est pas défini.
Les codes de pairing expirent après 1 heure. Les demandes de pairing DM en attente sont limitées à **3 par canal**.
Si un bloc provider est totalement absent (`channels.<provider>` absent), la politique de groupe à l’exécution revient à `allowlist` (échec en mode fermé) avec un avertissement au démarrage.
</Note>

### Remplacements de modèle par canal

Utilisez `channels.modelByChannel` pour épingler des ID de canal spécifiques à un modèle. Les valeurs acceptent `provider/model` ou des alias de modèle configurés. Le mappage de canal s’applique lorsqu’une session n’a pas déjà de remplacement de modèle (par exemple défini via `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Valeurs par défaut des canaux et heartbeat

Utilisez `channels.defaults` pour le comportement partagé des politiques de groupe et du heartbeat entre les providers :

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy` : politique de groupe de repli lorsqu’un `groupPolicy` de niveau provider n’est pas défini.
- `channels.defaults.contextVisibility` : mode de visibilité du contexte complémentaire par défaut pour tous les canaux. Valeurs : `all` (par défaut, inclure tout le contexte cité/de fil/d’historique), `allowlist` (inclure uniquement le contexte des expéditeurs autorisés), `allowlist_quote` (identique à allowlist mais conserve le contexte explicite de citation/réponse). Remplacement par canal : `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk` : inclure les statuts de canaux sains dans la sortie heartbeat.
- `channels.defaults.heartbeat.showAlerts` : inclure les statuts dégradés/en erreur dans la sortie heartbeat.
- `channels.defaults.heartbeat.useIndicator` : afficher une sortie heartbeat compacte de type indicateur.

### WhatsApp

WhatsApp fonctionne via le canal web de la gateway (Baileys Web). Il démarre automatiquement lorsqu’une session liée existe.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // coches bleues (false en mode auto-discussion)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp multi-compte">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Les commandes sortantes utilisent par défaut le compte `default` s’il est présent ; sinon le premier identifiant de compte configuré (trié).
- `channels.whatsapp.defaultAccount` facultatif remplace cette sélection de compte par défaut de repli lorsqu’il correspond à un identifiant de compte configuré.
- L’ancien répertoire d’authentification Baileys mono-compte est migré par `openclaw doctor` vers `whatsapp/default`.
- Remplacements par compte : `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Jeton de bot : `channels.telegram.botToken` ou `channels.telegram.tokenFile` (fichier normal uniquement ; liens symboliques rejetés), avec `TELEGRAM_BOT_TOKEN` comme repli pour le compte par défaut.
- `channels.telegram.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Dans les configurations multi-comptes (2+ identifiants de compte), définissez une valeur par défaut explicite (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) pour éviter le routage de repli ; `openclaw doctor` avertit lorsque cette valeur est absente ou invalide.
- `configWrites: false` bloque les écritures de configuration initiées par Telegram (migrations d’ID de supergroupe, `/config set|unset`).
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des bindings ACP persistants pour les sujets de forum (utilisez `chatId:topic:topicId` canonique dans `match.peer.id`). La sémantique des champs est partagée dans [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Les aperçus de flux Telegram utilisent `sendMessage` + `editMessageText` (fonctionne dans les discussions directes et de groupe).
- Politique de nouvelle tentative : voir [Retry policy](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Jeton : `channels.discord.token`, avec `DISCORD_BOT_TOKEN` comme repli pour le compte par défaut.
- Les appels sortants directs qui fournissent un `token` Discord explicite utilisent ce jeton pour l’appel ; les paramètres de nouvelle tentative/politique du compte proviennent toujours du compte sélectionné dans le snapshot d’exécution actif.
- `channels.discord.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Utilisez `user:<id>` (DM) ou `channel:<id>` (canal de serveur) comme cibles de livraison ; les ID numériques nus sont rejetés.
- Les slugs de serveur sont en minuscules avec les espaces remplacés par `-` ; les clés de canal utilisent le nom transformé en slug (sans `#`). Préférez les ID de serveur.
- Les messages rédigés par des bots sont ignorés par défaut. `allowBots: true` les active ; utilisez `allowBots: "mentions"` pour n’accepter que les messages de bots qui mentionnent le bot (les propres messages restent filtrés).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (et les remplacements de canal) supprime les messages qui mentionnent un autre utilisateur ou rôle mais pas le bot (à l’exclusion de @everyone/@here).
- `maxLinesPerMessage` (17 par défaut) découpe les messages hauts même s’ils restent sous 2000 caractères.
- `channels.discord.threadBindings` contrôle le routage lié aux fils Discord :
  - `enabled` : remplacement Discord pour les fonctionnalités de session liées aux fils (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, et livraison/routage liés)
  - `idleHours` : remplacement Discord pour l’auto-unfocus après inactivité, en heures (`0` désactive)
  - `maxAgeHours` : remplacement Discord pour l’âge maximal strict, en heures (`0` désactive)
  - `spawnSubagentSessions` : activation explicite de la création/liaison automatique de fil via `sessions_spawn({ thread: true })`
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des bindings ACP persistants pour les canaux et fils (utilisez l’ID du canal/fil dans `match.peer.id`). La sémantique des champs est partagée dans [ACP Agents](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` définit la couleur d’accent pour les conteneurs Discord components v2.
- `channels.discord.voice` active les conversations dans les canaux vocaux Discord ainsi que les remplacements facultatifs d’auto-join + TTS.
- `channels.discord.voice.daveEncryption` et `channels.discord.voice.decryptionFailureTolerance` sont transmis aux options DAVE de `@discordjs/voice` (`true` et `24` par défaut).
- OpenClaw tente également une récupération de réception vocale en quittant/rejoignant une session vocale après des échecs de déchiffrement répétés.
- `channels.discord.streaming` est la clé canonique du mode de flux. Les anciennes valeurs booléennes `streamMode` et `streaming` sont migrées automatiquement.
- `channels.discord.autoPresence` mappe la disponibilité à l’exécution sur la présence du bot (healthy => online, degraded => idle, exhausted => dnd) et permet des remplacements facultatifs du texte de statut.
- `channels.discord.dangerouslyAllowNameMatching` réactive la correspondance sur nom/tag modifiable (mode de compatibilité de secours).
- `channels.discord.execApprovals` : livraison des approbations exec native à Discord et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode auto, les approbations exec s’activent lorsque les approbateurs peuvent être résolus à partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : ID d’utilisateurs Discord autorisés à approuver les demandes exec. Utilise `commands.ownerAllowFrom` comme repli lorsqu’il est omis.
  - `agentFilter` : liste d’autorisation facultative des ID d’agent. Omettez pour transférer les approbations de tous les agents.
  - `sessionFilter` : motifs facultatifs de clé de session (sous-chaîne ou regex).
  - `target` : où envoyer les invites d’approbation. `"dm"` (par défaut) envoie dans les DM des approbateurs, `"channel"` envoie dans le canal d’origine, `"both"` envoie aux deux. Lorsque la cible inclut `"channel"`, les boutons ne sont utilisables que par les approbateurs résolus.
  - `cleanupAfterResolve` : lorsque `true`, supprime les DM d’approbation après approbation, refus ou expiration.

**Modes de notification de réaction :** `off` (aucune), `own` (messages du bot, par défaut), `all` (tous les messages), `allowlist` (depuis `guilds.<id>.users` sur tous les messages).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON du compte de service : inline (`serviceAccount`) ou basé sur fichier (`serviceAccountFile`).
- SecretRef pour compte de service également pris en charge (`serviceAccountRef`).
- Variables d’environnement de repli : `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Utilisez `spaces/<spaceId>` ou `users/<userId>` comme cibles de livraison.
- `channels.googlechat.dangerouslyAllowNameMatching` réactive la correspondance sur adresse e-mail mutable (mode de compatibilité de secours).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Mode socket** nécessite à la fois `botToken` et `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` comme repli env pour le compte par défaut).
- **Mode HTTP** nécessite `botToken` plus `signingSecret` (à la racine ou par compte).
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en clair
  ou des objets SecretRef.
- Les snapshots de compte Slack exposent des champs source/statut par identifiant comme
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` et, en mode HTTP,
  `signingSecretStatus`. `configured_unavailable` signifie que le compte est
  configuré via SecretRef mais que le chemin de commande/exécution actuel n’a pas pu
  résoudre la valeur du secret.
- `configWrites: false` bloque les écritures de configuration initiées par Slack.
- `channels.slack.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- `channels.slack.streaming` est la clé canonique du mode de flux. Les anciennes valeurs booléennes `streamMode` et `streaming` sont migrées automatiquement.
- Utilisez `user:<id>` (DM) ou `channel:<id>` pour les cibles de livraison.

**Modes de notification de réaction :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

**Isolation de session par fil :** `thread.historyScope` est par fil (par défaut) ou partagé à l’échelle du canal. `thread.inheritParent` copie la transcription du canal parent dans les nouveaux fils.

- `typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’une réponse est en cours d’exécution, puis la supprime à la fin. Utilisez un shortcode d’emoji Slack comme `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals` : livraison des approbations exec native à Slack et autorisation des approbateurs. Même schéma que Discord : `enabled` (`true`/`false`/`"auto"`), `approvers` (ID d’utilisateurs Slack), `agentFilter`, `sessionFilter` et `target` (`"dm"`, `"channel"` ou `"both"`).

| Groupe d’actions | Par défaut | Remarques               |
| ---------------- | ---------- | ----------------------- |
| reactions        | activé     | Réagir + lister les réactions |
| messages         | activé     | Lire/envoyer/modifier/supprimer |
| pins             | activé     | Épingler/désépingler/lister |
| memberInfo       | activé     | Informations sur les membres |
| emojiList        | activé     | Liste des emoji personnalisés |

### Mattermost

Mattermost est fourni comme plugin : `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explicite facultative pour les déploiements reverse proxy/publics
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modes de chat : `oncall` (répond sur @-mention, par défaut), `onmessage` (chaque message), `onchar` (messages commençant par un préfixe déclencheur).

Lorsque les commandes natives Mattermost sont activées :

- `commands.callbackPath` doit être un chemin (par exemple `/api/channels/mattermost/command`), et non une URL complète.
- `commands.callbackUrl` doit résoudre vers le point de terminaison gateway OpenClaw et être joignable depuis le serveur Mattermost.
- Les callbacks slash natifs sont authentifiés avec les jetons par commande renvoyés
  par Mattermost lors de l’enregistrement de la commande slash. Si l’enregistrement échoue ou si
  aucune commande n’est activée, OpenClaw rejette les callbacks avec
  `Unauthorized: invalid command token.`
- Pour les hôtes de callback privés/tailnet/internes, Mattermost peut nécessiter que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclue l’hôte/le domaine de callback.
  Utilisez des valeurs hôte/domaine, et non des URL complètes.
- `channels.mattermost.configWrites` : autoriser ou refuser les écritures de configuration initiées par Mattermost.
- `channels.mattermost.requireMention` : exiger une `@mention` avant de répondre dans les canaux.
- `channels.mattermost.groups.<channelId>.requireMention` : remplacement de filtrage par mention par canal (`"*"` pour la valeur par défaut).
- `channels.mattermost.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // liaison de compte facultative
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modes de notification de réaction :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

- `channels.signal.account` : épingler le démarrage du canal à une identité de compte Signal spécifique.
- `channels.signal.configWrites` : autoriser ou refuser les écritures de configuration initiées par Signal.
- `channels.signal.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

### BlueBubbles

BlueBubbles est le chemin iMessage recommandé (fourni par plugin, configuré sous `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, contrôles de groupe et actions avancées :
      // voir /channels/bluebubbles
    },
  },
}
```

- Chemins de clé principaux couverts ici : `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` peuvent lier des conversations BlueBubbles à des sessions ACP persistantes. Utilisez un handle BlueBubbles ou une chaîne cible (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique partagée des champs : [ACP Agents](/tools/acp-agents#channel-specific-settings).
- La configuration complète du canal BlueBubbles est documentée dans [BlueBubbles](/channels/bluebubbles).

### iMessage

OpenClaw lance `imsg rpc` (JSON-RPC sur stdio). Aucun démon ni port requis.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

- Nécessite un accès complet au disque pour la base Messages DB.
- Préférez les cibles `chat_id:<id>`. Utilisez `imsg chats --limit 20` pour lister les discussions.
- `cliPath` peut pointer vers un wrapper SSH ; définissez `remoteHost` (`host` ou `user@host`) pour la récupération des pièces jointes via SCP.
- `attachmentRoots` et `remoteAttachmentRoots` limitent les chemins des pièces jointes entrantes (par défaut : `/Users/*/Library/Messages/Attachments`).
- SCP utilise une vérification stricte de la clé d’hôte, assurez-vous donc que la clé d’hôte du relais existe déjà dans `~/.ssh/known_hosts`.
- `channels.imessage.configWrites` : autoriser ou refuser les écritures de configuration initiées par iMessage.
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` peuvent lier des conversations iMessage à des sessions ACP persistantes. Utilisez un handle normalisé ou une cible de discussion explicite (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique partagée des champs : [ACP Agents](/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemple de wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix est fourni par extension et configuré sous `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- L’authentification par jeton utilise `accessToken` ; l’authentification par mot de passe utilise `userId` + `password`.
- `channels.matrix.proxy` route le trafic HTTP Matrix via un proxy HTTP(S) explicite. Les comptes nommés peuvent le remplacer avec `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` autorise les homeservers privés/internes. `proxy` et `allowPrivateNetwork` sont des contrôles indépendants.
- `channels.matrix.defaultAccount` sélectionne le compte préféré dans les configurations multi-comptes.
- `channels.matrix.execApprovals` : livraison des approbations exec native à Matrix et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode auto, les approbations exec s’activent lorsque les approbateurs peuvent être résolus à partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : ID utilisateur Matrix (par ex. `@owner:example.org`) autorisés à approuver les demandes exec.
  - `agentFilter` : liste d’autorisation facultative des ID d’agent. Omettez pour transférer les approbations de tous les agents.
  - `sessionFilter` : motifs facultatifs de clé de session (sous-chaîne ou regex).
  - `target` : où envoyer les invites d’approbation. `"dm"` (par défaut), `"channel"` (salle d’origine), ou `"both"`.
  - Remplacements par compte : `channels.matrix.accounts.<id>.execApprovals`.
- Les sondes de statut Matrix et les recherches d’annuaire live utilisent la même politique proxy que le trafic à l’exécution.
- La configuration complète de Matrix, les règles de ciblage et les exemples de configuration sont documentés dans [Matrix](/channels/matrix).

### Microsoft Teams

Microsoft Teams est fourni par extension et configuré sous `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, politiques d’équipe/canal :
      // voir /channels/msteams
    },
  },
}
```

- Chemins de clé principaux couverts ici : `channels.msteams`, `channels.msteams.configWrites`.
- La configuration complète de Teams (identifiants, webhook, politique DM/groupe, remplacements par équipe/par canal) est documentée dans [Microsoft Teams](/channels/msteams).

### IRC

IRC est fourni par extension et configuré sous `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Chemins de clé principaux couverts ici : `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` facultatif remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- La configuration complète du canal IRC (host/port/TLS/canaux/listes d’autorisation/filtrage par mention) est documentée dans [IRC](/channels/irc).

### Multi-compte (tous les canaux)

Exécutez plusieurs comptes par canal (chacun avec son propre `accountId`) :

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` est utilisé lorsque `accountId` est omis (CLI + routage).
- Les jetons env ne s’appliquent qu’au compte **default**.
- Les paramètres de canal de base s’appliquent à tous les comptes sauf remplacement par compte.
- Utilisez `bindings[].match.accountId` pour router chaque compte vers un agent différent.
- Si vous ajoutez un compte non par défaut via `openclaw channels add` (ou via l’onboarding du canal) alors que vous utilisez encore une configuration de canal mono-compte de niveau supérieur, OpenClaw promeut d’abord les valeurs mono-compte de niveau supérieur liées au compte dans la map des comptes du canal afin que le compte d’origine continue de fonctionner. La plupart des canaux les déplacent dans `channels.<channel>.accounts.default` ; Matrix peut conserver à la place une cible nommée/par défaut existante correspondante.
- Les bindings existants de type canal uniquement (sans `accountId`) continuent de correspondre au compte par défaut ; les bindings étendus au compte restent facultatifs.
- `openclaw doctor --fix` répare également les formes mixtes en déplaçant les valeurs mono-compte de niveau supérieur liées au compte dans le compte promu choisi pour ce canal. La plupart des canaux utilisent `accounts.default` ; Matrix peut conserver à la place une cible nommée/par défaut existante correspondante.

### Autres canaux d’extension

De nombreux canaux d’extension sont configurés comme `channels.<id>` et documentés dans leurs pages de canal dédiées (par exemple Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat et Twitch).
Voir l’index complet des canaux : [Channels](/channels).

### Filtrage par mention dans les discussions de groupe

Les messages de groupe nécessitent par défaut **une mention requise** (mention dans les métadonnées ou motifs regex sûrs). S’applique aux discussions de groupe WhatsApp, Telegram, Discord, Google Chat et iMessage.

**Types de mention :**

- **Mentions de métadonnées** : @-mentions natives de la plateforme. Ignorées en mode auto-discussion WhatsApp.
- **Motifs textuels** : motifs regex sûrs dans `agents.list[].groupChat.mentionPatterns`. Les motifs invalides et les répétitions imbriquées dangereuses sont ignorés.
- Le filtrage par mention n’est appliqué que lorsque la détection est possible (mentions natives ou au moins un motif).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` définit la valeur globale par défaut. Les canaux peuvent remplacer avec `channels.<channel>.historyLimit` (ou par compte). Définissez `0` pour désactiver.

#### Limites d’historique DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Résolution : remplacement par DM → valeur par défaut du provider → aucune limite (tout est conservé).

Pris en charge : `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Mode auto-discussion

Incluez votre propre numéro dans `allowFrom` pour activer le mode auto-discussion (ignore les @-mentions natives, répond uniquement aux motifs textuels) :

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands (gestion des commandes de chat)

```json5
{
  commands: {
    native: "auto", // enregistrer les commandes natives lorsqu’elles sont prises en charge
    text: true, // analyser les /commands dans les messages de chat
    bash: false, // autoriser ! (alias : /bash)
    bashForegroundMs: 2000,
    config: false, // autoriser /config
    debug: false, // autoriser /debug
    restart: false, // autoriser /restart + outil de redémarrage gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Détails des commandes">

- Les commandes texte doivent être des messages **autonomes** avec un `/` initial.
- `native: "auto"` active les commandes natives pour Discord/Telegram, laisse Slack désactivé.
- Remplacement par canal : `channels.discord.commands.native` (booléen ou `"auto"`). `false` efface les commandes précédemment enregistrées.
- `channels.telegram.customCommands` ajoute des entrées supplémentaires au menu du bot Telegram.
- `bash: true` active `! <cmd>` pour le shell hôte. Nécessite `tools.elevated.enabled` et un expéditeur présent dans `tools.elevated.allowFrom.<channel>`.
- `config: true` active `/config` (lit/écrit `openclaw.json`). Pour les clients gateway `chat.send`, les écritures persistantes `/config set|unset` nécessitent aussi `operator.admin` ; la lecture seule `/config show` reste disponible pour les clients opérateur normaux avec étendue d’écriture.
- `channels.<provider>.configWrites` contrôle les mutations de configuration par canal (par défaut : true).
- Pour les canaux multi-comptes, `channels.<provider>.accounts.<id>.configWrites` contrôle également les écritures ciblant ce compte (par exemple `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` est par provider. Lorsqu’il est défini, c’est l’**unique** source d’autorisation (les listes d’autorisation/pairing de canal et `useAccessGroups` sont ignorés).
- `useAccessGroups: false` permet aux commandes de contourner les politiques de groupe d’accès lorsque `allowFrom` n’est pas défini.

</Accordion>

---

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Par défaut : `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Racine de dépôt facultative affichée dans la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Liste d’autorisation par défaut facultative de Skills pour les agents qui ne définissent pas
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skills
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour des Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skills.
- Une liste non vide `agents.list[].skills` est l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

### `agents.defaults.skipBootstrap`

Désactive la création automatique des fichiers bootstrap d’espace de travail (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier bootstrap d’espace de travail avant troncature. Par défaut : `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Nombre total maximal de caractères injectés dans l’ensemble des fichiers bootstrap d’espace de travail. Par défaut : `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle le texte d’avertissement visible par l’agent lorsque le contexte bootstrap est tronqué.
Par défaut : `"once"`.

- `"off"` : ne jamais injecter de texte d’avertissement dans le prompt système.
- `"once"` : injecter l’avertissement une fois par signature de troncature unique (recommandé).
- `"always"` : injecter l’avertissement à chaque exécution lorsqu’une troncature existe.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Taille maximale en pixels du côté le plus long des images dans les blocs d’images de transcription/d’outil avant les appels provider.
Par défaut : `1200`.

Des valeurs plus faibles réduisent généralement l’utilisation de vision tokens et la taille des charges utiles des requêtes pour les exécutions riches en captures d’écran.
Des valeurs plus élevées conservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire pour le contexte du prompt système (pas pour les horodatages de message). Utilise le fuseau horaire de l’hôte comme repli.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format horaire dans le prompt système. Par défaut : `auto` (préférence du système d’exploitation).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // paramètres provider globaux par défaut
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - La forme chaîne définit uniquement le modèle principal.
  - La forme objet définit le modèle principal plus des modèles de bascule ordonnés.
- `imageModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin de l’outil `image` comme configuration de modèle de vision.
  - Utilisé également pour le routage de repli lorsque le modèle sélectionné/par défaut n’accepte pas d’entrée image.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images Gemini native, `fal/fal-ai/flux/dev` pour fal, ou `openai/gpt-image-1` pour OpenAI Images.
  - Si vous sélectionnez directement un provider/modèle, configurez aussi l’authentification/la clé API du provider correspondant (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` pour `openai/*`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut tout de même inférer une valeur par défaut provider appuyée par l’authentification. Il essaie d’abord le provider par défaut courant, puis les autres providers de génération d’images enregistrés restants dans l’ordre des ID de provider.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, ou `qwen/wan2.7-r2v`.
  - Définissez-le explicitement avant d’utiliser la génération vidéo partagée. Contrairement à `imageGenerationModel`, l’exécution de génération vidéo n’infère pas encore de valeur par défaut provider.
  - Si vous sélectionnez directement un provider/modèle, configurez aussi l’authentification/la clé API du provider correspondant.
  - Le provider intégré de génération vidéo Qwen prend actuellement en charge au maximum 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, et les options provider `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage de modèle.
  - Si omis, l’outil PDF se replie sur `imageModel`, puis sur le modèle résolu de la session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis à l’appel.
- `pdfMaxPages` : nombre maximal de pages considéré par défaut par le mode de repli d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau verbeux par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `elevatedDefault` : niveau par défaut de sortie élevée pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par ex. `openai/gpt-5.4`). Si vous omettez le provider, OpenClaw essaie d’abord un alias, puis une correspondance unique avec un provider configuré pour cet identifiant de modèle exact, et seulement ensuite revient au provider par défaut configuré (comportement de compatibilité déprécié, donc préférez le format explicite `provider/model`). Si ce provider n’expose plus le modèle par défaut configuré, OpenClaw se replie sur le premier provider/modèle configuré au lieu d’exposer une valeur par défaut obsolète liée à un provider supprimé.
- `models` : catalogue de modèles configuré et liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au provider, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params` : paramètres provider globaux par défaut appliqués à tous les modèles. Définis dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (ID d’agent correspondant) remplace par clé. Voir [Prompt Caching](/reference/prompt-caching) pour les détails.
- Les auteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image`, et les commandes d’ajout/suppression de fallback) enregistrent la forme objet canonique et conservent les listes de fallback existantes lorsque c’est possible.
- `maxConcurrent` : nombre maximal d’exécutions d’agent en parallèle entre les sessions (chaque session reste sérialisée). Par défaut : 4.

**Raccourcis d’alias intégrés** (ne s’appliquent que lorsque le modèle est dans `agents.defaults.models`) :

| Alias               | Modèle                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode thinking sauf si vous définissez `--thinking off` ou définissez vous-même `agents.defaults.models["zai/<model>"].params.thinking`.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outil. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` à `false` pour le désactiver.
Les modèles Anthropic Claude 4.6 utilisent par défaut le thinking `adaptive` lorsqu’aucun niveau explicite de thinking n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de repli texte uniquement (sans appels d’outil). Utile comme secours lorsque les providers API échouent.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Les backends CLI sont orientés texte ; les outils sont toujours désactivés.
- Sessions prises en charge lorsque `sessionArg` est défini.
- Transmission d’image prise en charge lorsque `imageArg` accepte des chemins de fichier.

### `agents.defaults.heartbeat`

Exécutions heartbeat périodiques.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m désactive
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // défaut : false ; true conserve uniquement HEARTBEAT.md parmi les fichiers bootstrap d’espace de travail
        isolatedSession: false, // défaut : false ; true exécute chaque heartbeat dans une session fraîche (sans historique de conversation)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (par défaut) | block
        target: "none", // défaut : none | options : last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every` : chaîne de durée (ms/s/m/h). Par défaut : `30m` (auth par clé API) ou `1h` (auth OAuth). Définissez `0m` pour désactiver.
- `suppressToolErrorWarnings` : lorsque true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions heartbeat.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque true, les exécutions heartbeat utilisent un contexte bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers bootstrap de l’espace de travail.
- `isolatedSession` : lorsque true, chaque heartbeat s’exécute dans une session fraîche sans historique de conversation préalable. Même modèle d’isolation que cron `sessionTarget: "isolated"`. Réduit le coût en tokens par heartbeat d’environ 100K à ~2-5K tokens.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des heartbeats.
- Les heartbeats exécutent des tours d’agent complets — des intervalles plus courts consomment davantage de tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // utilisé lorsque identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] désactive la réinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // remplacement facultatif de modèle uniquement pour la compaction
        notifyUser: true, // envoyer une brève notification lorsque la compaction commence (défaut : false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode` : `default` ou `safeguard` (résumé par blocs pour les historiques longs). Voir [Compaction](/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une seule opération de compaction avant qu’OpenClaw ne l’abandonne. Par défaut : `900`.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` ajoute des consignes intégrées de conservation des identifiants opaques pendant le résumé de compaction.
- `identifierInstructions` : texte facultatif personnalisé de conservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d’AGENTS.md à réinjecter après compaction. Valeur par défaut `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsqu’il n’est pas défini ou est explicitement égal à cette paire par défaut, les anciens titres `Every Session`/`Safety` sont également acceptés comme repli historique.
- `model` : remplacement facultatif `provider/model-id` uniquement pour le résumé de compaction. Utilisez-le lorsque la session principale doit conserver un modèle mais que les résumés de compaction doivent s’exécuter sur un autre ; lorsqu’il n’est pas défini, la compaction utilise le modèle principal de la session.
- `notifyUser` : lorsque `true`, envoie une brève notification à l’utilisateur lorsque la compaction commence (par exemple, "Compacting context..."). Désactivé par défaut pour garder la compaction silencieuse.
- `memoryFlush` : tour agentique silencieux avant auto-compaction pour stocker des souvenirs durables. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.contextPruning`

Élague les **anciens résultats d’outil** du contexte en mémoire avant de les envoyer au LLM. Ne modifie **pas** l’historique de session sur disque.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durée (ms/s/m/h), unité par défaut : minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportement du mode cache-ttl">

- `mode: "cache-ttl"` active les passes d’élagage.
- `ttl` contrôle à quelle fréquence l’élagage peut de nouveau s’exécuter (après le dernier contact avec le cache).
- L’élagage tronque d’abord en douceur les résultats d’outil surdimensionnés, puis efface brutalement les anciens résultats d’outil si nécessaire.

**Soft-trim** conserve le début + la fin et insère `...` au milieu.

**Hard-clear** remplace tout le résultat de l’outil par le placeholder.

Remarques :

- Les blocs d’image ne sont jamais tronqués/effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des comptes exacts de tokens.
- S’il y a moins de `keepLastAssistants` messages assistant, l’élagage est ignoré.

</Accordion>

Voir [Session Pruning](/concepts/session-pruning) pour les détails de comportement.

### Réponses par blocs streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (utiliser minMs/maxMs)
    },
  },
}
```

- Les canaux non Telegram nécessitent `*.blockStreaming: true` explicite pour activer les réponses en bloc.
- Remplacements par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500ms. Remplacement par agent : `agents.list[].humanDelay`.

Voir [Streaming](/concepts/streaming) pour le comportement et les détails de découpage.

### Indicateurs de saisie

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valeurs par défaut : `instant` pour les chats directs/mentions, `message` pour les discussions de groupe sans mention.
- Remplacements par session : `session.typingMode`, `session.typingIntervalSeconds`.

Voir [Typing Indicators](/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facultatif pour l’agent intégré. Voir [Sandboxing](/gateway/sandboxing) pour le guide complet.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / contenus inline également pris en charge :
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Détails sandbox">

**Backend :**

- `docker` : exécution Docker locale (par défaut)
- `ssh` : exécution distante générique via SSH
- `openshell` : exécution OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres spécifiques à l’exécution sont déplacés dans
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par étendue
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus inline ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : paramètres de politique de clé d’hôte OpenSSH

**Priorité d’authentification SSH :**

- `identityData` a priorité sur `identityFile`
- `certificateData` a priorité sur `certificateFile`
- `knownHostsData` a priorité sur `knownHostsFile`
- Les valeurs `*Data` reposant sur SecretRef sont résolues à partir du snapshot actif du runtime secrets avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise une fois l’espace de travail distant après la création ou la recréation
- conserve ensuite l’espace de travail SSH distant comme canonique
- route `exec`, les outils de fichier et les chemins média via SSH
- ne synchronise pas automatiquement les modifications distantes vers l’hôte
- ne prend pas en charge les conteneurs browser sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par étendue sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox à `/workspace`, espace de travail agent monté en lecture seule à `/agent`
- `rw` : espace de travail agent monté en lecture/écriture à `/workspace`

**Étendue :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (pas d’isolation inter-session)

**Configuration du plugin OpenShell :**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // facultatif
          gatewayEndpoint: "https://lab.example", // facultatif
          policy: "strict", // ID de politique OpenShell facultatif
          providers: ["openai"], // facultatif
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell :**

- `mirror` : initialiser le distant à partir du local avant exec, synchroniser en retour après exec ; l’espace de travail local reste canonique
- `remote` : initialiser le distant une fois lors de la création de la sandbox, puis conserver l’espace de travail distant comme canonique

En mode `remote`, les modifications locales sur l’hôte effectuées en dehors d’OpenClaw ne sont pas automatiquement synchronisées dans la sandbox après l’étape d’initialisation.
Le transport est SSH vers la sandbox OpenShell, mais le plugin possède le cycle de vie de la sandbox et la synchronisation mirror facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine accessible en écriture, et l’utilisateur root.

**Les conteneurs utilisent par défaut `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (solution de secours).

**Les pièces jointes entrantes** sont préparées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Browser sandboxé** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. L’URL noVNC est injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise par défaut l’authentification VNC et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) bloque les sessions sandboxées de cibler le navigateur de l’hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement si vous souhaitez explicitement une connectivité globale du bridge.
- `cdpSourceRange` peut restreindre l’entrée CDP au bord du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur browser sandbox. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur browser.
- Les valeurs de lancement par défaut sont définies dans `scripts/sandbox-browser-entrypoint.sh` et optimisées pour les hôtes de conteneur :
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (activé par défaut)
  - `--disable-3d-apis`, `--disable-software-rasterizer` et `--disable-gpu` sont
    activés par défaut et peuvent être désactivés avec
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l’utilisation de WebGL/3D l’exige.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` réactive les extensions si votre flux
    de travail en dépend.
  - `--renderer-process-limit=2` peut être modifié avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - plus `--no-sandbox` et `--disable-setuid-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut sont la base de l’image conteneur ; utilisez une image browser personnalisée avec un entrypoint personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le sandboxing browser et `sandbox.docker.binds` sont actuellement spécifiques à Docker.

Construire les images :

```bash
scripts/sandbox-setup.sh           # image principale sandbox
scripts/sandbox-browser-setup.sh   # image browser facultative
```

### `agents.list` (remplacements par agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // remplacement du niveau de thinking par agent
        reasoningDefault: "on", // remplacement de la visibilité du raisonnement par agent
        fastModeDefault: false, // remplacement du mode rapide par agent
        params: { cacheRetention: "none" }, // remplace par clé les defaults.models params correspondants
        skills: ["docs-search"], // remplace agents.defaults.skills lorsqu’il est défini
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id` : identifiant d’agent stable (obligatoire).
- `default` : lorsque plusieurs sont définis, le premier l’emporte (avertissement journalisé). Si aucun n’est défini, la première entrée de la liste est l’agent par défaut.
- `model` : la forme chaîne remplace uniquement `primary` ; la forme objet `{ primary, fallbacks }` remplace les deux (`[]` désactive les fallbacks globaux). Les jobs cron qui ne remplacent que `primary` héritent toujours des fallbacks par défaut sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés au-dessus de l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour des remplacements spécifiques à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `skills` : liste d’autorisation de Skills facultative par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsqu’il est défini ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucun Skills.
- `thinkingDefault` : niveau de thinking par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou session n’est défini.
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). S’applique lorsqu’aucun remplacement de raisonnement n’est défini par message ou session.
- `fastModeDefault` : valeur par défaut facultative du mode rapide par agent (`true | false`). S’applique lorsqu’aucun remplacement de mode rapide n’est défini par message ou session.
- `runtime` : descripteur de runtime facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions harness ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive des valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des ID d’agent pour `sessions_spawn` (`["*"]` = n’importe lequel ; par défaut : même agent uniquement).
- Garde d’héritage sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `subagents.requireAgentId` : lorsque true, bloque les appels `sessions_spawn` qui omettent `agentId` (impose une sélection de profil explicite ; par défaut : false).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans une même Gateway. Voir [Multi-Agent](/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Champs de correspondance de binding

- `type` (facultatif) : `route` pour le routage normal (type manquant = route par défaut), `acp` pour les bindings de conversation ACP persistants.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; spécifiques au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans peer/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre de niveaux de binding de route ci-dessus.

### Profils d’accès par agent

<Accordion title="Accès complet (sans sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Outils + espace de travail en lecture seule">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Pas d’accès au système de fichiers (messagerie uniquement)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Voir [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) pour les détails de priorité.

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ignorer le fork du fil parent au-dessus de ce nombre de tokens (0 désactive)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durée ou false
      maxDiskBytes: "500mb", // budget strict facultatif
      highWaterBytes: "400mb", // cible de nettoyage facultative
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // défaut d’auto-unfocus après inactivité en heures (`0` désactive)
      maxAgeHours: 0, // défaut d’âge maximal strict en heures (`0` désactive)
    },
    mainKey: "main", // historique (le runtime utilise toujours "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Détails des champs de session">

- **`scope`** : stratégie de regroupement de session de base pour les contextes de discussion de groupe.
  - `per-sender` (par défaut) : chaque expéditeur obtient une session isolée dans un contexte de canal.
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est voulu).
- **`dmScope`** : comment les DM sont regroupés.
  - `main` : tous les DM partagent la session principale.
  - `per-peer` : isoler par ID d’expéditeur entre les canaux.
  - `per-channel-peer` : isoler par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isoler par compte + canal + expéditeur (recommandé pour le multi-compte).
- **`identityLinks`** : mappe des ID canoniques à des pairs préfixés par provider pour le partage de session inter-canal.
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à `atHour` heure locale ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, le premier arrivé à expiration l’emporte.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`parentForkMaxTokens`** : nombre maximal de `totalTokens` autorisé pour la session parente lors de la création d’une session de fil forkée (par défaut `100000`).
  - Si le `totalTokens` du parent dépasse cette valeur, OpenClaw démarre une session de fil fraîche au lieu d’hériter de l’historique de transcription du parent.
  - Définissez `0` pour désactiver cette protection et toujours autoriser le fork parent.
- **`mainKey`** : champ historique. Le runtime utilise désormais toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents pendant les échanges agent-à-agent (entier, plage : `0`–`5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec alias historique `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage + de rétention du magasin de sessions.
  - `mode` : `warn` n’émet que des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`).
  - `rotateBytes` : effectue une rotation de `sessions.json` lorsqu’il dépasse cette taille (par défaut `10mb`).
  - `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>`. Par défaut égale à `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, journalise des avertissements ; en mode `enforce`, supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs globales par défaut pour les fonctionnalités de session liées aux fils.
  - `enabled` : interrupteur maître par défaut (les providers peuvent remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : défaut d’auto-unfocus après inactivité en heures (`0` désactive ; les providers peuvent remplacer)
  - `maxAgeHours` : défaut d’âge maximal strict en heures (`0` désactive ; les providers peuvent remplacer)

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 désactive
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Préfixe de réponse

Remplacements par canal/compte : `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Résolution (le plus spécifique l’emporte) : compte → canal → global. `""` désactive et stoppe la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables de template :**

| Variable          | Description            | Exemple                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nom court du modèle    | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du provider        | `anthropic`                 |
| `{thinkingLevel}` | Niveau de thinking actuel | `high`, `low`, `off`     |
| `{identity.name}` | Nom de l’identité de l’agent | (identique à `"auto"`) |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Vaut par défaut l’`identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli d’identité.
- Étendue : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’ack après réponse sur Slack, Discord et Telegram.
- `messages.statusReactions.enabled` : active les réactions de statut du cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, l’absence de définition conserve l’activation des réactions de statut lorsque les réactions d’ack sont actives.
  Sur Telegram, définissez explicitement `true` pour activer les réactions de statut du cycle de vie.

### Debounce des messages entrants

Regroupe les messages texte rapides du même expéditeur dans un seul tour d’agent. Les médias/pièces jointes sont vidés immédiatement. Les commandes de contrôle contournent le debounce.

### TTS (synthèse vocale)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` contrôle l’auto-TTS. `/tts off|always|inbound|tagged` remplace la valeur par session.
- `summaryModel` remplace `agents.defaults.model.primary` pour le résumé automatique.
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut par défaut `false` (activation explicite).
- Les clés API utilisent `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY` comme repli.
- `openai.baseUrl` remplace le point de terminaison OpenAI TTS. Ordre de résolution : configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation modèle/voix.

---

## Talk

Valeurs par défaut du mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` doit correspondre à une clé de `talk.providers` lorsque plusieurs providers Talk sont configurés.
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ne servent que pour la compatibilité et sont migrées automatiquement vers `talk.providers.<provider>`.
- Les ID de voix utilisent `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` comme repli.
- `providers.*.apiKey` accepte des chaînes en clair ou des objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` ne s’applique que lorsqu’aucune clé API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `silenceTimeoutMs` contrôle combien de temps le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Si non défini, il conserve la fenêtre de pause par défaut de la plateforme (`700 ms sur macOS et Android, 900 ms sur iOS`).

---

## Outils

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant `tools.allow`/`tools.deny` :

L’onboarding local définit par défaut `tools.profile: "coding"` pour les nouvelles configurations locales lorsqu’il n’est pas défini (les profils explicites existants sont conservés).

| Profil      | Inclut                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` uniquement                                                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                  |
| `full`      | Aucune restriction (identique à non défini)                                                                 |

### Groupes d’outils

| Groupe             | Outils                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `tts`                                                                                         |
| `group:openclaw`   | Tous les outils intégrés (exclut les plugins provider)                                                                   |

### `tools.allow` / `tools.deny`

Politique globale d’autorisation/refus d’outils (deny l’emporte). Insensible à la casse, prend en charge les jokers `*`. S’applique même lorsque la sandbox Docker est désactivée.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restreint davantage les outils pour des providers ou modèles spécifiques. Ordre : profil de base → profil provider → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Contrôle l’accès exec élevé en dehors de la sandbox :

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Le remplacement par agent (`agents.list[].tools.elevated`) ne peut que restreindre davantage.
- `/elevated on|off|ask|full` stocke l’état par session ; les directives inline s’appliquent à un seul message.
- `exec` élevé contourne la sandbox et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Les vérifications de sécurité contre les boucles d’outils sont **désactivées par défaut**. Définissez `enabled: true` pour activer la détection.
Les paramètres peuvent être définis globalement dans `tools.loopDetection` et remplacés par agent via `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize` : historique maximal des appels d’outil conservé pour l’analyse des boucles.
- `warningThreshold` : seuil des motifs répétés sans progression pour les avertissements.
- `criticalThreshold` : seuil plus élevé de répétition pour bloquer les boucles critiques.
- `globalCircuitBreakerThreshold` : seuil d’arrêt dur pour toute exécution sans progression.
- `detectors.genericRepeat` : avertit en cas d’appels répétés au même outil/aux mêmes arguments.
- `detectors.knownPollNoProgress` : avertit/bloque les outils de sondage connus (`process.poll`, `command_status`, etc.).
- `detectors.pingPong` : avertit/bloque les motifs de paires alternées sans progression.
- Si `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, la validation échoue.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // ou env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // facultatif ; omettez pour auto-détection
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configure la compréhension des médias entrants (image/audio/vidéo) :

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Champs d’entrée de modèle média">

**Entrée provider** (`type: "provider"` ou omis) :

- `provider` : ID provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
- `model` : remplacement d’ID de modèle
- `profile` / `preferredProfile` : sélection de profil `auth-profiles.json`

**Entrée CLI** (`type: "cli"`) :

- `command` : exécutable à lancer
- `args` : arguments templatisés (prend en charge `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

**Champs communs :**

- `capabilities` : liste facultative (`image`, `audio`, `video`). Valeurs par défaut : `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language` : remplacements par entrée.
- Les échecs passent à l’entrée suivante.

L’authentification provider suit l’ordre standard : `auth-profiles.json` → variables d’environnement → `models.providers.*.apiKey`.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Contrôle quelles sessions peuvent être ciblées par les outils de session (`sessions_list`, `sessions_history`, `sessions_send`).

Par défaut : `tree` (session courante + sessions créées par elle, comme les subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Remarques :

- `self` : uniquement la clé de session courante.
- `tree` : session courante + sessions créées par la session courante (subagents).
- `agent` : toute session appartenant à l’ID d’agent courant (peut inclure d’autres utilisateurs si vous exécutez des sessions par expéditeur sous le même ID d’agent).
- `all` : toute session. Le ciblage inter-agent nécessite toujours `tools.agentToAgent`.
- Limitation sandbox : lorsque la session courante est sandboxée et que `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilité est forcée à `tree` même si `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Contrôle la prise en charge des pièces jointes inline pour `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // activation explicite : définir true pour autoriser les pièces jointes inline
        maxTotalBytes: 5242880, // 5 MB au total pour tous les fichiers
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB par fichier
        retainOnSessionKeep: false, // conserver les pièces jointes lorsque cleanup="keep"
      },
    },
  },
}
```

Remarques :

- Les pièces jointes sont prises en charge uniquement pour `runtime: "subagent"`. Le runtime ACP les rejette.
- Les fichiers sont matérialisés dans l’espace de travail enfant sous `.openclaw/attachments/<uuid>/` avec un `.manifest.json`.
- Le contenu des pièces jointes est automatiquement masqué dans la persistance des transcriptions.
- Les entrées base64 sont validées avec des contrôles stricts d’alphabet/remplissage et une protection de taille avant décodage.
- Les permissions de fichier sont `0700` pour les répertoires et `0600` pour les fichiers.
- Le nettoyage suit la politique `cleanup` : `delete` supprime toujours les pièces jointes ; `keep` ne les conserve que lorsque `retainOnSessionKeep: true`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model` : modèle par défaut des sous-agents lancés. Si omis, les sous-agents héritent du modèle de l’appelant.
- `allowAgents` : liste d’autorisation par défaut des ID d’agent cibles pour `sessions_spawn` lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents` (`["*"]` = n’importe lequel ; par défaut : même agent uniquement).
- `runTimeoutSeconds` : délai d’attente par défaut (secondes) pour `sessions_spawn` lorsque l’appel de l’outil omet `runTimeoutSeconds`. `0` signifie aucun délai.
- Politique d’outil par sous-agent : `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Providers personnalisés et URL de base

OpenClaw utilise le catalogue de modèles intégré. Ajoutez des providers personnalisés via `models.providers` dans la configuration ou `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (par défaut) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Utilisez `authHeader: true` + `headers` pour des besoins d’authentification personnalisés.
- Remplacez la racine de configuration agent avec `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, alias historique de variable d’environnement).
- Priorité de fusion pour les ID provider correspondants :
  - Les valeurs non vides de `baseUrl` dans `models.json` agent l’emportent.
  - Les valeurs non vides de `apiKey` agent l’emportent uniquement lorsque ce provider n’est pas géré par SecretRef dans le contexte actuel de configuration/profil auth.
  - Les valeurs `apiKey` des providers gérés par SecretRef sont rafraîchies à partir des marqueurs source (`ENV_VAR_NAME` pour les refs env, `secretref-managed` pour les refs file/exec) au lieu de persister les secrets résolus.
  - Les valeurs d’en-tête provider gérées par SecretRef sont rafraîchies à partir des marqueurs source (`secretref-env:ENV_VAR_NAME` pour les refs env, `secretref-managed` pour les refs file/exec).
  - Les `apiKey`/`baseUrl` agent vides ou absents utilisent `models.providers` de la configuration comme repli.
  - Les `contextWindow`/`maxTokens` du modèle correspondant utilisent la valeur la plus élevée entre la configuration explicite et les valeurs implicites du catalogue.
  - Les `contextTokens` du modèle correspondant conservent un plafond d’exécution explicite lorsqu’il est présent ; utilisez-le pour limiter le contexte effectif sans modifier les métadonnées natives du modèle.
  - Utilisez `models.mode: "replace"` lorsque vous souhaitez que la configuration réécrive totalement `models.json`.
  - La persistance des marqueurs est pilotée par la source : les marqueurs sont écrits à partir du snapshot actif de la configuration source (avant résolution), et non à partir des valeurs secrètes résolues à l’exécution.

### Détails des champs provider

- `models.mode` : comportement du catalogue provider (`merge` ou `replace`).
- `models.providers` : map de providers personnalisés indexée par ID provider.
- `models.providers.*.api` : adaptateur de requête (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.).
- `models.providers.*.apiKey` : identifiant provider (préférez SecretRef/substitution env).
- `models.providers.*.auth` : stratégie auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat` : pour Ollama + `openai-completions`, injecte `options.num_ctx` dans les requêtes (par défaut : `true`).
- `models.providers.*.authHeader` : force le transport de l’identifiant dans l’en-tête `Authorization` lorsque nécessaire.
- `models.providers.*.baseUrl` : URL de base de l’API amont.
- `models.providers.*.headers` : en-têtes statiques supplémentaires pour le routage proxy/tenant.
- `models.providers.*.request` : remplacements de transport pour les requêtes HTTP model-provider.
  - `request.headers` : en-têtes supplémentaires (fusionnés avec les valeurs par défaut du provider). Les valeurs acceptent SecretRef.
  - `request.auth` : remplacement de stratégie auth. Modes : `"provider-default"` (utiliser l’authentification intégrée du provider), `"authorization-bearer"` (avec `token`), `"header"` (avec `headerName`, `value`, `prefix` facultatif).
  - `request.proxy` : remplacement de proxy HTTP. Modes : `"env-proxy"` (utilise les variables env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (avec `url`). Les deux modes acceptent un sous-objet `tls` facultatif.
  - `request.tls` : remplacement TLS pour les connexions directes. Champs : `ca`, `cert`, `key`, `passphrase` (tous acceptent SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models` : entrées explicites du catalogue de modèles provider.
- `models.providers.*.models.*.contextWindow` : métadonnées natives de fenêtre de contexte du modèle.
- `models.providers.*.models.*.contextTokens` : plafond de contexte d’exécution facultatif. Utilisez-le lorsque vous souhaitez un budget de contexte effectif plus petit que le `contextWindow` natif du modèle.
- `models.providers.*.models.*.compat.supportsDeveloperRole` : indice facultatif de compatibilité. Pour `api: "openai-completions"` avec un `baseUrl` non natif non vide (hôte différent de `api.openai.com`), OpenClaw force cette valeur à `false` à l’exécution. Un `baseUrl` vide/omis conserve le comportement OpenAI par défaut.
- `plugins.entries.amazon-bedrock.config.discovery` : racine des paramètres d’auto-découverte Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` : activer/désactiver la découverte implicite.
- `plugins.entries.amazon-bedrock.config.discovery.region` : région AWS pour la découverte.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter` : filtre facultatif d’ID provider pour une découverte ciblée.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval` : intervalle d’interrogation pour le rafraîchissement de la découverte.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow` : fenêtre de contexte de repli pour les modèles découverts.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens` : nombre maximal de tokens de sortie de repli pour les modèles découverts.

### Exemples de provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Utilisez `cerebras/zai-glm-4.7` pour Cerebras ; `zai/glm-4.7` pour Z.AI direct.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Définissez `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Utilisez les références `opencode/...` pour le catalogue Zen ou les références `opencode-go/...` pour le catalogue Go. Raccourci : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Définissez `ZAI_API_KEY`. `z.ai/*` et `z-ai/*` sont acceptés comme alias. Raccourci : `openclaw onboard --auth-choice zai-api-key`.

- Point de terminaison général : `https://api.z.ai/api/paas/v4`
- Point de terminaison de coding (par défaut) : `https://api.z.ai/api/coding/paas/v4`
- Pour le point de terminaison général, définissez un provider personnalisé avec le remplacement d’URL de base.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Pour le point de terminaison Chine : `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

Les points de terminaison Moonshot natifs annoncent la compatibilité d’utilisation en streaming sur le transport partagé `openai-completions`, et OpenClaw s’appuie désormais sur les capacités du point de terminaison plutôt que sur l’identifiant provider intégré seul.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatible Anthropic, provider intégré. Raccourci : `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatible Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

L’URL de base doit omettre `/v1` (le client Anthropic l’ajoute). Raccourci : `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Définissez `MINIMAX_API_KEY`. Raccourcis :
`openclaw onboard --auth-choice minimax-global-api` ou
`openclaw onboard --auth-choice minimax-cn-api`.
Le catalogue de modèles utilise désormais M2.7 uniquement par défaut.
Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut le thinking MiniMax
sauf si vous définissez explicitement `thinking` vous-même. `/fast on` ou
`params.fastMode: true` réécrit `MiniMax-M2.7` en
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modèles locaux (LM Studio)">

Voir [Local Models](/gateway/local-models). En résumé : exécutez un gros modèle local via l’API Responses de LM Studio sur un matériel sérieux ; conservez les modèles hébergés fusionnés pour le fallback.

</Accordion>

---

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en clair
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d’autorisation facultative pour les Skills intégrés uniquement (les Skills gérés/d’espace de travail ne sont pas affectés).
- `load.extraDirs` : racines de Skills partagées supplémentaires (priorité la plus faible).
- `install.preferBrew` : lorsqu’à true, préfère les installateurs Homebrew lorsque `brew` est
  disponible avant de revenir à d’autres types d’installateur.
- `install.nodeManager` : préférence de gestionnaire node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` désactive un Skill même s’il est intégré/installé.
- `entries.<skillKey>.apiKey` : champ pratique de clé API au niveau du Skill (lorsqu’il est pris en charge par le Skill).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
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
- La découverte accepte les plugins OpenClaw natifs ainsi que les bundles Codex compatibles et les bundles Claude, y compris les bundles Claude sans manifeste avec disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage de la gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins listés se chargent). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ pratique de clé API au niveau du plugin (lorsqu’il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : map de variables d’environnement à portée plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs de mutation de prompt issus de l’ancien `before_agent_start`, tout en conservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugins natifs et aux répertoires de hooks fournis par bundle pris en charge.
- `plugins.entries.<id>.subagent.allowModelOverride` : accorde explicitement à ce plugin le droit de demander des remplacements `provider` et `model` par exécution pour les exécutions de subagent en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative des cibles canoniques `provider/model` pour les remplacements fiables de subagent. Utilisez `"*"` uniquement si vous souhaitez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma du plugin OpenClaw natif lorsque disponible).
- `plugins.entries.firecrawl.config.webFetch` : paramètres du provider de récupération web Firecrawl.
  - `apiKey` : clé API Firecrawl (accepte SecretRef). Se replie sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancien `tools.web.fetch.firecrawl.apiKey`, ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev`).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’attente de requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche web Grok).
  - `enabled` : activer le provider X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres memory dreaming (expérimental). Voir [Dreaming](/concepts/memory-dreaming) pour les modes et seuils.
  - `mode` : préréglage de cadence dreaming (`"off"`, `"core"`, `"rem"`, `"deep"`). Par défaut : `"off"`.
  - `cron` : remplacement facultatif d’expression cron pour la planification dreaming.
  - `timezone` : fuseau horaire pour l’évaluation de la planification (utilise `agents.defaults.userTimezone` comme repli).
  - `limit` : nombre maximal de candidats à promouvoir par cycle.
  - `minScore` : seuil minimal de score pondéré pour la promotion.
  - `minRecallCount` : seuil minimal de nombre de rappels.
  - `minUniqueQueries` : seuil minimal de requêtes distinctes.
- Les plugins bundle Claude activés peuvent également apporter des valeurs par défaut Pi intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisit l’ID du plugin memory actif, ou `"none"` pour désactiver les plugins memory.
- `plugins.slots.contextEngine` : choisit l’ID du plugin moteur de contexte actif ; par défaut `"legacy"` sauf si vous installez et sélectionnez un autre moteur.
- `plugins.installs` : métadonnées d’installation gérées par la CLI utilisées par `openclaw plugins update`.
  - Inclut `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traitez `plugins.installs.*` comme un état géré ; préférez les commandes CLI aux modifications manuelles.

Voir [Plugins](/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // mode trusted-network par défaut
      // allowPrivateNetwork: true, // alias historique
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` vaut par défaut `true` lorsqu’il n’est pas défini (modèle trusted-network).
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` pour une navigation browser stricte, uniquement vers le réseau public.
- En mode strict, les points de terminaison de profils CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage de réseau privé pendant les vérifications de joignabilité/découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias historique.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour des exceptions explicites.
- Les profils distants sont en mode attachement uniquement (start/stop/reset désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous souhaitez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre provider vous fournit une URL WebSocket DevTools directe.
- Les profils `existing-session` sont limités à l’hôte et utilisent Chrome MCP au lieu de CDP.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil
  spécifique de navigateur basé sur Chromium, comme Brave ou Edge.
- Les profils `existing-session` conservent les limitations actuelles de la route Chrome MCP :
  actions pilotées par snapshot/ref au lieu du ciblage par sélecteur CSS, hooks de téléversement
  à un seul fichier, pas de remplacements de délai d’attente de boîte de dialogue, pas de
  `wait --load networkidle`, et pas de `responsebody`, export PDF, interception de téléchargement
  ni actions par lot.
- Les profils locaux gérés `openclaw` attribuent automatiquement `cdpPort` et `cdpUrl` ; ne
  définissez explicitement `cdpUrl` que pour le CDP distant.
- Ordre d’auto-détection : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Service de contrôle : loopback uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, dimensionnement de fenêtre ou indicateurs de débogage).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texte court, URL d’image ou URI data
    },
  },
}
```

- `seamColor` : couleur d’accent pour le chrome UI de l’application native (teinte de bulle du mode Talk, etc.).
- `assistant` : remplacement d’identité de Control UI. Utilise l’identité de l’agent actif comme repli.

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
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // pour mode=trusted-proxy ; voir /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // requis pour une Control UI non loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode dangereux de repli d’origine basé sur l’en-tête Host
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
    // Facultatif. Par défaut false.
    allowRealIpFallback: false,
    tools: {
      // Refus HTTP supplémentaires pour /tools/invoke
      deny: ["browser"],
      // Retirer des outils de la liste de refus HTTP par défaut
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

<Accordion title="Détails des champs gateway">

- `mode` : `local` (exécuter la gateway) ou `remote` (se connecter à une gateway distante). La gateway refuse de démarrer sauf si `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement), ou `custom`.
- **Alias historiques de bind** : utilisez les valeurs de mode de bind dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), pas les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Remarque Docker** : le bind `loopback` par défaut écoute sur `127.0.0.1` à l’intérieur du conteneur. Avec le réseau bridge Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc la gateway est injoignable. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Auth** : requise par défaut. Les binds non loopback nécessitent une authentification gateway. En pratique cela signifie un jeton/mot de passe partagé ou un reverse proxy aware de l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’onboarding génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRefs), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode sans authentification explicite. À utiliser uniquement pour des configurations loopback locales de confiance ; ce mode n’est volontairement pas proposé par les invites d’onboarding.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification à un reverse proxy aware de l’identité et fait confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Trusted Proxy Auth](/gateway/trusted-proxy-auth)). Ce mode attend une source proxy **non loopback** ; les reverse proxies loopback sur la même machine ne satisfont pas l’authentification trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de Control UI/WebSocket (vérifiés via `tailscale whois`). Les points de terminaison API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent le mode d’authentification HTTP normal de la gateway à la place. Ce flux sans jeton suppose que l’hôte gateway est de confiance. Par défaut `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d’authentification. S’applique par IP client et par étendue auth (secret partagé et jeton d’appareil sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture d’échec. Des tentatives simultanées incorrectes du même client peuvent donc déclencher le limiteur sur la deuxième requête au lieu de toutes passer simplement en erreur de correspondance.
  - `gateway.auth.rateLimit.exemptLoopback` vaut par défaut `true` ; définissez `false` si vous souhaitez volontairement limiter aussi le trafic localhost (pour les configurations de test ou les déploiements proxy stricts).
- Les tentatives d’authentification WS d’origine navigateur sont toujours limitées sans exemption loopback (défense en profondeur contre les attaques par force brute localhost depuis le navigateur).
- En loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne
  verrouillent pas automatiquement une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, bind loopback) ou `funnel` (public, nécessite auth).
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines navigateur pour les connexions WebSocket Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active le repli d’origine basé sur l’en-tête Host pour les déploiements qui s’appuient intentionnellement sur cette politique.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : remplacement côté client de type break-glass qui autorise `ws://` en clair vers des IP de réseau privé de confiance ; par défaut, le trafic en clair reste limité au loopback.
- `gateway.remote.token` / `.password` sont des champs d’identifiants de client distant. Ils ne configurent pas à eux seuls l’authentification de la gateway.
-