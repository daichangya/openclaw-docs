---
read_when:
    - 테스트 실행 또는 수정
summary: 로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-25T12:28:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- 전체 테스트 키트(스위트, live, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유하고 있는 남아 있는 Gateway 프로세스를 종료한 뒤, 격리된 Gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않게 합니다. 이전 Gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 coverage와 함께 단위 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이는 저장소 전체의 모든 파일 coverage가 아니라, 로드된 파일 기준 단위 coverage 게이트입니다. 임곗값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분할 레인의 모든 소스 파일을 미커버리지로 취급하는 대신 단위 coverage 스위트에서 로드된 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 단위 coverage를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우, 변경된 git 경로를 범위가 좁혀진 Vitest 레인으로 확장합니다. Config/setup 변경은 여전히 기본 루트 프로젝트 실행으로 대체되므로, wiring 편집은 필요할 때 폭넓게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff로 트리거되는 아키텍처 레인을 보여줍니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대해 스마트 변경 게이트를 실행합니다. 코어 작업은 코어 테스트 레인과 함께, extension 작업은 extension 테스트 레인과 함께, 테스트 전용 작업은 테스트 typecheck/tests만으로 실행하고, 공개 Plugin SDK 또는 plugin-contract 변경은 extension 검증 1회로 확장하며, 릴리스 메타데이터 전용 버전 범프는 대상이 좁혀진 version/config/root-dependency 검사로 유지합니다.
- `pnpm test`: 명시적인 파일/디렉터리 대상을 범위가 지정된 Vitest 레인을 통해 라우팅합니다. 대상을 지정하지 않은 실행은 고정 shard 그룹을 사용하고 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 하나의 거대한 root-project 프로세스 대신 항상 extension별 shard config로 확장됩니다.
- 전체 및 extension shard 실행은 로컬 타이밍 데이터를 `.artifacts/vitest-shard-timings.json`에 업데이트하며, 이후 실행은 이 타이밍을 사용해 느린 shard와 빠른 shard의 균형을 맞춥니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 일부 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 레인을 통해 라우팅되며, 런타임이 무거운 케이스는 기존 레인에 남습니다.
- 일부 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 `pnpm test:changed`를 이 경량 레인의 명시적 형제 테스트로 매핑하므로, 작은 헬퍼 수정 시 무거운 런타임 기반 스위트를 다시 실행하지 않아도 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분리되어, reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않도록 합니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공유 비격리 runner가 저장소 config 전반에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`는 모든 extension/Plugin shard를 실행합니다. 무거운 채널 Plugins, browser Plugin, OpenAI는 전용 shard로 실행되고, 다른 Plugin 그룹은 계속 묶음으로 유지됩니다. 번들 Plugin 레인 하나만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: 명시적인 파일/디렉터리 대상에 대해 범위 지정 레인 라우팅을 계속 사용하면서 Vitest import-duration + import-breakdown 보고를 활성화합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로와 기본 루트 프로젝트 실행을 벤치마킹합니다.
- `pnpm test:perf:changed:bench -- --worktree`: 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마킹합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로필을 기록합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 단위 runner용 CPU + heap 프로필을 기록합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 전체 스위트 Vitest leaf config를 직렬로 실행하고 그룹화된 실행 시간 데이터와 config별 JSON/로그 아티팩트를 기록합니다. Test Performance Agent는 느린 테스트 수정 전 기준선으로 이것을 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 그룹화된 보고서를 비교합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 옵트인합니다.
- `pnpm test:e2e`: Gateway 엔드투엔드 스모크 테스트(멀티 인스턴스 WS/HTTP/node pairing)를 실행합니다. 기본적으로 `vitest.e2e.config.ts`에서 적응형 worker와 함께 `threads` + `isolate: false`를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고, 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트(minimax/zai)를 실행합니다. API 키와, skip 해제를 위한 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요합니다.
- `pnpm test:docker:all`: 공유 live-test 이미지와 Docker E2E 이미지를 한 번 빌드한 다음, 가중 스케줄러를 통해 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 Docker 스모크 레인을 실행합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`은 프로세스 슬롯을 제어하며 기본값은 10이고, `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`은 provider 민감 tail 풀을 제어하며 기본값은 10입니다. 무거운 레인 상한 기본값은 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`이며, provider 상한 기본값은 provider당 하나의 무거운 레인으로 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`입니다. 더 큰 호스트에서는 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`을 사용하세요. 레인 시작은 로컬 Docker daemon create 폭주를 피하기 위해 기본적으로 2초 간격으로 지연되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 재정의할 수 있습니다. runner는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 정리하며, 30초마다 활성 레인 상태를 출력하고, 호환 가능한 레인 간 provider CLI 도구 캐시를 공유하며, 기본적으로 일시적인 live-provider 실패를 한 번 재시도하고(`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), 이후 longest-first 정렬을 위해 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장합니다. Docker를 실행하지 않고 레인 매니페스트만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, 상태 출력 주기를 조정하려면 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, 타이밍 재사용을 비활성화하려면 `OPENCLAW_DOCKER_ALL_TIMINGS=0`을 사용하세요. 결정적/로컬 레인만 원하면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`, live-provider 레인만 원하면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`를 사용하세요. 패키지 별칭은 `pnpm test:docker:local:all` 및 `pnpm test:docker:live:all`입니다. live-only 모드는 main과 tail live 레인을 하나의 longest-first 풀로 병합하여 provider 버킷이 Claude, Codex, Gemini 작업을 함께 채울 수 있게 합니다. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않은 한 runner는 첫 실패 후 새로운 풀 레인 스케줄링을 중단하며, 각 레인은 기본적으로 120분 대체 타임아웃을 가지며 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 일부 live/tail 레인은 더 엄격한 레인별 상한을 사용합니다. CLI backend Docker 설정 명령은 자체 타임아웃을 가지며 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`(기본값 180)로 제어됩니다. 레인별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- CLI backend live Docker 프로브는 집중된 레인으로 실행할 수 있습니다. 예: `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, `pnpm test:docker:live-cli-backend:codex:mcp`. Claude와 Gemini에도 동일한 `:resume` 및 `:mcp` 별칭이 있습니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인한 뒤 `/api/models`를 확인하고, 이어서 `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 live model 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반 단위/e2e 스위트처럼 CI 안정성을 기대하는 테스트는 아닙니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 생성하는 두 번째 클라이언트 컨테이너를 시작한 뒤, 실제 stdio bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 메타데이터, live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 검증은 원시 stdio MCP 프레임을 직접 읽으므로, 이 스모크는 bridge가 실제로 방출하는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 검사를 위해 다음을 실행하세요.

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 호스트에서 불안정하면, 회귀로 간주하기 전에 한 번 더 재실행한 뒤 `pnpm test <path/to/test>`로 분리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치마크(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “Reply with a single word: ok. No punctuation or extra text.”

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms (최소 1114, 최대 2431)
- opus 중앙값 2454ms (최소 1224, 최대 3170)

## CLI 시작 벤치마크

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

출력에는 각 명령의 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`은 실행별 V8 프로필을 기록하므로, 타이밍과 프로필 캡처가 같은 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 fixture를 `test/fixtures/cli-startup-bench.json`에 새로 기록합니다

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 새로 고침
- 현재 결과를 fixture와 비교하려면 `pnpm test:startup:bench:check` 사용

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서 전체 cold-start 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

유지 관리되는 QR 런타임 헬퍼가 지원되는 Docker Node 런타임(Node 24 기본값, Node 22 호환)에서 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```

## 관련

- [테스트](/ko/help/testing)
- [라이브 테스트](/ko/help/testing-live)
