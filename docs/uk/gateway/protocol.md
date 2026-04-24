---
read_when:
    - Реалізація або оновлення клієнтів WS gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-24T03:17:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол WS Gateway — це **єдина площина керування + транспорт для node** в
OpenClaw. Усі клієнти (CLI, web UI, застосунок macOS, iOS/Android Node, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **область** під час
рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON payload.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежено 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо diagnostics увімкнено,
  надмірно великі вхідні кадри та повільні вихідні буфери породжують події `payload.large`
  перед тим, як gateway закриє або відкине відповідний кадр. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають
  тіло повідомлення, вміст вкладень, сире тіло кадру, токени, cookies або секретні значення.

## Рукостискання (connect)

Gateway → клієнт (виклик до підключення):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Клієнт → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → клієнт:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджені роль/області, коли вони доступні, і містить `deviceToken`,
коли gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти узгоджені
дозволи:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Коли токен пристрою видається, `hello-ok` також містить:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час передавання довіреного bootstrap `hello-ok.auth` також може містити додаткові
обмежені записи ролей у `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Для вбудованого bootstrap-потоку node/operator основний токен node залишається
`scopes: []`, а будь-який переданий токен operator лишається обмеженим allowlist bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей bootstrap залишаються
прив’язаними до префікса ролі: записи operator задовольняють лише запити operator, а ролям,
що не є operator, усе ще потрібні області під їхнім власним префіксом ролі.

### Приклад Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Формат кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + області

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області (operator)

Поширені області:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

RPC-методи gateway, зареєстровані Plugin, можуть вимагати власну область operator, але
зарезервовані префікси основного admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область методу — лише перший бар’єр. Деякі slash-команди, до яких доходять через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку області під час схвалення поверх
базової області методу:

- запити без команд: `operator.pairing`
- запити з командами node, що не є exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують твердження про можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: allowlist команд для invoke.
- `permissions`: гранулярні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **твердження** і застосовує allowlist-и на боці сервера.

## Presence

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Область трансляції подій broadcast

Надіслані сервером WebSocket broadcast-події обмежуються областями, щоб сесії з областю pairing або сесії лише для node не отримували пасивно вміст сесій.

- **Кадри chat, agent і результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) потребують щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Broadcast-и `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються без обмежень, щоб стан транспорту залишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються областями (безпечна відмова), якщо зареєстрований обробник явно не послаблює їх.

Кожне клієнтське підключення веде власний порядковий номер для кожного клієнта, тож broadcast-и зберігають монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша, ніж наведені вище приклади рукостискання/auth. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, зібраним із `src/gateway/server-methods-list.ts` плюс експортів
методів завантажених plugin/channel. Сприймайте це як виявлення функцій, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає недавній обмежений записувач стабільності diagnostics. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/plugin і id сесій. Він не зберігає текст чату, тіла Webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies або секретні значення. Потрібна область operator read.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator з областю admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яка використовується в потоках relay і pairing.
    - `system-presence` повертає поточний знімок presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час runtime.
    - `usage.status` повертає вікна використання провайдера/зведення залишкових квот.
    - `usage.cost` повертає агреговані зведення вартості використання для діапазону дат.
    - `doctor.memory.status` повертає готовність vector-memory / embedding для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає зведення стану вбудованих і вбудованих у набори каналів/plugin.
    - `channels.logout` виконує вихід для конкретного каналу/облікового запису там, де канал підтримує вихід.
    - `web.login.start` запускає потік входу QR/web для поточного провайдера web-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу QR/web і запускає канал у разі успіху.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, націлених на channel/account/thread, поза chat runner.
    - `logs.tail` повертає хвіст налаштованого файлу журналу gateway з керуванням cursor/limit і max-byte.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає effective payload конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий перелік провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` запускає одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно зіставляє активні SecretRef і замінює секретний стан під час runtime лише за повного успіху.
    - `secrets.resolve` зіставляє призначення секретів для команди/цілі для конкретного набору команд/цілей.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує валідований payload конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідовує й замінює повний payload конфігурації.
    - `config.schema` повертає live payload схеми конфігурації, який використовують Control UI і інструменти CLI: схему, `uiHints`, версію та метадані генерації, включно з метаданими схеми plugin + channel, коли runtime може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих міток і тексту довідки, які використовує UI, включно з вкладеними об’єктами, wildcard, елементами масивів і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
    - `config.schema.lookup` повертає payload пошуку в межах шляху для одного шляху конфігурації: нормалізований шлях, неглибокий вузол схеми, зіставлену підказку + `hintPath` і зведення безпосередніх дочірніх елементів для поглибленого перегляду в UI/CLI. Вузли схеми пошуку зберігають користувацьку документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі, а також прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також зіставлені `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають onboarding wizard через WS RPC.
  </Accordion>

  <Accordion title="Допоміжні засоби агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і wiring робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують bootstrap-файлами робочого простору, відкритими для агента.
    - `agent.identity.get` повертає effective ідентичність помічника для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, коли він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/message для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сесій.
    - `sessions.resolve` зіставляє або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення до наявної сесії.
    - `sessions.steer` — це варіант переривання й коригування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесій.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання chat і далі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теґи директив прибираються з видимого тексту, прості XML payload викликів інструментів (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і усіченими блоками викликів інструментів) і витоки ASCII/full-width керівних токенів моделі прибираються, чисті рядки помічника з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надмірно великі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої, що очікують, і схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` перевипускає токен сполученого пристрою в межах його схвалених ролі та областей.
    - `device.token.revoke` відкликає токен сполученого пристрою.
  </Accordion>

  <Accordion title="Сполучення Node, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють сполучення Node та bootstrap-перевірку.
    - `node.list` і `node.describe` повертають відомий/підключений стан Node.
    - `node.rename` оновлює мітку сполученого Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas з областю дії.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключених Node.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для офлайн/відключених Node.
  </Accordion>

  <Accordion title="Сімейства схвалення">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/повторне відтворення схвалень, що очікують.
    - `exec.approval.waitDecision` очікує рішення щодо одного незавершеного схвалення exec і повертає фінальне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec у gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою схвалення exec у node через relay-команди node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне за Heartbeat введення тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення chat для UI, такі як `chat.inject` та інші події chat,
  що стосуються лише transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для
  підписаної сесії.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення node.
- `node.invoke.request`: трансляція запиту invoke node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: змінено конфігурацію тригерів wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів Skills
  для перевірок auto-allow.

### Допоміжні методи operator

- Operator можуть викликати `commands.list` (`operator.read`), щоб отримати перелік команд під час runtime
  для агента.
  - `agentId` необов’язковий; не передавайте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` визначає, на яку поверхню націлено основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають імена native з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-псевдоніми, такі як `/model` і `/m`.
  - `nativeName` містить назву native з урахуванням провайдера, коли вона існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність native-команд plugin.
  - `includeArgs=false` опускає серіалізовані метадані аргументів із відповіді.
- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів під час runtime для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний перелік інструментів під час runtime
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст runtime із сесії на боці сервера замість прийняття
    auth або контексту доставки, переданого викликачем.
  - Відповідь має область сесії й відображає те, що активна розмова може використовувати прямо зараз,
    включно з core, plugin та інструментами channel.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  перелік Skills для агента.
  - `agentId` необов’язковий; не передавайте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить eligibility, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill до каталогу `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config виправляє значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують рішення, викликаючи `exec.approval.resolve` (потрібна область `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою та фінальним пересиланням схваленого `system.run`,
  gateway відхиляє запуск замість довіри до зміненого payload.

## Резервна доставка агента

- Запити `agent` можуть включати `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, коли не вдається зіставити жоден зовнішній маршрут доставки (наприклад, внутрішні/webchat-сесії або неоднозначні конфігурації з кількома каналами).

## Версіонування

- `PROTOCOL_VERSION` розташовано в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа | Значення за замовчуванням | Джерело |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| Тайм-аут запиту (для кожного RPC) | `30_000` мс | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Тайм-аут preauth / connect-challenge | `10_000` мс | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` мс | `src/gateway/client.ts` (`backoffMs`) |
| Максимальний backoff повторного підключення | `30_000` мс | `src/gateway/client.ts` (`scheduleReconnect`) |
| Clamp швидкого повтору після закриття device-token | `250` мс | `src/gateway/client.ts` |
| Пільговий інтервал примусової зупинки перед `terminate()` | `250` мс | `FORCE_STOP_TERMINATE_GRACE_MS` |
| Типовий тайм-аут `stopAndWait()` | `1_000` мс | `STOP_AND_WAIT_TIMEOUT_MS` |
| Типовий інтервал tick (до `hello-ok`) | `30_000` мс | `src/gateway/client.ts` |
| Закриття через тайм-аут tick | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 МБ) | `src/gateway/server-constants.ts` |

Сервер оголошує effective `policy.tickIntervalMs`, `policy.maxPayload` і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися цих значень, а не типових значень до рукостискання.

## Auth

- Auth gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму auth.
- Режими, що несуть ідентичність, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або `gateway.auth.mode: "trusted-proxy"`
  поза loopback, задовольняють перевірку auth connect за допомогою
  заголовків запиту замість `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для приватного ingress повністю пропускає auth connect
  зі спільним секретом; не відкривайте цей режим для публічного/недовіреного ingress.
- Після сполучення Gateway видає **токен пристрою** з областю дії ролі + областей підключення. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має зберегти його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений схвалений набір областей для цього токена. Це зберігає вже наданий
  доступ до читання/перевірки/стану й запобігає тихому звуженню повторних підключень
  до вужчої неявної області лише для admin.
- Збирання auth connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, коли задано.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний shared token,
    потім явний `deviceToken`, потім збережений токен для пристрою (прив’язаний до
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не зіставив
    `auth.token`. Shared token або будь-який зіставлений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразового
    повтору `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними кінцевими точками** —
    loopback або `wss://` із зафіксованим `tlsFingerprint`. Публічний `wss://`
    без фіксації не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth на довіреному транспорті,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей залишається авторитетним; кешовані області повторно використовуються
  лише тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристроїв можна перевипустити/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область `operator.pairing`).
- Видача/перевипуск токенів лишається обмеженою схваленим набором ролей, записаним у
  записі сполучення цього пристрою; перевипуск токена не може розширити пристрій до
  ролі, якої схвалення сполучення ніколи не надавало.
- Для сесій токенів сполучених пристроїв керування пристроями має власну область, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/перевипускати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір областей operator щодо
  поточних областей сесії викликача. Викликачі без admin не можуть перевипустити токен до
  ширшого набору областей operator, ніж вони вже мають.
- Збої auth містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли повторного підключення й показати вказівки щодо дій оператора.

## Ідентичність пристрою + сполучення

- Node мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видають токени для кожного пристрою + ролі.
- Для нових id пристроїв потрібне схвалення сполучення, якщо не ввімкнено локальне автосхвалення.
- Автосхвалення сполучення зосереджене на прямих локальних підключеннях через loopback.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN з того самого хоста все одно вважаються віддаленими для сполучення і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може опускати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна auth operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний варіант, серйозне зниження безпеки).
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Diagnostics міграції auth пристроїв

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення | details.code | details.reason | Значення |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | Клієнт пропустив `device.nonce` (або надіслав порожнє). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | Клієнт підписався застарілим/неправильним nonce. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | Payload підпису не відповідає payload v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | Позначка часу підпису виходить за межі дозволеного skew. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` не збігається з відбитком публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | Не вдалася перевірка формату/канонізації публічного ключа. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, що містить nonce сервера.
- Надсилайте той самий nonce в `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily` на додачу до полів пристрою/клієнта/ролі/областей/токена/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але закріплення метаданих сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + фіксація

- TLS підтримується для WS-підключень.
- Клієнти за бажанням можуть фіксувати відбиток сертифіката gateway (див. конфігурацію `gateway.tls` плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
