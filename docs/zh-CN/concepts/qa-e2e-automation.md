---
read_when:
    - 扩展 qa-lab 或 qa-channel 时
    - 添加仓库支持的 QA 场景时
    - 围绕 Gateway 网关仪表盘构建更高真实性的 QA 自动化时
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-07T08:46:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e2c409438629f0ffcc06fcd1fce5203e92769be19d927db8fbf3fa995875af
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 自动化

这个私有 QA 栈旨在以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具有私信、渠道、线程、
  表情回应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、
  注入入站消息，以及导出 Markdown 报告。
- `qa/`：用于启动任务和基础 QA 场景的仓库支持种子资源。

当前 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表盘（Control UI）。
- 右侧：QA Lab，显示类 Slack 对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关通道，并公开
QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务，
观察真实的渠道行为，并记录哪些工作正常、哪些失败，或哪些仍然受阻。

为了更快地迭代 QA Lab UI，而无需每次都重新构建 Docker 镜像，
请使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务基于预构建镜像运行，并将
`extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch`
会在变更时重新构建该 bundle；每次重新构建后请刷新浏览器。

## 仓库支持的种子

种子资源位于 `qa/` 中：

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

这些内容刻意保存在 git 中，以便人类和智能体都能看到 QA 计划。
基础列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些工作正常
- 哪些失败了
- 哪些仍然受阻
- 值得添加哪些后续场景

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表盘](/web/dashboard)
