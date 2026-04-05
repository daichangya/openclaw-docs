---
read_when:
    - Beim Einrichten der DM-Zugriffskontrolle
    - Beim Koppeln eines neuen iOS-/Android-Node
    - Beim Prüfen der Sicherheitslage von OpenClaw
summary: 'Überblick über die Kopplung: Genehmigen, wer Ihnen DMs senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-04-05T12:35:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Kopplung

„Kopplung“ ist der explizite Schritt zur **Eigentümergenehmigung** in OpenClaw.
Er wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Security](/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Die Standard-DM-Richtlinien sind dokumentiert unter: [Security](/gateway/security)

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wo der Zustand gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Genehmigter Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Kontoabgrenzung:

- Nicht-Standardkonten lesen/schreiben nur ihre abgegrenzte Allowlist-Datei.
- Das Standardkonto verwendet die kanalbezogene, nicht abgegrenzte Allowlist-Datei.

Behandeln Sie diese Daten als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

Wichtig: Dieser Speicher ist für den DM-Zugriff. Gruppenautorisierung ist davon getrennt.
Das Genehmigen eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppenbefehle auszuführen oder den Bot in Gruppen zu steuern. Für Gruppenzugriff konfigurieren Sie die expliziten Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängig Überschreibungen pro Gruppe/pro Topic).

## 2) Kopplung von Node-Geräten (iOS-/Android-/macOS-/headless Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Anfrage zur Gerätekopplung, die genehmigt werden muss.

### Über Telegram koppeln (empfohlen für iOS)

Wenn Sie das Plugin `device-pair` verwenden, können Sie die erstmalige Gerätekopplung vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anweisungsnachricht und einer separaten Nachricht mit dem **Setup-Code** (leicht in Telegram zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw iOS-App → Einstellungen → Gateway.
4. Fügen Sie den Setup-Code ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (prüfen Sie Anfrage-IDs, Rolle und Scopes), dann genehmigen.

Der Setup-Code ist eine base64-kodierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die WebSocket-URL des Gateway (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Bootstrap-Profil für die Kopplung:

- das primär übergebene `node`-Token bleibt `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Prüfungen von Bootstrap-Scopes sind rollenpräfigiert, nicht ein einziger gemeinsamer Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Rollen, die keine Operatoren sind,
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern

Behandeln Sie den Setup-Code wie ein Passwort, solange er gültig ist.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät den Vorgang mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel mit anderer Rolle/anderen Scopes/anderem öffentlichem Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.

### Speicherung des Node-Kopplungszustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die veraltete API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) ist ein
  separater, Gateway-eigener Kopplungsspeicher. WS-Nodes benötigen weiterhin eine Gerätekopplung.
- Der Kopplungseintrag ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollenmenge begrenzt; ein einzelner Token-Eintrag
  außerhalb der genehmigten Rollen schafft keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Security](/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Updating](/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (veraltet): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
