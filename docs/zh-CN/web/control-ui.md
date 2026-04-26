---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下通过 Tailnet 访问
sidebarTitle: Control UI
summary: 用于 Gateway 网关的浏览器控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-26T07:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e7828a71cd04d40858d879e19f7436db6168c0cffab91a1591dfad93e25762d
    source_path: web/control-ui.md
    workflow: 15
---

控制 UI 是一个小型的 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会**直接通过同一端口连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份头

仪表板设置面板会为当前浏览器标签页会话和所选 gateway URL 保存一个 token；password 不会被持久化。首次连接时，新手引导通常会为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用 password 认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关要求进行**一次性配对批准**——即使你位于相同的 Tailnet 中且 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未授权访问。

**你会看到：** “已断开连接（1008）：需要配对”

<Steps>
  <Step title="列出待处理请求">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="按请求 ID 批准">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果浏览器使用已更改的认证详情（角色/作用域/公钥）重试配对，先前的待处理请求会被替换，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读访问更改为写入/管理员访问，这会被视为审批升级，而不是静默重连。OpenClaw 会保持旧审批处于活动状态，阻止更宽泛的重连，并要求你显式批准新的作用域集合。

一旦获得批准，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销，否则不会再次要求重新批准。有关 token 轮换和撤销，请参见 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。
</Note>

## 个人身份（浏览器本地）

控制 UI 支持按浏览器设置个人身份（显示名称和头像），并将其附加到出站消息中，以便在共享会话中进行归因。它存储在浏览器存储中，作用域仅限当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，超出你实际发送消息上的常规转录作者元数据范围。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 gateway 解析出的身份，绝不会通过 `config.patch` 往返。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 gateway 或自定义仪表板）。

## 运行时配置端点

控制 UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 表面相同的 gateway 认证保护：未认证的浏览器无法获取它，成功获取需要已有有效的 gateway token/password、Tailscale Serve 身份或受信任代理身份之一。

## 语言支持

控制 UI 可在首次加载时根据你的浏览器语言环境进行本地化。若要稍后覆盖，请打开**概览 -> Gateway Access -> 语言**。语言选择器位于 Gateway Access 卡片中，而不在外观下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退为英文。

## 当前可执行的操作

<AccordionGroup>
  <Accordion title="聊天和通话">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 通过 WebRTC 直接在浏览器中与 OpenAI Realtime 通话。Gateway 网关使用 `talk.realtime.session` 生成一个短期 Realtime 客户端密钥；浏览器将麦克风音频直接发送到 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回去，用于已配置的更大 OpenClaw 模型。
    - 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）。
  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置以及内置/外部插件渠道状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 实例：在线状态列表 + 刷新（`system-presence`）。
    - 会话：列表 + 按会话设置模型/思考/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。
    - Dreams：Dreaming 状态、启用/禁用开关以及 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。
  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表 + 能力上限（`node.list`）。
    - Exec 批准：编辑 gateway 或节点允许列表 + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）。
  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 带验证的应用 + 重启（`config.apply`），并唤醒最后一个活动会话。
    - 写入包含 base-hash 守卫，以防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交配置负载中的引用执行活动 SecretRef 解析预检；未解析的活动提交引用会在写入前被拒绝。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及在可用时的插件 + 渠道 schema）；仅当快照支持安全的原始往返时才提供原始 JSON 编辑器。
    - 如果某个快照无法安全地进行原始往返，控制 UI 会强制使用表单模式，并对该快照禁用原始模式。
    - 原始 JSON 编辑器中的“重置为已保存”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可安全往返时，外部编辑在重置后仍会保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式呈现，以防止对象被意外转换为字符串而损坏。
  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 日志：带过滤/导出的 gateway 文件日志实时 tail（`logs.tail`）。
    - 更新：运行包/git 更新 + 重启（`update.run`），并附带重启报告。
  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认是公告摘要。如果你希望仅供内部运行，可以切换为 none。
    - 选择 announce 时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可使用 webhook 和 none 投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖，以及尽力投递切换。
    - 表单验证是行内的，并带有字段级错误；在修复前，无效值会禁用保存按钮。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 发送时不会带认证头。
    - 已弃用回退：存储的遗留作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。
  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞的**：它会立即以 `{ runId, status: "started" }` 确认，响应会通过 `chat` 事件流式返回。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - `chat.history` 响应为了 UI 安全而有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换过大的消息（`[chat.history omitted: message too large]`）。
    - 助手/生成的图片会作为托管媒体引用持久化，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片负载持续保留在聊天历史响应中。
    - `chat.history` 还会从可见助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并省略整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目，同时移除泄露的 ASCII/全角模型控制 token。
    - 在发送进行中以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会保持本地乐观用户/助手消息可见；一旦 Gateway 网关历史追上，这些本地消息就会被规范转录替换。
    - `chat.inject` 会向会话转录附加一条助手注释，并广播一个 `chat` 事件用于仅 UI 更新（不触发智能体运行，也不进行渠道投递）。
    - 聊天头部的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖，而不是单轮发送选项。
    - 当最新的 Gateway 网关会话使用情况报告显示上下文压力较高时，聊天编辑区域会显示上下文提示，并在建议压缩级别时显示一个压缩按钮，运行正常的会话压缩路径。陈旧的 token 快照会被隐藏，直到 Gateway 网关再次报告最新使用情况。
  </Accordion>
  <Accordion title="通话模式（浏览器 WebRTC）">
    通话模式使用一个已注册的实时语音提供商，该提供商支持浏览器 WebRTC 会话。配置 OpenAI 时，请使用 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey`，或者复用 Voice Call 实时提供商配置。浏览器绝不会收到标准 OpenAI API key；它只会收到临时 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet 插件桥接，但暂不支持此浏览器 WebRTC 路径。Realtime 会话提示由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天编辑器中，Talk 控件是麦克风听写按钮旁边的波形按钮。当 Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用正通过 `chat.send` 咨询已配置的大模型时显示 `Asking OpenClaw...`。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 当某次运行处于活动状态时，普通后续消息会排队。点击队列消息上的**Steer**，可将该后续消息注入当前运行中的轮次。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）来中止该会话的所有活动运行。
  </Accordion>
  <Accordion title="中止时的部分内容保留">
    - 当某次运行被中止时，部分助手文本仍可在 UI 中显示。
    - 当存在缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录使用方可以区分中止的部分内容和正常完成输出。
  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

控制 UI 内置了一个 `manifest.webmanifest` 和一个 service worker，因此现代浏览器可以将其安装为独立的 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开也是如此。

| 表面 | 功能 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA 清单。浏览器一旦可以访问它，就会提供“安装应用”。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于签署 Web Push 负载。 |
| `push/web-push-subscriptions.json` | 持久化的浏览器订阅端点。 |

当你希望固定密钥时（例如多主机部署、密钥轮换或测试），可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `mailto:openclaw@localhost`）

控制 UI 使用以下受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前活动的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh` / `keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用者的订阅发送一条测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关基于中继的推送，请参见 [配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动配对。
</Note>

## 托管嵌入

助手消息可以通过 `[embed ...]` shortcode 内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以满足自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上再添加 `allow-same-origin`，用于那些确实需要更高权限的同站文档。
  </Tab>
</Tabs>

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

<Warning>
仅当嵌入文档确实需要 same-origin 行为时才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成 Tailscale Serve（首选）">
    让 Gateway 网关保持在 loopback 上，并由 Tailscale Serve 通过 HTTPS 代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI / WebSocket Serve 请求可以通过 Tailscale 身份头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并与该头进行匹配来验证身份，并且仅当请求携带 Tailscale 的 `x-forwarded-*` 头并命中 loopback 时才会接受这些头。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，来自同一客户端 IP 和认证作用域的失败认证尝试会在写入限流之前串行化。因此，同一浏览器的并发错误重试在第二个请求上可能显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求 token/password 认证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过明文 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的控制 UI 连接。

文档化的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员控制 UI 认证
- 紧急兜底开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

<AccordionGroup>
  <Accordion title="不安全认证开关行为">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` 仅是本地兼容性开关：

    - 它允许 localhost 控制 UI 会话在非安全 HTTP 上下文中无设备身份继续运行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限紧急兜底">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` 会禁用控制 UI 设备身份检查，这是一次严重的安全降级。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理说明">
    - 成功的受信任代理认证可以让**操作员**控制 UI 会话在没有设备身份的情况下接入。
    - 这**不适用于**节点角色控制 UI 会话。
    - 同主机 loopback 反向代理仍不满足受信任代理认证；请参见 [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。
  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

控制 UI 采用严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络获取。

这在实际中的含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可渲染，包括那些需要认证、由 UI 获取并转换为本地 `blob:` URL 的头像路由。
- 内联 `data:image/...` URL 仍可渲染（对协议内负载很有用）。
- 控制 UI 创建的本地 `blob:` URL 仍可渲染。
- 由渠道元数据发出的远程头像 URL 会在控制 UI 的头像辅助函数中被剥离，并替换为内置 logo/badge，因此受损或恶意渠道无法强制操作员浏览器获取任意远程图片。

你无需做任何更改即可获得此行为——它始终开启，且不可配置。

## 头像路由认证

当配置了 gateway 认证时，控制 UI 头像端点与其余 API 一样要求相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用者返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与同级 assistant-media 路由保持一致）。这可防止头像路由在原本受保护的主机上泄露智能体身份。
- 控制 UI 在获取头像时会将 gateway token 作为 bearer header 转发，并使用经过认证的 blob URL，因此图像仍能在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，与其余 gateway 保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev server + 远程 Gateway 网关

控制 UI 是静态文件；WebSocket 目标是可配置的，并且可以不同于 HTTP 源。这在你希望本地运行 Vite dev server、而 Gateway 网关运行在其他地方时非常有用。

<Steps>
  <Step title="启动 UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    可选的一次性认证（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储到 `localStorage` 中，并从 URL 中移除。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，因此可避免请求日志和 Referer 泄露。遗留的 `?token=` 查询参数仍会出于兼容性导入一次，但仅作为回退，并会在引导后立即移除。
    - `password` 仅保存在内存中。
    - 设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
    - 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不接受嵌入式窗口），以防止点击劫持。
    - 非 loopback 控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发配置。
    - Gateway 网关启动时可能会根据有效运行时绑定和端口，自动填入本地 origin，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器 origin 仍需要显式条目。
    - 除了严格受控的本地测试外，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器 origin，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host header origin 回退模式，但这是危险的安全模式。
  </Accordion>
</AccordionGroup>

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

远程访问设置详情：[远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [仪表板](/zh-CN/web/dashboard) — gateway 仪表板
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
