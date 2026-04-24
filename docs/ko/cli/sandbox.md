---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 샌드박스 런타임 관리 및 유효 샌드박스 정책 검사
title: 샌드박스 CLI
x-i18n:
    generated_at: "2026-04-24T06:08:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

격리된 에이전트 실행을 위한 샌드박스 런타임을 관리합니다.

## 개요

OpenClaw는 보안을 위해 격리된 샌드박스 런타임에서 에이전트를 실행할 수 있습니다. `sandbox` 명령은 업데이트나 구성 변경 후 이러한 런타임을 검사하고 다시 만드는 데 도움을 줍니다.

현재 이는 보통 다음을 의미합니다.

- Docker 샌드박스 컨테이너
- `agents.defaults.sandbox.backend = "ssh"`일 때의 SSH 샌드박스 런타임
- `agents.defaults.sandbox.backend = "openshell"`일 때의 OpenShell 샌드박스 런타임

`ssh`와 OpenShell `remote`에서는 Docker보다 recreate가 더 중요합니다.

- 원격 워크스페이스는 초기 시드 후 정본입니다
- `openclaw sandbox recreate`는 선택한 범위에 대해 그 정본 원격 워크스페이스를 삭제합니다
- 다음 사용 시 현재 로컬 워크스페이스에서 다시 시드합니다

## 명령

### `openclaw sandbox explain`

**유효한** 샌드박스 모드/범위/워크스페이스 액세스, 샌드박스 도구 정책, 그리고 상향 권한 게이트를 검사합니다(fix-it 구성 키 경로 포함).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

상태와 구성이 포함된 모든 샌드박스 런타임을 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 브라우저 컨테이너만 나열
openclaw sandbox list --json     # JSON 출력
```

**출력에는 다음이 포함됩니다.**

- 런타임 이름과 상태
- 백엔드 (`docker`, `openshell` 등)
- 구성 레이블 및 현재 구성과의 일치 여부
- 사용 기간(생성 이후 경과 시간)
- 유휴 시간(마지막 사용 이후 경과 시간)
- 연결된 세션/에이전트

### `openclaw sandbox recreate`

업데이트된 구성으로 다시 생성을 강제하기 위해 샌드박스 런타임을 제거합니다.

```bash
openclaw sandbox recreate --all                # 모든 컨테이너 재생성
openclaw sandbox recreate --session main       # 특정 세션
openclaw sandbox recreate --agent mybot        # 특정 에이전트
openclaw sandbox recreate --browser            # 브라우저 컨테이너만
openclaw sandbox recreate --all --force        # 확인 건너뛰기
```

**옵션:**

- `--all`: 모든 샌드박스 컨테이너 재생성
- `--session <key>`: 특정 세션용 컨테이너 재생성
- `--agent <id>`: 특정 에이전트용 컨테이너 재생성
- `--browser`: 브라우저 컨테이너만 재생성
- `--force`: 확인 프롬프트 건너뛰기

**중요:** 런타임은 다음에 에이전트를 사용할 때 자동으로 다시 생성됩니다.

## 사용 사례

### Docker 이미지 업데이트 후

```bash
# 새 이미지 가져오기
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 새 이미지를 사용하도록 구성 업데이트
# 구성 편집: agents.defaults.sandbox.docker.image (또는 agents.list[].sandbox.docker.image)

# 컨테이너 재생성
openclaw sandbox recreate --all
```

### 샌드박스 구성 변경 후

```bash
# 구성 편집: agents.defaults.sandbox.* (또는 agents.list[].sandbox.*)

# 새 구성 적용을 위해 재생성
openclaw sandbox recreate --all
```

### SSH 대상 또는 SSH 인증 자료 변경 후

```bash
# 구성 편집:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

핵심 `ssh` 백엔드의 경우 recreate는 SSH 대상의 범위별 원격 워크스페이스 루트를 삭제합니다. 다음 실행 시 로컬 워크스페이스에서 다시 시드합니다.

### OpenShell 소스, 정책 또는 모드 변경 후

```bash
# 구성 편집:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` 모드의 경우 recreate는 해당 범위의 정본 원격 워크스페이스를 삭제합니다. 다음 실행 시 로컬 워크스페이스에서 다시 시드합니다.

### setupCommand 변경 후

```bash
openclaw sandbox recreate --all
# 또는 에이전트 하나만:
openclaw sandbox recreate --agent family
```

### 특정 에이전트에만 적용

```bash
# 에이전트 하나의 컨테이너만 업데이트
openclaw sandbox recreate --agent alfred
```

## 왜 이것이 필요한가요?

**문제:** 샌드박스 구성을 업데이트하면

- 기존 런타임은 이전 설정으로 계속 실행됩니다
- 런타임은 24시간 비활성 후에만 정리됩니다
- 자주 사용하는 에이전트는 이전 런타임을 무기한 유지합니다

**해결책:** `openclaw sandbox recreate`를 사용해 이전 런타임을 강제로 제거하세요. 다음에 필요할 때 현재 설정으로 자동 재생성됩니다.

팁: 수동 백엔드별 정리보다 `openclaw sandbox recreate`를 우선 사용하세요.
이 명령은 Gateway의 런타임 레지스트리를 사용하므로 범위/세션 키가 바뀔 때 불일치를 피할 수 있습니다.

## 구성

샌드박스 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다(에이전트별 재정의는 `agents.list[].sandbox`에 둠).

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // 24시간 유휴 후 자동 정리
          "maxAgeDays": 7, // 7일 후 자동 정리
        },
      },
    },
  },
}
```

## 관련

- [CLI 참조](/ko/cli)
- [샌드박싱](/ko/gateway/sandboxing)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [Doctor](/ko/gateway/doctor) — 샌드박스 설정 검사
