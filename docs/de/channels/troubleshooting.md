---
read_when:
    - Der Kanal-Transport meldet „verbunden“, aber Antworten schlagen fehl
    - Sie benötigen kanalspezifische Prüfungen, bevor Sie tiefer in die Provider-Dokumentation einsteigen
summary: Schnelle Fehlerbehebung auf Kanalebene mit kanalspezifischen Fehlersignaturen und Korrekturen
title: Fehlerbehebung für Kanäle
x-i18n:
    generated_at: "2026-04-24T06:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Verwenden Sie diese Seite, wenn ein Kanal eine Verbindung herstellt, das Verhalten aber falsch ist.

## Befehlsabfolge

Führen Sie diese Befehle zuerst in dieser Reihenfolge aus:

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
- Die Kanal-Probe zeigt einen verbundenen Transport und, wo unterstützt, `works` oder `audit ok`

## WhatsApp

### Fehlersignaturen für WhatsApp

| Symptom                        | Schnellste Prüfung                                 | Korrektur                                                  |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| Verbunden, aber keine DM-Antworten | `openclaw pairing list whatsapp`                   | Absender genehmigen oder DM-Richtlinie/Allowlist ändern.   |
| Gruppennachrichten werden ignoriert | `requireMention` + Erwähnungsmuster in der Konfiguration prüfen | Bot erwähnen oder Erwähnungsrichtlinie für diese Gruppe lockern. |
| Zufällige Trennungs-/Neuanmeldeschleifen | `openclaw channels status --probe` + Logs          | Erneut anmelden und prüfen, ob das Anmeldedatenverzeichnis intakt ist. |

Vollständige Fehlerbehebung: [WhatsApp-Fehlerbehebung](/de/channels/whatsapp#troubleshooting)

## Telegram

### Fehlersignaturen für Telegram

| Symptom                            | Schnellste Prüfung                                | Korrektur                                                                                                                 |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start`, aber kein nutzbarer Antwortfluss | `openclaw pairing list telegram`                  | Pairing genehmigen oder DM-Richtlinie ändern.                                                                             |
| Bot online, aber Gruppe bleibt still | Erwähnungsanforderung und Datenschutzmodus des Bots prüfen | Datenschutzmodus für Gruppensichtbarkeit deaktivieren oder Bot erwähnen.                                                  |
| Sendefehler mit Netzwerkfehlern    | Logs auf Fehler bei Telegram-API-Aufrufen prüfen  | DNS-/IPv6-/Proxy-Routing zu `api.telegram.org` korrigieren.                                                               |
| Polling hängt oder verbindet sich langsam neu | `openclaw logs --follow` für Polling-Diagnosen   | Upgrade durchführen; wenn Neustarts Fehlalarme sind, `pollingStallThresholdMs` anpassen. Anhaltende Hänger deuten weiterhin auf Proxy/DNS/IPv6 hin. |
| `setMyCommands` beim Start abgelehnt | Logs auf `BOT_COMMANDS_TOO_MUCH` prüfen          | Plugin-/Skills-/benutzerdefinierte Telegram-Befehle reduzieren oder native Menüs deaktivieren.                           |
| Upgrade durchgeführt und Allowlist blockiert Sie | `openclaw security audit` und Konfigurations-Allowlists | `openclaw doctor --fix` ausführen oder `@username` durch numerische Absender-IDs ersetzen.                               |

Vollständige Fehlerbehebung: [Telegram-Fehlerbehebung](/de/channels/telegram#troubleshooting)

## Discord

### Fehlersignaturen für Discord

| Symptom                        | Schnellste Prüfung                     | Korrektur                                                 |
| ------------------------------ | -------------------------------------- | --------------------------------------------------------- |
| Bot online, aber keine Antworten in Guilds | `openclaw channels status --probe`     | Guild/Kanal erlauben und Intent für Nachrichteninhalt prüfen. |
| Gruppennachrichten werden ignoriert | Logs auf Drops durch Mention-Gating prüfen | Bot erwähnen oder `requireMention: false` für Guild/Kanal setzen. |
| DM-Antworten fehlen            | `openclaw pairing list discord`        | DM-Pairing genehmigen oder DM-Richtlinie anpassen.        |

Vollständige Fehlerbehebung: [Discord-Fehlerbehebung](/de/channels/discord#troubleshooting)

## Slack

### Fehlersignaturen für Slack

| Symptom                                 | Schnellste Prüfung                      | Korrektur                                                                                                                                             |
| --------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode verbunden, aber keine Antworten | `openclaw channels status --probe`      | App-Token + Bot-Token und erforderliche Scopes prüfen; bei SecretRef-basierten Setups auf `botTokenStatus` / `appTokenStatus = configured_unavailable` achten. |
| DMs blockiert                           | `openclaw pairing list slack`           | Pairing genehmigen oder DM-Richtlinie lockern.                                                                                                        |
| Kanalnachricht ignoriert                | `groupPolicy` und Kanal-Allowlist prüfen | Kanal erlauben oder Richtlinie auf `open` setzen.                                                                                                    |

Vollständige Fehlerbehebung: [Slack-Fehlerbehebung](/de/channels/slack#troubleshooting)

## iMessage und BlueBubbles

### Fehlersignaturen für iMessage und BlueBubbles

| Symptom                         | Schnellste Prüfung                                                    | Korrektur                                             |
| ------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Keine eingehenden Ereignisse    | Erreichbarkeit von Webhook/Server und App-Berechtigungen prüfen       | Webhook-URL oder Zustand des BlueBubbles-Servers korrigieren. |
| Senden funktioniert, aber kein Empfang unter macOS | macOS-Datenschutzberechtigungen für Messages-Automatisierung prüfen | TCC-Berechtigungen erneut gewähren und Kanalprozess neu starten. |
| DM-Absender blockiert           | `openclaw pairing list imessage` oder `openclaw pairing list bluebubbles` | Pairing genehmigen oder Allowlist aktualisieren.      |

Vollständige Fehlerbehebung:

- [iMessage-Fehlerbehebung](/de/channels/imessage#troubleshooting)
- [BlueBubbles-Fehlerbehebung](/de/channels/bluebubbles#troubleshooting)

## Signal

### Fehlersignaturen für Signal

| Symptom                        | Schnellste Prüfung                      | Korrektur                                                 |
| ------------------------------ | --------------------------------------- | --------------------------------------------------------- |
| Daemon erreichbar, aber Bot still | `openclaw channels status --probe`      | URL/Konto des `signal-cli`-Daemon und Empfangsmodus prüfen. |
| DM blockiert                   | `openclaw pairing list signal`          | Absender genehmigen oder DM-Richtlinie anpassen.          |
| Gruppenantworten werden nicht ausgelöst | Gruppen-Allowlist und Erwähnungsmuster prüfen | Absender/Gruppe hinzufügen oder Gating lockern.           |

Vollständige Fehlerbehebung: [Signal-Fehlerbehebung](/de/channels/signal#troubleshooting)

## QQ Bot

### Fehlersignaturen für QQ Bot

| Symptom                        | Schnellste Prüfung                               | Korrektur                                                        |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------- |
| Bot antwortet mit „gone to Mars“ | `appId` und `clientSecret` in der Konfiguration prüfen | Anmeldedaten setzen oder das Gateway neu starten.                |
| Keine eingehenden Nachrichten  | `openclaw channels status --probe`               | Anmeldedaten auf der QQ Open Platform prüfen.                    |
| Sprache wird nicht transkribiert | STT-Provider-Konfiguration prüfen               | `channels.qqbot.stt` oder `tools.media.audio` konfigurieren.     |
| Proaktive Nachrichten kommen nicht an | Anforderungen der QQ-Plattform für Interaktionen prüfen | QQ blockiert möglicherweise botinitiierte Nachrichten ohne kürzliche Interaktion. |

Vollständige Fehlerbehebung: [QQ-Bot-Fehlerbehebung](/de/channels/qqbot#troubleshooting)

## Matrix

### Fehlersignaturen für Matrix

| Symptom                            | Schnellste Prüfung                    | Korrektur                                                                  |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Angemeldet, ignoriert aber Raumnachrichten | `openclaw channels status --probe`    | `groupPolicy`, Raum-Allowlist und Mention-Gating prüfen.                   |
| DMs werden nicht verarbeitet       | `openclaw pairing list matrix`        | Absender genehmigen oder DM-Richtlinie anpassen.                           |
| Verschlüsselte Räume schlagen fehl | `openclaw matrix verify status`       | Gerät erneut verifizieren, dann `openclaw matrix verify backup status` prüfen. |
| Backup-Wiederherstellung ausstehend/defekt | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` ausführen oder mit einem Recovery-Schlüssel erneut ausführen. |
| Cross-Signing/Bootstrap sieht falsch aus | `openclaw matrix verify bootstrap`    | Secret Storage, Cross-Signing und Backup-Status in einem Durchlauf reparieren. |

Vollständige Einrichtung und Konfiguration: [Matrix](/de/channels/matrix)

## Verwandt

- [Pairing](/de/channels/pairing)
- [Kanal-Routing](/de/channels/channel-routing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
