---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen
summary: CLI-Referenz für `openclaw nodes` (Status, Pairing, Aufrufen, Kamera/Canvas/Bildschirm)
title: nodes
x-i18n:
    generated_at: "2026-04-05T12:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Verwalten Sie gekoppelte Nodes (Geräte) und rufen Sie Node-Fähigkeiten auf.

Verwandt:

- Nodes-Überblick: [Nodes](/nodes)
- Kamera: [Camera nodes](/nodes/camera)
- Bilder: [Image nodes](/nodes/images)

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--json`

## Häufige Befehle

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` gibt Tabellen für ausstehende und gekoppelte Nodes aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (Last Connect).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
nach Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Pairing-Umfang.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Umfangsanforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Pairing
  - Node-Befehle ohne Exec: Pairing + Schreiben
  - `system.run` / `system.run.prepare` / `system.which`: Pairing + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Aufruf-Flags:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für Node-Aufrufe (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie das `exec`-Tool mit `host=node` für Shell-Ausführung.

Für Shell-Ausführung auf einer Node verwenden Sie das `exec`-Tool mit `host=node` anstelle von `openclaw nodes run`.
Die `nodes`-CLI ist jetzt auf Fähigkeiten fokussiert: direktes RPC über `nodes invoke`, plus Pairing, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen.
