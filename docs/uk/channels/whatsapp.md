---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T03:02:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120033548f60a39619952e908bd4925dc7da5f8baaa4406ed455aa46010fbb2e
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готово до production через WhatsApp Web (Baileys). Gateway керує пов’язаними сесіями.

## Встановлення (за потреби)

- Під час онбордингу (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  буде запропоновано встановити Plugin WhatsApp, коли ви вперше його виберете.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  Plugin ще не встановлено.
- Канал dev + checkout з git: за замовчуванням використовується локальний шлях Plugin.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для невідомих відправників — сполучення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
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

  <Step title="Під’єднайте WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб під’єднати наявний/власний каталог автентифікації WhatsApp Web перед входом:

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

  <Step title="Підтвердьте перший запит на сполучення (якщо використовується режим сполучення)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на сполучення спливає через 1 годину. Кількість очікуваних запитів обмежена до 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, коли це можливо, запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого варіанта, але сценарії з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
    - нижча ймовірність плутанини із самочатом

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
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, дружню до самочату:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час роботи захист самочату спирається на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Обмеження каналу лише WhatsApp Web">
    Канал платформи обміну повідомленнями в поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі chat-channel немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Для вихідного надсилання потрібен активний слухач WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; значення за замовчуванням `main` зводить DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста, а не специфічним для каналу налаштуванням проксі WhatsApp.

## Хуки Plugin і конфіденційність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сесій. З цієї причини
WhatsApp не транслює вхідні payload `message_received` у Plugin
без вашої явної згоди:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Ви можете обмежити цю згоду одним обліковим записом:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Вмикайте це лише для тих Plugin, яким ви довіряєте отримання вхідного вмісту
повідомлень WhatsApp та ідентифікаторів.

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (внутрішньо нормалізуються).

    Багатооблікове перевизначення: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями за замовчуванням на рівні каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - сполучення зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволяється за замовчуванням
    - OpenClaw ніколи не виконує автоматичне сполучення для вихідних `fromMe` DM (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Групова політика + allowlist">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, допустимими є всі групи
       - якщо `groups` присутній, він працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні групові повідомлення

    Резервне значення allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist відправників оцінюються до активації за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервна групова політика під час виконання — `allowlist` (із попередженням у журналі), навіть якщо встановлено `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    За замовчуванням для групових відповідей потрібна згадка.

    Визначення згадок включає:

    - явні згадки ідентичності бота у WhatsApp
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявне визначення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера і самочату

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники самочату WhatsApp:

- пропускати read receipts для ходів самочату
- ігнорувати поведінку автоматичного тригера mention-JID, яка інакше сповіщала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді самочату за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний envelope + контекст відповіді">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такому вигляді:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Заповнювачі медіа та витягування location/contact">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою таких заповнювачів:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіла location використовують стислий текст координат. Мітки/коментарі location і дані contact/vCard відображаються як fenced недовірені метадані, а не як вбудований текст prompt.

  </Accordion>

  <Accordion title="Ін’єкція історії очікування групи">
    Для груп необроблені повідомлення можуть буферизуватися та ін’єктуватися як контекст, коли бот нарешті спрацьовує.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

    - `[Повідомлення чату з вашої останньої відповіді — для контексту]`
    - `[Поточне повідомлення — дайте відповідь на нього]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts увімкнено за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Для ходів самочату read receipts пропускаються навіть коли вони глобально увімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на частини">
    - ліміт частини за замовчуванням: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного розбиття за довжиною
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються payload зображень, відео, аудіо (голосове повідомлення PTT) і документів
    - аудіомедіа надсилається через payload `audio` Baileys з `ptt: true`, тому клієнти WhatsApp відображають його як голосове повідомлення push-to-talk
    - payload відповідей зберігають `audioAsVoice`; вихід голосових повідомлень TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - рідне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими повідомленнями
    - аудіо не у форматі Ogg, включно з виходом TTS MP3/WebM від Microsoft Edge, транскодується за допомогою `ffmpeg` у 48 кГц моно Ogg/Opus перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одне голосове повідомлення й пригнічує повторне надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - підтримується відтворення анімованих GIF через `gifPlayback: true` під час надсилання відео
    - captions застосовуються до першого елемента медіа під час надсилання payload відповіді з кількома медіа, за винятком того, що голосові повідомлення PTT надсилають аудіо спочатку, а видимий текст окремо, оскільки клієнти WhatsApp не завжди коректно відображають captions голосових повідомлень
    - джерелом медіа можуть бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (підбір розміру/якості), щоб відповідати обмеженням
    - якщо надсилання медіа не вдається, резервний механізм для першого елемента надсилає текстове попередження замість тихого пропуску відповіді
  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді візуально цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                      |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                            |
| `"batched"` | Цитувати відкладені пакетні відповіді, залишаючи негайні без цитування |

Значення за замовчуванням — `"off"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Рівень реакцій

`channels.whatsapp.reactionLevel` визначає, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень       | Ack-реакції | Реакції, ініційовані агентом | Опис                                              |
| ------------ | ----------- | ---------------------------- | ------------------------------------------------- |
| `"off"`      | Ні          | Ні                           | Жодних реакцій                                    |
| `"ack"`      | Так         | Ні                           | Лише ack-реакції (підтвердження до відповіді)     |
| `"minimal"`  | Так         | Так (обережно)              | Ack + реакції агента з консервативними вказівками |
| `"extensive"`| Так         | Так (заохочується)          | Ack + реакції агента із заохочувальними вказівками |

За замовчуванням: `"minimal"`.

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

WhatsApp підтримує негайні ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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
- збої журналюються, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, активовані згадкою; групова активація `always` обходить цю перевірку
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо він присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність зі застарілими варіантами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків з обліковим записом за замовчуванням
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та запис конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Запис конфігурації, ініційований каналом, увімкнено за замовчуванням (вимикається через `channels.whatsapp.configWrites=false`).

## Усунення проблем

<AccordionGroup>
  <Accordion title="Не під’єднано (потрібен QR)">
    Симптом: статус каналу повідомляє, що під’єднання немає.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Під’єднано, але відключено / цикл повторного підключення">
    Симптом: під’єднаний обліковий запис із повторними відключеннями або спробами повторного підключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби повторно під’єднайте через `channels login`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідне надсилання швидко завершується помилкою, якщо для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено і обліковий запис під’єднано.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадками (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому зберігайте лише один `groupPolicy` на кожну область

  </Accordion>

  <Accordion title="Попередження про runtime Bun">
    Runtime Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompt

WhatsApp підтримує системні prompt у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Спочатку визначається ефективна мапа `groups`: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Пошук prompt потім виконується за єдиною отриманою мапою:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** у ньому визначено ключ `systemPrompt`. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Системний prompt wildcard для груп** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Спочатку визначається ефективна мапа `direct`: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Пошук prompt потім виконується за єдиною отриманою мапою:

1. **Системний prompt для конкретного direct-чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного peer існує в мапі **і** у ньому визначено ключ `systemPrompt`. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Системний prompt wildcard для direct-чатів** (`direct["*"].systemPrompt`): використовується, коли запис конкретного peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Примітка: `dms` залишається полегшеним контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`); перевизначення prompt містяться у `direct`.

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для тих, які не визначають власний `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. У WhatsApp цей запобіжник не застосовується: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не мають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні prompt для груп або direct-чатів на рівні окремого облікового запису, явно визначайте повну мапу під кожним обліковим записом, а не покладайтеся на значення за замовчуванням на кореневому рівні.

Важлива поведінка:

- `channels.whatsapp.groups` — це і мапа конфігурації окремих груп, і allowlist груп на рівні чату. На кореневому рівні або на рівні облікового запису `groups["*"]` означає «усі групи допущені» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб допустимим був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як значення prompt за замовчуванням. Натомість повторіть prompt у кожному явно дозволеному записі групи.
- Допуск груп і авторизація відправників — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає конфігурацію direct-чату за замовчуванням після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами pairing-store.

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

Важливі поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесій: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
