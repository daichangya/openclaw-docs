---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: qa-lab、qa-channel、种子化场景和协议报告的私有 QA 自动化形态
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-26T23:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 107c0af2635ffa272c6d559ac77cc4b3846a664c92cb1054d37fa73ded119559
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 自动化栈的目标，是以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、渠道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA 场景。

当前的 QA 操作流程是一个双面板 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 风格的转录内容和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点、启动基于 Docker 的 gateway 运行通道，并暴露 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍然受阻。

为了更快地迭代 QA Lab UI，而不必每次都重新构建 Docker 镜像，可以使用 bind mount 的 QA Lab bundle 启动整个栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在一个预构建镜像上，并将 `extensions/qa-lab/web/dist` bind mount 到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

如需运行本地 OpenTelemetry trace 冒烟检查，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动一个本地 OTLP/HTTP trace 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；模型调用在成功轮次中不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性不得出现在 trace 中。它会将 `otel-smoke-summary.json` 写入 QA 套件产物旁边。

常规 Docker 聚合运行和发布路径核心分块也会运行一个可观测性通道。它会复用共享的、已包安装的功能型 Docker 镜像，以只读方式挂载 QA harness 文件，在容器内运行 OTEL trace 冒烟检查，然后在启用 `diagnostics-prometheus` 插件的情况下运行 `docker-prometheus-smoke` QA 场景。设置 `OPENCLAW_DOCKER_OBSERVABILITY_LOOPS=<count>` 可在一次 Docker 运行中重复执行这两项检查，同时将每次循环的产物保存在 `.artifacts/docker-observability/...` 下。

如需运行一个基于真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix 插件。该实时传输通道会将子进程配置限定在当前待测传输上，因此 Matrix 运行时不会在子进程配置中包含 `qa-channel`。它会将结构化报告产物以及合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。如需同时捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。默认会打印 Matrix 进度。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制整个运行时长，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时长，以便在 Docker 拆除卡住时报告准确的恢复命令，而不是一直挂起。

如需运行一个基于真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会使用一个真实的私有 Telegram 群组，而不是配置一次性服务器。它要求提供 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且需要两个位于同一私有群组中的不同 bot。SUT bot 必须具有 Telegram 用户名，并且当两个 bot 都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，bot 到 bot 的观察效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不因退出码失败，可使用 `--allow-failures`。
Telegram 报告和摘要会包含每次回复的 RTT，从 driver 消息发送请求开始，到观察到 SUT 回复为止，canary 也包含在内。

在使用池化的实时凭据之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证端点设置，并在存在维护者密钥时验证 admin/list 可达性。对于密钥，它只报告“已设置/缺失”状态。

如需运行一个基于真实传输的 Discord 冒烟通道，请执行：

```bash
pnpm openclaw qa discord
```

该通道会使用一个真实的私有 Discord guild 渠道，并配合两个 bot：一个由 harness 控制的 driver bot，以及一个由子 OpenClaw gateway 通过内置 Discord 插件启动的 SUT bot。当使用环境变量凭据时，它要求提供 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该通道会验证渠道提及处理，并检查 SUT bot 是否已向 Discord 注册原生 `/help` 命令。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不因退出码失败，可使用 `--allow-failures`。

现在，各实时传输通道共享一个更小的统一契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖面广的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 拦截 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | 反应观察 | Help 命令 | 原生命令注册 |
| ---- | ------ | -------- | -------------- | -------- | -------- | ------------ | -------- | -------- | ---------- | -------------- |
| Matrix   | x      | x        | x              | x        | x        | x            | x        | x        |            |                |
| Telegram | x      | x        |                |          |          |              |          |          | x          |                |
| Discord  | x      | x        |                |          |          |              |          |          |            | x              |

这样可以让 `qa-channel` 保持为覆盖广泛产品行为的套件，同时让 Matrix、Telegram 以及未来的实时传输共享一个明确的传输契约检查清单。

如需运行一个一次性的 Linux VM 通道，而不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 中安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它复用了与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 套件运行默认都会并行执行多个已选场景，并为每个场景使用隔离的 gateway worker。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不因退出码失败，可使用 `--allow-failures`。
实时运行会转发适合 guest 使用的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及在存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区回写数据。

## 由仓库支持的种子资源

种子资源位于 `qa/` 中：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

之所以将这些内容放在 git 中，是为了让 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用的 markdown 运行器。每个场景 markdown 文件都是一次测试运行的唯一事实来源，并应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件需求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时接口可以保持通用和跨领域。例如，markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合起来，后者通过 Gateway 网关的 `browser.request` 接口驱动嵌入式 Control UI，而无需添加专门的特例运行器。

场景文件应按产品能力而不是源码树文件夹进行分组。文件移动时应保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来实现实现层面的可追溯性。

基线列表应足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体切换交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是由仓库支持的 QA 和 parity gate 的默认确定性 mock 通道。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性的协议、fixture、record/replay 和 chaos 覆盖。它是增量补充，不会替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个 provider 负责自身的默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享的 suite 和 gateway 代码应通过 provider 注册表进行路由，而不是基于 provider 名称分支。

## 传输适配器

`qa-lab` 为 markdown QA 场景提供一个通用的传输接口。
`qa-channel` 是该接口上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite 运行器，而不是增加一个特定于传输的 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告。
- 传输适配器负责 gateway 配置、就绪状态、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时接口。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍然受阻
- 值得添加哪些后续场景

对于角色与风格检查，请在多个实时模型引用上运行同一场景，并写出一份经评判的 Markdown 报告：

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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。角色风格评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型自己正在被评估。该命令会保留每份完整转录、记录基础运行统计信息，然后请求 judge 模型在 fast 模式下、并在支持时使用 `xhigh` 推理，按自然度、氛围和幽默感对各次运行进行排序。

在比较不同 provider 时，使用 `--blind-judge-models`：judge 提示仍会收到每份转录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；在解析完成后，报告会将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，而支持该能力的较旧 OpenAI 评估引用则使用 `xhigh`。你可以通过 `--model provider/model,thinking=<level>` 为特定候选项内联覆盖。`--thinking <level>` 仍然用于设置全局回退值，旧格式 `--model-thinking <provider/model=level>` 也会继续保留以兼容现有用法。

OpenAI 候选引用默认使用 fast 模式，以便在 provider 支持时启用优先处理。若单个候选项或 judge 需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想为每个候选模型都强制开启 fast 模式时，才传入 `--fast`。候选项和 judge 的运行时长都会记录在报告中，用于基准分析，但 judge 提示会明确说明不要按速度进行排序。

候选模型和 judge 模型运行默认都使用并发数 16。当 provider 限制或本地 gateway 压力导致运行噪声过大时，可调低 `--concurrency` 或 `--judge-concurrency`。

当未传入候选 `--model` 时，角色风格评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。

当未传入 `--judge-model` 时，judge 默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
