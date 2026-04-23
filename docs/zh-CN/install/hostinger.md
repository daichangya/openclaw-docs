---
read_when:
    - 在 Hostinger 上设置 OpenClaw
    - 在寻找适合 OpenClaw 的托管 VPS
    - 使用 Hostinger 一键安装 OpenClaw
summary: 在 Hostinger 上托管 OpenClaw
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T20:52:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d172dd313dd29c0d642839f412e0672db7037146bd1ca2e0b092a351731bd32e
    source_path: install/hostinger.md
    workflow: 15
---

通过**一键安装**托管部署或 **VPS** 安装，在 [Hostinger](https://www.hostinger.com/openclaw) 上运行持久化的 OpenClaw Gateway 网关。

## 前置条件

- Hostinger 账户（[注册](https://www.hostinger.com/openclaw)）
- 大约 5-10 分钟

## 选项 A：一键安装 OpenClaw

最快的入门方式。Hostinger 负责基础设施、Docker 和自动更新。

<Steps>
  <Step title="购买并启动">
    1. 在 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw) 选择一个托管 OpenClaw 套餐并完成结账。

    <Note>
    在结账过程中，你可以选择 **Ready-to-Use AI** 点数，这些点数会预先购买并立即集成到 OpenClaw 中 —— 无需其他提供商的外部账户或 API 密钥。你可以立即开始聊天。或者，也可以在设置过程中提供你自己的 Anthropic、OpenAI、Google Gemini 或 xAI 密钥。
    </Note>

  </Step>

  <Step title="选择消息渠道">
    选择一个或多个要连接的渠道：

    - **WhatsApp** —— 扫描设置向导中显示的二维码。
    - **Telegram** —— 粘贴来自 [BotFather](https://t.me/BotFather) 的机器人 token。

  </Step>

  <Step title="完成安装">
    点击 **Finish** 部署实例。准备就绪后，可从 hPanel 中的 **OpenClaw Overview** 访问 OpenClaw 控制面板。
  </Step>

</Steps>

## 选项 B：在 VPS 上运行 OpenClaw

可对你的服务器进行更多控制。Hostinger 会通过 Docker 在你的 VPS 上部署 OpenClaw，而你通过 hPanel 中的 **Docker Manager** 对其进行管理。

<Steps>
  <Step title="购买 VPS">
    1. 在 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw) 选择一个 OpenClaw on VPS 套餐并完成结账。

    <Note>
    你可以在结账时选择 **Ready-to-Use AI** 点数 —— 这些点数会预先购买并立即集成到 OpenClaw 中，因此你无需任何外部账户或其他提供商的 API 密钥即可开始聊天。
    </Note>

  </Step>

  <Step title="配置 OpenClaw">
    VPS 预配完成后，填写以下配置字段：

    - **Gateway token** —— 自动生成；请保存以备后续使用。
    - **WhatsApp number** —— 你的带国家代码号码（可选）。
    - **Telegram bot token** —— 来自 [BotFather](https://t.me/BotFather)（可选）。
    - **API keys** —— 仅在你结账时未选择 Ready-to-Use AI 点数时才需要。

  </Step>

  <Step title="启动 OpenClaw">
    点击 **Deploy**。运行后，在 hPanel 中点击 **Open** 打开 OpenClaw 控制面板。
  </Step>

</Steps>

日志、重启和更新都可直接通过 hPanel 中的 Docker Manager 界面进行管理。若要更新，请在 Docker Manager 中点击 **Update**，这会拉取最新镜像。

## 验证你的设置

在你已连接的渠道中向你的助手发送 “Hi”。OpenClaw 会回复，并引导你完成初始偏好设置。

## 故障排除

**控制面板无法加载** —— 等待几分钟，让容器完成预配。请检查 hPanel 中 Docker Manager 的日志。

**Docker 容器持续重启** —— 打开 Docker Manager 日志，查找配置错误（缺少 token、API 密钥无效）。

**Telegram 机器人没有响应** —— 直接从 Telegram 将你的配对码消息作为一条消息发送到 OpenClaw 聊天中，以完成连接。

## 下一步

- [Channels](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway configuration](/zh-CN/gateway/configuration) —— 所有配置选项
