---
read_when:
    - Робота над функціями Telegram або вебхуками
summary: Статус підтримки Telegram bot, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-05T18:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готово до продакшну для DM ботів + груп через grammY. Long polling — типовий режим; webhook-режим необов’язковий.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Типова політика DM для Telegram — pairing.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/channels/troubleshooting">
    Діагностика між каналами та сценарії відновлення.
  </Card>
  <Card title="Конфігурація gateway" icon="settings" href="/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат з **@BotFather** (переконайтеся, що handle точно `@BotFather`).

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

    Резервне значення з Env: `TELEGRAM_BOT_TOKEN=...` (лише для типового облікового запису).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди pairing дійсні 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним значенням з env, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Telegram bot типово працюють у **Privacy Mode**, що обмежує, які повідомлення з груп вони отримують.

    Якщо бот має бачити всі повідомлення групи, виконайте одну з дій:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть бота з кожної групи й додайте знову, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до особистих повідомлень:

    - `pairing` (типово)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою конфігурації.
    Onboarding приймає введення `@username` і перетворює його на числові ID.
    Якщо ви оновилися і ваш config містить записи allowlist у вигляді `@username`, виконайте `openclaw doctor --fix`, щоб перетворити їх (best-effort; потрібен токен Telegram bot).
    Якщо ви раніше покладалися на файли allowlist зі сховища pairing, `openclaw doctor --fix` може відновити записи до `channels.telegram.allowFrom` у сценаріях allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для bot, якими володіє одна особа, краще використовувати `dmPolicy: "allowlist"` з явними числовими ID в `allowFrom`, щоб політика доступу стабільно зберігалася в конфігурації (замість залежності від попередніх схвалень pairing).

    Поширене непорозуміння: схвалення pairing у DM не означає, що «цей відправник авторизований всюди».
    Pairing надає доступ лише до DM. Авторизація відправника в групі, як і раніше, визначається явними allowlist у конфігурації.
    Якщо ви хочете модель «я авторизований один раз, і працюють і DM, і команди в групі», додайте свій числовий Telegram user ID до `channels.telegram.allowFrom`.

    ### Як знайти свій Telegram user ID

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Групова політика та списки дозволу">
    Разом застосовуються два механізми:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - без конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group-ID
         - з `groupPolicy: "allowlist"` (типово): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (типово)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не задано, Telegram використовує резервне значення `allowFrom`.
    Записи в `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID Telegram group або supergroup у `groupAllowFrom`. Від’ємні chat ID мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються під час авторизації відправника.
    Межа безпеки (`2026.2.25+`): групова авторизація відправника **не** успадковує схвалення зі сховища pairing для DM.
    Pairing залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує резервне значення з config `allowFrom`, а не сховище pairing.
    Практичний шаблон для bot одного власника: задайте свій user ID у `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте потрібні групи в `channels.telegram.groups`.
    Примітка про runtime: якщо `channels.telegram` повністю відсутній, runtime типово працює за fail-closed із `groupPolicy="allowlist"`, якщо явно не задано `channels.defaults.groupPolicy`.

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

    Приклад: дозволити лише певних користувачів в одній конкретній групі:

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

      - Вказуйте від’ємні ID Telegram group або supergroup, наприклад `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, наприклад `8734062810`, у `groupAllowFrom`, якщо хочете обмежити, хто саме в межах дозволеної групи може активувати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадувань">
    Відповіді в групах типово вимагають згадування.

    Згадування може надходити з:

    - нативного згадування `@botusername`, або
    - шаблонів згадувань у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійного збереження використовуйте конфігурацію.

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
- Маршрутизація детермінована: вхідні відповіді Telegram повертаються назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільного канального envelope з метаданими відповіді та placeholder медіа.
- Групові сесії ізольовані за ID групи. Для тем форуму додається `:topic:<threadId>`, щоб ізолювати теми.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх із session key, що враховують thread, і зберігає ID thread для відповідей.
- Long polling використовує grammY runner з послідовністю на рівні chat/per-thread. Загальна sink-конкурентність runner використовує `agents.defaults.maxConcurrent`.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (типово: `partial`)
    - `progress` у Telegram відображається як `partial` (сумісність із міжканальним найменуванням)
    - застарілі значення `channels.telegram.streamMode` і boolean-значення `streaming` автоматично зіставляються

    Для лише текстових відповідей:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, з медіапейлоадами) OpenClaw повертається до звичайної фінальної доставки, а потім прибирає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного стримінгу.

    Якщо нативний транспорт чернетки недоступний/відхилений, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться у безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок парсингу в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено типово, його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та кастомні команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи меню команд:

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

    - назви нормалізуються (знімається початковий `/`, переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - кастомні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та логуються

    Примітки:

    - кастомні команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди plugin/Skills можуть працювати при ручному введенні, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Кастомні/plugin-команди все ще можуть реєструватися, якщо налаштовані.

    Поширені збої під час налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд plugin/Skills/кастомних або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що заблоковано вихідний DNS/HTTPS до `api.telegram.org`.

    ### Команди pairing пристрою (`device-pair` plugin)

    Коли встановлено plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує запити, що очікують підтвердження (включно з role/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap token. Вбудована передача bootstrap зберігає token основного вузла з `scopes: []`; будь-який переданий operator token залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope використовують префікси role, тому цей allowlist operator задовольняє лише запити operator; ролі, що не є operator, усе ще потребують scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими деталями auth (наприклад role/scopes/public key), попередній запит, що очікує, замінюється, а новий запит використовує інший `requestId`. Перед схваленням повторно виконайте `/pair pending`.

    Докладніше: [Pairing](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Вбудовані кнопки">
    Налаштуйте область застосування вбудованої клавіатури:

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

    Області:

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

    Дії канальних повідомлень надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (типово: вимкнено)

    Примітка: `edit` і `topic-create` наразі типово ввімкнені й не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання runtime використовують активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad hoc повторного визначення SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Теги тредів відповідей">
    Telegram підтримує явні теги тредів відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке викликало дію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Примітка: `off` вимикає неявний трединг відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка thread">
    Для forum supergroup:

    - до ключів сесії теми додається `:topic:<threadId>`
    - відповіді й індикатор набору спрямовуються в thread теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` діє лише для теми й не успадковується з типових значень групи.

    **Маршрутизація агента для окремої теми**: кожна тема може маршрутизуватися до іншого агента, якщо задати `agentId` у конфігурації теми. Це дає кожній темі власний ізольований workspace, memory і session. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема dev → агент zu
                "5": { agentId: "coder" }      // Code review → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний session key: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка ACP до теми**: теми форуму можуть закріплювати сесії harness ACP через типізовані прив’язки ACP верхнього рівня:

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

    Наразі це обмежено темами форуму в групах і supergroup.

    **Запуск ACP, прив’язаний до thread, з чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішної прив’язки OpenClaw закріплює в темі повідомлення-підтвердження запуску.
    - Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка DM thread:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують session key і цілі відповіді з урахуванням thread.

  </Accordion>

  <Accordion title="Аудіо, відео та стикери">
    ### Аудіоповідомлення

    Telegram розрізняє voice note та аудіофайли.

    - типово: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як voice note

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

    ### Стикери

    Обробка вхідних стикерів:

    - статичний WEBP: завантажується й обробляється (placeholder `<media:sticker>`)
    - анімований TGS: пропускається
    - відео WEBM: пропускається

    Поля контексту стикера:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Файл кешу стикерів:

    - `~/.openclaw/telegram/sticker-cache.json`

    Стикери описуються один раз (коли це можливо) і кешуються, щоб зменшити повторні виклики vision.

    Увімкніть дії зі стикерами:

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

    Дія надсилання стикера:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Пошук у кеші стикерів:

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

    Коли їх увімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно враховують механізми доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID thread в оновленнях реакцій.
      - у нефорумних групах маршрут іде до сесії групового чату
      - у форумних групах маршрут іде до сесії загальної теми групи (`:topic:1`), а не до точного початкового thread

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення з emoji identity агента (`agents.list[].identity.emoji`, інакше `"👀"`)

    Примітки:

    - Telegram очікує emoji Unicode (наприклад, `"👀"`).
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис конфігурації з подій і команд Telegram">
    Записи конфігурації каналу типово ввімкнені (`configWrites !== false`).

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

  <Accordion title="Long polling проти webhook">
    Типово: long polling.

    Режим webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, коли задано webhook URL)
    - необов’язково `channels.telegram.webhookPath` (типово `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (типово `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (типово `8787`)

    Типовий локальний listener для режиму webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваш публічний ендпоїнт відрізняється, поставте перед ним reverse proxy і вкажіть у `webhookUrl` публічний URL.
    Задайте `webhookHost` (наприклад, `0.0.0.0`), коли свідомо потребуєте зовнішнього ingress.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, використовується типове значення grammY).
    - історія групового контексту використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається як отриманий.
    - Telegram allowlist передусім обмежують, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - конфігурація `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль CLI send може бути числовим chat ID або username:

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

    - `--buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з polls
    - `channels.telegram.actions.poll=false` вимикає створення Telegram poll, залишаючи звичайні надсилання ввімкненими

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM погоджувачів і за бажання може публікувати запити на погодження в початковому чаті або темі.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; використовує резервне значення числових ID власників, визначених із `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`

    Погоджувачі мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і можна визначити щонайменше одного погоджувача — або з `execApprovals.approvers`, або з числової конфігурації власника облікового запису (`allowFrom` і DM `defaultTo`). Задайте `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт погодження. В інших випадках запити на погодження повертаються до інших налаштованих маршрутів погодження або до резервної політики погодження exec.

    Telegram також відображає спільні кнопки погодження, які використовують інші чат-канали. Нативний адаптер Telegram переважно додає маршрутизацію в DM погоджувачів, fanout у канал/тему та підказки набору тексту перед доставкою.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що погодження в чаті недоступні або ручне погодження — єдиний шлях.

    Правила доставки:

    - `target: "dm"` надсилає запити на погодження лише в DM визначеним погоджувачам
    - `target: "channel"` надсилає запит назад у початковий чат/тему Telegram
    - `target: "both"` надсилає в DM погоджувачів і в початковий чат/тему

    Лише визначені погоджувачі можуть схвалювати або відхиляти. Особи, які не є погоджувачами, не можуть використовувати `/approve` і не можуть використовувати кнопки погодження Telegram.

    Поведінка визначення погодження:

    - ID з префіксом `plugin:` завжди визначаються через погодження plugin.
    - Інші ID спочатку пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизовано для погоджень plugin і gateway повідомляє,
      що погодження exec невідоме/прострочене, Telegram один раз повторює спробу через
      `plugin.approval.resolve`.
    - Справжні відмови/помилки погодження exec не переходять мовчки до визначення
      погодження plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему як для запиту погодження, так і для дій після погодження. Погодження exec типово спливають через 30 хвилин.

    Вбудовані кнопки погодження також залежать від того, чи дозволяє `channels.telegram.capabilities.inlineButtons` цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями на помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                 | Значення          | Типово  | Опис                                                                                                  |
| ------------------------------------ | ----------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`      | `reply`, `silent` | `reply` | `reply` надсилає в чат дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді з помилками. |
| `channels.telegram.errorCooldownMs`  | number (ms)       | `60000` | Мінімальний час між відповідями з помилками в одному чаті. Запобігає спаму помилками під час збоїв. |

Підтримуються перевизначення для окремого облікового запису, групи й теми (те саме успадкування, що й для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення групи без згадувань">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота з групи й додайте знову
    - `openclaw channels status` попереджає, коли конфігурація очікує повідомлення групи без згадувань.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлень групи">

    - коли існує `channels.telegram.groups`, група має бути вказана там (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (pairing та/або числовий `allowFrom`)
    - авторизація команд застосовується навіть тоді, коли групова політика має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/Skills/кастомних або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + кастомний fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку визначається в IPv6; зламаний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - На VPS-хостах з нестабільним прямим egress/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ типово використовує `autoSelectFamily=true` (окрім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з benchmark-діапазону RFC 2544 (`198.18.0.0/15`) уже типово дозволені
      для завантажень медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      явно ввімкнути цей обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису за шляхом
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Telegram media уже типово дозволяє benchmark-діапазон RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media від SSRF. Використовуйте це лише в довірених середовищах proxy,
      контрольованих оператором, як-от Clash, Mihomo або fake-IP-маршрутизація Surge,
      коли вони синтезують приватні або special-use відповіді поза benchmark-діапазоном RFC 2544.
      Для звичайного публічного доступу Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Тимчасові перевизначення через змінні середовища:
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

Додаткова допомога: [Усунення несправностей каналів](/channels/troubleshooting).

## Вказівники на довідник конфігурації Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнення/вимкнення запуску каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читання токена зі звичайного шляху до файлу. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.telegram.allowFrom`: allowlist DM (числові ID користувачів Telegram). Для `allowlist` потрібен щонайменше один ID відправника. Для `open` потрібен `"*"`. `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID і може відновити записи allowlist із файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнення або вимкнення створення Telegram poll (типово: увімкнено; усе одно потребує `sendMessage`).
- `channels.telegram.defaultTo`: типова ціль Telegram, яку використовує CLI `--deliver`, коли не задано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID. Нечислові записи ігноруються під час авторизації. Групова авторизація не використовує резервне значення зі сховища pairing для DM (`2026.2.25+`).
- Пріоритет для кількох облікових записів:
  - Коли налаштовано два або більше account ID, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію.
  - Якщо не задано жодного з них, OpenClaw використовує резервне значення першого нормалізованого account ID, а `openclaw doctor` видає попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задані.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: типові значення для груп + allowlist (використовуйте `"*"` для глобальних типових значень).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення groupPolicy для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типове gating згадувань.
  - `channels.telegram.groups.<id>.skills`: фільтр skill (omit = усі Skills, empty = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий system prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимикає групу, коли має значення `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + `agentId`, що діє лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизує цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи й через binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення groupPolicy для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення gating згадувань для окремої теми.
- `bindings[]` верхнього рівня з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійної прив’язки ACP до теми (див. [ACP Agents](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизує теми DM до конкретного агента (та сама поведінка, що й для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнення Telegram як клієнта погодження exec через чат для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено схвалювати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже ідентифікує власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (типово: `dm`). `channel` і `both` зберігають початкову тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на погодження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (substring або regex) для пересланих запитів на погодження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення на рівні облікового запису для маршрутизації погодження exec у Telegram та авторизації погоджувачів.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (типово: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення на рівні облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнення/вимкнення нативних команд Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (типово: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного chunk (символи).
- `channels.telegram.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (типово: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (live preview stream; типово: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом preview). Telegram preview streaming використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.mediaMaxMb`: ліміт вхідних/вихідних медіа Telegram (МБ, типово: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) при відновлюваних вихідних помилках API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначення Node autoSelectFamily (true=увімкнути, false=вимкнути). Типово ввімкнено на Node 22+, а у WSL2 типово вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначення порядку результатів DNS (`ipv4first` або `verbatim`). Типово `ipv4first` на Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent proxy, де завантаження медіа Telegram визначає `api.telegram.org` у приватні/внутрішні/special-use адреси поза типовим дозволеним benchmark-діапазоном RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнення режиму webhook (потрібен `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях webhook (типово `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язки webhook (типово `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язки webhook (типово `8787`).
- `channels.telegram.actions.reactions`: gating реакцій інструментів Telegram.
- `channels.telegram.actions.sendMessage`: gating надсилання повідомлень інструментами Telegram.
- `channels.telegram.actions.deleteMessage`: gating видалення повідомлень інструментами Telegram.
- `channels.telegram.actions.sticker`: gating дій зі стикерами Telegram — надсилання та пошук (типово: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує, які реакції запускають системні події (типово: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливістю реакцій агента (типово: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповіді на помилки (типово: `reply`). Підтримуються перевизначення для облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями з помилками в одному чаті (типово: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник конфігурації - Telegram](/gateway/configuration-reference#telegram)

Специфічні для Telegram поля з високим сигналом:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/відповіді: `replyToMode`
- streaming: `streaming` (preview), `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Pairing](/channels/pairing)
- [Групи](/channels/groups)
- [Безпека](/gateway/security)
- [Маршрутизація каналів](/channels/channel-routing)
- [Маршрутизація з кількома агентами](/concepts/multi-agent)
- [Усунення несправностей](/channels/troubleshooting)
