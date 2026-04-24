---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та верифікації
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-24T03:41:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix — це вбудований channel Plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований Plugin

Matrix постачається як вбудований Plugin у поточних релізах OpenClaw, тож звичайні
пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або користувацьке встановлення без Matrix, встановіть
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
   - Поточні пакетні релізи OpenClaw уже містять його в комплекті.
   - У старіших/користувацьких встановленнях його можна додати вручну за допомогою наведених вище команд.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix`, використовуючи один із варіантів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть Gateway.
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
- ID користувача (лише для автентифікації паролем)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат і автоприєднання за запрошенням

Ключові особливості майстра:

- Якщо змінні середовища автентифікації Matrix уже існують і для цього облікового запису автентифікацію ще не збережено в конфігурації, майстер пропонує скорочений варіант із використанням env, щоб зберегти автентифікацію в змінних середовища.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для DM приймають `@user:server` напряму; відображувані імена працюють лише тоді, коли живий пошук у каталозі знаходить один точний збіг.
- Записи allowlist для кімнат приймають ID кімнат і псевдоніми напряму. Віддавайте перевагу `!room:server` або `#alias:server`; нерозв’язані назви ігноруються під час виконання механізмом розв’язання allowlist.
- У режимі allowlist для invite auto-join використовуйте лише стабільні цілі запрошень: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються.
- Щоб розв’язати назви кімнат перед збереженням, використайте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` типово має значення `off`.

Якщо залишити його невказаним, бот не приєднуватиметься до запрошених кімнат або нових запрошень у стилі DM, тож він не з’являтиметься в нових групах або запрошених DM, якщо ви спочатку не приєднаєтеся вручну.

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
Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для налаштування, doctor і виявлення channel-status, навіть якщо поточна автентифікація не задана безпосередньо в конфігурації.

Еквіваленти змінних середовища (використовуються, коли ключ конфігурації не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів не за замовчуванням використовуйте змінні середовища з областю дії облікового запису:

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
Наприклад, `-` перетворюється на `_X2D_`, тому `ops-prod` мапиться на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скорочений варіант зі змінними середовища лише тоді, коли ці env-змінні автентифікації вже присутні, а для вибраного облікового запису автентифікацію Matrix ще не збережено в конфігурації.

`MATRIX_HOMESERVER` не можна задавати з робочого `.env`; див. [Файли `.env` робочого простору](/uk/gateway/security).

## Приклад конфігурації

Це практична базова конфігурація з pairing для DM, allowlist кімнат і ввімкненим E2EE:

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
класифікувати запрошену кімнату як DM або групу на момент запрошення, тому всі запрошення спочатку проходять через `autoJoin`.
`dm.policy` застосовується після того, як бот уже приєднався, а кімнату класифіковано як DM.

## Попередній перегляд потокових відповідей

Потокове передавання відповідей Matrix вмикається лише за бажанням.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав одну живу відповідь-попередній перегляд,
редагував цей попередній перегляд на місці, поки модель генерує текст, а потім завершував його, коли
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

- `streaming: "off"` — це значення за замовчуванням. OpenClaw чекає на фінальну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане повідомлення-попередній перегляд для поточного блоку відповіді асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає застарілу поведінку Matrix зі сповіщенням за першим попереднім переглядом, тому стандартні клієнти можуть сповіщати про перший текст потокового попереднього перегляду, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане тихе повідомлення-попередній перегляд для поточного блоку відповіді асистента. Використовуйте це лише тоді, коли ви також налаштували правила push для одержувачів для фіналізованих редагувань попереднього перегляду.
- `blockStreaming: true` вмикає окремі повідомлення прогресу Matrix. Якщо ввімкнено потоковий попередній перегляд, Matrix зберігає живу чернетку для поточного блоку і залишає завершені блоки як окремі повідомлення.
- Коли потоковий попередній перегляд увімкнено, а `blockStreaming` вимкнено, Matrix редагує живу чернетку на місці та фіналізує ту саму подію, коли блок або хід завершено.
- Якщо попередній перегляд більше не поміщається в одну подію Matrix, OpenClaw зупиняє потоковий попередній перегляд і повертається до звичайної фінальної доставки.
- Медіавідповіді, як і раніше, надсилають вкладення у звичайному режимі. Якщо застарілий попередній перегляд більше не можна безпечно перевикористати, OpenClaw редагує його перед надсиланням фінальної медіавідповіді.
- Редагування попереднього перегляду потребують додаткових викликів API Matrix. Залишайте streaming вимкненим, якщо хочете максимально консервативну поведінку щодо rate limit.

`blockStreaming` сам по собі не вмикає попередні чернетки.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагування попереднього перегляду; потім додавайте `blockStreaming: true`, лише якщо ви також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення прогресу.

Якщо вам потрібні стандартні сповіщення Matrix без користувацьких правил push, використовуйте `streaming: "partial"` для поведінки з попереднім переглядом або залиште `streaming` вимкненим для доставки лише фінальної відповіді. З `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Власноруч хостовані правила push для тихих фіналізованих попередніх переглядів

Тихий streaming (`streaming: "quiet"`) сповіщає одержувачів лише після фіналізації блоку або ходу — правило push для конкретного користувача має збігатися з маркером фіналізованого попереднього перегляду. Див. [Правила push Matrix для тихих попередніх переглядів](/uk/channels/matrix-push-rules) для повного налаштування (токен одержувача, перевірка pusher, встановлення правила, примітки для окремих homeserver).

## Кімнати bot-to-bot

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

Використовуйте `allowBots`, якщо ви навмисно хочете міжагентний трафік Matrix:

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
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw усе одно ігнорує повідомлення від того самого ID користувача Matrix, щоб уникнути циклів самовідповідей.
- Matrix тут не надає вбудованого прапорця бота; OpenClaw трактує «створене ботом» як «надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw».

Використовуйте суворі allowlist кімнат і вимоги до згадування, коли вмикаєте bot-to-bot трафік у спільних кімнатах.

## Шифрування та верифікація

У зашифрованих кімнатах (E2EE) вихідні події зображень використовують `thumbnail_file`, тож попередній перегляд зображень шифрується разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Конфігурація не потрібна — Plugin автоматично визначає стан E2EE.

Увімкнути шифрування:

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

Команди верифікації (усі підтримують `--verbose` для діагностики та `--json` для машиночитаного виводу):

| Команда                                                        | Призначення                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Перевірити стан cross-signing і верифікації пристрою                               |
| `openclaw matrix verify status --include-recovery-key --json`  | Включити збережений recovery key                                                   |
| `openclaw matrix verify bootstrap`                             | Ініціалізувати cross-signing і верифікацію (див. нижче)                            |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Відкинути поточну identity cross-signing і створити нову                           |
| `openclaw matrix verify device "<recovery-key>"`               | Верифікувати цей пристрій за допомогою recovery key                                |
| `openclaw matrix verify backup status`                         | Перевірити стан резервної копії room-key                                           |
| `openclaw matrix verify backup restore`                        | Відновити ключі кімнат із серверної резервної копії                                |
| `openclaw matrix verify backup reset --yes`                    | Видалити поточну резервну копію та створити нову базову точку (може відтворити secret storage) |

У конфігураціях із кількома обліковими записами Matrix CLI-команди використовують неявний обліковий запис Matrix за замовчуванням, якщо ви не передасте `--account <id>`.
Якщо ви налаштували кілька іменованих облікових записів, спочатку задайте `channels.matrix.defaultAccount`, інакше такі неявні CLI-операції зупинятимуться і проситимуть вас явно вибрати обліковий запис.
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

    - `Locally trusted`: довірений лише цим клієнтом
    - `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
    - `Signed by owner`: підписаний вашим власним self-signing key

    `Verified by owner` стає `yes` лише тоді, коли присутній cross-signing або owner-signing. Лише локальної довіри недостатньо.

  </Accordion>

  <Accordion title="Що робить bootstrap">
    `verify bootstrap` — це команда ремонту й налаштування для зашифрованих облікових записів. По черзі вона:

    - ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
    - ініціалізує cross-signing і вивантажує відсутні публічні ключі cross-signing
    - позначає і підписує cross-signing для поточного пристрою
    - створює серверну резервну копію room-key, якщо вона ще не існує

    Якщо homeserver вимагає UIA для вивантаження ключів cross-signing, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, потім `m.login.password` (потребує `channels.matrix.password`). Використовуйте `--force-reset-cross-signing` лише тоді, коли свідомо відкидаєте поточну identity.

  </Accordion>

  <Accordion title="Нова базова точка резервної копії">
    Якщо ви хочете зберегти працездатність майбутніх зашифрованих повідомлень і погоджуєтеся втратити невідновлювану стару історію:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Додайте `--account <id>`, щоб націлити команду на іменований обліковий запис. Це також може відтворити secret storage, якщо поточний секрет резервної копії неможливо безпечно завантажити.

  </Accordion>

  <Accordion title="Поведінка під час запуску">
    За `encryption: true` `startupVerification` типово має значення `"if-unverified"`. Під час запуску неверифікований пристрій запитує self-verification в іншому клієнті Matrix, пропускаючи дублікати й застосовуючи cooldown. Налаштовуйте через `startupVerificationCooldownHours` або вимкніть за допомогою `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід crypto bootstrap, який повторно використовує поточні secret storage та identity cross-signing. Якщо стан bootstrap пошкоджений, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає password UIA, під час запуску записується попередження, але це не вважається фатальною помилкою. Уже підписані owner-підписом пристрої зберігаються.

    Повний процес оновлення див. у [Міграція Matrix](/uk/install/migrating-matrix).

  </Accordion>

  <Accordion title="Повідомлення про верифікацію">
    Matrix публікує повідомлення про життєвий цикл верифікації в сувору DM-кімнату верифікації як повідомлення `m.notice`: запит, готовність (із підказкою "Verify by emoji"), початок/завершення та деталі SAS (emoji/десяткові), коли вони доступні.

    Вхідні запити від іншого клієнта Matrix відстежуються й автоматично приймаються. Для self-verification OpenClaw автоматично запускає SAS-процес і підтверджує свій бік, щойно стає доступною верифікація за emoji — вам усе одно потрібно порівняти й підтвердити "They match" у своєму клієнті Matrix.

    Системні повідомлення верифікації не пересилаються в конвеєр чату агента.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої під керуванням OpenClaw можуть накопичуватися. Перелічіть і очистьте:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний crypto-шлях Rust із `matrix-js-sdk` із `fake-indexeddb` як shim для IndexedDB. Crypto-стан зберігається в `crypto-idb-snapshot.json` (із суворими правами доступу до файла).

    Зашифрований runtime-стан живе в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і включає sync store, crypto store, recovery key, знімок IDB, прив’язки тредів і стан startup verification. Коли токен змінюється, але identity облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний кореневий каталог, щоб попередній стан залишався видимим.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть власний профіль Matrix для вибраного облікового запису за допомогою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix напряму приймає URL аватара `mxc://`. Коли ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку вивантажує його в Matrix і зберігає отриманий URL `mxc://` назад у `channels.matrix.avatarUrl` (або в перевизначення вибраного облікового запису).

## Треди

Matrix підтримує рідні треди Matrix як для автоматичних відповідей, так і для надсилань message-tool.

- `dm.sessionScope: "per-user"` (типово) зберігає маршрутизацію Matrix DM прив’язаною до відправника, тому кілька DM-кімнат можуть ділити одну сесію, якщо вони розв’язуються до того самого peer.
- `dm.sessionScope: "per-room"` ізолює кожну Matrix DM-кімнату у власний ключ сесії, при цьому все ще використовуючи звичайні перевірки автентифікації DM та allowlist.
- Явні прив’язки розмов Matrix усе одно мають пріоритет над `dm.sessionScope`, тож прив’язані кімнати й треди зберігають свою вибрану цільову сесію.
- `threadReplies: "off"` зберігає відповіді на верхньому рівні й залишає вхідні повідомлення з тредів у батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, коренем якого є повідомлення-тригер, і маршрутизує цю розмову через відповідну сесію з областю дії треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає налаштування верхнього рівня лише для DM. Наприклад, ви можете ізолювати треди кімнат, залишивши DM пласкими.
- Вхідні повідомлення з тредів включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання message-tool автоматично успадковують поточний тред Matrix, коли ціллю є та сама кімната або той самий цільовий користувач DM, якщо явно не задано `threadId`.
- Повторне використання цілі DM-користувача в тій самій сесії спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого peer DM у тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації з областю дії користувача.
- Коли OpenClaw бачить, що Matrix DM-кімната конфліктує з іншою DM-кімнатою в тій самій спільній Matrix DM-сесії, він публікує одноразове `m.notice` у цій кімнаті з escape hatch `/focus`, коли ввімкнені прив’язки тредів і є підказка `dm.sessionScope`.
- Runtime-прив’язки тредів підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах і DM Matrix.
- Верхньорівневий `/focus` у кімнаті/DM Matrix створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Виконання `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує цей поточний тред.

## ACP conversation bindings

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на довготривалі робочі простори ACP без зміни поверхні чату.

Швидкий робочий процес оператора:

- Виконайте `/acp spawn codex --bind here` всередині Matrix DM, кімнати або наявного треду, якими хочете й надалі користуватися.
- У верхньорівневому Matrix DM або кімнаті поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної ACP-сесії.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану ACP-сесію на місці.
- `/acp close` закриває ACP-сесію і видаляє прив’язку.

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

Прапорці запуску, прив’язаного до тредів Matrix, вмикаються лише за бажанням:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити верхньорівневому `/focus` створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати ACP-сесії до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії реакцій, вхідні сповіщення про реакції та вхідні ack-реакції.

- Інструменти вихідних реакцій контролюються `channels["matrix"].actions.reactions`.
- `react` додає реакцію до конкретної події Matrix.
- `reactions` перелічує поточний підсумок реакцій для конкретної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цій події.
- `remove: true` видаляє лише вказану emoji-реакцію з облікового запису бота.

Область дії ack-реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- резервний emoji з identity агента

Область дії ack-реакцій визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- типово: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій не синтезуються в системні події, оскільки Matrix показує їх як редагування, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` керує тим, скільки нещодавніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення кімнати Matrix запускає агента. Використовує запасний варіант `messages.groupChat.historyLimit`; якщо обидва не задані, фактичне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнат Matrix — лише для кімнат. DM і далі використовують звичайну історію сесії.
- Історія кімнат Matrix працює лише для повідомлень, що очікують: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповідь, а потім робить знімок цього вікна, коли надходить згадка чи інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; для цього ходу воно лишається в основному вхідному тілі.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий знімок історії, а не зсуваються вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний елемент керування `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і історія, що очікує.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` поводиться як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригера, як і раніше, визначається через `groupPolicy`, `groups`, `groupAllowFrom` і налаштування політики DM.

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

Див. [Groups](/uk/channels/groups) щодо gating згадок і поведінки allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо неухвалений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий код pairing, що очікує, і може знову надіслати відповідь-нагадування після короткого cooldown, замість створення нового коду.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу pairing для DM і схеми зберігання.

## Виправлення direct room

Якщо стан direct-message виходить із синхронізації, OpenClaw може отримати застарілі мапінги `m.direct`, які вказують на старі solo-кімнати замість активного DM. Перевірити поточний мапінг для співрозмовника можна так:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправити його можна так:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес виправлення:

- віддає перевагу суворому DM 1:1, який уже відображений у `m.direct`
- за його відсутності переходить до будь-якого поточного приєднаного суворого DM 1:1 із цим користувачем
- створює нову direct room і переписує `m.direct`, якщо здорового DM не існує

Процес виправлення не видаляє старі кімнати автоматично. Він лише вибирає здоровий DM і оновлює мапінг, щоб нові надсилання Matrix, повідомлення верифікації та інші direct-message-потоки знову були спрямовані в правильну кімнату.

## Погодження exec

Matrix може виступати як нативний клієнт погодження для облікового запису Matrix. Нативні
параметри маршрутизації DM/channel, як і раніше, живуть у конфігурації погодження exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; використовує запасний варіант `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Особи, що погоджують, мають бути ID користувачів Matrix, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні погодження, коли `enabled` не задано або дорівнює `"auto"` і можна розв’язати принаймні одного погоджувача. Погодження exec спершу використовують `execApprovals.approvers` і можуть використовувати запасний варіант `channels.matrix.dm.allowFrom`. Погодження Plugin авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт погодження. Інакше запити на погодження використовують запасний маршрут до інших налаштованих шляхів погодження або політики резервного погодження.

Нативна маршрутизація Matrix підтримує обидва типи погоджень:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout DM/channel для запитів на погодження Matrix.
- Погодження exec використовують набір погоджувачів exec з `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Погодження Plugin використовують allowlist Matrix DM із `channels.matrix.dm.allowFrom`.
- Скорочення через реакції Matrix і оновлення повідомлень застосовуються як до погоджень exec, так і до погоджень Plugin.

Правила доставки:

- `target: "dm"` надсилає запити на погодження в DM погоджувачів
- `target: "channel"` надсилає запит назад до вихідної кімнати або DM Matrix
- `target: "both"` надсилає в DM погоджувачів і до вихідної кімнати або DM Matrix

Запити на погодження Matrix ініціалізують скорочення через реакції на основному повідомленні погодження:

- `✅` = дозволити один раз
- `❌` = відхилити
- `♾️` = дозволити завжди, коли таке рішення дозволене фактичною політикою exec

Погоджувачі можуть реагувати на це повідомлення або використовувати запасні slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише розв’язані погоджувачі можуть дозволяти або відхиляти. Для погоджень exec доставка в channel включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Перевизначення для окремого облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Погодження exec](/uk/tools/exec-approvals)

## Slash-команди

Slash-команди Matrix (наприклад, `/new`, `/reset`, `/model`) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає slash-команди, перед якими стоїть власна згадка бота Matrix, тож `@bot:server /new` запускає шлях команди без потреби в користувацькому regex для згадки. Це дає змогу боту лишатися чутливим до повідомлень у стилі кімнат `@mention /command`, які Element та подібні клієнти надсилають, коли користувач автодоповнює бота перед введенням команди.

Правила авторизації, як і раніше, діють: відправники команд мають відповідати політикам allowlist/owner для DM або кімнат, так само як і для звичайних повідомлень.

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
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account`.
Записи без `account` лишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли обліковий запис за замовчуванням налаштовано безпосередньо у верхньорівневому `channels.matrix.*`.
Часткові спільні значення автентифікації за замовчуванням самі по собі не створюють окремий неявний обліковий запис за замовчуванням. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей обліковий запис за замовчуванням має актуальну автентифікацію (`homeserver` плюс `accessToken`, або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть лишатися доступними для виявлення через `homeserver` плюс `userId`, коли кешовані облікові дані пізніше задовольняють автентифікацію.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, перехід ремонту/налаштування від одного облікового запису до кількох зберігає цей обліковий запис замість створення нового запису `accounts.default`. До цього підвищеного облікового запису переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw надавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, перевірок і CLI-операцій.
Якщо налаштовано кілька облікових записів Matrix і один з ID облікового запису має значення `default`, OpenClaw використовує цей обліковий запис неявно, навіть якщо `defaultAccount` не задано.
Якщо ви налаштовуєте кілька іменованих облікових записів, задайте `defaultAccount` або передавайте `--account <id>` для CLI-команд, що покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, якщо хочете перевизначити цей неявний вибір для однієї команди.

Див. [Довідник із конфігурації](/uk/gateway/config-channels#multi-account-all-channels) щодо спільного шаблону для кількох облікових записів.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не дозволите це для кожного облікового запису окремо.

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

Цей opt-in дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, такі як
`http://matrix.example.org:8008`, і далі блокуються. За можливості віддавайте перевагу `https://`.

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

Іменовані облікові записи можуть перевизначати значення верхнього рівня за замовчуванням через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує те саме налаштування проксі як для runtime-трафіку Matrix, так і для перевірок статусу облікового запису.

## Розв’язання цілей

Matrix приймає такі форми цілей усюди, де OpenClaw просить вас вказати кімнату або цільового користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Живий пошук у каталозі використовує виконаний вхід до облікового запису Matrix:

- Пошук користувачів звертається до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і псевдоніми, а потім використовує запасний варіант пошуку за назвами приєднаних кімнат для цього облікового запису.
- Пошук за назвами приєднаних кімнат виконується за принципом best-effort. Якщо назву кімнати не вдається розв’язати до ID або псевдоніма, її ігнорує runtime-механізм розв’язання allowlist.

## Довідник із конфігурації

- `enabled`: увімкнути або вимкнути channel.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, коли homeserver розв’язується в `localhost`, IP LAN/Tailscale або внутрішній хост, наприклад `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Іменовані облікові записи можуть перевизначати верхньорівневе значення за замовчуванням власним `proxy`.
- `userId`: повний ID користувача Matrix, наприклад `@bot:example.org`.
- `accessToken`: access token для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` у провайдерах env/file/exec підтримуються значення у відкритому тексті та значення SecretRef. Див. [Керування секретами](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються значення у відкритому тексті та значення SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, що отримуються під час стартової синхронізації.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли `true`, підвищує політику кімнат `open` до `allowlist` і примусово переводить усі активні політики DM, крім `disabled` (включно з `pairing` і `open`), у `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів OpenClaw Matrix (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID користувачів для трафіку кімнат. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги в каталозі розв’язуються під час запуску і коли allowlist змінюється, поки monitor працює. Нерозв’язані імена ігноруються.
- `historyLimit`: максимальна кількість повідомлень кімнати, які включаються як контекст історії групи. Використовує запасний варіант `messages.groupChat.historyLimit`; якщо обидва не задані, фактичне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (типово), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернетки за принципом попередній-перегляд-спочатку за допомогою звичайних текстових повідомлень Matrix. `"quiet"` використовує попередні тихі notice-повідомлення для власноруч хостованих конфігурацій із правилами push. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі повідомлення прогресу для завершених блоків асистента, поки активне потокове передавання чернетки-попереднього перегляду.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення рівня channel для маршрутизації та життєвого циклу сесій, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту self-verification під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір фрагмента вихідного повідомлення в символах (застосовується, коли `chunkMode` має значення `length`).
- `chunkMode`: `length` розбиває повідомлення за кількістю символів; `newline` розбиває за межами рядків.
- `responsePrefix`: необов’язковий рядок, що додається на початок усіх вихідних відповідей для цього channel.
- `ackReaction`: необов’язкове перевизначення ack-реакції для цього channel/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області дії ack-реакції (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: ліміт розміру медіа в MB для вихідних надсилань і обробки вхідних медіа.
- `autoJoin`: політика автоприєднання за запрошенням (`always`, `allowlist`, `off`). Типово: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Записи псевдонімів розв’язуються до ID кімнат під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw уже приєднався до кімнати й класифікував її як DM. Це не змінює те, чи буде запрошення автоматично прийняте.
- `dm.allowFrom`: allowlist ID користувачів для трафіку DM. Найбезпечніше використовувати повні ID користувачів Matrix; точні збіги в каталозі розв’язуються під час запуску і коли allowlist змінюється, поки monitor працює. Нерозв’язані імена ігноруються.
- `dm.sessionScope`: `per-user` (типово) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна кімната Matrix DM зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає верхньорівневе налаштування `threadReplies` як для розміщення відповідей, так і для ізоляції сесій у DM.
- `execApprovals`: Matrix-native доставка погоджень exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено погоджувати запити exec. Необов’язково, якщо `dm.allowFrom` уже визначає погоджувачів.
- `execApprovals.target`: `dm | channel | both` (типово: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для цих записів.
- `groups`: мапа політик для окремих кімнат. Віддавайте перевагу ID кімнат або псевдонімам; нерозв’язані назви кімнат ігноруються під час виконання. Після розв’язання ідентичність сесії/групи використовує стабільний ID кімнати.
- `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої кімнати.
- `groups.<room>.tools`: перевизначення allow/deny для інструментів на рівні кімнати.
- `groups.<room>.autoReply`: перевизначення gating згадок на рівні кімнати. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово знову вмикає їх.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: застарілий псевдонім для `groups`.
- `actions`: gating інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Огляд Channels](/uk/channels) — усі підтримувані channels
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та gating згадок
- [Маршрутизація channel](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та hardening
