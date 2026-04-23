---
read_when:
    - Running OpenClaw Gateway in WSL2 while Chrome lives on Windows
    - 看到横跨 WSL2 和 Windows 的浏览器 / Control UI 重叠错误
    - 在分离主机设置中，在主机本地 Chrome MCP 与原始远程 CDP 之间做出选择
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 故障
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-04-23T23:04:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

本指南涵盖一种常见的分离主机设置，其中：

- OpenClaw Gateway 网关运行在 WSL2 中
- Chrome 运行在 Windows 上
- 浏览器控制必须跨越 WSL2 / Windows 边界

它还涵盖了 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 中的分层故障模式：多个彼此独立的问题可能会同时出现，从而让错误的层看起来像是最先出问题的地方。

## 先选择正确的浏览器模式

你有两种有效模式：

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用一个远程浏览器 profile，让它从 WSL2 指向 Windows Chrome CDP 端点。

适用场景：

- Gateway 网关保留在 WSL2 中
- Chrome 运行在 Windows 上
- 你需要让浏览器控制跨越 WSL2 / Windows 边界

### 选项 2：主机本地 Chrome MCP

仅当 Gateway 网关本身与 Chrome 运行在同一主机上时，才使用 `existing-session` / `user`。

适用场景：

- OpenClaw 和 Chrome 在同一台机器上运行
- 你想使用本地已登录的浏览器状态
- 你不需要跨主机的浏览器传输
- 你不需要像 `responsebody`、PDF
  导出、下载拦截或批量操作这类高级托管 / 仅原始 CDP 路由

对于 WSL2 Gateway 网关 + Windows Chrome，应优先使用原始远程 CDP。Chrome MCP 是主机本地模式，不是 WSL2 到 Windows 的桥接。

## 可工作的架构

参考形态：

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中通过 `http://127.0.0.1:18789/` 打开 Control UI
- Windows Chrome 在端口 `9222` 上暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器 profile 指向从 WSL2 可访问的地址

## 为什么这个设置容易让人困惑

多个故障可能会重叠：

- WSL2 无法访问 Windows CDP 端点
- Control UI 是从非安全来源打开的
- `gateway.controlUi.allowedOrigins` 与页面来源不匹配
- 缺少 token 或配对
- 浏览器 profile 指向了错误地址

因此，即使修复了一层，界面中仍可能看到另一层的错误。

## Control UI 的关键规则

当 UI 从 Windows 打开时，如果你没有明确配置 HTTPS，请使用 Windows localhost。

请使用：

`http://127.0.0.1:18789/`

不要默认使用 LAN IP 来访问 Control UI。通过 LAN 或 tailnet 地址使用明文 HTTP 可能触发与 CDP 本身无关的非安全来源 / 设备认证行为。请参见 [Control UI](/zh-CN/web/control-ui)。

## 按层验证

请从上到下逐层处理。不要跳步。

### 第 1 层：验证 Chrome 是否在 Windows 上提供 CDP

在 Windows 上启动启用了远程调试的 Chrome：

```powershell
chrome.exe --remote-debugging-port=9222
```

先在 Windows 上验证 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果这里失败，那么问题还不在 OpenClaw。

### 第 2 层：验证 WSL2 能否访问该 Windows 端点

在 WSL2 中，测试你计划在 `cdpUrl` 中使用的精确地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正确结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开页面，空数组也正常）

如果失败：

- Windows 尚未将该端口暴露给 WSL2
- 该地址对 WSL2 一侧来说是错误的
- 防火墙 / 端口转发 / 本地代理仍未配置好

在修改 OpenClaw 配置之前，先修复这里。

### 第 3 层：配置正确的浏览器 profile

对于原始远程 CDP，请将 OpenClaw 指向从 WSL2 可访问的地址：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

说明：

- 使用 WSL2 可访问的地址，而不是仅在 Windows 上可用的地址
- 对外部托管的浏览器，保持 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)
- 只有当浏览器提供商给你直接的 DevTools socket URL 时，才使用 WS(S)
- 在期望 OpenClaw 成功之前，先用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 这一层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 的预期一致
- token 认证或配对配置正确
- 你没有把 Control UI 认证问题当成浏览器问题来排查

有帮助的页面：

- [Control UI](/zh-CN/web/control-ui)

### 第 5 层：验证端到端浏览器控制

在 WSL2 中执行：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

正确结果：

- 标签页会在 Windows Chrome 中打开
- `openclaw browser tabs` 会返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可在同一个 profile 上工作

## 常见的误导性错误

请将每条消息视为某一层的线索：

- `control-ui-insecure-auth`
  - UI 来源 / 安全上下文问题，而不是 CDP 传输问题
- `token_missing`
  - 认证配置问题
- `pairing required`
  - 设备批准问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问所配置的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端点已响应，但 DevTools WebSocket 仍然无法打开
- 远程会话结束后仍残留过期的 viewport / 深色模式 / 语言区域 / 离线覆盖状态
  - 运行 `openclaw browser stop --browser-profile remote`
  - 这会关闭当前控制会话，并释放 Playwright / CDP 仿真状态，而无需重启 gateway 或外部浏览器
- `gateway timeout after 1500ms`
  - 通常仍是 CDP 可达性问题，或远程端点响应缓慢 / 不可访问
- `No Chrome tabs found for profile="user"`
  - 在没有可用主机本地标签页时，错误地选择了本地 Chrome MCP profile

## 快速排查清单

1. 在 Windows 上：`curl http://127.0.0.1:9222/json/version` 是否可用？
2. 在 WSL2 中：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可用？
3. 在 OpenClaw 配置中：`browser.profiles.<name>.cdpUrl` 是否使用了那个精确的、WSL2 可访问的地址？
4. 对于 Control UI：你打开的是 `http://127.0.0.1:18789/`，而不是 LAN IP 吗？
5. 你是不是在尝试跨 WSL2 和 Windows 使用 `existing-session`，而不是原始远程 CDP？

## 实际结论

这种设置通常是可行的。困难之处在于，浏览器传输、Control UI 来源安全，以及 token / 配对都可能各自独立失败，但从用户侧看起来又很相似。

如果不确定：

- 先在本地验证 Windows Chrome 端点
- 再从 WSL2 验证同一个端点
- 只有这样之后，再去调试 OpenClaw 配置或 Control UI 认证

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [浏览器登录](/zh-CN/tools/browser-login)
- [浏览器 Linux 故障排除](/zh-CN/tools/browser-linux-troubleshooting)
