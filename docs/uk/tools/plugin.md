---
read_when:
    - Установлення або налаштування Plugin
    - Розуміння правил виявлення та завантаження Plugin
    - Робота з наборами Plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-26T07:51:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5f774ccc52b70eb8626cc7d5421482079af87566fed3013846a9d7e4b3c0863
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: channels, providers моделей,
harness агентів, tools, Skills, speech, транскрипція в realtime, голос у realtime,
розуміння медіа, генерація зображень, генерація відео, web fetch, вебпошук
тощо. Деякі Plugin є **core** (постачаються з OpenClaw), інші
— **external** (публікуються в npm спільнотою).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # Із локального каталогу або архіву
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню прямо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервно npm).

Якщо конфігурація невалідна, встановлення зазвичай безпечно завершується з відмовою й
спрямовує вас до `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled Plugin
для Plugin, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево runtime-залежностей кожного bundled Plugin.
Коли bundled Plugin, що належить OpenClaw, активний через
конфігурацію plugin, застарілу конфігурацію channel або типово ввімкнений маніфест,
під час запуску відновлюються лише runtime-залежності, оголошені цим Plugin, перед його імпортом.
Сам по собі збережений стан auth channel не активує bundled channel для відновлення runtime-залежностей під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню runtime-залежностей bundled Plugin/channel.
External Plugin і користувацькі шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в тому ж процесі | Офіційні Plugin, npm-пакети спільноти                  |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва з’являються в `openclaw plugins list`. Докладніше про bundle див. у [Набори Plugin](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Створення Plugin](/uk/plugins/building-plugins)
і [Огляду Plugin SDK](/uk/plugins/sdk-overview).

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
  <Accordion title="Providers моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin memory">
    - `memory-core` — bundled пошук у memory (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала memory зі встановленням за потреби та auto-recall/capture (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech providers (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser Plugin для tool browser, CLI `openclaw browser`, методу gateway `browser.request`, runtime browser і типової служби керування browser (увімкнений типово; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin? Див. [Plugin спільноти](/uk/plugins/community).

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

| Поле            | Опис                                                     |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                      |
| `allow`          | Allowlist Plugin (необов’язково)                         |
| `deny`           | Denylist Plugin (необов’язково; deny має пріоритет)      |
| `load.paths`     | Додаткові файли/каталоги Plugin                          |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі + конфігурація для окремого Plugin            |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
watch конфігурації + перезапуском у процесі (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху hot-reload для native runtime-коду Plugin або lifecycle hooks немає;
перезапустіть процес Gateway, який обслуговує live channel, перш ніж
очікувати, що оновлений код `register(api)`, hooks `api.on(...)`, tools, services або
hooks provider/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Плагін зі
статусом `enabled` означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
було перезапущено з тим самим кодом Plugin. У VPS/container-сценаріях із
процесами-обгортками надсилайте перезапуск фактичному процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ID Plugin, який не було знайдено під час виявлення.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує Plugin у такому порядку (перше збігання перемагає):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують
    назад на власні пакетні каталоги bundled Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled Plugin">
    Постачаються з OpenClaw. Багато з них увімкнені типово (providers моделей, speech).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin походженням із workspace **типово вимкнені** (їх потрібно явно ввімкнути)
- Bundled Plugin наслідують вбудований набір, типово ввімкнений, якщо це не перевизначено
- Ексклюзивні slots можуть примусово ввімкнути вибраний Plugin для цього слота
- Деякі bundled opt-in Plugin увімкнюються автоматично, коли конфігурація називає
  surface, що належить Plugin, наприклад ref model provider, конфігурацію channel або
  runtime harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як bundled
  Plugin app-server Codex вибирається через `agentRuntime.id: "codex"` або застарілі
  refs моделей `codex/*`

## Усунення проблем із runtime hooks

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не працюють у live-трафіку чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть live Gateway після змін встановлення/конфігурації/коду Plugin. У wrapper
  containers PID 1 може бути лише supervisor; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію hooks і
  діагностику. Небандлові conversation hooks, такі як `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання model віддавайте перевагу `before_model_resolve`. Він запускається перед
  розв’язанням model для turn агента; `llm_output` запускається лише після того,
  як спроба model створює вивід асистента.
- Щоб підтвердити ефективну session model, використовуйте `openclaw sessions` або
  surface session/status Gateway, а під час налагодження навантажень provider
  запускайте Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння channel або tool

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим channel,
потоком налаштування або ім’ям tool. Найпоширеніша причина — зовнішній channel Plugin,
установлений поруч із bundled Plugin, який тепер надає той самий ID channel.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів Plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін встановлення, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ID channel,
  бажаний Plugin має оголосити `channelConfigs.<channel-id>.preferOver` із
  ID Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу
  інсталяцію Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для channel або перейменуйте tools,
  що належать Plugin, щоб runtime-surface був однозначним.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або id Plugin
    },
  },
}
```

| Слот            | Що він керує            | Типове значення    |
| --------------- | ----------------------- | ------------------ |
| `memory`        | Активний Plugin memory  | `memory-core`      |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише ввімкнені Plugin
openclaw plugins list --verbose            # детальні рядки для кожного Plugin
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд збереженого стану реєстру
openclaw plugins registry --refresh        # перебудова збереженого реєстру
openclaw doctor --fix                      # відновлення стану реєстру Plugin

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезапис наявної інсталяції
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # link (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # запис точного розв’язаного npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити конфігурацію та записи індексу Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled Plugin постачаються разом з OpenClaw. Багато з них увімкнені типово (наприклад
bundled providers моделей, bundled speech providers і bundled
browser Plugin). Інші bundled Plugin усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установленний Plugin або набір hooks на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
Plugin. Це не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль інсталяції.

Коли `plugins.allow` уже встановлено, `openclaw plugins install` додає
ID установленого Plugin до цього allowlist перед його ввімкненням, тож після перезапуску
його можна одразу завантажити.

OpenClaw зберігає локальний реєстр Plugin як модель холодного читання для
переліку Plugin, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану Plugin.
Той самий файл `plugins/installs.json` зберігає тривалі метадані інсталяції в
верхньорівневому `installRecords` і відтворювані метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфесту з записів інсталяції, policy конфігурації та
метаданих manifest/package без завантаження runtime-модулів Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Передача
npm package spec з dist-tag або точною версією розв’язує назву пакета
назад до запису відстежуваного Plugin і записує новий spec для майбутніх оновлень.
Передача назви пакета без версії переводить точно закріплену інсталяцію назад на
типову лінійку релізів реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише для npm. Він не підтримується разом із `--marketplace`, оскільки
інсталяції з marketplace зберігають метадані джерела marketplace замість npm spec.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє продовжити
інсталяцію та оновлення Plugin попри вбудовані результати `critical`, але все одно
не обходить блокування policy `before_install` Plugin або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків install/update Plugin. Установлення залежностей Skills через Gateway
натомість використовує відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/встановлення Skills через ClawHub.

Сумісні bundle беруть участь у тих самих потоках list/inspect/enable/disable
Plugin. Поточна підтримка runtime охоплює Skills bundle, command-Skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-Skills Cursor, а також сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP і LSP server для Plugin на основі bundle.

Джерелами marketplace можуть бути відоме ім’я marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених marketplace записи Plugin мають залишатися всередині
клонованого репозиторію marketplace й використовувати лише відносні джерела шляхів.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins) для повних подробиць.

## Огляд API Plugin

Native Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin мають
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час
активації Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але bundled Plugin і нові external Plugin мають вважати `register` публічним контрактом.

`api.registrationMode` повідомляє Plugin, чому завантажується його об’єкт входу:

| Режим           | Значення                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструє tools, hooks, services, commands, routes та інші live побічні ефекти.                              |
| `discovery`     | Виявлення можливостей у режимі лише читання. Реєструє providers і метадані; код входу довіреного Plugin може завантажуватися, але live побічні ефекти слід пропускати. |
| `setup-only`    | Завантаження метаданих налаштування channel через полегшений запис налаштування.                                                |
| `setup-runtime` | Завантаження налаштування channel, якому також потрібен запис runtime.                                                           |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                              |

Об’єкти входу Plugin, які відкривають sockets, бази даних, фонові воркери або довгоживучі
клієнти, мають захищати ці побічні ефекти умовою `api.registrationMode === "full"`.
Завантаження для discovery кешуються окремо від активувальних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений об’єкт входу Plugin або модуль channel Plugin, щоб побудувати
знімок. Зберігайте верхні рівні модуля легкими й без побічних ефектів і переносіть
мережевих клієнтів, subprocesses, listeners, читання облікових даних і запуск служб
за межі повного runtime-шляху.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| -------------------------------------- | -------------------------- |
| `registerProvider`                     | Provider моделей (LLM)     |
| `registerChannel`                      | Канал чату                 |
| `registerTool`                         | Tool агента                |
| `registerHook` / `on(...)`             | Lifecycle hooks            |
| `registerSpeechProvider`               | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider`| Потоковий STT              |
| `registerRealtimeVoiceProvider`        | Двобічний голос у realtime |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`      | Генерація зображень        |
| `registerMusicGenerationProvider`      | Генерація музики           |
| `registerVideoGenerationProvider`      | Генерація відео            |
| `registerWebFetchProvider`             | Provider web fetch / scrape|
| `registerWebSearchProvider`            | Вебпошук                   |
| `registerHttpRoute`                    | HTTP endpoint              |
| `registerCommand` / `registerCli`      | Команди CLI                |
| `registerContextEngine`                | Context engine             |
| `registerService`                      | Фонова служба              |

Поведінка guard hooks для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії й не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії й не скасовує попереднє скасування.

Native app-server Codex bridge повертає події native tools Codex назад у цю
поверхню hooks. Plugin можуть блокувати native tools Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленні
`PermissionRequest` Codex. Bridge поки що не переписує аргументи native tools Codex.
Точна межа підтримки runtime Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих hooks див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins) — створіть власний Plugin
- [Набори Plugin](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест Plugin](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання tools агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Plugin спільноти](/uk/plugins/community) — сторонні переліки
