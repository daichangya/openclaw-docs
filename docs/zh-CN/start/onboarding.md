---
read_when:
    - 设计 macOS 新手引导助手
    - 实现认证或身份设置
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 首次运行设置流程（macOS app）
title: 新手引导（macOS app）
x-i18n:
    generated_at: "2026-04-23T21:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5c0c0e7402e18ee58b504b9cb3424b0998cff7630ba40844f4ef825abff9192
    source_path: start/onboarding.md
    workflow: 15
---

本文档描述的是**当前**的首次运行设置流程。目标是提供顺畅的“第 0 天”体验：选择 Gateway 网关运行位置、连接认证、运行向导，然后让智能体自行完成引导初始化。
关于新手引导路径的总体概览，请参见 [Onboarding Overview](/zh-CN/start/onboarding-overview)。

<Steps>
<Step title="批准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="允许查找本地网络">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="欢迎界面和安全提示">
<Frame caption="阅读显示的安全提示，并据此作出决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人智能体：只有一个受信任的操作员边界。
- 共享/多用户设置需要锁定（拆分信任边界、尽量减少工具访问，并遵循 [Security](/zh-CN/gateway/security)）。
- 本地新手引导现在默认将新配置设置为 `tools.profile: "coding"`，这样新的本地设置会保留文件系统/运行时工具，而无需强制使用不受限制的 `full` profile。
- 如果启用了 hooks/webhooks 或其他不受信任的内容源，请使用强大的现代模型层级，并保持严格的工具策略/沙箱隔离。

</Step>
<Step title="本地还是远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway 网关**运行在哪里？

- **这台 Mac（仅本地）：** 新手引导可以在本地配置认证并写入凭证。
- **远程（通过 SSH/Tailnet）：** 新手引导**不会**配置本地认证；凭证必须已存在于 gateway 主机上。
- **稍后配置：** 跳过设置，并将 app 保持为未配置状态。

<Tip>
**Gateway 网关认证提示：**

- 向导现在即使在 loopback 上也会生成一个 **token**，因此本地 WS 客户端也必须进行认证。
- 如果你禁用了认证，任何本地进程都可以连接；这只适用于完全受信任的机器。
- 对于多机器访问或非 loopback 绑定，请使用 **token**。

</Tip>
</Step>
<Step title="权限">
<Frame caption="选择你希望授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

新手引导会请求以下 TCC 权限，以支持：

- 自动化（AppleScript）
- 通知
- 辅助功能
- 屏幕录制
- 麦克风
- 语音识别
- 摄像头
- 位置

</Step>
<Step title="CLI">
  <Info>此步骤为可选</Info>
  该 app 可以通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI。
  它会优先选择 npm，其次是 pnpm，最后在只检测到 bun 时使用 bun。
  对于 Gateway 网关运行时，Node 仍然是推荐路径。
</Step>
<Step title="新手引导聊天（专用会话）">
  设置完成后，app 会打开一个专用的新手引导聊天会话，让智能体
  进行自我介绍并引导后续步骤。这样可将首次运行指导与
  你的普通对话区分开来。关于首次智能体运行期间 gateway 主机上会发生什么，
  请参见 [Bootstrapping](/zh-CN/start/bootstrapping)。
</Step>
</Steps>
