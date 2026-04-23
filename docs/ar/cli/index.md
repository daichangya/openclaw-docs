---
read_when:
    - إضافة أو تعديل أوامر CLI أو الخيارات
    - توثيق أسطح الأوامر الجديدة
summary: مرجع OpenClaw CLI لأوامر `openclaw` والأوامر الفرعية والخيارات
title: مرجع CLI
x-i18n:
    generated_at: "2026-04-23T07:22:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e5d3de831331307203ac6f67a3f4b4c969c4ccc10e813ebab1e052b87f0426b
    source_path: cli/index.md
    workflow: 15
---

# مرجع CLI

تصف هذه الصفحة سلوك CLI الحالي. إذا تغيرت الأوامر، فحدّث هذا المستند.

## صفحات الأوامر

- [`setup`](/ar/cli/setup)
- [`onboard`](/ar/cli/onboard)
- [`configure`](/ar/cli/configure)
- [`config`](/ar/cli/config)
- [`completion`](/ar/cli/completion)
- [`doctor`](/ar/cli/doctor)
- [`dashboard`](/ar/cli/dashboard)
- [`backup`](/ar/cli/backup)
- [`reset`](/ar/cli/reset)
- [`uninstall`](/ar/cli/uninstall)
- [`update`](/ar/cli/update)
- [`message`](/ar/cli/message)
- [`agent`](/ar/cli/agent)
- [`agents`](/ar/cli/agents)
- [`acp`](/ar/cli/acp)
- [`mcp`](/ar/cli/mcp)
- [`status`](/ar/cli/status)
- [`health`](/ar/cli/health)
- [`sessions`](/ar/cli/sessions)
- [`gateway`](/ar/cli/gateway)
- [`logs`](/ar/cli/logs)
- [`system`](/ar/cli/system)
- [`models`](/ar/cli/models)
- [`infer`](/ar/cli/infer)
- [`memory`](/ar/cli/memory)
- [`wiki`](/ar/cli/wiki)
- [`directory`](/ar/cli/directory)
- [`nodes`](/ar/cli/nodes)
- [`devices`](/ar/cli/devices)
- [`node`](/ar/cli/node)
- [`approvals`](/ar/cli/approvals)
- [`sandbox`](/ar/cli/sandbox)
- [`tui`](/ar/cli/tui)
- [`browser`](/ar/cli/browser)
- [`cron`](/ar/cli/cron)
- [`tasks`](/ar/cli/tasks)
- [`flows`](/ar/cli/flows)
- [`dns`](/ar/cli/dns)
- [`docs`](/ar/cli/docs)
- [`hooks`](/ar/cli/hooks)
- [`webhooks`](/ar/cli/webhooks)
- [`pairing`](/ar/cli/pairing)
- [`qr`](/ar/cli/qr)
- [`plugins`](/ar/cli/plugins) (أوامر Plugin)
- [`channels`](/ar/cli/channels)
- [`security`](/ar/cli/security)
- [`secrets`](/ar/cli/secrets)
- [`skills`](/ar/cli/skills)
- [`daemon`](/ar/cli/daemon) (اسم مستعار قديم لأوامر خدمة Gateway)
- [`clawbot`](/ar/cli/clawbot) (مساحة اسم مستعارة قديمة)
- [`voicecall`](/ar/cli/voicecall) (Plugin؛ إذا كان مثبتًا)

## الإشارات العامة

- `--dev`: يعزل الحالة تحت `~/.openclaw-dev` ويغيّر المنافذ الافتراضية.
- `--profile <name>`: يعزل الحالة تحت `~/.openclaw-<name>`.
- `--container <name>`: يستهدف حاوية مسماة للتنفيذ.
- `--no-color`: يعطل ألوان ANSI.
- `--update`: اختصار لـ `openclaw update` (للتثبيتات من المصدر فقط).
- `-V`, `--version`, `-v`: يطبع الإصدار ثم يخرج.

## تنسيق المخرجات

- لا تُعرض ألوان ANSI ومؤشرات التقدم إلا في جلسات TTY.
- تُعرض الروابط التشعبية OSC-8 كروابط قابلة للنقر في الطرفيات المدعومة؛ وإلا نعود إلى عناوين URL عادية.
- يؤدي `--json` (و`--plain` حيثما كان مدعومًا) إلى تعطيل التنسيق للحصول على مخرجات نظيفة.
- يعطل `--no-color` تنسيق ANSI؛ كما يتم احترام `NO_COLOR=1`.
- تعرض الأوامر طويلة التشغيل مؤشر تقدم (OSC 9;4 عند الدعم).

## لوحة الألوان

يستخدم OpenClaw لوحة ألوان lobster لمخرجات CLI.

- `accent` (#FF5A2D): العناوين، والتسميات، والإبرازات الأساسية.
- `accentBright` (#FF7A3D): أسماء الأوامر، والتأكيد.
- `accentDim` (#D14A22): نصوص الإبراز الثانوية.
- `info` (#FF8A5B): القيم المعلوماتية.
- `success` (#2FBF71): حالات النجاح.
- `warn` (#FFB020): التحذيرات، والتراجعات، والتنبيهات.
- `error` (#E23D2D): الأخطاء، والإخفاقات.
- `muted` (#8B7F77): تقليل التركيز، والبيانات الوصفية.

المصدر المرجعي للوحة: `src/terminal/palette.ts` ("لوحة lobster").

## شجرة الأوامر

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
  infer (اسم مستعار: capability)
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

ملاحظة: يمكن أن تضيف Plugins أوامر إضافية في المستوى الأعلى (مثل `openclaw voicecall`).

## الأمان

- `openclaw security audit` — يدقق التهيئة + الحالة المحلية بحثًا عن أشهر الأخطاء الأمنية.
- `openclaw security audit --deep` — فحص Gateway مباشر بأفضل جهد.
- `openclaw security audit --fix` — يشدّد القيم الافتراضية الآمنة وأذونات الحالة/التهيئة.

## الأسرار

### `secrets`

إدارة SecretRef والنظافة المرتبطة بالتشغيل/التهيئة.

الأوامر الفرعية:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

خيارات `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

خيارات `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

خيارات `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

خيارات `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

ملاحظات:

- `reload` هو Gateway RPC ويحتفظ بآخر لقطة تشغيل سليمة معروفة عندما يفشل التحليل.
- يعيد `audit --check` قيمة غير صفرية عند وجود نتائج؛ وتستخدم المراجع غير المحلولة قيمة خروج غير صفرية ذات أولوية أعلى.
- يتم تخطي فحوصات exec التجريبية افتراضيًا؛ استخدم `--allow-exec` لتفعيلها.

## Plugins

إدارة Plugins وتهيئتها:

- `openclaw plugins list` — يكتشف Plugins (استخدم `--json` للمخرجات الآلية).
- `openclaw plugins inspect <id>` — يعرض تفاصيل Plugin (`info` اسم مستعار).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — يثبت Plugin (أو يضيف مسار Plugin إلى `plugins.load.paths`؛ استخدم `--force` للكتابة فوق هدف تثبيت موجود).
- `openclaw plugins marketplace list <marketplace>` — يسرد إدخالات marketplace قبل التثبيت.
- `openclaw plugins enable <id>` / `disable <id>` — يبدّل `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — يبلغ عن أخطاء تحميل Plugin.

تتطلب معظم تغييرات Plugin إعادة تشغيل gateway. راجع [/plugin](/ar/tools/plugin).

## Memory

بحث متجهي عبر `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — يعرض إحصاءات الفهرس؛ استخدم `--deep` لفحوصات جاهزية المتجهات والتضمين أو `--fix` لإصلاح عناصر recall/promotion القديمة.
- `openclaw memory index` — يعيد فهرسة ملفات memory.
- `openclaw memory search "<query>"` (أو `--query "<query>"`) — بحث دلالي عبر memory.
- `openclaw memory promote` — يرتب عناصر الاستدعاء قصيرة الأجل ويمكنه اختياريًا إلحاق أفضل الإدخالات إلى `MEMORY.md`.

## Sandbox

إدارة بيئات sandbox للتنفيذ المعزول للوكلاء. راجع [/cli/sandbox](/ar/cli/sandbox).

الأوامر الفرعية:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

ملاحظات:

- يزيل `sandbox recreate` بيئات التشغيل الحالية بحيث تعيد عملية الاستخدام التالية تهيئتها باستخدام التهيئة الحالية.
- بالنسبة إلى الخلفيات `ssh` وOpenShell `remote`، يؤدي recreate إلى حذف مساحة العمل البعيدة القياسية للنطاق المحدد.

## أوامر الشرطة المائلة في الدردشة

تدعم رسائل الدردشة أوامر `/...` (نصية وأصلية). راجع [/tools/slash-commands](/ar/tools/slash-commands).

أبرزها:

- `/status` لتشخيصات سريعة.
- `/trace` لأسطر تتبع/تصحيح Plugin على مستوى الجلسة.
- `/config` لتغييرات التهيئة المحفوظة.
- `/debug` لتجاوزات التهيئة الخاصة بالتشغيل فقط (في الذاكرة، وليس على القرص؛ وتتطلب `commands.debug: true`).

## الإعداد + الانضمام الأولي

### `completion`

يولد سكربتات إكمال shell ويمكنه اختياريًا تثبيتها في ملف shell الشخصي.

الخيارات:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

ملاحظات:

- من دون `--install` أو `--write-state`، يطبع `completion` السكربت إلى stdout.
- يكتب `--install` كتلة `OpenClaw Completion` في ملف shell الشخصي ويوجهها إلى السكربت المخزن مؤقتًا ضمن دليل حالة OpenClaw.

### `setup`

يهيئ التهيئة + مساحة العمل.

الخيارات:

- `--workspace <dir>`: مسار مساحة عمل الوكيل (الافتراضي `~/.openclaw/workspace`).
- `--wizard`: تشغيل الانضمام الأولي.
- `--non-interactive`: تشغيل الانضمام الأولي من دون مطالبات.
- `--mode <local|remote>`: وضع الانضمام الأولي.
- `--remote-url <url>`: عنوان URL لـ Gateway البعيد.
- `--remote-token <token>`: token الخاص بـ Gateway البعيد.

يعمل الانضمام الأولي تلقائيًا عند وجود أي إشارات خاصة به (`--non-interactive` أو `--mode` أو `--remote-url` أو `--remote-token`).

### `onboard`

انضمام أولي تفاعلي لـ gateway ومساحة العمل وSkills.

الخيارات:

- `--workspace <dir>`
- `--reset` (إعادة تعيين التهيئة + بيانات الاعتماد + الجلسات قبل الانضمام الأولي)
- `--reset-scope <config|config+creds+sessions|full>` (الافتراضي `config+creds+sessions`؛ استخدم `full` لإزالة مساحة العمل أيضًا)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` اسم مستعار لـ `advanced`)
- `--auth-choice <choice>` حيث تكون قيمة `<choice>` واحدة من:
  `chutes`، `deepseek-api-key`، `openai-codex`، `openai-api-key`،
  `openrouter-api-key`، `kilocode-api-key`، `litellm-api-key`، `ai-gateway-api-key`،
  `cloudflare-ai-gateway-api-key`، `moonshot-api-key`، `moonshot-api-key-cn`،
  `kimi-code-api-key`، `synthetic-api-key`، `venice-api-key`، `together-api-key`،
  `huggingface-api-key`، `apiKey`، `gemini-api-key`، `google-gemini-cli`، `zai-api-key`،
  `zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`، `xiaomi-api-key`،
  `minimax-global-oauth`، `minimax-global-api`، `minimax-cn-oauth`، `minimax-cn-api`،
  `opencode-zen`، `opencode-go`، `github-copilot`، `copilot-proxy`، `xai-api-key`،
  `mistral-api-key`، `volcengine-api-key`، `byteplus-api-key`، `qianfan-api-key`،
  `qwen-standard-api-key-cn`، `qwen-standard-api-key`، `qwen-api-key-cn`، `qwen-api-key`،
  `modelstudio-standard-api-key-cn`، `modelstudio-standard-api-key`،
  `modelstudio-api-key-cn`، `modelstudio-api-key`، `custom-api-key`، `skip`
- ملاحظة Qwen: تمثل `qwen-*` عائلة `auth-choice` الأساسية. وتظل معرّفات
  `modelstudio-*` مقبولة كأسماء مستعارة قديمة للتوافق فقط.
- `--secret-input-mode <plaintext|ref>` (الافتراضي `plaintext`؛ استخدم `ref` لتخزين مراجع env الافتراضية للمزوّد بدلًا من المفاتيح النصية الصريحة)
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
- `--custom-base-url <url>` (غير تفاعلي؛ يُستخدم مع `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (غير تفاعلي؛ يُستخدم مع `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (غير تفاعلي؛ اختياري؛ يُستخدم مع `--auth-choice custom-api-key`؛ ويعود إلى `CUSTOM_API_KEY` عند عدم توفيره)
- `--custom-provider-id <id>` (غير تفاعلي؛ معرّف مزود مخصص اختياري)
- `--custom-compatibility <openai|anthropic>` (غير تفاعلي؛ اختياري؛ الافتراضي `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (غير تفاعلي؛ يخزّن `gateway.auth.token` كـ env SecretRef؛ ويتطلب أن يكون متغير البيئة هذا مضبوطًا؛ ولا يمكن دمجه مع `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (اسم مستعار: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (مدير Node الخاص بالإعداد/الانضمام الأولي من أجل Skills؛ يُوصى بـ pnpm، كما أن bun مدعوم أيضًا)
- `--json`

### `configure`

معالج تهيئة تفاعلي (النماذج، والقنوات، وSkills، وGateway).

الخيارات:

- `--section <section>` (قابل للتكرار؛ يقيّد المعالج بأقسام محددة)

### `config`

أدوات مساعدة غير تفاعلية للتهيئة (`get`/`set`/`unset`/`file`/`schema`/`validate`). يؤدي تشغيل `openclaw config` دون
أمر فرعي إلى تشغيل المعالج.

الأوامر الفرعية:

- `config get <path>`: يطبع قيمة تهيئة (مسار dot/bracket).
- `config set`: يدعم أربعة أوضاع للإسناد:
  - وضع القيمة: `config set <path> <value>` (تحليل JSON5 أو سلسلة)
  - وضع منشئ SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - وضع منشئ المزوّد: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - وضع الدفعة: `config set --batch-json '<json>'` أو `config set --batch-file <path>`
- `config set --dry-run`: يتحقق من صحة الإسنادات دون الكتابة إلى `openclaw.json` (يتم تخطي فحوصات exec SecretRef افتراضيًا).
- `config set --allow-exec --dry-run`: تفعيل اختياري لفحوصات dry-run الخاصة بـ exec SecretRef (قد ينفذ أوامر المزوّد).
- `config set --dry-run --json`: يصدر مخرجات dry-run قابلة للقراءة آليًا (الفحوصات + إشارة الاكتمال، والعمليات، والمراجع التي تم فحصها/تخطيها، والأخطاء).
- `config set --strict-json`: يفرض تحليل JSON5 لإدخال path/value. ويظل `--json` اسمًا مستعارًا قديمًا للتحليل الصارم خارج وضع مخرجات dry-run.
- `config unset <path>`: يزيل قيمة.
- `config file`: يطبع مسار ملف التهيئة النشط.
- `config schema`: يطبع JSON schema المولدة لـ `openclaw.json`، بما في ذلك بيانات `title` / `description` الوصفية الموثقة للحقول والمنقولة عبر فروع الكائنات المتداخلة، وwildcard، وعناصر المصفوفات، وفروع التركيب، بالإضافة إلى بيانات وصفية حية بأفضل جهد لـ schema الخاصة بالقنوات/Plugin.
- `config validate`: يتحقق من صحة التهيئة الحالية مقابل schema من دون بدء gateway.
- `config validate --json`: يصدر مخرجات JSON قابلة للقراءة آليًا.

### `doctor`

فحوصات السلامة + إصلاحات سريعة (التهيئة + Gateway + الخدمات القديمة).

الخيارات:

- `--no-workspace-suggestions`: يعطل تلميحات memory الخاصة بمساحة العمل.
- `--yes`: يقبل القيم الافتراضية من دون مطالبة (بدون واجهة).
- `--non-interactive`: يتخطى المطالبات؛ ويطبق الترحيلات الآمنة فقط.
- `--deep`: يفحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية.
- `--repair` (اسم مستعار: `--fix`): يحاول إجراء إصلاحات تلقائية للمشكلات المكتشفة.
- `--force`: يفرض الإصلاحات حتى عندما لا تكون مطلوبة بدقة.
- `--generate-gateway-token`: يولّد token جديدًا لمصادقة gateway.

### `dashboard`

يفتح واجهة Control UI باستخدام token الحالي لديك.

الخيارات:

- `--no-open`: يطبع عنوان URL لكنه لا يشغّل متصفحًا

ملاحظات:

- بالنسبة إلى tokens الخاصة بـ gateway المُدارة عبر SecretRef، يطبع `dashboard` أو يفتح عنوان URL غير مضمّن فيه token بدلًا من كشف السر في مخرجات الطرفية أو وسائط تشغيل المتصفح.

### `update`

يحدّث CLI المثبّت.

خيارات الجذر:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

الأوامر الفرعية:

- `update status`
- `update wizard`

خيارات `update status`:

- `--json`
- `--timeout <seconds>`

خيارات `update wizard`:

- `--timeout <seconds>`

ملاحظات:

- يعيد `openclaw --update` الكتابة إلى `openclaw update`.

### `backup`

ينشئ ويتحقق من أرشيفات نسخ احتياطي محلية لحالة OpenClaw.

الأوامر الفرعية:

- `backup create`
- `backup verify <archive>`

خيارات `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

خيارات `backup verify <archive>`:

- `--json`

## أدوات مساعدة للقنوات

### `channels`

إدارة حسابات قنوات الدردشة (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Microsoft Teams).

الأوامر الفرعية:

- `channels list`: يعرض القنوات المهيأة وملفات تعريف المصادقة.
- `channels status`: يتحقق من إمكانية الوصول إلى gateway وسلامة القنوات (يشغّل `--probe` فحوصات probe/audit مباشرة لكل حساب عندما يكون gateway قابلاً للوصول؛ وإذا لم يكن كذلك، يعود إلى ملخصات القنوات المبنية على التهيئة فقط. استخدم `openclaw health` أو `openclaw status --deep` لفحوصات أوسع لسلامة gateway).
- نصيحة: يطبع `channels status` تحذيرات مع إصلاحات مقترحة عندما يتمكن من اكتشاف أخطاء تهيئة شائعة (ثم يوجّهك إلى `openclaw doctor`).
- `channels logs`: يعرض أحدث سجلات القنوات من ملف سجل gateway.
- `channels add`: إعداد بأسلوب المعالج عندما لا يتم تمرير أي إشارات؛ وتحوّل الإشارات الوضع إلى غير تفاعلي.
  - عند إضافة حساب غير افتراضي إلى قناة لا تزال تستخدم تهيئة أحادية الحساب في المستوى الأعلى، يقوم OpenClaw بترقية القيم ذات النطاق الخاص بالحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix الحفاظ بدلًا من ذلك على هدف مسمى/افتراضي موجود ومطابق.
  - لا يقوم `channels add` غير التفاعلي بإنشاء/ترقية bindings تلقائيًا؛ وتستمر bindings الخاصة بالقناة فقط في مطابقة الحساب الافتراضي.
- `channels remove`: يعطّل افتراضيًا؛ مرّر `--delete` لإزالة إدخالات التهيئة من دون مطالبات.
- `channels login`: تسجيل دخول تفاعلي للقناة (WhatsApp Web فقط).
- `channels logout`: تسجيل الخروج من جلسة قناة (إن كان ذلك مدعومًا).

الخيارات الشائعة:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: معرّف حساب القناة (الافتراضي `default`)
- `--name <label>`: اسم عرض للحساب

خيارات `channels login`:

- `--channel <channel>` (الافتراضي `whatsapp`؛ ويدعم `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

خيارات `channels logout`:

- `--channel <channel>` (الافتراضي `whatsapp`)
- `--account <id>`

خيارات `channels list`:

- `--no-usage`: يتخطى لقطات استخدام/حصص مزود النموذج (للمدعوم عبر OAuth/API فقط).
- `--json`: يخرج JSON (يتضمن الاستخدام ما لم يتم ضبط `--no-usage`).

خيارات `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

خيارات `channels capabilities`:

- `--channel <name>`
- `--account <id>` (فقط مع `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

خيارات `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

خيارات `channels logs`:

- `--channel <name|all>` (الافتراضي `all`)
- `--lines <n>` (الافتراضي `200`)
- `--json`

ملاحظات:

- يدعم `channels login` الخيار `--verbose`.
- ينطبق `channels capabilities --account` فقط عند ضبط `--channel`.
- يمكن أن يعرض `channels status --probe` حالة النقل بالإضافة إلى نتائج probe/audit مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`، حسب دعم القناة.

مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)

أمثلة:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

البحث عن معرّفات الذات والأنداد والمجموعات للقنوات التي توفر سطح directory. راجع [`openclaw directory`](/ar/cli/directory).

الخيارات الشائعة:

- `--channel <name>`
- `--account <id>`
- `--json`

الأوامر الفرعية:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

عرض Skills المتاحة وفحصها بالإضافة إلى معلومات الجاهزية.

الأوامر الفرعية:

- `skills search [query...]`: البحث في Skills الموجودة على ClawHub.
- `skills search --limit <n> --json`: يحدد عدد نتائج البحث أو يخرج مخرجات قابلة للقراءة آليًا.
- `skills install <slug>`: يثبت Skill من ClawHub في مساحة العمل النشطة.
- `skills install <slug> --version <version>`: يثبت إصدارًا محددًا من ClawHub.
- `skills install <slug> --force`: يكتب فوق مجلد Skill موجود في مساحة العمل.
- `skills update <slug|--all>`: يحدّث Skills المتتبعة من ClawHub.
- `skills list`: يسرد Skills (الافتراضي عند عدم وجود أمر فرعي).
- `skills list --json`: يخرج جرد Skills قابلًا للقراءة آليًا إلى stdout.
- `skills list --verbose`: يتضمن المتطلبات المفقودة في الجدول.
- `skills info <name>`: يعرض تفاصيل Skill واحدة.
- `skills info <name> --json`: يخرج التفاصيل القابلة للقراءة آليًا إلى stdout.
- `skills check`: ملخص للمتطلبات الجاهزة مقابل المفقودة.
- `skills check --json`: يخرج مخرجات الجاهزية القابلة للقراءة آليًا إلى stdout.

الخيارات:

- `--eligible`: يعرض فقط Skills الجاهزة.
- `--json`: يخرج JSON (من دون تنسيق).
- `-v`, `--verbose`: يتضمن تفاصيل المتطلبات المفقودة.

نصيحة: استخدم `openclaw skills search` و`openclaw skills install` و`openclaw skills update` للـ Skills المدعومة من ClawHub.

### `pairing`

الموافقة على طلبات إقران الرسائل المباشرة عبر القنوات.

الأوامر الفرعية:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

ملاحظات:

- إذا كانت هناك قناة واحدة فقط مهيأة تدعم الإقران، فيُسمح أيضًا باستخدام `pairing approve <code>`.
- يدعم كل من `list` و`approve` الخيار `--account <id>` للقنوات متعددة الحسابات.

### `devices`

إدارة إدخالات إقران أجهزة gateway وtokens الأجهزة لكل دور.

الأوامر الفرعية:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

ملاحظات:

- يمكن لكل من `devices list` و`devices approve` الرجوع إلى ملفات الإقران المحلية على local loopback عندما لا يكون نطاق الإقران المباشر متاحًا.
- يتطلب `devices approve` معرّف طلب صريحًا قبل إصدار tokens؛ ويؤدي حذف `requestId` أو تمرير `--latest` إلى معاينة أحدث طلب معلّق فقط.
- تعيد عمليات إعادة الاتصال باستخدام tokens المخزنة استخدام النطاقات المعتمدة المخزنة مؤقتًا الخاصة بـ token؛ ويقوم
  `devices rotate --scope ...` الصريح بتحديث مجموعة النطاقات المخزنة هذه لعمليات
  إعادة الاتصال المستقبلية باستخدام token المخزن مؤقتًا.
- يعيد كل من `devices rotate` و`devices revoke` حمولات JSON.

### `qr`

يولّد رمز QR للإقران عبر الهاتف المحمول ورمز إعداد من تهيئة Gateway الحالية. راجع [`openclaw qr`](/ar/cli/qr).

الخيارات:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

ملاحظات:

- `--token` و`--password` متنافيان.
- يحمل رمز الإعداد token تمهيد قصير العمر، وليس token/كلمة مرور gateway المشتركة.
- يبقي تسليم التمهيد المدمج token العقدة الأساسية عند `scopes: []`.
- يظل أي token تمهيد تشغيلي تم تسليمه مقيّدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`.
- تكون فحوصات نطاق التمهيد مسبوقة بالدور، بحيث لا تُلبّي قائمة السماح الخاصة بالمشغّل إلا طلبات المشغّل؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاص.
- يمكن لـ `--remote` استخدام `gateway.remote.url` أو عنوان URL النشط لـ Tailscale Serve/Funnel.
- بعد المسح، وافق على الطلب باستخدام `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

مساحة اسم مستعارة قديمة. تدعم حاليًا `openclaw clawbot qr`، والتي تُطابق [`openclaw qr`](/ar/cli/qr).

### `hooks`

إدارة hooks الوكيل الداخلية.

الأوامر الفرعية:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (اسم مستعار قديم لـ `openclaw plugins install`)
- `hooks update [id]` (اسم مستعار قديم لـ `openclaw plugins update`)

الخيارات الشائعة:

- `--json`
- `--eligible`
- `-v`, `--verbose`

ملاحظات:

- لا يمكن تمكين أو تعطيل hooks المُدارة بواسطة Plugin عبر `openclaw hooks`؛ بل يجب تمكين أو تعطيل Plugin المالكة بدلًا من ذلك.
- لا يزال `hooks install` و`hooks update` يعملان كأسماء مستعارة للتوافق، لكنهما يطبعان تحذيرات إهمال ثم يوجهان إلى أوامر Plugin.

### `webhooks`

أدوات Webhook المساعدة. السطح المدمج الحالي هو إعداد + تشغيل Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

إعداد + تشغيل hook الخاصة بـ Gmail Pub/Sub. راجع [Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration).

الأوامر الفرعية:

- `webhooks gmail setup` (يتطلب `--account <email>`؛ ويدعم `--project` و`--topic` و`--subscription` و`--label` و`--hook-url` و`--hook-token` و`--push-token` و`--bind` و`--port` و`--path` و`--include-body` و`--max-bytes` و`--renew-minutes` و`--tailscale` و`--tailscale-path` و`--tailscale-target` و`--push-endpoint` و`--json`)
- `webhooks gmail run` (تجاوزات وقت التشغيل للإشارات نفسها)

ملاحظات:

- يقوم `setup` بتهيئة مراقبة Gmail بالإضافة إلى مسار push المواجه لـ OpenClaw.
- يبدأ `run` مراقب Gmail المحلي/حلقة التجديد مع تجاوزات وقت تشغيل اختيارية.

### `dns`

أدوات DNS المساعدة للاكتشاف على نطاق واسع (CoreDNS + Tailscale). السطح المدمج الحالي:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

أداة DNS مساعدة للاكتشاف على نطاق واسع (CoreDNS + Tailscale). راجع [/gateway/discovery](/ar/gateway/discovery).

الخيارات:

- `--domain <domain>`
- `--apply`: يثبت/يحدّث تهيئة CoreDNS (يتطلب sudo؛ على macOS فقط).

ملاحظات:

- من دون `--apply`، تكون هذه أداة تخطيط تطبع تهيئة DNS الموصى بها لـ OpenClaw + Tailscale.
- يدعم `--apply` حاليًا macOS مع Homebrew CoreDNS فقط.

## المراسلة + الوكيل

### `message`

مراسلة صادرة موحدة + إجراءات القنوات.

راجع: [/cli/message](/ar/cli/message)

الأوامر الفرعية:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

أمثلة:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

يشغّل دور وكيل واحد عبر Gateway (أو مدمجًا باستخدام `--local`).

مرّر محدد جلسة واحدًا على الأقل: `--to` أو `--session-id` أو `--agent`.

مطلوب:

- `-m, --message <text>`

الخيارات:

- `-t, --to <dest>` (لمفتاح الجلسة والتسليم الاختياري)
- `--session-id <id>`
- `--agent <id>` (معرّف الوكيل؛ يتجاوز bindings الخاصة بالتوجيه)
- `--thinking <level>` (يتم التحقق منه مقابل ملف تعريف مزود النموذج المحدد)
- `--verbose <on|off>`
- `--channel <channel>` (قناة التسليم؛ احذفها لاستخدام قناة الجلسة الرئيسية)
- `--reply-to <target>` (تجاوز هدف التسليم، منفصل عن توجيه الجلسة)
- `--reply-channel <channel>` (تجاوز قناة التسليم)
- `--reply-account <id>` (تجاوز معرّف حساب التسليم)
- `--local` (تشغيل مدمج؛ يظل سجل Plugin محمّلًا مسبقًا أولًا)
- `--deliver`
- `--json`
- `--timeout <seconds>`

ملاحظات:

- يعود وضع Gateway إلى الوكيل المدمج عندما يفشل طلب Gateway.
- لا يزال `--local` يحمّل سجل Plugin مسبقًا، لذلك تبقى المزوّدات والأدوات والقنوات التي توفرها Plugins متاحة أثناء التشغيل المدمج.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، وليس في التوجيه.

### `agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه).

يعادل تشغيل `openclaw agents` دون أمر فرعي `openclaw agents list`.

#### `agents list`

يسرد الوكلاء المهيئين.

الخيارات:

- `--json`
- `--bindings`

#### `agents add [name]`

يضيف وكيلًا معزولًا جديدًا. يشغّل المعالج الإرشادي ما لم يتم تمرير إشارات (أو `--non-interactive`)؛ ويكون `--workspace` مطلوبًا في الوضع غير التفاعلي.

الخيارات:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--non-interactive`
- `--json`

تستخدم مواصفات الربط الصيغة `channel[:accountId]`. وعندما يتم حذف `accountId`، قد يحل OpenClaw نطاق الحساب عبر القيم الافتراضية للقناة/خطافات Plugin؛ وإلا يكون الربط ربط قناة من دون نطاق حساب صريح.
يحوّل تمرير أي إشارات إضافة صريحة الأمر إلى المسار غير التفاعلي. ويُعد `main` اسمًا محجوزًا ولا يمكن استخدامه كمعرّف للوكيل الجديد.

#### `agents bindings`

يسرد bindings الخاصة بالتوجيه.

الخيارات:

- `--agent <id>`
- `--json`

#### `agents bind`

إضافة bindings للتوجيه لوكيل.

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

#### `agents unbind`

إزالة bindings التوجيه لوكيل.

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--all`
- `--json`

استخدم إما `--all` أو `--bind`، وليس كليهما.

#### `agents delete <id>`

يحذف وكيلًا ويقلّم مساحة عمله + حالته.

الخيارات:

- `--force`
- `--json`

ملاحظات:

- لا يمكن حذف `main`.
- بدون `--force`، يكون التأكيد التفاعلي مطلوبًا.

#### `agents set-identity`

يحدّث هوية وكيل (الاسم/السمة/emoji/الصورة الرمزية).

الخيارات:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

ملاحظات:

- يمكن استخدام `--agent` أو `--workspace` لاختيار الوكيل المستهدف.
- عند عدم توفير أي حقول هوية صريحة، يقرأ الأمر `IDENTITY.md`.

### `acp`

يشغّل جسر ACP الذي يربط IDEs مع Gateway.

خيارات الجذر:

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

عميل ACP تفاعلي لتصحيح الجسر.

الخيارات:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

راجع [`acp`](/ar/cli/acp) لمعرفة السلوك الكامل، والملاحظات الأمنية، والأمثلة.

### `mcp`

إدارة تعريفات خوادم MCP المحفوظة وكشف قنوات OpenClaw عبر MCP stdio.

#### `mcp serve`

كشف محادثات قنوات OpenClaw الموجّهة عبر MCP stdio.

الخيارات:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

يسرد تعريفات خوادم MCP المحفوظة.

الخيارات:

- `--json`

#### `mcp show [name]`

يعرض تعريف خادم MCP محفوظًا واحدًا أو كائن خادم MCP المحفوظ بالكامل.

الخيارات:

- `--json`

#### `mcp set <name> <value>`

يحفظ تعريف خادم MCP واحدًا من كائن JSON.

#### `mcp unset <name>`

يزيل تعريف خادم MCP محفوظًا واحدًا.

### `approvals`

إدارة موافقات exec. الاسم المستعار: `exec-approvals`.

#### `approvals get`

يجلب لقطة موافقات exec والسياسة الفعالة.

الخيارات:

- `--node <node>`
- `--gateway`
- `--json`
- خيارات node RPC من `openclaw nodes`

#### `approvals set`

يستبدل موافقات exec باستخدام JSON من ملف أو stdin.

الخيارات:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- خيارات node RPC من `openclaw nodes`

#### `approvals allowlist add|remove`

يعدّل قائمة السماح الخاصة بـ exec لكل وكيل.

الخيارات:

- `--node <node>`
- `--gateway`
- `--agent <id>` (الافتراضي `*`)
- `--json`
- خيارات node RPC من `openclaw nodes`

### `status`

يعرض سلامة الجلسة المرتبطة وأحدث المستلمين.

الخيارات:

- `--json`
- `--all` (تشخيص كامل؛ للقراءة فقط، وقابل للمشاركة)
- `--deep` (يطلب من gateway فحص سلامة مباشر، بما في ذلك فحوصات القنوات عندما تكون مدعومة)
- `--usage` (يعرض استخدام/حصة مزود النموذج)
- `--timeout <ms>`
- `--verbose`
- `--debug` (اسم مستعار لـ `--verbose`)

ملاحظات:

- تتضمن النظرة العامة حالة خدمة مضيف Gateway + Node عند التوفر.
- يطبع `--usage` نوافذ استخدام المزوّد المطبّعة بصيغة `X% left`.

### تتبع الاستخدام

يمكن لـ OpenClaw عرض استخدام/حصة المزوّد عندما تتوفر بيانات اعتماد OAuth/API.

الأسطح:

- `/status` (يضيف سطرًا قصيرًا لاستخدام المزوّد عند التوفر)
- `openclaw status --usage` (يطبع تفصيل المزوّد الكامل)
- شريط القوائم في macOS (قسم Usage ضمن Context)

ملاحظات:

- تأتي البيانات مباشرة من نقاط نهاية استخدام المزوّد (من دون تقديرات).
- تُطبَّع المخرجات المقروءة بشريًا إلى `X% left` عبر جميع المزوّدين.
- المزوّدون الذين لديهم نوافذ استخدام حالية: Anthropic وGitHub Copilot وGemini CLI وOpenAI Codex وMiniMax وXiaomi وz.ai.
- ملاحظة MiniMax: تعني القيم الخام `usage_percent` / `usagePercent` الحصة المتبقية، لذلك يقوم OpenClaw بعكسها قبل العرض؛ لكن الحقول القائمة على العدّ تظل متقدمة عند وجودها. وتفضّل استجابات `model_remains` إدخال نموذج الدردشة، وتشتق تسمية النافذة من الطوابع الزمنية عند الحاجة، وتضمّن اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام من الخطافات الخاصة بالمزوّد عند التوفر؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key من ملفات تعريف المصادقة، أو env، أو التهيئة. وإذا لم يتم حل أي منها، يُخفى الاستخدام.
- التفاصيل: راجع [تتبع الاستخدام](/ar/concepts/usage-tracking).

### `health`

جلب بيانات السلامة من Gateway الجاري تشغيله.

الخيارات:

- `--json`
- `--timeout <ms>`
- `--verbose` (يفرض probe مباشرًا ويطبع تفاصيل اتصال gateway)
- `--debug` (اسم مستعار لـ `--verbose`)

ملاحظات:

- يمكن لـ `health` الافتراضي أن يعيد لقطة gateway مخزنة مؤقتًا وحديثة.
- يفرض `health --verbose` probe مباشرًا ويوسّع المخرجات المقروءة بشريًا عبر جميع الحسابات والوكلاء المهيئين.

### `sessions`

يسرد جلسات المحادثات المخزنة.

الخيارات:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (تصفية الجلسات حسب الوكيل)
- `--all-agents` (عرض الجلسات عبر جميع الوكلاء)

الأوامر الفرعية:

- `sessions cleanup` — إزالة الجلسات المنتهية أو اليتيمة

ملاحظات:

- يدعم `sessions cleanup` أيضًا `--fix-missing` لتقليم الإدخالات التي اختفت ملفات transcript الخاصة بها.

## إعادة التعيين / إلغاء التثبيت

### `reset`

يعيد تعيين التهيئة/الحالة المحلية (مع الإبقاء على CLI مثبتًا).

الخيارات:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

ملاحظات:

- يتطلب `--non-interactive` كلاً من `--scope` و`--yes`.

### `uninstall`

يلغي تثبيت خدمة gateway + البيانات المحلية (مع بقاء CLI).

الخيارات:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

ملاحظات:

- يتطلب `--non-interactive` وجود `--yes` ونطاقات صريحة (أو `--all`).
- يزيل `--all` الخدمة والحالة ومساحة العمل والتطبيق معًا.

### `tasks`

يسرد ويدير تشغيلات [المهام الخلفية](/ar/automation/tasks) عبر الوكلاء.

- `tasks list` — عرض تشغيلات المهام النشطة والحديثة
- `tasks show <id>` — عرض تفاصيل تشغيل مهمة محدد
- `tasks notify <id>` — تغيير سياسة الإشعارات لتشغيل مهمة
- `tasks cancel <id>` — إلغاء مهمة قيد التشغيل
- `tasks audit` — إظهار المشكلات التشغيلية (القديمة، والمفقودة، وإخفاقات التسليم)
- `tasks maintenance [--apply] [--json]` — معاينة أو تطبيق تنظيف/تسوية المهام وTaskFlow (جلسات ACP/الوكلاء الفرعيين التابعة، ووظائف Cron النشطة، وتشغيلات CLI الحية)
- `tasks flow list` — سرد تدفقات Task Flow النشطة والحديثة
- `tasks flow show <lookup>` — فحص تدفق حسب المعرّف أو مفتاح lookup
- `tasks flow cancel <lookup>` — إلغاء تدفق قيد التشغيل ومهامه النشطة

### `flows`

اختصار قديم في الوثائق. توجد أوامر Flow تحت `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

يشغّل WebSocket Gateway.

الخيارات:

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
- `--reset` (إعادة تعيين تهيئة dev + بيانات الاعتماد + الجلسات + مساحة العمل)
- `--force` (قتل المستمع الموجود على المنفذ)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (اسم مستعار لـ `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

إدارة خدمة Gateway (`launchd`/`systemd`/`schtasks`).

الأوامر الفرعية:

- `gateway status` (يفحص Gateway RPC افتراضيًا)
- `gateway install` (تثبيت الخدمة)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

ملاحظات:

- يفحص `gateway status` Gateway RPC افتراضيًا باستخدام المنفذ/التهيئة المحلولين الخاصة بالخدمة (يمكن التجاوز باستخدام `--url/--token/--password`).
- يدعم `gateway status` الخيارات `--no-probe` و`--deep` و`--require-rpc` و`--json` لكتابة السكربتات.
- يعرض `gateway status` أيضًا خدمات gateway القديمة أو الإضافية عندما يتمكن من اكتشافها (ويضيف `--deep` عمليات فحص على مستوى النظام). وتُعامل خدمات OpenClaw المسماة بملف تعريف كخدمات من الدرجة الأولى ولا توضع عليها علامة "إضافية".
- يظل `gateway status` متاحًا للتشخيص حتى عندما تكون تهيئة CLI المحلية مفقودة أو غير صالحة.
- يطبع `gateway status` مسار سجل الملف المحلول، ولقطة مسارات/صلاحية تهيئة CLI مقابل الخدمة، وعنوان URL المحلول لهدف probe.
- إذا كانت gateway auth SecretRefs غير محلولة في مسار الأمر الحالي، فإن `gateway status --json` يبلغ عن `rpc.authWarning` فقط عندما يفشل اتصال probe/المصادقة (وتُخفى التحذيرات عندما ينجح probe).
- في عمليات تثبيت Linux systemd، تتضمن فحوصات انجراف token في الحالة كلاً من مصادر الوحدة `Environment=` و`EnvironmentFile=`.
- تدعم `gateway install|uninstall|start|stop|restart` الخيار `--json` لكتابة السكربتات (بينما تظل المخرجات الافتراضية سهلة القراءة للبشر).
- تكون القيمة الافتراضية لـ `gateway install` هي runtime الخاص بـ Node؛ أما bun فهو **غير موصى به** (أخطاء WhatsApp/Telegram).
- خيارات `gateway install`: `--port` و`--runtime` و`--token` و`--force` و`--json`.

### `daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway. راجع [/cli/daemon](/ar/cli/daemon).

الأوامر الفرعية:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

الخيارات الشائعة:

- `status`: `--url` و`--token` و`--password` و`--timeout` و`--no-probe` و`--require-rpc` و`--deep` و`--json`
- `install`: `--port` و`--runtime <node|bun>` و`--token` و`--force` و`--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

يتابع سجلات ملفات Gateway عبر RPC.

الخيارات:

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المطلوب إرجاعها
- `--max-bytes <n>`: الحد الأقصى للبايتات المقروءة من ملف السجل
- `--follow`: متابعة ملف السجل (بأسلوب `tail -f`)
- `--interval <ms>`: فترة الاستطلاع بالمللي ثانية عند المتابعة
- `--local-time`: عرض الطوابع الزمنية بالتوقيت المحلي
- `--json`: إخراج JSON مفصولًا بأسطر
- `--plain`: تعطيل التنسيق المنظم
- `--no-color`: تعطيل ألوان ANSI
- `--url <url>`: عنوان URL صريح لـ Gateway WebSocket
- `--token <token>`: token الخاص بـ Gateway
- `--timeout <ms>`: مهلة Gateway RPC
- `--expect-final`: الانتظار للحصول على استجابة نهائية عند الحاجة

أمثلة:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

ملاحظات:

- إذا مررت `--url`، فلن يطبق CLI تلقائيًا بيانات الاعتماد من التهيئة أو البيئة.
- تعود إخفاقات الإقران في local loopback إلى ملف السجل المحلي المهيأ؛ أما أهداف `--url` الصريحة فلا تفعل ذلك.

### `gateway <subcommand>`

أدوات CLI المساعدة الخاصة بـ Gateway (استخدم `--url` و`--token` و`--password` و`--timeout` و`--expect-final` للأوامر الفرعية الخاصة بـ RPC).
عند تمرير `--url`، لا يطبّق CLI تلقائيًا بيانات الاعتماد من التهيئة أو البيئة.
ضمّن `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

الأوامر الفرعية:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

ملاحظات:

- يضيف `gateway status --deep` فحصًا للخدمات على مستوى النظام. استخدم `gateway probe`،
  أو `health --verbose`، أو `status --deep` من المستوى الأعلى للحصول على تفاصيل أعمق حول probe أثناء التشغيل.

عمليات RPC الشائعة:

- `config.schema.lookup` (فحص شجرة فرعية واحدة من التهيئة بعقدة schema سطحية، وبيانات hints المطابقة، وملخصات العناصر الأبناء المباشرين)
- `config.get` (قراءة لقطة التهيئة الحالية + hash)
- `config.set` (التحقق + كتابة التهيئة الكاملة؛ استخدم `baseHash` للتزامن التفاؤلي)
- `config.apply` (التحقق + كتابة التهيئة + إعادة التشغيل + الإيقاظ)
- `config.patch` (دمج تحديث جزئي + إعادة التشغيل + الإيقاظ)
- `update.run` (تشغيل التحديث + إعادة التشغيل + الإيقاظ)

نصيحة: عند استدعاء `config.set`/`config.apply`/`config.patch` مباشرةً، مرّر `baseHash` من
`config.get` إذا كانت هناك تهيئة موجودة بالفعل.
نصيحة: للتعديلات الجزئية، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`.
نصيحة: تنفّذ عمليات RPC الخاصة بكتابة التهيئة هذه فحصًا مسبقًا لتحليل SecretRef النشطة للمراجع الموجودة في حمولة التهيئة المرسلة، وترفض الكتابة عندما يكون مرجع مُرسَل وفعّال فعليًا غير محلول.
نصيحة: لا تزال أداة التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` أو `tools.exec.security`؛ كما تُطبَّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

## النماذج

راجع [/concepts/models](/ar/concepts/models) لمعرفة سلوك fallback واستراتيجية الفحص.

ملاحظة Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وللإنتاج،
يُفضّل استخدام مفتاح Anthropic API أو مزود آخر مدعوم
قائم على الاشتراك مثل OpenAI Codex أو Alibaba Cloud Model Studio
Coding Plan أو MiniMax Coding Plan أو Z.AI / GLM Coding Plan.

لا يزال Anthropic setup-token متاحًا كمسار مصادقة مدعوم قائم على token، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.

### `models` (الجذر)

تُعد `openclaw models` اسمًا مستعارًا لـ `models status`.

خيارات الجذر:

- `--status-json` (اسم مستعار لـ `models status --json`)
- `--status-plain` (اسم مستعار لـ `models status --plain`)

### `models list`

الخيارات:

- `--all`
- `--local`
- `--provider <id>`
- `--json`
- `--plain`

يتضمن `--all` صفوف الكتالوج الثابتة المملوكة للمزوّد والمضمّنة قبل
تهيئة المصادقة. وتظل الصفوف غير متاحة حتى تتوفر بيانات اعتماد المزوّد المطابقة.

### `models status`

الخيارات:

- `--json`
- `--plain`
- `--check` (قيمة الخروج 1=منتهي/مفقود، 2=يوشك على الانتهاء)
- `--probe` (probe مباشر لملفات تعريف المصادقة المهيأة)
- `--probe-provider <name>`
- `--probe-profile <id>` (قابل للتكرار أو مفصول بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

يتضمن دائمًا نظرة عامة على المصادقة وحالة انتهاء OAuth لملفات التعريف الموجودة في مخزن المصادقة.
يشغّل `--probe` طلبات مباشرة (وقد يستهلك tokens ويؤدي إلى حدود معدل).
يمكن أن تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد env، أو `models.json`.
توقّع حالات probe مثل `ok` و`auth` و`rate_limit` و`billing` و`timeout`،
و`format` و`unknown` و`no_model`.
عندما يحذف `auth.order.<provider>` الصريح ملف تعريف مخزّن، يبلغ probe عن
`excluded_by_auth_order` بدلًا من تجربة ذلك الملف بصمت.

### `models set <model>`

يضبط `agents.defaults.model.primary`.

### `models set-image <model>`

يضبط `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

الخيارات:

- `list`: `--json`، `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

الخيارات:

- `list`: `--json`، `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

الخيارات:

- `list`: `--json`، `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

الخيارات:

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

الخيارات:

- `add`: أداة مصادقة تفاعلية مساعدة (تدفق مصادقة المزوّد أو لصق token)
- `login`: `--provider <name>`، `--method <method>`، `--set-default`
- `login-github-copilot`: تدفق تسجيل دخول GitHub Copilot OAuth (`--yes`)
- `setup-token`: `--provider <name>`، `--yes`
- `paste-token`: `--provider <name>`، `--profile-id <id>`، `--expires-in <duration>`

ملاحظات:

- `setup-token` و`paste-token` هما أمران عامّان للـ token للمزوّدين الذين يوفّرون طرق مصادقة عبر token.
- يتطلب `setup-token` TTY تفاعليًا ويشغّل طريقة المصادقة بالـ token الخاصة بالمزوّد.
- يطالب `paste-token` بقيمة token ويستخدم افتراضيًا معرّف ملف تعريف المصادقة `<provider>:manual` عند عدم تمرير `--profile-id`.
- يظل `setup-token` / `paste-token` الخاص بـ Anthropic متاحًا كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.

### `models auth order get|set|clear`

الخيارات:

- `get`: `--provider <name>`، `--agent <id>`، `--json`
- `set`: `--provider <name>`، `--agent <id>`، `<profileIds...>`
- `clear`: `--provider <name>`، `--agent <id>`

## النظام

### `system event`

يضع حدث نظام في قائمة الانتظار ويمكنه اختياريًا تشغيل Heartbeat (Gateway RPC).

مطلوب:

- `--text <text>`

الخيارات:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`، `--token`، `--timeout`، `--expect-final`

### `system heartbeat last|enable|disable`

عناصر التحكم في Heartbeat (Gateway RPC).

الخيارات:

- `--json`
- `--url`، `--token`، `--timeout`، `--expect-final`

### `system presence`

يسرد إدخالات حضور النظام (Gateway RPC).

الخيارات:

- `--json`
- `--url`، `--token`، `--timeout`، `--expect-final`

## Cron

إدارة الوظائف المجدولة (Gateway RPC). راجع [/automation/cron-jobs](/ar/automation/cron-jobs).

الأوامر الفرعية:

- `cron status [--json]`
- `cron list [--all] [--json]` (مخرجات جدول افتراضيًا؛ استخدم `--json` للحصول على المخرجات الخام)
- `cron add` (اسم مستعار: `create`؛ ويتطلب `--name` وواحدًا بالضبط من `--at` | `--every` | `--cron`، وحمولة واحدة بالضبط من `--system-event` | `--message`)
- `cron edit <id>` (تصحيح الحقول)
- `cron rm <id>` (الأسماء المستعارة: `remove`، `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

تقبل جميع أوامر `cron` الخيارات `--url` و`--token` و`--timeout` و`--expect-final`.

يستخدم `cron add|edit --model ...` ذلك النموذج المسموح المحدد للوظيفة. وإذا
لم يكن النموذج مسموحًا، يحذّر Cron ويعود إلى اختيار
نموذج الوكيل/الافتراضي الخاص بالوظيفة بدلًا من ذلك. ولا تزال سلاسل fallback
المهيأة سارية، لكن تجاوز النموذج العادي من دون قائمة fallback صريحة لكل وظيفة لم يعد
يضيف النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي مخفي.

## مضيف Node

### `node`

يشغّل `node` **مضيف Node بدون واجهة** أو يديره كخدمة في الخلفية. راجع
[`openclaw node`](/ar/cli/node).

الأوامر الفرعية:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

ملاحظات المصادقة:

- يحل `node` مصادقة gateway من env/التهيئة (من دون إشارات `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`، ثم `gateway.auth.*`. في الوضع المحلي، يتجاهل مضيف node عمدًا `gateway.remote.*`؛ وفي `gateway.mode=remote`، تشارك `gateway.remote.*` وفق قواعد أولوية الوضع البعيد.
- لا يحترم تحليل مصادقة مضيف Node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

## Nodes

يتحدث `nodes` إلى Gateway ويستهدف Nodes المقترنة. راجع [/nodes](/ar/nodes).

الخيارات الشائعة:

- `--url`، `--token`، `--timeout`، `--json`

الأوامر الفرعية:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (على mac فقط)

الكاميرا:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + الشاشة:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

الموقع:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI للتحكم في Browser (Chrome/Brave/Edge/Chromium مخصص). راجع [`openclaw browser`](/ar/cli/browser) و[أداة Browser](/ar/tools/browser).

الخيارات الشائعة:

- `--url`، `--token`، `--timeout`، `--expect-final`، `--json`
- `--browser-profile <name>`

الإدارة:

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

الفحص:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

الإجراءات:

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

## المكالمة الصوتية

### `voicecall`

أدوات المكالمات الصوتية التي يوفرها Plugin. لا تظهر إلا عندما يكون Plugin الخاص بالمكالمات الصوتية مثبتًا ومفعّلًا. راجع [`openclaw voicecall`](/ar/cli/voicecall).

الأوامر الشائعة:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## بحث الوثائق

### `docs`

ابحث في فهرس وثائق OpenClaw المباشر.

### `docs [query...]`

ابحث في فهرس الوثائق المباشر.

## TUI

### `tui`

افتح واجهة المستخدم الطرفية المتصلة بـ Gateway.

الخيارات:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (الافتراضي `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
