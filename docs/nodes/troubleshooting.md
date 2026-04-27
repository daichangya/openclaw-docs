---
read_when:
    - 节点已连接，但 camera/canvas/screen/exec 工具失败
    - 你需要理解节点中“配对”和“审批”的心智模型
summary: 排查节点配对、前台要求、权限和工具失败问题
title: 节点故障排除
x-i18n:
    generated_at: "2026-04-23T22:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

当节点在状态中可见，但节点工具失败时，请使用本页面。

## 命令排查梯度

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

- 节点已连接，并且已为 `node` 角色完成配对。
- `nodes describe` 包含你正在调用的能力。
- exec 审批显示预期的 mode/allowlist。

## 前台要求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 节点上仅支持前台运行。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切回前台后重试。

## 权限矩阵

| 能力 | iOS | Android | macOS 节点应用 | 典型失败代码 |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`、`camera.clip` | 相机（`clip` 音频还需麦克风） | 相机（`clip` 音频还需麦克风） | 相机（`clip` 音频还需麦克风） | `*_PERMISSION_REQUIRED` |
| `screen.record` | 屏幕录制（麦克风可选） | 屏幕捕获提示（麦克风可选） | 屏幕录制 | `*_PERMISSION_REQUIRED` |
| `location.get` | 使用期间或始终允许（取决于模式） | 取决于模式的前台/后台位置权限 | 位置权限 | `LOCATION_PERMISSION_REQUIRED` |
| `system.run` | 不适用（节点主机路径） | 不适用（节点主机路径） | 需要 exec 审批 | `SYSTEM_RUN_DENIED` |

## 配对与审批

它们是不同的门控：

1. **设备配对**：该节点是否可以连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：该 RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 及平台默认值允许？
3. **Exec 审批**：该节点是否可以在本地运行特定 shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配对，请先批准该节点设备。
如果 `nodes describe` 缺少某个命令，请检查 Gateway 网关节点命令策略，以及节点在连接时是否实际声明了该命令。
如果配对没问题，但 `system.run` 失败，请修复该节点上的 exec 审批/allowlist。

节点配对是身份/信任门控，而不是逐命令审批界面。对于 `system.run`，按节点的策略位于该节点的 exec 审批文件中（`openclaw approvals get --node ...`），而不在 Gateway 网关配对记录里。

对于基于审批的 `host=node` 运行，Gateway 网关还会将执行绑定到已准备好的规范 `systemRunPlan`。如果后续调用者在批准的运行被转发前修改了命令/cwd 或会话元数据，Gateway 网关会将该运行拒绝为审批不匹配，而不是信任被编辑后的负载。

## 常见节点错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用在后台；请切回前台。
- `CAMERA_DISABLED` → 节点设置中已禁用相机开关。
- `*_PERMISSION_REQUIRED` → 缺少/拒绝了操作系统权限。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 请求的位置模式未获授权。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用在后台，但仅授予了“使用期间”权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 请求需要显式审批。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 模式阻止。
  在 Windows 节点主机上，像 `cmd.exe /c ...` 这样的 shell 包装形式在
  allowlist 模式下会被视为 allowlist miss，除非通过 ask 流程批准。

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
- 重新创建/调整 exec 审批策略。

相关内容：

- [/nodes/index](/zh-CN/nodes/index)
- [/nodes/camera](/zh-CN/nodes/camera)
- [/nodes/location-command](/zh-CN/nodes/location-command)
- [/tools/exec-approvals](/zh-CN/tools/exec-approvals)
- [/gateway/pairing](/zh-CN/gateway/pairing)

## 相关内容

- [节点概览](/zh-CN/nodes)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
