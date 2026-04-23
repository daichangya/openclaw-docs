---
read_when:
    - '`openclaw onboard`의 자세한 동작이 필요합니다'
    - 온보딩 결과를 디버깅하거나 온보딩 클라이언트를 통합하는 중입니다
sidebarTitle: CLI reference
summary: CLI 설정 흐름, 인증/모델 설정, 출력, 내부 동작에 대한 전체 참조
title: CLI 설정 참조
x-i18n:
    generated_at: "2026-04-23T06:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI 설정 참조

이 페이지는 `openclaw onboard`의 전체 참조입니다.
짧은 가이드는 [온보딩 (CLI)](/ko/start/wizard)를 참조하세요.

## wizard가 수행하는 작업

로컬 모드(기본값)는 다음을 안내합니다.

- 모델 및 인증 설정(OpenAI Code 구독 OAuth, Anthropic Claude CLI 또는 API 키, 그리고 MiniMax, GLM, Ollama, Moonshot, StepFun, AI Gateway 옵션)
- 작업공간 위치 및 bootstrap 파일
- Gateway 설정(포트, bind, 인증, tailscale)
- 채널 및 provider(Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles 및 기타 번들 채널 Plugin)
- 데몬 설치(LaunchAgent, systemd user unit, 또는 기본 Windows Scheduled Task와 Startup-folder fallback)
- 상태 점검
- Skills 설정

원격 모드는 이 머신이 다른 곳의 gateway에 연결되도록 구성합니다.
원격 호스트에는 아무것도 설치하거나 수정하지 않습니다.

## 로컬 흐름 세부 정보

<Steps>
  <Step title="기존 config 감지">
    - `~/.openclaw/openclaw.json`이 존재하면 유지, 수정 또는 재설정을 선택합니다.
    - wizard를 다시 실행해도 명시적으로 재설정을 선택하지 않는 한(또는 `--reset`을 전달하지 않는 한) 아무것도 지워지지 않습니다.
    - CLI `--reset`의 기본값은 `config+creds+sessions`입니다. 작업공간까지 제거하려면 `--reset-scope full`을 사용하세요.
    - config가 유효하지 않거나 레거시 키를 포함하면 wizard는 중지되고 계속하기 전에 `openclaw doctor`를 실행하라고 안내합니다.
    - 재설정은 `trash`를 사용하며 다음 범위를 제공합니다.
      - config만
      - config + 자격 증명 + 세션
      - 전체 재설정(작업공간도 제거)
  </Step>
  <Step title="모델 및 인증">
    - 전체 옵션 매트릭스는 [인증 및 모델 옵션](#auth-and-model-options)에 있습니다.
  </Step>
  <Step title="작업공간">
    - 기본값 `~/.openclaw/workspace`(구성 가능).
    - 첫 실행 bootstrap ritual에 필요한 작업공간 파일을 시드합니다.
    - 작업공간 레이아웃: [에이전트 작업공간](/ko/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - 포트, bind, 인증 모드, tailscale 노출을 묻습니다.
    - 권장: loopback에서도 token 인증을 켜 두어 로컬 WS 클라이언트가 인증하도록 하세요.
    - token 모드에서 대화형 설정은 다음을 제공합니다.
      - **일반 텍스트 토큰 생성/저장** (기본값)
      - **SecretRef 사용** (opt-in)
    - password 모드에서도 대화형 설정은 일반 텍스트 또는 SecretRef 저장을 지원합니다.
    - 비대화형 token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 env var가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하세요.
    - non-loopback bind에도 여전히 인증이 필요합니다.
  </Step>
  <Step title="채널">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인
    - [Telegram](/ko/channels/telegram): 봇 토큰
    - [Discord](/ko/channels/discord): 봇 토큰
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + Webhook audience
    - [Mattermost](/ko/channels/mattermost): 봇 토큰 + 기본 URL
    - [Signal](/ko/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성
    - [BlueBubbles](/ko/channels/bluebubbles): iMessage에 권장. 서버 URL + password + Webhook
    - [iMessage](/ko/channels/imessage): 레거시 `imsg` CLI 경로 + DB 접근
    - DM 보안: 기본값은 페어링입니다. 첫 DM은 코드를 전송하며
      `openclaw pairing approve <channel> <code>`로 승인하거나 allowlist를 사용할 수 있습니다.
  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요합니다. 헤드리스 환경에서는 사용자 지정 LaunchDaemon을 사용하세요(기본 제공되지 않음).
    - Linux 및 WSL2를 통한 Windows: systemd user unit
      - wizard는 로그아웃 후에도 gateway가 유지되도록 `loginctl enable-linger <user>`를 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 기록). 먼저 sudo 없이 시도합니다.
    - 기본 Windows: Scheduled Task 우선
      - 작업 생성이 거부되면 OpenClaw는 사용자별 Startup-folder 로그인 항목으로 fallback하고 gateway를 즉시 시작합니다.
      - Scheduled Task가 더 나은 supervisor 상태를 제공하므로 여전히 선호됩니다.
    - 런타임 선택: Node(권장, WhatsApp과 Telegram에 필요). Bun은 권장되지 않습니다.
  </Step>
  <Step title="상태 점검">
    - 필요 시 gateway를 시작하고 `openclaw health`를 실행합니다.
    - `openclaw status --deep`는 지원되는 경우 채널 probe를 포함한 라이브 gateway 상태 probe를 status 출력에 추가합니다.
  </Step>
  <Step title="Skills">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - node manager로 npm, pnpm, bun 중 선택하게 합니다.
    - 선택적 의존성을 설치합니다(일부는 macOS에서 Homebrew 사용).
  </Step>
  <Step title="완료">
    - 요약과 다음 단계(iOS, Android, macOS 앱 옵션 포함)를 표시합니다.
  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 wizard는 브라우저를 여는 대신 Control UI용 SSH 포트 포워딩 지침을 출력합니다.
Control UI 자산이 없으면 wizard는 이를 빌드하려 시도합니다. fallback은 `pnpm ui:build`입니다(UI 의존성 자동 설치).
</Note>

## 원격 모드 세부 정보

원격 모드는 이 머신이 다른 곳의 gateway에 연결되도록 구성합니다.

<Info>
원격 모드는 원격 호스트에 아무것도 설치하거나 수정하지 않습니다.
</Info>

설정하는 항목:

- 원격 gateway URL (`ws://...`)
- 원격 gateway 인증이 필요한 경우 token(권장)

<Note>
- gateway가 loopback 전용이면 SSH 터널링 또는 tailnet을 사용하세요.
- 검색 힌트:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## 인증 및 모델 옵션

<AccordionGroup>
  <Accordion title="Anthropic API 키">
    `ANTHROPIC_API_KEY`가 있으면 이를 사용하고, 없으면 키를 묻고 데몬 사용을 위해 저장합니다.
  </Accordion>
  <Accordion title="OpenAI Code 구독 (OAuth)">
    브라우저 흐름입니다. `code#state`를 붙여 넣으세요.

    모델이 설정되지 않았거나 `openai/*`이면 `agents.defaults.model`을 `openai-codex/gpt-5.4`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI Code 구독 (디바이스 페어링)">
    짧은 수명의 디바이스 코드가 있는 브라우저 페어링 흐름입니다.

    모델이 설정되지 않았거나 `openai/*`이면 `agents.defaults.model`을 `openai-codex/gpt-5.4`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI API 키">
    `OPENAI_API_KEY`가 있으면 이를 사용하고, 없으면 키를 묻고 자격 증명을 인증 프로필에 저장합니다.

    모델이 설정되지 않았거나 `openai/*` 또는 `openai-codex/*`이면 `agents.defaults.model`을 `openai/gpt-5.4`로 설정합니다.

  </Accordion>
  <Accordion title="xAI (Grok) API 키">
    `XAI_API_KEY`를 묻고 xAI를 모델 provider로 구성합니다.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 묻고 Zen 또는 Go 카탈로그를 선택하게 합니다.
    설정 URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API 키 (일반)">
    키를 대신 저장합니다.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY`를 묻습니다.
    자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 묻습니다.
    자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    config가 자동으로 기록됩니다. 호스팅 기본값은 `MiniMax-M2.7`입니다. API 키 설정은
    `minimax/...`를 사용하고, OAuth 설정은 `minimax-portal/...`를 사용합니다.
    자세한 내용: [MiniMax](/ko/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    중국 또는 글로벌 엔드포인트용 StepFun standard 또는 Step Plan에 대해 config가 자동으로 기록됩니다.
    현재 standard에는 `step-3.5-flash`가 포함되며, Step Plan에는 `step-3.5-flash-2603`도 포함됩니다.
    자세한 내용: [StepFun](/ko/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic 호환)">
    `SYNTHETIC_API_KEY`를 묻습니다.
    자세한 내용: [Synthetic](/ko/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud 및 로컬 오픈 모델)">
    먼저 `Cloud + Local`, `Cloud only`, `Local only`를 묻습니다.
    `Cloud only`는 `https://ollama.com`과 함께 `OLLAMA_API_KEY`를 사용합니다.
    호스트 기반 모드는 기본 URL(기본값 `http://127.0.0.1:11434`)을 묻고, 사용 가능한 모델을 검색하며, 기본값을 제안합니다.
    `Cloud + Local`은 해당 Ollama 호스트가 cloud access용으로 로그인되어 있는지도 확인합니다.
    자세한 내용: [Ollama](/ko/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot 및 Kimi Coding">
    Moonshot(Kimi K2) 및 Kimi Coding config가 자동으로 기록됩니다.
    자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot).
  </Accordion>
  <Accordion title="사용자 지정 provider">
    OpenAI 호환 및 Anthropic 호환 엔드포인트에서 동작합니다.

    대화형 온보딩은 다른 provider API 키 흐름과 동일한 API 키 저장 선택지를 지원합니다.
    - **지금 API 키 붙여넣기** (일반 텍스트)
    - **비밀 참조 사용** (env ref 또는 구성된 provider ref, preflight 검증 포함)

    비대화형 플래그:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (선택 사항, `CUSTOM_API_KEY`로 fallback)
    - `--custom-provider-id` (선택 사항)
    - `--custom-compatibility <openai|anthropic>` (선택 사항, 기본값 `openai`)

  </Accordion>
  <Accordion title="건너뛰기">
    인증을 구성하지 않은 상태로 둡니다.
  </Accordion>
</AccordionGroup>

모델 동작:

- 감지된 옵션에서 기본 모델을 선택하거나, provider와 모델을 수동으로 입력합니다.
- 온보딩이 provider 인증 선택에서 시작되면 모델 선택기는
  해당 provider를 자동으로 우선시합니다. Volcengine 및 BytePlus의 경우 이 우선순위는
  해당 coding-plan 변형(`volcengine-plan/*`,
  `byteplus-plan/*`)에도 일치합니다.
- 선호 provider 필터 결과가 비게 되면, 모델이 없다고 표시하는 대신 전체 카탈로그로 fallback합니다.
- wizard는 모델 점검을 실행하고 구성된 모델을 알 수 없거나 인증이 없으면 경고합니다.

자격 증명 및 프로필 경로:

- 인증 프로필(API 키 + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 OAuth import: `~/.openclaw/credentials/oauth.json`

자격 증명 저장 모드:

- 기본 온보딩 동작은 API 키를 인증 프로필에 일반 텍스트 값으로 저장합니다.
- `--secret-input-mode ref`는 일반 텍스트 키 저장 대신 참조 모드를 활성화합니다.
  대화형 설정에서는 다음 중 하나를 선택할 수 있습니다.
  - 환경 변수 ref(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - provider 별칭 + ID가 있는 구성된 provider ref(`file` 또는 `exec`)
- 대화형 참조 모드는 저장 전에 빠른 preflight 검증을 실행합니다.
  - Env ref: 변수 이름과 현재 온보딩 환경에서의 비어 있지 않은 값을 검증합니다.
  - Provider ref: provider config를 검증하고 요청한 ID를 해석합니다.
  - preflight가 실패하면 온보딩은 오류를 보여 주고 다시 시도할 수 있게 합니다.
- 비대화형 모드에서 `--secret-input-mode ref`는 env 기반만 지원합니다.
  - 온보딩 프로세스 환경에 provider env var를 설정하세요.
  - 인라인 키 플래그(예: `--openai-api-key`)는 해당 env var가 설정되어 있어야 하며, 그렇지 않으면 온보딩이 빠르게 실패합니다.
  - 사용자 지정 provider의 경우 비대화형 `ref` 모드는 `models.providers.<id>.apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.
  - 이 사용자 지정 provider 경우 `--custom-api-key`는 `CUSTOM_API_KEY`가 설정되어 있어야 하며, 그렇지 않으면 온보딩이 빠르게 실패합니다.
- Gateway 인증 자격 증명은 대화형 설정에서 일반 텍스트와 SecretRef 선택을 지원합니다.
  - Token 모드: **일반 텍스트 토큰 생성/저장** (기본값) 또는 **SecretRef 사용**.
  - Password 모드: 일반 텍스트 또는 SecretRef.
- 비대화형 token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
- 기존 일반 텍스트 설정은 변경 없이 계속 동작합니다.

<Note>
헤드리스 및 서버 팁: 브라우저가 있는 머신에서 OAuth를 완료한 다음,
해당 에이전트의 `auth-profiles.json`(예:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 또는 일치하는
`$OPENCLAW_STATE_DIR/...` 경로)을 gateway 호스트로 복사하세요. `credentials/oauth.json`은 레거시 import 소스일 뿐입니다.
</Note>

## 출력 및 내부 동작

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax를 선택한 경우)
- `tools.profile` (로컬 온보딩은 설정되지 않은 경우 기본값으로 `"coding"`을 사용하며, 기존의 명시적 값은 유지됨)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (로컬 온보딩은 설정되지 않은 경우 이를 `per-channel-peer`로 기본 설정하며, 기존의 명시적 값은 유지됨)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트 중 opt-in한 경우의 채널 allowlist(Slack, Discord, Matrix, Microsoft Teams) (가능하면 이름을 ID로 해석)
- `skills.install.nodeManager`
  - `setup --node-manager` 플래그는 `npm`, `pnpm`, `bun`을 받을 수 있습니다.
  - 수동 config는 이후에도 `skills.install.nodeManager: "yarn"`을 설정할 수 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

<Note>
일부 채널은 Plugin으로 제공됩니다. 설정 중 선택하면 wizard는 채널 구성을 시작하기 전에
Plugin 설치(npm 또는 로컬 경로)를 요청합니다.
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

클라이언트(macOS 앱 및 Control UI)는 온보딩 로직을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

Signal 설정 동작:

- 적절한 릴리스 자산 다운로드
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장
- config에 `channels.signal.cliPath` 기록
- JVM 빌드에는 Java 21 필요
- 가능한 경우 기본 빌드 사용
- Windows는 WSL2를 사용하며 WSL 내부에서 Linux signal-cli 흐름을 따름

## 관련 문서

- 온보딩 허브: [온보딩 (CLI)](/ko/start/wizard)
- 자동화 및 스크립트: [CLI 자동화](/ko/start/wizard-cli-automation)
- 명령어 참조: [`openclaw onboard`](/cli/onboard)
