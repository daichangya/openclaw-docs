---
read_when:
    - 테스트를 실행하거나 수정할 때
summary: 로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 언제 사용할지
title: 테스트
x-i18n:
    generated_at: "2026-04-08T02:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7c19390f7577b3a29796c67514c96fe4c86c9fa0c7686cd4e377c6e31dcd085
    source_path: reference/test.md
    workflow: 15
---

# 테스트

- 전체 테스트 키트(스위트, 라이브, Docker): [Testing](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유하고 있는 남아 있는 gateway 프로세스를 종료한 다음, 격리된 gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 coverage와 함께 unit 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 전역 임계값은 lines/branches/functions/statements 모두 70%입니다. coverage는 unit 테스트 가능 로직에 집중할 수 있도록 integration 비중이 큰 entrypoint(CLI wiring, gateway/telegram bridge, webchat 정적 서버)를 제외합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 unit coverage를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우, 변경된 git 경로를 범위가 제한된 Vitest lane으로 확장합니다. config/setup 변경은 여전히 기본 루트 프로젝트 실행으로 대체되므로, wiring 수정이 필요할 때는 폭넓게 다시 실행됩니다.
- `pnpm test`: 명시적인 파일/디렉터리 대상을 범위가 제한된 Vitest lane으로 라우팅합니다. 대상을 지정하지 않은 실행은 이제 하나의 거대한 루트 프로젝트 프로세스 대신 열한 개의 순차 shard config(`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-support-boundary.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`)를 실행합니다.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 전용 경량 lane을 통해 라우팅되며, `test/setup.ts`만 유지하고 runtime 부담이 큰 케이스는 기존 lane에 남깁니다.
- 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 `pnpm test:changed`를 이러한 경량 lane의 명시적 sibling 테스트에 매핑하므로, 작은 helper 수정으로 인해 무거운 runtime 기반 스위트를 다시 실행하지 않게 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분할되어, reply harness가 더 가벼운 최상위 status/token/helper 테스트를 지배하지 않도록 합니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공통 비격리 runner가 repo config 전반에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions`는 `vitest.extensions.config.ts`를 실행합니다.
- `pnpm test:extensions`: extension/plugin 스위트를 실행합니다.
- `pnpm test:perf:imports`: 명시적인 파일/디렉터리 대상에는 여전히 범위가 제한된 lane 라우팅을 사용하면서, Vitest import-duration + import-breakdown 보고를 활성화합니다.
- `pnpm test:perf:imports:changed`: 위와 동일한 import profiling이지만, `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로를 기본 루트 프로젝트 실행과 비교 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`: 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU profile을 작성합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: unit runner용 CPU + heap profile을 작성합니다(`.artifacts/vitest-runner-profile`).
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 옵트인합니다.
- `pnpm test:e2e`: gateway end-to-end 스모크 테스트(멀티 인스턴스 WS/HTTP/node pairing)를 실행합니다. 기본값으로 `vitest.e2e.config.ts`에서 adaptive worker와 함께 `threads` + `isolate: false`를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider 라이브 테스트(minimax/zai)를 실행합니다. API 키와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요하며, 그래야 skip 해제됩니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하며, `/api/models`를 확인한 다음, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 라이브 모델 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반 unit/e2e 스위트처럼 CI 안정성을 기대하는 용도는 아닙니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 시작하는 두 번째 클라이언트 컨테이너를 띄운 뒤, 실제 stdio bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 검증은 원시 stdio MCP 프레임을 직접 읽으므로, 이 스모크는 bridge가 실제로 내보내는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 확인을 위해 다음을 실행하세요:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

로드가 높은 호스트에서 `pnpm test`가 불안정하게 실패하면, 회귀로 간주하기 전에 한 번 다시 실행한 다음 `pnpm test <path/to/test>`로 범위를 좁혀 분리하세요. 메모리 제약이 있는 호스트에서는 다음을 사용하세요:

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

출력에는 각 명령에 대한 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적인 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 profile을 기록하므로, 타이밍과 profile 캡처가 같은 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 artifact를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 artifact를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 fixture `test/fixtures/cli-startup-bench.json`을 갱신합니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- `pnpm test:startup:bench:check`로 현재 결과를 fixture와 비교

## 온보딩 E2E (Docker)

Docker는 선택 사항입니다. 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 interactive wizard를 구동하고, config/workspace/session 파일을 검증한 다음, gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

지원되는 Docker Node 런타임(Node 24 기본값, Node 22 호환)에서 `qrcode-terminal`이 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```
