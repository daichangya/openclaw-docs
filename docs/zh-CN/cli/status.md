---
read_when:
    - 你想快速诊断渠道健康状态 + 最近会话接收者信息
    - 你想要一个可直接粘贴的 “all” 状态输出用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、使用情况快照）'
title: 状态
x-i18n:
    generated_at: "2026-04-23T20:45:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c33f238747432c9e7f69501d764375437dc76c558bacce3d019ddcb3d5d4a27e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

用于渠道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

说明：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- `--usage` 会以 `X% left` 的形式打印标准化后的提供商使用窗口。
- 会话状态输出现在将 `Runtime:` 与 `Runner:` 分开显示。`Runtime` 是执行路径和沙箱状态（`direct`、`docker/*`），而 `Runner` 会告诉你该会话使用的是内嵌 Pi、CLI 支持的提供商，还是诸如 `codex (acp/acpx)` 之类的 ACP harness 后端。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前将其取反；如果存在计数字段，则计数字段优先。`model_remains` 响应会优先选择 chat-model 条目，在需要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 当当前会话快照信息稀疏时，`/status` 可以从最近的 transcript 使用日志中回填 token 和缓存计数器。现有的非零实时值仍然优先于 transcript 回退值。
- 当实时会话条目缺少活动运行时模型标签时，transcript 回退也可以恢复它。如果该 transcript 模型与所选模型不同，状态会根据恢复出的运行时模型而不是所选模型来解析上下文窗口。
- 对于提示大小统计，当会话元数据缺失或更小时，transcript 回退会优先使用较大的、面向提示的总数，这样自定义提供商会话就不会显示为 `0` token。
- 当配置了多个智能体时，输出会包含按智能体划分的会话存储。
- 如果可用，概览会包含 Gateway 网关 + 节点主机服务的安装/运行状态。
- 概览会包含更新渠道 + git SHA（针对源码 checkout）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印运行 `openclaw update` 的提示（参见 [Updating](/zh-CN/install/updating)）。
- 只读状态表面（`status`、`status --json`、`status --all`）会在可能的情况下，为其目标配置路径解析受支持的 SecretRefs。
- 如果配置了某个受支持渠道的 SecretRef，但在当前命令路径中无法获取，status 会保持只读，并报告降级输出，而不会崩溃。人类可读输出会显示诸如 “configured token unavailable in this command path” 之类的警告，JSON 输出则会包含 `secretDiagnostics`。
- 当命令本地的 SecretRef 解析成功时，status 会优先使用已解析的快照，并从最终输出中清除瞬态的 “secret unavailable” 渠道标记。
- `status --all` 包含一行 Secrets 概览，以及一个诊断部分，用于汇总 secret 诊断信息（为便于阅读会截断），同时不会中断报告生成。
