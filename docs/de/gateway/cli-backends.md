---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Anbieter ausfallen
    - Sie verwenden Codex CLI oder andere lokale KI-CLIs und möchten diese wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff von CLI-Backends verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-07T06:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f061357f420455ad6ffaabe7fe28f1fb1b1769d73a4eb2e6f45c6eb3c2e36667
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale KI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Anbieter ausfallen,
rate-limitiert sind oder sich vorübergehend fehlerhaft verhalten. Das ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine Loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die dies unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** und nicht als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten ohne Abhängigkeit von externen APIs möchten.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerungen, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP Agents](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Wenn Ihr Gateway unter launchd/systemd läuft und `PATH` minimal ist, fügen Sie nur den
Befehlspfad hinzu:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Das ist alles. Es werden keine Schlüssel und keine zusätzliche Auth-Konfiguration über die CLI selbst hinaus benötigt.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichtenanbieter** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das besitzende gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modellreferenz oder unter
`agents.defaults.cliBackends` referenziert.

## Verwendung als Fallback

Fügen Sie Ihrer Fallback-Liste ein CLI-Backend hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Anbieter fehlschlägt (Authentifizierung, Ratenlimits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsüberblick

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag ist über eine **Provider-ID** verschlüsselt (z. B. `codex-cli`, `my-cli`).
Die Provider-ID wird zur linken Seite Ihrer Modellreferenz:

```
<provider>/<model>
```

### Beispielkonfiguration

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
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Funktionsweise

1. **Wählt ein Backend aus** basierend auf dem Provider-Präfix (`codex-cli/...`).
2. **Erstellt einen Systemprompt** mit demselben OpenClaw-Prompt + Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit die Historie konsistent bleibt.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Follow-ups dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-`claude-cli`-Backend wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als sanktioniert, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt
  werden muss.
- Wenn die CLI einen **Resume-Subcommand** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für Nicht-JSON-Resumes).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, falls keine gespeichert ist).
  - `existing`: nur dann eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: nie eine Sitzungs-ID senden.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe auf derselben Lane in der richtigen Reihenfolge.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich der Authentifizierungszustand des Backends ändert, einschließlich erneutem Login, Token-Rotation oder geänderten Anmeldedaten eines Auth-Profils.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale Dateien aus einfachen Pfaden
automatisch laden.

## Ein- / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgabe liest OpenClaw den Antworttext aus `response` und
  die Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die endgültige Agent-Nachricht sowie Sitzungs-
  Kennungen, falls vorhanden.
- `output: "text"` behandelt stdout als endgültige Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (plugin-eigen)

Das gebündelte OpenAI-Plugin registriert außerdem einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert außerdem einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` im `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Der Antworttext wird aus dem JSON-Feld `response` gelesen.
- Die Nutzung greift auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird zu OpenClaw-`cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Token aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (häufig: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

Standardeinstellungen für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die `id` des Backends wird zum Provider-Präfix in Modellreferenzen.
- Die Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  `normalizeConfig`-Hook plugin-eigen.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Tool-Aufrufe direkt, aber ein Backend kann
mit `bundleMcp: true` ein generiertes MCP-Konfigurations-Overlay aktivieren.

Aktuelles gebündeltes Verhalten:

- `codex-cli`: kein Bundle-MCP-Overlay
- `google-gemini-cli`: kein Bundle-MCP-Overlay

Wenn Bundle-MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Sitzung, das Konto und den Channel-Kontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit einem vorhandenen Backend-`--mcp-config` zusammen
- schreibt die CLI-Argumente um, um `--strict-mcp-config --mcp-config <generated-file>` zu übergeben

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn ein
Backend sich für Bundle-MCP entscheidet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` entscheiden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL, andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche `--json`-Lauf. OpenClaw-Sitzungen funktionieren dennoch
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
