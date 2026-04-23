---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Anbieter ausfallen
    - Sie führen die Codex CLI oder andere lokale AI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen
summary: 'CLI-Backends: lokaler AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-23T14:55:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale AI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Anbieter ausgefallen sind,
rate-limitiert werden oder sich vorübergehend fehlerhaft verhalten. Das ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine Loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns konsistent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Das ist als **Sicherheitsnetz** statt als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerungen, Hintergrundaufgaben,
Thread-/Unterhaltungsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP Agents](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

## Einsteigerfreundlicher Schnellstart

Sie können die Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration außer der CLI selbst erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichtenanbieter** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das zugehörige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modell-Referenz oder unter
`agents.defaults.cliBackends` referenziert.

## Verwendung als Fallback

Fügen Sie ein CLI-Backend zu Ihrer Fallback-Liste hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

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

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle einschließen.
- Wenn der primäre Anbieter fehlschlägt (Auth, Rate-Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsüberblick

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird über eine **Anbieter-ID** verschlüsselt (z. B. `codex-cli`, `my-cli`).
Die Anbieter-ID wird zur linken Seite Ihrer Modell-Referenz:

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
          // CLIs im Codex-Stil können stattdessen auf eine Prompt-Datei zeigen:
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
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt und Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte `claude-cli`-Backend hält einen Claude-stdio-Prozess pro
   OpenClaw-Sitzung am Leben und sendet Folge-Turns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folge-Turns dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-`claude-cli`-Backend wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns gesagt, dass die Verwendung der Claude CLI im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-`codex-cli`-Backend reicht den System-Prompt von OpenClaw über
die Konfigurationsüberschreibung `model_instructions_file` von Codex weiter (`-c
model_instructions_file="..."`). Codex bietet kein Claude-ähnliches
Flag `--append-system-prompt`, daher schreibt OpenClaw den zusammengesetzten Prompt für jede neue Codex-CLI-Sitzung in eine
temporäre Datei.

Das gebündelte Anthropic-`claude-cli`-Backend erhält den OpenClaw-Skills-Snapshot
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude Code Plugin, das mit `--plugin-dir` übergeben wird. Das
Plugin enthält nur die geeigneten Skills für diesen Agenten bzw. diese Sitzung, sodass
der native Skill-Resolver von Claude Code dieselbe gefilterte Menge sieht, die OpenClaw sonst im
Prompt bekannt geben würde. Überschreibungen von Skill-Umgebungsvariablen/API-Schlüsseln werden weiterhin von OpenClaw auf die
Umgebung des untergeordneten Prozesses für den Lauf angewendet.

Bevor OpenClaw das gebündelte `claude-cli`-Backend verwenden kann, muss Claude Code selbst
bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur, wenn die Binärdatei `claude`
nicht bereits auf `PATH` liegt.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht-JSON-Resumes).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: niemals eine Sitzungs-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`,
  und `input: "stdin"`, sodass Folge-Turns den laufenden Claude-Prozess wiederverwenden, solange
  er aktiv ist. Warme stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  die Transportfelder auslassen. Wenn das Gateway neu startet oder der inaktive Prozess
  beendet wird, setzt OpenClaw anhand der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-IDs
  werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekt-Transkript geprüft, sodass
  Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden, anstatt stillschweigend eine neue Claude-CLI-Sitzung unter `--resume` zu starten.
- Gespeicherte CLI-Sitzungen sind anbietereigene Kontinuität. Der implizite tägliche Sitzungs-
  reset unterbricht sie nicht; `/reset` und explizite `session.reset`-Richtlinien schon.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe in derselben Lane geordnet.
- Die meisten CLIs serialisieren auf einer Anbieter-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder der OAuth-
  Kontoidentität, wenn die CLI eine solche bereitstellt. Die Rotation von OAuth-Zugriffs- und Refresh-Tokens
  unterbricht die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID offenlegt,
  überlässt OpenClaw dieser CLI die Durchsetzung der Fortsetzungsberechtigungen.

## Bilder (Pass-through)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale
Dateien aus reinen Pfaden automatisch laden.

## Ein- / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für die JSON-Ausgabe der Gemini CLI liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die endgültige Agenten-Nachricht sowie Sitzungs-
  kennungen, wenn vorhanden.
- `output: "text"` behandelt stdout als endgültige Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

Das gebündelte OpenAI-Plugin registriert auch einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert auch einen Standardwert für `google-gemini-cli`:

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
- Die Nutzung greift auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetoken aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (häufig: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

CLI-Backend-Standardwerte sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Anbieterpräfix in Modell-Referenzen.
- Die Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Das backend-spezifische Bereinigen der Konfiguration bleibt über den optionalen
  Hook `normalizeConfig` plugin-eigen.

Plugins, die kleine Kompatibilitäts-Shims für Prompt/Nachrichten benötigen, können
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
schreibt gestreamte Assistant-Deltas und den geparsten Endtext um, bevor OpenClaw
seine eigenen Kontrollmarker und die Kanalauslieferung verarbeitet.

Für CLIs, die mit Claude Code stream-json kompatibles JSONL ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Tool-Aufrufe direkt, aber ein Backend kann sich
mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay anmelden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen HTTP-Loopback-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Sitzung, das Konto und den Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit einer vorhandenen MCP-Konfigurations-/Einstellungsstruktur des Backends zusammen
- schreibt die Startkonfiguration mithilfe des backend-eigenen Integrationsmodus aus der zugehörigen Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn sich ein
Backend für Bundle MCP anmeldet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` anmelden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (ohne JSONL), was weniger
  strukturiert ist als der ursprüngliche Lauf mit `--json`. OpenClaw-Sitzungen funktionieren weiterhin
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (die Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
