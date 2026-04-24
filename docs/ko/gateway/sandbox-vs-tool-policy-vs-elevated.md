---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: '도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책, Elevated exec 게이트'
title: 샌드박스 vs 도구 정책 vs Elevated
x-i18n:
    generated_at: "2026-04-24T06:16:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw에는 서로 관련은 있지만 다른 세 가지 제어가 있습니다.

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 도구가 **어디서 실행되는지**를 결정합니다(샌드박스 백엔드 vs 호스트).
2. **도구 정책** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)은 **어떤 도구를 사용할 수 있고 허용되는지**를 결정합니다.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`)는 샌드박스 상태일 때 샌드박스 밖에서 실행하기 위한 **exec 전용 탈출구**입니다(기본값은 `gateway`, exec 대상이 `node`로 구성된 경우에는 `node`).

## 빠른 디버그

OpenClaw가 _실제로_ 무엇을 하고 있는지 확인하려면 inspector를 사용하세요.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

출력 내용:

- 유효한 sandbox mode/scope/workspace access
- 세션이 현재 샌드박스 상태인지 여부(main vs non-main)
- 유효한 샌드박스 도구 allow/deny(그리고 그것이 agent/global/default 중 어디서 왔는지)
- Elevated 게이트와 수정용 키 경로

## Sandbox: 도구가 실행되는 위치

샌드박싱은 `agents.defaults.sandbox.mode`로 제어됩니다.

- `"off"`: 모든 것이 호스트에서 실행됩니다.
- `"non-main"`: non-main 세션만 샌드박스 처리됩니다(그룹/채널에서 흔한 “예상 밖” 동작).
- `"all"`: 모든 것이 샌드박스 처리됩니다.

전체 매트릭스(scope, workspace 마운트, 이미지)는 [Sandboxing](/ko/gateway/sandboxing)을 참조하세요.

### 바인드 마운트(빠른 보안 확인)

- `docker.binds`는 샌드박스 파일시스템을 _관통_ 합니다. 마운트한 것은 설정한 모드(`:ro` 또는 `:rw`)대로 컨테이너 안에서 보입니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/비밀에는 `:ro`를 권장합니다.
- `scope: "shared"`는 에이전트별 bind를 무시합니다(전역 bind만 적용).
- OpenClaw는 bind 소스를 두 번 검증합니다. 먼저 정규화된 소스 경로에서, 그다음 가장 깊은 기존 상위를 통해 확인한 후 다시 검증합니다. symlink 상위 탈출은 차단된 경로나 허용된 루트 검사를 우회할 수 없습니다.
- 존재하지 않는 leaf 경로도 안전하게 검사됩니다. `/workspace/alias-out/new-file`이 symlink된 상위를 통해 차단된 경로나 구성된 허용 루트 밖으로 확인되면 bind는 거부됩니다.
- `/var/run/docker.sock`를 바인딩하면 사실상 샌드박스에 호스트 제어 권한을 넘기는 것입니다. 의도한 경우에만 하세요.
- 워크스페이스 접근(`workspaceAccess: "ro"`/`"rw"`)은 bind 모드와 독립적입니다.

## 도구 정책: 어떤 도구가 존재하고 호출 가능한가

두 개의 계층이 중요합니다.

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile` (기본 허용 목록)
- **Provider 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/에이전트별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **샌드박스 도구 정책**(샌드박스 상태일 때만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면 다른 모든 것은 차단된 것으로 처리됩니다.
- 도구 정책은 최종 차단점입니다. 거부된 `exec` 도구는 `/exec`로 재정의할 수 없습니다.
- `/exec`는 승인된 발신자에 대한 세션 기본값만 바꾸며, 도구 접근 권한을 부여하지 않습니다.
  Provider 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 받을 수 있습니다.

### 도구 그룹(축약형)

도구 정책(전역, 에이전트, 샌드박스)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다.

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

사용 가능한 그룹:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash`는
  `exec`의 별칭으로 허용됨)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: 모든 내장 OpenClaw 도구(provider Plugin 제외)

## Elevated: exec 전용 "호스트에서 실행"

Elevated는 추가 도구를 부여하지 않고 `exec`에만 영향을 줍니다.

- 샌드박스 상태라면 `/elevated on`(또는 `elevated: true`가 있는 `exec`)은 샌드박스 밖에서 실행됩니다(여전히 승인이 필요할 수 있음).
- 세션에서 exec 승인을 건너뛰려면 `/elevated full`을 사용하세요.
- 이미 direct로 실행 중이라면 Elevated는 사실상 no-op입니다(그래도 게이트는 적용됨).
- Elevated는 **skill 범위가 아니며** 도구 allow/deny를 재정의하지 않습니다.
- Elevated는 `host=auto`에서 임의의 교차 호스트 재정의를 부여하지 않습니다. 일반 exec 대상 규칙을 따르며, 구성된/세션 대상이 이미 `node`일 때만 `node`를 유지합니다.
- `/exec`는 Elevated와 별개입니다. 이는 승인된 발신자에 대한 세션별 exec 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled`(필요시 `agents.list[].tools.elevated.enabled`도)
- 발신자 허용 목록: `tools.elevated.allowFrom.<provider>`(필요시 `agents.list[].tools.elevated.allowFrom.<provider>`도)

[Elevated Mode](/ko/tools/elevated)를 참조하세요.

## 흔한 "샌드박스 감옥" 해결 방법

### "Tool X blocked by sandbox tool policy"

수정용 키(하나 선택):

- 샌드박스 비활성화: `agents.defaults.sandbox.mode=off`(또는 에이전트별 `agents.list[].sandbox.mode=off`)
- 샌드박스 내부에서 도구 허용:
  - `tools.sandbox.tools.deny`(또는 에이전트별 `agents.list[].tools.sandbox.tools.deny`)에서 제거
  - 또는 `tools.sandbox.tools.allow`(또는 에이전트별 allow)에 추가

### "이게 main인 줄 알았는데 왜 샌드박스지?"

`"non-main"` 모드에서는 그룹/채널 키가 _main_ 이 아닙니다. main 세션 키(`sandbox explain`에 표시됨)를 사용하거나 모드를 `"off"`로 변경하세요.

## 관련 항목

- [Sandboxing](/ko/gateway/sandboxing) -- 전체 샌드박스 참조(모드, scope, 백엔드, 이미지)
- [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의 및 우선순위
- [Elevated Mode](/ko/tools/elevated)
