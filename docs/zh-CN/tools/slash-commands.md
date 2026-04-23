---
read_when:
    - 使用或配置聊天命令
    - 调试命令路由或权限
summary: Slash Commands：文本与原生命令、配置及支持的命令
title: Slash Commands
x-i18n:
    generated_at: "2026-04-23T21:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d525afb81228192c75e44c30bc3229aa7f27cb3ecea7e28ac21ae8168890d82
    source_path: tools/slash-commands.md
    workflow: 15
---

命令由 Gateway 网关处理。大多数命令都必须作为**独立**消息发送，并且以 `/` 开头。
仅限主机的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是其别名）。

这里有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令会在模型看到消息之前从消息中移除。
  - 在普通聊天消息中（不是纯指令消息），它们会被视为“内联提示”，并且**不会**持久化会话设置。
  - 在纯指令消息中（消息只包含指令），它们会持久化到会话中，并返回确认回复。
  - 指令仅对**已授权发送者**生效。如果设置了 `commands.allowFrom`，它就是唯一使用的
    允许列表；否则授权来源于渠道允许列表/配对，加上 `commands.useAccessGroups`。
    未授权发送者会看到指令被当作普通文本处理。

还有一些**内联快捷方式**（仅对 allowlisted/已授权发送者生效）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们会立即运行，并在模型看到消息之前被移除，其余文本则继续按正常流程处理。

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
  - 在没有原生命令的表面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将其设为 `false`，文本命令仍然可用。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - 自动模式：对 Discord/Telegram 启用；对 Slack 关闭（直到你添加 slash commands）；对不支持原生命令的提供商忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 会在启动时清除先前在 Discord/Telegram 上注册的命令。Slack 命令由 Slack app 管理，不会自动移除。
- `commands.nativeSkills`（默认 `"auto"`）在支持时以原生方式注册 **skill** 命令。
  - 自动模式：对 Discord/Telegram 启用；对 Slack 关闭（Slack 要求为每个 skill 创建一个 slash command）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；要求 `tools.elevated` allowlist）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式前等待多久（`0` 表示立即放入后台）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取/写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现/状态，以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.restart`（默认 `true`）启用 `/restart` 以及 gateway restart 工具操作。
- `commands.ownerAllowFrom`（可选）为仅限 owner 的命令/工具表面设置显式 owner 允许列表。它与 `commands.allowFrom` 分开。
- 按渠道的 `channels.<channel>.commands.enforceOwnerForCommands`（可选，默认 `false`）会让该表面上的仅限 owner 命令要求 **owner 身份** 才能运行。为 `true` 时，发送者必须要么匹配某个已解析的 owner 候选（例如 `commands.ownerAllowFrom` 中的条目或提供商原生 owner 元数据），要么在内部消息渠道上持有内部 `operator.admin` scope。渠道 `allowFrom` 中的通配符条目，或空的/无法解析的 owner 候选列表，**都不足以**满足条件 —— 仅限 owner 的命令会在该渠道上以失败关闭方式处理。如果你希望仅限 owner 的命令只由 `ownerAllowFrom` 和标准命令 allowlist 控制，请保持此项关闭。
- `commands.ownerDisplay` 控制 owner id 在系统提示中的显示方式：`raw` 或 `hash`。
- `commands.ownerDisplaySecret` 可选，用于在 `commands.ownerDisplay="hash"` 时设置 HMAC 密钥。
- `commands.allowFrom`（可选）为命令授权设置按提供商的允许列表。配置后，它就是命令和指令的唯一授权来源（渠道 allowlist/配对以及 `commands.useAccessGroups` 都会被忽略）。使用 `"*"` 作为全局默认值；提供商专用键会覆盖它。
- `commands.useAccessGroups`（默认 `true`）会在未设置 `commands.allowFrom` 时，对命令强制执行 allowlist/策略。

## 命令列表

当前事实来源：

- core 内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- 插件命令来自插件的 `registerCommand()` 调用
- 你网关上的实际可用性仍取决于配置标志、渠道表面，以及已安装/已启用的插件

### Core 内置命令

当前可用的内置命令：

- `/new [model]` 启动一个新会话；`/reset` 是重置别名。
- `/reset soft [message]` 保留当前 transcript，丢弃复用的 CLI 后端会话 id，并原地重新运行启动/系统提示加载。
- `/compact [instructions]` 压缩会话上下文。参见 [/concepts/compaction](/zh-CN/concepts/compaction)。
- `/stop` 中止当前运行。
- `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期。
- `/think <level>` 设置 thinking 级别。可选值来自当前活动模型的提供商 profile；常见级别包括 `off`、`minimal`、`low`、`medium` 和 `high`，也支持 `xhigh`、`adaptive`、`max` 或仅二值 `on` 等自定义级别（仅在支持处可用）。别名：`/thinking`、`/t`。
- `/verbose on|off|full` 切换 verbose 输出。别名：`/v`。
- `/trace on|off` 切换当前会话的插件 trace 输出。
- `/fast [status|on|off]` 显示或设置 fast mode。
- `/reasoning [on|off|stream]` 切换 reasoning 可见性。别名：`/reason`。
- `/elevated [on|off|ask|full]` 切换 elevated 模式。别名：`/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
- `/model [name|#|status]` 显示或设置模型。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出提供商，或列出某个提供商的模型。
- `/queue <mode>` 管理队列行为（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`），以及像 `debounce:2s cap:25 drop:summarize` 这样的选项。
- `/help` 显示简短帮助摘要。
- `/commands` 显示生成的命令目录。
- `/tools [compact|verbose]` 显示当前智能体此刻可以使用什么。
- `/status` 显示运行时状态，包括 `Runtime`/`Runner` 标签，以及在可用时显示提供商使用量/配额。
- `/tasks` 列出当前会话的活动/最近后台任务。
- `/context [list|detail|json]` 解释上下文是如何组装的。
- `/export-session [path]` 将当前会话导出为 HTML。别名：`/export`。
- `/export-trajectory [path]` 为当前会话导出 JSONL [trajectory bundle](/zh-CN/tools/trajectory)。别名：`/trajectory`。
- `/whoami` 显示你的发送者 id。别名：`/id`。
- `/skill <name> [input]` 按名称运行某个 skill。
- `/allowlist [list|add|remove] ...` 管理 allowlist 条目。仅文本命令。
- `/approve <id> <decision>` 处理 exec approval 提示。
- `/btw <question>` 提出一个顺手问题，而不改变未来会话上下文。参见 [/tools/btw](/zh-CN/tools/btw)。
- `/subagents list|kill|log|info|send|steer|spawn` 管理当前会话的子智能体运行。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 会话和运行时选项。
- `/focus <target>` 将当前 Discord 线程或 Telegram 话题/会话绑定到某个会话目标。
- `/unfocus` 移除当前绑定。
- `/agents` 列出当前会话的线程绑定智能体。
- `/kill <id|#|all>` 中止一个或全部正在运行的子智能体。
- `/steer <id|#> <message>` 向正在运行的子智能体发送 steering。别名：`/tell`。
- `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅限 owner。要求 `commands.config: true`。
- `/mcp show|get|set|unset` 读取或写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置。仅限 owner。要求 `commands.mcp: true`。
- `/plugins list|inspect|show|get|install|enable|disable` 检查或修改插件状态。`/plugin` 是别名。写操作仅限 owner。要求 `commands.plugins: true`。
- `/debug show|set|unset|reset` 管理仅运行时的配置覆盖。仅限 owner。要求 `commands.debug: true`。
- `/usage off|tokens|full|cost` 控制每次响应的 usage 页脚，或打印本地成本摘要。
- `/tts on|off|status|provider|limit|summary|audio|help` 控制 TTS。参见 [/tools/tts](/zh-CN/tools/tts)。
- `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 可禁用。
- `/activation mention|always` 设置群组激活模式。
- `/send on|off|inherit` 设置发送策略。仅限 owner。
- `/bash <command>` 运行主机 shell 命令。仅文本命令。别名：`! <command>`。要求 `commands.bash: true`，以及 `tools.elevated` allowlist。
- `!poll [sessionId]` 检查后台 bash 作业。
- `!stop [sessionId]` 停止后台 bash 作业。

### 生成的 dock 命令

Dock 命令由支持原生命令的渠道插件生成。当前内置集合包括：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

### 内置插件命令

内置插件可以添加更多 slash 命令。当前此仓库中的内置命令包括：

- `/dreaming [on|off|status|help]` 切换 memory dreaming。参见 [Dreaming](/zh-CN/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [Pairing](/zh-CN/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机 node 命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名是 `/talkvoice`。
- `/card ...` 发送 LINE 富卡片预设。参见 [LINE](/zh-CN/channels/line)。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` 检查和控制内置 Codex app-server harness。参见 [Codex Harness](/zh-CN/plugins/codex-harness)。
- 仅 QQ Bot 的命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 skill 命令

用户可调用的 Skills 也会暴露为 slash 命令：

- `/skill <name> [input]` 始终可作为通用入口点使用。
- skill 也可能以直接命令的形式出现，例如 `/prose`，前提是该 skill/插件注册了它们。
- 原生 skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。

说明：

- 命令在命令名与参数之间可以接受一个可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 可接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配项，则该文本会被视为消息正文。
- 若要查看完整的提供商使用量明细，请使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true`，并遵循渠道 `configWrites`。
- 在多账户渠道中，以配置为目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也会遵循目标账户的 `configWrites`。
- `/usage` 控制每次响应的 usage 页脚；`/usage cost` 会根据 OpenClaw 会话日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 可禁用。
- `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/归档、npm package 或 `clawhub:<pkg>`。
- `/plugins enable|disable` 会更新插件配置，并可能提示你重启。
- 仅限 Discord 的原生命令：`/vc join|leave|status` 用于控制语音频道（要求启用 `channels.discord.voice` 和原生命令；不提供文本版本）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）要求已有效启用线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为：参见 [ACP Agents](/zh-CN/tools/acp-agents)。
- `/verbose` 主要用于调试和额外可见性；在正常使用中请保持**关闭**。
- `/trace` 比 `/verbose` 更窄：它只暴露插件自有的 trace/debug 行，并保持普通 verbose 工具噪声关闭。
- `/fast on|off` 会持久化一个会话覆盖。使用 Sessions UI 的 `inherit` 选项可清除它，并回退到配置默认值。
- `/fast` 是提供商专用的：OpenAI/OpenAI Codex 会将其映射到原生 Responses 端点上的 `service_tier=priority`，而直接发送到 `api.anthropic.com` 的公开 Anthropic 请求（包括 OAuth 认证流量）则会将其映射为 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/zh-CN/providers/openai) 和 [Anthropic](/zh-CN/providers/anthropic)。
- 相关时仍会显示工具失败摘要，但详细失败文本只有在 `/verbose` 为 `on` 或 `full` 时才会包含。
- `/reasoning`、`/verbose` 和 `/trace` 在群组环境中有风险：它们可能会泄露你本不想暴露的内部推理、工具输出或插件诊断信息。尤其是在群聊中，最好保持关闭。
- `/model` 会立即持久化新的会话模型。
- 如果智能体当前空闲，则下一次运行会立即使用它。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并仅在干净的重试点才重启进入新模型。
- 如果工具活动或回复输出已经开始，则该待处理切换可能会一直排队，直到后续某个重试机会或下一个用户轮次。
- **快速路径：** 来自 allowlisted 发送者的纯命令消息会被立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自 allowlisted 发送者的纯命令消息会绕过提及要求。
- **内联快捷方式（仅限 allowlisted 发送者）：** 某些命令在嵌入普通消息时也能生效，并会在模型看到剩余文本前被移除。
  - 示例：`hey /status` 会触发一条状态回复，而剩余文本继续按正常流程处理。
- 当前包括：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的纯命令消息会被静默忽略，而内联 `/...` token 则会被视为普通文本。
- **Skill 命令：** `user-invocable` Skills 也会作为 slash 命令暴露出来。名称会被净化为 `a-z0-9_`（最大 32 个字符）；冲突项会加上数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行某个 skill（当原生命令上限阻止按 skill 单独建命令时很有用）。
  - 默认情况下，skill 命令会作为普通请求转发给模型。
  - Skills 也可以选择声明 `command-dispatch: tool`，以便将命令直接路由给工具（确定性、无需模型）。
  - 示例：`/prose`（OpenProse 插件）—— 参见 [OpenProse](/zh-CN/prose)。
- **原生命令参数：** Discord 对动态选项使用自动补全（当你省略必填参数时也会显示按钮菜单）。Telegram 和 Slack 会在某个命令支持可选值且你省略该参数时显示按钮菜单。

## `/tools`

`/tools` 回答的是一个运行时问题，而不是配置问题：**这个智能体此刻在
这个对话中能使用什么**。

- 默认的 `/tools` 是紧凑模式，针对快速浏览进行了优化。
- `/tools verbose` 会添加简短描述。
- 支持参数的原生命令表面也会将相同的模式切换暴露为 `compact|verbose`。
- 结果是按会话作用域的，因此更改智能体、渠道、线程、发送者授权或模型都可能
  改变输出。
- `/tools` 包含运行时真正可达的工具，包括 core 工具、已连接的
  插件工具和渠道自有工具。

对于 profile 和覆盖编辑，请使用 Control UI Tools 面板或配置/目录表面，
而不要把 `/tools` 当作静态目录。

## 使用量表面（各处显示什么）

- **提供商使用量/配额**（例如：“Claude 80% left”）会在 `/status` 中显示，针对当前模型提供商，前提是启用了使用量跟踪。OpenClaw 会将提供商窗口规范化为 `% left`；对于 MiniMax，仅表示剩余百分比的字段会在显示前被反转，而 `model_remains` 响应会优先采用 chat-model 条目并附带带模型标签的 plan 标签。
- `/status` 中的 **token/cache 行** 可以在实时会话快照稀疏时回退到最新 transcript 使用条目。现有的非零实时值仍然优先，并且 transcript 回退还可以恢复活动运行时模型标签，以及在已存总数缺失或更小时恢复更大的、面向提示的总数。
- **Runtime 与 Runner：** `/status` 会报告 `Runtime` 作为实际执行路径和沙箱状态，而 `Runner` 则表示究竟是谁在运行该会话：内嵌 Pi、CLI 支持的提供商，还是 ACP harness/backend。
- **每次响应的 token/成本** 由 `/usage off|tokens|full` 控制（追加在普通回复后面）。
- `/model status` 关注的是**模型/认证/端点**，而不是使用量。

## 模型选择（`/model`）

`/model` 是作为指令实现的。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.5
/model opus@anthropic:default
/model status
```

说明：

- `/model` 和 `/model list` 会显示紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉框以及 Submit 步骤。
- `/model <#>` 会从该选择器中选择（并在可能时优先使用当前提供商）。
- `/model status` 会显示详细视图，包括已配置的提供商端点（`baseUrl`）和 API 模式（`api`），如果可用的话。

## 调试覆盖

`/debug` 允许你设置**仅运行时**的配置覆盖（存于内存，不写磁盘）。仅限 owner。默认禁用；通过 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

说明：

- 覆盖会立即应用到新的配置读取中，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 可清除所有覆盖，并恢复到磁盘上的配置。

## 插件 trace 输出

`/trace` 允许你在**按会话作用域**下切换插件 trace/debug 行，而无需打开完整 verbose 模式。

示例：

```text
/trace
/trace on
/trace off
```

说明：

- 不带参数的 `/trace` 会显示当前会话的 trace 状态。
- `/trace on` 会为当前会话启用插件 trace 行。
- `/trace off` 会再次禁用它们。
- 插件 trace 行可能出现在 `/status` 中，也可能作为普通 assistant 回复后的附加诊断消息出现。
- `/trace` 不能替代 `/debug`；`/debug` 仍然负责管理仅运行时配置覆盖。
- `/trace` 也不能替代 `/verbose`；普通 verbose 工具/状态输出仍属于 `/verbose`。

## 配置更新

`/config` 会写入你的磁盘配置（`openclaw.json`）。仅限 owner。默认禁用；通过 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

说明：

- 写入前会先校验配置；无效更改会被拒绝。
- `/config` 更新会在重启后继续保留。

## MCP 更新

`/mcp` 会写入 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器定义。仅限 owner。默认禁用；通过 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

说明：

- `/mcp` 会把配置存储在 OpenClaw 配置中，而不是 Pi 自有的项目设置中。
- 实际支持哪些传输由运行时适配器决定。

## 插件更新

`/plugins` 允许操作员检查已发现的插件，并在配置中切换启用状态。只读流程可使用 `/plugin` 作为别名。默认禁用；通过 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

说明：

- `/plugins list` 和 `/plugins show` 会针对当前工作区 + 磁盘配置执行真实的插件发现。
- `/plugins enable|disable` 只会更新插件配置；不会安装或卸载插件。
- 完成启用/禁用更改后，请重启 gateway 以生效。

## 表面说明

- **文本命令** 会在普通聊天会话中运行（私信共享 `main`，群组拥有自己的会话）。
- **原生命令** 使用隔离会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 指向聊天会话）
- **`/stop`** 会针对活动聊天会话，因此它可以中止当前运行。
- **Slack：** `channels.slack.slashCommand` 仍支持单个 `/openclaw` 风格命令。如果你启用了 `commands.native`，则必须为每个内置命令在 Slack 中创建一个 slash command（名称与 `/help` 等命令相同）。Slack 的命令参数菜单会以临时 Block Kit 按钮的形式交付。
  - Slack 原生命令例外：应注册 `/agentstatus`（而不是 `/status`），因为 Slack 保留了 `/status`。文本版 `/status` 在 Slack 消息中仍然可用。

## BTW 顺手问题

`/btw` 是一种针对当前会话的快速**顺手问题**。

与普通聊天不同：

- 它会将当前会话作为背景上下文，
- 它会作为一次独立的**无工具**单次调用运行，
- 它不会改变未来的会话上下文，
- 它不会写入 transcript 历史，
- 它会作为实时侧边结果交付，而不是普通 assistant 消息。

这让 `/btw` 非常适合在主
任务继续进行的同时，获取一个临时澄清。

示例：

```text
/btw what are we doing right now?
```

完整行为和客户端用户体验细节请参见 [BTW 顺手问题](/zh-CN/tools/btw)。
