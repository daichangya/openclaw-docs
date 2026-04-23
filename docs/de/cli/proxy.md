---
read_when:
    - Sie müssen OpenClaw-Transportdaten lokal zum Debuggen aufzeichnen.
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Query-Presets prüfen.
summary: CLI-Referenz für `openclaw proxy`, den lokalen Debug-Proxy und Capture-Inspector
title: proxy
x-i18n:
    generated_at: "2026-04-23T14:00:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Den lokalen expliziten Debug-Proxy ausführen und aufgezeichneten Datenverkehr prüfen.

Dies ist ein Debugging-Befehl für Untersuchungen auf Transportebene. Er kann einen
lokalen Proxy starten, einen Child-Befehl mit aktivierter Aufzeichnung ausführen, Aufzeichnungs-
sitzungen auflisten, häufige Verkehrsmuster abfragen, aufgezeichnete Blobs lesen und lokale
Aufzeichnungsdaten löschen.

## Befehle

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Query-Presets

`openclaw proxy query --preset <name>` akzeptiert:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Hinweise

- `start` verwendet standardmäßig `127.0.0.1`, sofern `--host` nicht gesetzt ist.
- `run` startet einen lokalen Debug-Proxy und führt dann den Befehl nach `--` aus.
- Aufzeichnungen sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.
