---
read_when:
    - 외부 시스템에서 TaskFlow를 트리거하거나 구동하고 싶으신 것입니다
    - 번들 Webhooks Plugin을 구성하고 있습니다
summary: 'Webhooks Plugin: 신뢰된 외부 자동화를 위한 인증된 TaskFlow ingress'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-04-24T06:29:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Webhooks Plugin은 외부
자동화를 OpenClaw TaskFlow에 바인딩하는 인증된 HTTP 경로를 추가합니다.

Zapier, n8n, CI 작업, 내부 서비스 같은 신뢰된 시스템이
먼저 사용자 정의 Plugin을 작성하지 않고도 관리형 TaskFlow를 생성하고 구동하게 하고 싶을 때 사용하세요.

## 실행 위치

Webhooks Plugin은 Gateway 프로세스 내부에서 실행됩니다.

Gateway가 다른 머신에서 실행 중이라면 해당 Gateway 호스트에 Plugin을 설치하고 구성한 뒤 Gateway를 재시작하세요.

## 경로 구성

구성은 `plugins.entries.webhooks.config` 아래에 설정하세요.

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

경로 필드:

- `enabled`: 선택 사항, 기본값은 `true`
- `path`: 선택 사항, 기본값은 `/plugins/webhooks/<routeId>`
- `sessionKey`: 바인딩된 TaskFlow를 소유하는 필수 세션
- `secret`: 필수 공유 secret 또는 SecretRef
- `controllerId`: 생성된 관리형 flow용 선택적 controller ID
- `description`: 선택적 운영자 메모

지원되는 `secret` 입력:

- 일반 문자열
- `source: "env" | "file" | "exec"`가 있는 SecretRef

secret 기반 경로가 시작 시 secret을 확인하지 못하면, 이 Plugin은 깨진 엔드포인트를 노출하는 대신
해당 경로를 건너뛰고 경고를 기록합니다.

## 보안 모델

각 경로는 구성된
`sessionKey`의 TaskFlow 권한으로 동작하는 것으로 신뢰됩니다.

즉, 해당 경로는 그 세션이 소유한 TaskFlow를 검사하고 변경할 수 있으므로
다음을 수행해야 합니다.

- 경로별로 강력하고 고유한 secret 사용
- 인라인 일반 텍스트 secret보다 secret reference를 우선 사용
- 워크플로에 맞는 가장 좁은 세션에 경로 바인딩
- 필요한 특정 Webhook 경로만 노출

이 Plugin은 다음을 적용합니다.

- 공유 secret 인증
- 요청 본문 크기 및 타임아웃 가드
- 고정 윈도우 rate limiting
- in-flight 요청 제한
- `api.runtime.taskFlow.bindSession(...)`을 통한 owner-bound TaskFlow 액세스

## 요청 형식

다음과 함께 `POST` 요청을 보내세요.

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 또는 `x-openclaw-webhook-secret: <secret>`

예시:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 지원되는 action

이 Plugin은 현재 다음 JSON `action` 값을 받습니다.

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

경로에 바인딩된 세션에 대한 관리형 TaskFlow를 생성합니다.

예시:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

기존 관리형 TaskFlow 내부에 관리형 하위 작업을 생성합니다.

허용되는 런타임:

- `subagent`
- `acp`

예시:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 응답 형태

성공한 응답은 다음을 반환합니다.

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

거부된 요청은 다음을 반환합니다.

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

이 Plugin은 Webhook 응답에서 owner/session 메타데이터를 의도적으로 제거합니다.

## 관련 문서

- [Plugin 런타임 SDK](/ko/plugins/sdk-runtime)
- [Hooks 및 Webhooks 개요](/ko/automation/hooks)
- [CLI webhooks](/ko/cli/webhooks)
