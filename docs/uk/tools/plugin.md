---
read_when:
    - Установлення або налаштування plugins
    - Розуміння правил виявлення та завантаження plugins
    - Робота з пакетами plugins, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування й керування plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-05T18:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
media-understanding, генерація зображень, генерація відео, web fetch, web
search тощо. Деякі plugins є **core** (постачаються з OpenClaw), інші —
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

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо ви надаєте перевагу керуванню прямо з чату, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях установлення використовує той самий resolver, що й CLI: локальний шлях/архів, явний
`clawhub:<pkg>` або проста специфікація пакета (спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація недійсна, установлення зазвичай безпечно завершується помилкою і вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

## Типи plugins

OpenClaw розпізнає два формати plugins:

| Формат     | Як це працює                                                     | Приклади                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в процесі   | Офіційні plugins, пакети npm від спільноти             |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про bundles див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
і [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні plugins

### Доступні для встановлення (npm)

| Plugin          | Package                | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять, що встановлюється за потреби, з auto-recall/capture (задайте `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser plugin для browser tool, CLI `openclaw browser`, методу gateway `browser.request`, runtime браузера та типового сервісу керування браузером (увімкнений типово; вимкніть його перед заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (типово вимкнений)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Community Plugins](/uk/plugins/community).

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

| Поле            | Опис                                                      |
| --------------- | --------------------------------------------------------- |
| `enabled`       | Головний перемикач (типово: `true`)                       |
| `allow`         | Allowlist plugins (необов’язково)                         |
| `deny`          | Denylist plugins (необов’язково; deny має пріоритет)      |
| `load.paths`    | Додаткові файли/каталоги plugins                          |
| `slots`         | Вибірники ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>`| Перемикачі та config для окремих plugins                  |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway працює з наглядом
за конфігурацією та ввімкненим перезапуском у процесі (типовий шлях `openclaw gateway`),
цей перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.

<Accordion title="Стани plugins: disabled vs missing vs invalid">
  - **Disabled**: plugin існує, але правила увімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на plugin id, який не знайдено під час виявлення.
  - **Invalid**: plugin існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує plugins у такому порядку (перший збіг перемагає):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Розширення workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні розширення">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені типово (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила увімкнення

- `plugins.enabled: false` вимикає всі plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins, що походять з workspace, **типово вимкнені** (їх треба явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору типово увімкнених, якщо не перевизначено
- Ексклюзивні slots можуть примусово ввімкнути вибраний plugin для цього слота

## Slots plugins (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none" для вимкнення
      contextEngine: "legacy", // або plugin id
    },
  },
}
```

| Slot            | Що контролює             | Типове значення |
| --------------- | ------------------------ | --------------- |
| `memory`        | Активний plugin пам’яті  | `memory-core`   |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідник CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені plugins
openclaw plugins list --verbose            # детальні рядки по кожному plugin
openclaw plugins list --json               # машинозчитуваний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машинозчитувано
openclaw plugins inspect --all             # таблиця по всьому набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # зв’язати (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точну розв’язану специфікацію npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # оновити один plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити записи конфігурації/встановлення
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins постачаються разом з OpenClaw. Багато з них увімкнені типово (наприклад,
bundled провайдери моделей, bundled провайдери мовлення та bundled browser
plugin). Інші bundled plugins усе ще потребують `openclaw plugins enable <id>`.

`--force` перезаписує вже встановлений plugin або hook pack на місці.
Його не можна використовувати разом із `--link`, який повторно використовує шлях джерела замість
копіювання в керовану ціль установлення.

`--pin` працює лише для npm. Його не можна використовувати з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє продовжувати встановлення
й оновлення plugins попри вбудовані findings рівня `critical`, але все одно
не обходить блокування політики plugin `before_install` чи блокування через помилки сканування.

Цей прапорець CLI застосовується лише до сценаріїв встановлення/оновлення plugins. Установлення
залежностей skill через Gateway натомість використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим сценарієм завантаження/встановлення skill з ClawHub.

Сумісні bundles беруть участь у тому самому процесі list/inspect/enable/disable plugin.
Поточна підтримка runtime включає bundle Skills, Claude command-skills,
типові значення Claude `settings.json`, Claude `.lsp.json` і оголошені в manifest
типові `lspServers`, Cursor command-skills і сумісні каталоги hook Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle, а також підтримувані
чи непідтримувані записи MCP і LSP server для plugins на основі bundle.

Джерела marketplace можуть бути відомою назвою marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальним коренем marketplace або шляхом до
`marketplace.json`, скороченням GitHub у вигляді `owner/repo`, URL репозиторію GitHub або URL git.
Для віддалених marketplace записи plugin мають залишатися всередині клонованого репозиторію marketplace
і використовувати лише відносні джерела шляхів.

Повні подробиці див. у [`openclaw plugins` CLI reference](/cli/plugins).

## Огляд API plugins

Native plugins експортують об’єкт entry, який надає `register(api)`. Старіші
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

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час активації
plugin. Loader усе ще повертається до `activate(api)` для старіших plugins,
але bundled plugins і нові external plugins мають розглядати `register` як
публічний контракт.

Поширені методи реєстрації:

| Метод                                  | Що реєструє                 |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)      |
| `registerChannel`                      | Чат-канал                   |
| `registerTool`                         | Інструмент агента           |
| `registerHook` / `on(...)`             | Хуки життєвого циклу        |
| `registerSpeechProvider`               | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider`| Потоковий STT               |
| `registerRealtimeVoiceProvider`        | Двобічний голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`      | Генерація зображень         |
| `registerVideoGenerationProvider`      | Генерація відео             |
| `registerWebFetchProvider`             | Провайдер web fetch / scrape|
| `registerWebSearchProvider`            | Web search                  |
| `registerHttpRoute`                    | HTTP endpoint               |
| `registerCommand` / `registerCli`      | Команди CLI                 |
| `registerContextEngine`                | Рушій контексту             |
| `registerService`                      | Фоновий сервіс              |

Поведінка guard hook для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; handlers з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `before_install`: `{ block: true }` є термінальним; handlers з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує попереднє блокування.
- `message_sending`: `{ cancel: true }` є термінальним; handlers з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує попереднє скасування.

Повну поведінку типізованих hook див. у [SDK Overview](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створіть власний plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність bundle Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема manifest
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в plugin
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — списки сторонніх рішень
