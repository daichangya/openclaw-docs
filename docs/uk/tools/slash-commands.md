---
read_when:
    - Використання або налаштування команд чату
    - Налагодження маршрутизації команд або дозволів
summary: 'Slash-команди: текстові й нативні, конфігурація та підтримувані команди'
title: Slash-команди
x-i18n:
    generated_at: "2026-04-23T19:28:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62af79d351db2ef6a62df570300bb191c7d5078ef5da2308b4a9d99a56ca7863
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-команди

Команди обробляються Gateway. Більшість команд треба надсилати як **окреме** повідомлення, що починається з `/`.
Host-only bash-команда чату використовує `! <cmd>` (із `/bash <cmd>` як псевдонімом).

Є дві пов’язані системи:

- **Команди**: окремі повідомлення `/...`.
- **Директиви**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Директиви прибираються з повідомлення до того, як його побачить модель.
  - У звичайних чат-повідомленнях (не лише з директивами) вони розглядаються як “вбудовані підказки” і **не** зберігають налаштування сесії.
  - У повідомленнях лише з директивами (повідомлення містить тільки директиви) вони зберігаються в сесії й відповідають підтвердженням.
  - Директиви застосовуються лише для **авторизованих відправників**. Якщо задано `commands.allowFrom`, це єдиний
    allowlist, який використовується; інакше авторизація походить з allowlist каналів/pairing плюс `commands.useAccessGroups`.
    Для неавторизованих відправників директиви обробляються як звичайний текст.

Є також кілька **вбудованих скорочень** (лише для allowlist/авторизованих відправників): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Вони виконуються одразу, прибираються до того, як повідомлення побачить модель, а решта тексту проходить звичайним потоком.

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

- `commands.text` (за замовчуванням `true`) вмикає розбір `/...` у чат-повідомленнях.
  - На поверхнях без нативних команд (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) текстові команди все одно працюють, навіть якщо ви встановите це значення в `false`.
- `commands.native` (за замовчуванням `"auto"`) реєструє нативні команди.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (поки ви не додасте slash-команди); ігнорується для провайдерів без нативної підтримки.
  - Задайте `channels.discord.commands.native`, `channels.telegram.commands.native` або `channels.slack.commands.native`, щоб перевизначити це для конкретного провайдера (bool або `"auto"`).
  - `false` очищає раніше зареєстровані команди в Discord/Telegram під час запуску. Команди Slack керуються в застосунку Slack і не видаляються автоматично.
- `commands.nativeSkills` (за замовчуванням `"auto"`) реєструє команди **Skills** нативно там, де це підтримується.
  - Auto: увімкнено для Discord/Telegram; вимкнено для Slack (у Slack потрібно створювати окрему slash-команду для кожного Skill).
  - Задайте `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` або `channels.slack.commands.nativeSkills`, щоб перевизначити це для конкретного провайдера (bool або `"auto"`).
- `commands.bash` (за замовчуванням `false`) вмикає `! <cmd>` для виконання shell-команд на хості (`/bash <cmd>` — псевдонім; потребує allowlist `tools.elevated`).
- `commands.bashForegroundMs` (за замовчуванням `2000`) керує тим, як довго bash чекає перед переходом у фоновий режим (`0` одразу переводить у фон).
- `commands.config` (за замовчуванням `false`) вмикає `/config` (читає/записує `openclaw.json`).
- `commands.mcp` (за замовчуванням `false`) вмикає `/mcp` (читає/записує конфігурацію MCP, якою керує OpenClaw, у `mcp.servers`).
- `commands.plugins` (за замовчуванням `false`) вмикає `/plugins` (виявлення/статус Plugin плюс встановлення і керування ввімкненням/вимкненням).
- `commands.debug` (за замовчуванням `false`) вмикає `/debug` (перевизначення лише для runtime).
- `commands.restart` (за замовчуванням `true`) вмикає `/restart` і дії інструментів для перезапуску Gateway.
- `commands.ownerAllowFrom` (необов’язково) задає явний owner allowlist для поверхонь команд/інструментів, доступних лише власнику. Це окремо від `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` для кожного каналу (необов’язково, за замовчуванням `false`) змушує команди лише для власника вимагати **ідентичності власника** на цій поверхні. Коли значення `true`, відправник має або відповідати резолвленому кандидату у власники (наприклад запису в `commands.ownerAllowFrom` або нативним метаданим власника провайдера), або мати внутрішню область `operator.admin` на внутрішньому каналі повідомлень. Запис wildcard у `allowFrom` каналу або порожній/нерезолвлений список кандидатів у власники **не** є достатнім — команди лише для власника на цьому каналі безумовно блокуються. Залишайте це вимкненим, якщо хочете, щоб команди лише для власника обмежувалися лише через `ownerAllowFrom` і стандартні allowlist команд.
- `commands.ownerDisplay` керує тим, як id власника відображаються в системному prompt: `raw` або `hash`.
- `commands.ownerDisplaySecret` необов’язково задає HMAC-секрет, який використовується, коли `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (необов’язково) задає allowlist для авторизації команд окремо для кожного провайдера. Якщо його налаштовано, це
  єдине джерело авторизації для команд і директив (allowlist каналів/pairing і `commands.useAccessGroups`
  ігноруються). Використовуйте `"*"` як глобальне значення за замовчуванням; ключі конкретних провайдерів мають пріоритет.
- `commands.useAccessGroups` (за замовчуванням `true`) застосовує allowlist/політики до команд, коли `commands.allowFrom` не задано.

## Список команд

Поточне єдине джерело правди:

- вбудовані core-команди беруться з `src/auto-reply/commands-registry.shared.ts`
- згенеровані dock-команди беруться з `src/auto-reply/commands-registry.data.ts`
- команди Plugin надходять із викликів Plugin `registerCommand()`
- фактична доступність на вашому Gateway усе одно залежить від прапорців конфігурації, поверхні каналу та встановлених/увімкнених Plugin

### Вбудовані core-команди

Наразі доступні такі вбудовані команди:

- `/new [model]` починає нову сесію; `/reset` — псевдонім для reset.
- `/reset soft [message]` зберігає поточний transcript, скидає повторно використані id сесій backend CLI і повторно запускає завантаження startup/system prompt на місці.
- `/compact [instructions]` виконує Compaction контексту сесії. Див. [/concepts/compaction](/uk/concepts/compaction).
- `/stop` перериває поточний запуск.
- `/session idle <duration|off>` і `/session max-age <duration|off>` керують строком дії прив’язки потоку.
- `/think <level>` задає рівень thinking. Варіанти надходять із профілю провайдера активної моделі; поширені рівні — `off`, `minimal`, `low`, `medium` і `high`, а власні рівні на кшталт `xhigh`, `adaptive`, `max` або двійкове `on` доступні лише там, де це підтримується. Псевдоніми: `/thinking`, `/t`.
- `/verbose on|off|full` перемикає докладний вивід. Псевдонім: `/v`.
- `/trace on|off` перемикає вивід trace Plugin для поточної сесії.
- `/fast [status|on|off]` показує або задає швидкий режим.
- `/reasoning [on|off|stream]` перемикає видимість reasoning. Псевдонім: `/reason`.
- `/elevated [on|off|ask|full]` перемикає elevated mode. Псевдонім: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` показує або задає значення exec за замовчуванням.
- `/model [name|#|status]` показує або задає модель.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` показує список провайдерів або моделей для провайдера.
- `/queue <mode>` керує поведінкою черги (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) плюс параметрами на кшталт `debounce:2s cap:25 drop:summarize`.
- `/help` показує коротке зведення довідки.
- `/commands` показує згенерований каталог команд.
- `/tools [compact|verbose]` показує, що поточний агент може використовувати прямо зараз.
- `/status` показує статус runtime, включно з мітками `Runtime`/`Runner` і використанням/квотою провайдера, де це доступно.
- `/tasks` показує список активних/нещодавніх фонових завдань для поточної сесії.
- `/context [list|detail|json]` пояснює, як збирається контекст.
- `/export-session [path]` експортує поточну сесію в HTML. Псевдонім: `/export`.
- `/export-trajectory [path]` експортує JSONL [bundle trajectory](/uk/tools/trajectory) для поточної сесії. Псевдонім: `/trajectory`.
- `/whoami` показує ваш id відправника. Псевдонім: `/id`.
- `/skill <name> [input]` запускає Skill за назвою.
- `/allowlist [list|add|remove] ...` керує записами allowlist. Лише текстова.
- `/approve <id> <decision>` обробляє prompt підтвердження exec.
- `/btw <question>` ставить побічне запитання без зміни майбутнього контексту сесії. Див. [/tools/btw](/uk/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` керує запусками субагентів для поточної сесії.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` керує сесіями ACP і параметрами runtime.
- `/focus <target>` прив’язує поточний потік Discord або topic/conversation Telegram до цілі сесії.
- `/unfocus` видаляє поточну прив’язку.
- `/agents` показує список агентів, прив’язаних до потоку, для поточної сесії.
- `/kill <id|#|all>` перериває один або всі запущені субагенти.
- `/steer <id|#> <message>` надсилає steer запущеному субагенту. Псевдонім: `/tell`.
- `/config show|get|set|unset` читає або записує `openclaw.json`. Лише для власника. Потребує `commands.config: true`.
- `/mcp show|get|set|unset` читає або записує конфігурацію сервера MCP під керуванням OpenClaw у `mcp.servers`. Лише для власника. Потребує `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` перевіряє або змінює стан Plugin. `/plugin` — псевдонім. Запис — лише для власника. Потребує `commands.plugins: true`.
- `/debug show|set|unset|reset` керує перевизначеннями конфігурації лише для runtime. Лише для власника. Потребує `commands.debug: true`.
- `/usage off|tokens|full|cost` керує нижнім колонтитулом використання для кожної відповіді або виводить локальне зведення вартості.
- `/tts on|off|status|provider|limit|summary|audio|help` керує TTS. Див. [/tools/tts](/uk/tools/tts).
- `/restart` перезапускає OpenClaw, якщо цю можливість увімкнено. За замовчуванням: увімкнено; задайте `commands.restart: false`, щоб її вимкнути.
- `/activation mention|always` задає режим активації групи.
- `/send on|off|inherit` задає політику надсилання. Лише для власника.
- `/bash <command>` виконує shell-команду на хості. Лише текстова. Псевдонім: `! <command>`. Потребує `commands.bash: true` плюс allowlist `tools.elevated`.
- `!poll [sessionId]` перевіряє фонове bash-завдання.
- `!stop [sessionId]` зупиняє фонове bash-завдання.

### Згенеровані dock-команди

Dock-команди генеруються з Plugin каналів із підтримкою нативних команд. Поточний вбудований набір:

- `/dock-discord` (псевдонім: `/dock_discord`)
- `/dock-mattermost` (псевдонім: `/dock_mattermost`)
- `/dock-slack` (псевдонім: `/dock_slack`)
- `/dock-telegram` (псевдонім: `/dock_telegram`)

### Команди вбудованих Plugin

Вбудовані Plugin можуть додавати більше slash-команд. Поточні вбудовані команди в цьому репозиторії:

- `/dreaming [on|off|status|help]` перемикає Dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` керує потоком pairing/налаштування пристрою. Див. [Pairing](/uk/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` тимчасово вмикає високоризикові команди Node для телефону.
- `/voice status|list [limit]|set <voiceId|name>` керує конфігурацією голосу Talk. У Discord нативна назва команди — `/talkvoice`.
- `/card ...` надсилає пресети багатих карток LINE. Див. [LINE](/uk/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` перевіряє та керує вбудованим harness app-server Codex. Див. [Codex Harness](/uk/plugins/codex-harness).
- Команди лише для QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Динамічні команди Skills

Skills, які може викликати користувач, також доступні як slash-команди:

- `/skill <name> [input]` завжди працює як загальна точка входу.
- Skills також можуть з’являтися як прямі команди на кшталт `/prose`, коли Skill/Plugin їх реєструє.
- Реєстрацією нативних команд Skills керують `commands.nativeSkills` і `channels.<provider>.commands.nativeSkills`.

Примітки:

- Команди приймають необов’язковий символ `:` між командою й аргументами (наприклад `/think: high`, `/send: on`, `/help:`).
- `/new <model>` приймає псевдонім моделі, `provider/model` або назву провайдера (нечіткий збіг); якщо збігу немає, текст обробляється як тіло повідомлення.
- Для повної деталізації використання провайдера використовуйте `openclaw status --usage`.
- `/allowlist add|remove` вимагає `commands.config=true` і враховує `configWrites` каналу.
- У багатокористувацьких каналах `/allowlist --account <id>` і `/config set channels.<provider>.accounts.<id>...`, націлені на конфігурацію, також враховують `configWrites` цільового акаунта.
- `/usage` керує нижнім колонтитулом використання для кожної відповіді; `/usage cost` виводить локальне зведення вартості з логів сесій OpenClaw.
- `/restart` увімкнено за замовчуванням; задайте `commands.restart: false`, щоб вимкнути його.
- `/plugins install <spec>` приймає ті самі специфікації Plugin, що й `openclaw plugins install`: локальний шлях/архів, npm-пакет або `clawhub:<pkg>`.
- `/plugins enable|disable` оновлює конфігурацію Plugin і може попросити виконати restart.
- Нативна команда лише для Discord: `/vc join|leave|status` керує голосовими каналами (потребує `channels.discord.voice` і нативних команд; недоступна як текстова).
- Команди прив’язки потоку Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) вимагають, щоб ефективні прив’язки потоку були увімкнені (`session.threadBindings.enabled` і/або `channels.discord.threadBindings.enabled`).
- Довідник команд ACP і поведінка runtime: [ACP Agents](/uk/tools/acp-agents).
- `/verbose` призначена для налагодження і додаткової видимості; у звичайному використанні тримайте її **вимкненою**.
- `/trace` вужча за `/verbose`: вона показує лише trace/debug-рядки, що належать Plugin, і не вмикає звичайний докладний вивід інструментів.
- `/fast on|off` зберігає перевизначення сесії. Використовуйте опцію `inherit` в інтерфейсі Sessions, щоб очистити його і повернутися до значень конфігурації за замовчуванням.
- `/fast` залежить від провайдера: OpenAI/OpenAI Codex маплять її на `service_tier=priority` на нативних endpoint Responses, тоді як прямі публічні запити Anthropic, зокрема трафік з OAuth-аутентифікацією до `api.anthropic.com`, маплять її на `service_tier=auto` або `standard_only`. Див. [OpenAI](/uk/providers/openai) і [Anthropic](/uk/providers/anthropic).
- Зведення про помилки інструментів і далі показуються, коли це доречно, але детальний текст помилки включається лише тоді, коли `/verbose` має значення `on` або `full`.
- `/reasoning`, `/verbose` і `/trace` є ризикованими в групових налаштуваннях: вони можуть розкрити внутрішнє reasoning, вивід інструментів або діагностику Plugin, які ви не збиралися показувати. Краще залишати їх вимкненими, особливо в групових чатах.
- `/model` одразу зберігає нову модель сесії.
- Якщо агент неактивний, наступний запуск одразу її використає.
- Якщо запуск уже активний, OpenClaw позначає live-перемикання як відкладене і перезапускає на новій моделі лише в чистій точці повторної спроби.
- Якщо активність інструментів або вивід відповіді вже почалися, відкладене перемикання може лишатися в черзі до пізнішої можливості повторної спроби або до наступного ходу користувача.
- **Швидкий шлях:** повідомлення лише з командами від відправників з allowlist обробляються одразу (в обхід черги й моделі).
- **Обмеження згадками в групі:** повідомлення лише з командами від відправників з allowlist обходять вимоги щодо згадки.
- **Вбудовані скорочення (лише для відправників з allowlist):** певні команди також працюють, коли вбудовані у звичайне повідомлення, і прибираються до того, як модель побачить решту тексту.
  - Приклад: `hey /status` викликає відповідь зі статусом, а решта тексту продовжує оброблятися звичайним потоком.
- Наразі: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Неавторизовані повідомлення лише з командами тихо ігноруються, а вбудовані токени `/...` обробляються як звичайний текст.
- **Команди Skills:** Skills, позначені як `user-invocable`, доступні як slash-команди. Назви нормалізуються до `a-z0-9_` (максимум 32 символи); у разі колізій додаються числові суфікси (наприклад `_2`).
  - `/skill <name> [input]` запускає Skill за назвою (корисно, коли обмеження нативних команд не дозволяють окремі команди для кожного Skill).
  - За замовчуванням команди Skills передаються моделі як звичайний запит.
  - Skills можуть необов’язково оголошувати `command-dispatch: tool`, щоб маршрутизувати команду напряму до інструмента (детерміновано, без моделі).
  - Приклад: `/prose` (Plugin OpenProse) — див. [OpenProse](/uk/prose).
- **Аргументи нативних команд:** Discord використовує автодоповнення для динамічних варіантів (і меню кнопок, якщо ви пропускаєте обов’язкові аргументи). Telegram і Slack показують меню кнопок, коли команда підтримує варіанти, а ви пропускаєте аргумент.

## `/tools`

`/tools` відповідає на питання runtime, а не конфігурації: **що цей агент може використовувати прямо зараз у
цій розмові**.

- Стандартний `/tools` є компактним і оптимізованим для швидкого перегляду.
- `/tools verbose` додає короткі описи.
- Поверхні нативних команд, що підтримують аргументи, надають той самий перемикач режиму `compact|verbose`.
- Результати обмежені сесією, тому зміна агента, каналу, потоку, авторизації відправника або моделі може
  змінити вивід.
- `/tools` включає інструменти, які справді доступні під час runtime, зокрема core-інструменти, підключені
  інструменти Plugin і інструменти, що належать каналу.

Для редагування профілю й перевизначень використовуйте панель Tools у Control UI або поверхні конфігурації/каталогу
замість того, щоб трактувати `/tools` як статичний каталог.

## Поверхні використання (що де показується)

- **Використання/квота провайдера** (наприклад: “Claude 80% left”) з’являється в `/status` для поточного провайдера моделі, коли увімкнено відстеження використання. OpenClaw нормалізує вікна провайдерів до `% left`; для MiniMax відсоткові поля з лише залишком інвертуються перед показом, а відповіді `model_remains` надають перевагу запису chat-моделі плюс мітці плану, позначеній моделлю.
- **Рядки token/cache** у `/status` можуть брати значення з останнього запису використання в transcript, якщо live-знімок сесії містить мало даних. Наявні ненульові live-значення все одно мають пріоритет, а fallback до transcript також може відновити мітку активної runtime-моделі плюс більший загальний обсяг, орієнтований на prompt, коли збережені підсумки відсутні або менші.
- **Runtime проти runner:** `/status` повідомляє `Runtime` для фактичного шляху виконання і стану sandbox, а `Runner` — для того, хто реально виконує сесію: вбудований Pi, провайдер із backend CLI або harness/backend ACP.
- **Кількість token/вартість для кожної відповіді** керується через `/usage off|tokens|full` (додається до звичайних відповідей).
- `/model status` стосується **моделей/auth/endpoint**, а не використання.

## Вибір моделі (`/model`)

`/model` реалізовано як директиву.

Приклади:

```
/model
/model list
/model 3
/model openai/gpt-5.5
/model opus@anthropic:default
/model status
```

Примітки:

- `/model` і `/model list` показують компактний нумерований пікер (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний пікер зі списками провайдерів і моделей та кроком Submit.
- `/model <#>` вибирає зі списку цього пікера (і за можливості надає перевагу поточному провайдеру).
- `/model status` показує детальний перегляд, зокрема налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), якщо вони доступні.

## Перевизначення налагодження

`/debug` дає змогу задавати **перевизначення конфігурації лише для runtime** (у пам’яті, не на диску). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.debug: true`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Примітки:

- Перевизначення застосовуються одразу до нових читань конфігурації, але **не** записуються в `openclaw.json`.
- Використовуйте `/debug reset`, щоб очистити всі перевизначення і повернутися до конфігурації на диску.

## Вивід trace Plugin

`/trace` дає змогу перемикати **рядки trace/debug Plugin в межах сесії** без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Примітки:

- `/trace` без аргументу показує поточний стан trace для сесії.
- `/trace on` вмикає рядки trace Plugin для поточної сесії.
- `/trace off` знову їх вимикає.
- Рядки trace Plugin можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.
- `/trace` не замінює `/debug`; `/debug` і далі керує перевизначеннями конфігурації лише для runtime.
- `/trace` не замінює `/verbose`; звичайний докладний вивід інструментів/статусу і далі належить `/verbose`.

## Оновлення конфігурації

`/config` записує в конфігурацію на диску (`openclaw.json`). Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.config: true`.

Приклади:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Примітки:

- Перед записом конфігурація перевіряється; некоректні зміни відхиляються.
- Оновлення `/config` зберігаються після restart.

## Оновлення MCP

`/mcp` записує визначення MCP-серверів під керуванням OpenClaw у `mcp.servers`. Лише для власника. За замовчуванням вимкнено; увімкніть через `commands.mcp: true`.

Приклади:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Примітки:

- `/mcp` зберігає конфігурацію в конфігурації OpenClaw, а не в налаштуваннях проєкту під керуванням Pi.
- Адаптери runtime вирішують, які транспорти реально можна виконати.

## Оновлення Plugin

`/plugins` дає операторам змогу перевіряти виявлені Plugin і перемикати їх увімкнення в конфігурації. Потоки лише для читання можуть використовувати `/plugin` як псевдонім. За замовчуванням вимкнено; увімкніть через `commands.plugins: true`.

Приклади:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Примітки:

- `/plugins list` і `/plugins show` використовують реальне виявлення Plugin щодо поточного workspace плюс конфігурацію на диску.
- `/plugins enable|disable` оновлює лише конфігурацію Plugin; він не встановлює і не видаляє Plugin.
- Після змін enable/disable перезапустіть gateway, щоб застосувати їх.

## Примітки щодо поверхонь

- **Текстові команди** працюють у звичайній чат-сесії (DM використовують `main`, групи мають власну сесію).
- **Нативні команди** використовують ізольовані сесії:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (префікс налаштовується через `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (націлюється на чат-сесію через `CommandTargetSessionKey`)
- **`/stop`** націлюється на активну чат-сесію, щоб перервати поточний запуск.
- **Slack:** `channels.slack.slashCommand` усе ще підтримується для однієї команди у стилі `/openclaw`. Якщо ви вмикаєте `commands.native`, потрібно створити одну slash-команду Slack для кожної вбудованої команди (з тими самими назвами, що й `/help`). Меню аргументів команд для Slack доставляються як ефемерні кнопки Block Kit.
  - Виняток для нативних команд Slack: реєструйте `/agentstatus` (а не `/status`), тому що Slack резервує `/status`. Текстова `/status` у повідомленнях Slack усе одно працює.

## Побічні запитання BTW

`/btw` — це швидке **побічне запитання** щодо поточної сесії.

На відміну від звичайного чату:

- воно використовує поточну сесію як фоновий контекст,
- запускається як окремий **одноразовий** виклик без інструментів,
- не змінює майбутній контекст сесії,
- не записується в історію transcript,
- доставляється як live-побічний результат, а не як звичайне повідомлення асистента.

Тому `/btw` корисна, коли вам потрібне тимчасове уточнення, поки основне
завдання продовжується.

Приклад:

```text
/btw what are we doing right now?
```

Повну поведінку й деталі UX клієнта див. у [Побічні запитання BTW](/uk/tools/btw).
