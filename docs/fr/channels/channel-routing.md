---
read_when:
    - Modifier le routage des canaux ou le comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-04-24T06:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Canaux et routage

OpenClaw achemine les réponses **vers le canal d’où provient un message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ainsi que les canaux de Plugin. `webchat` est le canal interne de l’interface WebChat et n’est pas un canal sortant configurable.
- **AccountId** : instance de compte par canal (lorsque pris en charge).
- Compte par défaut de canal facultatif : `channels.<channel>.defaultAccount` choisit
  quel compte est utilisé lorsqu’un chemin sortant ne spécifie pas `accountId`.
  - Dans les configurations multi-comptes, définissez une valeur par défaut explicite (`defaultAccount` ou `accounts.default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de repli peut choisir le premier ID de compte normalisé.
- **AgentId** : un espace de travail + stockage de session isolés (« cerveau »).
- **SessionKey** : la clé de compartiment utilisée pour stocker le contexte et contrôler la concurrence.

## Formes de clés de session (exemples)

Par défaut, les messages directs sont regroupés dans la session **principale** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

Même lorsque l’historique de conversation des messages directs est partagé avec la session principale, le bac à sable et la politique d’outils utilisent une clé d’exécution dérivée par compte et par chat direct pour les messages directs externes, afin que les messages provenant des canaux ne soient pas traités comme des exécutions locales de la session principale.

Les groupes et canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salles : `agent:<agentId>:<channel>:channel:<id>`

Fils :

- Les fils Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé de groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de route principale des messages directs

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une seule session principale.
Pour empêcher que `lastRoute` de la session soit écrasé par des messages directs de non-propriétaires,
OpenClaw déduit un propriétaire épinglé à partir de `allowFrom` lorsque toutes les conditions suivantes sont vraies :

- `allowFrom` contient exactement une entrée sans caractère générique.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du message direct entrant ne correspond pas à ce propriétaire épinglé.

En cas de non-correspondance, OpenClaw enregistre tout de même les métadonnées de session entrantes, mais n’actualise pas `lastRoute` de la session principale.

## Règles de routage (comment un agent est choisi)

Le routage choisit **un agent** pour chaque message entrant :

1. **Correspondance exacte de pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance de pair parent** (héritage de fil).
3. **Correspondance serveur + rôles** (Discord) via `guildId` + `roles`.
4. **Correspondance de serveur** (Discord) via `guildId`.
5. **Correspondance d’équipe** (Slack) via `teamId`.
6. **Correspondance de compte** (`accountId` sur le canal).
7. **Correspondance de canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
8. **Agent par défaut** (`agents.list[].default`, sinon la première entrée de la liste, avec repli sur `main`).

Lorsqu’une liaison inclut plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine quel espace de travail et quel stockage de session sont utilisés.

## Groupes de diffusion (exécuter plusieurs agents)

Les groupes de diffusion permettent d’exécuter **plusieurs agents** pour le même pair **lorsque OpenClaw répondrait normalement** (par exemple : dans des groupes WhatsApp, après la logique de mention/activation).

Configuration :

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Voir : [Groupes de diffusion](/fr/channels/broadcast-groups).

## Aperçu de la configuration

- `agents.list` : définitions d’agents nommés (espace de travail, modèle, etc.).
- `bindings` : associe les canaux/comptes/pairs entrants à des agents.

Exemple :

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Stockage des sessions

Les stockages de session se trouvent sous le répertoire d’état (par défaut `~/.openclaw`) :

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Les transcriptions JSONL se trouvent à côté du stockage

Vous pouvez remplacer le chemin du stockage via `session.store` et le templating `{agentId}`.

La découverte des sessions Gateway et ACP analyse également les stockages d’agents sauvegardés sur disque sous la racine `agents/` par défaut et sous les racines `session.store` avec template. Les stockages découverts doivent rester dans cette racine d’agent résolue et utiliser un fichier `sessions.json` standard. Les liens symboliques et les chemins hors racine sont ignorés.

## Comportement de WebChat

WebChat se rattache à **l’agent sélectionné** et utilise par défaut la
session principale de l’agent. Pour cette raison, WebChat vous permet de voir le contexte inter-canal de cet agent à un seul endroit.

## Contexte de réponse

Les réponses entrantes incluent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsque disponibles.
- Le contexte cité est ajouté à `Body` sous la forme d’un bloc `[Replying to ...]`.

Cela est cohérent sur tous les canaux.

## Lié

- [Groupes](/fr/channels/groups)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Appairage](/fr/channels/pairing)
