---
read_when:
    - Робота над функціями Telegram або Webhookами
summary: Статус підтримки Telegram bot, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-25T04:07:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41d835e7b50a3a38fed62f252b1810475204beca4a4dd0f2b42ddaa3507deeab
    source_path: channels/telegram.md
    workflow: 15
---

Готово до використання в продакшені для DM бота та груп через grammY. За замовчуванням використовується режим long polling; режим Webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що хендл точно `@BotFather`).

    Запустіть `/newbot`, дотримуйтесь підказок і збережіть токен.

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

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди підключення дійсні 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до своєї моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним значенням з env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групах">
    За замовчуванням Telegram-боти працюють у **Privacy Mode**, який обмежує, які повідомлення з груп вони отримують.

    Якщо бот має бачити всі повідомлення групи, виконайте одну з дій:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть бота з кожної групи й додайте його знову, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` — дозволити або заборонити додавання до груп
    - `/setprivacy` — поведінка видимості в групах

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

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється під час валідації конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у форматі `@username`, запустіть `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен Telegram-бота).
    Якщо ви раніше покладалися на файли allowlist зі сховища підключень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень підключення).

    Поширена плутанина: схвалення підключення DM не означає, що «цей відправник авторизований всюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах усе ще походить із явних allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз, і працювали і DM, і команди в групах», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Запустіть `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - із `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - із `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не встановлено, Telegram повертається до `allowFrom`.
    Елементи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID груп чи супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує схвалення зі сховища підключень DM.
    Підключення залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не встановлено, Telegram повертається до config `allowFrom`, а не до сховища підключень.
    Практичний шаблон для ботів з одним власником: вкажіть свій ID користувача в `channels.telegram.allowFrom`, не встановлюйте `groupAllowFrom` і дозвольте потрібні групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо лише `channels.defaults.groupPolicy` не встановлено явно.

    Приклад: дозволити будь-якого учасника в одній конкретній групі:

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

    Приклад: дозволити лише конкретних користувачів в одній конкретній групі:

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

      - Вказуйте від’ємні ID груп або супергруп Telegram, наприклад `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, наприклад `8734062810`, у `groupAllowFrom`, коли хочете обмежити, хто саме в межах дозволеної групи може викликати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    За замовчуванням відповіді в групах потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для збереження використовуйте config.

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
    - або перевірте `getUpdates` у Bot API

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація є детермінованою: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільного конверта каналу з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх за thread-aware ключами сесій і зберігає ID потоку для відповідей.
- Long polling використовує grammY runner із послідовністю по чатах/потоках. Загальна конкурентність sink у runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують за замовчуванням після 120 секунд без завершеної перевірки живучості `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через зависання polling під час тривалої роботи. Значення задається в мілісекундах і допускається в межах від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (для сумісності з міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активний preview streaming)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки на кшталт «Working...», які показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлень планування або зведень патчів. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw починаючи з `v2026.4.22` і новіших версій. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Використовуйте `streaming.mode: "off"` лише тоді, коли хочете повністю вимкнути редагування попереднього перегляду в Telegram. Використовуйте `streaming.preview.toolProgress: false`, коли хочете вимкнути лише рядки стану прогресу інструментів.

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, із медіаконтентом) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Preview streaming відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного стримінгу.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live preview під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість збоїв парсингу в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням, його можна вимкнути за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram обробляється під час запуску через `setMyCommands`.

    Типові значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

Додайте власні записи до меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - назви нормалізуються (забирається початковий `/`, переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються і логуються

    Примітки:

    - власні команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе одно можуть працювати при ручному введенні, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Власні команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість команд Plugin/Skills/власних команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковані.

    ### Команди підключення пристрою (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують на розгляд (включно з роллю/областями доступу)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує на розгляд
       - `/pair approve latest` для найновішого

    Код налаштування містить короткостроковий bootstrap-токен. Вбудована передача bootstrap зберігає токен основного Node на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap-областей доступу мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; ролям, які не є оператором, усе ще потрібні області доступу під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/області доступу/публічний ключ), попередній запит, що очікує на розгляд, замінюється, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

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
  message: "Виберіть варіант:",
  buttons: [
    [
      { text: "Так", callback_data: "yes" },
      { text: "Ні", callback_data: "no" },
    ],
    [{ text: "Скасувати", callback_data: "cancel" }],
  ],
}
```

    Натискання callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії повідомлень Telegram для агентів та автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілок відповідей">
    Telegram підтримує явні теги гілок відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке спричинило виклик
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявні гілки відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору тексту спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок для загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначені (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` доступний лише для тем і не успадковується від типових значень групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через `agentId` у конфігурації теми. Це надає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Код-рев’ю → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з темою, наприклад `-1001234567890:topic:42`). Наразі це стосується лише тем форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Прив’язаний до потоку запуск ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди безпосередньо. OpenClaw закріплює підтвердження запуску в межах теми. Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають DM-маршрутизацію, але використовують thread-aware ключі сесій.

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

    - статичні WEBP: завантажуються та обробляються (заповнювач `<media:sticker>`)
    - анімовані TGS: пропускаються
    - відео WEBM: пропускаються

    Поля контексту стікера:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Файл кешу стікерів:

    - `~/.openclaw/telegram/sticker-cache.json`

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити повторні виклики vision.

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

    Пошук кешованих стікерів:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "кіт махає лапою",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від payload повідомлень).

    Коли це ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); від неавторизованих відправників вони відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - нефорумні групи маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної теми походження

    `allowed_updates` для polling/Webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode-емодзі (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібне ввімкнення команд)

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

  <Accordion title="Long polling проти Webhook">
    За замовчуванням використовується long polling. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язково: `webhookPath`, `webhookHost`, `webhookPort` (типові значення: `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного вхідного трафіку або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Значення `channels.telegram.textChunkLimit` за замовчуванням — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не встановлено, застосовується значення grammY за замовчуванням).
    - Значення `channels.telegram.pollingStallThresholdMs` за замовчуванням — `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає цю функцію.
    - Додатковий контекст відповіді/цитати/пересилання наразі передається як отримано.
    - Allowlist у Telegram насамперед визначають, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль надсилання в CLI може бути числовим chat ID або username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують теми форуму:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Прапорці опитувань лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Надсилання в Telegram також підтримує:

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, якщо це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, якщо бот має право закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стислих фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання увімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM затверджувачів і за потреби може публікувати запити у вихідному чаті або темі. Затверджувачі мають бути вказані як числові ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (використовує числові ID власника з `allowFrom` / `defaultTo`, якщо не встановлено явно)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту на підтвердження та подальшого обміну. За замовчуванням підтвердження exec спливають через 30 хвилин.

    Вбудовані кнопки підтвердження також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID підтверджень із префіксом `plugin:` визначаються через підтвердження Plugin; решта спочатку визначаються через підтвердження exec.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або придушити таку відповідь. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                | Значення          | За замовчуванням | Опис                                                                                           |
| ----------------------------------- | ----------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`          | `reply` надсилає в чат дружнє повідомлення про помилку. `silent` повністю придушує такі відповіді. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`          | Мінімальний час між відповідями про помилки в одному й тому самому чаті. Запобігає спаму помилок під час збоїв. |

Підтримуються перевизначення для окремих облікових записів, груп і тем (така сама схема успадкування, як і для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // придушити помилки в цій групі
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
      - потім видаліть бота з групи й додайте його знову
    - `openclaw channels status` попереджає, коли конфігурація очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство через probe.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (підключення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має занадто багато записів; зменште кількість команд Plugin/Skills/власних команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми з доступністю DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ разом із custom fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку визначається в IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо в логах є `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі спроби як відновлювані мережеві помилки.
    - Якщо в логах є `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки живучості long-polling за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише коли довгі виклики `getUpdates` працюють коректно, але ваш хост усе ще повідомляє про хибнопозитивні перезапуски через зависання polling. Постійні зависання зазвичай вказують на проблеми з proxy, DNS, IPv6 або TLS-виходом між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - У Node 22+ за замовчуванням використовується `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — це WSL2 або явно краще працює лише з IPv4-поведінкою, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 benchmark (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантажень медіафайлів Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      явно ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram як `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіафайли Telegram уже за замовчуванням дозволяють
      діапазон RFC 2544 benchmark.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише в довірених середовищах proxy, якими керує оператор,
      наприклад Clash, Mihomo або Surge fake-IP routing, коли вони
      синтезують приватні або special-use відповіді поза діапазоном RFC 2544 benchmark. Для звичайного публічного доступу до Telegram через інтернет залишайте цей параметр вимкненим.
    </Warning>

    - Перевизначення через змінні середовища (тимчасово):
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

Додаткова допомога: [Усунення проблем із каналами](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Ключові поля Telegram із високою інформативністю">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- стримінг: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет для кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` показує попередження. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключіть користувача Telegram до gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте групи й теми з агентами.
  </Card>
  <Card title="Усунення проблем" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
