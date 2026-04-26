---
read_when:
    - Установлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з bundle Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-26T03:56:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa9c2bb91aa248d8454faabed7622f44a28f261734645017d059bb8a09e8e7ac
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
harness-и агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші
— **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Переглянути, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установити Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # Із локального каталогу або архіву
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустити Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або проста специфікація пакета (спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація невалідна, установлення зазвичай завершується fail-closed і спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого Plugin
для plugins, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Упаковані встановлення OpenClaw не виконують завчасне встановлення всього дерева залежностей середовища виконання для кожного вбудованого Plugin. Коли вбудований Plugin від OpenClaw активний через
конфігурацію plugin, застарілу конфігурацію каналу або маніфест із типово ввімкненим станом, під час запуску
відновлюються лише оголошені залежності середовища виконання цього plugin перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання вбудованого plugin для цього plugin/каналу.
External plugins і власні шляхи завантаження, як і раніше, слід установлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати plugins:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні plugins, npm-пакети спільноти                 |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundles див. у [Набори Plugin](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
та [Огляду Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні Plugin

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється за потреби, з автоматичним recall/capture (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для browser tool, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і типового сервісу керування браузером (увімкнений типово; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Plugins спільноти](/uk/plugins/community).

## Конфігурація

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Поле             | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Allowlist Plugin (необов’язково)                          |
| `deny`           | Denylist Plugin (необов’язково; deny має пріоритет)       |
| `load.paths`     | Додаткові файли/каталоги Plugin                           |
| `slots`          | Селектори ексклюзивних слотів (наприклад `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для конкретного Plugin          |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
такий перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для native коду середовища виконання Plugin або lifecycle
hooks немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, hooks `api.on(...)`, інструменти, сервіси або
hooks провайдера/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/config Plugin. Позначка
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
plugin брати участь. Це не доводить, що вже запущений дочірній remote Gateway
було перезапущено в той самий код plugin. У налаштуваннях VPS/контейнерів із
процесами-обгортками надсилайте перезапуск фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор Plugin, який не було знайдено під час виявлення.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перше збігання перемагає):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні упаковані каталоги вбудованих plugins OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugins робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugins, що походять із робочого простору, **типово вимкнені** (їх треба ввімкнути явно)
- Вбудовані plugins наслідують вбудований набір, типово ввімкнений, якщо немає перевизначення
- Ексклюзивні слоти можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі вбудовані plugins з опціональним ввімкненням автоматично активуються, коли конфігурація вказує на
  поверхню, що належить plugin, наприклад посилання на модель провайдера, конфігурацію каналу або
  середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі plugins:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із hooks середовища виконання

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не запускаються в реальному чат-трафіку, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — це саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після встановлення/зміни конфігурації/зміни коду plugin. У контейнерах
  з обгортками PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks та
  діагностику. Невбудовані hooks розмови, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він запускається перед
  визначенням моделі для ходів агента; `llm_output` запускається лише після того,
  як спроба моделі вже породила відповідь помічника.
- Щоб підтвердити фактичну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway, а при налагодженні payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
процесом налаштування або назвою інструмента. Найпоширеніша причина — зовнішній plugin каналу,
установлений поряд із вбудованим plugin, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів plugin, щоб збережені метадані відповідали поточному встановленню.
- Перезапустіть Gateway після змін установлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ідентифікатора каналу, бажаний
  Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ідентифікатором Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле
  встановлення plugin.
- Якщо ви явно ввімкнули обидва plugins, OpenClaw зберігає цей вибір і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти, що належать plugin, щоб поверхня середовища виконання була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none" для вимкнення
      contextEngine: "legacy", // або id plugin
    },
  },
}
```

| Слот            | Що він керує               | Типове значення     |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Active Memory Plugin       | `memory-core`       |
| `contextEngine` | Активний context engine    | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише ввімкнені plugins
openclaw plugins list --verbose            # докладні рядки для кожного plugin
openclaw plugins list --json               # перелік у форматі для машинного читання
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # формат для машинного читання
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд збереженого стану реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # прив’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації та індексу plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins постачаються разом з OpenClaw. Багато з них увімкнено типово (наприклад
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser
plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений plugin або hook pack на місці. Для
звичайних оновлень відстежуваних npm plugins використовуйте
`openclaw plugins update <id-or-npm-spec>`. Він не підтримується разом із `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль установлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор установленого plugin до цього allowlist перед його ввімкненням, тож установлені plugins
можна відразу завантажувати після перезапуску.

OpenClaw підтримує збережений локальний реєстр Plugin як cold read model для
обліку plugin, володіння внесками та планування запуску. Процеси встановлення, оновлення,
видалення, увімкнення та вимкнення оновлюють цей реєстр після зміни
стану plugin. Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення в
top-level `installRecords` і метадані маніфесту, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарів або невалідний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту на основі записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією повертає назву пакета
до відстежуваного запису plugin і зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад до
типової лінії релізів реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та збереженій ідентичності артефакта, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` стосується лише npm. Він не підтримується разом із `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний обхід для хибнопозитивних спрацьовувань
вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення plugins попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через збої сканування.

Цей прапорець CLI застосовується лише до процесів встановлення/оновлення plugin. Установлення залежностей Skills через Gateway
натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` лишається окремим процесом завантаження/установлення Skills з ClawHub.

Сумісні bundles беруть участь у тих самих процесах list/inspect/enable/disable
для plugins. Поточна підтримка середовища виконання включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, Claude `.lsp.json` і типові значення
`lspServers`, оголошені в маніфесті, Cursor command-skills та
сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP і LSP server для plugins на основі bundles.

Джерелами marketplace можуть бути відома назва Claude marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи plugin мають залишатися всередині
клонованого репозиторію marketplace й використовувати лише відносні джерела шляхів.

Повні відомості див. в [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

Native plugins експортують entry object, який надає `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові plugins мають
використовувати `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw завантажує entry object і викликає `register(api)` під час
активації plugin. Завантажувач усе ще повертається до `activate(api)` для старіших plugins,
але вбудовані plugins і нові external plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, чому завантажується його entry:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, hooks, сервіси, команди, маршрути та інші побічні ефекти live.        |
| `discovery`     | Виявлення можливостей у режимі лише читання. Реєструйте провайдерів і метадані; код entry довіреного plugin може завантажуватися, але пропускайте live побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений setup entry.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен runtime entry.                                                          |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                            |

Entry Plugin, які відкривають сокети, бази даних, фонові worker-и або довготривалі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Виявлення не є активацією, але й не є безімпортним:
OpenClaw може обчислювати trusted entry plugin або модуль channel plugin, щоб зібрати
знімок. Тримайте верхні рівні модулів легкими та без побічних ефектів, а мережевих клієнтів,
підпроцеси, слухачі, читання облікових даних і запуск сервісів переміщуйте
за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)      |
| `registerChannel`                      | Чат-канал                   |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Hooks життєвого циклу       |
| `registerSpeechProvider`               | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двоспрямований голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Провайдер отримання/скрейпінгу вебданих |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | HTTP endpoint               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Context engine              |
| `registerService`                      | Фоновий сервіс              |

Поведінка guard для типізованих hooks життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії і не скасовує попереднє скасування.

Native app-server Codex повертає bridge-події нативних інструментів Codex назад у цю
поверхню hooks. Plugins можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Набори Plugin](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugins спільноти](/uk/plugins/community) — списки сторонніх plugins
