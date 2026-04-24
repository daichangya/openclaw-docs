---
read_when:
    - 처음부터 시작하는 첫 설정
    - 작동하는 채팅까지 가는 가장 빠른 경로를 원하는 경우
summary: 몇 분 안에 OpenClaw를 설치하고 첫 채팅을 시작하세요.
title: 시작하기
x-i18n:
    generated_at: "2026-04-24T06:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

OpenClaw를 설치하고, 온보딩을 실행하고, AI 비서와 채팅하세요 — 이 모든 과정을
약 5분 안에 마칠 수 있습니다. 끝나면 실행 중인 Gateway, 구성된 인증,
그리고 동작하는 채팅 세션을 갖게 됩니다.

## 준비물

- **Node.js** — Node 24 권장(Node 22.14+도 지원)
- 모델 provider의 **API 키**(Anthropic, OpenAI, Google 등) — 온보딩이 이를 물어봅니다

<Tip>
`node --version`으로 Node 버전을 확인하세요.
**Windows 사용자:** 네이티브 Windows와 WSL2 모두 지원됩니다. 전체 경험을 위해서는 WSL2가 더
안정적이며 권장됩니다. [Windows](/ko/platforms/windows)를 참조하세요.
Node 설치가 필요하신가요? [Node setup](/ko/install/node)을 참조하세요.
</Tip>

## 빠른 설정

<Steps>
  <Step title="OpenClaw 설치">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    다른 설치 방법(Docker, Nix, npm): [Install](/ko/install)
    </Note>

  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사는 모델 provider 선택, API 키 설정,
    Gateway 구성을 안내합니다. 약 2분 정도 걸립니다.

    전체 참조는 [Onboarding (CLI)](/ko/start/wizard)를 참조하세요.

  </Step>
  <Step title="Gateway가 실행 중인지 확인">
    ```bash
    openclaw gateway status
    ```

    Gateway가 18789 포트에서 listening 중이라는 표시가 보여야 합니다.

  </Step>
  <Step title="대시보드 열기">
    ```bash
    openclaw dashboard
    ```

    브라우저에서 Control UI가 열립니다. 로드된다면 모든 것이 정상 동작 중입니다.

  </Step>
  <Step title="첫 메시지 보내기">
    Control UI 채팅에서 메시지를 입력하면 AI 응답을 받을 수 있어야 합니다.

    휴대폰에서 채팅하고 싶나요? 가장 빠르게 설정할 수 있는 채널은
    [Telegram](/ko/channels/telegram)입니다(봇 토큰만 있으면 됨). 모든 옵션은 [Channels](/ko/channels)를
    참조하세요.

  </Step>
</Steps>

<Accordion title="고급: 사용자 지정 Control UI 빌드 마운트">
  현지화되었거나 사용자 지정된 dashboard 빌드를 유지하는 경우
  `gateway.controlUi.root`를 빌드된 정적
  자산과 `index.html`이 들어 있는 디렉터리로 지정하세요.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

그다음 설정:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

gateway를 재시작하고 dashboard를 다시 엽니다.

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 다음에 할 일

<Columns>
  <Card title="채널 연결" href="/ko/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 등.
  </Card>
  <Card title="페어링 및 안전" href="/ko/channels/pairing" icon="shield">
    누가 에이전트에 메시지를 보낼 수 있는지 제어하세요.
  </Card>
  <Card title="Gateway 구성" href="/ko/gateway/configuration" icon="settings">
    모델, 도구, 샌드박스, 고급 설정.
  </Card>
  <Card title="도구 둘러보기" href="/ko/tools" icon="wrench">
    브라우저, exec, 웹 검색, Skills, Plugin.
  </Card>
</Columns>

<Accordion title="고급: 환경 변수">
  서비스 계정으로 OpenClaw를 실행하거나 사용자 지정 경로를 원한다면:

- `OPENCLAW_HOME` — 내부 경로 확인용 홈 디렉터리
- `OPENCLAW_STATE_DIR` — 상태 디렉터리 재정의
- `OPENCLAW_CONFIG_PATH` — 설정 파일 경로 재정의

전체 참조: [Environment variables](/ko/help/environment).
</Accordion>

## 관련 항목

- [Install overview](/ko/install)
- [Channels overview](/ko/channels)
- [Setup](/ko/start/setup)
