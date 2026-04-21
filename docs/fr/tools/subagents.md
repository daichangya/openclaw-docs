---
read_when:
    - Vous souhaitez un travail en arrière-plan/en parallèle via l’agent
    - Vous modifiez la politique de l’outil `sessions_spawn` ou des sous-agents
    - Vous implémentez ou résolvez des problèmes liés aux sessions de sous-agents liées à un fil de discussion
summary: 'Sous-agents : lancer des exécutions d’agents isolées qui annoncent les résultats dans le chat du demandeur'
title: Sous-agents
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Sous-agents

Les sous-agents sont des exécutions d’agents en arrière-plan lancées à partir d’une exécution d’agent existante. Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de chat du demandeur. Chaque exécution de sous-agent est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents pour la **session en cours** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles de liaison au fil de discussion :

Ces commandes fonctionnent sur les canaux qui prennent en charge des liaisons persistantes aux fils de discussion. Voir **Canaux prenant en charge les fils de discussion** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, identifiant de session, chemin de transcription, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le
chemin de transcription sur le disque lorsque vous avez besoin de la transcription brute complète.

### Comportement du lancement

`/subagents spawn` démarre un sous-agent en arrière-plan comme commande utilisateur, et non comme relais interne, et il envoie une mise à jour finale d’achèvement dans le chat du demandeur lorsque l’exécution se termine.

- La commande de lancement n’est pas bloquante ; elle renvoie immédiatement un identifiant d’exécution.
- À la fin, le sous-agent annonce un message de résumé/résultat dans le canal de chat du demandeur.
- La livraison de fin est basée sur une poussée. Une fois lancé, ne sondez pas `/subagents list`,
  `sessions_list` ou `sessions_history` en boucle juste pour attendre la fin ;
  inspectez l’état uniquement à la demande pour le débogage ou l’intervention.
- À la fin, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce se poursuive.
- Pour les lancements manuels, la livraison est résiliente :
  - OpenClaw essaie d’abord une livraison directe `agent` avec une clé d’idempotence stable.
  - Si la livraison directe échoue, il bascule vers l’acheminement par file d’attente.
  - Si l’acheminement par file d’attente n’est toujours pas disponible, l’annonce est retentée avec un court backoff exponentiel avant l’abandon final.
- La livraison de fin conserve la route du demandeur résolue :
  - les routes de fin liées à un fil ou à une conversation sont prioritaires lorsqu’elles sont disponibles
  - si l’origine de fin ne fournit qu’un canal, OpenClaw complète la cible/le compte manquant à partir de la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne quand même
- Le transfert de fin à la session du demandeur est un contexte interne généré à l’exécution (pas un texte rédigé par l’utilisateur) et inclut :
  - `Result` (dernier texte visible de réponse `assistant`, sinon dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - des statistiques compactes d’exécution/tokens
  - une instruction de livraison indiquant à l’agent demandeur de reformuler avec une voix normale d’assistant (sans transférer les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après la fin.
- `/subagents spawn` est un mode à usage unique (`mode: "run"`). Pour des sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harnais ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et consultez [Agents ACP](/fr/tools/acp-agents).

Objectifs principaux :

- Paralléliser le travail de type « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation de session + isolation facultative).
- Rendre la surface d’outils difficile à mal utiliser : les sous-agents n’obtiennent **pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestration.

Remarque sur le coût : chaque sous-agent possède son **propre** contexte et sa propre consommation de tokens. Pour les
tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents et conservez votre agent principal sur un modèle de meilleure qualité.
Vous pouvez configurer cela via `agents.defaults.subagents.model` ou par remplacements propres à l’agent.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sous-agent (`deliver: false`, file globale : `subagent`)
- Exécute ensuite une étape d’annonce et publie la réponse d’annonce dans le canal de chat du demandeur
- Modèle par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; un `sessions_spawn.model` explicite reste prioritaire.
- Niveau de réflexion par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; un `sessions_spawn.thinking` explicite reste prioritaire.
- Délai d’expiration d’exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` s’il est défini ; sinon, il revient à `0` (pas de délai d’expiration).

Paramètres de l’outil :

- `task` (obligatoire)
- `label?` (facultatif)
- `agentId?` (facultatif ; lancer sous un autre identifiant d’agent si autorisé)
- `model?` (facultatif ; remplace le modèle du sous-agent ; les valeurs non valides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil)
- `thinking?` (facultatif ; remplace le niveau de réflexion pour l’exécution du sous-agent)
- `runTimeoutSeconds?` (par défaut, `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini, sinon `0` ; lorsqu’il est défini, l’exécution du sous-agent est interrompue après N secondes)
- `thread?` (par défaut `false` ; lorsque `true`, demande une liaison au fil de discussion du canal pour cette session de sous-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`
  - `mode: "session"` nécessite `thread: true`
- `cleanup?` (`delete|keep`, valeur par défaut `keep`)
- `sandbox?` (`inherit|require`, valeur par défaut `inherit` ; `require` rejette le lancement sauf si l’environnement d’exécution enfant cible est isolé)
- `sessions_spawn` n’accepte **pas** les paramètres de livraison de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez `message`/`sessions_send` depuis l’exécution lancée.

## Sessions liées à un fil de discussion

Lorsque les liaisons aux fils de discussion sont activées pour un canal, un sous-agent peut rester lié à un fil afin que les messages ultérieurs de l’utilisateur dans ce fil continuent d’être routés vers la même session de sous-agent.

### Canaux prenant en charge les fils de discussion

- Discord (actuellement le seul canal pris en charge) : prend en charge des sessions persistantes de sous-agents liées à un fil (`sessions_spawn` avec `thread: true`), des contrôles manuels des fils (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), et les clés d’adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont routés vers la session liée.
4. Utilisez `/session idle` pour inspecter/mettre à jour le retrait automatique du focus en cas d’inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` lie le fil en cours (ou en crée un) à une cible de sous-agent/session.
- `/unfocus` supprime la liaison pour le fil actuellement lié.
- `/agents` liste les exécutions actives et l’état de liaison (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` fonctionnent uniquement pour les fils liés ayant le focus.

Commutateurs de configuration :

- Valeur par défaut globale : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Les remplacements par canal et les clés de liaison automatique au lancement sont spécifiques à l’adaptateur. Voir **Canaux prenant en charge les fils de discussion** ci-dessus.

Consultez [Référence de configuration](/fr/gateway/configuration-reference) et [Commandes slash](/fr/tools/slash-commands) pour les détails actuels de l’adaptateur.

Liste d’autorisation :

- `agents.list[].subagents.allowAgents` : liste des identifiants d’agents pouvant être ciblés via `agentId` (`["*"]` pour autoriser n’importe lequel). Par défaut : uniquement l’agent demandeur.
- `agents.defaults.subagents.allowAgents` : liste d’autorisation par défaut des agents cibles utilisée lorsque l’agent demandeur ne définit pas sa propre valeur `subagents.allowAgents`.
- Garde de l’héritage de l’isolation : si la session du demandeur est isolée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans isolation.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsque cette valeur est true, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite du profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut : 60).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (tout en conservant la transcription via renommage).
- L’archivage automatique est fait au mieux ; les temporisateurs en attente sont perdus si la Gateway redémarre.
- `runTimeoutSeconds` ne déclenche **pas** l’archivage automatique ; il arrête uniquement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct de l’archivage : les onglets/processus de navigateur suivis sont fermés au mieux à la fin de l’exécution, même si l’enregistrement de session/transcription est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d’imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **modèle d’orchestration** : principal → sous-agent orchestrateur → sous-sous-agents workers.

### Comment l’activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre maximal d’enfants actifs par session d’agent (par défaut : 5)
        maxConcurrent: 8, // limite globale de concurrence de la file (par défaut : 8)
        runTimeoutSeconds: 900, // délai d’expiration par défaut pour sessions_spawn lorsqu’il est omis (0 = aucun délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                     | Rôle                                          | Peut lancer ?                |
| ---------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                           | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                | Sous-agent (orchestrateur si profondeur 2 autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (worker terminal)             | Jamais                       |

### Chaîne d’annonce

Les résultats remontent dans la chaîne :

1. Le worker de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1)
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce au principal
3. L’agent principal reçoit l’annonce et la remet à l’utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Conseils opérationnels :

- Démarrez le travail enfant une fois et attendez les événements de fin au lieu de construire des boucles de sondage
  autour de `sessions_list`, `sessions_history`, `/subagents list` ou
  des commandes `exec` avec temporisation.
- Si un événement de fin d’enfant arrive après que vous avez déjà envoyé la réponse finale,
  le suivi correct est le jeton silencieux exact `NO_REPLY` / `no_reply`.

### Politique des outils par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de la session au moment du lancement. Cela empêche les clés de session aplaties ou restaurées de retrouver accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`)** : obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (terminal, lorsque `maxSpawnDepth == 1`)** : aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker terminal)** : aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Impossible de lancer d’autres enfants.

### Limite de lancement par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (par défaut : 5) enfants actifs en même temps. Cela évite une multiplication incontrôlée à partir d’un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et se propage.

## Authentification

L’authentification des sous-agents est résolue par **identifiant d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **solution de secours** ; les profils de l’agent remplacent ceux du principal en cas de conflit.

Remarque : la fusion est additive, donc les profils du principal sont toujours disponibles comme solutions de secours. Une authentification entièrement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents font remonter l’information via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (et non dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte de l’assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`,
  la sortie d’annonce est supprimée même si une progression visible antérieure existait.
- Sinon, la livraison dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel de suivi `agent` avec livraison externe (`deliver=true`)
  - les sessions sous-agent demandeuses imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants dans la session
  - si une session sous-agent demandeuse imbriquée a disparu, OpenClaw revient vers le demandeur de cette session lorsque c’est possible
- Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode achèvement résout d’abord toute route liée de conversation/fil et toute substitution de hook, puis complète les champs de cible de canal manquants à partir de la route stockée de la session du demandeur. Cela maintient les achèvements dans le bon chat/sujet même lorsque l’origine de l’achèvement n’identifie que le canal.
- L’agrégation des achèvements enfants est limitée à l’exécution demandeuse en cours lors de la construction des résultats d’achèvement imbriqués, empêchant que des sorties d’enfants obsolètes d’exécutions précédentes ne fuitent dans l’annonce en cours.
- Les réponses d’annonce conservent le routage de fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.
- Le contexte d’annonce est normalisé en un bloc d’événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/id de session enfant
  - type d’annonce + étiquette de tâche
  - ligne d’état dérivée du résultat d’exécution (`success`, `error`, `timeout` ou `unknown`)
  - contenu du résultat sélectionné à partir du dernier texte visible de l’assistant, sinon à partir du dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec signalent un statut d’échec sans rejouer le texte de réponse capturé
  - une instruction de suivi décrivant quand répondre ou rester silencieux
- `Status` n’est pas déduit à partir de la sortie du modèle ; il provient des signaux de résultat d’exécution.
- En cas de délai d’expiration, si l’enfant n’a effectué que des appels d’outils, l’annonce peut réduire cet historique à un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont encapsulées) :

- Temps d’exécution (par exemple, `runtime 5m12s`)
- Utilisation des tokens (entrée/sortie/total)
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` et chemin de transcription (afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur le disque)
- Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées à l’utilisateur doivent être réécrites avec une voix normale d’assistant.

`sessions_history` est le chemin d’orchestration le plus sûr :

- le rappel assistant est d’abord normalisé :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges
    tronquées qui ne se ferment jamais correctement
  - l’échafaudage d’appel/résultat d’outil rétrogradé et les marqueurs de contexte historique sont supprimés
  - les jetons de contrôle du modèle divulgués tels que `<|assistant|>`, les autres
    jetons ASCII `<|...|>` et les variantes pleine largeur `<｜...｜>` sont supprimés
  - le XML mal formé d’appel d’outil MiniMax est supprimé
- le texte de type identifiant/token d’accès est masqué
- les blocs longs peuvent être tronqués
- les historiques très volumineux peuvent supprimer les lignes les plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’inspection de la transcription brute sur disque reste la solution de secours lorsque vous avez besoin de la transcription complète octet par octet

## Politique des outils (outils de sous-agents)

Par défaut, les sous-agents obtiennent **tous les outils sauf les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée ; ce n’est pas
un dump brut de transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs enfants.

Remplacement via la configuration :

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
        // si allow est défini, cela devient une liste d’autorisation uniquement (deny reste prioritaire)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrence

Les sous-agents utilisent une file dédiée en cours de processus :

- Nom de la file : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Arrêt

- L’envoi de `/stop` dans le chat du demandeur interrompt la session du demandeur et arrête toutes les exécutions actives de sous-agents lancées depuis celle-ci, avec propagation aux enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.

## Limitations

- L’annonce des sous-agents est **faite au mieux**. Si la Gateway redémarre, le travail en attente de « retour d’annonce » est perdu.
- Les sous-agents partagent toujours les mêmes ressources de processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte du sous-agent n’injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur d’imbrication maximale est de 5 (plage de `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (par défaut : 5, plage : 1–20).
