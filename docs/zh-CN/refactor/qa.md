---
x-i18n:
    generated_at: "2026-04-07T22:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a13a050574d3fbd7a9a935aa57aa260a92975029b64418633df55159fd7cb29
    source_path: refactor/qa.md
    workflow: 15
---

# QA 重构

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从拆分定义模型迁移到单一事实来源：

- 场景元数据
- 发送给模型的提示词
- 设置与清理
- harness 逻辑
- 断言与成功判定标准
- 产物与报告提示

期望的最终状态是一个通用的 QA harness，它加载功能强大的场景定义文件，而不是在 TypeScript 中硬编码大部分行为。

## 当前状态

当前的主要事实来源现在位于 `qa/scenarios.md`。

已实现：

- `qa/scenarios.md`
  - 规范 QA 包
  - 操作员身份
  - 启动任务
  - 场景元数据
  - 处理器绑定
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 从 markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性文件种子，以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 markdown 定义的处理器绑定选择可执行场景
- QA 总线协议 + UI
  - 用于图像 / 视频 / 音频 / 文件渲染的通用内联附件

仍然拆分的表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然承载大部分可执行自定义处理器逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出推导报告结构

所以事实来源拆分的问题已经修复，但执行仍然主要依赖处理器支持，而不是完全声明式。

## 实际的场景表面是什么样的

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批跟进执行
- 反应 / 编辑 / 删除

### 配置与运行时变更

- 配置补丁技能禁用
- 配置应用重启唤醒
- 配置重启能力切换
- 运行时清单漂移检查

### 文件系统与仓库断言

- source / docs 发现报告
- 构建 Lobster Invaders
- 生成图像产物查找

### 记忆编排

- 记忆召回
- 渠道上下文中的记忆工具
- 记忆失败回退
- 会话记忆排序
- 线程记忆隔离
- 记忆 dreaming 清扫

### 工具与插件集成

- MCP plugin-tools 调用
- skill 可见性
- skill 热安装
- 原生图像生成
- 图像往返
- 从附件理解图像

### 多轮与多参与者

- subagent 交接
- subagent 扇出综合
- 重启恢复类流程

这些类别很重要，因为它们决定了 DSL 的需求。单纯的“提示词 + 预期文本”平面列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios.md` 作为编写时的事实来源。

这个包应保持：

- 在评审中便于人类阅读
- 可被机器解析
- 足够丰富，以驱动：
  - suite 执行
  - QA 工作区 bootstrap
  - QA Lab UI 元数据
  - 文档 / 发现提示词
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
  - model / provider 覆盖
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

这带来：

- 比庞大的 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格的解析与 zod 校验

原始 JSON 仅可作为中间生成形式接受。

## 拟议的场景文件结构

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
````

# 步骤

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

# 预期

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

根据当前的 suite，通用 runner 需要的不只是提示词执行。

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

### 记忆与 cron 动作

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
- 生成一张图像，然后在下一轮附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后会出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 针对路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，harness 就会继续把场景逻辑泄漏回 TypeScript。

## 哪些应保留为逃生舱口

在第 1 阶段，实现一个完全纯粹的声明式 runner 并不现实。

有些场景天然就高度依赖编排：

- 记忆 dreaming 清扫
- 配置应用重启唤醒
- 配置重启能力切换
- 按时间戳 / 路径解析生成图像产物
- discovery-report 评估

这些目前应继续使用显式自定义处理器。

推荐规则：

- 85-90% 声明式
- 对于剩余的困难部分，使用显式 `customHandler` 步骤
- 只允许具名且有文档的自定义处理器
- 场景文件中不允许匿名内联代码

这样可以保持通用引擎整洁，同时仍然允许推进。

## 架构变更

### 当前

场景 markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区 bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- 发现提示词

生成的兼容性内容：

- 种子工作区仍然包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍然包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios.md`
- 添加了用于具名 markdown YAML 包内容的解析器
- 使用 zod 进行校验
- 将消费者切换为使用解析后的包
- 移除了仓库级 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎执行简单的声明式场景

先从那些主要是“提示词 + 等待 + 断言”的场景开始：

- 线程后续跟进
- 从附件理解图像
- skill 可见性与调用
- 渠道基线

交付物：

- 第一批真正由 markdown 定义、并通过通用引擎交付的场景

### 第 4 阶段：迁移中等复杂度场景

- 图像生成往返
- 渠道上下文中的记忆工具
- 会话记忆排序
- subagent 交接
- subagent 扇出综合

交付物：

- 变量、产物、工具断言、request-log 断言都已被验证

### 第 5 阶段：将困难场景保留在自定义处理器上

- 记忆 dreaming 清扫
- 配置应用重启唤醒
- 配置重启能力切换
- 运行时清单漂移

交付物：

- 相同的编写格式，但在需要时带有显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

当包覆盖率足够好之后：

- 移除 `extensions/qa-lab/src/suite.ts` 中大部分按场景区分的 TypeScript 分支

## 假 Slack / 富媒体支持

当前 QA 总线以文本为主。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

如今 QA 总线支持：

- 文本
- 反应
- 线程

它还不能对内联媒体附件建模。

### 所需传输契约

添加一个通用 QA 总线附件模型：

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
````

然后将 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用模型

不要构建仅限 Slack 的媒体模型。

相反，应采用：

- 一个通用的 QA 传输模型
- 在其上构建多个渲染器
  - 当前 QA Lab 聊天界面
  - 未来的假 Slack Web
  - 任何其他假传输视图

这样可以避免重复逻辑，并让媒体场景保持与传输层无关。

### 所需 UI 工作

更新 QA UI，使其能够渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件标签

当前 UI 已经可以渲染线程与反应，因此附件渲染应能叠加到相同的消息卡片模型上。

### 媒体传输启用后的场景工作

一旦附件能够流经 QA 总线，我们就可以添加更丰富的假聊天场景：

- 假 Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一块实现工作应该是：

1. 添加 markdown 场景加载器 + zod schema
2. 从 markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA 总线附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是能够同时验证两个目标的最小路径：

- 通用的 markdown 定义 QA
- 更丰富的假消息表面

## 未决问题

- 场景文件是否应允许嵌入带变量插值的 markdown 提示词模板
- setup / cleanup 应该是具名 section，还是仅仅作为有序动作列表
- 产物引用在 schema 中应是强类型，还是基于字符串
- 自定义处理器应放在单一 registry 中，还是按 surface 分 registry
- 迁移期间，生成的 JSON 兼容性文件是否应继续保留在版本控制中
