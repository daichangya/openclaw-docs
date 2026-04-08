---
read_when:
    - 로컬 또는 CI에서 테스트를 실행하는 경우
    - 모델/프로바이더 버그에 대한 회귀 테스트를 추가하는 경우
    - gateway + agent 동작을 디버깅하는 경우
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-08T02:18:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ace2c19bfc350780475f4348264a4b55be2b4ccbb26f0d33b4a6af34510943b5
    source_path: help/testing.md
    workflow: 15
---

# 테스트

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 러너가 있습니다.

이 문서는 “우리가 어떻게 테스트하는지”에 대한 가이드입니다:

- 각 스위트가 다루는 내용(그리고 의도적으로 _다루지 않는_ 내용)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 어떤 명령을 실행해야 하는지
- live 테스트가 자격 증명을 어떻게 찾고 모델/프로바이더를 어떻게 선택하는지
- 실제 모델/프로바이더 이슈에 대한 회귀 테스트를 추가하는 방법

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전 기대값): `pnpm build && pnpm check && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 타기팅은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Docker 기반 QA 사이트: `pnpm qa:lab:up`

테스트를 건드렸거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- Live 스위트(모델 + gateway tool/image 프로브): `pnpm test:live`
- 하나의 live 파일만 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

팁: 실패하는 사례 하나만 필요할 때는 아래에 설명된 allowlist 환경 변수를 사용해 live 테스트를 좁히는 편이 좋습니다.

## 테스트 스위트(무엇이 어디서 실행되는가)

스위트를 “현실성이 점점 높아지는” 순서로 생각하면 됩니다(그리고 불안정성/비용도 점점 증가):

### Unit / integration(기본값)

- 명령: `pnpm test`
- Config: 기존 범위별 Vitest 프로젝트에 대한 10개의 순차 샤드 실행(`vitest.full-*.config.ts`)
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, 그리고 `vitest.unit.config.ts`가 다루는 화이트리스트된 `ui` node 테스트 아래의 core/unit 인벤토리
- 범위:
  - 순수 unit 테스트
  - 프로세스 내 integration 테스트(gateway auth, 라우팅, tooling, 파싱, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
- 프로젝트 참고:
  - 타기팅하지 않은 `pnpm test`는 이제 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 11개의 더 작은 샤드 config(`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)를 실행합니다. 이렇게 하면 부하가 걸린 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않게 합니다.
  - `pnpm test --watch`는 멀티 샤드 watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 타깃을 먼저 범위별 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
  - `pnpm test:changed`는 diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우 변경된 git 경로를 동일한 범위별 레인으로 확장합니다. config/setup 편집은 여전히 넓은 루트 프로젝트 재실행으로 폴백합니다.
  - 선택된 `plugin-sdk` 및 `commands` 테스트도 `test/setup-openclaw-runtime.ts`를 건너뛰는 전용 경량 레인으로 라우팅되며, 상태가 있거나 런타임이 무거운 파일은 기존 레인에 남습니다.
  - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 변경 모드 실행 시 같은 경량 레인의 명시적 형제 테스트로 매핑되므로, 헬퍼 편집이 해당 디렉터리 전체의 무거운 스위트를 재실행하지 않도록 합니다.
  - `auto-reply`는 이제 세 개의 전용 버킷을 가집니다: 최상위 core 헬퍼, 최상위 `reply.*` integration 테스트, 그리고 `src/auto-reply/reply/**` 하위 트리. 이렇게 하면 가장 무거운 reply 하니스 작업이 저렴한 status/chunk/token 테스트에 영향을 주지 않습니다.
- 임베디드 러너 참고:
  - 메시지-tool discovery 입력이나 compaction 런타임 컨텍스트를 변경할 때는
    두 수준의 커버리지를 모두 유지하세요.
  - 순수 라우팅/정규화 경계를 위한 집중 헬퍼 회귀 테스트를 추가하세요.
  - 또한 임베디드 러너 integration 스위트도 정상 상태로 유지하세요:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - 이 스위트들은 범위 지정된 id와 compaction 동작이 실제
    `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지를 검증합니다. 헬퍼 전용 테스트만으로는
    이러한 integration 경로를 충분히 대체할 수 없습니다.
- 풀 참고:
  - 기본 Vitest config는 이제 기본적으로 `threads`를 사용합니다.
  - 공유 Vitest config는 또한 `isolate: false`를 고정하고 루트 프로젝트, e2e, live config 전체에서 비격리 러너를 사용합니다.
  - 루트 UI 레인은 `jsdom` 설정과 optimizer를 유지하지만, 이제 공유 비격리 러너에서도 실행됩니다.
  - 각 `pnpm test` 샤드는 공유 Vitest config에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
  - 공유 `scripts/run-vitest.mjs` 런처는 이제 Vitest 자식 Node 프로세스에 기본적으로 `--no-maglev`도 추가해 대규모 로컬 실행 중 V8 컴파일 변동을 줄입니다. 기본 V8 동작과 비교해야 한다면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
- 빠른 로컬 반복 참고:
  - `pnpm test:changed`는 변경된 경로가 더 작은 스위트로 깔끔하게 매핑될 때 범위별 레인으로 라우팅합니다.
  - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅 동작을 유지하되 워커 상한만 더 높습니다.
  - 로컬 워커 자동 스케일링은 이제 의도적으로 더 보수적이며, 호스트 load average가 이미 높을 때도 자동으로 물러서므로 여러 개의 동시 Vitest 실행이 기본적으로 덜 해롭습니다.
  - 기본 Vitest config는 프로젝트/config 파일을 `forceRerunTriggers`로 표시하므로 테스트 배선이 변경될 때 changed 모드 재실행의 정확성이 유지됩니다.
  - 이 config는 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 계속 활성화합니다. 직접 프로파일링을 위한 명시적 캐시 위치 하나를 원한다면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
- 성능 디버그 참고:
  - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
  - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를 `origin/main` 이후 변경된 파일로 범위를 좁힙니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋 diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS 최대 RSS를 출력합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 현재 더티 트리를 기준으로 변경된 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest config를 통해 라우팅하여 벤치마크합니다.
  - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
  - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 상태에서 unit 스위트의 러너 CPU+heap 프로파일을 기록합니다.

### E2E(gateway 스모크)

- 명령: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- 런타임 기본값:
  - 저장소의 나머지 부분과 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2, 로컬: 기본 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행합니다.
- 유용한 override:
  - `OPENCLAW_E2E_WORKERS=<n>`으로 워커 수 강제 지정(상한 16).
  - `OPENCLAW_E2E_VERBOSE=1`로 자세한 콘솔 출력 재활성화.
- 범위:
  - 다중 인스턴스 gateway 종단 간 동작
  - WebSocket/HTTP 표면, node pairing, 그리고 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - unit 테스트보다 움직이는 부분이 더 많음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `test/openshell-sandbox.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작
  - 임시 로컬 Dockerfile에서 sandbox 생성
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드를 실행
  - sandbox fs bridge를 통한 원격 canonical filesystem 동작 검증
- 기대 사항:
  - 옵트인 전용, 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 정상 동작하는 Docker daemon 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 gateway와 sandbox를 삭제
- 유용한 override:
  - 더 넓은 e2e 스위트를 수동으로 실행할 때 이 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리나 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live(실제 프로바이더 + 실제 모델)

- 명령: `pnpm test:live`
- Config: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`가 **활성화**함(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 프로바이더/모델이 _오늘_ 실제 자격 증명으로 실제로 작동하는가?”
  - 프로바이더 형식 변경, tool-calling 특이점, auth 이슈, rate limit 동작 탐지
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 프로바이더 정책, 쿼터, 장애)
  - 비용이 들고 / rate limit를 사용함
  - “전부”보다 범위를 좁힌 부분집합 실행을 선호
- Live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 실제 홈 디렉터리를 사용하도록 의도적으로 원할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림은 숨기고 gateway bootstrap 로그/Bonjour 잡음은 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 로테이션(프로바이더별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나, live별 override로 `OPENCLAW_LIVE_*_KEY`를 설정하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/하트비트 출력:
  - Live 스위트는 이제 stderr로 진행 라인을 출력하므로, Vitest 콘솔 캡처가 조용하더라도 긴 프로바이더 호출이 눈에 띄게 활성 상태로 보입니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 프로바이더/gateway 진행 라인이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 하트비트는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/프로브 하트비트는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 의사결정 표를 사용하세요:

- 로직/테스트를 편집하는 경우: `pnpm test` 실행(많이 바꿨다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / pairing을 건드리는 경우: `pnpm test:e2e` 추가
- “내 봇이 다운됨” / 프로바이더별 실패 / tool calling을 디버깅하는 경우: 범위를 좁힌 `pnpm test:live` 실행

## Live: Android node capability 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android node가 현재 광고하는 **모든 명령**을 호출하고 명령 계약 동작을 검증
- 범위:
  - 사전 조건이 있는 수동 설정(스위트는 앱을 설치/실행/pairing하지 않음)
  - 선택된 Android node에 대한 명령별 gateway `node.invoke` 검증
- 필요한 사전 설정:
  - Android 앱이 이미 gateway에 연결되고 pairing되어 있어야 함
  - 앱이 foreground에 유지되어야 함
  - 통과를 기대하는 capability에 대해 권한/캡처 동의가 부여되어야 함
- 선택적 타깃 override:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android 설정 세부 정보: [Android App](/ko/platforms/android)

## Live: 모델 스모크(profile 키)

live 테스트는 실패를 분리할 수 있도록 두 계층으로 나뉩니다:

- “직접 모델”은 주어진 키로 프로바이더/모델이 최소한 응답할 수 있는지를 알려줍니다.
- “Gateway 스모크”는 전체 gateway+agent 파이프라인이 해당 모델에 대해 작동하는지를 알려줍니다(세션, 기록, 도구, sandbox 정책 등).

### 계층 1: 직접 모델 completion(gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별 작은 completion 실행(필요한 경우 타깃 회귀 테스트 포함)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 실제로 이 스위트를 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 `all`, modern의 별칭)을 설정하세요. 그렇지 않으면 `pnpm test:live`를 gateway 스모크 중심으로 유지하기 위해 건너뜁니다.
- 모델 선택 방법:
  - modern allowlist 실행: `OPENCLAW_LIVE_MODELS=modern`(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`은 modern allowlist의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`(쉼표 구분 allowlist)
- 프로바이더 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 구분 allowlist)
- 키 출처:
  - 기본값: profile store와 env 폴백
  - **profile store**만 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 설정
- 존재 이유:
  - “프로바이더 API가 깨졌음 / 키가 유효하지 않음”과 “gateway agent 파이프라인이 깨졌음”을 분리
  - 작고 고립된 회귀 테스트 포함(예: OpenAI Responses/Codex Responses 추론 재생 + tool-call 흐름)

### 계층 2: Gateway + dev agent 스모크(“@openclaw”가 실제로 하는 것)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내 gateway를 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 override)
  - 키가 있는 모델들을 순회하며 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출 작동(read probe)
    - 선택적 추가 도구 프로브(exec+read probe)
    - OpenAI 회귀 경로(tool-call-only → follow-up)가 계속 작동
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 workspace에 nonce 파일을 쓰고 에이전트에게 이를 `read`하고 nonce를 다시 말하도록 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 `exec`로 temp 파일에 nonce를 쓴 다음 다시 `read`하게 요청합니다.
  - image 프로브: 테스트가 생성된 PNG(cat + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환하길 기대합니다.
  - 구현 참고: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: modern allowlist(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 modern allowlist의 별칭
  - 또는 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록)로 범위 축소
- 프로바이더 선택 방법(“OpenRouter 전부” 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 구분 allowlist)
- tool + image 프로브는 이 live 테스트에서 항상 활성화됩니다:
  - `read` 프로브 + `exec+read` 프로브(tool 스트레스)
  - image 입력 지원을 광고하는 모델에 대해서는 image 프로브 실행
  - 흐름(상위 수준):
    - 테스트가 “CAT” + 무작위 코드가 있는 작은 PNG를 생성(`src/gateway/live-image-probe.ts`)
    - 이를 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`로 전송
    - gateway가 첨부 파일을 `images[]`로 파싱(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 임베디드 agent가 멀티모달 사용자 메시지를 모델로 전달
    - 검증: 응답에 `cat` + 코드가 포함됨(OCR 허용: 사소한 오류 허용)

팁: 현재 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` id)를 보려면 다음을 실행하세요:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 config를 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + agent 파이프라인을 검증
- 백엔드별 스모크 기본값은 해당 extension의 `cli-backend.ts` 정의와 함께 존재합니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 provider/model: `claude-cli/claude-sonnet-4-6`
  - 명령/args/image 동작은 해당 CLI 백엔드 plugin 메타데이터에서 가져옵니다.
- override(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부 파일을 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로는 프롬프트에 주입됨)
  - 프롬프트 주입 대신 이미지 파일 경로를 CLI args로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정되었을 때 이미지 args 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 기본 Claude Sonnet -> Opus 동일 세션 연속성 프로브를 비활성화하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`(선택된 모델이 switch 타깃을 지원할 때 강제 활성화하려면 `1`)
  
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

단일 프로바이더 Docker 레시피:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 러너는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 내부에서 비-root `node` 사용자로 live CLI-backend 스모크를 실행합니다.
- 해당 extension에서 CLI 스모크 메타데이터를 해석한 뒤, 캐시 가능한 쓰기 가능한 prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)에 해당 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 설치합니다.
- live CLI-backend 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 end-to-end 흐름을 실행합니다: 텍스트 턴, 이미지 분류 턴, 그다음 gateway CLI를 통해 검증되는 MCP `cron` 도구 호출.
- Claude의 기본 스모크는 또한 세션을 Sonnet에서 Opus로 패치하고, 재개된 세션이 이전 메모를 여전히 기억하는지 검증합니다.

## Live: ACP 바인드 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: live ACP agent와 함께 실제 ACP conversation-bind 흐름 검증:
  - `/acp spawn <agent> --bind here` 전송
  - 합성 메시지 채널 대화를 제자리에서 바인드
  - 같은 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인드된 ACP 세션 transcript에 도달하는지 검증
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker 내 ACP agent: `claude,codex,gemini`
  - 직접 `pnpm test:live ...`용 ACP agent: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 참고:
  - 이 레인은 gateway `chat.send` 표면을 사용하며, 테스트가 외부 전달을 가장하지 않고도 메시지 채널 컨텍스트를 부착할 수 있도록 admin 전용 synthetic originating-route 필드를 사용합니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않은 경우 테스트는 선택된 ACP 하니스 agent에 대해 임베디드 `acpx` plugin의 내장 agent registry를 사용합니다.

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

단일 agent Docker 레시피:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 참고:

- Docker 러너는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 지원되는 모든 live CLI agent(`claude`, `codex`, `gemini`)에 대해 ACP 바인드 스모크를 순서대로 실행합니다.
- 행렬 범위를 줄이려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`를 사용하세요.
- `~/.profile`을 source하고, 일치하는 CLI auth 자료를 컨테이너에 스테이징하며, 쓰기 가능한 npm prefix에 `acpx`를 설치한 뒤, 요청된 live CLI(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)가 없으면 설치합니다.
- Docker 내부에서 러너는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하여 source된 profile에서 가져온 프로바이더 env 변수를 자식 harness CLI에서 계속 사용할 수 있게 합니다.

### 권장 live 레시피

좁고 명시적인 allowlist가 가장 빠르고 가장 불안정성이 적습니다:

- 단일 모델, 직접(gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, gateway 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 프로바이더에 걸친 tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 중심(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth bridge(Cloud Code Assist 스타일 agent endpoint)를 사용합니다.
- `google-gemini-cli/...`는 머신의 로컬 Gemini CLI를 사용합니다(별도 auth + tooling 특이점).
- Gemini API vs Gemini CLI:
  - API: OpenClaw가 Google의 호스팅된 Gemini API를 HTTP를 통해 호출합니다(API 키 / profile auth). 대부분의 사용자가 “Gemini”라고 할 때 의미하는 것은 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸 실행합니다. 자체 auth가 있으며 다르게 동작할 수 있습니다(streaming/tool 지원/버전 차이).

## Live: 모델 매트릭스(무엇을 커버하는가)

고정된 “CI 모델 목록”은 없습니다(live는 옵트인). 하지만 키가 있는 개발 머신에서 정기적으로 커버하길 권장하는 모델은 다음과 같습니다.

### 최신 스모크 세트(tool calling + image)

우리가 계속 작동하길 기대하는 “일반 모델” 실행입니다:

- OpenAI(비-Codex): `openai/gpt-5.4`(선택 사항: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(오래된 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image와 함께 gateway 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: tool calling(Read + 선택적 Exec)

프로바이더 계열별로 최소 하나는 선택하세요:

- OpenAI: `openai/gpt-5.4`(또는 `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview`(또는 `google/gemini-3.1-pro-preview`)
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4`(또는 최신 사용 가능 모델)
- Mistral: `mistral/`…(활성화된 “tools” 지원 모델 하나 선택)
- Cerebras: `cerebras/`…(접근 권한이 있는 경우)
- LM Studio: `lmstudio/`…(로컬, tool calling은 API 모드에 따라 다름)

### 비전: image 전송(첨부 파일 → 멀티모달 메시지)

image 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 image-capable 모델 하나 이상(Claude/Gemini/OpenAI의 비전 지원 변형 등)을 포함하세요.

### 어그리게이터 / 대체 gateway

키가 활성화되어 있다면 다음을 통한 테스트도 지원합니다:

- OpenRouter: `openrouter/...`(수백 개의 모델, `openclaw models scan`으로 tool+image 지원 후보 찾기)
- OpenCode: Zen용 `opencode/...`, Go용 `opencode-go/...`(auth는 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

live 매트릭스에 포함할 수 있는 더 많은 프로바이더(자격 증명/config가 있는 경우):

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax`(클라우드/API), 그 외 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려고 하지 마세요. 권위 있는 목록은 현재 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키가 있는 것의 조합입니다.

## 자격 증명(절대 커밋 금지)

live 테스트는 CLI와 동일한 방식으로 자격 증명을 찾습니다. 실질적인 의미는 다음과 같습니다:

- CLI가 작동하면 live 테스트도 같은 키를 찾아야 합니다.
- live 테스트가 “자격 증명 없음”이라고 하면, `openclaw models list` / 모델 선택을 디버깅하듯 같은 방식으로 디버깅하세요.

- 에이전트별 auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(live 테스트에서 “profile 키”가 의미하는 것)
- Config: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 state 디렉터리: `~/.openclaw/credentials/`(존재할 경우 스테이징된 live 홈으로 복사되지만, 기본 profile-key 저장소는 아님)
- 로컬 live 실행은 기본적으로 활성 config, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI auth 디렉터리를 임시 테스트 홈으로 복사합니다. 스테이징된 live 홈은 `workspace/`와 `sandboxes/`를 건너뛰고, `agents.*.workspace` / `agentDir` 경로 override도 제거하므로 프로브가 실제 호스트 workspace를 건드리지 않습니다.

env 키(예: `~/.profile`에 export된 키)에 의존하고 싶다면, 로컬 테스트를 `source ~/.profile` 후 실행하거나 아래 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram live(오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `src/agents/byteplus.live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 선택적 모델 override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy image, video, `music_generate` 경로 실행
  - `models.providers.comfy.<capability>`가 구성되지 않은 capability는 각각 건너뜀
  - comfy workflow 제출, polling, 다운로드, 또는 plugin 등록을 변경한 뒤 유용함

## image 생성 live

- 테스트: `src/image-generation/runtime.live.test.ts`
- 명령: `pnpm test:live src/image-generation/runtime.live.test.ts`
- 하니스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 image-generation provider plugin 열거
  - 프로브 전에 로그인 셸(`~/.profile`)에서 누락된 provider env 변수를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 공유 런타임 capability를 통해 기본 image-generation 변형 실행:
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
  - profile-store auth를 강제하고 env 전용 override를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 음악 생성 live

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 music-generation provider 경로 실행
  - 현재 Google과 MiniMax를 커버
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider env 변수를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 사용 가능한 경우 선언된 런타임 모드를 모두 실행:
    - prompt 전용 입력으로 `generate`
    - 프로바이더가 `capabilities.edit.enabled`를 선언한 경우 `edit`
  - 현재 공유 레인 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 별도의 Comfy live 파일에서 다루며, 이 공유 스윕에서는 다루지 않음
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 auth 동작:
  - profile-store auth를 강제하고 env 전용 override를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 비디오 생성 live

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 video-generation provider 경로 실행
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider env 변수를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 프로바이더는 건너뜀
  - 사용 가능한 경우 선언된 런타임 모드를 모두 실행:
    - prompt 전용 입력으로 `generate`
    - 프로바이더가 `capabilities.imageToVideo.enabled`를 선언하고 선택된 provider/model이 공유 스윕에서 버퍼 기반 로컬 image 입력을 수용하는 경우 `imageToVideo`
    - 프로바이더가 `capabilities.videoToVideo.enabled`를 선언하고 선택된 provider/model이 공유 스윕에서 버퍼 기반 로컬 video 입력을 수용하는 경우 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` 프로바이더:
    - `vydra`: 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`은 원격 image URL이 필요하기 때문
  - 프로바이더별 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 기본적으로 원격 image URL fixture를 사용하는 `kling` 레인과 함께 `veo3` text-to-video를 실행합니다
  - 현재 `videoToVideo` live 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`일 때만 `runway`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` 프로바이더:
    - `alibaba`, `qwen`, `xai`: 이 경로들은 현재 원격 `http(s)` / MP4 참조 URL이 필요함
    - `google`: 현재 공유 Gemini/Veo 레인은 로컬 버퍼 기반 입력을 사용하며 이 경로는 공유 스윕에서 허용되지 않음
    - `openai`: 현재 공유 레인은 조직별 비디오 inpaint/remix 접근 보장을 제공하지 않음
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 선택적 auth 동작:
  - profile-store auth를 강제하고 env 전용 override를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 live 하니스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 image, music, video live 스위트를 하나의 저장소 네이티브 엔트리포인트로 실행
  - `~/.profile`에서 누락된 provider env 변수를 자동 로드
  - 기본적으로 현재 사용 가능한 auth가 있는 프로바이더로 각 스위트를 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 하트비트와 조용한 모드 동작이 일관되게 유지됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 러너(선택적인 "Linux에서도 작동" 확인)

이 Docker 러너는 두 가지 범주로 나뉩니다:

- Live-model 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 해당 profile-key live 파일만 저장소 Docker 이미지 내부에서 실행합니다(`src/agents/models.profiles.live.test.ts`와 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 config 디렉터리와 workspace를 마운트하며(마운트된 경우 `~/.profile`도 source함), 대응되는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕을 실용적으로 유지하기 위해 더 작은 스모크 상한을 기본으로 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`을 사용합니다. 더 큰 전체 스캔을 명시적으로 원할 때만 해당 env 변수를 override하세요.
- `test:docker:all`은 먼저 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤, 두 live Docker 레인에서 이를 재사용합니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:plugins`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live-model Docker 러너는 또한 필요한 CLI auth 홈만 바인드 마운트하며(또는 실행 범위가 좁혀지지 않은 경우 지원되는 모든 홈), 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 auth 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 scaffolding): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- Gateway 네트워킹(두 컨테이너, WS auth + health): `pnpm test:docker:gateway-network`(스크립트: `scripts/e2e/gateway-network-docker.sh`)
- MCP channel bridge(seed된 Gateway + stdio bridge + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels`(스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 의미론): `pnpm test:docker:plugins`(스크립트: `scripts/e2e/plugins-docker.sh`)

live-model Docker 러너는 또한 현재 체크아웃을 읽기 전용으로 바인드 마운트하고
컨테이너 내부의 임시 workdir로 스테이징합니다. 이렇게 하면 런타임
이미지를 가볍게 유지하면서도 정확한 로컬 소스/config로 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리 같은 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로
Docker live 실행이 머신별 artifact를 복사하느라 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway live 프로브가 컨테이너 내부에서
실제 Telegram/Discord 등의 channel 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker 레인에서
gateway live 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트가
활성화된 OpenClaw gateway 컨테이너를 시작하고, 그 gateway에 연결된 고정 버전 Open WebUI 컨테이너를 시작한 뒤,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 검증한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 전송합니다.
첫 실행은 Docker가 Open WebUI 이미지를 풀해야 하거나 Open WebUI 자체의 cold-start 설정을
마쳐야 할 수 있기 때문에 눈에 띄게 더 느릴 수 있습니다.
이 레인은 사용 가능한 live 모델 키를 기대하며, `OPENCLAW_PROFILE_FILE`
(기본값: `~/.profile`)이 Dockerized 실행에서 이를 제공하는 주요 방법입니다.
성공적인 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord, iMessage 계정이 필요하지 않습니다.
seed된 Gateway 컨테이너를 부팅하고, `openclaw mcp serve`를 실행하는 두 번째 컨테이너를 시작한 다음,
라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터,
live event queue 동작, outbound send 라우팅, 그리고 실제 stdio MCP bridge를 통한 Claude 스타일 channel +
permission 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로,
특정 client SDK가 우연히 표면화하는 것이 아니라 bridge가 실제로 내보내는 것을 검증합니다.

수동 ACP 자연어 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀 테스트/디버그 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env 변수:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)을 `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)을 `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)을 `/home/node/.profile`에 마운트하고 테스트 실행 전에 source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)을 Docker 내부의 캐시된 CLI 설치용으로 `/home/node/.npm-global`에 마운트
- `$HOME` 아래의 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 뒤 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트
  - 수동 override: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부의 provider를 필터링하려면 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 자격 증명이 profile store에서 오도록 보장하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI 스모크용으로 gateway가 노출할 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크에서 사용하는 nonce-check 프롬프트를 override하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI image 태그를 override하려면 `OPENWEBUI_IMAGE=...`

## 문서 sanity

문서 편집 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사도 필요할 때는 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

실제 프로바이더 없이도 “실제 파이프라인” 회귀 테스트를 수행합니다:

- Gateway tool calling(mock OpenAI, 실제 gateway + agent 루프): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 작성 + auth 강제): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## agent 신뢰성 평가(Skills)

이미 “agent 신뢰성 평가”처럼 동작하는 몇 가지 CI 안전 테스트가 있습니다:

- 실제 gateway + agent 루프를 통한 mock tool-calling(`src/gateway/gateway.test.ts`).
- 세션 배선과 config 효과를 검증하는 end-to-end wizard 흐름(`src/gateway/gateway.test.ts`).

Skills에 대해 아직 부족한 부분([Skills](/ko/tools/skills) 참조):

- **의사결정:** 프롬프트에 skills가 나열될 때 agent가 올바른 skill을 선택하는가(또는 관련 없는 것은 피하는가)?
- **준수:** agent가 사용 전에 `SKILL.md`를 읽고 필요한 단계/args를 따르는가?
- **워크플로 계약:** tool 순서, 세션 기록 이월, sandbox 경계를 검증하는 멀티턴 시나리오.

향후 평가는 먼저 결정적으로 유지되어야 합니다:

- tool 호출 + 순서, skill 파일 읽기, 세션 배선을 검증하기 위해 mock 프로바이더를 사용하는 시나리오 러너.
- skill 중심 시나리오의 작은 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션).
- CI 안전 스위트가 갖춰진 후에만 선택적으로 live 평가(옵트인, env 게이트).

## 계약 테스트(plugin 및 channel 형태)

계약 테스트는 등록된 모든 plugin과 channel이 해당
인터페이스 계약을 준수하는지 검증합니다. 발견된 모든 plugin을 순회하며
형태와 동작에 대한 assertion 스위트를 실행합니다. 기본 `pnpm test` unit 레인은
의도적으로 이러한 공유 seam 및 스모크 파일을 건너뜁니다. 공유 channel 또는 provider 표면을 건드렸다면
계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- Channel 계약만: `pnpm test:contracts:channels`
- Provider 계약만: `pnpm test:contracts:plugins`

### Channel 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - channel action handler
- **threading** - thread ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### Provider 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - channel 상태 프로브
- **registry** - plugin 레지스트리 형태

### Provider 계약

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - auth 흐름 계약
- **auth-choice** - auth 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - plugin discovery
- **loader** - plugin loading
- **runtime** - provider 런타임
- **shape** - plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- channel 또는 provider plugin을 추가하거나 수정한 후
- plugin 등록 또는 discovery를 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가(가이드)

live에서 발견한 provider/model 이슈를 수정할 때:

- 가능하면 CI 안전 회귀 테스트를 추가하세요(mock/stub provider 또는 정확한 request-shape 변환 캡처)
- 본질적으로 live 전용이라면(rate limit, auth 정책) live 테스트는 좁게 유지하고 env 변수로 옵트인하게 하세요
- 버그를 잡아내는 가장 작은 계층을 타기팅하는 편이 좋습니다:
  - provider 요청 변환/재생 버그 → 직접 모델 테스트
  - gateway 세션/기록/tool 파이프라인 버그 → gateway live 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 타깃 하나를 도출한 뒤, traversal-segment exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 타깃 계열을 추가한다면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 새 클래스가 조용히 건너뛰어지지 않도록, 분류되지 않은 타깃 id에 대해 의도적으로 실패합니다.
