---
read_when:
    - 인스턴스 탭 디버깅
    - 중복되거나 오래된 인스턴스 행 조사하기
    - Gateway WS connect 또는 system-event beacon 변경하기
summary: OpenClaw presence 항목이 생성되고, 병합되고, 표시되는 방식
title: Presence
x-i18n:
    generated_at: "2026-04-24T06:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

OpenClaw의 “presence”는 다음에 대한 가볍고 최선의 노력 기반 뷰입니다.

- **Gateway** 자체
- **Gateway에 연결된 클라이언트**(mac 앱, WebChat, CLI 등)

Presence는 주로 macOS 앱의 **인스턴스** 탭을 렌더링하고,
운영자에게 빠른 가시성을 제공하는 데 사용됩니다.

## Presence 필드(표시되는 내용)

Presence 항목은 다음과 같은 필드를 가진 구조화된 객체입니다.

- `instanceId` (선택 사항이지만 강력히 권장): 안정적인 클라이언트 식별자(보통 `connect.client.instanceId`)
- `host`: 사람이 읽기 쉬운 호스트 이름
- `ip`: 최선의 노력 기반 IP 주소
- `version`: 클라이언트 버전 문자열
- `deviceFamily` / `modelIdentifier`: 하드웨어 힌트
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “마지막 사용자 입력 이후 경과 초” (알려진 경우)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 마지막 업데이트 타임스탬프(epoch 이후 밀리초)

## 생산자(Presence가 오는 곳)

Presence 항목은 여러 소스에서 생성되며 **병합**됩니다.

### 1) Gateway self 항목

Gateway는 시작 시 항상 “self” 항목을 시드하므로, 클라이언트가 연결되기 전에도 UI에 Gateway 호스트가 표시됩니다.

### 2) WebSocket connect

모든 WS 클라이언트는 `connect` 요청으로 시작합니다. 핸드셰이크가 성공하면
Gateway는 해당 연결에 대한 Presence 항목을 upsert합니다.

#### 일회성 CLI 명령이 표시되지 않는 이유

CLI는 종종 짧은 일회성 명령을 위해 연결합니다. 인스턴스 목록이 과도하게 늘어나는 것을 피하기 위해 `client.mode === "cli"`는 **Presence 항목으로 변환되지 않습니다**.

### 3) `system-event` beacon

클라이언트는 `system-event` 메서드를 통해 더 풍부한 주기적 beacon을 보낼 수 있습니다. mac 앱은 이를 사용해 호스트 이름, IP, `lastInputSeconds`를 보고합니다.

### 4) Node 연결(role: node)

Node가 `role: node`로 Gateway WebSocket에 연결되면 Gateway는 해당 Node에 대한 Presence 항목을 upsert합니다(다른 WS 클라이언트와 동일한 흐름).

## 병합 + 중복 제거 규칙(`instanceId`가 중요한 이유)

Presence 항목은 단일 인메모리 맵에 저장됩니다.

- 항목은 **Presence 키**로 키 지정됩니다.
- 가장 좋은 키는 재시작 후에도 유지되는 안정적인 `instanceId`(`connect.client.instanceId`)입니다.
- 키는 대소문자를 구분하지 않습니다.

클라이언트가 안정적인 `instanceId` 없이 다시 연결되면
**중복** 행으로 표시될 수 있습니다.

## TTL 및 제한된 크기

Presence는 의도적으로 일시적입니다.

- **TTL:** 5분보다 오래된 항목은 제거됩니다
- **최대 항목 수:** 200 (가장 오래된 항목부터 제거)

이렇게 하면 목록을 최신 상태로 유지하고 메모리가 무한정 증가하는 것을 방지할 수 있습니다.

## 원격/터널 주의 사항(loopback IP)

클라이언트가 SSH 터널 / 로컬 포트 포워딩을 통해 연결되면 Gateway는
원격 주소를 `127.0.0.1`로 볼 수 있습니다. 이미 좋은 클라이언트 보고 IP를 덮어쓰지 않기 위해 loopback 원격 주소는 무시됩니다.

## 소비자

### macOS 인스턴스 탭

macOS 앱은 `system-presence`의 출력을 렌더링하고 마지막 업데이트 시각에 따라 작은 상태 표시기(활성/유휴/오래됨)를 적용합니다.

## 디버깅 팁

- 원시 목록을 보려면 Gateway에 대해 `system-presence`를 호출하세요.
- 중복이 보인다면:
  - 클라이언트가 핸드셰이크에서 안정적인 `client.instanceId`를 보내는지 확인하세요
  - 주기적 beacon이 동일한 `instanceId`를 사용하는지 확인하세요
  - 연결 파생 항목에 `instanceId`가 빠져 있는지 확인하세요(이 경우 중복은 예상된 동작입니다)

## 관련 문서

- [타이핑 표시기](/ko/concepts/typing-indicators)
- [스트리밍 및 청킹](/ko/concepts/streaming)
