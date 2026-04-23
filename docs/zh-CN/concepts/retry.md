---
read_when:
    - 更新提供商重试行为或默认值
    - 调试提供商发送错误或速率限制
summary: 出站提供商调用的重试策略
title: 重试策略
x-i18n:
    generated_at: "2026-04-23T20:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86d2ae5b467fa2dce06873d91c64e0ac62cc57377c3b17e788efdd5646c31fa
    source_path: concepts/retry.md
    workflow: 15
---

## 目标

- 按每个 HTTP 请求重试，而不是按多步骤流程重试。
- 仅重试当前步骤，以保持顺序。
- 避免重复执行非幂等操作。

## 默认值

- 尝试次数：3
- 最大延迟上限：30000 ms
- 抖动：0.1（10%）
- 提供商默认值：
  - Telegram 最小延迟：400 ms
  - Discord 最小延迟：500 ms

## 行为

### 模型提供商

- OpenClaw 会让提供商 SDK 处理常规的短时重试。
- 对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，可重试响应
  （`408`、`409`、`429` 和 `5xx`）可能包含 `retry-after-ms` 或
  `retry-after`。当该等待时间超过 60 秒时，OpenClaw 会注入
  `x-should-retry: false`，使 SDK 立即返回错误，并让模型
  故障转移切换到另一个认证配置或回退模型。
- 可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖此上限。
  将其设置为 `0`、`false`、`off`、`none` 或 `disabled`，即可让 SDK 在内部遵循较长的
  `Retry-After` 休眠。

### Discord

- 仅在速率限制错误（HTTP 429）时重试。
- 优先使用 Discord 的 `retry_after`，否则使用指数退避。

### Telegram

- 在瞬时错误时重试（429、超时、连接 / 重置 / 关闭、暂时不可用）。
- 优先使用 `retry_after`，否则使用指数退避。
- Markdown 解析错误不会重试；会回退为纯文本。

## 配置

在 `~/.openclaw/openclaw.json` 中为每个提供商设置重试策略：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 说明

- 重试按每个请求生效（消息发送、媒体上传、回应、投票、贴纸）。
- 复合流程不会重试已完成的步骤。
