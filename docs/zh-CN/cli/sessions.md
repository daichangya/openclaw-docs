---
read_when:
    - 你想要列出已存储的会话并查看最近的活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储的会话和用量）'
title: 会话
x-i18n:
    generated_at: "2026-04-24T03:15:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a169df4cda657dca16c24978d9437b537c0c604969add4ad6d6237e4e50e0a33
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

列出已存储的对话会话。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

范围选择：

- 默认：已配置的默认智能体存储
- `--verbose`：详细日志
- `--agent <id>`：一个已配置的智能体存储
- `--all-agents`：汇总所有已配置的智能体存储
- `--store <path>`：显式指定存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）

`openclaw sessions --all-agents` 会读取已配置的智能体存储。Gateway 网关和 ACP
会话发现的范围更广：它们还会包含在默认 `agents/` 根目录下或模板化的 `session.store` 根目录下找到的仅存在于磁盘上的存储。那些发现到的存储必须解析为智能体根目录内的常规 `sessions.json` 文件；符号链接和根目录之外的路径会被跳过。

JSON 示例：

`openclaw sessions --all-agents --json`：

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 清理维护

立即运行维护（而不是等待下一次写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围说明：`openclaw sessions cleanup` 仅维护会话存储 / transcript。它不会清理 cron 运行日志（`cron/runs/<jobId>.jsonl`）；这些日志由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/zh-CN/automation/cron-jobs#maintenance) 中说明。

- `--dry-run`：预览将会清理 / 封顶多少条目，而不实际写入。
  - 在文本模式下，dry-run 会打印按会话划分的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以便你查看哪些会被保留，哪些会被移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除 transcript 文件缺失的条目，即使它们通常尚未达到年龄 / 数量限制。
- `--active-key <key>`：保护特定活动键不被磁盘预算淘汰。
- `--agent <id>`：对一个已配置的智能体存储运行清理。
- `--all-agents`：对所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定的 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。配合 `--all-agents` 时，输出会包含每个存储各自的摘要。

`openclaw sessions cleanup --all-agents --dry-run --json`：

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

相关内容：

- 会话配置：[Configuration reference](/zh-CN/gateway/configuration-reference#session)

## 相关

- [CLI reference](/zh-CN/cli)
- [Session management](/zh-CN/concepts/session)
