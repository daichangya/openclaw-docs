---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: qa-lab、qa-channel、种子化场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-26T02:36:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a90735fad04376b9ea1b6fc3cbbc276ee4b4ed6d0fdb31cfc93f97e9013288f
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 自动化栈的目标，是以比单个单元测试更贴近真实、符合渠道形态的方式来检验 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的启动任务种子资源和基线 QA 场景。

当前的 QA 操作流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 风格的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动由 Docker 支持的 gateway 通道，并暴露 QA Lab 页面，供操作员或自动化循环为智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍被阻塞。

如果你想更快地迭代 QA Lab UI，而无需每次都重建 Docker 镜像，可以使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重新构建该 bundle，当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行本地 OpenTelemetry 跟踪冒烟测试，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动一个本地 OTLP/HTTP 跟踪接收器，启用 `diagnostics-otel` 插件运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性不得出现在跟踪中。它会将 `otel-smoke-summary.json` 写入 QA 套件工件旁边。

若要运行一个基于真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix 插件。该实时传输通道会将子配置限定在待测传输范围内，因此 Matrix 会在子配置中不包含 `qa-channel` 的情况下运行。它会将结构化报告工件和合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若你也想捕获外层 `scripts/run-node.mjs` 的构建器/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。
默认会打印 Matrix 进度。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制整个运行时长，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时长，这样当 Docker 拆除卡住时，会报告精确的恢复命令而不是一直挂起。

若要运行一个基于真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道以一个真实的私有 Telegram 群组为目标，而不是配置一次性服务器。它要求提供 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的 bot 位于同一个私有群组中。SUT bot 必须具有 Telegram 用户名，而当两个 bot 都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，bot 与 bot 之间的观察效果最佳。
任一场景失败时，该命令会以非零状态退出。如果你希望保留工件但不因失败退出码而失败，请使用 `--allow-failures`。
Telegram 报告和摘要中包含每次回复的 RTT，计算范围从 driver 消息发送请求到观察到的 SUT 回复，从 canary 开始。

在使用池化的实时凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量，验证端点设置，并在存在维护者密钥时验证 admin/list 可达性。它仅报告密钥是已设置还是缺失。

若要运行一个基于真实传输的 Discord 冒烟通道，请执行：

```bash
pnpm openclaw qa discord
```

该通道以一个真实的私有 Discord guild 渠道为目标，并使用两个 bot：一个由 harness 控制的 driver bot，以及一个通过内置 Discord 插件由子 OpenClaw gateway 启动的 SUT bot。使用环境变量凭证时，它要求提供 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该通道会验证渠道 mention 处理，并检查 SUT bot 是否已向 Discord 注册原生 `/help` 命令。
任一场景失败时，该命令会以非零状态退出。如果你希望保留工件但不因失败退出码而失败，请使用 `--allow-failures`。

实时传输通道现在共享一个更小的统一契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖面广的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | Mention 门控 | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

这样可以让 `qa-channel` 保持为覆盖广泛的产品行为套件，同时让 Matrix、Telegram 以及未来的实时传输共享一份明确的传输契约检查清单。

若要运行一个一次性的 Linux VM 通道，而不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

该命令会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认都会并行执行多个已选场景，并使用隔离的 gateway worker。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
任一场景失败时，该命令会以非零状态退出。如果你希望保留工件但不因失败退出码而失败，请使用 `--allow-failures`。
实时运行会转发适合 guest 使用的受支持 QA 身份验证输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区写回内容。

## 由仓库支持的种子

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的唯一事实来源，并应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用和跨领域特性。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合起来，通过 Gateway 网关 `browser.request` 接口驱动嵌入式 Control UI，而无需添加特殊用途的运行器。

场景文件应按产品能力而不是源代码树目录分组。文件移动时应保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 提供实现可追溯性。

基线列表应足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体移交
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## provider 模拟通道

`qa suite` 有两个本地 provider 模拟通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw 模拟。它仍然是由仓库支持的 QA 和 parity gate 的默认确定性模拟通道。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性的协议、夹具、录制/回放和混沌覆盖。它是附加能力，不会替代 `mock-openai` 场景分发器。

provider 通道实现位于 `extensions/qa-lab/src/providers/` 下。每个 provider 自行负责其默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求，以及实时/模拟能力标记。共享的 suite 和 gateway 代码应通过 provider 注册表进行路由，而不是基于 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一个用于 Markdown QA 场景的通用传输接口。
`qa-channel` 是该接口上的第一个适配器，但设计目标更广：未来真实或合成的渠道应接入同一个套件运行器，而不是增加传输专用的 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、worker 并发、工件写入和报告。
- 传输适配器负责 gateway 配置、就绪状态、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍被阻塞
- 值得补充哪些后续场景

若要进行角色与风格检查，请在多个实时模型引用上运行同一场景，并写出一份经评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行的是本地 QA gateway 子进程，而不是 Docker。Character eval 场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区协助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每一份完整对话记录，记录基本运行统计信息，然后在支持的情况下，以快速模式和 `xhigh` 推理让 judge 模型按自然度、氛围感和幽默感对这些运行结果进行排序。跨 provider 比较时使用 `--blind-judge-models`：judge 提示词仍会获得每份对话记录和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，而支持该级别的较旧 OpenAI 评估引用默认使用 `xhigh`。你可以使用 `--model provider/model,thinking=<level>` 为特定候选项进行内联覆盖。`--thinking <level>` 仍会设置全局回退值，而较旧的 `--model-thinking <provider/model=level>` 形式则保留用于兼容性。

OpenAI 候选引用默认启用快速模式，以便在 provider 支持时使用优先处理。若某个候选项或 judge 需要单独覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想为每个候选模型强制开启快速模式时，才使用 `--fast`。报告中会记录候选项和 judge 的持续时间以供基准分析使用，但 judge 提示词会明确说明不要按速度排序。

候选模型运行和 judge 模型运行的默认并发数都是 16。当 provider 限制或本地 gateway 压力使运行噪声过大时，可降低 `--concurrency` 或 `--judge-concurrency`。

当未传入候选 `--model` 时，character eval 默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。

当未传入 `--judge-model` 时，judge 默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
