---
read_when:
    - Ви хочете підключити OpenClaw до каналів IRC або приватних повідомлень
    - Ви налаштовуєте списки дозволених IRC, групову політику або обмеження згадок
summary: Налаштування Plugin IRC, керування доступом і усунення неполадок
title: IRC
x-i18n:
    generated_at: "2026-04-23T07:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28d0929e1e3f882eca1ba46eeb5e3fa537baaebfedbe2cf4079946cd9b432c87
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Використовуйте IRC, коли хочете мати OpenClaw у класичних каналах (`#room`) і приватних повідомленнях.
IRC постачається як вбудований Plugin, але налаштовується в основній конфігурації в `channels.irc`.

## Швидкий старт

1. Увімкніть конфігурацію IRC у `~/.openclaw/openclaw.json`.
2. Встановіть щонайменше:

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

Надавайте перевагу приватному IRC-серверу для координації ботів. Якщо ви навмисно використовуєте публічну IRC-мережу, поширені варіанти включають Libera.Chat, OFTC і Snoonet. Уникайте передбачуваних публічних каналів для службового трафіку бота або swarm.

3. Запустіть/перезапустіть Gateway:

```bash
openclaw gateway run
```

## Типові налаштування безпеки

- `channels.irc.dmPolicy` типово має значення `"pairing"`.
- `channels.irc.groupPolicy` типово має значення `"allowlist"`.
- Якщо `groupPolicy="allowlist"`, задайте `channels.irc.groups`, щоб визначити дозволені канали.
- Використовуйте TLS (`channels.irc.tls=true`), якщо тільки ви навмисно не погоджуєтесь на незашифрований транспорт.

## Керування доступом

Для IRC-каналів є двоє окремих «воріт»:

1. **Доступ до каналу** (`groupPolicy` + `groups`): чи бот взагалі приймає повідомлення з каналу.
2. **Доступ відправника** (`groupAllowFrom` / `groups["#channel"].allowFrom` для окремого каналу): хто має право викликати бота всередині цього каналу.

Ключі конфігурації:

- Список дозволених для приватних повідомлень (доступ відправника в DM): `channels.irc.allowFrom`
- Список дозволених відправників у групах (доступ відправника в каналі): `channels.irc.groupAllowFrom`
- Керування для окремого каналу (канал + відправник + правила згадок): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` дозволяє неналаштовані канали (**але за замовчуванням усе одно вимагає згадку**)

Записи в allowlist мають використовувати стабільні ідентичності відправника (`nick!user@host`).
Зіставлення лише за nick є змінним і вмикається лише коли `channels.irc.dangerouslyAllowNameMatching: true`.

### Поширена пастка: `allowFrom` призначений для DM, а не для каналів

Якщо ви бачите журнали на кшталт:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…це означає, що відправник не був дозволений для **групових/канальних** повідомлень. Виправте це одним із способів:

- задайте `channels.irc.groupAllowFrom` (глобально для всіх каналів), або
- задайте списки дозволених відправників для окремих каналів: `channels.irc.groups["#channel"].allowFrom`

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

## Запуск відповіді (згадки)

Навіть якщо канал дозволений (через `groupPolicy` + `groups`) і відправник дозволений, у групових контекстах OpenClaw за замовчуванням застосовує **обмеження згадкою**.

Це означає, що ви можете бачити журнали на кшталт `drop channel … (missing-mention)`, якщо повідомлення не містить шаблон згадки, який відповідає боту.

Щоб бот відповідав в IRC-каналі **без потреби в згадці**, вимкніть обмеження згадкою для цього каналу:

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

Або щоб дозволити **усі** IRC-канали (без allowlist для окремих каналів) і водночас відповідати без згадок:

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
  `id:eigen` або `id:eigen!~eigen@174.127.248.171` для надійнішого зіставлення.
- Застарілі ключі без префікса все ще підтримуються і зіставляються лише як `id:`.
- Перша відповідна політика відправника має пріоритет; `"*"` є резервним шаблоном.

Докладніше про доступ у групах і обмеження згадкою (та їхню взаємодію) див.: [/channels/groups](/uk/channels/groups).

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

<Note>
`IRC_HOST` входить до списку блокування endpoint і не може задаватися з файлу
`.env` робочого простору. Він має надходити з середовища shell або середовища
процесу Gateway, щоб недовірені робочі простори не могли перенаправити IRC-трафік на
інший сервер. Повний список див. у [Файли `.env` робочого простору](/uk/gateway/security).
</Note>

## Усунення неполадок

- Якщо бот підключається, але ніколи не відповідає в каналах, перевірте `channels.irc.groups` **і** чи не відкидає повідомлення обмеження згадкою (`missing-mention`). Якщо ви хочете, щоб він відповідав без згадок, встановіть `requireMention:false` для каналу.
- Якщо вхід не вдається, перевірте доступність nick і пароль сервера.
- Якщо TLS не працює в нестандартній мережі, перевірте host/port і налаштування сертифіката.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація в DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
