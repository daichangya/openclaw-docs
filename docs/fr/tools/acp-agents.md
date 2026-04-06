---
read_when:
    - Exécution de harnesses de codage via ACP
    - Configuration de sessions ACP liées à une conversation sur des canaux de messagerie
    - Association d’une conversation sur un canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP et du câblage des plugins
    - Utilisation des commandes /acp depuis le chat
summary: Utilisez des sessions d’exécution ACP pour Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP et d’autres agents de harness
title: Agents ACP
x-i18n:
    generated_at: "2026-04-06T03:14:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302f3fe25b1ffe0576592b6e0ad9e8a5781fa5702b31d508d9ba8908f7df33bd
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agents ACP

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harnesses de codage externes (par exemple Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnesses ACPX pris en charge) via un plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel « exécute ceci dans Codex » ou « démarre Claude Code dans un fil », OpenClaw doit acheminer cette demande vers le runtime ACP (et non vers le runtime natif de sous-agent). Chaque lancement de session ACP est suivi comme une [tâche d’arrière-plan](/fr/automation/tasks).

Si vous voulez que Codex ou Claude Code se connecte directement comme client MCP externe
à des conversations de canal OpenClaw existantes, utilisez [`openclaw mcp serve`](/cli/mcp)
à la place d’ACP.

## Quelle page me faut-il ?

Il existe trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                     | Utilisez                   | Notes                                                                                                                |
| ----------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Exécuter Codex, Claude Code, Gemini CLI ou un autre harness externe _via_ OpenClaw | Cette page : agents ACP    | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d’arrière-plan, contrôles runtime |
| Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou client  | [`openclaw acp`](/cli/acp) | Mode pont. L’IDE/le client parle ACP à OpenClaw via stdio/WebSocket                                                 |

## Est-ce que cela fonctionne immédiatement ?

Généralement, oui.

- Les nouvelles installations livrent désormais le plugin runtime groupé `acpx` activé par défaut.
- Le plugin groupé `acpx` préfère son binaire `acpx` local au plugin et épinglé.
- Au démarrage, OpenClaw sonde ce binaire et le répare automatiquement si nécessaire.
- Commencez par `/acp doctor` si vous voulez une vérification rapide de l’état de préparation.

Ce qui peut encore se produire lors de la première utilisation :

- Un adaptateur de harness cible peut être récupéré à la demande avec `npx` la première fois que vous utilisez ce harness.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harness.
- Si l’hôte n’a pas d’accès npm/réseau, les récupérations initiales d’adaptateur peuvent échouer tant que les caches ne sont pas préchauffés ou que l’adaptateur n’est pas installé autrement.

Exemples :

- `/acp spawn codex` : OpenClaw doit être prêt à amorcer `acpx`, mais l’adaptateur ACP Codex peut encore nécessiter une récupération initiale.
- `/acp spawn claude` : même situation pour l’adaptateur ACP Claude, plus l’authentification côté Claude sur cet hôte.

## Flux opérateur rapide

Utilisez ceci si vous voulez un guide pratique pour `/acp` :

1. Lancez une session :
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Travaillez dans la conversation ou le fil lié (ou ciblez explicitement cette clé de session).
3. Vérifiez l’état runtime :
   - `/acp status`
4. Ajustez les options runtime si nécessaire :
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Donnez une impulsion à une session active sans remplacer le contexte :
   - `/acp steer tighten logging and continue`
6. Arrêtez le travail :
   - `/acp cancel` (arrêter le tour en cours), ou
   - `/acp close` (fermer la session + supprimer les associations)

## Démarrage rapide pour les humains

Exemples de requêtes naturelles :

- « Lie ce canal Discord à Codex. »
- « Démarre une session Codex persistante dans un fil ici et garde-la ciblée. »
- « Exécute ceci comme une session ACP Claude Code ponctuelle et résume le résultat. »
- « Lie cette discussion iMessage à Codex et garde les suivis dans le même espace de travail. »
- « Utilise Gemini CLI pour cette tâche dans un fil, puis garde les suivis dans ce même fil. »

Ce que OpenClaw doit faire :

1. Choisir `runtime: "acp"`.
2. Résoudre la cible de harness demandée (`agentId`, par exemple `codex`).
3. Si une association à la conversation courante est demandée et que le canal actif la prend en charge, associer la session ACP à cette conversation.
4. Sinon, si une association au fil est demandée et que le canal courant la prend en charge, associer la session ACP au fil.
5. Acheminer les messages de suivi liés vers cette même session ACP jusqu’à ce qu’elle soit désactivée, fermée ou expirée.

## ACP versus sous-agents

Utilisez ACP lorsque vous voulez un runtime de harness externe. Utilisez des sous-agents lorsque vous voulez des exécutions déléguées natives à OpenClaw.

| Domaine        | Session ACP                            | Exécution de sous-agent              |
| -------------- | -------------------------------------- | ------------------------------------ |
| Runtime        | Plugin backend ACP (par exemple acpx)  | Runtime natif de sous-agent OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`    |
| Commandes principales | `/acp ...`                      | `/subagents ...`                     |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. plugin runtime groupé `acpx`
3. Adaptateur ACP Claude
4. Mécanisme de runtime/session côté Claude

Distinction importante :

- ACP Claude est une session de harness avec des contrôles ACP, une reprise de session, un suivi des tâches d’arrière-plan et une association optionnelle à une conversation/un fil.
  Pour les opérateurs, la règle pratique est :

- si vous voulez `/acp spawn`, des sessions associables, des contrôles runtime ou un travail de harness persistant : utilisez ACP

## Sessions liées

### Associations à la conversation courante

Utilisez `/acp spawn <harness> --bind here` lorsque vous voulez que la conversation courante devienne un espace de travail ACP durable sans créer de fil enfant.

Comportement :

- OpenClaw continue d’assurer le transport du canal, l’authentification, la sécurité et la livraison.
- La conversation courante est épinglée à la clé de session ACP lancée.
- Les messages de suivi dans cette conversation sont acheminés vers la même session ACP.
- `/new` et `/reset` réinitialisent sur place cette même session ACP liée.
- `/acp close` ferme la session et supprime l’association à la conversation courante.

Ce que cela signifie en pratique :

- `--bind here` conserve la même surface de chat. Sur Discord, le canal courant reste le canal courant.
- `--bind here` peut quand même créer une nouvelle session ACP si vous lancez un nouveau travail. L’association attache cette session à la conversation courante.
- `--bind here` ne crée pas à lui seul un fil Discord enfant ni un sujet Telegram.
- Le runtime ACP peut tout de même avoir son propre répertoire de travail (`cwd`) ou un espace de travail géré sur disque par le backend. Cet espace de travail runtime est séparé de la surface de chat et n’implique pas un nouveau fil de messagerie.
- Si vous lancez vers un autre agent ACP et que vous ne passez pas `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**, pas de celui du demandeur.
- Si ce chemin d’espace de travail hérité est manquant (`ENOENT`/`ENOTDIR`), OpenClaw revient au `cwd` par défaut du backend au lieu de réutiliser silencieusement le mauvais arbre.
- Si l’espace de travail hérité existe mais n’est pas accessible (par exemple `EACCES`), le lancement renvoie la véritable erreur d’accès au lieu d’abandonner `cwd`.

Modèle mental :

- surface de chat : là où les personnes continuent de parler (`canal Discord`, `sujet Telegram`, `discussion iMessage`)
- session ACP : l’état runtime durable Codex/Claude/Gemini vers lequel OpenClaw achemine
- fil/sujet enfant : une surface de messagerie supplémentaire optionnelle créée uniquement par `--thread ...`
- espace de travail runtime : l’emplacement du système de fichiers où s’exécute le harness (`cwd`, dépôt extrait, espace de travail backend)

Exemples :

- `/acp spawn codex --bind here` : garder ce chat, lancer ou rattacher une session ACP Codex, et y acheminer les futurs messages
- `/acp spawn codex --thread auto` : OpenClaw peut créer un fil/sujet enfant et y associer la session ACP
- `/acp spawn codex --bind here --cwd /workspace/repo` : même association au chat que ci-dessus, mais Codex s’exécute dans `/workspace/repo`

Prise en charge de l’association à la conversation courante :

- Les canaux de chat/de message qui annoncent la prise en charge de l’association à la conversation courante peuvent utiliser `--bind here` via le chemin partagé d’association de conversation.
- Les canaux avec une sémantique personnalisée de fil/sujet peuvent toujours fournir une canonicalisation spécifique au canal derrière la même interface partagée.
- `--bind here` signifie toujours « associer la conversation courante sur place ».
- Les associations génériques à la conversation courante utilisent le magasin d’associations partagé d’OpenClaw et survivent aux redémarrages normaux de la gateway.

Notes :

- `--bind here` et `--thread ...` sont mutuellement exclusifs sur `/acp spawn`.
- Sur Discord, `--bind here` associe sur place le canal ou le fil courant. `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer un fil enfant pour `--thread auto|here`.
- Si le canal actif n’expose pas d’associations ACP à la conversation courante, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge.
- `resume` et les questions de « nouvelle session » sont des questions de session ACP, pas des questions de canal. Vous pouvez réutiliser ou remplacer l’état runtime sans changer la surface de chat courante.

### Sessions liées à un fil

Lorsque les associations à des fils sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des fils :

- OpenClaw associe un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont acheminés vers la session ACP liée.
- La sortie ACP est renvoyée dans ce même fil.
- La désactivation, la fermeture, l’archivage, l’expiration par inactivité ou l’expiration par âge maximal suppriment l’association.

La prise en charge de l’association à un fil dépend de l’adaptateur. Si l’adaptateur du canal actif ne la prend pas en charge, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge ou disponible.

Indicateurs de fonctionnalité requis pour l’ACP lié à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre la distribution ACP)
- Indicateur de lancement de fil ACP de l’adaptateur de canal activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal qui expose une capacité d’association de session/fil.
- Prise en charge intégrée actuelle :
  - Fils/canaux Discord
  - Sujets Telegram (sujets de forum dans les groupes/supergroupes et sujets DM)
- Les canaux de plugin peuvent ajouter la prise en charge via la même interface d’association.

## Paramètres spécifiques aux canaux

Pour les flux de travail non éphémères, configurez des associations ACP persistantes dans des entrées `bindings[]` de niveau supérieur.

### Modèle d’association

- `bindings[].type="acp"` marque une association persistante de conversation ACP.
- `bindings[].match` identifie la conversation cible :
  - Canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Sujet de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` ou `chat_identifier:*` pour des associations de groupe stables.
  - Chat DM/groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` pour des associations de groupe stables.
- `bindings[].agentId` est l’identifiant de l’agent OpenClaw propriétaire.
- Les remplacements ACP facultatifs se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs runtime par défaut par agent

Utilisez `agents.list[].runtime` pour définir une seule fois les valeurs ACP par défaut pour chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant du harness, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorité des remplacements pour les sessions ACP liées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs ACP globales par défaut (par exemple `acp.backend`)

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

- OpenClaw s’assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place cette même clé de session ACP.
- Les associations runtime temporaires (par exemple créées par des flux de focalisation sur fil) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible à partir de la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les véritables échecs d’accès non liés à une absence sont remontés comme erreurs de lancement.

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

Notes :

- `runtime` est par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` exige `thread: true` pour conserver une conversation liée persistante.

Détails de l’interface :

- `task` (requis) : prompt initial envoyé à la session ACP.
- `runtime` (requis pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : identifiant du harness ACP cible. Revient à `acp.defaultAgent` s’il est défini.
- `thread` (facultatif, par défaut `false`) : demande un flux d’association à un fil lorsque c’est pris en charge.
- `mode` (facultatif) : `run` (ponctuel) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut utiliser par défaut un comportement persistant selon le chemin runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (facultatif) : répertoire de travail runtime demandé (validé par la politique du backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : libellé orienté opérateur utilisé dans le texte de session/de bannière.
- `resumeSessionId` (facultatif) : reprendre une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` diffuse les résumés initiaux de progression de l’exécution ACP vers la session demandeuse en tant qu’événements système.
  - Lorsqu’elles sont disponibles, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL à portée de session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour voir l’historique complet du relais.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu d’en démarrer une nouvelle. L’agent rejoue son historique de conversation via `session/load`, afin de reprendre avec tout le contexte précédent.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage courants :

- Transférer une session Codex de votre ordinateur portable vers votre téléphone — demandez à votre agent de reprendre là où vous vous êtes arrêté
- Continuer une session de codage démarrée de manière interactive dans la CLI, maintenant en mode sans interface via votre agent
- Reprendre un travail interrompu par un redémarrage de gateway ou un délai d’inactivité

Notes :

- `resumeSessionId` exige `runtime: "acp"` — renvoie une erreur s’il est utilisé avec le runtime de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP en amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
- Si l’identifiant de session est introuvable, le lancement échoue avec une erreur explicite — aucun retour silencieux vers une nouvelle session.

### Test de fumée opérateur

Utilisez ceci après un déploiement de gateway lorsque vous voulez une
vérification rapide en conditions réelles que le lancement ACP fonctionne
réellement de bout en bout, et pas seulement qu’il passe les tests unitaires.

Validation recommandée :

1. Vérifiez la version/le commit de la gateway déployée sur l’hôte cible.
2. Confirmez que la source déployée inclut l’acceptation de lignée ACP dans
   `src/gateway/sessions-patch.ts` (`sessions subagent:* ou acp:*`).
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

- Conservez ce test de fumée en `mode: "run"` sauf si vous testez
  intentionnellement des sessions ACP persistantes liées à un fil.
- N’exigez pas `streamTo: "parent"` pour la validation de base. Ce chemin dépend
  des capacités du demandeur/de la session et constitue une vérification
  d’intégration distincte.
- Traitez les tests liés à un fil avec `mode: "session"` comme une seconde passe
  d’intégration plus riche depuis un vrai fil Discord ou un vrai sujet Telegram.

## Compatibilité du sandbox

Les sessions ACP s’exécutent actuellement sur le runtime hôte, pas dans le sandbox OpenClaw.

Limites actuelles :

- Si la session demandeuse est sandboxée, les lancements ACP sont bloqués à la fois pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par le sandbox.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat lorsque nécessaire.

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

Voir [Commandes slash](/fr/tools/slash-commands).

## Résolution de cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`, `session-id` ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d’abord la clé
   - puis l’identifiant de session au format UUID
   - puis le libellé
2. Association du fil courant (si cette conversation/ce fil est lié à une session ACP)
3. Repli sur la session demandeuse courante

Les associations à la conversation courante et les associations à un fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur explicite (`Unable to resolve session target: ...`).

## Modes d’association au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                            |
| ------ | ----------------------------------------------------------------------- |
| `here` | Associer sur place la conversation active courante ; échouer s’il n’y en a pas. |
| `off`  | Ne pas créer d’association à la conversation courante.                 |

Notes :

- `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou chat un espace piloté par Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de l’association à la conversation courante.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : associer ce fil. En dehors d’un fil : créer/associer un fil enfant lorsque c’est pris en charge. |
| `here` | Exiger le fil actif courant ; échouer si vous n’êtes pas dans un fil.                                   |
| `off`  | Aucune association. La session démarre sans être liée.                                                  |

Notes :

- Sur les surfaces sans association à un fil, le comportement par défaut équivaut en pratique à `off`.
- Le lancement lié à un fil nécessite la prise en charge par la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation courante sans créer de fil enfant.

## Contrôles ACP

Famille de commandes disponibles :

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

`/acp status` affiche les options runtime effectives et, lorsque disponible, les identifiants de session au niveau runtime et au niveau backend.

Certains contrôles dépendent des capacités du backend. Si un backend ne prend pas en charge un contrôle, OpenClaw renvoie une erreur explicite de contrôle non pris en charge.

## Livre de recettes des commandes ACP

| Commande             | Ce qu’elle fait                                              | Exemple                                                       |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; association courante ou à un fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.               | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et dissocie les cibles de fil.              | `/acp close`                                                  |
| `/acp status`        | Affiche backend, mode, état, options runtime, capacités.     | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode runtime pour la session cible.               | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d’une option de configuration runtime.    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail runtime.    | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai runtime (secondes).                         | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement de modèle runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options runtime de la session.  | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le magasin.           | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs actionnables.        | `/acp doctor`                                                 |
| `/acp install`       | Affiche des étapes déterministes d’installation et d’activation. | `/acp install`                                             |

`/acp sessions` lit le magasin pour la session actuellement liée ou demandeuse. Les commandes qui acceptent des jetons `session-key`, `session-id` ou `session-label` résolvent les cibles via la découverte de sessions gateway, y compris les racines `session.store` personnalisées par agent.

## Correspondance des options runtime

`/acp` dispose de commandes pratiques et d’un définisseur générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration runtime `model`.
- `/acp permissions <profile>` correspond à la clé de configuration runtime `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration runtime `timeout`.
- `/acp cwd <path>` met à jour directement le remplacement de `cwd` runtime.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de remplacement du `cwd`.
- `/acp reset-options` efface tous les remplacements runtime pour la session cible.

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

Lorsque OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose toujours ACP comme `agent acp`, remplacez la commande d’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non le chemin `agentId` normal d’OpenClaw).

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

La configuration d’association à un fil est spécifique à l’adaptateur de canal. Exemple pour Discord :

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

Les associations à la conversation courante ne nécessitent pas la création d’un fil enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose des associations de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du plugin pour le backend acpx

Les nouvelles installations livrent le plugin runtime groupé `acpx` activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation de plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou voulez
passer à une extraction locale de développement, utilisez le chemin explicite du plugin :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation d’un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite la santé du backend :

```text
/acp doctor
```

### Configuration de commande et de version d’acpx

Par défaut, le plugin backend acpx groupé (`acpx`) utilise le binaire local au plugin et épinglé :

1. La commande pointe par défaut vers le `node_modules/.bin/acpx` local au plugin dans le package du plugin ACPX.
2. La version attendue pointe par défaut vers l’épinglage de l’extension.
3. Au démarrage, OpenClaw enregistre immédiatement le backend ACP comme non prêt.
4. Une tâche d’assurance en arrière-plan vérifie `acpx --version`.
5. Si le binaire local au plugin est manquant ou ne correspond pas, il exécute :
   `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie.

Vous pouvez remplacer la commande/la version dans la configuration du plugin :

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
- Les chemins relatifs sont résolus depuis le répertoire de l’espace de travail OpenClaw.
- `expectedVersion: "any"` désactive la vérification stricte de version.
- Lorsque `command` pointe vers un binaire ou chemin personnalisé, l’installation automatique locale au plugin est désactivée.
- Le démarrage d’OpenClaw reste non bloquant pendant l’exécution du contrôle de santé du backend.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances runtime acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de plugin

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les plugins OpenClaw
au harness ACP.

Si vous voulez que des agents ACP tels que Codex ou Claude Code puissent appeler des
outils de plugin OpenClaw installés, tels que le rappel/le stockage de mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage
  de session ACPX.
- Expose les outils de plugin déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde la fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela élargit la surface d’outils du harness ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de plugin déjà actifs dans la gateway.
- Traitez cela comme la même limite de confiance que celle qui consiste à laisser ces plugins s’exécuter dans
  OpenClaw lui-même.
- Vérifiez les plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré plugin-tools est
une commodité supplémentaire sur activation explicite, et non un remplacement de la configuration générique des serveurs MCP.

## Configuration des permissions

Les sessions ACP s’exécutent sans interaction — il n’y a pas de TTY pour approuver ou refuser les invites d’autorisation d’écriture de fichier et d’exécution de shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la gestion des permissions :

Ces permissions de harness ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement du fournisseur backend CLI tels que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur de secours au niveau du harness pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent de harness peut effectuer sans invite.

| Valeur          | Comportement                                                 |
| --------------- | ------------------------------------------------------------ |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement uniquement les lectures ; les écritures et exécutions nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites d’autorisation.                    |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite d’autorisation devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                       |
| ------ | ------------------------------------------------------------------ |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)**      |
| `deny` | Refuse silencieusement l’autorisation et continue (dégradation progressive). |

### Configuration

Définissez-les via la configuration du plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent proprement au lieu de planter.

## Dépannage

| Symptôme                                                                    | Cause probable                                                                 | Correctif                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend manquant ou désactivé.                                          | Installez et activez le plugin backend, puis exécutez `/acp doctor`.                                                                                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP désactivé globalement.                                                     | Définissez `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | La distribution depuis les messages normaux de fil est désactivée.             | Définissez `acp.dispatch.enabled=true`.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                 | L’agent n’est pas dans la liste d’autorisation.                                | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                              |
| `Unable to resolve session target: ...`                                     | Mauvais jeton de clé/id/libellé.                                               | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.              | Déplacez-vous dans le chat/canal cible et réessayez, ou utilisez un lancement non lié.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de capacité ACP d’association à la conversation courante. | Utilisez `/acp spawn ... --thread ...` là où c’est pris en charge, configurez des `bindings[]` de niveau supérieur, ou passez à un canal pris en charge. |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé hors d’un contexte de fil.                             | Déplacez-vous dans le fil cible ou utilisez `--thread auto`/`off`.                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible d’association active.                    | Réassociez en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                           |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de capacité d’association à un fil.                | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est sandboxée.            | Utilisez `runtime="subagent"` depuis des sessions sandboxées, ou lancez ACP depuis une session non sandboxée.                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour le runtime ACP.                               | Utilisez `runtime="subagent"` pour un sandbox obligatoire, ou ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                     |
| Missing ACP metadata for bound session                                      | Métadonnées ACP obsolètes/supprimées pour la session liée.                     | Recréez avec `/acp spawn`, puis réassociez/re-focalisez le fil.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez la gateway. Voir [Configuration des permissions](#configuration-des-permissions). |
| ACP session fails early with little output                                  | Les invites d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux de la gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Le processus de harness est terminé mais la session ACP n’a pas signalé sa fin. | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                |
