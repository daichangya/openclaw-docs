---
read_when:
    - 你需要了解时间戳如何为模型进行规范化
    - 为系统提示词配置用户时区
summary: 智能体、envelope 和提示词的时区处理
title: 时区
x-i18n:
    generated_at: "2026-04-23T20:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw 会对时间戳进行标准化，这样模型看到的是**单一参考时间**。

## 消息 envelope（默认使用本地时间）

入站消息会被包装成如下 envelope：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

envelope 中的时间戳默认是**主机本地时间**，精确到分钟。

你可以通过以下配置进行覆盖：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机时区）。
- 使用显式 IANA 时区（例如 `"Europe/Vienna"`）可获得固定偏移。
- `envelopeTimestamp: "off"` 会从 envelope 标头中移除绝对时间戳。
- `envelopeElapsed: "off"` 会移除经过时间后缀（即 `+2m` 这种样式）。

### 示例

**本地时间（默认）：**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定时区：**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**经过时间：**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## 工具载荷（原始提供商数据 + 标准化字段）

工具调用（`channels.discord.readMessages`、`channels.slack.readMessages` 等）会返回**原始提供商时间戳**。
我们还会附加标准化字段以保持一致性：

- `timestampMs`（UTC epoch 毫秒）
- `timestampUtc`（ISO 8601 UTC 字符串）

原始提供商字段会被保留。

## 用于系统提示词的用户时区

设置 `agents.defaults.userTimezone`，告诉模型用户的本地时区。如果它
未设置，OpenClaw 会在**运行时解析主机时区**（不会写入配置）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

系统提示词中会包含：

- `Current Date & Time` 部分，带本地时间和时区
- `Time format: 12-hour` 或 `24-hour`

你可以通过 `agents.defaults.timeFormat`（`auto` | `12` | `24`）控制提示词格式。

完整行为和示例请参见 [Date & Time](/zh-CN/date-time)。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat) — 活跃时段会使用时区进行调度
- [Cron Jobs](/zh-CN/automation/cron-jobs) — cron 表达式会使用时区进行调度
- [Date & Time](/zh-CN/date-time) — 完整的日期/时间行为与示例
