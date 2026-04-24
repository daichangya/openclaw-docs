---
read_when:
    - Exécuter des harnais de codage via ACP
    - Configurer des sessions ACP liées à des conversations sur les canaux de messagerie
    - Lier une conversation d’un canal de messagerie à une session ACP persistante
    - Déboguer le backend ACP et le câblage du Plugin ACP
    - Déboguer la livraison de complétion ACP ou les boucles agent-à-agent
    - Exécuter des commandes `/acp` depuis le chat
summary: Utiliser des sessions d’exécution ACP pour Claude Code, Cursor, Gemini CLI, le repli ACP Codex explicite, OpenClaw ACP et d’autres agents de harnais
title: ACP Agents
x-i18n:
    generated_at: "2026-04-24T07:34:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permet à OpenClaw d’exécuter des harnais de codage externes (par exemple Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnais ACPX pris en charge) via un Plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel de lier ou de contrôler Codex dans la conversation courante, OpenClaw doit utiliser le Plugin natif du serveur d’application Codex (`/codex bind`, `/codex threads`, `/codex resume`). Si vous demandez `/acp`, ACP, acpx, ou une session enfant Codex en arrière-plan, OpenClaw peut toujours router Codex via ACP. Chaque création de session ACP est suivie comme une [tâche d’arrière-plan](/fr/automation/tasks).

Si vous demandez à OpenClaw en langage naturel de « démarrer Claude Code dans un fil » ou d’utiliser un autre harnais externe, OpenClaw doit router cette requête vers l’exécution ACP (et non vers l’exécution native de sous-agent).

Si vous voulez que Codex ou Claude Code se connectent comme client MCP externe directement
à des conversations de canal OpenClaw existantes, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) au lieu d’ACP.

## Quelle page me faut-il ?

Il existe trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                                  | Utiliser ceci                         | Remarques                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lier ou contrôler Codex dans la conversation courante                                           | `/codex bind`, `/codex threads`       | Chemin natif du serveur d’application Codex ; inclut les réponses de chat liées, le transfert d’images, modèle/rapide/autorisations, arrêt et contrôles d’orientation. ACP est un repli explicite |
| Exécuter Claude Code, Gemini CLI, un ACP Codex explicite, ou un autre harnais externe _via_ OpenClaw | Cette page : ACP Agents               | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d’arrière-plan, contrôles d’exécution                                      |
| Exposer une session Gateway OpenClaw _comme_ serveur ACP pour un éditeur ou un client          | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                               |
| Réutiliser une CLI IA locale comme modèle de secours texte uniquement                          | [CLI Backends](/fr/gateway/cli-backends) | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas d’exécution de harnais                                                                               |

## Est-ce que cela fonctionne immédiatement ?

Généralement, oui. Les nouvelles installations sont livrées avec le Plugin d’exécution groupé `acpx` activé par défaut, avec un binaire `acpx` épinglé local au Plugin qu’OpenClaw sonde et auto-répare au démarrage. Exécutez `/acp doctor` pour une vérification de préparation.

Pièges du premier lancement :

- Les adaptateurs de harnais cibles (Codex, Claude, etc.) peuvent être récupérés à la demande avec `npx` la première fois que vous les utilisez.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
- Si l’hôte n’a ni npm ni accès réseau, la première récupération des adaptateurs échoue jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

## Runbook opérateur

Flux rapide `/acp` depuis le chat :

1. **Créer** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, ou explicitement `/acp spawn codex --bind here`
2. **Travailler** dans la conversation ou le fil lié (ou cibler explicitement la clé de session).
3. **Vérifier l’état** — `/acp status`
4. **Ajuster** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Orienter** sans remplacer le contexte — `/acp steer tighten logging and continue`
6. **Arrêter** — `/acp cancel` (tour courant) ou `/acp close` (session + liaisons)

Déclencheurs en langage naturel qui doivent être routés vers le Plugin natif Codex :

- « Bind this Discord channel to Codex. »
- « Attach this chat to Codex thread `<id>`. »
- « Show Codex threads, then bind this one. »

La liaison native de conversation Codex est le chemin de contrôle de chat par défaut, mais elle est volontairement prudente pour les flux interactifs d’approbation/outils Codex : les outils dynamiques OpenClaw et les invites d’approbation ne sont pas encore exposés via ce chemin de chat lié, donc ces requêtes sont refusées avec une explication claire. Utilisez le chemin du harnais Codex ou le repli ACP explicite lorsque le flux de travail dépend des outils dynamiques OpenClaw ou d’approbations interactives longue durée.

Déclencheurs en langage naturel qui doivent être routés vers l’exécution ACP :

- « Run this as a one-shot Claude Code ACP session and summarize the result. »
- « Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread. »
- « Run Codex through ACP in a background thread. »

OpenClaw choisit `runtime: "acp"`, résout le `agentId` du harnais, lie la conversation ou le fil courant lorsqu’il est pris en charge, et route les suivis vers cette session jusqu’à fermeture/expiration. Codex ne suit ce chemin que lorsque ACP est explicite ou lorsque l’exécution d’arrière-plan demandée nécessite encore ACP.

## ACP versus sous-agents

Utilisez ACP lorsque vous voulez une exécution de harnais externe. Utilisez le serveur d’application natif Codex pour la liaison/commande de conversation Codex. Utilisez les sous-agents lorsque vous voulez des exécutions déléguées natives OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ----------------------------------- |
| Exécution     | Plugin backend ACP (par exemple acpx) | Exécution native OpenClaw de sous-agent |
| Clé de session| `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Commandes principales | `/acp ...`                    | `/subagents ...`                    |
| Outil de création | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (exécution par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. Plugin d’exécution groupé `acpx`
3. Adaptateur ACP Claude
4. Mécanismes d’exécution/session côté Claude

Distinction importante :

- ACP Claude est une session de harnais avec contrôles ACP, reprise de session, suivi de tâche d’arrière-plan et liaison facultative de conversation/fil.
- Les CLI backends sont des exécutions de secours locales séparées en texte uniquement. Voir [CLI Backends](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- vous voulez `/acp spawn`, des sessions liables, des contrôles d’exécution ou un travail de harnais persistant : utilisez ACP
- vous voulez un simple secours texte local via la CLI brute : utilisez les CLI backends

## Sessions liées

### Liaisons à la conversation courante

`/acp spawn <harness> --bind here` épingle la conversation courante à la session ACP créée — pas de fil enfant, même surface de chat. OpenClaw continue de posséder transport, authentification, sécurité et livraison ; les messages de suivi dans cette conversation sont routés vers la même session ; `/new` et `/reset` réinitialisent la session sur place ; `/acp close` supprime la liaison.

Modèle mental :

- **surface de chat** — là où les personnes continuent à parler (canal Discord, sujet Telegram, chat iMessage).
- **session ACP** — l’état d’exécution durable Codex/Claude/Gemini vers lequel OpenClaw route.
- **fil/sujet enfant** — surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **espace de travail d’exécution** — l’emplacement du système de fichiers (`cwd`, extraction de dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

Exemples :

- `/codex bind` — garder ce chat, créer ou attacher le serveur d’application natif Codex, router les futurs messages ici.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajuster le fil natif Codex lié depuis le chat.
- `/codex stop` ou `/codex steer focus on the failing tests first` — contrôler le tour actif natif Codex.
- `/acp spawn codex --bind here` — repli ACP explicite pour Codex.
- `/acp spawn codex --thread auto` — OpenClaw peut créer un fil/sujet enfant et s’y lier.
- `/acp spawn codex --bind here --cwd /workspace/repo` — même liaison de chat, Codex s’exécute dans `/workspace/repo`.

Remarques :

- `--bind here` et `--thread ...` sont mutuellement exclusifs.
- `--bind here` ne fonctionne que sur les canaux qui annoncent la liaison à la conversation courante ; sinon OpenClaw renvoie un message clair d’absence de prise en charge. Les liaisons persistent entre les redémarrages du gateway.
- Sur Discord, `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer un fil enfant pour `--thread auto|here` — pas pour `--bind here`.
- Si vous créez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) reviennent au défaut du backend ; les autres erreurs d’accès (par ex. `EACCES`) apparaissent comme erreurs de création.

### Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des fils :

- OpenClaw lie un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont routés vers la session ACP liée.
- La sortie ACP est renvoyée dans ce même fil.
- Une désactivation de focus/fermeture/archivage/délai d’inactivité ou expiration d’âge max supprime la liaison.

La prise en charge des liaisons de fil est spécifique à l’adaptateur. Si l’adaptateur de canal actif ne prend pas en charge les liaisons de fil, OpenClaw renvoie un message clair d’absence d’implémentation/disponibilité.

Indicateurs de fonctionnalité requis pour l’ACP lié à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre le dispatch ACP)
- indicateur de création ACP de l’adaptateur de canal activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal qui expose une capacité de liaison session/fil.
- Prise en charge intégrée actuelle :
  - fils/canaux Discord
  - sujets Telegram (sujets de forum dans les groupes/supergroupes et sujets DM)
- Les Plugins de canal peuvent ajouter la prise en charge via la même interface de liaison.

## Paramètres spécifiques au canal

Pour les flux de travail non éphémères, configurez des liaisons ACP persistantes dans les entrées de niveau supérieur `bindings[]`.

### Modèle de liaison

- `bindings[].type="acp"` marque une liaison persistante de conversation ACP.
- `bindings[].match` identifie la conversation cible :
  - canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - sujet de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
  - chat DM/groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Préférez `chat_id:*` pour des liaisons de groupe stables.
- `bindings[].agentId` est l’identifiant d’agent OpenClaw propriétaire.
- Les remplacements ACP facultatifs se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs d’exécution par défaut par agent

Utilisez `agents.list[].runtime` pour définir les valeurs ACP par défaut une fois par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant de harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Ordre de priorité des remplacements pour les sessions ACP liées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs ACP globales par défaut (par exemple `acp.backend`)

Exemple :

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
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportement :

- OpenClaw s’assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont routés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d’exécution temporaires (par exemple créées par des flux de focus de fil) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les créations ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les échecs d’accès sur des chemins existants apparaissent comme erreurs de création.

## Démarrer des sessions ACP (interfaces)

### Depuis `sessions_spawn`

Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour d’agent ou un appel d’outil.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Remarques :

- `runtime` vaut par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` exige `thread: true` pour conserver une conversation persistante liée.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : identifiant du harnais ACP cible. Revient à `acp.defaultAgent` s’il est défini.
- `thread` (facultatif, par défaut `false`) : demander un flux de liaison à un fil lorsque pris en charge.
- `mode` (facultatif) : `run` (one-shot) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut choisir un comportement persistant par défaut selon le chemin d’exécution
  - `mode: "session"` exige `thread: true`
- `cwd` (facultatif) : répertoire de travail demandé pour l’exécution (validé par la politique backend/runtime). S’il est omis, la création ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux défauts du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : étiquette visible par l’opérateur utilisée dans le texte de session/bannière.
- `resumeSessionId` (facultatif) : reprendre une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue l’historique de sa conversation via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` transmet les résumés de progression de l’exécution ACP initiale à la session demandeuse sous forme d’événements système.
  - Quand disponible, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL borné à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour l’historique complet du relais.
- `model` (facultatif) : remplacement explicite du modèle pour la session enfant ACP. Pris en compte pour `runtime: "acp"` afin que l’enfant utilise le modèle demandé au lieu de revenir silencieusement au modèle par défaut de l’agent cible.

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit du travail d’arrière-plan appartenant au parent. Le chemin de livraison dépend de cette forme.

### Sessions ACP interactives

Les sessions interactives sont destinées à continuer à parler sur une surface de chat visible :

- `/acp spawn ... --bind here` lie la conversation courante à la session ACP.
- `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
- Les `bindings[].type="acp"` persistants configurés routent les conversations correspondantes vers la même session ACP.

Les messages de suivi dans la conversation liée sont routés directement vers la session ACP, et la sortie ACP est renvoyée vers ce même canal/fil/sujet.

### Sessions ACP one-shot appartenant au parent

Les sessions ACP one-shot créées par l’exécution d’un autre agent sont des enfants d’arrière-plan, similaires aux sous-agents :

- Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
- L’enfant s’exécute dans sa propre session de harnais ACP.
- La complétion remonte par le chemin interne d’annonce de fin de tâche.
- Le parent réécrit le résultat de l’enfant dans une voix d’assistant normale lorsqu’une réponse destinée à l’utilisateur est utile.

Ne traitez pas ce chemin comme un chat pair-à-pair entre parent et enfant. L’enfant dispose déjà d’un canal de complétion vers le parent.

### `sessions_send` et livraison A2A

`sessions_send` peut cibler une autre session après la création. Pour les sessions homologues normales, OpenClaw utilise un chemin de suivi agent-à-agent (A2A) après avoir injecté le message :

- attendre la réponse de la session cible
- éventuellement laisser le demandeur et la cible échanger un nombre borné de tours de suivi
- demander à la cible de produire un message d’annonce
- livrer cette annonce dans le canal ou fil visible

Ce chemin A2A est un repli pour les envois vers des pairs lorsque l’expéditeur a besoin d’un suivi visible. Il reste activé lorsqu’une session sans lien direct peut voir et envoyer un message à une cible ACP, par exemple avec des paramètres `tools.sessions.visibility` larges.

OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de son propre enfant ACP one-shot lui appartenant. Dans ce cas, exécuter A2A en plus de la complétion de tâche peut réveiller le parent avec le résultat de l’enfant, renvoyer la réponse du parent dans l’enfant et créer une boucle d’écho parent/enfant. Le résultat de `sessions_send` indique `delivery.status="skipped"` pour ce cas d’enfant possédé, car le chemin de complétion est déjà responsable du résultat.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu d’en démarrer une nouvelle. L’agent rejoue l’historique de sa conversation via `session/load`, ce qui lui permet de reprendre avec tout le contexte antérieur.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage courants :

- Transférer une session Codex de votre ordinateur portable vers votre téléphone — dites à votre agent de reprendre là où vous vous êtes arrêté
- Continuer une session de codage que vous avez démarrée de manière interactive dans la CLI, maintenant en mode headless via votre agent
- Reprendre un travail interrompu par un redémarrage du gateway ou un délai d’inactivité

Remarques :

- `resumeSessionId` exige `runtime: "acp"` — renvoie une erreur s’il est utilisé avec l’exécution de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le prennent en charge).
- Si l’identifiant de session est introuvable, la création échoue avec une erreur claire — aucun repli silencieux vers une nouvelle session.

<Accordion title="Test de fumée après déploiement">

Après un déploiement du gateway, effectuez une vérification end-to-end en réel plutôt que de faire confiance aux tests unitaires :

1. Vérifiez la version et le commit du gateway déployé sur l’hôte cible.
2. Ouvrez une session de pont ACPX temporaire vers un agent réel.
3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Vérifiez `accepted=yes`, une vraie `childSessionKey`, et aucune erreur de validateur.
5. Nettoyez la session de pont temporaire.

Gardez le contrôle sur `mode: "run"` et ignorez `streamTo: "parent"` — les chemins `mode: "session"` liés à un fil et de relais de flux sont des passes d’intégration séparées plus riches.

</Accordion>

## Compatibilité avec le sandbox

Les sessions ACP s’exécutent actuellement sur l’exécution hôte, pas à l’intérieur du sandbox OpenClaw.

Limites actuelles :

- Si la session demandeuse est dans le sandbox, les créations ACP sont bloquées pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par sandbox.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat lorsque nécessaire.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Indicateurs clés :

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Voir [Commandes slash](/fr/tools/slash-commands).

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`, `session-id`, ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d’abord la clé
   - puis l’identifiant de session en forme d’UUID
   - puis l’étiquette
2. Liaison du fil courant (si cette conversation/ce fil est lié à une session ACP)
3. Repli sur la session demandeuse courante

Les liaisons à la conversation courante et les liaisons de fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes de liaison à la création

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                               |
| ------ | -------------------------------------------------------------------------- |
| `here` | Lie sur place la conversation active courante ; échoue si aucune n’est active. |
| `off`  | Ne crée pas de liaison à la conversation courante.                         |

Remarques :

- `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou chat un espace piloté par Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de la liaison à la conversation courante.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil à la création

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
| `here` | Exige le fil actif courant ; échoue si vous n’êtes pas dans un fil.                                   |
| `off`  | Aucune liaison. La session démarre non liée.                                                           |

Remarques :

- Sur les surfaces sans liaison de fil, le comportement par défaut est effectivement `off`.
- La création liée à un fil exige la prise en charge par la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation courante sans créer de fil enfant.

## Contrôles ACP

| Commande             | Ce qu’elle fait                                           | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison courante ou liaison à un fil en option. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction d’orientation à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et supprime les liaisons de cibles de fil. | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options d’exécution et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode d’exécution pour la session cible.        | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d’une option de configuration d’exécution. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail d’exécution. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai maximal d’exécution (secondes).          | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle d’exécution.            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options d’exécution de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le store.          | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs exploitables.     | `/acp doctor`                                                 |
| `/acp install`       | Affiche des étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp status` affiche les options d’exécution effectives ainsi que les identifiants de session au niveau de l’exécution et du backend. Les erreurs de contrôle non pris en charge apparaissent clairement lorsqu’un backend ne dispose pas d’une capacité. `/acp sessions` lit le store pour la session courante liée ou demandeuse ; les jetons cibles (`session-key`, `session-id`, ou `session-label`) sont résolus via la découverte de sessions du gateway, y compris les racines `session.store` personnalisées par agent.

## Correspondance des options d’exécution

`/acp` propose des commandes pratiques et un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration d’exécution `model`.
- `/acp permissions <profile>` correspond à la clé de configuration d’exécution `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration d’exécution `timeout`.
- `/acp cwd <path>` met à jour directement le remplacement `cwd` de l’exécution.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de remplacement `cwd`.
- `/acp reset-options` efface tous les remplacements d’exécution pour la session cible.

## Harnais acpx, configuration du Plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI), les ponts MCP plugin-tools et OpenClaw-tools, et les modes d’autorisation ACP, voir
[ACP agents — configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Le Plugin backend est absent ou désactivé.                                      | Installez et activez le Plugin backend, puis exécutez `/acp doctor`.                                                                                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Le dispatch depuis les messages de fil normaux est désactivé.                   | Définissez `acp.dispatch.enabled=true`.                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | L’agent n’est pas dans la liste d’autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                     | Jeton clé/id/étiquette incorrect.                                               | Exécutez `/acp sessions`, copiez la clé/l’étiquette exacte, puis réessayez.                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.               | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez une création non liée.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne prend pas en charge la liaison ACP à la conversation courante.  | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez `bindings[]` au niveau supérieur, ou passez à un canal pris en charge.                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé hors d’un contexte de fil.                              | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                        | Reliez de nouveau en tant que propriétaire, ou utilisez une autre conversation ou un autre fil.                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne prend pas en charge la liaison à un fil.                        | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | L’exécution ACP est côté hôte ; la session demandeuse est dans le sandbox.      | Utilisez `runtime="subagent"` depuis des sessions en sandbox, ou lancez la création ACP depuis une session hors sandbox.                                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour l’exécution ACP.                                | Utilisez `runtime="subagent"` pour un sandbox obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session hors sandbox.                                     |
| Missing ACP metadata for bound session                                      | Métadonnées de session ACP obsolètes/supprimées.                                | Recréez avec `/acp spawn`, puis reliez/recentrez le fil.                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le gateway. Voir [Configuration des autorisations](/fr/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Les invites d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux du gateway pour `AcpRuntimeError`. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation élégante, définissez `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Le processus du harnais est terminé mais la session ACP n’a pas signalé sa fin. | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                        |

## Voir aussi

- [Sous-agents](/fr/tools/subagents)
- [Outils sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [Agent send](/fr/tools/agent-send)
