---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为何 openclaw 会干扰你的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期管理
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-23T15:38:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc2eb4c6ee3eb85d4aa599164315a4b2355d8f6c628ee62af2e913b1d4bfc516
    source_path: tools/browser.md
    workflow: 15
---

# 浏览器（由 openclaw 管理）

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部一个小型本地控制服务进行管理
（仅限 loopback）。

初学者视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你会获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你日常使用的主浏览器。它是一个安全、隔离的表面，用于
智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 完全不存在，或者智能体提示浏览器工具
不可用，请跳转到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它即可用另一个注册相同 `browser` 工具名的插件替换它：

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

默认设置同时需要 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。如果只禁用插件，会作为一个整体移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以便供替代方案使用。

浏览器配置更改需要重启 Gateway 网关，以便插件重新注册其服务。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 变成未知命令，`browser.request` 缺失，或智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中缺少 `browser`。请添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 不能替代允许列表成员资格——允许列表控制插件加载，而工具策略只会在加载之后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管的隔离浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于连接你**真实已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录会话很重要，并且用户
  在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖项。

如果你想默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认值：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在有意信任私有网络访问时启用
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
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

- 控制服务绑定到 loopback，其端口从 `gateway.port` 派生而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会使派生端口在同一端口族中一并变化。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 场景下才设置这些值。未设置时，`cdpUrl` 默认指向受管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 用于远程 CDP WebSocket 握手。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会受到 SSRF 保护，并会在导航后的最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你有意信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍然作为旧别名受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已经运行时附加。
- `color`（顶层和按配置文件设置）会为浏览器 UI 着色，让你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管独立模式）。使用 `defaultProfile: "user"` 可切换为已登录的用户浏览器。
- 自动检测顺序：系统默认浏览器（如果是基于 Chromium）；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当某个 existing-session 配置文件需要附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖
自动检测：

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

## 本地控制 vs 远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理到该节点主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程的、基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

停止行为会因配置文件模式而异：

- 本地受管配置文件：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖项（视口、
  色彩方案、区域设置、时区、离线模式及类似状态），即使
  OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时都会保留这些认证信息。对于令牌，优先使用环境变量或密钥管理器，
不要把它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，无需任何额外浏览器配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空即可保留旧版/默认行为：所有已配置的配置文件都可以通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有在允许列表中的配置文件才可作为目标，并且持久化配置文件的创建/删除路由会在代理表面被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管式 Chromium 服务，通过
HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式都可以使用，但
对于远程浏览器配置文件，最简单的选项是使用 Browserless 连接文档中提供的
直接 WebSocket URL。

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

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以建立直接 CDP 连接，或者保留该 HTTPS URL，让 OpenClaw
  去发现 `/json/version`。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** —— `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** —— `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。
  OpenClaw 直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** —— `ws://host[:port]` 或 `wss://host[:port]`，且没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将协议规范化为 `http`/`https`）；
  如果发现结果返回 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw
  会回退到在裸根路径执行直接 WebSocket 握手。这使得一个指向本地 Chrome 的
  裸 `ws://` 仍然可以连接，因为 Chrome 只会在
  `/json/version` 返回的特定按目标划分路径上接受 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
无头浏览器，并内置 CAPTCHA 求解、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview 仪表板](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐允许一个并发会话，以及每月一小时浏览器使用时长。
  付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整 API 参考、SDK 指南和集成示例，请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全性

关键要点：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对流转。
- 独立的 loopback 浏览器 HTTP API **仅**使用共享密钥认证：
  gateway 令牌 Bearer 认证、`x-openclaw-password`，或使用
  已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"`
  **不会**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该令牌。
- 请将 Gateway 网关和所有节点主机保持在私有网络中（Tailscale）；避免公开暴露。
- 将远程 CDP URL/令牌视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期令牌。
- 避免将长期有效令牌直接写入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 openclaw 管理**：专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：显式 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接你的现有 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件为内置项，用于 Chrome MCP 的 existing-session 附加。
- 除了 `user` 之外，existing-session 配置文件都需要显式启用；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，其本地数据目录会移动到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 existing-session

OpenClaw 也可以通过官方的 Chrome DevTools MCP 服务器附加到一个正在运行的基于 Chromium 的浏览器配置文件。
这会复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景与设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想要不同的
名称、颜色或浏览器数据目录，也可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是
  默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，请使用 `userDataDir`：

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

然后在对应浏览器中：

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

成功时应表现为：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回所选实时标签页中的 refs

如果附加无法工作，请检查：

- 目标的基于 Chromium 的浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器显示了附加同意提示，且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它不能
  替你启用浏览器侧的远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，请使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置文件，请传入其显式配置文件名。
- 仅当用户在电脑前能够批准附加
  提示时，才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- 这里 OpenClaw 使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被透传，用于定位该用户数据目录。
- existing-session 可以在选定主机上附加，也可以通过已连接的
  浏览器节点附加。如果 Chrome 位于其他地方且未连接浏览器节点，请改用
  远程 CDP 或节点主机。

<Accordion title="existing-session 功能限制">

与受管的 `openclaw` 配置文件相比，existing-session 驱动限制更多：

- **截图** —— 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。基于页面或 ref 的元素截图不需要 Playwright。
- **操作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 refs（不支持 CSS 选择器）。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 仅接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子要求 `ref` 或 `inputRef`，一次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管功能** —— 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，防止与开发工作流冲突。
- **可预测的标签页控制**：按 `targetId` 定位标签页，而不是“最后一个标签页”。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关会暴露一个小型 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- 钩子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。

如果配置了共享密钥 gateway 认证，浏览器 HTTP 路由也要求认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 认证

说明：

- 这个独立的 loopback 浏览器 API **不会**使用 trusted-proxy 或
  Tailscale Serve 身份头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由不会继承这些带身份信息的模式；请保持它们仅限 loopback。

### `/act` 错误契约

`POST /act` 对路由级校验和
策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或其值无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作负载在规范化或校验时失败。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不支持的操作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置中禁用了 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：existing-session 配置文件不支持该操作。

其他运行时失败仍可能返回不带
`code` 字段的 `{ "error": "<message>" }`。

### Playwright 要求

某些功能（navigate/act/AI 快照/role 快照、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
清晰的 501 错误。

在没有 Playwright 的情况下，以下功能仍可工作：

- ARIA 快照
- 当存在每标签页 CDP
  WebSocket 时，受管 `openclaw` 浏览器的页面截图
- `existing-session` / Chrome MCP 配置文件的页面截图
- 来自快照输出的 `existing-session` 基于 ref 的截图（`--ref`）

仍然需要 Playwright 的功能：

- `navigate`
- `act`
- AI 快照 / role 快照
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请修复
内置浏览器插件运行时依赖，确保已安装 `playwright-core`，
然后重启 gateway。对于打包安装，请运行 `openclaw doctor --fix`。
对于 Docker，还需要按如下所示安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会与 npm 覆盖冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型 loopback 控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（点击/输入/快照/PDF）通过位于 CDP 之上的 Playwright 执行；当缺少 Playwright 时，只有非 Playwright 操作可用。智能体看到的是一个稳定接口，而底层的本地/远程浏览器和配置文件可以自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来指定目标配置文件，并接受 `--json` 以输出机器可读格式。

<AccordionGroup>

<Accordion title="基础：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # 对 attach-only/remote CDP 也会清除仿真状态
openclaw browser tabs
openclaw browser tab             # 当前标签页的快捷方式
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="检查：截图、快照、控制台、错误、请求">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 或 --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="操作：navigate、click、type、drag、wait、evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 或使用 e12 作为 role refs
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="状态：cookies、storage、offline、headers、geo、device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # 使用 --clear 可移除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

说明：

- `upload` 和 `dialog` 是**预置**调用；请在触发文件选择器/对话框的点击或按键之前运行它们。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字 `12` 或 role ref `e12`）。出于设计考虑，操作不支持 CSS 选择器。
- 下载、trace 和上传路径被限制在 OpenClaw 临时根目录下：`/tmp/openclaw{,/downloads,/uploads}`（回退路径：`${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入框。

快照标志一览：

- `--format ai`（安装 Playwright 时为默认）：AI 快照，带数字 refs（`aria-ref="<n>"`）。
- `--format aria`：无障碍树，不带 refs；仅用于检查。
- `--efficient`（或 `--mode efficient`）：紧凑 role 快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（参见 [Gateway 配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制使用 role 快照，并生成 `ref=e12` refs。`--frame "<iframe>"` 会将 role 快照限制在某个 iframe 中。
- `--labels` 会附带一个带叠加 ref 标签的仅视口截图（输出 `MEDIA:<path>`）。

## 快照和 refs

OpenClaw 支持两种“快照”风格：

- **AI 快照（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，ref 通过 Playwright 的 `aria-ref` 解析。

- **Role 快照（如 `e12` 的 role refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于 role 的列表/树，带有 `[ref=e12]`（以及可选的 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，ref 通过 `getByRole(...)` 解析（重复项会额外使用 `nth()`）。
  - 添加 `--labels` 可包含带叠加 `e12` 标签的视口截图。

Ref 行为：

- refs **不会跨导航保持稳定**；如果操作失败，请重新运行 `snapshot` 并使用新的 ref。
- 如果 role 快照是通过 `--frame` 获取的，则这些 role refs 会限定在该 iframe 中，直到下一次 role 快照为止。

## Wait 增强功能

你可以等待的不只是时间或文本：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待某个选择器变为可见：
  - `openclaw browser wait "#main"`

这些可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当某个操作失败时（例如“not visible”、“strict mode violation”、“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用 role refs）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 实际定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 对于深度调试：记录一个 trace：
   - `openclaw browser trace start`
   - 复现问题
   - `openclaw browser trace stop`（输出 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 格式的 role 快照包含 `refs` 和一个小型 `stats` 块（lines/chars/refs/interactive），方便工具判断负载大小和密度。

## 状态与环境开关

这些功能适合“让站点表现得像 X”这类工作流：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- Offline：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（旧写法 `set headers --json '{"X-Debug":"1"}'` 仍受支持）
- HTTP Basic 认证：`set credentials user pass`（或使用 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或使用 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区 / 区域设置：`set timezone ...`、`set locale ...`
- 设备 / 视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- openclaw 浏览器配置文件可能包含已登录会话；请将其视为敏感内容。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  这一行为。如果你不需要它，请通过 `browser.evaluateEnabled=false` 禁用。
- 关于登录和反机器人说明（X/Twitter 等），请参见 [浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 请将 Gateway 网关/节点主机保持为私有（仅 loopback 或仅 tailnet）。
- 远程 CDP 端点能力很强；请通过隧道保护并做好防护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 可选的精确允许
    },
  },
}
```

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway 网关 + Windows Chrome 分主机设置，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 vs 导航 SSRF 阻止

这是两种不同的失败类型，对应不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但某个页面导航目标因策略被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、snapshot 或打开标签页的流程因浏览器/网络策略错误而失败

请使用下面这组最小命令来区分这两种问题：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍不健康。请将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已正常启动，失败点在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基本的受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的受管 `openclaw` 配置文件，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不代表后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用范围较窄的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是广泛允许私有网络访问。
- 只有在明确受信任且已审查、并且确实需要私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

它的映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot 的 `ref` ID 来执行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素内容（整页或元素）。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) —— 浏览器控制的风险与加固措施
