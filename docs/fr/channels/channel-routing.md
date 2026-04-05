---
read_when:
    - Modifier le routage des canaux ou le comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-04-05T12:34:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# Channels & routing

OpenClaw achemine les réponses **vers le canal d’où provient un message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus les canaux d’extension. `webchat` est le canal interne de l’interface WebChat et n’est pas un canal sortant configurable.
- **AccountId** : instance de compte par canal (lorsque pris en charge).
- Compte par défaut facultatif du canal : `channels.<channel>.defaultAccount` choisit
  quel compte est utilisé lorsqu’un chemin sortant ne précise pas `accountId`.
  - Dans les configurations multi-comptes, définissez une valeur par défaut explicite (`defaultAccount` ou `accounts.default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de repli peut choisir le premier ID de compte normalisé.
- **AgentId** : un espace de travail + stockage de session isolés (« cerveau »).
- **SessionKey** : la clé de compartiment utilisée pour stocker le contexte et contrôler la concurrence.

## Formes de clé de session (exemples)

Les messages directs sont regroupés dans la session **principale** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

Les groupes et les canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salons : `agent:<agentId>:<channel>:channel:<id>`

Fils :

- Les fils Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé de groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de la route principale des messages directs

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une session principale.
Pour empêcher que `lastRoute` de la session soit écrasé par des messages directs de non-propriétaires,
OpenClaw déduit un propriétaire épinglé à partir de `allowFrom` lorsque toutes les conditions suivantes sont vraies :

- `allowFrom` contient exactement une entrée sans joker.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du message direct entrant ne correspond pas à ce propriétaire épinglé.

Dans ce cas de non-correspondance, OpenClaw enregistre toujours les métadonnées de session entrantes, mais
ignore la mise à jour de `lastRoute` pour la session principale.

## Règles de routage (comment un agent est choisi)

Le routage choisit **un agent** pour chaque message entrant :

1. **Correspondance exacte du pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance du pair parent** (héritage du fil).
3. **Correspondance serveur + rôles** (Discord) via `guildId` + `roles`.
4. **Correspondance du serveur** (Discord) via `guildId`.
5. **Correspondance de l’équipe** (Slack) via `teamId`.
6. **Correspondance du compte** (`accountId` sur le canal).
7. **Correspondance du canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
8. **Agent par défaut** (`agents.list[].default`, sinon la première entrée de la liste, avec repli sur `main`).

Lorsqu’une liaison inclut plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine quel espace de travail et quel stockage de session sont utilisés.

## Groupes de diffusion (exécuter plusieurs agents)

Les groupes de diffusion vous permettent d’exécuter **plusieurs agents** pour le même pair **lorsque OpenClaw répondrait normalement** (par exemple : dans les groupes WhatsApp, après le filtrage par mention/activation).

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

Voir : [Broadcast Groups](/channels/broadcast-groups).

## Vue d’ensemble de la configuration

- `agents.list` : définitions d’agents nommés (espace de travail, modèle, etc.).
- `bindings` : associe les canaux/comptes/pairs entrants aux agents.

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

Vous pouvez remplacer le chemin du stockage via `session.store` et la modélisation `{agentId}`.

La découverte des sessions Gateway et ACP analyse aussi les stockages d’agents sur disque sous la
racine `agents/` par défaut et sous les racines `session.store` modélisées. Les stockages découverts
doivent rester à l’intérieur de cette racine d’agent résolue et utiliser un fichier
`sessions.json` standard. Les liens symboliques et les chemins en dehors de la racine sont ignorés.

## Comportement de WebChat

WebChat se rattache à l’**agent sélectionné** et utilise par défaut la session principale
de l’agent. De ce fait, WebChat vous permet de voir le contexte inter-canaux de cet
agent en un seul endroit.

## Contexte de réponse

Les réponses entrantes incluent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsque disponibles.
- Le contexte cité est ajouté à `Body` sous la forme d’un bloc `[Replying to ...]`.

Ce comportement est cohérent sur tous les canaux.
