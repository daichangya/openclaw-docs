---
read_when:
    - 调度后台任务或唤醒操作
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
summary: 用于 Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-23T07:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# 计划任务（Cron）

Cron 是 Gateway 网关内置的调度器。它会持久化任务，在正确的时间唤醒智能体，并可将输出回传到聊天渠道或 webhook 端点。

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

# 查看你的任务
openclaw cron list
openclaw cron show <job-id>

# 查看运行历史
openclaw cron runs --id <job-id>
```

## Cron 的工作方式

- Cron 在 **Gateway 网关** 进程**内部**运行（不在模型内部）。
- 任务定义持久化保存在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度计划。
- 运行时执行状态保存在旁边的 `~/.openclaw/cron/jobs-state.json` 中。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 `.gitignore`。
- 拆分之后，旧版 OpenClaw 可以读取 `jobs.json`，但可能会将任务视为全新任务，因为运行时字段现在位于 `jobs-state.json` 中。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认在成功后自动删除。
- 独立 cron 运行会在运行完成时尽力关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，这样分离的浏览器自动化就不会留下孤儿进程。
- 独立 cron 运行还会防止过时的确认回复。如果第一个结果只是中间状态更新（如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在投递前再次提示一次，以获取实际结果。

<a id="maintenance"></a>

Cron 的任务协调由运行时负责：只要 cron 运行时仍将该任务跟踪为正在运行，对应的活动 cron 任务就会保持存活，即使仍存在旧的子会话行记录也是如此。一旦运行时不再拥有该任务，且 5 分钟宽限期到期，维护流程就可以将该任务标记为 `lost`。

## 调度类型

| 类型    | CLI 标志 | 描述                                                |
| ------- | -------- | --------------------------------------------------- |
| `at`    | `--at`   | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every`| 固定间隔                                            |
| `cron`  | `--cron` | 5 字段或 6 字段的 cron 表达式，可选搭配 `--tz` 使用 |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地墙上时钟时间进行调度。

循环的整点表达式会自动错开最多 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错开窗口。

### 月中的某天与星期几使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“月中的某天”和“星期几”字段都不是通配符时，croner 会在**任一**字段匹配时触发，而不是两个都匹配时才触发。这是标准的 Vixie cron 行为。

```
# 预期："每月 15 日上午 9 点，且仅当这一天是周一"
# 实际："每个 15 日上午 9 点，以及每个周一上午 9 点"
0 9 15 * 1
```

这样每月会触发约 5–6 次，而不是 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件都满足，请使用 Croner 的 `+` 星期几修饰符（`0 9 15 * +1`），或仅按一个字段调度，再在任务的提示词或命令中对另一个条件进行判断。

## 执行方式

| 方式            | `--session` 值      | 运行位置                 | 最适合                        |
| --------------- | ------------------- | ------------------------ | ----------------------------- |
| 主会话          | `main`              | 下一次 heartbeat 轮次    | 提醒、系统事件                |
| 独立            | `isolated`          | 专用 `cron:<jobId>`      | 报告、后台杂务                |
| 当前会话        | `current`           | 绑定到创建时的会话       | 依赖上下文的循环工作          |
| 自定义会话      | `session:custom-id` | 持久化命名会话           | 基于历史逐步推进的工作流      |

**主会话**任务会入队一个系统事件，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。**独立**任务会在一个全新会话中运行专用的智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持诸如基于前一天摘要继续推进的每日站会等工作流。

对于独立任务，运行时拆除现在包含了该 cron 会话的尽力式浏览器清理。清理失败会被忽略，以确保实际的 cron 结果仍然优先。

独立 cron 运行还会通过共享的运行时清理路径，释放为该任务创建的所有内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端拆除方式一致，因此独立 cron 任务不会在多次运行之间泄漏 stdio 子进程或长期存活的 MCP 连接。

当独立 cron 运行编排子智能体时，投递逻辑也会优先使用最终的后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该父级的部分更新，而不是直接播报它。

### 独立任务的负载选项

- `--message`：提示文本（独立任务必填）
- `--model` / `--thinking`：模型和思考级别覆盖
- `--light-context`：跳过工作区引导文件注入
- `--tools exec,read`：限制任务可使用的工具

`--model` 会为该任务使用所选的允许模型。如果请求的模型不被允许，cron 会记录一条警告，并回退到该任务的智能体/默认模型选择。已配置的回退链仍然适用，但如果只是普通的模型覆盖，且没有显式的逐任务回退列表，就不再把智能体主模型作为隐藏的额外重试目标附加进去。

独立任务的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每个任务负载中的 `model`
3. 已存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的 live 选择。如果所选模型配置包含 `params.fastMode`，独立 cron 默认就会使用该设置。已存储的会话 `fastMode` 覆盖在两个方向上都仍然优先生效。

如果独立运行遇到 live 模型切换交接，cron 会使用切换后的 provider/模型重试，并在重试前持久化该 live 选择。如果切换同时携带新的凭证配置文件，cron 也会持久化该凭证配置文件覆盖。重试次数是有限的：在初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 投递与输出

| 模式       | 行为说明                                                      |
| ---------- | ------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则回退投递最终文本到目标                    |
| `webhook`  | 将完成事件负载以 POST 方式发送到某个 URL                      |
| `none`     | 运行器不执行回退投递                                          |

使用 `--announce --channel telegram --to "-1001234567890"` 可投递到渠道。对于 Telegram 论坛话题，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。

对于独立任务，聊天投递是共享的。如果聊天路由可用，智能体即使在任务使用 `--no-deliver` 时也可以使用 `message` 工具。如果智能体发送到了已配置/当前目标，OpenClaw 就会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体轮次结束后如何处理最终回复。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 可按任务覆盖该设置。
- 如果两者都未设置，而该任务本身已通过 `announce` 投递，则失败通知现在会回退到该主 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的任务上受支持，除非主投递模式是 `webhook`。

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

带投递的循环独立任务：

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

带模型和思考覆盖的独立任务：

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

Gateway 网关可以暴露 HTTP webhook 端点，用于外部触发器。在配置中启用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 身份验证

每个请求都必须通过请求头携带 hook token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串中的 token 会被拒绝。

### POST /hooks/wake

为主会话入队一个系统事件：

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### 映射 hook（POST /hooks/\<name\>）

自定义 hook 名称会通过配置中的 `hooks.mappings` 解析。映射可以通过模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。

### 安全性

- 将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。
- 使用专用的 hook token；不要复用 gateway 身份验证 token。
- 将 `hooks.path` 放在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你确实需要由调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也要同时设置 `hooks.allowedSessionKeyPrefixes`，以约束允许的会话键形态。
- 默认情况下，hook 负载会被安全边界包装。

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

**前提条件**：`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出此行为。

### 手动一次性设置

1. 选择由 `gog` 使用的 OAuth 客户端所属的 GCP 项目：

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 创建主题并授予 Gmail 推送权限：

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

## 管理任务

```bash
# 列出所有任务
openclaw cron list

# 显示单个任务，包括解析后的投递路由
openclaw cron show <jobId>

# 编辑任务
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行任务
openclaw cron run <jobId>

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 删除任务
openclaw cron remove <jobId>

# 智能体选择（多智能体设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改任务所选的模型。
- 如果该模型被允许，独立智能体运行将使用这个精确的 provider/模型。
- 如果不被允许，cron 会发出警告，并回退到任务的智能体/默认模型选择。
- 已配置的回退链仍然适用，但普通的 `--model` 覆盖如果没有显式的逐任务回退列表，就不再静默回落到智能体主模型作为额外的重试目标。

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

运行时状态 sidecar 由 `cron.store` 推导而来：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则会追加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

**一次性任务重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

**循环任务重试**：重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后会重置退避状态。

**维护**：`cron.sessionRetention`（默认 `24h`）会清理独立运行的会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。

## 故障排除

### 命令排查顺序

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
- 确认 Gateway 网关正在持续运行。
- 对于 `cron` 调度，请核对时区（`--tz`）与主机时区是否一致。
- 运行输出中的 `reason: not-due` 表示你通过 `openclaw cron run <jobId> --due` 检查了手动运行，但该任务尚未到期。

### Cron 已触发但没有投递

- 投递模式为 `none` 表示不应期待运行器执行回退发送。如果聊天路由可用，智能体仍可通过 `message` 工具直接发送。
- 投递目标缺失/无效（`channel`/`to`）表示已跳过出站发送。
- 渠道身份验证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
- 如果独立运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接的出站投递，也会抑制回退的排队摘要路径，因此不会有任何内容发回聊天。
- 如果智能体应自行向用户发送消息，请检查该任务是否具有可用路由（带有先前聊天记录的 `channel: "last"`，或显式的渠道/目标）。

### 时区注意事项

- 不带 `--tz` 的 cron 会使用 Gateway 网关主机时区。
- 不带时区的 `at` 调度会被视为 UTC。
- Heartbeat 的 `activeHours` 使用已配置的时区解析。

## 相关内容

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
