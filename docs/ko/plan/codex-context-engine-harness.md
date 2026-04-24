---
read_when:
    - Codex 하네스에 context-engine 수명 주기 동작을 연결하고 있습니다
    - '`lossless-claw` 또는 다른 context-engine Plugin이 codex/* 내장 하네스 세션에서 동작해야 합니다'
    - 내장 PI와 Codex app-server 컨텍스트 동작을 비교하고 있습니다
summary: 번들된 Codex app-server 하네스가 OpenClaw context-engine Plugins를 준수하도록 만들기 위한 사양
title: Codex 하네스 컨텍스트 엔진 이식
x-i18n:
    generated_at: "2026-04-24T06:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Codex 하네스 컨텍스트 엔진 이식

## 상태

초안 구현 사양입니다.

## 목표

번들된 Codex app-server 하네스가 이미 내장 PI 턴이 따르는 것과 동일한 OpenClaw context-engine
수명 주기 계약을 따르도록 만듭니다.

`agents.defaults.embeddedHarness.runtime: "codex"` 또는
`codex/*` 모델을 사용하는 세션에서도 `lossless-claw` 같은 선택된 context-engine Plugin이
Codex app-server 경계가 허용하는 범위 내에서 컨텍스트 조립, 턴 후 ingest, 유지보수,
OpenClaw 수준 Compaction 정책을 제어할 수 있어야 합니다.

## 비목표

- Codex app-server 내부를 재구현하지 않습니다.
- Codex 네이티브 스레드 Compaction이 lossless-claw 요약을 생성하게 하지 않습니다.
- 비-Codex 모델이 Codex 하네스를 사용하도록 강제하지 않습니다.
- ACP/acpx 세션 동작은 변경하지 않습니다. 이 사양은
  비-ACP 내장 에이전트 하네스 경로만을 위한 것입니다.
- 서드파티 Plugins가 Codex app-server 확장 팩토리를 등록하게 하지 않습니다.
  기존 번들 Plugin 신뢰 경계는 그대로 유지됩니다.

## 현재 아키텍처

내장 run 루프는 구체적인 저수준 하네스를 선택하기 전에 실행당 한 번 구성된 context engine을 확인합니다:

- `src/agents/pi-embedded-runner/run.ts`
  - context-engine Plugins 초기화
  - `resolveContextEngine(params.config)` 호출
  - `contextEngine`과 `contextTokenBudget`을
    `runEmbeddedAttemptWithBackend(...)`에 전달

`runEmbeddedAttemptWithBackend(...)`는 선택된 에이전트 하네스로 위임합니다:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server 하네스는 번들된 Codex Plugin에 의해 등록됩니다:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex 하네스 구현은 PI 기반 시도와 동일한 `EmbeddedRunAttemptParams`를 받습니다:

- `extensions/codex/src/app-server/run-attempt.ts`

즉, 필요한 훅 지점은 OpenClaw가 제어하는 코드 안에 있습니다. 외부
경계는 Codex app-server 프로토콜 자체입니다. OpenClaw는
`thread/start`, `thread/resume`, `turn/start`에 무엇을 보내는지는 제어할 수 있고
알림도 관찰할 수 있지만, Codex의 내부 스레드 저장소나 네이티브 compactor는 변경할 수 없습니다.

## 현재 공백

내장 PI 시도는 context-engine 수명 주기를 직접 호출합니다:

- 시도 전 bootstrap/maintenance
- 모델 호출 전 assemble
- 시도 후 afterTurn 또는 ingest
- 성공적인 턴 후 maintenance
- context engine이 Compaction을 소유하는 경우 context-engine Compaction

관련 PI 코드:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

현재 Codex app-server 시도는 일반적인 에이전트 하네스 훅을 실행하고
전사를 미러링하지만, `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, 또는
`params.contextEngine.maintain`은 호출하지 않습니다.

관련 Codex 코드:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 원하는 동작

Codex 하네스 턴에서는 OpenClaw가 다음 수명 주기를 보존해야 합니다:

1. 미러링된 OpenClaw 세션 전사를 읽습니다.
2. 이전 세션 파일이 존재하면 활성 context engine을 bootstrap합니다.
3. 가능하면 bootstrap maintenance를 실행합니다.
4. 활성 context engine을 사용해 컨텍스트를 assemble합니다.
5. assemble된 컨텍스트를 Codex 호환 입력으로 변환합니다.
6. context-engine `systemPromptAddition`을 포함하는 developer instructions와 함께
   Codex 스레드를 시작하거나 재개합니다.
7. assemble된 사용자 대면 프롬프트로 Codex 턴을 시작합니다.
8. Codex 결과를 다시 OpenClaw 전사에 미러링합니다.
9. 구현되어 있으면 `afterTurn`을 호출하고, 아니면
   미러링된 전사 스냅샷을 사용해 `ingestBatch`/`ingest`를 호출합니다.
10. 성공적이고 중단되지 않은 턴 후 턴 maintenance를 실행합니다.
11. Codex 네이티브 Compaction 신호와 OpenClaw Compaction 훅을 보존합니다.

## 설계 제약

### Codex app-server는 네이티브 스레드 상태의 기준으로 유지됨

Codex는 네이티브 스레드와 내부 확장 기록을 소유합니다. OpenClaw는
지원되는 프로토콜 호출 외의 방식으로 app-server의 내부 기록을 변경하려 해서는 안 됩니다.

OpenClaw의 전사 미러는 OpenClaw 기능의 기준 원본으로 유지됩니다:

- 채팅 기록
- 검색
- `/new` 및 `/reset` bookkeeping
- 향후 모델 또는 하네스 전환
- context-engine Plugin 상태

### context engine assemble 결과는 Codex 입력으로 투영되어야 함

context-engine 인터페이스는 Codex
스레드 패치가 아니라 OpenClaw `AgentMessage[]`를 반환합니다. Codex app-server의 `turn/start`는 현재 사용자 입력을 받고,
`thread/start`와 `thread/resume`은 developer instructions를 받습니다.

따라서 구현에는 투영 레이어가 필요합니다. 안전한 첫 번째 버전은
Codex 내부 기록을 대체할 수 있는 것처럼 가장하지 않아야 합니다. 대신 assemble된 컨텍스트를
현재 턴 주변의 결정적 프롬프트/developer-instruction 자료로 주입해야 합니다.

### 프롬프트 캐시 안정성이 중요함

lossless-claw 같은 엔진의 경우, assemble된 컨텍스트는
입력이 바뀌지 않았다면 결정적이어야 합니다. 생성된 컨텍스트 텍스트에 타임스탬프, 무작위 ID,
비결정적 순서를 추가하지 마세요.

### PI 폴백 의미는 바뀌지 않음

하네스 선택은 그대로 유지됩니다:

- `runtime: "pi"`는 PI를 강제
- `runtime: "codex"`는 등록된 Codex 하네스를 선택
- `runtime: "auto"`는 Plugin 하네스가 지원되는 provider를 차지하도록 허용
- `fallback: "none"`은 일치하는 Plugin 하네스가 없을 때 PI 폴백 비활성화

이 작업은 Codex 하네스가 선택된 **후** 어떤 일이 일어나는지를 바꿉니다.

## 구현 계획

### 1. 재사용 가능한 context-engine 시도 헬퍼 내보내기 또는 이동

현재 재사용 가능한 수명 주기 헬퍼는 PI 러너 아래에 있습니다:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

가능하다면 Codex가 이름상 PI를 암시하는 구현 경로에서 import하지 않게 해야 합니다.

하네스 중립 모듈을 만드세요. 예:

- `src/agents/harness/context-engine-lifecycle.ts`

다음을 이동하거나 재내보내세요:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance`를 감싸는 작은 래퍼

이전 파일에서 재내보내거나 같은 PR에서 PI 호출 지점을 업데이트해
PI import가 계속 동작하도록 유지하세요.

중립 헬퍼 이름은 PI를 언급하지 않아야 합니다.

권장 이름:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex 컨텍스트 투영 헬퍼 추가

새 모듈 추가:

- `extensions/codex/src/app-server/context-engine-projection.ts`

책임:

- assemble된 `AgentMessage[]`, 원래 미러링된 기록, 현재
  프롬프트를 받음
- 어떤 컨텍스트가 developer instructions에 들어가고 어떤 것이 현재 사용자
  입력에 들어가야 하는지 결정
- 현재 사용자 프롬프트를 최종 실행 요청으로 보존
- 이전 메시지를 안정적이고 명시적인 형식으로 렌더링
- 변동성 있는 메타데이터 회피

제안 API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

권장되는 첫 번째 투영:

- `systemPromptAddition`은 developer instructions에 넣습니다.
- assemble된 전사 컨텍스트는 현재 프롬프트 앞의 `promptText`에 넣습니다.
- 이것이 OpenClaw assemble 컨텍스트임을 명확히 표시합니다.
- 현재 프롬프트는 마지막에 둡니다.
- 꼬리 부분에 이미 있다면 중복된 현재 사용자 프롬프트는 제외합니다.

예시 프롬프트 형태:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

이 방식은 네이티브 Codex 기록 수술보다 덜 우아하지만,
OpenClaw 내부에서 구현 가능하고 context-engine 의미를 보존합니다.

향후 개선: Codex app-server가 스레드 기록을 교체하거나 보완하는 프로토콜을 노출하면,
이 투영 레이어를 해당 API를 사용하도록 바꾸세요.

### 3. Codex 스레드 시작 전에 bootstrap 연결

`extensions/codex/src/app-server/run-attempt.ts`에서:

- 현재처럼 미러링된 세션 기록을 읽습니다.
- 이 실행 전에 세션 파일이 존재했는지 확인합니다. 미러링 기록 전에
  `fs.stat(params.sessionFile)`를 확인하는 헬퍼를 사용하는 것이 좋습니다.
- `SessionManager`를 열거나, 헬퍼가 필요로 한다면 좁은 session manager 어댑터를 사용합니다.
- `params.contextEngine`이 존재하면 중립 bootstrap 헬퍼를 호출합니다.

의사 흐름:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Codex 도구 브리지와 전사 미러와 동일한 `sessionKey` 규칙을 사용하세요.
현재 Codex는 `params.sessionKey` 또는 `params.sessionId`에서 `sandboxSessionKey`를 계산합니다. 원시 `params.sessionKey`를 보존해야 할 이유가 없다면 이를 일관되게 사용하세요.

### 4. `thread/start` / `thread/resume` 및 `turn/start` 전에 assemble 연결

`runCodexAppServerAttempt`에서:

1. 먼저 동적 도구를 빌드하여 context engine이 실제 사용 가능한
   도구 이름을 보게 합니다.
2. 미러링된 세션 기록을 읽습니다.
3. `params.contextEngine`이 존재하면 context-engine `assemble(...)`를 실행합니다.
4. assemble된 결과를 다음으로 투영합니다:
   - developer instruction addition
   - `turn/start`용 prompt text

기존 훅 호출:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

는 context-aware하게 바뀌어야 합니다:

1. `buildDeveloperInstructions(params)`로 기본 developer instructions 계산
2. context-engine assemble/투영 적용
3. 투영된 프롬프트/developer instructions로 `before_prompt_build` 실행

이 순서는 일반 프롬프트 훅이 Codex가 받게 될 것과 동일한 프롬프트를 보게 합니다.
엄격한 PI 패리티가 필요하다면, PI는 prompt 파이프라인 후 최종 system prompt에 context-engine `systemPromptAddition`을 적용하므로, 훅 조합 전에 context-engine assemble을 실행하세요. 중요한 불변성은 context engine과 훅이 모두 결정적이고 문서화된 순서를 갖는다는 점입니다.

첫 구현을 위한 권장 순서:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition`을 developer instructions에 append/prepend
4. assemble된 메시지를 prompt text로 투영
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 최종 developer instructions를 `startOrResumeThread(...)`에 전달
7. 최종 prompt text를 `buildTurnStartParams(...)`에 전달

이 사양은 테스트에 인코딩되어 향후 변경이 실수로 순서를 바꾸지 않게 해야 합니다.

### 5. 프롬프트 캐시 안정 형식 보존

투영 헬퍼는 동일한 입력에 대해 바이트 단위로 안정적인 출력을 생성해야 합니다:

- 안정적인 메시지 순서
- 안정적인 역할 레이블
- 생성된 타임스탬프 없음
- 객체 키 순서 누수 없음
- 무작위 구분자 없음
- 실행별 ID 없음

고정된 구분자와 명시적인 섹션을 사용하세요.

### 6. 전사 미러링 후 턴 후 처리 연결

Codex의 `CodexAppServerEventProjector`는 현재 턴에 대한 로컬 `messagesSnapshot`을 만듭니다. `mirrorTranscriptBestEffort(...)`는 이 스냅샷을 OpenClaw 전사 미러에 기록합니다.

미러링이 성공하든 실패하든, 사용 가능한 최선의 메시지 스냅샷으로 context-engine finalizer를 호출하세요:

- `afterTurn`은 현재 턴만이 아니라 세션 스냅샷을 기대하므로, 쓰기 후의 전체 미러링된 세션 컨텍스트를 우선합니다.
- 세션 파일을 다시 열 수 없으면 `historyMessages + result.messagesSnapshot`으로 폴백합니다.

의사 흐름:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

미러링이 실패해도 폴백 스냅샷으로 `afterTurn`을 계속 호출하되,
context engine이 폴백 턴 데이터로 ingest 중이라는 점을 로그에 남기세요.

### 7. 사용량과 프롬프트 캐시 런타임 컨텍스트 정규화

Codex 결과에는 가능한 경우 app-server 토큰 알림에서 정규화된 사용량이 포함됩니다.
그 사용량을 context-engine 런타임 컨텍스트에 전달하세요.

Codex app-server가 결국 캐시 읽기/쓰기 세부 정보를 노출하게 되면, 이를
`ContextEnginePromptCacheInfo`에 매핑하세요. 그 전까지는
0을 꾸며내기보다 `promptCache`를 생략하세요.

### 8. Compaction 정책

Compaction 시스템은 두 가지입니다:

1. OpenClaw context-engine `compact()`
2. Codex app-server 네이티브 `thread/compact/start`

둘을 조용히 혼합하지 마세요.

#### `/compact` 및 명시적 OpenClaw Compaction

선택된 context engine이 `info.ownsCompaction === true`를 가질 때,
명시적 OpenClaw Compaction은 OpenClaw 전사 미러와 Plugin 상태에 대해
context engine의 `compact()` 결과를 우선해야 합니다.

선택된 Codex 하네스에 네이티브 스레드 바인딩이 있다면, app-server 스레드를 건강하게 유지하기 위해
Codex 네이티브 Compaction도 추가로 요청할 수 있지만, 이는 세부 정보에서 별도의 백엔드 작업으로 보고되어야 합니다.

권장 동작:

- `contextEngine.info.ownsCompaction === true`이면:
  - 먼저 context-engine `compact()` 호출
  - 그다음 스레드 바인딩이 있으면 best-effort로 Codex 네이티브 Compaction 호출
  - context-engine 결과를 기본 결과로 반환
  - Codex 네이티브 Compaction 상태를 `details.codexNativeCompaction`에 포함
- 활성 context engine이 Compaction을 소유하지 않으면:
  - 현재 Codex 네이티브 Compaction 동작을 유지

이는 `extensions/codex/src/app-server/compact.ts`를 변경하거나,
`maybeCompactAgentHarnessSession(...)`가 호출되는 위치에 따라
일반 Compaction 경로에서 이를 감싸는 작업이 필요할 수 있습니다.

#### 턴 중 Codex 네이티브 `contextCompaction` 이벤트

Codex는 턴 중에 `contextCompaction` item 이벤트를 보낼 수 있습니다. `event-projector.ts`의 현재
Compaction 전/후 훅 방출은 유지하되, 이를 완료된 context-engine Compaction으로 취급하지는 마세요.

Compaction을 소유하는 엔진의 경우, Codex가 어쨌든 네이티브 Compaction을 수행하면 명시적 진단을 방출하세요:

- 스트림/이벤트 이름: 기존 `compaction` 스트림 사용 가능
- 세부 정보: `{ backend: "codex-app-server", ownsCompaction: true }`

이렇게 하면 분리가 감사 가능해집니다.

### 9. 세션 재설정 및 바인딩 동작

기존 Codex 하네스 `reset(...)`은 OpenClaw 세션 파일에서 Codex app-server 바인딩을 지웁니다.
이 동작은 유지하세요.

또한 context-engine 상태 정리가 기존 OpenClaw 세션 수명 주기 경로를 통해 계속 일어나도록 보장하세요. 현재 context-engine 수명 주기가 모든 하네스에 대해 reset/delete 이벤트를 놓치고 있는 경우가 아니라면 Codex 전용 정리를 추가하지 마세요.

### 10. 오류 처리

PI 의미를 따르세요:

- bootstrap 실패는 경고만 하고 계속 진행
- assemble 실패는 경고하고 assemble되지 않은 파이프라인 메시지/프롬프트로 폴백
- afterTurn/ingest 실패는 경고하고 턴 후 마무리를 실패로 표시
- maintenance는 성공적이고, 중단되지 않았으며, yield되지 않은 턴 후에만 실행
- Compaction 오류는 새 프롬프트로 재시도해서는 안 됨

Codex 전용 추가 사항:

- context projection이 실패하면 경고하고 원래 프롬프트로 폴백
- 전사 미러가 실패해도 폴백 메시지로 context-engine finalization을 시도
- context-engine Compaction이 성공한 후 Codex 네이티브 Compaction이 실패해도,
  context engine이 기본인 경우 전체 OpenClaw Compaction을 실패시키지 않음

## 테스트 계획

### 단위 테스트

`extensions/codex/src/app-server` 아래에 테스트 추가:

1. `run-attempt.context-engine.test.ts`
   - 세션 파일이 존재할 때 Codex가 `bootstrap`을 호출함
   - Codex가 미러링된 메시지, 토큰 예산, 도구 이름,
     citations 모드, 모델 ID, 프롬프트와 함께 `assemble`을 호출함
   - `systemPromptAddition`이 developer instructions에 포함됨
   - assemble된 메시지가 현재 요청 전에 프롬프트에 투영됨
   - Codex가 전사 미러링 후 `afterTurn`을 호출함
   - `afterTurn`이 없으면 Codex가 `ingestBatch` 또는 메시지별 `ingest`를 호출함
   - 성공한 턴 후 턴 maintenance가 실행됨
   - 프롬프트 오류, 중단, yield abort 시 턴 maintenance가 실행되지 않음

2. `context-engine-projection.test.ts`
   - 동일한 입력에 대한 안정적인 출력
   - assemble된 기록에 현재 프롬프트가 포함돼 있어도 중복되지 않음
   - 빈 기록 처리
   - 역할 순서 보존
   - system prompt addition은 developer instructions에만 포함

3. `compact.context-engine.test.ts`
   - Compaction을 소유하는 context engine의 기본 결과가 우선함
   - 함께 시도된 경우 세부 정보에 Codex 네이티브 Compaction 상태가 나타남
   - Codex 네이티브 실패가 Compaction을 소유하는 context-engine Compaction을 실패시키지 않음
   - Compaction을 소유하지 않는 context engine은 현재 네이티브 Compaction 동작을 보존함

### 업데이트할 기존 테스트

- `extensions/codex/src/app-server/run-attempt.test.ts`가 있다면 그것, 없다면
  가장 가까운 Codex app-server 실행 테스트
- `extensions/codex/src/app-server/event-projector.test.ts`는 Compaction
  이벤트 세부 정보가 바뀌는 경우에만
- `src/agents/harness/selection.test.ts`는 구성
  동작이 바뀌지 않는 한 변경이 필요 없어야 하며, 그대로 안정적이어야 함
- PI context-engine 테스트는 변경 없이 계속 통과해야 함

### 통합 / 라이브 테스트

라이브 Codex 하네스 스모크 테스트를 추가하거나 확장:

- `plugins.slots.contextEngine`을 테스트 엔진으로 구성
- `agents.defaults.model`을 `codex/*` 모델로 구성
- `agents.defaults.embeddedHarness.runtime = "codex"` 구성
- 테스트 엔진이 다음을 관찰했는지 검증:
  - bootstrap
  - assemble
  - afterTurn 또는 ingest
  - maintenance

OpenClaw 코어 테스트에서 lossless-claw를 필수로 만들지 마세요. 저장소 내부의 작은 가짜
context engine Plugin을 사용하세요.

## 가시성

Codex context-engine 수명 주기 호출 주변에 디버그 로그를 추가하세요:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- 이유와 함께 `codex context engine maintenance skipped`
- `codex native compaction completed alongside context-engine compaction`

전체 프롬프트나 전사 내용은 로그에 남기지 마세요.

유용한 경우 구조화된 필드 추가:

- `sessionId`
- 기존 로깅 관행에 따라 마스킹하거나 생략한 `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 마이그레이션 / 호환성

이 작업은 하위 호환이어야 합니다:

- context engine이 구성되지 않은 경우, 레거시 context engine 동작은
  오늘의 Codex 하네스 동작과 동등해야 합니다.
- context-engine `assemble`이 실패하면, Codex는 원래
  프롬프트 경로로 계속 진행해야 합니다.
- 기존 Codex 스레드 바인딩은 계속 유효해야 합니다.
- 동적 도구 fingerprinting에 context-engine 출력이 포함되어서는 안 됩니다. 그렇지 않으면
  모든 컨텍스트 변경이 새로운 Codex 스레드를 강제할 수 있습니다. 동적 도구 fingerprint에는 도구 카탈로그만 영향을 주어야 합니다.

## 열린 질문

1. assemble된 컨텍스트는 전부 사용자 프롬프트에 주입해야 할까요, 전부
   developer instructions에 넣어야 할까요, 아니면 나누어야 할까요?

   권장: 나눕니다. `systemPromptAddition`은 developer instructions에,
   assemble된 전사 컨텍스트는 사용자 프롬프트 래퍼에 넣습니다. 이는
   네이티브 스레드 기록을 변경하지 않으면서 현재 Codex 프로토콜에 가장 잘 맞습니다.

2. context engine이 Compaction을 소유할 때 Codex 네이티브 Compaction을
   비활성화해야 할까요?

   권장: 아니요, 적어도 처음에는 그렇지 않습니다. Codex 네이티브 Compaction은
   app-server 스레드를 살아 있게 유지하는 데 여전히 필요할 수 있습니다. 하지만 이는
   context-engine Compaction이 아니라 네이티브 Codex Compaction으로 보고되어야 합니다.

3. `before_prompt_build`는 context-engine assemble 전후 중 언제 실행해야 할까요?

   권장: Codex에서는 context-engine projection **후**에 실행하세요. 그래야 일반 하네스
   훅이 Codex가 실제로 받을 프롬프트/developer instructions를 보게 됩니다. PI
   패리티가 반대를 요구한다면, 선택한 순서를 테스트에 인코딩하고 여기에 문서화하세요.

4. Codex app-server가 미래에 구조화된 컨텍스트/기록 재정의를 받을 수 있을까요?

   알 수 없습니다. 가능하다면, 텍스트 투영 레이어를 해당 프로토콜로 교체하고
   수명 주기 호출은 그대로 유지하세요.

## 승인 기준

- `codex/*` 내장 하네스 턴이 선택된 context engine의
  assemble 수명 주기를 호출한다.
- context-engine `systemPromptAddition`이 Codex developer instructions에 영향을 준다.
- assemble된 컨텍스트가 Codex 턴 입력에 결정적으로 영향을 준다.
- 성공적인 Codex 턴이 `afterTurn` 또는 ingest 폴백을 호출한다.
- 성공적인 Codex 턴이 context-engine 턴 maintenance를 실행한다.
- 실패/중단/yield-aborted 턴은 턴 maintenance를 실행하지 않는다.
- context-engine이 소유하는 Compaction은 OpenClaw/Plugin 상태에 대해 기본으로 유지된다.
- Codex 네이티브 Compaction은 네이티브 Codex 동작으로 감사 가능하게 유지된다.
- 기존 PI context-engine 동작은 바뀌지 않는다.
- 비레거시 context engine이 선택되지 않았거나 assemble이 실패한 경우, 기존 Codex 하네스 동작은 바뀌지 않는다.
