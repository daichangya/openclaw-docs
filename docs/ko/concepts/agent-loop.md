---
read_when:
    - 에이전트 루프 또는 수명 주기 이벤트에 대한 정확한 안내가 필요합니다
    - 세션 대기열 처리, 트랜스크립트 쓰기 또는 세션 쓰기 잠금 동작을 변경하고 있습니다
summary: 에이전트 루프 수명 주기, 스트림 및 대기 의미 체계
title: 에이전트 루프
x-i18n:
    generated_at: "2026-04-23T06:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 에이전트 루프 (OpenClaw)

에이전트형 루프는 에이전트의 전체 “실제” 실행입니다: 입력 수집 → 컨텍스트 조립 → 모델 추론 →
도구 실행 → 응답 스트리밍 → 영속화. 이는 메시지를 작업과 최종 응답으로 바꾸는 권위 있는 경로이며,
동시에 세션 상태의 일관성을 유지합니다.

OpenClaw에서 루프는 세션당 단일 직렬화 실행이며, 모델이 생각하고, 도구를 호출하고, 출력을 스트리밍하는 동안
수명 주기 및 스트림 이벤트를 내보냅니다. 이 문서는 그 실제 루프가 종단 간으로 어떻게 연결되어 있는지 설명합니다.

## 진입점

- Gateway RPC: `agent` 및 `agent.wait`.
- CLI: `agent` 명령.

## 동작 방식(상위 수준)

1. `agent` RPC가 매개변수를 검증하고, 세션(sessionKey/sessionId)을 확인하고, 세션 메타데이터를 영속화한 뒤, 즉시 `{ runId, acceptedAt }`를 반환합니다.
2. `agentCommand`가 에이전트를 실행합니다:
   - 모델 + thinking/verbose/trace 기본값을 확인합니다
   - Skills 스냅샷을 로드합니다
   - `runEmbeddedPiAgent`를 호출합니다(pi-agent-core 런타임)
   - 내장 루프가 이를 내보내지 않으면 **수명 주기 end/error**를 내보냅니다
3. `runEmbeddedPiAgent`:
   - 세션별 + 전역 큐를 통해 실행을 직렬화합니다
   - 모델 + 인증 프로필을 확인하고 pi 세션을 구성합니다
   - pi 이벤트를 구독하고 assistant/tool 델타를 스트리밍합니다
   - 제한 시간을 강제하고, 초과 시 실행을 중단합니다
   - payload와 usage 메타데이터를 반환합니다
4. `subscribeEmbeddedPiSession`이 pi-agent-core 이벤트를 OpenClaw `agent` 스트림으로 연결합니다:
   - 도구 이벤트 => `stream: "tool"`
   - assistant 델타 => `stream: "assistant"`
   - 수명 주기 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentRun`을 사용합니다:
   - `runId`에 대한 **수명 주기 end/error**를 기다립니다
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }`를 반환합니다

## 대기열 처리 + 동시성

- 실행은 세션 키(세션 레인)별로 직렬화되며, 선택적으로 전역 레인을 통해서도 직렬화됩니다.
- 이는 도구/세션 경합을 방지하고 세션 기록의 일관성을 유지합니다.
- 메시징 채널은 이 레인 시스템으로 연결되는 대기열 모드(collect/steer/followup)를 선택할 수 있습니다.
  자세한 내용은 [Command Queue](/ko/concepts/queue)를 참조하세요.
- 트랜스크립트 쓰기도 세션 파일에 대한 세션 쓰기 잠금으로 보호됩니다. 이 잠금은
  프로세스를 인식하며 파일 기반이므로, 프로세스 내 대기열을 우회하거나 다른 프로세스에서 오는 작성자도
  포착합니다.
- 세션 쓰기 잠금은 기본적으로 재진입이 불가능합니다. 도우미가 동일한 잠금을 중첩 획득하면서도
  하나의 논리적 작성자를 유지하려는 경우, 반드시 `allowReentrant: true`로
  명시적으로 opt-in해야 합니다.

## 세션 + 워크스페이스 준비

- 워크스페이스를 확인하고 생성합니다. 샌드박스 실행은 샌드박스 워크스페이스 루트로 리디렉션될 수 있습니다.
- Skills를 로드하거나(또는 스냅샷에서 재사용하고) env와 프롬프트에 주입합니다.
- 부트스트랩/컨텍스트 파일을 확인하고 시스템 프롬프트 보고서에 주입합니다.
- 세션 쓰기 잠금을 획득하고, 스트리밍 전에 `SessionManager`를 열어 준비합니다. 이후의 모든
  트랜스크립트 재작성, Compaction 또는 잘라내기 경로는 트랜스크립트 파일을 열거나 변경하기 전에
  반드시 동일한 잠금을 획득해야 합니다.

## 프롬프트 조립 + 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw의 기본 프롬프트, Skills 프롬프트, 부트스트랩 컨텍스트, 실행별 재정의를 바탕으로 구성됩니다.
- 모델별 제한과 Compaction 예약 토큰이 강제 적용됩니다.
- 모델이 무엇을 보는지에 대해서는 [System prompt](/ko/concepts/system-prompt)를 참조하세요.

## Hook 지점(가로챌 수 있는 위치)

OpenClaw에는 두 가지 Hook 시스템이 있습니다:

- **내부 Hook**(Gateway Hooks): 명령 및 수명 주기 이벤트를 위한 이벤트 기반 스크립트.
- **Plugin Hook**: 에이전트/도구 수명 주기 및 gateway 파이프라인 내부의 확장 지점.

### 내부 Hook(Gateway Hooks)

- **`agent:bootstrap`**: 시스템 프롬프트가 최종 확정되기 전에 부트스트랩 파일을 구성하는 동안 실행됩니다.
  부트스트랩 컨텍스트 파일을 추가/제거할 때 사용합니다.
- **명령 Hook**: `/new`, `/reset`, `/stop` 및 기타 명령 이벤트(Hooks 문서 참조).

설정 및 예시는 [Hooks](/ko/automation/hooks)를 참조하세요.

### Plugin Hook(에이전트 + gateway 수명 주기)

이 Hook들은 에이전트 루프 또는 gateway 파이프라인 내부에서 실행됩니다:

- **`before_model_resolve`**: 세션 전(`messages` 없음)에 실행되어, 모델 확인 전에 provider/model을 결정적으로 재정의합니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함)에 실행되어, 프롬프트 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext` 또는 `appendSystemContext`를 주입합니다. 턴별 동적 텍스트에는 `prependContext`를 사용하고, 시스템 프롬프트 영역에 위치해야 하는 안정적인 지침에는 system-context 필드를 사용하세요.
- **`before_agent_start`**: 레거시 호환성 Hook으로, 어느 단계에서든 실행될 수 있습니다. 가능하면 위의 명시적 Hook를 우선 사용하세요.
- **`before_agent_reply`**: 인라인 작업 후, LLM 호출 전에 실행되며, Plugin이 해당 턴을 점유하고 합성 응답을 반환하거나 턴을 완전히 무음 처리할 수 있게 합니다.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 메타데이터를 검사합니다.
- **`before_compaction` / `after_compaction`**: Compaction 주기를 관찰하거나 주석을 추가합니다.
- **`before_tool_call` / `after_tool_call`**: 도구 매개변수/결과를 가로챕니다.
- **`before_install`**: 기본 제공 스캔 결과를 검사하고 Skills 또는 Plugin 설치를 선택적으로 차단합니다.
- **`tool_result_persist`**: 도구 결과가 세션 트랜스크립트에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 수신 + 발신 메시지 Hook.
- **`session_start` / `session_end`**: 세션 수명 주기 경계.
- **`gateway_start` / `gateway_stop`**: gateway 수명 주기 이벤트.

발신/도구 가드용 Hook 결정 규칙:

- `before_tool_call`: `{ block: true }`는 종료 신호이며, 더 낮은 우선순위의 핸들러를 중단합니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 기존 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료 신호이며, 더 낮은 우선순위의 핸들러를 중단합니다.
- `before_install`: `{ block: false }`는 no-op이며, 기존 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료 신호이며, 더 낮은 우선순위의 핸들러를 중단합니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 기존 cancel을 해제하지 않습니다.

Hook API 및 등록 세부 정보는 [Plugin hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.

## 스트리밍 + 부분 응답

- Assistant 델타는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 내보내집니다.
- 블록 스트리밍은 `text_end` 또는 `message_end`에서 부분 응답을 내보낼 수 있습니다.
- 추론 스트리밍은 별도 스트림으로 또는 블록 응답으로 내보낼 수 있습니다.
- 청킹 및 블록 응답 동작은 [Streaming](/ko/concepts/streaming)을 참조하세요.

## 도구 실행 + 메시징 도구

- 도구 시작/업데이트/종료 이벤트는 `tool` 스트림에서 내보내집니다.
- 도구 결과는 로깅/내보내기 전에 크기 및 이미지 payload에 대해 정리됩니다.
- 메시징 도구 전송은 중복된 assistant 확인 메시지를 억제하기 위해 추적됩니다.

## 응답 구성 + 억제

- 최종 payload는 다음으로 조립됩니다:
  - assistant 텍스트(및 선택적 추론)
  - 인라인 도구 요약(verbose이고 허용되는 경우)
  - 모델 오류 시 assistant 오류 텍스트
- 정확한 무음 토큰 `NO_REPLY` / `no_reply`는 발신
  payload에서 필터링됩니다.
- 메시징 도구 중복 항목은 최종 payload 목록에서 제거됩니다.
- 렌더링 가능한 payload가 하나도 남지 않고 도구에서 오류가 발생한 경우, 대체 도구 오류 응답이 내보내집니다
  (단, 메시징 도구가 이미 사용자에게 보이는 응답을 보낸 경우는 제외).

## Compaction + 재시도

- 자동 Compaction은 `compaction` 스트림 이벤트를 내보내며 재시도를 유발할 수 있습니다.
- 재시도 시, 중복 출력을 방지하기 위해 메모리 내 버퍼와 도구 요약이 초기화됩니다.
- Compaction 파이프라인은 [Compaction](/ko/concepts/compaction)을 참조하세요.

## 이벤트 스트림(현재)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 내보내며(또는 대체 경로로 `agentCommand`에서 내보냄)
- `assistant`: pi-agent-core의 스트리밍 델타
- `tool`: pi-agent-core의 스트리밍 도구 이벤트

## 채팅 채널 처리

- Assistant 델타는 채팅 `delta` 메시지로 버퍼링됩니다.
- 채팅 `final`은 **수명 주기 end/error**에서 내보내집니다.

## 제한 시간

- `agent.wait` 기본값: 30초(대기만 해당). `timeoutMs` 매개변수로 재정의할 수 있습니다.
- 에이전트 런타임: `agents.defaults.timeoutSeconds` 기본값은 172800초(48시간)이며, `runEmbeddedPiAgent`의 중단 타이머에서 강제 적용됩니다.
- LLM 유휴 제한 시간: `agents.defaults.llm.idleTimeoutSeconds`는 유휴 시간 창 안에 응답 청크가 도착하지 않으면 모델 요청을 중단합니다. 느린 로컬 모델 또는 추론/도구 호출 provider에는 이를 명시적으로 설정하세요. 비활성화하려면 0으로 설정하세요. 설정되지 않은 경우 OpenClaw는 `agents.defaults.timeoutSeconds`가 구성되어 있으면 이를 사용하고, 그렇지 않으면 120초를 사용합니다. 명시적인 LLM 또는 에이전트 제한 시간이 없는 Cron 트리거 실행은 유휴 감시를 비활성화하고 Cron 외부 제한 시간에 의존합니다.

## 조기 종료될 수 있는 지점

- 에이전트 제한 시간(중단)
- AbortSignal(취소)
- Gateway 연결 해제 또는 RPC 제한 시간
- `agent.wait` 제한 시간(대기만 해당하며, 에이전트를 중지하지는 않음)

## 관련 항목

- [Tools](/ko/tools) — 사용 가능한 에이전트 도구
- [Hooks](/ko/automation/hooks) — 에이전트 수명 주기 이벤트에 의해 트리거되는 이벤트 기반 스크립트
- [Compaction](/ko/concepts/compaction) — 긴 대화를 요약하는 방식
- [Exec Approvals](/ko/tools/exec-approvals) — 셸 명령에 대한 승인 게이트
- [Thinking](/ko/tools/thinking) — thinking/추론 수준 구성
