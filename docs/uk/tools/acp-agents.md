---
read_when:
    - Запуск coding harnesses через ACP
    - Налаштування ACP-сесій, прив’язаних до розмов, у каналах обміну повідомленнями
    - Прив’язування розмови в каналі повідомлень до постійної ACP-сесії
    - Усунення несправностей backend ACP, підключення plugin або доставки завершення
    - Використання команд /acp із чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні coding harnesses (Claude Code, Cursor, Gemini CLI, explicit Codex ACP, OpenClaw ACP, OpenCode) через backend ACP
title: ACP агенти
x-i18n:
    generated_at: "2026-04-26T07:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00f111cabc46074f5185fefae232bf5d8dfb120fbfdde84a5ea2bfd01c956218
    source_path: tools/acp-agents.md
    workflow: 15
---

Сесії [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
дозволяють OpenClaw запускати зовнішні coding harnesses (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані ACPX harnesses) через plugin backend ACP.

Кожне породження ACP-сесії відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях для зовнішніх harnesses, а не типовий шлях Codex.** Вбудований
plugin app-server Codex керує елементами керування `/codex ...` і
вбудованим runtime `embeddedHarness.runtime: "codex"`; ACP керує
елементами керування `/acp ...` і сесіями `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP client
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                     | Використовуйте це                     | Примітки                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати Codex у поточній розмові або керувати ним                                           | `/codex bind`, `/codex threads`      | Нативний шлях app-server Codex, коли увімкнено plugin `codex`; включає прив’язані відповіді в чаті, пересилання зображень, model/fast/permissions, stop та елементи керування steer. ACP — явний резервний варіант |
| Запустити Claude Code, Gemini CLI, explicit Codex ACP або інший зовнішній harness _через_ OpenClaw | Ця сторінка                          | Сесії, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, елементи керування runtime                                                                   |
| Відкрити сесію Gateway OpenClaw _як_ ACP server для редактора або client                       | [`openclaw acp`](/uk/cli/acp)           | Режим bridge. IDE/client спілкується з OpenClaw по ACP через stdio/WebSocket                                                                                                                 |
| Повторно використовувати локальний AI CLI як лише текстову резервну модель                     | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime harness                                                                                                          |

## Чи працює це одразу після встановлення?

Зазвичай так. Свіжі встановлення постачаються з увімкненим за
замовчуванням вбудованим runtime plugin `acpx` із закріпленим локально для plugin
двійковим файлом `acpx`, який OpenClaw перевіряє й самостійно відновлює під час запуску. Виконайте `/acp doctor` для перевірки готовності.

OpenClaw навчає агентів породженню ACP лише тоді, коли ACP **дійсно
придатний до використання**: ACP має бути увімкнено, dispatch не має бути
вимкнений, поточна сесія не має бути заблокована sandbox, і має бути
завантажено runtime backend. Якщо ці умови не виконуються, skills plugin ACP і
вказівки ACP для `sessions_spawn` залишаються прихованими, щоб агент не пропонував
недоступний backend.

<AccordionGroup>
  <Accordion title="Типові проблеми першого запуску">
    - Якщо встановлено `plugins.allow`, це обмежувальний інвентар plugin і він **має** містити `acpx`; інакше вбудоване типове значення навмисно блокується, а `/acp doctor` повідомляє про відсутній запис в allowlist.
    - Адаптери цільових harnesses (Codex, Claude тощо) можуть завантажуватися на вимогу через `npx` під час першого використання.
    - Автентифікація вендора для цього harness все одно має бути наявною на хості.
    - Якщо хост не має npm або доступу до мережі, завантаження адаптерів під час першого запуску не вдаються, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.
  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає реальний процес зовнішнього harness. OpenClaw керує маршрутизацією,
    станом фонового завдання, доставкою, прив’язками та політикою; harness
    керує своїм входом у provider, каталогом моделей, поведінкою файлової системи та
    нативними інструментами.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений, працездатний backend.
    - Цільовий id дозволено через `acp.allowedAgents`, якщо цей allowlist встановлено.
    - Команду harness можна запустити на хості Gateway.
    - Для цього harness наявна автентифікація provider (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього harness — id моделей не є переносними між harnesses.
    - Запитаний `cwd` існує й доступний, або не задавайте `cwd`, щоб backend використав своє типове значення.
    - Режим permissions відповідає роботі. Неінтерактивні сесії не можуть натискати нативні запити дозволів, тому для coding-запусків із великою кількістю запису/виконання зазвичай потрібен профіль permissions ACPX, який може працювати без голови.

  </Accordion>
</AccordionGroup>

Інструменти plugin OpenClaw і вбудовані інструменти OpenClaw **не** відкриваються
harnesses ACP типово. Увімкніть явні bridge MCP у
[ACP agents — setup](/uk/tools/acp-agents-setup) лише тоді, коли harness
має викликати ці інструменти напряму.

## Підтримувані цілі harness

З вбудованим backend `acpx` використовуйте ці id harnesses як цілі
`/acp spawn <id>` або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Типовий backend                                 | Примітки                                                                             |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`   | Адаптер ACP Claude Code                         | Потребує автентифікації Claude Code на хості.                                        |
| `codex`    | Адаптер ACP Codex                               | Явний резервний варіант ACP лише тоді, коли нативний `/codex` недоступний або запитано ACP. |
| `copilot`  | Адаптер ACP GitHub Copilot                      | Потребує автентифікації CLI/runtime Copilot.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)             | Перевизначте команду acpx, якщо локальне встановлення надає іншу точку входу ACP.    |
| `droid`    | CLI Factory Droid                               | Потребує автентифікації Factory/Droid або `FACTORY_API_KEY` у середовищі harness.    |
| `gemini`   | Адаптер ACP Gemini CLI                          | Потребує автентифікації Gemini CLI або налаштування API key.                         |
| `iflow`    | iFlow CLI                                       | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `kilocode` | Kilo Code CLI                                   | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `kimi`     | CLI Kimi/Moonshot                               | Потребує автентифікації Kimi/Moonshot на хості.                                      |
| `kiro`     | Kiro CLI                                        | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `opencode` | Адаптер ACP OpenCode                            | Потребує автентифікації CLI/provider OpenCode.                                       |
| `openclaw` | Міст Gateway OpenClaw через `openclaw acp`      | Дозволяє ACP-aware harness спілкуватися назад із сесією Gateway OpenClaw.            |
| `pi`       | Pi/вбудований runtime OpenClaw                  | Використовується для нативних експериментів harness у OpenClaw.                      |
| `qwen`     | Qwen Code / Qwen CLI                            | Потребує сумісної з Qwen автентифікації на хості.                                    |

Користувацькі псевдоніми агентів acpx можна налаштувати в самому acpx, але політика OpenClaw
все одно перевіряє `acp.allowedAgents` і будь-яке зіставлення
`agents.list[].runtime.acp.agent` перед dispatch.

## Операційний runbook

Швидкий flow `/acp` із чату:

<Steps>
  <Step title="Породження">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, або явне
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Робота">
    Продовжуйте в прив’язаній розмові або потоці (або явно націлюйтеся на
    ключ сесії).
  </Step>
  <Step title="Перевірка стану">
    `/acp status`
  </Step>
  <Step title="Налаштування">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Скерування">
    Без заміни контексту: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Зупинка">
    `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Деталі життєвого циклу">
    - Породження створює або відновлює сесію runtime ACP, записує метадані ACP у сховищі сесій OpenClaw і може створити фонове завдання, коли запуск належить батьківському процесу.
    - Подальші прив’язані повідомлення надходять безпосередньо до ACP-сесії, доки прив’язку не буде закрито, знято з фокусу, скинуто або доки не сплине її строк дії.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний текст prompt до прив’язаного harness ACP.
    - `cancel` перериває активний хід, коли backend підтримує скасування; це не видаляє прив’язку чи метадані сесії.
    - `close` завершує ACP-сесію з точки зору OpenClaw і видаляє прив’язку. Harness усе ще може зберігати власну upstream history, якщо підтримує відновлення.
    - Неактивні worker runtime підлягають очищенню після `acp.runtime.ttlMinutes`; збережені метадані сесій залишаються доступними для `/acp sessions`.
  </Accordion>
  <Accordion title="Правила маршрутизації нативного Codex">
    Тригери природною мовою, які мають маршрутизуватися до **нативного plugin Codex**,
    коли його увімкнено:

    - "Прив’яжи цей канал Discord до Codex."
    - "Під’єднай цей чат до потоку Codex `<id>`."
    - "Покажи потоки Codex, а потім прив’яжи цей."

    Нативна прив’язка розмов Codex — це типовий шлях керування з чату.
    Динамічні інструменти OpenClaw все ще виконуються через OpenClaw, тоді як
    нативні інструменти Codex, такі як shell/apply-patch, виконуються всередині Codex.
    Для подій нативних інструментів Codex OpenClaw інжектує relay нативних hook
    для кожного ходу, щоб hooks plugin могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через схвалення OpenClaw. Hooks Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де plugins можуть запитати ще один
    прохід моделі перед тим, як Codex остаточно сформує відповідь. Relay залишається
    навмисно консервативним: він не змінює аргументи нативних інструментів Codex
    і не переписує записи потоків Codex. Використовуйте явний ACP лише
    тоді, коли вам потрібна модель runtime/сесії ACP. Межу підтримки вбудованого Codex
    задокументовано в
    [Контракті підтримки harness Codex v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору model / provider / runtime">
    - `openai-codex/*` — маршрут PI Codex OAuth/підписки.
    - `openai/*` плюс `embeddedHarness.runtime: "codex"` — вбудований runtime нативного app-server Codex.
    - `/codex ...` — нативне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` — явне керування ACP/acpx.
  </Accordion>
  <Accordion title="Тригери природної мови для ACP-маршрутизації">
    Тригери, які мають маршрутизуватися до runtime ACP:

    - "Запусти це як одноразову ACP-сесію Claude Code й коротко підсумуй результат."
    - "Використай Gemini CLI для цього завдання в потоці, а потім зберігай подальші повідомлення в тому самому потоці."
    - "Запусти Codex через ACP у фоновому потоці."

    OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness,
    прив’язується до поточної розмови або потоку, коли це підтримується, і
    маршрутизує подальші повідомлення до цієї сесії до її закриття/спливу строку дії. Codex
    іде цим шляхом лише тоді, коли ACP/acpx задано явно або нативний plugin Codex
    недоступний для запитаної операції.

    Для `sessions_spawn` значення `runtime: "acp"` оголошується лише тоді, коли ACP
    увімкнено, запитувач не перебуває в sandbox і завантажено backend runtime ACP.
    Воно націлюється на id harnesses ACP, такі як `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента конфігурації OpenClaw з `agents_list`, якщо цей запис
    не налаштовано явно з `agents.list[].runtime.type="acp"`;
    інакше використовуйте типовий runtime субагента. Коли агент OpenClaw
    налаштовано з `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий id harness.

  </Accordion>
</AccordionGroup>

## ACP порівняно із субагентами

Використовуйте ACP, коли вам потрібен runtime зовнішнього harness. Використовуйте **нативний app-server
Codex** для прив’язування/керування розмовою Codex, коли увімкнено plugin `codex`.
Використовуйте **субагентів**, коли вам потрібні
делеговані запуски, нативні для OpenClaw.

| Область       | ACP-сесія                              | Запуск субагента                   |
| ------------- | -------------------------------------- | ---------------------------------- |
| Runtime       | plugin backend ACP (наприклад acpx)    | нативний runtime субагента OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                           | `/subagents ...`                   |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (типовий runtime) |

Див. також [Субагенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Керувальна площина ACP-сесії OpenClaw.
2. Вбудований runtime plugin `acpx`.
3. Адаптер Claude ACP.
4. Механізм runtime/сесії на боці Claude.

ACP Claude — це **сесія harness** з елементами керування ACP, відновленням сесії,
відстеженням фонового завдання й необов’язковим прив’язуванням до розмови/потоку.

CLI backends — це окремі локальні резервні runtime лише для тексту — див.
[CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, сесії з можливістю прив’язування, елементи керування runtime або постійна робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий резервний варіант через сирий CLI?** Використовуйте CLI backends.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** — місце, де люди продовжують спілкування (канал Discord, тема Telegram, чат iMessage).
- **ACP-сесія** — постійний стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **Дочірній потік/тема** — необов’язкова додаткова поверхня обміну повідомленнями, що створюється лише через `--thread ...`.
- **Робочий простір runtime** — розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір backend), де працює harness. Воно не залежить від поверхні чату.

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` прив’язує поточну розмову до
створеної ACP-сесії — без дочірнього потоку, на тій самій поверхні чату. OpenClaw
і далі керує transport, auth, safety і delivery. Подальші повідомлення в цій
розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають
сесію на місці; `/acp close` знімає прив’язку.

Приклади:

```text
/codex bind                                              # нативна прив’язка Codex, маршрутизувати майбутні повідомлення сюди
/codex model gpt-5.4                                     # налаштувати прив’язаний нативний потік Codex
/codex stop                                              # керувати активним ходом нативного Codex
/acp spawn codex --bind here                             # явний резервний варіант ACP для Codex
/acp spawn codex --thread auto                           # може створити дочірній потік/тему і прив’язати там
/acp spawn codex --bind here --cwd /workspace/repo       # та сама прив’язка чату, Codex працює в /workspace/repo
```

<AccordionGroup>
  <Accordion title="Правила прив’язування та ексклюзивність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише в каналах, які оголошують підтримку прив’язування до поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після restart gateway.
    - У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній потік для `--thread auto|here` — не для `--bind here`.
    - Якщо ви створюєте сесію для іншого агента ACP без `--cwd`, OpenClaw типово успадковує робочий простір **цільового агента**. За відсутності успадкованих шляхів (`ENOENT`/`ENOTDIR`) використовується типове значення backend; інші помилки доступу (наприклад, `EACCES`) повертаються як помилки spawn.
    - Команди керування Gateway залишаються локальними в прив’язаних розмовах — команди `/acp ...` обробляються OpenClaw навіть тоді, коли звичайний текст подальших повідомлень маршрутизується до прив’язаної ACP-сесії; `/status` і `/unfocus` також залишаються локальними, коли для цієї поверхні ввімкнено обробку команд.
  </Accordion>
  <Accordion title="Сесії, прив’язані до потоку">
    Коли для адаптера каналу ввімкнено прив’язки потоків:

    - OpenClaw прив’язує потік до цільової ACP-сесії.
    - Подальші повідомлення в цьому потоці маршрутизуються до прив’язаної ACP-сесії.
    - Вивід ACP доставляється назад у той самий потік.
    - Unfocus/close/archive/сплив строку бездіяльності або максимального віку знімає прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` — це команди Gateway, а не prompt для harness ACP.

    Обов’язкові feature flag для ACP, прив’язаного до потоку:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` типово увімкнено (установіть `false`, щоб призупинити dispatch ACP).
    - Увімкнено прапорець адаптера каналу для породження потоків ACP (залежить від адаптера):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Підтримка прив’язування до потоку залежить від адаптера. Якщо активний адаптер каналу
    не підтримує прив’язки потоків, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою потоків">
    - Будь-який адаптер каналу, який надає можливість прив’язування сесії/потоку.
    - Поточна вбудована підтримка: потоки/канали **Discord**, теми **Telegram** (теми форумів у групах/супергрупах і теми DM).
    - Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язування.
  </Accordion>
</AccordionGroup>

## Постійні прив’язки каналів

Для неефемерних workflow налаштуйте постійні прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язування

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійну прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Визначає цільову розмову. Форми для кожного каналу:

- **Канал/потік Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Тема форуму Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/група BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Для стабільних прив’язок груп надавайте перевагу `chat_id:*` або `chat_identifier:*`.
- **DM/група iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Для стабільних прив’язок груп надавайте перевагу `chat_id:*`.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  ID агента OpenClaw-власника.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Необов’язкове перевизначення ACP.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Необов’язкова мітка для оператора.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  Необов’язковий робочий каталог runtime.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  Необов’язкове перевизначення backend.
  </ParamField>

### Типові значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначення для прив’язаних ACP-сесій:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні типові значення ACP (наприклад `acp.backend`)

### Приклад

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Поведінка

- OpenClaw гарантує, що налаштована ACP-сесія існує перед використанням.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої ACP-сесії.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ ACP-сесії на місці.
- Тимчасові прив’язки runtime (наприклад, створені flow з фокусом на потоці) і далі застосовуються там, де вони є.
- Для міжагентних ACP spawn без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору призводять до повернення до типового cwd backend; помилки доступу для наявних шляхів повертаються як помилки spawn.

## Запуск ACP-сесій

Існує два способи запуску ACP-сесії:

<Tabs>
  <Tab title="Із sessions_spawn">
    Використовуйте `runtime: "acp"`, щоб запустити ACP-сесію з ходу агента або
    виклику інструмента.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    Типове значення `runtime` — `subagent`, тож установіть `runtime: "acp"` явно
    для ACP-сесій. Якщо `agentId` пропущено, OpenClaw використовує
    `acp.defaultAgent`, якщо його налаштовано. `mode: "session"` вимагає
    `thread: true`, щоб зберігати постійну прив’язану розмову.
    </Note>

  </Tab>
  <Tab title="Із команди /acp">
    Використовуйте `/acp spawn` для явного керування оператором із чату.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Основні прапорці:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Див. [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Tab>
</Tabs>

### Параметри `sessions_spawn`

<ParamField path="task" type="string" required>
  Початковий prompt, надісланий до ACP-сесії.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Для ACP-сесій має бути `"acp"`.
</ParamField>
<ParamField path="agentId" type="string">
  Id цільового harness ACP. Використовує `acp.defaultAgent` як резервний варіант, якщо його задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитує flow прив’язування до потоку там, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` — одноразовий запуск; `"session"` — постійна сесія. Якщо `thread: true` і
  `mode` не вказано, OpenClaw може типово використовувати постійну поведінку залежно від
  шляху runtime. `mode: "session"` вимагає `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог runtime (перевіряється політикою backend/runtime).
  Якщо не вказано, ACP spawn успадковує робочий простір цільового агента,
  коли його налаштовано; відсутні успадковані шляхи повертаються до типових значень
  backend, тоді як реальні помилки доступу повертаються як є.
</ParamField>
<ParamField path="label" type="string">
  Мітка для оператора, що використовується в тексті сесії/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновлює наявну ACP-сесію замість створення нової. Агент
  відтворює історію своєї розмови через `session/load`. Вимагає
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` передає зведення про поступ початкового запуску ACP назад до
  сесії-запитувача як системні події. Дозволені відповіді включають
  `streamLogPath`, що вказує на JSONL-журнал у межах сесії
  (`<sessionId>.acp-stream.jsonl`), який можна читати в реальному часі для повної історії relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP через N секунд. `0` залишає хід на
  шляху gateway без тайм-ауту. Те саме значення застосовується до запуску Gateway
  і runtime ACP, щоб завислі harnesses або harnesses з вичерпаною квотою не
  займали lane батьківського агента необмежено довго.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення model для дочірньої ACP-сесії. Породження Codex ACP
  нормалізують посилання OpenClaw Codex, такі як `openai-codex/gpt-5.4`, до стартової конфігурації ACP Codex
  перед `session/new`; форми зі скісною рискою, такі як
  `openai-codex/gpt-5.4/high`, також установлюють reasoning effort для ACP Codex.
  Інші harnesses мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx завершується зрозумілою помилкою,
  а не тихо повертається до типового значення цільового агента.
</ParamField>
<ParamField path="thinking" type="string">
  Явне thinking/reasoning effort. Для Codex ACP `minimal` відповідає
  низькому зусиллю, `low`/`medium`/`high`/`xhigh` зіставляються напряму, а `off`
  прибирає стартове перевизначення reasoning effort.
</ParamField>

## Режими bind і thread для spawn

<Tabs>
  <Tab title="--bind here|off">
    | Режим | Поведінка                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; завершити помилкою, якщо активної немає. |
    | `off`  | Не створювати прив’язку до поточної розмови.                           |

    Примітки:

    - `--bind here` — це найпростіший шлях для оператора для сценарію «зробити цей канал або чат під’єднаним до Codex».
    - `--bind here` не створює дочірній потік.
    - `--bind here` доступний лише в каналах, які надають підтримку прив’язування до поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим | Поведінка                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | У активному потоці: прив’язати цей потік. Поза потоком: створити/прив’язати дочірній потік, якщо підтримується. |
    | `here` | Вимагати поточний активний потік; завершити помилкою, якщо ви не в потоці.                         |
    | `off`  | Без прив’язки. Сесія запускається неприв’язаною.                                                    |

    Примітки:

    - На поверхнях без прив’язування потоків типова поведінка фактично дорівнює `off`.
    - Породження з прив’язкою до потоку вимагає підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього потоку.

  </Tab>
</Tabs>

## Модель доставки

ACP-сесії можуть бути або інтерактивними робочими просторами, або
фоновою роботою під керуванням батьківського процесу. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Інтерактивні ACP-сесії">
    Інтерактивні сесії призначені для продовження спілкування на видимій
    поверхні чату:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до ACP-сесії.
    - `/acp spawn ... --thread ...` прив’язує потік/тему каналу до ACP-сесії.
    - Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої ACP-сесії.

    Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до
    ACP-сесії, а вивід ACP доставляється назад у той самий
    канал/потік/тему.

    Що OpenClaw надсилає до harness:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст prompt, а вкладення — лише тоді, коли harness/backend їх підтримує.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються до dispatch ACP.
    - Згенеровані runtime події завершення матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішній конверт runtime-контексту OpenClaw; зовнішні harnesses ACP отримують звичайний prompt із результатом дочірнього запуску та інструкцією. Сирий конверт `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися зовнішнім harnesses або зберігатися як текст user transcript ACP.
    - Записи transcript ACP використовують видимий для користувача текст тригера або звичайний prompt завершення. Внутрішні метадані подій по можливості залишаються структурованими в OpenClaw і не розглядаються як створений користувачем вміст чату.

  </Accordion>
  <Accordion title="Одноразові ACP-сесії під керуванням батьківського процесу">
    Одноразові ACP-сесії, породжені іншим запуском агента, — це фонові
    дочірні процеси, подібно до субагентів:

    - Батьківський процес запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній процес виконується у власній сесії harness ACP.
    - Дочірні ходи виконуються в тому самому фоновому lane, що й нативні породження субагентів, тож повільний ACP harness не блокує непов’язану роботу основної сесії.
    - Про завершення повідомляється назад через шлях оголошення про завершення завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний prompt ACP перед надсиланням до зовнішнього harness, тож harnesses не бачать маркерів runtime-контексту, призначених лише для OpenClaw.
    - Батьківський процес переписує результат дочірнього запуску звичайним голосом assistant, коли потрібна відповідь для користувача.

    **Не** розглядайте цей шлях як одноранговий чат між батьківським
    і дочірнім процесом. У дочірнього процесу вже є канал завершення назад до
    батьківського.

  </Accordion>
  <Accordion title="Доставка через sessions_send і A2A">
    `sessions_send` може націлюватися на іншу сесію після породження. Для звичайних
    однорангових сесій OpenClaw використовує шлях подальшого повідомлення agent-to-agent (A2A)
    після інжекції повідомлення:

    - Дочекатися відповіді цільової сесії.
    - За бажанням дозволити запитувачу і цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення-оголошення.
    - Доставити це оголошення до видимого каналу або потоку.

    Цей шлях A2A є резервним варіантом для однорангових надсилань, де відправнику потрібна
    видима подальша відповідь. Він залишається увімкненим, коли непов’язана сесія може
    бачити ACP-ціль і надсилати їй повідомлення, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальший етап A2A лише тоді, коли запитувач є
    батьківським процесом свого власного одноразового дочірнього ACP-процесу. У такому разі
    запуск A2A поверх завершення завдання може розбудити батьківський процес результатом
    дочірнього, переслати відповідь батьківського назад до дочірнього процесу й
    створити цикл відлуння батьківського/дочірнього процесів. Результат `sessions_send`
    повідомляє `delivery.status="skipped"` для цього випадку власного дочірнього процесу, оскільки
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Відновлення наявної сесії">
    Використовуйте `resumeSessionId`, щоб продовжити попередню ACP-сесію замість
    запуску з нуля. Агент відтворює історію своєї розмови через
    `session/load`, тож він продовжує з повним контекстом того, що було раніше.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Типові сценарії використання:

    - Передати сесію Codex із ноутбука на телефон — скажіть агенту продовжити з того місця, де ви зупинилися.
    - Продовжити coding-сесію, яку ви почали інтерактивно в CLI, а тепер — без голови через агента.
    - Поновити роботу, яку було перервано restart gateway або тайм-аутом бездіяльності.

    Примітки:

    - `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується з runtime субагента.
    - `resumeSessionId` відновлює upstream history розмови ACP; `thread` і `mode` усе ще застосовуються звичайним чином до нової сесії OpenClaw, яку ви створюєте, тож `mode: "session"` все ще вимагає `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо ID сесії не знайдено, породження завершується зрозумілою помилкою — без тихого повернення до нової сесії.

  </Accordion>
  <Accordion title="Smoke test після розгортання">
    Після розгортання gateway виконайте живу наскрізну перевірку, а не
    покладайтеся лише на модульні тести:

    1. Перевірте версію й коміт розгорнутого gateway на цільовому хості.
    2. Відкрийте тимчасову bridge-сесію ACPX до живого агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, наявність реального `childSessionKey` і відсутність помилки валідатора.
    5. Очистьте тимчасову bridge-сесію.

    Тримайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` —
    шляхи `mode: "session"` з прив’язкою до потоку і relay-потоку є окремими,
    більш насиченими інтеграційними перевірками.

  </Accordion>
</AccordionGroup>

## Сумісність із sandbox

Наразі ACP-сесії працюють у runtime хоста, **а не** всередині
sandbox OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішній harness може читати/записувати відповідно до власних дозволів CLI та вибраного `cwd`.
- Політика sandbox OpenClaw **не** обгортає виконання harness ACP.
- OpenClaw усе ще забезпечує feature gate ACP, дозволені агенти, володіння сесією, прив’язки каналу та політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для нативної роботи OpenClaw із примусовим застосуванням sandbox.
  </Warning>

Поточні обмеження:

- Якщо сесію-запитувача ізольовано sandbox, ACP spawn блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цілі сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує key
   - потім `session id` у форматі UUID
   - потім label
2. Поточна прив’язка потоку (якщо цю розмову/потік прив’язано до ACP-сесії).
3. Резервний варіант — поточна сесія запитувача.

Прив’язки до поточної розмови й прив’язки потоку обидві беруть участь у
кроці 2.

Якщо не вдається визначити жодну ціль, OpenClaw повертає зрозумілу помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що вона робить                                         | Приклад                                                       |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Створює ACP-сесію; необов’язкова поточна прив’язка або прив’язка до потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує хід, що виконується, для цільової сесії.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеної сесії.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сесію та знімає прив’язку з цілей потоку.     | `/acp close`                                                  |
| `/acp status`        | Показує backend, режим, стан, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Встановлює режим runtime для цільової сесії.           | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра конфігурації runtime.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установлює перевизначення робочого каталогу runtime.   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установлює профіль політики погодження.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Установлює timeout runtime (у секундах).               | `/acp timeout 120`                                            |
| `/acp model`         | Установлює перевизначення model runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime для сесії.   | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічує нещодавні ACP-сесії зі сховища.              | `/acp sessions`                                               |
| `/acp doctor`        | Стан backend, можливості, практичні виправлення.       | `/acp doctor`                                                 |
| `/acp install`       | Виводить детерміновані кроки встановлення та ввімкнення. | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори сесій
рівня runtime і рівня backend. Помилки unsupported-control відображаються
зрозуміло, коли backend не має певної можливості. `/acp sessions` читає
сховище для поточної прив’язаної сесії або сесії запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) визначаються через
виявлення сесій gateway, включно з користувацькими коренями `session.store`
для кожного агента.

### Відображення параметрів runtime

`/acp` має зручні команди та загальний setter. Еквівалентні
операції:

| Команда                      | Відповідає                            | Примітки                                                                                                                                                                         |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ключ конфігурації runtime `model`     | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до id моделі адаптера та зіставляє суфікси reasoning зі скісною рискою, такі як `openai-codex/gpt-5.4/high`, із `reasoning_effort`. |
| `/acp set thinking <level>`  | ключ конфігурації runtime `thinking`  | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, якщо адаптер його підтримує.                                                                                    |
| `/acp permissions <profile>` | ключ конфігурації runtime `approval_policy` | —                                                                                                                                                                                |
| `/acp timeout <seconds>`     | ключ конфігурації runtime `timeout`   | —                                                                                                                                                                                |
| `/acp cwd <path>`            | перевизначення cwd runtime            | Пряме оновлення.                                                                                                                                                                 |
| `/acp set <key> <value>`     | загальний                             | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                  |
| `/acp reset-options`         | очищає всі перевизначення runtime     | —                                                                                                                                                                                |

## acpx harness, налаштування plugin і permissions

Щоб дізнатися про конфігурацію harness acpx (псевдоніми Claude Code / Codex / Gemini CLI),
мости MCP для інструментів plugin та інструментів OpenClaw і режими
permissions ACP, див.
[ACP agents — setup](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Імовірна причина                                                                | Виправлення                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend plugin відсутній, вимкнений або заблокований через `plugins.allow`.     | Установіть і ввімкніть plugin backend, додайте `acpx` до `plugins.allow`, коли цей allowlist налаштовано, а потім виконайте `/acp doctor`.                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Установіть `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch зі звичайних повідомлень потоку вимкнено.                              | Установіть `acp.dispatch.enabled=true`.                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає в allowlist.                                                       | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | Перевірка залежностей plugin або самовідновлення все ще виконується.            | Трохи зачекайте й повторно виконайте `/acp doctor`; якщо стан не змінюється, перевірте помилку встановлення backend і політику allow/deny plugin.                        |
| Harness command not found                                                   | CLI адаптера не встановлено або не вдалося завантажити його через `npx` під час першого запуску. | Установіть/попередньо прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                                                                        |
| Model-not-found from the harness                                            | Id model є коректним для іншого provider/harness, але не для цієї ACP-цілі.     | Використайте model, указану цим harness, налаштуйте model у harness або не використовуйте перевизначення.                                                                |
| Vendor auth error from the harness                                          | OpenClaw працездатний, але цільовий CLI/provider не виконав вхід.               | Увійдіть або надайте потрібний ключ provider у середовищі хоста Gateway.                                                                                                  |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.           | Перейдіть до цільового чату/каналу й повторіть спробу або використайте неприв’язане породження.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язування до поточної розмови.                | Використовуйте `/acp spawn ... --thread ...`, якщо підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу.                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                             | Перейдіть до цільового потоку або використайте `--thread auto`/`off`.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язування.                          | Повторно прив’яжіть як власник або використайте іншу розмову чи потік.                                                                                                     |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язування потоків.                                | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                            |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на боці хоста; сесію-запитувача ізольовано sandbox.          | Використовуйте `runtime="subagent"` із sandboxed сесій або запускайте ACP spawn із сесії без sandbox.                                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandboxing або ACP із `sandbox="inherit"` із сесії без sandbox.                                                     |
| `Cannot apply --model ... did not advertise model support`                  | Цільовий harness не надає загального перемикання моделей ACP.                  | Використовуйте harness, який оголошує ACP `models`/`session/set_model`, використовуйте посилання model Codex ACP або налаштуйте model безпосередньо в harness, якщо він має власний стартовий прапорець. |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP-сесії.                                          | Створіть сесію повторно за допомогою `/acp spawn`, а потім повторно прив’яжіть/сфокусуйте потік.                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує запис/виконання в неінтерактивній ACP-сесії.            | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування permissions](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Запити permissions блокуються через `permissionMode`/`nonInteractivePermissions`. | Перевірте журнали gateway на `AcpRuntimeError`. Для повних permissions установіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP-сесія не повідомила про завершення.         | Відстежуйте через `ps aux \| grep acpx`; вручну завершуйте застарілі процеси.                                                                                              |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішній конверт подій просочився через межу ACP.                             | Оновіть OpenClaw і повторно виконайте flow завершення; зовнішні harnesses мають отримувати лише звичайні prompt завершення.                                              |

## Пов’язані

- [ACP agents — setup](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [CLI Backends](/uk/gateway/cli-backends)
- [Codex harness](/uk/plugins/codex-harness)
- [Інструменти sandbox для мультиагентності](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим bridge)](/uk/cli/acp)
- [Субагенти](/uk/tools/subagents)
