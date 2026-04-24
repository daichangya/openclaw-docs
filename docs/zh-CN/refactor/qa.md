---
read_when:
    - 重构 QA 场景定义或 qa-lab harness 代码
    - 在 Markdown 场景与 TypeScript harness 逻辑之间迁移 QA 行为
summary: QA 重构计划：场景目录与 harness 整合
title: QA 重构
x-i18n:
    generated_at: "2026-04-24T04:20:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从“定义分散”的模式迁移为单一事实来源：

- 场景元数据
- 发送给模型的提示词
- 设置与清理
- harness 逻辑
- 断言与成功标准
- 产物与报告提示

期望的最终状态是：一个通用的 QA harness 加载功能强大的场景定义文件，而不是在 TypeScript 中硬编码大多数行为。

## 当前状态

主要事实来源现在位于 `qa/scenarios/index.md`，以及每个场景对应的 `qa/scenarios/<theme>/*.md` 文件中。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA 包元数据
  - 操作员身份
  - 启动任务
- `qa/scenarios/<theme>/*.md`
  - 每个场景一个 Markdown 文件
  - 场景元数据
  - handler 绑定
  - 场景特定执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 基于 Markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 Markdown 定义的 handler 绑定选择可执行场景
- QA bus 协议 + UI
  - 用于图片/视频/音频/文件渲染的通用内联附件

仍然分散的表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然拥有大多数可执行的自定义 handler 逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

因此，事实来源分裂的问题已经修复，但执行仍然主要依赖 handler，而不是完全声明式。

## 实际的场景表面是什么样

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程跟进
- 模型切换
- 审批后续执行
- 反应/编辑/删除

### 配置与运行时变更

- 配置补丁禁用 skill
- 配置应用后重启唤醒
- 配置重启能力切换
- 运行时清单漂移检查

### 文件系统与代码仓库断言

- source/docs 发现报告
- 构建 Lobster Invaders
- 生成图片产物查找

### Memory 编排

- Memory 召回
- 渠道上下文中的 Memory 工具
- Memory 失败回退
- 会话 Memory 排序
- 线程 Memory 隔离
- Memory Dreaming sweep

### 工具与插件集成

- MCP plugin-tools 调用
- skill 可见性
- skill 热安装
- 原生图片生成
- 图片往返
- 基于附件的图片理解

### 多轮与多参与者

- subagent 交接
- subagent 扇出综合
- 重启恢复类流程

这些分类很重要，因为它们决定 DSL 的需求。单纯的“提示词 + 期望文本”平铺列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 与 `qa/scenarios/<theme>/*.md` 作为编写时的事实来源。

这个包应保持：

- 在代码评审中易于阅读
- 可被机器解析
- 足够丰富，能够驱动：
  - suite 执行
  - QA 工作区 bootstrap
  - QA Lab UI 元数据
  - docs/discovery 提示词
  - 报告生成

### 首选编写格式

使用 Markdown 作为顶层格式，并在其中嵌入结构化 YAML。

推荐形态：

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
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

这样可以获得：

- 比大型 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格解析与 zod 校验

原始 JSON 仅可作为中间生成格式接受。

## 建议的场景文件形态

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

根据当前 suite，通用 runner 需要的不只是提示词执行。

### 环境与设置动作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 智能体轮次动作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置与运行时动作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件与产物动作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Memory 与 cron 动作

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 动作

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

- 创建一个线程，然后复用 `threadId`
- 创建一个会话，然后复用 `sessionKey`
- 生成一张图片，然后在下一轮中附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 针对路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，harness 逻辑就会继续从场景泄漏回 TypeScript。

## 哪些部分应保留为逃生舱

在第 1 阶段，实现一个完全纯声明式的 runner 并不现实。

有些场景天然就需要大量编排：

- Memory Dreaming sweep
- 配置应用后重启唤醒
- 配置重启能力切换
- 基于时间戳/路径的生成图片产物解析
- discovery-report 评估

目前这些场景应继续使用显式自定义 handler。

推荐规则：

- 85-90% 声明式
- 对于剩余较难的部分，使用显式 `customHandler` 步骤
- 仅允许具名且有文档的自定义 handler
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎整洁，又能继续推进。

## 架构变更

### 当前

场景 Markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区 bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- discovery 提示词

生成的兼容性内容：

- 种子工作区仍然包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍然包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在也包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 为具名 Markdown YAML 包内容添加了解析器
- 使用 zod 进行校验
- 将消费者切换到解析后的包
- 移除了仓库级的 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎可执行简单的声明式场景

从主要是“提示词 + 等待 + 断言”的场景开始：

- 线程跟进
- 基于附件的图片理解
- skill 可见性与调用
- 渠道基线

交付物：

- 第一批真正由 Markdown 定义并通过通用引擎运行的场景上线

### 第 4 阶段：迁移中等复杂度场景

- 图片生成往返
- 渠道上下文中的 Memory 工具
- 会话 Memory 排序
- subagent 交接
- subagent 扇出综合

交付物：

- 变量、产物、工具断言、request-log 断言已被验证

### 第 5 阶段：保留困难场景为自定义 handler

- Memory Dreaming sweep
- 配置应用后重启唤醒
- 配置重启能力切换
- 运行时清单漂移

交付物：

- 相同的编写格式，但在需要时带有显式 custom-step 块

### 第 6 阶段：删除硬编码场景映射

一旦包覆盖率足够高：

- 删除 `extensions/qa-lab/src/suite.ts` 中大多数按场景分支的 TypeScript 逻辑

## Fake Slack / 富媒体支持

当前的 QA bus 以文本优先。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

目前 QA bus 支持：

- 文本
- 反应
- 线程

它还不能对内联媒体附件建模。

### 所需传输契约

添加一个通用的 QA bus 附件模型：

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

然后将 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么先做通用模型

不要构建仅适用于 Slack 的媒体模型。

而应该采用：

- 一个通用的 QA 传输模型
- 在其上构建多个渲染器
  - 当前 QA Lab 聊天视图
  - 未来的 fake Slack web
  - 任何其他 fake transport 视图

这样可以避免重复逻辑，并让媒体场景保持传输无关。

### 所需 UI 工作

更新 QA UI，以渲染：

- 内联图片预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染线程与反应，因此附件渲染应当能够叠加到同一套消息卡片模型上。

### 媒体传输启用后的场景工作

一旦附件可以通过 QA bus 流转，就可以添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图片回复
- 音频附件理解
- 视频附件理解
- 混合附件排序
- 保留媒体的线程回复

## 建议

下一块实现工作应当是：

1. 添加 Markdown 场景加载器 + zod schema
2. 从 Markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA bus 附件支持
5. 在 QA UI 中渲染内联图片
6. 然后扩展到音频和视频

这是能够同时证明两个目标的最小路径：

- 通用的、由 Markdown 定义的 QA
- 更丰富的 fake messaging surfaces

## 未决问题

- 场景文件是否应允许嵌入带变量插值的 Markdown 提示词模板
- 设置/清理应当是具名 section，还是仅作为有序动作列表
- 产物引用在 schema 中应采用强类型，还是基于字符串
- 自定义 handler 应集中放在一个 registry 中，还是按 surface 分 registry
- 在迁移期间，生成的 JSON 兼容文件是否应继续检入

## 相关内容

- [QA E2E 自动化](/zh-CN/concepts/qa-e2e-automation)
