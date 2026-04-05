---
read_when:
    - Diagnose von Kanal-Konnektivität oder Gateway-Health
    - Verstehen von Health-Check-CLI-Befehlen und -Optionen
summary: Health-Check-Befehle und Gateway-Health-Monitoring
title: Health Checks
x-i18n:
    generated_at: "2026-04-05T12:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Health Checks (CLI)

Kurzer Leitfaden, um die Kanal-Konnektivität zu prüfen, ohne raten zu müssen.

## Schnellprüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Update-Hinweis, Alter der Auth verknüpfter Kanäle, Sitzungen und letzte Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen für Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Health-Probe (`health` mit `probe:true`), einschließlich kanalbezogener Probes pro Konto, wenn unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Health-Snapshot (nur WS; keine direkten Kanal-Sockets von der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Health-Probe und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Health-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Logs: `/tmp/openclaw/openclaw-*.log` mit `tail` verfolgen und nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` filtern.

## Tiefe Diagnose

- Credentials auf dem Datenträger: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (der Pfad kann in der Konfiguration überschrieben werden). Anzahl und letzte Empfänger werden über `status` angezeigt.
- Relink-Ablauf: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in den Logs erscheinen. (Hinweis: Der QR-Login-Ablauf startet nach dem Pairing bei Status 515 automatisch einmal neu.)

## Konfiguration des Health-Monitors

- `gateway.channelHealthCheckMinutes`: Wie oft das Gateway die Kanal-Health prüft. Standard: `5`. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: Wie lange ein verbundener Kanal inaktiv bleiben kann, bevor der Health-Monitor ihn als veraltet behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: Rollierende Obergrenze von Neustarts pro Kanal/Konto innerhalb einer Stunde durch den Health-Monitor. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Deaktiviert Health-Monitor-Neustarts für einen bestimmten Kanal, während globales Monitoring aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung für mehrere Konten, die Vorrang vor der Einstellung auf Kanalebene hat.
- Diese Überschreibungen pro Kanal gelten für die integrierten Kanal-Monitore, die sie derzeit bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → mit `openclaw channels logout` und dann `openclaw channels login` neu verknüpfen.
- Gateway nicht erreichbar → starten: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender zugelassen ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- und Mention-Regeln passen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedizierter Befehl "health"

`openclaw health` fragt das laufende Gateway nach seinem Health-Snapshot (keine direkten Kanal-
Sockets von der CLI). Standardmäßig kann es einen aktuellen zwischengespeicherten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache dann im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Probe. Der Befehl meldet Alter verknüpfter Credentials/Auth, sofern verfügbar,
kanalbezogene Probe-Zusammenfassungen, eine Zusammenfassung des Sitzungsspeichers und eine Probe-Dauer. Er beendet sich
mit einem Nicht-Null-Code, wenn das Gateway nicht erreichbar ist oder die Probe fehlschlägt/ein Timeout hat.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt das Standard-Timeout von 10 s für die Probe
- `--verbose`: erzwingt eine Live-Probe und gibt Gateway-Verbindungsdetails aus
- `--debug`: Alias für `--verbose`

Der Health-Snapshot enthält: `ok` (boolesch), `ts` (Zeitstempel), `durationMs` (Probe-Zeit), Status pro Kanal, Agent-Verfügbarkeit und eine Zusammenfassung des Sitzungsspeichers.
