---
read_when:
    - 라이브 모델 매트릭스 / CLI 백엔드 / ACP / 미디어 제공자 스모크 실행하기
    - 라이브 테스트 자격 증명 확인 디버깅하기
    - 새 provider 전용 라이브 테스트 추가하기
sidebarTitle: Live tests
summary: '라이브(네트워크에 닿는) 테스트: 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자, 자격 증명'
title: '테스트: 라이브 제품군'
x-i18n:
    generated_at: "2026-04-24T06:18:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

빠른 시작, QA 러너, 단위/통합 제품군, Docker 흐름은
[테스트](/ko/help/testing)를 참조하세요. 이 페이지는 **라이브**(네트워크에 닿는) 테스트
제품군을 다룹니다: 모델 매트릭스, CLI 백엔드, ACP, 미디어 provider 라이브 테스트와
자격 증명 처리입니다.

## 라이브: Android Node 기능 전체 검사

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android Node가 현재 광고하는 **모든 명령**을 호출하고 명령 계약 동작을 검증합니다.
- 범위:
  - 사전 조건/수동 설정 필요(제품군은 앱을 설치/실행/페어링하지 않음)
  - 선택된 Android Node에 대한 명령별 Gateway `node.invoke` 검증
- 필수 사전 설정:
  - Android 앱이 이미 Gateway에 연결되고 페어링되어 있어야 함
  - 앱을 포그라운드 상태로 유지
  - 통과를 기대하는 기능에 대해 권한/캡처 동의가 부여되어 있어야 함
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android 설정 세부 정보: [Android 앱](/ko/platforms/android)

## 라이브: 모델 스모크(프로필 키)

라이브 테스트는 실패를 격리할 수 있도록 두 계층으로 나뉩니다:

- “직접 모델”은 주어진 키로 provider/모델이 실제로 응답할 수 있는지를 알려줍니다.
- “Gateway 스모크”는 해당 모델에 대해 전체 Gateway+에이전트 파이프라인이 동작하는지(세션, 기록, 도구, 샌드박스 정책 등)를 알려줍니다.

### 1계층: 직접 모델 완성(Gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별로 작은 completion 실행(필요한 경우 대상 회귀 포함)
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 제품군을 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정하세요. 그렇지 않으면 `pnpm test:live`가 Gateway 스모크에 집중되도록 건너뜁니다
- 모델 선택 방법:
  - 최신 허용 목록(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)을 실행하려면 `OPENCLAW_LIVE_MODELS=modern`
  - `OPENCLAW_LIVE_MODELS=all`은 최신 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (쉼표 구분 허용 목록)
  - 최신/all 전체 검사는 기본적으로 선별된 고신호 상한을 사용합니다. 완전한 최신 전체 검사는 `OPENCLAW_LIVE_MAX_MODELS=0`, 더 작은 상한은 양수로 설정하세요.
  - 전체 검사는 직접 모델 테스트 전체 시간 제한에 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`를 사용합니다. 기본값: 60분.
  - 직접 모델 프로브는 기본적으로 동시성 20으로 실행됩니다. 재정의하려면 `OPENCLAW_LIVE_MODEL_CONCURRENCY`를 설정하세요.
- provider 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (쉼표 구분 허용 목록)
- 키 출처:
  - 기본값: 프로필 저장소 및 환경 변수 폴백
  - **프로필 저장소만** 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 설정
- 존재 이유:
  - “provider API가 깨졌음 / 키가 유효하지 않음”과 “Gateway 에이전트 파이프라인이 깨졌음”을 분리
  - 작고 격리된 회귀 포함(예: OpenAI Responses/Codex Responses 추론 재생 + 도구 호출 흐름)

### 2계층: Gateway + dev 에이전트 스모크(“@openclaw”가 실제로 하는 일)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 인프로세스 Gateway 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델을 순회하며 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출이 동작함(read probe)
    - 선택적 추가 도구 프로브(`exec+read` probe)
    - OpenAI 회귀 경로(도구 호출만 → 후속 처리)가 계속 동작함
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` probe: 테스트가 워크스페이스에 nonce 파일을 쓰고, 에이전트에게 이를 `read`하고 nonce를 다시 말하라고 요청합니다.
  - `exec+read` probe: 테스트가 에이전트에게 temp 파일에 nonce를 `exec`로 쓰고, 다시 `read`하도록 요청합니다.
  - 이미지 프로브: 테스트가 생성한 PNG(고양이 + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환하기를 기대합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 최신 허용 목록(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 최신 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록)로 범위를 좁힘
  - 최신/all Gateway 전체 검사는 기본적으로 선별된 고신호 상한을 사용합니다. 완전한 최신 전체 검사는 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, 더 작은 상한은 양수로 설정하세요.
- provider 선택 방법(“OpenRouter 전부” 피하기):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (쉼표 구분 허용 목록)
- 도구 + 이미지 프로브는 이 라이브 테스트에서 항상 활성화됩니다:
  - `read` probe + `exec+read` probe (도구 스트레스)
  - 이미지 프로브는 모델이 이미지 입력 지원을 광고할 때 실행됨
  - 흐름(상위 수준):
    - 테스트가 “CAT” + 무작위 코드가 들어간 작은 PNG를 생성 (`src/gateway/live-image-probe.ts`)
    - `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 전송
    - Gateway가 첨부 파일을 `images[]`로 파싱 (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 내장 에이전트가 멀티모달 사용자 메시지를 모델에 전달
    - 검증: 응답에 `cat` + 코드가 포함됨(OCR 허용 오차: 사소한 실수는 허용)

팁: 자신의 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` ID)를 보려면 다음을 실행하세요:

```bash
openclaw models list
openclaw models list --json
```

## 라이브: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 구성을 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + 에이전트 파이프라인을 검증합니다.
- 백엔드별 스모크 기본값은 해당 백엔드를 소유한 확장의 `cli-backend.ts` 정의와 함께 존재합니다.
- 활성화:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 provider/모델: `claude-cli/claude-sonnet-4-6`
  - 명령/인수/이미지 동작은 해당 CLI 백엔드 Plugin 메타데이터에서 가져옴
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부 파일을 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (경로가 프롬프트에 주입됨)
  - 프롬프트 주입 대신 CLI 인수로 이미지 파일 경로를 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정되었을 때 이미지 인수 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 기본 Claude Sonnet -> Opus 동일 세션 연속성 프로브를 비활성화하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (선택된 모델이 전환 대상을 지원할 때 강제로 켜려면 `1`)

예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-cli-backend
```

단일 provider Docker 레시피:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 러너는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 안에서 비루트 `node` 사용자로 라이브 CLI 백엔드 스모크를 실행합니다.
- 소유 확장에서 CLI 스모크 메타데이터를 확인한 뒤, `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)의 캐시된 쓰기 가능 prefix에 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`은 `~/.claude/.credentials.json`의 `claudeAiOauth.subscriptionType` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 portable Claude Code subscription OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 검증한 다음, Anthropic API 키 환경 변수를 보존하지 않은 채 두 번의 Gateway CLI 백엔드 턴을 실행합니다. 이 subscription 레인은 Claude가 현재 정상 subscription 플랜 한도 대신 추가 사용량 과금을 통해 서드파티 앱 사용을 라우팅하기 때문에 Claude MCP/도구 및 이미지 프로브를 기본적으로 비활성화합니다.
- 라이브 CLI 백엔드 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 엔드 투 엔드 흐름을 실행합니다: 텍스트 턴, 이미지 분류 턴, 그리고 Gateway CLI를 통해 검증되는 MCP `cron` 도구 호출.
- Claude의 기본 스모크는 세션을 Sonnet에서 Opus로 패치하고, 재개된 세션이 여전히 이전 메모를 기억하는지도 검증합니다.

## 라이브: ACP 바인드 스모크 (`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: 라이브 ACP 에이전트로 실제 ACP 대화 바인드 흐름을 검증합니다:
  - `/acp spawn <agent> --bind here` 전송
  - 합성 메시지 채널 대화를 제자리에서 바인딩
  - 같은 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인딩된 ACP 세션 전사에 도착하는지 검증
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...`용 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 참고:
  - 이 레인은 Gateway `chat.send` 표면과 관리자 전용 합성 originating-route 필드를 사용하므로, 외부로 전달되는 것처럼 가장하지 않고도 테스트가 메시지 채널 컨텍스트를 붙일 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않으면, 테스트는 선택된 ACP 하네스 에이전트에 대해 내장 `acpx` Plugin의 내장 에이전트 레지스트리를 사용합니다.

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
pnpm test:docker:live-acp-bind:gemini
```

Docker 참고:

- Docker 러너는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 지원되는 모든 라이브 CLI 에이전트에 대해 ACP 바인드 스모크를 순서대로 실행합니다: `claude`, `codex`, 그다음 `gemini`.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`를 사용하세요.
- `~/.profile`을 소스로 읽고, 일치하는 CLI 인증 자료를 컨테이너에 준비하고, 쓰기 가능한 npm prefix에 `acpx`를 설치한 뒤, 요청된 라이브 CLI(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)가 없으면 설치합니다.
- Docker 내부에서 러너는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하여, 소스로 읽은 profile의 provider 환경 변수를 acpx가 자식 하네스 CLI에서 계속 사용할 수 있게 합니다.

## 라이브: Codex app-server 하네스 스모크

- 목표: 일반 Gateway `agent` 메서드를 통해 Plugin 소유 Codex 하네스를 검증합니다:
  - 번들된 `codex` Plugin 로드
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택
  - Codex 하네스를 강제로 사용해 `openai/gpt-5.2`에 첫 번째 Gateway 에이전트 턴 전송
  - 같은 OpenClaw 세션에 두 번째 턴을 전송하고 app-server
    스레드가 재개될 수 있는지 검증
  - 같은 Gateway 명령
    경로를 통해 `/codex status`와 `/codex models` 실행
  - 선택적으로 Guardian 검토가 있는 두 개의 승격 셸 프로브 실행: 승인되어야 하는 무해한
    명령 하나와, 에이전트가 다시 물어봐야 하도록 거부되어야 하는 가짜 비밀 업로드 하나
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `openai/gpt-5.2`
- 선택적 이미지 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/도구 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 선택적 Guardian 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 이 스모크는 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 설정하므로, 깨진 Codex
  하네스가 조용히 PI로 폴백하여 통과할 수 없습니다.
- 인증: 로컬 Codex subscription 로그인에서 가져온 Codex app-server 인증.
  Docker 스모크는 해당되는 경우 Codex가 아닌 프로브를 위한 `OPENAI_API_KEY`도 제공할 수 있으며,
  선택적으로 복사된 `~/.codex/auth.json` 및 `~/.codex/config.toml`도 사용할 수 있습니다.

로컬 레시피:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 레시피:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 참고:

- Docker 러너는 `scripts/test-live-codex-harness-docker.sh`에 있습니다.
- 마운트된 `~/.profile`을 소스로 읽고, `OPENAI_API_KEY`를 전달하고, Codex CLI
  인증 파일이 있으면 복사하고, 쓰기 가능한 마운트된 npm
  prefix에 `@openai/codex`를 설치하고, 소스 트리를 준비한 다음, Codex 하네스 라이브 테스트만 실행합니다.
- Docker는 기본적으로 이미지, MCP/도구, Guardian 프로브를 활성화합니다. 더 좁은 디버그
  실행이 필요하면
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`를 설정하세요.
- Docker는 또한 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 내보내며, 이는 라이브
  테스트 구성과 일치하므로 레거시 별칭이나 PI 폴백이 Codex 하네스
  회귀를 숨길 수 없습니다.

### 권장 라이브 레시피

좁고 명시적인 허용 목록이 가장 빠르고 가장 덜 불안정합니다:

- 단일 모델, 직접 실행(Gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, Gateway 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에 걸친 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 중심(Gemini API 키 + Antigravity):
  - Gemini (API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 스타일 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 사용자 머신의 로컬 Gemini CLI를 사용합니다(별도 인증 + 도구 동작 차이).
- Gemini API 대 Gemini CLI:
  - API: OpenClaw가 호스팅된 Google Gemini API를 HTTP로 호출합니다(API 키 / 프로필 인증). 대부분의 사용자가 “Gemini”라고 말할 때 의미하는 것이 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸로 호출합니다. 자체 인증을 가지며 다르게 동작할 수 있습니다(스트리밍/도구 지원/버전 차이).

## 라이브: 모델 매트릭스(무엇을 다루는가)

고정된 “CI 모델 목록”은 없습니다(라이브는 opt-in). 하지만 키가 있는 개발 머신에서 정기적으로 커버하기를 권장하는 모델은 다음과 같습니다.

### 최신 스모크 세트(도구 호출 + 이미지)

계속 동작하기를 기대하는 “일반 모델” 실행입니다:

- OpenAI (비-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (또는 `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview` (오래된 Gemini 2.x 모델은 피하세요)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + 이미지를 포함한 Gateway 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: 도구 호출(Read + 선택적 Exec)

provider 계열당 최소 하나는 선택하세요:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (또는 `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4` (또는 최신 사용 가능 버전)
- Mistral: `mistral/`… (활성화한 “tools” 가능 모델 하나 선택)
- Cerebras: `cerebras/`… (접근 권한이 있는 경우)
- LM Studio: `lmstudio/`… (로컬; 도구 호출은 API 모드에 따라 달라짐)

### 비전: 이미지 전송(첨부 파일 → 멀티모달 메시지)

`OPENCLAW_LIVE_GATEWAY_MODELS`에 이미지 지원 모델을 최소 하나 포함하세요(Claude/Gemini/OpenAI의 비전 지원 변형 등). 그래야 이미지 프로브를 실행할 수 있습니다.

### 애그리게이터 / 대체 Gateway

키가 활성화되어 있으면 다음을 통한 테스트도 지원합니다:

- OpenRouter: `openrouter/...` (수백 개 모델; 도구+이미지 지원 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen용 `opencode/...`, Go용 `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`로 인증)

라이브 매트릭스에 포함할 수 있는 더 많은 provider(자격 증명/구성이 있는 경우):

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(커스텀 엔드포인트): `minimax` (cloud/API), 그리고 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려 하지 마세요. 권위 있는 목록은 사용자의 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키의 조합입니다.

## 자격 증명(절대 커밋 금지)

라이브 테스트는 CLI와 같은 방식으로 자격 증명을 확인합니다. 실질적인 의미는 다음과 같습니다:

- CLI가 동작하면 라이브 테스트도 같은 키를 찾아야 합니다.
- 라이브 테스트가 “자격 증명 없음”이라고 하면 `openclaw models list` / 모델 선택을 디버깅하는 것과 같은 방식으로 디버깅하세요.

- 에이전트별 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (라이브 테스트에서 말하는 “프로필 키”가 이것입니다)
- 구성: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/` (존재할 경우 임시 라이브 홈에 복사되지만, 기본 프로필 키 저장소는 아님)
- 로컬 라이브 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈으로 복사합니다. 준비된 라이브 홈에서는 `workspace/`와 `sandboxes/`를 건너뛰고, `agents.*.workspace` / `agentDir` 경로 재정의를 제거하므로 프로브가 실제 호스트 워크스페이스에 닿지 않습니다.

환경 변수 키(예: `~/.profile`에 export됨)에 의존하려면, 로컬 테스트 전에 `source ~/.profile`을 실행하거나 아래 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram 라이브(오디오 전사)

- 테스트: `extensions/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan 라이브

- 테스트: `extensions/byteplus/live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow 미디어 라이브

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy 이미지, 비디오, `music_generate` 경로를 실행
  - `models.providers.comfy.<capability>`가 구성되지 않은 각 기능은 건너뜀
  - comfy workflow 제출, 폴링, 다운로드, Plugin 등록 변경 후 유용함

## 이미지 생성 라이브

- 테스트: `test/image-generation.runtime.live.test.ts`
- 명령: `pnpm test:live test/image-generation.runtime.live.test.ts`
- 하네스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 provider Plugin을 열거
  - 프로브 전에 로그인 셸(`~/.profile`)에서 누락된 provider 환경 변수를 로드
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 변수 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/프로필/모델이 없는 provider는 건너뜀
  - 공유 런타임 capability를 통해 기본 이미지 생성 변형을 실행:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 현재 커버되는 번들 provider:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 선택적 인증 동작:
  - 프로필 저장소 인증만 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 음악 생성 라이브

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 provider 경로를 실행
  - 현재 Google과 MiniMax를 커버
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider 환경 변수를 로드
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 변수 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/프로필/모델이 없는 provider는 건너뜀
  - 사용 가능한 경우 선언된 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력의 `generate`
    - provider가 `capabilities.edit.enabled`를 선언하면 `edit`
  - 현재 공유 레인 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 이 공유 전체 검사와 별도의 Comfy 라이브 파일
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 인증 동작:
  - 프로필 저장소 인증만 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 비디오 생성 라이브

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 provider 경로를 실행
  - 기본적으로 릴리스 안전 스모크 경로를 사용: FAL이 아닌 provider, provider당 하나의 text-to-video 요청, 1초 길이의 랍스터 프롬프트, 그리고 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`(기본값 `180000`)에서 가져온 provider별 작업 상한
  - provider 측 큐 지연이 릴리스 시간 대부분을 차지할 수 있으므로 기본적으로 FAL은 건너뜁니다. 명시적으로 실행하려면 `--video-providers fal` 또는 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하세요
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider 환경 변수를 로드
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 변수 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/프로필/모델이 없는 provider는 건너뜀
  - 기본적으로 `generate`만 실행
  - 사용 가능한 경우 선언된 변환 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 설정:
    - provider가 `capabilities.imageToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 전체 검사에서 버퍼 기반 로컬 이미지 입력을 허용하면 `imageToVideo`
    - provider가 `capabilities.videoToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 전체 검사에서 버퍼 기반 로컬 비디오 입력을 허용하면 `videoToVideo`
  - 현재 공유 전체 검사에서 선언되었지만 건너뛰는 `imageToVideo` provider:
    - 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하므로 `vydra`
  - provider 전용 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 `veo3` text-to-video와 기본적으로 원격 이미지 URL fixture를 사용하는 `kling` 레인을 실행
  - 현재 `videoToVideo` 라이브 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`일 때만 `runway`
  - 현재 공유 전체 검사에서 선언되었지만 건너뛰는 `videoToVideo` provider:
    - 현재 이 경로들이 원격 `http(s)` / MP4 참조 URL을 필요로 하므로 `alibaba`, `qwen`, `xai`
    - 현재 공유 Gemini/Veo 레인이 로컬 버퍼 기반 입력을 사용하고, 그 경로가 공유 전체 검사에서는 허용되지 않으므로 `google`
    - 현재 공유 레인에 조직별 비디오 inpaint/remix 접근 보장이 없으므로 `openai`
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 기본 전체 검사에 FAL을 포함한 모든 provider를 넣으려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 공격적인 스모크 실행을 위해 provider별 작업 상한을 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - 프로필 저장소 인증만 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 라이브 하네스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 이미지, 음악, 비디오 라이브 제품군을 저장소 네이티브 단일 진입점으로 실행
  - `~/.profile`에서 누락된 provider 환경 변수를 자동 로드
  - 기본적으로 현재 사용 가능한 인증이 있는 provider로 각 제품군을 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 quiet-mode 동작이 일관되게 유지됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 관련

- [테스트](/ko/help/testing) — 단위, 통합, QA, Docker 제품군
