---
read_when:
    - Du möchtest verstehen, welche Tools OpenClaw bereitstellt
    - Du musst Tools konfigurieren, erlauben oder verweigern
    - Du entscheidest zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie man ihn erweitert'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-05T12:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Tools und Plugins

Alles, was der Agent über das Erzeugen von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art und Weise, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bringt eine Reihe **integrierter Tools** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills zeigen dem Agenten wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen für
    den effektiven Einsatz von Tools. Skills liegen in deinem Workspace, in gemeinsam genutzten Ordnern
    oder werden innerhalb von Plugins ausgeliefert.

    [Skills-Referenz](/tools/skills) | [Skills erstellen](/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das jede Kombination von Fähigkeiten registrieren kann:
    Channels, Modell-Provider, Tools, Skills, Speech, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Abruf, Websuche und mehr. Manche Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/tools/plugin) | [Eigene entwickeln](/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Tool                                       | Was es tut                                                           | Seite                                   |
| ------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/tools/exec)                     |
| `code_execution`                           | Sandboxed Python-Analysen auf einem Remote-System ausführen          | [Code Execution](/tools/code-execution) |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Posts durchsuchen, Seiteninhalt abrufen       | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                         |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Nachrichten über alle Channels hinweg senden                         | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Node-Canvas steuern (present, eval, snapshot)                        |                                         |
| `nodes`                                    | Gekoppelte Geräte erkennen und als Ziel verwenden                    |                                         |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                         |
| `image` / `image_generate`                 | Bilder analysieren oder erzeugen                                     |                                         |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                              | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung              | [Sub-Agents](/tools/subagents)          |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und Sitzungs-Modellüberschreibung | [Sitzungstools](/de/concepts/session-tool) |

Für Bildarbeit verwende `image` für Analyse und `image_generate` für Erzeugung oder Bearbeitung. Wenn du `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuerst, konfiguriere zuerst die Auth/den API-Key dieses Providers.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sessions-Gruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional eine Modellsitzungsüberschreibung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und das
aktive Laufzeit-Modelllabel aus dem neuesten Usage-Eintrag des Transkripts nachtragen.

`gateway` ist das Laufzeit-Tool nur für Besitzer für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für den vollständigen Austausch der Konfiguration
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzuge `config.schema.lookup` und danach `config.patch`. Verwende
`config.apply` nur dann, wenn du absichtlich die gesamte Konfiguration ersetzt.
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
ältere Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Lobster](/tools/lobster) — typisierte Workflow-Laufzeit mit wiederaufnehmbaren Genehmigungen
- [LLM Task](/tools/llm-task) — reiner JSON-LLM-Schritt für strukturierte Ausgabe
- [Diffs](/tools/diffs) — Diff-Betrachter und Renderer
- [OpenProse](/prose) — markdown-first-Workflow-Orchestrierung

## Tool-Konfiguration

### Erlaubnis- und Verweigerungslisten

Steuere über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen darf. Verweigern hat immer Vorrang vor Erlauben.

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

| Profil      | Was es enthält                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (entspricht nicht gesetzt)                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                 |
| `minimal`   | Nur `session_status`                                                                                       |

### Tool-Gruppen

Verwende Kurzformen `group:*` in Erlaubnis-/Verweigerungslisten:

| Gruppe             | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (ohne Plugin-Tools)                                                      |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Rückschauansicht zurück. Es entfernt
Thinking-Tags, Scaffolding von `<relevant-memories>`, XML-Payloads von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Scaffolding, geleakte ASCII-/Vollbreiten-Steuertoken von Modellen
und fehlerhaftes MiniMax-Tool-Call-XML aus Assistententext und wendet dann
Redigierung/Abschneidung sowie mögliche Platzhalter für übergroße Zeilen an, statt
als roher Transkript-Dump zu fungieren.

### Provider-spezifische Einschränkungen

Verwende `tools.byProvider`, um Tools für bestimmte Provider einzuschränken, ohne
globale Standardwerte zu ändern:

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
