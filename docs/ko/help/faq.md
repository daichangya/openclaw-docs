---
read_when:
    - 일반적인 설정, 설치, 온보딩 또는 런타임 지원 질문에 답변할 때
    - 더 깊은 디버깅 전에 사용자가 보고한 문제를 분류할 때
summary: OpenClaw 설정, 구성 및 사용에 관한 자주 묻는 질문
title: FAQ
x-i18n:
    generated_at: "2026-04-07T06:07:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: bddcde55cf4bcec4913aadab4c665b235538104010e445e4c99915a1672b1148
    source_path: help/faq.md
    workflow: 15
---

# FAQ

실제 환경 설정(로컬 개발, VPS, 멀티 에이전트, OAuth/API 키, 모델 장애 조치)에 대한 빠른 답변과 더 깊은 문제 해결 방법을 제공합니다. 런타임 진단은 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요. 전체 config 참조는 [Configuration](/ko/gateway/configuration)을 참고하세요.

## 문제가 생겼을 때 처음 60초

1. **빠른 상태 확인(첫 번째 점검)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, gateway/service 도달 가능 여부, agents/sessions, provider config + 런타임 문제(gateway에 도달 가능한 경우).

2. **공유 가능한 보고서(안전하게 공유 가능)**

   ```bash
   openclaw status --all
   ```

   로그 tail이 포함된 읽기 전용 진단 결과(토큰은 마스킹 처리됨).

3. **데몬 + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   supervisor 런타임 상태와 RPC 도달 가능 여부, probe 대상 URL, 서비스가 사용했을 가능성이 높은 config를 표시합니다.

4. **심층 probe**

   ```bash
   openclaw status --deep
   ```

   지원되는 경우 채널 probe를 포함한 실시간 gateway 상태 probe를 실행합니다
   (도달 가능한 gateway 필요). [Health](/ko/gateway/health)를 참고하세요.

5. **최신 로그 따라가기**

   ```bash
   openclaw logs --follow
   ```

   RPC가 내려가 있으면 다음으로 대체하세요:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [Logging](/ko/logging) 및 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요.

6. **doctor 실행(복구)**

   ```bash
   openclaw doctor
   ```

   config/state를 복구/마이그레이션하고 상태 검사를 실행합니다. [Doctor](/ko/gateway/doctor)를 참고하세요.

7. **Gateway 스냅샷**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 오류 시 대상 URL + config 경로를 표시
   ```

   실행 중인 gateway에 전체 스냅샷을 요청합니다(WS 전용). [Health](/ko/gateway/health)를 참고하세요.

## 빠른 시작 및 첫 실행 설정

<AccordionGroup>
  <Accordion title="막혔습니다. 가장 빨리 막힘을 푸는 방법은 무엇인가요?">
    **내 컴퓨터를 볼 수 있는** 로컬 AI agent를 사용하세요. 이것이 Discord에서
    묻는 것보다 훨씬 효과적입니다. 대부분의 "막혔어요" 사례는 **로컬 config 또는 환경 문제**이며,
    원격 도우미는 이를 직접 확인할 수 없기 때문입니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    이런 도구는 repo를 읽고, 명령을 실행하고, 로그를 확인하며, 머신 수준의
    설정(PATH, 서비스, 권한, 인증 파일)을 고치는 데 도움을 줄 수 있습니다. 해킹 가능한
    (git) 설치를 통해 **전체 소스 체크아웃**을 제공하세요:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 OpenClaw가 **git 체크아웃에서** 설치되므로, agent가 코드와 docs를 읽고
    현재 실행 중인 정확한 버전을 기준으로 추론할 수 있습니다. 나중에 언제든
    `--install-method git` 없이 설치 프로그램을 다시 실행해 stable로 되돌릴 수 있습니다.

    팁: agent에게 수정 작업을 **계획하고 감독**하게 하세요(단계별 진행). 그리고 필요한
    명령만 실행하게 하세요. 이렇게 하면 변경 사항이 작고 감사하기 쉬워집니다.

    실제 버그나 수정 사항을 발견했다면 GitHub issue를 등록하거나 PR을 보내주세요:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    도움을 요청할 때는 먼저 다음 명령의 출력을 공유하세요:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    각각의 역할:

    - `openclaw status`: gateway/agent 상태 + 기본 config의 빠른 스냅샷
    - `openclaw models status`: provider 인증 + 모델 가용성 확인
    - `openclaw doctor`: 일반적인 config/state 문제를 검증하고 복구

    그 밖에 유용한 CLI 점검: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    빠른 디버그 루프: [문제가 생겼을 때 처음 60초](#문제가-생겼을-때-처음-60초).
    설치 문서: [Install](/ko/install), [Installer flags](/ko/install/installer), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뜁니다. skip reason은 무슨 뜻인가요?">
    일반적인 heartbeat skip reason:

    - `quiet-hours`: 구성된 active-hours 시간대 밖
    - `empty-heartbeat-file`: `HEARTBEAT.md`는 존재하지만 비어 있거나 헤더만 있는 템플릿뿐임
    - `no-tasks-due`: `HEARTBEAT.md` 작업 모드가 활성화되어 있지만 아직 실행 시점이 된 작업 간격이 없음
    - `alerts-disabled`: heartbeat 가시성이 모두 비활성화됨(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼짐)

    작업 모드에서는 실제 heartbeat 실행이 완료된 뒤에만
    예정 시각이 갱신됩니다. 건너뛴 실행은 작업 완료로 표시되지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [Automation & Tasks](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw 설치 및 설정의 권장 방법">
    이 repo는 소스에서 실행하고 온보딩을 사용하는 방식을 권장합니다:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard는 UI assets도 자동으로 빌드할 수 있습니다. 온보딩 후에는 보통 **18789** 포트에서 Gateway를 실행합니다.

    소스에서 실행(기여자/개발자용):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # 첫 실행 시 UI deps를 자동 설치
    openclaw onboard
    ```

    아직 전역 설치가 없다면 `pnpm openclaw onboard`로 실행하세요.

  </Accordion>

  <Accordion title="온보딩 후 dashboard는 어떻게 열나요?">
    wizard는 온보딩 직후 브라우저에서 깔끔한(토큰 없는) dashboard URL을 열고, 요약에도 그 링크를 출력합니다. 그 탭을 열어 두세요. 자동으로 열리지 않았다면 같은 머신에서 출력된 URL을 복사해서 붙여넣으세요.
  </Accordion>

  <Accordion title="localhost와 원격에서 dashboard 인증은 어떻게 하나요?">
    **Localhost(같은 머신):**

    - `http://127.0.0.1:18789/`를 엽니다.
    - 공유 비밀 인증을 요구하면 구성된 token 또는 password를 Control UI 설정에 붙여넣습니다.
    - 토큰 소스: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)
    - 비밀번호 소스: `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)
    - 아직 공유 비밀이 구성되지 않았다면 `openclaw doctor --generate-gateway-token`으로 토큰을 생성하세요.

    **localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): bind는 loopback으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 엽니다. `gateway.auth.allowTailscale`가 `true`이면 identity headers가 Control UI/WebSocket 인증을 충족합니다(공유 비밀을 붙여넣을 필요 없음, 신뢰된 gateway host를 전제로 함). HTTP APIs는 의도적으로 private-ingress `none` 또는 trusted-proxy HTTP 인증을 사용하지 않는 한 여전히 공유 비밀 인증이 필요합니다.
      같은 클라이언트에서 동시에 잘못된 Serve 인증을 시도하면, 실패 인증 제한기가 기록하기 전에 직렬화되므로 두 번째 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"`을 실행합니다(또는 password 인증을 구성). 그런 다음 `http://<tailscale-ip>:18789/`를 열고 dashboard 설정에 일치하는 공유 비밀을 붙여넣습니다.
    - **Identity-aware reverse proxy**: Gateway를 비-loopback trusted proxy 뒤에 두고, `gateway.auth.mode: "trusted-proxy"`를 구성한 뒤 proxy URL을 엽니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/`를 엽니다. 터널을 통해서도 공유 비밀 인증은 적용되므로, 프롬프트가 나오면 구성된 token 또는 password를 붙여넣으세요.

    bind 모드와 인증 세부 사항은 [Dashboard](/web/dashboard)와 [Web surfaces](/web)를 참고하세요.

  </Accordion>

  <Accordion title="채팅 승인에 exec approval config가 두 개 있는 이유는 무엇인가요?">
    서로 다른 계층을 제어합니다:

    - `approvals.exec`: 승인 프롬프트를 채팅 대상으로 전달합니다
    - `channels.<channel>.execApprovals`: 해당 채널이 exec 승인에 대한 기본 approval client처럼 동작하도록 합니다

    호스트 exec 정책이 여전히 실제 승인 게이트입니다. 채팅 config는 승인
    프롬프트가 어디에 나타날지와 사람들이 어떻게 응답할 수 있는지만 제어합니다.

    대부분의 설정에서는 **둘 다** 필요하지 않습니다:

    - 해당 채팅이 이미 명령과 답장을 지원한다면, 같은 채팅 내 `/approve`가 공통 경로로 동작합니다.
    - 지원되는 기본 채널이 approver를 안전하게 추론할 수 있다면, OpenClaw는 이제 `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`일 때 DM 우선 기본 승인을 자동 활성화합니다.
    - 기본 승인 카드/버튼을 사용할 수 있다면, 기본 UI가 주 경로가 됩니다. 채팅 승인이 불가능하거나 수동 승인이 유일한 경로라고 tool 결과가 알려주는 경우에만 agent가 수동 `/approve` 명령을 포함해야 합니다.
    - 프롬프트를 다른 채팅이나 명시적 ops room에도 전달해야 할 때만 `approvals.exec`를 사용하세요.
    - 승인 프롬프트를 원래 room/topic에도 게시하고 싶을 때만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하세요.
    - plugin 승인은 또 별개입니다: 기본적으로 같은 채팅의 `/approve`를 사용하며, 선택적으로 `approvals.plugin` 전달을 사용하고, 일부 기본 채널만 그 위에 plugin-approval-native 처리를 유지합니다.

    요약하면: forwarding은 라우팅용이고, native client config는 더 풍부한 채널별 UX를 위한 것입니다.
    [Exec Approvals](/ko/tools/exec-approvals)를 참고하세요.

  </Accordion>

  <Accordion title="어떤 runtime이 필요한가요?">
    Node **>= 22**가 필요합니다. `pnpm` 사용을 권장합니다. Gateway에는 Bun을 **권장하지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. Gateway는 가볍습니다. docs에는 개인 용도로 **512MB-1GB RAM**, **1 core**, 약 **500MB**
    디스크면 충분하다고 되어 있으며, **Raspberry Pi 4에서 실행 가능**하다고 안내합니다.

    여유 공간을 더 원한다면(로그, 미디어, 다른 서비스), **2GB를 권장**하지만
    엄격한 최소 요구사항은 아닙니다.

    팁: 작은 Pi/VPS가 Gateway를 호스팅하고, 노트북/휴대폰에 **nodes**를 페어링해
    로컬 screen/camera/canvas 또는 명령 실행을 할 수 있습니다. [Nodes](/ko/nodes)를 참고하세요.

  </Accordion>

  <Accordion title="Raspberry Pi 설치 팁이 있나요?">
    짧게 말하면: 동작하지만, 거친 부분이 있을 수 있습니다.

    - **64-bit** OS를 사용하고 Node >= 22를 유지하세요.
    - 로그를 보고 빠르게 업데이트할 수 있도록 **해킹 가능한(git) 설치**를 권장합니다.
    - channels/Skills 없이 시작한 뒤 하나씩 추가하세요.
    - 이상한 바이너리 문제가 생기면 보통 **ARM 호환성** 문제입니다.

    문서: [Linux](/ko/platforms/linux), [Install](/ko/install).

  </Accordion>

  <Accordion title="wake up my friend에서 멈추거나 onboarding이 진행되지 않습니다. 어떻게 하나요?">
    그 화면은 Gateway에 도달 가능하고 인증이 되어 있어야 동작합니다. TUI는 첫 hatch 시
    자동으로 "Wake up, my friend!"도 보냅니다. 그 줄이 보이는데도 **응답이 없고**
    토큰이 0에 머무르면 agent가 전혀 실행되지 않은 것입니다.

    1. Gateway를 재시작하세요:

    ```bash
    openclaw gateway restart
    ```

    2. 상태와 인증을 확인하세요:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 여전히 멈춘다면 다음을 실행하세요:

    ```bash
    openclaw doctor
    ```

    Gateway가 원격이라면 터널/Tailscale 연결이 살아 있는지, UI가 올바른 Gateway를
    가리키고 있는지 확인하세요. [Remote access](/ko/gateway/remote)를 참고하세요.

  </Accordion>

  <Accordion title="설정을 새 머신(Mac mini)으로 옮길 때 온보딩을 다시 하지 않아도 되나요?">
    예. **state directory**와 **workspace**를 복사한 다음 Doctor를 한 번 실행하면 됩니다. 이렇게 하면
    **두 위치를 모두** 복사하는 한 봇을 "완전히 같은 상태"(memory, session 기록, 인증, channel
    state)로 유지할 수 있습니다.

    1. 새 머신에 OpenClaw를 설치합니다.
    2. 이전 머신의 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)를 복사합니다.
    3. workspace(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 재시작합니다.

    그러면 config, 인증 프로필, WhatsApp 자격 증명, sessions, memory가 보존됩니다. 원격
    모드에서는 gateway host가 session store와 workspace를 소유한다는 점을 기억하세요.

    **중요:** workspace만 GitHub에 commit/push하면
    **memory + bootstrap 파일**은 백업되지만 **session 기록이나 인증은**
    백업되지 않습니다. 그것들은 `~/.openclaw/` 아래에 있습니다
    (예: `~/.openclaw/agents/<agentId>/sessions/`).

    관련 항목: [Migrating](/ko/install/migrating), [디스크에서 파일이 저장되는 위치](#디스크에서-파일이-저장되는-위치),
    [Agent workspace](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [Remote mode](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 변경 사항은 어디에서 보나요?">
    GitHub changelog를 확인하세요:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    최신 항목은 맨 위에 있습니다. 맨 위 섹션이 **Unreleased**로 표시되어 있으면, 다음 날짜가 있는
    섹션이 가장 최근에 배포된 버전입니다. 항목은 **Highlights**, **Changes**,
    **Fixes**로 그룹화되며(필요 시 docs/기타 섹션 포함).

  </Accordion>

  <Accordion title="docs.openclaw.ai에 접근할 수 없습니다(SSL 오류)">
    일부 Comcast/Xfinity 연결은 Xfinity
    Advanced Security를 통해 `docs.openclaw.ai`를 잘못 차단합니다.
    이를 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 뒤 다시 시도하세요.
    차단 해제에 도움이 되도록 여기로 신고해 주세요: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    그래도 사이트에 접근할 수 없다면 docs는 GitHub에도 미러링되어 있습니다:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable과 beta의 차이는 무엇인가요?">
    **Stable**과 **beta**는 별도의 코드 라인이 아니라 **npm dist-tags**입니다:

    - `latest` = stable
    - `beta` = 테스트용 초기 빌드

    보통 stable 릴리스는 먼저 **beta**에 올라간 뒤, 명시적
    승격 단계에서 같은 버전이 `latest`로 이동합니다. 유지관리자가 필요할 경우
    바로 `latest`로 publish할 수도 있습니다. 그래서 승격 후에는 beta와 stable이
    **같은 버전**을 가리킬 수 있습니다.

    변경 사항 보기:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    설치 원라이너와 beta와 dev의 차이는 아래 아코디언을 참고하세요.

  </Accordion>

  <Accordion title="beta 버전은 어떻게 설치하나요? beta와 dev의 차이는 무엇인가요?">
    **Beta**는 npm dist-tag `beta`입니다(`latest`와 같을 수 있음).
    **Dev**는 `main`의 이동하는 최신 헤드(git)이며, publish될 때 npm dist-tag `dev`를 사용합니다.

    원라이너(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    자세한 내용: [Development channels](/ko/install/development-channels) 및 [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="최신 버전을 써보려면 어떻게 하나요?">
    두 가지 방법이 있습니다:

    1. **Dev 채널(git 체크아웃):**

    ```bash
    openclaw update --channel dev
    ```

    이렇게 하면 `main` 브랜치로 전환하고 소스에서 업데이트합니다.

    2. **해킹 가능한 설치(설치 사이트에서):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    그러면 수정 가능한 로컬 repo가 생기고, 이후 git으로 업데이트할 수 있습니다.

    수동으로 깔끔하게 clone하고 싶다면 다음을 사용하세요:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    문서: [Update](/cli/update), [Development channels](/ko/install/development-channels),
    [Install](/ko/install).

  </Accordion>

  <Accordion title="설치와 온보딩에는 보통 얼마나 걸리나요?">
    대략적인 기준:

    - **설치:** 2-5분
    - **온보딩:** 설정하는 channels/models 수에 따라 5-15분

    멈춘다면 [Installer stuck](#빠른-시작-및-첫-실행-설정)과
    [막혔습니다](#빠른-시작-및-첫-실행-설정)의 빠른 디버그 루프를 사용하세요.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄습니다. 더 많은 피드백을 얻으려면 어떻게 하나요?">
    **verbose output**로 설치 프로그램을 다시 실행하세요:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose 포함 beta 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    해킹 가능한(git) 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows(PowerShell) 대응 방법:

    ```powershell
    # install.ps1에는 아직 전용 -Verbose 플래그가 없습니다.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    추가 옵션: [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치에서 git not found 또는 openclaw not recognized가 나옵니다">
    Windows에서 흔한 두 가지 문제:

    **1) npm error spawn git / git not found**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하세요.
    - PowerShell을 닫았다가 다시 열고 설치 프로그램을 다시 실행하세요.

    **2) 설치 후 openclaw is not recognized**

    - npm global bin 폴더가 PATH에 없습니다.
    - 경로를 확인하세요:

      ```powershell
      npm config get prefix
      ```

    - 그 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사는 필요 없으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PATH를 업데이트한 뒤 PowerShell을 닫았다가 다시 여세요.

    가장 매끄러운 Windows 설정을 원한다면 기본 Windows 대신 **WSL2**를 사용하세요.
    문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에 중국어가 깨져서 보입니다. 어떻게 해야 하나요?">
    이는 보통 기본 Windows 셸에서 콘솔 코드 페이지 불일치로 발생합니다.

    증상:

    - `system.run`/`exec` 출력에서 중국어가 깨져 보임
    - 같은 명령이 다른 터미널 프로필에서는 정상적으로 보임

    PowerShell에서 빠른 우회 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그런 다음 Gateway를 재시작하고 명령을 다시 시도하세요:

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 이 문제가 계속 재현된다면 다음에서 추적/신고하세요:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="docs에서 답을 찾지 못했습니다. 더 나은 답변을 얻으려면 어떻게 하나요?">
    **해킹 가능한(git) 설치**를 사용해 전체 소스와 docs를 로컬에 둔 다음,
    그 폴더에서 여러분의 봇(또는 Claude/Codex)에게 물어보세요. 그러면 repo를 읽고
    더 정확하게 답할 수 있습니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [Install](/ko/install) 및 [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw를 설치하려면 어떻게 하나요?">
    짧게 말하면: Linux 가이드를 따른 뒤 온보딩을 실행하세요.

    - Linux 빠른 경로 + 서비스 설치: [Linux](/ko/platforms/linux).
    - 전체 안내: [Getting Started](/ko/start/getting-started).
    - 설치 프로그램 + 업데이트: [Install & updates](/ko/install/updating).

  </Accordion>

  <Accordion title="VPS에 OpenClaw를 설치하려면 어떻게 하나요?">
    어떤 Linux VPS든 가능합니다. 서버에 설치한 뒤 SSH/Tailscale로 Gateway에 접속하세요.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 접속: [Gateway remote](/ko/gateway/remote).

  </Accordion>

  <Accordion title="cloud/VPS 설치 가이드는 어디에 있나요?">
    일반적인 provider를 모은 **hosting hub**를 유지하고 있습니다. 하나를 선택해서 가이드를 따라가세요:

    - [VPS hosting](/ko/vps) (모든 provider를 한 곳에 정리)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    cloud에서의 동작 방식: **Gateway는 서버에서 실행**되고, 노트북/휴대폰에서
    Control UI(또는 Tailscale/SSH)로 접근합니다. state + workspace는
    서버에 있으므로 호스트를 단일 진실 공급원으로 보고 백업하세요.

    **nodes**(Mac/iOS/Android/headless)를 cloud Gateway에 페어링하면
    Gateway는 cloud에 둔 채로 노트북에서
    로컬 screen/camera/canvas에 접근하거나 명령을 실행할 수 있습니다.

    허브: [Platforms](/ko/platforms). 원격 접속: [Gateway remote](/ko/gateway/remote).
    Nodes: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw가 스스로 업데이트하게 할 수 있나요?">
    짧게 말하면: **가능은 하지만 권장하지 않습니다**. 업데이트 과정에서
    Gateway가 재시작될 수 있고(활성 session이 끊어짐), 깨끗한 git checkout이 필요할 수 있으며,
    확인 프롬프트가 나올 수 있습니다. 더 안전한 방법은 운영자가 셸에서 업데이트하는 것입니다.

    CLI 사용:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    agent에서 자동화가 꼭 필요하다면:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    문서: [Update](/cli/update), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="온보딩은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장 설정 경로입니다. **로컬 모드**에서 다음을 안내합니다:

    - **모델/인증 설정**(provider OAuth, API 키, Anthropic setup-token, LM Studio 같은 로컬 모델 옵션 포함)
    - **Workspace** 위치 + bootstrap 파일
    - **Gateway 설정**(bind/port/auth/tailscale)
    - **Channels**(WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage 및 QQ Bot 같은 번들 channel plugins)
    - **Daemon 설치**(macOS에서는 LaunchAgent, Linux/WSL2에서는 systemd user unit)
    - **상태 점검** 및 **Skills** 선택

    또한 구성된 모델이 알 수 없거나 인증이 누락된 경우 경고합니다.

  </Accordion>

  <Accordion title="이걸 실행하려면 Claude나 OpenAI 구독이 필요한가요?">
    아닙니다. OpenClaw는 **API 키**(Anthropic/OpenAI/기타)로도 실행할 수 있고,
    **로컬 전용 모델**로도 실행할 수 있어 데이터가 기기에만 머물게 할 수 있습니다. 구독(Claude
    Pro/Max 또는 OpenAI Codex)은 해당 provider에 인증하는 선택적 방법입니다.

    Anthropic을 OpenClaw에서 사용할 때 실질적인 구분은 다음과 같습니다:

    - **Anthropic API key**: 일반 Anthropic API 과금
    - **OpenClaw의 Claude CLI / Claude subscription 인증**: Anthropic 직원이
      이 사용 방식이 다시 허용된다고 알려 주었고, Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는
      이 통합에서 `claude -p` 사용을 허용된 것으로 간주합니다

    장기간 실행되는 gateway host의 경우, Anthropic API 키가 여전히
    더 예측 가능한 설정입니다. OpenAI Codex OAuth는 OpenClaw 같은 외부
    도구에서 명시적으로 지원됩니다.

    OpenClaw는 또한 다른 호스팅형 구독 방식 옵션도 지원합니다.
    여기에는 **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**,
    **Z.AI / GLM Coding Plan**이 포함됩니다.

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [GLM Models](/ko/providers/glm),
    [Local models](/ko/gateway/local-models), [Models](/ko/concepts/models).

  </Accordion>

  <Accordion title="API 키 없이 Claude Max 구독만으로 사용할 수 있나요?">
    예.

    Anthropic 직원이 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려 주었으므로,
    Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 이 통합에서
    Claude 구독 인증과 `claude -p` 사용을 허용된 것으로 간주합니다. 가장
    예측 가능한 서버 측 구성을 원한다면 대신 Anthropic API 키를 사용하세요.

  </Accordion>

  <Accordion title="Claude 구독 인증(Claude Pro 또는 Max)을 지원하나요?">
    예.

    Anthropic 직원이 이 사용 방식이 다시 허용된다고 알려 주었으므로, OpenClaw는
    Anthropic이 새 정책을 발표하지 않는 한
    Claude CLI 재사용과 `claude -p` 사용을 이 통합에서 허용된 것으로 간주합니다.

    Anthropic setup-token도 여전히 지원되는 OpenClaw 토큰 경로이지만, OpenClaw는 이제 가능할 때 Claude CLI 재사용과 `claude -p`를 더 선호합니다.
    프로덕션이나 멀티 사용자 워크로드에서는 Anthropic API key 인증이 여전히
    더 안전하고 예측 가능한 선택입니다. OpenClaw에서 다른 구독형 호스팅
    옵션을 원한다면 [OpenAI](/ko/providers/openai), [Qwen / Model
    Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [GLM
    Models](/ko/providers/glm)를 참고하세요.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic에서 HTTP 429 rate_limit_error가 표시되는 이유는 무엇인가요?">
이는 현재 시간 창에서 **Anthropic quota/rate limit**를 모두 소진했다는 뜻입니다. **Claude CLI**를
사용 중이면 창이 재설정될 때까지 기다리거나 요금제를 업그레이드하세요. **Anthropic API key**를
사용 중이면 Anthropic Console에서 사용량/청구 상태를 확인하고
필요하면 한도를 올리세요.

    메시지가 구체적으로 다음과 같다면:
    `Extra usage is required for long context requests`, 요청이
    Anthropic의 1M context beta(`context1m: true`)를 사용하려는 것입니다. 이는
    credential이 장문맥 과금 대상일 때만 동작합니다(API key 과금 또는
    Extra Usage가 활성화된 OpenClaw Claude 로그인 경로).

    팁: **fallback model**을 설정해 두면 provider가 rate-limited 상태여도 OpenClaw가 계속 응답할 수 있습니다.
    [Models](/cli/models), [OAuth](/ko/concepts/oauth), 그리고
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참고하세요.

  </Accordion>

  <Accordion title="AWS Bedrock을 지원하나요?">
    예. OpenClaw에는 번들 **Amazon Bedrock (Converse)** provider가 있습니다. AWS env marker가 있으면 OpenClaw는 스트리밍/텍스트 Bedrock catalog를 자동으로 탐지해 암묵적인 `amazon-bedrock` provider로 병합할 수 있습니다. 그렇지 않으면 `plugins.entries.amazon-bedrock.config.discovery.enabled`를 명시적으로 활성화하거나 수동 provider 항목을 추가할 수 있습니다. [Amazon Bedrock](/ko/providers/bedrock) 및 [Model providers](/ko/providers/models)를 참고하세요. 관리형 키 흐름을 선호한다면 Bedrock 앞단에 OpenAI 호환 proxy를 두는 것도 여전히 유효한 선택입니다.
  </Accordion>

  <Accordion title="Codex 인증은 어떻게 동작하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Code (Codex)**를 지원합니다. 온보딩은 OAuth 흐름을 실행할 수 있으며, 적절한 경우 기본 모델을 `openai-codex/gpt-5.4`로 설정합니다. [Model providers](/ko/concepts/model-providers) 및 [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.
  </Accordion>

  <Accordion title="왜 ChatGPT GPT-5.4를 써도 OpenClaw에서 openai/gpt-5.4가 열리지 않나요?">
    OpenClaw는 두 경로를 별도로 취급합니다:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 직접 OpenAI Platform API

    OpenClaw에서 ChatGPT/Codex 로그인은 직접 `openai/*` 경로가 아니라
    `openai-codex/*` 경로에 연결됩니다. OpenClaw에서 직접 API 경로를 사용하려면
    `OPENAI_API_KEY`(또는 동등한 OpenAI provider config)를 설정하세요.
    OpenClaw에서 ChatGPT/Codex 로그인을 사용하려면 `openai-codex/*`를 사용하세요.

  </Accordion>

  <Accordion title="Codex OAuth 한도가 ChatGPT 웹과 다른 이유는 무엇인가요?">
    `openai-codex/*`는 Codex OAuth 경로를 사용하며, 사용 가능한 quota 창은
    OpenAI에서 관리하고 요금제에 따라 달라집니다. 실제로는 둘 다 같은 계정에 연결되어 있어도
    ChatGPT 웹사이트/앱 경험과 한도가 다를 수 있습니다.

    OpenClaw는 현재 보이는 provider 사용량/quota 창을
    `openclaw models status`에 표시할 수 있지만, ChatGPT 웹의
    entitlement를 직접 API 접근으로 임의 생성하거나 정규화하지는 않습니다. 직접 OpenAI Platform
    과금/한도 경로를 원한다면 API 키와 함께 `openai/*`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI 구독 인증(Codex OAuth)을 지원하나요?">
    예. OpenClaw는 **OpenAI Code (Codex) subscription OAuth**를 완전히 지원합니다.
    OpenAI는 OpenClaw 같은 외부 도구/워크플로에서
    subscription OAuth 사용을 명시적으로 허용합니다. 온보딩에서 이를 대신 실행할 수 있습니다.

    [OAuth](/ko/concepts/oauth), [Model providers](/ko/concepts/model-providers), [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`에 client id 또는 secret을 넣는 방식이 아니라
    **plugin 인증 흐름**을 사용합니다.

    단계:

    1. `gemini`가 `PATH`에 오도록 Gemini CLI를 로컬에 설치합니다
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. plugin을 활성화합니다: `openclaw plugins enable google`
    3. 로그인합니다: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google-gemini-cli/gemini-3.1-pro-preview`
    5. 요청이 실패하면 gateway host에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정합니다

    이렇게 하면 OAuth 토큰이 gateway host의 인증 프로필에 저장됩니다. 자세한 내용: [Model providers](/ko/concepts/model-providers).

  </Accordion>

  <Accordion title="가벼운 대화에는 로컬 모델로도 괜찮나요?">
    보통은 아닙니다. OpenClaw는 큰 context와 강한 안전성이 필요하며, 작은 카드들은 잘리고 새어나갑니다. 꼭 써야 한다면 로컬에서 가능한 한 **가장 큰** 모델 빌드(LM Studio)를 실행하고 [/gateway/local-models](/ko/gateway/local-models)를 참고하세요. 더 작은/양자화된 모델은 prompt injection 위험을 높입니다. [Security](/ko/gateway/security)를 참고하세요.
  </Accordion>

  <Accordion title="호스팅 모델 트래픽을 특정 지역에만 머무르게 하려면 어떻게 하나요?">
    지역 고정 endpoint를 선택하세요. OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공하므로, 미국 호스팅 variant를 선택하면 데이터가 해당 지역에 머물게 할 수 있습니다. `models.mode: "merge"`를 사용하면 Anthropic/OpenAI도 함께 나열하여, 선택한 지역 provider를 유지하면서 fallback도 계속 사용할 수 있습니다.
  </Accordion>

  <Accordion title="이걸 설치하려면 Mac Mini를 꼭 사야 하나요?">
    아닙니다. OpenClaw는 macOS 또는 Linux에서 실행됩니다(Windows는 WSL2 경유). Mac mini는 선택 사항입니다.
    항상 켜진 host로 쓰려고 사는 사람도 있지만, 작은 VPS, 홈 서버, 또는 Raspberry Pi급 장치도 잘 동작합니다.

    Mac이 필요한 경우는 **macOS 전용 도구**를 쓸 때뿐입니다. iMessage는 [BlueBubbles](/ko/channels/bluebubbles)를 사용하세요(권장) - BlueBubbles 서버는 어떤 Mac에서나 실행되고, Gateway는 Linux나 다른 곳에서 실행될 수 있습니다. 다른 macOS 전용 도구가 필요하다면 Gateway를 Mac에서 실행하거나 macOS node를 페어링하세요.

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes), [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage 지원에 Mac mini가 꼭 필요한가요?">
    Messages에 로그인된 **어떤 macOS 기기든** 필요합니다. 반드시 Mac mini일 필요는 없습니다 -
    아무 Mac이면 됩니다. iMessage에는 **[BlueBubbles](/ko/channels/bluebubbles)**를 사용하세요(권장) - BlueBubbles 서버는 macOS에서 실행되고, Gateway는 Linux나 다른 곳에서 실행될 수 있습니다.

    일반적인 구성:

    - Gateway는 Linux/VPS에서 실행하고, BlueBubbles 서버는 Messages에 로그인된 아무 Mac에서나 실행합니다.
    - 가장 단순한 단일 머신 구성을 원하면 모든 것을 Mac에서 실행합니다.

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes),
    [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw를 돌리려고 Mac mini를 사면 MacBook Pro와 연결할 수 있나요?">
    예. **Mac mini는 Gateway를 실행**하고, MacBook Pro는
    **node**(companion device)로 연결할 수 있습니다. Nodes는 Gateway를 실행하지 않고,
    해당 기기에서 screen/camera/canvas와 `system.run` 같은 추가
    기능을 제공합니다.

    일반적인 패턴:

    - Mac mini에 Gateway(항상 켜짐).
    - MacBook Pro에서 macOS 앱 또는 node host를 실행하고 Gateway와 페어링.
    - `openclaw nodes status` / `openclaw nodes list`로 확인.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 쓸 수 있나요?">
    Bun은 **권장하지 않습니다**. 특히 WhatsApp과 Telegram에서 런타임 버그가 보입니다.
    안정적인 gateway에는 **Node**를 사용하세요.

    그래도 Bun을 실험하고 싶다면 WhatsApp/Telegram 없이
    비프로덕션 gateway에서만 하세요.

  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇을 넣나요?">
    `channels.telegram.allowFrom`은 **사람 발신자의 Telegram user ID**(숫자)입니다. 봇 username이 아닙니다.

    온보딩은 `@username` 입력을 받아 숫자 ID로 변환하지만, OpenClaw 권한 부여는 숫자 ID만 사용합니다.

    더 안전한 방법(서드파티 봇 불필요):

    - 봇에게 DM을 보낸 뒤 `openclaw logs --follow`를 실행하고 `from.id`를 읽으세요.

    공식 Bot API:

    - 봇에게 DM을 보낸 뒤 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 읽으세요.

    서드파티(프라이버시가 덜 좋음):

    - `@userinfobot` 또는 `@getidsbot`에 DM을 보내세요.

    [/channels/telegram](/ko/channels/telegram#access-control-and-activation)을 참고하세요.

  </Accordion>

  <Accordion title="한 WhatsApp 번호를 여러 OpenClaw 인스턴스에서 다른 사람마다 다르게 사용할 수 있나요?">
    예, **멀티 에이전트 라우팅**으로 가능합니다. 각 발신자의 WhatsApp **DM**(peer `kind: "direct"`, 발신자 E.164 예: `+15551234567`)을 서로 다른 `agentId`에 바인딩하면, 각 사람이 별도의 workspace와 session store를 갖게 됩니다. 응답은 여전히 **같은 WhatsApp 계정**에서 나가며, DM 접근 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 WhatsApp 계정 단위로 전역 적용됩니다. [Multi-Agent Routing](/ko/concepts/multi-agent) 및 [WhatsApp](/ko/channels/whatsapp)를 참고하세요.
  </Accordion>

  <Accordion title='“빠른 채팅” agent와 “코딩용 Opus” agent를 함께 운영할 수 있나요?'>
    예. 멀티 에이전트 라우팅을 사용하세요. 각 agent에 기본 모델을 따로 지정한 뒤, 들어오는 라우트(provider account 또는 특정 peers)를 각 agent에 바인딩하면 됩니다. 예시 config는 [Multi-Agent Routing](/ko/concepts/multi-agent)에 있습니다. [Models](/ko/concepts/models)와 [Configuration](/ko/gateway/configuration)도 참고하세요.
  </Accordion>

  <Accordion title="Linux에서 Homebrew가 동작하나요?">
    예. Homebrew는 Linux(Linuxbrew)를 지원합니다. 빠른 설정:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd를 통해 OpenClaw를 실행한다면 서비스 PATH에 `/home/linuxbrew/.linuxbrew/bin`(또는 brew prefix)을 포함해 `brew`로 설치한 도구가 비로그인 셸에서도 해결되도록 하세요.
    최근 빌드는 Linux systemd 서비스에서 일반적인 사용자 bin 디렉터리(예: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`)도 prepend하고, `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`가 설정되어 있으면 이를 반영합니다.

  </Accordion>

  <Accordion title="해킹 가능한 git 설치와 npm install의 차이는 무엇인가요?">
    - **해킹 가능한(git) 설치:** 전체 소스 체크아웃, 수정 가능, 기여자에게 가장 적합.
      빌드를 로컬에서 실행하고 코드/docs를 패치할 수 있습니다.
    - **npm install:** 전역 CLI 설치, repo 없음, "그냥 실행"하려는 경우에 가장 적합.
      업데이트는 npm dist-tags에서 옵니다.

    문서: [Getting started](/ko/start/getting-started), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치를 서로 전환할 수 있나요?">
    예. 다른 방식으로 설치한 뒤 Doctor를 실행하면 gateway 서비스가 새 entrypoint를 가리키도록 바뀝니다.
    이 작업은 **데이터를 삭제하지 않습니다** - OpenClaw 코드 설치만 바뀝니다. state
    (`~/.openclaw`)와 workspace(`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git로 전환:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git에서 npm으로 전환:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor는 gateway 서비스 entrypoint 불일치를 감지하고 현재 설치에 맞게 서비스 config를 다시 쓰도록 제안합니다(자동화에서는 `--repair` 사용).

    백업 팁: [백업 전략](#디스크에서-파일이-저장되는-위치)을 참고하세요.

  </Accordion>

  <Accordion title="Gateway는 노트북에 두는 게 좋나요, VPS에 두는 게 좋나요?">
    짧게 말하면: **24/7 신뢰성이 필요하면 VPS를 사용하세요**. 가장 낮은 진입 장벽이 필요하고 절전/재시작을 감수할 수 있다면 로컬에서 실행하세요.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용 없음, 로컬 파일 직접 접근, 보이는 브라우저 창.
    - **단점:** 절전/네트워크 끊김 = 연결 끊김, OS 업데이트/재부팅으로 중단, 계속 깨어 있어야 함.

    **VPS / cloud**

    - **장점:** 항상 켜짐, 안정적 네트워크, 노트북 절전 문제 없음, 계속 실행 상태 유지가 쉬움.
    - **단점:** 대개 headless로 실행됨(스크린샷 사용), 원격 파일 접근만 가능, 업데이트를 위해 SSH 필요.

    **OpenClaw 관련 참고:** WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서 잘 동작합니다. 실제 차이는 **headless browser** 대 보이는 창 정도입니다. [Browser](/ko/tools/browser)를 참고하세요.

    **권장 기본값:** 이전에 gateway 연결 끊김을 겪었다면 VPS. 로컬은 Mac을 적극적으로 사용 중이고 로컬 파일 접근이나 보이는 브라우저를 이용한 UI 자동화가 필요할 때 좋습니다.

  </Accordion>

  <Accordion title="OpenClaw를 전용 머신에서 실행하는 것이 얼마나 중요한가요?">
    필수는 아니지만, **신뢰성과 격리를 위해 권장**됩니다.

    - **전용 호스트(VPS/Mac mini/Pi):** 항상 켜져 있고, 절전/재부팅 중단이 적고, 권한 구성이 더 깔끔하며, 계속 실행 상태를 유지하기 쉽습니다.
    - **공용 노트북/데스크톱:** 테스트와 적극적인 사용에는 충분히 괜찮지만, 기기가 절전되거나 업데이트될 때 멈출 수 있습니다.

    두 가지 장점을 모두 원한다면 Gateway는 전용 호스트에 두고, 로컬 screen/camera/exec 도구용으로 노트북을 **node**로 페어링하세요. [Nodes](/ko/nodes)를 참고하세요.
    보안 지침은 [Security](/ko/gateway/security)를 읽어보세요.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    OpenClaw는 가볍습니다. 기본 Gateway + 하나의 채팅 채널 기준:

    - **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크
    - **권장:** 여유 공간을 위해 1-2 vCPU, 2GB RAM 이상(로그, 미디어, 여러 채널). Node 도구와 브라우저 자동화는 리소스를 많이 쓸 수 있습니다.

    OS는 **Ubuntu LTS**(또는 최신 Debian/Ubuntu 계열)를 사용하세요. Linux 설치 경로가 여기에서 가장 잘 검증되어 있습니다.

    문서: [Linux](/ko/platforms/linux), [VPS hosting](/ko/vps).

  </Accordion>

  <Accordion title="VM에서 OpenClaw를 실행할 수 있나요? 요구 사항은 무엇인가요?">
    예. VM도 VPS와 동일하게 취급하세요. 항상 켜져 있고, 접근 가능하며,
    Gateway와 활성화한 채널을 실행할 만큼 충분한 RAM이 있어야 합니다.

    기본 지침:

    - **절대 최소:** 1 vCPU, 1GB RAM
    - **권장:** 여러 채널, 브라우저 자동화, 미디어 도구를 실행한다면 2GB RAM 이상
    - **OS:** Ubuntu LTS 또는 다른 최신 Debian/Ubuntu

    Windows에서는 **WSL2가 가장 쉬운 VM 스타일 설정**이며 도구 호환성도 가장 좋습니다.
    [Windows](/ko/platforms/windows), [VPS hosting](/ko/vps)를 참고하세요.
    macOS를 VM에서 실행 중이라면 [macOS VM](/ko/install/macos-vm)을 참고하세요.

  </Accordion>
</AccordionGroup>

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="OpenClaw를 한 문단으로 설명하면 무엇인가요?">
    OpenClaw는 사용자의 기기에서 직접 실행하는 개인용 AI assistant입니다. 이미 사용 중인 메시징 표면(WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat 및 QQ Bot 같은 번들 channel plugins)에서 응답하며, 지원 플랫폼에서는 음성과 실시간 Canvas도 사용할 수 있습니다. **Gateway**는 항상 켜져 있는 제어 평면이고, assistant가 실제 제품입니다.
  </Accordion>

  <Accordion title="가치 제안">
    OpenClaw는 "그냥 Claude 래퍼"가 아닙니다. 이미 사용 중인 채팅 앱을 통해 접근 가능하고,
    상태 유지 세션, memory, 도구를 갖춘 유능한 assistant를 **자신의 하드웨어**에서 실행하게 해 주는
    **로컬 우선 제어 평면**입니다. 워크플로 제어권을 호스팅된
    SaaS에 넘길 필요가 없습니다.

    핵심 장점:

    - **내 기기, 내 데이터:** Gateway를 원하는 곳(Mac, Linux, VPS)에서 실행하고
      workspace + session 기록을 로컬에 유지
    - **웹 샌드박스가 아닌 실제 채널:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등,
      지원 플랫폼의 모바일 음성과 Canvas 포함
    - **모델 불문:** Anthropic, OpenAI, MiniMax, OpenRouter 등을
      agent별 라우팅과 장애 조치와 함께 사용 가능
    - **로컬 전용 옵션:** 원한다면 로컬 모델을 실행해 **모든 데이터가 기기에만 머물도록** 가능
    - **멀티 에이전트 라우팅:** 채널, 계정, 작업별로 agent를 분리하고 각 agent가 자체
      workspace와 기본값을 가짐
    - **오픈 소스 및 해킹 가능:** vendor lock-in 없이 검사, 확장, self-host 가능

    문서: [Gateway](/ko/gateway), [Channels](/ko/channels), [Multi-agent](/ko/concepts/multi-agent),
    [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정했습니다. 먼저 무엇을 해보면 좋을까요?">
    좋은 첫 프로젝트 예시:

    - 웹사이트 만들기(WordPress, Shopify 또는 간단한 정적 사이트).
    - 모바일 앱 프로토타입 만들기(개요, 화면, API 계획).
    - 파일과 폴더 정리하기(정리, 이름 정하기, 태깅).
    - Gmail을 연결해 요약이나 후속 작업 자동화하기.

    큰 작업도 처리할 수 있지만, 여러 단계로 나누고
    병렬 작업을 위해 sub agents를 사용하면 가장 잘 작동합니다.

  </Accordion>

  <Accordion title="OpenClaw의 일상적인 상위 5가지 사용 사례는 무엇인가요?">
    일상적으로 가장 유용한 경우는 보통 다음과 같습니다:

    - **개인 브리핑:** 받은 편지함, 캘린더, 관심 있는 뉴스 요약
    - **조사와 초안 작성:** 빠른 조사, 요약, 이메일이나 docs 초안
    - **리마인더와 후속 작업:** cron 또는 heartbeat 기반 nudges 및 체크리스트
    - **브라우저 자동화:** 양식 입력, 데이터 수집, 반복적인 웹 작업
    - **기기 간 조정:** 휴대폰에서 작업을 보내고, Gateway가 서버에서 실행한 뒤, 결과를 채팅으로 다시 받기

  </Accordion>

  <Accordion title="OpenClaw가 SaaS의 리드 생성, 아웃리치, 광고, 블로그 작성에 도움이 되나요?">
    **조사, 자격 평가, 초안 작성**에는 예.
    사이트를 스캔하고, 후보 목록을 만들고, 잠재 고객을 요약하고, 아웃리치나 광고 카피 초안을 작성할 수 있습니다.

    **아웃리치나 광고 집행**에는 사람이 개입해야 합니다. 스팸을 피하고, 지역 법률과
    플랫폼 정책을 준수하며, 전송 전에 반드시 검토하세요. 가장 안전한 패턴은
    OpenClaw가 초안을 만들고 여러분이 승인하는 것입니다.

    문서: [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code보다 어떤 장점이 있나요?">
    OpenClaw는 IDE 대체제가 아니라 **개인 assistant**이자 조정 계층입니다.
    repo 내부에서 가장 빠른 직접 코딩 루프에는 Claude Code나 Codex를 사용하세요. OpenClaw는
    지속적인 memory, 기기 간 접근, 도구 오케스트레이션이 필요할 때 사용하세요.

    장점:

    - 세션 전반에 걸친 **지속적 memory + workspace**
    - **멀티 플랫폼 접근**(WhatsApp, Telegram, TUI, WebChat)
    - **도구 오케스트레이션**(browser, files, scheduling, hooks)
    - **항상 켜진 Gateway**(VPS에서 실행하고 어디서든 상호작용)
    - 로컬 browser/screen/camera/exec용 **Nodes**

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 및 자동화

<AccordionGroup>
  <Accordion title="repo를 더럽히지 않고 Skills를 커스터마이즈하려면 어떻게 하나요?">
    repo 복사본을 수정하는 대신 managed override를 사용하세요. 변경 사항을 `~/.openclaw/skills/<name>/SKILL.md`에 두거나(`~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 폴더 추가 가능) 관리하세요. 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`이므로, git을 건드리지 않고도 managed override가 bundled skills보다 우선합니다. skill을 전역 설치하되 일부 agent에서만 보이게 하려면 공유 복사본은 `~/.openclaw/skills`에 두고 `agents.defaults.skills`와 `agents.list[].skills`로 표시 범위를 제어하세요. 상향 기여 가치가 있는 수정만 repo에 두고 PR로 보내야 합니다.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 Skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 디렉터리를 넣을 수 있습니다(가장 낮은 우선순위). 기본 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 이를 다음 session에서 `<workspace>/skills`로 취급합니다. skill이 특정 agent에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하세요.
  </Accordion>

  <Accordion title="작업마다 다른 모델을 쓰려면 어떻게 하나요?">
    현재 지원되는 패턴은 다음과 같습니다:

    - **Cron jobs**: 격리된 job마다 `model` override 설정 가능
    - **Sub-agents**: 서로 다른 기본 모델을 가진 별도 agent로 작업 라우팅
    - **온디맨드 전환**: 언제든 `/model`로 현재 session 모델 전환

    [Cron jobs](/ko/automation/cron-jobs), [Multi-Agent Routing](/ko/concepts/multi-agent), [Slash commands](/ko/tools/slash-commands)를 참고하세요.

  </Accordion>

  <Accordion title="무거운 작업을 하는 동안 봇이 멈춥니다. 어떻게 분산하나요?">
    길거나 병렬인 작업에는 **sub-agents**를 사용하세요. Sub-agents는 자체 session에서 실행되고,
    요약만 돌려주므로 메인 채팅이 계속 응답 가능합니다.

    봇에게 "이 작업에 sub-agent를 생성해 줘"라고 요청하거나 `/subagents`를 사용하세요.
    채팅에서 `/status`를 사용하면 Gateway가 지금 무엇을 하는지(바쁜지 여부 포함) 볼 수 있습니다.

    토큰 팁: 긴 작업과 sub-agents 모두 토큰을 소비합니다. 비용이 걱정된다면
    `agents.defaults.subagents.model`로 sub-agents에 더 저렴한 모델을 설정하세요.

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 thread-bound subagent session은 어떻게 동작하나요?">
    thread binding을 사용하세요. Discord thread를 subagent 또는 session 대상에 바인딩하면, 해당 thread의 후속 메시지가 계속 바인딩된 session에 머무릅니다.

    기본 흐름:

    - `sessions_spawn`을 `thread: true`로 호출합니다(지속적인 후속 작업이 필요하면 `mode: "session"`도 함께 설정 가능).
    - 또는 `/focus <target>`으로 수동 바인딩합니다.
    - `/agents`로 binding 상태를 확인합니다.
    - `/session idle <duration|off>`와 `/session max-age <duration|off>`로 자동 unfocus를 제어합니다.
    - `/unfocus`로 thread를 분리합니다.

    필요한 config:

    - 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord override: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - spawn 시 자동 바인드: `channels.discord.threadBindings.spawnSubagentSessions: true` 설정.

    문서: [Sub-agents](/ko/tools/subagents), [Discord](/ko/channels/discord), [Configuration Reference](/ko/gateway/configuration-reference), [Slash commands](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="subagent가 끝났는데 완료 업데이트가 잘못된 곳으로 가거나 아예 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    먼저 해결된 requester route를 확인하세요:

    - 완료 모드의 subagent 전달은 바인딩된 thread나 conversation route가 있으면 이를 우선 사용합니다.
    - 완료 origin에 channel만 있으면, OpenClaw는 requester session에 저장된 route(`lastChannel` / `lastTo` / `lastAccountId`)로 fallback하여 직접 전달을 시도할 수 있습니다.
    - 바인딩된 route도 없고 사용 가능한 저장 route도 없으면 직접 전달이 실패할 수 있으며, 그 결과는 채팅에 즉시 게시되지 않고 queued session 전달로 fallback됩니다.
    - 잘못되었거나 오래된 target도 queue fallback 또는 최종 전달 실패를 유발할 수 있습니다.
    - child의 마지막으로 보이는 assistant 응답이 정확히 조용한 토큰 `NO_REPLY` / `no_reply` 또는 정확히 `ANNOUNCE_SKIP`라면, OpenClaw는 오래된 진행 상황을 게시하지 않도록 의도적으로 announce를 억제합니다.
    - child가 tool 호출만 수행한 뒤 timeout되었다면, announce는 원시 tool 출력을 재생하는 대신 짧은 부분 진행 요약으로 축약될 수 있습니다.

    디버그:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks), [Session Tools](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron이나 reminders가 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 내부에서 실행됩니다. Gateway가 계속 실행 중이 아니면
    예약된 job도 실행되지 않습니다.

    체크리스트:

    - cron이 활성화되어 있는지 확인(`cron.enabled`)하고 `OPENCLAW_SKIP_CRON`이 설정되어 있지 않은지 확인하세요.
    - Gateway가 24/7로 실행 중인지 확인하세요(절전/재시작 없음).
    - job의 timezone 설정을 확인하세요(`--tz` 대 host timezone).

    디버그:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation).

  </Accordion>

  <Accordion title="Cron이 실행되었는데 channel로 아무것도 보내지지 않았습니다. 왜 그런가요?">
    먼저 전달 모드를 확인하세요:

    - `--no-deliver` / `delivery.mode: "none"`이면 외부 메시지는 예상되지 않습니다.
    - announce 대상(`channel` / `to`)이 없거나 잘못되면 runner가 outbound 전달을 건너뜁니다.
    - 채널 인증 실패(`unauthorized`, `Forbidden`)는 runner가 전달을 시도했지만 자격 증명 때문에 막혔음을 의미합니다.
    - 조용한 isolated 결과(`NO_REPLY` / `no_reply`만 반환)는 의도적으로 전달 불가로 간주되므로, runner도 queued fallback 전달을 억제합니다.

    isolated cron job에서는 runner가 최종 전달을 담당합니다. agent는
    runner가 보낼 일반 텍스트 요약을 반환해야 합니다. `--no-deliver`는
    결과를 내부에만 유지하며, agent가 대신 message tool로
    직접 보내도록 허용하지는 않습니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="왜 isolated cron 실행이 모델을 바꾸거나 한 번 재시도했나요?">
    보통은 중복 스케줄링이 아니라 라이브 모델 전환 경로입니다.

    isolated cron은 활성 실행이 `LiveSessionModelSwitchError`를 던질 때
    런타임 모델 handoff를 저장하고 재시도할 수 있습니다. 재시도는 전환된
    provider/model을 유지하며, 전환 과정에 새 auth profile override가 포함되어 있었다면 cron은
    재시도 전에 그것도 저장합니다.

    관련 선택 규칙:

    - 해당되는 경우 Gmail hook 모델 override가 가장 먼저 우선합니다.
    - 그다음 job별 `model`.
    - 그다음 저장된 cron-session 모델 override.
    - 그다음 일반 agent/default 모델 선택.

    재시도 루프에는 상한이 있습니다. 초기 시도와 2회의 switch 재시도 이후에는
    cron이 무한 반복 대신 중단합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 Skills는 어떻게 설치하나요?">
    기본 `openclaw skills` 명령을 사용하거나 workspace에 skill을 넣으세요. macOS Skills UI는 Linux에서 사용할 수 없습니다.
    [https://clawhub.ai](https://clawhub.ai)에서 skill을 찾아볼 수 있습니다.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    기본 `openclaw skills install`은 활성 workspace의 `skills/`
    디렉터리에 기록합니다. 자신의 skill을 publish하거나
    동기화하려는 경우에만 별도의 `clawhub` CLI를 설치하세요. 여러 agent에서 공유하려면 skill을
    `~/.openclaw/skills` 아래에 두고, 보이는 agent를 제한하려면
    `agents.defaults.skills` 또는 `agents.list[].skills`를 사용하세요.

  </Accordion>

  <Accordion title="OpenClaw가 예약된 작업이나 백그라운드에서 계속 실행되는 작업을 수행할 수 있나요?">
    예. Gateway scheduler를 사용하세요:

    - **Cron jobs**: 예약되거나 반복되는 작업용(재시작 후에도 유지)
    - **Heartbeat**: "메인 session" 주기 점검용
    - **Isolated jobs**: 요약을 게시하거나 채팅으로 전달하는 자율 agent용

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation),
    [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 Skills를 실행할 수 있나요?">
    직접적으로는 안 됩니다. macOS skill은 `metadata.openclaw.os`와 필요한 바이너리로 게이트되며, skill이 **Gateway host**에서 적격일 때만 system prompt에 나타납니다. Linux에서는 `darwin` 전용 skill(`apple-notes`, `apple-reminders`, `things-mac` 등)이 게이팅을 override하지 않는 한 로드되지 않습니다.

    지원되는 패턴은 세 가지입니다:

    **옵션 A - Gateway를 Mac에서 실행(가장 간단).**
    macOS 바이너리가 있는 곳에서 Gateway를 실행한 뒤 Linux에서 [remote mode](#gateway-포트가-이미-실행-중이고-remote-mode인-경우) 또는 Tailscale로 연결하세요. Gateway host가 macOS이므로 skill이 정상 로드됩니다.

    **옵션 B - macOS node 사용(SSH 불필요).**
    Gateway는 Linux에서 실행하고 macOS node(메뉴바 앱)를 페어링한 뒤, Mac에서 **Node Run Commands**를 "Always Ask" 또는 "Always Allow"로 설정하세요. 필요한 바이너리가 node에 존재하면 OpenClaw는 macOS 전용 skill을 적격으로 간주할 수 있습니다. agent는 `nodes` tool을 통해 해당 skill을 실행합니다. "Always Ask"를 선택했을 때 프롬프트에서 "Always Allow"를 승인하면 그 명령이 allowlist에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급).**
    Gateway는 Linux에 두고, 필요한 CLI 바이너리가 Mac에서 실행되는 SSH wrapper로 해결되게 하세요. 그다음 skill을 override해서 Linux도 허용하도록 만드세요.

    1. 바이너리용 SSH wrapper를 만듭니다(예: Apple Notes용 `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper를 Linux host의 `PATH`에 넣습니다(예: `~/bin/memo`).
    3. skill metadata를 override해서 Linux를 허용합니다(workspace 또는 `~/.openclaw/skills`):

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 새로운 session을 시작해 skills 스냅샷을 새로 고칩니다.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 통합이 있나요?">
    현재는 기본 제공되지 않습니다.

    선택지:

    - **Custom skill / plugin:** 안정적인 API 접근에 가장 적합(Notion/HeyGen 모두 API 제공).
    - **Browser automation:** 코드 없이도 가능하지만 더 느리고 깨지기 쉽습니다.

    클라이언트별 context를 유지하고 싶다면(에이전시 워크플로), 간단한 패턴은 다음과 같습니다:

    - 클라이언트당 Notion 페이지 하나(context + 선호도 + 현재 작업).
    - session 시작 시 agent에게 그 페이지를 가져오라고 요청.

    기본 통합이 필요하다면 feature request를 열거나
    해당 API를 대상으로 하는 skill을 직접 만드세요.

    Skills 설치:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    기본 설치는 활성 workspace의 `skills/` 디렉터리에 저장됩니다. 여러 agent에서 공유할 skill은 `~/.openclaw/skills/<name>/SKILL.md`에 두세요. 공유 설치가 일부 agent에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`를 구성하세요. 일부 skill은 Homebrew로 설치된 바이너리를 기대하며, Linux에서는 Linuxbrew를 의미합니다(위의 Homebrew Linux FAQ 항목 참고). [Skills](/ko/tools/skills), [Skills config](/ko/tools/skills-config), [ClawHub](/ko/tools/clawhub)를 참고하세요.

  </Accordion>

  <Accordion title="이미 로그인된 기존 Chrome을 OpenClaw에서 사용하려면 어떻게 하나요?">
    Chrome DevTools MCP를 통해 연결되는 내장 `user` browser profile을 사용하세요:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 원한다면 명시적인 MCP profile을 만드세요:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    이 경로는 host 로컬입니다. Gateway가 다른 곳에서 실행된다면 browser 머신에서 node host를 실행하거나 원격 CDP를 대신 사용하세요.

    현재 `existing-session` / `user`의 제한 사항:

    - 동작은 CSS selector가 아니라 ref 기반
    - 업로드는 `ref` / `inputRef`가 필요하며 현재 한 번에 한 파일만 지원
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, batch action은 여전히 managed browser 또는 raw CDP profile이 필요

  </Accordion>
</AccordionGroup>

## 샌드박싱 및 memory

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예. [Sandboxing](/ko/gateway/sandboxing)을 참고하세요. Docker 관련 설정(전체 gateway를 Docker에서 실행하거나 sandbox image 사용)은 [Docker](/ko/install/docker)를 참고하세요.
  </Accordion>

  <Accordion title="Docker가 제한적으로 느껴집니다. 전체 기능을 활성화하려면 어떻게 하나요?">
    기본 image는 보안을 우선하며 `node` 사용자로 실행되므로,
    시스템 패키지, Homebrew, 번들 브라우저가 포함되어 있지 않습니다. 더 완전한 구성을 원한다면:

    - 캐시를 유지하려면 `OPENCLAW_HOME_VOLUME`으로 `/home/node`를 영속화하세요.
    - `OPENCLAW_DOCKER_APT_PACKAGES`로 이미지에 시스템 deps를 bake하세요.
    - 번들 CLI를 통해 Playwright 브라우저를 설치하세요:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 해당 경로가 영속화되도록 하세요.

    문서: [Docker](/ko/install/docker), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="DM은 개인용으로 유지하고 그룹은 공개/샌드박스 처리하도록 하나의 agent로 구성할 수 있나요?">
    예. 개인 트래픽이 **DM**이고 공개 트래픽이 **그룹**이라면 가능합니다.

    `agents.defaults.sandbox.mode: "non-main"`을 사용하면 그룹/채널 session(비-main key)은 Docker에서 실행되고, 메인 DM session은 호스트에서 유지됩니다. 그다음 `tools.sandbox.tools`로 샌드박스 session에서 사용할 도구를 제한하세요.

    설정 안내 + 예시 config: [Groups: personal DMs + public groups](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent)

    핵심 config 참조: [Gateway configuration](/ko/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 바인드하려면 어떻게 하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:path:mode"]` 형식으로 설정하세요(예: `"/home/user/src:/src:ro"`). 전역 + agent별 bind는 병합되며, `scope: "shared"`일 때는 agent별 bind가 무시됩니다. 민감한 항목에는 `:ro`를 사용하고, bind는 샌드박스 파일시스템 경계를 우회한다는 점을 기억하세요.

    OpenClaw는 bind 소스를 정규화된 경로와 가장 깊은 기존 상위를 통해 해결한 canonical 경로 모두에 대해 검증합니다. 즉 마지막 경로 세그먼트가 아직 존재하지 않더라도 symlink 상위 경로를 통한 탈출은 여전히 fail-closed되며, symlink 해석 후에도 allowed-root 검사도 계속 적용됩니다.

    예시와 안전 참고 사항은 [Sandboxing](/ko/gateway/sandboxing#custom-bind-mounts) 및 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)를 참고하세요.

  </Accordion>

  <Accordion title="memory는 어떻게 동작하나요?">
    OpenClaw memory는 agent workspace 안의 Markdown 파일일 뿐입니다:

    - `memory/YYYY-MM-DD.md`의 일일 노트
    - `MEMORY.md`의 큐레이션된 장기 노트(main/private sessions 전용)

    OpenClaw는 또한 자동 압축 전에 모델이 오래 남길 만한 노트를 쓰도록 유도하는
    **조용한 pre-compaction memory flush**를 실행합니다.
    이는 workspace에 쓰기 가능할 때만 동작합니다
    (읽기 전용 샌드박스는 건너뜀). [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>

  <Accordion title="memory가 계속 잊어버립니다. 어떻게 해야 오래 남나요?">
    봇에게 **그 사실을 memory에 쓰라고** 요청하세요. 장기 노트는 `MEMORY.md`에,
    단기 context는 `memory/YYYY-MM-DD.md`에 들어갑니다.

    이 부분은 아직 계속 개선 중입니다. 모델에게 memory를 저장하라고 상기시키는 것이 도움이 되며,
    모델은 무엇을 해야 하는지 알고 있습니다. 계속 잊어버린다면 Gateway가 항상 같은
    workspace를 사용하고 있는지 확인하세요.

    문서: [Memory](/ko/concepts/memory), [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="memory는 영구적으로 유지되나요? 한계는 무엇인가요?">
    Memory 파일은 디스크에 저장되며 삭제하기 전까지 유지됩니다. 한계는 모델이 아니라
    저장 공간입니다. **session context**는 여전히 모델의
    context window에 제한되므로, 긴 대화는 압축되거나 잘릴 수 있습니다. 그래서
    memory search가 존재합니다 - 관련 부분만 다시 context로 가져옵니다.

    문서: [Memory](/ko/concepts/memory), [Context](/ko/concepts/context).

  </Accordion>

  <Accordion title="의미 기반 memory search에는 OpenAI API 키가 필요한가요?">
    **OpenAI embeddings**를 사용하는 경우에만 필요합니다. Codex OAuth는 chat/completions만
    처리하고 embeddings 접근은 제공하지 않으므로,
    **Codex로 로그인해도(OAuth 또는 Codex CLI 로그인)** 의미 기반 memory search에는 도움이 되지 않습니다. OpenAI embeddings에는
    여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    provider를 명시적으로 설정하지 않으면, OpenClaw는 API 키를
    해결할 수 있을 때 provider를 자동 선택합니다(인증 프로필, `models.providers.*.apiKey`, 또는 env vars).
    OpenAI 키가 해결되면 OpenAI를 우선하고, 그렇지 않으면 Gemini,
    그다음 Voyage, 그다음 Mistral을 우선합니다. 원격 키가 하나도 없으면,
    구성할 때까지 memory search는 비활성화된 상태로 유지됩니다. 로컬 모델 경로가
    구성되어 있고 존재하면 OpenClaw는
    `local`을 선호합니다. Ollama는 `memorySearch.provider = "ollama"`를 명시적으로 설정한 경우 지원됩니다.

    로컬로만 유지하고 싶다면 `memorySearch.provider = "local"`을 설정하세요(선택적으로
    `memorySearch.fallback = "none"`도 설정 가능). Gemini embeddings를 원한다면
    `memorySearch.provider = "gemini"`를 설정하고 `GEMINI_API_KEY`(또는
    `memorySearch.remote.apiKey`)를 제공하세요. **OpenAI, Gemini, Voyage, Mistral, Ollama 또는 local** 임베딩
    모델을 지원합니다 - 설정 세부 사항은 [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 디스크에서 파일이 저장되는 위치

<AccordionGroup>
  <Accordion title="OpenClaw와 함께 사용하는 모든 데이터가 로컬에 저장되나요?">
    아니요 - **OpenClaw의 state는 로컬**이지만, **외부 서비스는 여전히 여러분이 보낸 내용을 보게 됩니다**.

    - **기본적으로 로컬:** sessions, memory 파일, config, workspace는 Gateway host에 저장됩니다
      (`~/.openclaw` + workspace 디렉터리).
    - **필연적으로 원격:** 모델 provider(Anthropic/OpenAI 등)에 보내는 메시지는
      해당 API로 전송되며, 채팅 플랫폼(WhatsApp/Telegram/Slack 등)은 메시지 데이터를
      그들의 서버에 저장합니다.
    - **범위는 사용자가 제어:** 로컬 모델을 사용하면 프롬프트는 머신에 머물지만,
      channel 트래픽은 여전히 해당 채널 서버를 거칩니다.

    관련 항목: [Agent workspace](/ko/concepts/agent-workspace), [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장하나요?">
    모든 것은 `$OPENCLAW_STATE_DIR` 아래에 있습니다(기본값: `~/.openclaw`):

    | Path                                                            | 용도                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 메인 config(JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 레거시 OAuth import(첫 사용 시 auth profiles로 복사됨)             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles(OAuth, API 키 및 선택적 `keyRef`/`tokenRef`)         |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider용 선택적 파일 기반 secret payload        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 레거시 호환 파일(정적 `api_key` 항목은 scrubbed 처리됨)            |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state(예: `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | agent별 state(agentDir + sessions)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 대화 기록 및 state(agent별)                                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session 메타데이터(agent별)                                        |

    레거시 단일 agent 경로: `~/.openclaw/agent/*` (`openclaw doctor`가 마이그레이션).

    **Workspace**(AGENTS.md, memory 파일, skills 등)는 별도이며 `agents.defaults.workspace`로 구성합니다(기본값: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 있어야 하나요?">
    이 파일들은 `~/.openclaw`가 아니라 **agent workspace**에 있습니다.

    - **Workspace(agent별)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`(없으면 레거시 fallback인 `memory.md`),
      `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`.
    - **State dir(`~/.openclaw`)**: config, channel/provider state, auth profiles, sessions, logs,
      공유 skills(`~/.openclaw/skills`).

    기본 workspace는 `~/.openclaw/workspace`이며 다음으로 구성 가능합니다:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    재시작 후 봇이 "잊어버린다"면 Gateway가 매번 같은
    workspace를 사용하고 있는지 확인하세요(그리고 원격 모드에서는 **gateway host의**
    workspace를 사용하고, 로컬 노트북의 것이 아니라는 점도 기억하세요).

    팁: 지속적인 동작이나 선호도를 원한다면 단순히 채팅 기록에 기대지 말고
    봇에게 **AGENTS.md 또는 MEMORY.md에 기록하라고** 요청하세요.

    [Agent workspace](/ko/concepts/agent-workspace)와 [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **agent workspace**를 **비공개** git repo에 넣고
    어딘가 비공개 공간(예: GitHub private)에 백업하세요. 이렇게 하면 memory + AGENTS/SOUL/USER
    파일이 보존되고 나중에 assistant의 "마음"을 복원할 수 있습니다.

    `~/.openclaw` 아래 내용(credential, session, token 또는 암호화된 secret payload)은 **commit하지 마세요**.
    전체 복원이 필요하다면 workspace와 state directory를
    별도로 둘 다 백업하세요(위의 마이그레이션 질문 참고).

    문서: [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 하나요?">
    전용 가이드를 참고하세요: [Uninstall](/ko/install/uninstall).
  </Accordion>

  <Accordion title="agents가 workspace 밖에서도 작업할 수 있나요?">
    예. workspace는 **기본 cwd**이자 memory 기준점일 뿐, 강제 샌드박스는 아닙니다.
    상대 경로는 workspace 내부에서 해석되지만, 절대 경로는 샌드박싱이 활성화되지 않은 한
    다른 호스트 위치에도 접근할 수 있습니다. 격리가 필요하다면
    [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 agent별 sandbox 설정을 사용하세요. 특정
    repo를 기본 작업 디렉터리로 쓰고 싶다면 해당 agent의
    `workspace`를 repo 루트로 지정하세요. OpenClaw repo는 단지 소스 코드이므로, agent가 그 안에서 작업하도록 의도한 경우가 아니라면
    workspace는 분리해 두세요.

    예시(repo를 기본 cwd로 사용):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode에서는 session store가 어디에 있나요?">
    Session state는 **gateway host**가 소유합니다. remote mode라면, 실제로 중요한 session store는 로컬 노트북이 아니라 원격 머신에 있습니다. [Session management](/ko/concepts/session)를 참고하세요.
  </Accordion>
</AccordionGroup>

## Config 기본

<AccordionGroup>
  <Accordion title="config 형식은 무엇인가요? 어디에 있나요?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`의 선택적 **JSON5** config를 읽습니다(기본값: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    파일이 없으면 안전에 중점을 둔 기본값을 사용합니다(기본 workspace `~/.openclaw/workspace` 포함).

  </Accordion>

  <Accordion title='gateway.bind: "lan"(또는 "tailnet")으로 설정했더니 아무것도 listen하지 않거나 UI에 unauthorized가 표시됩니다'>
    비-loopback bind는 **유효한 gateway 인증 경로**가 필요합니다. 실제로는 다음 중 하나를 의미합니다:

    - 공유 비밀 인증: token 또는 password
    - 올바르게 구성된 비-loopback identity-aware reverse proxy 뒤에서의 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    참고:

    - `gateway.remote.token` / `.password`만으로는 로컬 gateway 인증이 활성화되지 않습니다.
    - 로컬 호출 경로는 `gateway.auth.*`가 비어 있을 때만 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
    - password 인증의 경우 `gateway.auth.mode: "password"`와 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 대신 설정하세요.
    - `gateway.auth.token` / `gateway.auth.password`가 SecretRef로 명시적으로 구성되었는데 해석되지 않으면, 해석은 fail-closed되며(원격 fallback으로 가려지지 않음) 중단됩니다.
    - 공유 비밀 Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`를 통해 인증됩니다(앱/UI 설정에 저장). Tailscale Serve나 `trusted-proxy` 같은 identity-bearing 모드는 대신 요청 헤더를 사용합니다. 공유 비밀을 URL에 넣는 것은 피하세요.
    - `gateway.auth.mode: "trusted-proxy"`를 사용할 때 같은 호스트의 loopback reverse proxy는 여전히 trusted-proxy 인증을 충족하지 않습니다. trusted proxy는 구성된 비-loopback 소스여야 합니다.

  </Accordion>

  <Accordion title="이제 왜 localhost에서도 token이 필요한가요?">
    OpenClaw는 loopback을 포함해 기본적으로 gateway 인증을 강제합니다. 일반적인 기본 경로에서는 token 인증을 의미합니다. 명시적인 인증 경로가 구성되지 않으면 gateway 시작 시 token 모드로 해석되고 자동 생성된 token을 `gateway.auth.token`에 저장하므로, **로컬 WS client도 인증해야 합니다**. 이렇게 하면 다른 로컬 프로세스가 Gateway를 호출하는 것을 막습니다.

    다른 인증 경로를 원한다면 password 모드(또는 비-loopback identity-aware reverse proxy용 `trusted-proxy`)를 명시적으로 선택할 수 있습니다. 정말로 열린 loopback을 원한다면 config에 `gateway.auth.mode: "none"`을 명시적으로 설정하세요. Doctor는 언제든 토큰을 생성해 줄 수 있습니다: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="config를 바꾼 후 재시작해야 하나요?">
    Gateway는 config를 감시하며 hot-reload를 지원합니다:

    - `gateway.reload.mode: "hybrid"`(기본): 안전한 변경은 즉시 적용, 중요한 변경은 재시작
    - `hot`, `restart`, `off`도 지원

  </Accordion>

  <Accordion title="재미있는 CLI 태그라인을 끄려면 어떻게 하나요?">
    config에서 `cli.banner.taglineMode`를 설정하세요:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: 태그라인 텍스트를 숨기지만 배너 제목/버전 줄은 유지
    - `default`: 항상 `All your chats, one OpenClaw.` 사용
    - `random`: 재미있는/계절성 태그라인 순환(기본 동작)
    - 배너 자체를 없애려면 env `OPENCLAW_HIDE_BANNER=1` 설정

  </Accordion>

  <Accordion title="웹 검색(and web fetch)은 어떻게 활성화하나요?">
    `web_fetch`는 API 키 없이 동작합니다. `web_search`는 선택한
    provider에 따라 달라집니다:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily 같은 API 기반 provider는 일반적인 API 키 설정이 필요합니다.
    - Ollama Web Search는 키가 필요 없지만, 구성된 Ollama host를 사용하며 `ollama signin`이 필요합니다.
    - DuckDuckGo는 키가 필요 없지만, 비공식 HTML 기반 통합입니다.
    - SearXNG는 키가 필요 없고/self-hosted입니다. `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`를 설정하세요.

    **권장:** `openclaw configure --section web`을 실행하고 provider를 선택하세요.
    환경 변수 대안:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, 또는 `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // 선택 사항; 자동 감지를 원하면 생략
            },
          },
        },
    }
    ```

    provider별 web-search config는 이제 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다.
    레거시 `tools.web.search.*` provider 경로도 호환성을 위해 일시적으로 계속 로드되지만, 새 config에는 사용하지 않아야 합니다.
    Firecrawl web-fetch fallback config는 `plugins.entries.firecrawl.config.webFetch.*` 아래에 있습니다.

    참고:

    - allowlist를 사용한다면 `web_search`/`web_fetch`/`x_search` 또는 `group:web`를 추가하세요.
    - `web_fetch`는 기본적으로 활성화됩니다(명시적으로 비활성화하지 않은 경우).
    - `tools.web.fetch.provider`를 생략하면 OpenClaw가 사용 가능한 credential에서 준비된 첫 번째 fetch fallback provider를 자동 감지합니다. 현재 번들 provider는 Firecrawl입니다.
    - 데몬은 `~/.openclaw/.env`(또는 서비스 환경)에서 env vars를 읽습니다.

    문서: [Web tools](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 내 config를 날려 버렸습니다. 어떻게 복구하고 방지하나요?">
    `config.apply`는 **전체 config**를 교체합니다. 부분 객체를 보내면 나머지는 모두
    제거됩니다.

    복구:

    - 백업에서 복원(git 또는 복사해 둔 `~/.openclaw/openclaw.json`).
    - 백업이 없다면 `openclaw doctor`를 다시 실행하고 channels/models를 재구성하세요.
    - 예상치 못한 일이었다면 버그를 등록하고 마지막으로 알고 있던 config 또는 백업을 첨부하세요.
    - 로컬 코딩 agent는 로그나 기록으로부터 작동하는 config를 재구성할 수 있는 경우가 많습니다.

    방지 방법:

    - 작은 변경에는 `openclaw config set`을 사용하세요.
    - 대화형 편집에는 `openclaw configure`를 사용하세요.
    - 정확한 경로나 필드 형태가 확실하지 않을 때는 먼저 `config.schema.lookup`을 사용하세요. 얕은 schema 노드와 즉시 하위 항목 요약을 반환하므로 단계적으로 탐색할 수 있습니다.
    - 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 config 교체용으로만 사용하세요.
    - agent 실행에서 owner 전용 `gateway` tool을 사용하는 경우에도 `tools.exec.ask` / `tools.exec.security`에 대한 쓰기는 계속 거부됩니다(`tools.bash.*` 레거시 별칭도 같은 보호된 exec 경로로 정규화됨).

    문서: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 기기에서 특화 작업자를 둔 중앙 Gateway를 운영하려면 어떻게 하나요?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi) + **nodes** + **agents**입니다:

    - **Gateway(중앙):** channels(Signal/WhatsApp), 라우팅, sessions를 소유
    - **Nodes(기기):** Mac/iOS/Android가 주변장치처럼 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 노출
    - **Agents(작업자):** 특수 역할용 별도 brain/workspace(예: "Hetzner ops", "개인 데이터")
    - **Sub-agents:** 메인 agent에서 병렬 작업이 필요할 때 백그라운드 작업 생성
    - **TUI:** Gateway에 연결해 agents/sessions 전환

    문서: [Nodes](/ko/nodes), [Remote access](/ko/gateway/remote), [Multi-Agent Routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw browser를 headless로 실행할 수 있나요?">
    예. config 옵션입니다:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    기본값은 `false`(headful)입니다. headless는 일부 사이트에서 anti-bot 검사를 더 자주 유발할 수 있습니다. [Browser](/ko/tools/browser)를 참고하세요.

    Headless는 **같은 Chromium 엔진**을 사용하며 대부분의 자동화(양식, 클릭, 스크래핑, 로그인)에 동작합니다. 주요 차이점:

    - 보이는 브라우저 창이 없음(시각적 확인이 필요하면 스크린샷 사용)
    - 일부 사이트는 headless 모드의 자동화에 더 엄격함(CAPTCHA, anti-bot).
      예를 들어 X/Twitter는 headless session을 자주 차단합니다.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 사용하려면 어떻게 하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 다른 Chromium 기반 브라우저)로 설정하고 Gateway를 재시작하세요.
    전체 config 예시는 [Browser](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참고하세요.
  </Accordion>
</AccordionGroup>

## 원격 gateway와 nodes

<AccordionGroup>
  <Accordion title="Telegram, gateway, node 사이에서 명령은 어떻게 전달되나요?">
    Telegram 메시지는 **gateway**가 처리합니다. gateway가 agent를 실행한 뒤,
    node tool이 필요할 때만 **Gateway WebSocket**을 통해 node를 호출합니다:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes는 들어오는 provider 트래픽을 보지 않습니다. node RPC 호출만 받습니다.

  </Accordion>

  <Accordion title="Gateway가 원격에서 호스팅될 때 agent가 내 컴퓨터에 접근하려면 어떻게 하나요?">
    짧게 말하면: **컴퓨터를 node로 페어링**하세요. Gateway는 다른 곳에서 실행되지만,
    Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(screen, camera, system)를 호출할 수 있습니다.

    일반적인 설정:

    1. 항상 켜진 host(VPS/홈 서버)에서 Gateway를 실행합니다.
    2. Gateway host와 컴퓨터를 같은 tailnet에 넣습니다.
    3. Gateway WS에 접근 가능한지 확인합니다(tailnet bind 또는 SSH 터널).
    4. 로컬에서 macOS 앱을 열고 **Remote over SSH** 모드(또는 직접 tailnet)로 연결해
       node로 등록되게 합니다.
    5. Gateway에서 node를 승인합니다:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요 없습니다. nodes는 Gateway WebSocket을 통해 연결됩니다.

    보안 참고: macOS node를 페어링하면 해당 머신에서 `system.run`을 허용하는 셈입니다. 신뢰하는 기기만
    페어링하고, [Security](/ko/gateway/security)를 검토하세요.

    문서: [Nodes](/ko/nodes), [Gateway protocol](/ko/gateway/protocol), [macOS remote mode](/ko/platforms/mac/remote), [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale은 연결되었는데 응답이 없습니다. 어떻게 하나요?">
    기본부터 확인하세요:

    - Gateway가 실행 중인지: `openclaw gateway status`
    - Gateway 상태: `openclaw status`
    - 채널 상태: `openclaw channels status`

    그런 다음 인증과 라우팅을 확인하세요:

    - Tailscale Serve를 사용한다면 `gateway.auth.allowTailscale`가 올바르게 설정되어 있는지 확인하세요.
    - SSH 터널로 연결한다면 로컬 터널이 살아 있고 올바른 포트를 가리키는지 확인하세요.
    - allowlist(DM 또는 group)에 내 계정이 포함되어 있는지 확인하세요.

    문서: [Tailscale](/ko/gateway/tailscale), [Remote access](/ko/gateway/remote), [Channels](/ko/channels).

  </Accordion>

  <Accordion title="두 OpenClaw 인스턴스(로컬 + VPS)가 서로 대화할 수 있나요?">
    예. 기본 제공되는 "봇 대 봇" 브리지는 없지만, 몇 가지
    신뢰할 수 있는 방식으로 구성할 수 있습니다:

    **가장 간단한 방법:** 두 봇이 모두 접근 가능한 일반 채팅 채널(Telegram/Slack/WhatsApp)을 사용하세요.
    Bot A가 Bot B에 메시지를 보내고, Bot B가 평소처럼 응답하게 하세요.

    **CLI 브리지(범용):** 다른 Gateway를
    `openclaw agent --message ... --deliver`로 호출하는 스크립트를 실행해, 다른 봇이
    듣고 있는 채팅을 대상으로 하세요. 한 봇이 원격 VPS에 있다면,
    SSH/Tailscale을 통해 그 원격 Gateway를 가리키도록 CLI를 설정하세요([Remote access](/ko/gateway/remote) 참고).

    예시 패턴(대상 Gateway에 접근 가능한 머신에서 실행):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    팁: 두 봇이 끝없이 루프를 돌지 않도록 가드레일을 추가하세요(멘션 전용, channel
    allowlist 또는 "봇 메시지에는 답장하지 않기" 규칙).

    문서: [Remote access](/ko/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 agent에 각각 별도의 VPS가 필요한가요?">
    아닙니다. 하나의 Gateway가 여러 agent를 호스팅할 수 있으며, 각 agent는 자체 workspace,
    기본 모델, 라우팅을 가질 수 있습니다. 이것이 일반적인 설정이며,
    agent마다 VPS를 하나씩 실행하는 것보다 훨씬 저렴하고 단순합니다.

    별도의 VPS는 강한 격리(보안 경계)가 필요하거나, 공유하고 싶지 않은
    매우 다른 config가 필요할 때만 사용하세요. 그렇지 않다면 하나의 Gateway에
    여러 agent 또는 sub-agents를 사용하세요.

  </Accordion>

  <Accordion title="원격 Gateway에서 SSH로 접근하는 대신 개인 노트북을 node로 쓰는 장점이 있나요?">
    예 - 원격 Gateway에서 노트북에 접근하는 1급 방법은 node이며,
    단순한 셸 접근 이상을 제공합니다. Gateway는 macOS/Linux(Windows는 WSL2)에서 실행되며
    가볍기 때문에(작은 VPS나 Raspberry Pi급 장치면 충분하고 4GB RAM이면 넉넉함),
    항상 켜진 host + 노트북을 node로 두는 구성이 일반적입니다.

    - **인바운드 SSH 불필요.** Nodes는 외부로 Gateway WebSocket에 연결하고 device pairing을 사용합니다.
    - **더 안전한 실행 제어.** `system.run`은 해당 노트북의 node allowlist/승인에 의해 제어됩니다.
    - **더 많은 기기 도구.** Nodes는 `system.run` 외에도 `canvas`, `camera`, `screen`을 노출합니다.
    - **로컬 browser 자동화.** Gateway는 VPS에 두고, 노트북의 node host를 통해 로컬 Chrome을 실행하거나, 호스트의 로컬 Chrome에 Chrome MCP로 연결할 수 있습니다.

    SSH는 일회성 셸 접근에는 괜찮지만, 지속적인 agent 워크플로와
    기기 자동화에는 node가 더 단순합니다.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="nodes가 gateway 서비스를 실행하나요?">
    아니요. 의도적으로 격리된 profile을 여러 개 운영하는 경우가 아니라면(참고: [Multiple gateways](/ko/gateway/multiple-gateways)) 호스트당 **하나의 gateway**만 실행해야 합니다. Nodes는 gateway에 연결되는 주변 장치이며(iOS/Android nodes 또는 메뉴바 앱의 macOS "node mode"), headless node
    host와 CLI 제어는 [Node host CLI](/cli/node)를 참고하세요.

    `gateway`, `discovery`, `canvasHost` 변경에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="config를 적용하는 API / RPC 방법이 있나요?">
    예.

    - `config.schema.lookup`: 쓰기 전에 config 하위 트리 하나를 얕은 schema 노드, 일치한 UI 힌트, 즉시 하위 항목 요약과 함께 검사
    - `config.get`: 현재 스냅샷 + hash 가져오기
    - `config.patch`: 안전한 부분 업데이트(대부분의 RPC 편집에 권장)
    - `config.apply`: 검증 후 전체 config 교체, তারপর 재시작
    - owner 전용 `gateway` 런타임 tool은 여전히 `tools.exec.ask` / `tools.exec.security` 재작성은 거부합니다. 레거시 `tools.bash.*` 별칭도 같은 보호된 exec 경로로 정규화됩니다

  </Accordion>

  <Accordion title="첫 설치를 위한 최소한의 정상 config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    이렇게 하면 workspace를 설정하고 봇을 트리거할 수 있는 사용자를 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 하나요?">
    최소 단계:

    1. **VPS에 설치 + 로그인**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac에 설치 + 로그인**
       - Tailscale 앱을 사용하고 같은 tailnet으로 로그인합니다.
    3. **MagicDNS 활성화(권장)**
       - Tailscale 관리자 콘솔에서 MagicDNS를 활성화해 VPS가 안정적인 이름을 갖게 합니다.
    4. **tailnet hostname 사용**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH 없이 Control UI를 사용하고 싶다면 VPS에서 Tailscale Serve를 사용하세요:

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 gateway는 loopback에 바인딩된 채 유지되고, Tailscale을 통해 HTTPS가 노출됩니다. [Tailscale](/ko/gateway/tailscale)을 참고하세요.

  </Accordion>

  <Accordion title="Mac node를 원격 Gateway(Tailscale Serve)에 연결하려면 어떻게 하나요?">
    Serve는 **Gateway Control UI + WS**를 노출합니다. Nodes는 동일한 Gateway WS endpoint를 통해 연결됩니다.

    권장 설정:

    1. **VPS와 Mac이 같은 tailnet에 있는지 확인**하세요.
    2. **macOS 앱을 Remote mode**로 사용하세요(SSH 대상은 tailnet hostname이어도 됨).
       앱이 Gateway 포트를 터널링하고 node로 연결합니다.
    3. gateway에서 node를 **승인**하세요:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway protocol](/ko/gateway/protocol), [Discovery](/ko/gateway/discovery), [macOS remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 node만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구**(screen/camera/exec)만 필요하다면
    **node**로 추가하세요. 이렇게 하면 Gateway를 하나만 유지하면서 config 중복을 피할 수 있습니다. 로컬 node 도구는
    현재 macOS 전용이지만, 다른 OS로도 확장할 계획입니다.

    강한 격리나 완전히 분리된 두 봇이 필요한 경우에만 두 번째 Gateway를 설치하세요.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## 환경 변수와 .env 로딩

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 상위 프로세스(셸, launchd/systemd, CI 등)의 env vars를 읽고, 추가로 다음도 로드합니다:

    - 현재 작업 디렉터리의 `.env`
    - `~/.openclaw/.env`(즉 `$OPENCLAW_STATE_DIR/.env`)의 전역 fallback `.env`

    두 `.env` 파일 모두 기존 env vars를 override하지 않습니다.

    config에 인라인 env vars를 정의할 수도 있습니다(프로세스 env에 없을 때만 적용):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 소스는 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>

  <Accordion title="서비스로 Gateway를 시작했더니 env vars가 사라졌습니다. 어떻게 하나요?">
    일반적인 해결책 두 가지:

    1. 누락된 키를 `~/.openclaw/.env`에 넣으세요. 그러면 서비스가 셸 env를 상속하지 않아도 읽어옵니다.
    2. 셸 import를 활성화하세요(선택적 편의 기능):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    이렇게 하면 로그인 셸을 실행해 예상된 누락 키만 가져옵니다(override는 절대 하지 않음). 대응되는 env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN을 설정했는데 models status에는 "Shell env: off."라고 표시됩니다. 왜 그런가요?'>
    `openclaw models status`는 **shell env import**가 활성화되어 있는지를 보고합니다. "Shell env: off"는
    env vars가 없다는 뜻이 아니라, OpenClaw가
    로그인 셸을 자동으로 로드하지 않는다는 뜻일 뿐입니다.

    Gateway가 서비스로 실행되면 launchd/systemd는 셸 환경을 상속하지 않습니다.
    다음 중 하나로 해결하세요:

    1. 토큰을 `~/.openclaw/.env`에 넣으세요:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 또는 shell import(`env.shellEnv.enabled: true`)를 활성화하세요.
    3. 또는 config의 `env` 블록에 추가하세요(없을 때만 적용).

    그런 다음 gateway를 재시작하고 다시 확인하세요:

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `COPILOT_GITHUB_TOKEN`에서 읽으며(`GH_TOKEN` / `GITHUB_TOKEN`도 허용).
    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>
</AccordionGroup>

## Sessions와 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 하나요?">
    `/new` 또는 `/reset`을 독립된 메시지로 보내세요. [Session management](/ko/concepts/session)를 참고하세요.
  </Accordion>

  <Accordion title="/new를 한 번도 보내지 않으면 session이 자동으로 초기화되나요?">
    Session은 `session.idleMinutes` 이후 만료될 수 있지만, 기본값은 **비활성화**(**0**)입니다.
    양수 값으로 설정하면 idle expiry가 활성화됩니다. 활성화된 경우, idle 기간 이후의 **다음**
    메시지가 해당 chat key에 대한 새로운 session id를 시작합니다.
    transcript를 삭제하는 것은 아니고, 새 session을 시작할 뿐입니다.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="여러 OpenClaw 인스턴스로 팀(CEO 하나와 여러 agent)을 만들 수 있나요?">
    예. **멀티 에이전트 라우팅**과 **sub-agents**를 사용하면 됩니다. 하나의 coordinator
    agent와, 각자 workspace와 모델을 가진 여러 worker agent를 만들 수 있습니다.

    다만 이것은 **재미있는 실험**으로 보는 것이 좋습니다. 토큰 소모가 많고,
    별도 sessions를 가진 하나의 봇을 쓰는 것보다 비효율적인 경우가 많습니다. 우리가
    일반적으로 상정하는 모델은, 여러분이 대화하는 봇 하나가 있고,
    병렬 작업을 위해 다른 sessions를 사용하는 형태입니다. 이 봇은 필요할 때
    sub-agents도 생성할 수 있습니다.

    문서: [Multi-agent routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="작업 중간에 context가 잘렸습니다. 어떻게 방지하나요?">
    Session context는 모델 window에 의해 제한됩니다. 긴 채팅, 큰 tool 출력, 많은
    파일은 compaction이나 truncation을 유발할 수 있습니다.

    도움이 되는 방법:

    - 봇에게 현재 상태를 요약해서 파일로 쓰라고 요청하세요.
    - 긴 작업 전에는 `/compact`, 주제를 바꿀 때는 `/new`를 사용하세요.
    - 중요한 context는 workspace에 두고 봇에게 다시 읽게 하세요.
    - 긴 작업이나 병렬 작업에는 sub-agents를 사용해 메인 채팅이 작게 유지되도록 하세요.
    - 이런 일이 자주 발생한다면 더 큰 context window를 가진 모델을 고르세요.

  </Accordion>

  <Accordion title="설치는 유지한 채 OpenClaw를 완전히 초기화하려면 어떻게 하나요?">
    reset 명령을 사용하세요:

    ```bash
    openclaw reset
    ```

    비대화형 전체 초기화:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그다음 설정을 다시 진행하세요:

    ```bash
    openclaw onboard --install-daemon
    ```

    참고:

    - 온보딩도 기존 config를 감지하면 **Reset** 옵션을 제공합니다. [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.
    - profiles(`--profile` / `OPENCLAW_PROFILE`)를 사용했다면 각 state dir도 초기화하세요(기본은 `~/.openclaw-<profile>`).
    - 개발용 reset: `openclaw gateway --dev --reset`(dev 전용; dev config + credentials + sessions + workspace 삭제).

  </Accordion>

  <Accordion title='“context too large” 오류가 납니다. reset 또는 compact는 어떻게 하나요?'>
    다음 중 하나를 사용하세요:

    - **Compact**(대화는 유지하되 오래된 turn을 요약):

      ```
      /compact
      ```

      또는 `/compact <instructions>`로 요약 방식을 안내할 수 있습니다.

    - **Reset**(같은 chat key에 대해 새 session ID 시작):

      ```
      /new
      /reset
      ```

    계속 반복된다면:

    - 오래된 tool 출력을 줄이기 위해 **session pruning**(`agents.defaults.contextPruning`)을 활성화하거나 조정하세요.
    - 더 큰 context window를 가진 모델을 사용하세요.

    문서: [Compaction](/ko/concepts/compaction), [Session pruning](/ko/concepts/session-pruning), [Session management](/ko/concepts/session).

  </Accordion>

  <Accordion title='“LLM request rejected: messages.content.tool_use.input field required”가 표시되는 이유는 무엇인가요?'>
    이는 provider 검증 오류입니다. 모델이 필수 `input` 없이 `tool_use` 블록을 내보냈다는 뜻입니다.
    보통 session 기록이 오래되었거나 손상되었음을 의미합니다(긴 thread 이후나
    tool/schema 변경 후 자주 발생).

    해결: `/new`를 사용해 새 session을 시작하세요(독립된 메시지).

  </Accordion>

  <Accordion title="왜 30분마다 heartbeat 메시지가 오나요?">
    Heartbeat는 기본적으로 **30분**마다 실행됩니다(OAuth 인증 사용 시 **1시간**).
    조정하거나 비활성화하려면:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 또는 "0m"으로 비활성화
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`가 존재하지만 사실상 비어 있다면(빈 줄과 `# Heading` 같은 markdown
    header만 있는 경우), OpenClaw는 API 호출을 아끼기 위해 heartbeat 실행을 건너뜁니다.
    파일이 없으면 heartbeat는 여전히 실행되며 모델이 무엇을 할지 결정합니다.

    agent별 override는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 “bot account”를 따로 추가해야 하나요?'>
    아닙니다. OpenClaw는 **여러분의 계정**에서 실행되므로, 여러분이 그룹에 속해 있으면 OpenClaw도 볼 수 있습니다.
    기본적으로 그룹 응답은 발신자를 허용(`groupPolicy: "allowlist"`)하기 전까지 차단됩니다.

    그룹에서 **오직 본인만** 봇을 트리거할 수 있게 하려면:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="WhatsApp 그룹의 JID는 어떻게 얻나요?">
    방법 1(가장 빠름): 로그를 따라가면서 그룹에 테스트 메시지를 보내세요:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으세요. 예:
    `1234567890-1234567890@g.us`.

    방법 2(이미 구성/allowlist된 경우): config에서 그룹 목록 보기:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="왜 OpenClaw가 그룹에서 답장하지 않나요?">
    흔한 원인 두 가지:

    - mention gating이 켜져 있습니다(기본값). 봇을 @mention해야 하거나 `mentionPatterns`에 맞아야 합니다.
    - `channels.whatsapp.groups`를 `"*"` 없이 구성했는데 해당 그룹이 allowlist에 없습니다.

    [Groups](/ko/channels/groups)와 [Group messages](/ko/channels/group-messages)를 참고하세요.

  </Accordion>

  <Accordion title="그룹/thread는 DM과 context를 공유하나요?">
    직접 채팅은 기본적으로 메인 session으로 접힙니다. 그룹/채널은 자체 session key를 가지며, Telegram topic / Discord thread도 별도의 session입니다. [Groups](/ko/channels/groups)와 [Group messages](/ko/channels/group-messages)를 참고하세요.
  </Accordion>

  <Accordion title="workspaces와 agents는 몇 개까지 만들 수 있나요?">
    하드 제한은 없습니다. 수십 개(심지어 수백 개)도 괜찮지만 다음을 주의하세요:

    - **디스크 증가:** sessions + transcripts는 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.
    - **토큰 비용:** agent가 많을수록 동시 모델 사용량이 증가합니다.
    - **운영 부담:** agent별 auth profiles, workspaces, channel routing 관리 필요.

    팁:

    - agent마다 **활성** workspace 하나를 유지하세요(`agents.defaults.workspace`).
    - 디스크가 커지면 오래된 sessions(JSONL 또는 store 항목)를 정리하세요.
    - `openclaw doctor`를 사용해 흩어진 workspace와 profile 불일치를 찾아보세요.

  </Accordion>

  <Accordion title="여러 봇이나 채팅을 동시에(Slack) 실행할 수 있나요? 어떻게 설정하는 것이 좋나요?">
    예. **Multi-Agent Routing**을 사용해 여러 격리된 agent를 실행하고,
    channel/account/peer 기준으로 들어오는 메시지를 라우팅하세요. Slack은 채널로 지원되며 특정 agent에 바인딩할 수 있습니다.

    Browser 접근은 강력하지만 "사람이 할 수 있는 건 뭐든 가능"한 수준은 아닙니다 -
    anti-bot, CAPTCHA, MFA는 여전히 자동화를 막을 수 있습니다. 가장 안정적인 browser 제어는 host의 로컬 Chrome MCP를 사용하거나,
    실제로 browser를 실행하는 머신에서 CDP를 사용하는 것입니다.

    모범 설정:

    - 항상 켜진 Gateway host(VPS/Mac mini).
    - 역할별 agent 하나씩(bindings).
    - 해당 agents에 바인딩된 Slack 채널들.
    - 필요 시 Chrome MCP 또는 node를 통한 로컬 browser.

    문서: [Multi-Agent Routing](/ko/concepts/multi-agent), [Slack](/ko/channels/slack),
    [Browser](/ko/tools/browser), [Nodes](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델: 기본값, 선택, aliases, 전환

<AccordionGroup>
  <Accordion title='“기본 모델”이란 무엇인가요?'>
    OpenClaw의 기본 모델은 다음에 설정한 값입니다:

    ```
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 형식으로 참조합니다(예: `openai/gpt-5.4`). provider를 생략하면 OpenClaw는 먼저 alias를 시도하고, 그다음 정확히 해당 모델 id에 대한 고유한 configured-provider 일치를 시도하며, 마지막으로만 deprecated 호환 경로로 configured default provider에 fallback합니다. 해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면, 제거된 provider의 오래된 기본값을 보여 주는 대신 첫 번째로 구성된 provider/model로 fallback합니다. 그래도 **반드시** `provider/model`을 명시적으로 설정하는 것이 좋습니다.

  </Accordion>

  <Accordion title="어떤 모델을 추천하나요?">
    **권장 기본값:** 현재 provider 스택에서 사용할 수 있는 가장 강력한 최신 세대 모델을 사용하세요.
    **도구가 활성화되었거나 신뢰할 수 없는 입력을 다루는 agent:** 비용보다 모델 성능을 우선하세요.
    **일상적/낮은 위험 대화:** 더 저렴한 fallback 모델을 쓰고 agent 역할별로 라우팅하세요.

    MiniMax에는 자체 문서가 있습니다: [MiniMax](/ko/providers/minimax) 및
    [Local models](/ko/gateway/local-models).

    경험 법칙: 고위험 작업에는 **감당 가능한 범위에서 가장 좋은 모델**을 사용하고,
    일상적인 대화나 요약에는 더 저렴한 모델을 사용하세요. agent별로 모델을 라우팅하고,
    긴 작업은 sub-agents로 병렬화할 수 있습니다(sub-agent마다 토큰을 소비함). [Models](/ko/concepts/models) 및
    [Sub-agents](/ko/tools/subagents)를 참고하세요.

    강한 경고: 더 약하거나 과도하게 양자화된 모델은 prompt
    injection과 안전하지 않은 동작에 더 취약합니다. [Security](/ko/gateway/security)를 참고하세요.

    추가 설명: [Models](/ko/concepts/models).

  </Accordion>

  <Accordion title="config를 날리지 않고 모델만 바꾸려면 어떻게 하나요?">
    **모델 명령**을 사용하거나 **모델** 필드만 편집하세요. 전체 config 교체는 피하세요.

    안전한 방법:

    - 채팅에서 `/model`(빠르고, session 단위)
    - `openclaw models set ...`(모델 config만 업데이트)
    - `openclaw configure --section model`(대화형)
    - `~/.openclaw/openclaw.json`의 `agents.defaults.model` 편집

    전체 config를 교체하려는 의도가 아니라면 부분 객체와 함께 `config.apply`를 사용하지 마세요.
    RPC 편집에서는 먼저 `config.schema.lookup`으로 검사하고 `config.patch`를 선호하세요. lookup payload는 정규화된 경로, 얕은 schema 문서/제약, 즉시 하위 항목 요약을 제공합니다.
    부분 업데이트용입니다.
    이미 config를 덮어썼다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행해 복구하세요.

    문서: [Models](/ko/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="자체 호스팅 모델(llama.cpp, vLLM, Ollama)을 쓸 수 있나요?">
    예. 로컬 모델에는 Ollama가 가장 쉬운 경로입니다.

    가장 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama 설치
    2. `ollama pull glm-4.7-flash` 같은 로컬 모델 가져오기
    3. cloud 모델도 원한다면 `ollama signin` 실행
    4. `openclaw onboard`를 실행하고 `Ollama` 선택
    5. `Local` 또는 `Cloud + Local` 선택

    참고:

    - `Cloud + Local`은 cloud 모델 + 로컬 Ollama 모델을 함께 제공합니다
    - `kimi-k2.5:cloud` 같은 cloud 모델은 로컬 pull이 필요 없습니다
    - 수동 전환은 `openclaw models list`와 `openclaw models set ollama/<model>` 사용

    보안 참고: 더 작거나 강하게 양자화된 모델은 prompt
    injection에 더 취약합니다. 도구를 사용할 수 있는 봇에는 **큰 모델**을 강하게 권장합니다.
    작은 모델을 꼭 쓰고 싶다면 샌드박싱과 엄격한 tool allowlist를 활성화하세요.

    문서: [Ollama](/ko/providers/ollama), [Local models](/ko/gateway/local-models),
    [Model providers](/ko/concepts/model-providers), [Security](/ko/gateway/security),
    [Sandboxing](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd, Krill은 어떤 모델을 사용하나요?">
    - 이 배포들은 서로 다를 수 있고 시간이 지나며 바뀔 수 있습니다. 고정된 provider 권장값은 없습니다.
    - 각 gateway의 현재 런타임 설정은 `openclaw models status`로 확인하세요.
    - 보안 민감/도구 활성화 agent에는 사용 가능한 가장 강력한 최신 세대 모델을 사용하세요.
  </Accordion>

  <Accordion title="재시작 없이 즉시 모델을 전환하려면 어떻게 하나요?">
    `/model` 명령을 독립된 메시지로 사용하세요:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    이것들은 내장 alias입니다. 사용자 지정 alias는 `agents.defaults.models`를 통해 추가할 수 있습니다.

    사용 가능한 모델은 `/model`, `/model list`, `/model status`로 볼 수 있습니다.

    `/model`(및 `/model list`)은 간결한 번호 선택기를 보여 줍니다. 번호로 선택하세요:

    ```
    /model 3
    ```

    provider에 대해 특정 auth profile을 강제로 사용할 수도 있습니다(session 단위):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    팁: `/model status`는 어떤 agent가 활성인지, 어떤 `auth-profiles.json` 파일이 사용 중인지, 다음에 어떤 auth profile을 시도할지를 보여 줍니다.
    사용 가능한 경우 구성된 provider endpoint(`baseUrl`)와 API 모드(`api`)도 표시합니다.

    **@profile로 고정한 profile은 어떻게 해제하나요?**

    `@profile` 접미사 없이 `/model`을 다시 실행하세요:

    ```
    /model anthropic/claude-opus-4-6
    ```

    기본값으로 돌아가려면 `/model`에서 기본값을 고르거나(`/model <default provider/model>`를 보내도 됨),
    `/model status`로 현재 어떤 auth profile이 활성인지 확인하세요.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.2, 코딩에는 Codex 5.3을 쓸 수 있나요?">
    예. 하나를 기본값으로 두고 필요할 때 전환하세요:

    - **빠른 전환(session 단위):** 일상 작업엔 `/model gpt-5.4`, Codex OAuth를 사용하는 코딩엔 `/model openai-codex/gpt-5.4`
    - **기본값 + 전환:** `agents.defaults.model.primary`를 `openai/gpt-5.4`로 설정한 다음, 코딩할 때 `openai-codex/gpt-5.4`로 전환하세요(또는 반대로).
    - **Sub-agents:** 코딩 작업을 다른 기본 모델을 가진 sub-agent로 라우팅

    [Models](/ko/concepts/models) 및 [Slash commands](/ko/tools/slash-commands)를 참고하세요.

  </Accordion>

  <Accordion title="GPT 5.4에서 fast mode는 어떻게 설정하나요?">
    session 토글 또는 config 기본값을 사용할 수 있습니다:

    - **session별:** session이 `openai/gpt-5.4` 또는 `openai-codex/gpt-5.4`를 사용하는 동안 `/fast on` 전송
    - **모델별 기본값:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode`를 `true`로 설정
    - **Codex OAuth에도 적용:** `openai-codex/gpt-5.4`를 함께 사용한다면 같은 플래그를 설정

    예시:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI에서는 fast mode가 지원되는 기본 Responses 요청에서 `service_tier = "priority"`로 매핑됩니다. session `/fast` override는 config 기본값보다 우선합니다.

    [Thinking and fast mode](/ko/tools/thinking) 및 [OpenAI fast mode](/ko/providers/openai#openai-fast-mode)를 참고하세요.

  </Accordion>

  <Accordion title='“Model ... is not allowed”가 보이고 아무 응답도 오지 않는 이유는 무엇인가요?'>
    `agents.defaults.models`가 설정되어 있으면, 그것이 `/model`과 모든
    session override에 대한 **allowlist**가 됩니다. 목록에 없는 모델을 선택하면 다음이 반환됩니다:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    이 오류는 일반 응답 **대신** 반환됩니다. 해결 방법: 모델을
    `agents.defaults.models`에 추가하거나, allowlist를 제거하거나, `/model list`에서 모델을 선택하세요.

  </Accordion>

  <Accordion title='“Unknown model: minimax/MiniMax-M2.7”가 보이는 이유는 무엇인가요?'>
    이는 **provider가 구성되지 않았기 때문**입니다(MiniMax provider config나 auth
    profile을 찾지 못함). 따라서 모델을 해결할 수 없습니다.

    해결 체크리스트:

    1. 현재 OpenClaw 릴리스로 업그레이드하거나 소스 `main`에서 실행한 뒤 gateway를 재시작하세요.
    2. MiniMax가 구성되어 있는지 확인하세요(wizard 또는 JSON). 또는 MiniMax auth가
       env/auth profiles에 존재해 일치하는 provider가 주입될 수 있어야 합니다
       (`minimax`용 `MINIMAX_API_KEY`, `minimax-portal`용 `MINIMAX_OAUTH_TOKEN` 또는 저장된 MiniMax
       OAuth).
    3. 인증 경로에 맞는 정확한 모델 id(대소문자 구분)를 사용하세요:
       API 키 설정에서는 `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`,
       OAuth 설정에서는 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. 다음을 실행하세요:

       ```bash
       openclaw models list
       ```

       목록에서 선택하세요(또는 채팅에서 `/model list`).

    [MiniMax](/ko/providers/minimax)와 [Models](/ko/concepts/models)를 참고하세요.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로, 복잡한 작업에는 OpenAI를 쓸 수 있나요?">
    예. **MiniMax를 기본값으로** 두고 필요할 때 **session별로** 모델을 전환하세요.
    Fallback은 **오류용**이지 "어려운 작업"용이 아니므로, `/model` 또는 별도 agent를 사용하세요.

    **옵션 A: session별 전환**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    그런 다음:

    ```
    /model gpt
    ```

    **옵션 B: 별도 agents**

    - Agent A 기본값: MiniMax
    - Agent B 기본값: OpenAI
    - agent별로 라우팅하거나 `/agent`로 전환

    문서: [Models](/ko/concepts/models), [Multi-Agent Routing](/ko/concepts/multi-agent), [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 기본 제공 단축어인가요?">
    예. OpenClaw는 몇 가지 기본 shorthand를 제공합니다(`agents.defaults.models`에 해당 모델이 있을 때만 적용):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    같은 이름으로 직접 alias를 설정하면 사용자 값이 우선합니다.

  </Accordion>

  <Accordion title="모델 단축어(alias)는 어떻게 정의/override하나요?">
    Aliases는 `agents.defaults.models.<modelId>.alias`에서 옵니다. 예시:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로 해석됩니다.

  </Accordion>

  <Accordion title="OpenRouter나 Z.AI 같은 다른 provider의 모델은 어떻게 추가하나요?">
    OpenRouter(토큰당 과금, 다양한 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI(GLM 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model을 참조했는데 필요한 provider 키가 없으면 런타임 인증 오류가 납니다(예: `No API key found for provider "zai"`).

    **새 agent를 추가한 뒤 No API key found for provider가 뜨는 경우**

    이는 보통 **새 agent**의 auth store가 비어 있기 때문입니다. 인증은 agent별이며 다음 위치에 저장됩니다:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 방법:

    - `openclaw agents add <id>`를 실행하고 wizard에서 auth를 구성하세요.
    - 또는 메인 agent의 `agentDir`에서 `auth-profiles.json`을 새 agent의 `agentDir`로 복사하세요.

    agents 사이에서 `agentDir`를 재사용하지 마세요. 인증/session 충돌이 발생합니다.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치와 "All models failed"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 동작하나요?">
    장애 조치는 두 단계로 발생합니다:

    1. 같은 provider 내에서의 **Auth profile rotation**
    2. `agents.defaults.model.fallbacks`의 다음 모델로의 **