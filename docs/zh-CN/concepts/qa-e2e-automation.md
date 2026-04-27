---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表盘构建更高真实度的 QA 自动化
summary: qa-lab、qa-channel、带种子场景和协议报告的私有 QA 自动化形态
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-27T06:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d439b460967ea8386e079059db73b709174bfaae7160212e7a1d5ff981c0cd3c
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈旨在以比单个单元测试更贴近真实、
更具渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、频道、线程、
  reaction、编辑和删除等界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、
  注入入站消息以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA
  场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表盘（Control UI）。
- 右侧：QA Lab，显示类 Slack 的对话记录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点、启动由 Docker 支持的 gateway lane，并暴露
QA Lab 页面，供操作员或自动化循环向智能体下发 QA
任务、观察真实渠道行为，并记录哪些内容有效、失败或仍被阻塞。

为了更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，
可以使用 bind-mount 的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务基于预构建镜像运行，并将
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch`
会在变更时重建该 bundle，而当 QA Lab 资源哈希变化时浏览器会自动重载。

若要运行本地 OpenTelemetry trace 冒烟测试，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，运行
启用了 `diagnostics-otel` 插件的 `otel-trace-smoke` QA 场景，然后
解码导出的 protobuf span，并断言关键发布形态：
必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled` 和 `openclaw.message.delivery`；
成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和
`openclaw.content.*` 属性不得进入 trace。它会在
QA 套件工件旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅限源代码检出使用。npm tarball 有意省略了
QA Lab，因此软件包 Docker 发布 lane 不会运行 `qa` 命令。更改诊断
埋点时，请在已构建的源代码检出中使用 `pnpm qa:otel:smoke`。

若要运行基于真实传输的 Matrix 冒烟 lane，请执行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该 lane 会在 Docker 中配置一次性的 Tuwunel homeserver，注册
临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA gateway 子进程中
运行真实 Matrix 插件。实时传输 lane 会将子进程配置限定在待测传输范围内，
因此 Matrix 会在子进程配置中不启用 `qa-channel` 的情况下运行。它会将结构化报告工件和
合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若要同时捕获外层
`scripts/run-node.mjs` 的构建/启动器输出，请将
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内的日志文件。
默认会打印 Matrix 进度。CLI 默认 profile 为 `all`，因此
直接运行 `pnpm openclaw qa matrix` 仍会执行完整目录。对于发布关键的传输契约，
请使用 `--profile fast`；或使用 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` 对完整覆盖进行分片。`--fail-fast`
会在第一个场景失败后停止，适合用作发布门禁而不是
完整清单。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制整个运行时间，
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 可为 CI 缩短无回复静默窗口，
`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时间，以便卡住的
Docker 拆除流程报告精确的恢复命令，而不是一直挂起。

若要运行基于真实传输的 Telegram 冒烟 lane，请执行：

```bash
pnpm openclaw qa telegram
```

该 lane 面向一个真实的私有 Telegram 群组，而不是配置
一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且需要两个位于同一
私有群组中的不同机器人。SUT 机器人必须拥有 Telegram 用户名，
并且当两个机器人都在 `@BotFather` 中启用了
Bot-to-Bot Communication Mode 时，机器人到机器人的观察效果最佳。
任何场景失败时，命令都会以非零状态退出。若你
想保留工件但不使用失败退出码，请使用 `--allow-failures`。
Telegram 报告和摘要包含每次回复的 RTT，范围从 driver 消息
发送请求到观察到的 SUT 回复，从 canary 开始。

在使用池化的实时凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

该 doctor 会检查 Convex broker 环境、验证端点设置，并在存在
维护者密钥时验证 admin/list 可达性。它只会报告密钥是已设置还是缺失。

若要运行基于真实传输的 Discord 冒烟 lane，请执行：

```bash
pnpm openclaw qa discord
```

该 lane 面向一个真实的私有 Discord guild 渠道，包含两个机器人：
一个由 harness 控制的 driver 机器人，以及一个由子 OpenClaw gateway
通过内置 Discord 插件启动的 SUT 机器人。使用环境凭证时，
它需要 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`，
以及 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该 lane 会验证渠道提及处理，并检查 SUT 机器人是否已经
向 Discord 注册原生 `/help` 命令。
任何场景失败时，命令都会以非零状态退出。若你
想保留工件但不使用失败退出码，请使用 `--allow-failures`。

实时传输 lane 现在共享同一套较小的契约，而不是各自发明
自己的场景列表形状：

`qa-channel` 仍然是覆盖范围广的合成产品行为套件，不属于
实时传输覆盖矩阵的一部分。

| Lane     | Canary | 提及门控 | allowlist 阻止 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | reaction 观察 | help 命令 | 原生命令注册 |
| -------- | ------ | -------- | -------------- | -------- | -------- | ------------ | -------- | --------------- | --------- | ------------ |
| Matrix   | x      | x        | x              | x        | x        | x            | x        | x               |           |              |
| Telegram | x      | x        |                |          |          |              |          |                 | x         |              |
| Discord  | x      | x        |                |          |          |              |          |                 |           | x            |

这样可以让 `qa-channel` 继续作为覆盖广泛的产品行为套件，而 Matrix、
Telegram 和未来的实时传输则共享一份明确的传输契约检查清单。

若要在不将 Docker 引入 QA 路径的情况下运行一次性 Linux VM lane，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、
构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和
摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用了与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认都会并行执行多个已选场景，
并使用隔离的 gateway worker。`qa-channel` 默认并发数为 4，
上限受所选场景数量限制。使用 `--concurrency <count>` 可调整
worker 数量，或使用 `--concurrency 1` 串行执行。
任何场景失败时，命令都会以非零状态退出。若你
想保留工件但不使用失败退出码，请使用 `--allow-failures`。
实时运行会转发那些适合 guest 使用的受支持 QA 认证输入：
基于环境变量的 provider 密钥、QA 实时 provider 配置路径，
以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，
以便 guest 能通过挂载的工作区回写结果。

## 由仓库支持的种子

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，以便 QA 计划对人类和
智能体都可见。

`qa-lab` 应保持为通用的 Markdown 运行器。每个场景 Markdown 文件
都是单次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、lane 和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用和跨领域。
例如，Markdown 场景可以组合传输侧辅助工具与浏览器侧辅助工具，
通过 Gateway 网关的 `browser.request` seam 驱动嵌入式 Control UI，而无需添加专门的运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持
场景 ID 稳定；通过 `docsRefs` 和 `codeRefs` 实现实现层面的可追溯性。

基线列表应足够广，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## Provider mock lanes

`qa suite` 有两个本地 provider mock lane：

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是
  由仓库支持的 QA 和一致性门禁的默认确定性 mock lane。
- `aimock` 会启动由 AIMock 支持的 provider 服务器，用于实验性的协议、
  夹具、录制/回放和混沌覆盖。它是增量补充，不会替代 `mock-openai`
  场景分发器。

Provider lane 实现位于 `extensions/qa-lab/src/providers/` 下。
每个 provider 负责自己的默认值、本地服务器启动、Gateway 网关模型配置、
auth-profile 暂存需求以及实时/mock 能力标志。共享的 suite 和
gateway 代码应通过 provider 注册表进行路由，而不是基于 provider 名称分支。

## 传输适配器

`qa-lab` 拥有面向 Markdown QA 场景的通用传输 seam。
`qa-channel` 是该 seam 上的第一个适配器，但设计目标更广：
未来的真实或合成渠道应接入同一个 suite 运行器，
而不是新增特定于传输的 QA 运行器。

在架构层面，分工如下：

- `qa-lab` 负责通用场景执行、worker 并发、工件写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪性、入站与出站观察、传输操作以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

面向维护者的新渠道适配器接入指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 什么有效
- 什么失败
- 什么仍被阻塞
- 值得补充哪些后续场景

对于角色与风格检查，可在多个实时模型引用上运行同一场景，
并写出经评审的 Markdown 报告：

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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。Character eval
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。不应告诉候选模型
它正在接受评估。该命令会保留每份完整对话记录、记录基础运行统计，
然后让 judge 模型在 fast 模式下、并在支持时使用 `xhigh` 推理，
按自然度、氛围和幽默感对各次运行进行排序。
在比较不同 provider 时使用 `--blind-judge-models`：judge 提示词仍会收到
每份对话记录和运行状态，但候选引用会被替换为中性标签，
例如 `candidate-01`；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，对 GPT-5.5 使用 `medium`，对支持的旧版 OpenAI eval 引用使用 `xhigh`。
可通过 `--model provider/model,thinking=<level>` 为特定候选模型内联覆盖。
`--thinking <level>` 仍用于设置全局回退值，而旧格式
`--model-thinking <provider/model=level>` 也会保留以兼容旧用法。

OpenAI 候选引用默认启用 fast 模式，以便在 provider 支持时使用优先处理。
当某个单独的候选或 judge 需要覆盖时，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。
仅当你想为每个候选模型强制开启 fast 模式时，才传入 `--fast`。
候选和 judge 的时长都会记录到报告中用于基准分析，但 judge 提示词会明确说明
不要按速度排名。

候选和 judge 模型运行默认都使用 16 的并发度。当 provider 限制
或本地 Gateway 网关压力使运行噪声过大时，可降低
`--concurrency` 或 `--judge-concurrency`。

当未传入任何候选 `--model` 时，character eval 默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传入任何 `--judge-model` 时，judge 默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表盘](/zh-CN/web/dashboard)
