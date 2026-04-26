---
read_when:
    - Реалізація або оновлення клієнтів gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-26T07:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS — це **єдина площина керування + транспорт вузлів** для
OpenClaw. Усі клієнти (CLI, веб-UI, macOS app, вузли iOS/Android, безголові
вузли) підключаються через WebSocket і оголошують свої **role** + **scope** під
час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з корисним навантаженням JSON.
- Перший фрейм **обов’язково** має бути запитом `connect`.
- До підключення фрейми обмежені 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо ввімкнено diagnostics,
  завеликі вхідні фрейми та повільні вихідні буфери створюють події `payload.large`
  до того, як gateway закриє підключення або відкине відповідний фрейм. Ці події містять
  розміри, ліміти, поверхні та безпечні reason codes. Вони не зберігають
  тіло повідомлення, вміст вкладень, необроблене тіло фрейму, токени, cookies або секретні значення.

## Рукостискання (connect)

Gateway → Client (challenge до підключення):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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

`server`, `features`, `snapshot` і `policy` є обов’язковими згідно зі schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджені role/scopes, коли вони доступні, і містить `deviceToken`,
коли gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти про узгоджені
permissions:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в межах того самого процесу (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть пропускати `device` на прямих loopback-підключеннях, коли
вони автентифікуються спільним токеном/паролем gateway. Цей шлях зарезервовано
для внутрішніх RPC площини керування й дозволяє застарілим базовим станам pairing CLI/пристроїв
не блокувати локальну backend-роботу, як-от оновлення сесій субагентів. Віддалені клієнти,
клієнти з походженням browser, клієнти-вузли та явні клієнти з device-token/device-identity
усе ще використовують звичайні перевірки pairing та оновлення scope.

Коли видається токен пристрою, `hello-ok` також містить:

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
обмежені записи role у `deviceTokens`:

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

Для вбудованого потоку bootstrap node/operator основний токен вузла лишається з
`scopes: []`, а будь-який переданий токен оператора лишається обмеженим allowlist bootstrap-оператора
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap scope лишаються
з префіксом role: записи operator задовольняють лише запити operator, а ролям, відмінним від operator,
усе ще потрібні scopes під префіксом їхньої власної role.

### Приклад вузла

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

## Фреймування

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами вимагають **ключів ідемпотентності** (див. schema).

## Roles + scopes

### Roles

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

`talk.config` з `includeSecrets: true` вимагає `operator.talk.secrets`
(або `operator.admin`).

RPC-методи gateway, зареєстровані Plugin, можуть вимагати власний scope operator, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope методу — лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, застосовують суворіші перевірки на рівні команд поверх цього. Наприклад,
постійні записи `/config set` і `/config unset` вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами вузла, відмінними від exec: `operator.pairing` + `operator.write`
- запити, що містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують claims можливостей під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує їх як **claims** і примусово застосовує server-side allowlists.

## Presence

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження scope для широкомовних подій

Широкомовні події WebSocket, що надсилаються сервером, обмежуються за scope, щоб сесії лише з pairing-scope або лише для node не отримували пасивно вміст сесії.

- **Фрейми chat, agent і результатів інструментів** (зокрема потокові події `agent` і результати виклику інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Широкомовні події `plugin.*`, визначені Plugin**, обмежуються до `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан транспорту лишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** обмежуються за scope за замовчуванням (fail-closed), якщо зареєстрований обробник явно не послаблює ці обмеження.

Кожне клієнтське підключення веде власний номер послідовності для конкретного клієнта, тож широкомовні події зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scope.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша, ніж наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, зібраним із `src/gateway/server-methods-list.ts` плюс експортів методів завантажених
Plugin/channel. Сприймайте це як виявлення можливостей, а не як повне
перелічення `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає недавній обмежений recorder стабільності diagnostics. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви channel/Plugin і session ids. Він не зберігає текст чату, тіла Webhook, виводи інструментів, необроблені тіла запитів або відповідей, токени, cookies чи секретні значення. Потрібен scope operator read.
    - `status` повертає підсумок gateway у стилі `/status`; чутливі поля включаються лише для клієнтів operator зі scope admin.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, що використовується relay і потоками pairing.
    - `system-presence` повертає поточний знімок presence для підключених пристроїв operator/node.
    - `system-event` додає системну подію й може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` вмикає або вимикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених у runtime.
    - `usage.status` повертає підсумки вікон використання провайдера/залишку квоти.
    - `usage.cost` повертає агреговані підсумки вартості використання для діапазону дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / embeddings для активної робочої області типового агента.
    - `sessions.usage` повертає підсумки використання для кожної сесії.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає підсумки стану вбудованих і комплектних channel/Plugin.
    - `channels.logout` виходить із конкретного каналу/облікового запису, якщо канал підтримує вихід.
    - `web.login.start` запускає потік входу QR/web для поточного провайдера вебканалу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий push APNs на зареєстрований вузол iOS.
    - `voicewake.get` повертає збережені тригери слова пробудження.
    - `voicewake.set` оновлює тригери слова пробудження та транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилання з націленням на канал/обліковий запис/тред поза виконавцем чату.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway з керуванням cursor/limit і max-byte.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження config Talk; `includeSecrets` вимагає `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` установлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активний мовленнєвий провайдер Talk.
    - `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів і стан config провайдера.
    - `tts.providers` повертає видимий реєстр провайдерів TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного провайдера TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, config, update і wizard">
    - `secrets.reload` повторно розв’язує активні SecretRef і замінює секретний стан runtime лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів для команди-цілі для конкретного набору command/target.
    - `config.get` повертає поточний знімок config і hash.
    - `config.set` записує валідоване корисне навантаження config.
    - `config.patch` зливає часткове оновлення config.
    - `config.apply` валідовує й замінює повне корисне навантаження config.
    - `config.schema` повертає корисне навантаження live schema config, яке використовують Control UI і CLI tooling: schema, `uiHints`, версію та метадані генерації, зокрема метадані schema Plugin + channel, коли runtime може їх завантажити. Schema містить метадані полів `title` / `description`, похідні від тих самих міток і тексту довідки, які використовує UI, включно з вкладеними об’єктами, wildcard, елементами масиву та гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене path, для одного шляху config: нормалізований шлях, неглибокий вузол schema, відповідний hint + `hintPath` і підсумки безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли schema пошуку зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Підсумки дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають майстер початкового налаштування через WS RPC.
  </Accordion>

  <Accordion title="Агент і допоміжні засоби робочої області">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і підключенням робочої області.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочої області, доступними для агента.
    - `agent.identity.get` повертає ефективну identity помічника для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, коли він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або вимикають підписки на події транскрипту/повідомлень для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди транскрипту для конкретних ключів сесій.
    - `sessions.resolve` розв’язує або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання й коригування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив видаляються з видимого тексту, XML-корисні навантаження викликів інструментів у вигляді звичайного тексту (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів) та leaked ASCII/full-width токени керування моделлю видаляються, чисті рядки помічника з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` змінює токен сполученого пристрою в межах його схваленої role і меж scope викликача.
    - `device.token.revoke` відкликає токен сполученого пристрою в межах його схваленої role і меж scope викликача.
  </Accordion>

  <Accordion title="Сполучення вузлів, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють сполучення вузлів і bootstrap-перевірку.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду на підключений вузол.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas, обмежені scope.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключених вузлів.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для офлайн/відключених вузлів.
  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/повторне відтворення очікуваних схвалень.
    - `exec.approval.waitDecision` очікує на одне очікуване схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою схвалення exec вузла через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills і інструменти">
    - Автоматизація: `wake` планує негайну або на наступний Heartbeat ін’єкцію тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, такі як `chat.inject` та інші події чату лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  сесії, на яку оформлено підписку.
- `sessions.changed`: змінено індекс сесії або метадані.
- `presence`: оновлення знімка system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: широкомовний запит invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: змінено config тригера слова пробудження.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення Plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати runtime-
  реєстр команд для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб читати типову робочу область агента.
  - `scope` керує тим, на яку поверхню націлений основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають назви native з урахуванням провайдера,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить назву native з урахуванням провайдера, коли вона існує.
  - `provider` є необов’язковим і впливає лише на native-іменування плюс доступність native-команд Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь містить згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-ефективний
  реєстр інструментів для сесії.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений runtime-контекст із сесії на стороні сервера замість приймання
    auth або контексту доставки, наданих викликаючою стороною.
  - Відповідь обмежена сесією й відображає те, що активна розмова може використовувати просто зараз,
    включно з core-, plugin- і channel-інструментами.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  реєстр skill для агента.
  - `agentId` є необов’язковим; пропустіть його, щоб читати типову робочу область агента.
  - Відповідь містить eligibility, відсутні вимоги, перевірки config і
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` установлює
    папку skill до каталогу `skills/` типової робочої області агента.
  - Режим інсталятора gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    виконує оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    типовій робочій області агента.
  - Режим config змінює значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти-оператори виконують розв’язання викликом `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликаюча сторона змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між підготовкою й фінальним пересланим `system.run`, gateway
  відхиляє запуск замість того, щоб довіряти зміненому корисному навантаженню.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true` для запиту вихідної доставки.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в межах сесії, коли не вдається розв’язати зовнішній маршрут доставки (наприклад, для internal/webchat-сесій або неоднозначних конфігурацій кількох каналів).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Schemas + models генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Ці значення
стабільні в межах протоколу v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                 | Типове значення                                      | Джерело                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                  | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` мс                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` мс                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` мс                                        | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` мс                                          | `src/gateway/client.ts`                                    |
| Пауза перед примусовим `terminate()`      | `250` мс                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Типовий тайм-аут `stopAndWait()`          | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Типовий інтервал tick (до `hello-ok`)     | `30_000` мс                                          | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, якщо тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не типових значень до рукостискання.

## Автентифікація

- Автентифікація gateway за спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими, що несуть identity, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect за
  заголовками запиту замість `connect.params.auth.*`.
- Для приватного ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect зі спільним секретом; не відкривайте цей режим у публічному/недовіреному ingress.
- Після сполучення Gateway видає **токен пристрою**, обмежений role + scopes цього підключення.
  Він повертається в `hello-ok.auth.deviceToken` і має бути
  збережений клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений набір схвалених scope для цього токена. Це зберігає доступ на читання/перевірку/статус,
  який уже було надано, і не дає повторним підключенням непомітно звузитися до
  вужчого неявного scope лише для admin.
- Формування автентифікації connect на стороні клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене лише **довіреними endpoint** —
    loopback або `wss://` із зафіксованим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію через довірений транспорт,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликаючою стороною набір scope лишається авторитетним; кешовані scopes повторно використовуються лише тоді,
  коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна змінювати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача, зміна та відкликання токенів завжди обмежені схваленим набором role,
  записаним у записі pairing цього пристрою; зміна токена не може розширити
  або націлитися на role пристрою, яку схвалення pairing ніколи не надавало.
- Для сесій із токеном сполученого пристрою керування пристроєм обмежене самим пристроєм, якщо тільки
  викликаюча сторона не має також `operator.admin`: виклики без admin можуть видаляти/відкликати/змінювати
  лише **власний** запис пристрою.
- `device.token.rotate` і `device.token.revoke` також перевіряють набір scope
  цільового токена оператора щодо поточних scope сесії викликача. Виклики без admin
  не можуть змінювати або відкликати ширший токен оператора, ніж той, який вони вже мають.
- Збої автентифікації містять `error.details.code` плюс підказки з відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити цикли автоматичного повторного підключення й показати оператору вказівки до дії.

## Identity пристрою + pairing

- Вузли мають включати стабільну identity пристрою (`device.id`), похідну від
  відбитка ключової пари.
- Gateways видають токени для кожного пристрою + role.
- Для нових ID пристроїв потрібні схвалення pairing, якщо не ввімкнено локальне auto-approval.
- Auto-approval pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях self-connect backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN з того самого хоста все одно вважаються віддаленими для pairing і
  потребують схвалення.
- WS-клієнти зазвичай включають identity `device` під час `connect` (operator +
  node). Єдині винятки для operator без `device` — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише для localhost.
  - успішна автентифікація operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - backend RPC `gateway-client` через прямий loopback, автентифіковані спільним
    токеном/паролем gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                            |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу поза допустимим зміщенням.     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку public key.      |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Помилка формату/канонізації public key.             |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить nonce сервера.
- Надсилайте той самий nonce в `connect.params.device.nonce`.
- Бажаним корисним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і надалі приймаються для сумісності, але pinning
  метаданих сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням фіксувати відбиток сертифіката gateway (див. config `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол надає **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Bridge protocol](/uk/gateway/bridge-protocol)
- [Робочий посібник Gateway](/uk/gateway)
