---
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous hésitez entre les outils intégrés, les Skills et les plugins
summary: 'Vue d’ensemble des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-25T18:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils sont la façon dont l’agent lit des fichiers, exécute des commandes, navigue sur le web, envoie des
messages et interagit avec des appareils.

## Outils, Skills et plugins

OpenClaw comporte trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par ex. `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills apprennent à l’agent quand et comment">
    Un Skill est un fichier markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills donnent à l’agent du contexte, des contraintes et des instructions étape par étape pour
    utiliser efficacement les outils. Les Skills vivent dans votre espace de travail, dans des dossiers partagés,
    ou sont fournis dans des plugins.

    [Référence des Skills](/fr/tools/skills) | [Créer des Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les plugins regroupent le tout">
    Un Plugin est un package qui peut enregistrer n’importe quelle combinaison de capacités :
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération de vidéos,
    récupération web, recherche web, et plus encore. Certains plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                       | Ce qu’il fait                                                          | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer les processus en arrière-plan                       | [Exec](/fr/tools/exec), [Approbations exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante en sandbox                                  | [Exécution de code](/fr/tools/code-execution)                      |
| `browser`                                  | Contrôler un navigateur Chromium (naviguer, cliquer, capturer)              | [Navigateur](/fr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le web, rechercher des posts X, récupérer le contenu d’une page                    | [Web](/fr/tools/web), [Web Fetch](/fr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de fichiers dans l’espace de travail                                             |                                                              |
| `apply_patch`                              | Correctifs de fichiers multi-segments                                               | [Apply Patch](/fr/tools/apply-patch)                            |
| `message`                                  | Envoyer des messages sur tous les canaux                                     | [Envoi d’agent](/fr/tools/agent-send)                              |
| `canvas`                                   | Piloter le Canvas de node (présenter, eval, capture)                           |                                                              |
| `nodes`                                    | Découvrir et cibler les appareils appairés                                    |                                                              |
| `cron` / `gateway`                         | Gérer les tâches planifiées ; inspecter, corriger, redémarrer ou mettre à jour la Gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                            | [Génération d’images](/fr/tools/image-generation)                  |
| `music_generate`                           | Générer des pistes musicales                                                 | [Génération musicale](/fr/tools/music-generation)                  |
| `video_generate`                           | Générer des vidéos                                                       | [Génération vidéo](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion texte-parole ponctuelle                                    | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion des sessions, état et orchestration de sous-agents               | [Sous-agents](/fr/tools/subagents)                               |
| `session_status`                           | Retour léger de type `/status` et remplacement du modèle de session       | [Outils de session](/fr/concepts/session-tool)                      |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail musical, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur de musique non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un Plugin tel que
ComfyUI l’enregistre. Cela est distinct de `tts`, qui est la synthèse vocale.

`session_status` est l’outil léger d’état/retour du groupe des sessions.
Il répond aux questions de type `/status` sur la session actuelle et peut
facultativement définir un remplacement de modèle par session ; `model=default` efface ce
remplacement. Comme `/status`, il peut rétroremplir des compteurs clairsemés de jetons/cache et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’utilisation de la transcription.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations Gateway :

- `config.schema.lookup` pour un sous-arbre de configuration délimité à un chemin avant modification
- `config.get` pour l’instantané de configuration actuel + hachage
- `config.patch` pour des mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour un auto-update explicite + redémarrage

Pour les modifications partielles, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
L’outil refuse aussi de modifier `tools.exec.ask` ou `tools.exec.security` ;
les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés.

### Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Diffs](/fr/tools/diffs) — visualiseur et moteur de rendu de diff
- [LLM Task](/fr/tools/llm-task) — étape LLM en JSON uniquement pour une sortie structurée
- [Lobster](/fr/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [Génération musicale](/fr/tools/music-generation) — outil partagé `music_generate` avec fournisseurs adossés à des workflows
- [OpenProse](/fr/prose) — orchestration de workflow orientée markdown
- [Tokenjuice](/fr/tools/tokenjuice) — compacte les résultats bruyants des outils `exec` et `bash`

## Configuration des outils

### Listes d’autorisation et de refus

Contrôlez quels outils l’agent peut appeler via `tools.allow` / `tools.deny` dans la
configuration. Le refus l’emporte toujours sur l’autorisation.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw échoue en mode fermé lorsqu’une liste d’autorisation explicite ne résout aucun outil appelable.
Par exemple, `tools.allow: ["query_db"]` fonctionne uniquement si un Plugin chargé
enregistre réellement `query_db`. Si aucun outil intégré, de Plugin ou MCP fourni ne correspond à la
liste d’autorisation, l’exécution s’arrête avant l’appel du modèle au lieu de continuer comme une
exécution texte uniquement qui pourrait halluciner des résultats d’outil.

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant application de `allow`/`deny`.
Remplacement par agent : `agents.list[].tools.profile`.

| Profil     | Ce qu’il inclut                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Aucune restriction (identique à non défini)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` uniquement                                                                                                                             |

`coding` inclut les outils web légers (`web_search`, `web_fetch`, `x_search`)
mais pas l’outil complet de contrôle du navigateur. L’automatisation navigateur peut piloter de vraies
sessions et profils connectés, donc ajoutez-le explicitement avec
`tools.alsoAllow: ["browser"]` ou un
`agents.list[].tools.alsoAllow: ["browser"]` par agent.

Les profils `coding` et `messaging` autorisent aussi les outils MCP bundle configurés
sous la clé de Plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
voulez qu’un profil conserve ses outils intégrés normaux mais masque tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP bundle.

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisation/de refus :

| Groupe              | Outils                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` est accepté comme alias de `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tous les outils OpenClaw intégrés (exclut les outils de Plugin)                                                       |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Elle supprime
les balises de réflexion, la structure `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appels d’outils tronqués),
la structure dégradée d’appels d’outils, les jetons de contrôle de modèle divulgués en ASCII/pleine largeur,
et le XML d’appels d’outils MiniMax malformé dans le texte assistant, puis applique
la rédaction/troncature et d’éventuels espaces réservés pour lignes surdimensionnées au lieu d’agir
comme un vidage brut de transcription.

### Restrictions spécifiques au fournisseur

Utilisez `tools.byProvider` pour restreindre les outils à des fournisseurs spécifiques sans
modifier les valeurs par défaut globales :

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
