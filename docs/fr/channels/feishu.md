---
read_when:
    - Vous voulez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Vue d’ensemble, fonctionnalités et configuration du bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-05T12:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Bot Feishu

Feishu (Lark) est une plateforme de chat d’équipe utilisée par les entreprises pour la messagerie et la collaboration. Ce plugin connecte OpenClaw à un bot Feishu/Lark à l’aide de l’abonnement aux événements WebSocket de la plateforme afin que les messages puissent être reçus sans exposer d’URL de webhook publique.

---

## Plugin intégré

Feishu est fourni avec les versions actuelles d’OpenClaw, donc aucune installation séparée du plugin n’est nécessaire.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui n’inclut pas Feishu, installez-le manuellement :

```bash
openclaw plugins install @openclaw/feishu
```

---

## Démarrage rapide

Il existe deux façons d’ajouter le canal Feishu :

### Méthode 1 : onboarding (recommandé)

Si vous venez d’installer OpenClaw, lancez l’onboarding :

```bash
openclaw onboard
```

L’assistant vous guide à travers :

1. La création d’une application Feishu et la collecte des identifiants
2. La configuration des identifiants d’application dans OpenClaw
3. Le démarrage de la gateway

✅ **Après la configuration**, vérifiez l’état de la gateway :

- `openclaw gateway status`
- `openclaw logs --follow`

### Méthode 2 : configuration via CLI

Si vous avez déjà terminé l’installation initiale, ajoutez le canal via la CLI :

```bash
openclaw channels add
```

Choisissez **Feishu**, puis saisissez l’App ID et l’App Secret.

✅ **Après la configuration**, gérez la gateway :

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Étape 1 : Créer une application Feishu

### 1. Ouvrir Feishu Open Platform

Rendez-vous sur [Feishu Open Platform](https://open.feishu.cn/app) et connectez-vous.

Les tenants Lark (globaux) doivent utiliser [https://open.larksuite.com/app](https://open.larksuite.com/app) et définir `domain: "lark"` dans la configuration Feishu.

### 2. Créer une application

1. Cliquez sur **Create enterprise app**
2. Renseignez le nom et la description de l’application
3. Choisissez une icône d’application

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Copier les identifiants

Depuis **Credentials & Basic Info**, copiez :

- **App ID** (format : `cli_xxx`)
- **App Secret**

❗ **Important :** gardez l’App Secret privé.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Configurer les autorisations

Dans **Permissions**, cliquez sur **Batch import** et collez :

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Activer la capacité bot

Dans **App Capability** > **Bot** :

1. Activez la capacité bot
2. Définissez le nom du bot

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Configurer l’abonnement aux événements

⚠️ **Important :** avant de configurer l’abonnement aux événements, assurez-vous que :

1. Vous avez déjà exécuté `openclaw channels add` pour Feishu
2. La gateway est en cours d’exécution (`openclaw gateway status`)

Dans **Event Subscription** :

1. Choisissez **Use long connection to receive events** (WebSocket)
2. Ajoutez l’événement : `im.message.receive_v1`
3. (Facultatif) Pour les workflows de commentaires Drive, ajoutez aussi : `drive.notice.comment_add_v1`

⚠️ Si la gateway n’est pas en cours d’exécution, la configuration de la connexion longue peut ne pas être enregistrée.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Publier l’application

1. Créez une version dans **Version Management & Release**
2. Soumettez-la pour révision et publiez-la
3. Attendez l’approbation de l’administrateur (les applications d’entreprise sont généralement approuvées automatiquement)

---

## Étape 2 : Configurer OpenClaw

### Configurer avec l’assistant (recommandé)

```bash
openclaw channels add
```

Choisissez **Feishu** et collez votre App ID et votre App Secret.

### Configurer via le fichier de configuration

Modifiez `~/.openclaw/openclaw.json` :

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

Si vous utilisez `connectionMode: "webhook"`, définissez à la fois `verificationToken` et `encryptKey`. Le serveur webhook Feishu se lie à `127.0.0.1` par défaut ; définissez `webhookHost` uniquement si vous avez intentionnellement besoin d’une autre adresse de liaison.

#### Verification Token et Encrypt Key (mode webhook)

Lorsque vous utilisez le mode webhook, définissez à la fois `channels.feishu.verificationToken` et `channels.feishu.encryptKey` dans votre configuration. Pour obtenir ces valeurs :

1. Dans Feishu Open Platform, ouvrez votre application
2. Accédez à **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Ouvrez l’onglet **Encryption** (加密策略)
4. Copiez **Verification Token** et **Encrypt Key**

La capture d’écran ci-dessous montre où trouver le **Verification Token**. L’**Encrypt Key** figure dans la même section **Encryption**.

![Verification Token location](/images/feishu-verification-token.png)

### Configurer via des variables d’environnement

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domaine Lark (global)

Si votre tenant est sur Lark (international), définissez le domaine sur `lark` (ou une chaîne de domaine complète). Vous pouvez le définir dans `channels.feishu.domain` ou par compte (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Indicateurs d’optimisation de quota

Vous pouvez réduire l’utilisation de l’API Feishu avec deux indicateurs facultatifs :

- `typingIndicator` (par défaut `true`) : lorsque `false`, ignore les appels de réaction de saisie.
- `resolveSenderNames` (par défaut `true`) : lorsque `false`, ignore les appels de recherche de profil de l’expéditeur.

Définissez-les au niveau supérieur ou par compte :

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Étape 3 : Démarrer + tester

### 1. Démarrer la gateway

```bash
openclaw gateway
```

### 2. Envoyer un message de test

Dans Feishu, trouvez votre bot et envoyez un message.

### 3. Approuver l’appairage

Par défaut, le bot répond avec un code d’appairage. Approuvez-le :

```bash
openclaw pairing approve feishu <CODE>
```

Après approbation, vous pouvez discuter normalement.

---

## Vue d’ensemble

- **Canal bot Feishu** : bot Feishu géré par la gateway
- **Routage déterministe** : les réponses reviennent toujours à Feishu
- **Isolation des sessions** : les messages directs partagent une session principale ; les groupes sont isolés
- **Connexion WebSocket** : connexion longue via le SDK Feishu, sans URL publique nécessaire

---

## Contrôle d’accès

### Messages directs

- **Par défaut** : `dmPolicy: "pairing"` (les utilisateurs inconnus reçoivent un code d’appairage)
- **Approuver l’appairage** :

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Mode liste d’autorisation** : définissez `channels.feishu.allowFrom` avec les Open IDs autorisés

### Discussions de groupe

**1. Politique de groupe** (`channels.feishu.groupPolicy`) :

- `"open"` = autoriser tout le monde dans les groupes
- `"allowlist"` = autoriser uniquement `groupAllowFrom`
- `"disabled"` = désactiver les messages de groupe

Par défaut : `allowlist`

**2. Obligation de mention** (`channels.feishu.requireMention`, surchargeable via `channels.feishu.groups.<chat_id>.requireMention`) :

- `true` explicite = exiger une @mention
- `false` explicite = répondre sans mention
- non défini et `groupPolicy: "open"` = par défaut `false`
- non défini et `groupPolicy` n’est pas `"open"` = par défaut `true`

---

## Exemples de configuration de groupe

### Autoriser tous les groupes, sans @mention requise (par défaut pour les groupes ouverts)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Autoriser tous les groupes, mais exiger quand même une @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Autoriser uniquement certains groupes

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restreindre quels expéditeurs peuvent envoyer des messages dans un groupe (liste d’autorisation des expéditeurs)

En plus d’autoriser le groupe lui-même, **tous les messages** dans ce groupe sont contrôlés par l’open_id de l’expéditeur : seuls les utilisateurs listés dans `groups.<chat_id>.allowFrom` voient leurs messages traités ; les messages des autres membres sont ignorés (il s’agit d’un contrôle complet au niveau de l’expéditeur, pas seulement pour les commandes de contrôle comme /reset ou /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obtenir les IDs de groupe/utilisateur

### IDs de groupe (chat_id)

Les IDs de groupe ressemblent à `oc_xxx`.

**Méthode 1 (recommandée)**

1. Démarrez la gateway et faites une @mention du bot dans le groupe
2. Exécutez `openclaw logs --follow` et recherchez `chat_id`

**Méthode 2**

Utilisez le débogueur d’API Feishu pour lister les discussions de groupe.

### IDs utilisateur (open_id)

Les IDs utilisateur ressemblent à `ou_xxx`.

**Méthode 1 (recommandée)**

1. Démarrez la gateway et envoyez un message direct au bot
2. Exécutez `openclaw logs --follow` et recherchez `open_id`

**Méthode 2**

Vérifiez les demandes d’appairage pour les Open IDs utilisateur :

```bash
openclaw pairing list feishu
```

---

## Commandes courantes

| Commande  | Description                     |
| --------- | ------------------------------- |
| `/status` | Afficher l’état du bot          |
| `/reset`  | Réinitialiser la session        |
| `/model`  | Afficher/changer le modèle      |

> Remarque : Feishu ne prend pas encore en charge les menus de commandes natifs, les commandes doivent donc être envoyées sous forme de texte.

## Commandes de gestion de la gateway

| Commande                   | Description                      |
| -------------------------- | -------------------------------- |
| `openclaw gateway status`  | Afficher l’état de la gateway    |
| `openclaw gateway install` | Installer/démarrer le service gateway |
| `openclaw gateway stop`    | Arrêter le service gateway       |
| `openclaw gateway restart` | Redémarrer le service gateway    |
| `openclaw logs --follow`   | Suivre les journaux de la gateway |

---

## Dépannage

### Le bot ne répond pas dans les discussions de groupe

1. Assurez-vous que le bot a été ajouté au groupe
2. Assurez-vous de faire une @mention du bot (comportement par défaut)
3. Vérifiez que `groupPolicy` n’est pas défini sur `"disabled"`
4. Vérifiez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Assurez-vous que l’application est publiée et approuvée
2. Assurez-vous que l’abonnement aux événements inclut `im.message.receive_v1`
3. Assurez-vous que la **connexion longue** est activée
4. Assurez-vous que les autorisations de l’application sont complètes
5. Assurez-vous que la gateway est en cours d’exécution : `openclaw gateway status`
6. Vérifiez les journaux : `openclaw logs --follow`

### Fuite de l’App Secret

1. Réinitialisez l’App Secret dans Feishu Open Platform
2. Mettez à jour l’App Secret dans votre configuration
3. Redémarrez la gateway

### Échecs d’envoi de message

1. Assurez-vous que l’application dispose de l’autorisation `im:message:send_as_bot`
2. Assurez-vous que l’application est publiée
3. Vérifiez les journaux pour les erreurs détaillées

---

## Configuration avancée

### Plusieurs comptes

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` contrôle quel compte Feishu est utilisé lorsque les API sortantes ne spécifient pas explicitement un `accountId`.

### Limites de message

- `textChunkLimit` : taille des segments de texte sortants (par défaut : 2000 caractères)
- `mediaMaxMb` : limite d’envoi/téléchargement de médias (par défaut : 30MB)

### Streaming

Feishu prend en charge les réponses en streaming via des cartes interactives. Lorsqu’elle est activée, le bot met à jour une carte pendant qu’il génère le texte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

Définissez `streaming: false` pour attendre la réponse complète avant l’envoi.

### Sessions ACP

Feishu prend en charge ACP pour :

- les messages directs
- les conversations de sujet de groupe

ACP Feishu est piloté par commandes texte. Il n’existe pas de menus de commandes slash natifs, utilisez donc directement des messages `/acp ...` dans la conversation.

#### Liaisons ACP persistantes

Utilisez des liaisons ACP typées de niveau supérieur pour épingler un message direct Feishu ou une conversation de sujet à une session ACP persistante.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Démarrage d’ACP lié à un fil depuis le chat

Dans un message direct Feishu ou une conversation de sujet, vous pouvez démarrer et lier une session ACP sur place :

```text
/acp spawn codex --thread here
```

Remarques :

- `--thread here` fonctionne pour les messages directs et les sujets Feishu.
- Les messages de suivi dans le message direct/sujet lié sont routés directement vers cette session ACP.
- La v1 ne cible pas les discussions de groupe génériques sans sujet.

### Routage multi-agent

Utilisez `bindings` pour router les messages directs ou groupes Feishu vers différents agents.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Champs de routage :

- `match.channel` : `"feishu"`
- `match.peer.kind` : `"direct"` ou `"group"`
- `match.peer.id` : Open ID utilisateur (`ou_xxx`) ou ID de groupe (`oc_xxx`)

Consultez [Obtenir les IDs de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Référence de configuration

Configuration complète : [Configuration de la gateway](/gateway/configuration)

Options principales :

| Paramètre                                         | Description                             | Par défaut       |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Activer/désactiver le canal             | `true`           |
| `channels.feishu.domain`                          | Domaine API (`feishu` ou `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                  | Mode de transport des événements        | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID de compte par défaut pour le routage sortant | `default`        |
| `channels.feishu.verificationToken`               | Requis pour le mode webhook             | -                |
| `channels.feishu.encryptKey`                      | Requis pour le mode webhook             | -                |
| `channels.feishu.webhookPath`                     | Chemin de route webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Hôte de liaison webhook                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port de liaison webhook                 | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Surcharge de domaine API par compte     | `feishu`         |
| `channels.feishu.dmPolicy`                        | Politique des messages directs          | `pairing`        |
| `channels.feishu.allowFrom`                       | Liste d’autorisation DM (liste d’open_id) | -              |
| `channels.feishu.groupPolicy`                     | Politique de groupe                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Liste d’autorisation de groupe          | -                |
| `channels.feishu.requireMention`                  | Exiger @mention par défaut              | conditionnel     |
| `channels.feishu.groups.<chat_id>.requireMention` | Surcharge par groupe de l’exigence @mention | hérité      |
| `channels.feishu.groups.<chat_id>.enabled`        | Activer le groupe                       | `true`           |
| `channels.feishu.textChunkLimit`                  | Taille des segments de message          | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de taille des médias             | `30`             |
| `channels.feishu.streaming`                       | Activer la sortie par carte en streaming | `true`         |
| `channels.feishu.blockStreaming`                  | Activer le streaming par bloc           | `true`           |

---

## Référence dmPolicy

| Valeur        | Comportement                                                   |
| ------------- | -------------------------------------------------------------- |
| `"pairing"`   | **Par défaut.** Les utilisateurs inconnus reçoivent un code d’appairage ; ils doivent être approuvés |
| `"allowlist"` | Seuls les utilisateurs dans `allowFrom` peuvent discuter       |
| `"open"`      | Autoriser tous les utilisateurs (nécessite `"*"` dans allowFrom) |
| `"disabled"`  | Désactiver les messages directs                                |

---

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Texte enrichi (post)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/médias
- ✅ Stickers

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/médias
- ✅ Cartes interactives
- ⚠️ Texte enrichi (formatage de type post et cartes, pas les fonctionnalités de rédaction Feishu arbitraires)

### Fils et réponses

- ✅ Réponses en ligne
- ✅ Réponses dans les fils de sujet lorsque Feishu expose `reply_in_thread`
- ✅ Les réponses média restent conscientes du fil lors d’une réponse à un message de fil/sujet

## Commentaires Drive

Feishu peut déclencher l’agent lorsqu’une personne ajoute un commentaire sur un document Feishu Drive (Docs, Sheets, etc.). L’agent reçoit le texte du commentaire, le contexte du document et le fil de commentaires afin de pouvoir répondre dans le fil ou apporter des modifications au document.

Exigences :

- Abonnez-vous à `drive.notice.comment_add_v1` dans les paramètres d’abonnement aux événements de votre application Feishu
  (en plus de `im.message.receive_v1` déjà existant)
- L’outil Drive est activé par défaut ; désactivez-le avec `channels.feishu.tools.drive: false`

L’outil `feishu_drive` expose ces actions de commentaire :

| Action                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `list_comments`        | Lister les commentaires d’un document    |
| `list_comment_replies` | Lister les réponses dans un fil de commentaires |
| `add_comment`          | Ajouter un nouveau commentaire de premier niveau |
| `reply_comment`        | Répondre à un fil de commentaires existant |

Lorsque l’agent traite un événement de commentaire Drive, il reçoit :

- le texte du commentaire et son expéditeur
- les métadonnées du document (titre, type, URL)
- le contexte du fil de commentaires pour les réponses dans le fil

Après avoir modifié le document, l’agent est guidé pour utiliser `feishu_drive.reply_comment` afin de notifier l’auteur du commentaire, puis pour produire le jeton silencieux exact `NO_REPLY` / `no_reply` afin d’éviter les envois en double.

## Surface d’actions d’exécution

Feishu expose actuellement ces actions d’exécution :

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` et `reactions` lorsque les réactions sont activées dans la configuration
- actions de commentaire `feishu_drive` : `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Voir aussi

- [Channels Overview](/channels) — tous les canaux pris en charge
- [Pairing](/channels/pairing) — authentification DM et flux d’appairage
- [Groups](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Channel Routing](/channels/channel-routing) — routage de session pour les messages
- [Security](/gateway/security) — modèle d’accès et renforcement
