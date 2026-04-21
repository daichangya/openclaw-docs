---
read_when:
    - 사고 수준, 빠른 모드, 또는 자세한 출력 지시문 파싱이나 기본값 조정
summary: '`/think`, `/fast`, `/verbose`, `/trace`의 지시문 구문과 추론 표시 여부'
title: 사고 수준
x-i18n:
    generated_at: "2026-04-21T19:21:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# 사고 수준(`/think` 지시문)

## 기능

- 모든 수신 본문에서 인라인 지시문 사용 가능: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`.
- 수준(별칭):
  `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (최대 예산)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex 모델 및 Anthropic Claude Opus 4.7 effort)
  - adaptive → 제공자 관리형 적응형 사고(Anthropic/Bedrock의 Claude 4.6 및 Anthropic Claude Opus 4.7에서 지원)
  - max → 제공자 최대 추론(현재 Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`는 `high`로 매핑됩니다.
- 제공자 참고 사항:
  - 사고 메뉴와 선택기는 제공자 프로필 기반입니다. 제공자 Plugin이 선택된 모델에 대한 정확한 수준 집합을 선언하며, 이때 이진 `on` 같은 라벨도 포함됩니다.
  - `adaptive`, `xhigh`, `max`는 해당 기능을 지원하는 제공자/모델 프로필에만 표시됩니다. 지원되지 않는 수준을 입력한 지시문은 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 기존에 저장된 미지원 수준은 제공자 프로필 순위에 따라 다시 매핑됩니다. `adaptive`는 비적응형 모델에서 `medium`으로 대체되고, `xhigh`와 `max`는 선택한 모델이 지원하는 가장 큰 비-`off` 수준으로 대체됩니다.
  - Anthropic Claude 4.6 모델은 명시적인 사고 수준이 설정되지 않은 경우 기본값으로 `adaptive`를 사용합니다.
  - Anthropic Claude Opus 4.7은 기본값으로 적응형 사고를 사용하지 않습니다. API effort 기본값은 사고 수준을 명시적으로 설정하지 않는 한 계속 제공자 소유입니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh`를 적응형 사고와 `output_config.effort: "xhigh"`로 매핑합니다. `/think`는 사고 지시문이고 `xhigh`는 Opus 4.7의 effort 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7은 `/think max`도 노출하며, 이는 동일한 제공자 소유 최대 effort 경로로 매핑됩니다.
  - OpenAI GPT 모델은 모델별 Responses API effort 지원을 통해 `/think`를 매핑합니다. `/think off`는 대상 모델이 지원할 때만 `reasoning.effort: "none"`을 전송하며, 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내지 않고 비활성화된 추론 payload를 생략합니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax(`minimax/*`)는 모델 params 또는 요청 params에서 사고를 명시적으로 설정하지 않는 한 기본값으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 MiniMax의 비원시 Anthropic 스트림 형식에서 `reasoning_content` delta가 새는 것을 방지할 수 있습니다.
  - Z.AI(`zai/*`)는 이진 사고(`on`/`off`)만 지원합니다. `off`가 아닌 모든 수준은 `on`으로 처리되며(`low`로 매핑됨) 처리됩니다.
  - Moonshot(`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 모든 수준을 `thinking: { type: "enabled" }`로 매핑합니다. 사고가 활성화되어 있을 때 Moonshot은 `tool_choice`로 `auto|none`만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 해석 순서

1. 메시지의 인라인 지시문(해당 메시지에만 적용).
2. 세션 재정의(지시문만 있는 메시지를 보내 설정).
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`).
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`).
5. 대체값: 가능하면 제공자가 선언한 기본값, 그 외 추론 가능으로 표시된 catalog 모델은 `low`, 아니면 `off`.

## 세션 기본값 설정

- **지시문만** 있는 메시지를 보내세요(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 그러면 현재 세션의 기본값으로 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 유휴 초기화로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 잘못된 경우(예: `/thinking big`) 명령은 힌트와 함께 거부되며 세션 상태는 변경되지 않습니다.
- 현재 사고 수준을 보려면 인수 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **내장 Pi**: 해석된 수준이 프로세스 내 Pi 에이전트 런타임으로 전달됩니다.

## 빠른 모드(`/fast`)

- 수준: `on|off`.
- 지시문만 있는 메시지는 세션 fast-mode 재정의를 전환하고 `Fast mode enabled.` / `Fast mode disabled.`로 응답합니다.
- 현재 유효한 fast-mode 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 fast mode를 다음 순서로 해석합니다.
  1. 인라인/지시문 전용 `/fast on|off`
  2. 세션 재정의
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 대체값: `off`
- `openai/*`에서 fast mode는 지원되는 Responses 요청에 `service_tier=priority`를 보내 OpenAI 우선 처리로 매핑됩니다.
- `openai-codex/*`에서 fast mode는 Codex Responses에도 동일한 `service_tier=priority` 플래그를 보냅니다. OpenClaw는 두 인증 경로 모두에서 하나의 공유 `/fast` 토글을 유지합니다.
- 직접 공개 `anthropic/*` 요청에서는, `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함해, fast mode가 Anthropic service tier로 매핑됩니다. `/fast on`은 `service_tier=auto`, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서는 `/fast on`(또는 `params.fastMode: true`)이 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 명시적인 Anthropic `serviceTier` / `service_tier` 모델 params는 둘 다 설정된 경우 fast-mode 기본값보다 우선합니다. OpenClaw는 여전히 Anthropic이 아닌 프록시 base URL에 대해서는 Anthropic service-tier 주입을 건너뜁니다.

## 자세한 출력 지시문(`/verbose` 또는 `/v`)

- 수준: `on`(최소) | `full` | `off`(기본값).
- 지시문만 있는 메시지는 세션 verbose를 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 잘못된 수준은 상태를 바꾸지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 재정의를 저장합니다. Sessions UI에서 `inherit`를 선택해 이를 해제하세요.
- 인라인 지시문은 해당 메시지에만 적용되며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 verbose 수준을 보려면 인수 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- verbose가 켜져 있으면, 구조화된 도구 결과를 내보내는 에이전트(Pi, 기타 JSON 에이전트)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>`(경로/명령) 접두사가 붙습니다. 이러한 도구 요약은 각 도구가 시작되는 즉시 전송되며(별도 버블), 스트리밍 delta로 전송되지는 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 상세 접미사는 verbose가 `on` 또는 `full`일 때만 표시됩니다.
- verbose가 `full`이면, 도구 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행 도중 `/verbose on|full|off`를 전환하면 이후 도구 버블은 새 설정을 따릅니다.

## Plugin trace 지시문(`/trace`)

- 수준: `on` | `off`(기본값).
- 지시문만 있는 메시지는 세션 Plugin trace 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 지시문은 해당 메시지에만 적용되며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 trace 수준을 보려면 인수 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유 trace/debug 줄만 노출합니다.
- trace 줄은 `/status`에 나타날 수 있으며, 일반 어시스턴트 응답 뒤에 후속 진단 메시지로도 나타날 수 있습니다.

## 추론 표시 여부(`/reasoning`)

- 수준: `on|off|stream`.
- 지시문만 있는 메시지는 응답에서 사고 블록을 표시할지 전환합니다.
- 활성화되면 추론은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram 전용): 응답 생성 중 추론을 Telegram draft 버블에 스트리밍한 뒤, 최종 답변은 추론 없이 전송합니다.
- 별칭: `/reason`.
- 현재 추론 수준을 보려면 인수 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 해석 순서: 인라인 지시문, 세션 재정의, 에이전트별 기본값(`agents.list[].reasoningDefault`), 대체값(`off`).

## 관련 항목

- Elevated mode 문서는 [Elevated mode](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat probe 본문은 구성된 heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). heartbeat 메시지의 인라인 지시문은 평소처럼 적용되지만(단, heartbeat에서 세션 기본값을 바꾸는 것은 피하세요).
- Heartbeat 전달은 기본적으로 최종 payload만 보냅니다. 별도의 `Reasoning:` 메시지(가능한 경우)도 함께 보내려면 `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 사고 선택기는 페이지가 로드될 때 수신 세션 저장소/구성에 저장된 세션 수준을 그대로 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 즉시 세션 재정의를 기록합니다. 다음 전송까지 기다리지 않으며, 일회성 `thinkingOnce` 재정의도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 여기서 해석된 기본값은 활성 세션 모델의 제공자 사고 프로필에서 가져옵니다.
- 선택기는 gateway session row가 반환한 `thinkingOptions`를 사용합니다. 브라우저 UI는 자체 제공자 regex 목록을 유지하지 않으며, 모델별 수준 집합은 Plugin이 소유합니다.
- `/think:<level>`도 계속 동작하며 동일한 저장된 세션 수준을 갱신하므로, 채팅 지시문과 선택기는 동기화된 상태를 유지합니다.

## 제공자 프로필

- 제공자 Plugin은 모델이 지원하는 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)`를 노출할 수 있습니다.
- 각 프로필 수준에는 저장되는 정규 `id`(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, 또는 `max`)가 있으며, 표시용 `label`을 포함할 수도 있습니다. 이진 제공자는 `{ id: "low", label: "on" }`를 사용합니다.
- 공개된 레거시 훅(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 계속 유지되지만, 새로운 사용자 정의 수준 집합에는 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행은 `thinkingOptions`와 `thinkingDefault`를 노출하므로 ACP/채팅 클라이언트는 런타임 검증에 사용되는 것과 동일한 프로필을 렌더링할 수 있습니다.
