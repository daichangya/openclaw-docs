---
read_when:
    - Ви хочете встановити або керувати Plugin для Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T06:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e324995fa2dbb5babb9631714eb2449a1c8c00411bf6bf44c4c74bc9a3e2b8
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте Plugin для Gateway, пакетами хуків і сумісними пакетами.

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

Вбудовані Plugin постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний
Plugin); для інших потрібна команда `plugins enable`.

Нативні Plugin OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON
Schema (`configSchema`, навіть якщо вона порожня). Натомість сумісні пакети використовують
власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info
також показує підтип пакета (`codex`, `claude` або `cursor`), а також виявлені
можливості пакета.

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

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки:
ставтеся до встановлення Plugin так, ніби ви запускаєте код. Віддавайте перевагу закріпленим версіям.

Якщо конфігурація некоректна, `plugins install` зазвичай безпечно завершується з помилкою і пропонує
спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький
шлях відновлення для вбудованих Plugin, які явно вмикають
`openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення і перезаписує вже встановлений
Plugin або пакет хуків на місці. Використовуйте його, коли ви свідомо перевстановлюєте
той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту.
Для звичайного оновлення вже відстежуваного npm Plugin краще використовувати
`openclaw plugins update <id-or-npm-spec>`.

`--pin` застосовується лише до встановлень із npm. Він не підтримується з `--marketplace`,
оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не
специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань
вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть
коли вбудований сканер повідомляє про знахідки рівня `critical`, але **не**
обходить блокування політики хуків Plugin `before_install` і **не** обходить збої
сканування.

Цей прапорець CLI застосовується до сценаріїв встановлення/оновлення Plugin. Встановлення
залежностей Skills через Gateway використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
сценарієм завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для пакетів хуків, які експонують
`openclaw.hooks` у `package.json`. Для фільтрованої видимості хуків і вмикання окремих
хуків використовуйте `openclaw hooks`, а не встановлення пакета.

Специфікації npm — **лише для registry** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення
залежностей виконуються з `--ignore-scripts` задля безпеки.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує
будь-яку з них у prerelease, OpenClaw зупиняється і просить вас явно погодитися
на це через prerelease-тег, наприклад `@beta`/`@rc`, або точну prerelease-версію,
наприклад `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого Plugin (наприклад `diffs`), OpenClaw
встановлює вбудований Plugin безпосередньо. Щоб установити npm-пакет із такою самою
назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих npm-безпечних специфікацій Plugin. Він переходить
до npm лише якщо в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену
сумісність API Plugin / мінімальну сумісність із gateway, а потім установлює його
через звичайний шлях роботи з архівами. Записані встановлення зберігають метадані
джерела ClawHub для подальших оновлень.

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
- локальний корінь marketplace або шлях до `marketplace.json`
- скорочений запис GitHub-репозиторію, наприклад `owner/repo`
- URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися
всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними
шляхами з цього репозиторію і відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші
джерела Plugin, що не є шляхами, з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування
  компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються до звичайного кореня Plugin і беруть участь
у тому самому сценарії list/info/enable/disable. Наразі підтримуються bundle Skills,
command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` /
`lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні
каталоги хуків Codex; інші виявлені можливості пакета показуються в diagnostics/info,
але ще не підключені до виконання під час runtime.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені Plugin. Використовуйте `--verbose`, щоб перейти
від табличного подання до докладних рядків для кожного Plugin із метаданими
джерела/походження/версії/активації. Використовуйте `--json` для машиночитаного переліку
разом із diagnostics реєстру.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки linked-встановлення повторно використовують
вихідний шлях замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` під час встановлень із npm, щоб зберегти точну розв’язану специфікацію (`name@version`) у
`plugins.installs`, зберігаючи типову поведінку без закріплення за замовчуванням.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin із `plugins.entries`, `plugins.installs`,
списку дозволених Plugin і записів linked `plugins.load.paths`, якщо це застосовно.
Для Plugin Active Memory слот пам’яті скидається до `memory-core`.

За замовчуванням `uninstall` також видаляє каталог встановлення Plugin у межах активного
кореня plugin у state-dir. Використовуйте
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

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних
встановлень пакетів хуків у `hooks.internal.installs`.

Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього
Plugin. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точні
закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

Для встановлень із npm ви також можете передати явну npm-специфікацію пакета з dist-tag
або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin,
оновлює цей установлений Plugin і записує нову npm-специфікацію для майбутніх
оновлень за id.

Передавання назви npm-пакета без версії або тега також зіставляє її назад
із відстежуваним записом Plugin. Використовуйте це, коли Plugin було закріплено на точній версії, а
ви хочете повернути його до стандартної гілки релізів реєстру.

Перед живим оновленням із npm OpenClaw перевіряє встановлену версію пакета за метаданими
реєстру npm. Якщо встановлена версія і записана ідентичність артефакту
вже відповідають розв’язаній цілі, оновлення пропускається без
завантаження, перевстановлення або переписування `openclaw.json`.

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється,
OpenClaw трактує це як drift npm-артефакту. Інтерактивна команда
`openclaw plugins update` виводить очікуваний і фактичний хеші та просить
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються з помилкою,
якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час
оновлень Plugin. Він однаково не обходить блокування політики `before_install`
Plugin або блокування через збої сканування і застосовується лише до оновлень Plugin,
а не до оновлень пакетів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного Plugin. Показує ідентичність, статус завантаження, джерело,
зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway,
HTTP-маршрути, прапорці політик, diagnostics, метадані встановлення, можливості пакета,
а також будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен Plugin класифікується за тим, що саме він реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, Plugin лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і
аудиту.

`inspect --all` відображає загальносистемну таблицю з колонками для shape, видів
можливостей, приміток про сумісність, можливостей пакета і підсумку хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, diagnostics маніфесту/виявлення та
повідомлення про сумісність. Коли все в порядку, він виводить `No plugin issues
detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно виконайте
команду з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати стислий підсумок форми експорту
до diagnostics-виводу.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`,
скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json`
виводить розв’язану мітку джерела, а також розібраний маніфест marketplace і
записи Plugin.
