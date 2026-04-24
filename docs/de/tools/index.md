---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, erlauben oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und Plugins: was der Agent tun kann und wie er erweitert werden kann'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-24T07:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Menge **integrierter Tools** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills bringen dem Agenten bei, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und eine Schritt-für-Schritt-Anleitung für
    die effektive Nutzung von Tools. Skills leben in Ihrem Workspace, in gemeinsam genutzten Ordnern
    oder werden innerhalb von Plugins mitgeliefert.

    [Skills reference](/de/tools/skills) | [Creating skills](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Media Understanding, Bildgenerierung, Video-Generierung,
    Web-Fetch, Websuche und mehr. Einige Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Install and configure plugins](/de/tools/plugin) | [Build your own](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Tool                                       | Was es tut                                                           | Seite                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec), [Exec Approvals](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                            | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web durchsuchen, X-Posts durchsuchen, Seiteninhalt abrufen           | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                           | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node-Canvas steuern (present, eval, snapshot)                        |                                                              |
| `nodes`                                    | Gepaarte Geräte entdecken und ansprechen                             |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                   | [Image Generation](/de/tools/image-generation)                  |
| `music_generate`                           | Musikstücke generieren                                               | [Music Generation](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                    | [Video Generation](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                              | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung              | [Sub-agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und Modell-Override pro Sitzung | [Session Tools](/de/concepts/session-tool)                      |

Für Bildarbeit verwenden Sie `image` zur Analyse und `image_generate` zur Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Auth/den API key dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Auth/den API key dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Auth/den API key dieses Providers.

Für workflowgesteuerte Audio-Generierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sitzungsgruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional ein Modell-Override pro Sitzung setzen; `model=default` löscht dieses
Override. Wie `/status` kann es sparse Token-/Cache-Zähler und das
aktive Laufzeit-Modell-Label aus dem neuesten Usage-Eintrag des Transkripts nachtragen.

`gateway` ist das nur für Eigentümer bestimmte Laufzeit-Tool für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Subtree vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurations-Updates mit Neustart
- `config.apply` nur für vollständigen Ersatz der Konfiguration
- `update.run` für explizites Selbst-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur dann, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Das Tool weigert sich außerdem, `tools.exec.ask` oder `tools.exec.security` zu ändern;
veraltete Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — JSON-only-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Laufzeit mit wiederaufnehmbaren Freigaben
- [Music Generation](/de/tools/music-generation) — gemeinsames Tool `music_generate` mit workflowgestützten Providern
- [OpenProse](/de/prose) — markdown-first Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — komprimiert verrauschte Tool-Ergebnisse von `exec` und `bash`

## Tool-Konfiguration

### Allow- und Deny-Listen

Steuern Sie, welche Tools der Agent aufrufen kann, über `tools.allow` / `tools.deny` in der
Konfiguration. Deny gewinnt immer gegenüber Allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es umfasst                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Keine Einschränkung (entspricht nicht gesetzt)                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Nur `session_status`                                                                                                                             |

Die Profile `coding` und `messaging` erlauben außerdem konfigurierte gebündelte MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine gebündelten MCP-Tools.

### Tool-Gruppen

Verwenden Sie Kurzformen `group:*` in Allow-/Deny-Listen:

| Gruppe             | Tools                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (ohne Plugin-Tools)                                                       |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Recall-Ansicht zurück. Es entfernt
Thinking-Tags, Scaffolding `<relevant-memories>`, XML-Payloads von Tool-Aufrufen in Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
heruntergestuftes Tool-Call-Scaffolding, geleakte ASCII-/vollbreite Modell-Steuertokens
und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text und wendet dann
Redaction/Trunkierung sowie mögliche Platzhalter für übergroße Zeilen an, statt
als roher Transkript-Dump zu dienen.

### Provider-spezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Tools für bestimmte Provider einzuschränken, ohne
globale Standards zu ändern:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
