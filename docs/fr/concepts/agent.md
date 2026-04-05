---
read_when:
    - Modifier le runtime d’agent, le bootstrap du workspace ou le comportement des sessions
summary: Runtime d’agent, contrat de workspace et bootstrap de session
title: Runtime d’agent
x-i18n:
    generated_at: "2026-04-05T12:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Runtime d’agent

OpenClaw exécute un unique runtime d’agent embarqué.

## Workspace (requis)

OpenClaw utilise un unique répertoire de workspace d’agent (`agents.defaults.workspace`) comme **seul** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandé : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il manque et initialiser les fichiers du workspace.

Guide complet de disposition du workspace + sauvegarde : [Agent workspace](/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent surcharger cela avec
des workspaces par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Gateway configuration](/gateway/configuration)).

## Fichiers bootstrap (injectés)

À l’intérieur de `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` — instructions de fonctionnement + « mémoire »
- `SOUL.md` — persona, limites, ton
- `TOOLS.md` — notes sur les outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` — rituel unique de première exécution (supprimé une fois terminé)
- `IDENTITY.md` — nom/ambiance/emoji de l’agent
- `USER.md` — profil utilisateur + forme d’adresse préférée

Au premier tour d’une nouvelle session, OpenClaw injecte directement le contenu de ces fichiers dans le contexte de l’agent.

Les fichiers vides sont ignorés. Les gros fichiers sont rognés et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour obtenir le contenu complet).

Si un fichier est manquant, OpenClaw injecte une seule ligne de marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` n’est créé que pour un **workspace tout neuf** (aucun autre fichier bootstrap présent). Si vous le supprimez après avoir terminé le rituel, il ne doit pas être recréé lors des redémarrages ultérieurs.

Pour désactiver complètement la création des fichiers bootstrap (pour les workspaces préremplis), définissez :

```json5
{ agent: { skipBootstrap: true } }
```

## Outils intégrés

Les outils cœur (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique des outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne contrôle **pas** quels outils existent ; c’est
un guide sur la façon dont _vous_ voulez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis ces emplacements (priorité la plus élevée d’abord) :

- Workspace : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Gérés/locaux : `~/.openclaw/skills`
- Intégrés (fournis avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les Skills peuvent être contrôlées par config/env (voir `skills` dans [Gateway configuration](/gateway/configuration)).

## Limites du runtime

Le runtime d’agent embarqué est construit sur le cœur d’agent Pi (modèles, outils et
pipeline de prompt). La gestion des sessions, la découverte, le câblage des outils et la
remise par canal sont des couches gérées par OpenClaw au-dessus de ce cœur.

## Sessions

Les transcriptions de session sont stockées en JSONL à l’emplacement suivant :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de session provenant d’autres outils ne sont pas lus.

## Pilotage pendant le streaming

Lorsque le mode de file d’attente est `steer`, les messages entrants sont injectés dans l’exécution en cours.
Le pilotage mis en file d’attente est remis **après la fin de l’exécution
des appels d’outils du tour assistant en cours**, avant le prochain appel LLM. Le pilotage ne saute plus
les appels d’outils restants du message assistant en cours ; il injecte le message mis en file d’attente à la prochaine frontière du modèle à la place.

Lorsque le mode de file d’attente est `followup` ou `collect`, les messages entrants sont conservés jusqu’à la
fin du tour en cours, puis un nouveau tour d’agent démarre avec les charges utiles mises en file d’attente. Voir
[Queue](/concepts/queue) pour le comportement des modes + debounce/cap.

Le streaming par blocs envoie les blocs assistant terminés dès qu’ils sont finis ; il est
**désactivé par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Ajustez la frontière via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end` ; par défaut `text_end`).
Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (par défaut
800–1200 caractères ; privilégie les sauts de paragraphe, puis les nouvelles lignes ; les phrases en dernier).
Fusionnez les segments streamés avec `agents.defaults.blockStreamingCoalesce` pour réduire le
spam de lignes uniques (fusion basée sur l’inactivité avant l’envoi). Les canaux hors Telegram exigent
`*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés détaillés des outils sont émis au démarrage des outils (sans debounce) ; l’interface Control
streame la sortie des outils via les événements d’agent lorsque disponible.
Plus de détails : [Streaming + chunking](/concepts/streaming).

## Références de modèle

Les références de modèle dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en les divisant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID du modèle lui-même contient `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une
  correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ce n’est qu’ensuite qu’il se replie sur le fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw se replie sur le premier couple fournisseur/modèle configuré au lieu de signaler un ancien défaut de fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Group Chats](/channels/group-messages)_ 🦞
