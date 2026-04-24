---
read_when:
    - 在 Windows 上安装 OpenClaw
    - 在原生 Windows 和 WSL2 之间进行选择
    - 想了解 Windows 配套应用状态
summary: Windows 支持：原生安装和 WSL2 安装路径、守护进程，以及当前注意事项
title: Windows
x-i18n:
    generated_at: "2026-04-24T03:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw 同时支持**原生 Windows**和 **WSL2**。WSL2 是更稳定的路径，也是获得完整体验的推荐方式——CLI、Gateway 网关和工具都在 Linux 内运行，并具备完整兼容性。原生 Windows 可用于核心 CLI 和 Gateway 网关使用，但有一些如下所述的注意事项。

原生 Windows 配套应用正在规划中。

## WSL2（推荐）

- [入门指南](/zh-CN/start/getting-started)（请在 WSL 内使用）
- [安装与更新](/zh-CN/install/updating)
- 官方 WSL2 指南（Microsoft）：[https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## 原生 Windows 状态

原生 Windows CLI 流程正在不断改进，但 WSL2 仍然是推荐路径。

目前原生 Windows 上运行良好的内容：

- 通过 `install.ps1` 使用网站安装器
- 本地 CLI 使用，例如 `openclaw --version`、`openclaw doctor` 和 `openclaw plugins list --json`
- 内嵌本地智能体 / 提供商冒烟测试，例如：

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

当前注意事项：

- `openclaw onboard --non-interactive` 仍然要求本地 Gateway 网关可访问，除非你传入 `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` 和 `openclaw gateway install` 会优先尝试 Windows Scheduled Tasks
- 如果 Scheduled Task 创建被拒绝，OpenClaw 会回退为每用户 Startup 文件夹登录项，并立即启动 Gateway 网关
- 如果 `schtasks` 自身卡住或停止响应，OpenClaw 现在会快速中止该路径并回退，而不是永远挂起
- 在可用时仍优先使用 Scheduled Tasks，因为它们能提供更好的 supervisor 状态

如果你只想使用原生 CLI，而不安装 Gateway 网关服务，请使用以下其中一种方式：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

如果你确实想在原生 Windows 上启用托管启动：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果 Scheduled Task 创建被阻止，回退服务模式仍会通过当前用户的 Startup 文件夹在登录后自动启动。

## Gateway 网关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [配置](/zh-CN/gateway/configuration)

## Gateway 网关服务安装（CLI）

在 WSL2 内：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示时选择 **Gateway service**。

修复 / 迁移：

```
openclaw doctor
```

## Windows 登录前的 Gateway 网关自动启动

对于无头部署，请确保完整的启动链即使在无人登录 Windows 时也能运行。

### 1）让用户服务在未登录时继续运行

在 WSL 内：

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2）安装 OpenClaw Gateway 网关用户服务

在 WSL 内：

```bash
openclaw gateway install
```

### 3）在 Windows 启动时自动启动 WSL

在以管理员身份运行的 PowerShell 中：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

将 `Ubuntu` 替换为以下命令输出中的发行版名称：

```powershell
wsl --list --verbose
```

### 验证启动链

重启后（在 Windows 登录前），从 WSL 中检查：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高级：通过 LAN 暴露 WSL 服务（portproxy）

WSL 有自己的虚拟网络。如果另一台机器需要访问**运行在 WSL 内部**的服务
（SSH、本地 TTS 服务器或 Gateway 网关），你必须将 Windows 端口
转发到当前 WSL IP。WSL IP 会在重启后变化，
因此你可能需要刷新转发规则。

示例（以管理员身份运行 PowerShell）：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

允许该端口通过 Windows 防火墙（一次性）：

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

在 WSL 重启后刷新 portproxy：

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

说明：

- 从另一台机器发起 SSH 时，目标应是**Windows 主机 IP**（例如：`ssh user@windows-host -p 2222`）。
- 远程节点必须指向一个**可访问的** Gateway 网关 URL（而不是 `127.0.0.1`）；请使用
  `openclaw status --all` 进行确认。
- 对于 LAN 访问，请使用 `listenaddress=0.0.0.0`；使用 `127.0.0.1` 则仅限本地访问。
- 如果你想自动完成此操作，请注册一个 Scheduled Task，在登录时运行刷新步骤。

## 分步 WSL2 安装

### 1）安装 WSL2 + Ubuntu

打开 PowerShell（管理员）：

```powershell
wsl --install
# 或显式选择发行版：
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 提示，请重启。

### 2）启用 systemd（Gateway 网关安装所必需）

在你的 WSL 终端中：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后在 PowerShell 中运行：

```powershell
wsl --shutdown
```

重新打开 Ubuntu，然后验证：

```bash
systemctl --user status
```

### 3）安装 OpenClaw（在 WSL 内）

如果你是在 WSL 内首次进行普通安装，请遵循 Linux 的 入门指南 流程：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

如果你是在从源码开发，而不是进行首次新手引导，请使用 [设置](/zh-CN/start/setup) 中的
源码开发循环：

```bash
pnpm install
# 仅首次运行（或在重置本地 OpenClaw 配置 / 工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

完整指南： [入门指南](/zh-CN/start/getting-started)

## Windows 配套应用

我们目前还没有 Windows 配套应用。如果你希望推动这件事发生，欢迎贡献。

## 相关内容

- [安装概览](/zh-CN/install)
- [平台](/zh-CN/platforms)
