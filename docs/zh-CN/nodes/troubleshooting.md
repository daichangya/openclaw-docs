---
read_when:
    - 节点已连接，但摄像头/画布/屏幕/exec 工具失败
    - 你需要理解节点配对与 approvals 之间的心智模型
summary: 排查节点配对、前台要求、权限和工具失败问题
title: 节点故障排除
x-i18n:
    generated_at: "2026-04-23T20:54:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e93ca2a1f87e6c997b91d2a9d9a97b9b58828ef1842fe3c5d439325dbc47c990
    source_path: nodes/troubleshooting.md
    workflow: 15
---

当节点在状态中可见，但节点工具失败时，请使用本页。

## 命令排查阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行节点专用检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康信号：

- 节点已连接，并且已以 `node` 角色完成配对。
- `nodes describe` 包含你正在调用的能力。
- Exec approvals 显示了预期的模式/allowlist。

## 前台要求

在 iOS/Android 节点上，`canvas.*`、`camera.*` 和 `screen.*` 只能在前台使用。

快速检查与修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切换到前台后重试。

## 权限矩阵

| 能力 | iOS | Android | macOS 节点应用 | 典型失败代码 |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 摄像头（clip 音频还需麦克风） | 摄像头（clip 音频还需麦克风） | 摄像头（clip 音频还需麦克风） | `*_PERMISSION_REQUIRED` |
| `screen.record` | 屏幕录制（麦克风可选） | 屏幕捕获提示（麦克风可选） | 屏幕录制 | `*_PERMISSION_REQUIRED` |
| `location.get` | 使用期间或始终允许（取决于模式） | 基于模式的前台/后台定位 | 位置权限 | `LOCATION_PERMISSION_REQUIRED` |
| `system.run` | 不适用（node 主机路径） | 不适用（node 主机路径） | 需要 Exec approvals | `SYSTEM_RUN_DENIED` |

## 配对与 approvals 的区别

它们是不同的门：

1. **设备配对**：这个节点能否连接到 gateway？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 以及平台默认值所允许？
3. **Exec approvals**：这个节点能否在本地运行某条特定 shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配对，请先批准该节点设备。
如果 `nodes describe` 中缺少某个命令，请检查 gateway 节点命令策略，以及该节点在连接时是否真的声明了该命令。
如果配对没问题但 `system.run` 失败，请修复该节点上的 exec approvals/allowlist。

节点配对是身份/信任门，而不是按命令逐项批准的界面。对于 `system.run`，按节点的策略位于该节点的 exec approvals 文件中（`openclaw approvals get --node ...`），而不在 gateway 配对记录中。

对于基于 approval 的 `host=node` 运行，gateway 还会将执行绑定到已准备好的规范化 `systemRunPlan`。如果后续调用方在已批准的运行被转发前修改了命令/cwd 或会话元数据，gateway 会以 approval mismatch 拒绝该运行，而不是信任被编辑过的载荷。

## 常见节点错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用在后台；请切到前台。
- `CAMERA_DISABLED` → 节点设置中禁用了摄像头开关。
- `*_PERMISSION_REQUIRED` → 缺少/拒绝了操作系统权限。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 请求的位置模式未获授权。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用在后台，但仅具有使用期间位置权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 请求需要显式批准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 模式拦截。
  在 Windows node 主机上，像 `cmd.exe /c ...` 这样的 shell 包装形式会在 allowlist 模式下被视为 allowlist miss，除非通过 ask 流程获得批准。

## 快速恢复循环

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新批准设备配对。
- 重新打开节点应用（切到前台）。
- 重新授予操作系统权限。
- 重新创建/调整 exec approval 策略。

相关内容：

- [/nodes/index](/zh-CN/nodes/index)
- [/nodes/camera](/zh-CN/nodes/camera)
- [/nodes/location-command](/zh-CN/nodes/location-command)
- [/tools/exec-approvals](/zh-CN/tools/exec-approvals)
- [/gateway/pairing](/zh-CN/gateway/pairing)
