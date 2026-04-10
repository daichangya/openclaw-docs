---
read_when:
    - Реалізація або оновлення клієнтів Gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторне генерування схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: рукостискання, кадри, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-10T06:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол Gateway WS — це **єдина control plane + node transport** для
OpenClaw. Усі клієнти (CLI, веб-UI, застосунок macOS, вузли iOS/Android, headless
вузли) підключаються через WebSocket і оголошують свою **role** + **scope** під
час рукостискання.

## Транспорт

- WebSocket, текстові кадри з JSON payload.
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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

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

Під час передавання довіреного bootstrap `hello-ok.auth` також може містити
додаткові обмежені записи ролей у `deviceTokens`:

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

Для вбудованого потоку bootstrap node/operator основний токен вузла залишається
`scopes: []`, а будь-який переданий токен оператора залишається обмеженим
дозволеним списком bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки scope bootstrap
залишаються з префіксом role: записи operator задовольняють лише запити
operator, а ролі, що не є operator, усе одно потребують scope під власним
префіксом role.

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

## Формат кадрів

- **Запит**: `{type:"req", id, method, params}`
- **Відповідь**: `{type:"res", id, ok, payload|error}`
- **Подія**: `{type:"event", event, payload, seq?, stateVersion?}`

Методи з побічними ефектами потребують **idempotency keys** (див. схему).

## Roles + scopes

### Roles

- `operator` = клієнт control plane (CLI/UI/automation).
- `node` = хост можливостей (camera/screen/canvas/system.run).

### Scopes (operator)

Поширені scope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

Для `talk.config` з `includeSecrets: true` потрібен `operator.talk.secrets`
(або `operator.admin`).

Зареєстровані plugin методи gateway RPC можуть вимагати власний scope operator,
але зарезервовані префікси core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зводяться до `operator.admin`.

Scope методу — лише перший бар’єр. Деякі slash-команди, до яких звертаються через
`chat.send`, застосовують додаткові суворіші перевірки на рівні команди.
Наприклад, постійні записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення понад
базовий scope методу:

- запити без команди: `operator.pairing`
- запити з командами вузла, що не є exec: `operator.pairing` + `operator.write`
- запити, які містять `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Вузли оголошують claims можливостей під час підключення:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад, `screen.record`, `camera.capture`).

Gateway розглядає їх як **claims** і застосовує серверні allowlist.

## Presence

- `system-presence` повертає записи, ключовані за ідентичністю пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли
  показувати один рядок на пристрій, навіть якщо він підключений і як **operator**,
  і як **node**.

## Поширені сімейства RPC-методів

Ця сторінка не є згенерованим повним дампом, але публічна поверхня WS ширша,
ніж наведені вище приклади рукостискання/автентифікації. Це основні сімейства
методів, які Gateway надає сьогодні.

`hello-ok.features.methods` — це консервативний список виявлення, зібраний із
`src/gateway/server-methods-list.ts` плюс експорти методів завантажених plugin/channel.
Сприймайте його як виявлення можливостей, а не як згенерований дамп кожного
викличного helper, реалізованого в `src/gateway/server-methods/*.ts`.

### Система та ідентичність

- `health` повертає кешований або щойно перевірений знімок стану gateway.
- `status` повертає зведення gateway у стилі `/status`; чутливі поля
  включаються лише для клієнтів operator з admin scope.
- `gateway.identity.get` повертає ідентичність пристрою gateway, яка
  використовується в relay і потоках pairing.
- `system-presence` повертає поточний знімок presence для підключених
  пристроїв operator/node.
- `system-event` додає системну подію та може оновлювати/транслювати контекст
  presence.
- `last-heartbeat` повертає останню збережену подію heartbeat.
- `set-heartbeats` перемикає обробку heartbeat у gateway.

### Моделі та використання

- `models.list` повертає каталог моделей, дозволених під час виконання.
- `usage.status` повертає вікна використання провайдерів/зведення залишкової квоти.
- `usage.cost` повертає агреговані зведення використання вартості для діапазону дат.
- `doctor.memory.status` повертає готовність vector-memory / embedding для
  активного робочого простору агента за замовчуванням.
- `sessions.usage` повертає зведення використання за сеансами.
- `sessions.usage.timeseries` повертає часовий ряд використання для одного сеансу.
- `sessions.usage.logs` повертає записи журналу використання для одного сеансу.

### Канали та помічники входу

- `channels.status` повертає зведення стану вбудованих і bundled channel/plugin.
- `channels.logout` виходить із конкретного каналу/облікового запису, якщо канал
  підтримує вихід.
- `web.login.start` запускає QR/web потік входу для поточного провайдера
  web-каналу з підтримкою QR.
- `web.login.wait` очікує завершення цього QR/web потоку входу та запускає
  канал у разі успіху.
- `push.test` надсилає тестовий push APNs до зареєстрованого вузла iOS.
- `voicewake.get` повертає збережені тригери wake-word.
- `voicewake.set` оновлює тригери wake-word і транслює зміну.

### Повідомлення та журнали

- `send` — це прямий RPC outbound-delivery для надсилання з націлюванням на
  channel/account/thread поза chat runner.
- `logs.tail` повертає tail налаштованого файлового журналу gateway з контролем
  cursor/limit і max-byte.

### Talk і TTS

- `talk.config` повертає ефективний payload конфігурації Talk; `includeSecrets`
  потребує `operator.talk.secrets` (або `operator.admin`).
- `talk.mode` встановлює/транслює поточний стан режиму Talk для клієнтів
  WebChat/Control UI.
- `talk.speak` синтезує мовлення через активного speech-провайдера Talk.
- `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних
  провайдерів і стан конфігурації провайдера.
- `tts.providers` повертає видимий інвентар провайдерів TTS.
- `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
- `tts.setProvider` оновлює бажаного провайдера TTS.
- `tts.convert` виконує одноразове перетворення text-to-speech.

### Секрети, конфігурація, оновлення та wizard

- `secrets.reload` повторно розв’язує активні SecretRef і замінює стан секретів
  під час виконання лише за повного успіху.
- `secrets.resolve` розв’язує призначення секретів цілі команди для конкретного
  набору command/target.
- `config.get` повертає поточний знімок конфігурації та хеш.
- `config.set` записує валідований payload конфігурації.
- `config.patch` об’єднує часткове оновлення конфігурації.
- `config.apply` валідує і замінює повний payload конфігурації.
- `config.schema` повертає payload живої схеми конфігурації, який використовують
  Control UI та інструменти CLI: schema, `uiHints`, версію та метадані
  генерування, включно з метаданими схеми plugin + channel, коли runtime може
  їх завантажити. Схема містить метадані полів `title` / `description`,
  похідні від тих самих міток і довідкового тексту, які використовує UI,
  включно з вкладеним object, wildcard, array-item і гілками композиції
  `anyOf` / `oneOf` / `allOf`, коли існує відповідна документація поля.
- `config.schema.lookup` повертає payload lookup з обмеженням шляхом для одного
  шляху конфігурації: нормалізований шлях, вузол поверхневої схеми, підібрану
  підказку + `hintPath` і зведення безпосередніх дочірніх елементів для
  поглибленого перегляду в UI/CLI.
  - Вузли схеми lookup зберігають документацію, орієнтовану на користувача, і
    поширені поля валідації: `title`, `description`, `type`, `enum`, `const`, `format`,
    `pattern`, числові/рядкові/масивні/об’єктні межі та булеві прапорці, як-от
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Зведення дочірніх елементів містять `key`, нормалізований `path`, `type`, `required`,
    `hasChildren`, а також підібрані `hint` / `hintPath`.
- `update.run` запускає потік оновлення gateway і планує перезапуск лише тоді,
  коли саме оновлення виконалося успішно.
- `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` надають
  onboarding wizard через WS RPC.

### Наявні основні сімейства

#### Помічники агента та робочого простору

- `agents.list` повертає налаштовані записи агентів.
- `agents.create`, `agents.update` і `agents.delete` керують записами агентів і
  прив’язкою робочого простору.
- `agents.files.list`, `agents.files.get` і `agents.files.set` керують файлами
  робочого простору bootstrap, доступними для агента.
- `agent.identity.get` повертає ефективну ідентичність асистента для агента або сеансу.
- `agent.wait` очікує завершення запуску та повертає термінальний знімок, коли
  він доступний.

#### Керування сеансом

- `sessions.list` повертає поточний індекс сеансів.
- `sessions.subscribe` і `sessions.unsubscribe` вмикають або вимикають підписки
  на події зміни сеансів для поточного WS-клієнта.
- `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають або
  вимикають підписки на події transcript/message для одного сеансу.
- `sessions.preview` повертає обмежені попередні перегляди transcript для
  конкретних ключів сеансу.
- `sessions.resolve` розв’язує або канонікалізує ціль сеансу.
- `sessions.create` створює новий запис сеансу.
- `sessions.send` надсилає повідомлення в наявний сеанс.
- `sessions.steer` — це варіант interrupt-and-steer для активного сеансу.
- `sessions.abort` перериває активну роботу для сеансу.
- `sessions.patch` оновлює метадані/перевизначення сеансу.
- `sessions.reset`, `sessions.delete` і `sessions.compact` виконують
  обслуговування сеансу.
- `sessions.get` повертає повний збережений рядок сеансу.
- виконання chat, як і раніше, використовує `chat.history`, `chat.send`, `chat.abort` і
  `chat.inject`.
- `chat.history` нормалізується для відображення для UI-клієнтів: вбудовані теги
  directives видаляються з видимого тексту, XML payload plain-text tool-call
  (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками tool-call) та витоки ASCII/full-width керувальних токенів
  моделі видаляються, чисті рядки assistant із silent-token, такі як точні
  `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки можуть
  замінюватися placeholder.

#### Pairing пристроїв і токени пристроїв

- `device.pair.list` повертає очікувальні та схвалені paired devices.
- `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують
  записами pairing пристроїв.
- `device.token.rotate` ротує токен paired device в межах схвалених role і
  scope.
- `device.token.revoke` відкликає токен paired device.

#### Pairing вузлів, invoke і відкладена робота

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` і `node.pair.verify` охоплюють pairing вузлів і
  bootstrap verification.
- `node.list` і `node.describe` повертають стан відомих/підключених вузлів.
- `node.rename` оновлює мітку paired node.
- `node.invoke` пересилає команду підключеному вузлу.
- `node.invoke.result` повертає результат для запиту invoke.
- `node.event` переносить події, що походять від вузла, назад у gateway.
- `node.canvas.capability.refresh` оновлює токени canvas-capability з
  обмеженим scope.
- `node.pending.pull` і `node.pending.ack` — це API черги підключеного вузла.
- `node.pending.enqueue` і `node.pending.drain` керують стійкою відкладеною
  роботою для офлайн/відключених вузлів.

#### Сімейства approval

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` і
  `exec.approval.resolve` охоплюють одноразові запити exec approval плюс
  lookup/replay відкладених approval.
- `exec.approval.waitDecision` очікує на один відкладений exec approval і
  повертає остаточне рішення (або `null` у разі тайм-ауту).
- `exec.approvals.get` і `exec.approvals.set` керують знімками політики exec approval
  gateway.
- `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною
  політикою exec approval вузла через relay-команди вузла.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` і `plugin.approval.resolve` охоплюють
  потоки approval, визначені plugin.

#### Інші основні сімейства

- automation:
  - `wake` планує негайне або наступне введення тексту wake на heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Поширені сімейства подій

- `chat`: оновлення UI chat, такі як `chat.inject` та інші події chat, що
  стосуються лише transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для
  сеансу, на який оформлено підписку.
- `sessions.changed`: індекс сеансів або метадані змінилися.
- `presence`: оновлення знімка system presence.
- `tick`: періодична подія keepalive / liveness.
- `health`: оновлення знімка стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни виконання/завдання cron.
- `shutdown`: сповіщення про завершення роботи gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing вузла.
- `node.invoke.request`: трансляція запиту invoke вузла.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл paired-device.
- `voicewake.changed`: змінено конфігурацію тригера wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  exec approval.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  plugin approval.

### Допоміжні методи node

- Nodes можуть викликати `skills.bins`, щоб отримати поточний список виконуваних
  файлів skill для перевірок auto-allow.

### Допоміжні методи operator

- Operators можуть викликати `commands.list` (`operator.read`), щоб отримати
  інвентар команд під час виконання для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати робочий простір
    агента за замовчуванням.
  - `scope` визначає, яку поверхню націлює основна `name`:
    - `text` повертає основний текстовий токен команди без початкового `/`
    - `native` і шлях за замовчуванням `both` повертають native names,
      залежні від провайдера, коли вони доступні
  - `textAliases` містить точні slash-аліаси, такі як `/model` і `/m`.
  - `nativeName` містить native command name, залежне від провайдера, коли воно є.
  - `provider` є необов’язковим і впливає лише на native naming плюс
    доступність native plugin command.
  - `includeArgs=false` прибирає із відповіді серіалізовані метадані аргументів.
- Operators можуть викликати `tools.catalog` (`operator.read`), щоб отримати каталог інструментів під час виконання для
  агента. Відповідь містить згруповані інструменти та метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є plugin tool необов’язковим
- Operators можуть викликати `tools.effective` (`operator.read`), щоб отримати інвентар інструментів, ефективний під час виконання,
  для сеансу.
  - `sessionKey` є обов’язковим.
  - Gateway виводить довірений runtime context із сеансу на стороні сервера,
    замість приймати auth або delivery context, наданий викликачем.
  - Відповідь має scope сеансу й відображає, що активна розмова може
    використовувати просто зараз, включно з core, plugin і channel tools.
- Operators можуть викликати `skills.status` (`operator.read`), щоб отримати
  видимий інвентар skills для агента.
  - `agentId` є необов’язковим; опустіть його, щоб читати робочий простір
    агента за замовчуванням.
  - Відповідь містить eligibility, відсутні вимоги, перевірки config і
    очищені параметри встановлення без розкриття необроблених значень secret.
- Operators можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих виявлення ClawHub.
- Operators можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - Режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    папку skill у каталог `skills/` робочого простору агента за замовчуванням.
  - Режим installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operators можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - Режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    робочому просторі агента за замовчуванням.
  - Режим Config вносить зміни в значення `skills.entries.<skillKey>`, такі як `enabled`,
    `apiKey` і `env`.

## Exec approval

- Коли запит exec потребує approval, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують підтвердження, викликаючи `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має містити `systemRunPlan` (канонічні метадані `argv`/`cwd`/`rawCommand`/сеансу). Запити без `systemRunPlan` відхиляються.
- Після approval переслані виклики `node.invoke system.run` повторно
  використовують цей канонічний `systemRunPlan` як авторитетний контекст
  command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і остаточним пересиланням схваленого `system.run`,
  gateway відхиляє виконання, замість того щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть містити `deliver=true`, щоб запитати outbound delivery.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або лише внутрішні цілі delivery повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє резервний перехід до виконання лише в межах сеансу, коли неможливо розв’язати зовнішній маршрут доставки (наприклад, internal/webchat сеанси або неоднозначні multi-channel config).

## Версіонування

- `PROTOCOL_VERSION` знаходиться в `src/gateway/protocol/schema.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Схеми + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Автентифікація

- Автентифікація gateway зі спільним секретом використовує `connect.params.auth.token` або
  `connect.params.auth.password`, залежно від налаштованого режиму auth.
- Режими з передаванням ідентичності, такі як Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку auth під час connect за
  заголовками запиту, а не через `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` повністю пропускає автентифікацію connect зі спільним секретом; не відкривайте цей режим для публічного/недовіреного ingress.
- Після pairing Gateway видає **токен пристрою** з обмеженням на role + scopes
  підключення. Він повертається в `hello-ok.auth.deviceToken` і має бути
  збережений клієнтом для майбутніх підключень.
- Клієнти повинні зберігати основний `hello-ok.auth.deviceToken` після будь-якого
  успішного підключення.
- Повторне підключення з цим **збереженим** токеном пристрою також має
  повторно використовувати збережений набір схвалених scope для цього токена.
  Це зберігає вже наданий доступ на читання/перевірку/status і запобігає
  тихому звуженню повторних підключень до вужчого неявного scope лише admin.
- Звичайний пріоритет auth під час connect: спочатку явний спільний token/password, потім
  явний `deviceToken`, потім збережений токен для пристрою, потім bootstrap token.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише тоді, коли connect використовував bootstrap auth через
  довірений транспорт, такий як `wss://` або loopback/local pairing.
- Якщо клієнт надає **явний** `deviceToken` або явні `scopes`, цей набір scope,
  запитаний викликачем, залишається авторитетним; кешовані scope повторно
  використовуються лише тоді, коли клієнт повторно використовує збережений токен для пристрою.
- Токени пристрою можна ротувати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача/ротація токенів залишається обмеженою схваленим набором role,
  зафіксованим у записі pairing цього пристрою; ротація токена не може
  розширити пристрій до role, яку pairing approval ніколи не надавав.
- Для сесій токенів paired-device керування пристроєм має власне scope, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть
  видаляти/відкликати/ротувати лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитаний набір scope operator щодо
  поточних scope сесії викликача. Викликачі без admin не можуть ротувати
  токен до ширшого набору scope operator, ніж уже мають.
- Збої auth містять `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном для пристрою.
  - Якщо ця повторна спроба не вдається, клієнти повинні зупинити автоматичні цикли перепідключення та показати вказівки для дій оператора.

## Ідентичність пристрою + pairing

- Nodes повинні включати стабільну ідентичність пристрою (`device.id`), похідну
  від відбитка keypair.
- Gateways видають токени для кожного пристрою + role.
- Для нових device ID потрібні pairing approval, якщо не ввімкнено локальне auto-approval.
- Pairing auto-approval зосереджене на прямих локальних підключеннях local loopback.
- OpenClaw також має вузький backend/container-local шлях self-connect для
  довірених helper-потоків зі спільним секретом.
- Підключення tailnet або LAN з того самого хоста все одно вважаються віддаленими для pairing і
  потребують approval.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може опускати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна автентифікація operator Control UI з `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі підключення мають підписувати наданий сервером nonce `connect.challenge`.

### Діагностика міграції автентифікації пристрою

Для застарілих клієнтів, які все ще використовують поведінку підписування до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                     | details.code                     | details.reason           | Значення                                           |
| -------------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`          | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт пропустив `device.nonce` (або надіслав порожнє значення). |
| `device nonce mismatch`          | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілим/неправильним nonce.     |
| `device signature invalid`       | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload v2.          |
| `device signature expired`       | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`       | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не збігається з відбитком відкритого ключа. |
| `device public key invalid`      | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалося виконати форматування/канонікалізацію відкритого ключа. |

Ціль міграції:

- Завжди очікуйте `connect.challenge`.
- Підписуйте payload v2, який містить nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` і далі приймаються для сумісності, але pinning
  метаданих paired-device усе одно керує політикою команд під час повторного підключення.

## TLS + pinning

- Для WS-підключень підтримується TLS.
- Клієнти за бажанням можуть закріплювати відбиток сертифіката gateway (див. конфігурацію `gateway.tls`
  плюс `gateway.remote.tlsFingerprint` або CLI `--tls-fingerprint`).

## Scope

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначається
схемами TypeBox у `src/gateway/protocol/schema.ts`.
