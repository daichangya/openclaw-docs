---
read_when:
    - 현재 세션에 대해 빠른 곁질문을 하고 싶으신 것입니다
    - 클라이언트 전반에서 BTW 동작을 구현하거나 디버깅하고 있습니다
summary: '`/btw`를 사용한 임시 곁질문'
title: BTW 곁질문
x-i18n:
    generated_at: "2026-04-24T06:38:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw`를 사용하면 **현재 세션**에 대해 빠른 곁질문을 할 수 있으며,
그 질문이 일반 대화 기록으로 들어가지 않습니다.

이는 Claude Code의 `/btw` 동작을 모델로 했지만, OpenClaw의
Gateway 및 다중 채널 아키텍처에 맞게 조정되었습니다.

## 무엇을 하는가

다음을 보내면:

```text
/btw what changed?
```

OpenClaw는:

1. 현재 세션 컨텍스트를 스냅샷하고,
2. 별도의 **도구 없는** 모델 호출을 실행하고,
3. 곁질문에만 답하고,
4. 메인 실행은 그대로 두며,
5. BTW 질문이나 답변을 세션 기록에 **기록하지 않고**,
6. 답변을 일반 assistant 메시지가 아닌 **라이브 side result**로 내보냅니다.

중요한 정신 모델은 다음과 같습니다:

- 같은 세션 컨텍스트
- 별도의 일회성 곁질문
- 도구 호출 없음
- 미래 컨텍스트 오염 없음
- transcript 지속성 없음

## 하지 않는 것

`/btw`는 **다음과 같은 일을 하지 않습니다**:

- 새로운 지속 세션 생성
- 미완성 메인 작업 계속 수행
- 도구 또는 agent 도구 루프 실행
- transcript 기록에 BTW 질문/답변 데이터 쓰기
- `chat.history`에 표시
- reload 이후 유지

의도적으로 **임시적**입니다.

## 컨텍스트 작동 방식

BTW는 현재 세션을 **배경 컨텍스트로만** 사용합니다.

메인 실행이 현재 활성 상태이면 OpenClaw는 현재 메시지
상태를 스냅샷하고 진행 중인 메인 프롬프트를 배경 컨텍스트에 포함하되,
동시에 모델에 명시적으로 다음을 지시합니다:

- 곁질문에만 답할 것
- 미완성 메인 작업을 다시 시작하거나 완료하지 말 것
- 도구 호출이나 가짜 도구 호출을 내보내지 말 것

이렇게 하면 BTW는 메인 실행으로부터 격리된 상태를 유지하면서도
세션의 주제가 무엇인지 인식할 수 있습니다.

## 전달 모델

BTW는 **일반 assistant transcript 메시지로 전달되지 않습니다**.

Gateway 프로토콜 수준에서:

- 일반 assistant 채팅은 `chat` 이벤트를 사용
- BTW는 `chat.side_result` 이벤트를 사용

이 분리는 의도적입니다. BTW가 일반 `chat` 이벤트 경로를 재사용한다면,
클라이언트는 이를 일반 대화 기록으로 취급하게 됩니다.

BTW는 별도의 라이브 이벤트를 사용하고
`chat.history`에서 재생되지 않기 때문에, reload 후에는 사라집니다.

## 표면 동작

### TUI

TUI에서 BTW는 현재 세션 보기 안에 인라인으로 렌더링되지만,
여전히 임시적입니다:

- 일반 assistant 답변과 시각적으로 구별됨
- `Enter` 또는 `Esc`로 닫을 수 있음
- reload 시 재생되지 않음

### 외부 채널

Telegram, WhatsApp, Discord 같은 채널에서는 BTW가
로컬 임시 오버레이 개념이 없기 때문에 명확히 라벨이 붙은 일회성 답변으로 전달됩니다.

답변은 여전히 일반 세션 기록이 아니라 side result로 취급됩니다.

### Control UI / 웹

Gateway는 BTW를 `chat.side_result`로 올바르게 내보내고, BTW는
`chat.history`에 포함되지 않으므로, 웹용 지속성 계약은 이미 올바릅니다.

현재 Control UI는 브라우저에서 BTW를 라이브로 렌더링하려면
전용 `chat.side_result` consumer가 아직 필요합니다. 클라이언트 측 지원이 들어오기 전까지 BTW는
Gateway 수준 기능으로서 TUI와 외부 채널에서는 완전하게 동작하지만,
브라우저 UX는 아직 완전하지 않습니다.

## BTW를 사용해야 하는 경우

다음이 필요할 때 `/btw`를 사용하세요:

- 현재 작업에 대한 빠른 명확화
- 긴 실행이 아직 진행 중일 때 사실 기반의 곁답변
- 미래 세션 컨텍스트의 일부가 되어서는 안 되는 임시 답변

예시:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW를 사용하지 말아야 하는 경우

답변이 세션의
미래 작업 컨텍스트 일부가 되길 원한다면 `/btw`를 사용하지 마세요.

그 경우에는 BTW를 사용하는 대신 메인 세션에서 일반 질문으로 물어보세요.

## 관련

- [슬래시 명령](/ko/tools/slash-commands)
- [Thinking Levels](/ko/tools/thinking)
- [세션](/ko/concepts/session)
