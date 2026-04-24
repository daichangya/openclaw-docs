---
read_when:
    - 로컬 OpenClaw 상태를 위한 일급 백업 아카이브가 필요하신 것입니다
    - 재설정 또는 제거 전에 어떤 경로가 포함될지 미리 보고 싶으신 것입니다
summary: '`openclaw backup`에 대한 CLI 참조(로컬 백업 아카이브 생성)'
title: 백업
x-i18n:
    generated_at: "2026-04-24T06:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

OpenClaw 상태, 구성, 인증 프로필, 채널/provider 자격 증명, 세션, 그리고 선택적으로 워크스페이스를 위한 로컬 백업 아카이브를 생성합니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 참고

- 아카이브에는 확인된 소스 경로와 아카이브 레이아웃이 포함된 `manifest.json` 파일이 포함됩니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프 기반 `.tar.gz` 아카이브입니다.
- 현재 작업 디렉터리가 백업되는 소스 트리 내부에 있으면 OpenClaw는 기본 아카이브 위치로 홈 디렉터리를 사용합니다.
- 기존 아카이브 파일은 절대 덮어쓰지 않습니다.
- 자체 포함을 방지하기 위해 소스 상태/워크스페이스 트리 내부의 출력 경로는 거부됩니다.
- `openclaw backup verify <archive>`는 아카이브에 루트 `manifest`가 정확히 하나만 포함되어 있는지 검증하고, 순회형 아카이브 경로를 거부하며, `manifest`에 선언된 모든 페이로드가 tarball에 존재하는지 확인합니다.
- `openclaw backup create --verify`는 아카이브를 쓴 직후 이 검증을 즉시 실행합니다.
- `openclaw backup create --only-config`는 활성 JSON 구성 파일만 백업합니다.

## 백업되는 항목

`openclaw backup create`는 로컬 OpenClaw 설치에서 백업 소스를 계획합니다.

- OpenClaw의 로컬 상태 확인자가 반환하는 상태 디렉터리(일반적으로 `~/.openclaw`)
- 활성 구성 파일 경로
- 상태 디렉터리 외부에 있을 경우 확인된 `credentials/` 디렉터리
- 현재 구성에서 발견된 워크스페이스 디렉터리(`--no-include-workspace`를 전달하지 않은 경우)

모델 인증 프로필은 이미 상태 디렉터리의
`agents/<agentId>/agent/auth-profiles.json` 아래에 있으므로 일반적으로
상태 백업 항목에 포함됩니다.

`--only-config`를 사용하면 OpenClaw는 상태, 자격 증명 디렉터리, 워크스페이스 검색을 건너뛰고 활성 구성 파일 경로만 아카이브합니다.

OpenClaw는 아카이브를 만들기 전에 경로를 정규화합니다. 구성, 자격 증명 디렉터리, 또는 워크스페이스가 이미 상태 디렉터리 안에 있으면 별도의 최상위 백업 소스로 중복되지 않습니다. 없는 경로는 건너뜁니다.

아카이브 페이로드는 해당 소스 트리의 파일 내용을 저장하며, 내장된 `manifest.json`은 각 자산에 사용된 아카이브 레이아웃과 함께 확인된 절대 소스 경로를 기록합니다.

## 잘못된 구성 동작

`openclaw backup`은 복구 중에도 도움이 될 수 있도록 의도적으로 일반 구성 사전 점검을 우회합니다. 워크스페이스 검색은 유효한 구성에 의존하므로, 이제 `openclaw backup create`는 구성 파일이 존재하지만 잘못되었고 워크스페이스 백업이 여전히 활성화된 경우 즉시 실패합니다.

이 상황에서도 부분 백업을 원한다면 다음과 같이 다시 실행하세요.

```bash
openclaw backup create --no-include-workspace
```

이렇게 하면 상태, 구성, 외부 자격 증명 디렉터리는 범위에 포함한 채
워크스페이스 검색만 완전히 건너뜁니다.

구성 파일 자체의 복사본만 필요하다면 `--only-config`도 잘못된 구성에서 작동합니다. 워크스페이스 검색을 위해 구성을 파싱할 필요가 없기 때문입니다.

## 크기 및 성능

OpenClaw는 기본 제공 최대 백업 크기나 파일별 크기 제한을 적용하지 않습니다.

실질적인 제한은 로컬 머신과 대상 파일시스템에서 발생합니다.

- 임시 아카이브 쓰기와 최종 아카이브를 위한 사용 가능한 공간
- 큰 워크스페이스 트리를 순회하고 이를 `.tar.gz`로 압축하는 데 걸리는 시간
- `openclaw backup create --verify`를 사용하거나 `openclaw backup verify`를 실행할 때 아카이브를 다시 검사하는 시간
- 대상 경로의 파일시스템 동작. OpenClaw는 덮어쓰기 없는 하드 링크 게시 단계를 우선 사용하고, 하드 링크가 지원되지 않으면 배타적 복사로 대체합니다

대규모 워크스페이스는 보통 아카이브 크기의 가장 큰 원인입니다. 더 작거나 빠른 백업을 원하면 `--no-include-workspace`를 사용하세요.

가장 작은 아카이브를 원하면 `--only-config`를 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
