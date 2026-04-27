---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-27T09:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。  
它与你的个人浏览器隔离，并通过 Gateway 网关 内部的一个小型本地控制服务进行管理  
（仅限 loopback）。

初学者视角：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，在启用浏览器插件时，会教会智能体使用快照、稳定标签页、过期引用和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的界面，用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“浏览器已禁用”，请在配置中启用它（见下文），然后重启  
Gateway 网关。

如果根本没有 `openclaw browser`，或者智能体提示浏览器工具不可用，请跳转到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它可以用另一个注册同名 `browser` 工具的插件来替换它：

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

默认值需要同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会将 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务作为一个整体移除；你的 `browser.*` 配置会保持不变，以便替换方案继续使用。

浏览器配置更改需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指引

工具配置文件说明：`tools.profile: "coding"` 包含 `web_search` 和  
`web_fetch`，但不包含完整的 `browser` 工具。如果智能体或生成的子智能体应该使用浏览器自动化，请在配置文件阶段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个智能体，使用 `agents.list[].tools.alsoAllow: ["browser"]`。  
仅设置 `tools.subagents.tools.allow: ["browser"]` 还不够，因为子智能体策略会在配置文件过滤之后才应用。

浏览器插件提供两层智能体指引：

- `browser` 工具说明携带了精简的始终启用契约：选择正确的配置文件，在同一个标签页中保持引用，使用 `tabId`/标签 来定位标签页，并在多步骤任务中加载浏览器 Skills。
- 内置的 `browser-automation` Skills 携带了更完整的操作循环：先检查状态/标签页，给任务标签页加标签，操作前先做快照，在 UI 变化后重新快照，过期引用恢复一次，并将登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动操作，而不是靠猜测处理。

启用插件后，插件内置的 Skills 会列在智能体可用 Skills 中。完整的 Skills 指令会按需加载，因此常规轮次无需承担完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 未知、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表遗漏了 `browser`，并且不存在根级 `browser` 配置块。请添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 配置块，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，即使在限制性的 `plugins.allow` 下，也会激活内置浏览器插件，这与渠道配置行为一致。仅靠 `plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 并不能替代 allowlist 成员资格。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于你的**真实已登录 Chrome** 会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

<Accordion title="端口和可达性">

- 控制服务绑定到 loopback 上的一个端口，该端口从 `gateway.port` 派生而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会以同一端口族方式平移这些派生端口。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些值。未设置时，`cdpUrl` 默认为受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性检查，以及打开标签页的 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于它们的 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的受管理 Chrome 进程暴露其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是在发现进程后，为 CDP websocket 就绪提供的后续时间预算。在 Raspberry Pi、低端 VPS 或 Chromium 启动较慢的旧硬件上，可以提高这些值。值必须是最大不超过 `120000` ms 的正整数；无效的配置值会被拒绝。
- 对于反复发生的受管理 Chrome 启动/就绪失败，会按配置文件进行熔断处理。在连续失败数次后，OpenClaw 会短暂停止新的启动尝试，而不是在每次浏览器工具调用时都生成一个 Chromium 进程。请修复启动问题、在不需要时禁用浏览器，或在修复后重启 Gateway 网关。
- `actionTimeoutMs` 是浏览器 `act` 请求的默认时间预算，当调用方未传递 `timeoutMs` 时使用。客户端传输层会增加一个小的宽限窗口，让长时间等待能够完成，而不会在 HTTP 边界处超时。
- `tabCleanup` 是针对主智能体浏览器会话所打开标签页的尽力清理机制。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话会让活动标签页保持可复用，然后在后台关闭空闲或超量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会受到 SSRF 防护，并在最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理由 OpenClaw 管理的浏览器。受管理的 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- 如需代理受管理浏览器本身，请通过 `browser.extraArgs` 传递显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非已明确启用私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；只有在你明确可信任私有网络浏览器访问时才启用它。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受到支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；只有在浏览器已经运行时才附加。
- `headless` 可以全局设置，也可以按本地受管理配置文件单独设置。按配置文件设置的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个仍保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会为本地受管理配置文件请求一次性无头启动，而不会改写 `browser.headless` 或配置文件配置。existing-session、attach-only 和远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，如果环境或配置文件/全局配置都没有显式选择有头模式，则本地受管理配置文件会自动默认使用无头模式。`openclaw browser status --json` 会将 `headlessSource` 报告为 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会为当前进程强制本地受管理启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 会为普通启动强制有头模式，并在没有显示服务器的 Linux 主机上返回可执行的错误信息；显式的 `start --headless` 请求仍会在那一次启动中优先生效。
- `executablePath` 可以全局设置，也可以按本地受管理配置文件单独设置。按配置文件设置的值会覆盖 `browser.executablePath`，因此不同的受管理配置文件可以启动不同的 Chromium 系浏览器。这两种形式都接受 `~` 来表示你的操作系统主目录。
- `color`（顶层和按配置文件）会为浏览器 UI 着色，以便你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管理的独立模式）。使用 `defaultProfile: "user"` 可选择默认使用已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是 Chromium 系，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当 existing-session 配置文件应附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。该路径同样接受 `~` 来表示你的操作系统主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系浏览器

如果你的**系统默认**浏览器是 Chromium 系（Chrome/Brave/Edge 等），  
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖自动检测。顶层和按配置文件的 `executablePath` 值都接受 `~` 表示你的操作系统主目录：

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

按配置文件设置的 `executablePath` 仅影响由 OpenClaw 启动的本地受管理配置文件。`existing-session` 配置文件会附加到一个已在运行的浏览器，而远程 CDP 配置文件则使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关 启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行一个节点主机；Gateway 网关 会将浏览器操作代理到该节点主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程的 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于运行在 loopback 上的外部管理 CDP 服务（例如在 Docker 中发布到 `127.0.0.1` 的 Browserless），还要设置 `attachOnly: true`。如果 loopback CDP 未设置 `attachOnly`，则会被视为本地的 OpenClaw 受管理浏览器配置文件。
- `headless` 仅影响由 OpenClaw 启动的本地受管理配置文件。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地受管理配置文件规则。在一个正在运行的本地受管理配置文件上更改它时，该配置文件会被标记为需要重启/协调，以便下一次启动时使用新的二进制文件。

停止行为因配置文件模式而异：

- 本地受管理配置文件：`openclaw browser stop` 会停止由 OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP 配置文件：`openclaw browser stop` 会关闭活动控制会话，并释放 Playwright/CDP 模拟覆盖（视口、配色方案、区域设置、时区、离线模式及类似状态），即使没有任何浏览器进程是由 OpenClaw 启动的

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接 CDP WebSocket 时都会保留认证信息。对于 token，优先使用环境变量或密钥管理器，而不是将其提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以将浏览器工具调用自动路由到该节点，而无需任何额外浏览器配置。  
这是远程 Gateway 网关 的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空即可保留旧版/默认行为：所有已配置的配置文件都仍可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的配置文件可以作为目标，并且持久化配置文件创建/删除路由会在代理表面被阻止。
- 如果你不想启用它，可将其禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式都可以使用，但对于远程浏览器配置文件，最简单的方式是使用 Browserless 连接文档中的直接 WebSocket URL。

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

- 将 `<BROWSERLESS_API_KEY>` 替换为你的真实 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 提供的是 HTTPS 基础 URL，你可以将其转换为 `wss://` 以建立直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw 去发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管，而 OpenClaw 在主机上运行时，应将 Browserless 视为一个外部管理的 CDP 服务：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` 中的地址必须能从 OpenClaw 进程访问到。Browserless 还必须通告一个同样可达的匹配端点；请将 Browserless 的 `EXTERNAL` 设置为同一个从 OpenClaw 可访问的 WebSocket 基址，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000` 或稳定的私有 Docker 网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向了 OpenClaw 无法访问的地址，那么 CDP HTTP 看起来可能正常，但 WebSocket 附加仍然会失败。

不要让 loopback Browserless 配置文件的 `attachOnly` 保持未设置。没有 `attachOnly` 时，OpenClaw 会把该 loopback 端口视为本地受管理浏览器配置文件，并可能报告该端口已被占用但并非由 OpenClaw 持有。

## 直接 WebSocket CDP 提供商

有些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。  
  OpenClaw 调用 `/json/version` 来发现 WebSocket 调试器 URL，然后进行连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或  
  `wss://...`，路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。OpenClaw 直接通过 WebSocket 握手连接，并完全跳过 `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，没有 `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP `/json/version` 发现（将协议规范化为 `http`/`https`）；如果发现结果返回了 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw 会回退到裸根路径上的直接 WebSocket 握手。如果通告的 WebSocket 端点拒绝 CDP 握手，但配置的裸根路径可以接受，OpenClaw 也会回退到该根路径。这使得指向本地 Chrome 的裸 `ws://` 仍然可以连接，因为 Chrome 只接受来自 `/json/version` 中特定每目标路径的 WebSocket 升级；而托管提供商在其发现端点通告了不适合 Playwright CDP 的短时效 URL 时，仍可以使用其根 WebSocket 端点。

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

说明：

- [注册](https://www.browserbase.com/sign-up) 后，从[概览仪表板](https://www.browserbase.com/overview)复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你的真实 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话。
- 免费层每月允许一个并发会话和一个浏览器小时。  
  付费计划限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整的 API 参考、SDK 指南和集成示例，请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全性

关键理念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关 的认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **仅**使用共享密钥认证：
  gateway token bearer auth、`x-openclaw-password`，或使用已配置 gateway 密码的 HTTP Basic auth。
- Tailscale Serve 身份头以及 `gateway.auth.mode: "trusted-proxy"`  
  **不能**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制，但未配置共享密钥认证，OpenClaw 会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关 和任何节点主机保持在私有网络中（Tailscale）；避免公开暴露。
- 请将远程 CDP URL/token 视为机密；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）以及短时效 token。
- 避免将长期有效的 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 OpenClaw 管理**：一个专用的 Chromium 系浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：显式的 CDP URL（在其他地方运行的 Chromium 系浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺少，`openclaw` 配置文件会自动创建。
- `user` 配置文件是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session 配置文件需要显式启用；请使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方的 Chrome DevTools MCP 服务器附加到一个正在运行的 Chromium 系浏览器配置文件。这样可以复用该浏览器配置文件中已打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想要不同的名称、颜色或浏览器数据目录，也可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，请使用 `userDataDir`。  
`~` 会展开为你的操作系统主目录：

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

成功时应表现为：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回所选实时标签页中的 refs

如果附加不起作用，请检查：

- 目标 Chromium 系浏览器版本为 `144+`
- 已在该浏览器的 inspect 页面中启用远程调试
- 浏览器已显示附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置文件所需的 Chrome 是否已本地安装，但它无法替你在浏览器端启用远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，请使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传递该显式配置文件名称。
- 仅当用户就在电脑前可以批准附加提示时，才选择此模式。
- Gateway 网关 或节点主机可以生成 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以在你已登录的浏览器会话内执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，则会将其透传，以便定位到该用户数据目录。
- existing-session 可以附加到所选主机上，或通过已连接的浏览器节点进行附加。如果 Chrome 位于其他地方，且没有浏览器节点连接，请改用远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流程不符合你的需求时（离线主机、固定版本、内置二进制文件），可以按配置文件覆盖所生成的 Chrome DevTools MCP 服务器：

| 字段 | 作用 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要生成的可执行文件，用来替代 `npx`。按原样解析；支持绝对路径。 |
| `mcpArgs`    | 原样传递给 `mcpCommand` 的参数数组。会替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当在 existing-session 配置文件上设置了 `cdpUrl` 时，OpenClaw 会跳过  
`--autoConnect`，并自动将该端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志与 `userDataDir` 不能组合使用：当设置了 `cdpUrl` 时，`userDataDir` 会在 Chrome MCP 启动中被忽略，因为 Chrome MCP 会附加到端点背后的正在运行浏览器，而不是打开某个配置文件目录。

<Accordion title="existing-session 功能限制">

与受管理的 `openclaw` 配置文件相比，existing-session 驱动的限制更多：

- **截图** —— 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click-coords` 会点击可见视口坐标，不需要 snapshot ref。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅限受管理模式的功能** —— 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后是稳定的 `tabId` 句柄（如 `t1`）、可选标签以及原始 `targetId`。智能体应复用 `suggestedTargetId`；原始 id 仍可用于调试和兼容性场景。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 覆盖它。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于脚本编写和调试，Gateway 网关 暴露了一个小型的**仅限 loopback 的 HTTP 控制 API**，并提供匹配的 `openclaw browser` CLI（快照、refs、wait 增强能力、JSON 输出、调试工作流）。完整参考请参见  
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

关于 Linux 特定问题（尤其是 snap Chromium），请参见  
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

关于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见  
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 与 导航 SSRF 阻止

这是两类不同的失败，它们分别指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略而被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`，当 loopback 外部 CDP 服务配置时未设置 `attachOnly: true`
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或打开标签页流程因浏览器/网络策略错误而失败，但 `start` 和 `tabs` 仍然正常

使用以下最小序列来区分这两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍不健康。请将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，故障出在导航策略或目标页面上。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基础的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会采用失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管理配置文件，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全指引：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用精确的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛地允许私有网络访问。
- 仅在明确受信任、确实需要并且经过审查的私有网络浏览器访问环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot 的 `ref` ID 来执行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素内容（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪情况。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接支持浏览器的节点，除非你固定指定 `target="host"` 或 `target="node"`，否则该工具可能会自动路由到该节点。

这样可以让智能体行为保持可预测，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制的风险与加固
