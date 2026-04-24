---
read_when:
    - 백그라운드 작업 기록을 검사, 감사 또는 취소하려는 경우
    - '`openclaw tasks flow` 아래의 TaskFlow 명령어를 문서화하는 경우'
summary: '``openclaw tasks``에 대한 CLI 참조(백그라운드 작업 원장 및 TaskFlow 상태)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T06:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

내구성 있는 백그라운드 작업과 TaskFlow 상태를 검사합니다. 하위 명령어 없이
`openclaw tasks`를 실행하면 `openclaw tasks list`와 같습니다.

수명 주기 및 전달 모델은 [Background Tasks](/ko/automation/tasks)를 참조하세요.

## 사용법

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 루트 옵션

- `--json`: JSON 출력.
- `--runtime <name>`: 종류별 필터: `subagent`, `acp`, `cron`, 또는 `cli`.
- `--status <name>`: 상태별 필터: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, 또는 `lost`.

## 하위 명령어

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

추적 중인 백그라운드 작업을 최신순으로 나열합니다.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

작업 ID, 실행 ID 또는 세션 키로 하나의 작업을 표시합니다.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

실행 중인 작업의 알림 정책을 변경합니다.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

실행 중인 백그라운드 작업을 취소합니다.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

오래되었거나, 유실되었거나, 전달에 실패했거나, 그 외 일관되지 않은 작업 및 TaskFlow 기록을 표시합니다.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

작업 및 TaskFlow 조정, 정리 스탬프 처리, 가지치기를 미리 보거나 적용합니다.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

작업 원장 아래의 내구성 있는 TaskFlow 상태를 검사하거나 취소합니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Background tasks](/ko/automation/tasks)
