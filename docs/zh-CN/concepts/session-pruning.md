---
read_when:
    - 你想减少工具输出导致的上下文膨胀
    - 你想了解 Anthropic 提示缓存优化
summary: 裁剪旧工具结果，以保持上下文精简并提升缓存效率
title: 会话修剪
x-i18n:
    generated_at: "2026-04-23T20:47:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f89c5b11749fc34e963830bd99f5c65ffda1e018299ec54ff09d96f5839da08f
    source_path: concepts/session-pruning.md
    workflow: 15
---

会话修剪会在每次调用 LLM 之前，从上下文中裁剪**旧的工具结果**。它能减少累积工具输出（exec 结果、文件读取结果、搜索结果）带来的上下文膨胀，同时不会改写正常的对话文本。

<Info>
修剪仅在内存中进行 —— 不会修改磁盘上的会话 transcript。
你的完整历史始终会被保留。
</Info>

## 为什么这很重要

长会话会累积工具输出，从而膨胀上下文窗口。这会
增加成本，并可能比实际需要更早触发 [compaction](/zh-CN/concepts/compaction)。

修剪对于 **Anthropic 提示缓存** 尤其有价值。在缓存
TTL 过期后，下一次请求会重新缓存完整提示。修剪会减少
缓存写入大小，从而直接降低成本。

## 工作原理

1. 等待缓存 TTL 过期（默认 5 分钟）。
2. 找出用于常规修剪的旧工具结果（对话文本保持不变）。
3. **软裁剪**超大结果 —— 保留开头和结尾，并插入 `...`。
4. **硬清空**其余内容 —— 替换为占位符。
5. 重置 TTL，以便后续请求复用新的缓存。

## 旧版图像清理

OpenClaw 还会针对较旧的 legacy 会话执行一个单独的幂等清理流程，这些会话曾将原始图像块持久化到历史中。

- 它会逐字节保留**最近 3 个已完成轮次**，以便近期后续请求的提示
  缓存前缀保持稳定。
- 较旧的、已经被处理过的 `user` 或 `toolResult` 历史中的图像块，
  可能会被替换为 `[image data removed - already processed by model]`。
- 这与常规的缓存 TTL 修剪不同。它的存在是为了防止重复的
  图像负载在后续轮次中破坏提示缓存。

## 智能默认值

OpenClaw 会为 Anthropic profiles 自动启用修剪：

| Profile 类型 | 已启用修剪 | Heartbeat |
| ------------ | ---------- | --------- |
| Anthropic OAuth/token auth（包括 Claude CLI 复用） | 是 | 1 小时 |
| API key | 是 | 30 分钟 |

如果你设置了显式值，OpenClaw 不会覆盖它们。

## 启用或禁用

对于非 Anthropic 提供商，修剪默认关闭。要启用：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

要禁用：将 `mode` 设为 `off`。

## 修剪与压缩

|            | 修剪 | 压缩 |
| ---------- | ---- | ---- |
| **内容**   | 裁剪工具结果 | 总结对话 |
| **会保存吗？** | 否（按请求） | 是（保存到 transcript） |
| **范围**   | 仅工具结果 | 整个对话 |

它们是互补关系 —— 修剪可在各次
压缩周期之间保持工具输出精简。

## 延伸阅读

- [Compaction](/zh-CN/concepts/compaction) —— 基于摘要的上下文缩减
- [Gateway Configuration](/zh-CN/gateway/configuration) —— 所有修剪配置项
  （`contextPruning.*`）
