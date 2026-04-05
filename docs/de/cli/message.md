---
read_when:
    - Hinzufügen oder Ändern von CLI-Aktionen für Nachrichten
    - Ändern des Verhaltens ausgehender Kanäle
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: message
x-i18n:
    generated_at: "2026-04-05T12:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Ein einzelner ausgehender Befehl zum Senden von Nachrichten und für Kanalaktionen
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
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Erwähnung; rohe numerische IDs werden als Kanäle behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (eine rohe Kanal-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (bloße IDs werden als Kanäle behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namensauflösung:

- Bei unterstützten Providern (Discord/Slack/usw.) werden Kanalnamen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Miss versucht OpenClaw eine Live-Verzeichnisabfrage, wenn der Provider dies unterstützt.

## Häufige Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Zielkanal oder Benutzer für send/poll/read/usw.)
- `--targets <name>` (wiederholt; nur Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Kanal-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung ist nach Möglichkeit auf das aktive Aktionsziel begrenzt:
  - kanalbezogen, wenn `--channel` gesetzt ist (oder aus präfigierten Zielen wie `discord:...` abgeleitet wird)
  - kontobezogen, wenn `--account` gesetzt ist (kanalglobale + Oberflächen des ausgewählten Kontos)
  - wenn `--account` weggelassen wird, erzwingt OpenClaw keinen SecretRef-Bereich für ein `default`-Konto
- Nicht aufgelöste SecretRefs in nicht betroffenen Kanälen blockieren keine gezielte Nachrichtenaktion.
- Wenn der SecretRef des ausgewählten Kanals/Kontos nicht aufgelöst wird, schlägt der Befehl für diese Aktion fail-closed fehl.

## Aktionen

### Kern

- `send`
  - Kanäle: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target`, plus `--message` oder `--media`
  - Optional: `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gemeinsame interaktive Payloads: `--interactive` sendet eine kanalnative interaktive JSON-Payload, wenn unterstützt
  - Nur Telegram: `--buttons` (erfordert `channels.telegram.capabilities.inlineButtons`, damit es erlaubt ist)
  - Nur Telegram: `--force-document` (Bilder und GIFs als Dokumente senden, um Telegram-Komprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forenthemen-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Nur Discord: `--components`-JSON-Payload
  - Adaptive-Card-Kanäle: `--card`-JSON-Payload, wenn unterstützt
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`

- `poll`
  - Kanäle: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholt)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanäle: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (lassen Sie `--emoji` weg, um eigene Reaktionen zu löschen, wo unterstützt; siehe /tools/reactions)
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
  - Optional: `--channel-id`, `--channel-ids` (wiederholt), `--author-id`, `--author-ids` (wiederholt), `--limit`

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
  - Optional: `--role-ids` (wiederholt)

### Sticker

- `sticker send`
  - Kanäle: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholt)
  - Optional: `--message`

- `sticker upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Kanäle / Mitglieder / Voice

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

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; lassen Sie beide weg, um das Timeout zu löschen)
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

Eine Discord-Nachricht mit Komponenten senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Siehe [Discord-Komponenten](/channels/discord#interactive-components) für das vollständige Schema.

Eine gemeinsame interaktive Payload senden:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Eine Discord-Umfrage erstellen:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Eine Telegram-Umfrage erstellen (automatisches Schließen nach 2 Minuten):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
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
  --poll-question "Lunch?" \
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

Telegram-Inline-Buttons senden:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Ein Teams-Adaptive-Card senden:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Ein Telegram-Bild als Dokument senden, um Komprimierung zu vermeiden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
