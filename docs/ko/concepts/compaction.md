---
read_when:
    - 자동 Compaction과 /compact를 이해하고 싶으신 것입니다
    - 컨텍스트 한도에 도달하는 긴 세션을 디버깅하고 있습니다
summary: OpenClaw가 모델 한도 내에 머물기 위해 긴 대화를 요약하는 방법
title: Compaction
x-i18n:
    generated_at: "2026-04-24T06:09:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

모든 모델에는 처리할 수 있는 최대 토큰 수인 컨텍스트 창이 있습니다.
대화가 그 한도에 가까워지면 OpenClaw는 이전 메시지를 요약하여
채팅을 계속할 수 있도록 **Compaction**을 수행합니다.

## 작동 방식

1. 이전 대화 턴이 compact 항목으로 요약됩니다.
2. 이 요약은 세션 transcript에 저장됩니다.
3. 최근 메시지는 그대로 유지됩니다.

OpenClaw가 기록을 Compaction 청크로 나눌 때는 assistant 도구 호출이
해당 `toolResult` 항목과 짝을 이루도록 유지합니다. 분할 지점이 도구 블록 내부에 걸리면
OpenClaw는 경계를 이동하여 쌍이 함께 유지되도록 하고
현재 요약되지 않은 tail을 보존합니다.

전체 대화 기록은 디스크에 그대로 유지됩니다. Compaction은 다음 턴에서
모델이 보는 내용만 변경합니다.

## 자동 Compaction

자동 Compaction은 기본적으로 활성화되어 있습니다. 세션이 컨텍스트
한도에 가까워질 때 실행되거나, 모델이 컨텍스트 초과 오류를 반환할 때 실행됩니다(이 경우
OpenClaw는 Compaction을 수행한 뒤 재시도합니다). 일반적인 초과 징후에는
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`가 포함됩니다.

<Info>
Compaction 전에 OpenClaw는 에이전트에게 중요한 메모를
[memory](/ko/concepts/memory) 파일에 저장하라고 자동으로 상기시킵니다. 이렇게 하면 컨텍스트 손실을 방지할 수 있습니다.
</Info>

`openclaw.json`의 `agents.defaults.compaction` 설정을 사용하여 Compaction 동작(모드, 대상 토큰 수 등)을 구성하세요.
Compaction 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). `identifierPolicy: "off"`로 이를 재정의하거나, `identifierPolicy: "custom"` 및 `identifierInstructions`로 사용자 정의 텍스트를 제공할 수 있습니다.

선택적으로 `agents.defaults.compaction.model`을 통해 Compaction 요약에 다른 모델을 지정할 수 있습니다. 이는 기본 모델이 로컬 또는 소형 모델이고, 더 성능이 좋은 모델로 Compaction 요약을 생성하고 싶을 때 유용합니다. 재정의는 어떤 `provider/model-id` 문자열도 받을 수 있습니다.

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

이는 로컬 모델과도 작동합니다. 예를 들어 요약 전용 두 번째 Ollama 모델이나 미세 조정된 Compaction 전용 모델을 사용할 수 있습니다.

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

설정하지 않으면 Compaction은 에이전트의 기본 모델을 사용합니다.

## 플러그형 Compaction provider

Plugins는 Plugin API의 `registerCompactionProvider()`를 통해 사용자 정의 Compaction provider를 등록할 수 있습니다. provider가 등록되고 구성되면 OpenClaw는 내장 LLM 파이프라인 대신 해당 provider에 요약을 위임합니다.

등록된 provider를 사용하려면 구성에서 provider ID를 설정하세요.

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

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제됩니다. provider는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 전달받으며, OpenClaw는 provider 출력 후에도 최근 턴 및 분할 턴 접미 컨텍스트를 계속 보존합니다. provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 내장 LLM 요약으로 대체합니다.

## 자동 Compaction(기본 활성화)

세션이 모델의 컨텍스트 창에 가까워지거나 이를 초과하면 OpenClaw는 자동 Compaction을 트리거하고 compact된 컨텍스트를 사용해 원래 요청을 재시도할 수 있습니다.

다음이 표시됩니다.

- verbose 모드에서 `🧹 Auto-compaction complete`
- `/status`에서 `🧹 Compactions: <count>`

Compaction 전에 OpenClaw는 지속적인 메모를 디스크에 저장하기 위해
**무음 memory flush** 턴을 실행할 수 있습니다. 자세한 내용과 구성은 [메모리](/ko/concepts/memory)를 참조하세요.

## 수동 Compaction

Compaction을 강제로 실행하려면 채팅에서 `/compact`를 입력하세요. 요약을
유도하는 지침을 추가할 수도 있습니다.

```
/compact API 설계 결정에 집중
```

## 다른 모델 사용

기본적으로 Compaction은 에이전트의 기본 모델을 사용합니다. 더 나은 요약을 위해
더 성능이 좋은 모델을 사용할 수 있습니다.

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

기본적으로 Compaction은 조용히 실행됩니다. Compaction이
시작될 때와 완료될 때 짧은 알림을 표시하려면 `notifyUser`를 활성화하세요.

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

활성화하면 사용자는 각 Compaction 실행 전후에 짧은 상태 메시지를 보게 됩니다
(예: "컨텍스트 Compaction 중..." 및 "Compaction 완료").

## Compaction과 pruning의 차이

|                  | Compaction | Pruning |
| ---------------- | ----------------------------- | -------------------------------- |
| **수행 작업** | 이전 대화 요약 | 오래된 도구 결과 잘라내기 |
| **저장됨?** | 예(세션 transcript에) | 아니요(메모리 내에서만, 요청별) |
| **범위** | 전체 대화 | 도구 결과만 |

[세션 pruning](/ko/concepts/session-pruning)은
도구 출력을 요약 없이 잘라내는 더 가벼운 보완 기능입니다.

## 문제 해결

**Compaction이 너무 자주 발생하나요?** 모델의 컨텍스트 창이 작거나 도구
출력이 클 수 있습니다. [세션 pruning](/ko/concepts/session-pruning)을
활성화해 보세요.

**Compaction 후 컨텍스트가 오래된 것처럼 느껴지나요?** `/compact <topic>에 집중`을 사용해
요약을 유도하거나, 메모가 유지되도록 [memory flush](/ko/concepts/memory)를
활성화하세요.

**완전히 새로 시작해야 하나요?** `/new`는 Compaction 없이 새 세션을 시작합니다.

고급 구성(예비 토큰, 식별자 보존, 사용자 정의
컨텍스트 엔진, OpenAI 서버 측 Compaction)은
[세션 관리 심화](/ko/reference/session-management-compaction)를 참조하세요.

## 관련

- [세션](/ko/concepts/session) — 세션 관리 및 수명 주기
- [세션 Pruning](/ko/concepts/session-pruning) — 도구 결과 잘라내기
- [컨텍스트](/ko/concepts/context) — 에이전트 턴을 위한 컨텍스트 구성 방식
- [Hooks](/ko/automation/hooks) — Compaction 수명 주기 Hook (`before_compaction`, `after_compaction`)
