---
read_when:
    - OpenClaw가 모델 컨텍스트를 어떻게 조합하는지 이해하려는 경우
    - 레거시 엔진과 플러그인 엔진 사이를 전환하는 경우
    - 컨텍스트 엔진 plugin을 빌드하는 경우
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조합, 압축, 서브에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-04-08T02:14:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# 컨텍스트 엔진

**컨텍스트 엔진**은 OpenClaw가 각 실행마다 모델 컨텍스트를 어떻게 구성할지 제어합니다.
어떤 메시지를 포함할지, 오래된 기록을 어떻게 요약할지, 그리고
서브에이전트 경계를 넘어 컨텍스트를 어떻게 관리할지를 결정합니다.

OpenClaw에는 내장 `legacy` 엔진이 포함되어 있습니다. Plugins는
활성 컨텍스트 엔진 수명 주기를 대체하는 대체 엔진을 등록할 수 있습니다.

## 빠른 시작

어떤 엔진이 활성화되어 있는지 확인합니다:

```bash
openclaw doctor
# 또는 config를 직접 확인:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 컨텍스트 엔진 plugin 설치하기

컨텍스트 엔진 plugins는 다른 OpenClaw plugin과 동일하게 설치합니다. 먼저
설치한 다음, 슬롯에서 엔진을 선택합니다:

```bash
# npm에서 설치
openclaw plugins install @martian-engineering/lossless-claw

# 또는 로컬 경로에서 설치 (개발용)
openclaw plugins install -l ./my-context-engine
```

그런 다음 plugin을 활성화하고 config에서 활성 엔진으로 선택합니다:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // plugin에 등록된 엔진 id와 일치해야 합니다
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // plugin별 config는 여기에 입력합니다 (plugin 문서 참고)
      },
    },
  },
}
```

설치와 구성을 마친 뒤 게이트웨이를 재시작합니다.

내장 엔진으로 다시 전환하려면 `contextEngine`을 `"legacy"`로 설정하거나
키를 완전히 제거하면 됩니다 — 기본값은 `"legacy"`입니다.

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은
네 가지 수명 주기 지점에 참여합니다:

1. **Ingest** — 새 메시지가 세션에 추가될 때 호출됩니다. 엔진은
   자체 데이터 저장소에 메시지를 저장하거나 인덱싱할 수 있습니다.
2. **Assemble** — 각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산 안에 들어가는
   정렬된 메시지 집합과 선택적인 `systemPromptAddition`을 반환합니다.
3. **Compact** — 컨텍스트 창이 가득 찼을 때 또는 사용자가
   `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 오래된 기록을 요약합니다.
4. **After turn** — 실행이 완료된 뒤 호출됩니다. 엔진은 상태를 유지하거나,
   백그라운드 압축을 트리거하거나, 인덱스를 업데이트할 수 있습니다.

### 서브에이전트 수명 주기(선택 사항)

OpenClaw는 현재 하나의 서브에이전트 수명 주기 훅을 호출합니다:

- **onSubagentEnded** — 서브에이전트 세션이 완료되거나 정리될 때 정리 작업을 수행합니다.

`prepareSubagentSpawn` 훅은 향후 사용을 위해 인터페이스에 포함되어 있지만,
런타임에서는 아직 호출하지 않습니다.

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는
이 값을 해당 실행의 시스템 프롬프트 앞에 붙입니다. 이를 통해 엔진은
정적 workspace 파일이 없어도 동적 회상 가이드, 검색 지침,
또는 컨텍스트 인식 힌트를 주입할 수 있습니다.

## legacy 엔진

내장 `legacy` 엔진은 OpenClaw의 원래 동작을 유지합니다:

- **Ingest**: no-op(세션 관리자가 메시지 영속성을 직접 처리).
- **Assemble**: pass-through(런타임의 기존 sanitize → validate → limit 파이프라인이
  컨텍스트 조합을 처리).
- **Compact**: 내장 요약 압축에 위임하며, 이 과정에서
  오래된 메시지의 단일 요약을 만들고 최근 메시지는 그대로 유지합니다.
- **After turn**: no-op.

legacy 엔진은 도구를 등록하지 않으며 `systemPromptAddition`도 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정된 경우,
이 엔진이 자동으로 사용됩니다.

## plugin 엔진

plugin은 plugin API를 사용해 컨텍스트 엔진을 등록할 수 있습니다:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 메시지를 데이터 저장소에 저장
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 예산에 맞는 메시지 반환
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 오래된 컨텍스트 요약
      return { ok: true, compacted: true };
    },
  }));
}
```

그런 다음 config에서 활성화합니다:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 인터페이스

필수 멤버:

| Member             | Kind     | Purpose                                             |
| ------------------ | -------- | --------------------------------------------------- |
| `info`             | Property | 엔진 id, 이름, 버전, 그리고 압축 소유 여부          |
| `ingest(params)`   | Method   | 단일 메시지 저장                                    |
| `assemble(params)` | Method   | 모델 실행용 컨텍스트 빌드(`AssembleResult` 반환)    |
| `compact(params)`  | Method   | 컨텍스트 요약/축소                                  |

`assemble`은 다음을 포함한 `AssembleResult`를 반환합니다:

- `messages` — 모델에 보낼 정렬된 메시지입니다.
- `estimatedTokens` (필수, `number`) — 조합된 컨텍스트 전체 토큰 수에 대한
  엔진의 추정치입니다. OpenClaw는 이를 압축 임계값 판단과 진단 보고에 사용합니다.
- `systemPromptAddition` (선택 사항, `string`) — 시스템 프롬프트 앞에 추가됩니다.

선택적 멤버:

| Member                         | Kind   | Purpose                                                                                                       |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | 세션용 엔진 상태를 초기화합니다. 엔진이 세션을 처음 볼 때 한 번 호출됩니다(예: 기록 가져오기).              |
| `ingestBatch(params)`          | Method | 완료된 턴을 배치로 수집합니다. 실행 완료 후 해당 턴의 모든 메시지와 함께 한 번에 호출됩니다.               |
| `afterTurn(params)`            | Method | 실행 후 수명 주기 작업(상태 유지, 백그라운드 압축 트리거).                                                   |
| `prepareSubagentSpawn(params)` | Method | 하위 세션을 위한 공유 상태를 준비합니다.                                                                     |
| `onSubagentEnded(params)`      | Method | 서브에이전트 종료 후 정리 작업을 수행합니다.                                                                 |
| `dispose()`                    | Method | 리소스를 해제합니다. 게이트웨이 종료 또는 plugin 다시 로드 시 호출되며 세션별로 호출되지는 않습니다.        |

### ownsCompaction

`ownsCompaction`은 실행 중 Pi의 내장 시도 내 자동 압축이
계속 활성화될지를 제어합니다:

- `true` — 엔진이 압축 동작을 소유합니다. OpenClaw는 해당 실행에서 Pi의 내장
  자동 압축을 비활성화하며, 엔진의 `compact()` 구현이 `/compact`,
  오버플로 복구 압축, 그리고 `afterTurn()`에서 수행하려는 모든 선제적
  압축을 책임집니다.
- `false` 또는 미설정 — 프롬프트 실행 중 Pi의 내장 자동 압축은 여전히 실행될 수 있지만,
  활성 엔진의 `compact()` 메서드는 `/compact` 및 오버플로 복구 시에도 계속 호출됩니다.

`ownsCompaction: false`는 OpenClaw가 자동으로
legacy 엔진의 압축 경로로 폴백한다는 뜻이 **아닙니다**.

즉, 유효한 plugin 패턴은 두 가지입니다:

- **소유 모드** — 자체 압축 알고리즘을 구현하고
  `ownsCompaction: true`로 설정합니다.
- **위임 모드** — `ownsCompaction: false`로 설정하고 `compact()`가
  `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`를 호출해
  OpenClaw의 내장 압축 동작을 사용하도록 합니다.

아무 작업도 하지 않는 `compact()`는 활성 비소유 엔진에서 안전하지 않습니다. 그 이유는
해당 엔진 슬롯의 일반 `/compact` 및 오버플로 복구 압축 경로를
비활성화하기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // 활성 컨텍스트 엔진을 선택합니다. 기본값: "legacy".
      // plugin id로 설정하면 plugin 엔진을 사용합니다.
      contextEngine: "legacy",
    },
  },
}
```

이 슬롯은 런타임에 배타적입니다. 하나의 등록된 컨텍스트 엔진만
특정 실행 또는 압축 작업에 대해 해석됩니다. 다른 활성화된
`kind: "context-engine"` plugins도 여전히 로드되어 등록 코드를 실행할 수 있지만,
`plugins.slots.contextEngine`은 OpenClaw가 컨텍스트 엔진이 필요할 때
어떤 등록된 엔진 id를 해석할지만 선택합니다.

## 압축 및 메모리와의 관계

- **압축**은 컨텍스트 엔진의 한 가지 책임입니다. legacy 엔진은
  OpenClaw의 내장 요약 기능에 위임합니다. Plugin 엔진은
  어떤 압축 전략이든 구현할 수 있습니다(DAG 요약, 벡터 검색 등).
- **메모리 plugins** (`plugins.slots.memory`)는 컨텍스트 엔진과 별개입니다.
  메모리 plugins는 검색/조회 기능을 제공하고, 컨텍스트 엔진은
  모델이 무엇을 볼지 제어합니다. 둘은 함께 동작할 수 있습니다 — 컨텍스트 엔진이
  조합 중에 메모리 plugin 데이터를 사용할 수도 있습니다. 활성 메모리
  프롬프트 경로를 사용하려는 plugin 엔진은
  `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`을 우선 사용하는 것이 좋습니다.
  이 함수는 활성 메모리 프롬프트 섹션을 바로 앞에 붙일 수 있는
  `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의
  제어가 필요하다면, 여전히
  `openclaw/plugin-sdk/memory-host-core`의
  `buildActiveMemoryPromptSection(...)`을 통해 원시 라인을 가져올 수 있습니다.
- **세션 정리(Session pruning)**(메모리 내 오래된 도구 결과 잘라내기)는
  어떤 컨텍스트 엔진이 활성 상태이든 계속 실행됩니다.

## 팁

- `openclaw doctor`를 사용해 엔진이 올바르게 로드되는지 확인하세요.
- 엔진을 전환하더라도 기존 세션은 현재 기록을 유지한 채 계속됩니다.
  새 엔진은 이후 실행부터 적용됩니다.
- 엔진 오류는 로그에 기록되고 진단에도 표시됩니다. plugin 엔진이
  등록에 실패하거나 선택한 엔진 id를 해석할 수 없으면 OpenClaw는
  자동으로 폴백하지 않으며, plugin을 수정하거나
  `plugins.slots.contextEngine`을 `"legacy"`로 다시 전환할 때까지 실행이 실패합니다.
- 개발 시에는 `openclaw plugins install -l ./my-engine`를 사용해
  로컬 plugin 디렉터리를 복사하지 않고 연결할 수 있습니다.

참고 항목: [압축](/ko/concepts/compaction), [컨텍스트](/ko/concepts/context),
[Plugins](/ko/tools/plugin), [Plugin manifest](/ko/plugins/manifest).

## 관련 항목

- [컨텍스트](/ko/concepts/context) — 에이전트 턴을 위한 컨텍스트가 빌드되는 방식
- [Plugin Architecture](/ko/plugins/architecture) — 컨텍스트 엔진 plugins 등록
- [압축](/ko/concepts/compaction) — 긴 대화 요약하기
