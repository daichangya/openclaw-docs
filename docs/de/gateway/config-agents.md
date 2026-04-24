---
read_when:
    - Optimieren von Agent-Standardeinstellungen (Modelle, Thinking, Workspace, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindungen konfigurieren
    - Sitzungs-, Nachrichtenzustellungs- und Talk-Modus-Verhalten anpassen
summary: Agent-Standardeinstellungen, Multi-Agent-Routing, Sitzung, Nachrichten- und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-04-24T06:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Konfigurationsschlüssel im Agenten-Scope unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Runtime und andere
Schlüssel auf oberster Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardeinstellungen

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionales Repository-Root, das in der Zeile Runtime des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem vom Workspace nach oben gelaufen wird.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills bei Agenten, die
`agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zuzulassen.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt injiziert werden. Standard: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungsturns (nach einer abgeschlossenen Assistant-Antwort) überspringen die erneute Injektion des Workspace-Bootstraps, wodurch die Größe des Prompts reduziert wird. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor dem Abschneiden. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzahl an Zeichen, die über alle Workspace-Bootstrap-Dateien hinweg injiziert werden. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert agentensichtbaren Warntext, wenn Bootstrap-Kontext abgeschnitten wird.
Standard: `"once"`.

- `"off"`: niemals Warntext in den System-Prompt injizieren.
- `"once"`: Warnung einmal pro eindeutiger Abschneidesignatur injizieren (empfohlen).
- `"always"`: bei jedem Lauf Warnung injizieren, wenn Abschneidung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuordnung der Zuständigkeit für Kontextbudgets

OpenClaw hat mehrere Prompts-/Kontextbudgets mit hohem Volumen, und sie sind
absichtlich nach Subsystemen aufgeteilt, anstatt alle über einen generischen
Schalter zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Injektion des Workspace-Bootstraps.
- `agents.defaults.startupContext.*`:
  einmaliges Startprelude für `/new` und `/reset`, einschließlich aktueller täglicher
  Dateien aus `memory/*.md`.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt injiziert wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Laufzeitauszüge und injizierte runtimeeigene Blöcke.
- `memory.qmd.limits.*`:
  Snippet- und Injektionsgrößen für indizierte Memory-Suche.

Verwenden Sie die passende Überschreibung pro Agent nur dann, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Startup-Prelude des ersten Turns, das bei reinen `/new`- und `/reset`-
Läufen injiziert wird.

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

Gemeinsame Standardwerte für begrenzte Laufzeit-Kontextoberflächen.

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

- `memoryGetMaxChars`: standardmäßige Begrenzung von `memory_get`-Auszügen, bevor Metadaten zur Abschneidung
  und der Hinweis auf Fortsetzung hinzugefügt werden.
- `memoryGetDefaultLines`: standardmäßiges Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: Begrenzung für Tool-Ergebnisse im Live-Betrieb, die für persistierte Ergebnisse und
  Wiederherstellung bei Überläufen verwendet wird.
- `postCompactionMaxChars`: Begrenzung für AGENTS.md-Auszüge, die während der Injektion beim Refresh nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen Schalter unter `contextLimits`. Weggelassene Felder erben
von `agents.defaults.contextLimits`.

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

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt injiziert wird. Dies
beeinflusst das bedarfsweise Lesen von `SKILL.md`-Dateien nicht.

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

Überschreibung pro Agent für das Prompt-Budget der Skills.

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

Maximale Pixelgröße der längsten Bildseite in Bildblöcken von Transcript/Tool vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel die Verwendung von Vision-Tokens und die Größe der Request-Payload bei Läufen mit vielen Screenshots.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den System-Prompt-Kontext (nicht für Nachrichten-Zeitstempel). Fällt auf die Zeitzone des Hosts zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (OS-Einstellung).

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
      params: { cacheRetention: "long" }, // globale Standard-Providerparameter
      embeddedHarness: {
        runtime: "auto", // auto | pi | registrierte Harness-ID, z. B. codex
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

- `model`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die String-Form setzt nur das primäre Modell.
  - Die Objekt-Form setzt das primäre Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool-Pfad `image` als Konfiguration für das Vision-Modell verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Funktion zur Bildgenerierung und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder erzeugt.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-2` für OpenAI Images.
  - Wenn Sie direkt ein Provider-/Modellpaar auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2`, `FAL_KEY` für `fal/*`).
  - Wenn weggelassen, kann `image_generate` trotzdem einen auth-gestützten Standardprovider ableiten. Es versucht zuerst den aktuellen Standardprovider und danach die übrigen registrierten Bildgenerierungsprovider in der Reihenfolge ihrer Provider-ID.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Funktion zur Musikgenerierung und vom eingebauten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.5+`.
  - Wenn weggelassen, kann `music_generate` trotzdem einen auth-gestützten Standardprovider ableiten. Es versucht zuerst den aktuellen Standardprovider und danach die übrigen registrierten Musikgenerierungsprovider in der Reihenfolge ihrer Provider-ID.
  - Wenn Sie direkt ein Provider-/Modellpaar auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Key.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Funktion zur Videogenerierung und vom eingebauten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn weggelassen, kann `video_generate` trotzdem einen auth-gestützten Standardprovider ableiten. Es versucht zuerst den aktuellen Standardprovider und danach die übrigen registrierten Videogenerierungsprovider in der Reihenfolge ihrer Provider-ID.
  - Wenn Sie direkt ein Provider-/Modellpaar auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Key.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie die Optionen auf Providerebene `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool `pdf` für das Modell-Routing verwendet.
  - Wenn weggelassen, fällt das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: standardmäßiges PDF-Größenlimit für das Tool `pdf`, wenn `maxBytesMb` zur Aufrufzeit nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenanzahl, die vom Extraktions-Fallback-Modus im Tool `pdf` berücksichtigt wird.
- `verboseDefault`: Standard-Verbose-Level für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standardlevel für erhöhte Ausgabe bei Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4` für Zugriff per API-Key oder `openai-codex/gpt-5.5` für Codex OAuth). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann ein eindeutiges Match mit einem konfigurierten Provider für genau diese Modell-ID und greift erst dann auf den konfigurierten Standardprovider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugen Sie explizites `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen veralteten Standard eines entfernten Providers anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Abkürzung) und `params` (providerspezifisch, z. B. `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`) enthalten.
  - Sichere Bearbeitungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die bestehende Allowlist-Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Providerbezogene Abläufe für `configure`/Onboarding führen ausgewählte Providermodelle in diese Zuordnung ein und erhalten bereits konfigurierte nicht zusammenhängende Provider.
  - Für direkte OpenAI-Responses-Modelle ist serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um die Injektion von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI server-side compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale Standard-Providerparameter, die auf alle Modelle angewendet werden. Werden unter `agents.defaults.params` gesetzt (z. B. `{ cacheRetention: "long" }`).
- Priorität beim Zusammenführen von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (mit passender Agent-ID) nach Schlüssel. Siehe [Prompt Caching](/de/reference/prompt-caching) für Details.
- `embeddedHarness`: Standardrichtlinie für die Low-Level-Runtime eingebetteter Agenten. Verwenden Sie `runtime: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle übernehmen können, `runtime: "pi"` zum Erzwingen des eingebauten PI-Harness oder eine registrierte Harness-ID wie `runtime: "codex"`. Setzen Sie `fallback: "none"`, um den automatischen PI-Fallback zu deaktivieren.
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten nach Möglichkeit vorhandene Fallback-Listen.
- `maxConcurrent`: maximale Anzahl paralleler Agent-Läufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` steuert, welcher Low-Level-Executor eingebettete Agent-Turns ausführt.
Die meisten Bereitstellungen sollten den Standard `{ runtime: "auto", fallback: "pi" }` beibehalten.
Verwenden Sie ihn, wenn ein vertrauenswürdiges Plugin ein natives Harness bereitstellt, zum Beispiel das gebündelte
Codex-App-Server-Harness.

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

- `runtime`: `"auto"`, `"pi"` oder eine registrierte Plugin-Harness-ID. Das gebündelte Codex-Plugin registriert `codex`.
- `fallback`: `"pi"` oder `"none"`. `"pi"` behält das eingebaute PI-Harness als Kompatibilitätsfallback bei, wenn kein Plugin-Harness ausgewählt ist. `"none"` sorgt dafür, dass eine fehlende oder nicht unterstützte Auswahl eines Plugin-Harness fehlschlägt, statt stillschweigend PI zu verwenden. Fehler des ausgewählten Plugin-Harness werden immer direkt angezeigt.
- Umgebungsüberschreibungen: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` deaktiviert den PI-Fallback für diesen Prozess.
- Für reine Codex-Bereitstellungen setzen Sie `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` und `embeddedHarness.fallback: "none"`.
- Die Wahl des Harness wird pro Sitzungs-ID nach dem ersten eingebetteten Lauf festgeschrieben. Änderungen in Konfiguration/Umgebung wirken sich auf neue oder zurückgesetzte Sitzungen aus, nicht auf ein bestehendes Transcript. Legacy-Sitzungen mit Transcript-Verlauf, aber ohne aufgezeichnete Festlegung, werden als auf PI festgelegt behandelt. `/status` zeigt Nicht-PI-Harness-IDs wie `codex` neben `Fast` an.
- Dies steuert nur das eingebettete Chat-Harness. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modell-Einstellungen.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` oder konfiguriertes Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standardwerten.

Modelle von Z.AI GLM-4.x aktivieren Thinking Mode automatisch, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Modelle von Z.AI aktivieren standardmäßig `tool_stream` für Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Modelle von Anthropic Claude 4.6 verwenden standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für textbasierte Fallback-Läufe (ohne Tool-Aufrufe). Nützlich als Absicherung, wenn API-Provider ausfallen.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind textorientiert; Tools sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Bilddurchreichung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den vollständig von OpenClaw zusammengestellten System-Prompt durch einen festen String. Wird auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`) gesetzt. Werte pro Agent haben Vorrang; ein leerer oder nur aus Leerraum bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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

Providerunabhängige Prompt-Overlays, die nach Modellfamilie angewendet werden. Modell-IDs der GPT-5-Familie erhalten denselben gemeinsamen Verhaltensvertrag über Provider hinweg; `personality` steuert nur die freundliche Interaktionsschicht.

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

- `"friendly"` (Standard) und `"on"` aktivieren die freundliche Interaktionsschicht.
- `"off"` deaktiviert nur die freundliche Schicht; der getaggte GPT-5-Verhaltensvertrag bleibt aktiv.
- Das ältere `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deaktiviert
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // Standard: true; false lässt den Abschnitt Heartbeat im System-Prompt weg
        lightContext: false, // Standard: false; true behält aus den Workspace-Bootstrap-Dateien nur HEARTBEAT.md
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (kein Gesprächsverlauf)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Setzen Sie `0m`, um zu deaktivieren.
- `includeSystemPromptSection`: wenn `false`, wird der Heartbeat-Abschnitt aus dem System-Prompt weggelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: wenn `true`, werden Nutzlasten für Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximale Zeit in Sekunden, die ein Heartbeat-Agent-Turn ausführen darf, bevor er abgebrochen wird. Nicht gesetzt verwendet `agents.defaults.timeoutSeconds`.
- `directPolicy`: Richtlinie für direkte/DM-Zustellung. `allow` (Standard) erlaubt direkte Zielzustellung. `block` unterdrückt direkte Zielzustellung und erzeugt `reason=dm-blocked`.
- `lightContext`: wenn `true`, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: wenn `true`, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von etwa ~100K auf ~2–5K Tokens.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID eines registrierten Compaction-Provider-Plugins (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // verwendet, wenn identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert Re-Injektion
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale nur für Compaction geltende Modellüberschreibung
        notifyUser: true, // kurze Hinweise senden, wenn Compaction beginnt und abgeschlossen wird (Standard: false)
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

- `mode`: `default` oder `safeguard` (stückweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` dieses Providers anstelle der eingebauten LLM-Zusammenfassung aufgerufen. Bei Fehlern fällt es auf das eingebaute Verhalten zurück. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl an Sekunden, die für eine einzelne Compaction-Operation erlaubt sind, bevor OpenClaw sie abbricht. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Zusammenfassung während der Compaction eingebaute Anweisungen zur Beibehaltung undurchsichtiger Bezeichner voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Bezeichnern, der verwendet wird, wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale Namen von H2-/H3-Abschnitten in AGENTS.md, die nach der Compaction erneut injiziert werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die Re-Injektion zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` auch als Legacy-Fallback akzeptiert.
- `model`: optionale Überschreibung `provider/model-id` nur für die Zusammenfassung während der Compaction. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, sendet kurze Hinweise an den Benutzer, wenn die Compaction beginnt und wenn sie abgeschlossen ist (zum Beispiel „Compacting context...“ und „Compaction complete“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: stiller agentischer Turn vor automatischer Compaction, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Beschneidet **alte Tool-Ergebnisse** aus dem Kontext im Arbeitsspeicher, bevor er an das LLM gesendet wird. Verändert **nicht** den Sitzungsverlauf auf dem Datenträger.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten
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

<Accordion title="Verhalten des Modus cache-ttl">

- `mode: "cache-ttl"` aktiviert Durchläufe zur Beschneidung.
- `ttl` steuert, wie oft die Beschneidung erneut ausgeführt werden kann (nach dem letzten Cache-Touch).
- Die Beschneidung kürzt zuerst zu große Tool-Ergebnisse weich und löscht dann bei Bedarf ältere Tool-Ergebnisse hart.

**Soft-trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Tokenzahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten existieren, wird die Beschneidung übersprungen.

</Accordion>

Siehe [Session Pruning](/de/concepts/session-pruning) für Verhaltensdetails.

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (verwenden Sie minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/de/concepts/streaming) für Details zu Verhalten + Chunking.

### Tippindikatoren

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

- Standardwerte: `instant` für direkte Chats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox für den eingebetteten Agenten. Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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
          // SecretRefs / Inline-Inhalte werden ebenfalls unterstützt:
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

<Accordion title="Details zur Sandbox">

**Backend:**

- `docker`: lokale Docker-Runtime (Standard)
- `ssh`: generische Remote-Runtime über SSH
- `openshell`: OpenShell-Runtime

Wenn `backend: "openshell"` ausgewählt ist, werden runtimespezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**Konfiguration des SSH-Backends:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolute Remote-Wurzel, die für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: Schalter für die Host-Key-Richtlinie von OpenSSH

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Snapshot der Secrets-Runtime aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Workspace einmal nach Erstellen oder Neuerstellen
- behält dann den Remote-SSH-Workspace als kanonisch bei
- leitet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Browser-Container in der Sandbox

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agenten-Workspace schreibgeschützt unter `/agent` eingebunden
- `rw`: Agenten-Workspace unter `/workspace` mit Lese-/Schreibzugriff eingebunden

**Scope:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: geteilter Container und Workspace (keine sitzungsübergreifende Isolation)

**OpenShell-Plugin-Konfiguration:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optionale OpenShell-Policy-ID
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-Modus:**

- `mirror`: Seed des Remotes aus dem Lokalen vor `exec`, Synchronisierung zurück nach `exec`; der lokale Workspace bleibt kanonisch
- `remote`: Seed des Remotes einmal beim Erstellen der Sandbox, danach bleibt der Remote-Workspace kanonisch

Im Modus `remote` werden hostlokale Änderungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Seed-Schritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und optional die Spiegel-Synchronisierung.

**`setupCommand`** wird einmal nach der Erstellung des Containers ausgeführt (über `sh -lc`). Benötigt ausgehenden Netzwerkzugriff, beschreibbares Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie es auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, es sei denn, Sie setzen
explizit `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** bindet zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Binds werden zusammengeführt.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt injiziert. Erfordert kein `browser.enabled` in `openclaw.json`.
noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (anstatt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass sandboxed Sitzungen den Browser des Hosts ansprechen.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität möchten.
- `cdpSourceRange` schränkt eingehenden CDP-Verkehr optional an der Containergrenze auf einen CIDR-Bereich ein (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standards sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<abgeleitet aus OPENCLAW_BROWSER_CDP_PORT>`
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
  - `--disable-extensions` (standardmäßig aktiviert)
  - `--disable-3d-apis`, `--disable-software-rasterizer` und `--disable-gpu` sind
    standardmäßig aktiviert und können mit
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn WebGL-/3D-Nutzung dies erfordert.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Extensions wieder, wenn Ihr Workflow
    davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um den
    Standardprozessgrenzwert von Chromium zu verwenden.
  - plus `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte bilden die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit eigenem
    Entry Point, um Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Überschreibungen pro Agent)

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
        model: "anthropic/claude-opus-4-6", // oder { primary, fallbacks }
        thinkingDefault: "high", // Überschreibung des Thinking-Levels pro Agent
        reasoningDefault: "on", // Überschreibung der Sichtbarkeit von Reasoning pro Agent
        fastModeDefault: false, // Überschreibung des Fast-Modus pro Agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter nach Schlüssel
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
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

- `id`: stabile Agent-ID (erforderlich).
- `default`: wenn mehrere gesetzt sind, gewinnt die erste (Warnung wird protokolliert). Wenn keine gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form überschreibt nur `primary`; die Objekt-Form `{ primary, fallbacks }` überschreibt beides (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skill-Allowlist pro Agent. Wenn weggelassen, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt die Standards statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Thinking-Stufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn kein Override pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standardsichtbarkeit für Reasoning pro Agent (`on | off | stream`). Gilt, wenn kein Override für Reasoning pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard für den Fast-Modus pro Agent (`true | false`). Gilt, wenn kein Override für den Fast-Modus pro Nachricht oder Sitzung gesetzt ist.
- `embeddedHarness`: optionale Überschreibung der Low-Level-Harness-Richtlinie pro Agent. Verwenden Sie `{ runtime: "codex", fallback: "none" }`, um einen Agenten nur mit Codex auszuführen, während andere Agenten den Standard-PI-Fallback behalten.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit den Standardwerten in `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: relativer Pfad zum Workspace, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Schutz bei Vererbung der Sandbox: Wenn die anfragende Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed ausgeführt würden.
- `subagents.requireAgentId`: wenn `true`, werden Aufrufe von `sessions_spawn` blockiert, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agenten in einem Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Match-Felder für Bindungen

- `type` (optional): `route` für normales Routing (fehlender Typ verwendet standardmäßig `route`), `acp` für persistente ACP-Unterhaltungsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standardagent

Innerhalb jeder Ebene gewinnt der erste passende Eintrag in `bindings`.

Für Einträge vom Typ `type: "acp"` löst OpenClaw nach exakter Unterhaltungsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die oben genannte Stufenreihenfolge der Route-Bindungen.

### Zugriffsprofile pro Agent

<Accordion title="Voller Zugriff (keine Sandbox)">

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

<Accordion title="Schreibgeschützte Tools + Workspace">

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

<Accordion title="Kein Dateisystemzugriff (nur Messaging)">

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

Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Priorität.

---

## Sitzung

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
    parentForkMaxTokens: 100000, // Parent-Thread-Fork oberhalb dieser Tokenanzahl überspringen (0 deaktiviert)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optionales hartes Budget
      highWaterBytes: "400mb", // optionales Bereinigungsziel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standardwert für automatisches Entfokussieren nach Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standardwert für harte Maximaldauer in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // Legacy (Runtime verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchats.
  - `per-sender` (Standard): jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: alle Teilnehmenden in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: Isolierung nach Absender-ID über Kanäle hinweg.
  - `per-channel-peer`: Isolierung pro Kanal + Absender (empfohlen für Mehrbenutzer-Postfächer).
  - `per-account-channel-peer`: Isolierung pro Konto + Kanal + Absender (empfohlen für Multi-Account).
- **`identityLinks`**: Zuordnung kanonischer IDs zu providerpräfixierten Peers für sitzungsübergreifendes Teilen über Kanäle hinweg.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt täglich zu `atHour` lokaler Zeit zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das zuerst ablaufende Kriterium.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximale `totalTokens` der Parent-Sitzung, die beim Erstellen einer geforkten Thread-Sitzung erlaubt sind (Standard `100000`).
  - Wenn `totalTokens` des Parent über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, statt den Transcript-Verlauf des Parent zu erben.
  - Setzen Sie `0`, um diese Schutzmaßnahme zu deaktivieren und Parent-Forking immer zuzulassen.
- **`mainKey`**: Legacy-Feld. Die Runtime verwendet immer `"main"` für den Haupt-Bucket direkter Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl an Antwort-Zügen zwischen Agenten bei Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match nach `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Der erste Treffer mit `deny` gewinnt.
- **`maintenance`**: Bereinigung + Aufbewahrungssteuerung für den Session Store.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für Transcript-Archive `*.reset.<timestamp>`. Standardmäßig `pruneAfter`; setzen Sie `false`, um dies zu deaktivieren.
  - `maxDiskBytes`: optionales Festplattenbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach der Bereinigung auf Basis des Budgets. Standard ist `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standardwert für automatisches Entfokussieren nach Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standardwert für harte Maximaldauer in Stunden (`0` deaktiviert; Provider können überschreiben)

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
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
      debounceMs: 2000, // 0 deaktiviert
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwortpräfix

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (spezifischster Eintrag gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung            | Beispiel                    |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname       | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständiger Modellbezeichner | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providername            | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Thinking-Stufe | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität | (entspricht `"auto"`)     |

Variablen sind nicht groß-/kleinschreibungssensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standard ist das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Fallback über Identität.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigungsreaktion nach der Antwort auf Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen bei fehlender Einstellung aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  Auf Telegram setzen Sie dies explizit auf `true`, um Lifecycle-Statusreaktionen zu aktivieren.

### Inbound-Debounce

Fasst schnelle reinen Textnachrichten desselben Absenders zu einem einzelnen Agent-Turn zusammen. Medien/Anhänge werden sofort geleert. Steuerbefehle umgehen Debouncing.

### TTS (Text-to-Speech)

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` steuert den Standardmodus für Auto-TTS: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Status.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Keys fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- `openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw dies als OpenAI-kompatiblen TTS-Server und lockert die Validierung von Modell/Stimme.

---

## Talk

Standardwerte für den Talk-Modus (macOS/iOS/Android).

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` muss zu einem Schlüssel in `talk.providers` passen, wenn mehrere Talk-Provider konfiguriert sind.
- Legacy-Schlüssel für Talk in flacher Form (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartext-Strings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein API-Key für Talk konfiguriert ist.
- `providers.*.voiceAliases` erlaubt es Talk-Direktiven, freundliche Namen zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Benutzerschweigen wartet, bevor das Transcript gesendet wird. Nicht gesetzt verwendet das Standard-Pausenfenster der Plattform (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
