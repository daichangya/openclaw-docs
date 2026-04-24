---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Routage multi-agents : agents isolés, comptes de canal et liaisons'
title: Routage multi-agents
x-i18n:
    generated_at: "2026-04-24T07:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Exécutez plusieurs agents _isolated_ — chacun avec son propre espace de travail, répertoire d’état (`agentDir`) et historique de session — ainsi que plusieurs comptes de canal (par exemple deux WhatsApp) dans un seul Gateway en cours d’exécution. Les messages entrants sont routés vers le bon agent via des liaisons.

Un **agent** ici correspond à la portée complète par persona : fichiers d’espace de travail, profils d’authentification, registre de modèles et magasin de sessions. `agentDir` est le répertoire d’état sur disque qui contient cette configuration par agent dans `~/.openclaw/agents/<agentId>/`. Une **liaison** associe un compte de canal (par exemple un espace de travail Slack ou un numéro WhatsApp) à l’un de ces agents.

## Qu’est-ce qu’un « agent » ?

Un **agent** est un cerveau entièrement cloisonné avec ses propres éléments :

- **Espace de travail** (fichiers, AGENTS.md/SOUL.md/USER.md, notes locales, règles de persona).
- **Répertoire d’état** (`agentDir`) pour les profils d’authentification, le registre de modèles et la configuration par agent.
- **Magasin de sessions** (historique de chat + état de routage) sous `~/.openclaw/agents/<agentId>/sessions`.

Les profils d’authentification sont **par agent**. Chaque agent lit depuis son propre fichier :

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` est ici aussi le chemin de rappel inter-session le plus sûr : il renvoie
une vue bornée et nettoyée, et non un dump brut de transcription. Le rappel de l’assistant supprime
les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outil tronqués),
l’échafaudage d’appel d’outil dégradé, les jetons de contrôle de modèle ASCII/pleine largeur divulgués,
et le XML d’appel d’outil MiniMax mal formé avant la rédaction/troncature.

Les identifiants de l’agent principal ne sont **pas** partagés automatiquement. Ne réutilisez jamais `agentDir`
entre agents (cela provoque des collisions d’authentification/session). Si vous voulez partager des identifiants,
copiez `auth-profiles.json` dans le `agentDir` de l’autre agent.

Les Skills sont chargées depuis l’espace de travail de chaque agent ainsi que depuis des racines partagées comme
`~/.openclaw/skills`, puis filtrées par la liste d’autorisation effective des Skills de l’agent lorsqu’elle est
configurée. Utilisez `agents.defaults.skills` pour une base partagée et
`agents.list[].skills` pour un remplacement par agent. Voir
[Skills : par agent vs partagées](/fr/tools/skills#per-agent-vs-shared-skills) et
[Skills : listes d’autorisation de Skills d’agent](/fr/tools/skills#agent-skill-allowlists).

Gateway peut héberger **un agent** (par défaut) ou **plusieurs agents** côte à côte.

**Remarque sur l’espace de travail :** l’espace de travail de chaque agent est le **cwd par
défaut**, pas une sandbox stricte. Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent
atteindre d’autres emplacements de l’hôte sauf si l’isolation est activée. Voir
[Sandboxing](/fr/gateway/sandboxing).

## Chemins (carte rapide)

- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état : `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Espace de travail : `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Répertoire d’agent : `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessions : `~/.openclaw/agents/<agentId>/sessions`

### Mode agent unique (par défaut)

Si vous ne faites rien, OpenClaw exécute un seul agent :

- `agentId` vaut par défaut **`main`**.
- Les sessions sont clés comme `agent:main:<mainKey>`.
- L’espace de travail vaut par défaut `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini).
- L’état vaut par défaut `~/.openclaw/agents/main/agent`.

## Assistant agent

Utilisez l’assistant d’agent pour ajouter un nouvel agent isolé :

```bash
openclaw agents add work
```

Ajoutez ensuite des `bindings` (ou laissez l’assistant le faire) pour router les messages entrants.

Vérifiez avec :

```bash
openclaw agents list --bindings
```

## Démarrage rapide

<Steps>
  <Step title="Créer chaque espace de travail d’agent">

Utilisez l’assistant ou créez les espaces de travail manuellement :

```bash
openclaw agents add coding
openclaw agents add social
```

Chaque agent obtient son propre espace de travail avec `SOUL.md`, `AGENTS.md` et éventuellement `USER.md`, ainsi qu’un `agentDir` dédié et un magasin de sessions sous `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Créer des comptes de canal">

Créez un compte par agent sur vos canaux préférés :

- Discord : un bot par agent, activez Message Content Intent et copiez chaque jeton.
- Telegram : un bot par agent via BotFather, copiez chaque jeton.
- WhatsApp : liez chaque numéro de téléphone par compte.

```bash
openclaw channels login --channel whatsapp --account work
```

Voir les guides de canal : [Discord](/fr/channels/discord), [Telegram](/fr/channels/telegram), [WhatsApp](/fr/channels/whatsapp).

  </Step>

  <Step title="Ajouter des agents, des comptes et des liaisons">

Ajoutez les agents sous `agents.list`, les comptes de canal sous `channels.<channel>.accounts`, puis reliez-les avec `bindings` (exemples ci-dessous).

  </Step>

  <Step title="Redémarrer et vérifier">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Plusieurs agents = plusieurs personnes, plusieurs personnalités

Avec **plusieurs agents**, chaque `agentId` devient une **persona entièrement isolée** :

- **Différents numéros de téléphone/comptes** (par `accountId` de canal).
- **Différentes personnalités** (via des fichiers d’espace de travail par agent comme `AGENTS.md` et `SOUL.md`).
- **Authentification + sessions séparées** (pas de diaphonie sauf si elle est explicitement activée).

Cela permet à **plusieurs personnes** de partager un serveur Gateway tout en gardant leurs « cerveaux » IA et leurs données isolés.

## Recherche en mémoire QMD inter-agents

Si un agent doit rechercher dans les transcriptions de session QMD d’un autre agent, ajoutez
des collections supplémentaires sous `agents.list[].memorySearch.qmd.extraCollections`.
Utilisez `agents.defaults.memorySearch.qmd.extraCollections` uniquement lorsque tous les agents
doivent hériter des mêmes collections de transcription partagées.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Le chemin de collection supplémentaire peut être partagé entre agents, mais le nom de la collection
reste explicite lorsque le chemin est en dehors de l’espace de travail de l’agent. Les chemins à l’intérieur de l’espace de travail restent
dans la portée de l’agent afin que chaque agent conserve son propre ensemble de recherche de transcription.

## Un numéro WhatsApp, plusieurs personnes (répartition des messages privés)

Vous pouvez router **différents messages privés WhatsApp** vers différents agents tout en restant sur **un seul compte WhatsApp**. Faites la correspondance sur l’expéditeur E.164 (comme `+15551234567`) avec `peer.kind: "direct"`. Les réponses proviennent toujours du même numéro WhatsApp (pas d’identité d’expéditeur par agent).

Détail important : les discussions directes se regroupent dans la **clé de session principale** de l’agent, donc une véritable isolation nécessite **un agent par personne**.

Exemple :

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Remarques :

- Le contrôle d’accès aux messages privés est **global par compte WhatsApp** (appairage/liste d’autorisation), pas par agent.
- Pour les groupes partagés, liez le groupe à un agent ou utilisez les [groupes Broadcast](/fr/channels/broadcast-groups).

## Règles de routage (comment les messages choisissent un agent)

Les liaisons sont **déterministes** et **la plus spécifique l’emporte** :

1. correspondance `peer` (ID exact de message privé/groupe/canal)
2. correspondance `parentPeer` (héritage de fil)
3. `guildId + roles` (routage par rôle Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. correspondance `accountId` pour un canal
7. correspondance au niveau du canal (`accountId: "*"`)
8. repli vers l’agent par défaut (`agents.list[].default`, sinon première entrée de la liste, par défaut : `main`)

Si plusieurs liaisons correspondent dans le même niveau, la première dans l’ordre de configuration l’emporte.
Si une liaison définit plusieurs champs de correspondance (par exemple `peer` + `guildId`), tous les champs spécifiés sont requis (sémantique `AND`).

Détail important sur la portée du compte :

- Une liaison qui omet `accountId` ne correspond qu’au compte par défaut.
- Utilisez `accountId: "*"` pour un repli au niveau du canal sur tous les comptes.
- Si vous ajoutez plus tard la même liaison pour le même agent avec un identifiant de compte explicite, OpenClaw transforme la liaison existante uniquement au niveau du canal en liaison ciblée par compte au lieu de la dupliquer.

## Plusieurs comptes / numéros de téléphone

Les canaux qui prennent en charge **plusieurs comptes** (par exemple WhatsApp) utilisent `accountId` pour identifier
chaque connexion. Chaque `accountId` peut être routé vers un agent différent, afin qu’un seul serveur puisse héberger
plusieurs numéros de téléphone sans mélanger les sessions.

Si vous voulez un compte par défaut à l’échelle du canal lorsque `accountId` est omis, définissez
`channels.<channel>.defaultAccount` (facultatif). Lorsqu’il n’est pas défini, OpenClaw se rabat
sur `default` s’il est présent, sinon sur le premier identifiant de compte configuré (trié).

Les canaux courants qui prennent en charge ce modèle incluent :

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId` : un « cerveau » (espace de travail, authentification par agent, magasin de sessions par agent).
- `accountId` : une instance de compte de canal (par exemple compte WhatsApp `"personal"` vs `"biz"`).
- `binding` : route les messages entrants vers un `agentId` par `(channel, accountId, peer)` et éventuellement des identifiants de guilde/équipe.
- Les discussions directes se regroupent dans `agent:<agentId>:<mainKey>` (session « main » par agent ; `session.mainKey`).

## Exemples de plateforme

### Bots Discord par agent

Chaque compte de bot Discord correspond à un `accountId` unique. Reliez chaque compte à un agent et conservez des listes d’autorisation par bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Remarques :

- Invitez chaque bot dans la guilde et activez Message Content Intent.
- Les jetons résident dans `channels.discord.accounts.<id>.token` (le compte par défaut peut utiliser `DISCORD_BOT_TOKEN`).

### Bots Telegram par agent

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Remarques :

- Créez un bot par agent avec BotFather et copiez chaque jeton.
- Les jetons se trouvent dans `channels.telegram.accounts.<id>.botToken` (le compte par défaut peut utiliser `TELEGRAM_BOT_TOKEN`).

### Numéros WhatsApp par agent

Liez chaque compte avant de démarrer le Gateway :

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5) :

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Exemple : chat quotidien sur WhatsApp + travail approfondi sur Telegram

Répartition par canal : routez WhatsApp vers un agent rapide du quotidien et Telegram vers un agent Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Remarques :

- Si vous avez plusieurs comptes pour un canal, ajoutez `accountId` à la liaison (par exemple `{ channel: "whatsapp", accountId: "personal" }`).
- Pour router un seul message privé/groupe vers Opus tout en gardant le reste sur `chat`, ajoutez une liaison `match.peer` pour ce pair ; les correspondances de pair l’emportent toujours sur les règles à l’échelle du canal.

## Exemple : même canal, un pair vers Opus

Conservez WhatsApp sur l’agent rapide, mais routez un message privé vers Opus :

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Les liaisons de pair l’emportent toujours, gardez-les donc au-dessus de la règle à l’échelle du canal.

## Agent familial lié à un groupe WhatsApp

Liez un agent familial dédié à un seul groupe WhatsApp, avec filtrage par mention
et une politique d’outils plus stricte :

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Remarques :

- Les listes d’autorisation/interdiction d’outils sont des **outils**, pas des skills. Si une skill doit exécuter un
  binaire, assurez-vous que `exec` est autorisé et que le binaire existe dans la sandbox.
- Pour un filtrage plus strict, définissez `agents.list[].groupChat.mentionPatterns` et gardez
  les listes d’autorisation de groupe activées pour le canal.

## Configuration de la sandbox et des outils par agent

Chaque agent peut avoir ses propres restrictions de sandbox et d’outils :

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

Remarque : `setupCommand` se trouve sous `sandbox.docker` et s’exécute une seule fois lors de la création du conteneur.
Les remplacements `sandbox.docker.*` par agent sont ignorés lorsque la portée résolue est `"shared"`.

**Avantages :**

- **Isolation de sécurité** : restreindre les outils pour les agents non fiables
- **Contrôle des ressources** : isoler en sandbox certains agents tout en gardant les autres sur l’hôte
- **Politiques flexibles** : permissions différentes par agent

Remarque : `tools.elevated` est **global** et basé sur l’expéditeur ; il n’est pas configurable par agent.
Si vous avez besoin de limites par agent, utilisez `agents.list[].tools` pour interdire `exec`.
Pour le ciblage de groupe, utilisez `agents.list[].groupChat.mentionPatterns` afin que les @mentions correspondent clairement à l’agent visé.

Voir [Sandbox et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour des exemples détaillés.

## Voir aussi

- [Routage des canaux](/fr/channels/channel-routing) — comment les messages sont routés vers les agents
- [Sous-agents](/fr/tools/subagents) — lancer des exécutions d’agents en arrière-plan
- [ACP Agents](/fr/tools/acp-agents) — exécuter des harnais de codage externes
- [Présence](/fr/concepts/presence) — présence et disponibilité de l’agent
- [Session](/fr/concepts/session) — isolation et routage des sessions
