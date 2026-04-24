---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з наборами плагінів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T22:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d962119bcb2bf94da08fcd48d4da8be76618104ea3c37ce60e2fcf397b05c98
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
середовища агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос
у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, вебпошук
та інше. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **external** (опубліковані спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Перегляньте, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # З локального каталогу або архіву
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в розділі `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню прямо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса
(спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація некоректна, установлення зазвичай безпечно завершується з помилкою й
спрямовує вас до `openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Упаковані встановлення OpenClaw не встановлюють завчасно все дерево залежностей
середовища виконання для кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або стандартно ввімкнений маніфест,
під час запуску відновлюються лише оголошені залежності середовища виконання цього плагіна перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання для цього вбудованого плагіна/каналу.
Зовнішні плагіни та власні шляхи завантаження все ще потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Набори плагінів](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (за замовчуванням через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять зі встановленням за потреби з автоматичним пригадуванням/збереженням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований плагін браузера для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та стандартної служби керування браузером (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Плагіни спільноти](/uk/plugins/community).

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
| `allow`          | Список дозволених плагінів (необов’язково)                |
| `deny`           | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі й конфігурація для окремого плагіна            |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway працює з відстеженням
конфігурації та увімкненим внутрішньопроцесним перезапуском (стандартний шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису змін до конфігурації.
Підтримуваного шляху гарячого перезавантаження для native-коду середовища виконання плагіна або хуків
життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. Позначка `loaded` для плагіна там
означає, що плагін можна виявити й завантажити з конфігурації/файлів, які бачить цей
запуск CLI. Це не доводить, що вже запущений віддалений дочірній процес Gateway
було перезапущено з тим самим кодом плагіна. У середовищах VPS/контейнерів з обгортковими
процесами надсилайте перезапуск фактичному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній або некоректний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Некоректний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритетність

OpenClaw сканує плагіни в такому порядку (перше знайдене збігання має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору типово ввімкнених, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані плагіни з добровільним увімкненням активуються автоматично, коли конфігурація вказує поверхню, що належить плагіну,
  наприклад посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін з’являється в `plugins list`, але побічні ефекти або хуки `register(api)`
не працюють у живому трафіку чату, спершу перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін встановлення/конфігурації/коду плагіна. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується перед визначенням
  моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створює відповідь асистента.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/статусу Gateway, а під час налагодження навантажень постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активним може бути лише один плагін):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або id плагіна
    },
  },
}
```

| Слот            | Що він контролює         | Типове значення     |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Плагін Active Memory     | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # стислий перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # детальні рядки для кожного плагіна
openclaw plugins list --json               # перелік у форматі для машинного читання
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # формат для машинного читання
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # підключення (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну визначену специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один плагін
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований плагін
браузера). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакунок хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
плагінів. Він не підтримується разом із `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль установлення.

Коли `plugins.allow` уже налаштовано, `openclaw plugins install` додає
ідентифікатор установленого плагіна до цього списку дозволених перед його ввімкненням, тож установлені плагіни
можна відразу завантажувати після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації пакета npm із dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно закріплене встановлення назад на
стандартну лінійку випусків реєстру. Якщо встановлений npm-плагін уже відповідає
визначеній версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи перезапису конфігурації.

`--pin` призначений лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний обхідний параметр для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
й оновлення плагінів попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway натомість використовують відповідний параметр запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable плагінів.
Поточна підтримка середовища виконання включає Skills із наборів, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні шляхи до джерел.

Див. [довідник CLI `openclaw plugins`](/uk/cli/plugins), щоб отримати повну інформацію.

## Огляд Plugin API

Native-плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають
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

OpenClaw завантажує об’єкт входу та викликає `register(api)` під час
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни повинні розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його об’єкт входу:

| Режим           | Значення                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші живі побічні ефекти. |
| `discovery`     | Виявлення можливостей лише для читання. Реєструйте постачальників і метадані, але пропускайте дорогі живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                       |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує запису середовища виконання.                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                   |

Об’єкти входу плагінів, які відкривають сокети, бази даних, фонові воркери або довготривалі
клієнти, повинні обмежувати ці побічні ефекти через `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень для активації та не замінюють
реєстр запущеного Gateway.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                  |
| -------------------------------------- | ---------------------------- |
| `registerProvider`                     | Постачальник моделей (LLM)   |
| `registerChannel`                      | Чат-канал                    |
| `registerTool`                         | Інструмент агента            |
| `registerHook` / `on(...)`             | Хуки життєвого циклу         |
| `registerSpeechProvider`               | Синтез мовлення / STT        |
| `registerRealtimeTranscriptionProvider`| Потоковий STT                |
| `registerRealtimeVoiceProvider`        | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`      | Генерація зображень          |
| `registerMusicGenerationProvider`      | Генерація музики             |
| `registerVideoGenerationProvider`      | Генерація відео              |
| `registerWebFetchProvider`             | Постачальник отримання / скрапінгу вебданих |
| `registerWebSearchProvider`            | Вебпошук                     |
| `registerHttpRoute`                    | HTTP-ендпойнт                |
| `registerCommand` / `registerCli`      | Команди CLI                  |
| `registerContextEngine`                | Рушій контексту              |
| `registerService`                      | Фонова служба                |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не змінює стан і не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не змінює стан і не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є кінцевим; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не змінює стан і не скасовує раніше встановлене скасування.

Native app-server Codex повертає містком власні події інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати власні інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленні
`PermissionRequest` Codex. Місток поки що не переписує аргументи
власних інструментів Codex.

Повну типізовану поведінку хуків див. в [Огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Набори плагінів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня будова плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні добірки
