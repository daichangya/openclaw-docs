---
read_when:
    - Sie möchten schnell den Status des laufenden Gateways prüfen
summary: CLI-Referenz für `openclaw health` (Gateway-Status-Snapshot über RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T12:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Status vom laufenden Gateway abrufen.

Optionen:

- `--json`: maschinenlesbare Ausgabe
- `--timeout <ms>`: Verbindungs-Timeout in Millisekunden (Standard `10000`)
- `--verbose`: ausführliches Logging
- `--debug`: Alias für `--verbose`

Beispiele:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Hinweise:

- Standardmäßig fragt `openclaw health` das laufende Gateway nach seinem Status-Snapshot. Wenn das
  Gateway bereits einen aktuellen gecachten Snapshot hat, kann es diese gecachte Nutzlast zurückgeben und
  im Hintergrund aktualisieren.
- `--verbose` erzwingt eine Live-Probe, gibt Details zur Gateway-Verbindung aus und erweitert die
  menschenlesbare Ausgabe auf alle konfigurierten Konten und Agents.
- Die Ausgabe enthält Agent-spezifische Sitzungsspeicher, wenn mehrere Agents konfiguriert sind.
