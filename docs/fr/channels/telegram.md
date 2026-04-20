---
read_when:
    - Travail sur les fonctionnalités Telegram ou les Webhooks
summary: Statut de prise en charge du bot Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-04-20T07:05:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API Bot)

Statut : prêt pour la production pour les DM de bot + groupes via grammY. Le long polling est le mode par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage du canal" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration de Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles complets de configuration des canaux et exemples.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que le pseudonyme est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la politique DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Repli via variable d’environnement : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’environnement, puis démarrez Gateway.

  </Step>

  <Step title="Démarrer Gateway et approuver le premier DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’appairage expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` pour qu’ils correspondent à votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution du jeton tient compte du compte. En pratique, les valeurs de config priment sur le repli via l’environnement, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité dans les groupes">
    Les bots Telegram sont en **mode confidentialité** par défaut, ce qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages du groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, ou
    - faire du bot un administrateur du groupe.

    Lors d’un changement du mode confidentialité, retirez puis rajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Permissions du groupe">
    Le statut d’administrateur est contrôlé dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages du groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/interdire l’ajout à des groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.telegram.dmPolicy` contrôle l’accès par message direct :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` accepte des ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les DM et est rejeté par la validation de configuration.
    La configuration demande uniquement des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux allowlist (par exemple lorsque `dmPolicy: "allowlist"` n’a encore aucun ID explicite).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques explicites dans `allowFrom` afin de conserver une politique d’accès durable dans la configuration (au lieu de dépendre d’approbations d’appairage précédentes).

    Confusion fréquente : l’approbation de l’appairage DM ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde un accès DM uniquement. L’autorisation des expéditeurs dans les groupes provient toujours de listes d’autorisation explicites dans la configuration.
    Si vous voulez « je suis autorisé une fois et les DM ainsi que les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom`.

    ### Trouver votre ID utilisateur Telegram

    Plus sûr (sans bot tiers) :

    1. Envoyez un DM à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle de l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - aucune configuration `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme une liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour filtrer les expéditeurs dans les groupes. S’il n’est pas défini, Telegram se rabat sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs doivent être placés sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’autorisation des expéditeurs dans les groupes n’hérite **pas** des approbations du magasin d’appairage DM.
    L’appairage reste réservé aux DM. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se rabat sur `allowFrom` de la configuration, et non sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, les valeurs d’exécution se replient par défaut sur `groupPolicy="allowlist"` en mode fermé, sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Exemple : autoriser n’importe quel membre dans un groupe spécifique :

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Exemple : autoriser uniquement des utilisateurs spécifiques dans un groupe spécifique :

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Erreur fréquente : `groupAllowFrom` n’est pas une liste d’autorisation de groupes Telegram.

      - Placez les ID négatifs de groupes ou de supergroupes Telegram comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter quelles personnes dans un groupe autorisé peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.
    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses dans les groupes nécessitent une mention par défaut.

    La mention peut provenir de :

    - une mention native `@botusername`, ou
    - des motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Options de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Celles-ci mettent à jour uniquement l’état de la session. Utilisez la configuration pour la persistance.

    Exemple de configuration persistante :

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Obtenir l’ID du chat de groupe :

    - transférez un message du groupe à `@userinfobot` / `@getidsbot`
    - ou lisez `chat.id` dans `openclaw logs --follow`
    - ou inspectez `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram est géré par le processus Gateway.
- Le routage est déterministe : les réponses entrantes depuis Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec métadonnées de réponse et espaces réservés pour les médias.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour garder les sujets isolés.
- Les messages DM peuvent transporter `message_thread_id` ; OpenClaw les route avec des clés de session tenant compte des fils et préserve l’ID de fil pour les réponses.
- Le long polling utilise grammY runner avec séquencement par chat/par fil. La concurrence globale du sink du runner utilise `agents.defaults.maxConcurrent`.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` est mappé vers `partial` sur Telegram (compatibilité avec la dénomination inter-canaux)
    - les anciennes valeurs booléennes `channels.telegram.streamMode` et `streaming` sont automatiquement mappées

    Pour les réponses texte uniquement :

    - DM : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)
    - groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)

    Pour les réponses complexes (par exemple les charges utiles média), OpenClaw se rabat sur une livraison finale normale puis nettoie le message d’aperçu.

    Le flux d’aperçu est distinct du flux par blocs. Lorsque le flux par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu pour éviter un double flux.

    Si le transport de brouillon natif est indisponible/rejeté, OpenClaw se rabat automatiquement sur `sendMessage` + `editMessageText`.

    Flux de raisonnement propre à Telegram :

    - `/reasoning stream` envoie le raisonnement vers l’aperçu en direct pendant la génération
    - la réponse finale est envoyée sans le texte de raisonnement

  </Accordion>

  <Accordion title="Mise en forme et repli HTML">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML sûr pour Telegram.
    - Le HTML brut du modèle est échappé pour réduire les échecs d’analyse Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    L’enregistrement du menu de commandes Telegram est géré au démarrage avec `setMyCommands`.

    Valeurs par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajouter des entrées personnalisées au menu de commandes :

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Sauvegarde Git" },
        { command: "generate", description: "Créer une image" },
      ],
    },
  },
}
```

    Règles :

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et journalisés

    Remarques :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement de comportement
    - les commandes de Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent tout de même s’enregistrer si elles sont configurées.

    Échecs de configuration fréquents :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram débordait encore après réduction ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’appairage d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’app iOS
    3. `/pair pending` liste les demandes en attente (y compris le rôle/les scopes)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage de courte durée. Le transfert d’amorçage intégré conserve le jeton du Node principal avec `scopes: []` ; tout jeton opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de scope d’amorçage sont préfixées par le rôle ; cette liste d’autorisation opérateur ne satisfait donc que les demandes opérateur ; les rôles non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/scopes/clé publique), la demande en attente précédente est remplacée et la nouvelle demande utilise un `requestId` différent. Relancez `/pair pending` avant d’approuver.

    Plus de détails : [Appairage](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons en ligne">
    Configurez la portée du clavier en ligne :

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Remplacement par compte :

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Portées :

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (par défaut)

    L’ancien `capabilities: ["inlineButtons"]` est mappé vers `inlineButtons: "all"`.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choisissez une option :",
  buttons: [
    [
      { text: "Oui", callback_data: "yes" },
      { text: "Non", callback_data: "no" },
    ],
    [{ text: "Annuler", callback_data: "cancel" }],
  ],
}
```

    Les clics sur les callbacks sont transmis à l’agent sous forme de texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram incluent :

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` facultatifs)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` facultatifs)

    Les actions de message du canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de limitation :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (désactivé par défaut)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` séparées.
    Les envois à l’exécution utilisent l’instantané actif de config/secrets (démarrage/rechargement), donc les chemins d’action n’effectuent pas de rerésolution ad hoc de `SecretRef` à chaque envoi.

    Sémantique de suppression de réaction : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge les balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et indicateurs de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.

    **Routage d’agent par sujet** : chaque sujet peut router vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa propre mémoire et sa propre session. Exemple :

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Sujet général → agent principal
                "3": { agentId: "zu" },        // Sujet dev → agent zu
                "5": { agentId: "coder" }      // Revue de code → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Chaque sujet a alors sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler des sessions de harness ACP via des liaisons ACP typées de niveau supérieur :

    - `bindings[]` avec `type: "acp"` et `match.channel: "telegram"`

    Exemple :

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Cela est actuellement limité aux sujets de forum dans les groupes et supergroupes.

    **Lancement ACP lié au fil depuis le chat** :

    - `/acp spawn <agent> --thread here|auto` peut lier le sujet Telegram actuel à une nouvelle session ACP.
    - Les messages suivants du sujet sont routés directement vers la session ACP liée (pas de `/acp steer` requis).
    - OpenClaw épingle le message de confirmation de lancement dans le sujet après une liaison réussie.
    - Nécessite `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Le contexte de template inclut :

    - `MessageThreadId`
    - `IsForum`

    Comportement des fils en DM :

    - les chats privés avec `message_thread_id` conservent le routage DM mais utilisent des clés de session et des cibles de réponse tenant compte des fils.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi comme note vocale

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Messages vidéo

    Telegram distingue les fichiers vidéo des notes vidéo.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Les notes vidéo ne prennent pas en charge les légendes ; le texte de message fourni est envoyé séparément.

    ### Stickers

    Gestion des stickers entrants :

    - WEBP statique : téléchargé et traité (espace réservé `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte de sticker :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des stickers :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les stickers sont décrits une fois (quand c’est possible) puis mis en cache pour réduire les appels de vision répétés.

    Activer les actions de sticker :

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Action d’envoi de sticker :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher dans les stickers en cache :

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "chat qui fait signe",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifications de réaction">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (séparées des payloads de message).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système tels que :

    - `Réaction Telegram ajoutée : 👍 par Alice (@alice) sur le msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    Remarques :

    - `own` signifie uniquement les réactions utilisateur sur les messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas les ID de fil dans les mises à jour de réaction.
      - les groupes non forum sont routés vers la session de chat de groupe
      - les groupes forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour polling/Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli vers l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Telegram attend un emoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de config depuis les événements et commandes Telegram">
    Les écritures de configuration du canal sont activées par défaut (`configWrites !== false`).

    Les écritures déclenchées par Telegram incluent :

    - les événements de migration de groupe (`migrate_to_chat_id`) pour mettre à jour `channels.telegram.groups`
    - `/config set` et `/config unset` (nécessite l’activation des commandes)

    Désactiver :

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs Webhook">
    Par défaut : long polling.

    Mode Webhook :

    - définissez `channels.telegram.webhookUrl`
    - définissez `channels.telegram.webhookSecret` (obligatoire lorsque l’URL Webhook est définie)
    - `channels.telegram.webhookPath` facultatif (par défaut `/telegram-webhook`)
    - `channels.telegram.webhookHost` facultatif (par défaut `127.0.0.1`)
    - `channels.telegram.webhookPort` facultatif (par défaut `8787`)

    L’écouteur local par défaut pour le mode Webhook se lie à `127.0.0.1:8787`.

    Si votre point de terminaison public est différent, placez un proxy inverse devant et pointez `webhookUrl` vers l’URL publique.
    Définissez `webhookHost` (par exemple `0.0.0.0`) lorsque vous avez intentionnellement besoin d’une entrée externe.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - la valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (100 par défaut) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (si non défini, la valeur par défaut de grammY s’applique).
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (50 par défaut) ; `0` désactive.
    - le contexte supplémentaire de réponse/citation/transfert est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et non une limite complète de masquage du contexte supplémentaire.
    - contrôles d’historique DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuration `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs récupérables de l’API sortante.

    La cible d’envoi CLI peut être un ID de chat numérique ou un nom d’utilisateur :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Les sondages Telegram utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Indicateurs de sondage propres à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend aussi en charge :

    - `--buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--force-document` pour envoyer les images et GIF sortants comme documents au lieu d’uploads photo compressés ou média animé

    Limitation des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les sondages
    - `channels.telegram.actions.poll=false` désactive la création de sondages Telegram tout en laissant les envois classiques activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut éventuellement publier les invites d’approbation dans le chat ou le sujet d’origine.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (facultatif ; se rabat sur les ID propriétaires numériques déduits de `allowFrom` et du `defaultTo` direct lorsque c’est possible)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, `dm` par défaut)
    - `agentFilter`, `sessionFilter`

    Les approbateurs doivent être des ID utilisateur Telegram numériques. Telegram active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis la configuration propriétaire numérique du compte (`allowFrom` et `defaultTo` en message direct). Définissez `enabled: false` pour désactiver explicitement Telegram comme client d’approbation natif. Les demandes d’approbation se rabattent sinon sur les autres routes d’approbation configurées ou sur la politique de repli des approbations exec.

    Telegram affiche aussi les boutons d’approbation partagés utilisés par les autres canaux de chat. L’adaptateur Telegram natif ajoute principalement le routage DM des approbateurs, la diffusion vers le canal/sujet et les indications de saisie avant livraison.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie.

    Règles de livraison :

    - `target: "dm"` envoie les invites d’approbation uniquement aux DM des approbateurs résolus
    - `target: "channel"` renvoie l’invite vers le chat/sujet Telegram d’origine
    - `target: "both"` envoie aux DM des approbateurs et au chat/sujet d’origine

    Seuls les approbateurs résolus peuvent approuver ou refuser. Les non-approbateurs ne peuvent pas utiliser `/approve` ni les boutons d’approbation Telegram.

    Comportement de résolution des approbations :

    - les ID préfixés par `plugin:` sont toujours résolus via les approbations du Plugin.
    - les autres ID essaient d’abord `exec.approval.resolve`.
    - si Telegram est aussi autorisé pour les approbations du Plugin et que la Gateway indique
      que l’approbation exec est inconnue/expirée, Telegram réessaie une fois via
      `plugin.approval.resolve`.
    - les refus/erreurs réels d’approbation exec ne basculent pas silencieusement vers la
      résolution d’approbation du Plugin.

    La livraison dans le canal affiche le texte de la commande dans le chat ; n’activez donc `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw préserve le sujet à la fois pour l’invite d’approbation et pour le suivi post-approbation. Les approbations exec expirent au bout de 30 minutes par défaut.

    Les boutons d’approbation en ligne dépendent aussi du fait que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`).

    Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte d’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envoie un message d’erreur convivial dans le chat. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Temps minimal entre les réponses d’erreur vers le même chat. Empêche le spam d’erreurs pendant les pannes.        |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que pour les autres clés de configuration Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // supprime les erreurs dans ce groupe
        },
      },
    },
  },
}
```

## Dépannage

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages de groupe sans mention">

    - Si `requireMention=false`, le mode confidentialité Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Disable
      - puis retirez + rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier des ID de groupe numériques explicites ; le joker `"*"` ne peut pas être vérifié pour l’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit pas du tout les messages de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - consultez les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez l’identité de votre expéditeur (appairage et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - `setMyCommands failed` avec des erreurs réseau/fetch indique généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types `AbortSignal` ne correspondent pas.
    - Certains hôtes résolvent `api.telegram.org` d’abord en IPv6 ; une sortie IPv6 défaillante peut provoquer des pannes intermittentes de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces cas comme des erreurs réseau récupérables.
    - Sur des hôtes VPS avec sortie directe/TLS instable, routez les appels API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2) et `dnsResultOrder=ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si une fausse IP de confiance ou un
      proxy transparent réécrit `api.telegram.org` vers une autre
      adresse privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement propre à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même option d’activation existe aussi par compte dans
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes média Telegram en `198.18.x.x`, laissez d’abord
      cette option dangereuse désactivée. Les médias Telegram autorisent déjà par défaut
      la plage de benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF
      des médias Telegram. Utilisez-le uniquement dans des environnements proxy de confiance contrôlés par l’opérateur
      tels que le routage fake-IP de Clash, Mihomo ou Surge lorsqu’ils synthétisent des réponses
      privées ou à usage spécial en dehors de la plage de benchmark RFC 2544.
      Laissez-le désactivé pour un accès Telegram normal sur l’internet public.
    </Warning>

    - Remplacements via variables d’environnement (temporaires) :
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valider les réponses DNS :

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Plus d’aide : [Dépannage du canal](/fr/channels/troubleshooting).

## Pointeurs vers la référence de configuration Telegram

Référence principale :

- `channels.telegram.enabled` : activer/désactiver le démarrage du canal.
- `channels.telegram.botToken` : jeton du bot (BotFather).
- `channels.telegram.tokenFile` : lire le jeton depuis un chemin de fichier ordinaire. Les liens symboliques sont rejetés.
- `channels.telegram.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.telegram.allowFrom` : liste d’autorisation DM (ID utilisateur Telegram numériques). `allowlist` nécessite au moins un ID d’expéditeur. `open` nécessite `"*"`. `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en ID et peut récupérer des entrées d’allowlist depuis des fichiers du magasin d’appairage dans les flux de migration allowlist.
- `channels.telegram.actions.poll` : activer ou désactiver la création de sondages Telegram (activé par défaut ; nécessite toujours `sendMessage`).
- `channels.telegram.defaultTo` : cible Telegram par défaut utilisée par le CLI `--deliver` lorsqu’aucun `--reply-to` explicite n’est fourni.
- `channels.telegram.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.telegram.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe (ID utilisateur Telegram numériques). `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en ID. Les entrées non numériques sont ignorées au moment de l’authentification. L’authentification de groupe n’utilise pas le repli du magasin d’appairage DM (`2026.2.25+`).
- Priorité multi-comptes :
  - Lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour expliciter le routage par défaut.
  - Si aucun des deux n’est défini, OpenClaw se rabat sur le premier ID de compte normalisé et `openclaw doctor` affiche un avertissement.
  - `channels.telegram.accounts.default.allowFrom` et `channels.telegram.accounts.default.groupAllowFrom` s’appliquent uniquement au compte `default`.
  - Les comptes nommés héritent de `channels.telegram.allowFrom` et `channels.telegram.groupAllowFrom` lorsque les valeurs au niveau du compte ne sont pas définies.
  - Les comptes nommés n’héritent pas de `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups` : valeurs par défaut par groupe + allowlist (utilisez `"*"` pour les valeurs par défaut globales).
  - `channels.telegram.groups.<id>.groupPolicy` : remplacement par groupe pour groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention` : valeur par défaut du filtrage par mention.
  - `channels.telegram.groups.<id>.skills` : filtre de Skills (omis = toutes les Skills, vide = aucune).
  - `channels.telegram.groups.<id>.allowFrom` : remplacement par groupe de la liste d’autorisation des expéditeurs.
  - `channels.telegram.groups.<id>.systemPrompt` : prompt système supplémentaire pour le groupe.
  - `channels.telegram.groups.<id>.enabled` : désactive le groupe lorsqu’il vaut `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*` : remplacements par sujet (champs de groupe + `agentId` propre au sujet).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId` : route ce sujet vers un agent spécifique (remplace le routage au niveau du groupe et des bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy` : remplacement par sujet pour groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention` : remplacement par sujet du filtrage par mention.
- `bindings[]` de niveau supérieur avec `type: "acp"` et ID de sujet canonique `chatId:topic:topicId` dans `match.peer.id` : champs de liaison persistante de sujet ACP (voir [Agents ACP](/fr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId` : route les sujets DM vers un agent spécifique (même comportement que les sujets de forum).
- `channels.telegram.execApprovals.enabled` : active Telegram comme client d’approbation exec basé sur le chat pour ce compte.
- `channels.telegram.execApprovals.approvers` : ID utilisateur Telegram autorisés à approuver ou refuser des demandes exec. Facultatif lorsque `channels.telegram.allowFrom` ou un `channels.telegram.defaultTo` direct identifie déjà le propriétaire.
- `channels.telegram.execApprovals.target` : `dm | channel | both` (par défaut : `dm`). `channel` et `both` préservent le sujet Telegram d’origine lorsqu’il est présent.
- `channels.telegram.execApprovals.agentFilter` : filtre facultatif d’ID d’agent pour les invites d’approbation transférées.
- `channels.telegram.execApprovals.sessionFilter` : filtre facultatif de clé de session (sous-chaîne ou regex) pour les invites d’approbation transférées.
- `channels.telegram.accounts.<account>.execApprovals` : remplacement par compte pour le routage des approbations exec Telegram et l’autorisation des approbateurs.
- `channels.telegram.capabilities.inlineButtons` : `off | dm | group | all | allowlist` (par défaut : allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons` : remplacement par compte.
- `channels.telegram.commands.nativeSkills` : activer/désactiver les commandes natives Skills de Telegram.
- `channels.telegram.replyToMode` : `off | first | all` (par défaut : `off`).
- `channels.telegram.textChunkLimit` : taille de fragment sortant (caractères).
- `channels.telegram.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.telegram.linkPreview` : active/désactive les aperçus de liens pour les messages sortants (par défaut : true).
- `channels.telegram.streaming` : `off | partial | block | progress` (aperçu du flux en direct ; par défaut : `partial` ; `progress` est mappé vers `partial` ; `block` est la compatibilité avec l’ancien mode d’aperçu). Le flux d’aperçu Telegram utilise un unique message d’aperçu modifié sur place.
- `channels.telegram.mediaMaxMb` : limite de médias Telegram entrants/sortants (Mo, 100 par défaut).
- `channels.telegram.retry` : politique de nouvelle tentative pour les helpers d’envoi Telegram (CLI/outils/actions) sur les erreurs récupérables de l’API sortante (tentatives, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily` : remplace Node autoSelectFamily (true=activer, false=désactiver). Activé par défaut sur Node 22+, avec WSL2 désactivé par défaut.
- `channels.telegram.network.dnsResultOrder` : remplace l’ordre de résultat DNS (`ipv4first` ou `verbatim`). `ipv4first` par défaut sur Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork` : option dangereuse pour les environnements de fake-IP ou de proxy transparent de confiance où les téléchargements de médias Telegram résolvent `api.telegram.org` vers des adresses privées/internes/à usage spécial en dehors de l’autorisation par défaut de la plage de benchmark RFC 2544.
- `channels.telegram.proxy` : URL de proxy pour les appels API Bot (SOCKS/HTTP).
- `channels.telegram.webhookUrl` : active le mode Webhook (nécessite `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret` : secret Webhook (obligatoire lorsque webhookUrl est défini).
- `channels.telegram.webhookPath` : chemin Webhook local (par défaut `/telegram-webhook`).
- `channels.telegram.webhookHost` : hôte de liaison Webhook local (par défaut `127.0.0.1`).
- `channels.telegram.webhookPort` : port de liaison Webhook local (par défaut `8787`).
- `channels.telegram.actions.reactions` : limite les réactions des outils Telegram.
- `channels.telegram.actions.sendMessage` : limite les envois de messages des outils Telegram.
- `channels.telegram.actions.deleteMessage` : limite les suppressions de messages des outils Telegram.
- `channels.telegram.actions.sticker` : limite les actions de sticker Telegram — envoi et recherche (par défaut : false).
- `channels.telegram.reactionNotifications` : `off | own | all` — contrôle quelles réactions déclenchent des événements système (par défaut : `own` lorsqu’il n’est pas défini).
- `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` — contrôle la capacité de réaction de l’agent (par défaut : `minimal` lorsqu’il n’est pas défini).
- `channels.telegram.errorPolicy` : `reply | silent` — contrôle le comportement des réponses d’erreur (par défaut : `reply`). Remplacements par compte/groupe/sujet pris en charge.
- `channels.telegram.errorCooldownMs` : nombre minimal de ms entre les réponses d’erreur vers le même chat (par défaut : `60000`). Empêche le spam d’erreurs pendant les pannes.

- [Référence de configuration - Telegram](/fr/gateway/configuration-reference#telegram)

Champs Telegram spécifiques à fort signal :

- démarrage/auth : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de niveau supérieur (`type: "acp"`)
- approbations exec : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`
- streaming : `streaming` (aperçu), `blockStreaming`
- formatage/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- média/réseau : `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Associé

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
