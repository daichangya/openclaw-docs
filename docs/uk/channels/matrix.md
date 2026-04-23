---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування E2EE та верифікації Matrix
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-23T07:10:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 678d0e678cbb52a9817d5a1f4977a738820f6d0228f1810614c9c195c0de7218
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix — це вбудований channel Plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, rooms, threads, media, reactions, polls, location та E2EE.

## Вбудований Plugin

Matrix постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайним
пакетованим збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або нестандартне встановлення без Matrix, встановіть
його вручну:

Встановити з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановити з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Plugins](/uk/tools/plugin) щодо поведінки Plugin і правил встановлення.

## Налаштування

1. Переконайтеся, що Plugin Matrix доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - У старіших/нестандартних встановленнях його можна додати вручну за допомогою наведених вище команд.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix` одним із таких способів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть Gateway.
5. Почніть DM з ботом або запросіть його до room.
   - Нові запрошення Matrix працюють лише тоді, коли `channels.matrix.autoJoin` це дозволяє.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер Matrix запитує:

- URL homeserver
- метод автентифікації: access token або password
- user ID (лише для password auth)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до room і автоматичне приєднання за запрошенням

Ключова поведінка майстра:

- Якщо змінні середовища автентифікації Matrix уже існують і для цього облікового запису ще не збережено автентифікацію в config, майстер запропонує скорочений варіант із env vars, щоб зберігати автентифікацію в них.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для DM напряму приймають `@user:server`; відображувані імена працюють лише тоді, коли live directory lookup знаходить один точний збіг.
- Записи allowlist для room напряму приймають ID room та aliases. Надавайте перевагу `!room:server` або `#alias:server`; нерозв’язані імена ігноруються під час виконання під час розв’язання allowlist.
- У режимі allowlist для автоматичного приєднання за запрошенням використовуйте лише стабільні цілі запрошення: `!roomId:server`, `#alias:server` або `*`. Звичайні назви room відхиляються.
- Щоб розв’язати назви room перед збереженням, використайте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` типово має значення `off`.

Якщо залишити його незаданим, бот не приєднуватиметься до запрошених room або нових запрошень у стилі DM, тому він не з’являтиметься в нових групах або запрошених DM, якщо ви спочатку не приєднаєтесь вручну.

Установіть `autoJoin: "allowlist"` разом із `autoJoinAllowlist`, щоб обмежити, які запрошення він прийматиме, або встановіть `autoJoin: "always"`, якщо хочете, щоб він приєднувався до кожного запрошення.

У режимі `allowlist` `autoJoinAllowlist` приймає лише `!roomId:server`, `#alias:server` або `*`.
</Warning>

Приклад allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Приєднуватися до кожного запрошення:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Мінімальне налаштування на основі token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Налаштування на основі password (після входу token кешується):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix зберігає кешовані облікові дані в `~/.openclaw/credentials/matrix/`.
Для облікового запису за замовчуванням використовується `credentials.json`; для іменованих облікових записів — `credentials-<account>.json`.
Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для setup, doctor і виявлення статусу channel, навіть якщо поточна автентифікація не задана безпосередньо в config.

Відповідники змінних середовища (використовуються, коли ключ config не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для неосновних облікових записів використовуйте env vars із областю облікового запису:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Приклад для облікового запису `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Для нормалізованого ID облікового запису `ops-bot` використовуйте:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій у env vars з областю дії.
Наприклад, `-` перетворюється на `_X2D_`, тому `ops-prod` мапиться на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скорочений варіант із env vars лише тоді, коли ці env vars автентифікації вже наявні й для вибраного облікового запису ще не збережено автентифікацію Matrix у config.

<Note>
`MATRIX_HOMESERVER` входить до block list endpoint і не може задаватися з
файлу `.env` робочого простору. Він має надходити з shell environment або
середовища процесу Gateway, щоб недовірені робочі простори не могли перенаправити трафік Matrix
на інший homeserver. Див.
[Файли `.env` робочого простору](/uk/gateway/security) для повного списку.
</Note>

## Приклад конфігурації

Це практична базова конфігурація з DM pairing, allowlist для room та увімкненим E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM. OpenClaw не може надійно
класифікувати запрошену room як DM або group у момент запрошення, тому всі запрошення спочатку проходять через `autoJoin`.
`dm.policy` застосовується після того, як бот уже приєднався і room класифіковано як DM.

## Попередній перегляд streaming

Streaming відповідей Matrix вмикається за бажанням.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав одну live preview
відповідь, редагував цей preview на місці, поки модель генерує текст, а потім завершував його, коли
відповідь буде готова:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` — значення за замовчуванням. OpenClaw чекає на фінальну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане preview message для поточного блоку відповіді асистента з використанням звичайних текстових повідомлень Matrix. Це зберігає legacy preview-first поведінку сповіщень Matrix, тому стандартні клієнти можуть сповіщати про перший текст потокового preview, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане quiet preview notice для поточного блоку відповіді асистента. Використовуйте це лише тоді, коли ви також налаштовуєте push rules отримувача для фіналізованих редагувань preview.
- `blockStreaming: true` вмикає окремі progress messages Matrix. Якщо ввімкнено preview streaming, Matrix зберігає live draft для поточного блоку й залишає завершені блоки як окремі повідомлення.
- Коли preview streaming увімкнено, а `blockStreaming` вимкнено, Matrix редагує live draft на місці та фіналізує ту саму event, коли блок або весь хід завершується.
- Якщо preview більше не поміщається в одну event Matrix, OpenClaw зупиняє preview streaming і повертається до звичайної фінальної доставки.
- Відповіді з media, як і раніше, надсилають вкладення звичайним способом. Якщо застарілий preview більше не можна безпечно використати повторно, OpenClaw редагує його перед надсиланням фінальної відповіді з media.
- Редагування preview потребують додаткових викликів API Matrix. Залишайте streaming вимкненим, якщо хочете найобережнішу поведінку щодо rate limit.

`blockStreaming` сам по собі не вмикає draft previews.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагування preview; потім додавайте `blockStreaming: true` лише якщо також хочете, щоб завершені блоки відповіді асистента залишалися видимими як окремі progress messages.

Якщо вам потрібні стандартні сповіщення Matrix без користувацьких push rules, використовуйте `streaming: "partial"` для preview-first поведінки або залишайте `streaming` вимкненим для доставки лише фінальної відповіді. Із `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Self-hosted push rules для тихих фіналізованих preview

Якщо ви запускаєте власну інфраструктуру Matrix і хочете, щоб тихі previews надсилали сповіщення лише тоді, коли блок або
фінальна відповідь завершені, установіть `streaming: "quiet"` і додайте per-user push rule для фіналізованих редагувань preview.

Зазвичай це налаштування на рівні користувача-отримувача, а не глобальна зміна конфігурації homeserver:

Коротка схема перед початком:

- recipient user = людина, яка має отримати сповіщення
- bot user = обліковий запис Matrix OpenClaw, який надсилає відповідь
- для наведених нижче викликів API використовуйте access token користувача-отримувача
- у push rule зіставляйте `sender` з повним MXID bot user

1. Налаштуйте OpenClaw на використання тихих preview:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Переконайтеся, що обліковий запис отримувача вже отримує звичайні push-сповіщення Matrix. Правила для тихих preview
   працюють лише тоді, коли для цього користувача вже налаштовано pushers/devices.

3. Отримайте access token користувача-отримувача.
   - Використовуйте token користувача-отримувача, а не token бота.
   - Зазвичай найпростіше повторно використати token наявної сесії клієнта.
   - Якщо вам потрібно випустити новий token, можна увійти через стандартний Matrix Client-Server API:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Перевірте, що обліковий запис отримувача вже має pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо це повертає жодних активних pushers/devices, спочатку виправте звичайні сповіщення Matrix, а вже потім додавайте
наведене нижче правило OpenClaw.

OpenClaw позначає фіналізовані редагування текстового preview так:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Створіть override push rule для кожного облікового запису отримувача, який має отримувати ці сповіщення:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Замініть ці значення перед виконанням команди:

- `https://matrix.example.org`: базовий URL вашого homeserver
- `$USER_ACCESS_TOKEN`: access token користувача-отримувача
- `openclaw-finalized-preview-botname`: ID правила, унікальний для цього бота для цього користувача-отримувача
- `@bot:example.org`: MXID вашого Matrix-бота OpenClaw, а не MXID користувача-отримувача

Важливо для конфігурацій із кількома ботами:

- Push rules визначаються за ключем `ruleId`. Повторний запуск `PUT` для того самого ID правила оновлює саме це правило.
- Якщо один користувач-отримувач має отримувати сповіщення від кількох облікових записів Matrix-ботів OpenClaw, створіть окреме правило для кожного бота з унікальним ID правила для кожного збігу `sender`.
- Простий шаблон — `openclaw-finalized-preview-<botname>`, наприклад `openclaw-finalized-preview-ops` або `openclaw-finalized-preview-support`.

Правило обчислюється відносно відправника event:

- автентифікуйтеся за допомогою token користувача-отримувача
- зіставляйте `sender` з MXID бота OpenClaw

6. Переконайтеся, що правило існує:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Протестуйте streaming-відповідь. У тихому режимі в room має з’явитися тихий чернетковий preview, а фінальне
   редагування на місці має надіслати сповіщення, коли блок або весь хід завершиться.

Якщо пізніше потрібно видалити правило, видаліть той самий ID правила за допомогою token користувача-отримувача:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Примітки:

- Створюйте правило за допомогою access token користувача-отримувача, а не бота.
- Нові визначені користувачем правила `override` вставляються перед типовими правилами придушення, тому додатковий параметр порядку не потрібен.
- Це впливає лише на текстові редагування preview, які OpenClaw може безпечно фіналізувати на місці. Fallback для media і fallback для застарілого preview, як і раніше, використовують звичайну доставку Matrix.
- Якщо `GET /_matrix/client/v3/pushers` не показує pushers, користувач ще не має працездатної доставки Matrix push для цього облікового запису/пристрою.

#### Synapse

Для Synapse описаного вище налаштування зазвичай достатньо саме по собі:

- Жодних спеціальних змін у `homeserver.yaml` для сповіщень про фіналізований preview OpenClaw не потрібно.
- Якщо ваше розгортання Synapse вже надсилає звичайні Matrix push-сповіщення, головним кроком налаштування є token користувача + виклик `pushrules`, наведений вище.
- Якщо ви запускаєте Synapse за reverse proxy або workers, переконайтеся, що `/_matrix/client/.../pushrules/` коректно доходить до Synapse.
- Якщо ви використовуєте workers у Synapse, переконайтеся, що pushers працездатні. Доставка push обробляється основним процесом або `synapse.app.pusher` / налаштованими pusher workers.

#### Tuwunel

Для Tuwunel використовуйте той самий процес налаштування і виклик API `pushrules`, показані вище:

- Специфічна для Tuwunel конфігурація для самого маркера фіналізованого preview не потрібна.
- Якщо для цього користувача вже працюють звичайні Matrix-сповіщення, головним кроком налаштування є token користувача + виклик `pushrules`, наведений вище.
- Якщо здається, що сповіщення зникають, поки користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цю опцію в Tuwunel 1.4.2 12 вересня 2025 року, і вона може навмисно придушувати push на інші пристрої, поки один пристрій активний.

## Кімнати бот-до-бота

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів Matrix OpenClaw ігноруються.

Використовуйте `allowBots`, якщо ви навмисно хочете дозволити міжагентний трафік Matrix:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів Matrix-ботів у дозволених rooms і DM.
- `allowBots: "mentions"` приймає такі повідомлення лише тоді, коли вони явно згадують цього бота в rooms. DM, як і раніше, дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї room.
- OpenClaw, як і раніше, ігнорує повідомлення від того самого user ID Matrix, щоб уникнути циклів самовідповіді.
- Matrix тут не надає нативного прапорця бота; OpenClaw вважає "створеним ботом" те, що "надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw".

У разі ввімкнення трафіку бот-до-бота в спільних rooms використовуйте суворі allowlist для room і вимоги щодо згадок.

## Шифрування та верифікація

В encrypted (E2EE) rooms вихідні image events використовують `thumbnail_file`, тому previews зображень шифруються разом із повним вкладенням. У незашифрованих rooms, як і раніше, використовується звичайний `thumbnail_url`. Налаштування не потрібні — Plugin автоматично визначає стан E2EE.

Увімкнення шифрування:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Перевірити статус верифікації:

```bash
openclaw matrix verify status
```

Докладний статус (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включити збережений recovery key у machine-readable output:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Ініціалізувати cross-signing і стан верифікації:

```bash
openclaw matrix verify bootstrap
```

Докладна діагностика bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Примусово скинути поточну identity cross-signing перед bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Верифікувати цей пристрій за допомогою recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Докладні відомості про верифікацію пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірити стан резервної копії room keys:

```bash
openclaw matrix verify backup status
```

Докладна діагностика стану резервної копії:

```bash
openclaw matrix verify backup status --verbose
```

Відновити room keys із серверної резервної копії:

```bash
openclaw matrix verify backup restore
```

Докладна діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видалити поточну серверну резервну копію і створити нову базову резервну копію. Якщо збережений
backup key не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
майбутні cold starts могли завантажувати новий backup key:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` за замовчуванням лаконічні (включно з тихим внутрішнім логуванням SDK) і показують детальну діагностику лише з `--verbose`.
Використовуйте `--json` для повного machine-readable output у скриптах.

У конфігураціях із кількома обліковими записами команди Matrix CLI використовують неявний основний обліковий запис Matrix, якщо ви не передасте `--account <id>`.
Якщо ви налаштовуєте кілька іменованих облікових записів, спочатку встановіть `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупинятимуться і проситимуть вас явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації або з пристроями явно були спрямовані на іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнено або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ config цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

### Що означає "verified"

OpenClaw вважає цей пристрій Matrix верифікованим лише тоді, коли його верифіковано вашою власною identity cross-signing.
На практиці `openclaw matrix verify status --verbose` показує три сигнали довіри:

- `Locally trusted`: цьому пристрою довіряє лише поточний клієнт
- `Cross-signing verified`: SDK повідомляє, що пристрій верифіковано через cross-signing
- `Signed by owner`: пристрій підписано вашим власним self-signing key

`Verified by owner` набуває значення `yes` лише за наявності верифікації cross-signing або підпису власника.
Самої лише локальної довіри недостатньо, щоб OpenClaw вважав пристрій повністю верифікованим.

### Що робить bootstrap

`openclaw matrix verify bootstrap` — це команда ремонту і налаштування для encrypted облікових записів Matrix.
Вона послідовно робить усе наведене нижче:

- ініціалізує secret storage, повторно використовуючи наявний recovery key, якщо це можливо
- ініціалізує cross-signing і вивантажує відсутні публічні ключі cross-signing
- намагається позначити і кроспідписати поточний пристрій
- створює нову серверну резервну копію room keys, якщо її ще не існує

Якщо homeserver вимагає інтерактивну автентифікацію для вивантаження ключів cross-signing, OpenClaw спочатку намагається виконати вивантаження без автентифікації, потім із `m.login.dummy`, а потім із `m.login.password`, якщо налаштовано `channels.matrix.password`.

Використовуйте `--force-reset-cross-signing` лише тоді, коли ви свідомо хочете відкинути поточну identity cross-signing і створити нову.

Якщо ви свідомо хочете відкинути поточну резервну копію room keys і почати нову
базову резервну копію для майбутніх повідомлень, використовуйте `openclaw matrix verify backup reset --yes`.
Робіть це лише тоді, коли погоджуєтеся, що невідновлювана стара encrypted history залишиться
недоступною і що OpenClaw може повторно створити secret storage, якщо поточний backup
secret неможливо безпечно завантажити.

### Нова базова резервна копія

Якщо ви хочете зберегти працездатність майбутніх encrypted повідомлень і погоджуєтеся втратити невідновлювану стару history, виконайте ці команди в такому порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Додавайте `--account <id>` до кожної команди, якщо хочете явно націлити їх на іменований обліковий запис Matrix.

### Поведінка під час запуску

Коли `encryption: true`, для Matrix значення `startupVerification` за замовчуванням — `"if-unverified"`.
Під час запуску, якщо цей пристрій усе ще не верифіковано, Matrix надішле запит на самоверифікацію в іншому Matrix client,
пропустить дубльовані запити, якщо один уже очікує виконання, і застосує локальний cooldown перед повторною спробою після перезапусків.
За замовчуванням невдалі спроби запиту повторюються швидше, ніж успішне створення запиту.
Установіть `startupVerification: "off"`, щоб вимкнути автоматичні запити під час запуску, або налаштуйте `startupVerificationCooldownHours`,
якщо вам потрібне коротше або довше вікно повторної спроби.

Під час запуску також автоматично виконується консервативний прохід crypto bootstrap.
Цей прохід спочатку намагається повторно використати поточні secret storage та identity cross-signing і уникає скидання cross-signing, якщо ви не запускаєте явний процес ремонту bootstrap.

Якщо під час запуску все ще виявляється зламаний стан bootstrap, OpenClaw може спробувати захищений шлях ремонту навіть тоді, коли `channels.matrix.password` не налаштовано.
Якщо homeserver для цього ремонту вимагає UIA на основі password, OpenClaw записує попередження в лог і зберігає запуск нефатальним замість переривання бота.
Якщо поточний пристрій уже підписано власником, OpenClaw зберігає цю identity замість її автоматичного скидання.

Див. [Міграція Matrix](/uk/install/migrating-matrix) для повного процесу оновлення, обмежень, команд відновлення та типових повідомлень міграції.

### Сповіщення про верифікацію

Matrix публікує сповіщення про життєвий цикл верифікації безпосередньо в сувору DM room верифікації як повідомлення `m.notice`.
Сюди входять:

- сповіщення про запит верифікації
- сповіщення про готовність до верифікації (з явною підказкою "Verify by emoji")
- сповіщення про початок і завершення верифікації
- деталі SAS (emoji і десяткові значення), коли доступні

Вхідні запити на верифікацію з іншого Matrix client відстежуються й автоматично приймаються OpenClaw.
Для процесів самоверифікації OpenClaw також автоматично запускає SAS-процес, коли стає доступною верифікація за emoji, і підтверджує свій бік.
Для запитів на верифікацію від іншого користувача/пристрою Matrix OpenClaw автоматично приймає запит, а потім чекає, поки SAS-процес відбуватиметься звичайним чином.
Щоб завершити верифікацію, вам усе одно потрібно порівняти emoji або десятковий SAS у своєму Matrix client і підтвердити там "They match".

OpenClaw не приймає автоматично бездумно дубльовані процеси, ініційовані самим користувачем. Під час запуску створення нового запиту пропускається, якщо запит на самоверифікацію вже очікує виконання.

Сповіщення протоколу/системи верифікації не пересилаються в pipeline чату агента, тому вони не породжують `NO_REPLY`.

### Гігієна пристроїв

Старі керовані OpenClaw пристрої Matrix можуть накопичуватися в обліковому записі й ускладнювати розуміння довіри в encrypted rooms.
Щоб переглянути їх, використайте:

```bash
openclaw matrix devices list
```

Щоб видалити застарілі керовані OpenClaw пристрої, використайте:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EE використовує офіційний шлях Rust crypto з `matrix-js-sdk` у Node, із `fake-indexeddb` як shim для IndexedDB. Crypto state зберігається у файл snapshot (`crypto-idb-snapshot.json`) і відновлюється під час запуску. Файл snapshot є чутливим runtime state і зберігається з обмежувальними правами доступу до файлу.

Encrypted runtime state зберігається в коренях для кожного облікового запису й кожного користувача з hash token у
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Цей каталог містить sync store (`bot-storage.json`), crypto store (`crypto/`),
файл recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
thread bindings (`thread-bindings.json`) і startup verification state (`startup-verification.json`).
Коли token змінюється, але identity облікового запису залишається тією самою, OpenClaw повторно використовує найкращий наявний
корінь для цього кортежу account/homeserver/user, щоб попередній sync state, crypto state, thread bindings
і startup verification state залишалися доступними.

## Керування профілем

Оновіть власний профіль Matrix для вибраного облікового запису командою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix напряму приймає URL аватарів `mxc://`. Якщо ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його в Matrix, а потім зберігає отриманий URL `mxc://` назад у `channels.matrix.avatarUrl` (або у перевизначення для вибраного облікового запису).

## Threads

Matrix підтримує нативні threads Matrix як для автоматичних відповідей, так і для надсилань через message-tool.

- `dm.sessionScope: "per-user"` (типово) зберігає маршрутизацію Matrix DM на рівні відправника, тому кілька DM rooms можуть ділити одну session, якщо вони відповідають тому самому peer.
- `dm.sessionScope: "per-room"` ізолює кожну Matrix DM room у власний ключ session, водночас використовуючи звичайні перевірки auth і allowlist для DM.
- Явні conversation bindings Matrix усе одно мають пріоритет над `dm.sessionScope`, тому прив’язані rooms і threads зберігають вибрану цільову session.
- `threadReplies: "off"` зберігає відповіді на верхньому рівні та залишає вхідні threaded messages у батьківській session.
- `threadReplies: "inbound"` відповідає всередині thread лише тоді, коли вхідне повідомлення вже було в цьому thread.
- `threadReplies: "always"` зберігає відповіді room у thread із коренем у повідомленні-тригері й маршрутизує цю conversation через відповідну thread-scoped session від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає налаштування верхнього рівня лише для DM. Наприклад, можна ізолювати threads у rooms, залишаючи DM пласкими.
- Вхідні threaded messages включають кореневе повідомлення thread як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковують поточний thread Matrix, коли ціль — та сама room або та сама DM-ціль користувача, якщо явно не вказано `threadId`.
- Повторне використання DM user-target для тієї самої session спрацьовує лише тоді, коли метадані поточної session підтверджують того самого DM peer у тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації на рівні користувача.
- Коли OpenClaw бачить, що Matrix DM room конфліктує з іншою DM room у тій самій спільній Matrix DM session, він один раз публікує `m.notice` у цій room із запасним варіантом `/focus`, коли ввімкнено thread bindings і підказку `dm.sessionScope`.
- Runtime thread bindings підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до thread `/acp spawn` працюють у Matrix rooms і DM.
- `/focus` верхнього рівня в Matrix room/DM створює новий thread Matrix і прив’язує його до цільової session, коли `threadBindings.spawnSubagentSessions=true`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявного thread Matrix натомість прив’язує цей поточний thread.

## Прив’язки conversation ACP

Rooms, DM і наявні threads Matrix можна перетворити на довговічні робочі простори ACP без зміни поверхні чату.

Швидкий процес для операторів:

- Запустіть `/acp spawn codex --bind here` всередині Matrix DM, room або наявного thread, який хочете й надалі використовувати.
- У Matrix DM або room верхнього рівня поточний DM/room залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної session ACP.
- Усередині наявного thread Matrix `--bind here` прив’язує цей поточний thread на місці.
- `/new` і `/reset` скидають ту саму прив’язану session ACP на місці.
- `/acp close` закриває session ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній thread Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній thread Matrix.

### Конфігурація прив’язки thread

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення на рівні channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення з прив’язкою до thread для Matrix вмикаються окремо:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати й прив’язувати нові threads Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати sessions ACP до threads Matrix.

## Reactions

Matrix підтримує вихідні дії reaction, вхідні сповіщення reaction і вхідні ack reactions.

- Інструменти вихідних reactions контролюються через `channels["matrix"].actions.reactions`.
- `react` додає reaction до конкретної event Matrix.
- `reactions` показує поточний зведений список reactions для конкретної event Matrix.
- `emoji=""` видаляє власні reactions облікового запису бота для цієї event.
- `remove: true` видаляє лише reaction із вказаним emoji з облікового запису бота.

Область ack reactions визначається у стандартному порядку OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback на emoji identity агента

Область `ackReaction` визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про reactions визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- типово: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані events `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні events reactions.
- Видалення reactions не синтезуються в системні events, тому що Matrix відображає їх як redactions, а не як окремі видалення `m.reaction`.

## Контекст history

- `channels.matrix.historyLimit` визначає, скільки нещодавніх повідомлень room включається як `InboundHistory`, коли повідомлення Matrix room активує агента. Використовує fallback до `messages.groupChat.historyLimit`; якщо обидва не задані, фактичне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- History Matrix room обмежується room. Для DM, як і раніше, використовується звичайна history session.
- History Matrix room є лише pending: OpenClaw буферизує повідомлення room, які ще не спричинили відповідь, а потім фіксує це вікно, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається до `InboundHistory`; воно залишається в основному вхідному body для цього ходу.
- Повторні спроби для тієї самої event Matrix повторно використовують початковий snapshot history замість зміщення вперед до новіших повідомлень room.

## Видимість контексту

Matrix підтримує спільний параметр `contextVisibility` для додаткового контексту room, такого як отриманий текст відповіді, корені thread і pending history.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist для room/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Цей параметр впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення активувати відповідь.
Авторизація тригера, як і раніше, визначається `groupPolicy`, `groups`, `groupAllowFrom` і налаштуваннями політики DM.

## Політика DM і room

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Див. [Groups](/uk/channels/groups) щодо згадок як умови відповіді та поведінки allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending pairing code і може знову надіслати відповідь-нагадування після короткого cooldown замість створення нового code.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу DM pairing і структури зберігання.

## Відновлення direct room

Якщо стан direct-message виходить із синхронізації, OpenClaw може отримати застарілі зіставлення `m.direct`, які вказують на старі solo rooms замість активного DM. Переглянути поточне зіставлення для peer можна командою:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Відновити його можна так:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес відновлення:

- надає перевагу строгому 1:1 DM, який уже зіставлений у `m.direct`
- інакше використовує будь-який поточний strict 1:1 DM із цим користувачем, до якого виконано приєднання
- створює нову direct room і переписує `m.direct`, якщо здорового DM не існує

Процес відновлення не видаляє старі rooms автоматично. Він лише вибирає здоровий DM і оновлює зіставлення, щоб нові надсилання Matrix, сповіщення про верифікацію та інші direct-message-процеси знову націлювалися на правильну room.

## Погодження exec

Matrix може працювати як нативний клієнт погодження для облікового запису Matrix. Нативні
параметри маршрутизації DM/channel, як і раніше, знаходяться в config погодження exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; використовує fallback до `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Особи, що погоджують, мають бути user ID Matrix, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні погодження, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного approver. Погодження exec спочатку використовують `execApprovals.approvers` і можуть використовувати fallback до `channels.matrix.dm.allowFrom`. Погодження Plugin авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт погодження. Інакше запити на погодження використовують fallback до інших налаштованих маршрутів погодження або до політики fallback погодження.

Нативна маршрутизація Matrix підтримує обидва типи погоджень:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout DM/channel для запитів погодження Matrix.
- Погодження exec використовують набір approvers для exec із `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Погодження Plugin використовують allowlist Matrix DM із `channels.matrix.dm.allowFrom`.
- Скорочення через reactions Matrix і оновлення повідомлень застосовуються як до погоджень exec, так і до погоджень Plugin.

Правила доставки:

- `target: "dm"` надсилає запити на погодження в DM осіб, що погоджують
- `target: "channel"` надсилає запит назад у вихідну Matrix room або DM
- `target: "both"` надсилає в DM осіб, що погоджують, і у вихідну Matrix room або DM

Запити на погодження Matrix ініціалізують скорочення через reactions на основному повідомленні погодження:

- `✅` = дозволити один раз
- `❌` = відхилити
- `♾️` = дозволити завжди, якщо таке рішення дозволене ефективною політикою exec

Особи, що погоджують, можуть реагувати на це повідомлення або використовувати резервні slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише визначені approvers можуть погоджувати або відхиляти. Для погоджень exec доставка в channel включає текст команди, тому вмикайте `channel` або `both` лише в довірених rooms.

Перевизначення для окремого облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Погодження exec](/uk/tools/exec-approvals)

## Slash-команди

Slash-команди Matrix (наприклад, `/new`, `/reset`, `/model`) працюють безпосередньо в DM. У rooms OpenClaw також розпізнає slash-команди, яким передує власна згадка бота Matrix, тому `@bot:server /new` запускає шлях команди без потреби в користувацькому regex для згадки. Це зберігає чутливість бота до публікацій у room у стилі `@mention /command`, які Element та подібні клієнти надсилають, коли користувач автодоповнює бота перед введенням команди.

Правила авторизації все одно застосовуються: відправники команд мають відповідати політикам allowlist/owner для DM або room так само, як і для звичайних повідомлень.

## Кілька облікових записів

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис не перевизначає їх.
Ви можете обмежити успадковані записи room одним обліковим записом Matrix за допомогою `groups.<room>.account`.
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли основний обліковий запис налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні значення auth за замовчуванням самі по собі не створюють окремий неявний основний обліковий запис. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей обліковий запис за замовчуванням має актуальні дані auth (`homeserver` плюс `accessToken`, або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть залишатися доступними для виявлення через `homeserver` плюс `userId`, коли кешовані облікові дані пізніше задовольнять auth.
Якщо Matrix уже має рівно один іменований обліковий запис, або `defaultAccount` указує на наявний ключ іменованого облікового запису, під час відновлення/перенесення з одного облікового запису до кількох облікових записів зберігається цей обліковий запис замість створення нового запису `accounts.default`. У цей перенесений обліковий запис переміщуються лише ключі Matrix auth/bootstrap; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw надавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, перевірок і операцій CLI.
Якщо налаштовано кілька облікових записів Matrix і один з ID облікового запису — `default`, OpenClaw неявно використовує цей обліковий запис, навіть якщо `defaultAccount` не задано.
Якщо ви налаштовуєте кілька іменованих облікових записів, задайте `defaultAccount` або передавайте `--account <id>` для команд CLI, які залежать від неявного вибору облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, якщо хочете перевизначити цей неявний вибір для однієї команди.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference#multi-account-all-channels) щодо спільного шаблону для кількох облікових записів.

## Приватні/LAN homeservers

За замовчуванням OpenClaw блокує приватні/внутрішні homeservers Matrix для захисту від SSRF, якщо ви
явно не ввімкнете це окремо для кожного облікового запису.

Якщо ваш homeserver працює на localhost, IP LAN/Tailscale або внутрішньому імені хоста, увімкніть
`network.dangerouslyAllowPrivateNetwork` для цього облікового запису Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Приклад налаштування через CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Це явне ввімкнення дозволяє лише довірені приватні/внутрішні цілі. Публічні homeservers без шифрування, наприклад
`http://matrix.example.org:8008`, як і раніше, блокуються. За можливості віддавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо для вашого розгортання Matrix потрібен явний вихідний HTTP(S) proxy, задайте `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Іменовані облікові записи можуть перевизначати значення верхнього рівня через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує те саме налаштування proxy як для runtime-трафіку Matrix, так і для перевірок статусу облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей усюди, де OpenClaw просить вас указати ціль room або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Rooms: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Live directory lookup використовує обліковий запис Matrix, під яким виконано вхід:

- Пошук користувачів виконує запити до каталогу користувачів Matrix на цьому homeserver.
- Пошук rooms напряму приймає явні ID room і aliases, а потім використовує fallback до пошуку за назвами rooms, до яких приєднано цей обліковий запис.
- Пошук за назвами приєднаних rooms є best-effort. Якщо назву room неможливо розв’язати до ID або alias, вона ігнорується під час runtime-розв’язання allowlist.

## Довідник із конфігурації

- `enabled`: увімкнути або вимкнути channel.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeservers. Увімкніть це, коли homeserver розв’язується в `localhost`, IP LAN/Tailscale або внутрішній хост, наприклад `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S) proxy для трафіку Matrix. Іменовані облікові записи можуть перевизначати значення верхнього рівня власним `proxy`.
- `userId`: повний Matrix user ID, наприклад `@bot:example.org`.
- `accessToken`: access token для auth на основі token. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються прості текстові значення та значення SecretRef у постачальниках env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).
- `password`: password для входу на основі password. Підтримуються прості текстові значення та значення SecretRef.
- `deviceId`: явний Matrix device ID.
- `deviceName`: відображувана назва пристрою для входу за password.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю й оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість events, отримуваних під час стартової синхронізації.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли `true`, підвищує політику room `open` до `allowlist` і примусово встановлює для всіх активних політик DM, окрім `disabled` (включно з `pairing` і `open`), значення `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів Matrix OpenClaw (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту room (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID для трафіку room. Найбезпечніше використовувати повні Matrix user ID; точні збіги каталогу розв’язуються під час запуску і коли allowlist змінюється під час роботи монітора. Нерозв’язані імена ігноруються.
- `historyLimit`: максимальна кількість повідомлень room, які включаються як контекст history групи. Використовує fallback до `messages.groupChat.historyLimit`; якщо обидва значення не задані, фактичне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (типово), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернеток у режимі preview-first зі звичайними текстовими повідомленнями Matrix. `"quiet"` використовує preview notices без сповіщень для self-hosted налаштувань push-rule. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі progress messages для завершених блоків відповіді асистента, поки активне чернеткове preview streaming.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення на рівні channel для маршрутизації session, прив’язаної до thread, і її життєвого циклу.
- `startupVerification`: режим автоматичного запиту на самоверифікацію під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів на верифікацію під час запуску.
- `textChunkLimit`: розмір частини вихідного повідомлення в символах (застосовується, коли `chunkMode` має значення `length`).
- `chunkMode`: `length` розбиває повідомлення за кількістю символів; `newline` розбиває за межами рядків.
- `responsePrefix`: необов’язковий рядок, який додається на початок усіх вихідних відповідей для цього channel.
- `ackReaction`: необов’язкове перевизначення ack reaction для цього channel/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області ack reaction (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень reaction (`own`, `off`).
- `mediaMaxMb`: ліміт розміру media в МБ для вихідних надсилань і обробки вхідних media.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). Типово: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: rooms/aliases, дозволені, коли `autoJoin` має значення `allowlist`. Записи alias розв’язуються до ID room під час обробки запрошення; OpenClaw не довіряє стану alias, заявленому запрошеною room.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw приєднався до room і класифікував її як DM. Це не змінює того, чи буде запрошення автоматично прийняте.
- `dm.allowFrom`: allowlist user ID для трафіку DM. Найбезпечніше використовувати повні Matrix user ID; точні збіги каталогу розв’язуються під час запуску і коли allowlist змінюється під час роботи монітора. Нерозв’язані імена ігноруються.
- `dm.sessionScope`: `per-user` (типово) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна Matrix DM room зберігала окремий контекст, навіть якщо peer той самий.
- `dm.threadReplies`: перевизначення політики thread лише для DM (`off`, `inbound`, `always`). Воно перевизначає значення `threadReplies` верхнього рівня як для розміщення відповідей, так і для ізоляції session у DM.
- `execApprovals`: нативна доставка погоджень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix user IDs, яким дозволено погоджувати exec-запити. Необов’язковий параметр, якщо `dm.allowFrom` уже визначає осіб, що погоджують.
- `execApprovals.target`: `dm | channel | both` (типово: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для цих записів.
- `groups`: мапа політик для окремих rooms. Надавайте перевагу ID room або aliases; нерозв’язані назви room ігноруються під час виконання. Після розв’язання ідентичність session/group використовує стабільний ID room.
- `groups.<room>.account`: обмежити один успадкований запис room конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні room для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої room.
- `groups.<room>.tools`: перевизначення allow/deny інструментів для окремої room.
- `groups.<room>.autoReply`: перевизначення вимоги згадки на рівні room. `true` вимикає вимогу згадки для цієї room; `false` примусово вмикає її знову.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні room.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент системного prompt на рівні room.
- `rooms`: застарілий alias для `groups`.
- `actions`: обмеження інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язані

- [Огляд channels](/uk/channels) — усі підтримувані channels
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та згадки як умова відповіді
- [Маршрутизація channel](/uk/channels/channel-routing) — маршрутизація sessions для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
