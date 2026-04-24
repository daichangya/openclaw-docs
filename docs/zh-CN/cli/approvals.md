---
read_when:
    - 你想通过 CLI 编辑执行批准设置
    - 你需要在 Gateway 网关或节点主机上管理允许列表
summary: CLI 参考：`openclaw approvals` 和 `openclaw exec-policy`
title: 批准
x-i18n:
    generated_at: "2026-04-24T03:14:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

管理**本地主机**、**Gateway 网关主机**或**节点主机**的执行批准设置。
默认情况下，命令会针对磁盘上的本地 approvals 文件。使用 `--gateway` 可将目标设为 Gateway 网关，或使用 `--node` 将目标设为特定节点。

别名：`openclaw exec-approvals`

相关内容：

- 执行批准： [Exec approvals](/zh-CN/tools/exec-approvals)
- 节点： [Nodes](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个本地方便命令，用于一步保持请求的
`tools.exec.*` 配置与本地主机 approvals 文件对齐。

在以下情况下使用它：

- 检查本地请求策略、主机 approvals 文件和生效后的合并结果
- 应用本地预设，例如 YOLO 或全部拒绝
- 同步本地 `tools.exec.*` 和本地 `~/.openclaw/exec-approvals.json`

示例：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

输出模式：

- 不使用 `--json`：打印便于阅读的表格视图
- `--json`：打印适合机器读取的结构化输出

当前范围：

- `exec-policy` **仅限本地**
- 它会同时更新本地配置文件和本地 approvals 文件
- 它**不会**将策略推送到 Gateway 网关主机或节点主机
- 在此命令中，`--host node` 会被拒绝，因为节点执行批准是在运行时从节点获取的，必须改用面向节点的 approvals 命令来管理
- `openclaw exec-policy show` 会将 `host=node` 范围标记为运行时由节点管理，而不是根据本地 approvals 文件推导生效策略

如果你需要直接编辑远程主机 approvals，请继续使用 `openclaw approvals set --gateway`
或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在会显示本地、Gateway 网关和节点目标的生效执行策略：

- 请求的 `tools.exec` 策略
- 主机 approvals 文件策略
- 应用优先级规则后的生效结果

这种优先级设计是有意为之：

- 主机 approvals 文件是可执行的事实来源
- 请求的 `tools.exec` 策略可以收紧或放宽意图，但生效结果仍然由主机规则推导得出
- `--node` 会将节点主机 approvals 文件与 Gateway 网关 `tools.exec` 策略组合，因为两者在运行时仍然会同时生效
- 如果 Gateway 网关配置不可用，CLI 会回退到节点 approvals 快照，并注明无法计算最终运行时策略

## 从文件替换 approvals

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不只是严格 JSON。使用 `--file` 或 `--stdin` 其中之一，不要同时使用两者。

## “永不提示” / YOLO 示例

对于一个不应因执行批准而中断的主机，将主机 approvals 默认值设置为 `full` + `off`：

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

节点变体：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

这只会更改**主机 approvals 文件**。要让请求的 OpenClaw 策略也保持一致，还需要设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

为什么这个示例里使用 `tools.exec.host=gateway`：

- `host=auto` 仍然表示“如果可用则使用沙箱，否则使用 Gateway 网关”。
- YOLO 关乎批准，而不是路由。
- 如果你希望即使已配置沙箱也使用主机执行，请使用 `gateway` 或 `/exec host=gateway` 明确指定主机选择。

这与当前主机默认的 YOLO 行为一致。如果你希望启用批准，请收紧它。

本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新请求的本地 `tools.exec.*` 配置和本地 approvals 默认值。
其意图等同于上面的手动两步设置，但仅适用于本机。

## 允许列表辅助命令

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用选项

`get`、`set` 和 `allowlist add|remove` 都支持：

- `--node <id|name|ip>`
- `--gateway`
- 共享的节点 RPC 选项：`--url`、`--token`、`--timeout`、`--json`

目标说明：

- 不带目标标志表示磁盘上的本地 approvals 文件
- `--gateway` 以 Gateway 网关主机 approvals 文件为目标
- `--node` 会在解析 id、名称、IP 或 id 前缀后，以某个节点主机为目标

`allowlist add|remove` 还支持：

- `--agent <id>`（默认为 `*`）

## 注意事项

- `--node` 使用与 `openclaw nodes` 相同的解析器（id、名称、ip 或 id 前缀）。
- `--agent` 默认为 `"*"`，适用于所有智能体。
- 节点主机必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- Approvals 文件按主机存储在 `~/.openclaw/exec-approvals.json`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Exec approvals](/zh-CN/tools/exec-approvals)
