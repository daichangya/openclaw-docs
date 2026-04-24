---
read_when:
    - 你想快速诊断渠道健康状态 + 最近会话接收方
    - 你想要一个可直接粘贴的 “all” 状态输出用于调试
summary: '`openclaw status` 的 CLI 参考（diagnostics、probes、usage snapshots）'
title: 状态
x-i18n:
    generated_at: "2026-04-24T03:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
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
- `--usage` 会将标准化后的提供商用量窗口打印为 `X% left`。
- 会话状态输出现在会将 `Runtime:` 与 `Runner:` 分开显示。`Runtime` 是执行路径和沙箱状态（`direct`、`docker/*`），而 `Runner` 会告诉你该会话使用的是内置 Pi、基于 CLI 的提供商，还是 ACP harness 后端，例如 `codex (acp/acpx)`。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则以它们为准。`model_remains` 响应会优先使用聊天模型条目，在需要时根据时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 当当前会话快照信息较少时，`/status` 可以从最近的 transcript 用量日志中回填 token 和缓存计数器。已有的非零实时值仍然优先于 transcript 回填值。
- 当实时会话条目缺少活动运行时模型标签时，transcript 回填也可以恢复它。如果该 transcript 模型与所选模型不同，status 会根据恢复出的运行时模型而不是所选模型来解析上下文窗口。
- 对于 prompt 大小统计，当会话元数据缺失或更小时，transcript 回填会优先采用更大的、面向 prompt 的总量，因此自定义提供商会话不会显示为 `0` token。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 概览会在可用时包含 Gateway 网关 + 节点主机服务的安装/运行状态。
- 概览会包含更新通道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印运行 `openclaw update` 的提示（参见 [Updating](/zh-CN/install/updating)）。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能时为其目标配置路径解析受支持的 SecretRef。
- 如果配置了受支持的渠道 SecretRef，但在当前命令路径中不可用，status 会保持只读，并报告降级输出，而不是崩溃。人工可读输出会显示类似“configured token unavailable in this command path”的警告，JSON 输出则会包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用解析后的快照，并从最终输出中清除临时的“secret unavailable”渠道标记。
- `status --all` 包含一行 Secrets 概览，以及一个诊断部分，用于汇总 secret 诊断信息（为便于阅读会截断），同时不会停止报告生成。

## 相关内容

- [CLI reference](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
