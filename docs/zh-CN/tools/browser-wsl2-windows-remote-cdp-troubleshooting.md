---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，同时 Chrome 运行在 Windows 上
    - 在 WSL2 和 Windows 上看到相互重叠的 browser/Control UI 错误
    - 在分离主机场景中决定使用主机本地 Chrome MCP 还是原始远程 CDP
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 故障
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-04-23T21:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3368c7fef1470d181d7e125596de566ab63a0cb569bb6417058bf43578e71f7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

本指南涵盖一种常见的分离主机设置，其中：

- OpenClaw Gateway 网关运行在 WSL2 中
- Chrome 运行在 Windows 上
- 浏览器控制必须跨越 WSL2/Windows 边界

它还涵盖了 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 中的分层故障模式：多个独立问题可能会同时出现，这会让错误的那一层看起来像是最先坏掉的部分。

## 先选择正确的浏览器模式

你有两种有效模式：

### 方案 1：从 WSL2 到 Windows 的原始远程 CDP

使用一个远程浏览器配置档，让它从 WSL2 指向 Windows 上的 Chrome CDP 端点。

在以下情况下选择它：

- Gateway 网关保持运行在 WSL2 中
- Chrome 运行在 Windows 上
- 你需要让浏览器控制跨越 WSL2/Windows 边界

### 方案 2：主机本地 Chrome MCP

只有当 Gateway 网关本身运行在与 Chrome 相同的主机上时，才使用 `existing-session` / `user`。

在以下情况下选择它：

- OpenClaw 和 Chrome 运行在同一台机器上
- 你希望使用本地已登录浏览器状态
- 你不需要跨主机浏览器传输
- 你不需要高级的仅限受管/raw-CDP 的路径，例如 `responsebody`、PDF
  导出、下载拦截或批处理操作

对于 WSL2 Gateway 网关 + Windows Chrome，请优先选择原始远程 CDP。Chrome MCP 是主机本地机制，不是 WSL2 到 Windows 的桥接方案。

## 可工作的架构

参考结构：

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中通过 `http://127.0.0.1:18789/` 打开 Control UI
- Windows 上的 Chrome 在端口 `9222` 暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器配置档指向一个从 WSL2 可达的地址

## 为什么这个设置容易让人困惑

多个故障可能重叠出现：

- WSL2 无法访问 Windows CDP 端点
- Control UI 从不安全来源打开
- `gateway.controlUi.allowedOrigins` 与页面来源不匹配
- token 或配对缺失
- 浏览器配置档指向了错误地址

因此，修复其中一层后，仍然可能继续看到另一层的错误。

## Control UI 的关键规则

当 UI 从 Windows 打开时，请使用 Windows localhost，除非你明确设置了 HTTPS。

使用：

`http://127.0.0.1:18789/`

不要默认对 Control UI 使用 LAN IP。LAN 或 tailnet 地址上的纯 HTTP 可能会触发不安全来源/设备认证行为，而这些问题本身与 CDP 无关。请参阅 [Control UI](/zh-CN/web/control-ui)。

## 分层验证

请自上而下排查。不要跳步。

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

如果这里失败，那问题还不在 OpenClaw。

### 第 2 层：验证 WSL2 是否能访问这个 Windows 端点

在 WSL2 中，测试你计划在 `cdpUrl` 中使用的准确地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

理想结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开页面，空数组也没问题）

如果这里失败：

- Windows 还没有把该端口暴露给 WSL2
- 该地址对 WSL2 来说是错误的
- 防火墙 / 端口转发 / 本地代理仍然缺失

在修改 OpenClaw 配置之前，先修复这一层。

### 第 3 层：配置正确的浏览器配置档

对于原始远程 CDP，请将 OpenClaw 指向从 WSL2 可达的地址：

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

- 使用从 WSL2 可达的地址，而不是只在 Windows 上可用的地址
- 对外部受管浏览器保持 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 自动发现 `/json/version` 时，请使用 HTTP(S)
- 只有当浏览器 provider 直接给出 DevTools socket URL 时，才使用 WS(S)
- 在期望 OpenClaw 成功之前，请先用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面来源是否与 `gateway.controlUi.allowedOrigins` 的预期匹配
- token 认证或配对是否已正确配置
- 你是否把 Control UI 认证问题误当成浏览器问题在调试

有帮助的页面：

- [Control UI](/zh-CN/web/control-ui)

### 第 5 层：验证端到端浏览器控制

在 WSL2 中：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

理想结果：

- 标签页在 Windows Chrome 中打开
- `openclaw browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）都能在同一个配置档下工作

## 常见误导性错误

请将每条消息视为某一层的线索：

- `control-ui-insecure-auth`
  - UI 来源 / 安全上下文问题，不是 CDP 传输问题
- `token_missing`
  - 认证配置问题
- `pairing required`
  - 设备批准问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问已配置的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端点有响应，但 DevTools WebSocket 仍然无法打开
- 远程会话结束后仍残留旧的 viewport / dark-mode / locale / offline 覆盖
  - 运行 `openclaw browser stop --browser-profile remote`
  - 这会关闭活动控制会话并释放 Playwright/CDP 仿真状态，而无需重启 gateway 或外部浏览器
- `gateway timeout after 1500ms`
  - 往往仍然是 CDP 可达性问题，或远程端点过慢/不可达
- `No Chrome tabs found for profile="user"`
  - 选择了本地 Chrome MCP 配置档，但主机本地没有可用标签页

## 快速排查清单

1. Windows：`curl http://127.0.0.1:9222/json/version` 能成功吗？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 能成功吗？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了那个确切的、对 WSL2 可达的地址？
4. Control UI：你打开的是 `http://127.0.0.1:18789/`，而不是某个 LAN IP 吗？
5. 你是否试图在 WSL2 和 Windows 之间使用 `existing-session`，而不是原始远程 CDP？

## 实际结论

这种设置通常是可行的。困难之处在于，浏览器传输、Control UI 来源安全以及 token/配对都可能各自独立失败，而且从用户角度看，它们的表现很相似。

如果拿不准：

- 先在 Windows 本地验证 Chrome 端点
- 再从 WSL2 验证同一个端点
- 只有在这之后，才去调试 OpenClaw 配置或 Control UI 认证
