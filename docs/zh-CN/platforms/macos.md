---
read_when:
    - 实现 macOS 应用功能
    - 更改 macOS 上的 Gateway 网关生命周期或节点桥接 аиҳабы to=final code omitted
summary: OpenClaw macOS 配套应用（菜单栏 + Gateway 网关代理）
title: macOS 应用
x-i18n:
    generated_at: "2026-04-23T20:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它负责权限管理，
在本地管理/附加到 Gateway 网关（launchd 或手动），并将 macOS
能力作为节点暴露给智能体。

## 它能做什么

- 在菜单栏中显示原生通知和状态。
- 持有 TCC 提示（通知、辅助功能、屏幕录制、麦克风、
  语音识别、自动化/AppleScript）。
- 运行或连接到 Gateway 网关（本地或远程）。
- 暴露仅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**远程**模式下启动本地节点主机服务（launchd），并在**本地**模式下停止它。
- 可选托管 **PeekabooBridge**，用于 UI 自动化。
- 按需通过 npm、pnpm 或 bun 安装全局 CLI（`openclaw`）（应用优先使用 npm，然后 pnpm，再然后 bun；Node 仍然是推荐的 Gateway 网关运行时）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地 Gateway 网关，应用会附加到它；
  否则会通过 `openclaw gateway install` 启用 launchd 服务。
- **远程**：应用通过 SSH/Tailscale 连接到 Gateway 网关，且绝不会启动
  本地进程。
  应用会启动本地的**节点主机服务**，这样远程 Gateway 网关就可以访问这台 Mac。
  应用不会把 Gateway 网关作为子进程拉起。
  Gateway 网关发现现在会优先使用 Tailscale MagicDNS 名称，而不是原始 tailnet IP，
  因此当 tailnet IP 发生变化时，Mac 应用恢复得更可靠。

## Launchd 控制

应用会管理一个按用户划分的 LaunchAgent，标签为 `ai.openclaw.gateway`
（当使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 仍可卸载）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

如果使用的是具名 profile，请将标签替换为 `ai.openclaw.<profile>`。

如果 LaunchAgent 尚未安装，请从应用中启用它，或运行
`openclaw gateway install`。

## 节点能力（mac）

macOS 应用会将自己呈现为一个节点。常见命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

该节点会上报一个 `permissions` 映射，以便智能体判断哪些操作被允许。

节点服务 + 应用 IPC：

- 当无头节点主机服务正在运行（远程模式）时，它会作为节点连接到 Gateway 网关 WS。
- `system.run` 会在 macOS 应用中执行（UI/TCC 上下文），通过本地 Unix 套接字；提示和输出都保留在应用内。

图示（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec 审批（`system.run`）

`system.run` 由 macOS 应用中的**Exec 审批**控制（Settings → Exec approvals）。
安全性 + 询问策略 + 允许列表会本地存储在 Mac 上：

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

- `allowlist` 条目是针对已解析二进制路径的 glob 模式。
- 含有 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文本会被视为允许列表未命中，因此需要显式批准（或将 shell 二进制加入允许列表）。
- 在提示中选择 “Always Allow” 会将该命令添加到允许列表。
- `system.run` 的环境变量覆盖项会被过滤（会丢弃 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然后与应用环境合并。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域内的环境变量覆盖项会被缩减为一个较小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于允许列表模式中的“始终允许”决策，已知调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化其内部可执行路径，而不是包装器路径。如果无法安全解包，则不会自动持久化允许列表条目。

## Deep links

应用注册了 `openclaw://` URL scheme，用于本地操作。

### `openclaw://agent`

会触发一次 Gateway 网关 `agent` 请求。
__OC_I18N_900004__
查询参数：

- `message`（必填）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选，无人值守模式密钥）

安全性：

- 如果没有 `key`，应用会提示确认。
- 如果没有 `key`，应用会对确认提示中的消息长度施加较短限制，并忽略 `deliver` / `to` / `channel`。
- 如果提供有效的 `key`，则该运行是无人值守的（适用于个人自动化）。

## 新手引导流程（典型）

1. 安装并启动 **OpenClaw.app**。
2. 完成权限检查清单（TCC 提示）。
3. 确保启用了**本地**模式，并且 Gateway 网关正在运行。
4. 如果你希望使用终端访问，请安装 CLI。

## 状态目录放置（macOS）

请避免将 OpenClaw 状态目录放在 iCloud 或其他云同步文件夹中。
基于同步的路径会增加延迟，并且偶尔会对
会话和凭证造成文件锁/同步竞争。

优先使用本地的非同步状态路径，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 检测到状态目录位于以下路径下：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它会发出警告，并建议迁移回本地路径。

## 构建与开发工作流（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或使用 Xcode）
- 打包应用：`scripts/package-mac-app.sh`

## 调试 Gateway 网关连接性（macOS CLI）

使用调试 CLI 可以在不启动应用的情况下，验证与 macOS 应用相同的 Gateway 网关 WebSocket 握手和发现
逻辑。
__OC_I18N_900006__
连接选项：

- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置解析（默认：配置值或 local）
- `--probe`：强制执行新的健康探测
- `--timeout <ms>`：请求超时（默认：`15000`）
- `--json`：用于 diff 的结构化输出

发现选项：

- `--include-local`：包括那些原本会被过滤为“local”的 Gateway 网关
- `--timeout <ms>`：整体发现窗口（默认：`2000`）
- `--json`：用于 diff 的结构化输出

提示：可与 `openclaw gateway discover --json` 对比，查看
macOS 应用的发现流水线（`local.` 加上已配置的广域域名，并带有
广域和 Tailscale Serve 回退）是否与
Node CLI 基于 `dns-sd` 的发现不同。

## 远程连接底层机制（SSH 隧道）

当 macOS 应用运行在**远程**模式时，它会打开一个 SSH 隧道，以便本地 UI
组件能够像访问 localhost 一样访问远程 Gateway 网关。

### 控制隧道（Gateway 网关 WebSocket 端口）

- **目的：** 健康检查、状态、Web Chat、配置以及其他控制平面调用。
- **本地端口：** Gateway 网关端口（默认 `18789`），始终稳定。
- **远程端口：** 远程主机上的同一个 Gateway 网关端口。
- **行为：** 不使用随机本地端口；应用会复用已有的健康隧道，
  或在需要时重新启动它。
- **SSH 形式：** `ssh -N -L <local>:127.0.0.1:<remote>`，附带 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告：** SSH 隧道使用 loopback，因此 Gateway 网关会看到节点
  IP 为 `127.0.0.1`。如果你希望显示真实客户端
  IP，请使用 **Direct (ws/wss)** 传输（参见 [macOS 远程访问](/zh-CN/platforms/mac/remote)）。

设置步骤请参见 [macOS 远程访问](/zh-CN/platforms/mac/remote)。协议
细节请参见 [Gateway 网关协议](/zh-CN/gateway/protocol)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关（macOS）](/zh-CN/platforms/mac/bundled-gateway)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
- [Canvas](/zh-CN/platforms/mac/canvas)
