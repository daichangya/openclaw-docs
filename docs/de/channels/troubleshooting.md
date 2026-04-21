---
read_when:
    - Der Kanaltransport zeigt verbunden an, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie sich in die ausführliche Provider-Dokumentation vertiefen
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-04-21T06:23:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für Kanäle

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten aber falsch ist.

## Befehlsabfolge

Führen Sie diese zuerst in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gesunde Basis:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` oder `admin-capable`
- Die Kanalprüfung zeigt, dass der Transport verbunden ist und, falls unterstützt, `works` oder `audit ok`

## WhatsApp

### Fehlersignaturen für WhatsApp

| Symptom                         | Schnellste Prüfung                                 | Korrektur                                                   |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten | `openclaw pairing list whatsapp`                 | Absender freigeben oder DM-Richtlinie/Zulassungsliste ändern. |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Den Bot erwähnen oder die Erwähnungsrichtlinie für diese Gruppe lockern. |
| Zufällige Verbindungsabbrüche/erneute Anmeldeschleifen | `openclaw channels status --probe` + Logs | Erneut anmelden und prüfen, ob das Verzeichnis mit den Zugangsdaten intakt ist. |

Vollständige Fehlerbehebung: [/channels/whatsapp#troubleshooting](/de/channels/whatsapp#troubleshooting)

## Telegram

### Fehlersignaturen für Telegram

| Symptom                             | Schnellste Prüfung                              | Korrektur                                                                                                                 |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`           | Kopplung freigeben oder DM-Richtlinie ändern.                                                                            |
| Bot online, aber Gruppe bleibt still | Erwähnungsanforderung und Datenschutzmodus des Bots prüfen | Datenschutzmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen.                                                 |
| Sendefehler mit Netzwerkfehlern     | Logs auf fehlgeschlagene Telegram-API-Aufrufe prüfen | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.                                                              |
| Polling stockt oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen | Aktualisieren; wenn Neustarts Fehlalarme sind, `pollingStallThresholdMs` anpassen. Anhaltende Hänger deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` wird beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen    | Plugin-/Skills-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren.                          |
| Aktualisiert und Zulassungsliste blockiert Sie | `openclaw security audit` und Konfigurations-Zulassungslisten | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen.                              |

Vollständige Fehlerbehebung: [/channels/telegram#troubleshooting](/de/channels/telegram#troubleshooting)

## Discord

### Fehlersignaturen für Discord

| Symptom                         | Schnellste Prüfung                    | Korrektur                                                  |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Bot online, aber keine Antworten im Server | `openclaw channels status --probe` | Server/Kanal zulassen und Message-Content-Intent prüfen.   |
| Gruppennachrichten werden ignoriert | Logs auf durch Erwähnungsfilter verworfene Nachrichten prüfen | Bot erwähnen oder für Server/Kanal `requireMention: false` setzen. |
| DM-Antworten fehlen             | `openclaw pairing list discord`       | DM-Kopplung freigeben oder DM-Richtlinie anpassen.         |

Vollständige Fehlerbehebung: [/channels/discord#troubleshooting](/de/channels/discord#troubleshooting)

## Slack

### Fehlersignaturen für Slack

| Symptom                                | Schnellste Prüfung                      | Korrektur                                                                                                                                             |
| -------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`   | App-Token + Bot-Token und erforderliche Bereiche prüfen; bei Setups mit SecretRef auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                          | `openclaw pairing list slack`          | Kopplung freigeben oder DM-Richtlinie lockern.                                                                                                       |
| Kanalnachricht wird ignoriert          | `groupPolicy` und Kanal-Zulassungsliste prüfen | Kanal zulassen oder Richtlinie auf `open` setzen.                                                                                                    |

Vollständige Fehlerbehebung: [/channels/slack#troubleshooting](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### Fehlersignaturen für iMessage und BlueBubbles

| Symptom                          | Schnellste Prüfung                                                             | Korrektur                                              |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Keine eingehenden Ereignisse     | Erreichbarkeit von Webhook/Server und App-Berechtigungen prüfen                | Webhook-URL oder BlueBubbles-Serverstatus korrigieren. |
| Senden funktioniert, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut erteilen und Kanalprozess neu starten. |
| DM-Absender blockiert            | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles`      | Kopplung freigeben oder Zulassungsliste aktualisieren. |

Vollständige Fehlerbehebung:

- [/channels/imessage#troubleshooting](/de/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/de/channels/bluebubbles#troubleshooting)

## Signal

### Fehlersignaturen für Signal

| Symptom                         | Schnellste Prüfung                      | Korrektur                                                 |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| Daemon erreichbar, aber Bot bleibt still | `openclaw channels status --probe` | URL/Konto des `signal-cli`-Daemon und Empfangsmodus prüfen. |
| DM blockiert                    | `openclaw pairing list signal`          | Absender freigeben oder DM-Richtlinie anpassen.           |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Zulassungsliste und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Einschränkungen lockern.  |

Vollständige Fehlerbehebung: [/channels/signal#troubleshooting](/de/channels/signal#troubleshooting)

## QQ Bot

### Fehlersignaturen für QQ Bot

| Symptom                         | Schnellste Prüfung                         | Korrektur                                                        |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Bot antwortet „gone to Mars“    | `appId` und `clientSecret` in der Konfiguration prüfen | Zugangsdaten setzen oder das Gateway neu starten.                |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`         | Zugangsdaten auf der QQ Open Platform prüfen.                    |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen         | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.     |
| Proaktive Nachrichten kommen nicht an | QQ-Plattformanforderungen für Interaktionen prüfen | QQ blockiert möglicherweise botinitiierte Nachrichten ohne kürzliche Interaktion. |

Vollständige Fehlerbehebung: [/channels/qqbot#troubleshooting](/de/channels/qqbot#troubleshooting)

## Matrix

### Fehlersignaturen für Matrix

| Symptom                             | Schnellste Prüfung                    | Korrektur                                                                      |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Angemeldet, aber Raumnachrichten werden ignoriert | `openclaw channels status --probe` | `groupPolicy`, Raum-Zulassungsliste und Erwähnungsfilter prüfen.               |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`        | Absender freigeben oder DM-Richtlinie anpassen.                                |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`       | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Wiederherstellung des Backups ausstehend/defekt | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` ausführen oder mit einem Wiederherstellungsschlüssel erneut ausführen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap` | Secret Storage, Cross-Signing und Backup-Status in einem Durchgang reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)
