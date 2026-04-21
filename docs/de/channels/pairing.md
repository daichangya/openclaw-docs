---
read_when:
    - Einrichten der DM-Zugriffskontrolle
    - Ein neues iOS-/Android-Node koppeln
    - Sicherheitsstatus von OpenClaw überprüfen
summary: 'Überblick zur Kopplung: Genehmigen, wer dir DMs senden kann + welche Nodes beitreten können'
title: Kopplung
x-i18n:
    generated_at: "2026-04-21T06:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Kopplung

„Kopplung“ ist der explizite Schritt der **Freigabe durch den Eigentümer** in OpenClaw.
Sie wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis du sie freigibst.

Die Standard-DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder freigegeben wird.

### Einen Absender freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wo der Status gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Speicher der freigegebenen Zulassungsliste:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Kontobereichszuordnung:

- Nicht-Standardkonten lesen/schreiben nur ihre bereichsbezogene Zulassungsliste.
- Das Standardkonto verwendet die kanalspezifische, nicht bereichsbezogene Zulassungsliste.

Behandle diese Dateien als sensibel (sie steuern den Zugriff auf deinen Assistenten).

Wichtig: Dieser Speicher gilt für den DM-Zugriff. Die Autorisierung für Gruppen ist separat.
Die Freigabe eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppenbefehle auszuführen oder den Bot in Gruppen zu steuern. Für Gruppenzugriff konfiguriere die expliziten Gruppen-Zulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängig Überschreibungen pro Gruppe/pro Thema).

## 2) Kopplung von Node-Geräten (iOS-/Android-/macOS-/headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Geräte-Kopplungsanfrage, die freigegeben werden muss.

### Über Telegram koppeln (empfohlen für iOS)

Wenn du das Plugin `device-pair` verwendest, kannst du die erstmalige Geräte-Kopplung vollständig über Telegram durchführen:

1. Sende deinem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anweisungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (leicht in Telegram zu kopieren/einzufügen).
3. Öffne auf deinem Telefon die OpenClaw iOS-App → Einstellungen → Gateway.
4. Füge den Einrichtungscode ein und stelle die Verbindung her.
5. Zurück in Telegram: `/pair pending` (Request-IDs, Rolle und Bereiche prüfen), dann freigeben.

Der Einrichtungscode ist eine base64-kodierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token enthält das integrierte Bootstrap-Profil für die Kopplung:

- das primär übergebene `node`-Token bleibt `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Zulassungsliste begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Bereichsprüfungen sind rollenpräfixiert, nicht ein einzelner flacher Bereichspool:
  Bereichseinträge für Operator erfüllen nur Operator-Anfragen, und Rollen, die keine Operatoren sind,
  müssen weiterhin Bereiche unter ihrem eigenen Rollenpräfix anfordern

Behandle den Einrichtungscode wie ein Passwort, solange er gültig ist.

### Ein Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel mit anderer
Rolle/Bereichen/öffentlichem Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

Wichtig: Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff. Wenn es
sich erneut verbindet und mehr Bereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die
bestehende Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwende
`openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu
angeforderten Zugriff zu vergleichen, bevor du freigibst.

### Statusspeicherung für die Node-Kopplung

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die veraltete API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) ist ein
  separater, Gateway-eigener Kopplungsspeicher. WS-Nodes benötigen weiterhin die Geräte-Kopplung.
- Der Kopplungseintrag ist die dauerhafte Quelle der Wahrheit für freigegebene Rollen. Aktive
  Geräte-Tokens bleiben auf diesen freigegebenen Rollensatz begrenzt; ein verirrter Token-Eintrag
  außerhalb der freigegebenen Rollen schafft keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (veraltet): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
