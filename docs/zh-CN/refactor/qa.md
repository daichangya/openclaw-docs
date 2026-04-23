---
read_when:
    - 重构 QA 场景定义或 qa-lab harness 代码
    - 在 Markdown 场景与 TypeScript harness 逻辑之间迁移 QA 行为
summary: 场景目录与 harness 整合的 QA 重构计划
title: QA 重构
x-i18n:
    generated_at: "2026-04-23T21:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ca2257d24ad4face71897d986fd85bea901dcf805894e7b0cfe02f96e2eb95a
    source_path: refactor/qa.md
    workflow: 15
---

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分裂定义模型迁移到单一事实来源：

- 场景元数据
- 发送给模型的提示词
- setup 和 teardown
- harness 逻辑
- 断言和成功标准
- 工件和报告提示

期望的最终状态是：由一个通用 QA harness 加载功能强大的场景定义文件，而不是将大部分行为硬编码在 TypeScript 中。

## 当前状态

当前的主要事实来源位于 `qa/scenarios/index.md`，以及每个
场景对应的 `qa/scenarios/<theme>/*.md` 文件中。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA 包元数据
  - 运维者身份
  - 启动任务
- `qa/scenarios/<theme>/*.md`
  - 每个场景一个 markdown 文件
  - 场景元数据
  - 处理器绑定
  - 场景专属执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 从 markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 注入生成的兼容文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 markdown 定义的处理器绑定来选择可执行场景
- QA bus 协议 + UI
  - 用于图片/视频/音频/文件渲染的通用内联附件

仍然分裂的界面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然拥有大多数可执行的自定义处理器逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

因此，事实来源分裂问题已修复，但执行仍然主要是由处理器驱动，而不是完全声明式。

## 真实的场景表面是什么样子

阅读当前 suite 可以看到几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程跟进
- 模型切换
- 审批后续执行
- reaction/edit/delete

### 配置和运行时变更

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### 文件系统和仓库断言

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Memory 编排

- memory recall
- channel 上下文中的 memory 工具
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### 工具和插件集成

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### 多轮与多参与者

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

这些分类很重要，因为它们决定了 DSL 的需求。仅有提示词 + 预期文本的扁平列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 和 `qa/scenarios/<theme>/*.md` 作为
编写时的事实来源。

该包应保持：

- 在审查中对人类可读
- 对机器可解析
- 足够丰富，以驱动：
  - suite 执行
  - QA 工作区引导
  - QA Lab UI 元数据
  - 文档/发现提示
  - 报告生成

### 首选编写格式

使用 markdown 作为顶层格式，并在其中嵌入结构化 YAML。

推荐结构：

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider 覆盖
  - prerequisites
- prose section
  - objective
  - notes
  - debugging hints
- fenced YAML block
  - setup
  - steps
  - assertions
  - cleanup

这样可以获得：

- 比超大 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格解析和 zod 校验

原始 JSON 只应作为中间生成形式使用。

## 提议的场景文件结构

示例：

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.5
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL 必须覆盖的 runner 能力

根据当前 suite，通用 runner 需要的不只是提示词执行。

### 环境和 setup 操作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 智能体轮次操作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置和运行时操作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件和工件操作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Memory 和 cron 操作

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 操作

- `mcp.callTool`

### 断言

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 变量和工件引用

DSL 必须支持保存输出并在后续引用。

来自当前 suite 的示例：

- 创建一个线程，然后复用 `threadId`
- 创建一个会话，然后复用 `sessionKey`
- 生成一张图片，然后在下一轮把该文件作为附件
- 生成一个 wake marker 字符串，然后断言它稍后会出现

需要的能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 针对路径、会话键、线程 id、marker、工具输出的类型化引用

如果没有变量支持，harness 就会继续把场景逻辑泄漏回 TypeScript 中。

## 哪些内容应保留为逃生口

在第一阶段，实现一个完全纯声明式的 runner 并不现实。

有些场景天生就高度依赖编排：

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

这些场景目前应继续使用显式自定义处理器。

推荐规则：

- 85-90% 声明式
- 对于困难的剩余部分，使用显式 `customHandler` 步骤
- 仅允许具名且有文档的自定义处理器
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎干净，又能继续推进。

## 架构变更

### 当前

场景 markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区引导文件
- QA Lab UI 场景目录
- 报告元数据
- 发现提示

生成的兼容内容：

- 注入的工作区仍包含 `QA_KICKOFF_TASK.md`
- 注入的工作区仍包含 `QA_SCENARIO_PLAN.md`
- 注入的工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### Phase 1：加载器和 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 为具名 markdown YAML 包内容添加了解析器
- 使用 zod 进行校验
- 将消费者切换为使用解析后的包
- 移除了仓库级 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### Phase 2：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有 helper 函数作为引擎操作

交付物：

- 引擎可执行简单的声明式场景

首先从那些基本是 prompt + wait + assert 的场景开始：

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

交付物：

- 第一批真正通过通用引擎运行的 markdown 定义场景发布

### Phase 4：迁移中等复杂度场景

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

交付物：

- 变量、工件、工具断言、request-log 断言得到验证

### Phase 5：将困难场景保留在自定义处理器中

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

交付物：

- 相同的编写格式，但在需要时使用显式 custom-step 块

### Phase 6：删除硬编码场景映射

一旦包覆盖足够完善：

- 删除 `extensions/qa-lab/src/suite.ts` 中大部分按场景写死的 TypeScript 分支

## Fake Slack / 富媒体支持

当前的 QA bus 仍然是文本优先的。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

当前 QA bus 支持：

- 文本
- reaction
- thread

它还不能建模内联媒体附件。

### 所需的传输合约

添加一个通用 QA bus 附件模型：

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

然后把 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用模型

不要构建一个仅限 Slack 的媒体模型。

而应采用：

- 一个通用 QA 传输模型
- 在其上实现多个渲染器
  - 当前 QA Lab 聊天视图
  - 未来 fake Slack Web
  - 其他任何 fake 传输视图

这样可以防止逻辑重复，并让媒体场景保持与传输无关。

### 所需的 UI 工作

更新 QA UI，使其能够渲染：

- 内联图片预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已能渲染 thread 和 reaction，因此附件渲染应能叠加到同一消息卡片模型上。

### 媒体传输将启用的场景工作

一旦附件能够通过 QA bus 流动，我们就可以添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图片回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一个实现块应当是：

1. 添加 markdown 场景加载器 + zod schema
2. 从 markdown 生成当前目录
3. 先迁移少量简单场景
4. 添加通用 QA bus 附件支持
5. 在 QA UI 中渲染内联图片
6. 然后扩展到音频和视频

这是能够同时证明两个目标的最小路径：

- 通用、由 markdown 定义的 QA
- 更丰富的 fake 消息表面

## 开放问题

- 场景文件是否应允许嵌入支持变量插值的 markdown 提示模板
- setup/cleanup 应该是具名 section，还是仅仅作为有序操作列表
- 工件引用在 schema 中应为强类型，还是基于字符串
- 自定义处理器应放在一个注册表中，还是按 surface 拆分为多个注册表
- 在迁移期间，生成的 JSON 兼容文件是否应继续保留为已检入状态
