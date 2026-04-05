---
read_when:
    - Налаштування частоти heartbeat або повідомлень
    - Вибір між heartbeat і cron для запланованих завдань
summary: Heartbeat опитує повідомлення та правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T18:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat чи Cron?** Див. [Automation & Tasks](/automation), щоб зрозуміти, коли що використовувати.

Heartbeat запускає **періодичні цикли агента** в основній сесії, щоб модель могла
показувати все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований цикл основної сесії — він **не** створює записи [background task](/automation/tasks).
Записи завдань призначені для відокремленої роботи (запуски ACP, subagent, ізольовані cron-завдання).

Усунення несправностей: [Scheduled Tasks](/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

1. Залиште heartbeat увімкненим (за замовчуванням це `30m`, або `1h` для Anthropic OAuth/token auth, включно з повторним використанням Claude CLI) або задайте власну частоту.
2. Створіть невеликий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента (необов’язково, але рекомендовано).
3. Вирішіть, куди мають надходити повідомлення heartbeat (`target: "none"` — значення за замовчуванням; установіть `target: "last"`, щоб спрямовувати їх до останнього контакту).
4. Необов’язково: увімкніть доставку reasoning heartbeat для більшої прозорості.
5. Необов’язково: використовуйте полегшений bootstrap-контекст, якщо для запусків heartbeat потрібен лише `HEARTBEAT.md`.
6. Необов’язково: увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного heartbeat.
7. Необов’язково: обмежте heartbeat активними годинами (за місцевим часом).

Приклад конфігурації:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
        directPolicy: "allow", // типово: дозволяти цілі direct/DM; установіть "block", щоб приглушити
        lightContext: true, // необов’язково: інжектувати лише HEARTBEAT.md з bootstrap-файлів
        isolatedSession: true, // необов’язково: нова сесія для кожного запуску (без історії розмови)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // необов’язково: також надсилати окреме повідомлення `Reasoning:`
      },
    },
  },
}
```

## Значення за замовчуванням

- Інтервал: `30m` (або `1h`, коли виявленим режимом auth є Anthropic OAuth/token, включно з повторним використанням Claude CLI). Установіть `agents.defaults.heartbeat.every` або для окремого агента `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло prompt (налаштовується через `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat надсилається **дослівно** як повідомлення користувача. System
  prompt містить розділ “Heartbeat”, а запуск внутрішньо позначається відповідним прапорцем.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі.
  Поза межами цього вікна heartbeat пропускаються до наступного тіку в межах вікна.

## Для чого потрібен prompt heartbeat

Prompt за замовчуванням навмисно зроблено широким:

- **Фонові завдання**: “Consider outstanding tasks” підштовхує агента переглядати
  наступні дії (вхідні, календар, нагадування, завдання в черзі) і показувати все термінове.
- **Людська перевірка**: “Checkup sometimes on your human during day time” підштовхує до
  періодичного легкого повідомлення на кшталт “чи щось потрібно?”, але уникає нічного спаму
  завдяки використанню вашого налаштованого місцевого часового поясу (див. [/concepts/timezone](/concepts/timezone)).

Heartbeat може реагувати на завершені [background tasks](/automation/tasks), але сам запуск heartbeat не створює запис завдання.

Якщо ви хочете, щоб heartbeat робив щось дуже конкретне (наприклад, “перевірити статистику Gmail PubSub”
або “перевірити стан gateway”), установіть `agents.defaults.heartbeat.prompt` (або
`agents.list[].heartbeat.prompt`) у власне тіло prompt, яке надсилатиметься дослівно.

## Контракт відповіді

- Якщо нічого не потребує уваги, дайте відповідь **`HEARTBEAT_OK`**.
- Під час запусків heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, якщо він з’являється
  **на початку або в кінці** відповіді. Токен видаляється, а відповідь
  відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **в середині** відповіді, він не обробляється
  особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється
та записується в журнал; повідомлення, яке складається лише з `HEARTBEAT_OK`, відкидається.

## Конфігурація

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // типово: 30m (0m вимикає)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // типово: false (доставляти окреме повідомлення Reasoning:, коли доступно)
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        target: "last", // типово: none | варіанти: last | none | <channel id> (core або plugin, наприклад "bluebubbles")
        to: "+15551234567", // необов’язкове перевизначення для конкретного каналу
        accountId: "ops-bot", // необов’язковий id каналу для multi-account
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // макс. кількість символів після HEARTBEAT_OK
      },
    },
  },
}
```

### Область дії та пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку heartbeat.
- `agents.list[].heartbeat` накладається поверх; якщо будь-який агент має блок `heartbeat`, heartbeat запускаються **лише для цих агентів**.
- `channels.defaults.heartbeat` задає типові налаштування видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові налаштування каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для конкретного каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, **лише ці агенти**
запускатимуть heartbeat. Блок для окремого агента накладається поверх `agents.defaults.heartbeat`
(тобто ви можете один раз задати спільні значення за замовчуванням і перевизначати їх для окремих агентів).

Приклад: два агенти, heartbeat запускається лише для другого.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Приклад активних годин

Обмежте heartbeat робочими годинами в певному часовому поясі:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // необов’язково; використовує ваш userTimezone, якщо задано, інакше часовий пояс хоста
        },
      },
    },
  },
}
```

Поза цим вікном (до 9 ранку або після 10 вечора за східним часом) heartbeat пропускаються. Наступний запланований тік у межах цього вікна відпрацює нормально.

### Налаштування 24/7

Якщо ви хочете, щоб heartbeat працювали весь день, використовуйте один із цих варіантів:

- Повністю опустіть `activeHours` (без обмеження часовим вікном; це поведінка за замовчуванням).
- Установіть повноденне вікно: `activeHours: { start: "00:00", end: "24:00" }`.

Не встановлюйте однаковий час для `start` і `end` (наприклад, `08:00` до `08:00`).
Це вважається вікном нульової ширини, тому heartbeat завжди пропускаються.

### Приклад із кількома обліковими записами

Використовуйте `accountId`, щоб націлитися на конкретний обліковий запис у multi-account каналах, таких як Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // необов’язково: спрямувати в конкретну тему/тред
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Примітки щодо полів

- `every`: інтервал heartbeat (рядок тривалості; одиниця за замовчуванням = хвилини).
- `model`: необов’язкове перевизначення моделі для запусків heartbeat (`provider/model`).
- `includeReasoning`: якщо ввімкнено, також доставляє окреме повідомлення `Reasoning:`, коли воно доступне (така сама форма, як у `/reasoning on`).
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і залишають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: якщо `true`, кожен heartbeat виконується в новій сесії без попередньої історії розмов. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Різко зменшує витрати токенів на кожен heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
- `session`: необов’язковий ключ сесії для запусків heartbeat.
  - `main` (типово): основна сесія агента.
  - Явний ключ сесії (скопіюйте з `openclaw sessions --json` або з [sessions CLI](/cli/sessions)).
  - Формати ключів сесій: див. [Sessions](/concepts/session) і [Groups](/channels/groups).
- `target`:
  - `last`: доставити в останній використаний зовнішній канал.
  - явний канал: будь-який налаштований канал або id plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
  - `none` (типово): виконати heartbeat, але **не доставляти** його назовні.
- `directPolicy`: керує поведінкою доставки в direct/DM:
  - `allow` (типово): дозволяти доставку heartbeat у direct/DM.
  - `block`: приглушити доставку в direct/DM (`reason=dm-blocked`).
- `to`: необов’язкове перевизначення отримувача (id, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/тредів Telegram використовуйте `<chatId>:topic:<messageThreadId>`.
- `accountId`: необов’язковий id облікового запису для multi-account каналів. Якщо `target: "last"`, id облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо id облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.
- `prompt`: перевизначає типове тіло prompt (не зливається).
- `ackMaxChars`: макс. кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.
- `suppressToolErrorWarnings`: якщо `true`, приглушує payload попереджень про помилки інструментів під час запусків heartbeat.
- `activeHours`: обмежує запуски heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, невключно; для кінця дня дозволено `24:00`) і необов’язковим `timezone`.
  - Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до системного часового поясу хоста.
  - `"local"`: завжди використовує системний часовий пояс хоста.
  - Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо він недійсний, відбувається fallback до поведінки `"user"`, описаної вище.
  - `start` і `end` не повинні бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
  - Поза активним вікном heartbeat пропускаються до наступного тіку в межах вікна.

## Поведінка доставки

- Heartbeat за замовчуванням виконуються в основній сесії агента (`agent:<id>:<mainKey>`),
  або в `global`, коли `session.scope = "global"`. Установіть `session`, щоб перевизначити це на
  конкретну сесію каналу (Discord/WhatsApp тощо).
- `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
- Щоб доставляти в конкретний канал/отримувача, задайте `target` + `to`. З
  `target: "last"` доставка використовує останній зовнішній канал для цієї сесії.
- Доставки heartbeat за замовчуванням дозволяють цілі direct/DM. Установіть `directPolicy: "block"`, щоб приглушити надсилання на direct-цілі, але все одно виконати цикл heartbeat.
- Якщо основна черга зайнята, heartbeat пропускається й повторюється пізніше.
- Якщо `target` не розв’язується в жодну зовнішню ціль, запуск усе одно відбувається, але
  вихідне повідомлення не надсилається.
- Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається одразу з `reason=alerts-disabled`.
- Якщо вимкнено лише доставку сповіщень, OpenClaw усе одно може виконати heartbeat, оновити часові позначки належних завдань, відновити часову позначку idle сесії та приглушити зовнішній payload сповіщення.
- Відповіді лише heartbeat **не** підтримують активність сесії; останнє значення `updatedAt`
  відновлюється, тому завершення строку бездіяльності працює нормально.
- Відокремлені [background tasks](/automation/tasks) можуть ставити системну подію в чергу та пробуджувати heartbeat, коли основній сесії потрібно швидко помітити щось важливе. Таке пробудження не робить запуск heartbeat фоновим завданням.

## Керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` приглушуються, а вміст сповіщень
доставляється. Ви можете налаштувати це для кожного каналу або облікового запису:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Приховати HEARTBEAT_OK (типово)
      showAlerts: true # Показувати повідомлення-сповіщення (типово)
      useIndicator: true # Видавати події індикатора (типово)
  telegram:
    heartbeat:
      showOk: true # Показувати OK-підтвердження в Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Приглушити доставку сповіщень для цього облікового запису
```

Пріоритет: для облікового запису → для каналу → типові налаштування каналу → вбудовані типові значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише з OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не-OK.
- `useIndicator`: видає події індикатора для поверхонь статусу UI.

Якщо **всі три** мають значення false, OpenClaw повністю пропускає запуск heartbeat (без виклику моделі).

### Приклади для каналу та облікового запису

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # усі облікові записи Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # приглушити сповіщення лише для облікового запису ops
  telegram:
    heartbeat:
      showOk: true
```

### Поширені шаблони

| Мета                                     | Конфігурація                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Поведінка за замовчуванням (тихі OK, сповіщення ввімкнені) | _(конфігурація не потрібна)_                                                               |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (необов’язково)

Якщо у робочому просторі існує файл `HEARTBEAT.md`, prompt за замовчуванням каже
агенту його прочитати. Сприймайте його як свій “контрольний список heartbeat”: невеликий, стабільний і
безпечний для включення кожні 30 хвилин.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API.
Такий пропуск позначається як `reason=empty-heartbeat-file`.
Якщо файлу немає, heartbeat усе одно виконується, і модель сама вирішує, що робити.

Тримайте його маленьким (короткий контрольний список або нагадування), щоб уникнути роздування prompt.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок
за інтервалами всередині самого heartbeat.

Приклад:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Поведінка:

- OpenClaw розбирає блок `tasks:` і перевіряє кожне завдання щодо його власного `interval`.
- До prompt heartbeat для цього тіку включаються лише **належні** завдання.
- Якщо немає жодного належного завдання, heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
- Вміст у `HEARTBEAT.md`, який не є завданнями, зберігається й додається як додатковий контекст після списку належних завдань.
- Часові позначки останнього запуску завдань зберігаються в стані сесії (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
- Часові позначки завдань просуваються вперед лише після того, як запуск heartbeat проходить свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

Режим завдань корисний, коли ви хочете, щоб один файл heartbeat містив кілька періодичних перевірок, але без витрат на всі з них у кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви його про це попросите.

`HEARTBEAT.md` — це просто звичайний файл у робочому просторі агента, тож ви можете сказати
агенту (у звичайному чаті) щось на кшталт:

- “Онови `HEARTBEAT.md`, додавши щоденну перевірку календаря.”
- “Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо вхідних.”

Якщо ви хочете, щоб це відбувалося проактивно, можете також включити явний рядок у
свій prompt heartbeat на кшталт: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Примітка щодо безпеки: не розміщуйте секрети (API ключі, номери телефонів, приватні токени) у
`HEARTBEAT.md` — він стає частиною контексту prompt.

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й одразу запустити heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо `heartbeat` налаштовано для кількох агентів, ручне пробудження негайно запустить heartbeat кожного з них.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка reasoning (необов’язково)

За замовчуванням heartbeat доставляють лише фінальний payload “відповіді”.

Якщо ви хочете більшої прозорості, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Якщо ввімкнено, heartbeat також доставлятимуть окреме повідомлення з префіксом
`Reasoning:` (така сама форма, як у `/reasoning on`). Це може бути корисно, коли агент
керує кількома сесіями/codex і ви хочете бачити, чому він вирішив вам написати
— але це також може розкрити більше внутрішніх деталей, ніж вам хотілося б. У групових чатах краще залишати це
вимкненим.

## Усвідомлення вартості

Heartbeat запускають повноцінні цикли агента. Коротші інтервали спалюють більше токенів. Щоб зменшити витрати:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (~100K токенів зменшується до ~2-5K на запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` невеликим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Пов’язане

- [Automation & Tasks](/automation) — огляд усіх механізмів автоматизації
- [Background Tasks](/automation/tasks) — як відстежується відокремлена робота
- [Timezone](/concepts/timezone) — як часовий пояс впливає на планування heartbeat
- [Troubleshooting](/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
