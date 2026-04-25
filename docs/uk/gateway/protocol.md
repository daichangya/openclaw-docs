---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, фрейми, керування версіями'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-25T23:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2640b0bb9e3d0291ee10d6e0b23c7f0b200db19ec90a1079dadbcc4f4bb2abf5
    source_path: gateway/protocol.md
    workflow: 15
---

Протокол Gateway WS є **єдиною площиною керування + транспортом вузлів** для
OpenClaw. Усі клієнти (CLI, веб-інтерфейс, застосунок macOS, вузли iOS/Android, безголові
вузли) підключаються через WebSocket і оголошують свою **роль** + **область доступу** під час
рукостискання.

## Транспорт

- WebSocket, текстові фрейми з JSON-навантаженням.
- Першим фреймом **має** бути запит `connect`.
- Розмір фреймів до підключення обмежений 64 KiB. Після успішного рукостискання клієнти
  мають дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  завеликі вхідні фрейми та повільні вихідні буфери породжують події `payload.large`
  до того, як Gateway закриє або відкине відповідний фрейм. Ці події зберігають
  розміри, ліміти, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, сире тіло фрейму, токени, cookie або секретні значення.

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

`server`, `features`, `snapshot` і `policy` є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє узгоджені роль/області доступу, коли вони доступні, а також включає `deviceToken`,
коли Gateway його видає.

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

Довірені бекенд-клієнти в тому ж процесі (`client.id: "gateway-client"`,
`client.mode: "backend"`) можуть не передавати `device` на прямих підключеннях loopback, коли
вони автентифікуються спільним токеном/паролем Gateway. Цей шлях зарезервований
для внутрішніх RPC площини керування і не дозволяє застарілим базовим перевіркам CLI/сполучення пристроїв
блокувати локальну бекенд-роботу, таку як оновлення сесій субагентів. Віддалені клієнти,
клієнти з походженням браузера, клієнти-вузли та клієнти з явним токеном пристрою/ідентичністю пристрою
усе ще використовують звичайні перевірки сполучення та підвищення області доступу.

Коли токен пристрою видається, `hello-ok` також включає:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Під час передачі довіреного початкового завантаження `hello-ok.auth` також може включати додаткові
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

Для вбудованого потоку початкового завантаження вузла/оператора первинний токен вузла залишається
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим списком дозволених областей
оператора для початкового завантаження (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей доступу для початкового завантаження залишаються
прив’язаними до префікса ролі: записи оператора задовольняють лише запити оператора, а неоператорські
ролі все одно потребують областей доступу під власним префіксом ролі.

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

## Форматування фреймів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами вимагають **ключів ідемпотентності** (див. схему).

## Ролі + області доступу

### Ролі

- `operator` = клієнт площини керування (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області доступу (operator)

Поширені області доступу:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` вимагає `operator.talk.secrets`
(або `operator.admin`).

RPC-методи Gateway, зареєстровані Plugin, можуть запитувати власну область доступу оператора, але
зарезервовані префікси основного адміністратора (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зводяться до `operator.admin`.

Область доступу методу — лише перша перевірка. Деякі slash-команди, до яких звертаються через
`chat.send`, додатково застосовують суворіші перевірки на рівні команд. Наприклад, постійні
записи `/config set` і `/config unset` вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку області доступу під час схвалення поверх
базової області доступу методу:

- запити без команд: `operator.pairing`
- запити з командами вузла без exec: `operator.pairing` + `operator.write`
- запити, що включають `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: категорії можливостей високого рівня.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає це як **заявлені можливості** та застосовує списки дозволів на боці сервера.

## Presence

- `system-presence` повертає записи, ключем яких є ідентичність пристрою.
- Записи присутності включають `deviceId`, `roles` і `scopes`, щоб інтерфейси могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження областей доступу для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються областями доступу, щоб сесії лише з областю сполучення або лише вузлові сесії пасивно не отримували вміст сесій.

- **Фрейми чату, агента та результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці фрейми.
- **Широкомовні повідомлення `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin`, залежно від того, як Plugin їх зареєстрував.
- **Події стану та транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл підключення/відключення тощо) залишаються без обмежень, щоб стан транспорту залишався спостережуваним для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються областями доступу (закриття за відмовою), якщо зареєстрований обробник явно не послаблює ці обмеження.

Кожне клієнтське підключення зберігає власний номер послідовності на клієнта, тому широкомовна передача зберігає монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями доступу.

## Поширені сімейства RPC-методів

Публічна поверхня WS ширша, ніж наведені вище приклади рукостискання/автентифікації. Це
не згенерований дамп — `hello-ok.features.methods` є консервативним
списком виявлення, зібраним із `src/gateway/server-methods-list.ts` плюс експортованих методів завантажених
Plugin/каналів. Розглядайте це як виявлення можливостей, а не як повний
перелік `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Система та ідентичність">
    - `health` повертає кешований або щойно перевірений знімок стану Gateway.
    - `diagnostics.stability` повертає нещодавній обмежений засіб запису діагностичної стабільності. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і ідентифікатори сесій. Він не зберігає текст чату, тіла Webhook, вивід інструментів, сирі тіла запитів або відповідей, токени, cookie чи секретні значення. Потрібна область доступу operator.read.
    - `status` повертає підсумок Gateway у стилі `/status`; чутливі поля включаються лише для операторських клієнтів з областю admin.
    - `gateway.identity.get` повертає ідентичність пристрою Gateway, що використовується потоками relay і pairing.
    - `system-presence` повертає поточний знімок присутності для підключених пристроїв operator/node.
    - `system-event` додає системну подію та може оновлювати/транслювати контекст присутності.
    - `last-heartbeat` повертає останню збережену подію Heartbeat.
    - `set-heartbeats` перемикає обробку Heartbeat на Gateway.
  </Accordion>

  <Accordion title="Моделі та використання">
    - `models.list` повертає каталог моделей, дозволених під час виконання.
    - `usage.status` повертає підсумки вікон використання постачальників/залишку квоти.
    - `usage.cost` повертає агреговані підсумки використання вартості для діапазону дат.
    - `doctor.memory.status` повертає готовність векторної пам’яті / embedding для активного робочого простору агента за замовчуванням.
    - `sessions.usage` повертає підсумки використання по сесіях.
    - `sessions.usage.timeseries` повертає часові ряди використання для однієї сесії.
    - `sessions.usage.logs` повертає записи журналу використання для однієї сесії.
  </Accordion>

  <Accordion title="Канали та допоміжні засоби входу">
    - `channels.status` повертає підсумки стану вбудованих + включених каналів/Plugin.
    - `channels.logout` виконує вихід із конкретного каналу/облікового запису там, де канал підтримує вихід.
    - `web.login.start` запускає потік входу через QR/web для поточного постачальника веб-каналу з підтримкою QR.
    - `web.login.wait` очікує завершення цього потоку входу через QR/web і в разі успіху запускає канал.
    - `push.test` надсилає тестовий push APNs до зареєстрованого вузла iOS.
    - `voicewake.get` повертає збережені тригери слів активації.
    - `voicewake.set` оновлює тригери слів активації та транслює зміну.
  </Accordion>

  <Accordion title="Повідомлення та журнали">
    - `send` — це RPC прямої вихідної доставки для надсилань із прив’язкою до каналу/облікового запису/гілки поза виконавцем чату.
    - `logs.tail` повертає налаштований tail файлового журналу Gateway з керуванням cursor/limit і максимальним числом байтів.
  </Accordion>

  <Accordion title="Talk і TTS">
    - `talk.config` повертає ефективне навантаження конфігурації Talk; `includeSecrets` вимагає `operator.talk.secrets` (або `operator.admin`).
    - `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
    - `talk.speak` синтезує мовлення через активного постачальника мовлення Talk.
    - `tts.status` повертає стан увімкнення TTS, активного постачальника, резервних постачальників і стан конфігурації постачальника.
    - `tts.providers` повертає видимий перелік постачальників TTS.
    - `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
    - `tts.setProvider` оновлює бажаного постачальника TTS.
    - `tts.convert` виконує одноразове перетворення тексту в мовлення.
  </Accordion>

  <Accordion title="Секрети, конфігурація, оновлення та wizard">
    - `secrets.reload` повторно визначає активні SecretRefs і замінює стан секретів під час виконання лише за повного успіху.
    - `secrets.resolve` визначає призначення секретів для цільових команд для конкретного набору command/target.
    - `config.get` повертає поточний знімок конфігурації та хеш.
    - `config.set` записує перевірене навантаження конфігурації.
    - `config.patch` об’єднує часткове оновлення конфігурації.
    - `config.apply` перевіряє + замінює повне навантаження конфігурації.
    - `config.schema` повертає навантаження актуальної схеми конфігурації, яке використовують Control UI та інструменти CLI: схема, `uiHints`, версія та метадані генерування, включно з метаданими схем Plugin + каналів, коли середовище виконання може їх завантажити. Схема включає метадані полів `title` / `description`, похідні від тих самих міток і тексту довідки, які використовує UI, включно з вкладеними об’єктами, wildcard, елементами масивів і гілками композицій `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
    - `config.schema.lookup` повертає навантаження пошуку в межах шляху для одного шляху конфігурації: нормалізований шлях, неглибокий вузол схеми, відповідний hint + `hintPath` і підсумки безпосередніх дочірніх елементів для покрокового перегляду в UI/CLI. Вузли схеми пошуку зберігають документацію, орієнтовану на користувача, і загальні поля перевірки (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, числові/рядкові/масивні/об’єктні межі та прапорці на кшталт `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Підсумки дочірніх елементів розкривають `key`, нормалізований `path`, `type`, `required`, `hasChildren`, а також відповідний `hint` / `hintPath`.
    - `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді, коли саме оновлення завершилося успішно.
    - `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають onboarding wizard через WS RPC.
  </Accordion>

  <Accordion title="Допоміжні засоби агента та робочого простору">
    - `agents.list` повертає налаштовані записи агентів.
    - `agents.create`, `agents.update` і `agents.delete` керують записами агентів і підключенням робочого простору.
    - `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами bootstrap-робочого простору, відкритими для агента.
    - `agent.identity.get` повертає ефективну ідентичність помічника для агента або сесії.
    - `agent.wait` очікує завершення запуску й повертає термінальний знімок, якщо він доступний.
  </Accordion>

  <Accordion title="Керування сесіями">
    - `sessions.list` повертає поточний індекс сесій.
    - `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події зміни сесій для поточного WS-клієнта.
    - `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають підписки на події transcript/message для однієї сесії.
    - `sessions.preview` повертає обмежені попередні перегляди transcript для вказаних ключів сесій.
    - `sessions.resolve` визначає або канонізує ціль сесії.
    - `sessions.create` створює новий запис сесії.
    - `sessions.send` надсилає повідомлення в наявну сесію.
    - `sessions.steer` — це варіант переривання й спрямування для активної сесії.
    - `sessions.abort` перериває активну роботу для сесії.
    - `sessions.patch` оновлює метадані/перевизначення сесії.
    - `sessions.reset`, `sessions.delete` і `sessions.compact` виконують обслуговування сесії.
    - `sessions.get` повертає повний збережений рядок сесії.
    - Виконання чату й надалі використовує `chat.history`, `chat.send`, `chat.abort` і `chat.inject`. `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив прибираються з видимого тексту, XML-навантаження викликів інструментів у простому тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів) та leaked ASCII/full-width токени керування моделі прибираються, чисті рядки помічника з silent-token, такі як точні `NO_REPLY` / `no_reply`, пропускаються, а завеликі рядки можуть бути замінені заповнювачами.
  </Accordion>

  <Accordion title="Сполучення пристроїв і токени пристроїв">
    - `device.pair.list` повертає пристрої, які очікують схвалення, і вже схвалені сполучені пристрої.
    - `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують записами сполучення пристроїв.
    - `device.token.rotate` обертає токен сполученого пристрою в межах затверджених для нього ролі та областей доступу.
    - `device.token.revoke` відкликає токен сполученого пристрою.
  </Accordion>

  <Accordion title="Сполучення вузлів, invoke і відкладена робота">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` і `node.pair.verify` охоплюють сполучення вузлів і перевірку bootstrap.
    - `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
    - `node.rename` оновлює мітку сполученого вузла.
    - `node.invoke` пересилає команду підключеному вузлу.
    - `node.invoke.result` повертає результат для запиту invoke.
    - `node.event` переносить події, що походять від вузла, назад у Gateway.
    - `node.canvas.capability.refresh` оновлює токени можливостей canvas з обмеженою областю дії.
    - `node.pending.pull` і `node.pending.ack` — це API черги для підключених вузлів.
    - `node.pending.enqueue` і `node.pending.drain` керують довговічною відкладеною роботою для офлайн/відключених вузлів.
  </Accordion>

  <Accordion title="Сімейства схвалення">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і `exec.approval.resolve` охоплюють одноразові запити на схвалення exec, а також пошук/повторне відтворення відкладених схвалень.
    - `exec.approval.waitDecision` очікує на одне відкладене схвалення exec і повертає остаточне рішення (або `null` у разі тайм-ауту).
    - `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec у Gateway.
    - `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою схвалення exec через relay-команди вузла.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки схвалення, визначені Plugin.
  </Accordion>

  <Accordion title="Автоматизація, Skills та інструменти">
    - Автоматизація: `wake` планує негайну або наступного Heartbeat ін’єкцію тексту пробудження; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` керують запланованою роботою.
    - Skills та інструменти: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Поширені сімейства подій

- `chat`: оновлення UI чату, такі як `chat.inject` та інші події чату,
  що стосуються лише transcript.
- `session.message` і `session.tool`: оновлення transcript/потоку подій для
  сесії, на яку оформлено підписку.
- `sessions.changed`: змінився індекс сесій або метадані.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / перевірки активності.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл сполучення вузла.
- `node.invoke.request`: широкомовний запит invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл сполученого пристрою.
- `voicewake.changed`: змінено конфігурацію тригерів слова активації.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення Plugin.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список
  виконуваних файлів Skills для перевірок auto-allow.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати під час виконання
  перелік команд для агента.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлено основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях `both` за замовчуванням повертають обізнані про провайдера native-імена,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить обізнану про провайдера native-назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність
    native-команд Plugin.
  - `includeArgs=false` не включає серіалізовані метадані аргументів у відповідь.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів під час виконання для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник Plugin, коли `source="plugin"`
  - `optional`: чи є інструмент Plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний перелік інструментів під час виконання
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст виконання із сесії на боці сервера замість приймання
    auth або контексту доставки, наданих викликачем.
  - Відповідь має область дії сесії та відображає те, що активна розмова може використовувати прямо зараз,
    включно з інструментами core, Plugin і каналів.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  перелік Skills для агента.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь включає придатність, відсутні вимоги, перевірки конфігурації та
    очищені параметри встановлення без розкриття сирих секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config патчить значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Операторські клієнти виконують підтвердження викликом `exec.approval.resolve` (потрібна область доступу `operator.approvals`).
- Для `host=node` запит `exec.approval.request` має включати `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним пересиланням схваленого `system.run`,
  Gateway відхиляє запуск замість того, щоб довіряти зміненому навантаженню.

## Резервна доставка агента

- Запити `agent` можуть включати `deliver=true`, щоб запитати вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, коли жоден зовнішній маршрут доставки не може бути визначений (наприклад, для внутрішніх/webchat-сесій або неоднозначних конфігурацій із кількома каналами).

## Керування версіями

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Вони
стабільні в межах протоколу v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                            | Джерело                                                    |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                   | `30_000` мс                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge       | `10_000` мс                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff для повторного підключення | `1_000` мс                                         | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff для повторного підключення | `30_000` мс                                      | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` мс                                           | `src/gateway/client.ts`                                    |
| Пауза примусової зупинки перед `terminate()` | `250` мс                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням  | `1_000` мс                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` мс                                      | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick               | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Сервер оголошує фактичні значення `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти мають дотримуватися саме цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація Gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або `gateway.auth.mode: "trusted-proxy"`
  поза loopback, задовольняють перевірку автентифікації connect через
  заголовки запиту, а не через `connect.params.auth.*`.
- Режим приватного ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect
  зі спільним секретом; не відкривайте цей режим на публічному/ненадійному ingress.
- Після сполучення Gateway видає **токен пристрою** з областю дії, обмеженою роллю + областями доступу
  цього підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  затверджений набір областей доступу для цього токена. Це зберігає вже наданий доступ
  до читання/перевірки/стану та не дозволяє повторним підключенням непомітно звузитися до
  вужчої неявної області лише для admin.
- Складання автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічують.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними кінцевими точками** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-автентифікацію на довіреному транспорті,
  наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір областей доступу, запитаний викликачем, залишається авторитетним; кешовані області доступу
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен конкретного пристрою.
- Токени пристроїв можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область доступу `operator.pairing`).
- Видача/обертання токенів залишається обмеженою затвердженим набором ролей, записаним у
  записі сполучення цього пристрою; обертання токена не може розширити пристрій до
  ролі, яку ніколи не було надано схваленням сполучення.
- Для сесій токенів сполучених пристроїв керування пристроями має власну область дії, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/обертати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір областей доступу оператора щодо
  поточних областей доступу сесії викликача. Викликачі без admin не можуть обертати токен у
  ширший набір областей доступу оператора, ніж вони вже мають.
- Збої автентифікації включають `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном конкретного пристрою.
  - Якщо ця повторна спроба не вдасться, клієнти мають припинити цикли автоматичного повторного підключення та показати оператору вказівки щодо подальших дій.

## Ідентичність пристрою + сполучення

- Вузли мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка ключової пари.
- Gateway видає токени на рівні пристрою + ролі.
- Для нових ідентифікаторів пристроїв потрібне схвалення сполучення, якщо не ввімкнено локальне
  автосхвалення.
- Автосхвалення сполучення зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях self-connect backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN з того ж хоста все одно вважаються віддаленими для сполучення і
  потребують схвалення.
- WS-клієнти зазвичай включають ідентичність `device` під час `connect` (operator +
  node). Єдині винятки для operator без пристрою — це явні довірені шляхи:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише для localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
  - прямі loopback RPC бекенда `gateway-client`, автентифіковані спільним
    токеном/паролем Gateway.
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                  | details.code                     | details.reason           | Значення                                           |
| ---------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Навантаження підпису не відповідає навантаженню v2. |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося обробити формат/канонізацію публічного ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте навантаження v2, яке включає серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning метаданих
  сполученого пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точну поверхню визначають
схеми TypeBox у `src/gateway/protocol/schema.ts`.

## Пов’язане

- [Протокол Bridge](/uk/gateway/bridge-protocol)
- [Runbook Gateway](/uk/gateway)
