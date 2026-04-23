---
read_when:
    - 在不运行完整智能体轮次的情况下调用工具
    - 构建需要强制执行工具策略的自动化
summary: 通过 Gateway HTTP 端点直接调用单个工具
title: 工具调用 API
x-i18n:
    generated_at: "2026-04-23T20:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: bcb05dc1726079dd76ba48c661150935a4aa5ac9e1eb4b29188bb8183b57a657
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# 工具调用（HTTP）

OpenClaw 的 Gateway 网关暴露了一个简单的 HTTP 端点，用于直接调用单个工具。它始终启用，并使用 Gateway 网关认证加工具策略。与兼容 OpenAI 的 `/v1/*` 界面一样，共享密钥 bearer 认证会被视为整个 gateway 的受信任操作员访问权限。

- `POST /tools/invoke`
- 与 Gateway 网关相同端口（WS + HTTP 复用）：`http://<gateway-host>:<port>/tools/invoke`

默认最大 payload 大小为 2 MB。

## 认证

使用 Gateway 网关认证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 受信任的携带身份的 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理进行路由，并让它注入所需的身份请求头
- 私有入口开放认证（`gateway.auth.mode="none"`）：
  无需认证请求头

说明：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自
  已配置的非 loopback 受信任代理来源；同主机 loopback 代理
  不满足该模式。
- 如果配置了 `gateway.auth.rateLimit` 且发生过多认证失败，端点会返回 `429` 并附带 `Retry-After`。

## 安全边界（重要）

请将此端点视为该 gateway 实例的**完整操作员访问**界面。

- 此处的 HTTP bearer 认证不是狭义的逐用户作用域模型。
- 此端点上的有效 Gateway 网关 token/password 应被视为所有者/操作员凭证。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用方发送了更窄的 `x-openclaw-scopes` 请求头，端点仍会恢复正常的完整操作员默认权限。
- 共享密钥认证还会将此端点上的直接工具调用视为所有者发送者轮次。
- 受信任的携带身份的 HTTP 模式（例如 trusted proxy 认证，或私有入口上的 `gateway.auth.mode="none"`）会在提供 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作员默认作用域集合。
- 此端点应仅暴露在 loopback/tailnet/私有入口上；不要直接公开到公共互联网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明调用方持有共享 gateway 操作员 secret
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整默认操作员作用域集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的直接工具调用视为所有者发送者轮次
- 受信任的携带身份的 HTTP 模式（例如 trusted proxy 认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 认证某个外层受信任身份或部署边界
  - 在存在该请求头时遵循 `x-openclaw-scopes`
  - 在请求头缺失时回退到正常操作员默认作用域集合
  - 仅当调用方显式缩小作用域并省略 `operator.admin` 时，才会失去所有者语义

## 请求体

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

字段：

- `tool`（字符串，必填）：要调用的工具名称。
- `action`（字符串，可选）：如果工具 schema 支持 `action` 且 `args` payload 中未提供它，则会将其映射进 args。
- `args`（对象，可选）：工具专用参数。
- `sessionKey`（字符串，可选）：目标会话键。如果省略或为 `"main"`，Gateway 网关会使用已配置的主会话键（遵循 `session.mainKey` 和默认智能体；在全局作用域中则使用 `global`）。
- `dryRun`（布尔值，可选）：保留供未来使用；当前会被忽略。

## 策略 + 路由行为

工具可用性会经过与 Gateway 网关智能体相同的策略链过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略（如果会话键映射到某个群组或渠道）
- 子智能体策略（当使用子智能体会话键调用时）

如果某个工具不被策略允许，端点会返回 **404**。

重要边界说明：

- Exec 审批是操作员防护栏，而不是这个 HTTP 端点的单独授权边界。如果某个工具通过 Gateway 网关认证 + 工具策略可在此处访问，`/tools/invoke` 不会再增加额外的逐次调用审批提示。
- 不要与不受信任的调用方共享 Gateway 网关 bearer 凭证。如果你需要跨信任边界隔离，请运行独立的 gateways（理想情况下也应使用独立 OS 用户/主机）。

Gateway HTTP 默认还会应用一个硬拒绝列表（即使会话策略允许该工具）：

- `exec` —— 直接命令执行（RCE 攻击面）
- `spawn` —— 任意子进程创建（RCE 攻击面）
- `shell` —— shell 命令执行（RCE 攻击面）
- `fs_write` —— 宿主机上的任意文件修改
- `fs_delete` —— 宿主机上的任意文件删除
- `fs_move` —— 宿主机上的任意文件移动/重命名
- `apply_patch` —— patch 应用可能重写任意文件
- `sessions_spawn` —— 会话编排；远程生成智能体属于 RCE
- `sessions_send` —— 跨会话消息注入
- `cron` —— 持久化自动化控制平面
- `gateway` —— gateway 控制平面；防止通过 HTTP 重新配置
- `nodes` —— 节点命令中继可到达配对主机上的 `system.run`
- `whatsapp_login` —— 需要终端 QR 扫描的交互式设置；在 HTTP 上会挂起

你可以通过 `gateway.tools` 自定义此拒绝列表：

```json5
{
  gateway: {
    tools: {
      // 通过 HTTP /tools/invoke 额外阻止的工具
      deny: ["browser"],
      // 从默认拒绝列表中移除的工具
      allow: ["gateway"],
    },
  },
}
```

为了帮助群组策略解析上下文，你还可以可选设置：

- `x-openclaw-message-channel: <channel>`（例如：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多个账户时）

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）
- `401` → 未授权
- `429` → 认证被限流（设置 `Retry-After`）
- `404` → 工具不可用（未找到或未加入允许列表）
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已清理）

## 示例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
