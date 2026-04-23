---
read_when:
    - 重构 QA 场景定义或 qa-lab harness 代码
    - 在 Markdown 场景与 TypeScript harness 逻辑之间迁移 QA 行为
summary: QA 重构计划：场景目录与 harness 整合
title: QA 重构
x-i18n:
    generated_at: "2026-04-23T23:03:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d193f449764f9a5fde6c3655c9e16ac5f1d76624de43cd5fbf79a6b0ca7d986
    source_path: refactor/qa.md
    workflow: 15
---

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分裂定义模型迁移为单一事实来源：

- 场景元数据
- 发送给模型的提示
- 设置与清理
- harness 逻辑
- 断言与成功标准
- 工件与报告提示

期望的最终状态是：一个通用 QA harness 加载功能强大的场景定义文件，而不是在 TypeScript 中硬编码大多数行为。

## 当前状态

当前的主要事实来源位于 `qa/scenarios/index.md`，以及每个场景对应的单独文件
`qa/scenarios/<theme>/*.md`。

已实现：

- `qa/scenarios/index.md`
  - 规范的 QA 包元数据
  - 操作员身份
  - 启动任务
- `qa/scenarios/<theme>/*.md`
  - 每个场景一个 Markdown 文件
  - 场景元数据
  - handler 绑定
  - 场景特定的执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown 包解析器 + zod 校验
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 根据 Markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 注入生成的兼容性文件以及 `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - 通过 Markdown 定义的 handler 绑定选择可执行场景
- QA 总线协议 + UI
  - 用于图像/视频/音频/文件渲染的通用内联附件

仍然分裂的表面：

- `extensions/qa-lab/src/suite.ts`
  - 仍拥有大部分可执行自定义 handler 逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然根据运行时输出推导报告结构

因此，事实来源分裂问题已经修复，但执行层仍然主要由 handler 驱动，而不是完全声明式。

## 实际的场景表面是什么样子

阅读当前 suite 可以看出几类不同的场景。

### 简单交互

- 渠道基线
- 私信基线
- 线程后续跟进
- 模型切换
- 审批后续执行
- 反应/编辑/删除

### 配置与运行时变更

- 配置补丁 Skill 禁用
- 配置应用重启唤醒
- 配置重启能力翻转
- 运行时清单漂移检查

### 文件系统与仓库断言

- source/docs 发现报告
- 构建 Lobster Invaders
- 生成图像工件查找

### 记忆编排

- 记忆召回
- 渠道上下文中的记忆工具
- 记忆失败回退
- 会话记忆排序
- 线程记忆隔离
- memory Dreaming 扫测

### 工具与插件集成

- MCP plugin-tools 调用
- Skill 可见性
- Skill 热安装
- 原生图像生成
- 图像往返
- 从附件理解图像

### 多轮与多参与者

- 子智能体交接
- 子智能体扇出综合
- 重启恢复风格流程

这些类别很重要，因为它们决定 DSL 需求。仅靠“提示 + 期望文本”的平面列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 以及 `qa/scenarios/<theme>/*.md` 作为编写时的事实来源。

这个包应保持：

- 在评审中人类可读
- 机器可解析
- 足够丰富，能够驱动：
  - suite 执行
  - QA 工作区 bootstrap
  - QA Lab UI 元数据
  - docs/发现提示
  - 报告生成

### 推荐编写格式

以 Markdown 作为顶层格式，并在其中嵌入结构化 YAML。

推荐形状：

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider 覆盖
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

- 比巨大的 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格解析与 zod 校验

原始 JSON 仅可作为中间生成形式接受。

## 提议的场景文件形状

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

## DSL 必须覆盖的运行器能力

基于当前 suite，通用运行器需要的不只是提示执行。

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

### 文件与工件动作

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

## 变量与工件引用

DSL 必须支持保存输出并在后续引用。

来自当前 suite 的示例：

- 创建一个线程，然后复用 `threadId`
- 创建一个会话，然后复用 `sessionKey`
- 生成一张图像，然后在下一轮附加该文件
- 生成一个唤醒标记字符串，然后断言它稍后出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 面向路径、会话键、线程 id、标记、工具输出的类型化引用

如果没有变量支持，harness 就会继续把场景逻辑泄漏回 TypeScript。

## 哪些应该保留为逃生舱口

在第一阶段，实现一个完全纯粹的声明式运行器并不现实。

有些场景天生编排负担很重：

- memory Dreaming 扫测
- 配置应用重启唤醒
- 配置重启能力翻转
- 基于时间戳/路径的生成图像工件解析
- discovery-report 评估

这些场景目前应继续使用显式自定义 handler。

推荐规则：

- 85-90% 声明式
- 对剩余困难部分使用显式 `customHandler` 步骤
- 只允许命名且有文档的自定义 handler
- 场景文件中不允许匿名内联代码

这样既能保持通用引擎整洁，也能继续推进工作。

## 架构变更

### 当前

场景 Markdown 已经是以下内容的事实来源：

- suite 执行
- 工作区 bootstrap 文件
- QA Lab UI 场景目录
- 报告元数据
- 发现提示

生成的兼容性内容：

- 注入的工作区仍包含 `QA_KICKOFF_TASK.md`
- 注入的工作区仍包含 `QA_SCENARIO_PLAN.md`
- 注入的工作区现在也包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器与 schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/<theme>/*.md`
- 为具名 Markdown YAML 包内容添加了解析器
- 通过 zod 进行校验
- 将消费者切换到解析后的包
- 删除了仓库级 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

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

从主要由提示 + 等待 + 断言组成的场景开始：

- 线程后续跟进
- 从附件理解图像
- Skill 可见性与调用
- 渠道基线

交付物：

- 第一批真正通过通用引擎交付的 Markdown 定义场景

### 第 4 阶段：迁移中等复杂场景

- 图像生成往返
- 渠道上下文中的记忆工具
- 会话记忆排序
- 子智能体交接
- 子智能体扇出综合

交付物：

- 变量、工件、工具断言、请求日志断言得到验证

### 第 5 阶段：将困难场景保留在自定义 handler 上

- memory Dreaming 扫测
- 配置应用重启唤醒
- 配置重启能力翻转
- 运行时清单漂移

交付物：

- 相同的编写格式，但在需要时使用显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

当包覆盖率足够高之后：

- 删除 `extensions/qa-lab/src/suite.ts` 中大部分针对场景的 TypeScript 分支

## Fake Slack / 富媒体支持

当前 QA 总线是文本优先的。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

今天 QA 总线支持：

- 文本
- 反应
- 线程

它尚未建模内联媒体附件。

### 所需的传输契约

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
```

然后将 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么要先做通用层

不要构建一个仅限 Slack 的媒体模型。

而应采用：

- 一个通用 QA 传输模型
- 其上多个渲染器
  - 当前 QA Lab 聊天
  - 未来 fake Slack web
  - 其他任何 fake 传输视图

这样可以避免重复逻辑，并让媒体场景保持传输无关。

### 所需的 UI 工作

更新 QA UI 以渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件 chip

当前 UI 已经可以渲染线程和反应，因此附件渲染应叠加到同一消息卡片模型之上。

### 媒体传输启用后的场景工作

一旦附件能够通过 QA 总线流转，我们就可以添加更丰富的 fake-chat 场景：

- fake Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件顺序
- 保留媒体的线程回复

## 建议

下一块实现工作应当是：

1. 添加 Markdown 场景加载器 + zod schema
2. 从 Markdown 生成当前目录
3. 先迁移少量简单场景
4. 添加通用 QA 总线附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是能够同时验证两个目标的最小路径：

- 通用的 Markdown 定义 QA
- 更丰富的 fake 消息表面

## 开放问题

- 场景文件是否应允许嵌入带变量插值的 Markdown 提示模板
- 设置/清理应当是具名 section，还是仅作为有序动作列表
- 工件引用在 schema 中应采用强类型，还是基于字符串
- 自定义 handler 应放在单一注册表中，还是按 surface 划分注册表
- 在迁移期间，生成的 JSON 兼容文件是否应继续保留在版本控制中
