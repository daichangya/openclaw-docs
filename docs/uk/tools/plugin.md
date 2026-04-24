---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з наборами плагінів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T16:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7db42c0c8d7d8b3bddda46a8a42fc19b39b093863b1730b8ca66528a95ecb50
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
середовища агентів, інструменти, Skills, мовлення, транскрибування в реальному часі, голос у реальному
часі, розуміння медіа, генерація зображень, генерація відео, веботримання, вебпошук
та інше. Деякі плагіни є **core** (постачаються з OpenClaw), інші
є **external** (опубліковані в npm спільнотою).

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

    # З локального каталогу або архіву
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

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або проста специфікація пакета (спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація недійсна, встановлення зазвичай безпечно завершується з помилкою та
вказує вам на `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення вбудованого плагіна для плагінів, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево залежностей
середовища виконання кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагіна, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням,
під час запуску відновлюються лише оголошені цим плагіном залежності середовища виконання перед його імпортом.
Зовнішні плагіни та власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, пакети npm спільноти                 |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

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
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять із автоматичним пригадуванням/захопленням, що встановлюється за потреби (встановіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для інструмента browser, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання browser і типового сервісу керування browser (увімкнений за замовчуванням; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнений за замовчуванням)
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
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native-коду середовища виконання плагінів або хуків
життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж
очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, сервіси або
хуки постачальника/середовища виконання почнуть працювати.

`openclaw plugins list` — це локальний знімок CLI/конфігурації. Плагін зі станом `loaded`
там означає, що плагін можна виявити та завантажити з конфігурації/файлів, які бачить це
виконання CLI. Це не доводить, що вже запущений дочірній процес віддаленого Gateway
перезапустився з тим самим кодом плагіна. У налаштуваннях VPS/контейнерів із процесами-обгортками
надсилайте перезапуск фактичному процесу `openclaw gateway run` або використовуйте
`openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагінів: вимкнений, відсутній, недійсний">
  - **Disabled**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який виявлення не знайшло.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше знайдене збігання має пріоритет):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (постачальники моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору типово ввімкнених, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота
- Деякі вбудовані плагіни з опціональним ввімкненням вмикаються автоматично, коли конфігурація називає
  поверхню, що належить плагіну, наприклад посилання на модель постачальника, конфігурацію каналу або
  середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі плагінів:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований плагін
  app-server Codex вибирається через `embeddedHarness.runtime: "codex"` або застарілі
  посилання на модель `codex/*`

## Усунення несправностей хуків середовища виконання

Якщо плагін з’являється в `plugins list`, але побічні ефекти `register(api)` або хуки
не працюють у живому трафіку чату, спочатку перевірте таке:

- Запустіть `openclaw gateway status --deep --require-rpc` і переконайтеся, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — це саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін у встановленні/конфігурації/коді плагіна. У контейнерах
  з обгортками PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому
  процесу `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрації хуків і
  діагностику. Для невбудованих хуків розмови, таких як `llm_input`,
  `llm_output` і `agent_end`, потрібен
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей віддавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того, як спроба моделі
  створить вивід помічника.
- Для підтвердження фактичної моделі сеансу використовуйте `openclaw sessions` або
  поверхні сеансу/стану Gateway, а під час налагодження корисного навантаження постачальника запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активною лише одна):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none", щоб вимкнути
      contextEngine: "legacy", // або ідентифікатор плагіна
    },
  },
}
```

| Слот            | Що він контролює       | Типове значення     |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Active Memory plugin   | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # детальні рядки для кожного плагіна
openclaw plugins list --json               # машиночитний перелік
openclaw plugins inspect <id>              # докладні відомості
openclaw plugins inspect <id> --json       # машиночитно
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # посилання (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
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
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований
browser-плагін). Інші вбудовані плагіни все ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або пакет хуків на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm-
плагінів. Це не підтримується з `--link`, який повторно використовує шлях до джерела замість
копіювання в керовану ціль встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням, тож установлені плагіни
можна завантажувати одразу після перезапуску.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних установлень. Передавання
специфікації npm-пакета з dist-tag або точною версією зіставляє назву пакета
назад до запису відстежуваного плагіна й записує нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване встановлення назад на
типову лінію випуску реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній
версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення без завантаження,
перевстановлення чи перезапису конфігурації.

`--pin` доступний лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний обхід для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані критичні (`critical`) знахідки, але все одно
не обходить блокування політики плагіна `before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Установлення
залежностей Skills через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills з ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable для плагінів.
Поточна підтримка середовища виконання включає bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-skills Cursor, а також сумісні каталоги
хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані чи непідтримувані записи серверів MCP і LSP для плагінів, що працюють на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або git URL. Для віддалених marketplace записи плагінів мають залишатися в межах
клонованого репозиторію marketplace і використовувати лише відносні шляхи джерел.

Повні відомості див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд Plugin API

Native-плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові плагіни мають
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
плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни мають вважати `register` публічним контрактом.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє            |
| -------------------------------------- | -------------------------- |
| `registerProvider`                     | Постачальник моделей (LLM) |
| `registerChannel`                      | Канал чату                 |
| `registerTool`                         | Інструмент агента          |
| `registerHook` / `on(...)`             | Хуки життєвого циклу       |
| `registerSpeechProvider`               | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider`| Потокове STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`      | Генерація зображень        |
| `registerMusicGenerationProvider`      | Генерація музики           |
| `registerVideoGenerationProvider`      | Генерація відео            |
| `registerWebFetchProvider`             | Постачальник веботримання / скрапінгу |
| `registerWebSearchProvider`            | Вебпошук                   |
| `registerHttpRoute`                    | HTTP-ендпойнт              |
| `registerCommand` / `registerCli`      | Команди CLI                |
| `registerContextEngine`                | Рушій контексту            |
| `registerService`                      | Фоновий сервіс             |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не змінює й не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не змінює й не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не змінює й не скасовує раніше встановлене скасування.

Native Codex app-server повертає події інструментів Codex-native через цей
інтерфейс хуків. Плагіни можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у погодженнях
`PermissionRequest` Codex. Міст поки що не переписує аргументи native-інструментів Codex.

Повний опис поведінки типізованих хуків див. у [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного плагіна
- [Plugin Bundles](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — сторонні добірки
