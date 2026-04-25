---
read_when:
    - Робота над можливостями Telegram або Webhook
summary: Статус підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-25T07:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8401457440f52a1c8342d650d8dedb363639bc1cda0c1bbe7150d2b243c09087
    source_path: channels/telegram.md
    workflow: 15
---

Через grammY готово до продакшну для DM бота та груп. Long polling — режим за замовчуванням; режим Webhook — необов’язковий.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що ім’я користувача точно `@BotFather`).

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
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть Gateway.

  </Step>

  <Step title="Запустіть Gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди підключення дійсні протягом 1 години.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до вашої групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним варіантом через env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групах">
    За замовчуванням Telegram-боти працюють у **Privacy Mode**, який обмежує, які повідомлення з груп вони отримують.

    Якщо бот має бачити всі повідомлення в групі, виконайте одну з дій:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть і знову додайте бота в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи в групі">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів із одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень підключення).

    Поширена плутанина: схвалення підключення для DM не означає, що «цей відправник авторизований усюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах усе ще визначається явними allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз і працювали і DM, і команди в групі», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM вашому боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два елементи керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи в `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не вказано, Telegram використовує `allowFrom` як резервний варіант.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групах **не** успадковує схвалення з pairing-store для DM.
    Підключення залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує config `allowFrom`, а не pairing store.
    Практичний шаблон для ботів з одним власником: встановіть свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` не заданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка про runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в fail-closed режимі з `groupPolicy="allowlist"`, якщо явно не задано `channels.defaults.groupPolicy`.

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

      - Додавайте від’ємні ID груп або супергруп Telegram, наприклад `-1001234567890`, до `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, наприклад `8734062810`, до `groupAllowFrom`, якщо хочете обмежити, які люди всередині дозволеної групи можуть активувати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише якщо хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадки">
    За замовчуванням відповіді в групах вимагають згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
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

    Як отримати ID групового чату:

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу Gateway.
- Маршрутизація детермінована: вхідні відповіді Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільного конверта каналу з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб зберігати ізоляцію тем.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх із ключами сесії, що враховують тред, і зберігає ID треду для відповідей.
- Long polling використовує grammY runner із послідовністю на рівні чату/треду. Загальна конкурентність sink runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують за замовчуванням після 120 секунд без завершеної живучості `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще є хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і може бути від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: попереднє повідомлення + `editMessageText`
    - групи/теми: попереднє повідомлення + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` дорівнює `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активний preview streaming)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки «Працюю...», які показуються під час роботи інструментів, наприклад під час виконання команд, читання файлів, оновлень плану або підсумків патчів. У Telegram вони ввімкнені за замовчуванням, щоб відповідати випущеній поведінці OpenClaw починаючи з `v2026.4.22`. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, встановіть:

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

    Використовуйте `streaming.mode: "off"` лише якщо хочете повністю вимкнути редагування попереднього перегляду Telegram. Використовуйте `streaming.preview.toolProgress: false`, якщо хочете вимкнути лише рядки стану прогресу інструментів.

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, із медіавмістом) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Preview streaming відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного потокового передавання.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично переходить на `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live preview під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний перехід до HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням; його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

Додайте власні записи до меню команд:

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

    - імена нормалізуються (забирається початковий `/`, перетворення в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й записуються в журнал

    Примітки:

    - власні команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе ще можуть працювати при ручному введенні, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Власні команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість команд Plugin/Skills/власних команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідні DNS/HTTPS-запити до `api.telegram.org` заблоковані.

    ### Команди підключення пристрою (Plugin `device-pair`)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список очікуваних запитів (включно з роллю/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит в очікуванні
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен primary Node на `scopes: []`; будь-який переданий operator-токен залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікс ролі, тому цей operator allowlist задовольняє лише operator-запити; ролям, що не є operator, усе ще потрібні scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад, role/scopes/public key), попередній запит в очікуванні замінюється, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

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

  <Accordion title="Дії з повідомленнями Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування обмеженнями:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (запуск/перезавантаження), тому шляхи дій не виконують ad-hoc повторного визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги тредів відповідей">
    Telegram підтримує явні теги тредів відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення-тригер
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявні треди відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка тредів">
    Супергрупи-форуми:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та введення тексту спрямовуються в тред теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії введення тексту все одно містять `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` існує лише на рівні теми й не успадковується від значень групи за замовчуванням.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через `agentId` у config теми. Це надає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → main agent
                "3": { agentId: "zu" },        // Тема розробки → zu agent
                "5": { agentId: "coder" }      // Код-рев’ю → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані ACP bindings верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з указанням теми, наприклад `-1001234567890:topic:42`). Наразі область дії обмежена темами форуму в групах/супергрупах. Див. [ACP Agents](/uk/tools/acp-agents).

    **Прив’язаний до треду запуск ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди безпосередньо. OpenClaw закріплює підтвердження запуску в темі. Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають DM-маршрутизацію, але використовують ключі сесії з урахуванням треду.

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

    Telegram розрізняє відеофайли та відеоногатки.

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

    Відеонотатки не підтримують підписи; наданий текст повідомлення надсилається окремо.

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

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Додано реакцію Telegram: 👍 від Alice (@alice) на повідомлення 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе ще дотримуються елементів контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID тредів в оновленнях реакцій.
      - нефорумні групи маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної вихідної теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний варіант — емодзі identity агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode-емодзі (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис config із подій і команд Telegram">
    Записи config каналу ввімкнені за замовчуванням (`configWrites !== false`).

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

  <Accordion title="Long polling проти webhook">
    За замовчуванням використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язково `webhookPath`, `webhookHost`, `webhookPort` (за замовчуванням `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний listener прив’язується до `127.0.0.1:8787`. Для публічного ingress або поставте reverse proxy перед локальним портом, або свідомо встановіть `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захист запитів, секретний токен Telegram і JSON body перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі bot lanes на рівні чату/теми, які використовуються в long polling, тож повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується значення grammY за замовчуванням).
    - Типове значення `channels.telegram.pollingStallThresholdMs` — `120000`; налаштовуйте в діапазоні від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає її.
    - Додатковий контекст reply/quote/forward наразі передається як отримано.
    - allowlist Telegram насамперед обмежують те, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - Елементи керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль надсилання CLI може бути числовим ID чату або ім’ям користувача:

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

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи, а не як стиснені фото чи анімовані медіазавантаження

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM користувачів, що погоджують, і за потреби може публікувати запити у вихідному чаті або темі. Користувачі, що погоджують, мають бути задані числовими ID користувачів Telegram.

    Шлях config:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли вдається визначити принаймні одного користувача, що погоджує)
    - `channels.telegram.execApprovals.approvers` (резервний варіант — числові ID власника з `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту погодження й подальшої взаємодії. Типово погодження exec спливають через 30 хвилин.

    Вбудовані кнопки погодження також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID погодження з префіксом `plugin:` визначаються через погодження Plugin; інші спочатку визначаються через погодження exec.

    Див. [Погодження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Елементи керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі config:

| Ключ                                | Значення          | За замовчуванням | Опис                                                                                             |
| ----------------------------------- | ----------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`          | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`          | Мінімальний час між відповідями про помилки в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремих облікових записів, груп і тем (та сама схема успадкування, що й для інших ключів config Telegram).

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
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; для wildcard `"*"` перевірка членства неможлива.
    - швидка перевірка сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана (або має бути `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (підключення та/або числовий `allowFrom`)
    - авторизація команд усе ще застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню містить занадто багато записів; зменште кількість команд Plugin/Skills/власних команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + власний fetch/proxy можуть спричиняти негайну поведінку abort, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку визначається в IPv6; несправний вихід через IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює спроби для них як для відновлюваних мережевих помилок.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної живучості long-poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS-виходу між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 benchmark (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантажень медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає хости медіа Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяють
      діапазон RFC 2544 benchmark.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захисти SSRF
      для медіа Telegram. Використовуйте його лише в довірених proxy-середовищах під контролем оператора,
      таких як Clash, Mihomo або Surge fake-IP routing, коли вони
      синтезують приватні або special-use відповіді поза діапазоном RFC 2544 benchmark.
      Для звичайного публічного доступу до Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасові):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірте DNS-відповіді:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Додаткова допомога: [Усунення проблем із каналом](/uk/channels/troubleshooting).

## Довідник з конфігурації

Основний довідник: [Довідник з конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Ключові поля Telegram">

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- треди/відповіді: `replyToMode`
- потокове передавання: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- запис/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритетність для кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням. Інакше OpenClaw використовує перший нормалізований ID облікового запису, а `openclaw doctor` показує попередження. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключіть користувача Telegram до gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизація вхідних повідомлень до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставлення груп і тем з агентами.
  </Card>
  <Card title="Усунення проблем" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
