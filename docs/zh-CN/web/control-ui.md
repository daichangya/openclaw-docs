---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下通过 Tailnet 访问
sidebarTitle: Control UI
summary: Gateway 网关 的基于浏览器的 Control UI（聊天、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-04-27T09:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062128bc66e63b768f4088a935a8850ce3c61e6c431ee5ef0567e5a93d579878
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关 提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关 运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份请求头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份请求头

仪表板设置面板会为当前浏览器标签页会话保存 token 和所选的 gateway URL；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关 通常会要求进行**一次性配对批准**。这是一项安全措施，用于防止未经授权的访问。

**你会看到的内容：** “disconnected (1008): pairing required”

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

如果浏览器在认证详情发生变化（角色/作用域/公钥）后重试配对，之前的待处理请求会被替换，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将它从只读访问更改为写入/管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准仍然有效，阻止更宽泛权限的重连，并要求你显式批准新的作用域集合。

一旦批准，该设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要再次批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动获批。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份校验通过且浏览器出示其设备身份时，Tailscale Serve 可以为 Control UI 操作员会话跳过配对往返过程。
- 直接 Tailnet 绑定、LAN 浏览器连接以及没有设备身份的浏览器配置文件，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。
</Note>

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置个人身份（显示名称和头像），它会附加到发出的消息上，以便在共享会话中标注归属。它存储在浏览器存储中，作用域限于当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久化；只有你实际发送的消息，其正常转录作者元数据会保留下来。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 gateway 解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 gateway 或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 接口相同的 gateway 认证保护：未经认证的浏览器无法获取它，而成功获取需要已有效的 gateway token/密码、Tailscale Serve 身份或受信任代理身份之一。

## 语言支持

Control UI 可在首次加载时根据你的浏览器语言环境进行本地化。若之后要覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不是 Appearance 下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中按需延迟加载。
- 选定的语言环境会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可执行的操作

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime 进行 Talk。Gateway 网关 使用 `talk.realtime.session` 签发短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送到 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回去，以供已配置的更大型 OpenClaw 模型处理。
    - 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）。
  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）。
    - 实例：在线列表和刷新（`system-presence`）。
    - 会话：列出会话，以及按会话覆盖模型/thinking/fast/verbose/trace/reasoning（`sessions.list`, `sessions.patch`）。
    - Dreaming：Dreaming 状态、启用/禁用开关，以及 Dream Diary 读取器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。
  </Accordion>
  <Accordion title="cron、Skills、节点、exec 批准">
    - cron 作业：列出/添加/编辑/运行/启用/禁用，以及运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表和能力（`node.list`）。
    - exec 批准：编辑 gateway 或节点 allowlist，并为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）。
  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）。
    - 带校验地应用并重启（`config.apply`），并唤醒最后一个活跃会话。
    - 写入包含 base-hash 保护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对已提交配置负载中的活跃 SecretRef 解析先进行预检；未解析的活跃已提交引用会在写入前被拒绝。
    - Schema 和表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及在可用时包含插件和渠道 schema）；仅当快照支持安全的原始往返时，原始 JSON 编辑器才可用。
    - 如果某个快照无法安全地往返原始文本，Control UI 会强制使用表单模式，并为该快照禁用原始模式。
    - 原始 JSON 编辑器中的“重置为已保存”会保留原始编写的形态（格式、注释、`$include` 布局），而不是重新渲染展平后的快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留。
    - 结构化 SecretRef 对象值会在表单文本输入框中以只读方式渲染，以防意外将对象损坏为字符串。
  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：Status/健康/Models 快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）。
    - 日志：实时跟踪 gateway 文件日志，并支持过滤/导出（`logs.tail`）。
    - 更新：运行 package/git 更新并重启（`update.run`），附带重启报告，然后在重连后轮询 `update.status` 以验证正在运行的 gateway 版本。
  </Accordion>
  <Accordion title="cron 作业面板说明">
    - 对于隔离作业，交付默认是公告摘要。如果你只想进行内部运行，也可以切换为 none。
    - 选择公告时，会显示渠道/目标字段。
    - webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，webhook 和 none 交付模式都可用。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错开选项、智能体模型/thinking 覆盖，以及尽力交付切换。
    - 表单校验会以内联方式显示字段级错误；在修复前，无效值会禁用保存按钮。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 将在不带认证请求头的情况下发送。
    - 已弃用的回退：已存储的旧版作业若使用 `notify: true`，在迁移前仍可使用 `cron.webhook`。
  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应会通过 `chat` 事件流式传输。
    - 聊天上传支持图片和非视频文件。图片保留原生图片路径；其他文件会存储为受管媒体，并在历史记录中显示为附件链接。
    - 使用相同 `idempotencyKey` 再次发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小上限。当转录条目过大时，Gateway 网关 可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
    - 助手生成的图片会作为受管媒体引用持久化，并通过已认证的 Gateway 网关 媒体 URL 返回，因此重新加载不依赖于聊天历史响应中保留原始 base64 图片负载。
    - `chat.history` 还会从可见助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄露的 ASCII/全角模型控制 token；并省略那些整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
    - 在发送进行中以及最终刷新历史期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会保持本地乐观的用户/助手消息可见；一旦 Gateway 网关 历史追上，规范转录就会替换这些本地消息。
    - `chat.inject` 会将一条助手注释追加到会话转录中，并广播一个 `chat` 事件用于仅 UI 的更新（不触发智能体运行，也不进行渠道投递）。
    - 聊天头部中的模型和 thinking 选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久的会话覆盖，而不是仅对单轮发送生效的选项。
    - 当新的 Gateway 网关 会话使用情况报告显示上下文压力较高时，聊天编辑区会显示上下文提示；在建议的压缩级别下，还会出现一个 compact 按钮，用于运行正常的会话压缩路径。在 Gateway 网关 再次报告新鲜使用情况之前，过时的 token 快照会被隐藏。
  </Accordion>
  <Accordion title="Talk 模式（浏览器 WebRTC）">
    Talk 模式使用已注册的实时语音提供商，该提供商支持浏览器 WebRTC 会话。可通过设置 `talk.provider: "openai"` 加上 `talk.providers.openai.apiKey` 来配置 OpenAI，或者复用 Voice Call 的实时提供商配置。浏览器绝不会收到标准的 OpenAI API key；它只会收到临时的 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet 桥接，但目前还不支持这个浏览器 WebRTC 路径。Realtime 会话提示词由 Gateway 网关 组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天编辑器中，Talk 控件是麦克风听写按钮旁边的波形按钮。Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用通过 `chat.send` 咨询已配置的更大 OpenClaw 模型时显示 `Asking OpenClaw...`。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **Stop**（调用 `chat.abort`）。
    - 当某个运行处于活跃状态时，普通后续消息会进入队列。点击排队消息上的 **Steer**，可将该后续消息注入到当前运行中的轮次。
    - 输入 `/stop`（或单独的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（不需要 `runId`）来中止该会话的所有活跃运行。
  </Accordion>
  <Accordion title="中止后的部分内容保留">
    - 当某个运行被中止时，UI 中仍可能显示部分助手文本。
    - 当存在缓冲输出时，Gateway 网关 会将被中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录使用方可以区分中止的部分内容和正常完成输出。
  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 附带了 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立的 PWA。Web Push 让 Gateway 网关 即使在标签页或浏览器窗口未打开时，也能通过通知唤醒已安装的 PWA。

| 界面 | 作用 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA manifest。浏览器在其可访问后会提供“安装应用”。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于对 Web Push 负载进行签名。 |
| `push/web-push-subscriptions.json` | 持久化的浏览器订阅端点。 |

当你希望固定密钥时（多主机部署、密钥轮换或测试），可通过 Gateway 网关 进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `mailto:openclaw@localhost`）

Control UI 使用这些带作用域限制的 Gateway 网关 方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前生效的 VAPID 公钥。
- `push.web.subscribe` — 注册 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 删除已注册的 endpoint。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS relay 路径（有关基于 relay 的推送，请参阅[配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者针对原生移动端配对。
</Note>

## 托管嵌入

助手消息可以通过 `[embed ...]` 简码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入内容中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 的基础上额外添加 `allow-same-origin`，用于那些确实需要更高权限的同站点文档。
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
仅当嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你有意让 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    让 Gateway 网关 保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份请求头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与请求头匹配来验证身份，并且只有当请求通过 Tailscale 的 `x-forwarded-*` 请求头命中 loopback 时才会接受这些请求。对于具有浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返过程；无设备浏览器和节点角色连接仍遵循正常设备检查。如果你希望即使对 Serve 流量也强制要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于这条异步 Serve 身份路径，来自同一客户端 IP 和认证作用域的失败认证尝试，在写入限流记录之前会被串行化处理。因此，同一浏览器发起的并发错误重试中，第二个请求可能会显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不可信的本地代码，请要求 token/密码认证。
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

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw **会阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 时，仅限 localhost 的不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的操作员 Control UI 认证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` 只是一个本地兼容性开关：

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中，在没有设备身份的情况下继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅用于紧急兜底">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是严重的安全降级。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="受信任代理说明">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有设备身份的情况下接入。
    - 这**不**适用于节点角色的 Control UI 会话。
    - 同主机 loopback 反向代理仍然不能满足 trusted-proxy 认证；请参阅[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。
  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 内置了严格的 `img-src` 策略：只允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络请求。

这在实际中的含义：

- 在相对路径下提供的头像和图片（例如 `/avatars/<id>`）仍然可以渲染，包括 UI 获取后转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍然可以渲染（适用于协议内负载）。
- 由 Control UI 创建的本地 `blob:` URL 仍然可以渲染。
- 由渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置 logo/badge，因此即使渠道已被攻破或是恶意的，也无法强迫操作员浏览器发起任意远程图片请求。

你无需进行任何更改即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

当配置了 gateway 认证时，Control UI 头像端点要求使用与 API 其余部分相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的助手媒体路由保持一致）。这可防止头像路由在其他部分受保护的主机上泄露智能体身份。
- Control UI 自身在获取头像时，会将 gateway token 作为 bearer 请求头转发，并使用已认证的 blob URL，因此图片仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会与 gateway 其余部分保持一致，变为未认证访问。

## 构建 UI

Gateway 网关 会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后让 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你希望在本地运行 Vite 开发服务器、但 Gateway 网关 运行在其他地方时，这非常有用。

<Steps>
  <Step title="启动 UI 开发服务器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    可选的一次性认证（如有需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储到 `localStorage` 中，并从 URL 中移除。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。为兼容旧方式，仍会一次性导入旧版 `?token=` 查询参数，但仅作为回退，并会在启动后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境变量凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
    - 当 Gateway 网关 位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
    - 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
    - Gateway 网关 启动时可能会根据实际运行时绑定和端口预填充本地 origin，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器 origin 仍然需要显式条目。
    - 除非是在严格受控的本地测试中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 请求头 origin 回退模式，但这是一种危险的安全模式。
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

## 相关

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
