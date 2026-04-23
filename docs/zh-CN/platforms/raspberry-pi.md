---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 构建一个低成本、常开机的个人 AI
summary: 在 Raspberry Pi 上运行 OpenClaw（低成本自托管方案）
title: Raspberry Pi（平台）
x-i18n:
    generated_at: "2026-04-23T20:56:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 976de01203f982511f8f4b66331e9263d7848cbe656b0cdb5932eb890c72a178
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# 在 Raspberry Pi 上运行 OpenClaw

## 目标

在 Raspberry Pi 上运行一个持久、常开机的 OpenClaw Gateway 网关，总一次性成本约 **$35-80**（无月费）。

非常适合：

- 24/7 个人 AI 助手
- 家庭自动化中枢
- 低功耗、始终在线的 Telegram/WhatsApp 机器人

## 硬件要求

| Pi 型号          | RAM     | 可用性   | 说明                               |
| ---------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ 最佳  | 最快，推荐                         |
| **Pi 4**         | 4GB     | ✅ 良好  | 对大多数用户来说是最佳平衡         |
| **Pi 4**         | 2GB     | ✅ 可用  | 可运行，建议加 swap                |
| **Pi 4**         | 1GB     | ⚠️ 紧张  | 借助 swap 可以运行，需最小化配置   |
| **Pi 3B+**       | 1GB     | ⚠️ 较慢  | 能运行，但会比较迟缓               |
| **Pi Zero 2 W**  | 512MB   | ❌       | 不推荐                             |

**最低配置：** 1GB RAM、1 核、500MB 磁盘  
**推荐配置：** 2GB+ RAM、64 位操作系统、16GB+ SD 卡（或 USB SSD）

## 你需要准备

- Raspberry Pi 4 或 5（推荐 2GB+）
- MicroSD 卡（16GB+）或 USB SSD（性能更好）
- 电源适配器（推荐官方 Pi 电源）
- 网络连接（以太网或 WiFi）
- 大约 30 分钟

## 1）刷写操作系统

使用 **Raspberry Pi OS Lite（64-bit）** —— 对无头服务器来说不需要桌面环境。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择操作系统：**Raspberry Pi OS Lite (64-bit)**
3. 点击齿轮图标（⚙️）进行预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 将镜像刷写到 SD 卡 / USB 驱动器
5. 插入并启动 Pi

## 2）通过 SSH 连接

```bash
ssh user@gateway-host
# 或使用 IP 地址
ssh user@192.168.x.x
```

## 3）系统设置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件包
sudo apt install -y git curl build-essential

# 设置时区（对 cron/提醒很重要）
sudo timedatectl set-timezone America/Chicago  # 改成你的时区
```

## 4）安装 Node.js 24（ARM64）

```bash
# 通过 NodeSource 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version  # 应显示 v24.x.x
npm --version
```

## 5）添加 Swap（对于 2GB 或更小内存非常重要）

Swap 可防止内存不足崩溃：

```bash
# 创建 2GB swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 设为永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 针对低内存优化（降低 swappiness）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6）安装 OpenClaw

### 选项 A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 选项 B：可修改安装（适合折腾）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可修改安装能让你直接访问日志和代码 —— 对调试 ARM 特定问题很有帮助。

## 7）运行新手引导

```bash
openclaw onboard --install-daemon
```

按向导操作：

1. **Gateway mode：** Local
2. **Auth：** 推荐使用 API keys（在无头 Pi 上，OAuth 可能不太稳定）
3. **Channels：** Telegram 最容易上手
4. **Daemon：** Yes（systemd）

## 8）验证安装

```bash
# 检查状态
openclaw status

# 检查服务（标准安装 = systemd 用户单元）
systemctl --user status openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -f
```

## 9）访问 OpenClaw 仪表板

将 `user@gateway-host` 替换为你的 Pi 用户名，以及主机名或 IP 地址。

在你的电脑上，让 Pi 输出一个新的仪表板 URL：

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

该命令会输出 `Dashboard URL:`。根据 `gateway.auth.token`
的配置方式，URL 可能是普通的 `http://127.0.0.1:18789/`，也可能
包含 `#token=...`。

在你电脑上的另一个终端中，创建 SSH tunnel：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

然后在本地浏览器中打开刚才输出的 Dashboard URL。

如果 UI 要求共享密钥身份验证，请将已配置的令牌或密码
粘贴到控制 UI 设置中。对于令牌身份验证，请使用 `gateway.auth.token`（或
`OPENCLAW_GATEWAY_TOKEN`）。

如需常开远程访问，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

---

## 性能优化

### 使用 USB SSD（巨大提升）

SD 卡速度慢且容易磨损。USB SSD 可以显著提升性能：

```bash
# 检查是否从 USB 启动
lsblk
```

设置方法请参见 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

### 加快 CLI 启动（模块编译缓存）

在性能较弱的 Pi 主机上，启用 Node 的模块编译缓存可以让重复执行 CLI 更快：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

说明：

- `NODE_COMPILE_CACHE` 可加速后续运行（`status`、`health`、`--help`）。
- `/var/tmp` 比 `/tmp` 更能在重启后保留。
- `OPENCLAW_NO_RESPAWN=1` 可避免 CLI 自重启带来的额外启动开销。
- 第一次运行会预热缓存；之后的运行收益最大。

### systemd 启动调优（可选）

如果这台 Pi 主要用于运行 OpenClaw，可添加一个服务 drop-in，以减少重启抖动
并保持启动环境稳定：

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

然后应用：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

如果可以，请将 OpenClaw 的状态/缓存保存在 SSD 支持的存储上，以避免冷启动期间 SD 卡
随机 I/O 瓶颈。

如果这是一个无头 Pi，请启用 lingering 一次，以便用户服务在注销后继续运行：

```bash
sudo loginctl enable-linger "$(whoami)"
```

关于 `Restart=` 策略如何帮助自动恢复：
[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### 降低内存使用

```bash
# 禁用 GPU 内存分配（无头模式）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 如果不需要，禁用蓝牙
sudo systemctl disable bluetooth
```

### 监控资源

```bash
# 检查内存
free -h

# 检查 CPU 温度
vcgencmd measure_temp

# 实时监控
htop
```

---

## ARM 特定说明

### 二进制兼容性

大多数 OpenClaw 功能都可以在 ARM64 上运行，但某些外部二进制可能需要 ARM 构建：

| 工具                 | ARM64 状态   | 说明                                 |
| -------------------- | ------------ | ------------------------------------ |
| Node.js              | ✅           | 运行良好                             |
| WhatsApp（Baileys）  | ✅           | 纯 JS，无问题                        |
| Telegram             | ✅           | 纯 JS，无问题                        |
| gog（Gmail CLI）     | ⚠️           | 需要确认是否有 ARM 版本              |
| Chromium（浏览器）   | ✅           | `sudo apt install chromium-browser`  |

如果某个 Skill 失败，请检查其二进制是否有 ARM 构建。很多 Go/Rust 工具都有；有些则没有。

### 32 位 vs 64 位

**务必使用 64 位操作系统。** Node.js 和许多现代工具都需要它。请用以下命令检查：

```bash
uname -m
# 应显示：aarch64（64 位），而不是 armv7l（32 位）
```

---

## 推荐模型设置

由于 Pi 只负责 Gateway 网关（模型运行在云端），建议使用基于 API 的模型：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**不要尝试在 Pi 上运行本地 LLM** —— 即便是小模型也会太慢。让 Claude/GPT 来处理重负载。

---

## 开机自启

新手引导会自动设置这一点，但你可以这样验证：

```bash
# 检查服务是否已启用
systemctl --user is-enabled openclaw-gateway.service

# 如果未启用，则启用
systemctl --user enable openclaw-gateway.service

# 开机启动
systemctl --user start openclaw-gateway.service
```

---

## 故障排除

### 内存不足（OOM）

```bash
# 检查内存
free -h

# 增加 swap（见步骤 5）
# 或减少 Pi 上运行的服务
```

### 性能缓慢

- 使用 USB SSD 而不是 SD 卡
- 禁用未使用的服务：`sudo systemctl disable cups bluetooth avahi-daemon`
- 检查 CPU 是否降频：`vcgencmd get_throttled`（应返回 `0x0`）

### 服务无法启动

```bash
# 检查日志
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# 常见修复：重新构建
cd ~/openclaw  # 如果你使用的是可修改安装
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

如果某个 Skill 因 “exec format error” 失败：

1. 检查该二进制是否有 ARM64 构建
2. 尝试从源码构建
3. 或使用带 ARM 支持的 Docker 容器

### WiFi 掉线

对于使用 WiFi 的无头 Pi：

```bash
# 禁用 WiFi 电源管理
sudo iwconfig wlan0 power off

# 设为永久生效
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本对比

| 方案              | 一次性成本      | 月成本       | 说明                         |
| ----------------- | --------------- | ------------ | ---------------------------- |
| **Pi 4（2GB）**   | ~$45            | $0           | + 电费（约 ~$5/年）          |
| **Pi 4（4GB）**   | ~$55            | $0           | 推荐                         |
| **Pi 5（4GB）**   | ~$60            | $0           | 最佳性能                     |
| **Pi 5（8GB）**   | ~$80            | $0           | 有些超配，但更具未来保障     |
| DigitalOcean      | $0              | $6/月        | $72/年                       |
| Hetzner           | $0              | €3.79/月     | 约 $50/年                    |

**回本周期：** 与云 VPS 相比，Pi 大约在 6-12 个月内即可回本。

---

## 另请参见

- [Linux 指南](/zh-CN/platforms/linux) —— 通用 Linux 设置
- [DigitalOcean 指南](/zh-CN/install/digitalocean) —— 云端替代方案
- [Hetzner 指南](/zh-CN/install/hetzner) —— Docker 设置
- [Tailscale](/zh-CN/gateway/tailscale) —— 远程访问
- [节点](/zh-CN/nodes) —— 将你的笔记本/手机与 Pi gateway 配对
