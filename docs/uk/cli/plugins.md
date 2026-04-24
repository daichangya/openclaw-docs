---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними наборами пакунків
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідник CLI для `openclaw plugins` (список, встановлення, marketplace, видалення, увімкнення/вимкнення, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T03:15:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами hook-ів і сумісними наборами пакунків.

Пов’язане:

- Система плагінів: [Плагіни](/uk/tools/plugin)
- Сумісність наборів пакунків: [Набори пакунків плагінів](/uk/plugins/bundles)
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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні набори пакунків натомість використовують власні маніфести наборів пакунків.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип набору пакунків (`codex`, `claude` або `cursor`), а також виявлені можливості набору пакунків.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # зафіксувати версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Прості назви пакунків спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів так само, як до виконання коду. Віддавайте перевагу зафіксованим версіям.

Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й залишають `openclaw.json` без змін. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються безпечною відмовою замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація недійсна, `plugins install` зазвичай безпечно завершується з відмовою та пропонує спочатку виконати `openclaw doctor --fix`. Єдиний документований виняток — вузький шлях відновлення для вбудованих плагінів, які явно підключають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або набір hook-ів на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакунка ClawHub або npm-артефакту. Для звичайних оновлень уже відстежуваного npm-плагіна краще використовувати `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до npm-встановлень. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про результати `critical`, але **не** обходить блокування політикою hook-а `before_install` плагіна і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для наборів hook-ів, які оголошують `openclaw.hooks` у `package.json`. Для відфільтрованої видимості hook-ів і ввімкнення окремих hook-ів використовуйте `openclaw hooks`, а не встановлення пакунка.

Специфікації npm — **лише реєстрові** (назва пакунка + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file та діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються з `--ignore-scripts`.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm зіставляє будь-яку з них із prerelease, OpenClaw зупиняється й просить явно погодитися, вказавши prerelease-тег на кшталт `@beta`/`@rc` або точну prerelease-версію, наприклад `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб встановити npm-пакунок з такою самою назвою, використайте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з Claude marketplace.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для простих npm-безпечних специфікацій плагінів. До npm він переходить лише тоді, коли в ClawHub немає цього пакунка або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакунка з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.

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
- скорочений запис GitHub-репозиторію, наприклад `owner/repo`
- URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
- URL git

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні набори пакунків Codex (`.codex-plugin/plugin.json`)
- сумісні набори пакунків Claude (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні набори пакунків Cursor (`.cursor-plugin/plugin.json`)

Сумісні набори пакунків встановлюються до звичайного кореня плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги hook-ів Codex; інші виявлені можливості наборів пакунків показуються в diagnostics/info, але ще не підключені до виконання під час runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені плагіни. Використовуйте `--verbose`, щоб перейти від табличного подання до докладних рядків для кожного плагіна з метаданими джерела/походження/версії/активації. Використовуйте `--json` для машинозчитуваного переліку плюс diagnostics реєстру.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки встановлення через посилання повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти точну зіставлену специфікацію (`name@version`) у `plugins.installs`, залишаючи типову поведінку без фіксації.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, `plugins.installs`, allowlist плагінів і пов’язаних записів `plugins.load.paths` для встановлень через посилання, коли це застосовно. Для плагінів активної пам’яті слот пам’яті скидається до `memory-core`.

За замовчуванням `uninstall` також видаляє каталог встановлення плагіна в корені плагінів активного state-dir. Використовуйте `--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних встановлень наборів hook-ів у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag-и, як-от `@beta`, і точні зафіксовані версії й надалі використовуються в наступних запусках `update <id>`.

Для npm-встановлень ви також можете передати явну специфікацію npm-пакунка з dist-tag або точною версією. OpenClaw зіставляє цю назву пакунка назад із записом відстежуваного плагіна, оновлює встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакунка без версії або тега також зіставляється назад із записом відстежуваного плагіна. Використовуйте це, коли плагін було зафіксовано на точній версії й ви хочете повернути його до типової гілки релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакунка за метаданими реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже відповідають зіставленій цілі, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються з відмовою, якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний для `plugins update` як аварійне перевизначення для хибнопозитивних результатів вбудованого сканування небезпечного коду під час оновлення плагінів. Він, як і раніше, не обходить блокування політикою `before_install` плагіна або блокування через збої сканування, і застосовується лише до оновлень плагінів, а не до оновлень наборів hook-ів.

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока перевірка одного плагіна. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, hook-и, інструменти, команди, служби, методи gateway, HTTP-маршрути, прапорці політики, diagnostics, метадані встановлення, можливості набору пакунків, а також будь-яку виявлену підтримку MCP або LSP server.

Кожен плагін класифікується за тим, що саме він реально реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hook-и, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Детальніше про модель можливостей див. у [Формах плагінів](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і аудиту.

`inspect --all` показує загальносистемну таблицю з колонками форми, типів можливостей, повідомлень про сумісність, можливостей набору пакунків і зведенням hook-ів.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics маніфеста/виявлення та повідомлення про сумісність. Коли все гаразд, він виводить `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту у вивід diagnostics.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або URL git. `--json` виводить мітку зіставленого джерела разом із розібраним маніфестом marketplace та записами плагінів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Спільнотні плагіни](/uk/plugins/community)
