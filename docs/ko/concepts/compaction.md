---
read_when:
    - 자동 Compaction과 /compact를 이해하고 싶습니다
    - 컨텍스트 한도에 도달하는 긴 세션을 디버깅하고 있습니다
summary: OpenClaw가 모델 한도 내에 머물기 위해 긴 대화를 요약하는 방식
title: Compaction
x-i18n:
    generated_at: "2026-04-21T06:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

모든 모델에는 처리할 수 있는 최대 토큰 수인 컨텍스트 윈도우가 있습니다.
대화가 그 한계에 가까워지면, OpenClaw는 이전 메시지를 요약으로 **Compaction**하여
채팅을 계속할 수 있게 합니다.

## 작동 방식

1. 이전 대화 턴이 compact 항목으로 요약됩니다.
2. 요약은 세션 transcript에 저장됩니다.
3. 최근 메시지는 그대로 유지됩니다.

OpenClaw가 기록을 compaction 청크로 나눌 때는, assistant tool
call이 대응하는 `toolResult` 항목과 짝을 이루도록 유지합니다. 분할 지점이
tool 블록 내부에 걸리면, OpenClaw는 해당 쌍이 함께 유지되고 현재의
요약되지 않은 tail이 보존되도록 경계를 이동합니다.

전체 대화 기록은 디스크에 그대로 남아 있습니다. Compaction은 다음 턴에서
모델이 무엇을 보게 되는지만 바꿉니다.

## 자동 Compaction

자동 Compaction은 기본적으로 활성화되어 있습니다. 세션이 컨텍스트 한계에
가까워질 때 실행되며, 모델이 컨텍스트 초과 오류를 반환했을 때도 실행됩니다(이 경우
OpenClaw는 Compaction을 수행한 뒤 재시도합니다). 일반적인 초과 시그니처에는
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`가 포함됩니다.

<Info>
Compaction 전에 OpenClaw는 중요한 메모를 [memory](/ko/concepts/memory) 파일에 저장하라고
에이전트에 자동으로 상기시킵니다. 이렇게 하면 컨텍스트 손실을 방지할 수 있습니다.
</Info>

`openclaw.json`의 `agents.defaults.compaction` 설정을 사용해 Compaction 동작(모드, 대상 토큰 수 등)을 구성하세요.
Compaction 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). 이를 `identifierPolicy: "off"`로 재정의하거나, `identifierPolicy: "custom"`과 `identifierInstructions`를 사용해 사용자 지정 텍스트를 제공할 수 있습니다.

선택적으로 `agents.defaults.compaction.model`을 통해 Compaction 요약용으로 다른 모델을 지정할 수 있습니다. 이는 기본 모델이 로컬 모델이거나 소형 모델이고, 더 강력한 모델이 Compaction 요약을 생성하도록 하고 싶을 때 유용합니다. 이 재정의는 모든 `provider/model-id` 문자열을 받을 수 있습니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

이것은 로컬 모델과도 함께 동작합니다. 예를 들어 요약 전용의 두 번째 Ollama 모델이나 미세 조정된 Compaction 전문 모델을 사용할 수 있습니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

설정하지 않으면, Compaction은 에이전트의 기본 모델을 사용합니다.

## 플러그형 Compaction provider

Plugin은 plugin API의 `registerCompactionProvider()`를 통해 사용자 지정 Compaction provider를 등록할 수 있습니다. provider가 등록되고 구성되면, OpenClaw는 내장 LLM 파이프라인 대신 해당 provider에 요약을 위임합니다.

등록된 provider를 사용하려면 config에서 provider id를 설정하세요.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제됩니다. provider는 내장 경로와 동일한 Compaction 지침과 식별자 보존 정책을 받으며, OpenClaw는 provider 출력 이후에도 최근 턴 및 분할 턴 suffix 컨텍스트를 계속 보존합니다. provider가 실패하거나 빈 결과를 반환하면, OpenClaw는 내장 LLM 요약으로 폴백합니다.

## 자동 Compaction(기본 활성화)

세션이 모델의 컨텍스트 윈도우에 가까워지거나 이를 초과하면, OpenClaw는 자동 Compaction을 트리거하고 compact된 컨텍스트를 사용해 원래 요청을 재시도할 수 있습니다.

다음과 같이 표시됩니다.

- verbose 모드에서 `🧹 Auto-compaction complete`
- `/status`에 `🧹 Compactions: <count>` 표시

Compaction 전에 OpenClaw는 **silent memory flush** 턴을 실행해
지속 메모를 디스크에 저장할 수 있습니다. 자세한 내용과 설정은 [Memory](/ko/concepts/memory)를 참고하세요.

## 수동 Compaction

아무 채팅에서나 `/compact`를 입력해 강제로 Compaction을 수행할 수 있습니다. 요약을
유도하려면 지침을 추가하세요.

```
/compact Focus on the API design decisions
```

## 다른 모델 사용

기본적으로 Compaction은 에이전트의 기본 모델을 사용합니다. 더 나은 요약을 위해
더 강력한 모델을 사용할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction 알림

기본적으로 Compaction은 조용히 실행됩니다. Compaction이 시작될 때와 완료될 때
짧은 알림을 표시하려면 `notifyUser`를 활성화하세요.

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

활성화되면 사용자는 각 Compaction 실행 전후에 짧은 상태 메시지를 보게 됩니다
(예: "컨텍스트 Compaction 중..." 및 "Compaction 완료").

## Compaction vs pruning

|                  | Compaction                    | pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **무엇을 하는가** | 이전 대화를 요약함 | 오래된 tool result를 잘라냄           |
| **저장되는가?**       | 예(세션 transcript에)   | 아니요(메모리 내에서만, 요청별) |
| **범위**        | 전체 대화           | tool result만                |

[Session pruning](/ko/concepts/session-pruning)은
요약 없이 tool 출력을 잘라내는 더 가벼운 보완 기능입니다.

## 문제 해결

**Compaction이 너무 자주 발생하나요?** 모델의 컨텍스트 윈도우가 작거나, tool
출력이 클 수 있습니다. [session pruning](/ko/concepts/session-pruning)을
활성화해 보세요.

**Compaction 후 컨텍스트가 오래된 것처럼 느껴지나요?** `/compact Focus on <topic>`을 사용해
요약을 유도하거나, 메모가 유지되도록 [memory flush](/ko/concepts/memory)를
활성화하세요.

**깨끗한 상태로 다시 시작해야 하나요?** `/new`는 Compaction 없이 새 세션을 시작합니다.

고급 구성(예약 토큰, 식별자 보존, 사용자 지정
컨텍스트 엔진, OpenAI 서버 측 Compaction)에 대해서는
[Session Management Deep Dive](/ko/reference/session-management-compaction)를 참고하세요.

## 관련 항목

- [Session](/ko/concepts/session) — 세션 관리와 라이프사이클
- [Session Pruning](/ko/concepts/session-pruning) — tool result 잘라내기
- [Context](/ko/concepts/context) — 에이전트 턴을 위한 컨텍스트가 구성되는 방식
- [Hooks](/ko/automation/hooks) — Compaction 라이프사이클 hook (`before_compaction`, `after_compaction`)
