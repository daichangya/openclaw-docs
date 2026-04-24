---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
summary: 用于 Gateway 网关的基于浏览器的控制界面（聊天、节点、配置）
title: 控制界面
x-i18n:
    generated_at: "2026-04-24T02:37:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: edf6beb9c485720b6811d9d348bbb4752cf6aae929a9fbc62fc8c4770e762490
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个 token 和所选的 gateway URL；不会持久化保存密码。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可使用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你位于同一个 Tailnet 中，且设置了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器使用变更后的认证详情（角色 / scopes / 公钥）重试配对，之前的待处理请求会被替代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你将其权限从只读更改为写入 / 管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保留旧批准的有效状态，阻止更宽权限的重连，并要求你显式批准新的权限范围集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

**注意：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器分别设置个人身份（显示名称和头像），该身份会附加到发出的消息上，用于共享会话中的归属标识。它保存在浏览器存储中，仅限当前浏览器配置文件使用，不会同步到其他设备，也不会在服务端持久化保存，除了你实际发送的消息中正常的对话记录作者元数据。清除站点数据或切换浏览器会将其重置为空。

## 运行时配置端点

Control UI 会从 `\/__openclaw/control-ui-config.json` 获取其运行时设置。该端点与其他 HTTP 接口一样受相同的 gateway 认证保护：未认证的浏览器无法获取它，成功获取需要已有效的 gateway token / password、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器区域设置进行本地化。若要稍后覆盖，请打开 **Overview -> Gateway Access -> Language**。区域设置选择器位于 Gateway Access 卡片中，而不在 Appearance 下。

- 支持的区域设置：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英文翻译会在浏览器中按需懒加载。
- 所选区域设置会保存在浏览器存储中，并在之后访问时重复使用。
- 缺失的翻译键会回退到英文。

## 它目前能做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime。Gateway 网关使用 `talk.realtime.session` 签发短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送给 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回更大、已配置的 OpenClaw 模型。
- 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部插件渠道的状态、QR 登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线状态列表 + 刷新（`system-presence`）
- 会话：列表 + 按会话设置模型 / thinking / fast / verbose / trace / reasoning 覆盖项（`sessions.list`, `sessions.patch`）
- Dreams：Dreaming 状态、启用 / 禁用切换，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力上限（`node.list`）
- Exec 批准：编辑 gateway 或节点 allowlists + 为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：带验证地应用并重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会预检已提交配置负载中引用的活动 SecretRef 解析；未解析的活动已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象 / wildcard / 数组 / 组合节点上的文档元数据，以及在可用时的插件 + 渠道 schema）；仅当快照具备安全的原始往返能力时，才提供原始 JSON 编辑器
- 如果某个快照无法安全地进行原始文本往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式
- 原始 JSON 编辑器中的“Reset to saved”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化后的快照，因此在快照可安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象破坏性地转换为字符串
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：实时 tail gateway 文件日志，并支持过滤 / 导出（`logs.tail`）
- 更新：运行包 / git 更新并重启（`update.run`），附带重启报告

Cron 作业面板说明：

- 对于隔离作业，默认投递方式为公告摘要。如果你希望仅限内部运行，可以切换为 none。
- 选择 announce 时会显示 channel / target 字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖项、cron 精确 / 错开选项、智能体 model / thinking 覆盖项，以及尽力投递切换项。
- 表单验证为内联验证，并带有字段级错误；在修复之前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；若省略，则 webhook 发送时不带 auth 标头。
- 已弃用的回退：带有 `notify: true` 的旧版已存储作业在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，如果仍在运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当对话记录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手 / 生成的图像会作为受管媒体引用持久化，并通过已认证的 Gateway 媒体 URL 返回，因此重新加载不依赖聊天记录响应中原始 base64 图像负载继续存在。
- `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、以及泄露的 ASCII / 全角模型控制 token，并省略那些整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话对话记录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不运行智能体，不投递到渠道）。
- 聊天头部中的 model 和 thinking 选择器会立即通过 `sessions.patch` 修补当前活动会话；它们是持久的会话覆盖项，而不是仅单轮发送选项。
- 通话模式使用已注册的实时语音提供商。请使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey` 配置 OpenAI，或者复用 Voice Call 实时提供商配置。浏览器永远不会收到标准 OpenAI API key；它只会收到临时 Realtime 客户端密钥。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某次运行处于活跃状态时，普通后续消息会排队。点击已排队消息上的 **Steer** 可将该后续消息注入当前运行轮次。
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）来中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍可能显示在 UI 中
  - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到对话记录历史中
  - 持久化条目包含中止元数据，因此对话记录消费者可以将中止的部分内容与正常完成输出区分开来

## 托管嵌入

助手消息可以通过 `[embed ...]` 短代码内联渲染托管的网页内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏 / 小部件
- `trusted`：在 `allow-scripts` 之外再添加 `allow-same-origin`，用于有意需要更高权限的同站文档

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

仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成的 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 使用 HTTPS 为其提供代理：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且仅当请求通过 Tailscale 的 `x-forwarded-*` 标头命中 loopback 时才接受这些标头。如果你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"``。
对于该异步 Serve 身份路径，来自同一客户端 IP 和认证范围的失败认证尝试会在写入速率限制之前被串行化。因此，同一浏览器发起的并发错误重试在第二个请求上可能会显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 认证。

### 绑定到 tailnet + token
__OC_I18N_900003__
然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过明文 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档说明的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行 operator Control UI 认证
- 紧急兜底模式 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve），或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

**不安全认证开关行为：**
__OC_I18N_900004__
`allowInsecureAuth` 只是本地兼容性开关：

- 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无设备身份继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急兜底：**
__OC_I18N_900005__
`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是严重的安全降级。紧急使用后请尽快恢复。

trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以允许**operator** Control UI 会话在无设备身份的情况下接入
- 这**不**适用于 node-role Control UI 会话
- 同主机上的 loopback 反向代理仍然不能满足 trusted-proxy 认证；请参阅 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参阅 [Tailscale](/gateway/tailscale)。

## 内容安全策略

Control UI 使用了严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，也不会发起网络请求。

这在实际中的含义是：

- 在相对路径下提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（适用于协议内负载）。
- 由渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置 logo / badge，因此被攻陷或恶意的渠道无法强制 operator 浏览器发起任意远程图片请求。

你无需做任何改动即可获得此行为——它始终开启，且不可配置。

## 头像路由认证

配置了 gateway 认证后，Control UI 头像端点需要与 API 其余部分相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由一致）。这可以防止头像路由在原本受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会以 bearer 标头转发 gateway token，并使用已认证的 blob URL，因此图片仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会变为无需认证，这与 gateway 的其余部分保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件服务。使用以下命令构建：
__OC_I18N_900006__
可选的绝对 base 路径（当你希望使用固定资源 URL 时）：
__OC_I18N_900007__
用于本地开发（独立开发服务器）：
__OC_I18N_900008__
然后将 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：开发服务器 + 远程 Gateway

Control UI 是静态文件；WebSocket 目标是可配置的，并且可以不同于 HTTP 源。当你希望本地运行 Vite 开发服务器，而 Gateway 运行在其他地方时，这会非常方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：
__OC_I18N_900009__
可选的一次性认证（如果需要）：
__OC_I18N_900010__
说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。为了兼容性，旧版 `?token=` 查询参数仍会被一次性导入，但仅作为后备方案，并会在引导后立即移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不可嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
- 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器 origin，而不是“匹配我当前使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头 origin 回退模式，但这是危险的安全模式。

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

远程访问设置详情：[Remote access](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — gateway 健康监控
