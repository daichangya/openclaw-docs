---
read_when:
    - Реалізація або оновлення клієнтів gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, кадри, керування версіями'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-23T17:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 706a6c67129a8e15283ab2635cca11dcc3c6af35aeaefa70d95c28ccd5097a28
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол Gateway WS — це **єдина площина керування + транспорт Node** для
OpenClaw. Усі клієнти (CLI, веб-інтерфейс, застосунок macOS, iOS/Android Node,
headless Node) підключаються через WebSocket і оголошують свої **роль** + **область доступу** під
час рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-навантаженнями.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностику ввімкнено,
  надто великі вхідні кадри та повільні вихідні буфери генерують події `payload.large`
  до того, як gateway закриє з’єднання або відкине відповідний кадр. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, сире тіло кадру, токени, cookie або секретні значення.

## Рукостискання (connect)

Gateway → Клієнт (виклик до підключення):

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

Gateway → Клієнт:

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

`server`, `features`, `snapshot` і `policy` — усі обов’язкові згідно зі схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджені role/scopes, коли вони доступні, і включає `deviceToken`,
коли gateway його видає.

Якщо токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти про узгоджені
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

Під час trusted bootstrap handoff `hello-ok.auth` також може містити додаткові
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

Для вбудованого потоку bootstrap node/operator основний токен node лишається
`scopes: []`, а будь-який переданий токен operator лишається обмеженим allowlist bootstrap operator
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap scope лишаються
прив’язаними до префікса ролі: записи operator задовольняють лише запити operator, а ролі, що не є operator,
усе одно потребують scopes під власним префіксом ролі.

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

## Форматування кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + scopes

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Scopes (operator)

Поширені scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` потребує `operator.talk.secrets`
(або `operator.admin`).

Методи gateway RPC, зареєстровані Plugin, можуть вимагати власний scope operator, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope методу — лише перший рівень перевірки. Деякі slash-команди, до яких звертаються через
`chat.send`, додатково застосовують суворіші перевірки на рівні команди. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами node, що не є exec: `operator.pairing` + `operator.write`
- запити, що включають `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає це як **заяви** та застосовує allowlist на боці сервера.

## Presence

- `system-presence` повертає записи, згруповані за ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження scope для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються через scope, щоб сесії лише з pairing scope або лише Node не отримували пасивно вміст сесії.

- **Кадри chat, agent і результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Широкомовні події `plugin.*`, визначені Plugin**, обмежуються до `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) лишаються без обмежень, щоб стан транспорту лишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються через scope (fail-closed), якщо зареєстрований обробник явно не послаблює ці обмеження.

Кожне клієнтське з’єднання підтримує власний порядковий номер для клієнта, тому широкомовні події зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні відфільтровані через scope підмножини потоку подій.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, збудованим із `src/gateway/server-methods-list.ts` плюс експортованих
методів завантажених plugin/channel. Розглядайте це як виявлення можливостей, а не як повне
перелічення `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає недавній обмежений записувач стабільності діагностики. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви channel/plugin і ідентифікатори сесій. Він не зберігає текст chat, тіла webhook, виводи інструментів, сирі тіла запитів чи відповідей, токени, cookie або секретні значення. Потрібен scope operator read.
    - `status` повертає підсумок gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator з admin scope.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується у relay та потоках pairing.
    - `system-presence` повертає поточний знімок presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання.
    - `usage.status` повертає зведення вікон використання провайдера/залишку квоти.
    - `usage.cost` повертає агреговані зведення вартості використання для діапазону дат.
    - `doctor.memory.status` повертає готовність vector-memory / embedding для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає зведення використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Channel і допоміжні засоби входу">
    - `channels.status` повертає зведення статусу вбудованих і bundled channel/plugin.
    - `channels.logout` виходить із конкретного channel/account, якщо channel підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного web channel provider, що підтримує QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і запускає channel в разі успіху.
    - `push.test` надсилає тестовий APNs push до зареєстрованого iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це RPC прямої вихідної доставки для надсилання з націленням на channel/account/thread поза runner chat.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway з елементами керування cursor/limit і max-byte.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає корисне навантаження ефективної конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан конфігурації провайдера.
    - `tts.providers` повертає видимий перелік провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів для цільових комбінацій команда/ціль.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує валідоване навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідує й замінює повне навантаження конфігурації.
    - `config.schema` повертає навантаження актуальної схеми конфігурації, яке використовують Control UI і інструменти CLI: schema, `uiHints`, версію та метадані генерації, зокрема метадані схеми plugin + channel, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих міток і довідкового тексту, що використовує UI, зокрема для вкладених object, wildcard, array-item і гілок композиції `anyOf` / `oneOf` / `allOf`, коли для відповідних полів є документація.
    - `config.schema.lookup` повертає навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, поверхневий вузол схеми, відповідну підказку + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми в результаті пошуку зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають доступ до wizard онбордингу через WS RPC.
  </Accordion>

  <Accordion title="Допоміжні засоби Agent і workspace">
    - `agents.list` повертає налаштовані записи Agent.
    - `agents.create`, `agents.update` і `agents.delete` керують записами Agent і підключенням workspace.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap workspace, відкритими для Agent.
    - `agent.identity.get` повертає ефективну ідентичність помічника для Agent або сесії.
    - `agent.wait` очікує завершення запуску й повертає кінцевий знімок, якщо він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події змін сесії для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для вказаних ключів сесій.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення до наявної сесії.
    - `sessions.steer` — це варіант переривання й спрямування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання chat, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення в UI-клієнтах: вбудовані теги директив прибираються з видимого тексту, XML-навантаження викликів інструментів у вигляді plain-text (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів) та витеклі ASCII/full-width керівні токени моделі видаляються, чисті рядки помічника з мовчазних токенів, як-от точні `NO_REPLY` / `no_reply`, опускаються, а надто великі рядки можуть замінюватися заповнювачами.
  </Accordion>

  <Accordion title="Пейринг пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої, що очікують схвалення, і вже схвалені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами пейрингу пристроїв.
    - `device.token.rotate` ротує токен спареного пристрою в межах його схвалених role і scopes.
    - `device.token.revoke` відкликає токен спареного пристрою.
  </Accordion>

  <Accordion title="Пейринг Node, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють пейринг Node і bootstrap verification.
    - `node.list` і `node.describe` повертають стан відомих/підключених Node.
    - `node.rename` оновлює мітку спареного Node.
    - `node.invoke` пересилає команду до підключеного Node.
    - `node.invoke.result` повертає результат запиту invoke.
    - `node.event` переносить події, що походять від Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas, обмежені scope.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для offline/disconnected Node.
  </Accordion>

  <Accordion title="Сімейства approval">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити approval для exec, а також пошук/повторення відкладених approval.
    - `exec.approval.waitDecision` очікує на одне відкладене approval exec і повертає підсумкове рішення (або `null` за тайм-аутом).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики approval для gateway exec.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою approval exec через relay-команди Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки approval, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайне або наступне за Heartbeat вбудовування тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення chat у UI, як-от `chat.inject` та інші події chat, що стосуються
  лише transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для
  сесії, на яку є підписка.
- `sessions.changed`: індекс сесій або метадані змінилися.
- `presence`: оновлення знімка system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл пейрингу Node.
- `node.invoke.request`: широкомовний запит invoke Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригерів wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  approval Plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для автоматичних перевірок allow.

### Допоміжні методи operator

- Operators можуть викликати `commands.list` (`operator.read`), щоб отримати runtime
  інвентар команд для Agent.
  - `agentId` необов’язковий; опустіть його, щоб читати workspace Agent за замовчуванням.
  - `scope` керує тим, яку поверхню націлює основне `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають нативні назви з урахуванням provider,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить нативну назву з урахуванням provider, якщо така існує.
  - `provider` необов’язковий і впливає лише на нативне іменування та доступність нативних команд
    Plugin.
  - `includeArgs=false` опускає із відповіді серіалізовані метадані аргументів.
- Operators можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  Agent. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Operators можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective
  інвентар інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить trusted runtime context із сесії на боці сервера замість того, щоб приймати
    auth або контекст доставки, надані викликачем.
  - Відповідь прив’язана до сесії та відображає те, що активна розмова може використовувати просто зараз,
    зокрема інструменти core, plugin і channel.
- Operators можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для Agent.
  - `agentId` необов’язковий; опустіть його, щоб читати workspace Agent за замовчуванням.
  - Відповідь містить відповідність умовам, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих секретних значень.
- Operators можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operators можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` установлює
    теку skill до каталогу `skills/` workspace Agent за замовчуванням.
  - Режим інсталятора gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    виконує оголошену дію `metadata.openclaw.install` на хості gateway.
- Operators можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    workspace Agent за замовчуванням.
  - Режим config патчить значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

## Approval для exec

- Коли запит exec потребує approval, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують підтвердження, викликаючи `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має включати `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сесії). Запити без `systemRunPlan` відхиляються.
- Після approval переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою й фінальним пересиланням схваленого `system.run`,
  gateway відхиляє запуск замість того, щоб довіряти зміненому навантаженню.

## Резервний режим доставки Agent

- Запити `agent` можуть включати `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає строгий режим: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє перейти до виконання лише в межах сесії, якщо не вдається розв’язати жодного зовнішнього маршруту доставки (наприклад, для внутрішніх/webchat-сесій або неоднозначних багатоканальних конфігурацій).

## Керування версіями

- `PROTOCOL_VERSION` знаходиться в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Вони
стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                            | Джерело                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)         | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` мс                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` мс                                        | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` мс                                          | `src/gateway/client.ts`                                    |
| Пільговий час примусової зупинки перед `terminate()` | `250` мс                                 | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут за замовчуванням для `stopAndWait()` | `1_000` мс                                       | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` мс                                     | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 МБ)                           | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не значень за замовчуванням до рукостискання.

## Auth

- Автентифікація gateway за спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму auth.
- Режими з прив’язкою до ідентичності, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку auth для connect на основі
  заголовків запиту замість `connect.params.auth.*`.
- Приватний вхідний режим `gateway.auth.mode: "none"` повністю пропускає auth за спільним секретом для connect; не відкривайте цей режим на публічному/недовіреному ingress.
- Після pairing Gateway видає **device token**, обмежений role + scopes
  цього з’єднання. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** device token також має повторно використовувати збережений
  схвалений набір scopes для цього токена. Це зберігає вже наданий доступ для читання/перевірки/статусу
  і не дає повторним підключенням непомітно звузитися до
  вужчого неявного admin-only scope.
- Формування auth для connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний shared token,
    потім явний `deviceToken`, потім збережений токен для пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Shared token або будь-який визначений device token його пригнічують.
  - Автопідвищення збереженого device token під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` дозволене **лише для довірених endpoint** —
    loopback або `wss://` із зафіксованим `tlsFingerprint`. Публічний `wss://`
    без фіксації не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени handoff для bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth у довіреному транспорті,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт передає **явний** `deviceToken` або явні `scopes`, цей
  набір scopes, запитаний викликачем, залишається авторитетним; кешовані scopes повторно використовуються лише
  тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Device token можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача/ротація токенів лишається обмеженою схваленим набором role, записаним
  у записі pairing цього пристрою; ротація токена не може розширити пристрій до
  role, яку схвалення pairing ніколи не дозволяло.
- Для сесій із device token спареного пристрою керування пристроєм є самостійно обмеженим, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір operator scopes щодо
  поточних scopes сесії викликача. Викликачі без admin не можуть ротувати токен у
  ширший набір operator scopes, ніж вони вже мають.
- Збої auth містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдалася, клієнти мають припинити цикли автоматичного повторного підключення та показати оператору вказівки щодо необхідних дій.

## Ідентичність пристрою + pairing

- Node мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видають токени для кожного пристрою + role.
- Для нових device ID потрібні схвалення pairing, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених допоміжних потоків зі shared-secret.
- Підключення tailnet або LAN на тому самому хості все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може не включати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішний auth operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції auth пристроїв

Для застарілих клієнтів, які досі використовують поведінку підпису до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося обробити формат/канонізацію публічного ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте навантаження v2, яке включає nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` усе ще приймаються для сумісності, але прив’язка метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + фіксація

- Для WS-підключень підтримується TLS.
- Клієнти можуть за бажанням фіксувати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Обсяг

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.
