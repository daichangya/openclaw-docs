---
read_when:
    - 일반적인 설정, 설치, 온보딩, 런타임 지원 질문에 답하기
    - 더 깊은 디버깅 전에 사용자 보고 문제 분류하기
summary: OpenClaw 설정, 구성, 사용에 관한 자주 묻는 질문
title: FAQ
x-i18n:
    generated_at: "2026-04-24T06:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

실제 환경(로컬 개발, VPS, 다중 에이전트, OAuth/API 키, 모델 장애 조치)에 맞춘 빠른 답변과 더 깊은 문제 해결입니다. 런타임 진단은 [Troubleshooting](/ko/gateway/troubleshooting)을 참조하세요. 전체 설정 참조는 [Configuration](/ko/gateway/configuration)을 참조하세요.

## 문제가 있을 때 첫 60초

1. **빠른 상태 확인(첫 번째 점검)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, gateway/서비스 도달 가능 여부, 에이전트/세션, provider 설정 + 런타임 문제(gateway에 도달 가능한 경우)

2. **공유 가능한 보고서(안전하게 공유 가능)**

   ```bash
   openclaw status --all
   ```

   읽기 전용 진단 + 로그 tail 포함(토큰은 마스킹됨)

3. **Daemon + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   supervisor 런타임 vs RPC 도달 가능 여부, probe 대상 URL, 서비스가 사용했을 가능성이 높은 설정을 보여줍니다.

4. **심층 probe**

   ```bash
   openclaw status --deep
   ```

   지원되는 경우 채널 probe를 포함한 라이브 gateway health probe를 실행합니다
   (도달 가능한 gateway 필요). [Health](/ko/gateway/health)를 참조하세요.

5. **최신 로그 tail**

   ```bash
   openclaw logs --follow
   ```

   RPC가 내려가 있으면 다음으로 대체하세요.

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [Logging](/ko/logging) 및 [Troubleshooting](/ko/gateway/troubleshooting)을 참조하세요.

6. **doctor 실행(수리)**

   ```bash
   openclaw doctor
   ```

   설정/상태를 수리/마이그레이션하고 health 점검을 실행합니다. [Doctor](/ko/gateway/doctor)를 참조하세요.

7. **Gateway 스냅샷**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   실행 중인 gateway에 전체 스냅샷을 요청합니다(WS 전용). [Health](/ko/gateway/health)를 참조하세요.

## 빠른 시작 및 첫 실행 설정

첫 실행 설정 Q&A — 설치, 온보딩, 인증 경로, 구독, 초기
실패 — 는 전용 페이지로 이동했습니다:
[FAQ — quick start and first-run setup](/ko/help/faq-first-run).

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="OpenClaw를 한 문단으로 설명하면?">
    OpenClaw는 사용자의 자체 기기에서 실행하는 개인 AI 비서입니다. 이미 사용하는 메시징 표면(WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, 그리고 QQ Bot 같은 번들 채널 Plugin)에서 응답하며, 지원되는 플랫폼에서는 음성과 라이브 Canvas도 사용할 수 있습니다. **Gateway**는 항상 켜져 있는 제어 평면이며, 비서가 제품입니다.
  </Accordion>

  <Accordion title="가치 제안">
    OpenClaw는 "단순한 Claude 래퍼"가 아닙니다. **로컬 우선 제어 평면**으로서,
    **사용자 자신의 하드웨어**에서 유능한 비서를 실행하고, 이미 사용하는 채팅 앱에서 접근할 수 있으며,
    상태가 있는 세션, 메모리, 도구를 제공하면서도 워크플로 제어를 호스팅된
    SaaS에 넘기지 않도록 해줍니다.

    핵심 장점:

    - **사용자의 기기, 사용자의 데이터:** Gateway를 원하는 곳(Mac, Linux, VPS)에서 실행하고
      워크스페이스 + 세션 기록을 로컬에 유지할 수 있습니다.
    - **웹 샌드박스가 아닌 실제 채널:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등,
      지원되는 플랫폼에서는 모바일 음성과 Canvas도 제공합니다.
    - **모델 비종속적:** Anthropic, OpenAI, MiniMax, OpenRouter 등을 에이전트별 라우팅
      및 장애 조치와 함께 사용할 수 있습니다.
    - **로컬 전용 옵션:** 로컬 모델을 실행해 원한다면 **모든 데이터가 기기에만 머물도록** 할 수 있습니다.
    - **다중 에이전트 라우팅:** 채널, 계정, 작업별로 별도 에이전트를 두고, 각자
      워크스페이스와 기본값을 갖게 할 수 있습니다.
    - **오픈 소스 및 확장 가능:** 벤더 종속 없이 직접 확인하고, 확장하고, 셀프 호스팅할 수 있습니다.

    문서: [Gateway](/ko/gateway), [Channels](/ko/channels), [Multi-agent](/ko/concepts/multi-agent),
    [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정했어요. 먼저 무엇을 해보면 좋을까요?">
    좋은 첫 프로젝트 예시:

    - 웹사이트 만들기(WordPress, Shopify, 또는 간단한 정적 사이트)
    - 모바일 앱 프로토타이핑(개요, 화면, API 계획)
    - 파일과 폴더 정리(정리, 이름 규칙, 태깅)
    - Gmail 연결 후 요약 또는 후속 조치 자동화

    큰 작업도 처리할 수 있지만, 여러 단계로 나누고
    병렬 작업에 sub agent를 사용할 때 가장 잘 작동합니다.

  </Accordion>

  <Accordion title="OpenClaw의 일상적인 상위 5가지 활용 사례는 무엇인가요?">
    일상에서의 효과는 보통 다음과 같습니다.

    - **개인 브리핑:** 받은편지함, 캘린더, 관심 뉴스 요약
    - **리서치 및 초안 작성:** 빠른 리서치, 요약, 이메일이나 문서의 첫 초안
    - **리마인더 및 후속 조치:** Cron 또는 Heartbeat 기반의 알림과 체크리스트
    - **브라우저 자동화:** 양식 작성, 데이터 수집, 반복 웹 작업
    - **기기 간 조정:** 휴대폰에서 작업을 보내고, Gateway가 서버에서 실행한 뒤, 결과를 채팅으로 돌려받기

  </Accordion>

  <Accordion title="OpenClaw가 SaaS의 리드 생성, 아웃리치, 광고, 블로그 작업에 도움이 되나요?">
    **리서치, 자격 검토, 초안 작성**에는 도움이 됩니다. 사이트를 스캔하고, 짧은 후보 목록을 만들고,
    잠재 고객을 요약하고, 아웃리치나 광고 문구 초안을 작성할 수 있습니다.

    **아웃리치나 광고 실행**의 경우에는 사람을 루프에 두세요. 스팸을 피하고, 현지 법률과
    플랫폼 정책을 따르며, 전송 전에 모든 내용을 검토하세요. 가장 안전한 패턴은
    OpenClaw가 초안을 만들고 사용자가 승인하는 방식입니다.

    문서: [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code 대비 장점은 무엇인가요?">
    OpenClaw는 IDE 대체재가 아니라 **개인 비서**이자 조정 계층입니다. 저장소 내부에서
    가장 빠른 직접 코딩 루프를 원한다면 Claude Code나 Codex를 사용하세요. 지속적인 메모리, 기기 간 접근, 도구 오케스트레이션이 필요할 때 OpenClaw를 사용하세요.

    장점:

    - 세션 간 **지속적인 메모리 + 워크스페이스**
    - **다중 플랫폼 접근**(WhatsApp, Telegram, TUI, WebChat)
    - **도구 오케스트레이션**(브라우저, 파일, 일정 예약, hooks)
    - **항상 켜져 있는 Gateway**(VPS에서 실행하고 어디서든 상호작용 가능)
    - 로컬 브라우저/화면/카메라/exec용 **Nodes**

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 및 자동화

<AccordionGroup>
  <Accordion title="저장소를 더럽히지 않고 Skills를 어떻게 사용자 지정하나요?">
    저장소 사본을 편집하는 대신 관리형 재정의를 사용하세요. 변경 사항은 `~/.openclaw/skills/<name>/SKILL.md`에 두거나(`~/.openclaw/openclaw.json`의 `skills.load.extraDirs`로 폴더 추가 가능), 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`이므로, git을 건드리지 않고도 관리형 재정의가 번들 Skills보다 우선합니다. Skill을 전역으로 설치하되 일부 에이전트에만 보이게 하려면 공유 사본은 `~/.openclaw/skills`에 두고 `agents.defaults.skills` 및 `agents.list[].skills`로 가시성을 제어하세요. 업스트림에 적합한 수정만 저장소에 두고 PR로 보내세요.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 Skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 디렉터리를 넣을 수 있습니다(가장 낮은 우선순위). 기본 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치되며, OpenClaw는 이를 다음 세션에서 `<workspace>/skills`로 취급합니다. 해당 Skill을 특정 에이전트에만 보이게 하려면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하세요.
  </Accordion>

  <Accordion title="작업마다 다른 모델을 사용하는 방법은?">
    현재 지원되는 패턴은 다음과 같습니다.

    - **Cron 작업**: 격리된 작업이 작업별로 `model` 재정의를 설정할 수 있습니다.
    - **Sub-agent**: 다른 기본 모델을 가진 별도 에이전트로 작업을 라우팅합니다.
    - **온디맨드 전환**: `/model`을 사용해 현재 세션 모델을 언제든 전환할 수 있습니다.

    [Cron jobs](/ko/automation/cron-jobs), [Multi-Agent Routing](/ko/concepts/multi-agent), [Slash commands](/ko/tools/slash-commands)를 참조하세요.

  </Accordion>

  <Accordion title="무거운 작업을 하면 봇이 멈춥니다. 어떻게 오프로딩하나요?">
    길거나 병렬인 작업에는 **sub-agent**를 사용하세요. Sub-agent는 자체 세션에서 실행되고,
    요약을 반환하며, 메인 채팅의 응답성을 유지합니다.

    봇에게 "spawn a sub-agent for this task"라고 요청하거나 `/subagents`를 사용하세요.
    채팅에서 `/status`를 사용하면 Gateway가 현재 무엇을 하고 있는지(그리고 바쁜지 여부)를 볼 수 있습니다.

    토큰 팁: 긴 작업과 sub-agent는 둘 다 토큰을 소비합니다. 비용이 걱정된다면
    `agents.defaults.subagents.model`을 통해 sub-agent에 더 저렴한 모델을 설정하세요.

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 thread-bound subagent 세션은 어떻게 동작하나요?">
    스레드 바인딩을 사용하세요. Discord 스레드를 subagent 또는 세션 대상에 바인딩할 수 있으므로, 해당 스레드에서의 후속 메시지가 계속 바인딩된 세션으로 유지됩니다.

    기본 흐름:

    - `sessions_spawn`을 `thread: true`와 함께 사용해 생성합니다(지속적인 후속 처리를 원하면 `mode: "session"`도 선택 가능).
    - 또는 `/focus <target>`으로 수동 바인딩합니다.
    - `/agents`로 바인딩 상태를 확인합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`를 사용해 자동 unfocus를 제어합니다.
    - `/unfocus`로 스레드를 분리합니다.

    필요한 설정:

    - 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Discord 재정의: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - 생성 시 자동 바인드: `channels.discord.threadBindings.spawnSubagentSessions: true` 설정

    문서: [Sub-agents](/ko/tools/subagents), [Discord](/ko/channels/discord), [Configuration Reference](/ko/gateway/configuration-reference), [Slash commands](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent가 끝났는데 완료 업데이트가 잘못된 곳으로 갔거나 아예 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    먼저 확인된 요청자 경로를 확인하세요.

    - 완료 모드 subagent 전달은 가능하면 바인딩된 스레드 또는 대화 경로를 우선 사용합니다.
    - 완료 origin이 채널 정보만 가지고 있다면 OpenClaw는 요청자 세션의 저장된 경로(`lastChannel` / `lastTo` / `lastAccountId`)로 대체하여 direct 전달이 여전히 성공할 수 있게 합니다.
    - 바인딩된 경로도 없고 사용 가능한 저장 경로도 없으면 direct 전달이 실패할 수 있고, 결과는 채팅에 즉시 게시되지 않고 대기 중인 세션 전달로 대체됩니다.
    - 잘못되었거나 오래된 대상은 여전히 대기열 대체 또는 최종 전달 실패를 유발할 수 있습니다.
    - 자식의 마지막으로 보이는 assistant 응답이 정확히 조용한 토큰 `NO_REPLY` / `no_reply`이거나 정확히 `ANNOUNCE_SKIP`이면, OpenClaw는 오래된 이전 진행 상황을 게시하는 대신 의도적으로 announce를 억제합니다.
    - 자식이 도구 호출만 남긴 채 시간 초과되면 announce는 원시 도구 출력을 다시 재생하는 대신 이를 짧은 부분 진행 요약으로 압축할 수 있습니다.

    디버그:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks), [Session Tools](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron 또는 리마인더가 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 내부에서 실행됩니다. Gateway가 계속 실행 중이 아니면
    예약된 작업은 실행되지 않습니다.

    체크리스트:

    - cron이 활성화되어 있는지(`cron.enabled`) 그리고 `OPENCLAW_SKIP_CRON`이 설정되지 않았는지 확인하세요.
    - Gateway가 24/7 실행 중인지 확인하세요(절전/재시작 없음).
    - 작업의 시간대 설정을 확인하세요(`--tz` vs 호스트 시간대).

    디버그:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation).

  </Accordion>

  <Accordion title="Cron은 실행됐는데 채널로 아무것도 전송되지 않았습니다. 왜 그런가요?">
    먼저 전달 모드를 확인하세요.

    - `--no-deliver` / `delivery.mode: "none"`이면 runner 대체 전송은 예상되지 않습니다.
    - announce 대상(`channel` / `to`)이 없거나 잘못되었으면 runner가 아웃바운드 전달을 건너뜁니다.
    - 채널 인증 실패(`unauthorized`, `Forbidden`)는 runner가 전달을 시도했지만 자격 증명 때문에 차단되었다는 뜻입니다.
    - 조용한 isolated 결과(`NO_REPLY` / `no_reply`만 존재)는 의도적으로 전달 불가로 처리되므로 runner도 대기열 대체 전달을 억제합니다.

    isolated Cron 작업의 경우, 채팅 경로를 사용할 수 있으면 에이전트가 여전히 `message`
    도구로 직접 전송할 수 있습니다. `--announce`는 에이전트가 이미 전송하지 않은 최종 텍스트에 대한
    runner 대체 경로만 제어합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="왜 isolated Cron 실행이 모델을 바꾸거나 한 번 재시도했나요?">
    보통 이는 중복 스케줄링이 아니라 라이브 모델 전환 경로입니다.

    isolated Cron은 런타임 모델 핸드오프를 유지하고, 활성
    실행이 `LiveSessionModelSwitchError`를 던질 때 재시도할 수 있습니다. 재시도는 전환된
    provider/model을 유지하며, 전환에 새 인증 프로필 재정의가 포함되어 있었다면 Cron은
    재시도 전에 그것도 유지합니다.

    관련 선택 규칙:

    - 적용 가능한 경우 Gmail hook 모델 재정의가 가장 먼저 우선합니다.
    - 그다음 작업별 `model`.
    - 그다음 저장된 cron-session 모델 재정의.
    - 그다음 일반 에이전트/기본 모델 선택.

    재시도 루프는 제한되어 있습니다. 초기 시도 후 전환 재시도 2회를 넘으면
    Cron은 무한 반복하는 대신 중단합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [cron CLI](/ko/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 Skills를 어떻게 설치하나요?">
    네이티브 `openclaw skills` 명령을 사용하거나 Skills를 워크스페이스에 넣으세요. macOS Skills UI는 Linux에서 사용할 수 없습니다.
    Skills 찾아보기: [https://clawhub.ai](https://clawhub.ai)

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

    네이티브 `openclaw skills install`은 활성 워크스페이스 `skills/`
    디렉터리에 기록합니다. 자신의 Skills를 게시하거나
    동기화하려는 경우에만 별도 `clawhub` CLI를 설치하세요. 에이전트 간 공유 설치를 원하면 Skill을
    `~/.openclaw/skills` 아래에 두고, 어떤 에이전트가 볼 수 있는지 제한하려면
    `agents.defaults.skills` 또는
    `agents.list[].skills`를 사용하세요.

  </Accordion>

  <Accordion title="OpenClaw가 예약된 작업이나 백그라운드 연속 작업을 실행할 수 있나요?">
    예. Gateway 스케줄러를 사용하세요.

    - **Cron 작업**: 예약되었거나 반복되는 작업용(재시작 후에도 유지됨)
    - **Heartbeat**: "메인 세션" 주기 점검용
    - **Isolated 작업**: 요약을 게시하거나 채팅으로 전달하는 자율 에이전트용

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation),
    [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 Skills를 실행할 수 있나요?">
    직접적으로는 불가능합니다. macOS Skills는 `metadata.openclaw.os`와 필요한 바이너리로 제어되며, Skills는 **Gateway 호스트**에서 적격할 때만 시스템 프롬프트에 나타납니다. Linux에서는 `darwin` 전용 Skills(`apple-notes`, `apple-reminders`, `things-mac` 등)는 게이팅을 재정의하지 않는 한 로드되지 않습니다.

    지원되는 패턴은 세 가지입니다.

    **옵션 A - Gateway를 Mac에서 실행(가장 간단).**
    macOS 바이너리가 있는 곳에서 Gateway를 실행한 뒤 [원격 모드](#gateway-ports-already-running-and-remote-mode) 또는 Tailscale을 통해 Linux에서 연결하세요. Gateway 호스트가 macOS이므로 Skills가 정상적으로 로드됩니다.

    **옵션 B - macOS Node 사용(SSH 없음).**
    Linux에서 Gateway를 실행하고 macOS Node(메뉴 막대 앱)를 페어링한 뒤, Mac에서 **Node Run Commands**를 "Always Ask" 또는 "Always Allow"로 설정하세요. 필요한 바이너리가 Node에 있으면 OpenClaw는 macOS 전용 Skills를 적격으로 취급할 수 있습니다. 에이전트는 `nodes` 도구를 통해 해당 Skills를 실행합니다. "Always Ask"를 선택한 경우 프롬프트에서 "Always Allow"를 승인하면 해당 명령이 허용 목록에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급).**
    Gateway는 Linux에 두되 필요한 CLI 바이너리가 Mac에서 실행되는 SSH 래퍼로 확인되게 만드세요. 그런 다음 Skill이 적격 상태를 유지하도록 Linux를 허용하도록 재정의합니다.

    1. 바이너리용 SSH 래퍼를 만듭니다(예: Apple Notes용 `memo`).

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 래퍼를 Linux 호스트의 `PATH`에 둡니다(예: `~/bin/memo`).
    3. Linux를 허용하도록 Skill 메타데이터를 재정의합니다(워크스페이스 또는 `~/.openclaw/skills`).

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills 스냅샷이 새로고침되도록 새 세션을 시작하세요.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 통합이 있나요?">
    현재는 내장되어 있지 않습니다.

    옵션:

    - **사용자 정의 Skill / Plugin:** 안정적인 API 접근에 가장 적합함(Notion/HeyGen 모두 API 제공)
    - **브라우저 자동화:** 코드 없이도 동작하지만 더 느리고 더 취약함

    고객별 컨텍스트를 유지하고 싶다면(에이전시 워크플로), 간단한 패턴은 다음과 같습니다.

    - 고객별 Notion 페이지 하나(컨텍스트 + 선호도 + 진행 중 작업)
    - 세션 시작 시 에이전트에게 해당 페이지를 가져오라고 요청

    네이티브 통합을 원한다면 기능 요청을 열거나
    해당 API를 대상으로 하는 Skill을 직접 만드세요.

    Skills 설치:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    네이티브 설치는 활성 워크스페이스 `skills/` 디렉터리에 들어갑니다. 에이전트 간 공유 Skills의 경우 `~/.openclaw/skills/<name>/SKILL.md`에 두세요. 일부 에이전트만 공유 설치를 보게 하려면 `agents.defaults.skills` 또는 `agents.list[].skills`를 구성하세요. 일부 Skills는 Homebrew로 설치된 바이너리를 기대하며, Linux에서는 Linuxbrew를 의미합니다(위 Homebrew Linux FAQ 항목 참조). [Skills](/ko/tools/skills), [Skills config](/ko/tools/skills-config), [ClawHub](/ko/tools/clawhub)를 참조하세요.

  </Accordion>

  <Accordion title="기존에 로그인된 Chrome을 OpenClaw에서 사용하려면 어떻게 하나요?">
    Chrome DevTools MCP를 통해 연결되는 내장 `user` 브라우저 프로필을 사용하세요.

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 원하면 명시적 MCP 프로필을 만드세요.

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    이 경로는 로컬 호스트 브라우저 또는 연결된 브라우저 Node를 사용할 수 있습니다. Gateway가 다른 곳에서 실행 중이라면 브라우저 머신에서 Node 호스트를 실행하거나 원격 CDP를 대신 사용하세요.

    현재 `existing-session` / `user`의 제한 사항:

    - 작업은 CSS selector 기반이 아니라 ref 기반입니다
    - 업로드는 `ref` / `inputRef`가 필요하며 현재 한 번에 파일 하나만 지원합니다
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업은 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

  </Accordion>
</AccordionGroup>

## 샌드박싱 및 메모리

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예. [Sandboxing](/ko/gateway/sandboxing)을 참조하세요. Docker 전용 설정(전체 gateway를 Docker에서 실행하거나 샌드박스 이미지를 사용하는 경우)은 [Docker](/ko/install/docker)를 참조하세요.
  </Accordion>

  <Accordion title="Docker가 제한적으로 느껴집니다. 전체 기능을 활성화하려면 어떻게 하나요?">
    기본 이미지는 보안 우선이며 `node` 사용자로 실행되므로
    시스템 패키지, Homebrew, 번들 브라우저가 포함되지 않습니다. 더 완전한 구성을 원한다면:

    - 캐시가 유지되도록 `/home/node`를 `OPENCLAW_HOME_VOLUME`으로 영속화하세요.
    - `OPENCLAW_DOCKER_APT_PACKAGES`로 시스템 의존성을 이미지에 구워 넣으세요.
    - 번들된 CLI를 통해 Playwright 브라우저를 설치하세요:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 해당 경로가 영속화되도록 하세요.

    문서: [Docker](/ko/install/docker), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="DM은 개인용으로 유지하고 그룹은 공개/샌드박스 처리된 상태로 한 에이전트에서 사용할 수 있나요?">
    예. 비공개 트래픽이 **DM**이고 공개 트래픽이 **그룹**이라면 가능합니다.

    `agents.defaults.sandbox.mode: "non-main"`을 사용하면 그룹/채널 세션(non-main 키)이 구성된 샌드박스 백엔드에서 실행되고, 메인 DM 세션은 호스트에 남습니다. 별도로 선택하지 않으면 기본 백엔드는 Docker입니다. 그런 다음 `tools.sandbox.tools`를 통해 샌드박스 세션에서 사용할 수 있는 도구를 제한하세요.

    설정 안내 + 예시 구성: [Groups: personal DMs + public groups](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent)

    주요 설정 참조: [Gateway configuration](/ko/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 바인드하려면 어떻게 하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:path:mode"]` 형식으로 설정하세요(예: `"/home/user/src:/src:ro"`). 전역 + 에이전트별 bind는 병합되며, `scope: "shared"`일 때는 에이전트별 bind가 무시됩니다. 민감한 항목에는 `:ro`를 사용하고 bind가 샌드박스 파일시스템 벽을 우회한다는 점을 기억하세요.

    OpenClaw는 bind 소스를 정규화된 경로와 가장 깊은 기존 상위를 통해 확인된 정규 경로 모두에 대해 검증합니다. 즉 마지막 경로 세그먼트가 아직 존재하지 않더라도 symlink 상위 탈출은 여전히 안전하게 차단되고, symlink 확인 후에도 허용 루트 검사가 계속 적용됩니다.

    예시와 안전 참고는 [Sandboxing](/ko/gateway/sandboxing#custom-bind-mounts) 및 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)를 참조하세요.

  </Accordion>

  <Accordion title="메모리는 어떻게 동작하나요?">
    OpenClaw 메모리는 에이전트 워크스페이스의 Markdown 파일일 뿐입니다.

    - `memory/YYYY-MM-DD.md`의 일일 메모
    - `MEMORY.md`의 선별된 장기 메모(메인/비공개 세션 전용)

    OpenClaw는 또한 **조용한 pre-compaction memory flush**를 실행해 모델이
    자동 Compaction 전에 내구성 있는 메모를 기록하도록 상기시킵니다. 이는 워크스페이스가
    쓰기 가능한 경우에만 실행됩니다(읽기 전용 샌드박스는 건너뜀). [Memory](/ko/concepts/memory)를 참조하세요.

  </Accordion>

  <Accordion title="메모리가 자꾸 잊어버립니다. 어떻게 해야 오래 남나요?">
    봇에게 **그 사실을 메모리에 기록하라**고 요청하세요. 장기 메모는 `MEMORY.md`,
    단기 컨텍스트는 `memory/YYYY-MM-DD.md`에 들어가야 합니다.

    이는 아직 개선 중인 영역입니다. 모델에게 메모리를 저장하라고 상기시키는 것이 도움이 되며,
    모델은 무엇을 해야 할지 알고 있습니다. 계속 잊어버린다면 Gateway가 매 실행에서
    같은 워크스페이스를 사용하고 있는지 확인하세요.

    문서: [Memory](/ko/concepts/memory), [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="메모리는 영원히 유지되나요? 한계는 무엇인가요?">
    메모리 파일은 디스크에 존재하며 삭제할 때까지 유지됩니다. 한계는 모델이 아니라
    저장 공간입니다. 하지만 **세션 컨텍스트**는 여전히 모델의
    컨텍스트 창에 의해 제한되므로, 긴 대화는 Compaction되거나 잘릴 수 있습니다. 그래서
    메모리 검색이 존재합니다. 관련 부분만 다시 컨텍스트로 가져옵니다.

    문서: [Memory](/ko/concepts/memory), [Context](/ko/concepts/context).

  </Accordion>

  <Accordion title="의미 기반 메모리 검색에는 OpenAI API 키가 필요한가요?">
    **OpenAI 임베딩**을 사용할 때만 필요합니다. Codex OAuth는 채팅/completions만 다루며
    임베딩 접근 권한은 부여하지 않으므로, **Codex로 로그인하는 것(OAuth 또는
    Codex CLI 로그인)** 은 의미 기반 메모리 검색에 도움이 되지 않습니다. OpenAI 임베딩은
    여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    provider를 명시적으로 설정하지 않으면 OpenClaw는 API 키를
    확인할 수 있을 때 provider를 자동 선택합니다(인증 프로필, `models.providers.*.apiKey`, 또는 환경 변수).
    OpenAI 키를 확인할 수 있으면 OpenAI를 우선하고, 그렇지 않으면 Gemini 키를
    확인할 수 있으면 Gemini, 그다음 Voyage, 그다음 Mistral 순입니다. 원격 키를 전혀 사용할 수 없으면
    메모리 검색은 설정할 때까지 비활성화된 상태로 남습니다. 로컬 모델 경로가
    구성되어 있고 실제로 존재하면 OpenClaw는
    `local`을 우선합니다. `memorySearch.provider = "ollama"`를 명시적으로 설정한 경우 Ollama도 지원합니다.

    로컬에만 머무르고 싶다면 `memorySearch.provider = "local"`을 설정하고(선택적으로
    `memorySearch.fallback = "none"`도 가능), Gemini 임베딩을 원한다면
    `memorySearch.provider = "gemini"`로 설정하고 `GEMINI_API_KEY`(또는
    `memorySearch.remote.apiKey`)를 제공하세요. OpenClaw는 **OpenAI, Gemini, Voyage, Mistral, Ollama, local** 임베딩
    모델을 지원합니다. 설정 세부 사항은 [Memory](/ko/concepts/memory)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 디스크에 저장되는 위치

<AccordionGroup>
  <Accordion title="OpenClaw와 함께 사용하는 모든 데이터가 로컬에 저장되나요?">
    아니요. **OpenClaw의 상태는 로컬**이지만, **외부 서비스는 여전히 사용자가 보내는 내용을 보게 됩니다**.

    - **기본적으로 로컬:** 세션, 메모리 파일, 설정, 워크스페이스는 Gateway 호스트에 존재합니다
      (`~/.openclaw` + 워크스페이스 디렉터리).
    - **필연적으로 원격:** 모델 provider(Anthropic/OpenAI 등)에 보내는 메시지는
      그들의 API로 가며, 채팅 플랫폼(WhatsApp/Telegram/Slack 등)은 메시지 데이터를 자체
      서버에 저장합니다.
    - **범위는 사용자가 제어:** 로컬 모델을 사용하면 프롬프트는 기기에만 남지만, 채널
      트래픽은 여전히 해당 채널의 서버를 거칩니다.

    관련 항목: [Agent workspace](/ko/concepts/agent-workspace), [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장하나요?">
    모든 것은 `$OPENCLAW_STATE_DIR` 아래에 저장됩니다(기본값: `~/.openclaw`).

    | 경로 | 용도 |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json` | 메인 설정(JSON5) |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json` | 레거시 OAuth 가져오기(처음 사용할 때 auth profile로 복사됨) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 인증 프로필(OAuth, API 키, 선택적 `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json` | `file` SecretRef provider용 선택적 파일 기반 비밀 payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json` | 레거시 호환 파일(정적 `api_key` 항목은 제거됨) |
    | `$OPENCLAW_STATE_DIR/credentials/` | Provider 상태(예: `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/` | 에이전트별 상태(agentDir + sessions) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` | 대화 기록 및 상태(에이전트별) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json` | 세션 메타데이터(에이전트별) |

    레거시 단일 에이전트 경로: `~/.openclaw/agent/*` (`openclaw doctor`가 마이그레이션).

    **워크스페이스**(AGENTS.md, 메모리 파일, Skills 등)는 별도이며 `agents.defaults.workspace`로 구성합니다(기본값: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 두어야 하나요?">
    이 파일들은 `~/.openclaw`가 아니라 **에이전트 워크스페이스**에 위치합니다.

    - **워크스페이스(에이전트별)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`
      소문자 루트 `memory.md`는 레거시 복구 입력 전용이며, `openclaw doctor --fix`는
      두 파일이 모두 있을 때 이를 `MEMORY.md`로 병합할 수 있습니다.
    - **상태 디렉터리(`~/.openclaw`)**: 설정, 채널/provider 상태, 인증 프로필, 세션, 로그,
      공유 Skills(`~/.openclaw/skills`)

    기본 워크스페이스는 `~/.openclaw/workspace`이며, 다음으로 구성할 수 있습니다.

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    봇이 재시작 후 “잊어버리는” 것처럼 보이면 Gateway가 매 실행에서 같은
    워크스페이스를 사용하고 있는지 확인하세요(그리고 원격 모드는 **gateway 호스트의**
    워크스페이스를 사용하지, 로컬 노트북의 워크스페이스를 사용하지 않는다는 점도 기억하세요).

    팁: 오래 유지할 동작이나 선호도를 원한다면 채팅 기록에 의존하지 말고 봇에게 **AGENTS.md 또는 MEMORY.md에 기록하라**고 요청하세요.

    [Agent workspace](/ko/concepts/agent-workspace) 및 [Memory](/ko/concepts/memory)를 참조하세요.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **에이전트 워크스페이스**를 **비공개** git 저장소에 넣고 사적인 곳에
    백업하세요(예: GitHub private). 이렇게 하면 메모리 + AGENTS/SOUL/USER
    파일이 함께 저장되고, 나중에 비서의 “마음”을 복원할 수 있습니다.

    `~/.openclaw` 아래의 어떤 것도 커밋하지 마세요(자격 증명, 세션, 토큰, 암호화된 비밀 payload 포함).
    완전한 복원이 필요하면 워크스페이스와 상태 디렉터리를
    별도로 백업하세요(위의 마이그레이션 질문 참조).

    문서: [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 하나요?">
    전용 가이드를 참조하세요: [Uninstall](/ko/install/uninstall).
  </Accordion>

  <Accordion title="에이전트가 워크스페이스 밖에서도 작업할 수 있나요?">
    예. 워크스페이스는 하드 샌드박스가 아니라 **기본 cwd**이자 메모리 기준점입니다.
    상대 경로는 워크스페이스 내부에서 확인되지만, 샌드박싱이 활성화되지 않은 경우 절대 경로는 다른
    호스트 위치에도 접근할 수 있습니다. 격리가 필요하면
    [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 에이전트별 샌드박스 설정을 사용하세요. 저장소를 기본 작업 디렉터리로
    쓰고 싶다면 해당 에이전트의 `workspace`를 저장소 루트로 지정하세요. OpenClaw 저장소는 단지 소스 코드일 뿐이므로,
    에이전트가 그 안에서 작업하도록 의도한 경우가 아니면 워크스페이스는 별도로 유지하세요.

    예시(저장소를 기본 cwd로):

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

  <Accordion title="원격 모드: 세션 저장소는 어디에 있나요?">
    세션 상태는 **gateway 호스트**가 소유합니다. 원격 모드라면 사용자가 신경 써야 하는 세션 저장소는 로컬 노트북이 아니라 원격 머신에 있습니다. [Session management](/ko/concepts/session)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 설정 기본 사항

<AccordionGroup>
  <Accordion title="설정 형식은 무엇이고 어디에 있나요?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`에 있는 선택적 **JSON5** 설정을 읽습니다(기본값: `~/.openclaw/openclaw.json`).

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    파일이 없으면 비교적 안전한 기본값(기본 워크스페이스 `~/.openclaw/workspace` 포함)을 사용합니다.

  </Accordion>

  <Accordion title='gateway.bind: "lan"(또는 "tailnet")을 설정했더니 아무것도 listening하지 않거나 UI에 unauthorized가 뜹니다'>
    non-loopback bind에는 **유효한 gateway 인증 경로가 필요**합니다. 실질적으로는 다음 중 하나입니다.

    - 공유 비밀 인증: token 또는 password
    - 올바르게 구성된 non-loopback 정체성 인식 reverse proxy 뒤의 `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password`는 그 자체로 로컬 gateway 인증을 활성화하지 않습니다.
    - 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체값으로 사용할 수 있습니다.
    - 비밀번호 인증의 경우 `gateway.auth.mode: "password"`와 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 함께 설정하세요.
    - `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인할 수 없으면, 확인은 안전하게 실패하며(no remote fallback masking) 원격 대체가 이를 가리지 않습니다.
    - 공유 비밀 Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`(앱/UI 설정에 저장됨)를 통해 인증합니다. Tailscale Serve나 `trusted-proxy` 같은 정체성 포함 모드는 대신 요청 헤더를 사용합니다. 공유 비밀을 URL에 넣지 마세요.
    - `gateway.auth.mode: "trusted-proxy"`에서는 같은 호스트의 loopback reverse proxy도 trusted-proxy 인증을 충족하지 **않습니다**. 신뢰 프록시는 구성된 non-loopback 소스여야 합니다.

  </Accordion>

  <Accordion title="왜 이제 localhost에서도 토큰이 필요한가요?">
    OpenClaw는 loopback을 포함해 기본적으로 gateway 인증을 강제합니다. 일반적인 기본 경로에서는 token 인증을 의미합니다. 즉, 명시적인 인증 경로가 구성되지 않으면 gateway 시작 시 token 모드로 확인되고 토큰이 자동 생성되어 `gateway.auth.token`에 저장되므로 **로컬 WS 클라이언트도 인증해야 합니다**. 이는 다른 로컬 프로세스가 Gateway를 호출하는 것을 차단합니다.

    다른 인증 경로를 원한다면 명시적으로 password 모드(또는 non-loopback 정체성 인식 reverse proxy의 경우 `trusted-proxy`)를 선택할 수 있습니다. **정말로** 개방된 loopback을 원한다면 설정에서 `gateway.auth.mode: "none"`을 명시적으로 설정하세요. doctor는 언제든 토큰을 생성해줄 수 있습니다: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="설정을 바꾼 뒤 재시작해야 하나요?">
    Gateway는 설정 파일을 감시하며 hot-reload를 지원합니다.

    - `gateway.reload.mode: "hybrid"` (기본값): 안전한 변경은 hot-apply, 중요한 변경은 재시작
    - `hot`, `restart`, `off`도 지원합니다

  </Accordion>

  <Accordion title="재미있는 CLI tagline을 끄려면 어떻게 하나요?">
    설정에서 `cli.banner.taglineMode`를 설정하세요.

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: tagline 텍스트를 숨기지만 배너 제목/버전 줄은 유지합니다.
    - `default`: 항상 `All your chats, one OpenClaw.`를 사용합니다.
    - `random`: 회전하는 재미있는/계절별 tagline(기본 동작)입니다.
    - 배너 자체를 완전히 숨기고 싶다면 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

  </Accordion>

  <Accordion title="웹 검색(및 web fetch)을 어떻게 활성화하나요?">
    `web_fetch`는 API 키 없이도 동작합니다. `web_search`는 선택한
    provider에 따라 달라집니다.

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily 같은 API 기반 provider는 일반적인 API 키 설정이 필요합니다.
    - Ollama Web Search는 키가 필요 없지만, 구성된 Ollama 호스트를 사용하며 `ollama signin`이 필요합니다.
    - DuckDuckGo는 키가 필요 없지만 비공식 HTML 기반 통합입니다.
    - SearXNG는 키가 필요 없고/self-hosted입니다. `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`을 구성하세요.

    **권장:** `openclaw configure --section web`을 실행해 provider를 선택하세요.
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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    이제 provider별 웹 검색 설정은 `plugins.entries.<plugin>.config.webSearch.*` 아래에 위치합니다.
    레거시 `tools.web.search.*` provider 경로는 호환성을 위해 일시적으로 계속 로드되지만, 새 설정에는 사용하지 않아야 합니다.
    Firecrawl web-fetch 대체 설정은 `plugins.entries.firecrawl.config.webFetch.*` 아래에 있습니다.

    참고:

    - 허용 목록을 사용하는 경우 `web_search`/`web_fetch`/`x_search` 또는 `group:web`를 추가하세요.
    - `web_fetch`는 기본적으로 활성화되어 있습니다(명시적으로 비활성화하지 않는 한).
    - `tools.web.fetch.provider`를 생략하면 OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 fetch 대체 provider를 자동 감지합니다. 현재 번들 provider는 Firecrawl입니다.
    - Daemon은 `~/.openclaw/.env`(또는 서비스 환경)의 환경 변수를 읽습니다.

    문서: [Web tools](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 제 설정을 지워버렸습니다. 어떻게 복구하고 어떻게 예방하나요?">
    `config.apply`는 **전체 설정을 교체**합니다. 부분 객체를 보내면 나머지는
    모두 제거됩니다.

    현재 OpenClaw는 많은 실수로 인한 덮어쓰기를 방지합니다.

    - OpenClaw 소유 설정 쓰기는 기록 전에 전체 변경 후 설정을 검증합니다.
    - 잘못되었거나 파괴적인 OpenClaw 소유 쓰기는 거부되고 `openclaw.json.rejected.*`로 저장됩니다.
    - 직접 편집으로 시작 또는 hot reload가 깨지면 Gateway는 마지막 정상 설정을 복원하고 거부된 파일을 `openclaw.json.clobbered.*`로 저장합니다.
    - 복구 후 메인 에이전트는 부팅 경고를 받아 동일한 잘못된 설정을 다시 쓰지 않게 됩니다.

    복구 방법:

    - `openclaw logs --follow`에서 `Config auto-restored from last-known-good`, `Config write rejected:`, 또는 `config reload restored last-known-good config`를 확인하세요.
    - 활성 설정 파일 옆의 가장 최신 `openclaw.json.clobbered.*` 또는 `openclaw.json.rejected.*`를 확인하세요.
    - 복원된 활성 설정이 잘 동작하면 그대로 유지하고, 의도한 키만 `openclaw config set` 또는 `config.patch`로 다시 복사하세요.
    - `openclaw config validate` 및 `openclaw doctor`를 실행하세요.
    - 마지막 정상 설정이나 거부된 payload가 없다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행한 뒤 채널/모델을 재구성하세요.
    - 예상치 못한 일이었다면 버그를 신고하고 마지막으로 알고 있는 설정 또는 백업을 포함하세요.
    - 로컬 코딩 에이전트는 종종 로그나 기록에서 작동하는 설정을 재구성할 수 있습니다.

    예방 방법:

    - 작은 변경에는 `openclaw config set`을 사용하세요.
    - 대화형 편집에는 `openclaw configure`를 사용하세요.
    - 정확한 경로나 필드 형태가 확실하지 않으면 먼저 `config.schema.lookup`을 사용하세요. 얕은 스키마 노드와 즉시 자식 요약을 반환해 단계적으로 탐색할 수 있습니다.
    - 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 설정 교체에만 사용하세요.
    - 에이전트 실행에서 소유자 전용 `gateway` 도구를 사용하더라도 `tools.exec.ask` / `tools.exec.security`에 대한 쓰기는 여전히 거부됩니다(같은 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*` 별칭 포함).

    문서: [Config](/ko/cli/config), [Configure](/ko/cli/configure), [Gateway troubleshooting](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 기기에서 특화된 워커와 함께 중앙 Gateway를 실행하려면 어떻게 하나요?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi) + **Nodes** + **에이전트**입니다.

    - **Gateway (중앙):** 채널(Signal/WhatsApp), 라우팅, 세션을 소유
    - **Nodes (기기):** Mac/iOS/Android가 주변 장치로 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 노출
    - **에이전트 (워커):** 특수 역할용 별도 브레인/워크스페이스(예: "Hetzner ops", "Personal data")
    - **Sub-agent:** 병렬 처리를 원할 때 메인 에이전트에서 백그라운드 작업 생성
    - **TUI:** Gateway에 연결하고 에이전트/세션 전환

    문서: [Nodes](/ko/nodes), [Remote access](/ko/gateway/remote), [Multi-Agent Routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [TUI](/ko/web/tui).

  </Accordion>

  <Accordion title="OpenClaw 브라우저를 headless로 실행할 수 있나요?">
    예. 설정 옵션입니다.

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

    기본값은 `false`(headful)입니다. headless는 일부 사이트에서 anti-bot 검사를 더 자주 유발할 수 있습니다. [Browser](/ko/tools/browser)를 참조하세요.

    Headless는 **동일한 Chromium 엔진**을 사용하며 대부분의 자동화(폼, 클릭, 스크래핑, 로그인)에 동작합니다. 주요 차이점:

    - 보이는 브라우저 창이 없음(시각 자료가 필요하면 스크린샷 사용)
    - 일부 사이트는 headless 모드의 자동화에 더 엄격함(CAPTCHA, anti-bot)
      예를 들어 X/Twitter는 headless 세션을 자주 차단합니다.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 사용하려면 어떻게 하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 다른 Chromium 기반 브라우저)로 설정하고 Gateway를 재시작하세요.
    전체 설정 예시는 [Browser](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 원격 Gateway 및 Nodes

<AccordionGroup>
  <Accordion title="Telegram, gateway, nodes 사이에서 명령은 어떻게 전파되나요?">
    Telegram 메시지는 **gateway**가 처리합니다. gateway가 에이전트를 실행한 뒤
    Node 도구가 필요할 때만 **Gateway WebSocket**을 통해 nodes를 호출합니다.

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes는 인바운드 provider 트래픽을 보지 못하며, node RPC 호출만 받습니다.

  </Accordion>

  <Accordion title="Gateway가 원격에서 호스팅될 때 에이전트가 제 컴퓨터에 접근하려면 어떻게 하나요?">
    짧은 답: **컴퓨터를 Node로 페어링**하세요. Gateway는 다른 곳에서 실행되지만
    Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(화면, 카메라, 시스템)를
    호출할 수 있습니다.

    일반적인 설정:

    1. 항상 켜져 있는 호스트(VPS/홈 서버)에서 Gateway를 실행합니다.
    2. Gateway 호스트와 컴퓨터를 같은 tailnet에 넣습니다.
    3. Gateway WS에 도달할 수 있는지 확인합니다(tailnet bind 또는 SSH 터널).
    4. 로컬에서 macOS 앱을 열고 **Remote over SSH** 모드(또는 direct tailnet)로 연결해
       Node로 등록되게 합니다.
    5. Gateway에서 Node를 승인합니다.

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요하지 않습니다. Nodes는 Gateway WebSocket을 통해 연결됩니다.

    보안 알림: macOS Node를 페어링하면 해당 머신에서 `system.run`이 가능해집니다.
    신뢰하는 기기만 페어링하고 [Security](/ko/gateway/security)를 검토하세요.

    문서: [Nodes](/ko/nodes), [Gateway protocol](/ko/gateway/protocol), [macOS remote mode](/ko/platforms/mac/remote), [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale은 연결되었는데 응답이 없습니다. 이제 어떻게 해야 하나요?">
    기본 사항부터 확인하세요.

    - Gateway 실행 중인지: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - 채널 health: `openclaw channels status`

    그런 다음 인증과 라우팅을 확인하세요.

    - Tailscale Serve를 사용하는 경우 `gateway.auth.allowTailscale`이 올바르게 설정되었는지 확인하세요.
    - SSH 터널을 통해 연결하는 경우 로컬 터널이 살아 있고 올바른 포트를 가리키는지 확인하세요.
    - 허용 목록(DM 또는 그룹)에 자신의 계정이 포함되어 있는지 확인하세요.

    문서: [Tailscale](/ko/gateway/tailscale), [Remote access](/ko/gateway/remote), [Channels](/ko/channels).

  </Accordion>

  <Accordion title="두 OpenClaw 인스턴스가 서로 대화할 수 있나요(local + VPS)?">
    예. 내장된 "bot-to-bot" 브리지는 없지만 몇 가지
    신뢰할 수 있는 방식으로 구성할 수 있습니다.

    **가장 간단한 방법:** 두 봇이 모두 접근할 수 있는 일반 채팅 채널(Telegram/Slack/WhatsApp)을 사용하세요.
    Bot A가 Bot B에게 메시지를 보내고, Bot B가 평소처럼 응답하게 하면 됩니다.

    **CLI 브리지(일반):** 다른 Gateway를 호출하는 스크립트를 실행해
    `openclaw agent --message ... --deliver`를 사용하고, 다른 봇이
    듣고 있는 채팅을 대상으로 지정하세요. 한 봇이 원격 VPS에 있다면
    SSH/Tailscale을 통해 해당 원격 Gateway를 CLI가 가리키게 하세요([Remote access](/ko/gateway/remote) 참조).

    예시 패턴(대상 Gateway에 접근할 수 있는 머신에서 실행):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    팁: 두 봇이 끝없이 루프 돌지 않도록 가드레일을 추가하세요(멘션 전용, 채널
    허용 목록, 또는 "봇 메시지에는 응답하지 않기" 규칙).

    문서: [Remote access](/ko/gateway/remote), [Agent CLI](/ko/cli/agent), [Agent send](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 에이전트에 대해 별도의 VPS가 필요한가요?">
    아니요. 하나의 Gateway가 여러 에이전트를 호스팅할 수 있으며, 각 에이전트는 자체 워크스페이스, 모델 기본값,
    라우팅을 가집니다. 이것이 일반적인 설정이며 에이전트마다 VPS를
    하나씩 실행하는 것보다 훨씬 저렴하고 단순합니다.

    하드 격리(보안 경계)나
    공유하고 싶지 않은 매우 다른 설정이 필요한 경우에만 별도 VPS를 사용하세요. 그렇지 않다면 하나의 Gateway를 유지하고
    여러 에이전트 또는 sub-agent를 사용하세요.

  </Accordion>

  <Accordion title="원격 Gateway에서 SSH 대신 개인 노트북에 Node를 두는 데 이점이 있나요?">
    예. Nodes는 원격 Gateway에서 노트북에 도달하는 일급 방식이며,
    셸 접근 이상의 기능을 제공합니다. Gateway는 macOS/Linux(Windows는 WSL2)에서 실행되고
    가볍기 때문에(작은 VPS나 Raspberry Pi급 장치면 충분, 4 GB RAM이면 충분함), 일반적인
    설정은 항상 켜져 있는 호스트 + Node로서의 노트북입니다.

    - **인바운드 SSH 불필요.** Nodes는 Gateway WebSocket으로 outbound 연결하고 기기 페어링을 사용합니다.
    - **더 안전한 실행 제어.** `system.run`은 해당 노트북의 Node 허용 목록/승인으로 제어됩니다.
    - **더 많은 기기 도구.** Nodes는 `system.run` 외에 `canvas`, `camera`, `screen`을 노출합니다.
    - **로컬 브라우저 자동화.** Gateway는 VPS에 두고, 노트북의 Node 호스트를 통해 로컬 Chrome을 실행하거나, Chrome MCP를 통해 호스트의 로컬 Chrome에 연결할 수 있습니다.

    SSH는 임시 셸 접근에는 괜찮지만, 지속적인 에이전트 워크플로와
    기기 자동화에는 Nodes가 더 단순합니다.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="Nodes가 gateway 서비스를 실행하나요?">
    아니요. 격리된 프로필을 의도적으로 실행하는 경우가 아니라면 호스트당 **하나의 gateway**만 실행해야 합니다([Multiple gateways](/ko/gateway/multiple-gateways) 참조). Nodes는 gateway에 연결되는 주변 장치입니다(iOS/Android Nodes, 또는 메뉴 막대 앱의 macOS "node mode"). 헤드리스 Node
    호스트와 CLI 제어는 [Node host CLI](/ko/cli/node)를 참조하세요.

    `gateway`, `discovery`, `canvasHost` 변경에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="설정을 적용할 수 있는 API / RPC 방식이 있나요?">
    예.

    - `config.schema.lookup`: 쓰기 전에 하나의 설정 하위 트리를 얕은 스키마 노드, 일치한 UI 힌트, 즉시 자식 요약과 함께 검사
    - `config.get`: 현재 스냅샷 + hash 가져오기
    - `config.patch`: 안전한 부분 업데이트(대부분의 RPC 편집에 권장), 가능하면 hot-reload하고 필요하면 재시작
    - `config.apply`: 전체 설정을 검증 후 교체, 가능하면 hot-reload하고 필요하면 재시작
    - 소유자 전용 `gateway` 런타임 도구는 여전히 `tools.exec.ask` / `tools.exec.security` 재작성은 거부합니다. 레거시 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다

  </Accordion>

  <Accordion title="첫 설치에 적당한 최소 설정">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    이 설정은 워크스페이스를 지정하고 누가 봇을 트리거할 수 있는지 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 하나요?">
    최소 단계:

    1. **VPS에 설치 + 로그인**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac에 설치 + 로그인**
       - Tailscale 앱을 사용하고 같은 tailnet에 로그인하세요.
    3. **MagicDNS 활성화(권장)**
       - Tailscale 관리자 콘솔에서 MagicDNS를 활성화하면 VPS에 안정적인 이름이 생깁니다.
    4. **tailnet 호스트 이름 사용**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH 없이 Control UI를 원하면 VPS에서 Tailscale Serve를 사용하세요.

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 gateway는 loopback에 바인딩된 상태를 유지하면서 Tailscale을 통해 HTTPS를 노출합니다. [Tailscale](/ko/gateway/tailscale)을 참조하세요.

  </Accordion>

  <Accordion title="원격 Gateway(Tailscale Serve)에 Mac Node를 연결하려면 어떻게 하나요?">
    Serve는 **Gateway Control UI + WS**를 노출합니다. Nodes는 같은 Gateway WS 엔드포인트를 통해 연결합니다.

    권장 설정:

    1. **VPS와 Mac이 같은 tailnet에 있는지 확인하세요.**
    2. **macOS 앱을 원격 모드로 사용하세요**(SSH 대상은 tailnet 호스트 이름이어도 됨).
       앱이 Gateway 포트를 터널링하고 Node로 연결합니다.
    3. **gateway에서 Node를 승인하세요.**

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway protocol](/ko/gateway/protocol), [Discovery](/ko/gateway/discovery), [macOS remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 Node만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구**(화면/카메라/exec)만 필요하다면
    **Node**로 추가하세요. 이렇게 하면 하나의 Gateway만 유지하고 설정 중복을 피할 수 있습니다. 로컬 Node 도구는
    현재 macOS 전용이지만, 다른 OS로도 확장할 계획입니다.

    하드 격리 또는 완전히 분리된 두 봇이 필요한 경우에만 두 번째 Gateway를 설치하세요.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes), [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## 환경 변수 및 .env 로딩

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 부모 프로세스(셸, launchd/systemd, CI 등)의 환경 변수를 읽고, 추가로 다음도 로드합니다.

    - 현재 작업 디렉터리의 `.env`
    - `~/.openclaw/.env`(즉 `$OPENCLAW_STATE_DIR/.env`)에 있는 전역 대체 `.env`

    어느 `.env` 파일도 기존 환경 변수를 덮어쓰지 않습니다.

    설정에 인라인 환경 변수도 정의할 수 있습니다(프로세스 환경에 없을 때만 적용).

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 소스는 [/environment](/ko/help/environment)를 참조하세요.

  </Accordion>

  <Accordion title="서비스로 Gateway를 시작했더니 환경 변수가 사라졌습니다. 어떻게 해야 하나요?">
    일반적인 해결 방법 두 가지:

    1. 누락된 키를 `~/.openclaw/.env`에 넣어 서비스가 셸 환경을 상속하지 않더라도 읽히게 하세요.
    2. 셸 import를 활성화하세요(선택적 편의 기능).

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

    이는 로그인 셸을 실행하고 예상되는 누락된 키만 가져옵니다(절대 덮어쓰지 않음). 환경 변수 버전:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN을 설정했는데 models status에 "Shell env: off."라고 표시됩니다. 왜 그런가요?'>
    `openclaw models status`는 **셸 환경 import**가 활성화되어 있는지를 보고합니다. "Shell env: off"는
    환경 변수가 없다는 뜻이 아니라, OpenClaw가
    로그인 셸을 자동으로 로드하지 않는다는 뜻입니다.

    Gateway가 서비스(launchd/systemd)로 실행되면 셸
    환경을 상속하지 않습니다. 다음 중 하나로 해결하세요.

    1. 토큰을 `~/.openclaw/.env`에 넣으세요.

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 또는 셸 import를 활성화하세요(`env.shellEnv.enabled: true`).
    3. 또는 설정의 `env` 블록에 추가하세요(없을 때만 적용됨).

    그다음 gateway를 재시작하고 다시 확인하세요.

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `COPILOT_GITHUB_TOKEN`(또는 `GH_TOKEN` / `GITHUB_TOKEN`)에서 읽습니다.
    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 세션 및 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 하나요?">
    `/new` 또는 `/reset`을 독립된 메시지로 보내세요. [Session management](/ko/concepts/session)를 참조하세요.
  </Accordion>

  <Accordion title="/new를 한 번도 보내지 않으면 세션이 자동으로 초기화되나요?">
    세션은 `session.idleMinutes` 이후 만료될 수 있지만, 이는 **기본적으로 비활성화**되어 있습니다(기본값 **0**).
    유휴 만료를 활성화하려면 양수 값을 설정하세요. 활성화되면 유휴 기간이 지난 뒤의 **다음**
    메시지에서 해당 채팅 키에 대한 새 세션 id가 시작됩니다.
    대화록을 삭제하는 것은 아니며, 단지 새 세션을 시작할 뿐입니다.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="여러 OpenClaw 인스턴스로 팀(CEO 하나와 여러 에이전트)을 만들 수 있나요?">
    예. **다중 에이전트 라우팅**과 **sub-agent**를 통해 가능합니다. 하나의 조정
    에이전트와 각자 워크스페이스와 모델을 가진 여러 워커 에이전트를 만들 수 있습니다.

    다만 이는 **재미있는 실험**으로 보는 것이 좋습니다. 토큰을 많이 소모하고
    종종 하나의 봇을 별도 세션으로 사용하는 것보다 비효율적입니다. 우리가
    일반적으로 상정하는 모델은, 하나의 봇과 대화하되 병렬 작업을 위해 다른 세션을 사용하는 방식입니다. 이
    봇은 필요할 때 sub-agent를 생성할 수도 있습니다.

    문서: [Multi-agent routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [Agents CLI](/ko/cli/agents).

  </Accordion>

  <Accordion title="작업 중간에 컨텍스트가 잘린 이유는 무엇인가요? 어떻게 방지하나요?">
    세션 컨텍스트는 모델 창 크기에 의해 제한됩니다. 긴 채팅, 큰 도구 출력, 많은
    파일은 Compaction 또는 잘림을 유발할 수 있습니다.

    도움이 되는 방법:

    - 봇에게 현재 상태를 요약하고 파일에 기록하라고 요청하세요.
    - 긴 작업 전에는 `/compact`를 사용하고, 주제를 바꿀 때는 `/new`를 사용하세요.
    - 중요한 컨텍스트는 워크스페이스에 두고 다시 읽어오라고 하세요.
    - 메인 채팅을 작게 유지하려면 긴 작업이나 병렬 작업에는 sub-agent를 사용하세요.
    - 이런 일이 자주 발생한다면 더 큰 컨텍스트 창을 가진 모델을 선택하세요.

  </Accordion>

  <Accordion title="OpenClaw를 완전히 초기화하되 설치는 유지하려면 어떻게 하나요?">
    reset 명령을 사용하세요.

    ```bash
    openclaw reset
    ```

    비대화형 전체 초기화:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그다음 다시 설정을 실행하세요.

    ```bash
    openclaw onboard --install-daemon
    ```

    참고:

    - 기존 설정이 있으면 온보딩도 **Reset**을 제안합니다. [Onboarding (CLI)](/ko/start/wizard)를 참조하세요.
    - 프로필(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리를 초기화하세요(기본값은 `~/.openclaw-<profile>`).
    - 개발 초기화: `openclaw gateway --dev --reset` (개발 전용, 개발 설정 + 자격 증명 + 세션 + 워크스페이스를 모두 지움).

  </Accordion>

  <Accordion title='"context too large" 오류가 발생합니다. 어떻게 초기화하거나 Compaction하나요?'>
    다음 중 하나를 사용하세요.

    - **Compaction** (대화는 유지하되 오래된 턴을 요약):

      ```
      /compact
      ```

      또는 요약을 안내하려면 `/compact <instructions>`.

    - **초기화** (같은 채팅 키에 대해 새 세션 ID 생성):

      ```
      /new
      /reset
      ```

    계속 발생한다면:

    - 오래된 도구 출력을 잘라내기 위해 **세션 정리**(`agents.defaults.contextPruning`)를 활성화하거나 조정하세요.
    - 더 큰 컨텍스트 창을 가진 모델을 사용하세요.

    문서: [Compaction](/ko/concepts/compaction), [Session pruning](/ko/concepts/session-pruning), [Session management](/ko/concepts/session).

  </Accordion>

  <Accordion title='왜 "LLM request rejected: messages.content.tool_use.input field required"가 보이나요?'>
    이는 provider 검증 오류입니다. 모델이 필수
    `input` 없이 `tool_use` 블록을 출력했다는 뜻입니다. 보통 세션 기록이 오래되었거나 손상되었음을 의미합니다(긴 스레드
    또는 도구/스키마 변경 후 자주 발생).

    해결 방법: `/new`(독립된 메시지)로 새 세션을 시작하세요.

  </Accordion>

  <Accordion title="왜 30분마다 Heartbeat 메시지가 오나요?">
    Heartbeat는 기본적으로 **30분마다** 실행됩니다(**OAuth 인증 사용 시 1시간마다**). 조정하거나 비활성화하려면:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`가 있지만 사실상 비어 있다면(빈 줄과 `# Heading` 같은 markdown
    헤더만 있는 경우), OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다.
    파일이 없으면 Heartbeat는 여전히 실행되며 모델이 무엇을 할지 결정합니다.

    에이전트별 재정의는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 "봇 계정"을 추가해야 하나요?'>
    아니요. OpenClaw는 **사용자 자신의 계정**에서 실행되므로 사용자가 그룹에 속해 있으면 OpenClaw도 그룹을 볼 수 있습니다.
    기본적으로 그룹 응답은 발신자를 허용할 때까지 차단됩니다(`groupPolicy: "allowlist"`).

    그룹 응답을 **사용자 자신만** 트리거할 수 있게 하려면:

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
    옵션 1(가장 빠름): 로그를 tail하면서 그룹에 테스트 메시지를 보내세요.

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으세요. 예:
    `1234567890-1234567890@g.us`.

    옵션 2(이미 구성/허용 목록에 있는 경우): 설정에서 그룹을 나열합니다.

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Directory](/ko/cli/directory), [Logs](/ko/cli/logs).

  </Accordion>

  <Accordion title="왜 OpenClaw가 그룹에서 응답하지 않나요?">
    흔한 원인은 두 가지입니다.

    - 멘션 게이팅이 켜져 있습니다(기본값). 봇을 @멘션해야 합니다(또는 `mentionPatterns`와 일치해야 함).
    - `channels.whatsapp.groups`를 `"*"` 없이 구성했고 해당 그룹이 허용 목록에 없습니다.

    [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참조하세요.

  </Accordion>

  <Accordion title="그룹/스레드는 DM과 컨텍스트를 공유하나요?">
    direct 채팅은 기본적으로 메인 세션으로 합쳐집니다. 그룹/채널은 자체 세션 키를 가지며, Telegram 토픽 / Discord 스레드도 별도 세션입니다. [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참조하세요.
  </Accordion>

  <Accordion title="워크스페이스와 에이전트를 몇 개까지 만들 수 있나요?">
    하드 제한은 없습니다. 수십 개(심지어 수백 개)도 괜찮지만, 다음을 주의하세요.

    - **디스크 증가:** 세션 + 대화록은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 존재합니다.
    - **토큰 비용:** 에이전트가 많을수록 동시 모델 사용량이 증가합니다.
    - **운영 오버헤드:** 에이전트별 인증 프로필, 워크스페이스, 채널 라우팅이 필요합니다.

    팁:

    - 에이전트당 하나의 **활성** 워크스페이스만 유지하세요(`agents.defaults.workspace`).
    - 디스크가 커지면 오래된 세션을 정리하세요(JSONL 또는 저장소 항목 삭제).
    - `openclaw doctor`를 사용해 떠돌이 워크스페이스와 프로필 불일치를 찾으세요.

  </Accordion>

  <Accordion title="여러 봇 또는 채팅을 동시에 실행할 수 있나요(Slack)? 어떻게 설정해야 하나요?">
    예. **Multi-Agent Routing**을 사용해 여러 격리된 에이전트를 실행하고
    채널/계정/peer별로 인바운드 메시지를 라우팅하세요. Slack은 채널로 지원되며 특정 에이전트에 바인딩할 수 있습니다.

    브라우저 접근은 강력하지만 "사람이 할 수 있는 모든 것"을 의미하지는 않습니다. anti-bot, CAPTCHA, MFA는
    여전히 자동화를 차단할 수 있습니다. 가장 신뢰할 수 있는 브라우저 제어를 위해서는 호스트에서 로컬 Chrome MCP를 사용하거나,
    실제로 브라우저가 실행되는 머신에서 CDP를 사용하세요.

    모범 사례 설정:

    - 항상 켜져 있는 Gateway 호스트(VPS/Mac mini)
    - 역할별 에이전트 하나씩(바인딩)
    - 해당 에이전트에 바인딩된 Slack 채널
    - 필요 시 Chrome MCP 또는 Node를 통한 로컬 브라우저

    문서: [Multi-Agent Routing](/ko/concepts/multi-agent), [Slack](/ko/channels/slack),
    [Browser](/ko/tools/browser), [Nodes](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델, 장애 조치, 인증 프로필

모델 Q&A — 기본값, 선택, 별칭, 전환, 장애 조치, 인증 프로필 —
은 전용 페이지로 이동했습니다:
[FAQ — models and auth profiles](/ko/help/faq-models).

## Gateway: 포트, "already running", 원격 모드

<AccordionGroup>
  <Accordion title="Gateway는 어떤 포트를 사용하나요?">
    `gateway.port`는 WebSocket + HTTP(Control UI, hooks 등)용 단일 다중화 포트를 제어합니다.

    우선순위:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 기본값 18789
    ```

  </Accordion>

  <Accordion title='왜 openclaw gateway status에는 "Runtime: running"인데 "Connectivity probe: failed"라고 나오나요?'>
    "running"은 **supervisor**의 관점(launchd/systemd/schtasks)이기 때문입니다. connectivity probe는 CLI가 실제로 gateway WebSocket에 연결해 본 결과입니다.

    `openclaw gateway status`를 사용하고 다음 줄을 신뢰하세요.

    - `Probe target:` (probe가 실제로 사용한 URL)
    - `Listening:` (포트에 실제로 바인딩된 것)
    - `Last gateway error:` (프로세스는 살아 있지만 포트가 listening하지 않을 때 흔한 근본 원인)

  </Accordion>

  <Accordion title='왜 openclaw gateway status에는 "Config (cli)"와 "Config (service)"가 다르게 나오나요?'>
    현재 하나의 설정 파일을 편집하고 있는데 서비스는 다른 설정 파일을 사용 중입니다(보통 `--profile` / `OPENCLAW_STATE_DIR` 불일치).

    해결:

    ```bash
    openclaw gateway install --force
    ```

    서비스가 사용하길 원하는 동일한 `--profile` / 환경에서 이 명령을 실행하세요.

  </Accordion>

  <Accordion title='"another gateway instance is already listening"은 무슨 뜻인가요?'>
    OpenClaw는 시작 즉시 WebSocket listener를 바인딩하여 런타임 잠금을 강제합니다(기본값 `ws://127.0.0.1:18789`). `EADDRINUSE`로 바인딩에 실패하면 다른 인스턴스가 이미 listening 중임을 나타내는 `GatewayLockError`를 발생시킵니다.

    해결: 다른 인스턴스를 중지하거나, 포트를 비우거나, `openclaw gateway --port <port>`로 실행하세요.

  </Accordion>

  <Accordion title="원격 모드로 OpenClaw를 실행하려면 어떻게 하나요(클라이언트가 다른 곳의 Gateway에 연결)?">
    `gateway.mode: "remote"`로 설정하고 원격 WebSocket URL을 지정하세요. 선택적으로 공유 비밀 원격 자격 증명도 넣을 수 있습니다.

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    참고:

    - `openclaw gateway`는 `gateway.mode`가 `local`일 때만 시작됩니다(또는 재정의 플래그를 전달한 경우).
    - macOS 앱은 설정 파일을 감시하며 이 값이 바뀌면 모드를 실시간으로 전환합니다.
    - `gateway.remote.token` / `.password`는 클라이언트 측 원격 자격 증명일 뿐이며, 그 자체로 로컬 gateway 인증을 활성화하지는 않습니다.

  </Accordion>

  <Accordion title='Control UI에 "unauthorized"가 뜨거나 계속 재연결됩니다. 어떻게 하나요?'>
    gateway 인증 경로와 UI의 인증 방식이 일치하지 않습니다.

    사실(코드 기준):

    - Control UI는 현재 브라우저 탭 세션과 선택된 gateway URL에 대해 token을 `sessionStorage`에 유지하므로, 같은 탭에서 새로고침해도 오래 지속되는 localStorage token 복원 없이 계속 작동합니다.
    - `AUTH_TOKEN_MISMATCH`가 발생하면 신뢰된 클라이언트는 gateway가 재시도 힌트(`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)를 반환할 때 캐시된 기기 토큰으로 제한된 한 번의 재시도를 할 수 있습니다.
    - 해당 캐시 토큰 재시도는 이제 기기 토큰과 함께 저장된 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 여전히 캐시된 범위를 상속하지 않고 요청한 범위 집합을 유지합니다.
    - 이 재시도 경로 밖에서는 연결 인증 우선순위가 먼저 명시적 공유 token/password, 그다음 명시적 `deviceToken`, 그다음 저장된 기기 토큰, 마지막으로 bootstrap 토큰입니다.
    - Bootstrap 토큰 범위 검사는 역할 접두사 기반입니다. 내장 bootstrap operator 허용 목록은 operator 요청만 충족합니다. Node 또는 다른 non-operator 역할은 여전히 자신의 역할 접두사 아래 범위를 필요로 합니다.

    해결 방법:

    - 가장 빠른 방법: `openclaw dashboard` (dashboard URL을 출력 + 복사하고, 열기를 시도하며, headless면 SSH 힌트 표시)
    - 아직 토큰이 없다면: `openclaw doctor --generate-gateway-token`
    - 원격이라면 먼저 터널링: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기
    - 공유 비밀 모드: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 설정한 뒤, 같은 비밀을 Control UI 설정에 붙여넣기
    - Tailscale Serve 모드: `gateway.auth.allowTailscale`이 활성화되어 있는지 확인하고, Tailscale 정체성 헤더를 우회하는 원시 loopback/tailnet URL이 아니라 Serve URL을 열고 있는지 확인하세요.
    - trusted-proxy 모드: 같은 호스트 loopback proxy나 원시 gateway URL이 아니라, 구성된 non-loopback 정체성 인식 proxy를 통해 접근하고 있는지 확인하세요.
    - 한 번의 재시도 후에도 불일치가 계속되면 페어링된 기기 토큰을 교체/재승인하세요.
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 해당 rotate 호출이 거부되었다면 두 가지를 확인하세요.
      - 페어링된 기기 세션은 `operator.admin`도 가지고 있지 않은 한 **자기 자신의** 기기만 교체할 수 있습니다
      - 명시적 `--scope` 값은 호출자의 현재 operator 범위를 넘을 수 없습니다
    - 여전히 막히나요? `openclaw status --all`을 실행하고 [Troubleshooting](/ko/gateway/troubleshooting)을 따르세요. 인증 세부 사항은 [Dashboard](/ko/web/dashboard)를 참조하세요.

  </Accordion>

  <Accordion title="gateway.bind를 tailnet으로 설정했는데 바인딩되지 않고 아무것도 listening하지 않습니다">
    `tailnet` bind는 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 선택합니다. 머신이 Tailscale에 연결되어 있지 않거나(또는 인터페이스가 내려가 있으면) 바인딩할 대상이 없습니다.

    해결:

    - 해당 호스트에서 Tailscale을 시작하세요(100.x 주소를 갖도록), 또는
    - `gateway.bind: "loopback"` / `"lan"`으로 변경하세요.

    참고: `tailnet`은 명시적입니다. `auto`는 loopback을 선호하므로 tailnet 전용 bind를 원할 때는 `gateway.bind: "tailnet"`을 사용하세요.

  </Accordion>

  <Accordion title="같은 호스트에서 여러 Gateway를 실행할 수 있나요?">
    보통은 아닙니다. 하나의 Gateway로 여러 메시징 채널과 에이전트를 실행할 수 있습니다. 여러 Gateway는 중복성(예: rescue bot) 또는 하드 격리가 필요할 때만 사용하세요.

    가능은 하지만 다음을 격리해야 합니다.

    - `OPENCLAW_CONFIG_PATH` (인스턴스별 설정)
    - `OPENCLAW_STATE_DIR` (인스턴스별 상태)
    - `agents.defaults.workspace` (워크스페이스 격리)
    - `gateway.port` (고유 포트)

    빠른 설정(권장):

    - 인스턴스별로 `openclaw --profile <name> ...`를 사용하세요(자동으로 `~/.openclaw-<name>` 생성).
    - 각 프로필 설정에 고유한 `gateway.port`를 설정하세요(또는 수동 실행 시 `--port` 전달).
    - 프로필별 서비스를 설치하세요: `openclaw --profile <name> gateway install`.

    프로필은 서비스 이름에도 접미사를 붙입니다(`ai.openclaw.<profile>`; 레거시 `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    전체 가이드: [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008은 무슨 뜻인가요?'>
    Gateway는 **WebSocket 서버**이며, 첫 번째 메시지로 반드시
    `connect` 프레임이 와야 합니다. 다른 것이 오면 연결을
    **code 1008**(policy violation)로 종료합니다.

    흔한 원인:

    - **HTTP** URL(`http://...`)을 일반 브라우저에서 열었습니다.
    - 잘못된 포트나 경로를 사용했습니다.
    - proxy 또는 터널이 인증 헤더를 제거했거나 Gateway가 아닌 요청을 보냈습니다.

    빠른 해결 방법:

    1. WS URL을 사용하세요: `ws://<host>:18789`(또는 HTTPS면 `wss://...`)
    2. WS 포트를 일반 브라우저 탭에서 열지 마세요.
    3. 인증이 켜져 있다면 `connect` 프레임에 token/password를 포함하세요.

    CLI 또는 TUI를 사용하는 경우 URL은 다음과 같아야 합니다.

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    프로토콜 세부 사항: [Gateway protocol](/ko/gateway/protocol).

  </Accordion>
</AccordionGroup>

## 로깅 및 디버깅

<AccordionGroup>
  <Accordion title="로그는 어디에 있나요?">
    파일 로그(구조화됨):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file`로 고정 경로를 설정할 수 있습니다. 파일 로그 수준은 `logging.level`로 제어합니다. 콘솔 verbose 수준은 `--verbose`와 `logging.consoleLevel`로 제어합니다.

    가장 빠른 로그 tail:

    ```bash
    openclaw logs --follow
    ```

    서비스/supervisor 로그(gateway가 launchd/systemd로 실행되는 경우):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` 및 `gateway.err.log` (기본값: `~/.openclaw/logs/...`; 프로필은 `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    자세한 내용은 [Troubleshooting](/ko/gateway/troubleshooting)을 참조하세요.

  </Accordion>

  <Accordion title="Gateway 서비스를 시작/중지/재시작하려면 어떻게 하나요?">
    gateway helper를 사용하세요.

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway를 수동 실행 중이라면 `openclaw gateway --force`로 포트를 다시 가져올 수 있습니다. [Gateway](/ko/gateway)를 참조하세요.

  </Accordion>

  <Accordion title="Windows에서 터미널을 닫았습니다. OpenClaw를 어떻게 다시 시작하나요?">
    Windows 설치 모드는 **두 가지**가 있습니다.

    **1) WSL2 (권장):** Gateway가 Linux 내부에서 실행됩니다.

    PowerShell을 열고 WSL에 들어간 뒤 재시작하세요.

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    서비스를 설치하지 않았다면 전경에서 시작하세요.

    ```bash
    openclaw gateway run
    ```

    **2) 네이티브 Windows (권장하지 않음):** Gateway가 Windows에서 직접 실행됩니다.

    PowerShell을 열고 다음을 실행하세요.

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    수동 실행 중(서비스 없음)이라면 다음을 사용하세요.

    ```powershell
    openclaw gateway run
    ```

    문서: [Windows (WSL2)](/ko/platforms/windows), [Gateway service runbook](/ko/gateway).

  </Accordion>

  <Accordion title="Gateway는 올라와 있는데 응답이 오지 않습니다. 무엇을 확인해야 하나요?">
    먼저 빠른 health 점검부터 하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    흔한 원인:

    - **gateway 호스트**에 모델 인증이 로드되지 않음(`models status` 확인)
    - 채널 pairing/allowlist가 응답을 차단함(채널 설정 + 로그 확인)
    - WebChat/Dashboard가 잘못된 token으로 열려 있음

    원격이라면 터널/Tailscale 연결이 살아 있고
    Gateway WebSocket에 도달할 수 있는지 확인하세요.

    문서: [Channels](/ko/channels), [Troubleshooting](/ko/gateway/troubleshooting), [Remote access](/ko/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 이제 어떻게 하나요?'>
    이는 보통 UI가 WebSocket 연결을 잃었다는 뜻입니다. 다음을 확인하세요.

    1. Gateway가 실행 중인가요? `openclaw gateway status`
    2. Gateway가 정상인가요? `openclaw status`
    3. UI에 올바른 token이 있나요? `openclaw dashboard`
    4. 원격이라면 터널/Tailscale 연결이 살아 있나요?

    그런 다음 로그를 tail하세요.

    ```bash
    openclaw logs --follow
    ```

    문서: [Dashboard](/ko/web/dashboard), [Remote access](/ko/gateway/remote), [Troubleshooting](/ko/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands가 실패합니다. 무엇을 확인해야 하나요?">
    먼저 로그와 채널 상태부터 확인하세요.

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    그다음 오류 유형에 맞게 확인하세요.

    - `BOT_COMMANDS_TOO_MUCH`: Telegram 메뉴 항목이 너무 많습니다. OpenClaw는 이미 Telegram 한도에 맞춰 줄인 뒤 더 적은 명령으로 재시도하지만, 일부 메뉴 항목은 여전히 제거해야 합니다. Plugin/Skill/사용자 지정 명령을 줄이거나 메뉴가 필요 없다면 `channels.telegram.commands.native`를 비활성화하세요.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, 또는 유사한 네트워크 오류: VPS에 있거나 proxy 뒤에 있다면 `api.telegram.org`로의 outbound HTTPS가 허용되는지와 DNS가 동작하는지 확인하세요.

    Gateway가 원격이라면 반드시 Gateway 호스트의 로그를 보고 있는지 확인하세요.

    문서: [Telegram](/ko/channels/telegram), [Channel troubleshooting](/ko/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI에 출력이 없습니다. 무엇을 확인해야 하나요?">
    먼저 Gateway에 도달 가능하고 에이전트가 실행될 수 있는지 확인하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI에서는 `/status`를 사용해 현재 상태를 확인하세요. 채팅
    채널에서 응답을 기대한다면 전달이 활성화되어 있는지 확인하세요(`/deliver on`).

    문서: [TUI](/ko/web/tui), [Slash commands](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway를 완전히 중지한 뒤 다시 시작하려면 어떻게 하나요?">
    서비스를 설치했다면:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    이는 **관리되는 서비스**를 중지/시작합니다(macOS는 launchd, Linux는 systemd).
    Gateway가 백그라운드 daemon으로 실행될 때 사용하세요.

    전경에서 실행 중이라면 Ctrl-C로 중지한 뒤 다음을 실행하세요.

    ```bash
    openclaw gateway run
    ```

    문서: [Gateway service runbook](/ko/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart와 openclaw gateway의 차이">
    - `openclaw gateway restart`: **백그라운드 서비스**를 재시작합니다(launchd/systemd).
    - `openclaw gateway`: 이번 터미널 세션에서 gateway를 **전경에서** 실행합니다.

    서비스를 설치했다면 gateway 명령을 사용하세요. 일회성 전경 실행을 원할 때는 `openclaw gateway`를 사용하세요.

  </Accordion>

  <Accordion title="문제가 생겼을 때 더 자세한 내용을 가장 빨리 얻는 방법">
    더 자세한 콘솔 출력을 얻으려면 `--verbose`로 Gateway를 시작하세요. 그다음 로그 파일에서 채널 인증, 모델 라우팅, RPC 오류를 확인하세요.
  </Accordion>
</AccordionGroup>

## 미디어 및 첨부 파일

<AccordionGroup>
  <Accordion title="Skill이 이미지/PDF를 생성했는데 아무것도 전송되지 않았습니다">
    에이전트의 아웃바운드 첨부 파일에는 반드시 `MEDIA:<path-or-url>` 줄이 포함되어야 합니다(독립된 줄이어야 함). [OpenClaw assistant setup](/ko/start/openclaw) 및 [Agent send](/ko/tools/agent-send)를 참조하세요.

    CLI 전송:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    다음도 확인하세요.

    - 대상 채널이 아웃바운드 미디어를 지원하고 허용 목록에 의해 차단되지 않았는지
    - 파일이 provider 크기 제한 내에 있는지(이미지는 최대 2048px로 리사이즈됨)
    - `tools.fs.workspaceOnly=true`이면 로컬 경로 전송은 워크스페이스, temp/media-store, 샌드박스 검증 파일로 제한됩니다
    - `tools.fs.workspaceOnly=false`이면 에이전트가 이미 읽을 수 있는 호스트 로컬 파일을 `MEDIA:`로 전송할 수 있지만, 미디어 + 안전한 문서 유형(이미지, 오디오, 비디오, PDF, Office 문서)에만 해당됩니다. 일반 텍스트와 비밀처럼 보이는 파일은 여전히 차단됩니다.

    [Images](/ko/nodes/images)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 보안 및 접근 제어

<AccordionGroup>
  <Accordion title="인바운드 DM에 OpenClaw를 노출하는 것은 안전한가요?">
    인바운드 DM은 신뢰할 수 없는 입력으로 취급하세요. 기본값은 위험을 줄이도록 설계되어 있습니다.

    - DM이 가능한 채널의 기본 동작은 **pairing**입니다.
      - 알 수 없는 발신자는 pairing 코드를 받고, 봇은 메시지를 처리하지 않습니다.
      - 승인 명령: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 보류 요청은 **채널당 3개**로 제한됩니다. 코드가 도착하지 않았다면 `openclaw pairing list --channel <channel> [--account <id>]`로 확인하세요.
    - DM을 공개적으로 개방하려면 명시적인 opt-in이 필요합니다(`dmPolicy: "open"` 및 allowlist `"*"`).

    위험한 DM 정책을 표시하려면 `openclaw doctor`를 실행하세요.

  </Accordion>

  <Accordion title="프롬프트 인젝션은 공개 봇에서만 문제인가요?">
    아니요. 프롬프트 인젝션은 누가 DM을 보내는지가 아니라 **신뢰할 수 없는 콘텐츠**에 관한 문제입니다.
    비서가 외부 콘텐츠(웹 검색/가져오기, 브라우저 페이지, 이메일,
    문서, 첨부 파일, 붙여넣은 로그)를 읽는다면, 그 콘텐츠에 모델을 탈취하려는
    지시가 포함될 수 있습니다. 이는 **사용자 자신만 발신자일 때도**
    발생할 수 있습니다.

    가장 큰 위험은 도구가 활성화된 경우입니다. 모델이
    컨텍스트를 유출하거나 사용자를 대신해 도구를 호출하도록 속을 수 있습니다. 피해 범위를 줄이려면:

    - 읽기 전용 또는 도구 비활성화 "reader" 에이전트를 사용해 신뢰할 수 없는 콘텐츠를 요약하게 하세요
    - 도구 활성화 에이전트에서는 `web_search` / `web_fetch` / `browser`를 꺼두세요
    - 디코딩된 파일/문서 텍스트도 신뢰할 수 없는 것으로 취급하세요: OpenResponses
      `input_file`과 미디어 첨부 파일 추출은 모두 원시 파일 텍스트를 그대로 전달하는 대신
      추출된 텍스트를 명시적인 외부 콘텐츠 경계 마커로 감쌉니다
    - 샌드박싱과 엄격한 도구 허용 목록을 사용하세요

    자세한 내용: [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="봇에 자체 이메일, GitHub 계정, 또는 전화번호가 있어야 하나요?">
    예. 대부분의 설정에서는 그렇습니다. 별도 계정과 전화번호로 봇을 격리하면
    문제가 생겼을 때 피해 범위를 줄일 수 있습니다. 또한 개인 계정에 영향을 주지 않고 자격 증명을 교체하거나
    접근을 철회하기도 쉬워집니다.

    작게 시작하세요. 실제로 필요한 도구와 계정에만 접근 권한을 주고,
    필요할 때 나중에 확장하세요.

    문서: [Security](/ko/gateway/security), [Pairing](/ko/channels/pairing).

  </Accordion>

  <Accordion title="문자 메시지에 대한 자율성을 부여해도 되나요? 안전한가요?">
    개인 메시지에 대해 완전한 자율성을 부여하는 것은 **권장하지 않습니다**. 가장 안전한 패턴은 다음과 같습니다.

    - DM은 **pairing 모드** 또는 엄격한 허용 목록으로 유지
    - 사용자를 대신해 메시지를 보내게 하려면 **별도 번호 또는 계정** 사용
    - 초안 작성은 맡기되, **전송 전 승인**하기

    실험하고 싶다면 전용 계정에서 하고, 격리된 상태로 유지하세요. [Security](/ko/gateway/security)를 참조하세요.

  </Accordion>

  <Accordion title="개인 비서 작업에 더 저렴한 모델을 써도 되나요?">
    예. **에이전트가 채팅 전용이고 입력이 신뢰할 수 있는 경우라면** 가능합니다. 더 작은 계층은
    지시 탈취에 더 취약하므로, 도구가 활성화된 에이전트나
    신뢰할 수 없는 콘텐츠를 읽을 때는 피하세요. 반드시 더 작은 모델을 써야 한다면 도구를 잠그고
    샌드박스 안에서 실행하세요. [Security](/ko/gateway/security)를 참조하세요.
  </Accordion>

  <Accordion title="Telegram에서 /start를 눌렀는데 pairing 코드가 오지 않았습니다">
    Pairing 코드는 알 수 없는 발신자가 봇에 메시지를 보내고
    `dmPolicy: "pairing"`이 활성화된 경우에만 전송됩니다. `/start`만으로는 코드가 생성되지 않습니다.

    보류 요청 확인:

    ```bash
    openclaw pairing list telegram
    ```

    즉시 접근을 원한다면 발신자 id를 allowlist에 추가하거나 해당 계정에 대해 `dmPolicy: "open"`으로 설정하세요.

  </Accordion>

  <Accordion title="WhatsApp: 제 연락처에 메시지를 보내나요? pairing은 어떻게 동작하나요?">
    아니요. 기본 WhatsApp DM 정책은 **pairing**입니다. 알 수 없는 발신자는 pairing 코드만 받고 메시지는 **처리되지 않습니다**. OpenClaw는 자신이 받은 채팅이나 사용자가 명시적으로 트리거한 전송에만 응답합니다.

    pairing 승인:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    보류 요청 목록:

    ```bash
    openclaw pairing list whatsapp
    ```

    마법사의 전화번호 프롬프트: 이는 자신의 **allowlist/owner**를 설정해 자신의 DM이 허용되도록 하기 위한 것입니다. 자동 전송에 사용되지는 않습니다. 개인 WhatsApp 번호에서 실행한다면 그 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하세요.

  </Accordion>
</AccordionGroup>

## 채팅 명령, 작업 중단, 그리고 "멈추지 않음"

<AccordionGroup>
  <Accordion title="내부 시스템 메시지가 채팅에 보이지 않게 하려면 어떻게 하나요?">
    대부분의 내부 또는 도구 메시지는 해당 세션에서 **verbose**, **trace**, 또는 **reasoning**이 활성화된 경우에만 나타납니다.

    보이는 채팅에서 다음을 실행하세요.

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    그래도 여전히 시끄럽다면 Control UI의 세션 설정을 확인하고 verbose를
    **inherit**로 설정하세요. 또한 설정에서 `verboseDefault`가
    `on`으로 설정된 봇 프로필을 사용 중이 아닌지도 확인하세요.

    문서: [Thinking and verbose](/ko/tools/thinking), [Security](/ko/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="실행 중인 작업을 중지/취소하려면 어떻게 하나요?">
    다음 중 하나를 **독립된 메시지로** 보내세요(슬래시 없음).

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    이것들은 슬래시 명령이 아니라 abort 트리거입니다.

    백그라운드 프로세스(exec 도구에서 생성된 경우)의 경우 에이전트에게 다음을 실행하라고 요청할 수 있습니다.

    ```
    process action:kill sessionId:XXX
    ```

    슬래시 명령 개요는 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

    대부분의 명령은 `/`로 시작하는 **독립된** 메시지로 보내야 하지만, 몇몇 단축 명령(`/status` 등)은 allowlist에 있는 발신자에 한해 인라인으로도 동작합니다.

  </Accordion>

  <Accordion title='Telegram에서 Discord로 메시지를 보내려면 어떻게 하나요?("Cross-context messaging denied")'>
    OpenClaw는 기본적으로 **교차 provider** 메시징을 차단합니다. 도구 호출이
    Telegram에 바인딩되어 있으면, 명시적으로 허용하지 않는 한 Discord로 전송되지 않습니다.

    해당 에이전트에서 교차 provider 메시징을 활성화하세요.

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    설정을 편집한 후 gateway를 재시작하세요.

  </Accordion>

  <Accordion title='왜 봇이 빠르게 연속으로 온 메시지를 "무시하는" 것처럼 느껴지나요?'>
    queue 모드는 새 메시지가 실행 중인 작업과 어떻게 상호작용할지 제어합니다. `/queue`를 사용해 모드를 변경하세요.

    - `steer` - 새 메시지가 현재 작업을 재지정
    - `followup` - 메시지를 하나씩 순서대로 실행
    - `collect` - 메시지를 모아서 한 번만 응답(기본값)
    - `steer-backlog` - 지금은 steer하고, 그 후 backlog 처리
    - `interrupt` - 현재 실행을 중단하고 새로 시작

    followup 모드에서는 `debounce:2s cap:25 drop:summarize` 같은 옵션도 추가할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 기타

<AccordionGroup>
  <Accordion title='Anthropic에서 API 키를 사용할 때 기본 모델은 무엇인가요?'>
    OpenClaw에서는 자격 증명과 모델 선택이 분리되어 있습니다. `ANTHROPIC_API_KEY`를 설정하거나(또는 auth profile에 Anthropic API 키를 저장하면) 인증은 활성화되지만, 실제 기본 모델은 `agents.defaults.model.primary`에 구성한 값입니다(예: `anthropic/claude-sonnet-4-6` 또는 `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"`가 보인다면, 실행 중인 에이전트에 대해 Gateway가 예상 위치의 `auth-profiles.json`에서 Anthropic 자격 증명을 찾지 못했다는 뜻입니다.
  </Accordion>
</AccordionGroup>

---

여전히 막히나요? [Discord](https://discord.com/invite/clawd)에서 물어보거나 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)을 열어보세요.

## 관련 항목

- [FAQ — quick start and first-run setup](/ko/help/faq-first-run)
- [FAQ — models and auth profiles](/ko/help/faq-models)
- [Troubleshooting](/ko/help/troubleshooting)
