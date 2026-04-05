---
read_when:
    - Configuration de Slack ou débogage du mode socket/HTTP de Slack
summary: Configuration Slack et comportement à l’exécution (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T12:37:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Statut : prêt pour la production pour les DMs + canaux via des intégrations d’application Slack. Le mode par défaut est Socket Mode ; le mode HTTP Events API est également pris en charge.

<CardGroup cols={3}>
  <Card title="Pairage" icon="link" href="/channels/pairing">
    Les DMs Slack utilisent le mode de pairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/channels/troubleshooting">
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

        Repli env (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="S’abonner aux événements de l’application">
        Abonnez les événements bot pour :

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Activez également l’onglet **Messages Tab** d’App Home pour les DMs.
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
        - définissez l’URL de requête de Event Subscriptions + Interactivity + Slash command sur le même chemin de webhook (par défaut `/slack/events`)

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

      <Step title="Utiliser des chemins de webhook uniques pour le mode HTTP multicomptes">
        Le mode HTTP par compte est pris en charge.

        Attribuez à chaque compte un `webhookPath` distinct afin que les enregistrements n’entrent pas en collision.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist du manifeste et des portées

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

  <Accordion title="Portées optionnelles du jeton utilisateur (opérations de lecture)">
    Si vous configurez `channels.slack.userToken`, les portées de lecture typiques sont :

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
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en clair ou des objets SecretRef.
- Les jetons de configuration remplacent le repli env.
- Le repli env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable dans la configuration (pas de repli env) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).
- Facultatif : ajoutez `chat:write.customize` si vous souhaitez que les messages sortants utilisent l’identité active de l’agent (champ `username` et icône personnalisés). `icon_emoji` utilise la syntaxe `:emoji_name:`.

Comportement de l’instantané de statut :

- L’inspection de compte Slack suit des champs `*Source` et `*Status` par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Le statut vaut `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef ou une autre source secrète non inline, mais que le chemin de commande/runtime actuel n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton bot reste prioritaire ; les écritures via jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton bot n’est pas disponible.
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

Les actions actuelles sur les messages Slack incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique DM">
    `channels.slack.dmPolicy` contrôle l’accès DM (hérité : `channels.slack.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"` ; hérité : `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicateurs DM :

    - `dm.enabled` (par défaut true)
    - `channels.slack.allowFrom` (préféré)
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (par défaut false pour les DMs de groupe)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multicomptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Le pairage dans les DMs utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique des canaux">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et doit utiliser des ID de canal stables.

    Remarque runtime : si `channels.slack` est complètement absent (configuration uniquement par env), le runtime revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation des canaux et des DMs sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées non résolues par nom de canal sont conservées telles que configurées mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage de canal sont par défaut basés sur l’ID ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions et utilisateurs des canaux">
    Les messages de canal sont contrôlés par mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse à un fil du bot

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format des clés `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou joker `"*"`
      (les clés héritées sans préfixe continuent d’être mappées uniquement à `id:`)

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les DMs sont routés comme `direct` ; les canaux comme `channel` ; les MPIMs comme `group`.
- Avec la valeur par défaut `session.dmScope=main`, les DMs Slack se replient sur la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans un fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) lorsque c’est applicable.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle le nombre de messages existants du fil récupérés lorsqu’une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).

Contrôles de fil de réponse :

- `channels.slack.replyToMode`: `off|first|all` (par défaut `off`)
- `channels.slack.replyToModeByChatType`: par `direct|group|channel`
- repli hérité pour les discussions directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Remarque : `replyToMode="off"` désactive **tout** le fil de réponse dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours respectées en mode `"off"`. Cette différence reflète les modèles de fil des plateformes : les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles dans le flux principal de discussion.

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

- `off` : désactiver le streaming d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par blocs.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.

`channels.slack.nativeStreaming` contrôle le streaming de texte natif Slack lorsque `streaming` vaut `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que le streaming de texte natif apparaisse. La sélection du fil suit toujours `replyToMode`. Sans cela, l’aperçu de brouillon normal est utilisé.
- Les médias et charges utiles non textuelles reviennent à la livraison normale.
- Si le streaming échoue en cours de réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu du streaming de texte natif Slack :

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
- le booléen `channels.slack.streaming` est migré automatiquement vers `channels.slack.nativeStreaming`.

## Repli par réaction de frappe

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime à la fin de l’exécution. C’est surtout utile en dehors des réponses dans un fil, qui utilisent un indicateur par défaut « est en train d’écrire... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est envoyée en meilleur effort et le nettoyage est tenté automatiquement une fois la réponse ou le chemin d’échec terminé.

## Médias, découpage et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requêtes authentifiées par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent.

    La limite de taille entrante du runtime est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les blocs de texte utilisent `channels.slack.textChunkLimit` (par défaut 4000)
    - `channels.slack.chunkMode="newline"` active le découpage prioritaire par paragraphes
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses dans un fil (`thread_ts`)
    - la limite de médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média
  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les DMs
    - `channel:<id>` pour les canaux

    Les DMs Slack sont ouverts via les API de conversation Slack lors de l’envoi vers des cibles utilisateur.

  </Accordion>
</AccordionGroup>

## Commandes et comportement slash

- Le mode automatique des commandes natives est **désactivé** pour Slack (`commands.native: "auto"` n’active pas les commandes natives Slack).
- Activez les gestionnaires de commandes Slack natives avec `channels.slack.commands.native: true` (ou globalement `commands.native: true`).
- Lorsque les commandes natives sont activées, enregistrez les commandes slash correspondantes dans Slack (noms `/<command>`), avec une exception :
  - enregistrez `/agentstatus` pour la commande de statut (Slack réserve `/status`)
- Si les commandes natives ne sont pas activées, vous pouvez exécuter une seule commande slash configurée via `channels.slack.slashCommand`.
- Les menus d’arguments natifs adaptent désormais leur stratégie de rendu :
  - jusqu’à 5 options : blocs de boutons
  - de 6 à 100 options : menu de sélection statique
  - plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque les gestionnaires d’options d’interactivité sont disponibles
  - si les valeurs d’option encodées dépassent les limites Slack, le flux revient aux boutons
- Pour les longues charges utiles d’option, les menus d’arguments des commandes slash utilisent une boîte de dialogue de confirmation avant d’envoyer une valeur sélectionnée.

Paramètres par défaut des commandes slash :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Les sessions slash utilisent des clés isolées :

- `agent:<agentId>:slack:slash:<userId>`

et continuent de router l’exécution de la commande vers la session de conversation cible (`CommandTargetSessionKey`).

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

Lorsqu’elle est activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et routent les clics ou sélections via le chemin existant des événements d’interaction Slack.

Remarques :

- Il s’agit d’une interface spécifique à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit vers leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse texte d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations exec dans Slack

Slack peut agir comme client d’approbation natif avec boutons interactifs et interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations exec utilisent `channels.slack.execApprovals.*` pour le routage DM/canal natif.
- Les approbations de plugin peuvent toujours être résolues via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation des approbateurs reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie possible.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; repli vers `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations exec Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que si vous souhaitez remplacer les approbateurs, ajouter des filtres ou activer la livraison vers le chat d’origine :

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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation exec doivent aussi être routées vers d’autres chats ou des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de plugin lorsque ces demandes arrivent déjà dans Slack.

Le `/approve` dans le même chat fonctionne également dans les canaux et DMs Slack qui prennent déjà en charge les commandes. Consultez [Exec approvals](/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages et diffusions de fils sont mappées vers des événements système.
- Les événements d’ajout/suppression de réactions sont mappés vers des événements système.
- Les événements d’arrivée/départ de membres, de création/renommage de canal et d’ajout/suppression d’épingles sont mappés vers des événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectifs de canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- Le message de départ d’un fil et l’initialisation du contexte d’historique de fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsque cela s’applique.
- Les actions de bloc et interactions modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Pointeurs de référence de configuration

Référence principale :

- [Référence de configuration - Slack](/gateway/configuration-reference#slack)

  Champs Slack à fort signal :
  - mode/auth : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accès DM : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - bascule de compatibilité : `dangerouslyAllowNameMatching` (à n’utiliser qu’en dernier recours ; laissez désactivé sauf nécessité)
  - accès canal : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation des canaux (`channels.slack.channels`)
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
    - approbations de pairage / entrées de liste d’autorisation

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode socket ne se connecte pas">
    Validez les jetons bot + app et l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré mais le runtime actuel n’a pas pu résoudre la valeur
    adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - signing secret
    - chemin du webhook
    - URLs de requête Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les
    instantanés de compte, le compte HTTP est configuré mais le runtime
    actuel n’a pas pu résoudre le signing secret adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous vouliez :

    - le mode de commandes natives (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` et les listes d’autorisation canal/utilisateur.

  </Accordion>
</AccordionGroup>

## Lié

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
