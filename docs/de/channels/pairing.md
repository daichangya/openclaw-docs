---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Ein neues iOS-/Android-Node koppeln
    - OpenClaw-Sicherheitshaltung prüfen
summary: 'Pairing-Übersicht: genehmigen, wer Ihnen DMs senden darf und welche Nodes beitreten können'
title: Pairing
x-i18n:
    generated_at: "2026-04-24T06:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

„Pairing“ ist der explizite Schritt zur **Eigentümergenehmigung** in OpenClaw.
Er wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Die Standard-DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wo der Status gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Speicher für genehmigte Allowlist:
  - Standard-Account: `<channel>-allowFrom.json`
  - Nicht-Standard-Account: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Account-Bereichszuordnung:

- Nicht-Standard-Accounts lesen/schreiben nur ihre bereichsbezogene Allowlist-Datei.
- Der Standard-Account verwendet die nicht bereichsbezogene kanalbezogene Allowlist-Datei.

Behandeln Sie diese Dateien als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

Wichtig: Dieser Speicher ist für den DM-Zugriff. Die Gruppenautorisierung ist davon getrennt.
Das Genehmigen eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle auszuführen oder den Bot in Gruppen zu steuern. Für Gruppenzugriff konfigurieren Sie die expliziten Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder je nach Kanal gruppen-/themenspezifische Überschreibungen).

## 2) Pairing von Node-Geräten (iOS-/Android-/macOS-/headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die genehmigt werden muss.

### Pairing über Telegram (empfohlen für iOS)

Wenn Sie das Plugin `device-pair` verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten **Einrichtungscode**-Nachricht (leicht in Telegram zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (prüfen Sie Anfrage-IDs, Rolle und Bereiche), dann genehmigen.

Der Einrichtungscode ist eine Base64-kodierte JSON-Payload, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den anfänglichen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Bootstrap-Profil für Pairing:

- das primär weitergereichte `node`-Token bleibt `scopes: []`
- jedes weitergereichte `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Prüfungen der Bootstrap-Bereiche sind rollenpräfixiert, nicht ein einziger flacher Bereichspool:
  Bereichseinträge für Operatoren erfüllen nur Operator-Anfragen, und Rollen, die keine Operatoren sind,
  müssen weiterhin Bereiche unter ihrem eigenen Rollenpräfix anfordern

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel andere
Rolle/Bereiche/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

Wichtig: Ein bereits gepairtes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es
sich erneut verbindet und mehr Bereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die
bestehende Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie
`openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.

### Speicherung des Node-Pairing-Status

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gepairte Geräte + Tokens)

### Hinweise

- Die Legacy-API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) ist ein
  separater Gateway-eigener Pairing-Speicher. WS-Nodes erfordern weiterhin Geräte-Pairing.
- Der Pairing-Datensatz ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollenmenge begrenzt; ein abweichender Token-Eintrag
  außerhalb der genehmigten Rollen schafft keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (Legacy): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
