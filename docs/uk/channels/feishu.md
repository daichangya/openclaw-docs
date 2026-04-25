---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд, функції та налаштування бота Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-25T07:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e6373cc5744973e9f18016c5d5bd6a036a03eb269cba3b5fd7f4108cad2ecb
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, обмінюються документами, керують календарями та спільно виконують роботу.

**Статус:** готово до використання у продакшені для особистих повідомлень боту та групових чатів. Режим WebSocket є стандартним; режим Webhook — необов’язковий.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.24 або новіший.** Щоб перевірити, виконайте `openclaw --version`. Оновіть за допомогою `openclaw update`.

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Відскануйте QR-код у мобільному застосунку Feishu/Lark, щоб автоматично створити бота Feishu/Lark.
  </Step>
  
  <Step title="Після завершення налаштування перезапустіть Gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Керування доступом

### Особисті повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати боту особисті повідомлення:

- `"pairing"` — невідомі користувачі отримують код сполучення; підтвердження через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі особисті повідомлення

**Підтвердження запиту на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика для груп** (`channels.feishu.groupPolicy`):

| Значення      | Поведінка                                  |
| ------------- | ------------------------------------------ |
| `"open"`      | Відповідати на всі повідомлення в групах   |
| `"allowlist"` | Відповідати лише в групах із `groupAllowFrom` |
| `"disabled"`  | Вимкнути всі групові повідомлення          |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`

---

## Приклади конфігурації груп

### Дозволити всі групи, @згадка не потрібна

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все ще вимагати @згадку

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

### Дозволити лише конкретні групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Ідентифікатори груп мають вигляд: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Обмежити відправників у межах групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id користувачів мають вигляд: ou_xxx
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

### ID групи (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть у **Settings**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Get Group ID](/images/feishu-get-group-id.png)

### ID користувача (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту особисте повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Шукайте `open_id` у виводі журналу. Також можна перевірити запити на сполучення, які очікують підтвердження:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                              |
| --------- | --------------------------------- |
| `/status` | Показати статус бота              |
| `/reset`  | Скинути поточну сесію             |
| `/model`  | Показати або перемкнути AI-модель |

> Feishu/Lark не підтримує вбудовані меню slash-команд, тому надсилайте ці команди як звичайні текстові повідомлення.

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @ (типово це обов’язково)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано й схвалено у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні дозволи
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### App Secret скомпрометовано

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у своїй конфігурації
3. Перезапустіть Gateway: `openclaw gateway restart`

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
          name: "Основний бот",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Резервний бот",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` визначає, який обліковий запис використовується, коли вихідні API не вказують `accountId`.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — обмеження на завантаження/вивантаження медіа (типово: `30` МБ)

### Streaming

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Якщо цю функцію ввімкнено, бот оновлює картку в реальному часі під час генерації тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути потоковий вивід у картках (типово: true)
      blockStreaming: true, // увімкнути потокову передачу на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропустити виклики реакцій друку
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропустити пошук профілів відправників

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Сесії ACP

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійне прив’язування ACP

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

#### Запуск ACP із чату

У особистому повідомленні або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові будуть маршрутизуватися безпосередньо до цієї сесії ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб маршрутизувати особисті повідомлення або групи Feishu/Lark до різних агентів.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
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
- `match.peer.kind`: `"direct"` (особисті повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Поради щодо пошуку див. у [Отримання ID групи/користувача](#get-groupuser-ids).

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Параметр                                         | Опис                                         | Типове значення |
| ------------------------------------------------ | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                     | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)  | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації | `default`  |
| `channels.feishu.verificationToken`               | Потрібний для режиму Webhook                 | —                |
| `channels.feishu.encryptKey`                      | Потрібний для режиму Webhook                 | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту Webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки Webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки Webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                       | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для облікового запису  | `feishu`         |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень               | `allowlist`      |
| `channels.feishu.allowFrom`                       | Список дозволених для особистих повідомлень (`open_id`) | [BotOwnerId] |
| `channels.feishu.groupPolicy`                     | Політика для груп                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                       | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                    | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи     | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу           | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                      | `30`             |
| `channels.feishu.streaming`                       | Потоковий вивід у картках                    | `true`           |
| `channels.feishu.blockStreaming`                  | Потокова передача на рівні блоків            | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції друку                      | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників   | `true`           |

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
- ✅ Інтерактивні картки (зокрема з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості авторингу Feishu/Lark)

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа зберігають прив’язку до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` власні тематичні групи Feishu/Lark використовують подію `thread_id` (`omt_*`) як канонічний ключ сесії теми. Звичайні відповіді в групі, які OpenClaw перетворює на гілки, і далі використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший хід і наступний хід залишалися в межах однієї сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація в особистих повідомленнях і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та вимога згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
