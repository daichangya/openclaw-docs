---
read_when:
    - Установлення або налаштування plugins
    - Розуміння правил виявлення та завантаження pluginів
    - Робота з сумісними з Codex/Claude пакунками pluginів
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T02:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e41595020c5f1702e3288eb07c88482cb820b78b33ea27154af788e8da80fa1
    source_path: tools/plugin.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
agent harnesses, інструменти, Skills, мовлення, транскрибування в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук
тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші —
**external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть plugin">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі config.

  </Step>
</Steps>

Якщо ви надаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий resolver, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або звичайну специфікацію пакета (спочатку
ClawHub, потім резервний перехід до npm).

Якщо config невалідний, установлення зазвичай безпечно завершується відмовою і
вказує вам на `openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
повторного встановлення вбудованого plugin для plugins, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють завчасно дерево runtime-залежностей
кожного вбудованого plugin. Коли вбудований plugin OpenClaw активний через
config plugin, застарілий config каналу або маніфест із увімкненням за замовчуванням,
startup відновлює лише оголошені runtime-залежності цього plugin перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню runtime-залежностей вбудованого plugin/каналу.
External plugins і власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи pluginів

OpenClaw розпізнає два формати pluginів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в тому самому процесі | Офіційні plugins, пакети npm від спільноти             |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundle див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні plugins

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Документація                        |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)  |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнено за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять з установленням на вимогу з автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнено за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser plugin для інструмента browser, CLI `openclaw browser`, gateway-методу `browser.request`, runtime browser і служби керування browser за замовчуванням (увімкнено за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнено)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Community Plugins](/uk/plugins/community).

## Config

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
| `allow`          | Список дозволених pluginів (необов’язково)                |
| `deny`           | Список заборонених pluginів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги pluginів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та config для кожного plugin окремо            |

Зміни config **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням config + увімкненим перезапуском у межах процесу (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису config.
Підтримуваного шляху гарячого перезавантаження для native runtime-коду plugin або lifecycle
hooks немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, hooks `api.on(...)`, інструменти, служби або
hooks провайдера/runtime почнуть виконуватися.

`openclaw plugins list` — це локальний знімок CLI/config. Стан `loaded`
для plugin там означає, що plugin можна виявити й завантажити з config/файлів, які бачить
цей виклик CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом plugin. У середовищах VPS/контейнерів з процесами-обгортками
надсилайте перезапуск фактичному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани pluginів: disabled vs missing vs invalid">
  - **Disabled**: plugin існує, але правила ввімкнення його вимкнули. Config зберігається.
  - **Missing**: config посилається на id plugin, якого не знайдено під час виявлення.
  - **Invalid**: plugin існує, але його config не відповідає оголошеній schema.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перше знайдене співпадіння перемагає):

<Steps>
  <Step title="Шляхи з config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugins робочої області">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugins">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins із джерелом у робочій області **типово вимкнені** (їх треба явно ввімкнути)
- Вбудовані plugins дотримуються вбудованого набору з увімкненням за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово вмикати plugin, вибраний для цього слота
- Деякі вбудовані opt-in plugins вмикаються автоматично, коли config називає
  поверхню, якою володіє plugin, наприклад ref моделі провайдера, config каналу або
  runtime harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі pluginів:
  `openai-codex/*` належить plugin OpenAI, тоді як вбудований plugin
  сервера застосунку Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  ref моделей `codex/*`

## Усунення проблем із runtime hooks

Якщо plugin з’являється в `plugins list`, але побічні ефекти `register(api)` або hooks
не виконуються в трафіку активного чату, спершу перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях config і процес — це саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після встановлення plugin, змін config або коду. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації hooks і
  діагностику. Невбудовані hooks розмов, як-от `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` запускається лише після того,
  як спроба моделі створить вихід assistant.
- Щоб підтвердити ефективну модель сесії, використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження payload провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти pluginів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один plugin):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або id plugin
    },
  },
}
```

| Слот            | Що він контролює        | Типове значення     |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory plugin    | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені plugins
openclaw plugins list --verbose            # докладні рядки для кожного plugin
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # глибока деталізація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи config/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані plugins постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser
plugin). Інші вбудовані plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або пакет hook-ів на місці. Для звичайних оновлень
відстежуваних npm-plugins використовуйте `openclaw plugins update <id-or-npm-spec>`.
Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає id
встановленого plugin до цього allowlist перед його ввімкненням, тож установлені plugins
можна завантажувати одразу після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією розв’язує ім’я пакета
назад до відстежуваного запису plugin і записує нову специфікацію для майбутніх оновлень.
Передавання імені пакета без версії переводить точно закріплене встановлення назад на
типову лінію випуску реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, повторного встановлення чи перезапису config.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний override для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення pluginів попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політики plugin `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення pluginів. Установлення
залежностей Skills через Gateway натомість використовують відповідний override запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Сумісні bundle беруть участь у тих самих потоках list/inspect/enable/disable
pluginів. Поточна підтримка runtime включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні каталоги
hook-ів Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
підтримувані або непідтримувані записи MCP і LSP server для plugins на основі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи pluginів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API pluginів

Native plugins експортують об’єкт точки входу, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт точки входу й викликає `register(api)` під час
активації plugin. Завантажувач усе ще переходить до `activate(api)` для старіших pluginів,
але вбудовані plugins і нові external plugins мають розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє plugin, чому завантажується його точка входу:

| Режим           | Значення                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація runtime. Реєструє інструменти, hooks, служби, команди, маршрути та інші побічні ефекти в активному середовищі.     |
| `discovery`     | Виявлення можливостей лише для читання. Реєструє провайдерів і метадані; код точки входу довіреного plugin може завантажуватися, але без побічних ефектів активного середовища. |
| `setup-only`    | Завантаження метаданих setup каналу через полегшену точку входу setup.                                                         |
| `setup-runtime` | Завантаження setup каналу, якому також потрібна точка входу runtime.                                                            |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                             |

Точки входу pluginів, які відкривають сокети, бази даних, фонові worker-и або довготривалі
clients, мають захищати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження discovery кешуються окремо від активувальних завантажень і не замінюють
реєстр запущеного Gateway. Discovery не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірену точку входу plugin або модуль plugin каналу, щоб побудувати
знімок. Тримайте верхні рівні модулів легкими й без побічних ефектів, а мережевих
clients, subprocesses, listeners, читання облікових даних і запуск служб
переносьте за шляхи повного runtime.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє              |
| -------------------------------------- | ---------------------------- |
| `registerProvider`                     | Провайдер моделей (LLM)      |
| `registerChannel`                      | Чат-канал                    |
| `registerTool`                         | Інструмент агента            |
| `registerHook` / `on(...)`             | Hooks життєвого циклу        |
| `registerSpeechProvider`               | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`      | Генерація зображень          |
| `registerMusicGenerationProvider`      | Генерація музики             |
| `registerVideoGenerationProvider`      | Генерація відео              |
| `registerWebFetchProvider`             | Провайдер отримання/скрапінгу вебданих |
| `registerWebSearchProvider`            | Вебпошук                     |
| `registerHttpRoute`                    | HTTP endpoint                |
| `registerCommand` / `registerCli`      | Команди CLI                  |
| `registerContextEngine`                | Рушій контексту              |
| `registerService`                      | Фонова служба                |

Поведінка guard для типізованих hooks життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не змінює і не скасовує попередній block.
- `before_install`: `{ block: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не змінює і не скасовує попередній block.
- `message_sending`: `{ cancel: true }` є термінальним; handlers із нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не змінює і не скасовує попередній cancel.

Native сервер застосунку Codex повертає bridge-події native-інструментів Codex назад у цю
поверхню hook-ів. Plugins можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у підтвердженнях
Codex `PermissionRequest`. Bridge поки що не переписує аргументи native-інструментів Codex.

Повну поведінку типізованих hook-ів див. у [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність bundle з Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — schema маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в plugin
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — сторонні переліки
