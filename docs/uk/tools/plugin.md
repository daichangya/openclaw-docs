---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з сумісними з Codex/Claude наборами плагінів
sidebarTitle: Install and Configure
summary: Встановлюйте, налаштовуйте та керуйте плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-20T16:49:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Плагіни

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук
та інше. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші
є **external** (публікуються спільнотою в npm).

## Швидкий початок

<Steps>
  <Step title="Подивіться, що завантажено">
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або звичайна специфікація пакета (спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація недійсна, інсталяція зазвичай завершується без виконання змін і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — це вузький шлях
перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не встановлюють завчасно все дерево залежностей середовища виконання
для кожного вбудованого плагіна. Коли вбудований плагін, що належить OpenClaw, активний через
конфігурацію плагінів, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням,
під час запуску відновлюються лише оголошені залежності середовища виконання
цього плагіна перед його імпортом. External плагіни та власні шляхи завантаження
усе ще потрібно встановлювати через `openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в межах процесу | Офіційні плагіни, пакети npm від спільноти             |
| **Bundle** | Макет, сумісний з Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори дивіться в [Набори плагінів](/uk/plugins/bundles).

Якщо ви пишете Native плагін, почніть із [Створення плагінів](/uk/plugins/building-plugins)
та [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

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
    - `memory-lancedb` — довготривала пам’ять із встановленням на вимогу з автоматичним відновленням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Постачальники мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser Plugin для інструмента browser, CLI `openclaw browser`, методу Gateway `browser.request`, середовища виконання browser і служби керування browser за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
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

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway запущено з відстеженням
конфігурації та увімкненим перезапуском у межах процесу (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису змін у конфігурацію.

<Accordion title="Стан плагіна: вимкнений, відсутній чи недійсний">
  - **Вимкнений**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не було знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше знайдене збігом і використовується):

<Steps>
  <Step title="Шляхи конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Розширення робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні розширення">
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
- Плагіни з джерелом із робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору, увімкненого за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один):

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

| Слот            | Що він керує               | Типове значення     |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Active Memory плагін       | `memory-core`       |
| `contextEngine` | Активний рушій контексту   | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # стислий перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # рядки з детальною інформацією про кожен плагін
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # установлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установлення з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # оновити один плагін
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити все
openclaw plugins uninstall <id>          # видалити записи конфігурації/установлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований
browser Plugin). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний установлений плагін або пакет хуків на місці.
Він не підтримується разом із `--link`, який повторно використовує вихідний шлях
замість копіювання в керовану ціль інсталяції.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
установлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє інсталяції та оновлення
плагінів продовжуватися попри вбудовані результати рівня `critical`, але все одно
не обходить блокування політики плагіна `before_install` або блокування через помилку сканування.

Цей прапорець CLI застосовується лише до потоків інсталяції/оновлення плагінів. Установлення залежностей
Skills через Gateway натомість використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/установлення Skills через ClawHub.

Сумісні набори беруть участь у тих самих потоках list/inspect/enable/disable для плагінів.
Поточна підтримка середовища виконання включає bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і оголошені в маніфесті
`lspServers`, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи плагінів мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні відомості дивіться в [довідці CLI `openclaw plugins`](/cli/plugins).

## Огляд API плагінів

Native плагіни експортують об’єкт entry, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім, але для нових плагінів слід
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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час
активації плагіна. Завантажувач і далі використовує `activate(api)` як резервний варіант для старіших плагінів,
але вбудовані плагіни та нові external плагіни повинні розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Постачальник моделей (LLM) |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Хуки життєвого циклу       |
| `registerSpeechProvider`                | Перетворення тексту на мовлення / STT |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Постачальник отримання / збирання даних з вебу |
| `registerWebSearchProvider`             | Вебпошук                   |
| `registerHttpRoute`                     | HTTP endpoint              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Рушій контексту            |
| `registerService`                       | Фонова служба              |

Поведінка guard-хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує дій і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує дій і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує дій і не скасовує попереднє скасування.

Повну типізовану поведінку хуків дивіться в [Огляд SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins) — створіть власний плагін
- [Набори плагінів](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Маніфест плагіна](/uk/plugins/manifest) — схема маніфесту
- [Реєстрація інструментів](/uk/plugins/building-plugins#registering-agent-tools) — додайте інструменти агента в плагін
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Плагіни спільноти](/uk/plugins/community) — сторонні добірки
