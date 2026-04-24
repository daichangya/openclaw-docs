---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期管理
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-24T07:36:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地
控制服务进行管理（仅限 loopback）。

新手视角：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在安全通道中**打开标签页、读取页面、点击并输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的已登录 Chrome 会话。

## 你会获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你日常使用的主浏览器。它是一个安全、隔离的界面，
用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“浏览器已禁用”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果完全没有 `openclaw browser`，或者智能体提示浏览器工具
不可用，请跳转到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

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

默认配置需要同时满足 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。只禁用插件会整体移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保留，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 仍然未知、`browser.request` 缺失，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。请添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格——allowlist 决定插件是否加载，而工具策略只会在加载之后才生效。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于连接你**真实已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户
  在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖项。

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

<AccordionGroup>

<Accordion title="端口与可达性">

- 控制服务绑定到 loopback，并使用基于 `gateway.port` 派生的端口（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会以相同规则同步调整这一组派生端口。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些项。未设置时，`cdpUrl` 默认指向受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会经过 SSRF 防护，并在最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现以及 `/json/version` 探测（`cdpUrl`）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在明确可信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受到支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；只有在浏览器已运行时才附加。
- `color`（顶层和每个配置文件级别）会为浏览器 UI 着色，以便你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管理的独立模式）。使用 `defaultProfile: "user"` 可切换为已登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器基于 Chromium，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序查找。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当 existing-session 配置文件应附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器基于 Chromium（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖
自动检测：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行一个节点主机；Gateway 网关会将浏览器操作代理到该主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

停止行为因配置文件模式不同而有所差异：

- 本地受管理配置文件：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖项（视口、
  配色方案、区域设置、时区、离线模式及类似状态），即使
  OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含身份验证信息：

- 查询参数令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时会保留这些身份验证信息。对于令牌，优先使用环境变量或密钥管理器，
而不是将其提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选项。保持为空即可使用旧版/默认行为：所有已配置的配置文件都仍可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的配置文件可被指定，并且持久化配置文件创建/删除路由会在代理界面上被阻止。
- 如果你不想启用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket
公开 CDP 连接 URL。OpenClaw 可以使用任一形式，但
对于远程浏览器配置文件，最简单的方式是使用 Browserless 连接文档中的
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
- 如果 Browserless 提供的是 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以建立直接 CDP 连接，也可以保留 HTTPS URL，让 OpenClaw
  自动发现 `/json/version`。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务公开的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** —— `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  进行连接。不会回退到 WebSocket。
- **直接 WebSocket 端点** —— `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，且路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。
  OpenClaw 会通过 WebSocket 握手直接连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** —— `ws://host[:port]` 或 `wss://host[:port]`，且没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将协议规范化为 `http`/`https`）；
  如果发现过程返回 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw
  会回退到在裸根路径上直接进行 WebSocket 握手。这使得一个指向本地 Chrome 的
  裸 `ws://` 仍然可以连接，因为 Chrome 只会在
  来自 `/json/version` 的特定按目标划分路径上接受 WebSocket 升级。

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

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  无需手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整的 API
  参考、SDK 指南和集成示例，请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全性

关键点：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的身份验证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥身份验证**：
  gateway token bearer auth、`x-openclaw-password`，或使用
  已配置 Gateway 网关密码的 HTTP Basic auth。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"`
  **不会**为这个独立的 loopback 浏览器 API 提供身份验证。
- 如果启用了浏览器控制且未配置共享密钥身份验证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 将 Gateway 网关和任何节点主机保留在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 openclaw 管理**：一个专用的基于 Chromium 的浏览器实例，具有自己的用户数据目录 + CDP 端口
- **远程**：显式的 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 之外，existing-session 配置文件需要显式启用；请使用 `--driver existing-session` 创建它们。
- 默认情况下，本地 CDP 端口会从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 existing-session

OpenClaw 也可以通过官方的
Chrome DevTools MCP 服务器附加到一个正在运行的基于 Chromium 的浏览器配置文件。
这样可以复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景与设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想要使用
不同的名称、颜色或浏览器数据目录，可以创建你自己的自定义 existing-session 配置文件。

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

常见 inspect 页面：

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

如果附加不起作用，请检查：

- 目标的基于 Chromium 的浏览器版本为 `144+`
- 已在该浏览器的 inspect 页面中启用远程调试
- 浏览器已显示附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已本地安装，但它无法
  替你启用浏览器端的远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置文件，请传入明确的配置文件名称。
- 只有当用户在电脑前可以批准附加
  提示时，才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被透传以定位该用户数据目录。
- Existing-session 可以附加到所选主机上，也可以通过已连接的
  浏览器节点附加。如果 Chrome 位于其他地方且未连接浏览器节点，请改用
  远程 CDP 或节点主机。

<Accordion title="Existing-session 功能限制">

与受管理的 `openclaw` 配置文件相比，existing-session 驱动的限制更多：

- **截图** —— 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要使用快照 ref（不支持 CSS 选择器）。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次仅支持一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管理模式支持的功能** —— 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流发生冲突。
- **可预测的标签页控制**：通过 `targetId` 定位标签页，而不是“最后一个标签页”。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 进行覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于脚本化和调试，Gateway 网关公开了一个小型的**仅限 loopback 的 HTTP
控制 API**，以及与之匹配的 `openclaw browser` CLI（快照、refs、wait
增强功能、JSON 输出、调试工作流）。完整参考请参见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特定问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的失败，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略而被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、快照或打开标签页流程会因浏览器/网络策略错误而失败

使用下面这个最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，说明控制平面仍不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，说明浏览器控制平面已正常启动，失败发生在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，则说明基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的受管理 `openclaw` 配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 与广泛允许私有网络访问相比，优先使用更精确的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`。
- 仅在明确受信任、且确实需要并已审查私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制工作方式

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射关系如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照中的 `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 捕获像素内容（整页或元素）。
- `browser` 接受：
  - `profile` 用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这使智能体保持可预测性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制的风险与加固措施
