---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідник CLI для `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Плагіни
x-i18n:
    generated_at: "2026-04-25T17:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язано:

- Система плагінів: [Плагіни](/uk/tools/plugin)
- Сумісність пакетів: [Пакети плагінів](/uk/plugins/bundles)
- Маніфест плагіна + схема: [Маніфест плагіна](/uk/plugins/manifest)
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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Власні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. У докладному виводі list/info також показується підтип пакета (`codex`, `claude` або `cursor`), а також виявлені можливості пакета.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # тільки ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # закріпити версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` підтримується однофайловим `$include`, то `plugins install/update/enable/disable/uninstall` записують зміни безпосередньо до цього включеного файла та не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються безпечною відмовою замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація недійсна, `plugins install` зазвичай завершується безпечною відмовою і пропонує спочатку виконати `openclaw doctor --fix`.

Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте цей параметр, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна використовуйте `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється і спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, тому що встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про результати рівня `critical`, але він **не** обходить блокування політики хуків `before_install` плагіна і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення навичок ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які оголошують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і вмикання окремих хуків, а не для встановлення пакета.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації git/URL/файлів і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються з `--ignore-scripts`.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів у prerelease, OpenClaw зупиняється і просить вас явно погодитися, використавши тег prerelease, наприклад `@beta`/`@rc`, або точну версію prerelease, наприклад `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб установити пакет npm з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих npm-безпечних специфікацій плагінів. Повернення до npm відбувається лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімального Gateway, а потім встановлює його через звичайний шлях архіву. Зафіксовані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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
- локальний корінь marketplace або шлях до `marketplace.json`
- скорочення GitHub-репозиторію, наприклад `owner/repo`
- URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- власні плагіни OpenClaw (`openclaw.plugin.json`)
- пакети, сумісні з Codex (`.codex-plugin/plugin.json`)
- пакети, сумісні з Claude (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- пакети, сумісні з Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються до звичайного кореня плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються skills пакетів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor та сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час роботи.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише увімкнені плагіни. Використовуйте `--verbose`, щоб перейти від табличного подання до рядків із докладною інформацією про кожен плагін із метаданими джерела/походження/версії/активації. Використовуйте `--json` для машинозчитуваного переліку плюс діагностики реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів із резервним переходом на похідний режим лише за маніфестом, якщо реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлено плагін, чи він увімкнений і чи видимий для планування холодного запуску, але це не жива перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте саме дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

Для налагодження хуків під час виконання:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та diagnostics із проходу inspection із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway, підказки щодо сервісу/процесу, шлях до конфігурації та справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується разом із `--link`, тому що зв’язані встановлення повторно використовують вихідний шлях замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` під час встановлень npm, щоб зберегти точну розв’язану специфікацію (`name@version`) у `plugins.installs`, залишивши стандартну поведінку без закріплення.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів з `plugins.entries`, `plugins.installs`, списку дозволених плагінів і, за потреби, зв’язані записи `plugins.load.paths`. Для плагінів активної пам’яті слот пам’яті скидається до `memory-core`.

За замовчуванням `uninstall` також видаляє каталог встановлення плагіна в активному кореневому каталозі плагінів state-dir. Використовуйте `--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, як-от `@beta`, і точні закріплені версії надалі використовуються в наступних запусках `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію пакета npm з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви пакета npm без версії або тега також зіставляє її з відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

Перед реальним оновленням npm OpenClaw перевіряє встановлену версію пакета відносно метаданих реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення буде пропущено без завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється,
OpenClaw розглядає це як дрейф артефакту npm. Інтерактивна команда
`openclaw plugins update` виводить очікуваний і фактичний хеші та запитує
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення
завершуються безпечною відмовою, якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування
небезпечного коду під час оновлень плагінів. Він, як і раніше, не обходить
блокування політики `before_install` плагіна чи блокування через збої
сканування, і застосовується лише до оновлень плагінів, а не до оновлень
наборів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, статус
завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди,
сервіси, методи gateway, HTTP-маршрути, прапорці політик, diagnostics,
метадані встановлення, можливості пакета, а також будь-яку виявлену підтримку
серверів MCP або LSP.

Кожен плагін класифікується за тим, що саме він реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з одним провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми плагінів](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і
аудиту.

`inspect --all` відображає загальносистемну таблицю зі стовпцями shape, capability kinds,
compatibility notices, bundle capabilities і hook summary.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics
маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він виводить `No plugin issues
detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно
запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий підсумок
форми експорту до діагностичного виводу.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для
ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та
власності внесків. Звичайний запуск, пошук власника провайдера, класифікація
налаштування каналу та інвентаризація плагінів можуть читати його без імпорту
модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр
наявний, актуальний чи застарілий. Використовуйте `--refresh`, щоб перебудувати
його з довговічного журналу встановлень, політики конфігурації та метаданих
маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний
перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry
--refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для
аварійного відновлення запуску, поки розгортається міграція.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи плагінів.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни спільноти](/uk/plugins/community)
