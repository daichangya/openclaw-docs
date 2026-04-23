---
read_when:
    - 你希望通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下通过 tailnet 访问
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-23T07:07:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05bed9a917878d4849eb7502952e27b7c7a3bf848223735d513d545d51baef6d
    source_path: web/control-ui.md
    workflow: 15
---

# 控制 UI（浏览器）

控制 UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话
以及所选 gateway URL 保存 token；password 不会被持久化。新手引导通常会在首次连接时
为共享密钥身份验证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，
password 身份验证同样可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关
会要求进行一次性**配对审批**——即使你位于同一个 Tailnet 上，
并启用了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止
未授权访问。

**你会看到：**“disconnected (1008): pairing required”

**批准设备：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在重试配对时更改了身份验证详情（role/scopes/public
key），之前的待处理请求会被替代，并创建新的 `requestId`。
批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你又将其从只读权限改为
写入/管理员权限，这会被视为一次审批升级，而不是静默
重连。OpenClaw 会保持旧审批仍然有效，阻止更高权限的重连，
并要求你显式批准新的作用域集合。

一旦获得批准，该设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销，否则无需再次批准。有关
token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 loopback 浏览器连接（`127.0.0.1` / `localhost`）会
  自动获批。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使
  它们来自同一台机器。
- 每个浏览器 profile 都会生成唯一设备 ID，因此切换浏览器或
  清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

控制 UI 支持按浏览器区分的个人身份——一个显示名称和
头像，会附加到发出的消息中，用于在共享
会话中标明归属。该身份保存在浏览器存储中，作用域限定为当前
浏览器 profile，除非你显式随请求提交，否则不会离开 gateway 主机。

- 身份**仅保存在浏览器本地**。它不会同步到其他设备，也
  不属于 gateway 配置文件的一部分。
- 清除站点数据或切换浏览器会将身份重置为空；
  控制 UI 不会尝试从服务器状态中重建身份。
- 关于个人身份的任何内容都不会在服务端持久化，
  除了你实际发送的消息上正常 transcript 作者元数据之外。

## 运行时配置端点

控制 UI 会从
`/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余
gateway HTTP 表面相同的身份验证保护：未认证的浏览器无法
获取它，而成功获取则需要已经有效的 gateway
token/password、Tailscale Serve 身份，或 trusted-proxy 身份。这样可以防止控制 UI 功能标志和端点元数据泄露给共享主机上的
未认证扫描器。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器语言环境进行本地化。
如需稍后覆盖，请打开**概览 -> Gateway 访问 -> 语言**。语言选择器位于 Gateway 访问卡片中，而不是外观设置下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可以做什么

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置以及内置/外部插件渠道的状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：presence 列表 + 刷新（`system-presence`）
- 会话：列表 + 每会话 model/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：dreaming 状态、启用/禁用切换，以及 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 任务：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + caps（`node.list`）
- Exec 审批：编辑 gateway 或节点允许列表 + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带验证地应用 + 重启（`config.apply`），并唤醒上一个活动会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对已提交配置负载中的活动 SecretRef 解析进行预检；未解析的活动已提交 ref 会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项
  摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，
  以及在可用时的插件 + 渠道 schema）；Raw JSON 编辑器
  仅在快照具有安全 raw 往返能力时可用
- 如果某个快照无法安全地进行 raw 往返，控制 UI 会强制使用表单模式，并对该快照禁用 Raw 模式
- Raw JSON 编辑器中的“重置为已保存”会保留以 raw 方式编写的结构（格式、注释、`$include` 布局），而不是重新渲染展平后的快照，因此在快照能安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象损坏为字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带过滤/导出的 gateway 文件日志实时 tail（`logs.tail`）
- 更新：运行 package/git 更新 + 重启（`update.run`），并附带重启报告

Cron 任务面板说明：

- 对于隔离任务，默认投递方式为播报摘要。若你只想内部运行，可切换为 none。
- 选择 announce 后会显示渠道/目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话任务，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错开选项、
  智能体 model/thinking 覆盖，以及尽力投递切换。
- 表单验证为内联方式，带字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 将在没有身份验证标头的情况下发送。
- 已弃用的回退方式：如果尚未迁移，带有 `notify: true` 的旧版已存储任务仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应会通过 `chat` 事件流式传输。
- 使用相同 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当 transcript 条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- `chat.history` 还会从可见的 assistant 文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并移除泄露的 ASCII/全角模型控制 token，同时省略那些其全部可见文本恰好只是静默 token `NO_REPLY` / `no_reply` 的 assistant 条目。
- `chat.inject` 会向会话 transcript 追加一条 assistant 注释，并广播一个 `chat` 事件用于仅 UI 的更新（不会触发智能体运行，也不会向渠道投递）。
- 聊天头部中的 model 和 thinking 选择器会通过 `sessions.patch` 立即修补当前活动会话；它们是持久的会话覆盖，而不是单轮发送选项。
- 停止：
  - 点击**停止**（调用 `chat.abort`）
  - 输入 `/stop`（或单独的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）来中止该会话的所有活动运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分 assistant 文本仍然可以在 UI 中显示
  - 当存在缓冲输出时，Gateway 网关会将中止后的部分 assistant 文本持久化到 transcript 历史中
  - 持久化条目会包含中止元数据，以便 transcript 使用方区分中止部分和正常完成输出

## 托管嵌入

Assistant 消息可以通过 `[embed ...]`
短代码以内联方式渲染托管网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是
  默认值，通常足以支持自包含的浏览器游戏/小组件
- `trusted`：在 `allow-scripts` 之上再添加 `allow-same-origin`，用于同站点
  文档，这些文档确实有意需要更强权限

示例：

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

仅当嵌入文档确实需要 same-origin
行为时，才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是
更安全的选择。

默认仍然会阻止绝对外部 `http(s)` 嵌入 URL。如果你
确实希望 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 为其提供代理：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI/WebSocket Serve 请求可以通过 Tailscale 身份标头
（`tailscale-user-login`）进行身份验证。OpenClaw
会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配来验证该身份，并且只有当
请求携带 Tailscale 的 `x-forwarded-*` 标头并命中 loopback 时才会接受这些身份。若你希望即使对于 Serve 流量也要求显式共享密钥
凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP
和同一身份验证作用域的失败身份验证尝试会在写入速率限制之前串行化。
因此，同一浏览器发起的并发错误重试中，第二个请求可能会显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 身份验证假定 gateway 主机是受信任的。如果该主机上可能运行不受信任的本地
代码，请要求使用 token/password 身份验证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw **会阻止**没有设备身份的控制 UI 连接。

文档化的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的操作员控制 UI 身份验证
- 应急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

**不安全身份验证开关行为：**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` 只是本地兼容性开关：

- 它允许 localhost 控制 UI 会话在
  非安全 HTTP 上下文中无设备身份继续进行。
- 它不会绕过配对检查。
- 它不会放宽远端（非 localhost）设备身份要求。

**仅限紧急情况：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用控制 UI 设备身份检查，这是一次
严重的安全降级。紧急使用后请尽快恢复。

Trusted-proxy 说明：

- 成功的 trusted-proxy 身份验证可以允许**操作员**控制 UI 会话在无
  设备身份的情况下进入
- 这**不适用于** node 角色控制 UI 会话
- 同一主机上的 loopback 反向代理仍然不满足 trusted-proxy 身份验证；参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

控制 UI 带有严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远端 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，不会发起网络获取请求。

这在实践中的含义是：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（对协议内负载很有用）。
- 由渠道元数据发出的远端头像 URL 会在控制 UI 的头像辅助函数中被剥离，并替换为内置 logo/badge，因此受损或恶意渠道无法强迫操作员浏览器发起任意远端图片请求。

你无需做任何修改即可获得此行为——它始终开启，且不可配置。

## 头像路由身份验证

配置了 gateway 身份验证时，控制 UI 头像端点要求与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由保持一致）。这可以防止头像路由在其他方面已受保护的主机上泄露智能体身份。
- 控制 UI 本身在获取头像时会将 gateway token 作为 bearer 标头转发，并使用经过身份验证的 blob URL，因此图像仍能在仪表板中渲染。

如果你禁用了 gateway 身份验证（不建议在共享主机上这样做），头像路由也会变为未认证，与 gateway 的其余部分保持一致。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```

可选绝对 base（当你希望固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远端 Gateway 网关

控制 UI 是静态文件；WebSocket 目标可配置，并且可以
不同于 HTTP 源。当你希望在本地运行 Vite 开发服务器，
但 Gateway 网关运行在其他地方时，这会很方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性身份验证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这可避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为兼容性导入一次，但仅作为回退，并会在引导后立即移除。
- `password` 仅保存在内存中。
- 当设置了 `gatewayUrl` 时，UI 不会回退到配置或环境变量凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 之后时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 只会在顶层窗口中被接受（不能嵌入），以防止点击劫持。
- 非 loopback 的控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远端开发设置。
- 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它表示允许任何浏览器 origin，而不是“匹配我当前
  使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 标头 origin 回退模式，但这是一种危险的安全模式。

示例：

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

远端访问设置详情：[远端访问](/zh-CN/gateway/remote)。

## 相关内容

- [仪表板](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
