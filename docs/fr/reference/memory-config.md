---
read_when:
    - Vous souhaitez configurer des fournisseurs de recherche mémoire ou des modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous souhaitez ajuster la recherche hybride, MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation de mémoire multimodale
summary: Tous les réglages de configuration pour la recherche mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-04-05T12:53:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Référence de configuration de la mémoire

Cette page répertorie tous les réglages de configuration pour la recherche mémoire OpenClaw. Pour
des vues d’ensemble conceptuelles, consultez :

- [Vue d’ensemble de la mémoire](/concepts/memory) -- fonctionnement de la mémoire
- [Moteur intégré](/concepts/memory-builtin) -- backend SQLite par défaut
- [Moteur QMD](/concepts/memory-qmd) -- sidecar local-first
- [Recherche mémoire](/concepts/memory-search) -- pipeline de recherche et réglages

Tous les paramètres de recherche mémoire se trouvent sous `agents.defaults.memorySearch` dans
`openclaw.json` sauf indication contraire.

---

## Sélection du fournisseur

| Clé        | Type      | Valeur par défaut | Description                                                                      |
| ---------- | --------- | ----------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-détecté      | ID de l’adaptateur d’embeddings : `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’embeddings                                             |
| `fallback` | `string`  | `"none"`          | ID de l’adaptateur de repli lorsque le principal échoue                         |
| `enabled`  | `boolean` | `true`            | Activer ou désactiver la recherche mémoire                                      |

### Ordre d’auto-détection

Lorsque `provider` n’est pas défini, OpenClaw sélectionne le premier disponible :

1. `local` -- si `memorySearch.local.modelPath` est configuré et que le fichier existe.
2. `openai` -- si une clé OpenAI peut être résolue.
3. `gemini` -- si une clé Gemini peut être résolue.
4. `voyage` -- si une clé Voyage peut être résolue.
5. `mistral` -- si une clé Mistral peut être résolue.

`ollama` est pris en charge mais n’est pas auto-détecté (définissez-le explicitement).

### Résolution des clés API

Les embeddings distants nécessitent une clé API. OpenClaw les résout depuis :
les profils d’authentification, `models.providers.*.apiKey`, ou les variables d’environnement.

| Fournisseur | Variable env                   | Clé de configuration               |
| ----------- | ------------------------------ | ---------------------------------- |
| OpenAI      | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`   |
| Gemini      | `GEMINI_API_KEY`               | `models.providers.google.apiKey`   |
| Voyage      | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`   |
| Mistral     | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey`  |
| Ollama      | `OLLAMA_API_KEY` (placeholder) | --                                 |

OAuth Codex couvre uniquement le chat/completions et ne satisfait pas les
requêtes d’embeddings.

---

## Configuration du point de terminaison distant

Pour des points de terminaison personnalisés compatibles OpenAI ou pour remplacer les valeurs par défaut du fournisseur :

| Clé              | Type     | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `remote.baseUrl` | `string` | URL de base API personnalisée                    |
| `remote.apiKey`  | `string` | Remplacer la clé API                             |
| `remote.headers` | `object` | En-têtes HTTP supplémentaires (fusionnés avec les valeurs par défaut du fournisseur) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuration spécifique à Gemini

| Clé                    | Type     | Valeur par défaut      | Description                                 |
| ---------------------- | -------- | ---------------------- | ------------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072        |

<Warning>
Modifier le modèle ou `outputDimensionality` déclenche une réindexation complète automatique.
</Warning>

---

## Configuration des embeddings locaux

| Clé                   | Type     | Valeur par défaut           | Description                         |
| --------------------- | -------- | --------------------------- | ----------------------------------- |
| `local.modelPath`     | `string` | téléchargé automatiquement  | Chemin vers le fichier modèle GGUF  |
| `local.modelCacheDir` | `string` | valeur par défaut de node-llama-cpp | Répertoire cache pour les modèles téléchargés |

Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, téléchargement automatique).
Nécessite une construction native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

---

## Configuration de la recherche hybride

Tout se trouve sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Valeur par défaut | Description                               |
| --------------------- | --------- | ----------------- | ----------------------------------------- |
| `enabled`             | `boolean` | `true`            | Activer la recherche hybride BM25 + vecteur |
| `vectorWeight`        | `number`  | `0.7`             | Poids des scores vectoriels (0-1)         |
| `textWeight`          | `number`  | `0.3`             | Poids des scores BM25 (0-1)               |
| `candidateMultiplier` | `number`  | `4`               | Multiplicateur de taille du pool de candidats |

### MMR (diversité)

| Clé           | Type      | Valeur par défaut | Description                            |
| ------------- | --------- | ----------------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`           | Activer le reclassement MMR            |
| `mmr.lambda`  | `number`  | `0.7`             | 0 = diversité maximale, 1 = pertinence maximale |

### Décroissance temporelle (récence)

| Clé                          | Type      | Valeur par défaut | Description                          |
| ---------------------------- | --------- | ----------------- | ------------------------------------ |
| `temporalDecay.enabled`      | `boolean` | `false`           | Activer le boost de récence          |
| `temporalDecay.halfLifeDays` | `number`  | `30`              | Le score est divisé par deux tous les N jours |

Les fichiers evergreen (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

### Exemple complet

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Chemins mémoire supplémentaires

| Clé          | Type       | Description                                   |
| ------------ | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | Répertoires ou fichiers supplémentaires à indexer |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Les chemins peuvent être absolus ou relatifs à l’espace de travail. Les répertoires sont analysés
récursivement pour les fichiers `.md`. La gestion des liens symboliques dépend du backend actif :
le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement du scanner QMD sous-jacent.

Pour une recherche de transcriptions inter-agents à portée d’agent, utilisez
`agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`.
Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais
elles sont fusionnées par agent et peuvent préserver des noms partagés explicites lorsque le chemin
pointe en dehors de l’espace de travail courant.
Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et
`memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le
doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et l’audio aux côtés du Markdown avec Gemini Embedding 2 :

| Clé                       | Type       | Valeur par défaut | Description                               |
| ------------------------- | ---------- | ----------------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`           | Activer l’indexation multimodale          |
| `multimodal.modalities`   | `string[]` | --                | `["image"]`, `["audio"]`, ou `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10000000`        | Taille maximale de fichier pour l’indexation |

S’applique uniquement aux fichiers dans `extraPaths`. Les racines mémoire par défaut restent limitées au Markdown.
Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache d’embeddings

| Clé                | Type      | Valeur par défaut | Description                            |
| ------------------ | --------- | ----------------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false`           | Mettre en cache les embeddings de blocs dans SQLite |
| `cache.maxEntries` | `number`  | `50000`           | Nombre maximal d’embeddings en cache   |

Empêche de recalculer les embeddings sur du texte inchangé pendant la réindexation ou les mises à jour de transcription.

---

## Indexation par lots

| Clé                           | Type      | Valeur par défaut | Description                         |
| ----------------------------- | --------- | ----------------- | ----------------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`           | Activer l’API d’embeddings par lots |
| `remote.batch.concurrency`    | `number`  | `2`               | Tâches parallèles par lots          |
| `remote.batch.wait`           | `boolean` | `true`            | Attendre la fin du lot              |
| `remote.batch.pollIntervalMs` | `number`  | --                | Intervalle de sondage               |
| `remote.batch.timeoutMinutes` | `number`  | --                | Délai d’expiration du lot           |

Disponible pour `openai`, `gemini` et `voyage`. Le traitement par lots OpenAI est généralement
le plus rapide et le moins coûteux pour les gros remplissages initiaux.

---

## Recherche mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Clé                           | Type       | Valeur par défaut | Description                                |
| ----------------------------- | ---------- | ----------------- | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`           | Activer l’indexation des sessions          |
| `sources`                     | `string[]` | `["memory"]`      | Ajouter `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`          | Seuil d’octets pour la réindexation        |
| `sync.sessions.deltaMessages` | `number`   | `50`              | Seuil de messages pour la réindexation     |

L’indexation des sessions est facultative et s’exécute de façon asynchrone. Les résultats peuvent être légèrement
obsolètes. Les journaux de session résident sur le disque, donc traitez l’accès au système de fichiers comme la limite de confiance.

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Valeur par défaut | Description                              |
| ---------------------------- | --------- | ----------------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`            | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | groupé            | Remplacer le chemin de sqlite-vec        |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à une
similarité cosinus en processus.

---

## Stockage de l’index

| Clé                   | Type     | Valeur par défaut                       | Description                                  |
| --------------------- | -------- | --------------------------------------- | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite`   | Emplacement de l’index (prend en charge le jeton `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                             | Tokenizer FTS5 (`unicode61` ou `trigram`)    |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous
`memory.qmd` :

| Clé                      | Type      | Valeur par défaut | Description                                 |
| ------------------------ | --------- | ----------------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`             | Chemin de l’exécutable QMD                  |
| `searchMode`             | `string`  | `search`          | Commande de recherche : `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`            | Indexer automatiquement `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --                | Chemins supplémentaires : `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`           | Indexer les transcriptions de session       |
| `sessions.retentionDays` | `number`  | --                | Rétention des transcriptions                |
| `sessions.exportDir`     | `string`  | --                | Répertoire d’export                         |

### Planification des mises à jour

| Clé                       | Type      | Valeur par défaut | Description                                |
| ------------------------- | --------- | ----------------- | ------------------------------------------ |
| `update.interval`         | `string`  | `5m`              | Intervalle de rafraîchissement             |
| `update.debounceMs`       | `number`  | `15000`           | Antirebond des changements de fichiers     |
| `update.onBoot`           | `boolean` | `true`            | Rafraîchir au démarrage                    |
| `update.waitForBootSync`  | `boolean` | `false`           | Bloquer le démarrage jusqu’à la fin du rafraîchissement |
| `update.embedInterval`    | `string`  | --                | Cadence séparée pour les embeddings        |
| `update.commandTimeoutMs` | `number`  | --                | Délai d’expiration pour les commandes QMD  |
| `update.updateTimeoutMs`  | `number`  | --                | Délai d’expiration pour les opérations de mise à jour QMD |
| `update.embedTimeoutMs`   | `number`  | --                | Délai d’expiration pour les opérations d’embeddings QMD |

### Limites

| Clé                       | Type     | Valeur par défaut | Description                      |
| ------------------------- | -------- | ----------------- | -------------------------------- |
| `limits.maxResults`       | `number` | `6`               | Nombre maximal de résultats de recherche |
| `limits.maxSnippetChars`  | `number` | --                | Limiter la longueur des extraits |
| `limits.maxInjectedChars` | `number` | --                | Limiter le total de caractères injectés |
| `limits.timeoutMs`        | `number` | `4000`            | Délai d’expiration de la recherche |

### Portée

Contrôle quelles sessions peuvent recevoir des résultats de recherche QMD. Même schéma que
[`session.sendPolicy`](/gateway/configuration-reference#session) :

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

La valeur par défaut est DM uniquement. `match.keyPrefix` correspond à la clé de session normalisée ;
`match.rawKeyPrefix` correspond à la clé brute incluant `agent:<id>:`.

### Citations

`memory.citations` s’applique à tous les backends :

| Valeur           | Comportement                                        |
| ---------------- | --------------------------------------------------- |
| `auto` (par défaut) | Inclure un pied de page `Source: <path#line>` dans les extraits |
| `on`             | Toujours inclure le pied de page                    |
| `off`            | Omettre le pied de page (le chemin est toujours transmis à l’agent en interne) |

### Exemple complet QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (expérimental)

Dreaming est configuré sous `plugins.entries.memory-core.config.dreaming`,
et non sous `agents.defaults.memorySearch`. Pour les détails conceptuels et les
commandes de chat, consultez [Dreaming](/concepts/memory-dreaming).

| Clé                | Type     | Valeur par défaut | Description                                  |
| ------------------ | -------- | ----------------- | -------------------------------------------- |
| `mode`             | `string` | `"off"`           | Préréglage : `off`, `core`, `rem`, ou `deep` |
| `cron`             | `string` | valeur prédéfinie du preset | Remplacement de l’expression cron du planning |
| `timezone`         | `string` | fuseau horaire utilisateur | Fuseau horaire pour l’évaluation du planning  |
| `limit`            | `number` | valeur prédéfinie du preset | Nombre maximal de candidats à promouvoir par cycle |
| `minScore`         | `number` | valeur prédéfinie du preset | Score pondéré minimal pour la promotion      |
| `minRecallCount`   | `number` | valeur prédéfinie du preset | Seuil minimal du nombre de rappels           |
| `minUniqueQueries` | `number` | valeur prédéfinie du preset | Seuil minimal du nombre de requêtes distinctes |

### Valeurs par défaut des presets

| Mode   | Cadence          | minScore | minRecallCount | minUniqueQueries |
| ------ | ---------------- | -------- | -------------- | ---------------- |
| `off`  | Désactivé        | --       | --             | --               |
| `core` | Quotidien 3 h    | 0.75     | 3              | 2                |
| `rem`  | Toutes les 6 heures | 0.85  | 4              | 3                |
| `deep` | Toutes les 12 heures | 0.80 | 3              | 3                |

### Exemple

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
