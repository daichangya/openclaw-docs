---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
summary: Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-24T04:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份头

仪表板设置面板会为当前浏览器标签页会话保存一个 token 和所选的 gateway URL；密码不会被持久化保存。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你位于同一 Tailnet 且设置了 `gateway.auth.allowTailscale: true`。这是防止未经授权访问的一项安全措施。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在重试配对时更改了认证详情（角色/作用域/公钥），之前的待处理请求会被替代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你将其权限从只读更改为写入/管理员权限，这会被视为批准升级，而不是静默重连。OpenClaw 会保留旧批准仍然有效，阻止更高权限的重连，并要求你显式批准新的作用域集合。

一旦获得批准，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关 token 轮换和撤销，请参见 [Devices CLI](/zh-CN/cli/devices)。

**注意：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- Tailnet 和局域网浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持每个浏览器一个个人身份（显示名称和头像），会附加到发出的消息上，以便在共享会话中标明归属。它保存在浏览器存储中，仅限当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化保存，超出你实际发送消息时的常规转录作者元数据范围。清除站点数据或切换浏览器会将其重置为空。

## 运行时配置端点

Control UI 会从 `\/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 接口相同的 gateway 认证保护：未认证的浏览器无法获取它，成功获取要求具备已有效的 gateway token/密码、Tailscale Serve 身份，或受信任代理身份之一。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器区域设置进行本地化。若要稍后覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不在外观设置下。

- 支持的区域设置：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英文翻译会在浏览器中按需懒加载。
- 所选区域设置会保存在浏览器存储中，并在今后访问时重复使用。
- 缺失的翻译键会回退到英文。

## 它目前可以做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 通过 WebRTC 直接从浏览器与 OpenAI Realtime 通话。Gateway 网关使用 `talk.realtime.session` 生成短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送到 OpenAI，并通过 `chat.send` 把 `openclaw_agent_consult` 工具调用中继回去，供已配置的更大型 OpenClaw 模型使用。
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线状态列表 + 刷新（`system-presence`）
- 会话：列表 + 针对每个会话的模型/思考/快速/详细/追踪/推理覆盖项（`sessions.list`, `sessions.patch`）
- Dreams：Dreaming 状态、启用/禁用切换，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力上限（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + 为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：带验证地应用 + 重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对提交配置负载中的活跃 SecretRef 解析进行预检；若提交的活跃引用中有未解析项，会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照可以安全地进行原始往返时，Raw JSON 编辑器才可用
- 如果某个快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并对该快照禁用 Raw 模式
- Raw JSON 编辑器中的 “Reset to saved” 会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染一个扁平化快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式呈现，以防意外把对象破坏成字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：带筛选/导出的 gateway 文件日志实时 tail（`logs.tail`）
- 更新：运行包/git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，投递方式默认为公告摘要。如果你希望仅内部运行，可以切换为 none。
- 选择 announce 时，会显示 channel/target 字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式为 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖，以及尽力投递切换。
- 表单验证为内联字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；若省略，webhook 将在不带认证头的情况下发送。
- 已弃用的回退方式：带有 `notify: true` 的旧版已存储作业在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应会通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断较长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手/生成的图片会作为托管媒体引用持久化，并通过经过认证的 Gateway 媒体 URL 返回，因此重新加载时不依赖原始 base64 图像负载仍保留在聊天历史响应中。
- `chat.history` 还会从可见的助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并去除泄露的 ASCII/全角模型控制 token；同时省略那些其全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录附加一条助手备注，并广播一个 `chat` 事件，用于仅 UI 更新（不会触发智能体运行，也不会投递到渠道）。
- 聊天头部中的模型和思考选择器会通过 `sessions.patch` 立即更新当前活跃会话；它们是持久的会话覆盖项，而不是仅对单轮发送生效的选项。
- Talk 模式使用已注册的实时语音提供商。请将 OpenAI 配置为 `talk.provider: "openai"` 并设置 `talk.providers.openai.apiKey`，或复用 Voice Call 的实时提供商配置。浏览器永远不会接收到标准 OpenAI API key；它只会收到临时的 Realtime 客户端密钥。Realtime 会话提示词由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在 Chat 输入框中，Talk 控件是麦克风听写按钮旁边的波形按钮。当 Talk 启动时，输入框状态行会显示 `Connecting Talk...`，然后在音频连接时显示 `Talk live`，或在实时工具调用通过 `chat.send` 咨询已配置的更大型模型时显示 `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某次运行处于活跃状态时，普通后续消息会进入队列。点击排队消息上的 **Steer** 可将该后续消息注入当前运行轮次。
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`），用于中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍可在 UI 中显示
  - 当存在缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录使用方区分中止部分与正常完成输出

## 托管嵌入

助手消息可以通过 `[embed ...]` 简码内联渲染托管网页内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏/小部件
- `trusted`：在 `allow-scripts` 基础上额外添加 `allow-same-origin`，用于那些确实需要更强权限的同站文档

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

只有在嵌入文档确实需要 same-origin 行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 反向代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份头
（`tailscale-user-login`）进行认证。OpenClaw 会通过使用
`tailscale whois` 解析 `x-forwarded-for` 地址并将其与该头匹配来验证身份，并且仅当请求命中 loopback 且携带 Tailscale 的 `x-forwarded-*` 头时才接受这些头。如果你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于这一路异步 Serve 身份路径，来自同一客户端 IP 和认证作用域的失败认证尝试会在写入速率限制之前被串行化。因此，来自同一浏览器的并发错误重试在第二个请求上可能显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 认证假定 gateway 主机是受信任的。如果该主机上可能运行不受信任的本地代码，请要求 token/密码认证。

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
浏览器会在**非安全上下文**中运行，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档记录的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的操作员 Control UI 认证
- 紧急破窗模式 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

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

- 它允许 localhost 的 Control UI 会话在非安全 HTTP 上下文中在没有设备身份的情况下继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急破窗：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 的设备身份检查，是一次严重的安全降级。紧急使用后请尽快恢复。

受信任代理说明：

- 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有设备身份的情况下接入
- 这**不**适用于节点角色的 Control UI 会话
- 同主机 loopback 反向代理仍然不能满足 trusted-proxy 认证；请参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 使用严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（对协议内负载很有用）。
- 由渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助函数中被移除，并替换为内置 logo/badge，因此即使某个渠道被攻陷或是恶意的，也无法强制操作员浏览器发起任意远程图片请求。

你无需做任何更改即可获得此行为——它始终开启，且不可配置。

## 头像路由认证

配置了 gateway 认证后，Control UI 的头像端点需要与 API 其余部分相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与同级的 assistant-media 路由一致）。这可以防止头像路由在原本受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 gateway token 作为 bearer 头转发，并使用已认证的 blob URL，因此图片仍然可以在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），那么头像路由也会像 gateway 的其余部分一样变为无需认证。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base 路径（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以与 HTTP 源不同。当你想在本地运行 Vite 开发服务器，而 Gateway 网关运行在其他地方时，这会很方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后保存到 `localStorage` 中，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这样可避免请求日志和 Referer 泄露。为兼容性起见，旧版 `?token=` 查询参数仍会被一次性导入，但仅作为回退方式，并会在引导后立即移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶级窗口中接受（非嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整源）。这包括远程开发配置。
- 除了严格受控的本地测试外，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  这表示允许任意浏览器源，而不是“匹配我正在使用的任何主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 头源回退模式，但这是危险的安全模式。

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

远程访问设置详情： [Remote access](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — gateway 健康监控
