---
read_when:
    - 调度后台任务或唤醒操作
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
summary: Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-20T18:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e25f4dc8ee7b8f88e22d5cbc86e4527a9f5ac0ab4921e7874f76b186054682a3
    source_path: automation/cron-jobs.md
    workflow: 15
---

# 计划任务（Cron）

Cron 是 Gateway 网关内置的调度器。它会持久化任务，在正确时间唤醒智能体，并可将输出回传到聊天渠道或 webhook 端点。

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

# 检查你的任务
openclaw cron list

# 查看运行历史
openclaw cron runs --id <job-id>
```

## Cron 的工作方式

- Cron **在 Gateway 网关进程内部**运行（不是在模型内部）。
- 任务定义持久化保存在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失计划。
- 运行时执行状态保存在旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 `.gitignore`。
- 在拆分之后，较旧版本的 OpenClaw 可以读取 `jobs.json`，但可能会将任务视为全新任务，因为运行时字段现在位于 `jobs-state.json` 中。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认会在成功后自动删除。
- 独立的 cron 运行会在运行完成后，尽力关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，这样分离的浏览器自动化就不会留下孤儿进程。
- 独立的 cron 运行还会防止过时的确认回复。如果第一个结果只是中间状态更新（如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次，以获取实际结果。

<a id="maintenance"></a>

Cron 的任务协调由运行时负责：只要 cron 运行时仍在跟踪该任务为运行中，活动中的 cron 任务就会保持存活，即使旧的子会话记录仍然存在也是如此。
一旦运行时不再拥有该任务，且 5 分钟的宽限窗口到期，维护流程就可以将该任务标记为 `lost`。

## 计划类型

| Kind    | CLI 标志 | 说明 |
| ------- | --------- | ---- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every` | 固定间隔 |
| `cron`  | `--cron`  | 5 字段或 6 字段的 cron 表达式，可选 `--tz` |

不带时区的时间戳会被视为 UTC。如需按本地时钟时间调度，请添加 `--tz America/New_York`。

整点循环表达式会自动错峰，最多延迟 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错峰窗口。

### 每月日期与每周日期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“每月第几天”和“每周第几天”字段都不是通配符时，croner 会在**任一**字段匹配时触发，而不是两个字段都匹配时才触发。这是标准的 Vixie cron 行为。

```
# 预期：“每月 15 日早上 9 点，并且只有当它是周一时”
# 实际：  “每月每个 15 日早上 9 点，以及每个周一早上 9 点”
0 9 15 * 1
```

这会导致它每月触发约 5–6 次，而不是 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件都满足，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或仅按一个字段调度，并在任务的提示词或命令中对另一个条件进行判断。

## 执行样式

| 样式 | `--session` 值 | 运行位置 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话 | `main` | 下一次 heartbeat 轮次 | 提醒、系统事件 |
| 独立 | `isolated` | 专用 `cron:<jobId>` | 报告、后台杂务 |
| 当前会话 | `current` | 在创建时绑定 | 依赖上下文的循环工作 |
| 自定义会话 | `session:custom-id` | 持久化命名会话 | 基于历史构建的工作流 |

**主会话**任务会排入一个系统事件，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。**独立**任务会在一个全新会话中运行专用的智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持类似“每日站会”这类基于先前摘要持续构建的工作流。

对于独立任务，运行时清理现在包含对此 cron 会话的尽力浏览器清理。清理失败会被忽略，因此实际的 cron 结果仍然优先。

当独立的 cron 运行编排子智能体时，交付也会优先使用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该不完整的父级更新，而不是将其对外宣布。

### 独立任务的负载选项

- `--message`：提示文本（独立任务必需）
- `--model` / `--thinking`：模型和思考级别覆盖
- `--light-context`：跳过工作区引导文件注入
- `--tools exec,read`：限制任务可使用的工具

`--model` 会为该任务使用所选的允许模型。如果请求的模型不被允许，cron 会记录一条警告，并回退到该任务的智能体/默认模型选择。已配置的回退链仍然适用，但如果只是普通的模型覆盖且没有显式的每任务回退列表，就不会再把智能体主模型作为隐藏的额外重试目标附加进去。

独立任务的模型选择优先级如下：

1. Gmail hook 模型覆盖（当该运行来自 Gmail，且该覆盖模型被允许时）
2. 每任务负载 `model`
3. 已保存的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果所选模型配置包含 `params.fastMode`，独立 cron 默认也会使用它。已保存的会话 `fastMode` 覆盖在两种方向上都仍然优先于配置。

如果独立运行命中了实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前持久化该实时选择。如果该切换还携带新的凭证配置文件，cron 也会持久化该凭证配置文件覆盖。重试次数是有上限的：初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 交付与输出

| 模式 | 发生的事情 |
| ---------- | -------------------------------------------------------- |
| `announce` | 将摘要交付到目标渠道（独立任务默认） |
| `webhook`  | 向某个 URL `POST` 已完成事件负载 |
| `none`     | 仅内部使用，不交付 |

使用 `--announce --channel telegram --to "-1001234567890"` 可进行渠道交付。对于 Telegram forum 话题，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。

对于由 cron 拥有的独立任务，运行器拥有最终交付路径。系统会提示智能体返回纯文本摘要，然后该摘要会通过 `announce`、`webhook` 发送，或在 `none` 模式下保留为内部内容。`--no-deliver` 不会把交付权交还给智能体；它会让该运行保持内部状态。

如果原始任务明确要求向某个外部接收方发送消息，智能体应在其输出中说明该消息应发给谁/发往哪里，而不是尝试直接发送。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认目标。
- `job.delivery.failureDestination` 按任务覆盖该设置。
- 如果两者都未设置，且该任务已经通过 `announce` 进行交付，则失败通知现在会回退到该主 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 任务上受支持，除非主交付模式是 `webhook`。

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

带交付的循环独立任务：

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

Gateway 网关可以公开 HTTP webhook 端点，用于外部触发器。在配置中启用：

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

为主会话排入一个系统事件：

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必需）：事件描述
- `mode`（可选）：`now`（默认）或 `next-heartbeat`

### POST /hooks/agent

运行一个独立的智能体轮次：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

字段：`message`（必需）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### 映射 hooks（POST /hooks/\<name\>）

自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。

### 安全性

- 将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。
- 使用专用的 hook token；不要复用 gateway 身份验证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 保持 `hooks.allowRequestSessionKey=false`，除非你确实需要由调用方选择会话。
- 如果你启用了 `hooks.allowRequestSessionKey`，也要设置 `hooks.allowedSessionKeyPrefixes`，以限制允许的会话键形状。
- 默认情况下，hook 负载会被安全边界包装。

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

**前置条件**：`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公开 HTTPS 端点的 Tailscale。

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

1. 选择拥有 `gog` 所用 OAuth 客户端的 GCP 项目：

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 创建 topic 并授予 Gmail 推送访问权限：

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
- 如果该模型被允许，该确切的提供商/模型会传递给独立智能体运行。
- 如果不被允许，cron 会发出警告，并回退到任务的智能体/默认模型选择。
- 已配置的回退链仍然适用，但普通的 `--model` 覆盖如果没有显式的每任务回退列表，就不会再回落到智能体主模型作为静默的额外重试目标。

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

运行时状态 sidecar 由 `cron.store` 推导得出：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则会追加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

**一次性任务重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

**循环任务重试**：在重试之间使用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

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
- 对于 `cron` 计划，确认时区（`--tz`）与主机时区是否一致。
- 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而该任务当时尚未到期。

### Cron 已触发但没有交付

- 交付模式为 `none` 表示不应有任何外部消息。
- 缺少或无效的交付目标（`channel`/`to`）表示出站已被跳过。
- 渠道认证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
- 如果独立运行仅返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退的排队摘要路径，因此不会有任何内容回发到聊天中。
- 对于由 cron 拥有的独立任务，不要期待智能体将 message 工具作为回退方案使用。运行器拥有最终交付权；`--no-deliver` 会让其保持内部状态，而不是允许直接发送。

### 时区注意事项

- 不带 `--tz` 的 cron 使用 gateway 主机时区。
- 不带时区的 `at` 计划会被视为 UTC。
- Heartbeat `activeHours` 使用已配置的时区解析。

## 相关内容

- [自动化与任务](/zh-CN/automation) — 所有自动化机制总览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
