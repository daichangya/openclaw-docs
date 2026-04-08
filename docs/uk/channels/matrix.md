---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE і верифікації
summary: Стан підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-08T18:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28fc13c7620c1152200315ae69c94205da6de3180c53c814dd8ce03b5cb1758f
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix — це вбудований плагін каналу для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований плагін

Matrix постачається як вбудований плагін у поточних випусках OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо у вас старіша збірка або користувацьке встановлення без Matrix, встановіть
його вручну:

Встановлення з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Плагіни](/uk/tools/plugin) щодо поведінки плагінів і правил встановлення.

## Налаштування

1. Переконайтеся, що плагін Matrix доступний.
   - Поточні пакетні випуски OpenClaw уже містять його.
   - У старіших/користувацьких встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix` одним із варіантів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть gateway.
5. Почніть DM із ботом або запросіть його до кімнати.
   - Нові запрошення Matrix працюють лише тоді, коли `channels.matrix.autoJoin` це дозволяє.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер Matrix запитує:

- URL homeserver
- метод автентифікації: access token або пароль
- user ID (лише для автентифікації паролем)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат і автоматичне приєднання за запрошенням

Ключова поведінка майстра:

- Якщо змінні середовища автентифікації Matrix уже існують і для цього облікового запису автентифікацію ще не збережено в конфігурації, майстер запропонує скорочений варіант із env для зберігання автентифікації у змінних середовища.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для DM напряму приймають `@user:server`; відображувані імена працюють лише тоді, коли live lookup каталогу знаходить один точний збіг.
- Записи allowlist для кімнат напряму приймають ID кімнат і псевдоніми. Надавайте перевагу `!room:server` або `#alias:server`; нерозпізнані назви ігноруються під час виконання розв’язання allowlist.
- У режимі allowlist для автоматичного приєднання за запрошенням використовуйте лише стабільні цілі запрошення: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються.
- Щоб розв’язати назви кімнат перед збереженням, використайте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` за замовчуванням має значення `off`.

Якщо залишити його невстановленим, бот не приєднуватиметься до запрошених кімнат або нових запрошень у стилі DM, тому не з’являтиметься в нових групах або запрошених DM, якщо ви спершу не приєднаєте його вручну.

Установіть `autoJoin: "allowlist"` разом із `autoJoinAllowlist`, щоб обмежити, які запрошення він приймає, або встановіть `autoJoin: "always"`, якщо хочете, щоб він приєднувався до кожного запрошення.

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

Мінімальне налаштування на основі токена:

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

Налаштування на основі пароля (токен кешується після входу):

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
Обліковий запис за замовчуванням використовує `credentials.json`; іменовані облікові записи використовують `credentials-<account>.json`.
Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для setup, doctor і виявлення стану каналу, навіть якщо поточну автентифікацію не задано безпосередньо в конфігурації.

Еквіваленти змінних середовища (використовуються, коли ключ конфігурації не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів не за замовчуванням використовуйте змінні середовища з областю облікового запису:

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

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій у змінних середовища з областю дії.
Наприклад, `-` стає `_X2D_`, тому `ops-prod` перетворюється на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скорочений варіант через env vars лише тоді, коли ці змінні середовища автентифікації вже присутні, а для вибраного облікового запису автентифікацію Matrix ще не збережено в конфігурації.

## Приклад конфігурації

Це практична базова конфігурація з pairing для DM, allowlist для кімнат і ввімкненим E2EE:

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
класифікувати запрошену кімнату як DM або групу в момент запрошення, тому всі запрошення спочатку проходять через `autoJoin`.
`dm.policy` застосовується після того, як бот уже приєднався і кімнату класифіковано як DM.

## Попередній перегляд потокових відповідей

Потокова передача відповідей Matrix є опціональною.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав один live preview
відповіді, редагував цей preview на місці, поки модель генерує текст, а потім фіналізував його, коли
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
- `streaming: "partial"` створює одне редаговане preview-повідомлення для поточного блоку асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає застарілу поведінку Matrix із preview перед фіналом для сповіщень, тому стандартні клієнти можуть сповіщати про перший потоковий preview-текст, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане тихе preview-сповіщення для поточного блоку асистента. Використовуйте це лише тоді, коли ви також налаштовуєте push rules одержувача для фіналізованих редагувань preview.
- `blockStreaming: true` вмикає окремі повідомлення прогресу Matrix. Коли ввімкнено потоковий preview, Matrix зберігає live draft для поточного блоку та залишає завершені блоки як окремі повідомлення.
- Коли preview streaming увімкнено, а `blockStreaming` вимкнено, Matrix редагує live draft на місці й фіналізує цю саму подію, коли блок або хід завершується.
- Якщо preview більше не вміщується в одну подію Matrix, OpenClaw зупиняє preview streaming і повертається до звичайної фінальної доставки.
- Відповіді з медіа все одно надсилають вкладення у звичайному режимі. Якщо застарілий preview більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної медіавідповіді.
- Редагування preview вимагають додаткових викликів Matrix API. Залишайте streaming вимкненим, якщо хочете максимально консервативну поведінку щодо обмежень швидкості.

`blockStreaming` сам по собі не вмикає чернеткові preview.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагувань preview; потім додайте `blockStreaming: true`, лише якщо ви також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення прогресу.

Якщо вам потрібні стандартні сповіщення Matrix без користувацьких push rules, використовуйте `streaming: "partial"` для поведінки preview-first або залиште `streaming` вимкненим для доставки лише фінального варіанта. За `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне сповіщувальне повідомлення Matrix.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне сповіщувальне повідомлення Matrix.

### Self-hosted push rules для тихих фіналізованих preview

Якщо ви запускаєте власну інфраструктуру Matrix і хочете, щоб тихі preview сповіщали лише тоді, коли блок або
фінальна відповідь завершені, установіть `streaming: "quiet"` і додайте push rule для кожного користувача для фіналізованих редагувань preview.

Зазвичай це налаштування на рівні користувача-одержувача, а не глобальна зміна конфігурації homeserver:

Швидка схема перед початком:

- recipient user = людина, яка має отримувати сповіщення
- bot user = обліковий запис Matrix OpenClaw, який надсилає відповідь
- для наведених нижче викликів API використовуйте access token користувача-одержувача
- у push rule звіряйте `sender` із повним MXID користувача-бота

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

2. Переконайтеся, що обліковий запис одержувача вже отримує звичайні push-сповіщення Matrix. Правила тихих preview
   працюють лише тоді, коли цей користувач уже має робочі pushers/пристрої.

3. Отримайте access token користувача-одержувача.
   - Використовуйте токен користувача-одержувача, а не токен бота.
   - Найпростіше зазвичай повторно використати токен наявної сесії клієнта.
   - Якщо потрібно випустити новий токен, ви можете увійти через стандартний Matrix Client-Server API:

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

4. Перевірте, що обліковий запис одержувача вже має pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо це повертає нуль активних pushers/пристроїв, спочатку виправте звичайні сповіщення Matrix, а вже потім додавайте
наведене нижче правило OpenClaw.

OpenClaw позначає фіналізовані редагування preview лише для тексту таким маркером:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Створіть override push rule для кожного облікового запису одержувача, який має отримувати ці сповіщення:

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

Замініть ці значення перед запуском команди:

- `https://matrix.example.org`: базовий URL вашого homeserver
- `$USER_ACCESS_TOKEN`: access token користувача-одержувача
- `openclaw-finalized-preview-botname`: ID правила, унікальний для цього бота для цього користувача-одержувача
- `@bot:example.org`: MXID вашого Matrix-бота OpenClaw, а не MXID користувача-одержувача

Важливо для конфігурацій із кількома ботами:

- Push rules прив’язані до `ruleId`. Повторний запуск `PUT` для того самого ID правила оновлює саме це правило.
- Якщо один користувач-одержувач має отримувати сповіщення від кількох облікових записів Matrix-ботів OpenClaw, створіть по одному правилу на кожного бота з унікальним ID правила для кожного збігу sender.
- Простий шаблон — `openclaw-finalized-preview-<botname>`, наприклад `openclaw-finalized-preview-ops` або `openclaw-finalized-preview-support`.

Правило оцінюється відносно відправника події:

- автентифікуйтеся токеном користувача-одержувача
- звіряйте `sender` із MXID бота OpenClaw

6. Перевірте, що правило існує:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Протестуйте потокову відповідь. У тихому режимі в кімнаті має з’явитися тиха чернетка preview, а фінальне
   редагування на місці має надіслати одне сповіщення, коли блок або хід завершиться.

Якщо згодом потрібно видалити правило, видаліть той самий ID правила токеном користувача-одержувача:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Примітки:

- Створюйте правило за допомогою access token користувача-одержувача, а не токена бота.
- Нові користувацькі правила `override` вставляються перед типовими правилами придушення, тому додатковий параметр порядку не потрібен.
- Це впливає лише на редагування preview лише з текстом, які OpenClaw може безпечно фіналізувати на місці. Запасні варіанти для медіа та застарілих preview усе одно використовують звичайну доставку Matrix.
- Якщо `GET /_matrix/client/v3/pushers` показує відсутність pushers, у користувача ще немає робочої доставки push-сповіщень Matrix для цього облікового запису/пристрою.

#### Synapse

Для Synapse зазвичай достатньо наведеного вище налаштування:

- Жодних спеціальних змін у `homeserver.yaml` для фіналізованих preview-сповіщень OpenClaw не потрібно.
- Якщо ваш розгорнутий Synapse уже надсилає звичайні push-сповіщення Matrix, токен користувача + виклик `pushrules` вище є основним кроком налаштування.
- Якщо ви запускаєте Synapse за reverse proxy або workers, переконайтеся, що `/_matrix/client/.../pushrules/` коректно доходить до Synapse.
- Якщо ви використовуєте Synapse workers, переконайтеся, що pushers працездатні. Доставку push виконує головний процес або `synapse.app.pusher` / налаштовані pusher workers.

#### Tuwunel

Для Tuwunel використовуйте той самий процес налаштування і виклик API `push-rule`, наведені вище:

- Жодної специфічної для Tuwunel конфігурації для самого маркера фіналізованого preview не потрібно.
- Якщо звичайні сповіщення Matrix для цього користувача вже працюють, токен користувача + виклик `pushrules` вище є основним кроком налаштування.
- Якщо сповіщення ніби зникають, поки користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цей параметр у Tuwunel 1.4.2 12 вересня 2025 року, і він може навмисно пригнічувати push на інші пристрої, поки один пристрій активний.

## Кімнати бот-до-бота

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів Matrix OpenClaw ігноруються.

Використовуйте `allowBots`, якщо ви свідомо хочете міжагентний трафік Matrix:

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

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів Matrix-ботів у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає ці повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM усе одно дозволені.
- `groups.<room>.allowBots` перевизначає параметр рівня облікового запису для однієї кімнати.
- OpenClaw усе одно ігнорує повідомлення від того самого Matrix user ID, щоб уникнути циклів самовідповідей.
- Matrix тут не надає вбудованого прапорця бота; OpenClaw трактує «створено ботом» як «надіслано іншим налаштованим обліковим записом Matrix на цьому gateway OpenClaw».

Використовуйте суворі allowlist для кімнат і вимоги до згадувань, коли вмикаєте трафік бот-до-бота у спільних кімнатах.

## Шифрування та верифікація

У зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, тож preview зображень шифруються разом із повним вкладенням. У незашифрованих кімнатах, як і раніше, використовується звичайний `thumbnail_url`. Додаткова конфігурація не потрібна — плагін автоматично визначає стан E2EE.

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

Перевірка стану верифікації:

```bash
openclaw matrix verify status
```

Розширений стан (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включити збережений recovery key у машиночитний вивід:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Ініціалізація cross-signing і стану верифікації:

```bash
openclaw matrix verify bootstrap
```

Розширена діагностика bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Примусово скинути поточну ідентичність cross-signing перед bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Верифікувати цей пристрій за допомогою recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Розширені подробиці верифікації пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірка стану резервного копіювання ключів кімнат:

```bash
openclaw matrix verify backup status
```

Розширена діагностика стану резервного копіювання:

```bash
openclaw matrix verify backup status --verbose
```

Відновити ключі кімнат із резервної копії на сервері:

```bash
openclaw matrix verify backup restore
```

Розширена діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видалити поточну резервну копію на сервері й створити нову базову резервну копію. Якщо збережений
ключ резервного копіювання не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
майбутні cold start могли завантажувати новий ключ резервного копіювання:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` за замовчуванням лаконічні (включно з тихим внутрішнім логуванням SDK) і показують детальну діагностику лише з `--verbose`.
Для повного машиночитного виводу під час скриптування використовуйте `--json`.

У конфігураціях із кількома обліковими записами команди Matrix CLI використовують неявний обліковий запис Matrix за замовчуванням, якщо не передати `--account <id>`.
Якщо ви налаштували кілька іменованих облікових записів, спочатку задайте `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупиняться й попросять вас явно вибрати обліковий запис.
Використовуйте `--account` щоразу, коли хочете, щоб операції верифікації або пристроїв явно були націлені на іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнено або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

### Що означає «verified»

OpenClaw вважає цей пристрій Matrix verified лише тоді, коли він верифікований вашою власною cross-signing identity.
На практиці `openclaw matrix verify status --verbose` показує три сигнали довіри:

- `Locally trusted`: цьому пристрою довіряє лише поточний клієнт
- `Cross-signing verified`: SDK повідомляє, що пристрій верифіковано через cross-signing
- `Signed by owner`: пристрій підписано вашим власним self-signing key

`Verified by owner` стає `yes` лише тоді, коли є верифікація через cross-signing або підпис власника.
Локальної довіри самої по собі недостатньо, щоб OpenClaw вважав пристрій повністю verified.

### Що робить bootstrap

`openclaw matrix verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів Matrix.
Вона робить усе наведене нижче в такому порядку:

- ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
- ініціалізує cross-signing і завантажує відсутні публічні ключі cross-signing
- намагається позначити й перехресно підписати поточний пристрій
- створює нову серверну резервну копію ключів кімнат, якщо її ще не існує

Якщо homeserver вимагає інтерактивну автентифікацію для завантаження ключів cross-signing, OpenClaw спочатку пробує завантаження без автентифікації, потім із `m.login.dummy`, а потім із `m.login.password`, коли налаштовано `channels.matrix.password`.

Використовуйте `--force-reset-cross-signing` лише тоді, коли свідомо хочете відкинути поточну ідентичність cross-signing і створити нову.

Якщо ви свідомо хочете відкинути поточну резервну копію ключів кімнат і почати нову
базову резервну копію для майбутніх повідомлень, використайте `openclaw matrix verify backup reset --yes`.
Робіть це лише тоді, коли погоджуєтеся, що невідновлювана стара зашифрована історія залишиться
недоступною і що OpenClaw може повторно створити secret storage, якщо поточний секрет
резервного копіювання неможливо безпечно завантажити.

### Нова базова резервна копія

Якщо ви хочете зберегти працездатність майбутніх зашифрованих повідомлень і погоджуєтеся втратити невідновлювану стару історію, виконайте ці команди в такому порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Додайте `--account <id>` до кожної команди, якщо хочете явно націлити їх на іменований обліковий запис Matrix.

### Поведінка під час запуску

Коли `encryption: true`, для Matrix значення `startupVerification` за замовчуванням — `"if-unverified"`.
Під час запуску, якщо цей пристрій усе ще не верифікований, Matrix надішле запит на самоверифікацію в іншому клієнті Matrix,
пропустить дублікати запитів, якщо один уже очікує, і застосує локальну затримку перед повторною спробою після перезапуску.
Невдалі спроби запиту за замовчуванням повторюються швидше, ніж успішне створення запиту.
Установіть `startupVerification: "off"`, щоб вимкнути автоматичні запити під час запуску, або налаштуйте `startupVerificationCooldownHours`,
якщо хочете коротше або довше вікно повтору.

Під час запуску також автоматично виконується консервативний прохід crypto bootstrap.
Цей прохід спочатку намагається повторно використати поточні secret storage і cross-signing identity і уникає скидання cross-signing, якщо ви не запускаєте явний repair flow bootstrap.

Якщо під час запуску виявлено пошкоджений стан bootstrap і налаштовано `channels.matrix.password`, OpenClaw може спробувати суворіший шлях відновлення.
Якщо поточний пристрій уже підписано власником, OpenClaw збереже цю identity замість автоматичного скидання.

Див. [Міграція Matrix](/uk/install/migrating-matrix) щодо повного процесу оновлення, обмежень, команд відновлення та поширених повідомлень міграції.

### Повідомлення верифікації

Matrix публікує повідомлення про життєвий цикл верифікації безпосередньо в суворій кімнаті DM для верифікації як повідомлення `m.notice`.
До них належать:

- повідомлення про запит верифікації
- повідомлення про готовність до верифікації (з явною вказівкою «Verify by emoji»)
- повідомлення про початок і завершення верифікації
- деталі SAS (emoji і десяткові значення), коли вони доступні

Вхідні запити на верифікацію від іншого клієнта Matrix відстежуються і автоматично приймаються OpenClaw.
Для сценаріїв самоверифікації OpenClaw також автоматично запускає SAS flow, коли стає доступною верифікація emoji, і підтверджує свій бік.
Для запитів на верифікацію від іншого користувача/пристрою Matrix OpenClaw автоматично приймає запит, а потім чекає, поки SAS flow відбудеться у звичайному режимі.
Вам усе одно потрібно порівняти emoji або десятковий SAS у своєму клієнті Matrix і підтвердити там «They match», щоб завершити верифікацію.

OpenClaw не приймає сліпо самостійно ініційовані дубльовані flow. Під час запуску пропускається створення нового запиту, якщо запит на самоверифікацію вже очікує.

Повідомлення протоколу/системи верифікації не пересилаються до pipeline чату агента, тому вони не створюють `NO_REPLY`.

### Гігієна пристроїв

Старі керовані OpenClaw пристрої Matrix можуть накопичуватися в обліковому записі й ускладнювати розуміння довіри в зашифрованих кімнатах.
Щоб переглянути їх, виконайте:

```bash
openclaw matrix devices list
```

Щоб видалити застарілі керовані OpenClaw пристрої:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

E2EE у Matrix використовує офіційний Rust crypto path з `matrix-js-sdk` у Node, із `fake-indexeddb` як shim для IndexedDB. Crypto state зберігається у файл snapshot (`crypto-idb-snapshot.json`) і відновлюється під час запуску. Файл snapshot є чутливим станом виконання та зберігається з обмежувальними правами доступу до файлу.

Зашифрований стан виконання зберігається в коренях для кожного облікового запису, кожного користувача та кожного хешу токена в
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Цей каталог містить sync store (`bot-storage.json`), crypto store (`crypto/`),
файл recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
прив’язки тредів (`thread-bindings.json`) і стан startup verification (`startup-verification.json`).
Коли токен змінюється, але ідентичність облікового запису залишається тією самою, OpenClaw повторно використовує найкращий наявний
корінь для цього кортежу account/homeserver/user, щоб попередній sync state, crypto state, прив’язки тредів
і стан startup verification залишалися видимими.

## Керування профілем

Оновити self-profile Matrix для вибраного облікового запису можна так:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис.

Matrix напряму приймає URL аватара `mxc://`. Коли ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його в Matrix, а потім зберігає розв’язаний URL `mxc://` назад у `channels.matrix.avatarUrl` (або у перевизначення вибраного облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилань через message-tool.

- `dm.sessionScope: "per-user"` (типово) зберігає маршрутизацію DM Matrix у межах відправника, тому кілька кімнат DM можуть ділити одну сесію, якщо вони розв’язуються до того самого співрозмовника.
- `dm.sessionScope: "per-room"` ізолює кожну кімнату DM Matrix у власний ключ сесії, при цьому й далі використовуються звичайні перевірки автентифікації DM і allowlist.
- Явні прив’язки розмов Matrix усе одно мають пріоритет над `dm.sessionScope`, тому прив’язані кімнати й треди зберігають вибрану цільову сесію.
- `threadReplies: "off"` зберігає відповіді на верхньому рівні й залишає вхідні потокові повідомлення в батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, коренем якого є повідомлення-тригер, і маршрутизує цю розмову через відповідну сесію в межах треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає параметр верхнього рівня лише для DM. Наприклад, ви можете зберегти ізоляцію тредів у кімнатах, але лишити DM пласкими.
- Вхідні повідомлення в тредах включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковують поточний тред Matrix, коли ціль — та сама кімната або той самий користувацький DM-таргет, якщо не вказано явний `threadId`.
- Повторне використання цільового DM користувача в межах тієї самої сесії спрацьовує лише тоді, коли поточні метадані сесії підтверджують того самого DM-співрозмовника в тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в межах користувача.
- Коли OpenClaw бачить, що кімната DM Matrix конфліктує з іншою кімнатою DM у тій самій спільній сесії DM Matrix, він публікує в цій кімнаті одноразове `m.notice` з запасним варіантом `/focus`, коли прив’язки тредів увімкнено, а також підказкою `dm.sessionScope`.
- Прив’язки тредів під час виконання підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах і DM Matrix.
- `/focus` на верхньому рівні в кімнаті/DM Matrix створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує саме цей поточний тред.

## Прив’язки розмов ACP

Кімнати, DM та наявні треди Matrix можна перетворювати на довготривалі робочі простори ACP без зміни поверхні чату.

Швидкий операторський сценарій:

- Запустіть `/acp spawn codex --bind here` усередині DM Matrix, кімнати або наявного треду, який хочете й надалі використовувати.
- На верхньому рівні в DM або кімнаті Matrix поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної ACP-сесії.
- Усередині наявного треду Matrix `--bind here` прив’язує саме цей поточний тред.
- `/new` і `/reset` скидають ту саму прив’язану ACP-сесію на місці.
- `/acp close` закриває ACP-сесію й видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням з `session.threadBindings` і також підтримує перевизначення для каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення, прив’язаного до тредів Matrix, вмикаються окремо:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати ACP-сесії до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії реакцій, вхідні сповіщення про реакції та вхідні реакції підтвердження.

- Інструментарій вихідних реакцій обмежується `channels["matrix"].actions.reactions`.
- `react` додає реакцію до конкретної події Matrix.
- `reactions` показує поточне зведення реакцій для конкретної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цю подію.
- `remove: true` видаляє лише вказану реакцію emoji від облікового запису бота.

Область реакцій підтвердження визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- запасний варіант emoji ідентичності агента

Область дії реакцій підтвердження визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- значення за замовчуванням: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на створені ботом повідомлення Matrix.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій не синтезуються в системні події, тому що Matrix відображає їх як редагування, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки останніх повідомлень кімнати включати як `InboundHistory`, коли повідомлення Matrix у кімнаті запускає агента. Запасний варіант — `messages.groupChat.historyLimit`; якщо не задано обидва, ефективне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix стосується лише кімнати. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix — лише для pending: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповідь, а потім знімає snapshot цього вікна, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається до `InboundHistory`; воно залишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий snapshot історії замість зсуву вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний елемент керування `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і історія pending.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст за відправниками, дозволеними активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Цей параметр впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення запускати відповідь.
Авторизація тригера, як і раніше, походить із параметрів `groupPolicy`, `groups`, `groupAllowFrom` і DM policy.

## Політика DM і кімнат

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

Див. [Групи](/uk/channels/groups) щодо обмеження згадками та поведінки allowlist.

Приклад pairing для DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending pairing code і може знову надіслати нагадування після короткої затримки замість створення нового коду.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу pairing для DM та структури зберігання.

## Відновлення direct room

Якщо стан direct-message розсинхронізується, OpenClaw може отримати застарілі зіставлення `m.direct`, які вказують на старі індивідуальні кімнати замість актуального DM. Щоб переглянути поточне зіставлення для співрозмовника, виконайте:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Щоб виправити його:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес відновлення:

- надає перевагу суворому DM 1:1, який уже зіставлено в `m.direct`
- якщо такого немає, переходить до будь-якого поточного приєднаного суворого DM 1:1 з цим користувачем
- створює нову direct room і переписує `m.direct`, якщо справного DM не існує

Процес відновлення не видаляє старі кімнати автоматично. Він лише вибирає справний DM і оновлює зіставлення, щоб нові надсилання Matrix, повідомлення верифікації та інші direct-message сценарії знову спрямовувалися в правильну кімнату.

## Підтвердження exec

Matrix може виступати нативним клієнтом підтверджень для облікового запису Matrix. Нативні
параметри маршрутизації DM/каналу, як і раніше, розташовані в конфігурації підтвердження exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; запасний варіант — `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Схвалювачами мають бути Matrix user ID на кшталт `@owner:example.org`. Matrix автоматично вмикає нативні підтвердження, коли `enabled` не задано або має значення `"auto"` і можна розв’язати принаймні одного схвалювача. Підтвердження exec спочатку використовують `execApprovals.approvers` і можуть повертатися до `channels.matrix.dm.allowFrom`. Підтвердження плагінів авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт підтверджень. В іншому разі запити на підтвердження повертаються до інших налаштованих маршрутів підтвердження або політики запасного підтвердження.

Нативна маршрутизація Matrix підтримує обидва типи підтверджень:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout DM/каналу для запитів підтвердження Matrix.
- Підтвердження exec використовують набір схвалювачів exec з `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Підтвердження плагінів використовують allowlist DM Matrix з `channels.matrix.dm.allowFrom`.
- Скорочення через реакції Matrix і оновлення повідомлень застосовуються як до підтверджень exec, так і до підтверджень плагінів.

Правила доставки:

- `target: "dm"` надсилає запити підтвердження в DM схвалювачів
- `target: "channel"` надсилає запит назад до початкової кімнати або DM Matrix
- `target: "both"` надсилає в DM схвалювачів і в початкову кімнату або DM Matrix

Запити підтвердження Matrix додають скорочення через реакції до основного повідомлення підтвердження:

- `✅` = дозволити один раз
- `❌` = відхилити
- `♾️` = дозволити завжди, коли таке рішення дозволяє ефективна політика exec

Схвалювачі можуть реагувати на це повідомлення або скористатися запасними slash-командами: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише розв’язані схвалювачі можуть дозволяти або відхиляти. Для підтверджень exec доставка в канал включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Перевизначення для облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Підтвердження exec](/uk/tools/exec-approvals)

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

Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис не задає перевизначення.
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account`.
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли обліковий запис за замовчуванням налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні значення автентифікації за замовчуванням самі собою не створюють окремий неявний обліковий запис за замовчуванням. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей обліковий запис за замовчуванням має актуальну автентифікацію (`homeserver` плюс `accessToken`, або `homeserver` плюс `userId` і `password`); іменовані облікові записи можуть і далі лишатися видимими з `homeserver` плюс `userId`, якщо кешовані облікові дані пізніше задовольняють вимоги автентифікації.
Якщо в Matrix уже є рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, під час repair/setup-просування з одного облікового запису до кількох зберігається цей обліковий запис замість створення нового запису `accounts.default`. У цей підвищений обліковий запис переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw віддавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, probing і операцій CLI.
Якщо ви налаштовуєте кілька іменованих облікових записів, задайте `defaultAccount` або передавайте `--account <id>` для команд CLI, які покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, коли хочете перевизначити цей неявний вибір для однієї команди.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference#multi-account-all-channels) щодо спільного шаблону для кількох облікових записів.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не ввімкнете це окремо для кожного облікового запису.

Якщо ваш homeserver працює на localhost, LAN/Tailscale IP або внутрішньому імені хоста, увімкніть
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

Цей opt-in дозволяє лише довірені приватні/внутрішні цілі. Публічні незашифровані homeserver, такі як
`http://matrix.example.org:8008`, як і раніше, блокуються. За можливості віддавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S)-проксі, задайте `channels.matrix.proxy`:

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

Іменовані облікові записи можуть перевизначати верхньорівневе значення за замовчуванням через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує те саме значення проксі як для трафіку Matrix під час виконання, так і для probes стану облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей усюди, де OpenClaw просить вас указати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Live lookup каталогу використовує обліковий запис Matrix, у який виконано вхід:

- Пошук користувачів виконує запит до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і псевдоніми, а потім за потреби переходить до пошуку за назвами приєднаних кімнат для цього облікового запису.
- Пошук за назвами приєднаних кімнат виконується за принципом best-effort. Якщо назву кімнати не вдається розв’язати до ID або псевдоніма, вона ігнорується під час виконання розв’язання allowlist.

## Довідник із конфігурації

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, коли homeserver розв’язується до `localhost`, LAN/Tailscale IP або внутрішнього хоста, такого як `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Іменовані облікові записи можуть перевизначати верхньорівневе значення за замовчуванням власним `proxy`.
- `userId`: повний Matrix user ID, наприклад `@bot:example.org`.
- `accessToken`: access token для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` у провайдерах env/file/exec підтримуються як відкриті текстові значення, так і значення SecretRef. Див. [Керування секретами](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються значення у відкритому тексті та значення SecretRef.
- `deviceId`: явний Matrix device ID.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, які отримуються під час початкової синхронізації при запуску.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли має значення `true`, переводить політику кімнат `open` у `allowlist` і примусово переводить усі активні політики DM, крім `disabled` (включно з `pairing` і `open`), у `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів Matrix OpenClaw (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID для трафіку кімнат. Записи мають бути повними Matrix user ID; нерозв’язані імена ігноруються під час виконання.
- `historyLimit`: максимальна кількість повідомлень кімнати, які включаються як контекст історії групи. Запасний варіант — `messages.groupChat.historyLimit`; якщо не задано обидва, ефективне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (типово), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернеток у режимі preview-first зі звичайними текстовими повідомленнями Matrix. `"quiet"` використовує тихі preview-сповіщення для self-hosted налаштувань push-rule. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі повідомлення прогресу для завершених блоків асистента, поки активний потоковий preview чернетки.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення для каналу для маршрутизації й життєвого циклу сесій, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту самоверифікації під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: затримка перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір фрагмента вихідного повідомлення в символах (застосовується, коли `chunkMode` дорівнює `length`).
- `chunkMode`: `length` розбиває повідомлення за кількістю символів; `newline` розбиває за межами рядків.
- `responsePrefix`: необов’язковий рядок, який додається на початок усіх вихідних відповідей для цього каналу.
- `ackReaction`: необов’язкове перевизначення реакції підтвердження для цього каналу/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області дії реакції підтвердження (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: ліміт розміру медіа в МБ для вихідних надсилань і обробки вхідних медіа.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). Типово: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Записи псевдонімів розв’язуються до ID кімнат під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw уже приєднався до кімнати й класифікував її як DM. Це не змінює того, чи буде запрошення автоматично прийняте.
- `dm.allowFrom`: записи мають бути повними Matrix user ID, якщо ви вже не розв’язали їх через live lookup каталогу.
- `dm.sessionScope`: `per-user` (типово) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна кімната DM Matrix зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає параметр верхнього рівня `threadReplies` як для розміщення відповідей, так і для ізоляції сесії в DM.
- `execApprovals`: нативна доставка підтверджень exec через Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix user ID, яким дозволено схвалювати exec-запити. Необов’язково, якщо `dm.allowFrom` уже визначає схвалювачів.
- `execApprovals.target`: `dm | channel | both` (типово: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють для них як значення за замовчуванням.
- `groups`: мапа політик для окремих кімнат. Надавайте перевагу ID кімнат або псевдонімам; нерозв’язані назви кімнат ігноруються під час виконання. Ідентичність сесії/групи використовує стабільний ID кімнати після розв’язання.
- `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для конкретної кімнати.
- `groups.<room>.tools`: перевизначення allow/deny для інструментів у конкретній кімнаті.
- `groups.<room>.autoReply`: перевизначення обмеження згадками на рівні кімнати. `true` вимикає вимогу згадок для цієї кімнати; `false` знову примусово вмикає її.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: застарілий псевдонім для `groups`.
- `actions`: обмеження інструментів за типом дії (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
