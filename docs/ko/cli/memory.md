---
read_when:
    - 시맨틱 메모리를 인덱싱하거나 검색하고 싶으신 것입니다
    - 메모리 가용성 또는 인덱싱을 디버깅하고 있습니다
    - 회상된 단기 메모리를 `MEMORY.md`으로 승격하고 싶으신 것입니다
summary: '`openclaw memory`에 대한 CLI 참조(status/index/search/promote/promote-explain/rem-harness)'
title: 메모리
x-i18n:
    generated_at: "2026-04-24T06:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

시맨틱 메모리 인덱싱 및 검색을 관리합니다.
활성 메모리 Plugin이 제공합니다(기본값: `memory-core`; 비활성화하려면 `plugins.slots.memory = "none"`으로 설정).

관련:

- 메모리 개념: [메모리](/ko/concepts/memory)
- 메모리 위키: [메모리 위키](/ko/plugins/memory-wiki)
- 위키 CLI: [wiki](/ko/cli/wiki)
- Plugins: [Plugins](/ko/tools/plugin)

## 예시

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 옵션

`memory status` 및 `memory index`:

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다. 이 옵션이 없으면 이 명령은 구성된 각 에이전트에 대해 실행되며, 구성된 에이전트 목록이 없으면 기본 에이전트로 대체됩니다.
- `--verbose`: 프로브 및 인덱싱 중 상세 로그를 출력합니다.

`memory status`:

- `--deep`: 벡터 + 임베딩 가용성을 점검합니다.
- `--index`: 저장소가 dirty 상태이면 재인덱싱을 실행합니다(`--deep`를 암시).
- `--fix`: 오래된 recall lock을 복구하고 승격 메타데이터를 정규화합니다.
- `--json`: JSON 출력을 표시합니다.

`memory status`에 `Dreaming status: blocked`가 표시되면 관리형 Dreaming Cron이 활성화되어 있지만 이를 구동하는 Heartbeat가 기본 에이전트에 대해 실행되지 않고 있다는 뜻입니다. 일반적인 두 가지 원인은 [Dreaming이 실행되지 않음](/ko/concepts/dreaming#dreaming-never-runs-status-shows-blocked)을 참조하세요.

`memory index`:

- `--force`: 전체 재인덱싱을 강제합니다.

`memory search`:

- 쿼리 입력: 위치 인수 `[query]` 또는 `--query <text>`를 전달합니다.
- 둘 다 제공되면 `--query`가 우선합니다.
- 둘 다 제공되지 않으면 명령은 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--max-results <n>`: 반환할 결과 수를 제한합니다.
- `--min-score <n>`: 점수가 낮은 일치 항목을 필터링합니다.
- `--json`: JSON 결과를 표시합니다.

`memory promote`:

단기 메모리 승격을 미리 보고 적용합니다.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 승격 항목을 `MEMORY.md`에 기록합니다(기본값: 미리보기만).
- `--limit <n>` -- 표시할 후보 수의 상한을 설정합니다.
- `--include-promoted` -- 이전 주기에서 이미 승격된 항목도 포함합니다.

전체 옵션:

- 가중 승격 신호(`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)를 사용해 `memory/YYYY-MM-DD.md`의 단기 후보를 순위화합니다.
- 메모리 recall과 일일 수집 패스의 단기 신호뿐 아니라 light/REM 단계 강화 신호도 사용합니다.
- Dreaming이 활성화되면 `memory-core`는 백그라운드에서 전체 스윕(`light -> REM -> deep`)을 실행하는 하나의 Cron 작업을 자동 관리합니다(수동 `openclaw cron add` 불필요).
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--limit <n>`: 반환/적용할 최대 후보 수입니다.
- `--min-score <n>`: 최소 가중 승격 점수입니다.
- `--min-recall-count <n>`: 후보에 필요한 최소 recall 횟수입니다.
- `--min-unique-queries <n>`: 후보에 필요한 최소 고유 쿼리 수입니다.
- `--apply`: 선택한 후보를 `MEMORY.md`에 추가하고 승격된 것으로 표시합니다.
- `--include-promoted`: 이미 승격된 후보를 출력에 포함합니다.
- `--json`: JSON 출력을 표시합니다.

`memory promote-explain`:

특정 승격 후보와 그 점수 세부 내역을 설명합니다.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 조회할 후보 키, 경로 조각 또는 스니펫 조각입니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 승격된 후보를 포함합니다.
- `--json`: JSON 출력을 표시합니다.

`memory rem-harness`:

아무것도 기록하지 않고 REM 반영, 후보 진실, deep 승격 출력을 미리 봅니다.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 승격된 deep 후보를 포함합니다.
- `--json`: JSON 출력을 표시합니다.

## Dreaming

Dreaming은 세 가지 협력 단계로 구성된 백그라운드 메모리 통합 시스템입니다:
**light**(단기 자료 정렬/준비), **deep**(지속적인 사실을 `MEMORY.md`로 승격),
그리고 **REM**(주제를 반영하고 드러냄)입니다.

- `plugins.entries.memory-core.config.dreaming.enabled: true`로 활성화합니다.
- 채팅에서 `/dreaming on|off`로 전환하거나(`/dreaming status`로 확인) 제어할 수 있습니다.
- Dreaming은 하나의 관리형 스윕 일정(`dreaming.frequency`)으로 실행되며 단계를 순서대로 수행합니다: light, REM, deep.
- deep 단계만 지속 메모리를 `MEMORY.md`에 기록합니다.
- 사람이 읽기 쉬운 단계 출력과 일지 항목은 `DREAMS.md`(또는 기존 `dreams.md`)에 기록되며, 선택적으로 단계별 보고서는 `memory/dreaming/<phase>/YYYY-MM-DD.md`에 기록됩니다.
- 순위화에는 recall 빈도, 검색 관련성, 쿼리 다양성, 시간적 최신성, 날짜 간 통합, 파생 개념 풍부성 등의 가중 신호가 사용됩니다.
- 승격은 `MEMORY.md`에 기록하기 전에 현재 일일 노트를 다시 읽으므로, 수정되거나 삭제된 단기 스니펫이 오래된 recall 저장소 스냅샷에서 승격되지 않습니다.
- 예약 실행과 수동 `memory promote` 실행은 CLI 임계값 재정의를 전달하지 않는 한 동일한 deep 단계 기본값을 공유합니다.
- 자동 실행은 구성된 메모리 워크스페이스 전반에 걸쳐 fan-out됩니다.

기본 일정:

- **스윕 주기**: `dreaming.frequency = 0 3 * * *`
- **Deep 임계값**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

예시:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

참고:

- `memory index --verbose`는 단계별 세부 정보(provider, model, 소스, 배치 활동)를 출력합니다.
- `memory status`에는 `memorySearch.extraPaths`를 통해 구성된 추가 경로도 포함됩니다.
- 실질적으로 활성인 메모리 원격 API 키 필드가 SecretRef로 구성된 경우 이 명령은 활성 Gateway 스냅샷에서 해당 값을 확인합니다. Gateway를 사용할 수 없으면 명령은 즉시 실패합니다.
- Gateway 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 unknown-method 오류를 반환합니다.
- 예약된 스윕 주기는 `dreaming.frequency`로 조정하세요. 그 외 deep 승격 정책은 내부 정책이며, 일회성 수동 재정의가 필요할 때는 `memory promote`의 CLI 플래그를 사용하세요.
- `memory rem-harness --path <file-or-dir> --grounded`는 아무것도 기록하지 않고 과거 일일 노트에서 근거 기반 `What Happened`, `Reflections`, `Possible Lasting Updates`를 미리 봅니다.
- `memory rem-backfill --path <file-or-dir>`는 UI 검토를 위해 되돌릴 수 있는 근거 기반 일지 항목을 `DREAMS.md`에 기록합니다.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`은 근거 기반 지속 후보를 현재 단기 승격 저장소에도 시드하여 일반 deep 단계가 이를 순위화할 수 있게 합니다.
- `memory rem-backfill --rollback`은 이전에 기록한 근거 기반 일지 항목을 제거하고, `memory rem-backfill --rollback-short-term`은 이전에 준비한 근거 기반 단기 후보를 제거합니다.
- 전체 단계 설명 및 구성 참조는 [Dreaming](/ko/concepts/dreaming)을 참조하세요.

## 관련

- [CLI 참조](/ko/cli)
- [메모리 개요](/ko/concepts/memory)
