---
read_when:
    - 调整心跳频率或消息内容
    - 为计划任务决定使用心跳还是 cron
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-25T05:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **心跳还是 Cron？** 关于何时使用两者的指导，请参见 [Automation & Tasks](/zh-CN/automation)。

心跳会在主会话中运行**周期性的智能体轮次**，这样模型就可以发现任何需要你关注的事项，而不会对你造成刷屏。

心跳是一个按计划执行的主会话轮次——它**不会**创建 [后台任务](/zh-CN/automation/tasks) 记录。
任务记录用于脱离主会话的工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除：[计划任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（新手）

1. 保持心跳启用状态（默认是 `30m`，对于 Anthropic OAuth/token 认证，包括 Claude CLI 复用，则为 `1h`），或者设置你自己的频率。
2. 在智能体工作区中创建一个简短的 `HEARTBEAT.md` 检查清单或 `tasks:` 块（可选，但推荐）。
3. 决定心跳消息应发送到哪里（`target: "none"` 是默认值；设置 `target: "last"` 可将其路由到最后一个联系人）。
4. 可选：启用心跳推理投递以提高透明度。
5. 可选：如果心跳运行只需要 `HEARTBEAT.md`，可使用轻量级引导上下文。
6. 可选：启用隔离会话，以避免每次心跳都发送完整的对话历史。
7. 可选：将心跳限制在活跃时段内（本地时间）。

配置示例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到最后一个联系人（默认是 "none"）
        directPolicy: "allow", // 默认：允许直接/私信目标；设为 "block" 则抑制
        lightContext: true, // 可选：仅从引导文件中注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行使用全新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：也单独发送 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（或者在检测到 Anthropic OAuth/token 认证模式时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示词会**原样**作为用户消息发送。系统提示词仅在为默认智能体启用心跳且该运行被内部标记时，才会包含 “Heartbeat” 部分。
- 当使用 `0m` 禁用心跳时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，这样模型就看不到仅供心跳使用的指令。
- 活跃时段（`heartbeat.activeHours`）会在配置的时区中进行检查。
  在该时间窗口之外，心跳会被跳过，直到窗口内的下一个 tick。

## 心跳提示词的用途

默认提示词有意保持较宽泛：

- **后台任务**：“Consider outstanding tasks” 会推动智能体检查待处理事项（收件箱、日历、提醒、排队工作），并将任何紧急事项呈现出来。
- **人工签到**：“Checkup sometimes on your human during day time” 会推动偶尔发送轻量级的“你需要什么吗？”消息，但会通过使用你配置的本地时区（参见 [/concepts/timezone](/zh-CN/concepts/timezone)）来避免夜间刷屏。

心跳可以对已完成的 [后台任务](/zh-CN/automation/tasks) 作出反应，但心跳运行本身不会创建任务记录。

如果你希望心跳执行非常具体的操作（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 网关健康状态”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（将原样发送）。

## 响应约定

- 如果没有任何事项需要关注，请回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为确认。该标记会被去除；如果剩余内容**≤ `ackMaxChars`**（默认：300），则回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于提醒消息，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在非心跳场景下，若消息开头/结尾意外出现 `HEARTBEAT_OK`，它会被去除并记录日志；如果消息内容只有 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（在可用时单独投递 Reasoning: 消息）
        lightContext: false, // 默认：false；true 时仅从工作区引导文件中保留 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次心跳都在全新会话中运行（无对话历史）
        target: "last", // 默认：none | 可选值：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道特定覆盖
        accountId: "ops-bot", // 可选的多账号渠道 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 之后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 会在其之上合并；如果任一智能体具有 `heartbeat` 块，则**只有这些智能体**会运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）会按渠道进一步覆盖。

### 按智能体配置的心跳

如果任一 `agents.list[]` 条目包含 `heartbeat` 块，则**只有这些智能体**会运行心跳。按智能体配置的块会合并到 `agents.defaults.heartbeat` 之上（因此你可以先设置一次共享默认值，再按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到最后一个联系人（默认是 "none"）
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
        target: "last", // 显式投递到最后一个联系人（默认是 "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选；如果设置了 userTimezone，则使用它，否则使用主机时区
        },
      },
    },
  },
}
```

在该时间窗口之外（美东时间上午 9 点之前或晚上 10 点之后），心跳会被跳过。窗口内下一次计划 tick 会正常运行。

### 24/7 设置

如果你希望心跳全天运行，请使用以下任一模式：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设为相同时间（例如 `08:00` 到 `08:00`）。
这会被视为零宽度窗口，因此心跳始终会被跳过。

### 多账号示例

使用 `accountId` 来指定 Telegram 等多账号渠道中的特定账号：

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
- `model`：心跳运行的可选模型覆盖（`provider/model`）。
- `includeReasoning`：启用后，在可用时也会投递单独的 `Reasoning:` 消息（与 `/reasoning on` 的形式相同）。
- `lightContext`：为 true 时，心跳运行会使用轻量级引导上下文，并且只从工作区引导文件中保留 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳都会在一个全新会话中运行，不包含此前的对话历史。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。这会显著降低每次心跳的 token 成本。与 `lightContext: true` 结合可获得最大节省。投递路由仍使用主会话上下文。
- `session`：心跳运行的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（从 `openclaw sessions --json` 或 [sessions CLI](/zh-CN/cli/sessions) 复制）。
  - 会话键格式：参见 [Sessions](/zh-CN/concepts/session) 和 [Groups](/zh-CN/channels/groups)。
- `target`：
  - `last`：投递到最后使用的外部渠道。
  - 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`（默认）：运行心跳，但**不进行**外部投递。
- `directPolicy`：控制直接/私信投递行为：
  - `allow`（默认）：允许直接/私信心跳投递。
  - `block`：抑制直接/私信投递（`reason=dm-blocked`）。
- `to`：可选的接收者覆盖（渠道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram topics/threads，请使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：多账号渠道的可选账号 id。当 `target: "last"` 时，如果最后解析出的渠道支持账号，则该账号 id 会应用于该渠道；否则将被忽略。如果该账号 id 与解析出的渠道中已配置的账号不匹配，则会跳过投递。
- `prompt`：覆盖默认提示词正文（不合并）。
- `ackMaxChars`：在 `HEARTBEAT_OK` 之后允许的最大字符数，超出则进行投递。
- `suppressToolErrorWarnings`：为 true 时，会在心跳运行期间抑制工具错误警告负载。
- `activeHours`：将心跳运行限制在某个时间窗口内。对象包含 `start`（HH:MM，含边界；一天开始请使用 `00:00`）、`end`（HH:MM，不含边界；一天结束允许使用 `24:00`）以及可选的 `timezone`。
  - 省略或设为 `"user"`：如果设置了 `agents.defaults.userTimezone`，则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上述 `"user"` 行为。
  - `start` 和 `end` 不能相等来表示一个有效窗口；相等值会被视为零宽度（始终处于窗口外）。
  - 在活跃窗口之外，心跳会被跳过，直到窗口内的下一个 tick。

## 投递行为

- 心跳默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），如果 `session.scope = "global"`，则运行在 `global` 中。设置 `session` 可覆盖为特定的渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
- 如需投递到特定渠道/接收者，请设置 `target` + `to`。当使用 `target: "last"` 时，投递会使用该会话最后一个外部渠道。
- 心跳投递默认允许直接/私信目标。设置 `directPolicy: "block"` 可抑制发送到直接目标，同时仍运行心跳轮次。
- 如果主队列繁忙，心跳会被跳过，并在稍后重试。
- 如果 `target` 未解析出任何外部目标，运行仍会发生，但不会发送任何出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部被禁用，则该运行会在开始前被跳过，并标记为 `reason=alerts-disabled`。
- 如果仅禁用了提醒投递，OpenClaw 仍可运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外提醒负载。
- 如果解析出的心跳目标支持输入状态，OpenClaw 会在心跳运行期间显示正在输入。这使用与心跳发送聊天输出相同的目标，并且可通过 `typingMode: "never"` 禁用。
- 仅包含心跳内容的回复**不会**保持会话活跃；最后的 `updatedAt` 会被恢复，因此空闲过期行为仍然正常。
- Control UI 和 WebChat 历史记录会隐藏心跳提示词以及仅含 OK 的确认消息。底层会话转录仍可能包含这些轮次，用于审计/重放。
- 脱离主会话的 [后台任务](/zh-CN/automation/tasks) 可以入队一个系统事件并唤醒心跳，以便主会话尽快注意到某些事项。该唤醒并不会让心跳运行变成后台任务。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认消息会被抑制，而提醒内容会被投递。你可以按渠道或按账号调整此行为：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示提醒消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 为此账号抑制提醒投递
```

优先级：按账号 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅含 OK 的回复时，发送 `HEARTBEAT_OK` 确认消息。
- `showAlerts`：当模型返回非 OK 回复时，发送提醒内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三者全部**为 false，OpenClaw 会完全跳过心跳运行（不调用模型）。

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
          showAlerts: false # 仅为 ops 账号抑制提醒
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，开启提醒） | _(无需配置)_ |
| 完全静默（无消息，无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在一个渠道显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## `HEARTBEAT.md`（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会告诉智能体读取它。你可以把它看作你的“心跳检查清单”：简短、稳定，并且适合每 30 分钟都包含一次。

在普通运行中，只有当为默认智能体启用了心跳指导时，才会注入 `HEARTBEAT.md`。将心跳频率设置为 `0m` 来禁用，或设置 `includeSystemPromptSection: false`，都会使其不再出现在普通引导上下文中。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown 标题，例如 `# Heading`），OpenClaw 会跳过心跳运行以节省 API 调用。
该跳过会标记为 `reason=empty-heartbeat-file`。
如果文件缺失，心跳仍会运行，并由模型决定该做什么。

请保持它简短（简要清单或提醒），以避免提示词膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化的 `tasks:` 块，用于在心跳内部执行基于间隔的检查。

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

行为如下：

- OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 检查它。
- 每个 tick 的心跳提示词中只会包含**到期**任务。
- 如果没有任务到期，心跳会被完全跳过（`reason=no-tasks-due`），以避免浪费一次模型调用。
- `HEARTBEAT.md` 中的非任务内容会被保留，并作为额外上下文附加在到期任务列表之后。
- 任务的上次运行时间戳会存储在会话状态（`heartbeatTaskState`）中，因此在正常重启后间隔信息仍会保留。
- 只有当一次心跳运行完成其正常回复路径后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

当你希望一个心跳文件承载多个周期性检查、但又不想在每个 tick 都为所有检查付费时，任务模式会很有用。

### 智能体可以更新 `HEARTBEAT.md` 吗？

可以——如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，因此你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加一个每日历检查。”
- “重写 `HEARTBEAT.md`，让它更简短，并聚焦于收件箱跟进事项。”

如果你希望它主动这样做，也可以在你的心跳提示词中加入一条明确说明，例如：“如果检查清单已过时，请更新 HEARTBEAT.md，换成更好的版本。”

安全提示：不要将机密信息（API 密钥、电话号码、私密 token）放入 `HEARTBEAT.md`——它会成为提示词上下文的一部分。

## 手动唤醒（按需）

你可以通过以下命令入队一个系统事件，并立即触发一次心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果有多个智能体配置了 `heartbeat`，手动唤醒会立即运行这些智能体中的每一个心跳。

使用 `--mode next-heartbeat` 可等待下一次计划 tick。

## 推理投递（可选）

默认情况下，心跳只会投递最终的“answer”负载。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会投递一条单独的消息，前缀为 `Reasoning:`（形式与 `/reasoning on` 相同）。当智能体正在管理多个会话/Codex harness 时，这在你想了解它为何决定提醒你时会很有用——但它也可能泄露比你希望看到的更多内部细节。在群聊中，建议保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。间隔越短，消耗的 token 越多。为了降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行可从约 100K token 降到约 2-5K）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 简短。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — 脱离主会话的工作如何被跟踪
- [Timezone](/zh-CN/concepts/timezone) — 时区如何影响心跳调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 自动化问题调试指南
