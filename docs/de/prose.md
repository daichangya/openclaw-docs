---
read_when:
    - Sie möchten `.prose`-Workflows ausführen oder schreiben
    - Sie möchten das OpenProse-Plugin aktivieren
    - Sie müssen die Speicherung des Status verstehen
summary: 'OpenProse: `.prose`-Workflows, Slash-Befehle und Status in OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T12:52:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse ist ein portables, Markdown-orientiertes Workflow-Format zur Orchestrierung von KI-Sitzungen. In OpenClaw wird es als Plugin ausgeliefert, das ein OpenProse-Skills-Paket sowie einen `/prose`-Slash-Befehl installiert. Programme liegen in `.prose`-Dateien und können mehrere Unteragenten mit explizitem Kontrollfluss starten.

Offizielle Website: [https://www.prose.md](https://www.prose.md)

## Was es kann

- Multi-Agenten-Recherche + Synthese mit expliziter Parallelität.
- Wiederholbare, freigabesichere Workflows (Code-Review, Incident-Triage, Content-Pipelines).
- Wiederverwendbare `.prose`-Programme, die Sie in unterstützten Agent-Laufzeiten ausführen können.

## Installieren + aktivieren

Gebündelte Plugins sind standardmäßig deaktiviert. Aktivieren Sie OpenProse:

```bash
openclaw plugins enable open-prose
```

Starten Sie das Gateway nach dem Aktivieren des Plugins neu.

Entwicklung/lokaler Checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Verwandte Dokumentation: [Plugins](/tools/plugin), [Plugin-Manifest](/plugins/manifest), [Skills](/tools/skills).

## Slash-Befehl

OpenProse registriert `/prose` als benutzeraufrufbaren Skill-Befehl. Er leitet an die OpenProse-VM-Anweisungen weiter und verwendet unter der Haube OpenClaw-Tools.

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
# Recherche + Synthese mit zwei parallel laufenden Agenten.

input topic: "Was sollen wir recherchieren?"

agent researcher:
  model: sonnet
  prompt: "Du recherchierst gründlich und gibst Quellen an."

agent writer:
  model: opus
  prompt: "Du schreibst eine prägnante Zusammenfassung."

parallel:
  findings = session: researcher
    prompt: "Recherchiere zu {topic}."
  draft = session: writer
    prompt: "Fasse {topic} zusammen."

session "Führe die Ergebnisse + den Entwurf zu einer endgültigen Antwort zusammen."
context: { findings, draft }
```

## Dateispeicherorte

OpenProse speichert den Status unter `.prose/` in Ihrem Arbeitsbereich:

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

Persistente Agenten auf Benutzerebene befinden sich unter:

```
~/.prose/agents/
```

## Statusmodi

OpenProse unterstützt mehrere Status-Backends:

- **filesystem** (Standard): `.prose/runs/...`
- **in-context**: transient, für kleine Programme
- **sqlite** (experimentell): erfordert die Binärdatei `sqlite3`
- **postgres** (experimentell): erfordert `psql` und einen Verbindungs-String

Hinweise:

- sqlite/postgres sind Opt-in und experimentell.
- postgres-Anmeldedaten fließen in Unteragenten-Protokolle ein; verwenden Sie eine dedizierte DB mit den geringstmöglichen Rechten.

## Remote-Programme

`/prose run <handle/slug>` wird zu `https://p.prose.md/<handle>/<slug>` aufgelöst.
Direkte URLs werden unverändert abgerufen. Hierfür wird das Tool `web_fetch` verwendet (oder `exec` für POST).

## Zuordnung zur OpenClaw-Laufzeit

OpenProse-Programme werden auf OpenClaw-Primitiven abgebildet:

| OpenProse-Konzept         | OpenClaw-Tool   |
| ------------------------- | --------------- |
| Sitzung starten / Task-Tool | `sessions_spawn` |
| Datei lesen/schreiben     | `read` / `write` |
| Web-Abruf                 | `web_fetch`     |

Wenn Ihre Tool-Allowlist diese Tools blockiert, schlagen OpenProse-Programme fehl. Siehe [Skills-Konfiguration](/tools/skills-config).

## Sicherheit + Freigaben

Behandeln Sie `.prose`-Dateien wie Code. Prüfen Sie sie vor dem Ausführen. Verwenden Sie OpenClaw-Tool-Allowlists und Freigabe-Gates, um Nebeneffekte zu kontrollieren.

Für deterministische, freigabegesteuerte Workflows vergleichen Sie dies mit [Lobster](/tools/lobster).
