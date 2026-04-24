---
read_when:
    - Sie müssen OpenClaw-Transportdatenverkehr lokal zur Fehlerbehebung mitschneiden
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfrage-Presets untersuchen
summary: CLI-Referenz für `openclaw proxy`, den lokalen Debug-Proxy und Capture-Inspector
title: Proxy
x-i18n:
    generated_at: "2026-04-24T06:32:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Den lokalen expliziten Debug-Proxy ausführen und mitgeschnittenen Datenverkehr untersuchen.

Dies ist ein Debugging-Befehl für Untersuchungen auf Transportebene. Er kann einen
lokalen Proxy starten, einen untergeordneten Befehl mit aktiviertem Mitschnitt ausführen, Capture-Sitzungen auflisten,
häufige Verkehrsmuster abfragen, mitgeschnittene Blobs lesen und lokale Capture-
Daten bereinigen.

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

## Abfrage-Presets

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
- Captures sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)
