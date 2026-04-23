---
read_when:
    - Робота над функціями Telegram або Webhookами
summary: Статус підтримки бота Telegram, можливості та налаштування
title: Telegram
x-i18n:
    generated_at: "2026-04-23T08:40:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до використання в production для DM ботів і груп через grammY. Режим long polling є типовим; режим webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Налаштування Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що хендл точно `@BotFather`).

    Виконайте `/newbot`, дотримуйтеся підказок і збережіть токен.

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

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише для типового облікового запису).
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
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним варіантом через env, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групах">
    Для ботів Telegram типовим є **Privacy Mode**, який обмежує, які повідомлення в групах вони отримують.

    Якщо бот має бачити всі повідомлення в групі, зробіть одне з такого:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть бота з кожної групи та додайте його знову, щоб Telegram застосував зміну.

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

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (типово)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` підтримуються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у вигляді `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен Telegram-бота).
    Якщо раніше ви покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи до `channels.telegram.allowFrom` у сценаріях allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` із явними числовими ID в `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень підключення).

    Поширена плутанина: схвалення підключення DM не означає, що «цей відправник авторизований всюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах і надалі визначається лише явними allowlist у config.
    Якщо ви хочете, щоб «я авторизований один раз і працюють і DM, і команди в групах», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

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

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо він не заданий, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів слід розміщувати в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групах **не** успадковує схвалення з DM pairing-store.
    Підключення залишається лише для DM. Для груп задавайте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до pairing store.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте потрібні групи через `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime типово працює в режимі fail-closed з `groupPolicy="allowlist"`, якщо явно не задано `channels.defaults.groupPolicy`.

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

      - Розміщуйте від’ємні ID груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Розміщуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, якщо хочете обмежити, які люди всередині дозволеної групи можуть викликати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадування">
    Відповіді в групах типово вимагають згадування.

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

    Як отримати ID чату групи:

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільну оболонку каналу з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб зберігати ізоляцію тем.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх за ключами сесій з урахуванням тредів і зберігає ID треду для відповідей.
- Long polling використовує grammY runner із послідовною обробкою для кожного чату/треду. Загальна конкурентність sink у runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують типово після 120 секунд без завершеного сигналу живості `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще виникають хибні перезапуски через зупинку polling під час довготривалої роботи. Значення задається в мілісекундах і може бути від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може передавати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (типово: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи повторно використовуються оновлення інструментів/прогресу в тому самому відредагованому повідомленні попереднього перегляду (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` зіставляються автоматично

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, медіаповідомлень) OpenClaw повертається до звичайної фінальної доставки, а потім прибирає повідомлення попереднього перегляду.

    Потокова передача попереднього перегляду відокремлена від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної потокової передачі.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено типово, його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте користувацькі записи меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Резервне копіювання Git" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - назви нормалізуються (забирається початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та журналюються

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе одно можуть працювати при введенні вручну, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди/команди plugin все одно можуть реєструватися, якщо це налаштовано.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене навіть після скорочення; зменште кількість команд plugin/skill/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідний DNS/HTTPS доступ до `api.telegram.org` заблокований.

    ### Команди підключення пристрою (`device-pair` plugin)

    Коли встановлено plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують підтвердження (включно з роллю/областями доступу)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap token. Вбудована передача bootstrap зберігає токен primary node на рівні `scopes: []`; будь-який переданий operator token залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scopes мають префікс ролі, тому цей allowlist для operator задовольняє лише запити operator; для ролей, що не є operator, усе ще потрібні scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад, role/scopes/public key), попередній запит, що очікує, замінюється, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

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
    - `allowlist` (типово)

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

    Керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (типово: вимкнено)

    Примітка: `edit` і `topic-create` наразі типово увімкнені й не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторного визначення SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги тредингу відповідей">
    Telegram підтримує явні теги тредингу відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке ініціювало дію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Примітка: `off` вимикає неявний threading відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка тредів">
    Супергрупи форумів:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору тексту спрямовуються в тред теми
    - шлях config для тем:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок для загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` призначений лише для тем і не успадковується з типових значень групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може спрямовуватися до іншого агента через встановлення `agentId` у config теми. Це надає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Рев’ю коду → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані ACP bindings верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з указанням теми на кшталт `-1001234567890:topic:42`). Наразі це обмежено темами форумів у групах/супергрупах. Див. [ACP Agents](/uk/tools/acp-agents).

    **Прив’язаний до треду запуск ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження запуску в самій темі. Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблонів надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають DM-маршрутизацію, але використовують ключі сесій з урахуванням тредів.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - типово: поведінка аудіофайлу
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

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити кількість повторних викликів vision.

    Увімкніть дії для стікерів:

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від payload повідомлень).

    Коли цю функцію ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають механізми контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID тредів в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи форуму маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний emoji з identity агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode emoji (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи config з подій і команд Telegram">
    Записи в config каналу типово увімкнені (`configWrites !== false`).

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

  <Accordion title="Long polling чи webhook">
    Типово використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; також необов’язково `webhookPath`, `webhookHost`, `webhookPort` (типові значення: `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний listener прив’язується до `127.0.0.1:8787`. Для публічного ingress або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY).
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте в межах `30000`–`600000` лише для хибнопозитивних перезапусків через зупинку polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає цю функцію.
    - Додатковий контекст reply/quote/forward наразі передається як отримано.
    - Telegram allowlist здебільшого визначають, хто може викликати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль надсилання CLI може бути числовим ID чату або username:

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

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запитати закріплену доставку, коли бот може закріплювати повідомлення в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стислих фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з polls
    - `channels.telegram.actions.poll=false` вимикає створення polls у Telegram, залишаючи звичайне надсилання увімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM затверджувачів і за бажанням може публікувати запити у вихідному чаті або темі. Затверджувачі мають бути числовими ID користувачів Telegram.

    Шлях config:

    - `channels.telegram.execApprovals.enabled` (вмикається автоматично, коли вдається визначити принаймні одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (використовує як резервний варіант числові ID власників із `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту на погодження та подальшої взаємодії. Погодження exec типово спливають через 30 хвилин.

    Вбудовані кнопки погодження також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID погоджень із префіксом `plugin:` визначаються через погодження plugin; інші спочатку визначаються через погодження exec.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями на помилки

Коли агент стикається з помилкою доставки або помилкою провайдера, Telegram може або відповісти текстом помилки, або приглушити її. Цю поведінку керують два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає до чату зрозуміле повідомлення про помилку. `silent` повністю приглушує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями з помилками в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, групи та теми (таке саме успадкування, як і для інших ключів config Telegram).

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
  <Accordion title="Бот не відповідає на повідомлення в групі без згадування">

    - Якщо `requireMention=false`, режим конфіденційності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота з групи та додайте його знову
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадування.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити через probe членства.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow`, щоб знайти причини пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або зовсім не працюють">

    - авторизуйте свою ідентичність відправника (pairing та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку визначають `api.telegram.org` в IPv6; несправний вихід через IPv6 може спричиняти переривчасті збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі спроби як відновлювані мережеві помилки.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеного сигналу живості long poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` є здоровими, але ваш хост усе ще повідомляє про хибні перезапуски через зупинку polling. Постійні зупинки зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS-виходу між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

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
      для завантажень медіа Telegram. Якщо довірений fake-IP або
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
      dangerous flag вимкненим. Медіа Telegram уже типово дозволяє діапазон
      benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист
      Telegram media SSRF. Використовуйте його лише в довірених, контрольованих оператором proxy-середовищах,
      таких як fake-IP-маршрутизація Clash, Mihomo або Surge, коли вони
      синтезують приватні або special-use відповіді поза діапазоном
      benchmark RFC 2544. Для звичайного публічного доступу Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасові):
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

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: зчитувати токен зі шляху до звичайного файлу. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). `allowlist` вимагає принаймні один ID відправника. `open` вимагає `"*"`. `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID і може відновити записи allowlist з файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення polls у Telegram (типово: увімкнено; все одно потрібен `sendMessage`).
- `channels.telegram.defaultTo`: типова ціль Telegram, яку використовує CLI `--deliver`, коли не вказано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID. Нечислові записи ігноруються під час auth. Auth груп не використовує резервний варіант DM pairing-store (`2026.2.25+`).
- Пріоритет для кількох облікових записів:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію.
  - Якщо не задано жодного з них, OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` показує попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задані.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: типові значення для кожної групи + allowlist (використовуйте `"*"` для глобальних типових значень).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення groupPolicy для конкретної групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типове керування вимогою згадування.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (пропущено = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для конкретної групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимикає групу, якщо `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для кожної теми (поля групи + `agentId`, який доступний лише для тем).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: спрямувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення groupPolicy для конкретної теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення вимоги згадування для конкретної теми.
- `bindings[]` верхнього рівня з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійного прив’язування тем ACP (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: спрямувати теми DM до конкретного агента (така сама поведінка, як для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як клієнт погодження exec на основі чату для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено погоджувати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже визначає власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (типово: `dm`). `channel` і `both` зберігають вихідну тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на погодження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на погодження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації погоджень exec у Telegram і авторизації затверджувачів для конкретного облікового запису.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (типово: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для конкретного облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (типово: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідних фрагментів (символи).
- `channels.telegram.chunkMode`: `length` (типово) або `newline`, щоб ділити за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (типово: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (попередній перегляд live stream; типово: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом preview). Потоковий preview у Telegram використовує одне повідомлення preview, яке редагується на місці.
- `channels.telegram.streaming.preview.toolProgress`: повторно використовувати повідомлення live preview для оновлень tool/progress, коли активний потоковий preview (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення tool/progress.
- `channels.telegram.mediaMaxMb`: обмеження вхідних/вихідних медіа Telegram (МБ, типово: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). Типово увімкнено в Node 22+, а у WSL2 типово вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). Типово `ipv4first` у Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ із fake-IP або transparent proxy, де завантаження медіа Telegram визначають `api.telegram.org` як приватні/внутрішні/special-use адреси поза типово дозволеним діапазоном benchmark RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потрібен `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях webhook (типово `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язування webhook (типово `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язування webhook (типово `8787`).
- `channels.telegram.actions.reactions`: керування реакціями інструментів Telegram.
- `channels.telegram.actions.sendMessage`: керування надсиланням повідомлень інструментів Telegram.
- `channels.telegram.actions.deleteMessage`: керування видаленням повідомлень інструментів Telegram.
- `channels.telegram.actions.sticker`: керування діями зі стікерами Telegram — надсилання і пошук (типово: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує тим, які реакції запускають системні події (типово: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливостями агента щодо реакцій (типово: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповідей на помилки (типово: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями на помилки в тому самому чаті (типово: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник з конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Telegram-специфічні поля з високою цінністю:

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/відповіді: `replyToMode`
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
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
