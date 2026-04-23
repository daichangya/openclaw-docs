---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用节点命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、摄像头/画布/屏幕）'
title: 节点
x-i18n:
    generated_at: "2026-04-23T20:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6965add1f4ee553307ae038b015bdb432425e8368487eef870b91650bbfd94ea
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

管理已配对节点（设备）并调用节点能力。

相关内容：

- 节点概览：[节点](/zh-CN/nodes)
- 摄像头：[摄像头节点](/zh-CN/nodes/camera)
- 图像：[图像节点](/zh-CN/nodes/images)

常用选项：

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

`nodes list` 会打印待处理/已配对表格。已配对行包含最近一次连接时间跨度（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>` 可筛选在指定时长内连接过的节点（例如 `24h`、`7d`）。

批准说明：

- `openclaw nodes pending` 仅需要配对作用域。
- `openclaw nodes approve <requestId>` 会继承待处理请求的额外作用域要求：
  - 无命令请求：仅需配对
  - 非 exec 节点命令：需要配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`：需要配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选幂等键。
- 这里会阻止 `system.run` 和 `system.run.prepare`；如需执行 shell，请使用 `host=node` 的 `exec` 工具。

如需在节点上执行 shell，请使用 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 现在聚焦于能力：通过 `nodes invoke` 进行直接 RPC，以及配对、摄像头、屏幕、位置、画布和通知。
