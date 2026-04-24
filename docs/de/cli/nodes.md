---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm)
title: Nodes
x-i18n:
    generated_at: "2026-04-24T06:32:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gekoppelte Nodes (Geräte) verwalten und Node-Fähigkeiten aufrufen.

Verwandt:

- Node-Überblick: [Nodes](/de/nodes)
- Kamera: [Camera nodes](/de/nodes/camera)
- Bilder: [Image nodes](/de/nodes/images)

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

`nodes list` gibt Tabellen für ausstehende/gekoppelte Nodes aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (Last Connect).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Pairing-Scope.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Scope-Anforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Pairing
  - nicht-`exec`-Node-Befehle: Pairing + Schreibzugriff
  - `system.run` / `system.run.prepare` / `system.which`: Pairing + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags für `invoke`:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für Node-Aufruf (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotency-Key.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie das Tool `exec` mit `host=node` für Shell-Ausführung.

Für Shell-Ausführung auf einer Node verwenden Sie das Tool `exec` mit `host=node` statt `openclaw nodes run`.
Die `nodes`-CLI ist jetzt auf Fähigkeiten fokussiert: direktes RPC über `nodes invoke`, plus Pairing, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
