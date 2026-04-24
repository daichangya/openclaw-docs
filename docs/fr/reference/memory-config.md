---
read_when:
    - Vous souhaitez configurer les fournisseurs de recherche en mémoire ou les modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous souhaitez ajuster la recherche hybride, MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation mémoire multimodale
summary: Tous les paramètres de configuration pour la recherche en mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-04-24T07:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Cette page liste chaque paramètre de configuration de la recherche en mémoire OpenClaw. Pour
les vues d’ensemble conceptuelles, voir :

- [Vue d’ensemble de la mémoire](/fr/concepts/memory) -- fonctionnement de la mémoire
- [Moteur intégré](/fr/concepts/memory-builtin) -- backend SQLite par défaut
- [Moteur QMD](/fr/concepts/memory-qmd) -- sidecar local-first
- [Recherche en mémoire](/fr/concepts/memory-search) -- pipeline de recherche et réglage
- [Active Memory](/fr/concepts/active-memory) -- activer le sous-agent mémoire pour les sessions interactives

Tous les paramètres de recherche en mémoire se trouvent sous `agents.defaults.memorySearch` dans
`openclaw.json`, sauf indication contraire.

Si vous cherchez l’activation de la fonctionnalité **Active Memory** et la configuration du sous-agent,
cela se trouve sous `plugins.entries.active-memory` et non sous `memorySearch`.

Active memory utilise un modèle à deux portes :

1. le Plugin doit être activé et cibler l’identifiant d’agent courant
2. la requête doit être une session de chat interactive persistante admissible

Voir [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation,
la configuration possédée par le Plugin, la persistance de transcription et le modèle de déploiement sûr.

---

## Sélection du fournisseur

| Clé        | Type      | Par défaut       | Description                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-détecté     | Identifiant d’adaptateur d’embeddings : `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | défaut fournisseur | Nom du modèle d’embeddings                                                                                   |
| `fallback` | `string`  | `"none"`         | Identifiant d’adaptateur de repli lorsque le principal échoue                                                 |
| `enabled`  | `boolean` | `true`           | Activer ou désactiver la recherche en mémoire                                                                 |

### Ordre d’auto-détection

Lorsque `provider` n’est pas défini, OpenClaw sélectionne le premier disponible :

1. `local` -- si `memorySearch.local.modelPath` est configuré et que le fichier existe.
2. `github-copilot` -- si un jeton GitHub Copilot peut être résolu (variable d’environnement ou profil d’authentification).
3. `openai` -- si une clé OpenAI peut être résolue.
4. `gemini` -- si une clé Gemini peut être résolue.
5. `voyage` -- si une clé Voyage peut être résolue.
6. `mistral` -- si une clé Mistral peut être résolue.
7. `bedrock` -- si la chaîne d’identifiants AWS SDK est résolue (rôle d’instance, clés d’accès, profil, SSO, identité Web ou configuration partagée).

`ollama` est pris en charge mais non auto-détecté (définissez-le explicitement).

### Résolution des clés API

Les embeddings distants exigent une clé API. Bedrock utilise à la place la
chaîne d’identifiants par défaut AWS SDK (rôles d’instance, SSO, clés d’accès).

| Fournisseur     | Variable d’environnement                            | Clé de configuration                |
| --------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock         | Chaîne d’identifiants AWS                           | Aucune clé API requise              |
| Gemini          | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot  | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Profil d’authentification via connexion par appareil |
| Mistral         | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama          | `OLLAMA_API_KEY` (espace réservé)                   | --                                  |
| OpenAI          | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage          | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

L’OAuth Codex couvre uniquement chat/completions et ne satisfait pas les
requêtes d’embeddings.

---

## Configuration des endpoints distants

Pour des endpoints personnalisés compatibles OpenAI ou pour remplacer les valeurs par défaut du fournisseur :

| Clé              | Type     | Description                                   |
| ---------------- | -------- | --------------------------------------------- |
| `remote.baseUrl` | `string` | URL de base API personnalisée                 |
| `remote.apiKey`  | `string` | Remplacement de la clé API                    |
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

| Clé                    | Type     | Par défaut             | Description                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072       |

<Warning>
Modifier le modèle ou `outputDimensionality` déclenche automatiquement une réindexation complète.
</Warning>

---

## Configuration des embeddings Bedrock

Bedrock utilise la chaîne d’identifiants par défaut AWS SDK -- aucune clé API nécessaire.
Si OpenClaw s’exécute sur EC2 avec un rôle d’instance activé pour Bedrock, il suffit de définir le
fournisseur et le modèle :

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

| Clé                    | Type     | Par défaut                     | Description                            |
| ---------------------- | -------- | ------------------------------ | -------------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout identifiant de modèle d’embeddings Bedrock |
| `outputDimensionality` | `number` | défaut du modèle               | Pour Titan V2 : 256, 512 ou 1024       |

### Modèles pris en charge

Les modèles suivants sont pris en charge (avec détection de famille et valeurs par défaut de dimensions) :

| ID de modèle                                 | Fournisseur | Dims par défaut | Dims configurables     |
| -------------------------------------------- | ----------- | --------------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`               | Amazon      | 1024            | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`                 | Amazon      | 1536            | --                     |
| `amazon.titan-embed-g1-text-02`              | Amazon      | 1536            | --                     |
| `amazon.titan-embed-image-v1`                | Amazon      | 1024            | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0`   | Amazon      | 1024            | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                    | Cohere      | 1024            | --                     |
| `cohere.embed-multilingual-v3`               | Cohere      | 1024            | --                     |
| `cohere.embed-v4:0`                          | Cohere      | 1536            | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`          | TwelveLabs  | 512             | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`          | TwelveLabs  | 1024            | --                     |

Les variantes suffixées par débit (par ex. `amazon.titan-embed-text-v1:2:8k`) héritent
de la configuration du modèle de base.

### Authentification

L’authentification Bedrock utilise l’ordre de résolution standard des identifiants AWS SDK :

1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache de jetons SSO
3. Identifiants par jeton d’identité Web
4. Fichiers partagés d’identifiants et de configuration
5. Identifiants de métadonnées ECS ou EC2

La région est résolue à partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, de
`baseUrl` du fournisseur `amazon-bedrock`, ou revient à `us-east-1`.

### Permissions IAM

Le rôle ou l’utilisateur IAM a besoin de :

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Pour le moindre privilège, limitez `InvokeModel` au modèle spécifique :

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configuration des embeddings locaux

| Clé                   | Type               | Par défaut              | Description                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | téléchargé automatiquement | Chemin vers le fichier du modèle GGUF                                                                                                                                                                                                                                                                             |
| `local.modelCacheDir` | `string`           | défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés                                                                                                                                                                                                                                                                  |
| `local.contextSize`   | `number \| "auto"` | `4096`                  | Taille de fenêtre de contexte pour le contexte d’embeddings. 4096 couvre les fragments typiques (128–512 jetons) tout en bornant la VRAM non liée aux poids. Abaissez à 1024–2048 sur des hôtes contraints. `"auto"` utilise le maximum entraîné du modèle — déconseillé pour 8B+ (Qwen3-Embedding-8B : 40 960 jetons → ~32 GB de VRAM contre ~8,8 GB à 4096). |

Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, téléchargé automatiquement).
Nécessite une build native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par le Gateway :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Si `provider` vaut `auto`, `local` n’est sélectionné que lorsque `local.modelPath` pointe
vers un fichier local existant. Les références de modèle `hf:` et HTTP(S) peuvent toujours être utilisées
explicitement avec `provider: "local"`, mais elles ne suffisent pas à faire sélectionner `local`
par `auto` avant que le modèle ne soit disponible sur disque.

---

## Configuration de la recherche hybride

Tout se trouve sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Par défaut | Description                             |
| --------------------- | --------- | ---------- | --------------------------------------- |
| `enabled`             | `boolean` | `true`     | Activer la recherche hybride BM25 + vectorielle |
| `vectorWeight`        | `number`  | `0.7`      | Poids des scores vectoriels (0-1)       |
| `textWeight`          | `number`  | `0.3`      | Poids des scores BM25 (0-1)             |
| `candidateMultiplier` | `number`  | `4`        | Multiplicateur de taille du pool de candidats |

### MMR (diversité)

| Clé           | Type      | Par défaut | Description                            |
| ------------- | --------- | ---------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`    | Activer le reranking MMR               |
| `mmr.lambda`  | `number`  | `0.7`      | 0 = diversité max, 1 = pertinence max  |

### Décroissance temporelle (récence)

| Clé                         | Type      | Par défaut | Description                    |
| --------------------------- | --------- | ---------- | ------------------------------ |
| `temporalDecay.enabled`     | `boolean` | `false`    | Activer un boost de récence    |
| `temporalDecay.halfLifeDays`| `number`  | `30`       | Le score est divisé par deux tous les N jours |

Les fichiers persistants (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

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

## Chemins de mémoire supplémentaires

| Clé          | Type       | Description                                |
| ------------ | ---------- | ------------------------------------------ |
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
récursivement pour les fichiers `.md`. La gestion des liens symboliques dépend du backend actif :
le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement du
scanner QMD sous-jacent.

Pour la recherche de transcription inter-agents ciblée par agent, utilisez
`agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`.
Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais
elles sont fusionnées par agent et peuvent préserver des noms partagés explicites lorsque le chemin
pointe en dehors de l’espace de travail courant.
Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et
`memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez images et audio en plus du Markdown à l’aide de Gemini Embedding 2 :

| Clé                        | Type       | Par défaut | Description                              |
| -------------------------- | ---------- | ---------- | ---------------------------------------- |
| `multimodal.enabled`       | `boolean`  | `false`    | Activer l’indexation multimodale         |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]`, ou `["all"]`   |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | Taille maximale de fichier pour l’indexation |

Ne s’applique qu’aux fichiers de `extraPaths`. Les racines de mémoire par défaut restent limitées au Markdown.
Nécessite `gemini-embedding-2-preview`. `fallback` doit valoir `"none"`.

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache des embeddings

| Clé                | Type      | Par défaut | Description                              |
| ------------------ | --------- | ---------- | ---------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Mettre en cache les embeddings de fragments dans SQLite |
| `cache.maxEntries` | `number`  | `50000`    | Nombre maximal d’embeddings en cache     |

Évite de ré-embarquer un texte inchangé lors d’une réindexation ou d’une mise à jour de transcription.

---

## Indexation par lots

| Clé                           | Type      | Par défaut | Description                      |
| ----------------------------- | --------- | ---------- | -------------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`    | Activer l’API d’embeddings par lots |
| `remote.batch.concurrency`    | `number`  | `2`        | Tâches de lots parallèles        |
| `remote.batch.wait`           | `boolean` | `true`     | Attendre la fin du lot           |
| `remote.batch.pollIntervalMs` | `number`  | --         | Intervalle d’interrogation       |
| `remote.batch.timeoutMinutes` | `number`  | --         | Délai maximal du lot             |

Disponible pour `openai`, `gemini` et `voyage`. Le traitement par lots OpenAI est généralement
le plus rapide et le moins coûteux pour les gros backfills.

---

## Recherche mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Clé                           | Type       | Par défaut    | Description                               |
| ----------------------------- | ---------- | ------------- | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`       | Activer l’indexation des sessions         |
| `sources`                     | `string[]` | `["memory"]`  | Ajouter `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`      | Seuil d’octets pour la réindexation       |
| `sync.sessions.deltaMessages` | `number`   | `50`          | Seuil de messages pour la réindexation    |

L’indexation de session est en opt-in et s’exécute de manière asynchrone. Les résultats peuvent être légèrement
obsolètes. Les journaux de session résident sur disque ; traitez donc l’accès au système de fichiers comme la
frontière de confiance.

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Par défaut | Description                            |
| ---------------------------- | --------- | ---------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`     | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | groupé     | Remplacer le chemin sqlite-vec         |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à une similarité
cosinus en processus.

---

## Stockage de l’index

| Clé                   | Type     | Par défaut                            | Description                                     |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Emplacement de l’index (prend en charge le jeton `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` ou `trigram`)       |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous
`memory.qmd` :

| Clé                      | Type      | Par défaut | Description                                   |
| ------------------------ | --------- | ---------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`      | Chemin de l’exécutable QMD                    |
| `searchMode`             | `string`  | `search`   | Commande de recherche : `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`     | Auto-indexer `MEMORY.md` + `memory/**/*.md`   |
| `paths[]`                | `array`   | --         | Chemins supplémentaires : `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`    | Indexer les transcriptions de session         |
| `sessions.retentionDays` | `number`  | --         | Rétention des transcriptions                  |
| `sessions.exportDir`     | `string`  | --         | Répertoire d’export                           |

OpenClaw préfère les formes actuelles de collection QMD et de requête MCP, mais garde
les anciennes versions de QMD fonctionnelles en revenant aux anciens indicateurs de collection `--mask`
et aux anciens noms d’outils MCP lorsque nécessaire.

Les remplacements de modèle QMD restent du côté QMD, pas dans la configuration OpenClaw. Si vous devez
remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, et `QMD_GENERATE_MODEL` dans l’environnement
d’exécution du gateway.

### Planification des mises à jour

| Clé                       | Type      | Par défaut | Description                              |
| ------------------------- | --------- | ---------- | ---------------------------------------- |
| `update.interval`         | `string`  | `5m`       | Intervalle de rafraîchissement           |
| `update.debounceMs`       | `number`  | `15000`    | Antirebond des changements de fichiers   |
| `update.onBoot`           | `boolean` | `true`     | Rafraîchir au démarrage                  |
| `update.waitForBootSync`  | `boolean` | `false`    | Bloquer le démarrage jusqu’à la fin du rafraîchissement |
| `update.embedInterval`    | `string`  | --         | Cadence séparée des embeddings           |
| `update.commandTimeoutMs` | `number`  | --         | Délai maximal pour les commandes QMD     |
| `update.updateTimeoutMs`  | `number`  | --         | Délai maximal pour les opérations de mise à jour QMD |
| `update.embedTimeoutMs`   | `number`  | --         | Délai maximal pour les opérations d’embedding QMD |

### Limites

| Clé                       | Type     | Par défaut | Description                     |
| ------------------------- | -------- | ---------- | ------------------------------- |
| `limits.maxResults`       | `number` | `6`        | Nombre maximal de résultats de recherche |
| `limits.maxSnippetChars`  | `number` | --         | Limite de longueur des extraits |
| `limits.maxInjectedChars` | `number` | --         | Limite du total de caractères injectés |
| `limits.timeoutMs`        | `number` | `4000`     | Délai maximal de recherche      |

### Portée

Contrôle quelles sessions peuvent recevoir des résultats de recherche QMD. Même schéma que
[`session.sendPolicy`](/fr/gateway/config-agents#session) :

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

La valeur par défaut fournie autorise les sessions directes et les sessions de canal, tout en refusant
les groupes.

La valeur par défaut est réservée aux DM. `match.keyPrefix` correspond à la clé de session normalisée ;
`match.rawKeyPrefix` correspond à la clé brute incluant `agent:<id>:`.

### Citations

`memory.citations` s’applique à tous les backends :

| Valeur           | Comportement                                      |
| ---------------- | ------------------------------------------------- |
| `auto` (par défaut) | Inclure un pied de page `Source: <path#line>` dans les extraits |
| `on`             | Toujours inclure le pied de page                  |
| `off`            | Omettre le pied de page (le chemin est quand même transmis à l’agent en interne) |

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

## Dreaming

Dreaming est configuré sous `plugins.entries.memory-core.config.dreaming`,
et non sous `agents.defaults.memorySearch`.

Dreaming s’exécute comme un balayage planifié unique et utilise des phases light/deep/REM internes comme
détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, voir [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé         | Type      | Par défaut    | Description                                        |
| ----------- | --------- | ------------- | -------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Activer ou désactiver totalement Dreaming         |
| `frequency` | `string`  | `0 3 * * *`   | Cadence Cron facultative pour le balayage Dreaming complet |

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

Remarques :

- Dreaming écrit l’état machine dans `memory/.dreams/`.
- Dreaming écrit une sortie narrative lisible par un humain dans `DREAMS.md` (ou `dreams.md` existant).
- La politique et les seuils des phases light/deep/REM sont un comportement interne, pas une configuration destinée à l’utilisateur.

## Voir aussi

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Référence de configuration](/fr/gateway/configuration-reference)
