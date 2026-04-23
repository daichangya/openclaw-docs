---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 打造一个低成本、始终在线的个人 AI
summary: 在 Raspberry Pi 上托管 OpenClaw，以实现始终在线的自托管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-23T20:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2727a14ae5c9fa9b9fd5f33bfb10a7af73254efbdcd6374502d1704ce31e484
    source_path: install/raspberry-pi.md
    workflow: 15
---

在 Raspberry Pi 上运行一个持久、始终在线的 OpenClaw Gateway 网关。由于 Pi 只负责作为 Gateway 网关（模型通过 API 在云端运行），即使是配置一般的 Pi 也能很好地承担这项工作。

## 前提条件

- Raspberry Pi 4 或 5，内存 2 GB 以上（推荐 4 GB）
- MicroSD 卡（16 GB 以上）或 USB SSD（性能更好）
- 官方 Pi 电源
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必需 —— 不要使用 32 位）
- 约 30 分钟

## 设置

<Steps>
  <Step title="刷写操作系统">
    使用 **Raspberry Pi OS Lite（64 位）** —— 对于无头服务器，不需要桌面环境。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择 OS：**Raspberry Pi OS Lite（64 位）**。
    3. 在设置对话框中预先配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 刷写到你的 SD 卡或 USB 驱动器中，插入后启动 Pi。

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

    # 设置时区（对 cron 和提醒很重要）
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

  <Step title="添加 swap（对 2 GB 或更低内存尤为重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 降低低内存设备的 swappiness
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

    按照向导进行操作。对于无头设备，推荐使用 API key 而不是 OAuth。Telegram 是最容易开始使用的渠道。

  </Step>

  <Step title="验证">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问 Control UI">
    在你的电脑上，从 Pi 获取 dashboard URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端中创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本地浏览器中打开打印出的 URL。对于始终在线的远程访问，请参阅 [Tailscale integration](/zh-CN/gateway/tailscale)。

  </Step>
</Steps>

## 性能建议

**使用 USB SSD** —— SD 卡速度慢且容易磨损。USB SSD 能显著提升性能。请参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存** —— 可加速在低功耗 Pi 主机上的重复 CLI 调用：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**降低内存占用** —— 对于无头设置，可释放 GPU 内存并禁用未使用服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## 故障排除

**内存不足** —— 使用 `free -h` 验证 swap 是否已启用。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。仅使用基于 API 的模型。

**性能缓慢** —— 使用 USB SSD 而不是 SD 卡。使用 `vcgencmd get_throttled` 检查 CPU 是否被降频（应返回 `0x0`）。

**服务无法启动** —— 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 查看日志，并运行 `openclaw doctor --non-interactive`。如果这是无头 Pi，还要确认已启用 lingering：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制问题** —— 如果某个 Skill 因 “exec format error” 失败，请检查该二进制文件是否提供 ARM64 构建。使用 `uname -m` 验证架构（应显示 `aarch64`）。

**WiFi 掉线** —— 禁用 WiFi 电源管理：`sudo iwconfig wlan0 power off`。

## 后续步骤

- [Channels](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration) —— 所有配置选项
- [Updating](/zh-CN/install/updating) —— 让 OpenClaw 保持最新
