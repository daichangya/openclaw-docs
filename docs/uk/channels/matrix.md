---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та верифікації
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-26T01:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix — це вбудований Plugin каналу для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує особисті повідомлення, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований Plugin

Matrix постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні
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

Див. [Plugins](/uk/tools/plugin) щодо поведінки Plugin і правил встановлення.

## Налаштування

1. Переконайтеся, що Plugin Matrix доступний.
   - Поточні пакетні випуски OpenClaw вже містять його.
   - У старіших/користувацьких встановленнях його можна додати вручну наведеними вище командами.
2. Створіть обліковий запис Matrix на вашому homeserver.
3. Налаштуйте `channels.matrix` одним із таких способів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть Gateway.
5. Почніть особисте листування з ботом або запросіть його до кімнати.
   - Нові запрошення Matrix працюють лише тоді, коли `channels.matrix.autoJoin` це дозволяє.

Шляхи інтерактивного налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер Matrix запитує:

- URL homeserver
- метод автентифікації: токен доступу або пароль
- ID користувача (лише для автентифікації паролем)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат і автоматичне приєднання за запрошенням

Ключові особливості майстра:

- Якщо змінні середовища автентифікації Matrix уже існують і для цього облікового запису ще не збережено автентифікацію в конфігурації, майстер запропонує скористатися env-скороченням, щоб зберегти автентифікацію у змінних середовища.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для особистих повідомлень напряму приймають `@user:server`; відображувані імена працюють лише тоді, коли живий пошук у каталозі знаходить одну точну відповідність.
- Записи allowlist для кімнат напряму приймають ID кімнат і псевдоніми. Надавайте перевагу `!room:server` або `#alias:server`; нерозв’язані назви ігноруються під час виконання під час розв’язання allowlist.
- У режимі allowlist для автоматичного приєднання за запрошенням використовуйте лише стабільні цілі запрошення: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються.
- Щоб розв’язати назви кімнат перед збереженням, використовуйте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` типово має значення `off`.

Якщо залишити його невстановленим, бот не приєднуватиметься до запрошених кімнат або нових запрошень у стилі особистих повідомлень, тому він не з’являтиметься в нових групах або запрошених особистих повідомленнях, якщо ви спочатку не приєднаєтеся вручну.

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
      deviceName: "Шлюз OpenClaw",
    },
  },
}
```

Matrix зберігає кешовані облікові дані в `~/.openclaw/credentials/matrix/`.
Для типового облікового запису використовується `credentials.json`; для іменованих облікових записів — `credentials-<account>.json`.
Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для setup, doctor і виявлення статусу каналу, навіть якщо поточна автентифікація не задана безпосередньо в конфігурації.

Відповідники змінних середовища (використовуються, коли ключ конфігурації не встановлено):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для нетипових облікових записів використовуйте змінні середовища з областю облікового запису:

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

Інтерактивний майстер пропонує скорочення через env vars лише тоді, коли ці змінні середовища автентифікації вже присутні, а для вибраного облікового запису ще не збережено автентифікацію Matrix у конфігурації.

`MATRIX_HOMESERVER` не можна встановити з робочого `.env`; див. [Робочі файли `.env`](/uk/gateway/security).

## Приклад конфігурації

Ось практична базова конфігурація з pairing для особистих повідомлень, allowlist для кімнат та увімкненим E2EE:

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

`autoJoin` застосовується до всіх запрошень Matrix, зокрема до запрошень у стилі особистих повідомлень. OpenClaw не може надійно
класифікувати запрошену кімнату як особистий чат чи групу на момент запрошення, тому всі запрошення спочатку проходять через `autoJoin`.
`dm.policy` застосовується після того, як бот уже приєднався і кімнату класифіковано як особистий чат.

## Попередні перегляди потокових відповідей

Потокові відповіді Matrix для reply є опціональними.

Установіть `channels.matrix.streaming` у значення `"partial"`, якщо хочете, щоб OpenClaw надсилав одну живу
відповідь-попередній перегляд, редагував цей попередній перегляд на місці, поки модель генерує текст, а
потім завершував його, коли відповідь готова:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` — значення за замовчуванням. OpenClaw чекає на остаточну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане повідомлення попереднього перегляду для поточного блоку асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає застарілу поведінку Matrix, коли сповіщення надсилається спочатку на попередній перегляд, тому стандартні клієнти можуть сповіщати про перший потоковий текст попереднього перегляду, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане тихе повідомлення-попередній перегляд для поточного блоку асистента. Використовуйте це лише тоді, коли ви також налаштували push rules отримувача для завершених редагувань попереднього перегляду.
- `blockStreaming: true` вмикає окремі повідомлення прогресу Matrix. Якщо потоковий попередній перегляд увімкнено, Matrix зберігає чернетку в реальному часі для поточного блоку і залишає завершені блоки як окремі повідомлення.
- Коли потоковий попередній перегляд увімкнено, а `blockStreaming` вимкнено, Matrix редагує чернетку в реальному часі на місці й завершує ту саму подію, коли блок або хід завершено.
- Якщо попередній перегляд більше не вміщується в одну подію Matrix, OpenClaw припиняє потоковий попередній перегляд і повертається до звичайної фінальної доставки.
- Відповіді з медіа все одно надсилають вкладення у звичайний спосіб. Якщо застарілий попередній перегляд більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Редагування попереднього перегляду потребують додаткових викликів API Matrix. Залишайте потокову передачу вимкненою, якщо хочете найобережнішу поведінку щодо обмеження швидкості.

`blockStreaming` саме по собі не вмикає чернетки попереднього перегляду.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагувань попереднього перегляду; потім додавайте `blockStreaming: true` лише якщо також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення про перебіг виконання.

Якщо вам потрібні стандартні сповіщення Matrix без користувацьких push rules, використовуйте `streaming: "partial"` для поведінки з попереднім переглядом спочатку або залиште `streaming` вимкненим для лише фінальної доставки. Якщо `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Власні push rules для тихих завершених попередніх переглядів

Тиха потокова передача (`streaming: "quiet"`) сповіщає отримувачів лише після завершення блоку або ходу — правило push для конкретного користувача має збігатися з маркером завершеного попереднього перегляду. Повне налаштування див. у [Правила push Matrix для тихих попередніх переглядів](/uk/channels/matrix-push-rules) (токен отримувача, перевірка pusher, встановлення правил, примітки для конкретних homeserver).

## Кімнати бот-до-бота

Типово повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

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

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів ботів Matrix у дозволених кімнатах і особистих повідомленнях.
- `allowBots: "mentions"` приймає ці повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. Особисті повідомлення все одно дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw і надалі ігнорує повідомлення від того самого ID користувача Matrix, щоб уникнути циклів самовідповіді.
- Matrix тут не надає вбудованого прапорця бота; OpenClaw трактує «створене ботом» як «надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw».

Під час увімкнення трафіку бот-до-бота в спільних кімнатах використовуйте суворі allowlist для кімнат і вимоги до згадування.

## Шифрування та верифікація

У зашифрованих кімнатах (E2EE) вихідні події зображень використовують `thumbnail_file`, тож попередні перегляди зображень шифруються разом із повним вкладенням. Незашифровані кімнати й надалі використовують звичайний `thumbnail_url`. Жодної конфігурації не потрібно — Plugin автоматично визначає стан E2EE.

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

Команди верифікації (усі підтримують `--verbose` для діагностики та `--json` для машинозчитуваного виводу):

```bash
openclaw matrix verify status
```

Докладний статус (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включити збережений recovery key у машинозчитуваний вивід:

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

Примусово скинути ідентичність cross-signing перед bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Верифікувати цей пристрій за допомогою recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ця команда повідомляє про три окремі стани:

- `Recovery key accepted`: Matrix прийняв recovery key для secret storage або довіри до пристрою.
- `Backup usable`: резервну копію ключів кімнат можна завантажити за допомогою довіреного recovery material.
- `Device verified by owner`: поточний пристрій OpenClaw має повну довіру до ідентичності Matrix cross-signing.

`Signed by owner` у докладному або JSON-виводі є лише діагностичним значенням. OpenClaw не
вважає цього достатнім, якщо `Cross-signing verified` також не має значення `yes`.

Команда все одно завершується з ненульовим кодом, якщо повну довіру до ідентичності Matrix не завершено,
навіть якщо recovery key може розблокувати резервні матеріали. У такому разі завершіть
самоверифікацію з іншого клієнта Matrix:

```bash
openclaw matrix verify self
```

Прийміть запит в іншому клієнті Matrix, порівняйте SAS emoji або десяткові числа
і вводьте `yes` лише тоді, коли вони збігаються. Команда чекає, доки Matrix не повідомить
`Cross-signing verified: yes`, перш ніж завершитися успішно.

Використовуйте `verify bootstrap --force-reset-cross-signing` лише тоді, коли свідомо
хочете замінити поточну ідентичність cross-signing.

Докладні відомості верифікації пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірка стану резервної копії ключів кімнат:

```bash
openclaw matrix verify backup status
```

Докладна діагностика стану резервної копії:

```bash
openclaw matrix verify backup status --verbose
```

Відновлення ключів кімнат із серверної резервної копії:

```bash
openclaw matrix verify backup restore
```

Якщо ключ резервної копії ще не завантажено з диска, передайте Matrix recovery key:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Інтерактивний процес самоверифікації:

```bash
openclaw matrix verify self
```

Для нижчорівневих або вхідних запитів на верифікацію використовуйте:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Використовуйте `openclaw matrix verify cancel <id>`, щоб скасувати запит.

Докладна діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видаліть поточну серверну резервну копію та створіть нову базову резервну копію. Якщо збережений
ключ резервної копії не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
майбутні cold start могли завантажувати новий ключ резервної копії:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` типово є стислими (включно з тихим внутрішнім логуванням SDK) і показують детальну діагностику лише з `--verbose`.
Використовуйте `--json` для повного машинозчитуваного виводу в скриптах.

У конфігураціях із кількома обліковими записами CLI-команди Matrix використовують неявний типовий обліковий запис Matrix, якщо ви не передасте `--account <id>`.
Якщо ви налаштуєте кілька іменованих облікових записів, спочатку встановіть `channels.matrix.defaultAccount`, інакше такі неявні CLI-операції зупиняться й попросять вас явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації або пристрою явно націлювалися на конкретний іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнено або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Що означає verified">
    OpenClaw вважає пристрій verified лише тоді, коли його підписує ваша власна ідентичність cross-signing. `verify status --verbose` показує три сигнали довіри:

    - `Locally trusted`: довірений лише цим клієнтом
    - `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
    - `Signed by owner`: підписаний вашим власним self-signing key

    `Verified by owner` стає `yes` лише тоді, коли присутня верифікація cross-signing.
    Локальної довіри або лише підпису власника недостатньо, щоб OpenClaw вважав
    пристрій повністю верифікованим.

  </Accordion>

  <Accordion title="Що робить bootstrap">
    `verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів. По порядку вона:

    - ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
    - ініціалізує cross-signing і завантажує відсутні публічні ключі cross-signing
    - позначає поточний пристрій і підписує його через cross-signing
    - створює серверну резервну копію ключів кімнат, якщо вона ще не існує

    Якщо homeserver вимагає UIA для завантаження ключів cross-signing, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, потім `m.login.password` (потрібен `channels.matrix.password`). Використовуйте `--force-reset-cross-signing` лише тоді, коли свідомо відкидаєте поточну ідентичність.

  </Accordion>

  <Accordion title="Нова базова резервна копія">
    Якщо ви хочете, щоб майбутні зашифровані повідомлення й надалі працювали, і готові втратити невідновлювану стару історію:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Додайте `--account <id>`, щоб націлити команду на іменований обліковий запис. Це також може повторно створити secret storage, якщо поточний секрет резервної копії не вдається безпечно завантажити.
    Додавайте `--rotate-recovery-key` лише тоді, коли свідомо хочете, щоб старий recovery
    key більше не розблоковував нову базову резервну копію.

  </Accordion>

  <Accordion title="Поведінка під час запуску">
    З `encryption: true` значення `startupVerification` за замовчуванням дорівнює `"if-unverified"`. Під час запуску неперевірений пристрій запитує самоверифікацію в іншому клієнті Matrix, пропускаючи дублікати та застосовуючи cooldown. Налаштуйте це через `startupVerificationCooldownHours` або вимкніть за допомогою `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід crypto bootstrap, який повторно використовує поточні secret storage та ідентичність cross-signing. Якщо стан bootstrap пошкоджений, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає password UIA, під час запуску записується попередження, але це не є фатальним. Пристрої, уже підписані власником, зберігаються.

    Див. [Міграція Matrix](/uk/install/migrating-matrix) для повного процесу оновлення.

  </Accordion>

  <Accordion title="Сповіщення верифікації">
    Matrix публікує повідомлення про життєвий цикл верифікації в кімнату суворої верифікації DM як повідомлення `m.notice`: запит, готовність (із вказівкою «Верифікувати за emoji»), початок/завершення та відомості SAS (emoji/десяткові числа), коли вони доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються й автоматично приймаються. Для самоверифікації OpenClaw автоматично запускає SAS-процес і підтверджує свій бік, щойно стає доступною верифікація emoji — вам усе одно потрібно порівняти й підтвердити «They match» у вашому клієнті Matrix.

    Системні сповіщення верифікації не пересилаються в pipeline чату агента.

  </Accordion>

  <Accordion title="Видалений або недійсний пристрій Matrix">
    Якщо `verify status` повідомляє, що поточний пристрій більше не вказаний на
    homeserver, створіть новий пристрій OpenClaw Matrix. Для входу за паролем:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Для автентифікації токеном створіть новий токен доступу у вашому клієнті Matrix або в UI адміністратора,
    а потім оновіть OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Замініть `assistant` на ID облікового запису з команди, що завершилася помилкою, або опустіть
    `--account` для типового облікового запису.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої під керуванням OpenClaw можуть накопичуватися. Переглядайте список і очищайте:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний crypto path Rust у `matrix-js-sdk` із `fake-indexeddb` як shim для IndexedDB. Стан crypto зберігається в `crypto-idb-snapshot.json` (з обмежувальними правами доступу до файлу).

    Зашифрований стан середовища виконання зберігається в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і включає sync store, crypto store, recovery key, знімок IDB, прив’язки тредів і стан startup verification. Коли токен змінюється, але ідентичність облікового запису залишається тією самою, OpenClaw повторно використовує найкращий наявний кореневий каталог, щоб попередній стан залишався видимим.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть власний профіль Matrix для вибраного облікового запису за допомогою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на конкретний іменований обліковий запис Matrix.

Matrix напряму приймає URL аватарів `mxc://`. Якщо ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його до Matrix, а потім зберігає розв’язаний URL `mxc://` назад у `channels.matrix.avatarUrl` (або в перевизначення вибраного облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилань через message-tool.

- `dm.sessionScope: "per-user"` (типове значення) зберігає маршрутизацію DM Matrix прив’язаною до відправника, тому кілька DM-кімнат можуть ділити одну сесію, якщо вони розв’язуються до того самого співрозмовника.
- `dm.sessionScope: "per-room"` ізолює кожну DM-кімнату Matrix у власний ключ сесії, водночас усе ще використовуючи звичайні перевірки автентифікації DM та allowlist.
- Явні прив’язки розмов Matrix і надалі мають пріоритет над `dm.sessionScope`, тому прив’язані кімнати й треди зберігають вибрану цільову сесію.
- `threadReplies: "off"` зберігає відповіді на верхньому рівні та залишає вхідні тредові повідомлення в батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті у треді, коренем якого є повідомлення-тригер, і маршрутизує цю розмову через відповідну сесію з областю треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає налаштування верхнього рівня лише для DM. Наприклад, ви можете залишити треди в кімнатах ізольованими, водночас зберігаючи DM плоскими.
- Вхідні тредові повідомлення включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковують поточний тред Matrix, коли ціль — та сама кімната або та сама DM-ціль користувача, якщо не вказано явний `threadId`.
- Повторне використання DM-цілі користувача для тієї самої сесії спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого DM-співрозмовника в тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації з областю користувача.
- Коли OpenClaw бачить, що DM-кімната Matrix конфліктує з іншою DM-кімнатою в тій самій спільній DM-сесії Matrix, він публікує одноразове `m.notice` у цій кімнаті з аварійним варіантом `/focus`, коли прив’язки тредів увімкнені, і з підказкою `dm.sessionScope`.
- Прив’язки тредів під час виконання підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах і DM Matrix.
- Верхньорівневий `/focus` у кімнаті/DM Matrix створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує саме цей поточний тред.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на довговічні робочі простори ACP без зміни поверхні чату.

Швидкий процес для операторів:

- Виконайте `/acp spawn codex --bind here` всередині DM Matrix, кімнати або наявного треду, якими хочете й надалі користуватися.
- У DM або кімнаті Matrix верхнього рівня поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної сесії ACP.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні типові значення з `session.threadBindings`, а також підтримує перевизначення для окремого каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення з прив’язкою до тредів Matrix вмикаються опціонально:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити верхньорівневому `/focus` створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати сесії ACP до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії з реакціями, вхідні сповіщення про реакції та вхідні реакції-підтвердження.

- Інструментарій вихідних реакцій контролюється через `channels["matrix"].actions.reactions`.
- `react` додає реакцію до конкретної події Matrix.
- `reactions` показує поточне зведення реакцій для конкретної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цій події.
- `remove: true` видаляє лише вказану реакцію emoji з облікового запису бота.

Область дії реакцій-підтверджень використовує стандартний порядок розв’язання OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента

Область реакції-підтвердження розв’язується в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції розв’язується в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- типове значення: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій не синтезуються в системні події, тому що Matrix показує їх як redaction, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` керує тим, скільки останніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення кімнати Matrix запускає агента. Резервно використовується `messages.groupChat.historyLimit`; якщо обидва не встановлені, фактичне типове значення — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix стосується лише кімнати. DM і надалі використовують звичайну історію сесії.
- Історія кімнати Matrix працює лише для очікуваних повідомлень: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповіді, а потім робить знімок цього вікна, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно залишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий знімок історії замість зміщення вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний контроль `contextVisibility` для додаткового контексту кімнати, наприклад отриманого тексту відповіді, коренів тредів і очікуваної історії.

- `contextVisibility: "all"` — типове значення. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригера, як і раніше, визначається налаштуваннями `groupPolicy`, `groups`, `groupAllowFrom` і політики DM.

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

Див. [Groups](/uk/channels/groups) щодо керування згадками та поведінки allowlist.

Приклад pairing для DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує надсилати вам повідомлення до схвалення, OpenClaw повторно використовує той самий очікуваний код pairing і може знову надіслати відповідь-нагадування після короткого cooldown замість створення нового коду.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу pairing DM і структури зберігання.

## Відновлення direct room

Якщо стан особистих повідомлень виходить із синхронізації, OpenClaw може отримати застарілі зіставлення `m.direct`, які вказують на старі окремі кімнати замість активного DM. Перевірте поточне зіставлення для співрозмовника за допомогою:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправте його за допомогою:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес відновлення:

- надає перевагу суворому DM 1:1, який уже зіставлено в `m.direct`
- якщо це неможливо, використовує будь-який поточно приєднаний суворий DM 1:1 із цим користувачем
- створює нову direct room і переписує `m.direct`, якщо справного DM не існує

Процес відновлення не видаляє старі кімнати автоматично. Він лише вибирає справний DM і оновлює зіставлення, щоб нові надсилання Matrix, сповіщення верифікації та інші процеси особистих повідомлень знову були спрямовані до правильної кімнати.

## Підтвердження exec

Matrix може діяти як нативний клієнт підтвердження для облікового запису Matrix. Нативні
параметри маршрутизації DM/каналу, як і раніше, розміщуються в конфігурації підтверджень exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; резервно використовується `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, типове значення: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Особи, що підтверджують, мають бути ID користувачів Matrix, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні підтвердження, коли `enabled` не встановлено або має значення `"auto"`, і можна розв’язати принаймні одного підтверджувача. Підтвердження exec спочатку використовують `execApprovals.approvers` і можуть резервно використовувати `channels.matrix.dm.allowFrom`. Підтвердження Plugin авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт підтвердження. Інакше запити на підтвердження резервно переходять до інших налаштованих маршрутів підтвердження або до резервної політики підтвердження.

Нативна маршрутизація Matrix підтримує обидва типи підтвердження:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout DM/каналу для запитів на підтвердження Matrix.
- Підтвердження exec використовують набір підтверджувачів exec із `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Підтвердження Plugin використовують allowlist DM Matrix із `channels.matrix.dm.allowFrom`.
- Скорочення реакцій Matrix і оновлення повідомлень застосовуються як до підтверджень exec, так і до підтверджень Plugin.

Правила доставки:

- `target: "dm"` надсилає запити на підтвердження в DM підтверджувачів
- `target: "channel"` надсилає запит назад у вихідну кімнату або DM Matrix
- `target: "both"` надсилає в DM підтверджувачів і у вихідну кімнату або DM Matrix

Запити на підтвердження Matrix ініціалізують скорочення реакцій на основному повідомленні підтвердження:

- `✅` = дозволити один раз
- `❌` = заборонити
- `♾️` = дозволити завжди, коли таке рішення дозволене фактичною політикою exec

Підтверджувачі можуть реагувати на це повідомлення або використовувати резервні slash commands: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише розв’язані підтверджувачі можуть дозволяти або забороняти. Для підтверджень exec доставка в канал включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Перевизначення для облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

## Slash commands

Slash commands Matrix (наприклад `/new`, `/reset`, `/model`) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає slash commands, перед якими стоїть власна згадка Matrix бота, тому `@bot:server /new` запускає шлях команди без потреби в користувацькому regex для згадки. Це дає змогу боту залишатися чутливим до публікацій у стилі кімнат `@mention /command`, які надсилають Element і подібні клієнти, коли користувач автодоповнює бота перед введенням команди.

Правила авторизації, як і раніше, застосовуються: відправники команд мають відповідати політикам DM або allowlist/owner для кімнат так само, як і для звичайних повідомлень.

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

Значення верхнього рівня `channels.matrix` діють як типові для іменованих облікових записів, якщо обліковий запис не перевизначає їх.
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account`.
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли типовий обліковий запис налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні типові значення автентифікації самі по собі не створюють окремого неявного типового облікового запису. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей типовий обліковий запис має нову автентифікацію (`homeserver` плюс `accessToken` або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть залишатися доступними для виявлення через `homeserver` плюс `userId`, якщо кешовані облікові дані пізніше задовольнять автентифікацію.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, відновлення/просування налаштування з одного облікового запису до кількох зберігає цей обліковий запис замість створення нового запису `accounts.default`. До цього просунутого облікового запису переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw надавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, probe і CLI-операцій.
Якщо налаштовано кілька облікових записів Matrix і один ID облікового запису має значення `default`, OpenClaw неявно використовує цей обліковий запис, навіть коли `defaultAccount` не встановлено.
Якщо ви налаштовуєте кілька іменованих облікових записів, установіть `defaultAccount` або передавайте `--account <id>` для CLI-команд, які покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, коли хочете перевизначити цей неявний вибір для однієї команди.

Див. [Configuration reference](/uk/gateway/config-channels#multi-account-all-channels) щодо спільного шаблону кількох облікових записів.

## Приватні/LAN homeserver

Типово OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
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

Це явне ввімкнення дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, такі як
`http://matrix.example.org:8008`, і далі блокуються. За можливості надавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо для вашого розгортання Matrix потрібен явний вихідний HTTP(S)-проксі, установіть `channels.matrix.proxy`:

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

Іменовані облікові записи можуть перевизначати типове значення верхнього рівня через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує те саме налаштування проксі для трафіку Matrix під час виконання та для probe статусу облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей усюди, де OpenClaw просить вас вказати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

ID кімнат Matrix чутливі до регістру. Використовуйте точний регістр ID кімнати з Matrix
під час налаштування явних цілей доставки, Cron, прив’язок або allowlist.
OpenClaw зберігає внутрішні ключі сесій у канонічному вигляді для зберігання, тому ці ключі
в нижньому регістрі не є надійним джерелом ID доставки Matrix.

Живий пошук у каталозі використовує обліковий запис Matrix, у який виконано вхід:

- Пошук користувачів виконує запити до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і псевдоніми, а потім резервно переходить до пошуку назв приєднаних кімнат для цього облікового запису.
- Пошук назв приєднаних кімнат є best-effort. Якщо назву кімнати не вдається розв’язати до ID або псевдоніма, її ігнорують під час розв’язання allowlist у runtime.

## Довідник конфігурації

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволяє цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, коли homeserver розв’язується в `localhost`, IP LAN/Tailscale або внутрішній хост на кшталт `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Іменовані облікові записи можуть перевизначати типове значення верхнього рівня власним `proxy`.
- `userId`: повний ID користувача Matrix, наприклад `@bot:example.org`.
- `accessToken`: токен доступу для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються значення plaintext і значення SecretRef у постачальниках env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються значення plaintext і значення SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, що отримуються під час стартової синхронізації.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли має значення `true`, переводить політику кімнат `open` у `allowlist` і примусово переводить усі активні політики DM, крім `disabled` (включно з `pairing` і `open`), у `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволяє повідомлення від інших налаштованих облікових записів OpenClaw Matrix (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID користувачів для трафіку кімнат. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги з каталогом розв’язуються під час запуску та коли allowlist змінюється, поки monitor працює. Нерозв’язані назви ігноруються.
- `historyLimit`: максимальна кількість повідомлень кімнати, які включаються як контекст історії групи. Резервно використовується `messages.groupChat.historyLimit`; якщо обидва не встановлені, фактичне типове значення — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (типове значення), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернеток із попереднім переглядом через звичайні текстові повідомлення Matrix. `"quiet"` використовує попередні повідомлення notice без сповіщень для конфігурацій із власними push rules. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі повідомлення прогресу для завершених блоків асистента, поки активна потокова передача чернетки попереднього перегляду.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення на рівні каналу для маршрутизації та життєвого циклу сесій, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту самоверифікації під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір частини вихідного повідомлення в символах (застосовується, коли `chunkMode` має значення `length`).
- `chunkMode`: `length` ділить повідомлення за кількістю символів; `newline` ділить за межами рядків.
- `responsePrefix`: необов’язковий рядок, що додається на початок усіх вихідних відповідей для цього каналу.
- `ackReaction`: необов’язкове перевизначення реакції-підтвердження для цього каналу/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області реакції-підтвердження (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: обмеження розміру медіа в МБ для вихідних надсилань і обробки вхідних медіа.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). Типове значення: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Псевдоніми розв’язуються в ID кімнат під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw приєднався до кімнати та класифікував її як DM. Це не змінює того, чи буде запрошення автоматично прийняте.
- `dm.allowFrom`: allowlist ID користувачів для трафіку DM. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги з каталогом розв’язуються під час запуску та коли allowlist змінюється, поки monitor працює. Нерозв’язані назви ігноруються.
- `dm.sessionScope`: `per-user` (типове значення) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна кімната DM Matrix зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає верхньорівневе налаштування `threadReplies` як для розміщення відповідей, так і для ізоляції сесій у DM.
- `execApprovals`: нативна доставка підтверджень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено підтверджувати запити exec. Необов’язково, якщо `dm.allowFrom` уже визначає підтверджувачів.
- `execApprovals.target`: `dm | channel | both` (типове значення: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як типові для цих записів.
- `groups`: мапа політик для окремих кімнат. Надавайте перевагу ID кімнат або псевдонімам; нерозв’язані назви кімнат ігноруються під час виконання. Ідентичність сесії/групи використовує стабільний ID кімнати після розв’язання.
- `groups.<room>.account`: обмежує один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників-ботів, налаштованих у системі (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої кімнати.
- `groups.<room>.tools`: перевизначення дозволу/заборони інструментів для окремої кімнати.
- `groups.<room>.autoReply`: перевизначення керування згадками на рівні кімнати. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово знову вмикає їх.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент системного запиту на рівні кімнати.
- `rooms`: застарілий псевдонім для `groups`.
- `actions`: керування інструментами за окремими діями (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
