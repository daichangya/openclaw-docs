---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่งหรือตัวเลือก CLI
    - การจัดทำเอกสารสำหรับพื้นผิวคำสั่งใหม่
summary: ข้อมูลอ้างอิง OpenClaw CLI สำหรับคำสั่ง คำสั่งย่อย และตัวเลือกของ `openclaw`
title: ข้อมูลอ้างอิง CLI
x-i18n:
    generated_at: "2026-04-23T06:18:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff7d448e8f9f32936cdd286db09bcf0e746795176b2f3863ab378e0d1b61a5d
    source_path: cli/index.md
    workflow: 15
---

# ข้อมูลอ้างอิง CLI

หน้านี้อธิบายพฤติกรรม CLI ปัจจุบัน หากคำสั่งมีการเปลี่ยนแปลง ให้ปรับปรุงเอกสารนี้

## หน้าคำสั่ง

- [`setup`](/th/cli/setup)
- [`onboard`](/th/cli/onboard)
- [`configure`](/th/cli/configure)
- [`config`](/th/cli/config)
- [`completion`](/th/cli/completion)
- [`doctor`](/th/cli/doctor)
- [`dashboard`](/th/cli/dashboard)
- [`backup`](/th/cli/backup)
- [`reset`](/th/cli/reset)
- [`uninstall`](/th/cli/uninstall)
- [`update`](/th/cli/update)
- [`message`](/th/cli/message)
- [`agent`](/th/cli/agent)
- [`agents`](/th/cli/agents)
- [`acp`](/th/cli/acp)
- [`mcp`](/th/cli/mcp)
- [`status`](/th/cli/status)
- [`health`](/th/cli/health)
- [`sessions`](/th/cli/sessions)
- [`gateway`](/th/cli/gateway)
- [`logs`](/th/cli/logs)
- [`system`](/th/cli/system)
- [`models`](/th/cli/models)
- [`infer`](/th/cli/infer)
- [`memory`](/th/cli/memory)
- [`wiki`](/th/cli/wiki)
- [`directory`](/th/cli/directory)
- [`nodes`](/th/cli/nodes)
- [`devices`](/th/cli/devices)
- [`node`](/th/cli/node)
- [`approvals`](/th/cli/approvals)
- [`sandbox`](/th/cli/sandbox)
- [`tui`](/th/cli/tui)
- [`browser`](/th/cli/browser)
- [`cron`](/th/cli/cron)
- [`tasks`](/th/cli/tasks)
- [`flows`](/th/cli/flows)
- [`dns`](/th/cli/dns)
- [`docs`](/th/cli/docs)
- [`hooks`](/th/cli/hooks)
- [`webhooks`](/th/cli/webhooks)
- [`pairing`](/th/cli/pairing)
- [`qr`](/th/cli/qr)
- [`plugins`](/th/cli/plugins) (คำสั่ง Plugin)
- [`channels`](/th/cli/channels)
- [`security`](/th/cli/security)
- [`secrets`](/th/cli/secrets)
- [`skills`](/th/cli/skills)
- [`daemon`](/th/cli/daemon) (นามแฝงแบบ legacy สำหรับคำสั่งบริการ gateway)
- [`clawbot`](/th/cli/clawbot) (namespace นามแฝงแบบ legacy)
- [`voicecall`](/th/cli/voicecall) (plugin; หากติดตั้งแล้ว)

## แฟล็กส่วนกลาง

- `--dev`: แยก state ไว้ใต้ `~/.openclaw-dev` และเปลี่ยนพอร์ตค่าเริ่มต้น
- `--profile <name>`: แยก state ไว้ใต้ `~/.openclaw-<name>`
- `--container <name>`: กำหนดเป้าหมายคอนเทนเนอร์ที่มีชื่อสำหรับการดำเนินการ
- `--no-color`: ปิดใช้งานสี ANSI
- `--update`: รูปแบบย่อของ `openclaw update` (เฉพาะการติดตั้งจากซอร์ส)
- `-V`, `--version`, `-v`: พิมพ์เวอร์ชันแล้วออก

## การจัดรูปแบบเอาต์พุต

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้ในเทอร์มินัลที่รองรับ มิฉะนั้นจะย้อนกลับไปใช้ URL แบบข้อความธรรมดา
- `--json` (และ `--plain` ในจุดที่รองรับ) จะปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่สะอาด
- `--no-color` จะปิดการจัดรูปแบบ ANSI และยังรองรับ `NO_COLOR=1`
- คำสั่งที่ใช้เวลานานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 เมื่อรองรับ)

## ชุดสี

OpenClaw ใช้ชุดสี lobster สำหรับเอาต์พุต CLI

- `accent` (#FF5A2D): หัวข้อ, ป้ายกำกับ, ไฮไลต์หลัก
- `accentBright` (#FF7A3D): ชื่อคำสั่ง, การเน้น
- `accentDim` (#D14A22): ข้อความไฮไลต์รอง
- `info` (#FF8A5B): ค่าข้อมูล
- `success` (#2FBF71): สถานะสำเร็จ
- `warn` (#FFB020): คำเตือน, การย้อนกลับ, จุดที่ต้องใส่ใจ
- `error` (#E23D2D): ข้อผิดพลาด, ความล้มเหลว
- `muted` (#8B7F77): การลดความเด่น, ข้อมูลเมตา

แหล่งอ้างอิงหลักของชุดสี: `src/terminal/palette.ts` (ชุดสี “lobster”)

## ผังคำสั่ง

```
openclaw [--dev] [--profile <name>] <command>
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
  infer (นามแฝง: capability)
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
```

หมายเหตุ: plugin สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ (เช่น `openclaw voicecall`)

## ความปลอดภัย

- `openclaw security audit` — ตรวจสอบ config + state ในเครื่องเพื่อหาจุดเสี่ยงด้านความปลอดภัยที่พบบ่อย
- `openclaw security audit --deep` — probe Gateway แบบสดโดยพยายามให้ได้ผลดีที่สุด
- `openclaw security audit --fix` — ทำให้ค่าเริ่มต้นที่ปลอดภัยและสิทธิ์ของ state/config เข้มงวดยิ่งขึ้น

## Secrets

### `secrets`

จัดการ SecretRefs และสุขอนามัยของ runtime/config ที่เกี่ยวข้อง

คำสั่งย่อย:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

ตัวเลือกของ `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

ตัวเลือกของ `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

ตัวเลือกของ `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

ตัวเลือกของ `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

หมายเหตุ:

- `reload` เป็น Gateway RPC และจะคง snapshot runtime ล่าสุดที่ยังใช้งานได้ไว้เมื่อการ resolve ล้มเหลว
- `audit --check` จะคืนค่า non-zero เมื่อพบปัญหา โดย unresolved refs จะใช้ exit code แบบ non-zero ที่มีลำดับความสำคัญสูงกว่า
- การตรวจสอบ exec แบบ dry-run จะถูกข้ามตามค่าเริ่มต้น ใช้ `--allow-exec` เพื่อเลือกเปิดใช้งาน

## Plugins

จัดการ plugins และ config ของมัน:

- `openclaw plugins list` — ค้นหา plugins (ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)
- `openclaw plugins inspect <id>` — แสดงรายละเอียดของ plugin (`info` เป็นนามแฝง)
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — ติดตั้ง plugin (หรือเพิ่ม path ของ plugin ลงใน `plugins.load.paths`; ใช้ `--force` เพื่อเขียนทับเป้าหมายการติดตั้งที่มีอยู่)
- `openclaw plugins marketplace list <marketplace>` — แสดงรายการใน marketplace ก่อนติดตั้ง
- `openclaw plugins enable <id>` / `disable <id>` — สลับค่า `plugins.entries.<id>.enabled`
- `openclaw plugins doctor` — รายงานข้อผิดพลาดในการโหลด plugin

การเปลี่ยนแปลง plugin ส่วนใหญ่ต้องรีสตาร์ท gateway ดู [/plugin](/th/tools/plugin)

## Memory

การค้นหาแบบเวกเตอร์บน `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — แสดงสถิติดัชนี ใช้ `--deep` สำหรับการตรวจสอบความพร้อมของเวกเตอร์ + embedding หรือ `--fix` เพื่อซ่อมแซมอาร์ติแฟกต์ recall/promotion ที่ล้าสมัย
- `openclaw memory index` — ทำดัชนีไฟล์ memory ใหม่
- `openclaw memory search "<query>"` (หรือ `--query "<query>"`) — ค้นหาเชิงความหมายบน memory
- `openclaw memory promote` — จัดอันดับ recalls ระยะสั้น และสามารถผนวกข้อมูลอันดับต้น ๆ ลงใน `MEMORY.md` ได้

## Sandbox

จัดการ runtime ของ sandbox สำหรับการรัน agent แบบแยก ดู [/cli/sandbox](/th/cli/sandbox)

คำสั่งย่อย:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

หมายเหตุ:

- `sandbox recreate` จะลบ runtime ที่มีอยู่ เพื่อให้การใช้งานครั้งถัดไปสร้างขึ้นใหม่ด้วย config ปัจจุบัน
- สำหรับแบ็กเอนด์ `ssh` และ OpenShell `remote`, การ recreate จะลบ workspace ระยะไกลแบบ canonical สำหรับขอบเขตที่เลือก

## คำสั่ง slash ในแชต

ข้อความแชตรองรับคำสั่ง `/...` (ทั้งแบบข้อความและแบบเนทีฟ) ดู [/tools/slash-commands](/th/tools/slash-commands)

จุดเด่น:

- `/status` สำหรับการวินิจฉัยอย่างรวดเร็ว
- `/trace` สำหรับบรรทัด trace/debug ของ plugin ในขอบเขตเซสชัน
- `/config` สำหรับการเปลี่ยนแปลง config ที่คงอยู่ถาวร
- `/debug` สำหรับการแทนที่ config แบบ runtime เท่านั้น (อยู่ในหน่วยความจำ ไม่ลงดิสก์; ต้องใช้ `commands.debug: true`)

## การตั้งค่า + การเริ่มต้นใช้งาน

### `completion`

สร้างสคริปต์ shell-completion และเลือกติดตั้งลงในโปรไฟล์เชลล์ของคุณได้

ตัวเลือก:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

หมายเหตุ:

- หากไม่มี `--install` หรือ `--write-state`, `completion` จะพิมพ์สคริปต์ไปยัง stdout
- `--install` จะเขียนบล็อก `OpenClaw Completion` ลงในโปรไฟล์เชลล์ของคุณ และชี้ไปยังสคริปต์ที่แคชไว้ใต้ไดเรกทอรี state ของ OpenClaw

### `setup`

เริ่มต้น config + workspace

ตัวเลือก:

- `--workspace <dir>`: พาธ workspace ของ agent (ค่าเริ่มต้น `~/.openclaw/workspace`)
- `--wizard`: เรียกใช้ onboarding
- `--non-interactive`: เรียกใช้ onboarding โดยไม่มีพรอมป์ต์
- `--mode <local|remote>`: โหมด onboarding
- `--remote-url <url>`: URL ของ Gateway ระยะไกล
- `--remote-token <token>`: โทเค็นของ Gateway ระยะไกล

ระบบจะเรียกใช้ onboarding อัตโนมัติเมื่อมีแฟล็ก onboarding ใด ๆ (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`)

### `onboard`

onboarding แบบโต้ตอบสำหรับ gateway, workspace และ Skills

ตัวเลือก:

- `--workspace <dir>`
- `--reset` (รีเซ็ต config + credentials + sessions ก่อน onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (ค่าเริ่มต้น `config+creds+sessions`; ใช้ `full` เพื่อลบ workspace ด้วย)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` เป็นนามแฝงของ `advanced`)
- `--auth-choice <choice>` โดยที่ `<choice>` เป็นหนึ่งใน:
  `chutes`, `deepseek-api-key`, `openai-codex`, `openai-api-key`,
  `openrouter-api-key`, `kilocode-api-key`, `litellm-api-key`, `ai-gateway-api-key`,
  `cloudflare-ai-gateway-api-key`, `moonshot-api-key`, `moonshot-api-key-cn`,
  `kimi-code-api-key`, `synthetic-api-key`, `venice-api-key`, `together-api-key`,
  `huggingface-api-key`, `apiKey`, `gemini-api-key`, `google-gemini-cli`, `zai-api-key`,
  `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`, `xiaomi-api-key`,
  `minimax-global-oauth`, `minimax-global-api`, `minimax-cn-oauth`, `minimax-cn-api`,
  `opencode-zen`, `opencode-go`, `github-copilot`, `copilot-proxy`, `xai-api-key`,
  `mistral-api-key`, `volcengine-api-key`, `byteplus-api-key`, `qianfan-api-key`,
  `qwen-standard-api-key-cn`, `qwen-standard-api-key`, `qwen-api-key-cn`, `qwen-api-key`,
  `modelstudio-standard-api-key-cn`, `modelstudio-standard-api-key`,
  `modelstudio-api-key-cn`, `modelstudio-api-key`, `custom-api-key`, `skip`
- หมายเหตุเกี่ยวกับ Qwen: `qwen-*` เป็นตระกูล auth-choice แบบ canonical ส่วน id `modelstudio-*` ยังคงยอมรับได้เฉพาะในฐานะนามแฝงแบบ legacy เพื่อความเข้ากันได้เท่านั้น
- `--secret-input-mode <plaintext|ref>` (ค่าเริ่มต้น `plaintext`; ใช้ `ref` เพื่อจัดเก็บ env refs ค่าเริ่มต้นของ provider แทนคีย์ plaintext)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (ไม่โต้ตอบ; ใช้ร่วมกับ `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (ไม่โต้ตอบ; ใช้ร่วมกับ `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (ไม่โต้ตอบ; เป็นทางเลือก; ใช้ร่วมกับ `--auth-choice custom-api-key`; จะย้อนกลับไปใช้ `CUSTOM_API_KEY` หากไม่ระบุ)
- `--custom-provider-id <id>` (ไม่โต้ตอบ; id provider แบบกำหนดเองที่เป็นทางเลือก)
- `--custom-compatibility <openai|anthropic>` (ไม่โต้ตอบ; เป็นทางเลือก; ค่าเริ่มต้น `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (ไม่โต้ตอบ; จัดเก็บ `gateway.auth.token` เป็น env SecretRef; ต้องตั้งค่า env var นั้นไว้; ไม่สามารถใช้ร่วมกับ `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (นามแฝง: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (ตัวจัดการ Node สำหรับ setup/onboarding สำหรับ Skills; แนะนำ pnpm และรองรับ bun ด้วย)
- `--json`

### `configure`

วิซาร์ดการกำหนดค่าแบบโต้ตอบ (โมเดล, channels, Skills, gateway)

ตัวเลือก:

- `--section <section>` (ใช้ซ้ำได้; จำกัดวิซาร์ดให้เฉพาะส่วนที่ต้องการ)

### `config`

ตัวช่วย config แบบไม่โต้ตอบ (`get`/`set`/`unset`/`file`/`schema`/`validate`) การรัน `openclaw config` โดยไม่มี
คำสั่งย่อยจะเปิดวิซาร์ด

คำสั่งย่อย:

- `config get <path>`: พิมพ์ค่า config (พาธแบบ dot/bracket)
- `config set`: รองรับโหมดการกำหนดค่า 4 แบบ:
  - โหมด value: `config set <path> <value>` (แยกวิเคราะห์แบบ JSON5-หรือ-string)
  - โหมดตัวสร้าง SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - โหมดตัวสร้าง provider: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - โหมดแบตช์: `config set --batch-json '<json>'` หรือ `config set --batch-file <path>`
- `config set --dry-run`: ตรวจสอบการกำหนดค่าโดยไม่เขียน `openclaw.json` (การตรวจสอบ exec SecretRef จะถูกข้ามตามค่าเริ่มต้น)
- `config set --allow-exec --dry-run`: เลือกเปิดใช้การตรวจสอบ exec SecretRef แบบ dry-run (อาจมีการเรียกใช้คำสั่งของ provider)
- `config set --dry-run --json`: ส่งออกผล dry-run ที่เครื่องอ่านได้ (checks + completeness signal, operations, refs ที่ตรวจสอบ/ข้าม, ข้อผิดพลาด)
- `config set --strict-json`: บังคับให้แยกวิเคราะห์อินพุต path/value เป็น JSON5 โดย `--json` ยังคงเป็นนามแฝงแบบ legacy สำหรับการแยกวิเคราะห์แบบ strict นอกโหมดเอาต์พุต dry-run
- `config unset <path>`: ลบค่าออก
- `config file`: พิมพ์พาธไฟล์ config ที่ใช้งานอยู่
- `config schema`: พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` รวมถึงข้อมูลเมตาเอกสาร `title` / `description` ของฟิลด์ที่ถูกเผยแพร่ต่อผ่านกิ่งของออบเจ็กต์ซ้อน, wildcard, รายการอาร์เรย์ และ composition พร้อมทั้งข้อมูลเมตา schema แบบสดของ plugin/channel ตามความสามารถสูงสุด
- `config validate`: ตรวจสอบ config ปัจจุบันกับ schema โดยไม่เริ่ม gateway
- `config validate --json`: ส่งออกผล JSON ที่เครื่องอ่านได้

### `doctor`

การตรวจสอบสุขภาพ + การแก้ไขด่วน (config + gateway + บริการ legacy)

ตัวเลือก:

- `--no-workspace-suggestions`: ปิดคำแนะนำ memory ของ workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม (headless)
- `--non-interactive`: ข้ามพรอมป์ต์; ใช้เฉพาะ migration ที่ปลอดภัย
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง gateway เพิ่มเติม
- `--repair` (นามแฝง: `--fix`): พยายามซ่อมแซมปัญหาที่ตรวจพบโดยอัตโนมัติ
- `--force`: บังคับซ่อมแซมแม้ไม่จำเป็นอย่างเคร่งครัด
- `--generate-gateway-token`: สร้างโทเค็นยืนยันตัวตนของ gateway ใหม่

### `dashboard`

เปิด Control UI ด้วยโทเค็นปัจจุบันของคุณ

ตัวเลือก:

- `--no-open`: พิมพ์ URL แต่ไม่เปิดเบราว์เซอร์

หมายเหตุ:

- สำหรับโทเค็น gateway ที่จัดการด้วย SecretRef, `dashboard` จะพิมพ์หรือเปิด URL แบบไม่มีโทเค็นแทนการเปิดเผยความลับในเอาต์พุตเทอร์มินัลหรืออาร์กิวเมนต์ตอนเปิดเบราว์เซอร์

### `update`

อัปเดต CLI ที่ติดตั้งไว้

ตัวเลือกระดับราก:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

คำสั่งย่อย:

- `update status`
- `update wizard`

ตัวเลือกของ `update status`:

- `--json`
- `--timeout <seconds>`

ตัวเลือกของ `update wizard`:

- `--timeout <seconds>`

หมายเหตุ:

- `openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update`

### `backup`

สร้างและตรวจสอบอาร์ไคฟ์สำรองข้อมูลในเครื่องสำหรับ state ของ OpenClaw

คำสั่งย่อย:

- `backup create`
- `backup verify <archive>`

ตัวเลือกของ `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

ตัวเลือกของ `backup verify <archive>`:

- `--json`

## ตัวช่วยสำหรับ Channel

### `channels`

จัดการบัญชี channel แชต (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams)

คำสั่งย่อย:

- `channels list`: แสดง channels และโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้
- `channels status`: ตรวจสอบการเข้าถึง gateway และสุขภาพของ channel (`--probe` จะรันการตรวจสอบ probe/audit แบบสดรายบัญชีเมื่อเข้าถึง gateway ได้; หากไม่ได้ จะย้อนกลับไปใช้สรุป channel จาก config เท่านั้น ใช้ `openclaw health` หรือ `openclaw status --deep` สำหรับการตรวจสอบสุขภาพ gateway ที่กว้างกว่า)
- เคล็ดลับ: `channels status` จะแสดงคำเตือนพร้อมวิธีแก้ที่แนะนำเมื่อสามารถตรวจพบการกำหนดค่าผิดพลาดที่พบบ่อยได้ (จากนั้นจะชี้คุณไปที่ `openclaw doctor`)
- `channels logs`: แสดงบันทึก channel ล่าสุดจากไฟล์บันทึก gateway
- `channels add`: ตั้งค่าแบบวิซาร์ดเมื่อไม่ส่งแฟล็กใด ๆ; หากส่งแฟล็กจะเปลี่ยนเป็นโหมดไม่โต้ตอบ
  - เมื่อเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นให้กับ channel ที่ยังใช้ config ระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าที่ผูกกับขอบเขตบัญชีเข้าไปในแผนที่บัญชีของ channel ก่อนเขียนบัญชีใหม่ โดย channels ส่วนใหญ่ใช้ `accounts.default`; Matrix อาจคงเป้าหมาย named/default ที่ตรงกันซึ่งมีอยู่เดิมไว้แทน
  - `channels add` แบบไม่โต้ตอบจะไม่สร้าง/อัปเกรด bindings โดยอัตโนมัติ; bindings แบบ channel-only จะยังคงจับคู่กับบัญชีค่าเริ่มต้นต่อไป
- `channels remove`: ปิดใช้งานตามค่าเริ่มต้น; ส่ง `--delete` เพื่อลบรายการ config โดยไม่ถาม
- `channels login`: ล็อกอิน channel แบบโต้ตอบ (เฉพาะ WhatsApp Web)
- `channels logout`: ออกจากระบบเซสชัน channel (หากรองรับ)

ตัวเลือกทั่วไป:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id บัญชี channel (ค่าเริ่มต้น `default`)
- `--name <label>`: ชื่อที่แสดงของบัญชี

ตัวเลือกของ `channels login`:

- `--channel <channel>` (ค่าเริ่มต้น `whatsapp`; รองรับ `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

ตัวเลือกของ `channels logout`:

- `--channel <channel>` (ค่าเริ่มต้น `whatsapp`)
- `--account <id>`

ตัวเลือกของ `channels list`:

- `--no-usage`: ข้าม snapshot การใช้งาน/โควตาของผู้ให้บริการโมเดล (เฉพาะแบบ OAuth/API-backed)
- `--json`: ส่งออก JSON (รวม usage เว้นแต่จะตั้ง `--no-usage`)

ตัวเลือกของ `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

ตัวเลือกของ `channels capabilities`:

- `--channel <name>`
- `--account <id>` (ใช้ได้เฉพาะเมื่อมี `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

ตัวเลือกของ `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

ตัวเลือกของ `channels logs`:

- `--channel <name|all>` (ค่าเริ่มต้น `all`)
- `--lines <n>` (ค่าเริ่มต้น `200`)
- `--json`

หมายเหตุ:

- `channels login` รองรับ `--verbose`
- `channels capabilities --account` ใช้ได้เฉพาะเมื่อมีการตั้ง `--channel`
- `channels status --probe` สามารถแสดงสถานะ transport พร้อมผล probe/audit เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed` ตามความสามารถที่ channel รองรับ

รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)

ตัวอย่าง:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

ค้นหา id ของตัวเอง, peer และกลุ่มสำหรับ channels ที่เปิดเผยพื้นผิว directory ดู [`openclaw directory`](/th/cli/directory)

ตัวเลือกทั่วไป:

- `--channel <name>`
- `--account <id>`
- `--json`

คำสั่งย่อย:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

แสดงรายการและตรวจสอบ Skills ที่มีอยู่ พร้อมข้อมูลความพร้อมใช้งาน

คำสั่งย่อย:

- `skills search [query...]`: ค้นหา Skills บน ClawHub
- `skills search --limit <n> --json`: จำกัดผลการค้นหา หรือส่งออกผลลัพธ์ที่เครื่องอ่านได้
- `skills install <slug>`: ติดตั้ง Skills จาก ClawHub ลงใน workspace ที่ใช้งานอยู่
- `skills install <slug> --version <version>`: ติดตั้งเวอร์ชัน ClawHub ที่ระบุ
- `skills install <slug> --force`: เขียนทับโฟลเดอร์ Skills ใน workspace ที่มีอยู่
- `skills update <slug|--all>`: อัปเดต Skills จาก ClawHub ที่ติดตามไว้
- `skills list`: แสดงรายการ Skills (ค่าเริ่มต้นเมื่อไม่มีคำสั่งย่อย)
- `skills list --json`: ส่งออกคลัง Skills ที่เครื่องอ่านได้ไปยัง stdout
- `skills list --verbose`: รวม requirements ที่ขาดหายไปไว้ในตาราง
- `skills info <name>`: แสดงรายละเอียดของ Skills หนึ่งรายการ
- `skills info <name> --json`: ส่งออกรายละเอียดที่เครื่องอ่านได้ไปยัง stdout
- `skills check`: สรุป requirements ที่พร้อมใช้งานเทียบกับที่ขาดหายไป
- `skills check --json`: ส่งออกผลความพร้อมใช้งานที่เครื่องอ่านได้ไปยัง stdout

ตัวเลือก:

- `--eligible`: แสดงเฉพาะ Skills ที่พร้อมใช้งาน
- `--json`: ส่งออก JSON (ไม่มีการจัดรูปแบบ)
- `-v`, `--verbose`: รวมรายละเอียด requirements ที่ขาดหายไป

เคล็ดลับ: ใช้ `openclaw skills search`, `openclaw skills install` และ `openclaw skills update` สำหรับ Skills ที่ขับเคลื่อนโดย ClawHub

### `pairing`

อนุมัติคำขอจับคู่ DM ข้าม channels

คำสั่งย่อย:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

หมายเหตุ:

- หากมี channel ที่รองรับการจับคู่ถูกกำหนดค่าไว้เพียงหนึ่งรายการ อนุญาตให้ใช้ `pairing approve <code>` ได้เช่นกัน
- ทั้ง `list` และ `approve` รองรับ `--account <id>` สำหรับ channels แบบหลายบัญชี

### `devices`

จัดการรายการการจับคู่อุปกรณ์ของ gateway และโทเค็นอุปกรณ์แยกตามบทบาท

คำสั่งย่อย:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

หมายเหตุ:

- `devices list` และ `devices approve` สามารถย้อนกลับไปใช้ไฟล์การจับคู่ในเครื่องบน local loopback ได้ เมื่อขอบเขตการจับคู่โดยตรงไม่พร้อมใช้งาน
- `devices approve` ต้องมี request ID อย่างชัดเจนก่อนสร้างโทเค็น; หากไม่ระบุ `requestId` หรือส่ง `--latest` จะเป็นเพียงการแสดงตัวอย่างคำขอที่รอดำเนินการล่าสุดเท่านั้น
- การเชื่อมต่อใหม่ด้วยโทเค็นที่จัดเก็บไว้จะใช้ขอบเขตที่อนุมัติแล้วซึ่งแคชไว้ของโทเค็นนั้นซ้ำ
  ส่วน `devices rotate --scope ...` แบบชัดเจนจะอัปเดตชุดขอบเขตที่จัดเก็บไว้นั้นสำหรับ
  การเชื่อมต่อใหม่ด้วยโทเค็นแคชในอนาคต
- `devices rotate` และ `devices revoke` จะส่งกลับเพย์โหลด JSON

### `qr`

สร้าง QR สำหรับการจับคู่มือถือและรหัส setup จาก config Gateway ปัจจุบัน ดู [`openclaw qr`](/th/cli/qr)

ตัวเลือก:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

หมายเหตุ:

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- รหัส setup มีโทเค็น bootstrap อายุสั้น ไม่ใช่โทเค็น/รหัสผ่าน gateway แบบใช้ร่วมกัน
- การส่งต่อ bootstrap ในตัวจะคงโทเค็น node หลักไว้ที่ `scopes: []`
- โทเค็น bootstrap สำหรับ operator ที่ถูกส่งต่อใด ๆ จะยังคงถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write`
- การตรวจสอบขอบเขต bootstrap ใช้คำนำหน้าตามบทบาท ดังนั้น allowlist ของ operator นั้นจะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น; บทบาทที่ไม่ใช่ operator ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง
- `--remote` สามารถใช้ `gateway.remote.url` หรือ URL ของ Tailscale Serve/Funnel ที่ใช้งานอยู่
- หลังจากสแกนแล้ว ให้อนุมัติคำขอด้วย `openclaw devices list` / `openclaw devices approve <requestId>`

### `clawbot`

namespace นามแฝงแบบ legacy ปัจจุบันรองรับ `openclaw clawbot qr` ซึ่งแมปไปยัง [`openclaw qr`](/th/cli/qr)

### `hooks`

จัดการ hooks ภายในของ agent

คำสั่งย่อย:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (นามแฝงที่เลิกใช้แล้วสำหรับ `openclaw plugins install`)
- `hooks update [id]` (นามแฝงที่เลิกใช้แล้วสำหรับ `openclaw plugins update`)

ตัวเลือกทั่วไป:

- `--json`
- `--eligible`
- `-v`, `--verbose`

หมายเหตุ:

- hooks ที่จัดการโดย plugin ไม่สามารถเปิดหรือปิดผ่าน `openclaw hooks` ได้; ให้เปิดหรือปิด plugin เจ้าของแทน
- `hooks install` และ `hooks update` ยังใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะแสดงคำเตือนการเลิกใช้และส่งต่อไปยังคำสั่ง plugin

### `webhooks`

ตัวช่วย Webhook พื้นผิวในตัวปัจจุบันคือการตั้งค่า + ตัวรัน Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

การตั้งค่า + ตัวรัน hook ของ Gmail Pub/Sub ดู [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

คำสั่งย่อย:

- `webhooks gmail setup` (ต้องใช้ `--account <email>`; รองรับ `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (แทนที่ค่า runtime สำหรับแฟล็กชุดเดียวกัน)

หมายเหตุ:

- `setup` จะกำหนดค่า Gmail watch พร้อมพาธ push ฝั่ง OpenClaw
- `run` จะเริ่มตัวเฝ้าดู/ลูปต่ออายุ Gmail ในเครื่อง พร้อมการแทนที่ค่า runtime ที่เป็นทางเลือก

### `dns`

ตัวช่วย DNS สำหรับการค้นพบแบบ wide-area (CoreDNS + Tailscale) พื้นผิวในตัวปัจจุบัน:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

ตัวช่วย DNS สำหรับการค้นพบแบบ wide-area (CoreDNS + Tailscale) ดู [/gateway/discovery](/th/gateway/discovery)

ตัวเลือก:

- `--domain <domain>`
- `--apply`: ติดตั้ง/อัปเดต config ของ CoreDNS (ต้องใช้ sudo; เฉพาะ macOS)

หมายเหตุ:

- หากไม่มี `--apply` นี่คือตัวช่วยวางแผนที่พิมพ์ config DNS ที่แนะนำสำหรับ OpenClaw + Tailscale
- ปัจจุบัน `--apply` รองรับเฉพาะ macOS ที่ใช้ Homebrew CoreDNS

## การรับส่งข้อความ + agent

### `message`

การรับส่งข้อความขาออกแบบรวมศูนย์ + การดำเนินการของ channel

ดู: [/cli/message](/th/cli/message)

คำสั่งย่อย:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

ตัวอย่าง:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

รันหนึ่งรอบของ agent ผ่าน Gateway (หรือแบบฝังด้วย `--local`)

ต้องส่งตัวเลือกตัวระบุเซสชันอย่างน้อยหนึ่งรายการ: `--to`, `--session-id` หรือ `--agent`

จำเป็น:

- `-m, --message <text>`

ตัวเลือก:

- `-t, --to <dest>` (สำหรับ session key และการส่งต่อแบบทางเลือก)
- `--session-id <id>`
- `--agent <id>` (id ของ agent; แทนที่ routing bindings)
- `--thinking <level>` (ตรวจสอบกับโปรไฟล์ provider ของโมเดลที่เลือก)
- `--verbose <on|off>`
- `--channel <channel>` (channel สำหรับการส่ง; หากไม่ระบุจะใช้ channel หลักของเซสชัน)
- `--reply-to <target>` (แทนที่เป้าหมายการส่งตอบกลับ แยกจากการกำหนดเส้นทางของเซสชัน)
- `--reply-channel <channel>` (แทนที่ channel สำหรับการส่งตอบกลับ)
- `--reply-account <id>` (แทนที่ id บัญชีสำหรับการส่งตอบกลับ)
- `--local` (รันแบบฝัง; ยัง preload รีจิสทรี plugin ก่อนเหมือนเดิม)
- `--deliver`
- `--json`
- `--timeout <seconds>`

หมายเหตุ:

- โหมด Gateway จะย้อนกลับไปใช้ agent แบบฝังเมื่อคำขอ Gateway ล้มเหลว
- `--local` ยังคง preload รีจิสทรี plugin ดังนั้น provider, เครื่องมือ และ channels ที่ plugin จัดเตรียมไว้ยังคงใช้งานได้ระหว่างการรันแบบฝัง
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งตอบกลับ ไม่ใช่การกำหนดเส้นทาง

### `agents`

จัดการ agents แบบแยกขาด (workspaces + auth + routing)

การรัน `openclaw agents` โดยไม่มีคำสั่งย่อย เทียบเท่ากับ `openclaw agents list`

#### `agents list`

แสดงรายการ agents ที่กำหนดค่าไว้

ตัวเลือก:

- `--json`
- `--bindings`

#### `agents add [name]`

เพิ่ม agent แบบแยกใหม่หนึ่งรายการ จะรันวิซาร์ดแบบมีคำแนะนำ เว้นแต่จะส่งแฟล็ก (หรือ `--non-interactive`) มา; ในโหมดไม่โต้ตอบต้องระบุ `--workspace`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--non-interactive`
- `--json`

สเปก binding ใช้รูปแบบ `channel[:accountId]` เมื่อไม่ระบุ `accountId`, OpenClaw อาจ resolve ขอบเขตบัญชีผ่านค่าเริ่มต้นของ channel/Plugin hooks; มิฉะนั้นจะเป็นการผูก channel โดยไม่มีขอบเขตบัญชีอย่างชัดเจน
การส่งแฟล็ก add แบบชัดเจนใด ๆ จะเปลี่ยนคำสั่งนี้เป็นเส้นทางไม่โต้ตอบ `main` เป็นชื่อที่สงวนไว้และไม่สามารถใช้เป็น id ของ agent ใหม่ได้

#### `agents bindings`

แสดงรายการ routing bindings

ตัวเลือก:

- `--agent <id>`
- `--json`

#### `agents bind`

เพิ่ม routing bindings ให้กับ agent

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ agent ค่าเริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--json`

#### `agents unbind`

ลบ routing bindings ของ agent

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ agent ค่าเริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--all`
- `--json`

ให้ใช้ `--all` หรือ `--bind` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งคู่

#### `agents delete <id>`

ลบ agent และล้าง workspace + state ของมัน

ตัวเลือก:

- `--force`
- `--json`

หมายเหตุ:

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` ต้องมีการยืนยันแบบโต้ตอบ

#### `agents set-identity`

อัปเดตตัวตนของ agent (name/theme/emoji/avatar)

ตัวเลือก:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

หมายเหตุ:

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือก agent เป้าหมาย
- เมื่อไม่มีการระบุฟิลด์ตัวตนแบบชัดเจน คำสั่งจะอ่าน `IDENTITY.md`

### `acp`

รันบริดจ์ ACP ที่เชื่อม IDE เข้ากับ Gateway

ตัวเลือกระดับราก:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

ไคลเอนต์ ACP แบบโต้ตอบสำหรับการดีบักบริดจ์

ตัวเลือก:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

ดู [`acp`](/th/cli/acp) สำหรับพฤติกรรมเต็มรูปแบบ หมายเหตุด้านความปลอดภัย และตัวอย่าง

### `mcp`

จัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้ และเปิดเผย channels ของ OpenClaw ผ่าน MCP stdio

#### `mcp serve`

เปิดเผยบทสนทนา channel ของ OpenClaw ที่กำหนดเส้นทางแล้วผ่าน MCP stdio

ตัวเลือก:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

แสดงรายการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้

ตัวเลือก:

- `--json`

#### `mcp show [name]`

แสดงนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้หนึ่งรายการ หรือออบเจ็กต์เซิร์ฟเวอร์ MCP ที่บันทึกไว้ทั้งหมด

ตัวเลือก:

- `--json`

#### `mcp set <name> <value>`

บันทึกนิยามเซิร์ฟเวอร์ MCP หนึ่งรายการจากออบเจ็กต์ JSON

#### `mcp unset <name>`

ลบนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้หนึ่งรายการ

### `approvals`

จัดการการอนุมัติ exec นามแฝง: `exec-approvals`

#### `approvals get`

ดึง snapshot ของการอนุมัติ exec และนโยบายที่มีผล

ตัวเลือก:

- `--node <node>`
- `--gateway`
- `--json`
- ตัวเลือก node RPC จาก `openclaw nodes`

#### `approvals set`

แทนที่การอนุมัติ exec ด้วย JSON จากไฟล์หรือ stdin

ตัวเลือก:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- ตัวเลือก node RPC จาก `openclaw nodes`

#### `approvals allowlist add|remove`

แก้ไข allowlist สำหรับ exec แยกตาม agent

ตัวเลือก:

- `--node <node>`
- `--gateway`
- `--agent <id>` (ค่าเริ่มต้น `*`)
- `--json`
- ตัวเลือก node RPC จาก `openclaw nodes`

### `status`

แสดงสุขภาพของเซสชันที่เชื่อมโยงและผู้รับล่าสุด

ตัวเลือก:

- `--json`
- `--all` (การวินิจฉัยเต็มรูปแบบ; อ่านอย่างเดียว, วางต่อได้)
- `--deep` (ขอ health probe แบบสดจาก gateway รวมถึง channel probes เมื่อรองรับ)
- `--usage` (แสดงการใช้งาน/โควตาของผู้ให้บริการโมเดล)
- `--timeout <ms>`
- `--verbose`
- `--debug` (นามแฝงของ `--verbose`)

หมายเหตุ:

- ภาพรวมรวมสถานะบริการ Gateway + node host เมื่อมี
- `--usage` จะแสดงหน้าต่างการใช้งานของ provider ที่ถูกปรับให้อยู่ในรูปแบบ `เหลือ X%`

### การติดตามการใช้งาน

OpenClaw สามารถแสดงการใช้งาน/โควตาของ provider ได้เมื่อมีข้อมูลรับรอง OAuth/API

พื้นผิว:

- `/status` (เพิ่มบรรทัดการใช้งาน provider แบบสั้นเมื่อมี)
- `openclaw status --usage` (พิมพ์รายละเอียดการใช้งาน provider แบบเต็ม)
- แถบเมนู macOS (ส่วน Usage ภายใต้ Context)

หมายเหตุ:

- ข้อมูลมาจาก endpoint การใช้งานของ provider โดยตรง (ไม่มีการประมาณค่า)
- เอาต์พุตที่มนุษย์อ่านได้จะถูกทำให้เป็นมาตรฐานในรูปแบบ `เหลือ X%` ข้าม provider
- providers ที่มีหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุเกี่ยวกับ MiniMax: ค่า `usage_percent` / `usagePercent` แบบดิบหมายถึงโควตาที่เหลืออยู่ ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล; ฟิลด์แบบนับจำนวนจะมีความสำคัญกว่าหากมีอยู่ การตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model, อนุมานป้ายกำกับหน้าต่างจากการประทับเวลาเมื่อจำเป็น และรวมชื่อโมเดลไว้ในป้ายกำกับแผน
- การยืนยันตัวตนสำหรับ usage มาจาก hooks เฉพาะ provider เมื่อมี; มิฉะนั้น OpenClaw จะย้อนกลับไปจับคู่ข้อมูลรับรอง OAuth/API-key จากโปรไฟล์ auth, env หรือ config หาก resolve ไม่ได้เลย usage จะถูกซ่อน
- รายละเอียด: ดู [การติดตามการใช้งาน](/th/concepts/usage-tracking)

### `health`

ดึงข้อมูลสุขภาพจาก Gateway ที่กำลังทำงานอยู่

ตัวเลือก:

- `--json`
- `--timeout <ms>`
- `--verbose` (บังคับ probe แบบสดและพิมพ์รายละเอียดการเชื่อมต่อ gateway)
- `--debug` (นามแฝงของ `--verbose`)

หมายเหตุ:

- `health` แบบค่าเริ่มต้นอาจส่งกลับ snapshot ของ gateway ที่แคชไว้ใหม่ล่าสุด
- `health --verbose` จะบังคับ probe แบบสดและขยายเอาต์พุตที่มนุษย์อ่านได้ให้ครอบคลุมทุกบัญชีและ agent ที่กำหนดค่าไว้

### `sessions`

แสดงรายการเซสชันบทสนทนาที่จัดเก็บไว้

ตัวเลือก:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (กรองเซสชันตาม agent)
- `--all-agents` (แสดงเซสชันข้ามทุก agent)

คำสั่งย่อย:

- `sessions cleanup` — ลบเซสชันที่หมดอายุหรือไม่มีเจ้าของแล้ว

หมายเหตุ:

- `sessions cleanup` ยังรองรับ `--fix-missing` เพื่อกำจัดรายการที่ไฟล์ transcript ของมันหายไป

## รีเซ็ต / ถอนการติดตั้ง

### `reset`

รีเซ็ต config/state ในเครื่อง (ยังคงติดตั้ง CLI ไว้)

ตัวเลือก:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

หมายเหตุ:

- `--non-interactive` ต้องใช้ร่วมกับ `--scope` และ `--yes`

### `uninstall`

ถอนการติดตั้งบริการ gateway + ข้อมูลในเครื่อง (CLI ยังคงอยู่)

ตัวเลือก:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

หมายเหตุ:

- `--non-interactive` ต้องใช้ `--yes` และขอบเขตที่ระบุอย่างชัดเจน (หรือ `--all`)
- `--all` จะลบบริการ, state, workspace และแอปพร้อมกัน

### `tasks`

แสดงรายการและจัดการการรัน[งานเบื้องหลัง](/th/automation/tasks)ข้าม agents

- `tasks list` — แสดงการรันงานที่กำลังทำงานอยู่และล่าสุด
- `tasks show <id>` — แสดงรายละเอียดของการรันงานเฉพาะรายการ
- `tasks notify <id>` — เปลี่ยนนโยบายการแจ้งเตือนสำหรับการรันงาน
- `tasks cancel <id>` — ยกเลิกงานที่กำลังทำงานอยู่
- `tasks audit` — แสดงปัญหาด้านการปฏิบัติการ (ค้าง, สูญหาย, ส่งไม่สำเร็จ)
- `tasks maintenance [--apply] [--json]` — แสดงตัวอย่างหรือปรับใช้การล้างข้อมูล/การกระทบยอดของ tasks และ TaskFlow (เซสชันลูกของ ACP/subagent, งาน Cron ที่กำลังทำงาน, การรัน CLI แบบสด)
- `tasks flow list` — แสดงรายการโฟลว์ TaskFlow ที่กำลังทำงานอยู่และล่าสุด
- `tasks flow show <lookup>` — ตรวจสอบโฟลว์ตาม id หรือ lookup key
- `tasks flow cancel <lookup>` — ยกเลิกโฟลว์ที่กำลังทำงานอยู่และ tasks ที่ยังทำงานอยู่ของมัน

### `flows`

ชอร์ตคัตเอกสารแบบ legacy คำสั่ง flow อยู่ภายใต้ `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

รัน WebSocket Gateway

ตัวเลือก:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (รีเซ็ต config + credentials + sessions + workspace ของ dev)
- `--force` (ปิดตัว listener ที่มีอยู่บนพอร์ตนั้น)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (นามแฝงของ `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

จัดการบริการ Gateway (launchd/systemd/schtasks)

คำสั่งย่อย:

- `gateway status` (probe Gateway RPC ตามค่าเริ่มต้น)
- `gateway install` (ติดตั้งบริการ)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

หมายเหตุ:

- `gateway status` จะ probe Gateway RPC ตามค่าเริ่มต้นโดยใช้พอร์ต/config ที่ resolve แล้วของบริการ (แทนที่ได้ด้วย `--url/--token/--password`)
- `gateway status` รองรับ `--no-probe`, `--deep`, `--require-rpc` และ `--json` สำหรับการทำสคริปต์
- `gateway status` ยังแสดงบริการ gateway แบบ legacy หรือเพิ่มเติมเมื่อสามารถตรวจพบได้ (`--deep` จะเพิ่มการสแกนระดับระบบ) บริการ OpenClaw ที่ตั้งชื่อตามโปรไฟล์จะถือเป็นบริการชั้นหนึ่งและจะไม่ถูกทำเครื่องหมายว่าเป็น “extra”
- `gateway status` ยังใช้งานได้สำหรับการวินิจฉัยแม้ config ของ CLI ในเครื่องจะหายไปหรือไม่ถูกต้อง
- `gateway status` จะพิมพ์พาธไฟล์บันทึกที่ resolve แล้ว, snapshot ของพาธ config/ความถูกต้องของ CLI เทียบกับ service และ URL เป้าหมาย probe ที่ resolve แล้ว
- หาก gateway auth SecretRefs ยัง resolve ไม่ได้ในเส้นทางคำสั่งปัจจุบัน `gateway status --json` จะรายงาน `rpc.authWarning` เฉพาะเมื่อการเชื่อมต่อ/auth ของ probe ล้มเหลวเท่านั้น (คำเตือนจะถูกระงับเมื่อ probe สำเร็จ)
- บนการติดตั้ง systemd ของ Linux การตรวจสอบความคลาดเคลื่อนของโทเค็นใน status จะรวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` ของยูนิต
- `gateway install|uninstall|start|stop|restart` รองรับ `--json` สำหรับการทำสคริปต์ (เอาต์พุตค่าเริ่มต้นยังคงเป็นมิตรกับมนุษย์)
- `gateway install` ใช้ runtime แบบ Node เป็นค่าเริ่มต้น; ไม่แนะนำ bun **อย่างยิ่ง** (มีบั๊กกับ WhatsApp/Telegram)
- ตัวเลือกของ `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`

### `daemon`

นามแฝงแบบ legacy สำหรับคำสั่งจัดการบริการ Gateway ดู [/cli/daemon](/th/cli/daemon)

คำสั่งย่อย:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

ตัวเลือกทั่วไป:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

ติดตามไฟล์บันทึก Gateway ผ่าน RPC

ตัวเลือก:

- `--limit <n>`: จำนวนบรรทัดบันทึกสูงสุดที่จะส่งกลับ
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์บันทึก
- `--follow`: ติดตามไฟล์บันทึก (สไตล์ tail -f)
- `--interval <ms>`: ช่วงเวลาการโพลเป็นมิลลิวินาทีเมื่อกำลังติดตาม
- `--local-time`: แสดงการประทับเวลาเป็นเวลาท้องถิ่น
- `--json`: ส่งออก JSON แบบคั่นด้วยบรรทัด
- `--plain`: ปิดการจัดรูปแบบแบบมีโครงสร้าง
- `--no-color`: ปิดใช้งานสี ANSI
- `--url <url>`: URL WebSocket ของ Gateway แบบชัดเจน
- `--token <token>`: โทเค็นของ Gateway
- `--timeout <ms>`: หมดเวลา RPC ของ Gateway
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อจำเป็น

ตัวอย่าง:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

หมายเหตุ:

- หากคุณส่ง `--url` CLI จะไม่ใช้ข้อมูลรับรองจาก config หรือ environment โดยอัตโนมัติ
- ความล้มเหลวของการจับคู่ local loopback จะย้อนกลับไปใช้ไฟล์บันทึกในเครื่องที่กำหนดค่าไว้; เป้าหมาย `--url` แบบชัดเจนจะไม่ทำเช่นนั้น

### `gateway <subcommand>`

ตัวช่วย CLI ของ Gateway (ใช้ `--url`, `--token`, `--password`, `--timeout`, `--expect-final` สำหรับคำสั่งย่อย RPC)
เมื่อคุณส่ง `--url` CLI จะไม่ใช้ข้อมูลรับรองจาก config หรือ environment โดยอัตโนมัติ
ให้ระบุ `--token` หรือ `--password` อย่างชัดเจน หากไม่มีข้อมูลรับรองแบบชัดเจนจะถือเป็นข้อผิดพลาด

คำสั่งย่อย:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

หมายเหตุ:

- `gateway status --deep` จะเพิ่มการสแกนบริการระดับระบบ ใช้ `gateway probe`,
  `health --verbose` หรือ `status --deep` ระดับบนสุดเพื่อดูรายละเอียด probe ของ runtime ที่ลึกกว่า

RPC ทั่วไป:

- `config.schema.lookup` (ตรวจสอบ subtree ของ config หนึ่งจุดด้วยโหนด schema แบบตื้น ข้อมูลเมตา hint ที่จับคู่ และสรุปลูกโดยตรง)
- `config.get` (อ่าน snapshot ของ config ปัจจุบัน + hash)
- `config.set` (ตรวจสอบ + เขียน config ทั้งหมด; ใช้ `baseHash` สำหรับ optimistic concurrency)
- `config.apply` (ตรวจสอบ + เขียน config + รีสตาร์ท + ปลุก)
- `config.patch` (ผสานการอัปเดตบางส่วน + รีสตาร์ท + ปลุก)
- `update.run` (รันการอัปเดต + รีสตาร์ท + ปลุก)

เคล็ดลับ: เมื่อเรียก `config.set`/`config.apply`/`config.patch` โดยตรง ให้ส่ง `baseHash` จาก
`config.get` หากมี config อยู่แล้ว
เคล็ดลับ: สำหรับการแก้ไขบางส่วน ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และเลือกใช้ `config.patch`
เคล็ดลับ: RPC สำหรับการเขียน config เหล่านี้จะ preflight การ resolve SecretRef ที่ใช้งานอยู่สำหรับ refs ในเพย์โหลด config ที่ส่งมา และจะปฏิเสธการเขียนเมื่อ submitted ref ที่มีผลใช้งานจริงยัง resolve ไม่ได้
เคล็ดลับ: เครื่องมือ runtime `gateway` ที่ใช้ได้เฉพาะเจ้าของยังคงปฏิเสธการเขียนทับ `tools.exec.ask` หรือ `tools.exec.security`; นามแฝงแบบ legacy `tools.bash.*` จะถูกปรับให้เป็นเส้นทาง exec ที่ป้องกันเดียวกัน

## Models

ดู [/concepts/models](/th/concepts/models) สำหรับพฤติกรรม fallback และกลยุทธ์การสแกน

หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p`
ได้รับการอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ สำหรับ
งาน production ให้เลือกใช้ Anthropic API key หรือผู้ให้บริการแบบ
subscription ที่รองรับรายอื่น เช่น OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan หรือ Z.AI / GLM Coding Plan

Anthropic setup-token ยังคงพร้อมใช้งานในฐานะเส้นทาง token-auth ที่รองรับ แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

### `models` (ราก)

`openclaw models` เป็นนามแฝงของ `models status`

ตัวเลือกระดับราก:

- `--status-json` (นามแฝงของ `models status --json`)
- `--status-plain` (นามแฝงของ `models status --plain`)

### `models list`

ตัวเลือก:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

`--all` จะรวมแถวแค็ตตาล็อกแบบคงที่ที่ provider เป็นเจ้าของซึ่งมากับระบบไว้ก่อนการกำหนดค่า auth
แถวต่าง ๆ จะยังไม่พร้อมใช้งานจนกว่าจะมีข้อมูลรับรองของ provider ที่ตรงกัน

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (ออกด้วย 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์ auth ที่กำหนดค่าไว้)
- `--probe-provider <name>`
- `--probe-profile <id>` (ใช้ซ้ำหรือคั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

จะรวมภาพรวม auth และสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ใน auth store เสมอ
`--probe` จะรันคำขอแบบสด (อาจใช้โทเค็นและชนข้อจำกัดอัตรา)
แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลรับรองใน env หรือ `models.json`
คาดว่าจะพบสถานะ probe เช่น `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` และ `no_model`
เมื่อ `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ รายงาน probe จะ
แสดง `excluded_by_auth_order` แทนการลองใช้โปรไฟล์นั้นแบบเงียบ ๆ

### `models set <model>`

ตั้งค่า `agents.defaults.model.primary`

### `models set-image <model>`

ตั้งค่า `agents.defaults.imageModel.primary`

### `models aliases list|add|remove`

ตัวเลือก:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

ตัวเลือก:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

ตัวเลือก:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

ตัวเลือก:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

ตัวเลือก:

- `add`: ตัวช่วย auth แบบโต้ตอบ (โฟลว์ auth ของ provider หรือการวางโทเค็น)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: โฟลว์ล็อกอิน OAuth ของ GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

หมายเหตุ:

- `setup-token` และ `paste-token` เป็นคำสั่งโทเค็นแบบทั่วไปสำหรับ providers ที่เปิดเผยวิธี auth แบบโทเค็น
- `setup-token` ต้องใช้ TTY แบบโต้ตอบ และจะรันวิธี token-auth ของ provider
- `paste-token` จะถามค่าของโทเค็น และใช้ค่าเริ่มต้นเป็น id โปรไฟล์ auth `<provider>:manual` เมื่อไม่ระบุ `--profile-id`
- Anthropic `setup-token` / `paste-token` ยังคงใช้งานได้ในฐานะเส้นทางโทเค็นของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

## System

### `system event`

จัดคิวเหตุการณ์ระบบและเลือกทริกเกอร์ Heartbeat ได้ (Gateway RPC)

จำเป็น:

- `--text <text>`

ตัวเลือก:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

ตัวควบคุม Heartbeat (Gateway RPC)

ตัวเลือก:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

แสดงรายการ system presence entries (Gateway RPC)

ตัวเลือก:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

จัดการงานตามกำหนดเวลา (Gateway RPC) ดู [/automation/cron-jobs](/th/automation/cron-jobs)

คำสั่งย่อย:

- `cron status [--json]`
- `cron list [--all] [--json]` (เอาต์พุตเป็นตารางตามค่าเริ่มต้น; ใช้ `--json` สำหรับข้อมูลดิบ)
- `cron add` (นามแฝง: `create`; ต้องมี `--name` และต้องมีอย่างใดอย่างหนึ่งใน `--at` | `--every` | `--cron` เท่านั้น และต้องมีเพย์โหลดอย่างใดอย่างหนึ่งใน `--system-event` | `--message` เท่านั้น)
- `cron edit <id>` (แพตช์ฟิลด์)
- `cron rm <id>` (นามแฝง: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

คำสั่ง `cron` ทั้งหมดรองรับ `--url`, `--token`, `--timeout`, `--expect-final`

`cron add|edit --model ...` จะใช้โมเดลที่อนุญาตซึ่งเลือกไว้นั้นสำหรับงาน หาก
โมเดลไม่ได้รับอนุญาต Cron จะเตือนและย้อนกลับไปใช้การเลือกโมเดลค่าเริ่มต้นของ
agent/งานแทน ห่วงโซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การแทนที่
โมเดลแบบธรรมดาที่ไม่มีรายการ fallback ต่อ-งานอย่างชัดเจน จะไม่ผนวก
primary ของ agent เป็นเป้าหมาย retry แบบซ่อนเพิ่มเติมอีกต่อไป

## โฮสต์ Node

### `node`

`node` รัน **โฮสต์ node แบบ headless** หรือจัดการมันเป็นบริการเบื้องหลัง ดู
[`openclaw node`](/th/cli/node)

คำสั่งย่อย:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

หมายเหตุเกี่ยวกับ auth:

- `node` จะ resolve auth ของ gateway จาก env/config (ไม่มีแฟล็ก `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้น `gateway.auth.*` ในโหมด local โฮสต์ node จะตั้งใจไม่ใช้ `gateway.remote.*`; ใน `gateway.mode=remote`, `gateway.remote.*` จะมีส่วนร่วมตามกฎลำดับความสำคัญของ remote
- การ resolve auth ของโฮสต์ node จะใช้เฉพาะตัวแปร env `OPENCLAW_GATEWAY_*`

## Nodes

`nodes` สื่อสารกับ Gateway และกำหนดเป้าหมายไปยัง nodes ที่จับคู่ไว้ ดู [/nodes](/th/nodes)

ตัวเลือกทั่วไป:

- `--url`, `--token`, `--timeout`, `--json`

คำสั่งย่อย:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (เฉพาะ mac)

กล้อง:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + หน้าจอ:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

ตำแหน่งที่ตั้ง:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## เบราว์เซอร์

CLI สำหรับควบคุมเบราว์เซอร์ (Chrome/Brave/Edge/Chromium แบบเฉพาะ) ดู [`openclaw browser`](/th/cli/browser) และ[เครื่องมือเบราว์เซอร์](/th/tools/browser)

ตัวเลือกทั่วไป:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

จัดการ:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

ตรวจสอบ:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

การดำเนินการ:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Voice call

### `voicecall`

ยูทิลิตี voice call ที่จัดเตรียมโดย plugin จะปรากฏเฉพาะเมื่อมีการติดตั้งและเปิดใช้งาน plugin voice-call แล้ว ดู [`openclaw voicecall`](/th/cli/voicecall)

คำสั่งทั่วไป:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## การค้นหาเอกสาร

### `docs`

ค้นหาในดัชนีเอกสาร OpenClaw แบบสด

### `docs [query...]`

ค้นหาในดัชนีเอกสารสด

## TUI

### `tui`

เปิด UI บนเทอร์มินัลที่เชื่อมต่อกับ Gateway

ตัวเลือก:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (ค่าเริ่มต้นคือ `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
