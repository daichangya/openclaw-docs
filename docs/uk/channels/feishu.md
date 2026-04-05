---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд, можливості та конфігурація бота Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-05T17:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Бот Feishu

Feishu (Lark) — це платформа командного чату, яку компанії використовують для обміну повідомленнями та співпраці. Цей плагін підключає OpenClaw до бота Feishu/Lark за допомогою підписки платформи на події через WebSocket, щоб можна було отримувати повідомлення без відкриття публічного URL вебхука.

---

## Вбудований плагін

Feishu постачається в комплекті з поточними релізами OpenClaw, тому окремо
встановлювати плагін не потрібно.

Якщо ви використовуєте старішу збірку або власну інсталяцію, яка не містить
вбудованого Feishu, установіть його вручну:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Швидкий старт

Є два способи додати канал Feishu:

### Метод 1: онбординг (рекомендовано)

Якщо ви щойно встановили OpenClaw, запустіть онбординг:

```bash
openclaw onboard
```

Майстер проведе вас через такі кроки:

1. Створення застосунку Feishu і збір облікових даних
2. Налаштування облікових даних застосунку в OpenClaw
3. Запуск gateway

✅ **Після налаштування** перевірте стан gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Метод 2: налаштування через CLI

Якщо ви вже завершили початкове встановлення, додайте канал через CLI:

```bash
openclaw channels add
```

Виберіть **Feishu**, потім введіть App ID і App Secret.

✅ **Після налаштування** керуйте gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Крок 1: Створіть застосунок Feishu

### 1. Відкрийте платформу Feishu Open Platform

Перейдіть на [Feishu Open Platform](https://open.feishu.cn/app) і ввійдіть у систему.

Орендарі Lark (глобальні) мають використовувати [https://open.larksuite.com/app](https://open.larksuite.com/app) і встановити `domain: "lark"` у конфігурації Feishu.

### 2. Створіть застосунок

1. Натисніть **Create enterprise app**
2. Заповніть назву й опис застосунку
3. Виберіть піктограму застосунку

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Скопіюйте облікові дані

У розділі **Credentials & Basic Info** скопіюйте:

- **App ID** (формат: `cli_xxx`)
- **App Secret**

❗ **Важливо:** тримайте App Secret у таємниці.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Налаштуйте дозволи

У розділі **Permissions** натисніть **Batch import** і вставте:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Увімкніть можливість бота

У розділі **App Capability** > **Bot**:

1. Увімкніть можливість бота
2. Установіть ім’я бота

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Налаштуйте підписку на події

⚠️ **Важливо:** перед налаштуванням підписки на події переконайтеся, що:

1. Ви вже виконали `openclaw channels add` для Feishu
2. Gateway запущено (`openclaw gateway status`)

У розділі **Event Subscription**:

1. Виберіть **Use long connection to receive events** (WebSocket)
2. Додайте подію: `im.message.receive_v1`
3. (Необов’язково) Для робочих процесів із коментарями Drive також додайте: `drive.notice.comment_add_v1`

⚠️ Якщо gateway не запущено, налаштування long-connection може не зберегтися.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Опублікуйте застосунок

1. Створіть версію в **Version Management & Release**
2. Надішліть на перевірку та опублікуйте
3. Дочекайтеся схвалення адміністратора (застосунки підприємства зазвичай схвалюються автоматично)

---

## Крок 2: Налаштуйте OpenClaw

### Налаштування за допомогою майстра (рекомендовано)

```bash
openclaw channels add
```

Виберіть **Feishu** і вставте свої App ID + App Secret.

### Налаштування через файл конфігурації

Відредагуйте `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

Якщо ви використовуєте `connectionMode: "webhook"`, установіть і `verificationToken`, і `encryptKey`. Сервер вебхуків Feishu за замовчуванням прив’язується до `127.0.0.1`; установлюйте `webhookHost`, лише якщо вам навмисно потрібна інша адреса прив’язки.

#### Verification Token і Encrypt Key (режим webhook)

Під час використання режиму webhook установіть у конфігурації і `channels.feishu.verificationToken`, і `channels.feishu.encryptKey`. Щоб отримати ці значення:

1. У Feishu Open Platform відкрийте свій застосунок
2. Перейдіть до **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Відкрийте вкладку **Encryption** (加密策略)
4. Скопіюйте **Verification Token** і **Encrypt Key**

На знімку екрана нижче показано, де знайти **Verification Token**. **Encrypt Key** указано в тому самому розділі **Encryption**.

![Verification Token location](/images/feishu-verification-token.png)

### Налаштування через змінні середовища

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Домен Lark (глобальний)

Якщо ваш орендар працює в Lark (міжнародний), установіть домен `lark` (або повний рядок домену). Ви можете встановити його в `channels.feishu.domain` або для окремого облікового запису (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Прапорці оптимізації квот

Ви можете зменшити використання API Feishu за допомогою двох необов’язкових прапорців:

- `typingIndicator` (за замовчуванням `true`): якщо `false`, пропускаються виклики реакції набору тексту.
- `resolveSenderNames` (за замовчуванням `true`): якщо `false`, пропускаються виклики пошуку профілю відправника.

Установлюйте їх на верхньому рівні або для окремого облікового запису:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Крок 3: Запуск і тестування

### 1. Запустіть gateway

```bash
openclaw gateway
```

### 2. Надішліть тестове повідомлення

У Feishu знайдіть свого бота й надішліть повідомлення.

### 3. Схваліть pairing

За замовчуванням бот відповідає кодом pairing. Схваліть його:

```bash
openclaw pairing approve feishu <CODE>
```

Після схвалення ви можете спілкуватися як зазвичай.

---

## Огляд

- **Канал бота Feishu**: бот Feishu, керований gateway
- **Детермінована маршрутизація**: відповіді завжди повертаються до Feishu
- **Ізоляція сесій**: особисті повідомлення використовують спільну основну сесію; групи ізольовані
- **Підключення WebSocket**: довге з’єднання через SDK Feishu, без потреби в публічному URL

---

## Контроль доступу

### Особисті повідомлення

- **За замовчуванням**: `dmPolicy: "pairing"` (невідомі користувачі отримують код pairing)
- **Схвалити pairing**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Режим allowlist**: установіть `channels.feishu.allowFrom` із дозволеними Open ID

### Групові чати

**1. Політика для груп** (`channels.feishu.groupPolicy`):

- `"open"` = дозволити всім у групах
- `"allowlist"` = дозволити лише `groupAllowFrom`
- `"disabled"` = вимкнути групові повідомлення

За замовчуванням: `allowlist`

**2. Вимога згадки** (`channels.feishu.requireMention`, можна перевизначити через `channels.feishu.groups.<chat_id>.requireMention`):

- явне `true` = вимагати @mention
- явне `false` = відповідати без згадок
- якщо не задано й `groupPolicy: "open"` = за замовчуванням `false`
- якщо не задано й `groupPolicy` не дорівнює `"open"` = за замовчуванням `true`

---

## Приклади конфігурації груп

### Дозволити всі групи, @mention не потрібен (за замовчуванням для відкритих груп)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все одно вимагати @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Дозволити лише певні групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Обмежити, які відправники можуть писати в групі (allowlist відправників)

Окрім дозволу для самої групи, **усі повідомлення** в цій групі фільтруються за open_id відправника: обробляються лише повідомлення від користувачів, перелічених у `groups.<chat_id>.allowFrom`; повідомлення від інших учасників ігноруються (це повне обмеження на рівні відправника, а не лише для керівних команд на кшталт /reset або /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Отримання ID групи/користувача

### ID групи (chat_id)

ID групи мають вигляд `oc_xxx`.

**Метод 1 (рекомендовано)**

1. Запустіть gateway і зробіть @mention бота в групі
2. Виконайте `openclaw logs --follow` і знайдіть `chat_id`

**Метод 2**

Використайте налагоджувач API Feishu, щоб отримати список групових чатів.

### ID користувача (open_id)

ID користувача мають вигляд `ou_xxx`.

**Метод 1 (рекомендовано)**

1. Запустіть gateway і надішліть боту особисте повідомлення
2. Виконайте `openclaw logs --follow` і знайдіть `open_id`

**Метод 2**

Перевірте запити pairing для Open ID користувачів:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                  |
| --------- | --------------------- |
| `/status` | Показати стан бота    |
| `/reset`  | Скинути сесію         |
| `/model`  | Показати/змінити модель |

> Примітка: Feishu ще не підтримує власні меню команд, тому команди потрібно надсилати як текст.

## Команди керування gateway

| Команда                    | Опис                          |
| -------------------------- | ----------------------------- |
| `openclaw gateway status`  | Показати стан gateway         |
| `openclaw gateway install` | Установити/запустити службу gateway |
| `openclaw gateway stop`    | Зупинити службу gateway       |
| `openclaw gateway restart` | Перезапустити службу gateway  |
| `openclaw logs --follow`   | Переглядати журнали gateway   |

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви використовуєте @mention бота (поведінка за замовчуванням)
3. Перевірте, що `groupPolicy` не встановлено в `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що застосунок опубліковано й схвалено
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що **long connection** увімкнено
4. Переконайтеся, що дозволи застосунку повні
5. Переконайтеся, що gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Витік App Secret

1. Скиньте App Secret у Feishu Open Platform
2. Оновіть App Secret у своїй конфігурації
3. Перезапустіть gateway

### Збої під час надсилання повідомлень

1. Переконайтеся, що застосунок має дозвіл `im:message:send_as_bot`
2. Переконайтеся, що застосунок опубліковано
3. Перевірте журнали для детальних помилок

---

## Розширена конфігурація

### Кілька облікових записів

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` визначає, який обліковий запис Feishu використовується, коли вихідні API явно не вказують `accountId`.

### Обмеження повідомлень

- `textChunkLimit`: розмір фрагмента вихідного тексту (за замовчуванням: 2000 символів)
- `mediaMaxMb`: ліміт вивантаження/завантаження медіа (за замовчуванням: 30 МБ)

### Потокова передача

Feishu підтримує потокові відповіді через інтерактивні картки. Коли це ввімкнено, бот оновлює картку під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

Установіть `streaming: false`, щоб чекати повної відповіді перед надсиланням.

### Сесії ACP

Feishu підтримує ACP для:

- особистих повідомлень
- розмов у темах груп

ACP у Feishu керується текстовими командами. Власних меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійні прив’язки ACP

Використовуйте типізовані прив’язки ACP верхнього рівня, щоб прив’язати особисте повідомлення Feishu або розмову в темі до постійної сесії ACP.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Прив’язаний до потоку запуск ACP із чату

У особистому повідомленні Feishu або розмові в темі ви можете створити й прив’язати сесію ACP на місці:

```text
/acp spawn codex --thread here
```

Примітки:

- `--thread here` працює для особистих повідомлень і тем Feishu.
- Подальші повідомлення в прив’язаному особистому повідомленні/темі напряму маршрутизуються до цієї сесії ACP.
- У v1 це не націлено на звичайні групові чати без тем.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб маршрутизувати особисті повідомлення або групи Feishu до різних агентів.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Поля маршрутизації:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` або `"group"`
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Див. [Отримання ID групи/користувача](#get-groupuser-ids) для порад щодо пошуку.

---

## Довідник із конфігурації

Повна конфігурація: [Конфігурація gateway](/gateway/configuration)

Ключові параметри:

| Налаштування                                      | Опис                                    | За замовчуванням |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Режим транспорту подій                  | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID облікового запису за замовчуванням для вихідної маршрутизації | `default`        |
| `channels.feishu.verificationToken`               | Обов’язково для режиму webhook          | -                |
| `channels.feishu.encryptKey`                      | Обов’язково для режиму webhook          | -                |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                   | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                  | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                  | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену API для окремого облікового запису | `feishu`         |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень          | `pairing`        |
| `channels.feishu.allowFrom`                       | allowlist особистих повідомлень (список `open_id`) | -                |
| `channels.feishu.groupPolicy`                     | Політика груп                           | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist груп                          | -                |
| `channels.feishu.requireMention`                  | Вимагати @mention за замовчуванням      | умовно           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення вимоги @mention для окремої групи | успадковується   |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути групу                         | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Ліміт розміру медіа                     | `30`             |
| `channels.feishu.streaming`                       | Увімкнути потоковий вивід карток        | `true`           |
| `channels.feishu.blockStreaming`                  | Увімкнути потокову передачу блоків      | `true`           |

---

## Довідник `dmPolicy`

| Значення      | Поведінка                                                      |
| ------------- | -------------------------------------------------------------- |
| `"pairing"`   | **За замовчуванням.** Невідомі користувачі отримують код pairing; потрібне схвалення |
| `"allowlist"` | Спілкуватися можуть лише користувачі з `allowFrom`             |
| `"open"`      | Дозволити всіх користувачів (потрібне `"*"` в `allowFrom`)     |
| `"disabled"`  | Вимкнути особисті повідомлення                                 |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Форматований текст (post)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Стікери

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки
- ⚠️ Форматований текст (форматування у стилі post і картки, але не довільні можливості авторингу Feishu)

### Потоки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в потоках тем, де Feishu надає `reply_in_thread`
- ✅ Відповіді з медіа залишаються прив’язаними до потоку під час відповіді на повідомлення потоку/теми

## Коментарі Drive

Feishu може запускати агента, коли хтось додає коментар у документ Feishu Drive (Docs, Sheets
тощо). Агент отримує текст коментаря, контекст документа та потік коментарів, щоб мати змогу
відповісти в потоці або внести зміни в документ.

Вимоги:

- Підпишіться на `drive.notice.comment_add_v1` у налаштуваннях підписки на події вашого застосунку Feishu
  (разом із уже наявним `im.message.receive_v1`)
- Інструмент Drive увімкнено за замовчуванням; вимкнути можна через `channels.feishu.tools.drive: false`

Інструмент `feishu_drive` надає такі дії для коментарів:

| Дія                   | Опис                                   |
| --------------------- | -------------------------------------- |
| `list_comments`       | Показати коментарі до документа        |
| `list_comment_replies` | Показати відповіді в потоці коментарів |
| `add_comment`         | Додати новий коментар верхнього рівня  |
| `reply_comment`       | Відповісти в наявному потоці коментарів |

Коли агент обробляє подію коментаря Drive, він отримує:

- текст коментаря та відправника
- метадані документа (назва, тип, URL)
- контекст потоку коментарів для відповідей у потоці

Після внесення змін у документ агенту рекомендується використати `feishu_drive.reply_comment`, щоб сповістити
коментатора, а потім вивести точний беззвучний токен `NO_REPLY` / `no_reply`, щоб
уникнути дубльованих надсилань.

## Поверхня дій runtime

Наразі Feishu надає такі дії runtime:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` і `reactions`, коли реакції увімкнено в конфігурації
- дії коментарів `feishu_drive`: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
