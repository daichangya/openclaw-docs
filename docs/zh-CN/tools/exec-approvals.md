---
read_when:
    - 配置 exec 审批或 allowlist 时പ്പ to=final code  omitted
    - 在 macOS 应用中实现 exec 审批 UX 时ેણ to=final code  omitted
    - 审查沙箱逃逸提示及其影响时
summary: exec 审批、allowlist 和沙箱逃逸提示ուռ to=final code  omitted
title: Exec 审批
x-i18n:
    generated_at: "2026-04-23T21:07:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: aed029a7aff5b4a9e67e5fc20a91ca80b1ddabb562cb5a1ce05c2a6222321698
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec 审批是用于让
沙箱隔离智能体在真实主机（`gateway` 或 `node`）上运行命令的**配套应用 / 节点主机护栏**。它是一个安全联锁：只有当策略 + allowlist +（可选的）用户
审批全部同意时，命令才会被允许。Exec 审批会**叠加在**工具策略和 elevated 门控**之上**（除非 elevated 设为 `full`，此时会跳过审批）。

<Note>
生效策略是 `tools.exec.*` 与 approvals 默认值中**更严格**的那个；
如果某个 approvals 字段被省略，则使用 `tools.exec` 的值。主机 exec
还会使用该机器上的本地审批状态 —— 如果 `~/.openclaw/exec-approvals.json` 中设置了主机本地 `ask: "always"`，那么即使会话或配置默认值请求 `ask: "on-miss"`，也仍然会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` —— 显示请求的策略、主机策略来源以及生效结果。
- `openclaw exec-policy show` —— 本地机器上的合并视图。
- `openclaw exec-policy set|preset` —— 一步同步本地请求策略与本地主机审批文件。

当某个本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何本来会触发提示的请求都会由**ask 回退**来处理（默认：拒绝）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上加入特定渠道的操作方式。例如，Matrix 会添加表情快捷方式（`✅`
允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍保留消息中的 `/approve ...`
命令作为回退。
</Tip>

## 它适用于哪里

Exec 审批在执行主机上本地强制执行：

- **gateway 主机** → gateway 机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 已通过 Gateway 网关认证的调用方会被视为该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到节点主机。
- Exec 审批会降低意外执行风险，但它不是按用户划分的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、在存在时绑定 env，
  以及在适用时固定可执行路径。
- 对于 shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定
  一个具体的本地文件操作数。如果该绑定文件在审批后、执行前发生变化，
  则该运行会被拒绝，而不是执行已漂移的内容。
- 这种文件绑定是有意设计为尽力而为，而不是对每个
  解释器/运行时加载器路径建立完整语义模型。如果审批模式无法识别出恰好一个可绑定的具体本地
  文件，它会拒绝签发基于审批的运行，而不是假装具有完整覆盖能力。

macOS 拆分：

- **节点主机服务** 会通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 负责执行审批 + 以 UI 上下文运行命令。

## 设置与存储

审批信息位于执行主机上的本地 JSON 文件中：

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

如果你希望主机 exec 在没有审批提示的情况下运行，你必须同时打开**两层**策略：

- OpenClaw 配置中的请求 exec 策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中的主机本地审批策略

除非你显式收紧它，否则这现在是默认主机行为：

- `tools.exec.security`：在 `gateway`/`node` 上为 `full`
- `tools.exec.ask`：`off`
- 主机 `askFallback`：`full`

重要区别：

- `tools.exec.host=auto` 决定 exec 在哪里运行：有沙箱时使用沙箱，否则使用 gateway。
- YOLO 决定主机 exec 如何被审批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在已配置主机 exec 策略之上，再额外增加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 gateway 路由成为来自沙箱隔离会话的免费覆盖。允许从 `auto` 发起逐次调用的 `host=node` 请求，而 `host=gateway` 只有在没有活动沙箱运行时的情况下，才允许从 `auto` 发起。如果你想要一个稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你想要更保守的设置，请将任一层重新收紧为 `allowlist` / `on-miss`
或 `deny`。

持久化的 gateway 主机“永不提示”设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机审批文件设置为匹配状态：

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

当前机器上相同 gateway 主机策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅限本地使用。如果你需要远程更改 gateway 主机或节点主机审批，
请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

对于节点主机，请改为在该节点上应用相同的审批文件：

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

重要的本地限制：

- `openclaw exec-policy` 不会同步节点审批
- `openclaw exec-policy set --host node` 会被拒绝
- 节点 exec 审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅当前会话快捷方式：

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一个 break-glass 快捷方式，它也会跳过该会话的 exec 审批。

如果主机审批文件保持得比配置更严格，则仍以更严格的主机策略为准。

## 策略控制项

### 安全（`exec.security`）

- **deny**：阻止所有主机 exec 请求。
- **allowlist**：仅允许 allowlist 中的命令。
- **full**：允许一切（等同于 elevated）。

### Ask（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当 allowlist 未匹配时提示。
- **always**：对每条命令都提示。
- 当生效 ask 模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### Ask 回退（`askFallback`）

如果某次请求需要提示，但没有可达 UI，则由回退来决定：

- **deny**：阻止。
- **allowlist**：仅在 allowlist 匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 会将内联代码 eval 形式视为仅可通过审批执行，即使解释器二进制本身已经位于 allowlist 中。

示例：

- `python -c`
- `node -e`、`node --eval`、`node -p`
- `ruby -e`
- `perl -e`、`perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对那些无法干净映射到单一稳定文件操作数的解释器加载器所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久化新的 allowlist 条目。

## Allowlist（按智能体）

Allowlist 是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在
编辑的智能体。模式使用**不区分大小写的 glob 匹配**。
模式应解析为**二进制路径**（仅文件名条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链仍然要求每个顶层片段都满足 allowlist 规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个 allowlist 条目会跟踪：

- **id**：供 UI 标识使用的稳定 UUID（可选）
- **last used**：最近使用时间戳
- **last used command**
- **last resolved path**

## 自动允许 Skill CLI

当启用 **Auto-allow skill CLIs** 时，已知 Skills
引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入 allowlist。这会
通过 Gateway RPC 使用 `skills.bins` 获取 skill bin 列表。如果你希望严格手动 allowlist，请禁用此功能。

重要信任说明：

- 这是一个**隐式便利 allowlist**，与手动路径 allowlist 条目分离。
- 它适用于 Gateway 和节点位于同一信任边界内的受信任操作员环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径 allowlist 条目。

## Safe bins（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制（例如
`cut`），它们可在 allowlist 模式下**无需**显式 allowlist
条目即可运行。Safe bins 会拒绝位置文件参数和类似路径的 token，因此
它们只能处理传入流。请将其视为流过滤器的窄快速路径，
而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins` 中。如果某个命令本身就能执行代码、
执行子命令或读取文件，请优先使用显式 allowlist 条目，
并保持审批提示开启。自定义 safe bins 必须在
`tools.exec.safeBinProfiles.<bin>` 中定义显式 profile。
</Warning>

默认 safe bins：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式
allowlist 条目。对于处于 safe-bin 模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，
这样文件操作数就无法伪装成含糊的位置参数。

### Argv 验证与被拒绝标志

验证是基于 argv 形状的确定性验证（不检查主机文件系统是否存在），这样可以防止通过 allow/deny 差异形成文件存在性预言机行为。对默认 safe bins，面向文件的选项会被拒绝；长选项采用关闭失败方式验证（未知标志和歧义缩写会被拒绝）。

按 safe-bin profile 列出的被拒绝标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins 还会强制将 argv token 在执行时视为**字面文本**
（不进行 glob 展开，也不展开 `$VARS`）用于仅 stdin 的片段，因此像
`*` 或 `$HOME/...` 这样的模式不能被用来夹带文件读取。

### 受信任的二进制目录

Safe bins 必须从受信任的二进制目录中解析（系统默认目录加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。
默认受信任目录是有意保持最小化的：`/bin`、`/usr/bin`。如果
你的 safe-bin 可执行文件位于包管理器/用户路径中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们
显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器与多路复用器

当每个顶层片段都满足 allowlist（包括 safe bins 或 skill 自动允许）时，允许使用 shell 链接（`&&`、`||`、`;`）。在 allowlist 模式下，重定向仍然不受支持。命令替换（`$()` / 反引号）在 allowlist 解析期间会被拒绝，包括双引号内；如果你需要字面量 `$()` 文本，请使用单引号。

在 macOS 配套应用审批中，包含 shell 控制或
展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本
会被视为 allowlist 未命中，除非 shell 二进制本身已位于 allowlist 中。

对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），按请求范围的 env 覆盖会被缩减为一小组显式 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

对于 allowlist 模式下的 `allow-always` 决策，已知的调度包装器（`env`、
`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是
包装器路径。Shell 多路复用器（`busybox`、`toybox`）在用于
shell applet（`sh`、`ash` 等）时也会以相同方式解包。如果某个包装器或多路复用器
无法被安全解包，则不会自动持久化任何 allowlist 条目。

如果你将 `python3` 或 `node` 之类的解释器加入 allowlist，请优先设置
`tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要显式
审批。在严格模式下，`allow-always` 仍可持久化无害的
解释器/脚本调用，但内联 eval 承载器不会被自动持久化。

### Safe bins 与 allowlist 的区别

| 主题 | `tools.exec.safeBins` | Allowlist（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许窄范围 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + safe-bin argv 策略 | 已解析可执行路径 glob 模式 |
| 参数范围 | 受 safe-bin profile 和字面 token 规则限制 | 仅匹配路径；其余参数由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广泛或有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的 profile 键会覆盖全局键。
- allowlist 条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...` 管理）。
- 当解释器/运行时 bin 出现在 `safeBins` 中且没有显式 profile 时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 脚手架（之后请再审查并收紧）。解释器/运行时 bin 不会自动生成脚手架。

自定义 profile 示例：
__OC_I18N_900005__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 仍会在 safe-bin
模式下拒绝 `env` 内置项，因此 `jq -n env` 无法在没有显式 allowlist 路径
或审批提示的情况下转储主机进程环境。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体
覆盖和 allowlist。选择一个范围（Defaults 或某个智能体），调整策略，
添加/移除 allowlist 模式，然后点击 **Save**。UI 会显示每个模式的**最近使用**
元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或某个**节点**。节点
必须广播 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未广播 exec approvals，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 gateway 或 node 编辑（请参见 [Approvals CLI](/cli/approvals)）。

## 审批流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用会通过 `exec.approval.resolve` 解决它，然后 gateway 再将
已批准请求转发到节点主机。

对于 `host=node`，审批请求会包含一个规范的 `systemRunPlan` 载荷。gateway 在转发已批准的 `system.run`
请求时，会将该计划作为权威命令/cwd/session 上下文。

这对于异步审批延迟非常重要：

- 节点 exec 路径会预先准备一个规范计划
- 审批记录会保存该计划及其绑定元数据
- 一旦审批通过，最终转发的 `system.run` 调用会复用该已存储计划，
  而不是相信后来调用方的编辑
- 如果调用方在审批请求创建后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会将转发的运行拒绝为审批不匹配

## 解释器/运行时命令

基于审批的解释器/运行时执行有意保持保守：

- 始终绑定精确的 argv/cwd/env 上下文。
- 对于直接 shell 脚本和直接运行时文件形式，会尽力绑定到一个具体的本地
  文件快照。
- 对于仍能解析为单一直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`），会在绑定前进行解包。
- 如果 OpenClaw 无法为某个解释器/运行时命令识别出恰好一个具体本地文件
  （例如包脚本、eval 形式、运行时特定加载链或含糊的多文件
  形式），则会拒绝基于审批的执行，而不是声称拥有自己并不具备的语义覆盖。
- 对于这些工作流，请优先使用沙箱隔离、单独主机边界，或
  显式的受信任 allowlist/full 工作流，在那种工作流中由操作员接受更广泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。使用该 id 来
关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有任何决定到达，
该请求会被视为审批超时，并作为拒绝原因呈现。

### 后续投递行为

在已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），则后续投递使用该渠道。
- 在仅 webchat 或内部会话流程中，如果没有外部目标，则后续投递保持仅会话（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但没有可解析的外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析任何外部渠道，则投递会降级为仅会话，而不是失败。

确认对话框会包含：

- command + args
- cwd
- agent id
- 已解析的可执行路径
- host + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到 allowlist + 运行
- **Deny** → 阻止

## 将审批转发到聊天渠道

你可以将 exec 审批提示转发到任意聊天渠道（包括插件渠道），并使用 `/approve` 进行批准。
这会使用常规出站投递流水线。

配置：
__OC_I18N_900006__
在聊天中回复：
__OC_I18N_900007__
`/approve` 命令同时处理 exec 审批和插件审批。如果 ID 不匹配任何待处理 exec 审批，它会自动改为检查插件审批。

### 插件审批转发

插件审批转发与 exec 审批使用相同的投递流水线，但在 `approvals.plugin` 下拥有独立的
配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900008__
配置形状与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式一致。

支持共享交互式回复的渠道会为 exec 和
插件审批渲染相同的审批按钮。不支持共享交互式 UI 的渠道则会回退为带 `/approve`
说明的纯文本。

### 任意渠道中的同聊天审批

当某个 exec 或插件审批请求源自可投递聊天界面时，默认情况下，同一聊天
现在可以通过 `/approve` 来批准它。这适用于 Slack、Matrix 和
Microsoft Teams 等渠道，此外还适用于现有的 Web UI 和终端 UI 流程。

这条共享文本命令路径使用该会话的常规渠道认证模型。如果
源聊天已经可以发送命令并接收回复，那么审批请求就不再需要
单独的原生投递 adapter 才能保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但这些渠道即使在原生审批投递被禁用时，
仍会使用其已解析的审批人列表进行授权。

对于 Telegram 和其他直接调用 Gateway 网关的原生审批客户端，
这种回退有意被限定在“找不到审批”失败的情况。真实的
exec 审批拒绝/错误不会静默重试为插件审批。

### 原生审批投递

有些渠道还可以充当原生审批客户端。原生客户端会在共享同聊天 `/approve`
流程之上，增加审批人私信、源聊天扇出以及渠道特定的交互式审批 UX。

当存在原生审批卡片/按钮时，该原生 UI 就是主要的
面向智能体路径。除非工具结果表明聊天审批不可用或
手动审批是唯一剩余路径，否则智能体不应再额外回显一条重复的纯聊天
`/approve` 命令。

通用模型：

- 主机 exec 策略仍然决定是否需要 exec 审批
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

在以下全部条件为真时，原生审批客户端会自动启用以私信为优先的投递：

- 该渠道支持原生审批投递
- 可通过显式 `execApprovals.approvers` 或该
  渠道文档化的回退来源解析出审批人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生审批客户端。将 `enabled: true` 设为在审批人可解析时强制
启用。公开的源聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批会有两套 exec 审批配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端会在共享同聊天 `/approve` 流程和共享审批按钮之上，增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，会对同聊天 `/approve` 使用正常的渠道认证模型
- 当某个原生审批客户端自动启用时，默认的原生投递目标是审批人私信
- 对于 Discord 和 Telegram，只有已解析的审批人可以执行批准或拒绝
- Discord 审批人可以是显式配置的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批人可以是显式配置的（`execApprovals.approvers`），也可以从现有所有者配置（`allowFrom`，以及在支持时的私信 `defaultTo`）推断
- Slack 审批人可以是显式配置的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析插件审批，
  而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由和表情快捷方式同时处理 exec 和插件审批；
  插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求者本身不需要是审批人
- 当源聊天本身已支持命令和回复时，源聊天可以直接通过 `/approve` 批准
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 会
  直接进入插件审批，其余所有情况都进入 exec 审批
- 原生 Telegram 审批按钮与 `/approve` 使用相同的有界 exec 到插件回退
- 当原生 `target` 启用源聊天投递时，审批提示会包含命令文本
- 待处理 exec 审批默认在 30 分钟后过期
- 如果没有操作员 UI 或已配置审批客户端可以接受请求，则提示会回退到 `askFallback`

Telegram 默认投递到审批人私信（`target: "dm"`）。如果你
希望审批提示也出现在发起的 Telegram 聊天/话题中，可切换为 `channel` 或 `both`。对于 Telegram forum 话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

请参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900009__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对端检查。
- Challenge/response（nonce + HMAC token + request hash）+ 短 TTL。

## 系统事件

Exec 生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些事件会在节点上报事件后发布到智能体会话中。
Gateway 主机 exec 审批在命令完成时也会发出相同的生命周期事件（以及可选地在运行超过阈值时发出）。
受审批控制的 exec 会复用审批 id 作为这些消息中的 `runId`，以便轻松关联。

## 被拒绝审批的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止智能体复用
会话中此前相同命令的任何输出。拒绝原因会附带明确说明：当前没有任何命令输出可用，这样就能阻止
智能体声称有新输出，或用先前成功运行留下的过期结果来重复已被拒绝的命令。

## 影响

- **full** 权限很大；尽可能优先使用 allowlist。
- **ask** 能让你保持在审批回路中，同时仍允许快速审批。
- 按智能体的 allowlist 可防止一个智能体的审批泄露到其他智能体。
- 审批仅适用于来自**已授权发送者**的主机 exec 请求。未授权发送者无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便利方式，并且按设计会跳过审批。若要硬性阻止主机 exec，请将 approvals security 设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过审批的 break-glass 路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用哪一种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    基于 Skill 的自动允许行为。
  </Card>
</CardGroup>
