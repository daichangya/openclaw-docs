---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下通过 tailnet 访问
summary: 用于 Gateway 网关的基于浏览器的 Control UI（聊天、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-04-23T23:06:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63d96fb31328ac820b55231d618df96d10e26567213f6732628d65d5c0a89f31
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个小型的 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份 header
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用 trusted-proxy 身份 header

dashboard 设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留 token；不会持久化密码。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关 token，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证同样可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关要求进行**一次性配对批准**——即使你已位于同一个 tailnet 上，且设置了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按 request ID 批准
openclaw devices approve <requestId>
```

如果浏览器在配对重试时改变了认证细节（role / scopes / public
key），之前待处理的请求会被取代，并创建新的 `requestId`。
批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读访问改为
写入 / 管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准继续有效，阻止更高权限的重连，并要求你显式批准新的作用域集合。

一旦批准，该设备就会被记住，之后无需再次批准，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它。有关 token 轮换和撤销，请参见
[Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- tailnet 和 LAN 浏览器连接即使来自同一台机器，也仍然需要显式批准。
- 每个浏览器 profile 都会生成唯一设备 ID，因此更换浏览器或清除浏览器数据后需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器保存个人身份（显示名称和头像），并会在共享会话中附加到外发消息上，用于归属标识。它保存在浏览器存储中，仅作用于当前浏览器 profile，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送的消息中正常的转录作者元数据之外。清除站点数据或更换浏览器后会重置为空。

## 运行时配置端点

Control UI 会从
`/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其他 HTTP 界面相同的 Gateway 网关认证保护：未认证浏览器无法获取它；成功获取要求已有有效的 Gateway 网关 token / password、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

Control UI 可在首次加载时根据你的浏览器语言区域进行本地化。若之后想覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不在 Appearance 下。

- 支持的语言区域：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言区域会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可以做什么

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在 Chat 中流式显示工具调用和实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- Instances：在线状态列表 + 刷新（`system-presence`）
- Sessions：列出会话 + 按会话设置模型 / thinking / fast / verbose / trace / reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：dreaming 状态、启用 / 禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- cron 任务：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或 node allowlists + 为 `exec host=gateway/node` 配置询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带验证的应用 + 重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 防护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会对所提交配置负载中的活跃 SecretRef 解析进行预检；未解析的活跃已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配到的 UI 提示、直接子项摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，以及在可用时的插件 + 渠道 schemas）；只有当快照可安全进行原始 round-trip 时，才提供 Raw JSON 编辑器
- 如果某个快照无法安全进行原始 round-trip，Control UI 会强制使用表单模式，并对该快照禁用 Raw 模式
- Raw JSON 编辑器中的 “Reset to saved” 会保留原始编写形态（格式、注释、`$include` 布局），而不是重新渲染成扁平快照，因此当快照可以安全 round-trip 时，外部编辑在重置后仍能保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止对象被意外损坏为字符串
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：Gateway 网关文件日志的实时 tail，带过滤 / 导出（`logs.tail`）
- 更新：运行 package / git 更新 + 重启（`update.run`），并附带重启报告

cron 任务面板说明：

- 对于隔离任务，投递默认是 announce 摘要。若你希望仅内部运行，可切换为 none。
- 选择 announce 时会显示 channel / target 字段。
- webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话任务，webhook 和 none 投递模式都可用。
- 高级编辑控件包括 run 后删除、清除智能体覆盖、cron 精确 / 错峰选项、
  智能体模型 / thinking 覆盖，以及尽力投递开关。
- 表单验证为内联方式，带字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；若省略，则 webhook 会在没有 auth header 的情况下发送。
- 已弃用的回退方案：带有 `notify: true` 的旧版已存储任务在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式返回。
- 使用相同 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后则返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、忽略较重的元数据块，并用占位符替换过大的消息（`[chat.history omitted: message too large]`）。
- 助手生成的图像会作为托管媒体引用持久化，并通过带认证的 Gateway 网关媒体 URL 回传，因此页面重载不依赖原始 base64 图像负载持续存在于聊天历史响应中。
- `chat.history` 还会从可见助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并移除泄露的 ASCII / 全角模型控制 token，同时省略那些全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录附加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不触发智能体运行，也不进行渠道投递）。
- 聊天头部中的模型和 thinking 选择器会通过 `sessions.patch` 立即修改当前活动会话；它们是持久的会话覆盖，而不是只作用于一轮发送的选项。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 输入 `/stop`（或独立中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`），用于中止该会话的所有活动运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍可在 UI 中显示
  - 如果存在已缓冲输出，Gateway 网关会将已中止的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录使用方区分中止的部分输出与正常完成输出

## 托管嵌入

助手消息可以使用 `[embed ...]`
短代码内联渲染托管的 Web 内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁止托管嵌入中执行脚本
- `scripts`：允许交互式嵌入，同时保持来源隔离；这是默认值，通常足以满足自包含的浏览器游戏 / 小组件
- `trusted`：在 `allow-scripts` 之上额外加入 `allow-same-origin`，适用于有意需要更高权限的同站文档

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
行为时，才使用 `trusted`。对于大多数智能体生成的游戏和交互式 canvas，`scripts` 是更安全的选择。

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并使用 Tailscale Serve 以 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份 header
（`tailscale-user-login`）进行认证。OpenClaw
会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该 header 匹配来验证身份，而且只有当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` headers 时才接受这些身份。若你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于这条异步 Serve 身份路径，同一客户端 IP
和认证作用域的失败认证尝试会在写入限流状态前串行化。因此，同一浏览器发起的并发错误重试中，第二次请求可能会显示 `retry later`，而不是两个普通不匹配请求并行竞争。
无 token 的 Serve 认证假定 Gateway 网关主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 认证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将对应的共享密钥粘贴到 UI 设置中（会作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 非安全 HTTP

如果你通过明文 HTTP 打开 dashboard（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 仅 localhost 的非安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的 operator Control UI 认证
- 破窗救急的 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve），或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 网关主机上）

**非安全认证开关行为：**

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

- 它允许 localhost 的 Control UI 会话在非安全 HTTP 上下文中在没有设备身份的情况下继续。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急救急：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是一次严重的安全降级。应在紧急使用后尽快恢复。

trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以让 **operator** 的 Control UI 会话在没有设备身份的情况下通过
- 这**不**适用于 node-role 的 Control UI 会话
- 同主机 loopback 反向代理仍然不满足 trusted-proxy 认证；请参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带了严格的 `img-src` 策略：只允许 **同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络请求。

这在实践中的含义是：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（适用于协议内负载）。
- 渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助工具中被剥离，并替换为内置 logo / badge，因此即使某个渠道被攻破或恶意，也无法强迫运维浏览器发起任意远程图片请求。

你无需进行任何修改即可获得此行为——它始终开启，且不可配置。

## 头像路由认证

当 Gateway 网关认证已配置时，Control UI 头像端点需要与 API 其他部分相同的 Gateway 网关 token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与其相邻的 assistant-media 路由保持一致）。这可防止头像路由在其他部分已受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 Gateway 网关 token 作为 bearer header 转发，并使用带认证的 blob URL，因此图像仍可在 dashboard 中正常渲染。

如果你禁用了 Gateway 网关认证（不建议在共享主机上这样做），则头像路由也会和 Gateway 网关其余部分一样变为无需认证。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件服务。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你希望使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：dev server + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以与 HTTP 来源不同。
当你希望本地运行 Vite dev server，但 Gateway 网关运行在别处时，这一点很有用。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开类似如下的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如果需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存入 localStorage，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，从而避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性被导入一次，但仅作为回退手段，并会在引导后立刻移除。
- `password` 只保存在内存中。
- 设置了 `gatewayUrl` 后，UI 不会再回退到配置或环境变量凭证。
  你必须显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后方（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置
  `gateway.controlUi.allowedOrigins`（完整 origins）。这也包括远程开发设置。
- 除非是在严格受控的本地测试环境中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 可启用
  Host header 来源回退模式，但这是危险的安全模式。

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

- [Dashboard](/zh-CN/web/dashboard) — Gateway 网关 dashboard
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
