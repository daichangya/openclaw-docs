---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T10:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c38c6dc17fc324d5baef6c03f36a02e6a168b9389c553b559690b0cc3c1d1da6
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome / Brave / Edge / Chromium 配置文件**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地控制服务进行管理
（仅 loopback）。

初学者视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一个安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你会获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出 / 打开 / 聚焦 / 关闭）。
- 智能体操作（点击 / 输入 / 拖动 / 选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，用于在启用浏览器
  插件时教会智能体如何处理 snapshot、stable-tab、stale-ref，以及手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的表面，用于
智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser 已禁用”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 完全不存在，或者智能体提示浏览器工具
不可用，请跳转到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它即可将其替换为另一个注册相同 `browser` 工具名称的插件：

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

默认行为需要同时设置 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。如果只禁用插件，会整体移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保留，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册它的服务。

## 智能体指引

浏览器插件提供两个层级的智能体指引：

- `browser` 工具描述包含简洁的常驻契约：选择正确的
  配置文件、在同一标签页上保持 refs、使用 `tabId` / 标签进行标签页
  定位，以及在进行多步骤工作时加载 browser skill。
- 内置的 `browser-automation` Skills 包含更完整的操作循环：
  先检查 Status / 标签页，给任务标签页加标签，在执行操作前先做 snapshot，
  在 UI 变化后重新 snapshot，恢复一次 stale refs，并将登录 / 2FA / captcha 或
  摄像头 / 麦克风阻塞报告为需要手动处理的操作，而不是猜测。

当插件启用时，插件内置的 Skills 会列在智能体的可用 Skills 中。
完整的 skill 指令会按需加载，因此常规轮次无需承担全部 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 无法识别，`browser.request` 缺失，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中漏掉了 `browser`。请添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代允许列表成员身份——允许列表控制插件是否加载，而工具策略只会在加载之后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于接入你**真实已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录会话很重要，并且用户
  正在电脑前可以点击 / 批准任何附加提示时，优先使用 `profile="user"`。
- 当你想要指定某种浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管理模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在可信的私有网络访问场景下显式启用
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
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

- 控制服务绑定到 loopback，端口根据 `gateway.port` 推导（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让同一组派生端口一起偏移。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort` / `cdpUrl`；只有远程 CDP 才需要设置这些值。未设置时，`cdpUrl` 默认指向受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。
- 当调用方未传入 `timeoutMs` 时，`actionTimeoutMs` 是浏览器 `act` 请求的默认预算。客户端传输层会额外增加一个小的宽限窗口，以便长时间等待能够完成，而不是在 HTTP 边界超时。
- `tabCleanup` 是对主智能体浏览器会话所打开标签页的尽力清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭各自显式跟踪的标签页；主会话会保留活跃标签页以供复用，然后在后台关闭空闲或超出数量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会受到 SSRF 防护，并会在之后针对最终 `http(s)` URL 进行尽力复查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关 / 提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 管理的浏览器。受管理的 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- 如果要代理受管理浏览器本身，请通过 `browser.extraArgs` 传递显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非已明确启用私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你明确信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 作为旧别名继续受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已运行时附加。
- `headless` 可在全局或每个本地受管理配置文件中设置。每个配置文件的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持 headless，而另一个仍然可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会为本地受管理配置文件请求一次性 headless 启动，而不会重写 `browser.headless` 或配置文件配置。existing-session、仅附加和远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，如果环境或配置文件 / 全局配置都没有显式选择有界面模式，本地受管理配置文件会自动默认使用 headless。`openclaw browser status --json`
  会将 `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会为当前进程强制本地受管理启动使用 headless。`OPENCLAW_BROWSER_HEADLESS=0` 会为普通启动强制使用有界面模式，并在没有显示服务器的 Linux 主机上返回一个可操作的错误；但显式的 `start --headless` 请求仍会在该次启动中优先生效。
- `executablePath` 可在全局或每个本地受管理配置文件中设置。每个配置文件的值会覆盖 `browser.executablePath`，因此不同的受管理配置文件可以启动不同的 Chromium 系浏览器。
- `color`（顶层和每个配置文件）会为浏览器 UI 着色，方便你看出当前激活的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管理的独立浏览器）。使用 `defaultProfile: "user"` 可选择已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是 Chromium 系，则优先使用它；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当 existing-session 配置文件需要附加到非默认 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他 Chromium 系浏览器）

如果你的**系统默认**浏览器是 Chromium 系浏览器（Chrome / Brave / Edge / 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖
自动检测。`~` 会展开为你的操作系统主目录：

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

每个配置文件的 `executablePath` 只影响由 OpenClaw
启动的本地受管理配置文件。`existing-session` 配置文件会附加到已在运行的浏览器，
而远程 CDP 配置文件则使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关会启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理到它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- `headless` 仅影响 OpenClaw 启动的本地受管理配置文件。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地受管理配置文件规则。在一个
  正在运行的本地受管理配置文件上更改它时，该配置文件会被标记为需要重启 / 协调，以便
  下一次启动时使用新的二进制文件。

不同配置文件模式下的停止行为不同：

- 本地受管理配置文件：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前的
  控制会话，并释放 Playwright / CDP 仿真覆盖（视口、
  配色方案、区域设置、时区、离线模式，以及类似状态），即使
  OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
到 CDP WebSocket 时会保留认证信息。对于令牌，优先使用环境变量或密钥管理器，
而不是将其提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以
无需任何额外浏览器配置，就自动将浏览器工具调用路由到该节点。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空时会采用旧版 / 默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建 / 删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有在允许列表中的配置文件才能作为目标，持久化配置文件创建 / 删除路由也会在代理表面被阻止。
- 如果你不想启用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，会通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 可以使用这两种形式，但
对于远程浏览器配置文件来说，最简单的选项是使用 Browserless 连接文档中的
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
- 如果 Browserless 提供给你一个 HTTPS 基础 URL，你可以将它转换为
  `wss://` 以进行直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw
  自动发现 `/json/version`。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  进行连接。不会回退到 WebSocket。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。
  OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将协议规范化为 `http` / `https`）；
  如果发现返回 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw
  会回退到在裸根路径执行直接 WebSocket 握手。这样可以让一个
  指向本地 Chrome 的裸 `ws://` 仍然可以连接，因为 Chrome 只会在来自
  `/json/version` 的特定按目标划分路径上接受 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
headless 浏览器，内置 CAPTCHA 解决、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview 控制台](https://www.browserbase.com/overview)
  复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整的 API
  参考、SDK 指南和集成示例，请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关认证或节点配对流转。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  gateway token bearer 认证、`x-openclaw-password`，或使用
  已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"`
  **不能**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该令牌。
- 请将 Gateway 网关和任何节点主机保持在私有网络中（Tailscale）；避免公开暴露。
- 将远程 CDP URL / 令牌视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）以及短期令牌。
- 避免将长期令牌直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 openclaw 管理**：一个专用的 Chromium 系浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：显式 CDP URL（Chromium 系浏览器在其他地方运行）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件内置用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session 配置文件需要显式启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，其本地数据目录会被移入废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方的
Chrome DevTools MCP 服务器附加到一个正在运行的 Chromium 系浏览器配置文件。
这样会复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景资料和设置参考：

- [Chrome for Developers：将 Chrome DevTools MCP 与你的浏览器会话一起使用](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的
名称、颜色或浏览器数据目录，可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，其目标是
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

然后在对应的浏览器中：

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

- 目标 Chromium 系浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器已显示附加同意提示，并且你已经接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它不能
  替你在浏览器端启用远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传入该显式配置文件名。
- 仅当用户在电脑前可以批准附加
  提示时才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，则会一并传递，以定位到该用户数据目录。
- existing-session 可以附加到所选主机上，也可以通过一个已连接的
  浏览器节点附加。如果 Chrome 在别处运行，且没有连接浏览器节点，请改用
  远程 CDP 或节点主机。

<Accordion title="existing-session 功能限制">

与受管理的 `openclaw` 配置文件相比，existing-session 驱动受到更多限制：

- **截图** — 页面截图和 `--ref` 元素截图可用；CSS `--element` 选择器不可用。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click-coords` 会点击可见视口坐标，不需要 snapshot ref。`click` 仅支持鼠标左键。`type` 不支持 `slowly=true`；请改用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管理模式支持的功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，以防与开发工作流发生冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后返回
  稳定的 `tabId` 句柄，例如 `t1`、可选标签以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 仍然保留，以便
  调试和兼容。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 进行覆盖。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常见的 Chrome / Brave / Edge / Chromium 路径。
- Windows：检查常见安装位置。

## 控制 API（可选）

用于脚本编写和调试时，Gateway 网关会暴露一个小型的**仅限 loopback 的 HTTP
控制 API**，以及配套的 `openclaw browser` CLI（snapshots、refs、wait
增强功能、JSON 输出、调试工作流）。完整参考请参见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这两者属于不同的失败类型，并指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略而被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或标签页打开流程因浏览器 / 网络策略错误而失败，但 `start` 和 `tabs` 仍然可用

使用以下最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，说明控制平面仍不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面已正常运行，失败出在导航策略或目标页面上。
- 如果 `start`、`tabs` 和 `open` 都成功，则说明基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用故障关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管理配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着之后的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 相比广泛开放私有网络访问，更推荐使用精确的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`。
- 仅在明确受信任、确实需要并且已经审查私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — doctor / status / start / stop / tabs / open / focus / close / snapshot / screenshot / navigate / act

映射关系如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot 的 `ref` ID 执行点击 / 输入 / 拖动 / 选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪性。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) — 浏览器控制的风险与加固
