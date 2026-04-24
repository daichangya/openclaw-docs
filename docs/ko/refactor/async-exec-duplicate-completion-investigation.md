---
read_when:
    - 반복되는 node exec 완료 이벤트 디버깅하기
    - Heartbeat/system-event 중복 제거 작업하기
summary: 중복 비동기 exec 완료 주입에 대한 조사 노트
title: 비동기 exec 중복 완료 조사
x-i18n:
    generated_at: "2026-04-24T06:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## 범위

- 세션: `agent:main:telegram:group:-1003774691294:topic:1`
- 증상: 동일한 세션/실행 `keen-nexus`에 대한 비동기 exec 완료가 LCM에 사용자 턴으로 두 번 기록됨
- 목표: 이것이 중복 세션 주입인지, 아니면 단순한 아웃바운드 전달 재시도인지 가장 가능성이 높은 원인을 식별

## 결론

가장 가능성이 높은 원인은 순수한 아웃바운드 전달 재시도가 아니라 **중복 세션 주입**입니다.

Gateway 쪽에서 가장 큰 간극은 **node exec completion 경로**에 있습니다.

1. node 측 exec 종료가 전체 `runId`와 함께 `exec.finished`를 발생시킴
2. Gateway `server-node-events`가 이를 시스템 이벤트로 변환하고 Heartbeat를 요청
3. Heartbeat 실행이 비워진 시스템 이벤트 블록을 에이전트 프롬프트에 주입
4. 임베디드 러너가 해당 프롬프트를 세션 transcript에 새로운 사용자 턴으로 저장

어떤 이유로든(재생, 재연결 중복, 업스트림 재전송, 중복 producer) 동일한 `runId`에 대한 `exec.finished`가 Gateway에 두 번 도달하면, OpenClaw는 현재 이 경로에서 `runId`/`contextKey` 기반 **멱등성 검사**를 하지 않습니다. 두 번째 사본도 같은 내용의 두 번째 사용자 메시지가 됩니다.

## 정확한 코드 경로

### 1. Producer: node exec completion 이벤트

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)`가 이벤트 `exec.finished`로 `node.event`를 발생시킴
  - 페이로드에는 `sessionKey`와 전체 `runId`가 포함됨

### 2. Gateway 이벤트 수집

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished`를 처리
  - 다음 텍스트를 구성:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 다음을 통해 큐에 추가:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 즉시 wake 요청:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 시스템 이벤트 중복 제거의 약점

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)`는 **연속된 동일 텍스트**만 억제함:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey`를 저장하지만, 멱등성에는 `contextKey`를 사용하지 않음
  - drain 후에는 중복 억제가 초기화됨

즉, 동일한 `runId`를 가진 재생된 `exec.finished`는 나중에 다시 수용될 수 있습니다. 코드에는 이미 안정적인 멱등성 후보(`exec:<runId>`)가 있음에도 그렇습니다.

### 4. Wake 처리는 주된 중복 원인이 아님

- `src/infra/heartbeat-wake.ts:79-117`
  - wake는 `(agentId, sessionKey)` 기준으로 병합됨
  - 동일 대상에 대한 중복 wake 요청은 하나의 대기 중 wake 엔트리로 합쳐짐

따라서 **wake 처리만의 중복**은 중복 이벤트 수집보다 설명력이 낮습니다.

### 5. Heartbeat가 이벤트를 소비해 프롬프트 입력으로 변환

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight가 대기 중인 시스템 이벤트를 살펴보고 exec-event 실행을 분류
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)`가 세션의 큐를 비움
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 비워진 시스템 이벤트 블록이 에이전트 프롬프트 본문 앞에 추가됨

### 6. Transcript 주입 지점

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)`가 전체 프롬프트를 임베디드 PI 세션에 제출
  - 완료 기반 프롬프트가 영속 사용자 턴이 되는 지점이 바로 여기임

따라서 동일한 시스템 이벤트가 두 번 프롬프트로 재구성되면, 중복 LCM 사용자 메시지가 생기는 것은 예상 가능한 결과입니다.

## 단순한 아웃바운드 전달 재시도 가능성이 더 낮은 이유

Heartbeat 러너에는 실제 아웃바운드 실패 경로가 있습니다.

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 먼저 응답이 생성됨
  - 이후 `deliverOutboundPayloads(...)`를 통해 아웃바운드 전달이 수행됨
  - 여기서 실패하면 `{ status: "failed" }`를 반환

하지만 같은 시스템 이벤트 큐 엔트리에 대해 이것만으로는 **중복 사용자 턴**을 설명하기에 충분하지 않습니다.

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 시스템 이벤트 큐는 아웃바운드 전달 전에 이미 drain됨

즉, 채널 전송 재시도만으로는 정확히 같은 큐 엔트리를 다시 만들 수 없습니다. 외부 전달 누락/실패는 설명할 수 있지만, 그 자체만으로 두 번째 동일 세션 사용자 메시지는 설명하지 못합니다.

## 2차적이고 신뢰도는 낮은 가능성

에이전트 러너에는 전체 실행 재시도 루프도 있습니다.

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 일부 일시적 실패는 전체 실행을 재시도하고 동일한 `commandBody`를 다시 제출할 수 있음

이 경우 재시도 조건이 발생하기 전에 프롬프트가 이미 추가되어 있었다면, **같은 응답 실행 내에서** 영속 사용자 프롬프트가 중복될 수 있습니다.

하지만 이를 중복 `exec.finished` 수집보다 낮게 평가하는 이유는 다음과 같습니다.

- 관찰된 간격이 약 51초였는데, 이는 프로세스 내부 재시도보다는 두 번째 wake/turn처럼 보임
- 보고서에 반복적인 메시지 전송 실패가 이미 언급되어 있어, 즉시 모델/런타임 재시도보다는 별도의 더 늦은 턴을 더 강하게 시사함

## 근본 원인 가설

가장 신뢰도가 높은 가설:

- `keen-nexus` 완료는 **node exec event 경로**를 통해 들어왔음
- 동일한 `exec.finished`가 `server-node-events`에 두 번 전달됨
- `enqueueSystemEvent(...)`가 `contextKey` / `runId` 기준으로 중복 제거를 하지 않기 때문에 Gateway가 둘 다 수용함
- 수용된 각 이벤트가 Heartbeat를 트리거했고, PI transcript에 사용자 턴으로 주입됨

## 제안하는 작은 외과적 수정

수정이 필요하다면, 가장 작은 고가치 변경은 다음과 같습니다.

- exec/system-event 멱등성이 적어도 짧은 시간 범위 동안은 `contextKey`를 존중하도록 하고, 최소한 정확히 같은 `(sessionKey, contextKey, text)` 반복은 차단
- 또는 `(sessionKey, runId, event kind)`를 키로 하는 `exec.finished` 전용 중복 제거를 `server-node-events`에 추가

이렇게 하면 재생된 `exec.finished` 중복이 세션 턴이 되기 전에 직접 차단됩니다.

## 관련 항목

- [Exec 도구](/ko/tools/exec)
- [세션 관리](/ko/concepts/session)
