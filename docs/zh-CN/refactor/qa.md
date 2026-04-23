---
read_when:
    - 重构 QA 场景定义或 qa-lab 测试框架代码
    - 在 Markdown 场景与 TypeScript 测试框架逻辑之间迁移 QA 行为
summary: QA 重构：场景目录与测试框架整合计划
title: QA 重构
x-i18n:
    generated_at: "2026-04-23T06:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# QA 重构

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分裂定义模型迁移为单一事实来源：

- 场景元数据
- 发送给模型的提示词
- 设置与清理
- 测试框架逻辑
- 断言与成功标准
- 产物与报告提示

期望的最终状态是：一个通用 QA 测试框架加载功能强大的场景定义文件，而不是在 TypeScript 中硬编码大部分行为。

## 当前状态

当前的主要事实来源已位于 `qa/scenarios/index.md`，以及
`qa/scenarios/<theme>/*.md` 下每个场景对应的单独文件中。

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
  - 从 Markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容性种子文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 Markdown 定义的 handler 绑定选择可执行场景
- QA bus 协议 + UI
  - 用于图像/视频/音频/文件渲染的通用内联附件

仍然分裂的表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍然承载大部分可执行的自定义 handler 逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出中推导报告结构

因此，事实来源分裂的问题已修复，但执行层面目前仍主要依赖 handler，而非完全声明式。

## 实际的场景表面是什么样的

阅读当前 suite 可以看到几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程跟进
- 模型切换
- 审批继续执行
- 反应/编辑/删除

### 配置与运行时变更

- 配置补丁禁用 Skills
- 配置应用后重启唤醒
- 配置重启能力切换
- 运行时清单漂移检查

### 文件系统与仓库断言

- source/docs 发现报告
- 构建 Lobster Invaders
- 生成图像产物查找

### Memory 编排

- 记忆召回
- 渠道上下文中的记忆工具
- 记忆失败回退
- 会话记忆排序
- 线程记忆隔离
- 记忆 Dreaming 扫描

### 工具与插件集成

- MCP plugin-tools 调用
- skill 可见性
- skill 热安装
- 原生图像生成
- 图像往返
- 从附件理解图像

### 多轮与多参与者

- 子智能体移交
- 子智能体扇出综合
- 重启恢复类流程

这些分类之所以重要，是因为它们决定了 DSL 的需求。仅有“提示词 + 期望文本”的扁平列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 和 `qa/scenarios/<theme>/*.md` 作为编写时的单一事实来源。

这个包应保持：

- 在评审中人类可读
- 机器可解析
- 足够丰富，能够驱动：
  - suite 执行
  - QA 工作区引导
  - QA Lab UI 元数据
  - 文档/发现提示词
  - 报告生成

### 首选编写格式

使用 Markdown 作为顶层格式，并在其中嵌入结构化 YAML。

推荐结构：

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
- 严格解析和 zod 校验

原始 JSON 只应作为中间生成形式被接受。

## 建议的场景文件结构

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

验证生成的媒体会在后续轮次中重新附加。

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
    图像生成检查：生成一张 QA 灯塔图像，并用一句简短的话总结它。
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    图像往返检查：用一句简短的话描述生成的灯塔附件。
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

## DSL 必须覆盖的 Runner 能力

根据当前 suite，通用 runner 需要的不仅仅是执行提示词。

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

### Memory 与 cron 操作

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

来自当前 suite 的示例：

- 创建线程，然后复用 `threadId`
- 创建会话，然后复用 `sessionKey`
- 生成图像，然后在下一轮附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 路径、会话键、线程 ID、标记、工具输出的类型化引用

如果没有变量支持，测试框架逻辑仍会不断从 DSL 泄漏回 TypeScript。

## 哪些内容应保留为逃生口

在第一阶段，实现一个完全纯声明式的 runner 并不现实。

有些场景天生就更偏编排：

- 记忆 Dreaming 扫描
- 配置应用后重启唤醒
- 配置重启能力切换
- 基于时间戳/路径解析生成图像产物
- discovery-report 评估

目前这些应继续使用显式自定义 handler。

推荐规则：

- 85–90% 声明式
- 对于剩余复杂部分，使用显式 `customHandler` 步骤
- 仅允许已命名并有文档的自定义 handler
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎整洁，又能继续推进。

## 架构变更

### 当前

场景 Markdown 现在已是以下内容的事实来源：

- suite 执行
- 工作区引导文件
- QA Lab UI 场景目录
- 报告元数据
- 发现提示词

已生成的兼容性内容：

- 种子工作区仍包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 添加了命名 Markdown YAML 包内容解析器
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
- 从附件理解图像
- skill 可见性与调用
- 渠道基线

交付物：

- 第一批真正由 Markdown 定义并通过通用引擎运行的场景上线

### 第 4 阶段：迁移中等复杂度场景

- 图像生成往返
- 渠道上下文中的记忆工具
- 会话记忆排序
- 子智能体移交
- 子智能体扇出综合

交付物：

- 变量、产物、工具断言、request-log 断言得到验证

### 第 5 阶段：将复杂场景保留在自定义 handler 中

- 记忆 Dreaming 扫描
- 配置应用后重启唤醒
- 配置重启能力切换
- 运行时清单漂移

交付物：

- 保持相同的编写格式，但在需要时使用显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

当包覆盖率足够高后：

- 删除 `extensions/qa-lab/src/suite.ts` 中大部分特定场景的 TypeScript 分支逻辑

## Fake Slack / 富媒体支持

当前的 QA bus 以文本为主。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

当前 QA bus 支持：

- 文本
- 反应
- 线程

它尚未对内联媒体附件建模。

### 所需传输契约

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

然后将 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么先做通用模型

不要构建仅限 Slack 的媒体模型。

而应采用：

- 一个通用 QA 传输模型
- 其上支持多个渲染器
  - 当前的 QA Lab 聊天
  - 未来的 fake Slack web
  - 其他任何 fake transport 视图

这样可以避免重复逻辑，并让媒体场景保持与传输方式无关。

### 所需 UI 工作

更新 QA UI，以渲染：

- 内联图片预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已能渲染线程和反应，因此附件渲染应能叠加到相同的消息卡片模型上。

### 媒体传输将启用的场景工作

一旦附件可以通过 QA bus 流动，我们就能添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图片回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一块实现应当是：

1. 添加 Markdown 场景加载器 + zod schema
2. 从 Markdown 生成当前目录
3. 先迁移几个简单场景
4. 添加通用 QA bus 附件支持
5. 在 QA UI 中渲染内联图片
6. 然后扩展到音频和视频

这是能同时验证两个目标的最小路径：

- 通用、由 Markdown 定义的 QA
- 更丰富的 fake messaging 表面

## 未决问题

- 场景文件是否应允许嵌入带变量插值的 Markdown 提示词模板
- 设置/清理应作为命名区段存在，还是仅作为有序操作列表
- 产物引用在 schema 中应为强类型，还是基于字符串
- 自定义 handler 应放在一个统一注册表中，还是按 surface 分注册表
- 在迁移期间，生成的 JSON 兼容文件是否应继续保留为已检入状态
