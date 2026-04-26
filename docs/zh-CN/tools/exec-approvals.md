---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批 UX
    - 审查沙箱逃逸提示及其影响
sidebarTitle: Exec approvals
summary: 主机执行审批：策略开关、允许列表，以及 YOLO/严格工作流
title: 执行审批
x-i18n:
    generated_at: "2026-04-26T06:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

执行审批是**配套应用 / 节点主机护栏**，用于让处于沙箱中的智能体在真实主机（`gateway` 或 `node`）上运行命令。它是一种安全联锁机制：只有当策略 + 允许列表 +（可选）用户审批全部同意时，命令才会被允许执行。执行审批**叠加在**工具策略和提升权限门控之上（除非提升权限设置为 `full`，此时会跳过审批）。

<Note>
有效策略取 `tools.exec.*` 与审批默认值两者中**更严格**的那个；如果某个审批字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地审批状态——如果 `~/.openclaw/exec-approvals.json` 中主机本地的 `ask: "always"` 已设置，那么即使会话或配置默认值请求 `ask: "on-miss"`，它也仍然会持续提示。
</Note>

## 检查有效策略

| 命令 | 显示内容 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源，以及最终的有效结果。 |
| `openclaw exec-policy show` | 本地机器的合并视图。 |
| `openclaw exec-policy set` / `preset` | 一步将本地请求的策略与本地主机审批文件同步。 |

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不会假装本地审批文件才是事实来源。

如果配套应用 UI **不可用**，任何原本需要提示的请求都会通过**询问回退策略**来处理（默认：`deny`）。

<Tip>
原生聊天审批客户端可以在待审批消息上预置特定渠道的交互方式。例如，Matrix 会预置反应快捷方式（`✅` 允许一次，`❌` 拒绝，`♾️` 始终允许），同时仍保留消息中的 `/approve ...` 命令作为回退方案。
</Tip>

## 适用位置

执行审批在执行主机本地强制生效：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 通过 Gateway 网关认证的调用方被视为该 Gateway 网关的受信任操作员。
- 已配对的节点会将这种受信任操作员能力扩展到节点主机。
- 执行审批可降低误执行风险，但**不是**按用户划分的认证边界。
- 已批准的节点主机执行会绑定规范化执行上下文：规范化的 cwd、精确的 argv、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，则会拒绝本次执行，而不是执行已漂移的内容。
- 文件绑定有意采用尽力而为策略，**并非**对每一种解释器 / 运行时加载路径都提供完整语义模型。如果审批模式无法准确识别并绑定唯一一个具体的本地文件，它会拒绝生成基于审批的执行，而不是假装已实现全面覆盖。

### macOS 拆分

- **节点主机服务**会通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**负责强制执行审批并在 UI 上下文中执行命令。

## 设置与存储

审批保存在执行主机上的本地 JSON 文件中：

```text
~/.openclaw/exec-approvals.json
```

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

## 策略开关

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — 阻止所有主机执行请求。
  - `allowlist` — 仅允许允许列表中的命令。
  - `full` — 允许所有内容（等同于提升权限）。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 从不提示。
  - `on-miss` — 仅当允许列表未匹配时提示。
  - `always` — 每条命令都提示。当有效询问模式为 `always` 时，`allow-always` 的持久信任**不会**抑制提示。
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  当需要提示但没有可达 UI 时的处理结果。

- `deny` — 阻止。
- `allowlist` — 仅当允许列表匹配时允许。
- `full` — 允许。
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，OpenClaw 会将内联代码求值形式视为仅可通过审批执行，
  即使解释器二进制文件本身已在允许列表中也是如此。这是对那些无法
  干净映射到单一稳定文件操作数的解释器加载方式所做的纵深防御。
</ParamField>

严格模式会捕获的示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍然需要显式审批，并且 `allow-always`
不会自动为它们持久化新的允许列表条目。

## YOLO 模式（无审批）

如果你希望主机执行在没有审批提示的情况下运行，就必须同时放开
**两层**策略——OpenClaw 配置中的请求执行策略
（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json`
中的主机本地审批策略。

YOLO 是默认的主机行为，除非你显式收紧它：

| 层级 | YOLO 设置 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway` / `node` 上设为 `full` |
| `tools.exec.ask` | `off` |
| 主机 `askFallback` | `full` |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择执行的**位置**：如果有沙箱则在沙箱中执行，否则在 Gateway 网关执行。
- YOLO 选择主机执行如何被批准：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw **不会**在已配置的主机执行策略之上，再额外添加单独的启发式命令混淆审批门或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由从沙箱会话中变成一个免费覆盖项。来自 `auto` 的单次调用 `host=node` 请求是允许的；只有在没有活动沙箱运行时时，来自 `auto` 的 `host=gateway` 请求才允许。若要获得稳定的非 `auto` 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。
  </Warning>

暴露自身非交互式权限模式的 CLI 支持型提供商可以遵循此策略。当 OpenClaw 请求的执行策略为 YOLO 时，Claude CLI 会添加
`--permission-mode bypassPermissions`。你可以通过
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的显式 Claude 参数覆盖该后端行为——例如 `--permission-mode default`、`acceptEdits` 或
`bypassPermissions`。

如果你想采用更保守的设置，可以将任一层重新收紧为
`allowlist` / `on-miss` 或 `deny`。

### 持久化的 Gateway 网关主机“永不提示”设置

<Steps>
  <Step title="设置请求配置策略">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主机审批文件">
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
  </Step>
</Steps>

### 本地快捷方式

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`。
- 本地 `~/.openclaw/exec-approvals.json` 默认值。

它有意仅作用于本地。要远程更改 Gateway 网关主机或节点主机的审批，请使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

### 节点主机

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

<Note>
**仅限本地的限制：**

- `openclaw exec-policy` 不会同步节点审批。
- `openclaw exec-policy set --host node` 会被拒绝。
- 节点执行审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。
  </Note>

### 仅会话快捷方式

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，它也会跳过该会话的执行审批。

如果主机审批文件仍然比配置更严格，那么更严格的主机策略仍然会生效。

## 允许列表（按智能体）

允许列表是**按智能体**区分的。如果存在多个智能体，请在 macOS 应用中切换你要编辑的智能体。模式使用 glob 匹配。

模式既可以是解析后的二进制路径 glob，也可以是裸命令名 glob。
裸名称只匹配通过 `PATH` 调用的命令，因此如果命令是 `rg`，那么 `rg` 可以匹配
`/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。如果你只想信任某个特定位置的二进制文件，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令仍然要求每个顶层片段都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

| 字段 | 含义 |
| ------------------ | -------------------------------- |
| `id` | 用于 UI 身份识别的稳定 UUID |
| `lastUsedAt` | 上次使用时间戳 |
| `lastUsedCommand` | 上次匹配到的命令 |
| `lastResolvedPath` | 上次解析出的二进制路径 |

## 自动允许 Skills CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。它通过 Gateway 网关 RPC 使用 `skills.bins` 获取 skill bin 列表。如果你希望使用严格的手动允许列表，请关闭此选项。

<Warning>
- 这是一种**隐式便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。
</Warning>

## 安全 bin 与审批转发

关于安全 bin（仅 stdin 快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参见
[执行审批——高级](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体覆盖项和允许列表。选择一个作用域（Defaults 或某个智能体），调整策略，添加 / 删除允许列表模式，然后点击 **Save**。UI 会显示每个模式的上次使用元数据，方便你保持列表整洁。

目标选择器用于选择 **Gateway 网关**（本地审批）或某个**节点**。
节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果某个节点尚未声明执行审批，请直接编辑它本地的 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点——参见
[Approvals CLI](/zh-CN/cli/approvals)。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播
`exec.approval.requested`。Control UI 和 macOS 应用通过
`exec.approval.resolve` 处理它，然后 Gateway 网关再将已批准的请求转发给节点主机。

对于 `host=node`，审批请求会包含一个规范化的 `systemRunPlan`
载荷。Gateway 网关在转发已批准的 `system.run`
请求时，会将该计划用作权威的命令 / cwd / 会话上下文。

这对异步审批延迟很重要：

- 节点执行路径会预先准备一个规范化计划。
- 审批记录会存储该计划及其绑定元数据。
- 一旦获得批准，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任调用方后续的修改。
- 如果调用方在审批请求创建后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会将转发的执行拒绝为审批不匹配。

## 系统事件

执行生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。
- `Exec denied`。

这些消息会在节点上报事件后发布到智能体的会话中。
Gateway 网关主机执行审批在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，也可在运行中发出）。
受审批门控的执行会在这些消息中复用审批 id 作为 `runId`，以便轻松关联。

## 审批被拒绝时的行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体在该会话中复用此前同一命令任意早先执行的输出。
拒绝原因会附带明确说明，指出没有可用的命令输出，这可以阻止智能体声称存在新输出，或使用先前成功执行留下的陈旧结果重复被拒绝的命令。

## 影响

- **`full`** 权限很强；尽可能优先使用允许列表。
- **`ask`** 让你保持在回路中，同时仍允许快速审批。
- 按智能体划分的允许列表可防止某个智能体的审批泄漏到其他智能体。
- 审批只适用于来自**已授权发送方**的主机执行请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。若要硬性阻止主机执行，请将审批安全级别设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="执行审批——高级" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全 bin、解释器绑定，以及向聊天转发审批。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="提升权限模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过审批的紧急放行路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式与工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱 vs 工具策略 vs 提升权限" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用每一种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skill 支持的自动允许行为。
  </Card>
</CardGroup>
