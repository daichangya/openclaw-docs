---
read_when:
    - Dodawanie lub modyfikowanie działań CLI wiadomości
    - Zmiana zachowania kanału wychodzącego
summary: Dokumentacja CLI dla `openclaw message` (wysyłanie + działania kanału)
title: message
x-i18n:
    generated_at: "2026-04-23T09:58:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Pojedyncza komenda wychodząca do wysyłania wiadomości i działań kanału
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Użycie

```
openclaw message <subcommand> [flags]
```

Wybór kanału:

- `--channel` jest wymagane, jeśli skonfigurowano więcej niż jeden kanał.
- Jeśli skonfigurowano dokładnie jeden kanał, staje się on domyślny.
- Wartości: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost wymaga plugin)

Formaty celu (`--target`):

- WhatsApp: E.164 lub grupowy JID
- Telegram: chat id lub `@username`
- Discord: `channel:<id>` lub `user:<id>` (lub wzmianka `<@id>`; surowe numeryczne id są traktowane jako kanały)
- Google Chat: `spaces/<spaceId>` lub `users/<userId>`
- Slack: `channel:<id>` lub `user:<id>` (surowe id kanału jest akceptowane)
- Mattermost (plugin): `channel:<id>`, `user:<id>` lub `@username` (same id są traktowane jako kanały)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` lub `username:<name>`/`u:<name>`
- iMessage: uchwyt, `chat_id:<id>`, `chat_guid:<guid>` lub `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` lub `#alias:server`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) lub `conversation:<id>` albo `user:<aad-object-id>`

Wyszukiwanie nazw:

- Dla obsługiwanych dostawców (Discord/Slack/itp.) nazwy kanałów, takie jak `Help` lub `#help`, są rozwiązywane przez cache katalogu.
- Przy braku trafienia w cache OpenClaw spróbuje wyszukiwania katalogu na żywo, jeśli dostawca to obsługuje.

## Wspólne flagi

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (docelowy kanał lub użytkownik dla send/poll/read/itp.)
- `--targets <name>` (powtarzalne; tylko broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Zachowanie SecretRef

- `openclaw message` rozwiązuje obsługiwane SecretRefs kanału przed wykonaniem wybranego działania.
- Rozwiązywanie jest ograniczane do aktywnego celu działania, gdy to możliwe:
  - do kanału, gdy ustawiono `--channel` (lub wywnioskowano z celów z prefiksem, takich jak `discord:...`)
  - do konta, gdy ustawiono `--account` (globalne powierzchnie kanału + powierzchnie wybranego konta)
  - gdy pominięto `--account`, OpenClaw nie wymusza zakresu SecretRef dla konta `default`
- Nierozwiązane SecretRefs w niepowiązanych kanałach nie blokują ukierunkowanego działania wiadomości.
- Jeśli SecretRef wybranego kanału/konta nie da się rozwiązać, komenda kończy się bezpieczną odmową dla tego działania.

## Działania

### Główne

- `send`
  - Kanały: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wymagane: `--target` oraz `--message`, `--media` lub `--presentation`
  - Opcjonalne: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Współdzielone ładunki presentation: `--presentation` wysyła semantyczne bloki (`text`, `context`, `divider`, `buttons`, `select`), które rdzeń renderuje przez zadeklarowane możliwości wybranego kanału. Zobacz [Message Presentation](/pl/plugins/message-presentation).
  - Ogólne preferencje dostarczania: `--delivery` akceptuje wskazówki dostarczenia, takie jak `{ "pin": true }`; `--pin` to skrót dla przypiętego dostarczenia, gdy kanał to obsługuje.
  - Tylko Telegram: `--force-document` (wysyła obrazy i GIF-y jako dokumenty, aby uniknąć kompresji Telegrama)
  - Tylko Telegram: `--thread-id` (id tematu forum)
  - Tylko Slack: `--thread-id` (znacznik czasu wątku; `--reply-to` używa tego samego pola)
  - Telegram + Discord: `--silent`
  - Tylko WhatsApp: `--gif-playback`

- `poll`
  - Kanały: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wymagane: `--target`, `--poll-question`, `--poll-option` (powtarzalne)
  - Opcjonalne: `--poll-multi`
  - Tylko Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Tylko Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanały: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Uwaga: `--remove` wymaga `--emoji` (pomiń `--emoji`, aby wyczyścić własne reakcje tam, gdzie jest to obsługiwane; zobacz /tools/reactions)
  - Tylko WhatsApp: `--participant`, `--from-me`
  - Reakcje grupowe Signal: wymagane `--target-author` lub `--target-author-uuid`

- `reactions`
  - Kanały: Discord/Google Chat/Slack/Matrix
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--limit`

- `read`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--target`
  - Opcjonalne: `--limit`, `--before`, `--after`
  - Tylko Discord: `--around`

- `edit`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--message-id`, `--message`, `--target`

- `delete`
  - Kanały: Discord/Slack/Telegram/Matrix
  - Wymagane: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--message-id`, `--target`

- `pins` (lista)
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--target`

- `permissions`
  - Kanały: Discord/Matrix
  - Wymagane: `--target`
  - Tylko Matrix: dostępne, gdy szyfrowanie Matrix jest włączone i działania weryfikacyjne są dozwolone

- `search`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--query`
  - Opcjonalne: `--channel-id`, `--channel-ids` (powtarzalne), `--author-id`, `--author-ids` (powtarzalne), `--limit`

### Wątki

- `thread create`
  - Kanały: Discord
  - Wymagane: `--thread-name`, `--target` (id kanału)
  - Opcjonalne: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanały: Discord
  - Wymagane: `--guild-id`
  - Opcjonalne: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanały: Discord
  - Wymagane: `--target` (id wątku), `--message`
  - Opcjonalne: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: bez dodatkowych flag

- `emoji upload`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--emoji-name`, `--media`
  - Opcjonalne: `--role-ids` (powtarzalne)

### Naklejki

- `sticker send`
  - Kanały: Discord
  - Wymagane: `--target`, `--sticker-id` (powtarzalne)
  - Opcjonalne: `--message`

- `sticker upload`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Role / Kanały / Członkowie / Głos

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` dla Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Zdarzenia

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcjonalne: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderacja (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcjonalnie `--duration-min` lub `--until`; pomiń oba, aby wyczyścić timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` obsługuje także `--reason`

### Broadcast

- `broadcast`
  - Kanały: dowolny skonfigurowany kanał; użyj `--channel all`, aby kierować do wszystkich dostawców
  - Wymagane: `--targets <target...>`
  - Opcjonalne: `--message`, `--media`, `--dry-run`

## Przykłady

Wyślij odpowiedź na Discordzie:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Wyślij wiadomość z semantycznymi przyciskami:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Rdzeń renderuje ten sam ładunek `presentation` do komponentów Discorda, bloków Slacka, przycisków inline Telegrama, właściwości Mattermost lub kart Teams/Feishu, zależnie od możliwości kanału. Zobacz [Message Presentation](/pl/plugins/message-presentation), aby poznać pełny kontrakt i reguły fallback.

Wyślij bogatszy ładunek presentation:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Utwórz ankietę Discorda:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Utwórz ankietę Telegrama (automatyczne zamknięcie po 2 minutach):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Wyślij proaktywną wiadomość Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Utwórz ankietę Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Dodaj reakcję w Slacku:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Dodaj reakcję w grupie Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Wyślij przyciski inline Telegrama przez ogólne presentation:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Wyślij kartę Teams przez ogólne presentation:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Wyślij obraz Telegrama jako dokument, aby uniknąć kompresji:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
