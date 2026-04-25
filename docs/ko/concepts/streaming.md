---
read_when:
    - 채널에서 스트리밍 또는 청킹이 어떻게 작동하는지 설명합니다
    - 블록 스트리밍 또는 채널 청킹 동작 변경하기
    - 중복되거나 너무 이른 블록 응답 또는 채널 미리보기 스트리밍 디버깅
summary: 스트리밍 + 청킹 동작(블록 응답, 채널 미리보기 스트리밍, 모드 매핑)
title: 스트리밍 및 청킹
x-i18n:
    generated_at: "2026-04-25T12:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw에는 서로 분리된 두 가지 스트리밍 계층이 있습니다.

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을 내보냅니다. 이는 일반적인 채널 메시지이며(토큰 델타가 아님)입니다.
- **미리보기 스트리밍(Telegram/Discord/Slack):** 생성 중에 임시 **미리보기 메시지**를 업데이트합니다.

현재 채널 메시지에는 **진정한 토큰 델타 스트리밍**이 없습니다. 미리보기 스트리밍은 메시지 기반입니다(전송 + 수정/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력이 उपलब्ध해지는 대로 굵직한 청크로 전송합니다.

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

- `text_delta/events`: 모델 스트림 이벤트(스트리밍이 없는 모델의 경우 드물 수 있음).
- `chunker`: 최소/최대 경계 + 분할 선호도를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 발신 메시지(블록 응답).

**제어 항목:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`(기본값: off).
- 채널별 재정의: 채널별로 `"on"`/`"off"`를 강제하는 `*.blockStreaming`(및 계정별 변형).
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`(전송 전 스트리밍 블록 병합).
- 채널 하드 캡: `*.textChunkLimit`(예: `channels.whatsapp.textChunkLimit`).
- 채널 청킹 모드: `*.chunkMode`(`length`가 기본값, `newline`은 길이 기반 청킹 전에 빈 줄(문단 경계)에서 분할).
- Discord 소프트 캡: `channels.discord.maxLinesPerMessage`(기본값: 17)는 UI 잘림을 피하기 위해 긴 응답을 분할합니다.

**경계 의미:**

- `text_end`: chunker가 내보내는 즉시 블록을 스트리밍하고 각 `text_end`에서 flush합니다.
- `message_end`: 어시스턴트 메시지가 끝날 때까지 기다린 뒤 버퍼링된 출력을 flush합니다.

`message_end`는 버퍼링된 텍스트가 `maxChars`를 초과하면 여전히 chunker를 사용하므로, 끝에서 여러 청크를 내보낼 수 있습니다.

### 블록 스트리밍에서의 미디어 전달

`MEDIA:` 지시문은 일반적인 전달 메타데이터입니다. 블록 스트리밍이
미디어 블록을 일찍 전송하면, OpenClaw는 해당 턴에 대한 그 전달을 기억합니다. 최종
어시스턴트 페이로드가 동일한 미디어 URL을 반복하면, 최종 전달은
첨부 파일을 다시 보내는 대신 중복 미디어를 제거합니다.

완전히 동일한 최종 페이로드는 억제됩니다. 최종 페이로드가 이미 스트리밍된
미디어 주변에 구별되는 텍스트를 추가하면, OpenClaw는 여전히 새 텍스트를 전송하면서
미디어는 한 번만 전달되도록 유지합니다. 이렇게 하면 에이전트가 스트리밍 중에 `MEDIA:`를 내보내고
provider도 완료된 응답에 이를 포함하는 경우, Telegram 같은 채널에서
중복 음성 메모나 파일이 생기지 않게 됩니다.

## 청킹 알고리즘(하한/상한)

블록 청킹은 `EmbeddedBlockChunker`로 구현됩니다.

- **하한:** 버퍼가 `minChars` 이상이 될 때까지 내보내지 않습니다(강제 시 제외).
- **상한:** `maxChars` 이전에서 분할을 선호하며, 강제 시 `maxChars`에서 분할합니다.
- **분할 선호도:** `paragraph` → `newline` → `sentence` → `whitespace` → 강제 분할.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않습니다. `maxChars`에서 강제 분할해야 할 때는 Markdown 유효성을 유지하기 위해 펜스를 닫고 다시 엽니다.

`maxChars`는 채널 `textChunkLimit`에 맞게 제한되므로, 채널별 제한을 초과할 수 없습니다.

## 코얼레싱(스트리밍 블록 병합)

블록 스트리밍이 활성화되면, OpenClaw는 전송 전에 **연속된 블록 청크를 병합**할 수 있습니다. 이렇게 하면 점진적 출력을 유지하면서도 “한 줄짜리 스팸”을 줄일 수 있습니다.

- 코얼레싱은 flush 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며, 이를 초과하면 flush됩니다.
- `minChars`는 충분한 텍스트가 누적될 때까지 작은 조각이 전송되지 않도록 합니다
  (최종 flush는 항상 남은 텍스트를 전송함).
- 결합자는 `blockStreamingChunk.breakPreference`에서 파생됩니다
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백).
- 채널별 재정의는 `*.blockStreamingCoalesce`로 사용할 수 있습니다(계정별 config 포함).
- 기본 코얼레싱 `minChars`는 재정의되지 않은 경우 Signal/Slack/Discord에서 1500으로 높아집니다.

## 블록 사이의 사람 같은 페이싱

블록 스트리밍이 활성화되면, 블록 응답 사이(첫 번째 블록 이후)에
**무작위화된 일시 정지**를 추가할 수 있습니다. 이렇게 하면 여러 말풍선 응답이
더 자연스럽게 느껴집니다.

- Config: `agents.defaults.humanDelay`(에이전트별 재정의: `agents.list[].humanDelay`).
- 모드: `off`(기본값), `natural`(800–2500ms), `custom`(`minMs`/`maxMs`).
- **블록 응답**에만 적용되며, 최종 응답이나 도구 요약에는 적용되지 않습니다.

## "청크를 스트리밍할지 전체를 보낼지"

이는 다음에 매핑됩니다.

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`(작성하면서 내보냄). Telegram 이외 채널은 `*.blockStreaming: true`도 필요합니다.
- **끝에서 전체 스트리밍:** `blockStreamingBreak: "message_end"`(한 번에 flush, 매우 길면 여러 청크일 수 있음).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"`(최종 응답만 전송).

**채널 참고:** 블록 스트리밍은 `*.blockStreaming`이
명시적으로 `true`로 설정되지 않으면 **꺼져 있습니다**. 채널은 블록 응답 없이도
실시간 미리보기(`channels.<channel>.streaming`)를 스트리밍할 수 있습니다.

config 위치 참고: `blockStreaming*` 기본값은 루트 config가 아니라 `agents.defaults` 아래에 있습니다.

## 미리보기 스트리밍 모드

정식 키: `channels.<channel>.streaming`

모드:

- `off`: 미리보기 스트리밍 비활성화.
- `partial`: 최신 텍스트로 교체되는 단일 미리보기.
- `block`: 청크/추가 단계로 미리보기 업데이트.
- `progress`: 생성 중 진행 상태/상태 미리보기, 완료 시 최종 답변.

### 채널 매핑

| 채널 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial`로 매핑 |
| Discord    | ✅    | ✅        | ✅      | `partial`로 매핑 |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Slack 전용:

- `channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode="partial"`일 때 Slack 네이티브 스트리밍 API 호출을 토글합니다(기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태는 응답 스레드 대상을 필요로 하며, 최상위 DM에서는 해당 스레드 스타일 미리보기가 표시되지 않습니다.

레거시 키 마이그레이션:

- Telegram: 레거시 `streamMode`와 스칼라/불리언 `streaming` 값은 doctor/config 호환성 경로에서 감지되어 `streaming.mode`로 마이그레이션됩니다.
- Discord: `streamMode` + 불리언 `streaming`은 `streaming` enum으로 자동 마이그레이션됩니다.
- Slack: `streamMode`는 `streaming.mode`로 자동 마이그레이션되고, 불리언 `streaming`은 `streaming.mode` + `streaming.nativeTransport`로 자동 마이그레이션되며, 레거시 `nativeStreaming`은 `streaming.nativeTransport`로 자동 마이그레이션됩니다.

### 런타임 동작

Telegram:

- DM과 그룹/토픽 전반에서 `sendMessage` + `editMessageText` 미리보기 업데이트를 사용합니다.
- Telegram 블록 스트리밍이 명시적으로 활성화된 경우 미리보기 스트리밍은 건너뜁니다(이중 스트리밍 방지).
- `/reasoning stream`은 추론을 미리보기에 기록할 수 있습니다.

Discord:

- 전송 + 수정 미리보기 메시지를 사용합니다.
- `block` 모드는 초안 청킹(`draftChunk`)을 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화된 경우 미리보기 스트리밍은 건너뜁니다.
- 최종 미디어, 오류 및 명시적 응답 페이로드는 새 초안을 flush하지 않고 대기 중인 미리보기를 취소한 다음 일반 전달을 사용합니다.

Slack:

- `partial`은 가능할 경우 Slack 네이티브 스트리밍(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 추가형 초안 미리보기를 사용합니다.
- `progress`는 상태 미리보기 텍스트를 사용한 후 최종 답변을 전송합니다.
- 네이티브 및 초안 미리보기 스트리밍은 해당 턴의 블록 응답을 억제하므로, Slack 응답은 하나의 전달 경로로만 스트리밍됩니다.
- 최종 미디어/오류 페이로드와 진행 상태 최종본은 일회용 초안 메시지를 만들지 않습니다. 미리보기를 수정할 수 있는 텍스트/블록 최종본만 대기 중인 초안 텍스트를 flush합니다.

Mattermost:

- 사고 과정, 도구 활동 및 부분 응답 텍스트를 하나의 초안 미리보기 게시물로 스트리밍하며, 최종 답변을 안전하게 보낼 수 있을 때 제자리에서 최종화합니다.
- 미리보기 게시물이 삭제되었거나 최종화 시점에 사용할 수 없는 경우 새 최종 게시물을 전송하는 방식으로 대체합니다.
- 최종 미디어/오류 페이로드는 임시 미리보기 게시물을 flush하는 대신 일반 전달 전에 대기 중인 미리보기 업데이트를 취소합니다.

Matrix:

- 최종 텍스트가 미리보기 이벤트를 재사용할 수 있으면 초안 미리보기가 제자리에서 최종화됩니다.
- 미디어 전용, 오류 및 응답 대상 불일치 최종본은 일반 전달 전에 대기 중인 미리보기 업데이트를 취소합니다. 이미 보이는 오래된 미리보기는 삭제 표시됩니다.

### 도구 진행 상황 미리보기 업데이트

미리보기 스트리밍에는 도구 실행 중에 최종 응답보다 먼저 동일한 미리보기 메시지에 나타나는 "웹 검색 중", "파일 읽는 중", "도구 호출 중" 같은 짧은 상태 줄인 **도구 진행 상황** 업데이트도 포함될 수 있습니다. 이렇게 하면 여러 단계의 도구 턴이 첫 번째 사고 미리보기와 최종 답변 사이에서 조용해지지 않고 시각적으로 살아 있게 됩니다.

지원되는 표면:

- **Discord**, **Slack**, **Telegram**은 미리보기 스트리밍이 활성화되어 있을 때 기본적으로 도구 진행 상황을 실시간 미리보기 수정에 스트리밍합니다.
- Telegram은 `v2026.4.22`부터 도구 진행 상황 미리보기 업데이트가 활성화된 상태로 배포되었으며, 이를 계속 활성화해 두는 것이 이미 릴리스된 동작을 유지합니다.
- **Mattermost**는 이미 도구 활동을 단일 초안 미리보기 게시물에 통합합니다(위 참조).
- 도구 진행 상황 수정은 활성 미리보기 스트리밍 모드를 따르며, 미리보기 스트리밍이 `off`이거나 블록 스트리밍이 메시지를 인계받은 경우 건너뜁니다.
- 미리보기 스트리밍은 유지하되 도구 진행 상황 줄을 숨기려면 해당 채널의 `streaming.preview.toolProgress`를 `false`로 설정하세요. 미리보기 수정 자체를 비활성화하려면 `streaming.mode`를 `off`로 설정하세요.

예시:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 관련 항목

- [메시지](/ko/concepts/messages) — 메시지 수명 주기 및 전달
- [재시도](/ko/concepts/retry) — 전달 실패 시 재시도 동작
- [채널](/ko/channels) — 채널별 스트리밍 지원
