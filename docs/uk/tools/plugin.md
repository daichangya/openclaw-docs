---
read_when:
    - Установлення або налаштування plugin
    - Розуміння правил виявлення та завантаження plugin
    - Робота з bundle plugin, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T06:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
media-understanding, генерація зображень, генерація відео, web fetch, web
search тощо. Деякі plugin є **core** (постачаються з OpenClaw), інші —
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у своєму файлі конфігурації.

  </Step>
</Steps>

Якщо ви віддаєте перевагу керуванню прямо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або звичайна специфікація пакета (спочатку ClawHub, потім резервний варіант npm).

Якщо конфігурація недійсна, установлення зазвичай безпечно завершується відмовою й спрямовує вас до
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого plugin
для plugin, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють завчасно все дерево runtime-залежностей кожного вбудованого plugin.
Коли вбудований plugin, що належить OpenClaw, активний через конфігурацію plugin, застарілу
конфігурацію каналу або маніфест із увімкненням за замовчуванням, під час запуску відновлюються
лише оголошені ним runtime-залежності перед імпортом. External plugin і користувацькі шляхи
завантаження все одно потрібно встановлювати через `openclaw plugins install`.

## Типи plugin

OpenClaw розпізнає два формати plugin:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі   | Офіційні plugin, пакети npm від спільноти              |
| **Bundle** | Сумісне з Codex/Claude/Cursor компонування; відображається на функції OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundle див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
і [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні plugin

### Доступні для встановлення (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin пам’яті">
    - `memory-core` — вбудований memory search (стандартно через `plugins.slots.memory`)
    - `memory-lancedb` — long-term memory з установленням на вимогу з auto-recall/capture (задайте `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований plugin браузера для інструмента browser, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та стандартного сервісу керування браузером (увімкнений за замовчуванням; вимкніть перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (за замовчуванням вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugin? Див. [Community Plugins](/uk/plugins/community).

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
| `enabled`        | Головний перемикач (стандартно: `true`)                  |
| `allow`          | Список дозволених plugin (необов’язково)                  |
| `deny`           | Список заборонених plugin (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги plugin                           |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі для окремих plugin + config                    |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з відстеженням config
+ внутрішньопроцесним перезапуском (стандартний шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після застосування змін конфігурації.

<Accordion title="Стани plugin: вимкнений vs відсутній vs недійсний">
  - **Вимкнений**: plugin існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: config посилається на id plugin, який під час виявлення не знайдено.
  - **Недійсний**: plugin існує, але його config не відповідає оголошеній schema.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugin у такому порядку (перше збігання перемагає):

<Steps>
  <Step title="Шляхи з config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Plugin робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні plugin">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані plugin">
    Постачаються з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі plugin
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugin із робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані plugin дотримуються вбудованого набору зі стандартним увімкненням, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний plugin для цього слота

## Слоти plugin (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

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

| Слот            | Що він контролює        | Стандартно          |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Активний plugin пам’яті | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний inventory
openclaw plugins list --enabled            # лише завантажені plugin
openclaw plugins list --verbose            # детальні рядки для кожного plugin
openclaw plugins list --json               # inventory у машиночитному форматі
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця по всьому набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # установити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установити з локального шляху
openclaw plugins install -l <path>         # підключити посиланням (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зафіксувати точну розв’язану npm-специфікацію
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

Вбудовані plugin постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser
plugin). Інші вбудовані plugin усе ще потрібно вмикати через `openclaw plugins enable <id>`.

`--force` перезаписує вже встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugin. Параметр не підтримується разом із `--link`, який повторно використовує шлях до джерела
замість копіювання в керовану ціль встановлення.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікації пакета з dist-tag або точною версією дозволяє зіставити назву пакета
назад із записом відстежуваного plugin і зберегти нову специфікацію для майбутніх оновлень.
Передавання назви пакета без версії переводить точно зафіксоване npm-встановлення назад на
стандартну лінію випусків реєстру. Якщо встановлений npm plugin уже відповідає
розв’язаній версії та зафіксованій ідентичності artifact, OpenClaw пропускає оновлення
без завантаження, перевстановлення чи переписування config.

`--pin` працює лише для npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace, а не npm-специфікацію.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення plugin попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політик plugin `before_install` або блокування через збої сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення plugin. Установлення залежностей Skills через Gateway
використовують натомість відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні bundle беруть участь у тих самих потоках list/inspect/enable/disable
для plugin. Поточна підтримка runtime включає bundle Skills, Claude command-Skills,
стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` і `lspServers`, оголошені в маніфесті,
Cursor command-Skills і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також
про підтримувані чи непідтримувані записи MCP і LSP server для plugin, що працюють через bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію
GitHub або git URL. Для віддалених marketplace записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні подробиці див. в [довіднику CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API plugin

Native plugin експортують об’єкт entry, який надає `register(api)`. Старіші
plugin усе ще можуть використовувати `activate(api)` як застарілий псевдонім, але нові plugin мають
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
активації plugin. Завантажувач і далі використовує резервний варіант `activate(api)` для старіших plugin,
але вбудовані plugin і нові external plugin мають розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)      |
| `registerChannel`                       | Чат-канал                   |
| `registerTool`                          | Інструмент агента           |
| `registerHook` / `on(...)`              | Хуки життєвого циклу        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Потоковий STT               |
| `registerRealtimeVoiceProvider`         | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерація зображень         |
| `registerMusicGenerationProvider`       | Генерація музики            |
| `registerVideoGenerationProvider`       | Генерація відео             |
| `registerWebFetchProvider`              | Провайдер web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI-команди                 |
| `registerContextEngine`                 | Рушій контексту             |
| `registerService`                       | Фоновий сервіс              |

Поведінка guard хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; handler нижчого пріоритету пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує раніше встановлене block.
- `before_install`: `{ block: true }` є термінальним; handler нижчого пріоритету пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує раніше встановлене block.
- `message_sending`: `{ cancel: true }` є термінальним; handler нижчого пріоритету пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує раніше встановлене cancel.

Повну поведінку типізованих хуків див. в [SDK Overview](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — schema маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в plugin
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — сторонні списки
