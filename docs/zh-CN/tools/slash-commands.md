---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
summary: 斜杠命令：文本版与原生版、配置以及受支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-04-23T06:43:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d591ba4e692d77ca5b4549987ad9db557fc5c6d00a3f152381b74eae73c4ea81
    source_path: tools/slash-commands.md
    workflow: 15
---

# 斜杠命令

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。
仅限主机的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

这里有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令会在模型看到消息之前从消息中剥离。
  - 在普通聊天消息中（非纯指令消息），它们会被视为“内联提示”，且**不会**持久化会话设置。
  - 在纯指令消息中（消息只包含指令），它们会持久化到会话，并回复一条确认信息。
  - 指令只会应用于**已授权发送者**。如果设置了 `commands.allowFrom`，它就是唯一使用的
    allowlist；否则授权来自渠道 allowlist/配对以及 `commands.useAccessGroups`。
    未授权发送者会看到指令被当作普通文本处理。

还有少量**内联快捷命令**（仅限 allowlist/已授权发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们会立即运行，在模型看到消息前被剥离，剩余文本会继续走正常流程。

## 配置

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（默认 `true`）启用在聊天消息中解析 `/...`。
  - 在没有原生命令的界面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将其设为 `false`，文本命令仍然可用。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - Auto：Discord/Telegram 上开启；Slack 上关闭（直到你添加 slash commands）；对于不支持原生能力的提供商会被忽略。
  - 可设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native`，以按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 会在启动时清除 Discord/Telegram 上先前注册的命令。Slack 命令在 Slack 应用中管理，不会自动移除。
- `commands.nativeSkills`（默认 `"auto"`）会在支持时以原生方式注册 **skill** 命令。
  - Auto：Discord/Telegram 上开启；Slack 上关闭（Slack 需要为每个 skill 单独创建一个 slash command）。
  - 可设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills`，以按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` allowlist）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式前等待多久（`0` 表示立即转入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取/写入由 OpenClaw 管理的 `mcp.servers` 下的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.restart`（默认 `true`）启用 `/restart` 以及 Gateway 网关重启工具操作。
- `commands.ownerAllowFrom`（可选）为仅限所有者的命令/工具界面设置显式所有者 allowlist。这与 `commands.allowFrom` 是分开的。
- 每渠道的 `channels.<channel>.commands.enforceOwnerForCommands`（可选，默认 `false`）会让该界面上的仅限所有者命令必须由**所有者身份**才能运行。为 `true` 时，发送者必须匹配已解析的所有者候选项（例如 `commands.ownerAllowFrom` 中的条目或提供商原生所有者元数据），或者在内部消息渠道上持有内部 `operator.admin` 作用域。渠道 `allowFrom` 中的通配符条目，或空/未解析的所有者候选列表，**都不**足够——该渠道上的仅限所有者命令会以关闭默认放行的方式失败。如果你希望仅限所有者命令只受 `ownerAllowFrom` 和标准命令 allowlist 约束，请保持此项关闭。
- `commands.ownerDisplay` 控制系统提示中所有者 id 的显示方式：`raw` 或 `hash`。
- `commands.ownerDisplaySecret` 可选设置当 `commands.ownerDisplay="hash"` 时使用的 HMAC 密钥。
- `commands.allowFrom`（可选）为命令授权设置按提供商划分的 allowlist。配置后，它将成为命令和指令的唯一授权来源（渠道 allowlist/配对和 `commands.useAccessGroups` 会被忽略）。使用 `"*"` 作为全局默认值；提供商特定键会覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时，对命令强制执行 allowlist/策略。

## 命令列表

当前权威来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件的 `registerCommand()` 调用
- 你网关中的实际可用性仍取决于配置标志、渠道界面以及已安装/已启用的插件

### 核心内置命令

当前可用的内置命令：

- `/new [model]` 启动新会话；`/reset` 是重置别名。
- `/reset soft [message]` 保留当前转录，丢弃复用的 CLI 后端会话 id，并原地重新运行启动/系统提示加载。
- `/compact [instructions]` 压缩会话上下文。参见 [/concepts/compaction](/zh-CN/concepts/compaction)。
- `/stop` 中止当前运行。
- `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期。
- `/think <level>` 设置 thinking 级别。可选值来自活动模型的提供商配置文件；常见级别有 `off`、`minimal`、`low`、`medium` 和 `high`，也有仅在支持时可用的自定义级别，如 `xhigh`、`adaptive`、`max` 或二元值 `on`。别名：`/thinking`、`/t`。
- `/verbose on|off|full` 切换详细输出。别名：`/v`。
- `/trace on|off` 为当前会话切换插件跟踪输出。
- `/fast [status|on|off]` 显示或设置快速模式。
- `/reasoning [on|off|stream]` 切换 reasoning 可见性。别名：`/reason`。
- `/elevated [on|off|ask|full]` 切换 elevated 模式。别名：`/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
- `/model [name|#|status]` 显示或设置模型。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商或某个提供商下的模型。
- `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及如 `debounce:2s cap:25 drop:summarize` 之类的选项。
- `/help` 显示简要帮助摘要。
- `/commands` 显示生成的命令目录。
- `/tools [compact|verbose]` 显示当前智能体此刻可用的工具。
- `/status` 显示运行时状态，包括可用时的提供商使用量/配额。
- `/tasks` 列出当前会话活跃/最近的后台任务。
- `/context [list|detail|json]` 解释上下文是如何组装的。
- `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
- `/export-trajectory [path]` 为当前会话导出 JSONL 轨迹包。别名：`/trajectory`。
- `/whoami` 显示你的发送者 id。别名：`/id`。
- `/skill <name> [input]` 按名称运行一个 skill。
- `/allowlist [list|add|remove] ...` 管理 allowlist 条目。仅文本版。
- `/approve <id> <decision>` 处理 exec 审批提示。
- `/btw <question>` 提出一个旁支问题，但不改变未来会话上下文。参见 [/tools/btw](/zh-CN/tools/btw)。
- `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
- `/focus <target>` 将当前 Discord 线程或 Telegram 话题/会话绑定到一个会话目标。
- `/unfocus` 移除当前绑定。
- `/agents` 列出当前会话中线程绑定的智能体。
- `/kill <id|#|all>` 中止一个或所有正在运行的子智能体。
- `/steer <id|#> <message>` 向正在运行的子智能体发送引导。别名：`/tell`。
- `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限所有者。需要 `commands.config: true`。
- `/mcp show|get|set|unset` 读取或写入 OpenClaw 管理的 `mcp.servers` 下的 MCP 服务器配置。仅限所有者。需要 `commands.mcp: true`。
- `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写操作仅限所有者。需要 `commands.plugins: true`。
- `/debug show|set|unset|reset` 管理仅运行时配置覆盖。仅限所有者。需要 `commands.debug: true`。
- `/usage off|tokens|full|cost` 控制每次响应的使用量页脚，或打印本地成本摘要。
- `/tts on|off|status|provider|limit|summary|audio|help` 控制 TTS。参见 [/tools/tts](/zh-CN/tools/tts)。
- `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用。
- `/activation mention|always` 设置群组激活模式。
- `/send on|off|inherit` 设置发送策略。仅限所有者。
- `/bash <command>` 运行主机 shell 命令。仅文本版。别名：`! <command>`。需要 `commands.bash: true` 加 `tools.elevated` allowlist。
- `!poll [sessionId]` 检查后台 bash 作业。
- `!stop [sessionId]` 停止后台 bash 作业。

### 生成的 dock 命令

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

### 内置插件命令

内置插件可以添加更多斜杠命令。此仓库中当前的内置命令：

- `/dreaming [on|off|status|help]` 切换记忆 Dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名为 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查并控制内置 Codex app-server harness。参见 [Codex Harness](/zh-CN/plugins/codex-harness)。
- 仅 QQ Bot 命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 skill 命令

用户可调用的 Skills 也会作为斜杠命令暴露：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- 当 skill/插件注册了直接命令时，它们也可能显示为像 `/prose` 这样的直接命令。
- 原生 skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

说明：

- 命令接受一个可选的 `:` 作为命令与参数之间的分隔（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果未匹配到，则该文本会被视为消息正文。
- 如需完整的提供商使用量明细，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道 `configWrites`。
- 在多账户渠道中，面向配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也会遵循目标账户的 `configWrites`。
- `/usage` 控制每条响应的使用量页脚；`/usage cost` 会根据 OpenClaw 会话日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 可禁用。
- `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/归档、npm 包或 `clawhub:<pkg>`。
- `/plugins enable|disable` 会更新插件配置，并可能提示重启。
- 仅限 Discord 的原生命令：`/vc join|leave|status` 用于控制语音频道（需要 `channels.discord.voice` 和原生命令；文本版不可用）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求已有效启用线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为： [ACP Agents](/zh-CN/tools/acp-agents)。
- `/verbose` 用于调试和提供更多可见性；在正常使用中请保持**关闭**。
- `/trace` 比 `/verbose` 更窄：它只显示插件拥有的 trace/debug 行，并保持普通的详细工具输出关闭。
- `/fast on|off` 会持久化一个会话覆盖值。使用 Sessions UI 的 `inherit` 选项可清除该值并回退到配置默认值。
- `/fast` 具有提供商特异性：OpenAI/OpenAI Codex 会在原生 Responses 端点上将其映射为 `service_tier=priority`，而直接发往 `api.anthropic.com` 的公开 Anthropic 请求（包括通过 OAuth 认证发送的流量）则会将其映射为 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
- 工具失败摘要仍会在相关时显示，但详细失败文本只有在 `/verbose` 为 `on` 或 `full` 时才会包含。
- `/reasoning`、`/verbose` 和 `/trace` 在群组环境中具有风险：它们可能暴露你原本无意公开的内部推理、工具输出或插件诊断信息。建议保持关闭，尤其是在群聊中。
- `/model` 会立即持久化新的会话模型。
- 如果智能体处于空闲状态，下次运行会立即使用它。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，待处理切换可能会一直排队，直到后续的重试机会或下一个用户轮次。
- **快速路径：** 来自 allowlist 发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自 allowlist 发送者的纯命令消息会绕过提及要求。
- **内联快捷命令（仅限 allowlist 发送者）：** 某些命令在嵌入普通消息时也可工作，并会在模型看到剩余文本前被剥离。
  - 示例：`hey /status` 会触发一条状态回复，剩余文本继续按正常流程处理。
- 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的纯命令消息会被静默忽略，而内联 `/...` 令牌会被视为普通文本。
- **Skill 命令：** `user-invocable` 的 Skills 会暴露为斜杠命令。名称会被清理为 `a-z0-9_`（最多 32 个字符）；冲突时会追加数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行一个 skill（当原生命令限制阻止为每个 skill 创建单独命令时，这很有用）。
  - 默认情况下，skill 命令会作为普通请求转发给模型。
  - Skills 可以选择声明 `command-dispatch: tool`，将命令直接路由到某个工具（确定性，不经过模型）。
  - 示例：`/prose`（OpenProse 插件）—— 参见 [OpenProse](/zh-CN/prose)。
- **原生命令参数：** Discord 对动态选项使用自动补全（当你省略必需参数时，也会使用按钮菜单）。Telegram 和 Slack 则会在某个命令支持可选项且你省略该参数时显示一个按钮菜单。

## `/tools`

`/tools` 回答的是一个运行时问题，而不是配置问题：**这个智能体当前在
这段对话中实际能使用什么**。

- 默认的 `/tools` 是精简版，针对快速浏览进行了优化。
- `/tools verbose` 会添加简短说明。
- 支持参数的原生命令界面会以 `compact|verbose` 暴露相同的模式切换。
- 结果是会话范围的，因此更换智能体、渠道、线程、发送者授权或模型都可能
  改变输出。
- `/tools` 包括运行时实际可达的工具，包括核心工具、已连接的
  插件工具以及渠道自有工具。

对于配置文件和覆盖项编辑，请使用 Control UI 的 Tools 面板或配置/目录界面，
而不要把 `/tools` 当作静态目录。

## 使用量界面（各处显示内容）

- **提供商使用量/配额**（例如：“Claude 剩余 80%”）会在启用使用量跟踪时显示于当前模型提供商的 `/status` 中。OpenClaw 会将提供商窗口统一规范化为“剩余百分比”；对于 MiniMax，仅剩余量百分比字段会在显示前取反，而 `model_remains` 响应会优先选择聊天模型条目以及带模型标签的套餐标签。
- `/status` 中的 **token/cache 行** 在实时会话快照信息稀疏时，可以回退到最新的转录使用量条目。现有的非零实时值仍然优先，而转录回退还可以在存储总量缺失或更小时恢复活动运行时模型标签以及更大的、面向提示的总量。
- **每条响应的 token/成本** 由 `/usage off|tokens|full` 控制（附加到普通回复后）。
- `/model status` 关注的是**模型/认证/端点**，不是使用量。

## 模型选择（`/model`）

`/model` 被实现为一个指令。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

说明：

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型系列 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单以及 Submit 步骤。
- `/model <#>` 会从该选择器中进行选择（并尽可能优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用的话。

## Debug 覆盖项

`/debug` 允许你设置**仅运行时**的配置覆盖项（位于内存中，不写入磁盘）。仅限所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

说明：

- 覆盖项会立即应用于新的配置读取，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 清除所有覆盖项，并返回到磁盘上的配置。

## 插件 trace 输出

`/trace` 允许你切换**会话范围的插件 trace/debug 行**，而无需启用完整详细模式。

示例：

```text
/trace
/trace on
/trace off
```

说明：

- 不带参数的 `/trace` 会显示当前会话的 trace 状态。
- `/trace on` 为当前会话启用插件 trace 行。
- `/trace off` 会再次将其关闭。
- 插件 trace 行可以出现在 `/status` 中，也可以在普通助手回复之后作为一条后续诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍用于管理仅运行时的配置覆盖项。
- `/trace` 不能替代 `/verbose`；普通的详细工具/状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你磁盘上的配置（`openclaw.json`）。仅限所有者。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

说明：

- 写入前会对配置进行验证；无效更改会被拒绝。
- `/config` 更新会在重启后保留。

## MCP 更新

`/mcp` 会将 OpenClaw 管理的 MCP 服务器定义写入 `mcp.servers` 下。仅限所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

说明：

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 自有项目设置中。
- 运行时适配器决定哪些传输实际上可执行。

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可以使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

说明：

- `/plugins list` 和 `/plugins show` 会基于当前工作区和磁盘上的配置执行真实的插件发现。
- `/plugins enable|disable` 只会更新插件配置；不会安装或卸载插件。
- 启用/禁用变更后，请重启 gateway 以使其生效。

## 界面说明

- **文本命令** 在普通聊天会话中运行（私信共享 `main`，群组有各自的会话）。
- **原生命令** 使用隔离会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 指向聊天会话）
- **`/stop`** 以活动聊天会话为目标，因此它可以中止当前运行。
- **Slack：** `channels.slack.slashCommand` 仍支持用于单个 `/openclaw` 风格命令。如果你启用了 `commands.native`，则必须为每个内置命令创建一个 Slack slash command（名称与 `/help` 等相同）。Slack 的命令参数菜单会以临时的 Block Kit 按钮形式传递。
  - Slack 原生命令例外：请注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本版 `/status` 在 Slack 消息中仍然可用。

## BTW 旁支问题

`/btw` 是一个关于当前会话的快速**旁支问题**。

与普通聊天不同：

- 它会使用当前会话作为背景上下文，
- 它会以单独的**无工具**一次性调用运行，
- 它不会改变未来会话上下文，
- 它不会写入转录历史，
- 它会以实时旁支结果的形式交付，而不是普通助手消息。

这使得 `/btw` 在你希望主任务继续进行的同时，
临时获得一个澄清时非常有用。

示例：

```text
/btw what are we doing right now?
```

完整行为和客户端 UX 细节请参见 [BTW 旁支问题](/zh-CN/tools/btw)。
