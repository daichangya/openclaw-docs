---
read_when:
    - 수신 메시지가 어떻게 응답이 되는지 설명하기
    - 세션, 큐잉 모드 또는 스트리밍 동작 명확히 설명하기
    - 추론 가시성과 사용량 영향 문서화하기
summary: 메시지 흐름, 세션, 큐잉 및 추론 가시성
title: 메시지
x-i18n:
    generated_at: "2026-04-24T06:10:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

이 페이지는 OpenClaw가 수신 메시지, 세션, 큐잉,
스트리밍, 추론 가시성을 어떻게 처리하는지 함께 설명합니다.

## 메시지 흐름(상위 수준)

```
수신 메시지
  -> 라우팅/bindings -> 세션 키
  -> 큐(실행 중인 run이 있으면)
  -> 에이전트 run (스트리밍 + 도구)
  -> 발신 응답(채널 제한 + 청크 분할)
```

핵심 조정 항목은 구성에 있습니다:

- 접두사, 큐잉, 그룹 동작은 `messages.*`
- 블록 스트리밍 및 청크 분할 기본값은 `agents.defaults.*`
- 상한 및 스트리밍 토글은 채널 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등)

전체 스키마는 [구성](/ko/gateway/configuration)을 참조하세요.

## 수신 중복 제거

채널은 재연결 후 동일한 메시지를 다시 전달할 수 있습니다. OpenClaw는
채널/계정/피어/세션/메시지 ID를 키로 하는 단기 캐시를 유지하므로 중복
전달이 또 다른 에이전트 run을 트리거하지 않습니다.

## 수신 디바운싱

**같은 발신자**의 빠르게 연속된 메시지는 `messages.inbound`를 통해 하나의
에이전트 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화별로 범위가 지정되며,
응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

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

- 디바운스는 **텍스트 전용** 메시지에 적용되며, 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령은 독립적으로 유지되도록 디바운싱을 우회합니다. 단, 채널이 동일 발신자 DM 병합을 명시적으로 선택한 경우는 예외입니다(예: [BlueBubbles `coalesceSameSenderDms`](/ko/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)). 이 경우 DM 명령은 디바운스 창 안에서 대기하므로 분할 전송 payload가 동일한 에이전트 턴에 합류할 수 있습니다.

## 세션과 디바이스

세션은 클라이언트가 아니라 Gateway가 소유합니다.

- 직접 채팅은 에이전트 기본 세션 키로 병합됩니다.
- 그룹/채널은 자체 세션 키를 가집니다.
- 세션 저장소와 전사는 Gateway 호스트에 존재합니다.

여러 디바이스/채널이 동일한 세션에 매핑될 수 있지만, 기록이 모든
클라이언트에 완전히 다시 동기화되지는 않습니다. 권장 사항: 컨텍스트
분기를 피하려면 긴 대화에는 하나의 기본 디바이스를 사용하세요. Control UI와 TUI는 항상
Gateway 기반 세션 전사를 표시하므로 이것이 기준 원본입니다.

자세한 내용: [세션 관리](/ko/concepts/session).

## 수신 본문과 기록 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 분리합니다:

- `Body`: 에이전트로 전송되는 프롬프트 텍스트. 여기에 채널 envelope와
  선택적 기록 래퍼가 포함될 수 있습니다.
- `CommandBody`: directive/명령 파싱용 원시 사용자 텍스트.
- `RawBody`: `CommandBody`의 레거시 별칭(호환성 유지용).

채널이 기록을 제공할 때는 공유 래퍼를 사용합니다:

- `[마지막 응답 이후 채팅 메시지 - 컨텍스트용]`
- `[현재 메시지 - 여기에 응답]`

**비직접 채팅**(그룹/채널/룸)의 경우 **현재 메시지 본문** 앞에는
발신자 레이블이 붙습니다(기록 항목에 사용하는 것과 같은 스타일). 이렇게 하면 실시간 메시지와 대기열/기록
메시지가 에이전트 프롬프트에서 일관되게 유지됩니다.

기록 버퍼는 **대기 중 항목만** 포함합니다. 즉, run을 트리거하지 않은 그룹 메시지(예:
멘션 게이팅된 메시지)는 포함하고, 세션 전사에 이미 있는 메시지는
**제외**합니다.

directive 제거는 **현재 메시지** 섹션에만 적용되므로 기록은 그대로 유지됩니다.
기록을 감싸는 채널은 `CommandBody`(또는 `RawBody`)를 원본 메시지 텍스트로 설정하고,
`Body`는 결합된 프롬프트로 유지해야 합니다.
기록 버퍼는 `messages.groupChat.historyLimit`(전역 기본값)과
`channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 구성할 수 있습니다(`0`으로 설정하면 비활성화).

## 큐잉과 후속 처리

이미 run이 활성 상태이면 수신 메시지는 큐에 넣거나, 현재
run으로 유도하거나, 후속 턴용으로 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)로 구성합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect` 및 backlog 변형

자세한 내용: [큐잉](/ko/concepts/queue).

## 스트리밍, 청크 분할, 배치 처리

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 응답을 전송합니다.
청크 분할은 채널 텍스트 제한을 준수하며 fenced code를 분할하지 않도록 합니다.

핵심 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 배치 처리)
- `agents.defaults.humanDelay` (블록 응답 사이의 사람 같은 일시 정지)
- 채널 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (Telegram이 아닌 채널은 명시적인 `*.blockStreaming: true` 필요)

자세한 내용: [스트리밍 + 청크 분할](/ko/concepts/streaming).

## 추론 가시성과 토큰

OpenClaw는 모델 추론을 노출하거나 숨길 수 있습니다:

- `/reasoning on|off|stream`은 가시성을 제어합니다.
- 추론 콘텐츠는 모델이 생성한 경우 여전히 토큰 사용량에 포함됩니다.
- Telegram은 초안 버블로 추론 스트리밍을 지원합니다.

자세한 내용: [Thinking + 추론 directive](/ko/tools/thinking) 및 [토큰 사용](/ko/reference/token-use).

## 접두사, 스레딩, 응답

발신 메시지 형식은 `messages`에서 중앙 관리됩니다:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix` (발신 접두사 계단식), 그리고 `channels.whatsapp.messagePrefix` (WhatsApp 수신 접두사)
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩

자세한 내용: [구성](/ko/gateway/config-agents#messages) 및 채널 문서를 참조하세요.

## 무응답 응답

정확한 무응답 토큰 `NO_REPLY` / `no_reply`는 “사용자에게 보이는 응답을 전달하지 않음”을 의미합니다.
OpenClaw는 대화 유형에 따라 이 동작을 확인합니다:

- 직접 대화는 기본적으로 무응답을 허용하지 않으며, 순수 무응답
  응답을 짧은 가시 폴백으로 다시 작성합니다.
- 그룹/채널은 기본적으로 무응답을 허용합니다.
- 내부 오케스트레이션은 기본적으로 무응답을 허용합니다.

기본값은 `agents.defaults.silentReply` 및
`agents.defaults.silentReplyRewrite` 아래에 있고, `surfaces.<id>.silentReply` 및
`surfaces.<id>.silentReplyRewrite`로 표면별 재정의가 가능합니다.

부모 세션에 하나 이상의 대기 중 생성된 하위 에이전트 run이 있으면,
순수 무응답 응답은 다시 작성되지 않고 모든 표면에서 제거되므로,
하위 완료 이벤트가 실제 응답을 전달할 때까지 부모는 조용히 유지됩니다.

## 관련

- [스트리밍](/ko/concepts/streaming) — 실시간 메시지 전달
- [재시도](/ko/concepts/retry) — 메시지 전달 재시도 동작
- [큐](/ko/concepts/queue) — 메시지 처리 큐
- [채널](/ko/channels) — 메시징 플랫폼 통합
