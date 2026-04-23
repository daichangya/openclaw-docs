---
read_when:
    - 在 Windows 上安装 OpenClaw
    - 在原生 Windows 和 WSL2 之间做选择
    - 查找 Windows 配套应用状态
summary: Windows 支持：原生与 WSL2 安装路径、守护进程和当前注意事项
title: Windows
x-i18n:
    generated_at: "2026-04-23T20:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa786e417e06b245dea4aacdccc63345baa978bf4746a2f0c1df7adb5d1a42ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw 同时支持**原生 Windows** 和 **WSL2**。WSL2 是更稳定的路径，也是获得完整体验的推荐方案——CLI、Gateway 网关和工具链都在 Linux 内运行，并具备完整兼容性。原生 Windows 也可用于核心 CLI 和 Gateway 网关使用，但有一些下文提到的注意事项。

原生 Windows 配套应用正在规划中。

## WSL2（推荐）

- [入门指南](/zh-CN/start/getting-started)（请在 WSL 内使用）
- [安装与更新](/zh-CN/install/updating)
- 官方 WSL2 指南（Microsoft）：[https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## 原生 Windows 状态

原生 Windows CLI 流程正在持续改进，但 WSL2 仍是推荐路径。

当前在原生 Windows 上运行良好的内容包括：

- 通过 `install.ps1` 使用网站安装器
- 本地 CLI 用法，例如 `openclaw --version`、`openclaw doctor` 和 `openclaw plugins list --json`
- 内置本地智能体/提供商的 smoke 测试，例如：

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

当前注意事项：

- `openclaw onboard --non-interactive` 仍然要求本地 gateway 可访问，除非你传入 `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` 和 `openclaw gateway install` 会优先尝试 Windows Scheduled Tasks
- 如果创建 Scheduled Task 被拒绝，OpenClaw 会回退为当前用户 Startup 文件夹中的登录启动项，并立即启动 gateway
- 如果 `schtasks` 本身卡住或停止响应，OpenClaw 现在会快速中止该路径并回退，而不是永久挂起
- 当可用时，仍优先使用 Scheduled Tasks，因为它们提供更好的 supervisor 状态

如果你只想使用原生 CLI，而不安装 gateway 服务，请使用以下任一命令：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

如果你确实希望在原生 Windows 上使用托管启动：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果 Scheduled Task 创建被阻止，则回退服务模式仍会通过当前用户的 Startup 文件夹在登录后自动启动。

## Gateway 网关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [配置](/zh-CN/gateway/configuration)

## Gateway 网关服务安装（CLI）

在 WSL2 内：

```
openclaw onboard --install-daemon
```

或者：

```
openclaw gateway install
```

或者：

```
openclaw configure
```

在提示时选择 **Gateway service**。

修复/迁移：

```
openclaw doctor
```

## Windows 登录前自动启动 Gateway 网关

对于无头设置，请确保完整启动链在无人登录 Windows 时也能运行。

### 1）让用户服务在未登录时也保持运行

在 WSL 内：

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2）安装 OpenClaw gateway 用户服务

在 WSL 内：

```bash
openclaw gateway install
```

### 3）让 WSL 在 Windows 启动时自动启动

以管理员身份运行 PowerShell：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

请将 `Ubuntu` 替换为你从以下命令获取的发行版名称：

```powershell
wsl --list --verbose
```

### 验证启动链

在重启后（Windows 登录前），可从 WSL 中检查：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高级：通过 LAN 暴露 WSL 服务（portproxy）

WSL 有自己的虚拟网络。如果另一台机器需要访问**运行在 WSL 内部**的服务（SSH、本地 TTS 服务器或 Gateway 网关），你必须将一个 Windows 端口转发到当前的 WSL IP。WSL IP 会在重启后变化，因此你可能需要刷新转发规则。

示例（以**管理员**身份运行 PowerShell）：

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

- 另一台机器上的 SSH 应连接到**Windows 主机 IP**（例如：`ssh user@windows-host -p 2222`）。
- 远程节点必须指向一个**可达的** Gateway 网关 URL（而不是 `127.0.0.1`）；请使用
  `openclaw status --all` 进行确认。
- 若要允许局域网访问，请使用 `listenaddress=0.0.0.0`；若使用 `127.0.0.1`，则仅本机可访问。
- 如果你希望自动化这一过程，可以注册一个 Scheduled Task，在登录时执行刷新步骤。

## 分步 WSL2 安装

### 1）安装 WSL2 + Ubuntu

打开 PowerShell（管理员）：

```powershell
wsl --install
# 或显式选择某个发行版：
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 提示，请重启。

### 2）启用 systemd（gateway 安装所必需）

在你的 WSL 终端中：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后在 PowerShell 中：

```powershell
wsl --shutdown
```

重新打开 Ubuntu，然后验证：

```bash
systemctl --user status
```

### 3）安装 OpenClaw（在 WSL 内）

对于在 WSL 内进行的正常首次设置，请遵循 Linux 入门指南流程：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

如果你是在从源码开发，而不是进行首次新手引导，请使用
[设置](/zh-CN/start/setup) 中的源码开发循环：

```bash
pnpm install
# 仅首次运行时（或重置本地 OpenClaw 配置/工作区之后）
pnpm openclaw setup
pnpm gateway:watch
```

完整指南：[入门指南](/zh-CN/start/getting-started)

## Windows 配套应用

我们目前还没有 Windows 配套应用。如果你希望推动这件事发生，欢迎贡献。
