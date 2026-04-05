---
read_when:
    - Працюєте над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та операційні аспекти
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T18:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web channel)

Статус: готовий до використання у production через WhatsApp Web (Baileys). Gateway керує прив’язаними сесіями.

## Встановлення (за потреби)

- Під час onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  з’являється запит на встановлення плагіна WhatsApp, коли ви вперше вибираєте цей канал.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  плагін ще не встановлено.
- Dev channel + git checkout: типово використовується локальний шлях до плагіна.
- Stable/Beta: типово використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/channels/pairing">
    Типова політика DM для невідомих відправників — pairing.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/channels/troubleshooting">
    Кросканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/gateway/configuration">
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

  <Step title="Прив’яжіть WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Запустіть gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший запит на pairing (якщо використовується режим pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на pairing спливає через 1 годину. Для кожного каналу може бути не більше 3 незавершених запитів.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовано для такого варіанта, але конфігурації з особистим номером також підтримуються.)
</Note>

## Сценарії розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найзручніший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM та межі маршрутизації
    - менша ймовірність плутанини з чатом із самим собою

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
    Onboarding підтримує режим особистого номера і записує базову конфігурацію, зручну для чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час runtime захист чату із самим собою спирається на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише для WhatsApp Web">
    Канал платформи обміну повідомленнями у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель runtime

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Вихідні надсилання потребують активного listener WhatsApp для цільового облікового запису.
- Чати status і broadcast ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; типове значення `main` зводить DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у форматі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями канального рівня для цього облікового запису.

    Подробиці поведінки runtime:

    - pairings зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, типово дозволяється прив’язаний власний номер
    - вихідні DM `fromMe` ніколи не проходять auto-paired

  </Tab>

  <Tab title="Групова політика + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, усі групи є допустимими
       - якщо `groups` присутній, він діє як group allowlist (дозволено `"*"`)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників оминається
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати весь вхідний груповий трафік

    Резервна логіка allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime резервно використовує `allowFrom`, коли воно доступне
    - allowlist відправників оцінюються перед активацією згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервна групова політика runtime має значення `allowlist` (із попередженням у логах), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    У групах відповіді типово вимагають згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявне виявлення reply-to-bot (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє вимогу згадки; це **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Доступ до неї обмежений власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та чату із самим собою

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники для чату із самим собою в WhatsApp:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку auto-trigger за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідна envelope + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються в спільну inbound envelope.

    Якщо існує цитована відповідь, контекст додається в такому вигляді:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Метадані відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Заповнювачі медіа та витягування location/contact">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою заповнювачів, наприклад:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Дані location і contact нормалізуються в текстовий контекст перед маршрутизацією.

  </Accordion>

  <Accordion title="Відкладене додавання історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бот нарешті активується.

    - типове обмеження: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери додавання:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts типово ввімкнені для прийнятих вхідних повідомлень WhatsApp.

    Вимкнення глобально:

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

    Для self-chat read receipts пропускаються, навіть якщо глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту">
    - типове обмеження частини: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім резервно використовує безпечне за довжиною розбиття
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються image, video, audio (голосова PTT-нотатка) і payload document
    - `audio/ogg` переписується в `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - анімоване відтворення GIF підтримується через `gifPlayback: true` під час надсилання video
    - captions застосовуються до першого елемента медіа під час надсилання payload відповіді з кількома медіа
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - для перевизначень окремих облікових записів використовується `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб вкладатися в ліміти
    - при збої надсилання медіа резервний варіант для першого елемента надсилає текстове попередження замість тихого відкидання відповіді
  </Accordion>
</AccordionGroup>

## Рівень реакцій

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції в WhatsApp:

| Рівень        | Ack reactions | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так           | Ні                           | Лише ack reactions (підтвердження до відповіді)  |
| `"minimal"`   | Так           | Так (обмежено)               | Ack + реакції агента з обережними вказівками     |
| `"extensive"` | Так           | Так (заохочуються)           | Ack + реакції агента з активним заохоченням      |

Типове значення: `"minimal"`.

Для перевизначень окремих облікових записів використовуйте `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp підтримує негайні ack reactions після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack reactions залежать від `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

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

- надсилаються одразу після прийняття вхідного повідомлення (до відповіді)
- збої логуються, але не блокують звичайну доставку відповіді
- у груповому режимі `mentions` реакція ставиться для ходів, активованих згадкою; групова активація `always` оминає цю перевірку
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ID облікових записів беруться з `channels.whatsapp.accounts`
    - типове вибирання облікового запису: `default`, якщо він є, інакше перший налаштований ID облікового запису (відсортований)
    - ID облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими даними">
    - поточний шлях до auth: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла default auth у `~/.openclaw/credentials/` усе ще розпізнається/мігрує для сценаріїв з default account
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан auth WhatsApp для цього облікового запису.

    У каталогах застарілої auth `oauth.json` зберігається, тоді як файли auth Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані з каналу, типово ввімкнені (вимкнення через `channels.whatsapp.configWrites=false`).

## Усунення проблем

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що прив’язку не виконано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але відключено / цикл повторного підключення">
    Симптом: прив’язаний обліковий запис із повторюваними відключеннями або спробами повторного підключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби прив’яжіть заново через `channels login`.

  </Accordion>

  <Accordion title="Немає активного listener під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, якщо для цільового облікового запису немає активного listener gateway.

    Переконайтеся, що gateway працює і обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - вимогу згадки (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому залишайте лише один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження про runtime Bun">
    Runtime gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - WhatsApp](/gateway/configuration-reference#whatsapp)

Важливі поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Пов’язане

- [Підключення](/channels/pairing)
- [Групи](/channels/groups)
- [Безпека](/gateway/security)
- [Маршрутизація каналів](/channels/channel-routing)
- [Маршрутизація кількох агентів](/concepts/multi-agent)
- [Усунення проблем](/channels/troubleshooting)
