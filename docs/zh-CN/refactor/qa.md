---
x-i18n:
    generated_at: "2026-04-08T02:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e156cc8e2fe946a0423862f937754a7caa1fe7e6863b50a80bff49a1c86e1e8
    source_path: refactor/qa.md
    workflow: 15
---

# QA 重构

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从“定义分散”的模型迁移为单一事实来源：

- 场景元数据
- 发送给模型的提示词
- 设置与清理
- harness 逻辑
- 断言与成功标准
- 产物与报告提示

理想的最终状态是：一个通用 QA harness 加载功能强大的场景定义文件，而不是将大多数行为硬编码在 TypeScript 中。

## 当前状态

当前的主要事实来源位于 `qa/scenarios.md`。

已实现：

- `qa/scenarios.md`
  - 规范 QA 包
  - 操作员身份
  - 启动任务
  - 场景元数据
  - handler 绑定
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 从 markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件种子以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 markdown 定义的 handler 绑定选择可执行场景
- QA bus 协议 + UI
  - 用于渲染图片 / 视频 / 音频 / 文件的通用内联附件

仍然分散的部分：

- `extensions/qa-lab/src/suite.ts`
  - 仍然承载大部分可执行的自定义 handler 逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

所以，事实来源的分散问题已经修复，但执行层仍然主要依赖 handler 支撑，而不是完全声明式。

## 真实的场景层长什么样

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批后续执行
- reaction / edit / delete

### 配置与运行时变更

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### 文件系统与仓库断言

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### 内存编排

- memory recall
- 渠道上下文中的 memory tools
- memory failure fallback
- session memory ranking
- 线程 memory 隔离
- memory dreaming sweep

### 工具与插件集成

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- 从附件进行图片理解

### 多轮与多参与者

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

这些分类很重要，因为它们会驱动 DSL 的需求。仅有“提示词 + 期望文本”的平面列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios.md` 作为编写时的单一事实来源。

这个包应保持：

- 便于在评审中阅读
- 可被机器解析
- 足够丰富，能够驱动：
  - suite 执行
  - QA 工作区 bootstrap
  - QA Lab UI 元数据
  - docs / discovery 提示词
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
  - model / provider overrides
  - prerequisites
- prose sections
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

这样可以带来：

- 比庞大的 JSON 更适合 PR 阅读
- 比纯 YAML 提供更丰富的上下文
- 严格解析和 zod 校验

原始 JSON 仅可作为中间生成格式接受。

## 提议的场景文件结构

示例：

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
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

基于当前 suite，通用 runner 需要的不仅仅是提示词执行。

### 环境与设置操作

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

### 配置与运行时操作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件与产物操作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### memory 与 cron 操作

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

## 变量与产物引用

DSL 必须支持保存输出并在后续引用。

当前 suite 中的示例：

- 创建一个 thread，然后复用 `threadId`
- 创建一个 session，然后复用 `sessionKey`
- 生成一张图片，然后在下一轮将该文件作为附件附上
- 生成一个 wake marker 字符串，然后断言它稍后会出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 针对路径、session key、thread id、marker、tool 输出的强类型引用

如果没有变量支持，harness 就会继续把场景逻辑泄漏回 TypeScript 中。

## 哪些应保留为逃生口

在第一阶段，实现一个完全纯粹的声明式 runner 并不现实。

有些场景天然就是高度编排型的：

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- 按时间戳 / 路径解析 generated image artifact
- discovery-report evaluation

这些场景目前应继续使用显式的自定义 handler。

推荐规则：

- 85–90% 声明式
- 剩余困难部分使用显式 `customHandler` 步骤
- 仅允许具名且有文档说明的自定义 handler
- 场景文件中不允许匿名内联代码

这样可以保持通用引擎整洁，同时仍能持续推进。

## 架构变更

### 当前

场景 markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区 bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- discovery 提示词

生成的兼容性内容：

- 种子工作区仍包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### Phase 1：loader 与 schema

已完成。

- 添加了 `qa/scenarios.md`
- 添加了针对具名 markdown YAML 包内容的解析器
- 使用 zod 进行了校验
- 将各个消费者切换为使用已解析的包
- 移除了仓库级 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### Phase 2：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎可执行简单的声明式场景

先从主要是“提示词 + 等待 + 断言”的场景开始：

- 线程后续跟进
- 从附件进行图片理解
- skill 可见性与调用
- 渠道基线

交付物：

- 第一批真正由 markdown 定义的场景通过通用引擎发布

### Phase 4：迁移中等复杂度场景

- image generation roundtrip
- 渠道上下文中的 memory tools
- session memory ranking
- subagent handoff
- subagent fanout synthesis

交付物：

- 变量、产物、工具断言、request-log 断言得到验证

### Phase 5：困难场景继续使用自定义 handler

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

交付物：

- 保持相同的编写格式，但在需要时使用显式 custom-step block

### Phase 6：删除硬编码的场景映射

当包覆盖率足够好之后：

- 移除 `extensions/qa-lab/src/suite.ts` 中大部分按场景分支的 TypeScript 逻辑

## Fake Slack / 富媒体支持

当前 QA bus 以文本为主。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

当前 QA bus 支持：

- 文本
- reactions
- threads

它还不能对内联媒体附件建模。

### 所需的传输契约

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

然后为以下类型添加 `attachments?: QaBusAttachment[]`：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用模型

不要构建一个仅限 Slack 的媒体模型。

而应采用：

- 一个通用 QA 传输模型
- 在其之上构建多个渲染器
  - 当前 QA Lab chat
  - 未来的 fake Slack web
  - 任何其他 fake transport 视图

这样可以避免重复逻辑，并让媒体场景保持与传输层无关。

### 所需的 UI 工作

更新 QA UI，使其能够渲染：

- 内联图片预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染 threads 和 reactions，因此附件渲染应能叠加到同一套消息卡片模型上。

### 媒体传输启用后的场景工作

一旦附件可以通过 QA bus 流转，我们就可以添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图片回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的 thread reply

## 建议

下一块实现工作应当是：

1. 添加 markdown 场景 loader + zod schema
2. 从 markdown 生成当前目录
3. 先迁移少量简单场景
4. 添加通用 QA bus 附件支持
5. 在 QA UI 中渲染内联图片
6. 然后扩展到音频和视频

这是同时验证两个目标的最小路径：

- 通用的 markdown 定义 QA
- 更丰富的 fake messaging surfaces

## 开放问题

- 场景文件是否应允许嵌入带变量插值的 markdown 提示词模板
- setup / cleanup 应该是具名 section，还是仅仅使用有序 action 列表
- artifact 引用应在 schema 中强类型化，还是基于字符串
- custom handlers 应放在一个 registry 中，还是按 surface 分 registry
- 在迁移期间，生成的 JSON 兼容性文件是否应继续保留并纳入版本控制
