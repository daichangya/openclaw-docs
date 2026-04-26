---
read_when:
    - Установлення або налаштування Plugin-ів
    - Розуміння правил виявлення та завантаження Plugin-ів
    - Робота з сумісними з Codex/Claude пакетами Plugin-ів
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugin-ы
x-i18n:
    generated_at: "2026-04-26T07:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48348e09d38a5cce734098cdcbbc2e37a38928754bfed488e273407f3006d877
    source_path: tools/plugin.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, постачальники моделей,
agent harnesses, інструменти, Skills, мовлення, розпізнавання мовлення в
реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, web fetch, web search тощо. Деякі Plugin є **core**
(постачаються з OpenClaw), інші — **external** (публікуються в npm спільнотою).

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

Якщо ви надаєте перевагу керуванню безпосередньо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях інсталяції використовує той самий механізм розв’язання, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний перехід до npm).

Якщо конфігурація невалідна, інсталяція зазвичай завершується в закритому режимі й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого Plugin для Plugin, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не встановлюють наперед усе дерево залежностей
середовища виконання кожного вбудованого Plugin. Коли вбудований Plugin,
що належить OpenClaw, активний через конфігурацію Plugin, застарілу
конфігурацію каналу або маніфест із типовим увімкненням, під час запуску
відновлюються лише оголошені залежності середовища виконання цього Plugin перед його імпортом.
Сам по собі збережений стан автентифікації каналу не активує вбудований канал для
відновлення залежностей середовища виконання під час запуску Gateway.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих залежностей середовища виконання для цього Plugin/каналу.
External Plugin і власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи Plugin

OpenClaw розпізнає два формати Plugin:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні Plugin, пакети npm від спільноти               |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundle див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
і [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні Plugin

### Установлювані (npm)

| Plugin          | Пакет                 | Документація                          |
| --------------- | --------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams)  |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)    |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять з інсталяцією на вимогу та автоматичним recall/capture (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для інструмента browser, CLI `openclaw browser`, методу gateway `browser.request`, середовища виконання browser і типового сервісу керування browser (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні Plugin? Див. [Community Plugins](/uk/plugins/community).

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
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для кожного Plugin             |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native коду середовища виконання Plugin або хуків
життєвого циклу немає; перезапустіть процес Gateway, який обслуговує живий канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки постачальника/середовища виконання запрацюють.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації Plugin. Якщо
Plugin там `enabled`, це означає, що збережений реєстр і поточна конфігурація дозволяють
Plugin брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній Gateway
перезапустився з тим самим кодом Plugin. На VPS/контейнерних конфігураціях із
процесами-обгортками надсилайте перезапуски саме до процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` проти запущеного Gateway.

<Accordion title="Стани Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ID Plugin, який не знайдено під час виявлення.
  - **Invalid**: Plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення і пріоритет

OpenClaw сканує Plugin у такому порядку (перше знайдене збігання перемагає):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, що вказують
    назад на власні пакетні каталоги вбудованих Plugin OpenClaw, ігноруються;
    виконайте `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні Plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані Plugin">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі Plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей Plugin
- Plugin із робочого простору **типово вимкнені** (їх потрібно ввімкнути явно)
- Вбудовані Plugin дотримуються вбудованого набору типово ввімкнених, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути Plugin, вибраний для цього слота
- Деякі вбудовані opt-in Plugin увімкнюються автоматично, коли конфігурація вказує поверхню,
  що належить Plugin, як-от посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі Plugin:
  `openai-codex/*` належить Plugin OpenAI, тоді як вбудований Plugin
  сервера застосунку Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення несправностей хуків середовища виконання

Якщо Plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не працюють у трафіку живого чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть живий Gateway після інсталяції/зміни конфігурації/коду Plugin. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані розмовні хуки, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він запускається перед
  розв’язанням моделі для ходів агента; `llm_output` запускається лише після того, як спроба моделі
  сформувала вивід помічника.
- Щоб підтвердити ефективну модель сесії, використовуйте `openclaw sessions` або поверхні
  сесії/статусу Gateway і, під час налагодження payload постачальника, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений Plugin намагається володіти тим самим каналом,
потоком налаштування або ім’ям інструмента. Найчастіша причина — зовнішній Plugin каналу,
встановлений поруч із вбудованим Plugin, який тепер надає той самий ID каналу.

Кроки налагодження:

- Запустіть `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений Plugin
  і його походження.
- Запустіть `openclaw plugins inspect <id> --json` для кожного підозрюваного Plugin і
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Запустіть `openclaw plugins registry --refresh` після встановлення або видалення пакетів
  Plugin, щоб збережені метадані відображали поточну інсталяцію.
- Перезапустіть Gateway після змін інсталяції, реєстру або конфігурації.

Варіанти виправлення:

- Якщо один Plugin навмисно замінює інший для того самого ID каналу,
  бажаний Plugin має оголосити `channelConfigs.<channel-id>.preferOver` з
  ID Plugin нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застарілу інсталяцію Plugin.
- Якщо ви явно ввімкнули обидва Plugin, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте інструменти,
  що належать Plugin, щоб поверхня середовища виконання була однозначною.

## Слоти Plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або ID Plugin
    },
  },
}
```

| Слот            | Чим керує              | Типове значення     |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Активний Plugin пам’яті | `memory-core`       |
| `contextEngine` | Активний context engine | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише увімкнені Plugin
openclaw plugins list --verbose            # деталі по кожному Plugin
openclaw plugins list --json               # машинозчитуваний перелік
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машинозчитувано
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд збереженого стану реєстру
openclaw plugins registry --refresh        # перебудувати збережений реєстр
openclaw doctor --fix                      # відновити стан реєстру Plugin

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявну інсталяцію
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити конфігурацію й записи індексу Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані Plugin постачаються разом з OpenClaw. Багато з них увімкнено за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований
browser Plugin). Інші вбудовані Plugin все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує вже встановлений Plugin або пакет хуків на місці. Для звичайних оновлень відстежуваних npm
Plugin використовуйте `openclaw plugins update <id-or-npm-spec>`.
Це не підтримується разом із `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль інсталяції.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ID встановленого Plugin до цього allowlist перед його ввімкненням, тож після перезапуску
інсталяції одразу можна завантажувати.

OpenClaw зберігає локальний реєстр Plugin як модель для холодного читання для
переліку Plugin, володіння внесками та планування запуску. Потоки install, update,
uninstall, enable і disable оновлюють цей реєстр після зміни стану
Plugin. Той самий файл `plugins/installs.json` зберігає тривалі метадані інсталяцій у
верхньорівневому `installRecords` і метадані маніфестів, які можна перебудувати, у `plugins`. Якщо
реєстр відсутній, застарів або невалідний, `openclaw plugins registry
--refresh` перебудовує його представлення маніфестів із записів інсталяції, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання Plugin.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних інсталяцій. Якщо
передати специфікацію npm-пакета з dist-tag або точною версією, назва пакета
буде зіставлена назад із записом відстежуваного Plugin, а нова специфікація буде збережена
для майбутніх оновлень. Якщо передати назву пакета без версії, точно закріплена інсталяція
повертається до типової гілки релізів реєстру. Якщо встановлений npm Plugin уже відповідає
розв’язаній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, тому що
інсталяції marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний перемикач для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжувати інсталяцію
та оновлення Plugin попри вбудовані знахідки рівня `critical`, але все одно
не обходить блокування політики Plugin `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків install/update Plugin. Установлення залежностей Skills через Gateway
використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` лишається окремим потоком завантаження/установлення Skills із ClawHub.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable
Plugin. Поточна підтримка середовища виконання включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи серверів MCP і LSP для Plugin на основі bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом
`marketplace.json`, скороченням GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. Для віддалених
marketplace записи Plugin мають залишатися всередині клонованого репозиторію marketplace
і використовувати лише відносні шляхи до джерел.

Повні подробиці див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Native Plugin експортують об’єкт входу, який надає `register(api)`. Старіші
Plugin ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові Plugin повинні
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

OpenClaw завантажує об’єкт входу й викликає `register(api)` під час активації
Plugin. Завантажувач усе ще повертається до `activate(api)` для старіших Plugin,
але вбудовані Plugin і нові external Plugin мають вважати `register`
публічним контрактом.

`api.registrationMode` повідомляє Plugin, чому його об’єкт входу завантажується:

| Режим           | Значення                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, сервіси, команди, маршрути та інші побічні ефекти живого виконання. |
| `discovery`     | Лише читання для виявлення можливостей. Реєструйте постачальників і метадані; код об’єкта входу довіреного Plugin може завантажуватися, але без живих побічних ефектів. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                                                  |
| `setup-runtime` | Завантаження налаштування каналу, якому також потрібен об’єкт входу середовища виконання.                                        |
| `cli-metadata`  | Лише збирання метаданих команди CLI.                                                                                              |

Об’єкти входу Plugin, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, повинні захищати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений об’єкт входу Plugin або модуль Plugin каналу, щоб побудувати
знімок. Тримайте верхній рівень модулів легким і без побічних ефектів та переносіть
мережевих клієнтів, підпроцеси, слухачів, читання облікових даних і запуск сервісів
за повні шляхи середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                  |
| -------------------------------------- | ---------------------------- |
| `registerProvider`                     | Постачальник моделі (LLM)    |
| `registerChannel`                      | Канал чату                   |
| `registerTool`                         | Інструмент агента            |
| `registerHook` / `on(...)`             | Хуки життєвого циклу         |
| `registerSpeechProvider`               | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider`| Потокове STT                 |
| `registerRealtimeVoiceProvider`        | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`      | Генерація зображень          |
| `registerMusicGenerationProvider`      | Генерація музики             |
| `registerVideoGenerationProvider`      | Генерація відео              |
| `registerWebFetchProvider`             | Постачальник web fetch / scrape |
| `registerWebSearchProvider`            | Web search                   |
| `registerHttpRoute`                    | HTTP endpoint                |
| `registerCommand` / `registerCli`      | Команди CLI                  |
| `registerContextEngine`                | Context engine               |
| `registerService`                      | Фоновий сервіс               |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не робить нічого й не знімає попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не робить нічого й не знімає попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не робить нічого й не знімає попереднє скасування.

Native запуски сервера застосунку Codex зводять нативні події інструментів Codex назад у цю
поверхню хуків. Plugin можуть блокувати нативні інструменти Codex через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи нативних інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building plugins](/uk/plugins/building-plugins) — створіть власний Plugin
- [Plugin bundles](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Plugin manifest](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community plugins](/uk/plugins/community) — сторонні переліки
