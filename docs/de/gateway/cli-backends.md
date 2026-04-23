---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen
    - Sie verwenden Codex CLI oder andere lokale AI CLIs und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen
summary: 'CLI-Backends: lokaler AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-23T14:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale AI CLIs** als **reinen Text-Fallback** ausführen, wenn API-Provider ausfallen,
rate-limitiert sind oder sich vorübergehend fehlerhaft verhalten. Das ist absichtlich konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine Loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folgezüge kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Das ist als **Sicherheitsnetz** und nicht als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP Agents](/de/tools/acp-agents). CLI-Backends sind kein ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI Plugin
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

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration außer der CLI selbst erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
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

- Wenn Sie `agents.defaults.models` (Zulassungsliste) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Provider fehlschlägt (Authentifizierung, Rate-Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsübersicht

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag ist mit einer **Provider-ID** verschlüsselt (z. B. `codex-cli`, `my-cli`).
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

1. **Wählt ein Backend aus** auf Basis des Provider-Präfixes (`codex-cli/...`).
2. **Erstellt einen System-Prompt** unter Verwendung desselben OpenClaw-Prompts und Workspace-Kontexts.
3. **Führt die CLI** mit einer Sitzungs-ID aus (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte Backend `claude-cli` hält einen Claude-stdio-Prozess pro
   OpenClaw-Sitzung am Leben und sendet Folgezüge über stream-json stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folgezüge dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns gesagt, dass die Claude-CLI-Nutzung im Stil von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic
keine neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-Backend `codex-cli` leitet OpenClaws System-Prompt über
Codex' Konfigurationsüberschreibung `model_instructions_file` weiter (`-c
model_instructions_file="..."`). Codex stellt kein Flag im Claude-Stil
`--append-system-prompt` bereit, daher schreibt OpenClaw den zusammengesetzten Prompt für jede neue Codex-CLI-Sitzung in eine
temporäre Datei.

Das gebündelte Anthropic-Backend `claude-cli` erhält den OpenClaw-Skills-Snapshot
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude-Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die für diesen Agenten/diese Sitzung zulässigen Skills, sodass Claudes nativer Skill-
Resolver dieselbe gefilterte Menge sieht, die OpenClaw sonst im Prompt bewerben würde.
Env-/API-Schlüssel-Überschreibungen für Skills werden von OpenClaw weiterhin auf die
Kindprozessumgebung für den Lauf angewendet.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden
  muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für Nicht-JSON-Fortsetzungen).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur dann eine Sitzungs-ID senden, wenn vorher eine gespeichert wurde.
  - `none`: niemals eine Sitzungs-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`
  und `input: "stdin"`, sodass Folgezüge den laufenden Claude-Prozess wiederverwenden, während
  er aktiv ist. Warmes stdio ist jetzt der Standard, auch bei benutzerdefinierten Konfigurationen,
  die Transportfelder auslassen. Wenn das Gateway neu startet oder der Leerlaufprozess
  beendet wird, setzt OpenClaw mit der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekttranskript geprüft, sodass
  Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden, statt stillschweigend
  eine neue Claude-CLI-Sitzung unter `--resume` zu starten.
- Gespeicherte CLI-Sitzungen sind Provider-eigene Kontinuität. Das implizite tägliche Zurücksetzen der Sitzung
  unterbricht sie nicht; `/reset` und explizite Richtlinien `session.reset` tun es weiterhin.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe in derselben Lane geordnet.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder der OAuth-
  Kontenidentität, wenn die CLI eine solche bereitstellt. Die Rotation von OAuth-Zugriffs- und Refresh-Tokens
  unterbricht die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID bereitstellt,
  lässt OpenClaw diese CLI die Resume-Berechtigungen selbst durchsetzen.

## Bilder (Durchreichung)

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
- Für die Gemini-CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die endgültige Agentennachricht sowie Sitzungs-
  Kennungen, wenn vorhanden.
- `output: "text"` behandelt stdout als endgültige Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

Das gebündelte OpenAI Plugin registriert auch einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google Plugin registriert auch einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` in `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
  `stats.input_tokens - stats.cached` ab.

Überschreiben Sie nur bei Bedarf (üblich: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

Standardwerte für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Die Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standard.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  Hook `normalizeConfig` im Besitz des Plugins.

Plugins, die kleine Kompatibilitätsshims für Prompt/Nachrichten benötigen, können
bidirektionale Texttransformationen deklarieren, ohne einen Provider oder ein CLI-Backend zu ersetzen:

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
schreibt gestreamte Assistant-Deltas und geparsten Endtext um, bevor OpenClaw
seine eigenen Kontrollmarker und die Kanalzustellung verarbeitet.

Für CLIs, die JSONL im Format Claude Code stream-json-kompatibel ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** direkten OpenClaw-Tool-Aufrufe, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay entscheiden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle MCP aktiviert ist, führt OpenClaw Folgendes aus:

- Startet einen Loopback-HTTP-MCP-Server, der Gateway-Tools dem CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Sitzung, das aktuelle Konto und den aktuellen Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit jeder vorhandenen MCP-Konfigurations-/Einstellungsform des Backends zusammen
- schreibt die Startkonfiguration mit dem backend-eigenen Integrationsmodus aus der besitzenden Extension um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw trotzdem eine strikte Konfiguration, wenn sich ein
Backend für Bundle MCP entscheidet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur dann, wenn sie sich für
  `bundleMcp: true` entscheiden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche Lauf mit `--json`. OpenClaw-Sitzungen funktionieren trotzdem
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
