---
read_when:
    - macOS UI 없이 node 페어링 승인 구현하기
    - 원격 node 승인을 위한 CLI 흐름 추가하기
    - Gateway 프로토콜을 node 관리로 확장하기
summary: iOS 및 기타 원격 node를 위한 Gateway 소유 node 페어링(옵션 B)
title: Gateway 소유 페어링
x-i18n:
    generated_at: "2026-04-24T06:15:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 소유 페어링(옵션 B)

Gateway 소유 페어링에서는 **Gateway**가 어떤 node의 참여를 허용할지에 대한 source of truth입니다. UI(macOS 앱, 향후 클라이언트)는 대기 중 요청을 승인하거나 거부하는 프런트엔드일 뿐입니다.

**중요:** WS node는 `connect` 중에 **device pairing**(role `node`)을 사용합니다.
`node.pair.*`는 별도의 페어링 저장소이며 WS 핸드셰이크를 제어하지 않습니다.
명시적으로 `node.pair.*`를 호출하는 클라이언트만 이 흐름을 사용합니다.

## 개념

- **대기 중 요청**: node가 참여를 요청했으며 승인이 필요함
- **페어링된 node**: 승인되었고 인증 토큰이 발급된 node
- **전송 계층**: Gateway WS 엔드포인트는 요청을 전달하지만 멤버십을 결정하지는 않음(레거시 TCP bridge 지원은 제거됨)

## 페어링 작동 방식

1. node가 Gateway WS에 연결하고 페어링을 요청합니다.
2. Gateway는 **대기 중 요청**을 저장하고 `node.pair.requested`를 발생시킵니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인 시 Gateway는 **새 토큰**을 발급합니다(재페어링 시 토큰은 순환됨).
5. node는 해당 토큰으로 다시 연결하고 이제 “페어링됨” 상태가 됩니다.

대기 중 요청은 **5분** 후 자동 만료됩니다.

## CLI 워크플로(headless 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 페어링된/연결된 node와 그 capability를 보여줍니다.

## API 표면(gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 대기 요청이 생성될 때 발생
- `node.pair.resolved` — 요청이 승인/거부/만료될 때 발생

메서드:

- `node.pair.request` — 대기 요청 생성 또는 재사용
- `node.pair.list` — 대기 중 + 페어링된 node 목록(`operator.pairing`)
- `node.pair.approve` — 대기 요청 승인(토큰 발급)
- `node.pair.reject` — 대기 요청 거부
- `node.pair.verify` — `{ nodeId, token }` 검증

참고:

- `node.pair.request`는 node별로 멱등적입니다. 반복 호출은 동일한 대기 요청을 반환합니다.
- 동일한 대기 node에 대한 반복 요청은 운영자 가시성을 위해 저장된 node 메타데이터와 최신 허용 목록 declared command 스냅샷도 새로고침합니다.
- 승인 시에는 **항상** 새 토큰이 생성되며, `node.pair.request`에서 토큰이 반환되는 일은 없습니다.
- 요청은 자동 승인 흐름을 위한 힌트로 `silent: true`를 포함할 수 있습니다.
- `node.pair.approve`는 대기 요청의 declared command를 사용해 추가 승인 범위를 강제합니다.
  - 명령 없는 요청: `operator.pairing`
  - non-exec 명령 요청: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 요청:
    `operator.pairing` + `operator.admin`

중요:

- node 페어링은 신뢰/ID 흐름과 토큰 발급입니다.
- node별 실제 명령 표면을 고정하지는 않습니다.
- 실제 node 명령은 연결 후 node가 선언한 내용에서 오며,
  gateway의 전역 node 명령 정책(`gateway.nodes.allowCommands` /
  `denyCommands`)이 적용된 뒤 사용 가능합니다.
- 노드별 `system.run` 허용/ask 정책은
  페어링 레코드가 아니라 node의 `exec.approvals.node.*`에 있습니다.

## node 명령 게이팅(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** `2026.3.31`부터는 node 페어링이 승인되기 전까지 node 명령이 비활성화됩니다. device pairing만으로는 더 이상 선언된 node 명령을 노출하기에 충분하지 않습니다.
</Warning>

node가 처음 연결되면 페어링이 자동으로 요청됩니다. 이 페어링 요청이 승인되기 전까지 해당 node의 모든 대기 중 node 명령은 필터링되며 실행되지 않습니다. 페어링 승인을 통해 신뢰가 확립되면 해당 node가 선언한 명령은 일반 명령 정책의 적용을 받으며 사용 가능해집니다.

이 의미는 다음과 같습니다.

- 이전에 선언된 명령 노출을 위해 device pairing에만 의존하던 node는 이제 node 페어링을 완료해야 합니다.
- 페어링 승인 전에 큐에 들어간 명령은 보류되지 않고 삭제됩니다.

## node 이벤트 신뢰 경계(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** 이제 node에서 시작된 실행은 축소된 신뢰 표면에 머뭅니다.
</Warning>

node에서 시작된 요약 및 관련 세션 이벤트는 의도된 신뢰 표면으로 제한됩니다. 이전에 더 넓은 호스트 또는 세션 도구 접근에 의존하던 알림 기반 또는 node 트리거 흐름은 조정이 필요할 수 있습니다. 이 하드닝은 node 이벤트가 node의 신뢰 경계를 넘어 호스트 수준 도구 접근으로 상승하지 못하도록 보장합니다.

## 자동 승인(macOS 앱)

macOS 앱은 다음 조건에서 선택적으로 **무음 승인**을 시도할 수 있습니다.

- 요청이 `silent`로 표시되어 있고
- 앱이 동일한 사용자로 gateway 호스트에 대한 SSH 연결을 검증할 수 있는 경우

무음 승인이 실패하면 일반 “Approve/Reject” 프롬프트로 폴백됩니다.

## 메타데이터 업그레이드 자동 승인

이미 페어링된 device가 민감하지 않은 메타데이터 변경만 포함해 다시 연결하면
(예: 표시 이름 또는 클라이언트 플랫폼 힌트), OpenClaw는 이를
`metadata-upgrade`로 취급합니다. 무음 자동 승인은 범위가 좁습니다. 이미
loopback을 통해 공유 토큰 또는 비밀번호의 보유를 증명한
신뢰된 로컬 CLI/helper 재연결에만 적용됩니다. Browser/Control UI 클라이언트와
원격 클라이언트는 여전히 명시적 재승인 흐름을 사용합니다. 범위 업그레이드(read에서
write/admin으로)와 공개 키 변경은 **메타데이터 업그레이드 자동 승인 대상이 아닙니다**.
이들은 계속 명시적 재승인 요청으로 남습니다.

## QR 페어링 도우미

`/pair qr`는 페어링 페이로드를 구조화된 미디어로 렌더링하여 모바일과
브라우저 클라이언트가 직접 스캔할 수 있게 합니다.

device를 삭제하면 해당 device ID에 대한 오래된 대기 페어링 요청도 함께 정리되므로, revoke 이후 `nodes pending`에 고아 행이 표시되지 않습니다.

## locality와 전달 헤더

Gateway 페어링은 원시 소켓과 업스트림 프록시 증거가 모두 일치할 때만 연결을 loopback으로 취급합니다. 요청이 loopback으로 도착했더라도
비로컬 출처를 가리키는 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더를 포함하면, 그 전달 헤더 증거는 loopback locality 주장을 무효화합니다. 이 경우 페어링 경로는 요청을 같은 호스트 연결로 조용히 취급하지 않고 명시적 승인을 요구합니다. operator 인증에 대한 동등한 규칙은 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

## 저장소(로컬, 비공개)

페어링 상태는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 아래에 저장됩니다.

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`를 재정의하면 `nodes/` 폴더도 함께 이동합니다.

보안 참고:

- 토큰은 비밀입니다. `paired.json`을 민감한 파일로 취급하세요.
- 토큰을 순환하려면 재승인(또는 node 항목 삭제)이 필요합니다.

## 전송 계층 동작

- 전송 계층은 **무상태**이며 멤버십을 저장하지 않습니다.
- Gateway가 오프라인이거나 페어링이 비활성화되어 있으면 node는 페어링할 수 없습니다.
- Gateway가 원격 모드에 있어도 페어링은 계속 원격 Gateway의 저장소를 기준으로 수행됩니다.

## 관련 항목

- [채널 페어링](/ko/channels/pairing)
- [Nodes](/ko/nodes)
- [Devices CLI](/ko/cli/devices)
