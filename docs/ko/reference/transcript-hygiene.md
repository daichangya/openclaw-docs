---
read_when:
    - transcript 형태와 연결된 provider 요청 거부를 디버깅하는 경우
    - transcript 정리 또는 tool-call 복구 로직을 변경하는 경우
    - provider 간 tool-call ID 불일치를 조사하는 경우
summary: '참조: provider별 transcript 정리 및 복구 규칙'
title: transcript 위생
x-i18n:
    generated_at: "2026-04-24T06:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript Hygiene (Provider Fixups)

이 문서는 실행 전(모델 컨텍스트 빌드 시) transcript에 적용되는 **provider별 수정**을 설명합니다. 이는 엄격한 provider 요구 사항을 만족시키기 위해 사용하는 **메모리 내** 조정입니다. 이러한 hygiene 단계는 디스크에 저장된 JSONL transcript를 다시 쓰지 **않습니다**. 다만 별도의 세션 파일 복구 패스는 세션이 로드되기 전에 유효하지 않은 줄을 제거하여 잘못된 JSONL 파일을 다시 쓸 수 있습니다. 복구가 발생하면 원본 파일은 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다.

- Tool call ID 정리
- Tool call 입력 검증
- Tool result 페어링 복구
- 턴 검증 / 순서 정리
- Thought signature 정리
- 이미지 payload 정리
- 사용자 입력 provenance 태깅(세션 간 라우팅된 프롬프트용)

transcript 저장 세부 정보가 필요하면 다음을 참조하세요.

- [/reference/session-management-compaction](/ko/reference/session-management-compaction)

---

## 실행 위치

모든 transcript hygiene는 임베디드 실행기에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

transcript hygiene와는 별도로, 세션 파일은 로드 전에 필요 시 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts`와 `compact.ts`(임베디드 실행기)에서 호출됨

---

## 전역 규칙: 이미지 정리

provider 측 크기 제한으로 인한 거부를 방지하기 위해 이미지 payload는 항상 정리됩니다
(과도한 base64 이미지 축소/재압축).

이는 또한 vision-capable 모델에서 이미지 기반 토큰 압박을 제어하는 데 도움이 됩니다.
최대 이미지 크기를 낮추면 일반적으로 토큰 사용량이 줄고, 크기를 높이면 더 많은 세부 정보를 보존합니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 한 변 크기는 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)로 구성 가능

---

## 전역 규칙: 잘못된 tool call

`input`과 `arguments`가 모두 없는 assistant tool-call 블록은
모델 컨텍스트가 빌드되기 전에 제거됩니다. 이렇게 하면 부분적으로
저장된 tool call(예: rate limit 실패 후)로 인한 provider 거부를 방지할 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 provenance

에이전트가 `sessions_send`를 통해 프롬프트를 다른 세션으로 보낼 때(에이전트 간 reply/announce 단계 포함),
OpenClaw는 생성된 사용자 턴을 다음과 함께 저장합니다.

- `message.provenance.kind = "inter_session"`

이 메타데이터는 transcript append 시점에 기록되며 역할은 변경하지 않습니다
(`role: "user"`는 provider 호환성을 위해 유지됨). transcript reader는
이를 사용해 라우팅된 내부 프롬프트를 최종 사용자 작성 지침으로 취급하지 않을 수 있습니다.

컨텍스트 재구성 중에 OpenClaw는 모델이 이를
외부 최종 사용자 지침과 구분할 수 있도록 메모리 내에서 해당 사용자 턴 앞에
짧은 `[Inter-session message]` 마커를 추가합니다.

---

## Provider 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 수행
- OpenAI Responses/Codex transcript에서는 고아 reasoning signature(뒤따르는 콘텐츠 블록 없이 독립된 reasoning 항목) 제거
- Tool call ID 정리 없음
- Tool result 페어링 복구 없음
- 턴 검증 또는 순서 재정렬 없음
- synthetic tool result 없음
- thought signature 제거 없음

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call ID 정리: 엄격한 영숫자만 허용
- Tool result 페어링 복구 및 synthetic tool result
- 턴 검증(Gemini 스타일 턴 교대)
- Google 턴 순서 수정(history가 assistant로 시작하면 작은 사용자 bootstrap을 앞에 추가)
- Antigravity Claude: thinking signature 정규화, 서명되지 않은 thinking 블록 제거

**Anthropic / Minimax (Anthropic 호환)**

- Tool result 페어링 복구 및 synthetic tool result
- 턴 검증(엄격한 교대를 만족시키기 위해 연속된 사용자 턴 병합)

**Mistral (model-id 기반 감지 포함)**

- Tool call ID 정리: strict9 (길이 9의 영숫자)

**OpenRouter Gemini**

- Thought signature 정리: base64가 아닌 `thought_signature` 값 제거(base64는 유지)

**그 외 모두**

- 이미지 정리만 수행

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 전에는 OpenClaw가 transcript hygiene를 여러 계층에서 적용했습니다.

- 모든 컨텍스트 빌드마다 **transcript-sanitize extension**이 실행되었고, 다음을 수행할 수 있었습니다.
  - Tool use/result 페어링 복구
  - Tool call ID 정리(`_`/`-`를 보존하는 non-strict 모드 포함)
- 실행기도 provider별 정리를 수행했으며, 이는 작업을 중복했습니다.
- provider 정책 외부에서도 추가 변형이 발생했습니다. 예:
  - persistence 전에 assistant 텍스트에서 `<final>` 태그 제거
  - 빈 assistant 오류 턴 제거
  - tool call 이후 assistant 콘텐츠 trim

이 복잡성은 provider 간 회귀를 일으켰습니다(특히 `openai-responses`
`call_id|fc_id` 페어링). 2026.1.22 정리에서는 extension을 제거하고,
로직을 실행기에 중앙화했으며, OpenAI는 이미지 정리를 제외하고 **손대지 않는** 방식이 되었습니다.

## 관련

- [세션 관리](/ko/concepts/session)
- [세션 pruning](/ko/concepts/session-pruning)
