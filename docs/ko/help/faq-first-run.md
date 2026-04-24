---
read_when:
    - 새 설치, 멈춘 온보딩 또는 첫 실행 오류입니다.
    - 인증 및 제공자 구독 선택 중입니다.
    - docs.openclaw.ai에 접근할 수 없거나, 대시보드를 열 수 없거나, 설치가 멈춘 상태입니다.
sidebarTitle: First-run FAQ
summary: 'FAQ: 빠른 시작 및 첫 실행 설정 — 설치, 온보딩, 인증, 구독, 초기 실패'
title: 'FAQ: 첫 실행 설정'
x-i18n:
    generated_at: "2026-04-24T06:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  빠른 시작 및 첫 실행 관련 Q&A입니다. 일상적인 운영, 모델, 인증, 세션, 문제 해결은 메인 [FAQ](/ko/help/faq)를 참조하세요.

  ## 빠른 시작 및 첫 실행 설정

  <AccordionGroup>
  <Accordion title="막혔습니다. 가장 빠르게 해결하는 방법은?">
    **내 컴퓨터를 볼 수 있는** 로컬 AI 에이전트를 사용하세요. Discord에서 물어보는 것보다 훨씬 효과적입니다. 대부분의 "막혔어요" 문제는 원격 도우미가 확인할 수 없는 **로컬 config 또는 환경 문제**이기 때문입니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    이 도구들은 리포지토리를 읽고, 명령어를 실행하고, 로그를 확인하고, 머신 수준 설정(PATH, 서비스, 권한, 인증 파일)을 고치는 데 도움을 줄 수 있습니다. 해커블한(git) 설치를 통해 **전체 소스 체크아웃**을 제공하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 OpenClaw가 **git 체크아웃에서** 설치되므로, 에이전트가 코드와 문서를 읽고 현재 실행 중인 정확한 버전을 기준으로 추론할 수 있습니다. 나중에 `--install-method git` 없이 설치 프로그램을 다시 실행하면 언제든 stable로 돌아갈 수 있습니다.

    팁: 에이전트에게 해결 과정을 **계획하고 감독**하게 하세요(단계별). 그런 다음 필요한 명령만 실행하세요. 그러면 변경 범위가 작아지고 감사하기도 쉬워집니다.

    실제 버그나 수정 사항을 발견하면 GitHub 이슈를 등록하거나 PR을 보내 주세요:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    도움을 요청할 때는 먼저 다음 명령어를 실행하고 출력을 공유하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    각 명령의 역할:

    - `openclaw status`: gateway/에이전트 상태와 기본 config의 빠른 스냅샷
    - `openclaw models status`: 제공자 인증 및 모델 사용 가능 여부 확인
    - `openclaw doctor`: 일반적인 config/state 문제를 검증하고 복구

    그 밖에 유용한 CLI 점검: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    빠른 디버그 루프: [문제가 생겼을 때 처음 60초](#first-60-seconds-if-something-is-broken).
    설치 문서: [설치](/ko/install), [설치 프로그램 플래그](/ko/install/installer), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뛰어집니다. skip 이유는 무엇을 뜻하나요?">
    일반적인 heartbeat skip 이유:

    - `quiet-hours`: 구성된 활성 시간 창 밖임
    - `empty-heartbeat-file`: `HEARTBEAT.md`가 존재하지만 빈 내용이거나 헤더만 있는 스캐폴딩뿐임
    - `no-tasks-due`: `HEARTBEAT.md` 작업 모드가 활성화되어 있지만 아직 도래한 작업 간격이 없음
    - `alerts-disabled`: 모든 heartbeat 표시가 비활성화됨(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼짐)

    작업 모드에서는 실제 heartbeat 실행이 완료된 후에만 due 타임스탬프가 앞으로 이동합니다. 건너뛴 실행은 작업을 완료된 것으로 표시하지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [자동화 및 작업](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw를 설치하고 설정하는 권장 방법은?">
    이 리포지토리에서는 소스에서 실행하고 온보딩을 사용하는 방식을 권장합니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    이 마법사는 UI 자산도 자동으로 빌드할 수 있습니다. 온보딩 후에는 일반적으로 **18789** 포트에서 Gateway를 실행합니다.

    소스에서 시작(기여자/개발자용):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    아직 전역 설치가 없다면 `pnpm openclaw onboard`로 실행하세요.

  </Accordion>

  <Accordion title="온보딩 후 대시보드는 어떻게 열 수 있나요?">
    마법사는 온보딩 직후 브라우저에 깔끔한(토큰이 포함되지 않은) 대시보드 URL을 열고, 요약에도 해당 링크를 출력합니다. 그 탭을 열어 두세요. 자동으로 열리지 않았다면 같은 머신에서 출력된 URL을 복사해 붙여 넣으세요.
  </Accordion>

  <Accordion title="localhost와 원격에서 대시보드 인증은 어떻게 하나요?">
    **localhost(같은 머신):**

    - `http://127.0.0.1:18789/`를 엽니다.
    - 공유 비밀 인증을 요청하면 Control UI 설정에 구성된 token 또는 비밀번호를 붙여 넣습니다.
    - Token 소스: `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)
    - 비밀번호 소스: `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD`)
    - 아직 공유 비밀이 구성되지 않았다면 `openclaw doctor --generate-gateway-token`으로 token을 생성합니다.

    **localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): bind를 loopback으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 엽니다. `gateway.auth.allowTailscale`이 `true`이면 ID 헤더가 Control UI/WebSocket 인증을 충족합니다(공유 비밀을 붙여 넣을 필요 없음, 신뢰된 gateway 호스트 전제). HTTP API는 private-ingress `none` 또는 trusted-proxy HTTP auth를 의도적으로 사용하지 않는 한 여전히 공유 비밀 인증이 필요합니다.
      같은 클라이언트에서 동시에 잘못된 Serve 인증을 시도하면, 실패한 인증 제한기가 기록하기 전에 직렬화되므로 두 번째 잘못된 재시도는 이미 `retry later`를 표시할 수 있습니다.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"`을 실행하거나(또는 비밀번호 인증 구성) `http://<tailscale-ip>:18789/`를 연 다음, 대시보드 설정에 일치하는 공유 비밀을 붙여 넣습니다.
    - **ID 인식 리버스 프록시**: Gateway를 non-loopback trusted proxy 뒤에 두고 `gateway.auth.mode: "trusted-proxy"`를 구성한 다음 프록시 URL을 엽니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/`를 엽니다. 터널을 통해서도 공유 비밀 인증은 그대로 적용되므로, 요청받으면 구성된 token 또는 비밀번호를 붙여 넣으세요.

    bind 모드와 인증 세부 정보는 [대시보드](/ko/web/dashboard)와 [웹 표면](/ko/web)을 참조하세요.

  </Accordion>

  <Accordion title="채팅 승인에 exec approval config가 두 개 있는 이유는 무엇인가요?">
    서로 다른 계층을 제어합니다.

    - `approvals.exec`: 승인 프롬프트를 채팅 대상으로 전달
    - `channels.<channel>.execApprovals`: 해당 채널이 exec 승인에 대한 네이티브 승인 클라이언트로 동작하게 함

    실제 승인 게이트는 여전히 호스트 exec 정책입니다. 채팅 config는 승인 프롬프트가 어디에 표시되고, 사람들이 어떻게 응답할 수 있는지만 제어합니다.

    대부분의 설정에서는 **둘 다 필요하지 않습니다**:

    - 해당 채팅이 이미 명령어와 답글을 지원한다면 같은 채팅에서 `/approve`가 공통 경로를 통해 동작합니다.
    - 지원되는 네이티브 채널이 approver를 안전하게 추론할 수 있다면, OpenClaw는 이제 `channels.<channel>.execApprovals.enabled`가 미설정 또는 `"auto"`일 때 DM 우선 네이티브 승인을 자동 활성화합니다.
    - 네이티브 승인 카드/버튼을 사용할 수 있으면 그 네이티브 UI가 기본 경로가 됩니다. 에이전트는 도구 결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 말하는 경우에만 수동 `/approve` 명령을 포함해야 합니다.
    - 프롬프트를 다른 채팅 또는 별도의 운영 룸으로도 전달해야 할 때만 `approvals.exec`를 사용하세요.
    - 승인 프롬프트를 원래 방/토픽에 다시 게시하고 싶을 때만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하세요.
    - Plugin 승인은 또 별개입니다. 기본적으로 같은 채팅 `/approve`를 사용하고, 선택적으로 `approvals.plugin` 전달을 사용하며, 일부 네이티브 채널만 그 위에 plugin-approval-native 처리를 유지합니다.

    짧게 말하면: 전달은 라우팅용이고, 네이티브 클라이언트 config는 더 풍부한 채널별 UX용입니다.
    [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>

  <Accordion title="어떤 런타임이 필요한가요?">
    Node **>= 22**가 필요합니다. `pnpm`을 권장합니다. Gateway에는 Bun을 **권장하지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. Gateway는 가볍습니다. 문서에는 개인 용도로 **512MB-1GB RAM**, **1코어**, 약 **500MB**
    디스크면 충분하다고 나와 있으며, **Raspberry Pi 4에서 실행 가능**하다고 명시합니다.

    로그, 미디어, 다른 서비스 등을 위해 여유를 더 원한다면 **2GB를 권장**하지만,
    이것이 엄격한 최소 요구 사항은 아닙니다.

    팁: 작은 Pi/VPS에서 Gateway를 호스팅하고, 노트북/폰의 **Node**를 페어링해
    로컬 화면/카메라/canvas 또는 명령 실행에 사용할 수 있습니다. [Nodes](/ko/nodes)를 참조하세요.

  </Accordion>

  <Accordion title="Raspberry Pi 설치 팁이 있나요?">
    짧게 말하면: 동작하지만 거친 부분은 있을 수 있습니다.

    - **64비트** OS를 사용하고 Node는 22 이상을 유지하세요.
    - 로그를 보고 빠르게 업데이트할 수 있도록 **해커블(git) 설치**를 선호하세요.
    - 채널/Skills 없이 시작한 뒤 하나씩 추가하세요.
    - 이상한 바이너리 문제가 생기면 대개 **ARM 호환성** 문제입니다.

    문서: [Linux](/ko/platforms/linux), [설치](/ko/install).

  </Accordion>

  <Accordion title="wake up my friend에서 멈추거나 온보딩이 hatch되지 않습니다. 어떻게 하나요?">
    그 화면은 Gateway가 도달 가능하고 인증되어 있어야 동작합니다. TUI는 첫 hatch에서
    자동으로 "Wake up, my friend!"도 보냅니다. 그 줄이 표시되는데 **응답이 없고**
    token이 0에 머물러 있다면 에이전트가 전혀 실행되지 않은 것입니다.

    1. Gateway를 다시 시작하세요:

    ```bash
    openclaw gateway restart
    ```

    2. 상태와 인증을 확인하세요:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 그래도 멈추면 다음을 실행하세요:

    ```bash
    openclaw doctor
    ```

    Gateway가 원격에 있다면 터널/Tailscale 연결이 살아 있는지, UI가 올바른 Gateway를 가리키는지 확인하세요. [원격 액세스](/ko/gateway/remote)를 참조하세요.

  </Accordion>

  <Accordion title="새 머신(Mac mini)으로 설정을 옮길 수 있나요? 온보딩을 다시 해야 하나요?">
    가능합니다. **state 디렉터리**와 **workspace**를 복사한 뒤 Doctor를 한 번 실행하면 됩니다. 이렇게 하면 **두 위치를 모두** 복사하는 한 봇을 "완전히 동일하게"(메모리, 세션 기록, 인증, 채널 상태 포함) 유지할 수 있습니다.

    1. 새 머신에 OpenClaw를 설치합니다.
    2. 이전 머신의 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)를 복사합니다.
    3. workspace(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 재시작합니다.

    이렇게 하면 config, auth 프로필, WhatsApp 자격 증명, 세션, 메모리가 보존됩니다. 원격 모드라면 세션 저장소와 workspace는 gateway 호스트가 소유한다는 점을 기억하세요.

    **중요:** workspace만 GitHub에 커밋/푸시하면 **메모리 + 부트스트랩 파일**은 백업되지만, **세션 기록이나 인증**은 백업되지 않습니다. 그것들은 `~/.openclaw/` 아래에 있습니다(예: `~/.openclaw/agents/<agentId>/sessions/`).

    관련 항목: [마이그레이션](/ko/install/migrating), [디스크에서 파일 위치](#where-things-live-on-disk),
    [에이전트 workspace](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [원격 모드](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 변경 사항은 어디서 볼 수 있나요?">
    GitHub changelog를 확인하세요:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    최신 항목이 맨 위에 있습니다. 맨 위 섹션이 **Unreleased**로 표시되어 있다면, 그 다음 날짜가 있는 섹션이 최신 배포 버전입니다. 항목은 **Highlights**, **Changes**, **Fixes**(필요 시 docs/기타 섹션 포함)로 그룹화됩니다.

  </Accordion>

  <Accordion title="docs.openclaw.ai에 접근할 수 없습니다(SSL 오류)">
    일부 Comcast/Xfinity 연결은 Xfinity Advanced Security로 `docs.openclaw.ai`를 잘못 차단합니다. 해당 기능을 끄거나 `docs.openclaw.ai`를 allowlist에 추가한 뒤 다시 시도하세요.
    차단 해제에 도움을 주시려면 여기로 보고해 주세요: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    그래도 사이트에 접근할 수 없다면 문서는 GitHub에도 미러링되어 있습니다:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable과 beta의 차이">
    **Stable**과 **beta**는 별도의 코드 라인이 아니라 **npm dist-tag**입니다.

    - `latest` = stable
    - `beta` = 테스트용 초기 빌드

    일반적으로 stable 릴리스는 먼저 **beta**에 올라가고, 이후 명시적인 승격 단계에서 동일한 버전이 `latest`로 이동합니다. 유지관리자가 필요에 따라 바로 `latest`로 게시할 수도 있습니다. 그래서 승격 후에는 beta와 stable이 **같은 버전**을 가리킬 수 있습니다.

    변경 사항 보기:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    설치 원라이너와 beta와 dev의 차이는 아래 아코디언을 참조하세요.

  </Accordion>

  <Accordion title="beta 버전은 어떻게 설치하나요? 그리고 beta와 dev의 차이는 무엇인가요?">
    **Beta**는 npm dist-tag `beta`입니다(승격 후 `latest`와 같을 수 있음).
    **Dev**는 `main`의 이동하는 헤드(git)이며, 게시될 때는 npm dist-tag `dev`를 사용합니다.

    원라이너(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    자세한 내용: [개발 채널](/ko/install/development-channels) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="최신 빌드는 어떻게 써보나요?">
    두 가지 방법이 있습니다.

    1. **Dev 채널(git 체크아웃):**

    ```bash
    openclaw update --channel dev
    ```

    이렇게 하면 `main` 브랜치로 전환하고 소스에서 업데이트합니다.

    2. **해커블 설치(설치 사이트에서):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 수정 가능한 로컬 리포지토리를 받게 되고, 이후 git으로 업데이트할 수 있습니다.

    수동으로 깔끔하게 clone하고 싶다면 다음을 사용하세요.

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    문서: [업데이트](/ko/cli/update), [개발 채널](/ko/install/development-channels),
    [설치](/ko/install).

  </Accordion>

  <Accordion title="설치와 온보딩은 보통 얼마나 걸리나요?">
    대략적인 기준:

    - **설치:** 2-5분
    - **온보딩:** 구성하는 채널/모델 수에 따라 5-15분

    멈춘 경우 [설치 프로그램이 멈췄나요?](#quick-start-and-first-run-setup)
    및 [막혔습니다](#quick-start-and-first-run-setup)의 빠른 디버그 루프를 사용하세요.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄나요? 더 많은 피드백은 어떻게 보나요?">
    설치 프로그램을 **verbose 출력**으로 다시 실행하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose를 사용한 beta 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    해커블(git) 설치:

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

    더 많은 옵션: [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치에서 git not found 또는 openclaw not recognized가 나옵니다">
    Windows에서는 흔한 문제가 두 가지 있습니다.

    **1) npm error spawn git / git not found**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하세요.
    - PowerShell을 닫았다가 다시 연 다음 설치 프로그램을 다시 실행하세요.

    **2) 설치 후 openclaw is not recognized**

    - npm 전역 bin 폴더가 PATH에 없습니다.
    - 경로 확인:

      ```powershell
      npm config get prefix
      ```

    - 그 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사가 필요하지 않으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PATH를 수정한 뒤 PowerShell을 닫았다가 다시 열어야 합니다.

    가장 매끄러운 Windows 설정을 원한다면 네이티브 Windows 대신 **WSL2**를 사용하세요.
    문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에 깨진 중국어 텍스트가 보입니다. 어떻게 해야 하나요?">
    이는 보통 네이티브 Windows 셸에서 콘솔 코드 페이지가 맞지 않아서 생깁니다.

    증상:

    - `system.run`/`exec` 출력에서 중국어가 깨져 보임
    - 같은 명령어가 다른 터미널 프로필에서는 정상적으로 보임

    PowerShell에서의 빠른 해결 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그런 다음 Gateway를 재시작하고 명령을 다시 시도하세요.

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 계속 재현된다면 다음에서 추적/제보하세요.

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="문서가 제 질문에 답하지 못했습니다. 더 나은 답을 얻으려면 어떻게 해야 하나요?">
    **해커블(git) 설치**를 사용해 전체 소스와 문서를 로컬에 두고, 그다음 _해당 폴더에서_ 봇(또는 Claude/Codex)에게 물어보세요. 그러면 리포지토리를 읽고 더 정확하게 답할 수 있습니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [설치](/ko/install) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw는 어떻게 설치하나요?">
    짧은 답: Linux 가이드를 따른 뒤 온보딩을 실행하세요.

    - Linux 빠른 경로 + 서비스 설치: [Linux](/ko/platforms/linux)
    - 전체 안내: [시작하기](/ko/start/getting-started)
    - 설치 프로그램 + 업데이트: [설치 및 업데이트](/ko/install/updating)

  </Accordion>

  <Accordion title="VPS에 OpenClaw를 어떻게 설치하나요?">
    어떤 Linux VPS든 동작합니다. 서버에 설치한 뒤 SSH/Tailscale로 Gateway에 접근하세요.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 액세스: [Gateway remote](/ko/gateway/remote).

  </Accordion>

  <Accordion title="클라우드/VPS 설치 가이드는 어디 있나요?">
    일반적인 제공자를 모아둔 **호스팅 허브**가 있습니다. 하나를 선택해 가이드를 따르세요.

    - [VPS 호스팅](/ko/vps) (모든 제공자를 한곳에)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    클라우드에서의 동작 방식: **Gateway는 서버에서 실행**되고, 노트북/휴대폰에서
    Control UI(또는 Tailscale/SSH)를 통해 접근합니다. 상태 + workspace는 서버에
    저장되므로, 해당 호스트를 진실 공급원으로 취급하고 백업하세요.

    클라우드 Gateway에 **Node**(Mac/iOS/Android/headless)를 페어링하면
    Gateway는 클라우드에 유지하면서도 로컬 화면/카메라/canvas에 접근하거나
    노트북에서 명령을 실행할 수 있습니다.

    허브: [플랫폼](/ko/platforms). 원격 액세스: [Gateway remote](/ko/gateway/remote).
    Nodes: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw에게 스스로 업데이트하라고 시킬 수 있나요?">
    짧은 답: **가능하지만 권장하지 않습니다**. 업데이트 흐름은
    Gateway를 재시작할 수 있고(활성 세션이 끊김), 깨끗한 git 체크아웃이
    필요할 수 있으며, 확인 프롬프트가 나올 수도 있습니다. 더 안전한 방법은
    운영자가 셸에서 업데이트를 실행하는 것입니다.

    CLI 사용:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    에이전트에서 꼭 자동화해야 한다면:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    문서: [업데이트](/ko/cli/update), [업데이트하기](/ko/install/updating).

  </Accordion>

  <Accordion title="온보딩은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장되는 설정 경로입니다. **로컬 모드**에서 다음을 안내합니다.

    - **모델/인증 설정**(제공자 OAuth, API key, Anthropic setup-token, LM Studio 같은 로컬 모델 옵션 포함)
    - **Workspace** 위치 + 부트스트랩 파일
    - **Gateway 설정**(bind/port/auth/tailscale)
    - **채널**(WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, 그리고 QQ Bot 같은 번들 채널 Plugins)
    - **데몬 설치**(macOS의 LaunchAgent, Linux/WSL2의 systemd user unit)
    - **상태 검사** 및 **Skills** 선택

    또한 구성된 모델이 알 수 없거나 인증이 없으면 경고합니다.

  </Accordion>

  <Accordion title="이걸 실행하려면 Claude나 OpenAI 구독이 필요한가요?">
    아닙니다. OpenClaw는 **API key**(Anthropic/OpenAI/기타)를 사용하거나,
    데이터가 기기에 남도록 **로컬 전용 모델**만으로도 실행할 수 있습니다. 구독(Claude
    Pro/Max 또는 OpenAI Codex)은 해당 제공자 인증을 위한 선택적 방법일 뿐입니다.

    OpenClaw에서 Anthropic의 실질적인 구분은 다음과 같습니다.

    - **Anthropic API key**: 일반 Anthropic API 과금
    - **OpenClaw 내부의 Claude CLI / Claude 구독 인증**: Anthropic 직원이
      이 사용이 다시 허용된다고 알려왔고, Anthropic이 새 정책을 발표하지 않는 한
      OpenClaw는 이 통합에 대해 `claude -p` 사용을 허용된 것으로 취급합니다.

    장기간 실행되는 gateway 호스트에서는 Anthropic API key가 여전히 더 예측 가능한
    설정입니다. OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서 사용하는 것이 명시적으로 지원됩니다.

    OpenClaw는 그 외에도 다음과 같은 호스팅 구독형 옵션을 지원합니다.
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, 그리고
    **Z.AI / GLM Coding Plan**

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [GLM Models](/ko/providers/glm),
    [로컬 모델](/ko/gateway/local-models), [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="API key 없이 Claude Max 구독을 사용할 수 있나요?">
    예.

    Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로,
    Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해 Claude 구독 인증과
    `claude -p` 사용을 허용된 것으로 취급합니다. 가장 예측 가능한 서버 측 설정을 원한다면
    대신 Anthropic API key를 사용하세요.

  </Accordion>

  <Accordion title="Claude 구독 인증(Claude Pro 또는 Max)을 지원하나요?">
    예.

    Anthropic 직원이 이 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 것으로 취급합니다.

    Anthropic setup-token도 여전히 지원되는 OpenClaw token 경로로 제공되지만, 가능하면 OpenClaw는 이제 Claude CLI 재사용과 `claude -p`를 우선합니다.
    프로덕션 또는 다중 사용자 워크로드에서는 Anthropic API key 인증이 여전히 더
    안전하고 예측 가능한 선택입니다. OpenClaw에서 다른 구독형 호스팅 옵션을 원한다면
    [OpenAI](/ko/providers/openai), [Qwen / Model
    Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [GLM
    Models](/ko/providers/glm)을 참조하세요.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="왜 Anthropic에서 HTTP 429 rate_limit_error가 보이나요?">
    현재 창에서 **Anthropic 할당량/속도 제한**이 소진되었다는 뜻입니다. **Claude CLI**를
    사용 중이라면 창이 재설정될 때까지 기다리거나 요금제를 업그레이드하세요. **Anthropic API key**를
    사용 중이라면 Anthropic Console에서 사용량/과금을 확인하고 필요하면 제한을 올리세요.

    메시지가 특히 다음과 같다면:
    `Extra usage is required for long context requests`
    요청이 Anthropic의 1M 컨텍스트 베타(`context1m: true`)를 사용하려는 것입니다. 이는
    자격 증명이 장문맥 과금에 적합할 때만 동작합니다(API key 과금 또는 Extra Usage가 활성화된
    OpenClaw Claude 로그인 경로).

    팁: **대체 모델**을 설정해 두면 제공자가 속도 제한에 걸렸을 때도 OpenClaw가 계속 응답할 수 있습니다.
    [모델](/ko/cli/models), [OAuth](/ko/concepts/oauth), 그리고
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참조하세요.

  </Accordion>

  <Accordion title="AWS Bedrock을 지원하나요?">
    예. OpenClaw에는 번들된 **Amazon Bedrock (Converse)** 제공자가 있습니다. AWS env 마커가 있으면 OpenClaw가 스트리밍/텍스트 Bedrock 카탈로그를 자동으로 검색해 암시적 `amazon-bedrock` 제공자로 병합할 수 있습니다. 그렇지 않으면 `plugins.entries.amazon-bedrock.config.discovery.enabled`를 명시적으로 활성화하거나 수동 제공자 항목을 추가할 수 있습니다. [Amazon Bedrock](/ko/providers/bedrock) 및 [모델 제공자](/ko/providers/models)를 참조하세요. 관리형 key 흐름을 선호한다면 Bedrock 앞단에 OpenAI 호환 프록시를 두는 방식도 여전히 유효합니다.
  </Accordion>

  <Accordion title="Codex 인증은 어떻게 동작하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Code (Codex)**를 지원합니다. 기본 PI runner를 통한 Codex OAuth에는
    `openai-codex/gpt-5.5`를 사용하세요. 현재 직접 OpenAI API key 액세스에는
    `openai/gpt-5.4`를 사용합니다. GPT-5.5 직접 API key 액세스는 OpenAI가 공개 API에서 이를 활성화하면 지원되며, 현재 GPT-5.5는 `openai-codex/gpt-5.5`를 통한 구독/OAuth 또는 `openai/gpt-5.5`와 `embeddedHarness.runtime: "codex"`를 사용하는 네이티브 Codex app-server 실행을 사용합니다.
    [모델 제공자](/ko/concepts/model-providers) 및 [온보딩(CLI)](/ko/start/wizard)를 참조하세요.
  </Accordion>

  <Accordion title="왜 OpenClaw는 아직도 openai-codex를 언급하나요?">
    `openai-codex`는 ChatGPT/Codex OAuth의 provider이자 auth-profile ID입니다.
    또한 Codex OAuth의 명시적 PI 모델 접두사이기도 합니다.

    - `openai/gpt-5.4` = 현재 PI의 직접 OpenAI API key 경로
    - `openai/gpt-5.5` = OpenAI가 API에서 GPT-5.5를 활성화한 후의 미래 직접 API key 경로
    - `openai-codex/gpt-5.5` = PI의 Codex OAuth 경로
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = 네이티브 Codex app-server 경로
    - `openai-codex:...` = 모델 ref가 아니라 auth profile ID

    직접 OpenAI Platform 과금/제한 경로를 원한다면
    `OPENAI_API_KEY`를 설정하세요. ChatGPT/Codex 구독 인증을 원한다면
    `openclaw models auth login --provider openai-codex`로 로그인하고
    PI 실행에는 `openai-codex/*` 모델 ref를 사용하세요.

  </Accordion>

  <Accordion title="왜 Codex OAuth 한도가 ChatGPT 웹과 다를 수 있나요?">
    Codex OAuth는 OpenAI가 관리하는 요금제별 할당량 창을 사용합니다. 실제로는,
    두 경우 모두 같은 계정에 연결되어 있어도 그 한도는 ChatGPT 웹/앱 경험과 다를 수 있습니다.

    OpenClaw는 현재 보이는 제공자 사용량/할당량 창을
    `openclaw models status`에서 보여줄 수 있지만, ChatGPT 웹 권한을 직접 API 액세스로
    만들어내거나 정규화하지는 않습니다. 직접 OpenAI Platform 과금/제한 경로를 원한다면
    API key와 함께 `openai/*`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI 구독 인증(Codex OAuth)을 지원하나요?">
    예. OpenClaw는 **OpenAI Code (Codex) 구독 OAuth**를 완전히 지원합니다.
    OpenAI는 OpenClaw 같은 외부 도구/워크플로에서의 구독 OAuth 사용을 명시적으로 허용합니다.
    온보딩이 OAuth 흐름을 대신 실행할 수 있습니다.

    [OAuth](/ko/concepts/oauth), [모델 제공자](/ko/concepts/model-providers), [온보딩(CLI)](/ko/start/wizard)를 참조하세요.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`에 client ID나 secret를 넣는 방식이 아니라 **Plugin 인증 흐름**을 사용합니다.

    단계:

    1. 로컬에 Gemini CLI를 설치해서 `gemini`가 `PATH`에 있도록 합니다.
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin 활성화: `openclaw plugins enable google`
    3. 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    5. 요청이 실패하면 gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.

    이렇게 하면 OAuth token이 gateway 호스트의 auth 프로필에 저장됩니다. 자세한 내용: [모델 제공자](/ko/concepts/model-providers).

  </Accordion>

  <Accordion title="가벼운 잡담에는 로컬 모델도 괜찮나요?">
    보통은 아닙니다. OpenClaw는 큰 컨텍스트와 강한 안전성이 필요하며, 작은 GPU는 잘라내고 누출을 일으킵니다. 꼭 써야 한다면 로컬에서 실행 가능한 **가장 큰** 모델 빌드(LM Studio)를 사용하고 [/gateway/local-models](/ko/gateway/local-models)를 참조하세요. 더 작거나 양자화된 모델은 프롬프트 인젝션 위험을 높입니다. [보안](/ko/gateway/security)을 참조하세요.
  </Accordion>

  <Accordion title="호스팅 모델 트래픽을 특정 지역에 유지하려면 어떻게 하나요?">
    지역 고정 엔드포인트를 선택하세요. OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공합니다. 해당 미국 호스팅 변형을 선택하면 데이터를 해당 지역에 유지할 수 있습니다. `models.mode: "merge"`를 사용하면 Anthropic/OpenAI도 함께 나열하여, 선택한 지역 제공자를 유지하면서도 대체 경로를 계속 사용할 수 있습니다.
  </Accordion>

  <Accordion title="이걸 설치하려면 Mac Mini를 꼭 사야 하나요?">
    아닙니다. OpenClaw는 macOS 또는 Linux에서 실행되며(Windows는 WSL2를 통해), Mac mini는 선택 사항입니다. 일부 사용자는 항상 켜 두는 호스트로 Mac mini를 구매하지만, 작은 VPS, 홈 서버, 또는 Raspberry Pi급 장비도 사용할 수 있습니다.

    Mac이 필요한 것은 **macOS 전용 도구**를 쓸 때뿐입니다. iMessage에는 [BlueBubbles](/ko/channels/bluebubbles)(권장)를 사용하세요. BlueBubbles 서버는 아무 Mac에서나 실행할 수 있고, Gateway는 Linux나 다른 곳에서 실행되어도 됩니다. 다른 macOS 전용 도구를 원한다면 Gateway를 Mac에서 실행하거나 macOS node를 페어링하세요.

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes), [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage 지원을 위해 Mac mini가 필요한가요?">
    Messages에 로그인된 **어떤 macOS 기기든** 필요합니다. 꼭 Mac mini일 필요는 없습니다. iMessage에는 **[BlueBubbles](/ko/channels/bluebubbles)**(권장)를 사용하세요. BlueBubbles 서버는 macOS에서 실행되고, Gateway는 Linux나 다른 곳에서 실행될 수 있습니다.

    일반적인 구성:

    - Gateway는 Linux/VPS에서 실행하고, BlueBubbles 서버는 Messages에 로그인된 아무 Mac에서나 실행
    - 가장 단순한 단일 머신 설정을 원하면 모든 것을 Mac에서 실행

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes),
    [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw를 돌리려고 Mac mini를 사면, 내 MacBook Pro와 연결할 수 있나요?">
    예. **Mac mini는 Gateway를 실행**하고, MacBook Pro는 **node**(동반 장치)로 연결할 수 있습니다. Node는 Gateway를 실행하지 않습니다. 대신 그 장치의 화면/카메라/canvas 및 `system.run` 같은 추가 기능을 제공합니다.

    일반적인 패턴:

    - Gateway는 Mac mini에서 실행(항상 켜짐)
    - MacBook Pro는 macOS 앱 또는 node host를 실행하고 Gateway에 페어링
    - 상태는 `openclaw nodes status` / `openclaw nodes list`로 확인

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 사용할 수 있나요?">
    Bun은 **권장하지 않습니다**. 특히 WhatsApp과 Telegram에서 런타임 버그가 관찰됩니다.
    안정적인 gateway에는 **Node**를 사용하세요.

    그래도 Bun으로 실험하고 싶다면 WhatsApp/Telegram이 없는 비프로덕션 gateway에서만 하세요.

  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇을 넣나요?">
    `channels.telegram.allowFrom`에는 **사람 발신자의 Telegram 사용자 ID**(숫자)가 들어갑니다. 봇 사용자명이 아닙니다.

    설정 과정은 숫자 사용자 ID만 받습니다. 이미 config에 레거시 `@username` 항목이 있다면 `openclaw doctor --fix`가 이를 확인해 볼 수 있습니다.

    더 안전한 방법(서드파티 봇 없음):

    - 봇에게 DM을 보낸 다음 `openclaw logs --follow`를 실행해 `from.id`를 읽으세요.

    공식 Bot API:

    - 봇에게 DM을 보낸 다음 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 읽으세요.

    서드파티(덜 사적임):

    - `@userinfobot` 또는 `@getidsbot`에 DM

    [/channels/telegram](/ko/channels/telegram#access-control-and-activation)을 참조하세요.

  </Accordion>

  <Accordion title="하나의 WhatsApp 번호를 여러 OpenClaw 인스턴스에서 여러 사람이 각자 다르게 쓸 수 있나요?">
    예, **멀티 에이전트 라우팅**을 통해 가능합니다. 각 발신자의 WhatsApp **DM**(peer `kind: "direct"`, 발신자 E.164 형식 `+15551234567`)을 서로 다른 `agentId`에 바인딩하면, 각 사람은 자기만의 workspace와 세션 저장소를 갖게 됩니다. 답글은 여전히 **같은 WhatsApp 계정**에서 나오며, DM 액세스 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 WhatsApp 계정별로 전역입니다. [멀티 에이전트 라우팅](/ko/concepts/multi-agent)과 [WhatsApp](/ko/channels/whatsapp)을 참조하세요.
  </Accordion>

  <Accordion title='“빠른 채팅” 에이전트와 “코딩용 Opus” 에이전트를 각각 둘 수 있나요?'>
    예. 멀티 에이전트 라우팅을 사용하세요. 각 에이전트에 별도의 기본 모델을 지정한 뒤, 인바운드 라우트(제공자 계정 또는 특정 peer)를 각 에이전트에 바인딩하면 됩니다. 예시 config는 [멀티 에이전트 라우팅](/ko/concepts/multi-agent)에 있습니다. [모델](/ko/concepts/models) 및 [구성](/ko/gateway/configuration)도 참조하세요.
  </Accordion>

  <Accordion title="Homebrew는 Linux에서도 동작하나요?">
    예. Homebrew는 Linux(Linuxbrew)를 지원합니다. 빠른 설정:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw를 systemd로 실행한다면 서비스 PATH에 `/home/linuxbrew/.linuxbrew/bin`(또는 사용 중인 brew prefix)이 포함되어 있어야, `brew`로 설치한 도구가 비로그인 셸에서도 확인됩니다.
    최신 빌드는 Linux systemd 서비스에서 일반적인 사용자 bin 디렉터리(예: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`)를 앞에 추가하고, 설정된 경우 `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`도 존중합니다.

  </Accordion>

  <Accordion title="해커블 git 설치와 npm 설치의 차이">
    - **해커블(git) 설치:** 전체 소스 체크아웃, 수정 가능, 기여자에게 가장 적합
      로컬에서 빌드를 실행하고 코드/문서를 직접 수정할 수 있습니다.
    - **npm 설치:** 전역 CLI 설치, 리포지토리 없음, “그냥 실행” 목적에 가장 적합
      업데이트는 npm dist-tag에서 가져옵니다.

    문서: [시작하기](/ko/start/getting-started), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치를 서로 전환할 수 있나요?">
    예. 다른 방식으로 설치한 뒤 Doctor를 실행하면 gateway 서비스가 새 entrypoint를 가리키게 됩니다.
    이 작업은 **데이터를 삭제하지 않습니다**. OpenClaw 코드 설치만 바뀌며, state
    (`~/.openclaw`)와 workspace (`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git으로:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git에서 npm으로:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor는 gateway 서비스 entrypoint 불일치를 감지하고 현재 설치와 일치하도록 서비스 config를 다시 쓰겠다고 제안합니다(자동화에서는 `--repair` 사용).

    백업 팁: [백업 전략](#where-things-live-on-disk)을 참조하세요.

  </Accordion>

  <Accordion title="Gateway는 노트북에서 돌려야 하나요, 아니면 VPS가 나을까요?">
    짧은 답: **24/7 신뢰성이 중요하다면 VPS를 쓰세요**. 가장 낮은 마찰이 중요하고 슬립/재시작을 감수할 수 있다면 로컬에서 실행하세요.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용 없음, 로컬 파일에 직접 접근 가능, 실제 브라우저 창 사용 가능
    - **단점:** 슬립/네트워크 끊김 = 연결 끊김, OS 업데이트/재부팅으로 중단, 계속 켜둬야 함

    **VPS / 클라우드**

    - **장점:** 항상 켜짐, 안정적인 네트워크, 노트북 슬립 문제 없음, 계속 실행 상태 유지가 쉬움
    - **단점:** 보통 headless로 실행(스크린샷 사용), 원격 파일 액세스만 가능, 업데이트하려면 SSH가 필요함

    **OpenClaw 관련 참고:** WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서 문제없이 동작합니다. 실제 트레이드오프는 **헤드리스 브라우저**와 눈에 보이는 브라우저 창 사이의 차이뿐입니다. [브라우저](/ko/tools/browser)를 참조하세요.

    **권장 기본값:** 이전에 gateway 연결 끊김을 겪었다면 VPS를 권장합니다. 로컬 실행은 Mac을 활발히 사용 중이고 로컬 파일 액세스나 보이는 브라우저를 통한 UI 자동화가 필요할 때 훌륭합니다.

  </Accordion>

  <Accordion title="OpenClaw를 전용 머신에서 돌리는 것이 얼마나 중요한가요?">
    필수는 아니지만, **신뢰성과 격리 측면에서 권장**됩니다.

    - **전용 호스트(VPS/Mac mini/Pi):** 항상 켜져 있고, 슬립/재부팅 중단이 적고, 권한이 더 깔끔하며, 계속 실행 상태를 유지하기 쉽습니다.
    - **공용 노트북/데스크톱:** 테스트와 활발한 사용에는 충분히 괜찮지만, 머신이 슬립하거나 업데이트될 때 중단을 예상해야 합니다.

    둘 다 원한다면 Gateway는 전용 호스트에 두고, 노트북은 로컬 화면/카메라/exec 도구용 **node**로 페어링하세요. [Nodes](/ko/nodes)를 참조하세요.
    보안 지침은 [보안](/ko/gateway/security)을 읽어보세요.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    OpenClaw는 가볍습니다. 기본 Gateway + 하나의 채팅 채널 기준:

    - **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크
    - **권장:** 여유 공간을 위해 1-2 vCPU, 2GB RAM 이상(로그, 미디어, 여러 채널). Node 도구와 브라우저 자동화는 리소스를 많이 사용할 수 있습니다.

    OS는 **Ubuntu LTS**(또는 최신 Debian/Ubuntu 계열)를 사용하세요. Linux 설치 경로는 그 환경에서 가장 잘 검증되어 있습니다.

    문서: [Linux](/ko/platforms/linux), [VPS 호스팅](/ko/vps).

  </Accordion>

  <Accordion title="VM에서 OpenClaw를 실행할 수 있나요? 요구 사항은 무엇인가요?">
    예. VM도 VPS와 동일하게 취급하면 됩니다. 항상 켜져 있어야 하고, 접근 가능해야 하며,
    Gateway와 활성화한 채널을 돌릴 만큼 충분한 RAM이 필요합니다.

    기본 가이드:

    - **절대 최소:** 1 vCPU, 1GB RAM
    - **권장:** 여러 채널, 브라우저 자동화, 미디어 도구를 사용한다면 2GB RAM 이상
    - **OS:** Ubuntu LTS 또는 다른 최신 Debian/Ubuntu

    Windows라면 **WSL2가 가장 쉬운 VM 스타일 설정**이며 도구 호환성도 가장 좋습니다.
    [Windows](/ko/platforms/windows), [VPS 호스팅](/ko/vps)을 참조하세요.
    macOS를 VM에서 실행 중이라면 [macOS VM](/ko/install/macos-vm)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 메인 FAQ(모델, 세션, gateway, 보안 등)
- [설치 개요](/ko/install)
- [시작하기](/ko/start/getting-started)
- [문제 해결](/ko/help/troubleshooting)
