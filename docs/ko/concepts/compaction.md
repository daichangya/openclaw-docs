---
read_when:
    - 자동 compaction과 /compact를 이해하고 싶습니다
    - 컨텍스트 한도에 걸리는 긴 세션을 디버깅하고 있습니다
summary: OpenClaw가 모델 한도 내에 머물기 위해 긴 대화를 요약하는 방법
title: Compaction
x-i18n:
    generated_at: "2026-04-08T02:14:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6590b82a8c3a9c310998d653459ca4d8612495703ca0a8d8d306d7643142fd1
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

모든 모델에는 처리할 수 있는 최대 토큰 수인 컨텍스트 윈도우가 있습니다.
대화가 그 한도에 가까워지면 OpenClaw는 이전 메시지를 요약하여
채팅을 계속할 수 있도록 **compacts** 합니다.

## 작동 방식

1. 이전 대화 턴이 compact 항목으로 요약됩니다.
2. 요약은 세션 전사에 저장됩니다.
3. 최근 메시지는 그대로 유지됩니다.

OpenClaw가 기록을 compaction 청크로 나눌 때는 assistant 도구 호출을
해당하는 `toolResult` 항목과 함께 짝지어 유지합니다. 분할 지점이
도구 블록 내부에 걸리면 OpenClaw는 경계를 이동해 그 쌍이 함께 유지되고
현재 요약되지 않은 꼬리 부분이 보존되도록 합니다.

전체 대화 기록은 디스크에 그대로 남아 있습니다. Compaction은 다음 턴에
모델이 보게 되는 내용만 변경합니다.

## 자동 compaction

자동 compaction은 기본적으로 활성화되어 있습니다. 세션이 컨텍스트 한도에
가까워질 때 실행되거나, 모델이 컨텍스트 초과 오류를 반환할 때 실행됩니다
(이 경우 OpenClaw는 compaction을 수행한 뒤 재시도합니다). 일반적인
초과 시그니처에는 `request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`가 포함됩니다.

<Info>
Compaction을 수행하기 전에 OpenClaw는 자동으로 에이전트에게 중요한
메모를 [memory](/ko/concepts/memory) 파일에 저장하라고 알려줍니다. 이렇게 하면 컨텍스트 손실을 방지할 수 있습니다.
</Info>

`openclaw.json`의 `agents.defaults.compaction` 설정을 사용해 compaction 동작(모드, 대상 토큰 수 등)을 구성하세요.
Compaction 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). 이를 `identifierPolicy: "off"`로 재정의하거나, `identifierPolicy: "custom"`과 `identifierInstructions`를 사용해 사용자 지정 텍스트를 제공할 수 있습니다.

선택적으로 `agents.defaults.compaction.model`을 통해 compaction 요약에 다른 모델을 지정할 수 있습니다. 기본 모델이 로컬 모델이거나 작은 모델이고, 더 강력한 모델이 compaction 요약을 생성하도록 하고 싶을 때 유용합니다. 이 재정의는 모든 `provider/model-id` 문자열을 허용합니다.

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

이 설정은 로컬 모델과도 함께 사용할 수 있습니다. 예를 들어, 요약 전용의 두 번째 Ollama 모델이나 미세 조정된 compaction 전용 모델에 사용할 수 있습니다.

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

설정하지 않으면 compaction은 에이전트의 기본 모델을 사용합니다.

## 플러그형 compaction provider

플러그인은 plugin API의 `registerCompactionProvider()`를 통해 사용자 지정 compaction provider를 등록할 수 있습니다. provider가 등록되고 구성되면 OpenClaw는 내장 LLM 파이프라인 대신 해당 provider에 요약을 위임합니다.

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

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제됩니다. Provider는 내장 경로와 동일한 compaction 지침과 식별자 보존 정책을 받으며, provider 출력 이후에도 OpenClaw는 최근 턴 및 분할된 턴의 접미 컨텍스트를 계속 보존합니다. provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 내장 LLM 요약으로 대체합니다.

## 자동 compaction (기본 활성화)

세션이 모델의 컨텍스트 윈도우에 가까워지거나 이를 초과하면 OpenClaw는 자동 compaction을 트리거하고, compacted된 컨텍스트를 사용해 원래 요청을 다시 시도할 수 있습니다.

다음과 같이 표시됩니다.

- verbose 모드에서 `🧹 Auto-compaction complete`
- `/status`에 `🧹 Compactions: <count>` 표시

Compaction 전에 OpenClaw는 **silent memory flush** 턴을 실행하여
영구 메모를 디스크에 저장할 수 있습니다. 자세한 내용과 설정은
[Memory](/ko/concepts/memory)를 참고하세요.

## 수동 compaction

어떤 채팅에서든 `/compact`를 입력하면 compaction을 강제로 실행할 수 있습니다. 요약을 안내하는 지침을 추가할 수도 있습니다.

```
/compact API 설계 결정에 집중
```

## 다른 모델 사용

기본적으로 compaction은 에이전트의 기본 모델을 사용합니다. 더 나은
요약을 위해 더 강력한 모델을 사용할 수 있습니다.

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

## Compaction 시작 알림

기본적으로 compaction은 조용히 실행됩니다. compaction이 시작될 때
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

활성화하면 사용자는 각 compaction 실행 시작 시 짧은 메시지
(예: "컨텍스트를 압축하는 중...")를 보게 됩니다.

## Compaction과 pruning 비교

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **역할** | 이전 대화를 요약 | 오래된 도구 결과를 잘라냄           |
| **저장됨?**       | 예(세션 전사에 저장)   | 아니요(메모리 내에서만, 요청별) |
| **범위**        | 전체 대화           | 도구 결과만                |

[Session pruning](/ko/concepts/session-pruning)은
요약 없이 도구 출력을 잘라내는 더 가벼운 보완 기능입니다.

## 문제 해결

**Compaction이 너무 자주 발생하나요?** 모델의 컨텍스트 윈도우가 작거나, 도구
출력이 클 수 있습니다. [session pruning](/ko/concepts/session-pruning)을
활성화해 보세요.

**Compaction 후 컨텍스트가 오래된 것처럼 느껴지나요?** `/compact Focus on <topic>`을 사용해
요약 방향을 지정하거나, 메모가 유지되도록 [memory flush](/ko/concepts/memory)를
활성화하세요.

**완전히 새로 시작하고 싶나요?** `/new`는 compaction 없이 새 세션을 시작합니다.

고급 구성(예약 토큰, 식별자 보존, 사용자 지정
컨텍스트 엔진, OpenAI 서버 측 compaction)에 대해서는
[Session Management Deep Dive](/ko/reference/session-management-compaction)를 참고하세요.

## 관련 항목

- [Session](/ko/concepts/session) — 세션 관리 및 수명 주기
- [Session Pruning](/ko/concepts/session-pruning) — 도구 결과 잘라내기
- [Context](/ko/concepts/context) — 에이전트 턴을 위한 컨텍스트가 구성되는 방식
- [Hooks](/ko/automation/hooks) — compaction 수명 주기 훅 (before_compaction, after_compaction)
