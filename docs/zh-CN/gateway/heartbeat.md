---
read_when:
    - 调整心跳频率或消息传递方式
    - 在计划任务中决定使用心跳还是 cron
sidebarTitle: Heartbeat
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-26T07:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**心跳还是 cron？** 关于何时使用两者中的哪一个，请参见 [自动化与任务](/zh-CN/automation)。
</Note>

心跳会在主会话中运行**周期性的智能体轮次**，这样模型就可以提示任何需要注意的事项，而不会对你造成刷屏。

心跳是一个已调度的主会话轮次——它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于分离式工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除： [计划任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="选择频率">
    保持启用心跳（默认是 `30m`，对于 Anthropic OAuth / token auth，包括 Claude CLI 复用，则为 `1h`），或者设置你自己的频率。
  </Step>
  <Step title="添加 HEARTBEAT.md（可选）">
    在智能体工作区中创建一个简短的 `HEARTBEAT.md` 检查清单或 `tasks:` 块。
  </Step>
  <Step title="决定心跳消息应发送到哪里">
    `target: "none"` 是默认值；设置 `target: "last"` 可将其路由到上一个联系人。
  </Step>
  <Step title="可选调优">
    - 启用心跳推理内容传递以提高透明度。
    - 如果心跳运行只需要 `HEARTBEAT.md`，可使用轻量级 bootstrap 上下文。
    - 启用隔离会话，避免每次心跳都发送完整的对话历史。
    - 将心跳限制在活跃时段内（本地时间）。
  </Step>
</Steps>

示例配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确投递到上一个联系人（默认是 "none"）
        directPolicy: "allow", // 默认：允许 direct / 私信 目标；设置为 "block" 以禁止
        lightContext: true, // 可选：仅从 bootstrap 文件注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行都使用全新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：额外发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（或在检测到 Anthropic OAuth / token auth 为认证模式时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示词会**原样**作为用户消息发送。系统提示词仅在默认智能体启用了心跳且运行在内部被标记时，才包含 “Heartbeat” 部分。
- 当使用 `0m` 禁用心跳时，普通运行也会从 bootstrap 上下文中省略 `HEARTBEAT.md`，这样模型就不会看到仅用于心跳的指令。
- 活跃时段（`heartbeat.activeHours`）会在配置的时区中进行检查。在时间窗口之外，心跳会被跳过，直到窗口内的下一次 tick。

## 心跳提示词的用途

默认提示词有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会推动智能体检查后续事项（收件箱、日历、提醒、排队工作），并提示任何紧急事项。
- **人工检查**：“Checkup sometimes on your human during day time” 会推动偶尔发送轻量级的“你需要什么吗？”消息，但会使用你配置的本地时区来避免夜间刷屏（参见 [时区](/zh-CN/concepts/timezone)）。

心跳可以对已完成的[后台任务](/zh-CN/automation/tasks)作出反应，但心跳运行本身不会创建任务记录。

如果你希望心跳执行非常具体的操作（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 网关健康状态”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（会原样发送）。

## 响应约定

- 如果没有任何事项需要关注，请回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为确认信号。如果剩余内容 **≤ `ackMaxChars`**（默认：300），则该标记会被移除，回复也会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；只返回警报文本。

在心跳之外，如果消息开头 / 结尾意外出现 `HEARTBEAT_OK`，它会被移除并记录日志；如果消息内容只有 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（在可用时投递单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；true 时仅保留工作区 bootstrap 文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次心跳都在全新会话中运行（无对话历史）
        target: "last", // 默认：none | 可选值：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道专用覆盖
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
- `agents.list[].heartbeat` 会在其之上合并；如果任一智能体有 `heartbeat` 块，**则只有这些智能体**会运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）会按渠道进一步覆盖。

### 按智能体设置心跳

如果任一 `agents.list[]` 条目包含 `heartbeat` 块，**则只有这些智能体**会运行心跳。按智能体设置的块会在 `agents.defaults.heartbeat` 之上合并（这样你可以先设置共享默认值，再按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确投递到上一个联系人（默认是 "none"）
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
        target: "last", // 明确投递到上一个联系人（默认是 "none"）
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

在这个时间窗口之外（东部时间上午 9 点前或晚上 10 点后），心跳会被跳过。窗口内的下一次计划 tick 会正常运行。

### 24/7 配置

如果你希望心跳全天运行，可以使用以下任一模式：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 设置为相同的时间（例如 `08:00` 到 `08:00`）。这会被视为零宽度窗口，因此心跳将始终被跳过。
</Warning>

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
          to: "12345678:topic:42", // 可选：路由到特定主题 / 线程
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

<ParamField path="every" type="string">
  心跳间隔（时长字符串；默认单位 = 分钟）。
</ParamField>
<ParamField path="model" type="string">
  心跳运行的可选模型覆盖（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  启用后，在可用时也会投递单独的 `Reasoning:` 消息（与 `/reasoning on` 形式相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，心跳运行使用轻量级 bootstrap 上下文，并且只保留工作区 bootstrap 文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次心跳都会在全新会话中运行，不带任何先前的对话历史。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可显著降低每次心跳的 token 成本。与 `lightContext: true` 组合可获得最大节省。投递路由仍使用主会话上下文。
</ParamField>
<ParamField path="session" type="string">
  心跳运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（可从 `openclaw sessions --json` 或 [sessions CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：参见 [会话](/zh-CN/concepts/session) 和 [群组](/zh-CN/channels/groups)。
  </ParamField>
  <ParamField path="target" type="string">
- `last`：投递到最近使用的外部渠道。
- 显式渠道：任意已配置渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行心跳，但**不向外部投递**。
  </ParamField>
  <ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制 direct / 私信 投递行为。`allow`：允许 direct / 私信 心跳投递。`block`：禁止 direct / 私信 投递（`reason=dm-blocked`）。
  </ParamField>
  <ParamField path="to" type="string">
  可选的收件人覆盖（渠道专用 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram 主题 / 线程，请使用 `<chatId>:topic:<messageThreadId>`。
  </ParamField>
  <ParamField path="accountId" type="string">
  多账号渠道的可选账号 id。当 `target: "last"` 时，如果解析出的最近渠道支持账号，则会应用该账号 id；否则会忽略。如果该账号 id 与解析出的渠道中已配置的账号不匹配，则会跳过投递。
  </ParamField>
  <ParamField path="prompt" type="string">
  覆盖默认提示词正文（不会合并）。
  </ParamField>
  <ParamField path="ackMaxChars" type="number" default="300">
  `HEARTBEAT_OK` 之后允许的最大字符数，超过则仍会投递。
  </ParamField>
  <ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，会在心跳运行期间抑制工具错误警告负载。
  </ParamField>
  <ParamField path="activeHours" type="object">
  将心跳运行限制在某个时间窗口内。对象包含 `start`（HH:MM，包含；一天开始请使用 `00:00`）、`end`（HH:MM，不包含；一天结束可使用 `24:00`）以及可选的 `timezone`。

- 省略或设为 `"user"`：如果设置了 `agents.defaults.userTimezone`，则使用你的时区；否则回退到主机系统时区。
- `"local"`：始终使用主机系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活跃窗口，`start` 和 `end` 不能相等；相等会被视为零宽度（始终在窗口外）。
- 在活跃窗口之外，心跳会被跳过，直到窗口内的下一次 tick。
  </ParamField>

## 投递行为

<AccordionGroup>
  <Accordion title="会话和目标路由">
    - 心跳默认在智能体主会话中运行（`agent:<id>:<mainKey>`），或者当 `session.scope = "global"` 时运行在 `global` 中。设置 `session` 可覆盖为特定渠道会话（Discord / WhatsApp / 等）。
    - `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
    - 要投递到特定渠道 / 收件人，请设置 `target` + `to`。使用 `target: "last"` 时，投递会使用该会话最近的外部渠道。
    - 心跳投递默认允许 direct / 私信 目标。设置 `directPolicy: "block"` 可在仍然运行心跳轮次的同时，禁止发送到 direct 目标。
    - 如果主队列繁忙，心跳会被跳过并在稍后重试。
    - 如果 `target` 未解析到任何外部目标，运行仍会发生，但不会发送出站消息。
  </Accordion>
  <Accordion title="可见性和跳过行为">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，则运行会在一开始就被跳过，标记为 `reason=alerts-disabled`。
    - 如果只是禁用了警报投递，OpenClaw 仍然可以运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外的警报负载。
    - 如果解析出的心跳目标支持输入中状态，OpenClaw 会在心跳运行期间显示输入中状态。这使用与心跳发送聊天输出相同的目标，并且可通过 `typingMode: "never"` 禁用。
  </Accordion>
  <Accordion title="会话生命周期和审计">
    - 仅包含心跳的回复**不会**让会话保持活跃。心跳元数据可能会更新会话行，但空闲过期使用的是上一条真实用户 / 渠道消息的 `lastInteractionAt`，而每日过期使用的是 `sessionStartedAt`。
    - Control UI 和 WebChat 历史会隐藏心跳提示词以及仅 OK 的确认。底层会话 transcript 仍然可能包含这些轮次，用于审计 / 重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以将系统事件加入队列，并在主会话需要快速注意某事时唤醒心跳。这种唤醒不会让心跳运行变成后台任务。
  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而警报内容会被投递。你可以按渠道或按账号进行调整：

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
          showAlerts: false # 对此账号禁止警报投递
```

优先级：按账号 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送警报内容。
- `useIndicator`：为 UI 状态表面发出指示器事件。

如果**这三个值全为 false**，OpenClaw 会完全跳过心跳运行（不调用模型）。

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
          showAlerts: false # 仅对 ops 账号禁止警报
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
| 仅在一个渠道中显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会告诉智能体去读取它。你可以把它看作你的“心跳检查清单”：内容小、稳定，并且可以安全地每 30 分钟包含一次。

在普通运行中，只有当默认智能体启用了心跳指导时，才会注入 `HEARTBEAT.md`。将心跳频率用 `0m` 禁用，或设置 `includeSystemPromptSection: false`，都会使其不再出现在普通 bootstrap 上下文中。

如果 `HEARTBEAT.md` 存在，但实际上为空（只有空行和 Markdown 标题，如 `# Heading`），OpenClaw 会跳过心跳运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件不存在，心跳仍会运行，由模型决定要做什么。

请保持它足够小（简短清单或提醒），以避免提示词膨胀。

示例 `HEARTBEAT.md`：

```md
# 心跳检查清单

- 快速扫描：收件箱中是否有任何紧急事项？
- 如果是白天，且没有其他待处理事项，进行一次轻量级询问。
- 如果某个任务被阻塞，写下_缺少什么_，并在下次询问 Peter。
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在心跳内部执行基于间隔的检查。

示例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "检查是否有紧急未读邮件，并标记任何时间敏感事项。"
- name: calendar-scan
  interval: 2h
  prompt: "检查即将到来的会议，看看是否需要准备或后续跟进。"

# 其他说明

- 保持警报简短。
- 如果所有到期任务处理后都没有需要关注的事项，请回复 HEARTBEAT_OK。
```

<AccordionGroup>
  <Accordion title="行为">
    - OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 进行检查。
    - 对于该次 tick，只会将**到期**任务包含进心跳提示词中。
    - 如果没有任务到期，心跳将被完全跳过（`reason=no-tasks-due`），以避免浪费模型调用。
    - `HEARTBEAT.md` 中的非任务内容会被保留，并在到期任务列表后附加为额外上下文。
    - 任务的上次运行时间戳会存储在会话状态中（`heartbeatTaskState`），因此在正常重启后间隔仍然有效。
    - 只有在心跳运行完成其正常回复路径之后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。
  </Accordion>
</AccordionGroup>

任务模式适合这样的场景：你希望一个心跳文件中保存多个周期性检查，但又不想在每次 tick 时都为所有检查付费。

### 智能体可以更新 HEARTBEAT.md 吗？

可以——如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，因此你可以在普通聊天中告诉智能体类似这样的话：

- “更新 `HEARTBEAT.md`，添加一个每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并专注于收件箱跟进。”

如果你希望它主动这样做，也可以在心跳提示词中加入一行明确说明，例如：“如果检查清单已经过时，就用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把密钥（API keys、电话号码、私密 token）放入 `HEARTBEAT.md`——它会成为提示词上下文的一部分。
</Warning>

## 手动唤醒（按需）

你可以通过以下命令将系统事件加入队列，并立即触发一次心跳：

```bash
openclaw system event --text "检查是否有紧急跟进事项" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行这些智能体各自的心跳。

使用 `--mode next-heartbeat` 可等待下一次计划 tick。

## 推理内容投递（可选）

默认情况下，心跳只投递最终的“答案”负载。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会额外投递一条以 `Reasoning:` 为前缀的消息（形式与 `/reasoning on` 相同）。当智能体正在管理多个会话 / codex 时，这有助于你理解它为什么决定提醒你——但它也可能泄露比你希望更多的内部细节。在群聊中通常更适合保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整的对话历史（每次运行大约从 ~100K token 降到 ~2-5K）。
- 使用 `lightContext: true`，将 bootstrap 文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 内容简短。
- 如果你只想更新内部状态，使用 `target: "none"`。

## 相关内容

- [自动化与任务](/zh-CN/automation) —— 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) —— 分离式工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) —— 时区如何影响心跳调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) —— 自动化问题调试
