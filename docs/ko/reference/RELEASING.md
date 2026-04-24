---
read_when:
    - 공개 릴리스 채널 정의를 찾는 경우
    - 버전 명명 및 주기를 찾는 경우
summary: 공개 릴리스 채널, 버전 명명, 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-24T06:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다.

- stable: 기본적으로 npm `beta`에 게시되는 태그 릴리스이며, 명시적으로 요청하면 npm `latest`에도 게시 가능
- beta: npm `beta`에 게시되는 prerelease 태그
- dev: `main`의 이동하는 최신 상태

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta prerelease 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월 또는 일은 0으로 채우지 않음
- `latest`는 현재 승격된 stable npm 릴리스를 의미
- `beta`는 현재 beta 설치 대상을 의미
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 나중에 검증된 beta 빌드를 승격할 수 있습니다
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  beta 릴리스는 일반적으로 먼저 npm/package 경로를 검증 및 게시하고,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 stable에 예약됩니다

## 릴리스 주기

- 릴리스는 beta-first로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 뒤따릅니다
- 유지 관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D`
  브랜치에서 릴리스를 자릅니다. 이렇게 하면 릴리스 검증 및 수정이 `main`의 새
  개발을 막지 않습니다
- beta 태그가 이미 push 또는 publish되었는데 수정이 필요하면, 유지 관리자는
  기존 beta 태그를 삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 자릅니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는 유지 관리자 전용입니다

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행해
  더 빠른 로컬 `pnpm check` 게이트 밖에서도 테스트 TypeScript가 계속
  커버되도록 하세요
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행해 더 넓은 import
  cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 녹색인지 확인하세요
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행해
  pack
  검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 하세요
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행하세요
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity 게이트와
  라이브 Matrix 및 Telegram QA 레인도 실행합니다. 라이브 레인은
  `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 lease도 사용합니다.
- 크로스 OS 설치 및 업그레이드 런타임 검증은
  private caller 워크플로
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서 디스패치되며,
  이는 재사용 가능한 public 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`를 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 더 느린 라이브 검사는
  별도 레인에 두어 publish를 지연시키거나 차단하지 않게 합니다
- 릴리스 검사는 `main` 워크플로 ref 또는
  `release/YYYY.M.D` 워크플로 ref에서 디스패치되어야 하며, 그래야 워크플로 로직과 비밀이
  통제 상태를 유지합니다
- 해당 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 워크플로 브랜치 커밋 SHA 중 하나를 받을 수 있습니다
- 커밋 SHA 모드에서는 현재 워크플로 브랜치 HEAD만 허용되며,
  오래된 릴리스 커밋에는 릴리스 태그를 사용해야 합니다
- `OpenClaw NPM Release` 검증 전용 사전 점검도 push된 태그 없이
  현재 전체 40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 해당 SHA 경로는 검증 전용이며 실제 publish로 승격될 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 검사용으로만
  `v<package.json version>`을 합성하며, 실제 publish에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 publish 및 승격 경로는 GitHub-hosted
  runner에 유지하고, 변경이 없는 검증 경로는 더 큰
  Blacksmith Linux runner를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` 워크플로 비밀과 함께 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 해당 beta/수정 태그)를 실행하세요
- npm publish 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 해당 beta/수정 버전)를 실행해 새 임시 prefix에서
  게시된 registry 설치 경로를 검증하세요
- beta publish 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  를 실행해 게시된 npm 패키지에 대해 설치된 패키지 온보딩, Telegram 설정, 실제 Telegram E2E를 검증하세요.
- 유지 관리자 릴리스 자동화는 이제 preflight-then-promote를 사용합니다.
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 함
  - 실제 npm publish는 성공한 preflight 실행과 같은 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 함
  - stable npm 릴리스의 기본 대상은 `beta`
  - stable npm publish는 워크플로 입력을 통해 명시적으로 `latest`를 대상으로 지정할 수 있음
  - token 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 존재하며, `npm dist-tag add`는 여전히 `NPM_TOKEN`이 필요하기 때문에 보안상 private repo로 이동했습니다. public repo는 OIDC-only publish를 유지합니다
  - public `macOS Release`는 검증 전용
  - 실제 private mac publish는 성공한 private mac
    `preflight_run_id` 및 `validate_run_id`를 통과해야 함
  - 실제 publish 경로는 아티팩트를 다시 빌드하는 대신 준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우 post-publish verifier는
  `YYYY.M.D`에서 `YYYY.M.D-N`으로의 같은 temp-prefix 업그레이드 경로도 검사하므로,
  릴리스 수정이 이전 전역 설치를 기본 stable payload에 조용히 남겨두지 못합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되지 않으면
  안전하게 실패하므로, 빈 브라우저 dashboard를 다시 배포하지 않습니다
- Post-publish 검증은 게시된 registry 설치에 루트 `dist/*`
  레이아웃 아래 비어 있지 않은 번들 Plugin 런타임 의존성이 포함되는지도 확인합니다. 누락되었거나 비어 있는 번들 Plugin
  의존성 payload와 함께 배포된 릴리스는 postpublish verifier에서 실패하며
  `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`도 후보 업데이트 tarball의 npm pack `unpackedSize` 예산을 강제하므로,
  installer e2e가 릴리스 publish 경로 전에 우발적인 pack 팽창을 잡아냅니다
- 릴리스 작업이 CI 계획, extension timing manifest, 또는
  extension 테스트 매트릭스를 건드렸다면 승인 전에 `.github/workflows/ci.yml`의 planner 소유
  `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하세요. 그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않게 됩니다
- stable macOS 릴리스 준비에는 updater 표면도 포함됩니다.
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 포함되어야 함
  - `main`의 `appcast.xml`은 publish 후 새 stable zip을 가리켜야 함
  - 패키징된 앱은 debug가 아닌 bundle id, 비어 있지 않은 Sparkle feed
    URL, 그리고 해당 릴리스 버전에 대한 정식 Sparkle 빌드 바닥값 이상인 `CFBundleVersion`을 유지해야 함

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다.

- `tag`: 필수 릴리스 태그. 예: `v2026.4.2`, `v2026.4.2-1`, 또는
  `v2026.4.2-beta.1`; `preflight_only=true`일 때는 검증 전용 사전 점검을 위해
  현재 전체 40자 워크플로 브랜치 커밋 SHA도 될 수 있음
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 publish 경로면 `false`
- `preflight_run_id`: 실제 publish 경로에서 필수. 워크플로가
  성공한 preflight 실행의 준비된 tarball을 재사용하도록 함
- `npm_dist_tag`: publish 경로의 npm 대상 태그. 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다.

- `ref`: 기존 릴리스 태그 또는 `main`에서 디스패치될 때 검증할 현재 전체 40자 `main` 커밋
  SHA; 릴리스 브랜치에서는
  기존 릴리스 태그 또는 현재 전체 40자 릴리스 브랜치 커밋
  SHA 사용

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 중 어느 쪽으로든 publish 가능
- Beta prerelease 태그는 `beta`로만 publish 가능
- `OpenClaw NPM Release`에서는 전체 커밋 SHA 입력은
  `preflight_only=true`일 때만 허용됨
- `OpenClaw Release Checks`는 항상 검증 전용이며 현재
  워크플로 브랜치 커밋 SHA도 받을 수 있음
- 릴리스 검사 커밋 SHA 모드도 현재 워크플로 브랜치 HEAD를 요구함
- 실제 publish 경로는 preflight 중 사용한 것과 같은 `npm_dist_tag`를 사용해야 하며,
  워크플로는 publish가 계속되기 전에 해당 메타데이터를 검증합니다

## Stable npm 릴리스 순서

stable npm 릴리스를 자를 때:

1. `preflight_only=true`로 `OpenClaw NPM Release` 실행
   - 태그가 아직 존재하지 않으면 현재 전체 워크플로 브랜치 커밋
     SHA로 사전 점검 워크플로의 검증 전용 dry run 가능
2. 일반적인 beta-first 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 stable publish를 원할 때만 `latest`를 선택
3. 라이브 prompt cache,
   QA Lab parity, Matrix, Telegram 커버리지가 필요하면 별도로 `OpenClaw Release Checks`를 같은 태그 또는
   현재 전체 워크플로 브랜치 커밋 SHA로 실행
   - 라이브 커버리지를 유지하면서 publish 워크플로에
     긴 시간이나 flaky 체크를 다시 묶지 않기 위해 의도적으로 분리되어 있습니다
4. 성공한 `preflight_run_id` 저장
5. `preflight_only=false`, 같은
   `tag`, 같은 `npm_dist_tag`, 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 다시 실행
6. 릴리스가 `beta`에 게시되었다면 private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 stable 버전을 `beta`에서 `latest`로 승격
7. 릴리스가 의도적으로 직접 `latest`에 게시되었고 `beta`도
   동일한 stable 빌드를 즉시 따라가야 한다면, 같은 private
   워크플로를 사용해 두 dist-tag를 stable 버전으로 가리키게 하거나, 예약된
   self-healing sync가 나중에 `beta`를 이동하게 두세요

dist-tag 변경이 private repo에 있는 이유는 여전히
`NPM_TOKEN`이 필요하기 때문이며, public repo는 OIDC-only publish를 유지합니다.

이렇게 하면 직접 publish 경로와 beta-first 승격 경로가 모두
문서화되고 운영자에게도 명확하게 보입니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지 관리자는 실제 runbook에 대해
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
의 private release 문서를 사용합니다.

## 관련 항목

- [Release channels](/ko/install/development-channels)
