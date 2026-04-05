---
read_when:
    - Configuration du canal BlueBubbles
    - Dépannage de l’appairage des webhooks
    - Configuration d’iMessage sur macOS
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T12:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Statut : plugin intégré qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple par rapport à l’ancien canal imsg.

## Plugin intégré

Les versions actuelles d’OpenClaw intègrent BlueBubbles, donc les builds packagés normaux n’ont pas besoin d’une étape `openclaw plugins install` séparée.

## Vue d’ensemble

- Fonctionne sur macOS via l’application d’assistance BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler une réussite sans se synchroniser.
- OpenClaw communique avec lui via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des webhooks ; les réponses sortantes, indicateurs de saisie, accusés de lecture et tapbacks sont des appels REST.
- Les pièces jointes et autocollants sont ingérés comme médias entrants (et transmis à l’agent lorsque c’est possible).
- L’appairage/la liste d’autorisation fonctionne de la même manière que pour les autres canaux (`/channels/pairing`, etc.) avec `channels.bluebubbles.allowFrom` + codes d’appairage.
- Les réactions sont exposées comme événements système, comme pour Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modifier, annuler l’envoi, fils de réponse, effets de message, gestion des groupes.

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

4. Pointez les webhooks BlueBubbles vers votre passerelle (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Démarrez la passerelle ; elle enregistrera le gestionnaire de webhook et lancera l’appairage.

Remarque de sécurité :

- Définissez toujours un mot de passe de webhook.
- L’authentification du webhook est toujours requise. OpenClaw rejette les requêtes de webhook BlueBubbles sauf si elles incluent un mot de passe/guid correspondant à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse des corps complets de webhook.

## Garder Messages.app actif (configurations VM / headless)

Certaines configurations macOS VM / toujours actives peuvent entraîner une mise en « veille » de Messages.app (les événements entrants s’arrêtent jusqu’à ce que l’application soit ouverte ou remise au premier plan). Une solution simple consiste à **solliciter Messages toutes les 5 minutes** à l’aide d’un AppleScript + LaunchAgent.

### 1) Enregistrer l’AppleScript

Enregistrez-le sous :

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

Enregistrez-le sous :

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

- Cela s’exécute **toutes les 300 secondes** et **à la connexion**.
- La première exécution peut déclencher les invites macOS **Automation** (`osascript` → Messages). Approuvez-les dans la même session utilisateur qui exécute le LaunchAgent.

Chargez-le :

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Intégration guidée

BlueBubbles est disponible dans l’intégration interactive :

```
openclaw onboard
```

L’assistant demande :

- **URL du serveur** (obligatoire) : adresse du serveur BlueBubbles (par ex. `http://192.168.1.100:1234`)
- **Mot de passe** (obligatoire) : mot de passe de l’API depuis les paramètres BlueBubbles Server
- **Chemin du webhook** (facultatif) : valeur par défaut `/bluebubbles-webhook`
- **Politique des messages privés** : pairing, allowlist, open ou disabled
- **Liste d’autorisation** : numéros de téléphone, e-mails ou cibles de chat

Vous pouvez également ajouter BlueBubbles via la CLI :

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Contrôle d’accès (messages privés + groupes)

Messages privés :

- Par défaut : `channels.bluebubbles.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuvez via :
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/channels/pairing)

Groupes :

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.

### Enrichissement des noms de contacts (macOS, facultatif)

Les webhooks de groupe BlueBubbles incluent souvent uniquement les adresses brutes des participants. Si vous souhaitez que le contexte `GroupMembers` affiche à la place les noms des contacts locaux, vous pouvez activer l’enrichissement local Contacts sur macOS :

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

### Filtrage par mention (groupes)

BlueBubbles prend en charge le filtrage par mention pour les discussions de groupe, conformément au comportement iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Lorsque `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
- Les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage par mention.

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

## Liaisons de conversation ACP

Les discussions BlueBubbles peuvent être transformées en espaces de travail ACP durables sans modifier la couche de transport.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message privé ou le groupe autorisé.
- Les futurs messages dans cette même conversation BlueBubbles sont acheminés vers la session ACP démarrée.
- `/new` et `/reset` réinitialisent en place cette même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont également prises en charge via des entrées `bindings[]` de niveau supérieur avec `type: "acp"` et `match.channel: "bluebubbles"`.

`match.peer.id` peut utiliser toute forme de cible BlueBubbles prise en charge :

- identifiant de message privé normalisé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Pour des liaisons de groupe stables, privilégiez `chat_id:*` ou `chat_identifier:*`.

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

Consultez [Agents ACP](/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Saisie + accusés de lecture

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Accusés de lecture** : contrôlés par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie des événements de début de saisie ; BlueBubbles efface automatiquement l’état de saisie lors de l’envoi ou après expiration (l’arrêt manuel via DELETE n’est pas fiable).

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
        reactions: true, // tapbacks (par défaut : true)
        edit: true, // modifier les messages envoyés (macOS 13+, cassé sur macOS 26 Tahoe)
        unsend: true, // annuler l’envoi des messages (macOS 13+)
        reply: true, // fils de réponse par GUID de message
        sendWithEffect: true, // effets de message (slam, loud, etc.)
        renameGroup: true, // renommer les discussions de groupe
        setGroupIcon: true, // définir l’icône/photo de la discussion de groupe (instable sur macOS 26 Tahoe)
        addParticipant: true, // ajouter des participants aux groupes
        removeParticipant: true, // supprimer des participants des groupes
        leaveGroup: true, // quitter les discussions de groupe
        sendAttachment: true, // envoyer des pièces jointes/médias
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
- **renameGroup** : renommer une discussion de groupe (`chatGuid`, `displayName`)
- **setGroupIcon** : définir l’icône/photo d’une discussion de groupe (`chatGuid`, `media`) — instable sur macOS 26 Tahoe (l’API peut signaler une réussite mais l’icône ne se synchronise pas).
- **addParticipant** : ajouter quelqu’un à un groupe (`chatGuid`, `address`)
- **removeParticipant** : supprimer quelqu’un d’un groupe (`chatGuid`, `address`)
- **leaveGroup** : quitter une discussion de groupe (`chatGuid`)
- **upload-file** : envoyer des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`)
  - Mémos vocaux : définissez `asVoice: true` avec de l’audio **MP3** ou **CAF** pour envoyer un message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi de mémos vocaux.
- Alias historique : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.

### Identifiants de message (courts vs complets)

OpenClaw peut exposer des identifiants de message _courts_ (par ex. `1`, `2`) pour économiser des jetons.

- `MessageSid` / `ReplyToId` peuvent être des identifiants courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les identifiants complets du fournisseur.
- Les identifiants courts sont en mémoire ; ils peuvent expirer après un redémarrage ou une éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les identifiants courts généreront une erreur s’ils ne sont plus disponibles.

Utilisez les identifiants complets pour les automatisations durables et le stockage :

- Templates : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les charges utiles entrantes

Consultez [Configuration](/gateway/configuration) pour les variables de template.

## Diffusion par blocs

Contrôlez si les réponses sont envoyées sous forme d’un seul message ou diffusées par blocs :

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // activer la diffusion par blocs (désactivée par défaut)
    },
  },
}
```

## Médias + limites

- Les pièces jointes entrantes sont téléchargées et stockées dans le cache média.
- Limite média via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 Mo).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/gateway/configuration)

Options du fournisseur :

- `channels.bluebubbles.enabled` : activer/désactiver le canal.
- `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
- `channels.bluebubbles.password` : mot de passe API.
- `channels.bluebubbles.webhookPath` : chemin du point de terminaison webhook (par défaut : `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
- `channels.bluebubbles.allowFrom` : liste d’autorisation des messages privés (identifiants, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs dans les groupes.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichir facultativement les participants de groupe sans nom à partir des Contacts locaux une fois le filtrage passé. Par défaut : `false`.
- `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts` : envoyer des accusés de lecture (par défaut : `true`).
- `channels.bluebubbles.blockStreaming` : activer la diffusion par blocs (par défaut : `false` ; requis pour les réponses en streaming).
- `channels.bluebubbles.textChunkLimit` : taille de découpage sortant en caractères (par défaut : 4000).
- `channels.bluebubbles.chunkMode` : `length` (par défaut) découpe uniquement en cas de dépassement de `textChunkLimit` ; `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.bluebubbles.mediaMaxMb` : limite des médias entrants/sortants en Mo (par défaut : 8).
- `channels.bluebubbles.mediaLocalRoots` : liste d’autorisation explicite des répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois par chemin local sont refusés par défaut sauf si cela est configuré. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit` : nombre maximal de messages de groupe pour le contexte (0 désactive).
- `channels.bluebubbles.dmHistoryLimit` : limite d’historique des messages privés.
- `channels.bluebubbles.actions` : activer/désactiver des actions spécifiques.
- `channels.bluebubbles.accounts` : configuration multi-comptes.

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressage / cibles de distribution

Préférez `chat_guid` pour un routage stable :

- `chat_guid:iMessage;-;+15555550123` (préféré pour les groupes)
- `chat_id:123`
- `chat_identifier:...`
- Identifiants directs : `+15555550123`, `user@example.com`
  - Si un identifiant direct n’a pas de discussion privée existante, OpenClaw en créera une via `POST /api/v1/chat/new`. Cela nécessite l’activation de l’API privée BlueBubbles.

## Sécurité

- Les requêtes de webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez secrets le mot de passe API et le point de terminaison webhook (traitez-les comme des identifiants).
- Il n’existe aucun contournement localhost pour l’authentification des webhooks BlueBubbles. Si vous proxifiez le trafic webhook, conservez le mot de passe BlueBubbles de bout en bout dans la requête. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Voir [Sécurité de la passerelle](/gateway/security#reverse-proxy-configuration).
- Activez HTTPS + des règles de pare-feu sur le serveur BlueBubbles si vous l’exposez en dehors de votre LAN.

## Dépannage

- Si les événements de saisie/lecture cessent de fonctionner, consultez les journaux de webhook BlueBubbles et vérifiez que le chemin de la passerelle correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’appairage expirent après une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent l’API privée BlueBubbles (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- Modifier/annuler l’envoi nécessitent macOS 13+ et une version compatible du serveur BlueBubbles. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements dans l’API privée.
- Les mises à jour d’icône de groupe peuvent être instables sur macOS 26 (Tahoe) : l’API peut signaler une réussite mais la nouvelle icône ne se synchronise pas.
- OpenClaw masque automatiquement les actions connues comme cassées en fonction de la version macOS du serveur BlueBubbles. Si la modification apparaît encore sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- Pour les informations d’état/santé : `openclaw status --all` ou `openclaw status --deep`.

Pour une référence générale sur le flux des canaux, consultez [Canaux](/channels) et le guide [Plugins](/tools/plugin).

## Lié

- [Vue d’ensemble des canaux](/channels) — tous les canaux pris en charge
- [Appairage](/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/gateway/security) — modèle d’accès et durcissement
