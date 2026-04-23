---
read_when:
    - 你想减少由工具输出导致的上下文增长
    - 你想了解 Anthropic 提示缓存优化
summary: 修剪旧工具结果以保持上下文精简并提高缓存效率
title: 会话修剪
x-i18n:
    generated_at: "2026-04-23T22:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

会话修剪会在每次 LLM 调用前，从上下文中修剪**旧的工具结果**。它可以减少累积工具输出（exec 结果、文件读取结果、搜索结果）带来的上下文膨胀，同时不会改写普通对话文本。

<Info>
修剪仅发生在内存中——不会修改磁盘上的会话转录。你的完整历史始终会被保留。
</Info>

## 为什么这很重要

长会话会不断累积工具输出，从而膨胀上下文窗口。这会增加成本，并可能迫使系统比预期更早进行 [压缩](/zh-CN/concepts/compaction)。

修剪对于 **Anthropic 提示缓存** 尤其有价值。在缓存 TTL 到期后，下一次请求会重新缓存整个提示。修剪可以减少缓存写入大小，从而直接降低成本。

## 工作原理

1. 等待缓存 TTL 到期（默认 5 分钟）。
2. 找出可用于常规修剪的旧工具结果（对话文本保持不变）。
3. 对过大的结果执行 **软修剪** —— 保留开头和结尾，中间插入 `...`。
4. 对其余部分执行 **硬清除** —— 替换为占位符。
5. 重置 TTL，使后续请求可复用新的缓存。

## 旧版图像清理

OpenClaw 还会针对较旧的旧版会话执行单独的幂等清理，这些会话会在历史中持久化原始图像块。

- 它会逐字节保留**最近 3 个已完成轮次**，以保持最近后续请求的提示缓存前缀稳定。
- 历史中 `user` 或 `toolResult` 的较早、已处理图像块可被替换为 `[image data removed - already processed by model]`。
- 这与常规的缓存 TTL 修剪是分开的。它的存在是为了防止重复的图像负载在后续轮次中破坏提示缓存。

## 智能默认值

OpenClaw 会为 Anthropic 配置文件自动启用修剪：

| 配置文件类型 | 已启用修剪 | 心跳 |
| ------------------------------------------------------- | --------------- | --------- |
| Anthropic OAuth/token 凭证（包括 Claude CLI 复用） | 是 | 1 小时 |
| API key | 是 | 30 分钟 |

如果你设置了显式值，OpenClaw 不会覆盖它们。

## 启用或禁用

对于非 Anthropic 提供商，修剪默认关闭。启用方式如下：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

如需禁用：设置 `mode: "off"`。

## 修剪与压缩

|            | 修剪 | 压缩 |
| ---------- | ------------------ | ----------------------- |
| **作用内容**   | 修剪工具结果 | 对对话进行摘要 |
| **会保存吗？** | 否（按请求） | 是（写入转录） |
| **范围**  | 仅工具结果 | 整个对话 |

两者相辅相成——修剪可在压缩周期之间保持工具输出精简。

## 延伸阅读

- [压缩](/zh-CN/concepts/compaction) —— 基于摘要的上下文缩减
- [Gateway 网关配置](/zh-CN/gateway/configuration) —— 所有修剪配置项
  （`contextPruning.*`）

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话工具](/zh-CN/concepts/session-tool)
- [上下文引擎](/zh-CN/concepts/context-engine)
