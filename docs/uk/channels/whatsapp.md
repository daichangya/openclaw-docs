---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T16:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: badc448123ff9a12633255db5756236c3ccbd7a75b4ddc3f76d6454d0555011c
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готовий до використання у production через WhatsApp Web (Baileys). Gateway керує підключеною сесією(ями).

## Встановлення (за потреби)

- Під час онбордингу (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  буде запропоновано встановити Plugin WhatsApp, коли ви вперше його виберете.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  Plugin ще не встановлено.
- Dev-канал + git checkout: за замовчуванням використовується локальний шлях до Plugin.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Типова політика DM — підключення для невідомих відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Налаштуйте політику доступу WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Підключіть WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб перед входом підключити наявний/власний каталог автентифікації WhatsApp Web:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший запит на підключення (якщо використовується режим pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на підключення спливає через 1 годину. Кількість очікувальних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, за можливості, запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого сценарію, але конфігурації з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
    - менша ймовірність плутанини із self-chat

    Мінімальний шаблон політики:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Резервний варіант з особистим номером">
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист self-chat спирається на підключений власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Обсяг каналу лише для WhatsApp Web">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу повідомлень Twilio WhatsApp у вбудованому реєстрі chat-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Для вихідного надсилання потрібен активний слухач WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; значення за замовчуванням `main` зводить DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні змінні середовища proxy на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації proxy на рівні хоста, а не специфічним налаштуванням proxy для каналу WhatsApp.

## Керування доступом та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями канального рівня для цього облікового запису.

    Деталі поведінки під час виконання:

    - підключення зберігаються у сховищі allow каналу та об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, підключений власний номер дозволяється типово
    - OpenClaw ніколи не виконує auto-pair для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з підключеного пристрою)

  </Tab>

  <Tab title="Групова політика + allowlist">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, усі групи є придатними
       - якщо `groups` вказано, це працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників оминається
       - `allowlist`: відправник має збігатися з `groupAllowFrom` (або `*`)
       - `disabled`: блокувати весь вхідний трафік із груп

    Резервна логіка allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist відправників оцінюються до активації за згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` повністю відсутній, резервна групова політика під час виконання — `allowlist` (із попередженням у журналі), навіть якщо встановлено `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Відповіді в групах типово потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявне виявлення reply-to-bot (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - quote/reply лише задовольняє перевірку згадки; це **не** надає авторизації відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Доступ до неї обмежено власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли підключений власний номер також присутній у `allowFrom`, активуються запобіжники WhatsApp для self-chat:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку auto-trigger за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідна оболонка + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються у спільну вхідну оболонку.

    Якщо існує цитована відповідь, контекст додається в такому вигляді:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Заповнювачі медіа та витягування location/contact">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою таких заповнювачів:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіло location використовує стислий текст координат. Мітки/коментарі location і деталі contact/vCard відображаються як fenced untrusted metadata, а не як вбудований текст промпту.

  </Accordion>

  <Accordion title="Ін’єкція історії очікувальних груп">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бот нарешті активується.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts увімкнені за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

    Вимкнути глобально:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Перевизначення для окремого облікового запису:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Для ходів self-chat read receipts пропускаються навіть коли вони глобально увімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на частини">
    - типовий ліміт частини: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною розбиття
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються payload-и image, video, audio (PTT voice-note) і document
    - `audio/ogg` переписується як `audio/ogg; codecs=opus` для сумісності з voice-note
    - відтворення анімованих GIF підтримується через `gifPlayback: true` при надсиланні video
    - captions застосовуються до першого елемента медіа під час надсилання payload-ів відповіді з кількома медіа
    - джерелом медіа можуть бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (перебір розміру/якості), щоб вкладатися в ліміти
    - у разі помилки надсилання медіа резервний сценарій для першого елемента надсилає текстове попередження замість того, щоб мовчки втратити відповідь
  </Accordion>
</AccordionGroup>

## Цитування у відповідях

WhatsApp підтримує нативне цитування відповіді, коли вихідні відповіді візуально цитують вхідне повідомлення. Це керується через `channels.whatsapp.replyToMode`.

| Value    | Behavior                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Цитувати вхідне повідомлення, коли провайдер це підтримує; інакше пропускати цитування |
| `"on"`   | Завжди цитувати вхідне повідомлення; якщо цитування відхилено, повертатися до звичайного надсилання |
| `"off"`  | Ніколи не цитувати; надсилати як звичайне повідомлення                                               |

Типове значення — `"auto"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Рівень реакцій

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Level         | Ack reactions | Agent-initiated reactions | Description                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                        | Жодних реакцій                              |
| `"ack"`       | Так           | Ні                        | Лише ack-реакції (підтвердження до відповіді)           |
| `"minimal"`   | Так           | Так (консервативно)        | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так           | Так (заохочується)          | Ack + реакції агента з рекомендованими настановами   |

Типове значення: `"minimal"`.

Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакції підтвердження

WhatsApp підтримує негайні ack-реакції при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції залежать від `reactionLevel` — вони приглушуються, коли `reactionLevel` дорівнює `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Примітки щодо поведінки:

- надсилаються негайно після прийняття вхідного повідомлення (до відповіді)
- збої записуються в журнал, але не блокують звичайну доставку відповіді
- у груповому режимі `mentions` реакція надсилається для ходів, активованих згадкою; групова активація `always` обходить цю перевірку
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими схемами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв із обліковим записом за замовчуванням
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та запис конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Запис конфігурації, ініційований каналом, увімкнений за замовчуванням (вимикається через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не підключено (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не підключено.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Підключено, але відключено / цикл перепідключення">
    Симптом: підключений обліковий запис із повторними відключеннями або спробами перепідключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби перепідключіть через `channels login`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються з помилкою, якщо для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено і обліковий запис підключено.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - перевірка згадок (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому в кожній області має бути лише один `groupPolicy`

  </Accordion>

  <Accordion title="Попередження про runtime Bun">
    Runtime Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp підтримує system prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Спочатку визначається ефективна мапа `groups`: якщо обліковий запис задає власний `groups`, він повністю замінює кореневу мапу `groups` (без deep merge). Потім пошук prompt виконується для отриманої єдиної мапи:

1. **System prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** в ньому визначено ключ `systemPrompt`. Якщо `systemPrompt` — порожній рядок (`""`), wildcard приглушується і system prompt не застосовується.
2. **System prompt wildcard для груп** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Спочатку визначається ефективна мапа `direct`: якщо обліковий запис задає власний `direct`, він повністю замінює кореневу мапу `direct` (без deep merge). Потім пошук prompt виконується для отриманої єдиної мапи:

1. **System prompt для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного співрозмовника існує в мапі **і** в ньому визначено ключ `systemPrompt`. Якщо `systemPrompt` — порожній рядок (`""`), wildcard приглушується і system prompt не застосовується.
2. **System prompt wildcard для прямих чатів** (`direct["*"].systemPrompt`): використовується, коли запис конкретного співрозмовника повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Примітка: `dms` залишається спрощеним контейнером для перевизначення історії окремих DM (`dms.<id>.historyLimit`); перевизначення prompt знаходяться в `direct`.

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram кореневий `groups` навмисно приглушується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власний `groups`, — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від того, скільки облікових записів налаштовано. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні prompts для груп або прямих чатів на рівні облікового запису, явно визначайте повну мапу в кожному обліковому записі, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` — це і мапа конфігурації для окремих груп, і allowlist груп на рівні чату. На кореневому рівні або в області облікового запису `groups["*"]` означає «до цієї області допускаються всі групи».
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як значення prompt за замовчуванням. Замість цього повторіть prompt у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує всіх відправників у цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає конфігурацію прямого чату за замовчуванням після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами сховища pairing.

Приклад:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
