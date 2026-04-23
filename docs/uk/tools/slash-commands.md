---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
summary: 'Slash-команди: текстові та нативні, конфігурація й підтримувані команди'
title: Slash-команди
x-i18n:
    generated_at: "2026-04-23T06:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-команди

Команди обробляються Gateway. Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`.
Команда чату bash, доступна лише на host, використовує `! <cmd>` (із псевдонімом `/bash <cmd>`).

Є дві пов’язані системи:

- **Команди**: окремі повідомлення `/...`.
- **Директиви**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Директиви видаляються з повідомлення до того, як його побачить модель.
  - У звичайних повідомленнях чату (не лише з директив), вони обробляються як “вбудовані підказки” і **не** зберігають налаштування сесії.
  - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії й відповідають підтвердженням.
  - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, використовується лише цей
    allowlist; інакше авторизація надходить із allowlist каналів/сполучення плюс `commands.useAccessGroups`.
    Для неавторизованих відправників директиви сприймаються як звичайний текст.

Також є кілька **вбудованих скорочень** (лише для відправників в allowlist/авторизованих): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Вони виконуються негайно, видаляються до того, як модель побачить повідомлення, а решта тексту проходить звичайним шляхом.

## Конфігурація

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

- `commands.text` (типово `true`) вмикає розбір `/...` у повідомленнях чату.
  - На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо ви встановите тут `false`.
- `commands.native` (типово `"auto"`) реєструє нативні команди.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (доки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки.
  - Щоб перевизначити для конкретного провайдера, задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native` (bool або `"auto"`).
  - `false` очищає раніше зареєстровані команди на Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і автоматично не видаляються.
- `commands.nativeSkills` (типово `"auto"`) реєструє нативно **команди Skills**, коли це підтримується.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібне створення окремої slash-команди для кожного Skill).
  - Щоб перевизначити для конкретного провайдера, задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills` (bool або `"auto"`).
- `commands.bash` (типово `false`) вмикає `! <cmd>` для запуску команд оболонки host (`/bash <cmd>` — псевдонім; потрібні allowlist у `tools.elevated`).
- `commands.bashForegroundMs` (типово `2000`) визначає, скільки часу bash чекає перед переходом у фоновий режим (`0` — одразу у фон).
- `commands.config` (типово `false`) вмикає `/config` (читання/запис `openclaw.json`).
- `commands.mcp` (типово `false`) вмикає `/mcp` (читання/запис конфігурації MCP, якою керує OpenClaw, у `mcp.servers`).
- `commands.plugins` (типово `false`) вмикає `/plugins` (виявлення/статус plugins плюс установлення та керування ввімкненням/вимкненням).
- `commands.debug` (типово `false`) вмикає `/debug` (перевизначення лише для runtime).
- `commands.restart` (типово `true`) вмикає `/restart` плюс дії інструментів перезапуску gateway.
- `commands.ownerAllowFrom` (необов’язково) задає явний owner allowlist для поверхонь команд/інструментів, доступних лише власнику. Це окремо від `commands.allowFrom`.
- Для конкретного каналу `channels.<channel>.commands.enforceOwnerForCommands` (необов’язково, типово `false`) робить так, що команди лише для власника вимагають **ідентичності власника** на цій поверхні. Якщо `true`, відправник має або відповідати розв’язаному кандидату власника (наприклад, запису в `commands.ownerAllowFrom` або нативним метаданим власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Підстановочний запис у `allowFrom` каналу або порожній/нерозв’язаний список кандидатів власника **не** є достатнім — команди лише для власника на цьому каналі закриваються за принципом fail closed. Залишайте це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише через `ownerAllowFrom` і стандартні allowlist команд.
- `commands.ownerDisplay` керує тим, як ідентифікатори власників відображаються в системному промпті: `raw` або `hash`.
- `commands.ownerDisplaySecret` необов’язково задає HMAC-секрет, що використовується, коли `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (необов’язково) задає allowlist для авторизації команд окремо для кожного провайдера. Якщо налаштовано, це
  єдине джерело авторизації для команд і директив (`commands.useAccessGroups`
  і allowlist каналів/сполучення ігноруються). Використовуйте `"*"` як глобальне типове значення; ключі конкретних провайдерів мають пріоритет.
- `commands.useAccessGroups` (типово `true`) застосовує allowlist/політики до команд, коли `commands.allowFrom` не задано.

## Список команд

Поточне джерело істини:

- core built-ins надходять із `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди надходять із `src/auto-reply/commands-registry.data.ts`
- команди plugins надходять із викликів `registerCommand()` у Plugin
- фактична доступність на вашому Gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених plugins

### Вбудовані core-команди

Вбудовані команди, доступні сьогодні:

- `/new [model]` починає нову сесію; `/reset` — псевдонім для скидання.
- `/reset soft [message]` зберігає поточний транскрипт, скидає повторно використовувані ідентифікатори сесій бекенда CLI і повторно запускає завантаження startup/system-prompt на місці.
- `/compact [instructions]` виконує Compaction контексту сесії. Див. [/concepts/compaction](/uk/concepts/compaction).
- `/stop` перериває поточний запуск.
- `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки до треду.
- `/think <level>` задає рівень thinking. Варіанти надходять із профілю провайдера активної моделі; поширені рівні — `off`, `minimal`, `low`, `medium` і `high`, а також custom-рівні на кшталт `xhigh`, `adaptive`, `max` або бінарне `on` лише там, де це підтримується. Псевдоніми: `/thinking`, `/t`.
- `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
- `/trace on|off` перемикає вивід трасування Plugin для поточної сесії.
- `/fast [status|on|off]` показує або задає швидкий режим.
- `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
- `/elevated [on|off|ask|full]` перемикає підвищений режим. Псевдонім: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає типові параметри exec.
- `/model [name|#|status]` показує або задає модель.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` перелічує провайдерів або моделі для провайдера.
- `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами на кшталт `debounce:2s cap:25 drop:summarize`.
- `/help` показує короткий довідковий підсумок.
- `/commands` показує згенерований каталог команд.
- `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
- `/status` показує стан runtime, включно з usage/quota провайдера, коли це доступно.
- `/tasks` перелічує активні/недавні фонові задачі для поточної сесії.
- `/context [list|detail|json]` пояснює, як збирається контекст.
- `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
- `/export-trajectory [path]` експортує JSONL [trajectory bundle](/uk/tools/trajectory) для поточної сесії. Псевдонім: `/trajectory`.
- `/whoami` показує ваш id відправника. Псевдонім: `/id`.
- `/skill <name> [input]` запускає Skill за назвою.
- `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текстова команда.
- `/approve <id> <decision>` розв’язує запити схвалення exec.
- `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [/tools/btw](/uk/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` керує запусками sub-agent для поточної сесії.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і параметрами runtime.
- `/focus <target>` прив’язує поточний тред Discord або тему/розмову Telegram до цілі сесії.
- `/unfocus` видаляє поточну прив’язку.
- `/agents` перелічує агентів, прив’язаних до треду, для поточної сесії.
- `/kill <id|#|all>` перериває один або всі запущені sub-agent.
- `/steer <id|#> <message>` надсилає керування запущеному sub-agent. Псевдонім: `/tell`.
- `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потрібно `commands.config: true`.
- `/mcp show|get|set|unset` читає або записує конфігурацію MCP-сервера, якою керує OpenClaw, у `mcp.servers`. Лише для власника. Потрібно `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` переглядає або змінює стан Plugin. `/plugin` — псевдонім. Запис — лише для власника. Потрібно `commands.plugins: true`.
- `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для runtime. Лише для власника. Потрібно `commands.debug: true`.
- `/usage off|tokens|full|cost` керує нижнім колонтитулом usage для кожної відповіді або виводить локальний підсумок вартості.
- `/tts on|off|status|provider|limit|summary|audio|help` керує TTS. Див. [/tools/tts](/uk/tools/tts).
- `/restart` перезапускає OpenClaw, якщо це ввімкнено. Типово: увімкнено; установіть `commands.restart: false`, щоб вимкнути.
- `/activation mention|always` задає режим активації групи.
- `/send on|off|inherit` задає політику надсилання. Лише для власника.
- `/bash <command>` запускає команду оболонки host. Лише текстова команда. Псевдонім: `! <command>`. Потрібно `commands.bash: true` плюс allowlist у `tools.elevated`.
- `!poll [sessionId]` перевіряє фонову задачу bash.
- `!stop [sessionId]` зупиняє фонову задачу bash.

### Згенеровані dock-команди

Dock-команди генеруються з channel plugins із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

### Команди вбудованих plugins

Вбудовані plugins можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує процесом сполучення/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово озброює високоризикові команди phone node.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає попередньо налаштовані rich card для LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` переглядає й керує вбудованим harness app-server Codex. Див. [Codex Harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як універсальна точка входу.
- Skills також можуть з’являтися як прямі команди, наприклад `/prose`, коли Skill/Plugin їх реєструє.
- Реєстрація нативних команд Skills керується через `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

Примітки:

- Команди приймають необов’язковий `:` між командою й аргументами (наприклад, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (fuzzy match); якщо збігу немає, текст обробляється як тіло повідомлення.
- Для повної деталізації usage провайдера використовуйте `openclaw status --usage`.
- `/allowlist add|remove` потребує `commands.config=true` і враховує `configWrites` каналу.
- У каналах із кількома обліковими записами `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...`, націлені на конфігурацію, також враховують `configWrites` цільового облікового запису.
- `/usage` керує нижнім колонтитулом usage для кожної відповіді; `/usage cost` виводить локальний підсумок вартості з журналів сесій OpenClaw.
- `/restart` типово ввімкнено; установіть `commands.restart: false`, щоб вимкнути його.
- `/plugins install <spec>` приймає ті самі специфікації Plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
- `/plugins enable|disable` оновлює конфігурацію Plugin і може запропонувати перезапуск.
- Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (потребує `channels.discord.voice` і нативних команд; як текстова команда недоступна).
- Команди прив’язки до тредів Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) потребують, щоб ефективні прив’язки до тредів були ввімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
- Довідник команд ACP і поведінка runtime: [ACP Agents](/uk/tools/acp-agents).
- `/verbose` призначено для налагодження та додаткової видимості; у звичайному використанні тримайте його **вимкненим**.
- `/trace` вужчий, ніж `/verbose`: він показує лише рядки трасування/налагодження, що належать Plugin, і залишає звичайний докладний вивід інструментів вимкненим.
- `/fast on|off` зберігає перевизначення для сесії. Використовуйте опцію `inherit` у UI Sessions, щоб очистити його й повернутися до типових значень конфігурації.
- `/fast` залежить від провайдера: OpenAI/OpenAI Codex зіставляють його з `service_tier=priority` на нативних endpoint Responses, тоді як прямі публічні запити Anthropic, включно з трафіком через OAuth, надісланим до `api.anthropic.com`, зіставляють його з `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
- Підсумки збоїв інструментів, як і раніше, показуються, коли це доречно, але детальний текст збоїв включається лише тоді, коли `/verbose` має значення `on` або `full`.
- `/reasoning`, `/verbose` і `/trace` є ризикованими в групових середовищах: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику Plugin, які ви не мали наміру показувати. Краще залишати їх вимкненими, особливо в групових чатах.
- `/model` негайно зберігає нову модель сесії.
- Якщо агент простоює, наступний запуск одразу її використовує.
- Якщо запуск уже активний, OpenClaw позначає live-перемикання як очікуване й перезапускається в нову модель лише в чистій точці повтору.
- Якщо активність інструментів або вивід відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повтору або до наступного ходу користувача.
- **Швидкий шлях:** повідомлення лише з командами від відправників в allowlist обробляються негайно (обхід черги + моделі).
- **Вимога згадування в групі:** повідомлення лише з командами від відправників в allowlist обходять вимоги згадування.
- **Вбудовані скорочення (лише для відправників в allowlist):** деякі команди також працюють, коли вбудовані у звичайне повідомлення, і видаляються до того, як модель побачить решту тексту.
  - Приклад: `hey /status` запускає відповідь зі статусом, а решта тексту проходить звичайним шляхом.
- Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Неавторизовані повідомлення лише з командами тихо ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.
- **Команди Skills:** Skills із `user-invocable` доступні як slash-команди. Назви санітизуються до `a-z0-9_` (макс. 32 символи); у разі колізій додаються числові суфікси (наприклад, `_2`).
  - `/skill <name> [input]` запускає Skill за назвою (корисно, коли обмеження нативних команд не дозволяють окремі команди для кожного Skill).
  - Типово команди Skills пересилаються моделі як звичайний запит.
  - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду безпосередньо до інструмента (детерміновано, без моделі).
  - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
- **Аргументи нативних команд:** Discord використовує autocomplete для динамічних параметрів (і кнопкові меню, якщо ви пропускаєте обов’язкові аргументи). Telegram і Slack показують кнопкове меню, коли команда підтримує варіанти й ви пропускаєте аргумент.

## `/tools`

`/tools` відповідає на запитання runtime, а не конфігурації: **що цей агент може використовувати прямо зараз у
цій розмові**.

- Типовий `/tools` — компактний і оптимізований для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати прив’язані до сесії, тому зміна агента, каналу, треду, авторизації відправника або моделі може
  змінити вивід.
- `/tools` включає інструменти, які справді доступні під час runtime, включно з core-інструментами, підключеними
  інструментами Plugin і інструментами, що належать каналу.

Для редагування профілів і перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу,
а не сприймайте `/tools` як статичний каталог.

## Поверхні usage (що де показується)

- **Usage/quota провайдера** (наприклад: “Claude 80% left”) відображається в `/status` для поточного провайдера моделі, коли відстеження usage увімкнено. OpenClaw нормалізує вікна провайдера до `% left`; для MiniMax поля percent лише із залишком інвертуються перед відображенням, а відповіді `model_remains` надають перевагу запису chat-model плюс мітці плану з міткою моделі.
- **Рядки token/cache** у `/status` можуть використовувати останній запис usage з транскрипту, якщо live-знімок сесії бідний на дані. Наявні ненульові live-значення все одно мають пріоритет, а резервний варіант із транскрипту також може відновити мітку активної runtime-моделі плюс більший загальний обсяг, орієнтований на промпт, коли збережені підсумки відсутні або менші.
- **Токени/вартість для кожної відповіді** керуються через `/usage off|tokens|full` (додаються до звичайних відповідей).
- `/model status` стосується **моделей/автентифікації/endpoint**, а не usage.

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

- `/model` і `/model list` показують компактний нумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадними списками провайдера й моделі та кроком Submit.
- `/model <#>` вибирає з цього списку (і по можливості віддає перевагу поточному провайдеру).
- `/model status` показує детальний вигляд, включно з налаштованим endpoint провайдера (`baseUrl`) і режимом API (`api`), коли це доступно.

## Перевизначення debug

`/debug` дає змогу задавати **перевизначення конфігурації лише для runtime** (пам’ять, не диск). Лише для власника. Типово вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Примітки:

- Перевизначення застосовуються негайно до нових читань конфігурації, але **не** записуються в `openclaw.json`.
- Використовуйте `/debug reset`, щоб очистити всі перевизначення й повернутися до конфігурації на диску.

## Вивід трасування Plugin

`/trace` дає змогу перемикати **рядки трасування/налагодження Plugin у межах сесії** без увімкнення повного verbose-режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан трасування для сесії.
- `/trace on` вмикає рядки трасування Plugin для поточної сесії.
- `/trace off` знову їх вимикає.
- Рядки трасування Plugin можуть з’являтися в `/status` і як діагностичне повідомлення-продовження після звичайної відповіді помічника.
- `/trace` не замінює `/debug`; `/debug`, як і раніше, керує перевизначеннями конфігурації лише для runtime.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу, як і раніше, належить `/verbose`.

## Оновлення конфігурації

`/config` записує у вашу конфігурацію на диску (`openclaw.json`). Лише для власника. Типово вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Примітки:

- Перед записом конфігурація проходить валідацію; недійсні зміни відхиляються.
- Оновлення `/config` зберігаються після перезапусків.

## Оновлення MCP

`/mcp` записує визначення MCP-серверів, якими керує OpenClaw, у `mcp.servers`. Лише для власника. Типово вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Примітки:

- `/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту, якими володіє Pi.
- Які саме транспорти реально можна виконувати, вирішують runtime adapters.

## Оновлення Plugin

`/plugins` дає змогу операторам переглядати знайдені plugins і перемикати ввімкнення в конфігурації. Для сценаріїв лише на читання можна використовувати `/plugin` як псевдонім. Типово вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Примітки:

- `/plugins list` і `/plugins show` використовують реальне виявлення plugins у поточному робочому просторі плюс конфігурацію на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; він не встановлює і не видаляє plugins.
- Після змін `enable`/`disable` перезапустіть gateway, щоб застосувати їх.

## Примітки щодо поверхонь

- **Текстові команди** працюють у звичайній чат-сесії (DM спільно використовують `main`, групи мають власну сесію).
- **Нативні команди** використовують ізольовані сесії:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (націлюється на чат-сесію через `CommandTargetSessionKey`)
- **`/stop`** націлюється на активну чат-сесію, щоб перервати поточний запуск.
- **Slack:** `channels.slack.slashCommand` усе ще підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити по одній slash-команді Slack для кожної built-in команди (з тими самими назвами, що й `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.
  - Виняток для нативної команди Slack: зареєструйте `/agentstatus` (а не `/status`), оскільки Slack резервує `/status`. Текстовий `/status` у повідомленнях Slack усе одно працює.

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** про поточну сесію.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- виконується як окремий **одноразовий** виклик без інструментів,
- не змінює майбутній контекст сесії,
- не записується в історію транскрипту,
- доставляється як live-побічний результат, а не як звичайне повідомлення помічника.

Це робить `/btw` корисним, коли вам потрібне тимчасове уточнення, поки основна
задача триває.

Приклад:

```text
/btw what are we doing right now?
```

Див. [BTW Side Questions](/uk/tools/btw), щоб ознайомитися з повною поведінкою та деталями
UX клієнта.
