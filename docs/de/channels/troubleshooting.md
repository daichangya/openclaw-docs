---
read_when:
    - Der Kanaltransport zeigt verbunden an, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen vor einer tiefen Untersuchung der Provider-Dokumentation
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-04-05T12:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für Kanäle

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten aber falsch ist.

## Befehlsleiter

Führen Sie diese zuerst in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gesunde Ausgangsbasis:

- `Runtime: running`
- `RPC probe: ok`
- Die Kanalprüfung zeigt einen verbundenen Transport und, wo unterstützt, `works` oder `audit ok`

## WhatsApp

### Fehlersignaturen bei WhatsApp

| Symptom                         | Schnellste Prüfung                                  | Korrektur                                                  |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten | `openclaw pairing list whatsapp`                 | Absender genehmigen oder DM-Richtlinie/Allowlist ändern.   |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Bot erwähnen oder Erwähnungsrichtlinie für diese Gruppe lockern. |
| Zufällige Verbindungsabbrüche/erneute Anmeldung in Schleife | `openclaw channels status --probe` + Logs | Erneut anmelden und prüfen, ob das Verzeichnis mit Anmeldedaten intakt ist. |

Vollständige Fehlerbehebung: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Fehlersignaturen bei Telegram

| Symptom                             | Schnellste Prüfung                              | Korrektur                                                                 |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`         | Kopplung genehmigen oder DM-Richtlinie ändern.                            |
| Bot online, aber Gruppe bleibt still | Erwähnungspflicht und Datenschutzmodus des Bots prüfen | Datenschutzmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen. |
| Sendeprobleme mit Netzwerkfehlern   | Logs auf Fehler bei Telegram-API-Aufrufen prüfen | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.              |
| `setMyCommands` wird beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen | Plugin-/Skills-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren. |
| Upgrade durchgeführt und Allowlist blockiert Sie | `openclaw security audit` und Konfigurations-Allowlists | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen. |

Vollständige Fehlerbehebung: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Fehlersignaturen bei Discord

| Symptom                         | Schnellste Prüfung                      | Korrektur                                                  |
| ------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Bot online, aber keine Guild-Antworten | `openclaw channels status --probe` | Guild/Kanal zulassen und Intent für Nachrichteninhalt prüfen. |
| Gruppennachrichten werden ignoriert | Logs auf durch Mention-Gating verworfene Nachrichten prüfen | Bot erwähnen oder `requireMention: false` für Guild/Kanal setzen. |
| DM-Antworten fehlen             | `openclaw pairing list discord`         | DM-Kopplung genehmigen oder DM-Richtlinie anpassen.        |

Vollständige Fehlerbehebung: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Fehlersignaturen bei Slack

| Symptom                                | Schnellste Prüfung                      | Korrektur                                                                                                                                              |
| -------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe` | App-Token + Bot-Token und erforderliche Scopes prüfen; bei SecretRef-gestützten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                          | `openclaw pairing list slack`           | Kopplung genehmigen oder DM-Richtlinie lockern.                                                                                                       |
| Kanalnachricht wird ignoriert          | `groupPolicy` und Kanal-Allowlist prüfen | Kanal zulassen oder Richtlinie auf `open` setzen.                                                                                                     |

Vollständige Fehlerbehebung: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### Fehlersignaturen bei iMessage und BlueBubbles

| Symptom                          | Schnellste Prüfung                                                      | Korrektur                                              |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Keine eingehenden Ereignisse     | Erreichbarkeit von Webhook/Server und App-Berechtigungen prüfen         | Webhook-URL oder BlueBubbles-Serverstatus korrigieren. |
| Senden funktioniert, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut erteilen und Kanalprozess neu starten. |
| DM-Absender blockiert            | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Kopplung genehmigen oder Allowlist aktualisieren.      |

Vollständige Fehlerbehebung:

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Fehlersignaturen bei Signal

| Symptom                         | Schnellste Prüfung                      | Korrektur                                                 |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| Daemon erreichbar, aber Bot bleibt still | `openclaw channels status --probe` | URL/Konto des `signal-cli`-Daemon und Empfangsmodus prüfen. |
| DM blockiert                    | `openclaw pairing list signal`          | Absender genehmigen oder DM-Richtlinie anpassen.          |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Allowlist und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Gating lockern.           |

Vollständige Fehlerbehebung: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### Fehlersignaturen bei QQ Bot

| Symptom                         | Schnellste Prüfung                              | Korrektur                                                        |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Bot antwortet „gone to Mars“    | `appId` und `clientSecret` in der Konfiguration prüfen | Anmeldedaten setzen oder das Gateway neu starten.                |
| Keine eingehenden Nachrichten   | `openclaw channels status --probe`              | Anmeldedaten auf der QQ Open Platform prüfen.                    |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen              | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.     |
| Proaktive Nachrichten kommen nicht an | Anforderungen der QQ-Plattform für Interaktionen prüfen | QQ kann vom Bot initiierte Nachrichten ohne kürzliche Interaktion blockieren. |

Vollständige Fehlerbehebung: [/channels/qqbot#troubleshooting](/channels/qqbot#troubleshooting)

## Matrix

### Fehlersignaturen bei Matrix

| Symptom                             | Schnellste Prüfung                     | Korrektur                                                                |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Angemeldet, ignoriert aber Raumnachrichten | `openclaw channels status --probe` | `groupPolicy`, Raum-Allowlist und Mention-Gating prüfen.                 |
| DMs werden nicht verarbeitet        | `openclaw pairing list matrix`         | Absender genehmigen oder DM-Richtlinie anpassen.                         |
| Verschlüsselte Räume schlagen fehl  | `openclaw matrix verify status`        | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Backup-Wiederherstellung ist ausstehend/fehlerhaft | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` ausführen oder mit einem Wiederherstellungsschlüssel erneut versuchen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap` | Secret Storage, Cross-Signing und Backup-Status in einem Durchgang reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/channels/matrix)
