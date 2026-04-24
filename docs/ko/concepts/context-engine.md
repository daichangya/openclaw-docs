---
read_when:
    - OpenClaw가 모델 컨텍스트를 조합하는 방식을 이해하려고 합니다.
    - 레거시 엔진과 Plugin 엔진 사이를 전환하는 중입니다.
    - 컨텍스트 엔진 Plugin을 만들고 있습니다.
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조합, Compaction, 하위 에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-04-24T06:10:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

**컨텍스트 엔진**은 OpenClaw가 각 실행에 대해 모델 컨텍스트를 어떻게 구성할지 제어합니다. 어떤 메시지를 포함할지, 오래된 히스토리를 어떻게 요약할지, 하위 에이전트 경계를 넘어 컨텍스트를 어떻게 관리할지를 담당합니다.

OpenClaw는 기본 제공 `legacy` 엔진을 포함하며 기본값으로 사용합니다. 대부분의 사용자는 이를 변경할 필요가 없습니다. 다른 조합, Compaction 또는 세션 간 recall 동작이 필요할 때만 Plugin 엔진을 설치하고 선택하세요.

## 빠른 시작

어떤 엔진이 활성화되어 있는지 확인합니다.

```bash
openclaw doctor
# 또는 config를 직접 확인:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 컨텍스트 엔진 Plugin 설치

컨텍스트 엔진 Plugins는 다른 OpenClaw Plugin과 동일하게 설치합니다. 먼저 설치한 다음 슬롯에서 엔진을 선택합니다.

```bash
# npm에서 설치
openclaw plugins install @martian-engineering/lossless-claw

# 또는 로컬 경로에서 설치(개발용)
openclaw plugins install -l ./my-context-engine
```

그런 다음 config에서 Plugin을 활성화하고 활성 엔진으로 선택합니다.

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // Plugin에 등록된 엔진 ID와 일치해야 함
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin별 config는 여기에 추가(Plugin 문서 참조)
      },
    },
  },
}
```

설치 및 구성 후 gateway를 다시 시작하세요.

기본 제공 엔진으로 되돌리려면 `contextEngine`을 `"legacy"`로 설정하거나 키 자체를 제거하세요. `"legacy"`가 기본값입니다.

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은 네 가지 수명 주기 지점에 참여합니다.

1. **Ingest** — 새 메시지가 세션에 추가될 때 호출됩니다. 엔진은 자체 데이터 저장소에 메시지를 저장하거나 인덱싱할 수 있습니다.
2. **Assemble** — 각 모델 실행 전에 호출됩니다. 엔진은 token 예산에 맞는 정렬된 메시지 집합(및 선택적 `systemPromptAddition`)을 반환합니다.
3. **Compact** — 컨텍스트 창이 가득 찼거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 오래된 히스토리를 요약합니다.
4. **After turn** — 실행이 완료된 후 호출됩니다. 엔진은 상태를 영속화하거나, 백그라운드 Compaction을 트리거하거나, 인덱스를 업데이트할 수 있습니다.

번들된 비-ACP Codex 하니스의 경우 OpenClaw는 조합된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트로 투영하여 동일한 수명 주기를 적용합니다. Codex는 여전히 자체 네이티브 스레드 히스토리와 네이티브 압축기를 소유합니다.

### 하위 에이전트 수명 주기(선택 사항)

OpenClaw는 선택적 하위 에이전트 수명 주기 훅 두 개를 호출합니다.

- **prepareSubagentSpawn** — 자식 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 이 훅은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 대화 기록 ID/파일, 선택적 TTL을 받습니다. 준비 성공 후 spawn이 실패했을 때 롤백 핸들을 반환했다면 OpenClaw가 이를 호출합니다.
- **onSubagentEnded** — 하위 에이전트 세션이 완료되거나 정리될 때 정리 작업을 수행합니다.

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 이를 실행용 시스템 프롬프트 앞에 붙입니다. 이를 통해 엔진은 정적 워크스페이스 파일을 요구하지 않고도 동적 recall 지침, retrieval 지침 또는 컨텍스트 인식 힌트를 주입할 수 있습니다.

## 레거시 엔진

기본 제공 `legacy` 엔진은 OpenClaw의 원래 동작을 유지합니다.

- **Ingest**: no-op(세션 관리자가 직접 메시지 영속성을 처리).
- **Assemble**: pass-through(런타임의 기존 sanitize → validate → limit 파이프라인이 컨텍스트 조합을 처리).
- **Compact**: 기본 제공 요약 Compaction에 위임하며, 오래된 메시지의 단일 요약을 만들고 최근 메시지는 그대로 유지합니다.
- **After turn**: no-op.

레거시 엔진은 도구를 등록하지 않으며 `systemPromptAddition`도 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정되어 있으면 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용해 컨텍스트 엔진을 등록할 수 있습니다.

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
      // 데이터 저장소에 메시지를 저장
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 예산에 맞는 메시지를 반환
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

그런 다음 config에서 활성화합니다.

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

| Member             | Kind     | 목적                                                         |
| ------------------ | -------- | ------------------------------------------------------------ |
| `info`             | Property | 엔진 ID, 이름, 버전, Compaction 소유 여부                    |
| `ingest(params)`   | Method   | 단일 메시지 저장                                             |
| `assemble(params)` | Method   | 모델 실행용 컨텍스트 구성(`AssembleResult` 반환)             |
| `compact(params)`  | Method   | 컨텍스트 요약/축소                                           |

`assemble`은 다음을 포함한 `AssembleResult`를 반환합니다.

- `messages` — 모델에 전송할 정렬된 메시지
- `estimatedTokens`(필수, `number`) — 조합된 컨텍스트의 총 token 수에 대한 엔진의 추정치. OpenClaw는 이를 Compaction 임계값 결정과 진단 보고에 사용합니다.
- `systemPromptAddition`(선택 사항, `string`) — 시스템 프롬프트 앞에 추가됨

선택적 멤버:

| Member                         | Kind   | 목적                                                                                                             |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | 세션용 엔진 상태 초기화. 엔진이 세션을 처음 볼 때 한 번 호출됨(예: 히스토리 가져오기).                           |
| `ingestBatch(params)`          | Method | 완료된 턴을 배치로 Ingest. 실행 완료 후 해당 턴의 모든 메시지를 한 번에 받아 호출됨.                            |
| `afterTurn(params)`            | Method | 실행 후 수명 주기 작업(상태 영속화, 백그라운드 Compaction 트리거).                                               |
| `prepareSubagentSpawn(params)` | Method | 자식 세션이 시작되기 전에 공유 상태 설정.                                                                       |
| `onSubagentEnded(params)`      | Method | 하위 에이전트 종료 후 정리.                                                                                     |
| `dispose()`                    | Method | 리소스 해제. gateway 종료 또는 Plugin 리로드 중 호출되며 세션별 호출은 아님.                                    |

### ownsCompaction

`ownsCompaction`은 실행 중 Pi의 기본 내-시도 자동 Compaction을 계속 활성화할지 제어합니다.

- `true` — 엔진이 Compaction 동작을 소유합니다. OpenClaw는 해당 실행에 대해 Pi의 기본 자동 Compaction을 비활성화하며, 엔진의 `compact()` 구현이 `/compact`, 오버플로 복구 Compaction, 그리고 `afterTurn()`에서 수행하고자 하는 모든 선제적 Compaction을 책임집니다.
- `false` 또는 미설정 — 프롬프트 실행 중 Pi의 기본 자동 Compaction이 여전히 실행될 수 있지만, 활성 엔진의 `compact()` 메서드는 `/compact` 및 오버플로 복구에 대해 여전히 호출됩니다.

`ownsCompaction: false`는 OpenClaw가 자동으로 레거시 엔진의 Compaction 경로로 대체한다는 뜻이 **아닙니다**.

즉, Plugin에는 두 가지 유효한 패턴이 있습니다.

- **Owning 모드** — 자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`로 설정
- **Delegating 모드** — `ownsCompaction: false`로 설정하고 `compact()`에서 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`를 호출해 OpenClaw의 기본 Compaction 동작 사용

활성 비-소유 엔진에서 no-op `compact()`는 안전하지 않습니다. 해당 엔진 슬롯에 대해 일반적인 `/compact` 및 오버플로 복구 Compaction 경로를 비활성화하기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // 활성 컨텍스트 엔진 선택. 기본값: "legacy".
      // Plugin 엔진을 사용하려면 Plugin ID로 설정.
      contextEngine: "legacy",
    },
  },
}
```

이 슬롯은 런타임에 배타적입니다. 특정 실행 또는 Compaction 작업에 대해 등록된 컨텍스트 엔진은 하나만 확인됩니다. 다른 활성화된 `kind: "context-engine"` Plugins도 로드되어 등록 코드를 실행할 수 있지만, `plugins.slots.contextEngine`은 OpenClaw가 컨텍스트 엔진이 필요할 때 어떤 등록된 엔진 ID를 사용할지 선택할 뿐입니다.

## Compaction 및 메모리와의 관계

- **Compaction**은 컨텍스트 엔진의 책임 중 하나입니다. 레거시 엔진은 OpenClaw의 기본 제공 요약에 위임합니다. Plugin 엔진은 어떤 Compaction 전략이든 구현할 수 있습니다(DAG 요약, 벡터 retrieval 등).
- **메모리 Plugins**(`plugins.slots.memory`)는 컨텍스트 엔진과 별개입니다. 메모리 Plugins는 검색/retrieval을 제공하고, 컨텍스트 엔진은 모델이 무엇을 보게 할지 제어합니다. 둘은 함께 동작할 수 있습니다. 예를 들어 컨텍스트 엔진이 조합 중에 메모리 Plugin 데이터를 사용할 수 있습니다. 활성 메모리 프롬프트 경로를 사용하려는 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`을 우선 사용하는 것이 좋습니다. 이는 활성 메모리 프롬프트 섹션을 바로 앞에 붙일 수 있는 `systemPromptAddition`으로 변환합니다. 엔진이 더 낮은 수준의 제어가 필요하다면 `openclaw/plugin-sdk/memory-host-core`의 `buildActiveMemoryPromptSection(...)`을 통해 원시 줄을 가져올 수도 있습니다.
- **세션 pruning**(메모리 내 오래된 도구 결과 잘라내기)은 어떤 컨텍스트 엔진이 활성화되어 있든 계속 실행됩니다.

## 팁

- 엔진이 올바르게 로드되는지 확인하려면 `openclaw doctor`를 사용하세요.
- 엔진을 전환하더라도 기존 세션은 현재 히스토리를 유지합니다. 새 엔진은 이후 실행부터 적용됩니다.
- 엔진 오류는 로그에 기록되고 진단에 표시됩니다. Plugin 엔진 등록에 실패하거나 선택된 엔진 ID를 확인할 수 없으면 OpenClaw는 자동으로 대체하지 않으며, Plugin을 수정하거나 `plugins.slots.contextEngine`을 `"legacy"`로 되돌릴 때까지 실행은 실패합니다.
- 개발 시에는 `openclaw plugins install -l ./my-engine`을 사용해 로컬 Plugin 디렉터리를 복사 없이 링크하세요.

추가 정보: [Compaction](/ko/concepts/compaction), [컨텍스트](/ko/concepts/context),
[Plugins](/ko/tools/plugin), [Plugin manifest](/ko/plugins/manifest).

## 관련 항목

- [컨텍스트](/ko/concepts/context) — 에이전트 턴의 컨텍스트가 구성되는 방식
- [Plugin 아키텍처](/ko/plugins/architecture) — 컨텍스트 엔진 Plugin 등록
- [Compaction](/ko/concepts/compaction) — 긴 대화 요약
