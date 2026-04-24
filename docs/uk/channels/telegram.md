---
read_when:
    - Робота над функціями Telegram або Webhook-ами
summary: Стан підтримки Telegram-бота, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-24T03:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

Готово до продакшн-використання для DM ботів і груп через grammY. Long polling — режим за замовчуванням; режим Webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — pairing.
  </Card>
  <Card title="Усунення неполадок каналу" icon="wrench" href="/uk/channels/troubleshooting">
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

    Резервне джерело через змінну середовища: `TELEGRAM_BOT_TOKEN=...` (лише для облікового запису за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди pairing спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена залежить від облікового запису. На практиці значення з config мають пріоритет над резервним значенням із середовища, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість групи">
    За замовчуванням боти Telegram працюють у **Privacy Mode**, що обмежує набір групових повідомлень, які вони отримують.

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

    - `/setjoingroups`, щоб дозволити або заборонити додавання до груп
    - `/setprivacy` для керування видимістю в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен Telegram-бота).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень pairing).

    Поширена плутанина: схвалення pairing для DM не означає, що «цей відправник авторизований усюди».
    Pairing надає доступ лише до DM. Авторизація відправника в групах і далі визначається явними allowlist у конфігурації.
    Якщо ви хочете, щоб «я був авторизований один раз і працювали і DM, і команди в групі», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Напишіть своєму боту в DM.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group ID
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи в `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram використовує резервне значення з `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення з pairing-store для DM.
    Pairing залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує резервне значення з `allowFrom` у config, а не з pairing store.
    Практичний шаблон для ботів з одним власником: укажіть свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom`, і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в fail-closed з `groupPolicy="allowlist"`, якщо лише явно не задано `channels.defaults.groupPolicy`.

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
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, якщо хочете обмежити, які саме люди всередині дозволеної групи можуть активувати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадувань">
    За замовчуванням відповіді в групі вимагають згадування.

    Згадування може надходити з:

    - нативного згадування `@botusername`, або
    - шаблонів згадування в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

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

    Отримання ID групового чату:

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка під час runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповіді назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються у спільний конверт каналу з метаданими відповідей і заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх з ключами сесій, що враховують thread, і зберігає ID thread для відповідей.
- Long polling використовує runner grammY із послідовністю на рівні чату/thread. Загальна конкурентність sink runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують після 120 секунд без завершеної перевірки життєздатності `getUpdates` за замовчуванням. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні й далі трапляються хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і допускається в діапазоні від `30000` до `600000`; підтримуються перевизначення на рівні облікового запису.
- Telegram Bot API не підтримує read receipt (`sendReadReceipts` не застосовується).

## Довідка щодо можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram мапиться на `partial` (для сумісності з міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи перевикористовують оновлення інструментів/прогресу те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично мапляться

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)
    - group/topic: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, медіаповідомлень) OpenClaw повертається до звичайної фінальної доставки, а потім очищує повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від block streaming. Коли для Telegram явно увімкнено block streaming, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного стримінгу.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерування
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення для нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте користувацькі пункти меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Правила:

    - назви нормалізуються (видаляється початковий `/`, перетворюються на нижній регістр)
    - коректний шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та журналюються

    Примітки:

    - користувацькі команди — це лише пункти меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе ще можуть працювати при ручному введенні, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене навіть після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідні DNS/HTTPS-запити до `api.telegram.org` заблоковано.

    ### Команди pairing пристроїв (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують на розгляд (включно з роллю/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує на розгляд
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap token. Вбудована передача bootstrap зберігає token primary Node на `scopes: []`; будь-який переданий operator token залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope використовують префікси ролей, тому цей allowlist operator задовольняє лише запити operator; для не-operator ролей усе ще потрібні scopes під їхнім власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад, role/scopes/public key), попередній запит, що очікує на розгляд, заміщується, а новий запит отримує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Застаріле `capabilities: ["inlineButtons"]` мапиться на `inlineButtons: "all"`.

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

    Дії повідомлень каналу надають ергономічні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керувальні перемикачі:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке активувало обробку
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявне прив’язування до потоку відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій теми додають `:topic:<threadId>`
    - відповіді й індикатор набору спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень не включає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` належить лише темі й не успадковується з типових значень групи.

    **Маршрутизація агента для кожної теми**: кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у конфігурації теми. Це надає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → main агент
                "3": { agentId: "zu" },        // Тема розробки → zu агент
                "5": { agentId: "coder" }      // Перевірка коду → coder агент
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка теми ACP**: теми форуму можуть закріплювати сесії harness ACP через typed ACP bindings верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та id з указаною темою, як-от `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [ACP Agents](/uk/tools/acp-agents).

    **Прив’язане до потоку створення ACP з чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження створення в самій темі. Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сесій з урахуванням thread.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє voice notes та audio files.

    - за замовчуванням: поведінка audio file
    - тег `[[audio_as_voice]]` у відповіді агента, щоб примусово надсилати як voice note

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

    Telegram розрізняє video files і video notes.

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

    Video notes не підтримують captions; наданий текст повідомлення надсилається окремо.

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
  query: "cat waving",
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
    - Події реакцій усе одно дотримуються механізмів керування доступом Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - групи не-форумів маршрутизуються до сесії групового чату
      - групи-форуми маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує emoji в unicode (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис конфігурації з подій і команд Telegram">
    Запис конфігурації каналу ввімкнено за замовчуванням (`configWrites !== false`).

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

  <Accordion title="Long polling чи Webhook">
    За замовчуванням використовується long polling. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язково `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний listener прив’язується до `127.0.0.1:8787`. Для публічного ingress або встановіть reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Обмеження, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY).
    - Типове значення `channels.telegram.pollingStallThresholdMs` — `120000`; налаштовуйте в діапазоні від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає її.
    - Додатковий контекст reply/quote/forward наразі передається як отримано.
    - Telegram allowlist головним чином визначають, хто може активувати агента, а не є повноцінною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціллю надсилання в CLI може бути числовий ID чату або username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram polling використовує `openclaw message poll` і підтримує теми форуму:

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

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, якщо це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати повідомлення в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, зокрема poll
    - `channels.telegram.actions.poll=false` вимикає створення poll у Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM для approver і за бажанням може публікувати запити у вихідному чаті або темі. Approver мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли вдається визначити принаймні одного approver)
    - `channels.telegram.execApprovals.approvers` (використовує як резервне значення числові ID власників із `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту на погодження та подальшого повідомлення. За замовчуванням погодження exec спливають через 30 хвилин.

    Вбудовані кнопки погодження також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID погоджень із префіксом `plugin:` визначаються через погодження Plugin; решта спочатку визначаються через погодження exec.

    Див. [Погодження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або помилкою провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку визначають два ключі конфігурації:

| Ключ                                | Значення          | За замовчуванням | Опис                                                                                              |
| ----------------------------------- | ----------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`          | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`          | Мінімальний інтервал між відповідями про помилки в одному й тому самому чаті. Запобігає спаму помилками під час збоїв. |

Підтримуються перевизначення на рівні облікового запису, групи та теми (таке саме успадкування, як і для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // пригнічує помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення в групі без згадування">

    - Якщо `requireMention=false`, режим конфіденційності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота й додайте його знову в групу
    - `openclaw channels status` попереджає, коли конфігурація очікує повідомлення групи без згадування.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; членство для шаблону `"*"` перевірити не можна.
    - швидка перевірка сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот зовсім не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow`, щоб побачити причини пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (pairing і/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть якщо політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню містить забагато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками мережі/fetch зазвичай вказує на проблеми з доступністю DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ разом із користувацьким fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку визначають `api.telegram.org` у IPv6; несправний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо в логах є `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі спроби як відновлювані мережеві помилки.
    - Якщо в логах є `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long polling за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довгі виклики `getUpdates` працюють коректно, але ваш хост усе одно повідомляє про хибнопозитивні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
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

    - Відповіді з діапазону RFC 2544 benchmark (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантажень медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      private/internal/special-use адресу під час завантажень медіа, ви можете
      явно ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне на рівні облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає хости медіа Telegram в `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяють
      діапазон benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист
      Telegram media від SSRF. Використовуйте його лише в довірених середовищах proxy,
      що контролюються оператором, як-от Clash, Mihomo або Surge fake-IP routing, коли вони
      синтезують private або special-use відповіді поза діапазоном benchmark RFC 2544.
      Для звичайного публічного доступу Telegram через інтернет залишайте його вимкненим.
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

Більше допомоги: [Усунення неполадок каналу](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Ключові поля Telegram">

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
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

</Accordion>

<Note>
Пріоритет у багатокористувацькому режимі: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію. Інакше OpenClaw використовує перший нормалізований ID облікового запису, а `openclaw doctor` видає попередження. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Маршрутизація каналу" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте групи й теми з агентами.
  </Card>
  <Card title="Усунення неполадок" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
