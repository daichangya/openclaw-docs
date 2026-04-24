---
read_when:
    - 에이전트가 사용할 수 있는 세션 도구가 무엇인지 이해하려고 합니다.
    - 세션 간 액세스 또는 하위 에이전트 spawn을 구성하려고 합니다.
    - spawn된 하위 에이전트의 상태를 확인하거나 제어하려고 합니다.
summary: 세션 간 상태 확인, recall, 메시징, 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-04-24T06:11:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw는 에이전트가 세션 간 작업을 하고, 상태를 확인하고, 하위 에이전트를 오케스트레이션할 수 있도록 도구를 제공합니다.

## 사용 가능한 도구

| Tool               | 기능                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(kind, label, agent, 최근성, 미리보기)와 함께 세션 목록 표시     |
| `sessions_history` | 특정 세션의 대화 기록 읽기                                                  |
| `sessions_send`    | 다른 세션에 메시지를 보내고 선택적으로 대기                                 |
| `sessions_spawn`   | 백그라운드 작업용 격리된 하위 에이전트 세션 spawn                           |
| `sessions_yield`   | 현재 턴을 종료하고 후속 하위 에이전트 결과 대기                             |
| `subagents`        | 이 세션에서 spawn된 하위 에이전트 나열, 제어, 종료                          |
| `session_status`   | `/status` 스타일 카드를 표시하고 선택적으로 세션별 모델 재정의 설정         |

## 세션 목록 및 읽기

`sessions_list`는 키, agentId, kind, channel, model, token 수, 타임스탬프와 함께 세션을 반환합니다. kind(`main`, `group`, `cron`, `hook`, `node`), 정확한 `label`, 정확한 `agentId`, 검색 텍스트 또는 최근성(`activeMinutes`)으로 필터링할 수 있습니다. 받은편지함 스타일 분류가 필요하면, 가시성 범위가 적용된 파생 제목, 마지막 메시지 미리보기 스니펫, 또는 각 행의 제한된 최근 메시지를 요청할 수도 있습니다. 파생 제목과 미리보기는 호출자가 구성된 세션 도구 가시성 정책 아래에서 이미 볼 수 있는 세션에 대해서만 생성되므로, 관련 없는 세션은 숨겨진 상태로 유지됩니다.

`sessions_history`는 특정 세션의 대화 기록을 가져옵니다. 기본적으로 도구 결과는 제외되며, 보려면 `includeTools: true`를 전달하세요. 반환되는 보기는 의도적으로 제한되고 안전 필터링됩니다.

- assistant 텍스트는 recall 전에 정규화됩니다.
  - thinking 태그 제거
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록 제거
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은 일반 텍스트 도구 호출 XML 페이로드 블록 제거(정상적으로 닫히지 않은 잘린 페이로드 포함)
  - `[Tool Call: ...]`, `[Tool Result ...]`, `[Historical context ...]` 같은 강등된 도구 호출/결과 스캐폴딩 제거
  - `<|assistant|>`, 기타 ASCII `<|...|>` 토큰 및 전각 `<｜...｜>` 변형 같은 유출된 모델 제어 토큰 제거
  - `<invoke ...>` / `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출 XML 제거
- 자격 증명/token 유사 텍스트는 반환 전에 마스킹됩니다.
- 긴 텍스트 블록은 잘립니다.
- 매우 큰 히스토리는 오래된 행을 떨어뜨리거나, 너무 큰 행을 `[sessions_history omitted: message too large]`로 대체할 수 있습니다.
- 도구는 `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` 같은 요약 플래그를 보고합니다.

두 도구 모두 **세션 키**(예: `"main"`) 또는 이전 list 호출의 **세션 ID**를 받을 수 있습니다.

정확한 바이트 단위 대화 기록이 필요하다면 `sessions_history`를 원시 덤프로 취급하지 말고 디스크의 대화 기록 파일을 직접 확인하세요.

## 세션 간 메시지 보내기

`sessions_send`는 다른 세션에 메시지를 전달하고 선택적으로 응답을 기다립니다.

- **Fire-and-forget:** `timeoutSeconds: 0`으로 설정하면 큐에 넣고 즉시 반환합니다.
- **응답 대기:** 타임아웃을 설정하면 인라인으로 응답을 받습니다.

대상이 응답한 후 OpenClaw는 에이전트가 메시지를 번갈아 주고받는 **reply-back 루프**를 실행할 수 있습니다(최대 5턴). 대상 에이전트는 조기에 중단하려면 `REPLY_SKIP`을 답할 수 있습니다.

## 상태 및 오케스트레이션 도우미

`session_status`는 현재 세션 또는 다른 가시 세션에 대한 경량 `/status` 동등 도구입니다. 사용량, 시간, 모델/런타임 상태, 그리고 존재할 경우 연결된 백그라운드 작업 컨텍스트를 보고합니다. `/status`와 마찬가지로 최신 대화 기록 사용량 항목에서 희소한 token/캐시 카운터를 보충할 수 있으며, `model=default`는 세션별 재정의를 지웁니다.

`sessions_yield`는 현재 턴을 의도적으로 종료하여 다음 메시지가 기다리던 후속 이벤트가 되도록 합니다. 폴링 루프를 만들지 않고 완료 결과가 다음 메시지로 도착하길 원할 때 하위 에이전트를 spawn한 후 사용하세요.

`subagents`는 이미 spawn된 OpenClaw 하위 에이전트를 위한 제어 평면 도우미입니다. 다음을 지원합니다.

- `action: "list"`로 활성/최근 실행 상태 확인
- `action: "steer"`로 실행 중인 자식에게 후속 지침 전송
- `action: "kill"`로 특정 자식 또는 `all` 종료

## 하위 에이전트 spawn

`sessions_spawn`은 기본적으로 백그라운드 작업용 격리된 세션을 생성합니다. 항상 논블로킹이며, 즉시 `runId`와 `childSessionKey`를 반환합니다.

주요 옵션:

- `runtime: "subagent"`(기본값) 또는 외부 하니스 에이전트용 `"acp"`
- 자식 세션에 대한 `model` 및 `thinking` 재정의
- 채팅 스레드(Discord, Slack 등)에 spawn을 바인딩하려면 `thread: true`
- 자식에 샌드박싱을 강제하려면 `sandbox: "require"`
- 자식이 현재 요청자 대화 기록이 필요하면 네이티브 하위 에이전트에 `context: "fork"` 사용, 깨끗한 자식을 원하면 생략하거나 `context: "isolated"` 사용

기본 leaf 하위 에이전트에는 세션 도구가 제공되지 않습니다. `maxSpawnDepth >= 2`이면 깊이 1의 orchestrator 하위 에이전트는 추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받아 자체 자식을 관리할 수 있습니다. leaf 실행에는 여전히 재귀적 오케스트레이션 도구가 제공되지 않습니다.

완료 후에는 announce 단계가 요청자 채널에 결과를 게시합니다. 완료 전송은 가능할 때 바인딩된 스레드/토픽 라우팅을 유지하며, 완료 원본이 채널만 식별하더라도 OpenClaw는 여전히 요청자 세션의 저장된 라우트(`lastChannel` / `lastTo`)를 재사용해 직접 전달할 수 있습니다.

ACP 전용 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 가시성

세션 도구는 에이전트가 볼 수 있는 범위를 제한하도록 범위가 지정됩니다.

| Level   | 범위                                      |
| ------- | ----------------------------------------- |
| `self`  | 현재 세션만                               |
| `tree`  | 현재 세션 + spawn된 하위 에이전트         |
| `agent` | 이 에이전트의 모든 세션                   |
| `all`   | 모든 세션(구성된 경우 에이전트 간 포함)   |

기본값은 `tree`입니다. 샌드박스 세션은 config와 관계없이 `tree`로 제한됩니다.

## 추가 읽을거리

- [세션 관리](/ko/concepts/session) -- 라우팅, 수명 주기, 유지 관리
- [ACP 에이전트](/ko/tools/acp-agents) -- 외부 하니스 spawn
- [멀티 에이전트](/ko/concepts/multi-agent) -- 멀티 에이전트 아키텍처
- [Gateway 구성](/ko/gateway/configuration) -- 세션 도구 config 설정

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 pruning](/ko/concepts/session-pruning)
