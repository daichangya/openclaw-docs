---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Anbieter ausfallen
    - Sie führen Codex CLI oder andere lokale AI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-local loopback-Bridge für den Tool-Zugriff im CLI-Backend verstehen
summary: 'CLI-Backends: lokaler AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-24T06:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Runtime)

OpenClaw kann **lokale AI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Anbieter ausfallen,
rate-limitiert sind oder sich vorübergehend fehlerhaft verhalten. Dies ist absichtlich konservativ:

- **OpenClaw-Tools werden nicht direkt eingefügt**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine MCP-local loopback-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist eher als **Sicherheitsnetz** als als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Runtime mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie stattdessen
[ACP Agents](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
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

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration über die CLI selbst hinaus erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichtenanbieter** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das zugehörige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modellreferenz oder unter
`agents.defaults.cliBackends` referenziert.

## Verwendung als Fallback

Fügen Sie ein CLI-Backend Ihrer Fallback-Liste hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Anbieter fehlschlägt (Auth, Ratenlimits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsüberblick

Alle CLI-Backends liegen unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird über eine **Anbieter-ID** indiziert (z. B. `codex-cli`, `my-cli`).
Die Anbieter-ID wird zur linken Seite Ihrer Modellreferenz:

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
          // Codex-ähnliche CLIs können stattdessen auf eine Prompt-Datei zeigen:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. **Wählt ein Backend aus** basierend auf dem Anbieterpräfix (`codex-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt + Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte Backend `claude-cli` hält einen Claude-stdio-Prozess pro
   OpenClaw-Sitzung aktiv und sendet Folge-Turns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folgeaktionen dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass eine Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als zulässig, solange Anthropic
keine neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-Backend `codex-cli` übergibt den System-Prompt von OpenClaw über
die Config-Überschreibung `model_instructions_file` von Codex (`-c
model_instructions_file="..."`). Codex bietet kein Flag im Stil von Claude wie
`--append-system-prompt`, daher schreibt OpenClaw den zusammengesetzten Prompt für jede neue Codex-CLI-Sitzung in eine temporäre Datei.

Das gebündelte Anthropic-Backend `claude-cli` erhält den OpenClaw-Skills-Snapshot
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude-Code-Plugin, das mit `--plugin-dir` übergeben wird. Das
Plugin enthält nur die für diesen Agenten/diese Sitzung geeigneten Skills, sodass der native Skill-
Resolver von Claude Code dieselbe gefilterte Menge sieht, die OpenClaw sonst im
Prompt bewerben würde. Skill-Env-/API-Schlüssel-Überschreibungen werden weiterhin von OpenClaw auf die
Umgebung des Kindprozesses für den Lauf angewendet.

Claude CLI hat außerdem einen eigenen nicht interaktiven Berechtigungsmodus. OpenClaw bildet diesen
auf die vorhandene Exec-Richtlinie ab, statt Claude-spezifische Konfiguration hinzuzufügen: wenn die
effektiv angeforderte Exec-Richtlinie YOLO ist (`tools.exec.security: "full"` und
`tools.exec.ask: "off"`), fügt OpenClaw `--permission-mode bypassPermissions` hinzu.
Pro-Agent-Einstellungen `agents.list[].tools.exec` überschreiben globale `tools.exec` für
diesen Agenten. Um einen anderen Claude-Modus zu erzwingen, setzen Sie explizite rohe Backend-Argumente
wie `--permission-mode default` oder `--permission-mode acceptEdits` unter
`agents.defaults.cliBackends.claude-cli.args` und entsprechende `resumeArgs`.

Bevor OpenClaw das gebündelte Backend `claude-cli` verwenden kann, muss Claude Code selbst
bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur dann, wenn die Binärdatei `claude`
noch nicht auf `PATH` liegt.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt
  werden muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht-JSON-Resumes).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur dann eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: niemals eine Sitzungs-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`,
  und `input: "stdin"`, sodass Folge-Turns den aktiven Claude-Prozess wiederverwenden.
  Warm stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  bei denen Transportfelder fehlen. Wenn das Gateway neu startet oder der inaktive Prozess
  beendet wird, setzt OpenClaw die Sitzung mit der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekt-Transcript geprüft,
  sodass Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden, statt still eine neue Claude-CLI-Sitzung unter `--resume` zu starten.
- Gespeicherte CLI-Sitzungen sind anbieterbezogene Kontinuität. Der implizite tägliche Sitzungs-
  Reset unterbricht sie nicht; `/reset` und explizite Richtlinien `session.reset` tun dies weiterhin.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe derselben Lane in Ordnung.
- Die meisten CLIs serialisieren auf einer Anbieter-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder einer OAuth-
  Kontenidentität, wenn die CLI eine solche bereitstellt. Die Rotation von OAuth-Access- und Refresh-Tokens
  unterbricht die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID bereitstellt,
  lässt OpenClaw diese CLI die Berechtigungen für das Fortsetzen selbst durchsetzen.

## Bilder (Pass-through)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale
Dateien automatisch aus einfachen Pfaden laden.

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für die JSON-Ausgabe von Gemini CLI liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die endgültige Agentennachricht plus Sitzungs-
  Identifikatoren, wenn vorhanden.
- `output: "text"` behandelt stdout als endgültige Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (plugin-owned)

Das gebündelte OpenAI-Plugin registriert außerdem einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert außerdem einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` auf `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Nutzung greift auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Tokens aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (häufig: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

Standards für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Anbieterpräfix in Modellreferenzen.
- Benutzerkonfiguration unter `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standard.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  Hook `normalizeConfig` im Besitz des Plugins.

Plugins, die winzige Kompatibilitäts-Shims für Prompt/Nachrichten benötigen, können
bidirektionale Texttransformationen deklarieren, ohne einen Anbieter oder ein CLI-Backend zu ersetzen:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` schreibt den System-Prompt und den Benutzer-Prompt um, die an die CLI übergeben werden. `output`
schreibt gestreamte Assistenten-Deltas und den geparsten finalen Text um, bevor OpenClaw
seine eigenen Steuerungsmarker und die Channel-Zustellung verarbeitet.

Für CLIs, die mit Claude Code stream-json kompatibles JSONL ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten **nicht** direkt OpenClaw-Tool-Aufrufe, aber ein Backend kann
mit `bundleMcp: true` ein generiertes MCP-Config-Overlay aktivieren.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`; der generierte
  OpenClaw-local loopback-Server wird mit dem Codex-spezifischen Tool-Genehmigungsmodus pro Server markiert,
  sodass MCP-Aufrufe nicht an lokalen Genehmigungsaufforderungen hängen bleiben können
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle MCP aktiviert ist, führt OpenClaw Folgendes aus:

- es startet einen lokalen HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- es authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- es beschränkt den Tool-Zugriff auf die aktuelle Sitzung, das aktuelle Konto und den aktuellen Channel-Kontext
- es lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- es führt sie mit einer eventuell vorhandenen MCP-Konfiguration/Einstellungsstruktur des Backends zusammen
- es schreibt die Startkonfiguration mithilfe des backend-eigenen Integrationsmodus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, fügt OpenClaw dennoch eine strikte Konfiguration ein, wenn ein
Backend sich für Bundle MCP anmeldet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw fügt dem CLI-Backend-Protokoll keine Tool-Aufrufe hinzu. Backends sehen Gateway-Tools nur dann, wenn sie sich für
  `bundleMcp: true` anmelden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche Lauf mit `--json`. OpenClaw-Sitzungen funktionieren
  weiterhin normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` auf das CLI-Modell abzubilden.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
