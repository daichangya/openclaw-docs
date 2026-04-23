---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装 macOS 的 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-04-23T22:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd6fba88297623e5e8bb0a49ab89b7422ff46405c90993e0385dc40c78c1c6af
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用现在依赖**外部**安装的 `openclaw` CLI，不会将 Gateway 网关作为子进程启动，而是管理一个按用户划分的 launchd 服务，以保持 Gateway 网关持续运行（如果本地已有正在运行的 Gateway 网关，则会附加到该实例）。

## 安装 CLI（本地模式必需）

Node 24 是 Mac 上的默认运行时。Node 22 LTS（当前为 `22.14+`）也仍可出于兼容性继续使用。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用中的**Install CLI**按钮会运行与应用内部相同的全局安装流程：它会优先使用 npm，其次是 pnpm，只有在 bun 是唯一检测到的包管理器时才会使用 bun。Node 仍然是推荐的 Gateway 网关运行时。

## launchd（作为 LaunchAgent 运行 Gateway 网关）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）

plist 位置（按用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理者：

- macOS 应用在本地模式下负责 LaunchAgent 的安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw Active” 会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会保持其存活）。
- 如果在已配置端口上已有 Gateway 网关在运行，应用会附加到它，而不是启动一个新的实例。

日志：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用会检查 Gateway 网关版本是否与自身版本匹配。如果两者不兼容，请更新全局 CLI，使其与应用版本一致。

## 冒烟检查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然后：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
