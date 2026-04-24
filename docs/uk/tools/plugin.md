---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з наборами плагінів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T15:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86476ea9d091271ca1dc925773ee1c32d0a545be5b2f700ebd944b3157881dc
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей, каркаси агентів, інструменти, навички, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання вебсторінок, вебпошук тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші — **external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
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

Якщо ви віддаєте перевагу керуванню через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або проста специфікація пакета (спочатку ClawHub, потім резервний перехід на npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується безпечною відмовою та вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Упаковані встановлення OpenClaw не виконують завчасне встановлення всього дерева
залежностей середовища виконання кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або типовий увімкнений маніфест,
під час запуску відновлюються лише оголошені залежності середовища виконання цього плагіна перед його імпортом.
Зовнішні плагіни та користувацькі шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                   | Приклади                                               |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в тому самому процесі | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | макет, сумісний із Codex/Claude/Cursor; зіставляється з функціями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори плагінів див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

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
    - `memory-core` — вбудований пошук пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із встановленням за потреби, автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований браузерний плагін для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання браузера та типової служби керування браузером (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (за замовчуванням вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні плагіни? Див. [Community Plugins](/uk/plugins/community).

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
| `slots`          | Вибір ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway запущено з відстеженням
конфігурації та ввімкненим перезапуском у процесі (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для коду середовища виконання native-плагінів або
хуків життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал,
перш ніж очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або
хуки постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. `loaded` плагін там
означає, що плагін можна виявити та завантажити з конфігурації/файлів, які бачить це
виконання CLI. Це не доводить, що вже запущений віддалений дочірній Gateway
перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів з обгортками
надсилайте перезапуски фактичному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Disabled**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше збігання перемагає):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлу або каталогу.
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
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо його не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний для цього слота плагін
- Деякі вбудовані плагіни з добровільним підключенням автоматично вмикаються, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або середовище виконання
  каркаса
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не спрацьовують у трафіку активного чату, спершу перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін установлення/конфігурації/коду плагіна. У контейнерах
  з обгорткою PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використайте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Для невбудованих хуків розмови, таких як `llm_input`,
  `llm_output` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  визначення моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить відповідь помічника.
- Щоб підтвердити ефективну модель сеансу, використовуйте `openclaw sessions` або
  поверхні сеансу/статусу Gateway і, під час налагодження корисних навантажень постачальника, запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активною лише одна):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none" для вимкнення
      contextEngine: "legacy", // або ідентифікатор плагіна
    },
  },
}
```

| Слот            | Що він контролює         | Типове значення     |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Плагін Active Memory     | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний список
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # рядки з докладною інформацією про кожен плагін
openclaw plugins list --json               # машинозчитуваний список
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машинозчитуваний формат
openclaw plugins inspect --all             # таблиця по всьому набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # підключити (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану npm-специфікацію
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
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний
плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакунок хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
плагінів. Цей параметр не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль встановлення.

Коли `plugins.allow` вже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволів перед його ввімкненням, тож встановлені плагіни
можна одразу завантажити після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад до запису відстежуваного плагіна та зберігає нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад на
типову лінійку випусків реєстру. Якщо встановлений npm-плагін уже відповідає визначеній
версії та збереженій ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або перезапису конфігурації.

`--pin` стосується лише npm. Він не підтримується з `--marketplace`, тому що
встановлення з marketplace зберігають метадані джерела marketplace, а не npm-специфікацію.

`--dangerously-force-unsafe-install` — це аварійний обхідний параметр для хибних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані результати `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення
залежностей Skills через Gateway натомість використовує відповідний параметр перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills із ClawHub.

Сумісні набори плагінів беруть участь у тому самому потоці list/inspect/enable/disable для плагінів. Поточна
підтримка середовища виконання включає bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, Claude `.lsp.json` і типові значення
`lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору плагінів, а також
підтримувані або непідтримувані записи MCP і серверів LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace й використовувати лише відносні джерела шляхів.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API плагінів

Native-плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни можуть і далі використовувати `activate(api)` як застарілий псевдонім, але нові плагіни повинні
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
активації плагіна. Завантажувач і далі використовує резервний перехід до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM)  |
| `registerChannel`                       | Канал чату                  |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Потокове STT                |
| `registerRealtimeVoiceProvider`         | Двонапрямний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Постачальник отримання / скрапінгу вебданих |
| `registerWebSearchProvider`             | Вебпошук                    |
| `registerHttpRoute`                     | HTTP-ендпойнт               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фонова служба               |

Поведінка захисних умов хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії та не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії та не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії та не скасовує попереднє скасування.

Native Codex app-server повертає події інструментів Codex-native через міст назад у цю
поверхню хуків. Плагіни можуть блокувати інструменти Codex-native через `before_tool_call`,
спостерігати результати через `after_tool_call` і брати участь у схваленнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи інструментів Codex-native.

Повну інформацію про поведінку типізованих хуків див. у [SDK Overview](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного плагіна
- [Plugin Bundles](/uk/plugins/bundles) — сумісність наборів плагінів Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — сторонні списки
