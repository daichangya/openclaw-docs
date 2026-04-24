---
read_when:
    - 전체 에이전트 턴을 실행하지 않고 도구 호출하기
    - 도구 정책 강제가 필요한 자동화 구축하기
summary: Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출하기
title: 도구 invoke API
x-i18n:
    generated_at: "2026-04-24T06:16:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# 도구 Invoke (HTTP)

OpenClaw의 Gateway는 단일 도구를 직접 호출하기 위한 간단한 HTTP 엔드포인트를 제공합니다. 이 엔드포인트는 항상 활성화되어 있으며 Gateway 인증과 도구 정책을 사용합니다. OpenAI 호환 `/v1/*` 표면과 마찬가지로, 공유 비밀 bearer 인증은 전체 gateway에 대한 신뢰된 operator 접근으로 취급됩니다.

- `POST /tools/invoke`
- Gateway와 같은 포트 사용(WS + HTTP 다중화): `http://<gateway-host>:<port>/tools/invoke`

기본 최대 payload 크기는 2 MB입니다.

## 인증

Gateway 인증 구성을 사용합니다.

일반적인 HTTP 인증 경로:

- 공유 비밀 인증(`gateway.auth.mode="token"` 또는 `"password"`):
  `Authorization: Bearer <token-or-password>`
- 신뢰된 정체성 포함 HTTP 인증(`gateway.auth.mode="trusted-proxy"`):
  구성된 정체성 인식 프록시를 통해 라우팅하고, 해당 프록시가 필요한
  정체성 헤더를 주입하도록 함
- 비공개 ingress 개방 인증(`gateway.auth.mode="none"`):
  인증 헤더 필요 없음

참고:

- `gateway.auth.mode="token"`인 경우 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용하세요.
- `gateway.auth.mode="password"`인 경우 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요.
- `gateway.auth.mode="trusted-proxy"`인 경우 HTTP 요청은
  구성된 non-loopback 신뢰 프록시 소스에서 와야 합니다. 같은 호스트의 loopback 프록시는
  이 모드를 충족하지 않습니다.
- `gateway.auth.rateLimit`가 구성되어 있고 인증 실패가 너무 많이 발생하면 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## 보안 경계(중요)

이 엔드포인트는 gateway 인스턴스에 대한 **전체 operator 접근** 표면으로 취급하세요.

- 여기의 HTTP bearer 인증은 좁은 사용자별 범위 모델이 아닙니다.
- 이 엔드포인트용 유효한 Gateway 토큰/비밀번호는 소유자/operator 자격 증명처럼 취급해야 합니다.
- 공유 비밀 인증 모드(`token`, `password`)에서는 호출자가 더 좁은 `x-openclaw-scopes` 헤더를 보내더라도 엔드포인트가 일반적인 전체 operator 기본값을 복원합니다.
- 공유 비밀 인증은 이 엔드포인트에서 직접 도구 호출을 소유자-발신자 턴으로도 취급합니다.
- 신뢰된 정체성 포함 HTTP 모드(예: 신뢰 프록시 인증 또는 비공개 ingress의 `gateway.auth.mode="none"`)는 `x-openclaw-scopes`가 있으면 이를 따르고, 없으면 일반 operator 기본 범위 집합으로 대체합니다.
- 이 엔드포인트는 loopback/tailnet/private ingress에서만 유지하고, 공개 인터넷에 직접 노출하지 마세요.

인증 매트릭스:

- `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`
  - 공유 gateway operator 비밀을 알고 있음을 증명
  - 더 좁은 `x-openclaw-scopes`는 무시
  - 전체 기본 operator 범위 집합을 복원:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 이 엔드포인트의 직접 도구 호출을 소유자-발신자 턴으로 취급
- 신뢰된 정체성 포함 HTTP 모드(예: 신뢰 프록시 인증 또는 비공개 ingress의 `gateway.auth.mode="none"`)
  - 외부의 신뢰된 정체성 또는 배포 경계를 인증
  - `x-openclaw-scopes` 헤더가 있으면 이를 따름
  - 헤더가 없으면 일반 operator 기본 범위 집합으로 대체
  - 호출자가 명시적으로 범위를 줄이고 `operator.admin`을 생략할 때만 소유자 의미를 잃음

## 요청 본문

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

필드:

- `tool` (문자열, 필수): 호출할 도구 이름
- `action` (문자열, 선택 사항): 도구 스키마가 `action`을 지원하고 args payload에 이를 생략한 경우 args로 매핑됨
- `args` (객체, 선택 사항): 도구별 인수
- `sessionKey` (문자열, 선택 사항): 대상 세션 키. 생략되거나 `"main"`이면 Gateway는 구성된 메인 세션 키를 사용합니다(`session.mainKey`와 기본 에이전트, 또는 global 범위에서는 `global`을 따름).
- `dryRun` (boolean, 선택 사항): 향후 사용을 위해 예약됨, 현재는 무시됨

## 정책 + 라우팅 동작

도구 사용 가능 여부는 Gateway 에이전트가 사용하는 동일한 정책 체인을 통해 필터링됩니다.

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 그룹 정책(세션 키가 그룹 또는 채널에 매핑되는 경우)
- subagent 정책(subagent 세션 키로 호출하는 경우)

정책상 도구가 허용되지 않으면 엔드포인트는 **404**를 반환합니다.

중요한 경계 참고:

- Exec 승인은 이 HTTP 엔드포인트에 대한 별도 권한 경계가 아니라 operator 보호 장치입니다. Gateway 인증 + 도구 정책을 통해 여기서 도달 가능한 도구라면 `/tools/invoke`는 호출별 추가 승인 프롬프트를 더하지 않습니다.
- 신뢰 경계가 다른 호출자와 Gateway bearer 자격 증명을 공유하지 마세요. 신뢰 경계 간 분리가 필요하면 별도의 gateway(가능하면 별도의 OS 사용자/호스트도 함께)를 실행하세요.

Gateway HTTP는 기본적으로 강한 deny 목록도 적용합니다(세션 정책이 도구를 허용하더라도).

- `exec` — 직접 명령 실행(RCE 표면)
- `spawn` — 임의 자식 프로세스 생성(RCE 표면)
- `shell` — 셸 명령 실행(RCE 표면)
- `fs_write` — 호스트에서 임의 파일 수정
- `fs_delete` — 호스트에서 임의 파일 삭제
- `fs_move` — 호스트에서 임의 파일 이동/이름 변경
- `apply_patch` — 패치 적용은 임의 파일을 다시 쓸 수 있음
- `sessions_spawn` — 세션 오케스트레이션, 원격에서 에이전트를 생성하는 것은 RCE
- `sessions_send` — 세션 간 메시지 주입
- `cron` — 영구 자동화 제어 평면
- `gateway` — gateway 제어 평면, HTTP를 통한 재구성을 방지
- `nodes` — Node 명령 릴레이는 페어링된 호스트에서 system.run에 도달할 수 있음
- `whatsapp_login` — 터미널 QR 스캔이 필요한 대화형 설정, HTTP에서 멈춤

이 deny 목록은 `gateway.tools`를 통해 사용자 지정할 수 있습니다.

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

그룹 정책이 컨텍스트를 확인하는 데 도움이 되도록 선택적으로 다음을 설정할 수 있습니다.

- `x-openclaw-message-channel: <channel>` (예: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (다중 계정이 있는 경우)

## 응답

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (잘못된 요청 또는 도구 입력 오류)
- `401` → unauthorized
- `429` → 인증 속도 제한됨(`Retry-After` 설정됨)
- `404` → 도구를 사용할 수 없음(찾을 수 없거나 허용 목록에 없음)
- `405` → 허용되지 않은 메서드
- `500` → `{ ok: false, error: { type, message } }` (예상치 못한 도구 실행 오류, 정제된 메시지)

## 예시

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 관련 항목

- [Gateway protocol](/ko/gateway/protocol)
- [Tools and plugins](/ko/tools)
