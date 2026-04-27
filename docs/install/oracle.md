---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 想为 OpenClaw 寻找免费的 VPS 托管方案
    - 想在一台小型服务器上让 OpenClaw 7x24 小时运行
summary: 在 Oracle Cloud 的永久免费 ARM 层级上托管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T03:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

在 Oracle Cloud 的**永久免费** ARM 层级上运行一个持久化的 OpenClaw Gateway 网关（最多 4 OCPU、24 GB RAM、200 GB 存储），且无需费用。

## 前提条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）—— 如果遇到问题，请参见[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 一对 SSH 密钥
- 大约 30 分钟

## 设置

<Steps>
  <Step title="创建 OCI 实例">
    1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 导航到 **Compute > Instances > Create Instance**。
    3. 配置：
       - **Name：** `openclaw`
       - **Image：** Ubuntu 24.04（aarch64）
       - **Shape：** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPUs：** 2（或最多 4）
       - **Memory：** 12 GB（或最多 24 GB）
       - **Boot volume：** 50 GB（最多可免费使用 200 GB）
       - **SSH key：** 添加你的公钥
    4. 点击 **Create**，并记下公网 IP 地址。

    <Tip>
    如果实例创建因 “Out of capacity” 失败，请尝试其他可用性域，或稍后重试。免费层容量有限。
    </Tip>

  </Step>

  <Step title="连接并更新系统">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    某些依赖在 ARM 上编译时需要 `build-essential`。

  </Step>

  <Step title="配置用户和主机名">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 可让用户服务在登出后继续运行。

  </Step>

  <Step title="安装 Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    从现在开始，请通过 Tailscale 连接：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    当提示 “How do you want to hatch your bot?” 时，选择 **Do this later**。

  </Step>

  <Step title="配置 Gateway 网关">
    使用 token 认证和 Tailscale Serve 来实现安全的远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    此处的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的 forwarded-IP / local-client 处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置下，Diff 查看器路由仍保持失败关闭行为：没有转发代理标头的原始 `127.0.0.1` 查看器请求可能会返回 `Diff not found`。对于附件，请使用 `mode=file` / `mode=both`；如果你需要可共享的查看器链接，请有意启用远程查看器，并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

  </Step>

  <Step title="收紧 VCN 安全策略">
    在网络边界阻止除 Tailscale 之外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 点击你的 VCN，然后进入 **Security Lists > Default Security List**。
    3. **删除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站）。

    这样会在网络边界阻止 22 端口上的 SSH、HTTP、HTTPS 以及其他所有流量。从此以后，你只能通过 Tailscale 连接。

  </Step>

  <Step title="验证">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从 tailnet 中的任意设备访问 Control UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（可通过 `tailscale status` 查看）。

  </Step>
</Steps>

## 回退方案：SSH 隧道

如果 Tailscale Serve 无法工作，请从你的本地机器使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排除

**实例创建失败（“Out of capacity”）** —— 免费层 ARM 实例很受欢迎。请尝试其他可用性域，或在非高峰时段重试。

**Tailscale 无法连接** —— 运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 以重新认证。

**Gateway 网关无法启动** —— 运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**ARM 二进制问题** —— 大多数 npm 软件包都可在 ARM64 上运行。对于原生二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。可使用 `uname -m` 验证架构。

## 后续步骤

- [渠道](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway 网关配置](/zh-CN/gateway/configuration) —— 所有配置选项
- [更新](/zh-CN/install/updating) —— 让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [VPS 托管](/zh-CN/vps)
