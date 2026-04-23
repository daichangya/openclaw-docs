---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批 UX
    - 审查沙箱逃逸提示及其影响
summary: 执行审批、允许列表和沙箱逃逸提示
title: 执行审批
x-i18n:
    generated_at: "2026-04-23T22:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4090e0726d9cee3372a11e6bf8f7899546e68f4fabea42dcb55b87593e9315c
    source_path: tools/exec-approvals.md
    workflow: 15
---

执行审批是 **配套应用 / 节点主机防护栏**，用于让处于沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。它是一种安全联锁机制：只有当策略 + 允许列表 +（可选的）用户审批全部同意时，命令才会被允许执行。执行审批会**叠加在**工具策略和 elevated 门控之上（除非 elevated 设为 `full`，此时会跳过审批）。

<Note>
生效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方；如果某个 approvals 字段被省略，则使用 `tools.exec` 的值。主机执行也会使用该机器上的本地 approvals 状态——如果 `~/.openclaw/exec-approvals.json` 中主机本地配置了 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，系统仍会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` —— 显示请求的策略、主机策略来源以及最终生效结果。
- `openclaw exec-policy show` —— 本地机器的合并视图。
- `openclaw exec-policy set|preset` —— 一步同时同步本地请求策略和本地主机 approvals 文件。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地 approvals 文件是真实来源。

如果配套应用 UI **不可用**，任何原本会触发提示的请求都会根据 **ask fallback** 处理（默认：拒绝）。

<Tip>
原生聊天审批客户端可以在待审批消息上预置特定渠道的交互方式。例如，Matrix 会预置反应快捷方式（`✅` 允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍保留消息中的 `/approve ...` 命令作为后备方式。
</Tip>

## 适用范围

执行审批会在执行主机本地强制生效：

- **gateway host** → Gateway 网关机器上的 `openclaw` 进程
- **node host** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到节点主机。
- 执行审批可降低意外执行风险，但它不是按用户划分的身份验证边界。
- 经批准的节点主机执行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该已绑定文件在审批后、执行前发生变化，则会拒绝执行，而不是运行已漂移的内容。
- 这种文件绑定有意设计为尽力而为，并不是对所有解释器 / 运行时加载路径的完整语义模型。如果审批模式无法识别并绑定**唯一一个**具体本地文件，它会拒绝签发基于审批的执行，而不是假装提供了完整覆盖。

macOS 拆分：

- **node host service** 会通过本地 IPC 将 `system.run` 转发给 **macOS app**。
- **macOS app** 负责强制执行审批并在 UI 上下文中执行命令。

## 设置与存储

审批信息保存在执行主机本地的 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例 schema：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 无审批 “YOLO” 模式

如果你希望主机执行在没有审批提示的情况下运行，就必须同时放开**两层**策略：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中的主机本地 approvals 策略

这现在是默认的主机行为，除非你显式收紧它：

- `tools.exec.security`: 在 `gateway`/`node` 上设为 `full`
- `tools.exec.ask`: `off`
- 主机 `askFallback`: `full`

重要区别：

- `tools.exec.host=auto` 用于选择执行运行位置：有沙箱时在沙箱中，否则在 gateway。
- YOLO 用于选择主机执行如何获批：`security=full` 加 `ask=off`。
- 暴露自身非交互权限模式的 CLI 后端 provider 可以遵循此策略。
  Claude CLI 会在 OpenClaw 请求的执行策略为 YOLO 时添加 `--permission-mode bypassPermissions`。你可以通过
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的显式 Claude 参数覆盖该后端行为，例如
  `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机执行策略之上，再额外添加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让来自沙箱隔离会话的 gateway 路由请求变成可随意覆盖的“免费通行证”。每次调用的 `host=node` 请求在 `auto` 下是允许的，而 `host=gateway` 只有在没有活动沙箱运行时时才允许从 `auto` 使用。如果你想要稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你希望采用更保守的设置，可将任一层重新收紧为 `allowlist` / `on-miss`
或 `deny`。

持久化 gateway host “永不提示” 配置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机 approvals 文件设为匹配值：

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

在当前机器上为相同 gateway host 策略提供的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅限本地使用。如果你需要远程更改 gateway host 或 node host 的审批，请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

对于节点主机，请在该节点上应用相同的 approvals 文件：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

重要的仅限本地限制：

- `openclaw exec-policy` 不会同步节点审批
- `openclaw exec-policy set --host node` 会被拒绝
- 节点执行审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅会话快捷方式：

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，也会跳过该会话的执行审批。

如果主机 approvals 文件仍比配置更严格，则仍以更严格的主机策略为准。

## 策略开关

### 安全级别（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许全部（等同于 elevated）。

### 询问方式（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当允许列表未匹配时提示。
- **always**：每条命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### 询问后备（`askFallback`）

如果需要提示但没有可达 UI，则由 fallback 决定：

- **deny**：阻止。
- **allowlist**：仅当允许列表匹配时允许。
- **full**：允许。

### 行内解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 会将行内代码 eval 形式视为“仅可通过审批执行”，即使解释器二进制本身已经在允许列表中。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对无法干净映射到单一稳定文件操作数的解释器加载路径所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体区分）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式是**不区分大小写的 glob 匹配**。
模式应解析为**二进制路径**（仅文件名的条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令，仍然要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 身份识别的稳定 UUID（可选）
- **last used**：上次使用时间戳
- **last used command**：上次使用的命令
- **last resolved path**：上次解析到的路径

## 自动允许 Skill CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无头节点主机）上被视为已加入允许列表。此功能通过 Gateway RPC 使用
`skills.bins` 获取 skill bin 列表。如果你希望采用严格的手动允许列表，请禁用该功能。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，独立于手动路径允许列表条目。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## 安全 bin（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅限 stdin** 的二进制程序（例如 `cut`），它们在 allowlist 模式下**无需**显式允许列表条目即可运行。安全 bin 会拒绝位置文件参数和类似路径的 token，因此它们只能处理输入流。应将其视为流过滤器的狭窄快速通道，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制程序（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某条命令按设计就能执行代码、执行子命令或读取文件，应优先使用显式允许列表条目，并保持审批提示开启。自定义安全 bin 必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式 profile。
</Warning>

默认安全 bin：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请继续为其非 stdin 工作流保留显式允许列表条目。对于处于安全 bin 模式的 `grep`，
请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，以防文件操作数通过模糊的位置参数被偷偷带入。

### Argv 校验与被拒绝的标志

校验仅根据 argv 形态确定，且具有确定性（不检查主机文件系统中是否存在相关路径），这样可防止通过 allow/deny 差异形成文件存在性预言机行为。默认安全 bin 会拒绝面向文件的选项；长选项会按 fail-closed 方式校验（未知标志和含糊缩写都会被拒绝）。

按安全 bin profile 划分的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 还会在执行时强制将 argv token 视为**字面文本**（不会进行 glob 展开，也不会展开 `$VARS`）用于仅 stdin 的片段，因此像 `*` 或 `$HOME/...` 这样的模式不能被用来偷偷读取文件。

### 受信任的二进制目录

安全 bin 必须从受信任的二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动视为受信任。默认受信任目录有意保持最小：`/bin`、`/usr/bin`。如果你的安全 bin 可执行文件位于包管理器 / 用户路径中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链式调用、包装器和多路复用器

当每个顶层片段都满足允许列表要求时，shell 链式调用（`&&`、`||`、`;`）是允许的（包括安全 bin 或 Skills 自动允许）。重定向在 allowlist 模式下仍不受支持。命令替换（`$()` / 反引号）会在 allowlist 解析期间被拒绝，包括双引号内部；如果你需要字面量的 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制本身已在允许列表中。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域内的 env 覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

对于 allowlist 模式下的 `allow-always` 决策，已知分发包装器（`env`、
`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）也会以相同方式对 shell applet（`sh`、`ash` 等）进行解包。如果包装器或多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。

如果你将 `python3` 或 `node` 等解释器加入允许列表，建议启用
`tools.exec.strictInlineEval=true`，这样行内 eval 仍然需要显式审批。在严格模式下，`allow-always` 仍可持久化无害的解释器 / 脚本调用，但行内 eval 载体不会被自动持久化。

### 安全 bin 与 allowlist 的区别

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许范围狭窄的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全 bin argv 策略 | 已解析可执行文件路径 glob 模式 |
| 参数范围 | 受安全 bin profile 和字面量 token 规则限制 | 仅匹配路径；其余参数由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广泛或具有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的 profile 键会覆盖全局键。
- allowlist 条目保存在主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器 / 运行时 bin 出现在 `safeBins` 中但没有显式 profile 时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成为 `{}` 脚手架（之后请进行审查并收紧）。解释器 / 运行时 bin 不会被自动生成脚手架。

自定义 profile 示例：
__OC_I18N_900005__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 在安全 bin 模式下仍会拒绝
`env` 内建，因此 `jq -n env` 不能在没有显式 allowlist 路径或审批提示的情况下转储主机进程环境。

## 编辑 Control UI

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体的覆盖项以及允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加 / 移除允许列表模式，然后点击 **Save**。UI 会显示每个模式的 **last used** 元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果某个节点尚未声明执行审批，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或节点（参见 [Approvals CLI](/cli/approvals)）。

## 审批流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 进行处理，然后 gateway 会将已批准的请求转发到节点主机。

对于 `host=node`，审批请求会包含一个规范化的 `systemRunPlan` 负载。Gateway 网关在转发已批准的 `system.run`
请求时，会将该计划作为权威的命令 / cwd / 会话上下文。

这对于异步审批延迟很重要：

- 节点 exec 路径会预先准备一个规范计划
- 审批记录会存储该计划及其绑定元数据
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划
  而不是信任调用方之后的修改
- 如果调用方在审批请求创建之后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会将该转发执行拒绝为审批不匹配

## 解释器 / 运行时命令

基于审批的解释器 / 运行时执行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍然解析为单个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前先解包。
- 如果 OpenClaw 无法为某条解释器 / 运行时命令识别出**唯一一个**具体本地文件
  （例如包脚本、eval 形式、运行时特定的加载器链，或存在歧义的多文件形式），
  则会拒绝基于审批的执行，而不是声称自己覆盖了并不具备的语义。
- 对于这些工作流，建议优先使用沙箱隔离、单独的主机边界，或显式的受信任
  allowlist/full 工作流，由操作员接受更广泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决定，请求会被视为审批超时，并作为拒绝原因呈现。

### 后续投递行为

批准后的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续的 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或无外部目标的内部会话流中，后续投递会保持为仅会话（`deliver: false`）。
- 如果调用方显式请求严格外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，则投递会降级为仅会话，而不是失败。

确认对话框包含：

- command + args
- cwd
- agent id
- 已解析的可执行文件路径
- host + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到允许列表 + 运行
- **Deny** → 阻止

## 将审批转发到聊天渠道

你可以将 exec 审批提示转发到任意聊天渠道（包括渠道插件），并使用 `/approve` 进行审批。这会使用正常的出站投递流水线。

配置：
__OC_I18N_900006__
在聊天中回复：
__OC_I18N_900007__
`/approve` 命令同时处理 exec 审批和插件审批。如果该 ID 未匹配任何待处理 exec 审批，它会自动改为检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的投递流水线，但它有独立配置，位于 `approvals.plugin`。启用或禁用其中一个不会影响另一个。
__OC_I18N_900008__
配置结构与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式都一样。

支持共享交互式回复的渠道，会为 exec 审批和插件审批渲染相同的审批按钮。不支持共享交互式 UI 的渠道，会回退为带有 `/approve`
说明的纯文本。

### 任意渠道中的同一聊天审批

当 exec 或插件审批请求来自可投递的聊天界面时，默认情况下，同一聊天现在就可以通过 `/approve` 对其进行审批。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流程。

这种共享文本命令路径使用该会话的正常渠道认证模型。如果发起聊天本身已经可以发送命令并接收回复，那么审批请求就不再需要单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持在同一聊天中使用 `/approve`，但即使禁用了原生审批投递，这些渠道在授权时仍会使用其已解析的 approver 列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，
这种回退被有意限制在“未找到审批”类失败上。真正的 exec 审批拒绝 / 错误不会被静默重试为插件审批。

### 原生审批投递

某些渠道还可以充当原生审批客户端。原生客户端会在共享的同一聊天 `/approve`
流程之上，增加 approver 私信、原始聊天扇出以及渠道特定的交互式审批 UX。

当原生审批卡片 / 按钮可用时，该原生 UI 是面向智能体的主要路径。
除非工具结果表明聊天审批不可用，或手动审批是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天 `/approve` 命令。

通用模型：

- 主机 exec 策略仍决定是否需要 exec 审批
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部满足时，原生审批客户端会自动启用“优先私信”投递：

- 该渠道支持原生审批投递
- 可以从显式 `execApprovals.approvers` 或该渠道文档记录的回退来源中解析出 approver
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生审批客户端。将 `enabled: true` 设为在 approver 可解析时强制启用它。公开的原始聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批会有两个 exec 审批配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端在共享的同一聊天 `/approve` 流程和共享审批按钮之上，增加了私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，针对同一聊天中的 `/approve` 使用正常的渠道认证模型
- 当原生审批客户端自动启用时，默认原生投递目标是 approver 私信
- 对于 Discord 和 Telegram，只有已解析的 approver 才能批准或拒绝
- Discord approver 可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram approver 可以是显式指定的（`execApprovals.approvers`），也可以从现有 owner 配置推断（`allowFrom`，以及在支持时的私信 `defaultTo`）
- Slack approver 可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析到插件审批
  而不需要第二层 Slack 本地回退逻辑
- Matrix 原生私信 / 渠道路由和反应快捷方式同时处理 exec 审批和插件审批；
  插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求者本身不需要是 approver
- 当原始聊天已支持命令和回复时，原始聊天可以直接使用 `/approve` 进行审批
- 原生 Discord 审批按钮会按审批 id 类型路由：`plugin:` id 会直接进入插件审批，其余全部进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的、受限的 exec 到插件回退逻辑
- 当原生 `target` 启用原始聊天投递时，审批提示会包含命令文本
- 待处理 exec 审批默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端可以接受该请求，提示会回退到 `askFallback`

Telegram 默认发送到 approver 私信（`target: "dm"`）。如果你希望审批提示也出现在原始 Telegram 聊天 / 话题中，可以切换为 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900009__
安全说明：

- Unix socket 模式 `0600`，token 存储在 `exec-approvals.json` 中。
- 同一 UID 对等方检查。
- 质询 / 响应机制（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

Exec 生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行提示阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点报告事件后发布到智能体的会话中。
Gateway host 的 exec 审批在命令完成时（以及可选地在运行超过阈值时）会发出相同的生命周期事件。
受审批门控的 exec 会在这些消息中复用审批 id 作为 `runId`，以便轻松关联。

## 审批被拒绝时的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止智能体复用该会话中此前同一命令任意一次运行的输出。拒绝原因会附带明确说明，指出没有可用的命令输出，从而阻止智能体声称存在新的输出，或使用先前成功运行留下的陈旧结果来重复被拒绝的命令。

## 影响

- **full** 权限很强；尽可能优先使用 allowlist。
- **ask** 让你保持在决策环路中，同时仍支持快速审批。
- 按智能体划分的允许列表可防止某个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送者**的主机 exec 请求。未授权发送者不能发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。若要硬性阻止主机 exec，请将 approvals security 设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的紧急放行路径。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用各类控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    基于 Skill 的自动允许行为。
  </Card>
</CardGroup>
