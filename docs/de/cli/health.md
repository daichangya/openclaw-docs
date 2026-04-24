---
read_when:
    - Sie möchten schnell die Integrität des laufenden Gateway prüfen
summary: CLI-Referenz für `openclaw health` (Gateway-Integritäts-Snapshot über RPC)
title: Integrität
x-i18n:
    generated_at: "2026-04-24T06:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Rufen Sie die Integrität des laufenden Gateway ab.

Optionen:

- `--json`: maschinenlesbare Ausgabe
- `--timeout <ms>`: Verbindungs-Timeout in Millisekunden (Standard `10000`)
- `--verbose`: ausführliche Protokollierung
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

- Standardmäßig fragt `openclaw health` das laufende Gateway nach seinem Integritäts-Snapshot. Wenn das
  Gateway bereits einen aktuellen zwischengespeicherten Snapshot hat, kann es diese zwischengespeicherte Payload zurückgeben und
  die Aktualisierung im Hintergrund durchführen.
- `--verbose` erzwingt eine Live-Prüfung, gibt Gateway-Verbindungsdetails aus und erweitert die
  menschenlesbare Ausgabe auf alle konfigurierten Konten und Agenten.
- Die Ausgabe enthält Session Stores pro Agent, wenn mehrere Agenten konfiguriert sind.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Integrität](/de/gateway/health)
