---
read_when:
    - Modification du runtime de l’agent, de l’initialisation de l’espace de travail ou du comportement de session
summary: Runtime de l’agent, contrat d’espace de travail et initialisation de session
title: Runtime de l’agent
x-i18n:
    generated_at: "2026-04-24T07:06:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw exécute un **unique runtime d’agent embarqué** — un processus d’agent par
Gateway, avec son propre espace de travail, ses fichiers d’initialisation et son stockage de sessions. Cette page
couvre ce contrat de runtime : ce que l’espace de travail doit contenir, quels fichiers sont injectés
et comment les sessions s’initialisent à partir de celui-ci.

## Espace de travail (requis)

OpenClaw utilise un unique répertoire d’espace de travail d’agent (`agents.defaults.workspace`) comme **seul** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandation : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il est manquant et initialiser les fichiers de l’espace de travail.

Guide complet de la structure de l’espace de travail + sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent remplacer cela avec
des espaces de travail par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Configuration du Gateway](/fr/gateway/configuration)).

## Fichiers d’initialisation (injectés)

Dans `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` — instructions de fonctionnement + « mémoire »
- `SOUL.md` — persona, limites, ton
- `TOOLS.md` — notes d’outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` — rituel unique de première exécution (supprimé après exécution)
- `IDENTITY.md` — nom/style/emoji de l’agent
- `USER.md` — profil utilisateur + mode d’adresse préféré

Au premier tour d’une nouvelle session, OpenClaw injecte directement le contenu de ces fichiers dans le contexte de l’agent.

Les fichiers vides sont ignorés. Les gros fichiers sont rognés et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour le contenu complet).

Si un fichier est manquant, OpenClaw injecte une seule ligne marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` n’est créé que pour un **tout nouvel espace de travail** (aucun autre fichier d’initialisation présent). Si vous le supprimez après avoir terminé le rituel, il ne doit pas être recréé lors des redémarrages ultérieurs.

Pour désactiver complètement la création des fichiers d’initialisation (pour les espaces de travail préremplis), définissez :

```json5
{ agent: { skipBootstrap: true } }
```

## Outils intégrés

Les outils de base (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique d’outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne contrôle **pas** les outils qui existent ; il sert
de guide sur la manière dont _vous_ souhaitez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills à partir de ces emplacements (priorité la plus élevée en premier) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Géré/local : `~/.openclaw/skills`
- Intégré (livré avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les Skills peuvent être contrôlés par configuration/env (voir `skills` dans [Configuration du Gateway](/fr/gateway/configuration)).

## Frontières du runtime

Le runtime d’agent embarqué repose sur le cœur d’agent Pi (modèles, outils et
pipeline de prompts). La gestion de session, la découverte, le câblage des outils et la
livraison par canal sont des couches appartenant à OpenClaw au-dessus de ce cœur.

## Sessions

Les transcripts de session sont stockés en JSONL à l’emplacement suivant :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de session provenant d’autres outils ne sont pas lus.

## Pilotage pendant le streaming

Lorsque le mode de file d’attente est `steer`, les messages entrants sont injectés dans l’exécution en cours.
Le pilotage mis en file d’attente est livré **après que le tour actuel de l’assistant a terminé
d’exécuter ses appels d’outils**, avant le prochain appel au LLM. Le pilotage ne saute plus les
appels d’outils restants du message actuel de l’assistant ; il injecte le message mis en file d’attente à la prochaine frontière de modèle.

Lorsque le mode de file d’attente est `followup` ou `collect`, les messages entrants sont conservés jusqu’à la
fin du tour actuel, puis un nouveau tour d’agent démarre avec les charges utiles mises en file d’attente. Voir
[Queue](/fr/concepts/queue) pour le comportement des modes + debounce/limite.

Le streaming par blocs envoie les blocs d’assistant terminés dès qu’ils sont prêts ; il est
**désactivé par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Ajustez la frontière via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end` ; valeur par défaut : text_end).
Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (par défaut
800–1200 caractères ; privilégie les sauts de paragraphe, puis les retours à la ligne ; les phrases en dernier).
Fusionnez les morceaux diffusés avec `agents.defaults.blockStreamingCoalesce` pour réduire le
spam sur une seule ligne (fusion basée sur l’inactivité avant envoi). Les canaux autres que Telegram nécessitent
`*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés détaillés d’outils sont émis au démarrage des outils (sans debounce) ; l’interface de contrôle
diffuse la sortie des outils via les événements de l’agent lorsqu’ils sont disponibles.
Plus de détails : [Streaming + découpage](/fr/concepts/streaming).

## Références de modèles

Les références de modèles dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en les divisant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID du modèle lui-même contient `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une
  correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ensuite seulement revient
  au fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw revient au premier couple
  fournisseur/modèle configuré au lieu d’afficher une ancienne valeur par défaut de fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Discussions de groupe](/fr/channels/group-messages)_ 🦞

## Associé

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion de session](/fr/concepts/session)
