---
read_when:
    - Sie möchten .prose-Workflows ausführen oder schreiben
    - Sie möchten das OpenProse-Plugin aktivieren
    - Sie müssen die Statusspeicherung verstehen
summary: 'OpenProse: .prose-Workflows, Slash-Befehle und Status in OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T06:52:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse ist ein portables, markdown-first Workflow-Format zur Orchestrierung von AI-Sitzungen. In OpenClaw wird es als Plugin mitgeliefert, das ein OpenProse-Skill-Pack plus einen Slash-Befehl `/prose` installiert. Programme leben in `.prose`-Dateien und können mehrere Subagents mit explizitem Kontrollfluss starten.

Offizielle Website: [https://www.prose.md](https://www.prose.md)

## Was es kann

- Multi-Agent-Recherche + Synthese mit explizitem Parallelismus.
- Wiederholbare, freigabesichere Workflows (Code Review, Incident-Triage, Content-Pipelines).
- Wiederverwendbare `.prose`-Programme, die Sie über unterstützte Agent-Laufzeitumgebungen hinweg ausführen können.

## Installieren + aktivieren

Gebündelte Plugins sind standardmäßig deaktiviert. Aktivieren Sie OpenProse:

```bash
openclaw plugins enable open-prose
```

Starten Sie das Gateway nach dem Aktivieren des Plugins neu.

Dev/lokaler Checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Verwandte Dokumentation: [Plugins](/de/tools/plugin), [Plugin manifest](/de/plugins/manifest), [Skills](/de/tools/skills).

## Slash-Befehl

OpenProse registriert `/prose` als vom Benutzer aufrufbaren Skill-Befehl. Er leitet an die VM-Anweisungen von OpenProse weiter und verwendet unter der Haube OpenClaw-Tools.

Häufige Befehle:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Beispiel: eine einfache `.prose`-Datei

```prose
# Recherche + Synthese mit zwei Agenten, die parallel laufen.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Speicherorte von Dateien

OpenProse hält den Status unter `.prose/` in Ihrem Workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Persistente Agenten auf Benutzerebene liegen unter:

```
~/.prose/agents/
```

## Statusmodi

OpenProse unterstützt mehrere Status-Backends:

- **filesystem** (Standard): `.prose/runs/...`
- **in-context**: transient, für kleine Programme
- **sqlite** (experimentell): erfordert `sqlite3`-Binärdatei
- **postgres** (experimentell): erfordert `psql` und einen Connection String

Hinweise:

- sqlite/postgres sind Opt-in und experimentell.
- postgres-Zugangsdaten fließen in Subagent-Logs ein; verwenden Sie eine dedizierte Datenbank mit minimalen Rechten.

## Remote-Programme

`/prose run <handle/slug>` wird auf `https://p.prose.md/<handle>/<slug>` aufgelöst.
Direkte URLs werden unverändert abgerufen. Dies verwendet das Tool `web_fetch` (oder `exec` für POST).

## Abbildung auf die OpenClaw-Laufzeit

OpenProse-Programme werden auf OpenClaw-Primitive abgebildet:

| OpenProse-Konzept         | OpenClaw-Tool   |
| ------------------------- | --------------- |
| Sitzung starten / Task-Tool | `sessions_spawn` |
| Datei lesen/schreiben     | `read` / `write` |
| Web-Fetch                 | `web_fetch`     |

Wenn Ihre Tool-Allowlist diese Tools blockiert, schlagen OpenProse-Programme fehl. Siehe [Skills config](/de/tools/skills-config).

## Sicherheit + Freigaben

Behandeln Sie `.prose`-Dateien wie Code. Prüfen Sie sie vor der Ausführung. Verwenden Sie Tool-Allowlists und Freigabegates von OpenClaw, um Nebenwirkungen zu kontrollieren.

Für deterministische, freigabegesteuerte Workflows vergleichen Sie mit [Lobster](/de/tools/lobster).

## Verwandt

- [Text-to-speech](/de/tools/tts)
- [Markdown formatting](/de/concepts/markdown-formatting)
