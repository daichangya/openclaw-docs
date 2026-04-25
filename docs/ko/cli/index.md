---
read_when:
    - 적절한 `openclaw` 하위 명령 찾기
    - 전역 플래그 또는 출력 스타일 규칙 확인하기
summary: 'OpenClaw CLI 색인: 명령 목록, 전역 플래그, 그리고 명령별 페이지 링크'
title: CLI 참조
x-i18n:
    generated_at: "2026-04-25T12:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8a61396b8ec7f57d15988d40b09f90458745bbb29e90bd387134aa032214853
    source_path: cli/index.md
    workflow: 15
---

`openclaw`는 기본 CLI 진입점입니다. 각 핵심 명령에는 전용 참조 페이지가 있거나 해당 명령이 별칭으로 연결된 명령과 함께 문서화되어 있습니다. 이 색인은 명령, 전역 플래그, 그리고 CLI 전반에 적용되는 출력 스타일 규칙을 나열합니다.

## 명령 페이지

| 영역 | 명령 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 설정 및 온보딩 | [`crestodian`](/ko/cli/crestodian) · [`setup`](/ko/cli/setup) · [`onboard`](/ko/cli/onboard) · [`configure`](/ko/cli/configure) · [`config`](/ko/cli/config) · [`completion`](/ko/cli/completion) · [`doctor`](/ko/cli/doctor) · [`dashboard`](/ko/cli/dashboard) |
| 재설정 및 제거 | [`backup`](/ko/cli/backup) · [`reset`](/ko/cli/reset) · [`uninstall`](/ko/cli/uninstall) · [`update`](/ko/cli/update) |
| 메시징 및 에이전트 | [`message`](/ko/cli/message) · [`agent`](/ko/cli/agent) · [`agents`](/ko/cli/agents) · [`acp`](/ko/cli/acp) · [`mcp`](/ko/cli/mcp) |
| 상태 점검 및 세션 | [`status`](/ko/cli/status) · [`health`](/ko/cli/health) · [`sessions`](/ko/cli/sessions) |
| Gateway 및 로그 | [`gateway`](/ko/cli/gateway) · [`logs`](/ko/cli/logs) · [`system`](/ko/cli/system) |
| 모델 및 추론 | [`models`](/ko/cli/models) · [`infer`](/ko/cli/infer) · `capability` ([`infer`](/ko/cli/infer)의 별칭) · [`memory`](/ko/cli/memory) · [`wiki`](/ko/cli/wiki) |
| 네트워크 및 Node | [`directory`](/ko/cli/directory) · [`nodes`](/ko/cli/nodes) · [`devices`](/ko/cli/devices) · [`node`](/ko/cli/node) |
| 런타임 및 샌드박스 | [`approvals`](/ko/cli/approvals) · `exec-policy` ([`approvals`](/ko/cli/approvals) 참조) · [`sandbox`](/ko/cli/sandbox) · [`tui`](/ko/cli/tui) · `chat`/`terminal` ([`tui --local`](/ko/cli/tui)의 별칭) · [`browser`](/ko/cli/browser) |
| 자동화 | [`cron`](/ko/cli/cron) · [`tasks`](/ko/cli/tasks) · [`hooks`](/ko/cli/hooks) · [`webhooks`](/ko/cli/webhooks) |
| 검색 및 문서 | [`dns`](/ko/cli/dns) · [`docs`](/ko/cli/docs) |
| 페어링 및 채널 | [`pairing`](/ko/cli/pairing) · [`qr`](/ko/cli/qr) · [`channels`](/ko/cli/channels) |
| 보안 및 plugins | [`security`](/ko/cli/security) · [`secrets`](/ko/cli/secrets) · [`skills`](/ko/cli/skills) · [`plugins`](/ko/cli/plugins) · [`proxy`](/ko/cli/proxy) |
| 레거시 별칭 | [`daemon`](/ko/cli/daemon) (gateway 서비스) · [`clawbot`](/ko/cli/clawbot) (namespace) |
| Plugins(선택 사항) | [`voicecall`](/ko/cli/voicecall) (설치된 경우) |

## 전역 플래그

| 플래그 | 용도 |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev` | `~/.openclaw-dev` 아래로 상태를 격리하고 기본 포트를 변경 |
| `--profile <name>` | `~/.openclaw-<name>` 아래로 상태를 격리 |
| `--container <name>` | 실행 대상으로 이름이 지정된 컨테이너 지정 |
| `--no-color` | ANSI 색상 비활성화(`NO_COLOR=1`도 적용됨) |
| `--update` | [`openclaw update`](/ko/cli/update)의 단축형(소스 설치 전용) |
| `-V`, `--version`, `-v` | 버전을 출력하고 종료 |

## 출력 모드

- ANSI 색상과 진행 표시기는 TTY 세션에서만 렌더링됩니다.
- OSC-8 하이퍼링크는 지원되는 환경에서 클릭 가능한 링크로 렌더링되며, 그렇지 않으면 CLI는 일반 URL로 대체합니다.
- `--json`(그리고 지원되는 경우 `--plain`)은 깔끔한 출력을 위해 스타일을 비활성화합니다.
- 오래 실행되는 명령은 진행 표시기(OSC 9;4 지원 시)를 표시합니다.

팔레트의 기준 소스: `src/terminal/palette.ts`.

## 명령 트리

<Accordion title="전체 명령 트리">

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugins는 추가 최상위 명령을 더할 수 있습니다(예: `openclaw voicecall`).

</Accordion>

## 채팅 슬래시 명령

채팅 메시지는 `/...` 명령을 지원합니다. 자세한 내용은 [slash commands](/ko/tools/slash-commands)를 참조하세요.

주요 항목:

- `/status` — 빠른 진단.
- `/trace` — 세션 범위 Plugin 추적/디버그 라인.
- `/config` — 유지되는 구성 변경.
- `/debug` — 런타임 전용 구성 재정의(디스크가 아닌 메모리, `commands.debug: true` 필요).

## 사용량 추적

OAuth/API 자격 증명을 사용할 수 있으면 `openclaw status --usage`와 Control UI에서 공급자 사용량/할당량을 표시합니다. 데이터는 공급자 사용량 엔드포인트에서 직접 가져오며 `X% left`로 정규화됩니다. 현재 사용량 창을 지원하는 공급자: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi, z.ai.

자세한 내용은 [Usage tracking](/ko/concepts/usage-tracking)을 참조하세요.

## 관련 항목

- [Slash commands](/ko/tools/slash-commands)
- [구성](/ko/gateway/configuration)
- [환경](/ko/help/environment)
