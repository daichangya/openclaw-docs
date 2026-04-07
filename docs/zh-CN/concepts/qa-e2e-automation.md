---
read_when:
    - 扩展 qa-lab 或 qa-channel 时
    - 添加仓库支持的 QA 场景时
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化时
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-07T22:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4aa5acc8e77303f4045d4f04372494cae21b89d2fdaba856dbb4855ced9d27
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 技术栈旨在以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、频道、线程、反应、编辑和删除等交互界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，以及导出 Markdown 报告。
- `qa/`：用于启动任务和基线 QA 场景的仓库支持种子资源。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 风格的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面，供操作员或自动化循环为智能体分配 QA 任务、观察真实渠道行为，并记录哪些有效、哪些失败，或哪些仍被阻塞。

如果你想更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，可以使用绑定挂载的 QA Lab bundle 启动该技术栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，并且当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

## 仓库支持的种子资源

种子资源位于 `qa/` 中：

- `qa/scenarios.md`

这些内容有意保存在 git 中，以便人类和智能体都能看到 QA 计划。基线列表应保持足够广泛，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体切换交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 会根据观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 值得添加哪些后续场景

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
