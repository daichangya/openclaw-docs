---
read_when:
    - 调整心跳频率或消息内容
    - 为计划任务决定使用心跳还是 cron
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-22T05:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# 心跳（Gateway 网关）

> **心跳还是 Cron？** 请参阅 [Automation & Tasks](/zh-CN/automation)，了解何时应使用各自方案的指导。

心跳会在主会话中运行**周期性的智能体轮次**，让模型能够提示任何需要关注的事项，同时避免向你刷屏。

心跳是一次计划执行的主会话轮次——它**不会**创建 [后台任务](/zh-CN/automation/tasks) 记录。
任务记录用于脱离主会话的工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除： [Scheduled Tasks](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

1. 保持心跳启用状态（默认是 `30m`，对于 Anthropic OAuth/token 认证——包括 Claude CLI 复用——则为 `1h`），或设置你自己的频率。
2. 在智能体工作区中创建一个简短的 `HEARTBEAT.md` 检查清单或 `tasks:` 代码块（可选，但推荐）。
3. 决定心跳消息应发送到哪里（默认是 `target: "none"`；设置 `target: "last"` 可路由到最近一次联系对象）。
4. 可选：启用心跳推理内容投递以提高透明度。
5. 可选：如果心跳运行只需要 `HEARTBEAT.md`，可使用轻量级引导上下文。
6. 可选：启用隔离会话，避免每次心跳都发送完整的对话历史。
7. 可选：将心跳限制在活跃时段内（本地时间）。

示例配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确投递到最近一次联系对象（默认是 "none"）
        directPolicy: "allow", // 默认：允许直接/私信目标；设为 "block" 以禁止
        lightContext: true, // 可选：仅从引导文件中注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行都使用全新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：额外发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（当检测到 Anthropic OAuth/token 认证模式时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示词会**原样**作为用户消息发送。只有当默认智能体启用了心跳，并且此次运行在内部被标记为心跳时，系统提示词才会包含一个 “Heartbeat” 小节。
- 当使用 `0m` 禁用心跳时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，这样模型就不会看到仅供心跳使用的指令。
- 活跃时段（`heartbeat.activeHours`）会按配置的时区进行检查。
  在该时间窗口之外，心跳会被跳过，直到窗口内的下一个调度时刻。

## 心跳提示词的用途

默认提示词有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会促使智能体查看待跟进事项（收件箱、日历、提醒、排队中的工作），并提示任何紧急内容。
- **人工签到**：“Checkup sometimes on your human during day time” 会促使智能体偶尔发送轻量级的“你有什么需要吗？”消息，但会通过你配置的本地时区来避免夜间刷屏（见 [/concepts/timezone](/zh-CN/concepts/timezone)）。

心跳可以对已完成的 [后台任务](/zh-CN/automation/tasks) 作出反应，但心跳运行本身不会创建任务记录。

如果你希望某次心跳执行非常具体的事情（例如“检查 Gmail PubSub 统计”或“验证 Gateway 网关健康状态”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（将原样发送）。

## 响应约定

- 如果没有任何需要关注的内容，请回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，如果 `HEARTBEAT_OK` 出现在回复的**开头或结尾**，OpenClaw 会将其视为确认信号。该标记会被移除；如果剩余内容**≤ `ackMaxChars`**（默认：300），则该回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；只返回警报文本。

在心跳之外的场景中，如果消息开头或结尾意外出现 `HEARTBEAT_OK`，它会被移除并记录日志；如果一条消息只有 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 表示禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时投递单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；设为 true 时，仅保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；设为 true 时，每次心跳都在全新会话中运行（无对话历史）
        target: "last", // 默认：none | 可选：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道特定覆盖项
        accountId: "ops-bot", // 可选的多账号渠道 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 会在其上合并；如果任一智能体具有 `heartbeat` 代码块，则**只有这些智能体**会运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）会按渠道进一步覆盖。

### 按智能体设置心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 代码块，则**只有这些智能体**会运行心跳。按智能体的代码块会合并到 `agents.defaults.heartbeat` 之上（因此你可以先设置共享默认值，再按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确投递到最近一次联系对象（默认是 "none"）
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 活跃时段示例

将心跳限制在特定时区的工作时段内：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确投递到最近一次联系对象（默认是 "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选；如果设置了 userTimezone 则使用它，否则使用主机时区
        },
      },
    },
  },
}
```

在这个时间窗口之外（美东时间上午 9 点前或晚上 10 点后），心跳会被跳过。窗口内的下一次计划执行会正常运行。

### 24/7 设置

如果你希望心跳全天运行，可使用以下任一模式：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设为相同时间（例如 `08:00` 到 `08:00`）。
这会被视为零宽度窗口，因此心跳将始终被跳过。

### 多账号示例

使用 `accountId` 将消息定向到 Telegram 等多账号渠道中的特定账号：

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 可选：路由到特定 topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### 字段说明

- `every`：心跳间隔（时长字符串；默认单位 = 分钟）。
- `model`：心跳运行的可选模型覆盖项（`provider/model`）。
- `includeReasoning`：启用后，在可用时也会投递单独的 `Reasoning:` 消息（与 `/reasoning on` 的形式相同）。
- `lightContext`：启用后，心跳运行会使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：启用后，每次心跳都会在一个没有先前对话历史的全新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可显著降低每次心跳的 token 成本。与 `lightContext: true` 组合使用可获得最大节省。投递路由仍使用主会话上下文。
- `session`：心跳运行的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（可从 `openclaw sessions --json` 或 [sessions CLI](/cli/sessions) 复制）。
  - 会话键格式：见 [Sessions](/zh-CN/concepts/session) 和 [Groups](/zh-CN/channels/groups)。
- `target`：
  - `last`：投递到最近使用的外部渠道。
  - 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`（默认）：运行心跳，但**不向外部投递**。
- `directPolicy`：控制直接/私信投递行为：
  - `allow`（默认）：允许直接/私信心跳投递。
  - `block`：禁止直接/私信投递（`reason=dm-blocked`）。
- `to`：可选的收件人覆盖项（渠道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram 的 topic/thread，使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：多账号渠道的可选账号 id。当 `target: "last"` 时，如果最近解析出的渠道支持账号，则该账号 id 会应用到该渠道；否则将被忽略。如果该账号 id 与解析出的渠道中已配置的账号不匹配，则会跳过投递。
- `prompt`：覆盖默认提示词正文（不合并）。
- `ackMaxChars`：在触发投递前，`HEARTBEAT_OK` 之后允许的最大字符数。
- `suppressToolErrorWarnings`：启用后，会在心跳运行期间抑制工具错误警告负载。
- `activeHours`：将心跳运行限制在某个时间窗口内。对象包含 `start`（HH:MM，含边界；一天开始请用 `00:00`）、`end`（HH:MM，不含边界；一天结束可用 `24:00`），以及可选的 `timezone`。
  - 省略或设为 `"user"`：如果设置了 `agents.defaults.userTimezone` 则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
  - `start` 和 `end` 在有效窗口中不能相等；相等会被视为零宽度（始终处于窗口外）。
  - 在活跃窗口之外，心跳会被跳过，直到窗口内的下一个调度时刻。

## 投递行为

- 心跳默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），
  或者当 `session.scope = "global"` 时运行于 `global`。设置 `session` 可覆盖为
  特定渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
- 若要投递到特定渠道/收件人，请设置 `target` + `to`。当使用
  `target: "last"` 时，投递会使用该会话最近一次使用的外部渠道。
- 心跳投递默认允许直接/私信目标。设置 `directPolicy: "block"` 可禁止向直接目标发送，同时仍然运行该心跳轮次。
- 如果主队列正忙，心跳会被跳过，并稍后重试。
- 如果 `target` 未解析到任何外部目标，运行仍会发生，但不会发送
  出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部被禁用，则运行会在一开始就被跳过，原因为 `reason=alerts-disabled`。
- 如果只是禁用了警报投递，OpenClaw 仍然可以运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外的警报负载。
- 如果解析出的心跳目标支持“正在输入”状态，OpenClaw 会在
  心跳运行期间显示输入中状态。这会使用心跳原本会
  发送聊天输出的同一目标，并且可通过 `typingMode: "never"` 禁用。
- 仅包含心跳的回复**不会**保持会话活跃；最后的 `updatedAt`
  会被恢复，因此空闲过期仍会正常生效。
- 脱离主会话的 [后台任务](/zh-CN/automation/tasks) 可以将系统事件加入队列，并在主会话需要尽快注意某事时唤醒心跳。该唤醒不会让心跳运行变成后台任务。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认消息会被抑制，而警报内容会被
投递。你可以按渠道或按账号进行调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示警报消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 对此账号抑制警报投递
```

优先级：按账号 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅包含 OK 的回复时，发送 `HEARTBEAT_OK` 确认消息。
- `showAlerts`：当模型返回非 OK 回复时，发送警报内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三者都为 false**，OpenClaw 会完全跳过心跳运行（不调用模型）。

### 按渠道与按账号示例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 所有 Slack 账号
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅对 ops 账号抑制警报
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，开启警报） | _(无需配置)_ |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在某个渠道显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## `HEARTBEAT.md`（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会告诉
智能体去读取它。你可以把它看作自己的“心跳检查清单”：内容简短、稳定，并且
适合每 30 分钟都包含一次。

在普通运行中，只有当默认智能体启用了心跳指导时，
才会注入 `HEARTBEAT.md`。如果将心跳频率通过 `0m` 禁用，或
设置 `includeSystemPromptSection: false`，则它会从普通引导
上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（仅包含空行和 markdown
标题，如 `# Heading`），OpenClaw 会跳过该次心跳运行以节省 API 调用。
该跳过会报告为 `reason=empty-heartbeat-file`。
如果文件缺失，心跳仍会运行，并由模型决定该做什么。

请保持其内容精简（简短检查清单或提醒），以避免提示词膨胀。

示例 `HEARTBEAT.md`：

```md
# 心跳检查清单

- 快速查看：收件箱中是否有任何紧急事项？
- 如果是白天，且没有其他待处理事项，进行一次轻量签到。
- 如果某项任务被阻塞，记下_缺少什么_，并在下次询问 Peter。
```

### `tasks:` 代码块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 代码块，用于在
心跳内部执行基于间隔的检查。

示例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "检查是否有紧急未读邮件，并标记任何时间敏感的内容。"
- name: calendar-scan
  interval: 2h
  prompt: "检查即将到来的会议，看是否需要准备或跟进。"

# 附加说明

- 保持警报简短。
- 如果所有到期任务处理后都没有需要关注的内容，请回复 HEARTBEAT_OK。
```

行为如下：

- OpenClaw 会解析 `tasks:` 代码块，并根据各任务自己的 `interval` 检查每个任务。
- 只有**已到期**的任务会被包含进该次心跳的提示词中。
- 如果没有任务到期，心跳会被完全跳过（`reason=no-tasks-due`），以避免浪费一次模型调用。
- `HEARTBEAT.md` 中的非任务内容会被保留，并作为附加上下文追加在到期任务列表之后。
- 任务的上次运行时间戳存储在会话状态中（`heartbeatTaskState`），因此在正常重启后间隔信息仍然保留。
- 只有在心跳运行完成其正常回复路径后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

当你希望在一个心跳文件中保存多个周期性检查，而又不想在每次 tick 都为所有检查付费时，任务模式会很有用。

### 智能体可以更新 `HEARTBEAT.md` 吗？

可以——如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，因此你可以在
普通聊天中告诉智能体类似这样的话：

- “更新 `HEARTBEAT.md`，加入一项每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并专注于收件箱跟进。”

如果你希望它主动发生，也可以在
你的心跳提示词中加入一行明确说明，例如：“如果检查清单已过时，请更新 HEARTBEAT.md
为一个更好的版本。”

安全说明：不要将敏感信息（API 密钥、电话号码、私密 token）放入
`HEARTBEAT.md`——它会成为提示词上下文的一部分。

## 手动唤醒（按需）

你可以通过以下命令将系统事件加入队列，并立即触发一次心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果有多个智能体配置了 `heartbeat`，手动唤醒会立即运行其中每一个
智能体的心跳。

使用 `--mode next-heartbeat` 可等待下一次计划执行时刻。

## 推理内容投递（可选）

默认情况下，心跳只投递最终的“answer”负载。

如果你想提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会投递一条带有前缀
`Reasoning:` 的单独消息（形式与 `/reasoning on` 相同）。当智能体
正在管理多个会话/codexes，而你想知道它为什么决定提醒
你时，这会很有用——但它也可能泄露比你希望看到更多的内部细节。在群聊中通常建议保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行约可从 ~100K token 降到 ~2-5K）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 内容简短。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 所有自动化机制一览
- [Background Tasks](/zh-CN/automation/tasks) — 脱离主会话的工作如何被跟踪
- [Timezone](/zh-CN/concepts/timezone) — 时区如何影响心跳调度
- [Troubleshooting](/zh-CN/automation/cron-jobs#troubleshooting) — 自动化问题调试
