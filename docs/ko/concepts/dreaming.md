---
read_when:
    - 메모리 승격이 자동으로 실행되기를 원합니다
    - 각 Dreaming 단계가 무엇을 하는지 이해하고 싶습니다
    - '`MEMORY.md`를 오염시키지 않고 통합을 조정하고 싶습니다'
summary: 가벼운 수면, 깊은 수면, REM 단계와 Dream Diary를 포함한 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다.
강한 단기 신호를 내구성 있는 메모리로 이동시키는 데 도움을 주면서도,
과정을 설명 가능하고 검토 가능하게 유지합니다.

Dreaming은 **옵트인** 방식이며 기본적으로 비활성화되어 있습니다.

## Dreaming이 기록하는 내용

Dreaming은 두 종류의 출력을 유지합니다:

- `memory/.dreams/`의 **기계 상태**(recall 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**, 그리고 선택적으로 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 단계 보고서 파일.

장기 승격은 여전히 `MEMORY.md`에만 기록됩니다.

## 단계 모델

Dreaming은 협력적으로 동작하는 세 단계로 구성됩니다:

| 단계 | 목적 | 영구 기록 |
| ----- | ---- | --------- |
| Light | 최근 단기 자료 정렬 및 준비 | 아니요 |
| Deep  | 지속성 있는 후보 점수화 및 승격 | 예 (`MEMORY.md`) |
| REM   | 주제와 반복되는 아이디어에 대한 성찰 | 아니요 |

이 단계들은 별도로 사용자가 구성하는 "모드"가 아니라 내부 구현 세부 사항입니다.

### Light 단계

Light 단계는 최근 일일 메모리 신호와 recall 추적을 수집하고, 이를 중복 제거한 뒤,
후보 라인을 준비합니다.

- 사용 가능한 경우 단기 recall 상태, 최근 일일 메모리 파일, 그리고 민감 정보가 제거된 세션 transcript를 읽습니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
- 이후 Deep 순위 평가를 위한 강화 신호를 기록합니다.
- `MEMORY.md`에는 절대 기록하지 않습니다.

### Deep 단계

Deep 단계는 무엇이 장기 메모리가 될지를 결정합니다.

- 가중 점수와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
- 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
- 기록 전에 실제 일일 파일에서 스니펫을 다시 불러오므로 오래되었거나 삭제된 스니펫은 건너뜁니다.
- 승격된 항목을 `MEMORY.md`에 추가합니다.
- `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`를 기록합니다.

### REM 단계

REM 단계는 패턴과 성찰 신호를 추출합니다.

- 최근 단기 추적에서 주제 및 성찰 요약을 생성합니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
- Deep 순위 평가에서 사용하는 REM 강화 신호를 기록합니다.
- `MEMORY.md`에는 절대 기록하지 않습니다.

## 세션 transcript 수집

Dreaming은 민감 정보가 제거된 세션 transcript를 Dreaming 코퍼스에 수집할 수 있습니다. transcript를 사용할 수 있으면, Light 단계에서 일일 메모리 신호 및 recall 추적과 함께 처리됩니다. 개인 정보 및 민감한 내용은 수집 전에 민감 정보가 제거됩니다.

## Dream Diary

Dreaming은 또한 `DREAMS.md`에 서사형 **Dream Diary**를 유지합니다.
각 단계에 충분한 자료가 쌓이면 `memory-core`는 최선형 백그라운드
subagent 턴(기본 런타임 모델 사용)을 실행하고 짧은 일기 항목을 추가합니다.

이 일기는 승격 소스가 아니라 Dreams UI에서 사람이 읽기 위한 것입니다.
Dreaming이 생성한 일기/보고서 아티팩트는 단기 승격에서 제외됩니다.
근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격될 수 있습니다.

검토 및 복구 작업을 위한 근거 기반 과거 데이터 백필 경로도 있습니다:

- `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 생성된 근거 기반 일기 출력을 미리 봅니다.
- `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 기록합니다.
- `memory rem-backfill --path ... --stage-short-term`는 근거 기반 지속 후보를 일반 Deep 단계가 이미 사용하는 것과 동일한 단기 증거 저장소에 준비합니다.
- `memory rem-backfill --rollback` 및 `--rollback-short-term`는 일반 일기 항목이나 실제 단기 recall에는 손대지 않고 준비된 백필 아티팩트를 제거합니다.

Control UI는 동일한 일기 백필/재설정 흐름을 제공하므로, 근거 기반 후보가 승격될 가치가 있는지 결정하기 전에 Dreams 장면에서 결과를 검사할 수 있습니다. 또한 Scene은 별도의 근거 기반 경로를 표시하므로, 어떤 준비된 단기 항목이 과거 재생에서 왔는지, 어떤 승격 항목이 근거 기반 주도였는지 확인할 수 있으며, 일반적인 실제 단기 상태에는 손대지 않고 근거 기반으로만 준비된 항목만 지울 수 있습니다.

## Deep 순위 평가 신호

Deep 순위 평가는 여섯 개의 가중 기본 신호와 단계 강화 신호를 사용합니다:

| 신호 | 가중치 | 설명 |
| ---- | ------ | ---- |
| 빈도 | 0.24   | 해당 항목이 축적한 단기 신호 수 |
| 관련성 | 0.30   | 해당 항목의 평균 검색 품질 |
| 쿼리 다양성 | 0.15   | 이를 드러낸 서로 다른 쿼리/일 컨텍스트 |
| 최신성 | 0.15   | 시간 감쇠 기반 신선도 점수 |
| 통합도 | 0.10   | 여러 날에 걸친 반복 강도 |
| 개념 풍부도 | 0.06   | 스니펫/경로의 개념 태그 밀도 |

Light 및 REM 단계의 적중은
`memory/.dreams/phase-signals.json`의 최신성 감쇠 기반 소폭 부스트를 추가합니다.

## 스케줄링

활성화되면 `memory-core`는 전체 Dreaming 스윕을 위한 하나의 Cron 작업을 자동 관리합니다. 각 스윕은 단계 순서대로 실행됩니다: light -> REM -> deep.

기본 주기 동작:

| 설정 | 기본값 |
| ---- | ------ |
| `dreaming.frequency` | `0 3 * * *` |

## 빠른 시작

Dreaming 활성화:

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

사용자 정의 스윕 주기로 Dreaming 활성화:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## 슬래시 명령

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 워크플로

미리 보기 또는 수동 적용에는 CLI 승격을 사용합니다:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 Deep 단계 임계값을 사용합니다.

특정 후보가 왜 승격되거나 승격되지 않는지 설명합니다:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

아무것도 기록하지 않고 REM 성찰, 후보 진술, Deep 승격 출력을 미리 봅니다:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 주요 기본값

모든 설정은 `plugins.entries.memory-core.config.dreaming` 아래에 있습니다.

| 키 | 기본값 |
| --- | ------ |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

단계 정책, 임계값, 저장소 동작은 내부 구현 세부 사항입니다
(사용자 대상 구성 아님).

전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming)를
참조하세요.

## Dreams UI

활성화되면 Gateway **Dreams** 탭에는 다음이 표시됩니다:

- 현재 Dreaming 활성화 상태
- 단계 수준 상태 및 관리형 스윕 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격 수
- 다음 예약 실행 시각
- 준비된 과거 재생 항목을 위한 별도의 근거 기반 Scene 경로
- `doctor.memory.dreamDiary`를 기반으로 하는 확장 가능한 Dream Diary 리더

## 문제 해결

### Dreaming이 전혀 실행되지 않음(상태에 blocked 표시)

관리형 Dreaming Cron은 기본 에이전트의 Heartbeat에 올라탑니다. 해당 에이전트의 Heartbeat가 실행되지 않으면 Cron은 아무도 소비하지 않는 시스템 이벤트를 큐에 넣고, Dreaming은 조용히 실행되지 않습니다. 이 경우 `openclaw memory status`와 `/dreaming status` 모두 `blocked`를 보고하고, 어떤 에이전트의 Heartbeat가 문제인지 이름을 표시합니다.

흔한 원인 두 가지:

- 다른 에이전트가 명시적인 `heartbeat:` 블록을 선언했습니다. `agents.list`의 어떤 항목이든 자체 `heartbeat` 블록을 가지면, Heartbeat는 해당 에이전트들에서만 동작합니다. 그러면 기본값이 더 이상 모든 에이전트에 적용되지 않아 기본 에이전트가 조용해질 수 있습니다. Heartbeat 설정을 `agents.defaults.heartbeat`로 옮기거나, 기본 에이전트에 명시적인 `heartbeat` 블록을 추가하세요. [범위 및 우선순위](/ko/gateway/heartbeat#scope-and-precedence)를 참조하세요.
- `heartbeat.every`가 `0`, 비어 있음, 또는 파싱할 수 없는 값입니다. Cron이 기준으로 삼을 간격이 없으므로 Heartbeat가 사실상 비활성화됩니다. `every`를 `30m` 같은 양의 기간으로 설정하세요. [기본값](/ko/gateway/heartbeat#defaults)을 참조하세요.

## 관련 항목

- [Heartbeat](/ko/gateway/heartbeat)
- [메모리](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [memory CLI](/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
