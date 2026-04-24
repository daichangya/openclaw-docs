---
read_when:
    - Sie möchten Provider für die Memory-Suche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten Hybridsuche, MMR oder zeitlichen Verfall abstimmen
    - Sie möchten multimodale Memory-Indexierung aktivieren
summary: Alle Konfigurationsoptionen für Memory-Suche, Embedding-Provider, QMD, Hybridsuche und multimodale Indexierung
title: Memory-Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-24T06:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Diese Seite listet jede Konfigurationsoption für die Memory-Suche in OpenClaw auf. Für
konzeptionelle Übersichten siehe:

- [Memory-Überblick](/de/concepts/memory) -- wie Memory funktioniert
- [Integrierte Engine](/de/concepts/memory-builtin) -- Standard-Backend auf SQLite-Basis
- [QMD-Engine](/de/concepts/memory-qmd) -- lokaler Sidecar-Ansatz
- [Memory-Suche](/de/concepts/memory-search) -- Suchpipeline und Tuning
- [Active Memory](/de/concepts/active-memory) -- Aktivieren des Memory-Subagenten für interaktive Sitzungen

Alle Einstellungen für die Memory-Suche liegen unter `agents.defaults.memorySearch` in
`openclaw.json`, sofern nicht anders angegeben.

Wenn Sie nach dem Feature-Schalter für **Active Memory** und der Konfiguration des Subagenten suchen,
liegt dies unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Gates:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID zielen
2. Die Anfrage muss eine berechtigte interaktive persistente Chat-Sitzung sein

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell,
plugin-eigene Konfiguration, Persistenz des Transkripts und ein sicheres Rollout-Muster.

---

## Providerauswahl

| Schlüssel  | Typ       | Standard         | Beschreibung                                                                                                       |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | automatisch erkannt | ID des Embedding-Adapters: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                                        |
| `fallback` | `string`  | `"none"`         | ID des Fallback-Adapters, wenn der primäre fehlschlägt                                                            |
| `enabled`  | `boolean` | `true`           | Memory-Suche aktivieren oder deaktivieren                                                                         |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren Provider:

1. `local` -- wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
2. `github-copilot` -- wenn ein GitHub-Copilot-Token aufgelöst werden kann (Env-Variable oder Authentifizierungsprofil).
3. `openai` -- wenn ein OpenAI-Schlüssel aufgelöst werden kann.
4. `gemini` -- wenn ein Gemini-Schlüssel aufgelöst werden kann.
5. `voyage` -- wenn ein Voyage-Schlüssel aufgelöst werden kann.
6. `mistral` -- wenn ein Mistral-Schlüssel aufgelöst werden kann.
7. `bedrock` -- wenn die Credential-Chain des AWS SDK aufgelöst werden kann (Instanzrolle, Access Keys, Profil, SSO, Web Identity oder Shared Config).

`ollama` wird unterstützt, aber nicht automatisch erkannt (explizit setzen).

### Auflösung von API-Schlüsseln

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die Standard-
Credential-Chain des AWS SDK (Instanzrollen, SSO, Access Keys).

| Provider       | Env-Variable                                       | Konfigurationsschlüssel            |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS-Credential-Chain                               | Kein API-Schlüssel erforderlich   |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authentifizierungsprofil über Device-Login |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-
Anfragen.

---

## Konfiguration von Remote-Endpunkten

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder zum Überschreiben von Provider-Standards:

| Schlüssel       | Typ      | Beschreibung                                      |
| --------------- | -------- | ------------------------------------------------- |
| `remote.baseUrl` | `string` | Benutzerdefinierte API-Base-URL                   |
| `remote.apiKey`  | `string` | API-Schlüssel überschreiben                       |
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

| Schlüssel               | Typ      | Standard               | Beschreibung                              |
| ----------------------- | -------- | ---------------------- | ----------------------------------------- |
| `model`                 | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
| `outputDimensionality`  | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072      |

<Warning>
Das Ändern von Modell oder `outputDimensionality` löst automatisch eine vollständige Neuindexierung aus.
</Warning>

---

## Konfiguration von Bedrock-Embeddings

Bedrock verwendet die Standard-Credential-Chain des AWS SDK -- es werden keine API-Schlüssel benötigt.
Wenn OpenClaw auf EC2 mit einer Bedrock-fähigen Instanzrolle läuft, setzen Sie einfach den
Provider und das Modell:

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

| Schlüssel               | Typ      | Standard                       | Beschreibung                    |
| ----------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                 | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
| `outputDimensionality`  | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024 |

### Unterstützte Modelle

Die folgenden Modelle werden unterstützt (mit Familienerkennung und Standardwerten für Dimensionen):

| Modell-ID                                  | Provider   | Standard-Dims | Konfigurierbare Dims   |
| ------------------------------------------ | ---------- | ------------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024          | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536          | --                     |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536          | --                     |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024          | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024          | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                  | Cohere     | 1024          | --                     |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024          | --                     |
| `cohere.embed-v4:0`                        | Cohere     | 1536          | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512           | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024          | --                     |

Varianten mit Throughput-Suffix (z. B. `amazon.titan-embed-text-v1:2:8k`) übernehmen
die Konfiguration des Basismodells.

### Authentifizierung

Bedrock-Authentifizierung verwendet die Standardreihenfolge der Credential-Auflösung des AWS SDK:

1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO-Token-Cache
3. Credentials für Web-Identity-Token
4. Gemeinsame Credentials- und Konfigurationsdateien
5. ECS- oder EC2-Metadaten-Credentials

Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der
`baseUrl` des Providers `amazon-bedrock` oder standardmäßig zu `us-east-1` aufgelöst.

### IAM-Berechtigungen

Die IAM-Rolle oder der IAM-Benutzer benötigt:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Für Least Privilege beschränken Sie `InvokeModel` auf das jeweilige Modell:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Lokale Embedding-Konfiguration

| Schlüssel              | Typ                  | Standard               | Beschreibung                                                                                                                                                                                                                                                                                                         |
| ---------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`      | `string`             | automatisch heruntergeladen | Pfad zur GGUF-Modell-Datei                                                                                                                                                                                                                                                                                         |
| `local.modelCacheDir`  | `string`             | Standard von node-llama-cpp | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                     |
| `local.contextSize`    | `number \| "auto"`   | `4096`                 | Kontextfenstergröße für den Embedding-Kontext. 4096 deckt typische Chunks (128–512 Tokens) ab und begrenzt gleichzeitig nicht gewichteten VRAM. Auf ressourcenbeschränkten Hosts auf 1024–2048 reduzieren. `"auto"` verwendet das vom Modell trainierte Maximum — für 8B+-Modelle nicht empfohlen (Qwen3-Embedding-8B: 40 960 Tokens → ~32 GB VRAM vs. ~8,8 GB bei 4096). |

Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen).
Erfordert nativen Build: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den auch das Gateway verwendet:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Wenn `provider` auf `auto` gesetzt ist, wird `local` nur dann ausgewählt, wenn `local.modelPath` auf
eine vorhandene lokale Datei zeigt. Modell-Referenzen mit `hf:` und HTTP(S) können weiterhin
explizit mit `provider: "local"` verwendet werden, führen aber nicht dazu, dass `auto` `local`
wählt, bevor das Modell auf dem Datenträger verfügbar ist.

---

## Konfiguration der Hybridsuche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel              | Typ       | Standard | Beschreibung                       |
| ---------------------- | --------- | -------- | ---------------------------------- |
| `enabled`              | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren |
| `vectorWeight`         | `number`  | `0.7`    | Gewichtung für Vektor-Scores (0-1) |
| `textWeight`           | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)   |
| `candidateMultiplier`  | `number`  | `4`      | Multiplikator für die Kandidatenmenge |

### MMR (Diversität)

| Schlüssel      | Typ       | Standard | Beschreibung                         |
| -------------- | --------- | -------- | ------------------------------------ |
| `mmr.enabled`  | `boolean` | `false`  | MMR-Re-Ranking aktivieren            |
| `mmr.lambda`   | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |

### Zeitlicher Verfall (Aktualität)

| Schlüssel                   | Typ       | Standard | Beschreibung                |
| --------------------------- | --------- | -------- | --------------------------- |
| `temporalDecay.enabled`     | `boolean` | `false`  | Boost für Aktualität aktivieren |
| `temporalDecay.halfLifeDays` | `number` | `30`     | Score halbiert sich alle N Tage |

Evergreen-Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen nie einem Verfall.

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

| Schlüssel   | Typ        | Beschreibung                                  |
| ----------- | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | Zusätzliche Verzeichnisse oder Dateien zum Indexieren |

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
Die integrierte Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-
Scanners folgt.

Für agentenbezogene, agentübergreifende Suche in Transkripten verwenden Sie
`agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`.
Diese zusätzlichen Collections folgen derselben Form `{ path, name, pattern? }`, werden jedoch
pro Agent zusammengeführt und können explizite gemeinsame Namen erhalten, wenn der Pfad außerhalb des aktuellen Workspace zeigt.
Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in
`memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das
Duplikat.

---

## Multimodales Memory (Gemini)

Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2 indexieren:

| Schlüssel                  | Typ        | Standard   | Beschreibung                               |
| -------------------------- | ---------- | ---------- | ------------------------------------------ |
| `multimodal.enabled`       | `boolean`  | `false`    | Multimodale Indexierung aktivieren         |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]`    |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | Maximale Dateigröße für die Indexierung    |

Gilt nur für Dateien in `extraPaths`. Standard-Memory-Wurzeln bleiben nur Markdown.
Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel         | Typ       | Standard | Beschreibung                        |
| ----------------- | --------- | -------- | ----------------------------------- |
| `cache.enabled`   | `boolean` | `false`  | Chunk-Embeddings in SQLite cachen   |
| `cache.maxEntries` | `number` | `50000`  | Maximale Anzahl gecachter Embeddings |

Verhindert erneute Embeddings für unveränderten Text bei Neuindexierung oder Updates von Transkripten.

---

## Batch-Indexierung

| Schlüssel                    | Typ       | Standard | Beschreibung                |
| ---------------------------- | --------- | -------- | --------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`  | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`   | `number`  | `2`      | Parallele Batch-Jobs        |
| `remote.batch.wait`          | `boolean` | `true`   | Auf Abschluss des Batch warten |
| `remote.batch.pollIntervalMs` | `number` | --       | Polling-Intervall           |
| `remote.batch.timeoutMinutes` | `number` | --       | Batch-Timeout               |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist bei großen Backfills
typischerweise am schnellsten und am günstigsten.

---

## Sitzungs-Memory-Suche (experimentell)

Sitzungstranskripte indexieren und sie über `memory_search` bereitstellen:

| Schlüssel                    | Typ        | Standard     | Beschreibung                              |
| ---------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Sitzungsindexierung aktivieren            |
| `sources`                    | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzuschließen |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Byte-Schwelle für Neuindexierung          |
| `sync.sessions.deltaMessages` | `number`  | `50`         | Nachrichten-Schwelle für Neuindexierung   |

Sitzungsindexierung ist Opt-in und läuft asynchron. Ergebnisse können leicht
veraltet sein. Sitzungslogs liegen auf Datenträger, daher gilt Dateisystemzugriff als Vertrauensgrenze.

---

## SQLite-Vektorbeschleunigung (`sqlite-vec`)

| Schlüssel                   | Typ       | Standard | Beschreibung                          |
| --------------------------- | --------- | -------- | ------------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`   | `sqlite-vec` für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string` | bundled  | Pfad zu `sqlite-vec` überschreiben    |

Wenn `sqlite-vec` nicht verfügbar ist, greift OpenClaw automatisch auf Cosinus-
Ähnlichkeit im Prozess zurück.

---

## Index-Speicherung

| Schlüssel             | Typ      | Standard                              | Beschreibung                                  |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Speicherort des Index (unterstützt das Token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`)   |

---

## QMD-Backend-Konfiguration

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen liegen unter
`memory.qmd`:

| Schlüssel                 | Typ       | Standard | Beschreibung                                 |
| ------------------------- | --------- | -------- | -------------------------------------------- |
| `command`                 | `string`  | `qmd`    | Pfad zur ausführbaren QMD-Datei              |
| `searchMode`              | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`     |
| `includeDefaultMemory`    | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexieren |
| `paths[]`                 | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`        | `boolean` | `false`  | Sitzungstranskripte indexieren               |
| `sessions.retentionDays`  | `number`  | --       | Aufbewahrung von Transkripten                |
| `sessions.exportDir`      | `string`  | --       | Exportverzeichnis                            |

OpenClaw bevorzugt die aktuellen Shapes für QMD-Collections und MCP-Abfragen, hält aber
ältere QMD-Releases funktionsfähig, indem es auf Legacy-`--mask`-Collection-Flags
und ältere MCP-Tool-Namen zurückfällt, wenn nötig.

Modell-Overrides für QMD bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie
QMD-Modelle global überschreiben müssen, setzen Sie Umgebungsvariablen wie
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Laufzeitumgebung des Gateways.

### Update-Zeitplan

| Schlüssel                  | Typ       | Standard | Beschreibung                           |
| -------------------------- | --------- | -------- | -------------------------------------- |
| `update.interval`          | `string`  | `5m`     | Aktualisierungsintervall               |
| `update.debounceMs`        | `number`  | `15000`  | Änderungen an Dateien entprellen       |
| `update.onBoot`            | `boolean` | `true`   | Beim Start aktualisieren               |
| `update.waitForBootSync`   | `boolean` | `false`  | Start blockieren, bis Aktualisierung abgeschlossen ist |
| `update.embedInterval`     | `string`  | --       | Separater Embed-Takt                   |
| `update.commandTimeoutMs`  | `number`  | --       | Timeout für QMD-Befehle                |
| `update.updateTimeoutMs`   | `number`  | --       | Timeout für QMD-Update-Operationen     |
| `update.embedTimeoutMs`    | `number`  | --       | Timeout für QMD-Embed-Operationen      |

### Limits

| Schlüssel                  | Typ      | Standard | Beschreibung                 |
| -------------------------- | -------- | -------- | ---------------------------- |
| `limits.maxResults`        | `number` | `6`      | Maximale Suchergebnisse      |
| `limits.maxSnippetChars`   | `number` | --       | Länge von Snippets begrenzen |
| `limits.maxInjectedChars`  | `number` | --       | Gesamtzahl injizierter Zeichen begrenzen |
| `limits.timeoutMs`         | `number` | `4000`   | Such-Timeout                 |

### Scope

Steuert, welche Sitzungen QMD-Suchergebnisse erhalten können. Dasselbe Schema wie
[`session.sendPolicy`](/de/gateway/config-agents#session):

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

Der ausgelieferte Standard erlaubt Direkt- und Kanal-Sitzungen, verweigert aber weiterhin
Gruppen.

Standard ist nur DM. `match.keyPrefix` gleicht gegen den normalisierten Sitzungsschlüssel ab;
`match.rawKeyPrefix` gleicht gegen den rohen Schlüssel einschließlich `agent:<id>:` ab.

### Zitate

`memory.citations` gilt für alle Backends:

| Wert             | Verhalten                                            |
| ---------------- | ---------------------------------------------------- |
| `auto` (Standard) | `Source: <path#line>`-Fußzeile in Snippets einschließen |
| `on`             | Fußzeile immer einschließen                          |
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

## Dreaming

Dreaming wird unter `plugins.entries.memory-core.config.dreaming` konfiguriert,
nicht unter `agents.defaults.memorySearch`.

Dreaming läuft als ein geplanter Durchlauf und verwendet interne Light-/Deep-/REM-Phasen als
Implementierungsdetail.

Für konzeptionelles Verhalten und Slash-Befehle siehe [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel   | Typ       | Standard    | Beschreibung                                 |
| ----------- | --------- | ----------- | -------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency` | `string`  | `0 3 * * *` | Optionaler Cron-Takt für den vollständigen Dreaming-Durchlauf |

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
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in vorhandene `dreams.md`).
- Die Phasenrichtlinie und Schwellenwerte für Light/Deep/REM sind internes Verhalten, keine benutzerseitige Konfiguration.

## Verwandt

- [Memory-Überblick](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
