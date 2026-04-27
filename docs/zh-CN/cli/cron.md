---
read_when:
    - 你希望使用计划任务和唤醒机制
    - 你正在调试 Cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台任务）'
title: Cron
x-i18n:
    generated_at: "2026-04-27T06:03:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 498759e5682d63a2f3f96fd4dcdc7402f1398a6b1a835e6a3b624e526fec5ce3
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 Cron 任务。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。概念指南参见 [Cron 任务](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的转录和会话 id。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久会话键。
  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境会话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及用户显式选择的模型或认证覆盖可以在多次运行之间保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析得到，或者会以失败关闭方式结束。

<Note>
隔离的 `cron add` 任务默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出仅保留在内部。`--deliver` 仍保留为 `--announce` 的已弃用别名。
</Note>

### 投递归属

隔离的 Cron 聊天投递由智能体与运行器共同负责：

- 当聊天路由可用时，智能体可以直接使用 `message` 工具发送。
- 仅当智能体未直接向解析出的目标发送时，`announce` 才会回退投递最终回复。
- `webhook` 会将完成后的载荷 POST 到某个 URL。
- `none` 会禁用运行器的回退投递。

`--announce` 是针对最终回复的运行器回退投递。`--no-deliver` 会禁用该回退，但不会在聊天路由可用时移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，以用于回退 announce 投递。内部会话键可能是小写；不要将它们用作区分大小写的提供商 ID（例如 Matrix 房间 ID）的真实来源。

### 失败投递

失败通知按以下顺序解析：

1. 任务上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 任务的主 announce 目标（当未设置显式失败目标时）。

<Note>
主会话任务仅可在主投递模式为 `webhook` 时使用 `delivery.failureDestination`。隔离任务在所有模式下都接受它。
</Note>

注意：隔离的 Cron 运行会将运行级智能体失败视为任务错误，即使没有生成回复载荷也是如此，因此模型/提供商失败仍会增加错误计数并触发失败通知。

## 调度

### 一次性任务

`--at <datetime>` 会调度一次性运行。不带偏移量的日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，此时会按给定时区解释该墙上时间。

<Note>
一次性任务默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性任务

周期性任务在连续错误后使用指数退避重试：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

### 手动运行

`openclaw cron run` 在手动运行进入队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为任务选择一个允许的模型。

<Warning>
如果该模型不被允许，Cron 会发出警告，并回退到该任务的智能体或默认模型选择。已配置的回退链仍然适用，但仅设置模型覆盖且没有显式的按任务回退列表时，不会再将智能体主模型作为隐藏的额外重试目标附加进去。
</Warning>

### 隔离 Cron 模型优先级

隔离的 Cron 按以下顺序解析活动模型：

1. Gmail-hook 覆盖。
2. 按任务设置的 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择了某个模型时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 Cron 的快速模式会遵循解析出的实时模型选择。模型配置 `params.fastMode` 默认生效，但已存储的会话 `fastMode` 覆盖仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，Cron 会在重试前为当前运行持久化切换后的 provider 和模型（以及存在时切换后的 auth profile 覆盖）。外层重试循环在初始尝试之后最多进行两次切换重试，然后中止，而不是无限循环。

## 运行输出与拒绝

### 过时确认抑制

隔离的 Cron 回合会抑制过时的仅确认回复。如果第一个结果只是中间状态更新，且没有后代子智能体运行负责最终答案，Cron 会在投递前再次提示一次以获取真实结果。

### 静默令牌抑制

如果某次隔离 Cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），Cron 会同时抑制直接出站投递和回退排队摘要路径，因此不会向聊天回传任何内容。

### 结构化拒绝

隔离的 Cron 运行会优先使用嵌入式运行中的结构化执行拒绝元数据，随后才回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和批准绑定拒绝短语。

`cron list` 和运行历史会展示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留与清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧任务

<Note>
如果你有早于当前投递和存储格式的 Cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 Cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、载荷 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退任务迁移为显式 webhook 投递。
</Note>

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离任务的投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道公告：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建带有轻量引导上下文的隔离任务：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体回合任务。对于 Cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

## 常见管理命令

手动运行与检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包括投递诊断信息，其中包括预期的 Cron 目标、解析后的目标、message 工具发送、回退使用情况以及已投递状态。

智能体与会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

投递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [计划任务](/zh-CN/automation/cron-jobs)
