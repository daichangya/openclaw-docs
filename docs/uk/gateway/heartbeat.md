---
read_when:
    - Налаштування частоти Heartbeat або повідомлень
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T07:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat чи cron?** Див. [Автоматизація й завдання](/uk/automation), щоб зрозуміти, коли що використовувати.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла виносити все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід основної сесії — він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані Cron-завдання).

Усунення проблем: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште heartbeat увімкненим (типово це `30m`, або `1h` для Anthropic OAuth/token auth, включно з повторним використанням Claude CLI) або встановіть власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть невеликий чекліст `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення heartbeat">
    `target: "none"` — типове значення; встановіть `target: "last"`, щоб надсилати до останнього контакту.
  </Step>
  <Step title="Додаткове налаштування">
    - Увімкніть доставку міркувань heartbeat для прозорості.
    - Використовуйте полегшений bootstrap-контекст, якщо heartbeat-запускам потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного heartbeat.
    - Обмежте heartbeat активними годинами (місцевий час).
  </Step>
</Steps>

Приклад конфігурації:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка останньому контакту (типово "none")
        directPolicy: "allow", // типово: дозволяти прямі/DM-цілі; встановіть "block", щоб придушити
        lightContext: true, // необов’язково: інʼєктувати лише HEARTBEAT.md з bootstrap-файлів
        isolatedSession: true, // необов’язково: нова сесія для кожного запуску (без історії розмови)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // необов’язково: також надсилати окреме повідомлення `Reasoning:`
      },
    },
  },
}
```

## Значення за замовчуванням

- Інтервал: `30m` (або `1h`, коли виявленим режимом автентифікації є Anthropic OAuth/token auth, включно з повторним використанням Claude CLI). Встановіть `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every`; використайте `0m`, щоб вимкнути.
- Тіло prompt-а (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat надсилається **дослівно** як повідомлення користувача. Системний prompt включає секцію "Heartbeat" лише тоді, коли heartbeat увімкнено для типового агента і запуск внутрішньо позначено відповідним прапорцем.
- Коли heartbeat вимкнено через `0m`, звичайні запуски також виключають `HEARTBEAT.md` з bootstrap-контексту, щоб модель не бачила інструкцій лише для heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза вікном heartbeat пропускаються до наступного тіку всередині вікна.

## Для чого потрібен prompt heartbeat

Типовий prompt навмисно є широким:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента перевіряти незавершені справи (вхідні, календар, нагадування, чергу роботи) і виносити все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає до зрідка легкого повідомлення на кшталт "чи щось тобі потрібно?", але уникає нічного спаму завдяки використанню вашого налаштованого локального часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск heartbeat не створює запис завдання.

Якщо ви хочете, щоб heartbeat робив щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) на власне тіло prompt-а (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Під час запусків heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, якщо він з’являється **на початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, він не обробляється спеціально.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється та журналюється; повідомлення, яке складається лише з `HEARTBEAT_OK`, відкидається.

## Конфігурація

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // типово: 30m (0m вимикає)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // типово: false (доставляти окреме повідомлення Reasoning:, якщо доступне)
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md з bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        target: "last", // типово: none | варіанти: last | none | <channel id> (core або Plugin, наприклад "bluebubbles")
        to: "+15551234567", // необов’язкове перевизначення одержувача для каналу
        accountId: "ops-bot", // необов’язковий id каналу з кількома акаунтами
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // макс. кількість символів після HEARTBEAT_OK
      },
    },
  },
}
```

### Область дії та пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку heartbeat.
- `agents.list[].heartbeat` об’єднується поверх нього; якщо будь-який агент має блок `heartbeat`, heartbeat запускаються **лише для цих агентів**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома акаунтами) перевизначає налаштування на рівні каналу.

### Heartbeat для окремого агента

Якщо будь-який запис `agents.list[]` включає блок `heartbeat`, heartbeat запускаються **лише для цих агентів**. Блок для окремого агента об’єднується поверх `agents.defaults.heartbeat` (тобто ви можете один раз задати спільні значення за замовчуванням і перевизначити їх для конкретного агента).

Приклад: два агенти, heartbeat запускається лише для другого агента.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка останньому контакту (типово "none")
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
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Приклад активних годин

Обмежте heartbeat робочими годинами в конкретному часовому поясі:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка останньому контакту (типово "none")
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

Поза цим вікном (до 9 ранку або після 10 вечора за східним часом) heartbeat пропускаються. Наступний запланований тік усередині вікна виконається як зазвичай.

### Налаштування 24/7

Якщо ви хочете, щоб heartbeat працювали весь день, використовуйте один із цих шаблонів:

- Повністю опустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте повноденне вікно: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не встановлюйте однаковий час для `start` і `end` (наприклад, з `08:00` до `08:00`). Це вважається вікном нульової ширини, тому heartbeat завжди пропускаються.
</Warning>

### Приклад із кількома акаунтами

Використовуйте `accountId`, щоб націлитися на конкретний акаунт у каналах із кількома акаунтами, як-от Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // необов’язково: маршрут до конкретної теми/треду
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

<ParamField path="every" type="string">
  Інтервал Heartbeat (рядок тривалості; типова одиниця = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов’язкове перевизначення моделі для запусків heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Коли увімкнено, також доставляє окреме повідомлення `Reasoning:`, якщо воно доступне (така сама форма, як у `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Якщо true, запуски heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Якщо true, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Радикально зменшує вартість токенів на кожен heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків heartbeat.

- `main` (типово): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).
  </ParamField>
  <ParamField path="target" type="string">
- `last`: доставити до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або id Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): виконати heartbeat, але **не доставляти** назовні.
  </ParamField>
  <ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки в direct/DM. `allow`: дозволити direct/DM-доставку heartbeat. `block`: придушити direct/DM-доставку (`reason=dm-blocked`).
  </ParamField>
  <ParamField path="to" type="string">
  Необов’язкове перевизначення одержувача (специфічний для каналу id, наприклад E.164 для WhatsApp або Telegram chat id). Для тем/тредів Telegram використовуйте `<chatId>:topic:<messageThreadId>`.
  </ParamField>
  <ParamField path="accountId" type="string">
  Необов’язковий id акаунта для каналів із кількома акаунтами. Коли `target: "last"`, id акаунта застосовується до визначеного останнього каналу, якщо той підтримує акаунти; інакше ігнорується. Якщо id акаунта не збігається з налаштованим акаунтом для визначеного каналу, доставка пропускається.
  </ParamField>
  <ParamField path="prompt" type="string">
  Перевизначає типове тіло prompt-а (без об’єднання).
  </ParamField>
  <ParamField path="ackMaxChars" type="number" default="300">
  Макс. кількість символів, дозволена після `HEARTBEAT_OK`, перед доставкою.
  </ParamField>
  <ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо true, придушує payload-и попереджень про помилки інструментів під час запусків heartbeat.
  </ParamField>
  <ParamField path="activeHours" type="object">
  Обмежує запуски heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, невключно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.

- Якщо пропущено або задано `"user"`: використовується ваш `agents.defaults.userTimezone`, якщо він налаштований, інакше використовується часовий пояс хост-системи.
- `"local"`: завжди використовує часовий пояс хост-системи.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується безпосередньо; якщо він недійсний, застосовується резервна поведінка `"user"`, описана вище.
- `start` і `end` не повинні бути рівними для активного вікна; рівні значення трактуються як вікно нульової ширини (завжди поза вікном).
- Поза активним вікном heartbeat пропускаються до наступного тіку всередині вікна.
  </ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сесії та цілі">
    - Heartbeat за замовчуванням запускаються в основній сесії агента (`agent:<id>:<mainKey>`), або в `global`, коли `session.scope = "global"`. Установіть `session`, щоб перевизначити на конкретну сесію каналу (Discord/WhatsApp тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставити в конкретний канал/одержувачу, встановіть `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цієї сесії.
    - Доставки heartbeat за замовчуванням дозволяють прямі/DM-цілі. Установіть `directPolicy: "block"`, щоб придушити надсилання на прямі цілі, але все одно виконати хід heartbeat.
    - Якщо основна черга зайнята, heartbeat пропускається і буде повторено пізніше.
    - Якщо `target` не розв’язується у зовнішнє призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.
  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск одразу пропускається з `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw усе одно може виконати heartbeat, оновити часові мітки завдань, термін яких настав, відновити часову мітку простою сесії та придушити зовнішній payload сповіщення.
    - Якщо визначена ціль heartbeat підтримує індикатор набору, OpenClaw показує набір тексту, поки виконується heartbeat. Для цього використовується та сама ціль, куди heartbeat надсилав би вихід чату, і це вимикається через `typingMode: "never"`.
  </Accordion>
  <Accordion title="Життєвий цикл сесії та аудит">
    - Відповіді лише heartbeat **не** підтримують сесію активною. Метадані heartbeat можуть оновлювати рядок сесії, але завершення через бездіяльність використовує `lastInteractionAt` від останнього справжнього повідомлення користувача/каналу, а добове завершення використовує `sessionStartedAt`.
    - Історія в Control UI і WebChat приховує prompt-и heartbeat і підтвердження лише з OK. Базовий транскрипт сесії все одно може містити ці ходи для аудиту/повторного програвання.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть ставити системну подію в чергу та пробуджувати heartbeat, коли основна сесія має швидко помітити щось важливе. Таке пробудження не робить запуск heartbeat фоновим завданням.
  </Accordion>
</AccordionGroup>

## Керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` придушуються, а вміст сповіщення доставляється. Ви можете налаштувати це для кожного каналу або окремого акаунта:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Приховувати HEARTBEAT_OK (типово)
      showAlerts: true # Показувати повідомлення сповіщень (типово)
      useIndicator: true # Видавати події індикатора (типово)
  telegram:
    heartbeat:
      showOk: true # Показувати підтвердження OK у Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Придушити доставку сповіщень для цього акаунта
```

Пріоритет: для акаунта → для каналу → типові для каналів → вбудовані типові значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише з OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не-OK.
- `useIndicator`: видає події індикатора для поверхонь статусу UI.

Якщо **всі три** мають значення false, OpenClaw повністю пропускає запуск heartbeat (без виклику моделі).

### Приклади для каналу та акаунта

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # усі акаунти Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # придушити сповіщення лише для акаунта ops
  telegram:
    heartbeat:
      showOk: true
```

### Поширені шаблони

| Ціль                                     | Конфігурація                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення увімкнені) | _(конфігурація не потрібна)_                                                                   |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }`      |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`       |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                                |

## HEARTBEAT.md (необов’язково)

Якщо у робочому просторі існує файл `HEARTBEAT.md`, типовий prompt наказує агенту прочитати його. Сприймайте це як ваш "чекліст heartbeat": невеликий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` інʼєктується лише тоді, коли настанови heartbeat увімкнені для типового агента. Вимкнення частоти heartbeat через `0m` або встановлення `includeSystemPromptSection: false` виключає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та Markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API. Такий пропуск позначається як `reason=empty-heartbeat-file`. Якщо файл відсутній, heartbeat усе одно запускається, і модель сама вирішує, що робити.

Тримайте його невеликим (короткий чекліст або нагадування), щоб уникнути розростання prompt-а.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок за інтервалами всередині самого heartbeat.

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

<AccordionGroup>
  <Accordion title="Поведінка">
    - OpenClaw розбирає блок `tasks:` і перевіряє кожне завдання відносно його власного `interval`.
    - До prompt-а heartbeat для цього тіку включаються лише **завдання, строк яких настав**.
    - Якщо жодне завдання не настав час виконувати, heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст у `HEARTBEAT.md`, що не є завданнями, зберігається та додається як додатковий контекст після списку завдань, строк яких настав.
    - Часові мітки останнього запуску завдань зберігаються в стані сесії (`heartbeatTaskState`), тож інтервали переживають звичайні перезапуски.
    - Часові мітки завдань зсуваються вперед лише після того, як запуск heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.
  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один heartbeat-файл містив кілька періодичних перевірок, не оплачуючи їх усі на кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви його про це попросите.

`HEARTBEAT.md` — це звичайний файл у робочому просторі агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете додати явний рядок у свій heartbeat prompt, наприклад: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Не розміщуйте секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту prompt-а.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу та негайно запустити heartbeat так:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо кілька агентів мають налаштований `heartbeat`, ручне пробудження негайно запускає heartbeat кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка міркувань (необов’язково)

За замовчуванням heartbeat доставляють лише фінальний payload "відповіді".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, heartbeat також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (така сама форма, як у `/reasoning on`). Це може бути корисно, коли агент керує кількома сесіями/codex-ами і ви хочете бачити, чому він вирішив вас ping-нути, — але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще залишати це вимкненим.

## Усвідомлення вартості

Heartbeat виконують повні ходи агента. Коротші інтервали витрачають більше токенів. Щоб зменшити витрати:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (~100K токенів зменшується до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Установіть дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` невеликим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Пов’язане

- [Автоматизація й завдання](/uk/automation) — усі механізми автоматизації одним поглядом
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на розклад heartbeat
- [Усунення проблем](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
