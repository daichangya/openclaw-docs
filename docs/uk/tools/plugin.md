---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude пакетами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-25T17:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
обв’язки агентів, інструменти, Skills, мовлення, транскрипція в реальному часі, голос
у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук та інше. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші
є **external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть плагін">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
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

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення джерела, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервне звернення до npm).

Якщо конфігурація некоректна, установлення зазвичай безпечно завершується з відмовою та вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого плагіна для плагінів, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють заздалегідь усе дерево
залежностей середовища виконання кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест із увімкненням за замовчуванням, під час запуску
відновлюються лише оголошені залежності середовища виконання цього плагіна перед його імпортом.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню залежностей середовища виконання вбудованого плагіна для цього плагіна/каналу.
External плагіни та власні шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                      | Приклади                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про пакети див. у [Пакети плагінів](/uk/plugins/bundles).

Якщо ви пишете native плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
і [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються разом з OpenClaw)

<AccordionGroup>
  <Accordion title="Постачальники моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням за потреби, автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний плагін для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
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
| `deny`           | Список заборонених плагінів (необов’язково; заборона має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску Gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після запису змін у конфігурацію.
Підтримуваного шляху гарячого перезавантаження для native коду середовища виконання плагіна або його
хуків життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів. Позначка
`enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють
плагіну брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній процес Gateway
перезапустився з тим самим кодом плагіна. У середовищах VPS/контейнерів із
процесами-обгортками надсилайте перезапуск до фактичного процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Disabled**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який механізм виявлення не знайшов.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше збігле входження має пріоритет):

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
    Постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх треба явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний для цього слота плагін
- Деякі вбудовані плагіни з добровільним ввімкненням автоматично вмикаються, коли конфігурація вказує поверхню, що належить плагіну,
  наприклад посилання на модель постачальника, конфігурацію каналу або середовище виконання
  обв’язки
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  сервера застосунку Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на моделі `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін відображається в `plugins list`, але побічні ефекти або хуки `register(api)`
не спрацьовують у трафіку активного чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду плагіна. У контейнерах
  з обгорткою PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Невбудовані хуки розмови, як-от `llm_input`,
  `llm_output` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він спрацьовує перед визначенням моделі
  для ходів агента; `llm_output` спрацьовує лише після того, як спроба роботи моделі
  створює вивід помічника.
- Щоб підтвердити фактичну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження корисного навантаження постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один плагін):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Слот            | Що він контролює        | Типово              |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory плагін    | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config/install records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або пакет хуків на місці. Для
звичайних оновлень відстежуваних npm-плагінів використовуйте
`openclaw plugins update <id-or-npm-spec>`. Цей параметр не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в цільовий каталог керованого встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням, щоб після
перезапуску встановлені плагіни можна було відразу завантажувати.

OpenClaw зберігає локальний реєстр плагінів як модель холодного читання для
інвентаризації плагінів, визначення власника внесків і планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану
плагіна. Якщо реєстр відсутній, застарілий або недійсний, `openclaw plugins registry
--refresh` перебудовує його з надійного журналу встановлень, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання плагінів.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад із записом відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад на
стандартну лінію випуску реєстру. Якщо встановлений npm-плагін уже відповідає
визначеній версії та ідентичності збереженого артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` стосується лише npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє встановленню
та оновленню плагінів продовжуватися попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Установлення залежностей Skills через Gateway
натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні пакети беруть участь у тих самих потоках list/inspect/enable/disable
для плагінів. Поточна підтримка середовища виконання включає Skills у пакетах, command-skills для Claude,
значення за замовчуванням Claude `settings.json`, Claude `.lsp.json` і оголошені в маніфесті
значення за замовчуванням `lspServers`, command-skills для Cursor та сумісні каталоги
хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості пакетів, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі пакетів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

Native плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни повинні
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
активації плагіна. Завантажувач і далі використовує `activate(api)` як резервний варіант для старіших плагінів,
але вбудовані плагіни та нові external плагіни повинні розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його запис:

| Режим          | Значення                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`         | Активація середовища виконання. Реєструє інструменти, хуки, служби, команди, маршрути та інші побічні ефекти активної роботи.      |
| `discovery`    | Виявлення можливостей лише для читання. Реєструє постачальників і метадані; код входу довіреного плагіна може завантажуватися, але слід пропускати активні побічні ефекти. |
| `setup-only`   | Завантаження метаданих налаштування каналу через спрощений запис налаштування.                                                       |
| `setup-runtime`| Завантаження налаштування каналу, якому також потрібен запис середовища виконання.                                                   |
| `cli-metadata` | Лише збирання метаданих команд CLI.                                                                                                   |

Записи плагінів, які відкривають сокети, бази даних, фонові працівники або довгоживучі
клієнти, повинні захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від активаційних завантажень і не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не є вільним від імпорту:
OpenClaw може виконувати trusted запис плагіна або модуль плагіна каналу, щоб побудувати
знімок. Робіть верхній рівень модуля легким і без побічних ефектів, а мережеві клієнти,
підпроцеси, слухачі, зчитування облікових даних і запуск служб переносьте
за межі повного шляху середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє             |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Постачальник моделі (LLM)   |
| `registerChannel`                      | Чат-канал                   |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Хуки життєвого циклу        |
| `registerSpeechProvider`               | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerMusicGenerationProvider`      | Генерація музики            |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Постачальник отримання/скрейпінгу вебданих |
| `registerWebSearchProvider`            | Вебпошук                    |
| `registerHttpRoute`                    | HTTP-ендпойнт               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Рушій контексту             |
| `registerService`                      | Фонова служба               |

Поведінка захисних механізмів хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не змінює та не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не змінює та не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є фінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не змінює та не скасовує попереднє скасування.

Native сервер застосунку Codex повертає власні події інструментів Codex назад у цю
поверхню хуків через міст. Плагіни можуть блокувати native інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у затвердженнях
Codex `PermissionRequest`. Міст поки що не переписує аргументи native інструментів Codex.
Точна межа підтримки середовища виконання Codex визначена в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Докладно про типізовану поведінку хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язані матеріали

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Пакети плагінів](/uk/plugins/bundles) — сумісність пакетів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагіні
- [Внутрішня будова плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні добірки
