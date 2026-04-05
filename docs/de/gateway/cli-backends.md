---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen
    - Sie verwenden Claude CLI oder andere lokale AI-CLIs und möchten sie wiederverwenden
    - Sie möchten die MCP-loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen
summary: 'CLI-Backends: lokaler AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-05T12:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale AI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Provider ausfallen,
Rate-Limits erreichen oder sich vorübergehend fehlerhaft verhalten. Das ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  (der Standard von Claude CLI) können Gateway-Tools über eine loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** (Claude CLI verwendet `--output-format stream-json` mit
  `--include-partial-messages`; Prompts werden über stdin gesendet).
- **Sitzungen werden unterstützt** (damit Folge-Turns konsistent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** und nicht als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversations-Binding und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP Agents](/tools/acp-agents). CLI-Backends sind nicht ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Claude CLI **ohne Konfiguration** verwenden (das gebündelte Anthropic-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI funktioniert ebenfalls sofort (über das gebündelte OpenAI-Plugin):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Wenn Ihr Gateway unter launchd/systemd läuft und PATH minimal ist, fügen Sie nur den
Befehlspfad hinzu:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration nötig, außer der CLI selbst.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das besitzende gebündelte Plugin, wenn Ihre Konfiguration
explizit auf dieses Backend in einer Modell-Referenz oder unter
`agents.defaults.cliBackends` verweist.

## Als Fallback verwenden

Fügen Sie ein CLI-Backend zu Ihrer Fallback-Liste hinzu, damit es nur läuft, wenn primäre Modelle ausfallen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie `claude-cli/...` einschließen.
- Wenn der primäre Provider ausfällt (Auth, Rate-Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.
- Das gebündelte Claude-CLI-Backend akzeptiert weiterhin kürzere Aliasse wie
  `claude-cli/opus`, `claude-cli/opus-4.6` oder `claude-cli/sonnet`, aber Dokumentation
  und Konfigurationsbeispiele verwenden die kanonischen `claude-cli/claude-*`-Referenzen.

## Konfigurationsüberblick

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag ist durch eine **Provider-ID** gekennzeichnet (z. B. `claude-cli`, `my-cli`).
Die Provider-ID wird zur linken Seite Ihrer Modell-Referenz:

```
<provider>/<model>
```

### Beispielkonfiguration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

## So funktioniert es

1. **Wählt ein Backend aus** basierend auf dem Provider-Präfix (`claude-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt + Workspace-Kontext.
3. **Führt die CLI** mit einer Sitzungs-ID aus (falls unterstützt), damit der Verlauf konsistent bleibt.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, sodass Folgeanfragen dieselbe CLI-Sitzung wiederverwenden.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingesetzt
  werden muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht-JSON-Resumes).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: niemals eine Sitzungs-ID senden.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe derselben Lane in Reihenfolge.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- `claude-cli` ist enger gefasst: Fortgesetzte Läufe serialisieren pro Claude-Sitzungs-ID, und neue Läufe serialisieren pro Workspace-Pfad. Unabhängige Workspaces können parallel laufen.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich der Auth-Status des Backends ändert, einschließlich Relogin, Token-Rotation oder geänderter Anmeldedaten eines Auth-Profils.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfad-Injektion), was für CLIs ausreicht, die lokale
Dateien aus einfachen Pfaden automatisch laden (Verhalten von Claude CLI).

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Claude CLI `stream-json`
  und Codex CLI `--json`) und extrahiert die finale Agent-Nachricht plus Sitzungs-
  Kennungen, wenn vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-besessen)

Das gebündelte Anthropic-Plugin registriert einen Standardwert für `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Das gebündelte OpenAI-Plugin registriert ebenfalls einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert ebenfalls einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` auf `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Die Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Tokens aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (üblich: absoluter `command`-Pfad).

## Plugin-besessene Standardwerte

Standardwerte für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modell-Referenzen.
- Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  Hook `normalizeConfig` im Besitz des Plugins.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Tool-Aufrufe direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay anmelden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: `bundleMcp: true` (Standard)
- `codex-cli`: kein Bundle-MCP-Overlay
- `google-gemini-cli`: kein Bundle-MCP-Overlay

Wenn Bundle-MCP aktiviert ist, macht OpenClaw Folgendes:

- startet einen loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Sitzung, das aktuelle Konto und den aktuellen Channel-Kontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit einem vorhandenen Backend-`--mcp-config` zusammen
- schreibt die CLI-Argumente so um, dass `--strict-mcp-config --mcp-config <generated-file>` übergeben wird

Das Flag `--strict-mcp-config` verhindert, dass Claude CLI umgebende
MCP-Server auf Benutzerebene oder global erbt. Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw trotzdem
eine strikte leere Konfiguration, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends mit `bundleMcp: true` (der
  Standard von Claude CLI) erhalten Gateway-Tools jedoch über eine loopback-MCP-Bridge,
  sodass Claude CLI OpenClaw-Tools über seine native MCP-Unterstützung aufrufen kann.
- **Streaming ist backend-spezifisch.** Claude CLI verwendet JSONL-Streaming
  (`stream-json` mit `--include-partial-messages`); andere CLI-Backends können
  weiterhin bis zum Beenden gepuffert sein.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden per Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der initiale `--json`-Lauf. OpenClaw-Sitzungen funktionieren dennoch
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungs-Kontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
