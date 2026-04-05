---
read_when:
    - Vous voulez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous hésitez entre les outils intégrés, les Skills et les plugins
summary: 'Vue d’ensemble des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-05T12:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Outils et plugins

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils sont la manière dont l’agent lit des fichiers, exécute des commandes, navigue sur le web, envoie
des messages et interagit avec des appareils.

## Outils, Skills et plugins

OpenClaw a trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par ex. `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills apprennent à l’agent quand et comment">
    Un Skill est un fichier markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills donnent à l’agent du contexte, des contraintes et des conseils étape par étape pour
    utiliser les outils efficacement. Les Skills vivent dans votre espace de travail, dans des dossiers partagés,
    ou sont fournis dans des plugins.

    [Référence des Skills](/tools/skills) | [Créer des Skills](/tools/creating-skills)

  </Step>

  <Step title="Les plugins regroupent tout ensemble">
    Un plugin est un package qui peut enregistrer n’importe quelle combinaison de capacités :
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription en temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération de vidéos,
    récupération web, recherche web, etc. Certains plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/tools/plugin) | [Créez le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                      | Ce qu’il fait                                                          | Page                                    |
| ------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Exécute des commandes shell, gère des processus d’arrière-plan         | [Exec](/tools/exec)                     |
| `code_execution`                           | Exécute une analyse Python distante en bac à sable                     | [Code Execution](/tools/code-execution) |
| `browser`                                  | Contrôle un navigateur Chromium (navigation, clic, capture d’écran)    | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Recherche sur le web, recherche dans les posts X, récupère le contenu d’une page | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | E/S de fichiers dans l’espace de travail                               |                                         |
| `apply_patch`                              | Patches de fichiers multi-segments                                     | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Envoie des messages sur tous les canaux                                | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Pilote le node Canvas (présentation, eval, snapshot)                   |                                         |
| `nodes`                                    | Découvre et cible les appareils appairés                               |                                         |
| `cron` / `gateway`                         | Gère les tâches planifiées ; inspecte, modifie, redémarre ou met à jour la gateway |                                         |
| `image` / `image_generate`                 | Analyse ou génère des images                                           |                                         |
| `tts`                                      | Conversion texte-parole ponctuelle                                     | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Gestion des sessions, statut et orchestration de sous-agents           | [Sous-agents](/tools/subagents)         |
| `session_status`                           | Lecture légère de type `/status` et remplacement du modèle par session | [Outils de session](/fr/concepts/session-tool) |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification / la clé API de ce fournisseur.

`session_status` est l’outil léger de statut / lecture du groupe des sessions.
Il répond aux questions de type `/status` sur la session en cours et peut
facultativement définir un remplacement de modèle par session ; `model=default` efface ce
remplacement. Comme `/status`, il peut renseigner a posteriori des compteurs clairsemés de tokens / cache et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’utilisation de la transcription.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations de gateway :

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant les modifications
- `config.get` pour l’instantané de configuration actuel + hash
- `config.patch` pour des mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour une auto-mise à jour explicite + redémarrage

Pour les changements partiels, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
L’outil refuse aussi de modifier `tools.exec.ask` ou `tools.exec.security` ;
les alias historiques `tools.bash.*` sont normalisés vers les mêmes chemins protégés d’exec.

### Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Lobster](/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [LLM Task](/tools/llm-task) — étape LLM en JSON uniquement pour une sortie structurée
- [Diffs](/tools/diffs) — visualiseur et moteur de rendu de diff
- [OpenProse](/fr/prose) — orchestration de workflow orientée markdown

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

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant application de `allow`/`deny`.
Remplacement par agent : `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `full`      | Aucune restriction (identique à non défini)                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                   |
| `minimal`   | `session_status` uniquement                                                                                  |

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisation / de refus :

| Groupe             | Outils                                                                                                    |
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
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Tous les outils OpenClaw intégrés (exclut les outils de plugin)                                           |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Elle supprime
les balises de réflexion, l’échafaudage `<relevant-memories>`, les payloads XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués),
l’échafaudage d’appel d’outil dégradé, les tokens de contrôle de modèle ASCII / pleine largeur divulgués,
et le XML d’appel d’outil MiniMax mal formé dans le texte de l’assistant, puis applique
la rédaction / troncature et d’éventuels placeholders de lignes surdimensionnées au lieu de fonctionner
comme un vidage brut de transcription.

### Restrictions spécifiques au fournisseur

Utilisez `tools.byProvider` pour restreindre les outils pour des fournisseurs spécifiques sans
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
