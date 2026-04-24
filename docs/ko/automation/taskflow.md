---
read_when:
    - 작업 흐름이 백그라운드 작업과 어떻게 관련되는지 이해하고 싶으신 것입니다
    - 릴리스 노트나 문서에서 TaskFlow 또는 openclaw 작업 흐름을 접하게 됩니다
    - 지속형 흐름 상태를 검사하거나 관리하고 싶으신 것입니다
summary: 백그라운드 작업 위의 Task Flow 흐름 오케스트레이션 계층
title: 작업 흐름
x-i18n:
    generated_at: "2026-04-24T06:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow는 [백그라운드 작업](/ko/automation/tasks) 위에 위치하는 흐름 오케스트레이션 기반 계층입니다. 개별 작업은 분리되어 실행되는 작업의 단위로 유지되는 반면, TaskFlow는 자체 상태, 리비전 추적, 동기화 의미 체계를 갖춘 지속형 다단계 흐름을 관리합니다.

## TaskFlow를 사용해야 하는 경우

작업이 여러 개의 순차적 단계 또는 분기 단계에 걸쳐 있고 게이트웨이 재시작 간에도 지속되는 진행 상황 추적이 필요할 때는 TaskFlow를 사용하세요. 단일 백그라운드 작업의 경우에는 일반 [작업](/ko/automation/tasks)만으로 충분합니다.

| 시나리오 | 사용 방식 |
| ------------------------------------- | -------------------- |
| 단일 백그라운드 작업 | 일반 작업 |
| 다단계 파이프라인 (A 다음 B 다음 C) | TaskFlow (관리형) |
| 외부에서 생성된 작업 관찰 | TaskFlow (미러링) |
| 일회성 리마인더 | Cron 작업 |

## 동기화 모드

### 관리형 모드

TaskFlow는 수명 주기를 처음부터 끝까지 소유합니다. 흐름 단계를 작업으로 생성하고, 완료될 때까지 구동한 다음, 흐름 상태를 자동으로 다음 단계로 진행시킵니다.

예: 주간 보고서 흐름은 (1) 데이터를 수집하고, (2) 보고서를 생성하며, (3) 이를 전달합니다. TaskFlow는 각 단계를 백그라운드 작업으로 생성하고, 완료를 기다린 뒤, 다음 단계로 이동합니다.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 미러링 모드

TaskFlow는 외부에서 생성된 작업을 관찰하고 작업 생성의 소유권을 갖지 않은 채 흐름 상태를 동기화된 상태로 유지합니다. 이는 작업이 Cron 작업, CLI 명령 또는 기타 소스에서 시작되고, 그 진행 상황을 하나의 흐름으로 통합해서 보고 싶을 때 유용합니다.

예: 함께 "아침 운영" 루틴을 구성하는 세 개의 독립적인 Cron 작업이 있습니다. 미러링 흐름은 언제 어떻게 실행되는지를 제어하지 않으면서 이들의 전체 진행 상황을 추적합니다.

## 지속형 상태 및 리비전 추적

각 흐름은 자체 상태를 유지하고 리비전을 추적하므로 게이트웨이 재시작 후에도 진행 상황이 유지됩니다. 리비전 추적을 통해 여러 소스가 동시에 같은 흐름을 진행시키려 할 때 충돌을 감지할 수 있습니다.

## 취소 동작

`openclaw tasks flow cancel`은 흐름에 고정형 취소 의도를 설정합니다. 흐름 내 활성 작업은 취소되며, 새로운 단계는 시작되지 않습니다. 이 취소 의도는 재시작 후에도 유지되므로, 모든 하위 작업이 종료되기 전에 게이트웨이가 재시작되더라도 취소된 흐름은 계속 취소된 상태로 남습니다.

## CLI 명령

```bash
# 활성 및 최근 흐름 나열
openclaw tasks flow list

# 특정 흐름의 세부 정보 표시
openclaw tasks flow show <lookup>

# 실행 중인 흐름과 그 활성 작업 취소
openclaw tasks flow cancel <lookup>
```

| 명령 | 설명 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 상태와 동기화 모드를 포함한 추적 중인 흐름을 표시합니다 |
| `openclaw tasks flow show <id>` | 흐름 ID 또는 조회 키로 하나의 흐름을 검사합니다 |
| `openclaw tasks flow cancel <id>` | 실행 중인 흐름과 그 활성 작업을 취소합니다 |

## 흐름과 작업의 관계

흐름은 작업을 조정하는 것이지, 이를 대체하는 것이 아닙니다. 하나의 흐름은 수명 주기 동안 여러 백그라운드 작업을 구동할 수 있습니다. 개별 작업 레코드를 검사하려면 `openclaw tasks`를 사용하고, 오케스트레이션하는 흐름을 검사하려면 `openclaw tasks flow`를 사용하세요.

## 관련

- [백그라운드 작업](/ko/automation/tasks) — 흐름이 조정하는 분리 실행 작업 원장
- [CLI: tasks](/ko/cli/tasks) — `openclaw tasks flow`용 CLI 명령 참조
- [자동화 개요](/ko/automation) — 모든 자동화 메커니즘을 한눈에 보기
- [Cron 작업](/ko/automation/cron-jobs) — 흐름에 입력될 수 있는 예약 작업
