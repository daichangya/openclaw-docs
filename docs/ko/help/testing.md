---
read_when:
    - 로컬 또는 CI에서 테스트를 실행할 때
    - 모델/프로바이더 버그에 대한 회귀 테스트를 추가할 때
    - 게이트웨이 + 에이전트 동작을 디버깅할 때
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 범위'
title: 테스트
x-i18n:
    generated_at: "2026-04-07T05:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77c61126344d03c7b04ccf1f9aba0381cf8c7c73042d69b2d9f3f07a5eba70d3
    source_path: help/testing.md
    workflow: 15
---

# 테스트

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소규모 Docker 러너 세트가 있습니다.

이 문서는 “우리가 테스트하는 방식” 안내서입니다:

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 다루지 않는 것은 무엇인지)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 어떤 명령을 실행해야 하는지
- live 테스트가 자격 증명을 어떻게 찾고 모델/프로바이더를 어떻게 선택하는지
- 실제 모델/프로바이더 문제에 대한 회귀 테스트를 추가하는 방법

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전 예상): `pnpm build && pnpm check && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 지정은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Docker 기반 QA 사이트: `pnpm qa:lab:up`

테스트를 수정했거나 더 높은 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- Live 스위트(모델 + 게이트웨이 tool/image 프로브): `pnpm test:live`
- 하나의 live 파일만 조용히 대상 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

팁: 실패하는 케이스 하나만 필요할 때는 아래 설명된 허용 목록 환경 변수를 사용해 live 테스트 범위를 좁히는 것을 우선하세요.

## 테스트 스위트(어디서 무엇이 실행되는가)

스위트를 “현실성이 점점 높아지는 것”으로 생각하세요(그리고 불안정성/비용도 증가합니다):

### Unit / integration (기본값)

- 명령: `pnpm test`
- 구성: 기존 범위 지정 Vitest 프로젝트에 대한 10개의 순차 샤드 실행(`vitest.full-*.config.ts`)
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`가 다루는 허용 목록 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - 프로세스 내 integration 테스트(게이트웨이 auth, 라우팅, 도구, 파싱, 구성)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
- 프로젝트 참고:
  - 대상 지정이 없는 `pnpm test`는 이제 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 10개의 더 작은 샤드 구성(`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않도록 합니다.
  - `pnpm test --watch`는 다중 샤드 watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적인 파일/디렉터리 대상을 먼저 범위 지정 lane으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 지불하지 않습니다.
  - `pnpm test:changed`는 변경 diff가 라우팅 가능한 소스/테스트 파일만 건드리는 경우 변경된 git 경로를 동일한 범위 지정 lane으로 확장합니다. config/setup 수정은 여전히 광범위한 루트 프로젝트 재실행으로 대체됩니다.
  - 선택된 `plugin-sdk` 및 `commands` 테스트도 `test/setup-openclaw-runtime.ts`를 건너뛰는 전용 경량 lane을 통해 라우팅됩니다. 상태가 있거나 런타임이 무거운 파일은 기존 lane에 남습니다.
  - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 변경 모드 실행을 해당 경량 lane의 명시적 형제 테스트로 매핑하므로, 헬퍼 수정 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
  - `auto-reply`는 이제 세 개의 전용 버킷을 가집니다: 최상위 core 헬퍼, 최상위 `reply.*` integration 테스트, `src/auto-reply/reply/**` 하위 트리. 이렇게 하면 가장 무거운 reply 하네스 작업이 가벼운 status/chunk/token 테스트에 영향을 주지 않습니다.
- 임베디드 러너 참고:
  - 메시지 tool 검색 입력이나 compaction 런타임 컨텍스트를 변경할 때는
    두 수준의 커버리지를 모두 유지하세요.
  - 순수 라우팅/정규화 경계에 대해서는 집중된 헬퍼 회귀 테스트를 추가하세요.
  - 그리고 임베디드 러너 integration 스위트도 정상 상태로 유지해야 합니다:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - 이 스위트들은 범위 지정된 ID와 compaction 동작이 실제
    `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. 헬퍼 전용 테스트만으로는
    이러한 integration 경로를 대체하기에 충분하지 않습니다.
- 풀 참고:
  - 기본 Vitest 구성은 이제 기본적으로 `threads`를 사용합니다.
  - 공유 Vitest 구성은 또한 `isolate: false`를 고정하고 루트 프로젝트, e2e, live 구성 전반에서 비격리 러너를 사용합니다.
  - 루트 UI lane은 `jsdom` 설정과 optimizer를 유지하지만, 이제 공유 비격리 러너에서도 실행됩니다.
  - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
  - 공유 `scripts/run-vitest.mjs` 런처는 이제 대규모 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`도 추가합니다. 기본 V8 동작과 비교해야 하면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
- 빠른 로컬 반복 참고:
  - `pnpm test:changed`는 변경 경로가 더 작은 스위트에 깔끔하게 매핑되면 범위 지정 lane을 통해 라우팅됩니다.
  - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅 동작을 유지하되 worker 상한만 더 높습니다.
  - 로컬 worker 자동 스케일링은 이제 의도적으로 보수적이며, 호스트 load average가 이미 높은 경우에도 물러나므로 여러 동시 Vitest 실행이 기본적으로 덜 해롭습니다.
  - 기본 Vitest 구성은 프로젝트/구성 파일을 `forceRerunTriggers`로 표시하여 테스트 wiring이 바뀔 때 changed-mode 재실행이 올바르게 유지되도록 합니다.
  - 이 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 계속 활성화합니다. 직접 프로파일링을 위한 명시적 캐시 위치가 필요하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
- 성능 디버그 참고:
  - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
  - `pnpm test:perf:imports:changed`는 `origin/main` 이후 변경된 파일로 동일한 프로파일링 보기를 범위 지정합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋된 diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS 최대 RSS를 출력합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 현재 더티 트리를 `scripts/test-projects.mjs`와 루트 Vitest 구성을 통해 변경 파일 목록에 라우팅해 벤치마크합니다.
  - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
  - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 unit 스위트에 대한 러너 CPU+heap 프로파일을 기록합니다.

### E2E (게이트웨이 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- 런타임 기본값:
  - 저장소의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 worker를 사용합니다(CI: 최대 2, 로컬: 기본값 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행됩니다.
- 유용한 재정의:
  - `OPENCLAW_E2E_WORKERS=<n>`으로 worker 수를 강제 설정(상한 16).
  - `OPENCLAW_E2E_VERBOSE=1`로 자세한 콘솔 출력을 다시 활성화.
- 범위:
  - 멀티 인스턴스 게이트웨이 end-to-end 동작
  - WebSocket/HTTP 표면, 노드 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - unit 테스트보다 움직이는 부분이 더 많음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `test/openshell-sandbox.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell 게이트웨이를 시작
  - 임시 로컬 Dockerfile로부터 샌드박스를 생성
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드를 실행
  - 샌드박스 fs bridge를 통해 원격 기준 파일 시스템 동작을 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 동작하는 Docker 데몬이 필요함
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 게이트웨이와 샌드박스를 제거함
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본값이 아닌 CLI 바이너리나 래퍼 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (실제 프로바이더 + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`에 의해 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 프로바이더/모델이 오늘 실제 자격 증명으로 실제로 동작하는가?”
  - 프로바이더 형식 변경, tool-calling 특이점, auth 문제, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 프로바이더 정책, 쿼터, 장애)
  - 비용이 들고 / rate limit을 사용함
  - “전부”보다 범위를 좁힌 하위 집합 실행을 권장
- Live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소싱합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈에 복사하므로 unit 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 의도적으로 실제 홈 디렉터리를 사용해야 할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가적인 `~/.profile` 알림과 게이트웨이 bootstrap 로그/Bonjour 잡음을 숨깁니다. 전체 시작 로그가 다시 필요하면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(프로바이더별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하세요(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`). 또는 live 전용 재정의로 `OPENCLAW_LIVE_*_KEY`를 사용하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/heartbeat 출력:
  - Live 스위트는 이제 진행 줄을 stderr로 출력하므로 Vitest 콘솔 캡처가 조용할 때도 긴 프로바이더 호출이 활성 상태임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 프로바이더/게이트웨이 진행 줄이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - 게이트웨이/프로브 heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

이 결정 표를 사용하세요:

- 로직/테스트를 수정 중: `pnpm test` 실행(많이 바꿨다면 `pnpm test:coverage`도)
- 게이트웨이 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 죽었어요” / 프로바이더별 실패 / tool calling 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## Live: Android 노드 기능 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android 노드가 현재 광고하는 **모든 명령을 호출**하고 명령 계약 동작을 검증
- 범위:
  - 전제 조건이 갖춰진 수동 설정(스위트는 앱을 설치/실행/페어링하지 않음)
  - 선택된 Android 노드에 대한 명령별 게이트웨이 `node.invoke` 검증
- 필요한 사전 설정:
  - Android 앱이 이미 게이트웨이에 연결되고 페어링되어 있어야 함.
  - 앱을 포그라운드 상태로 유지.
  - 통과를 기대하는 기능에 대해 권한/캡처 동의가 부여되어 있어야 함.
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- 전체 Android 설정 세부 정보: [Android 앱](/ko/platforms/android)

## Live: 모델 스모크(프로필 키)

Live 테스트는 두 계층으로 나뉘어 있으므로 실패를 분리할 수 있습니다:

- “직접 모델”은 주어진 키로 프로바이더/모델이 최소한 응답할 수 있는지를 알려줍니다.
- “게이트웨이 스모크”는 전체 게이트웨이+에이전트 파이프라인이 해당 모델에서 동작하는지(세션, 기록, 도구, 샌드박스 정책 등)를 알려줍니다.

### 계층 1: 직접 모델 completion (게이트웨이 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델을 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별로 작은 completion 실행(그리고 필요 시 대상 회귀 테스트)
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출할 때 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정해야 합니다. 그렇지 않으면 `pnpm test:live`를 게이트웨이 스모크 중심으로 유지하기 위해 건너뜁니다.
- 모델 선택 방법:
  - 현대 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)을 실행하려면 `OPENCLAW_LIVE_MODELS=modern`
  - `OPENCLAW_LIVE_MODELS=all`은 현대 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (쉼표 구분 허용 목록)
- 프로바이더 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (쉼표 구분 허용 목록)
- 키 출처:
  - 기본값: 프로필 저장소와 환경 변수 대체값
  - **프로필 저장소만** 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 설정
- 이 레이어가 존재하는 이유:
  - “프로바이더 API가 깨짐 / 키가 유효하지 않음”과 “게이트웨이 에이전트 파이프라인이 깨짐”을 분리
  - 작고 격리된 회귀를 담음(예: OpenAI Responses/Codex Responses reasoning replay + tool-call 흐름)

### 계층 2: 게이트웨이 + dev 에이전트 스모크(실제 "@openclaw"가 하는 일)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내 게이트웨이 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델들을 순회하고 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출이 동작함(read 프로브)
    - 선택적 추가 도구 프로브(exec+read 프로브)
    - OpenAI 회귀 경로(tool-call-only → follow-up)가 계속 동작함
- 프로브 세부 사항(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 workspace에 nonce 파일을 쓰고, 에이전트에게 이를 `read`한 뒤 nonce를 다시 말하게 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 `exec`로 임시 파일에 nonce를 쓰고, 다시 `read`하게 요청합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(고양이 + 랜덤 코드)를 첨부하고 모델이 `cat <CODE>`를 반환할 것으로 기대합니다.
  - 구현 참고: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출할 때 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 현대 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 현대 허용 목록의 별칭
  - 또는 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록) 설정
- 프로바이더 선택 방법(“OpenRouter 전부” 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (쉼표 구분 허용 목록)
- 이 live 테스트에서는 도구 + 이미지 프로브가 항상 켜져 있습니다:
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 모델이 이미지 입력 지원을 광고하면 이미지 프로브 실행
  - 흐름(고수준):
    - 테스트가 “CAT” + 랜덤 코드를 가진 작은 PNG를 생성합니다(`src/gateway/live-image-probe.ts`)
    - 이를 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 전송합니다
    - 게이트웨이는 첨부 파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 임베디드 에이전트는 멀티모달 사용자 메시지를 모델로 전달합니다
    - 검증: 답글에 `cat` + 해당 코드가 포함됨(OCR 허용 범위: 약간의 실수는 허용)

팁: 현재 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` ID)를 보려면 다음을 실행하세요:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI 백엔드 스모크(Codex CLI 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 구성을 건드리지 않고 로컬 CLI 백엔드를 사용해 게이트웨이 + 에이전트 파이프라인을 검증
- 활성화:
  - `pnpm test:live` (또는 Vitest를 직접 호출할 때 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 모델: `codex-cli/gpt-5.4`
  - 명령: `codex`
  - 인자: `["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부를 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로는 프롬프트에 주입됨)
  - 프롬프트 주입 대신 CLI 인자로 이미지 파일 경로를 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정된 경우 이미지 인자 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`

예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-cli-backend
```

참고:

- Docker 러너는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 내부에서 live CLI-backend 스모크를 비root `node` 사용자로 실행합니다.
- `codex-cli`의 경우 Linux `@openai/codex` 패키지를 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)의 캐시 가능한 쓰기 가능 prefix에 설치합니다.

## Live: ACP 바인드 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: live ACP 에이전트로 실제 ACP conversation-bind 흐름을 검증:
  - `/acp spawn <agent> --bind here` 전송
  - 합성 메시지 채널 대화를 제자리에서 바인드
  - 같은 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인드된 ACP 세션 transcript에 들어가는지 검증
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex`
  - 직접 `pnpm test:live ...`용 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 참고:
  - 이 lane은 admin 전용 합성 originating-route 필드가 포함된 게이트웨이 `chat.send` 표면을 사용하므로, 테스트가 외부 전달을 가장하지 않고 메시지 채널 컨텍스트를 부착할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않으면 테스트는 선택된 ACP 하네스 에이전트에 대해 임베디드 `acpx` 플러그인의 내장 에이전트 레지스트리를 사용합니다.

예시:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-acp-bind
```

단일 에이전트 Docker 레시피:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
```

Docker 참고:

- Docker 러너는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 지원되는 두 live CLI 에이전트 `claude`, `codex`에 대해 ACP 바인드 스모크를 순차적으로 실행합니다.
- 매트릭스 범위를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`를 사용하세요.
- `~/.profile`을 소싱하고, 일치하는 CLI auth 자료를 컨테이너로 스테이징하고, 쓰기 가능한 npm prefix에 `acpx`를 설치한 다음, 없으면 요청한 live CLI(`@anthropic-ai/claude-code` 또는 `@openai/codex`)를 설치합니다.
- Docker 내부에서 러너는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하므로 acpx가 소싱된 프로필의 프로바이더 환경 변수를 자식 하네스 CLI에 계속 사용할 수 있습니다.

### 권장 live 레시피

범위를 좁힌 명시적 허용 목록이 가장 빠르고 가장 덜 불안정합니다:

- 단일 모델, 직접(게이트웨이 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, 게이트웨이 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 프로바이더에 걸친 tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 집중(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 스타일 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 머신의 로컬 Gemini CLI를 사용합니다(별도 auth + 도구 특이점).
- Gemini API 대 Gemini CLI:
  - API: OpenClaw가 HTTP를 통해 Google의 호스팅된 Gemini API를 호출합니다(API 키 / 프로필 auth). 대부분 사용자가 “Gemini”라고 말할 때 의미하는 것이 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸 실행합니다. 자체 auth를 가지며 다르게 동작할 수 있습니다(스트리밍/도구 지원/버전 차이).

## Live: 모델 매트릭스(무엇을 커버하는가)

고정된 “CI 모델 목록”은 없습니다(live는 옵트인). 하지만 키가 있는 개발 머신에서 정기적으로 커버할 것을 **권장**하는 모델은 다음과 같습니다.

### 현대 스모크 세트(tool calling + image)

우리가 계속 동작하기를 기대하는 “일반적인 모델” 실행입니다:

- OpenAI (비-Codex): `openai/gpt-5.4` (선택 사항: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (또는 `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview` (이전 Gemini 2.x 모델은 피하세요)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + 이미지로 게이트웨이 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: tool calling (Read + 선택적 Exec)

프로바이더 계열당 최소 하나를 선택하세요:

- OpenAI: `openai/gpt-5.4` (또는 `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (또는 `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4` (또는 최신 उपलब्ध 모델)
- Mistral: `mistral/`… (활성화한 “tools” 가능 모델 하나 선택)
- Cerebras: `cerebras/`… (접근 권한이 있는 경우)
- LM Studio: `lmstudio/`… (로컬, tool calling은 API 모드에 따라 다름)

### Vision: 이미지 전송(첨부 파일 → 멀티모달 메시지)

이미지 프로브를 실행하려면 이미지 입력이 가능한 모델 하나 이상을 `OPENCLAW_LIVE_GATEWAY_MODELS`에 포함하세요(Claude/Gemini/OpenAI 비전 가능 변형 등).

### 집계기 / 대체 게이트웨이

키가 활성화되어 있다면 다음을 통한 테스트도 지원합니다:

- OpenRouter: `openrouter/...` (수백 개의 모델, tool+image 가능 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen용 `opencode/...`, Go용 `opencode-go/...` (auth는 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

자격 증명/구성이 있다면 live 매트릭스에 포함할 수 있는 추가 프로바이더:

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax` (클라우드/API), 그리고 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려고 하지 마세요. 권위 있는 목록은 현재 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키에 따라 달라집니다.

## 자격 증명(절대 커밋 금지)

Live 테스트는 CLI와 동일한 방식으로 자격 증명을 찾습니다. 실질적인 의미는 다음과 같습니다:

- CLI가 동작하면 live 테스트도 같은 키를 찾아야 합니다.
- live 테스트가 “자격 증명 없음”이라고 하면 `openclaw models list` / 모델 선택을 디버깅하는 것과 같은 방식으로 디버깅하세요.

- 에이전트별 auth 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live 테스트에서 “프로필 키”가 의미하는 것)
- 구성: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/` (있으면 스테이징된 live 홈으로 복사되지만, 주요 프로필 키 저장소는 아님)
- Live 로컬 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI auth 디렉터리를 임시 테스트 홈에 복사합니다. 이때 스테이징된 구성에서 `agents.*.workspace` / `agentDir` 경로 재정의는 제거되므로 프로브가 실제 호스트 workspace에 영향을 주지 않습니다.

환경 변수 키(예: `~/.profile`에 export된 것)에 의존하려면 `source ~/.profile` 후 로컬 테스트를 실행하거나 아래 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram live (오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `src/agents/byteplus.live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy 이미지, 비디오, `music_generate` 경로를 실행
  - `models.providers.comfy.<capability>`가 구성되지 않으면 각 기능을 건너뜀
  - comfy workflow 제출, 폴링, 다운로드, 플러그인 등록을 변경한 후 유용함

## 이미지 생성 live

- 테스트: `src/image-generation/runtime.live.test.ts`
- 명령: `pnpm test:live src/image-generation/runtime.live.test.ts`
- 하네스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 프로바이더 플러그인을 열거
  - 프로빙 전에 로그인 셸(`~/.profile`)에서 누락된 프로바이더 환경 변수를 로드
  - 기본적으로 저장된 auth 프로필보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 공유 런타임 기능을 통해 기본 이미지 생성 변형을 실행:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 현재 커버되는 번들 프로바이더:
  - `openai`
  - `google`
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 선택적 auth 동작:
  - 프로필 저장소 auth를 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 음악 생성 live

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 프로바이더 경로를 실행
  - 현재 Google과 MiniMax를 다룸
  - 프로빙 전에 로그인 셸(`~/.profile`)에서 프로바이더 환경 변수를 로드
  - 기본적으로 저장된 auth 프로필보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 사용할 수 있을 때 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력의 `generate`
    - 프로바이더가 `capabilities.edit.enabled`를 선언하면 `edit`
  - 현재 공유 lane 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 별도의 Comfy live 파일에서 다루며, 이 공유 스윕에는 포함되지 않음
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 auth 동작:
  - 프로필 저장소 auth를 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 비디오 생성 live

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 프로바이더 경로를 실행
  - 프로빙 전에 로그인 셸(`~/.profile`)에서 프로바이더 환경 변수를 로드
  - 기본적으로 저장된 auth 프로필보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 사용할 수 있을 때 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력의 `generate`
    - 프로바이더가 `capabilities.imageToVideo.enabled`를 선언하고 선택된 프로바이더/모델이 공유 스윕에서 버퍼 기반 로컬 이미지 입력을 허용하면 `imageToVideo`
    - 프로바이더가 `capabilities.videoToVideo.enabled`를 선언하고 선택된 프로바이더/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용하면 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` 프로바이더:
    - `vydra`: 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하기 때문
  - 프로바이더별 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 기본적으로 원격 이미지 URL 픽스처를 사용하는 `kling` lane과 함께 `veo3` text-to-video를 실행합니다
  - 현재 `videoToVideo` live 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`인 경우의 `runway`만 해당
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` 프로바이더:
    - `alibaba`, `qwen`, `xai`: 이 경로들은 현재 원격 `http(s)` / MP4 참조 URL이 필요하기 때문
    - `google`: 현재 공유 Gemini/Veo lane은 로컬 버퍼 기반 입력을 사용하며 이 경로는 공유 스윕에서 허용되지 않기 때문
    - `openai`: 현재 공유 lane은 조직별 비디오 inpaint/remix 액세스를 보장하지 않기 때문
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 선택적 auth 동작:
  - 프로필 저장소 auth를 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 live 하네스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 이미지, 음악, 비디오 live 스위트를 하나의 저장소 기본 엔트리포인트를 통해 실행
  - `~/.profile`에서 누락된 프로바이더 환경 변수를 자동 로드
  - 기본적으로 현재 사용 가능한 auth를 가진 프로바이더로 각 스위트 범위를 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 heartbeat와 quiet-mode 동작이 일관되게 유지됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 러너(선택적 "Linux에서도 동작하는가" 검사)

이 Docker 러너는 두 부류로 나뉩니다:

- Live-model 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 내부에서 일치하는 프로필 키 live 파일(`src/agents/models.profiles.live.test.ts`와 `src/gateway/gateway-models.profiles.live.test.ts`)만 실행하며, 로컬 config 디렉터리와 workspace를 마운트합니다(`~/.profile`이 마운트된 경우 이를 소싱함). 일치하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕을 실용적으로 유지하기 위해 기본적으로 더 작은 스모크 상한을 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`를 사용하고,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`을 사용합니다. 더 큰 포괄 스캔을 명시적으로 원할 때는
  해당 환경 변수를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 다음, 이를 두 개의 live Docker lane에서 재사용합니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:plugins`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

Live-model Docker 러너는 또한 필요한 CLI auth 홈만 bind mount한 뒤(또는 실행이 좁혀지지 않은 경우 지원되는 모든 것), 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 auth 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- 게이트웨이 + dev 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 scaffolding): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- 게이트웨이 네트워킹(두 컨테이너, WS auth + health): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + raw Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- 플러그인(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 의미론): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)

Live-model Docker 러너는 또한 현재 체크아웃을 읽기 전용으로 bind mount하고
이를 컨테이너 내부의 임시 workdir로 스테이징합니다. 이렇게 하면 런타임
이미지를 슬림하게 유지하면서도 정확히 현재 로컬 소스/구성에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 대형 로컬 전용 캐시와 앱 빌드 출력물
예: `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고 앱 로컬 `.build` 또는
Gradle 출력 디렉터리를 건너뛰므로 Docker live 실행이 머신별 아티팩트를
복사하느라 몇 분씩 소비하지 않습니다.
또한 컨테이너 내부에서 실제 Telegram/Discord 등 채널 워커를 시작하지 않도록
`OPENCLAW_SKIP_CHANNELS=1`도 설정합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로
이 Docker lane에서 게이트웨이 live 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트를
활성화한 OpenClaw 게이트웨이 컨테이너를 시작하고,
해당 게이트웨이에 연결된 고정 버전 Open WebUI 컨테이너를 시작하고,
Open WebUI를 통해 로그인한 다음, `/api/models`가 `openclaw/default`를 노출하는지 확인하고, 이어서
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 전송합니다.
첫 실행은 Docker가
Open WebUI 이미지를 pull해야 하거나 Open WebUI가 자체 cold-start 설정을 완료해야 하기 때문에 눈에 띄게 느릴 수 있습니다.
이 lane은 사용 가능한 live 모델 키를 기대하며, Dockerized 실행에서 이를 제공하는 기본 방법은
`OPENCLAW_PROFILE_FILE`(`~/.profile` 기본값)입니다.
성공적인 실행은 `{ "ok": true, "model":
"openclaw/default", ... }`와 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제
Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다. 시드된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 시작하는 두 번째 컨테이너를 시작한 다음,
실제 stdio MCP 브리지를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터,
live 이벤트 큐 동작, 아웃바운드 전송 라우팅, 그리고 Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는
raw stdio MCP 프레임을 직접 검사하므로, 이 스모크는 특정 클라이언트 SDK가
우연히 노출하는 내용이 아니라 브리지가 실제로 내보내는 내용을 검증합니다.

수동 ACP 자연어 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버깅 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`) → `/home/node/.profile`에 마운트되고 테스트 실행 전에 소싱됨
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부의 캐시된 CLI 설치용 `/home/node/.npm-global`에 마운트
- `$HOME` 아래의 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 프로바이더 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 디렉터리/파일만 마운트
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 프로바이더를 필터링하려면 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 자격 증명이 프로필 저장소에서 오도록 보장하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI 스모크용으로 게이트웨이가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크에서 사용하는 nonce-check 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 정상성 검사

문서를 수정한 후 문서 검사를 실행하세요: `pnpm check:docs`.
인페이지 제목 검사도 필요할 때는 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

이들은 실제 프로바이더 없이도 “실제 파이프라인” 회귀를 검증합니다:

- 게이트웨이 tool calling(mock OpenAI, 실제 게이트웨이 + 에이전트 루프): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- 게이트웨이 wizard(WS `wizard.start`/`wizard.next`, config + auth 쓰기 강제): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

우리는 이미 “에이전트 신뢰성 평가”처럼 동작하는 몇 가지 CI 안전 테스트를 가지고 있습니다:

- 실제 게이트웨이 + 에이전트 루프를 통한 mock tool-calling (`src/gateway/gateway.test.ts`).
- 세션 wiring과 config 효과를 검증하는 end-to-end wizard 흐름 (`src/gateway/gateway.test.ts`).

Skills에 대해 여전히 부족한 것([Skills](/ko/tools/skills) 참조):

- **의사결정:** 프롬프트에 skills가 나열될 때 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 것을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필요한 단계/인자를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 유지, 샌드박스 경계를 검증하는 다중 턴 시나리오.

향후 평가는 우선 결정적으로 유지해야 합니다:

- 도구 호출 + 순서, skill 파일 읽기, 세션 wiring을 검증하기 위해 mock 프로바이더를 사용하는 시나리오 러너.
- skill 중심 시나리오의 소규모 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션).
- 선택적 live 평가(옵트인, env-gated)는 CI 안전 스위트가 마련된 후에만 추가.

## 계약 테스트(플러그인 및 채널 형태)

계약 테스트는 등록된 모든 플러그인과 채널이 해당
인터페이스 계약을 준수하는지 검증합니다. 발견된 모든 플러그인을 순회하며
형태와 동작에 대한 일련의 단언을 실행합니다. 기본 `pnpm test` unit lane은 의도적으로
이 공유 seam 및 스모크 파일을 건너뛰므로, 공유 채널 또는 프로바이더 표면을 수정할 때는
계약 명령을 명시적으로 실행하세요.

### 명령

- 전체 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- 프로바이더 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 플러그인 형태(ID, 이름, 기능)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 페이로드 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 작업 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### 프로바이더 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - 채널 상태 프로브
- **registry** - 플러그인 레지스트리 형태

### 프로바이더 계약

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택
- **catalog** - 모델 카탈로그 API
- **discovery** - 플러그인 탐색
- **loader** - 플러그인 로딩
- **runtime** - 프로바이더 런타임
- **shape** - 플러그인 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- 채널 또는 프로바이더 플러그인을 추가하거나 수정한 후
- 플러그인 등록 또는 탐색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가(가이드)

live에서 발견된 프로바이더/모델 문제를 수정할 때:

- 가능하다면 CI 안전 회귀를 추가하세요(mock/stub 프로바이더 또는 정확한 요청 형태 변환을 캡처)
- 본질적으로 live 전용이라면(rate limit, auth 정책) live 테스트를 좁고 env var로 옵트인되도록 유지하세요
- 버그를 잡는 가장 작은 레이어를 대상으로 하는 것을 우선하세요:
  - 프로바이더 요청 변환/replay 버그 → 직접 모델 테스트
  - 게이트웨이 세션/기록/도구 파이프라인 버그 → 게이트웨이 live 스모크 또는 CI 안전 게이트웨이 mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 대상 하나를 도출한 다음, 순회 세그먼트 exec ID가 거부되는지 단언합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 패밀리를 추가하면 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 ID에서 의도적으로 실패하므로 새 클래스가 조용히 건너뛰어질 수 없습니다.
