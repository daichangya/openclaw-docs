---
read_when:
    - Sie möchten Memory-Search-Provider oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten Hybrid Search, MMR oder zeitlichen Zerfall abstimmen
    - Sie möchten multimodale Memory-Indizierung aktivieren
summary: Alle Konfigurationsoptionen für Memory Search, Embedding-Provider, QMD, Hybrid Search und multimodale Indizierung
title: Referenz zur Memory-Konfiguration
x-i18n:
    generated_at: "2026-04-05T12:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Referenz zur Memory-Konfiguration

Diese Seite listet jede Konfigurationsoption für OpenClaw Memory Search auf. Für
konzeptionelle Überblicke siehe:

- [Memory-Überblick](/de/concepts/memory) -- wie Memory funktioniert
- [Integrierte Engine](/de/concepts/memory-builtin) -- Standard-SQLite-Backend
- [QMD-Engine](/de/concepts/memory-qmd) -- lokaler Sidecar mit Local-First-Ansatz
- [Memory Search](/de/concepts/memory-search) -- Suchpipeline und Abstimmung

Alle Einstellungen für Memory Search befinden sich unter `agents.defaults.memorySearch` in
`openclaw.json`, sofern nicht anders angegeben.

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standard        | Beschreibung                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------ |
| `provider` | `string`  | automatisch erkannt | ID des Embedding-Adapters: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                     |
| `fallback` | `string`  | `"none"`         | ID des Fallback-Adapters, wenn der primäre fehlschlägt                         |
| `enabled`  | `boolean` | `true`           | Memory Search aktivieren oder deaktivieren                                     |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren:

1. `local` -- wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
2. `openai` -- wenn ein OpenAI-Schlüssel aufgelöst werden kann.
3. `gemini` -- wenn ein Gemini-Schlüssel aufgelöst werden kann.
4. `voyage` -- wenn ein Voyage-Schlüssel aufgelöst werden kann.
5. `mistral` -- wenn ein Mistral-Schlüssel aufgelöst werden kann.

`ollama` wird unterstützt, aber nicht automatisch erkannt (explizit setzen).

### Auflösung von API-Schlüsseln

Entfernte Embeddings erfordern einen API-Schlüssel. OpenClaw löst diese auf aus:
Authentifizierungsprofilen, `models.providers.*.apiKey` oder Umgebungsvariablen.

| Provider | Umgebungsvariable             | Konfigurationsschlüssel            |
| -------- | ----------------------------- | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey`  |
| Ollama   | `OLLAMA_API_KEY` (Platzhalter) | --                                |

Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-
Anfragen.

---

## Konfiguration entfernter Endpunkte

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder zum Überschreiben von Provider-Standards:

| Schlüssel        | Typ      | Beschreibung                                        |
| ---------------- | -------- | --------------------------------------------------- |
| `remote.baseUrl` | `string` | Benutzerdefinierte API-Base-URL                     |
| `remote.apiKey`  | `string` | API-Schlüssel überschreiben                         |
| `remote.headers` | `object` | Zusätzliche HTTP-Header (werden mit Provider-Standards zusammengeführt) |

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

## Gemini-spezifische Konfiguration

| Schlüssel               | Typ      | Standard               | Beschreibung                                |
| ----------------------- | -------- | ---------------------- | ------------------------------------------- |
| `model`                 | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
| `outputDimensionality`  | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072        |

<Warning>
Das Ändern von `model` oder `outputDimensionality` löst automatisch eine vollständige Neuindizierung aus.
</Warning>

---

## Lokale Embedding-Konfiguration

| Schlüssel              | Typ      | Standard               | Beschreibung                        |
| ---------------------- | -------- | ---------------------- | ----------------------------------- |
| `local.modelPath`      | `string` | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei        |
| `local.modelCacheDir`  | `string` | Standard von node-llama-cpp | Cache-Verzeichnis für heruntergeladene Modelle |

Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen).
Erfordert nativen Build: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

---

## Hybrid-Search-Konfiguration

Alles unter `memorySearch.query.hybrid`:

| Schlüssel              | Typ       | Standard | Beschreibung                         |
| ---------------------- | --------- | -------- | ------------------------------------ |
| `enabled`              | `boolean` | `true`   | Hybrid BM25 + Vector Search aktivieren |
| `vectorWeight`         | `number`  | `0.7`    | Gewichtung für Vektor-Scores (0-1)   |
| `textWeight`           | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)     |
| `candidateMultiplier`  | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

### MMR (Diversität)

| Schlüssel      | Typ       | Standard | Beschreibung                               |
| -------------- | --------- | -------- | ------------------------------------------ |
| `mmr.enabled`  | `boolean` | `false`  | MMR-Re-Ranking aktivieren                  |
| `mmr.lambda`   | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |

### Zeitlicher Zerfall (Aktualität)

| Schlüssel                     | Typ       | Standard | Beschreibung                         |
| ----------------------------- | --------- | -------- | ------------------------------------ |
| `temporalDecay.enabled`       | `boolean` | `false`  | Aktualitäts-Boost aktivieren         |
| `temporalDecay.halfLifeDays`  | `number`  | `30`     | Score halbiert sich alle N Tage      |

Immergrüne Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen nie einem Zerfall.

### Vollständiges Beispiel

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

## Zusätzliche Memory-Pfade

| Schlüssel   | Typ        | Beschreibung                               |
| ----------- | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | Zusätzliche Verzeichnisse oder Dateien zur Indizierung |

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

Pfade können absolut oder relativ zum Arbeitsbereich sein. Verzeichnisse werden
rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab:
Die integrierte Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-
Scanners folgt.

Für agentenspezifische agentenübergreifende Transkriptsuche verwenden Sie
`agents.list[].memorySearch.qmd.extraCollections` anstelle von `memory.qmd.paths`.
Diese zusätzlichen Collections folgen derselben Form `{ path, name, pattern? }`, werden jedoch
pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad
außerhalb des aktuellen Arbeitsbereichs liegt.
Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in
`memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das
Duplikat.

---

## Multimodales Memory (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                  | Typ        | Standard   | Beschreibung                             |
| -------------------------- | ---------- | ---------- | ---------------------------------------- |
| `multimodal.enabled`       | `boolean`  | `false`    | Multimodale Indizierung aktivieren       |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | Maximale Dateigröße für die Indizierung  |

Gilt nur für Dateien in `extraPaths`. Standard-Memory-Roots bleiben nur für Markdown.
Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel         | Typ       | Standard | Beschreibung                         |
| ----------------- | --------- | -------- | ------------------------------------ |
| `cache.enabled`   | `boolean` | `false`  | Chunk-Embeddings in SQLite cachen    |
| `cache.maxEntries`| `number`  | `50000`  | Maximale Anzahl gecachter Embeddings |

Verhindert erneutes Embedding unveränderten Texts bei Neuindizierung oder Transkriptaktualisierungen.

---

## Batch-Indizierung

| Schlüssel                    | Typ       | Standard | Beschreibung                  |
| ---------------------------- | --------- | -------- | ----------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`  | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`   | `number`  | `2`      | Parallele Batch-Jobs          |
| `remote.batch.wait`          | `boolean` | `true`   | Auf Batch-Abschluss warten    |
| `remote.batch.pollIntervalMs`| `number`  | --       | Polling-Intervall             |
| `remote.batch.timeoutMinutes`| `number`  | --       | Batch-Timeout                 |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist typischerweise
am schnellsten und günstigsten für große Backfills.

---

## Session Memory Search (experimentell)

Indizieren Sie Sitzungs-Transkripte und stellen Sie sie über `memory_search` bereit:

| Schlüssel                    | Typ        | Standard     | Beschreibung                               |
| ---------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory` | `boolean`  | `false`      | Sitzungsindizierung aktivieren             |
| `sources`                    | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzuschließen |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Byte-Schwellenwert für Neuindizierung      |
| `sync.sessions.deltaMessages`| `number`   | `50`         | Nachrichten-Schwellenwert für Neuindizierung |

Die Sitzungsindizierung ist Opt-in und läuft asynchron. Ergebnisse können leicht
veraltet sein. Sitzungsprotokolle liegen auf der Festplatte, behandeln Sie daher den
Dateisystemzugriff als Vertrauensgrenze.

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                    | Typ       | Standard | Beschreibung                          |
| ---------------------------- | --------- | -------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string`  | gebündelt | sqlite-vec-Pfad überschreiben         |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf Cosinus-
Ähnlichkeit im Prozess zurück.

---

## Index-Speicherung

| Schlüssel            | Typ      | Standard                              | Beschreibung                                  |
| -------------------- | -------- | ------------------------------------ | --------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Speicherort des Index (unterstützt das Token `{agentId}`) |
| `store.fts.tokenizer`| `string` | `unicode61`                          | FTS5-Tokenizer (`unicode61` oder `trigram`)   |

---

## QMD-Backend-Konfiguration

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter
`memory.qmd`:

| Schlüssel                 | Typ       | Standard | Beschreibung                                  |
| ------------------------- | --------- | -------- | --------------------------------------------- |
| `command`                 | `string`  | `qmd`    | Pfad zur ausführbaren QMD-Datei               |
| `searchMode`              | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`      |
| `includeDefaultMemory`    | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indizieren |
| `paths[]`                 | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`        | `boolean` | `false`  | Sitzungs-Transkripte indizieren               |
| `sessions.retentionDays`  | `number`  | --       | Aufbewahrung von Transkripten                 |
| `sessions.exportDir`      | `string`  | --       | Exportverzeichnis                             |

### Aktualisierungszeitplan

| Schlüssel                  | Typ       | Standard | Beschreibung                               |
| -------------------------- | --------- | -------- | ------------------------------------------ |
| `update.interval`          | `string`  | `5m`     | Aktualisierungsintervall                   |
| `update.debounceMs`        | `number`  | `15000`  | Entprellung für Dateiveränderungen         |
| `update.onBoot`            | `boolean` | `true`   | Beim Start aktualisieren                   |
| `update.waitForBootSync`   | `boolean` | `false`  | Start blockieren, bis Aktualisierung abgeschlossen ist |
| `update.embedInterval`     | `string`  | --       | Separater Embedding-Takt                   |
| `update.commandTimeoutMs`  | `number`  | --       | Timeout für QMD-Befehle                    |
| `update.updateTimeoutMs`   | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge    |
| `update.embedTimeoutMs`    | `number`  | --       | Timeout für QMD-Embedding-Vorgänge         |

### Limits

| Schlüssel                  | Typ      | Standard | Beschreibung                   |
| -------------------------- | -------- | -------- | ------------------------------ |
| `limits.maxResults`        | `number` | `6`      | Maximale Suchergebnisse        |
| `limits.maxSnippetChars`   | `number` | --       | Länge von Snippets begrenzen   |
| `limits.maxInjectedChars`  | `number` | --       | Insgesamt eingefügte Zeichen begrenzen |
| `limits.timeoutMs`         | `number` | `4000`   | Such-Timeout                   |

### Geltungsbereich

Steuert, welche Sitzungen QMD-Suchergebnisse empfangen können. Dasselbe Schema wie
[`session.sendPolicy`](/de/gateway/configuration-reference#session):

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

Standard ist nur DM. `match.keyPrefix` gleicht mit dem normalisierten Sitzungsschlüssel ab;
`match.rawKeyPrefix` gleicht mit dem Rohschlüssel einschließlich `agent:<id>:` ab.

### Quellenangaben

`memory.citations` gilt für alle Backends:

| Wert             | Verhalten                                         |
| ---------------- | ------------------------------------------------- |
| `auto` (Standard) | `Source: <path#line>`-Fußzeile in Snippets einfügen |
| `on`             | Fußzeile immer einfügen                           |
| `off`            | Fußzeile weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

### Vollständiges QMD-Beispiel

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

## Dreaming (experimentell)

Dreaming wird unter `plugins.entries.memory-core.config.dreaming` konfiguriert,
nicht unter `agents.defaults.memorySearch`. Konzeptionelle Details und Chat-
Befehle finden Sie unter [Dreaming](/de/concepts/memory-dreaming).

| Schlüssel         | Typ      | Standard       | Beschreibung                                |
| ----------------- | -------- | -------------- | ------------------------------------------- |
| `mode`            | `string` | `"off"`        | Voreinstellung: `off`, `core`, `rem` oder `deep` |
| `cron`            | `string` | Standard der Voreinstellung | Cron-Ausdruck zum Überschreiben des Zeitplans |
| `timezone`        | `string` | Benutzerzeitzone | Zeitzone für die Auswertung des Zeitplans  |
| `limit`           | `number` | Standard der Voreinstellung | Maximal zu fördernde Kandidaten pro Zyklus |
| `minScore`        | `number` | Standard der Voreinstellung | Minimaler gewichteter Score für Förderung |
| `minRecallCount`  | `number` | Standard der Voreinstellung | Mindestschwelle für Recall-Anzahl         |
| `minUniqueQueries`| `number` | Standard der Voreinstellung | Mindestschwelle für unterschiedliche Query-Anzahlen |

### Standardwerte der Voreinstellungen

| Modus   | Takt            | minScore | minRecallCount | minUniqueQueries |
| ------- | --------------- | -------- | -------------- | ---------------- |
| `off`   | Deaktiviert     | --       | --             | --               |
| `core`  | Täglich 3 Uhr   | 0.75     | 3              | 2                |
| `rem`   | Alle 6 Stunden  | 0.85     | 4              | 3                |
| `deep`  | Alle 12 Stunden | 0.80     | 3              | 3                |

### Beispiel

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
