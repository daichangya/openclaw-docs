---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Статус підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-21T00:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90a26051a3b7579e0d465c54bd3fac562d3442f6030b21e903cd4ec7fcf12e74
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до продакшну для DM бота + груп через grammY. Довге опитування — типовий режим; режим Webhook — необов’язковий.

<CardGroup cols={3}>
  <Card title="З’єднання" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — з’єднання.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат з **@BotFather** (переконайтеся, що ім’я користувача точно `@BotFather`).

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

    Резервне значення з env: `TELEGRAM_BOT_TOKEN=...` (лише для типового облікового запису).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть Gateway.

  </Step>

  <Step title="Запустіть Gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди з’єднання спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена залежить від облікового запису. На практиці значення з config мають пріоритет над резервним значенням з env, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групі">
    Для ботів Telegram типово ввімкнено **Privacy Mode**, який обмежує, які повідомлення в групі вони отримують.

    Якщо бот має бачити всі повідомлення в групі, зробіть одне з такого:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть і знову додайте бота в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для завжди активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` — дозволити/заборонити додавання до груп
    - `/setprivacy` — поведінка видимості в групі

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (типово)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist зі сховища з’єднань, `openclaw doctor --fix` може відновити записи до `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID в `allowFrom`, щоб політика доступу стабільно зберігалася в config (замість залежності від попередніх схвалень з’єднання).

    Поширена плутанина: схвалення з’єднання для DM не означає, що «цей відправник авторизований всюди».
    З’єднання надає доступ лише до DM. Авторизація відправника в групі, як і раніше, походить із явних allowlist у config.
    Якщо ви хочете «я один раз авторизований, і працюють і DM, і команди в групі», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менше приватності): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (типово): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (типово)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групі. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища з’єднань для DM.
    З’єднання залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до сховища з’єднань.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime типово працює в fail-closed режимі з `groupPolicy="allowlist"`, якщо лише `channels.defaults.groupPolicy` не задано явно.

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

    Приклад: дозволити лише певним користувачам в одній конкретній групі:

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
      - Вказуйте ID користувачів Telegram, наприклад `8734062810`, у `groupAllowFrom`, якщо хочете обмежити, хто саме всередині дозволеної групи може звертатися до бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише якщо хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадки">
    Відповіді в групі типово вимагають згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійності використовуйте config.

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

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу Gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються у спільний конверт каналу з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх із ключами сесії з урахуванням потоку та зберігає ID потоку для відповідей.
- Довге опитування використовує grammY runner із послідовністю на рівні чату/потоку. Загальна конкурентність sink runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для довгого опитування спрацьовують типово після 120 секунд без завершеної активності `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через зависання опитування під час довготривалої роботи. Значення задається в мілісекундах і допускається в межах від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує read receipt (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд живого потоку (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (типово: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - застарілі значення `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, із медіанавантаженням) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від block streaming. Коли block streaming для Telegram увімкнено явно, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Якщо нативний транспорт чернеток недоступний/відхилений, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у живий попередній перегляд під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний перехід на HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити збої розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено типово, його можна вимкнути за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram обробляється під час запуску через `setMyCommands`.

    Типові налаштування нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте користувацькі записи меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-резервна копія" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - імена нормалізуються (видалення початкового `/`, нижній регістр)
    - дійсний шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й логуються

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills все одно можуть працювати при ручному введенні, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані буде видалено. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої під час налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram все ще переповнене після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковані.

    ### Команди з’єднання пристрою (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують на розгляд (зокрема роль/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує на розгляд
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен primary Node на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікс ролі, тож цей allowlist оператора задовольняє лише запити оператора; ролям, які не є оператором, як і раніше потрібні scopes під префіксом їхньої власної ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад, role/scopes/public key), попередній запит, що очікує на розгляд, заміщується, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

    Докладніше: [З’єднання](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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
    - `allowlist` (типово)

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

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають ергономічні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (типово: вимкнено)

    Примітка: `edit` і `topic-create` наразі типово ввімкнені й не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання в runtime використовує активний знімок config/secrets (startup/reload), тож шляхи дій не виконують ad-hoc повторного визначення SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення-тригер
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Примітка: `off` вимикає неявний потік відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору тексту спрямовуються до потоку теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії індикатора набору тексту все одно містять `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` діє лише для теми й не успадковується з типових налаштувань групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через `agentId` у config теми. Це дає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → main агент
                "3": { agentId: "zu" },        // Тема розробки → zu агент
                "5": { agentId: "coder" }      // Рев’ю коду → coder агент
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через typed ACP bindings верхнього рівня:

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

    **Створення ACP, прив’язаного до потоку, з чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішного прив’язування OpenClaw закріплює повідомлення-підтвердження створення в межах теми.
    - Потрібен `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоків у DM:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сесій і цілі відповідей з урахуванням потоку.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові повідомлення та аудіофайли.

    - типово: поведінка аудіофайлу
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

    Telegram розрізняє відеофайли та video note.

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

    Video note не підтримують підписи; наданий текст повідомлення надсилається окремо.

    ### Стікери

    Обробка вхідних стікерів:

    - статичний WEBP: завантажується та обробляється (заповнювач `<media:sticker>`)
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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли це ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Додано реакцію Telegram: 👍 від Alice (@alice) на повідомлення 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають механізми керування доступом Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоків в оновленнях реакцій.
      - групи без форумів маршрутизуються до сесії групового чату
      - групи-форуми маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Підтверджувальні реакції">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний emoji з identity агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує emoji Unicode (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис config із подій і команд Telegram">
    Запис config каналу типово ввімкнено (`configWrites !== false`).

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

  <Accordion title="Довге опитування проти Webhook">
    Типово: довге опитування.

    Режим Webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, якщо задано webhook URL)
    - необов’язково `channels.telegram.webhookPath` (типово `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (типово `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (типово `8787`)

    Типовий локальний listener для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, поставте перед нею reverse proxy і спрямуйте `webhookUrl` на публічний URL.
    Задайте `webhookHost` (наприклад, `0.0.0.0`), якщо вам навмисно потрібен зовнішній вхідний доступ.

  </Accordion>

  <Accordion title="Обмеження, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожні рядки) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується типовий grammY).
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - Додатковий контекст відповіді/цитати/пересилання наразі передається як отримано.
    - Allowlist Telegram передусім контролюють, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціллю надсилання CLI може бути числовий ID чату або ім’я користувача:

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

    Надсилання Telegram також підтримує:

    - `--buttons` для вбудованих клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, зокрема опитування
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM затверджувачів і за бажанням може публікувати запити на погодження у вихідному чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; якщо не задано, використовується резервне визначення числових ID власників із `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`

    Затверджувачі мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і вдається визначити принаймні одного затверджувача — або з `execApprovals.approvers`, або з конфігурації числового власника облікового запису (`allowFrom` і direct-message `defaultTo`). Задайте `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт погодження. В іншому разі запити на погодження повертаються до інших налаштованих маршрутів погодження або до резервної політики погодження exec.

    Telegram також рендерить спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Telegram переважно додає маршрутизацію DM затверджувачів, fanout для каналів/тем і підказки набору тексту перед доставкою.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що погодження в чаті недоступні або єдиний шлях — ручне погодження.

    Правила доставки:

    - `target: "dm"` надсилає запити на погодження лише до DM визначених затверджувачів
    - `target: "channel"` надсилає запит назад у вихідний чат/тему Telegram
    - `target: "both"` надсилає і до DM затверджувачів, і до вихідного чату/теми

    Лише визначені затверджувачі можуть погоджувати або відхиляти. Користувачі, які не є затверджувачами, не можуть використовувати `/approve` і не можуть використовувати кнопки погодження Telegram.

    Поведінка визначення погодження:

    - ID з префіксом `plugin:` завжди визначаються через погодження Plugin.
    - Інші ID спочатку намагаються пройти через `exec.approval.resolve`.
    - Якщо Telegram також авторизований для погоджень Plugin і Gateway повідомляє,
      що погодження exec невідоме або строк його дії сплив,
      Telegram один раз повторює спробу через
      `plugin.approval.resolve`.
    - Справжні відмови/помилки погодження exec не переходять мовчки до
      визначення погодження Plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему і для запиту на погодження, і для подальших дій після погодження. Типово строк дії погоджень exec спливає через 30 хвилин.

    Вбудовані кнопки погодження також залежать від того, чи `channels.telegram.capabilities.inlineButtons` дозволяє цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Погодження exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями на помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає до чату дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями з помилками в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, окремої групи та окремої теми (з тим самим успадкуванням, що й інші ключі config Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // приглушити помилки в цій групі
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
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити через membership probe.
    - швидка перевірка сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють зовсім">

    - авторизуйте свою особу відправника (з’єднання та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку визначається в IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим egress/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ типово використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону benchmark RFC 2544 (`198.18.0.0/15`) уже типово дозволені
      для завантажень медіа Telegram. Якщо довірена схема fake-IP або
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
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Telegram media вже типово дозволяє діапазон
      benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media від SSRF. Використовуйте це лише в довірених середовищах proxy, що
      контролюються оператором, таких як fake-IP маршрутизація Clash, Mihomo або Surge,
      коли вони синтезують приватні або special-use відповіді поза діапазоном
      benchmark RFC 2544. Для звичайного публічного доступу Telegram через інтернет
      залишайте цей параметр вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасово):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірка відповідей DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Більше допомоги: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники довідника config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файла. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). `allowlist` вимагає принаймні один ID відправника. `open` вимагає `"*"`. `openclaw doctor --fix` може визначити застарілі записи `@username` як ID і може відновити записи allowlist з файлів pairing-store у потоках міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення опитувань Telegram (типово: увімкнено; усе ще потребує `sendMessage`).
- `channels.telegram.defaultTo`: типова ціль Telegram, яку використовує CLI `--deliver`, коли не вказано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групі (числові ID користувачів Telegram). `openclaw doctor --fix` може визначити застарілі записи `@username` як ID. Нечислові записи ігноруються під час auth. Групова auth не використовує резервний механізм DM pairing-store (`2026.2.25+`).
- Пріоритетність для кількох облікових записів:
  - Якщо налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію.
  - Якщо не задано жодного з них, OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` видає попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задано.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: типові значення для окремих груп + allowlist (використовуйте `"*"` для глобальних типових значень).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення `groupPolicy` для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типове обмеження за згадкою.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (пропущено = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимкнути групу, якщо `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + `agentId` лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення `groupPolicy` для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення обмеження за згадкою для окремої теми.
- `bindings[]` верхнього рівня з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійного прив’язування тем ACP (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (така сама поведінка, як і для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як чат-клієнт погодження exec для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено погоджувати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже визначає власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (типово: `dm`). `channel` і `both` зберігають вихідну тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на погодження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на погодження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації погоджень exec у Telegram та авторизації затверджувачів для окремого облікового запису.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (типово: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (типово: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.telegram.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (типово: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (попередній перегляд живого потоку; типово: `partial`; `progress` відповідає `partial`; `block` — сумісність із застарілим режимом попереднього перегляду). Попередній перегляд потоку Telegram використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.mediaMaxMb`: обмеження вхідних/вихідних медіа Telegram (МБ, типово: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). Типово ввімкнено в Node 22+, а в WSL2 типово вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). Типово `ipv4first` у Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent proxy, де завантаження медіа Telegram визначають `api.telegram.org` у приватні/внутрішні/special-use адреси поза типовим дозволеним benchmark-діапазоном RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потребує `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (типово `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язки Webhook (типово `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язки Webhook (типово `8787`).
- `channels.telegram.actions.reactions`: керування реакціями інструментів Telegram.
- `channels.telegram.actions.sendMessage`: керування надсиланням повідомлень інструментами Telegram.
- `channels.telegram.actions.deleteMessage`: керування видаленням повідомлень інструментами Telegram.
- `channels.telegram.actions.sticker`: керування діями зі стікерами Telegram — надсилання та пошук (типово: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує, які реакції запускають системні події (типово: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливостями реакцій агента (типово: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповіді на помилки (типово: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями з помилками в тому самому чаті (типово: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Telegram-специфічні поля з високим сигналом:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- потокове передавання: `streaming` (попередній перегляд), `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [З’єднання](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
