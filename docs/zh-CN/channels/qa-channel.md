---
read_when:
    - 你正在将合成 QA 传输接入本地或 CI 测试运行
    - 你需要内置 qa-channel 的配置界面
    - 你正在迭代端到端 QA 自动化
summary: 用于确定性 OpenClaw QA 场景的合成 Slack 类渠道插件
title: QA 渠道
x-i18n:
    generated_at: "2026-04-23T20:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe1c9ad251b45b9f3398c9ce516da98451ec7081a5df038628ce5e35eeb24502
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` 是一个用于自动化 OpenClaw QA 的内置合成消息传输。

它不是生产渠道。它的存在是为了在与真实传输相同的渠道插件
边界上进行验证，同时保持状态可预测且可完全检查。

## 当前功能

- Slack 类目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 基于 HTTP 的合成总线，用于：
  - 注入入站消息
  - 捕获出站转录
  - 创建线程
  - 回应
  - 编辑
  - 删除
  - 搜索和读取操作
- 内置的主机端自检运行器，会写出 Markdown 报告

## 配置

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

支持的账户键名：

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## 运行器

当前纵向切片：

```bash
pnpm qa:e2e
```

现在这会通过内置的 `qa-lab` 插件路由。它会启动仓库内的
QA 总线，启动内置的 `qa-channel` 运行时切片，运行一个确定性的
自检，并将 Markdown 报告写入 `.artifacts/qa-e2e/`。

私有调试器 UI：

```bash
pnpm qa:lab:up
```

这一条命令会构建 QA 站点，启动由 Docker 支持的 Gateway 网关 + QA Lab
堆栈，并打印 QA Lab URL。在该站点中，你可以选择场景、选择
模型通道、启动单次运行，并实时查看结果。

完整的仓库支持 QA 套件：

```bash
pnpm openclaw qa suite
```

这会在本地 URL 启动私有 QA 调试器，与
已发布的 Control UI bundle 分开。

## 范围

当前范围刻意保持狭窄：

- 总线 + 插件传输
- 线程路由语法
- 渠道自有消息操作
- Markdown 报告
- 带运行控制的 Docker 支持 QA 站点

后续工作将增加：

- 提供商 / 模型矩阵执行
- 更丰富的场景发现
- 后续引入 OpenClaw 原生编排
