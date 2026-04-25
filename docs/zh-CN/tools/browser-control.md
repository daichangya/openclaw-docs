---
read_when:
    - 通过本地控制 API 对智能体浏览器进行脚本操作或调试
    - 正在查找 `openclaw browser` CLI 参考
    - 添加带有快照和 refs 的自定义浏览器自动化
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-04-25T06:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9d18da48dfb6cf127fabbaa056411162640ab62e15690617138af3c23ee19c9
    source_path: tools/browser-control.md
    workflow: 15
---

有关设置、配置和故障排除，请参阅 [Browser](/zh-CN/tools/browser)。
本页是本地控制 HTTP API、`openclaw browser`
CLI，以及脚本模式（快照、refs、等待、调试流程）的参考文档。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关会暴露一个小型的 loopback HTTP API：

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

如果配置了共享密钥 Gateway 网关认证，浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic auth

注意：

- 这个独立的 loopback 浏览器 API **不会** 使用受信任代理或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由不会继承这些携带身份信息的模式；请将它们仅保留在 loopback 中使用。

### `/act` 错误契约

`POST /act` 对路由级验证和
策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前的 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作负载未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不支持的操作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置中禁用了 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：现有会话配置文件不支持此操作。

其他运行时故障仍可能返回 `{ "error": "<message>" }`，而没有
`code` 字段。

### Playwright 要求

某些功能（navigate/act/AI snapshot/role snapshot、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
明确的 501 错误。

在没有 Playwright 时仍可使用的功能：

- ARIA 快照
- 当托管的 `openclaw` 浏览器具有每标签页 CDP
  WebSocket 可用时的页面截图
- `existing-session` / Chrome MCP 配置文件的页面截图
- 从快照输出生成的 `existing-session` 基于 ref 的截图（`--ref`）

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
然后重启 Gateway 网关。对于打包安装，请运行 `openclaw doctor --fix`。
对于 Docker，还需按下文所示安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会有 npm 覆盖冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

如需持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如，
`/home/node/.cache/ms-playwright`），并确保通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化 `/home/node`。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型 loopback 控制服务器接受 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（点击/输入/快照/PDF）通过 CDP 之上的 Playwright 完成；当缺少 Playwright 时，仅提供非 Playwright 操作。智能体看到的是一个稳定接口，而底层的本地/远程浏览器和配置文件可以自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 以定位到特定配置文件，并接受 `--json` 以输出机器可读格式。

<AccordionGroup>

<Accordion title="基础：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # 也会清除仅附加/远程 CDP 上的模拟状态
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
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
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
openclaw browser click 12 --double           # 或 e12 用于 role refs
openclaw browser click-coords 120 340        # 视口坐标
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
openclaw browser set credentials user pass            # 使用 --clear 删除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意：

- `upload` 和 `dialog` 是**预设**调用；请在触发文件选择器/对话框的点击或按键之前运行它们。
- `click` / `type` / 等操作需要来自 `snapshot` 的 `ref`（数字 `12` 或 role ref `e12`）。操作有意不支持 CSS 选择器。当可见视口位置是唯一可靠目标时，请使用 `click-coords`。
- 下载、trace 和 upload 路径被限制在 OpenClaw 临时根目录中：`/tmp/openclaw{,/downloads,/uploads}`（回退为：`${os.tmpdir()}/openclaw/...`）。
- `upload` 还可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

快照标志一览：

- `--format ai`（安装 Playwright 时的默认值）：带数字 refs 的 AI 快照（`aria-ref="<n>"`）。
- `--format aria`：无障碍树，无 refs；仅用于检查。
- `--efficient`（或 `--mode efficient`）：紧凑的 role 快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（参见 [Gateway configuration](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制生成 role 快照，并使用 `ref=e12` refs。`--frame "<iframe>"` 将 role 快照范围限定到某个 iframe。
- `--labels` 会添加带叠加 ref 标签的仅视口截图（输出 `MEDIA:<path>`）。
- `--urls` 会将已发现的链接目标附加到 AI 快照中。

## 快照和 refs

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，ref 通过 Playwright 的 `aria-ref` 解析。

- **Role 快照（类似 `e12` 的 role refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带有 `[ref=e12]`（以及可选的 `[nth=1]`）的基于 role 的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，ref 通过 `getByRole(...)` 解析（重复项则结合 `nth()`）。
  - 添加 `--labels` 可包含带叠加 `e12` 标签的视口截图。
  - 当链接文本有歧义且智能体需要明确的
    导航目标时，添加 `--urls`。

ref 行为：

- refs **不会在导航后保持稳定**；如果操作失败，请重新运行 `snapshot` 并使用新的 ref。
- 如果 role 快照是通过 `--frame` 获取的，那么 role refs 会限定在该 iframe 中，直到下一次 role 快照。

## Wait 增强功能

你可以等待的不仅仅是时间/文本：

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

当某个操作失败时（例如 “not visible”、“strict mode violation”、“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用 role refs）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 实际定位的目标
4. 如果页面表现异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 若需深入调试：记录 trace：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（输出 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本编写和结构化工具处理。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 格式的 role 快照包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具推断负载大小和密度。

## 状态和环境调节项

这些对“让网站表现得像 X 一样”的工作流很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- Offline：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍然受支持）
- HTTP Basic auth：`set credentials user pass`（或使用 `--clear`）
- Geolocation：`set geo <lat> <lon> --origin "https://example.com"`（或使用 `--clear`）
- Media：`set media dark|light|no-preference|none`
- Timezone / locale：`set timezone ...`、`set locale ...`
- Device / viewport：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- `openclaw` 浏览器配置文件可能包含已登录会话；请将其视为敏感内容。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  执行这些操作。如果你不需要它，请使用 `browser.evaluateEnabled=false` 禁用。
- 关于登录和反机器人说明（X/Twitter 等），请参阅 [Browser login + X/Twitter posting](/zh-CN/tools/browser-login)。
- 请将 Gateway 网关/节点主机保持为私有（仅 loopback 或仅 tailnet）。
- 远程 CDP 端点权限很高；请通过隧道接入并加以保护。

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

## 相关内容

- [Browser](/zh-CN/tools/browser) — 概述、配置、配置文件、安全
- [Browser login](/zh-CN/tools/browser-login) — 登录网站
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
