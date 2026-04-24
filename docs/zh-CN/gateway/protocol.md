---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议 schema/模型
summary: Gateway 网关 WebSocket 协议：握手、帧和版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-04-24T03:16:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway 网关协议（WebSocket）

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明其**角色** + **作用域**。

## 传输

- WebSocket，带有 JSON 负载的文本帧。
- 第一帧**必须**是一个 `connect` 请求。
- 连接前的帧大小上限为 64 KiB。握手成功后，客户端
  应遵循 `hello-ok.policy.maxPayload` 和
  `hello-ok.policy.maxBufferedBytes` 限制。启用诊断时，
  过大的入站帧和缓慢的出站缓冲区会先发出 `payload.large` 事件，
  然后 Gateway 网关才会关闭连接或丢弃受影响的帧。这些事件会保留
  大小、限制、表面和安全原因代码。它们不会保留消息正文、
  附件内容、原始帧正文、令牌、cookies 或秘密值。

## 握手（connect）

Gateway 网关 → 客户端（连接前挑战）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → Gateway 网关：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway 网关 → 客户端：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`、`features`、`snapshot` 和 `policy` 在 schema 中
都是必填项（`src/gateway/protocol/schema/frames.ts`）。`canvasHostUrl` 是可选项。`auth`
会在可用时报告协商后的 role/scopes，并在 Gateway 网关签发时包含 `deviceToken`。

当未签发设备令牌时，`hello-ok.auth` 仍可报告协商后的
权限：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

当签发设备令牌时，`hello-ok` 还会包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的 bootstrap 交接期间，`hello-ok.auth` 还可能在 `deviceTokens` 中包含额外的
有界角色条目：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

对于内置的 node/operator bootstrap 流程，主节点令牌保持
`scopes: []`，任何交接的 operator 令牌都会保持在 bootstrap
operator 允许列表（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）范围内。Bootstrap 作用域检查仍保持
角色前缀：operator 条目仅满足 operator 请求，而非 operator
角色仍需要其自身角色前缀下的作用域。

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 帧格式

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要 **idempotency keys**（参见 schema）。

## 角色 + 作用域

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### 作用域（operator）

常见作用域：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

插件注册的 Gateway 网关 RPC 方法可以请求它们自己的 operator 作用域，但
保留的核心管理前缀（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道门。某些通过
`chat.send` 到达的斜杠命令会在此之上应用更严格的命令级检查。例如，持久化的
`/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法作用域之上还有一层额外的审批时作用域检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

节点在连接时声明能力主张：

- `caps`：高层能力类别。
- `commands`：用于 invoke 的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并在服务器端强制执行允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以在设备同时以 **operator** 和 **node** 身份连接时，仍显示单行记录。

## 广播事件作用域

服务器推送的 WebSocket 广播事件受作用域门控，因此仅具备配对作用域或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话将完全跳过这些帧。
- **插件定义的 `plugin.*` 广播** 会根据插件注册方式，被门控为 `operator.write` 或 `operator.admin`。
- **状态和传输事件**（`heartbeat`、`presence`、`tick`、连接/断开生命周期等）保持不受限制，以便每个已认证会话都能观察传输健康状况。
- **未知广播事件族** 默认受作用域门控（默认拒绝），除非已注册处理程序显式放宽它们。

每个客户端连接都维护自己的每客户端序列号，因此即使不同客户端看到的事件流子集因作用域过滤而不同，广播在该 socket 上仍保持单调顺序。

## 常见 RPC 方法家族

公开的 WS 表面比上面的握手/认证示例更广。这
不是生成的转储——`hello-ok.features.methods` 是一个保守的
发现列表，基于 `src/gateway/server-methods-list.ts` 以及已加载的
插件/渠道方法导出构建。请将其视为功能发现，而不是对 `src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器。它保留事件名、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 id 等操作元数据。它不保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookies 或秘密值。需要 operator.read 作用域。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅对具有 admin 作用域的 operator 客户端包含。
    - `gateway.identity.get` 返回 relay 和 pairing 流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回当前已连接 operator/node 设备的在线状态快照。
    - `system-event` 追加一个系统事件，并可以更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 网关上的 heartbeat 处理。
  </Accordion>

  <Accordion title="模型和使用情况">
    - `models.list` 返回运行时允许的模型目录。
    - `usage.status` 返回提供商使用窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围内聚合的成本使用摘要。
    - `doctor.memory.status` 返回活动默认智能体工作区的向量内存 / embedding 就绪状态。
    - `sessions.usage` 返回按会话统计的使用摘要。
    - `sessions.usage.timeseries` 返回单个会话的时间序列使用情况。
    - `sessions.usage.logs` 返回单个会话的使用日志条目。
  </Accordion>

  <Accordion title="渠道和登录辅助">
    - `channels.status` 返回内置 + 内置渠道/插件状态摘要。
    - `channels.logout` 在渠道支持登出时，登出特定渠道/账号。
    - `web.login.start` 为当前支持 QR/Web 登录的 Web 渠道提供商启动 QR/Web 登录流程。
    - `web.login.wait` 等待该 QR/Web 登录流程完成，并在成功时启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。
  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是直接出站传递 RPC，用于在聊天运行器之外按渠道/账号/线程目标发送消息。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志尾部，带有游标/限制和最大字节控制。
  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.config` 返回生效的 Talk 配置负载；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.speak` 通过当前激活的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活动提供商、回退提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 运行一次性文本转语音转换。
  </Accordion>

  <Accordion title="秘密、配置、更新和向导">
    - `secrets.reload` 会重新解析活动 SecretRefs，并且仅在完全成功时替换运行时秘密状态。
    - `secrets.resolve` 会为特定命令/目标集解析命令目标的秘密分配。
    - `config.get` 返回当前配置快照和哈希值。
    - `config.set` 写入经过验证的配置负载。
    - `config.patch` 合并部分配置更新。
    - `config.apply` 验证并替换完整配置负载。
    - `config.schema` 返回供 Control UI 和 CLI 工具使用的实时配置 schema 负载：schema、`uiHints`、版本和生成元数据，包括运行时可加载时的插件 + 渠道 schema 元数据。该 schema 包含从与 UI 使用的相同标签和帮助文本派生出的字段 `title` / `description` 元数据，包括嵌套对象、通配符、数组项以及在存在匹配字段文档时的 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回单个配置路径的路径范围查找负载：规范化路径、浅层 schema 节点、匹配的 hint + `hintPath`，以及供 UI/CLI 下钻使用的直接子项摘要。查找 schema 节点会保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要会公开 `key`、规范化的 `path`、`type`、`required`、`hasChildren`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅在更新本身成功时安排重启。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。
  </Accordion>

  <Accordion title="智能体和工作区辅助">
    - `agents.list` 返回已配置的智能体条目。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区连接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体暴露的 bootstrap 工作区文件。
    - `agent.identity.get` 返回智能体或会话的生效助手身份。
    - `agent.wait` 等待某次运行结束，并在可用时返回终态快照。
  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为单个会话切换转录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录预览。
    - `sessions.resolve` 解析或规范化会话目标。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 将消息发送到现有会话中。
    - `sessions.steer` 是活动会话的中断并引导变体。
    - `sessions.abort` 中止某个会话的活动工作。
    - `sessions.patch` 更新会话元数据/覆盖项。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整存储的会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会针对 UI 客户端做显示规范化：可见文本中的内联指令标签会被剥离，纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）以及泄漏的 ASCII/全角模型控制令牌会被剥离，纯静默令牌助手行（如精确的 `NO_REPLY` / `no_reply`）会被省略，过大的行可能会被占位符替换。
  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的已配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在已批准的角色和作用域范围内轮换已配对设备令牌。
    - `device.token.revoke` 撤销已配对设备令牌。
  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject` 和 `node.pair.verify` 涵盖节点配对和 bootstrap 验证。
    - `node.list` 和 `node.describe` 返回已知/已连接的节点状态。
    - `node.rename` 更新已配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回某个调用请求的结果。
    - `node.event` 将节点发起的事件携回 Gateway 网关。
    - `node.canvas.capability.refresh` 刷新带作用域的 canvas 能力令牌。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点的队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久化待处理工作。
  </Accordion>

  <Accordion title="审批家族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵盖一次性 exec 审批请求，以及待处理审批的查找/重放。
    - `exec.approval.waitDecision` 等待一个待处理 exec 审批，并返回最终决定（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵盖插件定义的审批流程。
  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 安排立即或下一个 heartbeat 的唤醒文本注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理计划工作。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。
  </Accordion>
</AccordionGroup>

### 常见事件家族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅转录的聊天
  事件。
- `session.message` 和 `session.tool`：已订阅会话的转录/事件流更新。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive / 存活性事件。
- `health`：Gateway 网关健康快照更新。
- `heartbeat`：heartbeat 事件流更新。
- `cron`：cron 运行/任务变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins` 来获取当前 Skills 可执行文件列表，
  以供自动允许检查使用。

### operator 辅助方法

- operator 可以调用 `commands.list`（`operator.read`）来获取某个智能体的运行时
  命令清单。
  - `agentId` 是可选的；省略时读取默认智能体工作区。
  - `scope` 控制主 `name` 目标对应哪个表面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认的 `both` 路径会在可用时返回感知提供商的原生命名
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带感知提供商的原生命令名称。
  - `provider` 是可选的，仅影响原生命名以及原生插件
    命令可用性。
  - `includeArgs=false` 会从响应中省略序列化参数元数据。
- operator 可以调用 `tools.catalog`（`operator.read`）来获取某个
  智能体的运行时工具目录。响应包含已分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- operator 可以调用 `tools.effective`（`operator.read`）来获取某个会话的运行时生效
  工具清单。
  - `sessionKey` 是必填项。
  - Gateway 网关会从服务器端的会话中派生受信任的运行时上下文，而不是接受
    调用方提供的认证或传递上下文。
  - 响应按会话划定范围，并反映当前活动对话此刻可用的内容，
    包括核心、插件和渠道工具。
- operator 可以调用 `skills.status`（`operator.read`）来获取某个智能体可见的
  Skills 清单。
  - `agentId` 是可选的；省略时读取默认智能体工作区。
  - 响应包含资格、缺失的要求、配置检查和
    已净化的安装选项，而不会暴露原始秘密值。
- operator 可以调用 `skills.search` 和 `skills.detail`（`operator.read`）来获取
  ClawHub 发现元数据。
- operator 可以用两种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将一个
    skill 文件夹安装到默认智能体工作区 `skills/` 目录中。
  - Gateway 网关安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    在 Gateway 网关宿主机上运行一个声明的 `metadata.openclaw.install` 操作。
- operator 可以用两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新默认智能体工作区中某个已跟踪 slug，或所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 的值，例如 `enabled`、
    `apiKey` 和 `env`。

## Exec 审批

- 当某个 exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- operator 客户端通过调用 `exec.approval.resolve` 来完成审批（需要 `operator.approvals` 作用域）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，被转发的 `node.invoke system.run` 调用会复用该规范
  `systemRunPlan` 作为权威的命令/cwd/会话上下文。
- 如果调用方在 prepare 和最终批准的 `system.run` 转发之间修改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会拒绝该运行，而不是信任被修改后的负载。

## 智能体传递回退

- `agent` 请求可以包含 `deliver=true` 以请求出站传递。
- `bestEffortDeliver=false` 会保持严格行为：无法解析或仅内部的传递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析出外部可传递路由时回退为仅会话执行（例如内部/webchat 会话或模糊的多渠道配置）。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配的情况。
- Schemas + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值
在协议 v3 中保持稳定，并且是第三方客户端的预期基线。

| 常量 | 默认值 | 来源 |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| 请求超时（每个 RPC） | `30_000` ms | `src/gateway/client.ts`（`requestTimeoutMs`） |
| 预认证 / connect-challenge 超时 | `10_000` ms | `src/gateway/handshake-timeouts.ts`（钳制到 `250`–`10_000`） |
| 初始重连退避 | `1_000` ms | `src/gateway/client.ts`（`backoffMs`） |
| 最大重连退避 | `30_000` ms | `src/gateway/client.ts`（`scheduleReconnect`） |
| device-token 关闭后的快速重试钳制 | `250` ms | `src/gateway/client.ts` |
| `terminate()` 前的强制停止宽限期 | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()` 默认超时 | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| 默认 tick 间隔（`hello-ok` 之前） | `30_000` ms | `src/gateway/client.ts` |
| tick 超时关闭 | 当静默超过 `tickIntervalMs * 2` 时使用代码 `4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024`（25 MB） | `src/gateway/server-constants.ts` |

服务器会在 `hello-ok` 中通告生效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；客户端应遵循这些值，
而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 网关认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于已配置的认证模式。
- 带身份的模式，例如 Tailscale Serve
  （`gateway.auth.allowTailscale: true`）或非 loopback 的
  `gateway.auth.mode: "trusted-proxy"`，会根据
  请求头而不是 `connect.params.auth.*` 来满足连接认证检查。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接认证；
  不要在公共/不受信任入口上暴露该模式。
- 配对后，Gateway 网关会签发一个**设备令牌**，其作用域绑定到该连接的
  role + scopes。它会在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久化，
  以供后续连接使用。
- 客户端应在任何
  成功连接后持久化主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重新连接时，也应复用该令牌对应的已存储
  已批准作用域集合。这样可以保留
  已被授予的读取/探测/状态访问权限，并避免静默地将重连收窄为
  更窄的隐式仅 admin 作用域。
- 客户端侧连接认证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，设置后始终会被转发。
  - `auth.token` 按优先级填充：首先是显式共享令牌，
    然后是显式 `deviceToken`，再然后是按
    `deviceId` + `role` 键控的已存储每设备令牌。
  - `auth.bootstrapToken` 仅在以上都未解析出
    `auth.token` 时发送。共享令牌或任何已解析的设备令牌都会抑制它。
  - 在一次性
    `AUTH_TOKEN_MISMATCH` 重试中自动提升已存储设备令牌，仅对**受信任端点**开放——
    即 loopback，或带固定 `tlsFingerprint` 的 `wss://`。未做固定的公共 `wss://`
    不符合条件。
- 额外的 `hello-ok.auth.deviceTokens` 条目是 bootstrap 交接令牌。
  仅当连接使用 bootstrap 认证且传输受信任时才持久化它们，
  例如 `wss://` 或 loopback/local pairing。
- 如果客户端提供了**显式** `deviceToken` 或显式 `scopes`，则该
  调用方请求的作用域集仍然是权威值；只有当客户端复用已存储的每设备令牌时，
  才会复用缓存作用域。
- 设备令牌可以通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` 作用域）。
- 令牌签发/轮换始终受限于该设备配对条目中记录的已批准角色集合；
  轮换令牌不能将设备扩展到
  配对审批从未授予的角色。
- 对于已配对设备令牌会话，除非调用方同时具有 `operator.admin`，否则设备管理会限定为自身范围：
  非 admin 调用方只能移除/撤销/轮换其**自己的**
  设备条目。
- `device.token.rotate` 还会根据
  调用方当前会话作用域检查所请求的 operator 作用域集合。非 admin 调用方不能将令牌轮换为
  比自己当前持有更宽的 operator 作用域集合。
- 认证失败会包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以使用缓存的每设备令牌尝试一次有界重试。
  - 如果该重试失败，客户端应停止自动重连循环，并显示操作员操作指引。

## 设备身份 + 配对

- 节点应包含一个稳定的设备身份（`device.id`），它来自
  密钥对指纹。
- Gateway 网关会按设备 + 角色签发令牌。
- 新设备 ID 需要配对审批，除非启用了本地自动审批。
- 配对自动审批以直接的 local loopback 连接为中心。
- OpenClaw 还为
  受信任的共享密钥辅助流程提供了一条狭窄的后端/容器本地自连接路径。
- 同主机 tailnet 或 LAN 连接在配对上仍被视为远程，
  并需要审批。
- 所有 WS 客户端都必须在 `connect` 期间包含 `device` 身份（operator + node）。
  Control UI 仅可在以下模式中省略它：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全 HTTP 兼容。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（紧急破窗选项，严重降低安全性）。
- 所有连接都必须对服务器提供的 `connect.challenge` nonce 进行签名。

### 设备认证迁移诊断

对于仍使用挑战前签名行为的旧客户端，`connect` 现在会在
`error.details.code` 下返回 `DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息 | details.code | details.reason | 含义 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | 客户端省略了 `device.nonce`（或发送了空值）。 |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | 客户端使用了过期/错误的 nonce 进行签名。 |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 签名负载与 v2 负载不匹配。 |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 签名时间戳超出允许的偏移范围。 |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` 与公钥指纹不匹配。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | 公钥格式/规范化失败。 |

迁移目标：

- 始终等待 `connect.challenge`。
- 对包含服务器 nonce 的 v2 负载进行签名。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载是 `v3`，它除 device/client/role/scopes/token/nonce 字段外，
  还绑定了 `platform` 和 `deviceFamily`。
- 为了兼容性，旧版 `v2` 签名仍然被接受，但已配对设备的
  元数据固定仍会在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 网关证书指纹（参见 `gateway.tls`
  配置，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

该协议公开**完整的 Gateway 网关 API**（状态、渠道、模型、聊天、
智能体、会话、节点、审批等）。确切表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定义。

## 相关

- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)
