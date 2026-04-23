---
read_when:
    - Використання або налаштування чат-команд
    - Налагодження маршрутизації команд або дозволів
summary: 'Slash-команди: текстові та native, config і підтримувані команди'
title: Slash-команди
x-i18n:
    generated_at: "2026-04-23T23:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, яке починається з `/`.
Чат-команда bash, доступна лише на хості, використовує `! <cmd>` (із `/bash <cmd>` як alias).

Є дві пов’язані системи:

- **Команди**: окремі повідомлення `/...`.
- **Директиви**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Директиви видаляються з повідомлення до того, як його побачить модель.
  - У звичайних чат-повідомленнях (не лише з директивами) вони розглядаються як «вбудовані підказки» і **не** зберігають налаштування сесії.
  - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії й повертають підтвердження.
  - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, це єдиний
    allowlist, який використовується; інакше авторизація походить від allowlist/pairing каналу плюс `commands.useAccessGroups`.
    Для неавторизованих відправників директиви обробляються як звичайний текст.

Також є кілька **вбудованих скорочень** (лише для allowlisted/авторизованих відправників): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Вони запускаються негайно, видаляються до того, як модель побачить повідомлення, а решта тексту проходить звичайним потоком.

## Config

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (типово `true`) вмикає розбір `/...` у чат-повідомленнях.
  - На поверхнях без native-команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо ви задасте тут `false`.
- `commands.native` (типово `"auto"`) реєструє native-команди.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без native-підтримки.
  - Задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити це для конкретного провайдера (bool або `"auto"`).
  - `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
- `commands.nativeSkills` (типово `"auto"`) реєструє native-команди **Skills**, коли це підтримується.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створювати окрему slash-команду для кожної skill).
  - Задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити це для конкретного провайдера (bool або `"auto"`).
- `commands.bash` (типово `false`) вмикає `! <cmd>` для запуску shell-команд хоста (`/bash <cmd>` — alias; потрібні allowlist `tools.elevated`).
- `commands.bashForegroundMs` (типово `2000`) керує тим, скільки часу bash чекає перед переходом у режим background (`0` одразу переводить у background).
- `commands.config` (типово `false`) вмикає `/config` (читання/запис `openclaw.json`).
- `commands.mcp` (типово `false`) вмикає `/mcp` (читання/запис керованого OpenClaw MCP config у `mcp.servers`).
- `commands.plugins` (типово `false`) вмикає `/plugins` (виявлення/status Plugin плюс керування install + enable/disable).
- `commands.debug` (типово `false`) вмикає `/debug` (перевизначення лише для runtime).
- `commands.restart` (типово `true`) вмикає `/restart` плюс дії інструмента перезапуску gateway.
- `commands.ownerAllowFrom` (необов’язково) задає явний allowlist власника для поверхонь команд/інструментів, доступних лише власнику. Це окремо від `commands.allowFrom`.
- Значення для каналу `channels.<channel>.commands.enforceOwnerForCommands` (необов’язкове, типово `false`) змушує команди лише для власника вимагати **ідентичність власника** для запуску на цій поверхні. Якщо `true`, відправник має або відповідати розв’язаному кандидату власника (наприклад запису в `commands.ownerAllowFrom` або native-метаданим власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Запис wildcard у канальному `allowFrom`, або порожній/нерозв’язаний список кандидатів власника, **не** є достатнім — команди лише для власника завершуються в fail-closed на цьому каналі. Залишайте це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише `ownerAllowFrom` і стандартними allowlist команд.
- `commands.ownerDisplay` керує тим, як id власника з’являються в system prompt: `raw` або `hash`.
- `commands.ownerDisplaySecret` необов’язково задає секрет HMAC, який використовується, коли `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (необов’язково) задає allowlist для конкретного провайдера для авторизації команд. Якщо його налаштовано, це
  єдине джерело авторизації для команд і директив (allowlist/pairing каналу та `commands.useAccessGroups`
  ігноруються). Використовуйте `"*"` для глобального типового значення; ключі конкретних провайдерів мають пріоритет над ним.
- `commands.useAccessGroups` (типово `true`) примусово застосовує allowlist/policy до команд, коли `commands.allowFrom` не задано.

## Список команд

Поточне джерело істини:

- вбудовані команди ядра походять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані команди dock походять із `src/auto-reply/commands-registry.data.ts`
- команди Plugin походять із викликів Plugin `registerCommand()`
- фактична доступність на вашому gateway усе одно залежить від прапорців config, поверхні каналу та встановлених/увімкнених Plugin

### Вбудовані команди ядра

Вбудовані команди, доступні сьогодні:

- `/new [model]` починає нову сесію; `/reset` — це alias скидання.
- `/reset soft [message]` зберігає поточний транскрипт, відкидає повторно використані id сесій CLI backend і повторно запускає завантаження startup/system-prompt на місці.
- `/compact [instructions]` виконує Compaction контексту сесії. Див. [/concepts/compaction](/uk/concepts/compaction).
- `/stop` перериває поточний запуск.
- `/session idle <duration|off>` і `/session max-age <duration|off>` керують завершенням терміну дії прив’язки до thread.
- `/think <level>` задає рівень thinking. Варіанти походять із профілю провайдера активної моделі; поширені рівні — `off`, `minimal`, `low`, `medium` і `high`, а власні рівні на кшталт `xhigh`, `adaptive`, `max` або двійковий `on` — лише там, де це підтримується. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` перемикає докладний вивід. Alias: `/v`.
- `/trace on|off` перемикає вивід trace Plugin для поточної сесії.
- `/fast [status|on|off]` показує або задає fast mode.
- `/reasoning [on|off|stream]` перемикає видимість reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` перемикає elevated mode. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові значення exec.
- `/model [name|#|status]` показує або задає модель.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
- `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами на кшталт `debounce:2s cap:25 drop:summarize`.
- `/help` показує короткий підсумок довідки.
- `/commands` показує згенерований catalog команд.
- `/tools [compact|verbose]` показує, що поточний агент може використовувати просто зараз.
- `/status` показує status runtime, включно з мітками `Runtime`/`Runner` і використанням/квотою провайдера, коли доступно.
- `/tasks` показує список активних/недавніх background-завдань для поточної сесії.
- `/context [list|detail|json]` пояснює, як збирається контекст.
- `/export-session [path]` експортує поточну сесію в HTML. Alias: `/export`.
- `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Alias: `/trajectory`.
- `/whoami` показує ваш id відправника. Alias: `/id`.
- `/skill <name> [input]` запускає skill за назвою.
- `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текстова.
- `/approve <id> <decision>` розв’язує запити погодження exec.
- `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [/tools/btw](/uk/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточної сесії.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP та параметрами runtime.
- `/focus <target>` прив’язує поточний Discord thread або Telegram topic/conversation до цілі сесії.
- `/unfocus` прибирає поточну прив’язку.
- `/agents` показує список агентів, прив’язаних до thread, для поточної сесії.
- `/kill <id|#|all>` перериває один або всі запущені sub-agent.
- `/steer <id|#> <message>` надсилає керування запущеному sub-agent. Alias: `/tell`.
- `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
- `/mcp show|get|set|unset` читає або записує керований OpenClaw config MCP server у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан Plugin. `/plugin` — alias. Запис лише для власника. Потребує `commands.plugins: true`.
- `/debug show|set|unset|reset` керує перевизначеннями config лише для runtime. Лише для власника. Потребує `commands.debug: true`.
- `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або виводить локальний підсумок вартості.
- `/tts on|off|status|provider|limit|summary|audio|help` керує TTS. Див. [/tools/tts](/uk/tools/tts).
- `/restart` перезапускає OpenClaw, коли це ввімкнено. Типово: увімкнено; задайте `commands.restart: false`, щоб вимкнути.
- `/activation mention|always` задає режим активації групи.
- `/send on|off|inherit` задає policy надсилання. Лише для власника.
- `/bash <command>` запускає shell-команду хоста. Лише текстова. Alias: `! <command>`. Потребує `commands.bash: true` плюс allowlist `tools.elevated`.
- `!poll [sessionId]` перевіряє background-завдання bash.
- `!stop [sessionId]` зупиняє background-завдання bash.

### Згенеровані dock-команди

Dock-команди генеруються з channel Plugin із підтримкою native-команд. Поточний вбудований набір:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Команди вбудованих Plugin

Вбудовані Plugin можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком pairing/setup пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди phone Node.
- `/voice status|list [limit]|set <voiceId|name>` керує config голосу Talk. У Discord назва native-команди — `/talkvoice`.
- `/card ...` надсилає пресети LINE rich card. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє й керує вбудованим app-server harness Codex. Див. [Codex Harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні skill-команди

Skills, які може викликати користувач, також відкриваються як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли skill/Plugin їх реєструє.
- Реєстрацією native skill-команд керують `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

Примітки:

- Команди приймають необов’язковий `:` між командою та аргументами (наприклад `/think: high`, `/send: on`, `/help:`).
- `/new <model>` приймає alias моделі, `provider/model` або назву провайдера (fuzzy match); якщо збігу немає, текст обробляється як тіло повідомлення.
- Для повної розбивки використання за провайдерами використовуйте `openclaw status --usage`.
- `/allowlist add|remove` потребує `commands.config=true` і враховує канал `configWrites`.
- У multi-account каналах орієнтовані на config команди `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...` також враховують `configWrites` цільового облікового запису.
- `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` виводить локальний підсумок вартості з журналів сесій OpenClaw.
- `/restart` типово увімкнено; задайте `commands.restart: false`, щоб вимкнути його.
- `/plugins install <spec>` приймає ті самі специфікації Plugin, що й `openclaw plugins install`: локальний шлях/архів, npm package або `clawhub:<pkg>`.
- `/plugins enable|disable` оновлює config Plugin і може запропонувати перезапуск.
- Native-команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (потребує `channels.discord.voice` і native-команд; недоступна як текстова).
- Команди прив’язки Discord thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні прив’язки thread були ввімкнені (`session.threadBindings.enabled` та/або `channels.discord.threadBindings.enabled`).
- Довідник команд ACP і поведінка runtime: [ACP Agents](/uk/tools/acp-agents).
- `/verbose` призначена для налагодження та додаткової видимості; у звичайному використанні тримайте її **вимкненою**.
- `/trace` вужча за `/verbose`: вона показує лише trace/debug-рядки, що належать Plugin, і не вмикає звичайний докладний вивід інструментів.
- `/fast on|off` зберігає перевизначення для сесії. Використовуйте опцію `inherit` у Sessions UI, щоб очистити його й повернутися до типових значень config.
- `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють її з `service_tier=priority` на власних endpoint Responses, тоді як прямі публічні запити Anthropic, включно з OAuth-автентифікованим трафіком, надісланим на `api.anthropic.com`, зіставляють її з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
- Підсумки збоїв інструментів усе одно показуються, коли це доречно, але докладний текст помилки включається лише тоді, коли `/verbose` має значення `on` або `full`.
- `/reasoning`, `/verbose` і `/trace` ризиковані в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику Plugin, яку ви не планували показувати. Краще залишати їх вимкненими, особливо в групових чатах.
- `/model` одразу зберігає нову модель сесії.
- Якщо агент неактивний, наступний запуск використає її відразу.
- Якщо запуск уже активний, OpenClaw позначає живе перемикання як відкладене й перезапускає з новою моделлю лише в чистій точці повторної спроби.
- Якщо активність інструментів або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до наступної нагоди для повторної спроби або наступного ходу користувача.
- **Швидкий шлях:** повідомлення лише з командами від allowlisted-відправників обробляються негайно (обхід черги + моделі).
- **Обмеження за згадкою в групі:** повідомлення лише з командами від allowlisted-відправників обходять вимоги згадки.
- **Вбудовані скорочення (лише allowlisted-відправники):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
  - Приклад: `hey /status` викликає відповідь status, а решта тексту проходить звичайним потоком.
- Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Неавторизовані повідомлення лише з командами мовчки ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.
- **Skill-команди:** Skills із можливістю виклику користувачем відкриваються як slash-команди. Назви санітизуються до `a-z0-9_` (максимум 32 символи); колізії отримують числові суфікси (наприклад `_2`).
  - `/skill <name> [input]` запускає skill за назвою (корисно, коли обмеження native-команд не дозволяють команди для кожної skill окремо).
  - Типово skill-команди пересилаються моделі як звичайний запит.
  - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
  - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
- **Аргументи native-команд:** Discord використовує autocomplete для динамічних параметрів (і меню кнопок, якщо ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент.

## `/tools`

`/tools` відповідає на питання runtime, а не config: **що цей агент може використовувати просто зараз у
цій розмові**.

- Типова `/tools` — компактна й оптимізована для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні native-команд, що підтримують аргументи, відкривають той самий перемикач режиму `compact|verbose`.
- Результати мають область дії сесії, тому зміна агента, каналу, thread, авторизації відправника або моделі може
  змінити вивід.
- `/tools` включає інструменти, які реально доступні під час runtime, включно з інструментами ядра, підключеними
  інструментами Plugin та інструментами, що належать каналу.

Для редагування профілю й перевизначень використовуйте панель Tools у Control UI або поверхні config/catalog, а не
ставтеся до `/tools` як до статичного catalog.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (наприклад: “Claude 80% left”) з’являється в `/status` для поточного провайдера моделі, коли ввімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax поля percent лише з залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису chat-model плюс мітці plan із тегом моделі.
- **Рядки токенів/кешу** в `/status` можуть використовувати останній запис використання з транскрипту як запасний варіант, коли live snapshot сесії є неповним. Наявні ненульові live-значення все одно мають пріоритет, а запасний варіант із транскрипту також може відновити мітку активної моделі runtime плюс більше загальне значення, орієнтоване на prompt, коли збережені загальні значення відсутні або менші.
- **Runtime vs runner:** `/status` повідомляє `Runtime` для ефективного шляху виконання і стану sandbox, а `Runner` — хто фактично запускає сесію: вбудований Pi, провайдер на базі CLI чи harness/backend ACP.
- **Токени/вартість для кожної відповіді** керуються через `/usage off|tokens|full` (додаються до звичайних відповідей).
- `/model status` стосується **моделей/auth/endpoint**, а не використання.

## Вибір моделі (`/model`)

`/model` реалізовано як директиву.

Приклади:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Примітки:

- `/model` і `/model list` показують компактний нумерований picker (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний picker зі списками провайдерів і моделей плюс кроком Submit.
- `/model <#>` вибирає зі списку цього picker (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує докладне подання, включно з налаштованим endpoint провайдера (`baseUrl`) і режимом API (`api`), коли вони доступні.

## Debug-перевизначення

`/debug` дає змогу задавати перевизначення config **лише для runtime** (пам’ять, не диск). Лише для власника. Типово вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Примітки:

- Перевизначення застосовуються одразу до нових читань config, але **не** записуються в `openclaw.json`.
- Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до config на диску.

## Trace-вивід Plugin

`/trace` дає змогу перемикати **trace/debug-рядки Plugin в межах сесії** без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан trace для сесії.
- `/trace on` вмикає trace-рядки Plugin для поточної сесії.
- `/trace off` знову вимикає їх.
- Trace-рядки Plugin можуть з’являтися в `/status` і як діагностичне повідомлення після звичайної відповіді assistant.
- `/trace` не замінює `/debug`; `/debug` як і раніше керує перевизначеннями config лише для runtime.
- `/trace` не замінює `/verbose`; звичайний verbose-вивід інструментів/status як і раніше належить `/verbose`.

## Оновлення config

`/config` записує ваш on-disk config (`openclaw.json`). Лише для власника. Типово вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Примітки:

- Config проходить валідацію перед записом; невалідні зміни відхиляються.
- Оновлення через `/config` зберігаються після перезапуску.

## Оновлення MCP

`/mcp` записує визначення MCP server, якими керує OpenClaw, у `mcp.servers`. Лише для власника. Типово вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Примітки:

- `/mcp` зберігає config у config OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi.
- Адаптери runtime визначають, які transport фактично можуть виконуватися.

## Оновлення Plugin

`/plugins` дає змогу операторам перевіряти виявлені Plugin і перемикати їх увімкнення в config. Потоки лише для читання можуть використовувати `/plugin` як alias. Типово вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Примітки:

- `/plugins list` і `/plugins show` використовують реальне виявлення Plugin відносно поточного workspace плюс on-disk config.
- `/plugins enable|disable` оновлює лише config Plugin; це не встановлює і не видаляє Plugin.
- Після змін enable/disable перезапустіть gateway, щоб застосувати їх.

## Примітки щодо поверхонь

- **Текстові команди** працюють у звичайній чат-сесії (DM використовують `main`, групи мають власну сесію).
- **Native-команди** використовують ізольовані сесії:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс можна налаштувати через `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (націлюється на чат-сесію через `CommandTargetSessionKey`)
- **`/stop`** націлюється на активну чат-сесію, щоб перервати поточний запуск.
- **Slack:** `channels.slack.slashCommand` усе ще підтримується для однієї команди в стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, ви маєте створити по одній Slack slash-команді для кожної вбудованої команди (з тими самими назвами, що й `/help`). Меню аргументів команд для Slack доставляються як ephemeral-кнопки Block Kit.
  - Виняток native-команд Slack: реєструйте `/agentstatus` (не `/status`), тому що `/status` зарезервовано Slack. Текстова `/status` у повідомленнях Slack все одно працює.

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- виконується як окремий **одноразовий виклик без інструментів**,
- не змінює майбутній контекст сесії,
- не записується в історію транскрипту,
- доставляється як live-побічний результат, а не як звичайне повідомлення assistant.

Це робить `/btw` корисним, коли вам потрібно тимчасове уточнення, а основне
завдання має продовжуватися.

Приклад:

```text
/btw what are we doing right now?
```

Повну поведінку й подробиці UX клієнта див. в [Побічних запитаннях BTW](/uk/tools/btw).

## Пов’язане

- [Skills](/uk/tools/skills)
- [Config Skills](/uk/tools/skills-config)
- [Створення Skills](/uk/tools/creating-skills)
