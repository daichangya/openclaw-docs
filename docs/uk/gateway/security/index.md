---
read_when:
    - Додавання функцій, які розширюють доступ або автоматизацію
summary: Міркування безпеки та модель загроз для запуску AI Gateway із доступом до shell
title: Безпека
x-i18n:
    generated_at: "2026-04-23T07:12:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bb81b40623203dade0ab168973674a5f5d8809bcd6912c29db41baa955ce2b8
    source_path: gateway/security/index.md
    workflow: 15
---

# Безпека

<Warning>
**Модель довіри для персонального асистента:** ці рекомендації припускають одну межу довіри оператора на Gateway (модель одного користувача/персонального асистента).
OpenClaw **не є** безпековою межею для ворожого багатокористувацького середовища, де кілька зловмисних користувачів спільно використовують одного агента/Gateway.
Якщо вам потрібна робота в змішаному середовищі довіри або з ворожими користувачами, розділіть межі довіри (окремі Gateway + облікові дані, а в ідеалі — окремі користувачі ОС/хости).
</Warning>

**На цій сторінці:** [Модель довіри](#scope-first-personal-assistant-security-model) | [Швидкий аудит](#quick-check-openclaw-security-audit) | [Посилена базова конфігурація](#hardened-baseline-in-60-seconds) | [Модель доступу до DM](#dm-access-model-pairing-allowlist-open-disabled) | [Посилення конфігурації](#configuration-hardening-examples) | [Реагування на інциденти](#incident-response)

## Спочатку про межі: модель безпеки персонального асистента

Рекомендації з безпеки OpenClaw виходять із розгортання **персонального асистента**: одна межа довіри оператора, потенційно багато агентів.

- Підтримувана модель безпеки: один користувач/межа довіри на Gateway (бажано один користувач ОС/хост/VPS на межу).
- Непідтримувана межа безпеки: один спільний Gateway/агент, яким користуються взаємно недовірені або ворожі користувачі.
- Якщо потрібна ізоляція від ворожих користувачів, розділяйте за межами довіри (окремі Gateway + облікові дані, а в ідеалі — окремі користувачі ОС/хости).
- Якщо кілька недовірених користувачів можуть надсилати повідомлення одному агенту з увімкненими інструментами, вважайте, що вони спільно використовують ті самі делеговані повноваження цього агента щодо інструментів.

На цій сторінці пояснюється посилення безпеки **в межах цієї моделі**. Вона не стверджує, що забезпечує ізоляцію для ворожого багатокористувацького середовища на одному спільному Gateway.

## Швидка перевірка: `openclaw security audit`

Див. також: [Formal Verification (Security Models)](/uk/security/formal-verification)

Запускайте це регулярно (особливо після зміни конфігурації або відкриття мережевих поверхонь):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` навмисно має вузький обсяг: він перемикає типові відкриті
group policy на allowlist, відновлює `logging.redactSensitive: "tools"`, посилює
права доступу до state/config/include-файлів і використовує скидання Windows ACL замість
POSIX `chmod` під час роботи у Windows.

Він виявляє типові небезпечні конфігурації (відкрита автентифікація Gateway, відкритий доступ до керування браузером, розширені allowlist, права доступу до файлової системи, надто вільні дозволи на exec і відкритий доступ до інструментів через канали).

OpenClaw — це і продукт, і експеримент: ви під’єднуєте поведінку frontier-model до реальних поверхонь обміну повідомленнями та реальних інструментів. **Не існує “ідеально безпечної” конфігурації.** Мета — свідомо визначити:

- хто може звертатися до вашого бота
- де боту дозволено діяти
- чого бот може торкатися

Починайте з найменшого доступу, який усе ще працює, і розширюйте його поступово в міру зростання впевненості.

### Довіра до розгортання та хоста

OpenClaw припускає, що хост і межа конфігурації є довіреними:

- Якщо хтось може змінювати стан/конфігурацію хоста Gateway (`~/.openclaw`, включно з `openclaw.json`), вважайте цю людину довіреним оператором.
- Запуск одного Gateway для кількох взаємно недовірених/ворожих операторів **не є рекомендованим варіантом**.
- Для команд зі змішаною довірою розділяйте межі довіри за допомогою окремих Gateway (або щонайменше окремих користувачів ОС/хостів).
- Рекомендований типовий варіант: один користувач на машину/хост (або VPS), один gateway для цього користувача та один чи більше агентів у цьому gateway.
- Усередині одного екземпляра Gateway автентифікований доступ оператора — це довірена роль площини керування, а не роль окремого користувача-орендаря.
- Ідентифікатори сесій (`sessionKey`, ID сесій, мітки) — це селектори маршрутизації, а не токени авторизації.
- Якщо кілька людей можуть надсилати повідомлення одному агенту з увімкненими інструментами, кожен із них може керувати тим самим набором дозволів. Ізоляція сесій/пам’яті на рівні користувача допомагає приватності, але не перетворює спільного агента на систему авторизації хоста на рівні користувача.

### Спільний робочий простір Slack: реальний ризик

Якщо “будь-хто в Slack може написати боту”, головний ризик — це делеговані повноваження на інструменти:

- будь-який дозволений відправник може ініціювати виклики інструментів (`exec`, браузер, мережеві/файлові інструменти) в межах policy агента;
- ін’єкція prompt/контенту від одного відправника може спричинити дії, що впливають на спільний стан, пристрої або результати;
- якщо один спільний агент має чутливі облікові дані/файли, будь-який дозволений відправник потенційно може ініціювати їх ексфільтрацію через інструменти.

Використовуйте окремі агенти/Gateway з мінімальним набором інструментів для командних процесів; агентів із персональними даними тримайте приватними.

### Спільний агент компанії: прийнятний шаблон

Це прийнятно, коли всі, хто використовує цього агента, перебувають в одній межі довіри (наприклад, одна команда компанії) і агент суворо обмежений бізнес-контекстом.

- запускайте його на окремій машині/VM/container;
- використовуйте окремого користувача ОС + окремий браузер/профіль/облікові записи для цього runtime;
- не входьте в цьому runtime до особистих Apple/Google-акаунтів або особистих профілів менеджера паролів/браузера.

Якщо ви змішуєте особисті та корпоративні ідентичності в одному runtime, ви руйнуєте розділення й підвищуєте ризик витоку персональних даних.

## Концепція довіри до Gateway і Node

Сприймайте Gateway і Node як одну операторську доменну межу довіри, але з різними ролями:

- **Gateway** — це площина керування та surface policy (`gateway.auth`, policy інструментів, маршрутизація).
- **Node** — це surface віддаленого виконання, спарений із цим Gateway (команди, дії на пристроях, локальні для хоста можливості).
- Клієнт, автентифікований у Gateway, є довіреним у межах Gateway. Після pairing дії на node вважаються довіреними операторськими діями на цьому node.
- `sessionKey` — це вибір маршрутизації/контексту, а не авторизація на рівні користувача.
- Погодження exec (allowlist + ask) — це запобіжники для наміру оператора, а не ізоляція від ворожого багатокористувацького середовища.
- Типова продуктова поведінка OpenClaw для довірених конфігурацій з одним оператором полягає в тому, що host exec на `gateway`/`node` дозволено без запитів на погодження (`security="full"`, `ask="off"`, якщо ви це не посилите). Це навмисне UX-рішення, а не вразливість саме по собі.
- Погодження exec прив’язуються до точного контексту запиту та, наскільки можливо, до прямих локальних файлових операндів; вони не моделюють семантично кожен шлях завантажувача runtime/інтерпретатора. Для сильних меж використовуйте sandboxing та ізоляцію хоста.

Якщо вам потрібна ізоляція від ворожих користувачів, розділяйте межі довіри за користувачами ОС/хостами та запускайте окремі Gateway.

## Матриця меж довіри

Використовуйте це як швидку модель під час оцінки ризиків:

| Межа або контроль                                        | Що це означає                                    | Типове хибне тлумачення                                                     |
| -------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Автентифікує клієнтів для API Gateway            | “Щоб було безпечно, потрібні підписи на кожному повідомленні/кожному frame” |
| `sessionKey`                                             | Ключ маршрутизації для вибору контексту/сесії    | “Ключ сесії є межею автентифікації користувача”                              |
| Запобіжники prompt/контенту                              | Знижують ризик зловживання моделлю               | “Лише prompt injection уже доводить обхід авторизації”                       |
| `canvas.eval` / browser evaluate                         | Навмисна операторська можливість, якщо ввімкнена | “Будь-який JS eval primitive автоматично є вразливістю в цій моделі довіри” |
| Локальна TUI `!` shell                                   | Явно ініційоване оператором локальне виконання   | “Зручна локальна shell-команда — це віддалена ін’єкція”                      |
| Pairing Node і команди Node                              | Віддалене виконання на рівні оператора на спарених пристроях | “Керування віддаленим пристроєм слід типово вважати недовіреним доступом користувача” |

## Не є вразливостями за задумом

Ці шаблони часто повідомляють, але зазвичай закривають без дій, якщо не показано реального обходу межі:

- Ланцюги, що спираються лише на prompt injection, без обходу policy/auth/sandbox.
- Твердження, що припускають вороже багатокористувацьке використання на одному спільному хості/конфігурації.
- Твердження, які трактують звичайний операторський доступ на читання (наприклад, `sessions.list`/`sessions.preview`/`chat.history`) як IDOR у конфігурації зі спільним gateway.
- Висновки для розгортань лише на localhost (наприклад, HSTS для gateway, доступного лише через loopback).
- Висновки про підпис вхідних Webhook Discord для вхідних шляхів, яких немає в цьому репозиторії.
- Звіти, які трактують метадані pairing Node як прихований другий шар погодження на кожну команду для `system.run`, хоча реальною межею виконання все одно є глобальна policy команд node в gateway плюс власні погодження exec на node.
- Знахідки про “відсутність авторизації на рівні користувача”, які трактують `sessionKey` як токен авторизації.

## Контрольний список для дослідника перед поданням

Перш ніж відкривати GHSA, перевірте все це:

1. Відтворення досі працює на останньому `main` або останньому випуску.
2. Звіт містить точний шлях коду (`file`, function, line range) і протестовану версію/commit.
3. Вплив перетинає документовану межу довіри (а не лише prompt injection).
4. Твердження не входить до [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Наявні advisory перевірено на дублікати (за потреби використовуйте канонічний GHSA).
6. Припущення щодо розгортання явно вказані (loopback/local чи зовнішній доступ, довірені чи недовірені оператори).

## Посилена базова конфігурація за 60 секунд

Спочатку використовуйте цю базову конфігурацію, а потім вибірково знову вмикайте інструменти для довірених агентів:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Це залишає Gateway доступним лише локально, ізолює DM і вимикає інструменти площини керування/runtime за замовчуванням.

## Швидке правило для спільної inbox

Якщо більше ніж одна людина може писати вашому боту в DM:

- Установіть `session.dmScope: "per-channel-peer"` (або `"per-account-channel-peer"` для багатоканальних конфігурацій з кількома обліковими записами).
- Залишайте `dmPolicy: "pairing"` або суворі allowlist.
- Ніколи не поєднуйте спільні DM із широким доступом до інструментів.
- Це посилює безпеку кооперативних/спільних inbox, але не задумувалося як ізоляція від ворожих співорендарів, коли користувачі мають спільний доступ до запису на хості/в конфігурації.

## Модель видимості контексту

OpenClaw розділяє дві концепції:

- **Авторизація тригера**: хто може запускати агента (`dmPolicy`, `groupPolicy`, allowlist, вимоги згадки).
- **Видимість контексту**: який додатковий контекст ін’єктується у вхід моделі (тіло відповіді, цитований текст, історія гілки, метадані пересилання).

Allowlist керують тригерами та авторизацією команд. Параметр `contextVisibility` керує тим, як фільтрується додатковий контекст (цитовані відповіді, корені гілок, отримана історія):

- `contextVisibility: "all"` (за замовчуванням) зберігає додатковий контекст як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Задавайте `contextVisibility` для кожного каналу або для кожної кімнати/розмови. Докладніше про налаштування див. у [Group Chats](/uk/channels/groups#context-visibility-and-allowlists).

Рекомендації для оцінки advisory:

- Твердження, які лише показують, що “модель може бачити цитований або історичний текст від відправників поза allowlist”, є знахідками щодо посилення безпеки, які вирішуються через `contextVisibility`, але самі по собі не є обходом меж auth або sandbox.
- Щоб мати безпековий вплив, звіти все одно мають демонструвати обхід межі довіри (auth, policy, sandbox, approval або іншої документованої межі).

## Що перевіряє аудит (загалом)

- **Вхідний доступ** (DM policy, group policy, allowlist): чи можуть сторонні люди запускати бота?
- **Радіус ураження інструментів** (elevated tools + відкриті кімнати): чи може prompt injection перетворитися на shell/file/network дії?
- **Дрейф погоджень exec** (`security=full`, `autoAllowSkills`, allowlist інтерпретаторів без `strictInlineEval`): чи запобіжники host-exec досі працюють так, як ви очікуєте?
  - `security="full"` — це попередження про широку модель безпеки, а не доказ помилки. Це вибрана типова поведінка для довірених конфігурацій персонального асистента; посилюйте її лише тоді, коли ваша модель загроз потребує запобіжників у вигляді погоджень або allowlist.
- **Відкритість мережі** (Gateway bind/auth, Tailscale Serve/Funnel, слабкі/короткі токени автентифікації).
- **Відкритість керування браузером** (віддалені Node, relay-порти, віддалені endpoint-и CDP).
- **Гігієна локального диска** (права доступу, symlink, include конфігурації, шляхи до “synced folder”).
- **Plugins** (plugins завантажуються без явного allowlist).
- **Дрейф policy/помилки конфігурації** (налаштовано параметри sandbox docker, але режим sandbox вимкнено; неефективні шаблони `gateway.nodes.denyCommands`, оскільки збіг виконується лише за точною назвою команди — наприклад, `system.run` — і не аналізує текст shell; небезпечні записи `gateway.nodes.allowCommands`; глобальний `tools.profile="minimal"` перевизначається профілями окремих агентів; інструменти, якими володіють plugins, доступні через надто ліберальну tool policy).
- **Дрейф очікувань runtime** (наприклад, припущення, що неявний exec усе ще означає `sandbox`, коли `tools.exec.host` тепер типово має значення `auto`, або явне задання `tools.exec.host="sandbox"` при вимкненому режимі sandbox).
- **Гігієна моделей** (попередження, якщо налаштовані моделі виглядають застарілими; це не жорстке блокування).

Якщо ви запускаєте з `--deep`, OpenClaw також намагається виконати best-effort живу перевірку Gateway.

## Карта зберігання облікових даних

Використовуйте це під час аудиту доступу або вирішення, що потрібно резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (неосновні облікові записи)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів у файлі (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`

## Контрольний список аудиту безпеки

Коли аудит виводить результати, сприймайте це як порядок пріоритетів:

1. **Усе, що “open”, плюс увімкнені інструменти**: спочатку обмежте DM/групи (pairing/allowlist), потім посиліть tool policy/sandboxing.
2. **Публічна мережна доступність** (LAN bind, Funnel, відсутня auth): виправляйте негайно.
3. **Віддалена відкритість керування браузером**: ставтеся до цього як до операторського доступу (лише tailnet, pairing Node навмисно, уникайте публічного доступу).
4. **Права доступу**: переконайтеся, що state/config/облікові дані/auth не доступні для читання групою чи всіма.
5. **Plugins**: завантажуйте лише те, чому явно довіряєте.
6. **Вибір моделі**: для будь-якого бота з інструментами віддавайте перевагу сучасним моделям, посиленим проти ін’єкцій інструкцій.

## Глосарій аудиту безпеки

Високосигнальні значення `checkId`, які ви найімовірніше побачите в реальних розгортаннях (список не вичерпний):

| `checkId`                                                     | Рівень        | Чому це важливо                                                                      | Основний ключ/шлях для виправлення                                                                   | Автовиправлення |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------- |
| `fs.state_dir.perms_world_writable`                           | critical      | Інші користувачі/процеси можуть змінювати весь стан OpenClaw                         | права доступу файлової системи для `~/.openclaw`                                                     | yes             |
| `fs.state_dir.perms_group_writable`                           | warn          | Користувачі групи можуть змінювати весь стан OpenClaw                                | права доступу файлової системи для `~/.openclaw`                                                     | yes             |
| `fs.state_dir.perms_readable`                                 | warn          | Каталог стану доступний для читання іншими                                           | права доступу файлової системи для `~/.openclaw`                                                     | yes             |
| `fs.state_dir.symlink`                                        | warn          | Цільовий каталог стану стає іншою межею довіри                                       | схема файлової системи для каталогу стану                                                            | no              |
| `fs.config.perms_writable`                                    | critical      | Інші можуть змінювати auth/tool policy/config                                        | права доступу файлової системи для `~/.openclaw/openclaw.json`                                       | yes             |
| `fs.config.symlink`                                           | warn          | Конфігураційні файли через symlink не підтримуються для запису й додають ще одну межу довіри | замініть на звичайний файл конфігурації або спрямуйте `OPENCLAW_CONFIG_PATH` на реальний файл       | no              |
| `fs.config.perms_group_readable`                              | warn          | Користувачі групи можуть читати токени/параметри конфігурації                        | права доступу файлової системи для файлу конфігурації                                                | yes             |
| `fs.config.perms_world_readable`                              | critical      | Конфігурація може розкрити токени/параметри                                          | права доступу файлової системи для файлу конфігурації                                                | yes             |
| `fs.config_include.perms_writable`                            | critical      | Include-файл конфігурації можуть змінювати інші                                      | права доступу include-файлу, на який посилається `openclaw.json`                                     | yes             |
| `fs.config_include.perms_group_readable`                      | warn          | Користувачі групи можуть читати включені секрети/параметри                           | права доступу include-файлу, на який посилається `openclaw.json`                                     | yes             |
| `fs.config_include.perms_world_readable`                      | critical      | Включені секрети/параметри доступні для читання всім                                 | права доступу include-файлу, на який посилається `openclaw.json`                                     | yes             |
| `fs.auth_profiles.perms_writable`                             | critical      | Інші можуть ін’єктувати або замінювати збережені облікові дані моделі                | права доступу для `agents/<agentId>/agent/auth-profiles.json`                                        | yes             |
| `fs.auth_profiles.perms_readable`                             | warn          | Інші можуть читати API-ключі й OAuth-токени                                          | права доступу для `agents/<agentId>/agent/auth-profiles.json`                                        | yes             |
| `fs.credentials_dir.perms_writable`                           | critical      | Інші можуть змінювати стан pairing/облікових даних каналу                            | права доступу файлової системи для `~/.openclaw/credentials`                                         | yes             |
| `fs.credentials_dir.perms_readable`                           | warn          | Інші можуть читати стан облікових даних каналу                                       | права доступу файлової системи для `~/.openclaw/credentials`                                         | yes             |
| `fs.sessions_store.perms_readable`                            | warn          | Інші можуть читати транскрипти/метадані сесій                                        | права доступу для сховища сесій                                                                       | yes             |
| `fs.log_file.perms_readable`                                  | warn          | Інші можуть читати журнали, з яких редаговано частину даних, але які все ще містять чутливу інформацію | права доступу для файла журналу Gateway                                                              | yes             |
| `fs.synced_dir`                                               | warn          | Стан/конфігурація в iCloud/Dropbox/Drive розширює ризик розкриття токенів/транскриптів | перемістіть конфігурацію/стан поза synced folders                                                    | no              |
| `gateway.bind_no_auth`                                        | critical      | Віддалений bind без спільного секрету                                                | `gateway.bind`, `gateway.auth.*`                                                                     | no              |
| `gateway.loopback_no_auth`                                    | critical      | Loopback за reverse proxy може стати неавтентифікованим                              | `gateway.auth.*`, налаштування proxy                                                                  | no              |
| `gateway.trusted_proxies_missing`                             | warn          | Заголовки reverse proxy присутні, але proxy не позначені як довірені                 | `gateway.trustedProxies`                                                                             | no              |
| `gateway.http.no_auth`                                        | warn/critical | API Gateway HTTP доступні з `auth.mode="none"`                                       | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                      | no              |
| `gateway.http.session_key_override_enabled`                   | info          | Клієнти HTTP API можуть перевизначати `sessionKey`                                   | `gateway.http.allowSessionKeyOverride`                                                               | no              |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | Знову вмикає небезпечні інструменти через HTTP API                                   | `gateway.tools.allow`                                                                                | no              |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | Вмикає команди Node з високим впливом (camera/screen/contacts/calendar/SMS)          | `gateway.nodes.allowCommands`                                                                        | no              |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | Схожі на шаблони deny-записи не збігаються з текстом shell або групами               | `gateway.nodes.denyCommands`                                                                         | no              |
| `gateway.tailscale_funnel`                                    | critical      | Публічна доступність з інтернету                                                     | `gateway.tailscale.mode`                                                                             | no              |
| `gateway.tailscale_serve`                                     | info          | Доступність через tailnet увімкнено за допомогою Serve                               | `gateway.tailscale.mode`                                                                             | no              |
| `gateway.control_ui.allowed_origins_required`                 | critical      | Control UI поза loopback без явного allowlist browser-origin                         | `gateway.controlUi.allowedOrigins`                                                                   | no              |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` вимикає allowlist browser-origin                              | `gateway.controlUi.allowedOrigins`                                                                   | no              |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Вмикає fallback origin через Host-header (послаблення захисту від DNS rebinding)     | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                         | no              |
| `gateway.control_ui.insecure_auth`                            | warn          | Увімкнено compatibility toggle для insecure auth                                     | `gateway.controlUi.allowInsecureAuth`                                                                | no              |
| `gateway.control_ui.device_auth_disabled`                     | critical      | Вимикає перевірку ідентичності пристрою                                              | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                     | no              |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | Довіра до fallback `X-Real-IP` може дозволити підміну source IP через помилкову конфігурацію proxy | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                              | no              |
| `gateway.token_too_short`                                     | warn          | Короткий спільний токен легше підібрати                                              | `gateway.auth.token`                                                                                 | no              |
| `gateway.auth_no_rate_limit`                                  | warn          | Відкрита auth без rate limiting підвищує ризик brute force                           | `gateway.auth.rateLimit`                                                                             | no              |
| `gateway.trusted_proxy_auth`                                  | critical      | Ідентичність proxy тепер стає межею auth                                             | `gateway.auth.mode="trusted-proxy"`                                                                  | no              |
| `gateway.trusted_proxy_no_proxies`                            | critical      | Trusted-proxy auth без IP довірених proxy є небезпечною                              | `gateway.trustedProxies`                                                                             | no              |
| `gateway.trusted_proxy_no_user_header`                        | critical      | Trusted-proxy auth не може безпечно визначити ідентичність користувача               | `gateway.auth.trustedProxy.userHeader`                                                               | no              |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | Trusted-proxy auth приймає будь-якого автентифікованого користувача upstream         | `gateway.auth.trustedProxy.allowUsers`                                                               | no              |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | Глибока перевірка не змогла визначити auth SecretRef у цьому шляху команди           | джерело auth для deep probe / доступність SecretRef                                                  | no              |
| `gateway.probe_failed`                                        | warn/critical | Жива перевірка Gateway не вдалася                                                     | доступність Gateway/auth                                                                             | no              |
| `discovery.mdns_full_mode`                                    | warn/critical | Повний режим mDNS рекламує метадані `cliPath`/`sshPort` у локальній мережі            | `discovery.mdns.mode`, `gateway.bind`                                                                | no              |
| `config.insecure_or_dangerous_flags`                          | warn          | Увімкнено будь-які небезпечні/ризиковані debug-прапорці                               | кілька ключів (див. деталі у finding)                                                                | no              |
| `config.secrets.gateway_password_in_config`                   | warn          | Пароль Gateway зберігається безпосередньо в конфігурації                              | `gateway.auth.password`                                                                              | no              |
| `config.secrets.hooks_token_in_config`                        | warn          | Bearer-токен hooks зберігається безпосередньо в конфігурації                          | `hooks.token`                                                                                        | no              |
| `hooks.token_reuse_gateway_token`                             | critical      | Токен входу hooks також відкриває auth Gateway                                        | `hooks.token`, `gateway.auth.token`                                                                  | no              |
| `hooks.token_too_short`                                       | warn          | Простіше виконати brute force для входу hooks                                         | `hooks.token`                                                                                        | no              |
| `hooks.default_session_key_unset`                             | warn          | Агент hooks виконує fan out у згенеровані сесії для кожного запиту                    | `hooks.defaultSessionKey`                                                                            | no              |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | Автентифіковані виклики hooks можуть маршрутизуватися до будь-якого налаштованого агента | `hooks.allowedAgentIds`                                                                           | no              |
| `hooks.request_session_key_enabled`                           | warn/critical | Зовнішній клієнт може вибирати `sessionKey`                                           | `hooks.allowRequestSessionKey`                                                                       | no              |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | Відсутнє обмеження на форми зовнішніх ключів сесій                                    | `hooks.allowedSessionKeyPrefixes`                                                                    | no              |
| `hooks.path_root`                                             | critical      | Шлях hooks дорівнює `/`, що спрощує колізії або помилкову маршрутизацію входу         | `hooks.path`                                                                                         | no              |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Записи встановлення hooks не прив’язані до незмінних npm-spec                         | метадані встановлення hook                                                                           | no              |
| `hooks.installs_missing_integrity`                            | warn          | У записах встановлення hooks бракує метаданих integrity                               | метадані встановлення hook                                                                           | no              |
| `hooks.installs_version_drift`                                | warn          | Записи встановлення hooks розходяться з установленими пакетами                        | метадані встановлення hook                                                                           | no              |
| `logging.redact_off`                                          | warn          | Чутливі значення потрапляють у журнали/статус                                         | `logging.redactSensitive`                                                                            | yes             |
| `browser.control_invalid_config`                              | warn          | Конфігурація керування браузером невалідна ще до runtime                              | `browser.*`                                                                                          | no              |
| `browser.control_no_auth`                                     | critical      | Керування браузером відкрите без auth за токеном/паролем                              | `gateway.auth.*`                                                                                     | no              |
| `browser.remote_cdp_http`                                     | warn          | Віддалений CDP через звичайний HTTP не має шифрування транспорту                      | профіль браузера `cdpUrl`                                                                            | no              |
| `browser.remote_cdp_private_host`                             | warn          | Віддалений CDP вказує на приватний/internal хост                                      | профіль браузера `cdpUrl`, `browser.ssrfPolicy.*`                                                    | no              |
| `sandbox.docker_config_mode_off`                              | warn          | Конфігурація Sandbox Docker присутня, але неактивна                                   | `agents.*.sandbox.mode`                                                                              | no              |
| `sandbox.bind_mount_non_absolute`                             | warn          | Відносні bind mounts можуть визначатися непередбачувано                               | `agents.*.sandbox.docker.binds[]`                                                                    | no              |
| `sandbox.dangerous_bind_mount`                                | critical      | Bind mount Sandbox націлено на заблоковані системні шляхи, облікові дані або шляхи Docker socket | `agents.*.sandbox.docker.binds[]`                                                            | no              |
| `sandbox.dangerous_network_mode`                              | critical      | Docker network у Sandbox використовує `host` або режим приєднання до namespace `container:*` | `agents.*.sandbox.docker.network`                                                             | no              |
| `sandbox.dangerous_seccomp_profile`                           | critical      | Профіль seccomp Sandbox послаблює ізоляцію container                                  | `agents.*.sandbox.docker.securityOpt`                                                                | no              |
| `sandbox.dangerous_apparmor_profile`                          | critical      | Профіль AppArmor Sandbox послаблює ізоляцію container                                 | `agents.*.sandbox.docker.securityOpt`                                                                | no              |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | Міст CDP браузера Sandbox відкритий без обмеження за діапазоном джерела               | `sandbox.browser.cdpSourceRange`                                                                     | no              |
| `sandbox.browser_container.non_loopback_publish`              | critical      | Наявний container браузера публікує CDP на інтерфейсах поза loopback                  | конфігурація publish container браузера sandbox                                                      | no              |
| `sandbox.browser_container.hash_label_missing`                | warn          | Наявний container браузера передує поточним міткам hash конфігурації                  | `openclaw sandbox recreate --browser --all`                                                          | no              |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | Наявний container браузера передує поточній епосі конфігурації браузера               | `openclaw sandbox recreate --browser --all`                                                          | no              |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` безпечно завершується відмовою, коли sandbox вимкнено             | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | no              |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | `exec host=sandbox` для окремого агента безпечно завершується відмовою, коли sandbox вимкнено | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                 | no              |
| `tools.exec.security_full_configured`                         | warn/critical | Host exec працює з `security="full"`                                                  | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | no              |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Погодження exec неявно довіряють bin із Skills                                        | `~/.openclaw/exec-approvals.json`                                                                    | no              |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | Allowlist інтерпретаторів дозволяє inline eval без примусового повторного погодження  | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, allowlist погоджень exec | no              |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | Інтерпретатори/runtime bin у `safeBins` без явних профілів розширюють ризик exec      | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                   | no              |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | Інструменти широкої поведінки в `safeBins` послаблюють модель довіри з низьким ризиком для фільтра stdin | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                   | no              |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` містить змінювані або ризиковані каталоги                        | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                      | no              |
| `skills.workspace.symlink_escape`                             | warn          | `skills/**/SKILL.md` робочого простору визначається поза коренем робочого простору (дрейф ланцюга symlink) | стан файлової системи `skills/**` робочого простору                                        | no              |
| `plugins.extensions_no_allowlist`                             | warn          | Plugins встановлено без явного allowlist plugin                                       | `plugins.allowlist`                                                                                  | no              |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Записи встановлення plugin не прив’язані до незмінних npm-spec                        | метадані встановлення plugin                                                                         | no              |
| `plugins.installs_missing_integrity`                          | warn          | У записах встановлення plugin бракує метаданих integrity                             | метадані встановлення plugin                                                                         | no              |
| `plugins.installs_version_drift`                              | warn          | Записи встановлення plugin розходяться з установленими пакетами                      | метадані встановлення plugin                                                                         | no              |
| `plugins.code_safety`                                         | warn/critical | Сканування коду plugin виявило підозрілі або небезпечні шаблони                      | код plugin / джерело встановлення                                                                    | no              |
| `plugins.code_safety.entry_path`                              | warn          | Шлях входу plugin вказує на приховані розташування або `node_modules`                | `entry` у manifest plugin                                                                            | no              |
| `plugins.code_safety.entry_escape`                            | critical      | Точка входу plugin виходить за межі каталогу plugin                                  | `entry` у manifest plugin                                                                            | no              |
| `plugins.code_safety.scan_failed`                             | warn          | Сканування коду plugin не вдалося завершити                                          | шлях plugin / середовище сканування                                                                  | no              |
| `skills.code_safety`                                          | warn/critical | Метадані інсталятора або код Skill містять підозрілі чи небезпечні шаблони           | джерело встановлення Skill                                                                           | no              |
| `skills.code_safety.scan_failed`                              | warn          | Сканування коду Skill не вдалося завершити                                           | середовище сканування Skill                                                                          | no              |
| `security.exposure.open_channels_with_exec`                   | warn/critical | Спільні/публічні кімнати можуть звертатися до агентів з увімкненим exec              | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`      | no              |
| `security.exposure.open_groups_with_elevated`                 | critical      | Відкриті групи + elevated tools створюють шляхи prompt injection з високим впливом   | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | no              |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | Відкриті групи можуть звертатися до інструментів команд/файлів без запобіжників sandbox/workspace | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no              |
| `security.trust_model.multi_user_heuristic`                   | warn          | Конфігурація виглядає багатокористувацькою, хоча модель довіри gateway — персональний асистент | розділіть межі довіри або застосуйте посилення для спільного користування (`sandbox.mode`, deny/workspace scoping для інструментів) | no |
| `tools.profile_minimal_overridden`                            | warn          | Перевизначення агента обходять глобальний профіль minimal                            | `agents.list[].tools.profile`                                                                        | no              |
| `plugins.tools_reachable_permissive_policy`                   | warn          | Інструменти extension доступні в контекстах із надто ліберальною policy              | `tools.profile` + allow/deny для інструментів                                                        | no              |
| `models.legacy`                                               | warn          | Досі налаштовано застарілі сімейства моделей                                         | вибір моделі                                                                                         | no              |
| `models.weak_tier`                                            | warn          | Налаштовані моделі нижчі за поточно рекомендовані рівні                              | вибір моделі                                                                                         | no              |
| `models.small_params`                                         | critical/info | Малі моделі + небезпечні інструментальні surface підвищують ризик ін’єкцій           | вибір моделі + policy sandbox/інструментів                                                           | no              |
| `summary.attack_surface`                                      | info          | Зведений підсумок щодо auth, каналів, інструментів і моделі відкритості              | кілька ключів (див. деталі у finding)                                                                | no              |

## Control UI через HTTP

Control UI потребує **безпечного контексту** (HTTPS або localhost), щоб генерувати
ідентичність пристрою. `gateway.controlUi.allowInsecureAuth` — це локальний compatibility toggle:

- На localhost він дозволяє auth для Control UI без ідентичності пристрою, коли сторінку
  завантажено через незахищений HTTP.
- Він не обходить перевірки pairing.
- Він не послаблює вимоги до ідентичності пристрою для віддалених (не-localhost) підключень.

Надавайте перевагу HTTPS (Tailscale Serve) або відкривайте UI на `127.0.0.1`.

Лише для break-glass сценаріїв `gateway.controlUi.dangerouslyDisableDeviceAuth`
повністю вимикає перевірки ідентичності пристрою. Це серйозне послаблення безпеки;
тримайте це вимкненим, якщо лише ви не займаєтеся активним налагодженням і можете швидко все повернути назад.

Окремо від цих небезпечних прапорців, успішний `gateway.auth.mode: "trusted-proxy"`
може допускати **операторські** сесії Control UI без ідентичності пристрою. Це
навмисна поведінка режиму auth, а не обхід через `allowInsecureAuth`, і вона все одно
не поширюється на сесії Control UI з роллю node.

`openclaw security audit` попереджає, коли цей параметр увімкнено.

## Підсумок щодо небезпечних або незахищених прапорців

`openclaw security audit` включає `config.insecure_or_dangerous_flags`, коли
увімкнено відомі незахищені/небезпечні debug-перемикачі. Наразі ця перевірка
агрегує:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

Повний список ключів конфігурації `dangerous*` / `dangerously*`, визначених у схемі
конфігурації OpenClaw:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (plugin channel)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (plugin channel)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (plugin channel)
- `channels.zalouser.dangerouslyAllowNameMatching` (plugin channel)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (plugin channel)
- `channels.irc.dangerouslyAllowNameMatching` (plugin channel)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (plugin channel)
- `channels.mattermost.dangerouslyAllowNameMatching` (plugin channel)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (plugin channel)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Конфігурація Reverse Proxy

Якщо ви запускаєте Gateway за reverse proxy (nginx, Caddy, Traefik тощо), налаштуйте
`gateway.trustedProxies` для коректної обробки пересланої IP-адреси клієнта.

Коли Gateway виявляє proxy-заголовки від адреси, якої **немає** в `trustedProxies`, він **не** вважає такі з’єднання локальними клієнтами. Якщо auth gateway вимкнено, такі з’єднання відхиляються. Це запобігає обходу автентифікації, коли проксійовані підключення інакше виглядали б як такі, що надходять із localhost, і автоматично отримували б довіру.

`gateway.trustedProxies` також використовується для `gateway.auth.mode: "trusted-proxy"`, але цей режим auth суворіший:

- auth через trusted-proxy **блокується за замовчуванням для proxy з loopback-джерела**
- reverse proxy на тому самому хості через loopback усе ще можуть використовувати `gateway.trustedProxies` для виявлення локального клієнта й обробки пересланого IP
- для reverse proxy на тому самому хості через loopback використовуйте auth за токеном/паролем замість `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP reverse proxy
  # Необов’язково. За замовчуванням false.
  # Увімкніть лише якщо ваш proxy не може надавати X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Коли налаштовано `trustedProxies`, Gateway використовує `X-Forwarded-For` для визначення IP-адреси клієнта. `X-Real-IP` за замовчуванням ігнорується, якщо явно не задано `gateway.allowRealIpFallback: true`.

Коректна поведінка reverse proxy (перезапис вхідних forwarding-заголовків):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Некоректна поведінка reverse proxy (додавання/збереження недовірених forwarding-заголовків):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Примітки щодо HSTS та origin

- Gateway OpenClaw насамперед орієнтований на local/loopback. Якщо ви завершуєте TLS на reverse proxy, задавайте HSTS на HTTPS-домені, що обслуговується proxy.
- Якщо HTTPS завершує сам Gateway, можна задати `gateway.http.securityHeaders.strictTransportSecurity`, щоб OpenClaw додавав заголовок HSTS у відповіді.
- Детальні рекомендації щодо розгортання див. у [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Для розгортань Control UI поза loopback `gateway.controlUi.allowedOrigins` є обов’язковим за замовчуванням.
- `gateway.controlUi.allowedOrigins: ["*"]` — це явна policy “дозволити всі browser-origin”, а не посилене типове значення. Уникайте цього поза суворо контрольованим локальним тестуванням.
- Помилки auth browser-origin на loopback усе одно підлягають rate limiting, навіть коли
  загальний виняток для loopback увімкнено, але ключ блокування визначається окремо
  для кожного нормалізованого значення `Origin`, а не як один спільний bucket localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає режим fallback origin через Host-header; ставтеся до цього як до небезпечної policy, свідомо вибраної оператором.
- Розглядайте DNS rebinding і поведінку proxy-host header як питання посилення безпеки розгортання; тримайте `trustedProxies` суворо обмеженим і не відкривайте Gateway напряму в публічний інтернет.

## Локальні журнали сесій зберігаються на диску

OpenClaw зберігає транскрипти сесій на диску в `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Це потрібно для безперервності сесій і (за бажанням) індексації пам’яті сесій, але це також означає,
що **будь-який процес/користувач із доступом до файлової системи може читати ці журнали**. Вважайте доступ до диска
межею довіри й належно обмежуйте права доступу до `~/.openclaw` (див. розділ аудиту нижче). Якщо вам потрібна
сильніша ізоляція між агентами, запускайте їх під окремими користувачами ОС або на окремих хостах.

## Виконання на Node (`system.run`)

Якщо спарено macOS node, Gateway може викликати `system.run` на цьому node. Це **віддалене виконання коду** на Mac:

- Потрібне pairing node (погодження + токен).
- Pairing node на Gateway — це не surface погодження для кожної окремої команди. Воно встановлює ідентичність/довіру до node і видає токен.
- Gateway застосовує грубу глобальну policy команд node через `gateway.nodes.allowCommands` / `denyCommands`.
- На Mac це керується через **Settings → Exec approvals** (security + ask + allowlist).
- Політика `system.run` для кожного node — це власний файл погоджень exec на node (`exec.approvals.node.*`), який може бути суворішим або м’якшим, ніж глобальна policy ID команд у gateway.
- Node, що працює з `security="full"` і `ask="off"`, дотримується типової моделі довіреного оператора. Вважайте це очікуваною поведінкою, якщо тільки ваше розгортання явно не вимагає суворішої моделі погоджень або allowlist.
- Режим погодження прив’язується до точного контексту запиту і, коли це можливо, до одного конкретного локального операнда script/file. Якщо OpenClaw не може точно визначити один прямий локальний файл для команди інтерпретатора/runtime, виконання на основі погодження відхиляється замість того, щоб обіцяти повне семантичне покриття.
- Для `host=node` виконання на основі погодження також зберігає канонічний підготовлений
  `systemRunPlan`; пізніші затверджені пересилання повторно використовують цей збережений план, а gateway
  під час перевірки відхиляє зміни command/cwd/session context з боку клієнта після
  створення запиту на погодження.
- Якщо ви не хочете віддаленого виконання, установіть security у **deny** і приберіть pairing node для цього Mac.

Це розрізнення важливе для оцінки:

- Повторне підключення спареного node, який оголошує інший список команд, само по собі не є вразливістю, якщо глобальна policy Gateway і локальні погодження exec на node все ще забезпечують реальну межу виконання.
- Звіти, які трактують метадані pairing node як другий прихований шар погодження для кожної команди, зазвичай є плутаниною в policy/UX, а не обходом межі безпеки.

## Динамічні Skills (watcher / віддалені Node)

OpenClaw може оновлювати список Skills посеред сесії:

- **Skills watcher**: зміни в `SKILL.md` можуть оновити snapshot Skills на наступному ході агента.
- **Віддалені Node**: підключення macOS node може зробити доступними Skills лише для macOS (на основі перевірки bin).

Ставтеся до каталогів Skills як до **довіреного коду** й обмежуйте коло тих, хто може їх змінювати.

## Модель загроз

Ваш AI-асистент може:

- Виконувати довільні shell-команди
- Читати/записувати файли
- Доступатися до мережевих сервісів
- Надсилати повідомлення будь-кому (якщо ви надали йому доступ до WhatsApp)

Люди, які надсилають вам повідомлення, можуть:

- Намагатися обдурити ваш AI, щоб він зробив щось шкідливе
- Використовувати соціальну інженерію для доступу до ваших даних
- Досліджувати деталі інфраструктури

## Основна ідея: контроль доступу перед інтелектом

Більшість збоїв тут — не витончені експлойти, а ситуації на кшталт “хтось написав боту, і бот зробив те, що його попросили”.

Позиція OpenClaw:

- **Спочатку ідентичність:** визначте, хто може звертатися до бота (DM pairing / allowlist / явний режим “open”).
- **Далі межі:** визначте, де бот може діяти (allowlist груп + вимога згадки, інструменти, sandboxing, дозволи пристрою).
- **Модель — насамкінець:** припускайте, що моделлю можна маніпулювати; проєктуйте систему так, щоб маніпуляція мала обмежений радіус ураження.

## Модель авторизації команд

Slash-команди та директиви обробляються лише для **авторизованих відправників**. Авторизація визначається з
channel allowlist/pairing плюс `commands.useAccessGroups` (див. [Configuration](/uk/gateway/configuration)
і [Slash commands](/uk/tools/slash-commands)). Якщо allowlist каналу порожній або містить `"*"`,
команди фактично відкриті для цього каналу.

`/exec` — це зручна команда лише для сесії й лише для авторизованих операторів. Вона **не** записує конфігурацію й
не змінює інші сесії.

## Ризики інструментів площини керування

Два вбудовані інструменти можуть вносити постійні зміни до площини керування:

- `gateway` може переглядати конфігурацію через `config.schema.lookup` / `config.get`, а також вносити постійні зміни через `config.apply`, `config.patch` і `update.run`.
- `cron` може створювати заплановані завдання, які продовжують працювати після завершення початкового чату/задачі.

Runtime-інструмент `gateway`, доступний лише власнику, усе ще відмовляється переписувати
`tools.exec.ask` або `tools.exec.security`; застарілі псевдоніми `tools.bash.*`
нормалізуються до тих самих захищених шляхів exec перед записом.

Для будь-якого агента/surface, що обробляє недовірений контент, за замовчуванням забороняйте це:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` блокує лише дії перезапуску. Він не вимикає дії конфігурації/оновлення `gateway`.

## Plugins

Plugins виконуються **в одному процесі** з Gateway. Ставтеся до них як до довіреного коду:

- Установлюйте plugins лише з джерел, яким довіряєте.
- Надавайте перевагу явним allowlist `plugins.allow`.
- Перевіряйте конфігурацію plugin перед увімкненням.
- Перезапускайте Gateway після змін plugin.
- Якщо ви встановлюєте або оновлюєте plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), ставтеся до цього як до запуску недовіреного коду:
  - Шлях встановлення — це каталог конкретного plugin у межах активного кореня встановлення plugins.
  - OpenClaw виконує вбудоване сканування небезпечного коду перед встановленням/оновленням. Результати рівня `critical` блокуються за замовчуванням.
  - OpenClaw використовує `npm pack`, а потім виконує `npm install --omit=dev` у цьому каталозі (скрипти життєвого циклу npm можуть виконувати код під час встановлення).
  - Надавайте перевагу зафіксованим точним версіям (`@scope/pkg@1.2.3`) і перевіряйте розпакований код на диску перед увімкненням.
  - `--dangerously-force-unsafe-install` — лише для break-glass сценаріїв у разі хибнопозитивних результатів вбудованого сканування в потоках встановлення/оновлення plugin. Це не обходить блокування policy для hook `before_install` plugin і не обходить збої сканування.
  - Встановлення залежностей Skill через Gateway дотримуються того самого поділу на dangerous/suspicious: вбудовані результати `critical` блокують виконання, якщо тільки клієнт явно не задає `dangerouslyForceUnsafeInstall`, тоді як suspicious-результати лише породжують попередження. `openclaw skills install` і далі залишається окремим потоком завантаження/встановлення Skill через ClawHub.

Докладніше: [Plugins](/uk/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## Модель доступу до DM (pairing / allowlist / open / disabled)

Усі поточні канали з підтримкою DM мають DM policy (`dmPolicy` або `*.dm.policy`), яка контролює вхідні DM **до** обробки повідомлення:

- `pairing` (за замовчуванням): невідомі відправники отримують короткий код pairing, а бот ігнорує їхнє повідомлення до схвалення. Коди діють 1 годину; повторні DM не надсилають код повторно, доки не буде створено новий запит. Кількість очікуваних запитів за замовчуванням обмежена до **3 на канал**.
- `allowlist`: невідомі відправники блокуються (без handshake pairing).
- `open`: дозволити будь-кому надсилати DM (публічно). **Потрібно**, щоб allowlist каналу містив `"*"` (явна згода).
- `disabled`: повністю ігнорувати вхідні DM.

Схвалення через CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Докладніше + файли на диску: [Pairing](/uk/channels/pairing)

## Ізоляція DM-сесій (багатокористувацький режим)

За замовчуванням OpenClaw маршрутизує **усі DM в основну сесію**, щоб ваш асистент зберігав безперервність між пристроями та каналами. Якщо **кілька людей** можуть надсилати DM боту (відкриті DM або allowlist із кількох людей), розгляньте ізоляцію DM-сесій:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Це запобігає витоку контексту між користувачами, зберігаючи ізоляцію групових чатів.

Це межа контексту повідомлень, а не межа адміністрування хоста. Якщо користувачі є взаємно ворожими й спільно використовують той самий хост/конфігурацію Gateway, натомість запускайте окремі Gateway для кожної межі довіри.

### Безпечний режим DM (рекомендовано)

Сприймайте фрагмент вище як **безпечний режим DM**:

- За замовчуванням: `session.dmScope: "main"` (усі DM використовують одну сесію для безперервності).
- Типове значення під час локального онбордингу CLI: записує `session.dmScope: "per-channel-peer"`, якщо параметр не задано (наявні явні значення не змінюються).
- Безпечний режим DM: `session.dmScope: "per-channel-peer"` (кожна пара канал+відправник отримує ізольований DM-контекст).
- Ізоляція відправника між каналами: `session.dmScope: "per-peer"` (кожен відправник отримує одну сесію для всіх каналів того самого типу).

Якщо ви використовуєте кілька облікових записів в одному каналі, застосовуйте `per-account-channel-peer`. Якщо та сама людина звертається до вас через кілька каналів, використовуйте `session.identityLinks`, щоб звести ці DM-сесії до однієї канонічної ідентичності. Див. [Session Management](/uk/concepts/session) і [Configuration](/uk/gateway/configuration).

## Allowlist (DM + групи) — термінологія

OpenClaw має два окремі рівні “хто може мене запускати?”:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; застаріле: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): хто має право звертатися до бота в прямих повідомленнях.
  - Коли `dmPolicy="pairing"`, схвалення записуються до сховища allowlist pairing з прив’язкою до облікового запису в `~/.openclaw/credentials/` (`<channel>-allowFrom.json` для облікового запису за замовчуванням, `<channel>-<accountId>-allowFrom.json` для неосновних облікових записів), а потім об’єднуються з allowlist з конфігурації.
- **Group allowlist** (залежить від каналу): з яких саме груп/каналів/guild бот узагалі прийматиме повідомлення.
  - Типові шаблони:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: типові параметри для груп, такі як `requireMention`; якщо параметр задано, він також виконує роль group allowlist (включіть `"*"`, щоб зберегти поведінку “дозволити всі”).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: обмежує, хто може запускати бота _всередині_ групової сесії (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlist для окремих surface + типові параметри згадок.
  - Перевірки груп виконуються в такому порядку: спочатку `groupPolicy`/group allowlist, потім активація через згадку/відповідь.
  - Відповідь на повідомлення бота (неявна згадка) **не** обходить allowlist відправників на кшталт `groupAllowFrom`.
  - **Примітка з безпеки:** ставтеся до `dmPolicy="open"` і `groupPolicy="open"` як до крайніх варіантів. Їх слід використовувати вкрай рідко; надавайте перевагу pairing + allowlist, якщо тільки ви не довіряєте повністю кожному учаснику кімнати.

Докладніше: [Configuration](/uk/gateway/configuration) і [Groups](/uk/channels/groups)

## Prompt injection (що це, чому це важливо)

Prompt injection — це коли зловмисник створює повідомлення, яке маніпулює моделлю, змушуючи її робити щось небезпечне (“ігноруй свої інструкції”, “виведи вміст файлової системи”, “перейди за цим посиланням і виконай команди” тощо).

Навіть із сильними system prompt, **prompt injection не вирішено**. Запобіжники system prompt — це лише м’які рекомендації; жорстке забезпечення дають tool policy, погодження exec, sandboxing і channel allowlist (і оператори можуть усе це вимкнути за задумом). Що допомагає на практиці:

- Тримайте вхідні DM обмеженими (pairing/allowlist).
- Надавайте перевагу активації через згадку в групах; уникайте “завжди активних” ботів у публічних кімнатах.
- Ставтеся до посилань, вкладень і вставлених інструкцій як до ворожих за замовчуванням.
- Виконуйте чутливі інструменти в sandbox; тримайте секрети поза досяжною для агента файловою системою.
- Примітка: sandboxing є опціональним. Якщо режим sandbox вимкнено, неявний `host=auto` визначається як хост gateway. Явний `host=sandbox` усе одно безпечно завершується відмовою, оскільки runtime sandbox недоступний. Задайте `host=gateway`, якщо хочете, щоб така поведінка була явно зафіксована в конфігурації.
- Обмежуйте інструменти високого ризику (`exec`, `browser`, `web_fetch`, `web_search`) для довірених агентів або явних allowlist.
- Якщо ви додаєте інтерпретатори до allowlist (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), увімкніть `tools.exec.strictInlineEval`, щоб inline eval-форми все одно вимагали явного погодження.
- Аналіз погодження shell також відхиляє форми POSIX parameter expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) всередині **нецитованих heredoc**, тому allowlist для тіла heredoc не може приховано провести shell expansion повз перевірку allowlist як звичайний текст. Щоб увімкнути буквальну семантику тіла, візьміть термінатор heredoc у лапки (наприклад, `<<'EOF'`); нецитовані heredoc, які б розгортали змінні, відхиляються.
- **Вибір моделі має значення:** старіші/менші/застарілі моделі значно менш стійкі до prompt injection і зловживання інструментами. Для агентів з увімкненими інструментами використовуйте найсильнішу доступну модель останнього покоління, посилену проти ін’єкцій інструкцій.

Сигнали небезпеки, які слід вважати недовіреними:

- “Прочитай цей файл/URL і зроби в точності те, що там написано.”
- “Ігноруй свій system prompt або правила безпеки.”
- “Розкрий свої приховані інструкції або результати інструментів.”
- “Встав повний вміст `~/.openclaw` або свої журнали.”

## Санітизація спеціальних токенів у зовнішньому контенті

OpenClaw прибирає поширені літерали спеціальних токенів шаблонів чату self-hosted LLM із обгорнутого зовнішнього контенту й метаданих до того, як вони потрапляють до моделі. Серед підтримуваних сімейств маркерів — токени ролей/ходів Qwen/ChatML, Llama, Gemma, Mistral, Phi і GPT-OSS.

Чому:

- OpenAI-сумісні бекенди, які працюють поверх self-hosted моделей, іноді зберігають спеціальні токени, що з’являються в тексті користувача, замість їх маскування. Зловмисник, який може записувати в зовнішній вхідний контент (отримана сторінка, тіло email, результат інструмента читання файлів), інакше міг би ін’єктувати синтетичну межу ролі `assistant` або `system` і вийти за межі запобіжників обгортання зовнішнього контенту.
- Санітизація відбувається на рівні обгортання зовнішнього контенту, тому застосовується однаково до інструментів fetch/read і вхідного контенту каналів, а не залежить від конкретного провайдера.
- Вихідні відповіді моделі вже мають окремий санітайзер, який прибирає витоки на кшталт `<tool_call>`, `<function_calls>` та подібного службового оформлення з видимих користувачу відповідей. Санітайзер зовнішнього контенту є вхідним аналогом.

Це не замінює інші механізми посилення на цій сторінці — основну роботу й далі виконують `dmPolicy`, allowlist, погодження exec, sandboxing і `contextVisibility`. Це закриває один конкретний обхід на рівні токенізатора для self-hosted стеків, які пересилають текст користувача зі збереженими спеціальними токенами.

## Прапорці обходу безпеки зовнішнього контенту

OpenClaw містить явні прапорці обходу, які вимикають безпечне обгортання зовнішнього контенту:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Поле payload Cron `allowUnsafeExternalContent`

Рекомендації:

- Залишайте їх не заданими/false у production.
- Увімкнюйте лише тимчасово для дуже вузького налагодження.
- Якщо їх увімкнено, ізолюйте такого агента (sandbox + мінімум інструментів + окремий простір імен сесій).

Примітка про ризики hooks:

- Payload hooks — це недовірений контент, навіть якщо доставка походить із систем, які ви контролюєте (пошта/документи/вебконтент можуть містити prompt injection).
- Слабші рівні моделей підвищують цей ризик. Для автоматизації через hooks надавайте перевагу сильним сучасним рівням моделей і тримайте tool policy суворою (`tools.profile: "messaging"` або суворіше), а також використовуйте sandboxing, де це можливо.

### Prompt injection не потребує публічних DM

Навіть якщо **лише ви** можете писати боту, prompt injection усе одно можливий через
будь-який **недовірений контент**, який читає бот (результати web search/fetch, сторінки браузера,
email, документи, вкладення, вставлені журнали/код). Іншими словами: відправник — не
єдина поверхня загрози; **сам контент** також може нести ворожі інструкції.

Коли інструменти увімкнені, типовий ризик — це ексфільтрація контексту або запуск
викликів інструментів. Зменшуйте радіус ураження так:

- Використовуйте **агента-читача** лише для читання або без інструментів, щоб підсумовувати недовірений контент,
  а потім передавайте підсумок вашому основному агенту.
- Тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з інструментами, якщо вони не потрібні.
- Для URL-входів OpenResponses (`input_file` / `input_image`) задавайте суворі
  `gateway.http.endpoints.responses.files.urlAllowlist` і
  `gateway.http.endpoints.responses.images.urlAllowlist`, а також тримайте `maxUrlParts` низьким.
  Порожні allowlist трактуються як незадані; використовуйте `files.allowUrl: false` / `images.allowUrl: false`,
  якщо хочете повністю вимкнути отримання за URL.
- Для файлових входів OpenResponses декодований текст `input_file` усе одно ін’єктується як
  **недовірений зовнішній контент**. Не вважайте текст файла довіреним лише тому,
  що Gateway декодував його локально. Ін’єктований блок усе одно містить явні
  маркери меж `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` плюс метадані `Source: External`,
  хоча в цьому шляху відсутній довший банер `SECURITY NOTICE:`.
- Те саме обгортання на основі маркерів застосовується, коли розуміння медіа витягує текст
  із вкладених документів перед додаванням цього тексту до prompt медіа.
- Увімкніть sandboxing і суворі allowlist інструментів для будь-якого агента, що працює з недовіреним вводом.
- Тримайте секрети поза prompt; передавайте їх через env/config на хості gateway.

### Self-hosted LLM backends

Self-hosted backends, сумісні з OpenAI, як-от vLLM, SGLang, TGI, LM Studio
або власні стеки токенізаторів Hugging Face, можуть відрізнятися від hosted-провайдерів у тому,
як обробляються спеціальні токени шаблонів чату. Якщо бекенд токенізує буквальні рядки
на кшталт `<|im_start|>`, `<|start_header_id|>` або `<start_of_turn>` як
структурні токени шаблону чату всередині користувацького контенту, недовірений текст може
спробувати підробити межі ролей на рівні токенізатора.

OpenClaw прибирає поширені літерали спеціальних токенів сімейств моделей із обгорнутого
зовнішнього контенту перед передаванням його моделі. Тримайте обгортання зовнішнього
контенту ввімкненим і, якщо доступно, надавайте перевагу параметрам бекенда, які розділяють або екранують спеціальні
токени в контенті, наданому користувачем. Hosted-провайдери, такі як OpenAI
і Anthropic, уже застосовують власну санітизацію на стороні запиту.

### Сила моделі (примітка щодо безпеки)

Стійкість до prompt injection **не** є однаковою в різних рівнях моделей. Менші/дешевші моделі зазвичай більш вразливі до зловживання інструментами та перехоплення інструкцій, особливо за наявності ворожих prompt.

<Warning>
Для агентів з увімкненими інструментами або агентів, що читають недовірений контент, ризик prompt injection зі старішими/меншими моделями часто є надто високим. Не запускайте такі навантаження на слабких рівнях моделей.
</Warning>

Рекомендації:

- **Використовуйте модель найкращого рівня останнього покоління** для будь-якого бота, який може запускати інструменти або торкатися файлів/мереж.
- **Не використовуйте старіші/слабші/менші рівні** для агентів з увімкненими інструментами або недовірених inbox; ризик prompt injection надто високий.
- Якщо вам усе ж потрібна менша модель, **зменшуйте радіус ураження** (лише читання, сильне sandboxing, мінімальний доступ до файлової системи, суворі allowlist).
- Під час запуску малих моделей **увімкніть sandboxing для всіх сесій** і **вимкніть `web_search`/`web_fetch`/`browser`**, якщо тільки вхідні дані не контролюються дуже жорстко.
- Для персональних асистентів лише для чату з довіреним вводом і без інструментів менші моделі зазвичай підходять.

<a id="reasoning-verbose-output-in-groups"></a>

## Reasoning і докладний вивід у групах

`/reasoning`, `/verbose` і `/trace` можуть розкрити внутрішнє reasoning, вивід інструментів
або діагностику plugin, які
не призначалися для публічного каналу. У групових середовищах вважайте їх **лише debug-інструментами**
і тримайте вимкненими, якщо тільки вони вам явно не потрібні.

Рекомендації:

- Тримайте `/reasoning`, `/verbose` і `/trace` вимкненими в публічних кімнатах.
- Якщо ви їх увімкнули, робіть це лише в довірених DM або суворо контрольованих кімнатах.
- Пам’ятайте: verbose і trace можуть містити аргументи інструментів, URL, діагностику plugin і дані, які бачила модель.

## Посилення конфігурації (приклади)

### 0) Права доступу до файлів

Тримайте config + state приватними на хості gateway:

- `~/.openclaw/openclaw.json`: `600` (лише читання/запис для користувача)
- `~/.openclaw`: `700` (лише для користувача)

`openclaw doctor` може попередити про це й запропонувати посилити ці права доступу.

### 0.4) Відкритість мережі (bind + port + firewall)

Gateway мультиплексує **WebSocket + HTTP** на одному порту:

- За замовчуванням: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ця HTTP-поверхня включає Control UI і хост canvas:

- Control UI (ресурси SPA) (типовий базовий шлях `/`)
- Хост canvas: `/__openclaw__/canvas/` і `/__openclaw__/a2ui/` (довільний HTML/JS; ставтеся до цього як до недовіреного контенту)

Якщо ви завантажуєте контент canvas у звичайному браузері, ставтеся до нього як до будь-якої іншої недовіреної вебсторінки:

- Не відкривайте хост canvas для недовірених мереж/користувачів.
- Не робіть так, щоб контент canvas мав той самий origin, що й привілейовані вебповерхні, якщо ви повністю не розумієте наслідків.

Режим bind визначає, де слухає Gateway:

- `gateway.bind: "loopback"` (за замовчуванням): підключатися можуть лише локальні клієнти.
- Bind поза loopback (`"lan"`, `"tailnet"`, `"custom"`) розширює surface атаки. Використовуйте їх лише з auth gateway (спільний токен/пароль або правильно налаштований trusted proxy поза loopback) і справжнім firewall.

Практичні правила:

- Надавайте перевагу Tailscale Serve замість bind до LAN (Serve залишає Gateway на loopback, а Tailscale керує доступом).
- Якщо вам все ж потрібно bind до LAN, обмежте порт через firewall суворим allowlist вихідних IP; не робіть широкий port-forward.
- Ніколи не відкривайте Gateway без автентифікації на `0.0.0.0`.

### 0.4.1) Публікація портів Docker + UFW (`DOCKER-USER`)

Якщо ви запускаєте OpenClaw з Docker на VPS, пам’ятайте, що опубліковані порти container
(`-p HOST:CONTAINER` або Compose `ports:`) маршрутизуються через ланцюги пересилання Docker,
а не лише через правила host `INPUT`.

Щоб узгодити трафік Docker із policy вашого firewall, застосовуйте правила в
`DOCKER-USER` (цей ланцюг обробляється до власних правил дозволу Docker).
На багатьох сучасних дистрибутивах `iptables`/`ip6tables` використовують frontend `iptables-nft`
і все одно застосовують ці правила до бекенда nftables.

Мінімальний приклад allowlist (IPv4):

```bash
# /etc/ufw/after.rules (додайте як окрему секцію *filter)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

Для IPv6 використовуються окремі таблиці. Додайте відповідну policy в `/etc/ufw/after6.rules`, якщо
Docker IPv6 увімкнено.

Уникайте жорстко закодованих назв інтерфейсів на кшталт `eth0` у фрагментах документації. Назви інтерфейсів
відрізняються між образами VPS (`ens3`, `enp*` тощо), і невідповідність може випадково
обійти ваше правило deny.

Швидка перевірка після перезавантаження:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Очікувані зовнішні порти мають бути лише тими, які ви свідомо відкрили (для більшості
конфігурацій: SSH + порти вашого reverse proxy).

### 0.4.2) Виявлення mDNS/Bonjour (розкриття інформації)

Gateway транслює свою присутність через mDNS (`_openclaw-gw._tcp` на порту 5353) для виявлення локальними пристроями. У повному режимі це включає TXT-записи, які можуть розкрити операційні деталі:

- `cliPath`: повний шлях файлової системи до бінарного файла CLI (розкриває ім’я користувача та місце встановлення)
- `sshPort`: рекламує доступність SSH на хості
- `displayName`, `lanHost`: інформація про hostname

**Міркування операційної безпеки:** трансляція інфраструктурних деталей полегшує розвідку для будь-кого в локальній мережі. Навіть “нешкідлива” інформація, як-от шляхи файлової системи та наявність SSH, допомагає зловмисникам картографувати ваше середовище.

**Рекомендації:**

1. **Мінімальний режим** (за замовчуванням, рекомендовано для відкритих gateway): не включає чутливі поля до трансляцій mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Повністю вимкніть**, якщо вам не потрібне виявлення локальними пристроями:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Повний режим** (явне ввімкнення): включає `cliPath` + `sshPort` у TXT-записи:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Змінна середовища** (альтернатива): задайте `OPENCLAW_DISABLE_BONJOUR=1`, щоб вимкнути mDNS без змін у конфігурації.

У мінімальному режимі Gateway усе ще транслює достатньо даних для виявлення пристроїв (`role`, `gatewayPort`, `transport`), але не включає `cliPath` і `sshPort`. Apps, яким потрібна інформація про шлях до CLI, можуть отримати її через автентифіковане WebSocket-з’єднання.

### 0.5) Захистіть WebSocket Gateway (локальна auth)

Auth Gateway **обов’язкова за замовчуванням**. Якщо не налаштовано
жодного валідного шляху auth gateway, Gateway відхиляє WebSocket-з’єднання
(безпечна відмова за замовчуванням).

Під час онбордингу за замовчуванням генерується токен (навіть для loopback), тому
локальні клієнти повинні автентифікуватися.

Задайте токен, щоб **усі** WS-клієнти проходили автентифікацію:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor може згенерувати його для вас: `openclaw doctor --generate-gateway-token`.

Примітка: `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони
самі по собі **не** захищають локальний доступ до WS.
Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*`
не задано.
Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через
SecretRef і його не вдається визначити, визначення завершується безпечною відмовою (без маскування fallback-ом через remote).
Необов’язково: закріпіть віддалений TLS через `gateway.remote.tlsFingerprint`, якщо використовуєте `wss://`.
Нешифрований `ws://` за замовчуванням дозволений лише для loopback. Для довірених шляхів у приватній мережі
задайте `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як break-glass.

Локальний pairing пристроїв:

- Pairing пристроїв схвалюється автоматично для прямих локальних loopback-підключень, щоб
  забезпечити плавну роботу клієнтів на тому самому хості.
- OpenClaw також має вузький шлях локального самопідключення backend/container
  для довірених helper-потоків зі спільним секретом.
- Підключення через tailnet і LAN, включно з bind через tailnet на тому самому хості, вважаються
  віддаленими для pairing і все одно потребують схвалення.
- **Ознаки forwarded-header позбавляють loopback-локальності.** Якщо запит
  надходить на loopback, але містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` /
  `X-Forwarded-Proto`, що вказують на не-local origin, запит
  вважається віддаленим для pairing, trusted-proxy auth і контролю
  ідентичності пристрою в Control UI — він більше не підпадає під авто-схвалення loopback.
- **Авто-схвалення оновлення метаданих** застосовується лише до несенситивних змін під час повторного підключення вже спарених довірених локальних клієнтів CLI/helper, які довели володіння спільним токеном або паролем через loopback. Клієнти браузера/Control UI та віддалені клієнти, як і раніше, потребують явного повторного схвалення. Розширення scope (з read до write/admin) і зміни публічного ключа ніколи не оновлюються непомітно.

Режими auth:

- `gateway.auth.mode: "token"`: спільний bearer-токен (рекомендовано для більшості конфігурацій).
- `gateway.auth.mode: "password"`: auth за паролем (краще задавати через env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: довіряти reverse proxy з awareness ідентичності, який автентифікує користувачів і передає ідентичність через заголовки (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)).

Контрольний список ротації (токен/пароль):

1. Згенеруйте/задайте новий секрет (`gateway.auth.token` або `OPENCLAW_GATEWAY_PASSWORD`).
2. Перезапустіть Gateway (або перезапустіть app macOS, якщо він керує Gateway).
3. Оновіть усі віддалені клієнти (`gateway.remote.token` / `.password` на машинах, які звертаються до Gateway).
4. Переконайтеся, що зі старими обліковими даними підключитися більше не можна.

### 0.6) Заголовки ідентичності Tailscale Serve

Коли `gateway.auth.allowTailscale` має значення `true` (типово для Serve), OpenClaw
приймає заголовки ідентичності Tailscale Serve (`tailscale-user-login`) для автентифікації
Control UI/WebSocket. OpenClaw перевіряє ідентичність, визначаючи адресу
`x-forwarded-for` через локальний демон Tailscale (`tailscale whois`) і звіряючи її із заголовком. Це спрацьовує лише для запитів, які потрапляють на loopback
і містять `x-forwarded-for`, `x-forwarded-proto` та `x-forwarded-host`, як
ін’єктує Tailscale.
Для цього асинхронного шляху перевірки ідентичності невдалі спроби для того самого `{scope, ip}`
серіалізуються до того, як limiter зафіксує помилку. Тому конкурентні невдалі повторні спроби
від одного клієнта Serve можуть одразу заблокувати другу спробу,
а не пройти паралельно як дві звичайні невідповідності.
Endpoint-и HTTP API (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують auth за заголовками ідентичності Tailscale. Вони й далі дотримуються
налаштованого режиму HTTP auth gateway.

Важлива примітка щодо межі:

- HTTP bearer auth Gateway фактично дає повний або нульовий операторський доступ.
- Ставтеся до облікових даних, які можуть викликати `/v1/chat/completions`, `/v1/responses` або `/api/channels/*`, як до секретів із повним доступом оператора для цього Gateway.
- На OpenAI-сумісній HTTP-поверхні bearer auth зі спільним секретом відновлює повні типові операторські scope (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) і семантику власника для ходів агента; вужчі значення `x-openclaw-scopes` не звужують цей шлях зі спільним секретом.
- Семантика scope для кожного HTTP-запиту застосовується лише тоді, коли запит надходить із режиму з ідентичністю, такого як auth через trusted proxy або `gateway.auth.mode="none"` на приватному ingress.
- У цих режимах з ідентичністю відсутність `x-openclaw-scopes` повертає до звичайного типового набору операторських scope; надсилайте цей заголовок явно, коли хочете вужчий набір scope.
- `/tools/invoke` дотримується того самого правила для спільного секрету: bearer auth за токеном/паролем також трактується там як повний операторський доступ, тоді як режими з ідентичністю все ще враховують оголошені scope.
- Не діліться цими обліковими даними з недовіреними клієнтами; надавайте перевагу окремим Gateway для кожної межі довіри.

**Припущення довіри:** auth Serve без токена припускає, що хост gateway є довіреним.
Не вважайте це захистом від ворожих процесів на тому самому хості. Якщо на хості gateway
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale`
і вимагайте явну auth зі спільним секретом через `gateway.auth.mode: "token"` або
`"password"`.

**Правило безпеки:** не пересилайте ці заголовки зі свого reverse proxy. Якщо
ви завершуєте TLS або проксіюєте трафік перед gateway, вимкніть
`gateway.auth.allowTailscale` і використовуйте auth зі спільним секретом (`gateway.auth.mode:
"token"` або `"password"`) або [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth).

Довірені proxy:

- Якщо ви завершуєте TLS перед Gateway, задайте `gateway.trustedProxies` з IP ваших proxy.
- OpenClaw довірятиме `x-forwarded-for` (або `x-real-ip`) від цих IP для визначення IP клієнта під час локальних перевірок pairing і локальних перевірок HTTP auth.
- Переконайтеся, що ваш proxy **перезаписує** `x-forwarded-for` і блокує прямий доступ до порту Gateway.

Див. [Tailscale](/uk/gateway/tailscale) і [Web overview](/uk/web).

### 0.6.1) Керування браузером через host node (рекомендовано)

Якщо ваш Gateway віддалений, але браузер працює на іншій машині, запускайте **host node**
на машині з браузером і дозвольте Gateway проксіювати дії браузера (див. [Browser tool](/uk/tools/browser)).
Ставтеся до pairing node як до адміністраторського доступу.

Рекомендований шаблон:

- Тримайте Gateway і host node в одному tailnet (Tailscale).
- Виконуйте pairing node свідомо; вимикайте proxy-маршрутизацію браузера, якщо вона вам не потрібна.

Уникайте:

- Відкриття relay/control-портів у LAN або публічному інтернеті.
- Tailscale Funnel для endpoint-ів керування браузером (публічна доступність).

### 0.7) Секрети на диску (чутливі дані)

Припускайте, що все під `~/.openclaw/` (або `$OPENCLAW_STATE_DIR/`) може містити секрети або приватні дані:

- `openclaw.json`: config може містити токени (gateway, віддалений gateway), параметри провайдера та allowlist.
- `credentials/**`: облікові дані каналів (приклад: облікові дані WhatsApp), allowlist pairing, імпорти застарілого OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: API-ключі, профілі токенів, OAuth-токени та необов’язкові `keyRef`/`tokenRef`.
- `secrets.json` (необов’язково): payload секретів у файлі, який використовують провайдери SecretRef типу `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: застарілий файл сумісності. Статичні записи `api_key` очищаються при виявленні.
- `agents/<agentId>/sessions/**`: транскрипти сесій (`*.jsonl`) + метадані маршрутизації (`sessions.json`), які можуть містити приватні повідомлення та вивід інструментів.
- пакети вбудованих plugins: установлені plugins (разом із їхніми `node_modules/`).
- `sandboxes/**`: робочі простори sandbox для інструментів; там можуть накопичуватися копії файлів, які ви читаєте/записуєте всередині sandbox.

Поради щодо посилення:

- Тримайте права доступу суворими (`700` для каталогів, `600` для файлів).
- Використовуйте повне шифрування диска на хості gateway.
- Якщо хост спільний, надавайте перевагу окремому обліковому запису користувача ОС для Gateway.

### 0.8) Файли `.env` робочого простору

OpenClaw завантажує локальні для робочого простору файли `.env` для агентів та інструментів, але ніколи не дозволяє цим файлам непомітно перевизначати керування runtime gateway.

- Будь-який ключ, що починається з `OPENCLAW_*`, блокується в недовірених файлах `.env` робочого простору.
- Параметри endpoint-ів каналів для Matrix, Mattermost, IRC і Synology Chat також блокуються від перевизначення через `.env` робочого простору, щоб клоновані робочі простори не могли перенаправляти трафік вбудованих конекторів через локальну конфігурацію endpoint-ів. Env-ключі endpoint-ів (такі як `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) мають надходити із середовища процесу gateway або `env.shellEnv`, а не з `.env`, завантаженого з робочого простору.
- Блокування працює за принципом безпечної відмови: нову змінну керування runtime, додану в майбутньому випуску, не можна успадкувати з коміченого або підсунутого зловмисником `.env`; ключ ігнорується, і gateway зберігає власне значення.
- Довірені змінні середовища процесу/ОС (власний shell gateway, модуль launchd/systemd, app bundle) і далі застосовуються — це обмеження стосується лише завантаження файлів `.env`.

Чому: файли `.env` робочого простору часто лежать поруч із кодом агента, випадково потрапляють у commit або записуються інструментами. Блокування всього префікса `OPENCLAW_*` означає, що додавання нового прапорця `OPENCLAW_*` у майбутньому ніколи не призведе до непомітного успадкування зі стану робочого простору.

### 0.9) Журнали й транскрипти (редагування + зберігання)

Журнали й транскрипти можуть призвести до витоку чутливої інформації, навіть якщо контроль доступу налаштовано правильно:

- Журнали Gateway можуть містити підсумки інструментів, помилки й URL.
- Транскрипти сесій можуть містити вставлені секрети, вміст файлів, вивід команд і посилання.

Рекомендації:

- Тримайте ввімкненим редагування підсумків інструментів (`logging.redactSensitive: "tools"`; за замовчуванням).
- Додавайте власні шаблони для вашого середовища через `logging.redactPatterns` (токени, hostname, внутрішні URL).
- Коли ділитеся діагностикою, надавайте перевагу `openclaw status --all` (можна вставляти, секрети відредаговано) замість сирих журналів.
- Видаляйте старі транскрипти сесій і файли журналів, якщо вам не потрібне довге зберігання.

Докладніше: [Logging](/uk/gateway/logging)

### 1) DM: pairing за замовчуванням

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Групи: всюди вимагайте згадку

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

У групових чатах відповідайте лише при явній згадці.

### 3) Окремі номери (WhatsApp, Signal, Telegram)

Для каналів на основі телефонних номерів розгляньте запуск свого AI на окремому номері телефону, а не на особистому:

- Особистий номер: ваші розмови залишаються приватними
- Номер бота: AI обробляє їх із відповідними межами

### 4) Режим лише читання (через sandbox + інструменти)

Ви можете побудувати профіль лише для читання, поєднавши:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (або `"none"` для повної відсутності доступу до робочого простору)
- списки allow/deny інструментів, які блокують `write`, `edit`, `apply_patch`, `exec`, `process` тощо.

Додаткові варіанти посилення:

- `tools.exec.applyPatch.workspaceOnly: true` (за замовчуванням): гарантує, що `apply_patch` не може записувати/видаляти файли поза каталогом робочого простору, навіть коли sandboxing вимкнено. Задавайте `false` лише якщо ви свідомо хочете, щоб `apply_patch` торкався файлів поза робочим простором.
- `tools.fs.workspaceOnly: true` (необов’язково): обмежує шляхи `read`/`write`/`edit`/`apply_patch` і шляхи автозавантаження зображень у native prompt каталогом робочого простору (корисно, якщо ви нині дозволяєте абсолютні шляхи й хочете один загальний запобіжник).
- Тримайте корені файлової системи вузькими: уникайте широких коренів на кшталт домашнього каталогу для робочих просторів агента/робочих просторів sandbox. Широкі корені можуть відкрити чутливі локальні файли (наприклад, state/config у `~/.openclaw`) для інструментів файлової системи.

### 5) Безпечна базова конфігурація (copy/paste)

Одна “безпечна за замовчуванням” конфігурація, яка тримає Gateway приватним, вимагає pairing для DM і уникає завжди активних ботів у групах:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Якщо ви також хочете “безпечніше за замовчуванням” для виконання інструментів, додайте sandbox + заборону небезпечних інструментів для будь-якого агента, який не є власником (приклад нижче в розділі “Профілі доступу для окремих агентів”).

Вбудована базова поведінка для chat-driven ходів агента: відправники, які не є власником, не можуть використовувати інструменти `cron` або `gateway`.

## Sandboxing (рекомендовано)

Окремий документ: [Sandboxing](/uk/gateway/sandboxing)

Два взаємодоповнювальні підходи:

- **Запускати весь Gateway у Docker** (межа container): [Docker](/uk/install/docker)
- **Sandbox для інструментів** (`agents.defaults.sandbox`, gateway на хості + інструменти, ізольовані через sandbox; Docker є backend за замовчуванням): [Sandboxing](/uk/gateway/sandboxing)

Примітка: щоб запобігти доступу між агентами, залишайте `agents.defaults.sandbox.scope` як `"agent"` (за замовчуванням)
або `"session"` для суворішої ізоляції на рівні сесії. `scope: "shared"` використовує
один спільний container/робочий простір.

Також враховуйте доступ агента до робочого простору всередині sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (за замовчуванням) повністю забороняє доступ до робочого простору агента; інструменти працюють із робочим простором sandbox у `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` монтує робочий простір агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` монтує робочий простір агента для читання/запису в `/workspace`
- Додаткові `sandbox.docker.binds` перевіряються на основі нормалізованих і канонізованих шляхів джерела. Трюки з батьківськими symlink і канонічними home-alias усе одно безпечно блокуються, якщо вони визначаються в заблоковані корені на кшталт `/etc`, `/var/run` або каталогів облікових даних у home ОС.

Важливо: `tools.elevated` — це глобальний аварійний вихід базового рівня, який запускає exec поза sandbox. Ефективний host за замовчуванням — `gateway`, або `node`, коли ціль exec налаштовано як `node`. Тримайте `tools.elevated.allowFrom` суворо обмеженим і не вмикайте його для сторонніх. Ви можете додатково обмежити elevated для окремого агента через `agents.list[].tools.elevated`. Див. [Elevated Mode](/uk/tools/elevated).

### Запобіжник делегування субагентам

Якщо ви дозволяєте інструменти сесій, ставтеся до делегованих запусків субагентів як до окремого рішення про межу:

- Забороняйте `sessions_spawn`, якщо агенту справді не потрібне делегування.
- Тримайте `agents.defaults.subagents.allowAgents` і будь-які перевизначення `agents.list[].subagents.allowAgents` для окремих агентів обмеженими відомо безпечними цільовими агентами.
- Для будь-якого процесу, який обов’язково має залишатися в sandbox, викликайте `sessions_spawn` із `sandbox: "require"` (за замовчуванням — `inherit`).
- `sandbox: "require"` одразу завершується помилкою, якщо child runtime цільового агента не працює в sandbox.

## Ризики керування браузером

Увімкнення керування браузером дає моделі можливість керувати реальним браузером.
Якщо цей профіль браузера вже містить активні сеанси входу, модель може
отримати доступ до цих облікових записів і даних. Ставтеся до профілів браузера як до **чутливого стану**:

- Надавайте перевагу окремому профілю для агента (типовий профіль `openclaw`).
- Не спрямовуйте агента на свій особистий основний профіль.
- Тримайте керування браузером на хості вимкненим для агентів у sandbox, якщо ви їм не довіряєте.
- Окремий loopback API керування браузером враховує лише auth зі спільним секретом
  (bearer auth за токеном gateway або пароль gateway). Він не використовує
  заголовки ідентичності trusted-proxy або Tailscale Serve.
- Ставтеся до завантажень браузера як до недовіреного вводу; надавайте перевагу ізольованому каталогу завантажень.
- Якщо можливо, вимикайте синхронізацію браузера/менеджери паролів у профілі агента (це зменшує радіус ураження).
- Для віддалених Gateway припускайте, що “керування браузером” еквівалентне “операторському доступу” до всього, чого може досягти цей профіль.
- Тримайте Gateway і host-и node доступними лише через tailnet; не відкривайте порти керування браузером у LAN або публічний інтернет.
- Вимикайте proxy-маршрутизацію браузера, коли вона не потрібна (`gateway.nodes.browser.mode="off"`).
- Режим Chrome MCP existing-session **не** є “безпечнішим”; він може діяти від вашого імені всюди, куди має доступ цей профіль Chrome на хості.

### Browser SSRF policy (сувора за замовчуванням)

Policy навігації браузера в OpenClaw є суворою за замовчуванням: приватні/internal адреси залишаються заблокованими, якщо ви явно не погодилися на інше.

- За замовчуванням: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` не задано, тому навігація браузера й далі блокує приватні/internal/special-use адреси призначення.
- Застарілий псевдонім: `browser.ssrfPolicy.allowPrivateNetwork` усе ще приймається для сумісності.
- Режим явного ввімкнення: задайте `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, щоб дозволити приватні/internal/special-use адреси призначення.
- У суворому режимі використовуйте `hostnameAllowlist` (шаблони на кшталт `*.example.com`) і `allowedHostnames` (точні винятки для host, включно з заблокованими назвами на кшталт `localhost`) для явних винятків.
- Навігація перевіряється перед запитом і повторно, у режимі best-effort, перевіряється на фінальному `http(s)` URL після навігації, щоб зменшити можливість pivot-атак через редиректи.

Приклад суворої policy:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Профілі доступу для окремих агентів (multi-agent)

У multi-agent маршрутизації кожен агент може мати власні sandbox + tool policy:
використовуйте це, щоб надавати **повний доступ**, **лише читання** або **без доступу** для кожного агента.
Повні подробиці та правила пріоритету див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

Типові варіанти використання:

- Особистий агент: повний доступ, без sandbox
- Сімейний/робочий агент: sandbox + інструменти лише для читання
- Публічний агент: sandbox + без інструментів файлової системи/shell

### Приклад: повний доступ (без sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Приклад: інструменти лише для читання + робочий простір лише для читання

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Приклад: без доступу до файлової системи/shell (дозволено повідомлення через провайдера)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Інструменти сесій можуть розкривати чутливі дані з транскриптів. За замовчуванням OpenClaw обмежує ці інструменти
        // поточною сесією + сесіями запущених субагентів, але за потреби ви можете ще більше посилити обмеження.
        // Див. `tools.sessions.visibility` у довіднику конфігурації.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Що сказати своєму AI

Включіть рекомендації з безпеки до system prompt вашого агента:

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## Реагування на інциденти

Якщо ваш AI робить щось погане:

### Стримайте ситуацію

1. **Зупиніть його:** зупиніть app macOS (якщо він керує Gateway) або завершіть процес `openclaw gateway`.
2. **Закрийте surface доступу:** задайте `gateway.bind: "loopback"` (або вимкніть Tailscale Funnel/Serve), доки не зрозумієте, що сталося.
3. **Заморозьте доступ:** переключіть ризиковані DM/групи на `dmPolicy: "disabled"` / вимогу згадки та приберіть записи `"*"` з allow-all, якщо вони були.

### Проведіть ротацію (вважайте компрометацію можливою, якщо секрети витекли)

1. Замініть auth Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) і перезапустіть.
2. Замініть секрети віддалених клієнтів (`gateway.remote.token` / `.password`) на всіх машинах, які можуть звертатися до Gateway.
3. Замініть облікові дані провайдерів/API (облікові дані WhatsApp, токени Slack/Discord, ключі моделей/API в `auth-profiles.json` і значення payload зашифрованих секретів, якщо вони використовуються).

### Проведіть аудит

1. Перевірте журнали Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (або `logging.file`).
2. Перегляньте відповідні транскрипти: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Перевірте нещодавні зміни конфігурації (усе, що могло розширити доступ: `gateway.bind`, `gateway.auth`, DM/group policy, `tools.elevated`, зміни plugins).
4. Повторно запустіть `openclaw security audit --deep` і переконайтеся, що critical findings усунено.

### Зберіть дані для звіту

- Часова позначка, ОС хоста gateway + версія OpenClaw
- Транскрипти сесії + короткий хвіст журналу (після редагування)
- Що надіслав зловмисник + що зробив агент
- Чи був Gateway відкритий поза loopback (LAN/Tailscale Funnel/Serve)

## Сканування секретів (detect-secrets)

CI запускає pre-commit hook `detect-secrets` у job `secrets`.
Push у `main` завжди запускають сканування всіх файлів. Pull request використовують
швидкий шлях лише для змінених файлів, якщо доступний базовий commit, і повертаються до повного
сканування всіх файлів в іншому разі. Якщо перевірка не проходить, це означає, що є нові кандидати, яких ще немає в baseline.

### Якщо CI не проходить

1. Відтворіть локально:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Зрозумійте інструменти:
   - `detect-secrets` у pre-commit запускає `detect-secrets-hook` з
     baseline та виключеннями цього репозиторію.
   - `detect-secrets audit` відкриває інтерактивний перегляд, щоб позначити кожен елемент baseline
     як справжній секрет або хибнопозитивний результат.
3. Для справжніх секретів: замініть/видаліть їх, а потім повторно запустіть сканування, щоб оновити baseline.
4. Для хибнопозитивних результатів: запустіть інтерактивний аудит і позначте їх як хибні:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Якщо вам потрібні нові виключення, додайте їх до `.detect-secrets.cfg` і заново згенеруйте
   baseline з відповідними прапорцями `--exclude-files` / `--exclude-lines` (файл
   конфігурації є лише довідковим; detect-secrets не читає його автоматично).

Закомітьте оновлений `.secrets.baseline`, щойно він відображатиме запланований стан.

## Повідомлення про проблеми безпеки

Знайшли вразливість в OpenClaw? Будь ласка, повідомляйте відповідально:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Не публікуйте публічно, доки проблему не виправлено
3. Ми вкажемо вас у подяках (якщо ви не віддаєте перевагу анонімності)
