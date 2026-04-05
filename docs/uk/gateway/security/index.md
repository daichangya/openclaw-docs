---
read_when:
    - Додавання функцій, які розширюють доступ або автоматизацію
summary: Міркування безпеки та модель загроз для запуску AI gateway із доступом до shell
title: Безпека
x-i18n:
    generated_at: "2026-04-05T18:09:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 223deb798774952f8d0208e761e163708a322045cf4ca3df181689442ef6fcfb
    source_path: gateway/security/index.md
    workflow: 15
---

# Безпека

<Warning>
**Модель довіри персонального помічника:** ці рекомендації передбачають одну межу довіри оператора на один gateway (модель одного користувача/персонального помічника).
OpenClaw **не** є ворожою мультитенантною межею безпеки для кількох взаємно недовірених користувачів, які спільно використовують один agent/gateway.
Якщо вам потрібна робота зі змішаною довірою або ворожими користувачами, розділіть межі довіри (окремий gateway + облікові дані, бажано також окремі користувачі ОС/хости).
</Warning>

**На цій сторінці:** [Модель довіри](#scope-first-personal-assistant-security-model) | [Швидкий аудит](#quick-check-openclaw-security-audit) | [Захищена базова конфігурація](#hardened-baseline-in-60-seconds) | [Модель доступу до DM](#dm-access-model-pairing--allowlist--open--disabled) | [Посилення конфігурації](#configuration-hardening-examples) | [Реагування на інциденти](#incident-response)

## Спочатку про межі: модель безпеки персонального помічника

Рекомендації OpenClaw щодо безпеки передбачають розгортання **персонального помічника**: одна межа довіри оператора, потенційно багато агентів.

- Підтримувана модель безпеки: один користувач/межа довіри на один gateway (бажано один користувач ОС/хост/VPS на одну межу).
- Непідтримувана межа безпеки: один спільний gateway/agent для взаємно недовірених або ворожих користувачів.
- Якщо потрібна ізоляція від ворожих користувачів, розділяйте за межами довіри (окремий gateway + облікові дані, а бажано також окремі користувачі ОС/хости).
- Якщо кілька недовірених користувачів можуть надсилати повідомлення одному agent з увімкненими tools, вважайте, що вони спільно використовують ті самі делеговані повноваження tools для цього agent.

Ця сторінка пояснює посилення безпеки **в межах цієї моделі**. Вона не стверджує, що забезпечує ворожу мультитенантну ізоляцію в одному спільному gateway.

## Швидка перевірка: `openclaw security audit`

Див. також: [Формальна верифікація (моделі безпеки)](/security/formal-verification)

Регулярно запускайте це (особливо після змін конфігурації або відкриття мережевих поверхонь):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` навмисно має вузьку дію: він переводить поширені відкриті групові
політики в allowlist, відновлює `logging.redactSensitive: "tools"`, посилює
права доступу до state/config/include-файлів і використовує скидання ACL у Windows замість
POSIX `chmod` під час роботи у Windows.

Він позначає типові небезпечні конфігурації (відкритий доступ до Gateway auth, відкритий доступ до керування браузером, allowlist для elevated, права доступу до файлової системи, надто м’які схвалення exec і відкритий доступ до tools через канали).

OpenClaw — це і продукт, і експеримент: ви підключаєте поведінку frontier-моделей до реальних поверхонь обміну повідомленнями та реальних tools. **«Ідеально безпечного» налаштування не існує.** Мета — усвідомлено вирішити:

- хто може розмовляти з вашим ботом
- де боту дозволено діяти
- чого бот може торкатися

Почніть із найменшого доступу, який усе ще працює, а потім розширюйте його в міру зростання впевненості.

### Розгортання і довіра до хоста

OpenClaw припускає, що хост і межа конфігурації є довіреними:

- Якщо хтось може змінювати стан/конфігурацію хоста Gateway (`~/.openclaw`, включно з `openclaw.json`), вважайте його довіреним оператором.
- Запуск одного Gateway для кількох взаємно недовірених/ворожих операторів **не є рекомендованим налаштуванням**.
- Для команд зі змішаною довірою розділяйте межі довіри окремими gateway (або як мінімум окремими користувачами ОС/хостами).
- Типова рекомендація: один користувач на машину/хост (або VPS), один gateway для цього користувача та один або більше агентів у цьому gateway.
- Усередині одного екземпляра Gateway автентифікований операторський доступ — це довірена роль control plane, а не роль окремого тенанта на користувача.
- Ідентифікатори сесій (`sessionKey`, ID сесій, мітки) — це селектори маршрутизації, а не токени авторизації.
- Якщо кілька людей можуть писати одному agent з увімкненими tools, кожен із них може керувати цим самим набором дозволів. Ізоляція сесій/пам’яті на користувача допомагає приватності, але не перетворює спільного agent на авторизаційну межу хоста для кожного користувача.

### Спільний робочий простір Slack: реальний ризик

Якщо «кожен у Slack може написати боту», головний ризик — делеговані повноваження tools:

- будь-який дозволений відправник може викликати `exec`, browser, network/file tools у межах політики agent;
- prompt/content injection від одного відправника може спричинити дії, що впливають на спільний стан, пристрої або вихідні дані;
- якщо один спільний agent має чутливі облікові дані/файли, будь-який дозволений відправник потенційно може керувати ексфільтрацією через використання tools.

Для командних сценаріїв використовуйте окремі agents/gateways з мінімальними tools; агентів із персональними даними тримайте приватними.

### Спільний корпоративний agent: прийнятний шаблон

Це прийнятно, коли всі, хто користується цим agent, перебувають в одній межі довіри (наприклад одна корпоративна команда), а agent суворо обмежений бізнес-завданнями.

- запускайте його на окремій машині/VM/контейнері;
- використовуйте окремого користувача ОС + окремий browser/profile/accounts для цього runtime;
- не входьте в цьому runtime у персональні Apple/Google-акаунти або особисті менеджери паролів/профілі браузера.

Якщо ви змішуєте персональні та корпоративні ідентичності в одному runtime, ви руйнуєте це розділення і збільшуєте ризик витоку персональних даних.

## Концепція довіри до Gateway і node

Ставтеся до Gateway і node як до однієї доменної області довіри оператора, але з різними ролями:

- **Gateway** — це control plane і поверхня політик (`gateway.auth`, політика tools, маршрутизація).
- **Node** — це поверхня віддаленого виконання, прив’язана до цього Gateway (команди, дії з пристроєм, можливості локального хоста).
- Виклик, автентифікований у Gateway, є довіреним у межах Gateway. Після pairing дії node — це довірені операторські дії на цьому node.
- `sessionKey` — це вибір маршрутизації/контексту, а не автентифікація на користувача.
- Схвалення exec (allowlist + ask) — це запобіжники для наміру оператора, а не ворожа мультитенантна ізоляція.
- Типове продуктове налаштування OpenClaw для довірених однооператорських сценаріїв полягає в тому, що host exec на `gateway`/`node` дозволений без запитів на схвалення (`security="full"`, `ask="off"`, якщо ви це не посилите). Це навмисний UX, а не вразливість саме по собі.
- Схвалення exec прив’язують точний контекст запиту та, за best-effort, прямі локальні файлові операнди; вони не моделюють семантично кожен шлях завантажувача runtime/interpreter. Для сильних меж використовуйте sandboxing та ізоляцію хоста.

Якщо вам потрібна ізоляція від ворожих користувачів, розділяйте межі довіри за користувачами ОС/хостами та запускайте окремі gateway.

## Матриця меж довіри

Використовуйте це як швидку модель під час оцінки ризику:

| Межа або контроль                                           | Що це означає                                   | Типове хибне тлумачення                                                        |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `gateway.auth` (token/password/trusted-proxy/device auth)   | Автентифікує виклики до gateway API             | «Щоб бути безпечним, потрібні підписи для кожного повідомлення/фрейму»         |
| `sessionKey`                                                | Ключ маршрутизації для вибору контексту/сесії   | «Ключ сесії — це межа автентифікації користувача»                              |
| Запобіжники в prompt/content                                | Зменшують ризик зловживання моделлю             | «Одного prompt injection достатньо, щоб довести обхід auth»                    |
| `canvas.eval` / evaluate у browser                          | Навмисна операторська можливість, коли ввімкнено | «Будь-який JS eval-примітив автоматично є вразливістю в цій моделі довіри»     |
| Локальний TUI `!` shell                                     | Явно ініційоване оператором локальне виконання  | «Зручна локальна shell-команда — це віддалена ін’єкція»                        |
| Pairing node і команди node                                 | Віддалене виконання на paired devices на рівні оператора | «Віддалене керування пристроєм треба за замовчуванням вважати доступом недовіреного користувача» |

## Не є вразливостями за задумом

Ці шаблони часто повідомляють як проблеми, але зазвичай закривають без дій, якщо не показано реальний обхід межі:

- Ланцюжки лише з prompt injection без обходу політики/auth/sandbox.
- Твердження, що виходять із припущення про ворожу мультитенантну роботу на одному спільному хості/конфігурації.
- Звіти, які класифікують нормальний операторський доступ до шляхів читання (наприклад `sessions.list`/`sessions.preview`/`chat.history`) як IDOR у налаштуванні зі спільним gateway.
- Знахідки, що стосуються розгортання лише на localhost (наприклад HSTS для gateway, доступного лише через loopback).
- Знахідки про підпис вхідного Discord webhook для вхідних шляхів, яких немає в цьому репозиторії.
- Звіти, які трактують метадані pairing node як прихований другий рівень схвалення для `system.run` на кожну команду, хоча реальною межею виконання лишається глобальна політика gateway для команд node плюс власні схвалення exec на node.
- Знахідки про «відсутню авторизацію на користувача», які трактують `sessionKey` як auth token.

## Контрольний список дослідника перед поданням

Перш ніж відкривати GHSA, перевірте все з цього списку:

1. Відтворення все ще працює на останньому `main` або останньому релізі.
2. У звіті вказано точний шлях у коді (`file`, function, line range) і перевірену версію/commit.
3. Наслідки перетинають задокументовану межу довіри (а не просто prompt injection).
4. Твердження не входить до [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Перевірено наявні advisories на дублікати (за потреби використовуйте канонічний GHSA).
6. Явно вказано припущення про розгортання (loopback/local vs exposed, trusted vs untrusted operators).

## Захищена базова конфігурація за 60 секунд

Спочатку використайте цю базову конфігурацію, а потім вибірково знову вмикайте tools для довірених агентів:

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

Це залишає Gateway доступним лише локально, ізолює DM і типово вимикає tools control plane/runtime.

## Швидке правило для спільної inbox

Якщо більше ніж одна людина може надсилати DM вашому боту:

- Установіть `session.dmScope: "per-channel-peer"` (або `"per-account-channel-peer"` для багатокористувацьких каналів).
- Залишайте `dmPolicy: "pairing"` або суворі allowlist.
- Ніколи не поєднуйте спільні DM із широким доступом до tools.
- Це посилює безпеку для кооперативних/спільних inbox, але не призначене як ворожа ко-тенантна ізоляція, коли користувачі спільно мають запис на хості/конфігурації.

## Модель видимості контексту

OpenClaw розділяє дві концепції:

- **Авторизація тригера**: хто може запускати agent (`dmPolicy`, `groupPolicy`, allowlists, gating за згадками).
- **Видимість контексту**: який допоміжний контекст інʼєктується у вхід моделі (тіло відповіді, цитований текст, історія потоку, метадані пересилання).

Allowlists визначають, хто може ініціювати виклики та виконувати команди. Параметр `contextVisibility` керує тим, як фільтрується допоміжний контекст (цитовані відповіді, корені потоків, отримана історія):

- `contextVisibility: "all"` (за замовчуванням) зберігає допоміжний контекст як отримано.
- `contextVisibility: "allowlist"` фільтрує допоміжний контекст до відправників, дозволених активними перевірками allowlist.
- `contextVisibility: "allowlist_quote"` поводиться як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Установлюйте `contextVisibility` для каналу або окремої кімнати/розмови. Докладніше див. [Групові чати](/channels/groups#context-visibility).

Вказівки для triage advisory:

- Твердження, які лише показують, що «модель може бачити цитований або історичний текст від відправників поза allowlist», є знахідками посилення безпеки, що вирішуються через `contextVisibility`, а не самостійним обходом меж auth або sandbox.
- Щоб мати наслідки для безпеки, звіт усе одно має демонструвати обхід межі довіри (auth, policy, sandbox, approval або іншої задокументованої межі).

## Що перевіряє аудит (на високому рівні)

- **Вхідний доступ** (політики DM, групові політики, allowlists): чи можуть сторонні люди запускати бота?
- **Радіус ураження tools** (elevated tools + відкриті кімнати): чи може prompt injection перетворитися на shell/file/network-дії?
- **Зсув схвалень exec** (`security=full`, `autoAllowSkills`, allowlist інтерпретаторів без `strictInlineEval`): чи все ще запобіжники host-exec працюють так, як ви очікуєте?
  - `security="full"` — це широке попередження про поставу безпеки, а не доказ бага. Це навмисно вибране типове значення для довірених конфігурацій персонального помічника; посилюйте лише тоді, коли цього вимагає ваша модель загроз.
- **Мережева експозиція** (Gateway bind/auth, Tailscale Serve/Funnel, слабкі/короткі auth tokens).
- **Відкритий доступ до керування browser** (віддалені nodes, relay-порти, віддалені CDP endpoints).
- **Локальна гігієна диска** (права доступу, symlinks, includes конфігурації, шляхи в «синхронізованих папках»).
- **Плагіни** (розширення існують без явного allowlist плагінів).
- **Зсув політики/неправильна конфігурація** (налаштовано sandbox docker, але режим sandbox вимкнено; неефективні шаблони `gateway.nodes.denyCommands`, бо зіставлення виконується лише за точним ім’ям команди, наприклад `system.run`, і не аналізує shell-текст; небезпечні записи `gateway.nodes.allowCommands`; глобальний `tools.profile="minimal"` перевизначений профілями окремих агентів; tools extension plugin доступні за надто поблажливої політики tools).
- **Зсув очікувань runtime** (наприклад, припущення, що неявний exec усе ще означає `sandbox`, коли `tools.exec.host` тепер типово дорівнює `auto`, або явне встановлення `tools.exec.host="sandbox"` при вимкненому режимі sandbox).
- **Гігієна моделей** (попереджає, коли налаштовані моделі виглядають legacy; це не жорстке блокування).

Якщо ви запускаєте `--deep`, OpenClaw також намагається виконати best-effort live probe Gateway.

## Карта зберігання облікових даних

Використовуйте це під час аудиту доступу або вирішення, що слід резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються)
- **Discord bot token**: config/env або SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (не-default облікові записи)
- **Профілі auth моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Файл із вмістом секретів (необов’язково)**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`

## Контрольний список security audit

Коли аудит показує знахідки, ставтеся до них у такому порядку пріоритету:

1. **Усе, що є “open” + tools увімкнено**: спочатку закрийте DM/групи (pairing/allowlists), потім посильте політику tools/sandboxing.
2. **Публічний мережевий доступ** (bind у LAN, Funnel, відсутність auth): виправляйте негайно.
3. **Віддалений доступ до browser control**: ставтеся до нього як до операторського доступу (лише tailnet, pairing nodes навмисно, уникати публічної експозиції).
4. **Права доступу**: переконайтеся, що state/config/credentials/auth недоступні для групи або всіх.
5. **Plugins/extensions**: завантажуйте лише те, чому явно довіряєте.
6. **Вибір моделі**: надавайте перевагу сучасним, стійким до інструкцій моделям для будь-якого бота з tools.

## Глосарій security audit

Найсигнальніші значення `checkId`, які ви з найбільшою ймовірністю побачите в реальних розгортаннях (не вичерпний список):

| `checkId`                                                     | Серйозність    | Чому це важливо                                                                     | Основний ключ/шлях для виправлення                                                                  | Автофікс |
| ------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical       | Інші користувачі/процеси можуть змінювати весь state OpenClaw                        | права файлової системи для `~/.openclaw`                                                            | так      |
| `fs.state_dir.perms_group_writable`                           | warn           | Користувачі групи можуть змінювати весь state OpenClaw                               | права файлової системи для `~/.openclaw`                                                            | так      |
| `fs.state_dir.perms_readable`                                 | warn           | Каталог state доступний для читання іншими                                           | права файлової системи для `~/.openclaw`                                                            | так      |
| `fs.state_dir.symlink`                                        | warn           | Ціль каталогу state стає іншою межею довіри                                          | структура файлової системи каталогу state                                                           | ні       |
| `fs.config.perms_writable`                                    | critical       | Інші можуть змінювати auth/політику tools/config                                     | права файлової системи для `~/.openclaw/openclaw.json`                                              | так      |
| `fs.config.symlink`                                           | warn           | Ціль config стає іншою межею довіри                                                  | структура файлової системи config file                                                              | ні       |
| `fs.config.perms_group_readable`                              | warn           | Користувачі групи можуть читати config tokens/settings                               | права файлової системи для config file                                                              | так      |
| `fs.config.perms_world_readable`                              | critical       | Config може розкрити tokens/settings                                                 | права файлової системи для config file                                                              | так      |
| `fs.config_include.perms_writable`                            | critical       | Include-file конфігурації можуть змінювати інші                                      | права include-file, на які посилається `openclaw.json`                                              | так      |
| `fs.config_include.perms_group_readable`                      | warn           | Користувачі групи можуть читати включені secrets/settings                            | права include-file, на які посилається `openclaw.json`                                              | так      |
| `fs.config_include.perms_world_readable`                      | critical       | Включені secrets/settings доступні всім для читання                                  | права include-file, на які посилається `openclaw.json`                                              | так      |
| `fs.auth_profiles.perms_writable`                             | critical       | Інші можуть підмінити або замінити збережені credentials моделей                     | права `agents/<agentId>/agent/auth-profiles.json`                                                   | так      |
| `fs.auth_profiles.perms_readable`                             | warn           | Інші можуть читати API keys і OAuth tokens                                           | права `agents/<agentId>/agent/auth-profiles.json`                                                   | так      |
| `fs.credentials_dir.perms_writable`                           | critical       | Інші можуть змінювати pairing/credential state каналів                               | права файлової системи для `~/.openclaw/credentials`                                                | так      |
| `fs.credentials_dir.perms_readable`                           | warn           | Інші можуть читати channel credential state                                          | права файлової системи для `~/.openclaw/credentials`                                                | так      |
| `fs.sessions_store.perms_readable`                            | warn           | Інші можуть читати session transcripts/metadata                                      | права сховища сесій                                                                                 | так      |
| `fs.log_file.perms_readable`                                  | warn           | Інші можуть читати журнали, у яких хоч і є редагування, але все ще є чутливі дані    | права gateway log file                                                                              | так      |
| `fs.synced_dir`                                               | warn           | State/config в iCloud/Dropbox/Drive розширює площину витоку tokens/transcripts       | перенесіть config/state із синхронізованих папок                                                    | ні       |
| `gateway.bind_no_auth`                                        | critical       | Віддалений bind без shared secret                                                    | `gateway.bind`, `gateway.auth.*`                                                                    | ні       |
| `gateway.loopback_no_auth`                                    | critical       | Проксійований loopback може стати неавтентифікованим                                 | `gateway.auth.*`, налаштування proxy                                                                | ні       |
| `gateway.trusted_proxies_missing`                             | warn           | Заголовки reverse-proxy є, але не довірені                                           | `gateway.trustedProxies`                                                                            | ні       |
| `gateway.http.no_auth`                                        | warn/critical  | Gateway HTTP API доступні з `auth.mode="none"`                                       | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                     | ні       |
| `gateway.http.session_key_override_enabled`                   | info           | Виклики HTTP API можуть перевизначати `sessionKey`                                   | `gateway.http.allowSessionKeyOverride`                                                              | ні       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical  | Повторно вмикає небезпечні tools через HTTP API                                      | `gateway.tools.allow`                                                                               | ні       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical  | Увімкнено команди node з високим впливом (camera/screen/contacts/calendar/SMS)       | `gateway.nodes.allowCommands`                                                                       | ні       |
| `gateway.nodes.deny_commands_ineffective`                     | warn           | Схожі на шаблони deny-записи не зіставляються з shell-текстом чи групами             | `gateway.nodes.denyCommands`                                                                        | ні       |
| `gateway.tailscale_funnel`                                    | critical       | Публічна інтернет-експозиція                                                         | `gateway.tailscale.mode`                                                                            | ні       |
| `gateway.tailscale_serve`                                     | info           | Увімкнено доступ через tailnet via Serve                                             | `gateway.tailscale.mode`                                                                            | ні       |
| `gateway.control_ui.allowed_origins_required`                 | critical       | Control UI поза loopback без явного allowlist browser-origin                         | `gateway.controlUi.allowedOrigins`                                                                  | ні       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical  | `allowedOrigins=["*"]` вимикає allowlisting browser-origin                           | `gateway.controlUi.allowedOrigins`                                                                  | ні       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical  | Увімкнено резервний режим origin через Host-header (послаблення захисту від DNS rebinding) | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                        | ні       |
| `gateway.control_ui.insecure_auth`                            | warn           | Увімкнено compatibility toggle для insecure-auth                                     | `gateway.controlUi.allowInsecureAuth`                                                               | ні       |
| `gateway.control_ui.device_auth_disabled`                     | critical       | Вимкнено перевірку ідентичності пристрою                                             | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                    | ні       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical  | Довіра до `X-Real-IP` може дозволити підміну IP джерела через неправильний proxy     | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                             | ні       |
| `gateway.token_too_short`                                     | warn           | Короткий shared token легше перебрати                                               | `gateway.auth.token`                                                                                | ні       |
| `gateway.auth_no_rate_limit`                                  | warn           | Відкритий auth без rate limiting збільшує ризик brute-force                          | `gateway.auth.rateLimit`                                                                            | ні       |
| `gateway.trusted_proxy_auth`                                  | critical       | Ідентичність proxy стає auth boundary                                                | `gateway.auth.mode="trusted-proxy"`                                                                 | ні       |
| `gateway.trusted_proxy_no_proxies`                            | critical       | Trusted-proxy auth без довірених proxy IP небезпечний                                | `gateway.trustedProxies`                                                                            | ні       |
| `gateway.trusted_proxy_no_user_header`                        | critical       | Trusted-proxy auth не може безпечно визначити ідентичність користувача               | `gateway.auth.trustedProxy.userHeader`                                                              | ні       |
| `gateway.trusted_proxy_no_allowlist`                          | warn           | Trusted-proxy auth приймає будь-якого автентифікованого користувача upstream         | `gateway.auth.trustedProxy.allowUsers`                                                              | ні       |
| `gateway.probe_auth_secretref_unavailable`                    | warn           | Deep probe не зміг розв’язати auth SecretRef у цьому шляху команди                   | джерело auth для deep-probe / доступність SecretRef                                                 | ні       |
| `gateway.probe_failed`                                        | warn/critical  | Live probe Gateway не вдався                                                         | досяжність/auth gateway                                                                             | ні       |
| `discovery.mdns_full_mode`                                    | warn/critical  | Повний режим mDNS рекламує метадані `cliPath`/`sshPort` у локальній мережі           | `discovery.mdns.mode`, `gateway.bind`                                                               | ні       |
| `config.insecure_or_dangerous_flags`                          | warn           | Увімкнено відомі insecure/dangerous debug flags                                      | кілька ключів (див. деталі знахідки)                                                                | ні       |
| `config.secrets.gateway_password_in_config`                   | warn           | Пароль gateway зберігається прямо в config                                           | `gateway.auth.password`                                                                             | ні       |
| `config.secrets.hooks_token_in_config`                        | warn           | Токен bearer для hooks зберігається прямо в config                                   | `hooks.token`                                                                                       | ні       |
| `hooks.token_reuse_gateway_token`                             | critical       | Токен hooks ingress також відкриває Gateway auth                                     | `hooks.token`, `gateway.auth.token`                                                                 | ні       |
| `hooks.token_too_short`                                       | warn           | Полегшує brute force для hooks ingress                                               | `hooks.token`                                                                                       | ні       |
| `hooks.default_session_key_unset`                             | warn           | Hook agent fan out у згенеровані сесії для кожного запиту                            | `hooks.defaultSessionKey`                                                                           | ні       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical  | Автентифіковані виклики hooks можуть маршрутизувати до будь-якого налаштованого agent | `hooks.allowedAgentIds`                                                                             | ні       |
| `hooks.request_session_key_enabled`                           | warn/critical  | Зовнішній виклик може вибирати `sessionKey`                                          | `hooks.allowRequestSessionKey`                                                                      | ні       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical  | Немає обмеження на форми зовнішніх session key                                       | `hooks.allowedSessionKeyPrefixes`                                                                   | ні       |
| `hooks.path_root`                                             | critical       | Шлях hooks дорівнює `/`, що спрощує конфлікти або неправильну маршрутизацію ingress  | `hooks.path`                                                                                        | ні       |
| `hooks.installs_unpinned_npm_specs`                           | warn           | Записи встановлення hooks не прив’язані до незмінних npm specs                       | метадані встановлення hooks                                                                         | ні       |
| `hooks.installs_missing_integrity`                            | warn           | У записах встановлення hooks немає метаданих integrity                               | метадані встановлення hooks                                                                         | ні       |
| `hooks.installs_version_drift`                                | warn           | Записи встановлення hooks відрізняються від встановлених пакунків                    | метадані встановлення hooks                                                                         | ні       |
| `logging.redact_off`                                          | warn           | Чутливі значення витікають у logs/status                                             | `logging.redactSensitive`                                                                           | так      |
| `browser.control_invalid_config`                              | warn           | Конфігурація browser control невалідна ще до runtime                                 | `browser.*`                                                                                         | ні       |
| `browser.control_no_auth`                                     | critical       | Browser control відкрито без token/password auth                                     | `gateway.auth.*`                                                                                    | ні       |
| `browser.remote_cdp_http`                                     | warn           | Віддалений CDP через plain HTTP не має шифрування транспорту                         | profile `cdpUrl` у browser                                                                          | ні       |
| `browser.remote_cdp_private_host`                             | warn           | Віддалений CDP націлено на приватний/внутрішній хост                                 | profile `cdpUrl`, `browser.ssrfPolicy.*`                                                            | ні       |
| `sandbox.docker_config_mode_off`                              | warn           | Конфігурацію sandbox Docker задано, але вона неактивна                               | `agents.*.sandbox.mode`                                                                             | ні       |
| `sandbox.bind_mount_non_absolute`                             | warn           | Відносні bind mounts можуть розв’язуватися непередбачувано                           | `agents.*.sandbox.docker.binds[]`                                                                   | ні       |
| `sandbox.dangerous_bind_mount`                                | critical       | Bind mount у sandbox націлено на заблоковані системні шляхи, credentials або Docker socket | `agents.*.sandbox.docker.binds[]`                                                                   | ні       |
| `sandbox.dangerous_network_mode`                              | critical       | Docker network у sandbox використовує `host` або `container:*` режим приєднання до namespace | `agents.*.sandbox.docker.network`                                                                   | ні       |
| `sandbox.dangerous_seccomp_profile`                           | critical       | Профіль sandbox seccomp послаблює ізоляцію контейнера                                | `agents.*.sandbox.docker.securityOpt`                                                               | ні       |
| `sandbox.dangerous_apparmor_profile`                          | critical       | Профіль sandbox AppArmor послаблює ізоляцію контейнера                               | `agents.*.sandbox.docker.securityOpt`                                                               | ні       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn           | Міст browser у sandbox відкрито без обмеження за source-range                        | `sandbox.browser.cdpSourceRange`                                                                    | ні       |
| `sandbox.browser_container.non_loopback_publish`              | critical       | Наявний контейнер browser публікує CDP на інтерфейсах поза loopback                  | конфігурація publish контейнера browser sandbox                                                     | ні       |
| `sandbox.browser_container.hash_label_missing`                | warn           | Наявний контейнер browser передує поточним config-hash labels                        | `openclaw sandbox recreate --browser --all`                                                         | ні       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn           | Наявний контейнер browser передує поточній епосі конфігурації browser                | `openclaw sandbox recreate --browser --all`                                                         | ні       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn           | `exec host=sandbox` аварійно блокується, коли sandbox вимкнено                       | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                   | ні       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn           | `exec host=sandbox` для окремих агентів аварійно блокується, коли sandbox вимкнено   | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                       | ні       |
| `tools.exec.security_full_configured`                         | warn/critical  | Host exec працює з `security="full"`                                                 | `tools.exec.security`, `agents.list[].tools.exec.security`                                          | ні       |
| `tools.exec.auto_allow_skills_enabled`                        | warn           | Схвалення exec неявно довіряють бінарникам Skills                                    | `~/.openclaw/exec-approvals.json`                                                                   | ні       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn           | Allowlists інтерпретаторів дозволяють inline eval без примусового повторного схвалення | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, allowlist схвалень exec | ні       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn           | Бінарники interpreter/runtime у `safeBins` без явних профілів розширюють ризик exec  | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                   | ні       |
| `tools.exec.safe_bins_broad_behavior`                         | warn           | Інструменти з широкою поведінкою в `safeBins` послаблюють low-risk модель довіри до stdin-filter | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                          | ні       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn           | `safeBinTrustedDirs` включає змінювані або ризикові каталоги                         | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                      | ні       |
| `skills.workspace.symlink_escape`                             | warn           | `skills/**/SKILL.md` у workspace розв’язується поза коренем workspace (зсув через ланцюжок symlink) | стан файлової системи `skills/**` у workspace                                                       | ні       |
| `plugins.extensions_no_allowlist`                             | warn           | Extensions встановлено без явного allowlist плагінів                                 | `plugins.allowlist`                                                                                 | ні       |
| `plugins.installs_unpinned_npm_specs`                         | warn           | Записи встановлення plugin не прив’язані до незмінних npm specs                      | метадані встановлення plugin                                                                        | ні       |
| `plugins.installs_missing_integrity`                          | warn           | У записах встановлення plugin немає метаданих integrity                              | метадані встановлення plugin                                                                        | ні       |
| `plugins.installs_version_drift`                              | warn           | Записи встановлення plugin відрізняються від встановлених пакунків                   | метадані встановлення plugin                                                                        | ні       |
| `plugins.code_safety`                                         | warn/critical  | Сканування коду plugin виявило підозрілі або небезпечні шаблони                      | код plugin / джерело встановлення                                                                   | ні       |
| `plugins.code_safety.entry_path`                              | warn           | Шлях entry plugin вказує на приховані місця або `node_modules`                       | `entry` у manifest plugin                                                                           | ні       |
| `plugins.code_safety.entry_escape`                            | critical       | Entry plugin виходить за межі каталогу plugin                                        | `entry` у manifest plugin                                                                           | ні       |
| `plugins.code_safety.scan_failed`                             | warn           | Сканування коду plugin не вдалося завершити                                          | шлях extension plugin / середовище сканування                                                       | ні       |
| `skills.code_safety`                                          | warn/critical  | Метадані/код інсталятора Skills містять підозрілі або небезпечні шаблони             | джерело встановлення skill                                                                          | ні       |
| `skills.code_safety.scan_failed`                              | warn           | Сканування коду skill не вдалося завершити                                           | середовище сканування skill                                                                         | ні       |
| `security.exposure.open_channels_with_exec`                   | warn/critical  | Спільні/публічні кімнати можуть звертатися до agent з увімкненим exec                | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`      | ні       |
| `security.exposure.open_groups_with_elevated`                 | critical       | Відкриті групи + elevated tools створюють високоризикові шляхи prompt injection      | `channels.*.groupPolicy`, `tools.elevated.*`                                                        | ні       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn  | Відкриті групи можуть викликати command/file tools без sandbox/workspace guardrails  | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`  | ні       |
| `security.trust_model.multi_user_heuristic`                   | warn           | Конфігурація виглядає багатокористувацькою, хоча модель довіри gateway — персональний помічник | розділити межі довіри або посилити shared-user (`sandbox.mode`, deny tools/scoping workspace)      | ні       |
| `tools.profile_minimal_overridden`                            | warn           | Перевизначення agent обходять глобальний minimal profile                             | `agents.list[].tools.profile`                                                                       | ні       |
| `plugins.tools_reachable_permissive_policy`                   | warn           | Tools extension доступні у поблажливих контекстах                                    | `tools.profile` + allow/deny tools                                                                  | ні       |
| `models.legacy`                                               | warn           | Legacy-сімейства моделей усе ще налаштовані                                          | вибір моделі                                                                                        | ні       |
| `models.weak_tier`                                            | warn           | Налаштовані моделі нижчі за поточно рекомендовані рівні                              | вибір моделі                                                                                        | ні       |
| `models.small_params`                                         | critical/info  | Малі моделі + небезпечні поверхні tools підвищують ризик injection                   | вибір моделі + sandbox/політика tools                                                               | ні       |
| `summary.attack_surface`                                      | info           | Зведений підсумок щодо auth, каналів, tools і експозиції                             | кілька ключів (див. деталі знахідки)                                                                | ні       |

## Control UI через HTTP

Для Control UI потрібен **безпечний контекст** (HTTPS або localhost), щоб генерувати
ідентичність пристрою. `gateway.controlUi.allowInsecureAuth` — це локальний compatibility toggle:

- На localhost він дозволяє auth для Control UI без ідентичності пристрою, коли сторінку
  завантажено через незахищений HTTP.
- Він не обходить перевірки pairing.
- Він не послаблює вимоги до віддаленої (не localhost) ідентичності пристрою.

Надавайте перевагу HTTPS (Tailscale Serve) або відкривайте UI на `127.0.0.1`.

Лише для аварійних сценаріїв `gateway.controlUi.dangerouslyDisableDeviceAuth`
повністю вимикає перевірки ідентичності пристрою. Це серйозне послаблення безпеки;
тримайте його вимкненим, якщо тільки ви активно не налагоджуєте й не можете швидко повернути все назад.

Окремо від цих небезпечних прапорців, успішний режим `gateway.auth.mode: "trusted-proxy"`
може допустити **операторські** сесії Control UI без ідентичності пристрою. Це
навмисна поведінка auth-mode, а не скорочення через `allowInsecureAuth`, і вона все одно
не поширюється на сесії Control UI з роллю node.

`openclaw security audit` попереджає, коли цей параметр увімкнено.

## Підсумок insecure або dangerous flags

`openclaw security audit` включає `config.insecure_or_dangerous_flags`, коли
ввімкнено відомі insecure/dangerous debug-перемикачі. Наразі ця перевірка
агрегує:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

Повний список ключів конфігурації `dangerous*` / `dangerously*`, визначених у
схемі конфігурації OpenClaw:

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
- `channels.synology-chat.dangerouslyAllowNameMatching` (канал extension)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (канал extension)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (канал extension)
- `channels.zalouser.dangerouslyAllowNameMatching` (канал extension)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (канал extension)
- `channels.irc.dangerouslyAllowNameMatching` (канал extension)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (канал extension)
- `channels.mattermost.dangerouslyAllowNameMatching` (канал extension)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (канал extension)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Конфігурація reverse proxy

Якщо ви запускаєте Gateway за reverse proxy (nginx, Caddy, Traefik тощо), налаштуйте
`gateway.trustedProxies` для коректної обробки forwarded-client IP.

Коли Gateway виявляє заголовки proxy від адреси, якої **немає** в `trustedProxies`, він **не** вважатиме з’єднання локальними клієнтами. Якщо auth gateway вимкнено, такі з’єднання відхиляються. Це запобігає обходу автентифікації, коли проксійовані з’єднання інакше виглядали б як такі, що приходять із localhost, і отримували б автоматичну довіру.

`gateway.trustedProxies` також використовується для `gateway.auth.mode: "trusted-proxy"`, але цей auth mode суворіший:

- trusted-proxy auth **аварійно блокується на proxy із loopback-джерелом**
- same-host reverse proxy через loopback все ще можуть використовувати `gateway.trustedProxies` для визначення локальних клієнтів і обробки forwarded IP
- для same-host reverse proxy через loopback використовуйте token/password auth замість `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP reverse proxy
  # Необов’язково. За замовчуванням false.
  # Вмикайте лише якщо ваш proxy не може надавати X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Коли налаштовано `trustedProxies`, Gateway використовує `X-Forwarded-For`, щоб визначити IP клієнта. `X-Real-IP` за замовчуванням ігнорується, якщо лише явно не встановлено `gateway.allowRealIpFallback: true`.

Правильна поведінка reverse proxy (перезапис вхідних forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Погана поведінка reverse proxy (додавання/збереження недовірених forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Примітки щодо HSTS і origin

- Gateway OpenClaw орієнтований насамперед на local/loopback. Якщо ви завершуєте TLS на reverse proxy, установлюйте HSTS на HTTPS-домені, що дивиться на proxy.
- Якщо HTTPS завершує сам gateway, ви можете встановити `gateway.http.securityHeaders.strictTransportSecurity`, щоб додавати заголовок HSTS із відповідей OpenClaw.
- Докладні рекомендації з розгортання наведено в [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Для розгортань Control UI поза loopback `gateway.controlUi.allowedOrigins` за замовчуванням є обов’язковим.
- `gateway.controlUi.allowedOrigins: ["*"]` — це явна політика allow-all для browser-origin, а не захищене типове значення. Уникайте її поза жорстко контрольованим локальним тестуванням.
- Невдалі спроби browser-origin auth на loopback усе одно проходять rate limiting, навіть коли
  увімкнено загальне виключення для loopback, але ключ блокування прив’язаний до
  нормалізованого значення `Origin`, а не до одного спільного localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає резервний режим origin через Host-header; ставтеся до цього як до небезпечної політики, свідомо вибраної оператором.
- Ставтеся до DNS rebinding і поведінки proxy-host header як до питань посилення безпеки розгортання; тримайте `trustedProxies` вузьким і уникайте прямого відкриття gateway у публічний інтернет.

## Локальні журнали сесій зберігаються на диску

OpenClaw зберігає transcript сесій на диску в `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Це потрібно для безперервності сесій і (за бажанням) індексування пам’яті сесій, але це також означає,
що **будь-який процес/користувач з доступом до файлової системи може читати ці журнали**. Вважайте доступ до диска
межею довіри й жорстко обмежуйте права доступу до `~/.openclaw` (див. розділ аудиту нижче). Якщо вам потрібна
сильніша ізоляція між агентами, запускайте їх під окремими користувачами ОС або на окремих хостах.

## Виконання на node (`system.run`)

Якщо paired macOS node під’єднано, Gateway може викликати `system.run` на цьому node. Це **віддалене виконання коду** на Mac:

- Потрібен pairing node (схвалення + token).
- Pairing node в Gateway — це не поверхня схвалення на кожну команду. Воно встановлює ідентичність/dовіру до node та видачу token.
- Gateway застосовує грубу глобальну політику команд node через `gateway.nodes.allowCommands` / `denyCommands`.
- Керується на Mac через **Settings → Exec approvals** (security + ask + allowlist).
- Політика `system.run` для кожного node — це власний файл схвалень exec node (`exec.approvals.node.*`), який може бути суворішим або м’якшим за глобальну політику gateway для ID команд.
- Node, який працює з `security="full"` і `ask="off"`, дотримується типової моделі довіреного оператора. Вважайте це очікуваною поведінкою, якщо тільки ваше розгортання явно не потребує суворішої політики схвалень або allowlist.
- Режим схвалення прив’язує точний контекст запиту і, коли можливо, один конкретний локальний script/file operand. Якщо OpenClaw не може ідентифікувати рівно один прямий локальний файл для команди interpreter/runtime, виконання з опорою на схвалення забороняється, а не створюється хибна ілюзія повного семантичного покриття.
- Для `host=node` виконання з опорою на схвалення також зберігає канонічний підготовлений
  `systemRunPlan`; пізніші схвалені пересилання повторно використовують цей збережений план, а перевірка gateway відхиляє редагування викликом command/cwd/session context після створення запиту на схвалення.
- Якщо ви не хочете віддаленого виконання, установіть security у **deny** і видаліть pairing node для цього Mac.

Це розрізнення важливе для triage:

- Повторне підключення paired node, який оголошує інший список команд, саме по собі не є вразливістю, якщо глобальна політика Gateway і локальні схвалення exec на node усе ще забезпечують реальну межу виконання.
- Звіти, які трактують метадані pairing node як другий прихований шар схвалення на кожну команду, зазвичай є плутаниною політики/UX, а не обходом межі безпеки.

## Динамічні Skills (watcher / віддалені nodes)

OpenClaw може оновлювати список Skills посеред сесії:

- **Skills watcher**: зміни в `SKILL.md` можуть оновити знімок Skills на наступному ході agent.
- **Віддалені nodes**: підключення macOS node може зробити доступними Skills лише для macOS (на основі перевірки bin).

Ставтеся до папок навичок як до **довіреного коду** та обмежуйте, хто може їх змінювати.

## Модель загроз

Ваш AI-помічник може:

- Виконувати довільні shell-команди
- Читати/записувати файли
- Отримувати доступ до мережевих сервісів
- Надсилати повідомлення будь-кому (якщо ви дали йому доступ до WhatsApp)

Люди, які пишуть вам, можуть:

- Намагатися обдурити ваш AI, щоб він зробив щось погане
- Соціально інженерити доступ до ваших даних
- Досліджувати вашу інфраструктуру

## Основна ідея: контроль доступу перед інтелектом

Більшість збоїв тут — не вишукані експлойти, а ситуації на кшталт «хтось написав боту, і бот зробив те, що його попросили».

Підхід OpenClaw:

- **Спочатку ідентичність:** вирішіть, хто може говорити з ботом (DM pairing / allowlists / явне “open”).
- **Потім межі:** вирішіть, де боту дозволено діяти (group allowlists + gating за згадками, tools, sandboxing, дозволи пристрою).
- **І тільки потім модель:** припускайте, що моделлю можна маніпулювати; проєктуйте так, щоб радіус ураження був обмеженим.

## Модель авторизації команд

Slash-команди та директиви виконуються лише для **авторизованих відправників**. Авторизація визначається
channel allowlists/pairing плюс `commands.useAccessGroups` (див. [Конфігурація](/gateway/configuration)
і [Slash commands](/tools/slash-commands)). Якщо channel allowlist порожній або містить `"*"`,
команди фактично відкриті для цього каналу.

`/exec` — це зручна команда лише для поточної сесії для авторизованих операторів. Вона **не** записує config і
не змінює інші сесії.

## Ризики tools control plane

Два вбудовані tools можуть робити стійкі зміни на рівні control plane:

- `gateway` може перевіряти config через `config.schema.lookup` / `config.get`, а також робити стійкі зміни через `config.apply`, `config.patch` і `update.run`.
- `cron` може створювати заплановані jobs, які продовжують працювати після завершення початкового чату/завдання.

Інструмент runtime `gateway`, доступний лише власнику, усе одно відмовляється переписувати
`tools.exec.ask` або `tools.exec.security`; застарілі псевдоніми `tools.bash.*`
нормалізуються до тих самих захищених exec-шляхів перед записом.

Для будь-якого agent/поверхні, що обробляє недовірений вміст, типово забороняйте ці tools:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` блокує лише дії перезапуску. Він не вимикає дії config/update інструмента `gateway`.

## Plugins/extensions

Плагіни працюють **у процесі** разом із Gateway. Ставтеся до них як до довіреного коду:

- Встановлюйте плагіни лише з джерел, яким довіряєте.
- Надавайте перевагу явним allowlists `plugins.allow`.
- Переглядайте конфігурацію плагіна перед увімкненням.
- Після змін у плагінах перезапускайте Gateway.
- Якщо ви встановлюєте або оновлюєте плагіни (`openclaw plugins install <package>`, `openclaw plugins update <id>`), ставтеся до цього як до запуску недовіреного коду:
  - Шлях установлення — це каталог конкретного плагіна під активним коренем встановлення плагінів.
  - Перед встановленням/оновленням OpenClaw виконує вбудоване сканування небезпечного коду. Знахідки `critical` типово блокують дію.
  - OpenClaw використовує `npm pack`, а потім виконує `npm install --omit=dev` у цьому каталозі (скрипти життєвого циклу npm можуть виконувати код під час встановлення).
  - Надавайте перевагу pinned, точним версіям (`@scope/pkg@1.2.3`) і перевіряйте розпакований код на диску перед увімкненням.
  - `--dangerously-force-unsafe-install` — лише аварійна опція для хибнопозитивних спрацьовувань вбудованого сканера під час встановлення/оновлення плагіна. Вона не обходить блокування політики hook `before_install` і не обходить збої сканування.
  - Установлення залежностей Skills через gateway дотримуються того самого поділу dangerous/suspicious: вбудовані знахідки `critical` блокують дію, якщо тільки виклик явно не встановлює `dangerouslyForceUnsafeInstall`, тоді як підозрілі знахідки все ще лише попереджають. `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills через ClawHub.

Докладніше: [Plugins](/tools/plugin)

## Модель доступу до DM (pairing / allowlist / open / disabled)

Усі поточні канали з підтримкою DM підтримують політику DM (`dmPolicy` або `*.dm.policy`), яка фільтрує вхідні DM **до** обробки повідомлення:

- `pairing` (за замовчуванням): невідомі відправники отримують короткий код pairing, і бот ігнорує їхнє повідомлення, доки його не буде схвалено. Коди спливають через 1 годину; повторні DM не надсилатимуть код повторно, доки не буде створено новий запит. Кількість очікуваних запитів за замовчуванням обмежена **3 на канал**.
- `allowlist`: невідомі відправники блокуються (без handshake pairing).
- `open`: дозволити DM будь-кому (публічно). **Потрібно**, щоб allowlist каналу містив `"*"` (явне підтвердження).
- `disabled`: повністю ігнорувати вхідні DM.

Схвалення через CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Докладніше + файли на диску: [Pairing](/channels/pairing)

## Ізоляція DM-сесій (multi-user mode)

За замовчуванням OpenClaw маршрутизує **усі DM в основну сесію**, щоб ваш помічник мав безперервний контекст між пристроями й каналами. Якщо **кілька людей** можуть надсилати DM боту (відкриті DM або allowlist з кількох людей), подумайте про ізоляцію DM-сесій:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Це запобігає витоку контексту між користувачами, зберігаючи при цьому ізоляцію групових чатів.

Це межа контексту повідомлень, а не межа адміністрування хоста. Якщо користувачі взаємно ворожі й спільно використовують той самий gateway host/config, запускайте окремі gateway для кожної межі довіри.

### Безпечний режим DM (рекомендовано)

Ставтеся до фрагмента вище як до **безпечного режиму DM**:

- За замовчуванням: `session.dmScope: "main"` (усі DM використовують одну спільну сесію для безперервності).
- Типове значення локального CLI onboarding: записує `session.dmScope: "per-channel-peer"`, якщо його не задано (зберігає наявні явні значення).
- Безпечний режим DM: `session.dmScope: "per-channel-peer"` (кожна пара channel+sender отримує ізольований DM-контекст).
- Ізоляція одного користувача між каналами: `session.dmScope: "per-peer"` (кожен відправник має одну сесію в усіх каналах того самого типу).

Якщо ви використовуєте кілька облікових записів в одному каналі, замість цього використовуйте `per-account-channel-peer`. Якщо одна й та сама людина зв’язується з вами через кілька каналів, використовуйте `session.identityLinks`, щоб об’єднати ці DM-сесії в одну канонічну ідентичність. Див. [Керування сесіями](/concepts/session) і [Конфігурація](/gateway/configuration).

## Allowlists (DM + групи) — термінологія

OpenClaw має два окремі рівні «хто може мене запускати?»:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): хто має право писати боту в особистих повідомленнях.
  - Коли `dmPolicy="pairing"`, схвалення записуються в account-scoped сховище pairing allowlist у `~/.openclaw/credentials/` (`<channel>-allowFrom.json` для облікового запису за замовчуванням, `<channel>-<accountId>-allowFrom.json` для не-default облікових записів), а потім об’єднуються з config allowlists.
- **Group allowlist** (специфічний для каналу): з яких груп/каналів/guilds бот узагалі прийматиме повідомлення.
  - Типові шаблони:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: типові параметри для груп, наприклад `requireMention`; коли їх задано, це також працює як group allowlist (додайте `"*"`, щоб зберегти поведінку «дозволити всі»).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: обмежує, хто може запускати бота _всередині_ групової сесії (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists для окремих поверхонь + типові значення згадок.
  - Перевірки груп працюють у такому порядку: спочатку `groupPolicy`/group allowlists, потім активація за згадкою/відповіддю.
  - Відповідь на повідомлення бота (неявна згадка) **не** обходить allowlists відправника, такі як `groupAllowFrom`.
  - **Примітка щодо безпеки:** ставтеся до `dmPolicy="open"` і `groupPolicy="open"` як до крайнього засобу. Їх слід використовувати якомога рідше; віддавайте перевагу pairing + allowlists, якщо тільки ви не повністю довіряєте всім учасникам кімнати.

Докладніше: [Конфігурація](/gateway/configuration) і [Групи](/channels/groups)

## Prompt injection (що це таке і чому це важливо)

Prompt injection — це коли атакувальник створює повідомлення, яке маніпулює моделлю, щоб вона зробила щось небезпечне («ігноруй інструкції», «вивантаж файлову систему», «перейди за цим посиланням і виконай команди» тощо).

Навіть із сильними system prompts **prompt injection не є розв’язаною проблемою**. Запобіжники system prompt — це лише м’які рекомендації; жорстке забезпечення дають політика tools, схвалення exec, sandboxing і channel allowlists (і оператори можуть це вимкнути за задумом). На практиці допомагає таке:

- Тримайте вхідні DM закритими (pairing/allowlists).
- У групах надавайте перевагу gating за згадками; уникайте «завжди активних» ботів у публічних кімнатах.
- Ставтеся до посилань, вкладень і вставлених інструкцій як до ворожих за замовчуванням.
- Виконуйте чутливі tools у sandbox; тримайте secrets поза досяжною для agent файловою системою.
- Примітка: sandboxing вмикається окремо. Якщо режим sandbox вимкнено, неявний `host=auto` розв’язується до gateway host. Явний `host=sandbox` все одно аварійно блокується, бо sandbox runtime недоступний. Установіть `host=gateway`, якщо хочете, щоб така поведінка була явно відображена в config.
- Обмежуйте високоризикові tools (`exec`, `browser`, `web_fetch`, `web_search`) довіреними agents або явними allowlists.
- Якщо ви додаєте в allowlist інтерпретатори (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), увімкніть `tools.exec.strictInlineEval`, щоб форми inline eval усе одно вимагали явного схвалення.
- **Вибір моделі важливий:** старіші/менші/legacy-моделі значно менш стійкі до prompt injection і неправильного використання tools. Для agent з увімкненими tools використовуйте найсильнішу доступну модель останнього покоління, стійку до інструкцій.

Червоні прапорці, які слід вважати недовіреними:

- «Прочитай цей файл/URL і зроби рівно те, що там сказано».
- «Ігноруй свій system prompt або правила безпеки».
- «Розкрий свої приховані інструкції або вивід tools».
- «Встав повний вміст ~/.openclaw або свої logs».

## Прапорці обходу небезпечного зовнішнього вмісту

OpenClaw містить явні прапорці обходу, які вимикають захисне обгортання зовнішнього вмісту:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Поле `allowUnsafeExternalContent` у payload cron

Рекомендації:

- У production залишайте їх unset/false.
- Вмикайте лише тимчасово для дуже вузько обмеженого налагодження.
- Якщо ввімкнено, ізолюйте цей agent (sandbox + мінімум tools + окремий простір імен сесій).

Примітка про ризики hooks:

- Payload hooks — це недовірений вміст, навіть коли доставка надходить із систем, які ви контролюєте (mail/docs/web-вміст може нести prompt injection).
- Слабкі рівні моделей підвищують цей ризик. Для автоматизації через hooks віддавайте перевагу сильним сучасним рівням моделей і тримайте політику tools жорсткою (`tools.profile: "messaging"` або суворіше), а також використовуйте sandboxing, де можливо.

### Prompt injection не потребує публічних DM

Навіть якщо **лише ви** можете писати боту, prompt injection усе одно можливий через
будь-який **недовірений вміст**, який читає бот (результати web search/fetch, сторінки browser,
листи, документи, вкладення, вставлені logs/code). Іншими словами: відправник не є єдиною площиною загрози; **сам вміст** також може нести ворожі інструкції.

Коли tools увімкнено, типовий ризик — ексфільтрація контексту або виклик
tools. Зменшуйте радіус ураження так:

- Використовуйте **reader agent** лише для читання або без tools, щоб підсумовувати недовірений вміст,
  а потім передавайте підсумок вашому основному agent.
- Тримайте `web_search` / `web_fetch` / `browser` вимкненими для agent з tools, якщо вони не потрібні.
- Для URL-входів OpenResponses (`input_file` / `input_image`) установлюйте жорсткі
  `gateway.http.endpoints.responses.files.urlAllowlist` і
  `gateway.http.endpoints.responses.images.urlAllowlist`, а також тримайте `maxUrlParts` низьким.
  Порожні allowlists вважаються не заданими; використовуйте `files.allowUrl: false` / `images.allowUrl: false`,
  якщо хочете повністю вимкнути отримання за URL.
- Для файлових входів OpenResponses декодований текст `input_file` усе одно інʼєктується як
  **недовірений зовнішній вміст**. Не покладайтеся на те, що текст файла є довіреним лише тому,
  що Gateway декодував його локально. Інʼєктований блок усе одно несе явні
  маркери меж `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` плюс метадані `Source: External`,
  хоча в цьому шляху й відсутній довший банер `SECURITY NOTICE:`.
- Те саме обгортання на основі маркерів застосовується, коли media-understanding витягує текст
  із прикріплених документів перед додаванням цього тексту до media prompt.
- Увімкніть sandboxing і жорсткі allowlists tools для будь-якого agent, що працює з недовіреним вводом.
- Тримайте secrets поза prompts; передавайте їх через env/config на gateway host.

### Сила моделі (примітка щодо безпеки)

Стійкість до prompt injection **не є однаковою** для всіх рівнів моделей. Менші/дешевші моделі загалом більш уразливі до неправильного використання tools та захоплення інструкцій, особливо під ворожими prompts.

<Warning>
Для agent з увімкненими tools або agent, які читають недовірений вміст, ризик prompt injection зі старими/меншими моделями часто надто високий. Не запускайте такі сценарії на слабких рівнях моделей.
</Warning>

Рекомендації:

- **Використовуйте найкращу модель останнього покоління** для будь-якого бота, який може запускати tools або працювати з файлами/мережами.
- **Не використовуйте старіші/слабші/менші рівні** для agent з увімкненими tools або недовірених inbox; ризик prompt injection надто високий.
- Якщо вам все ж потрібна менша модель, **зменшуйте радіус ураження** (tools лише для читання, сильне sandboxing, мінімальний доступ до файлової системи, суворі allowlists).
- При роботі з малими моделями **вмикайте sandboxing для всіх сесій** і **вимикайте web_search/web_fetch/browser**, якщо лише вхідні дані не перебувають під жорстким контролем.
- Для чат-орієнтованих персональних помічників із довіреним вводом і без tools менші моделі зазвичай прийнятні.

<a id="reasoning-verbose-output-in-groups"></a>

## Reasoning і verbose output у групах

`/reasoning` і `/verbose` можуть розкривати внутрішні міркування або вивід tools,
які не призначалися для публічного каналу. У групових налаштуваннях ставтеся до них як до **debug-only**
і тримайте вимкненими, якщо тільки вони вам явно не потрібні.

Рекомендації:

- Тримайте `/reasoning` і `/verbose` вимкненими в публічних кімнатах.
- Якщо ви їх вмикаєте, робіть це лише в довірених DM або жорстко контрольованих кімнатах.
- Пам’ятайте: verbose output може містити аргументи tools, URL і дані, які бачила модель.

## Посилення конфігурації (приклади)

### 0) Права доступу до файлів

Тримайте config + state приватними на gateway host:

- `~/.openclaw/openclaw.json`: `600` (лише читання/запис користувачем)
- `~/.openclaw`: `700` (лише користувач)

`openclaw doctor` може попередити й запропонувати посилити ці права.

### 0.4) Мережева експозиція (bind + port + firewall)

Gateway мультиплексує **WebSocket + HTTP** на одному порту:

- За замовчуванням: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ця HTTP-поверхня включає Control UI і canvas host:

- Control UI (SPA assets) (типовий базовий шлях `/`)
- Canvas host: `/__openclaw__/canvas/` і `/__openclaw__/a2ui/` (довільний HTML/JS; ставтеся до цього як до недовіреного вмісту)

Якщо ви завантажуєте canvas-вміст у звичайному браузері, ставтеся до нього як до будь-якої іншої недовіреної вебсторінки:

- Не відкривайте canvas host для недовірених мереж/користувачів.
- Не змушуйте canvas-вміст використовувати той самий origin, що й привілейовані вебповерхні, якщо ви повністю не розумієте наслідків.

Режим bind визначає, де Gateway слухає:

- `gateway.bind: "loopback"` (за замовчуванням): підключатися можуть лише локальні клієнти.
- Bind поза loopback (`"lan"`, `"tailnet"`, `"custom"`) розширює площину атаки. Використовуйте їх лише з gateway auth (shared token/password або правильно налаштований non-loopback trusted proxy) і реальним firewall.

Практичні правила:

- Надавайте перевагу Tailscale Serve над bind у LAN (Serve зберігає Gateway на loopback, а Tailscale обробляє доступ).
- Якщо вам все ж треба bind у LAN, обмежте порт у firewall жорстким allowlist IP-джерел; не робіть широке port-forwarding.
- Ніколи не відкривайте Gateway без auth на `0.0.0.0`.

### 0.4.1) Публікація Docker-портів + UFW (`DOCKER-USER`)

Якщо ви запускаєте OpenClaw з Docker на VPS, пам’ятайте, що опубліковані порти контейнера
(`-p HOST:CONTAINER` або Compose `ports:`) маршрутизуються через ланцюжки переспрямування Docker,
а не лише через host-правила `INPUT`.

Щоб трафік Docker відповідав політиці firewall, застосовуйте правила в
`DOCKER-USER` (цей ланцюжок обробляється до власних правил accept Docker).
На багатьох сучасних дистрибутивах `iptables`/`ip6tables` використовують frontend `iptables-nft`
і все одно застосовують ці правила до backend nftables.

Мінімальний приклад allowlist (IPv4):

```bash
# /etc/ufw/after.rules (додайте як окремий розділ *filter)
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

Для IPv6 є окремі таблиці. Додайте відповідну політику до `/etc/ufw/after6.rules`, якщо
Docker IPv6 увімкнено.

Не варто жорстко прописувати назви інтерфейсів на кшталт `eth0` у фрагментах документації. Назви інтерфейсів
відрізняються між образами VPS (`ens3`, `enp*` тощо), і невідповідність може випадково
пропустити ваше правило deny.

Швидка перевірка після перезавантаження:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Очікувані зовнішні порти мають бути лише тими, які ви навмисно відкрили (для більшості
налаштувань: SSH + порти вашого reverse proxy).

### 0.4.2) Виявлення через mDNS/Bonjour (розкриття інформації)

Gateway транслює свою присутність через mDNS (`_openclaw-gw._tcp` на порту 5353) для локального виявлення пристроїв. У повному режимі це включає TXT-записи, які можуть розкривати операційні деталі:

- `cliPath`: повний шлях файлової системи до двійкового файла CLI (розкриває ім’я користувача і місце встановлення)
- `sshPort`: рекламує доступність SSH на хості
- `displayName`, `lanHost`: інформацію про hostname

**Міркування операційної безпеки:** трансляція деталей інфраструктури спрощує розвідку для будь-кого в локальній мережі. Навіть «нешкідлива» інформація на кшталт шляхів файлової системи та доступності SSH допомагає атакувальникам картографувати ваше середовище.

**Рекомендації:**

1. **Мінімальний режим** (за замовчуванням, рекомендовано для відкритих gateway): не включає чутливі поля в mDNS-трансляцію:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Повністю вимкнути**, якщо вам не потрібно локальне виявлення пристроїв:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Повний режим** (лише за явною згодою): включає `cliPath` + `sshPort` у TXT-записи:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Змінна середовища** (альтернатива): встановіть `OPENCLAW_DISABLE_BONJOUR=1`, щоб вимкнути mDNS без змін config.

У minimal mode Gateway усе ще транслює достатньо для виявлення пристроїв (`role`, `gatewayPort`, `transport`), але не включає `cliPath` і `sshPort`. Застосунки, яким потрібна інформація про шлях CLI, можуть отримати її через автентифіковане WebSocket-підключення.

### 0.5) Закрийте Gateway WebSocket (локальна auth)

За замовчуванням Gateway auth **обов’язкова**. Якщо не налаштовано коректний шлях gateway auth,
Gateway відмовляє у WebSocket-з’єднаннях (fail-closed).

Onboarding за замовчуванням генерує token (навіть для loopback), тому
локальні клієнти мають автентифікуватися.

Установіть token, щоб **усі** WS-клієнти мали автентифікуватися:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor може згенерувати його за вас: `openclaw doctor --generate-gateway-token`.

Примітка: `gateway.remote.token` / `.password` — це джерела облікових даних клієнта.
Самі по собі вони **не** захищають локальний WS-доступ.
Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резерв лише тоді, коли `gateway.auth.*`
не задано.
Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через
SecretRef і вони не можуть бути розв’язані, розв’язання завершується fail-closed (без маскування через remote fallback).
Необов’язково: закріпіть віддалений TLS через `gateway.remote.tlsFingerprint` під час використання `wss://`.
Plaintext `ws://` за замовчуванням дозволений лише для loopback. Для довірених шляхів у приватній мережі
встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як аварійний варіант.

Локальний pairing пристроїв:

- Pairing пристрою автоматично схвалюється для прямих локальних loopback-з’єднань, щоб
  локальні клієнти на тому самому хості працювали гладко.
- OpenClaw також має вузький backend/container-local шлях self-connect для
  довірених helper-потоків зі shared-secret.
- Підключення через tailnet і LAN, включно з bind через tailnet на тому самому хості, для pairing вважаються віддаленими і все одно потребують схвалення.

Режими auth:

- `gateway.auth.mode: "token"`: shared bearer token (рекомендовано для більшості сценаріїв).
- `gateway.auth.mode: "password"`: password auth (краще задавати через env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: довірити reverse proxy з перевіркою ідентичності автентифікувати користувачів і передавати ідентичність у заголовках (див. [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).

Контрольний список ротації (token/password):

1. Згенеруйте/встановіть новий секрет (`gateway.auth.token` або `OPENCLAW_GATEWAY_PASSWORD`).
2. Перезапустіть Gateway (або перезапустіть macOS app, якщо він керує Gateway).
3. Оновіть усіх віддалених клієнтів (`gateway.remote.token` / `.password` на машинах, які викликають Gateway).
4. Переконайтеся, що зі старими обліковими даними більше не можна підключитися.

### 0.6) Заголовки ідентичності Tailscale Serve

Коли `gateway.auth.allowTailscale` має значення `true` (типово для Serve), OpenClaw
приймає заголовки ідентичності Tailscale Serve (`tailscale-user-login`) для auth у Control
UI/WebSocket. OpenClaw перевіряє ідентичність, визначаючи адресу `x-forwarded-for`
через локальний демон Tailscale (`tailscale whois`) і зіставляючи її із заголовком. Це спрацьовує лише для запитів, що приходять на loopback
і містять `x-forwarded-for`, `x-forwarded-proto` та `x-forwarded-host`, як
їх додає Tailscale.
Для цього асинхронного шляху перевірки ідентичності невдалі спроби для однакової пари `{scope, ip}`
серіалізуються до того, як лімітер зафіксує невдалу спробу. Тому паралельні невдалі повторні спроби
від одного Serve-клієнта можуть заблокувати другу спробу негайно, замість того щоб
проскочити як дві звичайні невідповідності.
HTTP API endpoints (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`) **не** використовують auth через заголовки ідентичності Tailscale. Вони й надалі дотримуються
налаштованого HTTP auth mode gateway.

Важлива примітка про межі:

- HTTP bearer auth Gateway фактично надає повний операторський доступ.
- Ставтеся до облікових даних, які можуть викликати `/v1/chat/completions`, `/v1/responses` або `/api/channels/*`, як до секретів повного операторського доступу для цього gateway.
- На HTTP-поверхні, сумісній з OpenAI, bearer auth через shared secret відновлює повний типовий набір операторських scope (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) і семантику owner для ходів agent; вужчі значення `x-openclaw-scopes` не звужують цей шлях shared-secret.
- Семантика scope на HTTP на запит застосовується лише тоді, коли запит надходить із режиму з переданою ідентичністю, наприклад trusted proxy auth або `gateway.auth.mode="none"` на приватному ingress.
- У цих режимах із переданою ідентичністю пропуск `x-openclaw-scopes` повертається до звичайного типового набору операторських scope; надсилайте заголовок явно, якщо хочете вужчий набір scope.
- `/tools/invoke` дотримується того самого правила shared-secret: bearer auth через token/password тут також вважається повним операторським доступом, тоді як режими з переданою ідентичністю все ще поважають оголошені scope.
- Не діліться цими обліковими даними з недовіреними викликачами; віддавайте перевагу окремим gateway для кожної межі довіри.

**Припущення про довіру:** auth Serve без token передбачає, що gateway host є довіреним.
Не вважайте це захистом від ворожих процесів на тому самому хості. Якщо на gateway host
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale`
і вимагайте явну auth через shared secret у `gateway.auth.mode: "token"` або
`"password"`.

**Правило безпеки:** не пересилайте ці заголовки зі свого reverse proxy. Якщо
ви завершуєте TLS або ставите proxy перед gateway, вимкніть
`gateway.auth.allowTailscale` і використовуйте auth через shared secret (`gateway.auth.mode:
"token"` або `"password"`) або [Trusted Proxy Auth](/gateway/trusted-proxy-auth)
замість цього.

Trusted proxies:

- Якщо ви завершуєте TLS перед Gateway, установіть `gateway.trustedProxies` на IP ваших proxy.
- OpenClaw довірятиме `x-forwarded-for` (або `x-real-ip`) від цих IP для визначення IP клієнта для локальних pairing-check та HTTP auth/local checks.
- Переконайтеся, що ваш proxy **перезаписує** `x-forwarded-for` і блокує прямий доступ до порту Gateway.

Див. [Tailscale](/gateway/tailscale) і [Огляд web](/web).

### 0.6.1) Керування browser через node host (рекомендовано)

Якщо ваш Gateway віддалений, але browser працює на іншій машині, запустіть **node host**
на машині з browser і дозвольте Gateway проксувати browser-дії (див. [Інструмент Browser](/tools/browser)).
Ставтеся до pairing node як до admin-доступу.

Рекомендований шаблон:

- Тримайте Gateway і node host в одному tailnet (Tailscale).
- Виконуйте pairing node навмисно; вимикайте browser proxy routing, якщо він вам не потрібен.

Уникайте:

- Відкриття relay/control-портів у LAN або публічному інтернеті.
- Tailscale Funnel для browser control endpoints (публічна експозиція).

### 0.7) Secrets на диску (чутливі дані)

Вважайте, що будь-що під `~/.openclaw/` (або `$OPENCLAW_STATE_DIR/`) може містити secrets або приватні дані:

- `openclaw.json`: config може містити tokens (gateway, remote gateway), налаштування провайдерів і allowlists.
- `credentials/**`: облікові дані каналів (наприклад WhatsApp creds), pairing allowlists, legacy OAuth imports.
- `agents/<agentId>/agent/auth-profiles.json`: API keys, профілі token, OAuth tokens та необов’язкові `keyRef`/`tokenRef`.
- `secrets.json` (необов’язково): вміст секретів у файлі, який використовується file-провайдерами SecretRef (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: legacy compatibility file. Статичні записи `api_key` очищуються при виявленні.
- `agents/<agentId>/sessions/**`: transcripts сесій (`*.jsonl`) + метадані маршрутизації (`sessions.json`), які можуть містити приватні повідомлення та вивід tools.
- bundled plugin packages: встановлені плагіни (разом із їхніми `node_modules/`).
- `sandboxes/**`: робочі простори sandbox tools; можуть накопичувати копії файлів, які ви читаєте/записуєте всередині sandbox.

Поради з посилення безпеки:

- Тримайте права доступу жорсткими (`700` для каталогів, `600` для файлів).
- Використовуйте повне шифрування диска на gateway host.
- Якщо хост спільний, краще використовувати окремий обліковий запис користувача ОС для Gateway.

### 0.8) Logs + transcripts (редагування + утримання)

Logs і transcripts можуть витікати чутливі дані, навіть якщо контроль доступу налаштовано правильно:

- Gateway logs можуть містити підсумки tools, помилки та URL.
- Session transcripts можуть містити вставлені secrets, вміст файлів, вивід команд і посилання.

Рекомендації:

- Тримайте увімкненим редагування підсумків tools (`logging.redactSensitive: "tools"`; за замовчуванням).
- Додавайте власні шаблони через `logging.redactPatterns` для вашого середовища (tokens, hostnames, внутрішні URL).
- Ділячись діагностикою, надавайте перевагу `openclaw status --all` (можна вставляти, secrets відредаговано), а не сирим logs.
- Очищайте старі session transcripts і log files, якщо вам не потрібне довге зберігання.

Докладніше: [Логування](/gateway/logging)

### 1) DM: pairing за замовчуванням

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Групи: вимагати згадку всюди

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

У групових чатах відповідайте лише за явної згадки.

### 3) Окремі номери (WhatsApp, Signal, Telegram)

Для каналів, прив’язаних до телефонного номера, подумайте про запуск вашого AI на окремому телефонному номері, відмінному від особистого:

- Особистий номер: ваші розмови залишаються приватними
- Номер бота: AI обробляє їх у відповідних межах

### 4) Режим лише для читання (через sandbox + tools)

Ви можете побудувати профіль лише для читання, поєднавши:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (або `"none"` для повної відсутності доступу до workspace)
- allow/deny списки tools, які блокують `write`, `edit`, `apply_patch`, `exec`, `process` тощо

Додаткові параметри посилення:

- `tools.exec.applyPatch.workspaceOnly: true` (за замовчуванням): гарантує, що `apply_patch` не може записувати/видаляти файли поза каталогом workspace, навіть якщо sandboxing вимкнено. Встановлюйте `false` лише якщо ви навмисно хочете, щоб `apply_patch` торкався файлів поза workspace.
- `tools.fs.workspaceOnly: true` (необов’язково): обмежує шляхи `read`/`write`/`edit`/`apply_patch` і нативне автозавантаження зображень у prompt каталогом workspace (корисно, якщо сьогодні ви дозволяєте абсолютні шляхи й хочете один спільний guardrail).
- Тримайте корені файлової системи вузькими: уникайте надто широких коренів, таких як домашній каталог, для workspace agent/sandbox workspace. Широкі корені можуть відкрити чутливі локальні файли (наприклад state/config у `~/.openclaw`) для tools файлової системи.

### 5) Безпечна базова конфігурація (copy/paste)

Одна «безпечна за замовчуванням» конфігурація, яка тримає Gateway приватним, вимагає DM pairing і уникає завжди активних групових ботів:

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

Якщо ви також хочете «безпечніше за замовчуванням» виконання tools, додайте sandbox + deny небезпечних tools для будь-якого не-owner agent (приклад нижче в розділі «Профілі доступу для окремих агентів»).

Вбудована базова політика для chat-driven ходів agent: відправники, що не є owner, не можуть використовувати tools `cron` або `gateway`.

## Sandboxing (рекомендовано)

Окрема документація: [Sandboxing](/gateway/sandboxing)

Два взаємодоповнювальні підходи:

- **Запуск усього Gateway в Docker** (контейнерна межа): [Docker](/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, host gateway + Docker-ізольовані tools): [Sandboxing](/gateway/sandboxing)

Примітка: щоб запобігти доступу між агентами, залишайте `agents.defaults.sandbox.scope` як `"agent"` (за замовчуванням)
або `"session"` для суворішої ізоляції на рівні сесій. `scope: "shared"` використовує
один контейнер/робочий простір.

Також зважайте на доступ agent до workspace всередині sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (за замовчуванням) не дає доступу до workspace agent; tools працюють із sandbox workspace під `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` монтує workspace agent лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` монтує workspace agent для читання/запису в `/workspace`
- Додаткові `sandbox.docker.binds` перевіряються на нормалізовані й канонізовані шляхи джерел. Хитрощі з батьківськими symlink і канонічними псевдонімами home усе одно завершаться fail-closed, якщо розв’язуються в заблоковані корені на кшталт `/etc`, `/var/run` або каталогів credentials під home ОС.

Важливо: `tools.elevated` — це глобальний аварійний шлях виходу, який запускає exec поза sandbox. Ефективний host за замовчуванням — `gateway`, або `node`, коли ціль exec налаштована на `node`. Тримайте `tools.elevated.allowFrom` вузьким і не вмикайте його для сторонніх. Ви також можете ще сильніше обмежити elevated для окремого agent через `agents.list[].tools.elevated`. Див. [Elevated Mode](/tools/elevated).

### Guardrail делегування субагентів

Якщо ви дозволяєте session tools, ставтеся до делегування субагенту як до ще одного рішення про межі:

- Забороняйте `sessions_spawn`, якщо agent насправді не потребує делегування.
- Тримайте `agents.defaults.subagents.allowAgents` і будь-які перевизначення `agents.list[].subagents.allowAgents` для окремих agent обмеженими відомо безпечними цільовими агентами.
- Для будь-якого потоку, який має лишатися в sandbox, викликайте `sessions_spawn` із `sandbox: "require"` (типове значення — `inherit`).
- `sandbox: "require"` аварійно завершується, коли дочірній runtime не працює в sandbox.

## Ризики керування browser

Увімкнення browser control дає моделі можливість керувати реальним browser.
Якщо цей browser profile уже містить активні сесії, модель може
отримати доступ до цих акаунтів і даних. Ставтеся до browser profiles як до **чутливого стану**:

- Надавайте перевагу окремому profile для agent (типовий profile `openclaw`).
- Не спрямовуйте agent на ваш повсякденний особистий browser profile.
- Тримайте керування host browser вимкненим для sandboxed agent, якщо тільки ви їм не довіряєте.
- Окремий loopback API для browser control приймає лише auth через shared secret
  (bearer auth токеном gateway або паролем gateway). Він не використовує
  trusted-proxy або заголовки ідентичності Tailscale Serve.
- Ставтеся до завантажень browser як до недовіреного вмісту; надавайте перевагу ізольованому каталогу завантажень.
- За можливості вимикайте синхронізацію browser/менеджери паролів у profile agent (це зменшує радіус ураження).
- Для віддалених gateway вважайте, що “browser control” еквівалентний “operator access” до всього, до чого має доступ цей profile.
- Тримайте Gateway і node host лише в tailnet; уникайте відкриття портів browser control у LAN або публічний інтернет.
- Вимикайте browser proxy routing, коли він не потрібен (`gateway.nodes.browser.mode="off"`).
- Режим existing-session для Chrome MCP **не є «безпечнішим»**; він може діяти від вашого імені всюди, куди має доступ profile Chrome на цьому хості.

### Політика browser SSRF (типова модель довіреної мережі)

Типова мережева політика browser в OpenClaw відповідає моделі довіреного оператора: приватні/внутрішні адресати дозволені, якщо ви їх явно не вимкнете.

- За замовчуванням: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` (неявно, якщо не задано).
- Legacy alias: `browser.ssrfPolicy.allowPrivateNetwork` усе ще приймається для сумісності.
- Суворий режим: встановіть `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: false`, щоб типово блокувати приватні/внутрішні/special-use адресати.
- У суворому режимі використовуйте `hostnameAllowlist` (шаблони на кшталт `*.example.com`) і `allowedHostnames` (точні винятки для host, включно із заблокованими іменами на кшталт `localhost`) для явних винятків.
- Навігація перевіряється перед запитом і best-effort повторно перевіряється на фінальному `http(s)` URL після навігації, щоб зменшити можливість pivot через redirect.

Приклад суворої політики:

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

З multi-agent routing кожен agent може мати власні sandbox + політику tools:
використовуйте це, щоб надавати **повний доступ**, **лише читання** або **жодного доступу** для кожного agent.
Див. [Sandbox і Tools для Multi-Agent](/tools/multi-agent-sandbox-tools) для повних деталей
і правил пріоритетності.

Типові сценарії:

- Особистий agent: повний доступ, без sandbox
- Agent для родини/роботи: sandbox + tools лише для читання
- Публічний agent: sandbox + без tools файлової системи/shell

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

### Приклад: tools лише для читання + workspace лише для читання

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

### Приклад: без доступу до файлової системи/shell (дозволено provider messaging)

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
        // Session tools можуть розкривати чутливі дані з transcript. За замовчуванням OpenClaw обмежує ці tools
        // поточною сесією + сесіями spawned subagent, але за потреби ви можете ще сильніше їх обмежити.
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

Включіть правила безпеки до system prompt вашого agent:

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

### Локалізація

1. **Зупиніть його:** зупиніть macOS app (якщо він керує Gateway) або завершіть процес `openclaw gateway`.
2. **Закрийте експозицію:** установіть `gateway.bind: "loopback"` (або вимкніть Tailscale Funnel/Serve), доки не зрозумієте, що сталося.
3. **Заморозьте доступ:** переведіть ризикові DM/групи у `dmPolicy: "disabled"` / вимагайте згадок і видаліть записи `"*"` з «дозволити всіх», якщо вони у вас були.

### Ротація (вважайте компрометацію можливою, якщо secrets витекли)

1. Змініть auth Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) і перезапустіть.
2. Змініть секрети віддалених клієнтів (`gateway.remote.token` / `.password`) на всіх машинах, які можуть викликати Gateway.
3. Змініть credentials провайдерів/API (WhatsApp creds, Slack/Discord tokens, ключі моделей/API в `auth-profiles.json`, а також значення зашифрованого вмісту secrets за потреби).

### Аудит

1. Перевірте Gateway logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (або `logging.file`).
2. Перегляньте відповідні transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Перевірте недавні зміни config (усе, що могло розширити доступ: `gateway.bind`, `gateway.auth`, політики DM/group, `tools.elevated`, зміни plugin).
4. Повторно запустіть `openclaw security audit --deep` і переконайтеся, що критичні знахідки усунено.

### Збір для звіту

- Timestamp, ОС gateway host + версія OpenClaw
- Transcript(s) сесії + короткий хвіст log (після редагування)
- Що надіслав атакувальник + що зробив agent
- Чи був Gateway відкритий поза loopback (LAN/Tailscale Funnel/Serve)

## Сканування секретів (detect-secrets)

CI запускає pre-commit hook `detect-secrets` у job `secrets`.
Push у `main` завжди запускає перевірку всіх файлів. Pull request використовують
швидкий шлях для змінених файлів, якщо доступний базовий commit, і повертаються до
сканування всіх файлів в іншому разі. Якщо перевірка падає, це означає, що з’явилися нові кандидати, яких ще немає в baseline.

### Якщо CI завершується помилкою

1. Відтворіть локально:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Зрозумійте інструменти:
   - `detect-secrets` у pre-commit запускає `detect-secrets-hook` з baseline та excludes цього репозиторію.
   - `detect-secrets audit` відкриває інтерактивний перегляд, щоб позначити кожен елемент baseline як реальний або хибнопозитивний.
3. Для реальних секретів: змініть/видаліть їх, а потім повторно запустіть сканування, щоб оновити baseline.
4. Для хибнопозитивних результатів: запустіть інтерактивний аудит і позначте їх як хибні:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Якщо вам потрібні нові excludes, додайте їх у `.detect-secrets.cfg` і перегенеруйте
   baseline з відповідними прапорцями `--exclude-files` / `--exclude-lines` (файл config
   тут лише довідковий; detect-secrets не читає його автоматично).

Закомітьте оновлений `.secrets.baseline`, щойно він відобразить очікуваний стан.

## Повідомлення про проблеми безпеки

Знайшли вразливість в OpenClaw? Повідомте відповідально:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Не публікуйте інформацію до виправлення
3. Ми вкажемо вас у подяках (якщо ви не надаєте перевагу анонімності)
