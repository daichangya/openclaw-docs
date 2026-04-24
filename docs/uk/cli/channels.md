---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналу або переглядати журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-04-24T03:15:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і їхнім станом виконання в Gateway.

Пов’язана документація:

- Посібники з каналів: [Канали](/uk/channels/index)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)

## Поширені команди

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Стан / можливості / зіставлення / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це шлях живої перевірки: на доступному gateway команда запускає для кожного облікового запису перевірки `probeAccount` і, за потреби, `auditAccount`, тож вивід може містити стан транспорту, а також результати перевірки, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо gateway недоступний, `channels status` повертається до зведень лише на основі конфігурації замість виводу живої перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Порада: `openclaw channels add --help` показує прапорці для кожного каналу окремо (token, private key, app token, шляхи signal-cli тощо).

Поширені поверхні неінтерактивного додавання включають:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для auth облікового запису за замовчуванням через env, де це підтримується

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані назви для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язку зараз, майстер запитає, якому агенту має належати кожен налаштований обліковий запис каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Ви також можете керувати тими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [agents](/uk/cli/agents)).

Коли ви додаєте неосновний обліковий запис до каналу, який іще використовує налаштування верхнього рівня для одного облікового запису, OpenClaw переносить значення верхнього рівня з областю дії облікового запису до мапи облікових записів каналу перед записом нового облікового запису. Для більшості каналів ці значення потрапляють до `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний перенесений обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається узгодженою:

- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають основному обліковому запису.
- `channels add` не створює автоматично та не переписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може за бажанням додати прив’язки з областю дії облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (є іменовані облікові записи, а значення верхнього рівня для одного облікового запису все ще задані), виконайте `openclaw doctor --fix`, щоб перемістити значення з областю дії облікового запису до перенесеного облікового запису, вибраного для цього каналу. Для більшості каналів перенесення виконується до `accounts.default`; Matrix може зберегти наявну іменовану/основну ціль замість цього.

## Вхід / вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Примітки:

- `channels login` підтримує `--verbose`.
- `channels login` / `logout` можуть визначити канал автоматично, якщо налаштовано лише одну підтримувану ціль входу.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для покрокового виправлення.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → для знімка використання потрібна область дії `user:profile`. Використайте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише на основі конфігурації, якщо gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, цей обліковий запис позначається як налаштований із примітками про деградацію, а не як не налаштований.

## Перевірка можливостей

Отримайте підказки про можливості провайдера (intents/scopes, де доступно) разом зі статичною підтримкою функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; без нього буде показано кожен канал (включно з extensions).
- `--account` дійсний лише з `--channel`.
- `--target` приймає `channel:<id>` або сирий числовий ідентифікатор каналу й застосовується лише до Discord.
- Перевірки залежать від провайдера: Discord intents + необов’язкові дозволи каналу; Slack bot + user scopes; прапорці Telegram bot + Webhook; версія демона Signal; Microsoft Teams app token + ролі/області дії Graph (де відомо, з відповідними позначками). Канали без перевірок повідомляють `Probe: unavailable`.

## Зіставлення імен з ID

Зіставляйте назви каналів/користувачів з ID за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- За наявності кількох записів з однаковою назвою зіставлення віддає перевагу активним збігам.
- `channels resolve` працює лише на читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але цей обліковий запис недоступний у поточному шляху команди, команда повертає нерозв’язані результати з деградацією та примітками замість переривання всього виконання.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
