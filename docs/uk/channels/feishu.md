---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, функції та конфігурація
title: Feishu
x-i18n:
    generated_at: "2026-04-27T04:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65a2b26862f1aee13ac61db0a98b837b397b7961242426a143737d9a3d04460d
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та разом виконують роботу.

**Статус:** готово до production для особистих повідомлень ботові та групових чатів. WebSocket — режим за замовчуванням; режим Webhook є необов’язковим.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Щоб перевірити, виконайте `openclaw --version`. Оновіть за допомогою `openclaw update`.
</Note>

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

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати особисті повідомлення ботові:

- `"pairing"` — невідомі користувачі отримують код сполучення; схвалення через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі особисті повідомлення

**Схвалення запиту на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Value         | Behavior                                      |
| ------------- | --------------------------------------------- |
| `"open"`      | Відповідати на всі повідомлення в групах      |
| `"allowlist"` | Відповідати лише в групах із `groupAllowFrom` |
| `"disabled"`  | Вимкнути всі повідомлення в групах            |

Типово: `allowlist`

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
      // ID груп мають вигляд: oc_xxx
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

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть до **Settings**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Отримання ID групи](/images/feishu-get-group-id.png)

### ID користувача (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту особисте повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виводі журналу. Ви також можете перевірити запити на сполучення, що очікують на схвалення:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Command   | Description                      |
| --------- | -------------------------------- |
| `/status` | Показати статус бота             |
| `/reset`  | Скинути поточну сесію            |
| `/model`  | Показати або змінити модель ШІ   |

<Note>
Feishu/Lark не підтримує вбудовані меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення проблем

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @ (це обов’язково за замовчуванням)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано та схвалено в Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні дозволи
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Витік App Secret

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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

`defaultAccount` визначає, який обліковий запис використовується, коли вихідні API не вказують `accountId`.
`accounts.<id>.tts` використовує ту саму структуру, що й `messages.tts`, і виконує глибоке злиття поверх
глобальної конфігурації TTS, тож багатоботові налаштування Feishu можуть зберігати спільні
облікові дані провайдерів на глобальному рівні, перевизначаючи для кожного облікового запису лише voice, model, persona або auto mode.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `30` МБ)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Якщо це ввімкнено, бот оновлює картку в реальному часі під час генерації тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути потокове виведення в картці (типово: true)
      blockStreaming: true, // увімкнути потокове передавання на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропускати виклики реакції набору тексту
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропускати запити профілю відправника

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

### Сеанси ACP

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

У особистому повідомленні або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до цього сеансу ACP.

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
- `match.peer.kind`: `"direct"` (особисте повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Поради щодо пошуку дивіться в [Отримання ID групи/користувача](#get-groupuser-ids).

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Setting                                           | Description                                   | Default          |
| ------------------------------------------------- | --------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                      | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)               | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)   | `websocket`      |
| `channels.feishu.defaultAccount`                  | Обліковий запис за замовчуванням для маршрутизації вихідних повідомлень | `default`        |
| `channels.feishu.verificationToken`               | Обов’язково для режиму webhook                | —                |
| `channels.feishu.encryptKey`                      | Обов’язково для режиму webhook                | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту Webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                        | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                        | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                    | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Перевизначення TTS для окремого облікового запису | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень                | `allowlist`      |
| `channels.feishu.allowFrom`                       | Список дозволених для особистих повідомлень (список `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                        | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи      | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути певну групу                | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                       | `30`             |
| `channels.feishu.streaming`                       | Потокове виведення в картці                   | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове передавання на рівні блоків          | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту               | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників    | `true`           |

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

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як заповнювачі медіа, а не
як сирий JSON `file_key`. Якщо налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосового повідомлення й запускає спільну транскрипцію аудіо до
ходу агента, тож агент отримує розшифрований мовний текст. Якщо Feishu вже містить
текст транскрипції безпосередньо в аудіопейлоаді, цей текст використовується без
додаткового виклику ASR. Без провайдера транскрипції аудіо агент усе одно отримує
заповнювач `<media:audio>` разом зі збереженим вкладенням, а не сирий пейлоад
ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (включно з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості створення вмісту Feishu/Lark)

Власні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують
завантаження медіа у форматі Ogg/Opus (`file_type: "opus"`). Наявні медіафайли `.opus` і `.ogg`
надсилаються безпосередньо як нативне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати
транскодуються до 48 кГц Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує
голосову доставку (`audioAsVoice` / інструмент повідомлень `asVoice`, включно з голосовими
TTS-відповідями). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або
конвертація не вдається, OpenClaw повертається до вкладення файлу й записує причину в журнал.

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа зберігають прив’язку до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні
тематичні групи Feishu/Lark використовують `thread_id` події (`omt_*`) як канонічний
ключ сеансу теми. Звичайні групові відповіді, які OpenClaw перетворює на гілки, і далі
використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший хід і наступний хід
залишалися в одному сеансі.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та контроль через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
