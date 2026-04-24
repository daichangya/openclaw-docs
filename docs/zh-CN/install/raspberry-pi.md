---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 构建一个低成本、始终在线的个人 AI
summary: 在 Raspberry Pi 上托管 OpenClaw，实现始终在线的自托管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T03:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

在 Raspberry Pi 上运行一个持久化、始终在线的 OpenClaw Gateway 网关。由于 Pi 只是 Gateway 网关（模型通过 API 在云端运行），即使是配置一般的 Pi 也能很好地处理这类工作负载。

## 先决条件

- Raspberry Pi 4 或 5，2 GB 以上内存（推荐 4 GB）
- MicroSD 卡（16 GB 以上）或 USB SSD（性能更好）
- 官方 Pi 电源
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必需 —— 不要使用 32 位）
- 约 30 分钟

## 设置

<Steps>
  <Step title="烧录操作系统">
    使用 **Raspberry Pi OS Lite（64-bit）** —— 对于无头服务器，无需桌面环境。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择操作系统：**Raspberry Pi OS Lite（64-bit）**。
    3. 在设置对话框中预先配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 将系统烧录到 SD 卡或 USB 驱动器，插入后启动 Pi。

  </Step>

  <Step title="通过 SSH 连接">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="更新系统">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # 设置时区（对 cron 和提醒功能很重要）
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="安装 Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="添加 swap（对 2 GB 或更少内存尤其重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 为低内存设备降低 swappiness
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    按照向导完成配置。对于无头设备，推荐使用 API key 而不是 OAuth。Telegram 是最容易开始使用的渠道。

  </Step>

  <Step title="验证">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问 Control UI">
    在你的电脑上，从 Pi 获取一个仪表盘 URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端中创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本地浏览器中打开打印出的 URL。若要实现始终在线的远程访问，请参见 [Tailscale integration](/zh-CN/gateway/tailscale)。

  </Step>
</Steps>

## 性能提示

**使用 USB SSD** —— SD 卡速度较慢且容易磨损。USB SSD 可以显著提升性能。请参见 [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存** —— 可加快在低功耗 Pi 主机上的重复 CLI 调用速度：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**减少内存占用** —— 对于无头设置，可释放 GPU 内存并禁用未使用的服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## 故障排除

**内存不足** —— 使用 `free -h` 验证 swap 是否处于活动状态。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。仅使用基于 API 的模型。

**性能缓慢** —— 使用 USB SSD 代替 SD 卡。使用 `vcgencmd get_throttled` 检查 CPU 是否发生降频（应返回 `0x0`）。

**服务无法启动** —— 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 检查日志，并运行 `openclaw doctor --non-interactive`。如果这是一个无头 Pi，还要验证是否已启用 lingering：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制问题** —— 如果某个 Skills 因 “exec format error” 失败，请检查该二进制文件是否提供 ARM64 构建。使用 `uname -m` 验证架构（应显示 `aarch64`）。

**WiFi 断连** —— 禁用 WiFi 省电管理：`sudo iwconfig wlan0 power off`。

## 后续步骤

- [Channels](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway configuration](/zh-CN/gateway/configuration) —— 所有配置选项
- [Updating](/zh-CN/install/updating) —— 保持 OpenClaw 为最新版本

## 相关

- [Install overview](/zh-CN/install)
- [Linux server](/zh-CN/vps)
- [Platforms](/zh-CN/platforms)
