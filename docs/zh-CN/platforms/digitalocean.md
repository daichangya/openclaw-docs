---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 在寻找适合 OpenClaw 的低价 VPS 托管
summary: 在 DigitalOcean 上运行 OpenClaw（简单的付费 VPS 选项）
title: DigitalOcean（平台）
x-i18n:
    generated_at: "2026-04-23T20:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3783fd8036e1a6c5239fe50e61e369f1abc410a8bf027c241c053c3e4082a19c
    source_path: platforms/digitalocean.md
    workflow: 15
---

# 在 DigitalOcean 上运行 OpenClaw

## 目标

在 DigitalOcean 上以 **6 美元/月**（或预留定价 **4 美元/月**）运行一个持久化的 OpenClaw Gateway 网关。

如果你想要 **0 美元/月** 的方案，并且不介意 ARM + 提供商特定设置，请参见 [Oracle Cloud 指南](/zh-CN/install/oracle)。

## 成本对比（2026）

| 提供商 | 套餐 | 规格 | 月价 | 说明 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU、24GB RAM | $0 | ARM，容量有限 / 注册可能较麻烦 |
| Hetzner | CX22 | 2 vCPU、4GB RAM | €3.79（约 $4） | 最便宜的付费选项 |
| DigitalOcean | Basic | 1 vCPU、1GB RAM | $6 | 界面简单，文档完善 |
| Vultr | Cloud Compute | 1 vCPU、1GB RAM | $6 | 可选地点多 |
| Linode | Nanode | 1 vCPU、1GB RAM | $5 | 现属于 Akamai |

**如何选择提供商：**

- DigitalOcean：最简单的 UX + 可预测的设置（本指南）
- Hetzner：价格/性能优秀（请参见 [Hetzner 指南](/zh-CN/install/hetzner)）
- Oracle Cloud：可以做到 0 美元/月，但更挑环境且仅支持 ARM（请参见 [Oracle 指南](/zh-CN/install/oracle)）

---

## 前置条件

- DigitalOcean 账户（[注册可获得 200 美元免费额度](https://m.do.co/c/signup)）
- SSH 密钥对（或愿意使用密码认证）
- 约 20 分钟

## 1）创建 Droplet

<Warning>
请使用干净的基础镜像（Ubuntu 24.04 LTS）。避免使用第三方 Marketplace 一键镜像，除非你已经审查过它们的启动脚本和防火墙默认值。
</Warning>

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击 **Create → Droplets**
3. 选择：
   - **Region：** 离你（或你的用户）最近
   - **Image：** Ubuntu 24.04 LTS
   - **Size：** Basic → Regular → **6 美元/月**（1 vCPU、1GB RAM、25GB SSD）
   - **Authentication：** SSH 密钥（推荐）或密码
4. 点击 **Create Droplet**
5. 记下 IP 地址

## 2）通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3）安装 OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4）运行新手引导

```bash
openclaw onboard --install-daemon
```

向导会引导你完成：

- 模型认证（API 密钥或 OAuth）
- 渠道设置（Telegram、WhatsApp、Discord 等）
- Gateway token（自动生成）
- 守护进程安装（systemd）

## 5）验证 Gateway 网关

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6）访问控制面板

gateway 默认绑定到 loopback。若要访问 Control UI：

**选项 A：SSH 隧道（推荐）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**选项 B：Tailscale Serve（HTTPS，仅 loopback）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开：`https://<magicdns>/`

说明：

- Serve 会让 Gateway 保持仅 loopback 可访问，并通过 Tailscale 身份标头对 Control UI/WebSocket 流量进行认证（无 token 认证假定 gateway 主机受信任；HTTP API 不使用这些 Tailscale 标头，而是遵循 gateway 的常规 HTTP 认证模式）。
- 如果你希望改为要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

**选项 C：Tailnet 绑定（不使用 Serve）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开：`http://<tailscale-ip>:18789`（需要 token）。

## 7）连接你的渠道

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

其他提供商请参见 [Channels](/zh-CN/channels)。

---

## 面向 1GB RAM 的优化

6 美元的 droplet 只有 1GB RAM。为了保持运行平稳：

### 添加 swap（推荐）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用更轻量的模型

如果你遇到 OOM，请考虑：

- 使用基于 API 的模型（Claude、GPT），而不是本地模型
- 将 `agents.defaults.model.primary` 设置为更小的模型

### 监控内存

```bash
free -h
htop
```

---

## 持久化

所有状态位于：

- `~/.openclaw/` —— `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据
- `~/.openclaw/workspace/` —— 工作区（SOUL.md、记忆等）

这些内容会在重启后保留。请定期备份：

```bash
openclaw backup create
```

---

## Oracle Cloud 免费替代方案

Oracle Cloud 提供 **Always Free** ARM 实例，其性能远高于这里的任何付费选项 —— 且费用为 0 美元/月。

| 你将获得 | 规格 |
| ----------------- | ---------------------- |
| **4 OCPUs** | ARM Ampere A1 |
| **24GB RAM** | 远远足够 |
| **200GB 存储** | 块存储 |
| **永久免费** | 无信用卡扣费 |

**注意事项：**

- 注册过程可能比较挑剔（若失败请重试）
- ARM 架构 —— 大多数内容都能工作，但某些二进制需要 ARM 构建版本

完整设置指南请参见 [Oracle Cloud](/zh-CN/install/oracle)。有关注册技巧和注册流程故障排除，请参见这份[社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 故障排除

### Gateway 网关无法启动

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 端口已被占用

```bash
lsof -i :18789
kill <PID>
```

### 内存不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 另请参见

- [Hetzner guide](/zh-CN/install/hetzner) —— 更便宜、更强大
- [Docker install](/zh-CN/install/docker) —— 容器化设置
- [Tailscale](/zh-CN/gateway/tailscale) —— 安全的远程访问
- [Configuration](/zh-CN/gateway/configuration) —— 完整配置参考
