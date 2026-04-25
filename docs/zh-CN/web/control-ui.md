---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
summary: 用于 Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-25T10:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个 token 和所选的 gateway URL；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你位于同一个 Tailnet 中，且设置了 `gateway.auth.allowTailscale: true`。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在认证详情发生变化后重试配对（角色/作用域/公钥），先前待处理的请求会被替代，并创建新的 `requestId`。请在批准前重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读访问更改为写入/管理员访问，这会被视为批准升级，而不是静默重新连接。OpenClaw 会保持旧批准仍然有效，阻止更高权限的重新连接，并要求你显式批准新的作用域集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 将其撤销，否则不会再次要求批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- Tailnet 和局域网浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器保存个人身份（显示名称和头像），并将其附加到发出的消息中，用于在共享会话中标注消息归属。它存储在浏览器存储中，限定于当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送消息时保留的常规转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

## 运行时配置端点

Control UI 会从 ` /__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 接口相同的 gateway 认证保护：未认证的浏览器无法获取它，而成功获取要求已有有效的 gateway token/密码，或具备 Tailscale Serve 身份，或具备 trusted-proxy 身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。若要稍后覆盖，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不是在 Appearance 下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

## 它现在可以做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 通过 WebRTC 直接从浏览器与 OpenAI Realtime 通信。Gateway 网关使用 `talk.realtime.session` 签发短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送给 OpenAI，并通过 `chat.send` 把 `openclaw_agent_consult` 工具调用中继回配置的更大 OpenClaw 模型
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 按会话设置模型/思考/快速/详细/追踪/推理覆盖项（`sessions.list`, `sessions.patch`）
- Dreams：dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：校验后应用并重启（`config.apply`），并唤醒最后一个活动会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对提交的配置负载中的活动 `SecretRef` 解析进行预检查；未解析的活动已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及在可用时的插件 + 渠道 schema）；仅当快照可以安全进行原始往返时，才提供原始 JSON 编辑器
- 如果某个快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式
- 原始 JSON 编辑器中的“Reset to saved”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全原始往返时，外部编辑在重置后仍可保留
- 结构化 `SecretRef` 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象破坏为字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：实时追踪 gateway 文件日志，并支持过滤/导出（`logs.tail`）
- 更新：运行包/git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，投递默认是公告摘要。如果你只想内部运行，可以切换为 none。
- 选择 announce 时会显示渠道/目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括 run 后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖，以及尽力投递切换。
- 表单校验为内联进行，并带有字段级错误；无效值会禁用保存按钮，直到修复为止。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 发送时不会包含认证标头。
- 已弃用的回退方式：存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断较长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手/生成的图像会作为受管媒体引用持久化，并通过经过认证的 Gateway 网关媒体 URL 再次提供，因此重新加载时不依赖聊天历史响应中保留原始 base64 图像负载。
- `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`，以及被截断的工具调用块）、以及泄露的 ASCII/全角模型控制 token，并省略那些全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- 在发送进行中以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会继续显示本地乐观的用户/助手消息；一旦 Gateway 网关历史追上，这些本地消息就会被规范转录替换。
- `chat.inject` 会向会话转录附加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不运行智能体、不投递到渠道）。
- 聊天头部中的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖项，而不是仅限单轮发送的选项。
- 当新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天编辑区会显示上下文提示，并在建议压缩级别下显示一个 compact 按钮，运行常规的会话压缩路径。过时的 token 快照会被隐藏，直到 Gateway 网关再次报告新鲜的用量数据。
- Talk 模式使用支持浏览器 WebRTC 会话的已注册实时语音提供商。可配置 OpenAI 为 `talk.provider: "openai"` 并设置 `talk.providers.openai.apiKey`，或复用 Voice Call realtime provider 配置。浏览器永远不会收到标准 OpenAI API 密钥；它只会收到临时 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet 桥接，但暂不支持此浏览器 WebRTC 路径。Realtime 会话提示由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在聊天编辑器中，Talk 控件是位于麦克风听写按钮旁边的波形按钮。当 Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，然后在音频连接期间显示 `Talk live`，或者在实时工具调用通过 `chat.send` 向配置的更大 OpenClaw 模型发起咨询时显示 `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某次运行处于活动状态时，普通后续消息会排队。点击已排队消息上的 **Steer** 可将该后续消息注入当前运行中的轮次。
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活动运行
- 中止后的部分内容保留：
  - 当某次运行被中止时，UI 中仍可显示部分助手文本
  - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中
  - 持久化条目会包含中止元数据，以便转录使用方区分中止的部分内容和正常完成输出

## PWA 安装和 Web Push

Control UI 附带 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立的 PWA。Web Push 允许 Gateway 网关在标签页或浏览器窗口未打开时，仍通过通知唤醒已安装的 PWA。

| Surface | 它的作用 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA 清单。浏览器一旦可以访问它，就会提供“Install app”。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于为 Web Push 负载签名。 |
| `push/web-push-subscriptions.json` | 持久化的浏览器订阅端点。 |

当你想固定密钥时（用于多主机部署、密钥轮换或测试），可以通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `mailto:openclaw@localhost`）

Control UI 使用以下按作用域受限的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` —— 获取当前激活的 VAPID 公钥。
- `push.web.subscribe` —— 注册一个 `endpoint` 以及 `keys.p256dh` / `keys.auth`。
- `push.web.unsubscribe` —— 移除已注册的端点。
- `push.web.test` —— 向调用方的订阅发送测试通知。

Web Push 独立于 iOS APNS 中继路径（有关基于中继的 push，请参阅 [Configuration](/zh-CN/gateway/configuration)），也独立于现有的 `push.test` 方法，后者面向原生移动端配对。

## 托管嵌入

助手消息可以使用 `[embed ...]` shortcode 内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常已足够支持自包含的浏览器游戏/小组件
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

只有当嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成的 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 使用 HTTPS 为其反向代理：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配来验证身份，并且只有当请求通过 Tailscale 的 `x-forwarded-*` 标头命中 loopback 时才接受这些标头。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"``。
对于该异步 Serve 身份路径，同一客户端 IP 和认证作用域的失败认证尝试会在写入限速状态前串行化。因此，同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不可信的本地代码，请要求 token / 密码认证。

### 绑定到 tailnet + token
__OC_I18N_900003__
然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外情况：

- 仅 localhost 的不安全 HTTP 兼容模式，设置 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的 operator Control UI 认证
- 应急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve），或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

**不安全认证开关行为：**
__OC_I18N_900004__
`allowInsecureAuth` 只是一个本地兼容性开关：

- 它允许 localhost 的 Control UI 会话在非安全 HTTP 上下文中无设备身份继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限应急使用：**
__OC_I18N_900005__
`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。应在紧急使用后尽快恢复原状。

trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以允许**operator** Control UI 会话在没有设备身份的情况下接入
- 这**不**适用于 node-role 的 Control UI 会话
- 同主机上的 loopback 反向代理仍不满足 trusted-proxy 认证；请参阅 [Trusted proxy auth](/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参阅 [Tailscale](/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络请求。

这在实际中的含义：

- 在相对路径下提供的头像和图像（例如 `/avatars/<id>`）仍会渲染，包括需要认证的头像路由；UI 会获取它们并将其转换为本地 `blob:` URL。
- 内联 `data:image/...` URL 仍会渲染（这对协议内负载很有用）。
- 由 Control UI 创建的本地 `blob:` URL 仍会渲染。
- 渠道元数据产生的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置 logo / badge，因此即使渠道被入侵或是恶意的，也无法强迫 operator 浏览器发起任意远程图片请求。

你无需进行任何更改即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

当配置了 gateway 认证时，Control UI 头像端点需要与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证的调用方返回头像图像。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可防止头像路由在其他方面已受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会把 gateway token 作为 bearer 标头转发，并使用经过认证的 blob URL，因此图像仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会与 gateway 的其他部分一样变为未认证。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：
__OC_I18N_900006__
可选的绝对 base（当你想使用固定资源 URL 时）：
__OC_I18N_900007__
用于本地开发（单独的开发服务器）：
__OC_I18N_900008__
然后将 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你想在本地运行 Vite 开发服务器，但 Gateway 网关运行在其他地方时，这会很方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：
__OC_I18N_900009__
可选的一次性认证（如需要）：
__OC_I18N_900010__
说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，因此可以避免请求日志和 Referer 泄露。为了兼容性，旧版 `?token=` 查询参数仍会被导入一次，但仅作为回退，并会在启动后立即移除。
- `password` 仅保存在内存中。
- 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。
  需要显式提供 `token`（或 `password`）。如果缺少显式凭证，则会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- 为防止点击劫持，`gatewayUrl` 仅在顶级窗口中被接受（非嵌入式）。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程开发设置。
- 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  这表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 标头 origin 回退模式，但这是危险的安全模式。

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
