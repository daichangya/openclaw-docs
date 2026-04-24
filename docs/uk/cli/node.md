---
read_when:
    - Запуск безголового хоста Node
    - Сполучення вузла не на macOS для system.run
summary: Довідка CLI для `openclaw node` (безголовий хост Node)
title: Node
x-i18n:
    generated_at: "2026-04-24T04:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 002412b2ca7d0ed301cc29480ba7323ddb68dc6656bd6b739afab8179fa71664
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Запустіть **безголовий хост Node**, який підключається до Gateway WebSocket і надає
`system.run` / `system.which` на цій машині.

## Навіщо використовувати хост node?

Використовуйте хост node, коли хочете, щоб агенти **виконували команди на інших машинах** у вашій
мережі без установлення там повноцінного супутнього застосунку macOS.

Поширені сценарії використання:

- Виконання команд на віддалених Linux/Windows-машинах (сервери збірки, лабораторні машини, NAS).
- Збереження **ізоляції** exec на gateway, але делегування схвалених запусків іншим хостам.
- Надання легковажної безголової цілі виконання для вузлів автоматизації або CI.

Виконання все одно захищене **погодженнями exec** та списками дозволу для кожного агента на
хості node, тож ви можете зберігати доступ до команд обмеженим і явним.

## Проксі браузера (нульова конфігурація)

Хости node автоматично оголошують проксі браузера, якщо `browser.enabled` не
вимкнено на node. Це дає агенту змогу використовувати автоматизацію браузера на цьому node
без додаткової конфігурації.

Типово проксі надає доступ до звичайної поверхні профілю браузера node. Якщо ви
встановите `nodeHost.browserProxy.allowProfiles`, проксі стане обмежувальним:
націлювання на профілі поза списком дозволу буде відхилено, а маршрути
створення/видалення постійних профілів буде заблоковано через проксі.

За потреби вимкніть його на node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Запуск (у передньому плані)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображуване ім’я node

## Автентифікація Gateway для хоста node

`openclaw node run` і `openclaw node install` визначають автентифікацію gateway із config/env (без прапорців `--token`/`--password` у командах node):

- Спочатку перевіряються `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Потім резервний варіант із локальної конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост node навмисно не успадковує `gateway.remote.token` / `gateway.remote.password`.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не визначено, визначення автентифікації node завершується за принципом fail closed (без маскувального резервного переходу на remote).
- У `gateway.mode=remote` поля remote client (`gateway.remote.token` / `gateway.remote.password`) також придатні відповідно до правил пріоритету remote.
- Визначення автентифікації хоста node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

## Служба (у фоновому режимі)

Установіть безголовий хост node як користувацьку службу.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Параметри:

- `--host <host>`: хост Gateway WebSocket (типово: `127.0.0.1`)
- `--port <port>`: порт Gateway WebSocket (типово: `18789`)
- `--tls`: використовувати TLS для з’єднання з gateway
- `--tls-fingerprint <sha256>`: очікуваний відбиток TLS-сертифіката (sha256)
- `--node-id <id>`: перевизначити ідентифікатор node (очищає токен сполучення)
- `--display-name <name>`: перевизначити відображуване ім’я node
- `--runtime <runtime>`: середовище виконання служби (`node` або `bun`)
- `--force`: перевстановити/перезаписати, якщо вже встановлено

Керування службою:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Використовуйте `openclaw node run` для запуску хоста node у передньому плані (без служби).

Команди служби підтримують `--json` для машинозчитуваного виводу.

## Сполучення

Перше з’єднання створює в Gateway запит на сполучення пристрою в стані очікування (`role: node`).
Схваліть його за допомогою:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо node повторює сполучення зі зміненими даними автентифікації (role/scopes/public key),
попередній запит у стані очікування замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Хост node зберігає свій ідентифікатор node, токен, відображуване ім’я та дані підключення до gateway у
`~/.openclaw/node.json`.

## Погодження exec

`system.run` контролюється локальними погодженнями exec:

- `~/.openclaw/exec-approvals.json`
- [Погодження exec](/uk/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (редагування з Gateway)

Для схваленого асинхронного exec node OpenClaw готує канонічний `systemRunPlan`
перед запитом погодження. Пізніше переспрямування схваленого `system.run` повторно використовує цей збережений
план, тому редагування полів command/cwd/session після створення запиту на погодження
відхиляються, а не змінюють те, що виконує node.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Nodes](/uk/nodes)
