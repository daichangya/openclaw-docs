---
read_when:
    - 调整心跳频率或消息内容
    - 在心跳和 cron 之间决定用于定时任务的方案
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-24T18:08:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 673d9b0700679135d6ac1cc89256de4238f69c513c853f68e6888c6e19070ae4
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **心跳还是 Cron？** 关于何时使用两者中的哪一个，请参见 [自动化与任务](/zh-CN/automation)。

心跳会在主会话中运行**周期性的智能体轮次**，让模型能够发现任何需要注意的事项，而不会对刷屏造成干扰。

心跳是一次计划执行的主会话轮次——它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。
任务记录用于脱离式工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除： [计划任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（新手）

1. 保持启用心跳（默认是 `30m`，或对于 Anthropic OAuth/令牌认证为 `1h`，包括 Claude CLI 复用），或者设置你自己的频率。
2. 在智能体工作区中创建一个简短的 `HEARTBEAT.md` 清单或 `tasks:` 块（可选但推荐）。
3. 决定心跳消息应该发送到哪里（默认是 `target: "none"`；设置 `target: "last"` 可路由到最近一次联系）。
4. 可选：启用心跳推理投递以提高透明度。
5. 可选：如果心跳运行只需要 `HEARTBEAT.md`，可使用轻量级 bootstrap 上下文。
6. 可选：启用隔离会话，以避免每次心跳都发送完整会话历史。
7. 可选：将心跳限制在活跃时段内（本地时间）。

示例配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到最近一次联系（默认是 "none"）
        directPolicy: "allow", // 默认：允许 direct/私信目标；设为 "block" 则抑制
        lightContext: true, // 可选：仅从 bootstrap 文件注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行使用全新会话（无会话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：额外发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（或者当检测到 Anthropic OAuth/令牌认证模式时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或每个智能体的 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示词会**原样**作为用户消息发送。仅当默认智能体启用了心跳且运行在内部被标记为心跳时，系统提示词才会包含 “Heartbeat” 部分。
- 当使用 `0m` 禁用心跳时，普通运行也会从 bootstrap 上下文中省略 `HEARTBEAT.md`，这样模型就不会看到仅供心跳使用的指令。
- 活跃时段（`heartbeat.activeHours`）会按配置的时区进行检查。
  在该时间窗之外，心跳会被跳过，直到窗口内的下一次 tick。

## 心跳提示词的用途

默认提示词故意设计得比较宽泛：

- **后台任务**：“考虑未完成任务” 会推动智能体检查后续事项（收件箱、日历、提醒、排队工作），并暴露任何紧急内容。
- **人工检查**：“白天有时关心一下你的主人” 会推动偶尔发送轻量级的 “你需要什么吗？” 消息，但会通过你配置的本地时区避免夜间刷屏（见 [/concepts/timezone](/zh-CN/concepts/timezone)）。

心跳可以对已完成的[后台任务](/zh-CN/automation/tasks)做出反应，但心跳运行本身不会创建任务记录。

如果你希望心跳执行非常具体的事情（例如“检查 Gmail PubSub 统计”或“验证 Gateway 网关健康状态”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（按原样发送）。

## 响应约定

- 如果没有任何需要注意的事项，请回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为 ack。
  如果去掉该标记后剩余内容**≤ `ackMaxChars`**（默认：300），则会移除该标记并丢弃回复。
- 如果 `HEARTBEAT_OK` 出现在回复**中间**，则不会被特殊处理。
- 对于告警，**不要**包含 `HEARTBEAT_OK`；只返回告警文本。

在心跳之外，如果消息开头/结尾意外出现 `HEARTBEAT_OK`，该标记会被移除并记入日志；如果消息仅包含 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时投递单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；true 时仅保留工作区 bootstrap 文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次心跳都在全新会话中运行（无会话历史）
        target: "last", // 默认：none | 选项：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道专用覆盖值
        accountId: "ops-bot", // 可选的多账户渠道 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 之后允许的最大字符数
      },
    },
  },
}
```

### 范围与优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 会在其上合并；如果任何智能体带有 `heartbeat` 块，则**只有这些智能体**会运行心跳。
- `channels.defaults.heartbeat` 设置所有渠道的可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户渠道）会按每个渠道账户进行覆盖。

### 每智能体心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，则**只有这些智能体**会运行心跳。
每智能体块会在 `agents.defaults.heartbeat` 之上合并（因此你可以先设置共享默认值，再按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到最近一次联系（默认是 "none"）
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

将心跳限制在特定时区的工作时间内：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到最近一次联系（默认是 "none"）
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

在该时间窗之外（美国东部时间上午 9 点前或晚上 10 点后），心跳会被跳过。窗口内下一次计划 tick 会照常运行。

### 24/7 设置

如果你希望心跳全天运行，可使用以下任一模式：

- 完全省略 `activeHours`（无时间窗限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设为相同时间（例如 `08:00` 到 `08:00`）。
这会被视为零宽度窗口，因此心跳会始终被跳过。

### 多账户示例

在 Telegram 等多账户渠道上，使用 `accountId` 来指定目标账户：

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
- `model`：心跳运行的可选模型覆盖值（`provider/model`）。
- `includeReasoning`：启用后，当可用时还会投递单独的 `Reasoning:` 消息（与 `/reasoning on` 形式相同）。
- `lightContext`：为 true 时，心跳运行使用轻量级 bootstrap 上下文，并且仅保留工作区 bootstrap 文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳都会在全新会话中运行，不带之前的会话历史。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可显著降低每次心跳的 token 成本。与 `lightContext: true` 结合可获得最大节省。投递路由仍使用主会话上下文。
- `session`：心跳运行的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（可从 `openclaw sessions --json` 或 [sessions CLI](/zh-CN/cli/sessions) 复制）。
  - 会话键格式：见 [会话](/zh-CN/concepts/session) 和 [群组](/zh-CN/channels/groups)。
- `target`：
  - `last`：投递到最近使用的外部渠道。
  - 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`（默认）：运行心跳，但**不**向外部投递。
- `directPolicy`：控制 direct/私信投递行为：
  - `allow`（默认）：允许 direct/私信心跳投递。
  - `block`：抑制 direct/私信投递（`reason=dm-blocked`）。
- `to`：可选的收件人覆盖值（渠道专用 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram 的 topic/thread，请使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：多账户渠道的可选账户 id。当 `target: "last"` 时，如果解析出的最近渠道支持账户，则应用该账户 id；否则会被忽略。如果该账户 id 与解析出的渠道中已配置账户不匹配，则跳过投递。
- `prompt`：覆盖默认提示词正文（不合并）。
- `ackMaxChars`：`HEARTBEAT_OK` 之后允许的最大字符数，超过则仍会投递。
- `suppressToolErrorWarnings`：为 true 时，在心跳运行期间抑制工具错误警告载荷。
- `activeHours`：将心跳运行限制在一个时间窗内。对象包含 `start`（HH:MM，含边界；一天开始请用 `00:00`）、`end`（HH:MM，不含边界；一天结束可用 `24:00`）以及可选的 `timezone`。
  - 省略或设为 `"user"`：如果设置了 `agents.defaults.userTimezone` 则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
  - `start` 和 `end` 不能相同，否则活动窗口会被视为零宽度（始终在窗口之外）。
  - 在活动窗口之外，心跳会被跳过，直到窗口内的下一次 tick。

## 投递行为

- 心跳默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），或者当 `session.scope = "global"` 时使用 `global`。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
- 要投递到特定渠道/收件人，请设置 `target` + `to`。使用 `target: "last"` 时，投递会使用该会话最近一次的外部渠道。
- 心跳默认允许投递到 direct/私信目标。设置 `directPolicy: "block"` 可抑制发送到直接目标，同时仍运行心跳轮次。
- 如果主队列繁忙，心跳会被跳过，并在之后重试。
- 如果 `target` 未解析到外部目标，运行仍会发生，但不会发送出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部被禁用，则运行会在一开始被跳过，原因为 `reason=alerts-disabled`。
- 如果仅禁用了告警投递，OpenClaw 仍可运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外告警载荷。
- 如果解析出的心跳目标支持输入状态，OpenClaw 会在心跳运行期间显示输入中。这使用与心跳发送聊天输出相同的目标，并可通过 `typingMode: "never"` 禁用。
- 仅包含心跳内容的回复**不会**保持会话存活；最后的 `updatedAt` 会被恢复，因此空闲过期行为保持正常。
- 脱离式[后台任务](/zh-CN/automation/tasks)可以入队一个系统事件并唤醒心跳，以便主会话能更快注意到某些事项。这种唤醒不会让心跳运行变成后台任务。

## 可见性控制

默认情况下，会抑制 `HEARTBEAT_OK` 确认消息，而告警内容会被投递。
你可以按渠道或按账户进行调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示告警消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 对此账户抑制告警投递
```

优先级：每账户 → 每渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅包含 OK 的回复时，发送 `HEARTBEAT_OK` 确认消息。
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三者**都为 false，OpenClaw 会完全跳过心跳运行（不会调用模型）。

### 每渠道与每账户示例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 所有 Slack 账户
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅对 ops 账户抑制告警
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，开启告警） | _(无需配置)_ |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在一个渠道中显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会要求智能体读取它。
你可以把它理解为你的“心跳检查清单”：内容小、稳定，并且适合每 30 分钟都纳入一次。

在普通运行中，仅当默认智能体启用了心跳指引时，才会注入 `HEARTBEAT.md`。
使用 `0m` 禁用心跳频率，或设置 `includeSystemPromptSection: false`，都会将它从普通 bootstrap 上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown 标题，例如 `# Heading`），OpenClaw 会跳过该次心跳运行，以节省 API 调用。
该跳过会报告为 `reason=empty-heartbeat-file`。
如果文件不存在，心跳仍会运行，并由模型自行决定该做什么。

请保持内容简短（简短清单或提醒），以避免提示词膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在心跳内部执行基于间隔的检查。

示例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

行为：

- OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 进行检查。
- 每次 tick 的心跳提示词中只包含**已到期**的任务。
- 如果没有任务到期，则会完全跳过该次心跳（`reason=no-tasks-due`），以避免浪费一次模型调用。
- `HEARTBEAT.md` 中非任务内容会被保留，并作为附加上下文追加在到期任务列表之后。
- 任务上次运行时间戳会存储在会话状态（`heartbeatTaskState`）中，因此这些间隔在正常重启后仍能保留。
- 只有在心跳运行完成其正常回复路径后，任务时间戳才会前移。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

任务模式适用于这样的场景：你希望一个心跳文件容纳多个周期性检查，但又不想在每次 tick 时都为所有检查付费。

### 智能体可以更新 HEARTBEAT.md 吗？

可以——如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，因此你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，加入每日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并专注于收件箱跟进。”

如果你希望这件事主动发生，也可以在心跳提示词中加入明确的一行，例如：“如果清单已经过时，请更新 HEARTBEAT.md，改成一个更好的版本。”

安全说明：不要把机密信息（API 密钥、电话号码、私有令牌）写入 `HEARTBEAT.md`——它会成为提示词上下文的一部分。

## 手动唤醒（按需）

你可以通过以下命令入队一个系统事件，并立即触发一次心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，一次手动唤醒会立即运行这些智能体各自的心跳。

使用 `--mode next-heartbeat` 可等待下一次计划 tick。

## 推理投递（可选）

默认情况下，心跳只投递最终的“answer”载荷。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会额外投递一条以 `Reasoning:` 为前缀的消息（形式与 `/reasoning on` 相同）。当智能体正在管理多个会话/Codexes，而你想了解它为何决定提醒你时，这会很有用——但它也可能泄露比你想要更多的内部细节。在群聊中建议保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整会话历史（每次运行大约可从 ~100K token 降到 ~2-5K）。
- 使用 `lightContext: true`，将 bootstrap 文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 简短。
- 如果你只想要内部状态更新，请使用 `target: "none"`。

## 相关

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — 脱离式工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) — 时区如何影响心跳调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 调试自动化问题
