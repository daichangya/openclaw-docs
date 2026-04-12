---
read_when:
    - Sie möchten Provider für die Speichersuche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten Hybridsuche, MMR oder zeitlichen Zerfall optimieren
    - Sie möchten multimodale Speicherindizierung aktivieren
summary: Alle Konfigurationsoptionen für Memory-Suche, Embedding-Provider, QMD, Hybridsuche und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-04-12T23:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299ca9b69eea292ea557a2841232c637f5c1daf2bc0f73c0a42f7c0d8d566ce2
    source_path: reference/memory-config.md
    workflow: 15
---

# Referenz zur Speicherkonfiguration

Diese Seite listet alle Konfigurationsoptionen für die OpenClaw-Speichersuche auf. Für
konzeptionelle Übersichten siehe:

- [Speicherüberblick](/de/concepts/memory) -- wie Speicher funktioniert
- [Builtin Engine](/de/concepts/memory-builtin) -- Standard-SQLite-Backend
- [QMD Engine](/de/concepts/memory-qmd) -- lokaler Sidecar mit lokalem Fokus
- [Speichersuche](/de/concepts/memory-search) -- Suchpipeline und Optimierung
- [Active Memory](/de/concepts/active-memory) -- Aktivieren des Speicher-Sub-Agenten für interaktive Sitzungen

Alle Einstellungen für die Speichersuche befinden sich unter `agents.defaults.memorySearch` in
`openclaw.json`, sofern nicht anders angegeben.

Wenn Sie nach dem Feature-Schalter für **Active Memory** und der Konfiguration des Sub-Agenten suchen,
finden Sie diese unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Gates:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID zielen
2. Die Anfrage muss eine geeignete interaktive persistente Chat-Sitzung sein

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell,
die Plugin-eigene Konfiguration, die Persistenz von Transkripten und ein sicheres Rollout-Muster.

---

## Providerauswahl

| Schlüssel  | Typ       | Standard         | Beschreibung                                                                                 |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt | Embedding-Adapter-ID: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                   |
| `fallback` | `string`  | `"none"`         | Fallback-Adapter-ID, wenn der primäre fehlschlägt                                            |
| `enabled`  | `boolean` | `true`           | Speichersuche aktivieren oder deaktivieren                                                    |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren:

1. `local` -- wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
2. `openai` -- wenn ein OpenAI-Schlüssel aufgelöst werden kann.
3. `gemini` -- wenn ein Gemini-Schlüssel aufgelöst werden kann.
4. `voyage` -- wenn ein Voyage-Schlüssel aufgelöst werden kann.
5. `mistral` -- wenn ein Mistral-Schlüssel aufgelöst werden kann.
6. `bedrock` -- wenn die AWS-SDK-Credential-Chain aufgelöst wird (Instance Role, Access Keys, Profile, SSO, Web Identity oder Shared Config).

`ollama` wird unterstützt, aber nicht automatisch erkannt (explizit setzen).

### Auflösung von API-Schlüsseln

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die
standardmäßige AWS-SDK-Credential-Chain (Instance Roles, SSO, Access Keys).

| Provider | Env-Variable                   | Konfigurationsschlüssel          |
| -------- | ------------------------------ | -------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey` |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey` |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey` |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | AWS-Credential-Chain          | Kein API-Schlüssel erforderlich  |
| Ollama   | `OLLAMA_API_KEY` (Platzhalter) | --                               |

Codex OAuth gilt nur für Chat/Completions und erfüllt Embedding-
Anfragen nicht.

---

## Konfiguration von Remote-Endpunkten

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder zum Überschreiben von Provider-Standards:

| Schlüssel         | Typ      | Beschreibung                                  |
| ----------------- | -------- | --------------------------------------------- |
| `remote.baseUrl`  | `string` | Benutzerdefinierte API-Basis-URL              |
| `remote.apiKey`   | `string` | API-Schlüssel überschreiben                   |
| `remote.headers`  | `object` | Zusätzliche HTTP-Header (mit Provider-Standards zusammengeführt) |

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

| Schlüssel               | Typ      | Standard               | Beschreibung                                 |
| ----------------------- | -------- | ---------------------- | -------------------------------------------- |
| `model`                 | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
| `outputDimensionality`  | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072         |

<Warning>
Das Ändern von `model` oder `outputDimensionality` löst eine automatische vollständige Neuindizierung aus.
</Warning>

---

## Bedrock-Embedding-Konfiguration

Bedrock verwendet die standardmäßige AWS-SDK-Credential-Chain -- keine API-Schlüssel erforderlich.
Wenn OpenClaw auf EC2 mit einer Bedrock-fähigen Instance Role läuft, setzen Sie einfach
Provider und Modell:

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

| Schlüssel               | Typ      | Standard                     | Beschreibung                    |
| ----------------------- | -------- | ---------------------------- | ------------------------------- |
| `model`                 | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
| `outputDimensionality`  | `number` | Modellstandard              | Für Titan V2: 256, 512 oder 1024 |

### Unterstützte Modelle

Die folgenden Modelle werden unterstützt (mit Familienerkennung und Standardwerten
für Dimensionen):

| Modell-ID                                  | Provider   | Standard-Dimensionen | Konfigurierbare Dimensionen |
| ------------------------------------------ | ---------- | -------------------- | --------------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                 | 256, 512, 1024              |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536                 | --                          |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                 | --                          |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024                 | --                          |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                 | 256, 384, 1024, 3072        |
| `cohere.embed-english-v3`                  | Cohere     | 1024                 | --                          |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024                 | --                          |
| `cohere.embed-v4:0`                        | Cohere     | 1536                 | 256-1536                    |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                  | --                          |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                 | --                          |

Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) übernehmen
die Konfiguration des Basismodells.

### Authentifizierung

Bedrock-Auth verwendet die standardmäßige Reihenfolge der AWS-SDK-Credential-Auflösung:

1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO-Token-Cache
3. Credentials über Web-Identity-Token
4. Gemeinsame Credentials- und Konfigurationsdateien
5. ECS- oder EC2-Metadaten-Credentials

Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der
`amazon-bedrock`-`baseUrl` des Providers ermittelt oder fällt standardmäßig auf `us-east-1` zurück.

### IAM-Berechtigungen

Die IAM-Rolle oder der IAM-Benutzer benötigt:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Für Least-Privilege beschränken Sie `InvokeModel` auf das konkrete Modell:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Konfiguration lokaler Embeddings

| Schlüssel              | Typ      | Standard               | Beschreibung                    |
| ---------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`      | `string` | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei  |
| `local.modelCacheDir`  | `string` | `node-llama-cpp`-Standard | Cache-Verzeichnis für heruntergeladene Modelle |

Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen).
Erfordert einen nativen Build: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

---

## Konfiguration der Hybridsuche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel              | Typ       | Standard | Beschreibung                         |
| ---------------------- | --------- | -------- | ------------------------------------ |
| `enabled`              | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren |
| `vectorWeight`         | `number`  | `0.7`    | Gewicht für Vektor-Scores (0-1)      |
| `textWeight`           | `number`  | `0.3`    | Gewicht für BM25-Scores (0-1)        |
| `candidateMultiplier`  | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

### MMR (Diversität)

| Schlüssel      | Typ       | Standard | Beschreibung                             |
| -------------- | --------- | -------- | ---------------------------------------- |
| `mmr.enabled`  | `boolean` | `false`  | MMR-Re-Ranking aktivieren                |
| `mmr.lambda`   | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |

### Zeitlicher Zerfall (Aktualität)

| Schlüssel                     | Typ       | Standard | Beschreibung                     |
| ----------------------------- | --------- | -------- | -------------------------------- |
| `temporalDecay.enabled`       | `boolean` | `false`  | Aktualitäts-Boost aktivieren     |
| `temporalDecay.halfLifeDays`  | `number`  | `30`     | Score halbiert sich alle N Tage  |

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

## Zusätzliche Speicherpfade

| Schlüssel   | Typ        | Beschreibung                                  |
| ----------- | ---------- | --------------------------------------------- |
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

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden
rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab:
Die Builtin Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-
Scanners folgt.

Für agentenspezifische agentenübergreifende Transkriptsuche verwenden Sie
`agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`.
Diese zusätzlichen Collections folgen derselben Form `{ path, name, pattern? }`, werden jedoch
pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad
außerhalb des aktuellen Workspace liegt.
Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in
`memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das
Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mit Gemini Embedding 2:

| Schlüssel                   | Typ        | Standard   | Beschreibung                           |
| --------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`        | `boolean`  | `false`    | Multimodale Indizierung aktivieren     |
| `multimodal.modalities`     | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes`   | `number`   | `10000000` | Maximale Dateigröße für die Indizierung |

Gilt nur für Dateien in `extraPaths`. Standard-Speicher-Roots bleiben nur für Markdown.
Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel           | Typ       | Standard | Beschreibung                         |
| ------------------- | --------- | -------- | ------------------------------------ |
| `cache.enabled`     | `boolean` | `false`  | Chunk-Embeddings in SQLite cachen    |
| `cache.maxEntries`  | `number`  | `50000`  | Maximale Anzahl gecachter Embeddings |

Verhindert das erneute Erzeugen von Embeddings für unveränderten Text bei Neuindizierung oder Transkript-Updates.

---

## Batch-Indizierung

| Schlüssel                    | Typ       | Standard | Beschreibung                   |
| ---------------------------- | --------- | -------- | ------------------------------ |
| `remote.batch.enabled`       | `boolean` | `false`  | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`   | `number`  | `2`      | Parallele Batch-Jobs           |
| `remote.batch.wait`          | `boolean` | `true`   | Auf Abschluss des Batch warten |
| `remote.batch.pollIntervalMs`| `number`  | --       | Polling-Intervall              |
| `remote.batch.timeoutMinutes`| `number`  | --       | Batch-Timeout                  |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batches sind in der Regel
am schnellsten und günstigsten für große Backfills.

---

## Sitzungs-Speichersuche (experimentell)

Indizieren Sie Sitzungs-Transkripte und stellen Sie sie über `memory_search` bereit:

| Schlüssel                    | Typ        | Standard      | Beschreibung                              |
| ---------------------------- | ---------- | ------------- | ----------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`       | Sitzungsindizierung aktivieren            |
| `sources`                    | `string[]` | `["memory"]`  | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`   | `number`   | `100000`      | Byte-Schwelle für Neuindizierung          |
| `sync.sessions.deltaMessages`| `number`   | `50`          | Nachrichten-Schwelle für Neuindizierung   |

Die Sitzungsindizierung ist Opt-in und läuft asynchron. Ergebnisse können leicht
veraltet sein. Sitzungslogs liegen auf dem Datenträger, daher sollte der Dateisystemzugriff als Vertrauensgrenze betrachtet werden.

---

## SQLite-Vektorbeschleunigung (`sqlite-vec`)

| Schlüssel                     | Typ       | Standard | Beschreibung                          |
| ----------------------------- | --------- | -------- | ------------------------------------- |
| `store.vector.enabled`        | `boolean` | `true`   | `sqlite-vec` für Vektorabfragen verwenden |
| `store.vector.extensionPath`  | `string`  | gebündelt | Pfad zu `sqlite-vec` überschreiben   |

Wenn `sqlite-vec` nicht verfügbar ist, fällt OpenClaw automatisch auf In-Process-Kosinus-
Ähnlichkeit zurück.

---

## Indexspeicherung

| Schlüssel              | Typ      | Standard                              | Beschreibung                                  |
| ---------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`           | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Speicherort des Index (unterstützt Token `{agentId}`) |
| `store.fts.tokenizer`  | `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`)   |

---

## Konfiguration des QMD-Backends

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter
`memory.qmd`:

| Schlüssel                 | Typ       | Standard | Beschreibung                                  |
| ------------------------- | --------- | -------- | --------------------------------------------- |
| `command`                 | `string`  | `qmd`    | Pfad zur QMD-Executable                       |
| `searchMode`              | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`      |
| `includeDefaultMemory`    | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indizieren |
| `paths[]`                 | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`        | `boolean` | `false`  | Sitzungs-Transkripte indizieren               |
| `sessions.retentionDays`  | `number`  | --       | Aufbewahrung von Transkripten                 |
| `sessions.exportDir`      | `string`  | --       | Exportverzeichnis                             |

OpenClaw bevorzugt die aktuellen QMD-Collection- und MCP-Abfrageformen, hält
aber ältere QMD-Releases funktionsfähig, indem bei Bedarf auf veraltete `--mask`-Collection-Flags
und ältere MCP-Tool-Namen zurückgefallen wird.

QMD-Modell-Overrides bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie
QMD-Modelle global überschreiben müssen, setzen Sie Umgebungsvariablen wie
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-
Laufzeitumgebung.

### Update-Zeitplan

| Schlüssel                  | Typ       | Standard | Beschreibung                              |
| -------------------------- | --------- | -------- | ----------------------------------------- |
| `update.interval`          | `string`  | `5m`     | Aktualisierungsintervall                  |
| `update.debounceMs`        | `number`  | `15000`  | Entprellung für Dateiveränderungen        |
| `update.onBoot`            | `boolean` | `true`   | Beim Start aktualisieren                  |
| `update.waitForBootSync`   | `boolean` | `false`  | Start blockieren, bis Aktualisierung abgeschlossen ist |
| `update.embedInterval`     | `string`  | --       | Separate Embedding-Taktung                |
| `update.commandTimeoutMs`  | `number`  | --       | Timeout für QMD-Befehle                   |
| `update.updateTimeoutMs`   | `number`  | --       | Timeout für QMD-Update-Vorgänge           |
| `update.embedTimeoutMs`    | `number`  | --       | Timeout für QMD-Embedding-Vorgänge        |

### Limits

| Schlüssel                  | Typ      | Standard | Beschreibung                    |
| -------------------------- | -------- | -------- | ------------------------------- |
| `limits.maxResults`        | `number` | `6`      | Maximale Suchergebnisse         |
| `limits.maxSnippetChars`   | `number` | --       | Snippet-Länge begrenzen         |
| `limits.maxInjectedChars`  | `number` | --       | Insgesamt eingefügte Zeichen begrenzen |
| `limits.timeoutMs`         | `number` | `4000`   | Such-Timeout                    |

### Geltungsbereich

Steuert, welche Sitzungen QMD-Suchergebnisse erhalten können. Gleiches Schema wie
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

Der mitgelieferte Standard erlaubt direkte Sitzungen und Kanalsitzungen, verweigert aber weiterhin
Gruppen.

Standard ist nur DM. `match.keyPrefix` vergleicht mit dem normalisierten Sitzungsschlüssel;
`match.rawKeyPrefix` mit dem rohen Schlüssel einschließlich `agent:<id>:`.

### Zitate

`memory.citations` gilt für alle Backends:

| Wert             | Verhalten                                           |
| ---------------- | --------------------------------------------------- |
| `auto` (Standard) | `Source: <path#line>`-Fußzeile in Snippets einfügen |
| `on`             | Fußzeile immer einfügen                             |
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
nicht unter `agents.defaults.memorySearch`.

Dreaming läuft als ein geplanter Sweep und verwendet interne Light-/Deep-/REM-Phasen als
Implementierungsdetail.

Für konzeptionelles Verhalten und Slash-Befehle siehe [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel    | Typ       | Standard      | Beschreibung                                      |
| ------------ | --------- | ------------- | ------------------------------------------------- |
| `enabled`    | `boolean` | `false`       | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency`  | `string`  | `0 3 * * *`   | Optionaler Cron-Takt für den vollständigen Dreaming-Sweep |

### Beispiel

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

Hinweise:

- Dreaming schreibt Maschinenstatus nach `memory/.dreams/`.
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in eine vorhandene `dreams.md`).
- Die Richtlinien und Schwellenwerte für Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.
