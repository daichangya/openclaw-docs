---
read_when:
    - 你想从外部系统触发或驱动 TaskFlows
    - 你正在配置内置的 webhooks 插件
summary: Webhooks 插件：面向受信任外部自动化的已认证 TaskFlow 入口
title: Webhooks 插件
x-i18n:
    generated_at: "2026-04-23T20:59:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks（插件）

Webhooks 插件会添加已认证的 HTTP 路由，将外部
自动化绑定到 OpenClaw TaskFlows。

当你希望像 Zapier、n8n、CI 作业或某个
内部服务这样的受信任系统，在无需先编写自定义
插件的情况下创建并驱动受管 TaskFlows 时，请使用它。

## 它运行在哪里

Webhooks 插件运行在 Gateway 网关进程内部。

如果你的 Gateway 网关运行在另一台机器上，请在该 Gateway 网关主机上安装并配置该插件，然后重启 Gateway 网关。

## 配置路由

在 `plugins.entries.webhooks.config` 下设置配置：

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

路由字段：

- `enabled`：可选，默认值为 `true`
- `path`：可选，默认值为 `/plugins/webhooks/<routeId>`
- `sessionKey`：必填，拥有绑定 TaskFlows 的会话
- `secret`：必填，共享密钥或 SecretRef
- `controllerId`：可选，用于已创建受管 flow 的 controller id
- `description`：可选，面向操作员的说明

支持的 `secret` 输入：

- 纯字符串
- 带有 `source: "env" | "file" | "exec"` 的 SecretRef

如果某个基于密钥的路由在启动时无法解析其密钥，插件会跳过
该路由，并记录警告，而不会暴露一个损坏的端点。

## 安全模型

每条路由都被信任为以其配置的
`sessionKey` 的 TaskFlow 权限行事。

这意味着该路由可以检查并修改该会话拥有的 TaskFlows，因此
你应当：

- 为每条路由使用强且唯一的密钥
- 优先使用密钥引用，而不是内联明文密钥
- 将路由绑定到最窄范围且能满足工作流的会话
- 只暴露你需要的特定 webhook 路径

插件会应用：

- 共享密钥认证
- 请求体大小和超时保护
- 固定窗口速率限制
- 飞行中请求数量限制
- 通过 `api.runtime.taskFlow.bindSession(...)` 实现绑定到所有者的 TaskFlow 访问

## 请求格式

发送 `POST` 请求，并带上：

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`

示例：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支持的 action

插件当前接受以下 JSON `action` 值：

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

为该路由绑定的会话创建一个受管 TaskFlow。

示例：

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

在现有受管 TaskFlow 中创建一个受管子任务。

允许的运行时有：

- `subagent`
- `acp`

示例：

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 响应结构

成功响应会返回：

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

被拒绝的请求会返回：

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

该插件会有意从 webhook 响应中清除所有者/会话元数据。

## 相关文档

- [Plugin Runtime](/zh-CN/plugins/sdk-runtime)
- [Hooks and webhooks overview](/zh-CN/automation/hooks)
- [CLI webhooks](/zh-CN/cli/webhooks)
