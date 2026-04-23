---
read_when:
    - Ви хочете встановити або керувати Plugin Gateway або сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T07:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7dd521db1de47ceb183d98a538005d3d816f52ffeee12593bcbaa8014d6e507b
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте Plugin Gateway, наборами hook і сумісними пакетами.

Пов’язане:

- Система Plugin: [Plugins](/uk/tools/plugin)
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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Вбудовані plugins постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований plugin browser); інші потребують `plugins enable`.

Нативні plugins OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) разом із виявленими можливостями пакета.

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

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення plugin так само, як до запуску коду. Віддавайте перевагу зафіксованим версіям.

Якщо ваш розділ `plugins` підтримується однофайловим `$include`, то `plugins install`, `plugins update`, `plugins enable`, `plugins disable` і `plugins uninstall` записують зміни до цього включеного файлу та не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями натомість безпечно блокуються, а не розгортаються. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай безпечно завершується помилкою і радить спочатку виконати `openclaw doctor --fix`. Єдиний документований виняток — вузький шлях відновлення для вбудованого plugin, доступний для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або набір hook на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється та пропонує `plugins update <id-or-npm-spec>` для звичайного оновлення або `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про findings рівня `critical`, але **не** обходить блокування політик hook `before_install` plugin і **не** обходить помилки сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для наборів hook, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості hook і вмикання окремих hook, а не для встановлення пакетів.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються з `--ignore-scripts`.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них у prerelease, OpenClaw зупиняється та просить вас явно погодитися за допомогою тега prerelease, такого як `@beta`/`@rc`, або точної версії prerelease, такої як `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого plugin (наприклад, `diffs`), OpenClaw встановлює вбудований plugin напряму. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих безпечних для npm специфікацій plugin. До npm він звертається лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API plugin / мінімальну сумісність gateway, а потім установлює його через звичайний шлях архіву. Записані встановлення зберігають метадані свого джерела ClawHub для подальших оновлень.

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
- скорочений запис GitHub-репозиторію, такий як `owner/repo`
- URL GitHub-репозиторію, такий як `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених з GitHub або git, записи plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела plugin з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються до звичайного кореня plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакета показуються в diagnostics/info, але ще не підключені до виконання в runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені plugins. Використовуйте `--verbose`, щоб перейти від табличного подання до докладних рядків по кожному plugin із метаданими source/origin/version/activation. Використовуйте `--json` для машиночитаного інвентарю та diagnostics реєстру.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки встановлення через посилання повторно використовують вихідний шлях замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у `plugins.installs`, зберігаючи типову поведінку без фіксації.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, `plugins.installs`, allowlist plugin і пов’язані записи `plugins.load.paths` для встановлень через посилання, якщо це застосовно. Для plugins активної пам’яті слот пам’яті скидається до `memory-core`.

За замовчуванням uninstall також видаляє каталог встановлення plugin у корені plugin активного state-dir. Використовуйте `--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних встановлень наборів hook у `hooks.internal.installs`.

Коли ви передаєте id plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього plugin. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно зафіксовані версії продовжують використовуватися в наступних запусках `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом plugin, оновлює встановлений plugin і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакета без версії чи тега також зіставляється назад із відстежуваним записом plugin. Використовуйте це, коли plugin було зафіксовано на точній версії й ви хочете повернути його на типову лінію релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

Коли існує збережений хеш цілісності й хеш завантаженого артефакту змінюється, OpenClaw трактує це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються помилкою, якщо виклик не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань сканування небезпечного коду під час оновлення plugin. Він усе ще не обходить блокування політик `before_install` plugin або блокування через помилки сканування і застосовується лише до оновлень plugin, а не до оновлень наборів hook.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, hooks, tools, commands, services, methods Gateway, HTTP routes, policy flags, diagnostics, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP server.

Кожен plugin класифікується за тим, що саме він реєструє в runtime:

- **plain-capability** — один тип можливостей (наприклад, plugin лише з provider)
- **hybrid-capability** — кілька типів можливостей (наприклад, text + speech + images)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитаний звіт, придатний для сценаріїв і аудиту.

`inspect --all` відображає зведену таблицю для всього набору з колонками shape, capability kinds, compatibility notices, bundle capabilities і hook summary.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, diagnostics виявлення/маніфесту та compatibility notices. Коли все в порядку, він виводить `Проблем із plugin не виявлено.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, перезапустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту в diagnostics.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку розв’язаного джерела разом із розібраним маніфестом marketplace і записами plugin.
