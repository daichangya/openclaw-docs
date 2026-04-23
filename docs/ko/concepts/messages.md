---
read_when:
    - 수신 메시지가 어떻게 응답이 되는지 설명하기
    - 세션, 큐잉 모드 또는 스트리밍 동작 명확히 하기
    - 추론 가시성과 사용상 영향 문서화하기
summary: 메시지 흐름, 세션, 큐잉, 그리고 추론 가시성
title: 메시지
x-i18n:
    generated_at: "2026-04-23T06:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# 메시지

이 페이지는 OpenClaw가 수신 메시지, 세션, 큐잉, 스트리밍, 추론 가시성을 어떻게 처리하는지 한데 묶어 설명합니다.

## 메시지 흐름(개요)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

핵심 설정 항목은 구성에 있습니다.

- 접두사, 큐잉, 그룹 동작은 `messages.*`
- 블록 스트리밍 및 청킹 기본값은 `agents.defaults.*`
- 상한 및 스트리밍 토글은 채널별 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등)

전체 스키마는 [Configuration](/ko/gateway/configuration)를 참고하세요.

## 수신 중복 제거

채널은 재연결 후 동일한 메시지를 다시 전달할 수 있습니다. OpenClaw는 channel/account/peer/session/message id를 키로 사용하는 단기 캐시를 유지하므로, 중복 전달이 또 다른 agent 실행을 유발하지 않습니다.

## 수신 디바운싱

**같은 발신자**의 빠르게 연속된 메시지는 `messages.inbound`를 통해 하나의 agent 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화 단위로 적용되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

구성(전역 기본값 + 채널별 재정의):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

참고:

- 디바운스는 **텍스트 전용** 메시지에 적용되며, 미디어/첨부파일은 즉시 플러시됩니다.
- 제어 명령은 디바운싱을 우회하여 독립적으로 유지됩니다. 단, 채널이 동일 발신자 DM 병합에 명시적으로 opt-in한 경우는 예외입니다(예: [BlueBubbles `coalesceSameSenderDms`](/ko/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)). 이 경우 DM 명령은 디바운스 창 안에서 대기하므로 분할 전송된 페이로드가 같은 agent 턴에 합류할 수 있습니다.

## 세션과 디바이스

세션은 클라이언트가 아니라 gateway가 소유합니다.

- 다이렉트 채팅은 agent 기본 세션 키로 합쳐집니다.
- 그룹/채널은 자체 세션 키를 가집니다.
- 세션 저장소와 대화 기록은 gateway 호스트에 저장됩니다.

여러 디바이스/채널이 같은 세션에 매핑될 수 있지만, 기록이 모든 클라이언트에 완전히 다시 동기화되지는 않습니다. 권장 사항: 문맥이 갈라지는 것을 피하려면 긴 대화에는 하나의 주 디바이스를 사용하세요. Control UI와 TUI는 항상 gateway 기반 세션 대화 기록을 표시하므로, 이것이 기준 정보입니다.

자세한 내용: [Session management](/ko/concepts/session)

## 수신 본문과 히스토리 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 구분합니다.

- `Body`: agent에 보내는 프롬프트 텍스트입니다. 여기에는 채널 엔벌로프와 선택적 히스토리 래퍼가 포함될 수 있습니다.
- `CommandBody`: 지시문/명령 파싱을 위한 원시 사용자 텍스트입니다.
- `RawBody`: `CommandBody`의 레거시 별칭입니다(호환성을 위해 유지됨).

채널이 히스토리를 제공하는 경우, 공통 래퍼를 사용합니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**비다이렉트 채팅**(그룹/채널/룸)의 경우, **현재 메시지 본문** 앞에는 발신자 레이블이 붙습니다(히스토리 항목에 사용하는 것과 같은 형식). 이렇게 하면 실시간 메시지와 대기열/히스토리 메시지가 agent 프롬프트에서 일관되게 유지됩니다.

히스토리 버퍼는 **대기 중 메시지만** 포함합니다. 즉, 실행을 유발하지 않은 그룹 메시지(예: 멘션 게이트가 걸린 메시지)는 포함하고, 이미 세션 대화 기록에 있는 메시지는 **제외**합니다.

지시문 제거는 **현재 메시지** 섹션에만 적용되므로 히스토리는 그대로 유지됩니다. 히스토리를 래핑하는 채널은 `CommandBody`(또는 `RawBody`)를 원래 메시지 텍스트로 설정하고, `Body`는 결합된 프롬프트로 유지해야 합니다. 히스토리 버퍼는 `messages.groupChat.historyLimit`(전역 기본값) 및 `channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 구성할 수 있습니다(`0`으로 설정하면 비활성화).

## 큐잉과 후속 턴

이미 실행 중인 run이 있다면, 수신 메시지는 대기열에 넣거나, 현재 run으로 유도하거나, 후속 턴용으로 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)로 구성합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect`, 그리고 backlog 변형

자세한 내용: [Queueing](/ko/concepts/queue)

## 스트리밍, 청킹, 배칭

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 응답을 전송합니다.
청킹은 채널 텍스트 제한을 준수하며 fenced code가 분리되지 않도록 합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 배칭)
- `agents.defaults.humanDelay` (블록 응답 사이의 사람 같은 지연)
- 채널별 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (Telegram이 아닌 채널은 명시적으로 `*.blockStreaming: true`가 필요)

자세한 내용: [Streaming + chunking](/ko/concepts/streaming)

## 추론 가시성과 토큰

OpenClaw는 모델 추론을 노출하거나 숨길 수 있습니다.

- `/reasoning on|off|stream`은 가시성을 제어합니다.
- 추론 콘텐츠는 모델이 생성한 경우 여전히 토큰 사용량에 포함됩니다.
- Telegram은 초안 버블로의 추론 스트리밍을 지원합니다.

자세한 내용: [Thinking + reasoning directives](/ko/tools/thinking) 및 [Token use](/ko/reference/token-use)

## 접두사, 스레딩, 응답

발신 메시지 형식은 `messages`에서 중앙 관리됩니다.

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`(발신 접두사 단계적 적용), 그리고 `channels.whatsapp.messagePrefix`(WhatsApp 수신 접두사)
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩

자세한 내용: [Configuration](/ko/gateway/configuration-reference#messages) 및 채널 문서

## 무음 응답

정확한 무음 토큰 `NO_REPLY` / `no_reply`는 “사용자에게 보이는 응답을 전달하지 말라”는 의미입니다.
OpenClaw는 대화 유형에 따라 이 동작을 처리합니다.

- 다이렉트 대화는 기본적으로 무음을 허용하지 않으며, 무음 응답만 있을 경우 짧은 표시용 대체 응답으로 다시 작성합니다.
- 그룹/채널은 기본적으로 무음을 허용합니다.
- 내부 오케스트레이션은 기본적으로 무음을 허용합니다.

기본값은 `agents.defaults.silentReply` 및
`agents.defaults.silentReplyRewrite` 아래에 있으며, `surfaces.<id>.silentReply` 및
`surfaces.<id>.silentReplyRewrite`로 표면별 재정의가 가능합니다.

상위 세션에 대기 중인 spawned subagent run이 하나 이상 있는 경우, 무음 응답만 있는 메시지는 다시 작성되지 않고 모든 표면에서 삭제됩니다. 따라서 자식 완료 이벤트가 실제 응답을 전달할 때까지 상위는 조용한 상태를 유지합니다.

## 관련 항목

- [Streaming](/ko/concepts/streaming) — 실시간 메시지 전달
- [Retry](/ko/concepts/retry) — 메시지 전달 재시도 동작
- [Queue](/ko/concepts/queue) — 메시지 처리 대기열
- [Channels](/ko/channels) — 메시징 플랫폼 통합
