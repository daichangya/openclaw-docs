---
read_when:
    - 에이전트 루프 또는 라이프사이클 이벤트에 대한 정확한 설명이 필요합니다.
    - 세션 큐잉, transcript 쓰기 또는 세션 쓰기 잠금 동작을 변경하는 중입니다.
summary: 에이전트 루프 라이프사이클, 스트림 및 대기 시맨틱
title: 에이전트 루프
x-i18n:
    generated_at: "2026-04-24T06:09:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 에이전트 루프(OpenClaw)

에이전트 루프는 에이전트의 전체 “실제” 실행입니다: 입력 수집 → 컨텍스트 조립 → 모델 추론 →
도구 실행 → 응답 스트리밍 → 영속화. 이는 메시지를 작업과 최종 응답으로 바꾸는 권한 있는 경로이며,
동시에 세션 상태의 일관성을 유지합니다.

OpenClaw에서 루프는 세션당 단일 직렬 실행이며, 모델이 생각하고, 도구를 호출하고, 출력을 스트리밍하는 동안
라이프사이클 및 스트림 이벤트를 방출합니다. 이 문서는 그 실제 루프가 종단 간 어떻게 연결되는지 설명합니다.

## 진입점

- Gateway RPC: `agent` 및 `agent.wait`
- CLI: `agent` 명령

## 동작 방식(상위 수준)

1. `agent` RPC는 파라미터를 검증하고, 세션(sessionKey/sessionId)을 해석하고, 세션 메타데이터를 영속화한 뒤, 즉시 `{ runId, acceptedAt }`를 반환합니다.
2. `agentCommand`가 에이전트를 실행합니다:
   - 모델 + thinking/verbose/trace 기본값 해석
   - Skills 스냅샷 로드
   - `runEmbeddedPiAgent` 호출(pi-agent-core 런타임)
   - 내장 루프가 방출하지 않을 경우 **라이프사이클 end/error** 방출
3. `runEmbeddedPiAgent`:
   - 세션별 + 전역 큐를 통해 실행을 직렬화
   - 모델 + auth 프로필을 해석하고 pi 세션 빌드
   - pi 이벤트를 구독하고 assistant/tool delta 스트리밍
   - 타임아웃 강제 적용 -> 초과 시 실행 중단
   - payload 및 사용량 메타데이터 반환
4. `subscribeEmbeddedPiSession`은 pi-agent-core 이벤트를 OpenClaw `agent` 스트림으로 연결합니다:
   - tool 이벤트 => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - 라이프사이클 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentRun`을 사용합니다:
   - `runId`에 대한 **라이프사이클 end/error**를 대기
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` 반환

## 큐잉 + 동시성

- 실행은 세션 키별(세션 레인)로 직렬화되며, 선택적으로 전역 레인을 함께 통과합니다.
- 이는 도구/세션 경쟁 상태를 방지하고 세션 히스토리의 일관성을 유지합니다.
- 메시징 채널은 이 레인 시스템으로 연결되는 큐 모드(collect/steer/followup)를 선택할 수 있습니다.
  [Command Queue](/ko/concepts/queue)를 참고하세요.
- transcript 쓰기도 세션 파일에 대한 세션 쓰기 잠금으로 보호됩니다. 이 잠금은
  프로세스를 인식하는 파일 기반 방식이므로, 프로세스 내 큐를 우회하거나 다른 프로세스에서 오는 작성자도 잡아냅니다.
- 세션 쓰기 잠금은 기본적으로 재진입 불가입니다. 헬퍼가 동일한 잠금을 중첩 획득하면서도
  하나의 논리적 작성자를 유지하려면 `allowReentrant: true`로 명시적으로 opt-in해야 합니다.

## 세션 + 워크스페이스 준비

- 워크스페이스를 해석하고 생성합니다. 샌드박스 실행은 샌드박스 워크스페이스 루트로 리디렉션될 수 있습니다.
- Skills를 로드하고(또는 스냅샷에서 재사용하고) env 및 프롬프트에 주입합니다.
- Bootstrap/컨텍스트 파일을 해석하고 시스템 프롬프트 보고서에 주입합니다.
- 세션 쓰기 잠금을 획득하고, 스트리밍 전에 `SessionManager`를 열고 준비합니다. 이후의
  transcript 재작성, Compaction, 잘라내기 경로는 transcript 파일을 열거나 변경하기 전에 반드시 동일한 잠금을 획득해야 합니다.

## 프롬프트 조립 + 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw 기본 프롬프트, Skills 프롬프트, bootstrap 컨텍스트, 실행별 override로 구성됩니다.
- 모델별 제한과 Compaction reserve token이 강제됩니다.
- 모델이 실제로 보는 내용은 [System prompt](/ko/concepts/system-prompt)를 참고하세요.

## 훅 지점(가로챌 수 있는 위치)

OpenClaw에는 두 가지 훅 시스템이 있습니다.

- **내부 훅**(Gateway 훅): 명령 및 라이프사이클 이벤트용 이벤트 기반 스크립트
- **Plugin 훅**: 에이전트/도구 라이프사이클 및 gateway 파이프라인 내부의 확장 지점

### 내부 훅(Gateway 훅)

- **`agent:bootstrap`**: 시스템 프롬프트가 최종 확정되기 전에 bootstrap 파일을 구성하는 동안 실행됩니다.
  이를 사용해 bootstrap 컨텍스트 파일을 추가/제거할 수 있습니다.
- **명령 훅**: `/new`, `/reset`, `/stop` 및 기타 명령 이벤트(Hooks 문서 참고)

설정 및 예시는 [Hooks](/ko/automation/hooks)를 참고하세요.

### Plugin 훅(에이전트 + gateway 라이프사이클)

이 훅들은 에이전트 루프 또는 gateway 파이프라인 내부에서 실행됩니다.

- **`before_model_resolve`**: 세션 이전(`messages` 없음)에 실행되어 모델 해석 전에 provider/model을 결정적으로 override합니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함) 실행되어 프롬프트 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext`, `appendSystemContext`를 주입할 수 있습니다. 턴별 동적 텍스트에는 `prependContext`를 사용하고, 시스템 프롬프트 영역에 위치해야 하는 안정적인 지침에는 system-context 필드를 사용하세요.
- **`before_agent_start`**: 레거시 호환성 훅으로 어느 단계에서든 실행될 수 있습니다. 위의 명시적 훅을 우선 사용하세요.
- **`before_agent_reply`**: 인라인 action 이후, LLM 호출 전에 실행되며 Plugin이 해당 턴을 가져가서 합성 응답을 반환하거나 턴 전체를 완전히 무음 처리할 수 있습니다.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 메타데이터를 검사합니다.
- **`before_compaction` / `after_compaction`**: Compaction 사이클을 관찰하거나 주석을 추가합니다.
- **`before_tool_call` / `after_tool_call`**: 도구 파라미터/결과를 가로챕니다.
- **`before_install`**: 내장 스캔 결과를 검사하고 skill 또는 Plugin 설치를 선택적으로 차단합니다.
- **`tool_result_persist`**: 도구 결과가 OpenClaw 소유 세션 transcript에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 수신 + 발신 메시지 훅
- **`session_start` / `session_end`**: 세션 라이프사이클 경계
- **`gateway_start` / `gateway_stop`**: gateway 라이프사이클 이벤트

발신/도구 가드를 위한 훅 결정 규칙:

- `before_tool_call`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `before_tool_call`: `{ block: false }`는 아무 동작도 하지 않으며 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `before_install`: `{ block: false }`는 아무 동작도 하지 않으며 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `message_sending`: `{ cancel: false }`는 아무 동작도 하지 않으며 이전 cancel을 해제하지 않습니다.

훅 API 및 등록 세부 정보는 [Plugin hooks](/ko/plugins/architecture-internals#provider-runtime-hooks)를 참고하세요.

하네스는 이 훅들을 다르게 적용할 수 있습니다. Codex app-server 하네스는
문서화된 미러링 표면에 대한 호환성 계약으로 OpenClaw Plugin 훅을 유지하는 반면,
Codex 네이티브 훅은 별도의 더 낮은 수준 Codex 메커니즘으로 남아 있습니다.

## 스트리밍 + 부분 응답

- assistant delta는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 방출됩니다.
- 블록 스트리밍은 `text_end` 또는 `message_end`에서 부분 응답을 방출할 수 있습니다.
- reasoning 스트리밍은 별도 스트림으로 또는 블록 응답 형태로 방출될 수 있습니다.
- chunking 및 블록 응답 동작은 [Streaming](/ko/concepts/streaming)을 참고하세요.

## 도구 실행 + 메시징 도구

- 도구 시작/업데이트/종료 이벤트는 `tool` 스트림으로 방출됩니다.
- 도구 결과는 로깅/방출 전에 크기와 이미지 payload 기준으로 정리됩니다.
- 메시징 도구 전송은 중복 assistant 확인 메시지를 억제하기 위해 추적됩니다.

## 응답 형성 + 억제

- 최종 payload는 다음으로 조립됩니다:
  - assistant 텍스트(및 선택적 reasoning)
  - 인라인 도구 요약(verbose + 허용 시)
  - 모델 오류 발생 시 assistant 오류 텍스트
- 정확히 `NO_REPLY` / `no_reply`인 무음 token은 발신
  payload에서 필터링됩니다.
- 메시징 도구 중복 항목은 최종 payload 목록에서 제거됩니다.
- 렌더링 가능한 payload가 하나도 남지 않고 도구 오류가 발생했다면, fallback 도구 오류 응답이 방출됩니다
  (메시징 도구가 이미 사용자에게 보이는 응답을 보낸 경우는 제외).

## Compaction + 재시도

- 자동 Compaction은 `compaction` 스트림 이벤트를 방출하며 재시도를 유발할 수 있습니다.
- 재시도 시 중복 출력을 피하기 위해 메모리 내 버퍼와 도구 요약이 초기화됩니다.
- Compaction 파이프라인은 [Compaction](/ko/concepts/compaction)을 참고하세요.

## 이벤트 스트림(현재)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 방출(그리고 fallback으로 `agentCommand`에서도 방출)
- `assistant`: pi-agent-core의 스트리밍 delta
- `tool`: pi-agent-core의 스트리밍 도구 이벤트

## 채팅 채널 처리

- assistant delta는 채팅 `delta` 메시지로 버퍼링됩니다.
- 채팅 `final`은 **라이프사이클 end/error**에서 방출됩니다.

## 타임아웃

- `agent.wait` 기본값: 30초(대기만). `timeoutMs` 파라미터로 override할 수 있습니다.
- 에이전트 런타임: `agents.defaults.timeoutSeconds` 기본값 172800초(48시간). `runEmbeddedPiAgent`의 abort timer에서 강제됩니다.
- LLM 유휴 타임아웃: `agents.defaults.llm.idleTimeoutSeconds`는 유휴 시간 창 안에 응답 chunk가 도착하지 않으면 모델 요청을 중단합니다. 느린 로컬 모델이나 reasoning/tool-call provider에는 명시적으로 설정하세요. 비활성화하려면 0으로 설정하세요. 설정되지 않으면 OpenClaw는 `agents.defaults.timeoutSeconds`가 구성된 경우 이를 사용하고, 그렇지 않으면 120초를 사용합니다. 명시적 LLM 또는 에이전트 타임아웃이 없는 Cron 트리거 실행은 유휴 watchdog을 비활성화하고 Cron 외부 타임아웃에 의존합니다.

## 조기 종료될 수 있는 지점

- 에이전트 타임아웃(abort)
- AbortSignal(cancel)
- Gateway 연결 해제 또는 RPC 타임아웃
- `agent.wait` 타임아웃(대기만 종료하며 에이전트 자체는 중지하지 않음)

## 관련

- [Tools](/ko/tools) — 사용 가능한 에이전트 도구
- [Hooks](/ko/automation/hooks) — 에이전트 라이프사이클 이벤트에 의해 트리거되는 이벤트 기반 스크립트
- [Compaction](/ko/concepts/compaction) — 긴 대화를 요약하는 방법
- [Exec Approvals](/ko/tools/exec-approvals) — 셸 명령 승인 게이트
- [Thinking](/ko/tools/thinking) — thinking/reasoning 수준 구성
