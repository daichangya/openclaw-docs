---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하는 중입니다.
summary: CI 작업 그래프, 범위 게이트 및 이에 대응하는 로컬 명령어
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-24T06:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 스마트 범위 지정 기능을 사용해 변경 사항이 관련 없는 영역에만 있을 때는 비용이 큰 작업을 건너뜁니다.

QA Lab에는 메인 스마트 범위 지정 워크플로 바깥의 전용 CI 레인이 있습니다. `Parity gate` 워크플로는 일치하는 PR 변경 사항과 수동 dispatch에서 실행되며, 비공개 QA 런타임을 빌드하고 mock GPT-5.4 및 Opus 4.6 agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤과 수동 dispatch에서 실행되며, mock parity gate, live Matrix 레인, live Telegram 레인을 병렬 작업으로 fan-out합니다. live 작업은 `qa-live-shared` environment를 사용하며, Telegram 레인은 Convex lease를 사용합니다. `OpenClaw Release Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

`Duplicate PRs After Merge` 워크플로는 머지 후 중복 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에 landed PR이 머지되었는지, 각 중복 PR에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지 확인합니다.

`Docs Agent` 워크플로는 최근 반영된 변경 사항과 기존 문서를 맞추기 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있고, 수동 dispatch로 직접 실행할 수도 있습니다. workflow-run 호출은 `main`이 이미 더 आगे로 진행되었거나 지난 1시간 내에 skip되지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전의 skip되지 않은 Docs Agent source SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 1시간에 한 번 실행으로 마지막 문서 패스 이후 누적된 모든 `main` 변경 사항을 다룰 수 있습니다.

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있지만, 같은 UTC 날짜에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 dispatch는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 유지하는 작은 테스트 성능 수정만 하도록 하며, 이후 전체 스위트 보고서를 다시 실행해 통과 기준선 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있고, 에이전트 이후 전체 스위트 보고서는 무엇이든 커밋되기 전에 반드시 통과해야 합니다. 봇 push가 반영되기 전에 `main`이 आगे로 진행되면, 이 레인은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 후 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. GitHub-hosted Ubuntu를 사용하므로 Codex action이 docs agent와 동일한 drop-sudo 안전 태세를 유지할 수 있습니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 작업 개요

| Job                              | 목적                                                                                         | 실행 시점                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | docs 전용 변경, 변경된 범위, 변경된 extension 감지 및 CI manifest 빌드                       | 드래프트가 아닌 모든 push 및 PR     |
| `security-scm-fast`              | `zizmor`를 통한 비공개 키 탐지 및 워크플로 감사                                               | 드래프트가 아닌 모든 push 및 PR     |
| `security-dependency-audit`      | npm advisory에 대한 의존성 없는 프로덕션 lockfile 감사                                       | 드래프트가 아닌 모든 push 및 PR     |
| `security-fast`                  | 빠른 보안 작업의 필수 집계                                            | 드래프트가 아닌 모든 push 및 PR     |
| `build-artifacts`                | `dist/`, Control UI, 빌드 산출물 검사 및 재사용 가능한 다운스트림 산출물 빌드               | Node 관련 변경                      |
| `checks-fast-core`               | 번들/Plugin 계약/프로토콜 검사 같은 빠른 Linux 정합성 레인                                  | Node 관련 변경                      |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과를 가진 샤딩된 채널 계약 검사                                          | Node 관련 변경                      |
| `checks-node-extensions`         | extension 스위트 전반의 전체 번들 Plugin 테스트 샤드                                         | Node 관련 변경                      |
| `checks-node-core-test`          | 채널, 번들, 계약, extension 레인을 제외한 코어 Node 테스트 샤드                              | Node 관련 변경                      |
| `extension-fast`                 | 변경된 번들 Plugin에 대해서만 수행하는 집중 테스트                                            | extension 변경이 있는 pull request  |
| `check`                          | 샤딩된 메인 로컬 게이트 대응: 프로덕션 타입, lint, 가드, 테스트 타입, 엄격한 스모크          | Node 관련 변경                      |
| `check-additional`               | 아키텍처, 경계, extension 표면 가드, 패키지 경계, gateway-watch 샤드                         | Node 관련 변경                      |
| `build-smoke`                    | 빌드된 CLI 스모크 테스트 및 startup-memory 스모크                                             | Node 관련 변경                      |
| `checks`                         | 빌드 산출물 채널 테스트용 검증기 + push 전용 Node 22 호환성                                  | Node 관련 변경                      |
| `check-docs`                     | 문서 포맷팅, lint, 깨진 링크 검사                                                             | docs 변경                           |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                            | Python-skill 관련 변경              |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                       | Windows 관련 변경                   |
| `macos-node`                     | 공유 빌드 산출물을 사용하는 macOS TypeScript 테스트 레인                                     | macOS 관련 변경                     |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드 및 테스트                                                         | macOS 관련 변경                     |
| `android`                        | 두 flavor에 대한 Android 단위 테스트 + 하나의 debug APK 빌드                                 | Android 관련 변경                   |
| `test-performance-agent`         | 신뢰된 활동 이후의 일일 Codex 느린 테스트 최적화                                               | 메인 CI 성공 또는 수동 dispatch     |

## Fail-Fast 순서

작업은 값싼 검사가 값비싼 작업보다 먼저 실패하도록 정렬되어 있습니다.

1. `preflight`가 어떤 레인이 아예 존재하는지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 step입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 산출물 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 다운스트림 소비자가 시작할 수 있습니다.
4. 이후 더 무거운 플랫폼 및 런타임 레인이 fan-out합니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
CI 워크플로 수정은 Node CI 그래프와 워크플로 linting을 검증하지만, 그것만으로 Windows, Android, macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 여전히 플랫폼 소스 변경에만 범위 지정됩니다.
Windows Node 검사는 Windows 전용 프로세스/경로 래퍼, npm/pnpm/UI 러너 헬퍼, 패키지 관리자 config, 그리고 해당 레인을 실행하는 CI 워크플로 표면에만 범위 지정됩니다. 관련 없는 소스, Plugin, install-smoke, 테스트 전용 변경은 Linux Node 레인에 남아 일반 테스트 샤드로 이미 커버되는 검증을 위해 16-vCPU Windows 워커를 예약하지 않도록 합니다.
별도의 `install-smoke` 워크플로도 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 이 워크플로는 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다. pull request는 Docker/패키지 표면, 번들 Plugin 패키지/manifest 변경, 그리고 Docker 스모크 작업이 다루는 코어 Plugin/채널/gateway/Plugin SDK 표면에 대해 빠른 경로를 실행합니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, docs 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 검사하고, 컨테이너 gateway-network e2e를 실행하고, 번들 extension build arg를 검증하며, 120초 명령 타임아웃 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 전체 경로는 야간 스케줄 실행, 수동 dispatch, workflow-call 릴리스 검사, 그리고 실제로 installer/package/Docker 표면을 건드리는 pull request에 대해 QR 패키지 설치 및 installer Docker/update 커버리지를 유지합니다. merge commit을 포함한 `main` push는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 push에서 전체 커버리지를 요청하더라도 워크플로는 빠른 Docker 스모크만 유지하고 전체 install smoke는 야간 또는 릴리스 검증에 맡깁니다. 느린 Bun 글로벌 설치 image-provider 스모크는 `run_bun_global_install_smoke`에 의해 별도로 게이트됩니다. 이는 야간 스케줄과 릴리스 검사 워크플로에서 실행되며, 수동 `install-smoke` dispatch는 이를 선택적으로 켤 수 있지만 pull request와 `main` push에서는 실행되지 않습니다. QR 및 installer Docker 테스트는 각자의 설치 중심 Dockerfile을 유지합니다. 로컬 `test:docker:all`은 하나의 공유 live-test 이미지와 하나의 공유 `scripts/e2e/Dockerfile` built-app 이미지를 미리 빌드한 뒤 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E 스모크 레인을 병렬 실행합니다. 기본 main-pool 동시성 8은 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로, provider 민감 tail-pool 동시성 8은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`으로 조정할 수 있습니다. 로컬 집계는 기본적으로 첫 실패 후 새로운 pooled 레인 스케줄링을 중단하며, 각 레인에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있는 120분 타임아웃이 있습니다. 재사용 가능한 live/E2E 워크플로는 Docker 매트릭스 전에 하나의 SHA 태그 GHCR Docker E2E 이미지를 빌드하고 푸시한 뒤 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 매트릭스를 실행하는 동일한 공유 이미지 패턴을 따릅니다. 스케줄된 live/E2E 워크플로는 전체 릴리스 경로 Docker 스위트를 매일 실행합니다. 전체 번들 update/channel 매트릭스는 반복적인 실제 npm update 및 doctor repair 패스를 수행하므로 수동/전체 스위트로 유지됩니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있고 `scripts/check-changed.mjs`가 이를 실행합니다. 이 로컬 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다. 코어 프로덕션 변경은 코어 프로덕션 typecheck와 코어 테스트를 실행하고, 코어 테스트 전용 변경은 코어 테스트 typecheck/tests만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension 테스트 전용 변경은 extension 테스트 typecheck/tests만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 이러한 코어 계약에 의존하므로 extension 검증까지 확장됩니다. 릴리스 메타데이터 전용 버전 bump는 대상 버전/config/root-dependency 검사만 실행합니다. 알 수 없는 루트/config 변경은 안전하게 모든 레인으로 확장됩니다.

push에서는 `checks` 매트릭스가 push 전용 `compat-node22` 레인을 추가합니다. pull request에서는 이 레인이 건너뛰어지고, 매트릭스는 일반 테스트/채널 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 과도하게 러너를 점유하지 않으면서도 작게 유지되도록 분할 또는 균형 조정되어 있습니다. 채널 계약은 가중치 기반 3개 샤드로 실행되고, 번들 Plugin 테스트는 6개 extension 워커에 균형 배치되며, 작은 코어 유닛 레인은 서로 짝지어집니다. auto-reply는 6개의 작은 워커 대신 균형 잡힌 3개 워커로 실행되고, agentic gateway/Plugin config는 빌드 산출물을 기다리는 대신 기존 소스 전용 agentic Node 작업 전반에 분산됩니다. 광범위한 브라우저, QA, 미디어 및 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. extension 샤드 작업은 플러그인 config 그룹을 하나의 Vitest 워커와 더 큰 Node 힙으로 직렬 실행하므로, import가 많은 Plugin 배치가 작은 CI 러너를 과도하게 점유하지 않습니다. 광범위한 agents 레인은 단일 느린 테스트 파일이 지배하는 구조가 아니라 import/스케줄링 지배적이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 공유 런타임 샤드가 tail을 떠안지 않도록 infra core-runtime 샤드와 함께 실행됩니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고, 런타임 토폴로지 아키텍처를 gateway watch 커버리지와 분리합니다. boundary guard 샤드는 작은 독립 가드를 하나의 작업 안에서 동시 실행합니다. Gateway watch, 채널 테스트, 코어 support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되어, 기존 check 이름은 가벼운 verifier 작업으로 유지하면서 추가 Blacksmith 워커 2개와 두 번째 artifact-consumer 대기열을 피합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 뒤 Play debug APK를 빌드합니다. third-party flavor에는 별도의 소스 세트나 manifest가 없지만, 해당 유닛 테스트 레인은 여전히 SMS/통화 기록 BuildConfig 플래그를 사용해 그 flavor를 컴파일하면서도 Android 관련 모든 push마다 중복 debug APK 패키징 작업은 피합니다.
`extension-fast`는 push 실행이 이미 전체 번들 Plugin 샤드를 수행하므로 PR 전용입니다. 이렇게 하면 리뷰용 변경 Plugin 피드백은 유지하면서 `main`에서 이미 `checks-node-extensions`에 포함된 커버리지를 위해 추가 Blacksmith 워커를 예약하지 않게 됩니다.

GitHub는 같은 PR 또는 `main` ref에 더 새로운 push가 들어오면 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref에 대한 최신 실행도 실패하는 경우가 아니라면 이를 CI 잡음으로 취급하세요. 집계 샤드 검사는 `!cancelled() && always()`를 사용하므로 일반적인 샤드 실패는 계속 보고하지만, 전체 워크플로가 이미 대체된 후에는 대기열에 들어가지 않습니다.
CI 동시성 키는 버전 관리됩니다(`CI-v7-*`). 따라서 이전 큐 그룹의 GitHub 측 좀비 항목이 새로운 main 실행을 무기한 차단할 수 없습니다.

## 러너

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 verifier, docs 검사, Python Skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub-hosted Ubuntu를 사용하므로 Blacksmith 매트릭스를 더 일찍 큐잉할 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`. 이 작업은 여전히 CPU 민감도가 높아 8 vCPU가 절약한 것보다 비용이 더 컸습니다. install-smoke Docker 빌드도 포함되며, 여기서 32-vCPU는 절약보다 큐 시간 비용이 더 컸습니다                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; 포크는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; 포크는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                            |

## 로컬 대응 명령

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경 typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 가드
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 포맷 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
node scripts/ci-run-timings.mjs <run-id>      # 전체 시간, 대기 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 관련

- [설치 개요](/ko/install)
- [릴리스 채널](/ko/install/development-channels)
