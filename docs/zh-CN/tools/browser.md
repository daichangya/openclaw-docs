---
read_when:
    - 添加由智能体控制的浏览器自动化
    - |-
      调试为什么 openclaw 会干扰你自己的 Chrome♀♀♀♀♀♀analysis to=functions.read code 】!【json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":1}
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成式浏览器控制服务 + 动作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-23T21:07:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3232ec0627004aabd8fe7c73efa237949e4148a9648de7a12951c2af54608d4b
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium profile**，由智能体控制。
它与您的个人浏览器隔离，并通过 Gateway 网关中的一个小型本地
控制服务进行管理（仅限 loopback）。

新手视角：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` profile **不会**触碰你的个人浏览器 profile。
- 智能体可以在一个安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` profile 会通过 Chrome MCP 连接到你真实的、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器 profile（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体动作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 可选的多 profile 支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主浏览器。它是一个安全、隔离的表面，
用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到 “Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 整体都不存在，或者智能体提示浏览器工具
不可用，请直接跳转到 [缺少 browser 命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。若要用另一个注册了相同 `browser` 工具名的插件来替换它，请先禁用该插件：

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

默认情况下需要同时满足 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。仅禁用插件会整体移除 `openclaw browser` CLI、`browser.request` gateway 方法、智能体工具和控制服务；你的 `browser.*` 配置会原样保留，以供替代插件使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 缺少 browser 命令或工具

如果升级后 `openclaw browser` 变成未知命令，`browser.request` 缺失，或智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中未包含 `browser`。请将它加上：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格——allowlist 负责门控插件加载，而工具策略只会在加载之后才生效。完全移除 `plugins.allow` 也会恢复默认行为。

## Profiles：`openclaw` vs `user`

- `openclaw`：受管理、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 附加 profile，用于连接你**真实的已登录 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当已登录会话很重要，并且用户本人在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想指定某种浏览器模式时，`profile` 是显式覆盖项。

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

- 控制服务会绑定到 loopback，其端口由 `gateway.port` 派生（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让同一族派生端口一起偏移。
- 本地 `openclaw` profiles 会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 场景下才需要手动设置这些值。未设置时，`cdpUrl` 默认指向受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航与 open-tab 会在导航前执行 SSRF 防护，并在导航后对最终 `http(s)` URL 做尽力复检。
- 在严格 SSRF 模式下，远程 CDP 端点发现与 `/json/version` 探测（`cdpUrl`）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你明确且信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="Profile 行为">

- `attachOnly: true` 表示绝不启动本地浏览器；只有在浏览器已运行时才进行附加。
- `color`（顶层和按 profile）会给浏览器 UI 着色，以便你看出当前激活的是哪个 profile。
- 默认 profile 是 `openclaw`（受管理的独立实例）。使用 `defaultProfile: "user"` 可切换为已登录的用户浏览器。
- 自动检测顺序：若系统默认浏览器是基于 Chromium，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。对该驱动不要设置 `cdpUrl`。
- 当某个 existing-session profile 应附加到非默认 Chromium 用户 profile（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。你也可以通过设置 `browser.executablePath` 来覆盖
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

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并可启动本地浏览器。
- **远程控制（node host）：** 在有浏览器的机器上运行 node host；Gateway 网关会将浏览器动作代理到它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`），
  以附加到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

不同 profile 模式的停止行为不同：

- 本地受管理 profiles：`openclaw browser stop` 会停止由
  OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP profiles：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖（viewport、
  color scheme、locale、timezone、offline mode 以及类似状态），即使
  该浏览器进程并不是由 OpenClaw 启动的

远程 CDP URL 可以包含认证信息：

- Query token（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时都会保留这些认证信息。对于 token，建议优先使用环境变量或 secrets 管理器，
而不是将其提交到配置文件中。

## 节点浏览器代理（零配置默认）

如果你在拥有浏览器的机器上运行了**node host**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需额外的浏览器配置。
这是远程 gateway 的默认路径。

说明：

- node host 会通过一个**代理命令**暴露其本地浏览器控制服务器。
- Profiles 来自该节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。保持为空即可获得旧版/默认行为：所有已配置的 profiles 都可以通过代理访问，包括 profile 创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有加入 allowlist 的 profiles 才能被访问，且持久化 profile 创建/删除路由会在代理表面被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一项托管 Chromium 服务，通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 两种形式都支持，但对于远程浏览器 profile，
最简单的方案是直接使用 Browserless 连接文档中给出的 WebSocket URL。

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

- 请将 `<BROWSERLESS_API_KEY>` 替换为你的真实 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 给你的是 HTTPS 基础 URL，你可以将其转换为
  `wss://` 用于直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw
  通过 `/json/version` 自动发现。

## 直接 WebSocket CDP providers

有些托管浏览器服务暴露的是**直接 WebSocket**端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形态，并会自动选择正确的连接策略：

- **HTTP(S) 发现** —— `http://host[:port]` 或 `https://host[:port]`。  
  OpenClaw 会调用 `/json/version` 来发现 WebSocket debugger URL，然后
  进行连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** —— `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，其中路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。  
  OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根地址** —— `ws://host[:port]` 或 `wss://host[:port]`，没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（并将 scheme 标准化为 `http`/`https`）；
  如果发现结果返回了 `webSocketDebuggerUrl`，就使用它；否则 OpenClaw
  会回退为对裸根地址直接执行 WebSocket 握手。这让一个指向本地 Chrome 的
  裸 `ws://` 也能工作，因为 Chrome 只会在来自
  `/json/version` 的特定按目标路径上接受 WebSocket 升级。

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

- 前往 [注册](https://www.browserbase.com/sign-up)，并从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 请将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整 API
  参考、SDK 指南和集成示例请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API 仅使用**共享 secret 认证**：
  gateway token bearer 认证、`x-openclaw-password`，或带有
  已配置 gateway 密码的 HTTP Basic auth。
- Tailscale Serve 身份 headers 和 `gateway.auth.mode: "trusted-proxy"` 
  **不能**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制但未配置共享 secret 认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点宿主机保持在私有网络中（如 Tailscale）；避免公开暴露。
- 请将远程 CDP URL/token 视为 secrets；优先使用环境变量或 secrets 管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期有效 token 直接嵌入到配置文件中。

## Profiles（多浏览器）

OpenClaw 支持多个命名 profile（路由配置）。Profiles 可以是：

- **由 OpenClaw 管理**：一个专用的、基于 Chromium 的浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：一个显式的 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome profile

默认值：

- 如果缺失，会自动创建 `openclaw` profile。
- `user` profile 是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session profiles 都是显式启用的；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除一个 profile 时，会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 existing-session

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器，附加到正在运行的基于 Chromium 的浏览器 profile。这样可以复用该浏览器 profile 中已经打开的标签页和登录状态。

官方背景与设置参考：

- [Chrome for Developers：Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置 profile：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，也可以创建自己的自定义 existing-session profile。

默认行为：

- 内置的 `user` profile 使用 Chrome MCP 自动连接，目标是
  默认本地 Google Chrome profile。

对于 Brave、Edge、Chromium 或非默认 Chrome profile，请使用 `userDataDir`：

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

如果附加无效，请检查：

- 目标的基于 Chromium 的浏览器版本是否为 `144+`
- 是否已在该浏览器的 inspect 页面中启用远程调试
- 浏览器是否弹出了附加同意提示，并且你已接受
- `openclaw doctor` 可以迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接 profile 所需的 Chrome 是否已在本地安装，但它无法替你启用浏览器侧的远程调试

智能体使用：

- 当你需要使用用户已登录浏览器状态时，请使用 `profile="user"`。
- 如果你使用的是自定义 existing-session profile，请传入那个显式 profile 名称。
- 只有当用户本人在电脑前、可以批准附加
  提示时，才应选择此模式。
- Gateway 网关或节点宿主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 相比隔离的 `openclaw` profile，这条路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在这里使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被透传，以定位到对应的用户数据目录。
- Existing-session 可以在所选宿主机上附加，也可以通过已连接的
  浏览器节点附加。如果 Chrome 位于其他位置且没有连接浏览器节点，请改用
  远程 CDP 或 node host。

<Accordion title="Existing-session 功能限制">

与受管理的 `openclaw` profile 相比，existing-session 驱动的能力会更受限：

- **截图** —— 页面截图和 `--ref` 元素截图可用；CSS `--element` 选择器不可用。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面或基于 ref 的元素截图不需要 Playwright。
- **动作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按次调用的超时。`select` 只接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传 hooks 需要 `ref` 或 `inputRef`，一次仅支持一个文件，不支持 CSS `element`。对话框 hooks 不支持超时覆盖。
- **仅受管理模式支持的功能** —— 批量动作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不触碰你的个人浏览器 profile。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **确定性的标签页控制**：通过 `targetId` 定位标签页，而不是依赖“最后一个标签页”。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用项：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 覆盖。

平台差异：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于仅限本地的集成，Gateway 网关暴露了一个小型 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- Snapshot/截图：`GET /snapshot`、`POST /screenshot`
- 动作：`POST /navigate`、`POST /act`
- Hooks：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。

如果配置了共享 secret Gateway 网关认证，则浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或带该密码的 HTTP Basic auth

说明：

- 这个独立的 loopback 浏览器 API **不会**消费 trusted-proxy 或
  Tailscale Serve 身份 headers。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由也不会继承这些基于身份的模式；请保持它们仅限 loopback。

### `/act` 错误契约

`POST /act` 对于路由级校验和
策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：动作负载标准化或校验失败。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不支持的动作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：`evaluate`（或 `wait --fn`）已被配置禁用。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：该动作不支持 existing-session profiles。

其他运行时故障仍可能只返回 `{ "error": "<message>" }`，
而不包含 `code` 字段。

### Playwright 要求

部分功能（navigate/act/AI snapshot/role snapshot、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
明确的 501 错误。

在没有 Playwright 的情况下仍可工作的内容：

- ARIA snapshots
- 当存在按标签页划分的 CDP
  WebSocket 时，针对受管理 `openclaw` 浏览器的页面截图
- 针对 `existing-session` / Chrome MCP profiles 的页面截图
- 来自 snapshot 输出的 `existing-session` 基于 ref 的截图（`--ref`）

仍然需要 Playwright 的内容：

- `navigate`
- `act`
- AI snapshots / role snapshots
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请修复
内置浏览器插件的运行时依赖，确保已安装 `playwright-core`，
然后重启 gateway。对于打包安装，请运行 `openclaw doctor --fix`。
对于 Docker，还需按下文所示安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会与 npm 覆盖产生冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型的 loopback 控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级动作（click/type/snapshot/PDF）通过建立在 CDP 之上的 Playwright 完成；当 Playwright 缺失时，只能使用非 Playwright 操作。对智能体来说，始终看到的是一个稳定接口，而本地/远程浏览器和 profile 可以在底层自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 用于指定某个 profile，并接受 `--json` 用于机器可读输出。

<AccordionGroup>

<Accordion title="基础：status、tabs、open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="检查：screenshot、snapshot、console、errors、requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
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

<Accordion title="动作：navigate、click、type、drag、wait、evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
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
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

说明：

- `upload` 和 `dialog` 是**预置**调用；请在触发文件选择器/对话框的 click/press 之前先执行它们。
- `click`/`type`/等动作需要来自 `snapshot` 的 `ref`（数字 `12` 或角色引用 `e12`）。动作故意不支持 CSS 选择器。
- 下载、trace 和 upload 路径被限制在 OpenClaw 临时根目录内：`/tmp/openclaw{,/downloads,/uploads}`（回退路径：`${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

Snapshot 标志速览：

- `--format ai`（装有 Playwright 时的默认值）：带数字引用的 AI snapshot（`aria-ref="<n>"`）。
- `--format aria`：无障碍树，不含引用；仅用于检查。
- `--efficient`（或 `--mode efficient`）：紧凑角色 snapshot 预设。将 `browser.snapshotDefaults.mode: "efficient"` 设为默认值（参见 [Gateway 网关配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制使用角色 snapshot，并生成 `ref=e12` 形式的引用。`--frame "<iframe>"` 可将角色 snapshot 限定在某个 iframe 内。
- `--labels` 会附加一张仅限 viewport 的截图，并叠加 `e12` 标签（打印 `MEDIA:<path>`）。

## Snapshots 与 refs

OpenClaw 支持两种 “snapshot” 风格：

- **AI snapshot（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本 snapshot。
  - 动作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部通过 Playwright 的 `aria-ref` 解析 ref。

- **角色 snapshot（如 `e12` 这样的角色 refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带 `[ref=e12]`（以及可选 `[nth=1]`）的基于角色的列表/树。
  - 动作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部通过 `getByRole(...)`（以及在重复场景下使用 `nth()`）解析 ref。
  - 添加 `--labels` 可附带一张带有叠加 `e12` 标签的 viewport 截图。

Ref 行为：

- Refs **在导航之间并不稳定**；如果动作失败，请重新运行 `snapshot` 并使用新的 ref。
- 如果角色 snapshot 是通过 `--frame` 获取的，则角色 refs 会被限定在该 iframe 中，直到下一次角色 snapshot 生成。

## Wait 增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright 风格 glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待某个选择器变为可见：
  - `openclaw browser wait "#main"`

这些条件可以组合：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当动作失败时（例如 “not visible”、“strict mode violation”、“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用角色 refs）
3. 如果仍然失败：运行 `openclaw browser highlight <ref>`，查看 Playwright 实际定位到的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 对于深入调试：录制 trace：
   - `openclaw browser trace start`
   - 复现问题
   - `openclaw browser trace stop`（会打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具链。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 中的角色 snapshot 会包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具能够推断负载大小和密度。

## 状态与环境调节项

对于“让网站表现得像 X”之类的工作流，这些选项很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- Offline：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍受支持）
- HTTP Basic auth：`set credentials user pass`（或 `--clear`）
- Geolocation：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- Media：`set media dark|light|no-preference|none`
- Timezone / locale：`set timezone ...`、`set locale ...`
- Device / viewport：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- `openclaw` 浏览器 profile 可能包含已登录会话；请将其视为敏感对象。
- `browser act kind=evaluate` / `openclaw browser evaluate` 以及 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  这一行为。如果你不需要，请通过 `browser.evaluateEnabled=false` 禁用它。
- 关于登录和反机器人注意事项（X/Twitter 等），请参见 [浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 请将 Gateway 网关/节点宿主机保持私有（仅限 loopback 或 tailnet）。
- 远程 CDP 端点权限很高；请通过隧道并做好保护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 的分离宿主机场景，请参见
[WSL2 + Windows + remote Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 vs 导航 SSRF 阻止

这是两类不同的故障，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面是健康的。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标被策略拒绝了。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或 tab-opening 流程因浏览器/网络策略错误而失败，而 `start` 和 `tabs` 仍然可以工作

使用下面这组最小命令来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读：

- 如果 `start` 以 `not reachable after start` 失败，请先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，控制平面仍然不健康。这仍应视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面已经正常，故障点在于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，则说明基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会带有一个失败关闭的 SSRF 策略对象。
- 对于本地 loopback 的受管理 `openclaw` profile，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 的成功结果并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要** 默认放宽浏览器 SSRF 策略。
- 优先使用像 `hostnameAllowlist` 或 `allowedHostnames` 这样的精细主机例外，而不是开放广泛的私有网络访问。
- 只有在明确受信任、且确实需要访问私有网络浏览器目标并已完成审查的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制方式

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 会返回一个稳定的 UI 树（AI 或 ARIA）。
- `browser act` 会使用 snapshot 中的 `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 会捕获像素（整页或元素）。
- `browser` 接受：
  - `profile`，用于选择命名浏览器 profile（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器位于何处。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接了具备浏览器能力的节点，工具可能会自动路由到该节点，除非你将 `target="host"` 或 `target="node"` 固定下来。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱环境中的浏览器控制
- [安全](/zh-CN/gateway/security) — 浏览器控制风险与加固
