---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考，涵盖核心 OpenClaw 键名、默认值，以及指向各专用子系统参考文档的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-24T23:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94a945cbe0633c75e55b99324ae9174a7c82770b07bd773fe82f342f67c5a44c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若需按任务组织的概览，请参见 [Configuration](/zh-CN/gateway/configuration)。

本页介绍 OpenClaw 的主要配置面，并在某个子系统有自己更深入的参考文档时提供外部链接。它**不会**尝试在同一页内联列出每个渠道 / 插件自有的命令目录，也不会内联所有深层 memory / QMD 细项配置。

代码事实来源：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置 / 插件 / 渠道元数据
- `config.schema.lookup` 会返回单个按路径限定的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 面校验配置文档基线哈希

专门的深度参考文档：

- [Memory configuration reference](/zh-CN/reference/memory-config)，用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [Slash Commands](/zh-CN/tools/slash-commands)，用于查看当前内置 + 捆绑命令目录
- 各自所属的渠道 / 插件页面，用于查看渠道特定的命令面

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的——省略时，OpenClaw 会使用安全默认值。

---

## 渠道

每个渠道的配置键已移至独立页面——请参见
[Configuration — channels](/zh-CN/gateway/config-channels) 了解 `channels.*`，
其中包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 以及其他
内置渠道（凭证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已移至独立页面——请参见
[Configuration — agents](/zh-CN/gateway/config-agents) 了解：

- `agents.defaults.*`（工作区、模型、思考、心跳、memory、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由与绑定）
- `session.*`（会话生命周期、压缩、清理）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保留平台默认的停顿窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
提供商 / base-URL 设置已移至独立页面——请参见
[Configuration — tools and custom providers](/zh-CN/gateway/config-tools)。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅对内置 Skills 生效的可选允许列表（托管 / 工作区 Skills 不受影响）。
- `load.extraDirs`：额外的共享 Skills 根目录（优先级最低）。
- `install.preferBrew`：当为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install` 规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使某个 skill 已内置 / 安装，也会将其禁用。
- `entries.<skillKey>.apiKey`：为声明了主环境变量的 skill 提供的便捷字段（明文字符串或 SecretRef 对象）。

---

## 插件

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- 设备发现支持原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API 密钥便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改 prompt 的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子以及受支持的 bundle 提供的 hook 目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可从类型化钩子（如 `llm_input`、`llm_output` 和 `agent_end`）读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，使其可为后台子智能体运行请求逐次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅当你明确想允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（若可用，则由原生 OpenClaw 插件 schema 验证）。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API 密钥（接受 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主体内容（默认：`true`）。
  - `maxAgeMs`：缓存的最长保留时间（毫秒）（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间（秒）（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。阶段与阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整的 memory 配置位于 [Memory configuration reference](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件也可通过 `settings.json` 提供内嵌的 Pi 默认值；OpenClaw 会将其作为已清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择活动的 memory 插件 id，或设为 `"none"` 以禁用 memory 插件。
- `plugins.slots.contextEngine`：选择活动的 context engine 插件 id；默认值为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包括 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为托管状态；优先使用 CLI 命令，而不是手动编辑。

请参见 [Plugins](/zh-CN/tools/plugin)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 会禁用 `act:evaluate` 和 `wait --fn`。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未设置时处于禁用状态，因此默认会严格限制浏览器导航。
- 仅当你明确信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性 / 设备发现检查期间也会受到相同的私有网络拦截。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 添加显式例外。
- 远程配置文件为仅附加模式（禁用启动 / 停止 / 重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；
  当你的提供商直接提供 DevTools WebSocket URL 时，请使用 WS(S)。
- `existing-session` 配置文件使用 Chrome MCP 而非 CDP，可附加到所选主机上，或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可设置 `userDataDir`，以指定特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用 snapshot / ref 驱动的操作而非 CSS 选择器定位、单文件上传钩子、不支持对话框超时覆盖、不支持 `wait --load networkidle`，且不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景下显式设置 `cdpUrl`。
- 自动检测顺序：默认浏览器（若基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- 控制服务：仅限 loopback（端口从 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 会将额外启动标志附加到本地 Chromium 启动命令中（例如 `--disable-gpu`、窗口大小设置或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 外观的强调色（Talk 模式气泡色调等）。
- `assistant`：Control UI 身份覆盖。会回退到活动智能体身份。

---

## Gateway 网关

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认 false。
    allowRealIpFallback: false,
    tools: {
      // 对 /tools/invoke HTTP 的额外拒绝项
      deny: ["browser"],
      // 从默认 HTTP 拒绝列表中移除工具
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 网关字段详情">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：用于 WS + HTTP 的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：请在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关无法访问。请使用 `--network host`，或设置 `bind: "lan"`（或 `bind: "custom"` 并配合 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **凭证**：默认必须启用。非 loopback 的 bind 要求 Gateway 网关凭证。实际使用中，这意味着共享 token / password，或设置 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。新手引导向导默认会生成 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式将 `gateway.auth.mode` 设为 `token` 或 `password`。如果两者都已配置且 mode 未设置，启动以及服务安装 / 修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无凭证模式。仅用于受信任的本地 local loopback 设置；新手引导提示中不会提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将凭证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份头（见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求代理来源为**非 loopback**；同主机 loopback 反向代理不满足 trusted-proxy 凭证要求。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份头可满足 Control UI / WebSocket 凭证要求（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 头部凭证；它们仍遵循 Gateway 网关的常规 HTTP 凭证模式。当 `tailscale.mode = "serve"` 时，默认值为 `true`。这种无 token 流程假定 Gateway 网关主机是受信任的。
- `gateway.auth.rateLimit`：可选的凭证失败限流器。按客户端 IP 和凭证作用域应用（共享密钥和设备 token 分别独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径中，同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前串行化。因此，同一客户端并发发起的错误尝试可能会在第二个请求时触发限流，而不是两个请求都作为普通不匹配并发通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认是 `true`；如果你明确希望连 localhost 流量也受到限流（例如测试环境或严格代理部署），请设为 `false`。
- 来自浏览器来源的 WS 凭证尝试始终会启用限流，且不会豁免 loopback（作为对基于浏览器的 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些来自浏览器来源的锁定会按归一化后的 `Origin`
  值隔离，因此某个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开，需要凭证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。若预期浏览器客户端来自非 loopback 来源，则必须设置。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为刻意依赖 Host 头来源策略的部署启用基于 Host 头的来源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境变量中的紧急放开开关，允许对受信任私有网络 IP 使用明文 `ws://`；默认情况下，明文连接仍仅限 loopback。`openclaw.json` 中没有等价配置，且浏览器私有网络配置（例如 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`）不会影响 Gateway 网关 WebSocket 客户端。
- `gateway.remote.token` / `.password`：远程客户端凭证字段。它们本身不会配置 Gateway 网关凭证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs relay 的基础 HTTPS URL，供官方 / TestFlight iOS 构建在将基于 relay 的注册发布到 Gateway 网关后使用。此 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时时间（毫秒）。默认值为 `10000`。
- 基于 relay 的注册会委托给特定的 Gateway 网关身份。配对的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并将基于注册范围的发送授权转发给 Gateway 网关。其他 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：用于覆盖上述 relay 配置的临时环境变量。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅供开发使用的放开开关，允许 loopback HTTP relay URL。生产环境的 relay URL 应保持为 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔（分钟）。设为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧套接字阈值（分钟）。请保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道 / 账号在滚动一小时内的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：渠道级退出设置，用于在保留全局监控启用的情况下禁用健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的账号级覆盖。设置后，它的优先级高于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可将 `gateway.remote.*` 用作回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且无法解析，则解析会以失败关闭的方式处理（不会用远程回退来掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端头的反向代理 IP。仅列出你控制的代理。loopback 条目对同主机代理 / 本地检测设置仍然有效（例如 Tailscale Serve 或本地反向代理），但它们**不会**使 loopback 请求符合 `gateway.auth.mode: "trusted-proxy"` 的资格。
- `allowRealIpFallback`：当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以保持失败关闭行为。
- `gateway.tools.deny`：针对 HTTP `POST /tools/invoke` 额外阻止的工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和 / 或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 抓取。
- 可选的响应加固头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 来源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在同一主机上运行多个 Gateway 网关时，请使用唯一的端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`），`--profile <name>`（使用 `~/.openclaw-<name>`）。

请参见 [Multiple Gateways](/zh-CN/gateway/multiple-gateways)。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`：在 Gateway 网关监听器处启用 TLS 终止（HTTPS / WSS）（默认：`false`）。
- `autoGenerate`：当未配置显式文件时，自动生成本地自签名证书 / 密钥对；仅供本地 / 开发使用。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；请限制其权限。
- `caPath`：可选的 CA bundle 路径，用于客户端验证或自定义信任链。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`：控制如何在运行时应用配置编辑。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置变更时始终重启 Gateway 网关进程。
  - `"hot"`：在不重启的情况下于进程内应用更改。
  - `"hybrid"`（默认）：先尝试热重载；如有需要则回退为重启。
- `debounceMs`：应用配置变更前的防抖窗口（毫秒）（非负整数）。
- `deferralTimeoutMs`：在强制重启前等待进行中操作完成的最长时间（毫秒）（默认：`300000` = 5 分钟）。

---

## 钩子

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

凭证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
不接受查询字符串中的 hook token。

验证与安全说明：

- `hooks.enabled=true` 要求 `hooks.token` 为非空。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个 mapping 或 preset 使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态 mapping 键不需要此显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认：`false`）时，才接受请求负载中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染后的 mapping `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping 详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的某个负载字段。
- 类似 `{{messages[0].subject}}` 的模板会从负载中读取。
- `transform` 可以指向返回 hook action 的 JS / TS 模块。
  - `transform.module` 必须是相对路径，并且必须保持在 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
- `agentId` 会路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的 mapping 会话键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + mapping）的可选前缀允许列表，例如 `["hook:"]`。当任意 mapping 或 preset 使用模板化 `sessionKey` 时，它会成为必填项。
- `deliver: true` 会将最终回复发送到渠道；`channel` 默认为 `last`。
- `model` 会覆盖此次 hook 运行所用的 LLM（如果设置了模型目录，则该模型必须被允许）。

</Accordion>

### Gmail 集成

- 内置的 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并限制 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖 preset，而不是使用默认的模板值。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。如需禁用，请设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1`。
- 不要在 Gateway 网关之外单独运行 `gog gmail watch serve`。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 通过 Gateway 网关端口下的 HTTP 提供可由智能体编辑的 HTML / CSS / JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback bind：canvas 路由与其他 Gateway 网关 HTTP 面一样，需要 Gateway 网关凭证（token / password / trusted-proxy）。
- Node WebView 通常不会发送凭证头；在某个 node 完成配对并连接后，Gateway 网关会为 canvas / A2UI 访问发布 node 作用域的 capability URL。
- Capability URL 绑定到活动的 node WS 会话，并且很快过期。不使用基于 IP 的回退。
- 会将 live-reload 客户端注入到所提供的 HTML 中。
- 为空时会自动创建初始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对于大型目录或出现 `EMFILE` 错误时，请禁用 live reload。

---

## 设备发现

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认）：在 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 主机名默认为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。若要实现跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）和 Tailscale split DNS。

设置：`openclaw dns setup --apply`。

---

## 环境

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 仅当进程环境中缺少对应键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录下的 `.env` + `~/.openclaw/.env`（两者都不会覆盖已有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参见 [Environment](/zh-CN/help/environment)。

### 环境变量替换

可在任意配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失 / 为空的变量会在配置加载时报错。
- 若要输出字面量 `${VAR}`，请使用 `$${VAR}` 转义。
- 适用于 `$include`。

---

## Secrets

SecretRef 是增量特性：明文值仍然可用。

### `SecretRef`

使用以下对象结构之一：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 id 不得包含 `.` 或 `..` 的斜杠分隔路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证面

- 规范矩阵：[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 会定位到受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 中的 ref 也包含在运行时解析和审计覆盖范围内。

### Secret providers 配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

说明：

- `file` provider 支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须为 `"value"`）。
- 当无法验证 Windows ACL 时，file 和 exec provider 路径会以失败关闭方式处理。仅对无法验证但受信任的路径设置 `allowInsecurePath: true`。
- `exec` provider 要求 `command` 为绝对路径，并通过 stdin / stdout 使用协议负载。
- 默认情况下，会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时仍会验证解析后的目标路径。
- 如果配置了 `trustedDirs`，则受信任目录检查会应用到解析后的目标路径。
- 默认情况下，`exec` 子进程环境最小化；请通过 `passEnv` 显式传入所需变量。
- Secret ref 会在激活时解析为内存快照，之后请求路径只读取该快照。
- 激活期间会应用活动面过滤：已启用面的未解析 ref 会导致启动 / 重载失败，而未激活的面会跳过并附带诊断信息。

---

## 凭证存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 每个智能体的 profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级 ref（静态凭证模式下，`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- OAuth 模式的 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 提供支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会清理掉。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参见 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：请参见 [Secrets Management](/zh-CN/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`：当某个 profile 因真实的计费 / 余额不足错误而失败时使用的基础退避时间（小时）（默认：`5`）。即使响应为 `401` / `403`，显式的计费文本仍可能归入这里，但提供商特定的文本匹配器仍仅限于其所属提供商（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 用量窗口或 organization / workspace 支出上限消息则仍归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：按提供商覆盖计费退避小时数的可选配置。
- `billingMaxHours`：计费退避指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时间（分钟）（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动时间窗口（小时）（默认：`24`）。
- `overloadedProfileRotations`：对于过载错误，在切换到模型回退前，同一提供商 auth-profile 允许轮换的最大次数（默认：`1`）。像 `ModelNotReadyException` 这样的提供商忙碌形态归入此项。
- `overloadedBackoffMs`：重试过载的提供商 / profile 轮换前的固定延迟（毫秒）（默认：`0`）。
- `rateLimitedProfileRotations`：对于速率限制错误，在切换到模型回退前，同一提供商 auth-profile 允许轮换的最大次数（默认：`1`）。该速率限制桶包括提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 日志

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 可使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：在抑制写入前允许的最大日志文件大小（字节）（正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

---

## 诊断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`：instrumentation 输出的总开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持通配符，如 `"telegram.*"` 或 `"*"`）。
- `stuckSessionWarnMs`：当会话仍处于处理中状态时，发出卡住会话警告的时长阈值（毫秒）。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认：`false`）。
- `otel.endpoint`：OTel 导出的 collector URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP / gRPC 元数据头。
- `otel.serviceName`：资源属性中的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：trace 采样率，范围 `0`–`1`。
- `otel.flushIntervalMs`：周期性刷新 telemetry 的间隔（毫秒）。
- `otel.captureContent`：为 OTEL span 属性选择性启用原始内容捕获。默认关闭。布尔值 `true` 会捕获非 system 的消息 / 工具内容；对象形式可让你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `cacheTrace.enabled`：为嵌入式运行记录缓存追踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存追踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存追踪输出中包含的内容（默认全部为 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`：用于 npm / git 安装的发布渠道——`"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：稳定渠道自动应用前的最小延迟（小时）（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：稳定渠道额外的发布扩散时间窗口（小时）（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行频率（小时）（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全局 ACP 功能开关（默认：`false`）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认：`true`）。设为 `false` 可在阻止执行的同时保留 ACP 命令可用。
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
- `defaultAgent`：当 spawn 未指定显式目标时使用的 ACP 默认目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 允许列表；为空表示无额外限制。
- `maxConcurrentSessions`：同时处于活动状态的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷新窗口（毫秒）。
- `stream.maxChunkChars`：流式分块投影在拆分前允许的最大块大小。
- `stream.repeatSuppression`：每轮抑制重复的状态 / 工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 表示增量流式传输；`"final_only"` 表示缓冲到轮次终结事件后再输出。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后、可见文本前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的助手输出最大字符数。
- `stream.maxSessionUpdateChars`：ACP 状态 / 更新行投影的最大字符数。
- `stream.tagVisibility`：tag 名称到布尔可见性覆盖的记录，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话 worker 在符合清理条件前的空闲 TTL（分钟）。
- `runtime.installCommand`：在引导 ACP 运行时环境时运行的可选安装命令。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制 banner 标语样式：
  - `"random"`（默认）：轮换显示有趣 / 季节性标语。
  - `"default"`：固定中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍显示 banner 标题 / 版本）。
- 若要隐藏整个 banner（而不只是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## 向导

由 CLI 引导式设置流程（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## 身份

请参见 [Agent defaults](/zh-CN/gateway/config-agents#agent-defaults) 下 `agents.list` 的身份字段。

---

## Bridge protocol（旧版节点，历史参考）

当前构建已不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除之前验证会失败；`openclaw doctor --fix` 可移除未知键）。

<Accordion title="旧版 bridge 配置（历史参考）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`：在从 `sessions.json` 中清理之前，保留已完成隔离 cron 运行会话的时长。也控制已归档的已删除 cron transcript 的清理。默认：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在触发裁剪前的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志裁剪时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；若省略则不会发送凭证头。
- `webhook`：已弃用的旧版回退 webhook URL（http / https），仅用于仍具有 `notify: true` 的已存储任务。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`：一次性任务在瞬时错误下的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组（毫秒）（默认：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：触发重试的错误类型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则重试所有瞬时类型。

仅适用于一次性 cron 任务。周期性任务使用单独的失败处理机制。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：启用 cron 任务失败告警（默认：`false`）。
- `after`：连续失败多少次后触发告警（正整数，最小值：`1`）。
- `cooldownMs`：同一任务重复告警之间的最小间隔（毫秒）（非负整数）。
- `mode`：投递模式——`"announce"` 通过渠道消息发送；`"webhook"` 向已配置 webhook 发起 POST。
- `accountId`：可选的账号或渠道 id，用于限定告警投递范围。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 所有任务共享的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认值为 `"announce"`。
- `channel`：announce 投递的渠道覆盖。`"last"` 会复用上次已知的投递渠道。
- `to`：显式 announce 目标或 webhook URL。webhook 模式下必填。
- `accountId`：可选的投递账号覆盖。
- 每个任务的 `delivery.failureDestination` 会覆盖该全局默认值。
- 当既未设置全局失败目标，也未设置每个任务的失败目标时，已通过 `announce` 投递的任务在失败时会回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的任务，除非该任务的主 `delivery.mode` 为 `"webhook"`。

请参见 [Cron Jobs](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| Variable           | Description                          |
| ------------------ | ------------------------------------ |
| `{{Body}}`         | 完整的入站消息正文                   |
| `{{RawBody}}`      | 原始正文（无历史记录 / 发送者包装）  |
| `{{BodyStripped}}` | 去除群组提及后的正文                 |
| `{{From}}`         | 发送者标识符                         |
| `{{To}}`           | 目标标识符                           |
| `{{MessageSid}}`   | 渠道消息 id                          |
| `{{SessionId}}`    | 当前会话 UUID                        |
| `{{IsNewSession}}` | 新建会话时为 `"true"`                |
| `{{MediaUrl}}`     | 入站媒体伪 URL                       |
| `{{MediaPath}}`    | 本地媒体路径                         |
| `{{MediaType}}`    | 媒体类型（image / audio / document / …） |
| `{{Transcript}}`   | 音频转录文本                         |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示词           |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数       |
| `{{ChatType}}`     | `"direct"` 或 `"group"`              |
| `{{GroupSubject}}` | 群组主题（尽力而为）                 |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）             |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）           |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）           |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等） |

---

## 配置 includes（`$include`）

将配置拆分为多个文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单个文件：替换其所在的包含对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 includes 之后合并（覆盖被包含的值）。
- 嵌套 includes：最多支持 10 层深度。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录内（即 `openclaw.json` 的 `dirname`）。仅当绝对路径 / `../` 形式最终仍解析到该边界内时才允许。
- OpenClaw 自有写入在仅更改单个由单文件 include 支持的顶层 section 时，会直接写回该被包含文件。例如，`plugins install` 会更新 `plugins: { $include: "./plugins.json5" }` 中的 `plugins.json5`，并保持 `openclaw.json` 不变。
- 对于根 includes、include 数组，以及带同级覆盖的 includes，OpenClaw 自有写入是只读的；这些写入会以失败关闭方式处理，而不会将配置展平。
- 错误：对缺失文件、解析错误和循环 include 提供清晰消息。

---

_相关内容：[Configuration](/zh-CN/gateway/configuration) · [Configuration Examples](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [Configuration](/zh-CN/gateway/configuration)
- [Configuration examples](/zh-CN/gateway/configuration-examples)
