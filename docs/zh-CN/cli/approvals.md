---
read_when:
    - 你想通过 CLI 编辑执行审批设置
    - 你需要在 Gateway 网关或节点主机上管理允许列表
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的 CLI 参考'
title: 审批
x-i18n:
    generated_at: "2026-04-23T20:43:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23465c7fdf17ec5fe6c6c561ec19b0c72a94af02e3982a85c52eef99eac2e76c
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

管理**本地主机**、**Gateway 网关主机**或**节点主机**的执行审批。
默认情况下，命令会作用于磁盘上的本地审批文件。使用 `--gateway` 可作用于 Gateway 网关，或使用 `--node` 作用于特定节点。

别名：`openclaw exec-approvals`

相关内容：

- 执行审批：[Exec approvals](/zh-CN/tools/exec-approvals)
- 节点：[Nodes](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个本地方便命令，用于一步保持请求的
`tools.exec.*` 配置与本地主机审批文件同步。

在以下情况下使用它：

- 检查本地请求策略、主机审批文件和生效后的合并结果
- 应用本地预设，例如 YOLO 或 deny-all
- 同步本地 `tools.exec.*` 与本地 `~/.openclaw/exec-approvals.json`

示例：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

输出模式：

- 不带 `--json`：打印人类可读的表格视图
- 带 `--json`：打印机器可读的结构化输出

当前范围：

- `exec-policy` **仅限本地**
- 它会同时更新本地配置文件和本地审批文件
- 它**不会**将策略推送到 Gateway 网关主机或节点主机
- 在此命令中，`--host node` 会被拒绝，因为节点执行审批会在运行时从节点获取，必须通过面向节点的 approvals 命令来管理
- `openclaw exec-policy show` 会将 `host=node` 范围标记为运行时由节点管理，而不是从本地审批文件推导生效策略

如果你需要直接编辑远程主机审批，请继续使用 `openclaw approvals set --gateway`
或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在会显示本地、Gateway 网关和节点目标的生效执行策略：

- 请求的 `tools.exec` 策略
- 主机审批文件策略
- 应用优先级规则后的生效结果

优先级设计如下：

- 主机审批文件是可强制执行的事实来源
- 请求的 `tools.exec` 策略可以收紧或放宽意图，但生效结果仍由主机规则推导
- `--node` 会将节点主机审批文件与 Gateway 网关的 `tools.exec` 策略合并，因为两者在运行时仍然生效
- 如果 Gateway 网关配置不可用，CLI 会回退为使用节点审批快照，并注明无法计算最终运行时策略

## 从文件替换审批

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不仅仅是严格 JSON。使用 `--file` 或 `--stdin` 之一，不要同时使用两者。

## “从不提示” / YOLO 示例

对于一个不应因执行审批而中断的主机，将主机审批默认值设置为 `full` + `off`：

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

节点版本：

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

这只会修改**主机审批文件**。如需让请求的 OpenClaw 策略也保持一致，还要设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

为什么此示例中使用 `tools.exec.host=gateway`：

- `host=auto` 仍表示“有沙箱时使用沙箱，否则使用 Gateway 网关”。
- YOLO 关乎审批，而不是路由。
- 如果你想在已配置沙箱时仍使用主机执行，请通过 `gateway` 或 `/exec host=gateway` 显式指定主机选择。

这与当前基于主机默认值的 YOLO 行为一致。如果你想启用审批，请收紧它。

本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新请求的本地 `tools.exec.*` 配置和
本地审批默认值。就意图而言，它等价于上面的手动两步设置，
但仅适用于本地机器。

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
- 共享节点 RPC 选项：`--url`、`--token`、`--timeout`、`--json`

目标说明：

- 不带目标标志表示磁盘上的本地审批文件
- `--gateway` 作用于 Gateway 网关主机审批文件
- `--node` 会在解析 id、name、IP 或 id 前缀后作用于某个节点主机

`allowlist add|remove` 还支持：

- `--agent <id>`（默认为 `*`）

## 说明

- `--node` 使用与 `openclaw nodes` 相同的解析器（id、name、ip 或 id 前缀）。
- `--agent` 默认为 `"*"`，适用于所有智能体。
- 节点主机必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- 审批文件按主机存储于 `~/.openclaw/exec-approvals.json`。
