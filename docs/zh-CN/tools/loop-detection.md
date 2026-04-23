---
read_when:
    - 用户报告智能体卡在重复调用工具 to=final code omitted
    - 你需要调优重复调用保护 to=final code omitted
    - 你正在编辑智能体工具/运行时策略 to=final code omitted
summary: 如何启用并调整用于检测重复工具调用循环的护栏到=final code omitted
title: 工具循环检测 to=final code omitted
x-i18n:
    generated_at: "2026-04-23T21:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ed536153307e72398e767b6db537e8fe48cc3844552991d7c54b614ee4cd5fe
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw 可以防止智能体陷入重复工具调用模式。
该护栏**默认关闭**。

仅在确有需要时启用它，因为在严格设置下，它可能会拦截合法的重复调用。

## 为什么需要这个功能

- 检测没有取得进展的重复序列。
- 检测高频的无结果循环（同一个工具、同样的输入、重复错误）。
- 针对已知轮询工具检测特定的重复调用模式。

## 配置区块

全局默认值：

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

按智能体覆盖（可选）：

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### 字段行为

- `enabled`：主开关。`false` 表示不执行任何循环检测。
- `historySize`：保留用于分析的最近工具调用数量。
- `warningThreshold`：在将某个模式归类为仅警告之前的阈值。
- `criticalThreshold`：用于阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测相同工具 + 相同参数的重复模式。
- `detectors.knownPollNoProgress`：检测没有状态变化的已知轮询型模式。
- `detectors.pingPong`：检测交替出现的 ping-pong 模式。

## 推荐设置

- 从 `enabled: true` 开始，其他默认值保持不变。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用造成问题的 detector
  - 降低 `historySize`，以减少历史上下文的严格程度

## 日志和预期行为

当检测到循环时，OpenClaw 会报告一个循环事件，并根据严重程度阻止或抑制下一轮工具循环。
这样可以在保留正常工具访问的同时，保护用户免受失控 token 消耗和卡死的影响。

- 优先采用警告和临时抑制。
- 仅在重复证据持续累积时才升级。

## 说明

- `tools.loopDetection` 会与智能体级覆盖项合并。
- 按智能体配置会完全覆盖或扩展全局值。
- 如果不存在任何配置，护栏将保持关闭。
