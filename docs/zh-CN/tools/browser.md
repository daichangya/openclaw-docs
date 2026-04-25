---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T06:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f529cbcc4e818a89274fd9fc25e46b3cc5b30913278d62652ee1100e8ae6dcef
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。  
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地控制服务进行管理（仅限 loopback）。

初学者视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的已登录 Chrome 会话。

## 你将获得的内容

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，它会在启用浏览器插件时教会智能体使用 snapshot、stable-tab、stale-ref 和 manual-blocker 恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你日常使用的主浏览器。  
它是一个安全、隔离的界面，用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启 Gateway 网关。

如果根本没有 `openclaw browser`，或者智能体提示浏览器工具不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。你可以禁用它，以便用另一个注册相同 `browser` 工具名称的插件替换它：

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

默认情况下需要同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。如果只禁用插件，会一次性移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保留，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指引

浏览器插件附带两级智能体指引：

- `browser` 工具描述承载了始终启用的精简契约：选择正确的配置文件、在同一标签页上保持 refs、使用 `tabId`/labels 进行标签页定位，并在进行多步骤工作时加载浏览器 skill。
- 内置的 `browser-automation` Skills 承载更长的操作循环：先检查状态/标签页，为任务标签页打标签，在操作前先做 snapshot，在 UI 变化后重新 snapshot，遇到 stale refs 时恢复一次，并将登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动操作，而不是猜测处理。

启用插件后，插件内置的 Skills 会显示在智能体的可用技能列表中。  
完整的技能说明按需加载，因此常规轮次不会承担完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 无法识别、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。请将它加上：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格——allowlist 决定插件是否加载，而工具策略只会在加载之后才生效。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于你的**真实已登录 Chrome** 会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想指定特定浏览器模式时，使用 `profile` 作为显式覆盖。

如果你想默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问场景下选择启用
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧的单配置文件覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认：true
      idleMinutes: 120, // 设为 0 以禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 以禁用每个会话的上限
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="端口与可达性">

- 控制服务绑定到 loopback，其端口由 `gateway.port` 派生（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让同一组中的派生端口一起偏移。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 场景下才需要设置这些值。未设置时，`cdpUrl` 默认使用受管本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。
- `tabCleanup` 是对主智能体浏览器会话所打开标签页的尽力清理机制。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话会保留活动标签页以便重复使用，然后在后台关闭空闲或超出数量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页会在导航前经过 SSRF 防护，并在事后对最终 `http(s)` URL 进行尽力复查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理由 OpenClaw 管理的浏览器。默认情况下，受管 Chrome 会直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- 如果要代理受管浏览器本身，请通过 `browser.extraArgs` 传入显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非你明确启用了私有网络浏览器访问，否则严格 SSRF 模式会阻止显式浏览器代理路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在你明确可信任私有网络浏览器访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 作为旧别名仍然受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已经运行时才进行附加。
- `headless` 可以在全局或每个本地受管配置文件上设置。每个配置文件的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个仍然可见。
- `executablePath` 可以在全局或每个本地受管配置文件上设置。每个配置文件的值会覆盖 `browser.executablePath`，因此不同的受管配置文件可以启动不同的 Chromium 内核浏览器。
- `color`（顶层和每个配置文件）会为浏览器 UI 着色，这样你可以看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管独立模式）。使用 `defaultProfile: "user"` 可切换为已登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器是 Chromium 内核，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为这种 driver 设置 `cdpUrl`。
- 当一个 existing-session 配置文件需要附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他 Chromium 内核浏览器）

如果你的**系统默认**浏览器是 Chromium 内核（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖自动检测。`~` 会展开为你的操作系统主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或者按平台在配置中设置：

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

每个配置文件的 `executablePath` 只会影响由 OpenClaw 启动的本地受管配置文件。`existing-session` 配置文件会改为附加到已在运行的浏览器，而远程 CDP 配置文件则使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行一个节点主机；Gateway 网关会将浏览器操作代理到它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程 Chromium 内核浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- `headless` 只影响由 OpenClaw 启动的本地受管配置文件。它不会重启或改变 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循同样的本地受管配置文件规则。在正在运行的本地受管配置文件上更改它，会将该配置文件标记为需要重启/协调，以便下一次启动时使用新的二进制文件。

停止行为会因配置文件模式不同而有所区别：

- 本地受管配置文件：`openclaw browser stop` 会停止由 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前控制会话，并释放 Playwright/CDP 模拟覆盖项（视口、配色方案、区域设置、时区、离线模式以及类似状态），即使 OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接 CDP WebSocket 时都会保留这些认证信息。  
对于 token，优先使用环境变量或密钥管理器，而不是将它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的那台机器上运行一个**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。  
这是远程 Gateway 网关的默认路径。

注意事项：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将其留空即可保持旧版/默认行为：所有已配置的配置文件都可以通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的配置文件可以作为目标，并且持久化配置文件的创建/删除路由会在代理界面上被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式都支持，但对于远程浏览器配置文件，最简单的选项是使用 Browserless 连接文档中的直接 WebSocket URL。

示例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注意事项：

- 请将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 给你的是 HTTPS 基础 URL，你可以将其转换为 `wss://` 以建立直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw 自动发现 `/json/version`。

## 直接 WebSocket CDP 提供商

有些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。  
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或  
  `wss://...` 且路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。  
  OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过 `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有  
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP `/json/version` 发现（将协议规范化为 `http`/`https`）；如果发现返回了 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw 会回退为在裸根路径上直接进行 WebSocket 握手。这样一来，指向本地 Chrome 的裸 `ws://` 仍然可以连接，因为 Chrome 只接受在 `/json/version` 返回的特定按目标划分路径上进行 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行无头浏览器，内置 CAPTCHA 解决、隐身模式和住宅代理。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注意事项：

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 请将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话步骤。
- 免费套餐每月允许一个并发会话和一个浏览器小时。  
  付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整 API 参考、SDK 指南和集成示例请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关认证或节点配对完成。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：gateway token bearer auth、`x-openclaw-password`，或使用已配置 gateway 密码的 HTTP Basic auth。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"` **不能**用于认证这个独立的 loopback 浏览器 API。
- 如果启用了浏览器控制但未配置共享密钥认证，OpenClaw 会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点主机保持在私有网络（Tailscale）中；避免公开暴露。
- 请将远程 CDP URL/token 视为机密；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）以及短期 token。
- 避免将长期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 OpenClaw 管理**：一个专用的 Chromium 内核浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：显式 CDP URL（运行在其他位置的 Chromium 内核浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺少，`openclaw` 配置文件会自动创建。
- `user` 配置文件是内置的，用于 Chrome MCP 现有会话附加。
- 除 `user` 外，existing-session 配置文件需要显式启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 连接现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的 Chromium 内核浏览器配置文件。这样可以复用该浏览器配置文件中已经打开的标签页和登录状态。

官方背景与设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，也可以创建自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是默认的本地 Google Chrome 配置文件。

如果要用于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，请使用 `userDataDir`：

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

然后在对应的浏览器中：

1. 打开该浏览器用于远程调试的 inspect 页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见的 inspect 页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功时的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 会列出你已经打开的浏览器标签页
- `snapshot` 会返回所选实时标签页中的 refs

如果附加不起作用，请检查：

- 目标 Chromium 内核浏览器版本是否为 `144+`
- 该浏览器的 inspect 页面中是否启用了远程调试
- 浏览器是否显示了附加同意提示，并且你已经接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它无法替你启用浏览器侧的远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置文件，请传入该显式配置文件名。
- 仅当用户就在电脑前可以批准附加提示时才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

注意事项：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以在你的已登录浏览器会话中操作。
- 对于这个 driver，OpenClaw 不会启动浏览器；它只会进行附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，它会一并传入以定位该用户数据目录。
- existing-session 可以附加到所选主机上，或者通过已连接的浏览器节点附加。如果 Chrome 位于其他地方且没有连接任何浏览器节点，请改用远程 CDP 或节点主机。

<Accordion title="existing-session 功能限制">

与受管的 `openclaw` 配置文件相比，existing-session driver 的限制更多：

- **截图** — 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要 snapshot ref。`click` 仅支持鼠标左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，每次仅一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会接触你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后是稳定的 `tabId` 句柄，例如 `t1`、可选 labels，以及原始 `targetId`。智能体应复用 `suggestedTargetId`；原始 id 仍然保留，以便调试和兼容。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 进行覆盖。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于脚本编写和调试，Gateway 网关暴露了一个小型的**仅限 loopback 的 HTTP 控制 API**，并提供与之匹配的 `openclaw browser` CLI（快照、refs、wait 增强功能、JSON 输出、调试工作流）。完整参考请参见 [Browser control API](/zh-CN/tools/browser-control)。

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），请参见  
[Browser 故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见  
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 vs 导航 SSRF 阻止

这是两类不同的失败，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、snapshot 或打开标签页流程因浏览器/网络策略错误而失败

使用以下最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，说明控制平面仍然不健康。请将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，说明浏览器控制平面已经启动，失败点在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，说明基础的受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管配置文件，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制执行。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着之后的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 相比广泛开放私有网络访问，优先使用更窄范围的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`。
- 仅在明确受信任、确实需要并且已审查私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制工作方式

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射关系如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot `ref` ID 来执行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素截图（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪情况。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果已连接支持浏览器的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [Tools Overview](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制的风险与加固
