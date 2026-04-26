---
read_when:
    - Встановлення або налаштування плагінів
    - Розуміння правил виявлення та завантаження плагінів
    - Робота з наборами плагінів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Встановлення, налаштування та керування плагінами OpenClaw
title: Плагіни
x-i18n:
    generated_at: "2026-04-26T09:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73ab65e0c32b51cd34ab59d482f9eb665f3543e3b9ae40de2e584abbd0aca4cc
    source_path: tools/plugin.md
    workflow: 15
---

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей, обв’язки агентів, інструменти, Skills, мовлення, транскрибування в реальному часі, голос у реальному часі, розпізнавання медіа, генерація зображень, генерація відео, отримання вебданих, вебпошук тощо. Деякі плагіни є **core** (постачаються разом з OpenClaw), інші — **external** (опубліковані спільнотою в npm).

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

Шлях встановлення використовує той самий механізм розв’язання, що й CLI: локальний шлях/архів, явний `clawhub:<pkg>` або специфікація пакета без префікса (спочатку ClawHub, потім резервний варіант через npm).

Якщо конфігурація невалідна, встановлення зазвичай безпечно завершується з відмовою й вказує на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення вбудованого плагіна для плагінів, які підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють наперед усе дерево залежностей середовища виконання кожного вбудованого плагіна. Коли вбудований плагін OpenClaw активний через конфігурацію плагінів, застарілу конфігурацію каналу або маніфест, увімкнений за замовчуванням, під час запуску відновлюються лише оголошені цим плагіном залежності середовища виконання перед його імпортом.
Лише збережений стан автентифікації каналу сам по собі не активує вбудований канал для відновлення залежностей середовища виконання Gateway під час запуску.
Явне вимкнення все одно має пріоритет: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` і `channels.<id>.enabled: false`
запобігають автоматичному відновленню вбудованих залежностей середовища виконання для цього плагіна/каналу.
External-плагіни та користувацькі шляхи завантаження все одно потрібно встановлювати через
`openclaw plugins install`.

## Типи плагінів

OpenClaw розпізнає два формати плагінів:

| Формат     | Як це працює                                                   | Приклади                                               |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + модуль середовища виконання; виконується в тому ж процесі | Офіційні плагіни, npm-пакети спільноти                 |
| **Bundle** | Сумісний з Codex/Claude/Cursor макет; зіставляється з можливостями OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва відображаються в `openclaw plugins list`. Докладніше про набори див. у [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native-плагін, почніть із [Building Plugins](/uk/plugins/building-plugins)
і [Plugin SDK Overview](/uk/plugins/sdk-overview).

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

### Core (постачаються разом з OpenClaw)

<AccordionGroup>
  <Accordion title="Провайдери моделей (увімкнені за замовчуванням)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Плагіни пам’яті">
    - `memory-core` — вбудований пошук у пам’яті (типово через `plugins.slots.memory`)
    - `memory-lancedb` — довготривала пам’ять зі встановленням за потреби та автоматичним пригадуванням/захопленням (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Провайдери мовлення (увімкнені за замовчуванням)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser-плагін для browser-інструмента, CLI `openclaw browser`, методу Gateway `browser.request`, browser-середовища виконання та служби керування браузером за замовчуванням (увімкнений за замовчуванням; вимкніть його перед заміною)
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
| `deny`           | Список заборонених плагінів (необов’язково; deny має пріоритет) |
| `load.paths`     | Додаткові файли/каталоги плагінів                         |
| `slots`          | Селектори ексклюзивних слотів (наприклад, `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі для окремого плагіна + конфігурація            |

Зміни конфігурації **потребують перезапуску gateway**. Якщо Gateway запущено з
відстеженням конфігурації та внутрішньопроцесним перезапуском (типовий шлях `openclaw gateway`), такий перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.
Підтримуваного шляху гарячого перезавантаження для native-коду середовища виконання плагіна або хуків життєвого циклу немає; перезапустіть процес Gateway, який обслуговує активний канал, перш ніж очікувати, що оновлений код `register(api)`, хуки `api.on(...)`, інструменти, служби або хуки провайдера/середовища виконання запрацюють.

`openclaw plugins list` — це локальний знімок реєстру/конфігурації плагінів.
Плагін зі станом `enabled` там означає, що збережений реєстр і поточна конфігурація дозволяють цьому плагіну брати участь у роботі. Це не доводить, що вже запущений віддалений дочірній Gateway було перезапущено з тим самим кодом плагіна. У середовищах VPS/контейнерів з процесами-обгортками надсилайте перезапуск до фактичного процесу `openclaw gateway run`,
або використовуйте `openclaw gateway restart` для запущеного Gateway.

<Accordion title="Стани плагінів: вимкнений, відсутній, невалідний">
  - **Disabled**: плагін існує, але правила ввімкнення його вимкнули. Конфігурація зберігається.
  - **Missing**: конфігурація посилається на ідентифікатор плагіна, який не знайдено під час виявлення.
  - **Invalid**: плагін існує, але його конфігурація не відповідає оголошеній схемі.
</Accordion>

## Виявлення та пріоритет

OpenClaw сканує плагіни в такому порядку (перший збіг має пріоритет):

<Steps>
  <Step title="Шляхи з конфігурації">
    `plugins.load.paths` — явні шляхи до файлів або каталогів. Шляхи, які вказують назад на власні пакетні каталоги вбудованих плагінів OpenClaw, ігноруються;
    запустіть `openclaw doctor --fix`, щоб видалити ці застарілі псевдоніми.
  </Step>

  <Step title="Плагіни робочого простору">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Глобальні плагіни">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Вбудовані плагіни">
    Постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (провайдери моделей, мовлення).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила ввімкнення

- `plugins.enabled: false` вимикає всі плагіни
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей плагін
- Плагіни з робочого простору **вимкнені за замовчуванням** (їх потрібно явно ввімкнути)
- Вбудовані плагіни дотримуються вбудованого набору увімкнених за замовчуванням, якщо це не перевизначено
- Ексклюзивні слоти можуть примусово ввімкнути вибраний для цього слота плагін
- Деякі вбудовані плагіни з режимом opt-in увімкнюються автоматично, коли конфігурація називає поверхню, що належить плагіну, наприклад посилання на модель провайдера, конфігурацію каналу або середовище виконання harness
- Маршрути Codex сімейства OpenAI зберігають окремі межі між плагінами:
  `openai-codex/*` належить плагіну OpenAI, тоді як вбудований app-server-плагін Codex вибирається через `agentRuntime.id: "codex"` або застарілі посилання на моделі `codex/*`

## Усунення проблем із хуками середовища виконання

Якщо плагін відображається в `plugins list`, але побічні ефекти `register(api)` або хуки
не спрацьовують у живому трафіку чату, спочатку перевірте таке:

- Виконайте `openclaw gateway status --deep --require-rpc` і підтвердьте, що активні
  URL Gateway, профіль, шлях до конфігурації та процес — саме ті, які ви редагуєте.
- Перезапустіть активний Gateway після змін у встановленні/конфігурації/коді плагіна. У контейнерах-обгортках PID 1 може бути лише супервізором; перезапустіть або надішліть сигнал дочірньому процесу
  `openclaw gateway run`.
- Використовуйте `openclaw plugins inspect <id> --json`, щоб підтвердити реєстрацію хуків і
  діагностику. Невбудовані розмовні хуки, як-от `llm_input`,
  `llm_output`, `before_agent_finalize` і `agent_end`, потребують
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Для перемикання моделей надавайте перевагу `before_model_resolve`. Він виконується до
  розв’язання моделі для ходів агента; `llm_output` виконується лише після того,
  як спроба моделі створює відповідь помічника.
- Для підтвердження фактичної моделі сесії використовуйте `openclaw sessions` або
  поверхні сесії/стану Gateway, а під час налагодження корисних навантажень провайдера запускайте
  Gateway з `--raw-stream --raw-stream-path <path>`.

### Дубльоване володіння каналом або інструментом

Симптоми:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Це означає, що більше ніж один увімкнений плагін намагається володіти тим самим каналом,
потоком налаштування або назвою інструмента. Найпоширеніша причина — зовнішній плагін каналу,
встановлений поруч із вбудованим плагіном, який тепер надає той самий ідентифікатор каналу.

Кроки налагодження:

- Виконайте `openclaw plugins list --enabled --verbose`, щоб побачити кожен увімкнений плагін
  і його походження.
- Виконайте `openclaw plugins inspect <id> --json` для кожного підозрюваного плагіна та
  порівняйте `channels`, `channelConfigs`, `tools` і діагностику.
- Виконайте `openclaw plugins registry --refresh` після встановлення або видалення
  пакетів плагінів, щоб збережені метадані відображали поточне встановлення.
- Перезапустіть Gateway після змін у встановленні, реєстрі або конфігурації.

Варіанти виправлення:

- Якщо один плагін навмисно замінює інший для того самого ідентифікатора каналу, бажаний плагін має оголошувати `channelConfigs.<channel-id>.preferOver` із
  ідентифікатором плагіна нижчого пріоритету. Див. [/plugins/manifest#replacing-another-channel-plugin](/uk/plugins/manifest#replacing-another-channel-plugin).
- Якщо дублювання випадкове, вимкніть одну зі сторін через
  `plugins.entries.<plugin-id>.enabled: false` або видаліть застаріле встановлення плагіна.
- Якщо ви явно ввімкнули обидва плагіни, OpenClaw зберігає цей запит і
  повідомляє про конфлікт. Виберіть одного власника для каналу або перейменуйте
  інструменти, що належать плагіну, щоб поверхня середовища виконання була однозначною.

## Слоти плагінів (ексклюзивні категорії)

Деякі категорії є ексклюзивними (одночасно активний лише один):

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
| `memory`        | Плагін Active Memory   | `memory-core`       |
| `contextEngine` | Активний рушій контексту | `legacy` (вбудований) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний перелік
openclaw plugins list --enabled            # лише увімкнені плагіни
openclaw plugins list --verbose            # детальні рядки для кожного плагіна
openclaw plugins list --json               # перелік у машиночитному форматі
openclaw plugins inspect <id>              # детальна інформація
openclaw plugins inspect <id> --json       # машиночитний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім для inspect
openclaw plugins doctor                    # діагностика
openclaw plugins registry                  # перегляд стану збереженого реєстру
openclaw plugins registry --refresh        # перебудова збереженого реєстру
openclaw doctor --fix                      # відновлення стану реєстру плагінів

openclaw plugins install <package>         # встановлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # встановлення лише з ClawHub
openclaw plugins install <spec> --force    # перезапис наявного встановлення
openclaw plugins install <path>            # встановлення з локального шляху
openclaw plugins install -l <path>         # посилання (без копіювання) для розробки
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # запис точного розв’язаного npm-специфікатора
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один плагін
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # видалити конфігурацію та записи індексу плагіна
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Вбудовані плагіни постачаються разом з OpenClaw. Багато з них увімкнені за замовчуванням (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований
browser-плагін). Інші вбудовані плагіни все одно потребують `openclaw plugins enable <id>`.

`--force` перезаписує вже встановлений плагін або пакет хуків на місці. Для
звичайних оновлень відстежуваних npm-плагінів використовуйте
`openclaw plugins update <id-or-npm-spec>`. Цей режим не підтримується з `--link`, який повторно використовує вихідний шлях замість копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
ідентифікатор встановленого плагіна до цього списку дозволених перед його ввімкненням. Якщо той самий ідентифікатор плагіна
присутній у `plugins.deny`, встановлення видаляє цей застарілий запис deny, щоб
явно встановлений плагін можна було одразу завантажити після перезапуску.

OpenClaw зберігає локальний реєстр плагінів як модель холодного читання для
переліку плагінів, володіння внесками та планування запуску. Потоки встановлення, оновлення,
видалення, ввімкнення та вимкнення оновлюють цей реєстр після зміни стану плагіна.
Той самий файл `plugins/installs.json` зберігає довговічні метадані встановлення у
верхньорівневому `installRecords` і придатні до перебудови метадані маніфесту в `plugins`. Якщо
реєстр відсутній, застарілий або невалідний, `openclaw plugins registry
--refresh` перебудовує його подання маніфесту з записів встановлення, політики конфігурації та
метаданих маніфесту/пакета без завантаження модулів середовища виконання плагіна.
`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm-специфікатора пакета з dist-tag або точною версією розв’язує назву пакета
назад до запису відстежуваного плагіна та зберігає новий специфікатор для майбутніх оновлень.
Передавання назви пакета без версії повертає точно закріплене встановлення назад до
типової лінійки релізів реєстру. Якщо встановлений npm-плагін уже відповідає
розв’язаній версії та записаній ідентичності артефакту, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування конфігурації.

`--pin` працює лише з npm. Він не підтримується разом із `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace замість npm-специфікатора.

`--dangerously-force-unsafe-install` — це аварійне перевизначення для хибнопозитивних спрацювань
вбудованого сканера небезпечного коду. Воно дозволяє продовжити встановлення
та оновлення плагінів попри вбудовані знахідки рівня `critical`, але все ж
не обходить блокування політики плагіна `before_install` або блокування через помилки сканування.

Цей прапорець CLI застосовується лише до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway
замість цього використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні набори беруть участь у тому самому потоці list/inspect/enable/disable
для плагінів. Поточна підтримка середовища виконання включає bundle-Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` і
`lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості набору, а також
підтримувані або непідтримувані записи серверів MCP і LSP для плагінів на основі наборів.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях до
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. Для віддалених marketplace записи плагінів мають залишатися в межах клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Див. [довідку CLI `openclaw plugins`](/uk/cli/plugins) для повної інформації.

## Огляд API плагінів

Native-плагіни експортують об’єкт входу, який надає `register(api)`. Старіші
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
активації плагіна. Завантажувач усе ще повертається до `activate(api)` для старіших плагінів,
але вбудовані плагіни та нові зовнішні плагіни повинні розглядати `register` як
публічний контракт.

`api.registrationMode` повідомляє плагіну, чому завантажується його об’єкт входу:

| Режим           | Значення                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Активація середовища виконання. Реєструйте інструменти, хуки, служби, команди, маршрути та інші побічні ефекти живого середовища.   |
| `discovery`     | Виявлення можливостей у режимі лише читання. Реєструйте провайдерів і метадані; код входу довіреного плагіна може завантажуватися, але пропускайте живі побічні ефекти. |
| `setup-only`    | Завантаження метаданих налаштування каналу через полегшений запис налаштування.                                                       |
| `setup-runtime` | Завантаження налаштування каналу, яке також потребує запису середовища виконання.                                                     |
| `cli-metadata`  | Лише збирання метаданих команд CLI.                                                                                                   |

Об’єкти входу плагінів, які відкривають сокети, бази даних, фонові працівники або довгоживучі
клієнти, повинні захищати ці побічні ефекти перевіркою `api.registrationMode === "full"`.
Завантаження для виявлення кешуються окремо від завантажень для активації й не замінюють
реєстр запущеного Gateway. Виявлення не активує, але й не є вільним від імпорту:
OpenClaw може обчислювати довірений запис плагіна або модуль channel-плагіна, щоб побудувати
знімок. Тримайте верхні рівні модуля легкими та вільними від побічних ефектів, а
мережевих клієнтів, підпроцеси, слухачів, читання облікових даних і запуск служб переносіть
за межі повного шляху середовища виконання.

Поширені методи реєстрації:

| Метод                                  | Що він реєструє              |
| -------------------------------------- | ---------------------------- |
| `registerProvider`                     | Провайдер моделі (LLM)       |
| `registerChannel`                      | Канал чату                   |
| `registerTool`                         | Інструмент агента            |
| `registerHook` / `on(...)`             | Хуки життєвого циклу         |
| `registerSpeechProvider`               | Синтез мовлення / STT        |
| `registerRealtimeTranscriptionProvider`| Потокове STT                 |
| `registerRealtimeVoiceProvider`        | Двосторонній голос у реальному часі |
| `registerMediaUnderstandingProvider`   | Аналіз зображень/аудіо       |
| `registerImageGenerationProvider`      | Генерація зображень          |
| `registerMusicGenerationProvider`      | Генерація музики             |
| `registerVideoGenerationProvider`      | Генерація відео              |
| `registerWebFetchProvider`             | Провайдер веботримання / скрапінгу |
| `registerWebSearchProvider`            | Вебпошук                     |
| `registerHttpRoute`                    | HTTP-ендпойнт                |
| `registerCommand` / `registerCli`      | Команди CLI                  |
| `registerContextEngine`                | Рушій контексту              |
| `registerService`                      | Фонова служба                |

Поведінка захисту хуків для типізованих хуків життєвого циклу:

- `before_tool_call`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `before_install`: `{ block: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `before_install`: `{ block: false }` нічого не робить і не скасовує раніше встановлене блокування.
- `message_sending`: `{ cancel: true }` є термінальним; обробники з нижчим пріоритетом пропускаються.
- `message_sending`: `{ cancel: false }` нічого не робить і не скасовує раніше встановлене скасування.

Native Codex app-server повертає bridge-події native-інструментів Codex назад у цю
поверхню хуків. Плагіни можуть блокувати native-інструменти Codex через `before_tool_call`,
спостерігати за результатами через `after_tool_call` і брати участь у схваленні
`PermissionRequest` Codex. Bridge поки що не переписує аргументи native-інструментів Codex.
Точна межа підтримки середовища виконання Codex описана в
[контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

Повну інформацію про поведінку типізованих хуків див. в [огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building plugins](/uk/plugins/building-plugins) — створіть власний плагін
- [Plugin bundles](/uk/plugins/bundles) — сумісність наборів Codex/Claude/Cursor
- [Plugin manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання інструментів агента в плагіні
- [Plugin internals](/uk/plugins/architecture) — модель можливостей і конвеєр завантаження
- [Community plugins](/uk/plugins/community) — сторонні переліки
