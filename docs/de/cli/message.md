---
read_when:
    - Hinzufügen oder Ändern von Nachricht-CLI-Aktionen
    - Ändern des ausgehenden Kanalverhaltens
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Message
x-i18n:
    generated_at: "2026-04-24T06:31:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Einzelner ausgehender Befehl zum Senden von Nachrichten und Kanalaktionen
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Verwendung

```
openclaw message <subcommand> [flags]
```

Kanalauswahl:

- `--channel` ist erforderlich, wenn mehr als ein Kanal konfiguriert ist.
- Wenn genau ein Kanal konfiguriert ist, wird er zum Standard.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost erfordert ein Plugin)

Zielformate (`--target`):

- WhatsApp: E.164 oder Gruppen-JID
- Telegram: Chat-ID oder `@username`
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Mention; rohe numerische IDs werden als Kanäle behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (rohe Kanal-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (unpräfixierte IDs werden als Kanäle behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namensauflösung:

- Bei unterstützten Providern (Discord/Slack/etc.) werden Kanalnamen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Fehlschlag versucht OpenClaw eine Live-Verzeichnisabfrage, wenn der Provider dies unterstützt.

## Häufige Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Zielkanal oder Benutzer für send/poll/read/etc.)
- `--targets <name>` (wiederholbar; nur Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Kanal-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung wird nach Möglichkeit auf das aktive Aktionsziel begrenzt:
  - kanalbezogen, wenn `--channel` gesetzt ist (oder aus präfixierten Zielen wie `discord:...` abgeleitet wird)
  - kontobezogen, wenn `--account` gesetzt ist (kanalweite Globals + Oberflächen des ausgewählten Kontos)
  - wenn `--account` weggelassen wird, erzwingt OpenClaw keinen SecretRef-Bereich für ein `default`-Konto
- Nicht aufgelöste SecretRefs auf nicht betroffenen Kanälen blockieren eine gezielte Nachrichtenaktion nicht.
- Wenn der SecretRef des ausgewählten Kanals/Kontos nicht aufgelöst werden kann, schlägt der Befehl für diese Aktion geschlossen fehl.

## Aktionen

### Core

- `send`
  - Kanäle: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target` sowie `--message`, `--media` oder `--presentation`
  - Optional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gemeinsame Presentation-Payloads: `--presentation` sendet semantische Blöcke (`text`, `context`, `divider`, `buttons`, `select`), die der Core über die deklarierten Fähigkeiten des ausgewählten Kanals rendert. Siehe [Message Presentation](/de/plugins/message-presentation).
  - Generische Zustellungspräferenzen: `--delivery` akzeptiert Zustellungshinweise wie `{ "pin": true }`; `--pin` ist die Kurzform für angeheftete Zustellung, wenn der Kanal dies unterstützt.
  - Nur Telegram: `--force-document` (Bilder und GIFs als Dokumente senden, um Telegram-Komprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forum-Topic-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`

- `poll`
  - Kanäle: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholbar)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5–600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanäle: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (lassen Sie `--emoji` weg, um eigene Reaktionen zu löschen, sofern unterstützt; siehe /tools/reactions)
  - Nur WhatsApp: `--participant`, `--from-me`
  - Reaktionen in Signal-Gruppen: `--target-author` oder `--target-author-uuid` erforderlich

- `reactions`
  - Kanäle: Discord/Google Chat/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--target`
  - Optional: `--limit`, `--before`, `--after`
  - Nur Discord: `--around`

- `edit`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--message`, `--target`

- `delete`
  - Kanäle: Discord/Slack/Telegram/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pins` (auflisten)
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--target`

- `permissions`
  - Kanäle: Discord/Matrix
  - Erforderlich: `--target`
  - Nur Matrix: verfügbar, wenn Matrix-Verschlüsselung aktiviert ist und Verifizierungsaktionen erlaubt sind

- `search`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--query`
  - Optional: `--channel-id`, `--channel-ids` (wiederholbar), `--author-id`, `--author-ids` (wiederholbar), `--limit`

### Threads

- `thread create`
  - Kanäle: Discord
  - Erforderlich: `--thread-name`, `--target` (Kanal-ID)
  - Optional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`
  - Optional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanäle: Discord
  - Erforderlich: `--target` (Thread-ID), `--message`
  - Optional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: keine zusätzlichen Flags

- `emoji upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--emoji-name`, `--media`
  - Optional: `--role-ids` (wiederholbar)

### Sticker

- `sticker send`
  - Kanäle: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholbar)
  - Optional: `--message`

- `sticker upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Kanäle / Mitglieder / Sprache

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` für Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Ereignisse

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Optional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; lassen Sie beide weg, um den Timeout zu löschen)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` unterstützt auch `--reason`

### Broadcast

- `broadcast`
  - Kanäle: jeder konfigurierte Kanal; verwenden Sie `--channel all`, um alle Provider anzusprechen
  - Erforderlich: `--targets <target...>`
  - Optional: `--message`, `--media`, `--dry-run`

## Beispiele

Eine Discord-Antwort senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Eine Nachricht mit semantischen Buttons senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Wählen Sie:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Genehmigen","value":"approve","style":"success"},{"label":"Ablehnen","value":"decline","style":"danger"}]}]}'
```

Der Core rendert dieselbe `presentation`-Payload je nach Kanalfähigkeit in Discord-Komponenten, Slack-Blöcke, Telegram-Inline-Buttons, Mattermost-Props oder Teams-/Feishu-Karten. Den vollständigen Vertrag und die Fallback-Regeln finden Sie unter [Message Presentation](/de/plugins/message-presentation).

Eine umfangreichere Presentation-Payload senden:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Wählen Sie:" \
  --presentation '{"title":"Freigabe für Bereitstellung","tone":"warning","blocks":[{"type":"text","text":"Wählen Sie einen Pfad"},{"type":"buttons","buttons":[{"label":"Genehmigen","value":"approve"},{"label":"Ablehnen","value":"decline"}]}]}'
```

Eine Discord-Umfrage erstellen:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Eine Telegram-Umfrage erstellen (schließt automatisch in 2 Minuten):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Mittagessen?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Eine proaktive Teams-Nachricht senden:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Eine Teams-Umfrage erstellen:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Mittagessen?" \
  --poll-option Pizza --poll-option Sushi
```

In Slack reagieren:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

In einer Signal-Gruppe reagieren:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram-Inline-Buttons über generische Presentation senden:

```
openclaw message send --channel telegram --target @mychat --message "Wählen Sie:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Ja","value":"cmd:yes"},{"label":"Nein","value":"cmd:no"}]}]}'
```

Eine Teams-Karte über generische Presentation senden:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Statusaktualisierung","blocks":[{"type":"text","text":"Build abgeschlossen"}]}'
```

Ein Telegram-Bild als Dokument senden, um Komprimierung zu vermeiden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agent send](/de/tools/agent-send)
