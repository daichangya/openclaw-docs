---
read_when:
    - Реалізація або оновлення WS-клієнтів Gateway
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схем/моделей протоколу
summary: 'Протокол WebSocket Gateway: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-16T00:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол WS Gateway — це **єдина контрольна площина + транспорт вузлів** для
OpenClaw. Усі клієнти (CLI, вебінтерфейс, застосунок macOS, вузли iOS/Android,
безголові вузли) підключаються через WebSocket і оголошують свою **роль** +
**область дії** під час рукостискання.

## Транспорт

- WebSocket, текстові кадри з корисним навантаженням JSON.
- Перший кадр **має** бути запитом `connect`.

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
(`src/gateway/protocol/schema/frames.ts`). `auth` і `canvasHostUrl` є необов’язковими.

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

Під час передавання в межах довіреного початкового завантаження `hello-ok.auth`
також може містити додаткові обмежені записи ролей у `deviceTokens`:

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

Для вбудованого потоку початкового завантаження вузла/оператора основний токен
вузла зберігає `scopes: []`, а будь-який переданий токен оператора залишається
обмеженим списком дозволів bootstrap-оператора (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки областей дії bootstrap
залишаються прив’язаними до префікса ролі: записи оператора задовольняють лише
запити оператора, а ролі, що не є оператором, усе одно потребують областей дії
у межах префікса власної ролі.

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

## Формат кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами вимагають **ключі ідемпотентності** (див. схему).

## Ролі + області дії

### Ролі

- `operator` = клієнт контрольної площини (CLI/UI/автоматизація).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Області дії (operator)

Поширені області дії:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

Для `talk.config` з `includeSecrets: true` потрібен `operator.talk.secrets`
(або `operator.admin`).

RPC-методи Gateway, зареєстровані плагінами, можуть вимагати власну область дії
оператора, але зарезервовані префікси основного адміністратора (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Область дії методу — лише перший рівень перевірки. Для деяких slash-команд,
доступних через `chat.send`, поверх цього застосовуються суворіші перевірки на
рівні команди. Наприклад, постійні записи `/config set` і `/config unset`
вимагають `operator.admin`.

`node.pair.approve` також має додаткову перевірку області дії під час
затвердження поверх базової області дії методу:

- запити без команд: `operator.pairing`
- запити з не-exec-командами вузла: `operator.pairing` + `operator.write`
- запити, що включають `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують заявлені можливості під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: список дозволених команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **заяви** і застосовує списки дозволів на боці сервера.

## Presence

- `system-presence` повертає записи, ключовані ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли
  показувати один рядок на пристрій, навіть якщо він підключається і як **operator**,
  і як **node**.

## Поширені сімейства RPC-методів

Ця сторінка не є згенерованим повним дампом, але публічна WS-поверхня ширша,
ніж наведені вище приклади рукостискання/автентифікації. Ось основні сімейства
методів, які Gateway надає сьогодні.

`hello-ok.features.methods` — це консервативний список виявлення, побудований з
`src/gateway/server-methods-list.ts` плюс експортів методів завантажених плагінів/каналів.
Сприймайте його як механізм виявлення можливостей, а не як згенерований дамп
кожного викликаного допоміжного методу, реалізованого в `src/gateway/server-methods/*.ts`.

### Система та ідентичність

- `health` повертає кешований або щойно перевірений знімок стану Gateway.
- `status` повертає зведення Gateway у стилі `/status`; чутливі поля
  включаються лише для клієнтів operator з областю дії admin.
- `gateway.identity.get` повертає ідентичність пристрою Gateway, яка
  використовується потоками relay і pairing.
- `system-presence` повертає поточний знімок presence для підключених
  пристроїв operator/node.
- `system-event` додає системну подію та може оновлювати/транслювати контекст
  presence.
- `last-heartbeat` повертає останню збережену подію Heartbeat.
- `set-heartbeats` перемикає обробку Heartbeat на Gateway.

### Моделі та використання

- `models.list` повертає каталог моделей, дозволених у середовищі виконання.
- `usage.status` повертає зведення вікон використання постачальника/залишку квоти.
- `usage.cost` повертає агреговані зведення вартості використання за діапазон дат.
- `doctor.memory.status` повертає стан готовності векторної пам’яті / embeddings
  для активного робочого простору агента за замовчуванням.
- `sessions.usage` повертає зведення використання по сесіях.
- `sessions.usage.timeseries` повертає часовий ряд використання для однієї сесії.
- `sessions.usage.logs` повертає записи журналу використання для однієї сесії.

### Канали та допоміжні засоби входу

- `channels.status` повертає зведення стану вбудованих і bundled каналів/плагінів.
- `channels.logout` виходить із конкретного каналу/облікового запису, якщо канал
  підтримує вихід.
- `web.login.start` запускає потік входу через QR/web для поточного QR-сумісного
  постачальника вебканалу.
- `web.login.wait` очікує завершення цього потоку входу через QR/web і в разі
  успіху запускає канал.
- `push.test` надсилає тестовий APNs push до зареєстрованого вузла iOS.
- `voicewake.get` повертає збережені тригери слів пробудження.
- `voicewake.set` оновлює тригери слів пробудження та транслює зміну.

### Повідомлення та журнали

- `send` — це прямий RPC доставки назовні для надсилання в канал/обліковий
  запис/тему поза межами виконувача чату.
- `logs.tail` повертає хвіст налаштованого файлового журналу Gateway з
  керуванням курсором/лімітом і максимальним розміром у байтах.

### Talk і TTS

- `talk.config` повертає корисне навантаження ефективної конфігурації Talk; для
  `includeSecrets` потрібен `operator.talk.secrets` (або `operator.admin`).
- `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів
  WebChat/Control UI.
- `talk.speak` синтезує мовлення через активного постачальника мовлення Talk.
- `tts.status` повертає стан увімкнення TTS, активного постачальника,
  резервних постачальників і стан конфігурації постачальника.
- `tts.providers` повертає видимий інвентар постачальників TTS.
- `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
- `tts.setProvider` оновлює бажаного постачальника TTS.
- `tts.convert` виконує одноразове перетворення тексту на мовлення.

### Секрети, конфігурація, оновлення та майстер

- `secrets.reload` повторно зіставляє активні SecretRef і замінює стан секретів
  у середовищі виконання лише за повного успіху.
- `secrets.resolve` зіставляє призначення секретів для цільового набору
  команд/цілей.
- `config.get` повертає поточний знімок конфігурації та хеш.
- `config.set` записує валідоване корисне навантаження конфігурації.
- `config.patch` об’єднує часткове оновлення конфігурації.
- `config.apply` виконує валідацію + повну заміну корисного навантаження конфігурації.
- `config.schema` повертає корисне навантаження живої схеми конфігурації, яке
  використовують Control UI і CLI: схема, `uiHints`, версія та метадані генерації,
  включно з метаданими схем плагінів + каналів, коли середовище виконання може
  їх завантажити. Схема містить метадані полів `title` / `description`,
  отримані з тих самих міток і довідкового тексту, що використовуються в UI,
  включно з вкладеними об’єктами, wildcard, елементами масиву та гілками
  композиції `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація полів.
- `config.schema.lookup` повертає корисне навантаження пошуку в межах шляху для
  одного шляху конфігурації: нормалізований шлях, вузол неглибокої схеми,
  відповідний hint + `hintPath` і зведення безпосередніх дочірніх елементів
  для деталізації в UI/CLI.
  - Вузли схеми lookup зберігають користувацьку документацію та поширені поля
    валідації: `title`, `description`, `type`, `enum`, `const`, `format`,
    `pattern`, числові/рядкові/масивні/об’єктні межі та булеві прапорці, як-от
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`,
    `hasChildren`, а також відповідні `hint` / `hintPath`.
- `update.run` запускає потік оновлення Gateway і планує перезапуск лише тоді,
  коли саме оновлення було успішним.
- `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають
  майстер онбордингу через WS RPC.

### Наявні основні сімейства

#### Допоміжні засоби агента та робочого простору

- `agents.list` повертає налаштовані записи агентів.
- `agents.create`, `agents.update` і `agents.delete` керують записами агентів і
  прив’язкою робочого простору.
- `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами
  bootstrap-робочого простору, доступними для агента.
- `agent.identity.get` повертає ефективну ідентичність помічника для агента або
  сесії.
- `agent.wait` очікує завершення виконання та повертає фінальний знімок, якщо він доступний.

#### Керування сесією

- `sessions.list` повертає поточний індекс сесій.
- `sessions.subscribe` і `sessions.unsubscribe` перемикають підписки на події
  змін сесій для поточного WS-клієнта.
- `sessions.messages.subscribe` і `sessions.messages.unsubscribe` перемикають
  підписки на події транскрипту/повідомлень для однієї сесії.
- `sessions.preview` повертає обмежені попередні перегляди транскриптів для
  конкретних ключів сесій.
- `sessions.resolve` зіставляє або канонізує ціль сесії.
- `sessions.create` створює новий запис сесії.
- `sessions.send` надсилає повідомлення до наявної сесії.
- `sessions.steer` — це варіант переривання та спрямування для активної сесії.
- `sessions.abort` перериває активну роботу для сесії.
- `sessions.patch` оновлює метадані/перевизначення сесії.
- `sessions.reset`, `sessions.delete` і `sessions.compact` виконують
  обслуговування сесії.
- `sessions.get` повертає повний збережений рядок сесії.
- виконання чату, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і
  `chat.inject`.
- `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги
  директив видаляються з видимого тексту, простотекстові XML-корисні
  навантаження викликів інструментів (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  усіченими блоками викликів інструментів) та витеклі ASCII/повноширинні токени
  керування моделлю видаляються, чисті рядки помічника з беззвучними токенами,
  як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки
  можуть бути замінені заповнювачами.

#### Pairing пристроїв і токени пристроїв

- `device.pair.list` повертає очікувані й затверджені спарені пристрої.
- `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують
  записами pairing пристроїв.
- `device.token.rotate` ротує токен спареного пристрою в межах затверджених
  обмежень ролі та області дії.
- `device.token.revoke` відкликає токен спареного пристрою.

#### Pairing вузлів, invoke і відкладена робота

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` і `node.pair.verify` охоплюють pairing вузлів і bootstrap
  verification.
- `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
- `node.rename` оновлює мітку спареного вузла.
- `node.invoke` пересилає команду підключеному вузлу.
- `node.invoke.result` повертає результат для запиту invoke.
- `node.event` переносить події, що походять від вузла, назад у gateway.
- `node.canvas.capability.refresh` оновлює токени можливостей canvas з
  обмеженою областю дії.
- `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
- `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною
  роботою для офлайн-/відключених вузлів.

#### Сімейства погоджень

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і
  `exec.approval.resolve` охоплюють одноразові запити погодження exec, а також
  пошук/повторення відкладених погоджень.
- `exec.approval.waitDecision` очікує на одне відкладене погодження exec і
  повертає остаточне рішення (або `null` у разі тайм-ауту).
- `exec.approvals.get` і `exec.approvals.set` керують знімками політики
  погоджень exec у gateway.
- `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною
  політикою погоджень exec вузла через relay-команди вузла.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють потоки
  погодження, визначені плагінами.

#### Інші основні сімейства

- automation:
  - `wake` планує негайне або на наступний Heartbeat введення тексту пробудження
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Поширені сімейства подій

- `chat`: оновлення UI-чату, як-от `chat.inject` та інші події чату лише для
  транскрипту.
- `session.message` і `session.tool`: оновлення транскрипту/потоку подій для
  сесії, на яку оформлено підписку.
- `sessions.changed`: змінився індекс сесій або метадані.
- `presence`: оновлення знімка system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану Gateway.
- `heartbeat`: оновлення потоку подій Heartbeat.
- `cron`: подія зміни запуску/завдання Cron.
- `shutdown`: сповіщення про вимкнення Gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спареного пристрою.
- `voicewake.changed`: змінено конфігурацію тригерів слів пробудження.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  погодження exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  погодження плагіна.

### Допоміжні методи вузла

- Вузли можуть викликати `skills.bins`, щоб отримати поточний список
  виконуваних файлів навичок для перевірок автодозволу.

### Допоміжні методи оператора

- Оператори можуть викликати `commands.list` (`operator.read`), щоб отримати
  інвентар команд часу виконання для агента.
  - `agentId` є необов’язковим; не вказуйте його, щоб читати робочий простір
    агента за замовчуванням.
  - `scope` керує тим, яку поверхню використовує основний `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і типовий шлях `both` повертають нативні імена з урахуванням
      постачальника, коли вони доступні
  - `textAliases` містить точні slash-аліаси, як-от `/model` і `/m`.
  - `nativeName` містить нативну назву команди з урахуванням постачальника,
    коли така існує.
  - `provider` є необов’язковим і впливає лише на нативне найменування та
    доступність нативних команд плагіна.
  - `includeArgs=false` не включає серіалізовані метадані аргументів із відповіді.
- Оператори можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів
  часу виконання для агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник плагіна, коли `source="plugin"`
  - `optional`: чи є інструмент плагіна необов’язковим
- Оператори можуть викликати `tools.effective` (`operator.read`), щоб отримати ефективний інвентар інструментів
  часу виконання для сесії.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений контекст часу виконання з сесії на боці сервера
    замість того, щоб приймати наданий викликачем контекст автентифікації або доставки.
  - Відповідь прив’язана до сесії та відображає, що активна розмова може
    використовувати прямо зараз, включно з інструментами core, plugin і channel.
- Оператори можуть викликати `skills.status` (`operator.read`), щоб отримати
  видимий інвентар Skills для агента.
  - `agentId` є необов’язковим; не вказуйте його, щоб читати робочий простір
    агента за замовчуванням.
  - Відповідь містить відповідність вимогам, відсутні вимоги, перевірки
    конфігурації та санітизовані параметри встановлення без розкриття сирих
    секретних значень.
- Оператори можуть викликати `skills.search` і `skills.detail` (`operator.read`)
  для метаданих виявлення ClawHub.
- Оператори можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку навички до каталогу `skills/` робочого простору агента за замовчуванням.
  - Режим інсталятора Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Оператори можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані
    встановлення ClawHub у робочому просторі агента за замовчуванням.
  - Режим конфігурації вносить зміни до значень `skills.entries.<skillKey>`,
    таких як `enabled`, `apiKey` і `env`.

## Погодження exec

- Коли запит exec потребує погодження, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують це через виклик `exec.approval.resolve` (потрібна область дії `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після погодження переслані виклики `node.invoke system.run` повторно
  використовують цей канонічний `systemRunPlan` як авторитетний контекст
  команди/cwd/сесії.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і остаточним пересиланням погодженого `system.run`,
  gateway відхиляє запуск замість того, щоб довіряти зміненому корисному
  навантаженню.

## Резервна доставка агента

- Запити `agent` можуть включати `deliver=true`, щоб запросити вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сесії, якщо неможливо визначити зовнішній маршрут доставки (наприклад, для внутрішніх/webchat-сесій або неоднозначних багатоканальних конфігурацій).

## Версіонування

- `PROTOCOL_VERSION` розташовано в `src/gateway/protocol/schema/protocol-schemas.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Константи клієнта

Еталонний клієнт у `src/gateway/client.ts` використовує ці типові значення. Ці
значення стабільні в межах протоколу v3 і є очікуваною базовою лінією для
сторонніх клієнтів.

| Константа | Типове значення | Джерело |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| Тайм-аут запиту (на RPC) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Тайм-аут preauth / connect-challenge | `10_000` ms | `src/gateway/handshake-timeouts.ts` (обмеження `250`–`10_000`) |
| Початковий backoff повторного підключення | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| Максимальний backoff повторного підключення | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| Обмеження швидкого повтору після закриття токена пристрою | `250` ms | `src/gateway/client.ts` |
| Пільговий період примусової зупинки перед `terminate()` | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| Типовий тайм-аут `stopAndWait()` | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| Типовий інтервал tick (до `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| Закриття через тайм-аут tick | код `4000`, коли тиша перевищує `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

Сервер оголошує ефективні `policy.tickIntervalMs`, `policy.maxPayload` і
`policy.maxBufferedBytes` у `hello-ok`; клієнти повинні дотримуватися цих значень,
а не типових значень до рукостискання.

## Автентифікація

- Автентифікація Gateway через спільний секрет використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму автентифікації.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або non-loopback
  `gateway.auth.mode: "trusted-proxy"`, проходять перевірку автентифікації connect за
  заголовками запиту замість `connect.params.auth.*`.
- `gateway.auth.mode: "none"` для приватного ingress повністю пропускає
  автентифікацію connect через спільний секрет; не відкривайте цей режим для
  публічного/ненадійного ingress.
- Після pairing Gateway видає **токен пристрою**, обмежений роллю + областями
  дії підключення. Він повертається в `hello-ok.auth.deviceToken` і має
  зберігатися клієнтом для майбутніх підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після кожного
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має
  повторно використовувати збережений затверджений набір областей дії для цього
  токена. Це зберігає вже наданий доступ для читання/перевірок/статусу й
  запобігає непомітному звуженню повторних підключень до вужчої неявної
  області дії лише admin.
- Формування автентифікації connect на боці клієнта (`selectConnectAuth` у
  `src/gateway/client.ts`):
  - `auth.password` є ортогональним і завжди пересилається, якщо заданий.
  - `auth.token` заповнюється в такому порядку пріоритету: спочатку явний
    спільний токен, потім явний `deviceToken`, потім збережений токен
    пристрою для конкретного пристрою (ключ: `deviceId` + `role`).
  - `auth.bootstrapToken` надсилається лише тоді, коли жоден із наведених вище
    варіантів не дав значення для `auth.token`. Спільний токен або будь-який
    визначений токен пристрою його пригнічує.
  - Автопідвищення збереженого токена пристрою під час одноразової повторної
    спроби `AUTH_TOKEN_MISMATCH` обмежене **лише довіреними endpoint** —
    loopback або `wss://` із закріпленим `tlsFingerprint`. Публічний `wss://`
    без pinning не підходить.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли підключення використовувало bootstrap auth через
  довірений транспорт, наприклад `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей
  запитаний викликачем набір областей дії залишається авторитетним; кешовані
  області дії повторно використовуються лише тоді, коли клієнт повторно
  використовує збережений токен пристрою для конкретного пристрою.
- Токени пристроїв можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібна область дії `operator.pairing`).
- Видача/ротація токенів залишається обмеженою затвердженим набором ролей,
  записаним у записі pairing цього пристрою; ротація токена не може розширити
  пристрій до ролі, яку pairing approval ніколи не надавав.
- Для сесій токенів спарених пристроїв керування пристроями є самостійно
  обмеженим, якщо тільки викликач також не має `operator.admin`: викликачі без
  прав admin можуть видаляти/відкликати/ротувати лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір областей дії оператора
  щодо поточних областей дії сесії викликача. Викликачі без прав admin не
  можуть ротувати токен до ширшого набору областей дії оператора, ніж вони вже мають.
- Збої автентифікації містять `error.details.code` плюс підказки для
  відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим
    токеном пристрою для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти повинні припинити автоматичні
    цикли повторного підключення й показати оператору вказівки щодо подальших дій.

## Ідентичність пристрою + pairing

- Вузли повинні включати стабільну ідентичність пристрою (`device.id`),
  похідну від відбитка keypair.
- Gateway видає токени для кожного пристрою + ролі.
- Для нових `device.id` потрібні pairing approvals, якщо не ввімкнено локальне
  auto-approval.
- Pairing auto-approval зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях self-connect для backend/container-local
  довірених потоків helper зі спільним секретом.
- Підключення tailnet або LAN на тому самому хості однаково вважаються
  віддаленими для pairing і потребують approval.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може пропустити її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI через `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` разом зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення | details.code | details.reason | Значення |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | Клієнт не вказав `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | Клієнт підписався застарілим/неправильним nonce. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | Корисне навантаження підпису не відповідає корисному навантаженню v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | Підписана часова позначка виходить за межі дозволеного відхилення. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` не відповідає відбитку публічного ключа. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | Не вдалося виконати форматування/канонізацію публічного ключа. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте корисне навантаження v2, яке містить server nonce.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаним корисним навантаженням підпису є `v3`, яке прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning
  метаданих спарених пристроїв усе одно керує політикою команд під час повторного підключення.

## TLS + pinning

- TLS підтримується для WS-підключень.
- Клієнти за бажання можуть закріпити відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Область застосування

Цей протокол надає **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.
