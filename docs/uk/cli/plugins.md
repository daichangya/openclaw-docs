---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними наборами пакунків
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідник CLI для `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9536d2df20b9284855878dbfc649d7905d6440e9fe8d8d00e63b97c4e428194d
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними наборами пакунків.

Пов’язано:

- Система Plugin: [Plugins](/uk/tools/plugin)
- Сумісність наборів пакунків: [Набори пакунків Plugin](/uk/plugins/bundles)
- Маніфест Plugin + схема: [Маніфест Plugin](/uk/plugins/manifest)
- Посилення безпеки: [Безпека](/uk/gateway/security)

## Команди

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Вбудовані плагіни постачаються разом з OpenClaw. Деякі ввімкнені типово (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований
плагін браузера); інші потребують `plugins enable`.

Нативні плагіни OpenClaw повинні постачатися з `openclaw.plugin.json` із вбудованою JSON
Schema (`configSchema`, навіть якщо вона порожня). Сумісні набори пакунків натомість використовують
власні маніфести наборів пакунків.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info
також показує підтип набору пакунків (`codex`, `claude` або `cursor`) плюс виявлені
можливості набору пакунків.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # закріпити версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Імена пакунків без уточнень спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки:
ставтеся до встановлення плагінів як до виконання коду. Віддавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу та не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями аварійно зупиняються замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай аварійно зупиняється та пропонує
спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький
шлях відновлення для вбудованого плагіна для плагінів, які явно погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений
плагін або набір хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте
той самий id із нового локального шляху, архіву, пакунка ClawHub або npm-артефакту.
Для звичайних оновлень уже відстежуваного npm-плагіна віддавайте перевагу
`openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw
зупиняється та спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення,
або до `plugins install <package> --force`, якщо ви справді хочете перезаписати
поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`,
оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не
специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань
у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення навіть
коли вбудований сканер повідомляє про результати рівня `critical`, але **не**
обходить блокування політики хука плагіна `before_install` і **не**
обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим
потоком завантаження/встановлення навичок ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які надають
`openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої
видимості хуків і ввімкнення окремих хуків, а не для встановлення пакунків.

Специфікації npm є **лише реєстровими** (назва пакунка + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення
залежностей для безпеки запускаються з `--ignore-scripts`.

Специфікації без уточнень і `@latest` лишаються на стабільній гілці. Якщо npm розв’язує
будь-який із цих варіантів до prerelease, OpenClaw зупиняється й просить вас явно погодитися,
вказавши тег prerelease, наприклад `@beta`/`@rc`, або точну версію prerelease, наприклад
`@1.2.3-beta.4`.

Якщо специфікація встановлення без уточнень збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw
встановлює вбудований плагін безпосередньо. Щоб установити npm-пакунок із тією самою
назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для специфікацій плагінів, сумісних із bare npm. Він переходить
до npm лише якщо в ClawHub немає цього пакунка або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакунка з ClawHub, перевіряє оголошену
сумісність API Plugin / мінімальну сумісність gateway, а потім установлює його через звичайний
шлях архіву. Зафіксовані встановлення зберігають свої метадані джерела ClawHub для подальших
оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному
кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, якщо хочете явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Джерелами marketplace можуть бути:

- назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
- локальний корінь marketplace або шлях `marketplace.json`
- скорочений запис GitHub-репозиторію, наприклад `owner/repo`
- URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів повинні
залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає відносні шляхи
з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела
плагінів, які не є шляхами, з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні набори пакунків Codex (`.codex-plugin/plugin.json`)
- сумісні набори пакунків Claude (`.claude-plugin/plugin.json` або типовий
  макет компонентів Claude)
- сумісні набори пакунків Cursor (`.cursor-plugin/plugin.json`)

Сумісні набори пакунків установлюються до звичайного кореня плагінів і беруть участь
у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, Claude
command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` /
`lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні
каталоги хуків Codex; інші виявлені можливості наборів пакунків
показуються в diagnostics/info, але ще не підключені до виконання під час роботи.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише ввімкнені плагіни. Використовуйте `--verbose`, щоб перейти
від табличного подання до докладних рядків для кожного плагіна з метаданими
джерела/походження/версії/активації. Використовуйте `--json` для машиночитаного
інвентарю та diagnostics реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів, а за його
відсутності або невалідності використовує резервний варіант, похідний лише від маніфесту. Це
зручно для перевірки, чи встановлено плагін, чи він увімкнений і чи видимий для
планування холодного запуску, але це не живе runtime-зондування вже запущеного
процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або
`plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж
очікувати виконання нового коду `register(api)` або хуків. Для віддалених/контейнерних
розгортань переконайтеся, що ви перезапускаєте саме дочірній процес `openclaw gateway run`,
а не лише процес-обгортку.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та diagnostics
  з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway,
  підказки про сервіс/процес, шлях до config і стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `agent_end`) потрібно
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки встановлення з посиланням повторно використовують
вихідний шлях замість копіювання до керованої цілі встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у
керованому журналі встановлень, зберігаючи типову поведінку без закріплення.

### Журнал встановлень

Метадані встановлення плагінів — це машинно керований стан, а не конфігурація користувача. Нові
встановлення та оновлення записують його до `plugins/installs.json` у межах активного каталогу
стану OpenClaw. Файл містить попередження не редагувати його вручну та використовується
`openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.

Застарілі записи `plugins.installs` у `openclaw.json` усе ще можна читати як
застарілий резервний механізм сумісності. Коли шляхи install/update/uninstall
перезаписують стан встановлення плагіна, OpenClaw записує файл журналу та видаляє
`plugins.installs` зі збереженого payload конфігурації.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, керованого журналу встановлень,
allowlist плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно.
Для плагінів active memory слот пам’яті скидається до `memory-core`.

Типово uninstall також видаляє каталог встановлення плагіна в корені плагінів активного state-dir. Використовуйте
`--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому журналі встановлень і
відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього
плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точні закріплені
версії продовжують використовуватися в наступних запусках `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію npm-пакунка з dist-tag
або точною версією. OpenClaw зіставляє цю назву пакунка назад із відстежуваним записом плагіна,
оновлює цей встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакунка без версії чи тега також зіставляється назад із
відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на
точній версії, а ви хочете повернути його до типової гілки релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакунка щодо
метаданих реєстру npm. Якщо встановлена версія та ідентичність записаного
артефакту вже відповідають розв’язаній цілі, оновлення пропускається без
завантаження, перевстановлення чи перезапису `openclaw.json`.

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється,
OpenClaw розцінює це як дрейф npm-артефакту. Інтерактивна команда
`openclaw plugins update` виводить очікуваний і фактичний хеші та просить
підтвердження перед продовженням. Неінтерактивні помічники оновлення аварійно зупиняються,
якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування
небезпечного коду під час оновлення плагінів. Він усе ще не обходить блокування
політики плагіна `before_install` або блокування через збої сканування, і
застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інспекція для одного плагіна. Показує ідентичність, стан завантаження, джерело,
зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway,
HTTP-маршрути, прапорці політики, diagnostics, метадані встановлення, можливості набору пакунків,
а також будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитаний звіт, придатний для сценаріїв і
аудиту.

`inspect --all` виводить загальнофлотську таблицю з колонками shape, kinds можливостей,
повідомленнями про сумісність, можливостями наборів пакунків і підсумком хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics виявлення/маніфестів і
повідомлення про сумісність. Якщо все чисто, він виводить `No plugin issues
detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно запустіть
із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експортів у
діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена модель холодного читання OpenClaw для встановленої
ідентичності плагінів, стану ввімкнення, метаданих джерела та належності внесків.
Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та
інвентаризація плагінів можуть читати його без імпорту модулів runtime плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи наявний збережений реєстр,
чи він актуальний, чи застарілий. Використовуйте `--refresh`, щоб перебудувати його з
довговічного журналу встановлень, політики config і метаданих маніфесту/пакунка. Це
шлях відновлення, а не шлях runtime-активації.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний
перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry
--refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для
аварійного відновлення запуску, поки триває розгортання міграції.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях marketplace, шлях `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи плагінів.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни спільноти](/uk/plugins/community)
