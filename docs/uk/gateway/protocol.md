---
read_when:
    - Реалізація або оновлення клієнтів gateway WS
    - Налагодження невідповідностей протоколу або збоїв підключення
    - Повторна генерація схеми/моделей протоколу
summary: 'Протокол Gateway WebSocket: handshake, frame, версіонування'
title: Протокол Gateway
x-i18n:
    generated_at: "2026-04-05T18:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Протокол Gateway (WebSocket)

Протокол Gateway WS — це **єдина керуюча площина + транспорт node** для
OpenClaw. Усі клієнти (CLI, web UI, застосунок macOS, iOS/Android node, headless
node) підключаються через WebSocket і оголошують свої **role** + **scope** під час
handshake.

## Транспорт

- WebSocket, текстові frame з JSON payload.
- Перший frame **обов’язково** має бути request `connect`.

## Handshake (connect)

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

Під час вбудованого передавання довіреного bootstrap `hello-ok.auth` також може містити додаткові
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

Для вбудованого потоку bootstrap node/operator основний токен node зберігає
`scopes: []`, а будь-який переданий токен operator залишається обмеженим
bootstrap allowlist для operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Перевірки bootstrap scope залишаються
role-prefixed: записи operator задовольняють лише запити operator, а ролі, що не є operator,
усе ще потребують scope під власним префіксом role.

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

## Формат frame

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methods із побічними ефектами потребують **ключів ідемпотентності** (див. schema).

## Roles + scopes

### Roles

- `operator` = клієнт керуючої площини (CLI/UI/automation).
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

Gateway RPC methods, зареєстровані plugin, можуть запитувати власний scope operator, але
зарезервовані core admin-префікси (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди зіставляються з `operator.admin`.

Scope method — лише перший бар’єр. Деякі slash-команди, доступні через
`chat.send`, поверх цього застосовують суворіші перевірки на рівні команд. Наприклад, постійні
записи `/config set` і `/config unset` потребують `operator.admin`.

`node.pair.approve` також має додаткову перевірку scope під час схвалення поверх
базового scope method:

- запити без команд: `operator.pairing`
- запити з командами node, що не є exec: `operator.pairing` + `operator.write`
- запити, які включають `system.run`, `system.run.prepare` або `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node оголошують claims можливостей під час connect:

- `caps`: високорівневі категорії можливостей.
- `commands`: allowlist команд для invoke.
- `permissions`: детальні перемикачі (наприклад `screen.record`, `camera.capture`).

Gateway трактує їх як **claims** і примусово застосовує allowlist на боці сервера.

## Presence

- `system-presence` повертає записи, прив’язані до ідентичності пристрою.
- Записи presence містять `deviceId`, `roles` і `scopes`, щоб UI могли показувати один рядок на пристрій,
  навіть коли він підключається і як **operator**, і як **node**.

## Поширені сімейства RPC method

Ця сторінка не є згенерованим повним дампом, але публічна поверхня WS є ширшою
за наведені вище приклади handshake/auth. Ось основні сімейства methods, які
Gateway надає сьогодні.

`hello-ok.features.methods` — це консервативний список discovery, побудований з
`src/gateway/server-methods-list.ts` плюс експортів method завантажених plugins/каналів.
Ставтеся до нього як до discovery можливостей, а не як до згенерованого дампу кожного callable helper,
реалізованого в `src/gateway/server-methods/*.ts`.

### System та identity

- `health` повертає кешований або щойно перевірений snapshot стану gateway.
- `status` повертає зведення gateway у стилі `/status`; чутливі поля
  включаються лише для клієнтів operator зі scope admin.
- `gateway.identity.get` повертає ідентичність пристрою gateway, яка використовується в relay і
  потоках pairing.
- `system-presence` повертає поточний snapshot presence для підключених
  пристроїв operator/node.
- `system-event` додає system event і може оновлювати/транслювати контекст
  presence.
- `last-heartbeat` повертає останній збережений heartbeat event.
- `set-heartbeats` перемикає обробку heartbeat на gateway.

### Models та usage

- `models.list` повертає runtime allowlist каталогу моделей.
- `usage.status` повертає зведення usage вікон/залишку квоти провайдера.
- `usage.cost` повертає агреговані зведення вартості за діапазон дат.
- `doctor.memory.status` повертає готовність vector-memory / embedding для
  активного workspace типового агента.
- `sessions.usage` повертає зведення usage по сесіях.
- `sessions.usage.timeseries` повертає timeseries usage для однієї сесії.
- `sessions.usage.logs` повертає записи журналу usage для однієї сесії.

### Channels та helper для login

- `channels.status` повертає зведення стану вбудованих + bundled каналів/plugins.
- `channels.logout` виконує logout для конкретного каналу/облікового запису там, де канал
  підтримує logout.
- `web.login.start` запускає потік login через QR/web для поточного провайдера web-каналу з підтримкою QR.
- `web.login.wait` очікує завершення цього потоку login через QR/web і запускає
  канал у разі успіху.
- `push.test` надсилає тестовий APNs push на зареєстрований iOS node.
- `voicewake.get` повертає збережені тригери wake-word.
- `voicewake.set` оновлює тригери wake-word і транслює зміну.

### Messaging та logs

- `send` — це RPC прямої вихідної доставки для надсилань із прив’язкою до
  каналу/облікового запису/thread поза chat runner.
- `logs.tail` повертає tail налаштованого file-log gateway з cursor/limit і
  контролем максимального розміру в байтах.

### Talk та TTS

- `talk.config` повертає effective payload конфігурації Talk; для `includeSecrets`
  потрібен `operator.talk.secrets` (або `operator.admin`).
- `talk.mode` задає/транслює поточний стан режиму Talk для клієнтів WebChat/Control UI.
- `talk.speak` синтезує мовлення через активний провайдер мовлення Talk.
- `tts.status` повертає стан увімкнення TTS, активного провайдера, резервних провайдерів
  і стан конфігурації провайдера.
- `tts.providers` повертає видимий inventory провайдерів TTS.
- `tts.enable` і `tts.disable` перемикають стан налаштувань TTS.
- `tts.setProvider` оновлює бажаного провайдера TTS.
- `tts.convert` виконує одноразове перетворення тексту в мовлення.

### Secrets, config, update та wizard

- `secrets.reload` повторно визначає активні SecretRef і замінює runtime secret state
  лише за умови повного успіху.
- `secrets.resolve` визначає призначення secret для команд для конкретного набору command/target.
- `config.get` повертає поточний snapshot конфігурації та hash.
- `config.set` записує валідований payload конфігурації.
- `config.patch` об’єднує часткове оновлення конфігурації.
- `config.apply` перевіряє + замінює весь payload конфігурації.
- `config.schema` повертає live payload schema конфігурації, який використовують Control UI і
  інструменти CLI: schema, `uiHints`, версію та метадані генерації, включно з
  метаданими schema plugins + каналів, коли runtime може їх завантажити. Schema
  містить метадані полів `title` / `description`, отримані з тих самих label
  і довідкового тексту, які використовує UI, включно з вкладеними об’єктами,
  wildcard, елементами масиву та гілками композиції `anyOf` / `oneOf` / `allOf`, коли
  існує відповідна документація полів.
- `config.schema.lookup` повертає payload lookup для одного шляху конфігурації:
  нормалізований шлях, неглибокий вузол schema, зіставлені `hint` + `hintPath` і
  зведення безпосередніх дочірніх елементів для drill-down у UI/CLI.
  - Вузли lookup schema зберігають документацію для користувача й типові поля валідації:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    числові/рядкові/масивні/об’єктні межі та boolean-прапорці на кшталт
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Зведення дочірніх елементів відкривають `key`, нормалізований `path`, `type`, `required`,
    `hasChildren`, а також зіставлені `hint` / `hintPath`.
- `update.run` запускає потік оновлення gateway і планує перезапуск лише коли
  саме оновлення завершилося успішно.
- `wizard.start`, `wizard.next`, `wizard.status` і `wizard.cancel` відкривають
  onboarding wizard через WS RPC.

### Наявні основні сімейства

#### Agent та helper workspace

- `agents.list` повертає налаштовані записи агентів.
- `agents.create`, `agents.update` і `agents.delete` керують записами агентів і
  прив’язкою workspace.
- `agents.files.list`, `agents.files.get` і `agents.files.set` керують
  bootstrap-файлами workspace, відкритими для агента.
- `agent.identity.get` повертає effective identity асистента для агента або
  сесії.
- `agent.wait` чекає завершення запуску й повертає фінальний snapshot, коли він
  доступний.

#### Керування сесіями

- `sessions.list` повертає поточний індекс сесій.
- `sessions.subscribe` і `sessions.unsubscribe` вмикають/вимикають
  підписки на події змін сесії для поточного WS-клієнта.
- `sessions.messages.subscribe` і `sessions.messages.unsubscribe` вмикають/вимикають
  підписки на події transcript/message для однієї сесії.
- `sessions.preview` повертає обмежені прев’ю transcript для конкретних ключів сесій.
- `sessions.resolve` визначає або канонізує ціль сесії.
- `sessions.create` створює новий запис сесії.
- `sessions.send` надсилає повідомлення в наявну сесію.
- `sessions.steer` — це варіант interrupt-and-steer для активної сесії.
- `sessions.abort` перериває активну роботу для сесії.
- `sessions.patch` оновлює метадані/перевизначення сесії.
- `sessions.reset`, `sessions.delete` і `sessions.compact` виконують
  обслуговування сесії.
- `sessions.get` повертає повний збережений рядок сесії.
- виконання chat усе ще використовує `chat.history`, `chat.send`, `chat.abort` і
  `chat.inject`.
- `chat.history` нормалізується для відображення клієнтам UI: inline directive tags
  прибираються з видимого тексту, plain-text payload XML викликів інструментів (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів) та витоки ASCII/full-width керівних токенів моделі прибираються,
  чисті рядки асистента з тихими токенами на кшталт точних `NO_REPLY` /
  `no_reply` пропускаються, а надто великі рядки можуть замінюватися placeholder.

#### Pairing пристроїв і токени пристроїв

- `device.pair.list` повертає пристрої pairing, які очікують схвалення, і вже схвалені.
- `device.pair.approve`, `device.pair.reject` і `device.pair.remove` керують
  записами pairing пристроїв.
- `device.token.rotate` обертає токен спареного пристрою в межах затверджених role
  і scope.
- `device.token.revoke` відкликає токен спареного пристрою.

#### Pairing node, invoke і pending work

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` і `node.pair.verify` покривають pairing node та bootstrap
  verification.
- `node.list` і `node.describe` повертають стан відомих/підключених node.
- `node.rename` оновлює label спареного node.
- `node.invoke` пересилає команду підключеному node.
- `node.invoke.result` повертає результат для запиту invoke.
- `node.event` переносить події походженням із node назад у gateway.
- `node.canvas.capability.refresh` оновлює токени canvas-capability з обмеженим scope.
- `node.pending.pull` і `node.pending.ack` — це API черги для підключених node.
- `node.pending.enqueue` і `node.pending.drain` керують durable pending work
  для offline/disconnected node.

#### Сімейства approval

- `exec.approval.request` і `exec.approval.resolve` покривають одноразові
  запити на approval exec.
- `exec.approval.waitDecision` очікує рішення по одному pending approval exec і повертає
  фінальне рішення (або `null` у разі timeout).
- `exec.approvals.get` і `exec.approvals.set` керують snapshot політики approval exec gateway.
- `exec.approvals.node.get` і `exec.approvals.node.set` керують локальною політикою approval exec node
  через relay-команди node.
- `plugin.approval.request`, `plugin.approval.waitDecision` і
  `plugin.approval.resolve` покривають потоки approval, визначені plugin.

#### Інші основні сімейства

- automation:
  - `wake` планує негайну або на наступний heartbeat ін’єкцію тексту wake
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Поширені сімейства event

- `chat`: оновлення UI chat на кшталт `chat.inject` та інших подій chat лише для transcript.
- `session.message` і `session.tool`: оновлення transcript/event-stream для
  підписаної сесії.
- `sessions.changed`: змінився індекс або метадані сесій.
- `presence`: оновлення snapshot system presence.
- `tick`: періодичний keepalive / event живості.
- `health`: оновлення snapshot стану gateway.
- `heartbeat`: оновлення потоку подій heartbeat.
- `cron`: подія зміни запуску/завдання cron.
- `shutdown`: сповіщення про вимкнення gateway.
- `node.pair.requested` / `node.pair.resolved`: життєвий цикл pairing node.
- `node.invoke.request`: трансляція запиту invoke node.
- `device.pair.requested` / `device.pair.resolved`: життєвий цикл спарених пристроїв.
- `voicewake.changed`: змінилася конфігурація тригерів wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: життєвий цикл
  approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: життєвий цикл
  approval plugin.

### Helper methods для node

- Node можуть викликати `skills.bins`, щоб отримати поточний список виконуваних файлів skill
  для автоматичних allow-перевірок.

### Helper methods для operator

- Operator можуть викликати `tools.catalog` (`operator.read`), щоб отримати runtime-каталог інструментів для
  агента. Відповідь включає згруповані інструменти й метадані походження:
  - `source`: `core` або `plugin`
  - `pluginId`: власник plugin, коли `source="plugin"`
  - `optional`: чи є інструмент plugin необов’язковим
- Operator можуть викликати `tools.effective` (`operator.read`), щоб отримати runtime-effective
  inventory інструментів для сесії.
  - `sessionKey` обов’язковий.
  - Gateway виводить довірений runtime-контекст із сесії на боці сервера замість приймати
    auth або контекст доставки, надані викликачем.
  - Відповідь прив’язана до сесії та відображає те, що активна розмова може використовувати просто зараз,
    включно з core, plugin і channel tools.
- Operator можуть викликати `skills.status` (`operator.read`), щоб отримати видимий
  inventory skill для агента.
  - `agentId` необов’язковий; не вказуйте його, щоб читати workspace типового агента.
  - Відповідь включає eligibility, відсутні вимоги, перевірки config і
    очищені параметри install без розкриття сирих значень secret.
- Operator можуть викликати `skills.search` і `skills.detail` (`operator.read`) для
  метаданих discovery ClawHub.
- Operator можуть викликати `skills.install` (`operator.admin`) у двох режимах:
  - режим ClawHub: `{ source: "clawhub", slug, version?, force? }` встановлює
    теку skill до каталогу `skills/` workspace типового агента.
  - режим installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    запускає оголошену дію `metadata.openclaw.install` на хості gateway.
- Operator можуть викликати `skills.update` (`operator.admin`) у двох режимах:
  - режим ClawHub оновлює один відстежуваний slug або всі відстежувані встановлення ClawHub у
    workspace типового агента.
  - режим Config оновлює значення `skills.entries.<skillKey>`, як-от `enabled`,
    `apiKey` і `env`.

## Approval exec

- Коли запит exec потребує approval, gateway транслює `exec.approval.requested`.
- Клієнти operator виконують resolve через виклик `exec.approval.resolve` (потрібен scope `operator.approvals`).
- Для `host=node` `exec.approval.request` має включати `systemRunPlan` (канонічні `argv`/`cwd`/`rawCommand`/метадані сесії). Запити без `systemRunPlan` відхиляються.
- Після схвалення переслані виклики `node.invoke system.run` повторно використовують цей канонічний
  `systemRunPlan` як авторитетний контекст command/cwd/session.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` між prepare і фінальним пересиланням схваленого `system.run`, gateway
  відхиляє запуск замість того, щоб довіряти зміненому payload.

## Резервна доставка агента

- Запити `agent` можуть включати `deliver=true`, щоб запитувати вихідну доставку.
- `bestEffortDeliver=false` зберігає сувору поведінку: нерозв’язані або внутрішні цілі доставки повертають `INVALID_REQUEST`.
- `bestEffortDeliver=true` дозволяє повертатися до виконання лише в межах сесії, коли неможливо визначити зовнішній маршрут доставки (наприклад, внутрішні/webchat сесії або неоднозначні конфігурації з кількома каналами).

## Версіонування

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Schemas + моделі генеруються з визначень TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Автентифікація gateway через спільний secret використовує `connect.params.auth.token` або
  `connect.params.auth.password` залежно від налаштованого режиму auth.
- Режими з ідентичністю, як-от Tailscale Serve
  (`gateway.auth.allowTailscale: true`) або не-loopback
  `gateway.auth.mode: "trusted-proxy"`, задовольняють перевірку auth connect із
  заголовків запиту, а не з `connect.params.auth.*`.
- Приватний ingress `gateway.auth.mode: "none"` повністю пропускає auth connect через спільний secret;
  не відкривайте цей режим на публічному/недовіреному ingress.
- Після pairing Gateway видає **токен пристрою** з прив’язкою до role + scopes підключення. Він повертається в `hello-ok.auth.deviceToken`, і клієнт має
  зберегти його для майбутніх підключень.
- Клієнти мають зберігати основний `hello-ok.auth.deviceToken` після кожного
  успішного connect.
- Повторне підключення з цим **збереженим** токеном пристрою також має повторно використовувати збережений
  набір схвалених scope для цього токена. Це зберігає вже наданий доступ для read/probe/status
  і запобігає тихому звуженню повторних підключень до
  вужчого неявного admin-only scope.
- Звичайний порядок пріоритету auth для connect: спершу явний спільний token/password,
  потім явний `deviceToken`, потім збережений токен для конкретного пристрою, потім bootstrap token.
- Додаткові записи `hello-ok.auth.deviceTokens` — це токени передавання bootstrap.
  Зберігайте їх лише коли connect використовував bootstrap auth на довіреному транспорті,
  як-от `wss://` або loopback/local pairing.
- Якщо клієнт передає **явний** `deviceToken` або явні `scopes`, цей набір scope, запитаний викликачем, залишається авторитетним; кешовані scope повторно використовуються лише коли клієнт повторно використовує збережений токен для конкретного пристрою.
- Токени пристроїв можна обертати/відкликати через `device.token.rotate` і
  `device.token.revoke` (потрібен scope `operator.pairing`).
- Видача/обертання токенів залишається обмеженою затвердженим набором role, записаним у
  записі pairing цього пристрою; обертання токена не може розширити пристрій до
  role, яку схвалення pairing ніколи не дозволяло.
- Для сесій токенів спарених пристроїв керування пристроєм обмежене самим пристроєм, якщо
  викликач також не має `operator.admin`: викликачі без admin можуть видаляти/відкликати/обертати
  лише **власний** запис пристрою.
- `device.token.rotate` також перевіряє запитуваний набір scope operator щодо
  поточних scope сесії викликача. Викликачі без admin не можуть обертати токен до
  ширшого набору scope operator, ніж той, який уже мають.
- Помилки auth включають `error.details.code` плюс підказки для відновлення:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Поведінка клієнта для `AUTH_TOKEN_MISMATCH`:
  - Довірені клієнти можуть виконати одну обмежену повторну спробу із кешованим токеном для конкретного пристрою.
  - Якщо ця повторна спроба не вдається, клієнти мають зупинити автоматичні цикли перепідключення й показати оператору вказівки для подальших дій.

## Ідентичність пристрою + pairing

- Node мають включати стабільну ідентичність пристрою (`device.id`), похідну від
  відбитка keypair.
- Gateway видає токени для кожного пристрою + role.
- Для нових `device.id` потрібні схвалення pairing, якщо не ввімкнено локальне автоматичне схвалення.
- Автоматичне схвалення pairing зосереджене на прямих локальних loopback-підключеннях.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених helper-потоків зі спільним secret.
- Підключення з tailnet або LAN на тому самому хості все одно вважаються віддаленими для pairing і
  потребують схвалення.
- Усі WS-клієнти мають включати ідентичність `device` під час `connect` (operator + node).
  Control UI може не вказувати її лише в таких режимах:
  - `gateway.controlUi.allowInsecureAuth=true` для сумісності з небезпечним HTTP лише на localhost.
  - успішна auth operator у `gateway.auth.mode: "trusted-proxy"` для Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (аварійний режим, серйозне зниження безпеки).
- Усі підключення мають підписувати nonce `connect.challenge`, наданий сервером.

### Діагностика міграції auth пристрою

Для застарілих клієнтів, які все ще використовують поведінку підпису до challenge, `connect` тепер повертає
коди деталей `DEVICE_AUTH_*` у `error.details.code` зі стабільним `error.details.reason`.

Поширені збої міграції:

| Повідомлення                 | details.code                     | details.reason           | Значення                                            |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Клієнт не передав `device.nonce` (або передав порожнє значення). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Клієнт підписав застарілий/неправильний nonce.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload підпису не відповідає payload версії v2.    |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Підписана мітка часу виходить за межі дозволеного зсуву. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` не відповідає відбитку public key.      |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Не вдалася перевірка формату/канонізації public key. |

Ціль міграції:

- Завжди чекайте на `connect.challenge`.
- Підписуйте payload v2, який включає nonce сервера.
- Надсилайте той самий nonce у `connect.params.device.nonce`.
- Бажаний payload підпису — `v3`, який прив’язує `platform` і `deviceFamily`
  на додачу до полів device/client/role/scopes/token/nonce.
- Застарілі підписи `v2` усе ще приймаються для сумісності, але pinning метаданих
  спареного пристрою все одно керує політикою команд при повторному підключенні.

## TLS + pinning

- Для WS-підключень підтримується TLS.
- Клієнти можуть необов’язково виконувати pinning відбитка сертифіката gateway (див. конфігурацію `gateway.tls`, а також `gateway.remote.tlsFingerprint` або прапорець CLI `--tls-fingerprint`).

## Область дії

Цей протокол відкриває **повний API gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals тощо). Точна поверхня визначена
схемами TypeBox у `src/gateway/protocol/schema.ts`.
