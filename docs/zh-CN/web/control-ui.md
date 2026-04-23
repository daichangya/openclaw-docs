---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在无需 SSH 隧道的情况下通过 Tailnet 访问
summary: 基于浏览器的 Gateway 网关 控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-23T07:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# 控制 UI（浏览器）

控制 UI 是一个由 Gateway 网关 提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会**直接连接到同一端口上的 Gateway WebSocket**。

## 快速打开（本地）

如果 Gateway 网关 运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用可信代理身份头

仪表板设置面板会为当前浏览器标签页会话保存 token
和所选的 Gateway 网关 URL；密码不会被持久化。新手引导通常会在首次连接时
为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，
也可以使用密码认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关
要求进行**一次性配对批准**——即使你位于同一个 Tailnet
且已设置 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，
用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在重试配对时更改了认证详情（角色 / scope / 公钥），
先前的待处理请求会被新的请求取代，并创建新的 `requestId`。
请在批准前重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你又将其从只读访问改为
写入 / 管理员访问，这会被视为一次批准升级，而不是静默重连。
OpenClaw 会保持旧批准继续有效，阻止更高权限的重连，
并要求你显式批准新的 scope 集合。

一旦批准，设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要再次批准。参见
[设备 CLI](/zh-CN/cli/devices) 了解 token 轮换和撤销。

**说明：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）
  会被自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使
  它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或
  清除浏览器数据都会要求重新配对。

## 个人身份（浏览器本地）

控制 UI 支持按浏览器存储的个人身份（显示名称和
头像），它会附加到发送出的消息上，用于在共享会话中标记消息归属。它存储在浏览器中，
作用域仅限当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，
除非是你实际发送消息后产生的常规转录作者元数据。清除站点数据或
切换浏览器都会将其重置为空。

## 运行时配置端点

控制 UI 会从
`/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余
HTTP 表面相同的 gateway 认证保护：未认证浏览器无法获取它，
成功获取要求已经持有有效的 gateway token / password、Tailscale Serve 身份，
或可信代理身份。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器语言环境自动本地化。
如果之后想覆盖它，请打开 **Overview -> Gateway Access -> Language**。该
语言选择器位于 Gateway Access 卡片中，而不是在 Appearance 下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需延迟加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可执行的操作

- 通过 Gateway WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部渠道插件的状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 针对单个会话的模型 / thinking / fast / verbose / trace / reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：Dreaming 状态、启用 / 禁用切换，以及 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 作业：列出 / 新增 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + 针对 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带校验地应用并重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会对提交配置负载中的活跃 SecretRef 解析执行预检；若提交的活跃引用无法解析，则会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项
  摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，
  以及在可用时提供的插件 + 渠道 schema）；只有当快照能安全执行原始文本往返时，
  才提供 Raw JSON 编辑器
- 如果某个快照无法安全进行原始文本往返，控制 UI 会强制使用 Form 模式，并对该快照禁用 Raw 模式
- Raw JSON 编辑器中的 “Reset to saved” 会保留原始编写形态（格式、注释、`$include` 布局），而不是重新渲染拍平后的快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防对象被意外破坏并转换成字符串
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：对 gateway 文件日志进行实时 tail，并支持过滤 / 导出（`logs.tail`）
- 更新：运行 package / git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，默认投递模式为公告摘要。如果你希望仅内部运行，可以切换为 none。
- 选择 announce 时会显示 channel / target 字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错峰选项、
  智能体模型 / thinking 覆盖，以及尽力投递切换项。
- 表单校验为内联方式，并提供字段级错误；只要存在无效值，保存按钮就会被禁用，直到修复为止。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 会在不带认证头的情况下发送。
- 已弃用的回退：带有 `notify: true` 的旧版存储作业在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后通过 `chat` 事件流式返回响应。
- 使用相同的 `idempotencyKey` 再次发送时，运行中会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小上限。当转录条目过大时，Gateway 网关 可能会截断过长的文本字段、忽略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- `chat.history` 还会从可见的 assistant 文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并去除泄漏的 ASCII / 全角模型控制 token；同时还会省略那些其完整可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的 assistant 条目。
- `chat.inject` 会向会话转录中追加一条 assistant 备注，并广播一个 `chat` 事件供仅 UI 更新使用（不会触发智能体运行，也不会投递到渠道）。
- 聊天头部中的模型和 thinking 选择器会通过 `sessions.patch` 立即修补当前活跃会话；它们是持久化的会话覆盖项，而不是单回合发送选项。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 输入 `/stop`（或独立中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当一次运行被中止时，部分 assistant 文本仍可能在 UI 中显示
  - 当存在缓冲输出时，Gateway 网关 会将中止时的部分 assistant 文本持久化到转录历史中
  - 持久化条目会包含中止元数据，以便转录使用者区分中止的部分输出与正常完成输出

## 托管嵌入

Assistant 消息可以通过 `[embed ...]`
短代码内联渲染托管网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是
  默认值，通常足以支持自包含的浏览器游戏 / 小组件
- `trusted`：在 `allow-scripts` 之上再添加 `allow-same-origin`，用于有意需要更高权限的同站文档

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

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你
确实希望 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成的 Tailscale Serve（首选）

让 Gateway 网关 保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，
控制 UI / WebSocket Serve 请求可以通过 Tailscale 身份头
（`tailscale-user-login`）进行认证。OpenClaw
会通过 `tailscale whois` 解析 `x-forwarded-for` 地址来验证身份，
并将其与该头进行匹配；只有当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 头时，
才会接受这些头。若你希望即使对于 Serve 流量也要求显式共享密钥
凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP
和相同认证范围的失败认证尝试会在写入限速前被串行化。
因此，同一浏览器发起的并发错误重试可能会让第二个请求显示 `retry later`，
而不是两个普通不匹配请求并行竞争。
无 token 的 Serve 认证默认假设 gateway 主机是可信的。如果该主机上可能运行不可信的本地代码，请要求使用 token / password 认证。

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
OpenClaw 会**阻止**没有设备身份的控制 UI 连接。

文档中说明的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式：`gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员控制 UI 认证
- 紧急兜底模式 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve），或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

**不安全认证开关行为：**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` 只是一个本地兼容性开关：

- 它允许 localhost 控制 UI 会话在
  非安全 HTTP 上下文中无需设备身份即可继续。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急兜底：**

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

可信代理说明：

- 成功的 trusted-proxy 认证可以允许**操作员**控制 UI 会话在没有
  设备身份的情况下接入
- 这**不**适用于 node 角色的控制 UI 会话
- 同主机的 loopback 反向代理仍然不能满足 trusted-proxy 认证；参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

请参阅 [Tailscale](/zh-CN/gateway/tailscale) 了解 HTTPS 设置指南。

## 内容安全策略

控制 UI 附带严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络请求。

这在实践中的含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（对协议内负载很有用）。
- 由渠道元数据输出的远程头像 URL 会在控制 UI 的头像辅助函数中被剥离，并替换为内置 logo / badge，因此即使某个渠道被攻破或是恶意的，也无法强制操作员浏览器发起任意远程图片请求。

你无需做任何修改即可获得此行为——它始终开启，且不可配置。

## 头像路由认证

当配置了 gateway 认证时，控制 UI 头像端点与其余 API 一样需要相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在同样规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与同级 assistant-media 路由保持一致）。这可防止头像路由在其他方面受保护的主机上泄露智能体身份。
- 控制 UI 在获取头像时会将 gateway token 作为 bearer 头转发，并使用已认证的 blob URL，因此图片仍能在仪表板中显示。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会与其余 gateway 一样变为无需认证。

## 构建 UI

Gateway 网关 会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选绝对 base 路径（当你希望固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立 dev 服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：dev 服务器 + 远程 Gateway

控制 UI 是静态文件；WebSocket 目标是可配置的，并且可以
不同于 HTTP 来源。当你希望在本地运行 Vite dev 服务器，
但 Gateway 网关 运行在其他地方时，这会很方便。

1. 启动 UI dev 服务器：`pnpm ui:dev`
2. 打开类似下面的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如果需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存入 localStorage，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数为了兼容性仍会被一次性导入，但仅作为后备方式，并会在启动后立即移除。
- `password` 仅保存在内存中。
- 设置 `gatewayUrl` 后，UI 不会回退到配置或环境中的凭证。
  你需要显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关 位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
- 非 loopback 的控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程 dev 场景。
- 除非是在严格受控的本地测试中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它的含义是允许任意浏览器 origin，而不是“匹配我当前正在使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 头 origin 回退模式，但这是一种危险的安全模式。

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

远程访问设置详情：参见[远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
