---
read_when:
    - Ви хочете підключити OpenClaw до каналів IRC або особистих повідомлень
    - Ви налаштовуєте списки дозволу IRC, групову політику або gating згадувань
summary: Налаштування plugin IRC, керування доступом і усунення несправностей
title: IRC
x-i18n:
    generated_at: "2026-04-05T17:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Використовуйте IRC, якщо хочете підключити OpenClaw до класичних каналів (`#room`) і особистих повідомлень.
IRC постачається як extension plugin, але налаштовується в основному конфігу в розділі `channels.irc`.

## Швидкий старт

1. Увімкніть конфігурацію IRC в `~/.openclaw/openclaw.json`.
2. Задайте щонайменше:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Для координації ботів краще використовувати приватний сервер IRC. Якщо ви свідомо використовуєте публічну мережу IRC, поширені варіанти включають Libera.Chat, OFTC і Snoonet. Уникайте передбачуваних публічних каналів для трафіку бекчейну бота або рою.

3. Запустіть або перезапустіть gateway:

```bash
openclaw gateway run
```

## Типові налаштування безпеки

- `channels.irc.dmPolicy` типово має значення `"pairing"`.
- `channels.irc.groupPolicy` типово має значення `"allowlist"`.
- Якщо `groupPolicy="allowlist"`, задайте `channels.irc.groups`, щоб визначити дозволені канали.
- Використовуйте TLS (`channels.irc.tls=true`), якщо тільки ви свідомо не погоджуєтеся на передавання відкритим текстом.

## Керування доступом

Для каналів IRC є два окремі «бар’єри»:

1. **Доступ до каналу** (`groupPolicy` + `groups`): чи взагалі бот приймає повідомлення з каналу.
2. **Доступ відправника** (`groupAllowFrom` / `groups["#channel"].allowFrom` для окремого каналу): кому дозволено активувати бота в цьому каналі.

Ключі конфігурації:

- Список дозволу для особистих повідомлень (доступ відправника в DM): `channels.irc.allowFrom`
- Груповий список дозволу відправників (доступ відправника в каналі): `channels.irc.groupAllowFrom`
- Керування для окремих каналів (канал + відправник + правила згадувань): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` дозволяє неконфігуровані канали (**але типово все одно діє gating згадувань**)

Записи списку дозволу мають використовувати стабільні ідентичності відправника (`nick!user@host`).
Зіставлення лише за nick є змінним і вмикається лише коли `channels.irc.dangerouslyAllowNameMatching: true`.

### Поширена проблема: `allowFrom` призначений для DM, а не для каналів

Якщо ви бачите в логах щось на кшталт:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…це означає, що відправника не було дозволено для **групових повідомлень/повідомлень каналу**. Виправте це одним зі способів:

- задайте `channels.irc.groupAllowFrom` (глобально для всіх каналів), або
- задайте списки дозволу відправників для окремих каналів: `channels.irc.groups["#channel"].allowFrom`

Приклад (дозволити будь-кому в `#tuirc-dev` звертатися до бота):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Запуск відповіді (згадування)

Навіть якщо канал дозволено (через `groupPolicy` + `groups`) і відправника дозволено, OpenClaw типово використовує **gating згадувань** у групових контекстах.

Це означає, що ви можете бачити в логах щось на кшталт `drop channel … (missing-mention)`, якщо повідомлення не містить шаблон згадування, що збігається з ботом.

Щоб бот відповідав у каналі IRC **без потреби у згадуванні**, вимкніть gating згадувань для цього каналу:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Або щоб дозволити **всі** канали IRC (без списку дозволу для окремих каналів) і при цьому відповідати без згадувань:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Примітка щодо безпеки (рекомендовано для публічних каналів)

Якщо ви дозволяєте `allowFrom: ["*"]` у публічному каналі, будь-хто може надсилати запити боту.
Щоб зменшити ризик, обмежте інструменти для цього каналу.

### Однакові інструменти для всіх у каналі

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Різні інструменти для різних відправників (власник має більше можливостей)

Використовуйте `toolsBySender`, щоб застосувати суворішу політику до `"*"` і м’якшу — до вашого nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Ключі `toolsBySender` мають використовувати `id:` для значень ідентичності відправника IRC:
  `id:eigen` або `id:eigen!~eigen@174.127.248.171` для точнішого зіставлення.
- Застарілі ключі без префікса все ще приймаються і зіставляються лише як `id:`.
- Перемагає перша політика відправника, що збіглася; `"*"` — це резервний шаблон wildcard.

Докладніше про груповий доступ і gating згадувань (і про те, як вони взаємодіють), див.: [/channels/groups](/channels/groups).

## NickServ

Щоб пройти ідентифікацію через NickServ після підключення:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Необов’язкова одноразова реєстрація під час підключення:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Вимкніть `register` після реєстрації nick, щоб уникнути повторних спроб REGISTER.

## Змінні середовища

Типовий обліковий запис підтримує:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (розділені комами)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Усунення несправностей

- Якщо бот підключається, але ніколи не відповідає в каналах, перевірте `channels.irc.groups` **і** чи не відкидає повідомлення gating згадувань (`missing-mention`). Якщо ви хочете, щоб він відповідав без ping, задайте `requireMention:false` для каналу.
- Якщо вхід не вдається, перевірте доступність nick і пароль сервера.
- Якщо TLS не працює в кастомній мережі, перевірте host/port і налаштування сертифіката.

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і gating згадувань
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
