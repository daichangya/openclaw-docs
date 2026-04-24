---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den Standard-Workspace-Pfad festlegen
summary: CLI-Referenz für `openclaw setup` (Konfiguration + Workspace initialisieren)
title: Einrichtung
x-i18n:
    generated_at: "2026-04-24T06:32:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json` und den Agent-Workspace initialisieren.

Verwandt:

- Erste Schritte: [Erste Schritte](/de/start/getting-started)
- CLI-Onboarding: [Onboarding (CLI)](/de/start/wizard)

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Optionen

- `--workspace <dir>`: Workspace-Verzeichnis des Agenten (gespeichert als `agents.defaults.workspace`)
- `--wizard`: Onboarding ausführen
- `--non-interactive`: Onboarding ohne Eingabeaufforderungen ausführen
- `--mode <local|remote>`: Onboarding-Modus
- `--remote-url <url>`: WebSocket-URL des entfernten Gateway
- `--remote-token <token>`: Token des entfernten Gateway

So führen Sie das Onboarding über setup aus:

```bash
openclaw setup --wizard
```

Hinweise:

- Einfaches `openclaw setup` initialisiert Konfiguration + Workspace ohne den vollständigen Onboarding-Ablauf.
- Das Onboarding wird automatisch ausgeführt, wenn irgendwelche Onboarding-Flags vorhanden sind (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Verwandt

- [CLI-Referenz](/de/cli)
- [Installationsübersicht](/de/install)
