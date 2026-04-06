---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l'exécution (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-06T03:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e4ff2ce7d92276d62f4f3d3693ddb56ca163d5fdc2f1082ff7ba3421fada69c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Statut : prêt pour la production pour les DM et les canaux via des intégrations d’application Slack. Le mode par défaut est Socket Mode ; le mode HTTP Events API est également pris en charge.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les DM Slack utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue de commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (par défaut)">
    <Steps>
      <Step title="Créer l’application Slack et les jetons">
        Dans les paramètres de l’application Slack :

        - activez **Socket Mode**
        - créez un **App Token** (`xapp-...`) avec `connections:write`
        - installez l’application et copiez le **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configurer OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Variable d’environnement de secours (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="S’abonner aux événements de l’application">
        Abonnez les événements bot suivants :

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Activez également l’onglet **Messages Tab** de l’App Home pour les DM.
      </Step>

      <Step title="Démarrer la passerelle">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Mode HTTP Events API">
    <Steps>
      <Step title="Configurer l’application Slack pour HTTP">

        - définissez le mode sur HTTP (`channels.slack.mode="http"`)
        - copiez le **Signing Secret** Slack
        - définissez l’URL de requête de Event Subscriptions, Interactivity et des commandes slash sur le même chemin webhook (par défaut `/slack/events`)

      </Step>

      <Step title="Configurer le mode HTTP d’OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Utiliser des chemins webhook uniques pour le mode HTTP multi-comptes">
        Le mode HTTP par compte est pris en charge.

        Attribuez à chaque compte un `webhookPath` distinct afin que les enregistrements n’entrent pas en collision.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Vérification du manifeste et des scopes

<AccordionGroup>
  <Accordion title="Exemple de manifeste d’application Slack" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Scopes facultatifs du jeton utilisateur (opérations de lecture)">
    Si vous configurez `channels.slack.userToken`, les scopes de lecture typiques sont :

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (si vous dépendez des lectures de recherche Slack)

  </Accordion>
</AccordionGroup>

## Modèle de jeton

- `botToken` + `appToken` sont requis pour Socket Mode.
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes
  en texte brut ou des objets SecretRef.
- Les jetons de configuration remplacent la variable d’environnement de secours.
- La variable d’environnement de secours `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est disponible uniquement dans la configuration (pas de variable d’environnement de secours) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).
- Facultatif : ajoutez `chat:write.customize` si vous souhaitez que les messages sortants utilisent l’identité active de l’agent (`username` et icône personnalisés). `icon_emoji` utilise la syntaxe `:nom_emoji:`.

Comportement de l’instantané d’état :

- L’inspection des comptes Slack suit, par identifiant, les champs `*Source` et `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Le statut est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que le chemin de commande/d’exécution
  actuel n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la paire
  requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton bot reste privilégié ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton bot est indisponible.
</Tip>

## Actions et contrôles

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans l’outillage Slack actuel :

| Groupe     | Par défaut |
| ---------- | ---------- |
| messages   | activé     |
| reactions  | activé     |
| pins       | activé     |
| memberInfo | activé     |
| emojiList  | activé     |

Les actions de message Slack actuelles incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des DM">
    `channels.slack.dmPolicy` contrôle l’accès aux DM (hérité : `channels.slack.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"` ; hérité : `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicateurs DM :

    - `dm.enabled` (par défaut true)
    - `channels.slack.allowFrom` (préféré)
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (les DM de groupe sont désactivés par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multi-comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    L’appairage dans les DM utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique des canaux">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et doit utiliser des ID de canal stables.

    Remarque d’exécution : si `channels.slack` est totalement absent (configuration via env uniquement), l’exécution revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canaux et de DM sont résolues au démarrage lorsque l’accès au jeton le permet
    - les entrées de nom de canal non résolues sont conservées telles que configurées mais ignorées pour le routage par défaut
    - l’autorisation entrante et le routage des canaux sont basés sur l’ID par défaut ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions et utilisateurs des canaux">
    Les messages de canal sont, par défaut, soumis à l’obligation de mention.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - modèles regex de mention (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse dans un fil au bot

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou joker `"*"`
      (les clés héritées sans préfixe sont toujours mappées uniquement vers `id:`)

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les DM sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Avec le `session.dmScope=main` par défaut, les DM Slack sont réduits à la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans un fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) lorsque c’est applicable.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle le nombre de messages de fil existants récupérés au démarrage d’une nouvelle session de fil (par défaut `20` ; définissez `0` pour désactiver).

Contrôles de fil des réponses :

- `channels.slack.replyToMode`: `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType`: par `direct|group|channel`
- repli hérité pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Remarque : `replyToMode="off"` désactive **tout** le filage des réponses dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours respectées en mode `"off"`. Cette différence reflète les modèles de fil des plateformes : les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles dans le flux principal de conversation.

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Remarques :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Streaming de texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactive le streaming d’aperçu en direct.
- `partial` (par défaut) : remplace le texte d’aperçu par la dernière sortie partielle.
- `block` : ajoute des mises à jour d’aperçu par blocs.
- `progress` : affiche un texte d’état de progression pendant la génération, puis envoie le texte final.

`channels.slack.nativeStreaming` contrôle le streaming de texte natif Slack lorsque `streaming` est `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que le streaming de texte natif apparaisse. La sélection du fil continue de suivre `replyToMode`. Sans cela, l’aperçu de brouillon normal est utilisé.
- Les médias et les charges utiles non textuelles reviennent au mode de livraison normal.
- Si le streaming échoue au milieu de la réponse, OpenClaw revient au mode de livraison normal pour les charges utiles restantes.

Utilisez l’aperçu de brouillon au lieu du streaming de texte natif Slack :

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Clés héritées :

- `channels.slack.streamMode` (`replace | status_final | append`) est migré automatiquement vers `channels.slack.streaming`.
- la valeur booléenne `channels.slack.streaming` est migrée automatiquement vers `channels.slack.nativeStreaming`.

## Repli par réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la retire lorsque l’exécution se termine. Cela est particulièrement utile en dehors des réponses dans un fil, qui utilisent un indicateur d’état par défaut « is typing... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est fournie en mode best-effort et son nettoyage est automatiquement tenté après la réponse ou après le chemin d’échec.

## Médias, segmentation et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent.

    La limite de taille entrante à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les segments de texte utilisent `channels.slack.textChunkLimit` (par défaut 4000)
    - `channels.slack.chunkMode="newline"` active un découpage prioritairement par paragraphes
    - les envois de fichiers utilisent les API d’upload Slack et peuvent inclure des réponses dans un fil (`thread_ts`)
    - la limite des médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média
  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les DM
    - `channel:<id>` pour les canaux

    Les DM Slack sont ouverts via les API de conversation Slack lors de l’envoi vers des cibles utilisateur.

  </Accordion>
</AccordionGroup>

## Commandes et comportement des commandes slash

- Le mode automatique des commandes natives est **désactivé** pour Slack (`commands.native: "auto"` n’active pas les commandes natives Slack).
- Activez les gestionnaires de commandes Slack natives avec `channels.slack.commands.native: true` (ou globalement `commands.native: true`).
- Lorsque les commandes natives sont activées, enregistrez les commandes slash correspondantes dans Slack (noms `/<command>`), avec une exception :
  - enregistrez `/agentstatus` pour la commande de statut (Slack réserve `/status`)
- Si les commandes natives ne sont pas activées, vous pouvez exécuter une seule commande slash configurée via `channels.slack.slashCommand`.
- Les menus d’arguments natifs adaptent désormais leur stratégie de rendu :
  - jusqu’à 5 options : blocs de boutons
  - de 6 à 100 options : menu select statique
  - plus de 100 options : select externe avec filtrage asynchrone des options lorsque les gestionnaires d’options d’interactivité sont disponibles
  - si les valeurs d’option encodées dépassent les limites de Slack, le flux revient aux boutons
- Pour les longues charges utiles d’options, les menus d’arguments de commandes slash utilisent une boîte de dialogue de confirmation avant d’envoyer une valeur sélectionnée.

Paramètres par défaut des commandes slash :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Les sessions slash utilisent des clés isolées :

- `agent:<agentId>:slack:slash:<userId>`

et continuent à router l’exécution de la commande vers la session de conversation cible (`CommandTargetSessionKey`).

## Réponses interactives

Slack peut afficher des contrôles de réponse interactive rédigés par l’agent, mais cette fonctionnalité est désactivée par défaut.

Activez-la globalement :

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou activez-la pour un seul compte Slack :

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Lorsqu’elle est activée, les agents peuvent émettre des directives de réponse réservées à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et les clics ou sélections sont renvoyés via le chemin d’événement d’interaction Slack existant.

Remarques :

- Il s’agit d’une interface spécifique à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit vers leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse texte d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations d’exécution dans Slack

Slack peut agir comme client d’approbation natif avec des boutons interactifs et des interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations d’exécution utilisent `channels.slack.execApprovals.*` pour le routage natif en DM/canal.
- Les approbations de plugin peuvent toujours être résolues via la même interface native de boutons Slack lorsque la demande arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation des approbateurs reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation sont affichées directement dans la conversation sous forme de boutons Block Kit.
Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations dans le chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque les approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que si vous souhaitez remplacer les approbateurs, ajouter des filtres ou
activer la livraison dans le chat d’origine :

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation d’exécution doivent aussi
être routées vers d’autres chats ou des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de plugin lorsque ces demandes arrivent déjà
dans Slack.

Le `/approve` dans le même chat fonctionne aussi dans les canaux et DM Slack qui prennent déjà en charge les commandes. Voir [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages et les diffusions de fil sont mappées vers des événements système.
- Les événements d’ajout/suppression de réaction sont mappés vers des événements système.
- Les événements d’entrée/sortie de membre, de création/renommage de canal et d’ajout/suppression d’épingle sont mappés vers des événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif du canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’amorce du créateur du fil et de l’historique initial du fil est filtrée par les listes d’autorisation d’expéditeur configurées, lorsque c’est applicable.
- Les actions de bloc et les interactions de modal émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements de modal `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Pointeurs vers la référence de configuration

Référence principale :

- [Référence de configuration - Slack](/fr/gateway/configuration-reference#slack)

  Champs Slack à fort signal :
  - mode/auth : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accès DM : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - bascule de compatibilité : `dangerouslyAllowNameMatching` (solution de dernier recours ; laissez désactivé sauf nécessité)
  - accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - exploitation/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation de canaux (`channels.slack.channels`)
    - `requireMention`
    - liste d’autorisation `users` par canal

    Commandes utiles :

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messages DM ignorés">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’hérité `channels.slack.dm.policy`)
    - approbations d’appairage / entrées de liste d’autorisation

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode socket ne se connecte pas">
    Validez les jetons bot + application et l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré mais l’exécution actuelle n’a pas pu résoudre la
    valeur soutenue par SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - signing secret
    - chemin webhook
    - URL de requête Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les
    instantanés de compte, le compte HTTP est configuré mais l’exécution actuelle n’a pas pu
    résoudre le signing secret soutenu par SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous souhaitiez :

    - le mode de commande native (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode à commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` et les listes d’autorisation de canaux/utilisateurs.

  </Accordion>
</AccordionGroup>

## Lié

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage](/fr/channels/troubleshooting)
- [Configuration](/fr/gateway/configuration)
- [Commandes slash](/fr/tools/slash-commands)
