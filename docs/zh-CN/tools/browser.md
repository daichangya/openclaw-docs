---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期管理
summary: 集成的浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-24T23:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58806d9728345ca32f0341a060bd53f8447f7614a1a5fdcad822d94f9bd48d40
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。  
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地控制服务进行管理  
（仅限 loopback）。

新手视角：

- 可以把它看作一个**单独的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 连接到你真实的已登录 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认带橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，会在启用浏览器插件时教会智能体如何使用 snapshot、stable-tab、stale-ref，以及手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的界面，用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启 Gateway 网关。

如果根本不存在 `openclaw browser`，或者智能体提示浏览器工具不可用，请跳转到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它即可用另一个注册相同 `browser` 工具名称的插件替换它：

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

默认行为要求同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。如果只禁用插件，会整体移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册它的服务。

## 智能体指引

浏览器插件提供两层智能体指引：

- `browser` 工具描述包含紧凑的常驻契约：选择正确的配置文件，在同一个标签页内保持 refs 一致，使用 `tabId`/标签进行标签页定位，并在执行多步骤任务时加载浏览器 Skills。
- 内置的 `browser-automation` Skills 包含更长的操作循环：先检查状态/标签页，给任务标签页打标签，操作前先做快照，在 UI 变化后重新快照，遇到 stale refs 时重试恢复一次，并将登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动操作，而不是猜测处理。

启用插件后，插件内置的 Skills 会列在智能体可用的 Skills 中。完整的 Skills 指令按需加载，因此日常轮次不会承担完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 无法识别、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。请将它加入：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格——allowlist 决定插件是否加载，而工具策略只会在加载之后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 连接配置文件，用于连接你**真实的已登录 Chrome** 会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何连接提示时，优先使用 `profile="user"`。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管理模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

- 控制服务绑定到 loopback 上，端口从 `gateway.port` 派生而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会同步移动这一组派生端口。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些值。未设置时，`cdpUrl` 默认使用受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会受到 SSRF 保护，并会在之后尽力对最终的 `http(s)` URL 再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；只有在你有意信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为遗留别名受到支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；如果浏览器已经在运行，则只进行连接。
- `color`（顶层和按配置文件设置）会给浏览器 UI 着色，以便你看到当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管理的独立模式）。使用 `defaultProfile: "user"` 可切换为已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序查找。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当 existing-session 配置文件需要连接到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖自动检测：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

或者在配置中按平台设置：

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

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关会启动 loopback 控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在安装浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理到该主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）即可连接远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

停止行为会因配置文件模式而异：

- 本地受管理配置文件：`openclaw browser stop` 会停止 OpenClaw 启动的浏览器进程
- 仅连接和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前控制会话，并释放 Playwright/CDP 仿真覆盖（视口、配色方案、区域设置、时区、离线模式及类似状态），即使没有任何浏览器进程是由 OpenClaw 启动的

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接到 CDP WebSocket 时会保留这些认证信息。对于 token，优先使用环境变量或密钥管理器，而不是将它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需额外的浏览器配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选项。留空即可保留旧版/默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有列入 allowlist 的配置文件可以被定位，且持久化配置文件的创建/删除路由会在代理界面上被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，它通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 两种形式都支持，但对于远程浏览器配置文件来说，
最简单的选项是使用 Browserless 连接文档中的直接 WebSocket URL。

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

说明：

- 请将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 提供给你的是一个 HTTPS 基础 URL，你可以将它转换为
  `wss://` 以建立直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw
  自动发现 `/json/version`。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务提供的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。  
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后进行连接。  
  不会回退到 WebSocket。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或  
  `wss://...`，路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。  
  OpenClaw 会直接通过 WebSocket 握手进行连接，并完全跳过  
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有  
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、  
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP  
  `/json/version` 发现（将 scheme 规范化为 `http`/`https`）；  
  如果发现结果返回了 `webSocketDebuggerUrl`，就会使用它；否则 OpenClaw  
  会回退到对裸根路径执行直接 WebSocket 握手。这样一来，即使一个裸 `ws://`  
  指向本地 Chrome，也仍然可以连接，因为 Chrome 只接受针对  
  `/json/version` 返回的特定逐目标路径上的 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
无头浏览器，内置 CAPTCHA 求解、隐身模式和住宅代理。

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

说明：

- [注册](https://www.browserbase.com/sign-up)，并从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 请将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整的 API 参考、SDK 指南和集成示例，请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全性

核心概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  gateway token bearer 认证、`x-openclaw-password`，或者使用
  已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"`  
  **不能**用于认证这个独立的 loopback 浏览器 API。
- 如果启用了浏览器控制，但未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 如果 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy`，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点主机放在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 建议：

- 尽量优先使用加密端点（HTTPS 或 WSS）以及短期 token。
- 避免将长期有效的 token 直接嵌入配置文件中。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **openclaw-managed**：一个专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录和 CDP 端口
- **remote**：一个显式的 CDP URL（在其他地方运行的基于 Chromium 的浏览器）
- **existing session**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺少 `openclaw` 配置文件，会自动创建。
- `user` 配置文件内置用于 Chrome MCP existing-session 连接。
- 除 `user` 外，existing-session 配置文件需要显式启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，其本地数据目录会被移至废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 Existing-session

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器连接到一个正在运行的基于 Chromium 的浏览器配置文件。这样可以复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，其目标是
  默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认的 Chrome 配置文件，请使用 `userDataDir`：

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
3. 保持浏览器运行，并在 OpenClaw 连接时批准连接提示。

常见的 inspect 页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时连接冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功时应表现为：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回所选实时标签页中的 refs

如果连接不起作用，请检查：

- 目标的基于 Chromium 的浏览器版本是否为 `144+`
- 是否已在该浏览器的 inspect 页面启用远程调试
- 浏览器是否显示了连接同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它无法替你
  启用浏览器侧的远程调试

智能体使用方式：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传入明确的配置文件名称。
- 只有当用户就在电脑前可以批准连接提示时，才应选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这一路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会进行连接。
- OpenClaw 在这里使用官方 Chrome DevTools MCP 的 `--autoConnect` 流程。如果设置了
  `userDataDir`，它会一并传递过去，以定位该用户数据目录。
- Existing-session 可以在选定主机上连接，也可以通过已连接的
  浏览器节点连接。如果 Chrome 位于其他地方且没有浏览器节点已连接，请改用
  远程 CDP 或节点主机。

<Accordion title="Existing-session 功能限制">

与受管理的 `openclaw` 配置文件相比，existing-session 驱动的限制更多：

- **截图** — 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不要求 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要使用 snapshot refs（不支持 CSS 选择器）。`click` 仅支持鼠标左键。`type` 不支持 `slowly=true`；请改用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子要求使用 `ref` 或 `inputRef`，一次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管理模式支持的功能** — 批量操作、PDF 导出、下载拦截以及 `responsebody` 仍然需要使用受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **可预测的标签页控制**：通过原始 `targetId`、稳定的 `tabId`
  句柄（如 `t1`），或你使用 `open --label` / `tab label` 分配的标签来定位标签页。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 覆盖它。

平台行为：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于脚本编写和调试，Gateway 网关会暴露一个小型的**仅限 loopback 的 HTTP
控制 API**，以及与之对应的 `openclaw browser` CLI（快照、refs、wait
增强功能、JSON 输出、调试工作流）。完整参考请参见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

有关 Linux 特有问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway 网关 + Windows Chrome 分离主机场景，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的故障，它们对应不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略而被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或标签页打开流程因浏览器/网络策略错误而失败，而 `start` 和 `tabs` 仍然可用

使用下面的最小命令序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，说明控制平面仍不健康。请将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，说明浏览器控制平面已正常运行，故障出在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管理配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着之后的 `open` 或 `navigate` 目标一定被允许。

安全指引：

- **不要**默认放宽浏览器 SSRF 策略。
- 与宽泛的私有网络访问相比，优先使用更窄范围的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`。
- 只有在明确受信任且确实需要并已审查私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

其映射方式如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot 的 `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 捕获像素内容（整页或元素）。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接支持浏览器的节点，该工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [Tools Overview](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制的风险与加固措施
