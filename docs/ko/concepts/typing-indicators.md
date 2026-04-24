---
read_when:
    - 타이핑 표시기 동작 또는 기본값 변경하기
summary: OpenClaw가 타이핑 표시기를 보여주는 시점과 이를 조정하는 방법
title: 타이핑 표시기
x-i18n:
    generated_at: "2026-04-24T06:12:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

타이핑 표시기는 실행이 활성 상태인 동안 채팅 채널로 전송됩니다.
`agents.defaults.typingMode`를 사용해 타이핑이 **언제** 시작되는지 제어하고,
`typingIntervalSeconds`를 사용해 **얼마나 자주** 새로 고침되는지 제어하세요.

## 기본값

`agents.defaults.typingMode`가 **설정되지 않은 경우**, OpenClaw는 레거시 동작을 유지합니다.

- **직접 채팅**: 모델 루프가 시작되면 즉시 타이핑이 시작됩니다.
- **멘션이 있는 그룹 채팅**: 즉시 타이핑이 시작됩니다.
- **멘션이 없는 그룹 채팅**: 메시지 텍스트 스트리밍이 시작될 때만 타이핑이 시작됩니다.
- **Heartbeat 실행**: 확인된 Heartbeat 대상이 타이핑 가능한 채팅이고 타이핑이 비활성화되지 않았다면,
  Heartbeat 실행이 시작될 때 타이핑이 시작됩니다.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정하세요.

- `never` — 타이핑 표시기를 전혀 표시하지 않습니다.
- `instant` — 실행이 나중에 silent reply token만 반환하더라도,
  **모델 루프가 시작되자마자** 타이핑을 시작합니다.
- `thinking` — **첫 reasoning delta**에서 타이핑을 시작합니다(실행에
  `reasoningLevel: "stream"` 필요).
- `message` — **첫 번째 non-silent text delta**에서 타이핑을 시작합니다(
  `NO_REPLY` silent token은 무시).

“얼마나 빨리 시작되는가” 순서:
`never` → `message` → `thinking` → `instant`

## 구성

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

세션별로 모드나 주기를 재정의할 수 있습니다.

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 참고

- `message` 모드는 전체 페이로드가 정확히 silent token일 때(예: `NO_REPLY` / `no_reply`,
  대소문자 구분 없이 일치) silent-only 응답에 대해 타이핑을 표시하지 않습니다.
- `thinking`은 실행이 reasoning을 스트리밍할 때만 실행됩니다(`reasoningLevel: "stream"`).
  모델이 reasoning delta를 내보내지 않으면 타이핑이 시작되지 않습니다.
- Heartbeat 타이핑은 확인된 전달 대상에 대한 활성 상태 신호입니다.
  `message` 또는 `thinking`
  스트림 타이밍을 따르지 않고 Heartbeat 실행 시작 시 시작됩니다. 비활성화하려면 `typingMode: "never"`를 설정하세요.
- Heartbeat는 `target: "none"`일 때, 대상을
  확인할 수 없을 때, Heartbeat에 대한 채팅 전달이 비활성화되어 있을 때, 또는
  채널이 타이핑을 지원하지 않을 때 타이핑을 표시하지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아니라 **새로 고침 주기**를 제어합니다.
  기본값은 6초입니다.

## 관련

- [프레즌스](/ko/concepts/presence)
- [스트리밍 및 청킹](/ko/concepts/streaming)
