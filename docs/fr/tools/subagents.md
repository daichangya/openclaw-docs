---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan/en parallèle via l’agent
    - Vous modifiez `sessions_spawn` ou la politique de l’outil sous-agent
    - Vous implémentez ou dépannez des sessions de sous-agent liées à un fil de discussion
summary: 'Sous-agents : lancer des exécutions d’agents isolées qui annoncent les résultats en retour dans le chat du demandeur'
title: Sous-agents
x-i18n:
    generated_at: "2026-04-25T18:22:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées depuis une exécution d’agent existante. Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de chat du demandeur. Chaque exécution de sous-agent est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents de la **session actuelle** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles de liaison à un fil :

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons persistantes à un fil. Consultez **Canaux prenant en charge les fils** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, identifiant de session, chemin de transcript, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le
chemin du transcript sur le disque lorsque vous avez besoin du transcript brut complet.

### Comportement de lancement

`/subagents spawn` démarre un sous-agent en arrière-plan comme commande utilisateur, et non comme relais interne, et il envoie une mise à jour finale d’achèvement au chat du demandeur quand l’exécution se termine.

- La commande de lancement est non bloquante ; elle renvoie immédiatement un identifiant d’exécution.
- À la fin, le sous-agent annonce un message de résumé/résultat dans le canal de chat du demandeur.
- La livraison de l’achèvement est basée sur une logique push. Une fois lancé, ne sondez pas `/subagents list`,
  `sessions_list`, ni `sessions_history` en boucle juste pour attendre sa
  fin ; n’inspectez le statut qu’à la demande pour le débogage ou l’intervention.
- À la fin, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce ne continue.
- Pour les lancements manuels, la livraison est résiliente :
  - OpenClaw essaie d’abord une livraison directe `agent` avec une clé d’idempotence stable.
  - Si la livraison directe échoue, il bascule vers le routage par file d’attente.
  - Si le routage par file d’attente n’est toujours pas disponible, l’annonce est réessayée avec un court backoff exponentiel avant l’abandon final.
- La livraison de l’achèvement conserve la route du demandeur résolue :
  - les routes d’achèvement liées à un fil ou à une conversation sont prioritaires lorsqu’elles sont disponibles
  - si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw remplit la cible/le compte manquant depuis la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne toujours
- Le transfert de l’achèvement à la session du demandeur est un contexte interne généré à l’exécution (et non un texte rédigé par l’utilisateur) et inclut :
  - `Result` (le dernier texte visible de réponse `assistant`, sinon le dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - des statistiques compactes d’exécution/tokens
  - une instruction de livraison indiquant à l’agent demandeur de reformuler avec une voix d’assistant normale (et non de transférer les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après l’achèvement.
- `/subagents spawn` est un mode one-shot (`mode: "run"`). Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harness ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et consultez [ACP Agents](/fr/tools/acp-agents), en particulier le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lorsque vous déboguez les achèvements ou les boucles agent-à-agent.

Objectifs principaux :

- Paralléliser les travaux de type « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation de session + sandboxing facultatif).
- Maintenir une surface d’outil difficile à mal utiliser : les sous-agents **n’obtiennent pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les schémas d’orchestration.

Remarque sur le coût : chaque sous-agent possède **son propre** contexte et sa propre consommation de tokens par défaut. Pour les tâches lourdes ou
répétitives, définissez un modèle moins coûteux pour les sous-agents et gardez votre agent principal sur un
modèle de meilleure qualité. Vous pouvez configurer cela via `agents.defaults.subagents.model` ou via des
surcharges par agent. Lorsqu’un enfant a réellement besoin du transcript actuel du demandeur, l’agent peut demander
`context: "fork"` sur ce lancement précis.

## Modes de contexte

Les sous-agents natifs démarrent isolés sauf si l’appelant demande explicitement de forker le
transcript actuel.

| Mode       | Quand l’utiliser                                                                                                                      | Comportement                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche nouvelle, implémentation indépendante, travail avec outil lent, ou tout ce qui peut être décrit dans le texte de la tâche | Crée un transcript enfant propre. C’est la valeur par défaut et cela réduit l’usage des tokens. |
| `fork`     | Travail qui dépend de la conversation actuelle, de résultats d’outils précédents, ou d’instructions nuancées déjà présentes dans le transcript du demandeur | Branche le transcript du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il sert à une délégation sensible au contexte, et non à remplacer
la rédaction d’un prompt de tâche clair.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sous-agent (`deliver: false`, voie globale : `subagent`)
- Exécute ensuite une étape d’annonce et publie la réponse d’annonce dans le canal de chat du demandeur
- Modèle par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; une valeur explicite de `sessions_spawn.model` reste prioritaire.
- Thinking par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; une valeur explicite de `sessions_spawn.thinking` reste prioritaire.
- Timeout d’exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il retombe à `0` (pas de timeout).

Paramètres de l’outil :

- `task` (obligatoire)
- `label?` (facultatif)
- `agentId?` (facultatif ; lancer sous un autre identifiant d’agent si cela est autorisé)
- `model?` (facultatif ; remplace le modèle du sous-agent ; les valeurs invalides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil)
- `thinking?` (facultatif ; remplace le niveau de thinking pour l’exécution du sous-agent)
- `runTimeoutSeconds?` (par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini, sinon `0` ; lorsqu’il est défini, l’exécution du sous-agent est abandonnée après N secondes)
- `thread?` (par défaut `false` ; lorsque `true`, demande une liaison à un fil de canal pour cette session de sous-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, valeur par défaut `keep`)
- `sandbox?` (`inherit|require`, valeur par défaut `inherit` ; `require` rejette le lancement sauf si le runtime enfant cible est sandboxé)
- `context?` (`isolated|fork`, valeur par défaut `isolated` ; sous-agents natifs uniquement)
  - `isolated` crée un transcript enfant propre et constitue la valeur par défaut.
  - `fork` branche le transcript actuel du demandeur dans la session enfant afin que l’enfant démarre avec le même contexte de conversation.
  - Utilisez `fork` uniquement lorsque l’enfant a besoin du transcript actuel. Pour un travail ciblé, omettez `context`.
- `sessions_spawn` n’accepte **pas** les paramètres de livraison de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez `message`/`sessions_send` depuis l’exécution lancée.

## Sessions liées à un fil

Lorsque les liaisons à un fil sont activées pour un canal, un sous-agent peut rester lié à un fil afin que les messages utilisateur suivants dans ce fil continuent d’être routés vers la même session de sous-agent.

### Canaux prenant en charge les fils

- Discord (actuellement le seul canal pris en charge) : prend en charge les sessions persistantes de sous-agent liées à un fil (`sessions_spawn` avec `thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), et les clés d’adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont routés vers la session liée.
4. Utilisez `/session idle` pour inspecter/mettre à jour le retrait automatique du focus après inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` lie le fil actuel (ou en crée un) à une cible de sous-agent/session.
- `/unfocus` supprime la liaison du fil actuellement lié.
- `/agents` liste les exécutions actives et l’état de liaison (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` ne fonctionnent que pour les fils liés ayant le focus.

Commutateurs de configuration :

- Valeur par défaut globale : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Les clés de surcharge par canal et de liaison automatique au lancement sont spécifiques à l’adaptateur. Consultez **Canaux prenant en charge les fils** ci-dessus.

Consultez [Configuration Reference](/fr/gateway/configuration-reference) et [Commandes slash](/fr/tools/slash-commands) pour les détails actuels de l’adaptateur.

Liste d’autorisation :

- `agents.list[].subagents.allowAgents` : liste des identifiants d’agent qui peuvent être ciblés via `agentId` (`["*"]` pour autoriser n’importe lequel). Par défaut : seul l’agent demandeur.
- `agents.defaults.subagents.allowAgents` : liste d’autorisation par défaut des agents cibles utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
- Garde d’héritage du sandbox : si la session du demandeur est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsque cette valeur est vraie, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite d’un profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels identifiants d’agent sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut : 60).
- L’archivage utilise `sessions.delete` et renomme le transcript en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (tout en conservant le transcript via renommage).
- L’archivage automatique est effectué au mieux ; les timers en attente sont perdus si le gateway redémarre.
- `runTimeoutSeconds` **ne** déclenche **pas** d’archivage automatique ; il arrête seulement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archivage : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si le transcript/l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d’imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **schéma d’orchestration** : principal → sous-agent orchestrateur → sous-sous-agents workers.

### Comment l’activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre maximal d’enfants actifs par session d’agent (par défaut : 5)
        maxConcurrent: 8, // plafond global de concurrence de la voie (par défaut : 8)
        runTimeoutSeconds: 900, // timeout par défaut pour sessions_spawn lorsqu’il est omis (0 = pas de timeout)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                     | Rôle                                          | Peut lancer ?                |
| ---------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                           | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                | Sous-agent (orchestrateur quand la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (worker feuille)              | Jamais                       |

### Chaîne d’annonce

Les résultats remontent dans la chaîne :

1. Le worker de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1)
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce à l’agent principal
3. L’agent principal reçoit l’annonce et la livre à l’utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Conseils opérationnels :

- Démarrez le travail enfant une seule fois et attendez les événements d’achèvement au lieu de construire des boucles de sondage autour de `sessions_list`, `sessions_history`, `/subagents list`, ou des commandes `exec` avec sleep.
- `sessions_list` et `/subagents list` gardent les relations de sessions enfants centrées sur le travail en cours :
  les enfants actifs restent attachés, les enfants terminés restent visibles pendant une
  courte fenêtre récente, et les liens enfants obsolètes présents seulement dans le store sont ignorés après leur
  fenêtre de fraîcheur. Cela évite que d’anciennes métadonnées `spawnedBy` / `parentSessionKey`
  ne ressuscitent des enfants fantômes après un redémarrage.
- Si un événement d’achèvement enfant arrive après que vous avez déjà envoyé la réponse finale,
  le bon suivi est le token silencieux exact `NO_REPLY` / `no_reply`.

### Politique d’outil par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de session au moment du lancement. Cela évite que des clés de session aplaties ou restaurées ne récupèrent accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, quand `maxSpawnDepth >= 2`)** : obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent interdits.
- **Profondeur 1 (feuille, quand `maxSpawnDepth == 1`)** : aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille)** : aucun outil de session — `sessions_spawn` est toujours interdit à la profondeur 2. Impossible de lancer d’autres enfants.

### Limite de lancement par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (par défaut : 5) enfants actifs à la fois. Cela empêche une expansion incontrôlée depuis un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et se propage.

## Authentification

L’authentification du sous-agent est résolue par **identifiant d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **solution de secours** ; les profils d’agent remplacent les profils principaux en cas de conflit.

Remarque : la fusion est additive, donc les profils principaux restent toujours disponibles comme solutions de secours. Une authentification totalement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (et non dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte assistant est le token silencieux exact `NO_REPLY` / `no_reply`,
  la sortie de l’annonce est supprimée même s’il y a eu auparavant une progression visible.
- Sinon, la livraison dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel de suivi `agent` avec livraison externe (`deliver=true`)
  - les sessions de sous-agent demandeuses imbriquées reçoivent une injection interne de suivi (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants dans la session
  - si une session de sous-agent demandeuse imbriquée a disparu, OpenClaw se replie sur le demandeur de cette session lorsque c’est possible
- Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode achèvement résout d’abord toute route de conversation/fil liée et toute surcharge de hook, puis remplit les champs manquants de cible de canal depuis la route stockée de la session du demandeur. Cela maintient les achèvements dans le bon chat/topic même lorsque l’origine de l’achèvement n’identifie que le canal.
- L’agrégation des achèvements enfants est limitée à l’exécution actuelle du demandeur lors de la construction des résultats d’achèvement imbriqués, ce qui empêche les sorties d’enfants d’anciennes exécutions obsolètes de fuir dans l’annonce actuelle.
- Les réponses d’annonce préservent le routage de fil/topic lorsque disponible sur les adaptateurs de canaux.
- Le contexte d’annonce est normalisé en un bloc d’événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/id de session enfant
  - type d’annonce + libellé de tâche
  - ligne de statut dérivée du résultat d’exécution (`success`, `error`, `timeout`, ou `unknown`)
  - contenu du résultat sélectionné à partir du dernier texte assistant visible, sinon du dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec signalent un statut d’échec sans rejouer le texte de réponse capturé
  - une instruction de suivi décrivant quand répondre ou rester silencieux
- `Status` n’est pas déduit de la sortie du modèle ; il provient des signaux du résultat d’exécution.
- En cas de timeout, si l’enfant n’a effectué que des appels d’outils, l’annonce peut réduire cet historique à un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

Les payloads d’annonce incluent une ligne de statistiques à la fin (même lorsqu’ils sont encapsulés) :

- Runtime (par exemple `runtime 5m12s`)
- Utilisation des tokens (entrée/sortie/total)
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, et chemin du transcript (afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque)
- Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées aux utilisateurs doivent être réécrites avec une voix d’assistant normale.

`sessions_history` est le chemin d’orchestration le plus sûr :

- le rappel assistant est normalisé en premier :
  - les balises de thinking sont supprimées
  - les blocs de structure `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de payload XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, et
    `<function_calls>...</function_calls>` sont supprimés, y compris les
    payloads tronqués qui ne se ferment jamais proprement
  - la structure dégradée d’appel/résultat d’outil et les marqueurs de contexte historique sont supprimés
  - les tokens de contrôle du modèle qui ont fuité, comme `<|assistant|>`, les autres tokens ASCII
    `<|...|>`, et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML d’appel d’outil MiniMax mal formé est supprimé
- le texte de type identifiant/jeton d’accès est masqué
- les longs blocs peuvent être tronqués
- les historiques très volumineux peuvent supprimer les lignes les plus anciennes ou remplacer une ligne trop volumineuse par
  `[sessions_history omitted: message too large]`
- l’inspection brute du transcript sur disque est la solution de repli lorsque vous avez besoin du transcript complet octet par octet

## Politique d’outil (outils de sous-agent)

Les sous-agents utilisent d’abord le même profil et le même pipeline de politique d’outil que le parent ou l’agent
cible. Ensuite, OpenClaw applique la couche de restriction des sous-agents.

Sans `tools.profile` restrictif, les sous-agents obtiennent **tous les outils sauf les outils de session**
et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée ; ce n’est
pas un dump brut du transcript.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list`, et `sessions_history` afin de pouvoir gérer leurs enfants.

Remplacement via la configuration :

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
        // si allow est défini, cela devient un filtre allow-only (deny reste prioritaire)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final allow-only. Il peut restreindre le
jeu d’outils déjà résolu, mais il ne peut pas rétablir un outil supprimé par
`tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch`, mais pas l’outil `browser`. Pour permettre aux sous-agents
du profil coding d’utiliser l’automatisation du navigateur, ajoutez browser au niveau du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` par agent lorsque seul un agent
doit obtenir l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une voie de file d’attente dédiée dans le processus :

- Nom de la voie : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Vivacité et reprise

OpenClaw ne traite pas l’absence de `endedAt` comme une preuve permanente qu’un sous-agent
est toujours vivant. Les exécutions non terminées plus anciennes que la fenêtre des exécutions obsolètes cessent d’être comptées comme
actives/en attente dans `/subagents list`, les résumés de statut, la logique de blocage d’achèvement
des descendants, et les vérifications de concurrence par session.

Après un redémarrage du gateway, les exécutions restaurées obsolètes non terminées sont éliminées sauf si leur
session enfant est marquée `abortedLastRun: true`. Ces sessions enfants
interrompues au redémarrage restent récupérables via le flux de récupération des orphelins de sous-agent, qui
envoie un message de reprise synthétique avant de supprimer le marqueur d’interruption.

## Arrêt

- L’envoi de `/stop` dans le chat du demandeur abandonne la session du demandeur et arrête toutes les exécutions de sous-agent actives lancées depuis celle-ci, avec propagation aux enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.

## Limites

- L’annonce du sous-agent est effectuée **au mieux**. Si le gateway redémarre, les travaux en attente de type « annoncer en retour » sont perdus.
- Les sous-agents partagent toujours les mêmes ressources de processus gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte du sous-agent n’injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, ni `BOOTSTRAP.md`).
- La profondeur d’imbrication maximale est 5 (plage `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (par défaut : 5, plage : 1–20).

## Liens associés

- [ACP agents](/fr/tools/acp-agents)
- [Outils sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [Envoi d’agent](/fr/tools/agent-send)
