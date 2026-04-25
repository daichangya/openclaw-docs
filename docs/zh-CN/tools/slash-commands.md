---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
summary: 斜杠命令：文本与原生、配置以及支持的命令
title: 斜杠命令
x-i18n:
    generated_at: "2026-04-25T08:03:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: bab969a72f10880b88a75a7a0cc7870989c826fbf7e9b8637a558cc29cfcc417
    source_path: tools/slash-commands.md
    workflow: 15
---

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。
仅主机可用的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是它的别名）。

这里有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令会在模型看到消息之前从消息中剥离。
  - 在普通聊天消息中（不是仅包含指令的消息），它们会被视为“内联提示”，并且**不会**持久化会话设置。
  - 在仅包含指令的消息中（消息只包含指令），它们会持久化到会话中，并回复一条确认消息。
  - 指令仅对**已授权发送者**生效。如果设置了 `commands.allowFrom`，它就是唯一使用的允许列表；否则，授权来自渠道允许列表/配对以及 `commands.useAccessGroups`。
    未授权发送者会看到这些指令被当作普通文本处理。

还有一些**内联快捷方式**（仅限已列入允许列表/已授权的发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们会立即运行，在模型看到消息之前被剥离，剩余文本则继续走正常流程。

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
  - 在不支持原生命令的界面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将其设置为 `false`，文本命令仍然可用。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - 自动：在 Discord/Telegram 上开启；在 Slack 上关闭（直到你添加斜杠命令）；对不支持原生支持的提供商会被忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 会在启动时清除先前已在 Discord/Telegram 上注册的命令。Slack 命令在 Slack 应用中管理，不会被自动移除。
- `commands.nativeSkills`（默认 `"auto"`）会在支持时以原生方式注册 **Skills** 命令。
  - 自动：在 Discord/Telegram 上开启；在 Slack 上关闭（Slack 需要为每个 Skill 单独创建一个斜杠命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许列表）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式前等待多长时间（`0` 表示立即转入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取/写入由 OpenClaw 管理的、位于 `mcp.servers` 下的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.restart`（默认 `true`）启用 `/restart` 以及 Gateway 网关重启工具操作。
- `commands.ownerAllowFrom`（可选）为仅限所有者的命令/工具界面设置显式所有者允许列表。这与 `commands.allowFrom` 是分开的。
- 每个渠道的 `channels.<channel>.commands.enforceOwnerForCommands`（可选，默认 `false`）会使仅限所有者的命令在该界面上运行时要求**所有者身份**。当其为 `true` 时，发送者必须匹配一个已解析的所有者候选项（例如 `commands.ownerAllowFrom` 中的某个条目，或提供商原生的所有者元数据），或者在内部消息渠道上持有内部 `operator.admin` 作用域。渠道 `allowFrom` 中的通配符条目，或空的/无法解析的所有者候选列表，**都不**足够——仅限所有者的命令会在该渠道上默认拒绝。若你希望仅限所有者的命令只受 `ownerAllowFrom` 和标准命令允许列表控制，请保持此项关闭。
- `commands.ownerDisplay` 控制系统提示中所有者 ID 的显示方式：`raw` 或 `hash`。
- `commands.ownerDisplaySecret` 可选设置在 `commands.ownerDisplay="hash"` 时使用的 HMAC 密钥。
- `commands.allowFrom`（可选）为命令授权设置按提供商区分的允许列表。配置后，它将成为命令和指令的唯一授权来源（渠道允许列表/配对和 `commands.useAccessGroups` 会被忽略）。使用 `"*"` 作为全局默认值；提供商特定键会覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时，对命令强制执行允许列表/策略。

## 命令列表

当前唯一真实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件中的 `registerCommand()` 调用
- 你的 Gateway 网关上的实际可用性仍取决于配置标志、渠道界面以及已安装/已启用的插件

### 核心内置命令

今天可用的内置命令：

- `/new [model]` 启动新会话；`/reset` 是重置别名。
- `/reset soft [message]` 保留当前对话记录，丢弃复用的 CLI 后端会话 ID，并在原地重新运行启动/系统提示加载。
- `/compact [instructions]` 压缩会话上下文。参见 [/concepts/compaction](/zh-CN/concepts/compaction)。
- `/stop` 中止当前运行。
- `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期。
- `/think <level>` 设置思考级别。可用选项来自当前模型的提供商配置文件；常见级别有 `off`、`minimal`、`low`、`medium` 和 `high`，也包括仅在支持时可用的自定义级别，例如 `xhigh`、`adaptive`、`max`，或二元 `on`。别名：`/thinking`、`/t`。
- `/verbose on|off|full` 切换详细输出。别名：`/v`。
- `/trace on|off` 为当前会话切换插件跟踪输出。
- `/fast [status|on|off]` 显示或设置快速模式。
- `/reasoning [on|off|stream]` 切换推理可见性。别名：`/reason`。
- `/elevated [on|off|ask|full]` 切换提升模式。别名：`/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
- `/model [name|#|status]` 显示或设置模型。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商，或列出某个提供商的模型。
- `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及诸如 `debounce:2s cap:25 drop:summarize` 之类的选项。
- `/help` 显示简短帮助摘要。
- `/commands` 显示生成的命令目录。
- `/tools [compact|verbose]` 显示当前智能体此刻可以使用的内容。
- `/status` 显示执行/运行时状态，包括 `Execution`/`Runtime` 标签，以及在可用时显示提供商用量/配额。
- `/crestodian <request>` 从所有者私信运行 Crestodian 设置与修复助手。
- `/tasks` 列出当前会话中活跃/最近的后台任务。
- `/context [list|detail|json]` 说明上下文是如何组装的。
- `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
- `/export-trajectory [path]` 为当前会话导出一个 JSONL [trajectory bundle](/zh-CN/tools/trajectory)。别名：`/trajectory`。
- `/whoami` 显示你的发送者 ID。别名：`/id`。
- `/skill <name> [input]` 按名称运行一个 Skill。
- `/allowlist [list|add|remove] ...` 管理允许列表条目。仅文本命令。
- `/approve <id> <decision>` 处理 exec 审批提示。
- `/btw <question>` 提出一个旁支问题，而不会改变未来的会话上下文。参见 [/tools/btw](/zh-CN/tools/btw)。
- `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
- `/focus <target>` 将当前 Discord 线程或 Telegram 话题/对话绑定到一个会话目标。
- `/unfocus` 移除当前绑定。
- `/agents` 列出当前会话中绑定到线程的智能体。
- `/kill <id|#|all>` 中止一个或所有正在运行的子智能体。
- `/steer <id|#> <message>` 向一个正在运行的子智能体发送引导。别名：`/tell`。
- `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限所有者。需要 `commands.config: true`。
- `/mcp show|get|set|unset` 读取或写入由 OpenClaw 管理的、位于 `mcp.servers` 下的 MCP 服务器配置。仅限所有者。需要 `commands.mcp: true`。
- `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写操作仅限所有者。需要 `commands.plugins: true`。
- `/debug show|set|unset|reset` 管理仅运行时配置覆盖。仅限所有者。需要 `commands.debug: true`。
- `/usage off|tokens|full|cost` 控制每次响应的用量页脚，或打印本地成本摘要。
- `/tts on|off|status|provider|limit|summary|audio|help` 控制 TTS。参见 [/tools/tts](/zh-CN/tools/tts)。
- `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用。
- `/activation mention|always` 设置群组激活模式。
- `/send on|off|inherit` 设置发送策略。仅限所有者。
- `/bash <command>` 运行主机 shell 命令。仅文本命令。别名：`! <command>`。需要 `commands.bash: true`，并且在 `tools.elevated` 允许列表中。
- `!poll [sessionId]` 检查后台 bash 作业。
- `!stop [sessionId]` 停止后台 bash 作业。

### 生成的 dock 命令

Dock 命令由支持原生命令的渠道插件生成。当前内置集合：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

### 内置插件命令

内置插件可以添加更多斜杠命令。此仓库中当前内置的命令：

- `/dreaming [on|off|status|help]` 切换 Memory Wiki dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称是 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查并控制内置的 Codex app-server harness。参见 [Codex harness](/zh-CN/plugins/codex-harness)。
- 仅限 QQ Bot 的命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 Skill 命令

用户可调用的 Skills 也会作为斜杠命令公开：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- Skills 也可能在 Skill/插件注册时显示为直接命令，例如 `/prose`。
- 原生 Skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

说明：

- 命令在命令与参数之间可接受可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配项，则该文本会被视为消息正文。
- 要查看完整的提供商用量明细，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道 `configWrites`。
- 在多账户渠道中，面向配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也会遵循目标账户的 `configWrites`。
- `/usage` 控制每条响应的用量页脚；`/usage cost` 会根据 OpenClaw 会话日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 可禁用它。
- `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/归档、npm 包或 `clawhub:<pkg>`。
- `/plugins enable|disable` 会更新插件配置，并且可能提示你重启。
- 仅限 Discord 的原生命令：`/vc join|leave|status` 控制语音频道（需要 `channels.discord.voice` 和原生命令；不提供文本形式）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求已启用有效线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为： [ACP Agents](/zh-CN/tools/acp-agents)。
- `/verbose` 用于调试和额外可见性；在正常使用中请保持其为**关闭**状态。
- `/trace` 比 `/verbose` 更窄：它只显示插件拥有的跟踪/调试行，并保持普通详细工具输出关闭。
- `/fast on|off` 会持久化一个会话覆盖。使用 Sessions UI 中的 `inherit` 选项可清除它，并回退到配置默认值。
- `/fast` 是提供商特定的：OpenAI/OpenAI Codex 会在原生 Responses 端点上将其映射到 `service_tier=priority`，而直接的公开 Anthropic 请求，包括发送到 `api.anthropic.com` 的 OAuth 身份验证流量，则会映射到 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
- 工具失败摘要在相关时仍会显示，但详细失败文本只会在 `/verbose` 为 `on` 或 `full` 时包含。
- `/reasoning`、`/verbose` 和 `/trace` 在群组场景中有风险：它们可能会暴露你本不打算公开的内部推理、工具输出或插件诊断信息。建议保持关闭，尤其是在群聊中。
- `/model` 会立即持久化新的会话模型。
- 如果智能体处于空闲状态，下一次运行会立即使用它。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在一个干净的重试点重启进入新模型。
- 如果工具活动或回复输出已经开始，这个待处理切换可能会一直排队，直到稍后的重试机会或下一次用户轮次。
- 在本地 TUI 中，`/crestodian [request]` 会从普通智能体 TUI 返回到
  Crestodian。这与消息渠道救援模式是分开的，也**不会**
  授予远程配置权限。
- **快速路径：** 来自允许列表发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自允许列表发送者的纯命令消息会绕过提及要求。
- **内联快捷方式（仅限允许列表发送者）：** 某些命令在嵌入普通消息时也能工作，并会在模型看到剩余内容前被剥离。
  - 示例：`hey /status` 会触发一条状态回复，而剩余文本会继续走正常流程。
- 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的纯命令消息会被静默忽略，而内联 `/...` 标记会被当作普通文本处理。
- **Skill 命令：** `user-invocable` 的 Skills 会作为斜杠命令公开。名称会被清洗为 `a-z0-9_`（最多 32 个字符）；冲突时会添加数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行一个 Skill（当原生命令限制阻止按 Skill 单独建命令时，这很有用）。
  - 默认情况下，Skill 命令会作为普通请求转发给模型。
  - Skills 也可以选择声明 `command-dispatch: tool`，将命令直接路由到工具（确定性、无模型）。
  - 示例：`/prose`（OpenProse 插件）——参见 [OpenProse](/zh-CN/prose)。
- **原生命令参数：** Discord 对动态选项使用自动补全（而当你省略必填参数时，则使用按钮菜单）。Telegram 和 Slack 会在某个命令支持选项且你省略该参数时显示按钮菜单。

## `/tools`

`/tools` 回答的是一个运行时问题，而不是一个配置问题：**这个智能体现在在
这段对话中能使用什么**。

- 默认的 `/tools` 是紧凑模式，并针对快速浏览做了优化。
- `/tools verbose` 会添加简短说明。
- 支持参数的原生命令界面会公开相同的模式切换，即 `compact|verbose`。
- 结果是会话范围的，因此更改智能体、渠道、线程、发送者授权或模型都可能
  改变输出。
- `/tools` 包含在运行时实际可达的工具，包括核心工具、已连接的
  插件工具，以及渠道拥有的工具。

对于配置文件和覆盖项编辑，请使用 Control UI Tools 面板或配置/目录界面，
而不要将 `/tools` 视为静态目录。

## 用量界面（各处显示内容）

- **提供商用量/配额**（例如：“Claude 剩余 80%”）会在启用用量跟踪时显示在当前模型提供商的 `/status` 中。OpenClaw 会将提供商窗口统一规范为“剩余百分比”；对于 MiniMax，只有剩余值的百分比字段会在显示前反转，而 `model_remains` 响应会优先选择聊天模型条目以及带模型标记的计划标签。
- `/status` 中的 **token/缓存行** 在实时会话快照信息较少时，可以回退到最新的对话记录用量条目。现有的非零实时值仍然优先，而对话记录回退也可以在存储总量缺失或较小时恢复当前活动运行时模型标签以及更偏向提示词的总量。
- **Execution 与 Runtime：** `/status` 会用 `Execution` 报告有效沙箱路径，并用 `Runtime` 报告实际运行该会话的是谁：`OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端，或 ACP 后端。
- **每条响应的 token/成本** 由 `/usage off|tokens|full` 控制（附加到正常回复后）。
- `/model status` 关注的是**模型/凭证/端点**，而不是用量。

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

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，带有提供商和模型下拉菜单以及提交步骤。
- `/model <#>` 会从该选择器中进行选择（并在可能时优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用。

## 调试覆盖

`/debug` 允许你设置**仅运行时**配置覆盖（内存中，不写磁盘）。仅限所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

说明：

- 覆盖项会立即应用到新的配置读取中，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 清除所有覆盖项，并恢复到磁盘上的配置。

## 插件跟踪输出

`/trace` 允许你在不启用完整详细模式的情况下，切换**会话范围的插件跟踪/调试行**。

示例：

```text
/trace
/trace on
/trace off
```

说明：

- 不带参数的 `/trace` 会显示当前会话的跟踪状态。
- `/trace on` 会为当前会话启用插件跟踪行。
- `/trace off` 会再次禁用它们。
- 插件跟踪行可能出现在 `/status` 中，也可能作为正常助手回复后的后续诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍用于管理仅运行时配置覆盖。
- `/trace` 不能替代 `/verbose`；普通的详细工具/状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你的磁盘配置（`openclaw.json`）。仅限所有者。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

说明：

- 写入前会校验配置；无效更改会被拒绝。
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

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。
- 运行时适配器决定哪些传输协议实际上可执行。

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

说明：

- `/plugins list` 和 `/plugins show` 会根据当前工作区和磁盘配置执行真实的插件发现。
- `/plugins enable|disable` 只会更新插件配置；它不会安装或卸载插件。
- 在启用/禁用更改后，请重启 Gateway 网关以应用它们。

## 界面说明

- **文本命令** 在正常聊天会话中运行（私信共享 `main`，群组有各自独立的会话）。
- **原生命令** 使用隔离会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 指向聊天会话）
- **`/stop`** 以活动聊天会话为目标，因此可以中止当前运行。
- **Slack：** `channels.slack.slashCommand` 仍支持单个 `/openclaw` 风格命令。如果你启用 `commands.native`，则必须为每个内置命令创建一个 Slack 斜杠命令（名称与 `/help` 等相同）。Slack 的命令参数菜单以临时 Block Kit 按钮形式提供。
  - Slack 原生命令例外：注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留 `/status`。文本形式的 `/status` 在 Slack 消息中仍然可用。

## BTW 旁支问题

`/btw` 是一个关于当前会话的快速**旁支问题**。

与普通聊天不同：

- 它会将当前会话用作背景上下文，
- 它会作为一次独立的**无工具**单次调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入对话记录历史，
- 它会作为实时旁支结果交付，而不是普通助手消息。

这使得 `/btw` 在你想要一个临时澄清、同时主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
```

完整行为和客户端 UX 细节请参见 [BTW Side Questions](/zh-CN/tools/btw)。

## 相关内容

- [Skills](/zh-CN/tools/skills)
- [Skills 配置](/zh-CN/tools/skills-config)
- [创建 Skills](/zh-CN/tools/creating-skills)
