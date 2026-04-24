---
read_when:
    - 소스 체크아웃을 비교적 안전하게 업데이트하려고 합니다.
    - '`--update` 축약 동작을 이해해야 합니다.'
summary: '`openclaw update`에 대한 CLI 참조(비교적 안전한 소스 업데이트 + gateway 자동 재시작)'
title: 업데이트
x-i18n:
    generated_at: "2026-04-24T06:09:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw를 비교적 안전하게 업데이트하고 stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm/bun**으로 설치한 경우(전역 설치, git 메타데이터 없음), 업데이트는 [업데이트](/ko/install/updating)의 패키지 관리자 흐름을 통해 수행됩니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 옵션

- `--no-restart`: 업데이트 성공 후 Gateway 서비스를 다시 시작하지 않습니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm, config에 영속화됨).
- `--tag <dist-tag|version|spec>`: 이번 업데이트에만 패키지 대상을 재정의합니다. 패키지 설치의 경우 `main`은 `github:openclaw/openclaw#main`에 매핑됩니다.
- `--dry-run`: config 쓰기, 설치, Plugin 동기화, 재시작 없이 계획된 업데이트 작업(채널/태그/대상/재시작 흐름)을 미리 봅니다.
- `--json`: 기계 판독 가능한 `UpdateRunResult` JSON을 출력하며, 업데이트 후 Plugin 동기화 중 npm Plugin 아티팩트 드리프트가 감지되면 `postUpdate.plugins.integrityDrifts`도 포함됩니다.
- `--timeout <seconds>`: 단계별 타임아웃(기본값 1200초).
- `--yes`: 확인 프롬프트를 건너뜁니다(예: 다운그레이드 확인).

참고: 이전 버전이 구성을 깨뜨릴 수 있으므로 다운그레이드는 확인이 필요합니다.

## `update status`

활성 업데이트 채널 + git 태그/브랜치/SHA(소스 체크아웃의 경우), 그리고 업데이트 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계 판독 가능한 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 검사 타임아웃(기본값 3초).

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 Gateway를 재시작할지(기본값은 재시작) 확인하는 대화형 흐름입니다. git 체크아웃 없이 `dev`를 선택하면 체크아웃 생성을 제안합니다.

옵션:

- `--timeout <seconds>`: 각 업데이트 단계의 타임아웃(기본값 `1200`)

## 수행 작업

채널을 명시적으로 전환하면(`--channel ...`), OpenClaw는 설치 방식도 함께 맞춥니다.

- `dev` → git 체크아웃을 보장하고(기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의 가능), 이를 업데이트한 뒤 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable` → `latest`를 사용해 npm에서 설치합니다.
- `beta` → npm dist-tag `beta`를 우선 사용하지만, beta가 없거나 현재 stable 릴리스보다 오래된 경우 `latest`로 대체합니다.

Gateway 코어 자동 업데이터(config로 활성화된 경우)는 동일한 업데이트 경로를 재사용합니다.

패키지 관리자 설치의 경우 `openclaw update`는 패키지 관리자를 호출하기 전에 대상 패키지 버전을 확인합니다. 설치된 버전이 대상과 정확히 일치하고 영속화해야 할 업데이트 채널 변경도 없으면, 명령은 패키지 설치, Plugin 동기화, completion 새로고침, gateway 재시작 작업 전에 건너뜀으로 종료됩니다.

## Git 체크아웃 흐름

채널:

- `stable`: 최신 비-beta 태그를 체크아웃한 뒤 build + doctor 실행
- `beta`: 최신 `-beta` 태그를 우선 사용하되, beta가 없거나 더 오래된 경우 최신 stable 태그로 대체
- `dev`: `main` 체크아웃 후 fetch + rebase

상위 수준 흐름:

1. 깨끗한 워크트리(커밋되지 않은 변경 없음)가 필요합니다.
2. 선택한 채널(태그 또는 브랜치)로 전환합니다.
3. 업스트림을 fetch합니다(dev 전용).
4. dev 전용: 임시 워크트리에서 사전 lint + TypeScript build를 실행하고, tip이 실패하면 최대 10개 커밋까지 뒤로 가며 가장 최신의 정상 build를 찾습니다.
5. 선택한 커밋으로 rebase합니다(dev 전용).
6. 리포지토리 패키지 관리자로 의존성을 설치합니다. pnpm 체크아웃의 경우 업데이터는 pnpm 워크스페이스 안에서 `npm run build`를 실행하는 대신 필요 시 `pnpm`을 부트스트랩합니다(`corepack` 우선, 실패 시 임시 `npm install pnpm@10` 대체 경로 사용).
7. build 및 Control UI build를 실행합니다.
8. 최종 “안전한 업데이트” 검사로 `openclaw doctor`를 실행합니다.
9. 활성 채널에 맞춰 Plugins를 동기화합니다(dev는 번들 Plugins 사용, stable/beta는 npm 사용) 그리고 npm 설치 Plugin을 업데이트합니다.

정확히 고정된 npm Plugin 업데이트가 저장된 설치 기록과 무결성이 다른 아티팩트로 확인되면, `openclaw update`는 해당 Plugin 아티팩트 업데이트를 설치하지 않고 중단합니다. 새 아티팩트를 신뢰할 수 있는지 확인한 후에만 Plugin을 명시적으로 재설치하거나 업데이트하세요.

pnpm 부트스트랩이 여전히 실패하면, 업데이터는 이제 체크아웃 내부에서 `npm run build`를 시도하는 대신 패키지 관리자 전용 오류로 조기에 중단합니다.

## `--update` 축약

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸 및 launcher 스크립트에 유용).

## 관련 항목

- `openclaw doctor`(git 체크아웃에서는 먼저 업데이트 실행을 제안함)
- [개발 채널](/ko/install/development-channels)
- [업데이트](/ko/install/updating)
- [CLI 참조](/ko/cli)
