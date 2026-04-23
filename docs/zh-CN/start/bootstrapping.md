---
read_when:
    - 了解智能体首次运行时会发生什么
    - 解释引导文件位于何处Rhumela to=final code  omitted
    - 调试新手引导身份设置时
sidebarTitle: Bootstrapping
summary: 用于初始化工作区和身份文件的智能体引导仪式
title: 智能体引导彩彩票与你同行 to=final code  omitted
x-i18n:
    generated_at: "2026-04-23T21:05:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

引导是智能体**首次运行**时执行的仪式，用于准备智能体工作区并
收集身份细节。它发生在新手引导之后，也就是智能体第一次启动时。

## 引导会做什么

在智能体首次运行时，OpenClaw 会初始化工作区（默认是
`~/.openclaw/workspace`）：

- 初始化 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行一个简短的问答仪式（一次一个问题）。
- 将身份和偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后移除 `BOOTSTRAP.md`，以确保它只运行一次。

## 它在哪里运行

引导始终运行在**gateway 主机**上。如果 macOS 应用连接到
远程 Gateway 网关，则工作区和引导文件位于那台远程
机器上。

<Note>
当 Gateway 网关运行在另一台机器上时，请在 gateway
主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[智能体工作区](/zh-CN/concepts/agent-workspace)
