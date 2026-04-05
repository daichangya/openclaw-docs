---
read_when:
    - Bei der Arbeit an Zalo-Funktionen oder Webhooks
summary: Zalo-Bot-Unterstützungsstatus, Fähigkeiten und Konfiguration
title: Zalo
x-i18n:
    generated_at: "2026-04-05T12:37:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

Status: experimentell. DMs werden unterstützt. Der Abschnitt [Fähigkeiten](#capabilities) unten entspricht dem aktuellen Verhalten von Marketplace-Bots.

## Gebündeltes Plugin

Zalo wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
gepackte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo ausschließt, installieren Sie es
manuell:

- Installation über die CLI: `openclaw plugins install @openclaw/zalo`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- Details: [Plugins](/tools/plugin)

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Zalo-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Legen Sie das Token fest:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oder in der Konfiguration: `channels.zalo.accounts.default.botToken: "..."`.
3. Starten Sie das Gateway neu (oder schließen Sie die Einrichtung ab).
4. DM-Zugriff verwendet standardmäßig Pairing; genehmigen Sie beim ersten Kontakt den Pairing-Code.

Minimale Konfiguration:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Was es ist

Zalo ist eine auf Vietnam ausgerichtete Messaging-App; über ihre Bot-API kann das Gateway einen Bot für 1:1-Konversationen betreiben.
Sie eignet sich gut für Support oder Benachrichtigungen, wenn Sie deterministisches Routing zurück zu Zalo möchten.

Diese Seite beschreibt das aktuelle OpenClaw-Verhalten für **Zalo Bot Creator / Marketplace-Bots**.
**Zalo Official Account (OA)-Bots** sind eine andere Zalo-Produktoberfläche und können sich anders verhalten.

- Ein Zalo-Bot-API-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen zurück an Zalo; das Modell wählt niemals Kanäle aus.
- DMs teilen sich die Hauptsitzung des Agenten.
- Der Abschnitt [Fähigkeiten](#capabilities) unten zeigt die aktuelle Unterstützung für Marketplace-Bots.

## Einrichtung (Schnellpfad)

### 1) Ein Bot-Token erstellen (Zalo Bot Platform)

1. Gehen Sie zu [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) und melden Sie sich an.
2. Erstellen Sie einen neuen Bot und konfigurieren Sie seine Einstellungen.
3. Kopieren Sie das vollständige Bot-Token (typischerweise `numeric_id:secret`). Bei Marketplace-Bots kann das nutzbare Laufzeit-Token nach der Erstellung in der Willkommensnachricht des Bots erscheinen.

### 2) Das Token konfigurieren (Env oder Konfiguration)

Beispiel:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Wenn Sie später zu einer Zalo-Bot-Oberfläche wechseln, auf der Gruppen verfügbar sind, können Sie explizit gruppenspezifische Konfigurationen wie `groupPolicy` und `groupAllowFrom` hinzufügen. Für das aktuelle Verhalten von Marketplace-Bots siehe [Fähigkeiten](#capabilities).

Env-Option: `ZALO_BOT_TOKEN=...` (funktioniert nur für den Standard-Account).

Multi-Account-Unterstützung: Verwenden Sie `channels.zalo.accounts` mit Tokens pro Account und optionalem `name`.

3. Starten Sie das Gateway neu. Zalo startet, wenn ein Token aufgelöst wird (Env oder Konfiguration).
4. Der DM-Zugriff verwendet standardmäßig Pairing. Genehmigen Sie den Code, wenn der Bot erstmals kontaktiert wird.

## Wie es funktioniert (Verhalten)

- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Medien-Platzhaltern normalisiert.
- Antworten werden immer zurück in denselben Zalo-Chat geroutet.
- Standardmäßig Long-Polling; Webhook-Modus mit `channels.zalo.webhookUrl` verfügbar.

## Limits

- Ausgehender Text wird in Blöcke von 2000 Zeichen aufgeteilt (Zalo-API-Limit).
- Medien-Downloads/-Uploads sind durch `channels.zalo.mediaMaxMb` begrenzt (Standard 5).
- Streaming ist standardmäßig blockiert, da das Limit von 2000 Zeichen Streaming weniger nützlich macht.

## Zugriffskontrolle (DMs)

### DM-Zugriff

- Standard: `channels.zalo.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt sind (Codes verfallen nach 1 Stunde).
- Genehmigung über:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing ist der Standard-Tokenaustausch. Details: [Pairing](/channels/pairing)
- `channels.zalo.allowFrom` akzeptiert numerische Benutzer-IDs (keine Auflösung von Benutzernamen verfügbar).

## Zugriffskontrolle (Gruppen)

Für **Zalo Bot Creator / Marketplace-Bots** war Gruppenunterstützung in der Praxis nicht verfügbar, weil der Bot überhaupt nicht zu einer Gruppe hinzugefügt werden konnte.

Das bedeutet, dass die unten aufgeführten gruppenbezogenen Konfigurationsschlüssel im Schema vorhanden sind, aber für Marketplace-Bots nicht nutzbar waren:

- `channels.zalo.groupPolicy` steuert die Verarbeitung eingehender Gruppennachrichten: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` schränkt ein, welche Absender-IDs den Bot in Gruppen auslösen können.
- Wenn `groupAllowFrom` nicht gesetzt ist, greift Zalo bei Absenderprüfungen auf `allowFrom` zurück.
- Laufzeithinweis: Wenn `channels.zalo` vollständig fehlt, fällt die Laufzeit aus Sicherheitsgründen weiterhin auf `groupPolicy="allowlist"` zurück.

Die Werte für die Gruppenrichtlinie sind (wenn Gruppenzugriff auf Ihrer Bot-Oberfläche verfügbar ist):

- `groupPolicy: "disabled"` — blockiert alle Gruppennachrichten.
- `groupPolicy: "open"` — erlaubt jedes Gruppenmitglied (mit Mention-Gating).
- `groupPolicy: "allowlist"` — fail-closed-Standard; nur erlaubte Absender werden akzeptiert.

Wenn Sie eine andere Zalo-Bot-Produktoberfläche verwenden und funktionierendes Gruppenverhalten verifiziert haben, dokumentieren Sie dies separat, anstatt anzunehmen, dass es dem Ablauf von Marketplace-Bots entspricht.

## Long-Polling vs. Webhook

- Standard: Long-Polling (keine öffentliche URL erforderlich).
- Webhook-Modus: Setzen Sie `channels.zalo.webhookUrl` und `channels.zalo.webhookSecret`.
  - Das Webhook-Secret muss 8-256 Zeichen lang sein.
  - Die Webhook-URL muss HTTPS verwenden.
  - Zalo sendet Ereignisse mit dem Header `X-Bot-Api-Secret-Token` zur Verifizierung.
  - Gateway-HTTP verarbeitet Webhook-Anfragen unter `channels.zalo.webhookPath` (standardmäßig der Pfad der Webhook-URL).
  - Anfragen müssen `Content-Type: application/json` (oder `+json`-Medientypen) verwenden.
  - Doppelte Ereignisse (`event_name + message_id`) werden für ein kurzes Replay-Fenster ignoriert.
  - Burst-Verkehr wird pro Pfad/Quelle rate-limitiert und kann HTTP 429 zurückgeben.

**Hinweis:** `getUpdates` (Polling) und Webhook schließen sich laut Zalo-API-Dokumentation gegenseitig aus.

## Unterstützte Nachrichtentypen

Für einen schnellen Überblick über die Unterstützung siehe [Fähigkeiten](#capabilities). Die Hinweise unten ergänzen Details, wo das Verhalten zusätzlichen Kontext benötigt.

- **Textnachrichten**: Vollständig unterstützt mit Aufteilung in 2000-Zeichen-Blöcke.
- **Einfache URLs im Text**: Verhalten sich wie normale Texteingaben.
- **Link-Vorschauen / Rich-Link-Karten**: Siehe den Marketplace-Bot-Status in [Fähigkeiten](#capabilities); sie lösten nicht zuverlässig eine Antwort aus.
- **Bildnachrichten**: Siehe den Marketplace-Bot-Status in [Fähigkeiten](#capabilities); die Verarbeitung eingehender Bilder war unzuverlässig (Tippindikator ohne abschließende Antwort).
- **Sticker**: Siehe den Marketplace-Bot-Status in [Fähigkeiten](#capabilities).
- **Sprachnotizen / Audiodateien / Video / allgemeine Dateianhänge**: Siehe den Marketplace-Bot-Status in [Fähigkeiten](#capabilities).
- **Nicht unterstützte Typen**: Werden protokolliert (zum Beispiel Nachrichten von geschützten Benutzern).

## Fähigkeiten

Diese Tabelle fasst das aktuelle Verhalten von **Zalo Bot Creator / Marketplace-Bots** in OpenClaw zusammen.

| Feature                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Direktnachrichten           | ✅ Unterstützt                          |
| Gruppen                     | ❌ Für Marketplace-Bots nicht verfügbar |
| Medien (eingehende Bilder)  | ⚠️ Eingeschränkt / in Ihrer Umgebung verifizieren |
| Medien (ausgehende Bilder)  | ⚠️ Für Marketplace-Bots nicht erneut getestet |
| Einfache URLs im Text       | ✅ Unterstützt                          |
| Link-Vorschauen             | ⚠️ Unzuverlässig für Marketplace-Bots   |
| Reaktionen                  | ❌ Nicht unterstützt                    |
| Sticker                     | ⚠️ Keine Agent-Antwort für Marketplace-Bots |
| Sprachnotizen / Audio / Video | ⚠️ Keine Agent-Antwort für Marketplace-Bots |
| Dateianhänge                | ⚠️ Keine Agent-Antwort für Marketplace-Bots |
| Threads                     | ❌ Nicht unterstützt                    |
| Polls                       | ❌ Nicht unterstützt                    |
| Native Befehle              | ❌ Nicht unterstützt                    |
| Streaming                   | ⚠️ Blockiert (Limit von 2000 Zeichen)  |

## Zustellziele (CLI/Cron)

- Verwenden Sie eine Chat-ID als Ziel.
- Beispiel: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Fehlerbehebung

**Bot antwortet nicht:**

- Prüfen Sie, ob das Token gültig ist: `openclaw channels status --probe`
- Verifizieren Sie, dass der Absender genehmigt ist (Pairing oder allowFrom)
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`

**Webhook empfängt keine Ereignisse:**

- Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet
- Verifizieren Sie, dass das Secret-Token 8-256 Zeichen lang ist
- Bestätigen Sie, dass der Gateway-HTTP-Endpunkt auf dem konfigurierten Pfad erreichbar ist
- Prüfen Sie, dass `getUpdates`-Polling nicht läuft (beides schließt sich gegenseitig aus)

## Konfigurationsreferenz (Zalo)

Vollständige Konfiguration: [Konfiguration](/gateway/configuration)

Die flachen Top-Level-Schlüssel (`channels.zalo.botToken`, `channels.zalo.dmPolicy` und ähnliche) sind eine Legacy-Kurzform für einen einzelnen Account. Für neue Konfigurationen sollten Sie `channels.zalo.accounts.<id>.*` bevorzugen. Beide Formen sind hier weiterhin dokumentiert, weil sie im Schema vorhanden sind.

Provider-Optionen:

- `channels.zalo.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.zalo.botToken`: Bot-Token von der Zalo Bot Platform.
- `channels.zalo.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.zalo.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`. Der Assistent fragt nach numerischen IDs.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist). In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) für das aktuelle Verhalten von Marketplace-Bots.
- `channels.zalo.groupAllowFrom`: Allowlist für Gruppenabsender (Benutzer-IDs). Greift auf `allowFrom` zurück, wenn nicht gesetzt.
- `channels.zalo.mediaMaxMb`: Limit für eingehende/ausgehende Medien (MB, Standard 5).
- `channels.zalo.webhookUrl`: Webhook-Modus aktivieren (HTTPS erforderlich).
- `channels.zalo.webhookSecret`: Webhook-Secret (8-256 Zeichen).
- `channels.zalo.webhookPath`: Webhook-Pfad auf dem Gateway-HTTP-Server.
- `channels.zalo.proxy`: Proxy-URL für API-Anfragen.

Multi-Account-Optionen:

- `channels.zalo.accounts.<id>.botToken`: Token pro Account.
- `channels.zalo.accounts.<id>.tokenFile`: reguläre Token-Datei pro Account. Symlinks werden abgelehnt.
- `channels.zalo.accounts.<id>.name`: Anzeigename.
- `channels.zalo.accounts.<id>.enabled`: Account aktivieren/deaktivieren.
- `channels.zalo.accounts.<id>.dmPolicy`: DM-Richtlinie pro Account.
- `channels.zalo.accounts.<id>.allowFrom`: Allowlist pro Account.
- `channels.zalo.accounts.<id>.groupPolicy`: Gruppenrichtlinie pro Account. In der Konfiguration vorhanden; siehe [Fähigkeiten](#capabilities) und [Zugriffskontrolle (Gruppen)](#access-control-groups) für das aktuelle Verhalten von Marketplace-Bots.
- `channels.zalo.accounts.<id>.groupAllowFrom`: Allowlist für Gruppenabsender pro Account.
- `channels.zalo.accounts.<id>.webhookUrl`: Webhook-URL pro Account.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook-Secret pro Account.
- `channels.zalo.accounts.<id>.webhookPath`: Webhook-Pfad pro Account.
- `channels.zalo.accounts.<id>.proxy`: Proxy-URL pro Account.

## Verwandt

- [Kanäle im Überblick](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
