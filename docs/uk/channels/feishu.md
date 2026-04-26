---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, функції та налаштування
title: Feishu
x-i18n:
    generated_at: "2026-04-26T03:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b209a5e44d31fed562de624a39001f07e532dfeef9fefef4e0ce4a0bf18f21e2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та працюють разом.

**Статус:** готово до використання в продакшені для особистих повідомлень боту та групових чатів. WebSocket — режим за замовчуванням; режим Webhook — необов’язковий.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.25 або новіший.** Щоб перевірити, виконайте `openclaw --version`. Для оновлення виконайте `openclaw update`.

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

Налаштуйте `dmPolicy`, щоб керувати тим, хто може писати боту в особисті повідомлення:

- `"pairing"` — невідомі користувачі отримують код прив’язки; схвалення через CLI
- `"allowlist"` — писати можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всім користувачам
- `"disabled"` — вимкнути всі особисті повідомлення

**Схвалення запиту на прив’язку:**

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
| `"disabled"`  | Вимкнути всі повідомлення в групах         |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`

---

## Приклади налаштування груп

### Дозволити всі групи, без обов’язкової @згадки

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все одно вимагати @згадку

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

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть до **Налаштувань**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Отримання ID групи](/images/feishu-get-group-id.png)

### ID користувача (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту особисте повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виводі журналу. Ви також можете перевірити запити на прив’язку, що очікують схвалення:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                               |
| --------- | ---------------------------------- |
| `/status` | Показати статус бота               |
| `/reset`  | Скинути поточну сесію              |
| `/model`  | Показати або змінити модель ШІ     |

> Feishu/Lark не підтримує вбудовані меню слеш-команд, тому надсилайте ці команди як звичайні текстові повідомлення.

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @ (це вимагається типово)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бот опублікований і схвалений у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
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

`defaultAccount` керує тим, який обліковий запис використовується, коли вихідні API не вказують `accountId`.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — обмеження на завантаження/вивантаження медіа (типово: `30` МБ)

### Потокова передача

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли цю функцію ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути потокове виведення в картці (типово: true)
      blockStreaming: true, // увімкнути потокову передачу на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропускати виклики реакції набору тексту
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропускати пошук профілів відправників

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

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню слеш-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійна прив’язка ACP

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

У приватному чаті або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до цієї сесії ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб спрямовувати особисті повідомлення або групи Feishu/Lark до різних агентів.

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

Поради щодо пошуку див. в [Отримання ID групи/користувача](#get-groupuser-ids).

---

## Довідник із конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                                     | Опис                                         | Типове значення |
| ------------------------------------------------ | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                     | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)  | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації | `default`        |
| `channels.feishu.verificationToken`               | Потрібно для режиму Webhook                  | —                |
| `channels.feishu.encryptKey`                      | Потрібно для режиму Webhook                  | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту Webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки Webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки Webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                       | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису | `feishu`         |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень               | `allowlist`      |
| `channels.feishu.allowFrom`                       | Allowlist особистих повідомлень (список `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist груп                               | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                    | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи     | успадковується   |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу           | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                      | `30`             |
| `channels.feishu.streaming`                       | Потокове виведення в картці                  | `true`           |
| `channels.feishu.blockStreaming`                  | Потокова передача на рівні блоків            | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту              | `true`           |
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

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як заповнювачі медіа замість сирого JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw завантажує ресурс голосового повідомлення та запускає спільну транскрипцію аудіо перед ходом агента, тому агент отримує розшифровку мовлення. Якщо Feishu безпосередньо включає текст транскрипції в аудіонавантаження, цей текст використовується без додаткового виклику ASR. Без провайдера транскрипції аудіо агент однаково отримує заповнювач `<media:audio>` плюс збережене вкладення, а не сире навантаження ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (зокрема з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості створення контенту Feishu/Lark)

Власні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують завантаження медіа у форматі Ogg/Opus (`file_type: "opus"`). Наявні медіафайли `.opus` і `.ogg` надсилаються безпосередньо як власне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати перекодовуються у 48 кГц Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує голосову доставку (`audioAsVoice` / інструмент повідомлень `asVoice`, зокрема відповіді голосовими нотатками TTS). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або перетворення не вдається, OpenClaw повертається до вкладення файлу та записує причину в журнал.

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа залишаються прив’язаними до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` власні тематичні групи Feishu/Lark використовують `thread_id` (`omt_*`) події як канонічний ключ сесії теми. Звичайні групові відповіді, які OpenClaw перетворює на гілки, і далі використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший хід і наступний хід залишалися в одній сесії.

---

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Прив’язка](/uk/channels/pairing) — автентифікація особистих повідомлень і потік прив’язки
- [Групи](/uk/channels/groups) — поведінка групових чатів і керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
