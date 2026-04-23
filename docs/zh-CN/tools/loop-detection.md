---
read_when:
    - 有用户报告智能体会卡在重复调用工具的循环中
    - 你需要调优重复调用保护
    - 你正在编辑智能体工具 / 运行时策略
summary: 如何启用并调优用于检测重复工具调用循环的护栏
title: 工具循环检测
x-i18n:
    generated_at: "2026-04-23T23:05:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw 可以防止智能体陷入重复工具调用模式。
该护栏**默认关闭**。

仅在确有需要时启用它，因为在设置过严时，它可能会阻止合法的重复调用。

## 为什么需要这个功能

- 检测没有进展的重复序列。
- 检测高频、无结果的循环（相同工具、相同输入、重复错误）。
- 检测已知轮询工具的特定重复调用模式。

## 配置块

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

- `enabled`：总开关。`false` 表示不执行任何循环检测。
- `historySize`：用于分析的最近工具调用保留数量。
- `warningThreshold`：在将某种模式归类为仅警告之前的阈值。
- `criticalThreshold`：用于阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展熔断阈值。
- `detectors.genericRepeat`：检测“相同工具 + 相同参数”的重复模式。
- `detectors.knownPollNoProgress`：检测无状态变化的已知轮询类模式。
- `detectors.pingPong`：检测交替出现的乒乓模式。

## 推荐设置

- 从 `enabled: true` 开始，其余默认值保持不变。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和 / 或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用引发问题的 detector
  - 减小 `historySize`，以降低历史上下文的严格程度

## 日志和预期行为

当检测到循环时，OpenClaw 会报告一个循环事件，并根据严重程度阻止或抑制下一次工具循环。
这可以在保留正常工具访问能力的同时，防止 token 开销失控和卡死。

- 优先采用警告和临时抑制。
- 只有在重复证据持续积累时才升级处理。

## 说明

- `tools.loopDetection` 会与智能体级覆盖配置合并。
- 按智能体配置会完整覆盖或扩展全局值。
- 如果不存在任何配置，护栏将保持关闭。

## 相关内容

- [Exec 批准](/zh-CN/tools/exec-approvals)
- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
