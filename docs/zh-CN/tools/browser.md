---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期管理
summary: 集成的浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-14T08:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# 浏览器（由 openclaw 管理）

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关 内部一个小型本地控制服务进行管理
（仅 loopback）。

初学者视角：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**接触你的个人浏览器配置文件。
- 智能体可以在一个安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的已登录 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖动/选择）、快照、截图、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的表面，用于
智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“浏览器已禁用”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 整个命令都不存在，或者智能体提示浏览器工具
不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具现在是一个默认启用的内置插件。
这意味着你可以禁用或替换它，而无需移除 OpenClaw 的其余插件系统：

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

在安装另一个提供相同 `browser` 工具名称的插件之前，请先禁用内置插件。
默认浏览器体验同时需要：

- `plugins.entries.browser.enabled` 未被禁用
- `browser.enabled=true`

如果你只关闭插件，内置的浏览器 CLI（`openclaw browser`）、
Gateway 网关 方法（`browser.request`）、智能体工具以及默认浏览器控制
服务都会一起消失。你的 `browser.*` 配置会保持不变，以便替换插件复用。

内置浏览器插件现在也负责浏览器运行时实现。
核心仅保留共享的插件 SDK 辅助工具，以及对旧内部导入路径的兼容性重新导出。
在实际效果上，移除或替换浏览器插件包会移除浏览器功能集，而不会留下第二套由核心拥有的运行时实现。

浏览器配置更改仍然需要重启 Gateway 网关，这样内置插件才能使用新设置重新注册其浏览器服务。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 突然变成未知命令，或者
智能体报告缺少浏览器工具，最常见的原因是限制性的 `plugins.allow`
列表中不包含 `browser`。

错误配置示例：

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

解决方法是在插件允许列表中添加 `browser`：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要说明：

- 当设置了 `plugins.allow` 时，仅有 `browser.enabled=true` 本身还不够。
- 当设置了 `plugins.allow` 时，仅有 `plugins.entries.browser.enabled=true` 本身也还不够。
- `tools.alsoAllow: ["browser"]` **不会**加载内置浏览器插件。它只会在插件已加载后调整工具策略。
- 如果你不需要限制性的插件允许列表，删除 `plugins.allow` 也可以恢复默认的内置浏览器行为。

典型症状：

- `openclaw browser` 是未知命令。
- `browser.request` 缺失。
- 智能体报告浏览器工具不可用或缺失。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理的隔离浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于连接你**真实已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想使用特定浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管理模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时选择启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖
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

说明：

- 浏览器控制服务会绑定到一个基于 `gateway.port`
  派生的 loopback 端口（默认：`18791`，即 gateway + 2）。
- 如果你覆盖了 Gateway 网关 端口（`gateway.port` 或 `OPENCLAW_GATEWAY_PORT`），
  派生的浏览器端口也会一起移动，以保持在同一个“家族”中。
- 未设置时，`cdpUrl` 默认使用受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP 可达性检查。
- `remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 可达性检查。
- 浏览器导航/打开标签页在导航前会进行 SSRF 防护，并在导航后针对最终 `http(s)` URL 进行尽力的再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现/探测（`cdpUrl`，包括 `/json/version` 查询）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认禁用。仅在你明确信任私有网络浏览器访问时将其设为 `true`。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为兼容性的旧版别名受支持。
- `attachOnly: true` 表示“绝不启动本地浏览器；如果它已经运行，则只进行附加。”
- `color` 加上各配置文件的 `color` 会为浏览器 UI 着色，以便你看出当前哪个配置文件处于活动状态。
- 默认配置文件是 `openclaw`（由 OpenClaw 管理的独立浏览器）。使用 `defaultProfile: "user"` 可改为默认使用已登录的用户浏览器。
- 自动检测顺序：若系统默认浏览器是基于 Chromium，则使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl` —— 仅在远程 CDP 场景下设置这些值。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。此驱动下请勿设置 `cdpUrl`。
- 当 existing-session 配置文件需要附加到非默认的 Chromium 用户配置文件（例如 Brave 或 Edge）时，请设置 `browser.profiles.<name>.userDataDir`。

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖
自动检测：

CLI 示例：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关 启动 loopback 控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行节点主机；Gateway 网关 会将浏览器操作代理到该节点主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

停止行为因配置文件模式而异：

- 本地受管理配置文件：`openclaw browser stop` 会停止由
  OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖（视口、
  配色方案、区域设置、时区、离线模式以及类似状态），即使
  并没有由 OpenClaw 启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时会保留这些认证信息。与其将令牌提交到配置文件，不如优先使用环境变量或密钥管理器。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行**节点主机**，OpenClaw 可以
在无需任何额外浏览器配置的情况下，自动将浏览器工具调用路由到该节点。
这是远程 Gateway 网关 的默认路径。

说明：

- 节点主机会通过**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选项。将其留空即可使用旧版/默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有允许列表中的配置文件可以作为目标，而且持久化配置文件的创建/删除路由会在代理表面上被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管式 Chromium 服务，
通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式都支持，但
对于远程浏览器配置文件，最简单的选项是使用 Browserless 连接文档中的直接 WebSocket URL。

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
- 选择与你的 Browserless 账户匹配的区域端点（见其文档）。
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以建立直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw
  自动发现 `/json/version`。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 同时支持这两种：

- **HTTP(S) 端点** —— OpenClaw 调用 `/json/version` 发现
  WebSocket 调试器 URL，然后再连接。
- **WebSocket 端点**（`ws://` / `wss://`）—— OpenClaw 直接连接，
  跳过 `/json/version`。这适用于像
  [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com) 这样的服务，或任何直接提供
  WebSocket URL 的提供商。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
无头浏览器，并内置 CAPTCHA 解决、隐身模式和住宅代理。

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

- 前往 [注册](https://www.browserbase.com/sign-up)，并从 [Overview 仪表板](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整的 API
  参考、SDK 指南和集成示例，请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关 的身份验证或节点配对流转。
- 独立的 loopback 浏览器 HTTP API **仅**使用共享密钥认证：
  gateway token Bearer 认证、`x-openclaw-password`，或使用
  已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"`
  **不会**为这个独立的 loopback 浏览器 API 提供身份验证。
- 如果启用了浏览器控制但未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关 和任何节点主机保持在私有网络中（Tailscale）；避免公开暴露。
- 将远程 CDP URL/token 视为机密；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽量优先使用加密端点（HTTPS 或 WSS）以及短期 token。
- 避免将长期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 openclaw 管理**：一个专用的基于 Chromium 的浏览器实例，拥有独立的用户数据目录 + CDP 端口
- **远程**：显式的 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你当前已有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件是内置的，用于通过 Chrome MCP 附加到现有会话。
- 除 `user` 外，现有会话配置文件需要显式启用；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方的 Chrome DevTools MCP 服务器附加到一个正在运行的基于 Chromium 的浏览器配置文件。
这样可以复用该浏览器配置文件中已经打开的标签页和登录状态。

官方背景资料和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，也可以创建你自己的自定义现有会话配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是
  默认本地 Google Chrome 配置文件。

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

然后在对应浏览器中：

1. 打开该浏览器用于远程调试的检查页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见检查页面：

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
- `snapshot` 返回所选实时标签页的 refs

如果附加不成功，请检查：

- 目标的基于 Chromium 的浏览器版本是否为 `144+`
- 是否已在该浏览器的检查页面中启用远程调试
- 浏览器是否显示了附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它无法替你启用浏览器端远程调试

智能体使用：

- 当你需要用户已登录浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义现有会话配置文件，请传入该显式配置文件名称。
- 只有当用户就在电脑前可以批准附加提示时，才选择此模式。
- Gateway 网关 或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加到一个
  现有会话。
- OpenClaw 在这里使用官方 Chrome DevTools MCP 的 `--autoConnect` 流程。如果
  设置了 `userDataDir`，OpenClaw 会将其一并传递，以显式定位该
  Chromium 用户数据目录。
- 现有会话截图支持整页截图以及来自快照的 `--ref` 元素
  截图，但不支持 CSS `--element` 选择器。
- 现有会话页面截图无需 Playwright 即可通过 Chrome MCP 工作。
  基于 ref 的元素截图（`--ref`）在该模式下也可用，但 `--full-page`
  不能与 `--ref` 或 `--element` 组合使用。
- 与受管理浏览器
  路径相比，现有会话操作仍然更受限制：
  - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要
    使用快照 refs，而不是 CSS 选择器
  - `click` 仅支持左键（不支持按钮覆盖或修饰键）
  - `type` 不支持 `slowly=true`；请使用 `fill` 或 `press`
  - `press` 不支持 `delayMs`
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不
    支持每次调用的超时覆盖
  - `select` 当前仅支持单个值
- 现有会话 `wait --url` 与其他浏览器驱动一样，支持精确、子串和 glob 模式。
  但尚不支持 `wait --load networkidle`。
- 现有会话上传钩子需要 `ref` 或 `inputRef`，一次只支持一个文件，
  且不支持 CSS `element` 定位。
- 现有会话对话框钩子不支持超时覆盖。
- 某些功能仍然需要受管理浏览器路径，包括批量
  操作、PDF 导出、下载拦截以及 `responsebody`。
- 现有会话是主机本地的。如果 Chrome 位于另一台机器上，或者在
  不同的网络命名空间中，请改用远程 CDP 或节点主机。

## 隔离保证

- **专用用户数据目录**：绝不会接触你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，防止与开发工作流发生冲突。
- **确定性的标签页控制**：通过 `targetId` 选定标签页，而不是“最后一个标签页”。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 覆盖此行为。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关 会暴露一个小型 loopback HTTP API：

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

如果配置了共享密钥 gateway 身份验证，浏览器 HTTP 路由也需要身份验证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 身份验证

说明：

- 这个独立的 loopback 浏览器 API **不会**使用 trusted-proxy 或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由不会继承这些携带身份的模式；请将它们保持为仅限 loopback。

### `/act` 错误约定

`POST /act` 对路由级验证和
策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或其值无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作负载未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不受支持的操作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置中已禁用 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：现有会话配置文件不支持该操作。

其他运行时失败仍可能返回不带
`code` 字段的 `{ "error": "<message>" }`。

### Playwright 要求

某些功能（navigate/act/AI 快照/role 快照、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
明确的 501 错误。

在没有 Playwright 的情况下，仍然可用的功能：

- ARIA 快照
- 当每个标签页的 CDP
  WebSocket 可用时，为受管理的 `openclaw` 浏览器截取页面截图
- 为 `existing-session` / Chrome MCP 配置文件截取页面截图
- 基于快照输出的 `existing-session` ref 截图（`--ref`）

仍然需要 Playwright 的功能：

- `navigate`
- `act`
- AI 快照 / role 快照
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请安装完整的
Playwright 包（不是 `playwright-core`）并重启 gateway，或者重新安装
带有浏览器支持的 OpenClaw。

#### Docker Playwright 安装

如果你的 Gateway 网关 在 Docker 中运行，请避免使用 `npx playwright`
（会与 npm override 冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化 `/home/node`。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

高层流程：

- 一个小型**控制服务器**接收 HTTP 请求。
- 它通过 **CDP** 连接到基于 Chromium 的浏览器（Chrome/Brave/Edge/Chromium）。
- 对于高级操作（点击/输入/快照/PDF），它会在
  CDP 之上使用 **Playwright**。
- 当缺少 Playwright 时，只有非 Playwright 操作可用。

这种设计让智能体始终使用稳定、可预测的接口，同时允许
你切换本地/远程浏览器和配置文件。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 以定位特定配置文件。
所有命令也都接受 `--json` 以输出机器可读格式（稳定负载）。

基础命令：

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

检查：

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

生命周期说明：

- 对于仅附加和远程 CDP 配置文件，测试结束后 `openclaw browser stop` 仍然是
  正确的清理命令。它会关闭当前活动的控制会话，并
  清除临时仿真覆盖，而不是杀掉底层
  浏览器。
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

操作：

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状态：

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

说明：

- `upload` 和 `dialog` 是**预置**调用；请在触发文件选择器/对话框的点击或按键
  之前运行它们。
- 下载和 trace 输出路径限制在 OpenClaw 临时根目录下：
  - traces：`/tmp/openclaw`（回退：`${os.tmpdir()}/openclaw`）
  - downloads：`/tmp/openclaw/downloads`（回退：`${os.tmpdir()}/openclaw/downloads`）
- 上传路径限制在 OpenClaw 临时 uploads 根目录下：
  - uploads：`/tmp/openclaw/uploads`（回退：`${os.tmpdir()}/openclaw/uploads`）
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。
- `snapshot`：
  - `--format ai`（安装 Playwright 时的默认值）：返回带有数字 refs 的 AI 快照（`aria-ref="<n>"`）。
  - `--format aria`：返回无障碍树（无 refs；仅供检查）。
  - `--efficient`（或 `--mode efficient`）：紧凑的 role 快照预设（interactive + compact + depth + 更低的 maxChars）。
  - 配置默认值（仅适用于工具/CLI）：设置 `browser.snapshotDefaults.mode: "efficient"`，以便在调用方未传入 mode 时使用高效快照（参见 [Gateway 配置](/zh-CN/gateway/configuration-reference#browser)）。
  - Role 快照选项（`--interactive`、`--compact`、`--depth`、`--selector`）会强制使用基于 role 的快照，refs 形式如 `ref=e12`。
  - `--frame "<iframe selector>"` 将 role 快照限定在某个 iframe 内（与 `e12` 这类 role refs 配对使用）。
  - `--interactive` 输出扁平、易于选择的交互元素列表（最适合驱动操作）。
  - `--labels` 添加一张仅视口截图，并叠加 ref 标签（输出 `MEDIA:<path>`）。
- `click`/`type` 等操作需要来自 `snapshot` 的 `ref`（可以是数字 `12` 或 role ref `e12`）。
  操作有意不支持 CSS 选择器。

## 快照与 refs

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，ref 通过 Playwright 的 `aria-ref` 解析。

- **Role 快照**（如 `e12` 这样的 role refs）：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于 role 的列表/树，包含 `[ref=e12]`（以及可选的 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，ref 通过 `getByRole(...)` 解析（重复项则配合 `nth()`）。
  - 添加 `--labels` 可包含一张叠加 `e12` 标签的视口截图。

Ref 行为：

- refs **不会**在导航之间保持稳定；如果失败，请重新运行 `snapshot` 并使用新的 ref。
- 如果 role 快照是在带有 `--frame` 的情况下获取的，那么在下一次 role 快照之前，role refs 都限定在该 iframe 内。

## Wait 增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变为可见：
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

当某个操作失败时（例如“不可见”“严格模式违规”“被遮挡”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在 interactive 模式中优先使用 role refs）
3. 如果仍然失败：运行 `openclaw browser highlight <ref>`，查看 Playwright 实际定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深度调试：记录 trace：
   - `openclaw browser trace start`
   - 重现问题
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

JSON 格式的 role 快照包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），这样工具就可以推断负载大小和密度。

## 状态和环境控制项

这些对于“让网站表现得像 X”一类的工作流很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- Offline：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍受支持）
- HTTP Basic 认证：`set credentials user pass`（或 `--clear`）
- Geolocation：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- Media：`set media dark|light|no-preference|none`
- Timezone / locale：`set timezone ...`、`set locale ...`
- Device / viewport：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- openclaw 浏览器配置文件可能包含已登录会话；请将其视为敏感内容。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  这一行为。如果你不需要它，请用 `browser.evaluateEnabled=false` 禁用。
- 关于登录和反机器人说明（X/Twitter 等），请参见 [浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 请保持 Gateway 网关 / 节点主机私有（仅限 loopback 或 tailnet）。
- 远程 CDP 端点能力很强；请通过隧道保护并做好访问控制。

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

有关 Linux 特有问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway 网关 + Windows Chrome 分离主机场景，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这两类失败不同，并且对应不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、snapshot 或打开标签页流程因浏览器/网络策略错误而失败

使用以下最小序列来区分这两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪性问题。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面已启动，失败原因在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，则基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管理配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制执行。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用范围更窄的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛地允许私有网络访问。
- 仅在明确受信任且已审查、确实需要私有网络浏览器访问的环境中使用 `dangerouslyAllowPrivateNetwork: true`。

示例：导航被阻止，但控制平面健康

- `start` 成功
- `tabs` 成功
- `open http://internal.example` 失败

这通常意味着浏览器启动没有问题，而是该导航目标需要进行策略审查。

示例：在导航无关之前启动就已被阻止

- `start` 因 `not reachable after start` 失败
- `tabs` 也失败或无法运行

这表明问题在浏览器启动或 CDP 可达性，而不是页面 URL 允许列表。

## 智能体工具 + 控制工作方式

智能体会获得**一个工具**用于浏览器自动化：

- `browser` —— status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照中的 `ref` ID 来执行点击/输入/拖动/选择。
- `browser screenshot` 捕获像素内容（整页或元素）。
- `browser` 接受：
  - `profile`：选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）：选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果连接了具备浏览器能力的节点，除非你固定指定 `target="host"` 或 `target="node"`，否则该工具可能会自动路由到该节点。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) —— 浏览器控制的风险与加固
