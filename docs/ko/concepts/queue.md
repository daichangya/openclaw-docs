---
read_when:
    - 자동 응답 실행 또는 동시성 변경하기
summary: 수신 자동 응답 run을 직렬화하는 명령 큐 설계
title: 명령 큐
x-i18n:
    generated_at: "2026-04-24T06:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# 명령 큐 (2026-01-16)

여러 에이전트 run이 서로 충돌하지 않도록, 수신 자동 응답 run(모든 채널)을 작은 인프로세스 큐를 통해 직렬화하면서도 세션 간의 안전한 병렬성은 허용합니다.

## 이유

- 자동 응답 run은 비용이 클 수 있으며(LLM 호출), 여러 수신 메시지가 짧은 간격으로 도착하면 서로 충돌할 수 있습니다.
- 직렬화는 공유 리소스(세션 파일, 로그, CLI stdin)에 대한 경쟁을 피하고 업스트림 속도 제한 가능성을 줄입니다.

## 작동 방식

- 레인 인식 FIFO 큐가 각 레인을 구성 가능한 동시성 상한으로 소진합니다(구성되지 않은 레인의 기본값은 1, main 기본값은 4, subagent는 8).
- `runEmbeddedPiAgent`는 **세션 키**(레인 `session:<key>`) 기준으로 큐에 넣어 세션당 활성 run이 하나만 있도록 보장합니다.
- 그런 다음 각 세션 run은 **전역 레인**(`main`이 기본값)으로 큐에 들어가며 전체 병렬성은 `agents.defaults.maxConcurrent`로 제한됩니다.
- 자세한 로깅이 활성화되면, 큐에 들어간 run은 시작 전에 약 2초 이상 기다린 경우 짧은 알림을 출력합니다.
- 입력 중 표시기는 여전히 큐에 넣는 즉시 동작하므로(채널이 지원하는 경우), 차례를 기다리는 동안에도 사용자 경험은 바뀌지 않습니다.

## 큐 모드(채널별)

수신 메시지는 현재 run을 유도하거나, 후속 턴을 기다리거나, 둘 다 할 수 있습니다:

- `steer`: 현재 run에 즉시 주입합니다(다음 도구 경계 후 대기 중인 도구 호출 취소). 스트리밍이 아니면 `followup`으로 폴백합니다.
- `followup`: 현재 run이 끝난 뒤 다음 에이전트 턴에 큐로 넣습니다.
- `collect`: 큐에 있는 모든 메시지를 **하나의** 후속 턴으로 병합합니다(기본값). 메시지가 서로 다른 채널/스레드를 대상으로 하면 라우팅 보존을 위해 개별적으로 소진됩니다.
- `steer-backlog` (`steer+backlog`라고도 함): 지금 유도하면서 **동시에** 후속 턴을 위해 메시지를 보존합니다.
- `interrupt` (레거시): 해당 세션의 활성 run을 중단한 뒤 최신 메시지를 실행합니다.
- `queue` (레거시 별칭): `steer`와 동일합니다.

Steer-backlog는 유도된 run 뒤에 후속 응답이 생길 수 있으므로,
스트리밍 표면에서는 중복처럼 보일 수 있습니다. 수신 메시지당
응답 하나를 원한다면 `collect`/`steer`를 선호하세요.
독립 명령으로 `/queue collect`를 보내어(세션별) 설정하거나, `messages.queue.byChannel.discord: "collect"`를 설정하세요.

기본값(구성에서 설정되지 않은 경우):

- 모든 표면 → `collect`

전역 또는 채널별로 `messages.queue`를 통해 구성합니다:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 큐 옵션

옵션은 `followup`, `collect`, `steer-backlog`에 적용됩니다(`steer`가 `followup`으로 폴백하는 경우에도 적용):

- `debounceMs`: 후속 턴 시작 전 잠잠해질 때까지 대기합니다(“continue, continue” 방지).
- `cap`: 세션당 최대 대기 메시지 수.
- `drop`: 오버플로 정책(`old`, `new`, `summarize`).

Summarize는 삭제된 메시지의 짧은 글머리표 목록을 유지하고 이를 합성 후속 프롬프트로 주입합니다.
기본값: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## 세션별 재정의

- 독립 명령으로 `/queue <mode>`를 보내면 현재 세션의 모드를 저장합니다.
- 옵션을 함께 결합할 수 있습니다: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 세션 재정의를 지웁니다.

## 범위와 보장

- Gateway 응답 파이프라인을 사용하는 모든 수신 채널의 자동 응답 에이전트 run에 적용됩니다(WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat 등).
- 기본 레인(`main`)은 수신 + main Heartbeat에 대해 프로세스 전체 범위입니다. 여러 세션을 병렬로 허용하려면 `agents.defaults.maxConcurrent`를 설정하세요.
- 추가 레인(예: `cron`, `subagent`)이 존재할 수 있으므로 백그라운드 작업이 수신 응답을 막지 않고 병렬로 실행될 수 있습니다. 이러한 분리된 run은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.
- 세션별 레인은 주어진 세션을 한 번에 하나의 에이전트 run만 건드리도록 보장합니다.
- 외부 의존성이나 백그라운드 워커 스레드 없음. 순수 TypeScript + promise 기반입니다.

## 문제 해결

- 명령이 멈춘 것처럼 보이면 자세한 로그를 활성화하고 “queued for …ms” 줄을 찾아 큐가 실제로 소진되고 있는지 확인하세요.
- 큐 깊이가 필요하면 자세한 로그를 활성화하고 큐 타이밍 줄을 확인하세요.

## 관련

- [세션 관리](/ko/concepts/session)
- [재시도 정책](/ko/concepts/retry)
