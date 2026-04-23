---
read_when:
    - 将 Mac 应用与 Gateway 网关生命周期集成时
summary: macOS 上的 Gateway 网关生命周期（launchd）
title: Gateway 网关生命周期
x-i18n:
    generated_at: "2026-04-23T20:55:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50de056f00cb5d9bfa5e5ea1a4efd5a37059910a2762903147aa8bfccf6202e4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS 上的 Gateway 网关生命周期

macOS 应用默认**通过 launchd 管理 Gateway 网关**，不会将
Gateway 网关作为子进程启动。它会先尝试附加到已在配置端口上运行的
Gateway 网关；如果没有可达实例，就会通过外部 `openclaw` CLI 启用 launchd
服务（不使用嵌入式运行时）。这样可以提供可靠的登录自动启动和崩溃后重启能力。

子进程模式（由应用直接生成 Gateway 网关）**当前并未使用**。
如果你需要与 UI 更紧密耦合，请在终端中手动运行 Gateway 网关。

## 默认行为（launchd）

- 应用会安装一个按用户划分的 LaunchAgent，标签为 `ai.openclaw.gateway`
  （使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 也受支持）。
- 启用本地模式时，应用会确保 LaunchAgent 已加载，并在需要时启动 Gateway 网关。
- 日志会写入 launchd 的 gateway 日志路径（可在调试设置中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名 profile 时，请将标签替换为 `ai.openclaw.<profile>`。

## 未签名开发构建

当你没有签名密钥时，`scripts/restart-mac.sh --no-sign` 用于快速本地构建。为防止 launchd 指向未签名的 relay 二进制文件，它会：

- 写入 `~/.openclaw/disable-launchagent`。

带签名运行的 `scripts/restart-mac.sh` 会在存在该标记时清除这一覆盖。若要手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅附加模式

若要强制 macOS 应用**永不安装或管理 launchd**，请使用
`--attach-only`（或 `--no-launchd`）启动它。这会设置 `~/.openclaw/disable-launchagent`，
因此应用只会附加到已经运行的 Gateway 网关。你也可以在调试设置中切换相同行为。

## 远程模式

远程模式永远不会启动本地 Gateway 网关。应用会使用 SSH 隧道连接到
远程主机，并通过该隧道建立连接。

## 我们为何偏好 launchd

- 登录时自动启动。
- 内建重启/KeepAlive 语义。
- 可预测的日志与监管行为。

如果将来真的再次需要真正的子进程模式，应将其文档化为
单独的、明确的仅开发模式。
