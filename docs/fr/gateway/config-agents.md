---
read_when:
    - Ajustement des valeurs par défaut des agents (modèles, réflexion, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage multi-agent et des liaisons
    - Ajustement du comportement des sessions, de la distribution des messages et du mode talk
summary: Valeurs par défaut des agents, routage multi-agent, session, messages et configuration de talk
title: Configuration — agents
x-i18n:
    generated_at: "2026-04-25T18:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb090bad584cab0d22bc4788652f0fd6d7f2931be1fe40d3907f8ef2123a433b
    source_path: gateway/config-agents.md
    workflow: 15
---

Clés de configuration à portée agent sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, le runtime Gateway et les autres
clés de niveau supérieur, voir [Référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Par défaut : `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Racine de dépôt facultative affichée dans la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Liste d’autorisation de Skills par défaut facultative pour les agents qui ne définissent pas
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucune Skill
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune Skill.
- Une liste `agents.list[].skills` non vide constitue l’ensemble final pour cet agent ; elle ne fusionne pas avec les valeurs par défaut.

### `agents.defaults.skipBootstrap`

Désactive la création automatique des fichiers bootstrap de l’espace de travail (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Contrôle le moment où les fichiers bootstrap de l’espace de travail sont injectés dans le prompt système. Par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse assistant terminée) ignorent la réinjection du bootstrap de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent tout de même le contexte.
- `"never"` : désactive l’injection du bootstrap de l’espace de travail et des fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui gèrent entièrement leur propre cycle de vie de prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte, ou workflows spécialisés sans bootstrap). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier bootstrap de l’espace de travail avant troncature. Par défaut : `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Nombre maximal total de caractères injectés sur l’ensemble des fichiers bootstrap de l’espace de travail. Par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle le texte d’avertissement visible par l’agent lorsque le contexte bootstrap est tronqué.
Par défaut : `"once"`.

- `"off"` : n’injecte jamais de texte d’avertissement dans le prompt système.
- `"once"` : injecte l’avertissement une fois par signature de troncature unique (recommandé).
- `"always"` : injecte l’avertissement à chaque exécution lorsqu’une troncature existe.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw possède plusieurs budgets de prompt/contexte à volume élevé, et ils sont
volontairement répartis par sous-système au lieu de tous passer par un seul réglage
générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection bootstrap normale de l’espace de travail.
- `agents.defaults.startupContext.*` :
  prélude de démarrage one-shot pour `/new` et `/reset`, y compris les fichiers
  `memory/*.md` quotidiens récents.
- `skills.limits.*` :
  liste compacte des Skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits runtime bornés et blocs injectés appartenant au runtime.
- `memory.qmd.limits.*` :
  dimensionnement des extraits de recherche mémoire indexée et de leur injection.

Utilisez la surcharge par agent correspondante uniquement lorsqu’un agent a besoin
d’un budget différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le prélude de démarrage du premier tour injecté dans les exécutions `/new` et `/reset` sans autre contenu.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valeurs par défaut partagées pour les surfaces de contexte runtime bornées.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars` : plafond par défaut des extraits `memory_get` avant l’ajout
  des métadonnées de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes `memory_get` par défaut lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond des résultats d’outils en direct utilisé pour les résultats
  persistés et la récupération après dépassement.
- `postCompactionMaxChars` : plafond des extraits AGENTS.md utilisé pendant l’injection
  d’actualisation après Compaction.

#### `agents.list[].contextLimits`

Surcharge par agent des réglages partagés `contextLimits`. Les champs omis héritent
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Plafond global pour la liste compacte des Skills injectée dans le prompt système. Cela
n’affecte pas la lecture des fichiers `SKILL.md` à la demande.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Surcharge par agent du budget de prompt des Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Taille maximale en pixels du côté le plus long des images dans les blocs image du transcript/des outils avant les appels au fournisseur.
Par défaut : `1200`.

Des valeurs plus basses réduisent généralement l’usage de tokens vision et la taille des charges utiles de requête pour les exécutions riches en captures d’écran.
Des valeurs plus élevées conservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire pour le contexte du prompt système (pas pour les horodatages des messages). Reprend le fuseau horaire de l’hôte par défaut.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format horaire dans le prompt système. Par défaut : `auto` (préférence de l’OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // paramètres fournisseur globaux par défaut
      embeddedHarness: {
        runtime: "pi", // pi | auto | identifiant de harness enregistré, par ex. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - La forme chaîne définit uniquement le modèle principal.
  - La forme objet définit le modèle principal ainsi que des modèles de bascule ordonnés.
- `imageModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin de l’outil `image` comme configuration de son modèle de vision.
  - Également utilisé comme routage de secours lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’image et toute future surface d’outil/Plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’image Gemini native, `fal/fal-ai/flux/dev` pour fal, ou `openai/gpt-image-2` pour OpenAI Images.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification fournisseur correspondante (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut quand même inférer une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’image enregistrés restants dans l’ordre des identifiants fournisseur.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Si omis, `music_generate` peut quand même inférer une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés restants dans l’ordre des identifiants fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé API fournisseur correspondante.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Si omis, `video_generate` peut quand même inférer une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés restants dans l’ordre des identifiants fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé API fournisseur correspondante.
  - Le fournisseur groupé de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options au niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage de modèle.
  - Si omis, l’outil PDF retombe sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages pris en compte par défaut par le mode de secours d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau verbose par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par ex. `openai/gpt-5.5` pour un accès par clé API ou `openai-codex/gpt-5.5` pour Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite revient au fournisseur par défaut configuré (comportement de compatibilité déprécié, donc préférez `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw retombe sur le premier fournisseur/modèle configuré au lieu d’exposer une ancienne valeur par défaut pointant vers un fournisseur supprimé.
- `models` : catalogue de modèles configuré et liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`).
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation à moins que vous ne passiez `--replace`.
  - Les flux de configuration/d’onboarding à portée fournisseur fusionnent les modèles du fournisseur sélectionné dans cette map et préservent les autres fournisseurs déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction OpenAI côté serveur](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres fournisseur globaux par défaut appliqués à tous les modèles. À définir dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace par clé. Voir [Prompt Caching](/fr/reference/prompt-caching) pour plus de détails.
- `params.extra_body`/`params.extraBody` : JSON pass-through avancé fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. S’il entre en collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes completions non natives retirent ensuite toujours le champ OpenAI-only `store`.
- `embeddedHarness` : stratégie par défaut de runtime d’agent embarqué de bas niveau. Un runtime omis utilise par défaut OpenClaw Pi. Utilisez `runtime: "pi"` pour forcer le harnais PI intégré, `runtime: "auto"` pour laisser les harnais de Plugin enregistrés prendre en charge les modèles compatibles, ou un identifiant de harnais enregistré tel que `runtime: "codex"`. Définissez `fallback: "none"` pour désactiver le repli automatique vers PI. Les runtimes de Plugin explicites comme `codex` échouent en fermeture par défaut sauf si vous définissez `fallback: "pi"` dans la même portée de surcharge. Conservez les références de modèle sous forme canonique `provider/model` ; sélectionnez Codex, Claude CLI, Gemini CLI et d’autres backends d’exécution via la configuration du runtime plutôt que via les anciens préfixes de fournisseur de runtime. Voir [Runtimes d’agent](/fr/concepts/agent-runtimes) pour comprendre en quoi cela diffère de la sélection fournisseur/modèle.
- Les écrivains de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de bascule) enregistrent la forme objet canonique et préservent les listes de bascule existantes lorsque c’est possible.
- `maxConcurrent` : nombre maximal d’exécutions parallèles d’agents entre les sessions (chaque session reste sérialisée). Par défaut : 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` contrôle quel exécuteur de bas niveau exécute les tours d’agent embarqués.
La plupart des déploiements devraient conserver le runtime OpenClaw Pi par défaut.
Utilisez-le lorsqu’un Plugin de confiance fournit un harnais natif, comme le harnais
groupé de serveur d’application Codex. Pour le modèle mental, voir
[Runtimes d’agent](/fr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime` : `"auto"`, `"pi"` ou un identifiant de harnais de Plugin enregistré. Le Plugin Codex groupé enregistre `codex`.
- `fallback` : `"pi"` ou `"none"`. En mode `runtime: "auto"`, si `fallback` est omis, la valeur par défaut est `"pi"` afin que les anciennes configurations puissent continuer à utiliser PI lorsqu’aucun harnais de Plugin ne prend en charge une exécution. En mode runtime de Plugin explicite, tel que `runtime: "codex"`, si `fallback` est omis, la valeur par défaut est `"none"` afin qu’un harnais manquant provoque un échec au lieu d’utiliser PI silencieusement. Les surcharges de runtime n’héritent pas de `fallback` depuis une portée plus large ; définissez `fallback: "pi"` à côté du runtime explicite lorsque vous souhaitez volontairement ce repli de compatibilité. Les échecs du harnais de Plugin sélectionné sont toujours exposés directement.
- Surcharges d’environnement : `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` remplace `runtime` ; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` remplace `fallback` pour ce processus.
- Pour les déploiements Codex uniquement, définissez `model: "openai/gpt-5.5"` et `embeddedHarness.runtime: "codex"`. Vous pouvez également définir explicitement `embeddedHarness.fallback: "none"` pour plus de lisibilité ; c’est la valeur par défaut pour les runtimes de Plugin explicites.
- Le choix du harnais est épinglé par identifiant de session après la première exécution embarquée. Les changements de configuration/d’environnement affectent les sessions nouvelles ou réinitialisées, pas un transcript existant. Les anciennes sessions avec historique de transcript mais sans épinglage enregistré sont traitées comme épinglées sur PI. `/status` rapporte le runtime effectif, par exemple `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Cela contrôle uniquement le harnais de chat embarqué. La génération de médias, la vision, le PDF, la musique, la vidéo et le TTS continuent d’utiliser leurs paramètres fournisseur/modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`) :

| Alias               | Modèle                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` ou `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode réflexion sauf si vous définissez `--thinking off` ou si vous définissez vous-même `agents.defaults.models["zai/<model>"].params.thinking`.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Les modèles Anthropic Claude 4.6 utilisent par défaut le mode de réflexion `adaptive` lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours texte uniquement (sans appels d’outils). Utile comme solution de secours lorsque les fournisseurs API échouent.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Ou utilisez systemPromptFileArg si la CLI accepte un flag de fichier de prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Les backends CLI sont d’abord orientés texte ; les outils sont toujours désactivés.
- Sessions prises en charge lorsque `sessionArg` est défini.
- Passage direct des images pris en charge lorsque `imageArg` accepte des chemins de fichiers.

### `agents.defaults.systemPromptOverride`

Remplace l’intégralité du prompt système assemblé par OpenClaw par une chaîne fixe. À définir au niveau par défaut (`agents.defaults.systemPromptOverride`) ou par agent (`agents.list[].systemPromptOverride`). Les valeurs par agent ont priorité ; une valeur vide ou ne contenant que des espaces est ignorée. Utile pour des expériences de prompt contrôlées.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlays de prompt indépendants du fournisseur, appliqués par famille de modèles. Les identifiants de modèle de la famille GPT-5 reçoivent le contrat de comportement partagé entre fournisseurs ; `personality` contrôle uniquement la couche de style d’interaction amical.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (par défaut) et `"on"` activent la couche de style d’interaction amicale.
- `"off"` désactive uniquement la couche amicale ; le contrat de comportement GPT-5 balisé reste activé.
- L’ancien réglage `plugins.entries.openai.config.personality` est toujours lu lorsque ce paramètre partagé n’est pas défini.

### `agents.defaults.heartbeat`

Exécutions périodiques Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m désactive
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // par défaut : true ; false omet la section Heartbeat du prompt système
        lightContext: false, // par défaut : false ; true conserve uniquement HEARTBEAT.md parmi les fichiers bootstrap de l’espace de travail
        isolatedSession: false, // par défaut : false ; true exécute chaque heartbeat dans une session fraîche (sans historique de conversation)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (par défaut) | block
        target: "none", // par défaut : none | options : last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every` : chaîne de durée (ms/s/m/h). Par défaut : `30m` (authentification par clé API) ou `1h` (authentification OAuth). Définissez `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque `false`, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte bootstrap. Par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque `true`, supprime les payloads d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : durée maximale en secondes autorisée pour un tour d’agent Heartbeat avant son interruption. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds`.
- `directPolicy` : stratégie de remise directe/DM. `allow` (par défaut) autorise la remise vers une cible directe. `block` supprime la remise vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque `true`, les exécutions Heartbeat utilisent un contexte bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers bootstrap de l’espace de travail.
- `isolatedSession` : lorsque `true`, chaque exécution Heartbeat s’effectue dans une session fraîche sans historique de conversation antérieur. Même schéma d’isolation que Cron avec `sessionTarget: "isolated"`. Réduit le coût en tokens par heartbeat d’environ 100K à environ 2–5K tokens.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeat.
- Les Heartbeat exécutent des tours d’agent complets — des intervalles plus courts consomment davantage de tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id d’un Plugin fournisseur de Compaction enregistré (facultatif)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // utilisé quand identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] désactive la réinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // surcharge de modèle uniquement pour la Compaction, facultative
        notifyUser: true, // envoie de brèves notifications quand la Compaction commence et se termine (par défaut : false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode` : `default` ou `safeguard` (résumé par blocs pour les longs historiques). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un Plugin fournisseur de Compaction enregistré. Lorsqu’il est défini, la méthode `summarize()` du fournisseur est appelée à la place du résumé LLM intégré. En cas d’échec, retour au mécanisme intégré. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une opération unique de Compaction avant qu’OpenClaw ne l’interrompe. Par défaut : `900`.
- `keepRecentTokens` : budget de point de coupe Pi pour conserver textuellement la queue la plus récente du transcript. La commande manuelle `/compact` respecte cette valeur lorsqu’elle est explicitement définie ; sinon, la Compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` ajoute en préfixe les consignes intégrées de conservation des identifiants opaques pendant le résumé de Compaction.
- `identifierInstructions` : texte facultatif personnalisé de conservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés safeguard. Activé par défaut en mode safeguard ; définissez `enabled: false` pour ignorer cet audit.
- `postCompactionSections` : noms facultatifs de sections H2/H3 de AGENTS.md à réinjecter après la Compaction. Par défaut : `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsqu’il n’est pas défini ou qu’il est explicitement défini sur cette paire par défaut, les anciens en-têtes `Every Session`/`Safety` sont également acceptés comme solution de repli héritée.
- `model` : surcharge facultative `provider/model-id` pour le résumé de Compaction uniquement. Utilisez-la lorsque la session principale doit conserver un modèle mais que les résumés de Compaction doivent s’exécuter sur un autre ; lorsqu’elle n’est pas définie, la Compaction utilise le modèle principal de la session.
- `notifyUser` : lorsque `true`, envoie de brèves notifications à l’utilisateur lorsque la Compaction commence et lorsqu’elle se termine (par exemple, « Compacting context... » et « Compaction complete »). Désactivé par défaut pour que la Compaction reste silencieuse.
- `memoryFlush` : tour agentique silencieux avant l’auto-Compaction pour stocker les souvenirs durables. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.contextPruning`

Élague les **anciens résultats d’outils** du contexte en mémoire avant l’envoi au LLM. Ne **modifie pas** l’historique de session sur disque.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durée (ms/s/m/h), unité par défaut : minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportement du mode cache-ttl">

- `mode: "cache-ttl"` active les passes d’élagage.
- `ttl` contrôle la fréquence à laquelle l’élagage peut être relancé (après le dernier accès au cache).
- L’élagage tronque d’abord légèrement les résultats d’outils surdimensionnés, puis efface complètement les résultats d’outils plus anciens si nécessaire.

**Soft-trim** conserve le début et la fin, et insère `...` au milieu.

**Hard-clear** remplace l’intégralité du résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’image ne sont jamais tronqués ni effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des comptes exacts de tokens.
- Si moins de `keepLastAssistants` messages assistant existent, l’élagage est ignoré.

</Accordion>

Voir [Élagage de session](/fr/concepts/session-pruning) pour les détails du comportement.

### Streaming par blocs

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (utilisez minMs/maxMs)
    },
  },
}
```

- Les canaux autres que Telegram nécessitent `*.blockStreaming: true` explicite pour activer les réponses par blocs.
- Surcharges par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500ms. Surcharge par agent : `agents.list[].humanDelay`.

Voir [Streaming](/fr/concepts/streaming) pour le comportement et les détails de découpage en blocs.

### Indicateurs de frappe

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valeurs par défaut : `instant` pour les chats directs/mentions, `message` pour les discussions de groupe sans mention.
- Surcharges par session : `session.typingMode`, `session.typingIntervalSeconds`.

Voir [Indicateurs de frappe](/fr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facultatif pour l’agent embarqué. Voir [Sandboxing](/fr/gateway/sandboxing) pour le guide complet.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / contenus inline également pris en charge :
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Détails du sandbox">

**Backend :**

- `docker` : runtime Docker local (par défaut)
- `ssh` : runtime distant générique adossé à SSH
- `openshell` : runtime OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres spécifiques au runtime sont déplacés vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus inline ou SecretRefs que OpenClaw matérialise en fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : réglages de politique de clé d’hôte OpenSSH

**Priorité d’authentification SSH :**

- `identityData` a priorité sur `identityFile`
- `certificateData` a priorité sur `certificateFile`
- `knownHostsData` a priorité sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues à partir du snapshot actif du runtime de secrets avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise l’espace de travail distant une fois après création ou recréation
- puis conserve l’espace de travail SSH distant comme canonique
- route `exec`, les outils de fichiers et les chemins média via SSH
- ne synchronise pas automatiquement vers l’hôte les modifications distantes
- ne prend pas en charge les conteneurs de navigateur sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par portée sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox dans `/workspace`, espace de travail de l’agent monté en lecture seule dans `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture dans `/workspace`

**Portée :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (pas d’isolation inter-sessions)

**Configuration du Plugin OpenShell :**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // facultatif
          gatewayEndpoint: "https://lab.example", // facultatif
          policy: "strict", // identifiant de politique OpenShell facultatif
          providers: ["openai"], // facultatif
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell :**

- `mirror` : initialise le distant depuis le local avant `exec`, puis resynchronise après `exec` ; l’espace de travail local reste canonique
- `remote` : initialise le distant une fois à la création du sandbox, puis conserve l’espace de travail distant comme canonique

En mode `remote`, les modifications locales de l’hôte effectuées hors d’OpenClaw ne sont pas automatiquement synchronisées dans le sandbox après l’étape d’initialisation.
Le transport s’effectue via SSH vers le sandbox OpenShell, mais le Plugin gère le cycle de vie du sandbox et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine inscriptible et l’utilisateur root.

**Les conteneurs utilisent par défaut `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (procédure d’exception).

**Les pièces jointes entrantes** sont préparées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur sandboxé** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. L’URL noVNC est injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise par défaut l’authentification VNC et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions sandboxées de cibler le navigateur de l’hôte.
- `network` utilise par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement si vous souhaitez explicitement une connectivité globale au réseau bridge.
- `cdpSourceRange` restreint facultativement l’entrée CDP à la bordure du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur de navigateur sandboxé. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur de navigateur.
- Les paramètres de lancement par défaut sont définis dans `scripts/sandbox-browser-entrypoint.sh` et ajustés pour les hôtes conteneurisés :
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (activé par défaut)
  - `--disable-3d-apis`, `--disable-software-rasterizer` et `--disable-gpu` sont
    activés par défaut et peuvent être désactivés avec
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l’usage de WebGL/3D l’exige.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` réactive les extensions si votre workflow
    en dépend.
  - `--renderer-process-limit=2` peut être modifié avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l’image de conteneur ; utilisez une image navigateur personnalisée avec un point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le sandboxing du navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images :

```bash
scripts/sandbox-setup.sh           # image sandbox principale
scripts/sandbox-browser-setup.sh   # image navigateur facultative
```

### `agents.list` (surcharges par agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // surcharge du niveau de réflexion par agent
        reasoningDefault: "on", // surcharge de la visibilité du raisonnement par agent
        fastModeDefault: false, // surcharge du mode rapide par agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // remplace par clé les params de defaults.models correspondants
        skills: ["docs-search"], // remplace agents.defaults.skills lorsqu’il est défini
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id` : identifiant stable de l’agent (obligatoire).
- `default` : lorsque plusieurs sont définis, le premier l’emporte (un avertissement est journalisé). Si aucun n’est défini, la première entrée de la liste est celle par défaut.
- `model` : la forme chaîne remplace uniquement `primary` ; la forme objet `{ primary, fallbacks }` remplace les deux (`[]` désactive les bascules globales). Les tâches Cron qui ne remplacent que `primary` héritent toujours des bascules par défaut sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour des surcharges spécifiques à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `skills` : liste d’autorisation de Skills facultative par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsqu’elle est définie ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucune Skill.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucune surcharge par message ou session n’est définie. Le profil du fournisseur/modèle sélectionné contrôle quelles valeurs sont valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique gérée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). S’applique lorsqu’aucune surcharge de raisonnement par message ou session n’est définie.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`true | false`). S’applique lorsqu’aucune surcharge de mode rapide par message ou session n’est définie.
- `embeddedHarness` : surcharge facultative par agent de la stratégie de harnais de bas niveau. Utilisez `{ runtime: "codex" }` pour rendre un agent uniquement Codex tandis que les autres agents conservent le repli PI par défaut en mode `auto`.
- `runtime` : descripteur de runtime facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive des valeurs par défaut : `ackReaction` à partir de `emoji`, `mentionPatterns` à partir de `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des identifiants d’agents pour `sessions_spawn` (`["*"]` = n’importe lequel ; par défaut : même agent uniquement).
- Garde d’héritage sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `subagents.requireAgentId` : lorsque `true`, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite d’un profil ; par défaut : false).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans un seul Gateway. Voir [Multi-Agent](/fr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Champs de correspondance des bindings

- `type` (facultatif) : `route` pour le routage normal (si absent, la valeur par défaut est route), `acp` pour les bindings de conversation ACP persistants.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; spécifique au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans peer/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre par niveaux des bindings de route ci-dessus.

### Profils d’accès par agent

<Accordion title="Accès complet (sans sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Outils + espace de travail en lecture seule">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Aucun accès au système de fichiers (messagerie uniquement)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Voir [Sandbox & Tools multi-agent](/fr/tools/multi-agent-sandbox-tools) pour les détails de priorité.

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ignorer le fork du thread parent au-dessus de ce nombre de tokens (0 désactive)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durée ou false
      maxDiskBytes: "500mb", // budget strict facultatif
      highWaterBytes: "400mb", // cible de nettoyage facultative
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // désépinglage auto par inactivité par défaut en heures (`0` désactive)
      maxAgeHours: 0, // âge maximal strict par défaut en heures (`0` désactive)
    },
    mainKey: "main", // hérité (le runtime utilise toujours "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Détails des champs de session">

- **`scope`** : stratégie de regroupement de session de base pour les contextes de discussion de groupe.
  - `per-sender` (par défaut) : chaque expéditeur obtient une session isolée dans un contexte de canal.
  - `global` : tous les participants dans un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est souhaité).
- **`dmScope`** : comment les DM sont regroupés.
  - `main` : tous les DM partagent la session principale.
  - `per-peer` : isole par identifiant d’expéditeur entre les canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour les multi-comptes).
- **`identityLinks`** : mappe les identifiants canoniques vers des pairs préfixés par fournisseur pour le partage de session entre canaux.
- **`reset`** : stratégie principale de réinitialisation. `daily` réinitialise à `atHour` heure locale ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, celui qui expire en premier l’emporte.
- **`resetByType`** : surcharges par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`parentForkMaxTokens`** : nombre maximal de `totalTokens` autorisé dans la session parente lors de la création d’une session de thread dérivée (par défaut `100000`).
  - Si le `totalTokens` parent dépasse cette valeur, OpenClaw démarre une nouvelle session de thread au lieu d’hériter de l’historique du transcript parent.
  - Définissez `0` pour désactiver cette protection et toujours autoriser le fork du parent.
- **`mainKey`** : champ hérité. Le runtime utilise toujours `"main"` pour le bucket principal de chat direct.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse en retour entre agents pendant les échanges agent à agent (entier, plage : `0`–`5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’ancien alias `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage + rétention du stockage des sessions.
  - `mode` : `warn` émet uniquement des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`).
  - `rotateBytes` : fait pivoter `sessions.json` lorsqu’il dépasse cette taille (par défaut `10mb`).
  - `resetArchiveRetention` : rétention des archives de transcript `*.reset.<timestamp>`. Par défaut, utilise `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il journalise des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut à `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liées aux threads.
  - `enabled` : interrupteur maître par défaut (les fournisseurs peuvent surcharger ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : désépinglage automatique par inactivité par défaut en heures (`0` désactive ; les fournisseurs peuvent surcharger)
  - `maxAgeHours` : âge maximal strict par défaut en heures (`0` désactive ; les fournisseurs peuvent surcharger)

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 désactive
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Préfixe de réponse

Surcharges par canal/compte : `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Résolution (le plus spécifique l’emporte) : compte → canal → global. `""` désactive et arrête la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables de modèle :**

| Variable          | Description            | Exemple                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nom court du modèle    | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur     | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent | (identique à `"auto"`)      |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Surcharges par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` supprime l’accusé de réception après la réponse sur Slack, Discord et Telegram.
- `messages.statusReactions.enabled` active les réactions d’état de cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, si non défini, les réactions d’état restent activées lorsque les réactions d’accusé de réception sont actives.
  Sur Telegram, définissez-le explicitement sur `true` pour activer les réactions d’état de cycle de vie.

### Debounce entrant

Regroupe les messages textuels rapides du même expéditeur en un seul tour d’agent. Les médias/pièces jointes sont vidés immédiatement. Les commandes de contrôle contournent le debounce.

### TTS (synthèse vocale)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` contrôle le mode auto-TTS par défaut : `off`, `always`, `inbound` ou `tagged`. `/tts on|off` peut surcharger les préférences locales, et `/tts status` affiche l’état effectif.
- `summaryModel` remplace `agents.defaults.model.primary` pour le résumé automatique.
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut `false` par défaut (activation explicite requise).
- Les clés API utilisent `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY` comme repli.
- Les fournisseurs vocaux groupés appartiennent aux Plugin. Si `plugins.allow` est défini, incluez chaque Plugin fournisseur TTS que vous souhaitez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison OpenAI TTS. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation du modèle/de la voix.

---

## Talk

Valeurs par défaut pour le mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs Talk sont configurés.
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sont conservées uniquement pour compatibilité et sont automatiquement migrées vers `talk.providers.<provider>`.
- Les identifiants de voix utilisent `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` comme repli.
- `providers.*.apiKey` accepte des chaînes en clair ou des objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. Si omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX macOS s’exécute via l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou via un exécutable sur le `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `silenceTimeoutMs` contrôle combien de temps le mode Talk attend après le silence de l’utilisateur avant d’envoyer le transcript. Si non défini, conserve la fenêtre de pause par défaut de la plateforme (`700 ms sur macOS et Android, 900 ms sur iOS`).

---

## Lié

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
