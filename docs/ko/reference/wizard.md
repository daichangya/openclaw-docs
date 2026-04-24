---
read_when:
    - 특정 온보딩 단계나 플래그 찾기
    - 비대화형 모드로 온보딩 자동화하기
    - 온보딩 동작 디버깅하기
sidebarTitle: Onboarding Reference
summary: 'CLI 온보딩 전체 참조: 모든 단계, 플래그, 구성 필드'
title: 온보딩 참조
x-i18n:
    generated_at: "2026-04-24T06:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

이 문서는 `openclaw onboard`의 전체 참조입니다.
상위 수준 개요는 [온보딩 (CLI)](/ko/start/wizard)를 참조하세요.

## 흐름 세부 사항 (로컬 모드)

<Steps>
  <Step title="기존 구성 감지">
    - `~/.openclaw/openclaw.json`이 존재하면 **Keep / Modify / Reset** 중 선택합니다.
    - 온보딩을 다시 실행해도 **Reset**을 명시적으로 선택하지 않는 한
      (또는 `--reset`을 전달하지 않는 한) 아무것도 지워지지 않습니다.
    - CLI `--reset`의 기본값은 `config+creds+sessions`이며, 작업공간도 제거하려면 `--reset-scope full`
      을 사용하세요.
    - 구성이 유효하지 않거나 레거시 키를 포함하면, wizard는 중단하고
      계속하기 전에 `openclaw doctor`를 실행하라고 요청합니다.
    - Reset은 `trash`를 사용하며 (`rm`은 절대 사용하지 않음), 다음 범위를 제공합니다:
      - 구성만
      - 구성 + 자격 증명 + 세션
      - 전체 재설정 (작업공간도 제거)
  </Step>
  <Step title="모델/인증">
    - **Anthropic API 키**: `ANTHROPIC_API_KEY`가 있으면 사용하고, 없으면 키를 요청한 뒤 데몬에서 쓸 수 있도록 저장합니다.
    - **Anthropic API 키**: 온보딩/구성에서 선호되는 Anthropic 어시스턴트 선택입니다.
    - **Anthropic setup-token**: 여전히 온보딩/구성에서 사용 가능하지만, OpenClaw는 이제 가능할 경우 Claude CLI 재사용을 선호합니다.
    - **OpenAI Code (Codex) subscription (OAuth)**: 브라우저 흐름, `code#state`를 붙여 넣습니다.
      - 모델이 설정되지 않았거나 이미 OpenAI 계열인 경우 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.
    - **OpenAI Code (Codex) subscription (device pairing)**: 짧은 수명의 디바이스 코드가 있는 브라우저 페어링 흐름입니다.
      - 모델이 설정되지 않았거나 이미 OpenAI 계열인 경우 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.
    - **OpenAI API 키**: `OPENAI_API_KEY`가 있으면 사용하고, 없으면 키를 요청한 뒤 인증 프로필에 저장합니다.
      - 모델이 설정되지 않았거나 `openai/*`, `openai-codex/*`인 경우 `agents.defaults.model`을 `openai/gpt-5.4`로 설정합니다.
    - **xAI (Grok) API 키**: `XAI_API_KEY`를 요청하고 xAI를 모델 provider로 구성합니다.
    - **OpenCode**: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth 에서 획득)를 요청하고 Zen 또는 Go 카탈로그를 선택하게 합니다.
    - **Ollama**: 먼저 **Cloud + Local**, **Cloud only**, **Local only**를 제안합니다. `Cloud only`는 `OLLAMA_API_KEY`를 요청하고 `https://ollama.com`을 사용합니다. 호스트 기반 모드는 Ollama base URL을 요청하고, 사용 가능한 모델을 확인하며, 필요하면 선택된 로컬 모델을 자동으로 pull합니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 접근용으로 로그인되어 있는지도 확인합니다.
    - 자세한 내용: [Ollama](/ko/providers/ollama)
    - **API 키**: 키를 대신 저장합니다.
    - **Vercel AI Gateway (다중 모델 프록시)**: `AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
    - **MiniMax**: 구성이 자동으로 기록되며, 호스팅 기본값은 `MiniMax-M2.7`입니다.
      API 키 설정은 `minimax/...`를, OAuth 설정은
      `minimax-portal/...`를 사용합니다.
    - 자세한 내용: [MiniMax](/ko/providers/minimax)
    - **StepFun**: China 또는 global 엔드포인트의 StepFun standard 또는 Step Plan용 구성이 자동으로 기록됩니다.
    - Standard는 현재 `step-3.5-flash`를 포함하고, Step Plan도 `step-3.5-flash-2603`을 포함합니다.
    - 자세한 내용: [StepFun](/ko/providers/stepfun)
    - **Synthetic (Anthropic 호환)**: `SYNTHETIC_API_KEY`를 요청합니다.
    - 자세한 내용: [Synthetic](/ko/providers/synthetic)
    - **Moonshot (Kimi K2)**: 구성이 자동으로 기록됩니다.
    - **Kimi Coding**: 구성이 자동으로 기록됩니다.
    - 자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
    - **Skip**: 아직 인증이 구성되지 않습니다.
    - 감지된 옵션에서 기본 모델을 선택하거나(provider/model 직접 입력 가능), 가장 높은 품질과 더 낮은 프롬프트 인젝션 위험을 위해 provider 스택에서 사용 가능한 가장 강력한 최신 세대 모델을 선택하세요.
    - 온보딩은 모델 점검을 실행하고 구성된 모델이 알 수 없거나 인증이 없으면 경고합니다.
    - API 키 저장 모드는 기본적으로 평문 인증 프로필 값입니다. 대신 env 기반 ref를 저장하려면 `--secret-input-mode ref`를 사용하세요(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - 인증 프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다(API 키 + OAuth). `~/.openclaw/credentials/oauth.json`은 레거시 import 전용입니다.
    - 자세한 내용: [/concepts/oauth](/ko/concepts/oauth)
    <Note>
    헤드리스/서버 팁: 브라우저가 있는 머신에서 OAuth를 완료한 뒤,
    해당 에이전트의 `auth-profiles.json`(예:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, 또는 일치하는
    `$OPENCLAW_STATE_DIR/...` 경로)을 Gateway 호스트로 복사하세요. `credentials/oauth.json`
    은 레거시 import 소스 전용입니다.
    </Note>
  </Step>
  <Step title="작업공간">
    - 기본값은 `~/.openclaw/workspace` (구성 가능)
    - 에이전트 bootstrap ritual에 필요한 작업공간 파일을 시드합니다.
    - 전체 작업공간 레이아웃 + 백업 가이드: [에이전트 작업공간](/ko/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - 포트, bind, 인증 모드, Tailscale 노출.
    - 인증 권장 사항: 루프백에서도 **Token**을 유지하여 로컬 WS 클라이언트도 인증하도록 하세요.
    - 토큰 모드에서 대화형 설정은 다음을 제공합니다:
      - **평문 토큰 생성/저장** (기본값)
      - **SecretRef 사용** (선택적)
      - Quickstart는 온보딩 probe/dashboard bootstrap을 위해 `env`, `file`, `exec` provider 전반에서 기존 `gateway.auth.token` SecretRefs를 재사용합니다.
      - 해당 SecretRef가 구성되어 있지만 확인할 수 없으면, 온보딩은 런타임 인증을 조용히 저하시키는 대신 명확한 수정 메시지와 함께 조기에 실패합니다.
    - 비밀번호 모드에서도 대화형 설정은 평문 또는 SecretRef 저장을 지원합니다.
    - 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 환경 변수가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우가 아니라면 인증을 비활성화하지 마세요.
    - 비루프백 bind도 여전히 인증이 필요합니다.
  </Step>
  <Step title="채널">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인
    - [Telegram](/ko/channels/telegram): 봇 토큰
    - [Discord](/ko/channels/discord): 봇 토큰
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + webhook audience
    - [Mattermost](/ko/channels/mattermost) (Plugin): 봇 토큰 + base URL
    - [Signal](/ko/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성
    - [BlueBubbles](/ko/channels/bluebubbles): **iMessage에 권장**; 서버 URL + 비밀번호 + webhook
    - [iMessage](/ko/channels/imessage): 레거시 `imsg` CLI 경로 + DB 접근
    - DM 보안: 기본값은 페어링입니다. 첫 DM은 코드를 보내며, `openclaw pairing approve <channel> <code>`로 승인하거나 allowlist를 사용할 수 있습니다.
  </Step>
  <Step title="웹 검색">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily 같은 지원 provider를 선택하거나 건너뜁니다.
    - API 기반 provider는 빠른 설정을 위해 환경 변수 또는 기존 구성을 사용할 수 있고, 키가 필요 없는 provider는 provider별 전제 조건을 사용합니다.
    - `--skip-search`로 건너뛸 수 있습니다.
    - 나중에 구성: `openclaw configure --section web`.
  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요합니다. 헤드리스 환경에서는 커스텀 LaunchDaemon을 사용하세요(기본 제공되지 않음).
    - Linux (및 WSL2를 통한 Windows): systemd 사용자 유닛
      - 온보딩은 로그아웃 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`를 활성화하려고 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 기록). 먼저 sudo 없이 시도합니다.
    - **런타임 선택:** Node (권장; WhatsApp/Telegram에 필요). Bun은 **권장되지 않습니다**.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치는 이를 검증하지만 확인된 평문 토큰 값을 supervisor 서비스 환경 메타데이터에 영속 저장하지는 않습니다.
    - 토큰 인증에 토큰이 필요하지만 구성된 토큰 SecretRef가 확인되지 않으면, 데몬 설치는 실행 가능한 안내와 함께 차단됩니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드를 명시적으로 설정할 때까지 데몬 설치가 차단됩니다.
  </Step>
  <Step title="상태 확인">
    - 필요하면 Gateway를 시작하고 `openclaw health`를 실행합니다.
    - 팁: `openclaw status --deep`는 상태 출력에 라이브 Gateway 상태 프로브를 추가하며, 지원되는 경우 채널 프로브도 포함합니다(도달 가능한 Gateway 필요).
  </Step>
  <Step title="Skills (권장)">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - 노드 관리자를 선택하게 합니다: **npm / pnpm** (Bun은 권장되지 않음).
    - 선택적 의존성을 설치합니다 (일부는 macOS에서 Homebrew 사용).
  </Step>
  <Step title="마침">
    - 추가 기능을 위한 iOS/Android/macOS 앱을 포함한 요약 + 다음 단계 제공.
  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면, 온보딩은 브라우저를 여는 대신 Control UI용 SSH 포트 포워드 지침을 출력합니다.
Control UI 자산이 없으면 온보딩이 이를 빌드하려고 시도하며, 폴백은 `pnpm ui:build`입니다(UI 의존성 자동 설치).
</Note>

## 비대화형 모드

`--non-interactive`를 사용해 온보딩을 자동화하거나 스크립트화할 수 있습니다:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

머신 판독 가능한 요약을 원하면 `--json`을 추가하세요.

비대화형 모드에서 Gateway 토큰 SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token`과 `--gateway-token-ref-env`는 동시에 사용할 수 없습니다.

<Note>
`--json`은 **비대화형 모드를 의미하지 않습니다**. 스크립트에서는 `--non-interactive`(및 `--workspace`)를 사용하세요.
</Note>

provider별 명령 예시는 [CLI 자동화](/ko/start/wizard-cli-automation#provider-specific-examples)에 있습니다.
플래그 의미와 단계 순서는 이 참조 페이지를 사용하세요.

### 에이전트 추가 (비대화형)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway는 RPC를 통해 온보딩 흐름을 노출합니다(`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
클라이언트(macOS 앱, Control UI)는 온보딩 로직을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

## Signal 설정 (`signal-cli`)

온보딩은 GitHub 릴리스에서 `signal-cli`를 설치할 수 있습니다:

- 적절한 릴리스 아티팩트를 다운로드
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장
- 구성에 `channels.signal.cliPath` 기록

참고:

- JVM 빌드에는 **Java 21**이 필요합니다.
- 가능한 경우 네이티브 빌드를 사용합니다.
- Windows는 WSL2를 사용하며, signal-cli 설치는 WSL 내부에서 Linux 흐름을 따릅니다.

## wizard가 기록하는 것

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax를 선택한 경우)
- `tools.profile` (로컬 온보딩은 설정되지 않은 경우 기본값으로 `"coding"`을 사용하며, 기존 명시적 값은 유지됨)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (동작 세부 사항: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트에서 선택하면 채널 allowlist (Slack/Discord/Matrix/Microsoft Teams)도 기록됩니다(가능하면 이름을 ID로 확인).
- `skills.install.nodeManager`
  - `setup --node-manager`는 `npm`, `pnpm`, `bun`을 받습니다.
  - 수동 구성에서는 `skills.install.nodeManager`를 직접 설정하여 `yarn`도 계속 사용할 수 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

일부 채널은 Plugin 형태로 제공됩니다. 설정 중 이를 선택하면,
온보딩이 구성 전에 해당 Plugin을 설치하라고 요청합니다(npm 또는 로컬 경로).

## 관련 문서

- 온보딩 개요: [온보딩 (CLI)](/ko/start/wizard)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 구성 참조: [Gateway 구성](/ko/gateway/configuration)
- Provider: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord), [Google Chat](/ko/channels/googlechat), [Signal](/ko/channels/signal), [BlueBubbles](/ko/channels/bluebubbles) (iMessage), [iMessage](/ko/channels/imessage) (레거시)
- Skills: [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config)
