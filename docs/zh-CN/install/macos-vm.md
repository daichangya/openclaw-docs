---
read_when:
    - 你希望将 OpenClaw 与你的主 macOS 环境隔离开来
    - 你希望在沙箱中集成 iMessage（BlueBubbles）
    - 你希望拥有一个可重置、可克隆的 macOS 环境
    - 你希望比较本地和托管 macOS VM 方案
summary: 在沙箱隔离的 macOS VM 中运行 OpenClaw（本地或托管），当你需要隔离或 iMessage 时
title: macOS VM
x-i18n:
    generated_at: "2026-04-27T06:05:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 15
---

# 在 macOS VM 上运行 OpenClaw（沙箱隔离）

## 推荐默认方案（适合大多数用户）

- 使用**小型 Linux VPS** 作为始终在线的 Gateway 网关，成本更低。参见 [VPS hosting](/zh-CN/vps)。
- 如果你想要完全控制，并希望浏览器自动化使用**住宅 IP**，可选择**专用硬件**（Mac mini 或 Linux 机器）。许多网站会屏蔽数据中心 IP，因此本地浏览通常效果更好。
- **混合方案：** 将 Gateway 网关放在低成本 VPS 上，而在你需要浏览器 / UI 自动化时，将你的 Mac 连接为**节点**。参见 [Nodes](/zh-CN/nodes) 和 [Gateway remote](/zh-CN/gateway/remote)。

当你明确需要 macOS 专属能力（iMessage / BlueBubbles），或希望与日常使用的 Mac 严格隔离时，再使用 macOS VM。

## macOS VM 方案

### 在你的 Apple Silicon Mac 上运行本地 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume) 在你现有的 Apple Silicon Mac 上，以沙箱隔离的 macOS VM 运行 OpenClaw。

这样你可以获得：

- 完整且隔离的 macOS 环境（主机保持干净）
- 通过 BlueBubbles 支持 iMessage（Linux / Windows 无法实现）
- 通过克隆 VM 实现即时重置
- 无需额外硬件或云成本

### 托管 Mac 提供商（云端）

如果你想在云端使用 macOS，托管 Mac 提供商同样可行：

- [MacStadium](https://www.macstadium.com/)（托管 Mac）
- 其他托管 Mac 厂商也可用；请遵循其 VM + SSH 文档

一旦你获得对 macOS VM 的 SSH 访问权限，请从下方第 6 步继续。

---

## 快速路径（Lume，面向有经验的用户）

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助理，启用远程登录（SSH）
4. `lume run openclaw --no-display`
5. 通过 SSH 登录，安装 OpenClaw，配置渠道
6. 完成

---

## 你需要准备（Lume）

- Apple Silicon Mac（M1 / M2 / M3 / M4）
- 主机运行 macOS Sequoia 或更高版本
- 每个 VM 约 60 GB 可用磁盘空间
- 约 20 分钟

---

## 1）安装 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 不在你的 PATH 中：

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

验证：

```bash
lume --version
```

文档： [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2）创建 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

这会下载 macOS 并创建 VM。VNC 窗口会自动打开。

<Note>
下载可能需要一些时间，具体取决于你的网络连接。
</Note>

---

## 3）完成设置助理

在 VNC 窗口中：

1. 选择语言和地区
2. 跳过 Apple ID（或者如果你之后想使用 iMessage，则登录）
3. 创建一个用户账号（记住用户名和密码）
4. 跳过所有可选功能

设置完成后，启用 SSH：

1. 打开“系统设置”→“通用”→“共享”
2. 启用“远程登录”

---

## 4）获取 VM IP 地址

```bash
lume get openclaw
```

查找 IP 地址（通常为 `192.168.64.x`）。

---

## 5）通过 SSH 登录到 VM

```bash
ssh youruser@192.168.64.X
```

将 `youruser` 替换为你创建的账号，将 IP 替换为你的 VM IP。

---

## 6）安装 OpenClaw

在 VM 内部执行：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

按照新手引导提示设置你的模型提供商（Anthropic、OpenAI 等）。

---

## 7）配置渠道

编辑配置文件：

```bash
nano ~/.openclaw/openclaw.json
```

添加你的渠道：

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

然后登录 WhatsApp（扫描二维码）：

```bash
openclaw channels login
```

---

## 8）以无界面方式运行 VM

停止 VM 并在无显示模式下重新启动：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 会在后台运行。OpenClaw 的守护进程会保持 gateway 持续运行。

检查状态：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 额外功能：iMessage 集成

这是在 macOS 上运行的关键特性。使用 [BlueBubbles](https://bluebubbles.app) 为 OpenClaw 添加 iMessage。

在 VM 内部：

1. 从 bluebubbles.app 下载 BlueBubbles
2. 使用你的 Apple ID 登录
3. 启用 Web API 并设置密码
4. 将 BlueBubbles webhook 指向你的 gateway（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

添加到你的 OpenClaw 配置中：

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

重启 gateway。现在你的智能体就可以发送和接收 iMessage 了。

完整设置细节： [BlueBubbles channel](/zh-CN/channels/bluebubbles)

---

## 保存黄金镜像

在进一步自定义之前，请先为干净状态做一个快照：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

随时重置：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 持续运行

保持 VM 持续运行的方法：

- 让你的 Mac 保持接通电源
- 在“系统设置”→“节能”中禁用睡眠
- 如有需要，使用 `caffeinate`

如果你需要真正始终在线的环境，可考虑专用 Mac mini 或小型 VPS。参见 [VPS hosting](/zh-CN/vps)。

---

## 故障排除

| Problem                  | 解决方案                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 无法通过 SSH 登录 VM     | 检查 VM 的“系统设置”中是否已启用“远程登录”                                         |
| 未显示 VM IP             | 等待 VM 完全启动后，再次运行 `lume get openclaw`                                   |
| 找不到 Lume 命令         | 将 `~/.local/bin` 添加到你的 PATH                                                  |
| WhatsApp 二维码无法扫描  | 确保你是在 VM 中运行 `openclaw channels login`，而不是在主机上运行                 |

---

## 相关文档

- [VPS hosting](/zh-CN/vps)
- [Nodes](/zh-CN/nodes)
- [Gateway remote](/zh-CN/gateway/remote)
- [BlueBubbles channel](/zh-CN/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高级）
- [Docker Sandboxing](/zh-CN/install/docker)（另一种隔离方案）
