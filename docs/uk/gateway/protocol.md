---
read_when:
    - Реалізація або оновлення клієнтів шлюзу WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-23T00:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол Gateway WS — це **єдина контрольна площина + транспорт Node** для
OpenClaw. Усі клієнти (CLI, веб-інтерфейс, застосунок macOS, Node iOS/Android, headless
Node) підключаються через WebSocket і оголошують свою **роль** + **область видимості** під час рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON-корисним навантаженням.
- Перший кадр **має** бути запитом `connect`.
- Кадри до підключення обмежені 64 KiB. Після успішного рукостискання клієнти
  повинні дотримуватися обмежень `hello-ok.policy.maxPayload` і
  `hello-ok.policy.maxBufferedBytes`. Коли діагностику ввімкнено,
  надто великі вхідні кадри й повільні вихідні буфери генерують події `payload.large`
  до того, як Gateway закриє з’єднання або відкине відповідний кадр. Ці події зберігають
  розміри, обмеження, поверхні та безпечні коди причин. Вони не зберігають тіло повідомлення,
  вміст вкладень, тіло необробленого кадру, токени, cookie або секретні значення.

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

`server`, `features`, `snapshot` і `policy` — усі обов’язкові за схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про узгоджені роль/області видимості, коли вони доступні, і містить `deviceToken`,
коли Gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` усе одно може повідомляти про узгоджені
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
`scopes: []`, а будь-який переданий токен operator лишається обмеженим списком дозволів
bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей видимості bootstrap лишаються
прив’язаними до префікса ролі: записи operator задовольняють лише запити operator, а ролі, що не є operator,
усе одно потребують областей видимості під власним префіксом ролі.

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

## Кадрування

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами вимагають **ключі ідемпотентності** (див. схему).

## Ролі + області видимості

### Ролі

- `operator` = клієнт контрольної площини (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області видимості (operator)

Поширені області видимості:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` з `includeSecrets: true` вимагає `operator.talk.secrets`
(або `operator.admin`).

Методи Gateway RPC, зареєстровані Plugin, можуть запитувати власну область видимості operator, але
зарезервовані базові префікси адміністратора (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область видимості методу — лише перший бар’єр. Деякі slash-команди, доступні через
`chat.send`, додатково застосовують суворіші перевірки на рівні команд. Наприклад, сталі
записи `/config set` і `/config unset` вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку області видимості під час схвалення поверх
базової області видимості методу:

- запити без команди: `operator.pairing`
- запити з командами node, що не належать до exec: `operator.pairing` + `operator.write`
- запити, які містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують твердження про можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway трактує це як **заявлені можливості** та забезпечує примусові списки дозволів на боці сервера.

## Presence

- `system-presence` повертає записи, згруповані за ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI міг показувати один рядок на пристрій,
  навіть коли він підключений і як **operator**, і як **node**.

## Обмеження областей видимості для broadcast-подій

Broadcast-події WebSocket, які сервер надсилає клієнтам, обмежуються областями видимості, щоб сесії лише з pairing-областю або сесії тільки для node не отримували пасивно вміст сесій.

- **Кадри chat, agent і tool-result** (включно з потоковими подіями `agent` і результатами викликів інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Broadcast-події `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану й транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) лишаються без обмежень, щоб стан транспорту залишався спостережуваним для кожної автентифікованої сесії.
- **Невідомі сімейства broadcast-подій** за замовчуванням обмежуються областями видимості (fail-closed), якщо зареєстрований обробник явно не послаблює це правило.

Кожне клієнтське з’єднання підтримує власний номер послідовності для конкретного клієнта, тому broadcast-події зберігають монотонне впорядкування на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями видимості.

## Поширені сімейства RPC-методів

Ця сторінка не є згенерованим повним дампом, але публічна поверхня WS ширша,
ніж наведені вище приклади рукостискання/автентифікації. Це основні сімейства методів, які
Gateway відкриває сьогодні.

`hello-ok.features.methods` — це консервативний список виявлення можливостей, побудований із
`src/gateway/server-methods-list.ts` плюс експорту методів завантажених plugin/channel.
Сприймайте його як виявлення можливостей, а не як згенерований дамп усіх допоміжних викликів,
реалізованих у `src/gateway/server-methods/*.ts`.

### Система та ідентичність

- `health` повертає кешований або щойно перевірений знімок стану Gateway.
- `diagnostics.stability` повертає нещодавній обмежений засіб запису діагностичної
  стабільності. Він зберігає операційні метадані, такі як назви подій, кількість, розміри в байтах,
  показники пам’яті, стан черги/сесії, назви channel/plugin і ідентифікатори сесій.
  Він не зберігає текст chat, тіла webhook, вивід інструментів, необроблені тіла запитів або
  відповідей, токени, cookie чи секретні значення. Потрібна область видимості operator read.
- `status` повертає підсумок Gateway у стилі `/status`; чутливі поля
  включаються лише для клієнтів operator з областю видимості admin.
- `gateway.identity.get` повертає ідентичність пристрою Gateway, що використовується в потоках relay і
  pairing.
- `system-presence` повертає поточний знімок presence для підключених
  пристроїв operator/node.
- `system-event` додає системну подію та може оновлювати/транслювати контекст
  presence.
- `last-heartbeat` повертає останню збережену подію Heartbeat.
- `set-heartbeats` перемикає обробку Heartbeat на Gateway.

### Моделі та використання

- `models.list` повертає каталог моделей, дозволених у поточному середовищі виконання.
- `usage.status` повертає зведення вікон використання/залишкових квот провайдера.
- `usage.cost` повертає зведення агрегованих витрат використання за діапазон дат.
- `doctor.memory.status` повертає готовність векторної пам’яті / вбудовувань для
  активного робочого простору агента за замовчуванням.
- `sessions.usage` повертає зведення використання за сесіями.
- `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
- `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

### Канали та допоміжні засоби входу

- `channels.status` повертає зведення стану вбудованих і bundled channel/plugin.
- `channels.logout` виходить із конкретного channel/account, якщо channel
  підтримує вихід.
- `web.login.start` запускає потік входу QR/web для поточного web
  channel provider із підтримкою QR.
- `web.login.wait` очікує завершення цього потоку входу QR/web і запускає
  channel у разі успіху.
- `push.test` надсилає тестовий APNs push на зареєстрований Node iOS.
- `voicewake.get` повертає збережені тригери слова активації.
- `voicewake.set` оновлює тригери слова активації та транслює зміну.

### Повідомлення та журнали

- `send` — це прямий RPC доставки назовні для
  надсилання до channel/account/thread поза виконавцем chat.
- `logs.tail` повертає хвіст налаштованого файлового журналу Gateway з керуванням курсором/лімітом і
  максимальним розміром у байтах.

### Talk і TTS

- `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets`
  вимагає `operator.talk.secrets` (або `operator.admin`).
- `talk.mode` установлює/транслює поточний стан режиму Talk для
  клієнтів WebChat/Control UI.
- `talk.speak` синтезує мовлення через активного мовленнєвого провайдера Talk.
- `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів
  і стан конфігурації провайдера.
- `tts.providers` повертає видимий перелік провайдерів TTS.
- `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
- `tts.setProvider` оновлює бажаного провайдера TTS.
- `tts.convert` виконує одноразове перетворення тексту на мовлення.

### Секрети, конфігурація, оновлення та майстер налаштування

- `secrets.reload` повторно розв’язує активні SecretRefs і замінює стан секретів у середовищі виконання
  лише за повного успіху.
- `secrets.resolve` розв’язує призначення секретів для цільових команд для конкретного
  набору command/target.
- `config.get` повертає поточний знімок конфігурації та хеш.
- `config.set` записує перевірене корисне навантаження конфігурації.
- `config.patch` об’єднує часткове оновлення конфігурації.
- `config.apply` перевіряє + замінює повне корисне навантаження конфігурації.
- `config.schema` повертає корисне навантаження поточної схеми конфігурації, яке використовують Control UI і
  інструменти CLI: схема, `uiHints`, версія та метадані генерації, зокрема
  метадані схеми plugin + channel, коли середовище виконання може їх завантажити. Схема
  містить метадані полів `title` / `description`, похідні від тих самих міток
  і тексту довідки, які використовує UI, зокрема для вкладених об’єктів, wildcard,
  елементів масиву та гілок композиції `anyOf` / `oneOf` / `allOf`, коли існує
  відповідна документація для полів.
- `config.schema.lookup` повертає корисне навантаження пошуку з обмеженням шляхом для одного шляху конфігурації:
  нормалізований шлях, неглибокий вузол схеми, зіставлену підказку + `hintPath` і
  зведення безпосередніх дочірніх елементів для деталізації в UI/CLI.
  - Вузли схеми пошуку зберігають орієнтовану на користувача документацію та типові поля перевірки:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    числові/рядкові/масивні/об’єктні межі та булеві прапорці, такі як
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`,
    `hasChildren`, а також зіставлені `hint` / `hintPath`.
- `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді,
  коли саме оновлення було успішним.
- `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають
  майстер налаштування onboarding через WS RPC.

### Наявні основні сімейства

#### Допоміжні засоби агента та робочого простору

- `agents.list` повертає налаштовані записи агентів.
- `agents.create`, `agents.update` і `agents.delete` керують записами агентів і
  прив’язкою робочого простору.
- `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами
  bootstrap робочого простору, відкритими для агента.
- `agent.identity.get` повертає фактичну ідентичність помічника для агента або
  сесії.
- `agent.wait` очікує завершення запуску й повертає термінальний знімок, коли
  він доступний.

#### Керування сесіями

- `sessions.list` повертає поточний індекс сесій.
- `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події
  змін сесії для поточного WS-клієнта.
- `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають
  підписки на події транскрипту/повідомлень для однієї сесії.
- `sessions.preview` повертає обмежені попередні перегляди транскрипту для конкретних
  ключів сесій.
- `sessions.resolve` розв’язує або канонізує ціль сесії.
- `sessions.create` створює новий запис сесії.
- `sessions.send` надсилає повідомлення в наявну сесію.
- `sessions.steer` — це варіант переривання й спрямування для активної сесії.
- `sessions.abort` перериває активну роботу для сесії.
- `sessions.patch` оновлює метадані/перевизначення сесії.
- `sessions.reset`, `sessions.delete` і `sessions.compact` виконують
  обслуговування сесії.
- `sessions.get` повертає повний збережений рядок сесії.
- виконання chat, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і
  `chat.inject`.
- `chat.history` нормалізується для відображення клієнтам UI: вбудовані теги директив
  прибираються з видимого тексту, XML-корисні навантаження викликів інструментів у звичайному тексті (зокрема
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізані блоки викликів інструментів), а також витеклі ASCII/повноширинні керівні токени моделі
  прибираються, рядки помічника, що складаються лише з беззвучних токенів, такі як точні `NO_REPLY` /
  `no_reply`, опускаються, а надто великі рядки можуть замінюватися заповнювачами.

#### Pairing пристроїв і токени пристроїв

- `device.pair.list` повертає очікувальні та схвалені спарені пристрої.
- `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують
  записами pairing пристроїв.
- `device.token.rotate` обертає токен спареного пристрою в межах його схвалених
  ролі та областей видимості.
- `device.token.revoke` відкликає токен спареного пристрою.

#### Pairing Node, invoke і очікувальна робота

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` і `node.pair.verify` охоплюють pairing Node і bootstrap
  verification.
- `node.list` і `node.describe` повертають стан відомих/підключених Node.
- `node.rename` оновлює мітку спареного Node.
- `node.invoke` пересилає команду підключеному Node.
- `node.invoke.result` повертає результат для запиту invoke.
- `node.event` передає події, що походять від Node, назад у Gateway.
- `node.canvas.capability.refresh` оновлює токени можливостей canvas з обмеженою областю дії.
- `node.pending.pull` і `node.pending.ack` — це API черги для підключених Node.
- `node.pending.enqueue` і `node.pending.drain` керують стійкою очікувальною роботою
  для офлайн/відключених Node.

#### Сімейства схвалень

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і
  `exec.approval.resolve` охоплюють одноразові запити на схвалення exec плюс
  пошук/повторення очікувальних схвалень.
- `exec.approval.waitDecision` очікує рішення щодо одного очікувального схвалення exec і повертає
  фінальне рішення (або `null` у разі тайм-ауту).
- `exec.approvals.get` і `exec.approvals.set` керують знімками політики схвалення exec
  Gateway.
- `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для Node політикою exec
  approval через команди relay Node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють
  потоки схвалення, визначені Plugin.

#### Інші основні сімейства

- automation:
  - `wake` планує негайне або на наступний Heartbeat введення тексту пробудження
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Поширені сімейства подій

- `chat`: оновлення UI chat, такі як `chat.inject` та інші події chat,
  пов’язані лише з транскриптом.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  сесії, на яку оформлено підписку.
- `sessions.changed`: індекс сесій або метадані змінено.
- `presence`: оновлення знімка системного presence.
- `tick`: періодична подія keepalive / перевірки доступності.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про завершення роботи Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing Node.
- `node.invoke.request`: broadcast запиту invoke для Node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: змінено конфігурацію тригера слова активації.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  схвалення exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  схвалення plugin.

### Допоміжні методи Node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок автоматичного дозволу.

### Допоміжні методи operator

- Operator можуть викликати `commands.list` (`operator.read`), щоб отримати перелік команд середовища виконання для агента.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, на яку поверхню націлений основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають орієнтовані на провайдера native-імена,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить орієнтовану на провайдера native-назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність native-команд plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів середовища виконання для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний перелік інструментів середовища виконання
  для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст середовища виконання із сесії на боці сервера, замість того щоб приймати
    наданий викликачем контекст автентифікації або доставки.
  - Відповідь має область дії сесії та відображає те, що активна розмова може використовувати просто зараз,
    зокрема core, plugin і channel tools.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  перелік skills для агента.
  - `agentId` необов’язковий; не вказуйте його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття необроблених секретних значень.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` установлює
    папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості Gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config вносить зміни до значень `skills.entries.<skillKey>`, таких як `enabled`,
    `apiKey` і `env`.

## Схвалення exec

- Коли запит exec потребує схвалення, Gateway транслює `exec.approval.requested`.
- Клієнти operator виконують підтвердження, викликаючи `exec.approval.resolve` (потрібна область видимості `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і остаточним пересиланням схваленого `system.run`,
  Gateway відхиляє запуск замість того, щоб довіряти зміненому корисному навантаженню.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервне виконання лише в межах сесії, коли неможливо розв’язати зовнішній маршрут доставки (наприклад, для внутрішніх/webchat сесій або неоднозначних багатоканальних конфігурацій).

## Версіонування

- `PROTOCOL_VERSION` розташовано в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Вони
стабільні впродовж protocol v3 і є очікуваною базою для сторонніх клієнтів.

| Константа                                  | Значення за замовчуванням                             | Джерело                                                    |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на RPC)                   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення| `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp після закриття device-token | `250` ms                                            | `src/gateway/client.ts`                                    |
| Пауза примусової зупинки перед `terminate()` | `250` ms                                            | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут `stopAndWait()` за замовчуванням  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Інтервал tick за замовчуванням (до `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick               | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує фактичні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти повинні дотримуватися цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація Gateway за спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect на основі
  заголовків запиту, а не `connect.params.auth.*`.
- Для private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect за спільним секретом; не відкривайте цей режим у публічному/недовіреному ingress.
- Після pairing Gateway видає **токен пристрою** з областю дії, обмеженою роллю + областями видимості
  з’єднання. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для наступних підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений набір схвалених областей видимості для цього токена. Це зберігає вже наданий доступ
  до читання/перевірок/стану й уникає непомітного звуження повторних підключень до
  вужчої неявної області лише для admin.
- Формування client-side connect auth (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` ортогональний і завжди пересилається, якщо встановлений.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, потім збережений токен для конкретного пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не розв’язав
    `auth.token`. Спільний токен або будь-який розв’язаний токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    спроби повтору `AUTH_TOKEN_MISMATCH` обмежене лише **довіреними кінцевими точками** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth у довіреному транспорті,
  такому як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір областей видимості, запитаний викликачем, лишається авторитетним; кешовані області видимості
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область видимості `operator.pairing`).
- Видача/обертання токенів лишається обмеженою схваленим набором ролей, записаним у
  записі pairing цього пристрою; обертання токена не може розширити пристрій до
  ролі, яку ніколи не надав дозвіл pairing.
- Для сесій з токеном спареного пристрою керування пристроєм має власну область дії, якщо тільки
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/обертати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір областей видимості operator щодо
  поточних областей видимості сесії викликача. Викликачі без admin не можуть обертати токен до
  ширшого набору областей видимості operator, ніж вони вже мають.
- Збої автентифікації містять `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (булеве значення)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу із кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти повинні зупинити цикли автоматичного повторного підключення та показати вказівки для дій operator.

## Ідентичність пристрою + pairing

- Node повинні містити стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка ключової пари.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні схвалення pairing, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може пропускати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі з’єднання мають підписувати nonce `connect.challenge`, наданий сервером.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                  | details.code                     | details.reason           | Значення                                            |
| ---------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.      |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Часова мітка підпису поза межами дозволеного зсуву. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Збій формату/канонізації публічного ключа.          |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить серверний nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning метаданих
  спареного пристрою все одно керує політикою команд під час повторного підключення.

## TLS + pinning

- Для WS-з’єднань підтримується TLS.
- Клієнти можуть за бажанням закріпити відбиток сертифіката Gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API Gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається схемами
TypeBox у `src/gateway/protocol/schema.ts`.
