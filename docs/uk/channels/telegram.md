---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Статус підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-23T06:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2073245079eb48b599c4274cc620eb29211a64c5d396ffb355f7022fecec9a6
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до використання в production для DM бота + груп через grammY. Long polling — режим за замовчуванням; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що handle точно `@BotFather`).

    Виконайте `/newbot`, дотримуйтесь підказок і збережіть токен.

  </Step>

  <Step title="Налаштуйте токен і політику DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише для облікового запису за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть Gateway і підтвердьте перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди підключення діють 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним варіантом через env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групах">
    Для ботів Telegram за замовчуванням увімкнено **Privacy Mode**, що обмежує, які повідомлення в групах вони отримують.

    Якщо бот має бачити всі повідомлення групи, виконайте одну з дій:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть бота й додайте його знову в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для керування видимістю в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється валідацією config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у вигляді `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у сценаріях allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником краще використовувати `dmPolicy: "allowlist"` з явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх підтверджень підключення).

    Поширена плутанина: підтвердження підключення DM не означає, що «цей відправник авторизований всюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах, як і раніше, визначається явними allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз, і працювали і DM, і команди в групах», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Напишіть своєму боту в DM.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Одночасно застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи в `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram використовує `allowFrom` як резервний варіант.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються під час авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує підтвердження з pairing-store для DM.
    Підключення залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує config `allowFrom` як резервний варіант, а не pairing store.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо лише не задано `channels.defaults.groupPolicy`.

    Приклад: дозволити будь-якому учаснику в одній конкретній групі:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Приклад: дозволити лише конкретним користувачам в одній конкретній групі:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Поширена помилка: `groupAllowFrom` — це не allowlist груп Telegram.

      - Додавайте від’ємні ID груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть активувати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    За замовчуванням відповіді в групах потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійного збереження використовуйте config.

    Приклад постійної конфігурації:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Як отримати ID групового чату:

    - перешліть повідомлення з групи в `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний конверт каналу з метаданими відповіді та заповнювачами медіа.
- Сесії груп ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх за допомогою ключів сесії з урахуванням потоку та зберігає ID потоку для відповідей.
- Long polling використовує grammY runner із послідовністю для кожного чату/потоку. Загальна паралельність sink runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують за замовчуванням після 120 секунд без завершеної перевірки працездатності `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через зависання polling під час тривалої роботи. Значення задається в мілісекундах і допускається в діапазоні від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` визначає, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Задайте `false`, щоб зберегти окремі повідомлення інструментів/прогресу.
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, із медіавмістом) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Streaming попереднього перегляду відокремлений від block streaming. Коли block streaming явно ввімкнено для Telegram, OpenClaw пропускає stream попереднього перегляду, щоб уникнути подвійного streaming.

    Якщо нативний транспорт чернеток недоступний або відхилений, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live preview під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Налаштування нативних команд за замовчуванням:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Резервна копія Git" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - імена нормалізуються (видалення початкового `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та логуються

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе одно можуть працювати при ручному введенні, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram все ще переповнене після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковані.

    ### Команди підключення пристрою (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують підтвердження (включно з роллю/scopes)
    4. підтвердьте запит:
       - `/pair approve <requestId>` для явного підтвердження
       - `/pair approve` коли є лише один запит, що очікує підтвердження
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap token. Вбудована передача bootstrap зберігає primary node token на `scopes: []`; будь-який переданий operator token залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope використовують префікси ролей, тому цей allowlist для operator задовольняє лише запити operator; для ролей, що не є operator, усе ще потрібні scopes під префіксом їхньої власної ролі.

    Якщо пристрій повторює спробу зі зміненими деталями auth (наприклад роль/scopes/public key), попередній запит, що очікує підтвердження, заміщується, а новий запит використовує інший `requestId`. Перед підтвердженням знову виконайте `/pair pending`.

    Докладніше: [Підключення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Вбудовані кнопки">
    Налаштуйте область дії вбудованої клавіатури:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Перевизначення для окремого облікового запису:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Області дії:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Натискання callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання в runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке спричинило запуск
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форумів:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді й індикатор набору націлюються на потік теми
    - шлях config для тем:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - під час надсилання повідомлень `message_thread_id` пропускається (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` є лише для теми й не успадковується з налаштувань групи за замовчуванням.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через `agentId` у config теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → main agent
                "3": { agentId: "zu" },        // Тема dev → zu agent
                "5": { agentId: "coder" }      // Рев’ю коду → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне ACP-прив’язування теми**: Теми форуму можуть закріплювати сесії ACP harness через typed ACP bindings верхнього рівня:

    - `bindings[]` з `type: "acp"` і `match.channel: "telegram"`

    Приклад:

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Наразі це обмежено темами форуму в групах і супергрупах.

    **Прив’язаний до потоку запуск ACP із чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби у `/acp steer`).
    - Після успішного прив’язування OpenClaw закріплює повідомлення з підтвердженням запуску в цій темі.
    - Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоків у DM:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сесій/цілі відповідей з урахуванням потоку.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові повідомлення та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосове повідомлення

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Відеоповідомлення

    Telegram розрізняє відеофайли та video notes.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video notes не підтримують підписи; наданий текст повідомлення надсилається окремо.

    ### Стікери

    Обробка вхідних стікерів:

    - статичний WEBP: завантажується й обробляється (заповнювач `<media:sticker>`)
    - анімований TGS: пропускається
    - відео WEBM: пропускається

    Поля контексту стікера:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Файл кешу стікерів:

    - `~/.openclaw/telegram/sticker-cache.json`

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити кількість повторних викликів vision.

    Увімкнення дій зі стікерами:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Дія надсилання стікера:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Пошук у кешованих стікерах:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від payload повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно дотримуються контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоків в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи форуму маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної вихідної теми

    `allowed_updates` для polling/Webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний варіант через emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-emoji (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи в config із подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібно ввімкнення команд)

    Вимкнення:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Авторизація вибору моделі в групах">
    Inline buttons вибору моделі в групах потребують такої самої авторизації, як і `/models`. Неавторизовані учасники можуть переглядати й натискати кнопки, але OpenClaw відхиляє callback до зміни моделі сесії.
  </Accordion>

  <Accordion title="Long polling і Webhook">
    За замовчуванням: long polling.

    Режим Webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, якщо задано webhook URL)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Локальний listener за замовчуванням для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, розмістіть перед нею reverse proxy і вкажіть `webhookUrl` на публічний URL.
    Задайте `webhookHost` (наприклад `0.0.0.0`), якщо вам навмисно потрібен зовнішній вхідний доступ.

    Callback Webhook grammY повертає 200 протягом 5 секунд, щоб Telegram не повторював довготривалі оновлення як тайм-аути читання; довша робота продовжується у фоновому режимі. Polling перебудовує HTTP transport після конфліктів `getUpdates` 409, тому повторні спроби використовують нове TCP-з’єднання замість циклічного використання keep-alive socket, завершеного Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - `channels.telegram.textChunkLimit` за замовчуванням має значення 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується значення grammY за замовчуванням).
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає цю функцію.
    - додатковий контекст reply/quote/forward наразі передається як отриманий.
    - allowlist у Telegram насамперед визначають, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціллю надсилання CLI може бути числовий ID чату або ім’я користувача:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram polls використовують `openclaw message poll` і підтримують теми форуму:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Прапорці poll лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Telegram send також підтримує:

    - `--presentation` з блоками `buttons` для inline keyboard, якщо це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, якщо бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з poll
    - `channels.telegram.actions.poll=false` вимикає створення Telegram poll, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM осіб, які підтверджують, і може додатково публікувати запити на підтвердження в початковому чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; як резервний варіант використовуються числові ID власників, визначені з `allowFrom` і прямого `defaultTo`, де це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Особи, які підтверджують, мають бути вказані числовими ID користувачів Telegram. Telegram автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного підтверджувача — або з `execApprovals.approvers`, або з config числового власника облікового запису (`allowFrom` і DM `defaultTo`). Задайте `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт підтверджень. В іншому разі запити на підтвердження повертаються до інших налаштованих маршрутів підтвердження або політики резервного підтвердження exec.

    Telegram також рендерить спільні кнопки підтвердження, що використовуються іншими чат-каналами. Нативний адаптер Telegram переважно додає маршрутизацію DM для підтверджувачів, fanout у канали/теми та підказки набору тексту перед доставкою.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

    Правила доставки:

    - `target: "dm"` надсилає запити на підтвердження лише в DM визначеним підтверджувачам
    - `target: "channel"` надсилає запит назад у початковий чат/тему Telegram
    - `target: "both"` надсилає в DM підтверджувачів і в початковий чат/тему

    Лише визначені підтверджувачі можуть підтверджувати або відхиляти. Особи, які не є підтверджувачами, не можуть використовувати `/approve` і не можуть використовувати кнопки підтвердження Telegram.

    Поведінка визначення підтвердження:

    - ID з префіксом `plugin:` завжди визначаються через підтвердження plugin.
    - Інші ID спочатку пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизовано для підтверджень plugin і gateway повідомляє,
      що підтвердження exec невідоме/прострочене, Telegram один раз повторює спробу через
      `plugin.approval.resolve`.
    - Реальні відхилення/помилки підтверджень exec не переходять мовчки до
      визначення підтверджень plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему і для запиту на підтвердження, і для подальших дій після підтвердження. За замовчуванням підтвердження exec діють 30 хвилин.

    Inline buttons підтвердження також залежать від того, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Підтвердження exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або помилкою провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі config:

| Key                                 | Values            | Default | Опис                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю приховує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в тому самому чаті. Запобігає спаму помилок під час збоїв. |

Підтримуються перевизначення для окремих облікових записів, груп і тем (таке саме успадкування, як і для інших ключів config Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // приховати помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення в групі без згадки">

    - Якщо `requireMention=false`, режим конфіденційності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота й додайте його знову до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` неможливо перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте членство бота в групі
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або зовсім не працюють">

    - авторизуйте свою ідентичність відправника (pairing та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/custom або вимкніть нативні меню
    - `setMyCommands failed` з помилками мережі/fetch зазвичай вказує на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку визначається в IPv6; несправний вихідний IPv6 може викликати періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані помилки мережі.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує Telegram transport після 120 секунд без завершеної перевірки працездатності long-poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` працюють нормально, але ваш хост усе ще повідомляє про хибні перезапуски через зависання polling. Постійні зависання зазвичай вказують на проблеми з proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим egress/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — це WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону бенчмарків RFC 2544 (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантажень медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису за шляхом
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяють
      діапазон бенчмарків RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      від SSRF у медіа. Використовуйте його лише в довірених середовищах proxy, що
      контролюються оператором, таких як маршрутизація fake-IP у Clash, Mihomo або Surge,
      коли вони синтезують приватні або special-use відповіді поза межами діапазону
      бенчмарків RFC 2544. Для звичайного публічного доступу Telegram через інтернет залишайте його вимкненим.
    </Warning>

    - Перевизначення через env (тимчасово):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірте відповіді DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Докладніше: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файлу. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). Для `allowlist` потрібен щонайменше один ID відправника. Для `open` потрібен `"*"`. `openclaw doctor --fix` може визначати застарілі записи `@username` як ID і може відновлювати записи allowlist із файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення Telegram poll (за замовчуванням: увімкнено; усе одно потребує `sendMessage`).
- `channels.telegram.defaultTo`: ціль Telegram за замовчуванням, яку CLI `--deliver` використовує, коли не вказано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників для груп (числові ID користувачів Telegram). `openclaw doctor --fix` може визначати застарілі записи `@username` як ID. Нечислові записи ігноруються під час авторизації. Авторизація груп не використовує резервний варіант pairing-store для DM (`2026.2.25+`).
- Пріоритет для кількох облікових записів:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням.
  - Якщо не задано жодного з них, OpenClaw використовує перший нормалізований ID облікового запису, а `openclaw doctor` видає попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задано.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: значення за замовчуванням для груп + allowlist (використовуйте `"*"` для глобальних значень за замовчуванням).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення `groupPolicy` для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: значення за замовчуванням для gating згадок.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (не вказано = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий system prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимикає групу, якщо значення `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + `agentId`, який існує лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та через binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення `groupPolicy` для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення gating згадок для окремої теми.
- верхньорівневий `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійного ACP-прив’язування теми (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (та сама поведінка, що й для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як чат-клієнт підтвердження exec для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено підтверджувати або відхиляти exec-запити. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже ідентифікує власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають початкову тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на підтвердження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (substring або regex) для пересланих запитів на підтвердження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації підтверджень exec у Telegram і авторизації підтверджувачів для окремого облікового запису.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (попередній перегляд live stream; за замовчуванням: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом preview). Streaming попереднього перегляду в Telegram використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.streaming.preview.toolProgress`: повторно використовувати live preview message для оновлень інструментів/прогресу, коли активний streaming попереднього перегляду (за замовчуванням: `true`). Задайте `false`, щоб зберегти окремі повідомлення інструментів/прогресу.
- `channels.telegram.mediaMaxMb`: обмеження медіа Telegram для вхідних/вихідних повідомлень (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (`attempts`, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а для WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). За замовчуванням у Node 22+ використовується `ipv4first`.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent-proxy, де під час завантаження медіа Telegram `api.telegram.org` визначається як приватні/внутрішні/special-use адреси поза стандартно дозволеним діапазоном бенчмарків RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потрібен `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язки Webhook (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язки Webhook (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: gating реакцій інструментів Telegram.
- `channels.telegram.actions.sendMessage`: gating надсилання повідомлень інструментів Telegram.
- `channels.telegram.actions.deleteMessage`: gating видалення повідомлень інструментів Telegram.
- `channels.telegram.actions.sticker`: gating дій зі стікерами Telegram — надсилання та пошук (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — визначає, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — визначає рівень можливостей реакцій агента (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — визначає поведінку відповідей про помилки (за замовчуванням: `reply`). Підтримуються перевизначення для окремих облікових записів/груп/тем.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями про помилки в тому самому чаті (за замовчуванням: `60000`). Запобігає спаму помилок під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Важливі поля саме для Telegram:

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- запис/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналу](/uk/channels/channel-routing)
- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
