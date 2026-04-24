---
read_when:
    - 테스트를 실행하거나 수정하는 중입니다.
summary: 로컬에서 테스트를 실행하는 방법(vitest)과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-24T06:35:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- 전체 테스트 키트(스위트, live, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유하고 있는 남아 있는 gateway 프로세스를 종료한 뒤, 격리된 gateway 포트에서 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 coverage와 함께 유닛 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이것은 리포지토리 전체 all-file coverage가 아니라 로드된 파일 기준 유닛 coverage 게이트입니다. 임계값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분리된 레인 전체 소스 파일을 모두 미커버로 취급하는 대신 유닛 coverage 스위트가 로드한 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 유닛 coverage를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드렸을 때 변경된 git 경로를 범위가 지정된 Vitest 레인으로 확장합니다. config/setup 변경은 여전히 네이티브 루트 프로젝트 실행으로 대체되므로, wiring 수정은 필요 시 넓게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff에 의해 트리거되는 아키텍처 레인을 보여줍니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대한 스마트 변경 게이트를 실행합니다. 코어 작업은 코어 테스트 레인과 함께, 확장 작업은 확장 테스트 레인과 함께, 테스트 전용 작업은 테스트 typecheck/tests만 실행하며, 공개 Plugin SDK 또는 plugin-contract 변경은 하나의 확장 검증 패스로 확장하고, 릴리스 메타데이터 전용 버전 변경은 대상 버전/config/루트 의존성 검사로 유지합니다.
- `pnpm test`: 명시적인 파일/디렉터리 대상을 범위가 지정된 Vitest 레인으로 라우팅합니다. 대상을 지정하지 않은 실행은 고정 shard 그룹을 사용하며 로컬 병렬 실행을 위해 leaf config로 확장됩니다. 확장 그룹은 하나의 거대한 루트 프로젝트 프로세스가 아니라 항상 확장별 shard config로 확장됩니다.
- 전체 및 확장 shard 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 타이밍 데이터를 업데이트하며, 이후 실행은 이 타이밍을 사용해 느린 shard와 빠른 shard를 균형 있게 배치합니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 레인으로 라우팅되며, 런타임이 무거운 케이스는 기존 레인에 남겨 둡니다.
- 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 `pnpm test:changed`를 해당 경량 레인의 명시적 형제 테스트로 매핑하므로, 작은 헬퍼 수정 시 무거운 런타임 기반 스위트를 다시 실행하지 않아도 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분리되므로, reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않습니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공통 비격리 runner가 리포지토리 전반의 config에서 활성화됩니다.
- `pnpm test:channels`: `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`: 모든 extension/plugin shard를 실행합니다. 무거운 채널 Plugins, browser Plugin, OpenAI는 전용 shard로 실행되며, 다른 Plugin 그룹은 배치 상태로 유지됩니다. 하나의 번들 Plugin 레인만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: 명시적인 파일/디렉터리 대상에 대해 범위가 지정된 레인 라우팅을 유지하면서 Vitest import-duration + import-breakdown 보고를 활성화합니다.
- `pnpm test:perf:imports:changed`: 동일한 import profiling이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로를 네이티브 루트 프로젝트 실행과 비교 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`: 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로파일을 작성합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 유닛 runner용 CPU + heap 프로파일을 작성합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 full-suite Vitest leaf config를 직렬로 실행하고, 그룹화된 duration 데이터와 config별 JSON/로그 아티팩트를 기록합니다. Test Performance Agent는 느린 테스트 수정을 시도하기 전 기준선으로 이것을 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 그룹화된 보고서를 비교합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: gateway end-to-end 스모크 테스트(멀티 인스턴스 WS/HTTP/node pairing)를 실행합니다. 기본값은 `vitest.e2e.config.ts`에서 `threads` + `isolate: false`와 adaptive workers를 사용하며, `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트(minimax/zai)를 실행합니다. API key와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요하며, 그래야 skip이 해제됩니다.
- `pnpm test:docker:all`: 공유 live-test 이미지와 Docker E2E 이미지를 한 번 빌드한 뒤, 기본 동시성 8에서 `OPENCLAW_SKIP_DOCKER_BUILD=1`과 함께 Docker 스모크 레인을 실행합니다. 메인 풀은 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`으로, provider 민감 tail 풀은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`으로 조정합니다. 둘 다 기본값은 8입니다. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않으면 runner는 첫 실패 이후 새 pooled 레인을 더 이상 스케줄링하지 않으며, 각 레인은 기본 120분 타임아웃을 가지며 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 레인별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하고, `/api/models`를 확인한 뒤, `/api/chat/completions`를 통한 실제 프록시 채팅을 실행합니다. 사용 가능한 live 모델 key(예: `~/.profile`의 OpenAI)가 필요하며, 외부 Open WebUI 이미지를 pull하고, 일반 유닛/e2e 스위트처럼 CI 안정성을 기대하지는 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 시작하는 두 번째 클라이언트 컨테이너를 띄운 뒤, 실제 stdio 브리지를 통해 라우팅된 대화 검색, 대화 기록 읽기, 첨부 메타데이터, 실시간 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 검증은 raw stdio MCP 프레임을 직접 읽으므로, 브리지가 실제로 무엇을 내보내는지 그대로 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 확인을 위해 다음을 실행하세요.

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 호스트에서 불안정하게 실패하면 회귀로 간주하기 전에 한 번 더 재실행한 뒤 `pnpm test <path/to/test>`로 범위를 좁히세요. 메모리가 제한된 호스트에서는 다음을 사용하세요.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “Reply with a single word: ok. No punctuation or extra text.”

마지막 실행(2025-12-31, 20 runs):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI 시작 벤치

스크립트: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

사용법:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

프리셋:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 두 프리셋 모두

출력에는 각 명령별 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, max RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`은 실행별 V8 프로파일을 기록하므로 타이밍과 프로파일 캡처가 동일한 하니스에서 수행됩니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 fixture를 `test/fixtures/cli-startup-bench.json`에 새로 반영합니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- `pnpm test:startup:bench:check`로 현재 결과를 fixture와 비교

## Onboarding E2E (Docker)

Docker는 선택 사항이며, 이것은 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 cold-start 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 확인한 뒤 gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 유지되는 QR 런타임 헬퍼가 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```

## 관련 항목

- [테스트](/ko/help/testing)
- [Testing live](/ko/help/testing-live)
