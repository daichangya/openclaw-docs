---
read_when:
    - 채널에서 스트리밍 또는 청크 분할이 작동하는 방식 설명하기
    - 블록 스트리밍 또는 채널 청크 분할 동작 변경하기
    - 중복되거나 너무 이른 블록 응답 또는 채널 미리보기 스트리밍 디버깅
summary: 스트리밍 + 청크 분할 동작(블록 응답, 채널 미리보기 스트리밍, 모드 매핑)
title: 스트리밍 및 청크 분할
x-i18n:
    generated_at: "2026-04-22T04:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# 스트리밍 + 청크 분할

OpenClaw에는 서로 분리된 두 개의 스트리밍 계층이 있습니다:

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을 내보냅니다. 이는 일반 채널 메시지이며(토큰 델타 아님)입니다.
- **미리보기 스트리밍(Telegram/Discord/Slack):** 생성 중 임시 **미리보기 메시지**를 업데이트합니다.

현재 채널 메시지에는 **진짜 토큰 델타 스트리밍이 없습니다**. 미리보기 스트리밍은 메시지 기반입니다(전송 + 수정/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력이 준비되는 대로 큰 단위 청크로 전송합니다.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

범례:

- `text_delta/events`: 모델 스트림 이벤트(스트리밍이 없는 모델에서는 드물 수 있음).
- `chunker`: 최소/최대 경계 + 분할 우선순위를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 아웃바운드 메시지(블록 응답).

**제어 항목:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`(기본값 off).
- 채널 재정의: 채널별로 `"on"`/`"off"`를 강제하는 `*.blockStreaming`(및 계정별 변형).
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`(전송 전 스트리밍된 블록 병합).
- 채널 하드 상한: `*.textChunkLimit`(예: `channels.whatsapp.textChunkLimit`).
- 채널 청크 모드: `*.chunkMode`(`length` 기본값, `newline`은 길이 기준 청크 분할 전에 빈 줄(문단 경계)에서 분할).
- Discord 소프트 상한: `channels.discord.maxLinesPerMessage`(기본값 17)는 UI 잘림을 피하기 위해 긴 응답을 분할합니다.

**경계 의미:**

- `text_end`: chunker가 내보내는 즉시 스트림 블록을 전송하고 각 `text_end`에서 flush합니다.
- `message_end`: 어시스턴트 메시지가 끝날 때까지 기다린 다음 버퍼링된 출력을 flush합니다.

`message_end`도 버퍼링된 텍스트가 `maxChars`를 초과하면 chunker를 사용하므로 마지막에 여러 청크를 내보낼 수 있습니다.

## 청크 분할 알고리즘(하한/상한)

블록 청크 분할은 `EmbeddedBlockChunker`로 구현됩니다:

- **하한:** 버퍼가 `minChars` 이상이 될 때까지 내보내지 않습니다(강제 시 제외).
- **상한:** `maxChars` 전에 분할을 선호하고, 강제되면 `maxChars`에서 분할합니다.
- **분할 우선순위:** `paragraph` → `newline` → `sentence` → `whitespace` → 강제 분할.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않습니다. `maxChars`에서 강제로 분할할 때는 Markdown 유효성을 유지하기 위해 펜스를 닫고 다시 엽니다.

`maxChars`는 채널 `textChunkLimit`에 맞게 제한되므로 채널별 상한을 넘을 수 없습니다.

## 병합(coalescing)(스트리밍된 블록 병합)

블록 스트리밍이 활성화되면 OpenClaw는 전송 전에 **연속된 블록 청크를 병합**할 수 있습니다.
이렇게 하면 점진적 출력을 유지하면서도 “한 줄짜리 스팸”을 줄일 수 있습니다.

- 병합은 flush 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며 이를 초과하면 flush됩니다.
- `minChars`는 충분한 텍스트가 누적될 때까지 작은 조각이 전송되지 않게 합니다
  (최종 flush는 항상 남은 텍스트를 전송합니다).
- joiner는 `blockStreamingChunk.breakPreference`에서 파생됩니다
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백).
- 채널 재정의는 `*.blockStreamingCoalesce`로 사용할 수 있습니다(계정별 구성 포함).
- 기본 병합 `minChars`는 재정의되지 않는 한 Signal/Slack/Discord에서 1500으로 상향됩니다.

## 블록 간 사람 같은 지연

블록 스트리밍이 활성화되면 블록 응답 사이에 **무작위 지연**을 추가할 수 있습니다
(첫 번째 블록 이후). 이렇게 하면 여러 말풍선 응답이
더 자연스럽게 느껴집니다.

- 구성: `agents.defaults.humanDelay`(에이전트별 재정의: `agents.list[].humanDelay`).
- 모드: `off`(기본값), `natural`(800–2500ms), `custom`(`minMs`/`maxMs`).
- **블록 응답**에만 적용되며 최종 응답이나 도구 요약에는 적용되지 않습니다.

## "청크로 스트리밍 또는 전부"

이는 다음으로 매핑됩니다:

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`(작성 중 내보내기). Telegram이 아닌 채널은 `*.blockStreaming: true`도 필요합니다.
- **끝에서 전부 스트리밍:** `blockStreamingBreak: "message_end"`(한 번에 flush, 매우 길면 여러 청크가 될 수 있음).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"`(최종 응답만).

**채널 참고:** 블록 스트리밍은
`*.blockStreaming`이 명시적으로 `true`로 설정되지 않는 한 **꺼져 있습니다**. 채널은 블록 응답 없이도
라이브 미리보기(`channels.<channel>.streaming`)를 스트리밍할 수 있습니다.

구성 위치 참고: `blockStreaming*` 기본값은 루트 구성이 아니라
`agents.defaults` 아래에 있습니다.

## 미리보기 스트리밍 모드

정식 키: `channels.<channel>.streaming`

모드:

- `off`: 미리보기 스트리밍 비활성화.
- `partial`: 최신 텍스트로 대체되는 단일 미리보기.
- `block`: 청크/추가 단계로 미리보기 업데이트.
- `progress`: 생성 중 진행/상태 미리보기, 완료 시 최종 답변.

### 채널 매핑

| 채널 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial`로 매핑 |
| Discord    | ✅    | ✅        | ✅      | `partial`로 매핑 |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Slack 전용:

- `channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode="partial"`일 때 Slack 네이티브 스트리밍 API 호출을 전환합니다(기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태는 응답 스레드 대상이 필요합니다. 최상위 DM은 해당 스레드 스타일 미리보기를 표시하지 않습니다.

레거시 키 마이그레이션:

- Telegram: `streamMode` + 불리언 `streaming`은 자동으로 `streaming` enum으로 마이그레이션됩니다.
- Discord: `streamMode` + 불리언 `streaming`은 자동으로 `streaming` enum으로 마이그레이션됩니다.
- Slack: `streamMode`는 자동으로 `streaming.mode`로 마이그레이션되고, 불리언 `streaming`은 자동으로 `streaming.mode`와 `streaming.nativeTransport`로 마이그레이션되며, 레거시 `nativeStreaming`은 자동으로 `streaming.nativeTransport`로 마이그레이션됩니다.

### 런타임 동작

Telegram:

- DM과 그룹/토픽 전반에서 `sendMessage` + `editMessageText` 미리보기 업데이트를 사용합니다.
- Telegram 블록 스트리밍이 명시적으로 활성화되면 미리보기 스트리밍은 건너뜁니다(이중 스트리밍 방지).
- `/reasoning stream`은 reasoning을 미리보기에 기록할 수 있습니다.

Discord:

- 전송 + 수정 미리보기 메시지를 사용합니다.
- `block` 모드는 초안 청크 분할(`draftChunk`)을 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화되면 미리보기 스트리밍은 건너뜁니다.
- 최종 미디어, 오류 및 명시적 답글 페이로드는 새 초안을 flush하지 않고 대기 중인 미리보기를 취소한 뒤 일반 전송을 사용합니다.

Slack:

- `partial`은 가능할 때 Slack 네이티브 스트리밍(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 추가형 초안 미리보기를 사용합니다.
- `progress`는 상태 미리보기 텍스트를 사용한 뒤 최종 답변을 전송합니다.
- 최종 미디어/오류 페이로드와 progress 최종값은 버려지는 초안 메시지를 만들지 않습니다. 미리보기를 수정할 수 있는 텍스트/블록 최종값만 대기 중인 초안 텍스트를 flush합니다.

Mattermost:

- 생각 과정, 도구 활동 및 부분 응답 텍스트를 하나의 초안 미리보기 게시물로 스트리밍하고, 최종 답변을 안전하게 보낼 수 있을 때 그 자리에서 마무리합니다.
- 미리보기 게시물이 삭제되었거나 마무리 시점에 사용할 수 없으면 새 최종 게시물을 전송하는 방식으로 대체합니다.
- 최종 미디어/오류 페이로드는 일반 전송 전에 대기 중인 미리보기 업데이트를 취소하며, 임시 미리보기 게시물을 flush하지 않습니다.

Matrix:

- 초안 미리보기는 최종 텍스트가 미리보기 이벤트를 재사용할 수 있으면 그 자리에서 마무리됩니다.
- 미디어 전용, 오류 및 답글 대상 불일치 최종값은 일반 전송 전에 대기 중인 미리보기 업데이트를 취소합니다. 이미 보이는 오래된 미리보기는 redacted 처리됩니다.

### 도구 진행 미리보기 업데이트

미리보기 스트리밍에는 **도구 진행** 업데이트도 포함될 수 있습니다. 즉, "웹 검색 중", "파일 읽는 중", "도구 호출 중" 같은 짧은 상태 줄이 도구 실행 중 같은 미리보기 메시지에 최종 응답보다 앞서 표시됩니다. 이렇게 하면 여러 단계의 도구 턴이 첫 번째 생각 미리보기와 최종 답변 사이에서 조용히 멈춰 있는 대신 시각적으로 살아 있게 보입니다.

지원되는 표면:

- **Discord**, **Slack**, **Telegram**은 도구 진행을 라이브 미리보기 수정에 스트리밍합니다.
- **Mattermost**는 이미 도구 활동을 하나의 초안 미리보기 게시물에 통합합니다(위 참고).
- 도구 진행 수정은 활성 미리보기 스트리밍 모드를 따릅니다. 미리보기 스트리밍이 `off`이거나 블록 스트리밍이 메시지를 인계받은 경우에는 건너뜁니다.

## 관련 항목

- [Messages](/ko/concepts/messages) — 메시지 수명 주기 및 전송
- [Retry](/ko/concepts/retry) — 전송 실패 시 재시도 동작
- [Channels](/ko/channels) — 채널별 스트리밍 지원
