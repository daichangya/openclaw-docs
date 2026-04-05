---
read_when:
    - Modification du comportement des discussions de groupe ou du contrôle par mention
summary: Comportement des discussions de groupe sur toutes les surfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-04-05T12:35:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# Groupes

OpenClaw traite les discussions de groupe de manière cohérente sur toutes les surfaces : Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduction pour débutants (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’y a pas d’utilisateur bot WhatsApp distinct.
Si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`).
- Les réponses nécessitent une mention, sauf si vous désactivez explicitement le contrôle par mention.

En clair : les expéditeurs autorisés par liste d’autorisation peuvent déclencher OpenClaw en le mentionnant.

> TL;DR
>
> - **L’accès en DM** est contrôlé par `*.allowFrom`.
> - **L’accès aux groupes** est contrôlé par `*.groupPolicy` + les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
> - **Le déclenchement des réponses** est contrôlé par le contrôle par mention (`requireMention`, `/activation`).

Flux rapide (ce qui arrive à un message de groupe) :

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Visibilité du contexte et listes d’autorisation

Deux contrôles différents interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation spécifiques au canal).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse, citations, historique du fil, métadonnées de transfert).

Par défaut, OpenClaw privilégie un comportement de chat normal et conserve le contexte principalement tel qu’il a été reçu. Cela signifie que les listes d’autorisation déterminent principalement qui peut déclencher des actions, et non une limite universelle de masquage pour chaque extrait cité ou historique.

Le comportement actuel dépend du canal :

- Certains canaux appliquent déjà un filtrage fondé sur l’expéditeur pour le contexte supplémentaire dans certains chemins (par exemple, initialisation de fil Slack, recherches de réponse/fil Matrix).
- D’autres canaux transmettent encore le contexte de citation/réponse/transfert tel qu’il a été reçu.

Orientation de durcissement (prévue) :

- `contextVisibility: "all"` (par défaut) conserve le comportement actuel tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire pour ne garder que les expéditeurs autorisés.
- `contextVisibility: "allowlist_quote"` correspond à `allowlist` plus une exception explicite pour une citation/réponse.

Tant que ce modèle de durcissement n’est pas implémenté de façon cohérente sur tous les canaux, attendez-vous à des différences selon la surface.

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous voulez...

| Objectif                                     | Paramètre à définir                                     |
| -------------------------------------------- | ------------------------------------------------------- |
| Autoriser tous les groupes mais ne répondre qu’aux @mentions | `groups: { "*": { requireMention: true } }`             |
| Désactiver toutes les réponses en groupe     | `groupPolicy: "disabled"`                               |
| Autoriser seulement des groupes spécifiques  | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)    |
| Vous seul pouvez déclencher dans les groupes | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons/canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe afin que chaque sujet ait sa propre session.
- Les discussions directes utilisent la session principale (ou une session par expéditeur si configuré).
- Heartbeat est ignoré pour les sessions de groupe.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DMs personnels + groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond aux **DMs** et votre trafic « public » aux **groupes**.

Pourquoi : en mode agent unique, les DMs arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez le sandboxing avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans Docker tandis que votre session DM principale reste sur l’hôte.

Cela vous donne un seul « cerveau » d’agent (espace de travail + mémoire partagés), mais deux postures d’exécution :

- **DMs** : outils complets (hôte)
- **Groupes** : sandbox + outils restreints (Docker)

> Si vous avez besoin d’espaces de travail/personas réellement séparés (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent + des liaisons. Consultez [Multi-Agent Routing](/concepts/multi-agent).

Exemple (DMs sur l’hôte, groupes sandboxés + outils de messagerie uniquement) :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Vous voulez que « les groupes ne puissent voir que le dossier X » au lieu de « aucun accès à l’hôte » ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans le sandbox :

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

Lié :

- Clés de configuration et valeurs par défaut : [Configuration de la passerelle](/gateway/configuration-reference#agentsdefaultssandbox)
- Déboguer pourquoi un outil est bloqué : [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages bind : [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salons/canaux ; les discussions de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`).

## Politique de groupe

Contrôlez la manière dont les messages de groupe/salon sont traités par canal :

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Politique     | Comportement                                                 |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le contrôle par mention s’applique toujours. |
| `"disabled"`  | Bloque complètement tous les messages de groupe.             |
| `"allowlist"` | Autorise uniquement les groupes/salons qui correspondent à la liste d’autorisation configurée. |

Remarques :

- `groupPolicy` est distinct du contrôle par mention (qui nécessite des @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (repli : `allowFrom` explicite).
- Les approbations de pairage DM (entrées enregistrées `*-allowFrom`) s’appliquent uniquement à l’accès DM ; l’autorisation des expéditeurs de groupe reste explicitement liée aux listes d’autorisation de groupe.
- Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
- Slack : la liste d’autorisation utilise `channels.slack.channels`.
- Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Préférez les ID de salon ou les alias ; la recherche par nom de salon rejoint est en mode meilleur effort, et les noms non résolus sont ignorés à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation `users` par salon sont également prises en charge.
- Les DMs de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La liste d’autorisation Telegram peut correspondre à des ID utilisateur (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou à des noms d’utilisateur (`"@alice"` ou `"alice"`) ; les préfixes sont insensibles à la casse.
- La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupe est vide, les messages de groupe sont bloqués.
- Sécurité à l’exécution : lorsqu’un bloc de fournisseur est complètement absent (`channels.<provider>` absent), la politique de groupe revient à un mode fail-closed (généralement `allowlist`) au lieu d’hériter de `channels.defaults.groupPolicy`.

Modèle mental rapide (ordre d’évaluation pour les messages de groupe) :

1. `groupPolicy` (open/disabled/allowlist)
2. listes d’autorisation de groupe (`*.groups`, `*.groupAllowFrom`, liste d’autorisation spécifique au canal)
3. contrôle par mention (`requireMention`, `/activation`)

## Contrôle par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement par groupe. Les valeurs par défaut existent par sous-système dans `*.groups."*"`.

Répondre à un message de bot compte comme une mention implicite (lorsque le canal prend en charge les métadonnées de réponse). Cela s’applique à Telegram, WhatsApp, Slack, Discord et Microsoft Teams.

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
- Le contrôle par mention n’est appliqué que lorsque la détection de mention est possible (mentions natives ou `mentionPatterns` configurés).
- Les valeurs par défaut Discord se trouvent dans `channels.discord.guilds."*"` (remplaçables par serveur/canal).
- Le contexte de l’historique de groupe est encapsulé uniformément sur tous les canaux et n’est **en attente uniquement** que pour les messages ignorés à cause du contrôle par mention ; utilisez `messages.groupChat.historyLimit` pour la valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver.

## Restrictions d’outils de groupe/canal (facultatif)

Certaines configurations de canal permettent de restreindre les outils disponibles **dans un groupe/salon/canal spécifique**.

- `tools` : autoriser/refuser des outils pour l’ensemble du groupe.
- `toolsBySender` : remplacements par expéditeur à l’intérieur du groupe.
  Utilisez des préfixes de clé explicites :
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le joker `"*"`.
  Les clés héritées sans préfixe sont toujours acceptées et sont mises en correspondance uniquement comme `id:`.

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

- Les restrictions d’outils de groupe/canal s’appliquent en plus de la politique d’outils globale/de l’agent (un refus reste prioritaire).
- Certains canaux utilisent une imbrication différente pour les salons/canaux (par ex., Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listes d’autorisation de groupe

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés agissent comme une liste d’autorisation de groupe. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement de mention par défaut.

Confusion fréquente : l’approbation de pairage DM n’est pas la même chose que l’autorisation de groupe.
Pour les canaux qui prennent en charge le pairage DM, le magasin de pairage déverrouille uniquement les DMs. Les commandes de groupe nécessitent toujours une autorisation explicite des expéditeurs de groupe à partir des listes d’autorisation de configuration telles que `groupAllowFrom` ou du mécanisme de repli de configuration documenté pour ce canal.

Intentions courantes (copier/coller) :

1. Désactiver toutes les réponses de groupe

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Autoriser seulement des groupes spécifiques (WhatsApp)

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

Les propriétaires de groupe peuvent activer ou désactiver le mode d’activation par groupe :

- `/activation mention`
- `/activation always`

Le propriétaire est déterminé par `channels.whatsapp.allowFrom` (ou par le propre E.164 du bot s’il n’est pas défini). Envoyez la commande sous forme de message autonome. Les autres surfaces ignorent actuellement `/activation`.

## Champs de contexte

Les charges utiles entrantes de groupe définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connu)
- `WasMentioned` (résultat du contrôle par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

Remarques spécifiques au canal :

- BlueBubbles peut éventuellement enrichir les participants sans nom des groupes macOS à partir de la base de données locale Contacts avant de renseigner `GroupMembers`. Cette fonctionnalité est désactivée par défaut et ne s’exécute qu’après le passage normal du contrôle de groupe.

L’invite système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe. Elle rappelle au modèle de répondre comme un humain, d’éviter les tableaux Markdown et d’éviter de taper des séquences littérales `\n`.

## Spécificités iMessage

- Préférez `chat_id:<id>` lors du routage ou de la mise en liste d’autorisation.
- Lister les discussions : `imsg chats --limit 20`.
- Les réponses de groupe reviennent toujours au même `chat_id`.

## Spécificités WhatsApp

Consultez [Messages de groupe](/channels/group-messages) pour le comportement propre à WhatsApp (injection de l’historique, détails de gestion des mentions).
