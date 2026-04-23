---
read_when:
    - 更新提供商重试行为或默认值
    - 调试提供商发送错误或速率限制
summary: 出站提供商调用的重试策略
title: 重试策略
x-i18n:
    generated_at: "2026-04-23T02:36:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# 重试策略

## 目标

- 按每个 HTTP 请求重试，而不是按多步骤流程重试。
- 仅重试当前步骤，以保留顺序。
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

- OpenClaw 让 provider SDK 处理常规的短时重试。
- 对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，可重试响应（`408`、`409`、`429` 和 `5xx`）可以包含 `retry-after-ms` 或 `retry-after`。当该等待时间长于 60 秒时，OpenClaw 会注入 `x-should-retry: false`，使 SDK 立即暴露错误，并让模型故障切换轮换到另一个认证配置文件或回退模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖该上限。
  将其设置为 `0`、`false`、`off`、`none` 或 `disabled`，即可让 SDK 在内部遵循较长的 `Retry-After` 睡眠等待。

### Discord

- 仅在速率限制错误（HTTP 429）时重试。
- 在可用时使用 Discord 的 `retry_after`，否则使用指数退避。

### Telegram

- 在瞬态错误时重试（429、超时、连接/重置/关闭、暂时不可用）。
- 在可用时使用 `retry_after`，否则使用指数退避。
- Markdown 解析错误不会重试；它们会回退为纯文本。

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

- 重试按每个请求生效（消息发送、媒体上传、表情回应、投票、贴纸）。
- 复合流程不会重试已完成的步骤。
