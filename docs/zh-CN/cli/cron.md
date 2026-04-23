---
read_when:
    - 你希望使用计划任务和唤醒机制
    - 你正在调试 cron 执行与日志
summary: '`openclaw cron` 的 CLI 参考（用于计划和运行后台任务）'
title: Cron
x-i18n:
    generated_at: "2026-04-23T20:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f83605fce0888b14a148f2eb521a0d70343c535c80c67ba21a7985aa58716c5a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

相关内容：

- Cron jobs：[Cron jobs](/zh-CN/automation/cron-jobs)

提示：运行 `openclaw cron --help` 可查看完整命令界面。

注意：`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示该路由是从主/当前会话解析得到，还是会以失败关闭的方式终止。

注意：隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留为内部可见。`--deliver` 仍保留为 `--announce` 的已弃用别名。

注意：隔离 cron 聊天投递是共享的。`--announce` 是最终回复的运行器回退投递；`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

注意：一次性（`--at`）作业默认在成功后删除。使用 `--keep-after-run` 可在运行后保留它们。

注意：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。
使用 `current` 可在创建时绑定到活动会话，或使用 `session:<id>` 指定显式持久会话键。

注意：对于一次性 CLI 作业，无偏移量的 `--at` 日期时间默认按 UTC 处理，除非你同时传递 `--tz <iana>`，此时会按给定时区解释该本地墙上时钟时间。

注意：循环作业现在会在连续错误后使用指数退避重试（30s → 1m → 5m → 15m → 60m），并在下一次成功运行后恢复正常计划。

注意：`openclaw cron run` 现在会在手动运行被加入执行队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

注意：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。

注意：隔离 cron 轮次会抑制过期的仅确认型回复。如果第一个结果只是中间状态更新，且没有后代子智能体运行负责最终答案，cron 会在投递前再次提示一次以获取真实结果。

注意：如果隔离 cron 运行只返回静默 token（`NO_REPLY` / `no_reply`），cron 会同时抑制直接出站投递和回退排队摘要路径，因此不会向聊天回发任何内容。

注意：`cron add|edit --model ...` 会为该作业使用选定的允许模型。
如果该模型不被允许，cron 会发出警告，并回退到该作业的智能体/默认模型选择。已配置的回退链仍然适用，但如果只是纯模型覆盖且没有显式的每作业回退列表，则不会再把智能体主模型作为隐藏的额外重试目标附加进去。

注意：隔离 cron 的模型优先级依次为：Gmail hook 覆盖优先，然后是每作业 `--model`，再然后是任何已存储的 cron 会话模型覆盖，最后才是正常的智能体/默认选择。

注意：隔离 cron 快速模式会跟随解析后的 live 模型选择。模型配置 `params.fastMode` 默认生效，但已存储会话的 `fastMode` 覆盖仍优先于配置。

注意：如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前持久化已切换的 provider/模型（如果存在，也包括切换后的认证配置覆盖）。外层重试循环在初次尝试后最多只允许 2 次切换重试，之后会中止，而不是无限循环。

注意：失败通知会优先使用 `delivery.failureDestination`，其次是全局 `cron.failureDestination`，最后在未配置显式失败目标时回退到该作业的主要 announce 目标。

注意：保留/清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有早于当前投递/存储格式的旧 cron 作业，请运行
`openclaw doctor --fix`。Doctor 现在会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、payload `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 投递。

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道进行 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建带轻量引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次作业。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集。

投递归属说明：

- 隔离 cron 聊天投递是共享的。当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到解析出的目标时，才会回退投递最终回复。`webhook` 会将完成后的 payload 发布到某个 URL。
  `none` 会禁用运行器回退投递。

## 常见管理命令

手动运行：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、已解析目标、message 工具发送、回退使用情况以及已投递状态。

智能体/会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

投递微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失败投递说明：

- `delivery.failureDestination` 适用于隔离作业。
- 主会话作业只有在主投递模式为 `webhook` 时，才可以使用 `delivery.failureDestination`。
- 如果你没有设置任何失败目标，而该作业已经向某个渠道执行 announce，则失败通知会复用相同的 announce 目标。
