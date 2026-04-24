---
read_when:
    - Diagnose von Channel-Konnektivität oder Gateway-Gesundheit
    - CLI-Befehle und Optionen für Health-Checks verstehen
summary: Health-Check-Befehle und Gateway-Gesundheitsüberwachung
title: Health-Checks
x-i18n:
    generated_at: "2026-04-24T06:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Health-Checks (CLI)

Kurzanleitung, um Channel-Konnektivität ohne Rätselraten zu prüfen.

## Schnellprüfungen

- `openclaw status` — lokale Zusammenfassung: Gateway-Erreichbarkeit/-Modus, Update-Hinweis, Alter verknüpfter Channel-Authentifizierung, Sitzungen + aktuelle Aktivität.
- `openclaw status --all` — vollständige lokale Diagnose (schreibgeschützt, farbig, sicher zum Einfügen für Debugging).
- `openclaw status --deep` — fragt das laufende Gateway nach einer Live-Health-Prüfung (`health` mit `probe:true`), einschließlich Channel-Prüfungen pro Konto, wenn unterstützt.
- `openclaw health` — fragt das laufende Gateway nach seinem Health-Snapshot (nur WS; keine direkten Channel-Sockets aus der CLI).
- `openclaw health --verbose` — erzwingt eine Live-Health-Prüfung und gibt Gateway-Verbindungsdetails aus.
- `openclaw health --json` — maschinenlesbare Ausgabe des Health-Snapshots.
- Senden Sie `/status` als eigenständige Nachricht in WhatsApp/WebChat, um eine Statusantwort zu erhalten, ohne den Agenten aufzurufen.
- Logs: `tail` auf `/tmp/openclaw/openclaw-*.log` und nach `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` filtern.

## Tiefendiagnose

- Zugangsdaten auf der Festplatte: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime sollte aktuell sein).
- Sitzungsspeicher: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (Pfad kann in der Konfiguration überschrieben werden). Anzahl und aktuelle Empfänger werden über `status` angezeigt.
- Relink-Ablauf: `openclaw channels logout && openclaw channels login --verbose`, wenn Statuscodes 409–515 oder `loggedOut` in den Logs erscheinen. (Hinweis: Der QR-Login-Ablauf startet nach Status 515 nach dem Pairing einmal automatisch neu.)
- Diagnosen sind standardmäßig aktiviert. Das Gateway zeichnet Betriebsdaten auf, sofern nicht `diagnostics.enabled: false` gesetzt ist. Memory-Ereignisse erfassen RSS-/Heap-Byte-Zahlen, Threshold-Druck und Wachstumsdruck. Ereignisse zu übergroßen Payloads erfassen, was abgelehnt, gekürzt oder in Chunks aufgeteilt wurde, plus Größen und Limits, sofern verfügbar. Sie erfassen weder Nachrichtentext, Anhangsinhalte, Webhook-Body, rohe Request- oder Response-Bodies, Tokens, Cookies noch Secret-Werte. Derselbe Heartbeat startet den begrenzten Stabilitätsrekorder, der über `openclaw gateway stability` oder die Gateway-RPC `diagnostics.stability` verfügbar ist. Fatale Gateway-Exits, Shutdown-Timeouts und Neustart-Startfehler persistieren den neuesten Rekorder-Snapshot unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind; prüfen Sie das neueste gespeicherte Bundle mit `openclaw gateway stability --bundle latest`.
- Für Bug-Reports führen Sie `openclaw gateway diagnostics export` aus und hängen die erzeugte ZIP-Datei an. Der Export kombiniert eine Markdown-Zusammenfassung, das neueste Stabilitäts-Bundle, bereinigte Log-Metadaten, bereinigte Gateway-Status-/Health-Snapshots und die Konfigurationsform. Er ist zum Teilen gedacht: Chat-Text, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen und Secret-Werte werden weggelassen oder redigiert. Siehe [Diagnostics Export](/de/gateway/diagnostics).

## Konfiguration des Health-Monitors

- `gateway.channelHealthCheckMinutes`: wie oft das Gateway die Channel-Gesundheit prüft. Standard: `5`. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren.
- `gateway.channelStaleEventThresholdMinutes`: wie lange ein verbundener Channel inaktiv bleiben darf, bevor der Health-Monitor ihn als stale behandelt und neu startet. Standard: `30`. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: rollierende Obergrenze pro Stunde für Neustarts durch den Health-Monitor pro Channel/Konto. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Neustarts durch den Health-Monitor für einen bestimmten Channel deaktivieren, während globale Überwachung aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung für mehrere Konten, die gegenüber der Einstellung auf Channel-Ebene gewinnt.
- Diese Überschreibungen pro Channel gelten für die integrierten Channel-Monitore, die sie heute bereitstellen: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram und WhatsApp.

## Wenn etwas fehlschlägt

- `logged out` oder Status 409–515 → neu verknüpfen mit `openclaw channels logout` und dann `openclaw channels login`.
- Gateway nicht erreichbar → starten: `openclaw gateway --port 18789` (verwenden Sie `--force`, wenn der Port belegt ist).
- Keine eingehenden Nachrichten → bestätigen Sie, dass das verknüpfte Telefon online ist und der Absender erlaubt ist (`channels.whatsapp.allowFrom`); stellen Sie bei Gruppenchats sicher, dass Allowlist- und Erwähnungsregeln passen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedizierter Befehl „health“

`openclaw health` fragt das laufende Gateway nach seinem Health-Snapshot (keine direkten Channel-
Sockets aus der CLI). Standardmäßig kann es einen frischen gecachten Gateway-Snapshot zurückgeben; das
Gateway aktualisiert diesen Cache dann im Hintergrund. `openclaw health --verbose` erzwingt
stattdessen eine Live-Prüfung. Der Befehl meldet verknüpfte Zugangsdaten/Alter der Authentifizierung, wenn verfügbar,
Zusammenfassungen der Prüfungen pro Channel, die Zusammenfassung des Sitzungsspeichers und eine Prüfdauer. Er beendet sich
mit einem Nicht-Null-Code, wenn das Gateway nicht erreichbar ist oder die Prüfung fehlschlägt/ein Timeout hat.

Optionen:

- `--json`: maschinenlesbare JSON-Ausgabe
- `--timeout <ms>`: überschreibt das Standard-Timeout von 10 s für die Prüfung
- `--verbose`: erzwingt eine Live-Prüfung und gibt Gateway-Verbindungsdetails aus
- `--debug`: Alias für `--verbose`

Der Health-Snapshot enthält: `ok` (Boolean), `ts` (Zeitstempel), `durationMs` (Prüfzeit), Status pro Channel, Verfügbarkeit von Agenten und Zusammenfassung des Sitzungsspeichers.

## Verwandt

- [Gateway runbook](/de/gateway)
- [Diagnostics export](/de/gateway/diagnostics)
- [Gateway troubleshooting](/de/gateway/troubleshooting)
