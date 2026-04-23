---
read_when:
    - 你想在 Linux 服务器或云 VPS 上运行 Gateway 网关
    - 你需要一份托管指南的快速导览
    - 你想要适用于 OpenClaw 的通用 Linux 服务器调优指南
sidebarTitle: Linux Server
summary: 在 Linux 服务器或云 VPS 上运行 OpenClaw —— 提供商选择器、架构和调优
title: Linux 服务器
x-i18n:
    generated_at: "2026-04-23T04:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Linux 服务器

在任何 Linux 服务器或云 VPS 上运行 OpenClaw Gateway 网关。本页可帮助你选择提供商，解释云部署的工作方式，并介绍适用于各类环境的通用 Linux 调优方法。

## 选择提供商

<CardGroup cols={2}>
  <Card title="Railway" href="/zh-CN/install/railway">一键式浏览器设置</Card>
  <Card title="Northflank" href="/zh-CN/install/northflank">一键式浏览器设置</Card>
  <Card title="DigitalOcean" href="/zh-CN/install/digitalocean">简单的付费 VPS</Card>
  <Card title="Oracle Cloud" href="/zh-CN/install/oracle">永久免费 ARM 层级</Card>
  <Card title="Fly.io" href="/zh-CN/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/zh-CN/install/hetzner">在 Hetzner VPS 上运行 Docker</Card>
  <Card title="Hostinger" href="/zh-CN/install/hostinger">带一键设置的 VPS</Card>
  <Card title="GCP" href="/zh-CN/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/zh-CN/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/zh-CN/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Raspberry Pi" href="/zh-CN/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费层级）** 也运行良好。
社区视频演示可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
查看（社区资源——可能会失效）。

## 云部署如何工作

- **Gateway 网关运行在 VPS 上**，并负责状态和工作区。
- 你可以通过 **Control UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为事实来源，并定期**备份**状态和工作区。
- 安全默认做法：将 Gateway 网关保持在 loopback 上，并通过 SSH 隧道或 Tailscale Serve 访问它。
  如果你绑定到 `lan` 或 `tailnet`，请启用 `gateway.auth.token` 或 `gateway.auth.password`。

相关页面：[Gateway 网关远程访问](/zh-CN/gateway/remote)、[平台中心](/zh-CN/platforms)。

## VPS 上的共享公司智能体

当所有用户都处于同一信任边界内，且该智能体仅用于业务场景时，在团队中运行单个智能体是一种可行的设置。

- 将其放在专用运行环境中（VPS/VM/容器 + 专用 OS 用户/账户）。
- 不要让该运行环境登录个人 Apple/Google 账户，或个人浏览器/密码管理器配置。
- 如果用户彼此之间存在对抗风险，请按 gateway/主机/OS 用户进行拆分。

安全模型详情参见：[Security](/zh-CN/gateway/security)。

## 在 VPS 中使用节点

你可以将 Gateway 网关保留在云端，并在本地设备上配对**节点**
（Mac/iOS/Android/无头环境）。节点提供本地屏幕/摄像头/canvas 和 `system.run`
能力，而 Gateway 网关则保留在云端。

文档：[节点](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

## 小型 VM 和 ARM 主机的启动调优

如果在低性能 VM（或 ARM 主机）上 CLI 命令感觉较慢，可以启用 Node 的模块编译缓存：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可提升重复执行命令时的启动速度。
- `OPENCLAW_NO_RESPAWN=1` 可避免自重启路径带来的额外启动开销。
- 第一次运行命令会预热缓存；后续运行会更快。
- 有关 Raspberry Pi 的具体说明，请参见 [Raspberry Pi](/zh-CN/install/raspberry-pi)。

### `systemd` 调优清单（可选）

对于使用 `systemd` 的 VM 主机，可以考虑：

- 为服务添加环境变量，以获得稳定的启动路径：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 保持重启行为明确：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 优先使用基于 SSD 的磁盘来存放状态/缓存路径，以减少随机 I/O 冷启动带来的性能损失。

对于标准的 `openclaw onboard --install-daemon` 路径，请编辑用户单元：

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

如果你是有意安装了系统单元，请改用
`sudo systemctl edit openclaw-gateway.service` 编辑
`openclaw-gateway.service`。

关于 `Restart=` 策略如何帮助自动恢复：
[systemd 可以自动执行服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

关于 Linux OOM 行为、子进程受害者选择以及 `exit 137`
诊断，请参见 [Linux 内存压力和 OOM 终止](/zh-CN/platforms/linux#memory-pressure-and-oom-kills)。
