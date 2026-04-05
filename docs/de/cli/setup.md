---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den Standardpfad für den Workspace festlegen
summary: CLI-Referenz für `openclaw setup` (Konfiguration + Workspace initialisieren)
title: setup
x-i18n:
    generated_at: "2026-04-05T12:39:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Initialisieren Sie `~/.openclaw/openclaw.json` und den Agent Workspace.

Verwandt:

- Erste Schritte: [Getting started](/de/start/getting-started)
- CLI-Onboarding: [Onboarding (CLI)](/de/start/wizard)

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Optionen

- `--workspace <dir>`: Verzeichnis des Agent Workspace (wird als `agents.defaults.workspace` gespeichert)
- `--wizard`: Onboarding ausführen
- `--non-interactive`: Onboarding ohne Prompts ausführen
- `--mode <local|remote>`: Onboarding-Modus
- `--remote-url <url>`: WebSocket-URL des Remote-Gateway
- `--remote-token <token>`: Token des Remote-Gateway

So führen Sie das Onboarding über setup aus:

```bash
openclaw setup --wizard
```

Hinweise:

- Ein einfaches `openclaw setup` initialisiert Konfiguration + Workspace ohne den vollständigen Onboarding-Ablauf.
- Onboarding wird automatisch ausgeführt, wenn Onboarding-Flags vorhanden sind (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
