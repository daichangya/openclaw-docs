---
read_when:
    - 채널에서 스트리밍 또는 청크 분할이 어떻게 동작하는지 설명하기
    - 블록 스트리밍 또는 채널 청크 분할 동작 변경하기
    - 중복/조기 블록 응답 또는 채널 프리뷰 스트리밍 디버깅하기
summary: 스트리밍 + 청크 분할 동작(블록 응답, 채널 프리뷰 스트리밍, 모드 매핑)
title: 스트리밍 및 청크 분할
x-i18n:
    generated_at: "2026-04-24T06:12:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# 스트리밍 + 청크 분할

OpenClaw에는 서로 분리된 두 개의 스트리밍 계층이 있습니다:

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을 전송합니다. 이것은 일반 채널 메시지이며(토큰 델타 아님) 정상적인 메시지입니다.
- **프리뷰 스트리밍(Telegram/Discord/Slack):** 생성 중 임시 **프리뷰 메시지**를 업데이트합니다.

현재 채널 메시지에는 **진정한 토큰 델타 스트리밍이 없습니다**. 프리뷰 스트리밍은 메시지 기반입니다(전송 + 수정/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력이 준비되는 대로 거친 청크 단위로 전송합니다.

```
모델 출력
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ 버퍼가 커지면 chunker가 블록 전송
       └─ (blockStreamingBreak=message_end)
            └─ message_end에서 chunker 플러시
                   └─ 채널 전송(블록 응답)
```

범례:

- `text_delta/events`: 모델 스트림 이벤트(비스트리밍 모델에서는 드물 수 있음).
- `chunker`: min/max 경계 + break preference를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 발신 메시지(블록 응답).

**제어 항목:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (기본값 off).
- 채널 재정의: 채널별로 `"on"`/`"off"`를 강제하는 `*.blockStreaming`(및 계정별 변형).
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (전송 전 스트리밍된 블록 병합).
- 채널 하드 상한: `*.textChunkLimit` (예: `channels.whatsapp.textChunkLimit`).
- 채널 청크 모드: `*.chunkMode` (`length` 기본값, `newline`은 길이 기준 청크 분할 전에 빈 줄(문단 경계)에서 분할).
- Discord 소프트 상한: `channels.discord.maxLinesPerMessage` (기본값 17)로, UI 잘림을 피하기 위해 긴 응답을 나눕니다.

**경계 의미:**

- `text_end`: chunker가 전송하는 즉시 블록을 스트리밍하고, 각 `text_end`에서 플러시합니다.
- `message_end`: 어시스턴트 메시지가 끝날 때까지 기다린 뒤 버퍼된 출력을 플러시합니다.

`message_end`도 버퍼된 텍스트가 `maxChars`를 초과하면 chunker를 사용하므로, 끝에서 여러 청크를 전송할 수 있습니다.

## 청크 분할 알고리즘(낮은/높은 경계)

블록 청크 분할은 `EmbeddedBlockChunker`로 구현됩니다:

- **낮은 경계:** 버퍼가 `minChars` 이상이 되기 전에는 전송하지 않음(강제되지 않는 한).
- **높은 경계:** `maxChars` 이전에서 분할을 선호하며, 강제되면 `maxChars`에서 분할.
- **줄바꿈 선호도:** `paragraph` → `newline` → `sentence` → `whitespace` → 강제 분할.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않음. `maxChars`에서 강제로 나눌 때는 Markdown 유효성을 유지하기 위해 펜스를 닫았다가 다시 엽니다.

`maxChars`는 채널 `textChunkLimit`으로 제한되므로 채널별 상한을 초과할 수 없습니다.

## 병합(coalescing, 스트리밍 블록 합치기)

블록 스트리밍이 활성화되면 OpenClaw는 **연속된 블록 청크를 병합한 뒤**
전송할 수 있습니다. 이렇게 하면 점진적 출력을 유지하면서도 “한 줄짜리 스팸”을 줄일 수 있습니다.

- 병합은 플러시 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며 이를 초과하면 플러시됩니다.
- `minChars`는 충분한 텍스트가 쌓이기 전까지 작은 조각이 전송되지 않도록 합니다
  (최종 플러시는 남은 텍스트를 항상 전송).
- 결합자는 `blockStreamingChunk.breakPreference`에서 파생됩니다
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백).
- 채널 재정의는 `*.blockStreamingCoalesce`로 제공됩니다(계정별 구성 포함).
- 기본 병합 `minChars`는 재정의되지 않은 경우 Signal/Slack/Discord에서 1500으로 상향됩니다.

## 블록 간 사람 같은 속도 조절

블록 스트리밍이 활성화되면 블록 응답 사이(첫 번째 블록 이후)에 **무작위 일시정지**를 추가할 수 있습니다. 이렇게 하면 여러 버블로 나뉜 응답이 더 자연스럽게 느껴집니다.

- 구성: `agents.defaults.humanDelay` (`agents.list[].humanDelay`로 에이전트별 재정의 가능).
- 모드: `off` (기본값), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- **블록 응답**에만 적용되며, 최종 응답이나 도구 요약에는 적용되지 않습니다.

## "청크를 스트리밍할지, 전부를 보낼지"

이는 다음에 매핑됩니다:

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (생성되는 대로 전송). Telegram이 아닌 채널에서는 추가로 `*.blockStreaming: true`도 필요합니다.
- **끝에서 전부 스트리밍:** `blockStreamingBreak: "message_end"` (한 번에 플러시, 매우 길면 여러 청크 가능).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"` (최종 응답만).

**채널 참고:** 블록 스트리밍은 `*.blockStreaming`이 명시적으로 `true`로 설정되지 않으면 **꺼져 있습니다**. 채널은 블록 응답 없이도 라이브 프리뷰를 스트리밍할 수 있습니다(`channels.<channel>.streaming`).

구성 위치 참고: `blockStreaming*` 기본값은 루트 구성이 아니라 `agents.defaults` 아래에 있습니다.

## 프리뷰 스트리밍 모드

정식 키: `channels.<channel>.streaming`

모드:

- `off`: 프리뷰 스트리밍 비활성화.
- `partial`: 최신 텍스트로 교체되는 단일 프리뷰.
- `block`: 청크/추가 단계로 업데이트되는 프리뷰.
- `progress`: 생성 중 진행 상태/상태 프리뷰, 완료 시 최종 답변.

### 채널 매핑

| 채널      | `off` | `partial` | `block` | `progress`        |
| --------- | ----- | --------- | ------- | ----------------- |
| Telegram  | ✅    | ✅        | ✅      | `partial`로 매핑  |
| Discord   | ✅    | ✅        | ✅      | `partial`로 매핑  |
| Slack     | ✅    | ✅        | ✅      | ✅                |
| Mattermost| ✅    | ✅        | ✅      | ✅                |

Slack 전용:

- `channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode="partial"`일 때 Slack 네이티브 스트리밍 API 호출을 토글합니다(기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태는 응답 스레드 대상을 필요로 합니다. 최상위 DM은 그런 스레드 스타일 프리뷰를 표시하지 않습니다.

레거시 키 마이그레이션:

- Telegram: `streamMode` + 불리언 `streaming`은 `streaming` enum으로 자동 마이그레이션됩니다.
- Discord: `streamMode` + 불리언 `streaming`은 `streaming` enum으로 자동 마이그레이션됩니다.
- Slack: `streamMode`는 `streaming.mode`로 자동 마이그레이션되고, 불리언 `streaming`은 `streaming.mode` + `streaming.nativeTransport`로 자동 마이그레이션되며, 레거시 `nativeStreaming`은 `streaming.nativeTransport`로 자동 마이그레이션됩니다.

### 런타임 동작

Telegram:

- DM과 그룹/토픽 전반에서 `sendMessage` + `editMessageText` 프리뷰 업데이트를 사용합니다.
- Telegram 블록 스트리밍이 명시적으로 활성화되면 프리뷰 스트리밍은 건너뜁니다(이중 스트리밍 방지).
- `/reasoning stream`은 프리뷰에 추론을 기록할 수 있습니다.

Discord:

- 전송 + 수정 프리뷰 메시지를 사용합니다.
- `block` 모드는 draft 청크 분할(`draftChunk`)을 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화되면 프리뷰 스트리밍은 건너뜁니다.
- 최종 미디어, 오류, 명시적 응답 payload는 새 초안을 플러시하지 않고 대기 중 프리뷰를 취소한 뒤 일반 전달을 사용합니다.

Slack:

- `partial`은 사용 가능한 경우 Slack 네이티브 스트리밍(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 추가 방식 draft 프리뷰를 사용합니다.
- `progress`는 상태 프리뷰 텍스트를 사용한 뒤 최종 답변을 보냅니다.
- 최종 미디어/오류 payload와 progress 최종본은 버려지는 draft 메시지를 만들지 않습니다. 프리뷰를 수정할 수 있는 텍스트/블록 최종본만 대기 중 draft 텍스트를 플러시합니다.

Mattermost:

- thinking, 도구 활동, 부분 응답 텍스트를 하나의 draft 프리뷰 게시물로 스트리밍하고, 최종 답변을 안전하게 보낼 수 있을 때 제자리에서 마무리합니다.
- 프리뷰 게시물이 삭제되었거나 마무리 시 사용할 수 없는 경우 새 최종 게시물을 보내는 방식으로 폴백합니다.
- 최종 미디어/오류 payload는 임시 프리뷰 게시물을 플러시하는 대신 일반 전달 전에 대기 중 프리뷰 업데이트를 취소합니다.

Matrix:

- 최종 텍스트가 프리뷰 이벤트를 재사용할 수 있으면 draft 프리뷰를 제자리에서 마무리합니다.
- 미디어 전용, 오류, 응답 대상 불일치 최종본은 일반 전달 전에 대기 중 프리뷰 업데이트를 취소합니다. 이미 보이는 오래된 프리뷰는 redaction됩니다.

### 도구 진행 상황 프리뷰 업데이트

프리뷰 스트리밍에는 **도구 진행 상황** 업데이트도 포함될 수 있습니다. 예를 들어 "웹 검색 중", "파일 읽는 중", "도구 호출 중" 같은 짧은 상태 줄이 도구 실행 중 최종 응답보다 앞서 동일한 프리뷰 메시지에 표시됩니다. 이렇게 하면 여러 단계의 도구 턴이 첫 번째 thinking 프리뷰와 최종 답변 사이에서 조용히 멈춘 것처럼 보이지 않고 시각적으로 계속 살아 있게 됩니다.

지원 표면:

- **Discord**, **Slack**, **Telegram**은 도구 진행 상황을 라이브 프리뷰 수정에 스트리밍합니다.
- **Mattermost**는 이미 도구 활동을 하나의 draft 프리뷰 게시물에 통합합니다(위 참조).
- 도구 진행 상황 수정은 활성 프리뷰 스트리밍 모드를 따르며, 프리뷰 스트리밍이 `off`이거나 블록 스트리밍이 메시지를 이어받은 경우에는 건너뜁니다.

## 관련

- [메시지](/ko/concepts/messages) — 메시지 수명 주기 및 전달
- [재시도](/ko/concepts/retry) — 전달 실패 시 재시도 동작
- [채널](/ko/channels) — 채널별 스트리밍 지원
