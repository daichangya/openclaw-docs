---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备 token
summary: '`openclaw devices` 的 CLI 参考（设备配对 + token 轮换/撤销）'
title: 设备
x-i18n:
    generated_at: "2026-04-23T20:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: efa76e7aa0d44115f8220eb50fe66812164da02482b9321c90f35a4534a42f12
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

管理设备配对请求和设备范围 token。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对设备。

```
openclaw devices list
openclaw devices list --json
```

当设备已经配对时，待处理请求输出会在该设备当前已批准访问权限旁边显示请求的访问权限。这样可以明确显示 scope/role 升级，而不会看起来像是配对已丢失。

### `openclaw devices remove <deviceId>`

删除一条已配对设备记录。

当你使用已配对设备 token 完成认证时，非管理员调用方只能删除**自己的**设备记录。删除其他设备需要 `operator.admin`。

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

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId`
或传入 `--latest`，OpenClaw 只会打印所选的待处理请求并退出；请在核对详情后，使用精确的请求 ID 重新执行批准操作。

注意：如果设备以更改后的认证详情（role/scopes/public
key）重试配对，OpenClaw 会替换之前的待处理记录并签发新的
`requestId`。请在批准前立即运行 `openclaw devices list`，以使用当前 ID。

如果设备已经配对，但请求更宽的 scope 或更高的 role，
OpenClaw 会保留现有批准不变，并创建一个新的待处理升级请求。
请查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，
或使用 `openclaw devices approve --latest` 在批准前预览确切的升级内容。

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

为特定 role 轮换设备 token（可选更新 scopes）。
目标 role 必须已经存在于该设备已批准的配对契约中；
轮换不能铸造一个新的未获批准 role。
如果你省略 `--scope`，后续使用已存储的轮换后 token 重新连接时，会复用该
token 缓存的已批准 scopes。如果你显式传入 `--scope` 值，这些值将成为未来基于缓存 token 重连时所使用的已存储 scope 集合。
非管理员的已配对设备调用方只能轮换**自己的**设备 token。
此外，任何显式的 `--scope` 值都必须保持在调用方当前会话自己的
operator scopes 范围内；轮换不能铸造出比调用方当前已有权限更宽的 operator token。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 形式返回新的 token 负载。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定 role 的设备 token。

非管理员的已配对设备调用方只能撤销**自己的**设备 token。
撤销其他设备的 token 需要 `operator.admin`。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 形式返回撤销结果。

## 通用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置时默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关 token（如需要）。
- `--password <password>`：Gateway 网关密码（密码认证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境中的凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

## 说明

- Token 轮换会返回一个新的 token（敏感信息）。请像对待密钥一样处理它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）scope。
- Token 轮换会限制在该设备已批准的配对 role 集合和已批准的
  scope 基线之内。一个无意留下的缓存 token 条目不会授予新的轮换目标。
- 对于已配对设备 token 会话，跨设备管理仅限管理员：
  `remove`、`rotate` 和 `revoke` 都仅限自身设备，除非调用方拥有
  `operator.admin`。
- `devices clear` 有意通过 `--yes` 进行门控。
- 如果 local loopback 上没有配对 scope（且未显式传入 `--url`），list/approve 可以使用本地配对回退机制。
- `devices approve` 在签发 token 前需要显式的请求 ID；省略 `requestId` 或传入 `--latest` 仅会预览最新的待处理请求。

## token 漂移恢复检查清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时，请使用此清单。

1. 确认当前 gateway token 来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 ID：

```bash
openclaw devices list
```

3. 为受影响设备轮换 operator token：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换仍不够，请移除陈旧配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享 token/密码重试客户端连接。

说明：

- 正常的重连认证优先级依次为：显式共享 token/密码优先，然后是显式 `deviceToken`，接着是已存储设备 token，最后是 bootstrap token。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以在一次有界重试中临时同时发送共享 token 和已存储设备 token。

相关内容：

- [Dashboard auth troubleshooting](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)
