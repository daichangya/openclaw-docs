---
read_when:
    - Оновлення схем протоколу або codegen
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-23T22:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox як єдине джерело істини для протоколу

Останнє оновлення: 2026-01-10

TypeBox — це бібліотека схем із пріоритетом TypeScript. Ми використовуємо її для визначення **WebSocket-протоколу Gateway** (handshake, request/response, події сервера). Ці схеми керують **валідацією під час виконання**, **експортом JSON Schema** і **Swift codegen** для застосунку macOS. Одне джерело істини; усе інше генерується.

Якщо вам потрібен контекст протоколу на вищому рівні, почніть із
[архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне WS-повідомлення Gateway — це один із трьох фреймів:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший фрейм **має** бути request `connect`. Після цього клієнти можуть викликати
методи (наприклад, `health`, `send`, `chat.send`) і підписуватися на події (наприклад,
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

Поширені методи та події:

| Категорія   | Приклади                                                   | Примітки                           |
| ----------- | ---------------------------------------------------------- | ---------------------------------- |
| Core        | `connect`, `health`, `status`                              | `connect` має бути першим          |
| Обмін повідомленнями | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | побічні ефекти потребують `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | Це використовує WebChat            |
| Сесії       | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сесій              |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`             | керування wake і cron              |
| Node        | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії Node              |
| Події       | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push із сервера                    |

Авторитетний оголошуваний інвентар **discovery** міститься в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де містяться схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Валідатори runtime (AJV): `src/gateway/protocol/index.ts`
- Реєстр оголошуваних можливостей/discovery: `src/gateway/server-methods-list.ts`
- Handshake сервера та диспетчеризація методів: `src/gateway/server.impl.ts`
- Клієнт Node: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані моделі Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний конвеєр

- `pnpm protocol:gen`
  - записує JSON Schema (draft‑07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує Swift-моделі Gateway
- `pnpm protocol:check`
  - запускає обидва генератори та перевіряє, що результат закомічено

## Як схеми використовуються під час виконання

- **На боці сервера**: кожен вхідний фрейм перевіряється через AJV. Handshake
  приймає лише request `connect`, параметри якого відповідають `ConnectParams`.
- **На боці клієнта**: JS-клієнт перевіряє фрейми подій і відповідей перед
  використанням.
- **Виявлення можливостей**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` із `listGatewayMethods()` та
  `GATEWAY_EVENTS`.
- Цей список discovery — не згенерований дамп усіх допоміжних викликів, які можна викликати, у
  `coreGatewayHandlers`; деякі допоміжні RPC реалізовані в
  `src/gateway/server-methods/*.ts` без переліку в оголошуваному
  списку можливостей.

## Приклади фреймів

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

Request і response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Подія:

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

## Покроковий приклад: додавання методу end-to-end

Приклад: додати новий request `system.echo`, який повертає `{ ok: true, text }`.

1. **Схема (джерело істини)**

Додайте в `src/gateway/protocol/schema.ts`:

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

Додайте обидві схеми до `ProtocolSchemas` і експортуйте типи:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Валідація**

У `src/gateway/protocol/index.ts` експортуйте валідатор AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Поведінка сервера**

Додайте handler у `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зареєструйте його в `src/gateway/server-methods.ts` (там уже об’єднуються `systemHandlers`),
потім додайте `"system.echo"` до вхідних даних `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо метод може викликатися оператором або клієнтами Node, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб перевірка scope та оголошення можливостей у `hello-ok`
залишалися узгодженими.

4. **Повторна генерація**

```bash
pnpm protocol:check
```

5. **Тести та документація**

Додайте серверний тест у `src/gateway/server.*.test.ts` і згадайте метод у документації.

## Поведінка Swift codegen

Генератор Swift створює:

- enum `GatewayFrame` із варіантами `req`, `res`, `event` і `unknown`
- строго типізовані структури/enum-и payload
- значення `ErrorCode` і `GATEWAY_PROTOCOL_VERSION`

Невідомі типи фреймів зберігаються як сирі payload-и для прямої сумісності.

## Версіонування та сумісність

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє несумісності.
- Swift-моделі зберігають невідомі типи фреймів, щоб не ламати старі клієнти.

## Шаблони й домовленості для схем

- Більшість об’єктів використовують `additionalProperties: false` для строгих payload.
- `NonEmptyString` — типовий варіант для ID та назв методів/подій.
- Верхньорівневий `GatewayFrame` використовує **discriminator** за полем `type`.
- Методи з побічними ефектами зазвичай потребують `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов’язкові `internalEvents` для контексту оркестрації, згенерованого runtime
  (наприклад, передача завершення завдання субагента/cron); розглядайте це як внутрішню поверхню API.

## Жива схема JSON

Згенерована JSON Schema міститься в репозиторії за шляхом `dist/protocol.schema.json`. Опублікований
сирий файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox.
2. Зареєструйте метод/подію в `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новому RPC потрібна класифікація scope оператора або
   Node.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте повторно згенеровану схему та Swift-моделі.

## Пов’язане

- [Протокол rich output](/uk/reference/rich-output-protocol)
- [RPC-адаптери](/uk/reference/rpc)
