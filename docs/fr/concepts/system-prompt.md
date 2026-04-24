---
read_when:
    - Modifier le texte du prompt système, la liste des outils ou les sections heure/Heartbeat
    - Modifier le bootstrap de l’espace de travail ou le comportement d’injection des Skills
summary: Ce que contient le prompt système OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-24T07:08:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **géré par OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les Plugins fournisseur peuvent ajouter des indications de prompt conscientes du cache sans remplacer
le prompt complet géré par OpenClaw. L’exécution du fournisseur peut :

- remplacer un petit ensemble de sections principales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** sous la limite de cache du prompt

Utilisez les contributions gérées par le fournisseur pour les ajustements spécifiques à une famille de modèles. Conservez la mutation héritée de prompt `before_prompt_build` pour la compatibilité ou de véritables changements globaux de prompt, pas pour le comportement normal d’un fournisseur.

La superposition OpenAI GPT-5 garde la règle d’exécution centrale concise et ajoute
des indications spécifiques au modèle pour l’accrochage à la persona, la sortie concise, la discipline des outils,
les recherches parallèles, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Tooling** : rappel de la source de vérité des outils structurés plus indications d’exécution sur l’utilisation des outils.
- **Execution Bias** : indications compactes de suivi : agir pendant le tour sur
  les requêtes exploitables, continuer jusqu’à la fin ou jusqu’au blocage, récupérer après des résultats d’outil faibles,
  vérifier l’état mutable en direct et valider avant de finaliser.
- **Safety** : court rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger des instructions de skill à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Workspace** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Workspace Files (injected)** : indique que les fichiers bootstrap sont inclus ci-dessous.
- **Sandbox** (lorsqu’elle est activée) : indique l’exécution en sandbox, les chemins de sandbox et si l’exécution élevée est disponible.
- **Current Date & Time** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Reply Tags** : syntaxe facultative de balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Reasoning** : niveau de visibilité actuel + indication sur le basculement `/reasoning`.

La section Tooling inclut également des indications d’exécution pour le travail de longue durée :

- utiliser cron pour les suivis futurs (`check back later`, rappels, travail récurrent)
  au lieu de boucles `exec` avec sommeil, d’astuces de délai `yieldMs` ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil basé sur la poussée lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin du sous-agent est
  pilotée par poussée et s’annonce automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Tooling indique aussi au
modèle de l’utiliser uniquement pour un travail non trivial à plusieurs étapes, de garder exactement une
étape `in_progress` et d’éviter de répéter l’ensemble du plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont indicatifs. Ils orientent le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d’autorisation de canal pour une application forte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt d’exécution indique désormais à l’agent de s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que l’approbation manuelle est la seule voie.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. L’exécution définit un
`promptMode` pour chaque exécution (pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Reply Tags**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (lorsqu’elle est connue), Runtime et le
  contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont étiquetés **Subagent
Context** au lieu de **Group Chat Context**.

## Injection du bootstrap de l’espace de travail

Les fichiers bootstrap sont réduits et ajoutés sous **Project Context** afin que le modèle voie l’identité et le contexte de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les espaces de travail tout neufs)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour sauf
si un contrôle spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou que
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés concis —
en particulier `MEMORY.md`, qui peut grossir avec le temps et conduire à une utilisation du contexte
étonnamment élevée et à une Compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du bootstrap normal
> de Project Context. Lors des tours ordinaires, ils sont consultés à la demande via les
> outils `memory_search` et `memory_get`, donc ils ne comptent pas dans la
> fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et
> `/reset` nus constituent l’exception : l’exécution peut ajouter au début la mémoire quotidienne récente
> comme bloc ponctuel de contexte de démarrage pour ce premier tour.

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu bootstrap injecté total
sur l’ensemble des fichiers est limité par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. En cas de troncature,
OpenClaw peut injecter un bloc d’avertissement dans Project Context ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agents n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers bootstrap
sont filtrés pour garder le contexte du sous-agent réduit).

Des hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers bootstrap injectés (par exemple remplacer `SOUL.md` par une persona alternative).

Si vous voulez rendre l’agent moins générique, commencez par le
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus le surcoût du schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Current Date & Time** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, il inclut désormais uniquement
le **fuseau horaire** (sans horloge dynamique ni format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut éventuellement définir un remplacement de modèle
par session (`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date & Time](/fr/date-time) pour tous les détails de comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque Skill. Le
prompt demande au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (espace de travail, géré ou groupé). Si aucune Skill n’est admissible, la
section Skills est omise.

L’admissibilité inclut les contrôles de métadonnées de Skill, les vérifications d’environnement/configuration d’exécution
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

Cela permet de garder le prompt de base réduit tout en autorisant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système des Skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits d’exécution génériques bornés utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation maintient le dimensionnement des Skills distinct du dimensionnement des lectures/injections d’exécution telles que `memory_get`, les résultats d’outil en direct et les actualisations d’AGENTS.md après Compaction.

## Documentation

Lorsqu’elle est disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de documentation OpenClaw (soit `docs/` dans l’espace de travail du dépôt, soit la documentation groupée du
package npm) et mentionne également le miroir public, le dépôt source, le Discord communautaire et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Le prompt demande au modèle de consulter d’abord la documentation locale
pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter
`openclaw status` lui-même lorsque c’est possible (en ne demandant à l’utilisateur que s’il n’y a pas accès).

## Voir aussi

- [Exécution d’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
