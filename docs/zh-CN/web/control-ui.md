---
read_when:
    - 你希望通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下通过 Tailnet 访问
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-04-23T06:44:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05c5a1b9c0527d230b1657e15b1adf681817d279128af8197a14eb9bdde3d211
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI（浏览器）

Control UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会**直接连接到同一端口上的 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份请求头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份请求头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个 token；密码不会被持久化。新手引导通常会在首次连接时为共享密钥身份验证生成一个 Gateway 网关 token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码身份验证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关会要求一次**一次性配对批准**——即使你位于同一个 Tailnet 中，并且设置了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未授权访问。

**你会看到：** “disconnected (1008): pairing required”

**批准该设备：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在更改了身份验证详情（角色/作用域/公钥）后重试配对，之前的待处理请求会被替换，并生成新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读访问更改为写入/管理员访问，这会被视为一次权限升级批准，而不是静默重连。OpenClaw 会保持旧批准有效，阻止权限更高的重连，并要求你显式批准新的作用域集合。

一旦获批，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关 token 轮换和撤销，请参见 [Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动获批。
- Tailnet 和 LAN 浏览器连接即使来自同一台机器，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据后都需要重新配对。

## 语言支持

Control UI 可在首次加载时根据你的浏览器区域设置进行本地化。若要之后覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不在 Appearance 下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选区域设置会保存到浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可执行的操作

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在 Chat 中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- Channels：内置以及内置/外部渠道插件状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线状态列表 + 刷新（`system-presence`）
- Sessions：列表 + 按会话覆盖 model/thinking/fast/verbose/trace/reasoning（`sessions.list`、`sessions.patch`）
- Dreams：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或节点 allowlist + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带验证的应用 + 重启（`config.apply`），并唤醒最后一个活跃会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会在写入前，对已提交配置负载中的活动 SecretRef 执行预检解析；无法解析的活动已提交引用会在写入前被拒绝
- 配置模式 + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，
  以及可用时的插件 + 渠道模式）；仅当快照具备安全的原始往返能力时，才提供 Raw JSON 编辑器
- 如果某个快照无法安全地进行原始文本往返，Control UI 会强制使用 Form 模式，并对该快照禁用 Raw 模式
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防意外将对象破坏成字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：Gateway 网关文件日志实时 tail，支持筛选/导出（`logs.tail`）
- 更新：执行包/git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，投递默认是公告摘要。如果你只想内部运行，可以切换为 none。
- 当选择 announce 时，会显示渠道/目标字段。
- webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可使用 webhook 和 none 投递模式。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、
  智能体 model/thinking 覆盖，以及尽力投递开关。
- 表单验证为内联方式，并显示字段级错误；无效值会禁用保存按钮，直到修复。
- 设置 `cron.webhookToken` 可发送专用 bearer token；若省略，则发送 webhook 时不带身份验证请求头。
- 已弃用的回退：已存储的旧作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式返回。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- `chat.history` 响应有大小限制，以保障 UI 安全。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略体积较大的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- `chat.history` 还会从可见助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并移除泄露出的 ASCII/全角模型控制 token；同时会省略那些完整可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录追加一条助手说明，并广播一个 `chat` 事件用于仅 UI 更新（不会触发智能体运行，也不会进行渠道投递）。
- 聊天头部的 model 和 thinking 选择器会通过 `sessions.patch` 立即修补当前活跃会话；它们是持久化的会话覆盖，而不是单轮发送选项。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`），可中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍可能显示在 UI 中
  - 如果存在缓冲输出，Gateway 网关会将被中止的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录消费者区分中止产生的部分文本和正常完成输出

## 托管 embed

助手消息可以通过 `[embed ...]`
短代码以内联方式渲染托管网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁止在托管 embed 中执行脚本
- `scripts`：允许交互式 embed，同时保持源隔离；这是
  默认值，通常足以满足自包含的浏览器游戏/小部件
- `trusted`：在 `allow-scripts` 基础上再添加 `allow-same-origin`，适用于有意需要更高权限的同站文档

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

仅当嵌入文档确实需要同源行为时才使用 `trusted`。
对于大多数由智能体生成的游戏和交互式 canvas，`scripts` 是
更安全的选择。

默认情况下，绝对外部 `http(s)` embed URL 仍会被阻止。如果你
确实希望 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成 Tailscale Serve（首选）

让 Gateway 网关保持绑定在 loopback 上，并由 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份请求头
（`tailscale-user-login`）完成身份验证。OpenClaw
会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并与该请求头匹配来验证身份，并且仅在请求通过 Tailscale 的 `x-forwarded-*` 请求头命中 loopback 时接受这些请求。若你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP 和相同身份验证作用域的失败身份验证尝试，会在写入限流数据之前串行化处理。因此，同一浏览器的并发错误重试在第二次请求时可能会显示 `retry later`，而不是出现两个并行竞争的普通不匹配。
无 token 的 Serve 身份验证假设 Gateway 网关主机是可信的。如果该主机上可能运行不可信本地代码，请要求使用 token/password 身份验证。

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
OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式：`gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的操作员 Control UI 身份验证
- 紧急兜底：`gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

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

`allowInsecureAuth` 仅是一个本地兼容性开关：

- 它允许 localhost 的 Control UI 会话在非安全 HTTP 上下文中，
  无需设备身份即可继续进行。
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

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是一种
严重的安全降级。紧急使用后请尽快恢复。

受信任代理说明：

- 成功的 trusted-proxy 身份验证可以让**操作员** Control UI 会话在没有
  设备身份的情况下接入
- 这**不**适用于 node-role 的 Control UI 会话
- 同一主机上的 loopback 反向代理仍然不能满足 trusted-proxy 身份验证；请参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 采用严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，也不会发起网络请求。

这在实际中的含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可正常渲染。
- 内联 `data:image/...` URL 仍可正常渲染（对协议内负载很有用）。
- 渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置 logo/badge，因此即使某个渠道被攻破或存在恶意行为，也无法强制操作员浏览器任意拉取远程图片。

你无需进行任何更改即可获得此行为——它始终开启，且不可配置。

## 头像路由身份验证

当配置了 Gateway 网关身份验证时，Control UI 的头像端点要求使用与其余 API 相同的 Gateway 网关 token：

- `GET /avatar/<agentId>` 仅向已通过身份验证的调用者返回头像图片。`GET /avatar/<agentId>?meta=1` 也会在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由保持一致）。这可以防止头像路由在其他部分已受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 Gateway 网关 token 作为 bearer 请求头转发，并使用已认证的 blob URL，因此图片仍能在仪表板中正常渲染。

如果你禁用了 Gateway 网关身份验证（不建议在共享主机上这样做），则头像路由也会像网关其余部分一样变为无身份验证。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。请使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你想要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev server + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以
与 HTTP 源不同。当你想在本地运行 Vite dev server，
但 Gateway 网关运行在别处时，这非常有用。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性身份验证（如需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存入 localStorage，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，因此可避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数为了兼容仍会导入一次，但仅作为回退使用，并会在 bootstrap 后立即剥离。
- `password` 仅保存在内存中。
- 当设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。如果缺少显式凭证，会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程开发设置。
- 除非是在严格受控的本地测试中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  这表示允许任意浏览器 origin，而不是“匹配我正在使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 请求头 origin 回退模式，但这是危险的安全模式。

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

远程访问设置详情： [远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — Gateway 网关健康监控
