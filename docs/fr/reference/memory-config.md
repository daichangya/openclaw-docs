---
read_when:
    - Vous souhaitez configurer les fournisseurs de recherche mémoire ou les modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous souhaitez ajuster la recherche hybride, le MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation mémoire multimodale
summary: Tous les paramètres de configuration pour la recherche mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-04-06T03:13:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0de0b85125443584f4e575cf673ca8d9bd12ecd849d73c537f4a17545afa93fd
    source_path: reference/memory-config.md
    workflow: 15
---

# Référence de configuration de la mémoire

Cette page répertorie tous les paramètres de configuration de la recherche mémoire d’OpenClaw. Pour des aperçus conceptuels, voir :

- [Vue d’ensemble de la mémoire](/fr/concepts/memory) -- fonctionnement de la mémoire
- [Moteur intégré](/fr/concepts/memory-builtin) -- backend SQLite par défaut
- [Moteur QMD](/fr/concepts/memory-qmd) -- sidecar local-first
- [Recherche mémoire](/fr/concepts/memory-search) -- pipeline de recherche et réglages

Tous les paramètres de recherche mémoire se trouvent sous `agents.defaults.memorySearch` dans `openclaw.json`, sauf indication contraire.

---

## Sélection du fournisseur

| Key        | Type      | Default          | Description                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | détection automatique    | ID de l’adaptateur d’embeddings : `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | défaut du fournisseur | Nom du modèle d’embeddings                                                                        |
| `fallback` | `string`  | `"none"`         | ID de l’adaptateur de secours lorsque le primaire échoue                                                  |
| `enabled`  | `boolean` | `true`           | Activer ou désactiver la recherche mémoire                                                             |

### Ordre de détection automatique

Lorsque `provider` n’est pas défini, OpenClaw sélectionne le premier disponible :

1. `local` -- si `memorySearch.local.modelPath` est configuré et que le fichier existe.
2. `openai` -- si une clé OpenAI peut être résolue.
3. `gemini` -- si une clé Gemini peut être résolue.
4. `voyage` -- si une clé Voyage peut être résolue.
5. `mistral` -- si une clé Mistral peut être résolue.
6. `bedrock` -- si la chaîne d’identifiants AWS SDK est résolue (rôle d’instance, clés d’accès, profil, SSO, identité web ou configuration partagée).

`ollama` est pris en charge, mais n’est pas détecté automatiquement (définissez-le explicitement).

### Résolution de clé API

Les embeddings distants nécessitent une clé API. Bedrock utilise à la place la chaîne d’identifiants par défaut de l’AWS SDK (rôles d’instance, SSO, clés d’accès).

| Provider | Env var                        | Config key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | chaîne d’identifiants AWS           | Aucune clé API nécessaire                 |
| Ollama   | `OLLAMA_API_KEY` (espace réservé) | --                                |

Codex OAuth couvre uniquement le chat/les complétions et ne satisfait pas les requêtes d’embeddings.

---

## Configuration des endpoints distants

Pour des endpoints compatibles OpenAI personnalisés ou pour remplacer les valeurs par défaut du fournisseur :

| Key              | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | URL de base API personnalisée                                |
| `remote.apiKey`  | `string` | Remplacer la clé API                                   |
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

| Key                    | Type     | Default                | Description                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072        |

<Warning>
Modifier le modèle ou `outputDimensionality` déclenche une réindexation complète automatique.
</Warning>

---

## Configuration des embeddings Bedrock

Bedrock utilise la chaîne d’identifiants par défaut de l’AWS SDK -- aucune clé API nécessaire.
Si OpenClaw s’exécute sur EC2 avec un rôle d’instance activé pour Bedrock, définissez simplement le fournisseur et le modèle :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Key                    | Type     | Default                        | Description                     |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout ID de modèle d’embeddings Bedrock  |
| `outputDimensionality` | `number` | valeur par défaut du modèle                  | Pour Titan V2 : 256, 512 ou 1024 |

### Modèles pris en charge

Les modèles suivants sont pris en charge (avec détection de famille et valeurs dimensionnelles par défaut) :

| Model ID                                   | Provider   | Default Dims | Configurable Dims    |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

Les variantes suffixées par débit (par exemple `amazon.titan-embed-text-v1:2:8k`) héritent de la configuration du modèle de base.

### Authentification

L’authentification Bedrock utilise l’ordre de résolution standard des identifiants de l’AWS SDK :

1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache de jetons SSO
3. Identifiants de jeton d’identité web
4. Fichiers partagés d’identifiants et de configuration
5. Identifiants de métadonnées ECS ou EC2

La région est résolue à partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, du `baseUrl` du fournisseur `amazon-bedrock`, ou prend par défaut `us-east-1`.

### Autorisations IAM

Le rôle ou l’utilisateur IAM doit disposer de :

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Pour appliquer le principe du moindre privilège, limitez `InvokeModel` au modèle spécifique :

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configuration des embeddings locaux

| Key                   | Type     | Default                | Description                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | téléchargement automatique        | Chemin vers le fichier modèle GGUF         |
| `local.modelCacheDir` | `string` | valeur par défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés |

Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 Go, téléchargé automatiquement).
Nécessite une build native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

---

## Configuration de la recherche hybride

Tous sous `memorySearch.query.hybrid` :

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Activer la recherche hybride BM25 + vectorielle |
| `vectorWeight`        | `number`  | `0.7`   | Poids des scores vectoriels (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Poids des scores BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplicateur de taille du pool de candidats     |

### MMR (diversité)

| Key           | Type      | Default | Description                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Activer le reclassement MMR                |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = diversité maximale, 1 = pertinence maximale |

### Décroissance temporelle (récence)

| Key                          | Type      | Default | Description               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Activer le boost de récence      |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Le score est divisé par deux tous les N jours |

Les fichiers pérennes (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

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

| Key          | Type       | Description                              |
| ------------ | ---------- | ---------------------------------------- |
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

Les chemins peuvent être absolus ou relatifs à l’espace de travail. Les répertoires sont analysés récursivement à la recherche de fichiers `.md`. La gestion des liens symboliques dépend du backend actif :
le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement du scanner QMD sous-jacent.

Pour la recherche de transcriptions inter-agents à portée d’agent, utilisez
`agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`.
Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais
elles sont fusionnées par agent et peuvent conserver des noms partagés explicites lorsque le chemin
pointe en dehors de l’espace de travail actuel.
Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et
`memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et l’audio en plus du Markdown à l’aide de Gemini Embedding 2 :

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Activer l’indexation multimodale             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Taille maximale de fichier pour l’indexation             |

S’applique uniquement aux fichiers dans `extraPaths`. Les racines mémoire par défaut restent limitées au Markdown.
Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache d’embeddings

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Mettre en cache les embeddings de segments dans SQLite |
| `cache.maxEntries` | `number`  | `50000` | Nombre maximal d’embeddings en cache            |

Empêche de réintégrer les textes inchangés lors de la réindexation ou des mises à jour de transcriptions.

---

## Indexation par lots

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Activer l’API d’embeddings par lots |
| `remote.batch.concurrency`    | `number`  | `2`     | Tâches par lots parallèles        |
| `remote.batch.wait`           | `boolean` | `true`  | Attendre la fin du lot  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Intervalle d’interrogation              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Délai d’expiration du lot              |

Disponible pour `openai`, `gemini` et `voyage`. Les lots OpenAI sont généralement
les plus rapides et les moins chers pour les remplissages initiaux volumineux.

---

## Recherche mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Activer l’indexation des sessions                 |
| `sources`                     | `string[]` | `["memory"]` | Ajoutez `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Seuil en octets pour la réindexation              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Seuil en messages pour la réindexation           |

L’indexation des sessions est opt-in et s’exécute de façon asynchrone. Les résultats peuvent être légèrement
obsolètes. Les journaux de session se trouvent sur le disque, traitez donc l’accès au système de fichiers comme frontière de confiance.

---

## Accélération vectorielle SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | intégré | Remplacer le chemin sqlite-vec          |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à la
similarité cosinus en processus.

---

## Stockage de l’index

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Emplacement de l’index (prend en charge le jeton `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` ou `trigram`)   |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous
`memory.qmd` :

| Key                      | Type      | Default  | Description                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Chemin de l’exécutable QMD                          |
| `searchMode`             | `string`  | `search` | Commande de recherche : `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexer automatiquement `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | Chemins supplémentaires : `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | Indexer les transcriptions de session                    |
| `sessions.retentionDays` | `number`  | --       | Rétention des transcriptions                         |
| `sessions.exportDir`     | `string`  | --       | Répertoire d’exportation                             |

OpenClaw privilégie la collection QMD actuelle et les formes de requête MCP, mais conserve
la compatibilité avec les anciennes versions de QMD en revenant si nécessaire aux indicateurs de collection hérités `--mask`
et aux anciens noms d’outils MCP.

Les remplacements de modèle QMD restent du côté QMD, pas dans la configuration OpenClaw. Si vous devez
remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution
de la passerelle.

### Planning de mise à jour

| Key                       | Type      | Default | Description                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Intervalle de rafraîchissement                      |
| `update.debounceMs`       | `number`  | `15000` | Anti-rebond des changements de fichiers                 |
| `update.onBoot`           | `boolean` | `true`  | Rafraîchir au démarrage                    |
| `update.waitForBootSync`  | `boolean` | `false` | Bloquer le démarrage jusqu’à la fin du rafraîchissement |
| `update.embedInterval`    | `string`  | --      | Cadence d’embedding distincte                |
| `update.commandTimeoutMs` | `number`  | --      | Délai d’expiration des commandes QMD              |
| `update.updateTimeoutMs`  | `number`  | --      | Délai d’expiration des opérations de mise à jour QMD     |
| `update.embedTimeoutMs`   | `number`  | --      | Délai d’expiration des opérations d’embedding QMD      |

### Limites

| Key                       | Type     | Default | Description                |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | Nombre maximal de résultats de recherche         |
| `limits.maxSnippetChars`  | `number` | --      | Limiter la longueur des extraits       |
| `limits.maxInjectedChars` | `number` | --      | Limiter le total des caractères injectés |
| `limits.timeoutMs`        | `number` | `4000`  | Délai d’expiration de la recherche             |

### Portée

Contrôle quelles sessions peuvent recevoir des résultats de recherche QMD. Même schéma que
[`session.sendPolicy`](/fr/gateway/configuration-reference#session) :

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

Par défaut, DM uniquement. `match.keyPrefix` correspond à la clé de session normalisée ;
`match.rawKeyPrefix` correspond à la clé brute, y compris `agent:<id>:`.

### Citations

`memory.citations` s’applique à tous les backends :

| Value            | Behavior                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (par défaut) | Inclure un pied de page `Source: <path#line>` dans les extraits    |
| `on`             | Toujours inclure le pied de page                               |
| `off`            | Omettre le pied de page (le chemin est tout de même transmis à l’agent en interne) |

### Exemple QMD complet

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

Dreaming se configure sous `plugins.entries.memory-core.config.dreaming`,
et non sous `agents.defaults.memorySearch`.

Dreaming s’exécute comme un balayage planifié unique et utilise en interne des phases light/deep/REM comme
détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, voir [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Key         | Type      | Default     | Description                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Activer ou désactiver entièrement Dreaming               |
| `frequency` | `string`  | `0 3 * * *` | Cadence cron facultative pour le balayage complet de Dreaming |

### Exemple

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Remarques :

- Dreaming écrit l’état machine dans `memory/.dreams/`.
- Dreaming écrit une sortie narrative lisible par l’humain dans `DREAMS.md` (ou le fichier existant `dreams.md`).
- La stratégie des phases light/deep/REM et les seuils sont des comportements internes, pas une configuration destinée à l’utilisateur.
