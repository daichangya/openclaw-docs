---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: 面向 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-23T20:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67443d882d6f8b65fadf1c0f92c88f7b77acab4af5bc282f7b3dbc2d66b8aaa3
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈的目标是以比单个单元测试更贴近真实、按渠道塑形的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、渠道、线程、reaction、编辑和删除等界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察 transcript、注入入站消息，以及导出 Markdown 报告。
- `qa/`：仓库支持的种子资源，用于启动任务和基线 QA 场景。

当前 QA 操作流程是一个双栏 QA 站点：

- 左侧：带智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack transcript 和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动基于 Docker 的 gateway lane，并暴露 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些有效、哪些失败、哪些仍然被阻塞。

如果你希望更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将
`extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch`
会在变更时重建该 bundle，而当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行一个传输层真实的 Matrix 烟雾测试 lane，请执行：

```bash
pnpm openclaw qa matrix
```

该 lane 会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA gateway 子进程内运行真实的 Matrix 插件。该 live transport lane 会将子进程配置限定在被测传输层范围内，因此 Matrix 在子进程配置中不会带有 `qa-channel`。它会将结构化报告产物以及合并的 stdout/stderr 日志写入所选 Matrix QA 输出目录。若要同时捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内本地日志文件。

若要运行一个传输层真实的 Telegram 烟雾测试 lane，请执行：

```bash
pnpm openclaw qa telegram
```

该 lane 会针对一个真实的私有 Telegram 群组，而不是配置一次性服务器。它要求设置 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人间观察效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物而不以失败退出码结束，请使用 `--allow-failures`。
Telegram 报告和摘要会包含每次回复的 RTT，计算范围从 driver 消息发送请求到观察到的 SUT 回复，起始点为 canary。

现在，各 live transport lanes 共用一个更小且统一的契约，而不再各自发明自己的场景列表结构：

`qa-channel` 仍然是广泛的合成产品行为测试套件，不属于 live transport 覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

这样可以让 `qa-channel` 保持为广泛的产品行为测试套件，而 Matrix、Telegram 以及未来的 live transports 则共享一个显式的传输契约检查清单。

若要运行一个不将 Docker 引入 QA 路径的一次性 Linux VM lane，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它复用了与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 套件运行默认都会并行执行多个选定场景，并使用隔离的 gateway worker。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物而不以失败退出码结束，请使用 `--allow-failures`。
live 运行会向 guest 转发适合 guest 使用的受支持 QA 认证输入：基于环境变量的 provider 密钥、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区写回结果。

## 仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意保存在 git 中，以便 QA 计划对人和智能体都可见。

`qa-lab` 应保持为通用 Markdown 运行器。每个场景 Markdown 文件都是单次测试运行的真实来源，并且应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- docs 和 code 引用
- 可选的插件要求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时界面允许保持通用和跨领域。例如，Markdown 场景可以将传输侧辅助函数与浏览器侧辅助函数结合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需新增特例运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。即使文件移动，也应保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来追踪实现来源。

基线列表应足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- memory recall
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## Provider mock lanes

`qa suite` 具有两个本地 provider mock lanes：

- `mock-openai` 是面向场景的 OpenClaw mock。它仍然是仓库支持 QA 和一致性门禁的默认确定性 mock lane。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性协议、夹具、录制/回放和混沌覆盖。它是增量添加，不会替代 `mock-openai` 场景分发器。

provider lane 的实现位于 `extensions/qa-lab/src/providers/` 下。
每个 provider 负责其默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享的 suite 和 gateway 代码应通过 provider 注册表进行路由，而不是按 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一个面向 Markdown QA 场景的通用传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：
未来的真实或合成渠道应接入同一个 suite 运行器，而不是新增某个传输专用 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告。
- 传输适配器负责 gateway 配置、就绪性、入站和出站观察、传输动作以及规范化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时界面。

针对新渠道适配器的维护者使用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 值得添加哪些后续场景

对于角色和风格检查，可在多个 live 模型引用上运行同一场景，并写出经评审的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=xhigh \
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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在被评估。该命令会保留每份完整 transcript，记录基本运行统计，然后以 fast 模式和 `xhigh` reasoning 请求 judge 模型按自然度、氛围和幽默感对这些运行进行排序。
在比较 providers 时，请使用 `--blind-judge-models`：judge 提示仍会获取每份 transcript 和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后将排序结果映射回真实引用。
候选运行默认使用 `high` thinking，对于支持该模式的 OpenAI 模型则使用 `xhigh`。可通过
`--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍可设置全局回退值，而旧的 `--model-thinking <provider/model=level>` 形式则保留用于兼容性。
OpenAI 候选引用默认启用 fast 模式，以便在 provider 支持时使用优先处理。若某个单独候选或 judge 需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你希望为所有候选模型强制启用 fast 模式时，才传递 `--fast`。候选和 judge 的耗时都会记录在报告中用于基准分析，但 judge 提示会明确说明不要按速度排序。
候选和 judge 模型运行的默认并发数均为 16。当 provider 限制或本地 gateway 压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。
当未传递候选 `--model` 时，角色评估默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传递 `--judge-model` 时，judge 默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
