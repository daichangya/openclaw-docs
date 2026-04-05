---
read_when:
    - Exécution de harnesses de code via ACP
    - Configuration de sessions ACP liées à une conversation sur des canaux de messagerie
    - Association d’une conversation sur un canal de messages à une session ACP persistante
    - Dépannage du backend ACP et du câblage des plugins
    - Utilisation des commandes /acp depuis le chat
summary: Utilisez des sessions d’exécution ACP pour Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP et d’autres agents de harness
title: Agents ACP
x-i18n:
    generated_at: "2026-04-05T12:56:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agents ACP

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harnesses de code externes (par exemple Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnesses ACPX pris en charge) via un plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel « exécute ceci dans Codex » ou « démarre Claude Code dans un fil », OpenClaw doit acheminer cette demande vers le runtime ACP (et non vers le runtime natif de sous-agent). Chaque lancement de session ACP est suivi comme une [tâche en arrière-plan](/fr/automation/tasks).

Si vous voulez que Codex ou Claude Code se connecte directement comme client MCP externe
à des conversations de canal OpenClaw existantes, utilisez [`openclaw mcp serve`](/cli/mcp)
à la place d’ACP.

## Quelle page me faut-il ?

Il y a trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                     | Utiliser ceci                              | Notes                                                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Exécuter Codex, Claude Code, Gemini CLI ou un autre harness externe _via_ OpenClaw | Cette page : agents ACP                    | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, contrôles du runtime |
| Exposer une session OpenClaw Gateway _en tant que_ serveur ACP pour un éditeur ou client      | [`openclaw acp`](/cli/acp)                 | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                          |
| Réutiliser une CLI IA locale comme modèle de secours en texte seul                 | [Backends CLI](/fr/gateway/cli-backends)      | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas de runtime de harness                            |

## Est-ce que cela fonctionne prêt à l’emploi ?

En général, oui.

- Les nouvelles installations livrent désormais le plugin runtime groupé `acpx` activé par défaut.
- Le plugin groupé `acpx` préfère son binaire `acpx` épinglé local au plugin.
- Au démarrage, OpenClaw sonde ce binaire et l’auto-répare si nécessaire.
- Commencez par `/acp doctor` si vous voulez une vérification rapide de l’état de préparation.

Ce qui peut encore se produire lors de la première utilisation :

- Un adaptateur de harness cible peut être récupéré à la demande avec `npx` la première fois que vous utilisez ce harness.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harness.
- Si l’hôte n’a pas d’accès npm/réseau, les récupérations d’adaptateur au premier lancement peuvent échouer tant que les caches ne sont pas préchauffés ou que l’adaptateur n’est pas installé autrement.

Exemples :

- `/acp spawn codex` : OpenClaw devrait être prêt à initialiser `acpx`, mais l’adaptateur ACP Codex peut encore nécessiter une récupération au premier lancement.
- `/acp spawn claude` : même situation pour l’adaptateur Claude ACP, plus l’authentification côté Claude sur cet hôte.

## Flux opérateur rapide

Utilisez ceci si vous voulez un guide pratique pour `/acp` :

1. Lancez une session :
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Travaillez dans la conversation ou le fil lié (ou ciblez explicitement cette clé de session).
3. Vérifiez l’état du runtime :
   - `/acp status`
4. Ajustez les options du runtime si nécessaire :
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Donnez une impulsion à une session active sans remplacer le contexte :
   - `/acp steer resserre la journalisation et continue`
6. Arrêtez le travail :
   - `/acp cancel` (arrêter le tour en cours), ou
   - `/acp close` (fermer la session + supprimer les associations)

## Démarrage rapide pour les humains

Exemples de demandes naturelles :

- « Lie ce canal Discord à Codex. »
- « Démarre une session Codex persistante dans un fil ici et garde-la focalisée. »
- « Exécute ceci comme une session ACP Claude Code one-shot et résume le résultat. »
- « Lie ce chat iMessage à Codex et garde les suivis dans le même espace de travail. »
- « Utilise Gemini CLI pour cette tâche dans un fil, puis garde les suivis dans ce même fil. »

Ce que OpenClaw doit faire :

1. Choisir `runtime: "acp"`.
2. Résoudre la cible du harness demandée (`agentId`, par exemple `codex`).
3. Si une liaison à la conversation courante est demandée et que le canal actif la prend en charge, lier la session ACP à cette conversation.
4. Sinon, si une liaison au fil est demandée et que le canal courant la prend en charge, lier la session ACP à ce fil.
5. Acheminer les messages liés de suivi vers cette même session ACP jusqu’à ce qu’elle soit défocalisée/fermée/expirée.

## ACP versus sous-agents

Utilisez ACP quand vous voulez un runtime de harness externe. Utilisez les sous-agents quand vous voulez des exécutions déléguées natives OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent              |
| ------------- | ------------------------------------- | ------------------------------------ |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime natif de sous-agent OpenClaw |
| Clé de session   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| Commandes principales | `/acp ...`                      | `/subagents ...`                     |
| Outil de lancement    | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. plugin runtime groupé `acpx`
3. Adaptateur Claude ACP
4. Mécanisme de runtime/session côté Claude

Distinction importante :

- ACP Claude n’est pas la même chose que le runtime de secours direct `claude-cli/...`.
- ACP Claude est une session de harness avec contrôles ACP, reprise de session, suivi des tâches en arrière-plan et liaison facultative à une conversation/un fil.
- `claude-cli/...` est un backend CLI local en texte seul. Voir [Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- vous voulez `/acp spawn`, des sessions pouvant être liées, des contrôles du runtime ou un travail de harness persistant : utilisez ACP
- vous voulez un simple secours texte local via la CLI brute : utilisez les backends CLI

## Sessions liées

### Liaisons à la conversation courante

Utilisez `/acp spawn <harness> --bind here` quand vous voulez que la conversation courante devienne un espace de travail ACP durable sans créer de fil enfant.

Comportement :

- OpenClaw conserve la maîtrise du transport du canal, de l’authentification, de la sécurité et de la distribution.
- La conversation courante est épinglée à la clé de session ACP lancée.
- Les messages de suivi dans cette conversation sont acheminés vers la même session ACP.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session et supprime la liaison à la conversation courante.

Ce que cela signifie en pratique :

- `--bind here` conserve la même surface de chat. Sur Discord, le canal courant reste le canal courant.
- `--bind here` peut tout de même créer une nouvelle session ACP si vous lancez un nouveau travail. La liaison attache cette session à la conversation courante.
- `--bind here` ne crée pas à lui seul de fil enfant Discord ni de sujet Telegram.
- Le runtime ACP peut toujours avoir son propre répertoire de travail (`cwd`) ou un espace de travail sur disque géré par le backend. Cet espace de travail du runtime est distinct de la surface de chat et n’implique pas un nouveau fil de messagerie.
- Si vous lancez vers un autre agent ACP et ne passez pas `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**, et non de celui du demandeur.
- Si ce chemin d’espace de travail hérité est manquant (`ENOENT`/`ENOTDIR`), OpenClaw revient au `cwd` par défaut du backend au lieu de réutiliser silencieusement le mauvais arbre.
- Si l’espace de travail hérité existe mais n’est pas accessible (par exemple `EACCES`), le lancement renvoie la véritable erreur d’accès au lieu d’abandonner `cwd`.

Modèle mental :

- surface de chat : là où les personnes continuent à parler (`canal Discord`, `sujet Telegram`, `chat iMessage`)
- session ACP : l’état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw achemine
- fil/sujet enfant : une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`
- espace de travail du runtime : l’emplacement du système de fichiers où le harness s’exécute (`cwd`, checkout de dépôt, espace de travail backend)

Exemples :

- `/acp spawn codex --bind here` : conserver ce chat, lancer ou rattacher une session ACP Codex et y acheminer les futurs messages
- `/acp spawn codex --thread auto` : OpenClaw peut créer un fil/sujet enfant et y lier la session ACP
- `/acp spawn codex --bind here --cwd /workspace/repo` : même liaison de chat que ci-dessus, mais Codex s’exécute dans `/workspace/repo`

Prise en charge de la liaison à la conversation courante :

- Les canaux de chat/messages qui annoncent la prise en charge de la liaison à la conversation courante peuvent utiliser `--bind here` via le chemin partagé de liaison de conversation.
- Les canaux avec une sémantique personnalisée de fil/sujet peuvent toujours fournir une canonicalisation spécifique au canal derrière la même interface partagée.
- `--bind here` signifie toujours « lier la conversation courante sur place ».
- Les liaisons génériques à la conversation courante utilisent le magasin de liaison partagé d’OpenClaw et survivent aux redémarrages normaux de la gateway.

Notes :

- `--bind here` et `--thread ...` sont mutuellement exclusifs sur `/acp spawn`.
- Sur Discord, `--bind here` lie sur place le canal ou fil courant. `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer un fil enfant pour `--thread auto|here`.
- Si le canal actif n’expose pas de liaisons ACP à la conversation courante, OpenClaw renvoie un message clair indiquant l’absence de prise en charge.
- `resume` et les questions de « nouvelle session » sont des questions de session ACP, pas des questions de canal. Vous pouvez réutiliser ou remplacer l’état du runtime sans changer la surface de chat courante.

### Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des fils :

- OpenClaw lie un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont acheminés vers la session ACP liée.
- La sortie ACP est renvoyée dans le même fil.
- La défocalisation/fermeture/archivage/l’expiration par délai d’inactivité ou âge maximal supprime la liaison.

La prise en charge des liaisons de fil dépend de l’adaptateur. Si l’adaptateur du canal actif ne prend pas en charge les liaisons de fil, OpenClaw renvoie un message clair indiquant l’absence de prise en charge/disponibilité.

Indicateurs de fonctionnalité requis pour ACP lié à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre la distribution ACP)
- Indicateur de lancement de fil ACP de l’adaptateur de canal activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal qui expose une capacité de liaison session/fil.
- Prise en charge intégrée actuelle :
  - Fils/canaux Discord
  - Sujets Telegram (sujets de forum dans les groupes/supergroupes et sujets DM)
- Les canaux de plugin peuvent ajouter la prise en charge via la même interface de liaison.

## Paramètres spécifiques au canal

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans des entrées `bindings[]` de niveau supérieur.

### Modèle de liaison

- `bindings[].type="acp"` marque une liaison de conversation ACP persistante.
- `bindings[].match` identifie la conversation cible :
  - Canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Sujet de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/de groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
  - Chat DM/de groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` pour des liaisons de groupe stables.
- `bindings[].agentId` est l’id de l’agent OpenClaw propriétaire.
- Les remplacements ACP facultatifs se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir une fois les valeurs par défaut ACP par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id du harness, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorité des remplacements pour les sessions ACP liées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs par défaut ACP globales (par exemple `acp.backend`)

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

Comportement :

- OpenClaw veille à ce que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons temporaires du runtime (par exemple créées par les flux de focalisation de fil) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible à partir de la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les véritables échecs d’accès non dus à l’absence du chemin apparaissent comme erreurs de lancement.

## Démarrer des sessions ACP (interfaces)

### Depuis `sessions_spawn`

Utilisez `runtime: "acp"` pour démarrer une session ACP à partir d’un tour d’agent ou d’un appel d’outil.

```json
{
  "task": "Ouvre le dépôt et résume les tests en échec",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notes :

- `runtime` a pour valeur par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` nécessite `thread: true` pour conserver une conversation liée persistante.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : id du harness ACP cible. Revient à `acp.defaultAgent` s’il est défini.
- `thread` (facultatif, défaut `false`) : demande le flux de liaison de fil lorsqu’il est pris en charge.
- `mode` (facultatif) : `run` (one-shot) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut adopter par défaut un comportement persistant selon le chemin du runtime
  - `mode: "session"` nécessite `thread: true`
- `cwd` (facultatif) : répertoire de travail du runtime demandé (validé par la politique du backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : étiquette orientée opérateur utilisée dans le texte de session/bannière.
- `resumeSessionId` (facultatif) : reprendre une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Nécessite `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` diffuse les résumés de progression de l’exécution ACP initiale vers la session demandeuse sous forme d’événements système.
  - Lorsqu’elles sont disponibles, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL propre à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour voir l’historique complet du relais.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de repartir de zéro. L’agent rejoue son historique de conversation via `session/load`, ce qui lui permet de reprendre avec tout le contexte de ce qui a précédé.

```json
{
  "task": "Continue là où nous nous sommes arrêtés — corrige les échecs de tests restants",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage fréquents :

- Passer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous êtes arrêté
- Continuer une session de code commencée de manière interactive dans la CLI, maintenant sans interface via votre agent
- Reprendre un travail interrompu par un redémarrage de la gateway ou un délai d’inactivité

Notes :

- `resumeSessionId` nécessite `runtime: "acp"` — renvoie une erreur s’il est utilisé avec le runtime de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
- Si l’id de session est introuvable, le lancement échoue avec une erreur claire — aucun retour silencieux vers une nouvelle session.

### Test fumée opérateur

Utilisez ceci après un déploiement de gateway lorsque vous voulez une
vérification rapide en conditions réelles que le lancement ACP
fonctionne réellement de bout en bout, et ne se contente pas de réussir les tests unitaires.

Barre recommandée :

1. Vérifiez la version/le commit de la gateway déployée sur l’hôte cible.
2. Confirmez que la source déployée inclut l’acceptation de la lignée ACP dans
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Ouvrez une session de pont ACPX temporaire vers un agent réel (par exemple
   `razor(main)` sur `jpclawhq`).
4. Demandez à cet agent d’appeler `sessions_spawn` avec :
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tâche : `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Vérifiez que l’agent signale :
   - `accepted=yes`
   - un vrai `childSessionKey`
   - aucune erreur de validateur
6. Nettoyez la session de pont ACPX temporaire.

Exemple de prompt à l’agent réel :

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notes :

- Gardez ce test fumée sur `mode: "run"` sauf si vous testez intentionnellement
  des sessions ACP persistantes liées à un fil.
- N’exigez pas `streamTo: "parent"` pour la barre de base. Ce chemin dépend des
  capacités du demandeur/de la session et constitue une vérification d’intégration distincte.
- Traitez les tests de `mode: "session"` liés à un fil comme un second passage
  d’intégration plus riche à partir d’un vrai fil Discord ou d’un sujet Telegram.

## Compatibilité du sandbox

Les sessions ACP s’exécutent actuellement sur le runtime hôte, et non dans le sandbox OpenClaw.

Limites actuelles :

- Si la session demandeuse est sandboxée, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par sandbox.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat lorsque c’est nécessaire.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Indicateurs clés :

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Voir [Commandes slash](/tools/slash-commands).

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`, `session-id` ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d’abord la clé
   - puis l’id de session au format UUID
   - puis l’étiquette
2. Liaison du fil courant (si cette conversation/ce fil est lié à une session ACP)
3. Repli sur la session demandeuse courante

Les liaisons à la conversation courante et les liaisons de fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes de liaison au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                               |
| ------ | -------------------------------------------------------------------------- |
| `here` | Lie sur place la conversation active courante ; échoue si aucune n’est active. |
| `off`  | Ne crée pas de liaison à la conversation courante.                         |

Notes :

- `--bind here` est le chemin opérateur le plus simple pour « rendre ce canal ou ce chat adossé à Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de la liaison à la conversation courante.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
| `here` | Exige le fil actif courant ; échoue si vous n’êtes pas dans un fil.                                    |
| `off`  | Aucune liaison. La session démarre non liée.                                                           |

Notes :

- Sur les surfaces sans prise en charge de liaison de fil, le comportement par défaut est effectivement `off`.
- Le lancement lié à un fil nécessite la prise en charge par la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation courante sans créer de fil enfant.

## Contrôles ACP

Famille de commandes disponible :

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` affiche les options effectives du runtime et, lorsqu’ils sont disponibles, les identifiants de session au niveau du runtime et du backend.

Certains contrôles dépendent des capacités du backend. Si un backend ne prend pas en charge un contrôle, OpenClaw renvoie une erreur claire de contrôle non pris en charge.

## Livre de recettes des commandes ACP

| Commande              | Ce qu’elle fait                                           | Exemple                                                       |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`          | Crée une session ACP ; liaison courante ou liaison à un fil en option. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`         | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`          | Envoie une instruction de guidage à la session en cours.  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`          | Ferme la session et délie les cibles de fil.              | `/acp close`                                                  |
| `/acp status`         | Affiche le backend, le mode, l’état, les options du runtime et les capacités. | `/acp status`                                                 |
| `/acp set-mode`       | Définit le mode du runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`            | Écriture générique d’une option de configuration du runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`            | Définit le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`    | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`        | Définit le délai d’expiration du runtime (secondes).      | `/acp timeout 120`                                            |
| `/acp model`          | Définit le remplacement de modèle du runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options`  | Supprime les remplacements d’options du runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`       | Liste les sessions ACP récentes du magasin.               | `/acp sessions`                                               |
| `/acp doctor`         | Santé du backend, capacités, corrections exploitables.    | `/acp doctor`                                                 |
| `/acp install`        | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp sessions` lit le magasin pour la session actuellement liée ou demandeuse. Les commandes qui acceptent des jetons `session-key`, `session-id` ou `session-label` résolvent les cibles via la découverte de session de la gateway, y compris les racines `session.store` personnalisées par agent.

## Correspondance des options du runtime

`/acp` possède des commandes pratiques et un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration du runtime `model`.
- `/acp permissions <profile>` correspond à la clé de configuration du runtime `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration du runtime `timeout`.
- `/acp cwd <path>` met directement à jour le remplacement `cwd` du runtime.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de remplacement `cwd`.
- `/acp reset-options` efface tous les remplacements de runtime pour la session cible.

## Prise en charge des harnesses acpx (actuelle)

Alias de harness intégrés actuels d’acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI : `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quand OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP comme `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (pas le chemin normal `agentId` d’OpenClaw).

## Configuration requise

Base ACP du cœur :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour suspendre la distribution ACP tout en conservant les contrôles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuration des liaisons de fil est spécifique à l’adaptateur de canal. Exemple pour Discord :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si le lancement ACP lié à un fil ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation courante n’exigent pas la création d’un fil enfant. Elles exigent un contexte de conversation actif et un adaptateur de canal qui expose des liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du plugin pour le backend acpx

Les nouvelles installations livrent le plugin runtime groupé `acpx` activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation du plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou souhaitez
basculer vers un checkout de développement local, utilisez le chemin explicite du plugin :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation de workspace locale pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ensuite, vérifiez la santé du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version d’acpx

Par défaut, le plugin backend acpx groupé (`acpx`) utilise le binaire épinglé local au plugin :

1. La commande utilise par défaut le `node_modules/.bin/acpx` local au plugin à l’intérieur du package du plugin ACPX.
2. La version attendue utilise par défaut l’épinglage de l’extension.
3. Au démarrage, l’enregistrement du backend ACP est immédiat comme non prêt.
4. Une tâche d’assurance en arrière-plan vérifie `acpx --version`.
5. Si le binaire local au plugin est manquant ou non conforme, il exécute :
   `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie.

Vous pouvez remplacer la commande/version dans la configuration du plugin :

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Notes :

- `command` accepte un chemin absolu, un chemin relatif ou un nom de commande (`acpx`).
- Les chemins relatifs sont résolus à partir du répertoire de workspace OpenClaw.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Lorsque `command` pointe vers un binaire/chemin personnalisé, l’auto-installation locale au plugin est désactivée.
- Le démarrage d’OpenClaw reste non bloquant pendant l’exécution de la vérification de santé du backend.

Voir [Plugins](/tools/plugin).

### Installation automatique des dépendances

Quand vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances du runtime
acpx (binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de plugin

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par plugin OpenClaw au
harness ACP.

Si vous voulez que des agents ACP comme Codex ou Claude Code puissent appeler des outils de plugin OpenClaw
installés, comme memory recall/store, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage
  de la session ACPX.
- Expose les outils de plugin déjà enregistrés par les plugins OpenClaw
  installés et activés.
- Garde cette fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela élargit la surface des outils du harness ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de plugin déjà actifs dans la gateway.
- Considérez cela comme la même frontière de confiance que le fait de laisser ces plugins s’exécuter dans
  OpenClaw lui-même.
- Examinez les plugins installés avant d’activer cette option.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré plugin-tools est
une commodité supplémentaire avec adhésion explicite, et non un remplacement de la configuration générique de serveur MCP.

## Configuration des permissions

Les sessions ACP s’exécutent sans interaction — il n’y a pas de TTY pour approuver ou refuser les invites de permission d’écriture de fichiers et d’exécution shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la manière dont les permissions sont gérées :

Ces permissions de harness ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement du fournisseur de backend CLI, tels que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur casse-vitre au niveau du harness pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent de harness peut effectuer sans invite.

| Valeur           | Comportement                                              |
| ---------------- | --------------------------------------------------------- |
| `approve-all`    | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads`  | Approuve automatiquement uniquement les lectures ; les écritures et exécutions nécessitent des invites. |
| `deny-all`       | Refuse toutes les invites de permission.                  |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite de permission serait affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                          |
| ------ | --------------------------------------------------------------------- |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)**         |
| `deny` | Refuse silencieusement la permission et continue (dégradation progressive). |

### Configuration

Définissez-la via la configuration du plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite de permission peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent proprement au lieu de planter.

## Dépannage

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Le plugin backend est manquant ou désactivé.                                    | Installez et activez le plugin backend, puis exécutez `/acp doctor`.                                                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | La distribution depuis les messages normaux du fil est désactivée.              | Définissez `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                  | L’agent n’est pas dans la liste d’autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                  |
| `Unable to resolve session target: ...`                                      | Mauvais jeton clé/id/étiquette.                                                 | Exécutez `/acp sessions`, copiez la clé/l’étiquette exacte, puis réessayez.                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation`  | `--bind here` a été utilisé sans conversation active pouvant être liée.         | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un lancement sans liaison.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                       | L’adaptateur ne dispose pas de la capacité ACP de liaison à la conversation courante. | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez des `bindings[]` de niveau supérieur, ou passez à un canal pris en charge.          |
| `--thread here requires running /acp spawn inside an active ... thread`      | `--thread here` a été utilisé en dehors d’un contexte de fil.                   | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`                | Un autre utilisateur possède la cible de liaison active.                        | Reliez à nouveau en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                         |
| `Thread bindings are unavailable for <channel>.`                             | L’adaptateur ne prend pas en charge la capacité de liaison de fil.              | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | Le runtime ACP est côté hôte ; la session demandeuse est sandboxée.             | Utilisez `runtime="subagent"` depuis des sessions sandboxées, ou lancez ACP depuis une session non sandboxée.                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | `sandbox="require"` a été demandé pour le runtime ACP.                          | Utilisez `runtime="subagent"` pour un sandbox requis, ou ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                              |
| ACP metadata missing for bound session                                       | Métadonnées de session ACP périmées/supprimées.                                 | Recréez-la avec `/acp spawn`, puis reliez/focalisez à nouveau le fil.                                                                                                 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez la gateway. Voir [Configuration des permissions](#configuration-des-permissions). |
| ACP session fails early with little output                                   | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux de la gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                        | Le processus de harness est terminé mais la session ACP n’a pas signalé la fin. | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus périmés.                                                                                      |
