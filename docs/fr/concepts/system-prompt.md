---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections heure/heartbeat
    - Modification du bootstrap de l’espace de travail ou du comportement d’injection des Skills
summary: Ce que contient le prompt système OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-05T12:41:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86b2fa496b183b64e86e6ddc493e4653ff8c9727d813fe33c8f8320184d022f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt système

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **géré par OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outillage** : liste actuelle des outils + courtes descriptions.
- **Sécurité** : bref rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou de contournement de la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger à la demande les instructions des Skills.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la
  configuration complète avec `config.apply`, et exécuter `update.run` uniquement sur demande
  explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers bootstrap sont inclus ci-dessous.
- **Sandbox** (lorsqu’elle est activée) : indique le runtime en sandbox, les chemins sandbox et si l’exécution élevée est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format horaire.
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de heartbeat et comportement d’accusé de réception.
- **Runtime** : hôte, OS, node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication sur la bascule `/reasoning`.

La section Outillage inclut aussi des consignes d’exécution pour le travail de longue durée :

- utiliser cron pour un suivi ultérieur (`check back later`, rappels, travail récurrent)
  au lieu de boucles `exec` sleep, d’astuces de délai `yieldMs` ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; l’achèvement des sous-agents est
  piloté par push et s’annonce automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle juste pour attendre
  la fin

Les garde-fous de sécurité du prompt système sont consultatifs. Ils guident le comportement du modèle mais n’imposent pas la politique. Utilisez la politique d’outil, les approbations d’exécution, la sandbox et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt runtime indique maintenant au
agent de s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations de chat ne sont pas disponibles ou
que l’approbation manuelle est la seule voie possible.

## Modes de prompt

OpenClaw peut produire des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. L’outillage, la **Sécurité**,
  l’Espace de travail, la Sandbox, la Date et heure actuelles (lorsqu’elles sont connues), le Runtime et le
  contexte injecté restent disponibles.
- `none` : ne renvoie que la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont étiquetés **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

## Injection du bootstrap de l’espace de travail

Les fichiers bootstrap sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent, sinon `memory.md` comme solution de repli en minuscules

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, ce qui
signifie qu’ils consomment des jetons. Gardez-les concis — en particulier `MEMORY.md`, qui peut
grossir avec le temps et entraîner une utilisation du contexte étonnamment élevée ainsi qu’une compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne sont **pas** injectés automatiquement. Ils
> sont consultés à la demande via les outils `memory_search` et `memory_get`, donc ils
> ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement.

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 20000). Le contenu bootstrap total injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 150000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers bootstrap
sont filtrés afin de garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers bootstrap injectés (par exemple remplacer `SOUL.md` par une autre persona).

Si vous voulez que l’agent paraisse moins générique, commencez par le
[Guide de personnalité SOUL.md](/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus la surcharge de schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, il inclut désormais uniquement
le **fuseau horaire** (sans horloge dynamique ni format horaire).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte de statut
inclut une ligne horodatée. Le même outil peut aussi éventuellement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date et heure](/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou intégré). Si aucune Skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les garde-fous de métadonnées des Skills, les vérifications d’environnement/de configuration du runtime,
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

Cela garde le prompt de base réduit tout en permettant une utilisation ciblée des Skills.

## Documentation

Lorsqu’elle est disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de documentation OpenClaw (soit `docs/` dans l’espace de travail du dépôt, soit la documentation
du package npm intégré) et mentionne également le miroir public, le dépôt source, le Discord de la communauté et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour découvrir des Skills. Le prompt indique au modèle de consulter d’abord la documentation locale
pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter
`openclaw status` lui-même lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’y a pas accès).
