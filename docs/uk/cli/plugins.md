---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними наборами
    - Ви хочете налагодити збої завантаження плагінів
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T09:31:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cb87aadf464686b521ca352bdc40a160cb18f7755abe54cbd42eefd4e037d38
    source_path: cli/plugins.md
    workflow: 15
---

Керуйте плагінами Gateway, наборами хуків і сумісними наборами.

<CardGroup cols={2}>
  <Card title="Система плагінів" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей плагінів.
  </Card>
  <Card title="Набори плагінів" href="/uk/plugins/bundles">
    Модель сумісності наборів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлень плагінів.
  </Card>
</CardGroup>

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

<Note>
Вбудовані плагіни постачаються разом з OpenClaw. Деякі увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Натомість сумісні набори використовують власні маніфести наборів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип набору (`codex`, `claude` або `cursor`) і виявлені можливості набору.
</Note>

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

<Warning>
Імена пакетів без префіксів спочатку перевіряються у ClawHub, а потім у npm. Ставтеся до встановлення плагінів так само, як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після невалідної конфігурації">
    Якщо ваш розділ `plugins` базується на однофайловому `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й не змінюють `openclaw.json`. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються безпечною відмовою замість сплощення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація невалідна, `plugins install` зазвичай завершується безпечною відмовою й радить спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force та перевстановлення vs update">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту. Для звичайних оновлень уже відстежуваного npm-плагіна віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви виконаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиниться й порадить `plugins update <id-or-npm-spec>` для звичайного оновлення або `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до npm-встановлень. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не npm-специфікацію.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про результати рівня `critical`, але **не** обходить блокування політики хуків `before_install` плагіна і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення навичок із ClawHub.

  </Accordion>
  <Accordion title="Набори хуків і npm-специфікації">
    `plugins install` також є поверхнею встановлення для наборів хуків, які оголошують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і вмикання окремих хуків, а не для встановлення пакетів.

    Npm-специфікації є **лише реєстровими** (назва пакета + необов'язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей запускаються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці задано глобальні налаштування встановлення npm.

    Специфікації без префіксів і `@latest` залишаються на стабільній гілці. Якщо npm розв'язує будь-яку з них до попереднього релізу, OpenClaw зупиняється й просить вас явно погодитися на це за допомогою тега попереднього релізу, наприклад `@beta`/`@rc`, або точної версії попереднього релізу, наприклад `@1.2.3-beta.4`.

    Якщо специфікація встановлення без префікса збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб установити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити валідний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, які містять лише `package.json`, відхиляються ще до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з marketplace Claude.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для npm-безпечних специфікацій плагінів без префіксів. До npm він повертається лише якщо в ClawHub немає такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність з gateway, а потім установлює його через звичайний шлях архіву. Записані встановлення зберігають метадані свого джерела ClawHub для подальших оновлень.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, якщо назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях до `marketplace.json`
    - скорочення GitHub-репозиторію, наприклад `owner/repo`
    - URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
    - git URL
  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів та архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex набори (`.codex-plugin/plugin.json`)
- сумісні з Claude набори (`.claude-plugin/plugin.json` або типова структура компонентів Claude)
- сумісні з Cursor набори (`.cursor-plugin/plugin.json`)

<Note>
Сумісні набори встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються навички наборів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості наборів показуються в diagnostics/info, але ще не підключені до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише увімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими про джерело/походження/версію/активацію.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар і діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, а якщо реєстр відсутній або невалідний — використовує похідний резервний варіант лише з маніфестом. Це корисно, щоб перевірити, чи плагін установлено, увімкнено і чи він видимий для планування холодного запуску, але це не є живою перевіркою середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для налагодження хуків під час виконання:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та діагностику з проходу перевірки із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки про службу/процес, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потрібен `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки встановлення з посиланням повторно використовують вихідний шлях замість копіювання у керовану ціль встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв'язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишивши типову поведінку без закріплення.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують їх у `plugins/installs.json` у активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, похідний від маніфестів. Файл містить попередження не редагувати його вручну та використовується `openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації наявні успадковані записи `plugins.installs`, він переносить їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який із записів не вдається, записи конфігурації зберігаються, щоб не втратити метадані встановлення.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів з `plugins.entries`, збереженого індексу плагінів, записів списку дозволу/заборони плагінів і записів пов’язаних `plugins.load.paths`, коли це застосовно. Якщо не встановлено `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він знаходиться всередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна та npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно закріплені версії продовжать використовуватися в наступних запусках `update <id>`.

    Для npm-встановлень ви також можете передати явну npm-специфікацію пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії чи тега також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії й ви хочете повернути його до типової лінії релізів реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш завантаженого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікувані й фактичні хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються безпечною відмовою, якщо виклик не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна чи блокування через збої сканування й застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока перевірка для одного плагіна. Показує ідентичність, статус завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, служби, методи gateway, HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості набору та будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен плагін класифікується за тим, що саме він реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей чи поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Див. [Форми плагінів](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і аудиту. `inspect --all` виводить загальносистемну таблицю з колонками форми, типів можливостей, повідомлень про сумісність, можливостей набору та підсумку хуків. `info` — це псевдонім для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та повідомлення про сумісність. Якщо все в порядку, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий підсумок форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена модель холодного читання OpenClaw для ідентичності встановлених плагінів, їхнього стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр існує, чи він актуальний, чи застарілий. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку розв’язаного джерела разом із розібраним маніфестом marketplace і записами плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
