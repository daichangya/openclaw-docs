---
read_when:
    - Sie in Skripten weiterhin `openclaw daemon ...` verwenden
    - Sie Befehle für den Dienstlebenszyklus benötigen (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: daemon
x-i18n:
    generated_at: "2026-04-05T12:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Veralteter Alias für Befehle zur Gateway-Dienstverwaltung.

`openclaw daemon ...` ist derselben Oberfläche zur Dienststeuerung zugeordnet wie die Dienstbefehle von `openclaw gateway ...`.

## Verwendung

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Unterbefehle

- `status`: Installationsstatus des Dienstes anzeigen und Zustand des Gateways prüfen
- `install`: Dienst installieren (`launchd`/`systemd`/`schtasks`)
- `uninstall`: Dienst entfernen
- `start`: Dienst starten
- `stop`: Dienst stoppen
- `restart`: Dienst neu starten

## Häufige Optionen

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- Lebenszyklus (`uninstall|start|stop|restart`): `--json`

Hinweise:

- `status` löst, wenn möglich, konfigurierte Auth-SecretRefs für die Probe-Authentifizierung auf.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `daemon status --json` `rpc.authWarning`, wenn Probe-Konnektivität/Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
- `status --deep` fügt einen Best-Effort-Scan des Dienstes auf Systemebene hinzu. Wenn dabei andere gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen umfassen Token-Drift-Prüfungen in `status` sowohl die Unit-Quellen `Environment=` als auch `EnvironmentFile=`.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebungsvariablen des Dienstbefehls, dann Fallback auf die Prozessumgebung).
- Wenn die Token-Authentifizierung effektiv nicht aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy`, oder Modus nicht gesetzt, wobei password gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.
- Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` von SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst wird, schlägt die Installation fail-closed fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird `install` blockiert, bis der Modus explizit gesetzt wird.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Status und Workspaces; siehe [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/cli/gateway) für aktuelle Dokumentation und Beispiele.
