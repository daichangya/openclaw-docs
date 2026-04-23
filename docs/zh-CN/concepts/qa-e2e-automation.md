---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-23T22:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8cf607af9e85c1f6908049da2b31a1c6c9eaa1fc95bc3af2136babb1a3b9b48f
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 堆栈旨在以比单个单元测试更贴近真实渠道形态的方式演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具有私信、渠道、线程、reaction、编辑和删除界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察记录、注入入站消息以及导出 Markdown 报告。
- `qa/`：用于启动任务和基线 QA 场景的仓库支撑种子资源。

当前 QA 操作流是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 的记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面。在该页面中，操作员或自动化循环可以向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容成功、失败或仍被阻塞。

如果希望更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，请使用带有绑定挂载 QA Lab bundle 的方式启动堆栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

如果要运行一个基于真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA Gateway 网关子进程内运行真实的 Matrix 插件。该实时传输通道会将子配置限定在正在测试的传输范围内，因此 Matrix 运行时子配置中不会包含 `qa-channel`。它会将结构化报告工件和合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若还要捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内本地日志文件路径。

如果要运行一个基于真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会针对一个真实的私有 Telegram 群组，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人到机器人的观测效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你希望在不以失败退出码结束的情况下获取工件，请使用 `--allow-failures`。
Telegram 报告和摘要会包含每条回复的 RTT，时间范围从 driver 消息发送请求开始，到观察到 SUT 回复为止，包含 canary。

实时传输通道现在共享一个更小的契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖面更广的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | 允许列表拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观测 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

这样可以让 `qa-channel` 保持为广覆盖的产品行为套件，同时让 Matrix、Telegram 和未来的实时传输共享一个明确的传输契约检查清单。

如果你想在不将 Docker 引入 QA 路径的情况下运行一个一次性 Linux VM 通道，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 来宾机，在来宾机中安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它会复用与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 套件运行默认都会通过隔离的 Gateway 网关 worker 并行执行多个已选场景。`qa-channel` 默认并发数为 4，并受所选场景数量上限约束。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你希望在不以失败退出码结束的情况下获取工件，请使用 `--allow-failures`。
实时运行会转发适合来宾机使用的受支持 QA auth 输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样来宾机才能通过挂载的工作区写回结果。

## 基于仓库的种子资源

种子资源位于 `qa/` 中：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时界面可以保持通用和跨领域。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具组合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需增加特殊用途运行器。

场景文件应按产品能力而不是源代码树目录进行分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 实现实现层面的可追溯性。

基线列表应保持足够宽广，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆回溯
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地 provider mock 通道：

- `mock-openai` 是面向场景的 OpenClaw mock。它仍然是基于仓库 QA 和一致性关卡的默认确定性 mock 通道。
- `aimock` 会启动一个由 AIMock 支撑的 provider 服务器，用于实验性协议、夹具、录制/回放和混沌测试覆盖。它是增量补充，不替代 `mock-openai` 场景分发器。

provider 通道实现位于 `extensions/qa-lab/src/providers/` 下。每个 provider 自行管理其默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求以及 live/mock 能力标志。共享套件和 Gateway 网关代码应通过 provider 注册表进行路由，而不是基于 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一个用于 Markdown QA 场景的通用传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个套件运行器，而不是新增一个传输专用 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、worker 并发、工件写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站观测、传输操作以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时界面。

面向维护者的新渠道适配器接入指南位于
[Testing](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些内容成功了
- 哪些内容失败了
- 哪些内容仍被阻塞
- 值得补充哪些后续场景

对于角色与风格检查，可以让同一场景在多个实时模型引用上运行，并写出一份经过评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai-codex/gpt-5.5,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai-codex/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评测场景应通过 `SOUL.md` 设置人格，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型自己正在被评估。该命令会保留每份完整记录，记录基本运行统计信息，然后以 fast 模式和 `xhigh` 推理要求评审模型根据自然度、氛围和幽默感对运行结果进行排序。
在比较不同 provider 时，请使用 `--blind-judge-models`：评审提示仍会获得每份记录和运行状态，但候选引用会被替换为类似 `candidate-01` 的中性标签；报告会在解析后将排名映射回真实引用。
候选运行默认使用 `high` thinking，而支持该能力的 OpenAI 模型默认使用 `xhigh`。可通过 `--model provider/model,thinking=<level>` 内联覆盖某个特定候选。`--thinking <level>` 仍可设置全局后备值，而旧版 `--model-thinking <provider/model=level>` 形式也会保留以保持兼容性。
OpenAI 候选引用默认使用 fast 模式，以便在 provider 支持时使用优先处理。若单个候选或评审需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你希望对每个候选模型都强制启用 fast 模式时，才传入 `--fast`。
候选和评审的持续时间都会记录在报告中用于基准分析，但评审提示会明确说明不要按速度进行排名。
候选模型运行和评审模型运行的默认并发数均为 16。当 provider 限制或本地 Gateway 网关压力导致运行噪声过大时，可降低 `--concurrency` 或 `--judge-concurrency`。
如果未传入候选 `--model`，角色评测默认会使用
`openai-codex/gpt-5.5`、`openai/gpt-5.4`、`openai/gpt-5.2`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
如果未传入 `--judge-model`，评审默认使用
`openai-codex/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Testing](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
