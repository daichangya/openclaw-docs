---
read_when:
    - 设置无需逐任务提示即可运行的自主智能体工作流
    - 定义智能体可以独立执行的事项与需要人工批准的事项
    - 构建具有清晰边界和升级规则的多程序智能体
summary: 为自主智能体程序定义长期运行权限
title: 长期指令
x-i18n:
    generated_at: "2026-04-23T20:40:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

长期指令为你的智能体授予已定义程序的**长期运行权限**。你无需每次都下达单独的任务指令，而是定义具有清晰范围、触发条件和升级规则的程序——智能体会在这些边界内自主执行。

这就像每周五都对你的助手说“发送每周报告”，与授予长期权限之间的区别：“每周报告由你负责。每周五完成汇总并发送，只有在发现异常时才升级处理。”

## 为什么使用长期指令？

**没有长期指令时：**

- 你必须为每一项任务提示智能体
- 智能体会在请求之间处于空闲状态
- 例行工作容易被忘记或延迟
- 你会成为瓶颈

**使用长期指令时：**

- 智能体会在已定义边界内自主执行
- 例行工作会按计划进行，无需提示
- 你只需处理例外情况和审批事项
- 智能体会高效利用空闲时间

## 它们如何工作

长期指令定义在你的[智能体工作区](/zh-CN/concepts/agent-workspace)文件中。推荐做法是直接将它们写入 `AGENTS.md`（每个会话都会自动注入该文件），这样智能体始终能在上下文中获得这些指令。对于较大的配置，你也可以将其放在专用文件中，例如 `standing-orders.md`，然后从 `AGENTS.md` 中引用它。

每个程序需要指定：

1. **范围**——智能体被授权执行什么
2. **触发条件**——何时执行（计划、事件或条件）
3. **审批门槛**——哪些事项必须先经人工签字批准
4. **升级规则**——何时停止并寻求帮助

智能体会在每个会话中通过工作区引导文件加载这些指令（完整的自动注入文件列表请参阅[智能体工作区](/zh-CN/concepts/agent-workspace)），并结合 [cron jobs](/zh-CN/automation/cron-jobs) 对基于时间的执行进行约束。

<Tip>
将长期指令放入 `AGENTS.md` 中，以确保它们在每个会话中都会被加载。工作区引导会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`——但不会自动注入子目录中的任意文件。
</Tip>

## 长期指令的结构

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## 长期指令 + Cron Jobs

长期指令定义智能体被授权做**什么**。[Cron Jobs](/zh-CN/automation/cron-jobs) 定义事情在**何时**发生。它们协同工作：

```text
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

`cron job` 提示应引用长期指令，而不是重复写一遍：

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 示例

### 示例 1：内容与社交媒体（每周周期）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### 示例 2：财务运营（事件触发）

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 示例 3：监控与告警（持续进行）

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 执行-验证-汇报模式

长期指令与严格的执行纪律结合时效果最佳。长期指令中的每项任务都应遵循这一循环：

1. **执行**——完成实际工作（不要只是确认收到指令）
2. **验证**——确认结果正确（文件存在、消息已送达、数据已解析）
3. **汇报**——告知所有者已完成的事项以及已验证的内容

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

这一模式可以避免最常见的智能体失效方式：确认了任务，但没有真正完成。

## 多程序架构

对于管理多个关注领域的智能体，应将长期指令组织为具有清晰边界的独立程序：

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

每个程序都应具备：

- 自己的**触发节奏**（每周、每月、事件驱动、持续进行）
- 自己的**审批门槛**（某些程序比其他程序需要更严格的监督）
- 清晰的**边界**（智能体应知道一个程序在何处结束，另一个程序从何处开始）

## 最佳实践

### 建议这样做

- 从较窄的权限开始，随着信任建立再逐步扩展
- 为高风险操作定义明确的审批门槛
- 加入“不要做什么”部分——边界与权限同样重要
- 结合 `cron jobs` 实现可靠的基于时间的执行
- 每周查看智能体日志，确认长期指令是否得到遵循
- 随着需求变化更新长期指令——它们是动态文档

### 避免这样做

- 第一天就授予过宽权限（“按你认为最好的方式去做”）
- 跳过升级规则——每个程序都需要“何时停止并提问”的条款
- 假设智能体会记住口头指令——把所有内容都写进文件里
- 将多个关注点混在一个程序中——不同领域应拆分为不同程序
- 忘记通过 `cron jobs` 强制执行——没有触发器的长期指令最终只会变成建议

## 相关内容

- [自动化与任务](/zh-CN/automation)——快速了解所有自动化机制
- [Cron Jobs](/zh-CN/automation/cron-jobs)——长期指令的计划执行机制
- [Hooks](/zh-CN/automation/hooks)——用于智能体生命周期事件的事件驱动脚本
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)——入站 HTTP 事件触发器
- [智能体工作区](/zh-CN/concepts/agent-workspace)——长期指令的存放位置，包括自动注入引导文件的完整列表（AGENTS.md、SOUL.md 等）
