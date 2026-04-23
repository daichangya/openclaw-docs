---
read_when:
    - 配置执行批准或允许列表
    - 在 macOS 应用中实现执行批准 UX
    - 审查沙箱逃逸提示及其影响
summary: 执行批准、允许列表和沙箱逃逸提示
title: 执行批准
x-i18n:
    generated_at: "2026-04-23T17:53:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 942d09665ff9d567361b0c5ee195a5a6b8c893ea1c9412caa33a02acd8e5e5be
    source_path: tools/exec-approvals.md
    workflow: 15
---

# 执行批准

执行批准是允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令时的**配套应用 / 节点主机护栏**。它是一个安全联锁：只有当策略 + 允许列表 +（可选的）用户批准全部同意时，命令才会被允许。执行批准叠加在工具策略和 elevated 门控**之上**（除非 elevated 设为 `full`，此时会跳过批准）。

<Note>
生效策略取 `tools.exec.*` 与批准默认值中**更严格**的一方；如果某个批准字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地批准状态——如果 `~/.openclaw/exec-approvals.json` 中有主机本地的 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，也仍然会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` — 显示请求的策略、主机策略来源以及生效结果。
- `openclaw exec-policy show` — 本地机器上的合并视图。
- `openclaw exec-policy set|preset` — 一步将本地请求策略与本地主机批准文件同步。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地批准文件是真实来源。

如果配套应用 UI **不可用**，任何通常会弹出提示的请求都会由 **ask fallback** 决定结果（默认：拒绝）。

<Tip>
原生聊天批准客户端可以在待处理的批准消息上预置特定渠道的便捷交互。例如，Matrix 会预置反应快捷方式（`✅` 允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为后备方案。
</Tip>

## 适用范围

执行批准会在执行主机本地强制执行：

- **gateway host** → Gateway 机器上的 `openclaw` 进程
- **node host** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 认证的调用方是该 Gateway 网关的受信任操作员。
- 已配对节点会将该受信任操作员能力扩展到节点主机。
- 执行批准可降低意外执行风险，但不是按用户划分的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，则会拒绝本次运行，而不是执行已漂移的内容。
- 这种文件绑定有意设计为尽力而为，而不是对每一种解释器 / 运行时加载路径都建立完整语义模型。如果批准模式无法识别并绑定**恰好一个**具体的本地文件，它会拒绝签发基于批准的运行，而不是假装具备完整覆盖能力。

macOS 拆分：

- **节点主机服务** 通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 负责强制执行批准并在 UI 上下文中执行命令。

## 设置和存储

批准存储在执行主机本地的一个 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例结构：

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

## 无需批准的 “YOLO” 模式

如果你希望主机执行在没有批准提示的情况下运行，则必须同时打开**两层**策略：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中主机本地的批准策略

现在这是默认的主机行为，除非你显式收紧它：

- `tools.exec.security`: 在 `gateway`/`node` 上设为 `full`
- `tools.exec.ask`: `off`
- 主机 `askFallback`: `full`

重要区别：

- `tools.exec.host=auto` 决定执行运行在何处：有沙箱时运行在沙箱，否则运行在 gateway。
- YOLO 决定主机执行如何被批准：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机执行策略之上，再额外添加单独的启发式命令混淆批准门控或脚本预检拒绝层。
- `auto` 不会让来自沙箱会话的 gateway 路由请求成为一个无代价的覆盖项。每次调用的 `host=node` 请求在 `auto` 下是允许的，而 `host=gateway` 仅在没有活动沙箱运行时的 `auto` 下允许。如果你希望一个稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你希望更保守的设置，请将任一层收紧回 `allowlist` / `on-miss`
或 `deny`。

持久化的 gateway host “永不提示” 设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机批准文件设置为匹配：

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

当前机器上相同 gateway host 策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅限本地使用。如果你需要远程更改 gateway host 或 node host 的批准，
请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

对于节点主机，请在该节点上应用相同的批准文件：

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

- `openclaw exec-policy` 不会同步节点批准
- `openclaw exec-policy set --host node` 会被拒绝
- 节点执行批准会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅会话快捷方式：

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急破玻璃快捷方式，它也会跳过该会话的执行批准。

如果主机批准文件仍比配置更严格，则更严格的主机策略仍然优先生效。

## 策略旋钮

### 安全性（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许所有内容（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当允许列表不匹配时提示。
- **always**：对每个命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### 询问后备（`askFallback`）

如果需要提示但没有可达的 UI，后备策略决定结果：

- **deny**：阻止。
- **allowlist**：仅当允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 会将内联代码 eval 形式视为“仅可通过批准执行”，即使解释器二进制本身已在允许列表中。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是对那些无法干净映射到单一稳定文件操作数的解释器加载器所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式批准；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你要编辑的智能体。模式是**不区分大小写的 glob 匹配**。模式应解析为**二进制路径**（仅文件名的条目会被忽略）。旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。类似 `echo ok && pwd` 的 shell 链仍要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 标识的稳定 UUID（可选）
- **last used**：上次使用时间戳
- **last used command**：上次使用的命令
- **last resolved path**：上次解析到的路径

## 自动允许 Skills CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无头节点主机）上被视为已加入允许列表。这会通过 Gateway RPC 使用 `skills.bins` 获取 skill 的二进制列表。如果你希望严格手动管理允许列表，请禁用此项。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分离。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## Safe bins（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在 allowlist 模式下**无需**显式允许列表条目运行。Safe bins 会拒绝位置文件参数和类似路径的 token，因此它们只能处理传入流。请将其视为面向流过滤器的狭义快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计能够执行代码求值、执行子命令或读取文件，请优先使用显式允许列表条目，并保持批准提示启用。自定义 safe bins 必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置。
</Warning>

默认 safe bins：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于 safe-bin 模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式会被拒绝，以防文件操作数被伪装成有歧义的位置参数。

<AccordionGroup>
  <Accordion title="Argv 验证和被拒绝的标志">
    验证仅根据 argv 形状做确定性判断（不检查主机文件系统中的文件是否存在），这样可以防止允许 / 拒绝差异泄露文件存在性的预言机行为。默认 safe bins 会拒绝面向文件的选项；长选项采用失败即关闭的验证方式（未知标志和有歧义的缩写都会被拒绝）。

    各 safe-bin 配置所拒绝的标志：

    [//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

    [//]: # "SAFE_BIN_DENIED_FLAGS:END"

    Safe bins 还会强制在执行时将 argv token 视为**字面文本**（不进行 glob 展开，也不进行 `$VARS` 扩展），适用于仅 stdin 的片段，因此像 `*` 或 `$HOME/...` 这样的模式不能被用来伪装文件读取。

  </Accordion>

    <Accordion title="受信任的二进制目录">
      Safe bins 必须从受信任的二进制目录中解析（系统默认值
      加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。默认受信任目录有意保持最小化：
      `/bin`、`/usr/bin`。如果你的 safe-bin 可执行文件位于
      包管理器 / 用户路径中（例如 `/opt/homebrew/bin`、
      `/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到
      `tools.exec.safeBinTrustedDirs`。
    </Accordion>

    <Accordion title="Shell 链、包装器和多路复用器">
      允许使用 Shell 链（`&&`、`||`、`;`），前提是每个顶层片段
      都满足允许列表要求（包括 safe bins 或 skill 自动允许）。
      在 allowlist 模式下，重定向仍然不受支持。命令替换
      （`$()` / 反引号）会在 allowlist 解析期间被拒绝，包括位于
      双引号中的情况；如果你需要字面量 `$()` 文本，请使用单引号。

      在 macOS 配套应用批准中，包含 shell 控制符
      或扩展语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、
      `)`）的原始 shell 文本会被视为 allowlist 未命中，除非 shell 二进制文件本身已在允许列表中。

      对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的 env
      覆盖会被缩减为一个显式的小型允许列表（`TERM`、`LANG`、
      `LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

      对于 allowlist 模式下的 `allow-always` 决策，已知分发包装器
      （`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件
      路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）
      对 shell applet（`sh`、`ash` 等）也会以同样方式解包。如果某个
      包装器或多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。

      如果你将 `python3` 或 `node` 之类的解释器加入允许列表，建议启用
      `tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要
      显式批准。在严格模式下，`allow-always` 仍可持久化无害的
      解释器 / 脚本调用，但内联 eval 载体不会被自动持久化。

  </Accordion>
  </AccordionGroup>

### Safe bins 与 allowlist 的对比

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                         |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| 目标             | 自动允许受限的 stdin 过滤器                            | 显式信任特定可执行文件                                    |
| 匹配类型         | 可执行文件名 + safe-bin argv 策略                      | 已解析可执行文件路径 glob 模式                            |
| 参数范围         | 受 safe-bin 配置和字面量 token 规则限制                | 仅匹配路径；除此之外参数由你自行负责                      |
| 典型示例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI            |
| 最佳用途         | 管道中的低风险文本转换                                 | 任何具有更广泛行为或副作用的工具                          |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体划分的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体划分的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体划分的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体划分的配置键会覆盖全局配置键。
- allowlist 条目位于主机本地的 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器 / 运行时二进制文件出现在 `safeBins` 中但没有显式配置时，`openclaw security audit` 会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 骨架（之后请审查并收紧）。解释器 / 运行时二进制文件不会被自动生成骨架。

自定义配置示例：
__OC_I18N_900005__
如果你显式选择将 `jq` 加入 `safeBins`，OpenClaw 在 safe-bin
模式下仍会拒绝 `env` 内建，因此 `jq -n env` 不能在没有显式 allowlist 路径
或批准提示的情况下导出主机进程环境。

## 编辑 Control UI

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体划分的
覆盖项以及允许列表。选择一个作用域（默认值或某个智能体），调整策略，
添加 / 删除允许列表模式，然后点击 **保存**。UI 会显示每个模式的 **上次使用**
元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地批准）或某个 **Node**。节点
必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明 exec approvals，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或 node（参见 [Approvals CLI](/cli/approvals)）。

## 批准流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 对其进行处理，然后 gateway 将
已批准的请求转发到节点主机。

对于 `host=node`，批准请求会包含一个规范的 `systemRunPlan` 负载。gateway 会在转发已批准的 `system.run`
请求时，将该计划作为权威的命令 / cwd / 会话上下文。

这对异步批准延迟很重要：

- 节点执行路径会预先准备一个规范计划
- 批准记录会存储该计划及其绑定元数据
- 一旦批准，最终转发的 `system.run` 调用会复用已存储的计划
  而不是信任调用方之后的编辑
- 如果调用方在创建批准请求后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会因批准不匹配而拒绝
  转发的运行请求

## 解释器 / 运行时命令

基于批准的解释器 / 运行时执行是有意保守设计的：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地
  文件快照。
- 仍然可解析到单个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前
  先被解包。
- 如果 OpenClaw 无法为解释器 / 运行时命令识别出**恰好一个**具体本地文件
  （例如包脚本、eval 形式、运行时特定加载链，或存在歧义的多文件
  形式），则会拒绝基于批准的执行，而不是声称它具备并不存在的语义覆盖能力。
- 对于这些工作流，建议优先使用沙箱隔离、单独的主机边界，或显式的受信任
  allowlist/full 工作流，由操作员接受更宽泛的运行时语义。

当需要批准时，执行工具会立即返回一个批准 id。使用该 id 来
关联后续的系统事件（`Exec finished` / `Exec denied`）。如果在
超时前没有收到决定，该请求会被视为批准超时，并作为拒绝原因显示。

### 后续投递行为

已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递的渠道加上目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或无外部目标的内部会话流中，后续投递会保持仅会话内（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但没有可解析的外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，投递会降级为仅会话内，而不是失败。

确认对话框包含：

- command + args
- cwd
- 智能体 id
- 已解析可执行文件路径
- 主机 + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到允许列表 + 运行
- **Deny** → 阻止

## 将批准转发到聊天渠道

你可以将 exec 批准提示转发到任意聊天渠道（包括渠道插件），并通过
`/approve` 进行批准。这使用常规的出站投递管道。

配置：
__OC_I18N_900006__
在聊天中回复：
__OC_I18N_900007__
`/approve` 命令同时处理 exec approvals 和 plugin approvals。如果该 ID 与待处理的 exec approval 不匹配，它会自动转而检查 plugin approvals。

### plugin 批准转发

plugin 批准转发与 exec approvals 使用相同的投递管道，但在 `approvals.plugin` 下拥有自己独立的配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900008__
该配置结构与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式完全一致。

支持共享交互式回复的渠道会为 exec 和 plugin approvals 都渲染相同的批准按钮。没有共享交互式 UI 的渠道则会回退为带有 `/approve`
说明的纯文本。

### 任意渠道中的同聊天批准

当 exec 或 plugin 批准请求源自可投递的聊天界面时，现在默认可以在同一个聊天中使用 `/approve` 进行批准。这适用于 Slack、Matrix 和
Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流程。

这条共享文本命令路径使用该对话的常规渠道认证模型。如果发起聊天
本身已经可以发送命令并接收回复，那么批准请求就不再需要
单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使禁用了原生批准投递，这些渠道在授权时仍会使用其已解析的批准人列表。

对于 Telegram 以及其他直接调用 Gateway 网关的原生批准客户端，
这个后备路径有意限制在“找不到批准”类故障中。真实的
exec approval 拒绝 / 错误不会被静默重试为 plugin approval。

### 原生批准投递

某些渠道还可以作为原生批准客户端。原生客户端会在共享的同聊天 `/approve`
流程之上增加批准人私信、原始聊天扇出，以及渠道特定的交互式批准 UX。

当可用原生批准卡片 / 按钮时，该原生 UI 是面向
智能体的主要路径。除非工具结果表明聊天批准不可用，或手动批准是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天
`/approve` 命令。

通用模型：

- 主机执行策略仍然决定是否需要 exec approval
- `approvals.exec` 控制是否将批准提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否作为原生批准客户端

当以下条件全部满足时，原生批准客户端会自动启用 DM 优先投递：

- 该渠道支持原生批准投递
- 可以从显式的 `execApprovals.approvers` 或该
  渠道文档说明的后备来源中解析出批准人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生批准客户端。将 `enabled: true` 设为在能够解析出批准人时强制启用它。公开的原始聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天批准有两个 exec approval 配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端会在共享的同聊天 `/approve` 流程和共享批准按钮之上，增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，针对同聊天 `/approve` 使用常规渠道认证模型
- 当原生批准客户端自动启用时，默认的原生投递目标是批准人私信
- 对于 Discord 和 Telegram，只有已解析出的批准人可以批准或拒绝
- Discord 批准人可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 批准人可以是显式配置（`execApprovals.approvers`），也可以从现有 owner 配置推断（`allowFrom`，以及支持时的私信 `defaultTo`）
- Slack 批准人可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留批准 id 类型，因此 `plugin:` id 可以解析到 plugin approvals，
  而无需第二层 Slack 本地后备逻辑
- Matrix 原生私信 / 渠道路由和反应快捷方式同时处理 exec 和 plugin approvals；
  plugin 授权仍然来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是批准人
- 当原始聊天已支持命令和回复时，原始聊天可以直接通过 `/approve` 进行批准
- 原生 Discord 批准按钮会按批准 id 类型路由：`plugin:` id 会
  直接进入 plugin approvals，其他所有情况都会进入 exec approvals
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的有界 exec 到 plugin 后备逻辑
- 当原生 `target` 启用原始聊天投递时，批准提示会包含命令文本
- 待处理的 exec approvals 默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的批准客户端可以接受该请求，提示会回退到 `askFallback`

Telegram 默认使用批准人私信（`target: "dm"`）。如果你希望批准提示也出现在发起的 Telegram 聊天 / 话题中，可以切换为 `channel` 或 `both`。对于 Telegram forum 话题，OpenClaw 会在批准提示和批准后的后续消息中保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900009__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对等方检查。
- 质询 / 响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

Exec 生命周期会作为系统消息呈现：

- `Exec running`（仅当命令超过运行提示阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点上报事件后发布到智能体的会话中。
Gateway host exec approvals 在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，也可在运行中发出）。
受批准门控的 exec 会复用批准 id 作为这些消息中的 `runId`，便于关联。

## 批准被拒绝时的行为

当异步 exec approval 被拒绝时，OpenClaw 会阻止智能体复用
该会话中此前相同命令任意一次运行的输出。拒绝原因
会附带明确说明“没有可用命令输出”，从而阻止
智能体声称存在新的输出，或使用先前成功运行留下的过期结果
重复被拒绝的命令。

## 影响

- **full** 权限很强；在可能的情况下优先使用允许列表。
- **ask** 让你保持知情，同时仍能快速批准。
- 按智能体划分的允许列表可防止一个智能体的批准泄漏到其他智能体。
- 批准仅适用于来自**已授权发送者**的主机 exec 请求。未授权发送者不能发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过批准。若要强制阻止主机 exec，请将批准安全性设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated 模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过批准的紧急破玻璃路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱隔离 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用各类控制。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    基于 Skill 的自动允许行为。
  </Card>
</CardGroup>
