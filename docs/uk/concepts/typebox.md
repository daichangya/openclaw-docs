---
read_when:
    - Оновлення схем протоколу або codegen
summary: Схеми TypeBox як єдине джерело істини для протоколу gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T18:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox як джерело істини для протоколу

Останнє оновлення: 2026-01-10

TypeBox — це бібліотека схем із підходом TypeScript-first. Ми використовуємо її для визначення **протоколу Gateway WebSocket** (handshake, request/response, server events). Ці схеми керують **runtime validation**, **експортом JSON Schema** і **Swift codegen** для застосунку macOS. Одне джерело істини; усе інше генерується.

Якщо вам потрібен контекст протоколу на вищому рівні, почніть із
[Архітектура Gateway](/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне WS-повідомлення Gateway — це один із трьох frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший frame **обов’язково** має бути request `connect`. Після цього клієнти можуть викликати
methods (наприклад `health`, `send`, `chat.send`) і підписуватися на events (наприклад
`presence`, `tick`, `agent`).

Потік з’єднання (мінімальний):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Поширені methods + events:

| Категорія  | Приклади                                                   | Примітки                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` має бути першим          |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | для side-effects потрібен `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | це використовує WebChat            |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сесій              |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron              |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії node              |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push від сервера                   |

Авторитетний advertised inventory для **discovery** розміщено в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де живуть схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- Advertised feature/discovery registry: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані моделі Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний pipeline

- `pnpm protocol:gen`
  - записує JSON Schema (draft‑07) до `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує моделі gateway для Swift
- `pnpm protocol:check`
  - запускає обидва генератори й перевіряє, що результат закомічено

## Як схеми використовуються в runtime

- **На боці сервера**: кожен вхідний frame перевіряється через AJV. Handshake приймає лише
  request `connect`, у якого params відповідають `ConnectParams`.
- **На боці клієнта**: JS-клієнт перевіряє event і response frame перед
  використанням.
- **Feature discovery**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` і
  `GATEWAY_EVENTS`.
- Цей список discovery не є згенерованим дампом кожного callable helper у
  `coreGatewayHandlers`; деякі helper RPC реалізовано в
  `src/gateway/server-methods/*.ts`, але вони не перераховані в advertised
  feature list.

## Приклади frame

Connect (перше повідомлення):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Відповідь hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Мінімальний клієнт (Node.js)

Найменший корисний потік: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Повний приклад: додавання method end-to-end

Приклад: додайте новий request `system.echo`, який повертає `{ ok: true, text }`.

1. **Schema (джерело істини)**

Додайте до `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Додайте обидві до `ProtocolSchemas` і експортуйте типи:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

У `src/gateway/protocol/index.ts` експортуйте AJV validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Поведінка сервера**

Додайте handler до `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зареєструйте його в `src/gateway/server-methods.ts` (там уже об’єднуються `systemHandlers`),
потім додайте `"system.echo"` до входу `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо method можна викликати клієнтам operator або node, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб перевірка scope і advertised feature у `hello-ok`
залишалися узгодженими.

4. **Повторна генерація**

```bash
pnpm protocol:check
```

5. **Тести + документація**

Додайте server test у `src/gateway/server.*.test.ts` і згадайте method у документації.

## Поведінка Swift codegen

Генератор Swift випускає:

- enum `GatewayFrame` із case `req`, `res`, `event` і `unknown`
- строго типізовані struct/enum для payload
- значення `ErrorCode` і `GATEWAY_PROTOCOL_VERSION`

Невідомі типи frame зберігаються як сирі payload для прямої сумісності.

## Версіонування + сумісність

- `PROTOCOL_VERSION` розміщено в `src/gateway/protocol/schema.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Моделі Swift зберігають невідомі типи frame, щоб не ламати старіших клієнтів.

## Шаблони й конвенції схем

- Більшість об’єктів використовують `additionalProperties: false` для строгих payload.
- `NonEmptyString` — типове значення для ID і назв method/event.
- Верхньорівневий `GatewayFrame` використовує **discriminator** за полем `type`.
- Methods із side effects зазвичай вимагають `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов’язкові `internalEvents` для runtime-generated контексту оркестрації
  (наприклад передавання завершення завдання subagent/cron); вважайте це внутрішньою API-поверхнею.

## Live schema JSON

Згенерована JSON Schema міститься в репозиторії за адресою `dist/protocol.schema.json`. Опублікований
raw-файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox.
2. Зареєструйте method/event у `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новому RPC потрібна класифікація scope для operator або
   node.
4. Виконайте `pnpm protocol:check`.
5. Закомітьте повторно згенеровану schema + моделі Swift.
