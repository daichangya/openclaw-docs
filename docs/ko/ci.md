---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 파악해야 합니다
    - 실패한 GitHub Actions 체크를 디버깅하고 있습니다
summary: CI 작업 그래프, 범위 게이트 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-21T06:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뛰기 위해 스마트 범위 지정을 사용합니다.

## 작업 개요

| 작업                             | 목적                                                                                         | 실행 시점                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | docs 전용 변경, 변경된 범위, 변경된 extensions를 감지하고 CI 매니페스트를 빌드              | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 private key 감지 및 워크플로 감사                                            | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-dependency-audit`      | npm advisory에 대한 의존성 없는 프로덕션 lockfile 감사                                      | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 집계 작업                                                         | 초안이 아닌 모든 push 및 PR에서 항상 |
| `build-artifacts`                | `dist/` 및 Control UI를 한 번 빌드하고, 후속 작업을 위한 재사용 가능한 아티팩트를 업로드    | Node 관련 변경                       |
| `checks-fast-core`               | 번들/plugin-contract/protocol 검사와 같은 빠른 Linux 정확성 레인                            | Node 관련 변경                       |
| `checks-fast-contracts-channels` | 안정적인 집계 체크 결과를 갖는 샤딩된 채널 contract 검사                                    | Node 관련 변경                       |
| `checks-node-extensions`         | extension 모음 전반에 대한 전체 번들 plugin 테스트 샤드                                     | Node 관련 변경                       |
| `checks-node-core-test`          | 채널, 번들, contract 및 extension 레인을 제외한 core Node 테스트 샤드                       | Node 관련 변경                       |
| `extension-fast`                 | 변경된 번들 plugins에 대해서만 수행하는 집중 테스트                                         | extension 변경이 감지될 때           |
| `check`                          | 샤딩된 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, 가드, 테스트 타입 및 strict smoke   | Node 관련 변경                       |
| `check-additional`               | 아키텍처, 경계, extension-surface 가드, package-boundary 및 gateway-watch 샤드              | Node 관련 변경                       |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 startup-memory smoke                                              | Node 관련 변경                       |
| `checks`                         | 나머지 Linux Node 레인: 채널 테스트 및 push 전용 Node 22 호환성                             | Node 관련 변경                       |
| `check-docs`                     | docs 포맷팅, lint 및 깨진 링크 검사                                                          | docs 변경                            |
| `skills-python`                  | Python 기반 Skills에 대한 Ruff + pytest                                                     | Python Skills 관련 변경              |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                      | Windows 관련 변경                    |
| `macos-node`                     | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인                                  | macOS 관련 변경                      |
| `macos-swift`                    | macOS 앱에 대한 Swift lint, 빌드 및 테스트                                                   | macOS 관련 변경                      |
| `android`                        | Android 빌드 및 테스트 매트릭스                                                              | Android 관련 변경                    |

## Fail-Fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 정해져 있습니다.

1. `preflight`가 어떤 레인이 실제로 존재하는지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 후속 소비자가 시작할 수 있습니다.
4. 그 이후 더 무거운 플랫폼 및 런타임 레인이 분기 실행됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로 Docker/install smoke는 설치, 패키징 및 컨테이너 관련 변경에 대해서만 실행됩니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`에 의해 실행됩니다. 이 로컬 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다. core 프로덕션 변경은 core 프로덕션 typecheck와 core 테스트를 실행하고, core 테스트 전용 변경은 core 테스트 typecheck/tests만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension 테스트 전용 변경은 extension 테스트 typecheck/tests만 실행합니다. public Plugin SDK 또는 plugin-contract 변경은 extensions가 해당 core contract에 의존하므로 extension 검증까지 확장됩니다. 알 수 없는 루트/config 변경은 안전하게 모든 레인으로 실패 처리됩니다.

push에서는 `checks` 매트릭스에 push 전용 `compat-node22` 레인이 추가됩니다. pull request에서는 이 레인이 건너뛰어지며, 매트릭스는 일반 테스트/채널 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 작게 유지되도록 include-file 샤드로 분할됩니다. 채널 contract는 registry와 core 커버리지를 각각 8개의 가중 샤드로 분할하고, auto-reply reply command 테스트는 4개의 include-pattern 샤드로 분할하며, 나머지 대형 auto-reply reply prefix 그룹은 각각 2개의 샤드로 분할됩니다. `check-additional`도 package-boundary compile/canary 작업을 런타임 토폴로지 gateway/architecture 작업과 분리합니다.

동일한 PR 또는 `main` ref에 새 push가 도착하면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 동일한 ref에 대한 최신 실행도 실패하고 있지 않다면 이를 CI 노이즈로 취급하세요. 집계 샤드 체크는 이 취소 사례를 명시적으로 표시하므로 테스트 실패와 더 쉽게 구분할 수 있습니다.

## 러너

| 러너                             | 작업                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux checks, docs checks, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                          |

## 로컬 대응 명령어

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경된 typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 가드
pnpm check:test-types
pnpm check:timed    # 단계별 타이밍이 포함된 동일 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 포맷 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
```
