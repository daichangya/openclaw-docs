---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
summary: 用于 Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-25T17:12:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个小型的 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个 token 和所选的 gateway URL；不会持久化保存密码。新手引导通常会在首次连接时为共享密钥身份验证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码身份验证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你位于同一个 Tailnet 上并设置了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准该设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在重试配对时更改了身份验证详情（角色/作用域/公钥），之前待处理的请求会被替代，并创建一个新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其权限从只读访问更改为写入/admin 访问，这会被视为一次批准升级，而不是静默重连。OpenClaw 会保持旧批准继续有效，阻止更高权限的重新连接，并要求你显式批准新的作用域集合。

批准后，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要再次批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

**注意：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- Tailnet 和局域网浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器区分的个人身份（显示名称和头像），用于在共享会话中为发出的消息附加归属信息。它保存在浏览器存储中，仅限当前浏览器配置文件使用，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送的消息中正常的转录作者元数据之外。清除站点数据或切换浏览器后，它会重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 gateway 解析出的身份，且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 gateways 或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `__/openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 接口相同的 gateway 身份验证保护：未通过身份验证的浏览器无法获取它；成功获取需要已有有效的 gateway token/密码、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境自动本地化。若要稍后覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不是在 Appearance 下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在以后访问时重复使用。
- 缺失的翻译键会回退到英语。

## 它目前能做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime。Gateway 网关会使用 `talk.realtime.session` 签发一个短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送到 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回更大、已配置的 OpenClaw 模型。
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 按会话设置模型/思考/快速/详细/追踪/推理覆盖（`sessions.list`, `sessions.patch`）
- Dreams：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力上限（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + `exec host=gateway/node` 的请求策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：带验证地应用 + 重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 防护，以防止覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对提交的配置负载中的活跃 SecretRef 解析进行预检；未解析的活跃已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照可以安全进行原始往返时，才提供原始 JSON 编辑器
- 如果某个快照无法安全地进行原始文本往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式
- 原始 JSON 编辑器中的“Reset to saved”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染为扁平化快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象损坏为字符串
- 调试：状态/健康检查/模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：gateway 文件日志的实时追踪，支持过滤/导出（`logs.tail`）
- 更新：执行 package/git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，默认投递方式为公告摘要。如果你希望仅内部运行，可以切换为 none。
- 选择 announce 时会显示渠道/目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖，以及尽力投递切换。
- 表单验证为内联方式，并带有字段级错误；无效值会禁用保存按钮，直到修复为止。
- 设置 `cron.webhookToken` 以发送专用 bearer token；如果省略，则 webhook 会在不带身份验证标头的情况下发送。
- 已弃用的回退方式：存储的旧版作业如果使用 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞的**：它会立即确认并返回 `{ runId, status: "started" }`，随后响应会通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断较长的文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手/生成的图像会作为托管媒体引用持久化，并通过经过身份验证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖于聊天历史响应中是否仍保留原始 base64 图像负载。
- `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并移除泄露的 ASCII/全角模型控制 token；同时会省略那些全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会保持本地乐观用户/助手消息可见；一旦 Gateway 网关历史追上，这些本地消息就会被规范转录替换。
- `chat.inject` 会将一条助手备注追加到会话转录中，并广播一个 `chat` 事件用于仅 UI 的更新（不运行智能体、不投递到渠道）。
- 聊天页眉中的模型和思考选择器会通过 `sessions.patch` 立即修补当前活跃会话；它们是持久化的会话覆盖，而不是仅单轮生效的发送选项。
- 当新的 Gateway 网关会话使用情况报告显示上下文压力较高时，聊天编辑区会显示上下文提示，并且在建议压缩级别下，会显示一个 compact 按钮来运行正常的会话压缩路径。过期的 token 快照会被隐藏，直到 Gateway 网关再次报告新的使用情况。
- Talk 模式使用已注册的实时语音提供商，该提供商支持浏览器 WebRTC 会话。请使用 `talk.provider: "openai"` 并配置 `talk.providers.openai.apiKey`，或者复用 Voice Call 实时提供商配置。浏览器绝不会收到标准 OpenAI API 密钥；它只会收到临时的 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet 桥接，但目前尚不支持此浏览器 WebRTC 路径。Realtime 会话提示词由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在聊天编辑器中，Talk 控件是麦克风听写按钮旁边的波浪按钮。Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，而当实时工具调用通过 `chat.send` 咨询已配置的更大 OpenClaw 模型时，则显示 `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某个运行处于活跃状态时，普通后续消息会进入队列。点击排队消息上的 **Steer**，可将该后续消息注入当前运行中的轮次。
  - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当某个运行被中止时，部分助手文本仍可能显示在 UI 中
  - 当存在缓冲输出时，Gateway 网关会将被中止的部分助手文本持久化到转录历史中
  - 持久化条目会包含中止元数据，以便转录使用者区分中止产生的部分内容与正常完成输出

## PWA 安装和 Web Push

Control UI 附带了一个 `manifest.webmanifest` 和一个 service worker，因此现代浏览器可以将其安装为独立的 PWA。Web Push 允许 Gateway 网关在标签页或浏览器窗口未打开时，通过通知唤醒已安装的 PWA。

| 界面 | 作用 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA 清单。浏览器一旦可以访问它，就会提供“Install app”。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于对 Web Push 负载签名。 |
| `push/web-push-subscriptions.json` | 持久化保存的浏览器订阅端点。 |

如果你希望固定密钥对（用于多主机部署、密钥轮换或测试），可以通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用以下受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前活跃的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除一个已注册的端点。
- `push.web.test` — 向调用者的订阅发送一条测试通知。

Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅 [配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动端配对。

## 托管嵌入

助手消息可以通过 `[embed ...]` 短代码内联渲染托管的网页内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏/小部件
- `trusted`：在 `allow-scripts` 的基础上再添加 `allow-same-origin`，用于有意需要更高权限的同站文档

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

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 为其做反向代理：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配来验证该身份，并且只有当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些身份验证。若你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP 和同一身份验证作用域的失败身份验证尝试会在写入速率限制前进行串行化。因此，同一浏览器的并发错误重试中，第二个请求可能会显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 身份验证假定 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token/密码身份验证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行，并阻止 WebCrypto。默认情况下，OpenClaw **会阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 通过 `gateway.controlUi.allowInsecureAuth=true` 启用的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的操作员 Control UI 身份验证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

`allowInsecureAuth` 只是一个本地兼容性开关：

- 它允许 localhost 上的 Control UI 会话在非安全 HTTP 上下文中在没有设备身份的情况下继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅用于紧急兜底：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 的设备身份检查，这是一次严重的安全降级。紧急使用后应尽快恢复。

受信任代理说明：

- 成功的 trusted-proxy 身份验证可以允许**操作员** Control UI 会话在没有设备身份的情况下接入
- 这**不**适用于 node 角色的 Control UI 会话
- 同主机 loopback 反向代理仍然不满足 trusted-proxy 身份验证；请参阅 [受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 采用了严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中的含义是：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染，包括那些需要身份验证、由 UI 获取并转换为本地 `blob:` URL 的头像路由。
- 内联 `data:image/...` URL 仍然可以渲染（这对于协议内负载很有用）。
- 由 Control UI 创建的本地 `blob:` URL 仍然可以渲染。
- 由渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置 logo/badge，因此即使某个渠道被入侵或是恶意的，也无法强制操作员浏览器去抓取任意远程图片。

你无需做任何更改即可获得此行为——它始终开启且不可配置。

## 头像路由身份验证

配置了 gateway 身份验证后，Control UI 头像端点要求使用与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已通过身份验证的调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 会在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的助手媒体路由一致）。这可以防止头像路由在本应受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 gateway token 作为 bearer 标头转发，并使用经过身份验证的 blob URL，因此图片仍然可以在仪表板中渲染。

如果你禁用了 gateway 身份验证（不建议在共享主机上这样做），则头像路由也会变为未认证状态，与 gateway 的其余部分保持一致。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

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

然后将 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev server + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标是可配置的，并且可以与 HTTP 源不同。当你希望本地运行 Vite dev server，但 Gateway 网关运行在其他地方时，这会很方便。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开类似如下的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性身份验证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注意：

- `gatewayUrl` 会在加载后存储到 `localStorage` 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为后备方案，并会在引导后立即被移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 后，UI 不会回退到配置或环境变量凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中被接受（不接受嵌入场景），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
- 除非是在严格受控的本地测试中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它表示允许任何浏览器 origin，而不是“匹配我当前使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头 origin 回退模式，但这是一种危险的安全模式。

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

- [仪表板](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
