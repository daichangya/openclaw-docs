---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사들을 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-23T06:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 스마트 스코프 처리를 사용해 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뜁니다.

QA Lab에는 메인 스마트 스코프 워크플로 바깥에 전용 CI 레인이 있습니다. `Parity gate` 워크플로는 일치하는 PR 변경과 수동 실행에서 동작하며, 비공개 QA 런타임을 빌드하고 모의 GPT-5.4 및 Opus 4.6 agentic 팩을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 그리고 수동 실행 시 동작하며, 모의 parity gate, 라이브 Matrix 레인, 라이브 Telegram 레인을 병렬 작업으로 분기합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하며, Telegram 레인은 Convex 리스를 사용합니다. `OpenClaw Release Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

## 작업 개요

| 작업                             | 목적                                                                                         | 실행 시점                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 문서 전용 변경, 변경된 스코프, 변경된 확장, CI 매니페스트 빌드 감지                           | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 비공개 키 탐지 및 워크플로 감사                                              | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-dependency-audit`      | npm 권고사항에 대한 의존성 없는 프로덕션 lockfile 감사                                       | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업들을 위한 필수 집계 작업                                                       | 초안이 아닌 모든 push 및 PR에서 항상 |
| `build-artifacts`                | `dist/`, Control UI, 빌드 아티팩트 검사 및 재사용 가능한 다운스트림 아티팩트 빌드            | Node 관련 변경                       |
| `checks-fast-core`               | bundled/plugin-contract/protocol 검사와 같은 빠른 Linux 정합성 레인                          | Node 관련 변경                       |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과를 갖는 샤딩된 채널 계약 검사                                         | Node 관련 변경                       |
| `checks-node-extensions`         | 확장 스위트 전반의 전체 bundled-plugin 테스트 샤드                                           | Node 관련 변경                       |
| `checks-node-core-test`          | 채널, bundled, contract, 확장 레인을 제외한 코어 Node 테스트 샤드                            | Node 관련 변경                       |
| `extension-fast`                 | 변경된 bundled plugin에 대해서만 수행하는 집중 테스트                                        | 확장 변경이 있는 pull request        |
| `check`                          | 샤딩된 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, 가드, 테스트 타입, 엄격한 스모크     | Node 관련 변경                       |
| `check-additional`               | 아키텍처, 경계, extension-surface 가드, package-boundary, gateway-watch 샤드                 | Node 관련 변경                       |
| `build-smoke`                    | 빌드된 CLI 스모크 테스트 및 시작 메모리 스모크                                               | Node 관련 변경                       |
| `checks`                         | 빌드 아티팩트 채널 테스트와 push 전용 Node 22 호환성을 위한 검증기                            | Node 관련 변경                       |
| `check-docs`                     | 문서 포맷팅, lint 및 깨진 링크 검사                                                          | 문서 변경                            |
| `skills-python`                  | Python 기반 Skills를 위한 Ruff + pytest                                                     | Python Skills 관련 변경              |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                     | Windows 관련 변경                    |
| `macos-node`                     | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인                                   | macOS 관련 변경                      |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드 및 테스트                                                        | macOS 관련 변경                      |
| `android`                        | 두 flavor 모두에 대한 Android 단위 테스트와 하나의 debug APK 빌드                            | Android 관련 변경                    |

## Fail-Fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 정렬되어 있습니다.

1. `preflight`가 어떤 레인이 존재할지 자체를 결정합니다. `docs-scope` 및 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 다운스트림 소비자가 시작할 수 있습니다.
4. 이후 더 무거운 플랫폼 및 런타임 레인이 분기됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

스코프 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 커버됩니다.
CI 워크플로 편집은 Node CI 그래프와 워크플로 linting을 검증하지만, 그 자체만으로 Windows, Android 또는 macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 계속해서 플랫폼 소스 변경에만 스코프가 제한됩니다.
Windows Node 검사는 Windows 전용 프로세스/경로 래퍼, npm/pnpm/UI 러너 헬퍼, 패키지 관리자 설정, 그리고 해당 레인을 실행하는 CI 워크플로 표면에만 스코프가 제한됩니다. 관련 없는 소스, plugin, install-smoke, 테스트 전용 변경은 일반 테스트 샤드로 이미 커버되는 범위를 위해 16-vCPU Windows 워커를 예약하지 않도록 Linux Node 레인에만 남깁니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 스코프 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로 Docker/install smoke는 설치, 패키징, 컨테이너 관련 변경, bundled extension 프로덕션 변경, 그리고 Docker smoke 작업이 실행하는 코어 plugin/channel/gateway/Plugin SDK 표면에 대해 동작합니다. 테스트 전용 및 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 해당 QR 패키지 smoke는 BuildKit pnpm 스토어 캐시를 유지하면서 Docker `pnpm install` 레이어를 강제로 다시 실행하므로, 매 실행마다 의존성을 다시 다운로드하지 않으면서도 설치를 계속 검증합니다. 해당 gateway-network e2e는 작업 초반에 빌드된 런타임 이미지를 재사용하므로, 또 다른 Docker 빌드를 추가하지 않고 실제 컨테이너 간 WebSocket 커버리지를 추가합니다. 로컬 `test:docker:all`은 공유 `scripts/e2e/Dockerfile` built-app 이미지를 하나 사전 빌드하고 이를 E2E 컨테이너 smoke 러너 전반에 재사용합니다. 재사용 가능한 live/E2E 워크플로도 Docker 매트릭스 전에 SHA 태그가 붙은 GHCR Docker E2E 이미지 하나를 빌드하고 푸시한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 매트릭스를 실행하는 동일한 패턴을 따릅니다. QR 및 설치 프로그램 Docker 테스트는 자체 설치 중심 Dockerfile을 유지합니다. 별도의 `docker-e2e-fast` 작업은 120초 명령 타임아웃 아래에서 제한된 bundled-plugin Docker 프로필을 실행합니다: setup-entry 의존성 복구와 synthetic bundled-loader 실패 격리입니다. 전체 bundled update/channel 매트릭스는 반복적인 실제 npm update 및 doctor 복구 패스를 수행하므로 수동/전체 스위트로 유지됩니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`에 의해 실행됩니다. 이 로컬 게이트는 광범위한 CI 플랫폼 스코프보다 아키텍처 경계에 대해 더 엄격합니다. 코어 프로덕션 변경은 코어 프로덕션 typecheck와 코어 테스트를 실행하고, 코어 테스트 전용 변경은 코어 테스트 typecheck/테스트만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension 테스트 전용 변경은 extension 테스트 typecheck/테스트만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 확장이 해당 코어 계약에 의존하므로 extension 검증까지 확장됩니다. 릴리스 메타데이터 전용 버전 범프는 대상 버전/config/root-dependency 검사를 실행합니다. 알 수 없는 루트/config 변경은 안전하게 모든 레인으로 실패 처리됩니다.

push에서는 `checks` 매트릭스가 push 전용 `compat-node22` 레인을 추가합니다. pull request에서는 이 레인이 건너뛰어지고, 매트릭스는 일반 테스트/채널 레인에만 집중됩니다.

가장 느린 Node 테스트 계열은 각 작업이 작게 유지되도록 분할 또는 균형 조정됩니다. 채널 계약은 레지스트리와 코어 커버리지를 총 6개의 가중 샤드로 분할하고, bundled plugin 테스트는 6개의 확장 워커에 걸쳐 균형을 맞추며, auto-reply는 6개의 작은 워커 대신 3개의 균형 잡힌 워커로 실행되고, agentic gateway/plugin 설정은 빌드 아티팩트를 기다리지 않고 기존 소스 전용 agentic Node 작업 전반에 분산됩니다. 광범위한 브라우저, QA, 미디어 및 기타 plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest 설정을 사용합니다. 광범위한 agents 레인은 단일 느린 테스트 파일이 소유하는 형태가 아니라 import/스케줄링 지배형이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 공유 런타임 샤드가 꼬리를 소유하지 않도록 infra core-runtime 샤드와 함께 실행됩니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 런타임 토폴로지 아키텍처를 gateway watch 커버리지와 분리합니다. boundary guard 샤드는 하나의 작업 안에서 작은 독립 가드를 동시에 실행합니다. Gateway watch, 채널 테스트, 코어 support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되며, 기존 검사 이름은 가벼운 검증 작업으로 유지하면서 Blacksmith 워커 2개와 두 번째 artifact-consumer 큐를 추가하지 않도록 합니다.
Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 뒤 Play debug APK를 빌드합니다. third-party flavor에는 별도의 소스 세트나 매니페스트가 없지만, 해당 단위 테스트 레인은 SMS/call-log BuildConfig 플래그와 함께 그 flavor를 계속 컴파일하면서 Android 관련 push마다 중복 debug APK 패키징 작업은 피합니다.
`extension-fast`는 push 실행이 이미 전체 bundled plugin 샤드를 수행하므로 PR 전용입니다. 이렇게 하면 `main`에서 `checks-node-extensions`에 이미 포함된 커버리지를 위해 추가 Blacksmith 워커를 예약하지 않으면서 리뷰에 필요한 변경 plugin 피드백을 유지할 수 있습니다.

동일한 PR 또는 `main` ref에 새 push가 들어오면 GitHub는 대체된 작업을 `cancelled`로 표시할 수 있습니다. 동일한 ref에 대한 최신 실행도 실패하지 않는 한 이를 CI 노이즈로 취급하세요. 집계 샤드 검사는 `!cancelled() && always()`를 사용하므로 일반적인 샤드 실패는 계속 보고하지만, 전체 워크플로가 이미 대체된 뒤에는 대기열에 들어가지 않습니다.
CI 동시성 키는 버전이 지정되어 있으며(`CI-v7-*`), 따라서 오래된 대기열 그룹에 있는 GitHub 측 좀비가 최신 main 실행을 무기한 차단할 수 없습니다.

## 러너

| 러너                             | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 검증기, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 대기열에 들어갈 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, bundled plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, 이 작업은 여전히 CPU 민감도가 높아 8 vCPU가 절약한 것보다 더 큰 비용이 들었습니다. install-smoke Docker 빌드도 마찬가지로 32-vCPU의 대기열 시간 비용이 절약 효과보다 더 컸습니다                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; 포크에서는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; 포크에서는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                          |

## 로컬 대응 항목

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경된 typecheck/lint/테스트
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 가드
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 문서 형식 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
node scripts/ci-run-timings.mjs <run-id>  # 총 소요 시간, 대기열 시간, 가장 느린 작업 요약
```
