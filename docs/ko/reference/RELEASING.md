---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있습니다
    - 버전 명명 및 주기를 찾고 있습니다
summary: 공개 릴리스 채널, 버전 명명, 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-21T06:08:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# 릴리스 정책

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시되는 태그 릴리스이며, 명시적으로 요청된 경우 npm `latest`에 게시됨
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동 중인 최신 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일은 0으로 채우지 않습니다
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 나중에 검증된 beta 빌드를 승격할 수 있습니다
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  beta 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 stable에 예약됩니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 이후에만 뒤따릅니다
- 유지 관리자는 일반적으로 현재 `main`에서 생성한
  `release/YYYY.M.D` 브랜치에서 릴리스를 자르므로, 릴리스 검증과 수정이
  `main`의 새 개발을 막지 않습니다
- beta 태그가 이미 푸시되었거나 게시되었는데 수정이 필요하면, 유지 관리자는
  기존 beta 태그를 삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 생성합니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는
  유지 관리자 전용입니다

## 릴리스 사전 점검

- 더 빠른 로컬 `pnpm check` 게이트 밖에서도 테스트 TypeScript가 계속
  커버되도록 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행합니다
- 더 빠른 로컬 게이트 밖에서도 더 광범위한 import cycle 및
  아키텍처 경계 검사가 통과되도록 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행합니다
- pack 검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이
  존재하도록 `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행합니다
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행합니다
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- 교차 OS 설치 및 업그레이드 런타임 검증은
  비공개 호출자 워크플로
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서
  디스패치되며, 이 워크플로는 재사용 가능한 공개 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`를 호출합니다
- 이 분리는 의도된 것입니다: 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 더 느린 라이브 검사는 별도 레인에 두어
  게시를 지연시키거나 막지 않게 합니다
- 릴리스 검사는 `main` 워크플로 ref 또는
  `release/YYYY.M.D` 워크플로 ref에서 디스패치되어야 하며, 그래야 워크플로 로직과 시크릿이
  통제된 상태로 유지됩니다
- 해당 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 워크플로 브랜치 커밋 SHA를 받습니다
- 커밋 SHA 모드에서는 현재 워크플로 브랜치 HEAD만 허용합니다. 이전 릴리스 커밋에는
  릴리스 태그를 사용하세요
- `OpenClaw NPM Release` 검증 전용 사전 점검도
  푸시된 태그 없이 현재 전체 40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 해당 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 확인용으로만
  `v<package.json version>`을 합성합니다. 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 게시와 승격 경로는 GitHub 호스팅
  러너에서 유지하고, 변경하지 않는 검증 경로만 더 큰
  Blacksmith Linux 러너를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 시크릿 둘 다 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 해당 beta/수정 태그)를 실행합니다
- npm 게시 후에는 새 임시 prefix에서 게시된 레지스트리
  설치 경로를 확인하기 위해
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 해당 beta/수정 버전)를 실행합니다
- 유지 관리자 릴리스 자동화는 이제 preflight-then-promote를 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 반드시 필요합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 동일한 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - stable npm 릴리스의 기본 대상은 `beta`입니다
  - stable npm 게시는 워크플로 입력으로 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 위치합니다. 보안 때문입니다. `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하지만
    공개 저장소는 OIDC 전용 게시를 유지하기 때문입니다
  - 공개 `macOS Release`는 검증 전용입니다
  - 실제 비공개 mac 게시에는 성공한 비공개 mac
    `preflight_run_id` 및 `validate_run_id`가 필요합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하는 대신
    준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우, 게시 후 검증기는
  동일한 임시 prefix 업그레이드 경로인 `YYYY.M.D`에서 `YYYY.M.D-N`도 확인하여,
  릴리스 수정이 이전 전역 설치를 기본 stable 페이로드에
  조용히 남겨두지 못하게 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과
  비어 있지 않은 `dist/control-ui/assets/` 페이로드가 모두 포함되지 않으면
  안전하게 실패 처리되므로, 빈 브라우저 대시보드를 다시 배포하지 않습니다
- `pnpm test:install:smoke`도 후보 업데이트 tarball의 npm pack
  `unpackedSize` 예산을 강제하므로, 설치 프로그램 e2e가 릴리스 게시 경로 전에
  실수로 pack이 비대해진 것을 잡아냅니다
- 릴리스 작업이 CI 계획, 확장 타이밍 매니페스트, 또는
  확장 테스트 매트릭스를 건드렸다면, 승인 전에 `.github/workflows/ci.yml`의
  planner 소유 `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하세요.
  그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않게 됩니다
- Stable macOS 릴리스 준비 상태에는 업데이터 표면도 포함됩니다:
  - GitHub 릴리스에는 패키지된 `.zip`, `.dmg`, `.dSYM.zip`이 포함되어야 합니다
  - `main`의 `appcast.xml`은 게시 후 새 stable zip을 가리켜야 합니다
  - 패키지된 앱은 디버그가 아닌 번들 ID, 비어 있지 않은 Sparkle 피드
    URL, 그리고 해당 릴리스 버전에 대한 표준 Sparkle 빌드 하한 이상인
    `CFBundleVersion`을 유지해야 합니다

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1`,
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다. `preflight_only=true`일 때는 검증 전용 사전 점검을 위해
  현재 전체 40자 워크플로 브랜치 커밋 SHA도 사용할 수 있습니다
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 게시 경로면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가
  성공한 사전 점검 실행에서 준비된 tarball을 재사용하게 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그이며 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다:

- `ref`: 기존 릴리스 태그 또는 `main`에서 디스패치할 때 검증할 현재 전체 40자 `main` 커밋
  SHA입니다. 릴리스 브랜치에서는 기존 릴리스 태그 또는
  현재 전체 40자 릴리스 브랜치 커밋 SHA를 사용합니다

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 어느 쪽에도 게시될 수 있습니다
- Beta 프리릴리스 태그는 `beta`에만 게시될 수 있습니다
- `OpenClaw NPM Release`에서 전체 커밋 SHA 입력은
  `preflight_only=true`일 때만 허용됩니다
- `OpenClaw Release Checks`는 항상 검증 전용이며,
  현재 워크플로 브랜치 커밋 SHA도 받습니다
- 릴리스 검사 커밋 SHA 모드는 현재 워크플로 브랜치 HEAD도 요구합니다
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며,
  워크플로는 게시를 계속하기 전에 해당 메타데이터를 검증합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 자를 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 사전 점검 워크플로의 검증 전용 드라이런을 위해
     현재 전체 워크플로 브랜치 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고,
   의도적으로 직접 stable 게시를 원할 때만 `latest`를 선택합니다
3. 라이브 프롬프트 캐시
   커버리지가 필요하면 같은 태그 또는
   현재 전체 워크플로 브랜치 커밋 SHA로 `OpenClaw Release Checks`를 별도로 실행합니다
   - 이것을 분리한 것은 의도된 것으로, 라이브 커버리지를 계속 사용할 수 있게 하면서도
     오래 걸리거나 불안정한 검사를 게시 워크플로에 다시 결합하지 않기 위함입니다
4. 성공한 `preflight_run_id`를 저장합니다
5. `preflight_only=false`, 동일한
   `tag`, 동일한 `npm_dist_tag`, 저장한 `preflight_run_id`로 `OpenClaw NPM Release`를 다시 실행합니다
6. 릴리스가 `beta`에 도달했다면, 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 stable 버전을 `beta`에서 `latest`로 승격합니다
7. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`가
   즉시 동일한 stable 빌드를 따라야 한다면, 동일한 비공개
   워크플로를 사용해 두 dist-tag 모두를 stable 버전으로 가리키게 하거나,
   예약된 self-healing sync가 나중에 `beta`를 이동하도록 둡니다

dist-tag 변경은 보안상 비공개 저장소에 있습니다. 여전히
`NPM_TOKEN`이 필요하기 때문이며, 공개 저장소는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두
문서화되고 운영자에게 표시됩니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지 관리자는 실제 런북으로
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
의 비공개 릴리스 문서를 사용합니다.
