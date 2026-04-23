---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з наборами плагінів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-23T05:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb81789de548aed0cd0404e8c42a2d9ce00d0e9163f944e07237b164d829ac40
    source_path: tools/plugin.md
    workflow: 15
---

# Плагіни

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
інструменти, Skills, мовлення, транскрипція в реальному часі, голос у реальному часі,
розуміння медіа, генерація зображень, генерація відео, отримання даних із вебу, веб-
пошук тощо. Деякі плагіни є **core** (постачаються з OpenClaw), інші —
**external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Встановіть плагін">
    ```bash
    # Із npm
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

Якщо ви віддаєте перевагу керуванню безпосередньо в чаті, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях встановлення використовує той самий механізм визначення, що й CLI: локальний
шлях/архів, явний `clawhub:<pkg>` або проста специфікація пакета (спочатку ClawHub,
потім резервний варіант через npm).

Якщо конфігурація недійсна, встановлення зазвичай завершується без продовження й
вказує на `openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях
перевстановлення bundled-плагіна для плагінів, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні інсталяції OpenClaw не виконують завчасне встановлення всього дерева
runtime-залежностей кожного bundled-плагіна. Коли bundled-плагін, що належить OpenClaw,
активується через конфігурацію плагіна, застарілу конфігурацію каналу або маніфест,
увімкнений за замовчуванням, під час запуску виправляються лише оголошені
runtime-залежності цього плагіна перед його імпортом. External-плагіни та
власні шляхи завантаження, як і раніше, потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-модуль; виконується в межах процесу | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Макет, сумісний із Codex/Claude/Cursor; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні плагіни

### Доступні для встановлення (npm)

| Плагін          | Пакет                  | Документація                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — bundled-плагін пошуку в пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — long-term memory зі встановленням за потреби з автоматичним викликом/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — bundled browser Plugin для інструмента браузера, CLI `openclaw browser`, методу Gateway `browser.request`, browser runtime і стандартної служби керування браузером (увімкнено за замовчуванням; вимкніть перед його заміною)
    - `copilot-proxy` — міст VS Code Copilot Proxy (вимкнено за замовчуванням)
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
| `deny`           | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Вибірники ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі та конфігурація для окремого плагіна           |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway запущено з
увімкненим відстеженням конфігурації та внутрішньопроцесним перезапуском
(типовий шлях `openclaw gateway`), цей перезапуск зазвичай виконується
автоматично невдовзі після запису змін до конфігурації.

<Accordion title="Стани плагіна: вимкнений, відсутній, недійсний">
  - **Вимкнений**: плагін існує, але правила увімкнення його вимкнули. Конфігурація зберігається.
  - **Відсутній**: конфігурація посилається на ідентифікатор плагіна, який не знайдено під час виявлення.
  - **Недійсний**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перше збігле значення перемагає):

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

  <Step title="Bundled-плагіни">
    Постачаються з OpenClaw. Багато з них увімкнено за замовчуванням (провайдери моделей, мовлення).
    Для інших потрібне явне ввімкнення.
  </Step>
</Steps>

### Правила увімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **типово вимкнені** (їх потрібно явно ввімкнути)
- Bundled-плагіни дотримуються вбудованого набору типово ввімкнених, якщо не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний плагін для цього слота

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно може бути активним лише один):

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

| Слот            | Що він контролює          | Типове значення     |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Active Memory Plugin      | `memory-core`       |
| `contextEngine` | Активний рушій контексту  | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише завантажені плагіни
openclaw plugins list --verbose            # докладні рядки для кожного плагіна
openclaw plugins list --json               # машиночитаний перелік
openclaw plugins inspect <id>              # докладна інформація
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # загальна таблиця
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # встановити (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановити лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # встановити з локального шляху
openclaw plugins install -l <path>         # підключити (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # зберегти точну розв’язану специфікацію npm
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

Bundled-плагіни постачаються разом з OpenClaw. Багато з них увімкнено за
замовчуванням (наприклад, bundled-провайдери моделей, bundled-провайдери
мовлення та bundled browser Plugin). Інші bundled-плагіни все одно потребують
`openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений плагін або набір хуків на місці.
Для звичайних оновлень відстежуваних npm-плагінів використовуйте
`openclaw plugins update <id-or-npm-spec>`. Прапорець не підтримується разом із
`--link`, який повторно використовує вихідний шлях замість копіювання у
керовану ціль встановлення.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних
встановлень. Передавання специфікації npm-пакета з dist-tag або точною версією
дозволяє зіставити назву пакета назад із записом відстежуваного плагіна та
зберегти нову специфікацію для майбутніх оновлень. Передавання назви пакета без
версії повертає точно закріплене встановлення до типової лінії випуску
реєстру. Якщо встановлений npm-плагін уже відповідає розв’язаній версії та
збереженій ідентичності артефакту, OpenClaw пропускає оновлення без
завантаження, перевстановлення чи перезапису конфігурації.

`--pin` підтримується лише для npm. Він не підтримується разом із `--marketplace`,
оскільки встановлення з marketplace зберігають метадані джерела marketplace,
а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибних
спрацьовувань вбудованого сканера небезпечного коду. Воно дозволяє
встановленню та оновленню плагінів продовжуватися попри вбудовані результати
рівня `critical`, але все одно не обходить блокування політик плагіна
`before_install` або блокування через збій сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення
плагінів. Встановлення залежностей Skills через Gateway натомість використовують
відповідний параметр запиту `dangerouslyForceUnsafeInstall`, тоді як
`openclaw skills install` залишається окремим потоком завантаження/встановлення
Skills із ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable
для плагінів. Поточна runtime-підтримка включає bundle Skills, Claude
command-skills, типові значення Claude `settings.json`, типові значення Claude
`.lsp.json` і оголошені в маніфесті `lspServers`, Cursor command-skills та
сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору,
а також підтримувані чи непідтримувані записи серверів MCP і LSP для
плагінів на основі наборів.

Джерелами marketplace можуть бути відома для Claude назва marketplace з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або
шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL
репозиторію GitHub або git URL. Для віддалених marketplace записи плагінів
мають залишатися в межах клонованого репозиторію marketplace і використовувати
лише відносні джерела шляху.

Повні відомості див. у [довідці CLI `openclaw plugins`](/cli/plugins).

## Огляд API плагінів

Native-плагіни експортують об’єкт entry, який надає `register(api)`. Старіші
плагіни все ще можуть використовувати `activate(api)` як застарілий псевдонім,
але нові плагіни мають використовувати `register`.

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
плагіна. Завантажувач усе ще використовує резервний перехід до `activate(api)`
для старіших плагінів, але bundled-плагіни та нові external-плагіни мають
розглядати `register` як публічний контракт.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє            |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Провайдер моделі (LLM)     |
| `registerChannel`                       | Канал чату                 |
| `registerTool`                          | Інструмент агента          |
| `registerHook` / `on(...)`              | Хуки життєвого циклу       |
| `registerSpeechProvider`                | Синтез мовлення / STT      |
| `registerRealtimeTranscriptionProvider` | Потоковий STT              |
| `registerRealtimeVoiceProvider`         | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо     |
| `registerImageGenerationProvider`       | Генерація зображень        |
| `registerMusicGenerationProvider`       | Генерація музики           |
| `registerVideoGenerationProvider`       | Генерація відео            |
| `registerWebFetchProvider`              | Провайдер отримання / збирання даних із вебу |
| `registerWebSearchProvider`             | Веб-пошук                  |
| `registerHttpRoute`                     | HTTP endpoint              |
| `registerCommand` / `registerCli`       | Команди CLI                |
| `registerContextEngine`                 | Рушій контексту            |
| `registerService`                       | Фонова служба              |

Поведінка guard-хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` не виконує жодної дії та не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` не виконує жодної дії та не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` не виконує жодної дії та не скасовує раніше встановлене скасування.

Повну поведінку типізованих хуків див. у [Огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створіть власний плагін
- [Plugin Bundles](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагін
- [Plugin Internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community Plugins](/uk/plugins/community) — списки сторонніх плагінів
