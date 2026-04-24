---
read_when:
    - Vous souhaitez comprendre quels outils de session l’agent possède
    - Vous souhaitez configurer l’accès intersession ou le lancement de sous-agents
    - Vous souhaitez inspecter l’état ou contrôler les sous-agents lancés
summary: Outils d’agent pour le statut intersession, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-04-24T07:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw donne aux agents des outils pour travailler entre les sessions, inspecter l’état et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu’il fait                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Lister les sessions avec des filtres facultatifs (type, libellé, agent, récence, aperçu) |
| `sessions_history` | Lire la transcription d’une session spécifique                             |
| `sessions_send`    | Envoyer un message à une autre session et éventuellement attendre          |
| `sessions_spawn`   | Lancer une session de sous-agent isolée pour du travail en arrière-plan    |
| `sessions_yield`   | Terminer le tour courant et attendre les résultats de suivi des sous-agents |
| `subagents`        | Lister, infléchir ou tuer les sous-agents lancés pour cette session        |
| `session_status`   | Afficher une carte de type `/status` et éventuellement définir une surcharge de modèle par session |

## Lister et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, `agentId`, type, canal, modèle,
compteurs de jetons et horodatages. Filtrez par type (`main`, `group`, `cron`, `hook`,
`node`), `label` exact, `agentId` exact, texte de recherche ou récence
(`activeMinutes`). Lorsque vous avez besoin d’un triage de type boîte mail, il peut aussi
demander un titre dérivé limité par visibilité, un extrait d’aperçu du dernier message, ou
des messages récents bornés sur chaque ligne. Les titres dérivés et aperçus ne sont produits que pour
les sessions que l’appelant peut déjà voir selon la politique de visibilité configurée des
outils de session, afin que les sessions sans rapport restent cachées.

`sessions_history` récupère la transcription de conversation d’une session spécifique.
Par défaut, les résultats d’outils sont exclus -- passez `includeTools: true` pour les voir.
La vue renvoyée est intentionnellement bornée et filtrée pour la sécurité :

- le texte de l’assistant est normalisé avant rappel :
  - les balises de thinking sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées
    qui ne se ferment jamais proprement
  - les échafaudages d’appel/résultat d’outil rétrogradés tels que `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` sont supprimés
  - les jetons de contrôle de modèle divulgués tels que `<|assistant|>`, d’autres jetons ASCII
    `<|...|>`, et les variantes pleine largeur `<｜...｜>` sont supprimés
  - les XML d’appel d’outil MiniMax mal formés tels que `<invoke ...>` /
    `</minimax:tool_call>` sont supprimés
- les textes ressemblant à des identifiants/jetons sont masqués avant d’être renvoyés
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent supprimer les lignes plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs récapitulatifs tels que `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **ID de session**
issu d’un appel précédent à list.

Si vous avez besoin de la transcription exacte octet pour octet, inspectez le fichier de transcription sur
le disque au lieu de considérer `sessions_history` comme un dump brut.

## Envoi de messages intersessions

`sessions_send` remet un message à une autre session et peut éventuellement attendre
la réponse :

- **Fire-and-forget :** définissez `timeoutSeconds: 0` pour mettre en file et revenir
  immédiatement.
- **Attendre la réponse :** définissez un délai et récupérez la réponse en ligne.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponse en retour** où les
agents alternent les messages (jusqu’à 5 tours). L’agent cible peut répondre
`REPLY_SKIP` pour s’arrêter plus tôt.

## Helpers d’état et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session courante
ou une autre session visible. Il signale l’usage, le temps, l’état du modèle/runtime et
le contexte lié des tâches en arrière-plan lorsqu’il est présent. Comme `/status`, il peut compléter
des compteurs clairsemés de jetons/cache à partir de la dernière entrée d’usage de la transcription, et
`model=default` efface une surcharge par session.

`sessions_yield` termine intentionnellement le tour courant afin que le message suivant puisse être
l’événement de suivi que vous attendez. Utilisez-le après avoir lancé des sous-agents lorsque
vous voulez que les résultats d’achèvement arrivent comme message suivant au lieu de construire
des boucles de polling.

`subagents` est le helper de plan de contrôle pour les sous-agents OpenClaw
déjà lancés. Il prend en charge :

- `action: "list"` pour inspecter les exécutions actives/récentes
- `action: "steer"` pour envoyer des consignes de suivi à un enfant en cours d’exécution
- `action: "kill"` pour arrêter un enfant ou `all`

## Lancement de sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche d’arrière-plan.
Elle est toujours non bloquante -- elle renvoie immédiatement un `runId` et une
`childSessionKey`.

Options clés :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents à harnais externes.
- surcharges `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer la sandbox à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la
  transcription du demandeur courant ; omettez-le ou utilisez `context: "isolated"` pour un enfant propre.

Les sous-agents leaf par défaut n’obtiennent pas les outils de session. Lorsque
`maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin qu’ils
puissent gérer leurs propres enfants. Les exécutions leaf ne reçoivent toujours pas
d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat sur le canal du demandeur.
La livraison d’achèvement préserve le routage lié par fil/sujet lorsqu’il est disponible, et si
l’origine d’achèvement n’identifie qu’un canal, OpenClaw peut toujours réutiliser la route stockée de la session demandeuse (`lastChannel` / `lastTo`) pour une
livraison directe.

Pour le comportement spécifique à ACP, voir [Agents ACP](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Seulement la session courante            |
| `tree`  | Session courante + sous-agents lancés    |
| `agent` | Toutes les sessions pour cet agent       |
| `all`   | Toutes les sessions (inter-agents si configuré) |

La valeur par défaut est `tree`. Les sessions sandboxées sont limitées à `tree` quelle que soit la
configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [Agents ACP](/fr/tools/acp-agents) -- lancement via harnais externes
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agents
- [Configuration du Gateway](/fr/gateway/configuration) -- réglages de configuration des outils de session

## Articles connexes

- [Gestion des sessions](/fr/concepts/session)
- [Nettoyage des sessions](/fr/concepts/session-pruning)
