---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T03:42:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0261e132d459c91f5d81d5ad9485acbdf5792e6bfc8cd33bb74e45192df9fd2f
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готово до production через WhatsApp Web (Baileys). Gateway керує прив’язаною(-ими) сесією(-ями).

## Встановлення (за потреби)

- Під час онбордингу (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  буде запропоновано встановити Plugin WhatsApp, коли ви вперше виберете його.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  Plugin ще не присутній.
- Канал Dev + git checkout: типово використовується локальний шлях до Plugin.
- Stable/Beta: типово використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії виправлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони конфігурації каналу та приклади.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити на pairing спливають через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, коли це можливо, запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого сценарію, але сценарії з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший режим експлуатації:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist для DM і межі маршрутизації
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

  <Accordion title="Personal-number fallback">
    Онбординг підтримує режим особистого номера й записує базову конфігурацію, зручну для self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями в поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Для вихідного надсилання потрібен активний слухач WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; типове значення `main` згортає DM в основну сесію агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста, а не специфічним для каналу параметрам проксі WhatsApp.

## Керування доступом і активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у форматі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями на рівні каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - pairing зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо жодного allowlist не налаштовано, прив’язаний власний номер дозволяється типово
    - OpenClaw ніколи не виконує auto-pairs для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два шари:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи є допустимими
       - якщо `groups` присутній, він працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників оминається
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати весь вхідний трафік груп

    Резервна логіка allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist відправників перевіряються до активації згадками/відповідями

    Примітка: якщо блоку `channels.whatsapp` узагалі не існує, резервне значення group-policy під час виконання — `allowlist` (із попередженням у журналі), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Для відповідей у групі типово потрібна згадка.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявне виявлення відповіді боту (відправник відповіді відповідає ідентичності бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє обмеження згадки; це **не** надає авторизацію відправнику
    - при `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники self-chat у WhatsApp:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку автоактивації mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp обгортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такому вигляді:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою заповнювачів, таких як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіла повідомлень із локацією використовують стислий текст координат. Підписи/коментарі локації та деталі contact/vCard відображаються як fenced ненадійні метадані, а не як вбудований текст запиту.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися і вставлятися як контекст, коли бот нарешті активується.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервно: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставки:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts типово увімкнені для прийнятих вхідних повідомлень WhatsApp.

    Глобальне вимкнення:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Перевизначення для облікового запису:

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

    Для ходів self-chat read receipts пропускаються, навіть коли вони глобально увімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - типовий ліміт частини: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожні рядки), а потім переходить до безпечного за довжиною розбиття
  </Accordion>

  <Accordion title="Outbound media behavior">
    - підтримуються payload-и image, video, audio (PTT voice-note) і document
    - `audio/ogg` переписується як `audio/ogg; codecs=opus` для сумісності з voice-note
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання video
    - captions застосовуються до першого медіаелемента під час надсилання payload-ів відповіді з кількома медіа
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (цикл зміни розміру/якості), щоб укладатися в обмеження
    - якщо надсилання медіа не вдається, резервна логіка для першого елемента надсилає текстове попередження замість того, щоб мовчки відкинути відповідь
  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповіді, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення | Поведінка                                                                         |
| -------- | --------------------------------------------------------------------------------- |
| `"auto"` | Цитувати вхідне повідомлення, коли провайдер це підтримує; інакше пропускати цитування |
| `"on"`   | Завжди цитувати вхідне повідомлення; якщо цитування відхилено, переходити до звичайного надсилання |
| `"off"`  | Ніколи не цитувати; надсилати як звичайне повідомлення                            |

Типове значення — `"auto"`. Перевизначення для облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень       | Реакції-підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------ | --------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`      | Ні                    | Ні                           | Узагалі без реакцій                              |
| `"ack"`      | Так                   | Ні                           | Лише реакції-підтвердження (отримання до відповіді) |
| `"minimal"`  | Так                   | Так (обережно)               | Підтвердження + реакції агента з консервативними вказівками |
| `"extensive"`| Так                   | Так (заохочуються)           | Підтвердження + реакції агента із заохочувальними вказівками |

Типово: `"minimal"`.

Перевизначення для облікового запису використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакції-підтвердження

WhatsApp підтримує негайні реакції-підтвердження при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Реакції-підтвердження залежать від `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

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
- режим групи `mentions` реагує на ходи, активовані згадкою; групова активація `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір типового облікового запису: `default`, якщо присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв типового облікового запису
  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У каталогах застарілої автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та запис конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Ініційований каналом запис конфігурації типово увімкнений (вимикається через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Симптом: статус каналу показує, що прив’язка відсутня.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Симптом: прив’язаний обліковий запис із повторюваними відключеннями або спробами повторного підключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби виконайте повторну прив’язку через `channels login`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Вихідне надсилання завершується помилкою одразу, якщо для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено і обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадок (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому в кожній області має бути лише один `groupPolicy`

  </Accordion>

  <Accordion title="Bun runtime warning">
    Для runtime gateway WhatsApp слід використовувати Node. Bun позначений як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні запити

WhatsApp підтримує системні запити в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Ефективна мапа `groups` визначається спочатку: якщо обліковий запис задає власну `groups`, вона повністю замінює кореневу мапу `groups` (без deep merge). Потім пошук запиту виконується в отриманій єдиній мапі:

1. **Системний запит для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, якщо запис конкретної групи задає `systemPrompt`.
2. **Системний запит для wildcard групи** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи відсутній або не задає `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Ефективна мапа `direct` визначається спочатку: якщо обліковий запис задає власну `direct`, вона повністю замінює кореневу мапу `direct` (без deep merge). Потім пошук запиту виконується в отриманій єдиній мапі:

1. **Системний запит для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, якщо запис конкретного співрозмовника задає `systemPrompt`.
2. **Системний запит для wildcard прямого чату** (`direct["*"].systemPrompt`): використовується, коли запис конкретного співрозмовника відсутній або не задає `systemPrompt`.

Примітка: `dms` залишається спрощеним контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`); перевизначення запитів розміщуються в `direct`.

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не задають власну `groups`, — щоб запобігти отриманню ботом групових повідомлень для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і кореневі `direct` завжди успадковуються обліковими записами, які не задають перевизначення на рівні облікового запису, незалежно від того, скільки облікових записів налаштовано. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні запити для груп або прямих чатів на рівні окремого облікового запису, явно задайте повну мапу в кожному обліковому записі, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для кожної групи та allowlist груп на рівні чату. На рівні кореня або облікового запису `groups["*"]` означає «усі групи допущені» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб допустимим був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як типове значення запиту. Натомість повторіть запит у кожному явно дозволеному записі групи.
- Допуск груп і авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами pairing-store.

Приклад:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Використовуйте лише якщо всі групи мають бути допущені в кореневій області.
        // Застосовується до всіх облікових записів, які не задають власну мапу groups.
        "*": { systemPrompt: "Типовий запит для всіх груп." },
      },
      direct: {
        // Застосовується до всіх облікових записів, які не задають власну мапу direct.
        "*": { systemPrompt: "Типовий запит для всіх прямих чатів." },
      },
      accounts: {
        work: {
          groups: {
            // Цей обліковий запис задає власну groups, тому коренева groups повністю
            // замінюється. Щоб зберегти wildcard, явно задайте "*" і тут.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Зосереджуйся на керуванні проєктами.",
            },
            // Використовуйте лише якщо в цьому обліковому записі мають бути допущені всі групи.
            "*": { systemPrompt: "Типовий запит для робочих груп." },
          },
          direct: {
            // Цей обліковий запис задає власну мапу direct, тому кореневі записи direct
            // повністю замінюються. Щоб зберегти wildcard, явно задайте "*" і тут.
            "+15551234567": { systemPrompt: "Запит для конкретного робочого прямого чату." },
            "*": { systemPrompt: "Типовий запит для робочих прямих чатів." },
          },
        },
      },
    },
  },
}
```

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - WhatsApp](/uk/gateway/config-channels#whatsapp)

Основні поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- запити: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Pairing](/uk/channels/pairing)
- [Groups](/uk/channels/groups)
- [Security](/uk/gateway/security)
- [Channel routing](/uk/channels/channel-routing)
- [Multi-agent routing](/uk/concepts/multi-agent)
- [Troubleshooting](/uk/channels/troubleshooting)
