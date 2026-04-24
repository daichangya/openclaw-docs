---
read_when:
    - 安排后台任务或唤醒操作
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为定时任务决定使用 heartbeat 还是 cron
summary: Gateway 网关调度器的定时任务、webhook 和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-04-24T18:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d59ab85d788afce2a9a320b5e1d7d301c7c0d0d5f78c43dbbce3fe6b125e414
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关内置的调度器。它会持久化作业，在正确的时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

## 快速开始

```bash
# 添加一个一次性提醒
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# 检查你的作业
openclaw cron list
openclaw cron show <job-id>

# 查看运行历史
openclaw cron runs --id <job-id>
```

## cron 的工作原理

- Cron **运行在 Gateway 网关** 进程内部（而不是在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度。
- 运行时执行状态会持久化到旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 拆分之后，旧版本的 OpenClaw 可以读取 `jobs.json`，但可能会将作业视为全新作业，因为运行时字段现在存储在 `jobs-state.json` 中。
- 所有 cron 执行都会创建 [后台任务](/zh-CN/automation/tasks) 记录。
- 一次性作业（`--at`）默认会在成功后自动删除。
- 独立 cron 运行会尽力在运行完成时关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤儿进程。
- 独立 cron 运行还会防止过时的确认回复。如果第一个结果只是中间状态更新（例如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次以获取实际结果。

<a id="maintenance"></a>

cron 的任务协调由运行时负责：只要 cron 运行时仍将该作业标记为正在运行，活动中的 cron 任务就会保持存活，即使旧的子会话记录仍然存在。
一旦运行时不再拥有该作业，且 5 分钟宽限期已过，维护流程就可以将该任务标记为 `lost`。

## 调度类型

| 类型    | CLI 标志 | 描述 |
| ------- | --------- | ---- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every` | 固定间隔 |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选配 `--tz` |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地墙上时钟时间进行调度。

每小时整点的重复表达式会自动错开最多 5 分钟，以减少负载尖峰。使用 `--exact` 强制精确触发，或使用 `--stagger 30s` 指定明确的错开窗口。

### 日与周字段使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“月中的第几天”和“周中的第几天”两个字段都不是通配符时，croner 会在**任一**字段匹配时触发——而不是两个都匹配。这是标准的 Vixie cron 行为。

```
# 预期："15 号上午 9 点，仅当这一天是周一"
# 实际：  "每月 15 号上午 9 点，以及每周一上午 9 点"
0 9 15 * 1
```

这样每月会触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件成立，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或者只在一个字段上调度，并在作业的提示词或命令中对另一个条件进行判断。

## 执行方式

| 方式            | `--session` 值      | 运行位置                 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------ |
| 主会话          | `main`              | 下一次 heartbeat 轮次    | 提醒、系统事件 |
| 独立            | `isolated`          | 专用 `cron:<jobId>`      | 报告、后台杂务 |
| 当前会话        | `current`           | 在创建时绑定             | 感知上下文的周期性工作 |
| 自定义会话      | `session:custom-id` | 持久命名会话             | 基于历史持续推进的工作流 |

**主会话** 作业会排入一个系统事件队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。**独立** 作业会使用一个全新会话运行专用的智能体轮次。**自定义会话**（`session:xxx`）会在各次运行之间保留上下文，从而支持如每日站会这类基于先前摘要不断累积的工作流。

对于独立作业，运行时拆除现在还包括尽力清理该 cron 会话的浏览器资源。清理失败会被忽略，因此实际 cron 结果仍然优先。

独立 cron 运行还会通过共享的运行时清理路径，释放该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式保持一致，因此独立 cron 作业不会在多次运行之间泄漏 stdio 子进程或长生命周期的 MCP 连接。

当独立 cron 运行编排子智能体时，交付逻辑也会优先使用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该父级的部分更新，而不是直接宣布它。

### 独立作业的负载选项

- `--message`：提示文本（独立模式必填）
- `--model` / `--thinking`：模型和思考级别覆盖
- `--light-context`：跳过工作区引导文件注入
- `--tools exec,read`：限制该作业可使用的工具

`--model` 会为该作业使用所选的允许模型。如果请求的模型不被允许，cron 会记录一条警告，并回退到该作业的智能体/默认模型选择。已配置的回退链仍然生效，但如果只是普通的模型覆盖且没有显式的按作业回退列表，则不再将智能体主模型作为隐藏的额外重试目标附加进去。

独立作业的模型选择优先级如下：

1. Gmail hook 模型覆盖（当该运行来自 Gmail 且该覆盖模型被允许时）
2. 按作业负载中的 `model`
3. 已存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果所选模型配置带有 `params.fastMode`，独立 cron 默认会启用它。已存储的会话 `fastMode` 覆盖仍然在两个方向上都优先于配置。

如果独立运行遇到实时模型切换移交，cron 会使用切换后的 provider/模型重试，并在重试前持久化该实时选择。如果切换还携带了新的认证配置文件，cron 也会持久化该认证配置文件覆盖。重试次数是有上限的：在初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 交付与输出

| 模式       | 行为 |
| ---------- | ---- |
| `announce` | 如果智能体未发送，则回退将最终文本交付到目标 |
| `webhook`  | 向一个 URL `POST` 已完成事件负载 |
| `none`     | 不进行运行器回退交付 |

使用 `--announce --channel telegram --to "-1001234567890"` 可进行渠道交付。对于 Telegram 论坛话题，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。

对于独立作业，聊天交付是共享的。如果存在聊天路由，即使作业使用了 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到了配置的/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 仅控制运行器在智能体轮次结束后如何处理最终回复。

失败通知会遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 为每个作业单独覆盖该值。
- 如果两者都未设置，而该作业已经通过 `announce` 进行交付，则失败通知现在会回退到该主 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主交付模式为 `webhook`。

## CLI 示例

一次性提醒（主会话）：

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

带交付的周期性独立作业：

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

带模型和思考覆盖的独立作业：

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooks

Gateway 网关可以公开 HTTP webhook 端点以接收外部触发器。在配置中启用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 认证

每个请求都必须通过请求头包含 hook token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串中的 token 会被拒绝。

### POST /hooks/wake

为主会话排入一个系统事件：

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必填）：事件描述
- `mode`（可选）：`now`（默认）或 `next-heartbeat`

### POST /hooks/agent

运行一个独立的智能体轮次：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### 映射 hooks（POST /hooks/\<name\>）

自定义 hook 名称会通过配置中的 `hooks.mappings` 进行解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。

### 安全性

- 将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。
- 使用专用的 hook token；不要复用 gateway 认证 token。
- 将 `hooks.path` 放在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你确实需要由调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也请设置 `hooks.allowedSessionKeyPrefixes` 以限制允许的会话键格式。
- 默认情况下，hook 负载会被安全边界包裹。

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

**前提条件**：`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks、用于公开 HTTPS 端点的 Tailscale。

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

1. 选择拥有 `gog` 所用 OAuth 客户端的 GCP 项目：

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 创建 topic，并授予 Gmail 推送权限：

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. 启动 watch：

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail 模型覆盖

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 管理作业

```bash
# 列出所有作业
openclaw cron list

# 显示单个作业，包括解析后的交付路由
openclaw cron show <jobId>

# 编辑作业
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行作业
openclaw cron run <jobId>

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 删除作业
openclaw cron remove <jobId>

# 智能体选择（多智能体设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改作业所选的模型。
- 如果该模型被允许，那个确切的 provider/模型 会传递到独立智能体运行中。
- 如果它不被允许，cron 会发出警告，并回退到该作业的智能体/默认模型选择。
- 已配置的回退链仍然生效，但普通的 `--model` 覆盖如果没有显式的按作业回退列表，将不再静默回落到智能体主模型作为额外的重试目标。

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

运行时状态 sidecar 由 `cron.store` 推导得出：像
`~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则会附加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

**一次性作业重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并采用指数退避。永久性错误会立即禁用。

**周期性作业重试**：重试之间使用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

**维护**：`cron.sessionRetention`（默认 `24h`）会清理独立运行会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。

## 故障排除

### 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron 未触发

- 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
- 确认 Gateway 网关持续运行中。
- 对于 `cron` 调度，检查时区（`--tz`）与主机时区是否一致。
- 运行输出中的 `reason: not-due` 表示你使用 `openclaw cron run <jobId> --due` 检查了手动运行，但该作业尚未到期。

### Cron 已触发但没有交付

- 交付模式 `none` 表示不会进行运行器回退发送。只要有聊天路由可用，智能体仍可使用 `message` 工具直接发送。
- 缺少/无效的交付目标（`channel`/`to`）表示已跳过出站发送。
- 渠道认证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
- 如果独立运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退排队摘要路径，因此不会向聊天回发任何内容。
- 如果智能体应该自行向用户发送消息，请检查该作业是否具有可用路由（带有之前聊天记录的 `channel: "last"`，或显式的渠道/目标）。

### 时区注意事项

- 不带 `--tz` 的 cron 会使用 Gateway 网关主机时区。
- 不带时区的 `at` 调度会被视为 UTC。
- Heartbeat 的 `activeHours` 使用已配置的时区解析。

## 相关内容

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务台账
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
