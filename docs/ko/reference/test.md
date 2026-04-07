---
read_when:
    - 테스트를 실행하거나 수정할 때
summary: 로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-07T06:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a25236a707860307cc324f32752ad13a53e448bee9341d8df2e11655561e841c
    source_path: reference/test.md
    workflow: 15
---

# 테스트

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 제어 포트를 점유하고 있는 남아 있는 gateway 프로세스를 모두 종료한 다음, 격리된 gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 gateway 실행으로 인해 포트 18789가 점유된 상태로 남아 있을 때 사용합니다.
- `pnpm test:coverage`: V8 커버리지와 함께 단위 테스트 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 전역 임계값은 lines/branches/functions/statements 모두 70%입니다. 커버리지 대상은 단위 테스트 가능한 로직에 집중할 수 있도록 통합 비중이 높은 엔트리포인트(CLI wiring, gateway/telegram 브리지, webchat 정적 서버)를 제외합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 단위 테스트 커버리지를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우, 변경된 git 경로를 범위 지정된 Vitest 레인으로 확장합니다. config/setup 변경은 여전히 네이티브 루트 프로젝트 실행으로 폴백하므로, wiring 수정이 있을 때는 필요에 따라 더 넓게 다시 실행됩니다.
- `pnpm test`: 명시적인 파일/디렉터리 대상을 범위 지정된 Vitest 레인을 통해 라우팅합니다. 대상이 없는 실행은 이제 하나의 거대한 루트 프로젝트 프로세스 대신 10개의 순차 샤드 config(`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`)를 실행합니다.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 레인을 통해 라우팅되며, 런타임 비중이 높은 케이스는 기존 레인에 남겨 둡니다.
- 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 `pnpm test:changed`를 해당 경량 레인의 명시적인 형제 테스트에 매핑하므로, 작은 헬퍼 수정 시 무거운 런타임 기반 스위트를 다시 실행하지 않아도 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분리되어, reply 하니스가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않도록 했습니다.
- 기본 Vitest config는 이제 기본적으로 `pool: "threads"` 및 `isolate: false`를 사용하며, 공유 비격리 러너가 repo config 전반에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions`는 `vitest.extensions.config.ts`를 실행합니다.
- `pnpm test:extensions`: extension/plugin 스위트를 실행합니다.
- `pnpm test:perf:imports`: Vitest import-duration + import-breakdown 리포팅을 활성화하면서도, 명시적인 파일/디렉터리 대상에는 계속 범위 지정된 레인 라우팅을 사용합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링이지만, `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로와 네이티브 루트 프로젝트 실행을 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로필을 기록합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 단위 테스트 러너용 CPU + 힙 프로필을 기록합니다(`.artifacts/vitest-runner-profile`).
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: gateway end-to-end 스모크 테스트(다중 인스턴스 WS/HTTP/node 페어링)를 실행합니다. 기본값은 `vitest.e2e.config.ts`에서 adaptive workers와 함께 `threads` + `isolate: false`이며, `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정합니다.
- `pnpm test:live`: provider 라이브 테스트(minimax/zai)를 실행합니다. 건너뛰기를 해제하려면 API 키와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요합니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하고, `/api/models`를 확인한 다음, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 라이브 모델 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반적인 단위/e2e 스위트처럼 CI에서 안정적일 것으로 기대되지는 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 다음, 실제 stdio 브리지를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 단언은 원시 stdio MCP 프레임을 직접 읽으므로, 이 스모크는 브리지가 실제로 내보내는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 검사에는 다음을 실행하세요.

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

로드가 높은 호스트에서 `pnpm test`가 간헐적으로 실패하면, 회귀로 간주하기 전에 한 번 더 다시 실행한 다음 `pnpm test <path/to/test>`로 범위를 좁혀 분리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “한 단어로만 답하세요: ok. 구두점이나 추가 텍스트는 넣지 마세요.”

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

출력에는 각 명령의 `sampleCount`, 평균, p50, p95, 최소/최대, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로필을 기록하므로, 타이밍 측정과 프로필 캡처가 동일한 하니스를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5` 및 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5` 및 `warmup=1`을 사용해 체크인된 기준 fixture를 `test/fixtures/cli-startup-bench.json`에서 새로 고칩니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 새로 고치기
- `pnpm test:startup:bench:check`로 현재 결과를 fixture와 비교하기

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

지원되는 Docker Node 런타임(Node 24 기본값, Node 22 호환)에서 `qrcode-terminal`이 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```
