---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-26T03:28:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dec5a7f48d8daaa5230280250642885cb355d1a5f83bacd78d81ba45fa6a7d8
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язане:

- Система Plugin: [Плагіни](/uk/tools/plugin)
- Сумісність пакетів: [Пакети Plugin](/uk/plugins/bundles)
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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` і вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`), а також виявлені можливості пакета.

### Install

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Прості назви пакетів спочатку звіряються з ClawHub, а потім з npm. Примітка щодо безпеки: ставтеся до встановлення плагінів так, ніби ви запускаєте код. Надавайте перевагу зафіксованим версіям.

Якщо ваш розділ `plugins` використовує однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла та не змінюють `openclaw.json`. Кореневі includes, масиви include та includes із сусідніми перевизначеннями безпечно завершуються помилкою замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай безпечно завершується помилкою та пропонує спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно ввімкнули `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте це, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту. Для звичайного оновлення вже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється та вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень через npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки рівня `critical`, але **не** обходить блокування політик хуків плагіна `before_install` і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків install/update для плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які оголошують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованого перегляду хуків і вмикання окремих хуків, а не для встановлення пакетів.

Специфікації npm — **лише для реєстру** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються локально в межах проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці задано глобальні параметри встановлення npm.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них у пререліз, OpenClaw зупиняється та просить вас явно погодитися через тег пререлізу, наприклад `@beta`/`@rc`, або точну версію пререлізу, наприклад `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
Архіви нативних плагінів OpenClaw мають містити валідний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, що містять лише `package.json`, відхиляються ще до того, як OpenClaw записує відомості про встановлення.

Також підтримуються встановлення з Claude marketplace.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих безпечних для npm специфікацій плагінів. До npm він переходить лише тоді, коли в ClawHub немає такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API Plugin / мінімальної версії gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Джерелами marketplace можуть бути:

- назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
- локальний корінь marketplace або шлях до `marketplace.json`
- скорочений запис GitHub repo на кшталт `owner/repo`
- URL GitHub repo на кшталт `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого repo marketplace. OpenClaw приймає відносні джерела шляхів із цього repo та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час роботи.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показувати лише ввімкнені плагіни. Використовуйте `--verbose`, щоб перейти від табличного подання до докладних рядків для кожного плагіна з метаданими source/origin/version/activation. Використовуйте `--json` для машиночитного інвентаря та diagnostics реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів із резервним варіантом побудови лише з маніфестів, якщо реєстр відсутній або невалідний. Це корисно для перевірки, чи встановлено, увімкнено та чи видимий плагін для планування холодного запуску, але це не жива перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, його стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте саме дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та diagnostics із проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується разом із `--link`, оскільки linked-встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для встановлень через npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку без фіксації.

### Plugin Index

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення та оновлення записують їх у `plugins/installs.json` у межах активного каталогу стану OpenClaw. Його map верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, побудований із маніфестів. Файл містить попередження про заборону ручного редагування та використовується командами `openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.
Коли OpenClaw бачить доставлені з попередніх версій записи `plugins.installs` у конфігурації, він переносить їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який із записів завершиться помилкою, записи конфігурації зберігаються, щоб не втратити метадані встановлення.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, allowlist плагінів і пов’язаних записів `plugins.load.paths` за потреби. Якщо не задано `--keep-files`, uninstall також видаляє відстежуваний каталог керованого встановлення, якщо він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і до відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно зафіксовані версії продовжують використовуватися під час наступних запусків `update <id>`.

Для встановлень через npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із записом відстежуваного плагіна, оновлює цей встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або тега також зіставляється назад із записом відстежуваного плагіна. Використовуйте це, коли плагін був зафіксований на точній версії, а ви хочете повернути його до типової лінії релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета щодо метаданих реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються помилкою, якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний для `plugins update` як аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час оновлення плагінів. Він так само не обходить блокування політик плагіна `before_install` або блокування через збої сканування і застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway, HTTP-маршрути, прапорці політик, diagnostics, метадані встановлення, можливості пакетів і будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен плагін класифікується за тим, що саме він реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитний звіт, придатний для сценаріїв і аудиту.

`inspect --all` відображає загальносистемну таблицю зі стовпцями shape, capability kinds, compatibility notices, bundle capabilities і summary хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics маніфестів/виявлення та повідомлення щодо сумісності. Якщо все гаразд, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити до diagnostic-виводу компактне зведення форми експорту.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для встановленої ідентичності плагінів, стану ввімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи існує збережений реєстр, чи він актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску, поки триває розгортання міграції.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub repo або git URL. `--json` виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і записи плагінів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Спільнотні плагіни](/uk/plugins/community)
