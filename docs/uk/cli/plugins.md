---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-26T10:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Керуйте плагінами Gateway, пакетами хуків і сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення проблем із плагінами.
  </Card>
  <Card title="Пакети Plugin" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення плагінів.
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
Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); для інших потрібна команда `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою схемою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) плюс виявлені можливості пакета.
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
Імена пакетів без уточнень спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення плагінів так само, як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після невалідної конфігурації">
    Якщо ваш розділ `plugins` використовує однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей підключений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями аварійно завершуються без сплощення. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація невалідна, `plugins install` зазвичай аварійно завершується і радить спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте цей параметр, коли ви свідомо перевстановлюєте той самий ідентифікатор із нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для ідентифікатора плагіна, який уже встановлено, OpenClaw зупиняється й пропонує скористатися `plugins update <id-or-npm-spec>` для звичайного оновлення або `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, тому що встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть якщо вбудований сканер повідомляє про знахідки рівня `critical`, але **не** обходить блокування політики хука `before_install` плагіна і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків install/update плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованого перегляду хуків і вмикання окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні параметри встановлення npm.

    Специфікації без уточнень і `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів у пререліз, OpenClaw зупиняється та просить вас явно погодитися, вказавши тег пререлізу, наприклад `@beta`/`@rc`, або точну версію пререлізу, наприклад `@1.2.3-beta.4`.

    Якщо специфікація встановлення без уточнень збігається з ідентифікатором вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб установити npm-пакет із такою ж назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw повинні містити валідний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи про встановлення.

    Також підтримуються встановлення з marketplace Claude.

  </Accordion>
</AccordionGroup>

Для встановлень із ClawHub використовується явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для безпечних для npm специфікацій плагінів без уточнень. Повернення до npm відбувається лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність gateway, а потім установлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, якщо назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення GitHub-репозиторію, наприклад `owner/repo`
    - URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
    - URL git
  </Tab>
  <Tab title="Правила віддалених marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, які не є шляхами, із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тих самих потоках list/info/enable/disable. Наразі підтримуються bundle skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час runtime.
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
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний перелік плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, а якщо реєстр відсутній або невалідний, використовує резервний варіант, похідний лише від маніфесту. Це корисно для перевірки, чи встановлено плагін, чи увімкнено його та чи видимий він для планування холодного запуску, але це не є живою перевіркою runtime уже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/container-розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованими плагінами всередині запакованого образу Docker змонтуйте вихідний каталог плагіна через bind-mount поверх відповідного запакованого шляху до вихідників, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання вихідників
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог вихідників
залишається неактивним, тому звичайні запаковані встановлення, як і раніше, використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потрібен параметр `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки під час встановлень із посиланням повторно використовується шлях до джерела, а не виконується копіювання в керовану ціль встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Під час установлення та оновлення вони записуються до `plugins/installs.json` в активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довготривалим джерелом метаданих установлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, похідний від маніфесту. Файл містить попередження не редагувати його вручну й використовується командами `openclaw plugins update`, uninstall, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації застарілі shipped-записи `plugins.installs`, він переносить їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб не втратити метадані встановлення.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списку дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, якщо застосовно. Якщо не встановлено `--keep-files`, uninstall також видаляє відстежуваний каталог керованого встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних установлень плагінів у керованому індексі плагінів і до відстежуваних установлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання ідентифікатора плагіна проти специфікації npm">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точні закріплені версії й надалі використовуються в наступних запусках `update <id>`.

    Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад до відстежуваного запису плагіна, оновлює цей установлений плагін і записує нову специфікацію npm для майбутніх оновлень за ідентифікатором.

    Передавання назви npm-пакета без версії або тега також зіставляється назад до відстежуваного запису плагіна. Використовуйте це, коли плагін було закріплено на точній версії й ви хочете повернути його до типової гілки релізів реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим оновленням npm OpenClaw перевіряє версію встановленого пакета за метаданими реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений геш цілісності, а геш отриманого артефакту змінюється, OpenClaw трактує це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний геші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення аварійно завершуються, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він, як і раніше, не обходить блокування політики `before_install` плагіна або блокування через збої сканування й застосовується лише до оновлень плагінів, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспектування

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибоке інспектування одного плагіна. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway, HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен плагін класифікується за тим, що саме він реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і аудиту. `inspect --all` відображає загальнофлотську таблицю з колонками shape, capability kinds, compatibility notices, bundle capabilities і hook summary. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та сповіщення про сумісність. Коли все в порядку, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена модель холодного читання OpenClaw для встановленої ідентичності плагінів, стану ввімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний чи застарілий. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-варіант призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або URL git. `--json` виводить мітку розв’язаного джерела разом із розібраним маніфестом marketplace і записами плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні плагіни](/uk/plugins/community)
