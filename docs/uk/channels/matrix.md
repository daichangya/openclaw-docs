---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування E2EE та верифікації Matrix
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-23T15:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix — це вбудований channel Plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований Plugin

Matrix постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або нестандартне встановлення без Matrix, встановіть
його вручну:

Встановлення з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Plugins](/uk/tools/plugin) щодо поведінки Plugin і правил встановлення.

## Налаштування

1. Переконайтеся, що Plugin Matrix доступний.
   - У поточних пакетних релізах OpenClaw він уже вбудований.
   - У старіших/нестандартних встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix`, використовуючи один із варіантів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть Gateway.
5. Почніть DM із ботом або запросіть його до кімнати.
   - Нові запрошення Matrix працюють лише тоді, коли це дозволяє `channels.matrix.autoJoin`.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер Matrix запитує:

- URL homeserver
- метод автентифікації: access token або пароль
- ID користувача (лише для автентифікації паролем)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат і автоматичне приєднання за запрошенням

Ключові особливості роботи майстра:

- Якщо змінні середовища для автентифікації Matrix вже існують і для цього облікового запису автентифікацію ще не збережено в конфігурації, майстер запропонує скорочений варіант із використанням env vars, щоб зберегти автентифікацію в змінних середовища.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для DM приймають `@user:server` напряму; відображувані імена працюють лише тоді, коли live lookup каталогу знаходить один точний збіг.
- Записи allowlist для кімнат приймають ID кімнат і псевдоніми напряму. Надавайте перевагу `!room:server` або `#alias:server`; імена, які не вдалося розв’язати, ігноруються під час виконання механізмом розв’язання allowlist.
- У режимі allowlist для автоматичного приєднання за запрошенням використовуйте лише стабільні цілі запрошень: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються.
- Щоб розв’язати назви кімнат перед збереженням, використовуйте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
Значенням за замовчуванням для `channels.matrix.autoJoin` є `off`.

Якщо залишити його не заданим, бот не приєднуватиметься до запрошених кімнат або нових запрошень у стилі DM, тому він не з’являтиметься в нових групах або запрошених DM, якщо ви спочатку не приєднаєте його вручну.

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

Налаштування на основі пароля (після входу токен кешується):

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
Якщо там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для setup, doctor і виявлення статусу channel, навіть якщо поточну автентифікацію не задано безпосередньо в конфігурації.

Відповідники у змінних середовища (використовуються, коли ключ конфігурації не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів, відмінних від стандартного, використовуйте змінні середовища з областю облікового запису:

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

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій у змінних середовища з областю.
Наприклад, `-` стає `_X2D_`, тому `ops-prod` мапиться на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скорочений варіант із env vars лише тоді, коли ці env vars автентифікації вже присутні й для вибраного облікового запису автентифікацію Matrix ще не збережено в конфігурації.

`MATRIX_HOMESERVER` не можна задавати з workspace `.env`; див. [Workspace `.env` files](/uk/gateway/security).

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
`dm.policy` застосовується після того, як бот приєднався і кімнату класифіковано як DM.

## Потокові прев’ю

Потокова передача відповідей Matrix вмикається за бажанням.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав одну live preview
відповідь, редагував це прев’ю на місці, поки модель генерує текст, а потім фіналізував його після
завершення відповіді:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` — значення за замовчуванням. OpenClaw чекає фінальну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане preview message для поточного блоку відповіді асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає традиційну поведінку Matrix із сповіщеннями спочатку про прев’ю, тому стандартні клієнти можуть сповіщати про перший текст потокового прев’ю, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане тихе preview notice для поточного блоку відповіді асистента. Використовуйте це лише тоді, коли ви також налаштовуєте правила push для отримувачів для фіналізованих редагувань прев’ю.
- `blockStreaming: true` вмикає окремі повідомлення про прогрес Matrix. Коли потокове передавання прев’ю ввімкнено, Matrix зберігає live draft для поточного блоку та лишає завершені блоки як окремі повідомлення.
- Коли потокове передавання прев’ю ввімкнено, а `blockStreaming` вимкнено, Matrix редагує live draft на місці й фіналізує ту саму подію, коли завершується блок або хід.
- Якщо прев’ю більше не вміщується в одну подію Matrix, OpenClaw припиняє потокове передавання прев’ю і повертається до звичайної фінальної доставки.
- Відповіді з медіа, як і раніше, надсилають вкладення у звичайному режимі. Якщо застаріле прев’ю більше не можна безпечно використати повторно, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Редагування прев’ю потребують додаткових викликів Matrix API. Залиште streaming вимкненим, якщо хочете найконсервативнішу поведінку щодо обмеження частоти.

`blockStreaming` сам по собі не вмикає чернеткові прев’ю.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагування прев’ю; потім додавайте `blockStreaming: true` лише якщо також хочете, щоб завершені блоки асистента лишалися видимими як окремі повідомлення про прогрес.

Якщо вам потрібні стандартні сповіщення Matrix без власних правил push, використовуйте `streaming: "partial"` для поведінки зі сповіщенням спочатку про прев’ю або залиште `streaming` вимкненим для доставки лише фінальної відповіді. За `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Власні push rules для тихих фіналізованих прев’ю

Тихий streaming (`streaming: "quiet"`) сповіщає отримувачів лише тоді, коли блок або хід фіналізовано — правило push для користувача має збігтися з маркером фіналізованого прев’ю. Див. [Matrix push rules for quiet previews](/uk/channels/matrix-push-rules) для повного налаштування (токен отримувача, перевірка pusher, встановлення rules, примітки для різних homeserver).

## Кімнати bot-to-bot

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

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів ботів Matrix у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає такі повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM як і раніше дозволені.
- `groups.<room>.allowBots` перевизначає параметр рівня облікового запису для однієї кімнати.
- OpenClaw все одно ігнорує повідомлення від того самого ID користувача Matrix, щоб уникнути циклів самовідповіді.
- Тут Matrix не надає вбудованого прапорця бота; OpenClaw трактує «створене ботом» як «надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw».

Використовуйте суворі allowlist для кімнат і вимоги до згадок, коли вмикаєте трафік bot-to-bot у спільних кімнатах.

## Шифрування та верифікація

У зашифрованих кімнатах (E2EE) вихідні події зображень використовують `thumbnail_file`, тож прев’ю зображень шифруються разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Нічого налаштовувати не потрібно — Plugin автоматично визначає стан E2EE.

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

Команди верифікації (усі приймають `--verbose` для діагностики та `--json` для машинозчитуваного виводу):

| Команда                                                        | Призначення                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Перевірити стан cross-signing і верифікації пристрою                                |
| `openclaw matrix verify status --include-recovery-key --json`  | Включити збережений recovery key                                                    |
| `openclaw matrix verify bootstrap`                             | Ініціалізувати cross-signing і верифікацію (див. нижче)                             |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Відкинути поточну identity cross-signing і створити нову                            |
| `openclaw matrix verify device "<recovery-key>"`               | Верифікувати цей пристрій за допомогою recovery key                                 |
| `openclaw matrix verify backup status`                         | Перевірити стан резервної копії room key                                            |
| `openclaw matrix verify backup restore`                        | Відновити room keys із резервної копії на сервері                                   |
| `openclaw matrix verify backup reset --yes`                    | Видалити поточну резервну копію і створити нову базову точку (може повторно створити secret storage) |

У конфігураціях із кількома обліковими записами команди Matrix CLI використовують неявний стандартний обліковий запис Matrix, якщо ви не передасте `--account <id>`.
Якщо ви налаштували кілька іменованих облікових записів, спочатку задайте `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупиняться й попросять вас явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації або роботи з пристроями явно були спрямовані на іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнене або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Що означає verified">
    OpenClaw вважає пристрій verified лише тоді, коли його підписує ваша власна identity cross-signing. `verify status --verbose` показує три сигнали довіри:

    - `Locally trusted`: довіряється лише цим клієнтом
    - `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
    - `Signed by owner`: підписано вашим власним self-signing key

    `Verified by owner` стає `yes` лише за наявності cross-signing або підпису власника. Самої лише локальної довіри недостатньо.

  </Accordion>

  <Accordion title="Що робить bootstrap">
    `verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів. По черзі вона:

    - ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
    - ініціалізує cross-signing і завантажує відсутні публічні ключі cross-signing
    - позначає й підписує через cross-signing поточний пристрій
    - створює серверну резервну копію room key, якщо її ще не існує

    Якщо homeserver вимагає UIA для завантаження ключів cross-signing, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, потім `m.login.password` (потребує `channels.matrix.password`). Використовуйте `--force-reset-cross-signing` лише якщо свідомо відкидаєте поточну identity.

  </Accordion>

  <Accordion title="Нова базова точка резервної копії">
    Якщо ви хочете зберегти працездатність майбутніх зашифрованих повідомлень і погоджуєтеся втратити стару історію, яку неможливо відновити:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Додайте `--account <id>`, щоб націлити команду на іменований обліковий запис. Це також може повторно створити secret storage, якщо поточний секрет резервної копії не вдається безпечно завантажити.

  </Accordion>

  <Accordion title="Поведінка під час запуску">
    За `encryption: true` значенням за замовчуванням для `startupVerification` є `"if-unverified"`. Під час запуску неверифікований пристрій запитує самоверифікацію в іншому клієнті Matrix, пропускаючи дублікати та застосовуючи cooldown. Налаштуйте це через `startupVerificationCooldownHours` або вимкніть за допомогою `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід crypto bootstrap, який повторно використовує поточні secret storage та identity cross-signing. Якщо стан bootstrap пошкоджено, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає password UIA, під час запуску журналюється попередження, але помилка не стає фатальною. Пристрої, уже підписані власником, зберігаються.

    Див. [Міграція Matrix](/uk/install/migrating-matrix) для повного процесу оновлення.

  </Accordion>

  <Accordion title="Сповіщення про верифікацію">
    Matrix публікує повідомлення про життєвий цикл верифікації в сувору DM-кімнату для верифікації як повідомлення `m.notice`: запит, готовність (із підказкою «Verify by emoji»), початок/завершення та деталі SAS (emoji/десяткові), якщо вони доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються й автоматично приймаються. Для самоверифікації OpenClaw автоматично запускає потік SAS і підтверджує свій бік, щойно стає доступною верифікація через emoji — вам усе одно потрібно порівняти й підтвердити «They match» у своєму клієнті Matrix.

    Системні повідомлення про верифікацію не пересилаються до конвеєра чату агента.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої під керуванням OpenClaw можуть накопичуватися. Перелічіть і приберіть застарілі:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний шлях Rust crypto з `matrix-js-sdk` із `fake-indexeddb` як shim для IndexedDB. Стан crypto зберігається в `crypto-idb-snapshot.json` (з обмежувальними правами доступу до файла).

    Зашифрований стан виконання зберігається в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і містить sync store, crypto store, recovery key, знімок IDB, прив’язки тредів і стан startup verification. Коли токен змінюється, але identity облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний кореневий каталог, тож попередній стан лишається видимим.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть self-profile Matrix для вибраного облікового запису за допомогою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix напряму приймає URL аватарів `mxc://`. Коли ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його в Matrix, а потім зберігає розв’язаний URL `mxc://` назад у `channels.matrix.avatarUrl` (або у вибране перевизначення облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилання message-tool.

- `dm.sessionScope: "per-user"` (за замовчуванням) зберігає маршрутизацію DM Matrix в області відправника, тому кілька DM-кімнат можуть ділити одну сесію, якщо вони розв’язуються до того самого співрозмовника.
- `dm.sessionScope: "per-room"` ізолює кожну DM-кімнату Matrix у власний ключ сесії, як і раніше використовуючи звичайні перевірки автентифікації та allowlist для DM.
- Явні прив’язки розмов Matrix усе одно мають пріоритет над `dm.sessionScope`, тому прив’язані кімнати й треди зберігають вибрану цільову сесію.
- `threadReplies: "off"` залишає відповіді на верхньому рівні та зберігає вхідні повідомлення в треді в батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, вкоріненому у повідомленні-тригері, і спрямовує цю розмову через відповідну сесію з областю треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає параметр верхнього рівня лише для DM. Наприклад, ви можете ізолювати треди в кімнатах, залишаючи DM пласкими.
- Вхідні повідомлення в треді включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковує поточний тред Matrix, коли ціллю є та сама кімната або та сама DM-ціль користувача, якщо явно не задано `threadId`.
- Повторне використання тієї самої DM-цілі користувача в межах однієї сесії спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого співрозмовника DM у тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в області користувача.
- Коли OpenClaw бачить, що DM-кімната Matrix конфліктує з іншою DM-кімнатою в межах тієї самої спільної DM-сесії Matrix, він одноразово публікує `m.notice` у цій кімнаті з аварійним варіантом `/focus`, якщо прив’язки тредів увімкнено, і з підказкою `dm.sessionScope`.
- Прив’язки тредів під час виконання підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах і DM Matrix.
- `/focus` на верхньому рівні в кімнаті/DM Matrix створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Запуск `/focus` або `/acp spawn --thread here` усередині наявного треду Matrix натомість прив’язує цей поточний тред.

## Прив’язки розмов ACP

Кімнати, DM і наявні треди Matrix можна перетворити на довготривалі робочі простори ACP без зміни поверхні чату.

Швидкий операторський сценарій:

- Запустіть `/acp spawn codex --bind here` усередині DM, кімнати або наявного треду Matrix, яким хочете й надалі користуватися.
- На верхньому рівні в DM або кімнаті Matrix поточний DM/кімната лишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної сесії ACP.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для окремого channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення для прив’язаних до тредів сесій Matrix є opt-in:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` на верхньому рівні створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати сесії ACP до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії реакцій, вхідні сповіщення про реакції та вхідні реакції-підтвердження.

- Інструментарій вихідних реакцій контролюється через `channels["matrix"].actions.reactions`.
- `react` додає реакцію до конкретної події Matrix.
- `reactions` показує поточне зведення реакцій для конкретної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цю подію.
- `remove: true` видаляє лише вказану реакцію emoji з облікового запису бота.

Область застосування реакцій-підтверджень визначається у стандартному порядку OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- резервний emoji з identity агента

Область дії реакції-підтвердження визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- значення за замовчуванням: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони спрямовані на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій не синтезується в системні події, оскільки Matrix показує їх як редагування, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки останніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення в кімнаті Matrix запускає агента. Використовує резервне значення з `messages.groupChat.historyLimit`; якщо обидва не задані, ефективне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнат Matrix обмежується лише кімнатою. DM і далі використовують звичайну історію сесії.
- Історія кімнат Matrix працює лише для очікуваних повідомлень: OpenClaw буферизує повідомлення кімнати, які ще не спричинили відповідь, а потім фіксує це вікно, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно лишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий знімок історії замість того, щоб зсуватися вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний механізм керування `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і очікувана історія.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається в отриманому вигляді.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist для кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Цей параметр впливає на видимість додаткового контексту, а не на те, чи саме вхідне повідомлення може запустити відповідь.
Авторизація тригера, як і раніше, визначається через `groupPolicy`, `groups`, `groupAllowFrom` і параметри політики DM.

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

Див. [Groups](/uk/channels/groups) щодо поведінки обмеження за згадками та allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий очікуваний код pairing і може знову надіслати нагадування після короткого cooldown, замість того щоб створювати новий код.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу pairing для DM і структури зберігання.

## Відновлення direct room

Якщо стан direct message розсинхронізується, OpenClaw може отримати застарілі зіставлення `m.direct`, які вказують на старі одиночні кімнати замість актуального DM. Перегляньте поточне зіставлення для співрозмовника за допомогою:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Відновіть його командою:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес відновлення:

- надає перевагу суворому 1:1 DM, який уже зіставлено в `m.direct`
- у разі потреби переходить до будь-якого поточного приєднаного суворого 1:1 DM із цим користувачем
- створює нову direct room і переписує `m.direct`, якщо справного DM не існує

Процес відновлення не видаляє старі кімнати автоматично. Він лише вибирає справний DM і оновлює зіставлення, щоб нові надсилання Matrix, сповіщення про верифікацію та інші потоки direct message знову спрямовувалися до правильної кімнати.

## Схвалення exec

Matrix може виступати нативним клієнтом схвалення для облікового запису Matrix. Нативні
перемикачі маршрутизації DM/channel, як і раніше, розміщуються в конфігурації схвалення exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; використовує резервне значення з `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Схвалювачі мають бути ID користувачів Matrix, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні схвалення, коли `enabled` не задано або дорівнює `"auto"`, і можна розв’язати принаймні одного схвалювача. Схвалення exec спочатку використовують `execApprovals.approvers` і можуть використовувати резервне значення з `channels.matrix.dm.allowFrom`. Схвалення Plugin авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт схвалення. Інакше запити на схвалення використовують резервні інші налаштовані маршрути схвалення або політику резервного оброблення схвалень.

Нативна маршрутизація Matrix підтримує обидва типи схвалень:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout для DM/channel у Matrix для запитів на схвалення.
- Схвалення exec використовують набір схвалювачів exec із `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Схвалення Plugin використовують allowlist DM Matrix з `channels.matrix.dm.allowFrom`.
- Скорочення через реакції Matrix і оновлення повідомлень застосовуються як до схвалень exec, так і до схвалень Plugin.

Правила доставки:

- `target: "dm"` надсилає запити на схвалення в DM схвалювачів
- `target: "channel"` надсилає запит назад до вихідної кімнати або DM Matrix
- `target: "both"` надсилає і в DM схвалювачів, і до вихідної кімнати або DM Matrix

Запити на схвалення в Matrix додають скорочення-реакції до основного повідомлення схвалення:

- `✅` = дозволити один раз
- `❌` = заборонити
- `♾️` = дозволити завжди, якщо таке рішення дозволене ефективною політикою exec

Схвалювачі можуть реагувати на це повідомлення або використовувати резервні slash commands: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише розв’язані схвалювачі можуть дозволяти або забороняти. Для схвалень exec доставка через channel включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Перевизначення для окремого облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

## Slash commands

Slash commands Matrix (наприклад `/new`, `/reset`, `/model`) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає slash commands, перед якими стоїть власна згадка Matrix бота, тож `@bot:server /new` запускає шлях команд без потреби в спеціальному regex для згадок. Це дає змогу боту реагувати на публікації у стилі кімнати `@mention /command`, які Element та подібні клієнти створюють, коли користувач автодоповнює бота перед введенням команди.

Правила авторизації, як і раніше, діють: відправники команд мають відповідати політикам allowlist/owner для DM або кімнат так само, як і для звичайних повідомлень.

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

Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис їх не перевизначає.
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account`.
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли стандартний обліковий запис налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні значення автентифікації за замовчуванням самі по собі не створюють окремий неявний стандартний обліковий запис. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей стандартний обліковий запис має актуальну автентифікацію (`homeserver` плюс `accessToken`, або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть лишатися доступними для виявлення через `homeserver` плюс `userId`, якщо кешовані облікові дані задовольнять автентифікацію пізніше.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, відновлення/налаштування під час переходу з одного облікового запису на кілька зберігає цей обліковий запис замість створення нового запису `accounts.default`. До цього підвищеного облікового запису переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки лишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw надавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, probe і операцій CLI.
Якщо налаштовано кілька облікових записів Matrix і один із їхніх ID дорівнює `default`, OpenClaw неявно використовує цей обліковий запис, навіть якщо `defaultAccount` не задано.
Якщо ви налаштували кілька іменованих облікових записів, установіть `defaultAccount` або передавайте `--account <id>` для команд CLI, що покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, коли хочете перевизначити цей неявний вибір для однієї команди.

Див. [Configuration reference](/uk/gateway/configuration-reference#multi-account-all-channels) щодо спільного шаблону для кількох облікових записів.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не ввімкнете це окремо для кожного облікового запису.

Якщо ваш homeserver працює на localhost, IP-адресі LAN/Tailscale або внутрішньому hostname, увімкніть
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

Це явне ввімкнення дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, такі як
`http://matrix.example.org:8008`, як і раніше, блокуються. За можливості надавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо для вашого розгортання Matrix потрібен явний вихідний HTTP(S)-проксі, задайте `channels.matrix.proxy`:

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
OpenClaw використовує той самий параметр проксі як для робочого трафіку Matrix, так і для probe стану облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей скрізь, де OpenClaw просить вас указати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Live lookup каталогу використовує обліковий запис Matrix, під яким виконано вхід:

- Пошук користувачів виконує запити до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і псевдоніми, а потім у разі потреби переходить до пошуку назв серед приєднаних кімнат цього облікового запису.
- Пошук назв серед приєднаних кімнат є best-effort. Якщо назву кімнати не вдається розв’язати до ID або псевдоніма, вона ігнорується під час розв’язання allowlist у runtime.

## Довідник конфігурації

- `enabled`: увімкнути або вимкнути channel.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: пріоритетний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволяє цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, коли homeserver розв’язується в `localhost`, IP-адресу LAN/Tailscale або внутрішній хост на кшталт `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Іменовані облікові записи можуть перевизначати значення верхнього рівня власним `proxy`.
- `userId`: повний ID користувача Matrix, наприклад `@bot:example.org`.
- `accessToken`: access token для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються як прості текстові значення, так і значення SecretRef у провайдерах env/file/exec. Див. [Secrets Management](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються як прості текстові значення, так і значення SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL self-avatar для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, що отримуються під час стартової синхронізації.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли має значення `true`, підвищує політику кімнат `open` до `allowlist` і примусово переводить усі активні політики DM, крім `disabled` (включно з `pairing` і `open`), у `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів Matrix OpenClaw (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID користувачів для трафіку кімнат. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги в каталозі розв’язуються під час запуску та коли allowlist змінюється під час роботи монітора. Імена, які не вдалося розв’язати, ігноруються.
- `historyLimit`: максимальна кількість повідомлень кімнати, які включаються як контекст історії групи. Використовує резервне значення з `messages.groupChat.historyLimit`; якщо обидва не задані, ефективне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (за замовчуванням), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернеток у режимі preview-first зі звичайними текстовими повідомленнями Matrix. `"quiet"` використовує прев’ю-нотатки без сповіщень для власних конфігурацій push rules. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі повідомлення про прогрес для завершених блоків асистента, поки активне потокове передавання чернеткового прев’ю.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення для окремого channel для маршрутизації та життєвого циклу сесій, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту самоверифікації під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів на верифікацію під час запуску.
- `textChunkLimit`: розмір фрагмента вихідного повідомлення в символах (застосовується, коли `chunkMode` має значення `length`).
- `chunkMode`: `length` розбиває повідомлення за кількістю символів; `newline` розбиває на межах рядків.
- `responsePrefix`: необов’язковий рядок, що додається на початок усіх вихідних відповідей для цього channel.
- `ackReaction`: необов’язкове перевизначення реакції-підтвердження для цього channel/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області реакції-підтвердження (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: ліміт розміру медіа в МБ для вихідних надсилань і обробки вхідних медіа.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). За замовчуванням: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Записи-псевдоніми розв’язуються до ID кімнат під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw приєднався до кімнати й класифікував її як DM. Це не змінює те, чи буде запрошення автоматично прийнято.
- `dm.allowFrom`: allowlist ID користувачів для трафіку DM. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги в каталозі розв’язуються під час запуску та коли allowlist змінюється під час роботи монітора. Імена, які не вдалося розв’язати, ігноруються.
- `dm.sessionScope`: `per-user` (за замовчуванням) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна DM-кімната Matrix зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає параметр верхнього рівня `threadReplies` як для розміщення відповідей, так і для ізоляції сесій у DM.
- `execApprovals`: нативна доставка схвалень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено схвалювати запити exec. Необов’язково, якщо `dm.allowFrom` уже визначає схвалювачів.
- `execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для цих записів.
- `groups`: мапа політик для окремих кімнат. Надавайте перевагу ID кімнат або псевдонімам; назви кімнат, які не вдалося розв’язати, ігноруються під час виконання. Ідентичність сесії/групи використовує стабільний ID кімнати після розв’язання.
- `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення рівня кімнати для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої кімнати.
- `groups.<room>.tools`: перевизначення allow/deny для інструментів у межах окремої кімнати.
- `groups.<room>.autoReply`: перевизначення обмеження згадками на рівні кімнати. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово вмикає їх знову.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: застарілий псевдонім для `groups`.
- `actions`: обмеження інструментів за діями (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані channels
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення захисту
