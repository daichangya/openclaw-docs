---
read_when:
    - stable/beta/dev 간 전환하고 싶으신 것입니다
    - 특정 버전, 태그 또는 SHA를 pin하고 싶으신 것입니다
    - 프리릴리스를 태깅하거나 게시하고 있습니다
sidebarTitle: Release Channels
summary: 'stable, beta, dev 채널: 의미, 전환, pinning, tagging'
title: 릴리스 채널
x-i18n:
    generated_at: "2026-04-24T06:20:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# 개발 채널

OpenClaw는 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`. 대부분의 사용자에게 권장됩니다.
- **beta**: 현재 유효한 경우 npm dist-tag `beta`; beta가 없거나
  최신 stable 릴리스보다 오래된 경우 업데이트 흐름은 `latest`로 폴백합니다.
- **dev**: `main`의 이동하는 헤드(git). npm dist-tag: `dev`(게시된 경우).
  `main` 브랜치는 실험과 활발한 개발을 위한 것입니다. 미완성 기능이나
  호환성 깨짐 변경이 포함될 수 있습니다. 프로덕션 Gateway에는 사용하지 마세요.

보통 stable 빌드는 먼저 **beta**에 배포하고, 그곳에서 테스트한 다음,
검증된 빌드를 버전 번호 변경 없이 `latest`로 이동하는
명시적 승격 단계를 실행합니다. 유지 관리자는 필요에 따라 stable 릴리스를
직접 `latest`에 게시할 수도 있습니다. npm 설치에서는 dist-tag가 진실의 원천입니다.

## 채널 전환

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`은 선택 사항을 구성(`update.channel`)에 저장하고 설치 방식을
정렬합니다.

- **`stable`** (패키지 설치): npm dist-tag `latest`를 통해 업데이트합니다.
- **`beta`** (패키지 설치): npm dist-tag `beta`를 우선하지만,
  `beta`가 없거나 현재 stable 태그보다 오래된 경우 `latest`로 폴백합니다.
- **`stable`** (git 설치): 최신 stable git 태그를 체크아웃합니다.
- **`beta`** (git 설치): 최신 beta git 태그를 우선하지만, beta가 없거나 오래된 경우
  최신 stable git 태그로 폴백합니다.
- **`dev`**: git 체크아웃을 보장하고(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의 가능),
  `main`으로 전환하고, upstream에 rebase한 뒤, 빌드하고,
  해당 체크아웃에서 전역 CLI를 설치합니다.

팁: stable + dev를 병렬로 유지하고 싶다면 클론을 두 개 유지하고
Gateway가 stable 쪽을 가리키도록 하세요.

## 일회성 버전 또는 태그 지정

저장된 채널을 변경하지 않고 한 번의
업데이트만 특정 dist-tag, 버전, 또는 패키지 spec으로 지정하려면 `--tag`를 사용하세요.

```bash
# 특정 버전 설치
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag에서 설치(일회성, 저장되지 않음)
openclaw update --tag beta

# GitHub main 브랜치에서 설치(npm tarball)
openclaw update --tag main

# 특정 npm 패키지 spec 설치
openclaw update --tag openclaw@2026.4.1-beta.1
```

참고:

- `--tag`는 **패키지(npm) 설치에만** 적용됩니다. git 설치는 이를 무시합니다.
- 태그는 저장되지 않습니다. 다음 `openclaw update`는 평소처럼
  구성된 채널을 사용합니다.
- 다운그레이드 보호: 대상 버전이 현재 버전보다 오래된 경우,
  OpenClaw는 확인을 요청합니다(`--yes`로 건너뛰기 가능).
- `--channel beta`는 `--tag beta`와 다릅니다. 채널 흐름은 beta가 없거나 오래된 경우
  stable/latest로 폴백할 수 있지만, `--tag beta`는 해당 실행 한 번만
  원시 `beta` dist-tag를 대상으로 합니다.

## 드라이 런

변경을 적용하지 않고 `openclaw update`가 무엇을 할지 미리 봅니다.

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

드라이 런은 유효 채널, 대상 버전, 계획된 작업,
다운그레이드 확인 필요 여부를 보여줍니다.

## Plugins 및 채널

`openclaw update`로 채널을 전환하면 OpenClaw는 Plugin
소스도 동기화합니다.

- `dev`는 git 체크아웃의 번들 Plugins를 우선합니다.
- `stable` 및 `beta`는 npm 설치 Plugin 패키지를 복원합니다.
- npm 설치 Plugins는 코어 업데이트가 완료된 후 업데이트됩니다.

## 현재 상태 확인

```bash
openclaw update status
```

활성 채널, 설치 종류(git 또는 package), 현재 버전,
소스(config, git tag, git branch, 또는 default)를 보여줍니다.

## 태깅 모범 사례

- git 체크아웃이 도달해야 하는 릴리스에는 태그를 붙이세요(stable은 `vYYYY.M.D`,
  beta는 `vYYYY.M.D-beta.N`).
- 호환성을 위해 `vYYYY.M.D.beta.N`도 인식되지만, `-beta.N`을 권장합니다.
- 레거시 `vYYYY.M.D-<patch>` 태그도 stable(non-beta)로 계속 인식됩니다.
- 태그는 불변으로 유지하세요. 태그를 이동하거나 재사용하지 마세요.
- npm 설치에서는 npm dist-tag가 계속 진실의 원천입니다.
  - `latest` -> stable
  - `beta` -> 후보 빌드 또는 beta 우선 stable 빌드
  - `dev` -> main 스냅샷(선택 사항)

## macOS 앱 가용성

beta 및 dev 빌드에는 macOS 앱 릴리스가 **포함되지 않을 수 있습니다**. 이는 괜찮습니다.

- git 태그와 npm dist-tag는 여전히 게시할 수 있습니다.
- 릴리스 노트 또는 changelog에 "이 beta에는 macOS 빌드 없음"을 명시하세요.

## 관련

- [업데이트](/ko/install/updating)
- [설치 프로그램 내부 구조](/ko/install/installer)
