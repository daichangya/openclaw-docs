---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та верифікації
summary: Стан підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-05T18:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e43bc2b11f86650b165cd46cd053b0874cc564993999670c0fe422cb9283cb5
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix — це вбудований plugin каналу Matrix для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований plugin

Matrix постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайним
пакетованим збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або кастомне встановлення без Matrix, встановіть
його вручну:

Встановлення з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Plugins](/tools/plugin) щодо поведінки plugin і правил встановлення.

## Налаштування

1. Переконайтеся, що plugin Matrix доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - Старіші/кастомні встановлення можуть додати його вручну за допомогою наведених вище команд.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix` одним із таких способів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть gateway.
5. Почніть DM із ботом або запросіть його до кімнати.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Що саме запитує майстер Matrix:

- URL homeserver
- метод auth: access token або password
- user ID лише якщо ви обираєте auth за password
- необов’язкова назва пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат Matrix зараз

Важлива поведінка майстра:

- Якщо змінні середовища auth Matrix уже існують для вибраного облікового запису, і для цього облікового запису ще не збережено auth у конфігурації, майстер пропонує скористатися env shortcut і записує лише `enabled: true` для цього облікового запису.
- Коли ви інтерактивно додаєте ще один обліковий запис Matrix, введена назва облікового запису нормалізується в ID облікового запису, який використовується в конфігурації та env vars. Наприклад, `Ops Bot` стає `ops-bot`.
- Запити allowlist для DM одразу приймають повні значення `@user:server`. Відображувані імена працюють лише тоді, коли live lookup каталогу знаходить один точний збіг; інакше майстер просить повторити спробу з повним Matrix ID.
- Запити allowlist для кімнат напряму приймають ID кімнат і aliases. Вони також можуть виконувати live lookup назв приєднаних кімнат, але нерозпізнані назви під час налаштування зберігаються лише як введені й пізніше ігноруються під час runtime-розв’язання allowlist. Надавайте перевагу `!room:server` або `#alias:server`.
- Ідентичність кімнати/сесії в runtime використовує стабільний ID кімнати Matrix. Оголошені для кімнати aliases використовуються лише як вхідні дані для lookup, а не як довгостроковий ключ сесії чи стабільна ідентичність групи.
- Щоб розв’язати назви кімнат перед збереженням, використовуйте `openclaw channels resolve --channel matrix "Project Room"`.

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

Налаштування на основі password (токен кешується після входу):

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
Для облікового запису за замовчуванням використовується `credentials.json`; іменовані облікові записи використовують `credentials-<account>.json`.

Еквіваленти змінних середовища (використовуються, якщо ключ конфігурації не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів не за замовчуванням використовуйте env vars з областю облікового запису:

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

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій env vars із різними областями.
Наприклад, `-` перетворюється на `_X2D_`, тому `ops-prod` мапиться на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує env-var shortcut лише тоді, коли ці env vars auth уже присутні, а для вибраного облікового запису ще не збережено auth Matrix у конфігурації.

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

## Попередній перегляд streaming

Streaming відповідей Matrix є opt-in.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав одну чернетку відповіді,
редагував цю чернетку на місці, поки модель генерує текст, а потім фіналізував її, коли відповідь
буде готова:

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
- `streaming: "partial"` створює одне редаговане повідомлення попереднього перегляду для поточного блоку асистента замість надсилання кількох часткових повідомлень.
- `blockStreaming: true` вмикає окремі повідомлення про прогрес у Matrix. Із `streaming: "partial"` Matrix зберігає live-чернетку для поточного блоку та залишає завершені блоки як окремі повідомлення.
- Коли `streaming: "partial"` і `blockStreaming` вимкнено, Matrix лише редагує live-чернетку й надсилає завершену відповідь, коли цей блок або цикл завершено.
- Якщо попередній перегляд більше не вміщується в одну подію Matrix, OpenClaw зупиняє streaming попереднього перегляду та повертається до звичайної фінальної доставки.
- Відповіді з медіа, як і раніше, надсилають вкладення звичайним способом. Якщо застарілий попередній перегляд більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Редагування попереднього перегляду створює додаткові виклики Matrix API. Залишайте streaming вимкненим, якщо хочете максимально консервативну поведінку щодо rate limit.

`blockStreaming` сам по собі не вмикає попередній перегляд чернеток.
Використовуйте `streaming: "partial"` для редагування попереднього перегляду; потім додайте `blockStreaming: true`, лише якщо також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення про прогрес.

## Шифрування та верифікація

У зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, тому попередній перегляд зображення шифрується разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Ніяка конфігурація не потрібна — plugin автоматично визначає стан E2EE.

### Кімнати bot-to-bot

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів Matrix OpenClaw ігноруються.

Використовуйте `allowBots`, якщо вам навмисно потрібен міжагентний трафік Matrix:

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

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів ботів Matrix у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає такі повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM, як і раніше, дозволені.
- `groups.<room>.allowBots` перевизначає налаштування на рівні облікового запису для однієї кімнати.
- OpenClaw, як і раніше, ігнорує повідомлення від того самого Matrix user ID, щоб уникнути циклів самовідповідей.
- Matrix тут не надає нативного прапорця бота; OpenClaw трактує “bot-authored” як “надіслане іншим налаштованим обліковим записом Matrix на цьому gateway OpenClaw”.

Використовуйте суворі allowlist для кімнат і вимоги згадування, коли вмикаєте трафік bot-to-bot у спільних кімнатах.

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

Перевірка статусу верифікації:

```bash
openclaw matrix verify status
```

Докладний статус (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включити збережений recovery key у машиночитаний вивід:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Ініціалізувати cross-signing і стан верифікації:

```bash
openclaw matrix verify bootstrap
```

Підтримка кількох облікових записів: використовуйте `channels.matrix.accounts` з обліковими даними для кожного облікового запису та необов’язковим `name`. Див. [Configuration reference](/gateway/configuration-reference#multi-account-all-channels) щодо спільного шаблону.

Докладна діагностика bootstrap:

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

Докладні відомості про верифікацію пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірити стан резервної копії ключів кімнат:

```bash
openclaw matrix verify backup status
```

Докладна діагностика стану резервної копії:

```bash
openclaw matrix verify backup status --verbose
```

Відновити ключі кімнат із резервної копії на сервері:

```bash
openclaw matrix verify backup restore
```

Докладна діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видалити поточну резервну копію на сервері та створити нову базову резервну копію. Якщо збережений
ключ резервної копії не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
майбутні cold start могли завантажувати новий ключ резервної копії:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` за замовчуванням лаконічні (включно з тихим внутрішнім логуванням SDK) і показують детальну діагностику лише з `--verbose`.
Для повного машиночитаного виводу під час скриптування використовуйте `--json`.

У конфігураціях із кількома обліковими записами команди CLI Matrix використовують неявний обліковий запис Matrix за замовчуванням, якщо ви не передасте `--account <id>`.
Якщо ви налаштували кілька іменованих облікових записів, спочатку встановіть `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупинятимуться та проситимуть явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації чи роботи з пристроями явно націлювалися на іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнене або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

### Що означає "verified"

OpenClaw вважає цей пристрій Matrix verified лише тоді, коли він verified вашою власною ідентичністю cross-signing.
На практиці `openclaw matrix verify status --verbose` показує три сигнали довіри:

- `Locally trusted`: цьому пристрою довіряє лише поточний client
- `Cross-signing verified`: SDK повідомляє, що пристрій verified через cross-signing
- `Signed by owner`: пристрій підписаний вашим власним self-signing key

`Verified by owner` стає `yes` лише тоді, коли є верифікація cross-signing або підпис власника.
Самої лише локальної довіри недостатньо, щоб OpenClaw вважав пристрій повністю verified.

### Що робить bootstrap

`openclaw matrix verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів Matrix.
Вона послідовно виконує все нижченаведене:

- ініціалізує secret storage, за можливості повторно використовуючи наявний recovery key
- ініціалізує cross-signing і завантажує відсутні публічні ключі cross-signing
- намагається позначити та cross-sign поточний пристрій
- створює нову серверну резервну копію ключів кімнат, якщо її ще не існує

Якщо homeserver вимагає інтерактивного auth для завантаження ключів cross-signing, OpenClaw спочатку пробує завантаження без auth, потім із `m.login.dummy`, потім із `m.login.password`, якщо налаштовано `channels.matrix.password`.

Використовуйте `--force-reset-cross-signing` лише тоді, коли навмисно хочете відкинути поточну ідентичність cross-signing і створити нову.

Якщо ви навмисно хочете відкинути поточну резервну копію ключів кімнат і почати нову
базову резервну копію для майбутніх повідомлень, використовуйте `openclaw matrix verify backup reset --yes`.
Робіть це лише тоді, коли приймаєте, що невідновлювана стара зашифрована історія залишиться
недоступною і що OpenClaw може повторно створити secret storage, якщо поточний секрет
резервної копії не вдається безпечно завантажити.

### Нова базова резервна копія

Якщо ви хочете зберегти роботу майбутніх зашифрованих повідомлень і погоджуєтеся втратити невідновлювану стару історію, виконайте ці команди в такому порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Додайте `--account <id>` до кожної команди, якщо хочете явно націлити їх на іменований обліковий запис Matrix.

### Поведінка під час запуску

Коли `encryption: true`, Matrix за замовчуванням встановлює `startupVerification` у `"if-unverified"`.
Під час запуску, якщо цей пристрій усе ще не verified, Matrix запросить self-verification в іншому Matrix client,
пропустить дубльовані запити, якщо один уже очікує, і застосує локальний cooldown перед повторною спробою після перезапусків.
За замовчуванням невдалі спроби запиту повторюються раніше, ніж успішне створення запиту.
Установіть `startupVerification: "off"`, щоб вимкнути автоматичні запити під час запуску, або налаштуйте `startupVerificationCooldownHours`,
якщо хочете коротше або довше вікно повторних спроб.

Під час запуску також автоматично виконується консервативний прохід bootstrap криптографії.
Цей прохід спочатку намагається повторно використати поточне secret storage та ідентичність cross-signing і уникає скидання cross-signing, якщо ви не запускаєте явний потік відновлення bootstrap.

Якщо під час запуску виявлено зламаний стан bootstrap і налаштовано `channels.matrix.password`, OpenClaw може спробувати суворіший шлях відновлення.
Якщо поточний пристрій уже підписаний власником, OpenClaw зберігає цю ідентичність замість автоматичного скидання.

Оновлення з попереднього публічного plugin Matrix:

- OpenClaw автоматично повторно використовує той самий обліковий запис Matrix, access token і ідентичність пристрою, коли це можливо.
- Перш ніж запускати будь-які суттєві зміни міграції Matrix, OpenClaw створює або повторно використовує recovery snapshot у `~/Backups/openclaw-migrations/`.
- Якщо ви використовуєте кілька облікових записів Matrix, установіть `channels.matrix.defaultAccount` перед оновленням зі старого плоского сховища, щоб OpenClaw знав, який обліковий запис має отримати цей спільний застарілий стан.
- Якщо попередній plugin зберігав локально ключ дешифрування резервної копії ключів кімнат Matrix, startup або `openclaw doctor --fix` автоматично імпортує його в новий потік recovery key.
- Якщо access token Matrix змінився після підготовки міграції, startup тепер сканує сусідні корені сховища token-hash на наявність відкладеного застарілого стану відновлення, перш ніж відмовитися від автоматичного відновлення резервної копії.
- Якщо access token Matrix зміниться пізніше для того самого облікового запису, homeserver і користувача, OpenClaw тепер надає перевагу повторному використанню найбільш повного наявного кореня сховища token-hash замість початку з порожнього каталогу стану Matrix.
- Під час наступного запуску gateway резервні ключі кімнат автоматично відновляться в новому криптосховищі.
- Якщо старий plugin мав лише локальні ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw чітко попередить про це. Ці ключі не можна автоматично експортувати з попереднього rust crypto store, тому частина старої зашифрованої історії може залишатися недоступною, доки її не буде відновлено вручну.
- Див. [Matrix migration](/install/migrating-matrix) щодо повного потоку оновлення, обмежень, команд відновлення та поширених повідомлень міграції.

Зашифрований runtime-стан організовано в коренях token-hash для кожного облікового запису та користувача в
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Цей каталог містить sync store (`bot-storage.json`), crypto store (`crypto/`),
файл recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
прив’язки тредів (`thread-bindings.json`) і стан startup verification (`startup-verification.json`),
коли ці можливості використовуються.
Коли токен змінюється, але ідентичність облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний
корінь для цього кортежу account/homeserver/user, щоб попередній sync-стан, crypto-стан, прив’язки тредів
і стан startup verification залишалися видимими.

### Модель Node crypto store

Matrix E2EE у цьому plugin використовує офіційний шлях Rust crypto із `matrix-js-sdk` у Node.
Цей шлях очікує persistence на базі IndexedDB, якщо ви хочете, щоб crypto-стан переживав перезапуски.

Наразі OpenClaw забезпечує це в Node так:

- використовує `fake-indexeddb` як shim API IndexedDB, якого очікує SDK
- відновлює вміст Rust crypto IndexedDB з `crypto-idb-snapshot.json` перед `initRustCrypto`
- зберігає оновлений вміст IndexedDB назад у `crypto-idb-snapshot.json` після init і під час runtime
- серіалізує відновлення та збереження snapshot відносно `crypto-idb-snapshot.json` за допомогою advisory file lock, щоб persistence runtime gateway і обслуговування CLI не змагалися за той самий файл snapshot

Це plumbing сумісності/сховища, а не кастомна реалізація crypto.
Файл snapshot є чутливим runtime-станом і зберігається з обмежувальними правами доступу до файлу.
У межах моделі безпеки OpenClaw хост gateway і локальний каталог стану OpenClaw вже перебувають у межах довіреного оператора, тому це насамперед питання операційної стійкості, а не окрема віддалена межа довіри.

Плановане покращення:

- додати підтримку SecretRef для постійного ключового матеріалу Matrix, щоб recovery keys і пов’язані секрети шифрування сховища можна було отримувати з providers секретів OpenClaw, а не лише з локальних файлів

## Керування профілем

Оновіть власний профіль Matrix для вибраного облікового запису за допомогою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix напряму приймає URL аватарів `mxc://`. Коли ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його в Matrix і зберігає розв’язаний URL `mxc://` назад у `channels.matrix.avatarUrl` (або у перевизначення вибраного облікового запису).

## Автоматичні сповіщення про верифікацію

Matrix тепер публікує сповіщення про життєвий цикл верифікації безпосередньо в сувору DM-кімнату верифікації як повідомлення `m.notice`.
Сюди входять:

- сповіщення про запит верифікації
- сповіщення про готовність до верифікації (з явною підказкою "Verify by emoji")
- сповіщення про початок і завершення верифікації
- відомості SAS (emoji і десяткові значення), коли доступно

Вхідні запити верифікації від іншого Matrix client відстежуються й автоматично приймаються OpenClaw.
Для потоків self-verification OpenClaw також автоматично запускає потік SAS, коли стає доступною верифікація за emoji, і підтверджує свій бік.
Для запитів верифікації від іншого користувача/пристрою Matrix OpenClaw автоматично приймає запит, а потім чекає, поки потік SAS продовжиться у звичайному режимі.
Вам усе одно потрібно порівняти emoji або десятковий SAS у своєму Matrix client і підтвердити там "They match", щоб завершити верифікацію.

OpenClaw не приймає автоматично самостійно ініційовані дубльовані потоки беззастережно. Startup пропускає створення нового запиту, якщо запит self-verification уже очікує.

Сповіщення протоколу/системи верифікації не перенаправляються до каналу чату агента, тому вони не породжують `NO_REPLY`.

### Гігієна пристроїв

Старі пристрої Matrix під керуванням OpenClaw можуть накопичуватися в обліковому записі й ускладнювати розуміння довіри в зашифрованих кімнатах.
Перелічіть їх за допомогою:

```bash
openclaw matrix devices list
```

Видаліть застарілі пристрої Matrix під керуванням OpenClaw за допомогою:

```bash
openclaw matrix devices prune-stale
```

### Відновлення Direct Room

Якщо стан direct-message виходить із синхронізації, OpenClaw може залишитися із застарілими мапінгами `m.direct`, які вказують на старі соло-кімнати замість актуального DM. Перевірити поточний мапінг для співрозмовника можна так:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправлення:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Відновлення зберігає Matrix-специфічну логіку всередині plugin:

- воно віддає перевагу суворому DM 1:1, який уже замаплений у `m.direct`
- інакше переходить до будь-якого поточного приєднаного суворого DM 1:1 із цим користувачем
- якщо здорового DM не існує, воно створює нову direct room і переписує `m.direct`, щоб вона вказувала на неї

Потік відновлення не видаляє старі кімнати автоматично. Він лише вибирає здоровий DM і оновлює мапінг, щоб нові надсилання Matrix, сповіщення про верифікацію та інші потоки direct-message знову були спрямовані в правильну кімнату.

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилань через інструмент message.

- `threadReplies: "off"` зберігає відповіді на верхньому рівні та залишає вхідні повідомлення в тредах у батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, прив’язаному до повідомлення-тригера, і маршрутизує цю розмову через відповідну сесію з областю треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає налаштування верхнього рівня лише для DM. Наприклад, ви можете ізолювати треди в кімнатах, залишаючи DM плоскими.
- Вхідні повідомлення в тредах включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через інструмент message тепер автоматично успадковують поточний тред Matrix, коли ціль — та сама кімната або той самий DM-одержувач, якщо явно не задано `threadId`.
- Runtime-прив’язки тредів підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` тепер працюють у кімнатах і DM Matrix.
- Верхньорівневий `/focus` у кімнаті/DM Matrix створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Виконання `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує цей поточний тред.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні треди Matrix можна перетворювати на довготривалі робочі простори ACP без зміни поверхні чату.

Швидкий потік для оператора:

- Виконайте `/acp spawn codex --bind here` у DM, кімнаті або наявному треді Matrix, якими хочете продовжувати користуватися.
- У верхньорівневому DM або кімнаті Matrix поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної сесії ACP.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язок тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення з прив’язкою до треду в Matrix є opt-in:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити верхньорівневому `/focus` створювати та прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати сесії ACP до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії реакцій, вхідні сповіщення про реакції та вхідні ack-реакції.

- Вихідний інструментарій реакцій контролюється `channels["matrix"].actions.reactions`.
- `react` додає реакцію до певної події Matrix.
- `reactions` перелічує поточний зведений список реакцій для певної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цій події.
- `remove: true` видаляє лише вказану emoji-реакцію з облікового запису бота.

Область ack-реакцій розв’язується у стандартному порядку OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- запасний emoji ідентичності агента

Область дії ack-реакцій розв’язується в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції розв’язується в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- значення за замовчуванням: `own`

Поточна поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій усе ще не синтезується в системні події, бо Matrix представляє їх як редагування, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` керує тим, скільки останніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення кімнати Matrix запускає агента.
- Значення повертається до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix стосується лише кімнати. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix є лише для pending: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповіді, а потім робить snapshot цього вікна, коли надходить згадка чи інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно залишається в основному вхідному body для цього циклу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий snapshot історії замість дрейфу вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний елемент керування `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і pending-історія.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну процитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригера, як і раніше, визначається налаштуваннями `groupPolicy`, `groups`, `groupAllowFrom` і політики DM.

## Приклад політики DM і кімнат

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

Див. [Groups](/channels/groups) щодо керування згадуваннями та поведінки allowlist.

Приклад pairing для DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending код pairing і після короткого cooldown може знову надіслати відповідь-нагадування замість створення нового коду.

Див. [Pairing](/channels/pairing) щодо спільного потоку pairing для DM і схеми зберігання.

## Погодження exec

Matrix може виступати як client погоджень exec для облікового запису Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; повертається до `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Особи, що погоджують, мають бути Matrix user ID, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні погодження exec, коли `enabled` не задано або дорівнює `"auto"` і можна розв’язати принаймні одного погоджувача — або з `execApprovals.approvers`, або з `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний client погодження. Інакше запити на погодження повертаються до інших налаштованих маршрутів погодження або до fallback-політики погодження exec.

Нативна маршрутизація Matrix сьогодні застосовується лише до exec:

- `channels.matrix.execApprovals.*` керує нативною маршрутизацією DM/каналу лише для погоджень exec.
- Погодження plugin і далі використовують спільну команду same-chat `/approve` плюс будь-яке налаштоване перенаправлення `approvals.plugin`.
- Matrix, як і раніше, може повторно використовувати `channels.matrix.dm.allowFrom` для авторизації погоджень plugin, коли може безпечно визначити погоджувачів, але не надає окремого нативного шляху fanout DM/каналу для погоджень plugin.

Правила доставки:

- `target: "dm"` надсилає запити на погодження в DM погоджувачів
- `target: "channel"` надсилає запит назад у вихідну кімнату або DM Matrix
- `target: "both"` надсилає і в DM погоджувачів, і у вихідну кімнату або DM Matrix

Запити на погодження Matrix додають швидкі реакції до основного повідомлення погодження:

- `✅` = дозволити один раз
- `❌` = відхилити
- `♾️` = дозволити завжди, якщо таке рішення дозволене ефективною політикою exec

Погоджувачі можуть реагувати на це повідомлення або використовувати запасні slash commands: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише розв’язані погоджувачі можуть дозволяти або відхиляти. Доставка в канал включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Запити на погодження Matrix повторно використовують спільний core-планувальник погоджень. Matrix-специфічна нативна поверхня є лише транспортом для погоджень exec: маршрутизація кімнат/DM і поведінка надсилання/оновлення/видалення повідомлень.

Перевизначення для облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Exec approvals](/tools/exec-approvals)

## Приклад із кількома обліковими записами

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
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account` (або застаріле `rooms.<room>.account`).
Записи без `account` лишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли обліковий запис за замовчуванням налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні значення auth за замовчуванням самі по собі не створюють окремий неявний обліковий запис за замовчуванням. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей обліковий запис за замовчуванням має свіжий auth (`homeserver` плюс `accessToken` або `homeserver` плюс `userId` і `password`); іменовані облікові записи, як і раніше, можуть залишатися доступними з `homeserver` плюс `userId`, якщо кешовані облікові дані задовольнять auth пізніше.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, відновлення/підвищення зі схеми одного облікового запису до кількох зберігає цей обліковий запис замість створення нового запису `accounts.default`. До такого підвищеного облікового запису переносяться лише ключі auth/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw надавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, probing і операцій CLI.
Якщо ви налаштували кілька іменованих облікових записів, установіть `defaultAccount` або передавайте `--account <id>` у командах CLI, які покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, якщо хочете перевизначити цей неявний вибір для однієї команди.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не дозволите це для кожного облікового запису.

Якщо ваш homeserver працює на localhost, LAN/Tailscale IP або внутрішньому hostname, увімкніть
`allowPrivateNetwork` для цього облікового запису Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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

Цей opt-in дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, такі як
`http://matrix.example.org:8008`, і далі блокуються. За можливості надавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S) proxy, задайте `channels.matrix.proxy`:

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
OpenClaw використовує те саме налаштування proxy як для runtime-трафіку Matrix, так і для probes стану облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей усюди, де OpenClaw просить вказати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Live directory lookup використовує обліковий запис Matrix, у який виконано вхід:

- Lookup користувачів звертається до каталогу користувачів Matrix на цьому homeserver.
- Lookup кімнат напряму приймає явні ID і aliases кімнат, а потім повертається до пошуку назв приєднаних кімнат для цього облікового запису.
- Lookup назв приєднаних кімнат працює в режимі best-effort. Якщо назву кімнати не вдається розв’язати в ID або alias, її ігнорують під час runtime-розв’язання allowlist.

## Посилання на конфігурацію

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `allowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, коли homeserver розв’язується в `localhost`, LAN/Tailscale IP або внутрішній хост, такий як `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S) proxy для трафіку Matrix. Іменовані облікові записи можуть перевизначати значення верхнього рівня власним `proxy`.
- `userId`: повний Matrix user ID, наприклад `@bot:example.org`.
- `accessToken`: access token для auth на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються як відкриті значення, так і значення SecretRef через providers env/file/exec. Див. [Secrets Management](/gateway/secrets).
- `password`: password для входу на основі password. Підтримуються як відкриті значення, так і значення SecretRef.
- `deviceId`: явний Matrix device ID.
- `deviceName`: відображувана назва пристрою для входу за password.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `set-profile`.
- `initialSyncLimit`: ліміт подій синхронізації під час запуску.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: примусово використовувати лише allowlist-поведінку для DM і кімнат.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів Matrix OpenClaw (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID для трафіку кімнат.
- Елементи `groupAllowFrom` мають бути повними Matrix user ID. Нерозв’язані імена ігноруються під час runtime.
- `historyLimit`: максимальна кількість повідомлень кімнати для включення як контекст історії групи. Значення повертається до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first` або `all`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (за замовчуванням), `partial`, `true` або `false`. `partial` і `true` вмикають попередній перегляд чернетки в одному повідомленні з оновленням через редагування на місці.
- `blockStreaming`: `true` вмикає окремі повідомлення про прогрес для завершених блоків асистента, поки активний streaming попереднього перегляду чернетки.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення для каналу щодо маршрутизації сесій, прив’язаних до тредів, і їх життєвого циклу.
- `startupVerification`: режим автоматичного запиту self-verification під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір чанка вихідного повідомлення.
- `chunkMode`: `length` або `newline`.
- `responsePrefix`: необов’язковий префікс повідомлення для вихідних відповідей.
- `ackReaction`: необов’язкове перевизначення ack-реакції для цього каналу/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області ack-реакції (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: ліміт розміру медіа в МБ для обробки медіа Matrix. Застосовується до вихідних надсилань і вхідної обробки медіа.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). За замовчуванням: `off`.
- `autoJoinAllowlist`: кімнати/aliases, дозволені, коли `autoJoin` має значення `allowlist`. Записи alias розв’язуються в ID кімнат під час обробки запрошення; OpenClaw не довіряє стану alias, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Елементи `dm.allowFrom` мають бути повними Matrix user ID, якщо тільки ви вже не розв’язали їх через live directory lookup.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає верхньорівневе налаштування `threadReplies` як для розміщення відповідей, так і для ізоляції сесій у DM.
- `execApprovals`: нативна доставка погоджень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix user ID, яким дозволено погоджувати exec-запити. Необов’язкове поле, якщо `dm.allowFrom` уже визначає погоджувачів.
- `execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`).
- `accounts`: іменовані перевизначення для кожного облікового запису. Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для цих записів.
- `groups`: мапа політик для кожної кімнати. Надавайте перевагу ID кімнат або aliases; нерозв’язані назви кімнат ігноруються під час runtime. Ідентичність сесії/групи після розв’язання використовує стабільний ID кімнати, тоді як зрозумілі людині мітки й далі походять із назв кімнат.
- `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників із налаштованих ботів (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для конкретної кімнати.
- `groups.<room>.tools`: перевизначення allow/deny інструментів для конкретної кімнати.
- `groups.<room>.autoReply`: перевизначення керування згадуваннями на рівні кімнати. `true` вимикає вимогу згадування для цієї кімнати; `false` примусово знову вмикає її.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: застарілий alias для `groups`.
- `actions`: керування інструментами для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — auth DM і потік pairing
- [Groups](/channels/groups) — поведінка групового чату та керування згадуваннями
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та зміцнення захисту
