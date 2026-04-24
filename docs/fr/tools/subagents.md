---
read_when:
    - Vous souhaitez exécuter du travail en arrière-plan/en parallèle via l’agent to=final code  omitted
    - Vous modifiez `sessions_spawn` ou la politique d’outils des sous-agents to=final code  դարձ string data="You need detached work to wake the original chat or heartbeat session after completion"
    - Vous implémentez ou dépannez des sessions de sous-agents liées à des fils to=final code  omitted
summary: 'Sous-agents : lancer des exécutions d’agent isolées qui annoncent les résultats dans le chat demandeur'
title: Sous-agents
x-i18n:
    generated_at: "2026-04-24T07:38:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées depuis une exécution d’agent existante. Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de chat du demandeur. Chaque exécution de sous-agent est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

## Slash command

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents de la **session actuelle** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles de liaison aux fils :

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons de fil persistantes. Voir **Canaux prenant en charge les fils** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, ID de session, chemin du transcript, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le
chemin du transcript sur disque lorsque vous avez besoin du transcript brut complet.

### Comportement de lancement

`/subagents spawn` démarre un sous-agent en arrière-plan en tant que commande utilisateur, et il envoie une mise à jour finale d’achèvement dans le chat du demandeur une fois l’exécution terminée.

- La commande de lancement est non bloquante ; elle renvoie immédiatement un ID d’exécution.
- À l’achèvement, le sous-agent annonce un message de résumé/résultat dans le canal de chat du demandeur.
- L’achèvement est piloté par notification. Une fois lancé, ne bouclez pas sur `/subagents list`,
  `sessions_list` ou `sessions_history` juste pour attendre sa fin ; inspectez le statut uniquement
  à la demande pour le débogage ou l’intervention.
- À l’achèvement, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage d’annonce ne se poursuive.
- Pour les lancements manuels, la livraison est résiliente :
  - OpenClaw tente d’abord une livraison directe `agent` avec une clé d’idempotence stable.
  - Si la livraison directe échoue, il revient au routage par file d’attente.
  - Si le routage par file d’attente reste indisponible, l’annonce est retentée avec un court backoff exponentiel avant abandon définitif.
- La livraison d’achèvement conserve la route demandeuse résolue :
  - les routes d’achèvement liées à un fil ou à une conversation sont prioritaires lorsqu’elles sont disponibles
  - si l’origine d’achèvement ne fournit qu’un canal, OpenClaw remplit la cible/le compte manquant à partir de la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe continue de fonctionner
- Le transfert d’achèvement vers la session du demandeur est un contexte interne généré par le runtime (et non un texte rédigé par l’utilisateur) et inclut :
  - `Result` (dernier texte visible de réponse `assistant`, sinon dernier texte `tool/toolResult` nettoyé ; les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiques compactes runtime/jetons
  - une instruction de livraison indiquant à l’agent demandeur de réécrire le contenu avec une voix normale d’assistant (et non de transférer les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après l’achèvement.
- `/subagents spawn` est en mode one-shot (`mode: "run"`). Pour des sessions persistantes liées à des fils, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harnais ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et consultez [Agents ACP](/fr/tools/acp-agents), en particulier le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage d’achèvements ou de boucles agent-à-agent.

Objectifs principaux :

- Paralléliser le travail de type « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation de session + sandboxing facultatif).
- Garder la surface d’outils difficile à mal utiliser : les sous-agents **n’obtiennent pas** les outils de session par défaut.
- Prendre en charge une profondeur de nesting configurable pour les modèles d’orchestration.

Remarque sur le coût : chaque sous-agent a **son propre** contexte et sa propre consommation de jetons par défaut. Pour les tâches lourdes ou
répétitives, définissez un modèle moins coûteux pour les sous-agents et gardez votre agent principal sur un
modèle de meilleure qualité. Vous pouvez configurer cela via `agents.defaults.subagents.model` ou des
remplacements par agent. Lorsqu’un enfant a réellement besoin du transcript courant du demandeur, l’agent peut demander
`context: "fork"` sur ce lancement spécifique.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sous-agent (`deliver: false`, lane globale : `subagent`)
- Exécute ensuite une étape d’annonce et publie la réponse d’annonce dans le canal de chat du demandeur
- Modèle par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; une valeur explicite `sessions_spawn.model` reste prioritaire.
- Thinking par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; une valeur explicite `sessions_spawn.thinking` reste prioritaire.
- Délai d’exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` s’il est défini ; sinon il revient à `0` (pas de délai).

Paramètres de l’outil :

- `task` (requis)
- `label?` (facultatif)
- `agentId?` (facultatif ; lancer sous un autre ID d’agent si autorisé)
- `model?` (facultatif ; remplace le modèle du sous-agent ; les valeurs invalides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil)
- `thinking?` (facultatif ; remplace le niveau de réflexion pour l’exécution du sous-agent)
- `runTimeoutSeconds?` (par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini, sinon `0` ; lorsqu’il est défini, l’exécution du sous-agent est interrompue après N secondes)
- `thread?` (par défaut `false` ; lorsque `true`, demande une liaison à un fil de canal pour cette session de sous-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`
  - `mode: "session"` nécessite `thread: true`
- `cleanup?` (`delete|keep`, par défaut `keep`)
- `sandbox?` (`inherit|require`, par défaut `inherit` ; `require` rejette le lancement sauf si le runtime enfant cible est sandboxé)
- `context?` (`isolated|fork`, par défaut `isolated` ; sous-agents natifs uniquement)
  - `isolated` crée un transcript enfant propre et constitue la valeur par défaut.
  - `fork` branche le transcript courant du demandeur dans la session enfant afin que l’enfant démarre avec le même contexte de conversation.
  - Utilisez `fork` uniquement lorsque l’enfant a besoin du transcript courant. Pour un travail ciblé, omettez `context`.
- `sessions_spawn` n’accepte **pas** de paramètres de livraison de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez `message`/`sessions_send` depuis l’exécution lancée.

## Sessions liées à des fils

Lorsque les liaisons de fil sont activées pour un canal, un sous-agent peut rester lié à un fil afin que les messages utilisateur de suivi dans ce fil continuent d’être routés vers la même session de sous-agent.

### Canaux prenant en charge les fils

- Discord (actuellement le seul canal pris en charge) : prend en charge les sessions persistantes de sous-agent liées à des fils (`sessions_spawn` avec `thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), et les clés d’adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont routés vers la session liée.
4. Utilisez `/session idle` pour inspecter/mettre à jour le désancrage automatique sur inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` lie le fil courant (ou en crée un) à une cible de sous-agent/session.
- `/unfocus` retire la liaison du fil actuellement lié.
- `/agents` liste les exécutions actives et l’état des liaisons (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` ne fonctionnent que pour les fils liés ciblés.

Commutateurs de configuration :

- Valeur globale par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Les remplacements de canal et les clés d’auto-liaison au lancement sont spécifiques à l’adaptateur. Voir **Canaux prenant en charge les fils** ci-dessus.

Consultez [Référence de configuration](/fr/gateway/configuration-reference) et [Slash commands](/fr/tools/slash-commands) pour les détails actuels des adaptateurs.

Liste d’autorisation :

- `agents.list[].subagents.allowAgents` : liste des ID d’agent pouvant être ciblés via `agentId` (`["*"]` pour autoriser n’importe lequel). Par défaut : uniquement l’agent demandeur.
- `agents.defaults.subagents.allowAgents` : liste d’autorisation d’agent cible par défaut utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
- Garde d’héritage de sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsque true, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite de profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels ID d’agent sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut : 60).
- L’archivage utilise `sessions.delete` et renomme le transcript en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (le transcript est tout de même conservé via renommage).
- L’archivage automatique se fait au mieux ; les temporisateurs en attente sont perdus si le gateway redémarre.
- `runTimeoutSeconds` ne déclenche **pas** l’archivage automatique ; il ne fait qu’arrêter l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique aussi bien aux sessions de profondeur 1 qu’à celles de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archivage : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si l’enregistrement transcript/session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d’imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **modèle d’orchestration** : principal → sous-agent orchestrateur → sous-sous-agents workers.

### Comment l’activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre max d’enfants actifs par session d’agent (par défaut : 5)
        maxConcurrent: 8, // plafond global de concurrence de la lane (par défaut : 8)
        runTimeoutSeconds: 900, // délai par défaut pour sessions_spawn lorsqu’il est omis (0 = pas de délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                        | Rôle                                          | Peut lancer ?               |
| ---------- | ---------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0          | `agent:<id>:main`                              | Agent principal                               | Toujours                    |
| 1          | `agent:<id>:subagent:<uuid>`                   | Sous-agent (orchestrateur si profondeur 2 autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Sous-sous-agent (worker feuille)              | Jamais                      |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. Le worker de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1)
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce au principal
3. L’agent principal reçoit l’annonce et livre à l’utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Conseils opérationnels :

- Démarrez le travail enfant une seule fois et attendez les événements d’achèvement au lieu de construire des boucles de polling autour de `sessions_list`, `sessions_history`, `/subagents list`, ou de commandes `exec` avec `sleep`.
- Si un événement d’achèvement enfant arrive après que vous avez déjà envoyé la réponse finale, le bon suivi est exactement le jeton silencieux `NO_REPLY` / `no_reply`.

### Politique d’outils par profondeur

- Le rôle et le périmètre de contrôle sont écrits dans les métadonnées de session au moment du lancement. Cela empêche que des clés de session plates ou restaurées ne récupèrent accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`)** : obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`)** : aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille)** : aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Ne peut pas lancer d’autres enfants.

### Limite de lancement par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (par défaut : 5) enfants actifs à la fois. Cela empêche un fan-out incontrôlé depuis un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et se propage.

## Authentification

L’authentification des sous-agents est résolue par **ID d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **repli** ; les profils de l’agent remplacent les profils principaux en cas de conflit.

Remarque : la fusion est additive, donc les profils principaux restent toujours disponibles comme replis. Une authentification totalement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents renvoient leurs résultats via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (et non dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte assistant est exactement le jeton silencieux `NO_REPLY` / `no_reply`,
  la sortie d’annonce est supprimée même si une progression visible existait auparavant.
- Sinon, la livraison dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`)
  - les sessions demandeuses imbriquées de sous-agent reçoivent une injection interne de suivi (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfant dans la session
  - si une session demandeuse imbriquée de sous-agent n’existe plus, OpenClaw revient vers le demandeur de cette session lorsque c’est possible
- Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode achèvement résout d’abord toute route liée à une conversation/un fil et tout remplacement de hook, puis remplit les champs de cible de canal manquants à partir de la route stockée de la session demandeuse. Cela garde les achèvements dans le bon chat/sujet même lorsque l’origine d’achèvement n’identifie que le canal.
- L’agrégation des achèvements enfants est limitée à l’exécution demandeuse actuelle lors de la construction des constats d’achèvement imbriqués, empêchant que des sorties d’enfants d’exécutions précédentes n’apparaissent dans l’annonce actuelle.
- Les réponses d’annonce conservent le routage fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.
- Le contexte d’annonce est normalisé en un bloc d’événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/ID de session enfant
  - type d’annonce + libellé de tâche
  - ligne de statut dérivée du résultat runtime (`success`, `error`, `timeout`, ou `unknown`)
  - contenu du résultat sélectionné à partir du dernier texte assistant visible, sinon dernier texte `tool/toolResult` nettoyé ; les exécutions terminales en échec rapportent un statut d’échec sans rejouer le texte de réponse capturé
  - une instruction de suivi décrivant quand répondre et quand rester silencieux
- `Status` n’est pas déduit de la sortie du modèle ; il provient des signaux de résultat runtime.
- En cas de délai dépassé, si l’enfant n’a fait que des appels d’outils, l’annonce peut condenser cet historique en un bref résumé de progression partielle au lieu de rejouer la sortie brute des outils.

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont encapsulées) :

- Runtime (par exemple `runtime 5m12s`)
- Utilisation des jetons (entrée/sortie/total)
- Coût estimé lorsque le pricing du modèle est configuré (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, et chemin du transcript (afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque)
- Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées à l’utilisateur doivent être réécrites avec une voix normale d’assistant.

`sessions_history` est le chemin d’orchestration le plus sûr :

- le rappel assistant est normalisé d’abord :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges
    tronquées qui ne se ferment jamais proprement
  - les échafaudages d’appel/résultat d’outil rétrogradés et les marqueurs de contexte historique sont supprimés
  - les jetons de contrôle de modèle divulgués tels que `<|assistant|>`, les autres
    jetons ASCII `<|...|>`, et les variantes pleine largeur `<｜...｜>` sont supprimés
  - le XML d’appel d’outil MiniMax mal formé est supprimé
- le texte ressemblant à des identifiants/secrets est caviardé
- les longs blocs peuvent être tronqués
- les historiques très volumineux peuvent supprimer des lignes anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’inspection brute du transcript sur disque est le repli lorsque vous avez besoin du transcript complet octet par octet

## Politique d’outils (outils de sous-agent)

Par défaut, les sous-agents obtiennent **tous les outils sauf les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée ; ce n’est
pas un dump brut du transcript.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list`, et `sessions_history` afin de pouvoir gérer leurs enfants.

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrence

Les sous-agents utilisent une lane de file dédiée dans le processus :

- Nom de la lane : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Arrêt

- Envoyer `/stop` dans le chat du demandeur interrompt la session du demandeur et arrête toute exécution active de sous-agent lancée depuis celle-ci, avec propagation aux enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.

## Limitations

- L’annonce des sous-agents fonctionne **au mieux**. Si le gateway redémarre, le travail en attente de « retour d’annonce » est perdu.
- Les sous-agents partagent toujours les mêmes ressources de processus gateway ; traitez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte des sous-agents n’injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, ni `BOOTSTRAP.md`).
- La profondeur maximale d’imbrication est de 5 (`maxSpawnDepth` : plage 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` plafonne le nombre d’enfants actifs par session (par défaut : 5, plage : 1–20).

## Associé

- [Agents ACP](/fr/tools/acp-agents)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [Agent send](/fr/tools/agent-send)
