---
read_when:
    - 你正在接入提供商用量 / 配额界面
    - 你需要解释用量跟踪行为或认证要求
summary: 用量跟踪界面和凭证要求
title: 用量跟踪
x-i18n:
    generated_at: "2026-04-23T22:57:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## 它是什么

- 直接从提供商的用量端点拉取提供商用量 / 配额。
- 不提供估算成本；只使用提供商报告的时间窗口。
- 人类可读的状态输出会统一规范为 `X% left`，即使上游 API 报告的是已消费配额、剩余配额，或仅提供原始计数。
- 会话级 `/status` 和 `session_status` 在实时会话快照信息较少时，可以回退到最新的转录用量条目。该回退可补齐缺失的 token / cache 计数器，可恢复当前运行时模型标签，并且当会话元数据缺失或值更小时，会优先采用更大的、偏向提示词的总量。现有的非零实时值仍然优先。

## 它显示在哪里

- 聊天中的 `/status`：带有丰富 emoji 的状态卡片，显示会话 token 数和估算成本（仅 API key）。如果可用，还会显示**当前模型提供商**的提供商用量，格式统一为 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：每次响应后的用量页脚（OAuth 仅显示 token）。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 输出完整的按提供商划分明细。
- CLI：`openclaw channels list` 会在提供商配置旁输出相同的用量快照（使用 `--no-usage` 可跳过）。
- macOS 菜单栏：Context 下的 “Usage” 部分（仅在可用时显示）。

## 提供商和凭证

- **Anthropic（Claude）**：认证配置文件中的 OAuth token。
- **GitHub Copilot**：认证配置文件中的 OAuth token。
- **Gemini CLI**：认证配置文件中的 OAuth token。
  - JSON 用量会回退到 `stats`；`stats.cached` 会被规范化为
    `cacheRead`。
- **OpenAI Codex**：认证配置文件中的 OAuth token（如存在则使用 accountId）。
- **MiniMax**：API key 或 MiniMax OAuth 认证配置文件。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额界面，优先使用已存储的 MiniMax OAuth，否则回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示的是**剩余**
  配额，因此 OpenClaw 会在显示前将其反转；如存在基于计数的字段，则优先使用计数字段。
  - 编码计划窗口标签优先来自提供商的小时 / 分钟字段，如不存在，则回退到 `start_time` / `end_time` 的时间跨度。
  - 如果编码计划端点返回 `model_remains`，OpenClaw 会优先选择聊天模型条目，在缺少显式 `window_hours` / `window_minutes` 字段时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- **Xiaomi MiMo**：通过环境变量 / 配置 / auth 存储提供 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过环境变量 / 配置 / auth 存储提供 API key。

当无法解析出可用的提供商用量认证信息时，用量会被隐藏。提供商可以提供插件专属的用量认证逻辑；否则 OpenClaw 会回退为匹配来自认证配置文件、环境变量或配置中的 OAuth / API key 凭证。

## 相关内容

- [Token 使用与成本](/zh-CN/reference/token-use)
- [API 用量与成本](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
