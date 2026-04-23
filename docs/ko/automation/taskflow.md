---
read_when:
    - Task Flow가 백그라운드 작업과 어떻게 관련되는지 이해하고 싶습니다.
    - 릴리스 노트나 문서에서 Task Flow 또는 OpenClaw 작업 흐름을 접하게 됩니다.
    - 내구성 있는 흐름 상태를 검사하거나 관리하고 싶습니다.
summary: 백그라운드 작업 상위의 Task Flow 흐름 오케스트레이션 계층
title: 작업 흐름
x-i18n:
    generated_at: "2026-04-23T06:01:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# 작업 흐름

Task Flow는 [백그라운드 작업](/ko/automation/tasks) 상위에 위치하는 흐름 오케스트레이션 기반 계층입니다. 개별 작업은 분리된 작업의 단위로 유지되는 반면, Task Flow는 자체 상태, 리비전 추적, 동기화 의미 체계를 갖춘 내구성 있는 다단계 흐름을 관리합니다.

## Task Flow를 사용해야 하는 경우

여러 순차적 단계 또는 분기 단계에 걸쳐 작업이 진행되고, gateway 재시작 이후에도 내구성 있는 진행 상황 추적이 필요하다면 Task Flow를 사용하세요. 단일 백그라운드 작업의 경우 일반 [task](/ko/automation/tasks)면 충분합니다.

| 시나리오 | 사용 대상 |
| ------------------------------------- | -------------------- |
| 단일 백그라운드 작업 | 일반 task |
| 다단계 파이프라인 (A 다음 B 다음 C) | Task Flow (관리형) |
| 외부에서 생성된 작업 관찰 | Task Flow (미러링형) |
| 일회성 리마인더 | Cron 작업 |

## 동기화 모드

### 관리형 모드

Task Flow가 수명 주기 전체를 처음부터 끝까지 소유합니다. 흐름 단계로 작업을 생성하고, 완료까지 진행을 제어하며, 흐름 상태를 자동으로 다음으로 진행합니다.

예: 주간 보고서 흐름은 (1) 데이터를 수집하고, (2) 보고서를 생성하고, (3) 전달합니다. Task Flow는 각 단계를 백그라운드 작업으로 생성하고, 완료를 기다린 다음, 다음 단계로 이동합니다.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 미러링형 모드

Task Flow는 외부에서 생성된 작업을 관찰하고, 작업 생성의 소유권을 갖지 않으면서 흐름 상태를 동기화된 상태로 유지합니다. 이는 작업이 Cron 작업, CLI 명령 또는 다른 소스에서 시작되고, 그 진행 상황을 하나의 흐름으로 통합해 보고 싶을 때 유용합니다.

예: 함께 "아침 운영" 루틴을 구성하는 세 개의 독립적인 Cron 작업이 있습니다. 미러링형 흐름은 작업이 언제 또는 어떻게 실행되는지는 제어하지 않으면서 이들의 전체 진행 상황을 추적합니다.

## 내구성 있는 상태와 리비전 추적

각 흐름은 자체 상태를 영속화하고 리비전을 추적하므로, 진행 상황이 gateway 재시작 이후에도 유지됩니다. 리비전 추적은 여러 소스가 동시에 같은 흐름을 진행시키려 할 때 충돌을 감지할 수 있게 해줍니다.

## 취소 동작

`openclaw tasks flow cancel`은 흐름에 고정된 취소 의도를 설정합니다. 흐름 내 활성 작업은 취소되며, 새로운 단계는 시작되지 않습니다. 취소 의도는 재시작 후에도 유지되므로, 모든 하위 작업이 종료되기 전에 gateway가 재시작되더라도 취소된 흐름은 계속 취소된 상태로 남습니다.

## CLI 명령

```bash
# 활성 및 최근 흐름 나열
openclaw tasks flow list

# 특정 흐름의 세부 정보 표시
openclaw tasks flow show <lookup>

# 실행 중인 흐름과 해당 활성 작업 취소
openclaw tasks flow cancel <lookup>
```

| 명령 | 설명 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 상태와 동기화 모드가 포함된 추적된 흐름 표시 |
| `openclaw tasks flow show <id>` | 흐름 ID 또는 조회 키로 하나의 흐름 검사 |
| `openclaw tasks flow cancel <id>` | 실행 중인 흐름과 해당 활성 작업 취소 |

## 흐름과 작업의 관계

흐름은 작업을 대체하지 않고 조정합니다. 하나의 흐름은 수명 주기 동안 여러 백그라운드 작업을 구동할 수 있습니다. 개별 작업 레코드는 `openclaw tasks`로 검사하고, 오케스트레이션하는 흐름은 `openclaw tasks flow`로 검사하세요.

## 관련 항목

- [백그라운드 작업](/ko/automation/tasks) — 흐름이 조정하는 분리형 작업 원장
- [CLI: tasks](/cli/tasks) — `openclaw tasks flow`용 CLI 명령 참조
- [자동화 개요](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Cron 작업](/ko/automation/cron-jobs) — 흐름으로 유입될 수 있는 예약 작업
