---
read_when:
    - 从零开始的首次设置
    - 你想用最快的方式开始一次可用的聊天
summary: 在几分钟内安装 OpenClaw 并开始你的第一次聊天。中文用户专属的快速入门指南。
title: 入门指南 - 中文社区版
description: "OpenClaw 中文快速入门指南，包含针对中国用户的安装建议、网络配置和本土化提示。"
x-i18n:
    generated_at: "2026-04-24T04:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

<Note type="info">
**中文用户提示：** 本文档已针对中国用户优化，包含国内网络环境下的安装建议和常见问题解答。如遇到网络连接问题，请参考下方的“中国用户特别提示”部分。
</Note>

安装 OpenClaw，运行新手引导，并与你的 AI 助手聊天 —— 整个过程大约只需
5 分钟。完成后，你将拥有一个正在运行的 Gateway 网关、已配置好的认证，
以及一个可用的聊天会话。

## 你需要准备什么

- **Node.js** —— 推荐 Node 24（也支持 Node 22.14+）
- **模型提供商的 API key**（Anthropic、OpenAI、Google 等）—— 新手引导会提示你输入

<Tip>
使用 `node --version` 检查你的 Node 版本。
**Windows 用户：** 原生 Windows 和 WSL2 都受支持。WSL2 更稳定，且更推荐用于完整体验。请参阅 [Windows](/zh-CN/platforms/windows)。
需要安装 Node？请参阅 [Node 设置](/zh-CN/install/node)。
</Tip>

## 快速设置

<Steps>
  <Step title="安装 OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows（PowerShell）">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    其他安装方式（Docker、Nix、npm）：[安装](/zh-CN/install)。
    </Note>

  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你选择模型提供商、设置 API key，
    并配置 Gateway 网关。整个过程大约需要 2 分钟。

    完整参考请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Step>
  <Step title="验证 Gateway 网关正在运行">
    ```bash
    openclaw gateway status
    ```

    你应该会看到 Gateway 网关正在监听端口 18789。

  </Step>
  <Step title="打开仪表板">
    ```bash
    openclaw dashboard
    ```

    这会在你的浏览器中打开控制 UI。如果能够加载，说明一切正常。

  </Step>
  <Step title="发送你的第一条消息">
    在控制 UI 聊天中输入一条消息，你应该会收到 AI 回复。

    想改用手机聊天？最快可设置的渠道是
    [Telegram](/zh-CN/channels/telegram)（只需要一个 bot token）。所有选项请参阅 [渠道](/zh-CN/channels)。

  </Step>
</Steps>

<Accordion title="高级：挂载自定义控制 UI 构建">
  如果你维护的是本地化或自定义的仪表板构建，请将
  `gateway.controlUi.root` 指向一个包含已构建静态资源和 `index.html` 的目录。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 将你构建好的静态文件复制到该目录中。
```

然后设置：

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

重启 Gateway 网关并重新打开仪表板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下来做什么

<Columns>
  <Card title="连接一个渠道" href="/zh-CN/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等等。
  </Card>
  <Card title="配对与安全" href="/zh-CN/channels/pairing" icon="shield">
    控制谁可以向你的智能体发消息。
  </Card>
  <Card title="配置 Gateway 网关" href="/zh-CN/gateway/configuration" icon="settings">
    模型、工具、沙箱和高级设置。
  </Card>
  <Card title="浏览工具" href="/zh-CN/tools" icon="wrench">
    浏览器、exec、网页搜索、Skills 和插件。
  </Card>
</Columns>

<Accordion title="高级：环境变量">
  如果你将 OpenClaw 作为服务账户运行，或希望使用自定义路径：

- `OPENCLAW_HOME` —— 用于内部路径解析的主目录
- `OPENCLAW_STATE_DIR` —— 覆盖状态目录
- `OPENCLAW_CONFIG_PATH` —— 覆盖配置文件路径

完整参考：[环境变量](/zh-CN/help/environment)。
</Accordion>

## 相关内容

- [安装概览](/zh-CN/install)
- [渠道概览](/zh-CN/channels)
- [设置](/zh-CN/start/setup)

---

## 🇨🇳 中国用户特别提示

### 网络环境配置

如果你在中国大陆使用，可能会遇到以下网络问题：

#### 1. npm 安装慢或失败

使用国内镜像源加速：

```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 然后安装
npm install -g openclaw@latest
```

#### 2. API 访问问题

部分 AI 模型提供商可能需要特殊网络配置：

- **OpenAI**: 需要代理或国内代理服务
- **Anthropic**: 需要代理或国内代理服务
- **国内替代方案**: 
  - [阿里云通义千问](/zh-CN/providers/qwen)
  - [百度文心一言](/zh-CN/providers/qianfan)
  - [月之暗面 Kimi](/zh-CN/providers/moonshot)

#### 3. Docker 镜像拉取慢

使用国内 Docker 镜像源：

```bash
# 配置 Docker 镜像加速器
# 编辑 /etc/docker/daemon.json (Linux) 或 Docker Desktop 设置 (macOS/Windows)
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io"
  ]
}
```

### 推荐的国内模型提供商

对于中国用户，我们推荐使用以下国内模型提供商，无需特殊网络配置：

| 提供商 | 优势 | 文档 |
|--------|------|------|
| 阿里云通义千问 | 稳定、快速、中文理解好 | [Qwen 配置](/zh-CN/providers/qwen) |
| 百度文心一言 | 中文能力强、企业级服务 | [千帆配置](/zh-CN/providers/qianfan) |
| 月之暗面 Kimi | 长文本处理优秀 | [Kimi 配置](/zh-CN/providers/moonshot) |
| MiniMax | 性价比高 | [MiniMax 配置](/zh-CN/providers/minimax) |

### 常见问题

**Q: 安装时提示网络连接超时？**  
A: 使用上述的 npm 镜像源配置。

**Q: Gateway 启动后无法访问？**  
A: 检查防火墙设置，确保端口 18789 已开放。

**Q: 如何选择合适的模型提供商？**  
A: 如果在国内，优先选择阿里云、百度等国内提供商；如果有海外网络条件，可以选择 OpenAI 或 Anthropic。

---

> **需要帮助？** 如果在安装过程中遇到问题，欢迎在 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 中提问，或使用标签 `i18n-zh` 以便中文社区成员更快响应。
