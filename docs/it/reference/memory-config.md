---
read_when:
    - Vuoi configurare provider di ricerca nella memoria o modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi regolare ricerca ibrida, MMR o decadimento temporale
    - Vuoi abilitare l'indicizzazione della memoria multimodale
summary: Tutte le opzioni di configurazione per ricerca nella memoria, provider di embedding, QMD, ricerca ibrida e indicizzazione multimodale
title: Riferimento della configurazione della memoria
x-i18n:
    generated_at: "2026-04-12T23:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299ca9b69eea292ea557a2841232c637f5c1daf2bc0f73c0a42f7c0d8d566ce2
    source_path: reference/memory-config.md
    workflow: 15
---

# Riferimento della configurazione della memoria

Questa pagina elenca tutte le opzioni di configurazione per la ricerca nella memoria di OpenClaw. Per
le panoramiche concettuali, vedi:

- [Panoramica della memoria](/it/concepts/memory) -- come funziona la memoria
- [Motore integrato](/it/concepts/memory-builtin) -- backend SQLite predefinito
- [Motore QMD](/it/concepts/memory-qmd) -- sidecar local-first
- [Ricerca nella memoria](/it/concepts/memory-search) -- pipeline di ricerca e regolazione
- [Active Memory](/it/concepts/active-memory) -- abilitazione del sotto-agente di memoria per le sessioni interattive

Tutte le impostazioni di ricerca nella memoria si trovano sotto `agents.defaults.memorySearch` in
`openclaw.json`, salvo diversa indicazione.

Se stai cercando l'interruttore della funzionalità **Active Memory** e la configurazione del sotto-agente,
si trovano sotto `plugins.entries.active-memory` invece che sotto `memorySearch`.

Active Memory usa un modello a due gate:

1. il Plugin deve essere abilitato e puntare all'ID agente corrente
2. la richiesta deve essere una sessione di chat persistente interattiva idonea

Vedi [Active Memory](/it/concepts/active-memory) per il modello di attivazione,
la configurazione posseduta dal Plugin, la persistenza delle trascrizioni e il modello di rollout sicuro.

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito     | Descrizione                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | rilevato automaticamente | ID dell'adattatore di embedding: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | provider predefinito | Nome del modello di embedding                                                               |
| `fallback` | `string`  | `"none"`         | ID dell'adattatore di fallback quando quello principale fallisce                            |
| `enabled`  | `boolean` | `true`           | Abilita o disabilita la ricerca nella memoria                                               |

### Ordine di rilevamento automatico

Quando `provider` non è impostato, OpenClaw seleziona il primo disponibile:

1. `local` -- se `memorySearch.local.modelPath` è configurato e il file esiste.
2. `openai` -- se è possibile risolvere una chiave OpenAI.
3. `gemini` -- se è possibile risolvere una chiave Gemini.
4. `voyage` -- se è possibile risolvere una chiave Voyage.
5. `mistral` -- se è possibile risolvere una chiave Mistral.
6. `bedrock` -- se la catena di credenziali predefinita dell'SDK AWS viene risolta (ruolo istanza, chiavi di accesso, profilo, SSO, web identity o configurazione condivisa).

`ollama` è supportato ma non viene rilevato automaticamente (impostalo esplicitamente).

### Risoluzione della chiave API

Gli embedding remoti richiedono una chiave API. Bedrock usa invece la catena di
credenziali predefinita dell'SDK AWS (ruoli istanza, SSO, chiavi di accesso).

| Provider | Variabile env                 | Chiave config                      |
| -------- | ----------------------------- | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey`  |
| Bedrock  | Catena di credenziali AWS     | Nessuna chiave API necessaria      |
| Ollama   | `OLLAMA_API_KEY` (segnaposto) | --                                 |

Codex OAuth copre solo chat/completions e non soddisfa le richieste di embedding.

---

## Configurazione dell'endpoint remoto

Per endpoint personalizzati compatibili con OpenAI o per sovrascrivere i valori predefiniti del provider:

| Chiave           | Tipo     | Descrizione                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | URL di base API personalizzato                     |
| `remote.apiKey`  | `string` | Sovrascrive la chiave API                          |
| `remote.headers` | `object` | Header HTTP aggiuntivi (uniti con i valori predefiniti del provider) |

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

## Configurazione specifica di Gemini

| Chiave                 | Tipo     | Predefinito            | Descrizione                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Per Embedding 2: 768, 1536 o 3072          |

<Warning>
Cambiare il modello o `outputDimensionality` attiva automaticamente una reindicizzazione completa.
</Warning>

---

## Configurazione degli embedding Bedrock

Bedrock usa la catena di credenziali predefinita dell'SDK AWS -- non servono chiavi API.
Se OpenClaw viene eseguito su EC2 con un ruolo istanza abilitato per Bedrock, basta impostare
provider e modello:

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

| Chiave                 | Tipo     | Predefinito                    | Descrizione                     |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualsiasi ID modello embedding Bedrock |
| `outputDimensionality` | `number` | modello predefinito            | Per Titan V2: 256, 512 o 1024   |

### Modelli supportati

Sono supportati i seguenti modelli (con rilevamento della famiglia e valori dimensionali
predefiniti):

| ID modello                                 | Provider   | Dim predefinite | Dim configurabili    |
| ------------------------------------------ | ---------- | --------------- | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024            | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536            | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536            | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024            | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024            | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024            | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024            | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536            | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512             | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024            | --                   |

Le varianti con suffisso di throughput (ad esempio `amazon.titan-embed-text-v1:2:8k`) ereditano
la configurazione del modello di base.

### Autenticazione

L'autenticazione Bedrock usa l'ordine standard di risoluzione delle credenziali dell'SDK AWS:

1. Variabili d'ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache del token SSO
3. Credenziali del token web identity
4. File condivisi di credenziali e configurazione
5. Credenziali dei metadata ECS o EC2

La regione viene risolta da `AWS_REGION`, `AWS_DEFAULT_REGION`, dal
`baseUrl` del provider `amazon-bedrock`, oppure usa come valore predefinito `us-east-1`.

### Permessi IAM

Il ruolo IAM o l'utente deve avere:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Per il principio del privilegio minimo, limita `InvokeModel` al modello specifico:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configurazione degli embedding locali

| Chiave                | Tipo     | Predefinito            | Descrizione                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | scaricato automaticamente | Percorso del file modello GGUF |
| `local.modelCacheDir` | `string` | predefinito node-llama-cpp | Directory cache per i modelli scaricati |

Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, scaricato automaticamente).
Richiede build nativa: `pnpm approve-builds` poi `pnpm rebuild node-llama-cpp`.

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                         |
| --------------------- | --------- | ----------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1) |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)      |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

### MMR (diversità)

| Chiave        | Tipo      | Predefinito | Descrizione                          |
| ------------- | --------- | ----------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false`     | Abilita il reranking MMR             |
| `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima rilevanza |

### Decadimento temporale (recency)

| Chiave                       | Tipo      | Predefinito | Descrizione                    |
| ---------------------------- | --------- | ----------- | ------------------------------ |
| `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost della recency |
| `temporalDecay.halfLifeDays` | `number`  | `30`        | Il punteggio si dimezza ogni N giorni |

I file evergreen (`MEMORY.md`, file senza data in `memory/`) non subiscono mai decadimento.

### Esempio completo

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

## Percorsi di memoria aggiuntivi

| Chiave       | Tipo       | Descrizione                               |
| ------------ | ---------- | ----------------------------------------- |
| `extraPaths` | `string[]` | Directory o file aggiuntivi da indicizzare |

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

I percorsi possono essere assoluti o relativi al workspace. Le directory vengono scansionate
ricorsivamente per i file `.md`. La gestione dei collegamenti simbolici dipende dal backend attivo:
il motore integrato ignora i collegamenti simbolici, mentre QMD segue il comportamento dello
scanner QMD sottostante.

Per la ricerca di trascrizioni cross-agent con ambito agente, usa
`agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`.
Queste raccolte aggiuntive seguono la stessa forma `{ path, name, pattern? }`, ma
vengono unite per agente e possono conservare nomi condivisi espliciti quando il percorso
punta fuori dal workspace corrente.
Se lo stesso percorso risolto appare sia in `memory.qmd.paths` sia in
`memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il
duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme al Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                               |
| ------------------------- | ---------- | ----------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale      |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` oppure `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file per l'indicizzazione |

Si applica solo ai file in `extraPaths`. Le radici di memoria predefinite restano solo Markdown.
Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Predefinito | Descrizione                      |
| ------------------ | --------- | ----------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | Memorizza in cache gli embedding dei chunk in SQLite |
| `cache.maxEntries` | `number`  | `50000`     | Numero massimo di embedding in cache |

Impedisce il re-embedding di testo invariato durante la reindicizzazione o gli aggiornamenti delle trascrizioni.

---

## Indicizzazione batch

| Chiave                        | Tipo      | Predefinito | Descrizione                |
| ----------------------------- | --------- | ----------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli        |
| `remote.batch.wait`           | `boolean` | `true`      | Attende il completamento del batch |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling      |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch          |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è tipicamente
il più veloce e conveniente per grandi backfill.

---

## Ricerca nella memoria delle sessioni (sperimentale)

Indicizza le trascrizioni delle sessioni e le espone tramite `memory_search`:

| Chiave                      | Tipo       | Predefinito  | Descrizione                             |
| --------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Abilita l'indicizzazione delle sessioni |
| `sources`                     | `string[]` | `["memory"]` | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Soglia in byte per la reindicizzazione  |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Soglia in messaggi per la reindicizzazione |

L'indicizzazione delle sessioni è opt-in e viene eseguita in modo asincrono. I risultati possono essere leggermente
non aggiornati. I log delle sessioni risiedono su disco, quindi considera l'accesso al filesystem come il confine
di fiducia.

---

## Accelerazione vettoriale SQLite (`sqlite-vec`)

| Chiave                     | Tipo      | Predefinito | Descrizione                       |
| -------------------------- | --------- | ----------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | Usa sqlite-vec per le query vettoriali |
| `store.vector.extensionPath` | `string`  | bundle      | Sovrascrive il percorso di sqlite-vec |

Quando sqlite-vec non è disponibile, OpenClaw torna automaticamente alla
similarità coseno in-process.

---

## Archiviazione dell'indice

| Chiave                | Tipo     | Predefinito                           | Descrizione                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Posizione dell'indice (supporta il token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` o `trigram`)    |

---

## Configurazione del backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto
`memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                  |
| ------------------------ | --------- | ----------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD                 |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --          | Percorsi aggiuntivi: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza le trascrizioni delle sessioni     |
| `sessions.retentionDays` | `number`  | --          | Conservazione delle trascrizioni             |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                    |

OpenClaw preferisce le forme correnti delle raccolte QMD e delle query MCP, ma continua
a far funzionare le release più vecchie di QMD usando il fallback verso i flag legacy delle raccolte `--mask`
e i vecchi nomi degli strumenti MCP quando necessario.

Gli override dei modelli QMD restano sul lato QMD, non nella configurazione OpenClaw. Se hai bisogno di
sovrascrivere globalmente i modelli di QMD, imposta variabili d'ambiente come
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente di runtime
del gateway.

### Pianificazione degli aggiornamenti

| Chiave                    | Tipo      | Predefinito | Descrizione                              |
| ------------------------- | --------- | ----------- | ---------------------------------------- |
| `update.interval`         | `string`  | `5m`        | Intervallo di aggiornamento              |
| `update.debounceMs`       | `number`  | `15000`     | Debounce delle modifiche ai file         |
| `update.onBoot`           | `boolean` | `true`      | Aggiorna all'avvio                       |
| `update.waitForBootSync`  | `boolean` | `false`     | Blocca l'avvio finché l'aggiornamento non è completato |
| `update.embedInterval`    | `string`  | --          | Cadenza separata per gli embedding       |
| `update.commandTimeoutMs` | `number`  | --          | Timeout per i comandi QMD                |
| `update.updateTimeoutMs`  | `number`  | --          | Timeout per le operazioni `qmd update`   |
| `update.embedTimeoutMs`   | `number`  | --          | Timeout per le operazioni `qmd embed`    |

### Limiti

| Chiave                    | Tipo     | Predefinito | Descrizione                     |
| ------------------------- | -------- | ----------- | ------------------------------- |
| `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
| `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza dello snippet |
| `limits.maxInjectedChars` | `number` | --          | Limita il totale dei caratteri inseriti |
| `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca           |

### Ambito

Controlla quali sessioni possono ricevere i risultati di ricerca QMD. Stesso schema di
[`session.sendPolicy`](/it/gateway/configuration-reference#session):

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

Il valore predefinito distribuito consente sessioni dirette e di canale, continuando però a negare
i gruppi.

Il valore predefinito è solo DM. `match.keyPrefix` confronta la chiave di sessione normalizzata;
`match.rawKeyPrefix` confronta la chiave grezza inclusa `agent:<id>:`.

### Citazioni

`memory.citations` si applica a tutti i backend:

| Valore           | Comportamento                                         |
| ---------------- | ----------------------------------------------------- |
| `auto` (predefinito) | Include il piè di pagina `Source: <path#line>` negli snippet |
| `on`             | Include sempre il piè di pagina                       |
| `off`            | Omette il piè di pagina (il percorso viene comunque passato internamente all'agente) |

### Esempio completo QMD

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

## Dreaming (sperimentale)

Dreaming è configurato sotto `plugins.entries.memory-core.config.dreaming`,
non sotto `agents.defaults.memorySearch`.

Dreaming viene eseguito come una scansione pianificata unica e usa internamente le fasi light/deep/REM come
dettaglio di implementazione.

Per il comportamento concettuale e i comandi slash, vedi [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave      | Tipo      | Predefinito | Descrizione                                         |
| ----------- | --------- | ----------- | --------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Abilita o disabilita completamente Dreaming         |
| `frequency` | `string`  | `0 3 * * *` | Cadenza Cron facoltativa per la scansione completa di Dreaming |

### Esempio

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

Note:

- Dreaming scrive lo stato macchina in `memory/.dreams/`.
- Dreaming scrive output narrativo leggibile da umani in `DREAMS.md` (o `dreams.md` esistente).
- La policy delle fasi light/deep/REM e le soglie sono comportamento interno, non configurazione esposta all'utente.
