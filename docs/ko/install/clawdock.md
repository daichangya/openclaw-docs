---
read_when:
    - Docker로 OpenClaw를 자주 실행하며 일상 명령을 더 짧게 쓰고 싶습니다
    - dashboard, 로그, 토큰 설정, 페어링 흐름을 위한 도우미 계층을 원합니다
summary: Docker 기반 OpenClaw 설치를 위한 ClawDock 셸 도우미
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T06:19:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock은 Docker 기반 OpenClaw 설치를 위한 작은 셸 도우미 계층입니다.

긴 `docker compose ...` 호출 대신 `clawdock-start`, `clawdock-dashboard`, `clawdock-fix-token` 같은 짧은 명령을 제공합니다.

아직 Docker를 설정하지 않았다면 먼저 [Docker](/ko/install/docker)부터 시작하세요.

## 설치

정식 도우미 경로를 사용하세요.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전에 `scripts/shell-helpers/clawdock-helpers.sh`에서 ClawDock을 설치했다면 새 `scripts/clawdock/clawdock-helpers.sh` 경로에서 다시 설치하세요. 이전 raw GitHub 경로는 제거되었습니다.

## 제공 기능

### 기본 작업

| 명령               | 설명                   |
| ------------------ | ---------------------- |
| `clawdock-start`   | gateway 시작           |
| `clawdock-stop`    | gateway 중지           |
| `clawdock-restart` | gateway 재시작         |
| `clawdock-status`  | 컨테이너 상태 확인     |
| `clawdock-logs`    | gateway 로그 추적      |

### 컨테이너 접근

| 명령                      | 설명                                         |
| ------------------------- | -------------------------------------------- |
| `clawdock-shell`          | gateway 컨테이너 안에서 셸 열기             |
| `clawdock-cli <command>`  | Docker 안에서 OpenClaw CLI 명령 실행         |
| `clawdock-exec <command>` | 컨테이너에서 임의의 명령 실행                |

### 웹 UI 및 페어링

| 명령                    | 설명                        |
| ----------------------- | --------------------------- |
| `clawdock-dashboard`    | Control UI URL 열기         |
| `clawdock-devices`      | 대기 중인 device 페어링 나열 |
| `clawdock-approve <id>` | 페어링 요청 승인            |

### 설정 및 유지보수

| 명령                 | 설명                                             |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | 컨테이너 내부의 gateway 토큰 구성                |
| `clawdock-update`    | pull, rebuild, restart 수행                      |
| `clawdock-rebuild`   | Docker 이미지 다시 빌드만 수행                   |
| `clawdock-clean`     | 컨테이너와 볼륨 제거                             |

### 유틸리티

| 명령                   | 설명                                   |
| ---------------------- | -------------------------------------- |
| `clawdock-health`      | gateway 상태 점검 실행                 |
| `clawdock-token`       | gateway 토큰 출력                      |
| `clawdock-cd`          | OpenClaw 프로젝트 디렉터리로 이동      |
| `clawdock-config`      | `~/.openclaw` 열기                     |
| `clawdock-show-config` | redaction된 값으로 config 파일 출력    |
| `clawdock-workspace`   | 워크스페이스 디렉터리 열기             |

## 최초 실행 흐름

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

브라우저가 페어링이 필요하다고 표시하면:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Config 및 비밀

ClawDock은 [Docker](/ko/install/docker)에 설명된 것과 같은 Docker config 분할을 사용합니다.

- 이미지 이름, 포트, gateway 토큰 같은 Docker 전용 값은 `<project>/.env`
- env 기반 provider 키와 봇 토큰은 `~/.openclaw/.env`
- 저장된 provider OAuth/API 키 인증은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 동작 config는 `~/.openclaw/openclaw.json`

`.env` 파일과 `openclaw.json`을 빠르게 확인하려면 `clawdock-show-config`를 사용하세요. 출력 시 `.env` 값은 redaction 처리됩니다.

## 관련 페이지

- [Docker](/ko/install/docker)
- [Docker VM Runtime](/ko/install/docker-vm-runtime)
- [업데이트](/ko/install/updating)
