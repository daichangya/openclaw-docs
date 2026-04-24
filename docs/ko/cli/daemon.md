---
read_when:
    - 스크립트에서 여전히 `openclaw daemon ...`을(를) 사용하는 경우
    - 서비스 수명 주기 명령(install/start/stop/restart/status)이 필요한 경우
summary: '`openclaw daemon`에 대한 CLI 참조(Gateway 서비스 관리용 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-04-24T06:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Gateway 서비스 관리 명령의 레거시 별칭입니다.

`openclaw daemon ...`은 `openclaw gateway ...` 서비스 명령과 동일한 서비스 제어 표면에 매핑됩니다.

## 사용법

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 하위 명령

- `status`: 서비스 설치 상태 표시 및 Gateway 상태 프로브
- `install`: 서비스 설치(`launchd`/`systemd`/`schtasks`)
- `uninstall`: 서비스 제거
- `start`: 서비스 시작
- `stop`: 서비스 중지
- `restart`: 서비스 재시작

## 공통 옵션

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- 수명 주기(`uninstall|start|stop|restart`): `--json`

참고:

- `status`는 가능할 때 프로브 인증을 위해 구성된 auth SecretRefs를 확인합니다.
- 이 명령 경로에서 필요한 auth SecretRef가 확인되지 않으면, 프로브 연결/인증에 실패할 때 `daemon status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 secret 소스를 확인하세요.
- 프로브가 성공하면 확인되지 않은 auth-ref 경고는 거짓 양성을 피하기 위해 숨겨집니다.
- `status --deep`는 최선의 노력 방식의 시스템 수준 서비스 스캔을 추가합니다. 다른 gateway 유사 서비스를 찾으면 사람이 읽는 출력에 정리 힌트를 표시하고, 머신당 하나의 Gateway가 여전히 일반적인 권장 사항이라고 경고합니다.
- Linux systemd 설치에서 `status` 토큰 드리프트 검사는 `Environment=`와 `EnvironmentFile=` unit 소스를 모두 포함합니다.
- 드리프트 검사는 병합된 런타임 env(서비스 명령 env 우선, 그다음 프로세스 env 대체)를 사용해 `gateway.auth.token` SecretRefs를 확인합니다.
- 토큰 인증이 실질적으로 활성 상태가 아니면(명시적인 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, mode가 설정되지 않아 password가 우선될 수 있고 토큰 후보가 우선될 수 없는 경우), 토큰 드리프트 검사는 구성 토큰 확인을 건너뜁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `install`은 SecretRef가 확인 가능한지 검증하지만 확인된 토큰을 서비스 환경 메타데이터에 영속 저장하지는 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않으면 설치는 fail closed됩니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, mode가 명시적으로 설정될 때까지 설치가 차단됩니다.
- 의도적으로 하나의 호스트에서 여러 Gateway를 실행하는 경우, 포트, 구성/상태, 워크스페이스를 격리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

## 권장

최신 문서와 예시는 [`openclaw gateway`](/ko/cli/gateway)를 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
- [Gateway runbook](/ko/gateway)
