---
read_when:
    - CLI 온보딩을 실행하거나 구성하고 있습니다
    - 새 머신을 설정하고 있습니다
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI 온보딩: gateway, workspace, 채널, Skills를 위한 안내형 설정'
title: 온보딩 (CLI)
x-i18n:
    generated_at: "2026-04-07T06:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# 온보딩 (CLI)

CLI 온보딩은 macOS,
Linux 또는 Windows(WSL2 경유, 강력 권장)에서 OpenClaw를 설정하는 **권장되는** 방법입니다.
이 흐름은 로컬 Gateway 또는 원격 Gateway 연결과 함께 채널, Skills,
워크스페이스 기본값을 하나의 안내형 흐름으로 구성합니다.

```bash
openclaw onboard
```

<Info>
가장 빠르게 첫 채팅을 시작하는 방법: Control UI를 여세요(채널 설정 불필요).  
`openclaw dashboard`를 실행하고 브라우저에서 채팅하세요. 문서: [Dashboard](/web/dashboard).
</Info>

나중에 다시 구성하려면 다음을 실행하세요.

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에는 `--non-interactive`를 사용하세요.
</Note>

<Tip>
CLI 온보딩에는 Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, Tavily 같은 provider를
선택할 수 있는 웹 검색 단계가 포함됩니다. 일부 provider는
API 키가 필요하고, 다른 일부는 키 없이 사용할 수 있습니다. 이것은 나중에
`openclaw configure --section web`으로도 구성할 수 있습니다. 문서: [웹 도구](/ko/tools/web).
</Tip>

## QuickStart와 Advanced

온보딩은 **QuickStart**(기본값)와 **Advanced**(전체 제어) 중 하나로 시작합니다.

<Tabs>
  <Tab title="QuickStart (기본값)">
    - 로컬 gateway (local loopback)
    - 워크스페이스 기본값(또는 기존 워크스페이스)
    - Gateway 포트 **18789**
    - Gateway 인증 **Token**(local loopback에서도 자동 생성)
    - 새 로컬 설정의 기본 도구 정책: `tools.profile: "coding"`(기존에 명시된 profile은 유지됨)
    - DM 격리 기본값: 로컬 온보딩은 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 기록합니다. 자세한 내용: [CLI Setup Reference](/ko/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **꺼짐**
    - Telegram + WhatsApp DM 기본값은 **allowlist**입니다(전화번호를 입력하라는 안내가 표시됨)
  </Tab>
  <Tab title="Advanced (전체 제어)">
    - 모든 단계(모드, 워크스페이스, gateway, 채널, daemon, Skills)를 노출합니다.
  </Tab>
</Tabs>

## 온보딩이 구성하는 항목

**로컬 모드(기본값)**에서는 다음 단계를 안내합니다.

1. **모델/Auth** — 지원되는 provider/auth 흐름(API 키, OAuth 또는 provider별 수동 인증) 중 하나를 선택합니다. 여기에는 Custom Provider
   (OpenAI 호환, Anthropic 호환 또는 Unknown 자동 감지)도 포함됩니다. 기본 모델도 선택합니다.
   보안 참고: 이 에이전트가 도구를 실행하거나 webhook/hooks 콘텐츠를 처리할 경우, 가능한 가장 강력한 최신 세대 모델을 선호하고 도구 정책을 엄격하게 유지하세요. 더 약하거나 오래된 등급은 프롬프트 주입에 더 취약합니다.
   비대화형 실행에서는 `--secret-input-mode ref`가 일반 텍스트 API 키 값 대신 env 기반 ref를 auth profile에 저장합니다.
   비대화형 `ref` 모드에서는 provider env var가 설정되어 있어야 하며, 해당 env var 없이 인라인 키 플래그를 전달하면 즉시 실패합니다.
   대화형 실행에서는 secret reference 모드를 선택하면 환경 변수 또는 구성된 provider ref(`file` 또는 `exec`)를 가리킬 수 있고, 저장 전에 빠른 사전 검증을 수행합니다.
   Anthropic의 경우, 대화형 온보딩/구성에서는 **Anthropic Claude CLI**를 선호되는 로컬 경로로, **Anthropic API key**를 권장되는 프로덕션 경로로 제공합니다. Anthropic setup-token도 지원되는 토큰 인증 경로로 계속 사용할 수 있습니다.
2. **워크스페이스** — 에이전트 파일의 위치입니다(기본값 `~/.openclaw/workspace`). bootstrap 파일을 시드합니다.
3. **Gateway** — 포트, bind address, auth mode, Tailscale 노출을 구성합니다.
   대화형 토큰 모드에서는 기본 일반 텍스트 토큰 저장을 선택하거나 SecretRef를 사용할 수 있습니다.
   비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **채널** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp 등을 포함한 내장 및 번들 채팅 채널을 구성합니다.
5. **Daemon** — LaunchAgent(macOS), systemd 사용자 유닛(Linux/WSL2), 또는 네이티브 Windows Scheduled Task를 설치하며, 사용자별 Startup 폴더 대체 경로도 제공합니다.
   토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, daemon 설치는 이를 검증하지만 해석된 토큰을 supervisor 서비스 환경 메타데이터에 저장하지는 않습니다.
   토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 해석할 수 없는 경우, daemon 설치는 실행 가능한 안내와 함께 차단됩니다.
   `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, mode가 명시적으로 설정될 때까지 daemon 설치는 차단됩니다.
6. **상태 확인** — Gateway를 시작하고 실행 중인지 확인합니다.
7. **Skills** — 권장 Skills와 선택적 종속성을 설치합니다.

<Note>
온보딩을 다시 실행해도 명시적으로 **Reset**을 선택하거나(`--reset`을 전달하는 경우 포함) 아무것도 지워지지 않습니다.
CLI `--reset`의 기본 범위는 config, credentials, sessions이며, workspace까지 포함하려면 `--reset-scope full`을 사용하세요.
config가 잘못되었거나 레거시 키를 포함하고 있으면, 온보딩은 먼저 `openclaw doctor`를 실행하라고 안내합니다.
</Note>

**원격 모드**는 로컬 클라이언트가 다른 위치의 Gateway에 연결하도록만 구성합니다.
원격 호스트에는 아무것도 설치하거나 변경하지 않습니다.

## 다른 에이전트 추가

별도의 워크스페이스,
세션 및 auth profile을 가진 개별 에이전트를 만들려면 `openclaw agents add <name>`를 사용하세요. `--workspace` 없이 실행하면 온보딩이 시작됩니다.

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 워크스페이스는 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- 수신 메시지를 라우팅하려면 `bindings`를 추가하세요(온보딩에서 설정 가능).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 전체 참조

상세한 단계별 설명과 config 출력은
[CLI Setup Reference](/ko/start/wizard-cli-reference)를 참조하세요.
비대화형 예시는 [CLI Automation](/ko/start/wizard-cli-automation)을 참조하세요.
RPC 세부 정보를 포함한 더 깊은 기술 참조는
[Onboarding Reference](/ko/reference/wizard)를 참조하세요.

## 관련 문서

- CLI 명령 참조: [`openclaw onboard`](/cli/onboard)
- 온보딩 개요: [Onboarding Overview](/ko/start/onboarding-overview)
- macOS 앱 온보딩: [Onboarding](/ko/start/onboarding)
- 에이전트 첫 실행 의식: [Agent Bootstrapping](/ko/start/bootstrapping)
