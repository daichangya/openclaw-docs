---
read_when:
    - Modification du texte du prompt système, de la liste d’outils ou des sections heure/Heartbeat
    - Modification de l’initialisation de l’espace de travail ou du comportement d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-21T06:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt système

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt appartient **à OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins provider peuvent contribuer une guidance de prompt compatible avec le cache sans remplacer
l’intégralité du prompt appartenant à OpenClaw. Le runtime provider peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** sous la limite de cache du prompt

Utilisez les contributions appartenant au provider pour un réglage spécifique à une famille de modèles. Conservez l’ancienne
mutation de prompt `before_prompt_build` pour la compatibilité ou pour des changements de prompt réellement globaux, et non pour le comportement normal d’un provider.

La surcouche de la famille OpenAI GPT-5 conserve la règle d’exécution centrale réduite et ajoute
une guidance spécifique au modèle pour l’ancrage de persona, une sortie concise, la discipline des outils,
la recherche en parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Tooling** : rappel de la source de vérité des outils structurés, plus guidance d’exécution pour l’utilisation des outils.
- **Execution Bias** : guidance compacte de suivi d’exécution : agir dans le tour en cours sur
  les demandes exploitables, continuer jusqu’à terminaison ou blocage, récupérer après des résultats d’outils faibles,
  vérifier l’état mutable en direct et valider avant de finaliser.
- **Safety** : rappel bref des garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger à la demande les instructions des Skills.
- **OpenClaw Self-Update** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer l’intégralité de la
  configuration avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite
  de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les anciens alias `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Workspace** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (repo ou package npm) et quand la lire.
- **Workspace Files (injected)** : indique que les fichiers d’initialisation sont inclus ci-dessous.
- **Sandbox** (lorsqu’il est activé) : indique le runtime sandboxé, les chemins du sandbox et si exec Elevated est disponible.
- **Current Date & Time** : heure locale de l’utilisateur, fuseau horaire et format horaire.
- **Reply Tags** : syntaxe optionnelle des balises de réponse pour les providers pris en charge.
- **Heartbeats** : prompt Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, node, modèle, racine du repo (si détectée), niveau de réflexion (une ligne).
- **Reasoning** : niveau de visibilité actuel + indication sur le basculement `/reasoning`.

La section Tooling inclut aussi une guidance d’exécution pour les travaux de longue durée :

- utiliser Cron pour un suivi ultérieur (`check back later`, rappels, travail récurrent)
  au lieu de boucles de veille avec `exec`, d’astuces de délai avec `yieldMs` ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent de s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’elle produit une sortie ou échoue
- utiliser `process` pour les journaux, le statut, l’entrée ou l’intervention quand il faut
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin du sous-agent est
  pilotée par push et se réannonce automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Tooling indique aussi au
modèle de ne l’utiliser que pour les travaux non triviaux en plusieurs étapes, de conserver exactement une
étape `in_progress` et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de Safety dans le prompt système sont indicatifs. Ils orientent le comportement du modèle mais n’appliquent pas la stratégie. Utilisez la stratégie d’outil, les approbations exec, le sandboxing et les listes d’autorisation de canal pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt d’exécution indique maintenant à l’agent de
s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations dans le chat sont indisponibles ou que
l’approbation manuelle est la seule option.

## Modes de prompt

OpenClaw peut produire des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** et **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quand connue), Runtime, et le
  contexte injecté restent disponibles.
- `none` : ne renvoie que la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Subagent
Context** au lieu de **Group Chat Context**.

## Injection de l’initialisation de l’espace de travail

Les fichiers d’initialisation sont tronqués et ajoutés sous **Project Context** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les espaces de travail tout nouveaux)
- `MEMORY.md` lorsqu’il est présent, sinon `memory.md` comme repli en minuscules

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf
si une condition spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales quand
les Heartbeats sont désactivés pour l’agent par défaut ou quand
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers
injectés concis — en particulier `MEMORY.md`, qui peut grossir avec le temps et entraîner
une utilisation du contexte étonnamment élevée ainsi qu’une Compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du
> Project Context normal de l’initialisation. Lors des tours ordinaires, on y accède à la demande via les
> outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la
> fenêtre de contexte à moins que le modèle ne les lise explicitement. Les tours `/new` et `/reset`
> seuls sont l’exception : le runtime peut préfixer la mémoire quotidienne récente
> comme bloc unique de contexte de démarrage pour ce premier tour.

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu total injecté d’initialisation
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. En cas de troncature,
OpenClaw peut injecter un bloc d’avertissement dans Project Context ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’initialisation
sont filtrés pour conserver un contexte de sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers d’initialisation injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter combien chaque fichier injecté contribue (brut vs injecté, troncature, plus surcharge de schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Current Date & Time** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, elle n’inclut désormais que le
**fuseau horaire** (pas d’horloge dynamique ni de format horaire).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte de statut
inclut une ligne d’horodatage. Le même outil peut aussi définir une surcharge de modèle par session
(`model=default` l’efface).

Configuration :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date & Time](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (workspace, géré ou intégré). Si aucun Skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les conditions des métadonnées du Skill, les vérifications d’environnement/configuration d’exécution,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela permet de garder le prompt de base réduit tout en rendant possible un usage ciblé des Skills.

Le budget de la liste des Skills appartient au sous-système des Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits génériques bornés au runtime utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation permet de dissocier le dimensionnement des Skills de celui des lectures/injections au runtime
comme `memory_get`, les résultats d’outils en direct et les rafraîchissements de `AGENTS.md` après Compaction.

## Documentation

Lorsqu’elle est disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de documentation OpenClaw (soit `docs/` dans le workspace du repo, soit la documentation du
package npm intégré) et mentionne aussi le miroir public, le repo source, le Discord communautaire et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Le prompt indique au modèle de consulter d’abord la documentation locale
pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter
lui-même `openclaw status` quand c’est possible (en ne demandant à l’utilisateur que s’il n’y a pas accès).
