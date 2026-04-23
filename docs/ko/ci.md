---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 파악해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-23T14:55:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. 스마트 범위 지정을 사용해 변경된 영역이 관련 없는 경우 비용이 큰 작업을 건너뜁니다.

QA Lab에는 메인 스마트 범위 워크플로 밖에 전용 CI 레인이 있습니다. `Parity gate` 워크플로는 일치하는 PR 변경 사항과 수동 실행에서 동작하며, 비공개 QA 런타임을 빌드하고 mock GPT-5.4 및 Opus 4.6 agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 실행되고 수동 실행도 가능하며, mock parity gate, live Matrix lane, live Telegram lane을 병렬 작업으로 fan-out합니다. live 작업은 `qa-live-shared` environment를 사용하고, Telegram lane은 Convex lease를 사용합니다. `OpenClaw Release Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

## 작업 개요

| 작업                              | 목적                                                                                         | 실행 시점                             |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                       | docs-only 변경, 변경된 범위, 변경된 extension을 감지하고 CI manifest를 빌드                  | 초안이 아닌 모든 push 및 PR에서 항상 실행 |
| `security-scm-fast`               | `zizmor`를 통한 private key 탐지 및 워크플로 감사                                            | 초안이 아닌 모든 push 및 PR에서 항상 실행 |
| `security-dependency-audit`       | npm advisory에 대한 dependency-free 프로덕션 lockfile 감사                                   | 초안이 아닌 모든 push 및 PR에서 항상 실행 |
| `security-fast`                   | 빠른 보안 작업용 필수 aggregate                                                              | 초안이 아닌 모든 push 및 PR에서 항상 실행 |
| `build-artifacts`                 | `dist/`, Control UI, built-artifact 검사, 재사용 가능한 downstream artifact 빌드             | Node 관련 변경                         |
| `checks-fast-core`                | bundled/plugin-contract/protocol 검사 같은 빠른 Linux 정확성 레인                            | Node 관련 변경                         |
| `checks-fast-contracts-channels`  | 안정적인 aggregate check 결과를 갖는 shard된 channel contract 검사                           | Node 관련 변경                         |
| `checks-node-extensions`          | extension 전체에 대한 전체 bundled-plugin 테스트 shard                                        | Node 관련 변경                         |
| `checks-node-core-test`           | channel, bundled, contract, extension 레인을 제외한 core Node 테스트 shard                   | Node 관련 변경                         |
| `extension-fast`                  | 변경된 bundled plugin만 대상으로 하는 집중 테스트                                            | extension 변경이 있는 pull request     |
| `check`                           | shard된 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, guard, 테스트 타입, strict smoke     | Node 관련 변경                         |
| `check-additional`                | 아키텍처, 경계, extension-surface guard, package-boundary, gateway-watch shard               | Node 관련 변경                         |
| `build-smoke`                     | built-CLI smoke 테스트 및 startup-memory smoke                                               | Node 관련 변경                         |
| `checks`                          | built-artifact channel 테스트와 push 전용 Node 22 호환성에 대한 verifier                     | Node 관련 변경                         |
| `check-docs`                      | 문서 포맷팅, lint, 깨진 링크 검사                                                            | 문서 변경                              |
| `skills-python`                   | Python 기반 Skills용 Ruff + pytest                                                           | Python Skills 관련 변경                |
| `checks-windows`                  | Windows 전용 테스트 레인                                                                      | Windows 관련 변경                      |
| `macos-node`                      | 공유 built artifact를 사용하는 macOS TypeScript 테스트 레인                                  | macOS 관련 변경                        |
| `macos-swift`                     | macOS 앱용 Swift lint, 빌드, 테스트                                                          | macOS 관련 변경                        |
| `android`                         | 두 flavor 모두에 대한 Android 단위 테스트와 하나의 debug APK 빌드                            | Android 관련 변경                      |

## Fail-Fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 지정되어 있습니다.

1. `preflight`가 어떤 레인이 실제로 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립적인 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되어 downstream consumer가 공유 빌드가 준비되는 즉시 시작할 수 있도록 합니다.
4. 그다음 더 무거운 플랫폼 및 런타임 레인이 fan-out됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
CI 워크플로 편집은 Node CI 그래프와 워크플로 linting은 검증하지만, Windows, Android, macOS 네이티브 빌드를 그것만으로 강제하지는 않습니다. 해당 플랫폼 레인은 계속해서 플랫폼 소스 변경에만 범위가 지정됩니다.
Windows Node 검사는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, 패키지 관리자 구성, 그리고 해당 레인을 실행하는 CI 워크플로 표면으로 범위가 지정됩니다. 관련 없는 소스, plugin, install-smoke, test-only 변경은 일반 테스트 shard로 이미 검증되는 범위를 위해 16-vCPU Windows worker를 예약하지 않도록 Linux Node 레인에 남습니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로, Docker/install smoke는 install, packaging, container 관련 변경, bundled extension 프로덕션 변경, 그리고 Docker smoke 작업이 실행하는 core plugin/channel/gateway/Plugin SDK 표면에 대해 실행됩니다. test-only 및 docs-only 편집은 Docker worker를 예약하지 않습니다. 해당 QR package smoke는 Docker `pnpm install` 레이어를 강제로 다시 실행하면서 BuildKit pnpm store 캐시는 유지하므로, 매 실행마다 dependency를 다시 다운로드하지 않으면서도 설치를 계속 검증합니다. gateway-network e2e는 작업 초기에 빌드된 런타임 이미지를 재사용하므로, 또 다른 Docker 빌드를 추가하지 않고 실제 container-to-container WebSocket 범위를 추가합니다. 로컬 `test:docker:all`은 공유 live-test 이미지 하나와 공유 `scripts/e2e/Dockerfile` built-app 이미지 하나를 미리 빌드한 뒤, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E smoke 레인을 병렬 실행합니다. 기본 동시성 4는 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로 조정할 수 있습니다. 로컬 aggregate는 기본적으로 첫 번째 실패 후 새로운 pooled lane 예약을 중단하며, 각 lane에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의 가능한 120분 타임아웃이 있습니다. startup 또는 provider 민감 레인은 병렬 풀 이후에 독점 실행됩니다. 재사용 가능한 live/E2E 워크플로는 Docker 매트릭스 전에 SHA 태그가 붙은 GHCR Docker E2E 이미지를 하나 빌드하고 푸시한 뒤, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 매트릭스를 실행하는 동일한 shared-image 패턴을 따릅니다. 예약된 live/E2E 워크플로는 매일 전체 release-path Docker 제품군을 실행합니다. QR 및 installer Docker 테스트는 각자의 install 중심 Dockerfile을 유지합니다. 별도의 `docker-e2e-fast` 작업은 120초 명령 타임아웃 아래에서 제한된 bundled-plugin Docker 프로필을 실행합니다: setup-entry dependency repair 및 synthetic bundled-loader failure isolation입니다. 전체 bundled update/channel 매트릭스는 반복적인 실제 npm update 및 doctor repair 패스를 수행하므로 수동/전체 제품군으로 유지됩니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`에 의해 실행됩니다. 이 로컬 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다. core 프로덕션 변경은 core 프로덕션 typecheck와 core 테스트를 실행하고, core test-only 변경은 core 테스트 typecheck/테스트만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension test-only 변경은 extension 테스트 typecheck/테스트만 실행합니다. public Plugin SDK 또는 plugin-contract 변경은 extension이 이러한 core contract에 의존하므로 extension 검증까지 확장됩니다. 릴리스 메타데이터 전용 버전 범프는 대상이 좁은 version/config/root-dependency 검사를 실행합니다. 알 수 없는 root/config 변경은 안전하게 모든 레인으로 확장됩니다.

푸시에서는 `checks` 매트릭스가 push 전용 `compat-node22` 레인을 추가합니다. pull request에서는 해당 레인이 건너뛰어지고 매트릭스는 일반 테스트/channel 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 너무 커지지 않도록 분할 또는 균형 조정되어 있으며, 동시에 runner를 과도하게 예약하지 않도록 되어 있습니다. channel contract는 가중치 기반 shard 세 개로 실행되고, bundled plugin 테스트는 여섯 개의 extension worker에 걸쳐 균형 분산되며, 작은 core unit 레인은 짝지어지고, auto-reply는 여섯 개의 작은 worker 대신 균형 잡힌 세 개의 worker로 실행되며, agentic gateway/plugin config는 built artifact를 기다리지 않고 기존 source-only agentic Node 작업에 분산됩니다. 광범위한 browser, QA, media, 기타 plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest 구성을 사용합니다. 광범위한 agents lane은 단일 느린 테스트 파일이 아니라 import/스케줄링이 지배적이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 공유 런타임 shard가 tail을 맡지 않도록 infra core-runtime shard와 함께 실행됩니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고, runtime topology architecture와 gateway watch 범위를 분리합니다. boundary guard shard는 하나의 작업 내에서 작은 독립 guard를 동시에 실행합니다. Gateway watch, channel 테스트, core support-boundary shard는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되며, 이전 check 이름은 가벼운 verifier 작업으로 유지하면서 추가 Blacksmith worker 두 개와 두 번째 artifact-consumer 큐는 피합니다.
Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 뒤 Play debug APK를 빌드합니다. third-party flavor에는 별도의 소스 세트나 manifest가 없지만, 해당 단위 테스트 레인은 SMS/call-log BuildConfig 플래그를 사용해 그 flavor도 컴파일하면서 Android 관련 모든 푸시마다 중복 debug APK 패키징 작업이 실행되는 것은 피합니다.
`extension-fast`는 푸시 실행에서 이미 전체 bundled plugin shard를 수행하므로 PR 전용입니다. 이렇게 하면 리뷰를 위한 changed-plugin 피드백은 유지하면서, `checks-node-extensions`에 이미 포함된 범위를 위해 `main`에서 추가 Blacksmith worker를 예약하지 않아도 됩니다.

GitHub는 같은 PR 또는 `main` ref에 더 새로운 푸시가 들어오면 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref에 대한 최신 실행도 실패하는 경우가 아니라면 이를 CI 노이즈로 취급하세요. aggregate shard 검사는 `!cancelled() && always()`를 사용하므로 정상적인 shard 실패는 계속 보고하지만, 전체 워크플로가 이미 대체된 뒤에는 대기열에 들어가지 않습니다.
CI concurrency key는 버전 관리됩니다(`CI-v7-*`). 따라서 오래된 큐 그룹의 GitHub 측 zombie가 더 새로운 main 실행을 무기한 차단할 수 없습니다.

## 러너

| 러너                             | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, shard된 channel contract 검사, lint를 제외한 `check` shard, `check-additional` shard 및 aggregate, Node 테스트 aggregate verifier, docs 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 Blacksmith 매트릭스가 더 일찍 대기열에 들어갈 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 shard, bundled plugin 테스트 shard, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`. 이 작업은 여전히 CPU 민감도가 높아서 8 vCPU는 절약 효과보다 비용이 더 컸습니다. 또한 install-smoke Docker 빌드도 여기에 해당하며, 32-vCPU는 절약 효과보다 대기열 시간이 더 컸습니다                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                              |

## 로컬 대응 항목

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경된 typecheck/lint/테스트
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + shard된 lint + 병렬 빠른 guard
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 형식 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
node scripts/ci-run-timings.mjs <run-id>      # 전체 시간, 대기열 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
```
