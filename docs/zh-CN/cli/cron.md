---
read_when:
    - 你想要计划任务和唤醒功能
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-04-27T06:34:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2997467e11d787009920d5036a2590780839b219d8be6804a9ee61fd9b11a585
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令列表。概念指南请参阅 [Cron jobs](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建一个全新的转录和会话 id。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到一个显式的持久会话键。
  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及用户显式选择的模型或认证覆盖项可以在多次运行之间保留。
  </Accordion>
</AccordionGroup>

## 交付

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的交付路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析得到，或将以失败关闭。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 交付。使用 `--no-deliver` 可将输出保留为内部可见。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 交付归属

隔离 cron 聊天交付由智能体和运行器共享负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 只有当智能体未直接发送到解析出的目标时，`announce` 才会回退交付最终回复。
- `webhook` 会将完成后的负载发布到一个 URL。
- `none` 会禁用运行器的回退交付。

`--announce` 是针对最终回复的运行器回退交付。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天交付目标，以便进行回退 announce 交付。内部会话键可能为小写；不要将它们用作区分大小写的 provider ID 的真实来源，例如 Matrix 房间 ID。

### 失败交付

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主 announce 目标（当未设置显式失败目标时）。

<Note>
主会话作业仅在主交付模式为 `webhook` 时才可使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级别的智能体失败视为作业错误，即使没有生成回复负载也是如此，因此模型/provider 失败仍会增加错误计数并触发失败通知。

## 调度

### 单次作业

`--at <datetime>` 用于安排一次性运行。没有偏移量的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，此时会将墙上时钟时间按给定时区解释。

<Note>
单次作业默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性作业

周期性作业在连续出错后使用指数退避重试：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但你可以通过 `openclaw cron edit <job-id> --failure-alert-include-skipped` 让失败告警选择加入重复的跳过运行通知。

### 手动运行

`openclaw cron run` 会在手动运行入队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为作业选择一个允许的模型。

<Warning>
如果该模型不被允许，cron 会发出警告，并回退到作业的智能体或默认模型选择。已配置的回退链仍然适用，但普通模型覆盖在没有显式逐作业回退列表时，不再把智能体主模型作为隐藏的额外重试目标附加进去。
</Warning>

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail-hook 覆盖项。
2. 逐作业 `--model`。
3. 已存储的 cron 会话模型覆盖项（当用户选择过一个时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认适用，但已存储会话中的 `fastMode` 覆盖项仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为当前运行持久化切换后的 provider 和模型（以及存在时切换后的认证配置覆盖项）。外层重试循环在初次尝试后最多允许两次切换重试，随后会中止，而不是无限循环。

## 运行输出与拒绝

### 过时确认抑制

隔离 cron 回合会抑制过时的“仅确认”回复。如果第一个结果只是一个临时状态更新，且没有后代子智能体运行负责最终答案，cron 会在交付前再次提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接的对外交付和回退排队摘要路径，因此不会向聊天回发任何内容。

### 结构化拒绝

隔离 cron 运行会优先使用嵌入式运行中的结构化执行拒绝元数据，然后再回退到最终输出中已知的拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和审批绑定拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧作业

<Note>
如果你有早于当前交付和存储格式的 cron 作业，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层交付字段，包括旧版 `threadId`、负载中的 `provider` 交付别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 交付。
</Note>

## 常见编辑

在不更改消息的情况下更新交付设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用交付：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建一个带轻量级引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离智能体回合作业。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集。

## 常见管理命令

手动运行与检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含交付诊断信息，其中包括预期的 cron 目标、解析后的目标、message-tool 发送情况、回退使用情况以及交付状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

交付调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关内容

- [CLI reference](/zh-CN/cli)
- [Scheduled tasks](/zh-CN/automation/cron-jobs)
