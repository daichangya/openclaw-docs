---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схем/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-21T20:16:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол Gateway WS — це **єдина контрольна площина + транспорт вузлів** для
OpenClaw. Усі клієнти (CLI, веб-інтерфейс, програма macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свою **роль** + **область
доступу** під час рукостискання.

## Транспорт

- WebSocket, текстові кадри з корисним навантаженням JSON.
- Перший кадр **має** бути запитом `connect`.

## Рукостискання (connect)

Gateway → Клієнт (виклик перед підключенням):

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

`server`, `features`, `snapshot` і `policy` усі є обов’язковими за схемою
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` є необов’язковим. `auth`
повідомляє про погоджені роль/області доступу, коли вони доступні, а також включає `deviceToken`,
коли gateway його видає.

Коли токен пристрою не видається, `hello-ok.auth` все одно може повідомляти про
погоджені дозволи:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Під час довіреної передачі bootstrap `hello-ok.auth` також може включати додаткові
записи ролей з обмеженнями в `deviceTokens`:

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

Для вбудованого bootstrap-потоку node/operator основний токен вузла залишається
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим списком
дозволених bootstrap-областей оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap-областей доступу
залишаються прив’язаними до префікса ролі: записи оператора задовольняють лише
запити оператора, а ролям, які не є оператором, усе одно потрібні області доступу
під власним префіксом ролі.

### Приклад node

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

Методи з побічними ефектами вимагають **ключі ідемпотентності** (див. схему).

## Ролі + області доступу

### Ролі

- `operator` = клієнт контрольної площини (CLI/UI/автоматизація).
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

Зареєстровані Plugin методи Gateway RPC можуть запитувати власну область доступу
оператора, але зарезервовані префікси базового адміністрування (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область доступу методу — це лише перший рівень перевірки. Деякі slash-команди,
до яких звертаються через `chat.send`, застосовують суворіші перевірки на рівні
команди поверх цього. Наприклад, постійні записи
`/config set` і `/config unset` вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку області доступу під час
схвалення поверх базової області доступу методу:

- запити без команд: `operator.pairing`
- запити з командами вузла, які не є exec: `operator.pairing` + `operator.write`
- запити, що включають `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **заяви** і застосовує списки дозволених значень на боці сервера.

## Presence

- `system-presence` повертає записи з ключами за ідентичністю пристрою.
- Записи присутності включають `deviceId`, `roles` і `scopes`, щоб інтерфейси могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Обмеження областей доступу для широкомовних подій

Широкомовні події WebSocket, які надсилає сервер, обмежуються за областями доступу, щоб сесії з лише pairing-доступом або лише node-сесії не отримували пасивно вміст сесії.

- **Кадри chat, agent і результатів інструментів** (включно з потоковими подіями `agent` і результатами викликів інструментів) вимагають щонайменше `operator.read`. Сесії без `operator.read` повністю пропускають ці кадри.
- **Широкомовні події `plugin.*`, визначені Plugin**, обмежуються `operator.write` або `operator.admin` залежно від того, як Plugin їх зареєстрував.
- **Події стану та транспорту** (`heartbeat`, `presence`, `tick`, життєвий цикл connect/disconnect тощо) залишаються без обмежень, щоб стан транспорту залишався видимим для кожної автентифікованої сесії.
- **Невідомі сімейства широкомовних подій** за замовчуванням обмежуються за областями доступу (fail-closed), якщо зареєстрований обробник явно не послаблює це.

Кожне клієнтське підключення зберігає власний номер послідовності для цього клієнта, щоб широкомовні повідомлення зберігали монотонний порядок на цьому сокеті, навіть коли різні клієнти бачать різні підмножини потоку подій, відфільтровані за областями доступу.

## Поширені сімейства методів RPC

Ця сторінка не є згенерованим повним дампом, але публічна поверхня WS ширша,
ніж приклади рукостискання/автентифікації вище. Це основні сімейства методів,
які Gateway надає сьогодні.

`hello-ok.features.methods` — це консервативний список виявлення, побудований з
`src/gateway/server-methods-list.ts` плюс експортів методів завантажених plugin/channel.
Сприймайте його як виявлення можливостей, а не як згенерований дамп кожного допоміжного виклику,
реалізованого в `src/gateway/server-methods/*.ts`.

### Система та ідентичність

- `health` повертає кешований або щойно перевірений знімок стану gateway.
- `status` повертає зведення gateway у стилі `/status`; чутливі поля
  включаються лише для операторських клієнтів з admin-областю доступу.
- `gateway.identity.get` повертає ідентичність пристрою gateway, яка використовується в relay і
  потоках pairing.
- `system-presence` повертає поточний знімок присутності для підключених
  пристроїв operator/node.
- `system-event` додає системну подію і може оновлювати/транслювати контекст
  присутності.
- `last-heartbeat` повертає останню збережену подію Heartbeat.
- `set-heartbeats` перемикає обробку Heartbeat на gateway.

### Моделі та використання

- `models.list` повертає каталог моделей, дозволених у середовищі виконання.
- `usage.status` повертає зведення вікон використання/залишкової квоти провайдерів.
- `usage.cost` повертає зведення агрегованої вартості використання за діапазон дат.
- `doctor.memory.status` повертає стан готовності vector-memory / embedding для
  активного робочого простору агента за замовчуванням.
- `sessions.usage` повертає зведення використання для кожної сесії.
- `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
- `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

### Канали та допоміжні засоби входу

- `channels.status` повертає зведення стану вбудованих і bundled каналів/plugin.
- `channels.logout` виходить із конкретного каналу/облікового запису, якщо канал
  підтримує вихід.
- `web.login.start` запускає QR/web-потік входу для поточного QR-сумісного веб-
  провайдера каналу.
- `web.login.wait` очікує завершення цього QR/web-потоку входу і запускає
  канал у разі успіху.
- `push.test` надсилає тестовий APNs push до зареєстрованого вузла iOS.
- `voicewake.get` повертає збережені тригери слова активації.
- `voicewake.set` оновлює тригери слова активації й транслює зміну.

### Повідомлення та журнали

- `send` — це прямий RPC вихідної доставки для цільових надсилань
  у канал/обліковий запис/гілку поза виконавцем чату.
- `logs.tail` повертає tail налаштованого файлового журналу gateway з курсором/лімітом і
  керуванням максимальною кількістю байтів.

### Talk і TTS

- `talk.config` повертає ефективне корисне навантаження конфігурації Talk; `includeSecrets`
  вимагає `operator.talk.secrets` (або `operator.admin`).
- `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів
  WebChat/Control UI.
- `talk.speak` синтезує мовлення через активного провайдера мовлення Talk.
- `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів
  і стан конфігурації провайдера.
- `tts.providers` повертає видимий інвентар провайдерів TTS.
- `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
- `tts.setProvider` оновлює бажаного провайдера TTS.
- `tts.convert` виконує одноразове перетворення тексту в мовлення.

### Secrets, config, update і wizard

- `secrets.reload` повторно визначає активні SecretRef і замінює стан секретів середовища виконання
  лише за повного успіху.
- `secrets.resolve` визначає призначення секретів для цілі набору
  команд/цілей.
- `config.get` повертає поточний знімок конфігурації та хеш.
- `config.set` записує перевірене корисне навантаження конфігурації.
- `config.patch` об’єднує часткове оновлення конфігурації.
- `config.apply` перевіряє й замінює повне корисне навантаження конфігурації.
- `config.schema` повертає корисне навантаження активної схеми конфігурації, яке використовують Control UI і
  інструменти CLI: схема, `uiHints`, версія і метадані генерації,
  включно з метаданими схем plugin + channel, коли середовище виконання може їх завантажити. Схема
  включає метадані полів `title` / `description`, отримані з тих самих міток
  і довідкового тексту, що використовує UI, включно з вкладеними object, wildcard, array-item
  і гілками композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна
  документація полів.
- `config.schema.lookup` повертає корисне навантаження пошуку з областю шляху для одного шляху конфігурації:
  нормалізований шлях, неглибокий вузол схеми, зіставлену підказку + `hintPath` і
  зведення безпосередніх дочірніх елементів для детального перегляду UI/CLI.
  - Вузли схеми пошуку зберігають документацію для користувача та поширені поля перевірки:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    числові/рядкові/масивні/об’єктні межі й булеві прапорці, як-от
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Зведення дочірніх елементів показують `key`, нормалізований `path`, `type`, `required`,
    `hasChildren`, а також зіставлені `hint` / `hintPath`.
- `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді,
  коли саме оновлення було успішним.
- `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають
  майстер налаштування через WS RPC.

### Наявні основні сімейства

#### Допоміжні засоби агента та робочого простору

- `agents.list` повертає налаштовані записи агентів.
- `agents.create`, `agents.update` і `agents.delete` керують записами агентів і
  прив’язкою робочого простору.
- `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами
  bootstrap-робочого простору, доступними для агента.
- `agent.identity.get` повертає ефективну ідентичність помічника для агента або
  сесії.
- `agent.wait` очікує завершення запуску й повертає термінальний знімок, якщо
  він доступний.

#### Керування сесіями

- `sessions.list` повертає поточний індекс сесій.
- `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події
  змін сесії для поточного WS-клієнта.
- `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають
  підписки на події транскрипту/повідомлень для однієї сесії.
- `sessions.preview` повертає обмежені попередні перегляди транскрипту для
  конкретних ключів сесій.
- `sessions.resolve` визначає або канонізує ціль сесії.
- `sessions.create` створює новий запис сесії.
- `sessions.send` надсилає повідомлення в наявну сесію.
- `sessions.steer` — це варіант переривання й перенаправлення для активної сесії.
- `sessions.abort` перериває активну роботу для сесії.
- `sessions.patch` оновлює метадані/перевизначення сесії.
- `sessions.reset`, `sessions.delete` і `sessions.compact` виконують
  обслуговування сесії.
- `sessions.get` повертає повний збережений рядок сесії.
- виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і
  `chat.inject`.
- `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги директив
  видаляються з видимого тексту, корисні навантаження XML викликів інструментів у форматі простого тексту (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів), а також витеклі ASCII/повноширинні токени керування моделі
  видаляються, чисті рядки помічника з мовчазними токенами, такі як точні `NO_REPLY` /
  `no_reply`, пропускаються, а надмірно великі рядки можуть бути замінені заповнювачами.

#### Pairing пристроїв і токени пристроїв

- `device.pair.list` повертає очікувальні й схвалені спарені пристрої.
- `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують
  записами pairing пристроїв.
- `device.token.rotate` ротує токен спареного пристрою в межах його схваленої ролі
  та меж областей доступу.
- `device.token.revoke` відкликає токен спареного пристрою.

#### Pairing вузлів, invoke і відкладена робота

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` і `node.pair.verify` охоплюють pairing вузлів і bootstrap-перевірку.
- `node.list` і `node.describe` повертають стан відомого/підключеного вузла.
- `node.rename` оновлює мітку спареного вузла.
- `node.invoke` пересилає команду підключеному вузлу.
- `node.invoke.result` повертає результат для запиту invoke.
- `node.event` переносить події, що походять від вузла, назад у gateway.
- `node.canvas.capability.refresh` оновлює токени можливостей canvas з обмеженою областю дії.
- `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
- `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною роботою
  для офлайн/відключених вузлів.

#### Сімейства approval

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і
  `exec.approval.resolve` охоплюють одноразові запити approval для exec плюс
  пошук/повторення очікувальних approval.
- `exec.approval.waitDecision` очікує на одне очікувальне approval для exec і повертає
  остаточне рішення (або `null` у разі тайм-ауту).
- `exec.approvals.get` і `exec.approvals.set` керують знімками політики
  approval exec у gateway.
- `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною для вузла політикою
  approval exec через команди relay вузла.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють
  потоки approval, визначені Plugin.

#### Інші основні сімейства

- automation:
  - `wake` планує негайне або наступне на Heartbeat вбудовування тексту пробудження
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Поширені сімейства подій

- `chat`: оновлення UI-чату, такі як `chat.inject` та інші події чату
  лише для транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  підписаної сесії.
- `sessions.changed`: індекс сесії або метадані змінено.
- `presence`: оновлення знімка системної присутності.
- `tick`: періодична подія keepalive / перевірки доступності.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: конфігурацію тригерів слова активації змінено.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  approval Plugin.

### Допоміжні методи node

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для перевірок auto-allow.

### Допоміжні методи operator

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати інвентар команд середовища виконання для агента.
  - `agentId` необов’язковий; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - `scope` керує тим, яку поверхню націлює основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і стандартний шлях `both` повертають залежні від провайдера native-імена,
      коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить залежну від провайдера native-назву команди, коли вона існує.
  - `provider` необов’язковий і впливає лише на native-іменування та доступність native-команд Plugin.
  - `includeArgs=false` пропускає серіалізовані метадані аргументів у відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів середовища виконання для
  агента. Відповідь включає згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати фактичний інвентар інструментів
  середовища виконання для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений контекст середовища виконання із сесії на боці сервера замість прийняття
    auth або контексту доставки, наданих викликачем.
  - Відповідь має область дії сесії та відображає те, що активна розмова може використовувати прямо зараз,
    включно з інструментами core, plugin і channel.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  інвентар Skills для агента.
  - `agentId` необов’язковий; пропустіть його, щоб читати робочий простір агента за замовчуванням.
  - Відповідь включає придатність, відсутні вимоги, перевірки конфігурації та
    санітизовані параметри встановлення без розкриття необроблених значень секретів.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим встановлювача Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config вносить зміни до значень `skills.entries.<skillKey>`, таких як `enabled`,
    `apiKey` і `env`.

## Approval для exec

- Коли запит exec потребує approval, gateway транслює `exec.approval.requested`.
- Клієнти operator вирішують це, викликаючи `exec.approval.resolve` (потрібна область доступу `operator.approvals`).
- Для `host=node` `exec.approval.request` має включати `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після approval переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним пересиланням схваленого `system.run`,
  gateway відхиляє запуск замість того, щоб довіряти зміненому корисному навантаженню.

## Резервна доставка агента

- Запити `agent` можуть включати `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: цілі доставки, які неможливо визначити або які є лише внутрішніми, повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, внутрішні/webchat сесії або неоднозначні конфігурації багатьох каналів).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці значення за замовчуванням. Значення
стабільні в межах протоколу v3 і є очікуваною базовою лінією для сторонніх клієнтів.

| Constant                                  | Default                                               | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Тайм-аут запиту (на один RPC)             | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Тайм-аут preauth / connect-challenge      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Максимальний backoff повторного підключення | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Обмеження швидкого повтору після закриття токена пристрою | `250` ms                             | `src/gateway/client.ts`                                    |
| Пільговий період force-stop перед `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Тайм-аут за замовчуванням для `stopAndWait()` | `1_000` ms                                        | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Стандартний інтервал tick (до `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Закриття через тайм-аут tick              | код `4000`, коли тиша перевищує `tickIntervalMs * 2`  | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Сервер оголошує фактичні `policy.tickIntervalMs`, `policy.maxPayload`
і `policy.maxBufferedBytes` у `hello-ok`; клієнти повинні дотримуватися цих значень,
а не значень за замовчуванням до рукостискання.

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect на основі
  заголовків запиту замість `connect.params.auth.*`.
- Приватний ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect зі спільним секретом; не відкривайте цей режим для публічного або недовіреного ingress.
- Після pairing Gateway видає **токен пристрою** з областю дії, обмеженою роллю + областями доступу
  підключення. Він повертається в `hello-ok.auth.deviceToken`, і клієнт повинен
  зберігати його для майбутніх підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати
  збережений набір схвалених областей доступу для цього токена. Це зберігає доступ до
  читання/перевірки/статусу, який уже було надано, і запобігає непомітному звуженню
  повторних підключень до вужчої неявної області доступу лише для адміністрування.
- Побудова auth для connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є незалежним і завжди пересилається, якщо встановлено.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний спільний токен,
    потім явний `deviceToken`, далі збережений токен для конкретного пристрою (з ключем за
    `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище варіантів не визначив
    `auth.token`. Спільний токен або будь-який визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової
    повторної спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними кінцевими точками** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передачі bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap-auth через довірений транспорт,
  такий як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  набір областей доступу, запитаний викликачем, залишається авторитетним; кешовані області доступу
  повторно використовуються лише тоді, коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область доступу `operator.pairing`).
- Видача/ротація токенів залишається обмеженою схваленим набором ролей, записаним у
  записі pairing цього пристрою; ротація токена не може розширити пристрій до
  ролі, яку схвалення pairing ніколи не надавало.
- Для сесій токенів спарених пристроїв керування пристроями має власну область дії, якщо лише
  викликач також не має `operator.admin`: викликачі без адміністраторських прав можуть видаляти/відкликати/ротувати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір областей доступу оператора щодо
  поточних областей доступу сесії викликача. Викликачі без адміністраторських прав не можуть ротувати токен у
  ширший набір областей доступу оператора, ніж той, який вони вже мають.
- Збої автентифікації включають `error.details.code` плюс підказки щодо відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть зробити одну обмежену повторну спробу з кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти повинні припинити цикли автоматичного повторного підключення і показати вказівки для дій оператора.

## Ідентичність пристрою + pairing

- Вузли повинні включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні схвалення pairing, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених допоміжних потоків зі спільним секретом.
- Підключення tailnet або LAN з того самого хоста все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти повинні включати ідентичність `device` під час `connect` (operator + node).
  Control UI може пропускати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний варіант, критичне зниження безпеки).
- Усі підключення повинні підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які досі використовують поведінку підпису до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана позначка часу поза межами дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Формат публічного ключа/канонізація не пройшли перевірку. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке включає server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажане корисне навантаження підпису — `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але закріплення
  метаданих спарених пристроїв усе одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти можуть за бажанням закріплювати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.
