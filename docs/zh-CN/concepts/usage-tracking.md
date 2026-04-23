---
read_when:
    - 你正在接入提供商使用量/配额表面
    - 你需要解释使用量跟踪行为或认证要求
summary: 使用量跟踪表面与凭证要求
title: 使用量跟踪
x-i18n:
    generated_at: "2026-04-23T20:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90319d80eff142c9e772b55e877f24b021a871357552a60d3a3d94efeb0bb4bb
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## 它是什么

- 直接从提供商的使用量端点拉取使用量/配额。
- 不做成本估算；只显示提供商报告的窗口。
- 人类可读的状态输出会统一规范化为 `X% left`，即使上游 API
  报告的是已消耗配额、剩余配额，或仅有原始计数。
- 会话级的 `/status` 和 `session_status` 可以在实时会话快照信息稀疏时，回退到最新的转录使用情况条目。该回退会填补缺失的 token/cache 计数、可恢复当前运行时模型标签，并在会话元数据缺失或更小时，优先采用更大的、面向提示词的总量。现有的非零实时值仍然优先。

## 它显示在哪里

- 聊天中的 `/status`：带丰富 emoji 的状态卡片，显示会话 token + 估算成本（仅 API 密钥）。在可用时，提供商使用量会针对**当前模型提供商**显示为规范化的 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：每次响应后的使用量页脚（OAuth 仅显示 token）。
- 聊天中的 `/usage cost`：基于 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 打印完整的按提供商划分明细。
- CLI：`openclaw channels list` 会在提供商配置旁打印同样的使用量快照（使用 `--no-usage` 可跳过）。
- macOS 菜单栏：“Context” 下的 “Usage” 部分（仅在可用时显示）。

## 提供商 + 凭证

- **Anthropic（Claude）**：认证配置文件中的 OAuth 令牌。
- **GitHub Copilot**：认证配置文件中的 OAuth 令牌。
- **Gemini CLI**：认证配置文件中的 OAuth 令牌。
  - JSON 使用量会回退到 `stats`；`stats.cached` 会被规范化为
    `cacheRead`。
- **OpenAI Codex**：认证配置文件中的 OAuth 令牌（存在时使用 accountId）。
- **MiniMax**：API 密钥或 MiniMax OAuth 认证配置文件。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额
  表面，优先使用已存储的 MiniMax OAuth，若不存在则回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示的是**剩余**
  配额，因此 OpenClaw 会在显示前对其进行反转；若存在基于计数的字段，则它们优先。
  - Coding-plan 窗口标签优先来自提供商的小时/分钟字段，
    若不存在，则回退到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先选择
    chat-model 条目，在缺少显式 `window_hours` / `window_minutes` 字段时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- **Xiaomi MiMo**：通过 env/config/auth store 提供的 API 密钥（`XIAOMI_API_KEY`）。
- **z.ai**：通过 env/config/auth store 提供的 API 密钥。

当无法解析出可用的提供商使用量认证时，使用量信息会被隐藏。提供商
可以提供插件特定的使用量认证逻辑；否则，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥凭证。
