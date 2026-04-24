---
read_when:
    - 프로토콜 스키마 또는 코드 생성 업데이트하기
summary: Gateway 프로토콜의 단일 정보원으로서의 TypeBox 스키마
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T06:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# Gateway 프로토콜의 단일 정보원으로서의 TypeBox

최종 업데이트: 2026-01-10

TypeBox는 TypeScript 우선 스키마 라이브러리입니다. OpenClaw에서는 이를 사용해 **Gateway
WebSocket 프로토콜**(핸드셰이크, 요청/응답, 서버 이벤트)을 정의합니다. 이 스키마는
**런타임 검증**, **JSON Schema 내보내기**, 그리고 macOS 앱용 **Swift 코드 생성**을 구동합니다.
단일 정보원, 나머지는 모두 생성됩니다.

더 상위 수준의 프로토콜 맥락이 필요하다면
[Gateway architecture](/ko/concepts/architecture)부터 시작하세요.

## 개념 모델(30초)

모든 Gateway WS 메시지는 다음 세 프레임 중 하나입니다.

- **요청**: `{ type: "req", id, method, params }`
- **응답**: `{ type: "res", id, ok, payload | error }`
- **이벤트**: `{ type: "event", event, payload, seq?, stateVersion? }`

첫 번째 프레임은 반드시 `connect` 요청이어야 합니다. 그 이후에는 클라이언트가
메서드(예: `health`, `send`, `chat.send`)를 호출하고 이벤트(예:
`presence`, `tick`, `agent`)를 구독할 수 있습니다.

연결 흐름(최소):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

일반적인 메서드 + 이벤트:

| 범주 | 예시 | 참고 |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| 코어 | `connect`, `health`, `status` | `connect`가 반드시 첫 번째여야 함 |
| 메시징 | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 부작용이 있으면 `idempotencyKey` 필요 |
| 채팅 | `chat.history`, `chat.send`, `chat.abort` | WebChat에서 사용 |
| 세션 | `sessions.list`, `sessions.patch`, `sessions.delete` | 세션 관리 |
| 자동화 | `wake`, `cron.list`, `cron.run`, `cron.runs` | wake + Cron 제어 |
| Node | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + Node 작업 |
| 이벤트 | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | 서버 푸시 |

권위 있는 공개 **discovery** 인벤토리는
`src/gateway/server-methods-list.ts`의 `listGatewayMethods`, `GATEWAY_EVENTS`에 있습니다.

## 스키마 위치

- 소스: `src/gateway/protocol/schema.ts`
- 런타임 검증기(AJV): `src/gateway/protocol/index.ts`
- 공개 기능/discovery 레지스트리: `src/gateway/server-methods-list.ts`
- 서버 핸드셰이크 + 메서드 디스패치: `src/gateway/server.impl.ts`
- Node 클라이언트: `src/gateway/client.ts`
- 생성된 JSON Schema: `dist/protocol.schema.json`
- 생성된 Swift 모델: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 현재 파이프라인

- `pnpm protocol:gen`
  - JSON Schema(draft‑07)를 `dist/protocol.schema.json`에 기록
- `pnpm protocol:gen:swift`
  - Swift gateway 모델 생성
- `pnpm protocol:check`
  - 두 생성기를 모두 실행하고 출력이 커밋되었는지 검증

## 런타임에서 스키마가 사용되는 방식

- **서버 측**: 모든 인바운드 프레임은 AJV로 검증됩니다. 핸드셰이크는
  `params`가 `ConnectParams`와 일치하는 `connect` 요청만 허용합니다.
- **클라이언트 측**: JS 클라이언트는 사용 전에 이벤트 및 응답 프레임을 검증합니다.
- **기능 discovery**: Gateway는 `hello-ok`에서 `listGatewayMethods()` 및
  `GATEWAY_EVENTS`를 기반으로 보수적인 `features.methods`
  및 `features.events` 목록을 전송합니다.
- 이 discovery 목록은
  `coreGatewayHandlers`의 모든 호출 가능한 헬퍼를 자동 생성한 덤프가 아닙니다. 일부 헬퍼 RPC는
  `src/gateway/server-methods/*.ts`에 구현되어 있지만 공개 기능 목록에는
  열거되지 않습니다.

## 프레임 예시

Connect(첫 메시지):

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

Hello-ok 응답:

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

요청 + 응답:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

이벤트:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 최소 클라이언트(Node.js)

가장 작은 유용한 흐름: connect + health.

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

## 실전 예시: 메서드를 엔드투엔드로 추가하기

예시: `{ ok: true, text }`를 반환하는 새 `system.echo` 요청 추가.

1. **스키마(단일 정보원)**

`src/gateway/protocol/schema.ts`에 추가:

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

둘 다 `ProtocolSchemas`에 추가하고 타입을 내보냅니다:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **검증**

`src/gateway/protocol/index.ts`에서 AJV 검증기를 내보냅니다:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **서버 동작**

`src/gateway/server-methods/system.ts`에 핸들러 추가:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

이를 `src/gateway/server-methods.ts`에 등록한 뒤(`systemHandlers`를 이미 병합함),
`src/gateway/server-methods-list.ts`의 `listGatewayMethods` 입력에 `"system.echo"`를 추가하세요.

이 메서드가 operator 또는 Node 클라이언트에서 호출 가능해야 한다면
`src/gateway/method-scopes.ts`에도 분류를 추가해 범위 강제와 `hello-ok` 기능
공개가 일치하도록 하세요.

4. **재생성**

```bash
pnpm protocol:check
```

5. **테스트 + 문서**

`src/gateway/server.*.test.ts`에 서버 테스트를 추가하고 문서에도 메서드를 기록하세요.

## Swift 코드 생성 동작

Swift 생성기는 다음을 생성합니다.

- `req`, `res`, `event`, `unknown` 케이스를 가진 `GatewayFrame` enum
- 강하게 타입 지정된 payload struct/enum
- `ErrorCode` 값과 `GATEWAY_PROTOCOL_VERSION`

알 수 없는 프레임 타입은 전방 호환성을 위해 원시 payload로 보존됩니다.

## 버전 관리 + 호환성

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 전송하며 서버는 불일치를 거부합니다.
- Swift 모델은 오래된 클라이언트가 깨지지 않도록 알 수 없는 프레임 타입을 유지합니다.

## 스키마 패턴 및 관례

- 대부분의 객체는 엄격한 payload를 위해 `additionalProperties: false`를 사용합니다.
- `NonEmptyString`은 ID와 메서드/이벤트 이름의 기본값입니다.
- 최상위 `GatewayFrame`은 `type`에 대한 **discriminator**를 사용합니다.
- 부작용이 있는 메서드는 일반적으로 params에 `idempotencyKey`가 필요합니다
  (예: `send`, `poll`, `agent`, `chat.send`).
- `agent`는 런타임 생성 오케스트레이션 컨텍스트를 위한 선택적 `internalEvents`를 받을 수 있습니다
  (예: subagent/Cron 작업 완료 핸드오프). 이는 내부 API 표면으로 취급하세요.

## 라이브 스키마 JSON

생성된 JSON Schema는 저장소의 `dist/protocol.schema.json`에 있습니다. 게시된
raw 파일은 일반적으로 다음 위치에서 사용할 수 있습니다.

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 스키마를 변경할 때

1. TypeBox 스키마를 업데이트합니다.
2. `src/gateway/server-methods-list.ts`에 메서드/이벤트를 등록합니다.
3. 새 RPC에 operator 또는
   Node 범위 분류가 필요하면 `src/gateway/method-scopes.ts`를 업데이트합니다.
4. `pnpm protocol:check`를 실행합니다.
5. 재생성된 스키마 + Swift 모델을 커밋합니다.

## 관련 항목

- [Rich output protocol](/ko/reference/rich-output-protocol)
- [RPC adapters](/ko/reference/rpc)
