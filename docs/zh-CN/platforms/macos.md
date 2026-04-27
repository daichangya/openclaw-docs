---
read_when:
    - 实现 macOS 应用功能
    - 更改 macOS 上的 gateway 生命周期或节点桥接
summary: OpenClaw macOS 配套应用（菜单栏 + gateway broker）
title: macOS 应用
x-i18n:
    generated_at: "2026-04-27T06:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 15
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它负责权限管理、
在本地管理 / 附加到 Gateway 网关（launchd 或手动），并将 macOS
能力作为节点暴露给智能体。

## 它的作用

- 在菜单栏中显示原生通知和状态。
- 负责 TCC 提示（通知、辅助功能、屏幕录制、麦克风、
  语音识别、自动化 / AppleScript）。
- 运行或连接到 Gateway 网关（本地或远程）。
- 暴露仅限 macOS 的工具（Canvas、相机、屏幕录制、`system.run`）。
- 在**远程**模式下启动本地节点主机服务（launchd），并在**本地**模式下停止它。
- 可选地托管 **PeekabooBridge** 以进行 UI 自动化。
- 可根据请求通过 npm、pnpm 或 bun 安装全局 CLI（`openclaw`）（应用优先选择 npm，其次是 pnpm，再其次是 bun；Node 仍然是推荐的 Gateway 网关运行时）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地 Gateway 网关，应用会附加到它；
  否则会通过 `openclaw gateway install` 启用 launchd 服务。
- **远程**：应用通过 SSH / Tailscale 连接到 Gateway 网关，且绝不会启动
  本地进程。
  应用会启动本地**节点主机服务**，以便远程 Gateway 网关可以访问这台 Mac。
  应用不会将 Gateway 网关作为子进程启动。
  Gateway 网关发现现在会优先使用 Tailscale MagicDNS 名称，而不是原始 tailnet IP，
  因此当 tailnet IP 发生变化时，Mac 应用可以更可靠地恢复。

## Launchd 控制

应用管理一个每用户 LaunchAgent，标签为 `ai.openclaw.gateway`
（使用 `--profile` / `OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 仍可卸载）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

如果运行的是命名配置文件，请将标签替换为 `ai.openclaw.<profile>`。

如果 LaunchAgent 尚未安装，请在应用中启用它，或运行
`openclaw gateway install`。

## 节点能力（mac）

macOS 应用将自身呈现为一个节点。常见命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- 相机：`camera.snap`、`camera.clip`
- 屏幕：`screen.snapshot`、`screen.record`
- 系统：`system.run`、`system.notify`

该节点会报告一个 `permissions` 映射，以便智能体判断允许执行哪些操作。

节点服务 + 应用 IPC：

- 当无界面的节点主机服务运行时（远程模式），它会作为节点连接到 Gateway 网关 WS。
- `system.run` 会通过本地 Unix socket 在 macOS 应用中执行（UI / TCC 上下文）；提示和输出都保留在应用内。

图示（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec 审批（`system.run`）

`system.run` 由 macOS 应用中的 **Exec approvals** 控制（设置 → Exec approvals）。
安全策略 + 询问行为 + allowlist 存储在这台 Mac 本地的：

```
~/.openclaw/exec-approvals.json
```

示例：

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

说明：

- `allowlist` 条目是针对已解析二进制路径的 glob 模式，或者针对通过 PATH 调用命令的裸命令名。
- 包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文本会被视为 allowlist 未命中，并需要显式审批（或将 shell 二进制加入 allowlist）。
- 在提示中选择 “Always Allow” 会将该命令加入 allowlist。
- `system.run` 的环境变量覆盖会被过滤（丢弃 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然后与应用环境合并。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境变量覆盖会缩减为一个很小的显式 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于 allowlist 模式下的始终允许决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何 allowlist 条目。

## 深层链接

应用会为本地操作注册 `openclaw://` URL scheme。

### `openclaw://agent`

触发一个 Gateway 网关 `agent` 请求。
__OC_I18N_900004__
查询参数：

- `message`（必填）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选的无人值守模式密钥）

安全性：

- 没有 `key` 时，应用会提示确认。
- 没有 `key` 时，应用会对确认提示施加较短的消息长度限制，并忽略 `deliver` / `to` / `channel`。
- 有效 `key` 存在时，运行将以无人值守方式进行（适用于个人自动化）。

## 新手引导流程（典型）

1. 安装并启动 **OpenClaw.app**。
2. 完成权限检查清单（TCC 提示）。
3. 确保已启用**本地**模式，且 Gateway 网关正在运行。
4. 如果你想使用终端访问，则安装 CLI。

## 状态目录位置（macOS）

避免将你的 OpenClaw 状态目录放在 iCloud 或其他云同步文件夹中。
带同步的路径会增加延迟，并且偶尔会导致
会话和凭证的文件锁 / 同步竞争。

优先使用本地非同步状态路径，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 检测到状态目录位于：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它会发出警告，并建议迁回本地路径。

## 构建与开发工作流（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或使用 Xcode）
- 打包应用：`scripts/package-mac-app.sh`

## 调试 Gateway 网关连接（macOS CLI）

使用调试 CLI 可以在不启动应用的情况下，演练与 macOS 应用相同的 Gateway 网关 WebSocket 握手和发现
逻辑。
__OC_I18N_900006__
连接选项：

- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置解析（默认：配置值或 local）
- `--probe`：强制执行新的健康探测
- `--timeout <ms>`：请求超时（默认：`15000`）
- `--json`：用于差异比较的结构化输出

发现选项：

- `--include-local`：包含本会被过滤为“本地”的 gateway
- `--timeout <ms>`：整体发现窗口（默认：`2000`）
- `--json`：用于差异比较的结构化输出

<Tip>
与 `openclaw gateway discover --json` 对比，查看 macOS 应用的发现流水线（`local.` 加上已配置的广域域名，并带有广域和 Tailscale Serve 回退）是否与节点 CLI 基于 `dns-sd` 的发现结果不同。
</Tip>

## 远程连接管线（SSH 隧道）

当 macOS 应用以**远程**模式运行时，它会打开一个 SSH 隧道，使本地 UI
组件能够像连接 localhost 一样连接远程 Gateway 网关。

### 控制隧道（Gateway WebSocket 端口）

- **用途：** 健康检查、状态、Web Chat、配置及其他控制平面调用。
- **本地端口：** Gateway 网关端口（默认 `18789`），始终稳定。
- **远程端口：** 远程主机上的同一 Gateway 网关端口。
- **行为：** 不使用随机本地端口；应用会复用现有健康隧道，
  或在需要时重启它。
- **SSH 形式：** `ssh -N -L <local>:127.0.0.1:<remote>`，并带有 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告：** SSH 隧道使用 loopback，因此 gateway 会将节点
  IP 视为 `127.0.0.1`。如果你希望显示真实客户端
  IP，请使用**直接（ws / wss）**传输方式（参见 [macOS remote access](/zh-CN/platforms/mac/remote)）。

有关设置步骤，请参见 [macOS remote access](/zh-CN/platforms/mac/remote)。有关协议
细节，请参见 [Gateway protocol](/zh-CN/gateway/protocol)。

## 相关文档

- [Gateway runbook](/zh-CN/gateway)
- [Gateway (macOS)](/zh-CN/platforms/mac/bundled-gateway)
- [macOS permissions](/zh-CN/platforms/mac/permissions)
- [Canvas](/zh-CN/platforms/mac/canvas)
