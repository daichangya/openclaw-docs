---
read_when:
    - 你正在更改向模型或用户显示时间戳的方式
    - 你正在调试消息或系统提示词输出中的时间格式问题
summary: 封装、提示词、工具和连接器中的日期与时间处理
title: 日期与时间
x-i18n:
    generated_at: "2026-04-23T20:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# 日期与时间

OpenClaw 默认对**传输时间戳使用主机本地时间**，并且**仅在系统提示词中使用用户时区**。
提供商时间戳会被保留，因此工具会保持其原生语义（当前时间可通过 `session_status` 获取）。

## 消息封装（默认使用本地时间）

入站消息会被包装上一个时间戳（精确到分钟）：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

这个封装时间戳默认使用**主机本地时间**，无论提供商时区是什么。

你可以覆盖此行为：

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
- `envelopeTimezone: "local"` 使用主机时区。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机时区）。
- 使用显式 IANA 时区（例如 `"America/Chicago"`）可固定到某个时区。
- `envelopeTimestamp: "off"` 会从封装头中移除绝对时间戳。
- `envelopeElapsed: "off"` 会移除耗时后缀（即 `+2m` 这种样式）。

### 示例

**本地时间（默认）：**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**启用耗时：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系统提示词：当前日期与时间

如果已知用户时区，系统提示词会包含一个专门的
**当前日期与时间**部分，其中仅包含**时区**（不含时钟 / 时间格式），
以保持提示词缓存稳定：

```
Time zone: America/Chicago
```

当智能体需要当前时间时，请使用 `session_status` 工具；状态
卡片中包含时间戳行。

## 系统事件行（默认使用本地时间）

插入到智能体上下文中的排队系统事件会使用时间戳作为前缀，采用与消息封装相同的时区选择逻辑（默认：主机本地时间）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 配置用户时区 + 时间格式

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` 为提示词上下文设置**用户本地时区**。
- `timeFormat` 控制提示词中的**12 小时 / 24 小时显示**。`auto` 会遵循 OS 偏好设置。

## 时间格式检测（auto）

当 `timeFormat: "auto"` 时，OpenClaw 会检查 OS 偏好设置（macOS / Windows），
并回退为 locale 格式。检测结果会**按进程缓存**，
以避免重复的系统调用。

## 工具负载 + 连接器（原始提供商时间 + 标准化字段）

渠道工具会返回**提供商原生时间戳**，并添加标准化字段以保持一致性：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

原始提供商字段会被保留，因此不会丢失任何信息。

- Slack：来自 API 的类 epoch 字符串
- Discord：UTC ISO 时间戳
- Telegram / WhatsApp：提供商专用的数字 / ISO 时间戳

如果你需要本地时间，请在下游使用已知时区进行转换。

## 相关文档

- [System Prompt](/zh-CN/concepts/system-prompt)
- [Timezones](/zh-CN/concepts/timezone)
- [Messages](/zh-CN/concepts/messages)
