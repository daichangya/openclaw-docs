---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用节点命令
summary: '`openclaw nodes` 的 CLI 参考（status、pairing、invoke、camera/canvas/screen）'
title: 节点
x-i18n:
    generated_at: "2026-04-24T03:15:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关内容：

- 节点概览：[Nodes](/zh-CN/nodes)
- 摄像头：[Camera nodes](/zh-CN/nodes/camera)
- 图像：[Image nodes](/zh-CN/nodes/images)

通用选项：

- `--url`、`--token`、`--timeout`、`--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 会打印待处理/已配对表格。已配对行会包含最近一次连接的时间间隔（Last Connect）。
使用 `--connected` 只显示当前已连接的节点。使用 `--last-connected <duration>` 可筛选出在指定时长内连接过的节点（例如 `24h`、`7d`）。

批准说明：

- `openclaw nodes pending` 仅需要 pairing 作用域。
- `openclaw nodes approve <requestId>` 会继承待处理请求的额外作用域要求：
  - 无命令请求：仅 pairing
  - 非 exec 的节点命令：pairing + write
  - `system.run` / `system.run.prepare` / `system.which`：pairing + admin

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认为 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认为 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。
- 这里会阻止 `system.run` 和 `system.run.prepare`；如需执行 shell，请使用 `host=node` 的 `exec` 工具。

如需在节点上执行 shell，请使用 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 现在聚焦于能力：通过 `nodes invoke` 进行直接 RPC，以及 pairing、摄像头、屏幕、位置、画布和通知。

## 相关内容

- [CLI reference](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
