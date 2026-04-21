---
read_when:
    - 테스트 실행 또는 수정하기
summary: Vitest로 로컬에서 테스트를 실행하는 방법과 force/coverage 모드를 언제 사용할지
title: 테스트
x-i18n:
    generated_at: "2026-04-21T06:08:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# 테스트

- 전체 테스트 키트(suite, live, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유한 남아 있는 Gateway 프로세스를 종료한 다음, 격리된 Gateway 포트로 전체 Vitest suite를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 Gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 coverage로 unit suite를 실행합니다(`vitest.unit.config.ts` 사용). 이것은 전체 리포지토리 all-file coverage가 아니라 로드된 파일 기준 unit coverage 게이트입니다. 임계값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분리된 각 lane의 모든 소스 파일을 미커버로 간주하는 대신 unit coverage suite에서 로드된 파일만 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 unit coverage를 실행합니다.
- `pnpm test:changed`: 변경된 git 경로를, diff가 라우팅 가능한 소스/테스트 파일만 건드렸을 때 범위가 지정된 Vitest lane으로 확장합니다. config/setup 변경은 여전히 기본 루트 프로젝트 실행으로 폴백하므로, 연결 변경은 필요할 때 넓게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff가 트리거하는 아키텍처 lane을 보여줍니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대해 스마트 changed 게이트를 실행합니다. core 작업은 core 테스트 lane과 함께, extension 작업은 extension 테스트 lane과 함께, test-only 작업은 테스트 typecheck/테스트만으로 실행하며, 공개 Plugin SDK 또는 plugin-contract 변경은 extension 검증까지 확장합니다.
- `pnpm test`: 명시적 파일/디렉터리 대상을 범위가 지정된 Vitest lane으로 라우팅합니다. 대상이 없는 실행은 고정 shard 그룹을 사용하고 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 항상 하나의 거대한 루트 프로젝트 프로세스 대신 extension별 shard config로 확장됩니다.
- 전체 실행과 extension shard 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 타이밍 데이터를 업데이트합니다. 이후 실행은 이 타이밍을 사용해 느린 shard와 빠른 shard의 균형을 맞춥니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 일부 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 lane으로 라우팅되며, 런타임이 무거운 케이스는 기존 lane에 남습니다.
- 일부 `plugin-sdk` 및 `commands` helper 소스 파일도 `pnpm test:changed`를 이 경량 lane의 명시적 형제 테스트로 매핑하므로, 작은 helper 수정이 무거운 런타임 기반 suite 전체를 다시 실행하지 않게 합니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분리되어, reply harness가 더 가벼운 top-level 상태/토큰/helper 테스트를 지배하지 않게 됩니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공유 비격리 runner가 리포지토리 전체 config에 걸쳐 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions`와 `pnpm test extensions`는 모든 extension/Plugin shard를 실행합니다. 무거운 채널 extension과 OpenAI는 전용 shard로 실행되고, 다른 extension 그룹은 배치 상태를 유지합니다. 하나의 번들 Plugin lane만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: Vitest import-duration + import-breakdown 보고를 활성화하면서도, 명시적 파일/디렉터리 대상에 대해서는 범위 지정 lane 라우팅을 계속 사용합니다.
- `pnpm test:perf:imports:changed`: 같은 import 프로파일링을 수행하지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 같은 커밋된 git diff에 대해 라우팅된 changed-mode 경로를 기본 루트 프로젝트 실행과 비교 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로필을 `.artifacts/vitest-main-profile`에 기록합니다.
- `pnpm test:perf:profile:runner`: unit runner용 CPU + heap 프로필을 `.artifacts/vitest-runner-profile`에 기록합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt in합니다.
- `pnpm test:e2e`: Gateway end-to-end 스모크 테스트(멀티 인스턴스 WS/HTTP/Node 페어링)를 실행합니다. 기본적으로 `vitest.e2e.config.ts`에서 `threads` + `isolate: false`와 적응형 worker를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트(minimax/zai)를 실행합니다. 스킵 해제를 위해 API 키와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요합니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하고, `/api/models`를 확인한 다음, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 live 모델 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반 unit/e2e suite처럼 CI 안정성을 기대하지는 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 다음, 실제 stdio 브리지를 통해 라우팅된 대화 탐색, transcript 읽기, 첨부 파일 metadata, live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 단언은 원시 stdio MCP 프레임을 직접 읽으므로 스모크가 브리지가 실제로 내보내는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR 랜딩/게이트 확인에는 다음을 실행하세요:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 호스트에서 불안정하게 실패하면, 회귀로 판단하기 전에 한 번 다시 실행한 뒤 `pnpm test <path/to/test>`로 범위를 좁히세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “Reply with a single word: ok. No punctuation or extra text.”

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms (최소 1114, 최대 2431)
- opus 중앙값 2454ms (최소 1224, 최대 3170)

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

출력에는 각 명령의 `sampleCount`, 평균, p50, p95, 최소/최대, 종료 코드/시그널 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로필을 기록하므로, 타이밍과 프로필 캡처가 같은 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다
- `pnpm test:startup:bench:save`는 `runs=5` 및 `warmup=1`로 전체 suite 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다
- `pnpm test:startup:bench:update`는 `runs=5` 및 `warmup=1`로 체크인된 기준 fixture `test/fixtures/cli-startup-bench.json`을 새로 고칩니다

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 새로 고침
- 현재 결과를 fixture와 비교하려면 `pnpm test:startup:bench:check` 사용

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이것은 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 `qrcode-terminal`이 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```
