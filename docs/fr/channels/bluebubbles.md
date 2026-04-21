---
read_when:
    - Configuration du canal BlueBubbles
    - Résolution des problèmes d’appairage du Webhook
    - Configuration de iMessage sur macOS
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T06:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Statut : plugin intégré qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple par rapport à l’ancien canal imsg.

## Plugin intégré

Les versions actuelles d’OpenClaw intègrent BlueBubbles, donc les builds packagés normaux n’ont pas
besoin d’une étape distincte `openclaw plugins install`.

## Vue d’ensemble

- S’exécute sur macOS via l’application d’assistance BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler un succès sans se synchroniser.
- OpenClaw communique avec lui via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des Webhooks ; les réponses sortantes, indicateurs de saisie, accusés de lecture et tapbacks sont des appels REST.
- Les pièces jointes et autocollants sont ingérés comme médias entrants (et transmis à l’agent quand c’est possible).
- L’appairage/la liste d’autorisation fonctionne de la même manière que pour les autres canaux (`/channels/pairing` etc.) avec `channels.bluebubbles.allowFrom` + codes d’appairage.
- Les réactions sont remontées comme événements système, comme avec Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modification, annulation d’envoi, réponses en fil, effets de message, gestion des groupes.

## Démarrage rapide

1. Installez le serveur BlueBubbles sur votre Mac (suivez les instructions sur [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Dans la configuration BlueBubbles, activez l’API web et définissez un mot de passe.
3. Exécutez `openclaw onboard` et sélectionnez BlueBubbles, ou configurez-le manuellement :

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Pointez les Webhooks BlueBubbles vers votre Gateway (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Démarrez la Gateway ; elle enregistrera le gestionnaire de Webhook et lancera l’appairage.

Note de sécurité :

- Définissez toujours un mot de passe de Webhook.
- L’authentification du Webhook est toujours requise. OpenClaw rejette les requêtes de Webhook BlueBubbles à moins qu’elles n’incluent un mot de passe/guid correspondant à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse complète des corps de Webhook.

## Garder Messages.app actif (configurations VM / headless)

Certaines configurations macOS en VM / toujours actives peuvent amener Messages.app à devenir « inactive » (les événements entrants s’arrêtent jusqu’à ce que l’app soit ouverte ou remise au premier plan). Une solution simple consiste à **stimuler Messages toutes les 5 minutes** à l’aide d’un AppleScript + LaunchAgent.

### 1) Enregistrer l’AppleScript

Enregistrez ceci sous :

- `~/Scripts/poke-messages.scpt`

Exemple de script (non interactif ; ne vole pas le focus) :

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Installer un LaunchAgent

Enregistrez ceci sous :

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Remarques :

- Ceci s’exécute **toutes les 300 secondes** et **à la connexion**.
- La première exécution peut déclencher des invites macOS **Automation** (`osascript` → Messages). Approuvez-les dans la même session utilisateur que celle qui exécute le LaunchAgent.

Chargez-le :

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles est disponible dans l’onboarding interactif :

```
openclaw onboard
```

L’assistant demande :

- **URL du serveur** (obligatoire) : adresse du serveur BlueBubbles (par ex. `http://192.168.1.100:1234`)
- **Mot de passe** (obligatoire) : mot de passe API depuis les paramètres de BlueBubbles Server
- **Chemin du Webhook** (optionnel) : `/bluebubbles-webhook` par défaut
- **Politique DM** : appairage, liste d’autorisation, ouvert ou désactivé
- **Liste d’autorisation** : numéros de téléphone, e-mails ou cibles de chat

Vous pouvez aussi ajouter BlueBubbles via la CLI :

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Contrôle d’accès (DM + groupes)

DM :

- Par défaut : `channels.bluebubbles.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuver via :
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/fr/channels/pairing)

Groupes :

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes quand `allowlist` est défini.

### Enrichissement des noms de contact (macOS, optionnel)

Les Webhooks de groupe BlueBubbles n’incluent souvent que les adresses brutes des participants. Si vous voulez que le contexte `GroupMembers` affiche à la place les noms de contact locaux, vous pouvez activer l’enrichissement depuis les Contacts locaux sur macOS :

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` active la recherche. Par défaut : `false`.
- Les recherches ne s’exécutent qu’après que l’accès au groupe, l’autorisation des commandes et le filtrage des mentions ont autorisé le message.
- Seuls les participants téléphoniques sans nom sont enrichis.
- Les numéros de téléphone bruts restent la solution de repli lorsqu’aucune correspondance locale n’est trouvée.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtrage des mentions (groupes)

BlueBubbles prend en charge le filtrage des mentions pour les discussions de groupe, conformément au comportement de iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Quand `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
- Les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage des mentions.

Configuration par groupe :

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // valeur par défaut pour tous les groupes
        "iMessage;-;chat123": { requireMention: false }, // remplacement pour un groupe spécifique
      },
    },
  },
}
```

### Filtrage des commandes

- Les commandes de contrôle (par ex. `/config`, `/model`) nécessitent une autorisation.
- Utilise `allowFrom` et `groupAllowFrom` pour déterminer l’autorisation des commandes.
- Les expéditeurs autorisés peuvent exécuter des commandes de contrôle même sans mention dans les groupes.

### Prompt système par groupe

Chaque entrée sous `channels.bluebubbles.groups.*` accepte une chaîne `systemPrompt` optionnelle. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe, ce qui vous permet de définir une personnalité ou des règles de comportement par groupe sans modifier les prompts de l’agent :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Gardez les réponses sous 3 phrases. Reprenez le ton décontracté du groupe.",
        },
      },
    },
  },
}
```

La clé correspond à ce que BlueBubbles signale comme `chatGuid` / `chatIdentifier` / `chatId` numérique pour le groupe, et une entrée générique `"*"` fournit une valeur par défaut pour chaque groupe sans correspondance exacte (même modèle utilisé par `requireMention` et les politiques d’outils par groupe). Les correspondances exactes ont toujours priorité sur l’entrée générique. Les DM ignorent ce champ ; utilisez à la place la personnalisation des prompts au niveau de l’agent ou du compte.

#### Exemple pratique : réponses en fil et réactions tapback (API privée)

Avec l’API privée BlueBubbles activée, les messages entrants arrivent avec des identifiants de message courts (par exemple `[[reply_to:5]]`) et l’agent peut appeler `action=reply` pour répondre dans un message précis ou `action=react` pour déposer un tapback. Un `systemPrompt` par groupe est un moyen fiable pour pousser l’agent à choisir le bon outil :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Quand vous répondez dans ce groupe, appelez toujours action=reply avec le",
            "messageId [[reply_to:N]] du contexte afin que votre réponse soit en fil",
            "sous le message déclencheur. N’envoyez jamais un nouveau message non lié.",
            "",
            "Pour les accusés de réception courts ('ok', 'bien reçu', 'je m’en occupe'), utilisez",
            "action=react avec un emoji tapback approprié (❤️, 👍, 😂, ‼️, ❓)",
            "au lieu d’envoyer une réponse texte.",
          ].join(" "),
        },
      },
    },
  },
}
```

Les réactions tapback et les réponses en fil nécessitent toutes deux l’API privée BlueBubbles ; voir [Actions avancées](#advanced-actions) et [Identifiants de message](#message-ids-short-vs-full) pour les mécanismes sous-jacents.

## Liaisons de conversation ACP

Les chats BlueBubbles peuvent être transformés en espaces de travail ACP durables sans modifier la couche de transport.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM ou le chat de groupe autorisé.
- Les messages suivants dans cette même conversation BlueBubbles sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont également prises en charge via des entrées `bindings[]` de niveau supérieur avec `type: "acp"` et `match.channel: "bluebubbles"`.

`match.peer.id` peut utiliser n’importe quelle forme de cible BlueBubbles prise en charge :

- handle DM normalisé comme `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Pour des liaisons de groupe stables, préférez `chat_id:*` ou `chat_identifier:*`.

Exemple :

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Voir [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Saisie + accusés de lecture

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Accusés de lecture** : contrôlés par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie des événements de début de saisie ; BlueBubbles efface automatiquement la saisie lors de l’envoi ou à l’expiration du délai (l’arrêt manuel via DELETE n’est pas fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // désactiver les accusés de lecture
    },
  },
}
```

## Actions avancées

BlueBubbles prend en charge des actions de message avancées lorsqu’elles sont activées dans la configuration :

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

Actions disponibles :

- **react** : ajouter/supprimer des réactions tapback (`messageId`, `emoji`, `remove`)
- **edit** : modifier un message envoyé (`messageId`, `text`)
- **unsend** : annuler l’envoi d’un message (`messageId`)
- **reply** : répondre à un message spécifique (`messageId`, `text`, `to`)
- **sendWithEffect** : envoyer avec un effet iMessage (`text`, `to`, `effectId`)
- **renameGroup** : renommer un chat de groupe (`chatGuid`, `displayName`)
- **setGroupIcon** : définir l’icône/photo d’un chat de groupe (`chatGuid`, `media`) — instable sur macOS 26 Tahoe (l’API peut signaler un succès mais l’icône ne se synchronise pas).
- **addParticipant** : ajouter quelqu’un à un groupe (`chatGuid`, `address`)
- **removeParticipant** : retirer quelqu’un d’un groupe (`chatGuid`, `address`)
- **leaveGroup** : quitter un chat de groupe (`chatGuid`)
- **upload-file** : envoyer des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`)
  - Mémos vocaux : définissez `asVoice: true` avec de l’audio **MP3** ou **CAF** pour envoyer un message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi des mémos vocaux.
- Alias hérité : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.

### Identifiants de message (courts vs complets)

OpenClaw peut afficher des identifiants de message _courts_ (par ex. `1`, `2`) pour économiser des tokens.

- `MessageSid` / `ReplyToId` peuvent être des identifiants courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les identifiants complets du fournisseur.
- Les identifiants courts sont en mémoire ; ils peuvent expirer après un redémarrage ou une éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les identifiants courts provoqueront une erreur s’ils ne sont plus disponibles.

Utilisez les identifiants complets pour les automatisations et le stockage durables :

- Modèles : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les payloads entrants

Voir [Configuration](/fr/gateway/configuration) pour les variables de modèle.

## Streaming par blocs

Contrôlez si les réponses sont envoyées comme un seul message ou diffusées par blocs :

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Médias + limites

- Les pièces jointes entrantes sont téléchargées et stockées dans le cache média.
- Plafond média via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 MB).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.bluebubbles.enabled` : activer/désactiver le canal.
- `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
- `channels.bluebubbles.password` : mot de passe de l’API.
- `channels.bluebubbles.webhookPath` : chemin de l’endpoint Webhook (par défaut : `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
- `channels.bluebubbles.allowFrom` : liste d’autorisation DM (handles, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichit de manière optionnelle les participants de groupe sans nom à partir des Contacts locaux après le passage du filtrage. Par défaut : `false`.
- `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts` : envoyer les accusés de lecture (par défaut : `true`).
- `channels.bluebubbles.blockStreaming` : activer le streaming par blocs (par défaut : `false` ; requis pour les réponses en streaming).
- `channels.bluebubbles.textChunkLimit` : taille des blocs sortants en caractères (par défaut : 4000).
- `channels.bluebubbles.sendTimeoutMs` : délai d’expiration par requête en ms pour les envois de texte sortants via `/api/v1/message/text` (par défaut : 30000). Augmentez-le sur les configurations macOS 26 où les envois iMessage via l’API privée peuvent se bloquer pendant plus de 60 secondes dans le framework iMessage ; par exemple `45000` ou `60000`. Les sondes, recherches de chat, réactions, modifications et vérifications d’état conservent actuellement le délai plus court par défaut de 10 s ; l’extension de cette couverture aux réactions et modifications est prévue ultérieurement. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode` : `length` (par défaut) découpe uniquement en cas de dépassement de `textChunkLimit` ; `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.bluebubbles.mediaMaxMb` : plafond des médias entrants/sortants en MB (par défaut : 8).
- `channels.bluebubbles.mediaLocalRoots` : liste d’autorisation explicite des répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois à partir d’un chemin local sont refusés par défaut tant que cela n’est pas configuré. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit` : nombre maximal de messages de groupe pour le contexte (0 désactive).
- `channels.bluebubbles.dmHistoryLimit` : limite d’historique DM.
- `channels.bluebubbles.actions` : activer/désactiver des actions spécifiques.
- `channels.bluebubbles.accounts` : configuration multi-comptes.

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressage / cibles de livraison

Préférez `chat_guid` pour un routage stable :

- `chat_guid:iMessage;-;+15555550123` (préféré pour les groupes)
- `chat_id:123`
- `chat_identifier:...`
- Handles directs : `+15555550123`, `user@example.com`
  - Si un handle direct n’a pas de chat DM existant, OpenClaw en créera un via `POST /api/v1/chat/new`. Cela nécessite que l’API privée BlueBubbles soit activée.

## Sécurité

- Les requêtes de Webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez le mot de passe API et l’endpoint Webhook secrets (traitez-les comme des identifiants).
- Il n’existe aucun contournement localhost pour l’authentification Webhook BlueBubbles. Si vous proxifiez le trafic Webhook, conservez le mot de passe BlueBubbles dans la requête de bout en bout. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Voir [Sécurité de la Gateway](/fr/gateway/security#reverse-proxy-configuration).
- Activez HTTPS + des règles de pare-feu sur le serveur BlueBubbles si vous l’exposez en dehors de votre LAN.

## Résolution des problèmes

- Si les événements de saisie/lecture cessent de fonctionner, vérifiez les journaux de Webhook BlueBubbles et assurez-vous que le chemin de la Gateway correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’appairage expirent après une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent l’API privée BlueBubbles (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- La modification/l’annulation d’envoi nécessite macOS 13+ et une version compatible du serveur BlueBubbles. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements dans l’API privée.
- Les mises à jour d’icône de groupe peuvent être instables sur macOS 26 (Tahoe) : l’API peut signaler un succès mais la nouvelle icône ne se synchronise pas.
- OpenClaw masque automatiquement les actions connues comme cassées en fonction de la version macOS du serveur BlueBubbles. Si la modification apparaît encore sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- Pour les informations d’état/santé : `openclaw status --all` ou `openclaw status --deep`.

Pour une référence générale sur le flux de travail des canaux, voir [Canaux](/fr/channels) et le guide [Plugins](/fr/tools/plugin).

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des chats de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
