---
read_when:
    - thinking, fast-mode, 또는 verbose directive 파싱이나 기본값 조정하기
summary: '`/think`, `/fast`, `/verbose`, `/trace`, 그리고 추론 가시성을 위한 directive 문법'
title: Thinking 단계
x-i18n:
    generated_at: "2026-04-21T06:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fbcb2feb14331e000ae0bcb908f060dba0ce900d6628a42e87e98502b13f6e9
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking 단계 (`/think` directive)

## 수행하는 작업

- 어떤 수신 본문에서든 인라인 directive로 사용 가능: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`
- 단계(별칭): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (최대 예산)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex 모델 및 Anthropic Claude Opus 4.7 effort)
  - adaptive → provider가 관리하는 적응형 thinking(Anthropic/Bedrock의 Claude 4.6 및 Anthropic Claude Opus 4.7에서 지원)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`, `max`는 `high`로 매핑됩니다.
- provider 참고:
  - `adaptive`는 적응형 thinking 지원을 선언한 provider/모델에 대해서만 네이티브 명령 메뉴와 picker에 표시됩니다. 기존 구성 및 별칭과의 호환성을 위해 typed directive로는 계속 허용됩니다.
  - Anthropic Claude 4.6 모델은 명시적 thinking 단계가 설정되지 않으면 기본값이 `adaptive`입니다.
  - Anthropic Claude Opus 4.7은 기본적으로 adaptive thinking을 사용하지 않습니다. thinking 단계를 명시적으로 설정하지 않으면 API effort 기본값은 provider가 관리합니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh`를 adaptive thinking + `output_config.effort: "xhigh"`로 매핑합니다. `/think`는 thinking directive이고 `xhigh`는 Opus 4.7 effort 설정이기 때문입니다.
  - OpenAI GPT 모델은 `/think`를 모델별 Responses API effort 지원에 따라 매핑합니다. `/think off`는 대상 모델이 이를 지원할 때만 `reasoning.effort: "none"`을 전송하며, 그렇지 않으면 지원되지 않는 값을 보내는 대신 OpenClaw가 비활성화된 reasoning payload를 생략합니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax(`minimax/*`)는 모델 params나 요청 params에서 thinking을 명시적으로 설정하지 않는 한 기본적으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 MiniMax의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` delta가 새는 것을 방지할 수 있습니다.
  - Z.AI(`zai/*`)는 이진 thinking(`on`/`off`)만 지원합니다. `off`가 아닌 모든 단계는 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot(`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 모든 단계는 `thinking: { type: "enabled" }`로 매핑합니다. thinking이 활성화되면 Moonshot는 `tool_choice`로 `auto|none`만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 해석 순서

1. 메시지의 인라인 directive(해당 메시지에만 적용)
2. 세션 override(directive만 포함한 메시지를 보내 설정)
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`)
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`)
5. fallback: Anthropic Claude 4.6 모델은 `adaptive`, Anthropic Claude Opus 4.7은 명시적으로 구성되지 않으면 `off`, 다른 reasoning 가능 모델은 `low`, 그 외에는 `off`

## 세션 기본값 설정

- **directive만** 있는 메시지를 보내세요(공백 허용). 예: `/think:medium` 또는 `/t high`
- 현재 세션에 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 idle reset으로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 단계가 잘못되면(예: `/thinking big`) 힌트와 함께 명령이 거부되며 세션 상태는 변경되지 않습니다.
- 현재 thinking 단계를 보려면 인수 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **임베디드 Pi**: 해석된 단계가 프로세스 내 Pi 에이전트 런타임에 전달됩니다.

## Fast 모드 (`/fast`)

- 단계: `on|off`
- directive만 있는 메시지는 세션 fast-mode override를 전환하고 `Fast mode enabled.` / `Fast mode disabled.`로 응답합니다.
- 현재 유효한 fast-mode 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 다음 순서로 fast mode를 해석합니다:
  1. 인라인/directive-only `/fast on|off`
  2. 세션 override
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. fallback: `off`
- `openai/*`의 경우, fast mode는 지원되는 Responses 요청에서 `service_tier=priority`를 전송하여 OpenAI priority 처리로 매핑됩니다.
- `openai-codex/*`의 경우에도 fast mode는 Codex Responses에서 동일한 `service_tier=priority` 플래그를 전송합니다. OpenClaw는 두 인증 경로 모두에서 하나의 공통 `/fast` 토글을 유지합니다.
- `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 공개 `anthropic/*` 요청의 경우, fast mode는 Anthropic service tier로 매핑됩니다: `/fast on`은 `service_tier=auto`, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서는 `/fast on`(또는 `params.fastMode: true`)이 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 둘 다 설정된 경우 명시적 Anthropic `serviceTier` / `service_tier` 모델 params가 fast-mode 기본값보다 우선합니다. OpenClaw는 여전히 Anthropic이 아닌 프록시 base URL에 대해서는 Anthropic service-tier 주입을 건너뜁니다.

## Verbose directive (`/verbose` 또는 `/v`)

- 단계: `on` (minimal) | `full` | `off` (기본값)
- directive만 있는 메시지는 세션 verbose를 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 잘못된 단계는 상태를 변경하지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적 세션 override를 저장합니다. Sessions UI에서 `inherit`를 선택해 해제하세요.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 verbose 단계를 보려면 인수 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- verbose가 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트(Pi, 기타 JSON 에이전트)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>` 형식(path/command) 접두사가 붙습니다. 이 도구 요약은 각 도구가 시작되자마자 전송되며(별도 버블), 스트리밍 delta로 보내지지 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 보이지만, 원시 오류 세부 suffix는 verbose가 `on` 또는 `full`이 아닐 경우 숨겨집니다.
- verbose가 `full`이면 도구 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행 중인 상태에서 `/verbose on|full|off`를 전환하면 이후 도구 버블은 새 설정을 따릅니다.

## Plugin trace directive (`/trace`)

- 단계: `on` | `off` (기본값)
- directive만 있는 메시지는 세션 Plugin trace 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 trace 단계를 보려면 인수 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유 trace/debug 줄만 노출합니다.
- trace 줄은 `/status`에 나타나거나 일반 assistant 응답 뒤의 후속 진단 메시지로 나타날 수 있습니다.

## 추론 가시성 (`/reasoning`)

- 단계: `on|off|stream`
- directive만 있는 메시지는 응답에서 thinking 블록을 표시할지 전환합니다.
- 활성화되면 reasoning은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram 전용): 응답 생성 중 reasoning을 Telegram 초안 버블로 스트리밍한 뒤, 최종 답변은 reasoning 없이 전송합니다.
- 별칭: `/reason`
- 현재 reasoning 단계를 보려면 인수 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 해석 순서: 인라인 directive, 세션 override, 에이전트별 기본값(`agents.list[].reasoningDefault`), fallback(`off`)

## 관련 항목

- Elevated mode 문서는 [Elevated mode](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat 프로브 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 directive는 평소처럼 적용되지만(Heartbeat에서 세션 기본값 변경은 피하세요).
- Heartbeat 전달은 기본적으로 최종 payload만 전송합니다. 별도의 `Reasoning:` 메시지도 함께 전송하려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지 로드 시 수신 세션 저장소/구성에 저장된 세션 단계를 그대로 반영합니다.
- 다른 단계를 선택하면 `sessions.patch`를 통해 즉시 세션 override를 기록하며, 다음 전송까지 기다리지 않고 일회성 `thinkingOnce` override도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 해석된 기본값은 활성 세션 모델에서 가져옵니다: Anthropic의 Claude 4.6은 `adaptive`, Anthropic Claude Opus 4.7은 구성되지 않으면 `off`, 다른 reasoning 가능 모델은 `low`, 그 외에는 `off`
- picker는 계속 provider 인지형으로 동작합니다:
  - 대부분의 provider는 `off | minimal | low | medium | high`를 표시
  - Anthropic/Bedrock Claude 4.6은 `off | minimal | low | medium | high | adaptive`를 표시
  - Anthropic Claude Opus 4.7은 `off | minimal | low | medium | high | xhigh | adaptive`를 표시
  - Z.AI는 이진 `off | on`을 표시
- `/think:<level>`도 계속 동작하며 같은 저장된 세션 단계를 업데이트하므로 채팅 directive와 picker는 동기화된 상태를 유지합니다.
