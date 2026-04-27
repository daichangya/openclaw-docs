---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或吊销设备 token
summary: '`openclaw devices` 的 CLI 参考（设备配对 + token 轮换/吊销）'
title: 设备
x-i18n:
    generated_at: "2026-04-27T06:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4240f8f9f4dc873c954e4bdb9697c13c1f7045951b13ad749ad3e82599f247
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

管理设备配对请求和设备范围的 token。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对的设备。

```
openclaw devices list
openclaw devices list --json
```

当设备已经配对时，待处理请求的输出会在该设备当前已批准的访问权限旁边显示其请求的访问权限。这样可以明确显示 scope/role 升级，而不会看起来像是配对已丢失。

### `openclaw devices remove <deviceId>`

移除一个已配对的设备条目。

当你使用已配对设备 token 完成认证时，非管理员调用方只能移除**自己的**设备条目。移除其他设备需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

批量清除已配对设备。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传入 `--latest`，OpenClaw 只会打印所选的待处理请求并退出；在核实详细信息后，请使用精确的请求 ID 重新运行批准命令。

<Note>
如果设备在认证详情发生变化后重试配对（role、scopes 或 public key），OpenClaw 会替换之前的待处理条目并发出新的 `requestId`。请在批准前立即运行 `openclaw devices list`，以使用当前 ID。
</Note>

如果设备已经配对，并请求更宽的 scopes 或更高的 role，OpenClaw 会保留现有批准，并创建一个新的待处理升级请求。请查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，或使用 `openclaw devices approve --latest` 预览确切的升级内容，然后再批准。

如果 Gateway 网关 显式配置了 `gateway.nodes.pairing.autoApproveCidrs`，则来自匹配客户端 IP 的首次 `role: node` 请求，可能会在出现在此列表之前就被批准。该策略默认禁用，且绝不会应用于 operator/browser 客户端或升级请求。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒绝待处理的设备配对请求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

为特定 role 轮换设备 token（可选地更新 scopes）。
目标 role 必须已存在于该设备已批准的配对契约中；轮换不能铸造新的未批准 role。
如果你省略 `--scope`，后续使用存储的已轮换 token 重新连接时，会复用该 token 缓存的已批准 scopes。如果你显式传入 `--scope` 值，这些值将成为未来基于缓存 token 重连时存储的 scope 集合。
非管理员的已配对设备调用方只能轮换**自己的**设备 token。
目标 token 的 scope 集合还必须保持在调用方当前会话自身的 operator scopes 范围内；轮换不能铸造或保留比调用方当前拥有的权限更高的 operator token。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 返回新的 token 负载。

### `openclaw devices revoke --device <id> --role <role>`

吊销特定 role 的设备 token。

非管理员的已配对设备调用方只能吊销**自己的**设备 token。
吊销其他设备的 token 需要 `operator.admin`。
目标 token 的 scope 集合也必须适配调用方当前会话自身的 operator scopes；仅具备配对权限的调用方不能吊销 admin/write operator token。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 返回吊销结果。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关 token（如需要）。
- `--password <password>`：Gateway 网关 密码（密码认证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

<Warning>
当你设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。
</Warning>

## 说明

- token 轮换会返回一个新的 token（敏感信息）。请像对待密钥一样对待它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）scope。
- `gateway.nodes.pairing.autoApproveCidrs` 是一个仅适用于新节点设备配对的可选启用 Gateway 网关 策略；它不会改变 CLI 的批准权限。
- token 轮换和吊销始终受限于该设备已批准的配对 role 集合和已批准的基础 scope。意外残留的缓存 token 条目不会授予 token 管理目标。
- 对于已配对设备 token 会话，跨设备管理仅限管理员：`remove`、`rotate` 和 `revoke` 都只能操作自己，除非调用方拥有 `operator.admin`。
- token 变更也受调用方 scope 限制：仅具备配对权限的会话不能轮换或吊销当前携带 `operator.admin` 或 `operator.write` 的 token。
- `devices clear` 刻意要求 `--yes` 作为保护门槛。
- 如果 local loopback 上不可用配对 scope（且未显式传入 `--url`），`list/approve` 可以使用本地配对回退机制。
- `devices approve` 在铸造 token 之前需要显式请求 ID；省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求。

## token 漂移恢复检查清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时，请使用此清单。

1. 确认当前 Gateway 网关 token 来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 ID：

```bash
openclaw devices list
```

3. 为受影响的设备轮换 operator token：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换仍不足以解决问题，请移除过期配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享 token/password 重试客户端连接。

说明：

- 正常重连认证优先级依次为：显式共享 token/password、显式 `deviceToken`、存储的设备 token、bootstrap token。
- 对于可信的 `AUTH_TOKEN_MISMATCH` 恢复，可以在一次受限重试中临时同时发送共享 token 和存储的设备 token。

相关内容：

- [Dashboard auth troubleshooting](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关

- [CLI reference](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
