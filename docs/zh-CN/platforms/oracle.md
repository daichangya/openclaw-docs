---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 在寻找适合 OpenClaw 的低成本 VPS 托管
    - 想在小型服务器上 24/7 运行 OpenClaw
summary: 在 Oracle Cloud 上运行 OpenClaw（Always Free ARM）
title: Oracle Cloud（平台）
x-i18n:
    generated_at: "2026-04-23T20:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4763dd6b111668b1b8ef1f24351f5c79f31b390e6db53cf88089f2c38dfe1670
    source_path: platforms/oracle.md
    workflow: 15
---

# 在 Oracle Cloud（OCI）上运行 OpenClaw

## 目标

在 Oracle Cloud 的 **Always Free** ARM 层上运行持久化的 OpenClaw Gateway 网关。

Oracle 的免费层非常适合 OpenClaw（尤其是如果你已经有 OCI 账户），但它也有一些权衡：

- ARM 架构（大多数内容都能工作，但某些二进制可能仅支持 x86）
- 容量和注册流程可能比较挑剔

## 成本对比（2026）

| 提供商 | 套餐 | 规格 | 月价 | 说明 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU、24GB RAM | $0 | ARM，容量有限 |
| Hetzner | CX22 | 2 vCPU、4GB RAM | ~ $4 | 最便宜的付费选项 |
| DigitalOcean | Basic | 1 vCPU、1GB RAM | $6 | 界面简单，文档完善 |
| Vultr | Cloud Compute | 1 vCPU、1GB RAM | $6 | 可选地点多 |
| Linode | Nanode | 1 vCPU、1GB RAM | $5 | 现属于 Akamai |

---

## 前置条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）—— 如果遇到问题，请参见[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（在 [tailscale.com](https://tailscale.com) 可免费注册）
- 约 30 分钟

## 1）创建 OCI 实例

1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)
2. 进入 **Compute → Instances → Create Instance**
3. 配置：
   - **Name：** `openclaw`
   - **Image：** Ubuntu 24.04（aarch64）
   - **Shape：** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs：** 2（或最多 4）
   - **Memory：** 12 GB（或最多 24 GB）
   - **Boot volume：** 50 GB（最多可免费使用 200 GB）
   - **SSH key：** 添加你的公钥
4. 点击 **Create**
5. 记下公网 IP 地址

**提示：** 如果实例创建因 “Out of capacity” 失败，请尝试不同的可用域，或稍后重试。免费层容量有限。

## 2）连接并更新

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**说明：** `build-essential` 是某些依赖在 ARM 上编译所必需的。

## 3）配置用户和主机名

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4）安装 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

这会启用 Tailscale SSH，因此你可以从 tailnet 上任意设备通过 `ssh openclaw` 连接 —— 不再需要公网 IP。

验证：

```bash
tailscale status
```

**从现在开始，请通过 Tailscale 连接：** `ssh ubuntu@openclaw`（或使用 Tailscale IP）。

## 5）安装 OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

当提示 “How do you want to hatch your bot?” 时，选择 **“Do this later”**。

> 说明：如果你遇到 ARM 原生构建问题，请先从系统包开始（例如 `sudo apt install -y build-essential`），再考虑使用 Homebrew。

## 6）配置 Gateway 网关（loopback + token 认证）并启用 Tailscale Serve

将 token 认证作为默认方式。这样更可预测，也避免需要任何 “insecure auth” 的 Control UI 标志。

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

此处的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的 forwarded-IP/local-client 处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置下，Diff 查看器路由仍保持关闭失败行为：如果原始 `127.0.0.1` 查看器请求没有转发代理头，可能会返回 `Diff not found`。如需附件，请使用 `mode=file` / `mode=both`；如果你需要可共享的查看器链接，请有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

## 7）验证

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8）锁定 VCN 安全策略

现在一切运行正常后，请锁定 VCN，仅允许 Tailscale 流量。OCI 的 Virtual Cloud Network 会在网络边界充当防火墙 —— 流量会在到达实例之前就被阻止。

1. 在 OCI Console 中进入 **Networking → Virtual Cloud Networks**
2. 点击你的 VCN → **Security Lists** → Default Security List
3. **删除**除以下规则之外的所有入站规则：
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. 保留默认出站规则（允许所有出站）

这样会在网络边界阻止 22 端口 SSH、HTTP、HTTPS 以及其他所有流量。从现在开始，你只能通过 Tailscale 连接。

---

## 访问 Control UI

从你的 Tailscale 网络中的任意设备访问：

```
https://openclaw.<tailnet-name>.ts.net/
```

请将 `<tailnet-name>` 替换为你的 tailnet 名称（可通过 `tailscale status` 查看）。

无需 SSH 隧道。Tailscale 提供：

- HTTPS 加密（自动证书）
- 通过 Tailscale 身份进行认证
- 可从 tailnet 上任意设备访问（笔记本、手机等）

---

## 安全：VCN + Tailscale（推荐基线）

当 VCN 已锁定（仅开放 UDP 41641），且 Gateway 网关绑定到 loopback 时，你将获得很强的纵深防御：公网流量会在网络边界被阻止，而管理访问则通过你的 tailnet 进行。

这种设置通常会消除仅为阻止互联网范围 SSH 暴力破解而额外配置主机防火墙的_必要性_ —— 但你仍应保持系统更新、运行 `openclaw security audit`，并验证你没有意外监听公网接口。

### 已经得到保护的项目

| 传统步骤 | 还需要吗？ | 原因 |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW 防火墙 | 否 | VCN 会在流量到达实例前阻止它 |
| fail2ban | 否 | 若 VCN 已阻止 22 端口，就没有暴力破解 |
| sshd 加固 | 否 | Tailscale SSH 不使用 sshd |
| 禁用 root 登录 | 否 | Tailscale 使用 Tailscale 身份，而不是系统用户 |
| 仅 SSH 密钥认证 | 否 | Tailscale 通过你的 tailnet 进行认证 |
| IPv6 加固 | 通常不需要 | 取决于你的 VCN/子网设置；请验证实际分配/暴露情况 |

### 仍然推荐

- **凭证权限：** `chmod 700 ~/.openclaw`
- **安全审计：** `openclaw security audit`
- **系统更新：** 定期运行 `sudo apt update && sudo apt upgrade`
- **监控 Tailscale：** 在 [Tailscale admin console](https://login.tailscale.com/admin) 中检查设备

### 验证安全姿态

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## 回退方案：SSH 隧道

如果 Tailscale Serve 无法工作，请使用 SSH 隧道：

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

---

## 故障排除

### 实例创建失败（“Out of capacity”）

免费层 ARM 实例很热门。请尝试：

- 不同的可用域
- 在低峰时段重试（清晨）
- 选择实例规格时使用 “Always Free” 过滤器

### Tailscale 无法连接

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway 网关无法启动

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### 无法访问 Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

某些工具可能没有 ARM 构建版本。请检查：

```bash
uname -m  # Should show aarch64
```

大多数 npm 包都能正常工作。对于二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。

---

## 持久化

所有状态位于：

- `~/.openclaw/` —— `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据
- `~/.openclaw/workspace/` —— 工作区（SOUL.md、记忆、工件）

请定期备份：

```bash
openclaw backup create
```

---

## 另请参见

- [Gateway remote access](/zh-CN/gateway/remote) —— 其他远程访问模式
- [Tailscale integration](/zh-CN/gateway/tailscale) —— 完整 Tailscale 文档
- [Gateway configuration](/zh-CN/gateway/configuration) —— 所有配置选项
- [DigitalOcean guide](/zh-CN/install/digitalocean) —— 如果你想要付费但注册更容易的方案
- [Hetzner guide](/zh-CN/install/hetzner) —— 基于 Docker 的替代方案
