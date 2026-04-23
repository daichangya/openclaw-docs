---
read_when:
    - gateway WS 클라이언트를 구현하거나 업데이트하고 있습니다
    - 프로토콜 불일치 또는 연결 실패를 디버깅하고 있습니다
    - 프로토콜 스키마/모델을 재생성하고 있습니다
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-04-23T06:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway 프로토콜(WebSocket)

Gateway WS 프로토콜은 OpenClaw의 **단일 제어 플레인 + Node 전송 계층**입니다.
모든 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android Node, 헤드리스
Node)는 WebSocket을 통해 연결하고, 핸드셰이크 시점에 자신의 **역할** + **범위**를 선언합니다.

## 전송 계층

- WebSocket, JSON payload를 사용하는 텍스트 프레임.
- 첫 번째 프레임은 **반드시** `connect` 요청이어야 합니다.
- 연결 전 프레임은 64 KiB로 제한됩니다. 성공적인 핸드셰이크 이후에는 클라이언트가
  `hello-ok.policy.maxPayload` 및
  `hello-ok.policy.maxBufferedBytes` 제한을 따라야 합니다. 진단 기능이 활성화되면,
  과도하게 큰 인바운드 프레임과 느린 아웃바운드 버퍼는 gateway가 해당 프레임을 닫거나 드롭하기 전에
  `payload.large` 이벤트를 내보냅니다. 이러한 이벤트는
  크기, 제한, 표면, 안전한 사유 코드를 유지합니다. 메시지 본문,
  첨부 파일 내용, 원시 프레임 본문, 토큰, 쿠키 또는 비밀 값은 유지하지 않습니다.

## 핸드셰이크(connect)

Gateway → 클라이언트(연결 전 챌린지):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

클라이언트 → Gateway:

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

Gateway → 클라이언트:

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

`server`, `features`, `snapshot`, `policy`는 모두 스키마에서 필수입니다
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl`은 선택 사항입니다. `auth`는
사용 가능한 경우 협상된 역할/범위를 보고하며, gateway가 발급한 경우
`deviceToken`도 포함합니다.

디바이스 토큰이 발급되지 않더라도 `hello-ok.auth`는 여전히 협상된
권한을 보고할 수 있습니다:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

디바이스 토큰이 발급되면 `hello-ok`는 다음도 포함합니다:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰된 부트스트랩 핸드오프 중에는 `hello-ok.auth`에 추가적인
범위 제한 역할 항목이 `deviceTokens`로 포함될 수도 있습니다:

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

내장 Node/operator 부트스트랩 흐름의 경우, 기본 Node 토큰은 계속
`scopes: []`를 유지하고, 핸드오프된 모든 operator 토큰은 계속
부트스트랩 operator 허용 목록(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`)으로 제한됩니다. 부트스트랩 범위 검사는 계속
역할 접두사 기반으로 유지됩니다. operator 항목은 operator 요청만 충족하며, non-operator
역할은 여전히 자체 역할 접두사 아래 범위가 필요합니다.

### Node 예시

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

## 프레이밍

- **요청**: `{type:"req", id, method, params}`
- **응답**: `{type:"res", id, ok, payload|error}`
- **이벤트**: `{type:"event", event, payload, seq?, stateVersion?}`

부수 효과가 있는 메서드는 **idempotency key**가 필요합니다(스키마 참조).

## 역할 + 범위

### 역할

- `operator` = 제어 플레인 클라이언트(CLI/UI/자동화).
- `node` = 기능 호스트(camera/screen/canvas/system.run).

### 범위(operator)

일반적인 범위:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`가 포함된 `talk.config`는 `operator.talk.secrets`
(또는 `operator.admin`)가 필요합니다.

Plugin에 등록된 gateway RPC 메서드는 자체 operator 범위를
요청할 수 있지만, 예약된 핵심 관리자 접두사(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 항상 `operator.admin`으로 확인됩니다.

메서드 범위는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 도달하는 일부 슬래시 명령은
여기에 더해 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어, 영구적인
`/config set` 및 `/config unset` 쓰기에는 `operator.admin`이 필요합니다.

`node.pair.approve`도 기본 메서드 범위 위에 추가 승인 시점 범위 검사를 가집니다:

- 명령 없는 요청: `operator.pairing`
- non-exec Node 명령이 있는 요청: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, `system.which`가 포함된 요청:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions(node)

Node는 연결 시 기능 주장값을 선언합니다:

- `caps`: 상위 수준 기능 범주.
- `commands`: invoke용 명령 허용 목록.
- `permissions`: 세부 토글(예: `screen.record`, `camera.capture`).

Gateway는 이를 **주장값**으로 취급하고 서버 측 허용 목록을 적용합니다.

## Presence

- `system-presence`는 디바이스 ID를 키로 하는 항목을 반환합니다.
- Presence 항목에는 `deviceId`, `roles`, `scopes`가 포함되어 UI가
  **operator**와 **node**로 모두 연결된 경우에도 디바이스당 한 행만 표시할 수 있습니다.

## 브로드캐스트 이벤트 범위 지정

서버 푸시 WebSocket 브로드캐스트 이벤트는 범위 게이트가 적용되므로 pairing 범위 세션이나
Node 전용 세션은 세션 콘텐츠를 수동적으로 수신하지 않습니다.

- **채팅, agent 및 tool-result 프레임**(스트리밍된 `agent` 이벤트 및 도구 호출 결과 포함)은 최소
  `operator.read`가 필요합니다. `operator.read`가 없는 세션은 이러한 프레임을 완전히 건너뜁니다.
- **Plugin 정의 `plugin.*` 브로드캐스트**는 Plugin이 등록한 방식에 따라
  `operator.write` 또는 `operator.admin`으로 게이트됩니다.
- **상태 및 전송 이벤트**(`heartbeat`, `presence`, `tick`, connect/disconnect 수명 주기 등)은
  제한이 없으므로 모든 인증된 세션에서 전송 상태를 관찰할 수 있습니다.
- **알 수 없는 브로드캐스트 이벤트 계열**은 등록된 핸들러가 이를 명시적으로 완화하지 않는 한
  기본적으로 범위 게이트가 적용됩니다(fail-closed).

각 클라이언트 연결은 자체 클라이언트별 시퀀스 번호를 유지하므로, 서로 다른 클라이언트가
이벤트 스트림의 범위 필터링된 서로 다른 하위 집합을 보더라도 해당 소켓에서 브로드캐스트의 단조 증가 순서가 유지됩니다.

## 일반적인 RPC 메서드 계열

이 페이지는 생성된 전체 덤프는 아니지만, 공개 WS 표면은 위의 핸드셰이크/인증 예시보다
더 넓습니다. 다음은 현재 Gateway가 노출하는 주요 메서드 계열입니다.

`hello-ok.features.methods`는
`src/gateway/server-methods-list.ts`와 로드된 Plugin/channel 메서드 export로 구성된 보수적인 탐색 목록입니다.
이를 기능 탐색으로 취급하고,
`src/gateway/server-methods/*.ts`에 구현된 모든 호출 가능한 헬퍼의 생성된 덤프로 취급하지 마세요.

### 시스템 및 ID

- `health`는 캐시된 또는 새로 프로브된 gateway 상태 스냅샷을 반환합니다.
- `diagnostics.stability`는 최근의 범위 제한된 진단 안정성
  기록기를 반환합니다. 여기에는 이벤트 이름, 개수, 바이트
  크기, 메모리 측정값, 큐/세션 상태, channel/plugin 이름, 세션
  ID 같은 운영 메타데이터가 유지됩니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청 또는
  응답 본문, 토큰, 쿠키, 비밀 값은 유지하지 않습니다. `operator.read` 범위가
  필요합니다.
- `status`는 `/status` 스타일의 gateway 요약을 반환합니다. 민감한 필드는
  관리자 범위의 operator 클라이언트에만 포함됩니다.
- `gateway.identity.get`은 relay 및
  pairing 흐름에서 사용하는 gateway 디바이스 ID를 반환합니다.
- `system-presence`는 연결된
  operator/Node 디바이스의 현재 presence 스냅샷을 반환합니다.
- `system-event`는 시스템 이벤트를 추가하고 presence
  컨텍스트를 업데이트/브로드캐스트할 수 있습니다.
- `last-heartbeat`는 최신으로 영속화된 Heartbeat 이벤트를 반환합니다.
- `set-heartbeats`는 gateway에서 Heartbeat 처리를 켜거나 끕니다.

### 모델 및 사용량

- `models.list`는 런타임에서 허용된 모델 카탈로그를 반환합니다.
- `usage.status`는 provider 사용량 기간/남은 할당량 요약을 반환합니다.
- `usage.cost`는 날짜 범위에 대한 집계된 비용 사용량 요약을 반환합니다.
- `doctor.memory.status`는 활성 기본 에이전트 워크스페이스에 대한
  벡터 메모리 / 임베딩 준비 상태를 반환합니다.
- `sessions.usage`는 세션별 사용량 요약을 반환합니다.
- `sessions.usage.timeseries`는 하나의 세션에 대한 시계열 사용량을 반환합니다.
- `sessions.usage.logs`는 하나의 세션에 대한 사용량 로그 항목을 반환합니다.

### 채널 및 로그인 도우미

- `channels.status`는 내장 + 번들 channel/plugin 상태 요약을 반환합니다.
- `channels.logout`은 해당 channel이
  로그아웃을 지원하는 경우 특정 channel/account에서 로그아웃합니다.
- `web.login.start`는 현재 QR 지원 웹
  channel provider에 대한 QR/웹 로그인 흐름을 시작합니다.
- `web.login.wait`는 해당 QR/웹 로그인 흐름이 완료될 때까지 기다린 뒤 성공 시
  channel을 시작합니다.
- `push.test`는 등록된 iOS Node로 테스트 APNs 푸시를 보냅니다.
- `voicewake.get`은 저장된 웨이크 워드 트리거를 반환합니다.
- `voicewake.set`은 웨이크 워드 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.

### 메시징 및 로그

- `send`는 chat 러너 외부에서 channel/account/thread 대상
  전송을 수행하는 직접 아웃바운드 전달 RPC입니다.
- `logs.tail`은 cursor/limit 및
  최대 바이트 제어와 함께 구성된 gateway 파일 로그 tail을 반환합니다.

### Talk 및 TTS

- `talk.config`는 유효한 Talk 구성 payload를 반환합니다. `includeSecrets`에는
  `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
- `talk.mode`는 WebChat/Control UI
  클라이언트에 대한 현재 Talk 모드 상태를 설정/브로드캐스트합니다.
- `talk.speak`는 활성 Talk 음성 provider를 통해 음성을 합성합니다.
- `tts.status`는 TTS 활성화 상태, 활성 provider, 대체 provider,
  provider 구성 상태를 반환합니다.
- `tts.providers`는 표시 가능한 TTS provider 인벤토리를 반환합니다.
- `tts.enable` 및 `tts.disable`은 TTS 환경설정 상태를 켜거나 끕니다.
- `tts.setProvider`는 선호 TTS provider를 업데이트합니다.
- `tts.convert`는 일회성 텍스트 음성 변환을 실행합니다.

### 비밀, 구성, 업데이트 및 wizard

- `secrets.reload`는 활성 SecretRefs를 다시 확인하고, 전체 성공 시에만 런타임 비밀 상태를 교체합니다.
- `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 비밀 할당을 확인합니다.
- `config.get`은 현재 구성 스냅샷과 해시를 반환합니다.
- `config.set`은 검증된 구성 payload를 기록합니다.
- `config.patch`는 부분 구성 업데이트를 병합합니다.
- `config.apply`는 전체 구성 payload를 검증하고 교체합니다.
- `config.schema`는 Control UI 및 CLI 도구에서 사용하는 라이브 구성 스키마 payload를 반환합니다:
  스키마, `uiHints`, 버전, 생성 메타데이터를 포함하며, 런타임이 이를 로드할 수 있는 경우
  plugin + channel 스키마 메타데이터도 포함합니다. 이 스키마에는 UI에서 사용하는 동일한 레이블 및
  도움말 텍스트에서 파생된 필드 `title` / `description` 메타데이터가 포함되며,
  일치하는 필드 문서가 존재하는 경우 중첩 객체, 와일드카드, 배열 항목,
  `anyOf` / `oneOf` / `allOf` 조합 분기도 포함됩니다.
- `config.schema.lookup`은 하나의 구성 경로에 대한 경로 범위 lookup payload를 반환합니다:
  정규화된 경로, 얕은 스키마 노드, 일치한 힌트 + `hintPath`, 그리고 UI/CLI 드릴다운을 위한
  즉시 하위 요약을 포함합니다.
  - Lookup 스키마 노드는 사용자 대상 문서와 일반적인 검증 필드를 유지합니다:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    숫자/문자열/배열/객체 범위, 그리고
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` 같은 불리언 플래그.
  - 하위 요약은 `key`, 정규화된 `path`, `type`, `required`,
    `hasChildren`, 그리고 일치한 `hint` / `hintPath`를 노출합니다.
- `update.run`은 gateway 업데이트 흐름을 실행하고, 업데이트 자체가 성공했을 때만
  재시작을 예약합니다.
- `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel`은
  WS RPC를 통해 온보딩 wizard를 노출합니다.

### 기존 주요 계열

#### 에이전트 및 워크스페이스 도우미

- `agents.list`는 구성된 에이전트 항목을 반환합니다.
- `agents.create`, `agents.update`, `agents.delete`는 에이전트 레코드와
  워크스페이스 연결을 관리합니다.
- `agents.files.list`, `agents.files.get`, `agents.files.set`은
  에이전트에 대해 노출된 부트스트랩 워크스페이스 파일을 관리합니다.
- `agent.identity.get`은 에이전트 또는
  세션에 대한 유효 assistant ID를 반환합니다.
- `agent.wait`는 실행이 끝날 때까지 기다리고, 사용 가능할 때
  최종 스냅샷을 반환합니다.

#### 세션 제어

- `sessions.list`는 현재 세션 인덱스를 반환합니다.
- `sessions.subscribe` 및 `sessions.unsubscribe`는 현재 WS 클라이언트에 대한
  세션 변경 이벤트 구독을 전환합니다.
- `sessions.messages.subscribe` 및 `sessions.messages.unsubscribe`는
  하나의 세션에 대한 트랜스크립트/메시지 이벤트 구독을 전환합니다.
- `sessions.preview`는 특정 세션
  키에 대한 범위 제한된 트랜스크립트 미리보기를 반환합니다.
- `sessions.resolve`는 세션 대상을 확인하거나 정규화합니다.
- `sessions.create`는 새 세션 항목을 생성합니다.
- `sessions.send`는 기존 세션에 메시지를 보냅니다.
- `sessions.steer`는 활성 세션용 중단 후 조정 변형입니다.
- `sessions.abort`는 세션의 활성 작업을 중단합니다.
- `sessions.patch`는 세션 메타데이터/재정의를 업데이트합니다.
- `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션
  유지 관리를 수행합니다.
- `sessions.get`은 저장된 전체 세션 행을 반환합니다.
- chat 실행은 여전히 `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject`를 사용합니다.
- `chat.history`는 UI 클라이언트를 위해 표시용으로 정규화됩니다: 인라인 지시어 태그는
  보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML payload(`
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`,
  및 잘린 도구 호출 블록 포함`)와 유출된 ASCII/전각 모델 제어 토큰은
  제거되며, 정확히 `NO_REPLY` /
  `no_reply`인 순수 무음 토큰 assistant 행은 생략되고, 지나치게 큰 행은 placeholder로 대체될 수 있습니다.

#### 디바이스 페어링 및 디바이스 토큰

- `device.pair.list`는 대기 중 및 승인된 페어링 디바이스를 반환합니다.
- `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는
  디바이스 페어링 레코드를 관리합니다.
- `device.token.rotate`는 승인된 역할 및
  범위 제한 내에서 페어링된 디바이스 토큰을 교체합니다.
- `device.token.revoke`는 페어링된 디바이스 토큰을 폐기합니다.

#### Node 페어링, invoke 및 대기 중 작업

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, `node.pair.verify`는 Node 페어링과 부트스트랩
  검증을 다룹니다.
- `node.list` 및 `node.describe`는 알려진/연결된 Node 상태를 반환합니다.
- `node.rename`은 페어링된 Node 레이블을 업데이트합니다.
- `node.invoke`는 연결된 Node로 명령을 전달합니다.
- `node.invoke.result`는 invoke 요청의 결과를 반환합니다.
- `node.event`는 Node 원본 이벤트를 다시 gateway로 전달합니다.
- `node.canvas.capability.refresh`는 범위가 지정된 canvas 기능 토큰을 갱신합니다.
- `node.pending.pull` 및 `node.pending.ack`는 연결된 Node 대기열 API입니다.
- `node.pending.enqueue` 및 `node.pending.drain`은 오프라인/연결 해제된 Node를 위한
  영속적인 대기 작업을 관리합니다.

#### 승인 계열

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`,
  `exec.approval.resolve`는 일회성 exec 승인 요청과 대기 중
  승인 조회/재생을 다룹니다.
- `exec.approval.waitDecision`은 하나의 대기 중 exec 승인을 기다리고
  최종 결정(또는 제한 시간 시 `null`)을 반환합니다.
- `exec.approvals.get` 및 `exec.approvals.set`은 gateway exec 승인
  정책 스냅샷을 관리합니다.
- `exec.approvals.node.get` 및 `exec.approvals.node.set`은 Node relay 명령을 통해 Node 로컬 exec
  승인 정책을 관리합니다.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision`, `plugin.approval.resolve`는
  Plugin 정의 승인 흐름을 다룹니다.

#### 기타 주요 계열

- 자동화:
  - `wake`는 즉시 또는 다음 Heartbeat에서 깨우기 텍스트 주입을 예약합니다
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/도구: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### 일반적인 이벤트 계열

- `chat`: `chat.inject` 및 기타 트랜스크립트 전용 chat
  이벤트 같은 UI chat 업데이트.
- `session.message` 및 `session.tool`: 구독된 세션에 대한
  트랜스크립트/이벤트 스트림 업데이트.
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경됨.
- `presence`: 시스템 presence 스냅샷 업데이트.
- `tick`: 주기적 keepalive / 활성 상태 이벤트.
- `health`: gateway 상태 스냅샷 업데이트.
- `heartbeat`: Heartbeat 이벤트 스트림 업데이트.
- `cron`: Cron 실행/작업 변경 이벤트.
- `shutdown`: gateway 종료 알림.
- `node.pair.requested` / `node.pair.resolved`: Node 페어링 수명 주기.
- `node.invoke.request`: Node invoke 요청 브로드캐스트.
- `device.pair.requested` / `device.pair.resolved`: 페어링 디바이스 수명 주기.
- `voicewake.changed`: 웨이크 워드 트리거 구성이 변경됨.
- `exec.approval.requested` / `exec.approval.resolved`: exec 승인
  수명 주기.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 승인
  수명 주기.

### Node 도우미 메서드

- Node는 자동 허용 검사를 위해 현재 skill 실행 파일
  목록을 가져오기 위해 `skills.bins`를 호출할 수 있습니다.

### Operator 도우미 메서드

- Operator는 에이전트의 런타임
  명령 인벤토리를 가져오기 위해 `commands.list`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 워크스페이스를 읽습니다.
  - `scope`는 기본 `name`이 대상으로 삼는 표면을 제어합니다:
    - `text`는 앞의 `/` 없이 기본 텍스트 명령 토큰을 반환합니다
    - `native` 및 기본 `both` 경로는 사용 가능한 경우 provider 인식 네이티브 이름을 반환합니다
  - `textAliases`는 `/model`, `/m` 같은 정확한 슬래시 별칭을 포함합니다.
  - `nativeName`은 존재할 경우 provider 인식 네이티브 명령 이름을 포함합니다.
  - `provider`는 선택 사항이며 네이티브 명명과 네이티브 Plugin
    명령 가용성에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인수 메타데이터를 생략합니다.
- Operator는 에이전트의 런타임 도구 카탈로그를 가져오기 위해 `tools.catalog`(`operator.read`)를 호출할 수 있습니다.
  응답에는 그룹화된 도구와 출처 메타데이터가 포함됩니다:
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때 Plugin 소유자
  - `optional`: Plugin 도구가 선택 사항인지 여부
- Operator는 세션의 런타임 유효 도구
  인벤토리를 가져오기 위해 `tools.effective`(`operator.read`)를 호출할 수 있습니다.
  - `sessionKey`는 필수입니다.
  - gateway는 호출자가 제공한 인증 또는 전달 컨텍스트를 받아들이는 대신,
    신뢰할 수 있는 런타임 컨텍스트를 세션에서 서버 측으로 파생합니다.
  - 응답은 세션 범위로 한정되며, 현재 활성 대화가 지금 사용할 수 있는 것을 반영합니다.
    여기에는 core, Plugin, channel 도구가 포함됩니다.
- Operator는 에이전트에 대해 보이는
  skill 인벤토리를 가져오기 위해 `skills.status`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 워크스페이스를 읽습니다.
  - 응답에는 원시 비밀 값을 노출하지 않고 적격성, 누락된 요구 사항, 구성 검사,
    정리된 설치 옵션이 포함됩니다.
- Operator는 ClawHub 검색 메타데이터를 위해 `skills.search` 및 `skills.detail`(`operator.read`)를 호출할 수 있습니다.
- Operator는 `skills.install`(`operator.admin`)을 두 가지 모드로 호출할 수 있습니다:
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는
    기본 에이전트 워크스페이스 `skills/` 디렉터리에
    skill 폴더를 설치합니다.
  - Gateway 설치 프로그램 모드: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    는 gateway 호스트에서 선언된 `metadata.openclaw.install` 작업을 실행합니다.
- Operator는 `skills.update`(`operator.admin`)를 두 가지 모드로 호출할 수 있습니다:
  - ClawHub 모드는 하나의 추적된 slug 또는 기본 에이전트 워크스페이스의
    모든 추적된 ClawHub 설치를 업데이트합니다.
  - 구성 모드는 `enabled`,
    `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

## Exec 승인

- exec 요청에 승인이 필요할 때 gateway는 `exec.approval.requested`를 브로드캐스트합니다.
- Operator 클라이언트는 `exec.approval.resolve`를 호출하여 이를 처리합니다(`operator.approvals` 범위 필요).
- `host=node`의 경우 `exec.approval.request`에는 `systemRunPlan`(정규화된 `argv`/`cwd`/`rawCommand`/세션 메타데이터)이 반드시 포함되어야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달된 `node.invoke system.run` 호출은 정규화된
  `systemRunPlan`을 권위 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 prepare와 최종 승인된 `system.run` 전달 사이에서 `command`, `rawCommand`, `cwd`, `agentId`,
  `sessionKey`를 변경하면 gateway는
  변경된 payload를 신뢰하지 않고 실행을 거부합니다.

## 에이전트 전달 폴백

- `agent` 요청에는 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`는 엄격한 동작을 유지합니다: 확인할 수 없거나 내부 전용 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부 전달 가능한 경로를 확인할 수 없을 때
  세션 전용 실행으로 폴백할 수 있게 합니다(예: 내부/webchat 세션 또는 모호한 멀티채널 구성).

## 버전 관리

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema/protocol-schemas.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 보내며, 서버는 불일치를 거부합니다.
- 스키마 + 모델은 TypeBox 정의에서 생성됩니다:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 클라이언트 상수

`src/gateway/client.ts`의 참조 클라이언트는 이 기본값을 사용합니다. 값은
프로토콜 v3 전반에서 안정적이며 서드파티 클라이언트에 기대되는 기준선입니다.

| 상수                                      | 기본값                                                | 소스                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| 요청 제한 시간(RPC당)                     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| 사전 인증 / connect-challenge 제한 시간   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| 초기 재연결 백오프                        | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| 최대 재연결 백오프                        | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| 디바이스 토큰 종료 후 빠른 재시도 clamp   | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` 전 강제 중지 유예 시간      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` 기본 제한 시간            | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| 기본 tick 간격(`hello-ok` 이전)           | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick 제한 시간 종료                       | 침묵이 `tickIntervalMs * 2`를 넘으면 코드 `4000`      | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

서버는 `hello-ok`에서 유효한 `policy.tickIntervalMs`, `policy.maxPayload`,
및 `policy.maxBufferedBytes`를 알립니다. 클라이언트는 핸드셰이크 전 기본값보다
이 값을 따라야 합니다.

## 인증

- 공유 비밀 gateway 인증은 구성된 인증 모드에 따라 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 사용합니다.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 또는 non-loopback
  `gateway.auth.mode: "trusted-proxy"` 같은 ID 기반 모드는
  `connect.params.auth.*` 대신 요청 헤더로 connect 인증 검사를 충족합니다.
- private-ingress `gateway.auth.mode: "none"`은 공유 비밀 connect 인증을
  완전히 건너뜁니다. 이 모드를 공개/비신뢰 인그레스에 노출하지 마세요.
- 페어링 후 Gateway는 연결 역할 + 범위로 제한된 **디바이스 토큰**을 발급합니다.
  이는 `hello-ok.auth.deviceToken`에 반환되며, 클라이언트는 향후 연결을 위해
  이를 영속화해야 합니다.
- 클라이언트는 성공적으로 연결될 때마다 기본 `hello-ok.auth.deviceToken`을
  영속화해야 합니다.
- 그 **저장된** 디바이스 토큰으로 재연결할 때는 해당 토큰에 대해 저장된
  승인된 범위 집합도 재사용해야 합니다. 이렇게 하면 이미 부여된 read/probe/status 액세스가
  유지되고, 재연결이 더 좁은 암시적 admin 전용 범위로
  조용히 축소되는 것을 방지할 수 있습니다.
- 클라이언트 측 connect 인증 조립(`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password`는 직교적이며 설정된 경우 항상 전달됩니다.
  - `auth.token`은 우선순위 순서대로 채워집니다: 먼저 명시적 공유 토큰,
    그다음 명시적 `deviceToken`, 그다음 저장된 디바이스별 토큰(`deviceId` + `role`로 키 지정).
  - `auth.bootstrapToken`은 위 항목 중 어느 것도 `auth.token`으로 확인되지 않은 경우에만 전송됩니다.
    공유 토큰이나 확인된 디바이스 토큰이 있으면 이를 억제합니다.
  - 저장된 디바이스 토큰의 자동 승격은 일회성
    `AUTH_TOKEN_MISMATCH` 재시도에서 **신뢰된 엔드포인트에만** 허용됩니다 —
    loopback 또는 고정된 `tlsFingerprint`가 있는 `wss://`입니다. 고정되지 않은 공개 `wss://`는
    해당되지 않습니다.
- 추가 `hello-ok.auth.deviceTokens` 항목은 부트스트랩 핸드오프 토큰입니다.
  이를 영속화하는 것은 연결이 부트스트랩 인증을 사용했고, `wss://` 또는 loopback/local pairing 같은
  신뢰된 전송에서 이루어진 경우에만 해야 합니다.
- 클라이언트가 **명시적** `deviceToken` 또는 명시적 `scopes`를 제공한 경우,
  호출자가 요청한 그 범위 집합이 계속 권위 있는 값으로 유지됩니다. 캐시된 범위는
  클라이언트가 저장된 디바이스별 토큰을 재사용하는 경우에만 재사용됩니다.
- 디바이스 토큰은 `device.token.rotate` 및
  `device.token.revoke`를 통해 교체/폐기할 수 있습니다(`operator.pairing` 범위 필요).
- 토큰 발급/교체는 해당 디바이스의 페어링 항목에 기록된 승인된 역할 집합으로
  계속 제한됩니다. 토큰 교체로 디바이스를
  페어링 승인이 한 번도 부여하지 않은 역할로 확장할 수는 없습니다.
- 페어링된 디바이스 토큰 세션의 경우, 호출자에게 `operator.admin`도 있지 않는 한
  디바이스 관리는 자체 범위로 제한됩니다: non-admin 호출자는 자신의 **자체**
  디바이스 항목만 제거/폐기/교체할 수 있습니다.
- `device.token.rotate`는 요청된 operator 범위 집합도
  호출자의 현재 세션 범위와 대조하여 확인합니다. non-admin 호출자는
  이미 보유한 것보다 더 넓은 operator 범위 집합으로 토큰을 교체할 수 없습니다.
- 인증 실패에는 `error.details.code`와 복구 힌트가 포함됩니다:
  - `error.details.canRetryWithDeviceToken` (불리언)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰된 클라이언트는 캐시된 디바이스별 토큰으로 한 번의 제한된 재시도를 시도할 수 있습니다.
  - 해당 재시도가 실패하면 클라이언트는 자동 재연결 루프를 중단하고 operator 작업 지침을 표시해야 합니다.

## 디바이스 ID + 페어링

- Node는 키 쌍 지문에서 파생된 안정적인 디바이스 ID(`device.id`)를 포함해야 합니다.
- Gateway는 디바이스 + 역할별로 토큰을 발급합니다.
- 로컬 자동 승인이 활성화되지 않은 경우 새로운 디바이스 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접적인 로컬 loopback 연결을 중심으로 동작합니다.
- OpenClaw에는 신뢰된 공유 비밀 도우미 흐름을 위한 좁은 범위의 백엔드/컨테이너 로컬 자기 연결 경로도 있습니다.
- 동일 호스트 tailnet 또는 LAN 연결도 페어링 관점에서는 여전히 원격으로 취급되며 승인이 필요합니다.
- 모든 WS 클라이언트는 `connect` 중에 `device` ID를 포함해야 합니다(operator + node).
  Control UI는 다음 모드에서만 이를 생략할 수 있습니다:
  - localhost 전용 비보안 HTTP 호환성을 위한 `gateway.controlUi.allowInsecureAuth=true`.
  - 성공적인 `gateway.auth.mode: "trusted-proxy"` operator Control UI 인증.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (비상용, 심각한 보안 저하).
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 디바이스 인증 마이그레이션 진단

여전히 사전 challenge 서명 동작을 사용하는 레거시 클라이언트의 경우, 이제 `connect`는
`error.details.code` 아래에 `DEVICE_AUTH_*` 세부 코드를, 그리고 안정적인 `error.details.reason`을 반환합니다.

일반적인 마이그레이션 실패:

| 메시지                      | details.code                     | details.reason           | 의미                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 클라이언트가 `device.nonce`를 생략했거나(또는 빈 값으로 전송했거나). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 서명 payload가 v2 payload와 일치하지 않습니다.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 서명된 타임스탬프가 허용된 오차 범위를 벗어났습니다. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`가 공개 키 지문과 일치하지 않습니다.     |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 공개 키 형식/정규화에 실패했습니다.                |

마이그레이션 목표:

- 항상 `connect.challenge`를 기다리세요.
- 서버 nonce를 포함하는 v2 payload에 서명하세요.
- 동일한 nonce를 `connect.params.device.nonce`로 보내세요.
- 권장 서명 payload는 `v3`이며, 이는 device/client/role/scopes/token/nonce 필드 외에
  `platform`과 `deviceFamily`도 바인딩합니다.
- 레거시 `v2` 서명도 호환성을 위해 계속 허용되지만, 재연결 시 명령 정책은
  여전히 페어링된 디바이스 메타데이터 고정에 의해 제어됩니다.

## TLS + pinning

- WS 연결에 TLS가 지원됩니다.
- 클라이언트는 gateway 인증서 지문을 선택적으로 고정할 수 있습니다(`gateway.tls`
  구성과 `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 gateway API**(상태, 채널, 모델, chat,
agent, 세션, Node, 승인 등)를 노출합니다. 정확한 표면은
`src/gateway/protocol/schema.ts`의 TypeBox 스키마로 정의됩니다.
