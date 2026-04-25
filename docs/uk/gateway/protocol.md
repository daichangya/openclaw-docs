---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, фрейми, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-25T22:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2411ebd50a883028e2d8e88a4a79e4c1350cefd37a12f293de9686e3bc067ea
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS — це **єдина control plane + Node transport** для
OpenClaw. Усі клієнти (CLI, web UI, macOS app, iOS/Android Node, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **обсяг**
під час рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженням.
- Першим фреймом **має** бути запит `connect`.
- Розмір фреймів до підключення обмежений 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Якщо діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери генерують події `payload.large`
  до того, як gateway закриє підключення або відкине відповідний фрейм. Ці події зберігають
  розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, тіло сирого фрейму, токени, cookie або секретні значення.

## Рукостискання (connect)

Gateway → Client (виклик до підключення):

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

`server`, `features`, `snapshot` і `policy` є обов’язковими згідно зі схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє узгоджені role/scopes, коли вони доступні, і містить `deviceToken`,
якщо gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти
узгоджені дозволи:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Довірені backend-клієнти в тому самому процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` у прямих local loopback-підключеннях, якщо
вони автентифікуються за допомогою спільного gateway token/password. Цей шлях зарезервований
для внутрішніх RPC control plane і не дозволяє застарілим базовим станам CLI/спарювання пристроїв
блокувати локальну backend-роботу, наприклад оновлення сеансів subagent. Віддалені клієнти,
клієнти з browser-origin, клієнти Node, а також клієнти з явним токеном пристрою/ідентичністю пристрою
усе ще використовують звичайні перевірки спарювання та підвищення scope.

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

Під час передавання trusted bootstrap `hello-ok.auth` також може містити додаткові
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

Для вбудованого bootstrap-потоку Node/operator основний токен Node залишається
`scopes: []`, а будь-який переданий токен operator залишається обмеженим списком дозволених bootstrap-дій operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки scope bootstrap і далі мають префікс role: записи operator задовольняють лише запити operator, а ролі, що не є operator,
усе ще потребують scope під префіксом власної role.

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

## Фреймування

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **ключів ідемпотентності** (див. схему).

## Ролі + scopes

### Ролі

- `operator` = клієнт control plane (CLI/UI/automation).
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

Методи Gateway RPC, зареєстровані Plugin, можуть вимагати власний scope operator, але
зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope методу — це лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, додатково застосовують суворіші перевірки на рівні команд. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення поверх
базового scope методу:

- запити без команд: `operator.pairing`
- запити з командами Node, що не належать до exec: `operator.pairing` + `operator.write`
- запити, які містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає це як **заявлені можливості** і застосовує серверні allowlist.

## Presence

- `system-presence` повертає записи, прив’язані до ідентичності пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок для пристрою,
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження області видимості broadcast-подій

Події broadcast WebSocket, які надсилає сервер, обмежуються scopes, щоб сеанси лише з pairing-scope або лише Node не отримували пасивно вміст сеансів.

- **Фрейми чату, agent і результатів інструментів** (зокрема потокові події `agent` і результати викликів інструментів) вимагають щонайменше `operator.read`. Сеанси без `operator.read` повністю пропускають ці фрейми.
- **Broadcast-події `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події статусу й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються без обмежень, щоб стан транспорту залишався видимим для кожного автентифікованого сеансу.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються scopes (fail-closed), якщо лише зареєстрований обробник не послаблює це явно.

Кожне клієнтське підключення веде власний номер послідовності для цього клієнта, тому broadcast-записи зберігають монотонний порядок у цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за scopes.

## Поширені сімейства методів RPC

Публічна поверхня WS ширша за наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, побудованим із `src/gateway/server-methods-list.ts` плюс завантажені
експорти методів Plugin/channel. Розглядайте це як виявлення можливостей, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану gateway.
    - `diagnostics.stability` повертає нещодавній обмежений реєстратор стабільності діагностики. Він зберігає операційні метадані, такі як назви подій, кількість, розміри байтів, показники пам’яті, стан черги/сеансу, назви channel/Plugin та ідентифікатори сеансів. Він не зберігає текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібен scope operator read.
    - `status` повертає зведення gateway у стилі `/status`; чутливі поля включаються лише для operator-клієнтів з admin-scope.
    - `gateway.identity.get` повертає ідентичність пристрою gateway, яка використовується в relay і потоках pairing.
    - `system-presence` повертає поточний знімок presence для підключених пристроїв operator/Node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст presence.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання.
    - `usage.status` повертає вікна використання provider/зведення залишкових квот.
    - `usage.cost` повертає агреговані зведення використання вартості для діапазону дат.
    - `doctor.memory.status` повертає готовність vector-memory / embedding для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає зведення використання для кожного сеансу.
    - `sessions.usage.timeseries` повертає часові ряди використання для одного сеансу.
    - `sessions.usage.logs` повертає записи журналу використання для одного сеансу.
  </Accordion>

  <Accordion title="Channels і допоміжні засоби входу">
    - `channels.status` повертає зведення стану вбудованих і bundled channel/Plugin.
    - `channels.logout` виконує вихід із конкретного channel/account, якщо channel підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного provider web-channel, що підтримує QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і запускає channel в разі успіху.
    - `push.test` надсилає тестовий APNs push зареєстрованому iOS Node.
    - `voicewake.get` повертає збережені тригери wake-word.
    - `voicewake.set` оновлює тригери wake-word і транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це прямий RPC вихідної доставки для надсилань, адресованих channel/account/thread, поза виконавцем чату.
    - `logs.tail` повертає tail налаштованого файлового журналу gateway з елементами керування cursor/limit і max-byte.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets` потребує `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активний speech provider Talk.
    - `tts.status` повертає стан увімкнення TTS, активний provider, резервні providers і стан конфігурації provider.
    - `tts.providers` повертає видимий інвентар providers TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаний provider TTS.
    - `tts.convert` виконує одноразове перетворення text-to-speech.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` розв’язує призначення секретів для цільової команди для конкретного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує валідоване корисне навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` валідовує й замінює повне корисне навантаження конфігурації.
    - `config.schema` повертає корисне навантаження схеми активної конфігурації, яке використовується Control UI та інструментами CLI: schema, `uiHints`, версію та метадані генерації, зокрема метадані схем Plugin і channel, коли середовище виконання може їх завантажити. Схема містить метадані полів `title` / `description`, похідні від тих самих міток і довідкового тексту, що використовуються в UI, зокрема для вкладених object, wildcard, array-item і гілок композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає корисне навантаження пошуку, обмежене шляхом, для одного шляху конфігурації: нормалізований шлях, вузол поверхневої схеми, відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів для деталізації в UI/CLI. Вузли схеми пошуку зберігають орієнтовану на користувача документацію та поширені поля валідації (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапори на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідні `hint` / `hintPath`.
    - `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді, коли саме оновлення було успішним.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають доступ до wizard онбордингу через WS RPC.
  </Accordion>

  <Accordion title="Допоміжні засоби agent і робочого простору">
    - `agents.list` повертає налаштовані записи agent.
    - `agents.create`, `agents.update` і `agents.delete` керують записами agent та прив’язкою робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, доступними для agent.
    - `agent.identity.get` повертає ефективну ідентичність асистента для agent або сеансу.
    - `agent.wait` очікує завершення запуску та повертає термінальний знімок, коли він доступний.
  </Accordion>

  <Accordion title="Керування сеансами">
    - `sessions.list` повертає поточний індекс сеансів.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сеансів для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/message для одного сеансу.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для конкретних ключів сеансу.
    - `sessions.resolve` розв’язує або канонізує ціль сеансу.
    - `sessions.create` створює новий запис сеансу.
    - `sessions.send` надсилає повідомлення в наявний сеанс.
    - `sessions.steer` — це варіант переривання та коригування для активного сеансу.
    - `sessions.abort` перериває активну роботу для сеансу.
    - `sessions.patch` оновлює метадані/перевизначення сеансу.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сеансу.
    - `sessions.get` повертає повний збережений рядок сеансу.
    - Для виконання чату й далі використовуються `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив видаляються з видимого тексту, простотекстові XML-корисні навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) і витеклі ASCII/full-width control tokens моделі видаляються, суто рядки асистента з silent-token, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Спарювання пристроїв і токени пристроїв">
    - `device.pair.list` повертає очікувані та схвалені спарені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами спарювання пристроїв.
    - `device.token.rotate` обертає токен спареного пристрою в межах його схвалених role і scope.
    - `device.token.revoke` відкликає токен спареного пристрою.
  </Accordion>

  <Accordion title="Спарювання Node, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють спарювання Node та перевірку bootstrap.
    - `node.list` і `node.describe` повертають стан відомих/підключених Node.
    - `node.rename` оновлює мітку спареного Node.
    - `node.invoke` пересилає команду підключеному Node.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, породжені Node, назад у gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas, обмежені scope.
    - `node.pending.pull` і `node.pending.ack` — це API черги підключеного Node.
    - `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою для offline/disconnected Node.
  </Accordion>

  <Accordion title="Сімейства схвалень">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/повторення відкладених схвалень.
    - `exec.approval.waitDecision` очікує рішення щодо одного відкладеного схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою схвалення exec на Node через relay-команди Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або наступного Heartbeat ін’єкцію тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення чату UI, такі як `chat.inject` та інші події чату,
  що стосуються лише transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для
  сеансу з підпискою.
- `sessions.changed`: індекс сеансів або метадані змінилися.
- `presence`: оновлення знімка системної presence.
- `tick`: періодична подія keepalive / перевірки доступності.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл спарювання Node.
- `node.invoke.request`: broadcast-запит invoke для Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригера wake-word змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення Plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи operator

- Operator можуть викликати `commands.list` (`operator.read`), щоб отримати під час виконання
  інвентар команд для agent.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір agent за замовчуванням.
  - `scope` керує тим, яку поверхню націлює основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають обізнані про provider власні назви
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить обізнану про provider власну назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на власні назви та доступність
    власних команд Plugin.
  - `includeArgs=false` не включає серіалізовані метадані аргументів до відповіді.
- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати під час виконання каталог інструментів для
  agent. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати ефективний під час виконання
  інвентар інструментів для сеансу.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст виконання із сеансу на сервері замість приймання
    auth або контексту доставки, наданих викликачем.
  - Відповідь обмежена сеансом і відображає те, що активна розмова може використовувати просто зараз,
    зокрема інструменти core, Plugin і channel.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для agent.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір agent за замовчуванням.
  - Відповідь містить придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття сирих секретних значень.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill до каталогу `skills/` робочого простору agent за замовчуванням.
  - Режим інсталятора gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі agent за замовчуванням.
  - Режим Config вносить зміни до значень `skills.entries.<skillKey>`, таких як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують підтвердження, викликаючи `exec.approval.resolve` (потребує scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сеансу). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і остаточним схваленим пересиланням `system.run`,
  gateway відхиляє запуск замість того, щоб довіряти зміненому корисному навантаженню.

## Резервний варіант доставки agent

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає строгу поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в межах сеансу, коли неможливо розв’язати жоден зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сеансів або неоднозначних багатоканальних конфігурацій).

## Версіонування

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Вони
стабільні в межах protocol v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                             | Джерело                                                    |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (для кожного RPC)          | `30_000` мс                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge       | `10_000` мс                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення  | `1_000` мс                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` мс                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` мс                                            | `src/gateway/client.ts`                                    |
| Пільговий період force-stop перед `terminate()` | `250` мс                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням  | `1_000` мс                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` мс                                       | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick               | код `4000`, коли тиша перевищує `tickIntervalMs * 2`  | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з урахуванням ідентичності, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або `gateway.auth.mode: "trusted-proxy"` не для loopback,
  задовольняють перевірку автентифікації connect із заголовків запиту, а не з
  `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для private-ingress повністю пропускає автентифікацію connect
  зі спільним секретом; не відкривайте цей режим на публічному/ненадійному ingress.
- Після спарювання Gateway видає **токен пристрою**, обмежений роллю + scopes
  підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  схвалений набір scope для цього токена. Це зберігає вже наданий доступ
  до читання/перевірки/статусу й допомагає уникнути тихого звуження повторних підключень до
  вужчого неявного scope лише для admin.
- Формування автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є незалежним і завжди пересилається, якщо встановлений.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається, лише якщо жоден із наведених вище варіантів не дав
    `auth.token`. Спільний токен або будь-який розв’язаний токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразового
    повтору `AUTH_TOKEN_MISMATCH` обмежується **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір scope, запитаний викликачем, залишається авторитетним; кешовані scopes повторно використовуються лише
  тоді, коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача/обертання токенів залишається обмеженою схваленим набором ролей, записаним у
  записі спарювання цього пристрою; обертання токена не може розширити пристрій до
  ролі, яку схвалення pairing ніколи не надавало.
- Для сеансів із токеном спареного пристрою керування пристроями обмежується самим пристроєм, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/обертати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір scope operator щодо
  поточних scope сеансу викликача. Викликачі без admin не можуть обертати токен у
  ширший набір scope operator, ніж той, який вони вже мають.
- Помилки автентифікації містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити цикли автоматичного повторного підключення й показати вказівки для дій operator.

## Ідентичність пристрою + спарювання

- Node мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видають токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні схвалення pairing, якщо не ввімкнено локальне авто-схвалення.
- Авто-схвалення pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених допоміжних потоків зі спільним секретом.
- Підключення з того самого хоста через tailnet або LAN усе ще вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + Node).
  Control UI може не вказувати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний варіант, серйозне зниження безпеки).
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не вказав `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана часова мітка виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку відкритого ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат/канонізація відкритого ключа не пройшли.    |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning метаданих
  спареного пристрою все ще керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріплювати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Обсяг

Цей протокол надає **повний API gateway** (status, channels, models, chat,
agent, sessions, Nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
