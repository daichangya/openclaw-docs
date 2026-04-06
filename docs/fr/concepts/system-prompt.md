---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections heure/heartbeat
    - Modification du bootstrap de l'espace de travail ou du comportement d'injection des Skills
summary: Ce que contient le prompt système d'OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-06T03:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt système

OpenClaw construit un prompt système personnalisé pour chaque exécution d'agent. Le prompt appartient à **OpenClaw** et n'utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d'agent.

Les plugins de fournisseur peuvent contribuer des indications de prompt sensibles au cache sans remplacer
l'intégralité du prompt appartenant à OpenClaw. L'environnement d'exécution du fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** en dessous de la limite de cache du prompt

Utilisez des contributions appartenant au fournisseur pour les ajustements spécifiques à une famille de modèles. Conservez la mutation héritée du prompt `before_prompt_build` pour la compatibilité ou pour de véritables changements globaux du prompt, pas pour le comportement normal d'un fournisseur.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Tooling** : rappel de la source de vérité des outils structurés, plus indications d'exécution pour l'utilisation des outils.
- **Safety** : court rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu'elles sont disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Mise à jour automatique d'OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la
  configuration complète avec `config.apply`, et exécuter `update.run` uniquement à la
  demande explicite de l'utilisateur. L'outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d'espace de travail (injectés)** : indique que les fichiers de bootstrap sont inclus ci-dessous.
- **Sandbox** (lorsqu'elle est activée) : indique l'environnement d'exécution sandboxé, les chemins du bac à sable et si un exec avec privilèges élevés est disponible.
- **Date et heure actuelles** : heure locale de l'utilisateur, fuseau horaire et format d'heure.
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de heartbeat et comportement d'accusé de réception.
- **Exécution** : hôte, OS, node, modèle, racine du dépôt (lorsqu'elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication sur le basculement `/reasoning`.

La section Tooling inclut également des indications d'exécution pour le travail de longue durée :

- utiliser cron pour un suivi futur (`check back later`, rappels, travail récurrent)
  au lieu de boucles `exec` avec `sleep`, d'astuces de délai `yieldMs` ou d'un sondage répété de `process`
- utiliser `exec` / `process` uniquement pour des commandes qui démarrent maintenant et continuent de s'exécuter
  en arrière-plan
- lorsque le réveil automatique à l'achèvement est activé, démarrer la commande une seule fois et s'appuyer sur
  le chemin de réveil piloté par poussée lorsqu'elle émet une sortie ou échoue
- utiliser `process` pour les journaux, le statut, l'entrée ou l'intervention lorsque vous devez
  inspecter une commande en cours d'exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; l'achèvement des sous-agents est
  piloté par poussée et réannoncé automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` dans une boucle juste pour attendre
  l'achèvement

Lorsque l'outil expérimental `update_plan` est activé, Tooling indique également au
modèle de ne l'utiliser que pour un travail non trivial en plusieurs étapes, de conserver exactement une
étape `in_progress`, et d'éviter de répéter l'intégralité du plan après chaque mise à jour.

Les garde-fous de la section Safety dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n'appliquent pas la politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d'autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux disposant de cartes/boutons d'approbation natifs, le prompt d'exécution indique désormais à l'agent de s'appuyer d'abord sur cette UI d'approbation native. Il ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l'outil indique que les approbations par chat sont indisponibles ou que l'approbation manuelle est le seul chemin possible.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. L'environnement d'exécution définit un
`promptMode` pour chaque exécution (ce n'est pas une configuration visible par l'utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Mise à jour automatique d'OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Tooling, **Safety**,
  l'Espace de travail, Sandbox, Date et heure actuelles (lorsqu'elles sont connues), Exécution et le
  contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d'identité de base.

Lorsque `promptMode=minimal`, les prompts supplémentaires injectés sont étiquetés **Contexte du sous-agent**
au lieu de **Contexte de chat de groupe**.

## Injection du bootstrap de l'espace de travail

Les fichiers de bootstrap sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d'identité et de profil sans avoir besoin de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les espaces de travail tout neufs)
- `MEMORY.md` lorsqu'il est présent, sinon `memory.md` comme solution de repli en minuscules

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, ce
qui signifie qu'ils consomment des jetons. Gardez-les concis — en particulier `MEMORY.md`, qui peut
grossir avec le temps et conduire à une utilisation du contexte étonnamment élevée et à des
compactages plus fréquents.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne sont **pas** injectés automatiquement. Ils
> sont consultés à la demande via les outils `memory_search` et `memory_get`, donc ils
> ne comptent pas dans la fenêtre de contexte à moins que le modèle ne les lise explicitement.

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 20000). Le contenu total de bootstrap injecté
sur l'ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 150000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu'une troncature
se produit, OpenClaw peut injecter un bloc d'avertissement dans le Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agents n'injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers de bootstrap
sont filtrés pour garder un contexte de sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers de bootstrap injectés (par exemple en remplaçant `SOUL.md` par une personnalité alternative).

Si vous souhaitez rendre l'agent moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d'outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion de l'heure

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l'utilisateur est connu. Pour garder le cache du prompt stable, elle inclut désormais uniquement
le **fuseau horaire** (pas d'horloge dynamique ni de format d'heure).

Utilisez `session_status` lorsque l'agent a besoin de l'heure actuelle ; la carte de statut
inclut une ligne d'horodatage. Le même outil peut aussi définir un remplacement de modèle par session
(`model=default` l'efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour tous les détails de comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque skill. Le
prompt indique au modèle d'utiliser `read` pour charger le SKILL.md à l'emplacement
indiqué (espace de travail, géré ou intégré). Si aucune skill n'est éligible, la
section Skills est omise.

L'éligibilité inclut les barrières de métadonnées des skills, les vérifications de configuration/d'environnement d'exécution,
et la liste d'autorisation effective des skills de l'agent lorsque `agents.defaults.skills` ou
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

Cela permet de garder le prompt de base réduit tout en activant une utilisation ciblée des skills.

## Documentation

Lorsqu'elle est disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de documentation OpenClaw (soit `docs/` dans l'espace de travail du dépôt, soit la documentation du
package npm intégré) et mentionne également le miroir public, le dépôt source, le Discord de la communauté et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Le prompt demande au modèle de consulter d'abord la documentation locale
pour le comportement, les commandes, la configuration ou l'architecture d'OpenClaw, et d'exécuter
`openclaw status` lui-même lorsque c'est possible (en ne demandant à l'utilisateur que lorsqu'il n'y a pas accès).
