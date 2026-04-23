---
read_when:
    - 运行无头节点主机
    - 为非 macOS 节点配对以使用 `system.run`
summary: '`openclaw node` 的 CLI 参考（无头节点主机）'
title: 节点
x-i18n:
    generated_at: "2026-04-23T20:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb56d24d960eabc085b31fc18429a4d3103b7dbc62f774efbde51749d5f25436
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

运行一个**无头节点主机**，它连接到 Gateway WebSocket，并在此机器上公开
`system.run` / `system.which`。

## 为什么使用节点主机？

当你希望智能体能在网络中的**其他机器上运行命令**，而不需要在那些机器上安装完整的 macOS 配套应用时，请使用节点主机。

常见用例：

- 在远程 Linux/Windows 主机上运行命令（构建服务器、实验室机器、NAS）。
- 在 Gateway 网关上保持 exec **沙箱隔离**，但将已批准的运行委派给其他主机。
- 为自动化或 CI 节点提供轻量级、无头的执行目标。

执行仍然受**exec 审批**和节点主机上每个智能体 allowlist 的保护，因此你可以将命令访问范围保持为明确且受限。

## 浏览器代理（零配置）

如果节点上的 `browser.enabled` 未被禁用，节点主机会自动通告一个浏览器代理。这样智能体就可以在该节点上使用浏览器自动化，而无需额外配置。

默认情况下，该代理会暴露节点的常规浏览器配置文件表面。如果你设置了
`nodeHost.browserProxy.allowProfiles`，代理就会变为受限模式：
未加入 allowlist 的配置文件目标会被拒绝，并且通过代理访问持久化配置文件的
创建/删除路由也会被阻止。

如果需要，可在节点上禁用它：

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 运行（前台）

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 端口（默认：`18789`）
- `--tls`：为 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 id（会清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称

## 节点主机的 Gateway 网关身份验证

`openclaw node run` 和 `openclaw node install` 会从配置/环境变量中解析 Gateway 网关身份验证（节点命令不支持 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后回退到本地配置：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机不会继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 明确通过 SecretRef 配置但无法解析，则节点身份验证解析会以失败关闭方式处理（不会使用远程回退来掩盖问题）。
- 在 `gateway.mode=remote` 时，根据远程优先级规则，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也可参与解析。
- 节点主机身份验证解析仅识别 `OPENCLAW_GATEWAY_*` 环境变量。

## 服务（后台）

将无头节点主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 端口（默认：`18789`）
- `--tls`：为 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 id（会清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称
- `--runtime <runtime>`：服务运行时（`node` 或 `bun`）
- `--force`：如果已安装则重新安装/覆盖

管理服务：

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

对于前台节点主机（非服务），请使用 `openclaw node run`。

服务命令支持 `--json`，以输出机器可读格式。

## 配对

首次连接会在 Gateway 网关上创建一个待处理设备配对请求（`role: node`）。
通过以下命令批准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果节点使用已更改的身份验证详细信息（角色/作用域/公钥）重试配对，
之前的待处理请求会被替换，并创建一个新的 `requestId`。
请在批准前再次运行 `openclaw devices list`。

节点主机会将其节点 id、令牌、显示名称以及 Gateway 网关连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 审批

`system.run` 受本地 exec 审批控制：

- `~/.openclaw/exec-approvals.json`
- [Exec 审批](/zh-CN/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 网关编辑）

对于已批准的异步节点 exec，OpenClaw 会在提示前准备一个规范化的 `systemRunPlan`。
之后转发的已批准 `system.run` 会复用该已存储的
计划，因此在创建审批请求之后，如果再编辑 command/cwd/session 字段，
这些更改会被拒绝，而不是改变节点实际执行的内容。
