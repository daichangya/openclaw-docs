---
read_when:
    - Modifier le comportement des discussions de groupe ou le déclenchement par mention
summary: Comportement des discussions de groupe selon les surfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-04-24T07:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw traite les discussions de groupe de manière cohérente sur les différentes surfaces : Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduction pour débutants (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’y a pas d’utilisateur bot WhatsApp distinct.
Si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`).
- Les réponses nécessitent une mention, sauf si vous désactivez explicitement ce déclenchement par mention.

En pratique : les expéditeurs autorisés par liste blanche peuvent déclencher OpenClaw en le mentionnant.

> TL;DR
>
> - L’accès aux **DM** est contrôlé par `*.allowFrom`.
> - L’accès aux **groupes** est contrôlé par `*.groupPolicy` + les listes blanches (`*.groups`, `*.groupAllowFrom`).
> - Le **déclenchement des réponses** est contrôlé par le déclenchement par mention (`requireMention`, `/activation`).

Flux rapide (ce qui arrive à un message de groupe) :

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Visibilité du contexte et listes blanches

Deux contrôles différents interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes blanches spécifiques au canal).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse, citations, historique du fil, métadonnées de transfert).

Par défaut, OpenClaw privilégie un comportement de chat normal et conserve le contexte en grande partie tel qu’il a été reçu. Cela signifie que les listes blanches déterminent principalement qui peut déclencher des actions, et non une limite universelle de caviardage pour chaque extrait cité ou historique.

Le comportement actuel dépend du canal :

- Certains canaux appliquent déjà un filtrage basé sur l’expéditeur pour le contexte supplémentaire dans certains chemins spécifiques (par exemple l’amorçage de fil Slack, les recherches de réponses/fils Matrix).
- D’autres canaux transmettent encore le contexte de citation/réponse/transfert tel qu’il a été reçu.

Orientation du durcissement (prévue) :

- `contextVisibility: "all"` (par défaut) conserve le comportement actuel tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire aux expéditeurs autorisés par liste blanche.
- `contextVisibility: "allowlist_quote"` correspond à `allowlist` plus une exception explicite pour une citation/réponse.

Tant que ce modèle de durcissement n’est pas implémenté de manière cohérente sur tous les canaux, attendez-vous à des différences selon la surface.

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous voulez...

| Objectif                                     | Réglage à définir                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Autoriser tous les groupes mais ne répondre qu’aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses dans les groupes | `groupPolicy: "disabled"`                                  |
| Uniquement des groupes spécifiques           | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)       |
| Vous seul pouvez déclencher dans les groupes | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salles/canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe afin que chaque sujet ait sa propre session.
- Les discussions directes utilisent la session principale (ou une session par expéditeur si configuré).
- Les Heartbeat sont ignorés pour les sessions de groupe.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DM personnels + groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond aux **DM** et votre trafic « public » aux **groupes**.

Pourquoi : en mode agent unique, les DM aboutissent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez le sandboxing avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le backend de sandbox configuré tandis que votre session DM principale reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas un.

Cela vous donne un seul « cerveau » d’agent (espace de travail + mémoire partagés), mais deux postures d’exécution :

- **DM** : outils complets (hôte)
- **Groupes** : sandbox + outils restreints

> Si vous avez besoin d’espaces de travail/personas réellement séparés (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent + des bindings. Voir [Routage multi-agent](/fr/concepts/multi-agent).

Exemple (DM sur l’hôte, groupes sandboxés + outils de messagerie uniquement) :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // les groupes/canaux sont non-principaux -> sandboxés
        scope: "session", // isolation la plus forte (un conteneur par groupe/canal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Si allow n'est pas vide, tout le reste est bloqué (deny reste prioritaire).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Vous voulez que « les groupes ne puissent voir que le dossier X » au lieu de « aucun accès hôte » ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans le sandbox :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Liens utiles :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Déboguer pourquoi un outil est bloqué : [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des bind mounts : [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés d’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salles/canaux ; les discussions de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`).

## Politique de groupe

Contrôlez comment les messages de groupe/salle sont traités par canal :

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // identifiant utilisateur Telegram numérique (l’assistant peut résoudre @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Politique     | Comportement                                                 |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Les groupes contournent les listes blanches ; le déclenchement par mention s’applique toujours. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.              |
| `"allowlist"` | Autorise uniquement les groupes/salles qui correspondent à la liste blanche configurée. |

Remarques :

- `groupPolicy` est distinct du déclenchement par mention (qui exige des @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (repli : `allowFrom` explicite).
- Les approbations d’appairage DM (entrées du stockage `*-allowFrom`) s’appliquent uniquement à l’accès DM ; l’autorisation des expéditeurs de groupes reste explicitement liée aux listes blanches de groupes.
- Discord : la liste blanche utilise `channels.discord.guilds.<id>.channels`.
- Slack : la liste blanche utilise `channels.slack.channels`.
- Matrix : la liste blanche utilise `channels.matrix.groups`. Préférez les ID de salle ou les alias ; la résolution des noms de salles rejointes se fait au mieux, et les noms non résolus sont ignorés à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; des listes blanches `users` par salle sont également prises en charge.
- Les DM de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La liste blanche Telegram peut correspondre à des ID d’utilisateurs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou à des noms d’utilisateur (`"@alice"` ou `"alice"`) ; les préfixes sont insensibles à la casse.
- La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste blanche de groupes est vide, les messages de groupe sont bloqués.
- Sécurité à l’exécution : lorsqu’un bloc de fournisseur est complètement absent (`channels.<provider>` absent), la politique de groupe revient à un mode de sécurité par défaut fermée (généralement `allowlist`) au lieu d’hériter de `channels.defaults.groupPolicy`.

Modèle mental rapide (ordre d’évaluation des messages de groupe) :

1. `groupPolicy` (open/disabled/allowlist)
2. listes blanches de groupes (`*.groups`, `*.groupAllowFrom`, liste blanche spécifique au canal)
3. déclenchement par mention (`requireMention`, `/activation`)

## Déclenchement par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement par groupe. Les valeurs par défaut sont définies par sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal
prend en charge les métadonnées de réponse. Citer un message du bot peut aussi compter comme une mention implicite sur les canaux qui exposent des métadonnées de citation. Les cas intégrés actuels incluent Telegram, WhatsApp, Slack, Discord, Microsoft Teams et ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Remarques :

- `mentionPatterns` sont des motifs regex sûrs insensibles à la casse ; les motifs invalides et les formes non sûres de répétition imbriquée sont ignorés.
- Les surfaces qui fournissent des mentions explicites continuent de fonctionner ; les motifs servent de repli.
- Remplacement par agent : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe).
- Le déclenchement par mention n’est appliqué que lorsque la détection de mention est possible (mentions natives ou `mentionPatterns` configurés).
- Les valeurs par défaut de Discord se trouvent dans `channels.discord.guilds."*"` (remplaçables par serveur/canal).
- Le contexte de l’historique de groupe est encapsulé uniformément sur tous les canaux et est **pending-only** (messages ignorés en raison du déclenchement par mention) ; utilisez `messages.groupChat.historyLimit` pour la valeur par défaut globale et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver.

## Restrictions d’outils pour groupe/canal (facultatif)

Certaines configurations de canal permettent de restreindre quels outils sont disponibles **dans un groupe/une salle/un canal spécifique**.

- `tools` : autoriser/refuser des outils pour l’ensemble du groupe.
- `toolsBySender` : remplacements par expéditeur au sein du groupe.
  Utilisez des préfixes de clé explicites :
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le caractère générique `"*"`.
  Les anciennes clés sans préfixe sont toujours acceptées et sont mises en correspondance comme `id:` uniquement.

Ordre de résolution (le plus spécifique l’emporte) :

1. correspondance `toolsBySender` du groupe/canal
2. `tools` du groupe/canal
3. correspondance `toolsBySender` par défaut (`"*"`)
4. `tools` par défaut (`"*"`)

Exemple (Telegram) :

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Remarques :

- Les restrictions d’outils pour groupe/canal s’appliquent en plus de la politique globale/par agent des outils (un refus reste prioritaire).
- Certains canaux utilisent une imbrication différente pour les salles/canaux (par ex. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listes blanches de groupes

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés agissent comme une liste blanche de groupes. Utilisez `"*"` pour autoriser tous les groupes tout en définissant quand même le comportement de mention par défaut.

Confusion fréquente : l’approbation d’appairage DM n’est pas la même chose que l’autorisation de groupe.
Pour les canaux qui prennent en charge l’appairage DM, le stockage d’appairage déverrouille uniquement les DM. Les commandes de groupe exigent toujours une autorisation explicite de l’expéditeur du groupe à partir des listes blanches de configuration comme `groupAllowFrom` ou du mécanisme de repli de configuration documenté pour ce canal.

Intentions courantes (copier/coller) :

1. Désactiver toutes les réponses de groupe

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Autoriser uniquement des groupes spécifiques (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Autoriser tous les groupes mais exiger une mention (explicite)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Seul le propriétaire peut déclencher dans les groupes (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (propriétaire uniquement)

Les propriétaires de groupes peuvent basculer l’activation par groupe :

- `/activation mention`
- `/activation always`

Le propriétaire est déterminé par `channels.whatsapp.allowFrom` (ou par l’E.164 du bot lui-même si non défini). Envoyez la commande comme message autonome. Les autres surfaces ignorent actuellement `/activation`.

## Champs de contexte

Les charges utiles entrantes de groupe définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connu)
- `WasMentioned` (résultat du déclenchement par mention)
- Les sujets de forum Telegram incluent aussi `MessageThreadId` et `IsForum`.

Remarques spécifiques au canal :

- BlueBubbles peut enrichir facultativement les participants sans nom des groupes macOS à partir de la base de données locale Contacts avant de renseigner `GroupMembers`. Cette fonction est désactivée par défaut et ne s’exécute qu’après le passage normal de la logique de filtrage de groupe.

Le prompt système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe. Elle rappelle au modèle de répondre comme un humain, d’éviter les tableaux Markdown, de limiter les lignes vides et de suivre un espacement normal de chat, et d’éviter de taper des séquences littérales `\n`. Les noms de groupes et les libellés de participants provenant du canal sont rendus comme des métadonnées non fiables délimitées par des fences, et non comme des instructions système en ligne.

## Spécificités iMessage

- Préférez `chat_id:<id>` lors du routage ou de la mise en liste blanche.
- Lister les discussions : `imsg chats --limit 20`.
- Les réponses de groupe reviennent toujours au même `chat_id`.

## Prompts système WhatsApp

Voir [WhatsApp](/fr/channels/whatsapp#system-prompts) pour les règles canoniques des prompts système WhatsApp, y compris la résolution des prompts de groupe et directs, le comportement des jokers et la sémantique des remplacements par compte.

## Spécificités WhatsApp

Voir [Messages de groupe](/fr/channels/group-messages) pour le comportement propre à WhatsApp (injection d’historique, détails de gestion des mentions).

## Lié

- [Messages de groupe](/fr/channels/group-messages)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Appairage](/fr/channels/pairing)
