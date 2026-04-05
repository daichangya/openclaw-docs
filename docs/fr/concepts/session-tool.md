---
read_when:
    - Vous souhaitez comprendre quels outils de session l’agent possède
    - Vous souhaitez configurer l’accès inter-sessions ou le lancement de sous-agents
    - Vous souhaitez inspecter le statut ou contrôler des sous-agents lancés
summary: Outils d’agent pour le statut inter-sessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-04-05T12:40:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Outils de session

OpenClaw fournit aux agents des outils pour travailler entre les sessions, inspecter l’état et
orchestrer des sous-agents.

## Outils disponibles

| Outil               | Ce qu’il fait                                                              |
| ------------------- | -------------------------------------------------------------------------- |
| `sessions_list`     | Liste les sessions avec des filtres facultatifs (type, récence)            |
| `sessions_history`  | Lit la transcription d’une session spécifique                              |
| `sessions_send`     | Envoie un message à une autre session et attend éventuellement             |
| `sessions_spawn`    | Lance une session de sous-agent isolée pour un travail en arrière-plan     |
| `sessions_yield`    | Termine le tour en cours et attend les résultats de suivi du sous-agent    |
| `subagents`         | Liste, redirige ou tue les sous-agents lancés pour cette session           |
| `session_status`    | Affiche une carte de style `/status` et peut définir un remplacement de modèle par session |

## Lister et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, type, canal, modèle, comptes
de jetons et horodatages. Filtrez par type (`main`, `group`, `cron`, `hook`,
`node`) ou par récence (`activeMinutes`).

`sessions_history` récupère la transcription de conversation d’une session spécifique.
Par défaut, les résultats d’outil sont exclus -- transmettez `includeTools: true` pour les voir.
La vue renvoyée est volontairement bornée et filtrée pour la sécurité :

- le texte assistant est normalisé avant rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les
    charges utiles tronquées qui ne se ferment jamais correctement
  - l’échafaudage rétrogradé d’appel/résultat d’outil tel que `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` est supprimé
  - les jetons de contrôle du modèle divulgués tels que `<|assistant|>`, les autres jetons ASCII
    `<|...|>` et les variantes pleine largeur `<｜...｜>` sont supprimés
  - les XML mal formés d’appel d’outil MiniMax tels que `<invoke ...>` /
    `</minimax:tool_call>` sont supprimés
- le texte de type identifiants/jetons est expurgé avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent supprimer les lignes plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs récapitulatifs tels que `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **ID de session**
issu d’un appel de liste précédent.

Si vous avez besoin de la transcription exacte octet par octet, inspectez le fichier de transcription sur
le disque au lieu de traiter `sessions_history` comme un dump brut.

## Envoi de messages inter-sessions

`sessions_send` livre un message à une autre session et peut éventuellement attendre
la réponse :

- **Fire-and-forget :** définissez `timeoutSeconds: 0` pour mettre en file et renvoyer
  immédiatement.
- **Attendre une réponse :** définissez un délai d’expiration et obtenez la réponse inline.

Après que la cible a répondu, OpenClaw peut exécuter une **boucle de réponse réciproque** où les
agents alternent les messages (jusqu’à 5 tours). L’agent cible peut répondre
`REPLY_SKIP` pour s’arrêter plus tôt.

## Assistants de statut et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session courante
ou une autre session visible. Il signale l’utilisation, l’heure, l’état du modèle/runtime et
le contexte des tâches en arrière-plan liées lorsqu’il est présent. Comme `/status`, il peut compléter
des compteurs clairsemés de jetons/cache à partir de la dernière entrée d’utilisation de transcription, et
`model=default` efface un remplacement par session.

`sessions_yield` termine intentionnellement le tour en cours afin que le message suivant puisse être
l’événement de suivi que vous attendez. Utilisez-le après avoir lancé des sous-agents lorsque
vous souhaitez que les résultats d’achèvement arrivent comme message suivant au lieu de construire des boucles de sondage.

`subagents` est l’assistant du plan de contrôle pour les sous-agents OpenClaw
déjà lancés. Il prend en charge :

- `action: "list"` pour inspecter les exécutions actives/récentes
- `action: "steer"` pour envoyer des consignes de suivi à un enfant en cours d’exécution
- `action: "kill"` pour arrêter un enfant ou `all`

## Lancement de sous-agents

`sessions_spawn` crée une session isolée pour une tâche en arrière-plan. C’est toujours
non bloquant -- il renvoie immédiatement avec un `runId` et un `childSessionKey`.

Options principales :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents de harnais externes.
- Remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le sandboxing sur l’enfant.

Les sous-agents feuille par défaut n’obtiennent pas d’outils de session. Lorsque
`maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin qu’ils
puissent gérer leurs propres enfants. Les exécutions feuille n’obtiennent toujours pas
d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat sur le canal du demandeur.
La livraison de l’achèvement préserve le routage lié thread/sujet lorsqu’il est disponible, et si
l’origine d’achèvement n’identifie qu’un canal, OpenClaw peut encore réutiliser la route stockée de la
session demandeuse (`lastChannel` / `lastTo`) pour une livraison
directe.

Pour le comportement spécifique à ACP, consultez [ACP Agents](/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Seulement la session courante            |
| `tree`  | Session courante + sous-agents lancés    |
| `agent` | Toutes les sessions pour cet agent       |
| `all`   | Toutes les sessions (inter-agents si configuré) |

La valeur par défaut est `tree`. Les sessions sandboxées sont limitées à `tree` quelle que soit
la configuration.

## Pour aller plus loin

- [Gestion des sessions](/concepts/session) -- routage, cycle de vie, maintenance
- [ACP Agents](/tools/acp-agents) -- lancement de harnais externes
- [Multi-agent](/concepts/multi-agent) -- architecture multi-agent
- [Configuration de la passerelle](/gateway/configuration) -- réglages de configuration des outils de session
