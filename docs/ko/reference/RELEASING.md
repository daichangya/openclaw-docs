---
read_when:
    - 공개 릴리스 채널 정의를 찾는 경우
    - 버전 명명과 출시 주기를 찾는 경우
summary: 공개 릴리스 채널, 버전 명명, 그리고 출시 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-23T06:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# 릴리스 정책

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다.

- stable: 태그된 릴리스이며 기본적으로 npm `beta`에 게시되고, 명시적으로 요청된 경우 npm `latest`에 게시됩니다
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일은 0으로 패딩하지 마세요
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있습니다
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  beta 릴리스는 일반적으로 먼저 npm/package 경로를 검증 및 게시하고,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 stable에 예약됩니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 이어집니다
- 유지보수자는 일반적으로 현재 `main`에서 생성된 `release/YYYY.M.D`
  브랜치에서 릴리스를 컷하므로, 릴리스 검증과 수정이 `main`의 새
  개발을 막지 않습니다
- Beta 태그가 이미 push되었거나 게시되었고 수정이 필요하면, 유지보수자는
  기존 beta 태그를 삭제하거나 다시 만드는 대신 다음 `-beta.N` 태그를 컷합니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는
  유지보수자 전용입니다

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가
  더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 커버되도록 하세요
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import
  cycle 및 아키텍처 경계 점검이 더 빠른 로컬 게이트 밖에서도 green 상태인지 확인하세요
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack
  검증 단계에 필요한 예상 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 하세요
- 모든 태그된 릴리스 전에 `pnpm release:check`를 실행하세요
- 릴리스 점검은 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity gate와 live
  Matrix 및 Telegram QA 레인도 실행합니다. live 레인은
  `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 lease도 사용합니다.
- 크로스 OS 설치 및 업그레이드 런타임 검증은
  비공개 호출자 워크플로
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서 디스패치되며,
  재사용 가능한 공개 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  를 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 더 느린 live 점검은 자체
  레인에 두어 게시를 지연시키거나 막지 않도록 합니다
- 릴리스 점검은 `main` 워크플로 ref 또는
  `release/YYYY.M.D` 워크플로 ref에서 디스패치되어야 하며, 이렇게 해야 워크플로 로직과 시크릿이
  통제된 상태로 유지됩니다
- 해당 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 커밋 SHA 모드에서는 현재 워크플로 브랜치 HEAD만 허용합니다.
  더 이전 릴리스 커밋에는 릴리스 태그를 사용하세요
- `OpenClaw NPM Release`의 검증 전용 사전 점검도
  push된 태그 없이 현재 전체 40자 워크플로 브랜치 커밋 SHA를 허용합니다
- 해당 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 점검을 위해서만
  `v<package.json version>`을 합성합니다. 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 게시와 승격 경로는 GitHub 호스팅
  runners에서 유지하고, 상태를 바꾸지 않는 검증 경로는 더 큰
  Blacksmith Linux runners를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` 워크플로 시크릿 모두를 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 점검 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 일치하는 beta/수정 태그)를 실행하세요
- npm 게시 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 일치하는 beta/수정 버전)를 실행하여 새 temp prefix에서 게시된 레지스트리
  설치 경로를 검증하세요
- 유지보수자 릴리스 자동화는 이제 사전 점검 후 승격 방식을 사용합니다:
  - 실제 npm 게시는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 동일한 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - stable npm 릴리스의 기본 대상은 `beta`입니다
  - stable npm 게시는 워크플로 입력으로 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 있으며, 보안을 위한 것입니다. `npm dist-tag add`는 여전히 `NPM_TOKEN`이 필요하지만,
    공개 repo는 OIDC 전용 게시를 유지하기 때문입니다
  - 공개 `macOS Release`는 검증 전용입니다
  - 실제 비공개 mac 게시는 성공한 비공개 mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 게시 경로는 준비된 아티팩트를 다시 빌드하는 대신 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우, 게시 후 검증기는
  동일한 temp-prefix 업그레이드 경로를 `YYYY.M.D`에서 `YYYY.M.D-N`으로도 점검하여
  릴리스 수정이 오래된 전역 설치를 기본 stable payload에
  조용히 남겨두지 못하도록 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은
  `dist/control-ui/assets/` payload가 모두 포함되지 않으면 실패로 닫히므로,
  빈 브라우저 대시보드를 다시 배포하지 않게 합니다
- `pnpm test:install:smoke`는 후보 업데이트 tarball의 npm pack `unpackedSize`
  예산도 강제하므로, installer e2e가 릴리스 게시 경로 전에
  의도치 않은 pack 비대화를 포착합니다
- 릴리스 작업이 CI 계획, extension 타이밍 매니페스트, 또는
  extension 테스트 매트릭스를 건드렸다면, 승인 전에
  `.github/workflows/ci.yml`의 플래너 소유
  `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하여
  릴리스 노트가 오래된 CI 레이아웃을 설명하지 않도록 하세요
- Stable macOS 릴리스 준비 상태에는 updater 표면도 포함됩니다:
  - GitHub 릴리스에는 패키지된 `.zip`, `.dmg`, `.dSYM.zip`이 있어야 합니다
  - 게시 후 `main`의 `appcast.xml`은 새 stable zip을 가리켜야 합니다
  - 패키지된 앱은 디버그가 아닌 bundle id, 비어 있지 않은 Sparkle feed
    URL, 그리고 해당 릴리스 버전에 대한 정식 Sparkle 빌드 하한 이상인 `CFBundleVersion`을
    유지해야 합니다

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다.

- `tag`: 필수 릴리스 태그. 예: `v2026.4.2`, `v2026.4.2-1`, 또는
  `v2026.4.2-beta.1`; `preflight_only=true`일 때는 검증 전용 사전 점검을 위해
  현재 전체 40자 워크플로 브랜치 커밋 SHA일 수도 있습니다
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로는 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가
  성공한 사전 점검 실행에서 준비된 tarball을 재사용하도록 합니다
- `npm_dist_tag`: 게시 경로용 npm 대상 태그. 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다.

- `ref`: 기존 릴리스 태그 또는 `main`에서 디스패치될 때 검증할
  현재 전체 40자 `main` 커밋 SHA.
  릴리스 브랜치에서는 기존 릴리스 태그 또는 현재 전체 40자 릴리스 브랜치 커밋
  SHA를 사용합니다

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 어느 쪽에도 게시될 수 있습니다
- Beta 프리릴리스 태그는 `beta`에만 게시될 수 있습니다
- `OpenClaw NPM Release`에서 전체 커밋 SHA 입력은
  `preflight_only=true`일 때만 허용됩니다
- `OpenClaw Release Checks`는 항상 검증 전용이며
  현재 워크플로 브랜치 커밋 SHA도 허용합니다
- 릴리스 점검 커밋 SHA 모드도 현재 워크플로 브랜치 HEAD를 요구합니다
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며,
  워크플로는 게시가 계속되기 전에 해당 메타데이터를 검증합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 컷할 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 아직 없으면, 사전 점검 워크플로의 검증 전용 드라이 런을 위해
     현재 전체 워크플로 브랜치 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 직접 stable 게시를
   의도적으로 원할 때만 `latest`를 선택합니다
3. live 프롬프트 캐시,
   QA Lab parity, Matrix, Telegram 커버리지를 원하면
   같은 태그 또는 현재 전체 워크플로 브랜치 커밋 SHA로
   `OpenClaw Release Checks`를 별도로 실행합니다
   - 이는 의도적인 분리입니다. live 커버리지를 계속 사용할 수 있게 하면서도
     오래 걸리거나 불안정한 점검을 게시 워크플로에 다시 결합하지 않기 위함입니다
4. 성공한 `preflight_run_id`를 저장합니다
5. `preflight_only=false`, 같은
   `tag`, 같은 `npm_dist_tag`, 저장한 `preflight_run_id`로
   `OpenClaw NPM Release`를 다시 실행합니다
6. 릴리스가 `beta`에 올라갔다면, 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용하여 해당 stable 버전을 `beta`에서 `latest`로 승격합니다
7. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도
   즉시 같은 stable 빌드를 따라야 한다면, 같은 비공개
   워크플로를 사용해 두 dist-tag 모두를 stable 버전으로 가리키게 하거나,
   예약된 self-healing sync가 나중에 `beta`를 이동하게 둘 수 있습니다

dist-tag 변경은 비공개 repo에 있습니다. 보안상 그렇게 한 것입니다.
이는 여전히 `NPM_TOKEN`이 필요하지만, 공개 repo는 OIDC 전용 게시를 유지하기 때문입니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두
문서화되고 운영자에게 보이게 유지됩니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지보수자는 실제 실행 절차를 위해
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
의 비공개 릴리스 문서를 사용합니다.
