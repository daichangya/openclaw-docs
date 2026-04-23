---
read_when:
    - Робота над функціями Telegram або Webhook-ами
summary: Статус підтримки бота Telegram, можливості та налаштування
title: Telegram
x-i18n:
    generated_at: "2026-04-23T00:49:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до використання у production для бот-DM + груп через grammY. Long polling — режим за замовчуванням; режим Webhook — необов’язковий.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Налаштування Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат з **@BotFather** (переконайтеся, що це саме `@BotFather`).

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

  <Step title="Запустіть gateway і схваліть перший DM">

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
  <Accordion title="Режим приватності та видимість у групах">
    За замовчуванням боти Telegram працюють у **Privacy Mode**, який обмежує, які повідомлення в групах вони отримують.

    Якщо бот має бачити всі повідомлення в групі, зробіть одне з такого:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть бота з кожної групи й додайте знову, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Керування доступом та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до приватних повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою конфігурації.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб їх розв’язати (best-effort; потрібен токен Telegram bot).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень підключення).

    Типова плутанина: схвалення підключення DM не означає, що «цей відправник авторизований всюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах і далі визначається явними allowlist у config.
    Якщо ви хочете, щоб «я один раз авторизувався, і працюють і DM, і команди в групі», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram використовує резервне значення з `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються під час авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення pairing-store для DM.
    Підключення залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує резервне значення з config `allowFrom`, а не з pairing store.
    Практичний шаблон для ботів з одним власником: вкажіть свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте потрібні групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в fail-closed режимі з `groupPolicy="allowlist"`, якщо тільки `channels.defaults.groupPolicy` не задано явно.

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
      Типова помилка: `groupAllowFrom` — це не allowlist груп Telegram.

      - Вказуйте від’ємні ID груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, хто саме всередині дозволеної групи може звертатися до бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадувань">
    Відповіді в групах за замовчуванням вимагають згадування.

    Згадування може надходити з:

    - нативного згадування `@botusername`, або
    - шаблонів згадування в:
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

    - переслати повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитати `chat.id` з `openclaw logs --follow`
    - або перевірити Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не обирає канали).
- Вхідні повідомлення нормалізуються до спільного envelope каналу з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх із thread-aware ключами сесій і зберігає ID потоку для відповідей.
- Long polling використовує grammY runner із послідовною обробкою для кожного чату/потоку. Загальна sink-конкурентність runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують за замовчуванням після 120 секунд без завершеної liveness-перевірки `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще виникають хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і допускається в межах від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідка щодо функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - приватні чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальними назвами)
    - `streaming.preview.toolProgress` керує тим, чи використовують оновлення інструментів/прогресу те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Встановіть `false`, щоб залишати окремі повідомлення інструментів/прогресу.
    - застарілі значення `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Для відповідей, що містять лише текст:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, з медіапейлоадами) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Streaming попереднього перегляду відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає попередній stream, щоб уникнути подвійного streaming.

    Якщо нативний транспорт чернетки недоступний/відхилений, OpenClaw автоматично використовує резервний варіант `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live preview під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та HTML fallback">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в HTML, безпечний для Telegram.
    - Необроблений HTML моделі екранується, щоб зменшити кількість помилок розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Нативні команди за замовчуванням:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додавання користувацьких записів у меню команд:

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

    - назви нормалізуються (видаляється початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та логуються

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди plugin/skill можуть і далі працювати при ручному введенні, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі команди/команди plugin усе ще можуть реєструватися, якщо це налаштовано.

    Типові збої під час налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram все ще переповнене після скорочення; зменште кількість команд plugin/skill/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблокований.

    ### Команди підключення пристрою (`device-pair` plugin)

    Коли встановлено plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунку iOS
    3. `/pair pending` показує список запитів, що очікують підтвердження (включно з роллю/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує підтвердження
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap token. Вбудована передача bootstrap зберігає token primary node на рівні `scopes: []`; будь-який переданий operator token залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікси ролей, тому цей allowlist operator задовольняє лише запити operator; ролям, що не є operator, усе ще потрібні scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад роль/scopes/public key), попередній запит, що очікує підтвердження, заміщується, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

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

    Застарілий варіант `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

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

  <Accordion title="Дії повідомлень Telegram для агентів та автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керувальні параметри:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке ініціювало взаємодію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявне threading відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи з форумом:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатори набору тексту спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` належить лише темі й не успадковується з параметрів групи за замовчуванням.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента, якщо задати `agentId` у конфігурації теми. Це надає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані ACP-прив’язки верхнього рівня:

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

    Наразі це обмежено темами форумів у групах і супергрупах.

    **Прив’язаний до потоку запуск ACP із чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішної прив’язки OpenClaw закріплює повідомлення-підтвердження запуску в цій темі.
    - Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоку DM:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують thread-aware ключі сесій/цілі відповідей.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосову нотатку

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

    Увімкніть дії зі стікерами:

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від пейлоадів повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе ще враховують контроль доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоків в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи форумів маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує emoji у форматі unicode (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції групи (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
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

  <Accordion title="Long polling vs Webhook">
    За замовчуванням: long polling.

    Режим Webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, коли задано URL Webhook)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Локальний listener за замовчуванням для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, розмістіть перед нею reverse proxy і вкажіть публічний URL у `webhookUrl`.
    Укажіть `webhookHost` (наприклад `0.0.0.0`), коли вам навмисно потрібен зовнішній вхідний доступ.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та CLI-цілі">
    - значення `channels.telegram.textChunkLimit` за замовчуванням — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, використовується значення grammY за замовчуванням).
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається як отримано.
    - allowlist у Telegram насамперед обмежують, хто може запускати агента, а не є повноцінною межею редагування додаткового контексту.
    - параметри історії DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль CLI-надсилання може бути числовим ID чату або username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll використовують `openclaw message poll` і підтримують теми форуму:

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

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, якщо бот може закріплювати повідомлення в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи, а не як стиснені фото або завантаження анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з poll
    - `channels.telegram.actions.poll=false` вимикає створення Telegram poll, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM погоджувачів і за потреби може публікувати запити на погодження в початковому чаті або темі.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; резервно використовуються числові ID власників, визначені з `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Погоджувачі мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні погодження exec, коли `enabled` не задано або дорівнює `"auto"` і можна визначити принаймні одного погоджувача — або з `execApprovals.approvers`, або з числової конфігурації власника облікового запису (`allowFrom` і `defaultTo` для прямих повідомлень). Установіть `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт погодження. В інших випадках запити на погодження резервно переходять до інших налаштованих маршрутів погодження або до політики fallback погодження exec.

    Telegram також відтворює спільні кнопки погодження, що використовуються іншими чат-каналами. Нативний адаптер Telegram переважно додає маршрутизацію DM погоджувача, fanout у канал/тему та підказки набору тексту перед доставкою.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат tool вказує,
    що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

    Правила доставки:

    - `target: "dm"` надсилає запити на погодження лише в DM визначеним погоджувачам
    - `target: "channel"` надсилає запит назад у початковий чат/тему Telegram
    - `target: "both"` надсилає і в DM погоджувачам, і в початковий чат/тему

    Лише визначені погоджувачі можуть погодити або відхилити. Ті, хто не є погоджувачами, не можуть використовувати `/approve` і не можуть користуватися кнопками погодження Telegram.

    Поведінка визначення погодження:

    - ID з префіксом `plugin:` завжди визначаються через погодження plugin.
    - Інші ID спочатку пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизований для погоджень plugin і gateway повідомляє,
      що погодження exec невідоме/прострочене, Telegram ще раз пробує через
      `plugin.approval.resolve`.
    - Реальні відмови/помилки погодження exec не переходять мовчки до визначення
      погодження plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит надходить у тему форуму, OpenClaw зберігає тему як для запиту на погодження, так і для подальших дій після погодження. За замовчуванням погодження exec діють 30 хвилин.

    Вбудовані кнопки погодження також залежать від того, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Погодження exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями на помилки

Коли агент стикається з помилкою доставки або помилкою провайдера, Telegram може або відповісти текстом помилки, або приховати його. Цю поведінку керують два ключі конфігурації:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає до чату дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний інтервал між відповідями з помилками в тому самому чаті. Запобігає спаму помилок під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, окремої групи та окремої теми (те саме успадкування, що й для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // пригнічувати помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення в групі без згадування">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота з групи й додайте знову
    - `openclaw channels status` попереджає, коли config очікує повідомлень групи без згадування.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити через membership probe.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлень групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють зовсім">

    - авторизуйте свою ідентичність відправника (підключення та/або числовий `allowFrom`)
    - авторизація команд усе ще застосовується, навіть коли політика групи `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть спричиняти негайне скасування, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку резолвиться в IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі помилки як відновлювані мережеві помилки.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної liveness-перевірки long poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми з proxy, DNS, IPv6 або TLS-виходом між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або йому явно краще працювати лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з benchmark-range RFC 2544 (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантаження медіа Telegram. Якщо довірений fake-IP або
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
    - Якщо ваш proxy резолвить медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяють діапазон benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише в довірених керованих оператором proxy-середовищах,
      таких як Clash, Mihomo або Surge fake-IP routing, коли вони синтезують приватні
      або special-use відповіді поза межами діапазону benchmark RFC 2544. Для звичайного публічного доступу Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через змінні середовища (тимчасово):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірка DNS-відповідей:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Додаткова допомога: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники на довідник конфігурації Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: прочитати токен зі шляху до звичайного файла. Symlink-і відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: allowlist DM (числові ID користувачів Telegram). `allowlist` вимагає принаймні один ID відправника. `open` вимагає `"*"`. `openclaw doctor --fix` може розв’язати застарілі записи `@username` до ID і може відновити записи allowlist з файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення Telegram poll (за замовчуванням: увімкнено; усе ще потребує `sendMessage`).
- `channels.telegram.defaultTo`: ціль Telegram за замовчуванням, яку CLI `--deliver` використовує, коли не вказано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може розв’язати застарілі записи `@username` до ID. Нечислові записи ігноруються під час auth. Авторизація груп не використовує fallback до pairing-store для DM (`2026.2.25+`).
- Пріоритетність multi-account:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням.
  - Якщо не задано жодне з них, OpenClaw резервно використовує перший нормалізований ID облікового запису, а `openclaw doctor` показує попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задані.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: значення за замовчуванням для окремих груп + allowlist (використовуйте `"*"` для глобальних значень за замовчуванням).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення groupPolicy для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: значення за замовчуванням для керування згадуваннями.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (пропущено = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимкнути групу, коли `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + поле теми `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію рівня групи та bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення groupPolicy для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення керування згадуваннями для окремої теми.
- верхньорівневий `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійної ACP-прив’язки теми (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (та сама поведінка, що й у тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як chat-based клієнт погодження exec для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено погоджувати або відхиляти exec-запити. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже визначає власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають початкову тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для переспрямованих запитів на погодження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для переспрямованих запитів на погодження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації погодження exec у Telegram і авторизації погоджувачів для окремого облікового запису.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного chunk (символи).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (попередній перегляд live stream; за замовчуванням: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом попереднього перегляду). Preview streaming у Telegram використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.streaming.preview.toolProgress`: повторно використовувати повідомлення live preview для оновлень tool/progress, коли preview streaming активний (за замовчуванням: `true`). Встановіть `false`, щоб залишати окремі повідомлення tool/progress.
- `channels.telegram.mediaMaxMb`: обмеження медіа Telegram для вхідних/вихідних даних (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних засобів надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а в WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок DNS-результатів (`ipv4first` або `verbatim`). За замовчуванням у Node 22+ використовується `ipv4first`.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent-proxy, де завантаження медіа Telegram резолвлять `api.telegram.org` у приватні/внутрішні/special-use адреси поза стандартно дозволеним діапазоном benchmark RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потребує `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний host прив’язки Webhook (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний port прив’язки Webhook (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: керування реакціями tool у Telegram.
- `channels.telegram.actions.sendMessage`: керування надсиланням повідомлень tool у Telegram.
- `channels.telegram.actions.deleteMessage`: керування видаленням повідомлень tool у Telegram.
- `channels.telegram.actions.sticker`: керування діями зі стікерами Telegram — надсилання і пошук (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керування тим, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керування можливістю агента працювати з реакціями (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керування поведінкою відповідей на помилки (за замовчуванням: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями з помилками в тому самому чаті (за замовчуванням: `60000`). Запобігає спаму помилок під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Поля Telegram з найвищим сигналом:

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink-і відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
