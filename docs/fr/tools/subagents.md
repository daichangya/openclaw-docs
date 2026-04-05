---
read_when:
    - Vous voulez un travail en arrière-plan/parallèle via l'agent
    - Vous modifiez `sessions_spawn` ou la politique d'outils des sub-agents
    - Vous implémentez ou dépannez des sessions de sub-agent liées à un fil
summary: 'Sub-agents : lancer des exécutions d''agent isolées qui annoncent leurs résultats dans le chat demandeur'
title: Sub-agents
x-i18n:
    generated_at: "2026-04-05T12:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agents

Les sub-agents sont des exécutions d'agent en arrière-plan lancées à partir d'une exécution d'agent existante. Ils s'exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de chat demandeur. Chaque exécution de sub-agent est suivie comme une [tâche d'arrière-plan](/fr/automation/tasks).

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sub-agent de la **session en cours** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles de liaison au fil :

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons persistantes à un fil. Voir **Canaux prenant en charge les fils** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées d'exécution (statut, horodatages, id de session, chemin de transcription, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le chemin de transcription sur disque lorsque vous avez besoin de la transcription brute complète.

### Comportement du lancement

`/subagents spawn` démarre un sub-agent d'arrière-plan en tant que commande utilisateur, et non comme relais interne, et envoie une mise à jour finale d'achèvement dans le chat demandeur lorsque l'exécution se termine.

- La commande de lancement est non bloquante ; elle renvoie immédiatement un id d'exécution.
- À l'achèvement, le sub-agent annonce un message de résumé/résultat dans le canal de chat demandeur.
- La distribution de l'achèvement est basée sur le push. Une fois lancé, ne sondez pas `/subagents list`, `sessions_list` ou `sessions_history` en boucle juste pour attendre la fin ; inspectez le statut uniquement à la demande pour le débogage ou l'intervention.
- À l'achèvement, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sub-agent avant que le flux de nettoyage de l'annonce continue.
- Pour les lancements manuels, la distribution est résiliente :
  - OpenClaw essaie d'abord une distribution `agent` directe avec une clé d'idempotence stable.
  - Si la distribution directe échoue, il bascule vers le routage par file d'attente.
  - Si le routage par file d'attente n'est toujours pas disponible, l'annonce est réessayée avec un court backoff exponentiel avant l'abandon final.
- La distribution de l'achèvement conserve la route du demandeur résolue :
  - les routes d'achèvement liées à un fil ou à une conversation sont prioritaires lorsqu'elles sont disponibles
  - si l'origine de l'achèvement ne fournit qu'un canal, OpenClaw complète la cible/le compte manquants à partir de la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la distribution directe fonctionne quand même
- Le transfert d'achèvement vers la session demandeuse est un contexte interne généré à l'exécution (et non un texte rédigé par l'utilisateur) et inclut :
  - `Result` (dernier texte visible de réponse `assistant`, sinon dernier texte assaini `tool`/`toolResult`)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - des statistiques compactes d'exécution/tokens
  - une instruction de distribution demandant à l'agent demandeur de reformuler avec une voix d'assistant normale (sans transmettre les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après l'achèvement.
- `/subagents spawn` est un mode ponctuel (`mode: "run"`). Pour des sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harnais ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et voir [ACP Agents](/tools/acp-agents).

Objectifs principaux :

- Paralléliser le travail de type « recherche / tâche longue / outil lent » sans bloquer l'exécution principale.
- Garder les sub-agents isolés par défaut (séparation de session + sandboxing optionnel).
- Rendre la surface d'outils difficile à mal utiliser : les sub-agents n'obtiennent **pas** les outils de session par défaut.
- Prendre en charge une profondeur d'imbrication configurable pour les modèles d'orchestrateur.

Remarque sur les coûts : chaque sub-agent a son **propre** contexte et sa propre consommation de tokens. Pour les tâches lourdes ou répétitives, définissez un modèle moins cher pour les sub-agents et gardez votre agent principal sur un modèle de meilleure qualité.
Vous pouvez configurer cela via `agents.defaults.subagents.model` ou via des remplacements par agent.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sub-agent (`deliver: false`, lane globale : `subagent`)
- Exécute ensuite une étape d'annonce et publie la réponse d'annonce dans le canal de chat demandeur
- Modèle par défaut : hérite de l'appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; une valeur explicite `sessions_spawn.model` reste prioritaire.
- Niveau de réflexion par défaut : hérite de l'appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; une valeur explicite `sessions_spawn.thinking` reste prioritaire.
- Délai d'exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu'il est défini ; sinon, il retombe à `0` (pas de délai d'expiration).

Paramètres de l'outil :

- `task` (obligatoire)
- `label?` (facultatif)
- `agentId?` (facultatif ; lance sous un autre id d'agent si autorisé)
- `model?` (facultatif ; remplace le modèle du sub-agent ; les valeurs invalides sont ignorées et le sub-agent s'exécute sur le modèle par défaut avec un avertissement dans le résultat de l'outil)
- `thinking?` (facultatif ; remplace le niveau de réflexion pour l'exécution du sub-agent)
- `runTimeoutSeconds?` (par défaut : `agents.defaults.subagents.runTimeoutSeconds` lorsqu'il est défini, sinon `0` ; lorsqu'il est défini, l'exécution du sub-agent est interrompue après N secondes)
- `thread?` (par défaut `false` ; lorsqu'il vaut `true`, demande une liaison au fil du canal pour cette session de sub-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et `mode` est omis, la valeur par défaut devient `session`
  - `mode: "session"` nécessite `thread: true`
- `cleanup?` (`delete|keep`, par défaut `keep`)
- `sandbox?` (`inherit|require`, par défaut `inherit` ; `require` rejette le lancement à moins que le runtime enfant cible soit sandboxé)
- `sessions_spawn` n'accepte **pas** les paramètres de distribution de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la distribution, utilisez `message`/`sessions_send` depuis l'exécution lancée.

## Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un canal, un sub-agent peut rester lié à un fil afin que les messages utilisateur de suivi dans ce fil continuent d'être routés vers la même session de sub-agent.

### Canaux prenant en charge les fils

- Discord (actuellement le seul canal pris en charge) : prend en charge les sessions persistantes de sub-agent liées à un fil (`sessions_spawn` avec `thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) et les clés d'adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont routés vers la session liée.
4. Utilisez `/session idle` pour inspecter/mettre à jour le retrait automatique du focus lié à l'inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` lie le fil en cours (ou en crée un) à une cible de sub-agent/session.
- `/unfocus` supprime la liaison pour le fil actuellement lié.
- `/agents` liste les exécutions actives et l'état de liaison (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` ne fonctionnent que pour les fils liés focalisés.

Commutateurs de configuration :

- Valeur par défaut globale : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Le remplacement de canal et les clés de liaison automatique au lancement sont spécifiques à l'adaptateur. Voir **Canaux prenant en charge les fils** ci-dessus.

Voir [Référence de configuration](/fr/gateway/configuration-reference) et [Commandes slash](/tools/slash-commands) pour les détails actuels des adaptateurs.

Allow-list :

- `agents.list[].subagents.allowAgents` : liste des ids d'agents qui peuvent être ciblés via `agentId` (`["*"]` pour autoriser n'importe lequel). Par défaut : seulement l'agent demandeur.
- `agents.defaults.subagents.allowAgents` : allow-list d'agents cibles par défaut utilisée lorsque l'agent demandeur ne définit pas sa propre valeur `subagents.allowAgents`.
- Garde d'héritage du sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s'exécuteraient sans sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite du profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels ids d'agents sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sub-agent sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut : 60).
- L'archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l'annonce (tout en conservant la transcription via renommage).
- L'archivage automatique est au mieux ; les temporisateurs en attente sont perdus si la gateway redémarre.
- `runTimeoutSeconds` ne déclenche **pas** d'archivage automatique ; il arrête seulement l'exécution. La session reste jusqu'à l'archivage automatique.
- L'archivage automatique s'applique de la même manière aux sessions de profondeur 1 et 2.
- Le nettoyage du navigateur est distinct du nettoyage d'archivage : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l'exécution se termine, même si l'enregistrement de transcription/session est conservé.

## Sub-agents imbriqués

Par défaut, les sub-agents ne peuvent pas lancer leurs propres sub-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d'imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **modèle d'orchestrateur** : principal → sub-agent orchestrateur → sub-sub-agents workers.

### Comment l'activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autorise les sub-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nb max d'enfants actifs par session d'agent (par défaut : 5)
        maxConcurrent: 8, // plafond global de concurrence de la lane (par défaut : 8)
        runTimeoutSeconds: 900, // délai d'expiration par défaut pour sessions_spawn lorsqu'il est omis (0 = pas de délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Depth | Forme de clé de session                      | Rôle                                          | Peut lancer ?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agent principal                               | Toujours                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrateur si profondeur 2 autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker feuille)                | Jamais                       |

### Chaîne d'annonce

Les résultats remontent la chaîne :

1. Le worker de profondeur 2 se termine → annonce à son parent (orchestrateur de profondeur 1)
2. L'orchestrateur de profondeur 1 reçoit l'annonce, synthétise les résultats, se termine → annonce au principal
3. L'agent principal reçoit l'annonce et la distribue à l'utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Consignes opérationnelles :

- Démarrez le travail enfant une seule fois et attendez les événements d'achèvement au lieu de construire des boucles de sondage autour de `sessions_list`, `sessions_history`, `/subagents list` ou des commandes `exec` avec sommeil.
- Si un événement d'achèvement enfant arrive après que vous avez déjà envoyé la réponse finale, le bon suivi est le jeton silencieux exact `NO_REPLY` / `no_reply`.

### Politique d'outils par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de session au moment du lancement. Cela évite que des clés de session plates ou restaurées ne récupèrent accidentellement des privilèges d'orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`)** : obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`)** : aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille)** : aucun outil de session — `sessions_spawn` est toujours refusé en profondeur 2. Ne peut pas lancer d'autres enfants.

### Limite de lancement par agent

Chaque session d'agent (à n'importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (par défaut : 5) enfants actifs à la fois. Cela empêche une prolifération incontrôlée depuis un seul orchestrateur.

### Arrêt en cascade

L'arrêt d'un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et cascade vers leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sub-agent spécifique et cascade vers ses enfants.
- `/subagents kill all` arrête tous les sub-agents du demandeur et cascade.

## Authentification

L'authentification du sub-agent est résolue par **id d'agent**, et non par type de session :

- La clé de session du sub-agent est `agent:<agentId>:subagent:<uuid>`.
- Le stockage d'authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d'authentification de l'agent principal sont fusionnés comme **secours** ; les profils de l'agent remplacent les profils principaux en cas de conflit.

Remarque : la fusion est additive, donc les profils principaux sont toujours disponibles comme secours. Une authentification entièrement isolée par agent n'est pas encore prise en charge.

## Annonce

Les sub-agents remontent leurs résultats via une étape d'annonce :

- L'étape d'annonce s'exécute dans la session du sub-agent (pas dans la session demandeuse).
- Si le sub-agent répond exactement `ANNOUNCE_SKIP`, rien n'est publié.
- Si le dernier texte assistant est exactement le jeton silencieux `NO_REPLY` / `no_reply`, la sortie d'annonce est supprimée même si une progression visible antérieure existait.
- Sinon, la distribution dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel `agent` de suivi avec distribution externe (`deliver=true`)
  - les sessions demandeuses de sub-agent imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l'orchestrateur puisse synthétiser les résultats enfants en session
  - si une session demandeuse de sub-agent imbriquée a disparu, OpenClaw bascule vers le demandeur de cette session lorsque disponible
- Pour les sessions demandeuses de niveau supérieur, la distribution directe en mode achèvement résout d'abord toute route liée à une conversation/un fil et tout remplacement de hook, puis complète les champs cibles de canal manquants à partir de la route stockée de la session demandeuse. Cela maintient les achèvements dans le bon chat/sujet même lorsque l'origine de l'achèvement n'identifie que le canal.
- L'agrégation des achèvements enfants est limitée à l'exécution demandeuse actuelle lors de la construction des constats d'achèvement imbriqués, empêchant que d'anciennes sorties d'enfants d'exécutions précédentes ne fuient dans l'annonce actuelle.
- Les réponses d'annonce préservent le routage de fil/sujet lorsque disponible sur les adaptateurs de canal.
- Le contexte d'annonce est normalisé en un bloc d'événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/id de session enfant
  - type d'annonce + étiquette de tâche
  - ligne d'état dérivée du résultat d'exécution (`success`, `error`, `timeout` ou `unknown`)
  - contenu du résultat sélectionné à partir du dernier texte assistant visible, sinon dernier texte assaini `tool`/`toolResult`
  - une instruction de suivi décrivant quand répondre ou rester silencieux
- `Status` n'est pas déduit de la sortie du modèle ; il provient des signaux de résultat d'exécution.
- En cas de délai d'expiration, si l'enfant n'est allé que jusqu'aux appels d'outil, l'annonce peut condenser cet historique en un court résumé de progression partielle au lieu de rejouer la sortie d'outil brute.

Les charges utiles d'annonce incluent une ligne de statistiques à la fin (même lorsqu'elles sont enveloppées) :

- Runtime (par ex. `runtime 5m12s`)
- Utilisation de tokens (entrée/sortie/total)
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` et chemin de transcription (afin que l'agent principal puisse récupérer l'historique via `sessions_history` ou inspecter le fichier sur disque)
- Les métadonnées internes sont destinées uniquement à l'orchestration ; les réponses visibles par l'utilisateur doivent être réécrites avec une voix d'assistant normale.

`sessions_history` est la voie d'orchestration la plus sûre :

- le rappel assistant est d'abord normalisé :
  - les balises de réflexion sont supprimées
  - les blocs d'échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d'appel d'outil en texte brut tels que `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées qui ne se ferment jamais proprement
  - l'échafaudage dégradé d'appel d'outil/résultat et les marqueurs de contexte historique sont supprimés
  - les jetons de contrôle de modèle divulgués comme `<|assistant|>`, d'autres jetons ASCII `<|...|>` et les variantes pleine largeur `<｜...｜>` sont supprimés
  - le XML d'appel d'outil MiniMax mal formé est supprimé
- le texte de type identifiant/token est caviardé
- les blocs longs peuvent être tronqués
- les historiques très volumineux peuvent supprimer des lignes plus anciennes ou remplacer une ligne trop volumineuse par `[sessions_history omitted: message too large]`
- l'inspection brute de la transcription sur disque reste le recours lorsque vous avez besoin de la transcription complète octet par octet

## Politique d'outils (outils des sub-agents)

Par défaut, les sub-agents obtiennent **tous les outils sauf les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et assainie ; ce n'est pas un dump brut de transcription.

Lorsque `maxSpawnDepth >= 2`, les sub-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs enfants.

Remplacez via la configuration :

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny est prioritaire
        deny: ["gateway", "cron"],
        // si allow est défini, cela devient une allow-list stricte (deny reste prioritaire)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrence

Les sub-agents utilisent une lane de file dédiée dans le processus :

- Nom de la lane : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Arrêt

- L'envoi de `/stop` dans le chat demandeur interrompt la session demandeuse et arrête toutes les exécutions actives de sub-agent lancées depuis celle-ci, avec cascade vers les enfants imbriqués.
- `/subagents kill <id>` arrête un sub-agent spécifique et cascade vers ses enfants.

## Limites

- L'annonce des sub-agents est **au mieux**. Si la gateway redémarre, le travail en attente de « retour d'annonce » est perdu.
- Les sub-agents partagent toujours les mêmes ressources de processus gateway ; traitez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte des sub-agents injecte uniquement `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur maximale d'imbrication est 5 (plage `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d'usage.
- `maxChildrenPerAgent` limite le nombre d'enfants actifs par session (par défaut : 5, plage : 1–20).
