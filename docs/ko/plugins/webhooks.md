---
read_when:
    - 외부 시스템에서 TaskFlow를 트리거하거나 구동하려는 경우
    - 번들 webhooks plugin을 구성하는 경우
summary: 'Webhooks plugin: 신뢰할 수 있는 외부 자동화를 위한 인증된 TaskFlow 인그레스'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-04-07T05:59:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (plugin)

Webhooks plugin은 외부
자동화를 OpenClaw TaskFlows에 바인딩하는 인증된 HTTP route를 추가합니다.

Zapier, n8n, CI 작업, 또는
내부 서비스 같은 신뢰할 수 있는 시스템에서 커스텀
plugin을 먼저 작성하지 않고도 관리형 TaskFlow를 생성하고 구동하려는 경우에 사용하세요.

## 실행 위치

Webhooks plugin은 Gateway 프로세스 내부에서 실행됩니다.

Gateway가 다른 머신에서 실행 중이라면 해당
Gateway 호스트에 plugin을 설치하고 구성한 다음 Gateway를 재시작하세요.

## route 구성

`plugins.entries.webhooks.config` 아래에 config를 설정하세요:

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

route 필드:

- `enabled`: 선택 사항, 기본값은 `true`
- `path`: 선택 사항, 기본값은 `/plugins/webhooks/<routeId>`
- `sessionKey`: 바인딩된 TaskFlow를 소유하는 필수 session
- `secret`: 필수 공유 secret 또는 SecretRef
- `controllerId`: 생성된 관리형 flow에 대한 선택적 controller id
- `description`: 선택적 운영자 메모

지원되는 `secret` 입력:

- 일반 문자열
- `source: "env" | "file" | "exec"`를 사용하는 SecretRef

secret 기반 route가 시작 시 secret을 해석할 수 없으면, plugin은
깨진 endpoint를 노출하는 대신 해당 route를 건너뛰고 경고를 기록합니다.

## 보안 모델

각 route는 구성된
`sessionKey`의 TaskFlow 권한으로 동작하는 것으로 신뢰됩니다.

즉, 해당 session이 소유한 TaskFlow를 검사하고 변경할 수 있으므로
다음을 권장합니다:

- route별로 강력하고 고유한 secret 사용
- 인라인 일반 텍스트 secret보다 secret reference 선호
- 워크플로에 맞는 가장 좁은 session에 route 바인딩
- 필요한 특정 webhook path만 노출

plugin은 다음을 적용합니다:

- 공유 secret 인증
- 요청 본문 크기 및 timeout 보호
- 고정 윈도우 rate limiting
- in-flight 요청 제한
- `api.runtime.taskFlow.bindSession(...)`을 통한 owner-bound TaskFlow 접근

## 요청 형식

다음과 함께 `POST` 요청을 보내세요:

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

현재 plugin은 다음 JSON `action` 값을 허용합니다:

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

route에 바인딩된 session에 대한 관리형 TaskFlow를 생성합니다.

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

기존 관리형 TaskFlow 내부에 관리형 하위 task를 생성합니다.

허용되는 runtime:

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

성공한 응답은 다음을 반환합니다:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

거부된 요청은 다음을 반환합니다:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

plugin은 의도적으로 webhook 응답에서 owner/session 메타데이터를 제거합니다.

## 관련 문서

- [Plugin runtime SDK](/ko/plugins/sdk-runtime)
- [Hooks and webhooks overview](/ko/automation/hooks)
- [CLI webhooks](/cli/webhooks)
