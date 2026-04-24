---
read_when:
    - Sie verwenden `openclaw daemon ...` noch in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T06:31:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Veralteter Alias für Befehle zur Gateway-Dienstverwaltung.

`openclaw daemon ...` wird derselben Oberfläche zur Dienststeuerung zugeordnet wie die Dienstbefehle von `openclaw gateway ...`.

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

- `status`: Installationsstatus des Dienstes anzeigen und Gateway-Zustand prüfen
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

- `status` löst konfigurierte Auth-SecretRefs nach Möglichkeit für die Probe-Authentifizierung auf.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlsablauf nicht aufgelöst werden kann, meldet `daemon status --json` `rpc.authWarning`, wenn Konnektivität/Authentifizierung der Probe fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Referenzen unterdrückt, um Fehlalarme zu vermeiden.
- `status --deep` fügt eine Best-Effort-Systemprüfung auf Dienstebene hinzu. Wenn andere gatewayähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass ein Gateway pro Rechner weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen umfassen die Token-Drift-Prüfungen von `status` sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen der Unit.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebungsvariablen des Dienstbefehls, dann als Fallback die Prozessumgebung).
- Wenn Token-Authentifizierung effektiv nicht aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Metadaten der Dienstumgebung.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Status und Workspaces; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
